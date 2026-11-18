/**
 * ECOS DO ARCANO — lotes-em-todos-os-reinos.js
 * O padrão de bairro do The Sims vale para TODOS os reinos: cada cidade
 * (Porto, Serra, Solmar, Rosalva e os 45 reinos além-mar) ganha, a leste,
 * uma rua principal com três bairros separados por avenidas:
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
  function addDistrict(zid, zi) {
    const z = ZONES[zid];
    if (!z || !z.town || z.town.indoor) return;
    const oldW = z.w,
      H = z.h;
    const m = z.map.map((r) => r.split(""));
    const col = oldW - 2;
    let waterTop = H - 1;
    for (let y = 1; y < H - 1; y++) if ("~=".includes(m[y][col])) (waterTop = Math.min(waterTop, y));
    const road = Math.min(26, waterTop - 3, H - 5);
    if (road < 12) return;
    const SEGS = [
      ["rich", ["L", "L"]],
      ["mid", ["M", "M", "M"]],
      ["poor", ["S", "S", "S", "S", "S", "S", "S", "S"]],
    ];
    const AV = [oldW + 1];
    for (const [, seg] of SEGS) AV.push(AV[AV.length - 1] + 2 + seg.reduce((a, k) => a + LOTES.TYPE[k].span + LOTES.GAP(k), 0));
    const W = AV[AV.length - 1] + 3;
    for (let y = 0; y < H; y++) {
      const edge = y === 0 || y === H - 1;
      const src = m[y][col];
      const ground = src === "~" ? "~" : ".";
      if (!edge && m[y][oldW - 1] === "#") m[y][oldW - 1] = ground;
      for (let x = oldW; x < W; x++) m[y].push(edge || x === W - 1 ? "#" : ground);
    }
    const set = (x, y, c) => x > 0 && y > 0 && x < W - 1 && y < H - 1 && (m[y][x] = c);
    const fill = (x0, y0, x1, y1, c) => {
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) set(x, y, c);
    };
    // a rua principal, e ela se liga à cidade velha
    fill(oldW - 1, road, W - 2, road + 1, ",");
    for (const ry of [road, road + 1])
      for (let x = oldW - 2; x > 1; x--) {
        if (",=".includes(m[ry][x])) break;
        if (!".Tgwfu".includes(m[ry][x])) break;
        m[ry][x] = ",";
      }
    for (const ax of AV) fill(ax, 2, ax + 1, road + 1, ",");
    const c = country(zid);
    const X = c && window.PAIS_X && window.PAIS_X[c];
    const nm = (i) => (X ? X.names[i % X.names.length] : NAT[(i + zi * 3) % NAT.length]);
    const E = {
      z,
      set,
      fill,
      zid,
      id: 0,
      nm: 0,
      fm: 0,
      seed: zi * 17,
      maxDepth: road - 11,
      NAMES: [0, 1].map((i) => `Mansão ${X ? "de " : "dos "}${nm(i + zi)}`),
      FAM: Array.from({ length: 12 }, (_, i) => "Família " + (X ? X.names[(i + zi) % X.names.length] + (i >= X.names.length ? "-" + FAMS[(i + zi) % FAMS.length] : "") : FAMS[(i + zi * 5) % FAMS.length])),
    };
    const KEY = { rich: "nobres", mid: "oficios", poor: "remendos" };
    const D = { rich: "o bairro dos ricos", mid: "o bairro da classe média", poor: "o bairro dos pobres" };
    LOTES.bairros[zid] = [];
    SEGS.forEach(([cls, seg], si) => {
      let x = AV[si] + 2;
      for (const k of seg) {
        LOTES.place(E, k, x, road, KEY[cls]);
        x += LOTES.TYPE[k].span + LOTES.GAP(k);
      }
      LOTES.bairros[zid].push({ k: KEY[cls], n: PT[cls][(zi + si) % PT[cls].length], d: D[cls], x0: AV[si], x1: AV[si + 1] - 1, y0: 1, y1: H - 2 });
      // a calçada do outro lado da rua mostra quem mora ali
      const y2 = road + 3;
      if (y2 >= H - 1 || m[y2][AV[si] + 3] === "~") return;
      for (let xx = AV[si] + 3; xx < AV[si + 1] - 1; xx += cls === "rich" ? 3 : 6) {
        if (m[y2][xx] !== ".") continue;
        if (cls === "rich") set(xx, y2, (xx / 3) % 2 < 1 ? "l" : "T");
        else if (cls === "mid") (set(xx, y2, "b"), set(xx + 1, y2, "b"));
      }
      if (cls === "poor") {
        if (m[y2][AV[si] + 6] === ".") set(AV[si] + 6, y2, "W");
        for (let xx = AV[si] + 3; xx < AV[si + 1] - 4; xx += 5) LOTES.mud.push([xx, road + (xx % 2), zid]);
        for (let xx = AV[si] + 10; xx < AV[si + 1] - 4; xx += 9) if (m[road + 2][xx] === "." && m[road + 2][xx + 2] === ".") LOTES.lines.push([xx, road + 2, zid]);
      }
    });
    z.map = m.map((r) => r.join(""));
    z.w = W;
    if (typeof addDoorPaths === "function") addDoorPaths(zid);
  }
  let zi = 0;
  for (const zid of Object.keys(ZONES)) if (zid === "porto" || zid === "serra" || zid === "solmar" || zid === "rosalva" || zid.startsWith("pais-")) addDistrict(zid, zi++);
})();
