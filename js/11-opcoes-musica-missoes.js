/**
 * ECOS DO ARCANO — 11-opcoes-musica-missoes.js
 * Tela de opções, música de fundo, qualidade gráfica, pedidos de Porto Brisamar
 * e Pedravale, e as interações extras com elfos, filhos crescidos e família secreta.
 */

/* ==========================================================================
   CONFIGURAÇÕES
   ========================================================================== */

const SETTINGS_KEY = "ecos-settings";
const DEFAULT_SETTINGS = { sfx: 0.8, music: 0.5, vibrate: true, quality: "auto" };

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
  alta: { label: "Alta", pixelRatio: 2, walkers: 1, ambience: true, weather: 1 },
  media: { label: "Média", pixelRatio: 1.5, walkers: 0.7, ambience: true, weather: 0.6 },
  baixa: { label: "Baixa", pixelRatio: 1, walkers: 0.45, ambience: false, weather: 0.35 },
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
  html += `<h3>Controles</h3><div class="controls">${CONTROLS_HELP.map(([a, k]) => `<div><b>${a}</b><span>${k}</span></div>`).join("")}</div>`;
  const box = byId("options");
  box.innerHTML = html;

  byId("optclose").onclick = closeOptions;
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
    { t: "Conversar", fn: () => say([[elf.nm, ELF_LINES[Math.floor(Math.random() * ELF_LINES.length)]]]) },
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
  return [
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
}

const SECRET_VISIT_GIFTS = ["pao", "doce", "mel", "flor"];

function secretVisitGift() {
  if (Math.random() >= 0.45) return "";
  const gift = SECRET_VISIT_GIFTS[Math.floor(Math.random() * SECRET_VISIT_GIFTS.length)];
  addItem(gift);
  return ` Na despedida, você ganha ${ITEMS[gift].nome}.`;
}
