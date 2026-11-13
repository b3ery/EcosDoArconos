/**
 * ECOS DO ARCANO — rival-e-cerco.js (modo História)
 * Mais coisa acontecendo entre um Guardião e outro:
 *  - Cartões de capítulo: cada etapa grande abre com um título.
 *  - Nyx, a Caçadora de Runas: uma rival que trabalha para o Silenciador.
 *    Aparece no Bosque, no Pântano e nos Picos. O que você faz com ela decide
 *    se ela luta do seu lado na Torre ou contra você.
 *  - O Silêncio ataca Cinzaluz: duas invasões obrigam você a escolher quem salvar; quem você
 *    não salvou perde a voz até o próximo Guardião acordar.
 * Modifica (envolve) funções de outros arquivos: applyPostBattleRewards,
 * createEnemy, crewDrawList, dmgMul, draw, enemyTurn, enterZone, socialMenu,
 * startBattle, startEpilogue, update.
 */

"use strict";

/* ===================== INIMIGOS NOVOS ===================== */
ENEMIES.nyx1 = Object.assign({}, ENEMIES.diretor, { nome: "Nyx, a Caçadora de Runas", hp: 110, atk: 10, xp: 90, cor: "#2fb8a8", boss: false, story: true, special: "seal" });
ENEMIES.nyx2 = Object.assign({}, ENEMIES.nyx1, { hp: 170, atk: 13, xp: 140, special: "regen" });
ENEMIES.nyx3 = Object.assign({}, ENEMIES.nyx1, { nome: "Nyx, a Voz Roubada", hp: 260, atk: 17, xp: 220, cor: "#1b6f66", special: "seal" });
ENEMIES.arauto = Object.assign({}, ENEMIES.espectro, { nome: "Arauto do Silêncio", hp: 95, atk: 11, xp: 80, cor: "#6a6a80", boss: false, story: true });
ENEMIES.arauto2 = Object.assign({}, ENEMIES.arauto, { nome: "Arauto Maior do Silêncio", hp: 170, atk: 15, xp: 150 });
Object.assign(ENEMY_LEVELS, {
  nyx1: { base: 4, min: 4, boss: true },
  nyx2: { base: 6, min: 7, boss: true },
  nyx3: { base: 9, min: 11, boss: true },
  arauto: { base: 5, min: 5, boss: true },
  arauto2: { base: 8, min: 9, boss: true },
});
const STORY_FIGHTS = ["nyx1", "nyx2", "nyx3", "arauto", "arauto2"];
const NYX_LOOK = { robe: "#1f5f58", hat: "#0f2f2c", hair: "#e8e8f0" };

/** Estado da Nyx e do cerco, guardado no save. */
function nyx() {
  return (player.nyx = player.nyx || { s1: false, s2: false, s3: false, trust: 0, final: false, ally: false, dead: false, hint: false });
}
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
    const a = Math.min(1, t / 0.8) * Math.min(1, Math.max(0, 3.4 - t) / 0.6);
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

/* ===================== NYX, A CAÇADORA DE RUNAS ===================== */
/** Põe a Nyx no mapa, perto de você, enquanto a cena dela durar. */
function placeNyx() {
  const opts = [[0, -2], [2, 0], [-2, 0], [0, 2], [0, -1], [1, 0], [-1, 0], [0, 1]];
  for (const [dx, dy] of opts) {
    const x = player.x + dx,
      y = player.y + dy;
    if (walkable(player.zone, x, y)) return (game.nyxAt = { z: player.zone, x, y });
  }
  game.nyxAt = { z: player.zone, x: player.x, y: player.y - 1 };
}
function nyxSay(lines, cb) {
  say(lines.map((l) => (typeof l === "string" ? ["Nyx", l] : l)), cb);
}
function nyxTick() {
  const N = nyx(),
    z = player.zone,
    freeHere = !player.guards.includes(z); // o Guardião daqui ainda dorme
  if (N.dead) return false;
  if (["bosque", "pantano", "picos", "torre"].includes(z)) placeNyx();
  // 1. Bosque: ela chega antes de você.
  if (!N.s1 && z === "bosque" && freeHere) {
    N.s1 = true;
    saveGame();
    nyxSay(
      [
        ["", "Uma figura de capa verde-escura está agachada ao lado das raízes, desenhando runas na terra."],
        "Então você é a pessoa que a velha Odelia mandou. Achei que seria mais alta.",
        "Meu nome é Nyx. O Silenciador me paga em silêncio, e eu gosto do pagamento.",
        "As runas são dele. Volta pra casa, aprendiz, antes que alguém se machuque.",
      ],
      () => startBattle("nyx1", null),
    );
    return true;
  }
  // 2. Pântano: ela está roubando a névoa. Dá para estender a mão.
  if (N.s1 && !N.s2 && z === "pantano" && freeHere) {
    N.s2 = true;
    saveGame();
    nyxSay(
      [
        ["", "Nyx está de pé sobre a água parada, enchendo um frasco com a névoa da Serpente."],
        "Você de novo. Tem noção de quanta gente queria estar no seu lugar? Escolhida, ensinada, protegida...",
        "Eu fui uma criança que perdeu a voz numa febre. Ninguém me ouvia. O Silenciador foi o único que veio.",
      ],
      () =>
        choice("Nyx, no pântano", "Ela segura o frasco como quem segura a última coisa que tem.", [
          { t: "Estender a mão: \"Eu estou te ouvindo agora\"", icon: "heart", fn: () => ((N.trust += 1), nyxSay(["...Não faz isso. Não finge que se importa.", "(Ela hesita um segundo a mais do que devia.) Em guarda!"], () => startBattle("nyx2", null))) },
          { t: "\"Então você escolheu o lado errado\"", icon: "sword", fn: () => nyxSay(["Lado errado? Só existe o lado de quem te escuta.", "Vem!"], () => startBattle("nyx2", null)) },
        ]),
    );
    return true;
  }
  // 3. Picos: ela falhou e foi castigada.
  if (N.s2 && !N.s3 && z === "picos" && freeHere) {
    N.s3 = true;
    saveGame();
    const opts = [
      {
        t: itemCount("pocao") ? "Dar uma poção para ela" : "Cuidar dos ferimentos dela (−25% da sua vida)",
        icon: "heart",
        fn: () => {
          if (itemCount("pocao")) removeItem("pocao");
          else player.hp = Math.max(1, Math.round(player.hp - maxHp() * 0.25));
          N.trust += 1;
          N.hint = true;
          saveGame();
          nyxSay([
            "Por quê...? Eu tentei te machucar duas vezes.",
            "...Escuta. Quando a máscara dele rachar, ele fica com medo. Medo de verdade. Bate com força nessa hora.",
            ["", "Dica da Nyx: +10% de dano contra o Silenciador."],
            "E aprendiz... obrigada. Faz muito tempo que eu não digo isso.",
          ]);
        },
      },
      { t: "Deixar ela ali e seguir em frente", icon: "door", fn: () => ((N.trust -= 1), saveGame(), nyxSay(["Claro. Todo mundo vai embora. Eu já devia saber."])) },
    ];
    if (typeof darkPath === "function" && darkPath())
      opts.push({
        t: "Acabar com ela (ninguém vai sentir falta)",
        icon: "skull",
        fn: () => {
          N.dead = true;
          player.villain = (player.villain || 0) + 2;
          saveGame();
          say([["", "Você ergue a mão. Nyx não tenta fugir. Ela só fecha os olhos."], ["", "O vento dos Picos leva o último som que ela faz. Ninguém ouve."]]);
        },
      });
    say(
      [
        ["", "Encolhida atrás de uma pedra, Nyx tenta se levantar e não consegue. Há marcas roxas de silêncio nos braços dela."],
        ["Nyx", "Ele me castigou porque você venceu. Diz que eu sou inútil. Talvez seja."],
        ["Nyx", "Vai, termina o serviço. Ou vai embora. Tanto faz."],
      ],
      () => choice("Nyx, ferida", "O que você faz?", opts),
    );
    return true;
  }
  // 4. Torre: aliada ou última barreira.
  if (N.s1 && !N.final && z === "torre") {
    if (N.trust >= 2) {
      N.final = true;
      N.ally = true;
      saveGame();
      nyxSay([["", "Passos atrás de você. Nyx, com a capa rasgada e os olhos firmes."], "Você me ouviu quando ninguém ouvia. Agora eu escolho o meu lado.", "Vamos calar esse Silêncio. Lá em cima, eu luto com você."]);
      return true;
    }
    nyxSay(
      [
        ["", "No primeiro andar da torre, Nyx bloqueia a escada. A voz dela soa estranha: dupla, como um eco."],
        "Ele me deu a voz dele. Agora eu falo o que ele quer. Que bonito, não é?",
        "Se você quer subir, vai ter que passar por mim.",
      ],
      () => startBattle("nyx3", null),
    );
    return true;
  }
  return false;
}
/** Depois de cada vitória contra a Nyx. */
function nyxAfter(type) {
  const N = nyx();
  if (type === "nyx1") return nyxSay(["Tch... Sorte de principiante.", "Isso não acabou, aprendiz. Eu sempre chego antes."]);
  if (type === "nyx2")
    return choice("Nyx caiu de joelhos", "O frasco de névoa rola até os seus pés.", [
      { t: "Devolver o frasco para ela e deixar ela ir", icon: "heart", fn: () => ((N.trust += 1), saveGame(), nyxSay(["...Você é muito estranha, sabia?", "(Ela some na névoa, mas olha para trás uma vez.)"])) },
      { t: "Ficar com o frasco (ela perdeu)", icon: "coin", fn: () => (addItem("eter", 2), (N.trust -= 1), saveGame(), say([["Nyx", "Pode ficar. Já levaram tudo de mim mesmo."], ["", "Você ganhou 2 Éteres."]])) },
    ]);
  if (type === "nyx3") {
    N.final = true;
    saveGame();
    return nyxSay([
      ["", "A voz dupla se desfaz. Sobra só a de Nyx: rouca, baixinha, dela."],
      "Ele prometeu que eu nunca mais ficaria sem voz... e eu fiquei sem nada.",
      "Sobe. Termina isso. Eu... vou estar torcendo. Do meu jeito.",
    ]);
  }
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
    game.nyxAt = null;
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
    chapterTick() || restoreTick() || siegeTick() || nyxTick();
  };

  // Lutas da história nunca são recusadas por cansaço.
  const sbBase = startBattle;
  startBattle = function (type, mob, opts = {}) {
    if (story() && STORY_FIGHTS.includes(type) && typeof fightCost === "function" && stamina() < fightCost(type)) player.stamina = fightCost(type);
    const r = sbBase(type, mob, opts);
    if (battle && type === "silenciador" && nyx().ally && !nyx().dead) {
      battle.nyx = { healed: false };
      const B = battle;
      setTimeout(() => battle === B && battleLog("Nyx salta da escada com as adagas de névoa: \"Hoje ele vai ouvir nós dois!\""), 1300);
    }
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
    if (type === "nyx1" || type === "nyx2" || type === "nyx3") setTimeout(() => nyxAfter(type), 400);
    if (type === "arauto" || type === "arauto2") setTimeout(siegeAfter, 400);
    return r;
  };
  const rgBase = rewardGuardian;
  rewardGuardian = function () {
    const r = rgBase.apply(this, arguments);
    if (story() && silenced().length) player.restoreVoice = silenced().shift();
    return r;
  };

  // Nyx luta do seu lado na Torre.
  const etBase = enemyTurn;
  enemyTurn = function () {
    const B = battle;
    if (B && B.nyx && B.e && B.e.hp > 0) {
      if (!B.nyx.healed && player.hp < maxHp() * 0.4) {
        B.nyx.healed = true;
        const h = Math.round(maxHp() * 0.25);
        healPlayer(h, "#6ff0dc");
        battleLog(`Nyx se joga na frente do golpe e te puxa para trás: +${h} de vida!`);
      } else {
        const dmg = Math.max(4, Math.round((8 + player.lvl * 1.8) * (0.8 + Math.random() * 0.4)));
        damageEnemy(dmg, "#6ff0dc", -60, 20);
        battleLog(`Nyx ${pk(["corta com as adagas de névoa", "aparece atrás dele e ataca", "grita com a voz que é dela"])}: ${dmg} de dano!`);
        if (B.e.hp <= 0) return setTimeout(win, DELAY.WIN);
      }
    }
    return etBase();
  };
  const dmBase = dmgMul;
  dmgMul = function (els) {
    let m = dmBase(els);
    if (battle && battle.type === "silenciador" && nyx().hint) m *= 1.1;
    return m;
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

  const slBase = speakerLook;
  speakerLook = function (name) {
    if (name === "Nyx" || name === "Nyx, a Voz Roubada") return { robe: NYX_LOOK.robe, hat: NYX_LOOK.hat, hair: NYX_LOOK.hair, seed: 2 };
    return slBase(name);
  };

  const cdBase = crewDrawList;
  crewDrawList = function (list, t) {
    cdBase(list, t);
    if (!story()) return;
    const A = game.nyxAt;
    if (A && A.z === player.zone && (game.dialog || game.mode === "choice"))
      list.push({ y: A.y, draw: () => drawSprite(wizardRects(NYX_LOOK.robe, NYX_LOOK.hat, NYX_LOOK.hair, null, A.x < player.x ? "right" : A.x > player.x ? "left" : A.y < player.y ? "down" : "up", 0, 2), A.x * TILE, A.y * TILE, 2, false) });
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

  // Nyx na luta final: desenhada atrás de você.
  const drawB2 = draw;
  draw = function () {
    drawB2();
    if (game.mode !== "battle" || !battle || !battle.nyx) return;
    ctx.save();
    ctx.translate((viewWidth - 640) / 2, 0);
    const pc = playerCenter(),
      u = BATTLE_PLAYER_POS.u * 0.8,
      x = pc.x - (battle.ally ? 140 : 80);
    ctx.fillStyle = "rgba(0,0,0,.25)";
    ctx.beginPath();
    ctx.ellipse(x, pc.y + 7 * u, 6 * u, 1.6 * u, 0, 0, 7);
    ctx.fill();
    drawSprite(wizardRects(NYX_LOOK.robe, NYX_LOOK.hat, NYX_LOOK.hair, null, "right", Math.floor(game.t * 3) % 2), x - 8 * u, pc.y - 9 * u, u, false);
    ctx.font = '600 12px "Pixelify Sans", sans-serif';
    ctx.fillStyle = "#9ff5e6";
    ctx.textAlign = "center";
    ctx.fillText("Nyx", x, pc.y - 10 * u);
    ctx.restore();
  };

  // O destino da Nyx entra no final.
  const seBase = startEpilogue;
  startEpilogue = function () {
    const N = nyx();
    if (!story() || !N.s1 || N.told) return seBase.apply(this, arguments);
    N.told = true;
    const line = N.dead
      ? "Nos Picos Uivantes, ninguém lembra o nome da caçadora de capa verde. O vento lembra."
      : N.ally
        ? "Nyx ficou em Cinzaluz. Odelia a aceitou como aprendiz. A primeira canção que ela cantou com a própria voz tinha o seu nome."
        : "Nyx foi embora pela estrada do sul. Dizem que, toda primavera, alguém deixa um lírio da névoa na porta da Torre.";
    say([["Narrador", line]], () => seBase.apply(this, arguments));
  };
}

/* ---- Nyx na luta com o mesmo visual do mapa ----
 * Antes ela usava o desenho do Diretor da Academia (capelo, óculos e barba
 * branca) e parecia uma pessoa idosa na batalha. */
for (const k of ["nyx1", "nyx2", "nyx3"]) ENEMIES[k].shape = "nyx";
(() => {
  const base = drawEnemy;
  drawEnemy = function (type, x, y, u, t, extra = {}) {
    const e = ENEMIES[type];
    if (!e || e.shape !== "nyx") return base.apply(this, arguments);
    const cx = x + 8 * u,
      cy = y + 8 * u;
    const g = ctx.createRadialGradient(cx, cy, u, cx, cy, u * 10);
    g.addColorStop(0, type === "nyx3" ? "rgba(150,70,220,.45)" : "rgba(47,184,168,.35)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(cx - u * 10, cy - u * 10, u * 20, u * 20);
    ctx.save();
    if (extra.hit) ctx.filter = "brightness(2)";
    drawSprite(wizardRects(type === "nyx3" ? "#1b6f66" : NYX_LOOK.robe, NYX_LOOK.hat, NYX_LOOK.hair, null, "left", Math.floor(t * 3) % 2, 2), x, y, u, false);
    ctx.restore();
  };
})();
