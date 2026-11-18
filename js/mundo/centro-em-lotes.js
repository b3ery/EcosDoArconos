/**
 * ECOS DO ARCANO — centro-em-lotes.js
 * O centro de Cinzaluz também segue o padrão dos lotes (estilo The Sims):
 *  - SUA CASA ganha o lote: cerca de madeira, quintal nos fundos (porão,
 *    lenha, varal, horta, galinheiro, colmeia, latrina) com portãozinho
 *    do lado.
 *  - O CASEBRE vizinho desce uma casa para caber o lote dele: quintal
 *    cercado atrás (portão no fundo, pela rua) e o jardinzinho na frente,
 *    com a placa.
 *  - A "mansão" de 4x3 espremida ao lado da peixaria (pequena demais para
 *    ser mansão) vira o Jardim do Rio, com árvore e bancos. As mansões de
 *    verdade ficam no Alto dos Nobres, em lote grande.
 * O jogo confere que toda porta continua alcançável. Roda antes de
 * lotes-no-centro.js, que registra os lotes prontos.
 */

"use strict";

(() => {
  const Z = ZONES.vila;
  if (!Z || !Z.town) return;
  const m = Z.map.map((r) => r.split(""));
  const bld = (id) => Z.town.bld.find((b) => b.id === id);
  const set = (x, y, c) => (m[y][x] = c);

  /* ----- 1. a sua casa ----- */
  const home = bld("home");
  if (home && home.x === 3 && home.y === 15) {
    const plan = {};
    const put = (x, y, k) => (plan[x + "," + y] = k);
    for (let x = 1; x <= 7; x++) set(x, 10, "f");
    for (let y = 11; y <= 14; y++) (set(1, y, "f"), set(7, y, "f"));
    set(7, 14, "."); // portãozinho do lado, junto da casa
    for (let y = 11; y <= 14; y++) for (let x = 2; x <= 6; x++) (set(x, y, "."), put(x, y, "grama"));
    put(3, 14, "porao");
    put(6, 14, "lenha");
    put(2, 13, "varal");
    for (let x = 3; x <= 6; x++) put(x, 12, "horta");
    put(2, 11, "galinheiro");
    put(3, 11, "colmeias");
    put(6, 11, "latrina");
    home.plan = plan;
  }

  /* ----- 2. o casebre vizinho desce uma casa e ganha o lote ----- */
  const c1 = bld("c1");
  if (c1 && c1.x === 3 && c1.y === 21) {
    for (const dx of c1.door) delete Z.town.doors[dx + "," + (c1.y + c1.h - 1)];
    for (let y = c1.y; y < c1.y + c1.h; y++) for (let x = c1.x; x < c1.x + c1.w; x++) set(x, y, ".");
    c1.y = 22;
    for (let y = c1.y; y < c1.y + c1.h; y++) for (let x = c1.x; x < c1.x + c1.w; x++) set(x, y, "H");
    for (const dx of c1.door) (set(dx, c1.y + c1.h - 1, "D"), (Z.town.doors[dx + "," + (c1.y + c1.h - 1)] = c1));
    const plan = {};
    const put = (x, y, k) => (plan[x + "," + y] = k);
    for (let x = 2; x <= 7; x++) set(x, 19, "f");
    set(5, 19, "."); // portão do fundo, para a rua de cima
    for (let y = 20; y <= 25; y++) (set(2, y, "f"), set(7, y, "f"));
    for (let y = 20; y <= 21; y++) for (let x = 3; x <= 6; x++) (set(x, y, "."), put(x, y, "grama"));
    put(3, 21, "porao");
    put(6, 21, "lenha");
    put(3, 20, "galinheiro");
    put(4, 20, "horta");
    put(6, 20, "latrina");
    // jardinzinho da frente com a placa; caminho de pedra até a rua
    for (let x = 3; x <= 6; x++) {
      if (c1.door.includes(x)) {
        set(x, 25, ",");
        continue;
      }
      set(x, 25, ".");
      put(x, 25, x === 3 ? "placa" : x % 2 ? "flores" : "gramado");
    }
    c1.plan = plan;
  }

  /* ----- 3. a "mansão" espremida vira o Jardim do Rio ----- */
  const c12 = bld("c12");
  if (c12) {
    for (const dx of c12.door) delete Z.town.doors[dx + "," + (c12.y + c12.h - 1)];
    for (let y = c12.y; y < c12.y + c12.h; y++) for (let x = c12.x; x < c12.x + c12.w; x++) if ("HD".includes(m[y][x])) set(x, y, ".");
    set(c12.x + 1, c12.y, "T");
    set(c12.x + 3, c12.y + 1, "p");
    set(c12.x + 1, c12.y + 2, "b");
    set(c12.x + 2, c12.y + 2, "b");
    Z.town.bld.splice(Z.town.bld.indexOf(c12), 1);
  }

  // confere: toda porta tem que continuar alcançável a pé
  const PASS = new Set(".,PEL=gwubxhnkqAozYVZtRp".split(""));
  const W = Z.w,
    H = Z.h;
  const seen = new Uint8Array(W * H);
  const st = Z.town.arrive;
  const q = [st[1] * W + st[0]];
  seen[q[0]] = 1;
  for (let i = 0; i < q.length; i++) {
    const p = q[i],
      x = p % W,
      y = (p / W) | 0;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx,
        ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= W || ny >= H || seen[ny * W + nx] || !PASS.has(m[ny][nx])) continue;
      seen[ny * W + nx] = 1;
      q.push(ny * W + nx);
    }
  }
  const stuck = Z.town.bld.filter((b) => b.door.some((dx) => !seen[(b.y + b.h) * W + dx]));
  if (stuck.length) console.warn("centro-em-lotes: portas sem caminho", stuck.map((b) => b.id));
  Z.map = m.map((r) => r.join(""));
})();
