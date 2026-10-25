/* ============================================================
   CUIDAPP · Landing · main.js
   Módulo de UI: navegación, tema, revelado y formulario.
   ============================================================ */

(function () {
  "use strict";

  const root = document.documentElement;
  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));

  /* ------------------------------------------------------------
     1. Estado de la cabecera al hacer scroll
     ------------------------------------------------------------ */
  const header = $("#site-header");
  const onScroll = () => {
    header.classList.toggle("is-scrolled", window.scrollY > 8);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ------------------------------------------------------------
     1b. Botón volver arriba
     ------------------------------------------------------------ */
  const backToTop = $("#back-to-top");
  if (backToTop) {
    const toggleBack = () => backToTop.classList.toggle("is-visible", window.scrollY > 400);
    window.addEventListener("scroll", toggleBack, { passive: true });
    toggleBack();
    backToTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
  }

  /* ------------------------------------------------------------
     2. Menú móvil
     ------------------------------------------------------------ */
  const menuToggle = $("#menu-toggle");
  const mobileNav = $("#mobile-nav");

  const setMenu = (open) => {
    menuToggle.setAttribute("aria-expanded", String(open));
    menuToggle.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
    mobileNav.hidden = !open;
  };

  menuToggle.addEventListener("click", () => {
    setMenu(menuToggle.getAttribute("aria-expanded") !== "true");
  });

  $$(".mobile-nav__link, .mobile-nav .btn").forEach((link) => {
    link.addEventListener("click", () => setMenu(false));
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && menuToggle.getAttribute("aria-expanded") === "true") {
      setMenu(false);
      menuToggle.focus();
    }
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 1248) setMenu(false);
  });

  /* ------------------------------------------------------------
     3. Tema claro / oscuro (persistido)
     ------------------------------------------------------------ */
  const themeToggle = $("#theme-toggle");
  const THEME_KEY = "cuidapp-theme";

  const applyTheme = (theme) => {
    root.setAttribute("data-theme", theme);
    document.querySelector('meta[name="theme-color"]').setAttribute("content", theme === "dark" ? "#06110f" : "#0d9488");
  };

  themeToggle.addEventListener("click", () => {
    const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
    applyTheme(next);
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch (error) {
      /* El almacenamiento puede no estar disponible; se ignora. */
    }
  });

  /* ------------------------------------------------------------
     4. Revelado de elementos al entrar en viewport
     ------------------------------------------------------------ */
  const revealTargets = $$(".reveal");

  if ("IntersectionObserver" in window) {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );

    revealTargets.forEach((el) => revealObserver.observe(el));
  } else {
    revealTargets.forEach((el) => el.classList.add("is-visible"));
  }

  /* ------------------------------------------------------------
     5. Enlace activo según la sección visible
     ------------------------------------------------------------ */
  const navLinks = $$(".nav__link, .mobile-nav__link");
  const sections = navLinks
    .map((link) => document.querySelector(link.getAttribute("href")))
    .filter(Boolean);

  if ("IntersectionObserver" in window && sections.length > 0) {
    const sectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const id = `#${entry.target.id}`;
          navLinks.forEach((link) => link.classList.toggle("is-active", link.getAttribute("href") === id));
        });
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );

    sections.forEach((section) => sectionObserver.observe(section));
  }

  /* ------------------------------------------------------------
     6. Demo: pestañas, checklist ampliable y permisos
     ------------------------------------------------------------ */
  // Pestañas del móvil de la demo principal (las del recorrido --j tienen su propia lógica).
  const tabs = $$(".app-tab:not(.app-tab--j)");
  const screens = $$(".demo__stage .app-screen");

  const activateScreen = (name) => {
    screens.forEach((screen) => {
      const isActive = screen.id === `screen-${name}`;
      screen.classList.toggle("is-active", isActive);
      screen.setAttribute("aria-hidden", String(!isActive));
    });

    tabs.forEach((tab) => {
      const isActive = tab.dataset.screen === name;
      tab.classList.toggle("is-active", isActive);
      tab.setAttribute("aria-selected", String(isActive));
      tab.tabIndex = isActive ? 0 : -1;
    });
  };

  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => activateScreen(tab.dataset.screen));

    // Navegación con flechas dentro del tablist
    tab.addEventListener("keydown", (event) => {
      const offset = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
      if (!offset) return;
      event.preventDefault();
      const next = tabs[(index + offset + tabs.length) % tabs.length];
      next.focus();
      activateScreen(next.dataset.screen);
    });
  });

  // Rutina interactiva: marcar / desmarcar, añadir tareas nuevas (la familia
  // amplía el checklist) y quitar las personalizadas. Usa delegación de
  // eventos para que las tareas añadidas dinámicamente también respondan.
  const initRoutine = (list, options = {}) => {
    if (!list) return;
    const { bar, label, sub, subFormat, addBtn } = options;

    const update = () => {
      const items = $$(".app-task", list);
      const done = items.filter((task) => task.classList.contains("is-done")).length;
      if (bar) bar.style.width = `${Math.round((done / items.length) * 100)}%`;
      if (label) label.textContent = `${done} / ${items.length}`;
      if (sub && subFormat) sub.textContent = subFormat(done, items.length);
    };

    list.addEventListener("click", (event) => {
      const del = event.target.closest(".app-task__del");
      if (del) {
        del.closest("li").remove();
        update();
        return;
      }
      const task = event.target.closest(".app-task");
      if (task) {
        task.classList.toggle("is-done");
        update();
      }
    });

    // Muestras de tareas que la familia puede "añadir" en la demo.
    const MUESTRAS = [
      { nombre: "Comprar pan", hora: "09:00" },
      { nombre: "Regar las plantas", hora: "11:30" },
      { nombre: "Preparar la mochila del fisio", hora: "16:00" },
    ];
    let indice = 0;

    if (addBtn) {
      addBtn.addEventListener("click", () => {
        if (indice >= MUESTRAS.length) return;
        const muestra = MUESTRAS[indice++];
        const li = document.createElement("li");
        li.className = "app-task-li";
        li.innerHTML =
          '<button class="app-task" type="button">' +
          '<span class="app-task__check"><svg class="icon" aria-hidden="true"><use href="#i-check"></use></svg></span>' +
          "<span>" +
          `<span class="app-task__name">${muestra.nombre}</span>` +
          `<span class="app-task__time">${muestra.hora} · <span class="app-task__badge">personalizada</span></span>` +
          "</span>" +
          "</button>" +
          `<button class="app-task__del" type="button" aria-label="Quitar ${muestra.nombre} de la rutina">✕</button>`;
        list.append(li);
        // Muestras agotadas: el botón queda inactivo en lugar de repetir.
        if (indice >= MUESTRAS.length) addBtn.disabled = true;
        update();
      });
    }

    update();
  };

  initRoutine($("#app-tasks"), {
    bar: $("#app-progress-bar"),
    label: $("#app-progress-label"),
    sub: $("#app-routine-sub"),
    subFormat: (done, total) => `Carmen · ${done} de ${total} tareas hoy`,
    addBtn: $("#app-add-task"),
  });

  initRoutine($("#j-tasks"), {
    bar: $("#j-progress-bar"),
    label: $("#j-progress-label"),
    addBtn: $("#j-add-task"),
  });

  // Permisos de "Mi cuidador": interruptores conmutables (role="switch").
  $$(".app-switch-row").forEach((row) => {
    row.addEventListener("click", () => {
      const activo = row.getAttribute("aria-checked") === "true";
      row.setAttribute("aria-checked", String(!activo));
    });
  });

  /* ------------------------------------------------------------
      7. Recorrido familiar · pasos, paneles y pantallas
      ------------------------------------------------------------ */
  const journeySteps = $$(".journey__step");
  const journeyPanels = $$(".journey-panel");
  const journeyScreens = $$(".app-screen--j");
  const journeyCounter = $("#journey-counter");
  const journeyPrev = $("#journey-prev");
  const journeyNext = $("#journey-next");
  // Barra de pestañas del recorrido (Inicio · Buscar · Rutina · Mi cuidador).
  const journeyTabs = $$(".app-tab--j");
  // Cada paso se asocia a la pestaña que se ilumina: 0 Inicio · 1 Buscar · 2 Rutina · 3 Mi cuidador.
  const TAB_POR_PASO = [0, 0, 1, 3, 1, 2, 2, 2];

  let journeyIndex = 0;

  const activateJourney = (index) => {
    const total = journeySteps.length;
    journeyIndex = Math.max(0, Math.min(total - 1, index));

    journeySteps.forEach((step, stepIndex) => {
      const isActive = stepIndex === journeyIndex;
      step.classList.toggle("is-active", isActive);
      step.setAttribute("aria-selected", String(isActive));
      step.tabIndex = isActive ? 0 : -1;
    });

    journeyPanels.forEach((panel, panelIndex) => {
      const isActive = panelIndex === journeyIndex;
      panel.hidden = !isActive;
      panel.classList.toggle("is-active", isActive);
    });

    journeyScreens.forEach((screen, screenIndex) => {
      screen.classList.toggle("is-active", screenIndex === journeyIndex);
    });

    // La barra de pestañas del recorrido refleja el paso visible.
    journeyTabs.forEach((tab, tabIndex) => {
      tab.classList.toggle("is-active", tabIndex === TAB_POR_PASO[journeyIndex]);
    });

    journeyCounter.textContent = `Paso ${journeyIndex + 1} de ${total}`;
    journeyPrev.disabled = journeyIndex === 0;
    journeyNext.disabled = journeyIndex === total - 1;
  };

  journeySteps.forEach((step, index) => {
    step.addEventListener("click", () => activateJourney(index));

    // Navegación con flechas dentro de la lista de pasos
    step.addEventListener("keydown", (event) => {
      const offset =
        event.key === "ArrowDown" || event.key === "ArrowRight"
          ? 1
          : event.key === "ArrowUp" || event.key === "ArrowLeft"
            ? -1
            : 0;
      if (!offset) return;
      event.preventDefault();
      const next = journeySteps[(index + offset + journeySteps.length) % journeySteps.length];
      next.focus();
      activateJourney(journeySteps.indexOf(next));
    });
  });

  journeyPrev.addEventListener("click", () => activateJourney(journeyIndex - 1));
  journeyNext.addEventListener("click", () => activateJourney(journeyIndex + 1));

  // Los tabs del recorrido saltan al paso asociado (Inicio 01 · Buscar 03 · Mi cuidador 04 · Rutina 06).
  journeyTabs.forEach((tab) => {
    tab.addEventListener("click", () => activateJourney(Number(tab.dataset.paso)));
  });

  activateJourney(0);

  // El progreso de las rutinas (pantallas 06 y demo) lo gestiona initRoutine.

  /* ------------------------------------------------------------
      10. Formulario de acceso anticipado
      ------------------------------------------------------------ */
  const form = $("#cta-form");
  const success = $("#form-success");

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const input = $("#email", form);

    if (!input.value || !input.checkValidity()) {
      input.focus();
      input.style.borderColor = "var(--accent-500)";
      return;
    }

    input.style.borderColor = "";
    success.hidden = false;
    form.reset();
  });

  form.addEventListener("input", () => {
    $("#email", form).style.borderColor = "";
    if (!success.hidden) success.hidden = true;
  });

  /* ------------------------------------------------------------
     9. CRM familiar · envío del cuidador y panel de registros
     ------------------------------------------------------------ */
  const crmEnviar = $("#crm-enviar");
  const crmPacientes = $("#crm-pacientes");
  const crmStatTotal = $("#crm-stat-total");
  const crmStatActivos = $("#crm-stat-activos");
  const crmStatPendientes = $("#crm-stat-pendientes");
  const CRM_KEY = "cuidapp-crm-registros";

  const urgenciaStatus = (u) => u === "alta" ? "revision" : u === "media" ? "pendiente" : "activo";
  const urgenciaLabel = (u) => u === "alta" ? "Revisión" : u === "media" ? "Pendiente" : "Activo";
  const urgenciaClass = (s) => `crm__status--${s}`;

  let registros = [];
  try {
    const stored = localStorage.getItem(CRM_KEY);
    if (stored) registros = JSON.parse(stored);
  } catch (e) { /* ignora */ }

  const renderCRM = () => {
    if (!crmPacientes) return;
    crmPacientes.innerHTML = "";

    if (registros.length === 0) {
      crmPacientes.innerHTML =
        '<div class="crm__empty">' +
        '<svg class="icon" aria-hidden="true"><use href="#i-clipboard"></use></svg>' +
        '<p>Sin registros todavía. Envía el primer dato desde el formulario.</p>' +
        "</div>";
    } else {
      registros.slice().reverse().forEach((r, i) => {
        const status = urgenciaStatus(r.urgencia);
        const el = document.createElement("div");
        el.className = `crm__patient crm__patient--new`;
        el.style.setProperty("--crm-delay", `${i * 80}ms`);
        el.innerHTML =
          '<span class="crm__avatar">' + r.iniciales + "</span>" +
          '<div class="crm__patient__info">' +
          '<p class="crm__patient__name">' + escapeHtml(r.cuidador) + " · " + escapeHtml(r.paciente) + "</p>" +
          '<p class="crm__patient__role">' + r.atencion + "</p>" +
          "</div>" +
          '<div class="crm__patient__meta">' +
          '<strong>' + r.fecha + "</strong>" +
          '<span>Turno · ' + r.urgencia.toLowerCase() + "</span>" +
          "</div>" +
          '<span class="crm__status ' + urgenciaClass(status) + '">' + urgenciaLabel(r.urgencia) + "</span>";
        crmPacientes.appendChild(el);
      });
    }

    if (crmStatTotal) crmStatTotal.textContent = registros.length;
    if (crmStatActivos) crmStatActivos.textContent = registros.filter(r => urgenciaStatus(r.urgencia) === "activo").length;
    if (crmStatPendientes) crmStatPendientes.textContent = registros.filter(r => urgenciaStatus(r.urgencia) !== "activo").length;
  };

  const escapeHtml = (t) => {
    const d = document.createElement("div");
    d.textContent = t;
    return d.innerHTML;
  };

  const iniciales = (n) => n.split(" ").map(p => p[0]).join("").toUpperCase().slice(0, 2) || "??";

  if (crmEnviar) {
    crmEnviar.addEventListener("click", () => {
      const cuidador = $("#crm-cuidador");
      const paciente = $("#crm-paciente");
      const atencion = $("#crm-atencion");
      const fecha = $("#crm-fecha");
      const observaciones = $("#crm-observaciones");
      const urgencia = $("#crm-urgencia");

      if (!cuidador.value || !paciente.value || !atencion.value || !fecha.value || !urgencia.value) {
        [cuidador, paciente, atencion, fecha, urgencia].forEach((f) => {
          if (!f.value) f.style.borderColor = "var(--accent-500)";
        });
        return;
      }

      const registro = {
        id: Date.now(),
        cuidador: cuidador.value.trim(),
        paciente: paciente.value.trim(),
        atencion: atencion.value,
        fecha: new Date(fecha.value).toLocaleString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }),
        observaciones: observaciones.value.trim(),
        urgencia: urgencia.value,
        creado: Date.now(),
      };

      registros.unshift(registro);
      try { localStorage.setItem(CRM_KEY, JSON.stringify(registros)); } catch (e) { /* ignora */ }

      [cuidador, paciente, atencion, fecha, observaciones, urgencia].forEach((f) => {
        f.style.borderColor = "";
        if (f.tagName === "TEXTAREA" || f.tagName === "INPUT") f.value = "";
        if (f.tagName === "SELECT") f.selectedIndex = 0;
      });

      renderCRM();
    });
  }

  renderCRM();
})();
