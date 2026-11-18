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
  for (let y = 1; y < H - 1; y++) if (m0[y][52] === "~" && m0[y][53] === "~") rows.push(y);
  const bridge = new Set();
  for (let y = 1; y < H - 1; y++) for (let x = 48; x <= 57; x++) if (m0[y][x] === "=") (bridge.add(y), bridge.add(y - 1), bridge.add(y + 1), bridge.add(y - 2), bridge.add(y + 2));
  const SOFT = ".,wTu";
  for (const amp of [1.7, 1.1, 0.6]) {
    const m = m0.map((r) => r.slice());
    for (const y of rows) {
      if (bridge.has(y)) continue;
      const o = Math.round(amp * Math.sin(y / 4.6) + amp * 0.45 * Math.sin(y / 2.3 + 1.3));
      const w = 2 + (Math.sin(y / 3.1 + 0.7) > 0.35 ? 1 : 0);
      const a = 52 + o,
        b = a + w - 1;
      // o canal novo inteiro precisa caber no chão livre; senão a linha fica como era
      let fits = a >= 49 && b <= 56;
      for (let x = a; x <= b && fits; x++) if (!(SOFT.includes(m[y][x]) || m[y][x] === "~")) fits = false;
      if (!fits) continue;
      // a margem velha vira grama; o canal novo vira água
      for (const x of [52, 53]) if (x < a || x > b) m[y][x] = ".";
      for (let x = a; x <= b; x++) m[y][x] = "~";
    }
    // o rio não pode ficar cortado: cada linha precisa encostar na de cima
    let cont = true;
    for (const y of rows) {
      if (!rows.includes(y - 1)) continue;
      let touch = false;
      for (let x = 48; x <= 57; x++) if (m[y][x] === "~" && (m[y - 1][x] === "~" || m[y - 1][x] === "=")) touch = true;
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
    dtBase.apply(this, arguments);
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
