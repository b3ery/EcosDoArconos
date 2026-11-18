/**
 * ECOS DO ARCANO — paises-e-costumes.js
 * Os dez países do mundo. O nosso é Valdária (Aurélia, Marés, Pedravale,
 * Solmar e Rosalva). Do outro lado do Mar Aberto ficam: Coralina, Zahar,
 * Brumária, Verdemata, Gelomar, Ferrofundo, Áurea, Jadeluz e Gigântia.
 * Cada país além-mar tem uma cidade portuária própria, onde se desembarca
 * do navio, e um jeito de viver:
 *  - um COSTUME do dia (um ritual com hora marcada num lugar da praça);
 *  - uma LEI da terra (proibido beber, toque de recolher, imposto em ouro...).
 * Dá para alugar casa e morar em qualquer país. Quem mora tem que viver os
 * costumes: faltar ao ritual três vezes ou quebrar a lei faz os vizinhos
 * expulsarem você. Visitante que segue os costumes ganha a simpatia do povo.
 * Modifica (envolve) funções de outros arquivos: targetAt, interactAt,
 * walkable, crewDrawList, update, onNewDay.
 */

"use strict";

(() => {
  const P = {
    coral: { theme: "porto", pal: "palacio", n: ["Palácio de Conchas", "Templo das Marés Mansas", "Barraca de Frutas", "Cabana do Pescador"], hab: "coralino", rite: { n: "Dança do pôr do sol na fogueira da praia", h: [17, 19], kind: "fogueira", txt: "Todo mundo dança descalço em roda, com colares de flor, até o sol sumir no mar." }, law: { k: "nenhuma", n: "Ninguém trabalha no dia da lua cheia (é dia de festa)." }, hi: "Bem-vindo, viajante do outro mar! Aqui a gente dança antes de jantar." },
    zahar: { theme: "porto", pal: "palacio", n: ["Palácio das Cúpulas", "Templo do Sol", "Casa de Chá de Hortelã", "Bazar de Seda"], hab: "zahariano", rite: { n: "Chá de hortelã ao meio-dia, sob a tenda", h: [11, 13], kind: "cha", txt: "Ninguém trabalha no sol do meio-dia: as famílias sentam na sombra e servem chá três vezes." }, law: { k: "alcool", n: "Bebida alcoólica é proibida. Quem beber paga multa." }, hi: "Que o vento do deserto te seja fresco. Tire as sandálias antes de entrar nas casas." },
    brumas: { theme: "pantano", pal: "templo", n: ["Torre dos Anciãos", "Templo dos Sinos", "Casa de Ervas", "Loja de Velas"], hab: "brumariano", rite: { n: "Acender uma vela aos ancestrais", h: [19, 21], kind: "velas", txt: "Uma vela por cada antepassado, em silêncio. A névoa leva a luz até eles." }, law: { k: "recolher", h: 22, n: "Silêncio e casa depois das 22h. A névoa da noite é dos mortos." }, hi: "...Fala baixo. Os sinos estão ouvindo." },
    verde: { theme: "bosque", pal: "templo", n: ["Grande Oca do Cacique", "Casa dos Espíritos da Mata", "Casa do Cacau", "Oficina de Canoas"], hab: "verdematense", rite: { n: "Oferenda à Árvore-Mãe", h: [7, 10], kind: "arvore", txt: "Frutas e uma canção para a árvore mais velha da mata. Ela devolve sombra e chuva." }, law: { k: "nenhuma", n: "Não se corta árvore sem pedir licença à mata." }, hi: "A mata viu você chegar antes de nós. Seja bem-vindo." },
    gelo: { theme: "picos", pal: "fortaleza", n: ["Salão do Jarl", "Pedra dos Antigos", "Salão do Hidromel", "Ferraria do Gelo"], hab: "gelomarino", rite: { n: "Mergulho no mar gelado ao amanhecer", h: [5, 8], kind: "gelo", txt: "Um buraco no gelo, um grito de coragem e um mergulho. Depois, sopa quente para todo mundo." }, law: { k: "nenhuma", n: "Ofendeu, duela. Recusar um duelo é vergonha." }, hi: "Forasteiro! Você já mergulhou no mar gelado hoje? Não? Então ainda não é dos nossos." },
    ferro: { theme: "serra", pal: "fortaleza", n: ["Fortaleza da Bigorna", "Templo do Fogo", "Taverna da Brasa", "Forja do Povo"], hab: "ferrofundense", rite: { n: "Duas horas na Forja do Povo", h: [8, 12], kind: "forja", txt: "Todo mundo martela pelo reino de manhã: até o rei. Quem não martela, não come." }, law: { k: "nenhuma", n: "Ninguém fica parado: preguiça é crime." }, hi: "Mãos limpas? Hm. Aqui a gente desconfia de mãos limpas." },
    ouro: { theme: "porto", pal: "palacio", n: ["Palácio Dourado", "Templo do Sol de Ouro", "Casa de Câmbio", "Joalheria Imperial"], hab: "áureo", rite: { n: "Desfile do Imperador ao meio-dia", h: [12, 13], kind: "desfile", txt: "Todos se curvam quando o carro dourado passa. Quem não se curva some." }, law: { k: "imposto", n: "Imposto do Sol: todo morador entrega parte do ouro por dia." }, hi: "O seu ouro está limpo? Ótimo. Aqui tudo se paga em ouro, até o sorriso." },
    jade: { theme: "vila", pal: "castle", n: ["Palácio de Jade", "Templo das Mil Lanternas Vermelhas", "Casa de Chá do Lago", "Loja de Porcelana"], hab: "jadelino", rite: { n: "Cerimônia do chá das quatro da tarde", h: [15, 17], kind: "cha", txt: "Três reverências, a xícara girada duas vezes e nenhuma palavra até o último gole." }, law: { k: "recolher", h: 23, n: "Toque de recolher às 23h, por ordem da Imperatriz." }, hi: "*curva-se* Que a sua estada seja longa e silenciosa como a de uma garça." },
    gigantes: { theme: "serra", pal: "templo", n: ["Mão de Pedra", "Santuário dos Gigantes", "Abrigo dos Ermitões", "Cabana do Guardião"], hab: "ermitão", rite: { n: "Cantar para os gigantes ao anoitecer", h: [18, 20], kind: "canto", txt: "Os poucos ermitões cantam baixinho para os gigantes não acordarem. Ou para acordarem. Ninguém lembra mais." }, law: { k: "nenhuma", n: "Não se tira pedra dos gigantes." }, hi: "Gente nova? Faz trinta anos que ninguém aparece. Fica para o canto da noite." },
  };
  /* ----- cada país: cinco reinos, roupas, clima, sotaque e nomes ----- */
  const X = {
    coral: { k: [["Porto Concha", "Rainha Maré-Mansa"], ["Recife Rubro", "Rei Coral-Vivo"], ["Ilha Palmeira", "Rainha Brisa"], ["Lagoa Azul", "Príncipe Anêmona"], ["Atol das Tartarugas", "Anciã Casco-Velho"]], robes: ["#e86a5a", "#f2c14e", "#3ab0a0", "#ff9ab8", "#5ac8e0"], hats: [null], hair: ["#1a1410", "#3a2414", "#5a3a22"], w: [["sol", 60], ["chuva", 30], ["tempestade", 10]], clima: "Calor úmido de ilha: brisa do mar o dia inteiro.", names: ["Kaila", "Moana", "Iolo", "Lani", "Tavi", "Nalu"] },
    zahar: { k: [["Porto Miragem", "Emir Rashan"], ["Cidade das Cúpulas", "Sultana Nahira"], ["Oásis de Qamar", "Xeique Idris"], ["Duna Vermelha", "Emira Safiya"], ["Vale dos Camelos", "Ancião Barakh"]], robes: ["#efe8d8", "#d9c08a", "#3a4a8a", "#8a3a3a", "#5a3a6a"], hats: ["#efe8d8", "#d9c08a", "#3a4a8a"], hair: ["#1a1410", "#2a1a10"], w: [["sol", 85], ["nublado", 15]], clima: "Deserto: sol de rachar de dia, frio de noite. A sede vem rápido.", names: ["Amira", "Karim", "Layla", "Tarek", "Zaina", "Omar"] },
    brumas: { k: [["Porto Cinzento", "Anciã Velada"], ["Ilha dos Sinos", "Sineiro-Mor Eldo"], ["Vila Sussurro", "Dama Neblina"], ["Torre Velada", "Os Anciãos Cinzentos"], ["Charco das Almas", "Guardião Salgueiro"]], robes: ["#5a5a6a", "#3a3a4a", "#7a7a8a", "#4a5a4a"], hats: ["#3a3a4a", "#2a2a3a"], hair: ["#d9d9d9", "#8a8a8a", "#3a2414"], w: [["neblina", 70], ["chuva", 20], ["nublado", 10]], clima: "Névoa o tempo todo. Mal dá para ver a mão na frente do rosto.", names: ["Sombra", "Eira", "Morwen", "Tulo", "Brena", "Vesk"] },
    verde: { k: [["Porto Cipó", "Cacique Ybirá"], ["Aldeia Copa-Alta", "Pajé Jaci"], ["Cachoeira Grande", "Cacica Iracema"], ["Clareira do Jaguar", "Guerreiro Ubirajara"], ["Rio Serpente", "Anciã Nhandê"]], robes: ["#3a7a3a", "#7a5a32", "#c9a050", "#5a8a3a", "#c94a3a"], hats: [null], hair: ["#1a1410", "#1a1a1a"], w: [["chuva", 55], ["tempestade", 20], ["sol", 25]], clima: "Mata fechada: chove quase todo dia e o calor não dá trégua.", names: ["Araci", "Tainá", "Iberê", "Jurema", "Ubiratã", "Potira"] },
    gelo: { k: [["Porto Gélido", "Jarl Ulfrida"], ["Fiorde do Lobo", "Jarl Ragnhar"], ["Salão de Aurora", "Rainha Sigrun"], ["Vila Boreal", "Jarl Torvi"], ["Ilha da Baleia", "Velha Hilde"]], robes: ["#8a6a4a", "#5a4a3a", "#c9c0b0", "#3a4a6a"], hats: ["#8a6a4a", "#c9c0b0"], hair: ["#e8d090", "#c97a3a", "#f2eee4"], w: [["neve", 75], ["nublado", 15], ["tempestade", 10]], clima: "Frio de congelar os ossos. Sem casaco de pele, o corpo cansa rápido.", names: ["Astrid", "Bjorn", "Freya", "Leif", "Ingrid", "Sven"] },
    ferro: { k: [["Porto Cinza", "Rei-Forjador Bram"], ["Bigorna Alta", "Mestra Ferrinha"], ["Cratera Rubra", "Senhor da Brasa Duro"], ["Mina Funda", "Capataz Grum"], ["Vale das Escórias", "Viúva Cinza"]], robes: ["#4a4040", "#6a4a3a", "#8a3a2a", "#3a3a40"], hats: ["#5a5a64", null], hair: ["#3a2414", "#1a1a1a", "#c97a3a"], w: [["nublado", 50], ["neblina", 20], ["sol", 30]], clima: "Cinza do vulcão no ar. O céu quase nunca fica azul.", names: ["Brann", "Hilda", "Torg", "Marga", "Durin", "Kessa"] },
    ouro: { k: [["Porto Dourado", "Imperador Solano"], ["Cidade do Sol", "Imperatriz Aurora"], ["Vale das Pepitas", "Barão Midas"], ["Templo do Ouro", "Sumo-Sacerdote Ícaro"], ["Costa Brilhante", "Duquesa Fulgor"]], robes: ["#c9a040", "#7a3ab0", "#e8d090", "#f2eee4"], hats: ["#f2c14e", null], hair: ["#3a2414", "#1a1410", "#e8d090"], w: [["sol", 80], ["nublado", 20]], clima: "Sol forte o ano todo. Até a areia brilha.", names: ["Áureo", "Dourada", "Ouroval", "Brilha", "Solano", "Topázio"] },
    jade: { k: [["Porto Lanterna", "Governador Wen"], ["Cidade Imperial", "Imperatriz Lian-Shu"], ["Vale das Cerejeiras", "Princesa Mei-Lin"], ["Monte da Garça", "Mestre Shun"], ["Lago do Dragão", "General Tao"]], robes: ["#c94a3a", "#2a8a6a", "#1a3a5a", "#e8d8c0"], hats: ["#d9c08a", null], hair: ["#1a1a1a", "#1a1410"], w: [["chuva", 35], ["neblina", 25], ["sol", 40]], clima: "Chuva fina e neblina nas montanhas. As cerejeiras perfumam tudo.", names: ["Lian", "Mei", "Shen", "Yun", "Hua", "Jin"] },
    gigantes: { k: [["Enseada dos Ermitões", "Ninguém (só estátuas)"], ["Ombro do Gigante", "Ermitão Pedrão"], ["Vale da Mão", "Ermitã Lasca"], ["Olho de Pedra", "Vigia Musgo"], ["Pé Adormecido", "Ninguém sabe"]], robes: ["#8a8474", "#6a6a5a", "#5a4a3a"], hats: [null, "#6a6a5a"], hair: ["#d9d9d9", "#8a8a8a"], w: [["nublado", 50], ["tempestade", 30], ["neblina", 20]], clima: "Vento forte que uiva entre as estátuas. Tempestades chegam sem avisar.", names: ["Pedrão", "Musgo", "Lasca", "Rocha", "Cascalho", "Líquen"] },
  };
  const pk2 = (a) => a[Math.floor(Math.random() * a.length)];
  const lo = (t) => (t && !/^[A-ZÁÉÍÓÚÂÊÔÃÕÇ]{2}/.test(t) ? t[0].toLowerCase() + t.slice(1) : t);
  const ACCENT = {
    coral: (t) => t.replace(/\bvocê\b/gi, "ocê") + pk2(["", " Ô, coral!", " Meu bem.", ""]),
    zahar: (t) => "Ya, " + lo(t).replace(/\bamigo\b/gi, "irmão das areias") + pk2(["", " Que as dunas te guardem.", ""]),
    brumas: (t) => "*sussurra* ..." + lo(t).replace(/, /g, "... ") + "...",
    verde: (t) => pk2(["Hum-hum. ", "Ê-ê. ", ""]) + t.replace(/\bvocê\b/gi, "tu"),
    gelo: (t) => "Ja! " + lo(t).replace(/\bmuito\b/gi, "mui") + ", ja?",
    ferro: (t) => pk2(["Pelo martelo! ", "Hrm. ", "Pela bigorna! "]) + t.replace(/\.$/, "!"),
    ouro: (t) => "Meu caro, " + lo(t).replace(/\bvocê\b/gi, "vossa riqueza"),
    jade: (t) => "Honrado visitante, " + lo(t) + " *curva-se*",
    gigantes: (t) => "Ora pois, " + lo(t).replace(/\bvocê\b/gi, "vosmecê"),
  };
  const W = 44,
    H = 26;
  const RITE = [22, 12],
    SIGN = [42, 7],
    BOAT = [21, 24],
    ROAD = [1, 20];
  const C = () => window.SEA_COUNTRIES || [];
  const cOf = (id) => C().find((c) => c.id === id);

  const zid = (id, n) => "pais-" + id + (n > 1 ? "-" + n : "");
  const STYLES = ["casa", "casa2", "pousada", "padaria", "alfaiate", "forja", "boticario", "livraria"];
  for (const [id, d] of Object.entries(P)) {
    const c = cOf(id);
    X[id].k.forEach(([kn, ruler], i) => {
      const n = i + 1,
        port = n === 1,
        Z = zid(id, n);
      const st = (j) => STYLES[(j + n * 3 + id.length) % STYLES.length];
      ZONE_DEFS[Z] = { nome: `${kn}, ${c ? c.n : id}`, theme: d.theme, exits: {}, enemies: [] };
      ZONES[Z] = buildTown(Z, {
        w: W,
        h: H,
        arrive: port ? [21, 21] : [3, 20],
        paint: (set, fill) => {
          fill(1, 7, 42, 9, ",");
          fill(12, 10, 31, 14, ",");
          fill(1, 15, 42, 16, ",");
          fill(1, 20, 42, 20, ",");
          fill(21, 7, 22, 21, ",");
          if (port) (fill(1, 23, 42, 24, "~"), fill(21, 21, 22, 24, "="));
          else {
            // reino do interior: hortas, pomar e pasto no lugar do mar
            for (let x = 2; x <= 18; x++) for (const y of [22, 23, 24]) set(x, y, (x + y + n) % 3 ? "g" : "w");
            for (let x = 25; x <= 41; x += 3) set(x, 22 + (x % 2), "T");
            fill(26, 24, 40, 24, "f");
          }
        },
        bld: [
          { id: Z + "1", style: "templo", x: 3, y: 2, w: 6, h: 5, door: [5], name: d.n[1] },
          { id: Z + "2", style: n === 2 ? "castle" : n === 3 ? "fortaleza" : d.pal, x: 15, y: 1, w: 14, h: 6, door: [21, 22], name: n === 1 ? d.n[0] : `Paço de ${kn}` },
          { id: Z + "3", style: st(0), x: 31, y: 3, w: 5, h: 4, door: [33] },
          { id: Z + "4", style: "casa", x: 38, y: 3, w: 4, h: 4, door: [39], name: "Casa para alugar" },
          { id: Z + "5", style: "taverna", x: 3, y: 17, w: 6, h: 3, door: [5], name: d.n[2] },
          { id: Z + "6", style: "armazem", x: 11, y: 17, w: 5, h: 3, door: [13], name: d.n[3] },
          { id: Z + "7", style: st(1), x: 28, y: 17, w: 4, h: 3, door: [29] },
          { id: Z + "8", style: st(2), x: 34, y: 17, w: 5, h: 3, door: [36] },
        ],
        stalls: {},
        npcs: {},
        deco: [
          ["T", [[1, 1], [12, 2], [30, 1], [42, 1], [10, 12], [33, 12], [1, 12], [42, 12]]],
          ["l", [[12, 10], [31, 10], [12, 14], [31, 14]]],
          ["b", [[15, 13], [16, 13], [27, 13], [28, 13]]],
        ],
        boats: [],
      });
      if (typeof addDoorPaths === "function") addDoorPaths(Z);
      const key = id + (n > 1 ? "-" + n : "");
      KINGDOMS[key] = { n: `${kn} (${c ? c.n : id})`, short: kn, zone: Z, ruler, far: true };
      if (typeof BASE_RULERS !== "undefined") BASE_RULERS[key] = ruler;
    });
  }
  {
    const koBase = kingdomOf;
    kingdomOf = function (zone) {
      if (zone && zone.startsWith("pais-")) return zone.slice(5);
      return koBase(zone);
    };
  }

  /* ----- estado ----- */
  const here = () => (player.zone && player.zone.startsWith("pais-") ? player.zone.split("-")[1] : null);
  const isPort = () => here() && player.zone.split("-").length === 2;
  const A = () => (player.abroad = player.abroad || { home: null, strikes: 0, rite: {}, fine: {} });
  window.countryTown = function (id, go) {
    if (!P[id]) return false;
    if (!go) return true;
    if (typeof seaDisembark === "function") seaDisembark(id);
    player.zone = zid(id, 1);
    [player.x, player.y] = ZONES[zid(id, 1)].town.arrive;
    player.rx = player.x;
    player.ry = player.y;
    player.dir = "up";
    game.fade = 1;
    enterZone(true);
    const d = P[id];
    setTimeout(() => say([["Morador " + d.hab, d.hi], ["", `Costume daqui: ${d.rite.n} (${d.rite.h[0]}h às ${d.rite.h[1]}h). Lei da terra: ${d.law.n} Clima: ${X[id].clima} ${cOf(id).n} tem cinco reinos: a estrada sai da placa na rua de baixo, à esquerda.`]]), 700);
    return true;
  };

  /* ----- o que se faz em terra ----- */
  const at = (x, y, p) => x === p[0] && y === p[1];
  function kind(x, y) {
    if (!here()) return null;
    if (at(x, y, RITE)) return "rite";
    if (at(x, y, SIGN)) return "sign";
    if (at(x, y, BOAT) && isPort()) return "boat";
    if (at(x, y, ROAD)) return "road";
    return null;
  }
  const inWin = (d) => currentHour() >= d.rite.h[0] && currentHour() < d.rite.h[1];
  function act(k) {
    const id = here(),
      d = P[id],
      a = A();
    if (k === "road") {
      const opts = X[id].k.map(([kn], i) => [kn, zid(id, i + 1)]).filter(([, z]) => z !== player.zone).map(([kn, z]) => ({ t: `${kn} · ${travelDays(player.zone, z)} dia(s) de carruagem · ${10 + travelDays(player.zone, z) * 10} ouro`, icon: "horse", fn: () => journey(z, false, 10 + travelDays(player.zone, z) * 10) }));
      return choice(`Estrada de ${cOf(id).n}`, "Os cinco reinos do país ficam a poucos dias um do outro.", opts.concat([{ t: "Ficar", fn: null }]));
    }
    if (k === "boat") {
      const opts = [];
      if (S2().voyage && S2().ship) opts.push({ t: `Subir a bordo do ${S2().ship.name}`, icon: "flag", fn: board });
      opts.push({ t: "Comprar passagem num navio mercante", icon: "scroll", fn: () => passageMenu() });
      return choice("Cais", a.home === id ? "Você mora aqui. Vai viajar?" : "Navios chegam e partem todo dia.", opts.concat([{ t: "Ficar", fn: null }]));
    }
    if (k === "rite") {
      if (!inWin(d)) return say([["Morador " + d.hab, `O costume é das ${d.rite.h[0]}h às ${d.rite.h[1]}h. Volte na hora certa, todo mundo vem!`]]);
      if (a.rite[id] === player.day) return say([["", "Você já cumpriu o costume hoje. O povo acena para você."]]);
      a.rite[id] = player.day;
      if (typeof passMin === "function") passMin(60);
      if (typeof needAdd === "function") needAdd("fun", 15);
      if (typeof repAdd === "function") repAdd(1);
      if (d.rite.kind === "forja") player.gold += 15;
      if (d.rite.kind === "gelo" && player.hp != null) player.hp = Math.max(1, player.hp - 5);
      return say([["", d.rite.txt], ["Morador " + d.hab, a.home === id ? "Assim é que se vive aqui. Você já é dos nossos." : "Olha só, o estrangeiro respeita os nossos costumes!"]]);
    }
    if (k === "sign") {
      if (a.home === id)
        return choice("A sua casa", `Você mora em ${cOf(id).n}. Faltas ao costume: ${a.strikes}/3.`, [
          { t: "Dormir até o amanhecer", icon: "zzz", fn: () => sleepHere() },
          { t: "Entregar a casa (deixar de morar aqui)", icon: "door", fn: () => ((a.home = null), (a.strikes = 0), toast("Você entregou as chaves.", 2400)) },
          { t: "Sair", fn: null },
        ]);
      return choice("Casa para alugar", `Morar em ${cOf(id).n} custa 150 ouro de entrada. Quem mora aqui vive os costumes: ${d.rite.n} todo dia, e ${d.law.n.toLowerCase()}`, [
        { t: "Alugar e morar aqui (150 ouro)", icon: "house", fn: () => (player.gold < 150 ? toast("Precisa de 150 de ouro.", 1800) : ((player.gold -= 150), (a.home = id), (a.strikes = 0), (a.since = player.day), saveGame(), say([["", `Agora você mora em ${cOf(id).n}. Faltar três vezes ao costume ou quebrar a lei e os vizinhos te põem para fora.`]]))) },
        { t: "Só olhando", fn: null },
      ]);
    }
  }
  const S2 = () => player.sea || {};
  function board() {
    player.zone = "cais";
    game.fade = 1;
    if (typeof seaReembark === "function") seaReembark();
  }
  function sleepHere() {
    const h = currentHour();
    const until = ((6 - h + 24) % 24) || 24;
    if (typeof passTime === "function") passTime(until, "Você dorme na sua casa nova. Lá fora, a cidade estrangeira acorda.");
    player.hp = maxHp();
    if (player.energy != null) player.energy = 100;
  }
  const tgBase = targetAt;
  targetAt = function (x, y) {
    const k = kind(x, y);
    if (k) {
      const d = P[here()];
      if (k === "rite") return `${d.rite.n} (${d.rite.h[0]}h–${d.rite.h[1]}h)`;
      if (k === "sign") return A().home === here() ? "A sua casa" : "Casa para alugar (morar aqui)";
      if (k === "boat") return "Cais: navio e passagens";
      if (k === "road") return `Estrada de ${cOf(here()).n} (os outros reinos)`;
    }
    return tgBase(x, y);
  };
  const iaBase = interactAt;
  interactAt = function (x, y) {
    const k = kind(x, y);
    if (k) return act(k);
    return iaBase(x, y);
  };
  const wkBase = walkable;
  walkable = function (z, x, y) {
    if (z && z.startsWith("pais-") && (at(x, y, RITE) || at(x, y, SIGN) || at(x, y, ROAD) || (at(x, y, BOAT) && z.split("-").length === 2))) return false;
    return wkBase(z, x, y);
  };

  /* ----- as leis: multas e expulsão ----- */
  const upBase = update;
  update = function (dt) {
    upBase(dt);
    const id = here();
    if (!id || game.mode !== "world" || game.dialog) return;
    const d = P[id],
      a = A(),
      key = id + player.day;
    if (a.fine[key]) return;
    let crime = null;
    if (d.law.k === "alcool" && (player.drunk || 0) > 5) crime = ["Guarda de Zahar", "Cheiro de vinho! Aqui é proibido. Multa de 30 de ouro."];
    if (d.law.k === "recolher" && (currentHour() >= d.law.h || currentHour() < 5)) crime = ["Guarda da noite", `Depois das ${d.law.h}h ninguém fica na rua. Multa de 20 de ouro, e para casa!`];
    if (!crime) return;
    a.fine[key] = 1;
    player.gold = Math.max(0, player.gold - (d.law.k === "alcool" ? 30 : 20));
    if (a.home === id) a.strikes++;
    say([crime], () => checkExile(id));
  };
  function checkExile(id) {
    const a = A();
    if (a.home !== id || a.strikes < 3) return;
    a.home = null;
    a.strikes = 0;
    if (typeof repAdd === "function") repAdd(-4);
    say([["Conselho da cidade", `Você não vive como nós. A casa não é mais sua: procure outra terra.`]]);
  }
  const ndBase = onNewDay;
  onNewDay = function () {
    const r = ndBase.apply(this, arguments);
    const a = player.abroad;
    if (!a || !a.home) return r;
    const d = P[a.home];
    // faltou ao costume de ontem?
    if (a.since !== player.day && a.rite[a.home] !== player.day - 1 && here() === a.home) {
      a.strikes++;
      setTimeout(() => toast(`Os vizinhos notaram: você faltou a "${d.rite.n}". (${a.strikes}/3)`, 4500), 3000);
      setTimeout(() => checkExile(a.home), 3200);
    }
    if (d.law.k === "imposto") {
      const tax = Math.min(60, Math.round(player.gold * 0.1));
      player.gold -= tax;
      if (tax) setTimeout(() => toast(`Imposto do Sol de Áurea: -${tax} ouro.`, 3500), 3600);
    }
    return r;
  };

  /* ----- desenho: o lugar do costume, a placa da casa e o barco ----- */
  const cdBase = crewDrawList;
  crewDrawList = function (list, t) {
    cdBase(list, t);
    const id = here();
    if (!id) return;
    const d = P[id],
      T = TILE;
    const R = (x, y, w, h, c) => ((ctx.fillStyle = c), ctx.fillRect(Math.round(x), Math.round(y), w, h));
    list.push({
      y: RITE[1],
      draw: () => {
        const X = RITE[0] * T,
          Y = RITE[1] * T;
        R(X - 6, Y + 26, 44, 5, "rgba(0,0,0,.25)");
        const k = d.rite.kind;
        if (k === "fogueira" || k === "canto") {
          for (let i = 0; i < 5; i++) R(X + 2 + i * 6, Y + 22, 5, 6, "#6b4423");
          const f = Math.sin(t * 9) * 2;
          R(X + 8, Y + 8 - f, 16, 14 + f, "#e8702a");
          R(X + 11, Y + 4 - f, 10, 12, "#f2c14e");
          R(X + 14, Y + 1 - f, 4, 6, "#fff3c0");
        } else if (k === "cha") {
          R(X - 4, Y + 10, 40, 4, "#8a5a2e");
          R(X - 2, Y + 14, 4, 14, "#6b4423");
          R(X + 30, Y + 14, 4, 14, "#6b4423");
          R(X + 4, Y + 2, 10, 8, "#e8e0d0");
          R(X + 14, Y + 4, 3, 2, "#e8e0d0");
          for (const dx of [20, 26]) R(X + dx, Y + 5, 5, 5, "#d8d0c0");
          if (Math.sin(t * 2) > 0) R(X + 8, Y - 4 - ((t * 6) % 6), 2, 4, "rgba(255,255,255,.6)");
        } else if (k === "velas") {
          for (let i = 0; i < 5; i++) {
            R(X + 2 + i * 6, Y + 14 - (i % 2) * 4, 4, 14 + (i % 2) * 4, "#f2eecf");
            R(X + 3 + i * 6, Y + 10 - (i % 2) * 4 + Math.sin(t * 8 + i), 2, 4, "#ffb04a");
          }
        } else if (k === "arvore") {
          R(X + 10, Y - 10, 12, 38, "#5a3a1e");
          R(X - 14, Y - 40, 60, 34, "#1f6a2a");
          R(X - 6, Y - 52, 44, 16, "#2a8a3a");
          R(X + 2, Y + 20, 8, 6, "#c94a3a");
          R(X + 22, Y + 21, 7, 5, "#f2c14e");
        } else if (k === "gelo") {
          R(X - 6, Y + 6, 44, 22, "#dfeef8");
          R(X + 4, Y + 12, 24, 12, "#2a5a8a");
          R(X + 8, Y + 14, 6, 2, "#8ac8f0");
        } else if (k === "forja") {
          R(X - 4, Y + 4, 40, 24, "#4a4450");
          R(X, Y + 8, 14, 12, "#e8702a");
          R(X + 18, Y + 14, 16, 6, "#2a2a2a");
          R(X + 22, Y + 20, 8, 8, "#2a2a2a");
          if (Math.sin(t * 6) > 0.6) R(X + 26, Y + 8, 3, 3, "#ffd07a");
        } else if (k === "desfile") {
          R(X - 4, Y + 12, 40, 14, "#c9a040");
          R(X, Y, 32, 14, "#f2c14e");
          R(X + 12, Y - 8, 8, 8, "#fff0a0");
          for (const dx of [0, 26]) (R(X + dx, Y + 24, 6, 6, "#3a2414"), R(X + dx + 2, Y + 26, 2, 2, "#c9a040"));
        }
        if (inWin(d) && A().rite[id] !== player.day) drawPixelIcon("star", X + 16, Y - 18 + Math.sin(t * 3) * 2, 2);
      },
    });
    list.push({
      y: SIGN[1],
      draw: () => {
        const X = SIGN[0] * T,
          Y = SIGN[1] * T;
        R(X + 14, Y + 4, 4, 26, "#5a3a1e");
        R(X + 2, Y, 28, 14, A().home === id ? "#3a6a3a" : "#8a5a2e");
        R(X + 5, Y + 4, 22, 2, "#efe2c0");
        R(X + 5, Y + 8, 14, 2, "#efe2c0");
      },
    });
    list.push({
      y: BOAT[1],
      draw: () => {
        // o bote do navio, amarrado na ponta do cais
        const X = BOAT[0] * T - 6,
          Y = BOAT[1] * T + 6 + Math.sin(t * 2) * 1.5;
        R(X, Y + 4, 44, 14, "#5a3a1e");
        R(X + 4, Y + 2, 36, 4, "#8a5a2e");
        R(X + 20, Y - 22, 2, 26, "#3a2414");
        R(X + 22, Y - 20, 14, 16, "#f2eee4");
      },
    });
  };

  /* ----- roupas locais, nomes, clima e sotaque ----- */
  const ezBase = enterZone;
  enterZone = function () {
    const r = ezBase.apply(this, arguments);
    const id = here();
    if (!id) return r;
    const L = X[id];
    (game.walkers || []).forEach((w, i) => {
      w.robe = L.robes[i % L.robes.length];
      w.hat = L.hats[i % L.hats.length];
      w.hair = L.hair[i % L.hair.length];
      w.elf = false;
      w.nm = L.names[i % L.names.length] + (i >= L.names.length ? " " + ["o Moço", "a Velha", "do Porto", "da Feira", "o Ligeiro"][i % 5] : "");
      w.line = null;
    });
    setWeather(id, false);
    if (!game.climaSeen || game.climaSeen !== player.zone) ((game.climaSeen = player.zone), setTimeout(() => toast(`Clima de ${cOf(id).n}: ${L.clima}`, 4500), 1400));
    return r;
  };
  function setWeather(id) {
    const tb = X[id].w,
      tot = tb.reduce((a, b) => a + b[1], 0);
    let q = Math.random() * tot;
    for (const [k, p] of tb) if ((q -= p) < 0) return void (player.weather = k);
  }
  const rwBase = rollWeather;
  rollWeather = function (announce) {
    const r = rwBase.apply(this, arguments);
    const id = here();
    if (id) setWeather(id);
    return r;
  };
  // o clima pesa no corpo: frio de Gelomar cansa, sol de Zahar dá sede
  let climaAcc = 0;
  const upB2 = update;
  update = function (dt) {
    upB2(dt);
    const id = here();
    if (!id || game.mode !== "world") return;
    climaAcc += dt;
    if (climaAcc < 5) return;
    climaAcc = 0;
    if (id === "gelo" && player.energy != null) player.energy = Math.max(0, player.energy - 1);
    if ((id === "zahar" || id === "ouro") && player.water != null) player.water = Math.max(0, player.water - 1);
    if ((id === "verde" || id === "coral") && player.hygiene != null) player.hygiene = Math.max(0, player.hygiene - 0.5);
  };
  // sotaque: todo morador fala do jeito da sua terra
  const sayBase = say;
  say = function (lines, cb) {
    const id = here();
    if (id && Array.isArray(lines))
      lines = lines.map((l) => {
        if (!Array.isArray(l) || !l[0] || typeof l[1] !== "string") return l;
        const sp = String(l[0]);
        if (sp === "Você" || sp === player.name || sp === "Narrador" || sp.startsWith("Fantasma")) return l;
        return [l[0], ACCENT[id](l[1]), ...l.slice(2)];
      });
    return sayBase.call(this, lines, cb);
  };

  /* ----- passagem de navio mercante: barata, você vai de passageiro ----- */
  const posOf = (z) => {
    const id = z && z.startsWith("pais-") ? z.split("-")[1] : null;
    const c = id && cOf(id);
    return c ? { x: c.x, y: c.y } : window.SEA_HOME || { x: 300, y: 1200 };
  };
  function seaDaysBetween(a, b) {
    const A = posOf(a),
      B = posOf(b);
    // a travessia mais longa leva quase um ano (30 dias)
    return Math.max(2, Math.min(30, Math.round(Math.hypot(A.x - B.x, A.y - B.y) / 140)));
  }
  window.passageMenu = function () {
    const from = player.zone;
    const dests = [["cais", "Valdária (Cais dos Navegantes)"]].concat(C().filter((c) => P[c.id]).map((c) => [zid(c.id, 1), `${c.n} (${X[c.id].k[0][0]})`])).filter(([z]) => z !== from && !(from === "cais" && z === "cais") && !(["porto", "solmar"].includes(from) && z === "cais"));
    choice(
      "Passagem num navio mercante",
      "Você viaja de passageiro: rede no porão, sopa de peixe e muita paciência. O capitão leva, mas o mar decide quantos dias.",
      dests
        .map(([z, n]) => {
          const d = seaDaysBetween(from, z);
          const price = 20 + d * 6;
          return { t: `${n} · ${d} dias · ${price} ouro`, icon: "flag", fn: () => passage(z, d, price) };
        })
        .concat([{ t: "Voltar", fn: null }]),
    );
  };
  function passage(to, days, price) {
    if (player.gold < price) return say([["Capitão mercante", `A passagem custa ${price}. Sem ouro, sem rede no porão.`]]);
    player.gold -= price;
    const name = to === "cais" ? "Valdária" : cOf(to.split("-")[1]).n;
    const storm = Math.random() < 0.25;
    playCine(passageScene(name, days, storm), 3 + Math.min(days, 30) * 0.25, () => {
      const before = player.day;
      if (typeof passTime === "function") passTime(days * 24 - (player.clock - 9 * 60) / 60, `Depois de ${days} dias no mar, o navio mercante chega a ${name}.`);
      player.clock = 9 * 60;
      player.food = Math.max(30, player.food);
      player.water = Math.max(30, player.water);
      if (player.energy != null) player.energy = Math.max(50, player.energy);
      game.annDay = before;
      if (storm && Math.random() < 0.08) {
        // naufrágio de verdade: às vezes ninguém volta
        if (lifeMode() && typeof lifeEnds === "function" && Math.random() < 0.4) return say([["", "No meio da viagem, uma tempestade partiu o navio mercante ao meio. Ninguém sabe o que foi feito dos passageiros."]], () => lifeEnds());
        player.hp = Math.max(5, Math.round(maxHp() * 0.3));
      }
      player.zone = to;
      [player.x, player.y] = to === "cais" ? [12, 9] : ZONES[to].town.arrive;
      player.rx = player.x;
      player.ry = player.y;
      player.dir = "up";
      enterZone(true);
      saveGame();
      if (storm) setTimeout(() => toast("Pegaram uma tempestade no caminho! Você chegou enjoad" + genderWord("o", "a", "e") + ", mas inteir" + genderWord("o", "a", "e") + ".", 4500), 900);
    });
  }
  function passageScene(name, days, storm) {
    return (W2, H2, t) => {
      const dur = 3 + Math.min(days, 30) * 0.25;
      const p = Math.min(1, t / dur);
      const ph = (p * days) % 1,
        day = Math.sin(ph * Math.PI);
      const dark = storm && p > 0.4 && p < 0.7;
      ctx.fillStyle = dark ? "#1a1e2a" : `rgb(${30 + 110 * day},${40 + 130 * day},${80 + 150 * day})`;
      ctx.fillRect(0, 0, W2, H2);
      const sea = H2 * 0.62;
      ctx.fillStyle = dark ? "#142030" : "#1e4a7a";
      ctx.fillRect(0, sea, W2, H2 - sea);
      for (let x = -((t * 80) % 60); x < W2; x += 60) ((ctx.fillStyle = dark ? "#3a5a7a" : "#3a6a9a"), ctx.fillRect(x, sea + 10 + Math.sin(x + t * 2) * (dark ? 8 : 3), 30, 3));
      if (dark) for (let i = 0; i < 60; i++) ((ctx.fillStyle = "rgba(170,190,220,.5)"), ctx.fillRect((i * 97 + t * 300) % W2, (i * 53 + t * 600) % H2, 1, 10));
      if (dark && Math.sin(t * 9) > 0.95) ((ctx.fillStyle = "rgba(255,255,255,.5)"), ctx.fillRect(0, 0, W2, H2));
      // navio mercante de lado, casco na água
      const bx = W2 / 2 - 90,
        by = sea - 6 + Math.sin(t * (dark ? 4 : 1.6)) * (dark ? 6 : 2);
      ctx.fillStyle = "#5a3a1e";
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.lineTo(bx + 180, by);
      ctx.lineTo(bx + 160, by + 30);
      ctx.lineTo(bx + 20, by + 30);
      ctx.fill();
      ctx.fillStyle = "#8a5a2e";
      ctx.fillRect(bx + 4, by - 6, 172, 8);
      for (const [mx, mh] of [[60, 110], [120, 90]]) {
        ctx.fillStyle = "#3a2414";
        ctx.fillRect(bx + mx, by - mh, 5, mh);
        ctx.fillStyle = "#f2eee4";
        ctx.fillRect(bx + mx - 30, by - mh + 10, 64, mh * 0.6);
      }
      ctx.textAlign = "center";
      ctx.font = '700 26px "Pixelify Sans", sans-serif';
      ctx.fillStyle = "#fff";
      ctx.fillText(`Navio mercante para ${name}`, W2 / 2, 58);
      ctx.font = '600 18px "Pixelify Sans", sans-serif';
      ctx.fillText(dark ? "Tempestade! Todos para o porão!" : `Dia ${Math.min(days, 1 + Math.floor(p * days))} de ${days} no mar`, W2 / 2, 88);
    };
  }
})();
