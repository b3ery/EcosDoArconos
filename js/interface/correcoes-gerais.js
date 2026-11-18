/**
 * ECOS DO ARCANO — correcoes-gerais.js
 * Pequenas correções juntas:
 *  - jogos salvos antigos: apaga os restos de um inimigo que saiu do jogo;
 *  - água: tira o pedaço de rio solto no sul da vila e liga os quadradinhos
 *    de água em diagonal do Bosque (viram um riacho de verdade);
 *  - capuz: agora tem a parte de trás (de costas e de lado);
 *  - Pedro Poeta não fica mais parado em cima da ponte;
 *  - a Andressa passeia com os gatinhos dela;
 *  - dentro das lojas e da taverna, clicar numa pessoa abre o mesmo menu
 *    completo (pizza) da rua.
 * Modifica (envolve) funções de outros arquivos: heroRects, crewTarget,
 * crewDrawList, interiorPersonMenu, loadSave.
 */

"use strict";

/* ----- jogos salvos antigos ----- */
function cleanOldSave() {
  if (!player) return;
  const bad = (k) => /^ny[x]/i.test(k);
  for (const k of Object.keys(player)) if (bad(k)) delete player[k];
  if (player.flags) for (const k of Object.keys(player.flags)) if (bad(k) || /ny[x]/i.test(k)) delete player.flags[k];
  if (player.ach) for (const k of Object.keys(player.ach)) if (/ny[x]/i.test(k)) delete player.ach[k];
}
{
  const lsBase = loadSave;
  loadSave = function () {
    const r = lsBase.apply(this, arguments);
    try {
      cleanOldSave();
    } catch (e) {}
    return r;
  };
}

/* ----- água solta ----- */
(function fixWater() {
  const setT = (z, x, y, c) => {
    const rows = ZONES[z].map;
    rows[y] = rows[y].slice(0, x) + c + rows[y].slice(x + 1);
  };
  const isW = (z, x, y) => ZONES[z].map[y] && ZONES[z].map[y][x] === "~";
  const ground = (z, x, y) => ZONES[z].map[y] && ".,".includes(ZONES[z].map[y][x]);
  // vila: o resto do rio que ficou sozinho lá embaixo
  const V = ZONES.vila;
  for (let y = 46; y < V.h - 1; y++)
    for (const x of [52, 53]) {
      if (!isW("vila", x, y)) continue;
      const up = isW("vila", x, y - 1) || isW("vila", x, y + 1);
      const side = isW("vila", x === 52 ? 53 : 52, y);
      if (!up || (side && !isW("vila", x, y - 1) && !isW("vila", x, y + 1))) setT("vila", x, y, ",");
    }
  // bosque e floresta: água em diagonal vira riacho; quadradinho sozinho vira chão
  for (const zid of ["bosque", "floresta"]) {
    const z = ZONES[zid];
    if (!z || !z.map) continue;
    for (let y = 1; y < z.h - 1; y++)
      for (let x = 1; x < z.w - 1; x++) {
        if (!isW(zid, x, y)) continue;
        for (const [dx, dy] of [[1, 1], [-1, 1]]) {
          if (!isW(zid, x + dx, y + dy) || isW(zid, x + dx, y) || isW(zid, x, y + dy)) continue;
          if (ground(zid, x + dx, y)) setT(zid, x + dx, y, "~");
          else if (ground(zid, x, y + dy)) setT(zid, x, y + dy, "~");
        }
        const any = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]].some(([dx, dy]) => isW(zid, x + dx, y + dy));
        if (!any) setT(zid, x, y, ".");
      }
  }
})();

/* ----- capuz com a parte de trás ----- */
{
  const hrBase = heroRects;
  heroRects = function (L, dir) {
    const r = hrBase.apply(this, arguments);
    if (!L || L.hat !== "capuz") return r;
    const dk = shade(L.robe || "#3d4fa8", -0.35),
      dk2 = shade(L.robe || "#3d4fa8", -0.5);
    if (dir === "up") r.push([4, 3, 8, 7, dk], [5, 3, 6, 1, dk2], [7, 4, 2, 5, dk2], [6, 10, 4, 1, dk]);
    else if (dir === "left") r.push([8, 3, 4, 7, dk], [11, 4, 1, 6, dk2], [9, 3, 2, 1, dk2]);
    else if (dir === "right") r.push([4, 3, 4, 7, dk], [4, 4, 1, 6, dk2], [5, 3, 2, 1, dk2]);
    return r;
  };
}

/* ----- Pedro Poeta fora da ponte ----- */
{
  const ctBase = crewTarget;
  crewTarget = function (id) {
    const t = ctBase.apply(this, arguments);
    if (id === "gabriel" && Array.isArray(t) && t[0] === 52 && t[1] === 12) return [56, 10];
    return t;
  };
}

/* ----- os gatinhos da Andressa ----- */
const ANDRESSA_CATS = [
  { t: "gato", col: "#2a2a2a", name: "Sombra" },
  { t: "gato", col: "#e8902a", name: "Biscoito" },
];
{
  const trail = [];
  const cdBase = crewDrawList;
  crewDrawList = function (list, t) {
    cdBase(list, t);
    const a = player.zone === "vila" && game.crewA && game.crewA.andressa;
    if (!a || (typeof crewVisible === "function" && !crewVisible(a)) || (typeof isDead === "function" && isDead("andressa"))) return;
    const last = trail[trail.length - 1];
    if (!last || Math.hypot(last[0] - a.rx, last[1] - a.ry) > 0.12) trail.push([a.rx, a.ry]);
    while (trail.length > 30) trail.shift();
    const moving = Math.abs(a.rx - a.x) + Math.abs(a.ry - a.y) > 0.05;
    ANDRESSA_CATS.forEach((c, i) => {
      const p = trail[Math.max(0, trail.length - 1 - (i + 1) * 9)] || [a.rx - 0.8 * (i + 1), a.ry + 0.3];
      const px = moving ? p[0] : a.rx + (i ? 0.7 : -0.7),
        py = moving ? p[1] + 0.25 : a.ry + 0.45;
      list.push({ y: py + 0.05, draw: () => drawPet(c, px * TILE + 8, py * TILE + 8, px > a.rx, t + i, moving) });
    });
  };
}

/* ----- dentro das lojas: menu completo ----- */
{
  const ipBase = interiorPersonMenu;
  interiorPersonMenu = function (pe) {
    if (pe && !pe.cid && !pe.aa && !pe.guard && !pe.kid && !pe.child && typeof walkerMenu === "function") {
      pe.line = pe.line || pk(WALKER_LINES);
      game.pieAnchor = { x: pe.x, y: pe.y };
      return walkerMenu(pe);
    }
    return ipBase.apply(this, arguments);
  };
}
