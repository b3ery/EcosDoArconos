/**
 * ECOS DO ARCANO — preencher-mapas.js
 * As cidades cresceram e ficaram com faixas grandes de grama vazia. Cada
 * vazio grande (8x8 ou mais) ganha um lugar medieval, alternando:
 *  - POMAR: fileiras de árvores com um caminho no meio;
 *  - HORTA COMUNITÁRIA: canteiros de plantação em fileiras e um poço;
 *  - PARQUE: árvores em volta, caminho em anel e o parquinho no meio
 *    (balanço, escorregador, gangorra, caixa de areia, trepa-trepa); os
 *    lampiões ficam nos dois lados da entrada, nunca no meio do caminho.
 * Cada um ganha um caminho de 2 blocos até a rua mais perto. Nada disso
 * fecha passagem (árvore, poço, plantação e banco são decoração).
 * Roda depois de lotes-comunitarios.js.
 */

"use strict";

(() => {
  const zones = Object.keys(ZONES).filter((z) => ["vila", "porto", "serra", "solmar", "rosalva"].includes(z) || z.startsWith("pais-"));
  const hs = (a, b) => ((((a * 73856093) ^ (b * 19349663)) >>> 0) % 1000) / 1000;
  /* ----- o parque (usado aqui e em parques.js) ----- */
  const PARKS = (window.PARKS = window.PARKS || {});
  const PLAY = ["balanco", "escorrega", "gangorra", "areia", "trepa", "balanco", "gira"];
  window.makePark = function (m, R, zid) {
    const P = (PARKS[zid] = PARKS[zid] || new Map());
    const set = (x, y, c) => m[y] && m[y][x] !== undefined && (m[y][x] = c);
    for (let y = R.y0; y <= R.y1; y++)
      for (let x = R.x0; x <= R.x1; x++) {
        const edge = x === R.x0 || x === R.x1 || y === R.y0 || y === R.y1;
        const ring = !edge && (x <= R.x0 + 2 || x >= R.x1 - 2 || y <= R.y0 + 2 || y >= R.y1 - 2);
        // borda: árvores com espaço entre elas (dá para passar, são decoração)
        if (edge) set(x, y, (x + y) % 2 ? "T" : ".");
        else if (ring) set(x, y, ",");
        else set(x, y, ".");
      }
    // parquinho no meio: brinquedos de 2 de largura lado a lado, com grama entre eles
    const ix0 = R.x0 + 3,
      ix1 = R.x1 - 3,
      iy0 = R.y0 + 3,
      iy1 = R.y1 - 3;
    let k = Math.floor(((R.x0 * 7 + R.y0 * 3) >>> 0) % PLAY.length);
    for (let y = iy0; y <= iy1; y += 2)
      for (let x = ix0; x + 1 <= ix1; x += 3) {
        const kind = PLAY[k++ % PLAY.length];
        // marca o canto de baixo à direita (desenhado por cima dos dois blocos)
        P.set(x + 1 + "," + y, kind);
        P.set(x + "," + y, "-");
      }
    // banquinhos para os pais na beira do parquinho
    if (ix1 - ix0 >= 2) {
      if (m[iy0 - 1] && m[iy0 - 1][ix0] === ",") set(ix0, iy0 - 1, "b");
      if (m[iy1 + 1] && m[iy1 + 1][ix1] === ",") set(ix1, iy1 + 1, "b");
    }
  };
  // lampiões nos dois lados de cada entrada (na fileira das árvores, nunca no caminho)
  window.parkGate = function (m, R) {
    const edge = [];
    for (let x = R.x0; x <= R.x1; x++) edge.push([x, R.y0, 1, 0], [x, R.y1, 1, 0]);
    for (let y = R.y0 + 1; y < R.y1; y++) edge.push([R.x0, y, 0, 1], [R.x1, y, 0, 1]);
    for (const [x, y, dx, dy] of edge) {
      if (m[y][x] !== ",") continue;
      for (const s of [-1, 1]) {
        const xx = x + dx * s,
          yy = y + dy * s;
        if (m[yy] && ".T".includes(m[yy][xx]) && xx >= R.x0 && xx <= R.x1 && yy >= R.y0 && yy <= R.y1) m[yy][xx] = "l";
      }
    }
  };
  /* ----- o lago grande do rio: pescar, lavar roupa, tomar banho e nadar ----- */
  const LAKES = (window.LAKES = window.LAKES || {});
  window.makeLake = function (m, R, zid) {
    (LAKES[zid] = LAKES[zid] || []).push(R);
    const cx = (R.x0 + R.x1) / 2,
      cy = (R.y0 + R.y1) / 2,
      rx = (R.x1 - R.x0) / 2 - 0.6,
      ry = (R.y1 - R.y0) / 2 - 0.6;
    for (let y = R.y0; y <= R.y1; y++)
      for (let x = R.x0; x <= R.x1; x++) {
        // margem ondulada (não é um quadrado nem uma bola perfeita)
        const wob = 0.12 * Math.sin(x * 0.9 + zid.length) + 0.1 * Math.cos(y * 1.3 + x * 0.4);
        const d = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2;
        if (d < 0.86 + wob && m[y][x] === ".") m[y][x] = "~";
      }
  };
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
    /* parques primeiro: os maiores vazios (até 16x12, no mínimo 10x9) */
    const PROT0 = ((window.FILLED_AREAS = window.FILLED_AREAS || {})[zid] = new Set());
    const want = Math.max(1, Math.ceil((W * H) / 4500));
    const parks = [];
    const sum = Array.from({ length: H + 1 }, () => new Int32Array(W + 1));
    const rebuild = () => {
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) sum[y + 1][x + 1] = (g(x, y) ? 1 : 0) + sum[y][x + 1] + sum[y + 1][x] - sum[y][x];
    };
    const allFree = (x, y, w, h) => x >= 1 && y >= 1 && x + w < W && y + h < H && sum[y + h][x + w] - sum[y][x + w] - sum[y + h][x] + sum[y][x] === w * h;
    const nearRoad = (R) => {
      for (let d = 1; d < 26; d++)
        for (const [x, y] of [[(R.x0 + R.x1) >> 1, R.y1 + d], [(R.x0 + R.x1) >> 1, R.y0 - d], [R.x1 + d, (R.y0 + R.y1) >> 1], [R.x0 - d, (R.y0 + R.y1) >> 1]])
          if (m[y] && ",=".includes(m[y][x])) return true;
      return false;
    };
    for (const [pw, ph] of [[16, 12], [14, 11], [12, 10], [10, 9]]) {
      rebuild();
      for (let y = 1; y + ph + 1 < H && parks.length < want; y++)
        for (let x = 1; x + pw + 1 < W && parks.length < want; x++) {
          // uma folga de 1 bloco em volta também livre (não encosta em cerca nem em casa)
          if (!allFree(x - 1, y - 1, pw + 2, ph + 2)) continue;
          const R = { x0: x, y0: y, x1: x + pw - 1, y1: y + ph - 1, park: true };
          if (!nearRoad(R)) continue;
          parks.push(R);
          ((window.PARK_RECTS = window.PARK_RECTS || {})[zid] = window.PARK_RECTS[zid] || []).push(R);
          for (let yy = y - 1; yy <= y + ph; yy++) for (let xx = x - 1; xx <= x + pw; xx++) used.add(xx + "," + yy);
          rebuild();
        }
    }
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
        spots.push({ x0: x + 1, y0: y + 1, x1: x + n * S - 2, y1: y + S - 2, n });
      }
    const PROT = PROT0;
    const all = parks.concat(spots);
    const fillOne = (R, i) => {
      for (let y = R.y0; y <= R.y1; y++) for (let x = R.x0; x <= R.x1; x++) PROT.add(x + "," + y);
      const kind = R.park ? "jardim" : R.lake || R.n >= 3 ? "lago" : ["pomar", "horta"][(i + Math.floor(hs(R.x0, R.y0 + zid.length) * 2)) % 2];
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
      } else if (kind === "lago") {
        window.makeLake(m, R, zid);
      } else {
        // parque: árvores em volta, caminho de 2 em anel e o parquinho das crianças no meio
        window.makePark(m, R, zid);
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
      if (kind === "jardim") window.parkGate(m, R);
      if (kind === "lago" && best) {
        // o caminho entra até a beira da água (lá é o lavadouro)
        for (let d = 1; d < 12; d++) {
          const x = best.sx - best.dx * d,
            y = best.sy - best.dy * d;
          let wet = false;
          for (const k of [0, 1]) {
            const xx = x + (best.dy ? k : 0),
              yy = y + (best.dx ? k : 0);
            if (!m[yy]) continue;
            if (m[yy][xx] === "~") wet = true;
            else if (".wT".includes(m[yy][xx])) m[yy][xx] = ",";
          }
          if (wet) break;
        }
      }
      total++;
    };
    all.forEach(fillOne);
    /* ----- o que sobrou de vazio vira um lago grande do rio ----- */
    for (const k of PROT) used.add(k);
    const lakes = [];
    const wantL = Math.max(1, Math.ceil((W * H) / 5000));
    for (const [lw, lh] of [[22, 12], [18, 10], [14, 9], [12, 8]]) {
      rebuild();
      for (let y = 2; y + lh + 2 < H && lakes.length < wantL; y++)
        for (let x = 2; x + lw + 2 < W && lakes.length < wantL; x++) {
          if (!allFree(x - 1, y - 1, lw + 2, lh + 2)) continue;
          const R = { x0: x, y0: y, x1: x + lw - 1, y1: y + lh - 1, lake: true };
          if (!nearRoad(R)) continue;
          lakes.push(R);
          for (let yy = y - 1; yy <= y + lh; yy++) for (let xx = x - 1; xx <= x + lw; xx++) used.add(xx + "," + yy);
          rebuild();
        }
    }
    lakes.forEach((R) => fillOne(R, 0));
    Z.map = m.map((r) => r.join(""));
  }
  window.MAP_FILLED = total;
  window.PARK_COUNT = Object.fromEntries(Object.entries(window.PARKS).map(([z, P]) => [z, [...P.values()].filter((v) => v !== "-").length]));

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
    const PR = (window.FILLED_AREAS || {})[zid] || new Set();
    const grass = (x, y) => x > 1 && y > 1 && x < W - 2 && y < H - 2 && ".wTg".includes(m[y][x]) && !inLot(x, y) && !PR.has(x + "," + y) && !Z.town.bld.some((b) => x >= b.x - 1 && x <= b.x + b.w && y >= b.y - 1 && y <= b.y + b.h);
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
  /* ----- GRADE: ruas paralelas ligadas por travessas (no máximo 28 blocos sem travessa)
     e todo pedaço de rua solto ligado na rede principal ----- */
  let cross = 0,
    joined = 0;
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
    const nearB = (x, y) => Z.town.bld.some((b) => x >= b.x - 1 && x <= b.x + b.w && y >= b.y - 1 && y <= b.y + b.h);
    const road = (x, y) => m[y] && ",=".includes(m[y][x]) && !inLot(x, y);
    const PR2 = (window.FILLED_AREAS || {})[zid] || new Set();
    const open = (x, y) => x > 1 && y > 1 && x < W - 2 && y < H - 2 && (".wTgb,".includes(m[y][x])) && !inLot(x, y) && !PR2.has(x + "," + y) && !nearB(x, y) && !(Z.npcs && Z.npcs[x + "," + y]);
    // faixas de rua compridas (horizontais e verticais)
    const runs = (horiz) => {
      const out = [];
      const A = horiz ? H : W,
        B = horiz ? W : H;
      for (let a = 1; a < A - 1; a++) {
        let s0 = -1;
        for (let t = 0; t <= B; t++) {
          const on = t < B && (horiz ? road(t, a) && road(t, a + 1) : road(a, t) && road(a + 1, t));
          if (on && s0 < 0) s0 = t;
          if (!on && s0 >= 0) {
            if (t - s0 >= 14) out.push({ a, s: s0, e: t - 1 });
            s0 = -1;
          }
        }
      }
      // tira as faixas repetidas da mesma rua (linha de baixo da rua de 2)
      return out.filter((r) => !out.some((o) => o.a === r.a - 1 && o.s <= r.s + 2 && o.e >= r.e - 2));
    };
    for (const horiz of [true, false]) {
      const R = runs(horiz);
      for (const A of R)
        for (const B of R) {
          if (B.a <= A.a + 3 || B.a - A.a > 24) continue;
          const s0 = Math.max(A.s, B.s) + 2,
            e0 = Math.min(A.e, B.e) - 2;
          if (e0 - s0 < 20) continue;
          // há outra rua paralela no meio? então a ligação é com ela
          if (R.some((M) => M.a > A.a + 1 && M.a < B.a - 1 && M.s <= s0 && M.e >= e0)) continue;
          const at = (t, u) => (horiz ? [t, u] : [u, t]);
          const links = (t) => {
            for (let u = A.a + 2; u < B.a; u++) {
              const [x, y] = at(t, u);
              if (!road(x, y)) return false;
            }
            return true;
          };
          const can = (t) => {
            for (let u = A.a + 2; u < B.a; u++)
              for (const k of [0, 1]) {
                const [x, y] = at(t + k, u);
                if (!open(x, y)) return false;
              }
            return true;
          };
          for (let guard = 0; guard < 8; guard++) {
            const L = [s0 - 1];
            for (let t = s0; t <= e0; t++) if (links(t)) L.push(t);
            L.push(e0 + 1);
            let gap = 0,
              gi = 0;
            for (let i = 1; i < L.length; i++) if (L[i] - L[i - 1] > gap) ((gap = L[i] - L[i - 1]), (gi = i));
            if (gap <= 28) break;
            const mid = Math.floor((L[gi] + L[gi - 1]) / 2);
            let pick = null;
            for (let d = 0; d < gap / 2 - 3 && pick == null; d++) for (const t of [mid - d, mid + d]) if (pick == null && can(t)) pick = t;
            if (pick == null) break;
            for (let u = A.a + 2; u < B.a; u++)
              for (const k of [0, 1]) {
                const [x, y] = at(pick + k, u);
                m[y][x] = ",";
              }
            cross++;
          }
        }
    }
    // pedaços soltos: liga na rede maior pela grama (2 de largura)
    const comp = () => {
      const id = new Int32Array(W * H).fill(-1);
      const sz = [];
      for (let y = 0; y < H; y++)
        for (let x = 0; x < W; x++) {
          if (!road(x, y) || id[y * W + x] >= 0) continue;
          const c = sz.length;
          let n = 0;
          const q = [[x, y]];
          id[y * W + x] = c;
          while (q.length) {
            const [a, bb] = q.pop();
            n++;
            for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
              const nx = a + dx,
                ny = bb + dy;
              if (nx < 0 || ny < 0 || nx >= W || ny >= H || id[ny * W + nx] >= 0 || !road(nx, ny)) continue;
              id[ny * W + nx] = c;
              q.push([nx, ny]);
            }
          }
          sz.push(n);
        }
      return { id, sz };
    };
    for (let pass = 0; pass < 6; pass++) {
      const { id, sz } = comp();
      const main = sz.indexOf(Math.max(...sz));
      const small = sz.map((n, i) => [n, i]).filter(([n, i]) => i !== main && n >= 12);
      if (!small.length) break;
      let any = false;
      for (const [, ci] of small) {
        // BFS a partir do pedaço até a rede principal
        const prev = new Map();
        let q = [];
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (id[y * W + x] === ci) (q.push([x, y]), prev.set(x + "," + y, null));
        let hit = null;
        for (let d = 0; d < 40 && q.length && !hit; d++) {
          const nq = [];
          for (const [x, y] of q) {
            for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
              const nx = x + dx,
                ny = y + dy,
                k = nx + "," + ny;
              if (prev.has(k)) continue;
              if (id[ny * W + nx] === main) {
                hit = [x, y];
                break;
              }
              if (!(open(nx, ny) && (open(nx + 1, ny) || open(nx, ny + 1)))) continue;
              prev.set(k, [x, y]);
              nq.push([nx, ny]);
            }
            if (hit) break;
          }
          q = nq;
        }
        if (!hit) continue;
        let c = hit;
        while (c && id[c[1] * W + c[0]] !== ci) {
          const [x, y] = c;
          m[y][x] = ",";
          if (open(x + 1, y)) m[y][x + 1] = ",";
          else if (open(x, y + 1)) m[y + 1][x] = ",";
          c = prev.get(x + "," + y);
        }
        joined++;
        any = true;
      }
      if (!any) break;
    }
    Z.map = m.map((r) => r.join(""));
  }
  window.ROADS_CROSS = cross;
  window.ROADS_JOINED = joined;
  window.ROADS_LINKED = linked;
  window.ROAD_LOOPS = loops;
})();
