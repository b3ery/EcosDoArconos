/**
 * ECOS DO ARCANO — simulador.js
 * Modo Simulador de Vida: sem runas e sem batalhas da história.
 * O jogador cuida das necessidades básicas, trabalha de verdade (com minijogos),
 * pode ter a própria tendinha e entrar para a Guarda Real.
 * O modo história continua igual: tudo aqui só liga quando player.mode === "vida".
 */

"use strict";

function lifeMode() {
  return player.mode === "vida";
}

/* ===================== NECESSIDADES BÁSICAS ===================== */

/** Além de fome e sede: energia, higiene e diversão (0 a 100). */
const LIFE_NEEDS = {
  energy: { n: "Energia", icon: "bolt", rate: 0.17, low: "Você está exausto. Vá dormir!" },
  hygiene: { n: "Higiene", icon: "soap", rate: 0.12, low: "Você precisa de um banho. As pessoas estão se afastando..." },
  fun: { n: "Diversão", icon: "joy", rate: 0.13, low: "Que tédio... vá se divertir na taverna, dançar ou namorar." },
};
function lifeNeed(k) {
  return player[k] ?? 100;
}
function addNeed(k, v) {
  player[k] = Math.max(0, Math.min(100, lifeNeed(k) + v));
}
function lifeNeedsTick(dt) {
  if (!lifeMode()) return;
  for (const k in LIFE_NEEDS) {
    const before = lifeNeed(k);
    addNeed(k, -dt * LIFE_NEEDS[k].rate);
    if (before >= 15 && lifeNeed(k) < 15) toast(LIFE_NEEDS[k].low, 3500);
  }
}
/** Necessidades baixas atrapalham o trabalho: o pagamento cai. */
function needsPayMul() {
  let m = 1;
  if (lifeNeed("energy") < 20) m *= 0.6;
  if (lifeNeed("fun") < 15) m *= 0.8;
  if (lifeNeed("hygiene") < 15) m *= 0.85;
  if (starving()) m *= 0.7;
  return m;
}
/** Custo de um turno de trabalho nas necessidades. */
function spendShift(hours) {
  addNeed("energy", -hours * 6);
  addNeed("hygiene", -hours * 3);
  addNeed("fun", -hours * 3);
  player.food = Math.max(0, player.food - hours * 3);
  player.water = Math.max(0, player.water - hours * 4);
  player.clock = Math.min(1439, player.clock + hours * 60);
  game.fade = 1;
}

/* ===================== INÍCIO DO MODO ===================== */

function startLifeMode() {
  player.mode = "vida";
  player.runes = [];
  player.spells = [];
  player.gold = 60;
  player.energy = 100;
  player.hygiene = 100;
  player.fun = 80;
  player.age = START_AGE;
  addItem("facao");
  player.facaoUses = { facao: 40 };
  worldState();
  game.seenArr = {};
  game.mm = {};
  startGame(false);
  say([
    ["", `Bem-vindo a Cinzaluz, ${player.name}. Aqui não tem magia nem aventura: tem boletos, fome e vizinhos curiosos.`],
    [
      "Professor Bruno Honda",
      "Recém-chegado? O Quadro de Trabalhos fica na praça, ao lado da fonte. Tem lenhador, fazendeiro, pescador, carregador, feirante, Guarda Real... e dá pra ter sua própria tendinha.",
    ],
    [
      "",
      "Cuide de fome, sede, energia, higiene e diversão (painel no canto). Durma em casa, tome banho e se divirta. Faça amigos, namore, case, tenha filhos e veja eles crescerem.",
    ],
  ]);
  saveGame();
}

/* ===================== TRABALHO 2: MINHA TENDINHA ===================== */

/** Produtos da tendinha: [id do ícone, nome, custo por unidade, valor justo]. */
const STALL_PRODUCTS = [
  { k: "pao", n: "Pão caseiro", cost: 3, value: 8 },
  { k: "canteen", n: "Suco de frutas", cost: 2, value: 6 },
  { k: "flower", n: "Buquê de flores", cost: 5, value: 14 },
  { k: "cake", n: "Bolo de pote", cost: 6, value: 16 },
  { k: "ring", n: "Bijuteria", cost: 12, value: 30 },
];
const STALL_LICENSE = 250;
const STALL_STOCK = 8;

function stallMenu() {
  if (!player.flags.stall)
    return choice(
      "Sua própria tendinha",
      `Uma licença da Prefeitura custa ${withTax(STALL_LICENSE)} de ouro (com Imposto Real). Com ela, você monta uma tenda na feira e vende o que quiser.`,
      [
        {
          t: `Comprar a licença (${withTax(STALL_LICENSE)} ouro)`,
          fn: () => {
            if (player.gold < withTax(STALL_LICENSE)) return say([["", "Você não tem ouro suficiente. Trabalhe na feira primeiro!"]]);
            payWithTax(STALL_LICENSE);
            player.flags.stall = true;
            saveGame();
            say([["", "Parabéns, empreendedor! Agora você tem uma tendinha na feira. Abra quando quiser pelo Quadro de Trabalhos."]]);
          },
        },
        { t: "Sair", fn: null },
      ],
    );
  if (currentHour() < 7 || currentHour() >= 19) return say([["", "A feira só funciona das 7h às 19h."]]);
  if (player.famDay.stall === player.day) return say([["", "Você já abriu a tendinha hoje. Amanhã tem mais!"]]);
  choice(
    "O que vender hoje?",
    `Você compra ${STALL_STOCK} unidades no atacado. O que não vender, estraga (menos bijuteria).`,
    STALL_PRODUCTS.map((p) => ({
      t: `${p.n} · custo ${p.cost * STALL_STOCK} ouro`,
      fn: () => stallPrice(p),
    })).concat([{ t: "Sair", fn: null }]),
  );
}
function stallPrice(p) {
  const total = p.cost * STALL_STOCK;
  if (player.gold < total) return say([["", `Você precisa de ${total} de ouro para comprar o estoque.`]]);
  choice(
    p.n,
    "Qual preço você vai cobrar? Mais caro dá mais lucro, mas espanta clientes.",
    [
      ["Barato", 0.8, 0.9],
      ["Justo", 1, 0.7],
      ["Caro", 1.4, 0.45],
      ["Abusivo (capitalismo!)", 2, 0.25],
    ].map(([n, mul, chance]) => ({
      t: `${n}: ${Math.round(p.value * mul)} ouro cada`,
      fn: () => {
        openOwnStall(p, Math.round(p.value * mul), chance);
      },
    })),
  );
}
/* ===================== TRABALHO 3: GUARDA REAL ===================== */

const GUARD_RANKS = [
  { n: "Recruta", pay: 1, need: 0 },
  { n: "Soldado", pay: 1.3, need: 4 },
  { n: "Sargento", pay: 1.6, need: 10 },
  { n: "Capitão da Guarda", pay: 2, need: 18 },
];
function guardRank() {
  const s = player.guardShifts || 0;
  return [...GUARD_RANKS].reverse().find((r) => s >= r.need);
}
/* ===================== MENUS ===================== */

/** Quadro de Trabalhos: as profissões ficam em simulador.js. */
function lifeJobsMenu() {
  professionsMenu();
}

/** Opções extras em casa no modo vida. */
function lifeHomeItems() {
  if (!lifeMode()) return [];
  return [
    {
      t: "Tomar banho (30 min)",
      fn: () => {
        player[`hygiene`] = 100;
        player.clock = Math.min(1439, player.clock + 30);
        saveGame();
        say([["", "Água quentinha e sabão de ervas. Higiene cheia!"]]);
      },
    },
  ];
}

/** Texto do objetivo no topo da tela, no modo vida. */
function lifeGoalText() {
  const low = Object.keys(LIFE_NEEDS).find((k) => lifeNeed(k) < 20);
  if (low) return `! ${LIFE_NEEDS[low].n} baixa: ${LIFE_NEEDS[low].low}`;
  if (starving()) return "! Coma e beba alguma coisa!";
  const here = kingdomOf(player.zone);
  if (kingdomAtWar(here)) return `! ${KINGDOMS[here].short} está em guerra · K: ver reinos e alistar-se`;
  if (isMonarch()) return `${royalTitle()} · ${player.name}, ${playerAge()} anos · K: governar o reino`;
  if ((player.taxDue || 0) > 0) return `${player.name}, ${playerAge()} anos · Imposto da casa: ${player.taxDue} ouro (o Coletor Real vai cobrar)`;
  return `${player.name}, ${playerAge()} anos · ${KINGDOMS[here].short} · ${player.gold} ouro · E no Quadro de Trabalhos · K: reinos`;
}

/* ===================== ROMANCE COM REJEIÇÃO (só no Simulador) ===================== */

/** Idade aproximada de cada morador (fixa por pessoa). */
function npcAge(id) {
  const h = [...id].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
  return 19 + (h % 42) + Math.floor(Math.max(0, (player.day || 1) - 1) / 3);
}
/** Quanto cada personalidade liga para cada coisa (1 = normal). */
const ROMANCE_TASTES = {
  gentil: { hygiene: 1, money: 0.5, rep: 1, fun: 1.2 },
  orgulhoso: { hygiene: 1.4, money: 1.6, rep: 1.5, fun: 0.8 },
  engracado: { hygiene: 0.8, money: 0.6, rep: 0.8, fun: 1.6 },
  aventureiro: { hygiene: 0.6, money: 0.8, rep: 1, fun: 1.4 },
  serio: { hygiene: 1.2, money: 1.2, rep: 1.4, fun: 0.7 },
  timido: { hygiene: 1.1, money: 0.8, rep: 0.9, fun: 1 },
  sabio: { hygiene: 1, money: 0.7, rep: 1.3, fun: 0.9 },
  esperto: { hygiene: 1, money: 1.3, rep: 1, fun: 1 },
};
/**
 * Calcula a chance de alguém aceitar e junta os motivos (bons e ruins).
 * kind: "namoro" ou "casamento" (casamento é mais exigente).
 */
function romanceOdds(id, kind) {
  const taste = ROMANCE_TASTES[PERSONALITIES[id]] || ROMANCE_TASTES.gentil;
  let score = (friendship(id) - (kind === "casamento" ? 70 : 50)) * 1.4;
  const why = [];
  const add = (v, reason) => {
    score += v;
    if (Math.abs(v) >= 4) why.push([v, reason]);
  };
  const hyg = lifeNeed("hygiene");
  if (hyg < 30) add(-30 * taste.hygiene, "você está cheirando mal (higiene baixa)");
  else if (hyg > 80) add(6 * taste.hygiene, "você está cheiroso");
  const fun = lifeNeed("fun");
  if (fun < 25) add(-12 * taste.fun, "você anda de mau humor (diversão baixa)");
  const rep = player.rep ?? 50;
  add(((rep - 50) / 3) * taste.rep, rep >= 50 ? "você tem boa fama na vila" : "sua fama na vila é ruim");
  const wealth = player.gold + ownedHouses().reduce((a, h) => a + h.price, 0);
  const needMoney = kind === "casamento" ? 300 : 80;
  add(Math.max(-20, Math.min(15, (wealth - needMoney) / 25)) * taste.money, wealth >= needMoney ? "você tem onde cair morto" : "você está sem dinheiro nenhum");
  const gap = Math.abs(playerAge() - npcAge(id));
  if (gap > 15) add(-(gap - 15) * 1.5, "a diferença de idade é grande");
  if ((player.drunk || 0) >= 40) add(-25, "você está bêbad" + genderWord("o", "a", "e"));
  if (player.famDay["date" + id] === player.day) add(12, "o encontro de hoje foi ótimo");
  if (festivalToday()) add(8, "o clima de festival ajuda");
  if (player.cheatCount) add(-8 * player.cheatCount, "você tem fama de traidor");
  if (kind === "casamento" && player.day - (player.datingSince || 0) < 3) add(-15, "vocês namoram há pouco tempo");
  const chance = Math.max(0.03, Math.min(0.97, 0.5 + score / 100));
  return { chance, why: why.sort((a, b) => a[0] - b[0]) };
}
/** Tenta e responde. Retorna true se aceitou. Recusa deixa 2 dias de espera e um climão. */
function romanceAccepts(id, kind) {
  const n = NPCS[id].nome.split(",")[0];
  const key = "romanceNo" + kind + id;
  if (player.famDay[key] && player.day - player.famDay[key] < 2) {
    say([[n, kind === "casamento" ? "Você me pediu há pouco... Ainda estou pensando. Me dá um tempo." : "Já te respondi. Não insista agora, por favor."]]);
    return false;
  }
  const { chance, why } = romanceOdds(id, kind);
  if (Math.random() < chance) {
    const good = why.filter(([v]) => v > 0).slice(-1)[0];
    if (good) toast(`Pesou a favor: ${good[1]}.`, 3000);
    return true;
  }
  player.famDay[key] = player.day;
  addFriendship(id, kind === "casamento" ? -8 : -4);
  addNeed("fun", -15);
  saveGame();
  const bad = why.filter(([v]) => v < 0).slice(0, 2).map(([, r]) => r);
  const lines =
    kind === "casamento"
      ? ["*fica em silêncio, olhando o anel* ...Não. Desculpa. Não estou pronto(a) para isso.", "Casar? Eu... gosto de você, mas não. Não agora."]
      : ["Ah... Você é legal, mas eu não te vejo desse jeito.", "Namorar? *ri sem graça* Acho melhor a gente continuar amigos."];
  say([
    [n, lines[Math.floor(Math.random() * lines.length)]],
    ["", `Recusado (chance era ${Math.round(chance * 100)}%).${bad.length ? " O que pesou contra: " + bad.join("; ") + "." : " Faltou mais amizade."} Espere 2 dias para tentar de novo.`],
  ]);
  return false;
}
