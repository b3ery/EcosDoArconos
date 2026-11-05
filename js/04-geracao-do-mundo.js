/**
 * ECOS DO ARCANO — 04-geracao-do-mundo.js
 * Geração das regiões, da Vila de Cinzaluz, Porto Brisamar, Pedravale e interiores.
 */

/* ===================== GERAÇÃO DO MUNDO ===================== */
const DIRS4 = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];
const SIDES = {
  e: {
    pos: (w, h) => [w - 1, h >> 1],
    v: [-1, 0],
  },
  w: {
    pos: (w, h) => [0, h >> 1],
    v: [1, 0],
  },
  s: {
    pos: (w, h) => [w >> 1, h - 1],
    v: [0, -1],
  },
  n: {
    pos: (w, h) => [w >> 1, 0],
    v: [0, 1],
  },
};
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const clampi = (v, a, b) => Math.max(a, Math.min(b, v));
const manhattan = (a, b) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]);
function makeGrid(w, h, f) {
  const m = [];
  for (let y = 0; y < h; y++) {
    const r = [];
    for (let x = 0; x < w; x++) r.push(f(x, y));
    m.push(r);
  }
  return m;
}
function caWalls(m, w, h, it) {
  for (let k = 0; k < it; k++) {
    const n = m.map((r) => r.slice());
    for (let y = 1; y < h - 1; y++)
      for (let x = 1; x < w - 1; x++) {
        let c = 0;
        for (let dy = -1; dy <= 1; dy++)
          for (let dx = -1; dx <= 1; dx++) if ((dx || dy) && m[y + dy][x + dx] === "#") c++;
        n[y][x] = c >= 5 ? "#" : c <= 3 ? "." : m[y][x];
      }
    m = n;
  }
  return m;
}
function carvePath(m, a, b, R, w, h) {
  let x = a[0],
    y = a[1],
    g = 0;
  const dig = () => {
    for (let dy = -1; dy <= 1; dy++)
      for (let dx = -1; dx <= 1; dx++) {
        const X = x + dx,
          Y = y + dy;
        if (X > 0 && Y > 0 && X < w - 1 && Y < h - 1) m[Y][X] = ".";
      }
  };
  while ((x !== b[0] || y !== b[1]) && g < 8000) {
    g++;
    dig();
    if (R() < 0.7) {
      if (x !== b[0] && (y === b[1] || R() < 0.5)) x += Math.sign(b[0] - x);
      else y += Math.sign(b[1] - y);
    } else {
      const d = DIRS4[Math.floor(R() * 4)];
      x = clampi(x + d[0], 2, w - 3);
      y = clampi(y + d[1], 2, h - 3);
    }
  }
  dig();
}
function flood(m, w, h, s) {
  const seen = new Uint8Array(w * h),
    out = [],
    q = [s];
  seen[s[1] * w + s[0]] = 1;
  while (q.length) {
    const [x, y] = q.pop();
    out.push([x, y]);
    for (const [dx, dy] of DIRS4) {
      const X = x + dx,
        Y = y + dy;
      if (X < 0 || Y < 0 || X >= w || Y >= h) continue;
      const i = Y * w + X;
      if (seen[i]) continue;
      const c = m[Y][X];
      if (c === "." || c === "," || c === "P") {
        seen[i] = 1;
        q.push([X, Y]);
      }
    }
  }
  return out;
}
function shuffle(a, R) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(R() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function finalize(id, d, m, w, h, open, npcs, inner) {
  const map = m.map((r) => r.join(""));
  const feats = [];
  let guardPos = null;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const c = map[y][x];
      if ("GNFCP".includes(c)) feats.push([x, y, c]);
      if (c === "G") guardPos = [x, y];
    }
  const spawn = inner ? flood(m, w, h, inner).filter(([x, y]) => m[y][x] === ".") : [];
  const npcList = Object.keys(npcs).map((k) => {
    const [x, y] = k.split(",").map(Number);
    return [x, y, npcs[k]];
  });
  return Object.assign({}, d, {
    id,
    w,
    h,
    map,
    open,
    npcs,
    npcList,
    feats,
    guardPos,
    spawn,
  });
}

/* ===================== VILA MEDIEVAL ===================== */

const VILLAGE_POINTS = {
  home: [5, 18],
  escolaRet: [5, 7],
  fonte: [31, 21],
  mercado: [44, 18],
};
const VILLAGE_BUILDINGS = [
  {
    id: "home",
    style: "home",
    x: 3,
    y: 15,
    w: 4,
    h: 3,
    door: [5],
    name: "Sua Casa",
  },
  {
    id: "padaria",
    style: "padaria",
    x: 8,
    y: 15,
    w: 4,
    h: 3,
    door: [9],
    name: "Padaria",
  },
  {
    id: "taverna",
    style: "taverna",
    x: 13,
    y: 14,
    w: 7,
    h: 4,
    door: [16],
    name: "Taverna Javali Dourado",
  },
  {
    id: "c1",
    style: "casa",
    x: 3,
    y: 21,
    w: 4,
    h: 3,
    door: [4],
  },
  {
    id: "c2",
    style: "salao",
    x: 8,
    y: 20,
    w: 4,
    h: 3,
    door: [10],
    name: "Salão Tesoura de Ouro",
  },
  {
    id: "c3",
    style: "marcenaria",
    x: 14,
    y: 20,
    w: 4,
    h: 3,
    door: [15],
    name: "Marcenaria do Tonico",
    shop: "moveis",
  },
  {
    id: "castle",
    style: "castle",
    x: 24,
    y: 2,
    w: 16,
    h: 9,
    door: [31, 32],
    name: "Castelo de Cinzaluz",
  },
  {
    id: "guilda",
    style: "guilda",
    x: 43,
    y: 3,
    w: 8,
    h: 5,
    door: [46],
    name: "Guilda dos Aventureiros",
  },
  {
    id: "biblio",
    style: "biblio",
    x: 54,
    y: 3,
    w: 6,
    h: 5,
    door: [56],
    name: "Biblioteca",
  },
  {
    id: "estab",
    style: "estab",
    x: 55,
    y: 14,
    w: 6,
    h: 4,
    door: [57],
    name: "Estábulo",
  },
  {
    id: "templo",
    style: "templo",
    x: 18,
    y: 30,
    w: 6,
    h: 5,
    door: [20],
    name: "Templo da Luz",
  },
  {
    id: "hosp",
    style: "hosp",
    x: 25,
    y: 30,
    w: 5,
    h: 4,
    door: [27],
    name: "Hospital",
  },
  {
    id: "forja",
    style: "forja",
    x: 34,
    y: 30,
    w: 5,
    h: 4,
    door: [36],
    name: "Forja do Brann",
  },
  {
    id: "alfaiate",
    style: "alfaiate",
    x: 40,
    y: 30,
    w: 4,
    h: 3,
    door: [41],
    name: "Alfaiataria",
  },
  {
    id: "troca",
    style: "troca",
    x: 55,
    y: 30,
    w: 5,
    h: 4,
    door: [57],
    name: "Central de Trocas",
  },
  {
    id: "moinho",
    style: "moinho",
    x: 4,
    y: 41,
    w: 4,
    h: 4,
    door: [5],
    name: "Moinho",
  },
  {
    id: "celeiro",
    style: "celeiro",
    x: 9,
    y: 41,
    w: 5,
    h: 3,
    door: [11],
    name: "Celeiro",
  },
  {
    id: "c4",
    style: "acougue",
    x: 36,
    y: 37,
    w: 4,
    h: 3,
    door: [37],
    name: "Açougue do Bento",
    shop: "acougue",
  },
  {
    id: "c5",
    style: "armazem",
    x: 41,
    y: 37,
    w: 4,
    h: 3,
    door: [42],
    name: "Armazém Geral",
    shop: "armazem",
  },
  {
    id: "c6",
    style: "tecidos",
    x: 46,
    y: 37,
    w: 4,
    h: 3,
    door: [47],
    name: "Tecidos & Cia",
    shop: "tecidos",
  },
  {
    id: "c7",
    style: "boticario",
    x: 36,
    y: 42,
    w: 4,
    h: 3,
    door: [38],
    name: "Boticário Raiz",
    shop: "boticario",
  },
  {
    id: "c8",
    style: "livraria",
    x: 41,
    y: 42,
    w: 4,
    h: 3,
    door: [43],
    name: "Livraria Pena de Ouro",
    shop: "livraria",
  },
  {
    id: "c9",
    style: "emporio",
    x: 46,
    y: 42,
    w: 4,
    h: 3,
    door: [48],
    name: "Empório do Oriente",
    shop: "emporio",
  },
  {
    id: "c10",
    style: "escola",
    x: 18,
    y: 38,
    w: 4,
    h: 3,
    door: [19],
    name: "Escola de Cinzaluz",
  },
  {
    id: "c11",
    style: "peixaria",
    x: 56,
    y: 38,
    w: 4,
    h: 3,
    door: [57],
    name: "Peixaria Rio Claro",
    shop: "peixRio",
  },
  {
    id: "c12",
    style: "casa2",
    x: 56,
    y: 42,
    w: 4,
    h: 3,
    door: [58],
  },
];
const STALLS = {
  "40,16": "bruno",
  "41,16": "bruno",
  "43,16": "rosa",
  "44,16": "rosa",
  "46,16": "doran",
  "47,16": "doran",
  "49,16": "doceria",
  "50,16": "doceria",
  "40,20": "peixaria",
  "41,20": "peixaria",
  "43,20": "ervanaria",
  "44,20": "ervanaria",
  "46,20": "joalheiro",
  "47,20": "joalheiro",
  "49,20": "floricultura",
  "50,20": "floricultura",
  "40,24": "bazar",
  "41,24": "bazar",
  "43,24": "abrigo",
  "44,24": "abrigo",
  "46,24": "chas",
  "47,24": "chas",
  "49,24": "brinquedos",
  "50,24": "brinquedos",
};
const DOORS = {};
VILLAGE_BUILDINGS.forEach((b) => b.door.forEach((dx) => (DOORS[dx + "," + (b.y + b.h - 1)] = b)));
function genVila(d) {
  const w = 64,
    h = 48;
  const m = makeGrid(w, h, (x, y) => (x === 0 || y === 0 || x === w - 1 || y === h - 1 ? "#" : "."));
  const set = (x, y, c) => {
    if (x > 0 && y > 0 && x < w - 1 && y < h - 1) m[y][x] = c;
  };
  const fill = (x0, y0, x1, y1, c) => {
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) set(x, y, c);
  };
  const border = (x0, y0, x1, y1, c) => {
    for (let x = x0; x <= x1; x++) {
      set(x, y0, c);
      set(x, y1, c);
    }
    for (let y = y0; y <= y1; y++) {
      set(x0, y, c);
      set(x1, y, c);
    }
  };
  m[0][10] = m[0][11] = ",";
  m[26][0] = m[27][0] = ",";
  m[26][w - 1] = m[27][w - 1] = ",";
  m[h - 1][31] = m[h - 1][32] = "B";
  fill(10, 1, 11, 13, ",");
  fill(10, 12, 58, 13, ",");
  fill(1, 26, 62, 27, ",");
  fill(31, 11, 32, 46, ",");
  fill(25, 15, 38, 24, ",");
  fill(40, 15, 49, 24, ",");
  fill(25, 25, 49, 25, ",");
  for (let y = 1; y < h - 1; y++) {
    m[y][52] = m[y][53] = y === 12 || y === 13 || y === 26 || y === 27 ? "=" : "~";
  }
  border(13, 3, 21, 9, "f");
  set(17, 9, ".");
  set(18, 9, ".");
  [
    [15, 5],
    [17, 5],
    [19, 5],
  ].forEach(([x, y]) => set(x, y, "K"));
  [
    [3, 4],
    [8, 4],
    [3, 8],
    [8, 8],
  ].forEach(([x, y]) => set(x, y, "S"));
  set(5, 6, "E");
  set(6, 4, "w");
  set(4, 5, "w");
  border(55, 19, 61, 23, "f");
  set(58, 19, ".");
  border(2, 29, 15, 39, "f");
  set(8, 29, ".");
  set(9, 29, ".");
  fill(3, 30, 14, 38, "g");
  set(30, 19, "~");
  set(31, 19, "~");
  set(32, 19, "~");
  set(30, 20, "~");
  set(32, 20, "~");
  set(31, 20, "F");
  Object.keys(STALLS).forEach((k) => {
    const [x, y] = k.split(",").map(Number);
    set(x, y, "M");
  });
  set(35, 22, "J");
  set(28, 22, "S");
  set(24, 37, "W");
  [
    [24, 14],
    [39, 14],
    [24, 25],
    [39, 25],
    [8, 25],
    [20, 25],
    [44, 25],
    [56, 25],
    [30, 28],
    [34, 28],
    [30, 40],
    [34, 40],
    [12, 13],
    [50, 13],
    [46, 9],
  ].forEach(([x, y]) => {
    if (m[y][x] !== "~" && m[y][x] !== "=") set(x, y, "l");
  });
  [
    [20, 15],
    [20, 16],
    [49, 16],
    [49, 22],
    [39, 31],
    [12, 16],
    [50, 19],
  ].forEach(([x, y]) => set(x, y, "b"));
  [
    [12, 15],
    [50, 20],
    [44, 31],
    [14, 40],
    [15, 42],
    [14, 43],
    [54, 20],
  ].forEach(([x, y]) => set(x, y, "x"));
  [
    [15, 41],
    [16, 42],
    [54, 22],
    [54, 21],
  ].forEach(([x, y]) => set(x, y, "h"));
  [
    [23, 25],
    [3, 25],
    [60, 25],
  ].forEach(([x, y]) => {
    if (m[y][x] === ".") set(x, y, "R");
  });
  const put = (c, l) =>
    l.forEach(([x, y]) => {
      if (m[y] && m[y][x] === ".") set(x, y, c);
    });
  put("A", [
    [2, 15],
    [7, 17],
    [2, 22],
    [7, 22],
    [12, 22],
    [18, 22],
    [35, 38],
    [40, 38],
    [45, 38],
    [50, 38],
    [35, 43],
    [50, 43],
    [55, 39],
    [60, 39],
    [55, 43],
    [60, 43],
    [42, 4],
    [51, 4],
    [53, 8],
    [23, 4],
    [40, 9],
    [13, 32],
    [22, 40],
    [45, 29],
    [60, 31],
  ]);
  put("o", [
    [51, 6],
    [54, 10],
    [51, 34],
    [54, 41],
    [51, 45],
    [61, 33],
    [2, 35],
    [22, 45],
    [58, 47],
    [41, 13],
    [24, 11],
  ]);
  put("z", [
    [6, 46],
    [13, 46],
    [40, 46],
    [61, 40],
    [61, 6],
    [2, 10],
    [35, 47],
  ]);
  set(8, 34, "Y");
  set(12, 36, "Y");
  put("Z", [
    [16, 31],
    [16, 33],
  ]);
  put("t", [
    [29, 11],
    [34, 11],
    [2, 24],
    [2, 29],
    [61, 24],
    [61, 29],
    [9, 1],
    [12, 1],
    [30, 46],
    [33, 46],
  ]);
  for (const b of VILLAGE_BUILDINGS) {
    if (!b.name || ["moinho", "celeiro"].includes(b.style)) continue;
    const fy = b.y + b.h;
    if (m[fy + 1] && ".,w".includes(m[fy + 1][b.door[0]]))
      put("q", [
        [b.door[0] - 1, fy],
        [b.door[0] + 1, fy],
      ]);
  }
  for (let y = 1; y < h - 1; y++)
    for (let x = 1; x < w - 1; x++)
      if (m[y][x] === "T") {
        for (const [dx, dy] of DIRS4) {
          if (m[y + dy] && m[y + dy][x + dx] === "." && (x * 13 + y * 7) % 4 === 0) {
            set(x + dx, y + dy, "u");
            break;
          }
        }
      }
  [
    [26, 16],
    [37, 16],
    [26, 23],
    [37, 23],
    [40, 23],
    [49, 24],
    [22, 17],
    [34, 26],
    [44, 35],
    [50, 30],
  ].forEach(([x, y]) => {
    if (m[y][x] === "." || m[y][x] === ",") set(x, y, "n");
  });
  [
    [50, 17],
    [50, 23],
    [16, 28],
    [48, 28],
    [13, 28],
  ].forEach(([x, y]) => {
    if (m[y][x] === ".") set(x, y, "k");
  });
  [
    [10, 9],
    [11, 9],
    [2, 13],
    [23, 9],
    [41, 6],
    [52, 10],
    [5, 11],
    [47, 11],
    [57, 11],
    [60, 13],
    [45, 28],
    [51, 29],
    [25, 36],
    [29, 36],
    [33, 36],
    [25, 46],
    [29, 45],
    [51, 38],
    [51, 43],
    [61, 30],
    [54, 36],
    [15, 45],
    [19, 45],
    [2, 45],
  ].forEach(([x, y]) => {
    if (m[y][x] === ".") set(x, y, "w");
  });
  [
    [20, 11],
    [35, 12],
    [44, 13],
    [2, 40],
    [16, 46],
    [34, 47],
    [44, 47],
    [53, 47],
  ].forEach(([x, y]) => {
    if (m[y] && m[y][x] === ".") set(x, y, "T");
  });
  for (const b of VILLAGE_BUILDINGS) {
    fill(b.x, b.y, b.x + b.w - 1, b.y + b.h - 1, "H");
    b.door.forEach((dx) => set(dx, b.y + b.h - 1, "D"));
  }
  [
    [3, 20],
    [7, 18],
    [7, 19],
    [12, 21],
    [18, 23],
    [22, 20],
    [22, 21],
    [35, 40],
    [40, 40],
    [45, 40],
    [50, 40],
    [35, 45],
    [40, 45],
    [45, 45],
    [17, 41],
    [23, 41],
    [55, 41],
    [60, 41],
    [24, 29],
    [30, 29],
    [33, 29],
    [39, 29],
    [42, 8],
    [51, 8],
    [60, 8],
    [53, 9],
  ].forEach(([x, y]) => {
    if (m[y][x] === ".") set(x, y, "w");
  });
  const trees = [];
  for (let x = 2; x < w - 2; x += 3) {
    trees.push([x, 1], [x, h - 2]);
  }
  for (let y = 2; y < h - 2; y += 3) {
    trees.push([1, y], [w - 2, y]);
  }
  trees.push(
    [22, 11],
    [23, 13],
    [41, 10],
    [42, 12],
    [50, 6],
    [50, 10],
    [60, 11],
    [61, 15],
    [47, 27],
    [17, 26],
    [20, 44],
    [24, 44],
    [27, 44],
    [22, 46],
    [28, 40],
    [50, 33],
    [50, 36],
    [48, 47],
    [16, 36],
    [17, 33],
    [59, 26],
    [61, 27],
    [54, 28],
    [61, 36],
    [54, 45],
    [60, 46],
    [13, 11],
    [9, 10],
    [3, 11],
    [7, 11],
    [1, 30],
    [1, 33],
  );
  trees.forEach(([x, y]) => {
    if (m[y] && m[y][x] === ".") set(x, y, "T");
  });
  for (let x = 33; x <= 50; x++) if (m[36][x] === "." || m[36][x] === "w") set(x, 36, ",");
  for (let x = 31; x <= 50; x++) {
    if (m[40][x] !== "H" && m[40][x] !== "D") set(x, 40, ",");
    if (m[45][x] !== "H" && m[45][x] !== "D" && m[45][x] !== "N") set(x, 45, ",");
  }
  for (let y = 14; y <= 25; y++) for (let x = 40; x <= 51; x++) if (m[y][x] !== "M") set(x, y, ",");
  Object.keys(STALLS).forEach((k) => {
    const [x, y] = k.split(",").map(Number);
    set(x, y, "M");
  });
  const npcs = {
    "49,15": "cocada",
    "49,19": "florista",
    "40,23": "bazarista",
    "43,23": "abrigo",
    "46,23": "chazeira",
    "49,23": "brinqueiro",
    "27,17": "odelia",
    "40,15": "bruno",
    "43,15": "rosa",
    "46,15": "doran",
    "40,19": "peixeiro",
    "43,19": "flor",
    "46,19": "lucio",
    "36,18": "lia",
    "58,8": "iara",
    "33,45": "tome",
    "28,34": "curandeira",
    "16,7": "kael",
    "38,34": "ferreiro",
    "60,34": "zaid",
    "59,18": "cocheiro",
    "30,11": "guarda",
    "33,11": "guarda2",
    "18,18": "bardo",
    "34,20": "honda",
  };
  for (const k in npcs) {
    const [x, y] = k.split(",").map(Number);
    m[y][x] = "N";
  }
  set(12, 19, "C");
  set(60, 45, "C");
  set(45, 46, "P");
  return finalize(
    "vila",
    d,
    m,
    w,
    h,
    {
      w: [0, 26],
      e: [w - 1, 26],
      n: [10, 0],
      s: [31, h - 1],
    },
    npcs,
    null,
  );
}
function genNatural(id, d) {
  const R = rng(d.seed),
    w = d.w,
    h = d.h;
  let m = makeGrid(w, h, (x, y) =>
    x === 0 || y === 0 || x === w - 1 || y === h - 1 || R() < d.wall ? "#" : ".",
  );
  m = caWalls(m, w, h, 5);
  for (let x = 0; x < w; x++) {
    m[0][x] = "#";
    m[h - 1][x] = "#";
  }
  for (let y = 0; y < h; y++) {
    m[y][0] = "#";
    m[y][w - 1] = "#";
  }
  const S = SIDES[d.side],
    open = S.pos(w, h),
    v = S.v;
  const inner = [open[0] + v[0] * 3, open[1] + v[1] * 3];
  const pt = (f) => [
    clampi(Math.round(f[0] * w + (R() - 0.5) * 6), 4, w - 5),
    clampi(Math.round(f[1] * h + (R() - 0.5) * 6), 4, h - 5),
  ];
  const guard = pt(d.guardF),
    altar = pt(d.altarF),
    page = pt(d.pageF);
  const wp = [0, 1, 2, 3, 4, 5].map(() => [4 + Math.floor(R() * (w - 8)), 4 + Math.floor(R() * (h - 8))]);
  const c = (a, b) => carvePath(m, a, b, R, w, h);
  c(inner, altar);
  c(altar, guard);
  c(altar, page);
  c(inner, wp[0]);
  c(wp[0], wp[1]);
  c(altar, wp[2]);
  c(wp[2], wp[3]);
  c(guard, wp[4]);
  c(page, wp[5]);
  for (let k = -1; k <= 1; k++)
    for (let s = 0; s <= 3; s++) {
      const x = open[0] + v[0] * s + (v[0] === 0 ? k : 0),
        y = open[1] + v[1] * s + (v[1] === 0 ? k : 0);
      m[y][x] = ".";
    }
  const clear = (p, r) => {
    for (let dy = -r; dy <= r; dy++)
      for (let dx = -r; dx <= r; dx++) {
        const X = p[0] + dx,
          Y = p[1] + dy;
        if (X > 0 && Y > 0 && X < w - 1 && Y < h - 1) m[Y][X] = ".";
      }
  };
  clear(guard, 3);
  clear(altar, 2);
  clear(inner, 2);
  clear(page, 1);
  const perp = v[0] === 0 ? [1, 0] : [0, 1];
  const npc = [inner[0] + v[0] * 2 + perp[0] * 3, inner[1] + v[1] * 2 + perp[1] * 3];
  clear(npc, 1);
  m[guard[1]][guard[0]] = "G";
  m[altar[1]][altar[0]] = "F";
  m[page[1]][page[0]] = "P";
  m[npc[1]][npc[0]] = "N";
  if (d.water) {
    const path = new Set();
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (m[y][x] === ".") path.add(x + "," + y);
    const prot = [guard, altar, page, npc, inner, open];
    const isProt = (x, y) => prot.some((p) => Math.abs(p[0] - x) <= 3 && Math.abs(p[1] - y) <= 3);
    const putW = (x, y) => {
      if (x < 1 || y < 1 || x >= w - 1 || y >= h - 1 || isProt(x, y)) return;
      const c = m[y][x];
      if (c === "." || c === "#") m[y][x] = "~";
    };
    const walkPath = new Set();
    const nR = d.water >= 0.45 ? 2 : 1;
    for (let r = 0; r < nR; r++) {
      const vert = (r === 0) === (d.side === "e" || d.side === "w");
      const L = vert ? h : w,
        M = vert ? w : h;
      let c0 = Math.round(M * (0.3 + R() * 0.4)),
        ph = R() * 6;
      for (let i = 1; i < L - 1; i++) {
        c0 = clampi(c0 + Math.round(Math.sin(i * 0.18 + ph) * 0.9 + (R() - 0.5) * 0.8), 3, M - 4);
        for (let k = 0; k < 2; k++) {
          vert ? putW(c0 + k, i) : putW(i, c0 + k);
        }
      }
    }
    const nL = Math.round(d.water * 6);
    for (let l = 0; l < nL; l++) {
      let cx2 = 0,
        cy2 = 0,
        ok = false;
      for (let tries = 0; tries < 40 && !ok; tries++) {
        cx2 = 5 + Math.floor(R() * (w - 10));
        cy2 = 5 + Math.floor(R() * (h - 10));
        ok = m[cy2][cx2] === "." && !isProt(cx2, cy2);
      }
      if (!ok) continue;
      const rad = 2.5 + R() * 3;
      for (let dy = -7; dy <= 7; dy++)
        for (let dx = -7; dx <= 7; dx++) {
          const X = cx2 + dx,
            Y = cy2 + dy;
          const dd = Math.hypot(dx, dy * 1.2) + (tileHash(X, Y) - 0.5) * 1.6;
          if (dd < rad && X > 1 && Y > 1 && X < w - 2 && Y < h - 2 && !isProt(X, Y) && m[Y][X] !== "=") {
            if (m[Y][X] === "." || m[Y][X] === "#") m[Y][X] = "~";
          }
        }
    }
    const bridge = (a, b) => {
      let x = a[0],
        y = a[1],
        g = 0;
      const st = () => {
        for (const [ox, oy] of [
          [0, 0],
          [1, 0],
          [0, 1],
        ]) {
          const X = x + ox,
            Y = y + oy;
          if (X < 1 || Y < 1 || X >= w - 1 || Y >= h - 1) continue;
          const c = m[Y][X];
          if (c === "~") m[Y][X] = "=";
          else if (c === "#") m[Y][X] = ".";
        }
      };
      while ((x !== b[0] || y !== b[1]) && g < 500) {
        g++;
        st();
        if (x !== b[0] && (Math.abs(b[0] - x) >= Math.abs(b[1] - y) || y === b[1])) x += Math.sign(b[0] - x);
        else y += Math.sign(b[1] - y);
      }
      st();
    };
    bridge(inner, altar);
    bridge(altar, guard);
    bridge(altar, page);
    bridge(inner, npc);
  }
  const out = shuffle(flood(m, w, h, inner), R);
  const chests = [];
  for (const [x, y] of out) {
    if (chests.length >= 6) break;
    if (m[y][x] !== ".") continue;
    let ok = true;
    for (let dy = -1; dy <= 1 && ok; dy++)
      for (let dx = -1; dx <= 1; dx++)
        if (m[y + dy][x + dx] !== "." && (dx || dy)) {
          ok = false;
          break;
        }
    if (
      !ok ||
      manhattan([x, y], inner) < 10 ||
      manhattan([x, y], guard) < 5 ||
      manhattan([x, y], altar) < 4 ||
      chests.some((q) => manhattan(q, [x, y]) < 12)
    )
      continue;
    chests.push([x, y]);
    m[y][x] = "C";
  }
  return finalize(
    id,
    d,
    m,
    w,
    h,
    {
      [d.side]: open,
    },
    {
      [npc[0] + "," + npc[1]]: d.npc,
    },
    inner,
  );
}
function genDungeon(id, d) {
  const R = rng(d.seed),
    w = d.w,
    h = d.h,
    mid = w >> 1;
  const m = makeGrid(w, h, () => "#");
  const rooms = [
    {
      x: mid - 4,
      y: 2,
      w: 9,
      h: 6,
    },
    {
      x: mid - 7,
      y: h - 12,
      w: 15,
      h: 10,
      boss: true,
    },
  ];
  for (let t = 0; t < 400 && rooms.length < 15; t++) {
    const rw = 5 + Math.floor(R() * 6),
      rh = 4 + Math.floor(R() * 5);
    const x = 2 + Math.floor(R() * (w - rw - 4)),
      y = 2 + Math.floor(R() * (h - rh - 4));
    if (!rooms.some((r) => x < r.x + r.w + 2 && x + rw + 2 > r.x && y < r.y + r.h + 2 && y + rh + 2 > r.y))
      rooms.push({
        x,
        y,
        w: rw,
        h: rh,
      });
  }
  for (const r of rooms)
    for (let y = r.y; y < r.y + r.h; y++) for (let x = r.x; x < r.x + r.w; x++) m[y][x] = ".";
  const ctr = (r) => [r.x + (r.w >> 1), r.y + (r.h >> 1)];
  const corr = (a, b) => {
    let [x, y] = ctr(a);
    const [tx, ty] = ctr(b);
    const dig = () => {
      for (let dy = 0; dy < 2; dy++)
        for (let dx = 0; dx < 2; dx++) {
          const X = x + dx,
            Y = y + dy;
          if (X > 0 && Y > 0 && X < w - 1 && Y < h - 1) m[Y][X] = ".";
        }
    };
    const hf = R() < 0.5;
    if (hf) {
      while (x !== tx) {
        dig();
        x += Math.sign(tx - x);
      }
      while (y !== ty) {
        dig();
        y += Math.sign(ty - y);
      }
    } else {
      while (y !== ty) {
        dig();
        y += Math.sign(ty - y);
      }
      while (x !== tx) {
        dig();
        x += Math.sign(tx - x);
      }
    }
    dig();
  };
  const boss = rooms[1],
    others = rooms.filter((r, i) => i > 1);
  const conn = [rooms[0]],
    rem = others.slice();
  while (rem.length) {
    let best = null;
    for (const a of conn)
      for (const b of rem) {
        const dd = manhattan(ctr(a), ctr(b));
        if (!best || dd < best[2]) best = [a, b, dd];
      }
    corr(best[0], best[1]);
    conn.push(best[1]);
    rem.splice(rem.indexOf(best[1]), 1);
  }
  let nb = null;
  for (const a of others) {
    if (!nb || manhattan(ctr(a), ctr(boss)) < manhattan(ctr(nb), ctr(boss))) nb = a;
  }
  corr(nb || rooms[0], boss);
  for (let i = 0; i < 3 && others.length > 2; i++)
    corr(others[Math.floor(R() * others.length)], others[Math.floor(R() * others.length)]);
  for (let y = 0; y < 3; y++) for (let x = mid - 1; x <= mid + 1; x++) m[y][x] = ".";
  const bc = ctr(boss);
  m[bc[1]][bc[0]] = "G";
  m[rooms[0].y + rooms[0].h - 2][rooms[0].x + 1] = "N";
  if (nb) {
    const a = ctr(nb);
    m[a[1]][a[0]] = "F";
  }
  const pool = shuffle(
    others.filter((r) => r !== nb),
    R,
  );
  if (pool[0]) {
    const p = ctr(pool[0]);
    m[p[1]][p[0]] = "P";
  }
  pool.slice(1, 6).forEach((r) => {
    const p = ctr(r);
    m[p[1]][p[0] + 1] = "C";
  });
  const npcs = {
    [rooms[0].x + 1 + "," + (rooms[0].y + rooms[0].h - 2)]: d.npc,
  };
  return finalize(
    id,
    d,
    m,
    w,
    h,
    {
      n: [mid, 0],
    },
    npcs,
    [mid, 2],
  );
}
const ZONE_DEFS = {
  vila: {
    nome: "Vila de Cinzaluz",
    theme: "vila",
    exits: {
      w: "bosque",
      e: "pantano",
      n: "picos",
      s: "torre",
    },
    enemies: [],
  },
  bosque: {
    nome: "Bosque Murmurante",
    theme: "bosque",
    w: 64,
    h: 46,
    side: "e",
    seed: 1101,
    wall: 0.45,
    water: 0.4,
    exits: {
      e: "vila",
    },
    enemies: ["lobo", "cogumelo"],
    guard: "ent",
    npc: "druida",
    guardF: [0.07, 0.5],
    altarF: [0.5, 0.55],
    pageF: [0.3, 0.12],
  },
  pantano: {
    nome: "Pântano das Brumas",
    theme: "pantano",
    w: 64,
    h: 46,
    side: "w",
    seed: 2207,
    wall: 0.36,
    water: 0.5,
    exits: {
      w: "vila",
    },
    enemies: ["sapo", "espectro"],
    guard: "serpente",
    npc: "pescador",
    guardF: [0.93, 0.5],
    altarF: [0.5, 0.45],
    pageF: [0.72, 0.88],
  },
  picos: {
    nome: "Picos Uivantes",
    theme: "picos",
    w: 50,
    h: 60,
    side: "s",
    seed: 3313,
    wall: 0.44,
    water: 0.38,
    exits: {
      s: "vila",
    },
    enemies: ["harpia", "golem"],
    guard: "grifo",
    npc: "monge",
    guardF: [0.5, 0.06],
    altarF: [0.55, 0.5],
    pageF: [0.15, 0.25],
  },
  escola: {
    nome: "Antiga Academia Arcana",
    theme: "escola",
    w: 40,
    h: 32,
    side: "n",
    seed: 5531,
    exits: {
      n: "vila",
    },
    enemies: ["livro", "aprendiz"],
    guard: "diretor",
    npc: "selene",
  },
  torre: {
    nome: "Torre do Silêncio",
    theme: "torre",
    w: 44,
    h: 40,
    side: "n",
    seed: 4421,
    exits: {
      n: "vila",
    },
    enemies: ["sentinela", "eco"],
    guard: "silenciador",
    npc: "espirito",
  },
};
const ZONES = {
  vila: genVila(ZONE_DEFS.vila),
  bosque: genNatural("bosque", ZONE_DEFS.bosque),
  pantano: genNatural("pantano", ZONE_DEFS.pantano),
  picos: genNatural("picos", ZONE_DEFS.picos),
  torre: genDungeon("torre", ZONE_DEFS.torre),
  escola: genDungeon("escola", ZONE_DEFS.escola),
  mina: genMine(),
};
(function fixSchool() {
  const z = ZONES.escola;
  const rows = z.map.map((r) => r.split(""));
  let books = 0;
  const chests = [];
  for (let y = 0; y < z.h; y++)
    for (let x = 0; x < z.w; x++) {
      if (rows[y][x] === "P") {
        rows[y][x] = "L";
        books++;
      } else if (rows[y][x] === "C") chests.push([x, y]);
    }
  chests.slice(2).forEach(([x, y]) => {
    if (books < 5) {
      rows[y][x] = "L";
      books++;
    }
  });
  const R = rng(777);
  let tries = 0;
  while (books < 5 && tries < 500) {
    tries++;
    const [x, y] = z.spawn[Math.floor(R() * z.spawn.length)];
    if (rows[y][x] === "." && Math.abs(x - z.w / 2) + y > 10) {
      rows[y][x] = "L";
      books++;
    }
  }
  z.map = rows.map((r) => r.join(""));
  z.feats = [];
  for (let y = 0; y < z.h; y++)
    for (let x = 0; x < z.w; x++) {
      const c = z.map[y][x];
      if ("GNFCPL".includes(c)) z.feats.push([x, y, c]);
    }
  z.spawn = z.spawn.filter(([x, y]) => z.map[y][x] === ".");
})();
/** Mina de Cristal: cavernas com pedras para minerar (nos dois modos). */
function genMine() {
  ZONE_DEFS.mina = {
    nome: "Mina de Cristal",
    theme: "mina",
    w: 36,
    h: 30,
    side: "n",
    seed: 7717,
    exits: {},
    enemies: [],
    guard: "basilisco",
  };
  const z = genDungeon("mina", ZONE_DEFS.mina);
  const R = rng(4242);
  const rows = z.map.map((r) => r.split(""));
  const open = (x, y) => rows[y] && rows[y][x] === ".";
  for (let y = 4; y < z.h - 1; y++)
    for (let x = 1; x < z.w - 1; x++) {
      if (rows[y][x] === "N") rows[y][x] = ".";
      // Pedra só no meio das salas, para nunca fechar um corredor.
      let around = 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (open(x + dx, y + dy)) around++;
      if (rows[y][x] === "." && around === 9 && R() < 0.3) rows[y][x] = "o";
    }
  z.map = rows.map((r) => r.join(""));
  z.feats = z.feats.filter((f) => f[2] === "G");
  z.npcs = {};
  z.npcList = [];
  return z;
}
function hutsFrom(st) {
  const h = [];
  for (const k in st) {
    const [x, y] = k.split(",").map(Number);
    if (st[x - 1 + "," + y] !== st[k])
      h.push({
        x,
        y,
        shop: st[k],
      });
  }
  return h;
}
ZONES.vila.town = {
  bld: VILLAGE_BUILDINGS,
  doors: DOORS,
  stalls: STALLS,
  huts: hutsFrom(STALLS),
  arrive: [57, 18],
  horses: [
    [57, 21],
    [59.5, 22],
  ],
  boats: [],
};
function buildTown(id, spec) {
  const w = spec.w,
    h = spec.h;
  const m = makeGrid(w, h, (x, y) => (x === 0 || y === 0 || x === w - 1 || y === h - 1 ? "#" : "."));
  const set = (x, y, c) => {
    if (x > 0 && y > 0 && x < w - 1 && y < h - 1) m[y][x] = c;
  };
  const fill = (x0, y0, x1, y1, c) => {
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) set(x, y, c);
  };
  spec.paint(set, fill, m);
  Object.keys(spec.stalls).forEach((k) => {
    const [x, y] = k.split(",").map(Number);
    set(x, y, "M");
  });
  const doors = {};
  for (const b of spec.bld) {
    fill(b.x, b.y, b.x + b.w - 1, b.y + b.h - 1, "H");
    b.door.forEach((dx) => {
      set(dx, b.y + b.h - 1, "D");
      doors[dx + "," + (b.y + b.h - 1)] = b;
    });
  }
  (spec.deco || []).forEach(([c, list]) =>
    list.forEach(([x, y]) => {
      if (m[y][x] === "." || (c === "n" && m[y][x] === ",")) set(x, y, c);
    }),
  );
  for (const k in spec.npcs) {
    const [x, y] = k.split(",").map(Number);
    m[y][x] = "N";
  }
  const z = finalize(id, ZONE_DEFS[id], m, w, h, {}, spec.npcs, null);
  z.town = {
    bld: spec.bld,
    doors,
    stalls: spec.stalls,
    huts: hutsFrom(spec.stalls),
    arrive: spec.arrive,
    horses: [],
    boats: spec.boats || [],
  };
  return z;
}
ZONE_DEFS.porto = {
  nome: "Porto Brisamar",
  theme: "porto",
  exits: {},
  enemies: [],
};
ZONE_DEFS.serra = {
  nome: "Pedravale, a Vila da Serra",
  theme: "serra",
  exits: {},
  enemies: [],
};
/* ===================== PORTO BRISAMAR (layout planejado) =====================
   Linhas:  3–6 prédios do norte · 7–9 rua principal · 10–13 mercado
            14–15 rua do cais · 16–18 prédios do sul · 19 calçada · 20 jardins
            21 calçadão da praia · 22–23 areia · 24–30 mar com 3 píeres        */
ZONES.porto = buildTown("porto", {
  w: 62,
  h: 32,
  arrive: [5, 19],
  paint: (set, fill) => {
    fill(1, 24, 42, 30, "~");
    fill(9, 24, 10, 29, "=");
    fill(20, 24, 21, 29, "=");
    fill(31, 24, 32, 29, "=");
    fill(1, 7, 42, 9, ",");
    fill(11, 10, 35, 13, ",");
    fill(1, 14, 42, 15, ",");
    fill(20, 7, 21, 23, ",");
    fill(1, 19, 36, 19, ",");
    fill(1, 21, 42, 21, ",");
    fill(9, 19, 10, 23, ",");
    fill(31, 19, 32, 23, ",");
    // Bairro novo a leste
    fill(43, 24, 60, 30, "~");
    fill(45, 24, 46, 29, "=");
    fill(54, 24, 55, 29, "=");
    fill(43, 7, 60, 9, ",");
    fill(43, 14, 60, 15, ",");
    fill(37, 19, 37, 19, ".");
    fill(42, 19, 60, 19, ",");
    fill(43, 21, 60, 21, ",");
    fill(45, 19, 46, 23, ",");
    fill(54, 19, 55, 23, ",");
    fill(46, 10, 58, 13, ",");
  },
  bld: [
    { id: "p16", style: "casa", x: 44, y: 3, w: 4, h: 4, door: [45] },
    {
      id: "p17",
      style: "casa2",
      x: 50,
      y: 3,
      w: 5,
      h: 4,
      door: [52],
      name: "Casa do Capitão",
    },
    { id: "p18", style: "casa", x: 57, y: 3, w: 3, h: 4, door: [58] },
    {
      id: "p19",
      style: "escola",
      x: 43,
      y: 16,
      w: 5,
      h: 3,
      door: [44],
      name: "Escola de Navegação",
    },
    { id: "p20", style: "casa2", x: 49, y: 16, w: 4, h: 3, door: [50] },
    { id: "p21", style: "casa", x: 56, y: 16, w: 4, h: 3, door: [57] },
    {
      id: "p1",
      style: "taverna",
      x: 2,
      y: 3,
      w: 6,
      h: 4,
      door: [5],
      name: "Taverna do Marujo",
      shop: "tavPorto",
    },
    {
      id: "p2",
      style: "pousada",
      x: 10,
      y: 3,
      w: 5,
      h: 4,
      door: [12],
      name: "Pousada Gaivota",
      inn: 20,
    },
    {
      id: "p3",
      style: "perola",
      x: 23,
      y: 3,
      w: 5,
      h: 4,
      door: [25],
      name: "Joalheria Pérola",
      shop: "perola",
    },
    {
      id: "p4",
      style: "moda",
      x: 30,
      y: 3,
      w: 5,
      h: 4,
      door: [32],
      name: "Moda Brisamar",
      cos: "moda",
    },
    { id: "p12", style: "casa", x: 37, y: 3, w: 4, h: 4, door: [38] },
    {
      id: "p5",
      style: "estab",
      x: 2,
      y: 16,
      w: 5,
      h: 3,
      door: [4],
      name: "Estábulo do Porto",
    },
    {
      id: "p7",
      style: "padaria",
      x: 9,
      y: 16,
      w: 4,
      h: 3,
      door: [10],
      name: "Padaria do Cais",
      shop: "padPorto",
    },
    {
      id: "p13",
      style: "marcenaria",
      x: 15,
      y: 16,
      w: 4,
      h: 3,
      door: [16],
      name: "Estaleiro Brisamar",
      shop: "moveis",
    },
    {
      id: "p8",
      style: "peixaria",
      x: 23,
      y: 16,
      w: 4,
      h: 3,
      door: [24],
      name: "Peixaria do Porto",
      shop: "peixPorto",
    },
    {
      id: "p9",
      style: "armazem",
      x: 29,
      y: 16,
      w: 3,
      h: 3,
      door: [30],
      name: "Armazém do Cais",
      shop: "armazem",
    },
    {
      id: "p15",
      style: "templo",
      x: 34,
      y: 16,
      w: 3,
      h: 3,
      door: [35],
      name: "Capela do Mar",
    },
    {
      id: "p6",
      style: "farol",
      x: 38,
      y: 15,
      w: 3,
      h: 6,
      door: [39],
      name: "Farol de Brisamar",
    },
  ],
  stalls: {
    "12,11": "peixeG",
    "13,11": "peixeG",
    "15,11": "especiarias",
    "16,11": "especiarias",
    "24,11": "conchas",
    "25,11": "conchas",
    "27,11": "frutasP",
    "28,11": "frutasP",
    "30,11": "redes",
    "48,11": "doceria",
    "49,11": "doceria",
    "55,11": "bazar",
    "56,11": "bazar",
    "31,11": "redes",
  },
  npcs: {
    "12,10": "nicoP",
    "15,10": "mercOri",
    "24,10": "conchas",
    "27,10": "frutasNPC",
    "30,10": "redesNPC",
    "48,10": "docesP",
    "55,10": "bazarP",
    "51,22": "pescadorVelho",
    "11,22": "marina",
    "24,22": "capitao",
    "7,20": "cocheiro2",
    "37,12": "portoA",
    "6,12": "portoB",
  },
  deco: [
    [
      "n",
      [
        [51, 11],
        [52, 11],
        [51, 13],
        [52, 13],
        [48, 22],
        [58, 22],
      ],
    ],
    [
      "l",
      [
        [45, 10],
        [59, 10],
        [45, 13],
        [59, 13],
        [48, 20],
        [53, 20],
        [59, 20],
      ],
    ],
    [
      "T",
      [
        [47, 1],
        [55, 1],
        [60, 2],
        [44, 23],
        [50, 23],
        [59, 23],
        [60, 11],
      ],
    ],
    [
      "w",
      [
        [44, 12],
        [58, 20],
        [43, 20],
        [52, 20],
      ],
    ],
    [
      "b",
      [
        [56, 20],
        [57, 20],
      ],
    ],
    [
      "n",
      [
        [18, 11],
        [23, 11],
        [6, 22],
        [16, 22],
        [26, 22],
        [36, 22],
      ],
    ],
    [
      "l",
      [
        [10, 10],
        [36, 10],
        [10, 13],
        [36, 13],
        [6, 20],
        [18, 20],
        [26, 20],
        [35, 20],
      ],
    ],
    [
      "T",
      [
        [3, 22],
        [14, 23],
        [26, 23],
        [37, 23],
        [9, 1],
        [23, 1],
        [35, 1],
        [41, 1],
        [2, 11],
        [40, 11],
      ],
    ],
    [
      "w",
      [
        [3, 20],
        [12, 20],
        [22, 20],
        [8, 12],
        [39, 13],
        [3, 13],
      ],
    ],
    [
      "b",
      [
        [28, 20],
        [29, 20],
        [11, 13],
        [35, 10],
      ],
    ],
    [
      "x",
      [
        [30, 20],
        [34, 13],
      ],
    ],
    ["V", [[14, 20]]],
  ],
  boats: [
    [50, 27],
    [59, 27],
    [14, 27],
    [26, 27],
    [37, 27],
  ],
});

/* ===================== PEDRAVALE (layout planejado) =====================
   Linhas:  3–7 prédios do norte (mina no centro) · 8–9 rua principal
            10–15 praça com mercado e fogueira · 16–17 rua de baixo
            18–20 prédios do sul · 21 calçada · 22–29 campos, casas e pasto      */
ZONES.serra = buildTown("serra", {
  w: 62,
  h: 40,
  arrive: [38, 21],
  paint: (set, fill) => {
    fill(1, 1, 42, 2, "#");
    fill(1, 8, 42, 9, ",");
    fill(13, 10, 30, 15, ",");
    fill(1, 16, 42, 17, ",");
    fill(21, 8, 22, 26, ",");
    fill(2, 21, 41, 21, ",");
    fill(2, 26, 34, 26, ",");
    fill(35, 22, 41, 22, "f");
    fill(35, 29, 41, 29, "f");
    fill(35, 22, 35, 29, "f");
    fill(41, 22, 41, 29, "f");
    set(35, 26, ".");
    // Bairro novo a leste e campos ao sul
    fill(43, 1, 60, 2, "#");
    fill(43, 8, 60, 9, ",");
    fill(43, 16, 60, 17, ",");
    fill(42, 21, 59, 21, ",");
    fill(46, 10, 58, 15, ",");
    fill(42, 26, 58, 26, ",");
    fill(50, 21, 51, 26, ",");
    fill(21, 27, 22, 30, ",");
    fill(2, 31, 58, 31, ",");
    fill(4, 33, 18, 37, "g");
    fill(3, 32, 19, 32, "f");
    fill(3, 38, 19, 38, "f");
    fill(3, 32, 3, 38, "f");
    fill(19, 32, 19, 38, "f");
    set(11, 32, ".");
    fill(26, 33, 40, 37, "g");
    fill(25, 32, 41, 32, "f");
    fill(25, 38, 41, 38, "f");
    fill(25, 32, 25, 38, "f");
    fill(41, 32, 41, 38, "f");
    set(33, 32, ".");
  },
  bld: [
    {
      id: "s14",
      style: "pedra",
      x: 44,
      y: 4,
      w: 4,
      h: 4,
      door: [45],
      name: "Torre de Vigia",
    },
    { id: "s15", style: "pedra", x: 50, y: 4, w: 4, h: 4, door: [51] },
    {
      id: "s16",
      style: "escola",
      x: 55,
      y: 4,
      w: 5,
      h: 4,
      door: [57],
      name: "Escola da Serra",
    },
    { id: "s17", style: "casa", x: 43, y: 18, w: 4, h: 3, door: [44] },
    { id: "s18", style: "pedra", x: 53, y: 18, w: 4, h: 3, door: [54] },
    {
      id: "s19",
      style: "celeiro",
      x: 46,
      y: 23,
      w: 4,
      h: 3,
      door: [47],
      name: "Celeiro da Serra",
    },
    { id: "s20", style: "casa2", x: 54, y: 23, w: 4, h: 3, door: [55] },
    {
      id: "s21",
      style: "moinho",
      x: 46,
      y: 32,
      w: 4,
      h: 4,
      door: [47],
      name: "Moinho da Serra",
    },
    {
      id: "s1",
      style: "forja",
      x: 2,
      y: 4,
      w: 6,
      h: 4,
      door: [4],
      name: "Forja Anã",
      shop: "forjaAna",
    },
    {
      id: "s2",
      style: "pousada",
      x: 10,
      y: 4,
      w: 6,
      h: 4,
      door: [12],
      name: "Pousada do Pico",
      inn: 20,
    },
    {
      id: "s0",
      style: "mina",
      x: 19,
      y: 3,
      w: 6,
      h: 5,
      door: [21, 22],
      name: "Mina de Cristal",
    },
    {
      id: "s3",
      style: "cristal",
      x: 27,
      y: 4,
      w: 5,
      h: 4,
      door: [29],
      name: "Loja de Cristais",
      shop: "cristais",
    },
    {
      id: "s4",
      style: "pedra",
      x: 34,
      y: 4,
      w: 6,
      h: 4,
      door: [36],
      name: "Casa de Chá",
      shop: "chaSerra",
    },
    { id: "s6", style: "pedra", x: 2, y: 18, w: 4, h: 3, door: [3] },
    {
      id: "s7",
      style: "padaria",
      x: 8,
      y: 18,
      w: 4,
      h: 3,
      door: [9],
      name: "Forno da Serra",
      shop: "padSerra",
    },
    {
      id: "s13",
      style: "marcenaria",
      x: 14,
      y: 18,
      w: 4,
      h: 3,
      door: [15],
      name: "Serraria do Pico",
      shop: "moveis",
    },
    {
      id: "s11",
      style: "templo",
      x: 24,
      y: 18,
      w: 4,
      h: 3,
      door: [25],
      name: "Templo da Montanha",
    },
    {
      id: "s12",
      style: "armazem",
      x: 30,
      y: 18,
      w: 4,
      h: 3,
      door: [31],
      name: "Armazém Anão",
      shop: "armazem",
    },
    {
      id: "s5",
      style: "estab",
      x: 36,
      y: 18,
      w: 4,
      h: 3,
      door: [37],
      name: "Estábulo da Serra",
    },
    { id: "s8", style: "pedra", x: 7, y: 23, w: 4, h: 3, door: [8] },
    { id: "s10", style: "casa", x: 16, y: 23, w: 4, h: 3, door: [17] },
    { id: "s9", style: "casa2", x: 27, y: 23, w: 4, h: 3, door: [28] },
  ],
  stalls: {
    "14,11": "minerios",
    "15,11": "minerios",
    "17,11": "queijos",
    "18,11": "queijos",
    "25,11": "peles",
    "26,11": "peles",
    "28,11": "ervasS",
    "29,11": "ervasS",
    "48,11": "doceria",
    "49,11": "doceria",
    "55,11": "bazar",
    "56,11": "bazar",
  },
  npcs: {
    "14,10": "minerA",
    "17,10": "queijeira",
    "25,10": "peleiro",
    "28,10": "erveira",
    "48,10": "docesS",
    "55,10": "bazarS",
    "10,13": "tobias",
    "33,13": "ancia",
    "41,20": "cocheiro3",
    "6,11": "serraA",
  },
  deco: [
    [
      "n",
      [
        [51, 12],
        [52, 12],
        [51, 14],
        [52, 14],
      ],
    ],
    ["S", [[52, 13]]],
    [
      "l",
      [
        [45, 10],
        [59, 10],
        [45, 15],
        [59, 15],
        [44, 22],
        [52, 22],
        [58, 22],
      ],
    ],
    [
      "T",
      [
        [60, 10],
        [60, 14],
        [43, 12],
        [42, 24],
        [58, 28],
        [44, 29],
        [52, 29],
        [56, 36],
        [60, 33],
        [2, 34],
        [22, 34],
        [44, 37],
      ],
    ],
    [
      "o",
      [
        [59, 25],
        [43, 34],
        [23, 36],
        [58, 35],
      ],
    ],
    [
      "w",
      [
        [48, 22],
        [56, 22],
        [44, 27],
        [52, 27],
      ],
    ],
    [
      "Y",
      [
        [11, 35],
        [33, 35],
      ],
    ],
    [
      "n",
      [
        [19, 12],
        [24, 12],
        [19, 15],
        [24, 15],
      ],
    ],
    [
      "l",
      [
        [12, 10],
        [31, 10],
        [12, 15],
        [31, 15],
        [6, 22],
        [16, 22],
        [26, 22],
      ],
    ],
    ["S", [[17, 14]]],
    ["W", [[26, 14]]],
    [
      "T",
      [
        [3, 11],
        [9, 11],
        [3, 14],
        [36, 11],
        [40, 14],
        [41, 10],
        [2, 23],
        [2, 29],
        [14, 29],
        [19, 29],
        [25, 29],
        [32, 29],
      ],
    ],
    [
      "o",
      [
        [5, 14],
        [38, 12],
        [7, 29],
        [12, 24],
        [24, 24],
        [33, 24],
      ],
    ],
    [
      "w",
      [
        [4, 22],
        [11, 22],
        [19, 22],
        [29, 22],
        [4, 27],
        [13, 27],
      ],
    ],
    [
      "h",
      [
        [36, 23],
        [40, 28],
      ],
    ],
    [
      "b",
      [
        [8, 10],
        [9, 10],
      ],
    ],
    ["x", [[26, 10]]],
  ],
});
ZONE_DEFS.casa = {
  nome: "Sua Casa",
  theme: "casa",
  exits: {},
  enemies: [],
};
ZONE_DEFS.interior = {
  nome: "",
  theme: "interior",
  exits: {},
  enemies: [],
};
ZONES.casa = (function () {
  const w = 14,
    h = 10;
  const m = makeGrid(w, h, (x, y) =>
    x === 0 || y === 0 || x === w - 1 || y === h - 1 || y === 1 ? "#" : ".",
  );
  m[h - 1][6] = "X";
  m[h - 1][7] = "X";
  const z = finalize("casa", ZONE_DEFS.casa, m, w, h, {}, {}, null);
  z.town = {
    bld: [],
    doors: {},
    stalls: {},
    huts: [],
    arrive: [6, 7],
    horses: [],
    boats: [],
    indoor: true,
  };
  return z;
})();
ZONES.interior = (function () {
  const m = makeGrid(12, 10, (x, y) => (x === 0 || y === 0 || x === 11 || y === 9 || y === 1 ? "#" : "."));
  m[9][5] = "X";
  m[9][6] = "X";
  const z = finalize("interior", ZONE_DEFS.interior, m, 12, 10, {}, {}, null);
  z.town = {
    bld: [],
    doors: {},
    stalls: {},
    huts: [],
    arrive: [6, 8],
    horses: [],
    boats: [],
    indoor: true,
  };
  return z;
})();
const FURN_DEF = {
  cama: "Cama",
  armario: "Guarda-roupa",
  lareira: "Lareira",
  mesa: "Mesa",
  cadeira: "Cadeira",
  tapete: "Tapete",
};
function furnAt(x, y, solidOnly) {
  return player.zone === "casa"
    ? (player.furn || []).find((f) => f.x === x && f.y === y && (!solidOnly || !furnWalk(f.id)))
    : null;
}
function furnWalk(id) {
  return [
    "tapete",
    "m_tapete",
    "m_tapeteR",
    "cadeira",
    "m_cadeira",
    "m_planta",
    "m_flores",
    "m_vela",
    "m_bau",
    "m_quadro",
  ].includes(id);
}
function furnName(id) {
  return ITEMS[id] ? ITEMS[id].nome : FURN_DEF[id] || id;
}
function enterHouse(h) {
  // Lembra por qual porta você entrou (no Simulador dá para ter várias casas).
  player.homeReturn = h ? { zone: h.zone, x: h.x, y: h.y + 1 } : { zone: "vila", x: 5, y: 18 };
  player.zone = "casa";
  player.x = 6;
  player.y = 7;
  player.dir = "up";
  player.riding = false;
  game.fade = 1;
  enterZone(false);
  playSound(330, 0.15, "triangle");
  if (!player.flags.casaTip) {
    player.flags.casaTip = true;
    setTimeout(
      () =>
        say([
          ["", "Sua casa! Aqui você dorme, troca de roupa e mora com sua família."],
          [
            "",
            "Aperte R (ou o botão Decorar) para decorar: compre móveis na Marcenaria do Tonico e coloque onde quiser.",
          ],
        ]),
      400,
    );
  }
}
function leaveHouse() {
  const r = player.homeReturn || { zone: "vila", x: 5, y: 18 };
  player.zone = r.zone;
  player.x = r.x;
  player.y = r.y;
  player.dir = "down";
  game.fade = 1;
  enterZone(false);
  saveGame();
  playSound(330, 0.12, "triangle");
}
function furnUse(f) {
  const id = f.id;
  if (id === "cama" || id === "m_camaLux") {
    restMenu();
    return;
  }
  if (id === "armario") {
    showCreate("wardrobe");
    return;
  }
  if (id === "lareira" || id === "m_lareira") {
    fireplaceMenu();
    return;
  }
  if (id === "m_estante") {
    if (player.famDay["est"] === player.day) {
      say([["", "Você já leu bastante hoje."]]);
      return;
    }
    player.famDay["est"] = player.day;
    player.xp += 15 + player.lvl * 2;
    say([
      [
        "",
        [
          "Você lê um livro sobre dragões das montanhas.",
          "Você lê poesias antigas sobre a Canção Arcana.",
          "Você lê um guia de culinária mágica. Que fome!",
        ][Math.floor(Math.random() * 3)],
      ],
      ["", "+" + (15 + player.lvl * 2) + " XP."],
    ]);
    return;
  }
  if (id === "m_aquario") {
    player.mp = Math.min(maxMp(), player.mp + 10);
    toast("Os peixinhos nadam em círculos. +10 MP.");
    return;
  }
  if (id === "m_harpa") {
    playTune();
    toast("Você toca uma melodia suave.");
    return;
  }
  if (id === "m_caldeirao") {
    if (player.famDay["cald"] === player.day) {
      say([["", "O caldeirão ainda está esfriando. Volte amanhã."]]);
      return;
    }
    player.famDay["cald"] = player.day;
    addItem("pocao");
    saveGame();
    say([["", "Você mexe o caldeirão e prepara uma Poção de Vida!"]]);
    return;
  }
  say([["", `${furnName(id)}. Ficou bonito aqui.`]]);
}
function frontTile() {
  const [dx, dy] = DIR_VECTORS[player.dir];
  return [player.x + dx, player.y + dy];
}
function canPlace(x, y) {
  const z = ZONES.casa;
  if (x < 1 || y < 2 || x >= z.w - 1 || y >= z.h - 1) return false;
  if (z.map[y][x] !== ".") return false;
  if (y === z.h - 2 && (x === 6 || x === 7)) return false;
  if (x === player.x && y === player.y) return false;
  if (familyList().some((f) => f.x === x && f.y === y)) return false;
  return !furnAt(x, y);
}
function openDecor() {
  if (player.zone !== "casa") {
    toast("Você só pode decorar dentro da sua casa.");
    return;
  }
  game.mode = "shop";
  game.shopId = "__decor";
  renderDecor();
  byId("shop").style.display = "block";
}
function renderDecor() {
  const [fx, fy] = frontTile(),
    fr = furnAt(fx, fy),
    ok = canPlace(fx, fy);
  const ids = Object.keys(player.inv).filter((id) => ITEMS[id].tipo === "movel");
  let h = `<div class="gh"><h2>Decorar a casa</h2><button id="shclose">Fechar (Esc)</button></div>
  <div class="gsub">Fique de frente para um espaço vazio e escolha um móvel. Para tirar um móvel, fique de frente para ele e guarde.</div>
  <div class="irow"><div><div class="nm">À sua frente: ${fr ? furnName(fr.id) : ok ? "espaço vazio ✓" : "não dá para colocar aqui"}</div></div>${fr ? '<button id="dpick">Guardar este móvel</button>' : ""}</div>
  <h3>Seus móveis guardados</h3>`;
  if (!ids.length)
    h +=
      '<div class="qtip">Nenhum móvel guardado. Compre na Marcenaria do Tonico (praça oeste de Cinzaluz).</div>';
  for (const id of ids)
    h += `<div class="irow"><div><div class="nm">${iconHTML(itemIcon(id))}${ITEMS[id].nome} ×${itemCount(id)}</div><div class="ds">${ITEMS[id].desc}</div></div><button data-pl="${id}" ${ok ? "" : "disabled"}>Colocar à frente</button></div>`;
  h += `<h3>Na sua casa (${(player.furn || []).length} móveis)</h3><div class="qtip">${(player.furn || []).map((f) => furnName(f.id)).join(", ") || "vazia"}</div>
  <div class="qtip">Dica: feche esta janela, ande até outro lugar e abra de novo (R) para colocar em outro ponto.</div>`;
  byId("shop").innerHTML = h;
  byId("shclose").onclick = closeShop;
  if (byId("dpick"))
    byId("dpick").onclick = () => {
      const it = fr.id;
      player.furn = player.furn.filter((f) => f !== fr);
      if (ITEMS[it]) addItem(it);
      else (player.furnBase = player.furnBase || []).push(it);
      playSound(500, 0.08, "sine");
      saveGame();
      renderDecor();
    };
  byId("shop")
    .querySelectorAll("[data-pl]")
    .forEach(
      (b) =>
        (b.onclick = () => {
          const id = b.dataset.pl;
          if (!canPlace(fx, fy)) return;
          removeItem(id);
          player.furn.push({
            id,
            x: fx,
            y: fy,
          });
          playSound(700, 0.1, "sine");
          saveGame();
          renderDecor();
        }),
    );
}
function drawFurn(f, t) {
  const X = f.x * TILE,
    Y = f.y * TILE,
    id = f.id,
    c = (col, a, b, w, h) => {
      ctx.fillStyle = col;
      ctx.fillRect(X + a, Y + b, w, h);
    },
    sh = () => {
      ctx.fillStyle = "rgba(0,0,0,.22)";
      ctx.fillRect(X + 3, Y + 27, 26, 4);
    };
  switch (id) {
    case "tapete":
    case "m_tapete":
      c("#8a3a4a", 1, 4, 30, 24);
      c("#c9a050", 3, 6, 26, 20);
      c("#8a3a4a", 6, 9, 20, 14);
      c("#e8d0a0", 12, 14, 8, 4);
      break;
    case "m_tapeteR":
      c("#a82a2a", 0, 2, 32, 28);
      c("#f2c14e", 2, 4, 28, 24);
      c("#a82a2a", 4, 6, 24, 20);
      c("#f2c14e", 13, 13, 6, 6);
      break;
    case "cama":
      sh();
      c("#6b4423", 2, 0, 28, 30);
      c("#f2eee4", 4, 2, 24, 8);
      c("#4a74c9", 4, 10, 24, 18);
      c("#3a5aa0", 4, 10, 24, 3);
      break;
    case "m_camaLux":
      sh();
      c("#4a2e17", 1, -12, 3, 42);
      c("#4a2e17", 28, -12, 3, 42);
      c("#8a2a5a", 0, -14, 32, 5);
      c("#c94a8a", 2, -9, 28, 4);
      c("#6b4423", 3, 2, 26, 28);
      c("#f2eee4", 5, 4, 22, 7);
      c("#a82a5a", 5, 11, 22, 17);
      c("#f2c14e", 5, 11, 22, 2);
      break;
    case "armario":
      sh();
      c("#5a3a1e", 3, -10, 26, 38);
      c("#7a5030", 5, -8, 10, 34);
      c("#7a5030", 17, -8, 10, 34);
      c("#f2c14e", 13, 8, 2, 3);
      c("#f2c14e", 17, 8, 2, 3);
      break;
    case "lareira":
    case "m_lareira":
      sh();
      c("#7f796d", 1, -10, 30, 38);
      c("#6a655b", 1, -10, 30, 4);
      c("#2a1a10", 7, 4, 18, 20);
      c(`rgb(255,${140 + Math.floor(Math.sin(t * 9) * 40)},40)`, 10, 14 + Math.sin(t * 7) * 2, 12, 10);
      c("#ffd66b", 13, 18, 6, 6);
      break;
    case "mesa":
    case "m_mesa":
      sh();
      c("#8a5a2e", 2, 8, 28, 10);
      c("#a8784a", 2, 6, 28, 4);
      c("#6b4423", 4, 18, 3, 10);
      c("#6b4423", 25, 18, 3, 10);
      c("#f2eee4", 12, 3, 8, 4);
      break;
    case "cadeira":
    case "m_cadeira":
      sh();
      c("#7a5030", 9, 0, 14, 16);
      c("#8a5a2e", 8, 14, 16, 5);
      c("#5a3a1e", 9, 19, 3, 9);
      c("#5a3a1e", 20, 19, 3, 9);
      break;
    case "m_estante":
      sh();
      c("#5a3a1e", 2, -12, 28, 40);
      for (let r = 0; r < 3; r++) {
        c("#3a2414", 4, -9 + r * 12, 24, 9);
        for (let k = 0; k < 5; k++)
          c(
            ["#c94a4a", "#4a74c9", "#5a9a4a", "#d9a441", "#8a4ad9"][(k + r) % 5],
            5 + k * 5,
            -8 + r * 12,
            4,
            8,
          );
      }
      break;
    case "m_planta":
      sh();
      c("#a85a3a", 10, 18, 12, 10);
      c("#3d7a2a", 8, 6, 6, 14);
      c("#4a9a3a", 14, 2, 6, 18);
      c("#3d7a2a", 19, 8, 5, 12);
      break;
    case "m_flores":
      sh();
      c("#5a6a9a", 11, 18, 10, 10);
      c("#3d7a2a", 13, 8, 2, 12);
      c("#3d7a2a", 17, 8, 2, 12);
      ctx.fillStyle = "#ff6b8a";
      circle(X + 14, Y + 8, 4);
      ctx.fillStyle = "#f5d76e";
      circle(X + 19, Y + 6, 4);
      ctx.fillStyle = "#fff";
      circle(X + 16, Y + 12, 3);
      break;
    case "m_quadro":
      sh();
      c("#6b4423", 8, 6, 2, 22);
      c("#6b4423", 22, 6, 2, 22);
      c("#8a5a2e", 4, 0, 24, 18);
      c("#7ab0d9", 6, 2, 20, 8);
      c("#5a9a4a", 6, 10, 20, 6);
      c("#f2c14e", 20, 3, 3, 3);
      break;
    case "m_bau":
      sh();
      c("#6b4423", 4, 10, 24, 18);
      c("#8a5a2e", 4, 6, 24, 6);
      c("#f2c14e", 14, 12, 4, 5);
      c("#f2c14e", 4, 11, 24, 1);
      break;
    case "m_aquario":
      sh();
      c("#6b4423", 3, 20, 26, 8);
      c("#9fd8f0", 4, 4, 24, 16);
      c("#3a9ad0", 4, 12, 24, 8);
      c("#ff9a3c", 8 + Math.sin(t * 2) * 5, 9, 5, 3);
      c("#f2c14e", 18 + Math.cos(t * 1.7) * 4, 14, 4, 3);
      c("#5a9a4a", 22, 14, 2, 6);
      break;
    case "m_harpa":
      sh();
      c("#c9a050", 8, 0, 4, 28);
      c("#c9a050", 8, 0, 16, 4);
      ctx.strokeStyle = "#d9a441";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(X + 24, Y + 2);
      ctx.quadraticCurveTo(X + 30, Y + 16, X + 12, Y + 27);
      ctx.stroke();
      for (let k = 0; k < 4; k++) c("#f2eee4", 13 + k * 3, 4, 1, 20 - k * 3);
      break;
    case "m_vela":
      sh();
      c("#c9a050", 14, 10, 4, 18);
      c("#c9a050", 6, 10, 20, 3);
      c("#f2eee4", 6, 4, 3, 6);
      c("#f2eee4", 14, 2, 3, 8);
      c("#f2eee4", 23, 4, 3, 6);
      ctx.fillStyle = "#ffd66b";
      circle(X + 7, Y + 3, 2);
      circle(X + 15, Y + 1, 2);
      circle(X + 24, Y + 3, 2);
      break;
    case "m_berco":
      sh();
      c("#a8784a", 3, 10, 26, 16);
      c("#f2eee4", 6, 12, 20, 10);
      c("#ffb3c8", 6, 18, 20, 4);
      c("#8a5a2e", 3, 8, 26, 3);
      break;
    case "m_caldeirao":
      sh();
      c("#3a3a44", 5, 10, 22, 16);
      c("#2a2a30", 3, 8, 26, 4);
      c("#7ad36b", 6, 9, 20, 3);
      ctx.fillStyle = "rgba(122,211,107,.5)";
      circle(X + 12, Y + 4 - ((t * 20) % 10), 3);
      circle(X + 20, Y + 2 - ((t * 15) % 10), 2);
      break;
    case "m_trofeu":
      sh();
      c("#6b4423", 8, 22, 16, 6);
      c("#f2c14e", 12, 10, 8, 12);
      c("#f2c14e", 6, 0, 20, 10);
      c("#ffe066", 9, 2, 6, 4);
      c("#f2c14e", 2, 2, 4, 6);
      c("#f2c14e", 26, 2, 4, 6);
      break;
    default:
      sh();
      c("#8a5a2e", 6, 6, 20, 20);
  }
}

/* ===================== INTERIORES DOS COMÉRCIOS ===================== */

const KEEPERS = {
  peixaria: ["Peixeira Dora", "#2a5a8a", "#3a2414"],
  acougue: ["Açougueiro Bento", "#8a2a2a", "#3a2414"],
  armazem: ["Seu Armando", "#5a6a3a", "#d9d9d9"],
  tecidos: ["Costureira Dália", "#8a3a7a", "#1a1a1a"],
  boticario: ["Boticária Salvia", "#2a6a5a", "#8a3a1a"],
  livraria: ["Livreiro Otto", "#3a3a7a", "#d9d9d9"],
  emporio: ["Mercadora Yara", "#b8602a", "#1a1a1a"],
  escola: ["Professora Helena", "#4a6a9a", "#8a3a1a"],
  padaria: ["Dona Bia", "#c9853a", "#e8e4dc"],
  taverna: ["Gus, o Taverneiro", "#6a2a2a", "#3a2414"],
  guilda: ["Mestre Helga", "#2a5a3a", "#d9a441"],
  biblio: ["Bibliotecário Rui", "#4a2a6a", "#1a1a1a"],
  castle: ["Rainha Aurélia", "#8a2a5a", "#d9a441"],
  templo: ["Padre Anselmo", "#e8e4dc", "#8a8a8a"],
  hosp: ["Enfermeira Clara", "#f2eee4", "#3a2414"],
  forja: ["Aprendiz Tito", "#5a4a3a", "#3a2414"],
  alfaiate: ["Costureira Lena", "#8a3a6a", "#a8442a"],
  salao: ["Barbeiro Fausto", "#d9a441", "#1a1a1a"],
  marcenaria: ["Tonico, o Marceneiro", "#7a5a2a", "#5a3a22"],
  troca: ["Assistente Kim", "#6a3a8a", "#1a1a1a"],
  estab: ["Cavalariço Zé", "#8a6a3a", "#5a3a22"],
  pousada: ["Estalajadeira Nina", "#2a6a6a", "#d9a441"],
  perola: ["Joalheira Pérola", "#3a8ab0", "#e8e4dc"],
  moda: ["Estilista Madá", "#c94a8a", "#4a7ad9"],
  cristal: ["Cristaleira Ivy", "#4a3a8a", "#e8e4dc"],
  pedra: ["Dona Hortência", "#7a6a8a", "#e8e4dc"],
};
const SOLID_PROPS = new Set([
  "oven",
  "forge",
  "fire",
  "books",
  "shelfP",
  "altar",
  "board",
  "weapons",
  "horse",
  "armor",
  "manneq",
  "mirror",
  "barber",
  "bed",
]);
const ENTER_STYLES = new Set(Object.keys(KEEPERS));
const INTER_PAL = {
  stone: ["#7a7468", "#6e695e", "#5a554c", "#9a948a"],
  wood: ["#8a6038", "#946840", "#6b4423", "#e8d8b8"],
};
const INTER_PROPS = {
  peixaria: [
    ["barrel", 2, 2],
    ["barrel", 3, 2],
    ["crate", 9, 2],
    ["table", 2, 6],
    ["crate", 9, 6],
    ["barrel", 9, 7],
    ["plant", 2, 7],
  ],
  acougue: [
    ["barrel", 2, 2],
    ["crate", 3, 2],
    ["table", 9, 2],
    ["barrel", 9, 6],
    ["crate", 2, 6],
  ],
  armazem: [
    ["crate", 2, 2],
    ["crate", 3, 2],
    ["barrel", 8, 2],
    ["barrel", 9, 2],
    ["shelfP", 2, 6],
    ["crate", 9, 6],
    ["barrel", 9, 7],
  ],
  tecidos: [
    ["manneq", 2, 2],
    ["manneq", 9, 2],
    ["rug", 5, 6],
    ["table", 2, 6],
    ["mirror", 9, 6],
  ],
  boticario: [
    ["shelfP", 2, 2],
    ["shelfP", 3, 2],
    ["shelfP", 8, 2],
    ["books", 9, 2],
    ["table", 2, 6],
    ["plant", 9, 6],
  ],
  livraria: [
    ["books", 2, 2],
    ["books", 3, 2],
    ["books", 8, 2],
    ["books", 9, 2],
    ["books", 2, 6],
    ["table", 9, 6],
    ["chair", 8, 6],
  ],
  emporio: [
    ["display", 2, 2],
    ["display", 9, 2],
    ["rug", 5, 6],
    ["crate", 2, 6],
    ["barrel", 9, 6],
    ["plant", 9, 7],
  ],
  escola: [
    ["board", 5, 2],
    ["board", 6, 2],
    ["table", 2, 6],
    ["table", 4, 6],
    ["table", 7, 6],
    ["table", 9, 6],
    ["table", 2, 8],
    ["table", 4, 8],
    ["table", 7, 8],
    ["table", 9, 8],
    ["books", 9, 2],
    ["plant", 2, 2],
  ],
  padaria: [
    ["oven", 2, 2],
    ["oven", 3, 2],
    ["bread", 8, 2],
    ["bread", 9, 2],
    ["table", 2, 6],
    ["chair", 3, 6],
    ["plant", 9, 6],
    ["bread", 9, 5],
  ],
  taverna: [
    ["fire", 2, 2],
    ["barrel", 12, 2],
    ["barrel", 13, 2],
    ["barrel", 13, 3],
    ["table", 3, 6],
    ["chair", 2, 6],
    ["chair", 4, 6],
    ["table", 11, 6],
    ["chair", 10, 6],
    ["chair", 12, 6],
    ["table", 7, 8],
    ["chair", 6, 8],
    ["chair", 8, 8],
    ["bard", 2, 8],
    ["rug", 7, 6],
  ],
  guilda: [
    ["maptable", 2, 6],
    ["weapons", 2, 2],
    ["weapons", 3, 2],
    ["armor", 9, 2],
    ["board", 8, 2],
    ["plant", 9, 6],
    ["chair", 3, 7],
  ],
  biblio: [
    ["books", 2, 2],
    ["books", 3, 2],
    ["books", 8, 2],
    ["books", 9, 2],
    ["table", 2, 6],
    ["chair", 3, 6],
    ["table", 8, 6],
    ["chair", 9, 6],
    ["books", 5, 2],
  ],
  castle: [
    ["carpet", 8, 4],
    ["carpet", 8, 5],
    ["carpet", 8, 6],
    ["carpet", 8, 7],
    ["carpet", 8, 8],
    ["carpet", 8, 9],
    ["carpet", 8, 10],
    ["banner", 3, 2],
    ["banner", 13, 2],
    ["armor", 2, 5],
    ["armor", 15, 5],
    ["armor", 2, 9],
    ["armor", 15, 9],
    ["fire", 5, 2],
    ["fire", 11, 2],
    ["plant", 3, 10],
    ["plant", 14, 10],
  ],
  templo: [
    ["altar", 6, 2],
    ["altar", 7, 2],
    ["pew", 3, 6],
    ["pew", 4, 6],
    ["pew", 9, 6],
    ["pew", 10, 6],
    ["pew", 3, 8],
    ["pew", 4, 8],
    ["pew", 9, 8],
    ["pew", 10, 8],
    ["candle", 2, 2],
    ["candle", 11, 2],
    ["plant", 2, 10],
    ["plant", 11, 10],
  ],
  hosp: [
    ["bed", 2, 6],
    ["bed", 2, 3],
    ["bed", 9, 6],
    ["bed", 9, 3],
    ["plant", 5, 7],
    ["shelfP", 8, 2],
  ],
  forja: [
    ["forge", 2, 2],
    ["anvil", 3, 6],
    ["weapons", 9, 2],
    ["armor", 9, 6],
    ["barrel", 2, 7],
  ],
  alfaiate: [
    ["manneq", 2, 2],
    ["manneq", 3, 2],
    ["manneq", 9, 2],
    ["mirror", 9, 6],
    ["table", 2, 6],
    ["rug", 5, 6],
  ],
  salao: [
    ["barber", 2, 6],
    ["mirror", 2, 5],
    ["barber", 9, 6],
    ["mirror", 9, 5],
    ["plant", 9, 2],
    ["shelfP", 2, 2],
  ],
  marcenaria: [
    ["bench", 2, 6],
    ["bench", 9, 6],
    ["chair", 2, 2],
    ["table", 9, 2],
    ["crate", 3, 7],
    ["plant", 9, 7],
  ],
  troca: [
    ["crate", 2, 2],
    ["crate", 3, 2],
    ["crate", 9, 2],
    ["barrel", 9, 3],
    ["display", 2, 6],
    ["display", 9, 6],
    ["rug", 5, 7],
  ],
  estab: [
    ["hay", 2, 2],
    ["hay", 3, 2],
    ["horse", 2, 6],
    ["horse", 9, 6],
    ["hay", 9, 2],
    ["barrel", 9, 3],
  ],
  pousada: [
    ["bed", 2, 6],
    ["bed", 9, 6],
    ["fire", 2, 2],
    ["table", 9, 2],
    ["chair", 8, 2],
    ["plant", 5, 7],
    ["rug", 5, 5],
  ],
  perola: [
    ["display", 2, 6],
    ["display", 9, 6],
    ["display", 2, 2],
    ["plant", 9, 2],
    ["rug", 5, 6],
  ],
  moda: [
    ["manneq", 2, 2],
    ["manneq", 3, 2],
    ["manneq", 8, 2],
    ["manneq", 9, 2],
    ["mirror", 2, 6],
    ["rug", 5, 6],
    ["plant", 9, 6],
  ],
  cristal: [
    ["crystal", 2, 2],
    ["crystal", 9, 2],
    ["crystal", 2, 6],
    ["crystal", 9, 6],
    ["display", 3, 7],
  ],
  pedra: [
    ["table", 2, 6],
    ["chair", 3, 6],
    ["table", 9, 6],
    ["chair", 8, 6],
    ["fire", 2, 2],
    ["plant", 9, 2],
    ["shelfP", 8, 2],
  ],
};
function genInterior(b) {
  const st = b.style,
    big = st === "castle",
    mid = st === "taverna" || st === "templo";
  const w = big ? 18 : mid ? 16 : 12,
    h = big ? 13 : mid ? 12 : 10,
    cx = Math.floor(w / 2);
  const m = makeGrid(w, h, (x, y) =>
    x === 0 || y === 0 || x === w - 1 || y === h - 1 || y === 1 ? "#" : ".",
  );
  m[h - 1][cx - 1] = "X";
  m[h - 1][cx] = "X";
  const ky = big ? 3 : 3;
  if (big) {
    m[3][cx - 1] = "Q";
    m[3][cx] = "Q";
  } else for (let x = cx - 2; x <= cx + 1; x++) m[4][x] = "Q";
  ZONE_DEFS.interior = {
    nome: b.name || "",
    theme: "interior",
    exits: {},
    enemies: [],
  };
  const z = finalize("interior", ZONE_DEFS.interior, m, w, h, {}, {}, null);
  z.town = {
    bld: [],
    doors: {},
    stalls: {},
    huts: [],
    arrive: [cx, h - 2],
    horses: [],
    boats: [],
    indoor: true,
  };
  const kp = KEEPERS[st] || ["Atendente", "#5a5a7a", "#3a2414"];
  const extra = [
    ["plant", 1, h - 2],
    ["plant", w - 2, h - 2],
    ["rug", cx - 1, h - 3],
    ["rug", cx, h - 3],
    ["candle", 1, 2],
    ["plant", w - 2, 2],
    ["barrel", 1, 5],
    ["crate", w - 2, 5],
  ];
  const props0 = (INTER_PROPS[st] || []).filter(([id, x, y]) => x < w - 1 && y < h - 1 && m[y][x] === ".");
  const props = props0.concat(
    extra.filter(
      ([id, x, y]) =>
        x > 0 &&
        y > 1 &&
        x < w - 1 &&
        y < h - 1 &&
        m[y][x] === "." &&
        !props0.some((p) => p[1] === x && p[2] === y),
    ),
  );
  const people = [];
  const free = [];
  for (let y = 5; y < h - 2; y++)
    for (let x = 1; x < w - 1; x++)
      if (m[y][x] === "." && !props.some((p) => p[1] === x && p[2] === y) && Math.abs(x - cx) > 1)
        free.push([x, y]);
  const nPeople =
    st === "taverna"
      ? tavernParty()
        ? 12
        : 6
      : st === "escola"
        ? 0
        : big
          ? 2
          : ["estab", "hosp", "perola", "cristal"].includes(st)
            ? 1
            : 2;
  const robes = ["#8a3a3a", "#3a6a8a", "#5a7a3a", "#8a6a2a", "#6a3a7a"],
    hairs = ["#3a2414", "#d9a441", "#1a1a1a", "#8a3a1a", "#d9d9d9"];
  for (let i = 0; i < nPeople && free.length; i++) {
    const k = Math.floor(Math.random() * free.length);
    const [x, y] = free.splice(k, 1)[0];
    people.push({
      x,
      y,
      robe: robes[i % 5],
      hair: hairs[(i + 2) % 5],
      hat: big ? "#5a5a6a" : null,
      nm: big ? "Guarda Real" : WALKER_NAMES[Math.floor(Math.random() * WALKER_NAMES.length)],
      guard: big,
      dance: st === "taverna" && tavernParty() && i % 2 === 0,
    });
  }
  if (st === "escola" && schoolTime()) {
    const desks = [
      [3, 6],
      [5, 6],
      [8, 6],
      [10, 6],
      [3, 8],
      [5, 8],
      [8, 8],
      [10, 8],
      [2, 7],
      [4, 7],
      [7, 7],
      [9, 7],
    ];
    player.kids
      .filter((k) => atSchool(k))
      .forEach((k, i) => {
        const d = desks[i];
        if (d && m[d[1]][d[0]] === ".")
          people.push({
            x: d[0],
            y: d[1],
            kid: k,
            nm: k.name,
          });
      });
    const others = ["Tiago", "Bia", "Lulu", "Pedrinho"];
    for (let i = people.length; i < 4; i++) {
      const d = desks[i];
      if (d && m[d[1]][d[0]] === ".")
        people.push({
          x: d[0],
          y: d[1],
          robe: robes[i % 5],
          hair: hairs[i % 5],
          hat: null,
          nm: others[i],
          child: true,
        });
    }
  }
  game.inter = {
    b,
    keeper: kp[0],
    kc: kp[1],
    kh: kp[2],
    kx: cx - 1,
    ky: big ? 2 : 3,
    props,
    people,
    pal: ["templo", "castle", "forja", "guilda", "biblio", "cristal", "pedra", "hosp"].includes(st)
      ? INTER_PAL.stone
      : INTER_PAL.wood,
    st,
  };
  delete game.seenArr.interior;
  delete game.mm.interior;
  return z;
}
function enterBuilding(b) {
  const tw = ZONES[player.zone].town;
  player.ret = {
    zone: player.zone,
    x: b.door[0],
    y: b.y + b.h,
  };
  ZONES.interior = genInterior(b);
  const z = ZONES.interior;
  player.zone = "interior";
  player.x = z.town.arrive[0];
  player.y = z.town.arrive[1];
  player.dir = "up";
  player.riding = false;
  game.fade = 1;
  enterZone(true);
  playSound(330, 0.12, "triangle");
}
function leaveBuilding() {
  const r = player.ret || {
    zone: "vila",
    x: 31,
    y: 22,
  };
  player.zone = r.zone;
  player.x = r.x;
  player.y = r.y;
  player.dir = "down";
  game.fade = 1;
  enterZone(false);
  playSound(330, 0.12, "triangle");
}
function interPropAt(x, y) {
  return player.zone === "interior" && game.inter
    ? game.inter.props.find((p) => p[1] === x && p[2] === y)
    : null;
}
function interPersonAt(x, y) {
  return player.zone === "interior" && game.inter
    ? game.inter.people.find((p) => p.x === x && p.y === y)
    : null;
}
function wallDecor(st, X, Y, x, t) {
  const k = x % 4;
  if (k === 0) {
    ctx.fillStyle = "#5a3a1e";
    ctx.fillRect(X + 4, Y + 12, 24, 3);
    const cols = {
      padaria: ["#d9a441", "#c9853a"],
      taverna: ["#c9a050", "#8a5a2e"],
      boticario: ["#7ad36b", "#5fd0ff", "#c77dff"],
      livraria: ["#a84a4a", "#4a4aa8", "#5a9a4a"],
      emporio: ["#c77dff", "#f2c14e"],
      acougue: ["#c94a4a", "#e8a0a0"],
      armazem: ["#c9a878", "#8a6a3a"],
    }[st] || ["#bfe0f0", "#f2c14e"];
    for (let i = 0; i < 4; i++) {
      ctx.fillStyle = cols[i % cols.length];
      ctx.fillRect(X + 5 + i * 6, Y + 5, 4, 7);
    }
  } else if (k === 1) {
    ctx.fillStyle = "#6b4423";
    ctx.fillRect(X + 6, Y + 3, 20, 16);
    ctx.fillStyle = ["#7ab0d9", "#c97a5a", "#7ab04a", "#c77dff"][x % 4];
    ctx.fillRect(X + 8, Y + 5, 16, 12);
    ctx.fillStyle = "#f2c14e";
    ctx.fillRect(X + 18, Y + 7, 3, 3);
    ctx.fillStyle = "#4a7a3a";
    ctx.fillRect(X + 8, Y + 12, 16, 5);
  } else if (k === 3) {
    if (st === "taverna" || st === "acougue") {
      ctx.fillStyle = "#8a6a4a";
      ctx.fillRect(X + 14, Y + 6, 4, 8);
      ctx.fillRect(X + 8, Y + 3, 4, 6);
      ctx.fillRect(X + 20, Y + 3, 4, 6);
      ctx.fillRect(X + 6, Y + 1, 2, 4);
      ctx.fillRect(X + 24, Y + 1, 2, 4);
    } else if (st === "boticario" || st === "pedra") {
      for (let i = 0; i < 3; i++) {
        ctx.fillStyle = "#5a9a4a";
        ctx.fillRect(X + 7 + i * 7, Y + 2, 3, 12);
        ctx.fillStyle = "#c9a050";
        ctx.fillRect(X + 6 + i * 7, Y + 1, 5, 2);
      }
    } else if (st === "escola") {
      ctx.fillStyle = "#e8e4dc";
      circle(X + 16, Y + 10, 7);
      ctx.fillStyle = "#3a2414";
      ctx.fillRect(X + 16, Y + 5, 1, 5);
      ctx.fillRect(X + 16, Y + 10, 4, 1);
    } else {
      ctx.fillStyle = "#a82a2a";
      ctx.fillRect(X + 10, Y + 2, 12, 16);
      ctx.fillStyle = "#f2c14e";
      ctx.fillRect(X + 14, Y + 6, 4, 4);
      fillPolygon(X + 10, Y + 18, X + 16, Y + 14, X + 22, Y + 18);
    }
  }
}
function drawProp(p, t) {
  const [id, x, y] = p,
    X = x * TILE,
    Y = y * TILE,
    c = (col, a, b, w, h) => {
      ctx.fillStyle = col;
      ctx.fillRect(X + a, Y + b, w, h);
    },
    sh = () => {
      ctx.fillStyle = "rgba(0,0,0,.22)";
      ctx.fillRect(X + 3, Y + 27, 26, 4);
    };
  switch (id) {
    case "oven":
      sh();
      c("#8a8478", 2, -6, 28, 34);
      c("#6a655b", 2, -6, 28, 4);
      c("#2a1a10", 8, 8, 16, 14);
      c(`rgb(255,${130 + Math.floor(Math.sin(t * 8) * 30)},40)`, 10, 14, 12, 6);
      break;
    case "bread":
      sh();
      c("#8a5a2e", 3, 12, 26, 14);
      ctx.fillStyle = "#d9a441";
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.ellipse(X + 9 + i * 7, Y + 12, 5, 3, 0, 0, 7);
        ctx.fill();
      }
      break;
    case "table":
      drawFurn(
        {
          id: "mesa",
          x,
          y,
        },
        t,
      );
      break;
    case "chair":
      drawFurn(
        {
          id: "cadeira",
          x,
          y,
        },
        t,
      );
      break;
    case "plant":
      drawFurn(
        {
          id: "m_planta",
          x,
          y,
        },
        t,
      );
      break;
    case "fire":
      drawFurn(
        {
          id: "lareira",
          x,
          y,
        },
        t,
      );
      break;
    case "books":
      drawFurn(
        {
          id: "m_estante",
          x,
          y,
        },
        t,
      );
      break;
    case "rug":
      drawFurn(
        {
          id: "m_tapeteR",
          x,
          y,
        },
        t,
      );
      break;
    case "bed":
      drawFurn(
        {
          id: "cama",
          x,
          y,
        },
        t,
      );
      break;
    case "candle":
      drawFurn(
        {
          id: "m_vela",
          x,
          y,
        },
        t,
      );
      break;
    case "barrel":
      sh();
      c("#8a5a2e", 8, 4, 16, 24);
      c("#6b4423", 8, 9, 16, 2);
      c("#6b4423", 8, 22, 16, 2);
      c("#a8784a", 10, 4, 12, 3);
      break;
    case "crate":
      sh();
      c("#a8844e", 4, 8, 24, 20);
      ctx.strokeStyle = "#6b4423";
      ctx.lineWidth = 2;
      ctx.strokeRect(X + 4, Y + 8, 24, 20);
      ctx.beginPath();
      ctx.moveTo(X + 4, Y + 8);
      ctx.lineTo(X + 28, Y + 28);
      ctx.stroke();
      break;
    case "bard":
      if (tavernParty()) {
        ctx.font = "12px sans-serif";
        ctx.textAlign = "center";
        for (let k = 0; k < 3; k++) {
          const p = (t * 0.5 + k / 3) % 1;
          ctx.globalAlpha = 1 - p;
          ctx.fillStyle = ["#f2c14e", "#ff8ad0", "#7fd0ff"][k];
          ctx.fillText("♪", X + 24 + Math.sin(t * 3 + k) * 8, Y - p * 40);
        }
        ctx.globalAlpha = 1;
      }
      sh();
      drawSprite(wizardRects("#c94a8a", "#6a2a5a", null, null, "right"), X, Y + Math.sin(t * 6) * 1, 2);
      c("#c9a050", 22, 12, 6, 10);
      break;
    case "maptable":
      sh();
      c("#6b4423", 0, 8, 32, 16);
      c("#e8d8b0", 2, 6, 28, 14);
      c("#5a9a4a", 6, 9, 8, 5);
      c("#3a8ab0", 16, 12, 10, 5);
      c("#c94a4a", 12, 10, 2, 2);
      break;
    case "weapons":
      sh();
      c("#6b4423", 3, -6, 26, 4);
      c("#cfd3e6", 6, -4, 2, 28);
      c("#cfd3e6", 14, -4, 2, 28);
      c("#cfd3e6", 22, -4, 2, 28);
      c("#8a5a2e", 4, 14, 6, 3);
      c("#8a5a2e", 12, 14, 6, 3);
      c("#8a5a2e", 20, 14, 6, 3);
      break;
    case "armor":
      sh();
      c("#6b4423", 15, 20, 2, 8);
      c("#9aa0b4", 9, 2, 14, 18);
      c("#bfc4d4", 11, -4, 10, 7);
      c("#2a2a3a", 13, -2, 6, 2);
      c("#9aa0b4", 5, 4, 4, 10);
      c("#9aa0b4", 23, 4, 4, 10);
      break;
    case "board":
      sh();
      c("#6b4423", 4, 18, 3, 10);
      c("#6b4423", 25, 18, 3, 10);
      c("#a8844e", 2, 0, 28, 18);
      c("#f3ead2", 5, 3, 9, 7);
      c("#f3ead2", 17, 4, 9, 6);
      c("#f3ead2", 8, 11, 10, 5);
      break;
    case "carpet":
      c("#a82a2a", 2, 0, 28, 32);
      c("#f2c14e", 2, 0, 2, 32);
      c("#f2c14e", 28, 0, 2, 32);
      break;
    case "banner":
      c("#5a3a22", 14, -10, 4, 6);
      c("#a82a2a", 6, -6, 20, 30);
      c("#f2c14e", 12, 2, 8, 10);
      fillPolygon(X + 6, Y + 24, X + 16, Y + 16, X + 26, Y + 24);
      break;
    case "altar":
      sh();
      c("#e8e4dc", 0, 6, 32, 20);
      c("#f2c14e", 0, 6, 32, 3);
      c("#c9a050", 14, -6, 4, 12);
      c("#c9a050", 10, -2, 12, 3);
      break;
    case "pew":
      sh();
      c("#6b4423", 0, 6, 32, 6);
      c("#8a5a2e", 0, 14, 32, 6);
      c("#5a3a1e", 2, 20, 3, 8);
      c("#5a3a1e", 27, 20, 3, 8);
      break;
    case "shelfP":
      sh();
      c("#5a3a1e", 2, -10, 28, 38);
      for (let r = 0; r < 3; r++) {
        c("#3a2414", 4, -7 + r * 12, 24, 9);
        for (let k = 0; k < 4; k++)
          c(["#ff6b8a", "#5fd0ff", "#7ad36b", "#f2c14e"][(k + r) % 4], 6 + k * 6, -5 + r * 12, 4, 7);
      }
      break;
    case "forge":
      sh();
      c("#5a5a62", 0, -8, 32, 36);
      c("#2a1a10", 6, 6, 20, 16);
      c(`rgb(255,${100 + Math.floor(Math.sin(t * 9) * 40)},20)`, 8, 10 + Math.sin(t * 7) * 2, 16, 10);
      c("#3a3a44", 0, -10, 32, 4);
      break;
    case "anvil":
      sh();
      c("#3a3a44", 4, 10, 24, 6);
      c("#3a3a44", 10, 16, 12, 6);
      c("#3a3a44", 6, 22, 20, 4);
      c("#6a6a74", 4, 10, 24, 2);
      break;
    case "manneq":
      sh();
      c("#6b4423", 15, 22, 2, 8);
      c("#c9a878", 12, -2, 8, 7);
      c(["#c94a8a", "#4a74c9", "#5a9a4a", "#d4a020"][(x + y) % 4], 8, 5, 16, 18);
      c("#f2c14e", 8, 12, 16, 2);
      break;
    case "mirror":
      sh();
      c("#c9a050", 8, -4, 16, 30);
      c("#bfe0f0", 10, -2, 12, 24);
      c("#fff", 12, 0, 3, 8);
      break;
    case "barber":
      sh();
      c("#3a2a2a", 6, 8, 20, 10);
      c("#8a2a2a", 8, 0, 16, 10);
      c("#cfd3e6", 14, 18, 4, 10);
      c("#cfd3e6", 8, 26, 16, 3);
      break;
    case "bench":
      sh();
      c("#8a5a2e", 0, 8, 32, 8);
      c("#6b4423", 2, 16, 4, 12);
      c("#6b4423", 26, 16, 4, 12);
      c("#cfd3e6", 6, 4, 10, 3);
      c("#a8784a", 20, 5, 8, 3);
      break;
    case "display":
      sh();
      c("#5a3a1e", 2, 10, 28, 18);
      c("#bfe0f0", 3, 4, 26, 8);
      for (let k = 0; k < 4; k++) {
        ctx.fillStyle = ["#5fd0ff", "#ff6b8a", "#f2c14e", "#7ad36b"][k];
        circle(X + 7 + k * 6, Y + 8, 2);
      }
      break;
    case "crystal":
      sh();
      c("#5a5470", 4, 20, 24, 8);
      ctx.fillStyle = `rgba(95,208,255,${0.7 + 0.2 * Math.sin(t * 3 + x)})`;
      fillPolygon(X + 8, Y + 20, X + 12, Y, X + 16, Y + 20);
      fillPolygon(X + 15, Y + 20, X + 20, Y + 4, X + 25, Y + 20);
      ctx.fillStyle = "#c77dff";
      fillPolygon(X + 11, Y + 20, X + 15, Y + 8, X + 19, Y + 20);
      break;
    case "hay":
      sh();
      c("#d9b84a", 3, 10, 26, 18);
      c("#b8952e", 3, 14, 26, 1);
      c("#b8952e", 3, 20, 26, 1);
      break;
    case "horse":
      drawHorse(X, Y, t, x > 6);
      break;
  }
}
const DIFFICULTIES = {
  facil: {
    n: "Fácil",
    spPow: 1.2,
    spMp: 0.8,
    hp: 1,
    atk: 1,
    xp: 1,
    gold: 1,
    need: 1,
    crit: 0,
    mpr: 3,
    mobs: 1,
    heal: true,
    desc: "Para curtir a história.",
  },
  normal: {
    n: "Normal",
    spPow: 1,
    spMp: 1,
    hp: 1.4,
    atk: 1.35,
    xp: 1,
    gold: 0.85,
    need: 1.3,
    crit: 0.1,
    mpr: 2,
    mobs: 1.15,
    heal: true,
    desc: "Monstros fortes, ouro contado. Recomendado.",
  },
  dificil: {
    n: "Difícil",
    spPow: 0.95,
    spMp: 1.15,
    hp: 2,
    atk: 1.7,
    xp: 0.85,
    gold: 0.65,
    need: 1.6,
    crit: 0.16,
    mpr: 2,
    mobs: 1.5,
    heal: false,
    desc: "Para quem gosta de sofrer. Sem tratamento grátis.",
  },
};
function difficulty() {
  return DIFFICULTIES[player.diff] || DIFFICULTIES.normal;
}
const MASTERY_T = [0, 3, 8, 15, 25, 40];
function masteryLv(k) {
  const n = (player.mastery || {})[k] || 0;
  let l = 0;
  for (let i = 1; i < MASTERY_T.length; i++) if (n >= MASTERY_T[i]) l = i;
  return l;
}
function spellCost(k) {
  const s = SPELLS[k];
  if (!s.mp) return 0;
  return Math.max(1, Math.ceil(s.mp * difficulty().spMp) - masteryLv(k));
}
/* ---- caminhos até as portas ---- */

function addDoorPaths(zid) {
  const z = ZONES[zid];
  if (!z || !z.town || !z.town.bld.length) return;
  const m = z.map.map((r) => r.split(""));
  const W = z.w,
    H = z.h;
  for (const b of z.town.bld) {
    if (!b.name || ["moinho", "celeiro", "farol", "mina"].includes(b.style)) continue;
    const fy = b.y + b.h;
    if (fy >= H - 1) continue;
    for (let x = b.x - 1; x <= b.x + b.w; x++)
      if (x > 0 && x < W - 1 && ".wu".includes(m[fy][x])) m[fy][x] = ",";
  }
  for (const b of z.town.bld) {
    const sx = b.door[0],
      sy = b.y + b.h;
    if (sy >= H - 1 || !".w,".includes(m[sy][sx])) continue;
    let st = null;
    for (const [dx, dy] of [
      [0, 1],
      [-1, 0],
      [1, 0],
    ]) {
      const cells = [[sx, sy]];
      let x = sx,
        y = sy,
        okk = false;
      for (let k = 0; k < 9; k++) {
        x += dx;
        y += dy;
        if (x < 1 || y < 1 || x >= W - 1 || y >= H - 1) break;
        if (m[y][x] === "," || m[y][x] === "=") {
          okk = true;
          break;
        }
        if (!".w".includes(m[y][x])) break;
        cells.push([x, y]);
      }
      if (okk) {
        st = cells;
        break;
      }
    }
    if (st) {
      st.forEach(([x, y]) => (m[y][x] = ","));
      continue;
    }
    const prev = {},
      q = [[sx, sy]];
    prev[sx + "," + sy] = null;
    let goal = null;
    while (q.length && !goal) {
      const [x, y] = q.shift();
      for (const [dx, dy] of DIRS4) {
        const X = x + dx,
          Y = y + dy,
          k = X + "," + Y;
        if (X < 1 || Y < 1 || X >= W - 1 || Y >= H - 1 || k in prev) continue;
        if (m[Y][X] === "," || m[Y][X] === "=") {
          prev[k] = [x, y];
          goal = [X, Y];
          break;
        }
        if (".w".includes(m[Y][X]) && Math.abs(X - sx) + Math.abs(Y - sy) < 26) {
          prev[k] = [x, y];
          q.push([X, Y]);
        }
      }
    }
    if (!goal) continue;
    let cur = prev[goal[0] + "," + goal[1]];
    while (cur) {
      m[cur[1]][cur[0]] = ",";
      cur = prev[cur[0] + "," + cur[1]];
    }
  }
  z.map = m.map((r) => r.join(""));
}
["vila", "porto", "serra"].forEach(addDoorPaths);
function tidyTown(zid) {
  const z = ZONES[zid];
  const m = z.map.map((r) => r.split(""));
  const orig = z.map.map((r) => r.split(""));
  const W = z.w,
    H = z.h;
  const R = (x, y) => x >= 0 && y >= 0 && x < W && y < H && (m[y][x] === "," || m[y][x] === "=");
  const inPlaza = (x, y) => zid === "vila" && x >= 24 && x <= 39 && y >= 14 && y <= 25;
  const keepL = zid === "vila" ? new Set(["24,14", "39,14", "24,25", "39,25"]) : new Set();
  for (let y = 1; y < H - 1; y++)
    for (let x = 1; x < W - 1; x++) {
      const c = m[y][x];
      if (c === "q" || (c === "n" && !inPlaza(x, y)) || (c === "l" && !keepL.has(x + "," + y))) {
        const n = DIRS4.filter(([dx, dy]) => R(x + dx, y + dy)).length;
        m[y][x] = n >= 2 ? "," : ".";
      }
    }
  for (let pass = 0; pass < 3; pass++)
    for (let y = 1; y < H - 1; y++)
      for (let x = 1; x < W - 1; x++) {
        if (!".w".includes(m[y][x])) continue;
        const l = R(x - 1, y),
          r = R(x + 1, y),
          u = R(x, y - 1),
          d = R(x, y + 1);
        if ((l && r) || (u && d) || l + r + u + d >= 3) m[y][x] = ",";
      }
  if (zid === "vila") {
    for (let y = 15; y <= 24; y++) for (let x = 25; x <= 38; x++) if (m[y][x] !== "N") m[y][x] = ",";
    for (let y = 18; y <= 21; y++) for (let x = 29; x <= 33; x++) m[y][x] = "~";
    m[19][31] = "F";
    [
      [25, 15],
      [26, 15],
      [25, 16],
      [38, 15],
      [37, 15],
      [38, 16],
      [25, 24],
      [26, 24],
      [25, 23],
      [38, 24],
      [37, 24],
      [38, 23],
    ].forEach(([x, y]) => {
      if (m[y][x] === ",") m[y][x] = "p";
    });
    [
      [28, 16],
      [34, 16],
      [28, 23],
      [34, 23],
    ].forEach(([x, y]) => {
      if (m[y][x] === ",") m[y][x] = "n";
    });
    [
      [26, 20],
      [37, 20],
    ].forEach(([x, y]) => {
      if (m[y][x] === ",") m[y][x] = "y";
    });
    m[16][31] = "S";
    m[23][31] = "J";
  }
  // ligar becos sem saída a caminhos próximos
  const roadDist = (sx, sy) => {
    const d = {};
    d[sx + "," + sy] = 0;
    const q = [[sx, sy]];
    while (q.length) {
      const [x, y] = q.shift();
      const k = d[x + "," + y];
      if (k > 40) continue;
      for (const [dx, dy] of DIRS4) {
        const X = x + dx,
          Y = y + dy,
          kk = X + "," + Y;
        if (kk in d || !R(X, Y)) continue;
        d[kk] = k + 1;
        q.push([X, Y]);
      }
    }
    return d;
  };
  for (let pass = 0; pass < 2; pass++)
    for (let y = 1; y < H - 1; y++)
      for (let x = 1; x < W - 1; x++) {
        if (!R(x, y) || DIRS4.filter(([dx, dy]) => R(x + dx, y + dy)).length !== 1) continue;
        if (DIRS4.some(([dx, dy]) => m[y + dy] && m[y + dy][x + dx] === "D")) continue;
        const rd = roadDist(x, y);
        const prev = {},
          q = [[x, y]];
        prev[x + "," + y] = null;
        let goal = null;
        while (q.length && !goal) {
          const [cx, cy] = q.shift();
          const g = (() => {
            let n = 0,
              k = [cx, cy];
            while (prev[k[0] + "," + k[1]]) {
              n++;
              k = prev[k[0] + "," + k[1]];
            }
            return n;
          })();
          if (g > 9) continue;
          for (const [dx, dy] of DIRS4) {
            const X = cx + dx,
              Y = cy + dy,
              k = X + "," + Y;
            if (k in prev || X < 1 || Y < 1 || X >= W - 1 || Y >= H - 1) continue;
            if (R(X, Y) && !(cx === x && cy === y)) {
              const rdd = rd[k];
              if (rdd === undefined || rdd > 3 * (g + 1) + 4) {
                prev[k] = [cx, cy];
                goal = [X, Y];
                break;
              }
              continue;
            }
            if (".w".includes(m[Y][X])) {
              prev[k] = [cx, cy];
              q.push([X, Y]);
            }
          }
        }
        if (goal) {
          let c = prev[goal[0] + "," + goal[1]];
          while (c && !(c[0] === x && c[1] === y)) {
            m[c[1]][c[0]] = ",";
            c = prev[c[0] + "," + c[1]];
          }
        }
      }
  for (let y = 1; y < H - 1; y++)
    for (let x = 1; x < W - 1; x++) {
      if (!R(x, y)) continue;
      for (const [dx, dy] of DIRS4) {
        if (R(x + dx, y + dy)) continue;
        const cells = [];
        let X = x + dx,
          Y = y + dy,
          hit = null;
        for (let k = 0; k < 10; k++) {
          if (X < 1 || Y < 1 || X >= W - 1 || Y >= H - 1) break;
          if (R(X, Y)) {
            hit = [X, Y];
            break;
          }
          if (!".w".includes(m[Y][X])) break;
          cells.push([X, Y]);
          X += dx;
          Y += dy;
        }
        if (!hit || cells.length < 2) continue;
        const rd = roadDist(x, y)[hit[0] + "," + hit[1]];
        if (rd !== undefined && rd <= 3 * cells.length + 6) continue;
        cells.forEach(([a, b]) => (m[b][a] = ","));
      }
    }
  {
    const ok2 = (x, y) =>
      x > 0 && y > 0 && x < W - 1 && y < H - 1 && ".wu".includes(m[y][x]) && !inPlaza(x, y);
    const narrowH = (x, y) => R(x, y) && (R(x - 1, y) || R(x + 1, y)) && !R(x, y - 1) && !R(x, y + 1);
    for (let y = 1; y < H - 1; y++) {
      let x = 1;
      while (x < W - 1) {
        if (!narrowH(x, y)) {
          x++;
          continue;
        }
        let e = x;
        while (e < W - 1 && narrowH(e, y)) e++;
        if (e - x >= 4) {
          let dn = 0,
            up = 0;
          for (let k = x; k < e; k++) {
            if (ok2(k, y + 1)) dn++;
            if (ok2(k, y - 1)) up++;
          }
          const yy = dn >= up ? y + 1 : y - 1;
          for (let k = x; k < e; k++) if (ok2(k, yy)) m[yy][k] = ",";
        }
        x = e;
      }
    }
    const narrowV = (x, y) => R(x, y) && (R(x, y - 1) || R(x, y + 1)) && !R(x - 1, y) && !R(x + 1, y);
    for (let x = 1; x < W - 1; x++) {
      let y = 1;
      while (y < H - 1) {
        if (!narrowV(x, y)) {
          y++;
          continue;
        }
        let e = y;
        while (e < H - 1 && narrowV(x, e)) e++;
        if (e - y >= 4) {
          let rt = 0,
            lf = 0;
          for (let k = y; k < e; k++) {
            if (ok2(x + 1, k)) rt++;
            if (ok2(x - 1, k)) lf++;
          }
          const xx = rt >= lf ? x + 1 : x - 1;
          for (let k = y; k < e; k++) if (ok2(xx, k)) m[k][xx] = ",";
        }
        y = e;
      }
    }
  }
  {
    const G2 = (c) => ".wu".includes(c);
    for (let pass = 0; pass < 2; pass++) {
      const seen = new Uint8Array(W * H);
      for (let y = 1; y < H - 1; y++)
        for (let x = 1; x < W - 1; x++) {
          if (seen[y * W + x] || !G2(m[y][x])) continue;
          const comp = [],
            q = [[x, y]];
          seen[y * W + x] = 1;
          let rb = 0,
            ob = 0;
          while (q.length) {
            const [cx, cy] = q.pop();
            comp.push([cx, cy]);
            for (const [dx, dy] of DIRS4) {
              const X = cx + dx,
                Y = cy + dy;
              if (X < 0 || Y < 0 || X >= W || Y >= H) continue;
              const c = m[Y][X];
              if (G2(c)) {
                if (!seen[Y * W + X]) {
                  seen[Y * W + X] = 1;
                  q.push([X, Y]);
                }
              } else if (c === "," || c === "=") rb++;
              else ob++;
            }
          }
          if (comp.length <= 10 && rb >= Math.max(2, ob * 0.5)) for (const [cx, cy] of comp) m[cy][cx] = ",";
        }
      for (let y = 1; y < H - 1; y++)
        for (let x = 1; x < W - 1; x++) {
          if (!G2(m[y][x])) continue;
          const l = R(x - 1, y),
            r = R(x + 1, y),
            u = R(x, y - 1),
            d = R(x, y + 1);
          if (
            (l && u && R(x - 1, y - 1)) ||
            (r && u && R(x + 1, y - 1)) ||
            (l && d && R(x - 1, y + 1)) ||
            (r && d && R(x + 1, y + 1))
          ) {
            const n = l + r + u + d;
            if (n >= 2) m[y][x] = ",";
          }
        }
    }
  }
  for (let pass = 0; pass < 3; pass++) {
    const ch = [];
    for (let y = 1; y < H - 1; y++)
      for (let x = 1; x < W - 1; x++) {
        if (!".wu".includes(m[y][x]) || inPlaza(x, y)) continue;
        let n = 0;
        for (let dy = -1; dy <= 1; dy++)
          for (let dx = -1; dx <= 1; dx++) if ((dx || dy) && R(x + dx, y + dy)) n++;
        const o = DIRS4.filter(([dx, dy]) => R(x + dx, y + dy)).length;
        if (n >= 5 || (o >= 2 && n >= 4)) ch.push([x, y]);
      }
    for (const [x, y] of ch) m[y][x] = ",";
  }
  {
    const Gs = (c) => ".wu".includes(c);
    let changed = true,
      it = 0;
    while (changed && it < 12) {
      changed = false;
      it++;
      for (let y = 1; y < H - 1; y++)
        for (let x = 1; x < W - 1; x++) {
          if (!Gs(m[y][x]) || inPlaza(x, y)) continue;
          const nb = DIRS4.map(([dx, dy]) => m[y + dy][x + dx]);
          const rd = nb.filter((c) => c === "," || c === "=").length,
            gr = nb.filter(Gs).length;
          if (rd >= 2 || (rd >= 1 && gr === 0)) {
            m[y][x] = ",";
            changed = true;
          }
        }
    }
    const seen = new Uint8Array(W * H);
    for (let y = 1; y < H - 1; y++)
      for (let x = 1; x < W - 1; x++) {
        if (seen[y * W + x] || !Gs(m[y][x])) continue;
        const comp = [],
          q = [[x, y]];
        seen[y * W + x] = 1;
        let touch = false;
        while (q.length) {
          const [cx, cy] = q.pop();
          comp.push([cx, cy]);
          for (const [dx, dy] of DIRS4) {
            const X = cx + dx,
              Y = cy + dy;
            if (X < 0 || Y < 0 || X >= W || Y >= H) continue;
            const c = m[Y][X];
            if (Gs(c)) {
              if (!seen[Y * W + X]) {
                seen[Y * W + X] = 1;
                q.push([X, Y]);
              }
            } else if (c === "," || c === "=") touch = true;
          }
        }
        if (touch && comp.length <= 70) for (const [cx, cy] of comp) m[cy][cx] = ",";
      }
  }
  if (zid === "vila")
    for (let x = 30; x <= 51; x++) {
      for (const y of [45, 46]) if (".wuTAozt".includes(m[y][x])) m[y][x] = ",";
    }
  for (let y = 1; y < H - 1; y++)
    for (let x = 1; x < W - 1; x++) {
      if (!"TAo".includes(m[y][x])) continue;
      const n = DIRS4.filter(([dx, dy]) => R(x + dx, y + dy)).length;
      if (n >= 1) m[y][x] = n >= 2 ? "," : ".";
    }
  {
    const nearF = (x, y) => {
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++) {
          if (orig[y + dy] && orig[y + dy][x + dx] === "f") return true;
        }
      return false;
    };
    for (let y = 1; y < H - 1; y++)
      for (let x = 1; x < W - 1; x++) {
        if (m[y][x] === "f" || !nearF(x, y)) continue;
        const o = orig[y][x];
        m[y][x] = o === "l" ? "." : o;
      }
    for (let y = 1; y < H - 1; y++)
      for (let x = 1; x < W - 1; x++) {
        if (orig[y][x] === "f" && m[y][x] !== "f") continue;
      }
    if (zid === "vila") {
      for (let y = 14; y <= 27; y++) if (m[y][54] !== "~" && m[y][54] !== "=") m[y][54] = ",";
      for (let x = 54; x <= 62; x++) if (m[18][x] !== "N") m[18][x] = ",";
      for (let y = 20; y <= 22; y++) for (let x = 56; x <= 60; x++) if (m[y][x] === ",") m[y][x] = ".";
    }
  }
  // Porto e Pedravale mantêm areia e grama: só ficam as ruas e calçadas originais.
  if (zid !== "vila")
    for (let y = 1; y < H - 1; y++)
      for (let x = 1; x < W - 1; x++)
        if (m[y][x] === "," && orig[y][x] !== "," && orig[y][x] !== "=") m[y][x] = orig[y][x];
  // Passada final: nenhum tile de grama solto com rua em dois lados (exceto perto de cercas).
  for (let pass = 0; pass < 3; pass++)
    for (let y = 1; y < H - 1; y++)
      for (let x = 1; x < W - 1; x++) {
        if (zid !== "vila" || !".wu".includes(m[y][x]) || inPlaza(x, y)) continue;
        let nearFence = false;
        for (let dy = -1; dy <= 1; dy++)
          for (let dx = -1; dx <= 1; dx++) if (m[y + dy][x + dx] === "f") nearFence = true;
        if (nearFence) continue;
        const roads = DIRS4.filter(([dx, dy]) => R(x + dx, y + dy)).length;
        if (roads >= 2) m[y][x] = ",";
      }
  const free = (x, y) => {
    if (!(x > 1 && y > 1 && x < W - 2 && y < H - 2 && m[y][x] === ".")) return false;
    for (let dy = -1; dy <= 1; dy++)
      for (let dx = -1; dx <= 1; dx++) {
        const c = m[y + dy][x + dx];
        if ("DNCMHT~=SJfWRl".includes(c)) return false;
      }
    return true;
  };
  const placed = [...keepL].map((k) => k.split(",").map(Number));
  const far = (x, y) => placed.every(([a, b]) => Math.abs(a - x) + Math.abs(b - y) >= 6);
  for (let y = 1; y < H - 1; y++) {
    let x = 1;
    while (x < W - 1) {
      if (!R(x, y)) {
        x++;
        continue;
      }
      let e = x;
      while (e < W - 1 && R(e, y)) e++;
      if (e - x >= 8)
        for (let k = x + 3; k < e - 1; k += 9) {
          for (const yy of [y - 1, y + 1]) {
            if (free(k, yy) && !R(k, yy) && far(k, yy) && !inPlaza(k, yy)) {
              m[yy][k] = "l";
              placed.push([k, yy]);
              if (zid === "vila" && placed.length % 2 === 0 && free(k + 1, yy)) m[yy][k + 1] = "n";
              break;
            }
          }
        }
      x = e;
    }
  }
  for (let x = 1; x < W - 1; x++) {
    let y = 1;
    while (y < H - 1) {
      if (!R(x, y)) {
        y++;
        continue;
      }
      let e = y;
      while (e < H - 1 && R(x, e)) e++;
      if (e - y >= 8)
        for (let k = y + 3; k < e - 1; k += 9) {
          for (const xx of [x - 1, x + 1]) {
            if (free(xx, k) && far(xx, k) && !inPlaza(xx, k)) {
              m[k][xx] = "l";
              placed.push([xx, k]);
              break;
            }
          }
        }
      y = e;
    }
  }
  z.map = m.map((r) => r.join(""));
}
["vila"].forEach(tidyTown);
function decorTown(zid) {
  const z = ZONES[zid];
  const m = z.map.map((r) => r.split(""));
  const W = z.w,
    H = z.h,
    Rr = rng(zid.length * 977 + 31);
  const near = (x, y, r, set) => {
    for (let dy = -r; dy <= r; dy++)
      for (let dx = -r; dx <= r; dx++) {
        const c = m[y + dy] && m[y + dy][x + dx];
        if (c && set.includes(c)) return true;
      }
    return false;
  };
  for (let y = 2; y < H - 2; y++)
    for (let x = 2; x < W - 2; x++) {
      if (m[y][x] !== ".") continue;
      if (near(x, y, 1, "DNCMRJW,=") || near(x, y, 2, "DNCf")) continue;
      if (zid === "vila" && inPlazaT("vila", x, y)) continue;
      const r = Rr(),
        edge = x < 5 || y < 5 || x > W - 6 || y > H - 6;
      if (edge && r < 0.1 && !near(x, y, 2, ",=HD")) m[y][x] = "T";
      else if (r < 0.07) m[y][x] = "w";
      else if (r < 0.085) m[y][x] = zid === "serra" ? "o" : "A";
      else if (r < 0.095) m[y][x] = zid === "porto" ? "o" : "u";
      else if (r < 0.1 && zid !== "porto") m[y][x] = "o";
    }
  z.map = m.map((r) => r.join(""));
}
["vila"].forEach(decorTown);
function chestRarity(z, x, y) {
  const zi = Object.keys(ZONES).indexOf(z);
  const h = tileHash(x * 31 + zi * 997, y * 17 + zi * 131);
  return h < 0.09 ? "lend" : h < 0.36 ? "raro" : "com";
}
const PAGE_ORDER = ["vila", "bosque", "pantano", "picos", "torre"];
const PAGES = {
  vila: "Diário de Vesper, dia 1. Odelia e eu sentimos: a Canção Arcana está enfraquecendo. Ela quer ensinar as novas gerações a preservá-la. Eu temo que não haja tempo.",
  bosque:
    "Dia 40. Discutimos de novo. Odelia diz que a magia pertence a todos. Mas o mundo destrói aquilo que não compreende. Alguém precisa protegê-la.",
  pantano:
    "Dia 77. Encontrei o ritual proibido. Se eu separar as runas e entregá-las aos Guardiões, a canção ficará guardada para sempre. Ninguém poderá usá-la. Nem perdê-la.",
  picos:
    "Dia 112. O ritual funcionou, mas o preço é terrível. Primeiro esqueci os rostos dos amigos. Depois, minha infância. Hoje tentei lembrar a voz da minha irmã e não consegui.",
  torre:
    "Última página. Se alguém ler isto, me liberte. Magia guardada não é magia: ela só vive quando é usada e compartilhada. — Vesper, irmão de Odelia",
};
/** O que o Professor Bruno Honda conta a cada página decifrada do diário de Vesper. */
const HONDA_NOTES = {
  1: "Veja só esta letra apertada... é a escrita rúnica da Academia. Vesper amava a irmã, isso está em cada linha. Ele não começou como vilão, aprendiz.",
  2: "Duas páginas! Repare como a tinta muda: ele escrevia com raiva. Brigar com quem a gente ama é a coisa mais fácil e a mais cara do mundo.",
  3: "O ritual proibido... eu li sobre ele nos arquivos da Academia. Separar as runas não protege a magia: só a deixa sozinha. Tome, use os meus óculos. Eles ajudam a enxergar as runas por dentro.",
  4: "Ele esqueceu a voz da irmã. *tira os óculos e limpa as lentes* Desculpe. É que eu também já esqueci vozes que não queria esquecer.",
  5: "Agora entendo tudo. Vesper não quer vencer, quer ser lembrado. No fim, não lute só com magia: leia para ele as palavras dele mesmo. Magia guardada não é magia.",
};
const HONDA_TIPS = [
  "Monstros agora crescem junto com você. Olhe o nível deles na batalha antes de sair atacando!",
  "A Rainha cobra 12% de Imposto Real em tudo. Dica de professor: no dia de festival não tem imposto. Guarde as compras grandes para esse dia!",
  "Quem tem boa fama na vila paga metade do imposto. Ser gentil também é economia.",
  "Acertar a fraqueza do inimigo enche a Ressonância. Estude o inimigo antes de gastar mana.",
  "Na minha época, o Diretor da Academia dava aula com um grimório que voava sozinho. Hoje ele virou espectro... mas continua exigente.",
  "Eu dava aula de runas antigas para crianças. Muitas viraram magos. Uma virou padeira. As duas coisas são mágicas.",
];

const NPCS = {
  rainha: {
    nome: "Rainha Aurélia",
    robe: "#8a2a5a",
    hat: null,
    hair: "#d9a441",
    crown: true,
    talk() {
      if (player.spouse === "rainha")
        return [["Rainha Aurélia", "Meu consorte! O reino anda calmo... e eu ando com saudade de você."]];
      return [["Rainha Aurélia", "Cinzaluz agradece a sua visita. Seja breve: tenho um reino para cuidar."]];
    },
  },
  honda: {
    nome: "Professor Bruno Honda",
    // Cores escolhidas para que o desenho saia careca no topo, de óculos e com barba branca.
    robe: "#9a222e",
    hair: "#d9d9d9",
    talk() {
      const P = "Professor Bruno Honda";
      if (!player.flags.honda) {
        player.flags.honda = true;
        saveGame();
        return [
          [P, "Ah, um aprendiz de verdade! Sente-se, sente-se. Eu sou o Professor Bruno Honda. Faz quarenta anos que estudo as ruínas da Academia Arcana."],
          [P, "Vesper escrevia o diário numa escrita rúnica antiga. Quase ninguém mais sabe ler... mas eu sei."],
          [P, "Se encontrar páginas perdidas pelas regiões, traga para mim. Eu decifro cada uma, e o que elas ensinam vai deixar você mais forte."],
        ];
      }
      const pages = player.pages.length,
        read = player.flags.hondaPages || 0;
      if (pages > read) {
        player.flags.hondaPages = pages;
        const lines = [];
        for (let i = read + 1; i <= pages; i++) lines.push([P, HONDA_NOTES[i]]);
        if (pages >= 3 && !player.flags.hondaGift) {
          player.flags.hondaGift = true;
          addItem("oculosHonda");
          lines.push(["", "Você recebeu os Óculos do Professor Honda! Equipe no inventário (I): +12% de dano e +15 MP."]);
        }
        const xp = (pages - read) * (25 + 10 * player.lvl);
        const before = player.lvl;
        gainXP(xp);
        lines.push(["", `+${xp} XP por estudar as páginas.${player.lvl > before ? ` Você chegou ao nível ${player.lvl}!` : ""}`]);
        if (pages === 5) lines.push([P, "Vá até a torre. E quando terminar... volte para me contar como foi. Professor gosta de saber o final da história."]);
        saveGame();
        return lines;
      }
      if (pages === 0) return [[P, "Nenhuma página ainda? Procure papéis brilhando nas regiões. Vesper espalhou o diário pelo mundo."]];
      return [[P, HONDA_TIPS[Math.floor(Math.random() * HONDA_TIPS.length)]]];
    },
  },
  odelia: {
    nome: "Arquimaga Odelia",
    robe: "#5b3fa8",
    hat: "#3a2878",
    talk() {
      if (lifeMode())
        return [
          ["Arquimaga Odelia", "Magia? Ah, isso é coisa de livro antigo. Hoje eu só cuido do meu jardim e dou conselhos."],
          ["Arquimaga Odelia", "Conselho do dia: trabalho dá ouro, mas amigos dão sentido. Não esqueça de dormir e de se divertir."],
        ];
      if (player.guards.includes("bosque")) player.flags.r2 = true;
      if (player.guards.includes("pantano")) player.flags.r3 = true;
      if (player.guards.includes("picos")) player.flags.r4 = true;
      saveGame();
      const o = player.order;
      const L = {
        1: [
          `O Bosque Murmurante fica a oeste. A Runa ${RUNE_OF[o[1]]} dorme com o Ent Guardião, e ele teme ${RUNE_WITH_ARTICLE[o[0]]}, a runa que vive em você.`,
          "Antes de partir: treine com o Instrutor Kael, compre comida e água no mercado e volte para casa quando escurecer. A noite é perigosa.",
          "E procure o Professor Bruno Honda, ao lado da fonte. Ele é o único que ainda lê a escrita antiga de Vesper.",
        ],
        2: [
          `Você trouxe ${RUNE_WITH_ARTICLE[o[1]]} de volta! Sinto o mundo respirar.`,
          `A leste, no Pântano das Brumas, a Serpente guarda a Runa ${RUNE_OF[o[2]]}. Ela é fraca contra ${RUNE_WITH_ARTICLE[o[1]]}.`,
          "Mas antes... essa névoa tem cheiro de mar. Vá ao Porto Brisamar e fale com o Capitão Bento. Pegue a carruagem no estábulo.",
        ],
        3: [
          `${RUNE_WITH_ARTICLE[o[2]][0].toUpperCase() + RUNE_WITH_ARTICLE[o[2]].slice(1)} canta outra vez...`,
          `Ao norte ficam os Picos Uivantes. O Grifo de Pedra guarda a Runa ${RUNE_OF[o[3]]}, mas não resiste a ${RUNE_WITH_ARTICLE[o[2]]}.`,
          "Antes de subir, passe em Pedravale. A Anciã Berta sabe algo sobre o meu irmão... digo, sobre Vesper.",
        ],
        4: [
          "As quatro runas... a barreira ao sul se desfez.",
          "Na Torre do Silêncio está aquele que calou o mundo. Há algo que eu deveria ter contado... Não. Primeiro, chegue à torre.",
          "Descanse em casa e compre suprimentos antes de ir. E, aprendiz... volte.",
        ],
      };
      if (player.flags.flash && player.runes.length === 4)
        return [
          ["Arquimaga Odelia", "Então você viu o eco. Sim... Vesper é meu irmão."],
          [
            "Arquimaga Odelia",
            "Eu não tive coragem de contar. Achei que você desistiria se soubesse que eu falhei em salvá-lo.",
          ],
          [
            "Arquimaga Odelia",
            "Sua missão nunca foi destruí-lo, aprendiz. É libertá-lo da prisão que ele mesmo criou.",
          ],
        ];
      return L[player.runes.length].map((t) => ["Arquimaga Odelia", t]);
    },
  },
  bruno: {
    nome: "Bruno, o Alquimista",
    robe: "#8a5a2b",
    hair: "#3a2414",
    talk() {
      openShop("bruno");
      return null;
    },
  },
  rosa: {
    nome: "Rosa, a Quitandeira",
    robe: "#c9853a",
    hair: "#7a3b1a",
    talk() {
      openShop("rosa");
      return null;
    },
  },
  doran: {
    nome: "Doran, o Artesão",
    robe: "#4a5a8a",
    hair: "#222222",
    talk() {
      openShop("doran");
      return null;
    },
  },
  curandeira: {
    nome: "Curandeira Maíra",
    robe: "#e8e4dc",
    hair: "#3a2a1a",
    talk() {
      healerMenu();
      return null;
    },
  },
  kael: {
    nome: "Instrutor Kael",
    robe: "#8a2b2b",
    hair: "#c9c9c9",
    talk() {
      return kaelTalk();
    },
  },
  nicoP: {
    nome: "Peixeiro Joca",
    robe: "#3a6a8a",
    hair: "#d9d9d9",
    talk() {
      openShop("peixeG");
      return null;
    },
  },
  mercOri: {
    nome: "Mercadora Zuleica",
    robe: "#c9603a",
    hair: "#1a1a1a",
    hat: "#8a3a2a",
    talk() {
      openShop("especiarias");
      return null;
    },
  },
  docesP: {
    nome: "Doceira Marisol",
    robe: "#e86a9a",
    hair: "#3a2414",
    talk() {
      openShop("doceria");
      return null;
    },
  },
  bazarP: {
    nome: "Mercador Jonas",
    robe: "#6a3a8a",
    hair: "#1a1a1a",
    talk() {
      openShop("bazar");
      return null;
    },
  },
  docesS: {
    nome: "Doceira Brunhilda",
    robe: "#c97a3a",
    hair: "#d9a441",
    talk() {
      openShop("doceria");
      return null;
    },
  },
  bazarS: {
    nome: "Mercador Ulrich",
    robe: "#5a6a4a",
    hair: "#8a3a1a",
    talk() {
      openShop("bazar");
      return null;
    },
  },
  pescadorVelho: {
    nome: "Velho Bartolomeu",
    robe: "#3a5a7a",
    hair: "#d9d9d9",
    hat: "#5a3a22",
    talk() {
      return [
        [
          "Velho Bartolomeu",
          [
            "Pesquei nesse mar a vida inteira. Antes do Silêncio, os peixes brilhavam à noite.",
            "Se pescar uma pérola, a Marina vai gostar de saber.",
            "Vento do leste traz tempestade. Sinto nos joelhos.",
          ][Math.floor(Math.random() * 3)],
        ],
      ];
    },
  },
  frutasNPC: {
    nome: "Vendedora Ilha",
    robe: "#e8902a",
    hair: "#1a1a1a",
    talk() {
      openShop("frutasP");
      return null;
    },
  },
  redesNPC: {
    nome: "Pescador Tomás",
    robe: "#3a5a7a",
    hair: "#d9d9d9",
    hat: "#5a3a22",
    talk() {
      openShop("redes");
      return null;
    },
  },
  queijeira: {
    nome: "Queijeira Hilda",
    robe: "#d9c08a",
    hair: "#8a3a1a",
    talk() {
      openShop("queijos");
      return null;
    },
  },
  erveira: {
    nome: "Erveira Malva",
    robe: "#4a7a4a",
    hair: "#d9d9d9",
    talk() {
      openShop("ervasS");
      return null;
    },
  },
  conchas: {
    nome: "Menina das Conchas",
    robe: "#e8a0b0",
    hair: "#d9a441",
    talk() {
      openShop("conchas");
      return null;
    },
  },
  marina: {
    nome: "Marina, a Pescadora",
    robe: "#2a6a8a",
    hair: "#a8442a",
    talk() {
      return [
        ["Marina", "O mar é minha casa. Quando o vento sopra do sul, os peixes pulam sozinhos na rede!"],
        ["Marina", "Se quiser me agradar, um Peixe Grelhado nunca é demais."],
      ];
    },
  },
  capitao: {
    nome: "Capitão Bento",
    robe: "#2a3a6a",
    hat: "#1a1a2a",
    talk() {
      if (!lifeMode() && player.flags.r2 && !player.flags.porto1) {
        player.flags.porto1 = true;
        saveGame();
        return [
          ["Capitão Bento", "Você é quem libertou o Ent? Então escuta. Essa névoa que cobre o pântano... ela veio do mar."],
          ["Capitão Bento", "Meu avô era faroleiro. Ele contava de dois irmãos magos que brincavam aqui no cais. Um deles, Vesper, partiu num barco e voltou diferente."],
          ["Capitão Bento", "O farol lembra de tudo que viu. Suba lá à noite e acenda a lanterna. Talvez ele mostre o que você precisa saber."],
        ];
      }
      if (player.flags.porto1 && !player.flags.porto2)
        return [["Capitão Bento", "O farol fica no fim do cais. Só funciona à noite, depois das 19h."]];
      if (player.flags.porto2)
        return [["Capitão Bento", "Dois irmãos que brigaram... O mar já viu muita família se separar e se reencontrar. Vá em frente."]];
      return [
        [
          "Capitão Bento",
          "Naveguei por sete mares e nunca vi monstros como os de hoje. Dizem que o Silêncio chegou até às marés.",
        ],
        ["Capitão Bento", "A carruagem no estábulo leva você de volta a Cinzaluz."],
      ];
    },
  },
  cocheiro2: {
    nome: "Cocheira Lila",
    robe: "#7a5a2a",
    hair: "#d9a441",
    talk() {
      carriageMenu();
      return null;
    },
  },
  portoA: {
    nome: "Marujo",
    robe: "#3a5a8a",
    hair: "#5a3a22",
    talk() {
      return [["Marujo", "A Moda Brisamar vende roupas que vêm de navio. Coisa fina!"]];
    },
  },
  portoB: {
    nome: "Vendedora de Redes",
    robe: "#8a6a3a",
    hair: "#3a2414",
    talk() {
      return [["Vendedora de Redes", "A Joalheria Pérola tem anéis de compromisso. Já pensou em casar?"]];
    },
  },
  minerA: {
    nome: "Anão Gorim",
    robe: "#6a5a3a",
    hair: "#a8442a",
    talk() {
      openShop("minerios");
      return null;
    },
  },
  peleiro: {
    nome: "Caçador Ulf",
    robe: "#5a4a3a",
    hair: "#3a2414",
    talk() {
      openShop("peles");
      return null;
    },
  },
  tobias: {
    nome: "Tobias, o Minerador",
    robe: "#5a6a4a",
    hair: "#1a1a1a",
    talk() {
      return [
        [
          "Tobias",
          "Passo o dia na mina e a noite olhando as estrelas. Lá de baixo a gente aprende a dar valor ao céu.",
        ],
        ["Tobias", "Cristais brilhantes me deixam feliz. Muito feliz!"],
      ];
    },
  },
  ancia: {
    nome: "Anciã Berta",
    robe: "#7a6a8a",
    hair: "#e8e4dc",
    talk() {
      if (!lifeMode() && player.flags.r3 && !player.flags.serra1) {
        player.flags.serra1 = true;
        saveGame();
        return [
          ["Anciã Berta", "Duas runas livres... Então é você. Sente aqui, criança. Vou contar o que Pedravale esconde."],
          ["Anciã Berta", "Trezentos anos atrás, um mago chamado Vesper subiu esta serra e pediu aos anões um cajado capaz de trancar a magia."],
          ["Anciã Berta", "Os anões forjaram, mas guardaram o molde. Para reabri-lo, precisamos de um Fragmento Arcano da Mina de Cristal. Traga um à Forja Anã."],
        ];
      }
      if (player.flags.serra1 && !player.flags.serra3)
        return [
          [
            "Anciã Berta",
            itemCount("fragmento") ? "Você achou o fragmento! Leve à Forja Anã, ali no começo da vila." : "A Mina de Cristal fica no alto da vila. Procure o cristal que canta.",
          ],
        ];
      if (player.flags.serra3)
        return [["Anciã Berta", "Ele se trancou junto com a magia. Às vezes a gente faz isso com o que mais ama, criança."]];
      return [
        [
          "Anciã Berta",
          "Os anões chegaram aqui antes dos homens. Foi a Forja Anã que fez a armadura da Rainha.",
        ],
        ["Anciã Berta", "Você pode minerar na mina uma vez por dia. Quem sabe acha um Fragmento Arcano?"],
      ];
    },
  },
  cocheiro3: {
    nome: "Cocheiro Dário",
    robe: "#7a5a2a",
    hair: "#3a2414",
    talk() {
      carriageMenu();
      return null;
    },
  },
  serraA: {
    nome: "Pastor de Cabras",
    robe: "#8a8a6a",
    hair: "#d9d9d9",
    talk() {
      return [["Pastor", "As cabras daqui sobem até nas paredes da mina. Malucas!"]];
    },
  },
  cocada: {
    nome: "Dona Cocada",
    robe: "#d96a8a",
    hair: "#3a2414",
    talk() {
      openShop("doceria");
      return null;
    },
  },
  florista: {
    nome: "Florista Jasmim",
    robe: "#7ab04a",
    hair: "#d9a441",
    talk() {
      openShop("floricultura");
      return null;
    },
  },
  bazarista: {
    nome: "Mercador Tibério",
    robe: "#6a3a8a",
    hair: "#1a1a1a",
    hat: "#4a2a5a",
    talk() {
      openShop("bazar");
      return null;
    },
  },
  abrigo: {
    nome: "Cuidadora Lila",
    robe: "#c98a3a",
    hair: "#8a3a1a",
    talk() {
      petShelter();
      return null;
    },
  },
  chazeira: {
    nome: "Dona Camélia",
    robe: "#4a8a6a",
    hair: "#d9d9d9",
    talk() {
      openShop("chas");
      return null;
    },
  },
  brinqueiro: {
    nome: "Seu Pipoca",
    robe: "#c94a4a",
    hair: "#d9a441",
    hat: "#d9a441",
    talk() {
      openShop("brinquedos");
      return null;
    },
  },
  peixeiro: {
    nome: "Nico, o Peixeiro",
    robe: "#3a6a8a",
    hair: "#5a3a22",
    talk() {
      openShop("peixaria");
      return null;
    },
  },
  flor: {
    nome: "Dona Flor",
    robe: "#5a8a3a",
    hair: "#d9d9d9",
    talk() {
      openShop("ervanaria");
      return null;
    },
  },
  lucio: {
    nome: "Ourives Lúcio",
    robe: "#2a2a3a",
    hair: "#8a6a2a",
    talk() {
      openShop("joalheiro");
      return null;
    },
  },
  guarda: {
    nome: "Guarda Real",
    robe: "#8a8a9a",
    hat: "#5a5a6a",
    talk() {
      return [
        [
          "Guarda Real",
          "Alto! Este é o Castelo de Cinzaluz. A Rainha Aurélia recebe aventureiros pelo portão.",
        ],
      ];
    },
  },
  guarda2: {
    nome: "Guarda Real",
    robe: "#8a8a9a",
    hat: "#5a5a6a",
    talk() {
      return [["Guarda Real", "Dizem que a Rainha recompensa quem liberta os Guardiões."]];
    },
  },
  bardo: {
    nome: "Bardo Lírio",
    robe: "#c94a8a",
    hat: "#6a2a5a",
    talk() {
      playTune();
      player.mp = Math.min(maxMp(), player.mp + 8);
      return [
        ["Bardo Lírio", "♪ Era uma vez uma canção, que o silêncio quis guardar... ♪"],
        ["", "A música te inspira: +8 MP."],
      ];
    },
  },
  ferreiro: {
    nome: "Brann, o Ferreiro",
    robe: "#5a4a3a",
    hair: "#8a3a1a",
    talk() {
      return [
        [
          "Brann, o Ferreiro",
          "Mago de manto fino morre na primeira mordida de lobo. Uma boa armadura leve faz milagres.",
        ],
        ["Brann, o Ferreiro", "Traga Pedras de Golem e eu fico de bom humor."],
      ];
    },
  },
  zaid: {
    nome: "Zaid, o Mercador de Trocas",
    robe: "#6a3a8a",
    hair: "#1a1a1a",
    talk() {
      return [
        [
          "Zaid",
          "Ouro? Bah. Aqui o que vale são materiais. Couro, esporos, cristais... e os raríssimos Fragmentos Arcanos.",
        ],
        [
          "Zaid",
          "Monstros deixam materiais quando caem. Traga-os e eu troco por coisas que você não encontra em loja nenhuma.",
        ],
      ];
    },
  },
  cocheiro: {
    nome: "Tião, o Cocheiro",
    robe: "#7a5a2a",
    hair: "#d9d9d9",
    talk() {
      return [
        [
          "Tião, o Cocheiro",
          "Com um cavalo você atravessa o mundo na metade do tempo. Aperte C para montar e desmontar.",
        ],
        ["Tião, o Cocheiro", "E se tiver pressa, minha carruagem leva você aos lugares que já visitou."],
      ];
    },
  },
  selene: {
    nome: "Professora Selene",
    robe: "#8fa0e0",
    hair: "#cfd8ff",
    ghost: true,
    talk() {
      return [
        [
          "Professora Selene",
          "Bem-vindo à Academia Arcana... ou ao que restou dela. Eu ensinava aqui antes do Silêncio.",
        ],
        [
          "Professora Selene",
          `Os livros espalhados pelas salas ainda guardam feitiços. Os Tomos ${RUNE_OF[player.aff]} vão ensinar a magia do seu elemento.`,
        ],
        [
          "Professora Selene",
          "Cuidado com o Diretor. O Silêncio o transformou em algo terrível, mas ele guarda a relíquia mais preciosa da escola.",
        ],
      ];
    },
  },
  lia: {
    nome: "Lia",
    robe: "#c95b7a",
    hair: "#d9a441",
    talk() {
      return [
        [
          "Lia",
          "Minha avó dizia que fogo e água juntos faziam uma névoa que deixava os monstros cegos! Será que é verdade?",
        ],
        ["Lia", "Ah, e se a mana acabar, defender recupera um pouquinho."],
      ];
    },
  },
  iara: {
    nome: "Bibliotecária Iara",
    robe: "#2f6f6a",
    hair: "#1a1a1a",
    talk() {
      return [
        [
          "Bibliotecária Iara",
          "Os grimórios da biblioteca estão em branco há trezentos anos. Cada magia que você recuperar volta a aparecer nas páginas.",
        ],
        [
          "Bibliotecária Iara",
          "Aperte I para abrir seu inventário: lá você come, bebe, troca de cajado e vê suas habilidades.",
        ],
        [
          "Bibliotecária Iara",
          "Se você se ferir gravemente, a Curandeira Maíra cuida de você no hospital, aquele de telhado branco com a cruz vermelha.",
        ],
      ];
    },
  },
  tome: {
    nome: "Guarda Tomé",
    robe: "#6b6f7a",
    hair: "#5a3a22",
    talk() {
      return player.runes.length < 4
        ? [
            ["Guarda Tomé", "Ninguém passa pela barreira do sul. Dizem que lá fica a Torre do Silêncio."],
            ["Guarda Tomé", "Só quem carregar as quatro runas consegue rompê-la."],
          ]
        : [["Guarda Tomé", "A barreira caiu! Que as runas te protejam, aprendiz."]];
    },
  },
  druida: {
    nome: "Druida Errante",
    robe: "#4f7a3a",
    hair: "#cfcfcf",
    talk() {
      return [
        ["Druida Errante", "As árvores lembram da magia. O Ent não é mau, só esqueceu quem era."],
        ["Druida Errante", "Quando tiver a Maré, misture-a com a Terra. Tudo que é ferido pode florescer."],
      ];
    },
  },
  pescador: {
    nome: "Velho Pescador",
    robe: "#4b6a8a",
    hair: "#e0e0e0",
    talk() {
      return [
        [
          "Velho Pescador",
          "Antes do Silêncio eu pescava com feitiço de gelo. Vento sobre a água, e o lago parava.",
        ],
        ["Velho Pescador", "Monstro congelado não ataca, sabia?"],
      ];
    },
  },
  monge: {
    nome: "Monge da Montanha",
    robe: "#b5642c",
    hair: "#2a1a10",
    talk() {
      return [
        ["Monge da Montanha", "Nada que sopra fere o Grifo. Nada que queima o derrete."],
        [
          "Monge da Montanha",
          "Mas a água sempre vence a pedra. E vento com terra vira areia nos olhos de qualquer fera.",
        ],
      ];
    },
  },
  espirito: {
    nome: "Espírito de um Aprendiz",
    robe: "#7f8fc9",
    hair: "#bcd",
    ghost: true,
    talk() {
      return [
        ["Espírito de um Aprendiz", "Eu tentei antes de você. Fui o último a tentar."],
        [
          "Espírito de um Aprendiz",
          "O Silenciador troca de fraqueza a cada três turnos: observe a cor da máscara. E de tempos em tempos ele sela uma runa. Tenha sempre um plano B.",
        ],
      ];
    },
  },
};
const GUARD_PRE = {
  basilisco: () => [
    ["Basilisco de Cristal", "Ninguém desce tanto na mina... e volta. A runa que dorme aqui é minha."],
    ["", "O Basilisco se enrola e cristais brotam das escamas!"],
  ],
  leviata: () => [
    ["Leviatã do Cais", "O mar esqueceu a Canção. E eu esqueci o mar. Volte para a terra, pequeno mago!"],
    ["", "Uma onda gigante quebra no píer!"],
  ],
  diretor: () => [
    ["Diretor Espectral", "SILÊNCIO NA BIBLIOTECA! Nenhum aluno sai daqui com os meus livros!"],
    ["", "O Diretor ergue seu cetro sombrio!"],
  ],
  ent: () => [
    ["Ent Silenciado", "...sss... silêncio... a terra... dorme... não acorde... ela..."],
    ["", "O Ent ergue os galhos contra você!"],
  ],
  serpente: () => [
    ["Serpente de Névoa", "Ssssó o silêncio é eterno, pequena faísca. Esta runa é minha agora."],
  ],
  grifo: () => [
    ["Grifo de Pedra", "Nenhuma asa voa sem vento. E o vento obedece a mim."],
    ["Grifo de Pedra", "Prove que merece o céu, aprendiz!"],
  ],
  silenciador: () => {
    const l = [
      ["O Silenciador", "Então é você quem anda acordando as runas."],
      [
        "O Silenciador",
        "Eu salvei a magia! Guardei a canção onde o tempo não alcança. E você quer jogá-la de volta ao mundo para morrer?",
      ],
    ];
    if (player.pages.includes("torre"))
      l.push(
        ["Você", '"Magia guardada não é magia." Foi você que escreveu isso, Vesper.'],
        ["O Silenciador", "...Esse nome... CALE-SE!"],
      );
    return l;
  },
};
const GUARD_DROP = {
  ent: "coroa",
  serpente: "escama",
  grifo: "pena",
  basilisco: "armMithril",
  leviata: "amuPerola",
};
function GUARD_POST(type, rune) {
  const i = {
      ent: 0,
      serpente: 1,
      grifo: 2,
    }[type],
    r = rune || player.order[i + 1],
    it = ITEMS[GUARD_DROP[type]].nome;
  const L = {
    ent: [
      ["", "A casca escura do Ent se desfaz, revelando madeira viva."],
      [
        "Ent Guardião",
        `Obrigado... agora eu lembro. Tome, pequena chama: a Runa ${RUNE_OF[r]} é sua. E leve esta coroa, ela guarda a força da floresta.`,
      ],
    ],
    serpente: [
      ["", "A névoa se dissipa e a serpente se torna um rio límpido."],
      [
        "Serpente das Águas",
        `Sssinto o sol de novo... Leve a Runa ${RUNE_OF[r]}. E minhas escamas: elas vão te proteger.`,
      ],
    ],
    basilisco: [
      ["", "Os cristais do Basilisco estalam e caem. Por baixo, há uma serpente prateada e cansada."],
      [
        "Basilisco Prateado",
        `Trezentos anos guardando o escuro da mina... Leve a Runa ${RUNE_OF[r]}. E esta armadura: os anões a fizeram para mim.`,
      ],
    ],
    leviata: [
      ["", "A maré recua. O Leviatã afunda devagar e volta à tona com olhos claros."],
      [
        "Leviatã das Marés",
        `O farol me chamou de volta. Leve a Runa ${RUNE_OF[r]}, aprendiz, e esta pérola do fundo do mar.`,
      ],
    ],
    grifo: [
      ["", "As asas de pedra racham, e penas douradas surgem por baixo."],
      [
        "Grifo Dourado",
        `O céu é seu, aprendiz. Leve a Runa ${RUNE_OF[r]} e uma pena minha: nenhum cajado é mais forte.`,
      ],
    ],
  }[type];
  return L.concat([
    ["", `Você recuperou a Runa ${RUNE_OF[r]}! Novas combinações estão disponíveis.`],
    ["", `Você recebeu: ${it}! Equipe pelo inventário (tecla I).`],
  ]);
}
const STORY = [
  "Há trezentos anos, a magia era a essência do mundo. Ela fluía pelos rios, dançava entre as árvores, atravessava as montanhas e iluminava os céus.",
  "Todos os feitiços nasciam das Quatro Runas Primordiais: Chama, Maré, Terra e Vento, forças ancestrais que mantinham o equilíbrio entre a natureza e os seres vivos.",
  "Os magos não precisavam apenas estudar para dominar seus poderes. Eles precisavam ouvir a Canção Arcana, uma melodia invisível que conectava todas as formas de magia.",
  "Entretanto, tudo mudou na noite que ficou conhecida como o Grande Silêncio.",
  "Sem aviso, a Canção Arcana desapareceu. As runas perderam suas vozes, os grimórios ficaram em branco e os magos esqueceram os feitiços que haviam dominado durante séculos.",
  "Criaturas antes pacíficas foram corrompidas, florestas perderam sua vitalidade e antigas cidades mergulharam no esquecimento. A magia havia sido silenciada.",
  "Durante gerações, ninguém soube explicar o que aconteceu. Alguns acreditavam que os deuses haviam abandonado o mundo. Outros diziam que a magia havia simplesmente morrido. Mas a verdade era muito mais sombria.",
  "Séculos depois, na pequena Vila de Cinzaluz, um jovem aprendiz desperta com uma habilidade considerada impossível: consegue ouvir um fraco eco da magia perdida.",
  "Dentro de si ainda vive uma das Quatro Runas, a última centelha de um poder que o mundo acreditava extinto.",
  "Porque a magia nunca deixou de existir. Ela apenas esperava por alguém capaz de ouvi-la novamente.",
];
function INTRO() {
  return [
    [
      "Arquimaga Odelia",
      `Acorde, ${player.name}. Eu sou Odelia. Quando o Silêncio caiu, eu resisti a ele, e ele me impediu de envelhecer. Esperei trezentos anos por alguém que ouvisse esse eco: a Runa ${RUNE_OF[player.aff]} ainda vive em você.`,
    ],
    [
      "Arquimaga Odelia",
      "Os Guardiões que protegiam as outras runas foram corrompidos. Liberte-os no Bosque Murmurante, no Pântano das Brumas e nos Picos Uivantes.",
    ],
    [
      "Arquimaga Odelia",
      "Mas primeiro, aprenda a lutar: o Instrutor Kael espera você no campo de treino, ao nordeste da vila.",
    ],
    [
      "Arquimaga Odelia",
      "A jornada é longa. Você vai sentir fome e sede: o mercado fica ao sudoeste. Sua casa, de telhado azul, é onde você dorme e recupera as forças.",
    ],
    [
      "Arquimaga Odelia",
      "À noite os monstros ficam mais fortes. Se você se ferir demais e não tiver poções, procure a Curandeira Maíra no hospital.",
    ],
    [
      "Arquimaga Odelia",
      "Siga sempre a seta dourada: ela mostra sua missão atual. Q abre as missões, I o inventário, M o mapa e G o grimório.",
    ],
  ];
}
const FLASH = [
  [
    "",
    "Ao cruzar a porta da torre, as runas em suas mãos vibram. Um eco do passado ganha forma diante de você...",
  ],
  ["Odelia (eco)", "A magia não pode ser aprisionada, Vesper. Ela precisa viver."],
  ["Vesper (eco)", "E quando não houver mais ninguém capaz de protegê-la? Quando a última runa desaparecer?"],
  ["Odelia (eco)", "Então ensinaremos outros a ouvir sua canção."],
  ["Vesper (eco)", "Você ainda acredita que o mundo merece esse poder. Eu não posso arriscar perdê-lo."],
  ["", "O eco se desfaz. Odelia conhecia o Silenciador desde o princípio... Ele é o irmão dela."],
];
const FINALE = [
  ["", "Após a longa batalha, a máscara do Silenciador começa a se partir."],
  ["", "Você ergue as quatro runas, e a Canção Arcana volta a ecoar pela torre."],
  ["O Silenciador", "Não... Se libertar a magia, ela desaparecerá novamente!"],
  ["Você", "Você tentou salvá-la, mas esqueceu por que ela era tão importante."],
  ["O Silenciador", "Eu... só queria protegê-la..."],
  ["", "Você abre a última página do diário e lê em voz alta:"],
  ["Você", '"Magia guardada não é magia. Ela só vive quando é usada e compartilhada."'],
  ["", "O Silenciador reconhece aquelas palavras. Foram escritas por ele mesmo."],
  ["Vesper", "Odelia... Minha irmã... Ela ainda está viva?"],
  ["Você", "Ela nunca deixou de esperar por você."],
  [
    "Narrador",
    "Pela primeira vez em trezentos anos, Vesper se lembra de quem realmente é. E quando a última runa é libertada, o Grande Silêncio finalmente termina.",
  ],
];
const EPILOGUE = [
  [
    "Narrador",
    "Na Vila de Cinzaluz, Odelia observa o horizonte quando uma figura familiar surge na estrada.",
  ],
  ["Narrador", "Por um instante, nenhum dos dois consegue dizer uma palavra."],
  ["Vesper", "Demorei um pouco para voltar, não foi?"],
  ["Arquimaga Odelia", "Trezentos anos, seu idiota."],
  [
    "Narrador",
    "Ela sorri entre lágrimas. E, ao redor deles, pequenas faíscas de magia começam a iluminar a vila.",
  ],
  ["Narrador", "A Canção Arcana voltou."],
];

/** Leviatã do Cais: Guardião na ponta do píer do Porto Brisamar. */
(function addPortGuardian() {
  const z = ZONES.porto;
  let best = null;
  for (let y = 0; y < z.h; y++)
    for (let x = 0; x < z.w; x++) if (z.map[y][x] === "=" && (!best || y > best[1])) best = [x, y];
  if (!best) return;
  const [x, y] = best;
  z.map[y] = z.map[y].slice(0, x) + "G" + z.map[y].slice(x + 1);
  z.guard = "leviata";
  z.guardPos = [x, y];
})();
