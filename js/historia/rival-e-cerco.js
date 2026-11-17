/**
 * ECOS DO ARCANO — rival-e-cerco.js (modo História)
 * Mais coisa acontecendo entre um Guardião e outro:
 *  - Cartões de capítulo: cada etapa grande abre com um título.
 *  - O Silêncio ataca Cinzaluz: duas invasões obrigam você a escolher quem salvar; quem você
 *    não salvou perde a voz até o próximo Guardião acordar.
 * Modifica (envolve) funções de outros arquivos: applyPostBattleRewards,
 * createEnemy, crewDrawList, dmgMul, draw, enemyTurn, enterZone, socialMenu,
 * startBattle, startEpilogue, update.
 */

"use strict";

/* ===================== INIMIGOS NOVOS ===================== */
ENEMIES.arauto = Object.assign({}, ENEMIES.espectro, { nome: "Arauto do Silêncio", hp: 95, atk: 11, xp: 80, cor: "#6a6a80", boss: false, story: true });
ENEMIES.arauto2 = Object.assign({}, ENEMIES.arauto, { nome: "Arauto Maior do Silêncio", hp: 170, atk: 15, xp: 150 });
Object.assign(ENEMY_LEVELS, {
  arauto: { base: 5, min: 5, boss: true },
  arauto2: { base: 8, min: 9, boss: true },
});
const STORY_FIGHTS = ["arauto", "arauto2"];

function siege() {
  return (player.siege = player.siege || { c1: null, c2: null });
}
function silenced() {
  return (player.silenced = player.silenced || []);
}

/* ===================== FILA DE ACONTECIMENTOS =====================
 * Tudo aqui espera o jogo ficar livre (no mapa, sem fala, sem cena, sem luta),
 * para nunca passar por cima de outra cena nem abrir no meio de uma luta. */
let storyWait = 0;
function storyFree() {
  return story() && game.mode === "world" && !game.dialog && !game.cine && !battle && !game.ep && !player.finished && !player.villainEnd;
}

/* ===================== CARTÕES DE CAPÍTULO ===================== */
const CHAPTER_CARDS = {
  treino: ["Prólogo", "A Vila sem Som", "Cinzaluz esqueceu como se canta."],
  ent: ["Capítulo I", "O Bosque que Esqueceu", "As árvores guardam o nome de quem passou."],
  porto1: ["Capítulo II", "Névoa sobre Brisamar", "Um farol apagado, um capitão sem estrelas."],
  serra1: ["Capítulo III", "O Coração de Pedra", "Nas montanhas, até o eco tem medo."],
  basil: ["Capítulo IV", "O Que Dorme Embaixo", "Os dois últimos Guardiões nunca deveriam acordar."],
  sile: ["Capítulo Final", "A Torre do Silêncio", "Trezentos anos de silêncio esperam por você."],
};
function chapterCard(kicker, title, sub) {
  return (W, H, t) => {
    ctx.fillStyle = "#06040b";
    ctx.fillRect(0, 0, W, H);
    // Entra devagar e fica na tela até você tocar.
    const a = Math.min(1, t / 1.2);
    ctx.save();
    ctx.globalAlpha = Math.max(0, a);
    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(255,224,140,.6)";
    ctx.fillRect(W / 2 - 120 * Math.min(1, t), H / 2 - 4, 240 * Math.min(1, t), 2);
    txt(kicker.toUpperCase(), W / 2, H / 2 - 50, 16, "#ffd98a", 600);
    txt(title, W / 2, H / 2 - 14, 34, "#fff");
    txt(sub, W / 2, H / 2 + 34, 16, "rgba(220,210,255,.85)", 500);
    ctx.restore();
  };
}
function chapterTick() {
  const id = curStep().id,
    C = CHAPTER_CARDS[id];
  player.cards = player.cards || [];
  if (!C || player.cards.includes(id)) return false;
  player.cards.push(id);
  playSound(196, 0.6, "triangle");
  playCine(chapterCard(...C), 3.6);
  return true;
}

/* ===================== O SILÊNCIO ATACA CINZALUZ ===================== */
const SIEGES = {
  c1: {
    when: () => guardiansFreed() >= 1,
    foe: "arauto",
    a: { id: "bardo", t: "Correr até a praça e proteger o Bardo Lírio (a música da vila)" },
    b: { id: "abrigo", t: "Correr até o abrigo e proteger a Cuidadora Lila e as crianças" },
  },
  c2: {
    when: () => guardiansFreed() >= 3,
    foe: "arauto2",
    a: { id: "iara", t: "Defender a Biblioteca e a Bibliotecária Iara (os livros de Vesper)" },
    b: { id: "curandeira", t: "Defender a Casa de Cura e a Curandeira Maíra (os feridos)" },
  },
};
function siegeTick() {
  if (player.zone !== "vila") return false;
  const S = siege();
  const k = ["c1", "c2"].find((key) => !S[key] && SIEGES[key].when());
  if (!k) return false;
  const C = SIEGES[k];
  if (!NPCS[C.a.id] || !NPCS[C.b.id]) return ((S[k] = "pulado"), false);
  S[k] = "andando";
  if (!settings.calm) game.shake = 0.6;
  playSound(70, 0.9, "sawtooth");
  const pickSide = (keep, lose) => () => {
    S[k] = keep.id;
    if (!silenced().includes(lose.id)) silenced().push(lose.id);
    vilaNews(`O Silêncio atacou Cinzaluz. ${shortName(lose.id)} perdeu a voz.`);
    saveGame();
    say([["", "Você corre o mais rápido que consegue. Do outro lado da vila, um grito começa... e para no meio."]], () => startBattle(C.foe, null));
  };
  say(
    [
      ["", k === "c1" ? "Os sinos de Cinzaluz param no meio da batida. O vento para. Até os passarinhos param." : "A vila escurece em pleno dia. As sombras das casas começam a andar sozinhas."],
      ["Guarda Tomé", k === "c1" ? "ECOS DO SILÊNCIO! Estão entrando por dois lados!" : "De novo não! São mais fortes desta vez! Precisamos de você!"],
      ["Arquimaga Odelia", "Eu seguro a barreira do sul! Você só consegue chegar a um lado a tempo. Escolha!"],
    ],
    () => choice("O Silêncio ataca Cinzaluz", "Quem você vai proteger?", [{ t: C.a.t, icon: "armor", fn: pickSide(C.a, C.b) }, { t: C.b.t, icon: "armor", fn: pickSide(C.b, C.a) }]),
  );
  return true;
}
function siegeAfter() {
  const S = siege(),
    k = S.c2 && S.c2 !== "andando" && S.c2 !== "pulado" && !S.c2done ? "c2" : S.c1 && !S.c1done ? "c1" : null;
  if (!k) return;
  S[k + "done"] = true;
  const saved = S[k],
    lost = (k === "c1" ? [SIEGES.c1.a.id, SIEGES.c1.b.id] : [SIEGES.c2.a.id, SIEGES.c2.b.id]).find((id) => id !== saved);
  saveGame();
  say([
    [shortName(saved), "Você veio... Você veio mesmo. Obrigad" + gw(saved, "o", "a") + "."],
    ["", `Do outro lado da vila, ${shortName(lost)} abre a boca e não sai som nenhum. O Silêncio levou a voz.`],
    ["Arquimaga Odelia", "Não é culpa sua. Liberte o próximo Guardião: cada runa que volta devolve um pouco do que ele tirou."],
  ]);
}
function restoreTick() {
  if (!player.restoreVoice) return false;
  const id = player.restoreVoice;
  player.restoreVoice = null;
  saveGame();
  playSound(784, 0.3, "sine");
  vilaNews(`A voz de ${shortName(id)} voltou quando um Guardião acordou.`);
  say([["", `Lá em Cinzaluz, ${shortName(id)} respira fundo... e canta. A voz voltou!`], [shortName(id), "Eu ouvi tudo, o tempo todo. Obrigad" + gw(id, "o", "a") + " por não desistir."]]);
  return true;
}

/* ===================== LIGAÇÕES ===================== */
{
  const ezBase = enterZone;
  enterZone = function () {
    const r = ezBase.apply(this, arguments);
    storyWait = 1.3;
    return r;
  };
  const updBase = update;
  let acc = 0;
  update = function (dt) {
    updBase(dt);
    if (!storyFree()) return;
    if (storyWait > 0) return void (storyWait -= dt);
    acc += dt;
    if (acc < 0.4) return;
    acc = 0;
    chapterTick() || restoreTick() || siegeTick();
  };

  // Lutas da história nunca são recusadas por cansaço.
  const sbBase = startBattle;
  startBattle = function (type, mob, opts = {}) {
    if (story() && STORY_FIGHTS.includes(type) && typeof fightCost === "function" && stamina() < fightCost(type)) player.stamina = fightCost(type);
    const r = sbBase(type, mob, opts);
    return r;
  };
  const ceBase = createEnemy;
  createEnemy = function (type) {
    const out = ceBase(type);
    if (STORY_FIGHTS.includes(type)) {
      out.enemy.weak = [player.aff || "fogo"];
      out.enemy.resist = [];
    }
    return out;
  };
  const aprBase = applyPostBattleRewards;
  applyPostBattleRewards = function (enemy, type, mob, levelsGained) {
    const r = aprBase.apply(this, arguments);
    if (!story()) return r;
    if (type === "arauto" || type === "arauto2") setTimeout(siegeAfter, 400);
    return r;
  };
  const rgBase = rewardGuardian;
  rewardGuardian = function () {
    const r = rgBase.apply(this, arguments);
    if (story() && silenced().length) player.restoreVoice = silenced().shift();
    return r;
  };

  // Quem perdeu a voz só consegue olhar para você.
  const ntBase = npcTalkOrQuests;
  npcTalkOrQuests = function (id) {
    if (story() && silenced().includes(id)) return socialMenu(id);
    return ntBase.apply(this, arguments);
  };
  const smBase = socialMenu;
  socialMenu = function (id) {
    if (story() && silenced().includes(id)) {
      const n = shortName(id);
      return say([[n, "..."], ["", `${n} abre a boca, mas não sai som. Os olhos dizem tudo. Libertar o próximo Guardião pode trazer a voz de volta.`]]);
    }
    return smBase(id);
  };

  const cdBase = crewDrawList;
  crewDrawList = function (list, t) {
    cdBase(list, t);
    if (!story()) return;
    if (player.zone === "vila")
      silenced().forEach((id) => {
        const p = npcPos(id);
        if (!p) return;
        list.push({
          y: p[1] + 0.01,
          draw: () => {
            const X = p[0] * TILE + 6,
              Y = p[1] * TILE - 12 - Math.abs(Math.sin(t * 2)) * 2;
            ctx.fillStyle = "rgba(30,30,40,.75)";
            ctx.fillRect(X, Y, 20, 10);
            ctx.fillStyle = "#b8b8c8";
            for (let i = 0; i < 3; i++) ctx.fillRect(X + 4 + i * 5, Y + 4, 2, 2);
          },
        });
      });
  };

}
