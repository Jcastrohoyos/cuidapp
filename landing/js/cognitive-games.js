(function () {
  "use strict";

  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));

  const make = (tag, className, html) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (html !== undefined) node.innerHTML = html;
    return node;
  };

  const svgIcon = (id, className = "icon") => `<svg class="${className}" aria-hidden="true"><use href="#${id}"></use></svg>`;

  const shuffle = (items) => {
    const copy = items.slice();
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      const swap = copy[i];
      copy[i] = copy[j];
      copy[j] = swap;
    }
    return copy;
  };

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const clock = (seconds) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

  const createTimer = (onTick) => {
    const state = { seconds: 0, handle: null };
    return {
      start() {
        if (state.handle) return;
        state.handle = setInterval(() => {
          state.seconds += 1;
          onTick(state.seconds);
        }, 1000);
      },
      stop() {
        if (state.handle) clearInterval(state.handle);
        state.handle = null;
      },
      get seconds() {
        return state.seconds;
      }
    };
  };

  const LEVELS = {
    facil: { id: "facil", label: "Fácil", memoryPairs: 4, memoryLimit: 150, seqStart: 2, seqMax: 4, mathMax: 10, mathLives: 4, maze: 5, linkPairs: 3, rounds: 4, options: 3 },
    normal: { id: "normal", label: "Normal", memoryPairs: 6, memoryLimit: 120, seqStart: 3, seqMax: 5, mathMax: 25, mathLives: 3, maze: 7, linkPairs: 4, rounds: 5, options: 3 },
    dificil: { id: "dificil", label: "Difícil", memoryPairs: 8, memoryLimit: 90, seqStart: 4, seqMax: 6, mathMax: 60, mathLives: 3, maze: 9, linkPairs: 5, rounds: 6, options: 4 }
  };

  let audioContext = null;

  const getAudio = () => {
    if (!audioContext) {
      const AudioCtor = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtor) return null;
      audioContext = new AudioCtor();
    }
    if (audioContext.state === "suspended") audioContext.resume();
    return audioContext;
  };

  const tone = (frequency, duration, shape, volume) => {
    const ctx = getAudio();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const length = duration || 0.32;
    osc.type = shape || "sine";
    osc.frequency.value = frequency;
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(volume || 0.1, ctx.currentTime + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + length);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + length + 0.05);
  };

  const MEMORY_ICONS = ["i-heart","i-sparkles","i-star","i-bell","i-clock","i-map-pin","i-droplet","i-activity"];

  const createMemory = (host, ctx) => {
    const pairs = Math.min(ctx.level.memoryPairs, MEMORY_ICONS.length);
    const icons = shuffle(MEMORY_ICONS).slice(0, pairs);
    const deck = shuffle(icons.concat(icons));

    const grid = make("div", "cog-grid cog-grid--memory");
    grid.id = "cog-grid";
    grid.setAttribute("role", "group");
    grid.setAttribute("aria-label", "Tablero de memoria");
    host.appendChild(grid);

    const state = { first: null, second: null, lock: false, moves: 0, matched: 0, seconds: 0, over: false, status: "Encuentra todas las parejas" };
    const limit = ctx.level.memoryLimit;

    const timer = createTimer(() => {
      if (state.seconds >= limit) {
        state.over = true;
        state.lock = true;
        state.status = "Se agotó el tiempo. Reinicia para volver a intentarlo.";
        timer.stop();
      }
      ctx.refresh();
    });

    const startTimer = () => timer.start();

    const flip = (card) => {
      if (state.over || state.lock) return;
      if (card.classList.contains("is-flipped") || card.classList.contains("is-matched")) return;
      startTimer();
      card.classList.add("is-flipped");
      if (!state.first) {
        state.first = card;
        ctx.refresh();
        return;
      }
      state.second = card;
      state.lock = true;
      state.moves += 1;
      ctx.refresh();
      if (state.first.dataset.value === state.second.dataset.value) {
        state.first.classList.add("is-matched");
        state.second.classList.add("is-matched");
        state.matched += 1;
        state.first = null;
        state.second = null;
        state.lock = false;
        if (state.matched === pairs) {
          state.over = true;
          timer.stop();
          state.status = `¡Completado en ${state.moves} movimientos!`;
          ctx.report(state.moves, pairs);
        }
        ctx.refresh();
      } else {
        setTimeout(() => {
          if (state.first) state.first.classList.remove("is-flipped");
          if (state.second) state.second.classList.remove("is-flipped");
          state.first = null;
          state.second = null;
          state.lock = false;
          ctx.refresh();
        }, 900);
      }
    };

    deck.forEach((icon) => {
      const card = make("button", "cog-card");
      card.type = "button";
      card.dataset.value = icon;
      card.setAttribute("aria-label", "Carta oculta");
      card.innerHTML = `<span class="cog-card__inner"><span class="cog-card__face cog-card__face--front">?</span><span class="cog-card__face cog-card__face--back">${svgIcon(icon)}</span></span>`;
      card.addEventListener("click", () => flip(card));
      grid.appendChild(card);
    });

    return {
      stats: () => [
        { value: String(state.moves), label: "movimientos" },
        { value: `${state.matched}/${pairs}`, label: "parejas" },
        { value: `${clock(state.seconds)}/${clock(limit)}`, label: "tiempo" }
      ],
      status: () => state.status,
      progress: () => state.matched / pairs,
      destroy: () => timer.stop()
    };
  };

  const SEQUENCE_NOTES = [
    { id: 0, frequency: 392, label: "Nota 1" },
    { id: 1, frequency: 523.25, label: "Nota 2" },
    { id: 2, frequency: 659.25, label: "Nota 3" },
    { id: 3, frequency: 783.99, label: "Nota 4" }
  ];

  const createSequence = (host, ctx) => {
    const wrap = make("div", "cog-seq");
    const pads = make("div", "cog-seq__pads");
    const actions = make("div", "cog-seq__actions");

    const state = { sequence: [], input: [], playing: false, level: 1, hits: 0, status: "Pulsa Empezar para escuchar la secuencia" };

    const play = async () => {
      if (state.playing || !state.sequence.length) return;
      state.playing = true;
      state.input = [];
      ctx.refresh();
      for (const noteId of state.sequence) {
        const pad = pads.children[noteId];
        pad.classList.add("is-playing");
        tone(SEQUENCE_NOTES[noteId].frequency, 0.42, "sine", 0.12);
        await sleep(520);
        pad.classList.remove("is-playing");
        await sleep(120);
      }
      state.playing = false;
      state.status = "Ahora repite la secuencia";
      ctx.refresh();
    };

    const start = async () => {
      if (!state.sequence.length) {
        const first = Math.floor(Math.random() * SEQUENCE_NOTES.length);
        state.sequence = [first];
        for (let i = 1; i < ctx.level.seqStart; i += 1) {
          state.sequence.push(Math.floor(Math.random() * SEQUENCE_NOTES.length));
        }
      }
      state.status = "Escucha con atención";
      await play();
    };

    const press = async (noteId) => {
      if (state.playing || !state.sequence.length) return;
      const pad = pads.children[noteId];
      pad.classList.add("is-playing");
      tone(SEQUENCE_NOTES[noteId].frequency, 0.3, "sine", 0.1);
      setTimeout(() => pad.classList.remove("is-playing"), 260);
      state.input.push(noteId);
      const position = state.input.length - 1;
      if (state.input[position] !== state.sequence[position]) {
        state.status = "Secuencia incorrecta. Escucha de nuevo";
        state.input = [];
        state.sequence = state.sequence.slice(0, ctx.level.seqStart);
        ctx.refresh();
        await sleep(900);
        await play();
        return;
      }
      if (state.input.length === state.sequence.length) {
        state.hits += 1;
        state.level += 1;
        if (state.sequence.length >= ctx.level.seqMax) {
          state.status = `¡Perfecto! Has dominado ${state.sequence.length} notas`;
          ctx.report(state.hits, state.hits);
          ctx.refresh();
          return;
        }
        state.sequence.push(Math.floor(Math.random() * SEQUENCE_NOTES.length));
        state.status = "¡Correcto! Escucha la nueva secuencia";
        ctx.refresh();
        await sleep(700);
        await play();
        return;
      }
      state.status = `Correcto, sigue (${state.input.length}/${state.sequence.length})`;
      ctx.refresh();
    };

    SEQUENCE_NOTES.forEach((note) => {
      const pad = make("button", `cog-seq__pad cog-seq__pad--${note.id}`);
      pad.type = "button";
      pad.textContent = String(note.id + 1);
      pad.setAttribute("aria-label", note.label);
      pad.addEventListener("click", () => press(note.id));
      pads.appendChild(pad);
    });

    const startBtn = make("button", "cog-btn cog-btn--primary", "Empezar");
    startBtn.type = "button";
    startBtn.addEventListener("click", () => start());
    const repeatBtn = make("button", "cog-btn", "Repetir");
    repeatBtn.type = "button";
    repeatBtn.addEventListener("click", () => play());
    actions.append(startBtn, repeatBtn);

    wrap.append(pads, actions);
    host.appendChild(wrap);

    return {
      stats: () => [
        { value: String(state.level), label: "nivel" },
        { value: String(state.sequence.length), label: "notas" },
        { value: String(state.hits), label: "aciertos" }
      ],
      status: () => state.status,
      progress: () => Math.min(1, (state.sequence.length - ctx.level.seqStart + 1) / Math.max(1, ctx.level.seqMax - ctx.level.seqStart + 1)),
      repeat: () => play(),
      destroy: () => {}
    };
  };

  const DAY_EVENTS = [
    { time: "08:00", text: "Desayunó avena con fruta" },
    { time: "10:30", text: "Paseo por el parque" },
    { time: "13:30", text: "Comida con la familia" },
    { time: "17:00", text: "Tarde de televisión y coro" },
    { time: "21:00", text: "Cena y rutina nocturna" }
  ];

  const createDay = (host, ctx) => {
    const list = make("ul", "cog-day");
    const events = DAY_EVENTS.slice();
    const state = { ordered: [], errors: 0, status: "Ordena los eventos del día anterior" };
    const timer = createTimer(() => ctx.refresh());

    shuffle(events).forEach((event) => {
      const item = make("li", "cog-day__item");
      const button = make("button", "cog-day__card");
      button.type = "button";
      button.dataset.time = event.time;
      button.innerHTML = `<span class="cog-day__time">${event.time}</span><span class="cog-day__text">${event.text}</span>`;
      button.addEventListener("click", () => {
        if (state.ordered.includes(button)) return;
        const expected = events[state.ordered.length];
        timer.start();
        if (event.time === expected.time) {
          state.ordered.push(button);
          button.classList.add("is-done");
          button.setAttribute("aria-label", `${event.text}, posición ${state.ordered.length}`);
          const badge = make("span", "cog-day__pos", String(state.ordered.length));
          button.appendChild(badge);
          state.status = `Correcto: ${event.text}`;
          if (state.ordered.length === events.length) {
            state.status = "¡Recuerdo completo del día!";
            ctx.report(events.length, events.length);
          }
        } else {
          state.errors += 1;
          button.classList.add("is-wrong");
          setTimeout(() => button.classList.remove("is-wrong"), 600);
          state.status = "Ese evento ocurre más tarde. Empieza por el más temprano";
        }
        ctx.refresh();
      });
      item.appendChild(button);
      list.appendChild(item);
    });

    const intro = make("p", "cog-hint", "Toca los eventos en el orden en que ocurrieron");
    host.append(intro, list);

    return {
      stats: () => [
        { value: `${state.ordered.length}/${events.length}`, label: "ordenados" },
        { value: String(state.errors), label: "errores" },
        { value: clock(timer.seconds), label: "tiempo" }
      ],
      status: () => state.status,
      progress: () => state.ordered.length / events.length,
      destroy: () => timer.stop()
    };
  };

  const createMath = (host, ctx) => {
    const wrap = make("div", "cog-math");
    const operation = make("p", "cog-math__op");
    const options = make("div", "cog-math__options");
    const state = { score: 0, hits: 0, attempts: 0, lives: ctx.level.mathLives, round: 0, locked: false, status: "Resuelve la operación" };

    const nextRound = () => {
      const max = ctx.level.mathMax;
      const a = Math.floor(Math.random() * max) + 2;
      const b = Math.floor(Math.random() * Math.max(3, Math.floor(max / 2))) + 1;
      const useMultiply = ctx.level.id === "dificil" && Math.random() < 0.35;
      let symbol = "+";
      let answer = a + b;
      if (useMultiply) {
        symbol = "×";
        answer = a * b;
      } else if (Math.random() < 0.45 && a > b) {
        symbol = "−";
        answer = a - b;
      }
      operation.textContent = `${a} ${symbol} ${b} = ?`;
      const candidates = new Set([answer]);
      while (candidates.size < ctx.level.options) {
        const offset = Math.floor(Math.random() * 9) - 4;
        const candidate = answer + offset;
        if (candidate >= 0 && candidate !== answer) candidates.add(candidate);
      }
      const values = shuffle(Array.from(candidates));
      options.innerHTML = "";
      values.forEach((value) => {
        const button = make("button", "cog-btn cog-btn--option", String(value));
        button.type = "button";
        button.addEventListener("click", () => {
          if (state.locked) return;
          state.locked = true;
          state.attempts += 1;
          if (value === answer) {
            button.classList.add("is-correct");
            state.hits += 1;
            state.score += 10;
            state.status = "¡Correcto!";
            tone(660, 0.2, "sine", 0.09);
          } else {
            button.classList.add("is-wrong");
            state.lives -= 1;
            state.status = "Casi. Vuelve a intentarlo";
            tone(220, 0.24, "triangle", 0.08);
            if (state.lives <= 0) {
              state.status = "Se acabaron los intentos";
              ctx.report(state.hits, state.attempts);
              ctx.refresh();
              return;
            }
          }
          state.round += 1;
          ctx.refresh();
          if (state.round >= ctx.level.rounds) {
            state.status = "¡Sesión de cálculo completada!";
            ctx.report(state.hits, state.attempts);
            ctx.refresh();
            return;
          }
          setTimeout(() => {
            state.locked = false;
            nextRound();
          }, 850);
        });
        options.appendChild(button);
      });
      ctx.refresh();
    };

    wrap.append(operation, options);
    host.appendChild(wrap);
    nextRound();

    return {
      stats: () => [
        { value: String(state.score), label: "puntos" },
        { value: String(state.hits), label: "aciertos" },
        { value: String(state.lives), label: "vidas" }
      ],
      status: () => state.status,
      progress: () => state.score / (ctx.level.rounds * 10),
      destroy: () => {}
    };
  };

  const IDEA_PAIRS = [
    { a: "Sol", b: "Calor" },
    { a: "Luna", b: "Noche" },
    { a: "Lluvia", b: "Paraguas" },
    { a: "Miel", b: "Abeja" },
    { a: "Invierno", b: "Nieve" },
    { a: "Libro", b: "Lectura" }
  ];

  const createLink = (host, ctx) => {
    const wrap = make("div", "cog-link");
    const left = make("div", "cog-link__col");
    const right = make("div", "cog-link__col");
    const state = { selected: null, hits: 0, attempts: 0, done: 0, status: "Toca un concepto y su relación" };
    const pairs = shuffle(IDEA_PAIRS).slice(0, ctx.level.linkPairs);

    const chooseLeft = (pair, button) => {
      if (button.classList.contains("is-done")) return;
      state.selected = { pair, button };
      $$(".cog-link__item", left).forEach((el) => el.classList.remove("is-selected"));
      button.classList.add("is-selected");
      state.status = `Ahora busca qué acompaña a ${pair.a}`;
      ctx.refresh();
    };

    const chooseRight = (pair, button) => {
      if (!state.selected || button.classList.contains("is-done")) return;
      state.attempts += 1;
      if (state.selected.pair.b === pair.b) {
        state.selected.button.classList.add("is-done");
        state.selected.button.classList.remove("is-selected");
        button.classList.add("is-done");
        state.hits += 1;
        state.done += 1;
        state.status = `¡Correcto! ${pair.a} es ${pair.b}`;
        tone(660, 0.18, "sine", 0.08);
        if (state.done === pairs.length) {
          state.status = "¡Todas las ideas conectadas!";
          ctx.report(state.hits, state.attempts);
        }
      } else {
        state.selected.button.classList.remove("is-selected");
        button.classList.add("is-wrong");
        setTimeout(() => button.classList.remove("is-wrong"), 600);
        state.status = "No es la relación correcta. Inténtalo de nuevo";
      }
      state.selected = null;
      ctx.refresh();
    };

    pairs.forEach((pair) => {
      const leftButton = make("button", "cog-link__item", pair.a);
      leftButton.type = "button";
      leftButton.addEventListener("click", () => chooseLeft(pair, leftButton));
      left.appendChild(leftButton);
    });

    shuffle(pairs).forEach((pair) => {
      const rightButton = make("button", "cog-link__item", pair.b);
      rightButton.type = "button";
      rightButton.addEventListener("click", () => chooseRight(pair, rightButton));
      right.appendChild(rightButton);
    });

    wrap.append(left, right);
    host.appendChild(wrap);

    return {
      stats: () => [
        { value: `${state.done}/${pairs.length}`, label: "conectadas" },
        { value: String(state.attempts), label: "intentos" },
        { value: `${state.attempts ? Math.round((state.hits / state.attempts) * 100) : 0}%`, label: "precisión" }
      ],
      status: () => state.status,
      progress: () => state.done / pairs.length,
      destroy: () => {}
    };
  };

  const createPuzzle = (host, ctx) => {
    const grid = make("div", "cog-puzzle");
    const order = MEMORY_ICONS.slice(0, 8);
    const state = { tiles: [], empty: 8, moves: 0, status: "Mueve las fichas hasta ordenarlas", solved: false };
    const timer = createTimer(() => ctx.refresh());

    const solvedState = () => state.tiles.every((tile, index) => (tile === null ? index === 8 : order.indexOf(tile) === index));

    const render = () => {
      grid.innerHTML = "";
      state.tiles.forEach((tile, index) => {
        if (tile === null) {
          const emptyCell = make("div", "cog-puzzle__cell cog-puzzle__cell--empty");
          emptyCell.setAttribute("aria-hidden", "true");
          grid.appendChild(emptyCell);
          return;
        }
        const cell = make("button", "cog-puzzle__cell");
        cell.type = "button";
        cell.innerHTML = svgIcon(tile);
        cell.setAttribute("aria-label", `Ficha ${tile}`);
        cell.addEventListener("click", () => move(index));
        grid.appendChild(cell);
      });
    };

    const adjacent = (index) => {
      const row = Math.floor(index / 3);
      const col = index % 3;
      const emptyRow = Math.floor(state.empty / 3);
      const emptyCol = state.empty % 3;
      return Math.abs(row - emptyRow) + Math.abs(col - emptyCol) === 1;
    };

    const move = (index) => {
      if (state.solved || !adjacent(index)) {
        state.status = "Esa ficha no está al lado del hueco";
        ctx.refresh();
        return;
      }
      timer.start();
      const swap = state.tiles[state.empty];
      state.tiles[state.empty] = state.tiles[index];
      state.tiles[index] = swap;
      state.empty = index;
      state.moves += 1;
      render();
      if (solvedState()) {
        state.solved = true;
        timer.stop();
        state.status = `¡Rompecabezas resuelto en ${state.moves} movimientos!`;
        ctx.report(state.moves, state.moves);
      }
      ctx.refresh();
    };

    const scramble = () => {
      let guard = 0;
      while (!state.solved && guard < 50) {
        state.tiles = shuffle(order).concat([null]);
        state.empty = 8;
        guard += 1;
      }
    };

    scramble();
    render();
    host.appendChild(grid);

    return {
      stats: () => [
        { value: String(state.moves), label: "movimientos" },
        { value: clock(timer.seconds), label: "tiempo" },
        { value: `${state.tiles.filter((tile, index) => tile !== null && order.indexOf(tile) === index).length}/8`, label: "en su sitio" }
      ],
      status: () => state.status,
      progress: () => state.tiles.filter((tile, index) => tile !== null && order.indexOf(tile) === index).length / 8,
      destroy: () => timer.stop()
    };
  };

  const WORDS = ["CASA", "PERRO", "LIBRO", "GATO", "FLOR", "LUNA", "MESA", "VERDE"];
  const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

  const createWords = (host, ctx) => {
    const wrap = make("div", "cog-words");
    const target = make("p", "cog-words__target");
    const grid = make("div", "cog-words__grid");
    const actions = make("div", "cog-words__actions");
    const state = { word: "", cells: [], selection: [], found: 0, attempts: 0, status: "Busca la palabra en la cuadrícula" };
    const timer = createTimer(() => ctx.refresh());
    const size = 6;
    const total = ctx.level.rounds;

    const build = () => {
      state.word = WORDS[Math.floor(Math.random() * WORDS.length)];
      state.cells = [];
      state.selection = [];
      const row = Math.floor(Math.random() * size);
      const start = Math.floor(Math.random() * (size - state.word.length + 1));
      for (let r = 0; r < size; r += 1) {
        for (let c = 0; c < size; c += 1) {
          if (r === row && c >= start && c < start + state.word.length) {
            state.cells.push(state.word[c - start]);
          } else {
            state.cells.push(ALPHABET[Math.floor(Math.random() * ALPHABET.length)]);
          }
        }
      }
      target.textContent = state.word.split("").map(() => "_").join(" ");
      renderGrid();
      ctx.refresh();
    };

    const renderGrid = () => {
      grid.innerHTML = "";
      state.cells.forEach((letter, index) => {
        const cell = make("button", "cog-words__cell");
        cell.type = "button";
        cell.textContent = letter;
        cell.dataset.index = String(index);
        cell.addEventListener("click", () => select(index, cell));
        grid.appendChild(cell);
      });
    };

    const select = (index, cell) => {
      timer.start();
      state.attempts += 1;
      const last = state.selection[state.selection.length - 1];
      const contiguous = last === undefined || isAdjacent(last, index);
      if (contiguous && !state.selection.includes(index)) {
        state.selection.push(index);
      } else {
        state.selection = [index];
      }
      $$(".cog-words__cell", grid).forEach((el) => el.classList.remove("is-selected"));
      state.selection.forEach((i) => {
        grid.children[i].classList.add("is-selected");
      });
      const formed = state.selection.map((i) => state.cells[i]).join("");
      target.textContent = state.word.split("").map((_, i) => (state.selection[i] !== undefined ? state.cells[state.selection[i]] : "_")).join(" ");
      if (formed === state.word) {
        state.found += 1;
        state.status = `¡Palabra encontrada: ${state.word}!`;
        tone(700, 0.22, "sine", 0.09);
        if (state.found >= total) {
          state.status = "¡Todas las palabras encontradas!";
          ctx.report(state.found, total);
        }
        ctx.refresh();
        setTimeout(() => build(), 1000);
        return;
      }
      state.status = `Seleccionadas ${state.selection.length} letras`;
      ctx.refresh();
    };

    const isAdjacent = (a, b) => {
      const ar = Math.floor(a / size);
      const ac = a % size;
      const br = Math.floor(b / size);
      const bc = b % size;
      return Math.abs(ar - br) + Math.abs(ac - bc) === 1;
    };

    const clearBtn = make("button", "cog-btn", "Borrar");
    clearBtn.type = "button";
    clearBtn.addEventListener("click", () => {
      state.selection = [];
      $$(".cog-words__cell", grid).forEach((el) => el.classList.remove("is-selected"));
      target.textContent = state.word.split("").map(() => "_").join(" ");
      ctx.refresh();
    });
    actions.appendChild(clearBtn);
    wrap.append(target, grid, actions);
    host.appendChild(wrap);
    build();

    return {
      stats: () => [
        { value: `${state.found}/${total}`, label: "palabras" },
        { value: String(state.attempts), label: "intentos" },
        { value: clock(timer.seconds), label: "tiempo" }
      ],
      status: () => state.status,
      progress: () => state.found / total,
      destroy: () => timer.stop()
    };
  };

  const STORIES = [
    {
      title: "El paseo de Carmen",
      steps: [
        { text: "Carmen decide salir a la calle después de desayunar.", options: [
          { label: "Ir al parque a caminar", consequence: "Da un paseo tranquilo y vuelve contenta.", good: true },
          { label: "Subir sola al autobús", consequence: "Se marea y una vecina la ayuda a volver.", good: false }
        ]},
        { text: "En el parque, un niño se ha perdido.", options: [
          { label: "Avisar a un adulto cercano", consequence: "El niño encuentra a su familia gracias a Carmen.", good: true },
          { label: "Seguir de largo", consequence: "El niño llora hasta que llega su madre.", good: false }
        ]}
      ],
      ending: "Carmen vuelve a casa con una tarde tranquila y una buena idea."
    },
    {
      title: "La receta de la abuela",
      steps: [
        { text: "La abuela prepara un bizcocho y le pide ayuda a Carmen.", options: [
          { label: "Medir los ingredientes", consequence: "Todo queda en su punto y el bizcocho sale esponjoso.", good: true },
          { label: "Salir de la cocina", consequence: "La abuela olvida la mezcla y el bizcocho queda plano.", good: false }
        ]},
        { text: "El bizcocho se hornea y hay que esperar.", options: [
          { label: "Preparar la mesa mientras tanto", consequence: "Al salir, todo está servido y la casa huele a bizcocho.", good: true },
          { label: "Mirar el reloj sin parar", consequence: "Se aburre y se distrae con el móvil.", good: false }
        ]}
      ],
      ending: "La familia merienda bizcocho caliente y habla de los planes del verano."
    },
    {
      title: "La llamada del vecindario",
      steps: [
        { text: "Un vecino pide ayuda para subir unas cajas.", options: [
          { label: "Ayudar con las cajas ligeras", consequence: "El vecino agradece la ayuda y se hacen amigos.", good: true },
          { label: "Decir que está ocupada", consequence: "El vecino se queda con las cajas y la relación se enfría.", good: false }
        ]},
        { text: "Después, Carmen se encuentra sola en casa.", options: [
          { label: "Preparar una actividad para la tarde", consequence: "Se distrae con un juego de memoria y la tarde pasa volando.", good: true },
          { label: "Quedarse mirando la pared", consequence: "Se aburre y pierde la rutina de la tarde.", good: false }
        ]}
      ],
      ending: "Carmen mantiene su rutina y el vecindario se siente más cercano."
    }
  ];

  const createStory = (host, ctx) => {
    const wrap = make("div", "cog-story");
    const state = { story: 0, step: 0, good: 0, done: 0, status: "Elige una opción para continuar" };

    const speak = (text) => {
      if (!("speechSynthesis" in window)) return;
      try {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = "es-ES";
        utterance.rate = 0.95;
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
      } catch (error) {
        return;
      }
    };

    const render = () => {
      const story = STORIES[state.story];
      wrap.innerHTML = "";
      const title = make("p", "cog-story__title", story.title);
      const text = make("p", "cog-story__text", story.steps[state.step].text);
      const options = make("div", "cog-story__options");
      story.steps[state.step].options.forEach((option) => {
        const button = make("button", "cog-btn cog-btn--option", option.label);
        button.type = "button";
        button.addEventListener("click", () => {
          options.innerHTML = "";
          const consequence = make("p", "cog-story__consequence", option.consequence);
          wrap.appendChild(consequence);
          if (option.good) state.good += 1;
          speak(option.consequence);
          setTimeout(() => {
            state.step += 1;
            if (state.step >= story.steps.length) {
              state.done += 1;
              state.status = story.ending;
              const ending = make("p", "cog-story__text cog-story__text--ending", story.ending);
              wrap.appendChild(ending);
              ctx.report(state.good, state.story + 1);
              ctx.refresh();
              if (state.story < STORIES.length - 1) {
                const next = make("button", "cog-btn cog-btn--primary", "Siguiente historia");
                next.type = "button";
                next.addEventListener("click", () => {
                  state.story += 1;
                  state.step = 0;
                  render();
                });
                wrap.appendChild(next);
              }
            } else {
              render();
            }
          }, 1500);
        });
        options.appendChild(button);
      });
      wrap.append(title, text, options);
      speak(story.steps[state.step].text);
      ctx.refresh();
    };

    host.appendChild(wrap);
    render();

    return {
      stats: () => [
        { value: `${state.done}/${STORIES.length}`, label: "historias" },
        { value: String(state.good), label: "decisiones buenas" },
        { value: `${state.done ? Math.round((state.good / Math.max(1, (state.story + 1) * 2)) * 100) : 0}%`, label: "precisión" }
      ],
      status: () => state.status,
      progress: () => state.done / STORIES.length,
      destroy: () => {
        if ("speechSynthesis" in window) window.speechSynthesis.cancel();
      }
    };
  };

  const SENTENCES = [
    { text: "Hoy desayuné ___", answer: "pan con tomate", options: ["un paseo largo", "una película"] },
    { text: "Cada mañana me ___ antes de salir", answer: "ducho", options: ["una siesta", "unas vacaciones"] },
    { text: "Mi instrumento favorito es la ___", answer: "flauta", options: ["una nube", "una cartera"] },
    { text: "El regalo de mi hermano fue un ___", answer: "coche de juguete", options: ["un parque", "un marco"] },
    { text: "Me gusta caminar por la ___", answer: "playa", options: ["la oficina", "el trabajo"] }
  ];

  const createSentence = (host, ctx) => {
    const wrap = make("div", "cog-sentence");
    const text = make("p", "cog-sentence__text");
    const options = make("div", "cog-sentence__options");
    const state = { index: 0, hits: 0, attempts: 0, done: 0, status: "Elige la frase que completa el sentido" };
    const pool = shuffle(SENTENCES);

    const render = () => {
      const item = pool[state.index];
      text.textContent = item.text;
      options.innerHTML = "";
      const choices = shuffle([item.answer].concat(item.options.filter((o) => o !== item.answer).slice(0, ctx.level.options - 1)));
      choices.forEach((choice) => {
        const button = make("button", "cog-btn cog-btn--option", choice);
        button.type = "button";
        button.addEventListener("click", () => {
          state.attempts += 1;
          if (choice === item.answer) {
            button.classList.add("is-correct");
            state.hits += 1;
            state.done += 1;
            text.textContent = item.text.replace("___", item.answer);
            state.status = "¡Frase completa!";
            tone(680, 0.2, "sine", 0.09);
            if (state.index >= pool.length - 1) {
              state.status = "¡Todas las frases completadas!";
              ctx.report(state.hits, state.attempts);
              ctx.refresh();
              return;
            }
            setTimeout(() => {
              state.index += 1;
              render();
            }, 1100);
          } else {
            button.classList.add("is-wrong");
            state.status = "Esa opción no encaja con la frase";
            setTimeout(() => button.classList.remove("is-wrong"), 600);
          }
          ctx.refresh();
        });
        options.appendChild(button);
      });
      ctx.refresh();
    };

    wrap.append(text, options);
    host.appendChild(wrap);
    render();

    return {
      stats: () => [
        { value: `${state.done}/${pool.length}`, label: "frases" },
        { value: String(state.hits), label: "aciertos" },
        { value: `${state.attempts ? Math.round((state.hits / state.attempts) * 100) : 0}%`, label: "precisión" }
      ],
      status: () => state.status,
      progress: () => state.done / pool.length,
      destroy: () => {}
    };
  };

  const createMaze = (host, ctx) => {
    const size = ctx.level.maze;
    const grid = make("div", "cog-maze");
    grid.style.setProperty("--cog-maze-cols", String(size));
    const state = { path: [], index: 0, errors: 0, status: "Sigue el camino resaltado hasta la meta" };
    const timer = createTimer(() => ctx.refresh());

    const buildPath = () => {
      const path = [[0, 0]];
      let r = 0;
      let c = 0;
      while (r < size - 1 || c < size - 1) {
        const moves = [];
        if (r < size - 1) moves.push([r + 1, c]);
        if (c < size - 1) moves.push([r, c + 1]);
        const next = moves[Math.floor(Math.random() * moves.length)];
        r = next[0];
        c = next[1];
        path.push([r, c]);
      }
      return path;
    };

    const render = () => {
      grid.innerHTML = "";
      const pathCells = new Set(state.path.map(([r, c]) => `${r}-${c}`));
      for (let r = 0; r < size; r += 1) {
        for (let c = 0; c < size; c += 1) {
          const key = `${r}-${c}`;
          const cell = make("button", "cog-maze__cell");
          cell.type = "button";
          cell.dataset.row = String(r);
          cell.dataset.col = String(c);
          if (!pathCells.has(key)) {
            cell.classList.add("is-wall");
            cell.setAttribute("aria-disabled", "true");
            cell.disabled = true;
          } else {
            cell.classList.add("is-path");
            if (r === 0 && c === 0) cell.classList.add("is-player");
            if (r === size - 1 && c === size - 1) cell.classList.add("is-goal");
          }
          cell.addEventListener("click", () => step(r, c));
          grid.appendChild(cell);
        }
      }
    };

    const step = (r, c) => {
      const target = state.path[state.index + 1];
      if (!target) return;
      if (target[0] === r && target[1] === c) {
        state.index += 1;
        timer.start();
        tone(440 + state.index * 25, 0.14, "sine", 0.07);
        const player = grid.querySelector(".is-player");
        if (player) player.classList.remove("is-player");
        const cells = grid.children;
        cells[r * size + c].classList.add("is-player");
        if (state.index >= state.path.length - 1) {
          state.status = "¡Has llegado a la meta!";
          timer.stop();
          ctx.report(state.path.length, state.path.length);
        } else {
          state.status = `Vas por el camino, paso ${state.index}/${state.path.length - 1}`;
        }
      } else {
        state.errors += 1;
        state.status = "Esa casilla no sigue el camino resaltado";
      }
      ctx.refresh();
    };

    state.path = buildPath();
    render();
    host.appendChild(grid);

    return {
      stats: () => [
        { value: `${state.index}/${state.path.length - 1}`, label: "pasos" },
        { value: String(state.errors), label: "errores" },
        { value: clock(timer.seconds), label: "tiempo" }
      ],
      status: () => state.status,
      progress: () => state.index / (state.path.length - 1),
      destroy: () => timer.stop()
    };
  };

  const FACES = {
    alegre: { label: "Alegría", mouth: "M8 14a4 4 0 0 0 8 0" },
    triste: { label: "Tristeza", mouth: "M8 17a4 4 0 0 1 8 0" },
    enfado: { label: "Enfado", mouth: "M8.5 16.5h7", brows: "M8.5 8.8 11 10M15.5 8.8 13 10" },
    sorpresa: { label: "Sorpresa", mouth: "M12 14.2a1.7 1.7 0 0 1 0 3.4 1.7 1.7 0 0 1 0-3.4Z", fill: true },
    calma: { label: "Calma", mouth: "M9 15.5h6" }
  };

  const faceSvg = (key) => {
    const face = FACES[key];
    return `<svg class="cog-face" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="9" fill="var(--surface-2)" stroke="var(--border-strong)" stroke-width="1.4"/>
      <circle cx="9.2" cy="10" r="1.1" fill="var(--ink)"/>
      <circle cx="14.8" cy="10" r="1.1" fill="var(--ink)"/>
      ${face.brows ? `<path d="${face.brows}" stroke="var(--ink)" stroke-width="1.3" stroke-linecap="round" fill="none"/>` : ""}
      <path d="${face.mouth}" stroke="var(--ink)" stroke-width="1.4" stroke-linecap="round" fill="${face.fill ? "var(--ink)" : "none"}"/>
    </svg>`;
  };

  const createEmotions = (host, ctx) => {
    const wrap = make("div", "cog-emotions");
    const faceBox = make("div", "cog-emotions__face");
    const options = make("div", "cog-emotions__options");
    const state = { round: 0, hits: 0, attempts: 0, answer: "", status: "¿Qué emoción reconoces?" };

    const render = () => {
      const keys = shuffle(Object.keys(FACES));
      state.answer = keys[0];
      faceBox.innerHTML = faceSvg(state.answer);
      options.innerHTML = "";
      keys.slice(0, ctx.level.options).forEach((key) => {
        const button = make("button", "cog-btn cog-btn--option", FACES[key].label);
        button.type = "button";
        button.addEventListener("click", () => {
          if (button.disabled) return;
          state.attempts += 1;
          if (key === state.answer) {
            button.classList.add("is-correct");
            button.disabled = true;
            state.hits += 1;
            state.status = `¡Correcto! Es ${FACES[key].label.toLowerCase()}`;
            tone(700, 0.2, "sine", 0.09);
            ctx.refresh();
            setTimeout(() => {
              state.round += 1;
              if (state.round >= ctx.level.rounds) {
                state.status = "¡Sesión de emociones completada!";
                ctx.report(state.hits, state.attempts);
                ctx.refresh();
                return;
              }
              render();
            }, 1000);
          } else {
            button.classList.add("is-wrong");
            button.disabled = true;
            state.status = `No es ${FACES[key].label.toLowerCase()}. Mira la expresión`;
            ctx.refresh();
          }
        });
        options.appendChild(button);
      });
      ctx.refresh();
    };

    wrap.append(faceBox, options);
    host.appendChild(wrap);
    render();

    return {
      stats: () => [
        { value: String(state.hits), label: "aciertos" },
        { value: String(state.attempts), label: "intentos" },
        { value: `${state.attempts ? Math.round((state.hits / state.attempts) * 100) : 0}%`, label: "precisión" }
      ],
      status: () => state.status,
      progress: () => state.hits / ctx.level.rounds,
      destroy: () => {}
    };
  };

  const COLORS = [
    { id: "teal", name: "Verde azulado", value: "#0d9488" },
    { id: "amber", name: "Ámbar", value: "#f59e0b" },
    { id: "violet", name: "Violeta", value: "#8b5cf6" },
    { id: "rose", name: "Rosa", value: "#e11d48" }
  ];

  const SHAPES = [
    { id: "circle", name: "Círculo" },
    { id: "square", name: "Cuadrado" },
    { id: "triangle", name: "Triángulo" },
    { id: "star", name: "Estrella" }
  ];

  const shapeSvg = (shape, color) => {
    const fill = color.value;
    const paths = {
      circle: `<circle cx="12" cy="12" r="7" fill="${fill}"/>`,
      square: `<rect x="5" y="5" width="14" height="14" rx="2" fill="${fill}"/>`,
      triangle: `<path d="M12 5 19 18H5z" fill="${fill}"/>`,
      star: `<path d="M12 4.5 14.4 9.5 19.8 10.2 15.9 14 17 19.4 12 16.8 7 19.4 8.1 14 4.2 10.2 9.6 9.5z" fill="${fill}"/>`
    };
    return `<svg class="cog-shape" viewBox="0 0 24 24" aria-hidden="true">${paths[shape.id]}</svg>`;
  };

  const createColors = (host, ctx) => {
    const wrap = make("div", "cog-colors");
    const target = make("div", "cog-colors__target");
    const question = make("p", "cog-colors__question");
    const options = make("div", "cog-colors__options");
    const state = { round: 0, hits: 0, attempts: 0, streak: 0, mode: "color", status: "Observa la figura y responde" };

    const render = () => {
      const shape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
      const color = COLORS[Math.floor(Math.random() * COLORS.length)];
      state.mode = state.round % 2 === 0 ? "color" : "shape";
      target.innerHTML = shapeSvg(shape, color);
      question.textContent = state.mode === "color" ? "¿De qué color es la figura?" : "¿Qué forma tiene la figura?";
      options.innerHTML = "";
      const choices = state.mode === "color" ? COLORS.map((c) => ({ id: c.id, name: c.name, color: c, shape })) : SHAPES.map((s) => ({ id: s.id, name: s.name, color, shape: s }));
      shuffle(choices).slice(0, 4).forEach((choice) => {
        const button = make("button", "cog-btn cog-btn--option cog-colors__option");
        button.type = "button";
        button.innerHTML = `${shapeSvg(choice.shape, choice.color)}<span>${choice.name}</span>`;
        const correct = state.mode === "color" ? choice.color.id === color.id : choice.shape.id === shape.id;
        button.addEventListener("click", () => {
          if (button.disabled) return;
          state.attempts += 1;
          if (correct) {
            button.classList.add("is-correct");
            button.disabled = true;
            state.hits += 1;
            state.streak += 1;
            state.status = `¡Correcto! Es ${state.mode === "color" ? color.name.toLowerCase() : shape.name.toLowerCase()}`;
            tone(720, 0.2, "sine", 0.09);
            ctx.refresh();
            setTimeout(() => {
              state.round += 1;
              if (state.round >= ctx.level.rounds) {
                state.status = "¡Sesión de percepción completada!";
                ctx.report(state.hits, state.attempts);
                ctx.refresh();
                return;
              }
              render();
            }, 1000);
          } else {
            button.classList.add("is-wrong");
            button.disabled = true;
            state.streak = 0;
            state.status = "No coincide. Vuelve a mirar la figura";
            ctx.refresh();
          }
        });
        options.appendChild(button);
      });
      ctx.refresh();
    };

    wrap.append(target, question, options);
    host.appendChild(wrap);
    render();

    return {
      stats: () => [
        { value: String(state.hits), label: "aciertos" },
        { value: String(state.attempts), label: "intentos" },
        { value: String(state.streak), label: "racha" }
      ],
      status: () => state.status,
      progress: () => state.hits / ctx.level.rounds,
      destroy: () => {}
    };
  };

  const CATEGORIES = [
    { id: "memoria", name: "Memoria y atención", icon: "i-brain" },
    { id: "logica", name: "Lógica y razonamiento", icon: "i-sliders" },
    { id: "lenguaje", name: "Lenguaje y creatividad", icon: "i-word" },
    { id: "percepcion", name: "Orientación y percepción", icon: "i-map-pin" }
  ];

  const GAMES = [
    { id: "memory", name: "Memory Match Pro", cat: "memoria", icon: "i-layers", objective: "Reforzar la memoria visual y la concentración", tech: "Cartas con iconos familiares, niveles de dificultad y temporizador adaptable", create: createMemory },
    { id: "sequence", name: "Secuencia Sonora", cat: "memoria", icon: "i-volume", objective: "Estimular la memoria auditiva", tech: "Repetir secuencias de notas con feedback auditivo suave", create: createSequence },
    { id: "day", name: "Recordando el Día", cat: "memoria", icon: "i-clock", objective: "Ejercitar la memoria episódica", tech: "Eventos del día anterior ordenados cronológicamente", create: createDay },
    { id: "math", name: "Puzzle Numérico", cat: "logica", icon: "i-plus", objective: "Mantener el cálculo mental", tech: "Operaciones simples con animaciones grandes y colores contrastados", create: createMath },
    { id: "link", name: "Conecta Ideas", cat: "logica", icon: "i-link", objective: "Estimular la asociación lógica", tech: "Unir conceptos relacionados como sol y calor", create: createLink },
    { id: "puzzle", name: "Rompecabezas Visual", cat: "logica", icon: "i-puzzle", objective: "Desarrollar el razonamiento espacial", tech: "Piezas grandes, arrastre intuitivo y niveles progresivos", create: createPuzzle },
    { id: "words", name: "Palabra Oculta", cat: "lenguaje", icon: "i-word", objective: "Activar vocabulario y memoria semántica", tech: "Buscar palabras en una cuadrícula con temas familiares", create: createWords },
    { id: "story", name: "Historias Interactivas", cat: "lenguaje", icon: "i-pencil", objective: "Fomentar expresión y comprensión", tech: "Elegir opciones para continuar una historia con narración por voz", create: createStory },
    { id: "sentence", name: "Completa la Frase", cat: "lenguaje", icon: "i-file-text", objective: "Estimular lenguaje y contexto", tech: "Frases cotidianas con huecos para completar", create: createSentence },
    { id: "maze", name: "Encuentra el Camino", cat: "percepcion", icon: "i-maze", objective: "Mejorar la orientación espacial", tech: "Laberintos simples con guía visual y sonora", create: createMaze },
    { id: "emotions", name: "Reconoce Emociones", cat: "percepcion", icon: "i-face", objective: "Trabajar empatía y percepción facial", tech: "Identificar emociones en rostros ilustrados", create: createEmotions },
    { id: "colors", name: "Colores y Formas", cat: "percepcion", icon: "i-palette", objective: "Estimular la percepción visual", tech: "Clasificar objetos por color o forma con feedback positivo", create: createColors }
  ];

  const panel = $("#cog-panel");
  const statsBox = $("#cog-stats");
  const titleEl = $("#cog-game-title");
  const statusEl = $("#cog-status");
  const objectiveEl = $("#cog-objective");
  const techEl = $("#cog-tech");
  const resetBtn = $("#cog-reset");
  const diffSelect = $("#cog-difficulty");
  const voiceBtn = $("#cog-voice");
  const progressLabel = $("#cog-progress-label");
  const progressBar = $("#cog-progress-bar");

  if (!panel) return;

  let current = null;
  let currentId = "memory";
  let difficulty = "normal";

  const family = {
    sessions: 4,
    gain: 12,
    streak: 6,
    level: 3,
    week: [1, 1, 2, 1, 2, 0, 0],
    days: ["L", "M", "X", "J", "V", "S", "D"]
  };

  const renderFamily = () => {
    const sessions = $("#cog-fam-sessions");
    const gain = $("#cog-fam-hit");
    const streak = $("#cog-fam-streak");
    const level = $("#cog-fam-level");
    const week = $("#cog-week");
    if (sessions) sessions.textContent = `Esta semana: ${family.sessions} sesiones`;
    if (gain) gain.textContent = `+${family.gain}%`;
    if (streak) streak.textContent = `Racha: ${family.streak} días`;
    if (level) level.textContent = `Nivel ${family.level}`;
    if (week) {
      week.innerHTML = family.week.map((value, index) => {
        const height = Math.min(100, value * 34);
        return `<span class="cog-week__col"><span class="cog-week__bar" style="height:${height}%"></span><small>${family.days[index]}</small></span>`;
      }).join("");
    }
  };

  const report = (hits, total) => {
    const ratio = total ? hits / total : 0;
    family.sessions += 1;
    family.gain = Math.min(99, family.gain + Math.round(ratio * 8));
    family.streak += 1;
    if (ratio >= 0.8) family.level = Math.min(9, family.level + 1);
    family.week[6] += 1;
    renderFamily();
  };

  const renderStats = (stats) => {
    statsBox.innerHTML = stats.map((stat) => `<div><strong>${stat.value}</strong><span>${stat.label}</span></div>`).join("");
  };

  const sync = () => {
    if (!current) return;
    renderStats(current.stats());
    statusEl.textContent = current.status();
    const pct = Math.max(0, Math.min(100, Math.round(current.progress() * 100)));
    progressLabel.textContent = `${pct}%`;
    progressBar.style.width = `${pct}%`;
  };

  const mount = (id) => {
    const meta = GAMES.find((game) => game.id === id) || GAMES[0];
    if (current && current.destroy) current.destroy();
    currentId = meta.id;
    titleEl.textContent = meta.name;
    objectiveEl.textContent = meta.objective;
    techEl.textContent = meta.tech;
    panel.innerHTML = "";
    current = meta.create(panel, {
      level: LEVELS[difficulty],
      refresh: sync,
      report
    });
    $$(".cog-chip").forEach((chip) => chip.classList.toggle("is-active", chip.dataset.game === meta.id));
    sync();
  };

  const renderLibrary = () => {
    const box = $("#cog-library");
    if (!box) return;
    box.innerHTML = "";
    CATEGORIES.forEach((category) => {
      const group = make("div", "cog-library__group");
      const title = make("p", "cog-library__cat");
      title.innerHTML = `${svgIcon(category.icon)}<span>${category.name}</span>`;
      const list = make("ul", "cog-library__list");
      GAMES.filter((game) => game.cat === category.id).forEach((game) => {
        const item = make("li");
        const chip = make("button", "cog-chip");
        chip.type = "button";
        chip.dataset.game = game.id;
        chip.innerHTML = `${svgIcon(game.icon)}<span>${game.name}</span>`;
        chip.addEventListener("click", () => mount(game.id));
        item.appendChild(chip);
        list.appendChild(item);
      });
      group.append(title, list);
      box.appendChild(group);
    });
  };

  resetBtn.addEventListener("click", () => mount(currentId));

  diffSelect.addEventListener("change", () => {
    difficulty = diffSelect.value;
    mount(currentId);
  });

  const nextGame = () => {
    const index = GAMES.findIndex((game) => game.id === currentId);
    const next = GAMES[(index + 1) % GAMES.length];
    mount(next.id);
  };

  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!Recognition) {
    voiceBtn.hidden = true;
  } else {
    const recognition = new Recognition();
    recognition.lang = "es-ES";
    recognition.continuous = true;
    recognition.interimResults = false;
    let listening = false;
    const toggle = () => {
      listening = !listening;
      voiceBtn.setAttribute("aria-pressed", String(listening));
      voiceBtn.classList.toggle("is-active", listening);
      if (listening) {
        try { recognition.start(); } catch (error) { listening = false; voiceBtn.setAttribute("aria-pressed", "false"); voiceBtn.classList.remove("is-active"); }
      } else {
        recognition.stop();
      }
    };
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results).map((result) => result[0].transcript).join(" ").toLowerCase();
      if (transcript.includes("repetir")) {
        if (current && current.repeat) current.repeat();
        else mount(currentId);
      }
      if (transcript.includes("siguiente")) nextGame();
    };
    recognition.onend = () => {
      if (listening) {
        try { recognition.start(); } catch (error) { return; }
      }
    };
    voiceBtn.addEventListener("click", toggle);
  }

  renderLibrary();
  renderFamily();
  mount("memory");
})();
