/**
 * ECOS DO ARCANO — bairro-dos-lotes.js
 * O Bairro dos Lotes, planejado como os lotes do The Sims: cada casa tem o
 * seu terreno retangular, cercado, de frente para a rua.
 *  - RECUO: a casa não encosta na rua. Na frente fica um jardim com
 *    caminho de pedra da rua até a porta e uma placa com o nome da família.
 *  - QUINTAL nos fundos, com o que as casas medievais tinham de verdade:
 *    latrina no fundo do terreno, colmeias, lenha, banco e mesa, varal,
 *    galpão de ferramentas, alçapão do porão, horta de ervas, galinheiro ou
 *    chiqueiro. Mansão ainda tem poço, forno de pão, pombal e lago de peixes.
 *  - TAMANHOS: lote GRANDE (mansão, 13 de largura e quintal fundo), MÉDIO
 *    (casa, 9 de largura) e PEQUENO (casinha geminada, 4 de largura, só o
 *    jardinzinho da frente e um vizinho morando em cima).
 * O mapa cresce 60 colunas para caber tudo com folga. O desenho do quintal
 * fica em chao-suave.js; usar as coisas do quintal fica em quintais.js.
 */

"use strict";

const LOTES = { lots: [] };
(function expandLotes() {
  const z = ZONES.vila;
  const ADD = 60,
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
  const X0 = oldW + 1;
  // ruas: três de leste a oeste e três avenidas de norte a sul
  for (const y of [26, 44, 60]) fill(oldW - 2, y, W - 2, y + 1, ",");
  m[26][W - 1] = ",";
  m[27][W - 1] = ",";
  const AV = [X0, X0 + 29, W - 3];
  fill(X0, 52, W - 3, 52, ","); // o beco de trás: uma linha só, apertado
  for (const ax of AV) fill(ax, 2, ax + 1, 61, ",");
  const TYPE = {
    L: { w: 8, h: 5, span: 13, depth: 7, style: "casa2", big: true },
    M: { w: 5, h: 4, span: 9, depth: 6, style: "casa" },
    S: { w: 3, h: 4, span: 3, depth: 0, style: "casa", small: true },
  };
  // três bairros, um por rua: ricos no alto, classe média no meio, pobres embaixo
  const BANDS = [
    { road: 26, bairro: "nobres", segs: [["L", "L"], ["L", "L"]] },
    { road: 44, bairro: "oficios", segs: [["M", "M", "M"], ["M", "M", "M"]] },
    { road: 52, bairro: "remendos", alley: true, segs: [["S", "S", "S", "S", "S", "S", "S", "S"], ["S", "S", "S", "S", "S", "S", "S", "S"]] },
    { road: 60, bairro: "remendos", segs: [["S", "S", "S", "S", "S", "S", "S", "S"], ["S", "S", "S", "S", "S", "S", "S", "S"]] },
  ];
  LOTES.bairros = {
    nobres: { n: "Alto dos Nobres", d: "o bairro dos ricos", y0: 2, y1: 27 },
    oficios: { n: "Rua dos Ofícios", d: "o bairro da classe média", y0: 28, y1: 45 },
    remendos: { n: "Beco dos Remendos", d: "o bairro dos pobres", y0: 46, y1: 61 },
    x0: X0,
    x1: W - 2,
  };
  const NAMES = ["Mansão dos Valmor", "Mansão Rosacruz", "Mansão dos Albuquerque", "Mansão Pedralva", "Mansão dos Trovador"];
  const FAM = ["Família Ferreira", "Família Moleiro", "Família Pastora", "Família Tecelã", "Família Lenhador", "Família Vinhal", "Família Ribeiro", "Família Oleira", "Família Carvalho", "Família Bento", "Família Rosário", "Família Sardinha"];
  let id = 0,
    nm = 0,
    fm = 0;
  const hs = (a, b) => (((a * 73856093) ^ (b * 19349663)) >>> 0) % 1000 / 1000;
  for (const band of BANDS) {
    band.segs.forEach((seg, si) => {
      let x = AV[si] + 2;
      const limit = AV[si + 1] - 1;
      for (const k of seg) {
        const T = TYPE[k];
        if (x + T.span > limit) break;
        const lx0 = x,
          lx1 = x + T.span - 1;
        const by = band.road - (T.small ? 2 : 3) - T.h + 1; // ricos e médios: 2 linhas de jardim; pobres: só a soleira
        const bx = lx0 + Math.floor((T.span - T.w) / 2);
        const b = { id: "lt" + id++, style: T.style, x: bx, y: by, w: T.w, h: T.h, door: [bx + Math.floor(T.w / 2)], lot: true };
        if (T.big) ((b.big = true), (b.name = NAMES[nm++ % NAMES.length]));
        if (T.small) ((b.small = true), (b.flats = true));
        const fam = T.big ? b.name : FAM[fm++ % FAM.length];
        const top = by - T.depth;
        // cerca do lote (lados e fundo); a frente fica aberta no caminho
        if (!T.small) {
          for (let y = top - 1; y <= band.road - 1; y++) (set(lx0, y, "f"), set(lx1, y, "f"));
          fill(lx0, top - 1, lx1, top - 1, "f");
          for (let xx = lx0; xx <= lx1; xx++) if (Math.abs(xx - b.door[0]) > 0) set(xx, band.road - 1, "f");
        }
        fill(b.x, b.y, b.x + b.w - 1, b.y + b.h - 1, "H");
        set(b.door[0], b.y + b.h - 1, "D");
        z.town.doors[b.door[0] + "," + (b.y + b.h - 1)] = b;
        // caminho de pedra da porta até a rua
        for (let y = b.y + b.h; y < band.road; y++) set(b.door[0], y, ",");
        z.town.bld.push(b);
        // plano do quintal
        const plan = {};
        if (!T.small) {
          const ix0 = lx0 + 1,
            ix1 = lx1 - 1;
          const cells = [];
          for (let y = top; y < by; y++) for (let xx = ix0; xx <= ix1; xx++) cells.push([xx, y]);
          const put = (xx, y, kind) => (plan[xx + "," + y] = kind);
          const h0 = hs(lx0, band.road);
          // junto da casa: porão, lenha, banco e mesa, varal
          put(bx, by - 1, "porao");
          put(bx + T.w - 1, by - 1, "lenha");
          if (T.w >= 5) put(bx + 2, by - 1, "banco");
          if (ix1 - ix0 >= 6) put(ix0, by - 1, "varal");
          // meio: horta de ervas e canteiros
          for (let xx = ix0 + 1; xx <= ix1 - 1; xx++) put(xx, by - 3, h0 < 0.5 ? "ervas" : "horta");
          if (T.depth >= 6) for (let xx = ix0 + 1; xx <= ix1 - 1; xx++) put(xx, by - 4, h0 < 0.5 ? "horta" : "flores");
          // fundo: latrina num canto, colmeias, galpão, bichos
          put(ix1, top, "latrina");
          put(ix0, top, "galpao");
          put(ix0 + 1, top, h0 < 0.6 ? "colmeias" : "galinheiro");
          if (ix1 - ix0 >= 4) put(ix1 - 2, top, h0 < 0.4 ? "chiqueiro" : "galinheiro");
          if (T.big) {
            put(ix0 + 2, top + 1, "poco");
            put(ix1 - 1, by - 2, "forno");
            put(ix0 + 4, top, "pombal");
            for (let xx = ix0 + 5; xx <= ix0 + 7; xx++) (put(xx, top + 1, "lago"), put(xx, top + 2, "lago"));
            put(ix1 - 1, top + 2, "pomar");
            put(ix1 - 2, top + 2, "pomar");
          }
          for (const [xx, y] of cells) if (!plan[xx + "," + y]) plan[xx + "," + y] = "grama";
        }
        // jardim da frente: flores dos lados do caminho e a placa da família
        const front = [];
        for (let y = b.y + b.h; y < band.road - (T.small ? 0 : 1); y++)
          for (let xx = lx0 + (T.small ? 0 : 1); xx <= lx1 - (T.small ? 0 : 1); xx++) if (xx !== b.door[0]) front.push([xx, y]);
        for (const [xx, y] of front) plan[xx + "," + y] = T.small ? ((xx * 3 + y) % 4 === 0 ? "caixotes" : "lama") : (xx + y) % 3 === 0 ? "flores" : "gramado";
        if (front.length) plan[front[0][0] + "," + front[0][1]] = "placa";
        b.plan = plan;
        LOTES.lots.push({ b, fam, x0: lx0, x1: lx1, top, road: band.road, size: k, bairro: band.bairro });
        x += T.span + 1; // um respiro entre uma casa e outra
      }
    });
  }
  // a cara de cada rua
  for (let x = X0 + 3; x < W - 4; x += 4) {
    if (AV.some((a) => x >= a - 1 && x <= a + 2)) continue;
    if (m[24][x] === "f" || m[24][x] === ".") 0;
    set(x, 28, x % 8 === 0 ? "l" : "T"); // Alto dos Nobres: alameda de árvores e lampiões do outro lado da rua
    if (x % 12 === 3) (set(x, 46, "b"), set(x + 1, 46, "b")); // Rua dos Ofícios: bancos na calçada
  }
  // Beco dos Remendos: poço comunitário e poças de lama no meio do beco
  set(AV[1] - 2, 62, "W");
  set(AV[2] - 4, 62, "W");
  LOTES.lines = [];
  for (let x = X0 + 5; x < W - 4; x += 7) LOTES.lines.push([x, 53]);
  LOTES.mud = [];
  for (let x = X0 + 4; x < W - 4; x += 5) LOTES.mud.push([x, 60 + (x % 2)]);
  z.map = m.map((r) => r.join(""));
  z.w = W;
  z.open.e = [W - 1, 26];
  if (typeof addDoorPaths === "function") addDoorPaths("vila");
})();
