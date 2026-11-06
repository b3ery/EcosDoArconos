/**
 * ECOS DO ARCANO — 46-morte-e-calabouco.js
 * Crimes, castigo e o calabouço (nos dois modos):
 *  - Qualquer adulto pode morrer (crianças não). Magos são imortais para mortais:
 *    no Simulador ninguém mata a Odelia; no modo História você é mago, então
 *    um duelo de mago contra mago pode acabar em morte.
 *  - Faca, veneno ou feitiço mortal. Testemunhas por perto podem ver tudo;
 *    se ninguém viu, a guarda investiga por alguns dias.
 *  - Descobriram? Prisão no calabouço, reputação zero e a vila inteira te detesta.
 *  - O calabouço do castelo: celas, guarda fazendo ronda e o Professor L,
 *    que ninguém sabe o nome nem por que está preso. O General Marcos tem ranço
 *    dele, então toda patrulha joga lixo na cela.
 *  - Saga do vilão: o eco do Silenciador manda eliminar a Odelia.
 */

"use strict";

/* ===================== QUEM ESTÁ VIVO ===================== */

const MAGES = new Set(["odelia", "selene"]);
function isMage(id) {
  return MAGES.has(id) || /\b(Arquimag|Mag[ao]\b)/.test((NPCS[id] && NPCS[id].nome) || "");
}
function deadList() {
  return (player.dead = player.dead || {});
}
function isDead(id) {
  return !!id && !!deadList()[id];
}
{
  const hidBase = npcHidden;
  npcHidden = (id) => isDead(id) || hidBase(id);
  const visBase = crewVisible;
  crewVisible = (a) => !(a && isDead(a.id)) && visBase(a);
  const spBase = npcSpouse;
  npcSpouse = (id) => {
    if (isDead(id)) return null;
    const s = spBase(id);
    return s && isDead(s) ? null : s;
  };
}
/** Tira os mortos da rua, das lojas e das conversas. */
function purgeDead() {
  if (!player.dead) return;
  if (game.roam && game.roam.some((r) => isDead(r.id))) game.roam = game.roam.filter((r) => !isDead(r.id));
  if (game.inter && game.inter.people && game.inter.people.some((p) => isDead(p.cid))) game.inter.people = game.inter.people.filter((p) => !isDead(p.cid));
  // Quem é essencial na história deixa o caminho livre quando morre.
  if (!lifeMode()) {
    if (isDead("kael") && !player.flags.treino) player.flags.treino = true;
    if (isDead("odelia")) {
      if (player.guards.includes("bosque")) player.flags.r2 = true;
      if (player.guards.includes("pantano")) player.flags.r3 = true;
      if (player.guards.includes("picos")) player.flags.r4 = true;
    }
  }
}

/* ===================== MATAR ===================== */

function killStrength(id) {
  let s = 0;
  if (["marcos", "kael", "tome", "capitao", "guarda", "guarda2", "ferreiro", "vini"].includes(id)) s += 0.3;
  if (hasTrait(id, "esquentado") || hasTrait(id, "aventureiro")) s += 0.12;
  if (hasTrait(id, "timido") || hasTrait(id, "preguicoso")) s -= 0.1;
  return s;
}
function witnessesNear(id) {
  let n = 0;
  const near = (o) => o && Math.abs(o.x - player.x) + Math.abs(o.y - player.y) <= 8;
  for (const w of game.walkers || []) if (!(w.inside > 0) && near(w)) n++;
  for (const r of game.roam || []) if (r.id !== id && near(r)) n++;
  for (const a of Object.values(game.crewA || {})) if (a.id !== id && player.zone === "vila" && crewVisible(a) && near(a)) n++;
  if (player.zone === "interior" && game.inter) n += (game.inter.people || []).filter((p) => p.cid !== id).length;
  return n;
}
function killMenu(id) {
  const n = shortName(id);
  if (isChildNpc(id)) return say([["", "Não. Nem pensar."]]);
  if (isDead(id)) return;
  const story = !lifeMode();
  const opts = [];
  if (isMage(id) && !story) {
    return say([
      ["", `Você avança contra ${n}... e a lâmina atravessa o corpo como se fosse névoa.`],
      [n, "Criança. Magos não morrem pelas mãos de mortais. Agora suma da minha frente."],
      ["", "Magos são imortais para quem não tem magia. Reputação −5."],
    ], () => (repAdd(-5), addFriendship(id, -30), saveGame()));
  }
  if (isMage(id))
    opts.push({ t: `Duelo mortal de magos com ${n}`, icon: "skull", fn: () => mageDuel(id) });
  else if (story)
    opts.push({
      t: `Feitiço mortal (25 MP)`,
      icon: "skull",
      fn: () => {
        if (player.mp < 25) return say([["", "Você não tem mana para isso (25 MP)."]]);
        player.mp -= 25;
        attemptKill(id, "feitico", 0.92);
      },
    });
  else {
    const blade = itemCount("facao") || itemCount("faca") || itemCount("espada");
    opts.push({ t: `Atacar com ${blade ? "a lâmina" : "uma faca de cozinha"}`, icon: "sword", fn: () => attemptKill(id, "faca", 0.62 + (blade ? 0.1 : 0) - killStrength(id)) });
  }
  opts.push({
    t: itemCount("veneno") ? "Envenenar a bebida (usa o Veneno)" : `Envenenar (compre Veneno no Boticário)`,
    icon: "skull",
    off: !itemCount("veneno") || (isMage(id) && !story),
    fn: () => {
      if (!itemCount("veneno")) return;
      removeItem("veneno");
      if (isMage(id)) return say([[n, "*cheira a taça* Beladona? Sério? Eu tenho trezentos anos de magia, aprendiz."]], () => (addFriendship(id, -25), repAdd(-4)));
      attemptKill(id, "veneno", 0.85);
    },
  });
  opts.push({ t: "Desistir", fn: null });
  game.pieAnchor = null;
  choice(`Matar ${n}?`, `Isso não tem volta. Se alguém descobrir: prisão no calabouço e a vila inteira vai te odiar.${story ? " No modo História, cada morte também te puxa para o caminho do vilão." : ""}`, opts);
}
function attemptKill(id, how, chance) {
  const n = shortName(id);
  const seenN = witnessesNear(id);
  game.shake = 0.3;
  playSound(110, 0.4, "sawtooth");
  if (Math.random() > Math.max(0.05, Math.min(0.95, chance))) {
    addFriendship(id, -60);
    repAdd(-15);
    vilaNews(`${n} sobreviveu a uma tentativa de assassinato!`);
    return say(
      [
        ["", how === "veneno" ? `${n} cospe a bebida: "Isso está com gosto de... VENENO!"` : `${n} desvia no último segundo e segura o seu braço!`],
        [n, pk(["SOCORRO! ASSASSINO!", "GUARDAS! Tentaram me matar!", "Você está louc" + genderWord("o", "a", "e") + "?! GUARDAS!"])],
      ],
      () => (startJail(48, `tentativa de assassinato contra ${n}`), hateEveryone(6)),
    );
  }
  killNpc(id, how);
  const pSeen = 1 - Math.pow(how === "veneno" ? 0.93 : 0.8, seenN);
  const seen = Math.random() < pSeen;
  const scene = {
    faca: `Tudo acontece rápido. ${n} cai no chão e não levanta mais.`,
    veneno: `${n} bebe, tosse, empalidece... e cai sem vida.`,
    feitico: `Uma luz fria sai da sua mão. ${n} cai como uma marionete sem fios.`,
    duelo: `O último feitiço atravessa a defesa de ${n}. Silêncio.`,
  }[how];
  if (seen)
    return say([["", scene], ["", seenN > 1 ? `${seenN} pessoas viram tudo!` : "Alguém viu tudo!"], ["Morador", pk(["ASSASSINO! ASSASSINO!", "Chamem a guarda! Ali, foi ali!", "Eu vi! Eu vi tudo!"])]], () => murderFound(id));
  say([["", scene], ["", "Ninguém viu. Por enquanto."]], () =>
    choice("E agora?", "Um corpo bem escondido demora mais para ser encontrado.", [
      { t: "Esconder o corpo (1 hora)", icon: "eye", fn: () => ((deadList()[id].hidden = true), passTime(1, "Você arrasta o corpo para um canto escuro..."), saveGame(), toast("Corpo escondido. A guarda vai demorar mais para achar.", 2600)) },
      { t: "Sair dali como se nada tivesse acontecido", icon: "door", fn: () => saveGame() },
    ]),
  );
}
function killNpc(id, how) {
  deadList()[id] = { day: player.day, how, found: false, hidden: false };
  if (player.spouse === id) (player.spouse = null), (player.widowed = player.day);
  if (player.dating === id) player.dating = null;
  player.lovers = (player.lovers || []).filter((x) => x !== id);
  player.murders = (player.murders || 0) + 1;
  if (!lifeMode()) {
    player.villain = (player.villain || 0) + 2;
    player.darkPower = Math.min(0.6, (player.darkPower || 0) + 0.05);
  }
  if (game.crewA && game.crewA[id]) game.crewA[id].inside = true;
  purgeDead();
  saveGame();
}
/** A guarda achou o corpo e sabe quem foi. */
function murderFound(id) {
  const d = deadList()[id];
  if (!d) return;
  d.found = true;
  const n = shortName(id);
  const sp = npcSpouse(id) || (typeof NPC_MARRIED !== "undefined" && NPC_MARRIED[id]);
  vilaNews(`${n} foi assassinad${gw(id, "o", "a")}! A guarda prendeu ${player.name}.`);
  hateEveryone(10);
  say(
    [
      ["Guarda Tomé", `${player.name}, você está pres${genderWord("o", "a", "e")} pelo assassinato de ${n}!`],
      ...(sp && !isDead(sp) ? [[shortName(sp), pk(["Você tirou a pessoa que eu mais amava! Eu NUNCA vou te perdoar!", "Monstro! MONSTRO!", "*chora sem parar*"])]] : []),
      ["", "A vila inteira agora te detesta. Reputação zero."],
    ],
    () => startJail(72, `assassinato de ${n}`),
  );
}
function hateEveryone(days) {
  player.rep = 0;
  for (const k of Object.keys(FRIENDS)) if (player.rel[k] != null) player.rel[k] = Math.min(player.rel[k], 3);
  player.hatedUntil = Math.max(player.hatedUntil || 0, player.day + days);
  saveGame();
}
function hated() {
  return (player.hatedUntil || 0) >= player.day;
}
/* Investigação: corpos escondidos ou não, a guarda procura todo dia. */
{
  const dayBase = onNewDay;
  onNewDay = function () {
    dayBase.apply(this, arguments);
    for (const [id, d] of Object.entries(player.dead || {})) {
      if (d.found || player.day - d.day > 6) continue;
      const p = d.how === "veneno" ? 0.12 : d.hidden ? 0.15 : 0.35;
      if (Math.random() < p) {
        game.pendingMurder = id;
        break;
      }
      if (!d.announced) {
        d.announced = true;
        setTimeout(() => toast(`${shortName(id)} sumiu. A guarda está investigando...`, 4200), 7000);
      }
    }
  };
}
/* Odiado: ninguém quer papo, e a rua grita. */
{
  const chatBase = chatWith;
  chatWith = function (id) {
    if (hated() && Math.random() < 0.8) {
      bubble(id, "anger");
      return say([[shortName(id), pk(["Não fala comigo, assassin" + genderWord("o", "a", "e") + "!", "Some da minha frente.", "Eu tenho medo de você. Vai embora!", "Como você tem coragem de aparecer aqui?", "*vira as costas sem responder*"])]]);
    }
    return chatBase(id);
  };
  const angryBase = angry;
  angry = (id) => hated() || angryBase(id);
}
let hateAcc = 0;
function hateShouts(dt) {
  hateAcc += dt;
  if (hateAcc < 5 || !hated()) return;
  hateAcc = 0;
  const near = (game.walkers || []).filter((w) => Math.abs(w.x - player.x) + Math.abs(w.y - player.y) <= 6);
  if (!near.length) return;
  const w = pk(near);
  w.sayT = 2.6;
  w.sayTxt = pk(["Assassin" + genderWord("o", "a", "e") + "!", "Olha quem está ali...", "Escondam as crianças!", "Não chega perto!", "Devia estar no calabouço até hoje!"]);
  w.flee = 3;
}
/* O menu da pessoa ganha "Matar…". */
{
  const itemsBase = lifeSocialItems;
  lifeSocialItems = function (id) {
    const items = itemsBase(id);
    if (!isChildNpc(id) && !isDead(id)) items.push({ t: "Matar…", icon: "skull", fn: () => killMenu(id) });
    return items;
  };
}
/* Veneno no Boticário. */
ITEMS.veneno = { nome: "Frasco de Veneno", tipo: "item", preco: 90, desc: "Beladona destilada. Ninguém pergunta para que serve." };
ITEM_ICONS.veneno = gIcon("potion", "#5a9a3a", "#1a1a1a", 2);
if (SHOPS.boticario && !SHOPS.boticario.items.includes("veneno")) SHOPS.boticario.items.push("veneno");

/* ===================== DUELO DE MAGOS (HISTÓRIA) ===================== */

function mageDuel(id) {
  const n = NPCS[id].nome;
  ENEMIES.duelo = { nome: n, hp: 150 + player.lvl * 14, atk: 13 + player.lvl * 1.5, xp: 160, weak: [], resist: [], cor: NPCS[id].robe || "#5b3fa8", shape: "knight", boss: false };
  game.duelWith = id;
  say([[shortName(id), id === "odelia" ? (darkPath() ? "Então chegou a esse ponto. Meu irmão também começou assim. Venha, aprendiz." : "Você quer me matar? Depois de tudo que eu te ensinei?") : "Magia contra magia? Que assim seja."], ["", "Só a magia pode matar um mago."]], () => startBattle("duelo", null));
}
{
  const winBase = win;
  win = function () {
    if (battle && battle.type === "duelo" && game.duelWith && !battle.done) {
      battle.done = true;
      const id = game.duelWith;
      game.duelWith = null;
      playVictoryJingle();
      battleLog(`${NPCS[id].nome} cai de joelhos...`);
      setTimeout(() => {
        endBattle();
        gainXP(160);
        if (id === "odelia") {
          player.flags.odeliaMorta = true;
          player.darkPower = Math.min(0.6, (player.darkPower || 0) + 0.1);
          repAdd(-20);
        }
        attemptKill(id, "duelo", 1);
      }, 1200);
      return;
    }
    return winBase();
  };
  const loseBase = lose;
  lose = function () {
    if (battle && battle.type === "duelo" && game.duelWith) {
      const id = game.duelWith;
      game.duelWith = null;
      addFriendship(id, -40);
      repAdd(-10);
      setTimeout(() => say([[shortName(id), "Eu poderia ter acabado com você. Não acabei. Pense nisso."]]), 3500);
    }
    return loseBase();
  };
}
/* Saga do vilão: o eco do Silenciador manda eliminar a Odelia. */
let villainAcc = 0;
function villainOrders(dt) {
  if (lifeMode() || player.flags.ordemOdelia || isDead("odelia") || !darkPath() || player.zone !== "vila") return;
  villainAcc += dt;
  if (villainAcc < 6) return;
  villainAcc = 0;
  player.flags.ordemOdelia = true;
  say([
    ["O Silenciador (eco)", "Você sente? A Odelia sabe o que você é. Ela é a única que ainda pode me deter... e te deter."],
    ["O Silenciador (eco)", "Mortais não matam magos. Mas você não é mortal. Elimine-a."],
    ["", "Nova ordem sombria: duelo mortal com a Arquimaga Odelia (menu dela → Matar…). Outras pessoas também podem cair pelo seu feitiço."],
  ]);
}
{
  const moralBase = moralItems;
  moralItems = function (id) {
    const items = moralBase(id);
    if (!lifeMode() && id === "odelia" && player.flags.ordemOdelia && !isDead("odelia")) items.push({ t: "Cumprir a ordem: duelo mortal (vilão)", icon: "skull", fn: () => mageDuel("odelia") });
    return items;
  };
}

/* ===================== CALABOUÇO ===================== */

ZONE_DEFS.calabouco = { nome: "Calabouço do Castelo", theme: "mina", exits: {}, enemies: [] };
const JAIL = { w: 20, h: 12, cellA: [3, 2], cellB: [9, 2], cellC: [15, 2], exit: [10, 9], barsY: 4 };
function genJail() {
  const { w, h } = JAIL;
  const m = makeGrid(w, h, (x, y) => (x === 0 || y === 0 || x === w - 1 || y === h - 1 ? "#" : "."));
  for (let y = 1; y <= JAIL.barsY; y++) for (const x of [6, 12, 18]) m[y][x] = "#";
  for (let x = 1; x < w - 1; x++) m[JAIL.barsY][x] = "#";
  for (let x = 1; x < w - 1; x++) m[h - 2][x] = "#";
  m[h - 2][JAIL.exit[0]] = ".";
  const z = finalize("calabouco", ZONE_DEFS.calabouco, m, w, h, {}, {}, null);
  z.town = { bld: [], doors: {}, stalls: {}, huts: [], arrive: [JAIL.exit[0], JAIL.exit[1]], horses: [], boats: [], yard: true };
  return z;
}
ZONES.calabouco = genJail();
const PROF_L_LOOK = { skin: "#f4dccb", hair: "#f4dccb", hstyle: "careca", hat: "nenhum", hatc: "#2a2f6e", outfit: "capa", robe: "#8a8a92", eyes: "#0a0a0a", acc: "nenhum", staffc: "#ffe066", aura: "nenhuma" };
NPCS.profL = { nome: "Professor L", robe: "#8a8a92", hat: null, hair: "#f4dccb", talk: () => [["Professor L", pk(PROF_L_LINES)]] };
HERO_LOOKS[`${NPCS.profL.robe}|${NPCS.profL.hat}|${NPCS.profL.hair}`] = PROF_L_LOOK;
NPC_GENDER.profL = "m";
NPC_TRAITS_FIXED.profL = ["dramatico", "serio", "intelectual"];
const PROF_L_LINES = [
  "Hm. Você respira muito alto. Já te disseram isso?",
  "Esse calabouço tem cheiro de repolho. Desde que EU cheguei. Coincidência.",
  "Vou corrigir sua postura. Não pedi permissão. Não vou pedir.",
  "*arrasta a caneca nas grades por três minutos seguidos*",
  "Meu nome? Professor L. Só isso. O resto você não merece.",
  "Por que estou preso? Pergunta melhor: por que VOCÊ está livre?",
  "Sabe o que eu ensinava? ...Não vou dizer. Você não entenderia.",
  "Esse guarda pisa errado. Calcanhar primeiro, como um amador.",
  "*assobia a mesma nota desafinada sem parar*",
  "Eu podia sair daqui quando quisesse. Só não quero. Ainda.",
  "O General Marcos? Ah, ele me adora. Por isso manda essas... lembrancinhas.",
  "Você tem cara de quem tirava 6 em tudo. Seis. Nem sete.",
  "*estala os dedos um por um, devagar, olhando para você*",
  "Silêncio é ouro. Por isso eu falo o tempo todo: odeio riqueza.",
  "Essa casca de banana na minha cela já virou minha amiga. Ela fala menos que você.",
];
const PROF_L_TRASH = ["Lixo do General Marcos, Professor! Com carinho!", "Entrega especial pro Professor L!", "O General mandou lembranças. E restos de peixe.", "Toma, professor: o resto do almoço do quartel!", "Ordem do General: um balde de lixo por ronda!"];
const PROF_L_REACT = ["Ah, que gentil. Casca de banana de novo. O General tem um paladar previsível.", "Isso era um peixe? Era. Ontem.", "Diga ao Marcos que eu ainda lembro. Ele sabe do quê.", "Obrigado. Vou adicionar à minha coleção.", "*nem olha* Pode deixar ali, junto com a sua dignidade."];
function enterJail(prisoner) {
  ZONES.calabouco = ZONES.calabouco || genJail();
  player.metProfL = true;
  game.jailBack = prisoner ? { zone: "vila", x: 31, y: 12 } : { zone: player.zone, x: player.x, y: player.y };
  player.zone = "calabouco";
  [player.x, player.y] = prisoner ? JAIL.cellA : [JAIL.exit[0], JAIL.exit[1] - 1];
  player.rx = player.x;
  player.ry = player.y;
  player.dir = prisoner ? "down" : "up";
  player.riding = false;
  game.fade = 1;
  game.kidsP = [];
  enterZone(false);
  game.jailA = {
    prof: { x: JAIL.cellB[0], y: JAIL.cellB[1] + 1, rx: JAIL.cellB[0], ry: JAIL.cellB[1] + 1, dir: "down", t: 3 },
    other: { x: JAIL.cellC[0], y: JAIL.cellC[1], rx: JAIL.cellC[0], ry: JAIL.cellC[1], dir: "left", robe: "#6a5a4a", hair: "#3a2414" },
    guard: { x: 2, y: 6, rx: 2, ry: 6, dir: "right", step: 0, pause: 0, v: 1 },
    trash: player.jailTrash || [],
    stink: 0,
  };
  playSound(200, 0.25, "square");
}
function leaveJail() {
  const b = game.jailBack || { zone: "vila", x: 31, y: 12 };
  player.jail = null;
  player.zone = b.zone;
  player.x = b.x;
  player.y = b.y;
  player.rx = b.x;
  player.ry = b.y;
  player.dir = "down";
  game.fade = 1;
  enterZone(false);
  saveGame();
}
/** Vai para a cela por algumas horas. */
function startJail(hours, crime) {
  player.jail = { until: player.day * 1440 + player.clock + hours * 60, crime };
  if (player.plot) player.plot = null;
  enterJail(true);
  saveGame();
  setTimeout(
    () =>
      say([
        ["", `Você foi jogad${genderWord("o", "a", "e")} numa cela do calabouço por ${crime}. Pena: ${Math.round(hours / 24) || 1} dia(s).`],
        ["Professor L", "Ah, companhia. Que horror. Não encoste nas grades, elas são minhas."],
        ["", "Fique de frente para as grades e aperte E para cumprir a pena, tentar fugir ou falar com o vizinho."],
      ]),
    500,
  );
}
function jailLeft() {
  return player.jail ? Math.max(0, Math.ceil((player.jail.until - (player.day * 1440 + player.clock)) / 60)) : 0;
}
function jailMenu() {
  const left = jailLeft();
  const opts = [
    {
      t: `Cumprir a pena (${left}h)`,
      icon: "zzz",
      fn: () => {
        passTime(left, "Os dias passam devagar no calabouço...");
        say([["Carcereiro", "Pena cumprida. Some daqui e não volte."]], leaveJail);
      },
    },
    {
      t: !lifeMode() ? "Fugir com magia" : itemCount("facao") ? "Tentar fugir (forçar a fechadura)" : "Tentar fugir",
      icon: "door",
      fn: () => {
        const ch = !lifeMode() ? 0.55 : 0.18;
        if (Math.random() < ch) {
          repAdd(-5);
          player.hatedUntil = Math.max(player.hatedUntil || 0, player.day + 3);
          vilaNews(`${player.name} fugiu do calabouço!`);
          say([["", !lifeMode() ? "Você derrete a fechadura com uma faísca de fogo e sai pelo corredor escuro." : "A fechadura cede com um clique. Você corre pelo corredor sem olhar para trás!"], ["Professor L", "Tchau. Você fazia muito barulho mesmo."]], leaveJail);
        } else {
          player.jail.until += 24 * 60;
          say([["Carcereiro", "Tentando fugir, é? Mais um dia de pena!"], ["Professor L", "Hahaha. Amador."]]);
        }
      },
    },
    { t: "Falar com o vizinho de cela", icon: "chat", fn: profLMenu },
    { t: "Fechar", fn: null },
  ];
  choice(`Cela do calabouço`, `Crime: ${player.jail ? player.jail.crime : "—"}. Faltam ${left}h de pena.`, opts);
}
function profLMenu() {
  game.pieAnchor = game.jailA ? { x: game.jailA.prof.x, y: game.jailA.prof.y } : null;
  player.famDay.profL = (player.famDay.profL || 0) + 1;
  choice("Professor L", "Careca, pálido, olhos pretos como carvão. Ninguém sabe o nome dele nem por que está preso.", [
    { t: "Conversar", icon: "chat", fn: () => (lifeMode() && addNeed("fun", -6), say([["Professor L", pk(PROF_L_LINES)], ["Professor L", pk(PROF_L_LINES)]])) },
    { t: "Perguntar o nome dele", icon: "scroll", fn: () => say([["Professor L", pk(["Professor L. O L é de... não é da sua conta.", "Nomes são para quem quer ser lembrado. Eu quero ser temido.", "Já tive um nome. Deixei numa sala de aula, junto com a paciência."])]]) },
    { t: "Perguntar por que ele está preso", icon: "eye", fn: () => say([["Professor L", pk(["Pergunte ao General Marcos. Ah, ele não vai contar. Ninguém conta.", "Fui preso por ser certo demais num mundo errado. Ou por causa do episódio do giz. Um dos dois.", "Por que você acha? Olha pra mim. Eu pareço inocente?", "Se eu contar, vou ter que corrigir a sua redação depois. Não."])], ["", "Ninguém sabe. Nem os guardas. Nem os registros do castelo."]]) },
    { t: "Jogar lixo nele também", icon: "anger", fn: () => (throwTrash("player"), addFriendship("marcos", 2), say([["Professor L", "Original. Muito original. Tirou essa ideia de onde, de um guarda?"]])) },
    { t: "Dar um pão para ele", icon: "gift", fn: () => say([["Professor L", "Pão francês? Eu queria integral. *come assim mesmo, fazendo barulho*"]]) },
    { t: "Matar…", icon: "skull", fn: () => (player.jail ? say([["", "Tem grades entre vocês. Ainda bem para ele."]]) : killMenu("profL")) },
    { t: "Sair", fn: null },
  ]);
}
function throwTrash(from) {
  const J = game.jailA;
  if (!J) return;
  const kinds = ["banana", "osso", "peixe", "maçã", "papel"];
  J.trash.push({ x: J.prof.x - 2 + Math.floor(Math.random() * 5), y: J.prof.y - 1 + Math.floor(Math.random() * 2), k: pk(kinds) });
  if (J.trash.length > 14) J.trash.shift();
  player.jailTrash = J.trash;
  J.stink = 1;
  playSound(160, 0.08, "square");
}
function jailTick(dt) {
  if (player.zone !== "calabouco" || !game.jailA) return;
  const J = game.jailA;
  const g = J.guard;
  for (const a of [J.prof, J.other, g]) {
    a.rx += (a.x - a.rx) * Math.min(1, dt * 7);
    a.ry += (a.y - a.ry) * Math.min(1, dt * 7);
  }
  // Ronda do guarda: para na cela do Professor L e joga lixo.
  if (g.pause > 0) g.pause -= dt;
  else {
    g.step -= dt;
    if (g.step <= 0) {
      g.step = 0.45;
      if (g.x + g.v < 2 || g.x + g.v > JAIL.w - 3) g.v *= -1;
      g.x += g.v;
      g.dir = g.v > 0 ? "right" : "left";
      if (g.x === J.prof.x) {
        g.pause = 3;
        g.dir = "up";
        game.shouts = (game.shouts || []).concat([{ x: g.x, y: g.y, txt: pk(PROF_L_TRASH), t: 2.6 }]);
        throwTrash("guard");
        setTimeout(() => game.jailA && (game.shouts = (game.shouts || []).concat([{ x: J.prof.x, y: J.prof.y, txt: pk(PROF_L_REACT), t: 3 }])), 1400);
      }
    }
  }
  // O Professor L deixa tudo mais desagradável.
  J.prof.t -= dt;
  if (J.prof.t <= 0) {
    J.prof.t = 7 + Math.random() * 7;
    if (Math.random() < 0.6) game.shouts = (game.shouts || []).concat([{ x: J.prof.x, y: J.prof.y, txt: pk(PROF_L_LINES), t: 3.4 }]);
    J.prof.dir = pk(["down", "left", "right"]);
    if (lifeMode()) addNeed("fun", -3);
  }
  if (J.stink > 0) J.stink -= dt * 0.05;
  // Pena cumprida sozinha (o tempo passa).
  if (player.jail && jailLeft() <= 0 && !game.dialog && game.mode === "world") say([["Carcereiro", "Pena cumprida. Pode ir."]], leaveJail);
}
function drawJail(t) {
  const J = game.jailA;
  if (!J) return;
  const T = TILE;
  // Grades na frente das celas.
  for (let x = 1; x < JAIL.w - 1; x++) {
    if ([6, 12, 18].includes(x)) continue;
    const X = x * T,
      Y = JAIL.barsY * T;
    ctx.fillStyle = "#2a2420";
    ctx.fillRect(X, Y, T, T);
    ctx.fillStyle = "#3a3a44";
    ctx.fillRect(X, Y + 2, T, 4);
    ctx.fillRect(X, Y + T - 6, T, 4);
    for (let k = 0; k < 4; k++) {
      ctx.fillStyle = "#6a6a78";
      ctx.fillRect(X + 3 + k * 8, Y - 2, 3, T + 2);
      ctx.fillStyle = "#9a9aaa";
      ctx.fillRect(X + 3 + k * 8, Y - 2, 1, T + 2);
    }
  }
  // Tochas.
  for (const x of [3, 10, 16]) {
    const X = x * T + 14,
      Y = 5 * T + 4;
    ctx.fillStyle = "#5a3a22";
    ctx.fillRect(X, Y, 4, 10);
    ctx.fillStyle = "#ff9a3c";
    ctx.beginPath();
    ctx.arc(X + 2, Y - 2 + Math.sin(t * 9 + x), 4, 0, 7);
    ctx.fill();
    const gl = ctx.createRadialGradient(X + 2, Y, 2, X + 2, Y, 60);
    gl.addColorStop(0, "rgba(255,170,80,.25)");
    gl.addColorStop(1, "rgba(255,170,80,0)");
    ctx.fillStyle = gl;
    ctx.fillRect(X - 60, Y - 60, 120, 120);
  }
  // Escada de saída.
  {
    const X = JAIL.exit[0] * T,
      Y = (JAIL.h - 2) * T;
    for (let k = 0; k < 4; k++) {
      ctx.fillStyle = k % 2 ? "#6a655b" : "#8f897d";
      ctx.fillRect(X + 2, Y + k * 8, T - 4, 7);
    }
  }
  // Lixo na cela do Professor L.
  const col = { banana: "#f2d24e", osso: "#efe8da", peixe: "#8aa0b4", maçã: "#a84a3a", papel: "#d8d0c2" };
  for (const s of J.trash) {
    ctx.fillStyle = col[s.k];
    const X = s.x * T + 10,
      Y = s.y * T + 22;
    if (s.k === "banana") (ctx.fillRect(X, Y, 10, 3), ctx.fillRect(X + 8, Y - 3, 3, 3));
    else if (s.k === "osso") (ctx.fillRect(X, Y, 12, 3), ctx.fillRect(X - 2, Y - 1, 3, 5), ctx.fillRect(X + 11, Y - 1, 3, 5));
    else if (s.k === "peixe") (ctx.fillRect(X, Y, 10, 4), ctx.fillRect(X + 10, Y - 2, 3, 8));
    else ctx.fillRect(X, Y, 7, 6);
  }
  // Fedor.
  for (let k = 0; k < Math.min(6, J.trash.length); k++) {
    ctx.globalAlpha = 0.25 + Math.max(0, J.stink) * 0.3;
    ctx.fillStyle = "#7ab04a";
    const ph = (t * 0.6 + k * 0.37) % 1;
    ctx.beginPath();
    ctx.arc(J.prof.x * T + 4 + k * 6, J.prof.y * T + 20 - ph * 40, 4 + ph * 4, 0, 7);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}
/* Desenho dos presos e do guarda (com o resto dos personagens). */
{
  const drawBase = crewDrawList;
  crewDrawList = function (list, t) {
    drawBase(list, t);
    if (player.zone === "calabouco" && game.jailA) {
      const J = game.jailA;
      list.push({ y: -5, draw: () => drawJail(t) });
      list.push({ y: J.prof.ry, draw: () => drawSprite(heroRects(PROF_L_LOOK, J.prof.dir, null, 0), J.prof.rx * TILE, J.prof.ry * TILE, 2, J.prof.dir === "left") });
      list.push({ y: J.other.ry, draw: () => drawSprite(wizardRects(J.other.robe, null, J.other.hair, null, J.other.dir, 0), J.other.rx * TILE, J.other.ry * TILE + 5, 2, true) });
      const tm = NPCS.tome || { robe: "#4a5a7a", hat: "#3a3a4a", hair: "#3a2414" };
      list.push({ y: J.guard.ry, draw: () => drawSprite(wizardRects(tm.robe, tm.hat, tm.hair, null, J.guard.dir, walkFrame(J.guard.pause <= 0, t)), J.guard.rx * TILE, J.guard.ry * TILE, 2, J.guard.dir === "left") });
    }
    // Túmulos atrás do Templo da Luz.
    if (player.zone === "vila" && player.dead && Object.keys(player.dead).length) list.push({ y: -4, draw: () => drawGraves() });
  };
}
function graveSpots() {
  if (game.graves && game.graves.n === Object.keys(player.dead).length) return game.graves.s;
  const out = [];
  for (let y = 36; y < 46 && out.length < 40; y++) for (let x = 13; x < 18 && out.length < 40; x++) if (tileAt("vila", x, y) === ".") out.push([x, y]);
  game.graves = { n: Object.keys(player.dead).length, s: out };
  return out;
}
function drawGraves() {
  const spots = graveSpots();
  Object.keys(player.dead).forEach((id, i) => {
    const s = spots[i];
    if (!s) return;
    const X = s[0] * TILE + 8,
      Y = s[1] * TILE + 4;
    ctx.fillStyle = "rgba(0,0,0,.25)";
    ctx.fillRect(X - 2, Y + 22, 20, 4);
    ctx.fillStyle = "#8f897d";
    ctx.fillRect(X, Y + 6, 16, 18);
    ctx.beginPath();
    ctx.arc(X + 8, Y + 7, 8, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = "#6a655b";
    ctx.fillRect(X + 7, Y + 4, 2, 10);
    ctx.fillRect(X + 4, Y + 7, 8, 2);
    ctx.fillStyle = "#ff6b8a";
    ctx.fillRect(X + 2, Y + 22, 3, 3);
  });
}
/* Interação dentro do calabouço: grades, saída e o Professor L. */
{
  const tgtBase = targetAt;
  targetAt = function (x, y) {
    if (player.zone === "calabouco" && game.jailA) {
      const J = game.jailA;
      if (x === J.prof.x && y === J.prof.y) return "Professor L";
      if (y === JAIL.barsY && player.jail) return "Grades da cela";
      if (y === JAIL.barsY && Math.abs(x - J.prof.x) <= 2) return "Falar com o Professor L";
      if (x === JAIL.exit[0] && y === JAIL.h - 2 && !player.jail) return "Subir para o castelo";
      if (x === J.guard.x && y === J.guard.y) return "Guarda da ronda";
    }
    return tgtBase(x, y);
  };
  const interBase = interactAt;
  interactAt = function (x, y) {
    if (player.zone === "calabouco" && game.jailA) {
      const l = targetAt(x, y);
      if (l === "Grades da cela") return jailMenu();
      if (l === "Professor L" || l === "Falar com o Professor L") return profLMenu();
      if (l === "Subir para o castelo") return leaveJail();
      if (l === "Guarda da ronda") return say([["Guarda", pk(["Ordens do General Marcos: lixo pro Professor L a cada ronda. Não pergunte.", "Ninguém sabe o nome dele. Nem por que está aqui. O General só diz: 'Joga mais lixo.'", "Esse Professor L me corrigiu a gramática três vezes hoje. TRÊS."])]]);
    }
    return interBase(x, y);
  };
}
/* Visitar o calabouço: fale com o Guarda Tomé. O General Marcos odeia o Professor L. */
{
  const itemsBase = lifeSocialItems;
  lifeSocialItems = function (id) {
    const items = itemsBase(id);
    if (id === "tome") items.push({ t: "Visitar o calabouço", icon: "lock", fn: () => say([["Guarda Tomé", "Quer ver os presos? Cuidado com o da cela do meio. Ele... incomoda."]], () => enterJail(false)) });
    if (id === "marcos")
      items.push({
        t: "Perguntar sobre o Professor L",
        icon: "eye",
        fn: () => say([["General Marcos", pk(["Não fale esse nome perto de mim.", "Aquele careca insuportável? Lixo a cada ronda. É o mínimo.", "Por que ele está preso? ...Isso é assunto do General. Próxima pergunta.", "Ele sabe o que fez. EU sei o que ele fez. E isso basta."])], ["", "O General cerra os punhos. Ninguém sabe a história."]]),
      });
    return items;
  };
}
/* A prisão do golpe agora também é no calabouço. */
if (typeof arrested === "function") {
  arrested = function (who) {
    const fine = Math.min(player.gold, 300);
    player.gold -= fine;
    repAdd(-25);
    player.plot = null;
    if (FRIENDS.rainha) player.rel.rainha = 0;
    vilaNews(`${player.name} foi pres${genderWord("o", "a", "e")} por conspirar contra a coroa!`);
    say([["Guarda Tomé", `${who ? who + " contou tudo. " : ""}${player.name}, você está pres${genderWord("o", "a", "e")} por traição à coroa!`], ["", `Multa de ${fine} de ouro e masmorra.`]], () => startJail(36, "traição à coroa"));
    saveGame();
  };
}

/* ===================== GOLPE PARA QUALQUER UM ===================== */

rulesK = (k) => !!throne()[k];
{
  const plotBase = plotMenu;
  plotMenu = function () {
    // Sem idade mínima e nos dois modos.
    const life = lifeMode,
      age = playerAge;
    lifeMode = () => true;
    playerAge = () => 30;
    try {
      plotBase();
    } finally {
      lifeMode = life;
      playerAge = age;
    }
  };
  // No modo História, o Luca, o Lucas e a Rainha também abrem a conspiração.
  const itemsBase = lifeSocialItems;
  lifeSocialItems = function (id) {
    const items = itemsBase(id);
    if (!lifeMode() && ["luca", "lucas"].includes(id) && !rulesK("aurelia")) items.push({ t: player.plot ? "Falar da conspiração" : "Propor um golpe de estado 👑", icon: "crown", fn: plotMenu });
    if (!lifeMode() && rulesK("aurelia") && id === "tome") items.push({ t: "Governar o reino", icon: "crown", fn: royalMenu });
    return items;
  };
}

/* ===================== LIGAÇÕES ===================== */

{
  const updBase = update;
  update = function (dt) {
    updBase(dt);
    if (game.mode === "title") return;
    purgeDead();
    if (player.zone === "calabouco" && !game.jailA) enterJail(!!player.jail);
    if (game.mode === "world" && !game.dialog) {
      jailTick(dt);
      hateShouts(dt);
      villainOrders(dt);
      if (game.pendingMurder && ZONES[player.zone] && ZONES[player.zone].town && player.zone !== "calabouco") {
        const id = game.pendingMurder;
        game.pendingMurder = null;
        murderFound(id);
      }
      // Preso não sai da cela andando.
      if (player.jail && player.zone !== "calabouco") enterJail(true);
      if (player.jail && player.zone === "calabouco" && player.y > JAIL.barsY - 1) [player.x, player.y] = JAIL.cellA;
    }
  };
}
ACHIEVEMENTS.push(["profL", "O vizinho insuportável", "Converse com o Professor L no calabouço.", "lock", () => (player.famDay && player.famDay.profL) > 0 || !!player.metProfL]);
