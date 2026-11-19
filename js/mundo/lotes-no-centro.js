/**
 * ECOS DO ARCANO — lotes-no-centro.js
 * O padrão dos lotes (como no The Sims) também nas casas antigas do centro
 * de cada cidade: toda casa de morador vira um lote.
 *  - Cerca de madeira em volta do terreno (lados e fundo; a frente fica
 *    aberta para a rua, com o caminho de pedra até a porta).
 *  - Jardim na frente, com flores, gramado e a placa da família.
 *  - Quintal nos fundos com o que se tinha de verdade: alçapão do porão e
 *    lenha junto da casa, varal, horta, galinheiro ou chiqueiro, e a
 *    latrina no fundo do terreno.
 * Só usa a grama livre em volta da casa: ruas, praças, portas e o caminho
 * dos outros continuam iguais.
 */

"use strict";

(() => {
  if (typeof LOTES === "undefined") return;
  LOTES.yards = [];
  const HOMES = new Set(["casa", "casa2", "home", "pousada", "casebre", "sobrado", "mansao"]);
  const FAMS = ["Ferreira", "Moleiro", "Pastora", "Tecelã", "Lenhador", "Vinhal", "Ribeiro", "Oleira", "Carvalho", "Bento", "Rosário", "Sardinha", "Pereira", "Lagoa", "Freitas", "Quaresma", "Barros", "Coelho", "Fontes", "Macedo"];
  const hs = LOTES.hs;
  const PASS = new Set(".,PEL=gwubxhnkqAozYVZtRp".split(""));
  const SOLIDK = new Set(["porao", "lenha", "latrina", "colmeias", "galpao", "galinheiro", "pomar", "placa", "chiqueiro"]);
  // distância a pé (BFS) de um ponto até todo o mapa
  function dist(m, W, H, from, block) {
    const D = new Int32Array(W * H).fill(-1);
    const q = [from[1] * W + from[0]];
    D[q[0]] = 0;
    for (let i = 0; i < q.length; i++) {
      const p = q[i],
        x = p % W,
        y = (p / W) | 0;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx,
          ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
        const k = ny * W + nx;
        if (D[k] >= 0 || !PASS.has(m[ny][nx]) || block.has(nx + "," + ny)) continue;
        D[k] = D[p] + 1;
        q.push(k);
      }
    }
    return D;
  }
  function yardsFor(zid) {
    const Z = ZONES[zid];
    if (!Z || !Z.town || Z.town.indoor || !Z.town.bld) return;
    let m = Z.map.map((r) => r.split(""));
    const W = Z.w,
      H = Z.h;
    const used = new Set();
    const block = new Set(); // coisas sólidas do quintal (porão, latrina...)
    const start = Z.town.arrive || [Math.floor(W / 2), Math.floor(H / 2)];
    // os pontos que precisam continuar alcançáveis: frente das portas e quem fica parado (N)
    const goals = [];
    for (const b of Z.town.bld) for (const dx of b.door) goals.push([dx, b.y + b.h]);
    for (const k in Z.npcs || {}) {
      const [x, y] = k.split(",").map(Number);
      goals.push([x, y + 1], [x, y - 1], [x - 1, y], [x + 1, y]);
    }
    const doorFront = new Set();
    for (const b of Z.town.bld) for (const dx of b.door) for (let dy = 0; dy <= 1; dy++) doorFront.add(dx + "," + (b.y + b.h + dy));
    const D0 = dist(m, W, H, start, block);
    const best = (D, x, y) => {
      if (x < 0 || y < 0 || x >= W || y >= H) return -1;
      return D[y * W + x];
    };
    const ok = (D) => {
      for (const [x, y] of goals) {
        const a = best(D0, x, y);
        if (a < 0) continue;
        const b2 = best(D, x, y);
        if (b2 < 0 || b2 > a + 14) return false; // ninguém pode ficar preso nem dar volta enorme
      }
      return true;
    };
    const c = typeof lotCountry === "function" && lotCountry(zid);
    const X = c && window.PAIS_X && window.PAIS_X[c];
    let n = 0;
    const canYard = (x, y) => x > 0 && y > 0 && x < W - 1 && y < H - 1 && ".,Tw".includes(m[y][x]) && !used.has(x + "," + y) && !doorFront.has(x + "," + y);
    for (const b of Z.town.bld) {
      if (b.lot || b.plan || b.small || b.flats || !HOMES.has(b.style)) continue;
      const x0 = b.x - 1,
        x1 = b.x + b.w;
      // quantas fileiras dá para abrir atrás (até 3)
      let maxRows = 0;
      for (let dy = 1; dy <= 3; dy++) {
        let fine = true;
        for (let x = x0; x <= x1; x++) if (!canYard(x, b.y - dy)) fine = false;
        if (!fine) break;
        maxRows = dy;
      }
      let done = false;
      for (let rows = maxRows; rows >= 2 && !done; rows--) {
        const top = b.y - rows;
        const m2 = m.map((r) => r.slice());
        const plan = {};
        const put = (x, y, k) => (plan[x + "," + y] = k);
        const h0 = hs(b.x * 3 + n, b.y + zid.length);
        const ix0 = b.x,
          ix1 = b.x + b.w - 1;
        const cells = [];
        for (let y = top; y < b.y; y++) for (let x = ix0; x <= ix1; x++) cells.push([x, y]);
        const wasTree = new Set(cells.filter(([x, y]) => m[y][x] === "T").map(([x, y]) => x + "," + y));
        for (const [x, y] of cells) ((m2[y][x] = "."), put(x, y, "grama"));
        // cerca nos lados e no fundo, com um portãozinho de um lado
        const gateL = h0 < 0.5;
        for (let y = top - 1; y < b.y + 1; y++)
          for (const x of [x0, x1]) {
            if (y >= b.y) continue;
            m2[y][x] = "f"; // lote todo cercado (sem portãozinho do lado)
          }
        if (top - 1 > 0) for (let x = x0; x <= x1; x++) if (".,Tw".includes(m2[top - 1][x]) || m2[top - 1][x] === "f") m2[top - 1][x] = "f";
        put(ix0 + (gateL ? 1 : 0), b.y - 1, "porao");
        put(ix1 - (gateL ? 0 : 1), b.y - 1, "lenha");
        if (b.w >= 5) put(ix0 + 2, b.y - 1, "varal");
        if (rows >= 3) for (let x = ix0; x <= ix1; x++) put(x, b.y - 2, h0 < 0.5 ? "horta" : "ervas");
        put(ix1, top, "latrina");
        put(ix0, top, h0 < 0.35 ? "chiqueiro" : "galinheiro");
        if (b.w >= 4) put(ix0 + 1, top, h0 < 0.6 ? "colmeias" : "galpao");
        for (const k of wasTree) if (plan[k] === "grama") plan[k] = "pomar";
        const blk = new Set(block);
        for (const [k, v] of Object.entries(plan)) if (SOLIDK.has(v)) blk.add(k);
        if (!ok(dist(m2, W, H, start, blk))) continue;
        // fecha o lote como no Bairro dos Lotes: a cerca desce pelos lados da casa e
        // passa na frente, com o portão no caminho da porta (só se ninguém ficar preso)
        {
          const m3 = m2.map((r) => r.slice());
          const fy = b.y + b.h;
          const can = (x, y) => m3[y] && ".,Tw".includes(m3[y][x]) && !(x === b.door[0] && y === fy);
          for (let y = b.y; y <= fy; y++) for (const x of [x0, x1]) if (can(x, y)) m3[y][x] = "f";
          for (let x = x0; x <= x1; x++) if (x !== b.door[0] && can(x, fy)) m3[fy][x] = "f";
          // pedaço de cerca sozinho (sem vizinho de cerca) não fica: vira chão de novo
          for (let x = x0; x <= x1; x++)
            if (m3[fy][x] === "f" && m2[fy][x] !== "f" && m3[fy][x - 1] !== "f" && m3[fy][x + 1] !== "f" && m3[fy - 1][x] !== "f") m3[fy][x] = m2[fy][x];
          if (m3[fy] && m3[fy][b.door[0]] === ".") m3[fy][b.door[0]] = ",";
          const D3 = dist(m3, W, H, start, blk);
          // o quintal continua com entrada (pelo portãozinho do lado)
          if (ok(D3)) {
            b._closed = [];
            for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (m3[y][x] !== m2[y][x]) b._closed.push([x, y, m2[y][x]]);
            for (let y = 0; y < H; y++) m2[y] = m3[y];
          }
        }
        // jardim da frente, se houver grama na frente
        for (let x = b.x; x < b.x + b.w; x++) {
          const y = b.y + b.h;
          if (x !== b.door[0] && m2[y] && m2[y][x] === "." && !doorFront.has(x + "," + y)) put(x, y, (x + y) % 3 === 0 ? "flores" : "gramado");
        }
        const fr = Object.keys(plan).find((k) => plan[k] === "gramado" || plan[k] === "flores");
        if (fr) {
          plan[fr] = "placa";
          const blk2 = new Set(blk);
          blk2.add(fr);
          if (!ok(dist(m2, W, H, start, blk2))) plan[fr] = "gramado";
          else blk.add(fr);
        }
        m = m2;
        for (const k of Object.keys(plan)) used.add(k);
        for (const k of blk) block.add(k);
        b.plan = plan;
        const fam = "Família " + (X ? X.names[n % X.names.length] : FAMS[(n * 7 + zid.length) % FAMS.length]);
        LOTES.yards.push({ b, fam, zid, size: "M", center: true });
        n++;
        done = true;
      }
    }
    Z.map = m.map((r) => r.join(""));
  }
  // casas que já vieram com lote pronto (o Bairro das Flores) e os terrenos vazios
  for (const zid of Object.keys(ZONES)) {
    const Z = ZONES[zid];
    if (!Z || !Z.town || !Z.town.bld) continue;
    let k = 0;
    for (const b of Z.town.bld) if (b.plan && (!b.lot || b.planned)) LOTES.yards.push({ b, fam: b.lotFam || b.name || "Família " + FAMS[(k++ * 5 + 3) % FAMS.length], zid, size: "M", center: true });
  }
  if (typeof BAIRRO_LOTES !== "undefined") {
    ZONES.vila.town.extraPlans = ZONES.vila.town.extraPlans || [];
    for (const [id, L] of Object.entries(BAIRRO_LOTES))
      if (L.empty) {
        const b = { id: "terreno_" + id, plan: L.plan, x: L.x, y: L.y, w: L.w, h: L.h, door: [L.x], style: "terreno" };
        ZONES.vila.town.extraPlans.push(b);
        LOTES.yards.push({ b, fam: "Terreno vazio · à venda", zid: "vila", size: "M", center: true });
      }
  }
  for (const zid of Object.keys(ZONES)) if (zid === "vila" || zid === "porto" || zid === "serra" || zid === "solmar" || zid === "rosalva" || zid.startsWith("pais-")) yardsFor(zid);
})();
