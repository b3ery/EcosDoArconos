/**
 * ECOS DO ARCANO — bairro-das-flores.js
 * Aumenta a Vila de Cinzaluz para o sul: 16 linhas novas com o Bairro das Flores,
 * duas ruas com lampiões, árvores, bancos e lotes largos para as casas da turma
 * (que antes ficavam espremidas entre outros prédios) e casas novas à venda.
 * Roda logo depois de mapa.js, antes de qualquer coisa usar a vila.
 */

"use strict";


const BAIRRO_Y = 46; // primeira linha nova
const BAIRRO_H = 28; // quantas linhas novas
/* O bairro segue o padrão dos lotes (como no The Sims): duas fileiras de
   lotes, cada lote cercado, com quintal nos fundos, a casa recuada, jardim
   na frente com a placa da família e o caminho até a rua.
   Linhas (contando do começo do bairro):
     0 grama com árvores · 1 cerca dos fundos · 2-6 quintais · 7-10 casas
     11-12 jardins da frente · 13-14 rua de cima
     15 cerca dos fundos · 16-19 quintais · 20-22 casas · 23-24 jardins
     25-26 rua de baixo · 27 grama com árvores */
const BAIRRO_ROWS = { A: { fence: 1, house: 7, road: 13 }, B: { fence: 15, house: 20, road: 25 } };
/** Lotes do bairro: duas fileiras de casas, cada uma de frente para a sua rua. */
const BAIRRO_LOTES = {
  a1: { x: 3, y: BAIRRO_Y + 7, w: 5, h: 4, row: "A" },
  a2: { x: 10, y: BAIRRO_Y + 7, w: 5, h: 4, row: "A" },
  a3: { x: 17, y: BAIRRO_Y + 7, w: 5, h: 4, row: "A" },
  a4: { x: 39, y: BAIRRO_Y + 7, w: 6, h: 4, row: "A" },
  a5: { x: 47, y: BAIRRO_Y + 7, w: 5, h: 4, row: "A" },
  a6: { x: 54, y: BAIRRO_Y + 7, w: 5, h: 4, row: "A", empty: true },
  b1: { x: 3, y: BAIRRO_Y + 20, w: 4, h: 3, row: "B" },
  b2: { x: 10, y: BAIRRO_Y + 20, w: 5, h: 3, row: "B" },
  b3: { x: 17, y: BAIRRO_Y + 20, w: 4, h: 3, row: "B" },
  b4: { x: 39, y: BAIRRO_Y + 20, w: 5, h: 3, row: "B" },
  b5: { x: 47, y: BAIRRO_Y + 20, w: 4, h: 3, row: "B", empty: true },
  b6: { x: 54, y: BAIRRO_Y + 20, w: 6, h: 3, row: "B" },
};
(function expandVila() {
  const z = ZONES.vila;
  const W = z.w;
  const rows = [];
  for (let i = 0; i < BAIRRO_H; i++) rows.push(("#" + ".".repeat(W - 2) + "#").split(""));
  const set = (x, y, c) => {
    if (x > 0 && x < W - 1 && y >= 0 && y < BAIRRO_H) rows[y][x] = c;
  };
  const AVE = [28, 35];
  // a avenida do meio (de norte a sul) e as duas ruas
  for (let y = 0; y < BAIRRO_H; y++) for (let x = AVE[0]; x <= AVE[1]; x++) set(x, y, ",");
  for (const R of Object.values(BAIRRO_ROWS)) for (let x = 1; x < W - 1; x++) (set(x, R.road, ","), set(x, R.road + 1, ","));
  // árvores no começo e no fim do bairro
  for (let x = 1; x < W - 1; x++) if (x % 5 === 2 && (x < AVE[0] || x > AVE[1])) (set(x, 0, "T"), set(x, BAIRRO_H - 1, "T"));
  // lampiões e bancos nas esquinas da avenida; canteiros de flores dos lados
  for (const R of Object.values(BAIRRO_ROWS)) (set(AVE[0] - 1, R.road - 1, "l"), set(AVE[1] + 1, R.road - 1, "l"), set(AVE[0] - 2, R.road - 1, "n"), set(AVE[1] + 2, R.road - 1, "n"));
  for (const y of [3, 9, 17, 22]) (set(AVE[0] - 3, y, "p"), set(AVE[1] + 2, y, "p"));
  // os lotes
  const hs = (a, b) => (((a * 73856093) ^ (b * 19349663)) >>> 0) % 1000 / 1000;
  for (const [id, L] of Object.entries(BAIRRO_LOTES)) {
    const R = BAIRRO_ROWS[L.row];
    const lx0 = L.x - 1,
      lx1 = L.x + L.w,
      hy = L.y - BAIRRO_Y,
      door = L.x + Math.floor(L.w / 2);
    for (let y = R.fence; y < R.road; y++) (set(lx0, y, "f"), set(lx1, y, "f"));
    for (let x = lx0; x <= lx1; x++) set(x, R.fence, "f");
    for (let x = lx0; x <= lx1; x++) if (x !== door) set(x, R.road - 1, "f");
    const plan = {};
    const put = (x, y, k) => (plan[x + "," + (BAIRRO_Y + y)] = k);
    const h0 = hs(L.x, hy);
    const ix0 = lx0 + 1,
      ix1 = lx1 - 1;
    // quintal: tudo grama, depois as coisas
    for (let y = R.fence + 1; y < hy; y++) for (let x = ix0; x <= ix1; x++) put(x, y, "grama");
    if (!L.empty) {
      const top = R.fence + 1;
      put(ix0, hy - 1, "porao");
      put(ix1, hy - 1, "lenha");
      if (L.w >= 5) put(ix0 + 2, hy - 1, "varal");
      if (hy - top >= 4) for (let x = ix0; x <= ix1; x++) put(x, hy - 3, h0 < 0.5 ? "horta" : "ervas");
      for (let x = ix0; x <= ix1; x++) put(x, hy - 2, (x + h0 * 10) % 3 < 1 ? "flores" : "grama");
      put(ix1, top, "latrina");
      put(ix0, top, h0 < 0.35 ? "chiqueiro" : "galinheiro");
      put(ix0 + 1, top, h0 < 0.6 ? "colmeias" : "galpao");
      if (L.w >= 5) put(ix0 + 3, top, "pomar");
    }
    // casa (o lugar fica reservado), jardim da frente e caminho
    for (let y = hy + L.h; y < R.road - 1; y++)
      for (let x = ix0; x <= ix1; x++) {
        if (x === door) set(x, y, ",");
        else put(x, y, (x + y) % 3 === 0 ? "flores" : "gramado");
      }
    set(door, R.road - 1, ",");
    put(ix0, hy + L.h, "placa");
    if (L.empty) for (let y = hy; y < hy + L.h; y++) for (let x = ix0; x <= ix1; x++) put(x, y, "grama");
    L.plan = plan;
  }
  const newRows = rows.map((r) => r.join(""));
  z.map = z.map.slice(0, BAIRRO_Y).concat(newRows, z.map.slice(BAIRRO_Y));
  z.h += BAIRRO_H;
  // Tudo que estava nas linhas de baixo desce junto.
  const shift = (p) => p && p[1] >= BAIRRO_Y && (p[1] += BAIRRO_H);
  for (const k of Object.keys(z.open)) shift(z.open[k]);
  for (const f of z.feats) shift(f);
  for (const n of z.npcList) shift(n);
  for (const s of z.spawn || []) shift(s);
  for (const b of z.town.bld) if (b.y >= BAIRRO_Y) b.y += BAIRRO_H;
})();

/** Coloca um prédio no mapa da vila e registra a porta. */
function placeVilaBuilding(b) {
  const z = ZONES.vila,
    tw = z.town;
  for (let y = b.y; y < b.y + b.h; y++) for (let x = b.x; x < b.x + b.w; x++) setTileRaw("vila", x, y, "H");
  for (const dx of b.door) {
    setTileRaw("vila", dx, b.y + b.h - 1, "D");
    tw.doors[dx + "," + (b.y + b.h - 1)] = b;
  }
  tw.bld.push(b);
}
function setTileRaw(zone, x, y, c) {
  const rows = ZONES[zone].map;
  rows[y] = rows[y].slice(0, x) + c + rows[y].slice(x + 1);
}
function lote(id, extra) {
  const L = BAIRRO_LOTES[id];
  return Object.assign({ x: L.x, y: L.y, w: L.w, h: L.h, door: [L.x + Math.floor(L.w / 2)], plan: L.plan, flowerLot: id }, extra);
}
// Casas à venda no bairro (sem nome: o Simulador transforma em casas compráveis).
for (const [id, style] of [
  ["b1", "casa"],
  ["b2", "casa2"],
  ["b3", "casa"],
  ["b4", "casa2"],
  ["b6", "casa"],
])
  placeVilaBuilding(lote(id, { id: "bairro_" + id, style }));
