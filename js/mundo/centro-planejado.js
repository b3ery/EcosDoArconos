/**
 * ECOS DO ARCANO — centro-planejado.js
 * O quarteirão velho de Cinzaluz (Sua Casa, Padaria, Taverna e vizinhos)
 * era um amontoado de prédios colados. Agora ele é planejado em LOTES,
 * como o Bairro dos Lotes e o The Sims:
 *  - duas fileiras de terrenos, cada um com cerca de madeira nos lados e
 *    nos fundos, QUINTAL atrás (porão, lenha, varal, horta, latrina...) e
 *    JARDIM na frente, com caminho de pedra até a porta e a placa;
 *  - uma rua entre as fileiras e a viela do portão norte continuam livres;
 *  - o Salão e a Marcenaria, que não cabiam mais, mudaram para a Rua dos
 *    Artesãos, no sul da vila, cada um no seu lote.
 * Roda depois de alargar-rio.js / centro-em-lotes.js / afastar-estruturas.js
 * e antes de lotes-no-centro.js e lotes-comunitarios.js.
 */

"use strict";

(() => {
  const Z = ZONES.vila;
  if (!Z || !Z.town || !Z.map) return;
  const m = Z.map.map((r) => r.split(""));
  const W = Z.w;
  const bld = (id) => Z.town.bld.find((b) => b.id === id);
  const set = (x, y, c) => x > 0 && y > 0 && x < W - 1 && y < Z.h - 1 && (m[y][x] = c);
  const fill = (x0, y0, x1, y1, c) => {
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) set(x, y, c);
  };
  const ids = ["home", "padaria", "taverna", "c1", "c2", "c3", "hLucas"];
  const B = Object.fromEntries(ids.map((id) => [id, bld(id)]));
  if (ids.some((id) => !B[id])) return;
  // a área velha: x 1..23, linhas 10..25 (fica entre o parque, o castelo, a praça e a rua de baixo)
  const X0 = 1,
    X1 = 23,
    Y0 = 10,
    Y1 = 25;
  const keep = new Set(["N", "C"]); // o bardo e o baú da rua ficam onde estão
  for (const id of ids) for (const dx of B[id].door) delete Z.town.doors[dx + "," + (B[id].y + B[id].h - 1)];
  for (let y = Y0; y <= Y1; y++) for (let x = X0; x <= X1; x++) if (!keep.has(m[y][x])) m[y][x] = ".";
  // sobra do Quartinho do Lucas velho na coluna da praça
  for (let y = 18; y <= 20; y++) if ("HD".includes(m[y][24]) && !Z.town.bld.some((q) => !ids.includes(q.id) && 24 >= q.x && 24 < q.x + q.w && y >= q.y && y < q.y + q.h)) m[y][24] = ",";
  // ruas: a viela do portão norte (x 10-11) desce até a rua do meio (linha 19);
  // a linha 10 fica livre (passagem do jardim de cima para a praça)
  fill(10, Y0, 11, 18, ",");
  for (let x = X0; x <= X1; x++) if (!keep.has(m[19][x])) m[19][x] = ",";

  /** Um lote: cerca nos lados e no fundo, quintal atrás, casa, jardim na frente (aberto para a rua). */
  function lot(b, x0, x1, top, front, kind) {
    // front = linha do jardim (logo acima da rua); a casa fica logo acima do jardim
    const by = front - b.h;
    const bx = x0 + Math.floor((x1 - x0 + 1 - b.w) / 2);
    b.x = bx;
    b.y = by;
    const door = bx + Math.floor(b.w / 2);
    b.door = [door];
    for (let y = top; y <= front; y++) (set(x0, y, "f"), set(x1, y, "f"));
    fill(x0, top, x1, top, "f");
    fill(bx, by, bx + b.w - 1, by + b.h - 1, "H");
    set(door, by + b.h - 1, "D");
    set(door, front, ",");
    Z.town.doors[door + "," + (by + b.h - 1)] = b;
    const plan = {};
    const put = (x, y, k) => x > x0 && x < x1 && y > top && (plan[x + "," + y] = k);
    const ix0 = x0 + 1,
      ix1 = x1 - 1;
    for (let y = top + 1; y < front; y++) for (let x = ix0; x <= ix1; x++) if (x < bx || x >= bx + b.w || y < by) put(x, y, "grama");
    // fundo do quintal
    const back = by - 1;
    put(bx, back, "porao");
    put(bx + b.w - 1, back, "lenha");
    if (back - 1 > top) {
      for (let x = ix0 + 1; x <= ix1 - 1; x++) put(x, back - 1, kind === "shop" ? "ervas" : "horta");
      put(ix0, top + 1, kind === "shop" ? "galpao" : "galinheiro");
      put(ix1, top + 1, "latrina");
    } else {
      put(ix0, back, "varal");
      put(ix1, back, "latrina");
    }
    if (ix1 - ix0 >= 7 && back - 1 > top) (put(ix0, back, "varal"), put(ix1, back, "colmeias"));
    // jardim da frente (flores e gramado; a placa num canto)
    for (let x = ix0; x <= ix1; x++) if (x !== door) put(x, front, (x + front) % 3 === 0 ? "flores" : "gramado");
    put(ix0, front, "placa");
    b.plan = plan;
    b.lot = true;
    return b;
  }

  // fileira de cima (linhas 11..18): Sua Casa (a porta continua em 5,17) e a Taverna
  lot(B.home, 1, 9, 11, 18, "home");
  lot(B.taverna, 12, 23, 11, 18, "shop");
  // fileira de baixo (linhas 20..25): Padaria, Casebre e o Quartinho do Lucas
  lot(B.padaria, 1, 7, 20, 25, "shop");
  lot(B.c1, 9, 15, 20, 25, "home");
  lot(B.hLucas, 17, 23, 20, 25, "home");

  // Rua dos Artesãos, no sul, para o Salão e a Marcenaria (campo livre a leste da avenida x 83-84)
  const RX0 = 101,
    RY = 73;
  const freeArea = () => {
    for (let y = 62; y <= RY + 1; y++) for (let x = RX0; x <= RX0 + 26; x++) if (!m[y] || m[y][x] !== ".") return false;
    return true;
  };
  if (W > 130 && freeArea()) {
    // a rua sai da avenida (x 83-84) e passa pelo campo até os dois lotes
    for (let y = RY; y <= RY + 1; y++) for (let x = 85; x <= RX0 + 26; x++) if (m[y][x] === ".") m[y][x] = ",";
    lot(B.c2, RX0 + 1, RX0 + 10, 64, 72, "shop");
    lot(B.c3, RX0 + 13, RX0 + 22, 64, 72, "shop");
    set(RX0 + 12, 71, "l");
    set(RX0 + 24, 71, "T");
    if (typeof LOTES !== "undefined" && LOTES.bairros && LOTES.bairros.vila)
      LOTES.bairros.vila.push({ k: "artesaos", n: "Rua dos Artesãos", d: "o salão e a marcenaria", x0: RX0, x1: RX0 + 26, y0: 63, y1: RY + 1 });
  } else {
    // sem espaço no sul: ficam onde dá na fileira de baixo (não deve acontecer)
    console.warn("centro-planejado: Rua dos Artesãos sem espaço");
  }
  // o caminho até a casa continua o mesmo ponto na rua
  Z.map = m.map((r) => r.join(""));
})();
