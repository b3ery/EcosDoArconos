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
  const W = 44,
    H = 26;
  const RITE = [22, 12],
    SIGN = [42, 7],
    BOAT = [21, 24];
  const zid = (id) => "pais-" + id;
  const C = () => window.SEA_COUNTRIES || [];
  const cOf = (id) => C().find((c) => c.id === id);

  for (const [id, d] of Object.entries(P)) {
    const c = cOf(id);
    ZONE_DEFS[zid(id)] = { nome: c ? c.n : id, theme: d.theme, exits: {}, enemies: [] };
    ZONES[zid(id)] = buildTown(zid(id), {
      w: W,
      h: H,
      arrive: [21, 21],
      paint: (set, fill) => {
        fill(1, 7, 42, 9, ",");
        fill(12, 10, 31, 14, ",");
        fill(1, 15, 42, 16, ",");
        fill(1, 20, 42, 20, ",");
        fill(21, 7, 22, 21, ",");
        fill(1, 23, 42, 24, "~");
        fill(21, 21, 22, 24, "=");
      },
      bld: [
        { id: id + "1", style: "templo", x: 3, y: 2, w: 6, h: 5, door: [5], name: d.n[1] },
        { id: id + "2", style: d.pal, x: 15, y: 1, w: 14, h: 6, door: [21, 22], name: d.n[0] },
        { id: id + "3", style: "casa2", x: 31, y: 3, w: 5, h: 4, door: [33] },
        { id: id + "4", style: "casa", x: 38, y: 3, w: 4, h: 4, door: [39], name: "Casa para alugar" },
        { id: id + "5", style: "taverna", x: 3, y: 17, w: 6, h: 3, door: [5], name: d.n[2] },
        { id: id + "6", style: "armazem", x: 11, y: 17, w: 5, h: 3, door: [13], name: d.n[3] },
        { id: id + "7", style: "casa", x: 28, y: 17, w: 4, h: 3, door: [29] },
        { id: id + "8", style: "casa2", x: 34, y: 17, w: 5, h: 3, door: [36] },
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
    if (typeof addDoorPaths === "function") addDoorPaths(zid(id));
  }

  // cada país além-mar é um reino próprio (o letreiro e o jornal mostram)
  for (const c of C()) if (P[c.id]) ((KINGDOMS[c.id] = { n: c.n, short: c.n, zone: zid(c.id), ruler: c.ruler, far: true }), typeof BASE_RULERS !== "undefined" && (BASE_RULERS[c.id] = c.ruler));
  {
    const koBase = kingdomOf;
    kingdomOf = function (zone) {
      if (zone && zone.startsWith("pais-")) return zone.slice(5);
      return koBase(zone);
    };
  }

  /* ----- estado ----- */
  const here = () => (player.zone && player.zone.startsWith("pais-") ? player.zone.slice(5) : null);
  const A = () => (player.abroad = player.abroad || { home: null, strikes: 0, rite: {}, fine: {} });
  window.countryTown = function (id, go) {
    if (!P[id]) return false;
    if (!go) return true;
    if (typeof seaDisembark === "function") seaDisembark(id);
    player.zone = zid(id);
    [player.x, player.y] = ZONES[zid(id)].town.arrive;
    player.rx = player.x;
    player.ry = player.y;
    player.dir = "up";
    game.fade = 1;
    enterZone(true);
    const d = P[id];
    setTimeout(() => say([["Morador " + d.hab, d.hi], ["", `Costume daqui: ${d.rite.n} (${d.rite.h[0]}h às ${d.rite.h[1]}h). Lei da terra: ${d.law.n}`]]), 700);
    return true;
  };

  /* ----- o que se faz em terra ----- */
  const at = (x, y, p) => x === p[0] && y === p[1];
  function kind(x, y) {
    if (!here()) return null;
    if (at(x, y, RITE)) return "rite";
    if (at(x, y, SIGN)) return "sign";
    if (at(x, y, BOAT)) return "boat";
    return null;
  }
  const inWin = (d) => currentHour() >= d.rite.h[0] && currentHour() < d.rite.h[1];
  function act(k) {
    const id = here(),
      d = P[id],
      a = A();
    if (k === "boat") {
      if (a.home === id) return choice("O seu navio", "Você mora aqui. Quer mesmo partir?", [{ t: "Subir a bordo", icon: "flag", fn: board }, { t: "Ficar", fn: null }]);
      return board();
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
      if (k === "boat") return "Voltar para o navio";
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
    if (z && z.startsWith("pais-") && (at(x, y, RITE) || at(x, y, SIGN) || at(x, y, BOAT))) return false;
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
})();
