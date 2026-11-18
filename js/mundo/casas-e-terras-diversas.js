/**
 * ECOS DO ARCANO — casas-e-terras-diversas.js
 * Cada casa com cara própria, e cada terra com a sua paisagem.
 * Referências: casas medievais de verdade variavam por região e por dono:
 * enxaimel (madeira aparente com barro caiado), casas de pedra onde havia
 * pedreira, cabanas de palha, tijolo, telhado de ardósia, de telha ou de
 * grama, andares de cima avançando sobre a rua nas cidades.
 *  - As casas comuns (sem dono famoso) ganham um TIPO pela posição:
 *    enxaimel branco, enxaimel ocre, cabana de palha, casa de pedra, casa
 *    caiada de ardósia verde, tijolo, reboco pastel e cabana de toras.
 *    E detalhes: floreiras, venezianas, hera, lenha empilhada, barril,
 *    musgo no telhado, cata-vento, segunda chaminé e andar avançado.
 *  - Nos países além-mar, as casas seguem o estilo da terra (paredes
 *    caiadas no deserto, toras e telhado de grama no gelo, paredes vermelhas
 *    e beirais curvos em Jadeluz...) e a paisagem muda: cactos e tendas,
 *    palmeiras e conchas, pinheiros nevados, rochas de lava, cerejeiras e
 *    lanternas de pedra, árvores mortas e lápides, árvores gigantes e
 *    totens, dedos de pedra dos gigantes.
 *  - Lá fora ninguém fala da turma de Cinzaluz: o povo conversa sobre a
 *    própria terra, e os convites de casamento e velório de Cinzaluz
 *    esperam você voltar.
 * Modifica (envolve) funções de outros arquivos: drawBuilding, crewDrawList,
 * walkable, genLine, weddingInvites, funeralInvites, weddingReminder,
 * funeralReminder.
 */

"use strict";

(() => {
  const hash = (a, b) => {
    let h = (a * 73856093) ^ (b * 19349663);
    h = (h ^ (h >>> 13)) * 1274126177;
    return Math.abs(h ^ (h >>> 16));
  };
  const country = () => (player && player.zone && player.zone.startsWith("pais-") ? player.zone.split("-")[1] : null);

  /* ===================== TIPOS DE CASA ===================== */
  const TYPES = {
    enxaimel: { roof: "#8c3b2e", r2: "#a8483a", wall: "#ece2c8", beam: "#4a2e17" },
    ocre: { roof: "#4a4a58", r2: "#5e5e6e", wall: "#d9b46a", beam: "#6b4423" },
    palha: { roof: "#c9a24a", r2: "#a8843a", wall: "#e8dcbc", beam: "#7a5a32", thatch: true },
    pedra: { roof: "#4a5a6a", r2: "#5e7080", wall: "#a8a294", beam: "#6a655b", stone: true },
    caiada: { roof: "#3a6a4a", r2: "#4a8a5a", wall: "#f6f2ea", beam: "#8a8474" },
    tijolo: { roof: "#5a3a2a", r2: "#6e4a36", wall: "#a8503a", beam: "#5a2a1e", brick: true },
    pastel: { roof: "#3a5a8a", r2: "#4a6aa0", wall: "#e8b8b0", beam: "#7a5a4a" },
    toras: { roof: "#4a6a3a", r2: "#5a7a46", wall: "#8a5a32", beam: "#5a3a1e", logs: true },
  };
  const VILA_TYPES = ["enxaimel", "ocre", "palha", "pedra", "caiada", "tijolo", "pastel", "toras", "enxaimel", "palha"];
  const LAND_TYPES = {
    coral: [["palha", { roof: "#d9b25a" }], ["pastel", { wall: "#f2d0a0", roof: "#3ab0a0" }], ["caiada", { roof: "#e86a5a" }]],
    zahar: [["caiada", { roof: "#d9c08a", r2: "#c9a870", flat: true, stone: true, beam: "#e8e0d0" }], ["ocre", { roof: "#c9a870", r2: "#b8965a", flat: true, wall: "#e8d0a0", stone: true, beam: "#d8c090" }]],
    brumas: [["pedra", { roof: "#3a3a4a", wall: "#8a8a8a" }], ["pedra", { roof: "#2a3a3a", wall: "#7a7a72" }]],
    verde: [["palha", { roof: "#8a9a3a", r2: "#6a7a2a" }], ["toras", { roof: "#3a7a3a" }]],
    gelo: [["toras", { roof: "#5a7a46", r2: "#6a8a56", snowy: true }], ["pedra", { roof: "#5a6a7a", snowy: true }]],
    ferro: [["pedra", { roof: "#2a2a30", wall: "#6a6460" }], ["tijolo", { roof: "#3a2a2a", wall: "#7a3a2a" }]],
    ouro: [["caiada", { roof: "#f2c14e", r2: "#d9a83a" }], ["pastel", { wall: "#f2e0b0", roof: "#c9a040" }]],
    jade: [["caiada", { wall: "#c94a3a", beam: "#2a1a1a", roof: "#2a5a4a", r2: "#3a7a6a", curl: true }], ["ocre", { wall: "#e8d8c0", roof: "#1a3a5a", r2: "#2a4a7a", curl: true }]],
    gigantes: [["pedra", { roof: "#5a5a4a", wall: "#9a9488" }]],
  };
  const COMMON = new Set(["casa", "casa2"]);
  function variantFor(b) {
    const h = hash(b.x, b.y);
    const c = country();
    let base, extra = {};
    if (c && LAND_TYPES[c]) [base, extra] = LAND_TYPES[c][h % LAND_TYPES[c].length];
    else base = VILA_TYPES[h % VILA_TYPES.length];
    return Object.assign({}, TYPES[base], extra, { chim: h % 5 === 0 ? 2 : h % 7 === 0 ? 0 : 1, h });
  }
  const dbBase = drawBuilding;
  drawBuilding = function (b, t) {
    const famous = b.name && !/Casa para alugar|Casa à venda/.test(b.name);
    const mine = typeof isMyHomeBld === "function" && isMyHomeBld(b);
    const BIG = ["castle", "fortaleza", "palacio", "templo", "celeiro", "moinho", "farol", "mina"];
    // no exterior, todo prédio comum segue o estilo da terra (lojas também)
    const can = (COMMON.has(b.style) && !famous && !mine) || (country() && !BIG.includes(b.style));
    if (!can) return dbBase.apply(this, arguments);
    const S0 = BUILDING_STYLES[b.style];
    const V = variantFor(b);
    BUILDING_STYLES[b.style] = Object.assign({}, S0, V);
    try {
      dbBase.apply(this, arguments);
    } finally {
      BUILDING_STYLES[b.style] = S0;
    }
    details(b, V, t);
  };
  function details(b, V, t) {
    const X = b.x * TILE,
      Y = b.y * TILE,
      W = b.w * TILE,
      Hh = b.h * TILE,
      roofH = Math.max(36, Math.round(Hh * 0.5)),
      h = V.h;
    const R = (x, y, w, hh, c) => ((ctx.fillStyle = c), ctx.fillRect(Math.round(x), Math.round(y), w, hh));
    const wallTop = Y + roofH - 6,
      wallH = Hh - roofH - 2;
    // paredes de tijolo e de toras
    if (V.brick) {
      for (let r = 0; r < wallH / 6; r++) for (let k = 0; k < W / 12; k++) R(X + (r % 2) * 6 + k * 12, wallTop + 4 + r * 6, 11, 1, "rgba(60,20,10,.35)");
    }
    if (V.logs) for (let r = 0; r < wallH / 7; r++) (R(X, wallTop + 4 + r * 7, W, 2, "rgba(40,24,10,.45)"), R(X + 2, wallTop + 6 + r * 7, 3, 3, "rgba(255,220,160,.15)"));
    // telhado plano do deserto: platibanda e um toldo
    if (V.flat) {
      R(X - 6, Y - 12, W + 12, roofH + 10, V.wall);
      R(X - 6, Y - 12, W + 12, 4, "rgba(255,255,255,.35)");
      R(X - 6, Y + roofH - 4, W + 12, 3, "rgba(0,0,0,.2)");
      for (let k = 0; k < W / 12; k++) R(X + k * 12 - 4, Y - 16, 6, 5, V.wall);
      R(X + W / 2 - 10, Y + 4, 20, 10, "#3a4a8a");
      R(X + W / 2 - 12, Y + 2, 24, 3, "#2a3a6a");
    }
    // beirais curvos de Jadeluz
    if (V.curl) {
      R(X - 12, Y + roofH - 4, 8, 4, V.roof);
      R(X - 14, Y + roofH - 8, 4, 4, V.roof);
      R(X + W + 4, Y + roofH - 4, 8, 4, V.roof);
      R(X + W + 10, Y + roofH - 8, 4, 4, V.roof);
      R(X + W / 2 - 3, Y - 18, 6, 8, "#c9a040");
    }
    // neve no telhado
    if (V.snowy) for (let k = 0; k < W / 6; k++) R(X - 4 + k * 6, Y - 8 + Math.abs(Math.sin(k)) * 3, 7, 4, "#f2f6fa");
    // musgo e telhas trocadas
    if (h % 3 === 0 && !V.flat) for (let k = 0; k < 5; k++) R(X + 14 + ((h >> k) % Math.max(1, W - 30)), Y + 6 + k * 6, 4, 2, k % 2 ? "#5a7a3a" : V.r2);
    // sobrado: um andar inteiro a mais, avançando sobre a rua, e o telhado em cima
    if (h % 3 !== 2 && !V.flat && !V.logs) {
      const ex = 34; // altura do andar de cima
      const fy = Y + roofH - 6 - ex; // topo do andar novo
      R(X - 4, fy, W + 8, ex, V.wall);
      R(X - 4, fy, W + 8, 3, V.beam);
      R(X - 4, fy + ex - 3, W + 8, 3, V.beam);
      for (let k = 0; k <= b.w; k++) R(Math.min(X + W + 1, X - 4 + k * TILE), fy, 3, ex, V.beam);
      if (!V.stone && !V.brick) for (let k = 0; k < b.w; k++) ((ctx.strokeStyle = V.beam), (ctx.lineWidth = 2), ctx.beginPath(), ctx.moveTo(X - 1 + k * TILE, fy + 3), ctx.lineTo(X + 13 + k * TILE, fy + ex - 3), ctx.stroke());
      if (V.brick) for (let r = 0; r < ex / 6; r++) for (let k = 0; k < W / 12; k++) R(X - 4 + (r % 2) * 6 + k * 12, fy + 3 + r * 6, 11, 1, "rgba(60,20,10,.35)");
      for (let k = 0; k < b.w; k++) {
        const wx = X + k * TILE + 11;
        R(wx - 1, fy + 8, 12, 16, "#4a2e17");
        R(wx, fy + 9, 10, 14, nightAlpha() > 0.25 ? "#ffd98a" : "#5a7aa0");
        R(wx + 4, fy + 9, 2, 14, "#4a2e17");
        R(wx, fy + 15, 10, 1, "#4a2e17");
        R(wx - 2, fy + 24, 14, 2, V.beam);
      }
      R(X - 4, fy + ex, W + 8, 3, "rgba(0,0,0,.3)"); // sombra do balanço
      for (const bx of [X - 3, X + W - 1]) R(bx, fy + ex, 3, 7, V.beam);
      // telhado de novo, mais alto
      const rh = roofH;
      const top = fy - rh + 6;
      ctx.fillStyle = V.roof;
      if (V.thatch) fillPolygon(X - 8, fy + 2, X + W + 8, fy + 2, X + W / 2, top - 18);
      else fillPolygon(X - 6, fy + 2, X + W + 6, fy + 2, X + W - 14, top - 10, X + 14, top - 10);
      ctx.fillStyle = V.r2;
      for (let r = 0; r < (rh + 10) / 7; r++) {
        const yy = top - 8 + r * 7;
        if (yy > fy) break;
        const inset = V.thatch ? Math.max(0, W / 2 - ((yy - top + 18) / (rh + 20)) * (W / 2 + 8)) : 14 - (r * 20) / ((rh + 10) / 7);
        ctx.fillRect(X + inset - 4, yy, W - 2 * inset + 8, 2);
      }
      R(X - 6, fy - 1, W + 12, 3, "rgba(0,0,0,.25)");
      if (V.chim) for (let k = 0; k < V.chim; k++) (R(X + W - 30 - k * 40, top - 20, 10, 24, "#6b6258"), R(X + W - 32 - k * 40, top - 22, 14, 4, "#4a453e"));
      if (V.snowy) for (let k = 0; k < W / 6; k++) R(X - 4 + k * 6, top - 8 + Math.abs(Math.sin(k)) * 3, 7, 4, "#f2f6fa");
    }
    // janelas: venezianas ou floreiras
    if (Hh - roofH > 30)
      for (let k = 0; k < b.w; k++) {
        if (b.door.includes(b.x + k)) continue;
        const wx = X + k * TILE + 10,
          wy = Y + roofH + 4;
        if (h % 2) (R(wx - 6, wy - 2, 4, 16, ["#3a6a4a", "#7a2a2a", "#3a4a8a", "#6b4423"][h % 4]), R(wx + 14, wy - 2, 4, 16, ["#3a6a4a", "#7a2a2a", "#3a4a8a", "#6b4423"][h % 4]));
        else {
          R(wx - 2, wy + 14, 16, 4, "#6b4423");
          for (let f = 0; f < 4; f++) R(wx - 1 + f * 4, wy + 11, 3, 3, ["#e86a8a", "#f2c14e", "#ffffff", "#c94aa8"][(h + f) % 4]);
        }
      }
    // hera subindo pela parede
    if (h % 5 === 2) for (let k = 0; k < 9; k++) R(X + 1 + (k % 3) * 3, Y + Hh - 12 - k * 5, 4, 4, k % 2 ? "#3a7a3a" : "#2a5a2a");
    // lenha empilhada encostada na parede, ou um barril (dentro do terreno)
    if (h % 6 === 3) for (let r = 0; r < 3; r++) for (let k = 0; k < 3 - r; k++) (R(X + W - 22 + k * 7 + r * 3, Y + Hh - 14 - r * 6, 6, 6, "#7a5a32"), R(X + W - 20 + k * 7 + r * 3, Y + Hh - 12 - r * 6, 2, 2, "#c9a06a"));
    else if (h % 6 === 0) (R(X + W - 16, Y + Hh - 18, 12, 16, "#7a4f2a"), R(X + W - 16, Y + Hh - 14, 12, 2, "#4a3a2a"), R(X + W - 16, Y + Hh - 6, 12, 2, "#4a3a2a"));
    // cata-vento no alto
    if (h % 7 === 4 && !V.flat) {
      const tw = Math.sin(t * 0.7 + h) > 0;
      R(X + W / 2 - 1, Y - 28, 2, 16, "#3a3a3a");
      R(X + W / 2 - (tw ? 7 : 1), Y - 28, tw ? 14 : 2, 2, "#3a3a3a");
      R(X + W / 2 + (tw ? 5 : -1), Y - 30, 3, 4, "#3a3a3a");
    }
  }

  /* ----- casas geminadas: fecha o vão estreito entre duas casas ----- */
  const bldAt = (Z, x, y) => Z.town.bld.find((b) => x >= b.x && x < b.x + b.w && y >= b.y && y < b.y + b.h);
  const dtB = drawTile;
  drawTile = function (z, x, y, c, t) {
    const r = dtB.apply(this, arguments);
    const Z = ZONES[z];
    if (c !== "." || !Z || !Z.town || Z.town.indoor) return r;
    const L = bldAt(Z, x - 1, y),
      Rb = bldAt(Z, x + 1, y);
    if (!L || !Rb || L === Rb || !COMMON.has(L.style) || !COMMON.has(Rb.style) || L.y + L.h !== Rb.y + Rb.h) return r;
    const top = Math.max(L.y, Rb.y),
      bot = L.y + L.h;
    if (y < top || y >= bot) return r;
    const V = variantFor(L);
    const X = x * TILE,
      Y = y * TILE,
      rel = (y - top) * TILE,
      H = (bot - top) * TILE,
      roofH = Math.max(36, Math.round(H * 0.5));
    const RR = (a, b, w, h, col) => ((ctx.fillStyle = col), ctx.fillRect(X + a, Y + b, w, h));
    // telhado e parede contínuos entre as duas casas
    for (let yy = 0; yy < TILE; yy++) {
      const gy = rel + yy;
      ctx.fillStyle = gy < roofH ? ((gy >> 3) % 2 ? V.roof : V.r2) : V.wall;
      ctx.fillRect(X, Y + yy, TILE, 1);
    }
    if (rel + TILE > roofH && rel < roofH + 4) RR(0, Math.max(0, roofH - rel - 3), TILE, 3, "rgba(0,0,0,.25)");
    if (rel + TILE > roofH) {
      RR(0, Math.max(0, roofH - rel), 3, TILE, V.beam);
      RR(29, Math.max(0, roofH - rel), 3, TILE, V.beam);
      if (y === bot - 2 || (bot - top <= 3 && y === bot - 1)) (RR(10, 4, 12, 12, "#4a2e17"), RR(11, 5, 10, 10, nightAlpha() > 0.25 ? "#ffd98a" : "#5a7aa0"));
    }
    if (y === bot - 1) RR(0, TILE - 8, TILE, 8, "#7a7468");
    return r;
  };

  /* ===================== A PAISAGEM DE CADA TERRA ===================== */
  const PROPS = { coral: ["palmeira", "concha", "palmeira"], zahar: ["cacto", "tenda", "cacto", "duna"], brumas: ["morta", "lapide", "lampiao"], verde: ["gigante", "totem", "samambaia"], gelo: ["pinheiro", "gelo", "pinheiro"], ferro: ["lava", "bigorna", "vapor"], ouro: ["palmeira", "estatua"], jade: ["cerejeira", "lanterna", "bambu", "cerejeira"], gigantes: ["dedo", "dedo", "musgo"] };
  const cache = {};
  function spots(zid) {
    if (cache[zid]) return cache[zid];
    const z = ZONES[zid],
      out = [];
    const id = zid.split("-")[1],
      L = PROPS[id] || [];
    const salt = zid.length * 7 + (+(zid.split("-")[2] || 1)) * 13;
    for (let y = 1; y < z.h - 1; y++)
      for (let x = 1; x < z.w - 1; x++) {
        if (z.map[y][x] !== ".") continue;
        // não encosta em porta nem em caminho
        if ([[0, 1], [0, -1], [1, 0], [-1, 0]].some(([dx, dy]) => "D,=".includes(z.map[y + dy][x + dx]))) continue;
        const hh = hash(x + salt, y);
        if (hh % 9 !== 0) continue;
        const k = L[hh % L.length];
        const big = ["palmeira", "gigante", "cerejeira", "pinheiro", "dedo", "morta", "bambu", "estatua", "totem", "tenda"].includes(k);
        // nada grudado: longe de outro enfeite e das árvores do mapa
        const minD = big ? 3 : 2;
        if (out.some(([a, b]) => Math.abs(a - x) + Math.abs(b - y) < minD + (big ? 1 : 0))) continue;
        let treeNear = false;
        for (let dy = -2; dy <= 2 && !treeNear; dy++) for (let dx = -2; dx <= 2; dx++) if ("TH".includes((z.map[y + dy] || "")[x + dx] || "")) treeNear = true;
        if (big && treeNear) continue;
        out.push([x, y, k]);
      }
    return (cache[zid] = out);
  }
  const propAt = (z, x, y) => z && z.startsWith("pais-") && spots(z).some((p) => p[0] === x && p[1] === y && p[2] !== "concha" && p[2] !== "musgo" && p[2] !== "samambaia" && p[2] !== "duna");
  const wkBase = walkable;
  walkable = function (z, x, y) {
    if (propAt(z, x, y)) return false;
    return wkBase(z, x, y);
  };
  function prop(k, X, Y, t) {
    const R = (x, y, w, h, c) => ((ctx.fillStyle = c), ctx.fillRect(Math.round(X + x), Math.round(Y + y), w, h));
    R(4, 27, 24, 4, "rgba(0,0,0,.22)");
    const sway = Math.sin(t * 1.2 + X) * 1.5;
    switch (k) {
      case "palmeira":
        for (let i = 0; i < 8; i++) R(14 + Math.sin(i * 0.4) * 2, 28 - i * 5, 5, 6, i % 2 ? "#8a6a3a" : "#a8844e");
        for (const [dx, dy, w] of [[-10, -14, 16], [12, -14, 16], [-6, -18, 12], [8, -18, 12], [0, -20, 10]]) R(12 + dx + sway, dy - 2, w, 4, "#2a8a3a");
        R(13, -12, 4, 4, "#6a4a22");
        break;
      case "concha":
        R(10, 22, 10, 6, "#f2d0c0");
        R(12, 20, 6, 3, "#ffe8dc");
        break;
      case "cacto":
        R(13, 4, 7, 24, "#3a8a4a");
        R(5, 12, 5, 4, "#3a8a4a");
        R(5, 8, 4, 8, "#3a8a4a");
        R(22, 14, 5, 4, "#3a8a4a");
        R(23, 6, 4, 10, "#3a8a4a");
        R(15, 6, 1, 20, "#5aaa6a");
        R(16, 2, 3, 3, "#e86a8a");
        break;
      case "tenda":
        R(2, 14, 28, 14, "#c94a3a");
        R(6, 8, 20, 8, "#e8d8b0");
        R(14, 2, 4, 8, "#e8d8b0");
        R(13, 18, 6, 10, "#5a2a1e");
        for (let i = 0; i < 4; i++) R(2 + i * 7, 14, 3, 14, "#e8d8b0");
        break;
      case "duna":
        R(0, 22, 32, 6, "#e8cc8a");
        R(6, 18, 20, 5, "#f2d8a0");
        break;
      case "morta":
        R(14, 2, 4, 26, "#4a4440");
        R(6, 6, 10, 2, "#4a4440");
        R(18, 10, 10, 2, "#4a4440");
        R(5, 2, 2, 6, "#4a4440");
        R(26, 6, 2, 6, "#4a4440");
        break;
      case "lapide":
        R(9, 10, 14, 18, "#7a7a80");
        R(11, 8, 10, 3, "#7a7a80");
        R(14, 14, 4, 1, "#4a4a50");
        R(15, 12, 2, 6, "#4a4a50");
        break;
      case "lampiao":
        R(15, 4, 2, 24, "#2a2a2a");
        R(11, 2, 10, 8, "#3a3a3a");
        R(13, 4, 6, 4, `rgba(200,220,255,${0.5 + 0.3 * Math.sin(t * 2 + X)})`);
        break;
      case "gigante":
        R(10, -30, 12, 58, "#5a3a1e");
        R(-8, -54, 48, 30, "#145a1f");
        R(-2, -64, 36, 14, "#1f6a2a");
        R(4, 22, 6, 6, "#5a3a1e");
        R(22, 22, 6, 6, "#5a3a1e");
        break;
      case "totem":
        R(10, 0, 12, 28, "#8a5a2e");
        R(8, 2, 16, 6, "#c94a3a");
        R(12, 4, 2, 2, "#1a1a1a");
        R(18, 4, 2, 2, "#1a1a1a");
        R(8, 12, 16, 5, "#3a8a4a");
        R(8, 20, 16, 5, "#f2c14e");
        break;
      case "samambaia":
        for (let i = 0; i < 5; i++) R(6 + i * 4, 18 - (i % 2) * 4, 3, 10, "#2a7a3a");
        break;
      case "pinheiro":
        R(14, 20, 4, 8, "#5a3a1e");
        for (let i = 0; i < 4; i++) (R(4 + i * 3, 16 - i * 6, 24 - i * 6, 6, "#1f5a3a"), R(4 + i * 3, 16 - i * 6, 24 - i * 6, 2, "#f2f6fa"));
        break;
      case "gelo":
        R(6, 14, 20, 14, "#cfe8f6");
        R(8, 10, 12, 6, "#e8f6ff");
        R(10, 16, 3, 8, "#ffffff");
        break;
      case "lava":
        R(4, 14, 24, 14, "#3a2a26");
        R(10, 10, 12, 6, "#4a3a34");
        R(8, 20, 6, 2, `rgba(255,${120 + 60 * Math.sin(t * 3 + X)},40,1)`);
        R(18, 16, 4, 2, "#ff8a3a");
        break;
      case "bigorna":
        R(6, 14, 20, 6, "#3a3a40");
        R(10, 20, 12, 8, "#2a2a30");
        R(24, 14, 6, 3, "#3a3a40");
        break;
      case "vapor":
        R(10, 24, 12, 4, "#4a3a34");
        for (let i = 0; i < 3; i++) R(12 + Math.sin(t * 2 + i) * 3, 14 - ((t * 12 + i * 8) % 20), 6, 6, "rgba(220,220,220,.35)");
        break;
      case "estatua":
        R(8, 22, 16, 6, "#c9a040");
        R(12, 4, 8, 18, "#f2c14e");
        R(13, 0, 6, 6, "#f2c14e");
        R(14, 2, 2, 2, "#fff0a0");
        break;
      case "cerejeira":
        R(14, 6, 4, 22, "#5a3a2a");
        R(0, -16, 32, 22, "#f2a8c8");
        R(4, -22, 24, 10, "#ffc8dc");
        for (let i = 0; i < 3; i++) R(4 + ((t * 10 + i * 11 + X) % 24), 10 + ((t * 14 + i * 7) % 18), 2, 2, "#ffc8dc");
        break;
      case "lanterna":
        R(10, 22, 12, 6, "#8a8a80");
        R(13, 12, 6, 10, "#9a9a90");
        R(8, 6, 16, 6, "#7a7a70");
        R(14, 14, 4, 4, `rgba(255,190,90,${0.6 + 0.3 * Math.sin(t * 3 + X)})`);
        break;
      case "bambu":
        for (const x of [6, 13, 20]) (R(x, -4 + (x % 5), 4, 32, "#7aa84a"), R(x, 6, 4, 1, "#4a7a2a"), R(x, 16, 4, 1, "#4a7a2a"), R(x + 4, (x % 7) - 2 + sway, 6, 2, "#5a9a3a"));
        break;
      case "dedo":
        R(8, -10, 16, 38, "#8a8478");
        R(10, -14, 12, 6, "#9a9488");
        R(8, 6, 16, 2, "#6a6458");
        R(20, -10, 4, 38, "#6a6458");
        break;
      case "musgo":
        R(6, 22, 20, 6, "#4a6a3a");
        break;
    }
  }
  const cdBase = crewDrawList;
  crewDrawList = function (list, t) {
    cdBase(list, t);
    if (!country()) return;
    const T = TILE;
    for (const [x, y, k] of spots(player.zone)) list.push({ y: y - 0.1, draw: () => prop(k, x * T, y * T, t) });
  };

  /* ===================== NO EXTERIOR, CONVERSA DE LÁ ===================== */
  const LOCAL = {
    coral: ["A maré de hoje trouxe tanta concha que dá para fazer três colares.", "Viu a tartaruga gigante no atol? Dizem que ela tem cem anos.", "Hoje tem dança na praia, ocê vem?"],
    zahar: ["A caravana de seda atrasou de novo. Tempestade de areia no Vale dos Camelos.", "O poço do oásis baixou um palmo este mês.", "Não beba vinho na frente do guarda, estrangeiro."],
    brumas: ["Os sinos tocaram três vezes ontem à noite. Alguém morreu.", "Não saia da trilha na névoa. Nunca.", "Minha avó falou comigo na vela de ontem."],
    verde: ["O rio subiu e levou a canoa do vizinho.", "O jaguar passou na clareira de madrugada. Ninguém dormiu.", "A Árvore-Mãe floresceu fora de época. Sinal bom."],
    gelo: ["O fiorde congelou inteiro. Dá para ir a pé até a Ilha da Baleia.", "Ragnhar desafiou o ferreiro para um duelo por causa de uma cerveja.", "Sem casaco de pele você não passa desta noite."],
    ferro: ["A cratera roncou de novo. Vai ter chuva de cinza.", "Vinte espadas para o exército do rei até a lua nova. Ninguém dorme.", "Mãos limpas aqui chamam atenção, estrangeiro."],
    ouro: ["O Imperador mandou dourar mais uma estátua. Com o nosso imposto.", "Achei uma pepita do tamanho de um feijão no rio!", "Quem não se curva no desfile some. Todo mundo sabe."],
    jade: ["As cerejeiras abriram cedo este ano.", "A Imperatriz chamou mais soldados para o Lago do Dragão.", "Silêncio na cerimônia do chá. Nem um suspiro."],
    gigantes: ["Os gigantes mexeram o dedo ontem. Juro por esta barba.", "Faz trinta anos que não chega navio aqui.", "Canta baixinho de noite, senão eles acordam."],
  };
  if (typeof genLine === "function") {
    const glBase = genLine;
    genLine = function () {
      const c = country();
      if (c && LOCAL[c]) return pk(LOCAL[c]);
      return glBase.apply(this, arguments);
    };
  }
  // convites de Cinzaluz esperam você voltar para Valdária
  for (const nm of ["weddingInvites", "funeralInvites", "weddingReminder", "funeralReminder"])
    if (typeof window[nm] === "function") {
      const base = window[nm];
      window[nm] = function () {
        if (country() || (player && player.zone === "cais" && false)) return false;
        return base.apply(this, arguments);
      };
    }
})();
