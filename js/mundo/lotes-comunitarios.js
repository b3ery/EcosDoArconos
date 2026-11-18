/**
 * ECOS DO ARCANO — lotes-comunitarios.js
 * No The Sims, além das casas (lotes residenciais) toda loja, templo e
 * prédio público fica num LOTE COMUNITÁRIO. Aqui também, em todas as
 * cidades e nos dois modos (História e Simulador):
 *  - cada estrutura que não é casa ganha o seu terreno marcado: sebe
 *    aparada nos fundos e dos lados, e canteiros de flores na frente, dos
 *    dois lados da porta;
 *  - só usa grama livre em volta (rua, praça e caminho continuam iguais) e
 *    o jogo confere, prédio por prédio, que nenhuma porta nem morador fica
 *    sem caminho antes de plantar a sebe.
 * No fim, todo quintal cercado que ficou sem entrada ganha um portão.
 * Modifica (envolve) drawTile e walkable.
 */

"use strict";

(() => {
  const COM = (window.COMMUNITY_LOTS = {});
  const OWNER = {}; // de qual prédio é cada pedaço de pátio
  const PASS = new Set(".,PEL=gwubxhnkqAozYVZtRp".split(""));
  // o que cada ofício deixa no próprio lote
  const KIT = {
    forja: ["bigorna", "barril", "lenha"],
    padaria: ["forno", "lenha", "barril"],
    taverna: ["mesa", "barril", "mesa"],
    templo: ["estatua", "banco"],
    estab: ["feno", "cocho", "feno"],
    peixaria: ["peixes", "barril"],
    hosp: ["ervas", "banco"],
    boticario: ["ervas", "barril"],
    clinica: ["cocho", "ervas"],
    guilda: ["quadro", "barril"],
    biblio: ["banco", "quadro"],
    escola: ["quadro", "banco"],
    castle: ["estatua", "estatua"],
    marcenaria: ["lenha", "lenha"],
    salao: ["banco"],
    atelie: ["cavalete", "banco"],
    _: ["caixotes", "carroca", "barril", "banco"],
  };
  const SKIP = new Set(["casa", "casa2", "home", "casebre", "sobrado", "mansao", "terreno"]);
  const YARD_SOLID = new Set(["porao", "lenha", "banco", "latrina", "colmeias", "galpao", "galinheiro", "poco", "forno", "pombal", "lago", "pomar", "placa", "chiqueiro"]);
  function solidPlans(Z) {
    const S = new Set();
    for (const b of Z.town.bld) if (b.plan) for (const [k, v] of Object.entries(b.plan)) if (YARD_SOLID.has(v)) S.add(k);
    return S;
  }
  function reach(Z, m, block) {
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
        if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
        const k = ny * W + nx;
        if (seen[k] || !PASS.has(m[ny][nx]) || block.has(nx + "," + ny)) continue;
        seen[k] = 1;
        q.push(k);
      }
    }
    return seen;
  }
  function goals(Z) {
    const G = [];
    for (const b of Z.town.bld) for (const dx of b.door) G.push([dx, b.y + b.h]);
    for (const k in Z.npcs || {}) {
      const [x, y] = k.split(",").map(Number);
      G.push([x, y + 1]);
    }
    return G;
  }

  function communityLots(zid) {
    const Z = ZONES[zid];
    if (!Z || !Z.town || Z.town.indoor || !Z.town.bld || !Z.map) return;
    const m = Z.map.map((r) => r.split(""));
    const W = Z.w;
    const M = (COM[zid] = new Map());
    const O = (OWNER[zid] = new Map());
    const block = solidPlans(Z);
    const G = goals(Z);
    const R0 = reach(Z, m, block);
    const okNow = () => {
      const R = reach(Z, m, block);
      return G.every(([x, y]) => !R0[y * W + x] || R[y * W + x]);
    };
    const used = new Set();
    for (const b of Z.town.bld) if (b.plan) for (const k of Object.keys(b.plan)) used.add(k);
    // não encosta em quintal nem em cerca de ninguém (para nunca tapar um portão)
    const near = (x, y) => [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => used.has(x + dx + "," + (y + dy)) || (m[y + dy] && m[y + dy][x + dx] === "f"));
    let cur = null;
    // nem encosta na parede de outro prédio (senão fecha o corredor entre os dois)
    const otherWall = (x, y) => [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => {
      const nx = x + dx,
        ny = y + dy;
      if (!"HD".includes((m[ny] || "")[nx])) return false;
      return !(cur && nx >= cur.x && nx < cur.x + cur.w && ny >= cur.y && ny < cur.y + cur.h);
    });
    const free = (x, y) => m[y] && m[y][x] === "." && !near(x, y) && !otherWall(x, y) && !M.has(x + "," + y);
    for (const b of Z.town.bld) {
      if (SKIP.has(b.style) || b.plan || b.lot) continue;
      cur = b;
      // fundos e lados: sebe
      const hedge = [];
      for (let x = b.x - 1; x <= b.x + b.w; x++) if (free(x, b.y - 1)) hedge.push([x, b.y - 1]);
      for (let y = b.y; y < b.y + b.h; y++) for (const x of [b.x - 1, b.x + b.w]) if (free(x, y)) hedge.push([x, y]);
      if (hedge.length) {
        for (const [x, y] of hedge) block.add(x + "," + y);
        if (okNow()) for (const [x, y] of hedge) M.set(x + "," + y, "sebe");
        else for (const [x, y] of hedge) block.delete(x + "," + y);
      }
      // frente: canteiros dos dois lados da porta (dá para pisar)
      for (let x = b.x - 1; x <= b.x + b.w; x++) {
        const y = b.y + b.h;
        if (b.door.some((dx) => Math.abs(dx - x) <= 1)) continue;
        if (free(x, y)) M.set(x + "," + y, (x + y) % 2 ? "canteiro" : "grama");
      }
      // no chão calçado (centro, praça, mercado): o lote é um pátio de pedra
      // com meio-fio marcando o limite; dá para pisar e não fecha rua nenhuma
      const paved = (x, y) => m[y] && m[y][x] === "," && !M.has(x + "," + y) && !used.has(x + "," + y);
      const ring = [];
      for (let x = b.x - 1; x <= b.x + b.w; x++) ring.push([x, b.y - 1], [x, b.y + b.h]);
      for (let y = b.y; y < b.y + b.h; y++) ring.push([b.x - 1, y], [b.x + b.w, y]);
      for (const [x, y] of ring) if (paved(x, y)) (M.set(x + "," + y, "patio"), O.set(x + "," + y, b));
      // floreira nos dois cantos da frente, quando o canto é calçada
      for (const x of [b.x - 1, b.x + b.w]) {
        const y = b.y + b.h;
        if (M.get(x + "," + y) === "patio" && !b.door.some((dx) => Math.abs(dx - x) <= 1)) M.set(x + "," + y, "floreira");
      }
      // cada lote com as coisas do próprio ofício (diversidade de estruturas)
      const kit = KIT[b.style] || KIT._;
      const spots = [];
      for (let y = b.y + 1; y < b.y + b.h; y++) for (const x of [b.x + b.w, b.x - 1]) if (M.get(x + "," + y) === "patio") spots.push([x, y]);
      for (let x = b.x + 1; x < b.x + b.w - 1; x += 2) if (M.get(x + "," + (b.y - 1)) === "sebe") spots.push([x, b.y - 1]);
      let n = 0;
      for (const [x, y] of spots) {
        if (n >= Math.min(3, kit.length)) break;
        const k = x + "," + y;
        const was = M.get(k);
        block.add(k);
        if (okNow()) (M.set(k, "p:" + kit[(n + b.x) % kit.length]), O.set(k, b), n++);
        else if (was !== "sebe") block.delete(k);
      }
    }
  }

  // portão em todo quintal cercado que ficou sem entrada
  function openGates(zid) {
    const Z = ZONES[zid];
    if (!Z || !Z.town || !Z.town.bld || !Z.map) return 0;
    const m = Z.map.map((r) => r.split(""));
    const W = Z.w;
    const block = solidPlans(Z);
    for (const [k, v] of COM[zid] || []) if (v === "sebe" || v.startsWith("p:")) block.add(k);
    let opened = 0;
    for (const b of Z.town.bld) {
      if (!b.plan) continue;
      const cells = Object.entries(b.plan)
        .filter(([k, v]) => !YARD_SOLID.has(v))
        .map(([k]) => k.split(",").map(Number))
        .filter(([x, y]) => y < b.y && PASS.has(m[y][x]));
      if (!cells.length) continue;
      let R = reach(Z, m, block);
      if (cells.some(([x, y]) => R[y * W + x])) continue;
      // a cerca mais perto do meio do fundo que encosta no quintal por dentro e na rua/grama por fora
      const set = new Set(cells.map(([x, y]) => x + "," + y));
      let best = null;
      for (let y = 1; y < Z.h - 1; y++)
        for (let x = 1; x < W - 1; x++) {
          if (m[y][x] !== "f") continue;
          for (const [dx, dy] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
            if (!set.has(x + dx + "," + (y + dy))) continue;
            const ox = x - dx,
              oy = y - dy;
            // do lado de fora: chão alcançável, ou uma árvore com chão alcançável logo atrás (a árvore sai)
            let tree = false;
            if (!R[oy * W + ox]) {
              if (m[oy][ox] !== "T" || !R[(oy - dy) * W + (ox - dx)]) continue;
              tree = true;
            }
            const d = Math.abs(x - (b.x + b.w / 2)) + (dy !== 0 ? 0 : 2) + (tree ? 3 : 0);
            if (!best || d < best.d) best = { x, y, d, tree: tree && [ox, oy] };
          }
        }
      if (best) {
        m[best.y][best.x] = ".";
        if (best.tree) m[best.tree[1]][best.tree[0]] = ".";
        opened++;
      }
    }
    Z.map = m.map((r) => r.join(""));
    return opened;
  }

  const zones = Object.keys(ZONES).filter((z) => z === "vila" || z === "porto" || z === "serra" || z === "solmar" || z === "rosalva" || z === "cais" || z.startsWith("pais-"));
  for (const z of zones) communityLots(z);
  window.openYardGates = () => zones.reduce((s, z) => s + openGates(z), 0);

  // desenho: sebe aparada (liga com a vizinha) e canteiro de flores
  const at = (z, x, y) => COM[z] && COM[z].get(x + "," + y);
  const dtBase = drawTile;
  drawTile = function (z, x, y, c, t) {
    dtBase.apply(this, arguments);
    const k = at(z, x, y);
    if (!k) return;
    const X = x * TILE,
      Y = y * TILE;
    const R = (a, b, w, h, col) => ((ctx.fillStyle = col), ctx.fillRect(X + a, Y + b, w, h));
    if (k.startsWith("p:")) return drawKit(k.slice(2), X, Y, R, x, y, t);
    if (k === "sebe") {
      const n = (dx, dy) => at(z, x + dx, y + dy) === "sebe";
      const l = n(-1, 0) ? 0 : 3,
        r = n(1, 0) ? 32 : 29,
        u = n(0, -1) ? 0 : 6;
      R(l + 2, u + 4, r - l, 26 - u, "rgba(0,0,0,.2)"); // sombra
      R(l, u, r - l, 26 - u, "#2e5a2a");
      R(l, u, r - l, 5, "#4a8a3a");
      R(l, u + 5, r - l, 3, "#3d7432");
      for (let i = 0; i < 6; i++) R(l + 2 + ((i * 11 + x * 7) % Math.max(1, r - l - 4)), u + 9 + ((i * 7 + y * 5) % 12), 3, 2, i % 2 ? "#5a9a46" : "#24481f");
      R(l, 24, r - l, 2, "#1e3a1a");
    } else if (k === "canteiro") {
      R(4, 14, 24, 14, "#7a7468");
      R(5, 15, 22, 10, "#5a3a22");
      for (let i = 0; i < 5; i++) (R(7 + i * 4, 13, 2, 6, "#3a6a2a"), R(6 + i * 4, 10 + (i % 2) * 2, 4, 4, ["#e86a8a", "#f2c14e", "#f6f2ea", "#b48aff", "#ff9a4a"][(i + x) % 5]));
    } else if (k === "grama") R(0, 0, 32, 32, "rgba(140,190,90,.16)");
    else if (k === "patio" || k === "floreira") {
      // pátio do lote: lajotas mais claras e meio-fio de pedra na beira do terreno
      const me = OWNER[z] && OWNER[z].get(x + "," + y);
      const own = (dx, dy) => {
        const nx = x + dx,
          ny = y + dy;
        const q = at(z, nx, ny);
        if (q === "patio" || q === "floreira" || (q && q.startsWith("p:"))) return OWNER[z].get(nx + "," + ny) === me;
        return !!me && nx >= me.x && nx < me.x + me.w && ny >= me.y && ny < me.y + me.h;
      };
      R(0, 0, 32, 32, "rgba(240,228,200,.32)");
      for (let r = 0; r < 4; r++) for (let q = 0; q < 2; q++) R(q * 16 + (r % 2) * 8, r * 8, 15, 7, (r + q + x + y) % 3 ? "rgba(255,248,230,.14)" : "rgba(120,100,70,.12)");
      const curb = "#8a8274",
        hi = "#c9c2b2";
      if (!own(0, -1)) (R(0, 0, 32, 3, curb), R(0, 0, 32, 1, hi));
      if (!own(0, 1)) (R(0, 29, 32, 3, curb), R(0, 29, 32, 1, hi));
      if (!own(-1, 0)) (R(0, 0, 3, 32, curb), R(0, 0, 1, 32, hi));
      if (!own(1, 0)) (R(29, 0, 3, 32, curb), R(31, 0, 1, 32, hi));
      if (k === "floreira") {
        R(5, 12, 22, 16, "#6e6960");
        R(6, 13, 20, 6, "#4a3020");
        for (let i = 0; i < 4; i++) (R(8 + i * 5, 9, 2, 6, "#3a6a2a"), R(7 + i * 5, 6 + (i % 2) * 2, 4, 4, ["#e86a8a", "#f2c14e", "#b48aff", "#f6f2ea"][(i + x + y) % 4]));
        R(5, 12, 22, 2, "#9a9488");
      }
    }
  };
  function drawKit(k, X, Y, R, x, y, t) {
    R(0, 0, 32, 32, "rgba(240,228,200,.22)");
    R(4, 24, 26, 6, "rgba(0,0,0,.22)"); // sombra
    const wood = "#7a5230",
      dk = "#4a2e17";
    switch (k) {
      case "bigorna":
        R(10, 22, 12, 8, wood);
        R(6, 14, 22, 6, "#4a4a54");
        R(6, 14, 22, 2, "#8a8a98");
        R(26, 15, 5, 3, "#4a4a54");
        R(12, 20, 8, 3, "#3a3a44");
        break;
      case "barril":
        R(9, 8, 14, 20, "#8a5a2e");
        R(9, 8, 4, 20, "#a8784a");
        for (const yy of [10, 17, 25]) R(8, yy, 16, 2, "#4a4a52");
        R(10, 6, 12, 3, "#6b4423");
        break;
      case "lenha":
        for (let r = 0; r < 3; r++) for (let c = 0; c < 4 - r; c++) (R(4 + c * 7 + r * 3, 22 - r * 6, 7, 6, "#8a5a2e"), R(6 + c * 7 + r * 3, 24 - r * 6, 3, 2, "#e8c890"));
        break;
      case "forno":
        R(4, 10, 24, 18, "#9a5a32");
        R(4, 10, 24, 3, "#b87a4a");
        R(10, 16, 12, 10, "#2a1a10");
        R(12, 20, 8, 5, nightAlpha() > 0.25 ? "#ff8a3a" : "#6a2a1a");
        R(20, 2, 5, 9, "#8a4a2a");
        break;
      case "mesa":
        R(4, 14, 24, 5, "#a8784a");
        R(4, 14, 24, 1, "#c9925a");
        R(6, 19, 3, 9, dk);
        R(23, 19, 3, 9, dk);
        R(9, 10, 4, 5, "#c9c0b0");
        R(19, 10, 4, 5, "#c9c0b0");
        R(10, 9, 2, 2, "#f2eee4");
        break;
      case "estatua":
        R(8, 24, 16, 6, "#8a8478");
        R(10, 20, 12, 5, "#a39d92");
        R(12, 6, 8, 15, "#c9c2b2");
        R(13, 1, 6, 6, "#c9c2b2");
        R(19, 8, 5, 3, "#c9c2b2");
        R(12, 6, 3, 15, "#e2dccd");
        break;
      case "feno":
        R(3, 12, 26, 16, "#d9b050");
        R(3, 12, 26, 3, "#f2d070");
        for (let i = 0; i < 6; i++) R(5 + i * 4, 16, 1, 10, "#a8843a");
        R(3, 18, 26, 2, "#8a6a2e");
        break;
      case "cocho":
        R(3, 16, 26, 10, wood);
        R(5, 17, 22, 5, "#3f86c7");
        R(5, 17, 22, 1, "#8ac8f0");
        R(4, 26, 3, 4, dk);
        R(25, 26, 3, 4, dk);
        break;
      case "peixes":
        R(4, 6, 2, 22, dk);
        R(26, 6, 2, 22, dk);
        R(4, 8, 24, 2, wood);
        for (let i = 0; i < 4; i++) (R(7 + i * 5, 10, 3, 9, "#9ab0c0"), R(7 + i * 5, 10, 3, 2, "#d0dce8"));
        break;
      case "ervas":
        R(4, 18, 24, 10, "#6e6960");
        R(5, 18, 22, 4, "#4a3020");
        for (let i = 0; i < 5; i++) (R(6 + i * 4, 8 + (i % 2) * 3, 2, 11, "#4a8a3a"), R(5 + i * 4, 7 + (i % 2) * 3, 4, 3, i % 2 ? "#b48aff" : "#7ac85a"));
        break;
      case "quadro":
        R(5, 22, 3, 8, dk);
        R(24, 22, 3, 8, dk);
        R(3, 6, 26, 17, wood);
        R(5, 8, 22, 13, "#c9a878");
        for (let i = 0; i < 3; i++) R(7 + i * 7, 10 + (i % 2) * 3, 6, 7, "#f2eee4");
        break;
      case "banco":
        R(3, 16, 26, 4, "#a8784a");
        R(3, 12, 26, 3, "#8a5a2e");
        R(5, 20, 3, 8, dk);
        R(24, 20, 3, 8, dk);
        break;
      case "cavalete":
        R(8, 6, 16, 14, "#f2eee4");
        R(10, 8, 12, 4, "#5a9ad0");
        R(10, 12, 12, 6, "#7ac85a");
        R(14, 20, 3, 10, dk);
        R(8, 20, 2, 10, dk);
        R(22, 20, 2, 10, dk);
        break;
      case "carroca":
        R(2, 12, 26, 9, wood);
        R(2, 12, 26, 2, "#a8784a");
        R(5, 8, 7, 5, "#c94a3a");
        R(13, 8, 7, 5, "#f2c14e");
        for (const cx of [8, 22]) (R(cx - 4, 20, 8, 8, "#3a2414"), R(cx - 1, 23, 2, 2, "#8a8a92"));
        R(27, 15, 5, 2, dk);
        break;
      default:
        // caixotes
        R(4, 14, 13, 13, "#a8784a");
        R(16, 10, 12, 17, "#8a5a2e");
        R(4, 14, 13, 2, "#c9925a");
        R(16, 10, 12, 2, "#a8784a");
        R(9, 15, 2, 12, dk);
        R(21, 11, 2, 16, "#5a3a1e");
    }
  }
  const wkBase = walkable;
  walkable = function (z, x, y) {
    const k = at(z, x, y);
    if (k === "sebe" || (k && k.startsWith("p:"))) return false;
    return wkBase.apply(this, arguments);
  };
})();
