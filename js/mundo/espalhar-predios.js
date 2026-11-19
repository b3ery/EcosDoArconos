/**
 * ECOS DO ARCANO — espalhar-predios.js
 * Varredura de todas as cidades: dois prédios sem lote próprio com menos
 * de 2 tiles entre eles não têm como ganhar o lote (gramado, cerca, caminho).
 * O menor dos dois muda para o terreno livre mais perto, com folga de 2
 * tiles em volta para o lote. Prédios que a história usa no lugar certo
 * (farol, castelo, taverna, sua casa) ficam onde estão.
 * O jogo confere que toda porta continua alcançável; se não, desfaz.
 * Roda antes de lotes-no-centro.js e lotes-comunitarios.js.
 */

"use strict";

(() => {
  const PASS = new Set(".,PEL=gwubxhnkqAozYVZtRp".split(""));
  const MAXD = window.SPREAD_MAXD || 30;
  const LOG = (window.SPREAD_LOG = []);
  const STAY = new Set(["farol", "castle", "palacio", "fortaleza", "taverna", "home"]);
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
  const close = (a, c) => c.x - 2 < a.x + a.w && a.x - 2 < c.x + c.w && c.y - 2 < a.y + a.h && a.y - 2 < c.y + c.h;
  // vizinhos da mesma fileira: 3 tiles de folga (lado do lote de cada um + o beco)
  const GX = 3;
  const tightX = (a, c) => a.y < c.y + c.h && c.y < a.y + a.h && ((c.x >= a.x + a.w && c.x - (a.x + a.w) < GX) || (a.x >= c.x + c.w && a.x - (c.x + c.w) < GX));
  const free = (b) => !b.plan && !b.lot && !STAY.has(b.style);
  function spread(zid) {
    const Z = ZONES[zid];
    if (!Z || !Z.town || Z.town.indoor || !Z.town.bld || !Z.map) return 0;
    let m = Z.map.map((r) => r.split(""));
    const W = Z.w,
      H = Z.h;
    const B = Z.town.bld;
    const taken = (x, y) =>
      (Z.npcs && Z.npcs[x + "," + y]) ||
      (Z.town.stalls && Z.town.stalls[x + "," + y]) ||
      B.some((o) => o.plan && o.plan[x + "," + y]) ||
      B.some((o) => x >= o.x - 2 && x < o.x + o.w + 2 && y >= o.y - 2 && y < o.y + o.h + 2);
    const doorsOpen = () => {
      const R = reach(Z, m);
      return new Set(B.filter((b) => b.door.every((dx) => R[(b.y + b.h) * W + dx])));
    };
    // nenhuma porta que tinha caminho pode ficar sem, e a do prédio que mudou tem que ter
    const allDoorsOk = (mv) => {
      const now = doorsOpen();
      return now.has(mv) && [...base].every((b) => b === mv || now.has(b));
    };
    let base = doorsOpen();
    // EMPURRAR: o vizinho anda 1 ou 2 tiles para longe (e quem estiver no caminho
    // anda junto, em cadeia), só por cima de chão (grama ou pedra)
    const GROUND = ".,T"; // uma árvore no caminho sai
    function pushChain(b, dx, dy) {
      const group = [];
      const want = (o) => {
        if (group.includes(o)) return true;
        if (!free(o) && o !== b) return false;
        if (STAY.has(o.style)) return false;
        group.push(o);
        const nx = o.x + dx,
          ny = o.y + dy;
        for (const q of B) {
          if (q === o || group.includes(q)) continue;
          const hit = q.x - GX < nx + o.w && nx - GX < q.x + q.w && q.y - 2 < ny + o.h && ny - 2 < q.y + q.h;
          const wasHit = q.x - GX < o.x + o.w && o.x - GX < q.x + q.w && q.y - 2 < o.y + o.h && o.y - 2 < q.y + q.h;
          if (hit && !wasHit && !want(q)) return false;
        }
        return true;
      };
      if (!want(b)) return false;
      const inGroup = (x, y) => group.some((o) => x >= o.x && x < o.x + o.w && y >= o.y && y < o.y + o.h);
      for (const o of group)
        for (let y = o.y + dy; y < o.y + dy + o.h; y++)
          for (let x = o.x + dx; x < o.x + dx + o.w; x++) {
            if (!m[y] || x < 1 || y < 1 || x >= W - 1 || y >= H - 1) return false;
            if (inGroup(x, y)) continue;
            if (!GROUND.includes(m[y][x]) || (Z.npcs && Z.npcs[x + "," + y]) || (Z.town.stalls && Z.town.stalls[x + "," + y])) return false;
          }
      const save = m.map((r) => r.slice());
      const olds = group.map((o) => ({ o, x: o.x, y: o.y, door: o.door.slice() }));
      for (const o of group) {
        for (const ddx of o.door) delete Z.town.doors[ddx + "," + (o.y + o.h - 1)];
        for (let y = o.y; y < o.y + o.h; y++) for (let x = o.x; x < o.x + o.w; x++) m[y][x] = (save[y + 1] && save[y + 1][x] === ",") || (save[y][x - 1] === ",") ? "," : ".";
      }
      for (const o of group) {
        o.x += dx;
        o.y += dy;
        o.door = o.door.map((d) => d + dx);
        for (let y = o.y; y < o.y + o.h; y++) for (let x = o.x; x < o.x + o.w; x++) m[y][x] = "H";
        for (const d of o.door) {
          m[o.y + o.h - 1][d] = "D";
          if (m[o.y + o.h] && m[o.y + o.h][d] === ".") m[o.y + o.h][d] = ",";
        }
      }
      const now = doorsOpen();
      const ok = [...base].every((q) => now.has(q)) && group.every((o) => now.has(o) || !base.has(o));
      if (!ok) {
        m = save;
        for (const { o, x, y, door } of olds) Object.assign(o, { x, y, door });
      } else {
        base = now;
        for (const { o, x, y } of olds) LOG.push(zid + ":" + o.id + " " + x + "," + y + "->" + o.x + "," + o.y + " (empurrado)");
      }
      for (const o of group) for (const d of o.door) Z.town.doors[d + "," + (o.y + o.h - 1)] = o;
      return ok;
    }
    let pushed = 0;
    for (let pass = 0; pass < 4; pass++)
      for (const a of B)
        for (const c of B) {
          if (a === c || (!close(a, c) && !tightX(a, c))) continue;
          const vo = a.y < c.y + c.h && c.y < a.y + a.h;
          const ho = a.x < c.x + c.w && c.x < a.x + a.w;
          let tries = [];
          if (vo && c.x >= a.x + a.w) {
            const need = GX - (c.x - (a.x + a.w));
            tries = [[c, need, 0], [a, -need, 0]];
          } else if (ho && c.y >= a.y + a.h) {
            const need = 2 - (c.y - (a.y + a.h));
            tries = [[c, 0, need], [a, 0, -need]];
          } else continue;
          for (const [o, dx, dy] of tries) if (free(o) && pushChain(o, dx, dy)) ((pushed++), (tries = []));
        }
    let moved = 0;
    for (let pass = 0; pass < 4; pass++) {
      let changed = false;
      for (const a of B) {
        const c = B.find((o) => o !== a && close(a, o) && (!o.plan || !a.plan));
        if (!c) continue;
        // quem muda: o menor que pode mudar
        const cand = [a, c].filter(free).sort((p, q) => p.w * p.h - q.w * q.h);
        const b = cand[0];
        if (!b) continue;
        // terreno livre mais perto: o prédio + 2 tiles de folga em volta, tudo grama, e a frente andável
        // terrenos livres, do mais perto ao mais longe: o prédio + 2 tiles de folga
        // em volta, tudo grama, e a frente andável
        const spots = [];
        for (let y = 3; y + b.h + 3 < H; y++)
          for (let x = 3; x + b.w + 3 < W; x++) {
            let ok = true;
            for (let yy = y - 2; yy < y + b.h + 2 && ok; yy++)
              for (let xx = x - 2; xx < x + b.w + 2 && ok; xx++) {
                const inOld = xx >= b.x && xx < b.x + b.w && yy >= b.y && yy < b.y + b.h;
                if (m[yy][xx] !== "." && !inOld) ok = false;
                else if (!inOld && taken(xx, yy)) ok = false;
              }
            if (ok && !PASS.has(m[y + b.h + 2][x + Math.floor(b.w / 2)])) ok = false;
            const d = Math.abs(x - b.x) + Math.abs(y - b.y);
            if (ok && d <= MAXD) spots.push({ x, y, d }); // muda para perto, no mesmo bairro
          }
        spots.sort((p, q) => p.d - q.d);
        for (const best of spots.slice(0, 25)) {
          const save = m.map((r) => r.slice());
          const old = { x: b.x, y: b.y, door: b.door.slice() };
          for (const dx of b.door) delete Z.town.doors[dx + "," + (b.y + b.h - 1)];
          for (let y = b.y; y < b.y + b.h; y++) for (let x = b.x; x < b.x + b.w; x++) m[y][x] = ",";
          const kx = best.x - b.x;
          b.x = best.x;
          b.y = best.y;
          b.door = b.door.map((dx) => dx + kx);
          for (let y = b.y; y < b.y + b.h; y++) for (let x = b.x; x < b.x + b.w; x++) m[y][x] = "H";
          for (const dx of b.door) {
            m[b.y + b.h - 1][dx] = "D";
            for (let y = b.y + b.h; y < b.y + b.h + 2; y++) if (m[y][dx] === ".") m[y][dx] = ",";
          }
          const ok = allDoorsOk(b);
          if (ok) base = doorsOpen();
          if (!ok) (m = save), Object.assign(b, old);
          for (const dx of b.door) Z.town.doors[dx + "," + (b.y + b.h - 1)] = b;
          if (ok) {
            LOG.push(zid + ":" + b.id + " " + old.x + "," + old.y + "->" + b.x + "," + b.y + " d" + best.d);
            moved++;
            changed = true;
            break;
          }
        }
      }
      if (!changed) break;
    }
    Z.map = m.map((r) => r.join(""));
    return moved + pushed;
  }
  let total = 0;
  for (const z of Object.keys(ZONES)) total += spread(z);
  window.SPREAD_RELOCATED = total;
})();
