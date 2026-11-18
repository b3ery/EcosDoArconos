/**
 * ECOS DO ARCANO — alargar-rio.js
 * Respiro de verdade entre o rio e as construções de Cinzaluz: o mapa
 * cresce 4 colunas, 2 de cada lado do rio (margem de grama dos dois
 * lados). Tudo o que fica a leste anda junto: prédios, portas, quintais,
 * barracas, moradores, lotes, pontos da história e da turma. Ruas e pontes
 * continuam inteiras (a coluna nova repete o chão de passagem).
 * VILA_X(x) converte uma coluna antiga na nova, para o código que tem
 * posições fixas da vila.
 */

"use strict";

// abre n colunas antes da coluna a e n antes da b (coordenadas antigas). Da linha
// "south" para baixo (Bairro das Flores, cemitério) não tem rio: as 4 colunas entram
// juntas na coluna "c", depois dos lotes, para não cortar nenhuma casa.
const VILA_RIVER_GROW = { a: 51, b: 54, n: 2, south: typeof BAIRRO_Y !== "undefined" ? BAIRRO_Y : 46, c: 61 };
function VILA_X(x, y = 0) {
  const G = VILA_RIVER_GROW;
  if (y >= G.south) return x < G.c ? x : x + G.n * 2;
  return x < G.a ? x : x < G.b ? x + G.n : x + G.n * 2;
}
(() => {
  const Z = ZONES.vila;
  if (!Z || !Z.map) return;
  const G = VILA_RIVER_GROW;
  const H = Z.h;
  // 1) o mapa: cada linha ganha as colunas novas
  const rows = Z.map.map((r) => r.split(""));
  const fillFor = (row, y, at) => {
    if (y === 0 || y === H - 1) return "#";
    const L = row[at - 1],
      R = row[at];
    if (",=".includes(L) && ",=".includes(R)) return L === "=" && R === "=" ? "=" : ",";
    if (L === "=" || R === "=") return ","; // a ponte termina em chão de pedra
    return ".";
  };
  Z.map = rows.map((row, y) => {
    if (y >= G.south && y < H - 1) {
      const cc = fillFor(row, y, G.c);
      return [...row.slice(0, G.c), ...Array(G.n * 2).fill(cc), ...row.slice(G.c)].join("");
    }
    const ca = fillFor(row, y, G.a),
      cb = fillFor(row, y, G.b);
    return [...row.slice(0, G.a), ...Array(G.n).fill(ca), ...row.slice(G.a, G.b), ...Array(G.n).fill(cb), ...row.slice(G.b)].join("");
  });
  Z.w += G.n * 2;
  // 2) tudo o que tem posição
  const X = VILA_X;
  const pt = (p) => p && typeof p[0] === "number" && (p[0] = X(p[0], p[1]));
  const keyMap = (obj) => {
    if (!obj) return obj;
    const out = {};
    for (const [k, v] of Object.entries(obj)) {
      const [x, y] = k.split(",").map(Number);
      out[X(x, y) + "," + y] = v;
    }
    return out;
  };
  const moved = new Set();
  const moveB = (b) => {
    if (!b || moved.has(b)) return;
    moved.add(b);
    const nx = X(b.x, b.y);
    const dx = nx - b.x;
    b.x = nx;
    if (b.door) b.door = b.door.map((d) => d + dx);
    if (b.plan) b.plan = keyMap(b.plan);
    for (const k of ["fx", "rx"]) if (typeof b[k] === "number") b[k] += dx;
  };
  for (const b of Z.town.bld) moveB(b);
  for (const b of Z.town.extraPlans || []) moveB(b);
  Z.town.doors = {};
  for (const b of Z.town.bld) for (const d of b.door) Z.town.doors[d + "," + (b.y + b.h - 1)] = b;
  Z.town.stalls = keyMap(Z.town.stalls);
  if (typeof hutsFrom === "function") Z.town.huts = hutsFrom(Z.town.stalls);
  for (const k of ["arrive"]) pt(Z.town[k]);
  for (const p of Z.town.horses || []) p[0] = X(Math.floor(p[0])) + (p[0] % 1);
  for (const p of Z.town.boats || []) p[0] = X(Math.floor(p[0])) + (p[0] % 1);
  Z.npcs = keyMap(Z.npcs);
  for (const n of Z.npcList || []) pt(n);
  for (const f of Z.feats || []) pt(f);
  for (const s of Z.spawn || []) pt(s);
  for (const o of Object.values(Z.open || {})) pt(o);
  pt(Z.guardPos);
  // lotes e bairros
  if (typeof LOTES !== "undefined") {
    for (const L of LOTES.lots.concat(LOTES.yards || []))
      if (L.zid === "vila") {
        moveB(L.b);
        if (typeof L.x0 === "number") ((L.x0 = X(L.x0, L.b.y)), (L.x1 = X(L.x1, L.b.y)));
      }
    for (const q of (LOTES.bairros && LOTES.bairros.vila) || []) ((q.x0 = X(q.x0, q.y0)), (q.x1 = X(q.x1, q.y0)));
    for (const q of LOTES.mud.concat(LOTES.lines)) if (q[2] === "vila") q[0] = X(q[0], q[1]);
  }
  // pontos fixos de outros arquivos
  if (typeof VILLAGE_POINTS !== "undefined") for (const p of Object.values(VILLAGE_POINTS)) pt(p);
  if (typeof BAIRRO_LOTES !== "undefined") for (const L of Object.values(BAIRRO_LOTES)) ((L.x = X(L.x, L.y)), L.plan && (L.plan = keyMap(L.plan)));
  if (typeof CREW_GATHER_SPOTS !== "undefined") for (const p of CREW_GATHER_SPOTS) pt(p);
  if (typeof RAID_GATES !== "undefined") for (const p of RAID_GATES) pt(p);
  if (typeof DESC !== "undefined" && DESC.graves) for (const p of DESC.graves) pt(p);
  // a rotina da turma tem lugares fixos na vila
  if (typeof crewTarget === "function") {
    const ctBase = crewTarget;
    crewTarget = function () {
      const t = ctBase.apply(this, arguments);
      return Array.isArray(t) ? [X(t[0], t[1]), t[1]] : t;
    };
  }
})();
