/**
 * ECOS DO ARCANO — rio-vivo.js
 * O rio de Cinzaluz deixa de ser um canal reto: ele serpenteia (curvas
 * suaves, alarga e estreita), a correnteza desce de verdade (mapa.js faz
 * as linhas de água andarem no sentido do rio) e as margens ganham taboas,
 * capim alto e pedras redondas, como nos rios de pixel art de referência.
 * As pontes continuam no mesmo lugar, e a curva só acontece onde não fecha
 * o caminho de ninguém (o jogo confere todas as portas antes de aceitar).
 * Também troca o quadrado azul das fontes pequenas das outras cidades por
 * um chafariz redondo de pedra.
 * Modifica (envolve) drawTile.
 */

"use strict";

(() => {
  const Z = ZONES.vila;
  if (!Z) return;
  const C0 = typeof VILA_X === "function" ? VILA_X(52) : 52; // coluna do rio (o mapa cresceu dos dois lados)
  const W = Z.w,
    H = Z.h;
  const PASS = new Set(".,PEL=gwubxhnkqAozYVZtRp".split(""));
  function reach(m) {
    const start = Z.town.arrive;
    const D = new Uint8Array(W * H);
    const q = [start[1] * W + start[0]];
    D[q[0]] = 1;
    for (let i = 0; i < q.length; i++) {
      const p = q[i],
        x = p % W,
        y = (p / W) | 0;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx,
          ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
        const k = ny * W + nx;
        if (D[k] || !PASS.has(m[ny][nx])) continue;
        D[k] = 1;
        q.push(k);
      }
    }
    return D;
  }
  const goals = [];
  for (const b of Z.town.bld) for (const dx of b.door) goals.push([dx, b.y + b.h]);
  for (const k in Z.npcs || {}) {
    const [x, y] = k.split(",").map(Number);
    goals.push([x, y + 1]);
  }
  const m0 = Z.map.map((r) => r.split(""));
  const R0 = reach(m0);
  const ok = (m) => {
    const R = reach(m);
    return goals.every(([x, y]) => !R0[y * W + x] || R[y * W + x]);
  };
  // linhas do canal reto (x 52-53), e as linhas de ponte que ficam como estão
  const rows = [];
  for (let y = 1; y < H - 1; y++) if (m0[y][C0] === "~" && m0[y][C0 + 1] === "~") rows.push(y);
  const bridge = new Set();
  for (let y = 1; y < H - 1; y++) for (let x = C0 - 5; x <= C0 + 6; x++) if (m0[y][x] === "=") (bridge.add(y), bridge.add(y - 1), bridge.add(y + 1), bridge.add(y - 2), bridge.add(y + 2));
  const SOFT = ".,wTu";
  // curva SUAVE: o deslocamento do canal muda no máximo 1 tile a cada 2 linhas
  // (nada de saltos); se uma linha não cabe, ela fica onde está e as vizinhas
  // se ajustam aos poucos até ela.
  const fitsAt = (m, y, a, w) => {
    if (a < C0 - 3 || a + w - 1 > C0 + 4) return false;
    for (let x = a; x < a + w; x++) if (!(SOFT.includes(m[y][x]) || m[y][x] === "~")) return false;
    return true;
  };
  for (const amp of [2, 1.4, 1]) {
    const m = m0.map((r) => r.slice());
    const want = {};
    for (const y of rows) want[y] = bridge.has(y) ? 0 : Math.round(amp * Math.sin(y / 6.5) + amp * 0.4 * Math.sin(y / 3.4 + 1.3));
    // passa de cima para baixo e de baixo para cima limitando o passo
    const off = {};
    let prev = 0,
      hold = 0;
    for (const y of rows) {
      let o = want[y];
      if (o > prev && hold >= 1) o = prev + 1;
      else if (o < prev && hold >= 1) o = prev - 1;
      else o = prev;
      if (!fitsAt(m, y, C0 + o, 2) || bridge.has(y)) o = bridge.has(y) ? 0 : fitsAt(m, y, C0 + prev, 2) ? prev : 0;
      hold = o === prev ? hold + 1 : 0;
      off[y] = prev = o;
    }
    for (const y of rows.slice().reverse()) {
      const nb = off[y + 1];
      if (nb != null && Math.abs(off[y] - nb) > 1) off[y] = nb + Math.sign(off[y] - nb);
      if (!fitsAt(m, y, C0 + off[y], 2)) off[y] = 0;
    }
    for (const y of rows) {
      const o = off[y];
      // fica um tile mais largo onde dá (o rio "respira")
      const wide = Math.sin(y / 4.1 + 0.7) > 0.4 && fitsAt(m, y, C0 + o, 3);
      const w = wide ? 3 : 2;
      for (const x of [C0, C0 + 1]) if (x < C0 + o || x > C0 + o + w - 1) m[y][x] = ".";
      for (let x = C0 + o; x < C0 + o + w; x++) m[y][x] = "~";
    }
    let cont = true;
    for (const y of rows) {
      if (!rows.includes(y - 1)) continue;
      let touch = false;
      for (let x = C0 - 5; x <= C0 + 6; x++) if (m[y][x] === "~" && (m[y - 1][x] === "~" || m[y - 1][x] === "=")) touch = true;
      if (!touch && !bridge.has(y)) cont = false;
    }
    if (cont && ok(m)) {
      Z.map = m.map((r) => r.join(""));
      break;
    }
  }

  // margens: taboas, capim alto e pedras nas beiradas de grama do rio
  const hsh = (x, y) => {
    const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
    return s - Math.floor(s);
  };
  const isW = (z, x, y) => {
    const c = tileAt(z, x, y);
    return c === "~";
  };
  /* RIO DE VERDADE: a margem não segue os quadradinhos. Em cada linha o jogo
     sabe onde ficam as duas margens e, entre uma linha e a outra, a margem é
     interpolada suave (curva em S); fora dela vai o chão, dentro a água.
     A água fica mais escura no meio (fundo) e clara e esverdeada no raso,
     com areia molhada e espuma na beira e a correnteza descendo. */
  const RIV = {};
  for (let y = 1; y < Z.h - 1; y++) {
    const row = Z.map[y];
    let l = -1,
      r = -1;
    for (let x = C0 - 6; x <= C0 + 7; x++)
      if (row[x] === "~") {
        if (l < 0) l = x;
        r = x;
      }
    if (l >= 0 && r - l <= 5) {
      // respiro: se tem construção (ou cerca) colada no rio, a água recua e
      // sobra uma faixa de margem de grama entre o rio e a parede
      const solid = (c) => "HDf".includes(c || "");
      const near = (dir) => {
        const x1 = dir < 0 ? l - 1 : r + 1,
          x2 = dir < 0 ? l - 2 : r + 2;
        const rows = [Z.map[y - 1] || "", row, Z.map[y + 1] || ""];
        if (rows.some((q) => solid(q[x1]))) return 12;
        if (rows.some((q) => solid(q[x2]))) return 6;
        return 0;
      };
      const iL = near(-1),
        iR = near(1);
      // não deixa o rio ficar fino demais
      const maxIn = (r - l + 1) * TILE - 40;
      const k = iL + iR > maxIn ? maxIn / (iL + iR) : 1;
      RIV[y] = [l * TILE + iL * k, (r + 1) * TILE - iR * k, iL ? "." : row[l - 1], iR ? "." : row[r + 1], iL, iR];
    }
  }
  const smooth = (u) => u * u * (3 - 2 * u);
  const bankAt = (y, py) => {
    const me = RIV[y];
    const ny = py < TILE / 2 ? y - 1 : y + 1;
    const nb = RIV[ny] || me;
    const u = smooth(Math.abs(py - TILE / 2) / (TILE / 2)) * 0.5;
    return [me[0] + (nb[0] - me[0]) * u, me[1] + (nb[1] - me[1]) * u];
  };
  const lerp3 = (a, b, f) => a.map((v, i) => Math.round(v + (b[i] - v) * f));
  const SHALLOW = [128, 176, 170],
    MIDW = [58, 126, 182],
    DEEPW = [30, 76, 134];
  function riverTile(z, x, y, c, t) {
    const me = RIV[y];
    if (!me || c === "=" || c === "H" || c === "D") return false;
    const X = x * TILE,
      Y = y * TILE;
    // este tile encosta no rio (dentro ou logo ao lado)?
    if (X + TILE < me[0] - TILE || X > me[1] + TILE) return false;
    const land = c === "~" ? (X < (me[0] + me[1]) / 2 ? me[2] : me[3]) || "," : c;
    // 1) o chão do tile por baixo de tudo
    dtBase.call(this, z, x, y, c === "~" ? (",.".includes(land) ? land : ",") : c, t);
    // 1b) a margem de grama do respiro (entre a parede e a água)
    if (c === "~")
      for (let py = 0; py < TILE; py += 2) {
        const [L, R] = bankAt(y, py + 1);
        if (me[4] && L > X) ((ctx.fillStyle = (py >> 2) % 2 ? "#5a8a3e" : "#6a9a46"), ctx.fillRect(X, Y + py, Math.min(TILE, L - X), 3));
        if (me[5] && R < X + TILE) ((ctx.fillStyle = (py >> 2) % 2 ? "#5a8a3e" : "#6a9a46"), ctx.fillRect(Math.max(X, R), Y + py, X + TILE - Math.max(X, R), 3));
      }
    if (c === "~" && (me[4] || me[5]) && (x + y) % 3 === 0) {
      const bx = me[4] ? Math.max(X, me[0] - 10) : Math.min(X + TILE - 6, me[1] + 2);
      for (let i = 0; i < 3; i++) ((ctx.fillStyle = i % 2 ? "#3d7432" : "#4a8a3a"), ctx.fillRect(bx + i * 3, Y + 8 + (i % 2) * 4, 2, 14));
    }
    // 2) a água, faixa por faixa de 2px de altura, entre as margens interpoladas
    for (let py = 0; py < TILE; py += 2) {
      const [L, R] = bankAt(y, py + 1);
      const a0 = Math.max(X, Math.round(L / 2) * 2),
        b0 = Math.min(X + TILE, Math.round(R / 2) * 2);
      if (b0 <= a0) continue;
      // uma faixa só por linha, com degradê do raso ao fundo (sem emendas)
      const gr = ctx.createLinearGradient(L, 0, R, 0);
      gr.addColorStop(0, "rgb(128,176,170)");
      gr.addColorStop(0.22, "rgb(58,126,182)");
      gr.addColorStop(0.5, "rgb(30,76,134)");
      gr.addColorStop(0.78, "rgb(58,126,182)");
      gr.addColorStop(1, "rgb(128,176,170)");
      ctx.fillStyle = gr;
      ctx.fillRect(a0, Y + py, b0 - a0, py === TILE - 2 ? 2 : 3); // 1px de sobra tapa a emenda entre as faixas
      // beira: areia molhada, espuma e sombra da margem
      for (const [ex, dir] of [[L, 1], [R, -1]]) {
        if (ex < X - 1 || ex > X + TILE + 1) continue;
        ctx.fillStyle = "rgba(190,164,112,.85)";
        ctx.fillRect(dir > 0 ? ex - 3 : ex, Y + py, 3, 2);
        ctx.fillStyle = ((py + y * 7 + ((t * 10) | 0)) % 12) < 6 ? "rgba(255,255,255,.7)" : "rgba(220,240,250,.35)";
        ctx.fillRect(dir > 0 ? ex : ex - 2, Y + py, 2, 2);
        ctx.fillStyle = "rgba(20,50,40,.22)";
        ctx.fillRect(dir > 0 ? ex + 2 : ex - 5, Y + py, 3, 2);
      }
    }
    // 3) correnteza: risquinhos descendo no meio do rio, e um brilho de sol
    for (let i = 0; i < 3; i++) {
      const [L, R] = bankAt(y, 16);
      const lane = L + 6 + ((x * 7 + i * 11) % Math.max(4, R - L - 12));
      if (lane < X || lane >= X + TILE) continue;
      const p = (t * 34 + i * 13 + x * 17) % (TILE + 12);
      ctx.fillStyle = i === 0 ? "rgba(255,255,255,.45)" : "rgba(200,232,248,.35)";
      ctx.fillRect(lane, Y + p - 12, 2, 7);
    }
    if (c === "~" && ((t * 1.5 + x * 3 + y * 7) | 0) % 9 === 0) ((ctx.fillStyle = "rgba(255,255,255,.8)"), ctx.fillRect(X + 10 + ((x * 5) % 12), Y + ((t * 30) % 28), 3, 2));
    return true;
  }
  const dtBase = drawTile;
  drawTile = function (z, x, y, c, t) {
    const zone = ZONES[z];
    // chafariz redondo nas outras cidades (no lugar do quadrado azul)
    if (c === "F" && z !== "vila" && zone && zone.theme === "vila") {
      dtBase.call(this, z, x, y, ",", t);
      const X = x * TILE,
        Y = y * TILE;
      ctx.fillStyle = "rgba(0,0,0,.22)";
      ctx.beginPath();
      ctx.ellipse(X + 18, Y + 24, 16, 6, 0, 0, 7);
      ctx.fill();
      ctx.fillStyle = "#8a847a";
      ctx.beginPath();
      ctx.ellipse(X + 16, Y + 20, 16, 9, 0, 0, 7);
      ctx.fill();
      ctx.fillStyle = "#d6cfc0";
      ctx.beginPath();
      ctx.ellipse(X + 16, Y + 18, 15, 8, 0, 0, 7);
      ctx.fill();
      ctx.fillStyle = "#4f9be0";
      ctx.beginPath();
      ctx.ellipse(X + 16, Y + 18, 11, 5.5, 0, 0, 7);
      ctx.fill();
      ctx.fillStyle = "#a39d92";
      ctx.fillRect(X + 14, Y + 6, 4, 12);
      ctx.fillStyle = "#e2dccd";
      ctx.fillRect(X + 11, Y + 5, 10, 3);
      ctx.fillStyle = "rgba(225,245,255,.85)";
      const k = (t * 2) % 1;
      ctx.fillRect(X + 15, Y - 2 + k * 2, 2, 6);
      ctx.fillRect(X + 10 - k * 3, Y + 7 + k * 8, 1, 3);
      ctx.fillRect(X + 21 + k * 3, Y + 7 + k * 8, 1, 3);
      return;
    }
    if (z === "vila" && riverTile.call(this, z, x, y, c, t)) {
      if (c === "~") return;
    } else dtBase.apply(this, arguments);
    if (c !== "." || !zone || zone.theme === "porto" || !(zone.town || zone.theme === "vila")) return;
    const l = isW(z, x - 1, y),
      r = isW(z, x + 1, y),
      u = isW(z, x, y - 1),
      d = isW(z, x, y + 1);
    if (!(l || r || u || d)) return;
    const h = hsh(x, y);
    if (h < 0.35) return;
    const X = x * TILE,
      Y = y * TILE;
    const ex = l ? X + 2 : r ? X + TILE - 12 : X + 6 + h * 14; // encostado na água
    if (h < 0.62) {
      // taboas (as "salsichas" marrons) e folhas compridas balançando
      for (let i = 0; i < 4; i++) {
        const sx = ex + i * 3,
          sway = Math.sin(t * 1.6 + x + i) * 1.2;
        ctx.fillStyle = i % 2 ? "#4a7a32" : "#5a8a3a";
        ctx.fillRect(Math.round(sx + sway), Y + 10 + (i % 2) * 3, 2, 18 - (i % 2) * 3);
        if (i % 2 === 0) ((ctx.fillStyle = "#6b4423"), ctx.fillRect(Math.round(sx + sway), Y + 7, 2, 6));
      }
    } else if (h < 0.82) {
      // pedras redondas da margem
      for (const [ox, oy, rr] of [[0, 18, 5], [7, 22, 4], [3, 25, 3]]) {
        ctx.fillStyle = "rgba(0,0,0,.18)";
        ctx.beginPath();
        ctx.ellipse(ex + ox + 1, Y + oy + 2, rr, rr * 0.6, 0, 0, 7);
        ctx.fill();
        ctx.fillStyle = "#8a8478";
        ctx.beginPath();
        ctx.ellipse(ex + ox, Y + oy, rr, rr * 0.7, 0, 0, 7);
        ctx.fill();
        ctx.fillStyle = "#b0aa9c";
        ctx.fillRect(Math.round(ex + ox - rr * 0.4), Math.round(Y + oy - rr * 0.4), 2, 2);
      }
    } else {
      // capim alto
      for (let i = 0; i < 6; i++) {
        ctx.fillStyle = i % 2 ? "#3d6a2e" : "#5a8a3a";
        ctx.fillRect(Math.round(ex + i * 2 + Math.sin(t * 2 + i) * 0.8), Y + 16 + (i % 3) * 2, 1, 12 - (i % 3) * 2);
      }
    }
  };
})();
