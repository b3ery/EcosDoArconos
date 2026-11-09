/* 16-vilao-e-missoes.js: junta 22-vilao.js, 28-missoes-farol-mina.js. */
/**
 * ECOS DO ARCANO — 16-vilao-e-missoes.js
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

/* ======================================================================
   (antes: 28-missoes-farol-mina.js)
   ====================================================================== */

/**
 * ECOS DO ARCANO — 16-vilao-e-missoes.js
 * Missões nos dois modos:
 *  - Desabamento na Mina (Mina de Cristal, Pedravale): três mineiros presos lá no fundo.
 *    Ache cada um, cave e tire de lá.
 *  - A Lente Rachada (Farol de Brisamar, Porto): a Faroleira Lúcia precisa de cristais e
 *    minério da mina para consertar a lente. Acenda o farol à noite e salve um navio.
 *    Depois, dá para fazer a vigia da noite no farol (uma vez por dia).
 */


const TRAPPED_NAMES = ["Bruno Picareta", "Dona Ilsa", "Tito Lamparina"];
function mineQ() {
  player.q = player.q || {};
  return player.q.mina || null;
}
function lightQ() {
  player.q = player.q || {};
  return player.q.farol || null;
}

/* ===================== DESABAMENTO NA MINA ===================== */

/** Três lugares fundos e longe da entrada, sempre os mesmos. */
function trappedSpots() {
  const z = ZONES.mina;
  const o = z.open.n;
  const cands = [];
  for (let y = 2; y < z.h - 1; y++)
    for (let x = 1; x < z.w - 1; x++) {
      if (z.map[y][x] !== ".") continue;
      const d = Math.abs(x - o[0]) + Math.abs(y - o[1]);
      if (d > 16) cands.push([x, y, d]);
    }
  cands.sort((a, b) => b[2] - a[2] || a[0] - b[0]);
  const out = [];
  for (const c of cands) {
    if (out.every((q) => Math.abs(q[0] - c[0]) + Math.abs(q[1] - c[1]) > 9)) out.push(c);
    if (out.length === 3) break;
  }
  return out;
}
function mineQuestEnter() {
  let q = mineQ();
  if (!q) {
    q = player.q.mina = { st: 1, saved: [] };
    saveGame();
    say([
      ["Anão Gorim", "Você chegou na hora! Teve um desabamento lá no fundo da mina!"],
      ["Anão Gorim", `Três dos meus estão presos: ${TRAPPED_NAMES.join(", ")}. Eu não passo mais por aqueles túneis... meus joelhos.`],
      ["Anão Gorim", "Ache cada um e aperte E para cavar e tirar de lá. Siga a seta. Se trouxer os três, a mina inteira fica te devendo!"],
    ]);
  }
  if (q.st !== 1) return (game.trapped = []);
  game.trapped = trappedSpots()
    .map(([x, y], i) => ({ x, y, i, nm: TRAPPED_NAMES[i] }))
    .filter((t) => !q.saved.includes(t.i));
}
const _enterMineBase = enterMine;
enterMine = function () {
  _enterMineBase();
  setTimeout(mineQuestEnter, player.flags.minaQuestSeen ? 50 : 900);
  player.flags.minaQuestSeen = true;
};
function trappedAt(x, y) {
  return player.zone === "mina" ? (game.trapped || []).find((t) => t.x === x && t.y === y) : null;
}
function rescueMiner(t) {
  const q = mineQ();
  q.saved.push(t.i);
  game.trapped = game.trapped.filter((o) => o !== t);
  player.clock = Math.min(1439, player.clock + 30);
  game.shake = 0.25;
  playSound(220, 0.15, "square");
  setTimeout(() => playSound(660, 0.15, "sine"), 200);
  if (lifeMode()) addNeed("energy", -8);
  const left = 3 - q.saved.length;
  if (left > 0) {
    saveGame();
    return say([
      ["", "Você tira as pedras uma a uma até abrir um buraco..."],
      [t.nm, pickOne(["Luz! LUZ! Achei que ia virar fóssil aqui!", "Ufa! Obrigado! Minhas pernas estão dormentes, mas eu acho a saída.", "Você é um anjo de capacete! Vou avisar o Gorim."])],
      ["", `${t.nm} foi resgatado. Faltam ${left}.`],
    ]);
  }
  q.st = 2;
  player.gold += 160;
  addItem("pocaoG", 2);
  addItem("cristal", 2);
  repAdd(6);
  saveGame();
  say([
    [t.nm, "Você achou todo mundo?! Vamos sair daqui antes que caia mais pedra!"],
    ["Anão Gorim", "Os três vivos! Pedravale nunca vai esquecer isso. Tome: ouro, poções e os melhores cristais da semana."],
    ["", "Missão concluída: Desabamento na Mina! +160 ouro, 2 Grandes Poções, 2 Cristais Sombrios e reputação +6."],
  ]);
}

/* ===================== A LENTE RACHADA DO FAROL ===================== */

const LENS_NEED = [
  ["cristal", 3],
  ["minerio", 2],
];
function lighthouseDoor(b) {
  if (!b || b.name !== "Farol de Brisamar") return false;
  let q = lightQ();
  if (!q) {
    q = player.q.farol = { st: 1 };
    saveGame();
    say([
      ["Faroleira Lúcia", "Ah, uma visita! Desculpe a bagunça. A lente do farol rachou na última tempestade."],
      ["Faroleira Lúcia", "Sem luz, os navios batem nas pedras. Para consertar preciso de 3 Cristais Sombrios e 2 Minérios de Ferro. Tudo isso sai da Mina de Cristal, em Pedravale."],
      ["Faroleira Lúcia", "Traga tudo e volte à noite: a lente só pode ser acesa depois que escurece."],
    ]);
    return true;
  }
  if (q.st === 1) {
    const miss = LENS_NEED.filter(([id, n]) => itemCount(id) < n).map(([id, n]) => `${n - itemCount(id)}× ${ITEMS[id].nome}`);
    if (miss.length) return say([["Faroleira Lúcia", `Ainda falta: ${miss.join(" e ")}. A mina de Pedravale tem tudo!`]]), true;
    if (!isNight()) return say([["Faroleira Lúcia", "Você trouxe tudo! Agora espere escurecer (depois das 19h) e suba comigo. Tecla H para esperar."]]), true;
    for (const [id, n] of LENS_NEED) for (let i = 0; i < n; i++) removeItem(id);
    q.st = 2;
    player.gold += 200;
    addItem("eterG", 2);
    repAdd(8);
    game.flash = 1;
    playSound(523, 0.4, "sine");
    setTimeout(() => playSound(784, 0.5, "sine"), 300);
    saveGame();
    say([
      ["", "Vocês sobem os 120 degraus. Lúcia encaixa os cristais na lente e você acende o pavio."],
      ["", "Um feixe de luz enorme corta a noite. Lá longe, um navio mercante desvia das pedras no último segundo."],
      ["Capitão do navio", "*grita do convés* OBRIGADO, FAROL! Esta noite a cerveja é por nossa conta!"],
      ["Faroleira Lúcia", "Você salvou aquela gente. Tome, é tudo que eu juntei. E volte quando quiser fazer a vigia comigo."],
      ["", "Missão concluída: A Lente Rachada! +200 ouro, 2 Grandes Essências e reputação +8."],
    ]);
    return true;
  }
  // Depois de consertado: vigia da noite, uma vez por dia.
  choice("Farol de Brisamar", "A luz gira devagar sobre o mar. A Faroleira Lúcia acena lá de cima.", [
    {
      t: isNight() ? "Fazer a vigia da noite com a Lúcia" : "Vigia da noite (só depois das 19h)",
      icon: "eye",
      fn: () => {
        if (!isNight()) return say([["Faroleira Lúcia", "A vigia é à noite! Volte depois que escurecer."]]);
        if (player.famDay.vigia === player.day) return say([["Faroleira Lúcia", "Você já fez a vigia hoje. Vá descansar!"]]);
        player.famDay.vigia = player.day;
        player.clock = Math.min(1439, player.clock + 180);
        game.fade = 1;
        const ship = Math.random() < 0.5;
        const pay = ship ? 70 : 35;
        player.gold += pay;
        if (lifeMode()) {
          addNeed("energy", -15);
          addNeed("fun", 10);
        } else player.stamina = Math.max(0, (player.stamina ?? 100) - 10);
        saveGame();
        say([
          ["", "Três horas olhando o mar, girando a lente e contando estrelas."],
          ship ? ["", `Um barco de pesca se perdeu na neblina e achou o caminho pela luz. O dono pagou ${pay} de ouro de gratidão!`] : ["", `Noite calma. A Lúcia te paga ${pay} de ouro pela vigia.`],
        ]);
      },
    },
    { t: "Sair", fn: null },
  ]);
  return true;
}

/* ===================== GANCHOS ===================== */

function questLabel(x, y) {
  const t = trappedAt(x, y);
  return t ? `Cavar e resgatar ${t.nm}` : null;
}
function questInteract(x, y) {
  const t = trappedAt(x, y);
  if (!t) return false;
  rescueMiner(t);
  return true;
}
/** Para a seta de missão: o mineiro preso mais perto. */
function trappedTarget() {
  if (player.zone !== "mina" || !(game.trapped || []).length) return null;
  return game.trapped.slice().sort((a, b) => Math.abs(a.x - player.x) + Math.abs(a.y - player.y) - (Math.abs(b.x - player.x) + Math.abs(b.y - player.y)))[0];
}
function questDrawList(list, t) {
  if (player.zone !== "mina") return;
  for (const m of game.trapped || []) {
    list.push({
      y: m.y,
      draw: () => {
        const X = m.x * TILE,
          Y = m.y * TILE;
        // Pedras caídas em volta.
        ctx.fillStyle = "#5a5560";
        ctx.fillRect(X - 6, Y + 18, 14, 12);
        ctx.fillRect(X + 24, Y + 14, 14, 16);
        ctx.fillStyle = "#7a7480";
        ctx.fillRect(X - 4, Y + 18, 8, 4);
        ctx.fillRect(X + 26, Y + 14, 8, 4);
        drawSprite(wizardRects("#6a5a3a", "#c9a03a", "#3a2414", null, "down", 0, 77 + m.i), X, Y + Math.sin(t * 3 + m.i) * 0.8, 2);
        drawPixelIcon("sweat", X + 16, Y - 6 - Math.abs(Math.sin(t * 4)) * 3, 2);
      },
    });
  }
}
