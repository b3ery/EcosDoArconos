/**
 * ECOS DO ARCANO — covis-dificeis.js (modo História)
 * Covis mais difíceis: mais puzzle, mais exploração e mais luta.
 *  - Desafios mais duros: 7 sementes no Ent, rajadas mais rápidas e em mais
 *    colunas no Grifo, maré mais curta no Leviatã, 3 blocos no Basilisco e
 *    lamparinas que apagam mais rápido no Farol.
 *  - Exploração: cada covil esconde 3 Ecos Perdidos, que só brilham quando
 *    você chega perto (no Ninho da Névoa, ficam nos becos sem saída).
 *  - Luta: cada Eco é protegido por um Silenciado, mais forte que os monstros
 *    de fora. Pisar no Eco começa a luta; vencer entrega o Eco.
 *  - A passagem para o Guardião só abre com o desafio vencido E os 3 Ecos.
 * Quem já libertou o Guardião de um covil não precisa dos Ecos nele.
 * Modifica (envolve) funções de outros arquivos: applyPostBattleRewards,
 * drawLair, enterLair, lairApply, lairSolved, startBattle, update.
 */

"use strict";

/* ---- desafios mais duros ---- */
TIDE.period = 4;
LAMPS.life = 6.5;
PUSH.blocks.push([10, 5]);
PUSH.plates.push([10, 8]);

/* ---- os Ecos Perdidos ---- */
const SHARD_FOES = {
  bosque: ["lobo", "cogumelo"],
  pantano: ["sapo", "espectro"],
  picos: ["harpia", "golem"],
  mina: ["golem", "sentinela"],
  porto: ["espectro", "sentinela"],
  farol: ["harpia", "espectro"],
};
const SHARD_SPOTS = {
  simon: [[2, 1], [17, 1], [17, 9]],
  gust: [[8, 1], [12, 9], [16, 4]],
  push: [[2, 1], [17, 1], [17, 9]],
  tide: [[8, 2], [8, 8], [14, 5]],
  lamps: [[2, 1], [17, 9], [9, 9]],
};
/** No labirinto da névoa, os Ecos ficam em becos sem saída (sempre os mesmos). */
function fogShardSpots(id) {
  const z = ZONES[id],
    out = [];
  const open = (x, y) => z.map[y] && z.map[y][x] !== "#";
  for (let x = 3; x <= 17; x++)
    for (let y = 1; y <= 9; y++) {
      if (!open(x, y)) continue;
      const n = [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([dx, dy]) => open(x + dx, y + dy)).length;
      if (n === 1) out.push([x, y]);
    }
  out.sort((a, b) => b[0] - a[0] || a[1] - b[1]);
  const pick = [];
  for (const p of out) if (pick.every((q) => Math.abs(q[0] - p[0]) + Math.abs(q[1] - p[1]) > 5)) pick.push(p);
  return pick.slice(0, 3);
}
const shardCache = {};
function shardSpots(L) {
  if (!shardCache[L.id]) shardCache[L.id] = L.mech === "fog" ? fogShardSpots(L.id) : SHARD_SPOTS[L.mech] || [];
  return shardCache[L.id];
}
function shardsGot(L) {
  const S = lairState(L);
  return (S.shards = S.shards || []);
}
function shardsDone(L) {
  if (typeof DEV !== "undefined" && DEV) return true;
  return player.guards.includes(L.region) || player.guards.includes(L.id) || shardsGot(L).length >= shardSpots(L).length;
}

(() => {
  // A passagem só abre com o desafio e os 3 Ecos.
  const laBase = lairApply;
  lairApply = function (L) {
    laBase.apply(this, arguments);
    const S = lairState(L);
    const open = (L.mech === "fog" || S.ok) && shardsDone(L);
    setTile(L.id, LAIR.door[0], LAIR.door[1], open ? "." : "#");
  };
  const lsBase = lairSolved;
  lairSolved = function (L, msg) {
    if (game.lairTrial || shardsDone(L)) return lsBase.apply(this, arguments);
    const S = lairState(L);
    if (S.ok) return;
    S.ok = true;
    lairApply(L);
    gainXP(80);
    saveGame();
    [523, 659].forEach((f, i) => setTimeout(() => playSound(f, 0.2, "triangle", 0.05), i * 120));
    say([["", msg], ["", `Desafio vencido! +80 XP. Mas a passagem ainda não se abriu: faltam Ecos Perdidos (${shardsGot(L).length}/3). Procure pelo covil.`]]);
  };
  const elBase = enterLair;
  enterLair = function (L) {
    const S = lairState(L),
      first = !S.seen;
    const r = elBase.apply(this, arguments);
    if (first && !shardsDone(L)) setTimeout(() => toast("Este covil esconde 3 Ecos Perdidos. Eles só brilham quando você chega perto, e cada um tem um guarda.", 5200), 5200);
    return r;
  };

  // Pisar num Eco começa a luta contra o Silenciado que o guarda.
  const upBase = update;
  update = function () {
    const r = upBase.apply(this, arguments);
    const L = story() && lairOfZone(player.zone);
    if (!L) return r;
    // luta perdida ou fuga: o Eco continua lá
    if (game.shardFight && game.shardFight.started && !battle && game.mode === "world") game.shardFight = null;
    if (game.mode !== "world" || game.dialog || game.shardFight || shardsDone(L)) return r;
    const got = shardsGot(L);
    const i = shardSpots(L).findIndex(([x, y], k) => !got.includes(k) && x === player.x && y === player.y);
    if (i < 0) return r;
    const foes = SHARD_FOES[L.region] || ["espectro"];
    const type = foes[(i + got.length) % foes.length];
    game.shardFight = { region: L.region, i };
    game.autoPath = null;
    say([["", "O Eco Perdido brilha... e uma sombra se levanta do chão para protegê-lo!"]], () => startBattle(type, null));
    return r;
  };
  const sbBase = startBattle;
  startBattle = function () {
    const r = sbBase.apply(this, arguments);
    if (game.shardFight && !game.shardFight.started && battle && battle.e && !battle.e.boss) {
      game.shardFight.started = true;
      battle.e.nome = `${battle.e.nome}, guarda do Eco`;
      battle.e.max = Math.round(battle.e.max * 1.5);
      battle.e.hp = battle.e.max;
      battle.e.atk *= 1.25;
      battle.e.xp = Math.round(battle.e.xp * 1.6);
      battle.shardFight = true;
    }
    return r;
  };
  const prBase = applyPostBattleRewards;
  applyPostBattleRewards = function () {
    const F = game.shardFight;
    const r = prBase.apply(this, arguments);
    if (F) {
      game.shardFight = null;
      const L = Object.values(LAIRS).find((x) => x.region === F.region);
      if (L) {
        const got = shardsGot(L);
        if (!got.includes(F.i)) got.push(F.i);
        lairApply(L);
        saveGame();
        playSound(880, 0.25, "sine", 0.05);
        const S = lairState(L);
        const left = shardSpots(L).length - got.length;
        setTimeout(
          () =>
            toast(
              left > 0
                ? `Eco Perdido recuperado! (${got.length}/3)`
                : S.ok || L.mech === "fog"
                  ? "Os 3 Ecos Perdidos! A passagem para o Guardião se abriu."
                  : "Os 3 Ecos Perdidos! Agora vença o desafio da sala para abrir a passagem.",
              3600,
            ),
          900,
        );
      }
    }
    return r;
  };

  // Desenho: os Ecos só aparecem de perto; contador no alto.
  const dlBase = drawLair;
  drawLair = function (t) {
    dlBase(t);
    const L = lairOfZone(player.zone);
    if (!L || shardsDone(L)) return;
    const got = shardsGot(L),
      T = TILE;
    shardSpots(L).forEach(([x, y], k) => {
      if (got.includes(k)) return;
      const dist = Math.hypot(player.x - x, player.y - y);
      if (dist > 3.5) return;
      const a = Math.min(1, (3.5 - dist) / 2);
      const X = x * T + 16,
        Y = y * T + 14 + Math.sin(t * 3 + k) * 2;
      ctx.fillStyle = `rgba(200,170,255,${0.25 * a})`;
      ctx.beginPath();
      ctx.arc(X, Y, 14, 0, 7);
      ctx.fill();
      ctx.fillStyle = `rgba(230,210,255,${a})`;
      ctx.beginPath();
      ctx.moveTo(X, Y - 8);
      ctx.lineTo(X + 5, Y);
      ctx.lineTo(X, Y + 8);
      ctx.lineTo(X - 5, Y);
      ctx.fill();
    });
    ctx.fillStyle = "#d8c8ff";
    ctx.font = '600 12px "Pixelify Sans", sans-serif';
    ctx.textAlign = "center";
    ctx.fillText(`✦ Ecos Perdidos: ${got.length}/3`, 9.5 * T, (LAIR.h - 0.35) * T);
  };
})();

/* ---- as dicas dos covis falam dos Ecos ---- */
for (const L of Object.values(LAIRS)) L.hint += " E procure os 3 Ecos Perdidos: eles só brilham de perto, e cada um tem um guarda.";
