# Auditoría · UX/UI + deuda técnica (landing y app móvil)

- **Fecha:** 23/10/2026 · commit base `5abbb12` · **árbol de trabajo SUCIO** (53 archivos sin confirmar, ver TD-1).
- **Método:** medición real, no lectura de código. Landing servida en `localhost:8123` y app Expo web en `localhost:8125`, ambas medidas en navegador con `axe`/Lighthouse y guiones propios de contraste, objetivos táctiles y desbordes. Verificación en **tema claro y oscuro**.
- **Verificaciones automáticas:** `tsc --noEmit` ✅ 0 errores · `eslint .` ✅ 0 errores/avisos · `jest` ✅ **130/130** en 13 suites · `expo-doctor` ❌ **19/21** · `check-release preview/production` ❌ **exit 1**.

---

## 0. Resumen ejecutivo

| | Veredicto |
|---|---|
| **Landing · UX/UI** | **Aprobada con reparaciones.** Interacción impecable (0 errores de consola, menú/tema/tabs/recorrido/formulario verificados uno a uno), responsive sin desborde a 360 px, semántica rica (skip-link, `role="tablist"`, `aria-live`, `prefers-reduced-motion`). **Pero falla AA en contraste de forma sistemática** (Lighthouse accesibilidad **0.81**) y su patrón ARIA del recorrido es inválido. |
| **App · UX/UI** | **Mejor que la landing en contraste** (0 fallos de contraste en 9 pantallas medidas; los tokens de `theme.ts` están testeados). Los problemas son de **detalle y de comportamiento**: parpadeo de estado vacío, copy con mayúsculas mal puestas, objetivos táctiles pequeños y **no hay ni un `<h1>` por sección** en Inicio/Buscar/Cuidador. |
| **Deuda técnica** | **3 asuntos bloqueantes**, todos de despliegue/higiene y no de arquitectura: hay **53 archivos sin confirmar** (incluidos todos los tests y los sprints A/B/C), **no se puede construir `preview`/`production`**, y `expo-doctor` está en rojo. El código en sí está limpio: 0 `any`, 0 `TODO`, 2 colores hardcodeados en 7 500 líneas. |

**Lo que sí está bien y no debe tocarse:** design system con tokens y tests de contraste (`theme.test.ts`), estados de carga/error/vacío en todos los componentes UI, 130 tests verdes, `tsc` y `eslint` limpios, tipado estricto, textos centralizados, Inter + iconografía Lucide, y una landing sin desborde horizontal.

---

## 1. Landing · UX/UI

### 1.1 Lo verificado y en orden

| Comprobación | Resultado |
|---|---|
| Errores de consola (sesión completa) | ✅ **0** |
| Desborde horizontal a 360 px | ✅ `scrollWidth 341 = clientWidth 341` |
| Menú móvil (abrir/cerrar/Escape) | ✅ `aria-expanded` sincronizado, cierra con Escape y devuelve el foco |
| Tema claro/oscuro persistido | ✅ alterna, persiste en `localStorage` y actualiza `theme-color` |
| Tabs de la demo | ✅ `aria-selected`, `aria-hidden` y `tabIndex` roving correctos |
| Recorrido (8 pasos) | ✅ contador, paneles, `hidden` y tab asociada (`TAB_POR_PASO`) correctos |
| Checklist ampliable | ✅ añade 3 tareas, actualiza barra y subtítulo, deshabilita el botón al agotarse |
| Formulario CTA | ✅ valida, enfoca el campo y muestra `role="status"` |
| SEO / Best practices (Lighthouse) | ✅ **1.0 / 1.0** |

### 1.2 P1 · Contraste AA sistemático (Lighthouse accesibilidad **0.81**)

**Causa raíz: la landing usa `--primary-600` (`#0d9488`) como color de acción sobre fondo claro, que da 3.74:1 con texto blanco.** La app, en cambio, eligió deliberadamente `--primary-700` (`#0F766E`) por eso mismo (`theme.ts:14-16`). Las dos piezas del mismo producto parten de premisas de contraste distintas.

Fallo medido por `axe` (tema claro), agrupado por causa:

| Selector | Color / fondo | Ratio | Requisito |
|---|---|---|---|
| `.btn--primary` (CTA principal, 14 px bold) | `#fff` sobre `#0d9488` | **3.74** | 4.5 |
| `.app-btn--primary`, `.app-tab` activa | `#fff` / `#0d9488` sobre `#fff` | **3.74** | 4.5 |
| `.app-card__link` | `#0d9488` sobre `#fff` | **3.74** | 4.5 |
| `.eyebrow` (12 px bold) ×5 | `#0d9488` sobre `#f7faf9`/`#edf4f2` | **3.35–3.56** | 4.5 |
| `.journey-panel__kicker`, `.app-link`, `.requirement__num` | `#0d9488` | **3.56** | 4.5 |
| `.eyebrow--accent` | `#d97706` sobre `#f7faf9` | **3.03** | 4.5 |
| **`.step__num`** (números 01–04, 26 px) | `#5eead4` sobre `#f7faf9` | **1.40** | 3.0 |
| `.app-header__sub`, `.app-field__label`, `.app-card__meta`, `.app-tab` inactiva, `.quote__cite` | `#647d79` (`--ink-3`) | **4.20–4.41** | 4.5 |
| `.site-footer__bottom` | `#6e7d7a` sobre `#0a1a18` | **4.15** | 4.5 |

`--ink-3: #647d79` se queda en **4.41:1**: es un fallo técnico de 0.09, pero afecta a muchísimo texto secundario de la maqueta y es el más barato de arreglar.

**Tema oscuro (medido aparte):**
- `.skip-link` → **1.86:1** (`#fff` sobre `--primary-400 #2dd4bf`). Es el enlace de salto para teclado/lector de pantalla: el primer elemento accesible de la página es ilegible en oscuro.
- `.step__num` en oscuro usa `--primary-700` sobre `#06110f` → 3.5:1, cumple para texto grande, pero es la única regla del tema oscuro que pisa a mano un token de la escala (`how.css:34`).

**Arreglo recomendado:** subir el fondo de los botones a `--primary-700` en claro (ya lo hace la app) o bajar el texto a `--ink-onPrimary` sobre `--primary-800`; `--ink-3` → `#5b716d` o similar; `.step__num` claro → `--primary-600`/`700`; `--skip-link` en oscuro → texto `--ink-inverse` sobre `--primary-700`.

### 1.3 P1 · Patrón ARIA del recorrido inválido (3 reglas axe)

`landing/index.html:827` pone `role="tablist"` sobre un `<ol>` cuyos hijos son `<li>` con un `<button role="tab">` dentro. Eso rompe a la vez:

- `aria-required-children` — un `tablist` exige hijos `tab`, no `li`.
- `aria-required-parent` — los 8 `button[role="tab"]` no tienen padre `tablist` (su padre real es el `li`).
- `listitem` — los `li` pierden su semántica de lista porque el padre ya no es `list`.

Un lector de pantalla no puede recorrer el recorrido con la navegación por pestañas. **Arreglo en una línea:** añadir `role="presentation"` a `li.journey__item` (el `li` deja de romper el árbol ARIA y el `button` queda hijo directo conceptual del `tablist`), o pasar la lista a `<div role="tablist">`.

### 1.4 P2 · Jerarquía de encabezados del pie

`h4.footer__title` (`index.html:1891,1902`) salta de `h2` a `h4` tras la sección CTA → `heading-order`. Cambiar a `h3`.

### 1.5 P2 · Objetivos táctiles < 44 px en móvil

Medido a 360 px (21 elementos):

| Elemento | Medida |
|---|---|
| **Enlaces del pie** (Cómo funciona, Recorrido, Modelo…) | **17 px de alto** |
| `.brand`, `.theme-toggle`, `.menu-toggle` | 36 px |
| `.skip-link` | 39 px |
| `.app-tab` (demo) | 40 px |
| `.journey__ctrl` (Anterior/Siguiente) | 43 px |

Los enlaces del pie a 17 px son el problema real (WCAG 2.5.8 pide 24 px mínimo, Material/Apple 44); el resto está en el margen. Los toggles del header son el segundo elemento interactivo del sitio y quedan por debajo de 44.

### 1.6 P3 · Rendimiento y datos abiertos

- **8 elementos `.reveal` quedan fuera del viewport** con `IntersectionObserver` en frío: si el observador no dispara (p. ej. `content-visibility` o un navegador con IO degradado) no se ven. Hay fallback para el caso sin IO, correcto.
- **Sin `og:image` ni `canonical`** (`og:title`/`og:description` sí están). Al compartir en WhatsApp/LinkedIn aparece sin imagen — relevante para una landing de captación.
- **`index.html` pesa 119 KB** y el CSS acumulado 84 KB sin minificar ni `preload`; es una demo interna, así que es aceptable, pero si la landing sale a producción conviene un paso de build.
- Google Fonts se carga con `display=swap` y `preconnect` ✅.

---

## 2. App móvil · UX/UI

### 2.1 Lo verificado y en orden

9 rutas medidas en Expo web (login, Inicio, Buscar, Rutina, Mi cuidador, Perfil, Informes, Selección, `/cuidado/nuevo`, `/ayuda`, `/cuenta`):

| Comprobación | Resultado |
|---|---|
| Contraste en las 9 pantallas (tema claro) | ✅ **0 fallos** en 103+ nodos de texto medidos |
| Errores de consola | ✅ **0** (solo avisos informativos de Metro) |
| Pantalla de login | ✅ 11 nodos, todos AA, foco y errores bien ubicados |
| Informes | ✅ cifras honestas: adherencia semanal en fracción real (5/5, 4/5, 2/5), valoración derivada de reseñas, incidencia resoluble |
| Mi cuidador | ✅ acuerdos, permisos con `Switch` y `accessibilityLabel` |
| `/cuenta` | ✅ miembros, criterios de búsqueda, chips de franja |

### 2.2 P1 · La Rutina enseña «Sin tareas hoy» mientras carga (parpadeo)

**Reproducido y medido.** Al navegar a `/rutina`, la pantalla muestra durante **3 frames** el estado vacío falso:

```
0 / 0 · Tareas de hoy · Sin tareas hoy · «Las tareas se configuran desde el perfil…»
```

…y solo después aparece `2 / 5` con las 5 tareas reales. En el almacén hay 5 tareas diarias para `per_1` (verificado en `localStorage['cuidapp.demo_data.v4']`), así que el contenido es correcto; **el estado vacío se pinta antes de tiempo**.

**Causa raíz:** `use-rutina.ts:121` expone `cargando` (`tareas.isLoading || registros.isLoading || incidencias.isLoading`) y **ninguna pantalla lo lee**:

- `(tabs)/rutina.tsx:42` usa `isLoading` de `usePerfilActivo` (la lista de perfiles), no el de la rutina → los perfiles llegan, la pantalla decide «ya puedo pintar», y las tareas siguen en vuelo.
- `(tabs)/index.tsx` (Inicio) tampoco lo usa, pero ahí no se ve porque el valor 0/0 no se muestra igual.

**Impacto:** en un producto de cuidado, «Sin tareas hoy» con una persona a cargo es un mensaje alarmante que aparece y desaparece solo. Además `EmptyState` no tiene `accessibilityLiveRegion`, así que un lector de pantalla lo anuncia y luego se contradice.

**Arreglo:** usar `rutina.cargando` en `(tabs)/rutina.tsx` (mismo `Skeleton` que ya existe en la rama `isLoading`) antes de pintar el `ProgressBar` y el `EmptyState`.

### 2.3 P1 · Copy con mayúsculas mal colocadas e inconsistencia entre pantallas

`(tabs)/index.tsx:254` aplica `textTransform: 'capitalize'` a la fecha:

- **Inicio** → «Viernes, **23 De Octubre**» ❌
- **Rutina** (`rutina.tsx:36`, `toLocaleDateString` sin transformar) → «viernes, 23 de octubre» ✅

La misma fecha se escribe de dos formas en dos pestañas vecinas, y la de Inicio capitaliza la preposición «De», que en español va en minúscula. Es el texto más grande tras el saludo.

**Arreglo:** quitar `textTransform: 'capitalize'` de `styles.fecha` y normalizar el formato en `utils/format.ts` (que ya tiene `formatearFechaHora`), usándolo en ambas pantallas.

### 2.4 P1 · Estructura de encabezados ausente en 3 pantallas

Medido por DOM real:

| Pantalla | `<h1>`/`role="heading"` |
|---|---|
| Inicio | **1** (solo «Hola, Ana») — «Rutina de hoy», «Informes», «Continuar el recorrido» **no son encabezados** |
| Buscar | **0** |
| Mi cuidador | **1** (título) — «Vuestros acuerdos», «Qué puede ver y hacer» no lo son |
| Informes / Ayuda / Cuenta | ✅ correcto |

Un lector de pantalla no puede saltar entre secciones de la portada, que es la pantalla que más se usa. `SectionHeader` renderiza `ThemedText` sin `accessibilityRole="header"` — un solo cambio en ese componente lo arregla en toda la app.

### 2.5 P2 · Objetivos táctiles por debajo de 44 pt

| Pantalla | Elemento | Medida |
|---|---|---|
| **`/cuidador`** | los 5 interruptores de permisos (`Switch` de React Native) | **20 px de alto** |
| **`/cuenta`** | «Quitar a Luis/Elena/Marta de la familia» (acción **destructiva**) | **21 × 29 px** |
| Perfil, Mi cuidador, Inicio | botones secundarios («Editar datos», «Ver planes», «Ver rutina completa») | 40 px |
| `/cuidado/nuevo`, `/cuenta` | chips de género, tipo de atención, franjas | 40 px |

Los dos primeros son los que importan: un interruptor de permisos clínicos a 20 px y un botón de borrar miembro a 21 px. El `Switch` de RN no crece con `minHeight`; hay que envolverlo en una fila `Pressable` de 44 pt o usar `hitSlop`.

### 2.6 P2 · Tema oscuro no verificado en navegador (deuda de proceso)

`userInterfaceStyle: "automatic"` está bien configurado y `theme.ts` tiene el tema oscuro completo con tokens, pero **`+html.tsx` no declara `color-scheme` ni `prefers-color-scheme`**, así que en web la app no sigue el tema del sistema ni siquiera forzando el emulador. Los contrastes del tema oscuro (`#2DD4BF` sobre `#0B1211`, `#9BABA8` sobre `#16201F`) están cubiertos por `theme.test.ts`, pero **ninguna pantalla oscura se ha medido en navegador**. Añadir `color-scheme` en `+html.tsx` permitiría auditarlo.

### 2.7 P3 · Detalles menores

- **«Mostrar contraseña»** en login: 28 × 48 px (cumple 2.5.8, no 44 pt).
- **`(tabs)/_layout.tsx:1`** importa `Tabs` de `'expo-router/js-tabs'`: subpath no documentado en SDK 57 (ya anotado en el diagnóstico previo, sigue abierto).
- **Icono nativo Android** (`NativeTabs` con `md` Material) sigue en relleno mientras la app usa Lucide lineal: desviación conocida de la guía visual, pendiente de resolver con `src` custom.

---

## 3. Deuda técnica

### TD-1 · 🔴 53 archivos sin confirmar, incluidos todos los tests

```
41 modificados · 12 sin seguir (nuevos)
```

Incluye **`DIAGNOSTICO-APP.md`, las 13 suites de tests (130 tests), `adherencia.ts`, `textos.ts`, `profile-card.tsx`** y el trabajo completo de los sprints A, B y C. Todo el remediado de los P0/P1/P2 está solo en disco: un fallo de disco o un `git checkout` inadvertido borra semanas de trabajo y deja la app sin la red de seguridad que ya tiene.

El propio `DIAGNOSTICO-APP.md:4` afirma «árbol de trabajo limpio», lo cual ya no es cierto.

**Acción:** confirmar por temas (`fix(rutina)`, `test(...)`, `feat(informes)`, `docs(diagnostico)`) antes de cualquier otra cosa.

### TD-2 · 🔴 No se puede construir para distribución

```
$ node scripts/check-release.js apk        → OK (demo)
$ node scripts/check-release.js preview    → ❌ exit 1
$ node scripts/check-release.js production → ❌ exit 1

EXPO_PUBLIC_API_URL no está definida para el perfil "preview".
```

`eas.json` declara `environment` por perfil pero no la URL del backend en ninguno. La guarda funciona correctamente (falla con mensaje accionable, que es lo que se arregló en el sprint A), pero **hoy no existe ningún build distribuible**. Es el bloqueante real del proyecto.

### TD-3 · 🔴 `expo-doctor` en rojo (19/21)

```
✖ expo         ~57.0.31  encontrado 57.0.30
✖ expo-router  ~57.0.29  encontrado 57.0.28
✖ React Native Directory — fallo del servidor (transitorio)
```

Dos parches sin aplicar. `npx expo install --check` / `--fix` lo resuelve; el fallo del directorio es de red.

### TD-4 · 🟠 Cobertura de tests: 130 tests, ninguno de pantalla

`jest.config.js:10` excluye `!src/app/**` de la cobertura. Los 130 tests cubren utils, store y hooks — capas que están en buen estado. Pero **el parpadeo de §2.2 es exactamente el tipo de bug que un test de pantalla cazaría**, y no hay ninguno. `@testing-library/react-native` ya está instalado y `task-item.test.tsx` demuestra que funciona.

### TD-5 · 🟠 Raíz del repo inconsistente

- **`package.json` raíz = `{}`** — archivo vacío.
- **`package-lock.json` raíz de 613 KB** — huérfano, sin `package.json` que lo respalde (restaurado en `1e6a047`).
- **No hay `.github/`** — ningún CI. `tsc`, `eslint`, `jest` y `expo-doctor` se ejecutan a mano y a veces quedan rojos sin que nadie lo vea.

### TD-6 · 🟡 Assets muertos en `mobile/assets/images` (≈ 470 KB)

Sin ninguna referencia en `app.json` ni en `src`:

| Archivo | Peso |
|---|---|
| `logo-glow.png` | 331 KB |
| `tutorial-web.png` | 59 KB |
| `react-logo.png` / `@2x` / `@3x` | 44 KB |
| `expo-logo.png`, `expo-badge.png`, `expo-badge-white.png` | 12 KB |

`icon.png` (799 KB) sí se usa pero es una fuente enorme para un icono; comprimirla reduce el peso del repo. Lo anterior es de la plantilla Expo, se puede borrar sin riesgo.

### TD-7 · 🟢 Calidad del código — sin deudas significativas

Verificado por barrido sobre `mobile/src` y `landing/`:

| Indicador | Resultado |
|---|---|
| `TODO` / `FIXME` / `HACK` | **0** |
| `any` / `as any` | **0** (los 2 `as unknown as` son en archivos de test, uso legítimo de mocks) |
| `console.log` / `debugger` | **0** |
| `@ts-ignore` | **0** |
| `eslint-disable` | **3**, todos justificados (`react-hook-form` `watch()` no es memoizable) |
| Colores hardcodeados fuera de tokens | **2** en 7 500 líneas (`'#fff'` en `ayuda.tsx:119`, `'#000'` en `toast.tsx:92` para la sombra) |
| Duplicación de lógica | Resuelta: `profile-card.tsx` y `constants/textos.ts` eliminaron las duplicaciones del diagnóstico previo |

---

## 4. Plan de acción priorizado

### P0 · Antes de nada (~30 min)

1. **TD-1** — Confirmar los 53 archivos por temas. Nada de lo demás tiene sentido si este trabajo puede perderse.

### P1 · Sprints cortos

| # | Qué | Dónde | Esfuerzo |
|---|---|---|---|
| 1 | **TD-2** Definir `EXPO_PUBLIC_API_URL` por entorno en EAS | `eas.json` / `eas env:set` | 30 min |
| 2 | **TD-3** `npx expo install --fix` | — | 5 min |
| 3 | §2.2 Usar `rutina.cargando` antes de pintar el estado vacío | `(tabs)/rutina.tsx:42` | 30 min + 1 test |
| 4 | §1.2 Botones y acentos a `--primary-700`; `--ink-3` más oscuro | `landing/css/tokens.css`, `buttons.css`, `hero.css` | 1 h |
| 5 | §1.3 `role="presentation"` en `li.journey__item` | `landing/index.html:828-893` | 15 min |
| 6 | §2.3 Quitar `capitalize` y unificar la fecha | `(tabs)/index.tsx:254`, `utils/format.ts` | 30 min |
| 7 | §2.4 `accessibilityRole="header"` en `SectionHeader` | `components/ui/section-header.tsx` | 15 min |

### P2 · Pulido

8. §2.5 Objetivos táctiles: fila `Pressable` 44 pt para los `Switch` de `/cuidador` y para «Quitar miembro» de `/cuenta`.
9. §1.4 `h4` → `h3` en el pie · §1.5 toggles del header y enlaces del pie a 44 px.
10. §1.6 `og:image` + `canonical` en la landing.
11. §2.6 `color-scheme` en `+html.tsx` y auditoría del tema oscuro en navegador.
12. **TD-4** Un test de pantalla para la rutina (bloquearía la regresión de §2.2).
13. **TD-5** Borrar el `package-lock.json` raíz (o darle un `package.json` real) y añadir un CI con `tsc` + `eslint` + `jest`.

### P3 · Cuando toque

14. **TD-6** Borrar los assets muertos y comprimir `icon.png`.
15. Resolver el icono nativo de Android (Lucide `src` custom en `NativeTabs`).
16. Paso de build/minificado para la landing si sale a producción.

---

## Anexo · Reproducir los hallazgos

```bash
# Landing
cd landing && python serve.py 8123
# → http://localhost:8123 · Lighthouse accesibilidad 0.81
# → axe: color-contrast (12 grupos), aria-required-children/parent, heading-order, listitem

# App
cd mobile && npx expo start --web --port 8125
# → entrar con cualquier correo → /rutina → ver "Sin tareas hoy" 3 frames antes de "2 / 5"
# → Inicio: "Viernes, 23 De Octubre"  vs  /rutina: "viernes, 23 de octubre"

# Deuda técnica
cd mobile && npx expo-doctor                 # 19/21
cd mobile && node scripts/check-release.js preview   # exit 1
git status --short | Measure-Object -Line          # 53 archivos
```
