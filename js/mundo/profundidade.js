/**
 * ECOS DO ARCANO — profundidade.js
 * Coisas altas do chão (poço, árvore, fonte, baú, objetos do quintal e dos
 * lotes) eram desenhadas antes das pessoas: quem passava logo atrás delas
 * aparecia por cima, como se atravessasse. Agora, quando alguém está logo
 * atrás (na linha de cima), o objeto é desenhado de novo por cima dessa
 * pessoa, meio transparente (como o telhado que some quando você passa
 * atrás da casa): o objeto fica na frente e dá para ver quem está atrás.
 * Modifica (envolve) crewDrawList.
 */

"use strict";

(() => {
  const TALL_TILES = new Set(["W", "T", "C", "l"]);
  const TALL_PLAN = new Set(["pomar", "poco", "galpao", "latrina", "colmeias", "galinheiro", "forno", "pombal", "lenha", "porao", "chiqueiro", "placa", "banco", "varal"]);
  const planAt = (z, x, y) => {
    for (const b of ZONES[z].town.bld) if (b.plan && b.plan[x + "," + y]) return b.plan[x + "," + y];
    return null;
  };
  const tall = (z, x, y) => {
    const Z = ZONES[z];
    const c = (Z.map[y] || "")[x];
    if (TALL_TILES.has(c)) return c;
    if (!Z.town) return null;
    const com = window.COMMUNITY_LOTS && COMMUNITY_LOTS[z] && COMMUNITY_LOTS[z].get(x + "," + y);
    if (com && (com.startsWith("p:") || com === "sebe")) return c;
    if (TALL_PLAN.has(planAt(z, x, y))) return c;
    return null;
  };
  const base = crewDrawList;
  crewDrawList = function (list, t) {
    base(list, t);
    const z = player.zone,
      Z = ZONES[z];
    if (!Z || !Z.map || game.mode === "battle") return;
    // quem pode estar atrás de alguma coisa: o jogador e o cavalo dele
    const who = [[Math.round(player.rx ?? player.x), Math.round(player.ry ?? player.y)]];
    const seen = new Set();
    for (const [px, py] of who)
      for (let dx = -1; dx <= 1; dx++) {
        const x = px + dx,
          y = py + 1;
        const k = x + "," + y;
        if (seen.has(k)) continue;
        seen.add(k);
        const c = tall(z, x, y);
        if (c == null) continue;
        // por cima da pessoa, mas meio transparente (como o telhado da casa): dá para ver quem está atrás
        list.push({
          y: y - 0.02,
          draw: () => {
            ctx.save();
            ctx.globalAlpha = 0.5;
            drawTile(z, x, y, c, t);
            ctx.restore();
          },
        });
      }
  };
})();

// Decoração da cidade (árvore, poço, baú) não trava ninguém: dá para passar.
// Só as cercas (de madeira, sebe e a cerquinha dos lotes) bloqueiam.
(() => {
  const DECOR = new Set(["T", "W", "C"]);
  const base = walkable;
  walkable = function (z, x, y) {
    const Z = ZONES[z];
    if (Z && Z.town && !Z.town.indoor && Z.map && DECOR.has((Z.map[y] || "")[x]) && x > 0 && y > 0 && x < Z.w - 1 && y < Z.h - 1) return true;
    return base.apply(this, arguments);
  };
})();
