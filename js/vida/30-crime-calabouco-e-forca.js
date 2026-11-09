/* 30-crime-calabouco-e-forca.js: junta 46-morte-e-calabouco.js, 47-crime-e-memoria.js, 48-pena-de-morte.js. */
/**
 * ECOS DO ARCANO — 30-crime-calabouco-e-forca.js
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

/* ======================================================================
   (antes: 47-crime-e-memoria.js)
   ====================================================================== */

/**
 * ECOS DO ARCANO — 30-crime-calabouco-e-forca.js
 *  - O corpo fica no chão, com sangue, onde a pessoa morreu. Quem passar perto
 *    grita e chama a guarda. Dá para esconder, revistar os bolsos ou fingir que achou.
 *  - Ladrão: bater carteira, furtar das lojas e arrombar casas à noite.
 *  - Sonegador: deixe de pagar o Imposto Real, esconda os bens do coletor e
 *    torça para o Fiscal da Coroa não aparecer.
 *  - Menu do crime (tecla X ou ☰ → Crime).
 *  - NPCs com memória: lembram do que você fez (presentes, ajuda, insultos,
 *    furtos), contam uns aos outros e falam disso com você. Também reparam
 *    quando você está com fome, cansado ou sendo procurado.
 *  - Mais de 200 interações novas, com as categorias Malandragem e Ideias.
 */


/* ===================== MEMÓRIA DOS NPCs ===================== */

function memOf(id) {
  player.mem = player.mem || {};
  return (player.mem[id] = player.mem[id] || []);
}
/** Guarda uma lembrança: k = presente, ajuda, elogio, insulto, flerte, furto, viu_crime, ouviu... */
function remember(id, k, what) {
  if (!id || !NPCS[id]) return;
  const m = memOf(id);
  m.push({ k, d: player.day, w: what || "" });
  if (m.length > 12) m.shift();
}
function memHas(id, k, days = 30) {
  return memOf(id).some((e) => e.k === k && player.day - e.d <= days);
}
function memLast(id, kinds) {
  const m = memOf(id).filter((e) => kinds.includes(e.k));
  return m[m.length - 1];
}
const BAD_MEM = ["furto", "insulto", "viu_crime", "ouviu_crime", "arrombou", "sonegou"];
/* As interações viram lembranças. */
{
  const doBase = doInteraction;
  doInteraction = function (id, key) {
    const r = INTER_BY_KEY[key];
    const res = doBase(id, key);
    const cat = r && r[1];
    if (cat === "mal") remember(id, "insulto", r[2]);
    else if (cat === "ajuda") remember(id, "ajuda", r[2]);
    else if (cat === "amor" || cat === "cor") remember(id, "flerte", r[2]);
    else if (cat === "elog" || cat === "amigo") remember(id, "elogio", r[2]);
    else if (cat === "crime") remember(id, "malandro", r[2]);
    return res;
  };
  const giftBase = giftMenu;
  giftMenu = function (id) {
    const inv = JSON.stringify(player.inv);
    giftBase(id);
    // Se o presente for entregue na hora, a bolsa muda: anota.
    setTimeout(() => JSON.stringify(player.inv) !== inv && remember(id, "presente"), 50);
  };
}
/* Fofoca: quem conversa conta para o outro o que sabe de você. */
{
  const convBase = startConv;
  startConv = function (parts, lines, opt) {
    const ok = convBase(parts, lines, opt);
    if (ok) {
      const ids = parts.map((p) => p.id).filter((id) => id && NPCS[id]);
      for (const a of ids)
        for (const b of ids)
          if (a !== b) {
            const bad = memLast(a, BAD_MEM);
            if (bad && !memHas(b, "ouviu_crime", 10) && Math.random() < 0.7) remember(b, "ouviu_crime", bad.w || bad.k);
            const good = memLast(a, ["presente", "ajuda"]);
            if (good && Math.random() < 0.3) remember(b, "ouviu_bem", good.w);
          }
    }
    return ok;
  };
}
/* As falas usam as lembranças. */
{
  const voceBase = TOPICS.voce;
  TOPICS.voce = function (id) {
    if (id && NPCS[id] && Math.random() < 0.65) {
      const n = player.name;
      const e = memLast(id, ["furto", "arrombou", "insulto", "viu_crime", "ouviu_crime", "presente", "ajuda", "elogio", "flerte", "ouviu_bem", "sonegou"]);
      if (e) {
        const ago = player.day - e.d;
        const quando = ago === 0 ? "hoje" : ago === 1 ? "ontem" : `faz ${ago} dias`;
        const L = {
          furto: [`Eu sei que foi você que mexeu no meu bolso ${quando}, ${n}.`, "Tô de olho na minha bolsa quando você chega perto.", "Me devolve o que você pegou e a gente conversa."],
          arrombou: ["Alguém arrombou a minha casa. E você estava rondando...", `Troquei a fechadura depois ${quando === "hoje" ? "de hoje" : "daquele dia"}. Só avisando.`],
          insulto: [`Ainda tô chateado com o que você disse ${quando}.`, "Aquilo que você falou... doeu, viu?", "Você me deve um pedido de desculpas."],
          viu_crime: ["Eu vi o que você fez. Não esqueço.", "Fico longe de você. Eu vi tudo."],
          ouviu_crime: [`Me contaram umas coisas sobre você, ${n}...`, "A vila inteira tá falando de você. E não é coisa boa.", "Dizem por aí que você não presta. É verdade?"],
          presente: [`Ainda tô usando aquele presente que você me deu ${quando}!`, "Você é a pessoa que mais me dá presente nessa vila. Obrigado!", "Toda vez que olho pro seu presente eu lembro de você."],
          ajuda: [`Obrigado de novo pela ajuda ${quando}. Te devo uma.`, "Você me ajudou quando eu precisei. Não esqueço disso.", "Se precisar de alguma coisa, me chama. É o mínimo."],
          elogio: [`Fiquei o dia todo feliz com o que você disse ${quando}.`, "Você sempre tem uma palavra boa. Gosto disso."],
          flerte: ["Fiquei pensando naquilo que você falou... *cora*", `Aquele seu jeito ${quando}... ainda tô sem graça.`],
          ouviu_bem: [`Falaram bem de você pra mim, ${n}!`, "Dizem que você é gente boa. Tô vendo que é."],
          sonegou: ["Dizem que você não paga imposto. Corajos" + genderWord("o", "a", "e") + ".", "Sonegar o Imposto Real? Eu é que não conto pro fiscal."],
        }[e.k];
        if (L) return pk(L);
      }
      if (lifeMode()) {
        if (lifeNeed("hunger") < 25) return pk([`Você tá com uma cara de fome, ${n}. Come alguma coisa!`, "Ouvi sua barriga roncando daqui. Passa na padaria!"]);
        if (lifeNeed("energy") < 20) return pk(["Você tá com olheira até o queixo. Vai dormir!", "Você mal para em pé. Descansa um pouco."]);
        if (lifeNeed("hygiene") < 20) return pk(["Hm... desculpa a sinceridade, mas um banho ia bem.", "*tampa o nariz discretamente*"]);
      }
      if (player.job && Math.random() < 0.3) return `E o trabalho, ${n}? Tá dando pra pagar as contas?`;
      if (player.spouse && Math.random() < 0.3) return `Manda um abraço pr${gw(player.spouse, "o", "a")} ${shortName(player.spouse)}!`;
    }
    return voceBase(id);
  };
}
/* Quem sabe dos seus crimes desconfia e cobra mais caro. */
{
  const angryBase = angry;
  angry = (id) => angryBase(id) || (memHas(id, "furto", 5) || memHas(id, "arrombou", 5));
}
/* Moradores que reparam em você e vêm falar. */
if (typeof NPC_INITS !== "undefined") {
  NPC_INITS.cuidado = {
    w: 3,
    ok: () => lifeMode() && (lifeNeed("hunger") < 30 || lifeNeed("thirst") < 30 || lifeNeed("energy") < 25),
    text: (n) => pk([`${n} chega preocupado: "Você não tá bem. Toma, come alguma coisa."`, `${n} segura seu braço: "Você tá pálid${genderWord("o", "a", "e")}! Senta aqui um pouco."`]),
    opts: (id, n) => [
      { t: "Aceitar (comer e beber)", icon: "bread", fn: () => (addNeed("hunger", 30), addNeed("thirst", 25), addFriendship(id, 4), remember(id, "ajudou_voce"), say([[n, "Assim é melhor. Se cuida, viu?"]])) },
      { t: "Dizer que está tudo bem", icon: "smile", fn: () => say([[n, "Tá bom... mas não some, hein."]]) },
    ],
  };
  NPC_INITS.aviso = {
    w: 4,
    ok: (id) => friendship(id) >= 40 && (hated() || (player.plot && player.plot.sus > 50) || (player.evaded || 0) > 300 || (player.thefts || 0) >= 3),
    text: (n) =>
      hated()
        ? `${n} cochicha: "A vila toda está contra você. Tome cuidado por onde anda."`
        : player.plot && player.plot.sus > 50
          ? `${n} puxa você num canto: "A guarda anda perguntando de você. Sobre uma tal conspiração..."`
          : (player.evaded || 0) > 300
            ? `${n} cochicha: "O Fiscal da Coroa perguntou de você ontem. Arruma esses impostos!"`
            : `${n} avisa baixinho: "Tem gente dizendo que você anda pegando o que não é seu. Cuidado."`,
    opts: (id, n) => [
      { t: "Agradecer o aviso", icon: "heart", fn: () => (addFriendship(id, 4), say([[n, "Amigo é pra isso."]])) },
      { t: "Pedir para ficar de bico calado", icon: "lock", fn: () => (addFriendship(id, 1), say([[n, "Eu não vi nada. Nem ouvi nada."]])) },
    ],
  };
  NPC_INITS.fofoca = {
    w: 3,
    ok: (id) => hasTrait(id, "fofoqueiro") || hasTrait(id, "extro"),
    text: (n) => `${n} se aproxima com cara de quem tem novidade: "${genLine(null, (player.news || []).length ? "noticia" : "casal")}"`,
    opts: (id, n) => [
      { t: "Quero saber mais!", icon: "chat", fn: () => (addFriendship(id, 3), say([[n, genLine(id, pk(["casal", "turma", "lucas"]))], [n, genLine(id)]])) },
      { t: "Não gosto de fofoca", icon: "meh", fn: () => (addFriendship(id, -1), say([[n, "Hmpf. Você que perde."]])) },
    ],
  };
  NPC_INITS.memoria = {
    w: 3,
    ok: (id) => memOf(id).length > 0,
    text: (n, id) => `${n} lembra de você: "${TOPICS.voce(id)}"`,
    opts: (id, n) => [
      { t: "Conversar sobre isso", icon: "chat", fn: () => (addFriendship(id, 2), say([[n, genLine(id)]])) },
      { t: "Mudar de assunto", icon: "meh", fn: () => say([[n, "Tá, tá. Outro dia a gente fala."]]) },
    ],
  };
  // text(n) recebe só o nome: guarda o id da vez para a lembrança.
  const initBase = npcInitiate;
  npcInitiate = function () {
    const textMem = NPC_INITS.memoria.text;
    const cands = typeof initCandidates === "function" ? initCandidates() : [];
    if (cands.length) {
      const c = cands[0];
      NPC_INITS.memoria.text = (n) => textMem(n, c.id);
    }
    try {
      initBase();
    } finally {
      NPC_INITS.memoria.text = textMem;
    }
  };
}

/* ===================== O CORPO NO CHÃO ===================== */

function victimPos(id) {
  if (player.zone === "interior" && game.inter) {
    const p = (game.inter.people || []).find((q) => q.cid === id);
    if (p) return { zone: "interior", x: p.x, y: p.y, inter: game.inter.b && game.inter.b.name };
  }
  const a = game.crewA && game.crewA[id];
  if (a && player.zone === "vila" && !a.inside) return { zone: "vila", x: a.x, y: a.y };
  const r = (game.roam || []).find((q) => q.id === id);
  if (r) return { zone: player.zone, x: r.x, y: r.y };
  const z = ZONES[player.zone];
  const e = z && z.npcList && z.npcList.find((q) => q[2] === id);
  if (e) return { zone: player.zone, x: e[0], y: e[1] + 1 };
  // Sem lugar certo: cai do lado de quem matou.
  const [dx, dy] = DIR_VECTORS[player.dir] || [0, 1];
  return { zone: player.zone, x: player.x + dx, y: player.y + dy, inter: game.inter && game.inter.b && game.inter.b.name };
}
{
  const killBase = killNpc;
  killNpc = function (id, how) {
    const pos = victimPos(id);
    killBase(id, how);
    const d = deadList()[id];
    if (d) Object.assign(d, { pos, bodyT: player.day * 1440 + player.clock, robbed: false });
  };
}
function bodyHere(d) {
  if (!d || !d.pos || d.hidden || d.bodyGone) return false;
  if (d.pos.zone !== player.zone) return false;
  if (d.pos.zone === "interior") return !!(game.inter && game.inter.b && game.inter.b.name === d.pos.inter);
  return true;
}
function bodies() {
  return Object.entries(player.dead || {}).filter(([, d]) => bodyHere(d));
}
function bodyAt(x, y) {
  const b = bodies().find(([, d]) => d.pos.x === x && d.pos.y === y);
  return b ? b[0] : null;
}
function drawBody(id, d, t) {
  const n = NPCS[id];
  if (!n) return;
  const X = d.pos.x * TILE,
    Y = d.pos.y * TILE;
  const age = Math.min(1.3, (player.day * 1440 + player.clock - (d.bodyT || 0)) / 30 + 0.75);
  // Poça de sangue que vai crescendo.
  if (d.how !== "veneno") {
    ctx.fillStyle = "rgba(120,10,14,.88)";
    ctx.beginPath();
    ctx.ellipse(X + 16, Y + 24, 18 * age + 4, 8 * age + 3, 0.12, 0, 7);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(X + 30, Y + 28, 6 * age, 3 * age, 0, 0, 7);
    ctx.fill();
    ctx.fillStyle = "rgba(170,20,24,.9)";
    ctx.beginPath();
    ctx.ellipse(X + 14, Y + 22, 8 * age + 2, 3.5 * age + 1, -0.2, 0, 7);
    ctx.fill();
    ctx.fillStyle = "rgba(90,6,10,.8)";
    for (const [a, b] of [
      [-8, 6],
      [26, 2],
      [30, 10],
    ])
      ctx.fillRect(X + a + 4, Y + 18 + b, 3, 2);
  } else {
    ctx.fillStyle = "rgba(90,160,60,.5)";
    ctx.beginPath();
    ctx.ellipse(X + 10, Y + 24, 6, 3, 0, 0, 7);
    ctx.fill();
  }
  // O corpo deitado (o sprite girado de lado).
  ctx.save();
  ctx.translate(X + 16, Y + 22);
  ctx.rotate(-Math.PI / 2);
  ctx.globalAlpha = 0.95;
  drawSprite(wizardRects(n.robe, n.hat, n.hair, null, "down", 0), -16, -16, 2, false);
  ctx.restore();
  // Olhos em X.
  ctx.fillStyle = "#2a0a0a";
  for (const [a, b] of [
    [5, 13],
    [5, 19],
  ]) {
    ctx.fillRect(X + a, Y + b, 3, 1);
    ctx.fillRect(X + a + 1, Y + b - 1, 1, 3);
  }
  if (Math.sin(t * 3) > 0.6) {
    ctx.fillStyle = "#1a1a1a";
    ctx.fillRect(X + 22 + Math.sin(t * 9) * 4, Y + 6 + Math.cos(t * 7) * 3, 2, 2);
  }
}
{
  const drawBase = crewDrawList;
  crewDrawList = function (list, t) {
    drawBase(list, t);
    for (const [id, d] of bodies()) list.push({ y: d.pos.y - 0.3, draw: () => drawBody(id, d, t) });
  };
  const charBase = characterAt;
  characterAt = (x, y) => !!bodyAt(x, y) || charBase(x, y);
  const tgtBase = targetAt;
  targetAt = function (x, y) {
    const id = bodyAt(x, y);
    if (id) return `Corpo de ${shortName(id)}`;
    return tgtBase(x, y);
  };
  const interBase = interactAt;
  interactAt = function (x, y) {
    const id = bodyAt(x, y);
    if (id) return bodyMenu(id);
    return interBase(x, y);
  };
}
function bodyMenu(id) {
  const d = deadList()[id];
  const n = shortName(id);
  game.pieAnchor = { x: d.pos.x, y: d.pos.y };
  const opts = [
    { t: "Esconder o corpo", icon: "eye", fn: () => ((d.hidden = true), passTime(1, `Você arrasta o corpo de ${n} para um canto escuro...`), saveGame(), toast("Corpo escondido.", 2000)) },
  ];
  if (!d.robbed)
    opts.push({
      t: "Revistar os bolsos",
      icon: "coin",
      fn: () => {
        d.robbed = true;
        const g = 5 + Math.floor(Math.random() * 55);
        player.gold += g;
        player.thefts = (player.thefts || 0) + 1;
        saveGame();
        say([["", `Você encontra ${g} de ouro${Math.random() < 0.3 ? " e uma carta de amor amassada" : ""} nos bolsos de ${n}.`]]);
      },
    });
  opts.push({
    t: "Gritar por socorro (fingir que achou)",
    icon: "chat",
    fn: () => {
      d.bodyGone = true;
      d.reported = true;
      const killedByYou = !d.byOther;
      if (killedByYou && Math.random() < 0.35) return say([["Guarda Tomé", "Achou o corpo, é? Engraçado... tem sangue na sua roupa."]], () => murderFound(id));
      repAdd(2);
      if (killedByYou) d.cleared = true;
      vilaNews(`Encontraram o corpo de ${n}! A guarda investiga.`);
      saveGame();
      say([["Guarda Tomé", `Obrigado por avisar. Vamos levar o corpo de ${n}. Se lembrar de alguma coisa, me procure.`]]);
    },
  });
  opts.push({ t: "Sair dali", fn: null });
  choice(`Corpo de ${n}`, d.how === "veneno" ? "Lábios roxos, olhos abertos. Cheiro de amêndoas." : "Muito sangue no chão. Melhor não ficar muito tempo aqui.", opts);
}
/* Quem passa perto de um corpo grita e chama a guarda. */
let bodyAcc = 0;
function bodyWatch(dt) {
  bodyAcc += dt;
  if (bodyAcc < 1) return;
  bodyAcc = 0;
  for (const [id, d] of bodies()) {
    const near = (o) => o && Math.abs(o.x - d.pos.x) + Math.abs(o.y - d.pos.y) <= 3;
    const seers = [];
    for (const w of game.walkers || []) if (!(w.inside > 0) && near(w)) seers.push(w);
    for (const r of game.roam || []) if (near(r)) seers.push(r);
    for (const a of Object.values(game.crewA || {})) if (player.zone === "vila" && crewVisible(a) && near(a)) seers.push(a);
    if (player.zone === "interior" && game.inter) seers.push(...(game.inter.people || []).filter((p) => !isDead(p.cid)));
    // Ninguém achou em meio dia: a guarda acha sozinha.
    const old = player.day * 1440 + player.clock - (d.bodyT || 0) > 12 * 60;
    if (!seers.length && !old) continue;
    const s = seers[0];
    d.bodyGone = true;
    vilaNews(`Acharam o corpo de ${shortName(id)}! Que horror!`);
    if (s) {
      game.shouts = (game.shouts || []).concat([{ x: s.x, y: s.y, txt: pk(["AAAAAH! UM CORPO!", "SOCORRO! Tem alguém morto aqui!", "Chamem a guarda! Mataram " + shortName(id) + "!", "Minha nossa... é " + shortName(id) + "!"]), t: 3 }]);
      if (s.id || s.cid) remember(s.id || s.cid, "viu_corpo", shortName(id));
      for (const w of game.walkers || []) if (Math.abs(w.x - d.pos.x) + Math.abs(w.y - d.pos.y) <= 7) w.flee = 4;
    }
    playSound(140, 0.4, "sawtooth");
    game.shake = 0.2;
    const youNear = Math.abs(player.x - d.pos.x) + Math.abs(player.y - d.pos.y) <= 6;
    if (!d.found && !d.cleared && youNear && Math.random() < 0.55) {
      setTimeout(() => say([[s && s.nm ? s.nm : "Morador", "Foi você! Eu vi você perto do corpo!"]], () => murderFound(id)), 1500);
    } else d.lead = (d.lead || 0) + 1;
    saveGame();
  }
}
{
  const dayBase = onNewDay;
  onNewDay = function () {
    dayBase.apply(this, arguments);
    for (const [id, d] of Object.entries(player.dead || {})) {
      if (d.found || d.cleared || !d.lead) continue;
      if (Math.random() < 0.15 * d.lead) {
        game.pendingMurder = id;
        break;
      }
    }
  };
}

/* ===================== LADRÃO ===================== */

function stealChance(id, base) {
  let c = base + Math.min(0.25, (player.thiefXP || 0) * 0.02);
  if (isNight()) c += 0.1;
  if (["tome", "kael", "capitao", "marcos", "guarda", "guarda2"].includes(id)) c -= 0.3;
  if (hasTrait(id, "preguicoso") || hasTrait(id, "romant")) c += 0.08;
  if (hasTrait(id, "serio") || hasTrait(id, "fofoqueiro") || hasTrait(id, "ciumento")) c -= 0.08;
  if (memHas(id, "furto") || memHas(id, "ouviu_crime")) c -= 0.25;
  c -= witnessesNear(id) * 0.04;
  if (hasTrait("player", "galanteador") || hasTrait("player", "engracado")) c += 0.05;
  return Math.max(0.05, Math.min(0.9, c));
}
function caughtStealing(id, crime, value) {
  const n = shortName(id);
  addFriendship(id, -25);
  remember(id, "furto", crime);
  repAdd(-8);
  player.caughtThefts = (player.caughtThefts || 0) + 1;
  vilaNews(`${player.name} foi pego ${crime}!`);
  const fine = withTax(Math.max(30, value * 2));
  choice(`${n} te pegou!`, `"LADRÃO! GUARDAS!" A Guarda Real chega correndo. Multa: ${fine} ouro, ou um dia no calabouço.`, [
    { t: `Pagar a multa (${fine} ouro)`, icon: "coin", off: player.gold < fine, fn: () => (player.gold >= fine ? (payWithTax(Math.max(30, value * 2)), saveGame(), say([["Guarda Tomé", "Tá pago. Da próxima vez é cela."]])) : null) },
    { t: "Ir para o calabouço (24h)", icon: "lock", fn: () => startJail(24, crime) },
    {
      t: "Sair correndo!",
      icon: "door",
      fn: () => {
        if (Math.random() < 0.35 + (player.riding ? 0.2 : 0)) {
          player.hatedUntil = Math.max(player.hatedUntil || 0, player.day + 2);
          saveGame();
          say([["", "Você corre por becos e quintais e despista a guarda! Mas agora está sendo procurad" + genderWord("o", "a", "e") + "."]]);
        } else say([["Guarda Tomé", "Achou que ia longe? Para a cela, e com pena dobrada!"]], () => startJail(48, crime + " e fuga"));
      },
    },
  ]);
}
function pickpocket(id) {
  const n = shortName(id);
  player.famDay["pick" + id] = player.day;
  if (Math.random() < stealChance(id, 0.55)) {
    const g = 4 + Math.floor(Math.random() * (CREW_ALL.includes(id) ? 45 : 30));
    player.gold += g;
    player.thefts = (player.thefts || 0) + 1;
    player.thiefXP = (player.thiefXP || 0) + 1;
    if (Math.random() < 0.25) remember(id, "furto", "bater carteira");
    saveGame();
    playSound(880, 0.05, "sine");
    return say([["", `Enquanto ${n} fala, sua mão entra e sai do bolso dele${gw(id, "", "a") ? "a" : ""}. +${g} de ouro.`], [n, pk(["...e aí eu falei pra ela: 'isso não é jeito!' Né?", "Enfim, foi isso. Por que você tá sorrindo?", "Nossa, que calor hoje, né?"])]]);
  }
  caughtStealing(id, "batendo carteira", 20);
}
/** Loja de quem vende (casa de comércio ou barraca da feira). */
function shopOfNpc(id) {
  const k = (FRIENDS[id] && FRIENDS[id].shop) || id;
  return SHOPS[k] && (SHOPS[k].items || []).length ? k : null;
}
function shoplift(id) {
  const shop = SHOPS[shopOfNpc(id)];
  if (!shop) return;
  player.famDay["lift" + id] = player.day;
  const it = pk(shop.items.filter((k) => ITEMS[k]));
  if (!it) return;
  if (Math.random() < stealChance(id, 0.5)) {
    addItem(it);
    player.thefts = (player.thefts || 0) + 1;
    player.thiefXP = (player.thiefXP || 0) + 1;
    saveGame();
    return say([["", `Você enfia ${ITEMS[it].nome} debaixo da capa e sai assobiando. Ninguém viu.`]]);
  }
  caughtStealing(id, "furtando da loja", ITEMS[it].preco || 20);
}
function burgle(b) {
  const who = (b.home || []).filter((k) => !isDead(k));
  const awake = who.filter((k) => game.crewA && game.crewA[k] && game.crewA[k].inside);
  const h = currentHour();
  if (!(h >= 22 || h < 5)) return say([["", "De dia tem gente demais olhando. Arrombar só de madrugada (22h às 5h)."]]);
  const ch = 0.6 + Math.min(0.2, (player.thiefXP || 0) * 0.02) - awake.length * 0.15;
  passTime(1, "Você força a fechadura no escuro...");
  if (Math.random() < ch) {
    const g = 20 + Math.floor(Math.random() * 90);
    player.gold += g;
    const loot = pk(["i_colar_de_perolas", "vinho", "pocaoG", "hidromel", "flor"].filter((k) => ITEMS[k]));
    if (loot && Math.random() < 0.6) addItem(loot);
    player.thefts = (player.thefts || 0) + 1;
    player.thiefXP = (player.thiefXP || 0) + 2;
    for (const k of who) if (Math.random() < 0.5) remember(k, "arrombou", b.name);
    vilaNews(`Arrombaram ${b.name || "uma casa"} de madrugada!`);
    saveGame();
    return say([["", `A porta cede sem barulho. ${awake.length ? "Alguém ronca no quarto." : "Ninguém em casa."} Você leva ${g} de ouro${loot && itemCount(loot) ? " e " + ITEMS[loot].nome : ""} e some na escuridão.`]]);
  }
  const k = awake[0] || who[0];
  if (k) return caughtStealing(k, "arrombando uma casa", 60);
  say([["", "A fechadura não cede. Um cachorro começa a latir. Melhor ir embora."]]);
}
{
  const itemsBase = lifeSocialItems;
  lifeSocialItems = function (id) {
    const items = itemsBase(id);
    if (isChildNpc(id) || isDead(id)) return items;
    if (player.famDay["pick" + id] !== player.day) items.push({ t: "Roubar: bater a carteira", icon: "coin", fn: () => pickpocket(id) });
    if (shopOfNpc(id) && player.famDay["lift" + id] !== player.day) items.push({ t: "Roubar da loja", icon: "bag", fn: () => shoplift(id) });
    return items;
  };
  const doorBase = crewDoor;
  crewDoor = function (b) {
    if (!b || !CREW_BUILDINGS.includes(b) || !(b.home || []).length) return doorBase(b);
    const h = currentHour();
    if (!(h >= 22 || h < 5)) return doorBase(b);
    choice(b.name || "Casa", "Madrugada. A rua está vazia...", [
      { t: "Bater na porta", icon: "house", fn: () => doorBase(b) },
      { t: "Roubar: arrombar a casa", icon: "lock", fn: () => burgle(b) },
      { t: "Ir embora", fn: null },
    ]);
    return true;
  };
}

/* ===================== SONEGADOR ===================== */

{
  const payBase = payWithTax;
  payWithTax = function (price) {
    if (!player.sonega) return payBase(price);
    const tax = taxOf(price);
    player.gold -= price;
    player.evaded = (player.evaded || 0) + tax;
    player.evadedTotal = (player.evadedTotal || 0) + tax;
    return 0;
  };
  const withBase = withTax;
  withTax = (price) => (player.sonega ? price : withBase(price));
  const saleBase = saleAfterTax;
  saleAfterTax = function (value) {
    const v = saleBase(value);
    if (!player.sonega || v === value) return v;
    player.evaded = (player.evaded || 0) + (value - v);
    player.evadedTotal = (player.evadedTotal || 0) + (value - v);
    return value;
  };
  const colBase = collectorTalk;
  collectorTalk = function () {
    hookChoice(colBase, (title, text, opts) => {
      const due = player.taxDue || 0;
      opts.push({
        t: "Esconder os bens e jurar que não tem nada (sonegar)",
        icon: "eye",
        fn: () => {
          const ok = Math.random() < 0.5 + (hasTrait("player", "engracado") || hasTrait("player", "galanteador") ? 0.1 : 0) - (player.taxStrikes || 0) * 0.1;
          if (ok) {
            player.evaded = (player.evaded || 0) + due;
            player.evadedTotal = (player.evadedTotal || 0) + due;
            player.taxDue = 0;
            saveGame();
            say([["Coletor", pk(["Nada? Nem um banquinho? ...Tá bom, vou anotar 'isento'. Estranho.", "Hm. Essa casa parecia ter mais móveis. Deve ser impressão minha."])], ["", `Você escondeu ${due} de ouro do Imposto Real. O Fiscal da Coroa pode desconfiar...`]]);
          } else {
            player.taxDue = Math.round(due * 2);
            repAdd(-6);
            saveGame();
            say([["Coletor", "Achei os móveis embaixo do lençol. Tentativa de sonegação! A dívida DOBROU."]]);
          }
        },
      });
      return [title, text, opts];
    });
  };
}
/* O Fiscal da Coroa aparece quando a sonegação fica grande. */
{
  const dayBase = onNewDay;
  onNewDay = function () {
    dayBase.apply(this, arguments);
    const ev = player.evaded || 0;
    if (ev > 40 && Math.random() < Math.min(0.45, ev / 1200)) setTimeout(fiscalVisit, 9000);
  };
}
function fiscalVisit() {
  if (game.mode !== "world" || game.dialog || !ZONES[player.zone] || !ZONES[player.zone].town) return setTimeout(fiscalVisit, 6000);
  const ev = player.evaded || 0;
  if (ev <= 0) return;
  const fine = Math.round(ev * 1.5);
  choice("O Fiscal da Coroa!", `"Auditoria real. Pelas minhas contas, você deixou de pagar <b>${ev} ouro</b> de Imposto Real. Multa: ${fine} ouro."`, [
    {
      t: `Pagar a multa (${fine} ouro)`,
      icon: "coin",
      off: player.gold < fine,
      fn: () => {
        if (player.gold < fine) return;
        player.gold -= fine;
        player.taxPaid = (player.taxPaid || 0) + fine;
        player.evaded = 0;
        repAdd(-3);
        saveGame();
        say([["Fiscal da Coroa", "Contas em dia. Por enquanto."]]);
      },
    },
    {
      t: `Subornar o fiscal (${Math.round(ev * 0.4)} ouro)`,
      icon: "gem",
      off: player.gold < Math.round(ev * 0.4),
      fn: () => {
        const b = Math.round(ev * 0.4);
        if (player.gold < b) return;
        player.gold -= b;
        if (Math.random() < 0.6) {
          player.evaded = Math.round(ev * 0.3);
          saveGame();
          say([["Fiscal da Coroa", "*guarda o saquinho* Hm. Devo ter errado a conta. Acontece."]]);
        } else {
          saveGame();
          say([["Fiscal da Coroa", "SUBORNO?! Em cima de sonegação?! Guardas!"]], () => startJail(48, "sonegação e suborno"));
        }
      },
    },
    {
      t: "Mentir com cara de paisagem",
      icon: "meh",
      fn: () => {
        if (Math.random() < 0.28 + (hasTrait("player", "dramatico") ? 0.12 : 0)) {
          player.evaded = Math.round(ev * 0.5);
          saveGame();
          say([["Você", "Fiscal, eu sou a pessoa mais honesta desta vila. Pergunta pra qualquer um."], ["Fiscal da Coroa", "...Volto mês que vem. E vou trazer o ábaco grande."]]);
        } else say([["Fiscal da Coroa", "Seus recibos dizem outra coisa. Calabouço!"]], () => ((player.evaded = Math.round(ev * 0.5)), startJail(36, "sonegação de impostos")));
      },
    },
  ]);
}

/* ===================== MENU DO CRIME ===================== */

function crimeMenu() {
  if (game.mode !== "world" || game.dialog) return;
  game.pieAnchor = null;
  const txt = `Furtos: <b>${player.thefts || 0}</b> (pego ${player.caughtThefts || 0}x) · Habilidade de ladrão: <b>${Math.min(25, (player.thiefXP || 0) * 2)}%</b><br>Imposto sonegado: <b>${player.evaded || 0}</b> ouro (total ${player.evadedTotal || 0}) · Mortes: <b>${player.murders || 0}</b>${hated() ? "<br><b style='color:#ff6b6b'>A vila te detesta.</b>" : ""}<br><small>Bater carteira e furtar: menu da pessoa. Arrombar: porta de uma casa da turma de madrugada. Sonegar: ligue abaixo e pague tudo sem o Imposto Real.</small>`;
  choice("Vida do crime", txt, [
    { t: player.sonega ? "Parar de sonegar (voltar a pagar imposto)" : "Sonegar o Imposto Real", icon: "coin", fn: () => ((player.sonega = !player.sonega), saveGame(), toast(player.sonega ? "Sonegando: suas compras saem sem Imposto Real. Cuidado com o fiscal!" : "Você voltou a pagar o Imposto Real.", 3200)) },
    { t: "Fechar", fn: null },
  ]);
}
WORLD_SHORTCUTS.x = crimeMenu;
(function crimeButton() {
  const small = document.querySelector("#touch .small");
  if (!small) return;
  const b = document.createElement("button");
  b.id = "tX";
  b.textContent = "Crime";
  b.addEventListener("click", crimeMenu);
  small.appendChild(b);
})();
ACHIEVEMENTS.push(["maoleve", "Mão leve", "Faça 10 furtos.", "coin", () => (player.thefts || 0) >= 10]);
ACHIEVEMENTS.push(["sonegador", "Sonegador", "Sonegue 500 de ouro em Imposto Real.", "coin", () => (player.evadedTotal || 0) >= 500]);

/* ===================== MAIS INTERAÇÕES ===================== */

INTER_CATS.push({ k: "crime", n: "Malandragem", icon: "skull" }, { k: "ideia", n: "Ideias e opiniões", icon: "book" });
addInter("crime", { rel: -2, likes: "XA", dislikes: "GSB", x: { rep: -1 } }, [
  ["Propor um esquema de dinheiro fácil", "coin", "Hm... conta mais. Baixinho.", "Isso é golpe. Tô fora."],
  ["Pedir para ser cúmplice", "lock", "Se der errado, eu nunca te vi.", "Nem pensar!"],
  ["Vender uma 'poção milagrosa' falsa", "coin", "Funciona mesmo? ...Tá, leva meu ouro.", "Isso é água com corante!", { you: "Cura tudo, até dor de cotovelo!" }],
  ["Combinar um álibi", "scroll", "Ontem à noite você estava jogando xadrez comigo. Combinado.", "Não vou mentir pra guarda por você."],
  ["Pedir para guardar 'uma encomenda'", "bag", "Não vou nem perguntar o que tem dentro.", "Isso tá fazendo tic-tac?!"],
  ["Contar como sonegar imposto", "coin", "Esconder os móveis embaixo do lençol? Genial!", "Eu pago meus impostos, viu?"],
  ["Oferecer mercadoria 'caída do carroção'", "bag", "Caiu do carroção, é? Quanto?", "Isso é roubado!"],
  ["Pedir para vigiar a guarda", "eye", "Assobio duas vezes se vier alguém.", "Me deixa fora disso."],
  ["Apostar dinheiro escondido", "gem", "Dados viciados? Que isso... *aposta mesmo assim*", "Jogo de azar é proibido!"],
  ["Falsificar um documento juntos", "scroll", "Minha letra é igualzinha à do Coletor!", "Falsificação dá calabouço!"],
  ["Pedir para mentir pro Coletor", "coin", "'Não, senhor, essa casa nunca teve móveis.'", "Não minto pra Coroa."],
  ["Planejar um assalto ao castelo (brincadeira?)", "crown", "...Você tá brincando, né? Né?!", "Para com isso antes que alguém ouça!"],
  ["Ensinar a bater carteira", "coin", "Assim? *pega seu lenço* Ei, eu tenho jeito!", "Eu não quero aprender isso!"],
  ["Contrabandear vinho para a taverna", "mug", "O Gus vai pagar o dobro. Bora!", "E se a guarda revista a carroça?"],
  ["Pedir para esconder você da guarda", "house", "Entra, rápido! Embaixo da cama!", "Some daqui, eu não quero problema!"],
  ["Trapacear no jogo de cartas", "gem", "Você tirou o ás da manga?! ...Me ensina.", "Trapaceiro! Devolve meu ouro!"],
  ["Rir de um golpe que você deu", "laugh", "HAHAHA! E ele acreditou?!", "Isso não tem graça, coitado."],
  ["Inventar um boato sobre a Rainha", "crown", "Peruca? A Rainha usa peruca?! Vou contar pra todo mundo!", "Isso é traição, sabia?"],
  ["Pedir um 'empréstimo eterno'", "coin", "Eterno quanto? ...Tá, toma.", "Empréstimo eterno é roubo com educação."],
  ["Dizer que é procurado em três reinos", "skull", "Sério?! Que vida emocionante!", "Então fica longe de mim."],
]);
addInter("ideia", { rel: 3, likes: "BXS", dislikes: "C", x: { time: 20 } }, [
  ["Debater se a coroa é necessária", "crown", "Boa pergunta. O Luca diria que não. Eu... não sei.", "Isso dá briga. Melhor não."],
  ["Perguntar o sentido da vida", "star", "Comer bem, dormir bem e ter amigos. Pronto.", "Que pergunta pesada pra uma terça."],
  ["Discutir se magia ainda existe", "sparkle", "Às vezes, à noite, eu juro que vejo luzes no céu.", "Magia é coisa de criança."],
  ["Pedir opinião sobre o Imposto Real", "coin", "Alto demais! Mas alguém tem que pagar as estradas.", "Política eu não discuto."],
  ["Perguntar qual o melhor livro que leu", "book", "'As Crônicas do Grande Silêncio'. Chorei no final.", "Eu não leio muito, desculpa."],
  ["Propor um negócio juntos", "coin", "Uma barraca de pão de mel com chá? Sócios!", "Negócio com amigo dá briga."],
  ["Pedir conselho de carreira", "hammer", "Faça o que gosta e cobre bem por isso.", "Não sou a melhor pessoa pra isso."],
  ["Ensinar algo que você sabe", "book", "Nossa, eu não sabia disso! Me ensina mais!", "Eu já sabia, mas valeu."],
  ["Pedir para aprender algo", "scroll", "Senta aí que eu te ensino. Primeira lição: paciência.", "Hoje não tenho tempo."],
  ["Discutir o que é justiça", "scroll", "Justiça é o que a gente faz quando ninguém está olhando.", "Depende de quem tem a espada."],
  ["Perguntar sobre o passado da vila", "house", "Antes do Silêncio, dizem que a fonte cantava.", "Eu não sei dessas histórias."],
  ["Falar sobre sonhos para o futuro", "sun", "Eu quero ver o mar. Um dia eu vou.", "Futuro? Eu mal sei do almoço."],
  ["Debater se o Marzoca tem jeito", "laugh", "Jeito ele tem. Vergonha é que falta.", "Ninguém consegue debater o Marzoca."],
  ["Perguntar quem ele(a) admira", "star", "A Odelia. Trezentos anos e ainda sorri.", "Ninguém, sinceramente."],
  ["Discutir o que veio primeiro: ovo ou galinha", "laugh", "A galinha! Não, o ovo! Ai, minha cabeça.", "Que pergunta boba."],
  ["Falar sobre o medo de envelhecer", "clock", "Eu tenho medo de esquecer as pessoas que amo.", "Prefiro não pensar nisso."],
  ["Perguntar a opinião sobre os Iluministas", "flag", "Eles têm umas ideias boas... e uns tomates demais.", "Baderneiros!"],
  ["Inventar uma máquina juntos", "hammer", "Um moinho que faz pão sozinho! Vamos ficar ricos!", "Isso nunca vai funcionar."],
  ["Discutir se os bichos pensam", "paw", "O gato da Júlia me julga todo dia. Pensa sim.", "Bicho é bicho."],
  ["Perguntar o que faria se fosse rei/rainha", "crown", "Taverna de graça às sextas! E escola pra todo mundo.", "Eu? Rei? Nem brincando."],
  ["Escrever uma carta para o futuro", "scroll", "'Querido eu de daqui a dez anos: espero que você tenha uma horta.'", "Que coisa mais melosa."],
  ["Discutir qual reino é o melhor", "flag", "Aurélia, claro! Pedravale tem pedra demais e Marés tem peixe demais.", "Isso dá guerra, literalmente."],
  ["Perguntar qual é o maior arrependimento", "meh", "Não ter dito 'eu te amo' quando devia.", "Isso é muito pessoal."],
  ["Propor um clube de leitura", "book", "Toda quinta, na biblioteca! A Andressa vai amar.", "Eu durmo lendo."],
  ["Debater se a lua é de queijo", "laugh", "Se for, é queijo de cabra. Bem fedido.", "Você está bem?"],
]);
addInter("amigo", { rel: 2, likes: "GEA", dislikes: "" }, [
  ["Perguntar como está a família", "house", "Tudo bem, graças às runas! Obrigado por perguntar."],
  ["Lembrar do aniversário", "cake", "Você lembrou?! Ninguém lembra!"],
  ["Contar um segredo bobo", "lock", "Você ainda dorme com a luz acesa? Hahaha, eu também!"],
  ["Pedir uma recomendação de comida", "stew", "O ensopado do Gus. Peça com pão extra."],
  ["Chamar para sentar na praça", "sun", "Bora! Tô precisando de um respiro."],
  ["Dividir o guarda-chuva", "cloud", "Que gentileza! Assim nenhum dos dois se molha."],
  ["Oferecer um lenço", "flower", "Obrigado... tava precisando mesmo."],
  ["Perguntar se dormiu bem", "zzz", "Dormi igual pedra. E você?"],
  ["Dar bom dia com entusiasmo", "sun", "BOM DIA! Assim que se começa o dia!"],
  ["Elogiar a escolha do dia", "star", "Escolhi essa roupa pensando em você. Brincadeira! Ou não."],
  ["Mostrar um truque com moeda", "coin", "Como você fez isso?! De novo!"],
  ["Perguntar a opinião sincera", "chat", "Sincera? Você devia sorrir mais. Fica bonito."],
  ["Chamar pelo apelido", "smile", "Ninguém me chama assim desde criança!"],
  ["Mandar um tchauzinho de longe", "wave", "*acena de volta com as duas mãos*"],
  ["Fazer companhia no trabalho", "hammer", "O tempo passa mais rápido com você aqui.", "", { time: 30 }],
]);
addInter("papo", { rel: 2, likes: "BXG", dislikes: "C" }, [
  ["Falar do clima de hoje", "sun", "Esse tempo muda mais que o humor da Rainha!"],
  ["Comentar a última fofoca", "eye", "NÃO! Sério?! Me conta tudo!"],
  ["Perguntar sobre o trabalho", "hammer", "Cansativo, mas paga o pão. E você?"],
  ["Falar sobre comida preferida", "stew", "Torta de abóbora da Rosa. Imbatível."],
  ["Contar uma história de viagem", "flag", "Você foi ao Porto?! Como é o mar?"],
  ["Perguntar sobre a infância", "baby", "Eu era terrível! Roubava maçã do vizinho todo dia."],
  ["Falar dos bichos da vila", "paw", "O gato laranja da praça é o verdadeiro prefeito."],
  ["Comentar sobre o festival", "party", "Esse ano vai ter fogos! Dizem."],
  ["Falar sobre música", "note", "Você conhece a Canção Arcana? Minha avó cantava."],
  ["Perguntar qual o lugar favorito", "house", "A beira do rio no fim da tarde. Paz total."],
  ["Comentar sobre os preços da feira", "coin", "Um absurdo! O pão subiu de novo!"],
  ["Falar sobre o Marzoca de novo", "laugh", "Ele fugiu de mais um marido hoje. Clássico."],
  ["Perguntar sobre a turma", "chat", "Aquela turma é a mais animada da vila. E a mais barulhenta."],
  ["Falar sobre medos", "skull", "Eu tenho medo de escuro. Pronto, falei."],
  ["Perguntar o que acha do jogador", "star", "Do... jogador? Ah, você fala como o Luca às vezes."],
]);
addInter("ativ", { rel: 3, likes: "AGE", dislikes: "S", x: { time: 40, fun: 8 } }, [
  ["Fazer um piquenique", "apple", "Trouxe pão, queijo e suco! Perfeito."],
  ["Apostar corrida até a fonte", "sun", "Ganhei! ...Você me deixou ganhar, né?"],
  ["Pescar juntos no rio", "paw", "Pegamos um peixe deste tamanho! Ninguém vai acreditar."],
  ["Plantar uma árvore juntos", "flower", "Daqui a vinte anos a gente senta na sombra dela."],
  ["Ir à taverna dançar", "note", "Você pisou no meu pé três vezes. Foi ótimo!"],
  ["Cozinhar juntos", "stew", "Ficou salgado... mas a gente que fez!"],
  ["Ver o pôr do sol", "sun", "Que céu laranja... a vida é boa às vezes."],
  ["Construir um boneco de neve (ou de areia)", "cloud", "Ficou a cara do General Marcos!"],
  ["Jogar pedrinhas no lago", "cloud", "Quatro pulos! Recorde da vila!"],
  ["Fazer uma trilha na floresta", "flower", "Vimos um cervo! Que lindo!"],
  ["Visitar o mercado juntos", "bag", "Comprei um chapéu ridículo. Combina comigo?"],
  ["Ensaiar uma peça de teatro", "book", "'Ser ou não ser...' Ah, esqueci o resto."],
  ["Pintar um quadro juntos", "sparkle", "A Mylena vai rir da nossa pintura. Mas ficou linda."],
  ["Organizar uma festa surpresa", "party", "Ninguém pode saber! Nem o aniversariante!"],
  ["Contar estrelas no telhado", "star", "Duzentas e doze... ou treze. Perdi a conta."],
]);
addInter("ajuda", { rel: 4, likes: "SGB", dislikes: "O", x: { energy: -5 } }, [
  ["Carregar as compras", "bag", "Que peso! Obrigado, minhas costas agradecem."],
  ["Consertar a cerca", "hammer", "Agora as galinhas não fogem mais!"],
  ["Cuidar dos bichos por um dia", "paw", "Eles gostaram de você! Até o bode."],
  ["Ajudar a escrever um bilhete", "scroll", "Ficou lindo! Vou mandar hoje mesmo."],
  ["Varrer a frente da casa", "house", "Tava precisando! Você é um anjo."],
  ["Buscar água no poço", "cloud", "Dois baldes cheios! Obrigado!"],
  ["Ensinar a fazer contas", "coin", "Agora o Coletor não me engana mais!"],
  ["Ajudar a procurar algo perdido", "eye", "ACHEI! Estava no meu bolso o tempo todo..."],
  ["Levar um recado para alguém", "chat", "Você entregou? Que alívio!"],
  ["Ficar de olho na barraca", "eye", "Voltei! Vendeu alguma coisa? ...Vendeu tudo?!"],
  ["Ajudar na colheita", "apple", "Com você aqui terminamos antes do almoço!", "", { time: 60 }],
  ["Dar um conselho de amor", "heart", "Vou seguir seu conselho. Se der errado, a culpa é sua!"],
  ["Defender de um valentão", "sword", "Você me defendeu! Nunca vou esquecer.", "", { rep: 1 }],
  ["Emprestar o cavalo", "paw", "Cheguei rapidinho! Obrigado!"],
  ["Pagar um café", "mug", "Ah, que gentileza! Fica pra próxima, eu pago.", "", { cost: 3 }],
]);
addInter("graca", { rel: 3, likes: "ECA", dislikes: "S", x: { fun: 6 } }, [
  ["Imitar a Rainha", "crown", "HAHAHA! 'Súditos, curvem-se!' Igualzinho!"],
  ["Imitar o General Marcos", "sword", "'DISCIPLINA!' HAHAHA! Ele vai te matar!"],
  ["Contar piada de mago", "sparkle", "Essa foi tão ruim que ficou boa!"],
  ["Fazer careta", "laugh", "Para! Eu vou fazer xixi de tanto rir!"],
  ["Contar uma história absurda", "book", "Um dragão que tinha medo de galinha? HAHAHA!"],
  ["Dançar sem música", "note", "Que passos são esses?! Me ensina!"],
  ["Fingir que é estátua", "meh", "Hahaha, um pombo quase pousou em você!"],
  ["Rimar o nome dele(a)", "note", "HAHA! Essa rima não existe, mas valeu!"],
  ["Contar piada do Marzoca", "laugh", "Por que o Marzoca corre tanto? Marido bravo! HAHAHA!"],
  ["Fazer voz de pato", "laugh", "QUÉ! QUÉ! Hahaha, para!"],
  ["Contar um trava-língua", "chat", "O rato roeu a roupa do... rei de... ai, errei!"],
  ["Inventar uma música boba", "note", "'O pão de mel, caiu do céu...' Grudou na cabeça!"],
]);
addInter("amor", { rel: 4, likes: "TGOE", dislikes: "S", x: { req: "partner" } }, [
  ["Escrever o nome dele(a) na árvore", "heart", "Nossos nomes num coração... que bobo. Que lindo."],
  ["Preparar um jantar à luz de velas", "stew", "Você fez tudo isso pra mim?!", "", { time: 60 }],
  ["Dançar devagar na praça", "note", "Todo mundo está olhando... e eu não ligo."],
  ["Prometer as estrelas", "star", "Só uma já tá bom. A mais brilhante."],
  ["Cochichar 'eu te amo'", "heart", "*fica vermelho* ...Eu também. Muito."],
  ["Fazer uma serenata", "note", "*abre a janela* Desafinado e perfeito."],
  ["Dar a mão sem motivo", "heart", "Sua mão é quentinha. Não solta."],
  ["Relembrar o primeiro encontro", "clock", "Você estava tão nervoso(a)! Lembro de tudo."],
  ["Fazer planos para o futuro", "house", "Uma casa com quintal e um cachorro. Fechado."],
  ["Dar um beijo na testa", "heart", "Ai... isso me derrete."],
]);
addInter("fam", { rel: 3, likes: "GBT", dislikes: "O" }, [
  ["Perguntar dos filhos", "baby", "O mais novo aprendeu a falar 'Marzoca'. Não sei onde ouviu."],
  ["Oferecer ajuda com a casa", "house", "Se você puder ajudar com o telhado... seria um sonho."],
  ["Convidar a família para jantar", "stew", "Vamos todos! Levo a sobremesa."],
  ["Elogiar os pais dele(a)", "heart", "Minha mãe vai adorar saber disso!"],
  ["Contar sobre a sua família", "house", "Que bonita a sua história. Obrigado por contar."],
  ["Perguntar de onde a família veio", "flag", "Meus avós vieram de Pedravale, com uma carroça e um bode."],
  ["Brincar com as crianças da casa", "baby", "Elas não param de falar de você!"],
  ["Ajudar a cuidar dos avós", "heart", "Eles adoraram a sua visita. Volte sempre."],
  ["Levar um presente para a casa", "gift", "Pra casa toda? Que gentileza!", "", { cost: 5 }],
  ["Perguntar sobre as tradições de família", "scroll", "Todo inverno a gente faz sopa de cebola e conta histórias."],
]);
addInter("reino", { rel: 2, likes: "SXB", dislikes: "CE" }, [
  ["Perguntar o que acha do novo governante", "crown", "Novo? Velho? Contanto que o pão não suba..."],
  ["Discutir a guerra com os reinos vizinhos", "sword", "Guerra só serve pra encher cemitério."],
  ["Comentar sobre o calabouço", "lock", "Dizem que tem um tal Professor L lá. Ninguém sabe o nome."],
  ["Perguntar sobre o Professor L", "eye", "O General Marcos odeia ele. Ninguém sabe por quê."],
  ["Reclamar dos coletores", "coin", "Aquele coletor contou até as minhas colheres!"],
  ["Falar das estradas do reino", "flag", "A estrada pro Porto tem mais buraco que queijo."],
  ["Perguntar sobre a guarda", "sword", "O Tomé é gente boa. O resto... prefiro não comentar."],
  ["Comentar os protestos", "flag", "Eu vi um tomate acertar a coroa! Histórico!"],
  ["Imaginar a vila sem coroa", "sun", "Um conselho do povo? Até que seria bonito."],
  ["Perguntar sobre as leis", "scroll", "Lei é igual a sapato: aperta em quem é pobre."],
]);
addInter("paz", { rel: 5, likes: "GBT", dislikes: "O" }, [
  ["Devolver o que você pegou", "bag", "Você... devolveu? Tá. Talvez você não seja tão mau assim."],
  ["Pedir perdão de joelhos", "heart", "Levanta daí, que vergonha! ...Tá perdoado."],
  ["Prometer mudar de vida", "sun", "Vou ficar de olho. Mas acredito em você."],
  ["Fazer um favor sem pedir nada", "gift", "Isso foi... legal. Obrigado."],
  ["Oferecer ajuda para consertar o estrago", "hammer", "Tá bom. Começa pela janela que você quebrou."],
  ["Mandar um bolo de desculpas", "cake", "Bolo de chocolate? Golpe baixo. Funcionou.", "", { cost: 5 }],
]);

/* ===================== LIGAÇÕES ===================== */

{
  const updBase = update;
  update = function (dt) {
    updBase(dt);
    if (game.mode === "world" && !game.dialog) bodyWatch(dt);
  };
}

/* Na pizza, roubar e matar ficam juntos num grupo "Crime" bem à vista. */
PIE_GROUPS.splice(1, 0, { n: "Crime", icon: "skull", re: /^Roubar|^Matar|golpe de estado|conspiração/i });

/* ===================== ROUBAR DENTRO DA LOJA ===================== */

/** Quem cuida da loja (para lembrar do furto e chamar a guarda). */
function shopKeeperId(shopId) {
  const fr = Object.keys(FRIENDS).find((k) => FRIENDS[k].shop === shopId && !isDead(k));
  if (fr) return fr;
  const nm = shopKeeperName(shopId).split(",")[0];
  return tempNpc("k_", { nm, robe: "#5a5a7a", hair: "#3a2414" });
}
{
  const focusBase = shopFocus;
  shopFocus = function () {
    focusBase();
    if (game.shopTab !== "buy" || !game.shopId || String(game.shopId).startsWith("__")) return;
    const box = byId("shop") && byId("shop").querySelector(".st-buybox");
    if (!box || box.querySelector(".st-steal")) return;
    const b = document.createElement("button");
    b.className = "st-steal";
    b.innerHTML = `${iconHTML("skull", 14)} Roubar`;
    b.title = "Enfiar o item na bolsa sem pagar. Se o lojista ver, chama a guarda.";
    b.onclick = () => {
      const id = game.shopList[game.shopIdx];
      const kid = shopKeeperId(game.shopId);
      if (player.famDay["lift" + game.shopId] === player.day) return toast("O lojista está de olho em você hoje. Melhor não arriscar de novo.", 2400);
      player.famDay["lift" + game.shopId] = player.day;
      const ch = stealChance(kid, 0.5) - Math.min(0.25, (ITEMS[id].preco || 10) / 600);
      if (Math.random() < ch) {
        addItem(id);
        player.thefts = (player.thefts || 0) + 1;
        player.thiefXP = (player.thiefXP || 0) + 1;
        saveGame();
        playSound(880, 0.05, "sine");
        toast(`Você enfiou ${ITEMS[id].nome} na bolsa sem ninguém ver.`, 2600);
        shopFocus();
      } else {
        closeShop();
        setTimeout(() => caughtStealing(kid, "roubando da loja", ITEMS[id].preco || 20), 200);
      }
    };
    box.appendChild(b);
  };
}

/* ======================================================================
   (antes: 48-pena-de-morte.js)
   ====================================================================== */

/**
 * ECOS DO ARCANO — 30-crime-calabouco-e-forca.js
 *  - Pena de morte: quem mata duas vezes (ou mata alguém da realeza) vai a
 *    julgamento. Clemência, fuga ou forca. No Simulador a forca é o fim (a
 *    família continua com um herdeiro, se houver). No modo História você é
 *    mago, e mortais não matam magos: a corda arrebenta e você é exilado.
 *  - Moradores sem nome e elfos também podem morrer (crianças, nunca).
 *  - O menu pizza volta a aparecer quando um menu da mesma pessoa abre de novo.
 */


/* ===================== MENU PIZZA SEMPRE QUE FOR UMA PESSOA ===================== */

{
  const pieBase = renderPie;
  renderPie = function (title, text, opts) {
    const r = pieBase(title, text, opts);
    if (r && game.pieAnchor) game.lastPie = { x: game.pieAnchor.x, y: game.pieAnchor.y, name: String(title).split(/[·,]/)[0].trim(), t: performance.now() };
    return r;
  };
  const choiceBase = choice;
  choice = function (title, text, opts) {
    const L = game.lastPie;
    if (!game.pieAnchor && !game.brawl && L && performance.now() - L.t < 90000 && L.name && String(title).includes(L.name) && Math.abs(L.x - player.x) + Math.abs(L.y - player.y) <= 8) game.pieAnchor = { x: L.x, y: L.y };
    return choiceBase(title, text, opts);
  };
}

/* ===================== MORADORES SEM NOME E ELFOS ===================== */

/** Cria (ou recupera) uma ficha para quem não tem ficha própria, para poder morrer. */
function tempNpc(prefix, o) {
  const id = prefix + o.nm;
  if (!NPCS[id]) NPCS[id] = { nome: o.nm, robe: o.robe || ELF_ROBES[0], hat: o.hat || null, hair: o.hair || "#3a2414", temp: true, talk: () => [[o.nm, genLine(id)]] };
  if (!FRIENDS[id]) FRIENDS[id] = { fav: "flor", temp: true };
  return id;
}
{
  const itemsBase = walkerContactItems;
  walkerContactItems = function (wk) {
    const items = itemsBase(wk);
    const id = tempNpc("w_", wk);
    // As mesmas interações de todo mundo, em pizza ao redor do morador.
    items.unshift({ t: `Interações… (${INTERACTIONS.filter((r) => interAvailable(r, id)).length})`, icon: "chat", fn: () => ((game.ipAnchor = { x: wk.x, y: wk.y, id }), (game.pieAnchor = { x: wk.x, y: wk.y }), openInterPanel(id)) });
    items.push({ t: "Matar…", icon: "skull", fn: () => killMenu(id) });
    return items;
  };
  const elfBase = elfMenu;
  elfMenu = function (elf) {
    hookChoice(
      () => elfBase(elf),
      (title, text, opts) => {
        const id = tempNpc("e_", { nm: elf.nm, robe: ELF_ROBES[elf.nm.length % 4], hair: ELF_HAIRS[elf.nm.length % 4] });
        return [
          title,
          text,
          [{ t: `Interações… (${INTERACTIONS.filter((r) => interAvailable(r, id)).length})`, icon: "chat", fn: () => ((game.ipAnchor = { x: elf.x, y: elf.y, id }), (game.pieAnchor = { x: elf.x, y: elf.y }), openInterPanel(id)) }].concat(opts.slice(0, -1), [{ t: "Matar…", icon: "skull", fn: () => killMenu(id) }], opts.slice(-1)),
        ];
      },
    );
  };
  const posBase = victimPos;
  victimPos = function (id) {
    const nm = id.slice(2);
    if (id.startsWith("w_")) {
      const w = (game.walkers || []).find((q) => q.nm === nm);
      if (w) return { zone: player.zone, x: w.x, y: w.y };
    }
    if (id.startsWith("e_")) {
      const e = (game.elves || []).find((q) => q.nm === nm);
      if (e) return { zone: player.zone, x: e.x, y: e.y };
    }
    return posBase(id);
  };
  const killBase = killNpc;
  killNpc = function (id, how) {
    killBase(id, how);
    const d = deadList()[id];
    if (d && NPCS[id] && NPCS[id].temp) d.npc = { nome: NPCS[id].nome, robe: NPCS[id].robe, hat: NPCS[id].hat, hair: NPCS[id].hair, temp: true };
  };
}
/** Quem morreu sai da rua (e volta a ter ficha depois de recarregar o jogo). */
function purgeTemps() {
  for (const [id, d] of Object.entries(player.dead || {})) if (d.npc && !NPCS[id]) NPCS[id] = d.npc;
  if (!player.dead) return;
  if ((game.walkers || []).some((w) => player.dead["w_" + w.nm])) game.walkers = game.walkers.filter((w) => !player.dead["w_" + w.nm]);
  if ((game.elves || []).some((e) => player.dead["e_" + e.nm])) game.elves = game.elves.filter((e) => !player.dead["e_" + e.nm]);
}

/* ===================== PENA DE MORTE ===================== */

const ROYAL_BLOOD = new Set(["rainha", "pedro", "mylena", "matheus", "malu", "julia", "vini", "juliaO"]);
{
  const foundBase = murderFound;
  murderFound = function (id) {
    const d = deadList()[id];
    if (!d) return;
    const severe = (player.murders || 0) >= 2 || ROYAL_BLOOD.has(id);
    if (!severe) return foundBase(id);
    d.found = true;
    hateEveryone(20);
    vilaNews(`${shortName(id)} foi assassinad${gw(id, "o", "a")}! ${player.name} vai a julgamento e pode pegar a pena de morte.`);
    trial(id);
  };
}
function trial(id) {
  const n = shortName(id);
  const crimes = player.murders || 1;
  const judge = rulesK && rulesK("aurelia") ? "Conselho dos Anciãos" : "Rainha Aurélia";
  game.fade = 1;
  say(
    [
      ["Guarda Tomé", `${player.name}, você está pres${genderWord("o", "a", "e")}. Desta vez não é só calabouço.`],
      ["", "No dia seguinte, a praça do castelo está lotada. Uma forca foi montada na escadaria."],
      [judge, `${player.name}, você é acusad${genderWord("o", "a", "e")} de ${crimes > 1 ? `${crimes} assassinatos, o último` : "assassinato"} contra ${n}${ROYAL_BLOOD.has(id) ? ", sangue da realeza" : ""}.`],
      ["Multidão", pk(["FORCA! FORCA!", "Assassin" + genderWord("o", "a", "e") + "!", "Justiça para " + n + "!"])],
      [judge, "A sentença é a morte. Tem algo a dizer antes que eu bata o martelo?"],
    ],
    () =>
      choice("A sentença", `Crimes: ${crimes} morte(s). Reputação: 0. Ninguém na vila quer te defender.`, [
        {
          t: "Pedir clemência",
          icon: "heart",
          fn: () => {
            const friends = Object.keys(FRIENDS).filter((k) => !isDead(k) && (player.rel[k] || 0) >= 50).length;
            const ch = 0.08 + Math.min(0.3, friends * 0.05) + (crimes === 1 ? 0.1 : 0);
            if (Math.random() < ch) {
              say([[judge, "...A sentença está trocada. Prisão perpétua não existe nesta vila, então: uma semana no calabouço e exílio da sua dignidade."], ["Multidão", "Buuuu!"]], () => startJail(24 * 7, `assassinato de ${n} (clemência)`));
            } else say([[judge, "Clemência negada."]], () => execution(id));
          },
        },
        {
          t: "Tentar fugir da forca",
          icon: "door",
          fn: () => {
            if (Math.random() < (lifeMode() ? 0.15 : 0.6)) {
              player.hatedUntil = player.day + 30;
              player.outlaw = true;
              vilaNews(`${player.name} fugiu da forca! Procurad${genderWord("o", "a", "e")} vivo ou morto.`);
              saveGame();
              say([["", lifeMode() ? "Você empurra o carrasco, pula da escadaria e some pelos telhados da vila!" : "Um raio de magia rompe as cordas. Você some numa nuvem de fumaça violeta."], ["Guarda Tomé", "PEGUEM! Não deixem escapar!"], ["", "Você é agora um fora da lei. A vila inteira te odeia por 30 dias."]]);
            } else say([["", "Você corre... e tropeça na própria corda. Os guardas te seguram."]], () => execution(id));
          },
        },
        { t: "Aceitar a sentença", icon: "skull", fn: () => execution(id) },
      ]),
  );
}
function execution(id) {
  game.shake = 0.4;
  playSound(90, 0.8, "sawtooth");
  if (!lifeMode()) {
    // Mortais não matam magos.
    player.hatedUntil = player.day + 30;
    player.exiled = player.day;
    vilaNews(`A forca não matou ${player.name}. Magos não morrem pelas mãos de mortais. Exilad${genderWord("o", "a", "e")}!`);
    say(
      [
        ["", "O carrasco puxa a alavanca. A corda estica... e arrebenta, soltando faíscas."],
        ["Arquimaga Odelia (eco)", "Mortais não matam magos. Você sabe disso."],
        ["Rainha Aurélia", "Então que seja o exílio! Saia de Cinzaluz e não volte tão cedo!"],
        ["", "Você foi exilad" + genderWord("o", "a", "e") + " para o Bosque. A vila te odeia por 30 dias."],
      ],
      () => {
        player.zone = "bosque";
        const z = ZONES.bosque;
        const s = (z.spawn && z.spawn[0]) || [5, 5];
        player.x = s[0];
        player.y = s[1];
        game.fade = 1;
        enterZone();
        saveGame();
      },
    );
    return;
  }
  const name = player.name;
  const list = typeof heirs === "function" ? heirs() : [];
  const lines = [
    ["", "O tambor rufa. O carrasco ajusta a corda."],
    ["", `${name} foi executad${genderWord("o", "a", "e")} na escadaria do castelo, diante da vila inteira.`],
    ["Padre Anselmo", "Que as runas tenham piedade de quem não teve piedade."],
  ];
  if (!list.length) {
    clearSave();
    say(lines.concat([["", "Sem herdeiros, esta história termina aqui. FIM. (Comece um novo jogo para tentar outra vida.)"]]), () => location.reload());
    return;
  }
  say(lines.concat([["", "A família carrega a vergonha do nome. Um filho adulto continua a história."]]), () =>
    choice(
      "Quem continua a família?",
      "O herdeiro começa com a reputação manchada pelo crime da família.",
      list.map((k) => ({
        t: `${k.name} · ${kidAge(k)} anos`,
        fn: () => {
          continueAsHeir(k, Math.floor(player.gold * 0.5));
          player.jail = null;
          player.hatedUntil = player.day + 7;
          player.rep = 10;
          player.murders = 0;
          player.zone = "vila";
          [player.x, player.y] = [5, 18];
          game.fade = 1;
          enterZone(false);
          saveGame();
        },
      })),
    ),
  );
}

/* ===================== LIGAÇÕES ===================== */

{
  const updBase = update;
  update = function (dt) {
    updBase(dt);
    if (game.mode !== "title") purgeTemps();
  };
}
// O menu Matar… agora abre em pizza ao redor da pessoa.
{
  const killBase = killMenu;
  killMenu = function (id) {
    const a = game.pieAnchor || (game.lastPie && { x: game.lastPie.x, y: game.lastPie.y });
    killBase(id);
    if (a && game.mode === "choice" && !game.pieAnchor) {
      game.pieAnchor = a;
      choice(`Matar ${shortName(id)}?`, "", game.choice);
    }
  };
}
