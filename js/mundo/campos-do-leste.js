/**
 * ECOS DO ARCANO — campos-do-leste.js
 * Cinzaluz cresce para o LESTE (34 colunas novas), com quatro bairros:
 *  - Fazendas do Norte: duas casas de sítio, dois celeiros, lavouras e o
 *    pasto cercado das vacas e ovelhas.
 *  - Rua do Comércio Novo: queijaria, tecelagem, ferraria, mercearia,
 *    doceria, boticário, sapataria e empório (todos com loja de verdade).
 *  - Praça dos Eventos: um largo calçado com palco para shows, teatro e
 *    festas, bancos e lampiões.
 *  - Bairro Novo: oito casas de moradores e, mais ao sul, o pomar, o
 *    chiqueiro e o Celeiro do Sul.
 * A estrada leste continua até a nova borda. Só monta o mapa; os animais, o
 * palco e o que se faz lá ficam em vida-no-campo.js.
 */

"use strict";

const LESTE = { x0: 63, add: 34, stage: { x0: 77, x1: 82, y0: 30, y1: 32 }, pens: [] };
(function expandVilaLeste() {
  const z = ZONES.vila;
  const oldW = z.w,
    W = oldW + LESTE.add;
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
  const H0 = z.h;
  // estradas: a leste-oeste continua até a borda nova; uma avenida desce do norte ao sul
  fill(63, 26, W - 1, 27, ",");
  m[26][W - 1] = ",";
  m[27][W - 1] = ",";
  fill(79, 1, 80, H0 - 2, ",");
  for (const y of [18, 19, 51, 52, 58, 59]) fill(63, y, W - 2, y, ",");
  // Fazendas do Norte
  fill(65, 8, 77, 12, "g"); // trigo (os lavradores trabalham aqui)
  set(71, 10, "Y"); // um espantalho no meio da plantação
  fill(82, 8, 95, 8, "f");
  fill(82, 13, 95, 13, "f");
  fill(82, 8, 82, 13, "f");
  fill(95, 8, 95, 13, "f");
  set(88, 13, ".");
  LESTE.pens.push({ x0: 83, y0: 9, x1: 94, y1: 12, kinds: ["vaca", "vaca", "vaca", "ovelha", "ovelha", "ovelha", "ovelha"] });
  // Praça dos Eventos
  fill(65, 30, 95, 43, ",");
  for (const [x, y] of [[66, 31], [94, 31], [66, 42], [94, 42], [72, 36], [88, 36]]) set(x, y, "l");
  for (let x = 70; x <= 90; x += 5) (set(x, 40, "b"), set(x + 1, 40, "b"));
  for (const [x, y] of [[64, 29], [96, 29], [64, 44], [96, 44]]) set(x, y, "T");
  // fileiras de árvores que já existiam na vila, continuando para o leste
  for (let x = 65; x < W - 1; x += 5) (set(x, 46, "T"), set(x, 61, "T"));
  // pomar e chiqueiro do sul
  for (let y = 63; y <= 71; y += 3) for (let x = 82; x <= 95; x += 3) if (!(x >= 84 && x <= 89 && y <= 67)) set(x, y, "T");
  fill(65, 63, 76, 63, "f");
  fill(65, 70, 76, 70, "f");
  fill(65, 63, 65, 70, "f");
  fill(76, 63, 76, 70, "f");
  set(71, 63, ".");
  LESTE.pens.push({ x0: 66, y0: 64, x1: 75, y1: 69, kinds: ["porco", "porco", "porco", "galinha", "galinha", "galinha", "galinha", "galinha"] });
  const B = [
    { id: "le1", style: "casa", x: 66, y: 2, w: 4, h: 4, door: [67], name: "Sítio do Leste" },
    { id: "le2", style: "celeiro", x: 71, y: 2, w: 5, h: 4, door: [73], name: "Celeiro Grande" },
    { id: "le3", style: "casa2", x: 83, y: 2, w: 4, h: 4, door: [84], name: "Fazenda das Vacas" },
    { id: "le4", style: "celeiro", x: 89, y: 2, w: 5, h: 4, door: [91], name: "Celeiro das Vacas" },
    { id: "le5", style: "padaria", x: 65, y: 14, w: 5, h: 4, door: [67], name: "Queijaria do Leste", shop: "queijos" },
    { id: "le6", style: "tecidos", x: 71, y: 14, w: 5, h: 4, door: [73], name: "Tecelagem Nova", shop: "tecidos" },
    { id: "le7", style: "forja", x: 83, y: 14, w: 5, h: 4, door: [85], name: "Ferraria do Leste", shop: "ferreiro" },
    { id: "le8", style: "armazem", x: 89, y: 14, w: 5, h: 4, door: [91], name: "Mercearia Boa Vizinha", shop: "armazem" },
    { id: "le9", style: "padaria", x: 65, y: 21, w: 5, h: 4, door: [67], name: "Doceria da Praça Nova", shop: "doceria" },
    { id: "le10", style: "boticario", x: 71, y: 21, w: 5, h: 4, door: [73], name: "Ervanária do Leste", shop: "ervanaria" },
    { id: "le11", style: "alfaiate", x: 83, y: 21, w: 5, h: 4, door: [85], name: "Sapataria e Couros", shop: "alfaiate" },
    { id: "le12", style: "emporio", x: 89, y: 21, w: 5, h: 4, door: [91], name: "Empório das Especiarias", shop: "especiarias" },
    { id: "le13", style: "casa", x: 65, y: 47, w: 4, h: 4, door: [66] },
    { id: "le14", style: "casa2", x: 71, y: 47, w: 5, h: 4, door: [73] },
    { id: "le15", style: "casa", x: 83, y: 47, w: 4, h: 4, door: [84] },
    { id: "le16", style: "casa2", x: 89, y: 47, w: 5, h: 4, door: [91] },
    { id: "le17", style: "casa2", x: 65, y: 54, w: 5, h: 4, door: [67] },
    { id: "le18", style: "casa", x: 72, y: 54, w: 4, h: 4, door: [73] },
    { id: "le19", style: "casa2", x: 83, y: 54, w: 5, h: 4, door: [85] },
    { id: "le20", style: "casa", x: 90, y: 54, w: 4, h: 4, door: [91] },
    { id: "le21", style: "celeiro", x: 85, y: 64, w: 5, h: 3, door: [87], name: "Celeiro do Sul" },
  ];
  for (const b of B) {
    fill(b.x, b.y, b.x + b.w - 1, b.y + b.h - 1, "H");
    for (const dx of b.door) {
      set(dx, b.y + b.h - 1, "D");
      z.town.doors[dx + "," + (b.y + b.h - 1)] = b;
    }
    z.town.bld.push(b);
  }
  z.map = m.map((r) => r.join(""));
  z.w = W;
  z.open.e = [W - 1, 26];
  if (typeof addDoorPaths === "function") addDoorPaths("vila");
})();
