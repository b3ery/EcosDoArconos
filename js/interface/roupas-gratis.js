/**
 * ECOS DO ARCANO — roupas-gratis.js
 * Oito roupas novas de graça para todo mundo (criador, guarda-roupa e lojas):
 * camisa de linho, macacão de lavrador, saia e blusa, túnica com cinto,
 * suéter de lã, avental florido, poncho e vestido simples.
 * As roupas pagas continuam pagas. A roupa nova é desenhada por cima da
 * túnica, do pescoço para baixo (grade 16x16 do boneco).
 * Modifica (envolve) heroRects e acrescenta em COSMETICS.outfit.
 */

"use strict";

(() => {
  if (typeof COSMETICS === "undefined" || typeof heroRects !== "function") return;
  const FREE = [
    ["linho", "Camisa de linho", 0],
    ["macacao", "Macacão de lavrador", 0],
    ["saiablusa", "Saia e blusa", 0],
    ["cinto", "Túnica com cinto", 0],
    ["la", "Suéter de lã", 0],
    ["avental", "Avental florido", 0],
    ["poncho", "Poncho", 0],
    ["vestidosimples", "Vestido simples", 0],
  ];
  for (const o of FREE) if (!COSMETICS.outfit.some((q) => q[0] === o[0])) COSMETICS.outfit.push(o);
  const KEYS = new Set(FREE.map((o) => o[0]));
  const dark = (c, v) => (typeof shade === "function" ? shade(c, v) : c);

  // [x, y, w, h, cor]
  function rects(o, rb) {
    const dk = dark(rb, -0.35),
      shoes = "#3a2a1e",
      gold = "#f2c14e";
    const pants = (c) => [[5, 13, 2, 2, c], [9, 13, 2, 2, c]];
    switch (o) {
      case "linho":
        return [[4, 9, 8, 4, "#e8dcc0"], [7, 9, 2, 2, "#c8b890"], [4, 12, 8, 1, "#6a4a2a"], ...pants("#5a4a3a")];
      case "macacao":
        return [[4, 9, 8, 4, rb], [5, 10, 6, 5, "#3a5a8a"], [5, 9, 1, 1, "#3a5a8a"], [10, 9, 1, 1, "#3a5a8a"], [5, 10, 1, 1, gold], [10, 10, 1, 1, gold], [7, 11, 2, 1, "#2a4570"]];
      case "saiablusa":
        return [[4, 9, 8, 2, "#f2eee4"], [7, 9, 2, 1, "#d8d0c0"], [4, 11, 8, 3, rb], [4, 13, 8, 1, dk], [5, 14, 2, 1, shoes], [9, 14, 2, 1, shoes]];
      case "cinto":
        return [[4, 9, 8, 5, rb], [4, 11, 8, 1, "#3a2414"], [7, 11, 2, 1, gold], ...pants(shoes)];
      case "la":
        return [[3, 9, 10, 4, "#b04a3a"], [3, 10, 10, 1, "#e8dcc0"], [4, 10, 1, 1, "#b04a3a"], [7, 10, 1, 1, "#b04a3a"], [10, 10, 1, 1, "#b04a3a"], [3, 12, 10, 1, "#8a3428"], ...pants("#4a4a52")];
      case "avental":
        return [[4, 9, 8, 5, rb], [5, 10, 6, 4, "#f2eee4"], [6, 11, 1, 1, "#e0466a"], [9, 12, 1, 1, "#e0466a"], [7, 13, 1, 1, "#5ad06a"], [4, 10, 8, 1, "#d8d0c0"], [5, 14, 2, 1, shoes], [9, 14, 2, 1, shoes]];
      case "poncho":
        return [[2, 9, 12, 3, rb], [2, 10, 12, 1, gold], [2, 11, 12, 1, dk], [7, 9, 2, 1, dk], ...pants("#5a4a3a")];
      case "vestidosimples":
        return [[4, 9, 8, 2, rb], [3, 11, 10, 3, rb], [3, 13, 10, 1, dk], [7, 9, 2, 1, "#f2eee4"], [5, 14, 2, 1, shoes], [9, 14, 2, 1, shoes]];
    }
    return [];
  }

  const base = heroRects;
  heroRects = function (L, dir, glow, fr) {
    if (!L || !KEYS.has(L.outfit)) return base.apply(this, arguments);
    const T = Object.assign({}, L, { outfit: "tunica" });
    const full = base.call(this, T, dir, glow, fr);
    const noHat = base.call(this, Object.assign({}, T, { hat: "nenhum" }), dir, glow, fr);
    const bald = base.call(this, Object.assign({}, T, { hat: "nenhum", hstyle: "careca" }), dir, glow, fr);
    const R = rects(L.outfit, L.robe || "#3d4fa8");
    const key = String;
    // chapéu = o que sobra depois do corpo sem chapéu
    if (!(full.length >= noHat.length && noHat.every((q, i) => key(q) === key(full[i])))) return full.concat(R);
    const hat = full.slice(noHat.length);
    // cabelo = o que o corpo com cabelo tem a mais que o careca
    const left = new Map();
    for (const q of bald) left.set(key(q), (left.get(key(q)) || 0) + 1);
    const hair = noHat.filter((q) => {
      const n = left.get(key(q)) || 0;
      if (n) return left.set(key(q), n - 1), false;
      return true;
    });
    // ordem: corpo, roupa nova, cabelo (não fica escondido) e chapéu por cima
    return bald.concat(R, hair, hat);
  };
})();
