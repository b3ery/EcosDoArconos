/**
 * ECOS DO ARCANO — 38-turma-luca.js
 *  - Luca: careca, maluco, quebra a quarta parede. Às vezes aparece com o grupão.
 *  - Iluministas: Luca e Lucas Marzocca contra a monarquia; dá para entrar e convencer os outros.
 *  - Família real completa: Príncipe Pedro Max no desfile; Mylena é Princesa e Matheus é Duque.
 *  - Os pares do grupo (Malu, Julia, Pedro Max, Pedro Poeta, Rei Vini) agora conversam.
 *  - A turma trabalha DENTRO dos estabelecimentos (Biblioteca, Ateliê, Clínica, Castelo, Taverna).
 *  - Romance com qualquer adulto, mesmo sem coração de amizade (com chance menor).
 *  - Moradores puxam conversa sozinhos: elogiam, flertam, contam piada, pedem ajuda, dão presente.
 */

"use strict";

/* ===================== LUCA ===================== */

function lucaLines() {
  const h = new Date().getHours();
  const mob = matchMedia("(pointer:coarse)").matches;
  return [
    `Ei. EI. Você aí do outro lado da tela. É, você, que está controlando ${player.name}. Pisca duas vezes se estiver preso.`,
    "Eu sei que a gente vive num jogo. Os quadradinhos do chão são todos iguais. Ninguém repara, só eu.",
    `Lá fora, no seu mundo, são umas ${h} horas. Não é tarde pra ficar jogando, não? ...Brincadeira, fica.`,
    mob ? "Você tá jogando no celular, né? Sinto o seu dedão me cutucando." : "Para de apertar o E com tanta força. Eu sinto aqui do lado.",
    "O desenvolvedor esqueceu de desenhar o meu cabelo. Eu chamo isso de estilo.",
    "Se você salvar o jogo agora, eu continuo existindo? Ou eu viro um arquivo JSON? Que medo.",
    "Já percebeu que ninguém aqui vai ao banheiro? O Simulador de Vida mentiu pra você.",
    "Psiu. Aperta a tecla L. Tem um calendário inteiro lá. Ninguém me escuta, mas tem.",
    "A Rainha? Ela é só um monte de retângulos coloridos com coroa. Igual a todo rei. Viva o Iluminismo!",
    "Eu li o código-fonte deste mundo. Tem uma função chamada 'say'. É assim que eu falo com você agora.",
    "Quando você fecha o jogo, a gente fica todo mundo parado no escuro. A Andressa anota tudo.",
    "Me dá um ouro? Não? Tudo bem, eu vou num menu e pego. ...Mentira, não consigo. Ainda.",
  ];
}
NPCS.luca = {
  nome: "Luca, o Maluco",
  robe: CREW_LOOKS.luca.robe,
  hat: null,
  hair: CREW_LOOKS.luca.hair,
  talk: () => [["Luca", pickOne(lucaLines())]],
};
PERSONALITIES.luca = "aventureiro";
CREW_ALL.push("luca");

/* Pares e Luca: amizade, presentes e conversa. */
Object.assign(FRIENDS, {
  malu: FRIENDS.malu || { fav: "flor", r80: ["pocaoG", 2] },
  julia: FRIENDS.julia || { fav: "i_colar_de_perolas", r80: ["pocaoG", 2] },
  pedro: FRIENDS.pedro || { fav: "i_quadro_do_mar", r80: ["pocaoG", 2] },
  gabriel: FRIENDS.gabriel || { fav: "i_poemas_de_amor", r80: ["pocaoG", 2] },
  vini: FRIENDS.vini || { fav: "vinho", r80: ["pocaoG", 3] },
  luca: { fav: "hidromel", r80: ["i_mapa_do_tesouro", 1] },
});
for (const [id, ic] of Object.entries(FRIENDS)) if (!ITEMS[ic.fav]) ic.fav = "flor";
const NPC_MARRIED = { matheus: "malu", malu: "matheus", marcos: "julia", julia: "marcos", andressa: "gabriel", gabriel: "andressa", mylena: "pedro", pedro: "mylena", juliaO: "vini", vini: "juliaO" };

/* ===================== FAMÍLIA REAL ===================== */
{
  const prince = PARADE_MEM.find((m) => /Príncipe/.test(m.n));
  if (prince) Object.assign(prince, { n: "Príncipe Pedro Max", robe: CREW_LOOKS.pedro.robe, hat: null, hair: CREW_LOOKS.pedro.hair });
  const princess = PARADE_MEM.find((m) => /Princesa/.test(m.n));
  if (princess) Object.assign(princess, { n: "Princesa Mylena", robe: CREW_LOOKS.mylena.robe, hat: null, hair: CREW_LOOKS.mylena.hair });
  PARADE_MEM.splice(PARADE_MEM.length - 1, 0, { n: "Duque Matheus", robe: CREW_LOOKS.matheus.robe, hat: CREW_LOOKS.matheus.hat, hair: CREW_LOOKS.matheus.hair }, { n: "Duquesa Malu", robe: CREW_LOOKS.malu.robe, hat: null, hair: CREW_LOOKS.malu.hair, crown: 1 });
}

/* ===================== LUCA NA ROTINA ===================== */

const _crewTargetLuca = crewTarget;
crewTarget = function (id) {
  if (id !== "luca") return _crewTargetLuca(id);
  const h = currentHour();
  if (crewGathering() && player.day % 2 === 0) return [31, 24];
  if (h < 9 || h >= 23) return "home";
  if (h >= 20) return [17, 19];
  // Anda pela vila a esmo, trocando de lugar a cada hora.
  const spots = [
    [27, 26],
    [40, 22],
    [12, 24],
    [45, 13],
    [31, 36],
    [20, 30],
    [50, 26],
  ];
  return spots[(Math.floor(h) + player.day) % spots.length];
};

/* ===================== DENTRO DOS ESTABELECIMENTOS ===================== */

const WORKPLACES = {
  andressa: [[7, 14.5, "Biblioteca"]],
  gabriel: [
    [9, 13, "Biblioteca"],
    [19, 22, "Taverna Javali Dourado"],
  ],
  mylena: [[7, 14.5, "Ateliê da Mylena"]],
  juliaO: [[7, 14.5, "Clínica Veterinária da Júlia"]],
  marcos: [[9, 17, "Castelo de Cinzaluz"]],
  julia: [[8, 16, "Castelo de Cinzaluz"]],
  pedro: [[8, 17, "Castelo de Cinzaluz"]],
  malu: [[12, 17, "Castelo de Cinzaluz"]],
  lucas: [
    [18, 24, "Taverna Javali Dourado"],
    [0, 2, "Taverna Javali Dourado"],
  ],
  luca: [[21, 23, "Taverna Javali Dourado"]],
};
function workplaceOf(id) {
  if (player.zone !== "vila" && player.zone !== "interior") return null;
  if (CREW.includes(id) && crewGathering()) return null;
  if (id === "luca" && crewGathering() && player.day % 2 === 0) return null;
  if (["mylena", "andressa", "juliaO"].includes(id) && girlsCoffee()) return null;
  if (typeof aaMeeting === "function" && aaMeeting() && CREW.includes(id)) return "Taverna Javali Dourado";
  const h = currentHour();
  const r = (WORKPLACES[id] || []).find(([a, b]) => h >= a && h < b);
  return r ? r[2] : null;
}
function vilaBuilding(name) {
  return ZONES.vila.town.bld.find((b) => b.name === name);
}
const _crewTargetWork = crewTarget;
crewTarget = function (id) {
  return workplaceOf(id) ? "home" : _crewTargetWork(id);
};
const _crewHomeOfWork = crewHomeOf;
crewHomeOf = function (id) {
  const w = workplaceOf(id);
  return (w && vilaBuilding(w)) || _crewHomeOfWork(id);
};
/** Quem está trabalhando lá dentro aparece no interior do prédio. */
const _genInteriorWork = genInterior;
genInterior = function (b) {
  const z = _genInteriorWork(b);
  if (!game.inter || !b.name) return z;
  if (!game.crewA) crewInit();
  const taken = (x, y) => game.inter.people.some((p) => p.x === x && p.y === y) || game.inter.props.some((p) => p[1] === x && p[2] === y) || (x === game.inter.kx && y === game.inter.ky);
  const free = [];
  for (let y = 5; y < z.h - 2; y++) for (let x = 1; x < z.w - 1; x++) if (z.map[y][x] === "." && !taken(x, y) && Math.abs(x - z.town.arrive[0]) > 1) free.push([x, y]);
  for (const id of CREW_ALL) {
    if (workplaceOf(id) !== b.name || game.inter.people.some((p) => p.cid === id) || !free.length) continue;
    const [x, y] = free.splice(Math.floor(Math.random() * free.length), 1)[0];
    const L = CREW_LOOKS[id];
    game.inter.people.push({ x, y, robe: L.robe, hat: L.hat, hair: L.hair, nm: crewName(id), cid: id });
  }
  return z;
};
const _interiorPersonMenuWork = interiorPersonMenu;
interiorPersonMenu = function (pe) {
  if (pe && pe.cid && !pe.aa) {
    game.pieAnchor = { x: pe.x, y: pe.y };
    return socialMenu(pe.cid);
  }
  _interiorPersonMenuWork(pe);
  if (pe && pe.aa && pe.cid && game.mode === "choice") {
    const opts = game.choice;
    opts.splice(opts.length - 1, 0, { t: `Falar só com ${pe.nm}`, icon: "chat", fn: () => socialMenu(pe.cid) });
    choice(`Reunião dos ${GROUP_NAME}`, "A mesa do canto da taverna é deles.", opts);
  }
};
/* Ateliê e Clínica viram lugares de entrar, com balcão. */
Object.assign(KEEPERS, {
  atelie: ["Ajudante Bia", "#c94a8b", "#3a2414"],
  clinica: ["Enfermeira Nara", "#f2eee4", "#1a1a1a"],
});
ENTER_STYLES.add("atelie");
ENTER_STYLES.add("clinica");
const _bldServiceWork = bldService;
bldService = function (b) {
  if (b && b.id === "atelie") return openShop("atelie");
  if (b && b.id === "clinica") return vetMenu();
  return _bldServiceWork(b);
};
const _crewDoorWork = crewDoor;
crewDoor = function (b) {
  if (b && (b.id === "atelie" || b.id === "clinica")) {
    if (b.id === "atelie" && exhibitionToday() && !player.famDay.expo && currentHour() >= 7 && currentHour() < 17) return _crewDoorWork(b);
    const h = currentHour();
    if (h >= 7 && h < 19) {
      enterBuilding(b);
      return true;
    }
  }
  return _crewDoorWork(b);
};

/* ===================== ILUMINISTAS ===================== */

const ILUM_LINES = [
  [
    ["Lucas Marzocca", "Por que uma pessoa manda em todo mundo só porque nasceu numa cama mais cara?"],
    ["Luca", "Exato! A razão, meu amigo. A RAZÃO. E também o hidromel, mas principalmente a razão."],
  ],
  [
    ["Luca", "O Imposto Real paga a coroa da Rainha. A coroa da Rainha paga... mais coroa. É um ciclo."],
    ["Lucas Marzocca", "Liberdade, igualdade e festa toda sexta-feira. É o nosso lema."],
  ],
  [
    ["Lucas Marzocca", "A gente não quer guerra. A gente quer conselho do povo, escola pra todo mundo e taverna aberta até tarde."],
    ["Luca", "E eu quero que o jogador escolha. Sim, você aí. A decisão é sua, não da coroa."],
  ],
];
function ilumCount() {
  return Object.keys(player.ilumConv || {}).length;
}
function ilumItems(id) {
  if (id !== "lucas" && id !== "luca") return [];
  const items = [{ t: "Ouvir sobre o Iluminismo", icon: "book", fn: () => say(pickOne(ILUM_LINES)) }];
  if (!player.ilum)
    items.push({
      t: "Entrar para os Iluministas",
      icon: "flag",
      fn: () =>
        choice("Os Iluministas", "Lucas e Luca querem que o povo decida, não a coroa. Entrar no grupo deixa a Rainha desconfiada de você.", [
          {
            t: "Entrar (contra a monarquia)",
            icon: "flag",
            fn: () => {
              player.ilum = player.day;
              addFriendship("lucas", 8);
              addFriendship("luca", 8);
              if (FRIENDS.rainha) player.rel.rainha = Math.max(0, friendship("rainha") - 10);
              logEvent && logEvent("flag", "Entrou para os Iluministas.");
              saveGame();
              say([
                ["Luca", "Bem-vindo! Agora você é oficialmente um personagem com opinião. Raro neste jogo."],
                ["Lucas Marzocca", "Missão: convencer o povo. Use a opção Reino → Falar do Iluminismo com as pessoas. Cinco convertidos e a gente faz uma festa."],
              ]);
            },
          },
          { t: "Agora não", fn: null },
        ]),
    });
  else
    items.push({
      t: `Relatório iluminista (${ilumCount()} convencidos)`,
      icon: "scroll",
      fn: () =>
        say([
          ["Lucas Marzocca", ilumCount() >= 5 ? `${ilumCount()} pessoas pensando com a própria cabeça! A Rainha já ouviu falar de nós.` : `${ilumCount()} convencidos até agora. Bora, faltam ${5 - ilumCount()} para a festa!`],
          ["Luca", "Eu converti um gato ontem. Não contou. Burocracia."],
        ]),
    });
  return items;
}
const _crewItemsIlum = crewItems;
crewItems = function (id) {
  return ilumItems(id).concat(_crewItemsIlum(id));
};
ACHIEVEMENTS.push(["ilum", "Luzes da razão", "Convença 5 pessoas a virar iluministas.", "flag", () => ilumCount() >= 5]);
const _rainhaTalk = NPCS.rainha && NPCS.rainha.talk;
if (_rainhaTalk)
  NPCS.rainha.talk = function () {
    if (player.ilum && Math.random() < 0.4) return [["Rainha Aurélia", pickOne(["Me disseram que você anda com aqueles dois iluministas. Cuidado com as companhias, súdito.", "O Lucas e o Luca querem um conselho do povo? ...Talvez não seja tão má ideia. Não conte a ninguém que eu disse isso."])]];
    return _rainhaTalk.apply(this, arguments);
  };

/* ===================== ROMANCE COM QUALQUER ADULTO ===================== */

function isChildNpc(id) {
  return PERSONALITIES[id] === "crianca" || /criança|Pequeno|Menino|Menina/i.test((NPCS[id] && NPCS[id].nome) || "");
}
const _interReqOkRom = interReqOk;
interReqOk = function (req, id) {
  if (req === "romance") return !isChildNpc(id);
  return _interReqOkRom(req, id);
};
function askOut(id) {
  const n = NPCS[id].nome.split(",")[0];
  const married = NPC_MARRIED[id];
  if (married && married !== player.name) {
    if (friendship(id) >= 80 && Math.random() < 0.35) {
      player.lovers = player.lovers || [];
      player.lovers.push(id);
      saveGame();
      return say([[n, `Eu sou casad${PERSONALITIES[id] === "orgulhoso" ? "a" : "o"} com ${crewName(married)}... mas faz tempo que penso em você. Ninguém pode saber.`], ["", "Vocês começaram um romance secreto. Cuidado com quem está olhando!"]], () => witnessCheck(id));
    }
    addFriendship(id, -2);
    return say([[n, pickOne([`Ei, eu sou casad${["julia", "malu", "andressa", "mylena", "juliaO"].includes(id) ? "a" : "o"} com ${crewName(married)}! Fica de amizade, tá?`, "Que lisonjeiro... mas meu coração já tem dono."])]]);
  }
  const f = friendship(id);
  const chance = Math.max(0.08, Math.min(0.9, 0.12 + f / 110 + ((player.rep ?? 50) - 50) / 300));
  if (Math.random() < chance) {
    player.dating = id;
    player.datingSince = player.day;
    player.rel[id] = Math.max(f, 36);
    saveGame();
    playSound(784, 0.2, "sine");
    return say([[n, pickOne(["Sério? ...Eu também estava de olho em você. Sim!", "Achei que você nunca ia perguntar! Sim, vamos tentar.", "*cora inteiro* ...Tá bom. Sim."])], ["", "Vocês estão namorando! Para casar: amizade 75+ e um Anel de Compromisso."]]);
  }
  addFriendship(id, -3);
  return say([[n, pickOne(["A gente mal se conhece! Me conquista primeiro.", "Que coragem... mas não. Ainda não.", "Você é legal, mas não é bem assim. Vamos devagar."])], ["", `Chance era de ${Math.round(chance * 100)}%. Fique mais amigo(a) e tente de novo outro dia.`]]);
}
const _lifeSocialRom = lifeSocialItems;
lifeSocialItems = function (id) {
  const items = _lifeSocialRom(id);
  const origOffer = ROMANCE.includes(id) && !player.spouse && !player.dating && friendshipLevel(id) >= 2;
  if (!origOffer && !player.spouse && !player.dating && !isChildNpc(id) && !isRomanticWith(id) && id !== "rainha" && player.famDay["askOut" + id] !== player.day)
    items.push({
      t: "Convidar para namorar ♥ (arriscar)",
      icon: "heart",
      fn: () => {
        player.famDay["askOut" + id] = player.day;
        askOut(id);
      },
    });
  return items;
};

/* ===================== MORADORES PUXAM CONVERSA ===================== */

const NPC_INITS = {
  flerte: {
    w: 3,
    ok: (id) => !isChildNpc(id),
    text: (n) => pickOne([`${n} se aproxima, ajeita o cabelo e sorri: "Você sempre passa por aqui... ou é coincidência?"`, `${n} pisca para você: "Esse seu jeito de andar pela vila... tem algo de especial."`, `${n} chega pertinho: "Sabe que você fica bem nessa roupa?"`]),
    opts: (id, n) => [
      { t: "Flertar de volta ♥", icon: "heart", fn: () => (addFriendship(id, 5), playSound(880, 0.12, "sine"), say([[n, "*fica vermelho* ...A gente devia sair qualquer dia desses."]])) },
      { t: "Ficar sem graça", icon: "blush", fn: () => (addFriendship(id, 2), say([[n, "Ah, que fofo, ficou tímido! Hahaha."]])) },
      { t: "Cortar o clima", icon: "meh", fn: () => (addFriendship(id, -3), say([[n, "Ok... entendi. Só amigos, então."]])) },
    ],
  },
  elogio: {
    w: 3,
    text: (n) => pickOne([`${n} acena: "Ouvi falar bem de você pela vila!"`, `${n} para você na rua: "Obrigado por aquela ajuda outro dia. Não esqueci."`, `${n} sorri: "Você deixa a vila mais animada, sabia?"`]),
    opts: (id, n) => [
      { t: "Agradecer", icon: "smile", fn: () => (addFriendship(id, 3), say([[n, "De nada! Passa lá em casa um dia."]])) },
      { t: "Elogiar de volta", icon: "heart", fn: () => (addFriendship(id, 4), say([[n, "Ah, para! Assim eu fico convencido."]])) },
    ],
  },
  piada: {
    w: 2,
    text: (n) => `${n} chega rindo: "Sabe por que o mago não joga cartas? Porque sempre tira o ás da manga! HAHA!"`,
    opts: (id, n) => [
      { t: "Rir junto", icon: "laugh", fn: () => (addFriendship(id, 3), lifeMode() && addNeed("fun", 8), say([[n, "Sabia que você ia gostar! Tenho mais umas cem."]])) },
      { t: "Contar uma melhor", icon: "chat", fn: () => (addFriendship(id, 4), say([["Você", pickOne(LIFE_JOKES)], [n, "HAHAHA! Essa eu vou roubar!"]])) },
      { t: "Revirar os olhos", icon: "meh", fn: () => (addFriendship(id, -2), say([[n, "Poxa... era boa."]])) },
    ],
  },
  favor: {
    w: 2,
    text: (n) => `${n} se aproxima apressado: "Me empresta 10 de ouro? Te pago amanhã, juro!"`,
    opts: (id, n) => [
      { t: "Emprestar 10 ouro", icon: "coin", fn: () => (player.gold >= 10 ? ((player.gold -= 10), addFriendship(id, 6), (player.owed = player.owed || {}), (player.owed[id] = player.day), say([[n, "Você salvou meu dia! Amanhã te devolvo com juros de amizade."]])) : say([["", "Você não tem 10 de ouro."]])) },
      { t: "Dizer que não dá", icon: "meh", fn: () => (addFriendship(id, -1), say([[n, "Tudo bem, eu entendo."]])) },
    ],
  },
  presente: {
    w: 1,
    ok: (id) => friendshipLevel(id) >= 1,
    text: (n) => `${n} chega com um pacotinho: "Vi isto e lembrei de você!"`,
    opts: (id, n) => [
      {
        t: "Aceitar o presente",
        icon: "gift",
        fn: () => {
          const pool = (typeof CATALOG !== "undefined" ? CATALOG : []).filter((k) => ITEMS[k] && ["gift", "food"].includes(ITEMS[k].tipo));
          const it = pool.length ? pickOne(pool) : "flor";
          addItem(it);
          addFriendship(id, 3);
          say([[n, `É um(a) ${ITEMS[it].nome}. Espero que goste!`]]);
        },
      },
    ],
  },
  convite: {
    w: 2,
    text: (n) => `${n} chama você: "Bora tomar uma na taverna mais tarde? Eu pago a primeira!"`,
    opts: (id, n) => [
      { t: "Aceitar", icon: "mug", fn: () => (addFriendship(id, 5), lifeMode() && addNeed("fun", 15), (player.clock = Math.min(1439, player.clock + 90)), (game.fade = 1), say([["", `Você e ${n} passam uma hora rindo na taverna.`]])) },
      { t: "Hoje não", icon: "meh", fn: () => say([[n, "Fica pra próxima, então!"]]) },
    ],
  },
  bronca: {
    w: 2,
    ok: (id) => friendship(id) < 15 || (player.rep ?? 50) < 30 || (player.jealous && player.jealous.id === id),
    text: (n) => pickOne([`${n} cruza os braços na sua frente: "Ouvi coisas sobre você. Não gostei."`, `${n} reclama: "Você passou direto por mim ontem. Nem um oi!"`]),
    opts: (id, n) => [
      { t: "Pedir desculpas", icon: "heart", fn: () => (addFriendship(id, 4), say([[n, "...Tá bom. Desculpas aceitas."]])) },
      { t: "Discutir", icon: "anger", fn: () => (addFriendship(id, -5), repAdd(-1), say([[n, "Grosso! Vou contar pra todo mundo."]])) },
    ],
  },
  iluminismo: {
    w: 1,
    ok: (id) => id === "lucas" || id === "luca",
    text: (n) => `${n} entrega um panfleto amassado: "Leia isto. 'O povo pensa, a coroa obedece.' Bonito, né?"`,
    opts: (id, n) => [
      { t: "Ler o panfleto", icon: "scroll", fn: () => say(pickOne(ILUM_LINES)) },
      { t: "Jogar fora", icon: "meh", fn: () => (addFriendship(id, -2), say([[n, "A monarquia agradece o seu silêncio. Hmpf."]])) },
    ],
  },
  quartaParede: {
    w: 2,
    ok: (id) => id === "luca",
    text: () => `Luca olha para você... e depois direto para FORA da tela: "${pickOne(lucaLines())}"`,
    opts: (id) => [
      { t: "Olhar para a tela também", icon: "eye", fn: () => (addFriendship(id, 5), say([["Luca", "VIU? Você também sente! Somos dois. Ou três, contando quem está jogando."]])) },
      { t: "Fingir que não ouviu", icon: "meh", fn: () => say([["Luca", "Tudo bem. Eu falo com o jogador direto, então. Oi, jogador!"]]) },
    ],
  },
};
function initCandidates() {
  const out = [];
  const near = (x, y, r = 5) => Math.abs(x - player.x) + Math.abs(y - player.y) <= r;
  if (player.zone === "vila" && game.crewA) for (const a of Object.values(game.crewA)) if (crewVisible(a) && near(a.x, a.y)) out.push({ id: a.id, x: a.x, y: a.y });
  const z = ZONES[player.zone];
  if (z && z.town)
    for (const [x, y, id] of z.npcList || [])
      if (FRIENDS[id] && NPCS[id] && !npcHidden(id) && near(x, y)) out.push({ id, x, y });
  for (const r of game.roam || []) if (FRIENDS[r.id] && near(r.x, r.y) && !npcAsleep(r.id)) out.push({ id: r.id, x: r.x, y: r.y });
  if (player.zone === "interior" && game.inter) for (const p of game.inter.people) if (p.cid && near(p.x, p.y)) out.push({ id: p.cid, x: p.x, y: p.y });
  return out.filter((c) => c.id !== player.spouse);
}
function npcInitiate() {
  if (game.mode !== "world" || game.dialog || player.job || game.paused) return;
  if (!ZONES[player.zone] || (!ZONES[player.zone].town && player.zone !== "interior")) return;
  player.famDay.inits = player.famDay.initDay === player.day ? player.famDay.inits || 0 : 0;
  player.famDay.initDay = player.day;
  if (player.famDay.inits >= 10) return;
  const cands = initCandidates();
  if (!cands.length) return;
  const c = pickOne(cands);
  const kinds = Object.entries(NPC_INITS).filter(([, k]) => !k.ok || k.ok(c.id));
  const total = kinds.reduce((a, [, k]) => a + k.w, 0);
  let r = Math.random() * total,
    pick = kinds[0];
  for (const kv of kinds) if ((r -= kv[1].w) < 0) {
    pick = kv;
    break;
  }
  const [, K] = pick;
  const n = NPCS[c.id].nome.split(",")[0];
  player.famDay.inits++;
  game.pieAnchor = { x: c.x, y: c.y };
  playSound(660, 0.06, "sine");
  game.bubbles.push({ x: c.x, y: c.y, icon: "chat", t: 2 });
  choice(`${n} veio falar com você`, K.text(n), K.opts(c.id, n).concat([{ t: "Sair", fn: () => addFriendship(c.id, -1) }]));
}
setInterval(() => {
  if (Math.random() < 0.5) npcInitiate();
}, 45000);
/* Quem pegou ouro emprestado devolve no dia seguinte. */
const _onNewDayOwed = onNewDay;
onNewDay = function () {
  _onNewDayOwed.apply(this, arguments);
  for (const [id, d] of Object.entries(player.owed || {}))
    if (player.day > d) {
      player.gold += 12;
      delete player.owed[id];
      setTimeout(() => toast(`${NPCS[id].nome.split(",")[0]} devolveu o empréstimo com juros: +12 ouro.`, 3600), 5000);
    }
};

/* ===================== SETA DA LOJA NO CELULAR ===================== */
/* O toque reage no instante em que o dedo encosta (antes, um leve arrastar virava rolagem e cancelava o clique). */
function fixShopNav() {
  const root = byId("shop");
  root.querySelectorAll("[data-nav],[data-cnav]").forEach((b) => {
    const d = +(b.dataset.nav || b.dataset.cnav);
    const go = () => (b.dataset.cnav ? cosSlide(d) : shopSlide(d));
    b.onclick = null;
    b.onpointerdown = (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (!b.disabled) go();
    };
  });
}
const _renderShopNav = renderShop;
renderShop = function () {
  _renderShopNav();
  fixShopNav();
};
const _renderCosmeticNav = renderCosmetic;
renderCosmetic = function () {
  _renderCosmeticNav();
  fixShopNav();
};
