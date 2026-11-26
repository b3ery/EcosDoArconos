/**
 * ECOS DO ARCANO — cercas-soltas.js
 * Roda depois de ruas-ligadas.js, no fim de tudo que mexe no mapa das cidades.
 * Alguns geradores deixavam uma fileira de cerca sozinha no meio da grama
 * (sobra de um lote ou jardim que mudou de lugar). Aqui some toda cerca reta
 * que não cerca nada: as duas pontas abertas e nenhuma casa, plantação, lote
 * ou jardim encostado. As cercas de verdade (lotes, quintais, plantações,
 * pastos) ficam como estão.
 * Também fecha a cerca onde um toco de rua furava a cerca e morria dentro de
 * uma plantação ou cercado (sem levar a nenhuma porta).
 * Exporta cercasSoltas(zid) para limpar uma cidade criada depois.
 */

"use strict";

(() => {
  const OPEN = new Set([".", "w", "T"]);
  // perto destes, a cerca tem função: casa, porta, plantação, muro, água...
  const KEEP = new Set(["H", "D", "g", "b", "#", "~", "=", "W", "p", "M", "N", "A", "S"]);
  function clean(zid) {
    const Z = ZONES[zid];
    if (!Z || !Z.town || Z.town.indoor || !Z.map || Z._cercasOk) return 0;
    Z._cercasOk = true;
    const W = Z.w,
      H = Z.h;
    const m = Z.map.map((r) => r.split(""));
    const T = (x, y) => (x < 0 || y < 0 || x >= W || y >= H ? "#" : m[y][x]);
    const C = window.COMMUNITY_LOTS && COMMUNITY_LOTS[zid];
    const PR = (window.FILLED_AREAS || {})[zid];
    const plans = new Set();
    for (const b of Z.town.bld || []) if (b.plan) for (const k of Object.keys(b.plan)) plans.add(k);
    const special = (x, y) => plans.has(x + "," + y) || (C && C.has(x + "," + y)) || (PR && PR.has(x + "," + y)) || (Z.npcs && Z.npcs[x + "," + y]);
    const seen = new Uint8Array(W * H);
    let removed = 0;
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) {
        if (seen[y * W + x] || m[y][x] !== "f") continue;
        // um pedaço de cerca ligado (4 vizinhos)
        const comp = [];
        const q = [[x, y]];
        seen[y * W + x] = 1;
        while (q.length) {
          const [a, c] = q.pop();
          comp.push([a, c]);
          for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
            const nx = a + dx,
              ny = c + dy;
            if (nx < 0 || ny < 0 || nx >= W || ny >= H || seen[ny * W + nx] || m[ny][nx] !== "f") continue;
            seen[ny * W + nx] = 1;
            q.push([nx, ny]);
          }
        }
        const row = comp.every((p) => p[1] === comp[0][1]),
          col = comp.every((p) => p[0] === comp[0][0]);
        if (!(row || col) || comp.length < 2) continue;
        // as duas pontas abertas para a grama
        const xs = comp.map((p) => p[0]),
          ys = comp.map((p) => p[1]);
        const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
        const ends = row ? [[x0 - 1, y0], [x1 + 1, y0]] : [[x0, y0 - 1], [x0, y1 + 1]];
        if (!ends.every(([a, c]) => OPEN.has(T(a, c)))) continue;
        // nada com função encostado (nem na diagonal)
        let useful = false;
        for (const [a, c] of comp) {
          for (let dy = -1; dy <= 1 && !useful; dy++)
            for (let dx = -1; dx <= 1 && !useful; dx++) {
              const ch = T(a + dx, c + dy);
              if (KEEP.has(ch) || special(a + dx, c + dy)) useful = true;
            }
          if (useful) break;
        }
        if (useful) continue;
        for (const [a, c] of comp) m[c][a] = ".";
        removed += comp.length;
      }
    // Caminho furando a cerca: um trecho de rua (1 ou 2 blocos) no meio de uma
    // linha de cerca, que entra numa plantação ou num cercado e morre lá dentro
    // (não leva a nenhuma porta). A cerca é fechada e o toco de rua sai.
    const R = (x, y) => ",=".includes(T(x, y));
    const doorNear = (sx, sy) => {
      const seen = new Set();
      const q = [[sx, sy, 0]];
      while (q.length) {
        const [a, c, d] = q.shift();
        const k = a + "," + c;
        if (seen.has(k) || d > 16) continue;
        seen.add(k);
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          if (T(a + dx, c + dy) === "D") return true;
          if (R(a + dx, c + dy)) q.push([a + dx, c + dy, d + 1]);
        }
      }
      return false;
    };
    let gates = 0;
    for (let y = 2; y < H - 2; y++)
      for (let x = 2; x < W - 2; x++) {
        if (!R(x, y)) continue;
        for (const [lx, ly] of [[0, 1], [1, 0]]) {
          const run = [[x, y]];
          if (R(x + lx, y + ly)) run.push([x + lx, y + ly]);
          const [ex, ey] = run[run.length - 1];
          // a linha de cerca continua dos dois lados do trecho (não é uma rua entre dois cercados)
          if (T(x - lx, y - ly) !== "f" || T(x - 2 * lx, y - 2 * ly) !== "f") continue;
          if (T(ex + lx, ey + ly) !== "f" || T(ex + 2 * lx, ey + 2 * ly) !== "f") continue;
          const [px, py] = [ly, lx];
          // um lado é rua (fora), o outro não (dentro do cercado)
          const sideRoad = (s) => run.every(([a, c]) => R(a + px * s, c + py * s));
          const s = sideRoad(1) && !sideRoad(-1) ? 1 : sideRoad(-1) && !sideRoad(1) ? -1 : 0;
          if (!s || run.some(([a, c]) => !".gw".includes(T(a - px * s, c - py * s)))) continue;
          if (doorNear(x, y)) continue;
          for (const [a, c] of run) m[c][a] = "f";
          // tira o toco de rua do lado de fora até encontrar a rua de verdade
          for (let k = 1; k <= 4; k++) {
            const cells = run.map(([a, c]) => [a + px * s * k, c + py * s * k]);
            if (!cells.every(([a, c]) => R(a, c))) break;
            const [fa, fb] = cells[0],
              [la, lb] = cells[cells.length - 1];
            if (R(fa - lx, fb - ly) || R(la + lx, lb + ly)) break; // chegou na rua que segue
            for (const [a, c] of cells) m[c][a] = ".";
          }
          gates++;
          break;
        }
      }
    removed += gates;
    if (removed) Z.map = m.map((r) => r.join(""));
    return removed;
  }
  window.cercasSoltas = clean;
  let total = 0;
  for (const zid of Object.keys(ZONES)) total += clean(zid);
  window.CERCAS_SOLTAS_REMOVIDAS = total;
})();
