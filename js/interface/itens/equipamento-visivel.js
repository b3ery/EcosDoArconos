/**
 * ECOS DO ARCANO — equipamento-visivel.js
 * O que você equipa aparece no seu personagem, no mundo, na batalha e no
 * espelho do inventário:
 *  - Cajado: cada um tem a sua forma (galho, espiral, lua, duplo, estrela),
 *    varinhas são curtas, cetros têm haste dourada e a pedra tem a cor do item.
 *  - Manto/capa/túnica/vestido: uma capa da cor da peça cai pelas costas.
 *  - Armadura: peitoral com ombreiras e cinto; elmo vai na cabeça, botas nos
 *    pés, luvas nas mãos e escudo no braço.
 *  - Amuleto: corrente e pingente no peito; anel e pulseira brilham na mão,
 *    coroa e tiara ficam na cabeça e os óculos no rosto.
 * As cores vêm do próprio ícone do item (g:forma:cor:detalhe:variação).
 * Modifica (envolve) funções de outros arquivos: heroRects.
 */

"use strict";

(() => {
  const shade = (c, f) => {
    if (!c || c[0] !== "#" || c.length < 7) return c;
    const v = [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
    const m = f > 0 ? v.map((x) => x + (255 - x) * f) : v.map((x) => x * (1 + f));
    return "#" + m.map((x) => Math.max(0, Math.min(255, Math.round(x))).toString(16).padStart(2, "0")).join("");
  };
  const DEF = { staff: ["#8a5a2e", "#f2c14e"], robe: ["#5a4a8a", "#f2c14e"], armor: ["#a8b0c8", "#f2c14e"], amulet: ["#f2c14e", "#4fb8ff"] };
  /** forma e cores de um item a partir do ícone dele */
  // o cajado e o manto de aprendiz seguem o visual escolhido no criador
  const STARTER = new Set(["cajado1", "manto1"]);
  function look(id) {
    if (!id || !ITEMS[id] || STARTER.has(id)) return null;
    const k = String(itemIcon(id) || "");
    const p = k.startsWith("g:") ? k.split(":") : ["g", k];
    const shape = p[1] || "staff";
    const d = DEF[shape] || DEF.staff;
    return { shape, main: p[2] || d[0], acc: p[3] || d[1], v: +(p[4] || 0) };
  }
  const STAFFS = ["", "espiral", "lua", "duplo", "estrela"];

  const hrBase = heroRects;
  heroRects = function (L, dir, glow, fr = 0) {
    if (!L || typeof player === "undefined" || !player || L !== player.look || !player.eq) return hrBase.apply(this, arguments);
    const eq = player.eq;
    const side = dir === "left" || dir === "right";
    const up = dir === "up";
    const st = look(eq.cajado);
    // cajado: forma e pedra do item equipado
    let L2 = L,
      g2 = glow,
      own = null;
    if (glow && st) {
      if (st.shape === "staff") ((L2 = Object.assign({}, L, { staffs: STAFFS[st.v % 5] || "" })), (g2 = st.acc));
      else ((g2 = null), (own = st));
    }
    // elmo, coroa, tiara e guirlanda tiram o chapéu de mago
    const arL = look(eq.armadura),
      amL = look(eq.amuleto);
    if ((arL && arL.shape === "helmet") || (amL && (amL.shape === "crown" || amL.shape === "flower"))) L2 = Object.assign({}, L2, { hat: "nenhum" });
    const r = hrBase.call(this, L2, dir, g2, fr);
    const pre = [];
    const add = (...a) => r.push(...a);

    if (own) {
      const c = own.acc,
        m = own.main;
      if (own.shape === "wand") add([13, 8, 1, 7, m], [13, 7, 1, 1, shade(c, -0.2)], [12, 6, 3, 1, c], [13, 5, 1, 1, "#ffffff"]);
      else if (own.shape === "scepter") add([13, 5, 1, 10, "#c9a03a"], [12, 13, 3, 1, "#c9a03a"], [12, 2, 3, 3, c], [12, 2, 1, 1, shade(c, 0.4)], [11, 4, 1, 1, "#c9a03a"], [15, 4, 1, 1, "#c9a03a"]);
      else if (own.shape === "feather") add([13, 6, 1, 9, "#c9a03a"], [13, 0, 1, 7, m], [14, 1, 1, 5, m], [12, 2, 1, 3, shade(m, -0.15)], [13, 1, 1, 5, shade(m, -0.25)], [13, 0, 1, 1, c]);
      else add([13, 4, 1, 11, "#7a4f2a"], [12, 2, 3, 3, c]);
    }

    // manto / capa: cai pelas costas
    const cape = look(eq.manto);
    if (cape) {
      const c = cape.main,
        d = shade(c, -0.3),
        l = shade(c, 0.2);
      if (up) add([4, 9, 8, 6, c], [3, 11, 1, 4, d], [12, 11, 1, 4, d], [4, 9, 8, 1, l], [7, 10, 2, 5, d]);
      else if (side) pre.push([3, 9, 2, 6, d], [3, 9, 1, 6, c]);
      else pre.push([3, 9, 1, 6, d], [12, 9, 1, 6, d], [2, 12, 1, 3, d], [13, 12, 1, 3, d]), add([4, 9, 1, 1, l], [11, 9, 1, 1, l]);
    }

    // armadura e afins
    const ar = look(eq.armadura);
    if (ar) {
      const c = ar.main,
        d = shade(c, -0.35),
        l = shade(c, 0.3);
      if (ar.shape === "helmet") {
        if (up) add([5, 1, 6, 5, c], [5, 1, 6, 1, l]);
        else add([5, 1, 6, 5, c], [5, 1, 6, 1, l], [5, 5, 6, 1, d], side ? [10, 3, 1, 3, d] : [7, 3, 2, 3, d]);
        if (ar.v % 2) add([3, 2, 2, 2, "#f2eee4"], [11, 2, 2, 2, "#f2eee4"]);
      } else if (ar.shape === "boots") add([5, 14, 2, 2, c], [9, 14, 2, 2, c], [5, 14, 2, 1, l], [9, 14, 2, 1, l]);
      else if (ar.shape === "gloves") add([3, 12, 1, 3, c], [12, 12, 1, 3, c], [3, 12, 1, 1, l], [12, 12, 1, 1, l]);
      else if (ar.shape === "shield") {
        if (up) add([3, 10, 1, 4, d]);
        else if (side) add([9, 10, 4, 5, c], [9, 10, 4, 1, l], [10, 12, 2, 1, ar.acc], [9, 14, 4, 1, d]);
        else add([1, 10, 4, 5, c], [1, 10, 4, 1, l], [2, 12, 2, 1, ar.acc], [1, 14, 4, 1, d], [2, 14, 2, 1, c]);
      } else if (up) add([3, 9, 2, 2, c], [11, 9, 2, 2, c], [3, 9, 2, 1, l], [11, 9, 2, 1, l], [4, 12, 8, 1, "#5a3a1e"]);
      else if (side) add([6, 9, 4, 3, c], [6, 9, 4, 1, l], [6, 11, 4, 1, d], [7, 9, 2, 2, c], [5, 12, 6, 1, "#5a3a1e"], [8, 12, 1, 1, "#f2c14e"]);
      else {
        add([5, 9, 6, 3, c], [5, 9, 6, 1, l], [5, 11, 6, 1, d], [7, 10, 2, 1, d]);
        add([3, 9, 2, 2, c], [11, 9, 2, 2, c], [3, 9, 2, 1, l], [11, 9, 2, 1, l]);
        add([4, 12, 8, 1, "#5a3a1e"], [7, 12, 2, 1, "#f2c14e"]);
        if (ar.shape === "scale") add([5, 10, 1, 1, d], [8, 10, 1, 1, d], [10, 10, 1, 1, d]);
      }
    }

    // amuleto / joias
    const am = look(eq.amuleto);
    if (am && !up) {
      const c = am.main,
        a = am.acc;
      if (am.shape === "crown") add([5, 4, 6, 1, c], [5, 3, 1, 1, c], [7, 2, 2, 2, c], [10, 3, 1, 1, c], [7, 4, 2, 1, a], [7, 2, 1, 1, shade(c, 0.4)]);
      else if (am.shape === "flower") add([5, 4, 6, 1, "#5aa83a"], [5, 3, 1, 2, c], [7, 3, 1, 1, a], [8, 3, 1, 1, c], [10, 3, 1, 2, a]);
      else if (am.shape === "eye") add(side ? [8, 7, 3, 1, c] : [6, 7, 4, 1, c], side ? [9, 7, 1, 1, "#cfe8f0"] : [6, 7, 1, 1, "#cfe8f0"]);
      else if (am.shape === "ring" || am.shape === "bracelet") add(side ? [11, 13, 1, 1, c] : [3, 13, 1, 1, c], side ? [11, 12, 1, 1, a] : [12, 13, 1, 1, a]);
      else if (side) add([7, 9, 1, 2, "#c9a03a"], [7, 11, 2, 1, a]);
      else if (am.shape === "necklace") add([5, 9, 6, 1, c], [6, 10, 4, 1, c], [7, 10, 2, 1, a]);
      else add([6, 9, 1, 1, "#c9a03a"], [9, 9, 1, 1, "#c9a03a"], [7, 10, 2, 2, a], [7, 10, 1, 1, shade(a, 0.45)], [7, 9, 2, 1, "#c9a03a"]);
    }
    return pre.length ? pre.concat(r) : r;
  };
})();
