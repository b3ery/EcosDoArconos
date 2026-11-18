/**
 * ECOS DO ARCANO — reurbanizacao.js
 * Cinzaluz segue o padrão dos lotes em TUDO: as casas de morador que
 * ficavam espremidas no centro calçado (as casas da turma, as do bairro
 * antigo e as do Bairro Novo do leste) se mudam para lotes de verdade, com
 * rua na frente, recuo com jardim, caminho até a porta, cerca e quintal nos
 * fundos, no mesmo padrão do Bairro dos Lotes (a vila cresce para o leste
 * para caber). Cada casa leva junto o nome, o estilo e quem mora nela; o
 * lugar onde ela ficava vira uma pracinha com árvore.
 *  - mansão vai para lote grande, no Alto dos Nobres;
 *  - casa, casa de dois andares e sobrado vão para lote médio;
 *  - casebre vai para casinha de dois andares no Beco dos Remendos.
 * Fica de fora: a sua casa inicial e as casas das fazendas.
 */

"use strict";

(() => {
  if (typeof LOTES === "undefined" || !ZONES.vila) return;
  const z = ZONES.vila;
  const HOMES = new Set(["casa", "casa2", "casebre", "sobrado", "mansao"]);
  const KEEP = new Set(["home", "le1", "le3"]);
  const movers = z.town.bld.filter((b) => !b.lot && HOMES.has(b.style) && !KEEP.has(b.id) && !(b.name && /Fazenda|Celeiro|Sítio do Leste/.test(b.name)));
  if (!movers.length) return;
  const tier = (b) => (b.style === "mansao" ? "L" : b.style === "casebre" ? "S" : "M");
  const want = { L: movers.filter((b) => tier(b) === "L"), M: movers.filter((b) => tier(b) === "M"), S: movers.filter((b) => tier(b) === "S") };
  // segmentos novos a leste (cada um com as três ruas do bairro)
  const SEGW = 34;
  const segPlans = [];
  let L = want.L.length,
    M = want.M.length,
    S = want.S.length;
  while (L > 0 || M > 0 || S > 0) {
    const p = { 26: [], 44: [], 60: [] };
    if (L > 0) (p[26] = Array(Math.min(2, L)).fill("L")), (L -= p[26].length);
    else if (M > 0) (p[26] = Array(Math.min(3, M)).fill("M")), (M -= p[26].length);
    if (M > 0) (p[44] = Array(Math.min(3, M)).fill("M")), (M -= p[44].length);
    if (S > 0) (p[60] = Array(Math.min(8, S)).fill("S")), (S -= p[60].length);
    else if (M > 0) (p[60] = Array(Math.min(3, M)).fill("M")), (M -= p[60].length);
    segPlans.push(p);
    if (segPlans.length > 6) break;
  }
  const oldW = z.w,
    ADD = segPlans.length * SEGW + 1,
    W = oldW + ADD;
  const m = z.map.map((r) => r.split(""));
  for (let y = 0; y < z.h; y++) {
    const edge = y === 0 || y === z.h - 1;
    if (!edge && m[y][oldW - 1] === "#") m[y][oldW - 1] = ".";
    for (let x = oldW; x < W; x++) m[y].push(edge || x === W - 1 ? "#" : ".");
  }
  const set = (x, y, c) => x > 0 && y > 0 && x < W - 1 && y < z.h - 1 && (m[y][x] = c);
  const fill = (x0, y0, x1, y1, c) => {
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) set(x, y, c);
  };
  // as ruas do bairro continuam para o leste, e a saída leste vai junto
  for (const y of [26, 44, 60]) fill(oldW - 2, y, W - 2, y + 1, ",");
  m[26][W - 1] = ",";
  m[27][W - 1] = ",";
  const AV = [oldW - 3];
  for (let i = 0; i < segPlans.length; i++) AV.push(AV[i] + SEGW);
  AV[AV.length - 1] = Math.min(AV[AV.length - 1], W - 3);
  for (const ax of AV) fill(ax, 2, ax + 1, 61, ",");
  // tira as casas do centro: o chão delas vira pracinha
  for (const b of movers) {
    for (const dx of b.door) delete z.town.doors[dx + "," + (b.y + b.h - 1)];
    for (let y = b.y; y < b.y + b.h; y++) for (let x = b.x; x < b.x + b.w; x++) if ("HD".includes(m[y][x])) m[y][x] = ".";
    if (b.w >= 4) m[b.y + 1][b.x + Math.floor(b.w / 2)] = "T";
    b.plan = null;
  }
  const E = { z, set, fill, zid: "vila", id: 100, nm: 0, fm: 0, seed: 7, ...LOTE_NOMES_VALDARIA };
  const BAIRRO = { 26: "nobres", 44: "oficios", 60: "remendos" };
  segPlans.forEach((p, si) => {
    for (const road of [26, 44, 60]) {
      let x = AV[si] + 2;
      for (const k of p[road]) {
        const b = want[k].shift();
        if (!b) continue;
        LOTES.place(E, k, x, road, BAIRRO[road], b);
        x += LOTES.TYPE[k].span + 1;
      }
    }
    // calçada: árvores e lampiões no alto, bancos no meio
    for (let x = AV[si] + 3; x < AV[si + 1] - 1; x += 4) {
      if (m[28][x] === ".") set(x, 28, x % 8 === 0 ? "l" : "T");
      if (x % 12 === 3 && m[46][x] === "." && m[46][x + 1] === ".") (set(x, 46, "b"), set(x + 1, 46, "b"));
    }
  });
  z.map = m.map((r) => r.join(""));
  z.w = W;
  z.open.e = [W - 1, 26];
  for (const q of LOTES.bairros.vila || []) q.x1 = W - 2;
  if (typeof addDoorPaths === "function") addDoorPaths("vila");
  if (game) game.houseList = null;
})();
