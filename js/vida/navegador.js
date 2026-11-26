/**
 * ECOS DO ARCANO — navegador.js  (O Navegador)
 * Grandes navegações pelo Mar Aberto, além dos reinos conhecidos.
 *  - Na ponta do píer do Porto Brisamar e de Solmar fica a Capitania: compre
 *    ou alugue uma caravela, contrate marujos, encha os barris de comida e
 *    água e carregue mercadorias para exportar.
 *  - No mar você CONTROLA o navio (setas/A-D giram o leme, W/S sobem e
 *    recolhem as velas; no celular, os botões da tela). O vento muda e
 *    empurra ou freia. O mapa começa coberto de névoa e vai se revelando.
 *  - O tempo corre: cada poucos segundos é um dia. Atravessar o Mar Aberto
 *    inteiro leva cerca de um ano do jogo (30 dias). A tripulação come e bebe
 *    todo dia; sem comida ou água, os marujos adoecem e morrem.
 *  - Tempestades andam pelo mar: o casco apanha, raios caem, e com as velas
 *    içadas o estrago é maior (dica: recolha as velas!). Casco a zero: o
 *    navio afunda e você acorda numa praia, sem navio e sem carga.
 *  - Nove países para descobrir. Em cada um: vender o que eles querem,
 *    comprar o que só eles têm, assinar uma rota de exportação (ouro todo
 *    dia) ou tentar tomar as terras (vira colônia e paga tributo; o mundo
 *    passa a ver você com outros olhos).
 * Modifica (envolve) funções de outros arquivos: targetAt, interactAt,
 * crewDrawList, onNewDay.
 */

"use strict";

(() => {
  const MW = 4400,
    MH = 2400,
    CELL = 50;
  const DAY_S = 2.4; // segundos de navegação por dia
  const HOME = { x: 300, y: 1200 };
  const GOODS = {
    trigo: ["Trigo de Aurélia", 6],
    vinho: ["Vinho de Rosalva", 14],
    peixe: ["Peixe salgado", 5],
    tecido: ["Tecidos finos", 12],
    cristal: ["Cristais de Pedravale", 20],
    especiaria: ["Especiarias", 30],
    perola: ["Pérolas", 45],
    seda: ["Seda", 40],
    cha: ["Chá raro", 28],
    porcelana: ["Porcelana", 38],
    pele: ["Peles do norte", 26],
    oleo: ["Óleo de baleia", 22],
    cacau: ["Cacau", 24],
    madeira: ["Madeira rara", 18],
    ouro: ["Barras de ouro", 60],
    ferro: ["Ferro negro", 16],
    erva: ["Ervas da névoa", 34],
    reliquia: ["Relíquias antigas", 80],
  };
  const HOME_GOODS = ["trigo", "vinho", "peixe", "tecido", "cristal"];
  const C9 = [
    { id: "coral", n: "Coralina", x: 1300, y: 1750, r: 150, bio: "tropical", ruler: "Rainha Maré-Mansa", sells: ["especiaria", "perola"], wants: ["trigo", "tecido"], def: 30, hello: "Tambores na praia e colares de flores. O povo daqui nunca viu um navio tão grande." },
    { id: "zahar", n: "Zahar", x: 1500, y: 560, r: 190, bio: "deserto", ruler: "Sultana Nahira", sells: ["seda", "especiaria"], wants: ["vinho", "madeira"], def: 60, hello: "Dunas douradas até o horizonte e um palácio de cúpulas azuis. Camelos olham você de cima." },
    { id: "brumas", n: "Brumária", x: 2150, y: 1250, r: 140, bio: "nevoa", ruler: "Os Anciãos Cinzentos", sells: ["erva"], wants: ["cristal", "peixe"], def: 40, hello: "A névoa se abre só o bastante para você ver as torres. Sinos tocam sozinhos." },
    { id: "verde", n: "Verdemata", x: 2550, y: 2000, r: 200, bio: "selva", ruler: "Cacique Ybirá", sells: ["cacau", "madeira"], wants: ["ferro", "tecido"], def: 45, hello: "Árvores maiores que o castelo de Cinzaluz. Papagaios gritam o seu nome errado." },
    { id: "gelo", n: "Gelomar", x: 2300, y: 260, r: 170, bio: "gelo", ruler: "Jarl Ulfrida", sells: ["pele", "oleo"], wants: ["vinho", "trigo"], def: 70, hello: "Gelo boiando, casas de pedra com teto de grama e gente enorme de barba trançada." },
    { id: "ferro", n: "Ferrofundo", x: 3050, y: 900, r: 160, bio: "vulcao", ruler: "Rei-Forjador Bram", sells: ["ferro"], wants: ["peixe", "erva"], def: 90, hello: "Um vulcão fuma no meio da ilha. Martelos batem dia e noite nas forjas." },
    { id: "ouro", n: "Áurea", x: 3350, y: 1750, r: 170, bio: "ouro", ruler: "Imperador Solano", sells: ["ouro"], wants: ["seda", "porcelana", "especiaria"], def: 110, hello: "Até os telhados brilham. Dizem que aqui se paga pão com pepitas." },
    { id: "jade", n: "Jadeluz", x: 3950, y: 650, r: 200, bio: "jade", ruler: "Imperatriz Lian-Shu", sells: ["cha", "porcelana", "seda"], wants: ["cristal", "ouro"], def: 130, hello: "Telhados curvos, lanternas vermelhas e jardins de pedra penteada. O porto é o maior que você já viu." },
    { id: "gigantes", n: "Gigântia", x: 4150, y: 2050, r: 160, bio: "ruinas", ruler: "Ninguém (só estátuas)", sells: ["reliquia"], wants: [], def: 0, hello: "Estátuas de pedra do tamanho de montanhas, deitadas como se dormissem. Ninguém mora aqui... ou quase." },
  ];
  const BIO = {
    tropical: ["#e8d8a0", "#3a9a4a"],
    deserto: ["#e8c070", "#c89a4a"],
    nevoa: ["#8a9a8a", "#5a6a5a"],
    selva: ["#c9b080", "#1f6a2a"],
    gelo: ["#eef4f8", "#b8c8d8"],
    vulcao: ["#5a4a44", "#3a2a26"],
    ouro: ["#e8d090", "#c9a040"],
    jade: ["#d8c8a0", "#4a8a6a"],
    ruinas: ["#b8b0a0", "#7a7a6a"],
  };
  const SHIPS = {
    chalupa: { n: "Chalupa", price: 250, hull: 60, cargo: 20, crew: 12, cannons: 0, sp: 1 },
    caravela: { n: "Caravela", price: 600, hull: 100, cargo: 40, crew: 25, cannons: 4, sp: 1.15 },
    galeao: { n: "Galeão", price: 1500, hull: 180, cargo: 80, crew: 60, cannons: 14, sp: 0.95 },
  };
  const S = () => {
    player.sea = player.sea || { ship: null, found: [], col: {}, routes: {}, fog: null, x: HOME.x, y: HOME.y, h: 0 };
    return player.sea;
  };
  const spend = (g) => (player.gold < g ? (toast(`Precisa de ${g} de ouro.`, 1800), false) : ((player.gold -= g), true));
  const cargoUsed = (sh) => Object.values(sh.cargo).reduce((a, b) => a + b, 0);
  const pick = (a) => a[Math.floor(Math.random() * a.length)];

  /* ===================== O CAIS DOS NAVEGANTES =====================
     Um lugar só dos navios de viagem: quase tudo é mar aberto, com três
     cais compridos e os navios grandes atracados. Fica fora da cidade:
     entra-se pelo portal no fim do calçadão do Porto Brisamar e de Solmar. */
  const CZ = "cais";
  ZONE_DEFS[CZ] = { nome: "Cais dos Navegantes", theme: "porto", exits: {}, enemies: [] };
  ZONES[CZ] = buildTown(CZ, {
    w: 50,
    h: 32,
    arrive: [3, 8],
    paint: (set, fill) => {
      fill(1, 10, 48, 30, "~");
      fill(1, 6, 48, 9, ",");
      for (const x of [9, 22, 35]) fill(x, 10, x + 1, 27, "=");
      fill(9, 27, 14, 28, "=");
      fill(22, 27, 27, 28, "=");
      fill(35, 27, 40, 28, "=");
    },
    bld: [
      { id: "ca1", style: "armazem", x: 3, y: 1, w: 6, h: 5, door: [6], name: "Capitania dos Navegantes" },
      { id: "ca2", style: "marcenaria", x: 16, y: 1, w: 6, h: 5, door: [19], name: "Estaleiro Real" },
      { id: "ca3", style: "armazem", x: 28, y: 1, w: 6, h: 5, door: [31], name: "Armazém de Exportação" },
      { id: "ca4", style: "taverna", x: 40, y: 1, w: 7, h: 5, door: [43], name: "Taverna Sete Mares" },
    ],
    stalls: {},
    npcs: {},
    deco: [
      ["x", [[13, 7], [14, 7], [26, 8], [39, 7], [40, 7], [47, 8]]],
      ["l", [[8, 9], [21, 9], [34, 9], [46, 9]]],
    ],
    boats: [],
  });
  if (typeof addDoorPaths === "function") addDoorPaths(CZ);
  const CAPT = [11, 9]; // o Capitão do Porto, na cabeceira do primeiro cais
  const BACK = [1, 8]; // a placa de volta para a cidade
  const GATE = { porto: [60, 21], solmar: [54, 21] };
  const capAt = (x, y) => player.zone === CZ && x === CAPT[0] && y === CAPT[1];
  const backAt = (x, y) => player.zone === CZ && x === BACK[0] && y === BACK[1];
  const gateAt = (x, y) => GATE[player.zone] && GATE[player.zone][0] === x && GATE[player.zone][1] === y;
  function goCais() {
    S().from = player.zone;
    player.zone = CZ;
    [player.x, player.y] = ZONES[CZ].town.arrive;
    player.rx = player.x;
    player.ry = player.y;
    player.dir = "right";
    game.fade = 1;
    enterZone(true);
  }
  function leaveCais() {
    const z = S().from && GATE[S().from] ? S().from : "porto";
    player.zone = z;
    player.x = GATE[z][0] - 1;
    player.y = GATE[z][1];
    player.rx = player.x;
    player.ry = player.y;
    player.dir = "left";
    game.fade = 1;
    enterZone(true);
  }
  // o Velho Pescador sai da areia e vai pescar na ponta do píer
  {
    const z = ZONES.porto;
    const from = "51,22",
      to = [46, 29];
    if (z && z.npcs[from] === "pescadorVelho") {
      const setC = (x, y, c) => (z.map[y] = z.map[y].slice(0, x) + c + z.map[y].slice(x + 1));
      delete z.npcs[from];
      setC(51, 22, ".");
      z.npcs[to.join(",")] = "pescadorVelho";
      setC(to[0], to[1], "N");
      z.npcList = z.npcList.filter((n) => n[2] !== "pescadorVelho").concat([[to[0], to[1], "pescadorVelho"]]);
      z.feats = z.feats.filter(([x, y]) => !(x === 51 && y === 22)).concat([[to[0], to[1], "N"]]);
    }
  }

  function capitania() {
    const s = S(),
      sh = s.ship;
    const opts = [];
    if (!sh) {
      for (const [k, d] of Object.entries(SHIPS)) opts.push({ t: `Comprar o seu próprio ${d.n} (${d.price} ouro) · casco ${d.hull}, carga ${d.cargo}, ${d.crew} marujos, ${d.cannons} canhões`, icon: "anchor", fn: () => buyShip(k) });
      opts.push({ t: "Alugar uma chalupa para uma viagem (80 ouro)", icon: "scroll", fn: () => buyShip("chalupa", true) });
    } else {
      opts.push({ t: `Zarpar no ${sh.name} (casco ${Math.round(sh.hull)}/${sh.max}, ${sh.crew} marujos)`, icon: "flag", fn: () => setSail() });
      opts.push({ t: `Barris de comida e água (+10 dias · ${8 + sh.crew} ouro) · agora ${Math.round(sh.food)}d / ${Math.round(sh.water)}d`, icon: "bread", fn: () => spend(8 + sh.crew) && ((sh.food += 10), (sh.water += 10), capitania()) });
      if (sh.crew < sh.maxCrew) opts.push({ t: `Contratar 5 marujos (25 ouro) · ${sh.crew}/${sh.maxCrew}`, icon: "smile", fn: () => spend(25) && ((sh.crew = Math.min(sh.maxCrew, sh.crew + 5)), capitania()) });
      if (sh.hull < sh.max) opts.push({ t: `Consertar o casco (${Math.ceil((sh.max - sh.hull) * 2)} ouro)`, icon: "hammer", fn: () => spend(Math.ceil((sh.max - sh.hull) * 2)) && ((sh.hull = sh.max), capitania()) });
      opts.push({ t: `Carregar mercadorias para exportar (${cargoUsed(sh)}/${sh.cap})`, icon: "crate", fn: homeMarket });
    }
    if (typeof passageMenu === "function") opts.unshift({ t: "Comprar passagem num navio mercante (barato: viaja de passageiro)", icon: "scroll", fn: () => passageMenu() });
    const found = s.found.length;
    choice("Capitania do Porto", `${found}/9 países descobertos no Mar Aberto.${Object.keys(s.col).length ? ` Colônias: ${Object.keys(s.col).length}.` : ""}${Object.keys(s.routes).length ? ` Rotas de exportação: ${Object.keys(s.routes).length}.` : ""} Dica: a travessia toda leva quase um ano. Leve barris!`, opts.concat([{ t: "Sair", fn: null }]));
  }
  function buyShip(k, rent) {
    const d = SHIPS[k];
    if (!spend(rent ? 80 : d.price)) return;
    S().ship = { kind: k, name: rent ? "Chalupa Alugada" : `${d.n} ${pick(["Estrela do Mar", "Andorinha", "Vento Leste", "Sereia Bela", "Coragem", "Aurora"])}`, hull: d.hull, max: d.hull, cap: d.cargo, crew: Math.ceil(d.crew * 0.6), maxCrew: d.crew, cannons: d.cannons, sp: d.sp, food: 8, water: 8, cargo: {}, rent: !!rent };
    player.navegador = true;
    saveGame();
    say([["Capitão do Porto", rent ? "Ela é velha mas boia. Devolva inteira, hein!" : "Assina aqui. Pronto: agora você é Navegador" + genderWord("", "a", "e") + ". Que o mar te seja manso."]], capitania);
  }
  function homeMarket() {
    const sh = S().ship;
    const opts = HOME_GOODS.map((g) => ({ t: `${GOODS[g][0]} · 5 caixas por ${GOODS[g][1] * 5} ouro (tem ${sh.cargo[g] || 0})`, icon: "crate", fn: () => (cargoUsed(sh) + 5 > sh.cap ? toast("O porão está cheio.", 1800) : spend(GOODS[g][1] * 5) && ((sh.cargo[g] = (sh.cargo[g] || 0) + 5), homeMarket())) }));
    // o que você trouxe de longe vende bem aqui
    for (const [g, q] of Object.entries(sh.cargo)) if (!HOME_GOODS.includes(g) && q > 0) opts.push({ t: `Vender ${q} ${GOODS[g][0]} (${Math.round(GOODS[g][1] * 1.6)} cada)`, icon: "coin", fn: () => ((player.gold += Math.round(GOODS[g][1] * 1.6) * q), (sh.cargo[g] = 0), toast(`+${Math.round(GOODS[g][1] * 1.6) * q} ouro! Mercadoria de além-mar vale muito aqui.`, 3000), homeMarket()) });
    choice("Mercado do Cais", `Porão: ${cargoUsed(sh)}/${sh.cap} caixas.`, opts.concat([{ t: "Voltar", fn: capitania }]));
  }

  /* ===================== O MAR ===================== */
  let el, cv, g, raf, V;
  const keys = {};
  // uma janela aberta no mar (mensagem, aviso, convite) não pode virar o leme nem atracar
  const seaBusy = () => !!game.dialog || game.mode === "choice" || (byId("choice") && byId("choice").style.display === "block");
  const atSea = () => !!(V && el && el.style.display === "block");
  addEventListener("keydown", (e) => {
    // a mesma tecla que fecha uma mensagem não pode atracar/virar o leme logo em seguida
    if (game.mode !== "sea" || !V || seaBusy() || performance.now() - (V.busyAt || 0) < 300) return;
    const k = e.key.toLowerCase();
    keys[k] = true;
    if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(k)) e.preventDefault();
    if (k === "w" || k === "arrowup") ((V.sail = Math.min(2, V.sail + 1)), (V.anchor = false));
    if (k === " " || k === "q") dropAnchor();
    if (k === "s" || k === "arrowdown") V.sail = Math.max(0, V.sail - 1);
    if (k === "e" || k === "enter") tryDock();
  });
  addEventListener("keyup", (e) => (keys[e.key.toLowerCase()] = false));
  KEY_HANDLERS.sea = () => {};
  function ensureEl() {
    el = byId("sea");
    if (el) return;
    el = document.createElement("div");
    el.id = "sea";
    el.innerHTML = `<canvas></canvas><div class="sea-pad"><button data-k="l">◀ Leme</button><button data-k="sail">Velas</button><button data-k="r">Leme ▶</button><button data-k="anchor">⚓ Parar</button><button data-k="dock" class="dock">Atracar</button></div>`;
    byId("screen").appendChild(el);
    const st = document.createElement("style");
    st.textContent = `#sea{position:absolute;inset:0;z-index:4;display:none;background:#0a1a2e}#sea canvas{width:100%;height:100%;display:block;image-rendering:pixelated}
#sea .sea-pad{position:absolute;left:0;right:0;bottom:10px;display:flex;gap:8px;justify-content:center;pointer-events:none}
#sea .sea-pad button{pointer-events:auto;font-size:18px;padding:.35em .8em;background:linear-gradient(#8a5a2e,#6b4423);color:#f6ead0;border:2px solid #3a2414;border-radius:6px;user-select:none;touch-action:none}
#sea .sea-pad .dock{display:none;background:linear-gradient(#c9a050,#8a6a2a)}`;
    document.head.appendChild(st);
    cv = el.querySelector("canvas");
    g = cv.getContext("2d");
    el.querySelectorAll("[data-k]").forEach((b) => {
      const k = b.dataset.k;
      const on = (v) => (e) => (e.preventDefault(), k === "l" ? (V.tl = v) : k === "r" ? (V.tr = v) : 0);
      b.onpointerdown = (e) => {
        if (k === "sail") ((V.sail = (V.sail + 1) % 3), (V.anchor = false));
        else if (k === "anchor") dropAnchor();
        else if (k === "dock") tryDock();
        else on(true)(e);
      };
      b.onpointerup = on(false);
      b.onpointerleave = on(false);
    });
  }
  function dropAnchor() {
    if (!V) return;
    V.sail = 0;
    V.anchor = true;
    note("Âncora lançada: o navio para.");
  }
  function fogArr() {
    const s = S();
    const n = Math.ceil(MW / CELL) * Math.ceil(MH / CELL);
    if (!s.fog || s.fog.length !== n) s.fog = "0".repeat(n);
    if (typeof s.fog === "string") V.fog = Uint8Array.from(s.fog, (c) => +c);
    return V.fog;
  }
  function reveal() {
    const cols = Math.ceil(MW / CELL);
    const R = 260;
    for (let y = Math.floor((V.y - R) / CELL); y <= (V.y + R) / CELL; y++)
      for (let x = Math.floor((V.x - R) / CELL); x <= (V.x + R) / CELL; x++) {
        if (x < 0 || y < 0 || x >= cols || y >= MH / CELL) continue;
        if (Math.hypot(x * CELL + 25 - V.x, y * CELL + 25 - V.y) < R) V.fog[y * cols + x] = 1;
      }
  }
  function storms() {
    const out = [];
    for (let i = 0; i < 7; i++) {
      const t = V.days * 0.35 + i * 9.7;
      out.push({ x: 900 + ((i * 1370 + Math.sin(t) * 500 + V.days * (40 + i * 6)) % 3300), y: 300 + ((i * 640 + Math.cos(t * 0.8) * 400) % 1800), r: 150 + (i % 3) * 50 });
    }
    return out;
  }
  function setSail() {
    const s = S(),
      sh = s.ship;
    if (!sh) return;
    if (sh.food < 3 || sh.water < 3) return say([["Imediato", "Capitã" + genderWord("o", "", "e") + ", sem barris não saio do porto. Encha a comida e a água primeiro!"]], capitania);
    ensureEl();
    byId("choice").style.display = "none";
    if (typeof hidePie === "function") hidePie();
    const home = player.zone;
    V = { x: HOME.x + 40, y: HOME.y, h: 0, v: 0, sail: 1, days: 0, acc: 0, wind: Math.random() * 6.28, hit: 0, flash: 0, home, tl: false, tr: false, near: null, msg: "Mar Aberto! Siga para o leste e descubra novas terras.", msgT: 5, trail: [] };
    fogArr();
    reveal();
    el.style.display = "block";
    for (const id of ["choice", "dialog", "toast", "pie"]) if (byId(id)) byId(id).style.zIndex = 50;
    game.mode = "sea";
    playSound(220, 0.4, "triangle");
    startLoop();
  }
  function startLoop() {
    let last = performance.now();
    const frame = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!V) return;
      // fechar uma janela durante a viagem devolvia o jogo para "world" e o leme parava de responder
      if (game.mode === "world" && el && el.style.display === "block" && !seaBusy()) game.mode = "sea";
      if (seaBusy()) V.busyAt = now;
      if (game.mode === "sea" && !seaBusy()) step(dt);
      draw(now / 1000);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
  }
  /** Desembarcar: a viagem fica parada no mar, esperando você voltar a bordo. */
  function disembark(c) {
    if (!V) return;
    cancelAnimationFrame(raf);
    S().voyage = { x: V.x, y: V.y, h: V.h, days: V.days, home: V.home, at: c.id };
    S().fog = Array.from(V.fog).join("");
    el.style.display = "none";
    byId("choice").style.display = "none";
    for (const id of ["choice", "dialog", "toast", "pie"]) if (byId(id)) byId(id).style.zIndex = "";
    game.mode = "world";
    V = null;
  }
  function reembark() {
    const P = S().voyage;
    if (!P || !S().ship) return say([["", "Sem navio no porto. Você vai precisar de outro jeito de voltar..."]]);
    ensureEl();
    V = { x: P.x, y: P.y, h: P.h + Math.PI, v: 0, sail: 0, days: P.days, acc: 0, wind: Math.random() * 6.28, hit: 0, flash: 0, home: P.home, tl: false, tr: false, near: null, msg: "De volta a bordo. Para onde agora?", msgT: 4, trail: [] };
    S().voyage = null;
    fogArr();
    el.style.display = "block";
    for (const id of ["choice", "dialog", "toast", "pie"]) if (byId(id)) byId(id).style.zIndex = 50;
    game.mode = "sea";
    startLoop();
  }
  window.seaDisembark = (id) => disembark(C9.find((c) => c.id === id));
  window.seaReembark = reembark;
  window.seaState = () => V; // (para os testes)
  window.seaSetSail = () => setSail();
  window.SEA_COUNTRIES = C9;
  window.SEA_HOME = HOME;
  function endVoyage(msg) {
    cancelAnimationFrame(raf);
    const s = S();
    s.fog = Array.from(V.fog).join("");
    V = null;
    el.style.display = "none";
    for (const id of ["choice", "dialog", "toast", "pie"]) if (byId(id)) byId(id).style.zIndex = "";
    game.mode = "world";
    if (s.ship && s.ship.rent) s.ship = null;
    saveGame();
    if (msg) say(msg);
  }
  function passDay() {
    V.days++;
    player.day++;
    game.annDay = player.day;
    const sh = S().ship;
    const eat = sh.crew / 20;
    sh.food = Math.max(0, sh.food - eat);
    sh.water = Math.max(0, sh.water - eat * 1.1);
    if (sh.food <= 0 || sh.water <= 0) {
      const lost = Math.max(1, Math.ceil(sh.crew * 0.15));
      sh.crew = Math.max(0, sh.crew - lost);
      note(`${lost} marujo(s) morreram de ${sh.water <= 0 ? "sede" : "fome"}...`);
      if (sh.crew <= 0) return sink("Sem ninguém para remar, o navio fica à deriva até a madeira apodrecer.");
    }
    if (typeof worldTick === "function" && V.days % 3 === 0) worldTick();
  }
  function note(m) {
    V.msg = m;
    V.msgT = 4.5;
  }
  function step(dt) {
    const sh = S().ship;
    const turn = (keys.a || keys.arrowleft || V.tl ? -1 : 0) + (keys.d || keys.arrowright || V.tr ? 1 : 0);
    V.h += turn * dt * 1.6;
    V.wind += (Math.random() - 0.5) * dt * 0.15;
    const windK = 0.55 + 0.45 * Math.cos(V.h - V.wind);
    const target = [0, 32, 58][V.sail] * sh.sp * (V.sail ? windK : 1) + (V.sail === 0 ? 0 : 6);
    // velas recolhidas: o navio freia de verdade; com a âncora, para em instantes
    const brake = V.anchor ? 4 : V.sail === 0 ? 1.6 : 0.8;
    V.v += (target - V.v) * Math.min(1, dt * brake);
    if (V.sail === 0 && Math.abs(V.v) < 1.5) V.v = 0;
    let nx = V.x + Math.cos(V.h) * V.v * dt,
      ny = V.y + Math.sin(V.h) * V.v * dt;
    // terra firme: o navio encalha na costa (e arranha o casco)
    const land = landAt(nx, ny);
    if (land) {
      V.v *= -0.3;
      sh.hull -= 2;
      nx = V.x;
      ny = V.y;
      if (V.hit <= 0) note("Encalhou! Cuidado com a costa.");
      V.hit = 0.6;
    }
    V.x = Math.max(20, Math.min(MW - 20, nx));
    V.y = Math.max(20, Math.min(MH - 20, ny));
    V.hit -= dt;
    V.trail.push([V.x, V.y]);
    if (V.trail.length > 60) V.trail.shift();
    reveal();
    // tempestades
    V.storm = storms().find((q) => Math.hypot(q.x - V.x, q.y - V.y) < q.r);
    if (V.storm) {
      const k = V.sail === 2 ? 1.6 : V.sail === 1 ? 1 : 0.35;
      sh.hull -= dt * 3.2 * k;
      V.h += (Math.random() - 0.5) * dt * 1.4;
      if (Math.random() < dt * 0.35) {
        V.flash = 1;
        const dmg = V.sail ? 12 : 5;
        sh.hull -= dmg;
        playSound(80, 0.5, "sawtooth");
        note(V.sail ? `Um raio acertou o mastro! (-${dmg}) Recolha as velas!` : `Um raio caiu perto! (-${dmg})`);
        if (Math.random() < 0.25 && sh.crew > 1) (sh.crew--, note("Uma onda levou um marujo para o mar..."));
      }
      if (!V.warned) ((V.warned = true), note("TEMPESTADE! Recolha as velas (S) para o casco aguentar."));
    } else V.warned = false;
    V.flash = Math.max(0, V.flash - dt * 2.5);
    if (sh.hull <= 0) return sink("As ondas partem o casco ao meio. O mar engole o navio...");
    // o tempo passa
    V.acc += dt;
    if (V.acc >= DAY_S) ((V.acc -= DAY_S), passDay());
    V.msgT -= dt;
    // perto de um país ou de casa?
    V.near = null;
    if (Math.hypot(V.x - HOME.x, V.y - HOME.y) < 110) V.near = { home: true };
    for (const c of C9) if (Math.hypot(V.x - c.x, V.y - c.y) < c.r + 120) V.near = c;
    const disc = V.near && !V.near.home && !S().found.includes(V.near.id);
    if (disc) {
      S().found.push(V.near.id);
      playSound(784, 0.3, "triangle");
      setTimeout(() => playSound(1047, 0.5, "triangle"), 200);
      note(`TERRA À VISTA! ${V.near.n}!`);
      if (typeof vilaNews === "function") vilaNews(`${player.name} descobriu ${V.near.n} do outro lado do Mar Aberto!`);
    }
    el.querySelector(".dock").style.display = V.near ? "inline-block" : "none";
    el.querySelector(".dock").textContent = V.near ? (V.near.home ? "Voltar ao porto" : `Atracar em ${V.near.n}`) : "";
  }
  function landAt(x, y) {
    if (x < 230) return true;
    for (const c of C9) if (Math.hypot(x - c.x, y - c.y) < shapeR(c, Math.atan2(y - c.y, x - c.x))) return c;
    return null;
  }
  const shapeR = (c, a) => c.r * (0.78 + 0.14 * Math.sin(a * 3 + c.x) + 0.08 * Math.sin(a * 7 + c.y));
  function sink(why) {
    const sh = S().ship;
    const name = sh ? sh.name : "navio";
    S().ship = null;
    playSound(60, 1.2, "sawtooth");
    const back = V.home;
    cancelAnimationFrame(raf);
    V.sinking = true;
    const s = S();
    s.fog = Array.from(V.fog).join("");
    el.style.display = "none";
    V = null;
    for (const id of ["choice", "dialog", "toast", "pie"]) if (byId(id)) byId(id).style.zIndex = "";
    game.mode = "world";
    // o mar pode matar: no Simulador, às vezes ninguém volta
    const dies = lifeMode() && typeof lifeEnds === "function" && Math.random() < 0.3;
    if (dies)
      return playCine(sinkScene(name), 6, () => {
        player.deathCause = "afogado no Mar Aberto";
        say([["", why], ["", `Você se agarra num pedaço do ${name}, mas a água está gelada demais e a terra longe demais...`]], () => lifeEnds());
      });
    playCine(sinkScene(name), 6, () => {
      player.zone = CZ;
      const a = ZONES[player.zone].town.arrive;
      [player.x, player.y] = a;
      player.rx = player.x;
      player.ry = player.y;
      player.hp = Math.max(5, Math.round(maxHp() * 0.2));
      enterZone();
      saveGame();
      say([["", why], ["", `Você se agarra num pedaço do ${name} e boia por dias. Uns pescadores te acham desmaiad${genderWord("o", "a", "e")} na areia.`], ["", "Sem navio, sem carga. Mas vivo. O mar cobra caro de quem o desafia."]]);
    });
  }
  function sinkScene(name) {
    return (W, H, t) => {
      ctx.fillStyle = "#0a1424";
      ctx.fillRect(0, 0, W, H);
      if (Math.sin(t * 7) > 0.92) ((ctx.fillStyle = "rgba(255,255,255,.5)"), ctx.fillRect(0, 0, W, H));
      for (let i = 0; i < 80; i++) ((ctx.fillStyle = "rgba(160,190,230,.5)"), ctx.fillRect((i * 97 + t * 300) % W, (i * 53 + t * 700) % H, 1, 10));
      const sea = H * 0.6;
      const sk = Math.min(1, t / 4.5);
      ctx.save();
      ctx.translate(W / 2, sea - 30 + sk * 120);
      ctx.rotate(-0.2 - sk * 0.9);
      ctx.fillStyle = "#5a3a1e";
      ctx.fillRect(-90, 0, 180, 34);
      ctx.fillStyle = "#3a2414";
      ctx.fillRect(-4, -120, 8, 120);
      ctx.fillStyle = "#d8d0c0";
      ctx.fillRect(-50, -110, 46, 60);
      ctx.restore();
      ctx.fillStyle = "#142844";
      ctx.fillRect(0, sea, W, H - sea);
      for (let x = 0; x < W; x += 40) ((ctx.fillStyle = "#2a4a6a"), ctx.fillRect(x + ((t * 60) % 40), sea + Math.sin(x + t * 3) * 6, 26, 6));
      ctx.textAlign = "center";
      ctx.font = '700 28px "Pixelify Sans", sans-serif';
      ctx.fillStyle = "#fff";
      ctx.fillText(`O ${name} afundou`, W / 2, 70);
    };
  }

  /* ===================== NO PORTO DE UM PAÍS ===================== */
  function tryDock() {
    if (!V || !V.near || game.mode !== "sea") return;
    if (V.near.home && !V.confirmHome) {
      // atracar em casa encerra a viagem: pergunta antes (o E também fecha mensagens)
      V.v = 0;
      game.mode = "choice";
      return choice("Voltar para casa?", "Atracar no Cais dos Navegantes encerra a viagem.", [
        { t: "Atracar e encerrar a viagem", icon: "anchor", fn: () => ((V.confirmHome = true), (game.mode = "sea"), tryDock()) },
        { t: "Continuar navegando", icon: "flag", fn: backToSea },
      ]);
    }
    if (V.near.home) {
      const d = V.days;
      player.zone = CZ;
      [player.x, player.y] = [12, 9];
      player.rx = player.x;
      player.ry = player.y;
      enterZone(false);
      return endVoyage([["", `Depois de ${d} dia(s) no mar, você atraca de volta em casa. A Capitania guarda o seu navio.`]]);
    }
    // atracando: o navio para no cais do país
    V.v = 0;
    V.sail = 0;
    game.mode = "choice";
    countryMenu(V.near);
  }
  function backToSea() {
    byId("choice").style.display = "none";
    game.mode = "sea";
  }
  function countryMenu(c) {
    const s = S(),
      sh = s.ship;
    const col = s.col[c.id],
      route = s.routes[c.id];
    const wants = c.wants.map((w) => GOODS[w][0]).join(", ") || "nada";
    const opts = [];
    for (const [gk, q] of Object.entries(sh.cargo))
      if (q > 0) {
        const mult = c.wants.includes(gk) ? 3 : HOME_GOODS.includes(gk) ? 1.4 : 0.8;
        const price = Math.round(GOODS[gk][1] * mult);
        opts.push({ t: `Vender ${q} ${GOODS[gk][0]} (${price} cada${c.wants.includes(gk) ? ", eles adoram!" : ""})`, icon: "coin", fn: () => ((player.gold += price * q), (sh.cargo[gk] = 0), toast(`+${price * q} ouro`, 2000), countryMenu(c)) });
      }
    for (const gk of c.sells) {
      const price = Math.round(GOODS[gk][1] * (col ? 0.5 : 1));
      opts.push({ t: `Comprar 5 ${GOODS[gk][0]} (${price * 5} ouro)`, icon: "crate", fn: () => (cargoUsed(sh) + 5 > sh.cap ? toast("Porão cheio.", 1800) : spend(price * 5) && ((sh.cargo[gk] = (sh.cargo[gk] || 0) + 5), countryMenu(c))) });
    }
    if (c.def > 0 && !col && !route) opts.push({ t: "Assinar rota de exportação (200 ouro · rende ouro todo dia)", icon: "scroll", fn: () => spend(200) && ((s.routes[c.id] = player.day), repAdd && repAdd(2), say([[c.ruler, "Que os nossos navios se cruzem sempre em paz."]], () => countryMenu(c))) });
    if (c.def > 0 && !col) opts.push({ t: `Tentar tomar as terras (defesa ${c.def} · você: ${sh.crew} marujos, ${sh.cannons} canhões)`, icon: "sword", fn: () => conquer(c) });
    if (c.id === "gigantes" && !s.flags) opts.push({ t: "Explorar as ruínas dos gigantes", icon: "eye", fn: () => ((s.flags = 1), (player.gold += 300), say([["", "Dentro da mão de pedra de um gigante, um baú esquecido: 300 de ouro e um mapa riscado com o nome Vesper."]], () => countryMenu(c))) });
    opts.push({ t: `Comprar barris aqui (+10 dias · ${12 + sh.crew} ouro)`, icon: "bread", fn: () => spend(12 + sh.crew) && ((sh.food += 10), (sh.water += 10), countryMenu(c)) });
    if (sh.hull < sh.max) opts.push({ t: `Consertar o casco no estaleiro deles (${Math.ceil((sh.max - sh.hull) * 3)} ouro)`, icon: "hammer", fn: () => spend(Math.ceil((sh.max - sh.hull) * 3)) && ((sh.hull = sh.max), countryMenu(c)) });
    if (typeof countryTown === "function" && countryTown(c.id)) opts.unshift({ t: `Desembarcar e conhecer ${c.n}`, icon: "boots", fn: () => countryTown(c.id, true) });
    opts.push({ t: "Zarpar de novo", icon: "flag", fn: backToSea });
    const status = col ? "Colônia sua: paga tributo todo dia." : route ? "Rota de exportação ativa." : `Governante: ${c.ruler}. Eles querem: ${wants}.`;
    choice(c.n, `${c.hello}<br><small>${status} Porão ${cargoUsed(sh)}/${sh.cap} · casco ${Math.round(sh.hull)}/${sh.max} · ${sh.crew} marujos · comida ${Math.round(sh.food)}d · água ${Math.round(sh.water)}d</small>`, opts);
  }
  function conquer(c) {
    const s = S(),
      sh = s.ship;
    const power = sh.crew * 1.2 + sh.cannons * 7 + (player.army || 0) * 0.5;
    const chance = Math.max(0.05, Math.min(0.9, power / (c.def * 1.6)));
    choice(`Atacar ${c.n}?`, `Chance de vitória: <b>${Math.round(chance * 100)}%</b>. Se perder, metade da tripulação morre e o navio apanha. Tomar terras alheias faz os reinos desconfiarem de você.`, [
      {
        t: "Ao ataque!",
        icon: "sword",
        fn: () => {
          playSound(110, 0.4, "sawtooth");
          if (Math.random() < chance) {
            s.col[c.id] = player.day;
            delete s.routes[c.id];
            sh.crew = Math.max(1, Math.round(sh.crew * 0.75));
            if (typeof repAdd === "function") repAdd(-5);
            if (typeof worldState === "function") for (const k of Object.keys(worldState().rel)) worldState().rel[k] = Math.max(0, worldState().rel[k] - 4);
            if (typeof vilaNews === "function") vilaNews(`${player.name} tomou ${c.n}! Os outros reinos olham de lado.`);
            say([["", `Os canhões trovejam, a tripulação desembarca e a bandeira de ${player.name} sobe no forte. ${c.n} agora é sua colônia.`], [c.ruler, "Você venceu hoje. Mas o meu povo tem memória longa."]], () => countryMenu(c));
          } else {
            sh.crew = Math.max(1, Math.floor(sh.crew / 2));
            sh.hull = Math.max(1, sh.hull - sh.max * 0.4);
            if (typeof repAdd === "function") repAdd(-3);
            say([["", "A defesa deles é forte demais. Vocês fogem para o navio debaixo de flechas e pedras."], ["", "Metade dos marujos não voltou."]], () => countryMenu(c));
          }
        },
      },
      { t: "Desistir", fn: () => countryMenu(c) },
    ]);
  }

  /* ===================== DESENHO DO MAR ===================== */
  function draw(t) {
    if (!V) return;
    const r = el.getBoundingClientRect();
    const W = Math.round(r.width),
      H = Math.round(r.height);
    if (cv.width !== W || cv.height !== H) ((cv.width = W), (cv.height = H));
    const camX = V.x - W / 2,
      camY = V.y - H / 2;
    const R = (x, y, w, h, c) => ((g.fillStyle = c), g.fillRect(Math.round(x), Math.round(y), w, h));
    // oceano
    g.fillStyle = V.storm ? "#0e2236" : "#14406a";
    g.fillRect(0, 0, W, H);
    for (let y = Math.floor(camY / 40) * 40; y < camY + H; y += 40)
      for (let x = Math.floor(camX / 64) * 64; x < camX + W; x += 64) {
        const o = Math.sin(t * 1.5 + x * 0.05 + y * 0.03) * 6;
        R(x - camX + o + ((y / 40) % 2) * 32, y - camY, 18, 2, V.storm ? "#2a4a66" : "#2a5a8a");
      }
    // além da borda do mapa: só névoa
    if (camX < 0) R(0, 0, -camX, H, "#1c1612");
    if (camY < 0) R(0, 0, W, -camY, "#1c1612");
    if (camX + W > MW) R(MW - camX, 0, W, H, "#1c1612");
    if (camY + H > MH) R(0, MH - camY, W, H, "#1c1612");
    // terra natal (a costa de Valdária, onde fica Aurélia)
    if (camX < 240) {
      R(Math.max(0, -camX), Math.max(0, -camY), 230 - Math.max(0, camX), Math.min(H, MH - camY), "#3a6a3a");
      R(230 - camX - 18, Math.max(0, -camY), 18, Math.min(H, MH - camY), "#d8c890");
      const hx = HOME.x - camX,
        hy = HOME.y - camY;
      R(hx - 80, hy - 6, 70, 12, "#6b4423");
      for (let i = 0; i < 4; i++) R(hx - 190 + i * 26, hy - 40 - (i % 2) * 20, 20, 20, ["#c94a3a", "#3a5aa8", "#e8d8b0", "#5a8a3a"][i]);
      label("Valdária (casa)", hx - 120, hy - 70, "#ffe8b0");
    }
    // países
    for (const c of C9) {
      if (c.x + c.r < camX || c.x - c.r > camX + W || c.y + c.r < camY || c.y - c.r > camY + H) continue;
      island(c, c.x - camX, c.y - camY, t);
    }
    // rastro e navio
    g.fillStyle = "rgba(220,240,255,.35)";
    V.trail.forEach(([x, y], i) => i % 3 === 0 && g.fillRect(Math.round(x - camX), Math.round(y - camY), 2, 2));
    ship(W / 2, H / 2, V.h, t);
    // tempestades
    for (const q of storms()) {
      const X = q.x - camX,
        Y = q.y - camY;
      if (X < -q.r || Y < -q.r || X > W + q.r || Y > H + q.r) continue;
      const gr = g.createRadialGradient(X, Y, q.r * 0.2, X, Y, q.r);
      gr.addColorStop(0, "rgba(20,24,34,.85)");
      gr.addColorStop(1, "rgba(20,24,34,0)");
      g.fillStyle = gr;
      g.fillRect(X - q.r, Y - q.r, q.r * 2, q.r * 2);
      g.fillStyle = "rgba(170,190,220,.45)";
      for (let i = 0; i < 40; i++) g.fillRect(X - q.r * 0.7 + ((i * 47 + t * 200) % (q.r * 1.4)), Y - q.r * 0.7 + ((i * 31 + t * 420) % (q.r * 1.4)), 1, 8);
    }
    // névoa do desconhecido
    const cols = Math.ceil(MW / CELL);
    for (let y = Math.max(0, Math.floor(camY / CELL)); y <= Math.min(MH / CELL - 1, (camY + H) / CELL); y++)
      for (let x = Math.max(0, Math.floor(camX / CELL)); x <= Math.min(cols - 1, (camX + W) / CELL); x++)
        if (!V.fog[y * cols + x]) R(x * CELL - camX, y * CELL - camY, CELL + 1, CELL + 1, "rgba(28,22,18,.92)");
    if (V.flash > 0) R(0, 0, W, H, `rgba(255,255,255,${V.flash * 0.7})`);
    hud(W, H, t);
  }
  function label(s, x, y, c) {
    g.font = '700 14px "Pixelify Sans", sans-serif';
    g.textAlign = "center";
    g.fillStyle = "rgba(20,12,6,.7)";
    const w = g.measureText(s).width + 12;
    g.fillRect(Math.round(x - w / 2), Math.round(y - 13), w, 18);
    g.fillStyle = c;
    g.fillText(s, Math.round(x), Math.round(y));
  }
  function island(c, X, Y, t) {
    const [sand, land] = BIO[c.bio];
    const pts = [];
    for (let i = 0; i < 28; i++) {
      const a = (i / 28) * Math.PI * 2;
      pts.push([X + Math.cos(a) * shapeR(c, a), Y + Math.sin(a) * shapeR(c, a)]);
    }
    const poly = (k, col) => {
      g.fillStyle = col;
      g.beginPath();
      pts.forEach(([px, py], i) => {
        const qx = X + (px - X) * k,
          qy = Y + (py - Y) * k;
        i ? g.lineTo(qx, qy) : g.moveTo(qx, qy);
      });
      g.fill();
    };
    poly(1.08, "rgba(120,200,220,.35)");
    poly(1, sand);
    poly(0.82, land);
    const R = (x, y, w, h, col) => ((g.fillStyle = col), g.fillRect(Math.round(x), Math.round(y), w, h));
    // detalhes de cada terra
    const d = { tropical: () => [[-40, -20], [30, 10], [-10, 30]].forEach(([a, b]) => (R(X + a, Y + b, 3, 14, "#7a5a32"), R(X + a - 6, Y + b - 4, 15, 5, "#2a8a3a"))), deserto: () => (R(X - 20, Y - 30, 40, 22, "#e8e0d0"), R(X - 8, Y - 44, 16, 14, "#3a6ab0")), nevoa: () => R(X - 6, Y - 40, 12, 40, "#6a6a7a"), selva: () => [[-50, 0], [20, -30], [40, 30], [-20, 40]].forEach(([a, b]) => R(X + a, Y + b, 22, 22, "#145a1f")), gelo: () => [[-30, -10], [20, 20]].forEach(([a, b]) => R(X + a, Y + b, 26, 16, "#8a7a6a")), vulcao: () => (R(X - 26, Y - 10, 52, 30, "#3a2a26"), R(X - 8, Y - 26, 16, 16, "#2a1a16"), R(X - 4, Y - 30, 8, 6, "#ff6a2a"), R(X - 3 + Math.sin(t) * 3, Y - 44 - ((t * 10) % 20), 6, 6, "rgba(90,90,90,.6)")), ouro: () => [[-20, -10], [10, 10]].forEach(([a, b]) => (R(X + a, Y + b, 20, 16, "#f2c14e"), R(X + a + 6, Y + b - 6, 8, 6, "#fff0a0"))), jade: () => [[-30, -20], [10, 0]].forEach(([a, b]) => (R(X + a, Y + b, 30, 16, "#c94a3a"), R(X + a - 4, Y + b - 4, 38, 5, "#2a6a5a"))), ruinas: () => (R(X - 50, Y - 6, 90, 16, "#9a9488"), R(X + 30, Y - 14, 18, 18, "#9a9488"), R(X - 44, Y - 2, 4, 4, "#5a5448")) };
    d[c.bio] && d[c.bio]();
    if (S().found.includes(c.id)) {
      label(c.n, X, Y - c.r - 6, "#ffe8b0");
      if (S().col[c.id]) label("colônia", X, Y + c.r + 18, "#ff8a8a");
      else if (S().routes[c.id]) label("rota de exportação", X, Y + c.r + 18, "#a8e8a8");
    }
  }
  function ship(X, Y, h, t) {
    g.save();
    g.translate(Math.round(X), Math.round(Y));
    g.rotate(h);
    const bob = Math.sin(t * 3) * 0.6;
    g.fillStyle = "rgba(0,0,0,.25)";
    g.fillRect(-20, -6 + 3, 42, 14);
    g.fillStyle = "#5a3a1e";
    g.beginPath();
    g.moveTo(26, 0);
    g.lineTo(12, -9);
    g.lineTo(-20, -8);
    g.lineTo(-22, 0);
    g.lineTo(-20, 8);
    g.lineTo(12, 9);
    g.closePath();
    g.fill();
    g.fillStyle = "#8a5a2e";
    g.fillRect(-16, -5, 26, 10);
    g.fillStyle = "#3a2414";
    g.fillRect(-2, -1, 3, 3);
    // velas: abertas, meio ou recolhidas
    const sw = [3, 10, 15][V.sail];
    g.fillStyle = "#f2eee4";
    g.fillRect(-3, -sw + bob, 4, sw * 2);
    g.fillRect(-14, -sw * 0.8 + bob, 3, sw * 1.6);
    if (V.sail) ((g.fillStyle = "#c94a3a"), g.fillRect(-3, -2 + bob, 4, 4));
    g.restore();
  }
  function hud(W, H, t) {
    const sh = S().ship;
    if (!sh) return;
    const R = (x, y, w, h, c) => ((g.fillStyle = c), g.fillRect(x, y, w, h));
    R(10, 10, 300, 92, "rgba(239,226,192,.95)");
    R(10, 10, 300, 3, "#8a5a2e");
    R(10, 99, 300, 3, "#8a5a2e");
    g.textAlign = "left";
    g.font = '700 15px "Pixelify Sans", sans-serif';
    g.fillStyle = "#3a2414";
    g.fillText(`${sh.name} · dia ${V.days} no mar`, 20, 30);
    g.font = '600 13px "Pixelify Sans", sans-serif';
    const bar = (y, n, v, m, c) => (g.fillText(n, 20, y + 9), R(110, y, 150, 9, "#c9b890"), R(110, y, Math.max(0, 150 * Math.min(1, v / m)), 9, c), g.fillText(`${Math.round(v)}`, 266, y + 9));
    bar(40, "Casco", sh.hull, sh.max, sh.hull < sh.max * 0.3 ? "#c94a3a" : "#8a5a2e");
    bar(54, "Comida (dias)", sh.food, 30, "#c9a050");
    bar(68, "Água (dias)", sh.water, 30, "#4a8ac9");
    g.fillText(`Marujos: ${sh.crew}   Velas: ${V.anchor && !V.v ? "ancorado" : ["recolhidas", "meia vela", "todas"][V.sail]}`, 20, 94);
    // rosa dos ventos
    const cx = W - 54,
      cy = 54;
    g.fillStyle = "rgba(239,226,192,.95)";
    g.beginPath();
    g.arc(cx, cy, 40, 0, 7);
    g.fill();
    g.strokeStyle = "#8a5a2e";
    g.lineWidth = 3;
    g.stroke();
    g.save();
    g.translate(cx, cy);
    g.rotate(V.wind);
    g.fillStyle = "#4a8ac9";
    g.fillRect(-26, -2, 40, 4);
    g.beginPath();
    g.moveTo(22, 0);
    g.lineTo(12, -8);
    g.lineTo(12, 8);
    g.fill();
    g.restore();
    g.fillStyle = "#3a2414";
    g.textAlign = "center";
    g.font = '700 11px "Pixelify Sans", sans-serif';
    g.fillText("VENTO", cx, cy + 32);
    // aviso
    if (V.msgT > 0) {
      g.font = '700 17px "Pixelify Sans", sans-serif';
      const w = g.measureText(V.msg).width + 30;
      R(Math.round(W / 2 - w / 2), 110, Math.round(w), 30, "rgba(20,12,6,.8)");
      g.fillStyle = V.storm ? "#ff9a8a" : "#ffe8b0";
      g.fillText(V.msg, W / 2, 131);
    }
    // dica de controles
    g.font = '600 12px "Pixelify Sans", sans-serif';
    g.fillStyle = "rgba(255,255,255,.75)";
    g.fillText("A/D ou ◀ ▶: leme · W/S: velas · Espaço: parar (âncora) · E: atracar · encontre os 9 países do Mar Aberto", W / 2, H - 56);
  }

  /* ===================== NO MUNDO ===================== */
  const tgBase = targetAt;
  targetAt = function (x, y) {
    if (capAt(x, y)) return S().ship ? `Capitão do Porto: zarpar no ${S().ship.name}` : "Capitão do Porto (navios e grandes navegações)";
    if (backAt(x, y)) return `Voltar para ${ZONES[S().from && GATE[S().from] ? S().from : "porto"].nome.split(",")[0]}`;
    if (gateAt(x, y)) return "Portal do Cais dos Navegantes (navios de viagem)";
    return tgBase(x, y);
  };
  const iaBase = interactAt;
  interactAt = function (x, y) {
    if (atSea()) return; // no mar, as teclas são do navio (o boneco ficou no cais)
    if (capAt(x, y)) return capitania();
    if (backAt(x, y)) return leaveCais();
    if (gateAt(x, y)) return goCais();
    return iaBase(x, y);
  };
  const wkBase = walkable;
  walkable = function (z, x, y) {
    if (z === CZ && ((x === CAPT[0] && y === CAPT[1]) || (x === BACK[0] && y === BACK[1]))) return false;
    if (GATE[z] && GATE[z][0] === x && GATE[z][1] === y) return false;
    return wkBase(z, x, y);
  };
  function bigShip(X, Y, t, flag, name) {
    const R = (x, y, w, h, c) => ((ctx.fillStyle = c), ctx.fillRect(Math.round(x), Math.round(y), w, h));
    const b = Math.sin(t * 1.2 + X) * 1.5;
    Y += b;
    R(X - 4, Y + 150, 80, 8, "rgba(0,0,0,.25)");
    // casco visto de cima, de proa para o mar
    R(X + 8, Y + 4, 56, 10, "#5a3a1e");
    R(X, Y + 14, 72, 140, "#5a3a1e");
    R(X + 6, Y + 18, 60, 130, "#8a5a2e");
    for (let i = 0; i < 9; i++) R(X + 6, Y + 26 + i * 14, 60, 1, "#6b4423");
    R(X + 2, Y + 150, 68, 8, "#3a2414");
    for (const yy of [40, 80, 120]) (R(X - 4, Y + yy, 6, 6, "#2a2a2a"), R(X + 70, Y + yy, 6, 6, "#2a2a2a"));
    // mastros e velas enroladas
    for (const [yy, w] of [[36, 58], [80, 66], [124, 50]]) {
      R(X + 34, Y + yy - 22, 4, 30, "#3a2414");
      R(X + 36 - w / 2, Y + yy - 6, w, 8, "#efe8d8");
      R(X + 36 - w / 2, Y + yy + 1, w, 2, "#c9c0a8");
    }
    R(X + 33, Y - 14, 6, 20, "#3a2414");
    R(X + 39, Y - 14, 14, 8, flag);
    R(X + 14, Y + 132, 44, 12, "#efe2c0");
    if (name) {
      ctx.font = '700 10px "Pixelify Sans", sans-serif';
      ctx.fillStyle = "#3a2414";
      ctx.textAlign = "center";
      ctx.fillText(name, X + 36, Y + 141);
    }
  }
  const cdBase = crewDrawList;
  crewDrawList = function (list, t) {
    cdBase(list, t);
    const T = TILE;
    const R = (x, y, w, h, c) => ((ctx.fillStyle = c), ctx.fillRect(x, y, w, h));
    if (GATE[player.zone]) {
      const [gx, gy] = GATE[player.zone];
      list.push({
        y: gy,
        draw: () => {
          // arco de madeira com uma âncora pendurada, firme no chão
          const X = gx * T,
            Y = gy * T;
          R(X - 2, Y + 28, 36, 4, "rgba(0,0,0,.25)");
          R(X, Y - 26, 5, 56, "#5a3a1e");
          R(X + 27, Y - 26, 5, 56, "#5a3a1e");
          R(X - 4, Y - 32, 40, 8, "#6b4423");
          R(X + 15, Y - 24, 2, 8, "#3a2414");
          R(X + 10, Y - 16, 12, 3, "#8a8a96");
          R(X + 15, Y - 16, 2, 12, "#8a8a96");
          R(X + 10, Y - 6, 12, 2, "#8a8a96");
        },
      });
    }
    if (player.zone !== CZ) return;
    // placa de volta
    list.push({
      y: BACK[1],
      draw: () => {
        const X = BACK[0] * T,
          Y = BACK[1] * T;
        R(X + 14, Y + 4, 4, 26, "#5a3a1e");
        R(X + 2, Y + 2, 28, 12, "#8a5a2e");
        R(X + 4, Y + 6, 20, 2, "#efe2c0");
      },
    });
    // navios atracados nos cais
    const docks = [11, 24, 37];
    docks.forEach((dx, i) =>
      list.push({
        y: 11,
        draw: () => {
          const mine = i === 0 && S().ship;
          if (i === 0 && !S().ship) return;
          bigShip((dx + 1) * T + 4, 11 * T, t, mine ? "#3a5aa8" : ["#3a5aa8", "#c94a3a", "#3a8a5a"][i], mine ? S().ship.name : null);
        },
      }),
    );
    // o Capitão do Porto, de casaco azul e chapéu de bico
    list.push({
      y: CAPT[1],
      draw: () => {
        const X = CAPT[0] * T,
          Y = CAPT[1] * T;
        ctx.fillStyle = "rgba(0,0,0,.25)";
        ctx.beginPath();
        ctx.ellipse(X + 16, Y + 30, 9, 3, 0, 0, 7);
        ctx.fill();
        drawSprite(wizardRects("#2a3a6a", "#1a1a2a", "#d8d0c0", null, player.x < CAPT[0] ? "left" : "right", 0), X, Y, 2, player.x < CAPT[0]);
        drawPixelIcon("scroll", X + 16, Y - 8 - Math.abs(Math.sin(t * 3)) * 2, 2);
      },
    });
  };
  // rotas e colônias rendem todo dia
  const ndBase = onNewDay;
  onNewDay = function () {
    const r = ndBase.apply(this, arguments);
    const s = player.sea;
    if (!s) return r;
    const nR = Object.keys(s.routes || {}).length,
      nC = Object.keys(s.col || {}).length;
    const inc = nR * 35 + nC * 70;
    if (inc) {
      player.gold += inc;
      setTimeout(() => toast(`Além-mar: +${inc} ouro (${nR} rota(s) de exportação, ${nC} colônia(s)).`, 3800), 4200);
      // colônias às vezes se revoltam
      for (const id of Object.keys(s.col)) if (Math.random() < 0.04) (delete s.col[id], setTimeout(() => toast(`Revolta! ${C9.find((c) => c.id === id).n} expulsou os seus governadores.`, 5000), 6000));
    }
    return r;
  };
  window.capitania = capitania;
  window.seaState = () => V;
})();
