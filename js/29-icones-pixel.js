/**
 * ECOS DO ARCANO — 29-icones-pixel.js
 * Gerador de ícones em pixel art 16×16: cada forma (espada, cajado, poção, fruta,
 * peixe, móvel, joia...) é desenhada em código e pintada com a paleta do item.
 * Depois um passo automático faz o contorno e o brilho, então todo ícone sai
 * com cara de "arte de jogo", e cada item pode ter o seu próprio.
 *
 * Chave do ícone: "g:forma:cor1:cor2:variante"  (ex.: "g:potion:#e0306a:#f2c14e:1")
 */

"use strict";

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
