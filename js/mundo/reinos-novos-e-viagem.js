/**
 * ECOS DO ARCANO — reinos-novos-e-viagem.js
 * Dois reinos novos (mais Aurélia, Marés e Pedravale):
 *  - Reino de Solmar: a cidade da praia, com palácio branco, calçadão, píeres
 *    e a Festa das Mil Lanternas (veja festa-das-lanternas.js).
 *  - Ducado de Rosalva: terra de vinhedos, castelo de pedra, adega, celeiro,
 *    moinho e cavalos.
 * Viagem entre reinos: não se vai a pé. Só de carruagem (no Estábulo ou na
 * placa de estrada) ou a cavalo, e a viagem leva dias. O tempo passa de
 * verdade (fome, sede, dias do calendário) e uma cena mostra a estrada.
 * Modifica (envolve) funções de outros arquivos: kingdomOf, worldState,
 * carriageMenu, walkTo, simTravel, walkHomeItems, crewDrawList.
 */

"use strict";

/* ===================== OS NOVOS REINOS ===================== */
ZONE_DEFS.solmar = { nome: "Solmar, o Reino da Praia", theme: "porto", exits: {}, enemies: [] };
ZONE_DEFS.rosalva = { nome: "Rosalva, o Ducado das Vinhas", theme: "vila", exits: {}, enemies: [] };

/* Solmar. Linhas: 2–6 palácio e prédios do norte · 7–9 rua · 10–14 praça com
   fonte e barracas · 15–16 rua · 17–19 prédios do sul · 20 calçada ·
   21 calçadão · 22–23 areia · 24–28 mar com três píeres (o do meio é largo). */
ZONES.solmar = buildTown("solmar", {
  w: 56,
  h: 30,
  arrive: [4, 20],
  paint: (set, fill) => {
    fill(1, 24, 54, 28, "~");
    fill(12, 24, 13, 28, "=");
    fill(26, 24, 29, 28, "=");
    fill(42, 24, 43, 28, "=");
    fill(1, 7, 54, 9, ",");
    fill(16, 10, 39, 14, ",");
    fill(1, 15, 54, 16, ",");
    fill(1, 20, 54, 20, ",");
    fill(1, 21, 54, 21, ",");
    fill(27, 7, 28, 23, ",");
    fill(12, 20, 13, 23, ",");
    fill(42, 20, 43, 23, ",");
    set(27, 12, "F");
  },
  bld: [
    { id: "so1", style: "taverna", x: 2, y: 3, w: 6, h: 4, door: [5], name: "Taverna da Concha" },
    { id: "so2", style: "pousada", x: 10, y: 3, w: 5, h: 4, door: [12], name: "Pousada Maré Alta", inn: 25 },
    { id: "so3", style: "palacio", x: 22, y: 2, w: 12, h: 5, door: [27, 28], name: "Palácio de Solmar" },
    { id: "so4", style: "perola", x: 37, y: 3, w: 5, h: 4, door: [39], name: "Joias do Sol" },
    { id: "so5", style: "casa2", x: 44, y: 3, w: 5, h: 4, door: [46] },
    { id: "so6", style: "casa", x: 51, y: 3, w: 3, h: 4, door: [52] },
    { id: "so7", style: "estab", x: 2, y: 17, w: 5, h: 3, door: [4], name: "Estábulo de Solmar" },
    { id: "so8", style: "padaria", x: 8, y: 17, w: 4, h: 3, door: [9], name: "Padaria do Sol" },
    { id: "so9", style: "peixaria", x: 15, y: 17, w: 4, h: 3, door: [16], name: "Peixaria das Ondas" },
    { id: "so10", style: "templo", x: 20, y: 17, w: 5, h: 3, door: [22], name: "Templo das Marés" },
    { id: "so11", style: "armazem", x: 31, y: 17, w: 4, h: 3, door: [32], name: "Armazém do Cais Sul" },
    { id: "so12", style: "moda", x: 36, y: 17, w: 5, h: 3, door: [38], name: "Ateliê das Velas" },
    { id: "so13", style: "casa", x: 45, y: 17, w: 4, h: 3, door: [46] },
    { id: "so14", style: "casa2", x: 50, y: 17, w: 4, h: 3, door: [51] },
  ],
  stalls: {},
  npcs: {},
  deco: [
    ["T", [[1, 1], [18, 1], [36, 1], [54, 1], [15, 4], [35, 4], [43, 5], [49, 5]]],
    ["l", [[16, 10], [39, 10], [16, 14], [39, 14], [8, 21], [20, 21], [35, 21], [48, 21]]],
    ["b", [[20, 13], [21, 13], [34, 13], [35, 13], [6, 22], [18, 22], [36, 22], [50, 22]]],
    ["w", [[17, 11], [38, 11], [17, 13], [38, 13], [25, 22], [31, 22]]],
    ["x", [[11, 27], [14, 27], [41, 27], [44, 27]]],
    ["R", [[7, 20]]],
  ],
  boats: [],
});

/* Rosalva. Linhas: 2–6 castelo e prédios do norte · 7–9 rua · 10–13 praça ·
   14–15 rua · 16–18 prédios do sul · 19 rua · 20–26 vinhedos e pasto. */
ZONES.rosalva = buildTown("rosalva", {
  w: 46,
  h: 28,
  arrive: [3, 19],
  paint: (set, fill) => {
    fill(1, 7, 44, 9, ",");
    fill(13, 10, 32, 13, ",");
    fill(1, 14, 44, 15, ",");
    fill(1, 19, 44, 19, ",");
    fill(22, 7, 23, 26, ",");
    set(22, 11, "F");
    // vinhedos: fileiras de parreiras com terra entre elas
    for (let y = 21; y <= 25; y += 2) for (let x = 3; x <= 19; x++) set(x, y, x % 6 === 0 ? "g" : "A");
    for (let y = 22; y <= 24; y += 2) fill(3, y, 19, y, "g");
    // pasto cercado dos cavalos
    fill(27, 21, 42, 21, "f");
    fill(27, 26, 42, 26, "f");
    fill(27, 21, 27, 26, "f");
    fill(42, 21, 42, 26, "f");
    set(34, 21, ",");
  },
  bld: [
    { id: "ro1", style: "taverna", x: 2, y: 3, w: 6, h: 4, door: [5], name: "Adega do Duque" },
    { id: "ro2", style: "casa2", x: 9, y: 3, w: 5, h: 4, door: [11] },
    { id: "ro3", style: "fortaleza", x: 17, y: 2, w: 11, h: 5, door: [22, 23], name: "Castelo de Rosalva" },
    { id: "ro4", style: "casa", x: 31, y: 3, w: 4, h: 4, door: [32] },
    { id: "ro5", style: "pousada", x: 37, y: 3, w: 6, h: 4, door: [40], name: "Pousada do Cacho", inn: 18 },
    { id: "ro6", style: "estab", x: 2, y: 16, w: 5, h: 3, door: [4], name: "Estábulo de Rosalva" },
    { id: "ro7", style: "padaria", x: 8, y: 16, w: 4, h: 3, door: [9], name: "Forno da Vila" },
    { id: "ro8", style: "templo", x: 13, y: 16, w: 5, h: 3, door: [15], name: "Capela das Uvas" },
    { id: "ro9", style: "celeiro", x: 26, y: 16, w: 5, h: 3, door: [28], name: "Celeiro do Duque" },
    { id: "ro10", style: "moinho", x: 33, y: 16, w: 4, h: 3, door: [34], name: "Moinho de Rosalva" },
    { id: "ro11", style: "casa", x: 39, y: 16, w: 4, h: 3, door: [40] },
  ],
  stalls: {},
  npcs: {},
  deco: [
    ["T", [[1, 1], [15, 1], [30, 1], [44, 1], [14, 5], [29, 5], [36, 5], [44, 12], [1, 12]]],
    ["l", [[13, 10], [32, 10], [13, 13], [32, 13], [10, 19], [36, 19]]],
    ["b", [[16, 12], [17, 12], [28, 12], [29, 12]]],
    ["h", [[30, 23], [31, 23], [38, 24]]],
    ["W", [[25, 24]]],
    ["R", [[8, 19]]],
  ],
  boats: [],
});
["solmar", "rosalva"].forEach((z) => typeof addDoorPaths === "function" && addDoorPaths(z));

Object.assign(KINGDOMS, {
  solmar: { n: "Reino de Solmar", short: "Solmar", zone: "solmar", ruler: "Rainha Marisol" },
  rosalva: { n: "Ducado de Rosalva", short: "Rosalva", zone: "rosalva", ruler: "Duque Leônidas" },
});
if (typeof BASE_RULERS !== "undefined") Object.assign(BASE_RULERS, { solmar: "Rainha Marisol", rosalva: "Duque Leônidas" });
for (const a of ["aurelia", "mares", "serra"]) for (const b of ["solmar", "rosalva"]) KINGDOM_PAIRS.push([a, b]);
KINGDOM_PAIRS.push(["solmar", "rosalva"]);

(() => {
  const koBase = kingdomOf;
  kingdomOf = function (zone) {
    if (zone === "solmar" || zone === "rosalva") return zone;
    return koBase(zone);
  };
  const wsBase = worldState;
  worldState = function () {
    const w = wsBase();
    for (const [a, b] of KINGDOM_PAIRS) if (w.rel[pairKey(a, b)] == null) w.rel[pairKey(a, b)] = 55 + Math.floor(Math.random() * 20);
    return w;
  };

  /* ===================== A ESTRADA: SÓ CARRUAGEM OU CAVALO ===================== */
  const TOWNS = ["vila", "porto", "serra", "solmar", "rosalva"];
  // dias de carruagem entre as cidades (a cavalo é um dia a menos, mínimo 1)
  const DAYS = { "vila-porto": 2, "vila-serra": 2, "vila-solmar": 3, "vila-rosalva": 3, "porto-solmar": 2, "porto-serra": 3, "porto-rosalva": 4, "serra-rosalva": 2, "serra-solmar": 4, "solmar-rosalva": 3 };
  const daysBetween = (a, b) => {
    // dentro de um país além-mar: 1 a 3 dias entre os reinos
    if (a.startsWith("pais-") && b.startsWith("pais-")) return 1 + (Math.abs((+(a.split("-")[2] || 1)) - (+(b.split("-")[2] || 1))) % 3);
    return DAYS[[a, b].join("-")] || DAYS[[b, a].join("-")] || 3;
  };
  const isTown = (z) => TOWNS.includes(z);
  window.travelDays = daysBetween;

  function roadScene(from, to, days, horse) {
    return (W, H, t) => {
      const dur = 2.4 + days * 1.1;
      const p = Math.min(1, t / dur);
      // céu passando por dias e noites
      const ph = (p * days) % 1;
      const day = Math.sin(ph * Math.PI);
      const sky = ctx.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0, `rgb(${30 + 120 * day},${30 + 140 * day},${70 + 150 * day})`);
      sky.addColorStop(1, `rgb(${60 + 170 * day},${50 + 140 * day},${80 + 90 * day})`);
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, W, H);
      // sol e lua
      const ax = W * (0.1 + 0.8 * ph);
      const ay = H * 0.5 - Math.sin(ph * Math.PI) * H * 0.35;
      ctx.fillStyle = day > 0.15 ? "#ffe08a" : "#e8e8f0";
      ctx.beginPath();
      ctx.arc(ax, ay, 18, 0, 7);
      ctx.fill();
      if (day < 0.3) for (let i = 0; i < 40; i++) ((ctx.fillStyle = `rgba(255,255,255,${0.6 - day * 2})`), ctx.fillRect((i * 131) % W, (i * 71) % (H * 0.5), 2, 2));
      // morros que passam
      const off = t * 60;
      for (const [k, col, hh] of [[0.3, "#3a5a3a", 0.62], [0.6, "#2e4a2e", 0.7]]) {
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.moveTo(0, H);
        for (let x = 0; x <= W; x += 20) ctx.lineTo(x, H * hh - Math.sin((x + off * k) / 90) * 30 - Math.sin((x + off * k) / 37) * 10);
        ctx.lineTo(W, H);
        ctx.fill();
      }
      // a estrada de terra
      ctx.fillStyle = "#8a6a42";
      ctx.fillRect(0, H * 0.78, W, H * 0.22);
      ctx.fillStyle = "#6b4f30";
      for (let x = -((t * 120) % 60); x < W; x += 60) ctx.fillRect(x, H * 0.84, 26, 3);
      // marcos de pedra passando
      for (let x = W - ((t * 120) % (W * 0.6)); x > -40; x -= W * 0.6) ((ctx.fillStyle = "#8a8490"), ctx.fillRect(x, H * 0.78 - 16, 10, 16), (ctx.fillStyle = "#6a6470"), ctx.fillRect(x + 7, H * 0.78 - 16, 3, 16));
      // a carruagem (ou o cavalo) bem apoiada na estrada
      const cx = W * 0.42,
        gy = H * 0.86,
        bob = Math.abs(Math.sin(t * 8)) * 2;
      if (typeof drawHorse === "function") {
        // cavalo em escala 2, com os cascos na estrada
        ctx.save();
        ctx.translate(cx + (horse ? -20 : 60), gy - 66 - bob * 0.5);
        ctx.scale(2, 2);
        drawHorse(0, 0, t, false);
        ctx.restore();
      }
      if (!horse) {
        ctx.fillStyle = "#5a3a1e";
        ctx.fillRect(cx - 60, gy - 64 - bob, 96, 44);
        ctx.fillStyle = "#7a4f2a";
        ctx.fillRect(cx - 56, gy - 60 - bob, 88, 36);
        ctx.fillStyle = "#c9a050";
        ctx.fillRect(cx - 60, gy - 68 - bob, 96, 6);
        ctx.fillStyle = "#f2e0a0";
        ctx.fillRect(cx - 44, gy - 54 - bob, 22, 16);
        ctx.fillRect(cx - 6, gy - 54 - bob, 22, 16);
        ctx.fillStyle = "#3a2414";
        ctx.fillRect(cx + 36, gy - 40 - bob, 40, 3);
        for (const wx of [cx - 44, cx + 16]) {
          ctx.fillStyle = "#3a2414";
          ctx.beginPath();
          ctx.arc(wx, gy - 12, 12, 0, 7);
          ctx.fill();
          ctx.fillStyle = "#8a6a42";
          ctx.beginPath();
          ctx.arc(wx, gy - 12, 4, 0, 7);
          ctx.fill();
          ctx.strokeStyle = "#8a6a42";
          ctx.lineWidth = 2;
          for (let s = 0; s < 4; s++) {
            const a = t * 8 + (s * Math.PI) / 2;
            ctx.beginPath();
            ctx.moveTo(wx, gy - 12);
            ctx.lineTo(wx + Math.cos(a) * 11, gy - 12 + Math.sin(a) * 11);
            ctx.stroke();
          }
        }
      }
      ctx.textAlign = "center";
      ctx.font = '700 26px "Pixelify Sans", sans-serif';
      ctx.fillStyle = "#fff";
      ctx.fillText(`${ZONES[from].nome.split(",")[0]}  →  ${ZONES[to].nome.split(",")[0]}`, W / 2, 58);
      ctx.font = '600 18px "Pixelify Sans", sans-serif';
      ctx.fillText(`Dia ${Math.min(days, 1 + Math.floor(p * days))} de ${days} na estrada${horse ? " a cavalo" : " de carruagem"}`, W / 2, 88);
    };
  }
  function journey(to, horse, price) {
    const from = player.zone;
    const days = Math.max(1, daysBetween(from, to) - (horse ? 1 : 0));
    borderCheck(to, (mul) => {
      const cost = Math.round(price * mul);
      if (cost && player.gold < withTax(cost)) return say([["Cocheiro", `Sem ${withTax(cost)} de ouro, sem viagem.`]]);
      if (cost) payWithTax(cost);
      if (typeof closeInv === "function" && game.mode === "inv") closeInv();
      player.flags.rode = true;
      playSound(330, 0.2, "triangle");
      playCine(roadScene(from, to, days, horse), 2.6 + days * 1.1, () => {
        const before = player.day;
        // a estrada cansa: come e bebe pelo caminho, mas chega com fome
        passTime(days * 24 - (player.clock - 9 * 60) / 60, `Depois de ${days} dia(s) de estrada, você chega a ${ZONES[to].nome}.`);
        player.clock = 9 * 60;
        player.food = Math.max(25, player.food);
        player.water = Math.max(25, player.water);
        // dormiu nas estalagens da estrada: chega cansado, mas de pé
        for (const [k, v] of [["energy", 55], ["fun", 40], ["hygiene", 35]]) if (player[k] != null) player[k] = Math.max(v, player[k]);
        const a = ZONES[to].town.arrive;
        player.zone = to;
        player.x = a[0];
        player.y = a[1];
        player.rx = a[0];
        player.ry = a[1];
        player.dir = "down";
        player.riding = !!horse;
        enterZone();
        // os dias da estrada contam no calendário
        game.annDay = before;
        saveGame();
        if (typeof announceBorder === "function") setTimeout(() => announceBorder(to), 900);
      });
    });
  }
  window.journey = journey;

  const cmBase = carriageMenu;
  carriageMenu = function () {
    if (!lifeMode() || !isTown(player.zone)) return cmBase.apply(this, arguments);
    const free = friendshipLevel("cocheiro") >= 2 && !player.flags.rodeFree;
    const opts = [];
    for (const z of TOWNS.filter((q) => q !== player.zone)) {
      const d = daysBetween(player.zone, z);
      const price = 15 + d * 15;
      opts.push({ t: `Carruagem para ${ZONES[z].nome.split(",")[0]} · ${d} dias · ${withTax(price)} ouro`, icon: "horse", fn: () => journey(z, false, price) });
      if (player.horse) opts.push({ t: `A cavalo para ${ZONES[z].nome.split(",")[0]} · ${Math.max(1, d - 1)} dia(s) · grátis`, icon: "horse", fn: () => journey(z, true, 0) });
    }
    const near = player.visited.filter((z) => ZONES[z] && !ZONES[z].town && z !== "torre" && z !== player.zone && !isTown(z) && player.zone === "vila");
    for (const z of near) opts.push({ t: `${ZONES[z].nome} (perto, 1 hora)`, icon: "boots", fn: () => cmBase() });
    choice("Estrada Real", "Para outro reino só se vai de carruagem ou a cavalo, e a viagem leva dias. Leve comida!" + (free ? " (O cocheiro é seu amigo.)" : ""), opts.concat([{ t: "Cancelar", fn: null }]));
  };
  // ninguém vai a pé para outro reino
  const wtBase = walkTo;
  walkTo = function (dest) {
    if (lifeMode() && isTown(dest) && isTown(player.zone)) {
      say([["", `${ZONES[dest].nome} fica a ${daysBetween(player.zone, dest)} dias de estrada. A pé não dá: pegue a carruagem no Estábulo ou vá a cavalo.`]], () => carriageMenu());
      return;
    }
    return wtBase.apply(this, arguments);
  };
  walkHomeItems = function () {
    return [];
  };
  const stBase = simTravel;
  simTravel = function (dir) {
    if (player.zone === "vila" && (SIM_EXITS[dir] === "porto" || SIM_EXITS[dir] === "serra")) {
      toast("A Estrada Real começa no Estábulo: para outros reinos, só de carruagem ou a cavalo.", 3800);
      return true;
    }
    return stBase.apply(this, arguments);
  };

  /* ----- uvas nas parreiras de Rosalva e ondas em Solmar ----- */
  const cdBase = crewDrawList;
  crewDrawList = function (list, t) {
    cdBase(list, t);
    if (player.zone !== "rosalva") return;
    const z = ZONES.rosalva;
    list.push({
      y: -1,
      draw: () => {
        for (let y = 20; y < 27; y++)
          for (let x = 1; x < 22; x++) {
            if (z.map[y][x] !== "A") continue;
            const X = x * TILE,
              Y = y * TILE;
            ctx.fillStyle = "#6b4423";
            ctx.fillRect(X + 15, Y + 6, 2, 22);
            ctx.fillRect(X, Y + 8, TILE, 2);
            for (const [dx, dy] of [[6, 14], [22, 12], [12, 20]]) {
              ctx.fillStyle = "#5a2a6a";
              ctx.fillRect(X + dx, Y + dy, 5, 5);
              ctx.fillStyle = "#8a4a9a";
              ctx.fillRect(X + dx, Y + dy, 2, 2);
            }
          }
      },
    });
  };
})();
