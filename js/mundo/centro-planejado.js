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
  lot(B.taverna, 12, 20, 11, 18, "shop");
  // rua do campo de treino: atrás dos lotes (linha 10) e descendo do lado da Taverna (x 21-23) até a praça
  for (let x = X0; x <= X1; x++) if (m[10][x] === ".") m[10][x] = ",";
  fill(21, 10, 23, 19, ",");
  set(17, 9, ",");
  set(18, 9, ",");
  // fileira de baixo (linhas 20..25): Padaria, Casebre e o Quartinho do Lucas
  lot(B.padaria, 1, 7, 20, 25, "shop");
  lot(B.c1, 9, 15, 20, 25, "home");
  lot(B.hLucas, 17, 23, 20, 25, "home");

  /* ----- quarteirão do templo (x 17..50, linhas 28..45) ----- */
  const T = ["templo", "hosp", "forja", "clinica", "c10", "atelie", "alfaiate", "c7", "c4", "c5", "c6", "c8", "c9"].map(bld);
  const moveNpc = (from, to) => {
    const k = from[0] + "," + from[1];
    if (!Z.npcs || !Z.npcs[k]) return;
    Z.npcs[to[0] + "," + to[1]] = Z.npcs[k];
    delete Z.npcs[k];
    for (const f of Z.feats || []) if (f[0] === from[0] && f[1] === from[1]) ((f[0] = to[0]), (f[1] = to[1]));
    for (const n of Z.npcList || []) if (n && n[0] === from[0] && n[1] === from[1]) ((n[0] = to[0]), (n[1] = to[1]));
    if (m[from[1]][from[0]] === "N") m[from[1]][from[0]] = ",";
    m[to[1]][to[0]] = "N";
  };
  if (T.every(Boolean) && T[0].x === 18 && T[0].y === 30) {
    for (const b of T) for (const dx of b.door) delete Z.town.doors[dx + "," + (b.y + b.h - 1)];
    const npcAt = (x, y) => Z.npcs && Z.npcs[x + "," + y];
    for (let y = 28; y <= 45; y++)
      for (let x = 17; x <= 50; x++) {
        if (npcAt(x, y)) continue;
        if (m[y][x] === "~" || m[y][x] === "=") continue;
        m[y][x] = y === 37 || y === 45 ? (m[y][x] === "W" ? "W" : ",") : ".";
      }
    const [templo, hosp, forja, clinica, escola, atelie, alfaiate, botic, acougue] = T;
    lot(templo, 17, 24, 28, 36, "shop");
    lot(hosp, 26, 32, 28, 36, "shop");
    lot(forja, 34, 40, 28, 36, "shop");
    lot(clinica, 42, 49, 28, 36, "shop");
    [escola, atelie, alfaiate, botic, acougue].forEach((b, i) => lot(b, 17 + i * 7, 22 + i * 7, 38, 44, "shop"));
    // a curandeira e o ferreiro esperam na rua, na frente da porta deles
    moveNpc([28, 34], [hosp.door[0] + 1, 37]);
    moveNpc([38, 34], [forja.door[0] + 1, 37]);
  }

  /* ----- Rua dos Artesãos, no sul: Salão, Marcenaria e os comércios que não couberam ----- */
  const RX0 = 101,
    RY = 73,
    RX1 = 165;
  const freeArea = () => {
    for (let y = 63; y <= RY + 1; y++) for (let x = RX0; x <= RX1; x++) if (!m[y] || m[y][x] !== ".") return false;
    return true;
  };
  if (W > RX1 + 3 && freeArea()) {
    // a rua sai da avenida (x 83-84) e passa pelo campo até os lotes
    for (let y = RY; y <= RY + 1; y++) for (let x = 85; x <= RX1; x++) if (m[y][x] === ".") m[y][x] = ",";
    const shops = [B.c2, B.c3].concat(["c5", "c6", "c8", "c9"].map(bld).filter((b) => b && !b.lot));
    shops.forEach((b, i) => {
      const x0 = RX0 + 1 + i * 11;
      lot(b, x0, x0 + 9, 64, 72, "shop");
      if (i % 2) set(x0 + 10, 72, "l");
    });
    if (typeof LOTES !== "undefined" && LOTES.bairros && LOTES.bairros.vila)
      LOTES.bairros.vila.push({ k: "artesaos", n: "Rua dos Artesãos", d: "o comércio do sul", x0: RX0, x1: RX1, y0: 63, y1: RY + 1 });
  } else console.warn("centro-planejado: Rua dos Artesãos sem espaço");
  Z.map = m.map((r) => r.join(""));
})();
