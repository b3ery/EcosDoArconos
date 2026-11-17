/**
 * ECOS DO ARCANO — alto-do-descanso.js
 * A vila cresce mais um pouco para o sul: o Alto do Descanso.
 *  - À direita da estrada: a Capela Branca (paredes caiadas, telhado de
 *    telha, porta azul, sino) dentro do Cemitério de Cinzaluz, cercado por um
 *    muro baixo branco. Túmulos de pedra cheios de vasos de flores.
 *  - À esquerda: um jardim com árvores, bancos, lampiões e canteiros.
 * Só monta o mapa (roda logo depois de bairro-das-flores.js). O desenho e o
 * que dá para fazer ficam em capela-e-cemiterio.js.
 */

"use strict";

const DESC_Y = 62; // primeira linha nova (antes da última faixa da vila)
const DESC_H = 11;
const DESC = {
  wall: { x0: 36, x1: 50, y0: DESC_Y + 1, y1: DESC_Y + 9 },
  gate: [[36, DESC_Y + 5], [36, DESC_Y + 6]],
  chapel: { x: 38, y: DESC_Y + 2, w: 5, h: 5, door: [40, DESC_Y + 6] },
  graves: [],
};
for (const r of [2, 4, 6]) for (const x of [44, 46, 48]) DESC.graves.push([x, DESC_Y + r]);
for (const x of [38, 42, 44, 46, 48]) DESC.graves.push([x, DESC_Y + 8]);

(function expandVilaDescanso() {
  const z = ZONES.vila;
  const W = z.w;
  const rows = [];
  for (let i = 0; i < DESC_H; i++) rows.push(("#" + ".".repeat(W - 2) + "#").split(""));
  const set = (x, gy, c) => {
    const y = gy - DESC_Y;
    if (x > 0 && x < W - 1 && y >= 0 && y < DESC_H) rows[y][x] = c;
  };
  // estrada principal (continua até a saída sul) e o caminho até o portão do cemitério
  for (let y = DESC_Y; y < DESC_Y + DESC_H; y++) for (let x = 30; x <= 33; x++) set(x, y, ",");
  for (const [gx, gy] of DESC.gate) for (let x = 34; x <= 35; x++) set(x, gy, ",");
  // muro baixo branco
  const { x0, x1, y0, y1 } = DESC.wall;
  for (let x = x0; x <= x1; x++) (set(x, y0, "H"), set(x, y1, "H"));
  for (let y = y0; y <= y1; y++) (set(x0, y, "H"), set(x1, y, "H"));
  for (const [gx, gy] of DESC.gate) set(gx, gy, ",");
  // chão de pedra dentro do muro
  for (let y = y0 + 1; y < y1; y++) for (let x = x0 + 1; x < x1; x++) set(x, y, ",");
  // a capela e os túmulos
  const C = DESC.chapel;
  for (let y = C.y; y < C.y + C.h; y++) for (let x = C.x; x < C.x + C.w; x++) set(x, y, "H");
  for (const [x, y] of DESC.graves) set(x, y, "H");
  // jardim do lado esquerdo: árvores, bancos, lampiões e canteiros
  for (const [x, r] of [[3, 1], [9, 2], [16, 1], [23, 2], [5, 9], [12, 9], [20, 9], [27, 9], [2, 5], [26, 5], [54, 2], [58, 6], [55, 9]]) set(x, DESC_Y + r, "T");
  for (const [x, r] of [[8, 5], [14, 5], [20, 5], [53, 5]]) set(x, DESC_Y + r, "n");
  for (const [x, r] of [[11, 3], [17, 7], [29, 2], [29, 8], [34, 2], [34, 8]]) set(x, DESC_Y + r, "l");
  for (const [x, r] of [[6, 7], [11, 7], [16, 7], [21, 7], [24, 3], [56, 4], [59, 8]]) set(x, DESC_Y + r, "p");
  const newRows = rows.map((r) => r.join(""));
  z.map = z.map.slice(0, DESC_Y).concat(newRows, z.map.slice(DESC_Y));
  z.h += DESC_H;
  const shift = (p) => p && p[1] >= DESC_Y && (p[1] += DESC_H);
  for (const k of Object.keys(z.open)) shift(z.open[k]);
  for (const f of z.feats) shift(f);
  for (const n of z.npcList) shift(n);
  for (const s of z.spawn || []) shift(s);
  for (const b of z.town.bld) if (b.y >= DESC_Y) b.y += DESC_H;
})();
