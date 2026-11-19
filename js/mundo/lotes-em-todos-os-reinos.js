/**
 * ECOS DO ARCANO — lotes-em-todos-os-reinos.js
 * O padrão de bairro do The Sims vale para TODOS os reinos: cada cidade
 * (Porto, Serra, Solmar, Rosalva e os 45 reinos além-mar) ganha, a leste,
 * a Rua do Comércio e três bairros, cada um numa rua, e fica do tamanho de
 * Cinzaluz (176x87). Bairros:
 *  - o bairro dos ricos: dois lotes grandes com mansão, quintal fundo,
 *    alameda de árvores e lampiões na calçada;
 *  - o bairro da classe média: três lotes médios com casa, horta e bancos;
 *  - o bairro dos pobres: oito casinhas geminadas de dois andares (uma
 *    família embaixo, outra em cima), lama, varal e poço comunitário.
 * Usa LOTES.place (bairro-dos-lotes.js), então quintal, porão, placa e
 * moradores funcionam igual em todo lugar.
 */

"use strict";

(() => {
  if (typeof LOTES === "undefined") return;
  const PT = {
    rich: ["Alto dos Nobres", "Colina dos Mercadores", "Largo dos Burgueses", "Jardins do Conde", "Alameda dos Barões"],
    mid: ["Rua dos Ofícios", "Rua dos Artesãos", "Travessa das Guildas", "Rua do Mercado Velho", "Rua dos Tecelões"],
    poor: ["Beco dos Remendos", "Cortiço da Ribeira", "Viela dos Pobres", "Beco da Lama", "Travessa do Pão Duro"],
  };
  const NAT = ["Albuquerque", "Valmor", "Pedralva", "Rosacruz", "Trovador", "Meirelles", "Castro", "Sá", "Vasconcelos", "Montenegro"];
  const FAMS = ["Ferreira", "Moleiro", "Pastora", "Tecelã", "Lenhador", "Vinhal", "Ribeiro", "Oleira", "Carvalho", "Bento", "Rosário", "Sardinha", "Pereira", "Lagoa", "Freitas", "Quaresma"];
  const country = (zid) => (zid.startsWith("pais-") ? zid.split("-")[1] : null);
  window.lotCountry = country;
  /* A cidade fica do MESMO TAMANHO de Cinzaluz (176x87), montada como ela:
     a cidade velha (castelo, praça, comércio) no canto de cima; a leste a
     RUA DO COMÉRCIO; embaixo os bairros em quarteirões (ricos, classe média
     e pobres), cada um numa rua; o espaço livre vira o grande parque do rio
     (preencher-mapas.js). Nas cidades de mar, o mar continua embaixo da
     cidade velha (uma baía) e os bairros ficam do lado. */
  const TW = 176,
    TH = 87;
  const SHOPS = [
    ["padaria", "Padaria"],
    ["alfaiate", "Alfaiataria"],
    ["boticario", "Boticário"],
    ["livraria", "Livraria"],
    ["forja", "Forja"],
    ["acougue", "Açougue"],
    ["armazem", "Armazém"],
    ["tecidos", "Loja de Tecidos"],
  ];
  const NEED = { L: 18, M: 15, S: 7 }; // linhas acima da rua que cada lote ocupa (com a cerca)
  function addDistrict(zid, zi) {
    const z = ZONES[zid];
    if (!z || !z.town || z.town.indoor) return;
    const oldW = z.w,
      oldH = z.h;
    const W = Math.max(TW, oldW + 50),
      H = Math.max(TH, oldH + 50);
    const old = z.map.map((r) => r.split(""));
    // o mar da cidade velha continua para baixo (baía); terra vira grama
    const seaCol = (x) => "~=".includes(old[oldH - 2][x]);
    const sea = Array.from({ length: oldW }, (_, x) => x > 0 && seaCol(x));
    const isSeaTown = sea.filter(Boolean).length > oldW * 0.4;
    const m = [];
    for (let y = 0; y < H; y++) {
      const row = [];
      for (let x = 0; x < W; x++) {
        const edge = x === 0 || y === 0 || x === W - 1 || y === H - 1;
        if (y < oldH && x < oldW) {
          let c = old[y][x];
          // as paredes velhas da direita e de baixo somem (a cidade continua)
          if (c === "#" && !edge && (x === oldW - 1 || y === oldH - 1)) c = y === oldH - 1 ? (sea[x] || isSeaTown ? "~" : ".") : "~=".includes(old[y][x - 1]) ? "~" : ".";
          row.push(c);
        } else row.push(edge ? "#" : x < oldW && (isSeaTown || sea[x]) && y >= oldH ? "~" : ".");
      }
      m.push(row);
    }
    const set = (x, y, c) => x > 0 && y > 0 && x < W - 1 && y < H - 1 && (m[y][x] = c);
    const fill = (x0, y0, x1, y1, c) => {
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) set(x, y, c);
    };
    const road2 = (x0, x1, y) => fill(x0, y, x1, y + 1, ",");
    const ave = (x, y0, y1) => fill(x, y0, x + 1, y1, ",");
    // sobe/anda até achar a rua da cidade velha
    const reachOld = (x, y, dx, dy) => {
      for (let k = 0; k < 60; k++) {
        const c = m[y] && m[y][x];
        if (c === undefined || c === "#") return;
        if (",=".includes(c) && k > 0) return;
        if (!".Tgwfu~".includes(c)) return;
        for (const o of [0, 1]) {
          const xx = x + (dy ? o : 0),
            yy = y + (dx ? o : 0);
          if (m[yy] && ".Tgwfu".includes(m[yy][xx])) m[yy][xx] = ",";
          else if (m[yy] && m[yy][xx] === "~") m[yy][xx] = "=";
        }
        x += dx;
        y += dy;
      }
    };
    z.map = m.map((r) => r.join(""));
    z.w = W;
    z.h = H;
    const c = country(zid);
    const X = c && window.PAIS_X && window.PAIS_X[c];
    const nm = (i) => (X ? X.names[i % X.names.length] : NAT[(i + zi * 3) % NAT.length]);
    const E = {
      z,
      set: (x, y, ch) => set(x, y, ch),
      fill,
      zid,
      id: 0,
      nm: 0,
      fm: 0,
      seed: zi * 17,
      maxDepth: 99,
      NAMES: [0, 1, 2, 3, 4].map((i) => `Mansão ${X ? "de " : "dos "}${nm(i + zi)}`),
      FAM: Array.from({ length: 24 }, (_, i) => "Família " + (X ? X.names[(i + zi) % X.names.length] + (i >= X.names.length ? "-" + FAMS[(i + zi) % FAMS.length] : "") : FAMS[(i + zi * 5) % FAMS.length])),
    };
    const KEY = { rich: "nobres", mid: "oficios", poor: "remendos", shop: "comercio" };
    const D = { rich: "o bairro dos ricos", mid: "o bairro da classe média", poor: "o bairro dos pobres", shop: "a rua do comércio" };
    const PN = Object.assign({ shop: ["Rua do Comércio", "Rua dos Mercadores", "Largo da Feira", "Rua das Lojas", "Rua do Mercado"] }, PT);
    LOTES.bairros[zid] = [];
    /** Uma rua com lotes lado a lado acima dela, de x0 até no máximo x1. Devolve até onde foi. */
    const band = (cls, kinds, x0, x1, top) => {
      const need = Math.max(...kinds.map((k) => NEED[k]));
      const road = top + need;
      if (road + 2 >= H - 1) return null;
      let x = x0 + 1,
        n = 0;
      for (const k of kinds) {
        const T = LOTES.TYPE[k];
        if (x + T.span > x1) break;
        const before = z.town.bld.length;
        LOTES.place(E, k, x, road, KEY[cls]);
        if (cls === "shop") {
          const b = z.town.bld[before];
          if (b) {
            const [st, nmS] = SHOPS[(n + zi) % SHOPS.length];
            b.style = st;
            b.name = `${nmS} ${X ? "de " : "dos "}${nm(n + zi * 2)}`;
            b.lotFam = b.name;
            b.shop = true;
          }
        }
        x += T.span + LOTES.GAP(k);
        n++;
      }
      const xEnd = Math.min(x1, x + 1);
      road2(x0 - 1, xEnd, road);
      LOTES.bairros[zid].push({ k: KEY[cls], n: PN[cls][(zi + n) % PN[cls].length], d: D[cls], x0, x1: xEnd, y0: top, y1: road + 1 });
      return { road, xEnd, n };
    };
    // 1) RUA DO COMÉRCIO, a leste da cidade velha
    const ex0 = oldW + 2,
      ex1 = W - 3;
    const shopRow = band("shop", ["M", "M", "M", "M", "M", "M", "M", "M"], ex0, ex1, 2);
    if (shopRow) {
      // a rua do comércio entra na cidade velha
      reachOld(ex0 - 2, shopRow.road, -1, 0);
      // (sem avenida subindo até o muro: ela ficaria sem saída)
    }
    // 2) os bairros embaixo, cada classe numa rua
    const bx0 = isSeaTown ? oldW + 2 : 3,
      bx1 = W - 3;
    let top = Math.max(oldH + 1, shopRow ? shopRow.road + 3 : oldH + 1);
    if (isSeaTown) top = shopRow ? shopRow.road + 3 : 2;
    const rows = [];
    for (const [cls, kinds] of [
      ["rich", Array(5).fill("L")],
      ["mid", Array(11).fill("M")],
      ["poor", Array(26).fill("S")],
    ]) {
      const r = band(cls, kinds, bx0, bx1, top);
      if (!r) break;
      rows.push(r);
      // calçada: lampiões e árvores nos ricos, bancos na classe média, poço e varal nos pobres
      const y2 = r.road + 2;
      if (y2 < H - 1)
        for (let xx = bx0 + 2; xx < r.xEnd - 1; xx += cls === "rich" ? 3 : 7) {
          if (m[y2][xx] !== ".") continue;
          if (cls === "rich") set(xx, y2, (xx / 3) % 2 < 1 ? "l" : "T");
          else if (cls === "mid") set(xx, y2, "b");
        }
      if (cls === "poor") {
        if (m[r.road + 2] && m[r.road + 2][bx0 + 6] === ".") set(bx0 + 6, r.road + 2, "W");
        for (let xx = bx0 + 3; xx < r.xEnd - 4; xx += 5) LOTES.mud.push([xx, r.road + (xx % 2), zid]);
      }
      top = r.road + 3;
    }
    // avenida do bairro: liga as ruas dos bairros entre si e com a cidade velha
    if (rows.length) {
      const last = rows[rows.length - 1].road + 1;
      const axL = bx0 - 1;
      ave(axL, isSeaTown ? 2 : oldH - 2, last);
      if (!isSeaTown) reachOld(axL, oldH - 2, 0, -1);
      // e uma segunda avenida no fim das ruas (do lado leste)
      const axR = Math.min(W - 4, Math.max(...rows.map((r) => r.xEnd)) + 1);
      ave(axR, rows[0].road, last);
      if (shopRow) ave(axR, shopRow.road, rows[0].road);
    }
    z.map = m.map((r) => r.join(""));
    if (typeof addDoorPaths === "function") addDoorPaths(zid);
  }
  let zi = 0;
  for (const zid of Object.keys(ZONES)) if (zid === "porto" || zid === "serra" || zid === "solmar" || zid === "rosalva" || zid.startsWith("pais-")) addDistrict(zid, zi++);
})();
