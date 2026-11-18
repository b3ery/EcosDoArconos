/**
 * ECOS DO ARCANO — florestas-locais.js
 * Cada vila, reino e país tem 3 FLORESTAS LOCAIS, nos dois modos. As saídas
 * da cidade (que antes levavam direto a outros reinos — agora a viagem é de
 * carruagem, cavalo ou navio) levam a elas:
 *  - a MATA DO RIO: um rio enorme, de margem a margem, com ponte e vau;
 *  - a MATA FECHADA: árvores densas, trilhas estreitas e um laguinho;
 *  - o VALE DO LAGO: clareiras e um lago grande. Em Cachoeira Grande (no
 *    país da Mata Verde) o vale tem a CACHOEIRA, despencando do paredão.
 * Cada terra tem o seu bioma: bichos, frutas e plantas próprios (camelo e
 * tâmara no deserto, alce e mirtilo no gelo, onça e açaí na mata...).
 *  - Gente que mora isolada: o caçador, a curandeira, o eremita, o pescador;
 *    eles compram, vendem e contam como anda a mata.
 *  - Caçar, pescar, colher e cortar árvore: tudo dá recurso, mas a mata
 *    sente. Cada espécie tem uma população. Caçou o último? Ela some dali
 *    para sempre. Cortou árvore demais? A mata adoece e os bichos param de
 *    nascer. Deixando em paz, ela se recupera aos poucos.
 * Modifica (envolve) simTravel, changeZone, enterZone, update, onNewDay,
 * targetAt, interactAt, walkable, drawTile e crewDrawList.
 */

"use strict";

(() => {
  const hsh = (a, b) => {
    let h = (a * 374761393) ^ (b * 668265263);
    h = (h ^ (h >>> 13)) * 1274126177;
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  };
  const sid = (s) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
  const rng = (seed) => {
    let s = seed >>> 0 || 1;
    return () => ((s = (s * 1664525 + 1013904223) >>> 0), s / 4294967296);
  };

  /* ===================== FRUTAS (itens novos) ===================== */
  const FRUITS = {
    f_maca: ["Maçã Silvestre", "apple", 18, 8],
    f_amora: ["Amora do Mato", "apple", 12, 6],
    f_mirtilo: ["Mirtilo", "apple", 12, 6],
    f_pinhao: ["Pinhão Assado", "bread", 20, 0],
    f_coco: ["Coco Verde", "water", 10, 30],
    f_manga: ["Manga", "apple", 22, 10],
    f_tamara: ["Tâmara", "apple", 16, 0],
    f_figo: ["Figo", "apple", 16, 4],
    f_banana: ["Banana", "apple", 22, 4],
    f_acai: ["Açaí", "apple", 18, 6],
    f_cacau: ["Fruto de Cacau", "apple", 14, 6],
    f_pessego: ["Pêssego", "apple", 20, 10],
    f_lichia: ["Lichia", "apple", 14, 8],
    f_cogumelo: ["Cogumelo do Mato", "stew", 14, 0],
  };
  for (const [id, [nome, icon, food, water]] of Object.entries(FRUITS)) {
    if (!ITEMS[id]) ITEMS[id] = { nome, tipo: "food", preco: 4, food, water, desc: `Colhido na mata. Fome +${food}${water ? `, sede +${water}` : ""}.` };
    if (typeof ITEM_ICONS !== "undefined") ITEM_ICONS[id] = icon;
  }

  /* ===================== BICHOS ===================== */
  // k: forma do desenho · h: ataca · hp, dmg · c: cor · a: detalhe · u: tamanho · loot
  const SP = {
    cervo: { n: "Cervo", k: "quad", hp: 22, c: "#a8784a", a: "#f2e0c0", u: 2, horn: 1, loot: ["carne", "couro"] },
    javali: { n: "Javali", k: "quad", h: 1, hp: 40, dmg: 9, c: "#5a4030", a: "#e8e0d0", u: 1.8, loot: ["carne", "carne"] },
    lobo: { n: "Lobo", k: "quad", h: 1, hp: 32, dmg: 8, c: "#7a7488", a: "#c9c4d0", u: 1.9, loot: ["couro", "carne"] },
    urso: { n: "Urso", k: "big", h: 1, hp: 85, dmg: 15, c: "#4a3020", a: "#6a4a30", u: 2.4, loot: ["couro", "couro", "carne"] },
    raposa: { n: "Raposa", k: "quad", hp: 14, c: "#d9702a", a: "#f6f2ea", u: 1.4, loot: ["couro"] },
    coelho: { n: "Coelho", k: "small", hp: 6, c: "#c9b8a0", a: "#f6f2ea", u: 1.1, loot: ["carne"] },
    esquilo: { n: "Esquilo", k: "small", hp: 4, c: "#a85a2a", a: "#f2c898", u: 1, loot: [] },
    coruja: { n: "Coruja", k: "bird", hp: 6, c: "#8a6a4a", a: "#f2e0a0", u: 1.2, loot: ["pena"] },
    gaivota: { n: "Gaivota", k: "bird", hp: 5, c: "#f2f2f6", a: "#f2a83a", u: 1.2, loot: ["pena"] },
    garca: { n: "Garça", k: "bird", hp: 8, c: "#f6f6fa", a: "#f2c14e", u: 1.5, loot: ["pena"] },
    lontra: { n: "Lontra", k: "small", hp: 10, c: "#6a4a30", a: "#c9a878", u: 1.3, loot: ["couro"] },
    cabra: { n: "Cabra-montesa", k: "quad", hp: 20, c: "#d9d0c0", a: "#6a5a4a", u: 1.6, horn: 1, loot: ["carne", "couro"] },
    aguia: { n: "Águia", k: "bird", hp: 10, c: "#5a3a22", a: "#f6f2ea", u: 1.5, loot: ["pena"] },
    marmota: { n: "Marmota", k: "small", hp: 8, c: "#8a6a42", a: "#c9a878", u: 1.1, loot: ["carne"] },
    lince: { n: "Lince", k: "quad", h: 1, hp: 30, dmg: 9, c: "#c9a060", a: "#3a2a1a", u: 1.6, loot: ["couro"] },
    papagaio: { n: "Papagaio", k: "bird", hp: 5, c: "#3ab04a", a: "#e0303a", u: 1.1, loot: ["pena"] },
    macaco: { n: "Macaco", k: "ape", hp: 14, c: "#7a5230", a: "#e8b896", u: 1.4, loot: [] },
    tartaruga: { n: "Tartaruga", k: "reptile", hp: 18, c: "#4a7a3a", a: "#a8843a", u: 1.4, shell: 1, loot: ["carne"] },
    caranguejo: { n: "Caranguejo", k: "small", hp: 4, c: "#e05a3a", a: "#f2a080", u: 1, loot: ["carne"] },
    cobra: { n: "Cobra", k: "reptile", h: 1, hp: 12, dmg: 10, c: "#5a8a3a", a: "#e8d050", u: 1.4, loot: ["couro"] },
    camelo: { n: "Camelo", k: "big", hp: 50, c: "#c9a060", a: "#a8804a", u: 2.3, hump: 1, loot: ["carne", "couro"] },
    gazela: { n: "Gazela", k: "quad", hp: 16, c: "#d9a060", a: "#f6f2ea", u: 1.6, horn: 1, loot: ["carne"] },
    chacal: { n: "Chacal", k: "quad", h: 1, hp: 22, dmg: 7, c: "#b08a50", a: "#5a4030", u: 1.5, loot: ["couro"] },
    escorpiao: { n: "Escorpião", k: "reptile", h: 1, hp: 8, dmg: 11, c: "#3a2a1a", a: "#c94a2a", u: 1.1, loot: [] },
    falcao: { n: "Falcão", k: "bird", hp: 8, c: "#8a6a4a", a: "#f2e0a0", u: 1.3, loot: ["pena"] },
    sapo: { n: "Sapo", k: "small", hp: 3, c: "#5a8a3a", a: "#e8e050", u: 0.9, loot: [] },
    jacare: { n: "Jacaré", k: "reptile", h: 1, hp: 60, dmg: 16, c: "#3a5a32", a: "#c9c06a", u: 2.2, loot: ["couro", "carne"] },
    onca: { n: "Onça-pintada", k: "quad", h: 1, hp: 55, dmg: 15, c: "#e8a43a", a: "#3a2414", u: 2, spots: 1, loot: ["couro"] },
    tucano: { n: "Tucano", k: "bird", hp: 6, c: "#1a1a1a", a: "#ff9a2a", u: 1.2, loot: ["pena"] },
    anta: { n: "Anta", k: "big", hp: 45, c: "#4a4040", a: "#8a8078", u: 2, loot: ["carne", "carne"] },
    capivara: { n: "Capivara", k: "small", hp: 18, c: "#8a6a42", a: "#6a4a2a", u: 1.6, loot: ["carne"] },
    arara: { n: "Arara", k: "bird", hp: 6, c: "#3a6ac8", a: "#f2c14e", u: 1.3, loot: ["pena"] },
    alce: { n: "Alce", k: "big", hp: 60, c: "#5a3a22", a: "#c9a878", u: 2.3, horn: 1, loot: ["carne", "carne", "couro"] },
    raposaArtica: { n: "Raposa-do-ártico", k: "quad", hp: 14, c: "#f2f2f6", a: "#c9c9d0", u: 1.4, loot: ["couro"] },
    lebre: { n: "Lebre-das-neves", k: "small", hp: 6, c: "#f6f6fa", a: "#c9c9d0", u: 1.1, loot: ["carne"] },
    corujaNeve: { n: "Coruja-das-neves", k: "bird", hp: 6, c: "#f6f6fa", a: "#3a3a3a", u: 1.3, loot: ["pena"] },
    lagarto: { n: "Lagarto de Lava", k: "reptile", hp: 12, c: "#8a3a2a", a: "#f2a03a", u: 1.3, loot: ["couro"] },
    corvo: { n: "Corvo", k: "bird", hp: 4, c: "#1a1a22", a: "#5a5a6a", u: 1.1, loot: ["pena"] },
    zebra: { n: "Zebra", k: "quad", hp: 30, c: "#f6f6fa", a: "#1a1a1a", u: 2, stripes: 1, loot: ["carne", "couro"] },
    girafa: { n: "Girafa", k: "tall", hp: 40, c: "#e8b050", a: "#8a5a2a", u: 2.4, spots: 1, loot: ["carne"] },
    leao: { n: "Leão", k: "quad", h: 1, hp: 60, dmg: 16, c: "#d9a050", a: "#8a5a2a", u: 2.1, mane: 1, loot: ["couro"] },
    elefante: { n: "Elefante", k: "big", hp: 110, c: "#8a8a92", a: "#c9c9d0", u: 2.8, trunk: 1, loot: ["carne", "carne"] },
    hiena: { n: "Hiena", k: "quad", h: 1, hp: 26, dmg: 8, c: "#a89070", a: "#5a4030", u: 1.6, spots: 1, loot: ["couro"] },
    avestruz: { n: "Avestruz", k: "tall", hp: 24, c: "#2a2228", a: "#f2e8e0", u: 2, loot: ["pena", "carne"] },
    panda: { n: "Panda", k: "big", hp: 50, c: "#f6f6fa", a: "#1a1a1a", u: 2.1, panda: 1, loot: [] },
    tigre: { n: "Tigre", k: "quad", h: 1, hp: 60, dmg: 15, c: "#e8862a", a: "#1a1a1a", u: 2.1, stripes: 1, loot: ["couro"] },
  };

  /* ===================== BIOMAS ===================== */
  const BIOME = {
    temperado: { theme: "bosque", sp: ["cervo", "javali", "lobo", "urso", "raposa", "coelho", "esquilo", "coruja"], fr: ["f_maca", "f_amora", "f_cogumelo"], plant: ["samambaia", "cogumelos", "flores"], names: ["Mata do Rio Grande", "Bosque Fechado", "Vale do Lago"], hermits: ["Caçador Rufino", "Curandeira Odete", "Pescador Teobaldo"] },
    costa: { theme: "bosque", sp: ["gaivota", "garca", "lontra", "raposa", "cervo", "javali", "caranguejo"], fr: ["f_amora", "f_maca"], plant: ["samambaia", "flores", "junco"], names: ["Mata da Foz", "Restinga Fechada", "Lagoa Salobra"], hermits: ["Pescadora Brisa", "Coletor de Conchas Ivo", "Velha do Farolete"] },
    montanha: { theme: "serra", sp: ["cabra", "lobo", "urso", "aguia", "marmota", "lince"], fr: ["f_mirtilo", "f_pinhao"], plant: ["pinheirinho", "pedras", "flores"], names: ["Rio da Garganta", "Pinheiral Alto", "Lago do Pico"], hermits: ["Pastor de Cabras Elói", "Ermitã Rocha", "Caçador de Águias Doro"] },
    coral: { theme: "bosque", sp: ["papagaio", "macaco", "tartaruga", "caranguejo", "javali", "cobra"], fr: ["f_coco", "f_manga"], plant: ["palmeirinha", "flores", "samambaia"], names: ["Rio dos Coqueiros", "Mata das Palmas", "Lagoa Turquesa"], hermits: ["Coletora de Cocos Nalu", "Curandeiro Kaimana", "Pescador Iolo"] },
    zahar: { theme: "porto", sp: ["camelo", "gazela", "chacal", "escorpiao", "falcao", "raposa"], fr: ["f_tamara", "f_figo"], plant: ["cacto", "pedras", "capim"], names: ["Oásis do Rio Seco", "Palmeiral das Tâmaras", "Lago da Miragem"], hermits: ["Beduína Samira", "Ermitão das Dunas Faruk", "Guardião do Poço Idris"] },
    brumas: { theme: "pantano", sp: ["sapo", "cobra", "garca", "lobo", "jacare", "coruja"], fr: ["f_amora", "f_cogumelo"], plant: ["junco", "cogumelos", "samambaia"], names: ["Rio das Névoas", "Charco Fechado", "Lago dos Sussurros"], hermits: ["Bruxa do Charco Morwen", "Barqueiro Tulo", "Coletora de Musgo Eira"] },
    verde: { theme: "bosque", sp: ["onca", "macaco", "tucano", "anta", "capivara", "jacare", "cobra", "arara"], fr: ["f_banana", "f_acai", "f_cacau"], plant: ["samambaia", "flores", "palmeirinha"], names: ["Rio Serpente Grande", "Selva Fechada", "Vale da Cachoeira"], hermits: ["Pajé Jaci", "Caçadora Potira", "Pescador Iberê"] },
    gelo: { theme: "picos", sp: ["alce", "lobo", "urso", "raposaArtica", "lebre", "corujaNeve"], fr: ["f_mirtilo", "f_pinhao"], plant: ["pinheirinho", "pedras", "capim"], names: ["Rio do Degelo", "Taiga Fechada", "Lago Congelado"], hermits: ["Caçador de Peles Bjorn", "Velha Hilde da Cabana", "Pescador no Gelo Leif"] },
    ferro: { theme: "serra", sp: ["cabra", "lagarto", "corvo", "lobo", "javali"], fr: ["f_figo", "f_pinhao"], plant: ["pedras", "capim", "cogumelos"], names: ["Rio de Cinzas", "Mata Queimada", "Lago Vulcânico"], hermits: ["Carvoeiro Torg", "Ermitã da Cinza Marga", "Garimpeiro Durin"] },
    ouro: { theme: "porto", sp: ["zebra", "girafa", "leao", "elefante", "hiena", "avestruz"], fr: ["f_manga", "f_tamara"], plant: ["capim", "flores", "cacto"], names: ["Rio Dourado", "Savana das Acácias", "Lago dos Elefantes"], hermits: ["Guia da Savana Áureo", "Curandeira Topázio", "Pescador Solano"] },
    jade: { theme: "bosque", sp: ["panda", "garca", "macaco", "raposa", "tigre", "coelho"], fr: ["f_pessego", "f_lichia"], plant: ["bambu", "flores", "pedras"], names: ["Rio do Dragão", "Bambuzal Fechado", "Lago das Garças"], hermits: ["Monge Shun", "Herbolária Mei", "Pescador Yun"] },
    gigantes: { theme: "serra", sp: ["cabra", "aguia", "urso", "lobo", "marmota"], fr: ["f_pinhao", "f_mirtilo"], plant: ["pedras", "capim", "pinheirinho"], names: ["Rio entre os Dedos", "Mata do Ombro", "Lago do Olho de Pedra"], hermits: ["Ermitão Pedrão", "Vigia Musgo", "Ermitã Lasca"] },
  };
  for (const [k, v] of Object.entries(BIOME)) v.key = k;
  const MOUNTAIN = new Set(["montanha", "gelo", "gigantes", "jade", "ferro"]);
  const TOWNS = () => Object.keys(ZONES).filter((z) => z === "vila" || z === "porto" || z === "serra" || z === "solmar" || z === "rosalva" || /^pais-[a-z]+(-\d)?$/.test(z));
  function biomeOf(town) {
    if (town.startsWith("pais-")) return BIOME[town.split("-")[1]] || BIOME.temperado;
    return { porto: BIOME.costa, serra: BIOME.montanha, solmar: BIOME.coral }[town] || BIOME.temperado;
  }
  const WATERFALL_TOWN = "pais-verde-3"; // o reino de Cachoeira Grande
  const fid = (town, i) => `mata-${town}-${i}`;
  const parseF = (z) => {
    const m = /^mata-(.+)-(\d)$/.exec(z || "");
    return m ? { town: m[1], i: +m[2] } : null;
  };
  const isMata = (z) => !!parseF(z);
  window.isLocalForest = isMata;
  const OPP = { w: "e", e: "w", n: "s", s: "n" };

  /* ===================== SAÍDAS DAS CIDADES ===================== */
  const PASS = new Set(".,PEL=gwubxhnkqAozYVZtRp".split(""));
  const EXITS = {}; // town -> {dir: fid}
  function carveExits(town) {
    const Z = ZONES[town];
    if (!Z || !Z.map || !Z.town) return;
    const m = Z.map.map((r) => r.split(""));
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
    const plan = new Set();
    for (const b of Z.town.bld) if (b.plan) for (const k of Object.keys(b.plan)) plan.add(k);
    const sides = {
      w: { cells: () => Array.from({ length: H - 4 }, (_, k) => [0, k + 2]), inV: [1, 0], mid: H / 2 },
      e: { cells: () => Array.from({ length: H - 4 }, (_, k) => [W - 1, k + 2]), inV: [-1, 0], mid: H / 2 },
      n: { cells: () => Array.from({ length: W - 4 }, (_, k) => [k + 2, 0]), inV: [0, 1], mid: W / 2 },
      s: { cells: () => Array.from({ length: W - 4 }, (_, k) => [k + 2, H - 1]), inV: [0, -1], mid: W / 2 },
    };
    const order = town === "vila" ? ["w", "n", "e"] : ["w", "n", "e", "s"];
    const out = {};
    let n = 0;
    for (const d of order) {
      if (n >= 3) break;
      // a vila já tem as saídas dela
      if (town === "vila") {
        out[d] = fid(town, n++);
        continue;
      }
      const S = sides[d];
      let best = null;
      for (const [x, y] of S.cells()) {
        // anda para dentro até achar chão alcançável (no máximo 4 tiles)
        for (let s = 1; s <= 4; s++) {
          const ix = x + S.inV[0] * s,
            iy = y + S.inV[1] * s;
          if (!m[iy] || plan.has(ix + "," + iy)) break;
          if (seen[iy * W + ix]) {
            let okLine = true;
            for (let k = 1; k < s; k++) if (!".,T#wu".includes(m[y + S.inV[1] * k][x + S.inV[0] * k]) || plan.has(x + S.inV[0] * k + "," + (y + S.inV[1] * k))) okLine = false;
            const c = d === "w" || d === "e" ? y : x;
            const score = Math.abs(c - S.mid) + s * 3;
            if (okLine && (!best || score < best.score)) best = { x, y, s, score };
            break;
          }
          if (!".,T#wu".includes(m[iy][ix])) break;
        }
      }
      if (!best) continue;
      for (let k = 0; k < best.s; k++) m[best.y + S.inV[1] * k][best.x + S.inV[0] * k] = ",";
      Z.open = Z.open || {};
      Z.exits = Z.exits || {};
      Z.open[d] = [best.x, best.y];
      Z.exits[d] = fid(town, n);
      out[d] = fid(town, n++);
    }
    Z.map = m.map((r) => r.join(""));
    EXITS[town] = out;
  }
  for (const t of TOWNS()) carveExits(t);
  window.FOREST_EXITS = EXITS;

  /* ===================== GERADOR DA MATA ===================== */
  const FW = 74,
    FH = 46;
  const DEF = {}; // fid -> dados extras (adereços, eremita, cachoeira)
  function buildForest(id) {
    if (ZONES[id]) return ZONES[id];
    const P = parseF(id);
    const B = biomeOf(P.town);
    const R = rng(sid(id));
    const W = FW,
      H = FH;
    const m = Array.from({ length: H }, (_, y) => Array.from({ length: W }, (_, x) => (x === 0 || y === 0 || x === W - 1 || y === H - 1 ? "#" : ".")));
    // de que lado se entra: o oposto da saída da cidade
    const dirOut = Object.keys(EXITS[P.town] || {}).find((d) => EXITS[P.town][d] === id) || "w";
    const ent = OPP[dirOut];
    const entPos = { w: [0, H >> 1], e: [W - 1, H >> 1], n: [W >> 1, 0], s: [W >> 1, H - 1] }[ent];
    const inner = [Math.min(W - 3, Math.max(2, entPos[0] + (ent === "w" ? 2 : ent === "e" ? -2 : 0))), Math.min(H - 3, Math.max(2, entPos[1] + (ent === "n" ? 2 : ent === "s" ? -2 : 0)))];
    const trail = new Set();
    const water = new Set();
    const carve = (a, b, wide) => {
      let [x, y] = a;
      let guard = 0;
      while ((x !== b[0] || y !== b[1]) && guard++ < 600) {
        if (R() < 0.6) x += Math.sign(b[0] - x);
        else y += Math.sign(b[1] - y);
        if (R() < 0.15) x += R() < 0.5 ? 1 : -1;
        x = Math.max(2, Math.min(W - 3, x));
        y = Math.max(2, Math.min(H - 3, y));
        trail.add(x + "," + y);
        if (wide) trail.add(x + 1 + "," + y);
      }
    };
    // 6 clareiras ligadas por trilhas
    const spots = [inner, ...Array.from({ length: 6 }, () => [6 + Math.floor(R() * (W - 12)), 6 + Math.floor(R() * (H - 12))])];
    for (let k = 1; k < spots.length; k++) carve(spots[k - 1], spots[k], k === 1);
    carve(spots[spots.length - 1], spots[1]);
    for (let k = 0; k <= 2; k++) trail.add(entPos[0] + (ent === "w" ? k : ent === "e" ? -k : 0) + "," + (entPos[1] + (ent === "n" ? k : ent === "s" ? -k : 0)));
    const clear = (cx, cy, r) => {
      for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) if (dx * dx + dy * dy <= r * r + 1) trail.add(cx + dx + "," + (cy + dy));
    };
    spots.forEach(([x, y], k) => clear(x, y, k === 0 ? 2 : 2 + Math.floor(R() * 2)));
    // RIO: na Mata do Rio, um rio enorme de ponta a ponta; nas outras, um riacho
    const riverW = P.i === 0 ? 6 : 2;
    const vertical = ent === "w" || ent === "e";
    const base = (vertical ? W : H) * (0.5 + (R() - 0.5) * 0.2);
    const ph = R() * 6;
    const span = vertical ? H : W;
    const riverAt = (t) => base + Math.sin(t / 7 + ph) * (P.i === 0 ? 7 : 4) + Math.sin(t / 2.9 + ph * 2) * 1.6;
    if (P.i !== 2 || R() < 0.5)
      for (let t = 1; t < span - 1; t++) {
        const c = riverAt(t);
        const wv = riverW + Math.round(Math.sin(t / 5 + ph) * (P.i === 0 ? 1.5 : 0.6));
        for (let k = Math.round(c - wv / 2); k < Math.round(c + wv / 2); k++) {
          const x = vertical ? k : t,
            y = vertical ? t : k;
          if (x > 0 && y > 0 && x < W - 1 && y < H - 1) water.add(x + "," + y);
        }
      }
    // LAGO: no Vale do Lago, um lago grande; na Mata Fechada, um laguinho
    const lake = P.i === 2 ? [W * (0.35 + R() * 0.3), H * (0.35 + R() * 0.25), 9, 6] : P.i === 1 ? [W * (0.3 + R() * 0.4), H * (0.3 + R() * 0.4), 3, 2.4] : null;
    if (lake)
      for (let y = 1; y < H - 1; y++)
        for (let x = 1; x < W - 1; x++) {
          const v = ((x - lake[0]) / lake[2]) ** 2 + ((y - lake[1]) / lake[3]) ** 2 + (hsh(x, y + 5) - 0.5) * 0.3;
          if (v < 1) water.add(x + "," + y);
        }
    // CACHOEIRA: paredão de pedra em cima e a água despencando no lago
    const fall = id === fid(WATERFALL_TOWN, 2) ? { x: Math.round(lake[0]), top: 1, bottom: Math.round(lake[1] - lake[3]) } : null;
    const cliff = new Set();
    const height = new Map(); // altura de cada pedra da montanha (para a neve e a cratera)
    const lava = new Set();
    // MONTANHA: um maciço de pedra no meio da mata (nas terras altas);
    // VULCÃO: na terra do ferro, o Vale vira um vulcão com cratera e lago de lava
    const volcano = B.key === "ferro" && P.i === 2;
    if ((MOUNTAIN.has(B.key) && P.i === 1) || volcano) {
      const far = (a) => Math.abs(a[0] - entPos[0]) + Math.abs(a[1] - entPos[1]);
      let mx = W * (0.3 + R() * 0.4),
        my = H * (0.3 + R() * 0.4);
      if (far([mx, my]) < 25) ((mx = W - mx), (my = H - my));
      const rx = volcano ? 11 : 9 + R() * 4,
        ry = volcano ? 8 : 6 + R() * 3;
      for (let y = 2; y < H - 2; y++)
        for (let x = 2; x < W - 2; x++) {
          // silhueta orgânica: o raio ondula devagar em volta (lobos e vales), sem ruído de tile a tile
          const ang = Math.atan2(y - my, x - mx);
          const wob = 1 + Math.sin(ang * 3 + ph) * 0.12 + Math.sin(ang * 5 + ph * 2) * 0.07;
          const d = Math.sqrt(((x - mx) / rx) ** 2 + ((y - my) / ry) ** 2) / wob;
          if (d < 1) {
            cliff.add(x + "," + y);
            height.set(x + "," + y, 1 - d);
            if (volcano && d < 0.22) lava.add(x + "," + y);
          }
        }
    }
    // alisa a altura (dois passes) para os degraus formarem anéis contínuos
    for (let pass = 0; pass < 2; pass++) {
      const nx = new Map();
      for (const [k, v] of height) {
        const [x, y] = k.split(",").map(Number);
        let sum = 0,
          n = 0;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          const q = height.get(x + dx + "," + (y + dy));
          sum += q == null ? 0 : q;
          n++;
        }
        nx.set(k, Math.max(0.01, (v + sum / n) / 2));
      }
      for (const [k, v] of nx) height.set(k, v);
    }
    if (fall) {
      for (let y = 1; y < fall.bottom; y++) for (let x = fall.x - 3; x <= fall.x + 3; x++) water.add(x + "," + y);
      for (let y = 1; y < Math.min(fall.bottom, 10); y++) for (let x = 1; x < W - 1; x++) if (Math.abs(x - fall.x) > 3) cliff.add(x + "," + y);
    }
    // monta o mapa: água, ponte onde a trilha cruza o rio, árvores fora da trilha
    for (let y = 1; y < H - 1; y++)
      for (let x = 1; x < W - 1; x++) {
        const k = x + "," + y;
        if (lava.has(k)) m[y][x] = "~";
        else if (cliff.has(k)) m[y][x] = "#";
        else if (water.has(k)) m[y][x] = "~";
        else if (trail.has(k)) m[y][x] = ".";
        else {
          const dens = P.i === 1 ? 0.62 : 0.5;
          const nz = hsh(Math.floor(x / 3), Math.floor(y / 3) + sid(id) % 97) * 0.6 + hsh(x, y) * 0.4;
          if (nz < dens) m[y][x] = x < 3 || y < 3 || x > W - 4 || y > H - 4 ? "#" : "T";
        }
      }
    // pontes de verdade: a principal, na direção da entrada, e mais uma lá longe
    const bridgeAt = (t) => {
      const c = riverAt(t);
      for (let k = Math.round(c - 8); k <= Math.round(c + 8); k++) {
        const x = vertical ? k : t,
          y = vertical ? t : k;
        if (!m[y] || x <= 0 || x >= W - 1 || y <= 0 || y >= H - 1 || lava.has(x + "," + y) || cliff.has(x + "," + y) || (fall && y <= fall.bottom + 1 && Math.abs(x - fall.x) <= 4)) continue;
        if (m[y][x] === "~" && !(lake && (((x - lake[0]) / lake[2]) ** 2 + ((y - lake[1]) / lake[3]) ** 2 < 1.1))) m[y][x] = "=";
        else if (m[y][x] === "T") m[y][x] = ".";
      }
    };
    const mainT = vertical ? entPos[1] : entPos[0];
    bridgeAt(Math.max(3, Math.min(span - 4, mainT)));
    bridgeAt(mainT < span / 2 ? Math.round(span * 0.8) : Math.round(span * 0.2));
    m[entPos[1]][entPos[0]] = ".";
    // tudo o que é chão precisa ser alcançável a partir da entrada
    const W8 = (x, y) => ".=".includes(m[y][x]);
    const seen = new Set([entPos[0] + "," + entPos[1]]);
    const q = [entPos];
    for (let i = 0; i < q.length; i++) {
      const [x, y] = q[i];
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx,
          ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= W || ny >= H || seen.has(nx + "," + ny) || !W8(nx, ny)) continue;
        seen.add(nx + "," + ny);
        q.push([nx, ny]);
      }
    }
    for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) if (m[y][x] === "." && !seen.has(x + "," + y)) m[y][x] = "T";
    // cortes de árvore que você já fez continuam cortados
    const S = state(id);
    for (const k of S.cut) {
      const [x, y] = k.split(",").map(Number);
      if (m[y] && m[y][x] === "T") m[y][x] = ".";
    }
    // adereços: frutíferas, plantas do bioma, a cabana do eremita
    const floor = [...seen].map((k) => k.split(",").map(Number)).filter(([x, y]) => m[y][x] === "." && Math.abs(x - entPos[0]) + Math.abs(y - entPos[1]) > 4);
    const props = new Map();
    const take = (cond) => {
      for (let tries = 0; tries < 200; tries++) {
        const c = floor[Math.floor(R() * floor.length)];
        if (c && !props.has(c[0] + "," + c[1]) && (!cond || cond(c))) return c;
      }
      return null;
    };
    // a cabana fica numa clareira (as frutíferas e a cabana não fecham trilha: só ficam
    // onde tem chão livre dos dois lados)
    const roomy = ([x, y]) => [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([dx, dy]) => m[y + dy] && m[y + dy][x + dx] === ".").length >= 3;
    const hut = take(([x, y]) => roomy([x, y]) && roomy([x + 1, y]) && m[y][x + 1] === "." && m[y + 1] && m[y + 1][x] === ".");
    // conta quanto chão dá para alcançar da entrada sem passar pelas coisas sólidas
    const solid = new Set();
    const reachCount = () => {
      const sn = new Set([entPos[0] + "," + entPos[1]]);
      const qq = [entPos];
      for (let i = 0; i < qq.length; i++) {
        const [x, y] = qq[i];
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nx = x + dx,
            ny = y + dy,
            kk = nx + "," + ny;
          if (nx < 0 || ny < 0 || nx >= W || ny >= H || sn.has(kk) || solid.has(kk) || !".=".includes(m[ny][nx])) continue;
          sn.add(kk);
          qq.push([nx, ny]);
        }
      }
      return sn.size;
    };
    let full = reachCount();
    // só fica onde não corta caminho de ninguém (no máximo a própria casinha some do mapa andável)
    const place = (cells, kinds) => {
      for (const c of cells) solid.add(c[0] + "," + c[1]);
      const n = reachCount();
      if (n >= full - cells.length) {
        cells.forEach((c, i) => props.set(c[0] + "," + c[1], kinds[i]));
        full = n;
        return true;
      }
      for (const c of cells) solid.delete(c[0] + "," + c[1]);
      return false;
    };
    let hutOk = hut && place([hut, [hut[0] + 1, hut[1]], [hut[0], hut[1] + 1]], ["cabana", "cabana2", "eremita"]);
    if (hutOk) props.delete(hut[0] + "," + (hut[1] + 1));
    for (let k = 0; k < 14; k++) {
      const c = take(roomy);
      if (c) place([c], ["fruta:" + B.fr[k % B.fr.length]]);
    }
    for (let k = 0; k < 60; k++) {
      const c = take();
      if (c) props.set(c[0] + "," + c[1], "planta:" + B.plant[k % B.plant.length]);
    }
    const hermit = hutOk ? { x: hut[0], y: hut[1] + 1, nm: B.hermits[P.i % B.hermits.length] } : null;
    const nome = B.names[P.i] + (P.town === WATERFALL_TOWN && P.i === 2 ? "" : "");
    DEF[id] = { props, hermit, fall, cliff, height, lava, volcano, biome: B, town: P.town, floor: floor.filter(([x, y]) => !props.has(x + "," + y)) };
    const open = { [ent]: entPos };
    const exits = { [ent]: P.town };
    const z = finalize(id, { nome: `${nome} · ${ZONES[P.town].nome}`, theme: B.theme, exits, enemies: [] }, m, W, H, open, {}, null);
    ZONES[id] = z;
    return z;
  }
  window.buildLocalForest = buildForest;
  window.FOREST_DEF = DEF;

  /* ===================== ESTADO (população, saúde) ===================== */
  function state(id) {
    player.matas = player.matas || {};
    let S = player.matas[id];
    if (!S) {
      const P = parseF(id);
      const B = biomeOf(P.town);
      const R = rng(sid(id) + 3);
      const pop = {};
      // cada mata tem 5 a 7 espécies da terra, umas mais comuns que outras
      const list = B.sp.slice().sort(() => R() - 0.5).slice(0, Math.min(B.sp.length, 5 + Math.floor(R() * 3)));
      for (const k of list) pop[k] = SP[k].h ? 3 + Math.floor(R() * 3) : 5 + Math.floor(R() * 6);
      S = player.matas[id] = { pop, start: { ...pop }, health: 100, cut: [], fish: 12, fruit: {}, extinct: [] };
    }
    return S;
  }
  const totalPop = (S) => Object.values(S.pop).reduce((a, b) => a + b, 0);
  function status(S) {
    const t = totalPop(S),
      t0 = Object.values(S.start).reduce((a, b) => a + b, 0) || 1;
    const r = t / t0;
    if (t === 0) return ["morta", "Não se ouve um bicho. A mata está morta."];
    if (S.health < 40 || r < 0.35) return ["doente", "A mata está doente: pouca árvore, pouco bicho."];
    if (r < 0.75) return ["escassa", "Os bichos estão ficando raros por aqui."];
    return ["viva", "A mata está viva e cheia de bichos."];
  }
  // todo dia: a mata se recupera devagar se você deixa em paz
  const ndBase = onNewDay;
  onNewDay = function () {
    const r = ndBase.apply(this, arguments);
    for (const [id, S] of Object.entries(player.matas || {})) {
      S.health = Math.min(100, S.health + 1.5);
      S.fish = Math.min(14, S.fish + 1);
      for (const k of Object.keys(S.pop)) {
        const n = S.pop[k];
        if (n === 0) continue; // extinto: não volta
        if (n >= 2 && S.health >= 50 && n < S.start[k] + 2 && Math.random() < 0.35) S.pop[k] = n + 1;
      }
    }
    return r;
  };

  /* ===================== ENTRAR NA MATA ===================== */
  const czBase = changeZone;
  changeZone = function (dest, dir) {
    if (isMata(dest)) buildForest(dest);
    return czBase.apply(this, arguments);
  };
  if (typeof simTravel === "function") {
    const stBase = simTravel;
    simTravel = function (dir) {
      if (player.zone === "vila" && EXITS.vila && EXITS.vila[dir]) {
        changeZone(EXITS.vila[dir], dir);
        return true;
      }
      return stBase.apply(this, arguments);
    };
  }
  // a vila: as três saídas viram as trilhas das matas
  if (ZONES.vila) {
    ZONES.vila.exits = ZONES.vila.exits || {};
  }
  let herd = [];
  const ezBase = enterZone;
  enterZone = function () {
    const r = ezBase.apply(this, arguments);
    herd = [];
    if (isMata(player.zone)) {
      buildForest(player.zone);
      spawnHerd();
      const S = state(player.zone);
      const st = status(S);
      setTimeout(() => toast(`${ZONES[player.zone].nome.split(" · ")[0]} — ${st[1]}`, 3200), 600);
    }
    return r;
  };
  function spawnHerd() {
    const id = player.zone,
      S = state(id),
      D = DEF[id];
    const spots = D.floor.filter(([x, y]) => Math.abs(x - player.x) + Math.abs(y - player.y) > 8 && tileAt(id, x, y) === ".");
    for (const [k, n] of Object.entries(S.pop)) {
      for (let i = 0; i < Math.min(n, 3) && spots.length; i++) {
        const [x, y] = spots.splice(Math.floor(Math.random() * spots.length), 1)[0];
        herd.push({ k, x, y, rx: x, ry: y, hp: SP[k].hp, t: Math.random() * 2, cd: 0, dir: "left", hurt: 0 });
      }
    }
  }
  const herdAt = (x, y) => herd.find((a) => a.x === x && a.y === y);

  // os bichos andam: os bravos vêm atrás de você, os mansos fogem
  const upBase = update;
  update = function (dt) {
    upBase.apply(this, arguments);
    if (!isMata(player.zone) || game.mode !== "world" || game.dialog) return;
    for (const a of herd) {
      const A = SP[a.k];
      a.rx += (a.x - a.rx) * Math.min(1, dt * 8);
      a.ry += (a.y - a.ry) * Math.min(1, dt * 8);
      a.cd -= dt;
      a.hurt = Math.max(0, a.hurt - dt);
      const d = Math.abs(a.x - player.x) + Math.abs(a.y - player.y);
      if (A.h && d === 1 && a.cd <= 0) {
        a.cd = 1.4;
        const dmg = Math.max(1, Math.round(A.dmg * (isNight() ? 1.3 : 1) * (1 - Math.min(0.6, typeof equipStat === "function" ? equipStat("def") : 0))));
        player.hp -= dmg;
        game.shake = 0.2;
        playSound(140, 0.12, "square");
        toast(`${A.n} te atacou! −${dmg} de vida`, 1400);
        if (player.hp <= 0) return faint(A.n);
        continue;
      }
      a.t -= dt;
      if (a.t > 0) continue;
      a.t = (A.k === "bird" ? 0.35 : A.k === "big" ? 0.6 : 0.45) + Math.random() * 0.6;
      const step = (sx, sy) => walkable(player.zone, a.x + sx, a.y + sy) && !herdAt(a.x + sx, a.y + sy) && !(a.x + sx === player.x && a.y + sy === player.y);
      let best = null;
      if (A.h && d <= 6) {
        for (const [sx, sy] of DIRS4) if (step(sx, sy)) {
          const v = Math.abs(a.x + sx - player.x) + Math.abs(a.y + sy - player.y);
          if (!best || v < best[2]) best = [sx, sy, v];
        }
      } else if (!A.h && d <= 4) {
        for (const [sx, sy] of DIRS4) if (step(sx, sy)) {
          const v = Math.abs(a.x + sx - player.x) + Math.abs(a.y + sy - player.y);
          if (!best || v > best[2]) best = [sx, sy, v];
        }
      } else if (Math.random() < 0.4) {
        const [sx, sy] = DIRS4[Math.floor(Math.random() * 4)];
        if (step(sx, sy)) best = [sx, sy];
        a.t += 1;
      }
      if (best) ((a.x += best[0]), (a.y += best[1]), best[0] && (a.dir = best[0] > 0 ? "right" : "left"));
    }
  };
  function faint(by) {
    herd = [];
    const town = parseF(player.zone).town;
    const a = ZONES[town].town.arrive;
    player.hp = Math.round(maxHp() * 0.4);
    player.gold -= Math.floor(player.gold * 0.1);
    player.zone = town;
    [player.x, player.y] = a;
    player.dir = "down";
    game.fade = 1;
    enterZone();
    saveGame();
    say([["", `Tudo escurece... O ataque do ${by} foi demais. Um lenhador te encontrou e te carregou de volta até ${ZONES[town].nome}.`]]);
  }

  /* ===================== INTERAÇÕES ===================== */
  const D = () => DEF[player.zone];
  const propAt = (x, y) => D() && D().props.get(x + "," + y);
  const hermitAt = (x, y) => D() && D().hermit && D().hermit.x === x && D().hermit.y === y;
  const SOLIDP = (p) => p && (p.startsWith("fruta:") || p.startsWith("cabana"));
  const wkBase = walkable;
  walkable = function (z, x, y) {
    if (isMata(z) && z === player.zone) {
      const p = DEF[z] && DEF[z].props.get(x + "," + y);
      if (SOLIDP(p) || herdAt(x, y) || (DEF[z].hermit && DEF[z].hermit.x === x && DEF[z].hermit.y === y)) return false;
    }
    return wkBase.apply(this, arguments);
  };
  if (typeof characterAt === "function") {
    const caBase = characterAt;
    characterAt = function (x, y) {
      if (isMata(player.zone) && (herdAt(x, y) || hermitAt(x, y))) return true;
      return caBase.apply(this, arguments);
    };
  }
  const fruitLeft = (S, k) => S.fruit[k] !== player.day;
  const tgBase = targetAt;
  targetAt = function (x, y) {
    if (isMata(player.zone)) {
      const a = herdAt(x, y);
      if (a) return `${SP[a.k].h ? "Lutar com" : "Caçar"} ${SP[a.k].n} (${Math.max(0, Math.ceil(a.hp))} de vida)`;
      if (hermitAt(x, y)) return `Conversar com ${D().hermit.nm}`;
      const p = propAt(x, y);
      if (p && p.startsWith("fruta:")) return fruitLeft(state(player.zone), x + "," + y) ? `Colher ${ITEMS[p.slice(6)].nome}` : "Frutífera (já colhida hoje)";
      const c = tileAt(player.zone, x, y);
      if (c === "T") return "Cortar árvore (a mata sente)";
      if (c === "~") return D().lava.has(x + "," + y) ? "Lava fervendo (não chegue perto!)" : "Pescar no rio";
    }
    return tgBase.apply(this, arguments);
  };
  const iaBase = interactAt;
  interactAt = function (x, y) {
    if (!isMata(player.zone)) return iaBase.apply(this, arguments);
    const S = state(player.zone);
    const a = herdAt(x, y);
    if (a) return hunt(a, S);
    if (hermitAt(x, y)) return hermitTalk(S);
    const p = propAt(x, y);
    if (p && p.startsWith("fruta:")) {
      const key = x + "," + y;
      if (!fruitLeft(S, key)) return toast("Já colheu essa hoje. Amanhã tem mais.", 1500);
      S.fruit[key] = player.day;
      const it = p.slice(6);
      addItem(it);
      addItem(it);
      playSound(880, 0.05, "sine");
      return toast(`Você colheu 2× ${ITEMS[it].nome}.`, 1600);
    }
    const c = tileAt(player.zone, x, y);
    if (c === "T") {
      // cortar árvore: lenha, mas a mata perde vida
      const m = ZONES[player.zone].map;
      m[y] = m[y].slice(0, x) + "." + m[y].slice(x + 1);
      S.cut.push(x + "," + y);
      S.health = Math.max(0, S.health - 4);
      if (ITEMS.lenha) addItem("lenha");
      else player.gold += 2;
      if (typeof addNeed === "function" && lifeMode()) addNeed("energy", -4);
      playSound(180, 0.08, "square");
      return toast(S.health < 40 ? "Mais uma árvore no chão... A mata está doente. Os bichos param de nascer." : "Você cortou a árvore. A mata sente cada uma.", 2200);
    }
    if (c === "~" && D().lava.has(x + "," + y)) {
      player.hp -= 6;
      game.shake = 0.2;
      return toast("Ai! O calor da lava queima só de chegar perto. −6 de vida", 1800);
    }
    if (c === "~") {
      if (S.fish <= 0) return toast("Nenhum peixe morde. Você pescou demais por aqui.", 2000);
      if (Math.random() < 0.55) {
        S.fish--;
        addItem("peixe");
        playSound(660, 0.06, "sine");
        return toast("Fisgou um peixe!", 1400);
      }
      return toast("Nada dessa vez...", 1100);
    }
    return iaBase.apply(this, arguments);
  };
  function hunt(a, S) {
    const A = SP[a.k];
    const q = typeof swingFeedback === "function" ? swingFeedback(a.x, a.y, "sword") : 1;
    if (!q) return;
    const blade = typeof currentBlade === "function" && currentBlade();
    const dmg = Math.round((q === 2 ? 7 : 3.5) * (blade ? BLADES[blade].mul : 1) * (lifeMode() ? 1 : 1.6));
    a.hp -= dmg;
    if (blade && typeof wearBlade === "function") wearBlade();
    a.hurt = 0.4;
    playSound(220, 0.08, "square");
    if (a.hp > 0) return;
    herd = herd.filter((h) => h !== a);
    for (const it of A.loot) if (ITEMS[it]) addItem(it);
    S.pop[a.k] = Math.max(0, S.pop[a.k] - 1);
    if (S.pop[a.k] === 0) {
      S.extinct.push(a.k);
      say([["", `Era o último ${A.n} desta mata. Nunca mais vai se ver um ${A.n} por aqui.`]]);
    } else toast(`Você abateu: ${A.n}. Restam ${S.pop[a.k]} nesta mata.`, 2400);
    if (lifeMode()) addNeed("energy", -3);
    saveGame();
  }
  function hermitTalk(S) {
    const H = D().hermit;
    const st = status(S);
    const lines = {
      viva: ["Moro aqui faz trinta invernos. A mata me dá tudo, e eu só pego o que preciso.", "Ouviu? É o bando passando. Mata viva é mata barulhenta."],
      escassa: ["Tem gente caçando demais. Os filhotes não dão conta.", "Antes eu via bicho todo dia. Agora é um ou outro."],
      doente: ["Cortaram as árvores e os bichos foram embora. Deixa a mata descansar, por favor.", "Sem árvore, não tem ninho. Sem ninho, não tem bicho."],
      morta: ["Acabou. Não sobrou nada. Só eu e o silêncio.", "Eu avisei. Agora só resta esperar anos para alguma coisa voltar."],
    }[st[0]];
    const ext = S.extinct.length ? ` Já não existem mais: ${[...new Set(S.extinct)].map((k) => SP[k].n).join(", ")}.` : "";
    choice(H.nm, `"${pk(lines)}"${ext}`, [
      { t: "Perguntar que bichos vivem aqui", icon: "paw", fn: () => say([[H.nm, Object.entries(S.pop).map(([k, n]) => `${SP[k].n}: ${n === 0 ? "extinto" : n <= 2 ? "poucos" : n <= 5 ? "alguns" : "muitos"}`).join(" · ")]]) },
      {
        t: "Vender carne e couro para o eremita",
        icon: "coin",
        fn: () => {
          let g = 0;
          for (const [it, v] of [["carne", 6], ["couro", 9], ["pena", 3]]) while (itemCount(it) > 0) (removeItem(it), (g += v));
          player.gold += g;
          say([[H.nm, g ? `Tome ${g} de ouro. Mas não cace mais do que a mata aguenta.` : "Você não tem nada que me sirva."]]);
        },
      },
      {
        t: "Comprar ervas e frutas (8 ouro)",
        icon: "herb",
        fn: () => {
          if (player.gold < 8) return say([[H.nm, "Sem ouro, sem erva."]]);
          player.gold -= 8;
          addItem(D().biome.fr[0]);
          if (ITEMS.ervas) addItem("ervas");
          say([[H.nm, "Colhidas hoje de manhã."]]);
        },
      },
      { t: "Ir embora", fn: null },
    ]);
  }

  /* ===================== DESENHO ===================== */
  const dtBase = drawTile;
  drawTile = function (z, x, y, c, t) {
    dtBase.apply(this, arguments);
    if (!isMata(z) || !DEF[z]) return;
    const X = x * TILE,
      Y = y * TILE;
    const R = (a, b, w, h, col) => ((ctx.fillStyle = col), ctx.fillRect(X + a, Y + b, w, h));
    const F = DEF[z].fall;
    const hh = DEF[z].height.get(x + "," + y);
    if (DEF[z].lava.has(x + "," + y)) {
      // lava borbulhando na cratera
      R(0, 0, 32, 32, "#c93a1a");
      for (let i = 0; i < 4; i++) R(((i * 11 + x * 7 + t * 12) % 28) | 0, ((i * 7 + y * 5 + t * 6) % 28) | 0, 6, 4, i % 2 ? "#ff8a2a" : "#ffd04a");
      if (((t * 3 + x + y) | 0) % 7 === 0) R(12, 10, 6, 6, "#fff0a0");
      return;
    }
    if (hh != null) {
      mountainTile(z, x, y, hh, X, Y, R, t);
      return;
    }
    if (DEF[z].cliff.has(x + "," + y)) {
      // paredão de pedra da cachoeira
      R(0, 0, 32, 32, "#6e6960");
      for (let i = 0; i < 4; i++) R((i * 9 + y * 5) % 26, (i * 7) % 26 + 2, 10, 6, i % 2 ? "#8a8478" : "#5a5650");
      R(0, 30, 32, 2, "#4a4640");
      if ((x + y) % 5 === 0) R(4, 4, 6, 3, "#5a8a3a"); // musgo
    }
    if (F && tileAt(z, x, y) === "~" && y < F.bottom + 1 && Math.abs(x - F.x) <= 3) {
      // a água despencando: faixas brancas descendo depressa
      R(0, 0, 32, 32, "#8ac8f0");
      for (let i = 0; i < 4; i++) {
        const k = ((t * 90 + i * 8 + x * 13) % 32) | 0;
        R(i * 8 + 1, k - 8, 4, 12, "rgba(255,255,255,.85)");
      }
      R(0, 0, 2, 32, "rgba(255,255,255,.4)");
    }
    if (F && y >= F.bottom && y <= F.bottom + 2 && Math.abs(x - F.x) <= 4 && tileAt(z, x, y) === "~")
      for (let i = 0; i < 5; i++) R(((t * 40 + i * 13 + x * 7) % 30) | 0, 6 + ((i * 9 + (t * 20) | 0) % 20), 4, 3, "rgba(255,255,255,.75)"); // espuma
    const p = DEF[z].props.get(x + "," + y);
    if (!p) return;
    if (p.startsWith("planta:")) plant(p.slice(7), R, x, y, t);
  };
  /* MONTANHA em degraus (referência: tiles de rocha top-down de pixel art):
     cada nível de altura é um platô; onde o nível cai, aparece a FACE do
     paredão (o lado de baixo, mais escuro, com fendas verticais); a luz vem
     de cima à esquerda (borda clara em cima/esquerda, escura embaixo/direita);
     os cantos de fora são arredondados e o paredão joga sombra no chão.
     Nada de sombra uniforme em volta ("pillow shading"). */
  const LV = (z, x, y) => {
    const h = DEF[z].height.get(x + "," + y);
    return h == null ? -1 : Math.min(3, Math.floor(h * 4.2));
  };
  function mountainTile(z, x, y, hh, X, Y, R, t) {
    const D0 = DEF[z];
    const vol = D0.volcano,
      ice = D0.biome.key === "gelo";
    const lv = LV(z, x, y);
    const PAL = vol
      ? [["#3a3030", "#2a2222", "#4a3e3c"], ["#443836", "#2e2524", "#56484a"], ["#4e403e", "#352a28", "#625250"], ["#5a4644", "#3e302e", "#6e5a58"]]
      : [["#6e6a60", "#4e4a42", "#8a857a"], ["#7e786e", "#5a564e", "#9a948a"], ["#8e887e", "#66625a", "#aaa49a"], ["#a09a90", "#76726a", "#bcb6ac"]];
    const snow = !vol && (lv >= 3 || (ice && lv >= 2));
    let [top, dark, lite] = PAL[lv];
    if (snow) [top, dark, lite] = ["#e8eef4", "#9aa8b8", "#ffffff"];
    const below = LV(z, x, y + 1),
      above = LV(z, x, y - 1),
      left = LV(z, x - 1, y),
      right = LV(z, x + 1, y);
    // o topo do platô, com textura de pedra que segue a luz
    R(0, 0, 32, 32, top);
    for (let i = 0; i < 4; i++) {
      const px = (i * 11 + x * 7) % 24,
        py = (i * 7 + y * 5) % 20;
      R(px, py, 7, 4, dark);
      R(px, py, 7, 1, lite); // a pedrinha pega luz em cima
    }
    if (snow) for (let i = 0; i < 3; i++) R((i * 9 + x * 5) % 26, (i * 11 + y * 3) % 24 + 2, 6, 2, "#c9d4e0");
    // bordas: luz em cima/esquerda, sombra embaixo/direita (só onde o nível muda)
    if (above < lv) R(0, 0, 32, 2, lite);
    if (left < lv) R(0, 0, 2, 32, lite);
    if (right < lv) R(30, 0, 2, 32, dark);
    // face do paredão: onde embaixo o nível é menor, os 12px de baixo viram o paredão
    if (below < lv) {
      const face = vol ? "#2a2020" : snow ? "#7a8898" : PAL[Math.max(0, lv - 1)][1];
      R(0, 20, 32, 12, face);
      R(0, 20, 32, 2, lite); // a quina pega luz
      for (let k = 3 + ((x * 5) % 6); k < 32; k += 8) R(k, 23, 1, 8, shade(face, -0.3)); // fendas
      R(0, 30, 32, 2, shade(face, -0.35));
      if (vol && lv >= 2) R(((x * 7) % 20) + 4, 24, 2, 7, `rgba(255,120,40,${0.5 + 0.3 * Math.sin(t * 3 + x)})`); // veio de lava
    }
    // cantos de fora arredondados: o canto que não tem vizinho do mesmo nível vira chão/nível de baixo
    const lower = (l) => (l < 0 ? null : PAL[l][0]);
    const corner = (cx, cy, l) => {
      const col = lower(l);
      if (col === null) return ctx.clearRect ? 0 : 0;
      R(cx, cy, 4, 4, col);
    };
    if (above < lv && left < lv) (R(0, 0, 4, 2, lower(Math.max(above, left)) || "rgba(0,0,0,0)"), R(0, 0, 2, 4, lower(Math.max(above, left)) || "rgba(0,0,0,0)"));
    if (above < lv && right < lv) (R(28, 0, 4, 2, lower(Math.max(above, right)) || "rgba(0,0,0,0)"), R(30, 0, 2, 4, lower(Math.max(above, right)) || "rgba(0,0,0,0)"));
  }
  // o chão logo abaixo da montanha recebe a sombra do paredão
  const dtShadow = drawTile;
  drawTile = function (z, x, y, c, t) {
    dtShadow.apply(this, arguments);
    if (!isMata(z) || !DEF[z] || DEF[z].height.has(x + "," + y) || !DEF[z].height.has(x + "," + (y - 1))) return;
    ctx.fillStyle = "rgba(20,16,24,.32)";
    ctx.fillRect(x * TILE, y * TILE, TILE, 8);
    ctx.fillStyle = "rgba(20,16,24,.14)";
    ctx.fillRect(x * TILE, y * TILE + 8, TILE, 6);
  };
  function plant(k, R, x, y, t) {
    const sw = Math.round(Math.sin(t * 1.5 + x) * 1);
    switch (k) {
      case "samambaia":
        for (let i = 0; i < 5; i++) R(6 + i * 4 + sw, 14 + (i % 2) * 3, 3, 14 - (i % 2) * 3, i % 2 ? "#3d7432" : "#5a9a42");
        break;
      case "cogumelos":
        for (const [ox, oy, c] of [[8, 20, "#c94a3a"], [18, 22, "#d9a050"], [13, 16, "#c94a3a"]]) (R(ox + 2, oy + 3, 2, 5, "#f2eee4"), R(ox, oy, 6, 4, c), R(ox + 1, oy + 1, 1, 1, "#ffffff"));
        break;
      case "flores":
        for (let i = 0; i < 5; i++) (R(5 + i * 5, 16 + (i % 2) * 4, 1, 8, "#3a6a2a"), R(4 + i * 5, 14 + (i % 2) * 4, 3, 3, ["#e86a8a", "#f2c14e", "#b48aff", "#f6f2ea", "#ff9a4a"][(i + x) % 5]));
        break;
      case "junco":
        for (let i = 0; i < 5; i++) (R(6 + i * 4 + sw, 8, 2, 20, "#5a8a3a"), i % 2 || R(6 + i * 4 + sw, 6, 2, 6, "#6b4423"));
        break;
      case "pinheirinho":
        R(14, 22, 4, 8, "#5a3a1e");
        for (let i = 0; i < 3; i++) R(16 - 4 - i * 3, 8 + i * 5, 8 + i * 6, 5, i % 2 ? "#2e5a3a" : "#3a6a42");
        break;
      case "pedras":
        for (const [ox, oy, w2] of [[6, 20, 10], [16, 23, 8]]) (R(ox, oy, w2, 6, "#8a8478"), R(ox + 1, oy, w2 - 3, 2, "#b0aa9c"));
        break;
      case "capim":
        for (let i = 0; i < 7; i++) R(5 + i * 3 + sw, 16 + (i % 3) * 2, 1, 12 - (i % 3) * 2, i % 2 ? "#a8a04a" : "#c9b860");
        break;
      case "palmeirinha":
        R(15, 14, 3, 16, "#7a5a32");
        for (const [dx, dy] of [[-8, 0], [6, 0], [-5, -4], [3, -4]]) R(15 + dx, 12 + dy, 8, 3, "#3a8a3a");
        break;
      case "cacto":
        R(13, 10, 6, 20, "#4a8a3a");
        R(7, 15, 4, 8, "#4a8a3a");
        R(21, 13, 4, 8, "#4a8a3a");
        R(14, 10, 2, 20, "#6aaa5a");
        break;
      case "bambu":
        for (const ox of [7, 14, 21]) {
          R(ox, 2, 4, 28, "#7aa04a");
          for (let k = 6; k < 28; k += 7) R(ox, k, 4, 1, "#4a7a2a");
          R(ox + 3, 6, 6, 2, "#5a8a3a");
        }
        break;
    }
  }
  // frutíferas, cabana, eremita e bichos entram na lista com profundidade
  const cdBase = crewDrawList;
  crewDrawList = function (list, t) {
    cdBase.apply(this, arguments);
    if (!isMata(player.zone) || !DEF[player.zone]) return;
    const DD = DEF[player.zone],
      S = state(player.zone);
    const cam = game.cam;
    const vis = (x, y) => !cam || (x * TILE > cam.camX - 64 && x * TILE < cam.camX + viewWidth / cam.Z + 64 && y * TILE > cam.camY - 64 && y * TILE < cam.camY + 480 / cam.Z + 64);
    for (const [k, p] of DD.props) {
      const [x, y] = k.split(",").map(Number);
      if (!vis(x, y)) continue;
      if (p.startsWith("fruta:")) list.push({ y: y + 0.1, draw: () => fruitTree(x, y, p.slice(6), fruitLeft(S, k), t) });
      else if (p === "cabana") list.push({ y: y + 0.2, draw: () => cabin(x, y) });
    }
    if (DD.hermit) {
      const H = DD.hermit;
      list.push({ y: H.y, draw: () => drawSprite(wizardRects("#6a5a3a", "#5a4a32", "#d9d9d9", null, "down", 0), H.x * TILE, H.y * TILE, 2, false) });
    }
    for (const a of herd) if (vis(a.x, a.y)) list.push({ y: a.ry, draw: () => beast(a, t) });
    if (DD.volcano && DD.lava.size) {
      const cells = [...DD.lava].map((k) => k.split(",").map(Number));
      const cx = cells.reduce((s2, c) => s2 + c[0], 0) / cells.length,
        cy = cells.reduce((s2, c) => s2 + c[1], 0) / cells.length;
      list.push({
        y: 999,
        draw: () => {
          for (let i = 0; i < 8; i++) {
            const k = (t * 0.25 + i / 8) % 1;
            ctx.fillStyle = `rgba(70,64,70,${0.5 * (1 - k)})`;
            ctx.beginPath();
            ctx.arc(cx * TILE + 16 + Math.sin(i * 2 + t * 0.5) * 20 * k, cy * TILE - k * 220, 14 + k * 40, 0, 7);
            ctx.fill();
          }
          for (let i = 0; i < 6; i++) {
            const k = (t * 1.3 + i / 6) % 1;
            ctx.fillStyle = `rgba(255,${120 + i * 20},40,${1 - k})`;
            ctx.fillRect(cx * TILE + 16 + Math.cos(i * 1.7) * 30 * k, cy * TILE - Math.sin(k * 3.1) * 80, 4, 4);
          }
        },
      });
    }
  };
  function fruitTree(x, y, it, ripe, t) {
    const X = x * TILE,
      Y = y * TILE;
    ctx.fillStyle = "rgba(0,0,0,.22)";
    ctx.beginPath();
    ctx.ellipse(X + 16, Y + 28, 13, 4, 0, 0, 7);
    ctx.fill();
    ctx.fillStyle = "#5a3a1e";
    ctx.fillRect(X + 14, Y + 8, 4, 22);
    for (const [ox, oy, r, c] of [[16, 2, 13, "#2e6a32"], [9, 8, 8, "#3d7a38"], [23, 8, 8, "#3d7a38"], [14, -1, 6, "#4a8a3e"]]) ((ctx.fillStyle = c), ctx.beginPath(), ctx.arc(X + ox, Y + oy, r, 0, 7), ctx.fill());
    if (!ripe) return;
    const col = { f_maca: "#e0403a", f_amora: "#3a1a4a", f_mirtilo: "#3a4aa8", f_pinhao: "#8a5a2e", f_coco: "#8a6a32", f_manga: "#f2a03a", f_tamara: "#8a4a22", f_figo: "#6a3a6a", f_banana: "#f2d040", f_acai: "#3a1a3a", f_cacau: "#c9702a", f_pessego: "#f2a080", f_lichia: "#e05a6a", f_cogumelo: "#c94a3a" }[it] || "#e0403a";
    for (let i = 0; i < 6; i++) ((ctx.fillStyle = col), ctx.fillRect(X + 5 + ((i * 7 + x * 3) % 22), Y - 4 + ((i * 5 + y) % 14), 3, 3));
  }
  function cabin(x, y) {
    const X = x * TILE,
      Y = y * TILE;
    const R = (a, b, w, h, c) => ((ctx.fillStyle = c), ctx.fillRect(X + a, Y + b, w, h));
    R(4, 26, 62, 6, "rgba(0,0,0,.25)");
    for (let r = 0; r < 4; r++) R(2, 6 + r * 6, 60, 5, r % 2 ? "#7a5230" : "#6b4423"); // toras
    R(26, 12, 12, 18, "#3a2414"); // porta
    R(8, 12, 10, 8, "#2a1a10");
    ctx.fillStyle = "#5a7a3a";
    fillPolygon(X - 4, Y + 8, X + 32, Y - 16, X + 68, Y + 8);
    ctx.fillStyle = "#4a6a32";
    fillPolygon(X - 4, Y + 8, X + 32, Y - 16, X + 32, Y + 8);
    R(48, -12, 6, 14, "#6a6058");
  }
  function beast(a, t) {
    const A = SP[a.k];
    const s = A.u;
    const cx = a.rx * TILE + 16,
      by = a.ry * TILE + 28;
    const R = (x, y, w, h, c) => ((ctx.fillStyle = c), ctx.fillRect(Math.round(cx + x * s), Math.round(by + y * s), Math.ceil(w * s), Math.ceil(h * s)));
    ctx.save();
    if (a.hurt > 0 && Math.floor(t * 20) % 2) ctx.globalAlpha = 0.5;
    ctx.fillStyle = "rgba(0,0,0,.22)";
    ctx.beginPath();
    ctx.ellipse(cx, by + 1, 7 * s, 2 * s, 0, 0, 7);
    ctx.fill();
    const flip = a.dir === "left" ? -1 : 1;
    ctx.translate(cx, 0);
    ctx.scale(flip, 1);
    ctx.translate(-cx, 0);
    const legs = Math.floor(t * 8 + a.x) % 2;
    const c = A.c,
      d = shade(c, -0.3),
      ac = A.a;
    if (A.k === "bird") {
      const fl = Math.sin(t * 12 + a.x) * 2;
      R(-3, -7, 7, 5, c);
      R(3, -9, 3, 3, c);
      R(6, -8, 2, 1, ac);
      R(-4, -8 + fl, 4, 2, d);
      R(-1, -2, 1, 2, "#3a2a1a");
      R(2, -2, 1, 2, "#3a2a1a");
      R(4, -8, 1, 1, "#1a1a1a");
    } else if (A.k === "small") {
      R(-4, -5, 8, 5, c);
      R(3, -7, 4, 4, c);
      R(5, -6, 1, 1, "#1a1a1a");
      R(-4, -4, 2, 2, ac);
      R(-3, 0, 2, 1, d);
      R(2, 0, 2, 1, d);
      if (a.k === "coelho" || a.k === "lebre") (R(3, -11, 1, 4, c), R(5, -11, 1, 4, c));
    } else if (A.k === "reptile") {
      R(-7, -3, 14, 3, c);
      R(6, -4, 4, 3, c);
      R(-10, -2, 4, 2, d);
      R(8, -4, 1, 1, "#1a1a1a");
      if (A.shell) (R(-5, -7, 10, 5, ac), R(-4, -7, 8, 1, shade(ac, 0.2)));
      else for (let i = -6; i < 6; i += 3) R(i, -3, 1, 1, ac);
      if (a.k === "escorpiao") (R(-8, -8, 2, 6, c), R(-8, -9, 3, 2, ac));
      R(-5, 0, 2, 1, d);
      R(3, 0, 2, 1, d);
    } else if (A.k === "ape") {
      R(-3, -10, 6, 8, c);
      R(-3, -15, 6, 5, c);
      R(-2, -14, 4, 3, ac);
      R(1, -13, 1, 1, "#1a1a1a");
      R(-5, -9, 2, 6 + legs, c);
      R(3, -9, 2, 6 - legs, c);
      R(-3, -2, 2, 2, d);
      R(1, -2, 2, 2, d);
      R(-6, -12, 2, 8, d); // rabo
    } else if (A.k === "tall") {
      R(-5, -12, 10, 6, c);
      R(3, -24, 3, 13, c);
      R(4, -27, 5, 4, c);
      R(7, -26, 1, 1, "#1a1a1a");
      R(-4, -6, 2, 6 + legs, d);
      R(2, -6, 2, 6 - legs, d);
      if (A.spots) for (let i = 0; i < 5; i++) R(-4 + i * 2, -11 + (i % 2) * 2, 2, 2, ac);
      if (a.k === "avestruz") (R(-6, -14, 8, 3, ac));
    } else {
      // quadrúpede (normal ou grande)
      const big = A.k === "big";
      const L = big ? 6 : 5;
      R(-7, -10, 14, big ? 8 : 6, c);
      R(5, big ? -13 : -12, big ? 6 : 5, big ? 6 : 5, c);
      R(big ? 9 : 8, big ? -11 : -10, 2, 1, "#1a1a1a");
      R(-6, -10 + (big ? 8 : 6), 2, L + legs, d);
      R(-2, -10 + (big ? 8 : 6), 2, L - legs, d);
      R(2, -10 + (big ? 8 : 6), 2, L + legs, d);
      R(5, -10 + (big ? 8 : 6), 2, L - legs, d);
      R(-8, -9, 2, 2, c); // rabo
      R(-6, -10, 12, 1, shade(c, 0.2));
      if (A.horn) (R(6, -17, 1, 4, ac), R(9, -17, 1, 4, ac), R(5, -18, 2, 1, ac), R(9, -18, 2, 1, ac));
      if (A.spots) for (let i = 0; i < 6; i++) R(-6 + i * 2, -9 + (i % 2) * 2, 1, 1, ac);
      if (A.stripes) for (let i = 0; i < 5; i++) R(-6 + i * 3, -10, 1, 6, ac);
      if (A.mane) R(3, -14, 4, 8, ac);
      if (A.hump) R(-3, -13, 6, 3, c);
      if (A.trunk) (R(11, -9, 2, 7, c), R(4, -11, 3, 4, ac));
      if (A.panda) (R(-7, -10, 14, 3, ac), R(6, -12, 2, 2, ac), R(-6, -3, 12, 2, ac));
      if (!big && !A.horn && !A.mane) R(6, -14, 1, 2, c); // orelha
    }
    ctx.restore();
    if (a.hp < A.hp) {
      ctx.fillStyle = "#2a1f3d";
      ctx.fillRect(a.rx * TILE + 2, by - 22 * s, 28, 4);
      ctx.fillStyle = A.h ? "#e0303a" : "#7ad36b";
      ctx.fillRect(a.rx * TILE + 2, by - 22 * s, 28 * Math.max(0, a.hp / A.hp), 4);
    }
    if (A.h && Math.abs(a.x - player.x) + Math.abs(a.y - player.y) <= 6) drawPixelIcon("anger", cx, by - 24 * s - Math.abs(Math.sin(t * 6)) * 2, 2);
  }
  // placa na saída de cada cidade dizendo para que mata ela leva
  const tg2 = targetAt;
  targetAt = function (x, y) {
    const r = tg2.apply(this, arguments);
    if (r) return r;
    const E = EXITS[player.zone];
    const Z = ZONES[player.zone];
    if (E && Z && Z.open)
      for (const [d, f] of Object.entries(E)) {
        const o = Z.open[d];
        if (o && o[0] === x && o[1] === y) {
          const P = parseF(f);
          return `Trilha para ${biomeOf(P.town).names[P.i]}`;
        }
      }
    return r;
  };
})();
