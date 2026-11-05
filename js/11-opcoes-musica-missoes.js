/**
 * ECOS DO ARCANO — 11-opcoes-musica-missoes.js
 * Tela de opções, música de fundo, qualidade gráfica, pedidos de Porto Brisamar
 * e Pedravale, e as interações extras com elfos, filhos crescidos e família secreta.
 */

/* ==========================================================================
   CONFIGURAÇÕES
   ========================================================================== */

const SETTINGS_KEY = "ecos-settings";
const DEFAULT_SETTINGS = {
  sfx: 0.8,
  music: 0.5,
  vibrate: true,
  quality: "auto",
};

const settings = (() => {
  try {
    return Object.assign({}, DEFAULT_SETTINGS, JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}"));
  } catch (e) {
    return Object.assign({}, DEFAULT_SETTINGS);
  }
})();

function saveSettings() {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {}
}

/* ==========================================================================
   QUALIDADE GRÁFICA
   ========================================================================== */

const QUALITY = {
  alta: {
    label: "Alta",
    pixelRatio: 2,
    walkers: 1,
    ambience: true,
    weather: 1,
  },
  media: {
    label: "Média",
    pixelRatio: 1.5,
    walkers: 0.7,
    ambience: true,
    weather: 0.6,
  },
  baixa: {
    label: "Baixa",
    pixelRatio: 1,
    walkers: 0.45,
    ambience: false,
    weather: 0.35,
  },
};

const isTouchDevice = () => matchMedia("(pointer:coarse)").matches;
let autoQuality = isTouchDevice() ? "media" : "alta";

function currentQuality() {
  const key = settings.quality === "auto" ? autoQuality : settings.quality;
  return QUALITY[key] || QUALITY.alta;
}

/** Ajusta a resolução interna do canvas à qualidade escolhida. */
function applyQuality() {
  const ratio = currentQuality().pixelRatio;
  canvas.width = Math.round(viewWidth * ratio);
  canvas.height = Math.round(480 * ratio);
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  ctx.imageSmoothingEnabled = false;
}

/** No modo automático, baixa a qualidade se o jogo ficar lento. */
const fpsMonitor = { frames: 0, time: 0, slowStreak: 0 };
function monitorPerformance(dt) {
  if (settings.quality !== "auto") return;
  fpsMonitor.frames++;
  fpsMonitor.time += dt;
  if (fpsMonitor.time < 2) return;
  const fps = fpsMonitor.frames / fpsMonitor.time;
  fpsMonitor.frames = 0;
  fpsMonitor.time = 0;
  fpsMonitor.slowStreak = fps < 38 ? fpsMonitor.slowStreak + 1 : 0;
  if (fpsMonitor.slowStreak >= 2 && autoQuality !== "baixa") {
    autoQuality = autoQuality === "alta" ? "media" : "baixa";
    fpsMonitor.slowStreak = 0;
    applyQuality();
    toast(`O jogo ficou lento: qualidade ajustada para ${currentQuality().label}.`, 3000);
  }
}

/* ==========================================================================
   MÚSICA (gerada na hora, sem arquivos)
   ========================================================================== */

const midiToFreq = (m) => 440 * Math.pow(2, (m - 69) / 12);

/**
 * Cada faixa: andamento (BPM), instrumento da melodia e padrões de 16 passos.
 * Números são notas MIDI; 0 é pausa.
 */
const TRACKS = {
  titulo: {
    bpm: 72,
    lead: "triangle",
    melody: [
      69, 0, 72, 0, 76, 0, 74, 72, 71, 0, 67, 0, 69, 0, 0, 0, 65, 0, 69, 0, 72, 0, 71, 69, 67, 0, 64, 0, 69,
      0, 0, 0,
    ],
    bass: [45, 0, 0, 0, 45, 0, 0, 0, 41, 0, 0, 0, 43, 0, 0, 0],
  },
  vila: {
    bpm: 96,
    lead: "square",
    melody: [
      72, 0, 74, 76, 79, 0, 76, 74, 72, 0, 69, 0, 72, 0, 0, 0, 77, 0, 76, 74, 72, 0, 74, 76, 74, 0, 72, 0, 72,
      0, 0, 0,
    ],
    bass: [48, 0, 55, 0, 45, 0, 52, 0, 41, 0, 48, 0, 43, 0, 50, 0],
  },
  noite: {
    bpm: 70,
    lead: "triangle",
    melody: [
      69, 0, 0, 72, 0, 0, 76, 0, 74, 0, 0, 72, 0, 0, 69, 0, 67, 0, 0, 69, 0, 0, 72, 0, 71, 0, 0, 0, 0, 0, 0,
      0,
    ],
    bass: [45, 0, 0, 0, 0, 0, 0, 0, 41, 0, 0, 0, 0, 0, 0, 0],
  },
  aventura: {
    bpm: 112,
    lead: "square",
    melody: [
      69, 0, 72, 69, 76, 0, 74, 0, 72, 71, 69, 0, 67, 0, 69, 0, 69, 0, 72, 74, 76, 0, 79, 0, 77, 76, 74, 0,
      76, 0, 0, 0,
    ],
    bass: [45, 45, 0, 45, 41, 41, 0, 41, 43, 43, 0, 43, 40, 40, 0, 40],
  },
  batalha: {
    bpm: 150,
    lead: "sawtooth",
    melody: [
      69, 69, 72, 69, 74, 69, 76, 74, 72, 72, 76, 72, 79, 77, 76, 74, 69, 69, 72, 69, 74, 69, 76, 79, 81, 79,
      77, 76, 74, 72, 71, 72,
    ],
    bass: [45, 45, 57, 45, 45, 45, 57, 45, 41, 41, 53, 41, 43, 43, 55, 43],
  },
  chefe: {
    bpm: 160,
    lead: "sawtooth",
    melody: [
      64, 0, 64, 65, 64, 0, 62, 0, 64, 0, 67, 68, 67, 0, 65, 0, 64, 0, 64, 65, 64, 0, 62, 60, 59, 0, 60, 62,
      64, 0, 0, 0,
    ],
    bass: [40, 40, 40, 40, 41, 41, 41, 41, 40, 40, 40, 40, 38, 38, 39, 39],
  },
  taverna: {
    bpm: 132,
    lead: "square",
    melody: [
      74, 76, 78, 74, 79, 0, 78, 76, 74, 0, 71, 0, 74, 76, 78, 0, 79, 81, 83, 79, 81, 0, 79, 78, 76, 0, 74, 0,
      74, 0, 0, 0,
    ],
    bass: [50, 0, 57, 0, 50, 0, 57, 0, 55, 0, 62, 0, 57, 0, 64, 0],
  },
  festival: {
    bpm: 124,
    lead: "square",
    melody: [
      72, 76, 79, 76, 81, 79, 76, 72, 74, 77, 81, 77, 79, 0, 0, 0, 72, 76, 79, 84, 83, 81, 79, 76, 77, 76, 74,
      71, 72, 0, 0, 0,
    ],
    bass: [48, 0, 55, 0, 53, 0, 57, 0, 55, 0, 59, 0, 48, 0, 55, 0],
  },
};

const music = { track: null, step: 0, nextTime: 0, gain: null, timer: null };

function musicVolume() {
  return settings.music * 0.09;
}

function ensureMusic() {
  if (!audioCtx) {
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      return false;
    }
  }
  if (audioCtx.state === "suspended") audioCtx.resume();
  if (!music.gain) {
    music.gain = audioCtx.createGain();
    music.gain.gain.value = musicVolume();
    music.gain.connect(audioCtx.destination);
  }
  if (!music.timer) music.timer = setInterval(scheduleMusic, 90);
  return true;
}

function playNote(freq, time, length, type, volume) {
  const osc = audioCtx.createOscillator(),
    env = audioCtx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  env.gain.setValueAtTime(0.0001, time);
  env.gain.exponentialRampToValueAtTime(volume, time + 0.015);
  env.gain.exponentialRampToValueAtTime(0.0001, time + length);
  osc.connect(env);
  env.connect(music.gain);
  osc.start(time);
  osc.stop(time + length + 0.02);
}

/** Agenda as próximas notas um pouco à frente do tempo atual. */
function scheduleMusic() {
  const track = TRACKS[music.track];
  if (!track || !audioCtx || settings.music <= 0) return;
  const stepLen = 60 / track.bpm / 2;
  if (music.nextTime < audioCtx.currentTime) music.nextTime = audioCtx.currentTime + 0.05;
  while (music.nextTime < audioCtx.currentTime + 0.25) {
    const melodyNote = track.melody[music.step % track.melody.length];
    const bassNote = track.bass[music.step % track.bass.length];
    if (melodyNote) playNote(midiToFreq(melodyNote), music.nextTime, stepLen * 0.9, track.lead, 0.5);
    if (bassNote) playNote(midiToFreq(bassNote), music.nextTime, stepLen * 1.6, "triangle", 0.7);
    music.step++;
    music.nextTime += stepLen;
  }
}

/** Escolhe a faixa de acordo com o que está acontecendo. */
function desiredTrack() {
  if (["title", "story", "create", "choose", "end"].includes(game.mode)) return "titulo";
  if (game.mode === "battle" && battle) return battle.e.boss || battle.e.eco ? "chefe" : "batalha";
  if (game.brawl) return "batalha";
  if (game.wedding) return "festival";
  const zone = ZONES[player.zone];
  if (!zone) return "vila";
  if (player.zone === "interior" && game.inter && game.inter.st === "taverna" && tavernParty())
    return "taverna";
  if (player.zone === "vila" && festivalToday()) return "festival";
  if (zone.town) return isNight() ? "noite" : "vila";
  return "aventura";
}

function updateMusic() {
  if (!audioCtx || !music.gain) return;
  music.gain.gain.setTargetAtTime(musicVolume(), audioCtx.currentTime, 0.3);
  const wanted = desiredTrack();
  if (wanted === music.track) return;
  music.gain.gain.setTargetAtTime(0.0001, audioCtx.currentTime, 0.15);
  setTimeout(() => {
    music.track = wanted;
    music.step = 0;
    music.nextTime = 0;
  }, 350);
}

/* ==========================================================================
   TELA DE OPÇÕES
   ========================================================================== */

const CONTROLS_HELP = [
  ["Mover", "Setas ou WASD · joystick no celular"],
  ["Interagir / avançar", "E, Espaço ou Enter · botão A"],
  ["Voltar", "Esc · botão B"],
  ["Inventário", "I"],
  ["Missões", "Q"],
  ["Grimório", "G"],
  ["Mapa / minimapa", "M / N"],
  ["Cavalo", "C"],
  ["Zoom", "Z"],
  ["Decorar a casa", "R"],
  ["Tela cheia", "F"],
  ["Opções", "O"],
  ["Batalha", "1–6 runas · Enter lança · D defende · H habilidades · I itens"],
];

let optionsReturnMode = "world";

function openOptions() {
  optionsReturnMode = game.mode === "options" ? optionsReturnMode : game.mode;
  game.mode = "options";
  renderOptions();
  byId("options").style.display = "block";
}

function closeOptions() {
  byId("options").style.display = "none";
  game.mode = optionsReturnMode === "options" ? "world" : optionsReturnMode;
}

function optionButtons(group, choices, current) {
  return choices
    .map(
      ([value, label]) =>
        `<button data-${group}="${value}" class="${value === current ? "on" : ""}">${label}</button>`,
    )
    .join("");
}

function renderOptions() {
  const inGame = optionsReturnMode !== "title";
  const qualityChoices = [["auto", "Automática"], ...Object.entries(QUALITY).map(([k, q]) => [k, q.label])];
  const difficultyChoices = Object.entries(DIFFICULTIES).map(([k, d]) => [k, d.n]);
  let html = `<div class="gh"><h2>Opções</h2><button id="optclose">Fechar (Esc)</button></div>
    <h3>Som</h3>
    <div class="opt"><span>Efeitos</span><input type="range" id="optSfx" min="0" max="1" step="0.05" value="${settings.sfx}"></div>
    <div class="opt"><span>Música</span><input type="range" id="optMusic" min="0" max="1" step="0.05" value="${settings.music}"></div>
    <h3>Gráficos</h3>
    <div class="opt"><span>Qualidade</span><div class="seg">${optionButtons("q", qualityChoices, settings.quality)}</div></div>
    <div class="opt"><span>Zoom</span><div class="seg">${optionButtons(
      "z",
      [1, 1.25, 1.5, 1.8, 2.2].map((z) => [String(z), Math.round(z * 100) + "%"]),
      String(game.zoom),
    )}</div></div>
    <h3>Celular</h3>
    <div class="opt"><span>Vibração</span><div class="seg">${optionButtons(
      "v",
      [
        ["1", "Ligada"],
        ["0", "Desligada"],
      ],
      settings.vibrate ? "1" : "0",
    )}</div></div>`;
  if (inGame) {
    html += `<h3>Jogo</h3>
      <div class="opt"><span>Dificuldade</span><div class="seg">${optionButtons("d", difficultyChoices, player.diff || "normal")}</div></div>
      <div class="opt"><span>Progresso</span><div><button id="optSave">Salvar agora</button> <button id="optErase">Apagar progresso</button></div></div>`;
  }
  html += `<h3>Ajuda</h3><div class="opt"><span>Como jogar</span><div><button id="optGuide">Guia do Aprendiz</button> <button id="optCredits">Créditos</button></div></div>`;
  html += `<h3>Controles</h3><div class="controls">${CONTROLS_HELP.map(([a, k]) => `<div><b>${a}</b><span>${k}</span></div>`).join("")}</div>`;
  const box = byId("options");
  box.innerHTML = html;

  byId("optclose").onclick = closeOptions;
  byId("optGuide").onclick = openGuide;
  byId("optCredits").onclick = () => {
    closeOptions();
    openCredits();
  };
  byId("optSfx").oninput = (e) => {
    settings.sfx = +e.target.value;
    saveSettings();
  };
  byId("optSfx").onchange = () => playSound(660, 0.08, "sine");
  byId("optMusic").oninput = (e) => {
    settings.music = +e.target.value;
    saveSettings();
    ensureMusic();
  };
  box.querySelectorAll("[data-q]").forEach(
    (b) =>
      (b.onclick = () => {
        settings.quality = b.dataset.q;
        saveSettings();
        applyQuality();
        renderOptions();
      }),
  );
  box.querySelectorAll("[data-z]").forEach(
    (b) =>
      (b.onclick = () => {
        game.zoom = +b.dataset.z;
        try {
          localStorage.setItem("ecos-zoom", game.zoom);
        } catch (e) {}
        renderOptions();
      }),
  );
  box.querySelectorAll("[data-v]").forEach(
    (b) =>
      (b.onclick = () => {
        settings.vibrate = b.dataset.v === "1";
        saveSettings();
        if (settings.vibrate && navigator.vibrate) navigator.vibrate(20);
        renderOptions();
      }),
  );
  box.querySelectorAll("[data-d]").forEach(
    (b) =>
      (b.onclick = () => {
        player.diff = b.dataset.d;
        saveGame();
        toast(`Dificuldade: ${difficulty().n}`);
        renderOptions();
      }),
  );
  if (byId("optSave"))
    byId("optSave").onclick = () => {
      saveGame();
      toast("Jogo salvo!");
    };
  if (byId("optErase"))
    byId("optErase").onclick = (e) => {
      if (e.target.dataset.confirm !== "1") {
        e.target.dataset.confirm = "1";
        e.target.textContent = "Tem certeza? Clique de novo";
        return;
      }
      clearSave();
      location.reload();
    };
}

/* ==========================================================================
   PEDIDOS DE PORTO BRISAMAR E PEDRAVALE
   ========================================================================== */

const TOWN_QUESTS = [
  {
    id: "farol",
    town: "Porto Brisamar",
    giver: "capitao",
    title: "O Farol Apagado",
    need: { cristal: 3 },
    reward: { gold: 150, item: "amuPerola", rep: 3 },
    intro:
      "O cristal do farol rachou na última tempestade. Sem luz, os barcos batem nas pedras. Me traga 3 Cristais?",
    done: "O farol voltou a brilhar! Os marinheiros vão cantar o seu nome em todos os portos.",
  },
  {
    id: "perola",
    town: "Porto Brisamar",
    giver: "marina",
    title: "Uma Pérola para Marina",
    need: { perolaN: 1 },
    reward: { gold: 80, rel: 10 },
    intro: "Minha mãe tinha uma pérola que perdeu no mar. Se você pescar uma por aí... eu ia adorar.",
    done: "Ela é linda! Vou guardar perto do coração. Obrigada, de verdade.",
  },
  {
    id: "peixes",
    town: "Porto Brisamar",
    giver: "nicoP",
    title: "Carpas para a Feira",
    need: { carpa: 3 },
    reward: { gold: 100, rep: 2 },
    intro: "Prometi carpas frescas para a feira de amanhã e a pesca foi fraca. Consegue 3 Carpas?",
    done: "Salvou minha feira! Volte sempre que quiser peixe fresco.",
  },
  {
    id: "forja",
    town: "Pedravale",
    giver: "minerA",
    title: "Pedras para a Forja Anã",
    need: { pedra: 5 },
    reward: { gold: 120, item: "fragmento" },
    intro: "A forja está com fome! Preciso de 5 Pedras de Golem para uma liga nova.",
    done: "Pedra boa, sim senhor! Leve este fragmento, achei lá no fundo da mina.",
  },
  {
    id: "cha",
    town: "Pedravale",
    giver: "ancia",
    title: "O Chá da Anciã",
    need: { ervas: 2, mel: 1 },
    reward: { gold: 90, item: "elixir" },
    intro:
      "Meu chá de inverno precisa de 2 Ervas Medicinais e um Pote de Mel. Minhas pernas não sobem mais a serra...",
    done: "Ah, que cheiro bom! Tome este elixir que eu guardava para uma ocasião especial.",
  },
  {
    id: "peles",
    town: "Pedravale",
    giver: "peleiro",
    title: "Peles para o Inverno",
    need: { couro: 4 },
    reward: { gold: 110, item: "armPele" },
    intro: "O inverno vem forte. Preciso de 4 Couros de Lobo para os casacos da vila.",
    done: "Agora ninguém passa frio. Leve esta armadura de pele, fiz pensando em você.",
  },
];

const townQuestState = (q) => (player.townQ || {})[q.id] || "novo";
const hasQuestItems = (q) => Object.entries(q.need).every(([id, n]) => itemCount(id) >= n);
const questNeedText = (q) =>
  Object.entries(q.need)
    .map(([id, n]) => `${Math.min(itemCount(id), n)}/${n} ${ITEMS[id].nome}`)
    .join(", ");

function giveQuestReward(q) {
  for (const [id, n] of Object.entries(q.need)) removeItem(id, n);
  const r = q.reward;
  player.gold += r.gold || 0;
  if (r.item) addItem(r.item);
  if (r.rep) repAdd(r.rep);
  addFriendship(q.giver, r.rel || 6);
  player.townQ[q.id] = "feito";
  saveGame();
  playSound(880, 0.15, "sine");
  const parts = [`+${r.gold} de ouro`];
  if (r.item) parts.push(ITEMS[r.item].nome);
  if (r.rep) parts.push(`reputação +${r.rep}`);
  return parts.join(", ");
}

/** Opções de pedido no menu da pessoa que dá a missão. */
function townQuestMenuItems(id) {
  const items = [];
  for (const q of TOWN_QUESTS.filter((q) => q.giver === id)) {
    const state = townQuestState(q);
    const name = NPCS[id].nome.split(",")[0];
    if (state === "novo")
      items.push({
        t: `Pedido: ${q.title}`,
        fn: () => {
          player.townQ = player.townQ || {};
          player.townQ[q.id] = "ativo";
          saveGame();
          say([
            [name, q.intro],
            ["", `Novo pedido: ${q.title}. Veja em Missões (Q).`],
          ]);
        },
      });
    else if (state === "ativo")
      items.push({
        t: hasQuestItems(q) ? `Entregar: ${q.title}` : `${q.title} (${questNeedText(q)})`,
        fn: () => {
          if (!hasQuestItems(q)) {
            say([[name, `Ainda falta: ${questNeedText(q)}.`]]);
            return;
          }
          const reward = giveQuestReward(q);
          say([
            [name, q.done],
            ["", `Pedido concluído! ${reward}.`],
          ]);
        },
      });
  }
  return items;
}

function townQuestsHTML() {
  let html = "<h3>Pedidos de Porto Brisamar e Pedravale</h3>";
  for (const q of TOWN_QUESTS) {
    const state = townQuestState(q);
    const who = NPCS[q.giver].nome.split(",")[0];
    const status = state === "feito" ? "concluído" : state === "ativo" ? questNeedText(q) : `fale com ${who}`;
    html += `<div class="qs ${state === "feito" ? "done" : ""}">${q.title} · ${q.town}<div class="qtip">${status}</div></div>`;
  }
  return html;
}

/* ==========================================================================
   ELFOS, FILHOS CRESCIDOS E FAMÍLIA SECRETA
   ========================================================================== */

function elfMenu(elf) {
  const blessed = player.elfBless === player.day;
  choice(elf.nm, "Um elfo da floresta. Os olhos brilham como folhas ao sol.", [
    {
      t: "Conversar",
      fn: () => say([[elf.nm, ELF_LINES[Math.floor(Math.random() * ELF_LINES.length)]]]),
    },
    {
      t: blessed ? "Bênção élfica (já recebida hoje)" : "Pedir a bênção élfica (1 Buquê de Flores)",
      fn: () => {
        if (blessed) return;
        if (!itemCount("flor")) {
          say([[elf.nm, "Traga flores. A floresta gosta de quem a enfeita."]]);
          return;
        }
        removeItem("flor");
        player.elfBless = player.day;
        saveGame();
        say([
          [elf.nm, "*canta baixinho numa língua antiga*"],
          ["", "Bênção élfica: hoje você recupera 3 HP por turno nas batalhas."],
        ]);
      },
    },
    {
      t: "Trocar 3 Ervas Medicinais por um Elixir",
      fn: () => {
        if (itemCount("ervas") < 3) {
          say([[elf.nm, "Três ervas por um elixir. É a troca justa da floresta."]]);
          return;
        }
        removeItem("ervas", 3);
        addItem("elixir");
        saveGame();
        say([[elf.nm, "Que as folhas te guardem."]]);
      },
    },
    { t: "Sair", fn: null },
  ]);
}

/** Filhos com 8 dias ou mais podem ajudar e treinar com você. */
function grownKidMenuItems(k) {
  if (kidAge(k) < 8) return [];
  const key = "kid" + k.name;
  const items = [
    {
      t: "Pedir ajuda nas tarefas",
      fn: () => {
        if (player.famDay[key + "h"] === player.day) {
          say([[k.name, "Já ajudei hoje! Amanhã de novo, prometo."]]);
          return;
        }
        player.famDay[key + "h"] = player.day;
        const gold = 10 + Math.min(30, kidAge(k));
        player.gold += gold;
        saveGame();
        say([
          [k.name, "Varri a casa, alimentei as galinhas e ainda vendi ovos na feira!"],
          ["", `+${gold} de ouro.`],
        ]);
      },
    },
    {
      t: "Treinar runas juntos",
      fn: () => {
        if (player.famDay[key + "t"] === player.day) {
          say([[k.name, "Minha cabeça já está cheia de runas por hoje!"]]);
          return;
        }
        player.famDay[key + "t"] = player.day;
        const xp = 12 + player.lvl * 2;
        player.xp += xp;
        saveGame();
        say([
          [k.name, "Olha! Senti um calorzinho quando toquei a runa!"],
          ["", `Ensinar também é aprender. +${xp} XP.`],
        ]);
      },
    },
  ];
  // Sem magia no Simulador de Vida: não tem treino de runas.
  return lifeMode() ? items.filter((o) => !o.t.includes("runas")) : items;
}

const SECRET_VISIT_GIFTS = ["pao", "doce", "mel", "flor"];

function secretVisitGift() {
  if (Math.random() >= 0.45) return "";
  const gift = SECRET_VISIT_GIFTS[Math.floor(Math.random() * SECRET_VISIT_GIFTS.length)];
  addItem(gift);
  return ` Na despedida, você ganha ${ITEMS[gift].nome}.`;
}

/* ==========================================================================
   FILHOS: ADOÇÃO NO TEMPLO
   ========================================================================== */

const KID_ROBES = ["#e86ab0", "#4a7ad9", "#7ab04a", "#f2c14e", "#c94a4a", "#8a4ad9"];
const KID_HAIRS = ["#3a2414", "#d9a441", "#1a1a1a", "#8a3a1a", "#e8e4dc"];
const pick = (list) => list[Math.floor(Math.random() * list.length)];

function randomKidLook(base) {
  return {
    skin: base && Math.random() < 0.5 ? base.skin : pick(["#f1c8a5", "#d9a07a", "#a8704a", "#7a4a2a"]),
    hair: base && Math.random() < 0.5 ? base.hair : pick(KID_HAIRS),
    hstyle: pick(["curto", "longo", "cacheado", "rabo"]),
    hat: "nenhum",
    hatc: "#2a2f6e",
    outfit: pick(["tunica", "vestido", "manto"]),
    robe: pick(KID_ROBES),
  };
}

/** Qualquer pessoa pode adotar no Templo, casada ou não. */
function adoptChild() {
  const priest = "Padre Anselmo";
  if (player.gold < 50) {
    say([[priest, "A adoção pede uma doação de 50 de ouro para o orfanato do Templo."]]);
    return;
  }
  say([[priest, "Há uma criança aqui que sonha com uma família. Que nome você quer dar a ela?"]], () =>
    promptName("Nome da criança", "Como vai se chamar?", (name) => {
      player.gold -= 50;
      player.kids.push({
        name,
        born: player.day - 2,
        look: randomKidLook(player.look),
        adopted: true,
      });
      repAdd(3);
      saveGame();
      playSound(784, 0.2, "sine");
      setTimeout(() => playSound(1047, 0.3, "sine"), 180);
      say([
        [name, "Você... vai ser minha família de verdade?"],
        ["", `${name} agora mora na sua casa. Reputação +3.`],
      ]);
    }),
  );
}

/* ==========================================================================
   CERIMÔNIA DE CASAMENTO
   ========================================================================== */

const WEDDING_DURATION = 10;
const WEDDING_CAPTIONS = [
  [0, "Os sinos do Templo da Luz tocam. A vila inteira veio ver."],
  [0.22, 'Padre Anselmo: "Estamos aqui reunidos sob a luz das runas..."'],
  [0.45, "Troca de alianças"],
  [0.6, '"Pode beijar o seu amor."'],
  [0.76, "Viva os noivos!"],
];

function startWedding(id) {
  const guests = Object.keys(FRIENDS)
    .filter((k) => k !== id && NPCS[k] && friendshipLevel(k) >= 1)
    .slice(0, 10);
  while (guests.length < 6) guests.push(pick(Object.keys(NPCS).filter((k) => NPCS[k].robe && k !== id)));
  game.wedding = { id, start: game.t, guests, rang: false };
  game.mode = "wedding";
  byId("tgtpill").style.display = "none";
  [392, 523, 523, 523, 392, 587, 523, 494, 523].forEach((f, i) =>
    setTimeout(() => playSound(f, 0.5, "triangle", 0.04), i * 450),
  );
}

function finishWedding() {
  const id = game.wedding.id;
  const name = NPCS[id].nome.split(",")[0];
  game.wedding = null;
  game.mode = "world";
  player.spouse = id;
  player.dating = null;
  if (id === "rainha") {
    player.flags.consorte = true;
    repAdd(10);
  }
  player.married = player.day;
  Object.keys(FRIENDS).forEach((k) => (player.rel[k] = Math.min(100, friendship(k) + 5)));
  saveGame();
  if (id === "rainha") {
    say([
      ["Padre Anselmo", `Pelo poder das runas e pela vontade da Coroa, eu declaro ${player.name} e a Rainha Aurélia unidos para sempre!`],
      ["Rainha Aurélia", `Povo de Cinzaluz: conheçam ${genderWord("o seu novo Consorte Real", "a sua nova Consorte Real", "e Consorte Real")}!`],
      ["", "Agora você é da família real: recebe 50 de ouro por dia do tesouro e não paga mais o Imposto Real."],
      ["", "A Rainha passa as noites com você na sua casa (ela diz que o castelo é frio demais). Para ter filhos, fale com ela em casa."],
    ]);
    return;
  }
  say([
    ["Padre Anselmo", `Pelo poder das runas, eu declaro ${player.name} e ${name} unidos para sempre!`],
    ["Arquimaga Odelia", "Que a Canção Arcana proteja esta família."],
    ["", `Vocês se casaram! ${name} agora mora com você, dentro da sua casa.`],
    ["", `Para ter filhos, fale com ${name} em casa e escolha "Conversar sobre ter um filho".`],
  ]);
}

function updateWedding() {
  const w = game.wedding;
  if (!w) return;
  const p = (game.t - w.start) / WEDDING_DURATION;
  if (p > 0.76 && !w.rang) {
    w.rang = true;
    [1047, 1319, 1568, 1319, 1047, 1568].forEach((f, i) =>
      setTimeout(() => playSound(f, 0.7, "sine", 0.03), i * 260),
    );
  }
  if (p >= 1) finishWedding();
}

function drawTempleBackdrop(W, t) {
  ctx.fillStyle = "#2a2236";
  ctx.fillRect(0, 0, W, 480);
  ctx.fillStyle = "#3a3048";
  ctx.fillRect(0, 300, W, 180);
  for (let i = 0; i < 5; i++) {
    const x = W / 2 - 260 + i * 130;
    ctx.fillStyle = "#1c1428";
    ctx.fillRect(x - 6, 40, 72, 150);
    const colors = ["#ff7a3d", "#4fb8ff", "#9ff0cf", "#e0ab62", "#fff0a0"];
    for (let r = 0; r < 4; r++)
      for (let c = 0; c < 3; c++) {
        ctx.fillStyle = colors[(i + r + c) % 5];
        ctx.globalAlpha = 0.65 + 0.2 * Math.sin(t * 2 + r + c);
        ctx.fillRect(x + c * 20, 48 + r * 34, 18, 32);
      }
    ctx.globalAlpha = 0.12;
    ctx.fillStyle = colors[i];
    fillPolygon(x, 190, x + 60, 190, x + 120, 480, x - 60, 480);
    ctx.globalAlpha = 1;
  }
  ctx.fillStyle = "#a82a2a";
  ctx.fillRect(W / 2 - 40, 300, 80, 180);
  ctx.fillStyle = "#f2c14e";
  ctx.fillRect(W / 2 - 40, 300, 4, 180);
  ctx.fillRect(W / 2 + 36, 300, 4, 180);
  ctx.fillStyle = "#e8e4dc";
  ctx.fillRect(W / 2 - 70, 236, 140, 40);
  ctx.fillStyle = "#f2c14e";
  ctx.fillRect(W / 2 - 70, 236, 140, 5);
  for (const dx of [-90, 90]) {
    ctx.fillStyle = "#c9a050";
    ctx.fillRect(W / 2 + dx - 2, 220, 4, 60);
    ctx.fillStyle = `rgba(255,214,107,${0.8 + 0.2 * Math.sin(t * 9 + dx)})`;
    circle(W / 2 + dx, 216, 5);
  }
}

function drawWeddingScene(t) {
  const w = game.wedding;
  if (!w) return;
  const p = Math.min(1, (game.t - w.start) / WEDDING_DURATION);
  const W = viewWidth,
    cx = W / 2,
    u = 4;
  drawTempleBackdrop(W, t);

  const celebrate = p > 0.76;
  w.guests.forEach((id, i) => {
    const n = NPCS[id];
    const left = i % 2 === 0;
    const row = Math.floor(i / 2);
    const x = left ? cx - 150 - row * 60 : cx + 90 + row * 60;
    const hop = celebrate ? Math.abs(Math.sin(t * 7 + i)) * 10 : 0;
    ctx.fillStyle = "#5a3a1e";
    ctx.fillRect(x - 6, 392, 76, 10);
    drawSprite(wizardRects(n.robe, n.hat, n.hair, null, left ? "right" : "left"), x, 330 - hop, u, false);
  });

  drawSprite(wizardRects("#e8e4dc", null, "#d9d9d9", null, "down"), cx - 32, 182, u);

  const walk = Math.min(1, p / 0.2);
  const altarX = cx - 18;
  const startX = -80;
  const myX = startX + (altarX - 52 - startX) * walk;
  const partnerX = startX - 50 + (altarX + 8 - startX + 50) * walk;
  const kissing = p > 0.6 && p < 0.76;
  const lean = kissing ? 0.08 : 0;
  const baseY = 300 - 16 * u;
  const n = NPCS[w.id];

  ctx.save();
  ctx.translate(myX + 8 * u, 300);
  ctx.rotate(lean);
  drawSprite(
    heroRects(player.look, walk < 1 ? "right" : "right", null, walk < 1 ? walkFrame(true, t) : 0),
    -8 * u,
    -16 * u,
    u,
  );
  drawKissFace(-8 * u, -16 * u, u, player.look.skin, kissing, p > 0.45 ? 1 : 0);
  ctx.fillStyle = "#ff8aa8";
  ctx.fillRect(-4 * u, -16 * u + 3 * u, 8 * u, u);
  ctx.restore();

  ctx.save();
  ctx.translate(partnerX + 8 * u, 300);
  ctx.rotate(-lean);
  drawSprite(
    wizardRects(n.robe, null, n.hair, null, walk < 1 ? "right" : "left", walk < 1 ? walkFrame(true, t) : 0),
    -8 * u,
    -16 * u,
    u,
  );
  drawKissFace(-8 * u, -16 * u, u, npcSkin(n.robe, null, n.hair), kissing, p > 0.45 ? 1 : 0);
  ctx.fillStyle = "rgba(255,255,255,.75)";
  ctx.fillRect(-6 * u, -16 * u + 4 * u, 12 * u, 6 * u);
  ctx.fillStyle = "#ffb3c8";
  ctx.fillRect(-4 * u, -16 * u + 3 * u, 8 * u, u);
  ctx.restore();

  if (p > 0.45 && p < 0.6) {
    const ringX = cx - 22,
      ringY = 300 - 8 * u;
    ctx.strokeStyle = "#f2c14e";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(ringX, ringY, 6, 0, 7);
    ctx.stroke();
    drawPixelIcon("sparkle", ringX, ringY - 16 - Math.sin(t * 6) * 3, 3);
  }
  if (kissing) drawPixelIcon("heart", cx - 22, baseY - 10 - (p - 0.6) * 120, 4);
  if (celebrate) {
    const colors = ["#ff6b8a", "#f2c14e", "#7fd0ff", "#9ff0cf", "#fff"];
    for (let i = 0; i < 70; i++) {
      const q = (t * 0.35 + i * 0.037) % 1;
      ctx.fillStyle = colors[i % 5];
      ctx.fillRect(((i * 53.7) % W) + Math.sin(t * 2 + i) * 14, q * 480, 4, 4);
    }
  }

  const caption = WEDDING_CAPTIONS.filter(([at]) => p >= at).pop()[1];
  ctx.fillStyle = "rgba(10,6,18,.7)";
  ctx.fillRect(0, 430, W, 50);
  ctx.fillStyle = "#ffe9a8";
  ctx.font = '700 16px "Pixelify Sans", sans-serif';
  ctx.textAlign = "center";
  ctx.fillText(caption, cx, 460);
}

/* ==========================================================================
   VIDA EM PORTO BRISAMAR E PEDRAVALE
   ========================================================================== */

/** Atores extras de cada vila: pescadores, carregadores, mineiros, cabras, barcos e gaivotas. */
function initTownExtras() {
  const actors = [];
  if (player.zone === "porto") {
    actors.push(
      {
        kind: "fisher",
        x: 10,
        y: 29,
        robe: "#3a6a8a",
        hair: "#3a2414",
        hat: "#8a6a2a",
      },
      { kind: "fisher", x: 21, y: 29, robe: "#8a3a3a", hair: "#d9d9d9" },
      {
        kind: "fisher",
        x: 32,
        y: 29,
        robe: "#5a7a3a",
        hair: "#1a1a1a",
        hat: "#5a3a22",
      },
      {
        kind: "porter",
        path: [
          [20, 23],
          [20, 14],
          [18, 12],
        ],
        robe: "#7a5a3a",
        hair: "#3a2414",
      },
      {
        kind: "porter",
        path: [
          [31, 23],
          [31, 14],
          [29, 12],
        ],
        robe: "#4a5a7a",
        hair: "#8a3a1a",
      },
      { kind: "umbrella", x: 5, y: 23, color: "#e0303a" },
      { kind: "umbrella", x: 18, y: 23, color: "#4fb8ff" },
      { kind: "umbrella", x: 28, y: 23, color: "#f2c14e" },
      {
        kind: "sitter",
        x: 6,
        y: 23,
        dir: "down",
        robe: "#e86ab0",
        hair: "#d9a441",
      },
      {
        kind: "sitter",
        x: 29,
        y: 23,
        dir: "down",
        robe: "#4a9ad9",
        hair: "#3a2414",
      },
      { kind: "sandcastle", x: 8, y: 23, robe: "#e86ab0", hair: "#d9a441" },
      { kind: "sandcastle", x: 34, y: 23, robe: "#4a9ad9", hair: "#1a1a1a" },
      { kind: "boat", x: 4, y: 30.3, v: 0.9 },
      {
        kind: "fisher",
        x: 46,
        y: 29,
        robe: "#7a5a3a",
        hair: "#d9d9d9",
        hat: "#5a3a22",
      },
      { kind: "fisher", x: 55, y: 29, robe: "#3a6a5a", hair: "#3a2414" },
      {
        kind: "porter",
        path: [
          [45, 23],
          [45, 15],
          [47, 12],
        ],
        robe: "#5a4a3a",
        hair: "#1a1a1a",
      },
      { kind: "umbrella", x: 49, y: 23, color: "#7ad36b" },
      { kind: "sandcastle", x: 57, y: 23, robe: "#f2c14e", hair: "#8a3a1a" },
      { kind: "boat", x: 30, y: 30.3, v: -0.6 },
    );
    for (let i = 0; i < 5; i++)
      actors.push({
        kind: "gull",
        cx: 6 + i * 8,
        cy: 21 + (i % 3),
        r: 2 + (i % 3),
        ph: i,
      });
  } else if (player.zone === "serra") {
    actors.push(
      {
        kind: "miner",
        path: [
          [21, 8],
          [20, 9],
          [5, 9],
          [4, 8],
        ],
        robe: "#6a5a4a",
        hair: "#3a2414",
      },
      {
        kind: "miner",
        path: [
          [22, 8],
          [23, 9],
          [35, 9],
          [36, 8],
        ],
        robe: "#5a5a6a",
        hair: "#8a3a1a",
      },
      {
        kind: "miner",
        path: [
          [38, 21],
          [30, 21],
          [23, 21],
          [22, 17],
        ],
        robe: "#8a6a4a",
        hair: "#3a2414",
      },
      {
        kind: "porter",
        path: [
          [5, 33],
          [17, 33],
          [17, 37],
          [5, 37],
        ],
        robe: "#8a6a2a",
        hair: "#3a2414",
        hat: "#c9a03a",
      },
      {
        kind: "porter",
        path: [
          [27, 34],
          [39, 34],
          [39, 36],
          [27, 36],
        ],
        robe: "#5a7a3a",
        hair: "#d9d9d9",
        hat: "#c9a03a",
      },
      {
        kind: "miner",
        path: [
          [45, 8],
          [45, 9],
          [51, 9],
          [51, 8],
        ],
        robe: "#6a6a7a",
        hair: "#3a2414",
      },
      {
        kind: "cart",
        path: [
          [18, 9],
          [9, 9],
        ],
      },
      { kind: "campfire", x: 21, y: 13 },
      {
        kind: "sitter",
        x: 20,
        y: 13,
        dir: "right",
        robe: "#8a3a3a",
        hair: "#d9d9d9",
      },
      {
        kind: "sitter",
        x: 23,
        y: 13,
        dir: "left",
        robe: "#3a6a8a",
        hair: "#3a2414",
      },
      {
        kind: "sitter",
        x: 22,
        y: 14,
        dir: "up",
        robe: "#7a7a3a",
        hair: "#1a1a1a",
      },
      {
        kind: "sitter",
        x: 19,
        y: 12,
        dir: "down",
        robe: "#5a6a8a",
        hair: "#d9a441",
      },
      { kind: "sparks", x: 4, y: 6 },
    );
    [
      [37, 24],
      [39, 25],
      [38, 27],
      [40, 23],
    ].forEach(([x, y], i) => actors.push({ kind: "goat", x, y, timer: i, hx: x, hy: y }));
  }
  for (const a of actors) {
    if (a.path) {
      a.i = 0;
      a.rx = a.path[0][0];
      a.ry = a.path[0][1];
      a.forward = true;
    }
    if (a.kind === "goat") {
      a.rx = a.x;
      a.ry = a.y;
    }
  }
  game.townActors = actors;
}

function updateTownExtras(dt) {
  for (const a of game.townActors || []) {
    if (a.path) {
      const speed = a.kind === "cart" ? 1.6 : 1.1;
      const target = a.path[a.i + (a.forward ? 1 : -1)];
      if (!target) {
        a.forward = !a.forward;
        a.wait = 2 + Math.random() * 2;
        continue;
      }
      if (a.wait > 0) {
        a.wait -= dt;
        continue;
      }
      const dx = target[0] - a.rx,
        dy = target[1] - a.ry,
        dist = Math.hypot(dx, dy);
      if (dist < 0.05) {
        a.i += a.forward ? 1 : -1;
        continue;
      }
      const step = Math.min(dist, speed * dt);
      a.rx += (dx / dist) * step;
      a.ry += (dy / dist) * step;
      a.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : dy > 0 ? "down" : "up";
    } else if (a.kind === "boat") {
      a.x += a.v * dt;
      if (a.x > 46) a.x = -4;
      if (a.x < -4) a.x = 46;
    } else if (a.kind === "goat") {
      a.timer -= dt;
      if (a.timer <= 0) {
        a.timer = 1 + Math.random() * 3;
        const [dx, dy] = pick(DIRS4);
        const nx = a.x + dx,
          ny = a.y + dy;
        if (tileAt(player.zone, nx, ny) === "." && Math.abs(nx - a.hx) <= 2 && Math.abs(ny - a.hy) <= 3) {
          a.x = nx;
          a.y = ny;
          a.flip = dx < 0;
        }
      }
      a.rx += (a.x - a.rx) * Math.min(1, dt * 4);
      a.ry += (a.y - a.ry) * Math.min(1, dt * 4);
    } else if (a.kind === "fisher" && Math.random() < dt * 0.05) {
      game.bubbles.push({ x: a.x, y: a.y, icon: "fish", t: 2 });
    }
  }
}

function drawPerson(a, x, y, dir, frame, t) {
  ctx.fillStyle = "rgba(0,0,0,.22)";
  ctx.beginPath();
  ctx.ellipse(x + 16, y + 30, 8, 3, 0, 0, 7);
  ctx.fill();
  drawSprite(wizardRects(a.robe, a.hat || null, a.hair, null, dir, frame), x, y, 2, dir === "left");
}

function drawTownActor(a, t) {
  const X = (a.rx ?? a.x) * TILE,
    Y = (a.ry ?? a.y) * TILE;
  switch (a.kind) {
    case "fisher": {
      drawPerson(a, X, Y, "down", 0, t);
      const bob = Math.sin(t * 2 + a.x) * 2;
      ctx.strokeStyle = "#6b4423";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(X + 24, Y + 18);
      ctx.lineTo(X + 34, Y - 4);
      ctx.stroke();
      ctx.strokeStyle = "rgba(240,240,240,.7)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(X + 34, Y - 4);
      ctx.lineTo(X + 36, Y + 44 + bob);
      ctx.stroke();
      ctx.fillStyle = "#e0303a";
      circle(X + 36, Y + 44 + bob, 2.5);
      break;
    }
    case "porter":
    case "miner": {
      const moving = !a.wait;
      drawPerson(a, X, Y, a.dir || "down", walkFrame(moving, t), t);
      if (a.kind === "porter") {
        ctx.fillStyle = "#a8844e";
        ctx.fillRect(X + 8, Y - 10, 16, 12);
        ctx.strokeStyle = "#6b4423";
        ctx.strokeRect(X + 8.5, Y - 9.5, 15, 11);
      } else {
        ctx.fillStyle = "#6b4423";
        ctx.fillRect(X + 24, Y + 4, 2, 16);
        ctx.fillStyle = "#9aa0b4";
        ctx.fillRect(X + 20, Y + 2, 10, 3);
      }
      break;
    }
    case "cart":
      ctx.fillStyle = "rgba(0,0,0,.25)";
      ctx.fillRect(X + 2, Y + 26, 28, 4);
      ctx.fillStyle = "#5a5a62";
      ctx.fillRect(X + 4, Y + 10, 24, 14);
      ctx.fillStyle = "#3a3a44";
      ctx.fillRect(X + 4, Y + 10, 24, 3);
      ctx.fillStyle = "#5fd0ff";
      ctx.fillRect(X + 8, Y + 6, 6, 5);
      ctx.fillStyle = "#8a8478";
      ctx.fillRect(X + 15, Y + 5, 8, 6);
      ctx.fillStyle = "#222";
      circle(X + 9, Y + 26, 3);
      circle(X + 23, Y + 26, 3);
      break;
    case "sandcastle": {
      ctx.fillStyle = "#d9c08a";
      ctx.fillRect(X + 14, Y + 18, 16, 10);
      ctx.fillRect(X + 16, Y + 12, 4, 6);
      ctx.fillRect(X + 24, Y + 12, 4, 6);
      ctx.fillStyle = "#e0303a";
      ctx.fillRect(X + 21, Y + 6, 1, 8);
      fillPolygon(X + 22, Y + 6, X + 27, Y + 8, X + 22, Y + 10);
      ctx.save();
      ctx.translate(X + 6, Y + 32);
      ctx.scale(0.7, 0.7);
      drawSprite(wizardRects(a.robe, null, a.hair, null, "right", Math.sin(t * 3) > 0 ? 1 : 0), -16, -32, 2);
      ctx.restore();
      break;
    }
    case "boat": {
      const bob = Math.sin(t * 1.5 + a.y) * 2;
      const bx = a.x * TILE,
        by = a.y * TILE + bob;
      ctx.fillStyle = "#6b4423";
      fillPolygon(bx - 24, by, bx + 24, by, bx + 16, by + 12, bx - 16, by + 12);
      ctx.fillStyle = "#5a3a22";
      ctx.fillRect(bx - 1, by - 34, 3, 34);
      ctx.fillStyle = "#f3ead2";
      fillPolygon(bx + 2, by - 32, bx + 22, by - 6, bx + 2, by - 6);
      ctx.fillStyle = "#c94a4a";
      fillPolygon(bx + 2, by - 34, bx + 10, by - 31, bx + 2, by - 28);
      break;
    }
    case "gull": {
      const gx = (a.cx + Math.cos(t * 0.6 + a.ph) * a.r * 2) * TILE,
        gy = (a.cy + Math.sin(t * 0.8 + a.ph) * a.r) * TILE - 40;
      const flap = Math.sin(t * 10 + a.ph) > 0 ? -3 : 1;
      ctx.strokeStyle = "#f2f2f2";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(gx - 7, gy + flap);
      ctx.lineTo(gx, gy);
      ctx.lineTo(gx + 7, gy + flap);
      ctx.stroke();
      break;
    }
    case "campfire": {
      ctx.fillStyle = "#5a3a22";
      ctx.fillRect(X + 6, Y + 22, 20, 4);
      ctx.fillRect(X + 10, Y + 18, 12, 4);
      const f = Math.sin(t * 12) * 2;
      ctx.fillStyle = "#ff7a3d";
      fillPolygon(X + 8, Y + 22, X + 16 + f, Y + 2, X + 24, Y + 22);
      ctx.fillStyle = "#ffd34d";
      fillPolygon(X + 12, Y + 22, X + 16 - f, Y + 9, X + 20, Y + 22);
      ctx.fillStyle = "rgba(255,170,80,.18)";
      circle(X + 16, Y + 16, 30);
      break;
    }
    case "sitter":
      drawPerson(a, X, Y + 6, a.dir, 0, t);
      break;
    case "umbrella":
      ctx.fillStyle = "rgba(0,0,0,.18)";
      ctx.beginPath();
      ctx.ellipse(X + 16, Y + 26, 20, 5, 0, 0, 7);
      ctx.fill();
      ctx.fillStyle = "#e8e4dc";
      ctx.fillRect(X + 15, Y - 10, 2, 38);
      for (let i = 0; i < 6; i++) {
        ctx.fillStyle = i % 2 ? "#fff" : a.color;
        fillPolygon(X + 16, Y - 16, X - 6 + i * 7.3, Y - 2, X + 1.3 + i * 7.3, Y - 2);
      }
      ctx.fillStyle = a.color;
      ctx.fillRect(X + 2, Y + 22, 28, 6);
      ctx.fillStyle = "#fff";
      ctx.fillRect(X + 2, Y + 24, 28, 1);
      break;
    case "sparks":
      for (let i = 0; i < 6; i++) {
        const q = (t * 1.5 + i / 6) % 1;
        ctx.globalAlpha = 1 - q;
        ctx.fillStyle = i % 2 ? "#ffd34d" : "#ff7a3d";
        ctx.fillRect(X + 16 + Math.sin(i * 2.3) * q * 20, Y + 10 - q * 30, 2, 2);
      }
      ctx.globalAlpha = 1;
      break;
    case "goat": {
      const f = a.flip;
      const r = (x, y, w, h, c) => {
        ctx.fillStyle = c;
        ctx.fillRect(f ? X + 32 - x - w : X + x, Y + y, w, h);
      };
      ctx.fillStyle = "rgba(0,0,0,.2)";
      ctx.fillRect(X + 6, Y + 28, 20, 3);
      r(8, 14, 16, 9, "#e8e4dc");
      r(22, 9, 7, 7, "#e8e4dc");
      r(23, 6, 2, 3, "#8a8478");
      r(27, 6, 2, 3, "#8a8478");
      r(9, 23, 2, 5, "#8a8478");
      r(20, 23, 2, 5, "#8a8478");
      r(27, 12, 1, 1, "#222");
      r(26, 16, 2, 3, "#d9d9d9");
      break;
    }
  }
}

/* ==========================================================================
   GUIA DO APRENDIZ
   ========================================================================== */

/** Cada sistema explicado em uma linha: onde fica e como usar. */
const GUIDE_SECTIONS = [
  [
    "Começo",
    [
      ["Missões (Q)", "Mostram sempre o próximo passo da história e os pedidos aceitos."],
      ["Treino", "O Instrutor Kael, ao norte da praça, ensina a lutar com runas."],
      ["Fome e sede", "Coma e beba (mercado, taverna, padarias). Sem isso, a vida cai."],
      ["Dormir", "Na cama da sua casa (porta azul, Sua Casa) ou nas pousadas."],
    ],
  ],
  [
    "Magia e batalha",
    [
      ["Runas", "Combine 1 ou 2 runas para criar feitiços. Acerte a fraqueza do inimigo."],
      ["Grimório (G)", "Lista os feitiços descobertos e o bestiário."],
      ["Canção Arcana", "Quando a barra de Ressonância enche, solte o golpe supremo."],
      ["Ecos Corrompidos", "Inimigos com aura roxa. Cada um dá um Selo permanente."],
    ],
  ],
  [
    "Vilas e viagem",
    [
      ["Carruagem", "Placas de estrada e estábulos levam a Porto Brisamar e Pedravale."],
      ["Pedidos", "Moradores das vilas vizinhas pedem itens em troca de ouro e prêmios."],
      ["Trabalhos", "Quadro da Guilda e conversas com moradores (Trabalhar 3 horas)."],
      ["Pesca", "Compre uma Vara de Pesca, fique de frente para a água e aperte E."],
    ],
  ],
  [
    "Amizade e família",
    [
      ["Amizade", "Converse, dê presentes, elogie. Corações: Conhecido, Amigo, Melhor Amigo."],
      ["Gestos", "Com amigos: abraço e toca aqui. Com namoro: menu Carinhos (beijo, dança, mãos dadas, serenata, flores...)."],
      ["Encontros", "Menu Encontros: piquenique, jantar à luz de velas, estrelas, pôr do sol no farol e carta de amor. Um por dia."],
      ["Relação aberta", "Com cônjuge ou namoro (amizade 70+), proponha abrir a relação. Depende da personalidade de cada um."],
      ["Rainha", "Converse com a Rainha Aurélia no castelo. Para namorar: reputação 70+ e servir ao reino. Para casar: reputação 80+."],
      ["Namoro", "Com amizade de Amigo (2 corações), use 'Convidar para namorar'."],
      ["Casamento", "Compre o Anel de Compromisso no Ourives e peça com amizade 75+."],
      ["Filhos", "Fale com seu cônjuge dentro de casa: 'Conversar sobre ter um filho'."],
      ["Adoção", "No Templo da Luz (ou Capela do Mar), por 50 de ouro, mesmo sem casar."],
      ["Escola", "Matricule os filhos na Escola de Cinzaluz. Aulas das 8h às 14h."],
      ["Filhos crescem", "Bebê, criança, adolescente (10 dias) e adulto (16 dias). Adultos namoram, casam e dão netos."],
      ["Casamento arranjado", "Fale com um filho adulto: escolha um pretendente e receba o dote. Filhos felizes aceitam mais."],
    ],
  ],
  [
    "Simulador de Vida",
    [
      ["O modo", "No título, escolha Simulador de Vida: sem runas nem batalhas, só a vida na vila."],
      ["Necessidades", "Fome, sede, energia, higiene e diversão. Baixas, elas diminuem o pagamento."],
      ["Trabalhos", "Quadro de Trabalhos da praça: feira (minijogo), tendinha própria (licença) e Guarda Real."],
      ["Guarda Real", "Turnos no castelo com patentes: Recruta, Soldado, Sargento e Capitão. Vale nos dois modos."],
    ],
  ],
  [
    "Vida na vila",
    [
      ["Casa", "Compre móveis na Marcenaria e decore com R."],
      ["Mascotes", "Adote no Abrigo dos Bichos. Faça carinho todo dia para manter o bônus."],
      ["Taverna", "Festa toda noite das 18h às 2h: dança, bebida, queda de braço."],
      ["Festivais", "A cada 7 dias a praça vira festa. A família real desfila a cada 5 dias."],
      ["Reputação", "Boas ações sobem, brigas e traições descem. Muda preços e conversas."],
      ["Elfos", "No Bosque. Dão bênção em troca de flores e trocam ervas por elixir."],
    ],
  ],
];

let guideReturnMode = "world";

function openGuide() {
  guideReturnMode = game.mode === "guide" ? guideReturnMode : game.mode;
  game.mode = "guide";
  const html =
    `<div class="gh"><h2>Guia do Aprendiz</h2><button id="guideclose">Fechar (Esc)</button></div>` +
    GUIDE_SECTIONS.map(
      ([title, items]) =>
        `<h3>${title}</h3>` +
        items
          .map(([name, text]) => `<div class="guide-row"><b>${name}</b><span>${text}</span></div>`)
          .join(""),
    ).join("");
  const box = byId("guide");
  box.innerHTML = html;
  box.style.display = "block";
  byId("guideclose").onclick = closeGuide;
}

function closeGuide() {
  byId("guide").style.display = "none";
  game.mode = guideReturnMode === "guide" ? "world" : guideReturnMode;
  if (game.mode === "options") renderOptions();
}

/* ==========================================================================
   CRÉDITOS
   ========================================================================== */

const TEAM = [
  ["Andressa Rabêlo", "823213904"],
  ["Lucas Marzocca", "823116813"],
  ["Marcos V. Santos", "82327399"],
  ["Matheus H. F.", "823141914"],
  ["Mylena Soares", "824144075"],
];

let creditsReturnMode = "title";

function openCredits() {
  creditsReturnMode = game.mode === "credits" ? creditsReturnMode : game.mode;
  game.mode = "credits";
  byId("title").style.display = "none";
  byId("end").style.display = "none";
  const box = byId("credits");
  box.innerHTML = `
    <h1>Ecos do Arcano</h1>
    <div class="sub">A Magia Perdida</div>
    <h3>Equipe</h3>
    <div class="team">${TEAM.map(([name, ra]) => `<div><b>${name}</b><span>RA ${ra}</span></div>`).join("")}</div>
    <div class="credits-note">Universidade São Judas Tadeu · 2026<br>
    Feito com HTML5, CSS3 e JavaScript puro. Todo o desenho, os sons e a música são gerados pelo próprio jogo.</div>
    <div class="btns"><button id="creditsclose">Voltar</button></div>`;
  box.style.display = "flex";
  byId("creditsclose").onclick = closeCredits;
}

function closeCredits() {
  byId("credits").style.display = "none";
  game.mode = creditsReturnMode === "credits" ? "title" : creditsReturnMode;
  if (game.mode === "title") byId("title").style.display = "flex";
  if (game.mode === "end") byId("end").style.display = "flex";
}

/* ==========================================================================
   ESCOLAS DE PORTO BRISAMAR E PEDRAVALE
   ========================================================================== */

/** Aulas especiais: uma por dia, custam ouro e ensinam algo útil. */
const SPECIAL_SCHOOLS = {
  p19: {
    name: "Escola de Navegação",
    teacher: "Mestre Navegante Iolanda",
    intro: "Aqui se aprende a ler as estrelas, o vento e o mar.",
    lesson: "Aula de navegação (15 ouro)",
    cost: 15,
    reward: () => {
      const xp = 20 + player.lvl * 3;
      player.xp += xp;
      addItem("petisco");
      return `+${xp} XP e uma isca especial (Petisco).`;
    },
    line: "O mar não perdoa quem não presta atenção. Mas premia quem presta.",
  },
  s16: {
    name: "Escola da Serra",
    teacher: "Mestra Anã Brunna",
    intro: "Aprendemos a ouvir a pedra. Ela também canta, sabia?",
    lesson: "Aula de mineração (15 ouro)",
    cost: 15,
    reward: () => {
      const xp = 20 + player.lvl * 3;
      player.xp += xp;
      addItem("pedra");
      return `+${xp} XP e uma Pedra de Golem para a forja.`;
    },
    line: "Bata onde a pedra canta mais grave. É ali que mora o cristal.",
  },
};

function specialSchoolMenu(id) {
  const school = SPECIAL_SCHOOLS[id];
  const dayKey = "school_" + id;
  const done = (player.famDay || {})[dayKey] === player.day;
  choice(school.name, school.intro, [
    {
      t: done ? "Aula de hoje concluída" : school.lesson,
      fn: () => {
        if (done) return;
        if (player.gold < school.cost) {
          say([[school.teacher, `A aula custa ${school.cost} de ouro.`]]);
          return;
        }
        player.gold -= school.cost;
        player.famDay[dayKey] = player.day;
        const result = school.reward();
        saveGame();
        say([
          [school.teacher, school.line],
          ["", `Aula concluída! ${result}`],
        ]);
      },
    },
    { t: "Matricular meus filhos (Escola de Cinzaluz)", fn: schoolMenu },
    { t: "Sair", fn: null },
  ]);
}
