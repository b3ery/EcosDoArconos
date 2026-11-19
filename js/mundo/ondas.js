/**
 * ECOS DO ARCANO — ondas.js
 * Mar com ondas de verdade (Porto, Solmar e os portos de além-mar):
 *  - o mar escurece conforme fica fundo (longe da praia);
 *  - as ondas nascem no fundo e andam até a praia, como faixas claras que
 *    vão ficando mais altas perto da areia;
 *  - na beira, a onda quebra: espuma branca que sobe na areia e volta
 *    (o "vai e vem"), deixando a areia molhada e brilhando.
 * Na tempestade o mar fica mais bravo (ondas maiores e mais rápidas).
 * Modifica (envolve) drawTile.
 */

"use strict";

(() => {
  const CACHE = {};
  const isSea = (z) => ZONES[z] && ZONES[z].town && ZONES[z].theme === "porto";
  // distância de cada água até a terra e para que lado fica a praia
  function field(z) {
    if (CACHE[z]) return CACHE[z];
    const Z = ZONES[z],
      W = Z.w,
      H = Z.h;
    const D = new Int16Array(W * H).fill(-1),
      DX = new Int8Array(W * H),
      DY = new Int8Array(W * H);
    const q = [];
    const land = (c) => c !== "~" && c !== "#" && c !== undefined && c !== "=";
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) {
        if (Z.map[y][x] !== "~") continue;
        for (const [dx, dy] of [[0, -1], [0, 1], [-1, 0], [1, 0]])
          if (land((Z.map[y + dy] || "")[x + dx])) {
            D[y * W + x] = 0;
            DX[y * W + x] = dx;
            DY[y * W + x] = dy;
            q.push(y * W + x);
            break;
          }
      }
    for (let i = 0; i < q.length; i++) {
      const p = q[i],
        x = p % W,
        y = (p / W) | 0;
      if (D[p] >= 8) continue;
      for (const [dx, dy] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) {
        const X = x + dx,
          Y = y + dy,
          k = Y * W + X;
        if (X < 0 || Y < 0 || X >= W || Y >= H || D[k] >= 0 || Z.map[Y][X] !== "~") continue;
        D[k] = D[p] + 1;
        DX[k] = DX[p];
        DY[k] = DY[p];
        q.push(k);
      }
    }
    return (CACHE[z] = { D, DX, DY, W });
  }

  const dtBase = drawTile;
  drawTile = function (z, x, y, c, t) {
    const r = dtBase.apply(this, arguments);
    if (c !== "~" || !isSea(z)) return r;
    const F = field(z),
      k = y * F.W + x,
      d = F.D[k] < 0 ? 9 : F.D[k],
      dx = F.DX[k],
      dy = F.DY[k];
    const X = x * TILE,
      Y = y * TILE;
    const rough = ["tempestade"].includes(player.weather) ? 1.8 : player.weather === "chuva" ? 1.3 : 1;
    // fundo: mais escuro longe da praia
    ctx.fillStyle = `rgba(8,28,70,${Math.min(0.32, d * 0.045)})`;
    ctx.fillRect(X, Y, TILE, TILE);
    if (d > 6 || (!dx && !dy)) return r;
    // posição ao longo da direção da praia (0 = beira, cresce para o fundo)
    const horiz = !!dy; // praia em cima/baixo: faixas horizontais
    const sub = 4;
    for (let s = 0; s < TILE; s += sub) {
      // distância "contínua" até a praia neste pedaço do bloco
      const frac = horiz ? (dy < 0 ? s / TILE : 1 - s / TILE) : dx < 0 ? s / TILE : 1 - s / TILE;
      const dd = d + frac;
      // a onda anda do fundo para a praia
      const ph = (dd * 0.5 + t * 0.32 * rough) % 1.6;
      const crest = Math.max(0, 1 - Math.abs(ph - 0.8) * 6);
      if (crest > 0) {
        const a = crest * (0.18 + Math.max(0, 0.32 - dd * 0.05)) * rough;
        ctx.fillStyle = `rgba(230,246,255,${a})`;
        if (horiz) ctx.fillRect(X, Y + s, TILE, sub);
        else ctx.fillRect(X + s, Y, sub, TILE);
      }
    }
    // beira: a onda quebra, a espuma sobe e volta
    if (d === 0) {
      const sw = (Math.sin(t * 1.1 * rough + (x + y) * 0.35) + 1) / 2; // 0..1 vai e vem
      const len = 6 + sw * 16;
      const ex = dx > 0 ? X + TILE - len : X,
        ey = dy > 0 ? Y + TILE - len : Y;
      const w = horiz ? TILE : len,
        h = horiz ? len : TILE;
      ctx.fillStyle = "rgba(255,255,255,.45)";
      ctx.fillRect(ex, ey, w, h);
      // bolhinhas da espuma
      ctx.fillStyle = "rgba(255,255,255,.85)";
      for (let i = 0; i < 6; i++) {
        const u = ((x * 17 + y * 13 + i * 29) % 100) / 100,
          v = ((x * 7 + i * 41 + ((t * 3) | 0)) % 100) / 100;
        const bx = horiz ? X + u * TILE : ex + v * len,
          by = horiz ? ey + v * len : Y + u * TILE;
        ctx.fillRect(bx, by, 2, 2);
      }
      // linha da quebra (a borda da espuma)
      ctx.fillStyle = "rgba(255,255,255,.9)";
      if (horiz) ctx.fillRect(X, dy > 0 ? ey : ey + len - 2, TILE, 2);
      else ctx.fillRect(dx > 0 ? ex : ex + len - 2, Y, 2, TILE);
    }
    return r;
  };
})();
