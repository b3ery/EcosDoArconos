/* 12-vila-amigos-e-contatos.js: junta 17-vida-na-vila.js, 21-amigos-criadores.js, 23-contatos.js. */
/**
 * ECOS DO ARCANO — 12-vila-amigos-e-contatos.js
 * Simulador de Vida mais cheio de vida:
 *  - Móveis novos (banheira, mesa de jogos, fogão a lenha) e todos os móveis úteis.
 *  - Muitas interações com os moradores (piada, conselho, fofoca, empréstimo,
 *    discussão, desculpas, terminar namoro, divórcio...).
 *  - Acontecimentos do dia na vila.
 */

"use strict";

/* ===================== MÓVEIS NOVOS ===================== */

Object.assign(ITEMS, {
  m_banheira: { nome: "Banheira de Madeira", tipo: "movel", preco: 180, desc: "Móvel. Tomar banho em casa (higiene cheia)." },
  m_jogos: { nome: "Mesa de Xadrez", tipo: "movel", preco: 150, desc: "Móvel. Jogar sozinho ou com a família (+diversão)." },
  m_fogao: { nome: "Fogão a Lenha", tipo: "movel", preco: 240, desc: "Móvel. Cozinhar: carne + água vira Ensopado Quente." },
});
SHOPS.moveis.items.push("m_banheira", "m_jogos", "m_fogao");

/** Desenho dos móveis novos. Retorna true se desenhou. */
function drawFurnExtra(f, t) {
  const X = f.x * TILE,
    Y = f.y * TILE;
  const c = (col, a, b, w, h) => {
    ctx.fillStyle = col;
    ctx.fillRect(X + a, Y + b, w, h);
  };
  const sh = () => c("rgba(0,0,0,.22)", 3, 27, 26, 4);
  switch (f.id) {
    case "m_banheira":
      sh();
      c("#8a5a2e", 2, 12, 28, 14);
      c("#a8784a", 2, 10, 28, 4);
      c("#4fb8ff", 5, 13, 22, 6);
      c("#cfeaff", 8 + Math.sin(t * 2) * 2, 14, 6, 2);
      c("#6b4423", 4, 26, 3, 4);
      c("#6b4423", 25, 26, 3, 4);
      return true;
    case "m_jogos":
      sh();
      c("#6b4423", 4, 18, 3, 10);
      c("#6b4423", 25, 18, 3, 10);
      c("#8a5a2e", 2, 10, 28, 10);
      for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) c((i + j) % 2 ? "#f2eee4" : "#2a1d14", 6 + i * 5, 11 + j * 4, 5, 4);
      c("#f2c14e", 9, 6, 3, 5);
      c("#2a1d14", 20, 6, 3, 5);
      return true;
    case "m_fogao":
      sh();
      c("#3a3a44", 2, 4, 28, 24);
      c("#5a5a6a", 2, 4, 28, 3);
      c("#1a1a22", 7, 14, 18, 10);
      c(`rgb(255,${130 + Math.floor(Math.sin(t * 8) * 40)},40)`, 10, 18, 12, 5);
      c("#7a7a8a", 22, -6, 5, 10);
      return true;
  }
  return false;
}

/** Uso dos móveis. Retorna true se tratou. */
function furnUseExtra(f) {
  const id = f.id;
  const once = (k) => {
    if (player.famDay["furn" + k] === player.day) return false;
    player.famDay["furn" + k] = player.day;
    return true;
  };
  if (id === "m_banheira") {
    player.hygiene = 100;
    addNeed("fun", 6);
    player.clock = Math.min(1439, player.clock + 30);
    saveGame();
    say([["", "Banho quente de banheira, com sabão de ervas. Higiene cheia!"]]);
    return true;
  }
  if (id === "m_jogos") {
    const partner = player.spouse && NPCS[player.spouse] ? NPCS[player.spouse].nome.split(",")[0] : null;
    addNeed("fun", partner ? 30 : 18);
    if (partner) addFriendship(player.spouse, once("xadrez") ? 3 : 0);
    player.clock = Math.min(1439, player.clock + 60);
    saveGame();
    say([
      [
        "",
        partner
          ? `Você e ${partner} jogam uma partida de xadrez. ${Math.random() < 0.5 ? "Você ganhou!" : `${partner} ganhou e não para de se gabar.`}`
          : "Você joga xadrez contra si mesmo. Empate, como sempre.",
      ],
    ]);
    return true;
  }
  if (id === "m_fogao") {
    if (!itemCount("carne") || !itemCount("agua"))
      return say([["", "Para cozinhar um ensopado: 1 Carne Assada + 1 Cantil de Água. Compre no açougue e no mercado."]]), true;
    removeItem("carne");
    removeItem("agua");
    addItem("ensopado", 2);
    addNeed("fun", 5);
    player.clock = Math.min(1439, player.clock + 60);
    saveGame();
    say([["", "Você cozinha um ensopado cheiroso no fogão a lenha. +2 Ensopados Quentes!"]]);
    return true;
  }
  if (id === "mesa" || id === "m_mesa") {
    const food = ["ensopado", "torta", "assado", "carne", "peixe", "pao", "queijo", "maca"].find((k) => itemCount(k));
    if (!food) return say([["", "A mesa está vazia. Cozinhe, asse pão ou compre comida para comer em casa."]]), true;
    useItemEffect(food);
    const family = (player.spouse ? 1 : 0) + (player.kids || []).filter((k) => !k.movedOut).length;
    addNeed("fun", 6 + family * 4);
    if (player.spouse) addFriendship(player.spouse, once("jantar") ? 2 : 0);
    saveGame();
    say([["", family ? `Refeição em família! Todo mundo conta como foi o dia. (${ITEMS[food].nome})` : `Você come ${ITEMS[food].nome} em silêncio, olhando pela janela.`]]);
    return true;
  }
  if (!lifeMode()) return false;
  // No Simulador, os móveis "de enfeite" também ajudam.
  if (id === "m_aquario" || id === "m_harpa" || id === "m_quadro") {
    addNeed("fun", id === "m_harpa" ? 15 : 8);
    return false;
  }
  if (id === "m_estante") {
    addNeed("fun", 10);
    return false;
  }
  return false;
}

/* ===================== INTERAÇÕES COM MORADORES ===================== */

const LIFE_JOKES = [
  "Por que o anão não joga xadrez? Porque não alcança a rainha!",
  "O que o mago disse para a poção? Você me deixa sem palavras... e sem mana.",
  "Sabe por que o Ent nunca mente? Porque ele tem raízes muito profundas.",
  "Fui pescar e peguei um resfriado. O peixe fugiu.",
];
const LIFE_ADVICE = [
  "Nunca compre uma casa em dia de festival: o corretor está bêbado e você também.",
  "Durma bem. Gente cansada briga à toa e trabalha mal.",
  "Guarde ouro para o Coletor Real. Ele sempre volta.",
  "Se for pedir alguém em casamento, tome banho antes. Sério.",
  "Amigos valem mais que ouro. Mas ouro paga o aluguel.",
];
/** Terminar namoro e divórcio (aparecem no menu da pessoa). */
function relationEndItems(id) {
  const n = NPCS[id].nome.split(",")[0];
  const opts = [];
  if (player.dating === id)
    opts.push({
      t: "Terminar o namoro",
      fn: () => {
        player.dating = null;
        player.openRel = null;
        addFriendship(id, -30);
        addNeed("fun", -20);
        saveGame();
        say([[n, "...Então é isso. Tudo bem. Espero que você seja feliz."]]);
      },
    });
  if (player.spouse === id && id !== "rainha")
    opts.push({
      t: "Pedir o divórcio",
      fn: () =>
        choice("Divórcio", `Tem certeza? ${n} sai de casa e fica com metade do seu ouro. Os filhos ficam com você.`, [
          {
            t: "Sim, quero o divórcio",
            fn: () => {
              const half = Math.floor(player.gold / 2);
              player.gold -= half;
              player.spouse = null;
              player.openRel = null;
              addFriendship(id, -40);
              repAdd(-4);
              addNeed("fun", -30);
              saveGame();
              say([
                [n, "Eu levo meus móveis e metade do ouro. Os filhos... cuide bem deles."],
                ["", `Divórcio assinado no Templo. ${n} saiu de casa e levou ${half} de ouro.`],
              ]);
            },
          },
          { t: "Não, pensando bem...", fn: null },
        ]),
    });
  return opts;
}

/* ===================== ACONTECIMENTOS DO DIA ===================== */

const VILLAGE_EVENTS = [
  { t: "Casamento na praça! Dois moradores se casaram e a vila inteira comemorou.", fun: 10 },
  { t: "Artistas de rua chegaram à praça: malabaristas e um urso que dança.", fun: 12 },
  { t: "Mercado de pulgas hoje: tudo mais barato nas bancas da praça.", gold: 15 },
  { t: "Briga de vizinhos por causa de uma galinha. A Guarda precisou intervir.", rep: 0 },
  { t: "Nasceu um bebê na casa do moleiro. Todo mundo foi visitar.", fun: 6 },
  { t: "Um mercador do Oriente passou pela vila vendendo especiarias.", fun: 4 },
  { t: "Incêndio no celeiro! Os moradores fizeram uma corrente de baldes.", rep: 1 },
  { t: "Procissão do Templo pelas ruas, com velas e cânticos.", fun: 5 },
  { t: "Um bardo viajante cantou na taverna até de madrugada.", fun: 10 },
  { t: "Ladrões assaltaram a feira à noite. A Guarda Real está atrás deles.", gold: -10 },
];
function villageEventOfDay() {
  if (!lifeMode() || Math.random() > 0.7) return;
  const e = VILLAGE_EVENTS[Math.floor(Math.random() * VILLAGE_EVENTS.length)];
  if (e.fun) addNeed("fun", e.fun);
  if (e.gold) player.gold = Math.max(0, player.gold + e.gold);
  if (e.rep) repAdd(e.rep);
  player.lastEvent = e.t;
  setTimeout(() => toast("Na vila hoje: " + e.t, 5200), 6400);
}

/* ======================================================================
   (antes: 21-amigos-criadores.js)
   ====================================================================== */

/**
 * ECOS DO ARCANO — 12-vila-amigos-e-contatos.js
 * Os criadores do jogo viram personagens importantes de Cinzaluz, com seus parceiros:
 *  - Lucas Marzocca: o rolezeiro. Só conversa depois de ganhar um hidromel.
 *  - Matheus: o fazendeiro, melhor amigo do Lucas, casado com a Duquesa Malu.
 *  - Marcos: o General, casado com a Princesa Julia das Marés; ajuda na vila.
 *  - Andressa: dona da maior rede de bibliotecas, misteriosa, sabe tudo de segurança. Casada com o Pedro Poeta.
 *  - Princesa Mylena: artista do Ateliê de pinturas e móveis, casada com o Príncipe Pedro Max, filho da Rainha.
 *  - Júlia Oliveira (homenagem): veterinária e dona dos bichos, casada com o Rei Vini do Sul.
 * Cada um tem casa, trabalho e rotina: anda pela vila, vai trabalhar, se encontra e volta para casa.
 * (Visual inspirado nas fotos da equipe no README.)
 */


/* ===================== VISUAL (estilo do jogador) ===================== */

/** Cada um tem cores únicas: wizardRects reconhece e desenha o visual detalhado. */
const PLAID = "#7d8478",
  PLAID_D = "#5a6056",
  PLAID_L = "#a3aa9c";
const CREW_LOOKS = {
  lucas: { robe: "#a82a3a", hat: null, hair: "#2a1a10", look: { skin: "#d9a07a", hair: "#2a1a10", hstyle: "curto", hat: "nenhum", hatc: "#2a2f6e", outfit: "tunica", robe: "#a82a3a", eyes: "#2a1a10", acc: "nenhum" } },
  matheus: { robe: "#e8e4dd", hat: "#c9a03b", hair: "#2a1a11", look: { skin: "#f1c8a5", hair: "#2a1a11", hstyle: "cacheado", hat: "abas", hatc: "#c9a03b", outfit: "tunica", robe: "#e8e4dd", eyes: "#3a2414", acc: "nenhum" } },
  marcos: { robe: "#3a5aa8", hat: null, hair: "#1a1a1b", look: { skin: "#c08458", hair: "#1a1a1b", hstyle: "curto", hat: "nenhum", hatc: "#2a2f6e", outfit: "capa", robe: "#3a5aa8", eyes: "#222222", acc: "oculos" } },
  // Andressa: cachos longos presos caindo no ombro, óculos pretos grossos, casaco xadrez sobre blusa verde.
  andressa: {
    robe: "#7d8479",
    hat: null,
    hair: "#1a1410",
    look: {
      skin: "#c08a64",
      hair: "#1a1410",
      hstyle: "cacheado",
      hat: "nenhum",
      hatc: "#2a2f6e",
      outfit: "tunica",
      robe: "#7d8479",
      eyes: "#2a1a10",
      acc: "nenhum",
      extra: (dir) => {
        const H = "#1a1410",
          Hl = "#3a2a20";
        if (dir === "up")
          return [
            [5, 3, 6, 2, H],
            [7, 9, 3, 4, H],
            [8, 10, 1, 1, Hl],
            [8, 12, 1, 1, Hl],
          ];
        const side = dir === "left" || dir === "right";
        const body = side
          ? [
              [5, 9, 6, 4, PLAID],
              [8, 9, 2, 3, "#7a9a6a"],
              [5, 10, 6, 1, PLAID_D],
              [6, 9, 1, 4, PLAID_L],
            ]
          : [
              [4, 9, 8, 4, PLAID],
              [6, 9, 4, 4, "#7a9a6a"],
              [4, 10, 2, 1, PLAID_D],
              [10, 10, 2, 1, PLAID_D],
              [4, 12, 2, 1, PLAID_D],
              [10, 12, 2, 1, PLAID_D],
              [5, 9, 1, 4, PLAID_L],
              [10, 9, 1, 4, PLAID_L],
              [3, 9, 1, 3, PLAID],
              [12, 9, 1, 3, PLAID],
            ];
        const hair = side
          ? [
              [5, 3, 6, 2, H],
              [4, 5, 2, 4, H],
              [4, 9, 2, 3, H],
              [4, 10, 1, 1, Hl],
              [5, 12, 1, 1, H],
            ]
          : [
              [5, 3, 6, 2, H],
              [6, 3, 1, 1, Hl],
              [9, 3, 1, 1, Hl],
              // cachos caindo pelo ombro direito dela
              [3, 7, 2, 2, H],
              [2, 9, 3, 2, H],
              [3, 11, 2, 2, H],
              [3, 9, 1, 1, Hl],
              [4, 11, 1, 1, Hl],
              [11, 7, 1, 2, H],
            ];
        // Óculos pretos grossos: aro em cima de cada olho e ponte entre eles.
        const eyes = side
          ? [
              [8, 7, 1, 1, "#4a4a4a"],
              [6, 7, 1, 1, "#111"],
            ]
          : [
              [7, 7, 2, 1, "#4a4a4a"],
              [5, 7, 1, 1, "#111"],
              [10, 7, 1, 1, "#111"],
            ];
        return [...body, ...hair, ...eyes];
      },
    },
  },
  mylena: { robe: "#c94a8b", hat: null, hair: "#1a1a1d", look: { skin: "#a8704a", hair: "#1a1a1d", hstyle: "longo", hat: "flor", hatc: "#2a2f6e", outfit: "vestido", robe: "#c94a8b", eyes: "#2a1a10", acc: "brincos" } },
  malu: { robe: "#7a3a8a", hat: null, hair: "#8a3a1b", look: { skin: "#f1c8a5", hair: "#8a3a1b", hstyle: "longo", hat: "tiara", hatc: "#2a2f6e", outfit: "real", robe: "#7a3a8a", eyes: "#3a5a2a", acc: "colar" } },
  // Princesa Julia das Marés (esposa do Marcos): cachos longos castanho-avermelhados, blusa vinho, colar dourado.
  julia: {
    robe: "#7a1a2a",
    hat: null,
    hair: "#4a2014",
    look: {
      skin: "#e8b896",
      hair: "#4a2014",
      hstyle: "longo",
      hat: "tiara",
      hatc: "#2a2f6e",
      outfit: "tunica",
      robe: "#7a1a2a",
      eyes: "#2a1a10",
      acc: "colar",
      extra: (dir) => {
        const H = "#4a2014",
          Hl = "#8a4a2a";
        if (dir === "up") return [[4, 4, 8, 9, H], [5, 6, 1, 1, Hl], [9, 9, 1, 1, Hl], [6, 11, 1, 1, Hl]];
        const side = dir === "left" || dir === "right";
        const hair = side
          ? [[5, 4, 7, 2, H], [4, 5, 3, 8, H], [4, 7, 1, 1, Hl], [5, 10, 1, 1, Hl], [4, 12, 1, 1, Hl]]
          : [[5, 4, 6, 2, H], [3, 5, 2, 9, H], [11, 5, 2, 9, H], [3, 7, 1, 1, Hl], [12, 9, 1, 1, Hl], [3, 11, 1, 1, Hl], [12, 12, 1, 1, Hl], [4, 13, 1, 1, Hl]];
        const top = side ? [] : [[6, 9, 4, 1, "#e8b896"], [6, 10, 4, 1, "#f2c14e"], [7, 8, 1, 1, "#f2eee4"]];
        return [...hair, ...top];
      },
    },
  },
  // Luca: careca, barba e bigode, jaqueta verde-oliva e camiseta preta de banda.
  luca: {
    robe: "#4a5a32",
    hat: null,
    hair: "#5a3a22",
    look: {
      skin: "#f0c8a8",
      hair: "#5a3a22",
      hstyle: "careca",
      hat: "nenhum",
      hatc: "#2a2f6e",
      outfit: "capa",
      robe: "#4a5a32",
      eyes: "#2a1a10",
      acc: "nenhum",
      extra: (dir) => {
        const B = "#5a3a22";
        const S = "#f0c8a8";
        const head = [[5, 4, 6, 2, S], [5, 6, 1, 2, S], [10, 6, 1, 2, S], [4, 6, 1, 2, "#e0b090"], [11, 6, 1, 2, "#e0b090"]];
        if (dir === "up") return head.concat([[5, 6, 6, 3, S], [7, 4, 2, 1, "#ffe0c8"]]);
        const side = dir === "left" || dir === "right";
        const beard = side ? [[7, 8, 4, 1, B], [8, 9, 3, 1, B]] : [[5, 8, 6, 1, B], [6, 9, 4, 1, B], [5, 7, 1, 1, B], [10, 7, 1, 1, B], [7, 8, 2, 1, "#3a2414"]];
        const shine = side ? [[8, 4, 2, 1, "#ffe0c8"]] : [[6, 4, 2, 1, "#ffe0c8"], [11, 7, 1, 1, "#c9c0b8"]];
        const shirt = side ? [] : [[6, 9, 4, 4, "#1a1a1a"], [7, 10, 2, 1, "#e8e8e8"]];
        return [...head, ...beard, ...shine, ...shirt];
      },
    },
  },
  // Príncipe Pedro Max (filho da Rainha, marido da Mylena): pele morena, cachos pretos, bigode.
  pedro: { robe: "#2a4a8b", hat: null, hair: "#140c08", look: { skin: "#a8704a", hair: "#140c08", hstyle: "cacheado", hat: "coroa", hatc: "#2a2f6e", outfit: "real", robe: "#2a4a8b", eyes: "#2a1a10", acc: "bigode" } },
  // Pedro, o Poeta (marido da Andressa; o id continua "gabriel" para não perder jogos salvos).
  gabriel: { robe: "#6a2a4a", hat: null, hair: "#3a2414", look: { skin: "#d9a07a", hair: "#3a2414", hstyle: "longo", hat: "boina", hatc: "#2a2a2a", outfit: "tunica", robe: "#6a2a4a", eyes: "#2a1a10", acc: "cachecol" } },
  // Júlia Oliveira: cachos volumosos na altura do ombro, óculos redondos finos, blusa caramelo, brincos.
  juliaO: {
    robe: "#c9773a",
    hat: null,
    hair: "#24160e",
    look: {
      skin: "#c8906a",
      hair: "#24160e",
      hstyle: "cacheado",
      hat: "nenhum",
      hatc: "#2a2f6e",
      outfit: "vestido",
      robe: "#c9773a",
      eyes: "#2a1a10",
      acc: "nenhum",
      extra: (dir) => {
        const H = "#24160e",
          Hl = "#4a3020";
        if (dir === "up") return [[4, 3, 8, 3, H], [3, 6, 10, 4, H], [5, 4, 1, 1, Hl], [9, 7, 1, 1, Hl]];
        const side = dir === "left" || dir === "right";
        const hair = side
          ? [[5, 3, 7, 2, H], [4, 4, 3, 6, H], [5, 6, 1, 1, Hl], [4, 8, 1, 1, Hl]]
          : [
              [4, 3, 8, 2, H],
              [3, 4, 2, 6, H],
              [11, 4, 2, 6, H],
              [4, 4, 1, 1, Hl],
              [11, 5, 1, 1, Hl],
              [3, 7, 1, 1, Hl],
              [12, 8, 1, 1, Hl],
              [6, 3, 1, 1, Hl],
              [9, 3, 1, 1, Hl],
            ];
        // Óculos redondos finos dourados + jaleco branco de veterinária por cima.
        const glasses = side
          ? [[7, 7, 1, 1, "#d9c08a"], [9, 7, 2, 1, "#d9c08a"]]
          : [[5, 7, 1, 1, "#d9c08a"], [7, 7, 2, 1, "#d9c08a"], [10, 7, 1, 1, "#d9c08a"], [5, 8, 1, 1, "#f2c14e"], [10, 8, 1, 1, "#f2c14e"]];
        const coat = side ? [[5, 9, 2, 4, "#f2eee4"]] : [[4, 9, 2, 5, "#f2eee4"], [10, 9, 2, 5, "#f2eee4"], [7, 11, 2, 1, "#7ad36b"]];
        return [...hair, ...glasses, ...coat];
      },
    },
  },
  // Rei Vini do Sul: coroa, barba curta, traje real verde e dourado.
  vini: {
    robe: "#2f7a4a",
    hat: null,
    hair: "#2a1a10",
    look: {
      skin: "#d9a07a",
      hair: "#2a1a10",
      hstyle: "curto",
      hat: "coroa",
      hatc: "#2a2f6e",
      outfit: "real",
      robe: "#2f7a4a",
      eyes: "#2a1a10",
      acc: "nenhum",
      extra: (dir) => (dir === "up" ? [] : dir === "down" ? [[6, 8, 4, 1, "#2a1a10"], [5, 7, 1, 1, "#2a1a10"], [10, 7, 1, 1, "#2a1a10"]] : [[7, 8, 3, 1, "#2a1a10"]]),
    },
  },
};
for (const k in CREW_LOOKS) {
  const c = CREW_LOOKS[k];
  HERO_LOOKS[`${c.robe}|${c.hat}|${c.hair}`] = c.look;
}
const CREW = ["lucas", "matheus", "marcos", "andressa", "mylena"];
const crewName = (id) => NPCS[id].nome.split(",")[0];

/* ===================== PERSONAGENS ===================== */

const LUCAS_DATES = ["a filha do moleiro", "a Cocheira Lila", "uma marinheira do Porto", "a dona da barraca de flores", "uma anã de Pedravale", "a sobrinha do Padre Anselmo"];
function crewNPC(id, nome, talk) {
  const c = CREW_LOOKS[id];
  return { nome, robe: c.robe, hat: c.hat, hair: c.hair, talk };
}
Object.assign(NPCS, {
  lucas: crewNPC("lucas", "Lucas Marzocca, o Rolezeiro", () => [
    ["Lucas Marzocca", ["Hoje tem festa na taverna! E amanhã também. E depois de amanhã...", "Namorando? Eu? ...Só três. Quatro. Depende do dia.", "O Matheus é meu irmão de outra mãe. Se eu sumir, procura na fazenda dele."][Math.floor(Math.random() * 3)]],
  ]),
  matheus: crewNPC("matheus", "Matheus, Duque e Fazendeiro", () => [
    ["Matheus", ["Terra boa, chuva certa e a Malu do meu lado. Precisa de mais nada.", "O Lucas? Passou a noite na taverna de novo. Eu que vou buscar ele, como sempre.", "Sou fazendeiro, casado com uma duquesa. A vila até hoje não acredita!"][Math.floor(Math.random() * 3)]],
  ]),
  marcos: crewNPC("marcos", "General Marcos", () => [
    ["General Marcos", ["Um general também carrega lenha, conserta cerca e ajuda a vila. Disciplina é isso.", "Minha esposa é princesa das Marés. Por isso eu sei: paz entre reinos dá mais trabalho que guerra.", "Treino todo dia ao amanhecer. Se quiser ficar forte, fale comigo."][Math.floor(Math.random() * 3)]],
  ]),
  andressa: crewNPC("andressa", "Andressa, a Bibliotecária-Chefe", () => [
    ["Andressa", ["Tenho bibliotecas em três reinos. E em todas, alguém me conta alguma coisa.", "*ajeita os óculos* Eu sei o que você está procurando. A pergunta é: o que você me dá em troca?", "Segurança não é muralha. É informação no lugar certo."][Math.floor(Math.random() * 3)]],
  ]),
  mylena: crewNPC("mylena", "Mylena, Princesa e Artista", () => [
    ["Mylena", ["Pintei a Rainha ontem. Ela pediu para tirar uma ruga. Eu tirei duas, de presente!", "Meu ateliê tem quadros e móveis feitos à mão. Cada um com uma história... e um pouco de tinta no lugar errado.", "O Pedro diz que eu pinto a vila mais bonita do que ela é. Eu digo que pinto como ela merece ser."][Math.floor(Math.random() * 3)]],
  ]),
  malu: crewNPC("malu", "Duquesa Malu", () => [["Duquesa Malu", "Duquesa de dia, fazendeira à tarde. O Matheus me ensinou a plantar; eu ensinei ele a dançar valsa."]]),
  julia: crewNPC("julia", "Princesa Julia das Marés", () => [["Princesa Julia", "Deixei o palácio das Marés para casar com o Marcos. Melhor decisão da minha vida... depois da de trazer meus sapatos."]]),
  pedro: crewNPC("pedro", "Príncipe Pedro Max", () => [["Príncipe Pedro Max", pickOne(["Minha mãe governa o reino. A Mylena governa o meu coração. E a minha agenda, pelo jeito.", "Herdeiro do trono, sim. Mas o que eu gosto mesmo é de ver a Mylena pintando.", "O Lucas e o Luca vivem falando mal da monarquia. Eu finjo que não ouço. Às vezes eu concordo."])]]),
  gabriel: crewNPC("gabriel", "Pedro, o Poeta", () => [["Pedro Poeta", pickOne(["\"Nos óculos dela cabe o mundo; nos segredos dela, cabem três reinos.\" ...Escrevi agora. Pra Andressa.", "Poeta não ganha ouro. Ganha suspiros. A Andressa diz que suspiro não paga o aluguel.", "Quer ouvir um soneto? Tenho catorze. Quer dizer, um soneto tem catorze versos. Eu tenho um.", "Rimei 'Cinzaluz' com 'arcabuz'. A Andressa disse que isso é uma ameaça."])]]),
  juliaO: crewNPC("juliaO", "Júlia Oliveira, a Veterinária", () => [
    ["Júlia Oliveira", ["Cachorro, gato, coruja, cavalo, até dragãozinho: se tem pata ou asa, eu cuido.", "O Vini diz que o Sul é o reino mais rico. Eu digo que é o mais feliz. E quem manda lá em casa sou eu.", "Hoje tem café com a Mylena e a Andressa. Fofoca de alto nível, com informação de segurança e quadro novo."][Math.floor(Math.random() * 3)]],
  ]),
  vini: crewNPC("vini", "Rei Vini do Sul", () => [["Rei Vini", ["Governo o Reino do Sul, mas quando venho a Cinzaluz eu só sou o marido da Júlia.", "Ouro a gente tem. Mas felicidade é ver a Júlia rindo com as amigas."][Math.floor(Math.random() * 2)]]]),
});
Object.assign(FRIENDS, {
  lucas: { fav: "hidromel", r80: ["vinho", 3] },
  matheus: { fav: "pao", r80: ["torta", 3] },
  marcos: { fav: "carne", r80: ["escudo", 1] },
  andressa: { fav: "livro", r80: ["papiro", 3] },
  mylena: { fav: "flor", r80: ["m_retrato", 1] },
  juliaO: { fav: "mel", r80: ["pocaoG", 2] },
});
Object.assign(PERSONALITIES, { lucas: "engracado", matheus: "gentil", marcos: "serio", andressa: "esperto", mylena: "engracado", malu: "gentil", julia: "orgulhoso", pedro: "gentil", gabriel: "sabio", juliaO: "gentil", vini: "aventureiro" });
// Só o Lucas é solteiro.
ROMANCE.push("lucas");

/* ===================== CASAS E LUGARES DE TRABALHO ===================== */

const BUILDING_EXTRA_STYLES = {
  atelie: { roof: "#a83a6a", r2: "#c94a8b", wall: "#f6e6ee", beam: "#5a2a3a", sign: "flower", chim: 0, lantern: 1 },
  clinica: { roof: "#2f7a5a", r2: "#3f9a6e", wall: "#eef2e6", beam: "#2a4a3a", sign: "paw", chim: 0 },
  mansao: { roof: "#2a3a7a", r2: "#3a5aa8", wall: "#f2ecdc", beam: "#c9a03a", chim: 2, lantern: 1, stone: 1, rich: 1, flag: "#f2c14e" },
  sobrado: { roof: "#5a3a6a", r2: "#7a5a8a", wall: "#e8dcc8", beam: "#3a2a3a", chim: 1 },
  casebre: { roof: "#a88a4a", r2: "#c9a85a", wall: "#a88a6a", beam: "#5a4a32", chim: 0, thatch: 1, poor: 1 },
};
Object.assign(BUILDING_STYLES, BUILDING_EXTRA_STYLES);

/** Casas da turma na vila (e os dois estabelecimentos novos). */
const CREW_BUILDINGS = [
  { id: "hLucas", style: "casebre", x: 21, y: 18, w: 4, h: 3, door: [22], name: "Quartinho do Lucas", home: ["lucas"] },
  lote("a1", { id: "hMatheus", style: "casa2", name: "Sítio do Duque Matheus", home: ["matheus", "malu"] }),
  lote("a2", { id: "hMarcos", style: "sobrado", name: "Casa do General", home: ["marcos", "julia"] }),
  lote("a3", { id: "hAndressa", style: "sobrado", name: "Casa da Andressa e do Pedro Poeta", home: ["andressa", "gabriel"] }),
  lote("a5", { id: "hLuca", style: "casebre", name: "Barraco do Luca", home: ["luca"] }),
  { id: "atelie", style: "atelie", x: 30, y: 35, w: 4, h: 3, door: [31], name: "Ateliê da Mylena", home: ["mylena", "pedro"], work: "mylena" },
  { id: "clinica", style: "clinica", x: 46, y: 30, w: 4, h: 3, door: [47], name: "Clínica Veterinária da Júlia", work: "juliaO" },
  lote("a4", { id: "hJulia", style: "mansao", name: "Mansão Oliveira", home: ["juliaO", "vini"] }),
];
(function placeCrewBuildings() {
  const z = ZONES.vila,
    tw = z.town;
  for (const b of CREW_BUILDINGS) placeVilaBuilding(b);
})();
function crewHomeOf(id) {
  return CREW_BUILDINGS.find((b) => (b.home || []).includes(id));
}
function doorOut(b) {
  return [b.door[0], b.y + b.h];
}

/* ===================== ROTINA ===================== */

const CREW_ALL = ["lucas", "matheus", "malu", "marcos", "julia", "andressa", "gabriel", "mylena", "pedro", "juliaO", "vini"];
const CREW_GATHER_SPOTS = [
  [28, 22],
  [30, 22],
  [32, 22],
  [34, 22],
  [31, 17],
];
/** Em dia de festival à noite, e a cada 3 dias no fim da tarde, os cinco se encontram na fonte. */
function crewGathering() {
  const h = currentHour();
  return (festivalToday() && h >= 17 && h < 23) || (player.day % 3 === 1 && h >= 17 && h < 21);
}
/** Café das amigas: Mylena, Andressa e Júlia na frente do Ateliê, à tarde. */
function girlsCoffee() {
  const h = currentHour();
  return h >= 14.5 && h < 17;
}
/** Onde cada um deveria estar agora: [x, y] ou "home" (dentro de casa). */
function crewTarget(id) {
  const h = currentHour();
  const home = crewHomeOf(id);
  const out = home ? doorOut(home) : [31, 22];
  const gi = CREW.indexOf(id);
  if (gi >= 0 && crewGathering()) return CREW_GATHER_SPOTS[gi];
  const atelie = doorOut(CREW_BUILDINGS.find((b) => b.id === "atelie"));
  const coffee = { mylena: [atelie[0] - 1, atelie[1]], andressa: [atelie[0] + 1, atelie[1]], juliaO: [atelie[0], atelie[1] + 1] };
  if (coffee[id] && girlsCoffee()) return coffee[id];
  switch (id) {
    case "lucas":
      if (h >= 2 && h < 10) return "home";
      if (h >= 18 || h < 2) return [16, 19]; // porta da taverna
      return h < 14 ? [27, 25] : [37, 19]; // praça e mercado
    case "matheus":
      if (h < 5.5 || h >= 20) return "home";
      return h < 17 ? [16, 34] : out;
    case "malu":
      if (h < 7 || h >= 20) return "home";
      return h < 12 ? [16, 32] : h < 17 ? [30, 12] : out;
    case "marcos":
      if (h < 5 || h >= 21) return "home";
      return h < 9 ? [12, 9] : h < 17 ? [33, 12] : [36, 21];
    case "julia":
      if (h < 8 || h >= 21) return "home";
      return h < 16 ? [29, 13] : [35, 21];
    case "andressa":
      if (h < 7 || h >= 22) return "home";
      return h < 17 ? [56, 9] : [44, 12];
    case "gabriel":
      if (h < 7 || h >= 22) return "home";
      return h < 17 ? [52, 12] : [45, 12];
    case "mylena":
      if (h < 7 || h >= 22) return "home";
      return h < 17 ? [atelie[0] + 2, atelie[1]] : [26, 22];
    case "pedro":
      if (h < 8 || h >= 22) return "home";
      return h < 17 ? [31, 12] : [27, 22];
    case "juliaO": {
      if (h < 7 || h >= 21) return "home";
      const cl = doorOut(CREW_BUILDINGS.find((b) => b.id === "clinica"));
      return h < 17 ? [cl[0] + 1, cl[1]] : [38, 22];
    }
    case "vini":
      if (!(festivalToday() || player.day % 7 === 6)) return "away";
      if (h < 9 || h >= 21) return "home";
      return h < 14 ? [30, 25] : [39, 22];
  }
  return out;
}

/** Um ator por pessoa: anda pelo caminho mais curto até onde a rotina manda. */
function bfsPath(sx, sy, tx, ty) {
  if (sx === tx && sy === ty) return [];
  const key = (x, y) => x + "," + y;
  const prev = new Map([[key(sx, sy), null]]);
  const q = [[sx, sy]];
  while (q.length) {
    const [x, y] = q.shift();
    if (x === tx && y === ty) break;
    for (const [dx, dy] of DIRS4) {
      const nx = x + dx,
        ny = y + dy,
        k = key(nx, ny);
      if (prev.has(k)) continue;
      if (!(nx === tx && ny === ty) && !walkable("vila", nx, ny)) continue;
      prev.set(k, [x, y]);
      q.push([nx, ny]);
    }
    if (prev.size > 4000) break;
  }
  if (!prev.has(key(tx, ty))) return null;
  const path = [];
  let cur = [tx, ty];
  while (cur && !(cur[0] === sx && cur[1] === sy)) {
    path.unshift(cur);
    cur = prev.get(key(cur[0], cur[1]));
  }
  return path;
}
function crewInit() {
  game.crewA = {};
  for (const id of CREW_ALL) {
    const tg = crewTarget(id);
    const home = crewHomeOf(id);
    const [x, y] = Array.isArray(tg) ? tg : home ? doorOut(home) : [31, 22];
    game.crewA[id] = { id, x, y, rx: x, ry: y, dir: "down", path: [], inside: !Array.isArray(tg), tk: null, step: Math.random() * 0.3 };
  }
}
function crewTick(dt) {
  if (player.zone !== "vila" || game.mode === "title") return;
  if (!game.crewA) crewInit();
  for (const a of Object.values(game.crewA)) {
    a.rx += (a.x - a.rx) * Math.min(1, dt * 7);
    a.ry += (a.y - a.ry) * Math.min(1, dt * 7);
    const tg = crewTarget(a.id);
    const home = crewHomeOf(a.id);
    const dest = Array.isArray(tg) ? tg : home ? doorOut(home) : null;
    if (!dest) {
      a.inside = true;
      continue;
    }
    const k = dest.join(",");
    if (a.inside && Array.isArray(tg)) {
      // Sai de casa pela porta.
      a.inside = false;
      if (home) [a.x, a.y] = doorOut(home);
      a.rx = a.x;
      a.ry = a.y;
    }
    if (a.tk !== k) {
      a.tk = k;
      // Pulou muito tempo (dormiu, esperou): aparece direto no lugar.
      const far = Math.abs(a.x - dest[0]) + Math.abs(a.y - dest[1]);
      a.path = far > 45 ? null : bfsPath(a.x, a.y, dest[0], dest[1]);
      if (!a.path) {
        [a.x, a.y] = dest;
        a.rx = a.x;
        a.ry = a.y;
        a.path = [];
      }
    }
    if (!a.path.length) {
      if (!Array.isArray(tg) && a.x === dest[0] && a.y === dest[1]) a.inside = true;
      continue;
    }
    a.step -= dt * (game.timeSpeed || 1);
    if (a.step > 0) continue;
    a.step = 0.32;
    const [nx, ny] = a.path[0];
    if (nx === player.x && ny === player.y) continue;
    if (Object.values(game.crewA).some((o) => o !== a && !o.inside && o.x === nx && o.y === ny) && a.path.length > 1) continue;
    a.path.shift();
    a.dir = nx > a.x ? "right" : nx < a.x ? "left" : ny > a.y ? "down" : "up";
    a.x = nx;
    a.y = ny;
  }
}
function crewVisible(a) {
  return a && !a.inside && player.zone === "vila";
}
function crewActorAt(x, y) {
  if (player.zone !== "vila" || !game.crewA) return null;
  const a = Object.values(game.crewA).find((q) => crewVisible(q) && q.x === x && q.y === y);
  return a ? a.id : null;
}
/** A turma toda está reunida na fonte e você clicou num deles? */
function crewAtGathering(x, y) {
  return crewGathering() && CREW_GATHER_SPOTS.some(([a, b]) => a === x && b === y) && crewActorAt(x, y);
}
function crewSpot(id) {
  const a = game.crewA && game.crewA[id];
  return crewVisible(a) ? [a.x, a.y] : null;
}
const _npcSpotBase = npcSpot;
npcSpot = function (id) {
  if (CREW_ALL.includes(id)) return crewSpot(id);
  return _npcSpotBase(id);
};
/** Porta de uma casa da turma: bate e quem estiver em casa atende. */
function crewDoor(b) {
  if (!b || !CREW_BUILDINGS.includes(b)) return false;
  if (!game.crewA) crewInit();
  if (b.work && !(b.home || []).length) {
    const w = game.crewA[b.work];
    const here = w && !w.inside && Math.abs(w.x - b.door[0]) + Math.abs(w.y - (b.y + b.h)) <= 2;
    if (b.id === "clinica") {
      if (!here) return say([["", `A clínica está fechada. A Júlia atende das 7h às 17h${girlsCoffee() ? " (agora ela está no café com as amigas, na frente do Ateliê)" : ""}.`]]), true;
      return vetMenu(), true;
    }
  }
  if (b.id === "atelie") {
    const m = game.crewA.mylena;
    const open = currentHour() >= 7 && currentHour() < 17;
    if (open) return openShop("atelie"), true;
  }
  const atHome = (b.home || []).filter((id) => game.crewA[id] && game.crewA[id].inside && crewTarget(id) === "home");
  if (!atHome.length) {
    const who = (b.home || []).map((id) => crewName(id)).join(" e ");
    say([["", `Toc, toc... Ninguém em casa. ${who} ${b.home.length > 1 ? "saíram" : "saiu"}.`]]);
    return true;
  }
  const id = atHome[0];
  const late = currentHour() >= 22 || currentHour() < 6;
  say(
    [
      ["", "Toc, toc..."],
      [crewName(id), late ? "*abre a porta de pijama* ...Sabe que horas são? Tá, entra rapidinho." : pickOne(["Oi! Entra, a casa é sua.", "Que surpresa boa! Quer um chá?", "Ah, é você! Pode entrar."])],
    ],
    () => {
      game.pieAnchor = { x: b.door[0], y: b.y + b.h - 1 };
      socialMenu(id);
    },
  );
  return true;
}
/** Clínica da Júlia: cuidar dos mascotes e adotar. */
function vetMenu() {
  const pet = typeof activePet === "function" ? activePet() : null;
  choice("Clínica Veterinária da Júlia", '"Bem-vindo! Aqui todo bicho é tratado como da família."', [
    {
      t: pet ? `Consulta para ${pet.name} (${withTax(15)} ouro)` : "Consulta (você não tem mascote)",
      icon: "paw",
      fn: () => {
        if (!pet) return say([["Júlia Oliveira", "Sem bichinho? Passa no Abrigo dos Bichos, no mercado. Todos precisam de um lar!"]]);
        if (player.gold < withTax(15)) return say([["Júlia Oliveira", "A consulta é 15 de ouro. Mas se for urgente, eu atendo e você me paga depois."]]);
        payWithTax(15);
        pet.love = Math.min(100, (pet.love || 0) + 30);
        addFriendship("juliaO", 2);
        saveGame();
        say([["Júlia Oliveira", `${pet.name} está ótimo! Vacina em dia, pelo brilhando. Carinho do mascote +30.`]]);
      },
    },
    { t: "Adotar um bichinho", icon: "heart", fn: () => petShelter() },
    { t: "Conversar com a Júlia", icon: "chat", fn: () => socialMenu("juliaO") },
    { t: "Sair", fn: null },
  ]);
}

const _npcHiddenBase = npcHidden;
npcHidden = function (id) {
  if (CREW_ALL.includes(id)) return true;
  return _npcHiddenBase(id);
};
const CREW_BANTER = [
  [
    ["Lucas Marzocca", "Gente, conheci alguém incrível ontem!"],
    ["Matheus", "De novo? Esse mês já é a quinta."],
    ["Mylena", "Eu pinto o retrato dela se durar mais de uma semana. Até hoje não pintei nenhum."],
  ],
  [
    ["Andressa", "Ouvi dizer que tem gente nova rondando a fronteira. Fiquem atentos."],
    ["General Marcos", "Já dobrei a guarda do portão. Obrigado pela informação, Andressa."],
    ["Lucas Marzocca", "Eu dobro a festa, então. Cada um faz o que sabe."],
  ],
  [
    ["Mylena", "Proposta: um quadro de nós cinco para o castelo!"],
    ["Andressa", "Desde que eu saia de óculos e misteriosa."],
    ["Matheus", "E eu de chapéu. Sem o chapéu ninguém me reconhece."],
    ["General Marcos", "Eu posso ficar no meio. Eu sou o maior."],
  ],
];
function crewGroupMenu() {
  const lines = CREW_BANTER[Math.floor(Math.random() * CREW_BANTER.length)];
  choice("A turma de Cinzaluz", "Lucas, Matheus, Marcos, Andressa e Mylena conversam na fonte.", [
    {
      t: "Entrar na conversa",
      fn: () => {
        for (const id of CREW) addFriendship(id, player.famDay["turma"] === player.day ? 0 : 2);
        player.famDay["turma"] = player.day;
        if (typeof addNeed === "function") addNeed("fun", 15);
        say(lines);
      },
    },
    ...CREW.map((id) => ({ t: `Falar só com ${crewName(id)}`, fn: () => socialMenu(id) })),
    { t: "Sair", fn: null },
  ]);
}
function crewDrawList(list, t) {
  if (player.zone !== "vila" || !game.crewA) return;
  const gather = crewGathering();
  for (const a of Object.values(game.crewA)) {
    if (!crewVisible(a)) continue;
    const n = NPCS[a.id];
    const moving = Math.abs(a.rx - a.x) + Math.abs(a.ry - a.y) > 0.05;
    const i = CREW_ALL.indexOf(a.id);
    let dir = a.dir;
    if (!moving && gather && CREW.includes(a.id)) dir = a.x < 31 ? "right" : a.x > 31 ? "left" : "down";
    if (!moving && Math.abs(a.x - player.x) + Math.abs(a.y - player.y) <= 2)
      dir = Math.abs(player.x - a.x) >= Math.abs(player.y - a.y) ? (player.x > a.x ? "right" : "left") : player.y > a.y ? "down" : "up";
    list.push({
      y: a.ry,
      draw: () => {
        const X = a.rx * TILE,
          Y = a.ry * TILE + (moving ? Math.abs(Math.sin(t * 12)) * -1.5 : Math.sin(t * 2 + i) * 0.5);
        ctx.fillStyle = "rgba(0,0,0,.22)";
        ctx.beginPath();
        ctx.ellipse(X + 16, a.ry * TILE + 30, 8, 3, 0, 0, 7);
        ctx.fill();
        drawSprite(wizardRects(n.robe, n.hat, n.hair, null, dir, walkFrame(moving, t)), X, Y, 2, dir === "left");
        if (!moving && Math.sin(t * 0.8 + i * 1.7) > 0.82) drawPixelIcon(["laugh", "chat", "heart", "note", "party", "smile"][i % 6], X + 16, Y - 8, 2);
      },
    });
  }
}

/* ===================== PAPÉIS NA HISTÓRIA ===================== */

/** A turma ajuda na batalha final se você for amigo dos cinco (e não tiver virado vilão). */
function crewReady() {
  return CREW.every((id) => friendshipLevel(id) >= 1) && !(possessedCount() >= 2);
}
/** Opções especiais de cada um no menu de interação. */
function crewItems(id) {
  if (!CREW.includes(id)) return [];
  const once = (k) => {
    if (player.famDay[id + k] === player.day) return false;
    player.famDay[id + k] = player.day;
    return true;
  };
  const items = [];
  if (id === "andressa")
    items.push({
      t: `Pedir informações de segurança (${friendshipLevel("andressa") >= 2 ? "grátis" : withTax(20) + " ouro"})`,
      fn: () => {
        if (friendshipLevel("andressa") < 2) {
          if (player.gold < withTax(20)) return say([["Andressa", "Informação boa custa. Volte com 20 de ouro."]]);
          payWithTax(20);
        }
        say([["Andressa", andressaIntel()]]);
      },
    });
  if (id === "marcos")
    items.push({
      t: "Treinar com o General (+vida máxima)",
      fn: () => {
        if (!once("treino")) return say([["General Marcos", "Já treinamos hoje. Músculo cresce no descanso, recruta."]]);
        const gain = (player.marcosTrain || 0) < 10 ? 5 : 0;
        player.marcosTrain = (player.marcosTrain || 0) + (gain ? 1 : 0);
        player.basehp += gain;
        player.hp = maxHp();
        addFriendship("marcos", 3);
        if (typeof addNeed === "function") addNeed("energy", -15);
        player.clock = Math.min(1439, player.clock + 60);
        game.fade = 1;
        saveGame();
        say([["General Marcos", gain ? "Cem flexões, cinquenta agachamentos e uma corrida até o castelo. +5 de vida máxima!" : "Você já está no auge, soldado. Agora é manter."]]);
      },
    });
  if (id === "mylena")
    items.push({ t: "Visitar o Ateliê (quadros e móveis)", fn: () => openShop("atelie") });
  if (id === "matheus")
    items.push(
      {
        t: "Pegar uma cesta da fazenda",
        fn: () => {
          if (!once("cesta")) return say([["Matheus", "A cesta de hoje já foi! Amanhã tem mais, prometo."]]);
          addItem("pao", 2);
          addItem("maca", 2);
          addItem("queijo");
          addFriendship("matheus", 2);
          saveGame();
          say([["Matheus", "Pão da Malu, maçã do pé e queijo da vizinha. Leva, que fazendeiro não deixa amigo com fome!"]]);
        },
      },
      {
        t: "Ajudar na colheita (2h)",
        fn: () => {
          if (!once("colheita")) return say([["Matheus", "Já ajudou hoje. Vai descansar, que amanhã tem mais!"]]);
          passTime(2, "Você passa 2 horas colhendo com o Matheus e a Malu.");
          player.gold += 30;
          addItem("trigo", 3);
          addFriendship("matheus", 4);
          addFriendship("malu", 3);
          saveGame();
        },
      },
    );
  if (id === "lucas")
    items.push({
      t: "Ir para a festa com o Lucas",
      fn: () => {
        if (!once("festa")) return say([["Lucas Marzocca", "Calma! Festa demais até eu canso. ...Mentira, mas você cansa."]]);
        player.mp = maxMp();
        player.drunk = Math.min(110, (player.drunk || 0) + 20);
        if (typeof addNeed === "function") addNeed("fun", 35);
        player.clock = Math.min(1439, player.clock + 120);
        addFriendship("lucas", 4);
        game.fade = 1;
        saveGame();
        say([["", `Você vai para a festa com o Lucas. Ele some com ${LUCAS_DATES[Math.floor(Math.random() * LUCAS_DATES.length)]} na metade da noite. Mesmo assim, foi ótimo!`]]);
      },
    });
  return items;
}
/** O que a Andressa sabe: o próximo perigo e como vencê-lo. */
function andressaIntel() {
  if (lifeMode()) {
    const w = worldState();
    const war = KINGDOM_PAIRS.find(([a, b]) => atWar(a, b));
    return war
      ? `Fonte segura: ${KINGDOMS[war[0]].short} e ${KINGDOMS[war[1]].short} estão em guerra. Evite as estradas da fronteira e não carregue ouro demais.`
      : `As relações estão ${Object.values(w.rel).some((r) => r < 35) ? "tensas: alguém vai declarar guerra em breve" : "calmas por enquanto"}. E o Coletor Real passa às terças... brincadeira. Ou não.`;
  }
  const s = curStep();
  const tips = {
    ent: "O Ent teme a sua própria runa. Feitiço duplo dela, e ele cai.",
    serp: "A Serpente se regenera quando está fraca. Termine rápido.",
    grif: "O Grifo ataca duas vezes. Defenda quando a vida estiver baixa.",
    basil: "O Basilisco endurece a pele. Use a habilidade do seu elemento quando ele brilhar.",
    levi: "O Leviatã se cura no mar. Ataque com tudo, sem parar.",
    sile: "O Silenciador troca de fraqueza a cada três turnos: olhe a cor da máscara. E a turma pode te ajudar, se você for amigo de todos.",
  };
  return `${s.t}. ${tips[s.id] || s.d}`;
}
/** Lucas só conversa depois de ganhar um hidromel (uma vez por dia). */
function lucasGate() {
  if (player.famDay.lucasPaid === player.day) return false;
  choice("Lucas Marzocca", '"Opa! Conversa boa começa com um hidromel na mão, né?"', [
    {
      t: itemCount("hidromel") ? "Dar um Hidromel" : `Pagar um hidromel (${withTax(15)} ouro)`,
      fn: () => {
        if (itemCount("hidromel")) removeItem("hidromel");
        else {
          if (player.gold < withTax(15)) return say([["Lucas Marzocca", "Sem hidromel, sem papo. Mas sem rancor! Volta depois."]]);
          payWithTax(15);
        }
        player.famDay.lucasPaid = player.day;
        addFriendship("lucas", 3);
        socialMenu("lucas");
      },
    },
    { t: "Deixa pra lá", fn: null },
  ]);
  return true;
}

/* ===================== ATELIÊ DA MYLENA ===================== */

Object.assign(ITEMS, {
  m_retrato: { nome: "Retrato pintado pela Mylena", tipo: "movel", preco: 180, desc: "Móvel. Um retrato seu, com a cor que você merece." },
  m_paisagem: { nome: "Paisagem de Cinzaluz", tipo: "movel", preco: 140, desc: "Móvel. A fonte da praça ao pôr do sol." },
  m_farolq: { nome: "Quadro do Farol", tipo: "movel", preco: 140, desc: "Móvel. O Farol de Brisamar numa noite de tempestade." },
  m_poltrona: { nome: "Poltrona do Ateliê", tipo: "movel", preco: 200, desc: "Móvel. Pintada à mão, com almofada de veludo." },
});
SHOPS.atelie = {
  nome: "Ateliê da Mylena",
  sub: "Quadros e móveis feitos à mão",
  items: ["m_retrato", "m_paisagem", "m_farolq", "m_poltrona", "m_quadro", "m_flores", "m_vela"],
};
for (const k of ["m_retrato", "m_paisagem", "m_farolq"]) ITEM_ICONS[k] = "book";
ITEM_ICONS.m_poltrona = "chair";
const _drawFurnExtraBase = drawFurnExtra;
drawFurnExtra = function (f, t) {
  const X = f.x * TILE,
    Y = f.y * TILE;
  const c = (col, a, b, w, h) => {
    ctx.fillStyle = col;
    ctx.fillRect(X + a, Y + b, w, h);
  };
  const frame = (inner) => {
    c("#8a5a2e", 4, -6, 24, 22);
    c("#f2c14e", 5, -5, 22, 20);
    inner();
  };
  switch (f.id) {
    case "m_retrato":
      frame(() => {
        c("#5a3a7a", 7, -3, 18, 16);
        c(player.look.skin, 13, 0, 6, 6);
        c(player.look.hair, 12, -2, 8, 3);
        c(player.look.robe, 11, 6, 10, 7);
      });
      return true;
    case "m_paisagem":
      frame(() => {
        c("#ff9a5a", 7, -3, 18, 8);
        c("#6c8f4e", 7, 5, 18, 8);
        c("#3a78b0", 13, 6, 6, 4);
      });
      return true;
    case "m_farolq":
      frame(() => {
        c("#1a2440", 7, -3, 18, 16);
        c("#e8e4dc", 15, 0, 3, 10);
        c("#f2c14e", 14, -2, 5, 2);
        c("#3a78b0", 7, 9, 18, 4);
      });
      return true;
    case "m_poltrona":
      c("rgba(0,0,0,.22)", 3, 27, 26, 4);
      c("#8a2a5a", 4, 6, 24, 20);
      c("#c94a8b", 7, 12, 18, 10);
      c("#f2c14e", 4, 6, 24, 2);
      c("#5a3a22", 5, 26, 3, 4);
      c("#5a3a22", 24, 26, 3, 4);
      return true;
  }
  return _drawFurnExtraBase(f, t);
};

/* ======================================================================
   (antes: 23-contatos.js)
   ====================================================================== */

/**
 * ECOS DO ARCANO — 12-vila-amigos-e-contatos.js
 * Namorar e casar com QUALQUER pessoa (nos dois modos):
 *  - Moradores da rua e frequentadores da taverna: "Conhecer melhor" vira um contato fixo,
 *    com amizade, presentes, namoro e casamento, igual aos personagens principais.
 *  - Mural dos Corações (taverna e Quadro de Trabalhos): anúncios de gente procurando
 *    namoro ou casamento.
 */


const CONTACT_FAVS = ["flor", "doce", "mel", "livro", "perfume", "cha", "vinho", "maca", "bolo"];
const CONTACT_PERSONALITIES = ["gentil", "engracado", "aventureiro", "timido", "serio", "orgulhoso", "esperto", "sabio"];
const TOWN_LABEL = { vila: "de Cinzaluz", porto: "do Porto", serra: "da Serra" };
const CONTACT_LINES = {
  gentil: ["Que bom te ver! Seu dia foi bom?", "Trouxe um pão a mais hoje. Quer?"],
  engracado: ["Sabe o que o anão disse pro cavalo? Nada, cavalo não fala. Hahaha!", "Hoje eu tropecei na praça e fingi que era dança."],
  aventureiro: ["Um dia eu ainda atravesso o mar inteiro!", "Bora fazer algo diferente hoje?"],
  timido: ["*olha para o chão* ...Oi.", "E-eu estava pensando em você. Digo, no tempo. No clima."],
  serio: ["Trabalho primeiro, conversa depois. Mas fala.", "Gosto de gente que cumpre o que promete."],
  orgulhoso: ["Você de novo? ...Tá, pode falar.", "Meu cabelo hoje está impecável, reparou?"],
  esperto: ["Sabia que o Coletor Real erra as contas toda semana? Ninguém confere.", "Tenho uma ideia de negócio. Depois te conto."],
  sabio: ["Quem planta paciência colhe amigos.", "O tempo resolve muita coisa. O resto, a gente resolve."],
};

/** Cria (ou recria ao carregar o jogo) um contato como personagem completo. */
function defineContact(c) {
  NPCS[c.id] = {
    nome: `${c.nm}, ${TOWN_LABEL[c.zone] || "da região"}`,
    robe: c.robe,
    hat: c.hat ?? null,
    hair: c.hair,
    talk: () => [[c.nm, pickOne(CONTACT_LINES[c.ps] || CONTACT_LINES.gentil)]],
  };
  FRIENDS[c.id] = { fav: c.fav, r80: ["flor", 1] };
  PERSONALITIES[c.id] = c.ps;
  if (!ROMANCE.includes(c.id)) ROMANCE.push(c.id);
}
function restoreContacts() {
  for (const c of player.contacts || []) if (!NPCS[c.id]) defineContact(c);
}
/** Transforma alguém (morador, frequentador, anúncio) em contato. */
function registerContact(src, rel) {
  player.contacts = player.contacts || [];
  const existing = player.contacts.find((q) => q.nm === src.nm && q.zone === (src.zone || player.zone));
  if (existing) return existing.id;
  const id = "c" + Date.now().toString(36) + Math.floor(Math.random() * 99);
  const c = {
    id,
    nm: src.nm,
    zone: src.zone || (ZONES[player.zone].town ? player.zone : "vila"),
    robe: src.robe,
    hat: src.hat ?? null,
    hair: src.hair,
    ps: src.ps || pickOne(CONTACT_PERSONALITIES),
    fav: pickOne(CONTACT_FAVS),
  };
  player.contacts.push(c);
  defineContact(c);
  player.rel[id] = rel ?? 15;
  saveGame();
  return id;
}
/** Contatos andam pela vila deles como moradores comuns. */
function addContactWalkers() {
  restoreContacts();
  for (const c of player.contacts || []) {
    if (c.zone !== player.zone || player.spouse === c.id) continue;
    if (!game.walkers || !game.walkers.length) return;
    const base = game.walkers[Math.floor(Math.random() * game.walkers.length)];
    game.walkers.push({ ...base, nm: c.nm, robe: c.robe, hat: c.hat, hair: c.hair, seed: undefined, elf: false, cid: c.id });
  }
}
/** Menu da rua: quem já é contato abre o menu completo; os outros ganham "Conhecer melhor". */
function walkerContactItems(wk) {
  return [
    {
      t: "Conhecer melhor ♥ (virar contato)",
      fn: () => {
        const id = registerContact({ nm: wk.nm, robe: wk.robe, hat: wk.hat, hair: wk.hair });
        wk.cid = id;
        wk.seed = undefined;
        say([[wk.nm, pickOne(["Prazer! A gente se vê por aí, então.", "Opa! Gostei de você. Vamos conversar mais vezes.", "Hm, interessante. Pode me procurar quando quiser."])]], () => socialMenu(id));
      },
    },
  ];
}
/** Frequentadores da taverna (e de outras lojas) também podem virar contato. */
function interiorPersonMenu(pe) {
  choice(pe.nm, "Está aproveitando a noite por aqui.", [
    { t: "Conversar", fn: () => say([[pe.nm, pe.guard ? "O castelo está seguro enquanto estivermos aqui." : pickUnheard("inter", WALKER_POOL)]]) },
    {
      t: "Conhecer melhor ♥ (virar contato)",
      fn: () => {
        const id = registerContact({ nm: pe.nm, robe: pe.robe, hat: pe.hat, hair: pe.hair, zone: game.inter && game.inter.zone ? game.inter.zone : "vila" });
        say([[pe.nm, "Senta aqui! Vamos tomar uma e conversar direito."]], () => socialMenu(id));
      },
    },
    { t: "Sair", fn: null },
  ]);
}

/* ===================== MURAL DOS CORAÇÕES ===================== */

/** Anúncios do dia: sempre os mesmos durante o dia, mudam todo dia. */
function heartBoardAds() {
  const R = rng(player.day * 7919 + 13);
  const pick = (a) => a[Math.floor(R() * a.length)];
  const robes = ["#8a3a3a", "#3a6a8a", "#5a7a3a", "#8a6a2a", "#6a3a7a", "#c97a8a", "#4a4a7a"],
    hairs = ["#3a2414", "#d9a441", "#1a1a1a", "#8a3a1a", "#d9d9d9"];
  const texts = {
    namoro: ["Procuro alguém para ver o pôr do sol no farol.", "Busco companhia para os festivais. Danço mal, mas danço.", "Quero alguém que ria das minhas piadas. São poucas."],
    casamento: ["Procuro alguém sério para formar família. Tenho uma horta e muito amor.", "Viúvo(a), coração grande, procura casamento de verdade.", "Busco alguém trabalhador e honesto para casar no Templo."],
  };
  return [0, 1, 2, 3, 4].map((i) => {
    const want = R() < 0.55 ? "namoro" : "casamento";
    return {
      i,
      nm: pick(WALKER_NAMES),
      zone: pick(["vila", "vila", "porto", "serra"]),
      age: 19 + Math.floor(R() * 40),
      ps: pick(CONTACT_PERSONALITIES),
      want,
      text: pick(texts[want]),
      robe: pick(robes),
      hair: pick(hairs),
      hat: null,
    };
  });
}
function heartBoardMenu() {
  const answered = player.famDay.mural === player.day ? player.muralAnswered || [] : [];
  const ads = heartBoardAds().filter((a) => !answered.includes(a.i));
  if (!ads.length) return say([["", "O mural está vazio hoje. Volte amanhã: sempre aparecem anúncios novos."]]);
  choice(
    "Mural dos Corações",
    "Bilhetes presos com alfinete. Responda um e marque um primeiro encontro.",
    ads
      .map((a) => ({
        t: `${a.nm}, ${a.age} anos ${TOWN_LABEL[a.zone]} · procura ${a.want}: "${a.text}"`,
        icon: a.want === "casamento" ? "ring" : "heart",
        fn: () => answerAd(a),
      }))
      .concat([{ t: "Sair", fn: null }]),
  );
}
function answerAd(a) {
  if (player.famDay.mural !== player.day) {
    player.famDay.mural = player.day;
    player.muralAnswered = [];
  }
  player.muralAnswered.push(a.i);
  if (a.want === "casamento" && player.spouse && !openRelationship())
    return say([["", `Você responde, mas ${a.nm} lê sua carta e diz: "Casado(a)? Procuro alguém livre." Que vergonha!`]]);
  const id = registerContact(a, a.want === "casamento" ? 45 : 32);
  addFriendship(id, 6);
  player.clock = Math.min(1439, player.clock + 90);
  game.fade = 1;
  saveGame();
  say(
    [
      ["", `Primeiro encontro com ${a.nm} na taverna.`],
      [a.nm, a.want === "casamento" ? "Eu quero algo sério. Se você também quer, me procure de novo." : "Foi divertido! Vamos repetir?"],
      ["", `${a.nm} agora é seu contato. Ela(e) mora ${TOWN_LABEL[a.zone]}: procure pela rua para conversar, namorar e, quem sabe, casar.`],
    ],
    () => socialMenu(id),
  );
}
