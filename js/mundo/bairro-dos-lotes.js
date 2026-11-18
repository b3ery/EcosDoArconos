/**
 * ECOS DO ARCANO — bairro-dos-lotes.js
 * Cinzaluz cresce mais 56 colunas para o leste: o Bairro dos Lotes.
 * Referência: na vila medieval cada família tinha um lote do tamanho da sua
 * condição. Lote GRANDE (mansão): casa larga de dois andares, quintal fundo
 * (terreiro, horta, roça, bichos) e um jardim com pomar e poço. Lote MÉDIO:
 * casa com quintal. Lote PEQUENO: casinhas geminadas, coladas, sem quintal, e
 * com um vizinho morando em cima (escada de madeira por fora).
 * Três ruas de leste a oeste, ligadas por duas avenidas. Só monta o mapa; o
 * desenho dos quintais fica em chao-suave.js.
 */

"use strict";

(function expandLotes() {
  const z = ZONES.vila;
  const ADD = 56,
    oldW = z.w,
    W = oldW + ADD;
  const m = z.map.map((r) => r.split(""));
  for (let y = 0; y < z.h; y++) {
    const edge = y === 0 || y === z.h - 1;
    if (!edge && m[y][oldW - 1] === "#") m[y][oldW - 1] = ".";
    for (let x = oldW; x < W; x++) m[y].push(edge || x === W - 1 ? "#" : ".");
  }
  const set = (x, y, c) => x > 0 && y > 0 && x < W - 1 && y < z.h - 1 && (m[y][x] = c);
  const fill = (x0, y0, x1, y1, c) => {
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) set(x, y, c);
  };
  const X0 = oldW + 2;
  // ruas e avenidas
  fill(oldW - 2, 26, W - 1, 27, ",");
  m[26][W - 1] = ",";
  m[27][W - 1] = ",";
  for (const y of [44, 60]) fill(oldW - 2, y, W - 2, y + 1, ",");
  fill(X0, 2, X0 + 1, 61, ",");
  const MID = X0 + 27;
  fill(MID, 2, MID + 1, 61, ",");
  fill(W - 4, 2, W - 3, 61, ",");
  const LOT = {
    L: { w: 8, h: 5, span: 11, depth: 7, style: "casa2", big: true },
    M: { w: 5, h: 4, span: 7, depth: 5, style: "casa" },
    S: { w: 3, h: 4, span: 3, depth: 0, style: "casa", small: true },
  };
  const BANDS = [
    { bottom: 25, segs: [["L", "M", "S", "S"], ["M", "S", "S", "S", "M"]] },
    { bottom: 43, segs: [["S", "S", "S", "M", "M"], ["L", "M", "S"]] },
    { bottom: 59, segs: [["M", "L", "S", "S"], ["S", "S", "M", "L"]] },
  ];
  const NAMES = ["Mansão dos Valmor", "Mansão Rosacruz", "Mansão dos Albuquerque", "Mansão Pedralva", "Mansão dos Trovador"];
  let id = 0,
    nm = 0;
  for (const band of BANDS) {
    band.segs.forEach((seg, si) => {
      let x = si === 0 ? X0 + 3 : MID + 3;
      const limit = si === 0 ? MID - 1 : W - 5;
      for (const k of seg) {
        const L = LOT[k];
        if (x + L.span > limit + 1) break;
        const bx = x + Math.floor((L.span - L.w) / 2),
          by = band.bottom - L.h + 1;
        const b = { id: "lt" + id++, style: L.style, x: bx, y: by, w: L.w, h: L.h, door: [bx + Math.floor(L.w / 2)], depth: L.depth };
        if (L.big) ((b.big = true), (b.name = NAMES[nm++ % NAMES.length]));
        if (L.small) ((b.small = true), (b.flats = true));
        fill(b.x, b.y, b.x + b.w - 1, b.y + b.h - 1, "H");
        set(b.door[0], b.y + b.h - 1, "D");
        z.town.doors[b.door[0] + "," + (b.y + b.h - 1)] = b;
        z.town.bld.push(b);
        // jardim da mansão: além do quintal, pomar, canteiros e um poço
        if (L.big) {
          const gy0 = by - L.depth - 1,
            gy1 = Math.max(gy0 - 3, band.bottom - 16);
          for (let y = gy0; y >= gy1; y--)
            for (let xx = x; xx < x + L.span; xx++) {
              if (y < 2) continue;
              const r = (xx * 7 + y * 3) % 5;
              set(xx, y, r === 0 ? "T" : r === 2 ? "w" : ".");
            }
          set(x + Math.floor(L.span / 2), gy0 - 1, "W");
        }
        // entre os lotes médios e grandes, uma faixa de cerca viva
        if (!L.small) for (let y = by - L.depth; y < by + L.h; y++) set(x + L.span - 1, y, y < by ? "f" : ".");
        x += L.span;
      }
    });
  }
  z.map = m.map((r) => r.join(""));
  z.w = W;
  z.open.e = [W - 1, 26];
  if (typeof addDoorPaths === "function") addDoorPaths("vila");
})();
