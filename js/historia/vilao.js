/**
 * ECOS DO ARCANO — vilao.js
 * Caminho do vilão (modo História), do começo ao fim:
 *  - Escolhas em todos os momentos da história (treino, mercado, Odelia, Porto,
 *    Farol, Pedravale, Mina, Forja e cada Guardião): herói ou vilão.
 *  - Toda escolha mexe na reputação. O medidor "Caminho" aparece no HUD.
 *  - No fim, quem seguiu o caminho do vilão pode se aliar ao Silenciador
 *    ou tomar a Canção Arcana para si e conquistar o mundo.
 */

"use strict";

const GUARDIAN_TYPES = ["ent", "serpente", "grifo", "basilisco", "leviata"];

/** Depois de vencer um Guardião: libertar ou possuir? */
function guardianChoice(enemy, type) {
  if (!GUARDIAN_TYPES.includes(type)) return rewardGuardian(enemy, type);
  choice(
    `${enemy.nome} está de joelhos`,
    "A runa pulsa no peito do Guardião. Você pode libertá-lo... ou arrancar o poder dele para você.",
    [
      {
        t: "Libertar o Guardião (herói)",
        icon: "heart",
        fn: () => {
          player.heroPts = (player.heroPts || 0) + 1;
          repAdd(5);
          toast(`Reputação +5 · Caminho: ${moralLabel().n}`, 2400);
          rewardGuardian(enemy, type);
        },
      },
      { t: "Possuir o poder dele à força (vilão)", icon: "skull", fn: () => possessGuardian(enemy, type) },
    ],
  );
}
function possessGuardian(enemy, type) {
  player.guards.push(player.zone);
  if (enemy.rune && !player.runes.includes(enemy.rune)) player.runes.push(enemy.rune);
  player.villain = (player.villain || 0) + 1;
  player.possessed = possessedCount() + 1;
  player.darkPower = Math.min(0.5, (player.darkPower || 0) + 0.1);
  repAdd(-12);
  game.flash = 1;
  game.shake = 0.5;
  playSound(110, 0.5, "sawtooth");
  saveGame();
  const lines = [
    ["", `Você crava a mão no peito de ${enemy.nome} e arranca a runa à força. O Guardião vira pó escuro.`],
    ["", enemy.rune ? `Você tomou a Runa ${RUNE_OF[enemy.rune]}. Sua magia ficou mais forte (+10%)... e mais fria.` : "O poder dele agora é seu. Sua magia ficou mais forte (+10%)."],
    ["", "A vila vai saber disso. Reputação −12."],
  ];
  if (player.possessed === 1) lines.push(["Arquimaga Odelia (eco)", "...Não. Não faça como ele fez. Por favor."]);
  if (player.possessed === 2) lines.push(["", "Lucas, Matheus, Marcos, Andressa e Mylena ouviram o que você fez. A turma não vai mais lutar ao seu lado."]);
  if (player.runes.length === 4) lines.push(["", "Ao longe, ao sul de Cinzaluz, algo se rompe com um estalo."]);
  say(lines, saveGame);
}

/* ===================== FINAL DO VILÃO ===================== */

/** Antes da última luta: se você já foi vilão, o Silenciador oferece aliança. */
function silencerMeeting(start) {
  if (!darkPath()) return start();
  say(
    [
      ["O Silenciador", possessedCount() ? "Eu senti você arrancando as runas dos Guardiões. Você é como eu." : "Eu vi o que você fez pelo caminho. Roubou, mentiu, ameaçou. Você é como eu."],
      ["O Silenciador", "Por que lutar? Junte-se a mim. Com as runas nas nossas mãos, os reinos vão se ajoelhar."],
    ],
    () =>
      choice("A oferta do Silenciador", "Seu coração bate no ritmo de uma canção sombria.", [
        { t: "Recusar e lutar (salvar o mundo)", icon: "heart", fn: start },
        { t: "Aliar-se a ele e conquistar o mundo", icon: "skull", fn: () => villainEnding("alianca") },
      ]),
  );
}
/** Depois de vencer o Silenciador: libertar Vesper ou tomar a Canção para si. */
function silencerDefeated(heroic) {
  if (!darkPath()) return heroic();
  choice("O Silenciador caiu", "A Canção Arcana está ao alcance da sua mão. Ninguém mais pode impedir você.", [
    { t: "Ler o diário e libertar Vesper (herói)", icon: "heart", fn: heroic },
    { t: "Tomar a Canção Arcana para você (vilão)", icon: "skull", fn: () => villainEnding("trono") },
  ]);
}
const VILLAIN_FINALES = {
  alianca: [
    ["", "Você estende a mão. O Silenciador sorri pela primeira vez em trezentos anos."],
    ["O Silenciador", "Juntos, então. Que o mundo inteiro aprenda o que é silêncio."],
    ["Narrador", "Os dois descem da Torre lado a lado. Em Cinzaluz, Odelia fecha os olhos e chora em silêncio."],
    ["Narrador", "Em um ano, os três reinos se rendem. A Canção Arcana passa a tocar só para os dois."],
  ],
  trono: [
    ["", "Você pisa sobre a máscara partida e ergue as seis runas."],
    ["Vesper", "Não... Você vai fazer o mesmo que eu fiz... só que pior."],
    ["Você", "Eu não vou guardar a magia. Vou usá-la. Toda ela. Para mim."],
    ["Narrador", "A Canção Arcana dobra os joelhos dos reis. Aurélia, Marés e Pedravale juram lealdade ao novo soberano das runas."],
    ["Narrador", "Dizem que, nas noites frias, ainda se ouve uma irmã chamando o nome do irmão. Mas ninguém mais tem coragem de responder."],
  ],
};
function villainEnding(kind) {
  if (battle) endBattle();
  byId("choice").style.display = "none";
  hidePie();
  player.villainEnd = kind;
  player.finished = true;
  saveGame();
  game.flash = 1;
  playSound(98, 0.8, "sawtooth");
  say(VILLAIN_FINALES[kind], () => setTimeout(showEnd, 800));
}

/* ===================== ESCOLHAS AO LONGO DA HISTÓRIA ===================== */

function possessedCount() {
  if (player.possessed == null) player.possessed = Math.min(player.villain || 0, (player.guards || []).length);
  return player.possessed;
}
/** Seguiu o caminho do vilão a ponto de o Silenciador oferecer aliança? */
function darkPath() {
  return possessedCount() >= 1 || (player.villain || 0) >= 3;
}
/** Nome do caminho, para o HUD e o fim do jogo. */
function moralLabel() {
  const v = player.villain || 0,
    h = player.heroPts || 0;
  if (!v && !h) return null;
  const d = h - v;
  if (v >= 6 && d <= -4) return { n: "Tirano", c: "#ff5a5a", icon: "skull" };
  if (d <= -1) return { n: "Vilão", c: "#ff7a7a", icon: "skull" };
  if (d < 1) return { n: "Dividido", c: "#d9b8ff", icon: "meh" };
  if (d >= 6) return { n: "Herói lendário", c: "#f2c14e", icon: "crown" };
  return { n: "Herói", c: "#7ad36b", icon: "heart" };
}

/** Escolha herói/vilão: cada uma mexe na reputação e no poder. */
const MORAL = {
  juramento: {
    title: "Kael te olha nos olhos",
    text: "\"Antes de você sair por aí com magia nas mãos: por que você quer ficar forte?\"",
    hero: {
      t: "Para proteger Cinzaluz e quem eu amo",
      rep: 4,
      lines: [["Instrutor Kael", "Boa resposta. Força que protege dura. Força que machuca acaba sozinha."]],
    },
    villain: {
      t: "Para que ninguém nunca mais mande em mim",
      rep: -4,
      dark: 0.03,
      lines: [
        ["Instrutor Kael", "...Hm. Eu já ouvi isso antes. De um aluno que nunca voltou."],
        ["", "Kael vai ficar de olho em você. Reputação −4, mas sua magia sente uma ponta de frieza (+3%)."],
      ],
    },
  },
  odelia2: {
    title: "A primeira runa volta",
    text: "Odelia estende a mão para tocar a runa. Ela quer sentir se está tudo bem.",
    hero: { t: "Deixar Odelia examinar a runa", rep: 3, fx: () => (player.mp = maxMp()), lines: [["Arquimaga Odelia", "Está limpa. Obrigada por confiar em mim. (MP cheio)"]] },
    villain: {
      t: "Esconder a runa (ela é minha agora)",
      rep: -5,
      dark: 0.03,
      lines: [
        ["Arquimaga Odelia", "*recolhe a mão devagar* ...Entendo. Vesper também não deixava ninguém tocar nas runas dele."],
        ["", "Odelia ficou desconfiada. A vila comenta. Reputação −5."],
      ],
    },
  },
  bento: {
    title: "O Capitão Bento hesita",
    text: "Ele contou do farol, mas os olhos dele desviam para um baú trancado atrás do balcão.",
    hero: { t: "Agradecer e respeitar o segredo dele", rep: 4, lines: [["Capitão Bento", "Você é gente boa. Volta aqui quando quiser, tem sempre um peixe pra você."]], fx: () => addItem("peixe") },
    villain: {
      t: "Ameaçar o capitão e abrir o baú",
      rep: -8,
      fx: () => (player.gold += 60),
      lines: [
        ["Capitão Bento", "Tá, tá! Leva! São as economias da minha tripulação... Some daqui."],
        ["", "Você pegou 60 de ouro. O porto inteiro vai saber. Reputação −8."],
      ],
    },
  },
  farol: {
    title: "A luz do farol",
    text: "No mar, um navio mercante se aproxima das pedras na escuridão. Se a lanterna apagar, ele bate... e a carga vem pra praia.",
    hero: {
      t: "Manter o farol aceso e guiar o navio",
      rep: 6,
      fx: () => (player.gold += 25),
      lines: [["", "O navio desvia das pedras. Os marinheiros acenam do convés e jogam um saquinho de moedas no cais. +25 ouro, reputação +6."]],
    },
    villain: {
      t: "Apagar o farol e saquear o naufrágio",
      rep: -12,
      dark: 0.04,
      fx: () => {
        player.gold += 120;
        addItem("hidromel", 2);
      },
      lines: [
        ["", "Um estalo, gritos, madeira partindo. Na manhã seguinte, caixotes boiam até a praia."],
        ["", "Você ficou com 120 de ouro e 2 hidroméis. Ninguém morreu, mas o porto chora a perda. Reputação −12."],
      ],
    },
  },
  odelia3: {
    title: "O segredo de Odelia",
    text: "Você viu no farol: Odelia e Vesper são irmãos. Ela ainda não sabe que você sabe.",
    hero: {
      t: "Contar com carinho o que viu",
      rep: 3,
      lines: [["Arquimaga Odelia", "*olhos marejados* ...Então o farol lembrou. Obrigada por me contar desse jeito."]],
    },
    villain: {
      t: "Chantagear: \"Ou me dá seu cajado, ou conto pra vila\"",
      rep: -8,
      dark: 0.04,
      fx: () => addItem("eterG", 2),
      lines: [
        ["Arquimaga Odelia", "*pálida* Você não teria coragem... *entrega duas Grandes Essências* Pegue. E saia."],
        ["", "Odelia nunca mais olhou para você do mesmo jeito. Reputação −8."],
      ],
    },
  },
  berta: {
    title: "A Anciã Berta",
    text: "Ela contou a história do cajado. Mas ainda segura um mapa antigo da mina contra o peito.",
    hero: { t: "Ouvir com respeito e pedir a bênção dela", rep: 4, fx: () => (player.blessDay = player.day), lines: [["Anciã Berta", "Vá com a bênção da serra, criança. (Abençoado hoje)"]] },
    villain: {
      t: "Arrancar o mapa da mão dela",
      rep: -9,
      fx: () => (player.clock = Math.max(0, player.clock - 60)),
      lines: [
        ["Anciã Berta", "Ai! Meu braço... Os anões vão saber disso."],
        ["", "Com o mapa, você acha a mina mais rápido. Mas Pedravale inteira viu. Reputação −9."],
      ],
    },
  },
  mina: {
    title: "O veio de cristal",
    text: "Ao lado do fragmento há um veio inteiro de cristais. Os mineiros de Pedravale passam fome há meses.",
    hero: { t: "Avisar os mineiros do veio", rep: 6, lines: [["", "Os mineiros comemoram e batem os capacetes. Pedravale vai ter pão o inverno todo. Reputação +6."]] },
    villain: {
      t: "Esconder o veio e levar os cristais",
      rep: -7,
      fx: () => addItem("cristal", 3),
      lines: [["", "Você enche a bolsa com 3 Cristais Sombrios e cobre o veio com pedras. Os mineiros vão continuar com fome. Reputação −7."]],
    },
  },
  forja: {
    title: "O molde de Vesper",
    text: "A forja ainda está quente. O metal derretido pode virar uma lembrança... ou uma arma.",
    hero: { t: "Deixar a forja com os anões (para a vila)", rep: 5, lines: [["Anciã Berta", "Esse molde volta a ser do povo. Você honra a serra."]] },
    villain: {
      t: "Forjar uma lâmina sombria para você",
      rep: -10,
      dark: 0.06,
      lines: [
        ["", "Você empurra os anões e despeja o metal num molde de lâmina. A runa de Vesper brilha roxa no aço."],
        ["", "Sua magia ficou +6% mais forte. Os anões juram nunca mais forjar para você. Reputação −10."],
      ],
    },
  },
  odelia4: {
    title: "A barreira caiu",
    text: "As quatro runas estão de volta. Odelia te pede para voltar viva(o) da Torre.",
    hero: { t: "Prometer voltar", rep: 4, fx: () => addItem("pocaoG", 2), lines: [["Arquimaga Odelia", "Leve isto. E cumpra a promessa. (2 Grandes Poções)"]] },
    villain: {
      t: "\"Quem vai voltar com a Canção sou eu\"",
      rep: -6,
      dark: 0.04,
      lines: [["Arquimaga Odelia", "...Então eu já perdi dois. Meu irmão e você."]],
    },
  },
};

function moralChoice(key, after) {
  const M = MORAL[key];
  if (!M || lifeMode() || (player.moral || {})[key]) return after && after();
  choice(M.title, M.text, [
    { t: M.hero.t + " (herói)", icon: "heart", fn: () => applyMoral(key, "hero", after) },
    { t: M.villain.t + " (vilão)", icon: "skull", fn: () => applyMoral(key, "villain", after) },
  ]);
}
function applyMoral(key, side, after) {
  const o = MORAL[key][side];
  player.moral = player.moral || {};
  player.moral[key] = side === "hero" ? "h" : "v";
  if (side === "hero") player.heroPts = (player.heroPts || 0) + 1;
  else player.villain = (player.villain || 0) + 1;
  if (o.dark) player.darkPower = Math.min(0.5, (player.darkPower || 0) + o.dark);
  if (o.rep) repAdd(o.rep);
  if (o.fx) o.fx();
  if (side === "villain") {
    game.shake = 0.25;
    playSound(110, 0.35, "sawtooth");
  } else playSound(784, 0.2, "sine");
  toast(`Reputação ${o.rep > 0 ? "+" : ""}${o.rep} · Caminho: ${moralLabel().n}`, 2600);
  saveGame();
  const extra = [];
  if (side === "villain" && player.villain === 3 && !possessedCount())
    extra.push(["", "Uma voz fria sussurra dentro da sua cabeça: \"Continue assim. Eu estou esperando você na Torre.\""]);
  say(o.lines.concat(extra), after);
}

/** Momento da história que acabou de acontecer: a escolha aparece quando o diálogo fecha. */
function queueMoral(key) {
  if (lifeMode() || (player.moral || {})[key]) return;
  game.pendingMoral = key;
}
function runPendingMoral() {
  const k = game.pendingMoral;
  if (!k || game.dialog || game.mode !== "world") return;
  game.pendingMoral = null;
  moralChoice(k);
}

/** No mercado do começo: comprar ou furtar da barraca. */
function moralItems(id) {
  if (lifeMode() || !["rosa", "bruno"].includes(id) || player.flags.bought || (player.moral || {}).mercado) return [];
  return [
    {
      t: "Furtar da barraca (vilão)",
      icon: "skull",
      fn: () => {
        player.moral = player.moral || {};
        player.moral.mercado = "v";
        player.villain = (player.villain || 0) + 1;
        player.flags.bought = true;
        if (id === "rosa") {
          addItem("pao", 2);
          addItem("agua", 2);
        } else addItem("pocao", 2);
        repAdd(-6);
        game.shake = 0.25;
        playSound(110, 0.3, "sawtooth");
        toast(`Reputação −6 · Caminho: ${moralLabel().n}`, 2600);
        saveGame();
        const nm = NPCS[id].nome.split(",")[0];
        say([
          ["", `Enquanto ${nm} se vira para o outro cliente, você enfia ${id === "rosa" ? "2 pães e 2 cantis" : "2 poções"} na bolsa.`],
          [nm, "Ei! EI! Ladrão! Alguém viu quem foi?!"],
          ["", "Ninguém te pegou... mas a vila vai comentar por dias. Reputação −6."],
        ]);
      },
    },
  ];
}

/** O povo reage a quem anda pelo caminho sombrio. */
function villainReaction() {
  if (game.dialog || game.mode !== "world") return;
  if (lifeMode() || player.zone !== "vila" || (player.villain || 0) < 3) return;
  if (player.famDay.vilaoAviso === player.day) return;
  player.famDay.vilaoAviso = player.day;
  if (Math.random() < 0.5) return;
  const fine = 15 + (player.villain || 0) * 5;
  choice("A Guarda Real te para", `"Recebemos queixas sobre você. Multa de ${fine} ouro, ou explica isso ao capitão."`, [
    {
      t: `Pagar a multa (${fine} ouro)`,
      icon: "coin",
      fn: () => {
        player.gold = Math.max(0, player.gold - fine);
        repAdd(1);
        saveGame();
        say([["Guarda Real", "Tá pago. Mas a gente fica de olho."]]);
      },
    },
    {
      t: "Intimidar o guarda (vilão)",
      icon: "skull",
      fn: () => {
        repAdd(-4);
        player.villain = (player.villain || 0) + 1;
        saveGame();
        say([
          ["Você", "Sabe o que aconteceu com o último Guardião que ficou no meu caminho?"],
          ["Guarda Real", "*engole seco* ...Pode passar. Hoje."],
          ["", "Reputação −4. A vila tem medo de você."],
        ]);
      },
    },
  ]);
}
