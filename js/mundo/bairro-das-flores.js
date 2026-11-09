/**
 * ECOS DO ARCANO — bairro-das-flores.js
 * Aumenta a Vila de Cinzaluz para o sul: 16 linhas novas com o Bairro das Flores,
 * duas ruas com lampiões, árvores, bancos e lotes largos para as casas da turma
 * (que antes ficavam espremidas entre outros prédios) e casas novas à venda.
 * Roda logo depois de mapa.js, antes de qualquer coisa usar a vila.
 */

"use strict";


const BAIRRO_Y = 46; // primeira linha nova
const BAIRRO_H = 16; // quantas linhas novas
(function expandVila() {
  const z = ZONES.vila;
  const W = z.w;
  const rows = [];
  for (let i = 0; i < BAIRRO_H; i++) {
    let r = "#" + ",".repeat(W - 2) + "#";
    rows.push(r.split(""));
  }
  const set = (x, y, c) => {
    if (x > 0 && x < W - 1 && y >= 0 && y < BAIRRO_H) rows[y][x] = c;
  };
  // Faixas de grama com árvores no começo e no fim do bairro.
  for (let x = 1; x < W - 1; x++) {
    if (x >= 28 && x <= 35) continue;
    set(x, 0, ".");
    set(x, BAIRRO_H - 1, ".");
    if (x % 5 === 2) {
      set(x, 0, "T");
      set(x, BAIRRO_H - 1, "T");
    }
  }
  // Lampiões e bancos ao longo das duas ruas.
  for (const x of [6, 14, 22, 41, 49, 57]) {
    set(x, 7, "l");
    set(x, 13, "l");
  }
  for (const x of [26, 37]) {
    set(x, 7, "n");
    set(x, 13, "n");
  }
  // Canteiros de flores no meio.
  for (const [x, y] of [
    [29, 3],
    [34, 3],
    [29, 10],
    [34, 10],
  ])
    set(x, y, "p");
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
/** Lotes do bairro: duas fileiras de casas, cada uma de frente para a sua rua. */
const BAIRRO_LOTES = {
  // Fileira de cima (porta na linha BAIRRO_Y + 5, rua na linha BAIRRO_Y + 7)
  a1: { x: 3, y: BAIRRO_Y + 2, w: 5, h: 4 },
  a2: { x: 10, y: BAIRRO_Y + 2, w: 5, h: 4 },
  a3: { x: 17, y: BAIRRO_Y + 2, w: 5, h: 4 },
  a4: { x: 39, y: BAIRRO_Y + 2, w: 6, h: 4 },
  a5: { x: 47, y: BAIRRO_Y + 2, w: 5, h: 4 },
  a6: { x: 54, y: BAIRRO_Y + 2, w: 5, h: 4 },
  // Fileira de baixo (porta na linha BAIRRO_Y + 11, rua na linha BAIRRO_Y + 13)
  b1: { x: 3, y: BAIRRO_Y + 9, w: 4, h: 3 },
  b2: { x: 10, y: BAIRRO_Y + 9, w: 5, h: 3 },
  b3: { x: 17, y: BAIRRO_Y + 9, w: 4, h: 3 },
  b4: { x: 39, y: BAIRRO_Y + 9, w: 5, h: 3 },
  b5: { x: 47, y: BAIRRO_Y + 9, w: 4, h: 3 },
  b6: { x: 54, y: BAIRRO_Y + 9, w: 6, h: 3 },
};
function lote(id, extra) {
  const L = BAIRRO_LOTES[id];
  return Object.assign({ x: L.x, y: L.y, w: L.w, h: L.h, door: [L.x + Math.floor(L.w / 2)] }, extra);
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
