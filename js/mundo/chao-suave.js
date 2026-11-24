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

  // Textura do chão: 512x512 texels de 2px (1024px de mundo), ruído que se
  // repete sem emenda e pontilhado Bayer 4x4 entre 4 tons. Desenhada uma vez
  // por tema e só copiada depois.
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => v / 16 - 0.5);
  const pnoise = (x, y, P) => {
    const x0 = Math.floor(x),
      y0 = Math.floor(y);
    const fx = sm(x - x0),
      fy = sm(y - y0);
    const g = (a, b) => hsh(((a % P) + P) % P, ((b % P) + P) % P);
    const a = g(x0, y0),
      b = g(x0 + 1, y0),
      c = g(x0, y0 + 1),
      d = g(x0 + 1, y0 + 1);
    return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
  };
  const TEX = new Map();
  function texture(th) {
    const k = th.g1 + th.g2;
    if (TEX.has(k)) return TEX.get(k);
    const N = 512,
      cv = document.createElement("canvas");
    cv.width = cv.height = N;
    const g = cv.getContext("2d"),
      img = g.createImageData(N, N),
      D = img.data;
    const P = shades(th).map(rgb);
    for (let y = 0; y < N; y++)
      for (let x = 0; x < N; x++) {
        const v = pnoise(x / 64, y / 64, 8) * 0.6 + pnoise(x / 24, y / 24, N / 24 | 0 || 21) * 0.25 + pnoise(x / 8, y / 8, 64) * 0.15;
        const q = Math.max(0, Math.min(3, Math.round(v * 3.4 - 0.2 + BAYER[(y & 3) * 4 + (x & 3)] * 0.9)));
        const c = P[q],
          i = (y * N + x) * 4;
        D[i] = c[0];
        D[i + 1] = c[1];
        D[i + 2] = c[2];
        D[i + 3] = 255;
      }
    g.putImageData(img, 0, 0);
    TEX.set(k, cv);
    return cv;
  }
  const gBase = ground;
  ground = function (th, X, Y, h) {
    if (!th || !th.g1 || !th.g2) return gBase.apply(this, arguments);
    const P = shades(th);
    const T = texture(th);
    const sx = (((X >> 1) % 512) + 512) % 512,
      sy = (((Y >> 1) % 512) + 512) % 512;
    const smo = ctx.imageSmoothingEnabled;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(T, sx, sy, 16, 16, X, Y, TILE + 0.5, TILE + 0.5);
    ctx.imageSmoothingEnabled = smo;
    // flores só onde há "campina" (canteiros naturais); fora delas, nada de
    // pontinho espalhado: o desenho de antes recebe um h baixo
    const meadow = noise(X + 16, Y + 16, 110) > 0.64;
    const r = gBase.call(this, noFill(th), X, Y, meadow ? h : 0.2);
    // tufos de grama: riscos de 1px agrupados, topo claro, base escura
    if (th === THEMES.vila || th === THEMES.bosque || th.g1 === (THEMES.vila && THEMES.vila.g1)) {
      const dens = noise(X + 7, Y + 3, 60);
      if (dens > 0.45)
        for (let k = 0; k < 2; k++) {
          const tx = X + 3 + Math.floor(hsh(X + k * 11, Y) * 24),
            ty = Y + 6 + Math.floor(hsh(X, Y + k * 13) * 20);
          ctx.fillStyle = P[0];
          ctx.fillRect(tx - 1, ty + 4, 6, 1);
          for (let b = 0; b < 3; b++) {
            const hgt = 3 + ((b + k) % 2) * 2;
            ctx.fillStyle = P[0];
            ctx.fillRect(tx + b * 2, ty + 5 - hgt, 1, hgt);
            ctx.fillStyle = P[3];
            ctx.fillRect(tx + b * 2, ty + 5 - hgt, 1, 1);
          }
        }
    }
    return r;
  };

  /* ----- a borda entre a grama e o caminho ----- */
  const PATHS = new Set([",", "="]);
  const GRASSY = new Set(["vila", "bosque", "serra", "picos", "pantano", "porto"]);
  const dtBase = drawTile;
  drawTile = function (z, x, y, c, t) {
    // borda do mapa encostada no mar: o mar continua, sem muro
    if (c === "#") {
      const Zb = ZONES[z];
      if (Zb && Zb.town) {
        let wet = false;
        for (const [dx, dy] of [[0, -1], [0, 1], [-1, 0], [1, 0], [-1, -1], [1, -1], [-1, 1], [1, 1]]) if (tileAt(z, x + dx, y + dy) === "~") wet = true;
        if (wet) return dtBase.call(this, z, x, y, "~", t);
      }
    }
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
    if (Z && c === "~") shore(z, x, y, Z);
    if (Z && c === "=") plank(z, x, y, t);
    if (Z && Z.town && !Z.town.indoor) croftTile(z, x, y, Z, t);
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

  /* ----- margens orgânicas: rio e lago com forma de verdade ----- */
  const WET = new Set(["~", "=", "F"]);
  function landColor(Z, q, wx, wy) {
    if (q === "," || (typeof ON_PATH !== "undefined" && ON_PATH.includes(q) && Z.town)) return "#a8916a";
    const th = THEMES[Z.theme];
    return th && th.g1 ? shades(th)[Math.min(3, Math.floor((noise(wx, wy, 150) * 0.75 + noise(wx, wy, 46) * 0.25) * 4.2))] : "#6c8f4e";
  }
  function shore(z, x, y, Z) {
    const X = x * TILE,
      Y = y * TILE;
    const land = (dx, dy) => {
      const q = tileAt(z, x + dx, y + dy);
      return q !== null && q !== "#" && !WET.has(q) ? q : null;
    };
    const nearLand = [[0, -1], [0, 1], [-1, 0], [1, 0], [-1, -1], [1, -1], [-1, 1], [1, 1]].some(([dx, dy]) => land(dx, dy));
    // água funda no meio fica mais escura
    if (!nearLand) ((ctx.fillStyle = "rgba(10,40,80,.22)"), ctx.fillRect(X, Y, TILE, TILE));
    const sides = [[0, -1], [0, 1], [-1, 0], [1, 0]];
    for (const [dx, dy] of sides) {
      const q = land(dx, dy);
      if (!q) continue;
      const horiz = dy !== 0;
      for (let i = 0; i < TILE; i++) {
        const wx = horiz ? X + i : dx < 0 ? X : X + TILE,
          wy = horiz ? (dy < 0 ? Y : Y + TILE) : Y + i;
        // curva suave (ruído largo), sem serrilhado
        const d = Math.round(2 + noise(wx, wy, 70) * 7);
        const put = (o, len, col) => {
          ctx.fillStyle = col;
          if (horiz) ctx.fillRect(X + i, dy < 0 ? Y + o : Y + TILE - o - len, 1, len);
          else ctx.fillRect(dx < 0 ? X + o : X + TILE - o - len, Y + i, len, 1);
        };
        put(0, d, landColor(Z, q, wx, wy)); // terra avançando
        put(d - 2 < 0 ? 0 : d - 2, 2, q === "," ? "#9a8256" : "#c9b88a"); // faixa de areia/terra molhada
        put(d, 1, "rgba(60,44,26,.45)"); // barranco
        put(d + 1, 6, "rgba(150,215,235,.32)"); // água rasa, clara
        if ((i + Math.floor(performance.now() / 300)) % 9 < 6) put(d + 1, 1, "rgba(235,248,255,.7)"); // espuma fina
      }
      // ondas da praia: a espuma sobe na areia e volta, devagar
      if (Z.theme === "porto" && q !== "," && q !== "#") {
        const ph = performance.now() / 1000;
        for (let i = 0; i < TILE; i += 2) {
          const wx = horiz ? X + i : X,
            wy = horiz ? Y : Y + i;
          const d = Math.round(2 + noise(wx, wy, 70) * 7);
          const reach = Math.round(3 + Math.sin(ph * 1.3 + (wx + wy) * 0.02) * 3); // vai e volta
          const len = 2;
          ctx.fillStyle = "rgba(245,252,255,.85)";
          const o = Math.max(0, d - reach);
          if (horiz) ctx.fillRect(X + i, dy < 0 ? Y + o : Y + TILE - o - len, 2, len);
          else ctx.fillRect(dx < 0 ? X + o : X + TILE - o - len, Y + i, len, 2);
          ctx.fillStyle = "rgba(120,180,210,.35)"; // areia molhada que a onda deixa
          if (horiz) ctx.fillRect(X + i, dy < 0 ? Y + Math.max(0, o - 3) : Y + TILE - o, 2, 3);
          else ctx.fillRect(dx < 0 ? X + Math.max(0, o - 3) : X + TILE - o, Y + i, 3, 2);
        }
        // uma segunda onda chegando, mais longe
        const w2 = 8 + Math.round(((ph * 4 + x * 3) % 10));
        ctx.fillStyle = "rgba(235,248,255,.45)";
        if (horiz) ctx.fillRect(X + 2, dy < 0 ? Y + w2 : Y + TILE - w2 - 1, TILE - 4, 1);
        else ctx.fillRect(dx < 0 ? X + w2 : X + TILE - w2 - 1, Y + 2, 1, TILE - 4);
      }
      // pedrinhas no fundo raso
      for (let k = 0; k < 2; k++) {
        const h2 = noise(X + k * 13 + dx * 5, Y + k * 7 + dy * 5, 9);
        const o = 10 + Math.floor(h2 * 4),
          p2 = 4 + Math.floor(h2 * 22);
        ctx.fillStyle = "rgba(120,130,120,.5)";
        if (horiz) ctx.fillRect(X + p2, dy < 0 ? Y + o : Y + TILE - o - 2, 3, 2);
        else ctx.fillRect(dx < 0 ? X + o : X + TILE - o - 3, Y + p2, 2, 3);
      }
    }
    // cantos arredondados (curva de 10px) onde a margem dobra
    const corner = (qa, qb, sx, sy) => {
      if (!qa || !qb) return;
      ctx.fillStyle = landColor(Z, qa, X + (sx > 0 ? TILE : 0), Y + (sy > 0 ? TILE : 0));
      for (let k = 0; k < 11; k++) {
        const w = Math.round(11 - Math.sqrt(Math.max(0, 121 - (11 - k) * (11 - k))));
        ctx.fillRect(sx < 0 ? X : X + TILE - w, sy < 0 ? Y + k : Y + TILE - 1 - k, w, 1);
      }
    };
    // curva por dentro: terra só na diagonal vira uma pontinha redonda
    const inner = (q, sx, sy) => {
      if (!q) return;
      ctx.fillStyle = landColor(Z, q, X + (sx > 0 ? TILE : 0), Y + (sy > 0 ? TILE : 0));
      for (let k = 0; k < 6; k++) {
        const w = Math.round(Math.sqrt(36 - k * k));
        ctx.fillRect(sx < 0 ? X : X + TILE - w, sy < 0 ? Y + k : Y + TILE - 1 - k, w, 1);
      }
      ctx.fillStyle = "rgba(235,248,255,.6)";
      ctx.fillRect(sx < 0 ? X + 6 : X + TILE - 7, sy < 0 ? Y + 1 : Y + TILE - 2, 1, 1);
    };
    if (!land(-1, 0) && !land(0, -1)) inner(land(-1, -1), -1, -1);
    if (!land(1, 0) && !land(0, -1)) inner(land(1, -1), 1, -1);
    if (!land(-1, 0) && !land(0, 1)) inner(land(-1, 1), -1, 1);
    if (!land(1, 0) && !land(0, 1)) inner(land(1, 1), 1, 1);
    corner(land(-1, 0), land(0, -1), -1, -1);
    corner(land(1, 0), land(0, -1), 1, -1);
    corner(land(-1, 0), land(0, 1), -1, 1);
    corner(land(1, 0), land(0, 1), 1, 1);
  }

  /* ----- árvores: copa em camadas, borda irregular, tamanhos variados ----- */
  const TREE = {
    pri: [["#1f4a26", "#2e6a32", "#4a8a3e", "#7ab04a"], "#f2b8d0"],
    ver: [["#1d3f22", "#2a5a2e", "#3e7a3a", "#62a04a"], null],
    out: [["#6a2a10", "#9a4a1a", "#c97a2a", "#e8a84a"], null],
    inv: [["#1f3a2e", "#2a4a3a", "#3d5e4a", "#5a7a62"], null],
  };
  function tree(X, Y, h, t, edge) {
    const sid = typeof season === "function" ? season().id : "ver";
    const [C, bloom] = TREE[sid] || TREE.ver;
    const s = 0.82 + h * 0.4; // tamanho
    const ox = edge ? Math.round((hsh(X, Y + 1) - 0.5) * 10) : 0,
      oy = edge ? Math.round((hsh(X + 5, Y) - 0.5) * 8) : 0;
    const cx = X + 16 + ox,
      cy = Y + 12 + oy;
    const sway = Math.sin(t * 0.8 + h * 9) * 0.6;
    // sombra no chão
    ctx.fillStyle = "rgba(0,0,0,.22)";
    ctx.beginPath();
    ctx.ellipse(cx + 2, Y + 29 + oy * 0.3, 12 * s, 4 * s, 0, 0, 7);
    ctx.fill();
    // tronco com raiz
    ctx.fillStyle = "#4a3020";
    ctx.fillRect(cx - 3, cy + 4, 6, 14 * s);
    ctx.fillStyle = "#3a2418";
    ctx.fillRect(cx - 5, cy + 4 + 14 * s - 2, 3, 2);
    ctx.fillRect(cx + 2, cy + 4 + 14 * s - 2, 3, 2);
    ctx.fillStyle = "#5e3e28";
    ctx.fillRect(cx - 2, cy + 6, 1, 10 * s);
    // copa: círculos sobrepostos, do escuro (embaixo) ao claro (em cima à esquerda)
    const blob = (dx, dy, r, col) => ((ctx.fillStyle = col), circle(cx + dx * s + sway, cy + dy * s, r * s));
    blob(0, 2, 13, C[0]);
    blob(-6, 0, 9, C[0]);
    blob(6, 1, 9, C[0]);
    blob(-2, -3, 11, C[1]);
    blob(5, -2, 8, C[1]);
    blob(-6, -5, 7, C[2]);
    blob(2, -7, 7, C[2]);
    blob(-5, -8, 3.5, C[3]);
    blob(1, -10, 2.5, C[3]);
    // borda irregular: pixels soltos para fora da silhueta
    ctx.fillStyle = C[0];
    for (let k = 0; k < 7; k++) {
      const a = k * 0.9 + h * 6;
      ctx.fillRect(Math.round(cx + Math.cos(a) * 14 * s + sway), Math.round(cy + 1 + Math.sin(a) * 12 * s), 2, 2);
    }
    ctx.fillStyle = "rgba(0,0,0,.18)";
    ctx.fillRect(Math.round(cx - 10 * s), Math.round(cy + 10 * s), Math.round(20 * s), 2);
    if (bloom && h > 0.55) for (let k = 0; k < 4; k++) ((ctx.fillStyle = bloom), ctx.fillRect(Math.round(cx - 8 + hsh(X + k, Y) * 16), Math.round(cy - 6 + hsh(X, Y + k) * 12), 2, 2));
    if (sid === "inv") ((ctx.fillStyle = "#f2f6fa"), ctx.beginPath(), ctx.ellipse(cx - 1, cy - 8 * s, 9 * s, 3.5 * s, 0, 0, 7), ctx.fill());
  }
  function bush(X, Y, h) {
    const sid = typeof season === "function" ? season().id : "ver";
    const C = (TREE[sid] || TREE.ver)[0];
    ctx.fillStyle = "rgba(0,0,0,.2)";
    ctx.beginPath();
    ctx.ellipse(X + 16, Y + 28, 11, 3, 0, 0, 7);
    ctx.fill();
    ctx.fillStyle = C[0];
    circle(X + 11, Y + 22, 7);
    circle(X + 21, Y + 22, 7);
    ctx.fillStyle = C[1];
    circle(X + 15, Y + 18, 7);
    ctx.fillStyle = C[2];
    circle(X + 13, Y + 16, 3);
    if (h > 0.7) ((ctx.fillStyle = "#c94a5a"), ctx.fillRect(X + 18, Y + 19, 2, 2), ctx.fillRect(X + 10, Y + 21, 2, 2));
  }
  const dwBase = drawWall;
  drawWall = function (theme, X, Y, h, t) {
    if (theme !== "bosque") return dwBase.apply(this, arguments);
    // borda da mata: uma árvore, ou um arbusto, nunca a mesma em fila
    const edge = true;
    const pick = hsh(X >> 5, Y >> 5);
    if (pick < 0.22) return bush(X, Y, h);
    return tree(X, Y, hsh(X + 3, Y + 9), t, edge);
  };

  /* ----- pontes e píeres de madeira ----- */
  function plank(z, x, y, t) {
    const X = x * TILE,
      Y = y * TILE;
    const q = (dx, dy) => tileAt(z, x + dx, y + dy);
    const water = (c) => c === "~" || c === null;
    const wood = (c) => c === "=";
    // ponte atravessa de lado (rio em pé) ou píer entra no mar (de pé)
    // o sentido da ponte é o lado em que ela é mais comprida
    const run = (dx, dy) => {
      let n = 0;
      for (let k = 1; k <= 6 && wood(q(dx * k, dy * k)); k++) n++;
      return n;
    };
    const hr = run(-1, 0) + run(1, 0),
      vr = run(0, -1) + run(0, 1);
    const horiz = hr !== vr ? hr > vr : (!water(q(-1, 0)) || wood(q(-1, 0))) && (!water(q(1, 0)) || wood(q(1, 0)));
    const R = (a, b, w, h, col) => ((ctx.fillStyle = col), ctx.fillRect(X + a, Y + b, w, h));
    // água por baixo e a sombra do tabuleiro
    R(0, 0, TILE, TILE, "#3f86c7");
    R(horiz ? 0 : 3, horiz ? 3 : 0, horiz ? TILE : 28, horiz ? 28 : TILE, "rgba(10,30,60,.35)");
    const tone = (i) => ["#9a6a3a", "#8a5e32", "#a8784a", "#93643a"][(i + x * 3 + y) % 4];
    // ponte de 2 ou mais blocos de largura é UMA ponte só: corrimão só nas bordas de fora
    const wU = wood(q(0, -1)),
      wD = wood(q(0, 1)),
      wL = wood(q(-1, 0)),
      wR = wood(q(1, 0));
    if (horiz) {
      const t0 = wU ? 0 : 4,
        t1 = wD ? TILE : 26;
      // tábuas atravessadas (no sentido da correnteza), uma por uma
      for (let i = 0; i < 8; i++) {
        R(i * 4, t0, 4, t1 - t0, tone(i));
        R(i * 4, t0, 1, t1 - t0, "#6b4423");
        if ((i + x) % 3 === 0) R(i * 4 + 2, 14, 1, 1, "#4a2e17");
      }
      // vigas e corrimão com postes (só do lado de fora)
      if (!wU) (R(0, 4, TILE, 2, "#5a3a1e"), R(0, 0, TILE, 2, "#7a4f2a"));
      if (!wD) (R(0, 24, TILE, 2, "#5a3a1e"), R(0, 28, TILE, 2, "#7a4f2a"));
      for (const px of [2, 26]) {
        if (!wU) (R(px, -2, 4, 8, "#5a3a1e"), R(px + 1, -2, 1, 7, "#8a5e32"));
        if (!wD) R(px, 24, 4, 8, "#5a3a1e");
      }
    } else {
      const l0 = wL ? 0 : 4,
        l1 = wR ? TILE : 28;
      // píer: tábuas no comprimento, estacas na água e uma corda
      for (let i = 0; i < 8; i++) {
        R(l0, i * 4, l1 - l0, 4, tone(i));
        R(l0, i * 4, l1 - l0, 1, "#6b4423");
        if ((i + y) % 3 === 0) R(15, i * 4 + 2, 1, 1, "#4a2e17");
      }
      if (!wL) R(4, 0, 2, TILE, "#5a3a1e");
      if (!wR) R(26, 0, 2, TILE, "#5a3a1e");
      for (const [px, dx] of [[0, -1], [28, 1]]) if (!wood(q(dx, 0))) (R(px, 10, 4, 12, "#4a2e17"), R(px + 1, 10, 1, 11, "#6b4423"), R(px - 1, 21, 6, 2, "rgba(200,230,255,.5)"));
      if (y % 2 === 0 && !wood(q(-1, 0))) {
        ctx.strokeStyle = "#c9b080";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(X + 2, Y + 12);
        ctx.quadraticCurveTo(X + 2, Y + 30, X + 2, Y + 44);
        ctx.stroke();
      }
    }
  }


  /* ----- o lote de cada casa (burgage/toft & croft) -----
     Referência: nas vilas medievais cada casa ficava num lote estreito de
     frente para a rua; nos fundos, uma faixa comprida dividida do vizinho por
     cerca. Perto da casa, o terreiro (poço, lenha, galpão, bichos); depois a
     horta; no fundo, a roça, o pomar ou o chiqueiro. */
  const HOMES = new Set(["casa", "casa2", "home", "pousada"]);
  const CROFT = new Map();
  function crofts(z, Z) {
    if (CROFT.has(z)) return CROFT.get(z);
    const M = new Map();
    const free = (x, y) => Z.map[y] && Z.map[y][x] === "." && !M.has(x + "," + y);
    for (const b of Z.town.bld.concat(Z.town.extraPlans || [])) {
      if (b.plan) {
        for (const [k, kind] of Object.entries(b.plan)) M.set(k, { part: kind, b, plan: true });
        continue;
      }
      if (!HOMES.has(b.style) || b.small || (b.name && !/^Casa|Sítio|Fazenda|Mansão/.test(b.name))) continue;
      const hb = hsh(b.x * 7, b.y * 3 + z.length);
      const back = hb < 0.5 ? "porco" : hb < 0.75 ? "pomar" : "galinhas";
      const garden = hsh(b.x, b.y) < 0.5 ? "horta" : "milho";
      let rows = 0;
      for (let dy = 1; dy <= (b.depth || 4); dy++) {
        const y = b.y - dy;
        let ok = true;
        for (let x = b.x; x < b.x + b.w; x++) if (!free(x, y)) ok = false;
        if (!ok) break;
        rows = dy;
      }
      if (!rows) continue;
      for (let dy = 1; dy <= rows; dy++)
        for (let x = b.x; x < b.x + b.w; x++) {
          // perto da casa: terreiro; no meio: horta; no fundo: bichos/pomar
          const part = dy === 1 ? "terreiro" : dy === rows && rows >= 3 ? back : garden;
          M.set(x + "," + (b.y - dy), { part, b, dy, rows, left: x === b.x, right: x === b.x + b.w - 1, far: dy === rows, i: x - b.x });
        }
    }
    CROFT.set(z, M);
    return M;
  }
  function croftTile(z, x, y, Z, t) {
    const C = crofts(z, Z).get(x + "," + y);
    if (!C) return;
    const X = x * TILE,
      Y = y * TILE;
    const R = (a, b, w, h, col) => ((ctx.fillStyle = col), ctx.fillRect(X + a, Y + b, w, h));
    const k = C.part;
    if (C.plan) return planTile(k, X, Y, R, x, y, t, C);
    if (k === "terreiro") {
      // terra batida, com o que a família usa todo dia
      R(0, 0, TILE, TILE, "#9a8258");
      for (let i = 0; i < 4; i++) R(3 + ((i * 11 + x * 5) % 26), 5 + ((i * 7 + y * 3) % 22), 2, 1, "#7a6542");
      const w = C.b.w;
      if (C.i === 0 && w >= 3) {
        // poço de pedra pequeno
        R(6, 12, 20, 14, "#8f897d");
        R(6, 12, 20, 3, "#b8b2a4");
        R(9, 14, 14, 3, "#2a5a8a");
        R(8, 2, 2, 12, "#6b4423");
        R(22, 2, 2, 12, "#6b4423");
        R(6, 1, 20, 3, "#8c3b2e");
      } else if (C.i === w - 1) {
        // galpão de tábuas com telhadinho
        R(3, 8, 26, 20, "#7a5a32");
        for (let i = 0; i < 6; i++) R(3 + i * 5, 8, 1, 20, "#5a3a1e");
        R(1, 4, 30, 6, "#5a4a3a");
        R(12, 16, 8, 12, "#4a2e17");
      } else if (C.i === 1) {
        // lenha empilhada e um machado no toco
        for (let r = 0; r < 3; r++) for (let c = 0; c < 4 - r; c++) (R(3 + c * 6 + r * 3, 22 - r * 5, 5, 5, "#7a5a32"), R(4 + c * 6 + r * 3, 23 - r * 5, 2, 2, "#c9a06a"));
        R(22, 20, 7, 6, "#6b4a2a");
        R(25, 14, 1, 7, "#8a6a3a");
        R(23, 14, 4, 2, "#9a9aa0");
      } else {
        // varal com roupa
        R(2, 6, 1, 20, "#6b4423");
        R(29, 6, 1, 20, "#6b4423");
        R(2, 8, 28, 1, "#c9b080");
        for (let i = 0; i < 3; i++) R(6 + i * 8, 9, 6, 8, ["#e8e0d0", "#c94a5a", "#5a7ab0"][(i + x) % 3]);
      }
    } else if (k === "horta" || k === "milho") {
      R(0, 0, TILE, TILE, "#6b4a2a");
      for (let r = 0; r < 4; r++) R(0, 6 + r * 8, TILE, 2, "#5a3a1e");
      for (let r = 0; r < 4; r++)
        for (let c = 0; c < 4; c++) {
          const cx = 2 + c * 8 + (r % 2) * 3,
            cy = 1 + r * 8;
          if (k === "horta") (R(cx, cy, 5, 4, ["#4a8a3a", "#6aa84a", "#8a4a8a"][(r + c + x) % 3]), R(cx + 1, cy, 3, 1, "#9ad06a"));
          else (R(cx + 2, cy - 3, 1, 8, "#5a8a2a"), R(cx, cy, 2, 1, "#7aa83a"), R(cx + 3, cy + 1, 2, 1, "#7aa83a"), R(cx + 1, cy - 3, 2, 2, "#e8c04a"));
        }
    } else if (k === "pomar") {
      if ((x + y) % 2 === 0) {
        ctx.fillStyle = "rgba(0,0,0,.2)";
        ctx.beginPath();
        ctx.ellipse(X + 16, Y + 27, 9, 3, 0, 0, 7);
        ctx.fill();
        R(15, 14, 3, 12, "#5a3a1e");
        ctx.fillStyle = "#2e6a32";
        circle(X + 16, Y + 12, 9);
        ctx.fillStyle = "#4a8a3e";
        circle(X + 13, Y + 9, 5);
        for (let i = 0; i < 4; i++) R(9 + ((i * 7 + x) % 14), 6 + ((i * 5 + y) % 10), 3, 3, (x + i) % 2 ? "#e0403a" : "#f2a83a");
      }
    } else {
      R(0, 0, TILE, TILE, "#8a7350");
      const ph = t * (k === "galinhas" ? 3 : 0.8) + x * 1.7 + y;
      const mx = Math.round(Math.sin(ph * 0.5) * 5),
        my = Math.round(Math.cos(ph * 0.3) * 3);
      if (k === "galinhas" && (x + y) % 2 === 0)
        for (let c = 0; c < 2; c++) {
          const ox = 6 + c * 12 + mx * (c ? -1 : 1),
            oy = 12 + my,
            peck = Math.sin(ph * 2 + c) > 0.6 ? 2 : 0;
          R(ox, oy, 8, 6, "#f6f2ea");
          R(ox + 6, oy - 3 + peck, 4, 4, "#f6f2ea");
          R(ox + 7, oy - 4 + peck, 2, 1, "#e03a3a");
          R(ox + 10, oy - 2 + peck, 2, 1, "#f2a020");
          R(ox + 2, oy + 6, 1, 2, "#f2a020");
          R(ox + 5, oy + 6, 1, 2, "#f2a020");
        }
      if (k === "porco") {
        if (C.i === 0) (R(2, 6, 14, 12, "#7a5a32"), R(2, 4, 14, 3, "#5a4a3a"));
        if ((x + y) % 2 === 0) (R(9 + mx, 14, 16, 9, "#f2a8b0"), R(23 + mx, 15, 5, 6, "#f2a8b0"), R(27 + mx, 17, 2, 3, "#e08890"), R(25 + mx, 16, 1, 1, "#1a1a1a"), R(10 + mx, 23, 2, 3, "#e08890"), R(21 + mx, 23, 2, 3, "#e08890"));
        R(18, 26, 12, 4, "#6a5030");
      }
    }
    // cercas: dividem do vizinho (lados) e fecham o fundo; a casa é a frente
    const rail = "#7a4f2a",
      postC = "#8a5e32";
    if (C.left) (R(0, 0, 2, TILE, rail), R(0, 4, 3, 5, postC), R(0, 20, 3, 5, postC));
    if (C.right) (R(30, 0, 2, TILE, rail), R(29, 4, 3, 5, postC), R(29, 20, 3, 5, postC));
    if (C.far) (R(0, 1, TILE, 2, rail), R(0, 5, TILE, 2, rail), R(2, -2, 3, 10, postC), R(17, -2, 3, 10, postC));
    if (k !== "terreiro" && C.dy === 2) R(0, TILE - 2, TILE, 2, "rgba(60,40,20,.35)");
  }

  /* ----- o quintal planejado (Bairro dos Lotes) ----- */
  const shadow = (X, Y, w) => ((ctx.fillStyle = "rgba(0,0,0,.22)"), ctx.beginPath(), ctx.ellipse(X + 16, Y + 28, w, 3, 0, 0, 7), ctx.fill());
  function planTile(k, X, Y, R, x, y, t, C) {
    const night = typeof nightAlpha === "function" && nightAlpha() > 0.25;
    switch (k) {
      case "grama":
      case "gramado":
        // grama aparada do lote, um pouco mais clara que a de fora
        R(0, 0, 32, 32, "rgba(140,190,90,.18)");
        if ((x + y) % 4 === 0) (R(8, 18, 1, 4, "#4a7a32"), R(10, 17, 1, 5, "#4a7a32"), R(12, 19, 1, 3, "#4a7a32"));
        break;
      case "flores":
        R(2, 6, 28, 22, "#5a7a3a");
        for (let i = 0; i < 8; i++) (R(4 + (i % 4) * 7, 8 + Math.floor(i / 4) * 10, 2, 6, "#3a6a2a"), R(3 + (i % 4) * 7, 6 + Math.floor(i / 4) * 10, 4, 4, ["#e86a8a", "#f2c14e", "#f6f2ea", "#b48aff"][(i + x + y) % 4]));
        R(1, 27, 30, 2, "#9a9488");
        break;
      case "lama":
        R(0, 0, 32, 32, "#7a6448");
        for (let i = 0; i < 5; i++) R(3 + ((i * 11 + x * 7) % 26), 4 + ((i * 7 + y * 3) % 24), 4, 2, "#5a4a32");
        if ((x + y) % 3 === 0) ((ctx.fillStyle = "rgba(60,48,30,.6)"), ctx.beginPath(), ctx.ellipse(X + 16, Y + 20, 10, 4, 0, 0, 7), ctx.fill());
        break;
      case "caixotes":
        R(0, 0, 32, 32, "#7a6448");
        shadow(X, Y, 12);
        R(5, 12, 12, 14, "#8a6a3a");
        R(5, 12, 12, 2, "#a8844e");
        R(5, 18, 12, 1, "#5a3a1e");
        R(17, 16, 10, 10, "#7a5a32");
        R(18, 18, 8, 3, "#c9a050");
        break;
      case "placa":
        R(14, 10, 3, 18, "#5a3a1e");
        R(5, 6, 22, 10, "#8a5e32");
        R(6, 7, 20, 8, "#a8784a");
        R(8, 10, 16, 1, "#4a2e17");
        R(8, 12, 12, 1, "#4a2e17");
        break;
      case "ervas":
        R(2, 4, 28, 24, "#5a3a1e");
        R(3, 5, 26, 22, "#6b4a2a");
        for (let i = 0; i < 6; i++) (R(5 + (i % 3) * 9, 7 + Math.floor(i / 3) * 10, 6, 7, ["#6aa84a", "#8ac05a", "#5a9a7a"][i % 3]), R(7 + (i % 3) * 9, 6 + Math.floor(i / 3) * 10, 2, 2, i % 2 ? "#b48aff" : "#f6f2ea"));
        break;
      case "horta":
        R(0, 2, 32, 28, "#6b4a2a");
        for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) (R(2 + c * 8, 4 + r * 9, 5, 5, ["#4a8a3a", "#6aa84a", "#8a4a8a"][(r + c + x) % 3]), R(3 + c * 8, 4 + r * 9, 3, 1, "#9ad06a"));
        break;
      case "porao":
        // alçapão de madeira com batente de pedra, encostado na casa
        R(4, 8, 24, 20, "#7a7468");
        R(6, 10, 20, 16, "#5a3a1e");
        R(6, 10, 9, 16, "#7a4f2a");
        R(17, 10, 9, 16, "#7a4f2a");
        for (const yy of [13, 22]) R(6, yy, 20, 2, "#3a3a3a");
        R(13, 17, 2, 2, "#c9a040");
        R(17, 17, 2, 2, "#c9a040");
        break;
      case "lenha":
        shadow(X, Y, 12);
        for (let r = 0; r < 3; r++) for (let c = 0; c < 4 - r; c++) (R(3 + c * 6 + r * 3, 20 - r * 5, 5, 5, "#7a5a32"), R(4 + c * 6 + r * 3, 21 - r * 5, 2, 2, "#c9a06a"));
        R(23, 20, 7, 7, "#6b4a2a");
        R(26, 13, 1, 8, "#8a6a3a");
        R(24, 13, 4, 2, "#9a9aa0");
        break;
      case "banco":
        shadow(X, Y, 13);
        R(5, 12, 22, 4, "#8a5e32");
        R(5, 12, 22, 1, "#a8784a");
        R(7, 16, 3, 9, "#5a3a1e");
        R(22, 16, 3, 9, "#5a3a1e");
        R(3, 22, 26, 3, "#7a4f2a");
        R(11, 9, 4, 3, "#b8693a"); // caneco de barro
        R(18, 10, 5, 2, "#e8d8b0");
        break;
      case "varal":
        R(2, 4, 2, 24, "#6b4423");
        R(28, 4, 2, 24, "#6b4423");
        R(2, 6, 28, 1, "#c9b080");
        for (let i = 0; i < 3; i++) R(6 + i * 8, 7, 6, 9 + (i % 2) * 2, ["#e8e0d0", "#c94a5a", "#5a7ab0"][(i + x) % 3]);
        break;
      case "latrina":
        // casinha estreita de tábuas com a lua na porta, no fundo do terreno
        shadow(X, Y, 9);
        R(8, 4, 16, 24, "#7a5a32");
        for (let i = 0; i < 4; i++) R(8 + i * 4, 4, 1, 24, "#5a3a1e");
        R(6, 1, 20, 5, "#5a4a3a");
        R(12, 12, 8, 16, "#5a3a1e");
        ctx.fillStyle = "#f2e0a0";
        ctx.beginPath();
        ctx.arc(X + 16, Y + 9, 2.5, 0.6, 5.7);
        ctx.fill();
        break;
      case "colmeias":
        for (const ox of [3, 17]) {
          shadow(X + ox - 9, Y, 6);
          R(ox, 22, 12, 4, "#6b4423");
          for (let r = 0; r < 4; r++) R(ox + r, 10 + r * 3, 12 - r * 2, 3, r % 2 ? "#c9a24a" : "#d9b45a");
          R(ox + 5, 20, 2, 2, "#3a2414");
        }
        for (let i = 0; i < 4; i++) R(6 + ((t * 30 + i * 17) % 22), 4 + Math.sin(t * 6 + i) * 3, 2, 2, "#f2c14e");
        break;
      case "galpao":
        shadow(X, Y, 14);
        R(2, 8, 28, 20, "#7a5a32");
        for (let i = 0; i < 7; i++) R(2 + i * 4, 8, 1, 20, "#5a3a1e");
        R(0, 3, 32, 7, "#5a4a3a");
        R(11, 15, 10, 13, "#4a2e17");
        R(24, 14, 3, 12, "#8a8a96"); // ancinho encostado
        break;
      case "galinheiro":
        R(2, 14, 14, 13, "#8a5e32");
        R(1, 10, 16, 5, "#6b4423");
        R(7, 20, 4, 7, "#3a2414");
        for (let c = 0; c < 2; c++) {
          const ox = 18 + c * 6 + Math.round(Math.sin(t * 3 + c + x) * 2),
            peck = Math.sin(t * 5 + c) > 0.6 ? 2 : 0;
          R(ox, 20, 6, 5, "#f6f2ea");
          R(ox + 4, 17 + peck, 3, 3, "#f6f2ea");
          R(ox + 5, 16 + peck, 1, 1, "#e03a3a");
        }
        break;
      case "chiqueiro":
        R(1, 6, 30, 22, "#7a6040");
        R(1, 6, 30, 2, "#8a5e32");
        R(1, 26, 30, 2, "#8a5e32");
        const mx = Math.round(Math.sin(t * 0.8 + x) * 4);
        R(7 + mx, 14, 14, 8, "#f2a8b0");
        R(20 + mx, 15, 5, 5, "#f2a8b0");
        R(24 + mx, 16, 2, 2, "#e08890");
        R(22 + mx, 15, 1, 1, "#1a1a1a");
        R(4, 20, 8, 4, "#5a4a30");
        break;
      case "poco":
        shadow(X, Y, 13);
        R(5, 16, 22, 12, "#8f897d");
        R(5, 16, 22, 3, "#b8b2a4");
        R(8, 18, 16, 3, "#2a5a8a");
        R(6, 4, 2, 13, "#6b4423");
        R(24, 4, 2, 13, "#6b4423");
        R(4, 2, 24, 4, "#8c3b2e");
        R(15, 6, 1, 7, "#c9b080");
        R(13, 12, 5, 4, "#8a5a2e");
        break;
      case "forno":
        // forno de pão de barro (só mansão: era caro e perigoso ter um)
        shadow(X, Y, 14);
        ctx.fillStyle = "#b8693a";
        ctx.beginPath();
        ctx.arc(X + 16, Y + 22, 13, Math.PI, 0);
        ctx.fill();
        R(3, 22, 26, 6, "#9a5a32");
        R(11, 16, 10, 10, "#2a1a10");
        R(12, 20, 8, 5, night ? "#ff8a3a" : "#5a2a1a");
        R(22, 6, 4, 8, "#8a4a2a");
        break;
      case "pombal":
        shadow(X, Y, 8);
        R(14, 14, 4, 14, "#5a3a1e");
        R(8, 4, 16, 12, "#f2eee4");
        for (const ox of [10, 17]) R(ox, 8, 4, 4, "#3a2414");
        R(6, 1, 20, 4, "#8c3b2e");
        R(10 + Math.round(Math.sin(t * 2) * 6), 0, 3, 2, "#e8e8f0");
        break;
      case "lago": {
        // lago redondo de jardim: um só espelho d'água sobre todas as casas
        // "lago" do lote, com borda de pedra, ninfeias e peixes (cada tile
        // desenha só o seu pedaço, recortado)
        R(0, 0, 32, 32, "rgba(140,190,90,.18)");
        const B = C.b;
        if (!B._pond) {
          let x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1;
          for (const [kk, v] of Object.entries(B.plan)) if (v === "lago") {
            const [px, py] = kk.split(",").map(Number);
            (x0 = Math.min(x0, px)), (y0 = Math.min(y0, py)), (x1 = Math.max(x1, px)), (y1 = Math.max(y1, py));
          }
          B._pond = { cx: ((x0 + x1 + 1) / 2) * TILE, cy: ((y0 + y1 + 1) / 2) * TILE, r: (Math.min(x1 - x0 + 1, y1 - y0 + 1) * TILE) / 2 - 1, rx: ((x1 - x0 + 1) * TILE) / 2 - 3 };
        }
        const P = B._pond;
        const rx = Math.min(P.rx, P.r * 1.25),
          ry = P.r;
        ctx.save();
        ctx.beginPath();
        ctx.rect(X, Y, 32, 32);
        ctx.clip();
        const ell = (dx, dy, a, b2, c) => ((ctx.fillStyle = c), ctx.beginPath(), ctx.ellipse(P.cx + dx, P.cy + dy, a, b2, 0, 0, 7), ctx.fill());
        ell(2, 4, rx, ry, "rgba(0,0,0,.18)");
        ell(0, 0, rx, ry, "#8a8478"); // borda de pedra
        for (let i = 0; i < 18; i++) {
          const a2 = (i / 18) * Math.PI * 2;
          ctx.fillStyle = i % 2 ? "#a8a294" : "#6e695e";
          ctx.fillRect(Math.round(P.cx + Math.cos(a2) * (rx - 3) - 3), Math.round(P.cy + Math.sin(a2) * (ry - 3) - 2), 6, 4);
        }
        ell(0, 0, rx - 6, ry - 6, "#2f6fa8");
        ell(0, -2, rx - 9, ry - 10, "#3f86c7");
        ell(-rx * 0.3, -ry * 0.35, rx * 0.28, ry * 0.12, "rgba(255,255,255,.22)"); // reflexo
        // ninfeias e flor
        for (const [ox, oy] of [[-rx * 0.45, ry * 0.2], [rx * 0.4, -ry * 0.15], [rx * 0.1, ry * 0.45]]) (ell(ox, oy, 6, 4, "#3d8a3a"), ctx.fillStyle = "#2a6a2a", ctx.fillRect(Math.round(P.cx + ox), Math.round(P.cy + oy - 1), 6, 1));
        ctx.fillStyle = "#ff9ac8";
        ctx.fillRect(Math.round(P.cx + rx * 0.4 - 1), Math.round(P.cy - ry * 0.15 - 3), 3, 3);
        // peixes dando voltas
        for (let i = 0; i < 2; i++) {
          const a3 = t * (0.5 + i * 0.2) + i * 3;
          ctx.fillStyle = i ? "#f2f0e8" : "#f2a83a";
          ctx.fillRect(Math.round(P.cx + Math.cos(a3) * rx * 0.5), Math.round(P.cy + Math.sin(a3) * ry * 0.4), 5, 2);
        }
        ctx.restore();
        break;
      }
      case "pomar":
        shadow(X, Y, 10);
        R(15, 14, 3, 13, "#5a3a1e");
        ctx.fillStyle = "#2e6a32";
        circle(X + 16, Y + 11, 10);
        ctx.fillStyle = "#4a8a3e";
        circle(X + 13, Y + 8, 5);
        for (let i = 0; i < 4; i++) R(9 + ((i * 7 + x) % 14), 5 + ((i * 5 + y) % 11), 3, 3, i % 2 ? "#e0403a" : "#f2a83a");
        break;
    }
  }
})();
