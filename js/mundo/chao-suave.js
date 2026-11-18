/**
 * ECOS DO ARCANO — chao-suave.js
 * O chão deixa de parecer um tabuleiro de xadrez.
 *  - Antes cada ladrilho sorteava uma de duas cores, e a grama ficava
 *    quadriculada. Agora a cor vem de um "ruído suave" calculado pela posição
 *    no mundo: manchas de grama mais clara e mais escura atravessam os
 *    ladrilhos como no chão de verdade, em 4 tons (pixel art, sem borrão).
 *  - Onde a grama encontra o caminho de terra, a grama "invade" a borda do
 *    caminho com tufos irregulares, e o caminho ganha uma linha de terra mais
 *    escura e pedrinhas: a transição fica natural, sem degrau reto.
 *  - O caminho de terra também ganha manchas suaves e marcas de roda.
 * Modifica (envolve) funções de outros arquivos: ground, drawTile.
 */

"use strict";

(() => {
  const hsh = (x, y) => {
    let h = (x * 374761393 + y * 668265263) | 0;
    h = (h ^ (h >>> 13)) * 1274126177;
    return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
  };
  const sm = (t) => t * t * (3 - 2 * t);
  /** ruído suave (0..1) na posição do mundo, em pixels */
  function noise(px, py, s) {
    const x = px / s,
      y = py / s;
    const x0 = Math.floor(x),
      y0 = Math.floor(y);
    const fx = sm(x - x0),
      fy = sm(y - y0);
    const a = hsh(x0, y0),
      b = hsh(x0 + 1, y0),
      c = hsh(x0, y0 + 1),
      d = hsh(x0 + 1, y0 + 1);
    return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
  }
  const rgb = (c) => {
    if (!c || c[0] !== "#") return [100, 120, 80];
    const v = c.length === 4 ? c.slice(1).replace(/./g, (m) => m + m) : c.slice(1, 7);
    return [0, 2, 4].map((i) => parseInt(v.slice(i, i + 2), 16));
  };
  const toHex = (a) => "#" + a.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("");
  const PAL = new Map();
  /** 4 tons entre as duas cores do tema (com um tom um pouco mais claro) */
  function shades(th) {
    const k = th.g1 + th.g2;
    if (PAL.has(k)) return PAL.get(k);
    const A = rgb(th.g1),
      B = rgb(th.g2);
    const mix = (t) => toHex(A.map((v, i) => v + (B[i] - v) * t));
    const light = toHex(B.map((v) => v + (255 - v) * 0.07));
    const out = [mix(0), mix(0.35), mix(0.7), light];
    PAL.set(k, out);
    return out;
  }
  const clear = new Map();
  const noFill = (th) => {
    if (!clear.has(th)) clear.set(th, Object.assign({}, th, { g1: "rgba(0,0,0,0)", g2: "rgba(0,0,0,0)" }));
    return clear.get(th);
  };

  const gBase = ground;
  ground = function (th, X, Y, h) {
    if (!th || !th.g1 || !th.g2) return gBase.apply(this, arguments);
    const P = shades(th);
    // 4 pedaços de 16px por ladrilho, cada um com o tom do ruído naquele ponto
    for (let sy = 0; sy < 2; sy++)
      for (let sx = 0; sx < 2; sx++) {
        const wx = X + sx * 16 + 8,
          wy = Y + sy * 16 + 8;
        const n = noise(wx, wy, 150) * 0.75 + noise(wx, wy, 46) * 0.25;
        ctx.fillStyle = P[Math.min(3, Math.floor(n * 4.2))];
        ctx.fillRect(X + sx * 16, Y + sy * 16, 17, 17);
      }
    // pontinhos e estações do desenho de antes, sem a cor chapada por cima
    return gBase.call(this, noFill(th), X, Y, h);
  };

  /* ----- a borda entre a grama e o caminho ----- */
  const PATHS = new Set([",", "="]);
  const GRASSY = new Set(["vila", "bosque", "serra", "picos", "pantano", "porto"]);
  const dtBase = drawTile;
  drawTile = function (z, x, y, c, t) {
    // tapa a fresta de meio pixel entre ladrilhos quando o zoom não é inteiro
    const Z0 = ZONES[z],
      th0 = Z0 && THEMES[Z0.theme];
    if (th0 && game.zoom % 1 !== 0) {
      const onPath = c === "," || (typeof ON_PATH !== "undefined" && ON_PATH.includes(c) && Z0.town);
      ctx.fillStyle = onPath ? "#a8916a" : c === "~" ? th0.water || th0.g1 : th0.g1;
      ctx.fillRect(x * TILE, y * TILE, TILE + 1, TILE + 1);
    }
    const r = dtBase.apply(this, arguments);
    const Z = ZONES[z];
    if (!Z || c !== "," || !GRASSY.has(Z.theme)) return r;
    if ((typeof inPlazaT === "function" && inPlazaT(z, x, y)) || (typeof inMarket === "function" && inMarket(z, x, y))) return r;
    const th = THEMES[Z.theme];
    if (!th) return r;
    const X = x * TILE,
      Y = y * TILE;
    const P = shades(th);
    // manchas suaves e marcas de roda no próprio caminho
    // variação contínua em pedaços de 8px: sem quadrado de ladrilho aparecendo
    for (let sy = 0; sy < 4; sy++)
      for (let sx = 0; sx < 4; sx++) {
        const n = noise(X + sx * 8 + 4, Y + sy * 8 + 4, 110) - 0.5;
        const a = Math.round(Math.abs(n) * 20) / 100;
        if (a < 0.02) continue;
        ctx.fillStyle = n > 0 ? `rgba(70,50,30,${a})` : `rgba(255,240,200,${a * 0.7})`;
        ctx.fillRect(X + sx * 8, Y + sy * 8, 8, 8);
      }
    const nb = (dx, dy) => {
      const q = tileAt(z, x + dx, y + dy);
      return q === "." || q === "g" || q === "w";
    };
    const grassAt = (wx, wy) => P[Math.min(3, Math.floor((noise(wx, wy, 150) * 0.75 + noise(wx, wy, 46) * 0.25) * 4.2))];
    // grama que invade a borda + uma linha de terra mais escura logo depois
    const edge = (horiz, side) => {
      for (let i = 0; i < TILE; i += 4) {
        const wx = horiz ? X + i : side < 0 ? X : X + TILE,
          wy = horiz ? (side < 0 ? Y : Y + TILE) : Y + i;
        const d = 2 + Math.floor(hsh(wx, wy) * 5);
        ctx.fillStyle = grassAt(wx, wy);
        if (horiz) ctx.fillRect(X + i, side < 0 ? Y : Y + TILE - d, 4, d);
        else ctx.fillRect(side < 0 ? X : X + TILE - d, Y + i, d, 4);
        ctx.fillStyle = "rgba(60,40,22,.28)";
        if (horiz) ctx.fillRect(X + i, side < 0 ? Y + d : Y + TILE - d - 1, 4, 1);
        else ctx.fillRect(side < 0 ? X + d : X + TILE - d - 1, Y + i, 1, 4);
        if (hsh(wx + 3, wy + 7) > 0.8) ((ctx.fillStyle = "#8a7a62"), horiz ? ctx.fillRect(X + i + 1, side < 0 ? Y + d + 2 : Y + TILE - d - 4, 2, 2) : ctx.fillRect(side < 0 ? X + d + 2 : X + TILE - d - 4, Y + i + 1, 2, 2));
      }
    };
    if (nb(0, -1)) edge(true, -1);
    if (nb(0, 1)) edge(true, 1);
    if (nb(-1, 0)) edge(false, -1);
    if (nb(1, 0)) edge(false, 1);
    // cantinhos arredondados onde duas bordas se encontram
    ctx.fillStyle = grassAt(X, Y);
    if (nb(-1, 0) && nb(0, -1)) ctx.fillRect(X, Y, 7, 7);
    if (nb(1, 0) && nb(0, -1)) ctx.fillRect(X + TILE - 7, Y, 7, 7);
    if (nb(-1, 0) && nb(0, 1)) ctx.fillRect(X, Y + TILE - 7, 7, 7);
    if (nb(1, 0) && nb(0, 1)) ctx.fillRect(X + TILE - 7, Y + TILE - 7, 7, 7);
    return r;
  };
})();
