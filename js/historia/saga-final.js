/**
 * ECOS DO ARCANO — saga-final.js (modo História)
 *  1. O Silenciador aparece em 3 visões antes da Torre (depois do 1º, 3º e
 *     5º Guardião), falando com você, e muda o tom se você virou vilão.
 *  2. Os Guardiões reagem às suas escolhas: se você arrancou runas, os
 *     próximos lutam com raiva; se libertou, hesitam. Libertando 5 sem
 *     possuir nenhum, um Guardião luta do seu lado contra o Silenciador.
 *  3. As missões da turma ganham uma fala no epílogo.
 *  4. Final do Eco (escondido): 3 revelações + o berço + nenhum Guardião
 *     possuído. O fragmento volta para Vesper e o traz de volta inteiro.
 *  6. Chefes Antigos: um por região, escondido (só aparece de perto).
 *  7. Baús Rúnicos: um por região, só abrem com uma runa que vem depois.
 *  8. Nyx e os Chefes Antigos trocam de fraqueza no meio da luta.
 *  9. Golpe em dupla: o melhor amigo da turma ataca junto com o seu dom.
 * 10. Recapitulação ao voltar para o jogo.
 * 11. Missões (Q) separadas por capítulo.
 * (5. O mapa com névoa já existia: as regiões se revelam enquanto você anda.)
 */

"use strict";

const sfOn = () => story() && player && player.name;
const heroFreed = () => Object.values(player.guardFate || {}).filter((v) => v === "hero").length;
const allFreed = () => ["bosque", "farol", "pantano", "picos", "mina", "porto"].filter((r) => (player.guards || []).includes(r)).length;

/* ===================== 1. AS VISÕES DO SILENCIADOR ===================== */
const SIL_VISIONS = [
  {
    need: 1,
    lines: (vil) =>
      vil
        ? [["O Silenciador", "Você arrancou a runa dele com as próprias mãos. Interessante..."], ["O Silenciador", "Você já entende o silêncio melhor do que imagina. Continue."]]
        : [["O Silenciador", "Então foi você que acordou o primeiro Guardião. Eu ouvi a alegria dele daqui. Que barulho horrível."], ["O Silenciador", "Volte para casa, aprendiz. O silêncio é gentil com quem não insiste."]],
  },
  {
    need: 3,
    lines: (vil) => [
      ["O Silenciador", vil ? "Três runas, e todas manchadas. Logo você vai precisar de mim para aguentar o peso delas." : "Cada runa que volta faz o mundo gritar. Você acha que está salvando todos? Está acordando a dor deles."],
      ...(player.dom && DONS[player.dom] ? [["O Silenciador", `E esse eco em você, ${RUNE_WITH_ARTICLE[player.dom]}... eu sinto ele daqui. Ele ainda é meu.`]] : []),
    ],
  },
  {
    need: 5,
    lines: (vil) => [
      ["O Silenciador", vil ? "Venha. A Torre está esperando o seu novo senhor... ou o meu novo aliado." : "Falta pouco. Venha até a Torre. Eu deixo a porta aberta... para você ver o que restou de mim."],
      ["", "Por um instante, atrás da máscara, você ouve alguém chorar baixinho."],
    ],
  },
];
function silVisionScene(W, H, t) {
  ctx.fillStyle = "#05030a";
  ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 50; i++) {
    ctx.fillStyle = `rgba(150,90,220,${0.1 + 0.25 * Math.abs(Math.sin(i * 2.3 + t))})`;
    ctx.fillRect((i * 97) % W, (i * 53 + t * 10) % H, 2, 2);
  }
  ctx.save();
  ctx.globalAlpha = Math.min(1, t / 1.5);
  const u = 6;
  drawEnemy("silenciador", W / 2 - 8 * u, H / 2 - 8 * u - 20 + Math.sin(t) * 4, u, t);
  ctx.restore();
  ctx.textAlign = "center";
  txt("Uma visão...", W / 2, 60, 22, `rgba(210,180,255,${Math.min(1, t)})`, 600);
}
function silVisionTick() {
  if (!sfOn() || game.mode !== "world" || game.dialog || game.cine || player.finished) return;
  if ((game.fragCd || 0) > game.t || (game.silCd || 0) > game.t) return;
  const F = player.flags,
    n = allFreed();
  for (let i = 0; i < SIL_VISIONS.length; i++) {
    const V = SIL_VISIONS[i];
    if (F["silV" + i] || n < V.need) continue;
    F["silV" + i] = true;
    saveGame();
    game.silCd = game.t + 4;
    playSound(98, 0.8, "sawtooth", 0.04);
    playCine(silVisionScene, 3.5, () => say(V.lines((typeof possessedCount === "function" ? possessedCount() : 0) > 0)));
    return;
  }
}

/* ===================== 6. CHEFES ANTIGOS ===================== */
const OLD_BOSSES = {
  bosque: { id: "antigoLobo", base: "lobo", nome: "Rei Lobo Ancestral", hp: 300, atk: 18, cor: "#4a4a5a", item: "mantoLobo", lore: "Olhos amarelos se abrem no escuro entre as raízes. Algo muito velho estava dormindo aqui." },
  pantano: { id: "antigoSapo", base: "sapo", nome: "Rainha do Lodo", hp: 320, atk: 18, cor: "#3a6a3a", item: "coroaLodo", lore: "A lama borbulha e uma coroa de musgo sobe à superfície. Por baixo dela, uma boca enorme." },
  picos: { id: "antigoHarpia", base: "harpia", nome: "Harpia da Tempestade", hp: 330, atk: 19, cor: "#5a6a9a", item: "cajadoTormenta", lore: "Um ninho do tamanho de uma casa. Penas de raio estalam no chão." },
  mina: { id: "antigoGolem", base: "golem", nome: "Golem de Cristal Antigo", hp: 380, atk: 20, cor: "#7ab8d8", item: "armaduraCristal", lore: "A parede de cristal tem um rosto. E o rosto está olhando para você." },
  porto: { id: "antigoCapitao", base: "espectro", nome: "Capitão Afogado", hp: 340, atk: 20, cor: "#2a5a7a", item: "amuletoAfogado", lore: "Uma lanterna de navio acende sozinha. Alguém ainda está de vigia, trezentos anos depois." },
};
Object.assign(ITEMS, {
  mantoLobo: { nome: "Manto do Rei Lobo", tipo: "equip", slot: "manto", preco: 0, lend: true, def: 0.2, hp: 40, desc: "LENDÁRIO. -20% de dano recebido e +40 HP." },
  coroaLodo: { nome: "Coroa de Lodo", tipo: "equip", slot: "amuleto", preco: 0, lend: true, hp: 30, regen: 4, desc: "LENDÁRIO. +30 HP e 4 HP por turno." },
  cajadoTormenta: { nome: "Cajado da Tormenta", tipo: "equip", slot: "cajado", preco: 0, lend: true, pow: 0.22, desc: "LENDÁRIO. +22% de dano mágico." },
  armaduraCristal: { nome: "Armadura de Cristal Antigo", tipo: "equip", slot: "armadura", preco: 0, lend: true, def: 0.22, hp: 30, desc: "LENDÁRIO. -22% de dano recebido e +30 HP." },
  amuletoAfogado: { nome: "Amuleto do Afogado", tipo: "equip", slot: "amuleto", preco: 0, lend: true, mp: 40, pow: 0.1, desc: "LENDÁRIO. +40 MP e +10% de dano." },
});
for (const B of Object.values(OLD_BOSSES)) {
  ENEMIES[B.id] = Object.assign({}, ENEMIES[B.base], { nome: B.nome, hp: B.hp, atk: B.atk, xp: 320, cor: B.cor, boss: false, weak: [], resist: [] });
  ENEMY_LEVELS[B.id] = { base: 10, min: 10, boss: true };
}
const OLD_TYPES = Object.values(OLD_BOSSES).map((B) => B.id);

/* ===================== 7. BAÚS RÚNICOS ===================== */
const RUNE_CHESTS = { bosque: "agua", pantano: "ar", picos: "luz", mina: "agua", porto: "sombra" };
const spotCache = {};
function sfSpot(z, k) {
  const key = z + k;
  return spotCache[key] || (spotCache[key] = spotOf(z, k));
}
const bossSpot = (z) => spotCache[z + "chefe-antigo"] || (OLD_BOSSES[z] ? sfSpot(z, "chefe-antigo") : null);
const chestSpot = (z) => spotCache[z + "bau-runico"] || (RUNE_CHESTS[z] ? sfSpot(z, "bau-runico") : null);
const oldDone = () => (player.oldBosses = player.oldBosses || {});
const chestsDone = () => (player.runeChests = player.runeChests || {});

function drawOldBoss(t) {
  const z = player.zone,
    B = OLD_BOSSES[z];
  if (!B || oldDone()[z]) return;
  const [x, y] = bossSpot(z),
    d = Math.hypot(player.x - x, player.y - y);
  if (d > 6) return;
  const a = Math.min(1, (6 - d) / 3),
    X = x * TILE + 16,
    Y = y * TILE + 16;
  ctx.fillStyle = `rgba(120,40,160,${0.3 * a})`;
  ctx.beginPath();
  ctx.arc(X, Y, 22 + 3 * Math.sin(t * 2), 0, 7);
  ctx.fill();
  ctx.fillStyle = `rgba(255,220,80,${a})`;
  ctx.fillRect(X - 7, Y - 3, 4, 3);
  ctx.fillRect(X + 3, Y - 3, 4, 3);
}
function drawRuneChest(t) {
  const z = player.zone,
    r = RUNE_CHESTS[z];
  if (!r) return;
  const [x, y] = chestSpot(z),
    X = x * TILE,
    Y = y * TILE,
    open = chestsDone()[z];
  ctx.fillStyle = open ? "#4a3a2a" : "#3a2a4a";
  ctx.fillRect(X + 4, Y + 12, 24, 16);
  ctx.fillStyle = open ? "#6a5a40" : "#5a4070";
  ctx.fillRect(X + 4, Y + (open ? 4 : 10), 24, open ? 6 : 5);
  ctx.strokeStyle = RUNES[r].cor;
  ctx.lineWidth = 2;
  ctx.strokeRect(X + 4, Y + 12, 24, 16);
  if (!open) glyph(r, X + 16, Y + 20, 6, 0.6 + 0.3 * Math.sin(t * 3));
}

/* ===================== 9. GOLPE EM DUPLA ===================== */
function bestCrew() {
  if (typeof CREW === "undefined") return null;
  const ok = CREW.filter((id) => NPCS[id] && friendshipLevel(id) >= 2);
  return ok.sort((a, b) => friendship(b) - friendship(a))[0] || null;
}
SKILLS.dupla = { nome: "Golpe em dupla", lvl: 1, mp: 10, cd: 5, desc: "O seu melhor amigo da turma ataca junto com a sua magia (precisa de amizade nível 2 com alguém da turma)." };
SKILL_EFFECTS.dupla = function () {
  const id = bestCrew();
  const el = player.dom || player.aff;
  const dmg = Math.max(1, Math.round(28 * levelScale() * dmgMul([el]) * (1 + 0.15 * Math.max(0, friendshipLevel(id) - 2))));
  damageEnemy(dmg);
  battle.eshake = 0.4;
  const ec = enemyCenter();
  burst(ec.x, ec.y, [RUNES[el] ? RUNES[el].cor : "#fff", "#ffd34d", "#fff"], 36, 200);
  return ` ${NPCS[id].nome} ataca junto com ${RUNE_WITH_ARTICLE[el] || "a sua magia"}: ${dmg} de dano!`;
};

/* ===================== 3 e 4. EPÍLOGO E FINAL DO ECO ===================== */
const ARC_EPI = {
  marcos: "Marcos virou capitão da guarda de Cinzaluz. Ele ainda conta da vez em que você treinou os soldados.",
  luca: "Os panfletos de Luca chegaram até Pedravale. Dizem que agora até os anões discutem ideias na taverna.",
  mylena: "A pintura do lírio da Mylena ficou pendurada na taverna. Todo mundo que passa para para olhar.",
  lucas: "Lucas nunca mais teve medo do escuro. Diz que aprendeu com você.",
  andressa: "Andressa terminou de copiar o diário de Vesper. Agora qualquer criança pode ler a história.",
  matheus: "A fazenda do Matheus brilha à noite com os cristais da mina. As vacas não gostam, mas o milho adora.",
};
const ECO_END = [
  ["", "A Canção Arcana flutua na sua frente. O fragmento dentro de você puxa, devagar, na direção de Vesper."],
  ["Fragmento", "Eu fui guardado para este momento. Deixe eu voltar para ele. Ele precisa de mim mais do que você."],
  ["", "Você abre a mão. A luz do seu dom sai do seu peito e entra no peito de Vesper."],
  ["Vesper", "...Odelia? Eu lembro. Eu lembro de TUDO. Do farol, do berço, da Canção. Eu lembro de quem eu era."],
  ["", "O Silêncio se desfaz como névoa ao sol. Não sobra nenhum pedaço de sombra nele."],
];
function ecoEndReady() {
  const F = player.flags;
  return !!(player.dom && F.frag1 && F.frag2 && F.frag3 && F.berco && !(typeof possessedCount === "function" && possessedCount() > 0) && !Object.values(player.guardFate || {}).includes("vilao"));
}
function ecoEndScene(W, H, t) {
  const d = player.dom && DONS[player.dom] ? DONS[player.dom] : { cor: "#fff0a0" };
  ctx.fillStyle = "#0a0814";
  ctx.fillRect(0, 0, W, H);
  ctx.globalAlpha = Math.min(1, t / 2) * 0.4;
  rays(W / 2, H / 2, 16, W, d.cor, t);
  ctx.globalAlpha = 1;
  const k = Math.min(1, t / 3);
  glyph(player.dom || "luz", W / 2 - 120 + 240 * k, H / 2, 18 + 6 * Math.sin(t * 4), 1);
  ctx.textAlign = "center";
  if (t > 1) txt("O Final do Eco", W / 2, 60, 28, d.cor);
  if (t > 2.5) txt("O último pedaço bom volta para casa", W / 2, H - 60, 18, `rgba(255,255,255,${Math.min(1, t - 2.5)})`, 600);
}

/* ===================== LIGAÇÕES ===================== */
(() => {
  const upBase = update;
  update = function () {
    const r = upBase.apply(this, arguments);
    if (sfOn()) silVisionTick();
    return r;
  };

  // 2. Guardiões reagem às suas escolhas (e um ajuda no fim)
  const GTYPES = ["ent", "fenixf", "serpente", "grifo", "basilisco", "leviata"];
  const sbBase = startBattle;
  startBattle = function (type) {
    const r = sbBase.apply(this, arguments);
    const B = battle;
    if (!sfOn() || !B || !B.e) return r;
    const poss = typeof possessedCount === "function" ? possessedCount() : 0;
    if (GTYPES.includes(type)) {
      if (poss > 0) {
        const k = 1 + 0.1 * poss;
        B.e.atk *= k;
        B.e.max = Math.round(B.e.max * (1 + 0.08 * poss));
        B.e.hp = B.e.max;
        setTimeout(() => battle === B && battleLog(`${B.e.nome}: "Eu senti o que você fez com os outros Guardiões. Você NÃO vai arrancar a minha runa!" (Fúria: +${Math.round((k - 1) * 100)}% de ataque)`), 4200);
      } else if (heroFreed() >= 2) {
        B.e.max = Math.round(B.e.max * 0.9);
        B.e.hp = B.e.max;
        setTimeout(() => battle === B && battleLog(`${B.e.nome} hesita: "Os outros Guardiões falam de você. Dizem que você liberta, não rouba." (-10% de vida)`), 4200);
      }
    }
    if (type === "silenciador" && heroFreed() >= 5 && poss === 0) {
      B.guardAlly = "Ent Guardião";
      setTimeout(() => battle === B && battleLog("✦ As raízes do Ent atravessam o chão da Torre! Ele veio lutar do seu lado."), 2400);
    }
    if (OLD_TYPES.includes(type) || /^nyx/.test(type)) B.canShift = true;
    return r;
  };
  const etBase = enemyTurn;
  enemyTurn = function () {
    const B = battle;
    if (B && B.e && B.e.hp > 0 && !B.done) {
      B.sfTurn = (B.sfTurn || 0) + 1;
      if (B.guardAlly && B.sfTurn % 3 === 0) {
        const dmg = Math.round(B.e.max * 0.04),
          heal = Math.round(maxHp() * 0.08);
        damageEnemy(dmg, "#7ad36b");
        healPlayer(heal);
        battleLog(`O ${B.guardAlly} acerta o Silenciador com os galhos (${dmg}) e te cura (+${heal} HP).`);
        if (B.e.hp <= 0) return setTimeout(win, 600);
      }
      // 8. troca de fraqueza no meio da luta
      if (B.canShift && !B.shifted && B.e.hp < B.e.max * 0.5) {
        B.shifted = true;
        const old = (B.e.weak || [])[0];
        const pool = castList().filter((r) => r !== old);
        const nw = pool[Math.floor(Math.random() * pool.length)];
        if (nw) {
          B.e.weak = [nw];
          B.e.resist = old ? [old] : [];
          battleLog(`⚠ ${B.e.nome} muda de forma! Agora é fraco contra ${RUNES[nw].nome}${old && RUNES[old] ? ` e resiste a ${RUNES[old].nome}` : ""}.`);
        }
      }
    }
    return etBase.apply(this, arguments);
  };

  // 6 e 7. Chefes Antigos e Baús Rúnicos no mapa
  const tgBase = targetAt;
  targetAt = function (x, y) {
    if (sfOn()) {
      const z = player.zone;
      if (OLD_BOSSES[z] && !oldDone()[z] && near(bossSpot(z), x, y)) return "Algo muito antigo dorme aqui";
      if (RUNE_CHESTS[z] && near(chestSpot(z), x, y)) return chestsDone()[z] ? "Baú Rúnico (vazio)" : `Baú Rúnico (${RUNES[RUNE_CHESTS[z]].nome})`;
    }
    return tgBase(x, y);
  };
  const iaBase = interactAt;
  interactAt = function (x, y) {
    if (sfOn()) {
      const z = player.zone;
      if (OLD_BOSSES[z] && !oldDone()[z] && near(bossSpot(z), x, y)) {
        const B = OLD_BOSSES[z];
        return say([["", B.lore]], () =>
          choice(B.nome, `Um Chefe Antigo, muito mais forte que um Guardião (nível 10 ou mais). Ele troca de fraqueza no meio da luta. Vencer dá um item LENDÁRIO.`, [
            { t: "Despertar o Antigo", icon: "skull", fn: () => ((game.oldFight = z), startBattle(B.id, null)) },
            { t: "Deixar dormir (por enquanto)", icon: "heart", fn: () => {} },
          ]),
        );
      }
      if (RUNE_CHESTS[z] && near(chestSpot(z), x, y)) {
        const r = RUNE_CHESTS[z];
        if (chestsDone()[z]) return say([["", "O Baú Rúnico está vazio. O símbolo da runa ainda brilha fraquinho na tampa."]]);
        if (!player.runes.includes(r)) return say([["", `Um baú selado com o símbolo ${RUNE_OF[r]}. Nenhuma magia que você tem abre isso. Volte quando tiver a Runa ${RUNE_OF[r]}.`]]);
        chestsDone()[z] = true;
        player.gold += 200;
        addItem("fenix");
        addItem("eter", 2);
        saveGame();
        playSound(784, 0.3, "triangle", 0.05);
        return say([["", `Você toca o símbolo com a Runa ${RUNE_OF[r]} e o baú se abre com um suspiro. +200 de ouro, uma Pena da Fênix e 2 Éteres!`]]);
      }
    }
    return iaBase(x, y);
  };
  const wkBase = walkable;
  walkable = function (z, x, y) {
    if (z === player.zone) {
      const b = spotCache[z + "chefe-antigo"],
        c = spotCache[z + "bau-runico"];
      if (b && b[0] === x && b[1] === y && !oldDone()[z]) return false;
      if (c && c[0] === x && c[1] === y) return false;
    }
    return wkBase(z, x, y);
  };
  const cdBase = crewDrawList;
  crewDrawList = function (list, t) {
    cdBase(list, t);
    if (!sfOn()) return;
    const z = player.zone;
    if (OLD_BOSSES[z] && !oldDone()[z]) list.push({ y: bossSpot(z)[1] + 0.01, draw: () => drawOldBoss(t) });
    if (RUNE_CHESTS[z]) list.push({ y: chestSpot(z)[1] + 0.01, draw: () => drawRuneChest(t) });
  };
  const prBase = applyPostBattleRewards;
  applyPostBattleRewards = function () {
    const z = game.oldFight;
    const r = prBase.apply(this, arguments);
    if (z) {
      game.oldFight = null;
      oldDone()[z] = true;
      const B = OLD_BOSSES[z];
      addItem(B.item);
      saveGame();
      setTimeout(() => say([["", `${B.nome} cai e vira poeira brilhante. No meio dela, algo lendário: ${ITEMS[B.item].nome}!`]]), 900);
    }
    return r;
  };
  ACHIEVEMENTS.push(["antigos", "Caçador de Antigos", "Vença os 5 Chefes Antigos escondidos nas regiões.", "skull", () => Object.keys(OLD_BOSSES).every((z) => (player.oldBosses || {})[z])]);
  ACHIEVEMENTS.push(["runicos", "Chaveiro das Runas", "Abra os 5 Baús Rúnicos.", "flag", () => Object.keys(RUNE_CHESTS).every((z) => (player.runeChests || {})[z])]);
  ACHIEVEMENTS.push(["finalEco", "O Final do Eco", "Devolva o fragmento a Vesper.", "heart", () => !!(player.flags || {}).ecoEnd]);

  // 9. dupla: só com um amigo da turma
  const suBase = skillUnlocked;
  skillUnlocked = function (id) {
    if (id === "dupla") return !lifeMode() && !!bestCrew();
    return suBase.apply(this, arguments);
  };

  // 4. Final do Eco
  const sdBase = silencerDefeated;
  silencerDefeated = function (heroic) {
    if (!ecoEndReady()) return sdBase.apply(this, arguments);
    choice("O fragmento chama", "Você viu as três revelações, achou o berço e não arrancou nenhuma runa. O fragmento quer voltar para Vesper.", [
      {
        t: "Deixar o fragmento voltar para Vesper (Final do Eco)",
        icon: "heart",
        fn: () => {
          player.flags.ecoEnd = true;
          saveGame();
          playCine(ecoEndScene, 4.5, () => say(ECO_END, () => sdBase(heroic)));
        },
      },
      { t: "Guardar o fragmento (final de sempre)", icon: "star", fn: () => sdBase(heroic) },
    ]);
  };

  // 3 e 4. epílogo
  const epBase = startEpilogue;
  startEpilogue = function () {
    const r = epBase.apply(this, arguments);
    if (sfOn()) {
      const extra = [];
      if (typeof arcsDone === "function") for (const id of arcsDone()) if (ARC_EPI[id]) extra.push(["Narrador", ARC_EPI[id]]);
      if (player.flags.ecoEnd)
        extra.push(["Narrador", "Vesper voltou inteiro. Ele lembra de cada nota da Canção, e ensina as crianças a cantar na praça."], ["Narrador", "O fragmento se foi. Às vezes, em silêncio, você ainda sente ele cantar baixinho dentro de você."]);
      if (extra.length) EPILOGUE.splice(EPILOGUE.length - 1, 0, ...extra);
    }
    return r;
  };

  // 10. recapitulação ao voltar
  const sgBase = startGame;
  startGame = function (intro) {
    const r = sgBase.apply(this, arguments);
    if (!intro && !game.recapDone && sfOn() && !player.finished) {
      game.recapDone = true;
      const ci = STEPS.indexOf(curStep());
      if (ci > 0)
        (function tryRecap(n) {
          if (n > 20) return;
          if (game.mode !== "world" || game.dialog || game.cine) return setTimeout(() => tryRecap(n + 1), 1000);
          const last = STEPS[ci - 1];
          say([
            ["", `Da última vez: ${last.t.replace(/^./, (c) => c.toLowerCase())} (feito).`],
            ["", `Você tem ${player.runes.length} de 6 runas${player.dom && DONS[player.dom] ? ` e o dom ${RUNE_OF[player.dom]}` : ""}. Agora: ${curStep().t}.`],
          ]);
        })(0);
    }
    return r;
  };

  // 11. missões separadas por capítulo
  const oqBase = openQuests;
  openQuests = function () {
    const r = oqBase.apply(this, arguments);
    if (!sfOn() || typeof CHAPTER_CARDS === "undefined") return r;
    const box = byId("quests"),
      ci = STEPS.indexOf(curStep());
    const nodes = [...box.querySelectorAll(":scope > .qs")].slice(0, ci + 1);
    const chs = STEPS.map((s, i) => [i, CHAPTER_CARDS[s.id]]).filter(([, c]) => c);
    let n = 0;
    nodes.forEach((el, i) => {
      const C = CHAPTER_CARDS[STEPS[i].id];
      if (!C) return;
      n++;
      const h = document.createElement("h3");
      h.className = "q-chap";
      h.textContent = `${C[0]}: ${C[1]}`;
      el.parentNode.insertBefore(h, el);
    });
    const head = document.createElement("div");
    head.className = "qtip";
    head.textContent = `Capítulo ${Math.max(1, n)} de ${chs.length}`;
    if (nodes[0]) nodes[0].parentNode.insertBefore(head, nodes[0].previousSibling && nodes[0].previousSibling.className === "q-chap" ? nodes[0].previousSibling : nodes[0]);
    if (!byId("qchapCSS")) {
      const st = document.createElement("style");
      st.id = "qchapCSS";
      st.textContent = "#quests h3.q-chap{margin:.7em 0 .2em;color:var(--gold);font-size:.95em}#quests .qs.done{text-decoration:line-through;opacity:.6}";
      document.head.appendChild(st);
    }
    return r;
  };
})();
