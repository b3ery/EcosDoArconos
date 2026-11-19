/**
 * ECOS DO ARCANO — preencher-mapas.js
 * As cidades cresceram e ficaram com faixas grandes de grama vazia. Cada
 * vazio grande (8x8 ou mais) ganha um lugar medieval, alternando:
 *  - POMAR: fileiras de árvores com um caminho no meio;
 *  - HORTA COMUNITÁRIA: canteiros de plantação em fileiras e um poço;
 *  - JARDIM: caminho em volta, flores, bancos, lampiões e um poço no meio.
 * Cada um ganha um caminho de 2 blocos até a rua mais perto. Nada disso
 * fecha passagem (árvore, poço, plantação e banco são decoração).
 * Roda depois de lotes-comunitarios.js.
 */

"use strict";

(() => {
  const zones = Object.keys(ZONES).filter((z) => ["vila", "porto", "serra", "solmar", "rosalva"].includes(z) || z.startsWith("pais-"));
  const hs = (a, b) => ((((a * 73856093) ^ (b * 19349663)) >>> 0) % 1000) / 1000;
  let total = 0;
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
    for (const k in Z.npcs || {}) used.add(k);
    for (const k in Z.town.stalls || {}) used.add(k);
    for (const o of Object.values(Z.open || {}))
      if (o && typeof o[0] === "number") for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) used.add(o[0] + dx + "," + (o[1] + dy));
    if (Z.town.arrive) for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) used.add(Z.town.arrive[0] + dx + "," + (Z.town.arrive[1] + dy));
    const g = (x, y) => x > 0 && y > 0 && x < W - 1 && y < H - 1 && m[y][x] === "." && !used.has(x + "," + y) && !(C && C.has(x + "," + y));
    const S = 8;
    // blocos 8x8 vazios, juntados em faixas (até 4 blocos de largura)
    const free = new Set();
    for (let y = 1; y + S < H; y += S)
      for (let x = 1; x + S < W; x += S) {
        let ok = true;
        for (let yy = y; yy < y + S && ok; yy++) for (let xx = x; xx < x + S && ok; xx++) if (!g(xx, yy)) ok = false;
        if (ok) free.add(x + "," + y);
      }
    const taken = new Set();
    const spots = [];
    for (let y = 1; y + S < H; y += S)
      for (let x = 1; x + S < W; x += S) {
        const k = x + "," + y;
        if (!free.has(k) || taken.has(k)) continue;
        let n = 1;
        while (n < 4 && free.has(x + n * S + "," + y) && !taken.has(x + n * S + "," + y)) n++;
        for (let i = 0; i < n; i++) taken.add(x + i * S + "," + y);
        spots.push({ x0: x + 1, y0: y + 1, x1: x + n * S - 2, y1: y + S - 2 });
      }
    spots.forEach((R, i) => {
      const kind = ["pomar", "horta", "jardim"][(i + Math.floor(hs(R.x0, R.y0 + zid.length) * 3)) % 3];
      const set = (x, y, c) => m[y] && m[y][x] === "." && (m[y][x] = c);
      const midX = Math.floor((R.x0 + R.x1) / 2),
        midY = Math.floor((R.y0 + R.y1) / 2);
      if (kind === "pomar") {
        // caminho de 2 no meio, árvores em fileiras dos dois lados
        for (let x = R.x0; x <= R.x1; x++) (set(x, midY, ","), set(x, midY + 1, ","));
        for (let y = R.y0; y <= R.y1; y += 2) for (let x = R.x0; x <= R.x1; x += 3) if (y !== midY && y !== midY + 1) set(x, y, "T");
      } else if (kind === "horta") {
        // canteiros (plantação) em fileiras, com corredores de terra; poço no canto
        for (let y = R.y0; y <= R.y1; y++) {
          const row = (y - R.y0) % 3;
          for (let x = R.x0; x <= R.x1; x++) set(x, y, row === 2 ? "," : "g");
        }
        m[R.y0][R.x1] = "W";
      } else {
        // jardim: anel de caminho de 2, flores dentro, bancos e lampiões, poço no meio
        for (let x = R.x0; x <= R.x1; x++) for (const y of [R.y0, R.y0 + 1, R.y1 - 1, R.y1]) set(x, y, ",");
        for (let y = R.y0; y <= R.y1; y++) for (const x of [R.x0, R.x0 + 1, R.x1 - 1, R.x1]) set(x, y, ",");
        for (let y = R.y0 + 2; y <= R.y1 - 2; y++) for (let x = R.x0 + 2; x <= R.x1 - 2; x++) set(x, y, (x + y) % 3 ? "w" : ".");
        m[midY][midX] = "W";
        set(midX - 1, R.y0 + 2, "b");
        set(midX + 1, R.y1 - 2, "b");
        for (const [x, y] of [[R.x0 + 2, R.y0 + 2], [R.x1 - 2, R.y1 - 2]]) m[y][x] = "l";
      }
      // caminho de 2 blocos até a rua mais perto (para baixo, para cima ou para os lados)
      const road = (x, y) => m[y] && ",=".includes(m[y][x]) && !(x >= R.x0 && x <= R.x1 && y >= R.y0 && y <= R.y1);
      let best = null;
      for (const [dx, dy, sx, sy] of [[0, 1, midX, R.y1], [0, -1, midX, R.y0], [1, 0, R.x1, midY], [-1, 0, R.x0, midY]]) {
        for (let d = 1; d < 30; d++) {
          const x = sx + dx * d,
            y = sy + dy * d;
          if (!m[y] || x <= 0 || x >= W - 1 || y <= 0 || y >= H - 1) break;
          if (road(x, y)) {
            if (!best || d < best.d) best = { dx, dy, sx, sy, d };
            break;
          }
          if (m[y][x] !== "." && m[y][x] !== "w" && m[y][x] !== "T") break;
        }
      }
      if (best)
        for (let d = 0; d < best.d; d++) {
          const x = best.sx + best.dx * d,
            y = best.sy + best.dy * d;
          for (const k of [0, 1]) {
            const xx = x + (best.dy ? k : 0),
              yy = y + (best.dx ? k : 0);
            if (m[yy] && ".wTg".includes(m[yy][xx])) m[yy][xx] = ",";
          }
        }
      total++;
    });
    Z.map = m.map((r) => r.join(""));
  }
  window.MAP_FILLED = total;

  /* ----- RUAS SEM SAÍDA: liga com a rua vizinha (mesmo de outro bairro) ou fecha num balão ----- */
  let linked = 0,
    loops = 0;
  for (const zid of zones) {
    const Z = ZONES[zid];
    if (!Z || !Z.town || !Z.map) continue;
    const W = Z.w,
      H = Z.h;
    const m = Z.map.map((r) => r.split(""));
    const C = window.COMMUNITY_LOTS && COMMUNITY_LOTS[zid];
    const plans = new Set();
    for (const b of Z.town.bld) if (b.plan) for (const k of Object.keys(b.plan)) plans.add(k);
    const inLot = (x, y) => plans.has(x + "," + y) || !!(C && C.has(x + "," + y));
    const road = (x, y) => m[y] && ",=".includes(m[y][x]) && !inLot(x, y);
    const grass = (x, y) => x > 1 && y > 1 && x < W - 2 && y < H - 2 && ".wTg".includes(m[y][x]) && !inLot(x, y) && !Z.town.bld.some((b) => x >= b.x - 1 && x <= b.x + b.w && y >= b.y - 1 && y <= b.y + b.h);
    const D4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    const ends = [];
    for (let y = 2; y < H - 2; y++)
      for (let x = 2; x < W - 2; x++) {
        if (!road(x, y)) continue;
        for (const [dx, dy] of D4) {
          // a rua vem de trás (−d) e termina na frente (+d), com o par do lado também terminando
          if (!road(x - dx, y - dy) || !grass(x + dx, y + dy)) continue;
          const px = dy ? x + 1 : x,
            py = dx ? y + 1 : y;
          if (!(road(px, py) && road(px - dx, py - dy) && grass(px + dx, py + dy))) continue;
          // e é ponta mesmo: os lados de fora não são rua
          const sx = dy ? x - 1 : x,
            sy = dx ? y - 1 : y,
            ox = dy ? px + 1 : px,
            oy = dx ? py + 1 : py;
          if (road(sx, sy) || road(ox, oy)) continue;
          ends.push({ x, y, dx, dy, px, py });
        }
      }
    // distância andando só pela rua (para não ligar a rua nela mesma)
    const roadDist = (sx, sy) => {
      const D = new Int32Array(W * H).fill(-1);
      const q = [[sx, sy]];
      D[sy * W + sx] = 0;
      for (let i = 0; i < q.length; i++) {
        const [x, y] = q[i];
        for (const [dx, dy] of D4) {
          const nx = x + dx,
            ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= W || ny >= H || D[ny * W + nx] >= 0 || !road(nx, ny)) continue;
          D[ny * W + nx] = D[y * W + x] + 1;
          q.push([nx, ny]);
        }
      }
      return D;
    };
    const done = new Set();
    for (const E of ends) {
      const key = Math.min(E.x, E.px) + "," + Math.min(E.y, E.py);
      if (done.has(key)) continue;
      done.add(key);
      if (!road(E.x, E.y)) continue;
      const RD = roadDist(E.x, E.y);
      // anda pela grama (2 de largura) até achar outra rua que fique longe pela rua
      const prev = new Map([[E.x + E.dx + "," + (E.y + E.dy), null]]);
      let q = [[E.x + E.dx, E.y + E.dy]],
        hit = null;
      const ok2 = (x, y) => grass(x, y) && (E.dy ? grass(x + 1, y) : grass(x, y + 1));
      if (!ok2(E.x + E.dx, E.y + E.dy)) q = [];
      for (let d = 0; d < 40 && q.length && !hit; d++) {
        const nq = [];
        for (const [x, y] of q) {
          for (const [dx, dy] of D4) {
            const nx = x + dx,
              ny = y + dy,
              k = nx + "," + ny;
            if (prev.has(k)) continue;
            const r1 = road(nx, ny);
            if (r1) {
              const rd = RD[ny * W + nx];
              if (rd < 0 || rd > d + 8) {
                hit = [x, y];
                break;
              }
              continue;
            }
            if (!ok2(nx, ny)) continue;
            prev.set(k, [x, y]);
            nq.push([nx, ny]);
          }
          if (hit) break;
        }
        q = nq;
      }
      if (hit) {
        let c = hit;
        while (c) {
          const [x, y] = c;
          m[y][x] = ",";
          if (E.dy) m[y][x + 1] = ",";
          else m[y + 1][x] = ",";
          // na curva, o canto também (o caminho fica com 2 de largura)
          m[y + 1] && grass(x + 1, y + 1) && (m[y + 1][x + 1] = ",");
          c = prev.get(x + "," + y);
        }
        linked++;
      } else {
        // balão de retorno no fim da rua (praça redondinha com um poste no meio)
        const cx = E.x + E.dx * 2 + (E.dy ? 0.5 : 0),
          cy = E.y + E.dy * 2 + (E.dx ? 0.5 : 0);
        let fits = true;
        const cells = [];
        for (let y = Math.floor(cy - 2); y <= Math.ceil(cy + 2); y++)
          for (let x = Math.floor(cx - 2); x <= Math.ceil(cx + 2); x++) {
            if ((x - cx) ** 2 + (y - cy) ** 2 > 6.3) continue;
            if (!road(x, y) && !grass(x, y)) continue;
            cells.push([x, y]);
          }
        if (!fits) continue;
        for (const [x, y] of cells) if (m[y][x] !== "=") m[y][x] = ",";
        const lx = Math.round(cx),
          ly = Math.round(cy);
        if (m[ly + 1] && m[ly][lx] === ",") m[ly][lx] = "b";
        loops++;
      }
    }
    Z.map = m.map((r) => r.join(""));
  }
  window.ROADS_LINKED = linked;
  window.ROAD_LOOPS = loops;
})();
