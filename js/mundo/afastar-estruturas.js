/**
 * ECOS DO ARCANO — afastar-estruturas.js
 * Respiro entre as estruturas em TODAS as cidades (vila, reinos e países):
 * duas construções lado a lado com menos de 2 tiles entre elas são
 * afastadas. A da direita anda para a direita (ou a da esquerda para a
 * esquerda) até ter 2 tiles de folga, só por cima de chão livre, sem mudar
 * a organização da rua. Se mexer prenderia alguma porta, desfaz.
 * Roda antes dos lotes do centro e dos lotes comunitários.
 */

"use strict";

(() => {
  const PASS = new Set(".,PEL=gwubxhnkqAozYVZtRp".split(""));
  const FREE = ".,";
  function reach(Z, m) {
    const W = Z.w,
      H = Z.h,
      seen = new Uint8Array(W * H);
    const st = Z.town.arrive || [1, 1];
    const q = [st[1] * W + st[0]];
    seen[q[0]] = 1;
    for (let i = 0; i < q.length; i++) {
      const p = q[i],
        x = p % W,
        y = (p / W) | 0;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx,
          ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= W || ny >= H || seen[ny * W + nx] || !PASS.has(m[ny][nx])) continue;
        seen[ny * W + nx] = 1;
        q.push(ny * W + nx);
      }
    }
    return seen;
  }
  function spread(zid) {
    const Z = ZONES[zid];
    if (!Z || !Z.town || !Z.town.bld || !Z.map) return 0;
    let m = Z.map.map((r) => r.split(""));
    const W = Z.w;
    const fixed = (b) => b.plan || b.lot || ["castle", "palacio", "fortaleza"].includes(b.style);
    const npcAt = (x, y) => Z.npcs && Z.npcs[x + "," + y];
    const stallAt = (x, y) => Z.town.stalls && Z.town.stalls[x + "," + y];
    const okDoors = () => {
      const R = reach(Z, m);
      return Z.town.bld.every((b) => b.door.every((dx) => R[(b.y + b.h) * W + dx] || !PASS.has((m[b.y + b.h] || "")[dx] || "#")));
    };
    // o chão de onde o prédio sai: o que tem logo ao lado na mesma linha
    const groundAt = (y, x) => (FREE.includes(m[y][x]) ? m[y][x] : ".");
    function tryMove(b, k) {
      // k > 0 anda para a direita; k < 0 para a esquerda
      const xs = k > 0 ? [b.x + b.w, b.x + b.w + k - 1 + 1] : [b.x + k - 1, b.x - 1];
      for (let y = b.y - 1; y <= b.y + b.h; y++)
        for (let x = Math.min(...xs); x <= Math.max(...xs); x++) {
          if (!m[y] || x <= 0 || x >= W - 1) return false;
          if (y >= b.y && y < b.y + b.h && !FREE.includes(m[y][x])) return false;
          if (npcAt(x, y) || stallAt(x, y)) return false;
          if (Z.town.bld.some((o) => o !== b && x >= o.x - 1 && x <= o.x + o.w && y >= o.y && y < o.y + o.h)) return false;
        }
      const save = m.map((r) => r.slice());
      const oldDoors = b.door.map((dx) => dx + "," + (b.y + b.h - 1));
      for (let y = b.y; y < b.y + b.h; y++) for (let x = b.x; x < b.x + b.w; x++) m[y][x] = groundAt(y, k > 0 ? b.x - 1 : b.x + b.w);
      for (let y = b.y; y < b.y + b.h; y++) for (let x = b.x + k; x < b.x + b.w + k; x++) m[y][x] = "H";
      for (const dx of b.door) m[b.y + b.h - 1][dx + k] = "D";
      // o caminho da porta acompanha
      for (const dx of b.door) if (m[b.y + b.h] && m[b.y + b.h][dx + k] === ".") m[b.y + b.h][dx + k] = ",";
      if (!okDoors()) return ((m = save), false);
      for (const key of oldDoors) delete Z.town.doors[key];
      b.x += k;
      b.door = b.door.map((dx) => dx + k);
      for (const dx of b.door) Z.town.doors[dx + "," + (b.y + b.h - 1)] = b;
      return true;
    }
    let moved = 0;
    for (let pass = 0; pass < 3; pass++)
      for (const a of Z.town.bld)
        for (const c of Z.town.bld) {
          if (a === c) continue;
          const vo = a.y < c.y + c.h && c.y < a.y + a.h;
          const gap = c.x - (a.x + a.w);
          if (!vo || gap < 0 || gap >= 2) continue;
          const need = 2 - gap;
          if (!fixed(c) && tryMove(c, need)) moved++;
          else if (!fixed(a) && tryMove(a, -need)) moved++;
        }
    Z.map = m.map((r) => r.join(""));
    return moved;
  }
  const zones = Object.keys(ZONES).filter((z) => z === "vila" || z === "porto" || z === "serra" || z === "solmar" || z === "rosalva" || z.startsWith("pais-"));
  let total = 0;
  for (const z of zones) total += spread(z);
  window.SPREAD_MOVED = total;
})();
