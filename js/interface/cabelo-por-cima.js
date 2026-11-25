/**
 * ECOS DO ARCANO — cabelo-por-cima.js
 * As roupas extras (da Alfaiataria, da Moda Brisamar e dos trabalhos) são
 * desenhadas por cima do boneco pronto, então escondiam o cabelo comprido.
 * Aqui o boneco é remontado na ordem certa: corpo e roupa, depois o cabelo e
 * por último o chapéu.
 * Precisa vir depois de trabalhos-e-roupas-novos.js e cosmeticos-novos.js.
 * Modifica (envolve) heroRects.
 */

"use strict";

(() => {
  if (typeof heroRects !== "function") return;
  // roupas do jogo base (já desenham o cabelo no lugar certo) e as grátis (roupas-gratis.js já cuida)
  const OK = new Set(["manto", "tunica", "vestido", "capa", "gibao", "real", "linho", "macacao", "saiablusa", "cinto", "la", "avental", "poncho", "vestidosimples"]);
  const key = String;
  const base = heroRects;
  heroRects = function (L, dir, glow, fr) {
    if (!L || !L.outfit || OK.has(L.outfit) || !L.hstyle || L.hstyle === "careca") return base.apply(this, arguments);
    const full = base.apply(this, arguments);
    const noHat = base.call(this, Object.assign({}, L, { hat: "nenhum" }), dir, glow, fr);
    if (!(full.length >= noHat.length && noHat.every((q, i) => key(q) === key(full[i])))) return full;
    const bald = base.call(this, Object.assign({}, L, { hat: "nenhum", hstyle: "careca" }), dir, glow, fr);
    // cabelo = o que o boneco com cabelo tem a mais que o careca
    const left = new Map();
    for (const q of bald) left.set(key(q), (left.get(key(q)) || 0) + 1);
    const hair = noHat.filter((q) => {
      const n = left.get(key(q)) || 0;
      if (n) return left.set(key(q), n - 1), false;
      return true;
    });
    return bald.concat(hair, full.slice(noHat.length));
  };
})();
