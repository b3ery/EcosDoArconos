/**
 * ECOS DO ARCANO — campos-e-matas.js
 * O que sobrou de grama vazia nas cidades vira paisagem de verdade:
 *  - FAZENDAS: roças cercadas (trigo, repolho, abóbora... por fileira), com
 *    porteira, caminho de 2 blocos até a rua, espantalho e carrinho de mão;
 *  - BOSQUES: matas fechadas com árvores em grupos naturais, flores e
 *    cogumelos no chão (dá para atravessar andando entre as árvores);
 *  - nas cidades de terra fria, pinheiros; nas de praia, coqueiros (o
 *    desenho da árvore segue o tema de cada terra).
 * Tudo é passável (árvore e plantação são decoração); a cerca fecha a roça
 * e só a porteira abre. Roda depois de preencher-mapas.js.
 */

"use strict";

(() => {
  const zones = Object.keys(ZONES).filter((z) => ["vila", "porto", "serra", "solmar", "rosalva"].includes(z) || z.startsWith("pais-"));
  const PROPS = (window.FARM_PROPS = window.FARM_PROPS || {});
  const hs = (a, b) => ((((a * 73856093) ^ (b * 19349663)) >>> 0) % 1000) / 1000;
  let made = 0;
  for (const zid of zones) {
    const Z = ZONES[zid];
    if (!Z || !Z.town || !Z.map) continue;
    const W = Z.w,
      H = Z.h;
    const m = Z.map.map((r) => r.split(""));
    const used = new Set();
    for (const b of Z.town.bld) {
      if (b.plan) for (const k of Object.keys(b.plan)) used.add(k);
      for (let y = b.y - 2; y < b.y + b.h + 2; y++) for (let x = b.x - 2; x < b.x + b.w + 2; x++) used.add(x + "," + y);
    }
    const C = window.COMMUNITY_LOTS && COMMUNITY_LOTS[zid];
    const PR = ((window.FILLED_AREAS = window.FILLED_AREAS || {})[zid] = window.FILLED_AREAS[zid] || new Set());
    for (const k in Z.npcs || {}) used.add(k);
    for (const o of Object.values(Z.open || {})) if (o && typeof o[0] === "number") for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) used.add(o[0] + dx + "," + (o[1] + dy));
    if (Z.town.arrive) for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) used.add(Z.town.arrive[0] + dx + "," + (Z.town.arrive[1] + dy));
    const free = (x, y) => x > 1 && y > 1 && x < W - 2 && y < H - 2 && m[y][x] === "." && !used.has(x + "," + y) && !(C && C.has(x + "," + y)) && !PR.has(x + "," + y);
    const sum = Array.from({ length: H + 1 }, () => new Int32Array(W + 1));
    const rebuild = () => {
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) sum[y + 1][x + 1] = (free(x, y) ? 1 : 0) + sum[y][x + 1] + sum[y + 1][x] - sum[y][x];
    };
    const allFree = (x, y, w, h) => x >= 1 && y >= 1 && x + w < W && y + h < H && sum[y + h][x + w] - sum[y][x + w] - sum[y + h][x] + sum[y][x] === w * h;
    const road = (x, y) => m[y] && ",=".includes(m[y][x]);
    // caminho de 2 até a rua mais perto, saindo do meio de um lado
    function pathOut(R) {
      const midX = (R.x0 + R.x1) >> 1,
        midY = (R.y0 + R.y1) >> 1;
      let best = null;
      for (const [dx, dy, sx, sy] of [[0, 1, midX, R.y1], [0, -1, midX, R.y0], [1, 0, R.x1, midY], [-1, 0, R.x0, midY]])
        for (let d = 1; d < 28; d++) {
          const x = sx + dx * d,
            y = sy + dy * d;
          if (!m[y] || x <= 1 || x >= W - 2 || y <= 1 || y >= H - 2) break;
          if (road(x, y) && road(x + (dy ? 1 : 0), y + (dx ? 1 : 0))) {
            if (!best || d < best.d) best = { dx, dy, sx, sy, d };
            break;
          }
          if (!".T".includes(m[y][x]) || !".T".includes(m[y + (dx ? 1 : 0)][x + (dy ? 1 : 0)])) break;
        }
      return best;
    }
    const spots = [];
    for (const [w, h] of [[22, 12], [18, 10], [14, 9], [12, 8]]) {
      rebuild();
      for (let y = 2; y + h + 2 < H && spots.length < 10; y++)
        for (let x = 2; x + w + 2 < W && spots.length < 10; x++) {
          if (!allFree(x - 1, y - 1, w + 2, h + 2)) continue;
          const R = { x0: x, y0: y, x1: x + w - 1, y1: y + h - 1 };
          spots.push(R);
          for (let yy = y - 1; yy <= y + h; yy++) for (let xx = x - 1; xx <= x + w; xx++) used.add(xx + "," + yy);
          rebuild();
        }
    }
    const P = (PROPS[zid] = PROPS[zid] || new Map());
    spots.forEach((R, i) => {
      for (let y = R.y0; y <= R.y1; y++) for (let x = R.x0; x <= R.x1; x++) PR.add(x + "," + y);
      const out = pathOut(R);
      const farm = out && i % 3 !== 2; // de cada 3: duas roças e um bosque
      if (farm) {
        // cerca em volta, fileiras de plantação, caminho do meio
        for (let y = R.y0; y <= R.y1; y++)
          for (let x = R.x0; x <= R.x1; x++) {
            const edge = x === R.x0 || x === R.x1 || y === R.y0 || y === R.y1;
            m[y][x] = edge ? "f" : (y - R.y0) % 3 === 0 ? "." : "g";
          }
        const crop = ["trigo", "repolho", "abobora", "milho"][Math.floor(hs(R.x0, R.y0 + i) * 4)];
        P.set("crop:" + R.x0 + "," + R.y0, { R, crop });
        // porteira (2 blocos) e, por dentro, um carreiro de grama entre as fileiras
        const g = out.dy ? [[out.sx, out.sy], [out.sx + 1, out.sy]] : [[out.sx, out.sy], [out.sx, out.sy + 1]];
        const GATES = (window.FARM_GATES = window.FARM_GATES || new Set());
        for (const [x, y] of g) ((m[y][x] = ","), GATES.add(zid + ":" + x + "," + y));
        if (out.dy)
          for (let y = R.y0 + 1; y < R.y1; y++) for (const x of [out.sx, out.sx + 1]) m[y][x] = ".";
        else for (let x = R.x0 + 1; x < R.x1; x++) for (const y of [out.sy, out.sy + 1]) m[y][x] = ".";
        for (let d = 1; d < out.d; d++)
          for (const k of [0, 1]) {
            const x = out.sx + out.dx * d + (out.dy ? k : 0),
              y = out.sy + out.dy * d + (out.dx ? k : 0);
            if (".T".includes(m[y][x])) m[y][x] = ",";
          }
        // espantalho e carrinho de mão (decoração)
        P.set(R.x0 + 3 + "," + (R.y0 + 2), "espantalho");
        P.set(R.x1 - 3 + "," + (R.y1 - 2), "carrinho");
      } else {
        // bosque: árvores em grupos (ruído), flores e cogumelos, trilha atravessando
        for (let y = R.y0; y <= R.y1; y++)
          for (let x = R.x0; x <= R.x1; x++) {
            const n = hs(x * 3, y * 5) * 0.6 + hs(Math.floor(x / 3), Math.floor(y / 3)) * 0.4;
            if (n > 0.55) m[y][x] = "T";
            else if (n > 0.47) m[y][x] = "w";
            else if (n < 0.06) P.set(x + "," + y, "cogumelo");
          }
        // (sem trilha de terra: árvore e flor são passáveis, dá para atravessar o bosque andando)
      }
      made++;
    });
    Z.map = m.map((r) => r.join(""));
  }
  window.FIELDS_MADE = made;

  /* ----- desenho: plantação por tipo, espantalho, carrinho e cogumelos ----- */
  const CROP = {
    trigo: (X, Y, t, x) => {
      for (let i = 0; i < 4; i++) {
        const sx = X + 4 + i * 7,
          sw = Math.sin(t * 1.5 + x + i) * 1.2;
        ctx.fillStyle = "#c9a040";
        ctx.fillRect(sx + sw, Y + 8, 2, 18);
        ctx.fillStyle = "#e8c45a";
        ctx.fillRect(sx - 1 + sw, Y + 4, 4, 7);
      }
    },
    repolho: (X, Y) => {
      for (const [ox, oy] of [[6, 10], [20, 18]]) {
        ctx.fillStyle = "#4a8a3a";
        ctx.beginPath();
        ctx.arc(X + ox, Y + oy, 6, 0, 7);
        ctx.fill();
        ctx.fillStyle = "#8ac860";
        ctx.beginPath();
        ctx.arc(X + ox - 1, Y + oy - 1, 3, 0, 7);
        ctx.fill();
      }
    },
    abobora: (X, Y) => {
      ctx.fillStyle = "#3a6a2a";
      ctx.fillRect(X + 2, Y + 18, 28, 2);
      for (const ox of [8, 22]) {
        ctx.fillStyle = "#e07a1a";
        ctx.beginPath();
        ctx.ellipse(X + ox, Y + 18, 6, 5, 0, 0, 7);
        ctx.fill();
        ctx.fillStyle = "#b85a10";
        ctx.fillRect(X + ox - 1, Y + 13, 2, 10);
        ctx.fillStyle = "#4a7a2a";
        ctx.fillRect(X + ox - 1, Y + 11, 2, 3);
      }
    },
    milho: (X, Y, t, x) => {
      for (let i = 0; i < 3; i++) {
        const sx = X + 6 + i * 9,
          sw = Math.sin(t * 1.2 + x + i) * 1;
        ctx.fillStyle = "#4a8a2a";
        ctx.fillRect(sx + sw, Y - 2, 2, 28);
        ctx.fillRect(sx + sw - 4, Y + 8, 4, 2);
        ctx.fillRect(sx + sw + 2, Y + 14, 4, 2);
        ctx.fillStyle = "#f0c840";
        ctx.fillRect(sx + sw + 2, Y + 4, 3, 6);
      }
    },
  };
  const cropAt = (z, x, y) => {
    const P = PROPS[z];
    if (!P) return null;
    for (const [k, v] of P) if (k.startsWith("crop:") && x > v.R.x0 && x < v.R.x1 && y > v.R.y0 && y < v.R.y1) return v.crop;
    return null;
  };
  const cache = {};
  const dtBase = drawTile;
  drawTile = function (z, x, y, c, t) {
    const P = PROPS[z];
    if (P && c === "g") {
      const key = z + ":" + x + "," + y;
      if (!(key in cache)) cache[key] = cropAt(z, x, y);
      const cr = cache[key];
      if (cr) {
        // chão de terra arada e a planta
        const r = dtBase.call(this, z, x, y, ".", t);
        const X = x * TILE,
          Y = y * TILE;
        ctx.fillStyle = "#7a5a34";
        ctx.fillRect(X, Y + 4, TILE, TILE - 6);
        ctx.fillStyle = "#6a4a28";
        ctx.fillRect(X, Y + 12, TILE, 2);
        ctx.fillRect(X, Y + 22, TILE, 2);
        CROP[cr](X, Y, t, x);
        return r;
      }
    }
    const r = dtBase.apply(this, arguments);
    if (!P) return r;
    const k = P.get(x + "," + y);
    if (!k || typeof k !== "string") return r;
    const X = x * TILE,
      Y = y * TILE;
    if (k === "espantalho") {
      ctx.fillStyle = "#5a3a1c";
      ctx.fillRect(X + 15, Y - 6, 3, 34);
      ctx.fillRect(X + 4, Y + 4, 24, 3);
      ctx.fillStyle = "#8a3a2a";
      ctx.fillRect(X + 10, Y + 6, 13, 12);
      ctx.fillStyle = "#e8c45a";
      ctx.fillRect(X + 4, Y + 6, 4, 6);
      ctx.fillRect(X + 25, Y + 6, 4, 6);
      ctx.fillStyle = "#e8d8a0";
      ctx.beginPath();
      ctx.arc(X + 16, Y - 2, 6, 0, 7);
      ctx.fill();
      ctx.fillStyle = "#3a2a1a";
      ctx.fillRect(X + 13, Y - 3, 2, 2);
      ctx.fillRect(X + 18, Y - 3, 2, 2);
      ctx.fillStyle = "#6a4a28";
      ctx.fillRect(X + 7, Y - 9, 18, 3);
      ctx.fillRect(X + 11, Y - 14, 10, 6);
    } else if (k === "carrinho") {
      ctx.fillStyle = "#6b4423";
      ctx.fillRect(X + 4, Y + 12, 20, 10);
      ctx.fillStyle = "#e8c45a";
      ctx.fillRect(X + 6, Y + 8, 16, 5);
      ctx.fillStyle = "#3a2414";
      ctx.beginPath();
      ctx.arc(X + 8, Y + 25, 4, 0, 7);
      ctx.fill();
      ctx.fillRect(X + 22, Y + 16, 8, 2);
    } else if (k === "cogumelo") {
      ctx.fillStyle = "#e8e0d0";
      ctx.fillRect(X + 13, Y + 20, 3, 6);
      ctx.fillStyle = "#c0392b";
      ctx.beginPath();
      ctx.ellipse(X + 14.5, Y + 20, 6, 4, 0, Math.PI, 0);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.fillRect(X + 12, Y + 17, 2, 2);
      ctx.fillRect(X + 16, Y + 18, 1, 1);
    }
    return r;
  };
})();
