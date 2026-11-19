/**
 * ECOS DO ARCANO — ruas-ligadas.js
 * Roda POR ÚLTIMO, depois de tudo que mexe no mapa das cidades: toda rua
 * (trecho de 2 blocos) termina em outra rua, no muro, numa porta ou na água.
 * Nunca apaga nada: segue reto, contorna pela grama ou fecha com um balão.
 * A rua que afina para 1 bloco ganha o segundo bloco onde houver espaço.
 */

"use strict";

(() => {
  const zones = Object.keys(ZONES).filter((z) => ["vila", "porto", "serra", "solmar", "rosalva"].includes(z) || z.startsWith("pais-"));
  /* ----- PASSE FINAL: toda RUA (trecho de 2 blocos) termina em outra rua, no muro,
     numa porta ou na água. Nunca apaga nada: só segue reto, contorna pela grama,
     ou, em último caso, fecha com o balão de retorno. ----- */
  const endFix = { reto: 0, contorno: 0, balao: 0, largura: 0 };
  for (const zid of zones) {
    const Z = ZONES[zid];
    if (!Z || !Z.town || !Z.map) continue;
    const W = Z.w,
      H = Z.h;
    const m = Z.map.map((r) => r.split(""));
    const C = window.COMMUNITY_LOTS && COMMUNITY_LOTS[zid];
    const plans = new Set();
    for (const b of Z.town.bld) if (b.plan) for (const k of Object.keys(b.plan)) plans.add(k);
    const lot = (x, y) => plans.has(x + "," + y) || !!(C && C.has(x + "," + y));
    const inB = (x, y) => Z.town.bld.some((b) => x >= b.x && x < b.x + b.w && y >= b.y && y < b.y + b.h);
    const R = (x, y) => m[y] && ",=".includes(m[y][x]) && !(C && C.has(x + "," + y));
    const open = (x, y) => x > 0 && y > 0 && x < W - 1 && y < H - 1 && ".wTg".includes(m[y][x]) && !lot(x, y) && !inB(x, y) && !(Z.npcs && Z.npcs[x + "," + y]);
    const D4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    // pedaço de lote (pátio) que ficou no meio da rua, com rua dos dois lados: volta a ser rua
    if (C)
      for (const [k, v] of [...C]) {
        if (v !== "patio" && v !== "floreira") continue;
        const [x, y] = k.split(",").map(Number);
        if (!",".includes(m[y][x])) continue;
        const r2 = (a, c) => m[c] && ",=".includes(m[c][a]) && !C.has(a + "," + c);
        if ((r2(x - 1, y) && r2(x + 1, y)) || (r2(x, y - 1) && r2(x, y + 1))) C.delete(k);
      }
    // banco que ficou no meio de uma rua (rua dos dois lados) sai
    for (let y = 1; y < H - 1; y++)
      for (let x = 1; x < W - 1; x++)
        if (m[y][x] === "b" && ((R(x - 1, y) && R(x + 1, y)) || (R(x, y - 1) && R(x, y + 1))) && D4.filter(([a, c]) => R(x + a, y + c)).length >= 3) m[y][x] = ",";
    // túmulo e página no chão da rua contam como rua (estão em cima dela)
    const Rt = (x, y) => R(x, y) || (m[y] && "zP".includes(m[y][x]) && D4.filter(([a, c]) => R(x + a, y + c)).length >= 2);
    // buraco de grama de 1 bloco no meio de uma rua vira rua
    for (let y = 1; y < H - 1; y++)
      for (let x = 1; x < W - 1; x++) if (m[y][x] === "." && !lot(x, y) && R(x - 1, y) && R(x + 1, y) && (R(x, y - 1) || R(x, y + 1))) m[y][x] = ",";
    const thick = () => {
      const T = new Uint8Array(W * H);
      for (let y = 0; y < H - 1; y++)
        for (let x = 0; x < W - 1; x++) if (Rt(x, y) && Rt(x + 1, y) && Rt(x, y + 1) && Rt(x + 1, y + 1)) T[y * W + x] = T[y * W + x + 1] = T[(y + 1) * W + x] = T[(y + 1) * W + x + 1] = 1;
      return T;
    };
    const ends = (T) => {
      const t = (x, y) => x >= 0 && y >= 0 && x < W && y < H && T[y * W + x];
      const L = [];
      for (let y = 1; y < H - 1; y++)
        for (let x = 1; x < W - 1; x++) {
          if (!t(x, y)) continue;
          for (const [dx, dy] of D4) {
            if (t(x + dx, y + dy) || !t(x - dx, y - dy)) continue;
            const f = (m[y + dy] || "")[x + dx];
            if (f === "#" || f === undefined || f === "D" || f === "~" || f === "=" || f === "C") continue;
            // T: na ponta, a rua encontra outra que passa de lado
            {
              const sx0 = dy ? 1 : 0,
                sy0 = dx ? 1 : 0;
              if ((R(x - sx0, y - sy0) && R(x - 2 * sx0, y - 2 * sy0)) || (R(x + 2 * sx0, y + 2 * sy0) && R(x + 3 * sx0, y + 3 * sy0))) continue;
            }
            if ([1, 2, 3].some((k) => {
              const c = (m[y + dy * k] || "")[x + dx * k];
              return c === "#" || c === undefined || c === "~";
            })) continue;
            const sx = dy ? 1 : 0,
              sy = dx ? 1 : 0;
            let len = 0;
            for (let k = 1; k <= 8; k++) if (t(x - dx * k, y - dy * k)) len++;
            else break;
            if (len < 6) continue;
            // rua de exatamente 2 blocos: o par do lado termina junto, e de fora dos dois lados não é rua
            if (!t(x + sx, y + sy) || t(x + sx + dx, y + sy + dy)) continue;
            if (t(x - sx, y - sy) || t(x + 2 * sx, y + 2 * sy)) continue;
            // e a rua vem de trás com os dois blocos por 6 (não é a beira de uma praça)
            let ok6 = true;
            for (let k = 1; k <= 6 && ok6; k++) if (!t(x + sx - dx * k, y + sy - dy * k) || t(x - sx - dx * k, y - sy - dy * k) || t(x + 2 * sx - dx * k, y + 2 * sy - dy * k)) ok6 = false;
            if (!ok6) continue;
            L.push({ x, y, dx, dy, sx, sy });
          }
        }
      return L;
    };
    const paint2 = (x, y, E) => {
      for (const k of [0, 1]) {
        const a = x + E.sx * k,
          b = y + E.sy * k;
        if (open(a, b) || R(a, b)) m[b][a] = m[b][a] === "=" ? "=" : ",";
      }
    };
    for (let pass = 0; pass < 5; pass++) {
      const T = thick();
      const L = ends(T);
      if (!L.length) break;
      let changed = false;
      for (const E of L) {
        // 0) a rua continua, mas afina para 1 bloco: alarga do lado onde couber
        const fx = E.x + E.dx,
          fy = E.y + E.dy;
        if (R(fx, fy) || R(fx + E.sx, fy + E.sy)) {
          let n = 0;
          for (let k = 1; k <= 24; k++) {
            const x = E.x + E.dx * k,
              y = E.y + E.dy * k;
            const a = R(x, y),
              c = R(x + E.sx, y + E.sy);
            if (!a && !c) break;
            if (a && c) continue;
            if (!a && open(x, y)) ((m[y][x] = ","), n++);
            else if (!c && open(x + E.sx, y + E.sy)) ((m[y + E.sy][x + E.sx] = ","), n++);
            else if (!a && open(x - E.sx, y - E.sy)) ((m[y - E.sy][x - E.sx] = ","), n++);
            else if (a && !c && open(x - E.sx, y - E.sy)) ((m[y - E.sy][x - E.sx] = ","), n++); // desvia do poço/obstáculo
            else break;
          }
          if (n) {
            endFix.largura++;
            changed = true;
          }
          continue;
        }
        // 1) reto, com os 2 blocos, até encontrar rua, muro ou água
        const line = [];
        let ok = false;
        for (let k = 1; k <= 20; k++) {
          const x = E.x + E.dx * k,
            y = E.y + E.dy * k;
          const c1 = (m[y] || "")[x],
            c2 = (m[y + E.sy] || "")[x + E.sx];
          if (c1 === "#" || c1 === undefined || c1 === "~") {
            ok = k > 1;
            break;
          }
          if (R(x, y) || R(x + E.sx, y + E.sy)) {
            ok = true;
            line.push([x, y]);
            break;
          }
          if (!(open(x, y) && open(x + E.sx, y + E.sy))) break;
          line.push([x, y]);
        }
        if (ok) {
          for (const [x, y] of line) paint2(x, y, E);
          endFix.reto++;
          changed = true;
          continue;
        }
        // 2) contorna pela grama (caminho de 2) até uma rua que não seja ela mesma
        const near = new Set();
        {
          const q = [[E.x, E.y, 0]];
          near.add(E.x + "," + E.y);
          for (let i = 0; i < q.length; i++) {
            const [x, y, d] = q[i];
            if (d >= 12) continue;
            for (const [a, b] of D4) {
              const k = x + a + "," + (y + b);
              if (near.has(k) || !R(x + a, y + b)) continue;
              near.add(k);
              q.push([x + a, y + b, d + 1]);
            }
          }
        }
        const fit = (x, y) => open(x, y) && (open(x + 1, y) || R(x + 1, y)) && (open(x, y + 1) || R(x, y + 1));
        const prev = new Map();
        let q = [],
          hit = null;
        for (const [a, b] of [[E.dx, E.dy], [E.dx + E.sx, E.dy + E.sy], [-E.sx, -E.sy], [2 * E.sx, 2 * E.sy], [E.dx - E.sx, E.dy - E.sy], [E.dx + 2 * E.sx, E.dy + 2 * E.sy]]) {
          const st = [E.x + a, E.y + b];
          if (fit(...st) && !prev.has(st.join(","))) (prev.set(st.join(","), null), q.push(st));
        }
        for (let d = 0; d < 40 && q.length && !hit; d++) {
          const nq = [];
          for (const [x, y] of q) {
            for (const [a, b] of D4) {
              const nx = x + a,
                ny = y + b,
                k = nx + "," + ny;
              if (prev.has(k)) continue;
              if (R(nx, ny) && !near.has(k)) {
                hit = [x, y];
                break;
              }
              if (!fit(nx, ny)) continue;
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
            for (const [a, b] of [[0, 0], [1, 0], [0, 1], [1, 1]]) if (open(x + a, y + b)) m[y + b][x + a] = ",";
            c = prev.get(x + "," + y);
          }
          endFix.contorno++;
          changed = true;
          continue;
        }
        // 3) balão de retorno na ponta (3x3 com o banco no meio)
        const cx = E.x + E.dx * 2 + (E.dy ? 0 : 0),
          cy = E.y + E.dy * 2;
        const cells = [];
        for (let b = -2; b <= 3; b++) for (let a = -2; a <= 3; a++) if ((a - 0.5) ** 2 + (b - 0.5) ** 2 <= 7.5) cells.push([cx + a - (E.dx < 0 ? 1 : 0), cy + b - (E.dy < 0 ? 1 : 0)]);
        const okc = cells.filter(([x, y]) => open(x, y));
        if (okc.length >= 10) {
          for (const [x, y] of okc) m[y][x] = ",";
          endFix.balao++;
          changed = true;
        }
      }
      if (!changed) break;
    }
    Z.map = m.map((r) => r.join(""));
  }
  window.END_FIX = endFix;
})();
