/* 02-estado-som-e-sprites.js: junta 02-estado-som-sprites.js, 29-icones-pixel.js. */
/**
 * ECOS DO ARCANO — 02-estado-som-e-sprites.js
 * Estado do jogador, salvamento, efeitos sonoros e funções de desenho de sprites.
 */

/* ===================== ESTADO ===================== */

function newPlayer() {
  return {
    name: "Aprendiz",
    gender: "n",
    look: {
      skin: "#f1c8a5",
      hair: "#3a2414",
      hstyle: "curto",
      hat: "mago",
      hatc: "#2a2f6e",
      outfit: "manto",
      robe: "#3d4fa8",
      eyes: "#222222",
      acc: "nenhum",
      staffc: "#ffe066",
      aura: "nenhuma",
    },
    owned: {
      hstyle: [],
      hair: [],
      hat: [],
      outfit: [],
      robe: [],
      eyes: [],
      acc: [],
      staffc: [],
      aura: [],
    },
    dating: null,
    spouse: null,
    married: 0,
    lovers: [],
    sspouses: [],
    skids: [],
    rep: 50,
    pets: [],
    petA: null,
    drunk: 0,
    rudeCount: 0,
    raidsWon: 0,
    festWins: 0,
    furn: [
      {
        id: "cama",
        x: 2,
        y: 2,
      },
      {
        id: "armario",
        x: 5,
        y: 2,
      },
      {
        id: "lareira",
        x: 10,
        y: 2,
      },
      {
        id: "mesa",
        x: 10,
        y: 5,
      },
      {
        id: "cadeira",
        x: 9,
        y: 5,
      },
      {
        id: "tapete",
        x: 6,
        y: 5,
      },
    ],
    kids: [],
    famDay: {},
    zone: "vila",
    x: 5,
    y: 18,
    checkpoint: {
      zone: "vila",
      x: 5,
      y: 18,
    },
    blessDay: 0,
    royal: [],
    seen: {},
    dir: "down",
    hp: 60,
    basehp: 60,
    mp: 30,
    basemp: 30,
    lvl: 1,
    xp: 0,
    diff: "normal",
    gold: 40,
    inv: {
      pocao: 2,
      eter: 1,
      pao: 2,
      agua: 2,
      cajado1: 1,
      manto1: 1,
    },
    eq: {
      cajado: "cajado1",
      manto: "manto1",
      armadura: null,
      amuleto: null,
    },
    rel: {},
    relDay: {},
    relRew: {},
    day: 1,
    jobs: [],
    board: null,
    horse: false,
    riding: false,
    visited: ["vila"],
    books: [],
    tomes: [],
    raidDay: 0,
    food: 80,
    water: 80,
    injured: false,
    clock: 8 * 60,
    aff: "fogo",
    order: ["fogo", "terra", "agua", "ar"],
    flags: {},
    runes: ["fogo"],
    spells: [],
    pages: [],
    taken: [],
    guards: [],
    best: {},
    playtime: 0,
  };
}
/* ---- atributos, inventário e tempo ---- */

function equipStat(k) {
  let v = 0;
  for (const sl in player.eq) {
    const id = player.eq[sl];
    if (id && ITEMS[id] && ITEMS[id][k]) v += ITEMS[id][k];
  }
  return v;
}
function hasMoon() {
  return Object.values(player.eq).some((id) => id && ITEMS[id].moon);
}
function maxHp() {
  return Math.max(
    1,
    Math.round((player.basehp + equipStat("hp")) * (player.injured ? 0.5 : 1)),
  );
}
function maxMp() {
  return player.basemp + equipStat("mp");
}
function itemCount(id) {
  return player.inv[id] || 0;
}
function addItem(id, n = 1) {
  player.inv[id] = itemCount(id) + n;
}
function removeItem(id, n = 1) {
  player.inv[id] = Math.max(0, itemCount(id) - n);
  if (!player.inv[id]) delete player.inv[id];
}
function starving() {
  return player.food <= 0 || player.water <= 0;
}
function dmgMul(els) {
  let m = 1 + equipStat("pow");
  if (els.includes(player.aff)) m *= 1.25;
  const st = ITEMS[player.eq.cajado];
  if (st && st.el && els.includes(st.el)) m *= 1 + st.elb;
  if (battle && battle.fury > 0) m *= 1.8;
  if (starving()) m *= 0.75;
  if (player.blessDay === player.day) m *= 1.1;
  if (player.injured) m *= 0.8;
  if (player.sick) m *= 0.85;
  m *= 1 + (player.darkPower || 0);
  // A turma de Cinzaluz ajuda na batalha final.
  if (battle && battle.type === "silenciador" && crewReady()) m *= 1.25;
  m *= 1 + 0.05 * (player.ecos || []).length;
  if ((player.drunk || 0) >= 40) m *= 1.1;
  if (player.liquidCourage && game.mode === "battle") m *= 1.15;
  m *= difficulty().spPow || 1;
  // Clima e hora do dia: média da força das runas usadas.
  m *= els.reduce((a, e) => a + weatherMul(e), 0) / Math.max(1, els.length);
  return m;
}
const SEASONS = [
  {
    id: "pri",
    n: "Primavera",
    ic: "",
  },
  {
    id: "ver",
    n: "Verão",
    ic: "",
  },
  {
    id: "out",
    n: "Outono",
    ic: "",
  },
  {
    id: "inv",
    n: "Inverno",
    ic: "",
  },
];
function season() {
  return SEASONS[Math.floor((player.day - 1) / 7) % 4];
}
function seasonDay() {
  return ((player.day - 1) % 7) + 1;
}
/** Cada clima deixa duas runas mais fortes e uma ou duas mais fracas (só ao ar livre). */
const WEATHER = {
  sol: {
    n: "Ensolarado",
    ic: "",
    fx: "Chama +15% e Luz +20%. Maré −15% e Sombra −20%.",
    mul: { fogo: 1.15, luz: 1.2, agua: 0.85, sombra: 0.8 },
  },
  nublado: {
    n: "Nublado",
    ic: "",
    fx: "Vento +10% e Sombra +10%. Luz −10%.",
    mul: { ar: 1.1, sombra: 1.1, luz: 0.9 },
  },
  chuva: {
    n: "Chuva",
    ic: "",
    fx: "Maré +20% e Terra +10%. Chama −20%. A sede cai mais devagar. Moradores ficam em casa.",
    mul: { agua: 1.2, terra: 1.1, fogo: 0.8 },
  },
  tempestade: {
    n: "Tempestade",
    ic: "",
    fx: "Vento +25% e Maré +10%. Chama −15% e Terra −10%. Monstros +10% de ataque.",
    mul: { ar: 1.25, agua: 1.1, fogo: 0.85, terra: 0.9 },
  },
  neve: {
    n: "Neve",
    ic: "",
    fx: "Maré +15% e Terra +5%. Chama −15% e Vento −5%. A fome cai mais rápido.",
    mul: { agua: 1.15, terra: 1.05, fogo: 0.85, ar: 0.95 },
  },
  neblina: {
    n: "Neblina",
    ic: "",
    fx: "Sombra +20% e Vento +5%. Luz −15%. Visão reduzida.",
    mul: { sombra: 1.2, ar: 1.05, luz: 0.85 },
  },
};
/** Força de uma runa agora: clima ao ar livre + dia (Luz) ou noite (Sombra). */
function weatherMul(rune) {
  if (!player.zone || !outdoorTheme(ZONES[player.zone].theme)) return 1;
  let m = currentWeather().mul[rune] || 1;
  if (isNight()) m *= rune === "sombra" ? 1.1 : rune === "luz" ? 0.9 : 1;
  else m *= rune === "luz" ? 1.05 : 1;
  return m;
}
/** Seta para cima, para baixo ou nada, conforme a força da runa agora. */
function weatherMark(rune) {
  const m = weatherMul(rune);
  return m > 1.001 ? "up" : m < 0.999 ? "down" : "";
}
const WCHANCE = {
  pri: [
    ["sol", 40],
    ["nublado", 25],
    ["chuva", 25],
    ["neblina", 10],
  ],
  ver: [
    ["sol", 60],
    ["nublado", 15],
    ["chuva", 10],
    ["tempestade", 15],
  ],
  out: [
    ["sol", 25],
    ["nublado", 30],
    ["chuva", 25],
    ["neblina", 15],
    ["tempestade", 5],
  ],
  inv: [
    ["sol", 25],
    ["nublado", 25],
    ["neve", 40],
    ["neblina", 10],
  ],
};
function currentWeather() {
  return WEATHER[player.weather] || WEATHER.sol;
}
function rollWeather(announce) {
  const tb = WCHANCE[season().id],
    tot = tb.reduce((a, b) => a + b[1], 0);
  let r = Math.random() * tot,
    w = "sol";
  for (const [k, p] of tb) {
    if ((r -= p) < 0) {
      w = k;
      break;
    }
  }
  if (season().id !== "inv" && w === "neve") w = "chuva";
  if (season().id === "inv" && (w === "chuva" || w === "tempestade"))
    w = "neve";
  const old = player.weather;
  player.weather = w;
  player.wLeft = 180 + Math.random() * 300;
  if (announce && old !== w) {
    const msg = {
      sol: " O sol abriu.",
      nublado: " O céu ficou nublado.",
      chuva: " Começou a chover.",
      tempestade: " Uma tempestade se aproxima!",
      neve: " Começou a nevar.",
      neblina: " Uma neblina densa cobriu tudo.",
    }[w];
    toast(msg + " " + WEATHER[w].fx, 4200);
  }
}
function outdoorTheme(th) {
  return !["torre", "escola", "casa", "interior", "mina"].includes(th);
}
function currentHour() {
  return player.clock / 60;
}
function nightAlpha() {
  const h = currentHour();
  if (h >= 19.5 || h < 5) return 0.62;
  if (h >= 17.5) return (0.62 * (h - 17.5)) / 2;
  if (h < 6.5) return (0.62 * (6.5 - h)) / 1.5;
  return 0;
}
function isNight() {
  return nightAlpha() > 0.4;
}
const FESTS = [
  {
    n: "Festival das Flores",
    c: ["#ff6b8a", "#f5d76e", "#ffffff", "#c77dff"],
  },
  {
    n: "Festival da Colheita",
    c: ["#d9a441", "#c94a4a", "#7ab04a", "#f2a83a"],
  },
  {
    n: "Festival das Lanternas",
    c: ["#f2c14e", "#ff9a3c", "#c77dff", "#5fd0ff"],
  },
  {
    n: "Festival das Runas",
    c: ["#ff7a3d", "#4fb8ff", "#9ff0cf", "#e0ab62"],
  },
];
function festivalToday() {
  return player.day % 7 === 0
    ? FESTS[(Math.floor(player.day / 7) - 1) % 4]
    : null;
}
function daysToFest() {
  return (7 - (player.day % 7)) % 7;
}
function sleepTime() {
  const h = currentHour();
  return h >= 22 || h < 6;
}
const AWAKE = new Set([
  "guarda",
  "guarda2",
  "tome",
  "curandeira",
  "bardo",
  "odelia",
  "selene",
  "espirito",
  "druida",
  "pescador",
  "monge",
  "honda",
]);
function npcAsleep(id) {
  return (
    sleepTime() && !festivalToday() && !AWAKE.has(id) && ZONES[player.zone].town
  );
}
const ROAMERS = new Set([
  "lia",
  "tome",
  "odelia",
  "iara",
  "marina",
  "tobias",
  "capitao",
  "ancia",
  "portoA",
  "portoB",
  "serraA",
  "kael",
  "curandeira",
  "ferreiro",
  "zaid",
  "cocheiro",
  "bardo",
  "cocheiro2",
  "cocheiro3",
  "conchas",
  "peleiro",
  "minerA",
]);
function isStallKeeper(x, y) {
  const z = ZONES[player.zone];
  return DIRS4.some(([dx, dy]) => {
    const c = tileAt(player.zone, x + dx, y + dy);
    return c === "M";
  });
}
function npcHidden(id) {
  return (
    id === player.spouse ||
    npcAsleep(id) ||
    (ROAMERS.has(id) &&
      !!ZONES[player.zone].town &&
      !!(game.roam || []).find((r) => r.id === id))
  );
}
function roamAt(x, y) {
  return (game.roam || []).find(
    (r) => r.x === x && r.y === y && !npcAsleep(r.id) && r.id !== player.spouse,
  );
}
const CLOSED_STYLES = new Set([
  "peixaria",
  "acougue",
  "armazem",
  "tecidos",
  "boticario",
  "livraria",
  "emporio",
  "escola",
  "padaria",
  "forja",
  "alfaiate",
  "troca",
  "salao",
  "perola",
  "moda",
  "cristal",
  "marcenaria",
  "guilda",
  "biblio",
]);
/* ===================== ÍCONES EM PIXEL ===================== */

/** Ícones 8x8 desenhados em pixel (no lugar de emojis). Cada linha é uma string; "." é vazio. */
const PIXEL_ICONS = {
  lock: {
    c: { g: "#f2c14e", d: "#7a5a1a" },
    p: ["..ddd...", ".d...d..", "ggggggg.", "gggdggg.", "gggdggg.", "ggggggg."],
  },
  heart: {
    c: { r: "#e0306a" },
    p: [".rr.rr..", "rrrrrrr.", "rrrrrrr.", ".rrrrr..", "..rrr...", "...r...."],
  },
  anger: {
    c: { r: "#e0303a" },
    p: ["r.r..r.r", ".rr..rr.", "........", "........", ".rr..rr.", "r.r..r.r"],
  },
  sweat: {
    c: { b: "#4fb8ff", w: "#cfeaff" },
    p: ["...b....", "..bbb...", ".bwbbb..", ".bwbbb..", ".bbbbb..", "..bbb..."],
  },
  blush: {
    c: { k: "#222", p: "#ff8aa8" },
    p: ["........", ".k...k..", "........", "pp...pp.", "..kkk...", "........"],
  },
  laugh: {
    c: { k: "#222" },
    p: ["........", "k.k.k.k.", ".k...k..", "........", ".kkkkk..", "..kkk..."],
  },
  smile: {
    c: { k: "#222" },
    p: ["........", ".k...k..", ".k...k..", "........", "k.....k.", ".kkkkk.."],
  },
  meh: {
    c: { k: "#222" },
    p: ["........", ".kk.kk..", "........", "........", ".kkkkk..", "........"],
  },
  chat: {
    c: { w: "#f2f2f2", k: "#555", o: "#9a9aa8" },
    p: [".ooooo..", "owwwwwo.", "owkwkwo.", "owwwwwo.", ".oowoo..", "...o...."],
  },
  wave: {
    c: { s: "#f1c8a5", k: "#a87a5a" },
    p: ["s.s.s...", "s.s.s.s.", "sssss.s.", "ssssss..", ".ssss...", "..kk...."],
  },
  party: {
    c: { y: "#f2c14e", r: "#e0306a", b: "#4fb8ff" },
    p: ["r..y..b.", "...y....", ".yyyyy..", "..yyy...", "b..y..r.", "...y...."],
  },
  crown: {
    c: { y: "#f2c14e", r: "#e0303a" },
    p: ["y..y..y.", "yy.y.yy.", "yyyyyyy.", "yryyyry.", "yyyyyyy.", "........"],
  },
  coin: {
    c: { y: "#f2c14e", d: "#b8862a" },
    p: ["..yyy...", ".yyyyy..", "yydddyy.", "yyyyyyy.", ".yyyyy..", "..yyy..."],
  },
  apple: {
    c: { r: "#e0303a", g: "#5a9a4a", w: "#ffb3b3" },
    p: ["...g....", "..g.....", ".rrrrr..", "rwrrrrr.", "rrrrrrr.", ".rr.rr.."],
  },
  sparkle: {
    c: { y: "#f2c14e", w: "#fff6c0" },
    p: ["...y....", "...y....", "yywwwyy.", "...y....", "...y....", "........"],
  },
  mug: {
    c: { y: "#f2c14e", w: "#fff", b: "#8a5a2e" },
    p: ["wwwww...", "yyyyybb.", "yyyyy.b.", "yyyyybb.", "yyyyy...", "bbbbb..."],
  },
  note: {
    c: { k: "#5a3a9a" },
    p: ["...kkkk.", "...k..k.", "...k..k.", ".kkk.kk.", "kkkkkkk.", ".kk..k.."],
  },
  eye: {
    c: { k: "#222", w: "#fff" },
    p: ["........", ".wwwww..", "wwkkkww.", "wwkkkww.", ".wwwww..", "........"],
  },
  fish: {
    c: { b: "#6aa8c8", k: "#222" },
    p: ["........", ".bbbb..b", "bbkbbbbb", "bbbbbbbb", ".bbbb..b", "........"],
  },
  gift: {
    c: { r: "#e0303a", y: "#f2c14e" },
    p: ["..y.y...", "rrryrrr.", "rrryrrr.", "yyyyyyy.", "rrryrrr.", "rrryrrr."],
  },
  door: {
    c: { b: "#8a5a2e", d: "#5a3a1e", y: "#f2c14e" },
    p: [".bbbbb..", ".bdddb..", ".bdddb..", ".bddyb..", ".bdddb..", ".bdddb.."],
  },
  scroll: {
    c: { p: "#efe2c0", b: "#a8844e", k: "#7a6a4a" },
    p: ["bppppb..", ".pkkkp..", ".ppppp..", ".pkkkp..", ".ppppp..", "bppppb.."],
  },
  zzz: {
    c: { b: "#7fb6ff" },
    p: ["...bbbb.", ".....b..", "....b...", "bbbbbbb.", "..b.....", "bbbb...."],
  },
  sword: {
    c: { s: "#d9d9e8", b: "#8a5a2e", y: "#f2c14e" },
    p: ["......s.", ".....s..", "....s...", ".y.s....", "..b.....", ".b.y...."],
  },
  bag: {
    c: { b: "#a8784a", d: "#7a5230" },
    p: ["..dd....", ".d..d...", "bbbbbb..", "bbddbb..", "bbbbbb..", ".bbbb..."],
  },
  potion: {
    c: { g: "#cfd8e8", r: "#e0306a", w: "#ffb3c8" },
    p: ["..gg....", "..gg....", ".rrrr...", "rrwrrr..", "rrrrrr..", ".rrrr..."],
  },
  house: {
    c: { r: "#c94a4a", w: "#e8dcc0", b: "#5a3a1e" },
    p: ["...r....", "..rrr...", ".rrrrr..", "rrrrrrr.", ".wwbww..", ".wwbww.."],
  },
  star: {
    c: { y: "#f2c14e" },
    p: ["...y....", "..yyy...", "yyyyyyy.", ".yyyyy..", ".yy.yy..", "y.....y."],
  },
  baby: {
    c: { s: "#f1c8a5", p: "#ff9ab0", w: "#f6efe2" },
    p: ["..ss....", ".ssss...", ".spps...", "wwwwww..", "wwwwww..", ".wwww..."],
  },
  skull: {
    c: { w: "#e8e4dc", k: "#222" },
    p: [".wwwww..", "wwwwwww.", "wkkwkkw.", "wwwwwww.", ".wwkww..", ".w.w.w.."],
  },
  /* ---- comida e bebida ---- */
  bread: {
    c: { b: "#a8662a", B: "#d9a050", w: "#f2d8a0" },
    p: ["........", ".bbbbb..", "bBBBBBb.", "bBwBwBb.", "bBBBBBb.", ".bbbbb.."],
  },
  meat: {
    c: { r: "#b0502a", R: "#d9703a", w: "#f0e6d0" },
    p: ["....ww..", "...wwww.", ".rrRw...", "rRRrr...", "rrrr....", ".rr....."],
  },
  cheese: {
    c: { y: "#f2c94e", o: "#c99a2a" },
    p: ["........", "....yyy.", "..yyyyy.", "yyoyyoy.", "yyyyyyy.", "yoyyyyy."],
  },
  stew: {
    c: { s: "#d9d9e8", b: "#8a5a2e", o: "#c9602a" },
    p: [".s.s.s..", "..s.s...", "bbbbbbb.", "booooob.", ".bbbbb..", "..bbb..."],
  },
  cake: {
    c: { w: "#fff6e8", p: "#ff9ab0", b: "#c98a4a", r: "#e0303a" },
    p: ["...r....", ".wwwwww.", ".pppppp.", ".bbbbbb.", ".pppppp.", ".bbbbbb."],
  },
  pie: {
    c: { b: "#d9a050", B: "#f2c880", d: "#8a5a2e" },
    p: ["........", "..bbbb..", ".bBBBBb.", "bBbBbBBb", "bbbbbbbb", ".dddddd."],
  },
  water: {
    c: { b: "#4fb8ff", w: "#cfeaff" },
    p: ["...b....", "..bbb...", ".bbwbb..", "bbwbbbb.", "bbbbbbb.", ".bbbbb.."],
  },
  canteen: {
    c: { k: "#8a5a2e", c: "#6a4a2a", b: "#4fb8ff", w: "#cfeaff" },
    p: ["..kk....", "..cc....", ".cbbc...", "cbwbbc..", "cbbbbc..", ".cccc..."],
  },
  tea: {
    c: { w: "#f2f2f2", g: "#7ab04a", s: "#d9d9e8" },
    p: [".s..s...", "..s.....", "wwwwww..", "wggggww.", "wggggw..", ".wwww..."],
  },
  wine: {
    c: { g: "#3a5a3a", r: "#8a2a4a", k: "#5a3a22" },
    p: ["...k....", "...g....", "..ggg...", "..grg...", "..grg...", "..ggg..."],
  },
  honey: {
    c: { y: "#f2c14e", b: "#a8662a" },
    p: ["..yyy...", ".bbbbb..", "byyyyyb.", "byyyyyb.", "byyyyyb.", ".bbbbb.."],
  },
  potionB: {
    c: { g: "#cfd8e8", b: "#4f7aff", w: "#b8ccff" },
    p: ["..gg....", "..gg....", ".bbbb...", "bbwbbb..", "bbbbbb..", ".bbbb..."],
  },
  herb: {
    c: { g: "#5a9a4a", G: "#3a6a2a" },
    p: ["....gg..", "...ggg..", "..gGg...", ".gGg....", ".Gg.....", "G......."],
  },
  /* ---- roupas e aparência ---- */
  shirt: {
    c: { r: "#4a7ad9", d: "#f2c14e" },
    p: ["rr...rr.", "rrrrrrr.", ".rrrrr..", ".rrdrr..", ".rrrrr..", ".rrrrr.."],
  },
  hat: {
    c: { h: "#3a2878", y: "#f2c14e" },
    p: ["...h....", "..hh....", "..hhh...", ".hhhhh..", ".yyyyy..", "hhhhhhh."],
  },
  robe: {
    c: { r: "#5b3fa8", y: "#f2c14e", k: "#f1c8a5" },
    p: ["..kkk...", ".rrrrr..", "rrryrrr.", "rrryrrr.", "rrrrrrr.", "rrrrrrr."],
  },
  hair: {
    c: { h: "#8a3a1a", s: "#f1c8a5", k: "#222" },
    p: [".hhhh...", "hhhhhh..", "hssssh..", "hskskh..", "hssssh..", "h....h.."],
  },
  glasses: {
    c: { k: "#222", b: "#bfe0f0" },
    p: ["........", "........", "kkk.kkk.", "kbkkkbk.", "kkk.kkk.", "........"],
  },
  staff: {
    c: { g: "#ffe066", b: "#8a5a2e" },
    p: [".....gg.", ".....gg.", "....b...", "...b....", "..b.....", ".b......"],
  },
  armor: {
    c: { s: "#5a6a7a", S: "#cfd3e6", y: "#f2c14e" },
    p: [".ssssss.", ".sSSSSs.", ".sSySSs.", ".sSSSSs.", "..sSSs..", "...ss..."],
  },
  amulet: {
    c: { y: "#f2c14e", p: "#c77dff", w: "#f0e0ff" },
    p: [".y...y..", "..y.y...", "...y....", "..ppp...", ".pwppp..", "..ppp..."],
  },
  /* ---- outros itens ---- */
  gem: {
    c: { c: "#6ab0d0", w: "#e0f6ff" },
    p: ["........", "..ccc...", ".cwccc..", "ccccccc.", ".ccccc..", "..ccc..."],
  },
  chair: {
    c: { b: "#8a5a2e", B: "#b07a40" },
    p: [".b......", ".b......", ".b......", ".BBBBB..", ".b...b..", ".b...b.."],
  },
  paw: {
    c: { k: "#8a5a3a" },
    p: [".k..k...", "........", "k.kk.k..", "..kkk...", ".kkkkk..", ".kk.kk.."],
  },
  rod: {
    c: { k: "#8a5a2e", w: "#d9d9d9", o: "#e0303a" },
    p: [".....k..", "....k.w.", "...k..w.", "..k...w.", ".k....w.", "k.....o."],
  },
  ring: {
    c: { w: "#e0f6ff", y: "#f2c14e" },
    p: ["...w....", "..yyy...", ".y...y..", ".y...y..", "..yyy...", "........"],
  },
  book: {
    c: { r: "#8a3a7a", w: "#efe2c0", k: "#888" },
    p: [".rrrrr..", ".rwwwwr.", ".rwkkwr.", ".rwwwwr.", ".rrrrr..", "........"],
  },
  flower: {
    c: { p: "#ff6b8a", y: "#f2c14e", g: "#5a9a4a" },
    p: [".p.p....", "ppypp...", ".ppp....", "..g.....", ".gg.....", "..g....."],
  },
  feather: {
    c: { w: "#f2c14e", y: "#a8862a" },
    p: [".....ww.", "....wwy.", "...wwy..", "..wwy...", ".wy.....", "y......."],
  },
  /* ---- clima ---- */
  sun: {
    c: { y: "#f2c14e", o: "#ff9a3c" },
    p: ["y..y..y.", ".yyyyy..", "yyoooyy.", ".yyyyy..", "y..y..y.", "........"],
  },
  cloud: {
    c: { w: "#d9d9e8" },
    p: ["........", "..www...", ".wwwww..", "wwwwwww.", ".wwwww..", "........"],
  },
  rain: {
    c: { g: "#9a9aa8", b: "#4fb8ff" },
    p: ["..ggg...", ".ggggg..", "ggggggg.", "........", ".b.b.b..", "b.b.b..."],
  },
  storm: {
    c: { g: "#6a6a7a", y: "#f2c14e" },
    p: ["..ggg...", ".ggggg..", "ggggggg.", "...y....", "..y.....", ".y......"],
  },
  snow: {
    c: { w: "#e8f4ff" },
    p: ["w..w..w.", ".w.w.w..", "..www...", "wwwwwww.", "..www...", ".w.w.w.."],
  },
  fog: {
    c: { g: "#b8b8c8" },
    p: ["........", "ggggg...", "..ggggg.", "ggggg...", "..ggggg.", "........"],
  },
};

/* ---- trabalho, viagem e tempo (acrescentados aos ícones acima) ---- */
Object.assign(PIXEL_ICONS, {
  axe: {
    c: { s: "#cfd3e6", b: "#8a5a2e" },
    p: ["..sss...", ".ssss...", "..ssb...", "....b...", "....b...", "....b..."],
  },
  pick: {
    c: { s: "#9aa0b0", b: "#8a5a2e" },
    p: [".sssss..", "s..b..s.", "...b....", "...b....", "...b....", "...b...."],
  },
  wheat: {
    c: { y: "#e8c24a", g: "#7a9a3a" },
    p: [".y.y.y..", "yyyyyy..", ".yyyy...", "..gg....", "..g.....", "..g....."],
  },
  hammer: {
    c: { s: "#9aa0b0", b: "#8a5a2e" },
    p: ["sssss...", "sssss...", "..b.....", "..b.....", "..b.....", "..b....."],
  },
  horse: {
    c: { b: "#8a5a3a", k: "#3a2414" },
    p: ["....kb..", "...bbbb.", "bbbbbb..", "bbbbbb..", "b.b.b.b.", "b.b.b.b."],
  },
  crate: {
    c: { b: "#b07a40", d: "#7a5230" },
    p: ["dddddd..", "dbbbbd..", "dbddbd..", "dbbbbd..", "dddddd..", "........"],
  },
  clock: {
    c: { w: "#e8e4dc", k: "#3a3a44" },
    p: [".kkkk...", "kwwkwk..", "kwwkwk..", "kwwkkk..", "kwwwwk..", ".kkkk..."],
  },
  pause: {
    c: { w: "#e8e4dc" },
    p: ["........", ".ww.ww..", ".ww.ww..", ".ww.ww..", ".ww.ww..", "........"],
  },
  flag: {
    c: { r: "#c94a4a", b: "#5a3a22" },
    p: ["brrrr...", "brrrrr..", "brrrr...", "b.......", "b.......", "b......."],
  },
  bolt: {
    c: { y: "#f2e14e", o: "#c99a2a" },
    p: ["...yy...", "..yy....", ".yyyyy..", "...yy...", "..yy....", ".o......"],
  },
  soap: {
    c: { p: "#f2a8c8", w: "#ffffff", b: "#bfe0f0" },
    p: [".w..b...", "w.w.....", ".w.pppp.", "...pwpp.", "...pppp.", "........"],
  },
  joy: {
    c: { y: "#f2c14e", k: "#3a2414", r: "#e0306a" },
    p: [".yyyyy..", "yykykyy.", "yyyyyyy.", "ykyyyky.", "yykkkyy.", ".yyyyy.."],
  },
  bath: {
    c: { w: "#e8e4dc", b: "#4fb8ff" },
    p: ["........", ".b.b.b..", "wwwwwww.", "wbbbbbw.", ".wwwww..", ".w...w.."],
  },
});

/** Ícone de cada item. Os que não estão aqui usam o ícone do tipo (veja itemIcon). */
const ITEM_ICONS = {
  facao: "sword", facaoA: "sword",
  pocao: "potion", pocaoG: "potion", perfume: "potion",
  eter: "potionB", eterG: "potionB", elixir: "potionB",
  ervas: "herb", ervaS: "herb", fenix: "feather", pena: "feather", penaH: "feather",
  pao: "bread", carne: "meat", linguica: "meat", assado: "meat", torta: "pie",
  queijo: "cheese", vinho: "wine", doce: "cake", bolo: "cake", mel: "honey",
  maca: "apple", ensopado: "stew", caldeirada: "stew", agua: "canteen", cha: "tea",
  hidromel: "mug", carpa: "fish", peixeR: "fish", peixe: "fish",
  vara: "rod", perolaN: "gem", bota: "bag", lenco: "gift", livro: "book", papiro: "scroll",
  flor: "flower", brinquedo: "gift", racao: "paw", petisco: "paw",
  anel: "ring", coroa: "crown", oculosHonda: "glasses",
};
const SLOT_ICONS = { cajado: "staff", manto: "robe", armadura: "armor", amuleto: "amulet" };
const TYPE_ICONS = { food: "bread", cons: "potion", gift: "gift", pet: "paw", movel: "chair", mat: "gem", tool: "rod" };
function itemIcon(id) {
  const it = ITEMS[id];
  if (!it) return "bag";
  return ITEM_ICONS[id] || SLOT_ICONS[it.slot] || TYPE_ICONS[it.tipo] || "bag";
}
const WEATHER_ICONS = { sol: "sun", nublado: "cloud", chuva: "rain", tempestade: "storm", neve: "snow", neblina: "fog" };
/** Ícone de cada parte da aparência nas lojas de roupa e cabelo. */
const COSMETIC_ICONS = {
  hstyle: "hair", hair: "hair", hat: "hat", outfit: "shirt", robe: "robe",
  eyes: "eye", acc: "glasses", staffc: "staff", aura: "sparkle",
};

const pixelIconCache = {};

/** Ícone em pixel como <img> para usar nos menus (HTML). */
function iconHTML(key, size = 16) {
  const icon = PIXEL_ICONS[key];
  if (!icon) return "";
  if (!pixelIconCache[key]) {
    const c = document.createElement("canvas");
    c.width = 8;
    c.height = 8;
    const g = c.getContext("2d");
    icon.p.forEach((row, y) => {
      for (let x = 0; x < row.length; x++) {
        const color = icon.c[row[x]];
        if (!color) continue;
        g.fillStyle = color;
        g.fillRect(x, y + 1, 1, 1);
      }
    });
    pixelIconCache[key] = c.toDataURL();
  }
  return `<img class="pxi" src="${pixelIconCache[key]}" width="${size}" height="${size}" alt="">`;
}

/** Desenha num canvas qualquer usando as mesmas funções do jogo. */
function withContext(other, draw) {
  const previous = ctx;
  ctx = other;
  try {
    draw();
  } finally {
    ctx = previous;
  }
}

/** Desenha um ícone em pixel centralizado em (cx, cy). */
function drawPixelIcon(key, cx, cy, size = 2) {
  const icon = PIXEL_ICONS[key];
  if (!icon) return;
  const rows = icon.p;
  const ox = cx - 4 * size,
    oy = cy - (rows.length / 2) * size;
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const color = icon.c[row[x]];
      if (!color) continue;
      ctx.fillStyle = color;
      ctx.fillRect(ox + x * size, oy + y * size, size, size);
    }
  });
}

function clockStr() {
  const h = Math.floor(currentHour()),
    mi = Math.floor(player.clock % 60);
  return `Dia ${player.day} · ${season().n} · ${String(h).padStart(2, "0")}:${String(mi).padStart(2, "0")}${isNight() ? " ☾" : ""} · ${currentWeather().n}`;
}
function useItemEffect(id) {
  const it = ITEMS[id];
  const out = [];
  if (it.hp) {
    const h = Math.min(it.hp, maxHp() - player.hp);
    player.hp += Math.max(0, h);
    out.push(`+${it.hp} HP`);
  }
  if (it.mp) {
    player.mp = Math.min(maxMp(), player.mp + it.mp);
    out.push(`+${it.mp} MP`);
  }
  if (it.food) {
    player.food = Math.min(100, player.food + it.food);
    out.push(`fome +${it.food}`);
  }
  if (it.water) {
    player.water = Math.min(100, player.water + it.water);
    out.push(`sede +${it.water}`);
  }
  if (it.cure && player.injured) {
    player.injured = false;
    player.hp = Math.min(maxHp(), player.hp + 20);
    out.push("ferimentos curados");
  }
  const med = medicineEffect(id);
  if (med) out.push(med);
  if (id === "frutaS") riskyIntake("frutaS");
  removeItem(id);
  return out.join(", ");
}
let player = newPlayer();
const game = {
  bubbles: [],
  seenArr: {},
  mm: {},
  mode: "title",
  t: 0,
  dialog: null,
  mobs: [],
  grace: 0,
  moveCd: 0,
  fade: 0,
  flash: 0,
  shake: 0,
  banner: null,
  parts: [],
  floats: [],
  amb: [],
  proj: null,
  touch: null,
};
let battle = null;
let viewWidth = 640;
game.zoom = (() => {
  try {
    const z = parseFloat(localStorage.getItem("ecos-zoom"));
    if (z) return z;
  } catch (e) {}
  return matchMedia("(pointer:coarse)").matches ? 1.6 : 1.25;
})();
const pressedKeys = {};
const DIR_VECTORS = {
  up: [0, -1],
  down: [0, 1],
  left: [-1, 0],
  right: [1, 0],
};
const xpToNextLevel = (l) => Math.floor(22 * Math.pow(l, 1.5));
function saveGame() {
  try {
    for (const z in game.seenArr)
      player.seen[z] = Array.from(game.seenArr[z]).join("");
    localStorage.setItem(SAVE_KEY, JSON.stringify(player));
  } catch (e) {}
}
function loadSave() {
  try {
    const s = localStorage.getItem(SAVE_KEY);
    return s ? JSON.parse(s) : null;
  } catch (e) {
    return null;
  }
}
function clearSave() {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch (e) {}
}

/* ===================== SOM ===================== */
let audioCtx = null;
function playSound(f, d = 0.08, type = "square", vol = 0.05) {
  if (typeof settings !== "undefined") {
    if (settings.sfx <= 0) return;
    vol *= settings.sfx;
  }
  try {
    if (!audioCtx)
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const o = audioCtx.createOscillator(),
      g = audioCtx.createGain();
    o.type = type;
    o.frequency.value = f;
    g.gain.value = vol;
    o.connect(g);
    g.connect(audioCtx.destination);
    const t = audioCtx.currentTime;
    g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.start(t);
    o.stop(t + d);
  } catch (e) {}
}

/* ===================== UTIL DE DESENHO ===================== */

function shade(hex, amt) {
  const c = parseInt(hex.slice(1), 16);
  const f = (v) =>
    Math.max(
      0,
      Math.min(255, Math.round(amt < 0 ? v * (1 + amt) : v + (255 - v) * amt)),
    );
  return (
    "#" +
    ((1 << 24) | (f(c >> 16) << 16) | (f((c >> 8) & 255) << 8) | f(c & 255))
      .toString(16)
      .slice(1)
  );
}
function tileHash(x, y) {
  let h = (x * 374761393 + y * 668265263) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}
function circle(x, y, r) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}
function fillPolygon(...p) {
  ctx.beginPath();
  ctx.moveTo(p[0], p[1]);
  for (let i = 2; i < p.length; i += 2) ctx.lineTo(p[i], p[i + 1]);
  ctx.closePath();
  ctx.fill();
}
function drawSprite(rects, x, y, u, flip) {
  for (const [rx, ry, rw, rh, c] of rects) {
    ctx.fillStyle = c;
    const X = flip ? x + (16 - rx - rw) * u : x + rx * u;
    ctx.fillRect(
      Math.round(X),
      Math.round(y + ry * u),
      Math.ceil(rw * u),
      Math.ceil(rh * u),
    );
  }
}
/* ===================== ÍCONES DAS RUNAS ===================== */

/** Formas de cada elemento (viewBox 24×24): preenchimento + detalhe claro. */
const RUNE_ICON = {
  fogo: {
    fill: "M12 2C13 6 18 8 18 14a6 6 0 0 1-12 0c0-3 2-5 3-6 0 2 1 3 2 3-1-3 0-6 1-9Z",
    detail:
      "M12 13c1 1.5 2.5 2.5 2.5 4a2.5 2.5 0 0 1-5 0c0-1 .6-1.8 1.2-2.4.2.9.7 1.4 1.3 1.4-.4-1-.2-2 0-3Z",
  },
  agua: {
    fill: "M12 2C15 7 19 10.5 19 15a7 7 0 0 1-14 0c0-4.5 4-8 7-13Z",
    detail: "M9 14.5a3.5 3.5 0 0 0 3 3.4",
  },
  ar: {
    fill: "M3 9h11a3 3 0 1 0-3-3 M3 13h15a3 3 0 1 1-3 3 M3 17h7",
    detail: "",
    stroke: true,
  },
  terra: {
    fill: "M2 20 9 7l3 5 3-3 7 11Z",
    detail: "M9 7l2 3.5-2 .5-1.5-1.5Z M15 9l1.8 2.6-1.4.4Z",
  },
  luz: {
    fill: "M12 7a5 5 0 1 0 .01 0Z",
    detail:
      "M12 1v3 M12 20v3 M1 12h3 M20 12h3 M4.2 4.2l2.1 2.1 M17.7 17.7l2.1 2.1 M19.8 4.2l-2.1 2.1 M6.3 17.7l-2.1 2.1",
    rays: true,
  },
  sombra: {
    fill: "M15.5 2.5A9.5 9.5 0 1 0 21.5 17 7.5 7.5 0 1 1 15.5 2.5Z",
    detail: "M17.5 6.5l.6 1.4 1.4.6-1.4.6-.6 1.4-.6-1.4-1.4-.6 1.4-.6Z",
  },
};

function runeSVG(id, size = 20) {
  const icon = RUNE_ICON[id];
  const color = RUNES[id].cor;
  const light = shade(color, 0.45);
  const main = icon.stroke
    ? `<path d="${icon.fill}" fill="none" stroke="${color}" stroke-width="2.6" stroke-linecap="round"/>`
    : `<path d="${icon.fill}" fill="${color}" stroke="${shade(color, -0.35)}" stroke-width="1" stroke-linejoin="round"/>`;
  const detail = icon.detail
    ? `<path d="${icon.detail}" fill="${icon.rays ? "none" : light}" stroke="${icon.rays ? color : "none"}" stroke-width="2" stroke-linecap="round"/>`
    : "";
  return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" style="filter:drop-shadow(0 0 2px ${color})">${main}${detail}</svg>`;
}

const runePathCache = {};
function runePath(d) {
  return (runePathCache[d] = runePathCache[d] || new Path2D(d));
}

/** Desenha o ícone da runa no canvas, com brilho. */
function glyph(id, x, y, s, alpha = 1) {
  const icon = RUNE_ICON[id];
  const color = RUNES[id].cor;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x - s / 2, y - s / 2);
  ctx.scale(s / 24, s / 24);
  ctx.shadowColor = color;
  ctx.shadowBlur = 8;
  if (icon.stroke) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.6;
    ctx.lineCap = "round";
    ctx.stroke(runePath(icon.fill));
  } else {
    ctx.fillStyle = color;
    ctx.fill(runePath(icon.fill));
    ctx.shadowBlur = 0;
    ctx.strokeStyle = shade(color, -0.35);
    ctx.lineWidth = 1;
    ctx.stroke(runePath(icon.fill));
  }
  if (icon.detail) {
    ctx.shadowBlur = 0;
    if (icon.rays) {
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.stroke(runePath(icon.detail));
    } else {
      ctx.fillStyle = shade(color, 0.45);
      ctx.fill(runePath(icon.detail));
    }
  }
  ctx.restore();
}

/* ===================== SPRITES ===================== */

const SKIN_TONES = [
  "#f1c8a5",
  "#e8b48a",
  "#d9a07a",
  "#c08458",
  "#8a5a3a",
  "#6b4428",
];
const BELT_COLORS = ["#f2c14e", "#6b4423", "#2a2a2a", "#c94a4a", "#d9d9d9"];
const SCARF_COLORS = ["#c94a4a", "#4a7ad9", "#e8c24a", "#7ab04a", "#e86ab0"];

const npcSkin = (robe, hat, hair) =>
  SKIN_TONES[colorSeed(`${robe}${hat}${hair}`) % SKIN_TONES.length];
const colorSeed = (text) =>
  [...text].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 17);

/**
 * Morador comum. A "semente" escolhe tom de pele, penteado, barba, óculos e
 * detalhes da roupa, para que duas pessoas com a mesma cor não fiquem iguais.
 */
/**
 * Personagens especiais (os criadores do jogo e seus parceiros) têm visual detalhado,
 * igual ao do jogador. Eles são achados pelas cores: robe|chapéu|cabelo.
 */
const HERO_LOOKS = {};
function wizardRects(robe, hat, hair, glow, dir, frame = 0, seed) {
  const special = HERO_LOOKS[`${robe}|${hat ?? null}|${hair}`];
  if (special) {
    const r = heroRects(special, dir, null, frame);
    // Detalhes extras desenhados à mão (cabelo, óculos, roupa) para personagens especiais.
    if (special.extra) {
      const ex = special.extra(dir, frame);
      if (special.under) r.unshift(...special.under(dir, frame));
      r.push(...ex);
    }
    return r;
  }
  const s = seed ?? colorSeed(`${robe}${hat}${hair}`);
  const skin = SKIN_TONES[s % SKIN_TONES.length],
    gold = BELT_COLORS[(s >> 3) % BELT_COLORS.length],
    dark = shade(robe, -0.35);
  const hairStyle = (s >> 5) % 6;
  const r = [];
  if (hat && glow) {
    // Só quem ainda guarda magia (como a Arquimaga Odelia) usa o chapéu pontudo.
    r.push(
      [7, 0, 2, 1, hat],
      [6, 1, 4, 2, hat],
      [5, 3, 6, 2, hat],
      [5, 4, 6, 1, "#f2c14e"],
      [3, 5, 10, 1, shade(hat, -0.25)],
    );
  } else if (hat) {
    r.push(
      [5, 3, 6, 2, hat],
      [4, 5, 8, 1, shade(hat, -0.25)],
      [4, 6, 1, 2, shade(hat, -0.4)],
      [11, 6, 1, 2, shade(hat, -0.4)],
    );
  } else if (hairStyle === 1) {
    r.push([5, 3, 6, 3, hair], [4, 5, 1, 7, hair], [11, 5, 1, 7, hair]);
  } else if (hairStyle === 2) {
    r.push(
      [5, 3, 6, 3, hair],
      [4, 5, 1, 4, hair],
      [11, 5, 1, 4, hair],
      [7, 1, 2, 2, hair],
    );
  } else if (hairStyle === 3) {
    r.push([6, 4, 4, 2, skin], [4, 5, 2, 3, hair], [10, 5, 2, 3, hair]);
  } else if (hairStyle === 4) {
    r.push(
      [4, 3, 8, 3, hair],
      [3, 4, 1, 4, hair],
      [12, 4, 1, 4, hair],
      [5, 2, 6, 1, hair],
    );
  } else {
    r.push([5, 3, 6, 3, hair], [4, 5, 1, 4, hair], [11, 5, 1, 4, hair]);
    if (hairStyle === 5) r.push([11, 8, 1, 4, hair]);
  }
  r.push([6, 6, 4, 3, skin]);
  if (dir === "up")
    r.push([6, 6, 4, 3, hat || (hairStyle === 3 ? skin : hair)]);
  else if (dir === "left") r.push([6, 7, 1, 1, "#222"], [8, 7, 1, 1, "#222"]);
  else if (dir === "right") r.push([7, 7, 1, 1, "#222"], [9, 7, 1, 1, "#222"]);
  else r.push([6, 7, 1, 1, "#222"], [9, 7, 1, 1, "#222"]);
  if (dir === "down" && s % 11 === 3)
    r.push(
      [5, 7, 2, 1, "#5a6a7a"],
      [9, 7, 2, 1, "#5a6a7a"],
      [7, 7, 2, 1, "#333"],
    );
  r.push(...npcBodyRects(robe, gold, dark, skin, dir, frame));
  const outfit = (s >> 7) % 4;
  if (outfit === 1 && dir === "down")
    r.push([5, 11, 6, 4, "#e8e4dc"], [5, 11, 6, 1, "#cfc8b8"]);
  if (outfit === 2 && dir !== "left" && dir !== "right")
    r.push([4, 9, 2, 3, shade(robe, -0.3)], [10, 9, 2, 3, shade(robe, -0.3)]);
  if (outfit === 3)
    r.push([5, 9, 6, 1, SCARF_COLORS[(s >> 2) % SCARF_COLORS.length]]);
  if (s % 6 === 1 && dir !== "up" && hairStyle !== 1 && !glow)
    r.push([6, 8, 4, 1, hair], [7, 9, 2, 1, hair]);
  if (glow) {
    r.push([13, 4, 1, 11, "#7a4f2a"], [12, 2, 3, 3, glow]);
  }
  return r;
}
/** Corpo dos NPCs: de frente, de costas, de lado e com passos ao andar. */
function npcBodyRects(robe, gold, dark, skin, dir, frame) {
  const boot = "#2a1d14";
  if (dir === "left" || dir === "right") {
    const swing = frame === 1 ? -1 : frame === 2 ? 1 : 0;
    const feet = frame
      ? [
          [frame === 1 ? 5 : 7, 15, 2, 1, boot],
          [frame === 1 ? 8 : 6, 14, 2, 1, boot],
        ]
      : [
          [6, 15, 2, 1, boot],
          [8, 15, 2, 1, boot],
        ];
    return [
      [5, 9, 6, 3, robe],
      [4, 12, 8, 3, robe],
      [7 + swing, 9, 2, 4, dark],
      [7 + swing, 13, 2, 1, skin],
      ...feet,
    ];
  }
  const body = [
    [4, 9, 8, 3, robe],
    [3, 12, 10, 3, robe],
  ];
  if (dir === "up")
    body.push([5, 9, 6, 1, dark], [7, 10, 2, 5, shade(robe, -0.2)]);
  else body.push([5, 11, 6, 1, gold], [7, 9, 2, 6, dark]);
  if (frame === 1)
    body.push(
      [5, 14, 2, 1, boot],
      [9, 15, 2, 1, boot],
      [2, 10, 1, 3, dark],
      [13, 11, 1, 3, dark],
    );
  else if (frame === 2)
    body.push(
      [5, 15, 2, 1, boot],
      [9, 14, 2, 1, boot],
      [2, 11, 1, 3, dark],
      [13, 10, 1, 3, dark],
    );
  else body.push([5, 15, 2, 1, boot], [9, 15, 2, 1, boot]);
  return body;
}
/** Elfo: corpo de morador, cabelo longo e orelhas pontudas. */
function elfRects(robe, hair, dir, frame = 0) {
  const r = wizardRects(robe, null, hair, null, dir, frame);
  const skin = "#f1d8b8";
  r.push([4, 6, 1, 6, hair], [11, 6, 1, 6, hair]);
  if (dir !== "up") {
    if (dir !== "right") r.push([3, 6, 1, 2, skin], [2, 5, 1, 1, skin]);
    if (dir !== "left") r.push([12, 6, 1, 2, skin], [13, 5, 1, 1, skin]);
  }
  r.push([5, 5, 6, 1, "#c9e0a0"]);
  return r;
}
const walkFrame = (moving, t) => (moving ? 1 + (Math.floor(t * 7) % 2) : 0);
function heroRects(L, dir, glow, fr = 0) {
  const r = [],
    hc = L.hair,
    rb = L.robe,
    dk = shade(rb, -0.35),
    tr = "#f2c14e",
    hs = L.hstyle;
  if (hs === "longo" && dir !== "up")
    r.push([4, 6, 2, 7, hc], [10, 6, 2, 7, hc]);
  if (hs === "trancas")
    r.push(
      [4, 7, 1, 6, hc],
      [11, 7, 1, 6, hc],
      [4, 13, 1, 1, tr],
      [11, 13, 1, 1, tr],
    );
  if (hs === "rabo" && dir !== "down")
    r.push([dir === "left" ? 10 : 4, 6, 2, 5, hc]);
  const o = L.outfit;
  if (o === "tunica")
    r.push(
      [4, 9, 8, 4, rb],
      [5, 11, 6, 1, tr],
      [5, 13, 2, 2, "#4a3a2a"],
      [9, 13, 2, 2, "#4a3a2a"],
      [4, 9, 1, 3, dk],
      [11, 9, 1, 3, dk],
    );
  else if (o === "vestido")
    r.push(
      [5, 9, 6, 2, rb],
      [4, 11, 8, 2, rb],
      [3, 13, 10, 2, rb],
      [5, 10, 6, 1, tr],
      [3, 14, 10, 1, dk],
    );
  else if (o === "gibao")
    r.push(
      [4, 9, 8, 4, rb],
      [4, 9, 8, 1, "#cfd3e6"],
      [7, 9, 2, 4, tr],
      [5, 13, 2, 2, "#3a3a44"],
      [9, 13, 2, 2, "#3a3a44"],
      [3, 9, 1, 3, "#cfd3e6"],
      [12, 9, 1, 3, "#cfd3e6"],
    );
  else if (o === "real")
    r.push(
      [4, 9, 8, 3, rb],
      [3, 12, 10, 3, rb],
      [2, 9, 12, 1, tr],
      [7, 9, 2, 6, "#f2eee4"],
      [3, 14, 10, 1, tr],
    );
  else if (o === "capa")
    r.push(
      [3, 9, 10, 6, dk],
      [5, 9, 6, 4, rb],
      [5, 13, 2, 2, "#4a3a2a"],
      [9, 13, 2, 2, "#4a3a2a"],
      [5, 11, 6, 1, tr],
    );
  else
    r.push(
      [4, 9, 8, 3, rb],
      [3, 12, 10, 3, rb],
      [5, 11, 6, 1, tr],
      [7, 9, 2, 6, dk],
    );
  if (dir === "up") {
    for (let i = r.length - 1; i >= 0; i--) {
      const q = r[i];
      if (
        q[1] >= 9 &&
        (q[4] === tr || q[4] === "#f2eee4" || q[4] === "#cfd3e6")
      )
        r.splice(i, 1);
    }
    r.push([5, 9, 6, 1, dk], [7, 10, 2, 5, shade(rb, -0.2)]);
  }
  if (dir === "left" || dir === "right") {
    for (const q of r) {
      if (q[1] < 9) continue;
      const x1 = 5 + Math.round((q[0] - 4) * 0.75),
        x2 = 5 + Math.round((q[0] + q[2] - 4) * 0.75);
      q[0] = x1;
      q[2] = Math.max(1, x2 - x1);
    }
    const sw = fr === 1 ? -1 : fr === 2 ? 1 : 0;
    r.push([7 + sw, 9, 2, 4, shade(rb, -0.25)], [7 + sw, 13, 2, 1, L.skin]);
    if (fr)
      r.push(
        [fr === 1 ? 5 : 7, 15, 2, 1, "#2a1d14"],
        [fr === 1 ? 9 : 8, 15, 2, 1, "#2a1d14"],
        [fr === 1 ? 9 : 5, 14, 2, 1, "#2a1d14"],
      );
    else r.push([6, 15, 2, 1, "#2a1d14"], [8, 15, 2, 1, "#2a1d14"]);
  } else if (fr === 1)
    r.push(
      [5, 14, 2, 1, "#2a1d14"],
      [9, 15, 2, 1, "#2a1d14"],
      [3, 10, 1, 3, shade(rb, -0.25)],
      [12, 11, 1, 3, shade(rb, -0.25)],
    );
  else if (fr === 2)
    r.push(
      [5, 15, 2, 1, "#2a1d14"],
      [9, 14, 2, 1, "#2a1d14"],
      [3, 11, 1, 3, shade(rb, -0.25)],
      [12, 10, 1, 3, shade(rb, -0.25)],
    );
  else r.push([5, 15, 2, 1, "#2a1d14"], [9, 15, 2, 1, "#2a1d14"]);
  r.push([6, 6, 4, 3, L.skin]);
  if (dir === "up") {
    if (hs !== "careca") r.push([5, 5, 6, 4, hc]);
  } else {
    const ec = L.eyes || "#222",
      e1 = dir === "right" ? 7 : 6,
      e2 = dir === "left" ? 8 : 9;
    const sk = L.skin || "#f0c8a8",
      skd = shade(sk, -0.3),
      brow = shade(hc, -0.15);
    switch (L.eyeshape) {
      case "grandes":
        r.push([e1, 6, 1, 2, ec], [e2, 6, 1, 2, ec]);
        break;
      case "cilios":
        r.push([e1, 7, 1, 1, ec], [e2, 7, 1, 1, ec], [e1 - 1, 6, 1, 1, "#1a1a1a"], [e2 + 1, 6, 1, 1, "#1a1a1a"]);
        break;
      case "sonolentos":
        r.push([e1, 7, 1, 1, ec], [e2, 7, 1, 1, ec], [e1, 6, 1, 1, skd], [e2, 6, 1, 1, skd]);
        break;
      case "sobrancelhas":
        r.push([e1, 7, 1, 1, ec], [e2, 7, 1, 1, ec], [e1, 6, 1, 1, brow], [e2, 6, 1, 1, brow], [e1 - 1, 6, 1, 1, brow], [e2 + 1, 6, 1, 1, brow]);
        break;
      case "bravos":
        r.push([e1, 7, 1, 1, ec], [e2, 7, 1, 1, ec], [e1 + 1, 6, 1, 1, brow], [e2 - 1, 6, 1, 1, brow]);
        break;
      case "fechados":
        r.push([e1, 7, 1, 1, skd], [e2, 7, 1, 1, skd], [e1, 6, 1, 1, shade(sk, -0.45)], [e2, 6, 1, 1, shade(sk, -0.45)]);
        break;
      case "brilho":
        r.push([e1, 7, 1, 1, ec], [e2, 7, 1, 1, ec], [e1, 6, 1, 1, "#ffffff"], [e2, 6, 1, 1, "#ffffff"]);
        break;
      default:
        r.push([e1, 7, 1, 1, ec], [e2, 7, 1, 1, ec]);
    }
    switch (L.face) {
      case "bochechas":
        r.push([6, 8, 1, 1, "#f08a9a"], [9, 8, 1, 1, "#f08a9a"]);
        break;
      case "sardas":
        r.push([6, 8, 1, 1, "#b8684a"], [9, 8, 1, 1, "#b8684a"], [8, 8, 1, 1, shade(sk, -0.15)]);
        break;
      case "pinta":
        r.push([dir === "left" ? 6 : 9, 8, 1, 1, "#4a2a1a"]);
        break;
      case "cicatriz":
        r.push([dir === "left" ? 7 : 8, 6, 1, 3, "#c46a6a"]);
        break;
      case "barba":
        r.push([6, 8, 4, 1, brow], [5, 7, 1, 2, brow], [10, 7, 1, 2, brow]);
        break;
      case "cavanhaque":
        r.push([7, 8, 2, 1, brow]);
        break;
      case "bigode":
        r.push([6, 8, 4, 1, brow]);
        break;
      case "batom":
        r.push([7, 8, 2, 1, "#c93a5a"], [6, 8, 1, 1, "#f0a0b0"], [9, 8, 1, 1, "#f0a0b0"]);
        break;
      case "guerra":
        r.push([6, 8, 1, 1, "#3a6ac9"], [9, 8, 1, 1, "#3a6ac9"], [7, 6, 2, 1, "#c93a3a"]);
        break;
      case "olheiras":
        r.push([e1, 8, 1, 1, "#8a6a8a"], [e2, 8, 1, 1, "#8a6a8a"]);
        break;
      case "sorriso":
        r.push([7, 8, 2, 1, "#7a2a2a"], [6, 8, 1, 1, shade(sk, -0.12)], [9, 8, 1, 1, shade(sk, -0.12)]);
        break;
    }
    const ac = L.acc;
    if (ac === "sardas")
      r.push([e1, 8, 1, 1, "#c9785a"], [e2, 8, 1, 1, "#c9785a"]);
    else if (ac === "bigode") r.push([6, 8, 4, 1, shade(hc, -0.1)]);
    else if (ac === "oculos")
      r.push(
        [e1, 7, 1, 1, "#bfe0f0"],
        [e2, 7, 1, 1, "#bfe0f0"],
        [e1 + 1, 7, e2 - e1 - 1, 1, "#1a1a1a"],
        [e1 - 1, 7, 1, 1, "#1a1a1a"],
        [e2 + 1, 7, 1, 1, "#1a1a1a"],
      );
    else if (ac === "tapaolho")
      r.push([e2, 7, 1, 1, "#1a1a1a"], [5, 6, 6, 1, "#1a1a1a"]);
    if (hs === "curto" || hs === "rabo" || hs === "trancas")
      r.push([5, 5, 6, 1, hc], [5, 6, 1, 1, hc], [10, 6, 1, 1, hc]);
    else if (hs === "longo")
      r.push([5, 5, 6, 1, hc], [5, 6, 1, 2, hc], [10, 6, 1, 2, hc]);
    else if (hs === "cacheado")
      r.push(
        [4, 4, 8, 2, hc],
        [4, 6, 1, 3, hc],
        [11, 6, 1, 3, hc],
        [5, 4, 1, 1, shade(hc, 0.2)],
        [9, 4, 1, 1, shade(hc, 0.2)],
      );
    else if (hs === "coque")
      r.push(
        [5, 5, 6, 1, hc],
        [5, 6, 1, 1, hc],
        [10, 6, 1, 1, hc],
        [7, 2, 2, 3, hc],
      );
    else if (hs === "moicano") r.push([7, 2, 2, 4, hc]);
  }
  if (L.acc === "brincos" && dir !== "up")
    r.push([5, 8, 1, 1, tr], [10, 8, 1, 1, tr]);
  if (L.acc === "colar") r.push([6, 9, 4, 1, tr], [7, 10, 2, 1, "#5fd0ff"]);
  if (L.acc === "cachecol")
    r.push([5, 9, 6, 1, "#c94a4a"], [9, 9, 1, 3, "#a83a3a"]);
  switch (L.acc) {
    case "laco":
      r.push([9, 4, 1, 1, "#e0466a"], [11, 4, 1, 1, "#e0466a"], [10, 4, 1, 1, "#ff8aa8"], [9, 5, 1, 1, "#c03050"], [11, 5, 1, 1, "#c03050"]);
      break;
    case "pena":
      r.push([11, 2, 1, 3, "#f2eee4"], [12, 1, 1, 2, "#7ad36b"], [12, 3, 1, 1, "#5fd0ff"]);
      break;
    case "bolsa":
      if (dir !== "up") r.push([5, 9, 1, 1, "#6b4423"], [6, 10, 1, 1, "#6b4423"], [7, 11, 1, 1, "#6b4423"], [8, 12, 1, 1, "#6b4423"]);
      r.push([9, 12, 3, 2, "#8a5a2e"], [10, 12, 1, 1, tr]);
      break;
    case "cinto":
      r.push([4, 12, 8, 1, "#3a2414"], [7, 12, 2, 1, tr]);
      break;
    case "pulseiras":
      r.push([3, 12, 1, 1, tr], [12, 12, 1, 1, "#5fd0ff"]);
      break;
    case "medalha":
      if (dir !== "up") r.push([7, 9, 2, 1, "#c94a4a"], [7, 10, 2, 2, tr], [8, 10, 1, 1, "#fff3b0"]);
      break;
  }
  const hc2 = L.hatc || "#2a2f6e";
  switch (L.hat) {
    case "mago":
      r.push(
        [7, 0, 2, 1, hc2],
        [6, 1, 4, 2, hc2],
        [5, 3, 6, 2, hc2],
        [5, 4, 6, 1, tr],
        [3, 5, 10, 1, shade(hc2, -0.25)],
      );
      break;
    case "capuz":
      r.push(
        [5, 3, 6, 2, dk],
        [4, 4, 1, 6, dk],
        [11, 4, 1, 6, dk],
        [4, 3, 8, 1, dk],
      );
      break;
    case "boina":
      r.push(
        [4, 3, 8, 2, hc2],
        [5, 5, 6, 1, shade(hc2, -0.2)],
        [10, 2, 2, 1, hc2],
      );
      break;
    case "tiara":
      r.push([5, 5, 6, 1, tr], [7, 4, 2, 1, "#5fd0ff"]);
      break;
    case "coroa":
      r.push(
        [5, 4, 6, 2, tr],
        [5, 3, 1, 1, tr],
        [7, 2, 2, 2, tr],
        [10, 3, 1, 1, tr],
        [7, 4, 2, 1, "#e0303a"],
      );
      break;
    case "abas":
      r.push(
        [7, 0, 2, 2, hc2],
        [6, 2, 4, 2, hc2],
        [5, 3, 6, 1, hc2],
        [2, 4, 12, 1, shade(hc2, -0.2)],
        [5, 4, 6, 1, tr],
      );
      break;
    case "flor":
      r.push([10, 4, 2, 2, "#ff6b8a"], [11, 5, 1, 1, tr]);
      break;
    case "festa":
      r.push(
        [7, 0, 2, 1, "#f2c14e"],
        [6, 1, 4, 2, "#e066a4"],
        [5, 3, 6, 2, "#4fb8ff"],
        [6, 2, 1, 1, "#f2c14e"],
        [9, 3, 1, 1, "#f2c14e"],
        [5, 5, 6, 1, "#7ad36b"],
      );
      break;
  }
  if (glow) {
    switch (L.staffs) {
      case "galho":
        r.push([13, 5, 1, 10, "#6b4423"], [12, 4, 1, 2, "#6b4423"], [14, 7, 1, 1, "#5a8a3a"], [11, 2, 3, 3, glow]);
        break;
      case "espiral":
        r.push([13, 4, 1, 11, "#c9a03a"], [12, 6, 1, 1, "#7a4f2a"], [14, 9, 1, 1, "#7a4f2a"], [12, 12, 1, 1, "#7a4f2a"], [12, 1, 3, 3, glow], [11, 2, 1, 1, "#c9a03a"], [15, 2, 1, 1, "#c9a03a"]);
        break;
      case "lua":
        r.push([13, 4, 1, 11, "#d8d0c2"], [12, 1, 3, 1, glow], [11, 2, 1, 2, glow], [12, 4, 1, 1, glow], [13, 2, 1, 1, "#ffffff"]);
        break;
      case "duplo":
        r.push([13, 4, 1, 11, "#4a3a5a"], [12, 2, 3, 2, glow], [13, 0, 1, 2, glow], [12, 8, 3, 1, glow]);
        break;
      case "estrela":
        r.push([13, 4, 1, 11, "#7a4f2a"], [13, 0, 1, 5, glow], [11, 2, 5, 1, glow], [13, 2, 1, 1, "#ffffff"]);
        break;
      default:
        r.push([13, 4, 1, 11, "#7a4f2a"], [12, 2, 3, 3, glow]);
    }
  }
  return r;
}
function genderWord(m, f, n) {
  return player.gender === "m" ? m : player.gender === "f" ? f : n;
}
function enemyRects(shape, c, t, accent) {
  const d = shade(c, -0.35),
    l = shade(c, 0.3),
    f = Math.floor(t * 4) % 2;
  switch (shape) {
    case "beast":
      return [
        [1, 6, 2, 2, c],
        [3, 7, 9, 5, c],
        [10, 4, 5, 5, c],
        [10, 3, 1, 1, c],
        [13, 3, 1, 1, c],
        [4, 12, 2, 3 + f, d],
        [9, 12, 2, 4 - f, d],
        [6, 8, 3, 2, "#14101c"],
        [12, 6, 1, 1, "#fff"],
        [14, 6, 1, 1, "#fff"],
        [14, 8, 1, 1, "#14101c"],
      ];
    case "shroom":
      return [
        [4, 1, 8, 2, c],
        [2, 3, 12, 4, c],
        [5, 2, 2, 2, "#f6dff0"],
        [10, 4, 2, 2, "#f6dff0"],
        [3, 5, 1, 1, "#f6dff0"],
        [5, 7, 6, 7, "#e9dcc7"],
        [6, 9, 1, 2, "#222"],
        [9, 9, 1, 2, "#222"],
        [7, 12, 2, 1, "#222"],
        [4, 14, 2, 1 + f, "#cbb89c"],
        [10, 14, 2, 2 - f, "#cbb89c"],
      ];
    case "blob":
      return [
        [4, 4, 8, 2, c],
        [2, 6, 12, 8, c],
        [3, 14, 4, 1, d],
        [9, 14, 4, 1, d],
        [5, 10, 6, 3, l],
        [3, 2, 4, 4, "#f4f19a"],
        [9, 2, 4, 4, "#f4f19a"],
        [4 + f, 3, 2, 2, "#111"],
        [10 + f, 3, 2, 2, "#111"],
        [6, 8, 4, 1, d],
      ];
    case "ghost":
      return [
        [4, 1, 8, 1, c],
        [3, 2, 10, 10, c],
        [3, 12, 2, 2 + f, c],
        [7, 12, 2, 3 - f, c],
        [11, 12, 2, 2 + f, c],
        [5, 5, 2, 3, "#1b2333"],
        [9, 5, 2, 3, "#1b2333"],
        [7, 9, 2, 2, "#1b2333"],
      ];
    case "bird":
      return [
        [5, 6, 7, 5, c],
        [10, 3, 4, 4, c],
        [14, 5, 2, 1, "#e0b040"],
        [12, 4, 1, 1, "#fff"],
        f ? [0, 3, 6, 3, l] : [0, 8, 6, 3, l],
        [7, 11, 1, 3, "#e0b040"],
        [10, 11, 1, 3, "#e0b040"],
        [3, 7, 2, 2, d],
      ];
    case "golem":
      return [
        [5, 1, 6, 4, c],
        [3, 5, 10, 6, c],
        [0, 5 + f, 3, 7, d],
        [13, 6 - f, 3, 7, d],
        [4, 11, 3, 5, d],
        [9, 11, 3, 5, d],
        [6, 3, 1, 1, "#7af"],
        [9, 3, 1, 1, "#7af"],
        [6, 7, 1, 3, d],
        [10, 6, 1, 2, d],
      ];
    case "knight":
      return [
        [5, 0, 6, 5, c],
        [6, 2, 4, 1, "#b88cff"],
        [4, 5, 8, 7, c],
        [2, 5, 2, 3, l],
        [12, 5, 2, 3, l],
        [5, 12, 2, 4, d],
        [9, 12, 2, 4, d],
        [14, 2 + f, 1, 10, "#cfd3e6"],
        [13, 9 + f, 3, 1, "#cfd3e6"],
        [7, 7, 2, 3, "#b88cff"],
      ];
    case "tree":
      return [
        [3, -1, 10, 1, c],
        [1, 0, 14, 7, c],
        [3, 1, 3, 2, l],
        [10, 3, 3, 2, l],
        [4, 7, 8, 8, "#5a3d24"],
        [0, 7 + f, 4, 2, "#5a3d24"],
        [12, 8 - f, 4, 2, "#5a3d24"],
        [5, 9, 2, 1, "#e8f59a"],
        [9, 9, 2, 1, "#e8f59a"],
        [6, 12, 4, 1, "#2a1a10"],
        [2, 14, 3, 2, "#4a301c"],
        [11, 14, 3, 2, "#4a301c"],
      ];
    case "serpent":
      return [
        [2, 12, 12, 3, c],
        [3, 13, 10, 1, l],
        [4, 9, 9, 3, c],
        [5, 10, 7, 1, l],
        [7, 5 + f, 4, 4, c],
        [8, 1 + f, 6, 4, c],
        [12, 2 + f, 1, 1, "#ff5"],
        [14, 3 + f, 2, 1, "#e44"],
        [9, 4 + f, 4, 1, d],
      ];
    case "book":
      return [
        [2, 3, 12, 10, c],
        [3, 4, 10, 8, "#efe2c0"],
        [7, 4, 2, 8, shade(c, -0.3)],
        [4, 6, 2, 1, "#888"],
        [10, 6, 2, 1, "#888"],
        [4, 8, 2, 1, "#888"],
        [10, 8, 2, 1, "#888"],
        [5, 1 + f, 2, 2, "#ffd34d"],
        [9, 1 + f, 2, 2, "#ffd34d"],
        [1, 4 + f, 2, 3, c],
        [13, 4 + f, 2, 3, c],
      ];
    case "dummy":
      return [
        [7, 0, 2, 16, "#6b4423"],
        [2, 4, 12, 2, "#6b4423"],
        [5, 2, 6, 9, "#d9b26a"],
        [6, 4, 4, 4, "#c94a4a"],
        [7, 5, 2, 2, "#fff"],
        [4, 1, 8, 2, "#c9a050"],
      ];
    case "griffin":
      // Grifo: corpo de leão, cabeça de águia, asas batendo.
      return [
        [0, 7, 1, 1, d],
        [0, 8, 3, 1, d],
        [3, 8, 9, 5, c],
        [4, 12, 7, 1, l],
        [3, 13, 2, 3, d],
        [9, 13, 2, 3, d],
        [3, 15, 2, 1, "#e0b040"],
        [9, 15, 2, 1, "#e0b040"],
        f ? [4, 1, 6, 6, l] : [4, 5, 7, 3, l],
        f ? [4, 1, 1, 6, d] : [4, 7, 7, 1, d],
        [10, 4, 4, 5, l],
        [10, 2, 2, 2, l],
        [12, 3, 1, 1, l],
        [14, 6, 2, 2, "#e0b040"],
        [12, 5, 1, 1, "#222"],
      ];
    case "basilisk":
      // Basilisco: lagarto de quatro patas, espinhos e coroa de cristal.
      return [
        [0, 10, 2, 2, c],
        [0, 12, 1, 1, d],
        [2, 9, 11, 4, c],
        [3, 12, 9, 1, l],
        [4, 7, 1, 2, "#e0f6ff"],
        [7, 6, 1, 3, "#e0f6ff"],
        [10, 7, 1, 2, "#e0f6ff"],
        [3, 13, 2, 2 + f, d],
        [7, 13, 2, 3 - f, d],
        [10, 13, 2, 2 + f, d],
        [12, 7, 4, 4, c],
        [12, 5, 1, 2, "#c9a0ff"],
        [14, 4, 1, 3, "#c9a0ff"],
        [14, 8, 1, 1, "#ff3"],
        [15, 10, 1, 1, "#e44"],
      ];
    case "leviathan":
      // Leviatã: cabeça e pescoço saindo das ondas, barbatanas e tentáculos.
      return [
        [1, 10, 2, 3, d],
        [13, 10, 2, 3, d],
        [6, 6, 4, 7, c],
        [3, 8 + f, 3, 2, l],
        [10, 8 - f, 3, 2, l],
        [4, 2, 8, 5, c],
        [2, 1, 2, 3, l],
        [12, 1, 2, 3, l],
        [5, 6, 7, 1, d],
        [6, 7, 1, 1, "#fff"],
        [9, 7, 1, 1, "#fff"],
        [5, 3, 1, 1, "#ff5"],
        [10, 3, 1, 1, "#ff5"],
        [0, 13, 16, 3, "#3a8ab0"],
        [1 + f * 2, 13, 3, 1, "#cfeaff"],
        [9 - f, 13, 3, 1, "#cfeaff"],
      ];
    case "stainedglass":
      // Espírito do Vitral: uma janela colorida com auréola.
      return [
        [6, 0, 4, 1, "#fff3b0"],
        [4, 1, 8, 1, "#3a3048"],
        [3, 2, 10, 12, "#3a3048"],
        [4, 3, 4, 4, "#e0306a"],
        [8, 3, 4, 4, "#4fb8ff"],
        [4, 7, 4, 4, "#f2c14e"],
        [8, 7, 4, 4, "#7ad36b"],
        [4, 11, 8, 2, c],
        [8, 3, 1, 10, "#1a1424"],
        [4, 7, 8, 1, "#1a1424"],
        [7, 4, 2, 2, "#fff"],
        [2, 6 + f, 1, 3, "#fff3b0"],
        [13, 6 - f, 1, 3, "#fff3b0"],
        [5, 14, 6, 1, "#1a1424"],
      ];
    case "diretor": {
      // Diretor da Academia: capelo de formatura, óculos, barba longa e um grimório na mão.
      const cap = "#1a1430",
        gold = "#f2c14e",
        face = "#cfd8f0",
        beard = "#e8e4f4";
      return [
        [3, 0, 10, 1, cap],
        [5, 1, 6, 2, cap],
        [12, 1, 1, 3 + f, gold],
        [5, 3, 6, 4, face],
        [5, 4, 2, 2, gold],
        [9, 4, 2, 2, gold],
        [6, 4, 1, 1, "#7ab8ff"],
        [9, 4, 1, 1, "#7ab8ff"],
        [7, 4, 2, 1, gold],
        [3, 7, 10, 7, c],
        [4, 7, 2, 3, l],
        [10, 7, 2, 3, l],
        [6, 7, 4, 4, beard],
        [7, 11, 2, 1, beard],
        [3, 13, 10, 1, gold],
        [3, 14, 2, 1 + f, c],
        [7, 14, 2, 2 - f, c],
        [11, 14, 2, 1 + f, c],
        [1, 9 + f, 2, 3, d],
        [13, 9 - f, 2, 3, d],
        [12, 11 - f, 4, 3, "#7a4fb3"],
        [13, 11 - f, 2, 1, "#efe2c0"],
      ];
    }
    case "boss": {
      const a = accent || "#b06cff";
      return [
        [4, 0, 8, 4, c],
        [3, 4, 10, 12, c],
        [5, 5, 6, 10, shade(c, 0.15)],
        [6, 2, 4, 3, "#d8d2ea"],
        [6, 3, 1, 1, a],
        [9, 3, 1, 1, a],
        [1, 8 + f, 2, 2, "#d8d2ea"],
        [13, 9 - f, 2, 2, "#d8d2ea"],
        [7, 6, 2, 8, a],
      ];
    }
  }
  return [];
}
function drawEnemy(type, x, y, u, t, extra = {}) {
  const e = ENEMIES[type];
  const accent = extra.accent;
  if (e.shape === "boss") {
    const cx = x + 8 * u,
      cy = y + 8 * u;
    const g = ctx.createRadialGradient(cx, cy, u, cx, cy, u * 12);
    g.addColorStop(0, "rgba(176,108,255,.45)");
    g.addColorStop(1, "rgba(176,108,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(cx - u * 12, cy - u * 12, u * 24, u * 24);
    ORDER.forEach((r, i) => {
      const a = t * 1.2 + (i * Math.PI) / 2;
      glyph(
        r,
        cx + Math.cos(a) * u * 10,
        cy + Math.sin(a) * u * 4 - u * 2,
        u * 2.2,
        0.75,
      );
    });
  }
  if (e.shape === "diretor") {
    // Brilho azul e páginas voando em volta (o Silenciador tem as runas).
    const cx = x + 8 * u,
      cy = y + 8 * u;
    const g = ctx.createRadialGradient(cx, cy, u, cx, cy, u * 11);
    g.addColorStop(0, "rgba(120,170,255,.4)");
    g.addColorStop(1, "rgba(120,170,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(cx - u * 11, cy - u * 11, u * 22, u * 22);
    for (let i = 0; i < 4; i++) {
      const a = t * 0.9 + (i * Math.PI) / 2;
      const px = cx + Math.cos(a) * u * 9,
        py = cy + Math.sin(a) * u * 3.5 - u * 2;
      ctx.fillStyle = "#efe2c0";
      ctx.fillRect(px - u, py - u * 0.7, u * 2, u * 1.4);
      ctx.fillStyle = "#a8a090";
      ctx.fillRect(px - u * 0.6, py - u * 0.2, u * 1.2, u * 0.3);
    }
  }
  ctx.save();
  if (e.shape === "ghost" || e.shape === "diretor") ctx.globalAlpha = e.shape === "ghost" ? 0.85 : 0.92;
  drawSprite(enemyRects(e.shape, e.cor, t, accent), x, y, u, extra.flip);
  ctx.restore();
}

/* ======================================================================
   (antes: 29-icones-pixel.js)
   ====================================================================== */

/**
 * ECOS DO ARCANO — 02-estado-som-e-sprites.js
 * Gerador de ícones em pixel art 16×16: cada forma (espada, cajado, poção, fruta,
 * peixe, móvel, joia...) é desenhada em código e pintada com a paleta do item.
 * Depois um passo automático faz o contorno e o brilho, então todo ícone sai
 * com cara de "arte de jogo", e cada item pode ter o seu próprio.
 *
 * Chave do ícone: "g:forma:cor1:cor2:variante"  (ex.: "g:potion:#e0306a:#f2c14e:1")
 */


const GICON_SIZE = 16;
const gIconCache = {};

/** Pequenas ferramentas de desenho num grid 16×16. */
function gPainter(grid) {
  const set = (x, y, c) => {
    x = Math.round(x);
    y = Math.round(y);
    if (x >= 0 && y >= 0 && x < 16 && y < 16 && c !== undefined) grid[y][x] = c;
  };
  const R = (x, y, w, h, c) => {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) set(x + i, y + j, c);
  };
  const C = (cx, cy, r, c) => {
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) if ((x - cx) ** 2 + (y - cy) ** 2 <= r * r) set(x, y, c);
  };
  const E = (cx, cy, rx, ry, c) => {
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) if (((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1) set(x, y, c);
  };
  const L = (x0, y0, x1, y1, c, t = 1) => {
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) || 1;
    for (let i = 0; i <= n; i++) R(Math.round(x0 + ((x1 - x0) * i) / n), Math.round(y0 + ((y1 - y0) * i) / n), t, t, c);
  };
  const T = (rows, map) =>
    rows.forEach((row, y) => {
      for (let x = 0; x < row.length; x++) if (map[row[x]]) set(x, y, map[row[x]]);
    });
  return { set, R, C, E, L, T };
}

/**
 * Formas. Cada uma recebe (pintor, paleta, variante).
 * Paleta: m = cor principal, d = escura, l = clara, a = destaque, w = madeira, s = metal.
 */
const GSHAPES = {
  /* ---------- Armas mágicas ---------- */
  staff: ({ L, C, R, set }, p, v) => {
    L(3, 14, 10, 5, p.w, 2);
    L(4, 14, 10, 6, shade(p.w, 0.25));
    if (v % 4 === 0) {
      C(11.5, 3.5, 2.6, p.a);
      set(11, 2, "#ffffff");
    } else if (v % 4 === 1) {
      L(11, 0, 14, 3, p.a, 2);
      L(9, 2, 12, 5, p.a, 2);
      set(12, 1, "#ffffff");
    } else if (v % 4 === 2) {
      C(11.5, 3.5, 3, p.s);
      C(12.5, 2.5, 2.2, null);
      R(12, 2, 3, 3, null);
      C(10.5, 4.5, 1.5, p.a);
    } else {
      R(11, 1, 1, 6, p.a);
      R(8, 4, 7, 1, p.a);
      R(10, 3, 3, 3, p.a);
      set(11, 4, "#ffffff");
    }
  },
  wand: ({ L, C, set }, p, v) => {
    L(4, 13, 11, 6, p.w, 1);
    L(5, 13, 11, 7, shade(p.w, 0.3));
    C(12, 4, v % 2 ? 1.6 : 2.1, p.a);
    set(12, 3, "#ffffff");
    if (v % 3 === 2) {
      set(14, 2, p.l);
      set(9, 2, p.l);
      set(14, 6, p.l);
    }
  },
  scepter: ({ L, R, C, set }, p, v) => {
    L(4, 14, 10, 7, p.s, 2);
    R(9, 3, 5, 3, p.a);
    set(9, 2, p.a);
    set(11, 1, p.a);
    set(13, 2, p.a);
    C(11, 5, 1.2, p.m);
    if (v % 2) R(5, 12, 2, 1, p.a);
  },
  /* ---------- Roupas e armaduras ---------- */
  robe: ({ R, T }, p, v) => {
    R(5, 2, 6, 2, p.m);
    R(4, 4, 8, 3, p.m);
    R(3, 7, 10, 7, p.m);
    R(2, 13, 12, 2, p.m);
    R(2, 4, 2, 5, p.d);
    R(12, 4, 2, 5, p.d);
    R(7, 2, 2, 12, p.d);
    R(4, 9, 8, 1, p.a);
    if (v % 2) R(6, 1, 4, 2, p.d);
  },
  tunic: ({ R }, p, v) => {
    R(3, 3, 10, 3, p.m);
    R(1, 4, 3, 4, p.m);
    R(12, 4, 3, 4, p.m);
    R(4, 6, 8, 8, p.m);
    R(4, 9, 8, 1, p.a);
    R(6, 3, 4, 1, p.d);
    R(7, 4, 2, 2, p.d);
    if (v % 2) R(4, 12, 8, 2, p.d);
  },
  dress: ({ R }, p, v) => {
    R(6, 2, 4, 2, p.m);
    R(5, 4, 6, 3, p.m);
    R(5, 7, 6, 1, p.a);
    R(4, 8, 8, 2, p.m);
    R(3, 10, 10, 2, p.m);
    R(2, 12, 12, 3, p.m);
    R(2, 14, 12, 1, p.d);
    if (v % 2) R(7, 8, 2, 7, p.l);
  },
  cloak: ({ R, E }, p, v) => {
    E(8, 4, 3.5, 3, p.d);
    R(4, 5, 8, 9, p.m);
    R(3, 9, 10, 6, p.m);
    R(7, 6, 2, 9, p.d);
    R(6, 6, 4, 1, p.a);
    if (v % 2) E(8, 4, 2, 1.8, "#2a1a14");
  },
  armor: ({ R, set }, p, v) => {
    R(2, 3, 4, 3, p.s);
    R(10, 3, 4, 3, p.s);
    R(4, 4, 8, 10, p.m);
    R(5, 13, 6, 2, p.m);
    R(7, 4, 2, 10, p.l);
    R(4, 8, 8, 1, p.d);
    set(5, 6, p.a);
    set(10, 6, p.a);
    if (v % 2) R(6, 10, 4, 2, p.a);
  },
  helmet: ({ R, E }, p, v) => {
    E(8, 8, 6, 5.5, p.m);
    R(2, 9, 12, 5, p.m);
    R(4, 9, 8, 2, "#1a1222");
    R(7, 9, 2, 5, p.m);
    R(2, 13, 12, 1, p.d);
    if (v % 2) R(7, 0, 2, 4, p.a);
    else R(6, 2, 4, 1, p.a);
  },
  boots: ({ R }, p) => {
    R(2, 3, 4, 9, p.m);
    R(2, 11, 6, 3, p.m);
    R(9, 3, 4, 9, p.d);
    R(9, 11, 6, 3, p.d);
    R(2, 3, 4, 1, p.a);
    R(9, 3, 4, 1, p.a);
  },
  gloves: ({ R }, p) => {
    R(3, 5, 6, 8, p.m);
    R(3, 2, 1, 4, p.m);
    R(5, 1, 1, 5, p.m);
    R(7, 2, 1, 4, p.m);
    R(9, 6, 2, 3, p.m);
    R(3, 11, 6, 3, p.a);
  },
  shield: ({ R, T }, p, v) => {
    T(["..XXXXXXXXXXXX..", "..XXXXXXXXXXXX..", "..XXXXXXXXXXXX..", "..XXXXXXXXXXXX..", "..XXXXXXXXXXXX..", "..XXXXXXXXXXXX..", "..XXXXXXXXXXXX..", "...XXXXXXXXXX...", "...XXXXXXXXXX...", "....XXXXXXXX....", ".....XXXXXX.....", "......XXXX......", ".......XX......."].map((r) => r), { X: p.m });
    R(7, 0, 2, 12, p.a);
    R(2, 4, 12, 2, p.a);
    if (v % 2) R(6, 3, 4, 4, p.l);
  },
  /* ---------- Joias ---------- */
  ring: ({ C, R, set }, p) => {
    C(8, 9, 5, p.s);
    C(8, 9, 3, null);
    R(6, 2, 4, 4, p.a);
    set(7, 3, "#ffffff");
  },
  amulet: ({ L, C, set }, p) => {
    L(3, 1, 8, 8, p.s);
    L(13, 1, 8, 8, p.s);
    C(8, 11, 3.5, p.s);
    C(8, 11, 2.4, p.a);
    set(7, 10, "#ffffff");
  },
  necklace: ({ set, C }, p) => {
    for (let i = 0; i <= 10; i++) {
      const x = 2.5 + i,
        y = 3 + Math.sin((i / 10) * Math.PI) * 8;
      C(x, y, 0.9, i % 2 ? p.a : p.s);
    }
    C(8, 12.5, 1.6, p.a);
    set(8, 12, "#ffffff");
  },
  bracelet: ({ E }, p) => {
    E(8, 8, 6, 4, p.s);
    E(8, 8, 4, 2.4, null);
    E(8, 4.5, 1.6, 1.2, p.a);
    E(3, 8, 1.2, 1.2, p.a);
    E(13, 8, 1.2, 1.2, p.a);
  },
  crown: ({ R, set }, p) => {
    R(2, 7, 12, 6, p.s);
    for (const x of [2, 7, 12]) R(x, 3, 2, 4, p.s);
    R(2, 10, 12, 1, p.d);
    set(8, 9, p.a);
    set(4, 9, p.a);
    set(11, 9, p.a);
  },
  /* ---------- Poções e bebidas ---------- */
  potion: ({ C, R, set }, p, v) => {
    if (v % 4 === 0) {
      C(8, 10, 5, "#dfe8f0");
      C(8, 10.5, 4.2, p.m);
      R(6, 2, 4, 4, "#dfe8f0");
      R(6, 1, 4, 2, p.w);
    } else if (v % 4 === 1) {
      R(5, 4, 6, 11, "#dfe8f0");
      R(6, 6, 4, 8, p.m);
      R(7, 1, 2, 3, "#dfe8f0");
      R(6, 0, 4, 2, p.w);
    } else if (v % 4 === 2) {
      R(6, 3, 4, 12, "#dfe8f0");
      R(7, 7, 2, 7, p.m);
      R(6, 1, 4, 2, p.a);
    } else {
      R(3, 6, 10, 9, "#dfe8f0");
      R(4, 8, 8, 6, p.m);
      R(6, 3, 4, 3, "#dfe8f0");
      R(5, 2, 6, 2, p.w);
    }
    set(6, 9, "#ffffff");
    set(6, 10, p.l);
  },
  bottle: ({ R, set }, p, v) => {
    R(5, 6, 6, 9, p.m);
    R(6, 3, 4, 3, p.m);
    R(7, 0, 2, 3, p.m);
    R(7, 0, 2, 1, p.a);
    R(5, 9, 6, 3, v % 2 ? "#f2eee4" : p.a);
    set(6, 7, p.l);
  },
  mug: ({ R, set }, p, v) => {
    R(3, 5, 8, 10, p.w);
    R(3, 7, 8, 1, shade(p.w, -0.3));
    R(3, 12, 8, 1, shade(p.w, -0.3));
    R(11, 7, 3, 1, p.w);
    R(13, 7, 1, 5, p.w);
    R(11, 11, 3, 1, p.w);
    R(3, 2, 8, 3, v % 2 ? "#f6f0d8" : p.m);
    set(5, 3, "#ffffff");
  },
  cup: ({ R, E, set }, p) => {
    E(7, 10, 5, 4, "#f2eee4");
    R(2, 6, 10, 4, "#f2eee4");
    R(3, 6, 8, 2, p.m);
    R(12, 8, 2, 3, "#f2eee4");
    R(4, 14, 7, 1, p.a);
    set(5, 3, p.l);
    set(8, 2, p.l);
  },
  glass: ({ R, set }, p) => {
    R(4, 2, 8, 11, "#dfe8f0");
    R(5, 5, 6, 7, p.m);
    R(5, 13, 6, 2, "#dfe8f0");
    set(5, 6, p.l);
    R(10, 0, 1, 6, p.a);
  },
  /* ---------- Comida ---------- */
  apple: ({ C, R, set }, p, v) => {
    C(8, 9.5, 5.2, p.m);
    R(8, 2, 1, 3, p.w);
    if (v % 2 === 0) R(9, 2, 3, 2, "#5aa83a");
    set(6, 7, p.l);
    set(5, 8, p.l);
  },
  pear: ({ C, R, set }, p) => {
    C(8, 11, 4.5, p.m);
    C(8, 6, 2.8, p.m);
    R(8, 1, 1, 3, p.w);
    set(6, 9, p.l);
  },
  berries: ({ C, R, set }, p, v) => {
    const pts = v % 2 ? [[5, 9], [10, 9], [7.5, 12.5], [7.5, 6]] : [[5, 8], [9, 7], [11, 11], [6, 12], [9, 12]];
    for (const [x, y] of pts) {
      C(x, y, 2.2, p.m);
      set(x - 1, y - 1, p.l);
    }
    R(7, 1, 1, 4, "#5aa83a");
    R(8, 2, 3, 1, "#5aa83a");
  },
  grapes: ({ C, R, set }, p) => {
    for (const [x, y] of [[5, 6], [8, 6], [11, 6], [6.5, 9], [9.5, 9], [8, 12]]) {
      C(x, y, 1.8, p.m);
      set(x - 0.5, y - 1, p.l);
    }
    R(8, 1, 1, 3, p.w);
    R(9, 2, 3, 2, "#5aa83a");
  },
  citrus: ({ C, set }, p) => {
    C(8, 8.5, 5.5, p.m);
    set(8, 3, "#5aa83a");
    set(9, 3, "#5aa83a");
    set(6, 6, p.l);
    set(10, 11, p.d);
    set(5, 10, p.d);
  },
  melon: ({ C, R }, p) => {
    C(8, 4, 8.5, "#3a8a3a");
    C(8, 4, 7.4, "#f2eee4");
    C(8, 4, 6.6, p.m);
    R(0, 0, 16, 5, null);
    for (const x of [5, 8, 11]) R(x, 7, 1, 1, "#1a1222");
  },
  carrot: ({ L, R }, p) => {
    for (let i = 0; i < 10; i++) R(4 + i * 0.6, 4 + i, Math.max(1, 4 - i * 0.4), 1, p.m);
    L(5, 2, 3, 0, "#5aa83a");
    L(6, 3, 7, 0, "#5aa83a");
    L(7, 3, 10, 1, "#5aa83a");
  },
  root: ({ C, R, set }, p) => {
    C(8, 9, 4.6, p.m);
    R(8, 13, 1, 3, p.d);
    R(5, 1, 2, 4, "#5aa83a");
    R(9, 1, 2, 4, "#5aa83a");
    R(7, 2, 2, 3, "#3a8a3a");
    set(6, 7, p.l);
  },
  pumpkin: ({ E, R }, p) => {
    E(8, 9.5, 6.5, 5, p.m);
    R(5, 5, 1, 9, p.d);
    R(10, 5, 1, 9, p.d);
    R(7, 2, 2, 3, "#5a7a2a");
  },
  corn: ({ E, R, set }, p) => {
    E(8, 7, 3, 6.5, p.m);
    for (let y = 2; y < 13; y += 2) for (let x = 6; x < 11; x += 2) set(x, y, p.l);
    R(4, 10, 2, 5, "#5aa83a");
    R(10, 10, 2, 5, "#5aa83a");
  },
  cabbage: ({ C, set }, p) => {
    C(8, 9, 6, p.m);
    C(8, 9, 3.5, p.l);
    set(8, 4, p.d);
    set(4, 8, p.d);
    set(12, 9, p.d);
  },
  bread: ({ E, L }, p, v) => {
    if (v % 3 === 1) {
      L(1, 12, 13, 4, p.m, 3);
      L(2, 12, 14, 4, p.l);
    } else if (v % 3 === 2) {
      E(8, 9, 5.5, 5, p.m);
      E(8, 7, 3, 1.5, p.l);
    } else {
      E(8, 9.5, 7, 4.5, p.m);
      L(4, 9, 6, 7, p.d);
      L(7, 9, 9, 7, p.d);
      L(10, 9, 12, 7, p.d);
    }
  },
  pretzel: ({ C, set }, p) => {
    C(5.5, 8, 3.5, p.m);
    C(10.5, 8, 3.5, p.m);
    C(5.5, 8, 1.6, null);
    C(10.5, 8, 1.6, null);
    set(4, 6, "#ffffff");
    set(11, 6, "#ffffff");
  },
  cheese: ({ T, set }, p) => {
    T(["...........X....", ".........XXX....", ".......XXXXX....", ".....XXXXXXX....", "...XXXXXXXXX....", ".XXXXXXXXXXX....", ".XXXXXXXXXXXX...", ".XXXXXXXXXXXX...", ".XXXXXXXXXXXX...", ".XXXXXXXXXXXX..."].map((r) => "................".slice(0, 0) + r), { X: p.m });
    for (const [x, y] of [[4, 7], [8, 8], [10, 6], [6, 9]]) set(x, y + 3, p.d);
  },
  meat: ({ E, R, C }, p, v) => {
    if (v % 3 === 0) {
      E(6, 7, 5, 4.5, p.m);
      R(9, 9, 5, 2, "#f2eee4");
      C(14, 9, 1.4, "#f2eee4");
      C(14, 11, 1.4, "#f2eee4");
    } else if (v % 3 === 1) {
      E(8, 8, 6.5, 5, p.m);
      E(7, 8, 3, 2, p.l);
    } else {
      for (const x of [3, 8, 13]) E(x, 8, 2.6, 2.2, p.m);
      R(5, 8, 1, 1, p.d);
      R(10, 8, 1, 1, p.d);
    }
  },
  fish: ({ E, T, set }, p, v) => {
    E(7, 8, 5.5, 3.2, p.m);
    T(["..............XX", ".............XXX", "............XXXX", "...........XXXX.", "............XXXX", ".............XXX", "..............XX"].map((r) => r), { X: p.d });
    for (let i = 0; i < 7; i++) set(i + 9, i + 5, null);
    set(4, 7, "#1a1222");
    E(7, 9, 3.5, 1, p.l);
    if (v % 2) for (const x of [6, 8, 10]) set(x, 6, p.a);
  },
  squid: ({ E, R }, p) => {
    E(8, 5, 4, 4.5, p.m);
    for (const x of [4, 6, 8, 10, 12]) R(x, 8, 1, 6, p.m);
    R(6, 5, 1, 1, "#1a1222");
    R(9, 5, 1, 1, "#1a1222");
  },
  shell: ({ C, L }, p) => {
    C(8, 10, 6, p.m);
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) if (y > 12) L(x, y, x, y, null);
    for (const x of [4, 6, 8, 10, 12]) L(8, 13, x, 5, p.d);
  },
  cake: ({ R, T, set }, p, v) => {
    T(["................", "................", "................", "........XX......", "......XXXXXX....", "....XXXXXXXXXX..", "..XXXXXXXXXXXXXX", "..XXXXXXXXXXXXXX", "..XXXXXXXXXXXXXX", "..XXXXXXXXXXXXXX", "..XXXXXXXXXXXXXX", "..XXXXXXXXXXXXXX"], { X: "#f2e0b0" });
    R(2, 6, 14, 2, p.m);
    R(2, 9, 14, 1, p.a);
    if (v % 2) set(9, 2, "#e0303a");
  },
  pie: ({ E, L }, p) => {
    E(8, 9, 7.5, 5, "#c98a3a");
    E(8, 8.5, 6, 3.8, p.m);
    for (const x of [4, 8, 12]) L(x, 5, x, 12, "#e8b860");
    for (const y of [7, 10]) L(2, y, 14, y, "#e8b860");
  },
  cookie: ({ C, set }, p) => {
    C(8, 8, 6, p.m);
    for (const [x, y] of [[5, 6], [9, 5], [11, 9], [6, 10], [8, 8]]) set(x, y, p.d);
    set(5, 4, p.l);
  },
  donut: ({ C, set }, p) => {
    C(8, 8, 6.2, "#d9a060");
    C(8, 7.5, 5.4, p.m);
    C(8, 8, 2, null);
    for (const [x, y] of [[5, 5], [10, 4], [12, 8], [4, 9]]) set(x, y, p.a);
  },
  pudding: ({ E, R }, p) => {
    E(8, 12, 7, 2.5, "#e8e4dc");
    R(4, 5, 8, 7, p.m);
    E(8, 5, 4, 1.5, p.d);
    R(5, 6, 1, 3, p.l);
  },
  soup: ({ E, R, set }, p) => {
    E(8, 9, 7, 5, p.w);
    R(1, 6, 14, 3, null);
    E(8, 8, 6.5, 2, p.m);
    for (const x of [5, 8, 11]) set(x, 2 + (x % 2), "#dfe8f0");
    set(6, 4, "#dfe8f0");
    set(10, 4, "#dfe8f0");
  },
  egg: ({ E, set }, p) => {
    E(8, 9, 4.5, 6, p.m);
    set(6, 6, p.l);
    set(10, 11, p.d);
  },
  honey: ({ R, set }, p) => {
    R(4, 5, 8, 10, p.m);
    R(5, 3, 6, 2, p.w);
    R(4, 8, 8, 3, p.a);
    set(5, 6, p.l);
  },
  /* ---------- Materiais ---------- */
  gem: ({ T, set }, p, v) => {
    const rows =
      v % 3 === 0
        ? ["................", "....XXXXXXXX....", "...XLLXXXXXXX...", "..XLLXXXXXXXXX..", ".XXXXXXXXXXXXXX.", "..XXXXXXXXXXXX..", "...XXXXXXXXXX...", "....XXXXXXXX....", ".....XXXXXX.....", "......XXXX......", ".......XX......."]
        : v % 3 === 1
          ? ["......XXXX......", ".....XLLXXX.....", "....XLLXXXXX....", "...XXXXXXXXXX...", "..XXXXXXXXXXXX..", "..XXXXXXXXXXXX..", "...XXXXXXXXXX...", "....XXXXXXXX....", ".....XXXXXX.....", "......XXXX......"]
          : [".......XX.......", "......XLXX......", ".....XLXXXX.....", "....XLXXXXXX....", "....XXXXXXXX....", "....XXXXXXXX....", "....XXXXXXXX....", ".....XXXXXX.....", "......XXXX......", ".......XX......."];
    T(["................", "................", "................"].concat(rows), { X: p.m, L: p.l });
    set(8, 9, p.d);
  },
  ore: ({ T, set }, p) => {
    T(["................", "................", "................", "......XXXX......", "....XXXXXXXX....", "...XXXXXXXXXX...", "..XXXXXXXXXXXX..", "..XXXXXXXXXXXXX.", ".XXXXXXXXXXXXXX.", ".XXXXXXXXXXXXXX.", "..XXXXXXXXXXXX..", "...XXXXXXXXXX..."], { X: "#7a7480" });
    for (const [x, y] of [[5, 6], [9, 7], [11, 9], [6, 9], [8, 5], [4, 8]]) set(x, y, p.m);
    for (const [x, y] of [[5, 5], [9, 6]]) set(x, y, p.l);
  },
  ingot: ({ T, R }, p) => {
    T(["................", "................", "................", "................", "................", ".....XXXXXX.....", "....XXXXXXXX....", "...XXXXXXXXXX...", "..XXXXXXXXXXXX..", ".XXXXXXXXXXXXXX.", ".XXXXXXXXXXXXXX."], { X: p.m });
    R(5, 5, 6, 1, p.l);
    R(1, 10, 14, 1, p.d);
  },
  log: ({ R, C, set }, p) => {
    R(1, 6, 11, 7, p.w);
    R(1, 6, 11, 1, shade(p.w, 0.25));
    C(12, 9.5, 3.5, shade(p.w, 0.35));
    C(12, 9.5, 1.5, shade(p.w, 0.1));
    set(5, 9, shade(p.w, -0.3));
  },
  plank: ({ R }, p) => {
    for (const y of [3, 7, 11]) {
      R(1, y, 14, 3, p.w);
      R(1, y, 14, 1, shade(p.w, 0.25));
    }
  },
  cloth: ({ R }, p, v) => {
    R(2, 4, 12, 9, p.m);
    R(2, 4, 12, 2, p.l);
    R(2, 11, 12, 2, p.d);
    if (v % 2) for (const x of [4, 7, 10]) R(x, 4, 1, 9, p.a);
    else for (const y of [7, 9]) R(2, y, 12, 1, p.a);
  },
  leather: ({ T }, p) => {
    T(["................", "..XX........XX..", "..XXX......XXX..", "...XXXXXXXXXX...", "...XXXXXXXXXX...", "..XXXXXXXXXXXX..", "..XXXXXXXXXXXX..", "...XXXXXXXXXX...", "...XXXXXXXXXX...", "..XXXX....XXXX..", "..XX........XX.."], { X: p.m });
  },
  herb: ({ L, E }, p, v) => {
    L(8, 15, 8, 4, "#3a6a2a");
    for (const [x, y, s] of [[5, 6, -1], [11, 8, 1], [5, 11, -1], [11, 12, 1]]) E(x, y, 2.6, 1.4, p.m);
    if (v % 2) E(8, 3, 1.8, 2.2, p.a);
  },
  flower: ({ C, L, E }, p, v) => {
    L(8, 15, 8, 7, "#3a8a3a");
    E(5, 12, 2.2, 1, "#5aa83a");
    const n = v % 2 ? 5 : 6;
    for (let i = 0; i < n; i++) C(8 + Math.cos((i / n) * 6.28) * 3, 5 + Math.sin((i / n) * 6.28) * 3, 2, p.m);
    C(8, 5, 1.6, p.a);
  },
  mushroom: ({ E, R, set }, p) => {
    E(8, 7, 7, 4.5, p.m);
    R(1, 8, 15, 4, null);
    R(6, 8, 4, 6, "#efe6d0");
    for (const [x, y] of [[5, 5], [10, 4], [8, 6]]) set(x, y, "#ffffff");
  },
  feather: ({ L, E }, p) => {
    E(8, 7, 3.2, 6.5, p.m);
    L(5, 15, 10, 1, p.d);
    E(9, 6, 1, 4, p.l);
  },
  fang: ({ T }, p) => {
    T(["................", "...XXXXXXXXXX...", "...XXXXXXXXXX...", "....XXXXXXXX....", ".....XXXXXX.....", ".....XXXXXX.....", "......XXXXX.....", "......XXXX......", ".......XXX......", ".......XX.......", "........X......."], { X: p.m });
  },
  claw: ({ L }, p) => {
    for (const x of [3, 7, 11]) {
      L(x, 3, x + 3, 9, p.m, 2);
      L(x + 3, 9, x + 2, 13, p.m, 1);
    }
  },
  horn: ({ L }, p) => {
    for (let i = 0; i < 11; i++) L(3 + i, 13 - i * 0.9, 3 + i, 13 - i * 0.9 + Math.max(1, 4 - i * 0.35), p.m);
  },
  bone: ({ L, C }, p) => {
    L(4, 12, 12, 4, p.m, 2);
    for (const [x, y] of [[3, 12], [4, 13], [12, 3], [13, 4]]) C(x, y, 1.5, p.m);
  },
  scale: ({ T, set }, p) => {
    T(["................", "................", "....XXXXXXXX....", "...XXXXXXXXXX...", "..XXXXXXXXXXXX..", "..XXXXXXXXXXXX..", "..XXXXXXXXXXXX..", "...XXXXXXXXXX...", "....XXXXXXXX....", ".....XXXXXX.....", "......XXXX......"], { X: p.m });
    set(6, 4, p.l);
    set(5, 5, p.l);
  },
  eye: ({ E, C, set }, p) => {
    E(8, 8, 7, 4.5, "#f2eee4");
    C(8, 8, 3, p.m);
    C(8, 8, 1.4, "#1a1222");
    set(7, 7, "#ffffff");
  },
  /* ---------- Coisas ---------- */
  book: ({ R }, p, v) => {
    R(3, 2, 10, 12, p.m);
    R(3, 2, 2, 12, p.d);
    R(5, 13, 8, 2, "#f2eee4");
    R(7, 5, 4, 3, p.a);
    if (v % 2) R(5, 9, 8, 1, p.a);
  },
  scroll: ({ R, C }, p) => {
    R(3, 3, 10, 10, "#f3e2b8");
    C(3, 3, 1.8, "#d9c08a");
    C(13, 13, 1.8, "#d9c08a");
    for (const y of [5, 7, 9]) R(5, y, 6, 1, "#8a7a5a");
    R(6, 11, 4, 2, p.m);
  },
  map: ({ R, L, set }, p) => {
    R(1, 3, 14, 10, "#f3e2b8");
    for (const x of [5, 10]) R(x, 3, 1, 10, "#d9c08a");
    L(3, 10, 7, 6, p.m);
    L(7, 6, 12, 8, p.m);
    set(12, 8, "#e0303a");
    set(12, 7, "#e0303a");
  },
  key: ({ C, R }, p) => {
    C(5, 5, 3.5, p.s);
    C(5, 5, 1.5, null);
    R(7, 7, 7, 2, p.s);
    R(11, 9, 1, 3, p.s);
    R(13, 9, 1, 2, p.s);
  },
  candle: ({ R, E, set }, p) => {
    R(5, 6, 6, 9, p.m);
    R(5, 6, 2, 9, p.l);
    R(7, 4, 2, 2, "#3a2414");
    E(8, 2.5, 1.4, 2.2, "#f2c14e");
    set(8, 2, "#ffffff");
  },
  lantern: ({ R, set }, p) => {
    R(5, 1, 6, 2, p.s);
    R(4, 3, 8, 10, p.s);
    R(5, 4, 6, 8, "#ffe9a8");
    R(7, 5, 2, 6, p.a);
    R(4, 13, 8, 2, p.s);
    set(8, 0, p.s);
  },
  pouch: ({ E, R, set }, p) => {
    E(8, 10, 6, 5, p.m);
    R(6, 3, 4, 3, p.m);
    R(5, 5, 6, 1, p.a);
    set(6, 9, p.l);
  },
  coin: ({ C, R, set }, p) => {
    C(8, 8, 6, p.m);
    C(8, 8, 4.5, p.l);
    R(7, 5, 2, 6, p.d);
    set(6, 5, "#ffffff");
  },
  ball: ({ C, L }, p) => {
    C(8, 8, 6, p.m);
    L(2, 8, 14, 8, p.a);
    L(8, 2, 8, 14, p.a);
  },
  doll: ({ C, R, set }, p) => {
    C(8, 4, 3, "#f1c8a5");
    R(5, 1, 6, 2, p.a);
    R(5, 7, 6, 6, p.m);
    R(3, 8, 2, 3, p.m);
    R(11, 8, 2, 3, p.m);
    R(5, 13, 2, 2, p.d);
    R(9, 13, 2, 2, p.d);
    set(7, 4, "#1a1222");
    set(9, 4, "#1a1222");
  },
  top: ({ T, set }, p) => {
    T(["........X.......", "........X.......", "......XXXXX.....", "....XXXXXXXXX...", "...XXXXXXXXXXX..", "...XXXXXXXXXXX..", "....XXXXXXXXX...", "......XXXXX.....", ".......XXX......", "........X.......", "........X......."].map((r) => r), { X: p.m });
    for (let x = 4; x < 13; x++) set(x, 5, p.a);
  },
  dice: ({ R, set }, p) => {
    R(3, 3, 10, 10, p.m);
    R(3, 3, 10, 2, p.l);
    for (const [x, y] of [[5, 6], [10, 6], [7.5, 8.5], [5, 11], [10, 11]]) set(x, y, "#1a1222");
  },
  lute: ({ E, R, C }, p) => {
    E(6, 10, 4.5, 4.5, p.w);
    C(6, 10, 1.4, "#2a1a10");
    R(9, 3, 2, 7, shade(p.w, -0.2));
    R(9, 1, 4, 2, shade(p.w, -0.3));
    R(4, 12, 4, 1, p.a);
  },
  flute: ({ L, set }, p) => {
    L(2, 13, 13, 2, p.w, 2);
    for (const i of [4, 6, 8, 10]) set(i, 14 - i, "#1a1222");
  },
  drum: ({ E, R }, p) => {
    E(8, 5, 6, 2.5, "#f2eee4");
    R(2, 5, 12, 8, p.m);
    E(8, 13, 6, 2, p.m);
    for (const x of [3, 6, 9, 12]) R(x, 6, 1, 7, p.a);
  },
  bell: ({ T, C }, p) => {
    T(["................", ".......XX.......", "......XXXX......", ".....XXXXXX.....", ".....XXXXXX.....", "....XXXXXXXX....", "....XXXXXXXX....", "...XXXXXXXXXX...", "...XXXXXXXXXX...", "..XXXXXXXXXXXX..", "..XXXXXXXXXXXX.."], { X: p.m });
    C(8, 12, 1.4, p.d);
  },
  hammer: ({ L, R }, p) => {
    L(4, 14, 9, 6, p.w, 2);
    R(6, 2, 8, 4, p.s);
    R(6, 2, 8, 1, shade(p.s, 0.3));
  },
  pickaxe: ({ L }, p) => {
    L(4, 14, 10, 4, p.w, 2);
    L(3, 4, 8, 2, p.s, 2);
    L(8, 2, 14, 6, p.s, 2);
  },
  axe: ({ L, E }, p) => {
    L(4, 14, 10, 3, p.w, 2);
    E(11, 5, 3.5, 4, p.s);
    E(9, 5, 1.2, 1.5, null);
  },
  sickle: ({ C, L }, p) => {
    C(9, 7, 6, p.s);
    C(7, 8, 5, null);
    L(3, 14, 5, 10, p.w, 2);
  },
  rod: ({ L, set }, p) => {
    L(2, 14, 13, 2, p.w, 1);
    L(13, 2, 13, 11, "#dfe8f0");
    set(13, 12, p.a);
    set(13, 13, p.a);
  },
  shovel: ({ L, E }, p) => {
    L(10, 1, 6, 9, p.w, 2);
    E(5, 12, 3, 3.5, p.s);
  },
  sword: ({ L, R, set }, p) => {
    L(4, 11, 12, 3, p.s, 2);
    L(5, 11, 12, 4, shade(p.s, 0.35));
    L(2, 10, 6, 14, p.a, 2);
    L(1, 14, 3, 12, p.w, 2);
    set(13, 2, "#ffffff");
  },
  bow: ({ L, set }, p) => {
    for (let i = 0; i < 13; i++) set(4 + Math.sin((i / 12) * Math.PI) * 6, 1.5 + i, p.w);
    L(4, 2, 4, 14, "#dfe8f0");
  },
  /* ---------- Móveis ---------- */
  chair: ({ R }, p) => {
    R(4, 1, 2, 13, p.w);
    R(4, 8, 9, 2, p.w);
    R(11, 9, 2, 6, p.w);
    R(4, 2, 8, 6, p.m);
  },
  table: ({ R }, p) => {
    R(1, 5, 14, 3, p.w);
    R(1, 5, 14, 1, shade(p.w, 0.3));
    R(2, 8, 2, 7, p.w);
    R(12, 8, 2, 7, p.w);
    R(5, 3, 2, 2, p.a);
  },
  bed: ({ R }, p) => {
    R(1, 4, 3, 11, p.w);
    R(4, 7, 11, 6, p.m);
    R(4, 7, 3, 3, "#f2eee4");
    R(4, 12, 11, 3, p.w);
  },
  chest: ({ R }, p) => {
    R(2, 5, 12, 9, p.w);
    R(2, 3, 12, 3, shade(p.w, 0.2));
    R(2, 7, 12, 1, p.s);
    R(7, 7, 2, 3, p.a);
  },
  shelf: ({ R }, p) => {
    R(2, 1, 12, 14, p.w);
    for (const y of [5, 10]) R(3, y, 10, 1, shade(p.w, -0.3));
    for (const [x, y, c] of [[4, 2, p.m], [6, 2, p.a], [9, 7, p.m], [5, 7, p.a], [10, 12, p.m]]) R(x, y, 2, 3, c);
  },
  wardrobe: ({ R }, p) => {
    R(2, 1, 12, 14, p.w);
    R(7, 2, 1, 12, shade(p.w, -0.35));
    R(6, 7, 1, 2, p.a);
    R(8, 7, 1, 2, p.a);
  },
  rug: ({ E, R }, p) => {
    E(8, 9, 7.5, 5, p.m);
    E(8, 9, 5, 3, p.a);
    E(8, 9, 2.5, 1.4, p.l);
    R(0, 0, 16, 3, null);
  },
  painting: ({ R }, p) => {
    R(1, 2, 14, 11, "#c9a03a");
    R(2, 3, 12, 9, p.m);
    R(2, 8, 12, 4, p.d);
    R(9, 4, 3, 3, p.a);
  },
  vase: ({ E, R, C }, p) => {
    E(8, 11, 4.5, 4, p.m);
    R(6, 5, 4, 3, p.m);
    C(5, 3, 1.8, p.a);
    C(10, 2, 1.8, p.a);
    C(8, 4, 1.6, "#5aa83a");
  },
  lamp: ({ T, R }, p) => {
    T(["....XXXXXXXX....", "...XXXXXXXXXX...", "..XXXXXXXXXXXX..", ".XXXXXXXXXXXXXX."], { X: p.m });
    R(7, 4, 2, 9, p.s);
    R(4, 13, 8, 2, p.s);
  },
  clock: ({ C, R, L }, p) => {
    R(4, 1, 8, 14, p.w);
    C(8, 5, 3.2, "#f2eee4");
    L(8, 5, 8, 3, "#1a1222");
    L(8, 5, 10, 5, "#1a1222");
    R(7, 10, 2, 4, p.a);
  },
  mirror: ({ E, R }, p) => {
    E(8, 7, 5, 6.5, p.a);
    E(8, 7, 3.8, 5.3, "#bfe0f0");
    R(5, 4, 1, 3, "#ffffff");
    R(6, 13, 4, 2, p.w);
  },
  barrel: ({ E, R }, p) => {
    E(8, 8, 6, 7, p.w);
    for (const y of [4, 11]) R(2, y, 12, 1, p.s);
    R(1, 0, 16, 1, null);
  },
  plant: ({ R, E }, p) => {
    R(5, 10, 6, 5, p.w);
    for (const [x, y] of [[5, 5], [11, 6], [8, 3], [6, 8], [10, 8]]) E(x, y, 2.4, 1.5, p.m);
  },
  bench: ({ R }, p) => {
    R(1, 6, 14, 3, p.w);
    R(1, 3, 14, 2, p.w);
    R(2, 9, 2, 6, shade(p.w, -0.3));
    R(12, 9, 2, 6, shade(p.w, -0.3));
  },
  /* ---------- Curiosidades ---------- */
  fossil: ({ C, L, set }, p) => {
    C(8, 8, 6, "#a8a090");
    for (let i = 0; i < 18; i++) {
      const a = i * 0.7,
        r = 0.4 + i * 0.28;
      set(8 + Math.cos(a) * r, 8 + Math.sin(a) * r, p.m);
    }
  },
  statue: ({ C, R }, p) => {
    C(8, 3, 2.2, p.m);
    R(6, 5, 4, 6, p.m);
    R(4, 6, 2, 3, p.m);
    R(4, 11, 8, 4, p.d);
  },
  skull: ({ C, R, set }, p) => {
    C(8, 7, 5.5, p.m);
    R(5, 11, 6, 3, p.m);
    C(6, 7, 1.5, "#1a1222");
    C(10, 7, 1.5, "#1a1222");
    set(8, 10, "#1a1222");
  },
  hourglass: ({ T, R }, p) => {
    T(["................", "..XXXXXXXXXXXX..", "...XXXXXXXXXX...", "....XXXXXXXX....", ".....XXXXXX.....", "......XXXX......", ".......XX.......", "......XXXX......", ".....XXXXXX.....", "....XXXXXXXX....", "...XXXXXXXXXX...", "..XXXXXXXXXXXX..", "................"], { X: "#dfe8f0" });
    R(5, 3, 6, 2, p.m);
    R(5, 9, 6, 3, p.m);
    R(1, 0, 14, 1, p.w);
    R(1, 12, 14, 1, p.w);
  },
  compass: ({ C, L }, p) => {
    C(8, 8, 6.5, p.s);
    C(8, 8, 5.2, "#f3e2b8");
    L(8, 3, 8, 8, "#e0303a", 1);
    L(8, 8, 8, 13, "#1a1222", 1);
  },
  orb: ({ C, R, set }, p) => {
    C(8, 7, 5.5, p.m);
    C(7, 6, 2.5, p.l);
    R(4, 12, 8, 3, p.w);
    set(6, 4, "#ffffff");
  },
  mask: ({ E, C, R }, p) => {
    E(8, 8, 7, 5, p.m);
    C(5, 7, 1.6, "#1a1222");
    C(11, 7, 1.6, "#1a1222");
    R(7, 11, 2, 1, p.a);
  },
  idol: ({ T, set }, p) => {
    T(["......XXXX......", ".....XXXXXX.....", ".....XXXXXX.....", "......XXXX......", "....XXXXXXXX....", "...XXXXXXXXXX...", "....XXXXXXXX....", ".....XXXXXX.....", ".....XXXXXX.....", "....XXXXXXXX....", "...XXXXXXXXXX..."], { X: p.m });
    set(7, 2, p.a);
    set(9, 2, p.a);
  },
};

/** Desenha a forma, faz contorno escuro e um brilho automático. */
function buildGIcon(key) {
  const [, shape, m = "#8a6ad9", a = "#f2c14e", v = "0"] = key.split(":");
  const fn = GSHAPES[shape] || GSHAPES.gem;
  const grid = Array.from({ length: 16 }, () => Array(16).fill(null));
  const p = { m, a, d: shade(m, -0.3), l: shade(m, 0.35), w: "#8a5a2e", s: "#b8bcc8" };
  if (/^#[cdef]/i.test(a) && ["staff", "wand", "hammer", "pickaxe", "axe", "sword", "key", "ring", "amulet", "necklace", "bracelet", "crown", "scepter"].includes(shape)) p.s = shade(a, 0.1);
  fn(gPainter(grid), p, +v || 0);
  const out = grid.map((r) => r.slice());
  for (let y = 0; y < 16; y++)
    for (let x = 0; x < 16; x++) {
      if (grid[y][x]) continue;
      const n = [
        [x - 1, y],
        [x + 1, y],
        [x, y - 1],
        [x, y + 1],
      ].find(([i, j]) => grid[j] && grid[j][i]);
      if (n) out[y][x] = shade(grid[n[1]][n[0]], -0.62);
    }
  const c = document.createElement("canvas");
  c.width = 18;
  c.height = 18;
  const g = c.getContext("2d");
  for (let y = 0; y < 16; y++)
    for (let x = 0; x < 16; x++)
      if (out[y][x]) {
        g.fillStyle = out[y][x];
        g.fillRect(x + 1, y + 1, 1, 1);
      }
  return c;
}
function gIconCanvas(key) {
  if (!gIconCache[key]) {
    const c = buildGIcon(key);
    gIconCache[key] = { c, url: c.toDataURL() };
  }
  return gIconCache[key];
}

const _iconHTMLBase = iconHTML;
iconHTML = function (key, size = 16) {
  if (key && key.startsWith("g:")) return `<img class="pxi gx" src="${gIconCanvas(key).url}" width="${size}" height="${size}" alt="">`;
  return _iconHTMLBase(key, size);
};
const _drawPixelIconBase = drawPixelIcon;
drawPixelIcon = function (key, cx, cy, size = 2) {
  if (key && key.startsWith("g:")) {
    const s = 18 * size * 0.5;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(gIconCanvas(key).c, cx - s / 2, cy - s / 2, s, s);
    return;
  }
  return _drawPixelIconBase(key, cx, cy, size);
};
const gIcon = (shape, m, a = "#f2c14e", v = 0) => `g:${shape}:${m}:${a}:${v}`;
