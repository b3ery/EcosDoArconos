/**
 * ECOS DO ARCANO — cabelos-novos.js
 * Mais penteados para escolher (criador, Salão e família):
 * franja, chanel, black power, dreads, maria-chiquinha, topete, ondulado
 * longo, trança de lado, coque samurai, espetado, cachos longos, undercut,
 * meio-preso e liso repartido.
 * Os penteados são desenhados por cima da cabeça (e o comprimento atrás do
 * corpo); o chapéu continua por cima do cabelo.
 * Modifica (envolve) heroRects e acrescenta em COSMETICS.hstyle.
 */

"use strict";

(() => {
  if (typeof COSMETICS === "undefined" || typeof heroRects !== "function") return;
  const NEW = [
    ["franja", "Franja", 0],
    ["chanel", "Chanel", 0],
    ["afro", "Black power", 0],
    ["dreads", "Dreads", 0],
    ["chiquinha", "Maria-chiquinha", 0],
    ["topete", "Topete", 0],
    ["ondulado", "Ondulado longo", 0],
    ["trancalado", "Trança de lado", 0],
    ["samurai", "Coque samurai", 0],
    ["espetado", "Espetado", 0],
    ["cachoslongos", "Cachos longos", 0],
    ["undercut", "Undercut", 0],
    ["meiopreso", "Meio-preso", 0],
    ["repartido", "Liso repartido", 0],
  ];
  for (const h of NEW) if (!COSMETICS.hstyle.some((o) => o[0] === h[0])) COSMETICS.hstyle.push(h);
  const KEYS = new Set(NEW.map((h) => h[0]));
  const shade2 = (c, v) => (typeof shade === "function" ? shade(c, v) : c);

  // [x, y, w, h] em pixels do boneco 16x16 (cabeça em x 5..10, y 5..8)
  function hair(hs, dir, c) {
    const hi = shade2(c, 0.22),
      lo = shade2(c, -0.25);
    const back = [],
      front = [];
    const B = (x, y, w, h, col = c) => back.push([x, y, w, h, col]),
      F = (x, y, w, h, col = c) => front.push([x, y, w, h, col]);
    const up = dir === "up";
    switch (hs) {
      case "franja":
        F(5, 5, 6, 1);
        if (!up) (F(5, 6, 6, 1), F(5, 7, 1, 1), F(10, 7, 1, 1), F(6, 6, 1, 1, hi));
        else F(5, 5, 6, 4);
        break;
      case "chanel":
        F(4, 5, 8, 1);
        F(4, 6, 1, 3);
        F(11, 6, 1, 3);
        F(5, 5, 6, 1, hi);
        if (up) F(4, 5, 8, 4);
        else F(5, 6, 1, 1);
        break;
      case "afro":
        B(3, 3, 10, 6, lo);
        F(4, 2, 8, 4);
        F(3, 4, 1, 4);
        F(12, 4, 1, 4);
        F(5, 2, 2, 1, hi);
        F(9, 3, 1, 1, hi);
        if (up) F(3, 3, 10, 6);
        break;
      case "dreads":
        F(4, 5, 8, 1);
        for (const x of [4, 5, 10, 11]) B(x, 6, 1, 7 + (x % 2), x % 2 ? c : lo);
        if (up) for (let x = 5; x <= 10; x++) F(x, 5, 1, 7 + (x % 2), x % 2 ? c : lo);
        break;
      case "chiquinha":
        F(5, 5, 6, 1);
        F(5, 6, 1, 1);
        F(10, 6, 1, 1);
        F(2, 6, 2, 3);
        F(12, 6, 2, 3);
        F(3, 9, 1, 1, lo);
        F(12, 9, 1, 1, lo);
        F(4, 6, 1, 1, "#e0466a");
        F(11, 6, 1, 1, "#e0466a");
        if (up) F(5, 5, 6, 4);
        break;
      case "topete":
        F(5, 4, 6, 2);
        F(8, 3, 3, 1);
        F(9, 2, 2, 1, hi);
        F(5, 6, 1, 1);
        F(10, 6, 1, 1);
        if (up) F(5, 4, 6, 5);
        break;
      case "ondulado":
        F(4, 5, 8, 1);
        F(4, 6, 1, 2);
        F(11, 6, 1, 2);
        B(3, 6, 2, 8);
        B(11, 6, 2, 8);
        B(3, 8, 1, 1, hi);
        B(12, 10, 1, 1, hi);
        B(4, 12, 1, 1, lo);
        if (up) F(4, 5, 8, 9);
        break;
      case "trancalado":
        F(5, 5, 6, 1);
        F(5, 6, 1, 1);
        F(10, 6, 2, 1);
        for (let y = 7; y <= 13; y++) F(y % 2 ? 11 : 10, y, 2, 1, y % 2 ? c : lo);
        F(10, 14, 2, 1, "#f2c14e");
        if (up) F(5, 5, 6, 4);
        break;
      case "samurai":
        F(5, 5, 6, 1);
        F(5, 6, 1, 1);
        F(10, 6, 1, 1);
        F(7, 3, 2, 2);
        F(6, 2, 4, 1, lo);
        if (up) F(5, 4, 6, 5);
        break;
      case "espetado":
        F(5, 5, 6, 1);
        F(5, 4, 1, 1);
        F(7, 3, 1, 2);
        F(9, 4, 1, 1);
        F(6, 4, 1, 1, hi);
        F(10, 3, 1, 2);
        F(5, 6, 1, 1);
        F(10, 6, 1, 1);
        if (up) F(5, 4, 6, 5);
        break;
      case "cachoslongos":
        F(4, 4, 8, 2);
        F(5, 4, 1, 1, hi);
        F(9, 4, 1, 1, hi);
        B(3, 5, 2, 9);
        B(11, 5, 2, 9);
        for (const y of [6, 9, 12]) (B(3, y, 1, 1, hi), B(12, y + 1, 1, 1, hi));
        if (up) F(3, 4, 10, 10);
        break;
      case "undercut":
        F(5, 4, 6, 2);
        F(6, 3, 5, 1, hi);
        F(5, 6, 1, 2, lo);
        F(10, 6, 1, 2, lo);
        if (up) F(5, 4, 6, 3);
        break;
      case "meiopreso":
        F(5, 5, 6, 1);
        F(5, 6, 1, 1);
        F(10, 6, 1, 1);
        F(7, 4, 2, 1, "#c94a8b");
        B(4, 6, 2, 6);
        B(10, 6, 2, 6);
        if (up) (F(5, 5, 6, 7), F(7, 4, 2, 1, "#c94a8b"));
        break;
      case "repartido":
        F(5, 5, 6, 1);
        F(5, 6, 2, 1);
        F(10, 6, 1, 2);
        F(7, 5, 1, 1, lo);
        F(8, 5, 1, 1, hi);
        if (up) F(5, 5, 6, 4);
        break;
    }
    return { back, front };
  }

  const base = heroRects;
  heroRects = function (L, dir, glow, fr) {
    if (!L || !KEYS.has(L.hstyle)) return base.apply(this, arguments);
    // o corpo e o rosto sem cabelo; depois o cabelo; o chapéu por cima de tudo
    const bald = Object.assign({}, L, { hstyle: "careca" });
    const full = base.call(this, bald, dir, glow, fr);
    const noHat = base.call(this, Object.assign({}, bald, { hat: "nenhum" }), dir, glow, fr);
    let hat = [];
    let body = full;
    if (full.length > noHat.length && noHat.every((q, i) => q === full[i] || String(q) === String(full[i]))) ((hat = full.slice(noHat.length)), (body = noHat));
    const H = hair(L.hstyle, dir, L.hair || "#3a2414");
    return H.back.concat(body, H.front, hat);
  };
})();
