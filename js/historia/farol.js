/**
 * ECOS DO ARCANO — farol.js (modo História)
 * O Guardião da Runa da Chama: a Fênix do Farol, no alto do Farol de Brisamar.
 *  - Covil: o Topo do Farol. Desafio "As Lamparinas": acenda as quatro
 *    lamparinas antes que o vento do mar apague a primeira.
 *  - Luta: a Fênix incendeia as asas a cada 3 turnos (queimadura) e, na
 *    primeira vez que cai, RENASCE das cinzas. Acertar a fraqueza dela
 *    (a Terra, que abafa o fogo) apaga as asas por 2 turnos.
 *  - Depois da luta vem a lembrança do Farol (Odelia e Vesper crianças).
 * Só existe no jogo novo, em que o aprendiz começa com um dom; saves antigos
 * continuam com o Farol de antes.
 * Modifica (envolve) funções de outros arquivos: applyStoryAdjustments,
 * drawLair, enemyRects, enemyTurn, GUARD_POST, lairInteract, lairTarget,
 * leaveLair, playerCast, storyBuilding, update, win.
 */

"use strict";

const FENIX = "fenixf";
ENEMIES[FENIX] = {
  nome: "Fênix do Farol",
  hp: 175,
  atk: 13,
  xp: 110,
  weak: [],
  resist: [],
  cor: "#ff7a3d",
  shape: "phoenix",
  boss: true,
};
ENEMY_LEVELS[FENIX] = { base: 4, min: 5, boss: true };
GUARDIAN_TYPES.push(FENIX);
GUARD_DROP[FENIX] = "fenix";
GUARD_PRE[FENIX] = () => [
  ["Fênix do Farol", "Esta luz guiava os barcos... até o Silêncio. Agora eu queimo sozinha. Ninguém apaga o meu fogo!"],
  ["", "A Fênix abre as asas e o topo do farol vira uma fogueira!"],
];
GUARD_MECH[FENIX] = (w) => `Asas em chamas: a cada 3 turnos a Fênix te queima, a não ser que ${w} apague as asas dela. E cuidado: ela renasce das cinzas uma vez!`;
GUARD_ECHO[FENIX] = ["Vesper subia aqui toda noite para acender a luz.", "\"Enquanto o farol brilhar, ninguém se perde\", ele dizia."];
VILLAIN_ECHO[FENIX] = ["As penas de fogo viram cinza fria.", "Em Brisamar, o farol nunca mais acende."];
CREW_REACT[FENIX] = ["O farol acendeu de novo! Dá para ver daqui da vila.", "Uma ave de fogo? Você tá cheirando a fumaça.", "Isso merece uma torta. Quente, claro."];

/* ---- sprite: ave de fogo de asas abertas ---- */
(() => {
  const base = enemyRects;
  enemyRects = function (shape, c, t, accent) {
    if (shape !== "phoenix") return base.apply(this, arguments);
    const d = shade(c, -0.35),
      l = shade(c, 0.3),
      f = Math.floor(t * 4) % 2;
    return [
      [0, 3 + f, 4, 2, l],
      [1, 5 + f, 4, 2, c],
      [12, 3 + f, 4, 2, l],
      [11, 5 + f, 4, 2, c],
      [3, 6, 3, 3, d],
      [10, 6, 3, 3, d],
      [6, 4, 4, 7, c],
      [7, 1, 3, 3, c],
      [7, 0, 1, 1, "#ffd34d"],
      [9, 0, 1, 1, "#ffd34d"],
      [10, 2, 2, 1, "#ffd34d"],
      [8, 2, 1, 1, "#fff"],
      [7, 6, 2, 3, "#ffd34d"],
      [6, 11, 1, 3 + f, "#ffd34d"],
      [8, 11, 1, 4 - f, l],
      [10, 11, 1, 3 + f, "#ffd34d"],
      [5, 13, 6, 1, d],
      [6, 14, 1, 2, "#ff3b1f"],
      [9, 14, 1, 2, "#ff3b1f"],
    ];
  };
})();

/* ---- a Fênix guarda a Chama e é fraca contra a Terra ---- */
(() => {
  const base = applyStoryAdjustments;
  applyStoryAdjustments = function (enemy, type) {
    base.apply(this, arguments);
    if (type === FENIX) {
      enemy.weak = [player.runes.includes("terra") ? "terra" : player.aff];
      enemy.resist = ["fogo"];
      enemy.rune = player.runes.includes("fogo") ? null : "fogo";
    }
  };
  const basePost = GUARD_POST;
  GUARD_POST = function (type, rune) {
    if (type !== FENIX) return basePost.apply(this, arguments);
    const l = [
      ["", "As chamas da Fênix diminuem até virarem uma luz calma e dourada."],
      ["Fênix do Farol", "Eu tinha esquecido para que servia o meu fogo... Era para guiar, não para queimar."],
    ];
    if (rune) l.push(["Fênix do Farol", `Leve a Runa ${RUNE_OF[rune]}, aprendiz. Vesper a escondeu aqui, no farol que ele amava. E leve uma pena minha: ela renasce, como eu.`]);
    l.push(["", `Você recebeu: ${ITEMS[GUARD_DROP[FENIX]].nome}.`]);
    return l;
  };
})();

/* ---- mecânica da luta ---- */
(() => {
  const pcBase = playerCast;
  playerCast = function () {
    const B = battle;
    const sel = B && B.sel ? B.sel.slice() : [];
    const wasBusy = B && B.busy;
    const r = pcBase.apply(this, arguments);
    if (B && B.type === FENIX && B.gm && !wasBusy && B.busy && sel.includes(gmWeak())) {
      if (!B.gm.doused) setTimeout(() => battle === B && battleLog("A Terra cobre as asas da Fênix e abafa o fogo!"), 500);
      B.gm.doused = 2;
    }
    return r;
  };
  const etBase = enemyTurn;
  enemyTurn = function () {
    const B = battle;
    if (B && B.type === FENIX && B.gm && B.e && B.e.hp > 0 && !B.done) {
      const G = B.gm;
      G.ft = (G.ft || 0) + 1;
      if (G.doused > 0) G.doused--;
      else if (G.ft % 3 === 0) {
        battle.poison = Math.max(battle.poison || 0, 3);
        const pc = playerCenter();
        burst(pc.x, pc.y, ["#ff7a3d", "#ffd34d"], 24, 120);
        battleLog(`🔥 ASAS EM CHAMAS! A Fênix te envolve no fogo: você queima por 3 turnos. (${gmWeakName()} apaga as asas dela)`);
      }
    }
    return etBase.apply(this, arguments);
  };
  const winBase = win;
  win = function () {
    const B = battle;
    if (B && B.type === FENIX && !B.done && B.gm && !B.gm.reborn) {
      B.gm.reborn = true;
      B.e.hp = Math.round(B.e.max * 0.4);
      B.busy = false;
      const ec = enemyCenter();
      burst(ec.x, ec.y, ["#ff7a3d", "#ffd34d", "#fff"], 60, 220);
      if (!settings.calm) game.shake = 0.4;
      [392, 523, 659, 784].forEach((f, i) => setTimeout(() => playSound(f, 0.2, "triangle", 0.05), i * 90));
      battleLog("A Fênix vira cinzas... e RENASCE das próprias brasas! (40% da vida)");
      renderBattle();
      setTimeout(() => battle === B && !B.done && enemyTurn(), 1200);
      return;
    }
    return winBase.apply(this, arguments);
  };
})();

/* ===================== O COVIL: TOPO DO FAROL ===================== */
LAIRS.farol = {
  id: "covil-farol",
  n: "Topo do Farol",
  theme: "torre",
  guard: FENIX,
  mech: "lamps",
  sub: "O vento do mar apaga tudo.",
  hint: "Quatro lamparinas cercam a escada. Acenda todas: só quando as quatro brilharem juntas a porta do topo se abre. O vento do mar apaga cada uma depois de um tempo, então não demore!",
  region: "farol",
};
LAIR_BY_ID["covil-farol"] = LAIRS.farol;
ZONES["covil-farol"] = genLair(LAIRS.farol);
const LAMPS = { pos: [[4, 2], [15, 2], [4, 8], [15, 8]], life: 9 };
const lampLeft = (i) => {
  const lit = (game.lamps || {})[i];
  if (lit == null) return 0;
  const life = LAMPS.life * (settings.calm ? 1.6 : 1);
  return Math.max(0, life - (game.t - lit)) / life;
};
const farolActive = () => story() && !!player.dom && player.flags.porto1 && !player.flags.porto2;

(() => {
  const ltBase = lairTarget;
  lairTarget = function (x, y) {
    const L = lairOfZone(player.zone);
    if (L && L.mech === "lamps" && !near(LAIR.exit, x, y)) {
      const i = LAMPS.pos.findIndex((p) => near(p, x, y));
      if (i >= 0) return lairState(L).ok ? "Lamparina acesa" : lampLeft(i) > 0 ? "Lamparina acesa" : "Acender a lamparina";
    }
    return ltBase(x, y);
  };
  const liBase = lairInteract;
  lairInteract = function (x, y) {
    const L = lairOfZone(player.zone);
    const l = lairTarget(x, y);
    if (L && L.mech === "lamps" && (l === "Acender a lamparina" || l === "Lamparina acesa")) {
      if (lairState(L).ok) return true;
      const i = LAMPS.pos.findIndex((p) => near(p, x, y));
      game.lamps = game.lamps || {};
      game.lamps[i] = game.t;
      playSound(330 + i * 110, 0.25, "triangle", 0.05);
      if (LAMPS.pos.every((_, k) => lampLeft(k) > 0)) lairSolved(L, "As quatro lamparinas brilham juntas. O vento recua, e a porta do topo do farol se abre.");
      else toast(`Lamparinas acesas: ${LAMPS.pos.filter((_, k) => lampLeft(k) > 0).length}/4`, 1400);
      return true;
    }
    return liBase(x, y);
  };
  const dlBase = drawLair;
  drawLair = function (t) {
    dlBase(t);
    const L = lairOfZone(player.zone);
    if (!L || L.mech !== "lamps") return;
    const ok = lairState(L).ok,
      T = TILE;
    // escada em espiral no meio da sala
    ctx.fillStyle = "#3a3448";
    ctx.beginPath();
    ctx.arc(9.5 * T, 5.5 * T, T * 1.3, 0, 7);
    ctx.fill();
    ctx.strokeStyle = "#5a5470";
    ctx.lineWidth = 3;
    for (let k = 0; k < 6; k++) {
      const a = (k / 6) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(9.5 * T, 5.5 * T);
      ctx.lineTo(9.5 * T + Math.cos(a) * T * 1.3, 5.5 * T + Math.sin(a) * T * 1.3);
      ctx.stroke();
    }
    LAMPS.pos.forEach(([x, y], i) => {
      const k = ok ? 1 : lampLeft(i),
        X = x * T + 16,
        Y = y * T;
      ctx.fillStyle = "#4a3a2a";
      ctx.fillRect(X - 7, Y + 20, 14, 8);
      ctx.fillStyle = "#6a5a40";
      ctx.fillRect(X - 3, Y + 10, 6, 10);
      if (k > 0) {
        const r = 4 + 7 * k + Math.sin(t * 12 + i) * 1.5;
        ctx.fillStyle = `rgba(255,170,60,${0.25 * k})`;
        ctx.beginPath();
        ctx.arc(X, Y + 4, r * 2.4, 0, 7);
        ctx.fill();
        ctx.fillStyle = "#ff7a3d";
        ctx.beginPath();
        ctx.ellipse(X, Y + 5, r * 0.6, r, 0, 0, 7);
        ctx.fill();
        ctx.fillStyle = "#ffd34d";
        ctx.beginPath();
        ctx.ellipse(X, Y + 7, r * 0.3, r * 0.55, 0, 0, 7);
        ctx.fill();
      } else {
        ctx.strokeStyle = `rgba(255,200,120,${0.35 + 0.3 * Math.sin(t * 3 + i)})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(X, Y + 6, 9, 0, 7);
        ctx.stroke();
      }
    });
    if (!ok) {
      // o vento do mar
      for (let k = 0; k < 8; k++) {
        ctx.fillStyle = "rgba(220,235,255,.35)";
        ctx.fillRect(((t * 140 + k * 97) % (LAIR.door[0] * T)), (1 + ((k * 37) % 9)) * T + 10, 14, 2);
      }
      ctx.fillStyle = "#ffe08a";
      ctx.font = '600 12px "Pixelify Sans", sans-serif';
      ctx.textAlign = "center";
      ctx.fillText(`${LAMPS.pos.filter((_, k) => lampLeft(k) > 0).length}/4 lamparinas`, 9.5 * T, 0.8 * T);
    }
  };
  // Sair do covil do farol volta para a porta do farol, no Porto.
  const llBase = leaveLair;
  leaveLair = function (L) {
    if (!L || L.region !== "farol") return llBase.apply(this, arguments);
    player.zone = "porto";
    [player.x, player.y] = zoneDoorPos("porto", "Farol de Brisamar");
    player.rx = player.x;
    player.ry = player.y;
    game.fade = 1;
    enterZone(true);
  };
  // Entrar no farol à noite leva ao covil da Fênix.
  const sbBase = storyBuilding;
  storyBuilding = function (b) {
    if (b && b.name === "Farol de Brisamar" && farolActive() && !player.guards.includes("farol")) {
      if (!isNight()) {
        say([["", "O farol está apagado. O Capitão disse que ele só mostra o que guarda depois que escurece. Volte à noite (tecla H espera)."]]);
        return true;
      }
      game.lamps = {};
      enterLair(LAIRS.farol);
      return true;
    }
    return sbBase.apply(this, arguments);
  };
  // Depois da Fênix: a lembrança do Farol.
  const upBase = update;
  update = function (dt) {
    const r = upBase.apply(this, arguments);
    if (farolActive() && player.guards.includes("farol") && game.mode === "world" && !game.dialog) farolMemory();
    return r;
  };
})();

/* ---- etapa da história: o Farol agora tem Guardião ---- */
{
  const s = STEPS.find((x) => x.id === "porto2");
  if (s) {
    const t0 = Object.getOwnPropertyDescriptor(s, "t"),
      d0 = Object.getOwnPropertyDescriptor(s, "d"),
      p0 = s.pos;
    const val = (desc) => (desc.get ? desc.get.call(s) : desc.value);
    Object.defineProperty(s, "t", { get: () => (player.dom ? "Liberte a Fênix do Farol (à noite)" : val(t0)), configurable: true, enumerable: true });
    Object.defineProperty(s, "d", {
      get: () =>
        player.dom
          ? "A Runa da Chama está no alto do Farol de Brisamar, com a Fênix do Farol. O farol só abre à noite (a partir das 19h; tecla H espera). Lá em cima, acenda as quatro lamparinas antes que o vento as apague. A Fênix é fraca contra a Terra e renasce uma vez!"
          : val(d0),
      configurable: true,
      enumerable: true,
    });
    Object.defineProperty(s, "zone", { get: () => (player.zone === "covil-farol" ? "covil-farol" : "porto"), configurable: true, enumerable: true });
    s.pos = () => (player.zone === "covil-farol" ? LAIR.guard : p0());
    s.lvl = 4;
  }
}
