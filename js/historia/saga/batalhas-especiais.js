/**
 * ECOS DO ARCANO — batalhas-especiais.js
 * Chefes com duas fases, amigo lutando ao lado, inimigos que se adaptam à sua
 * runa favorita (Difícil e Novo Jogo+) e combos secretos de magias em sequência.
 * Modifica (envolve) funções de outros arquivos: applySpellDamage, dmgMul, draw, enemyTurn, playerCast, startBattle, update, win.
 */

"use strict";

/* ===================== CHEFES COM FASES ===================== */
function bossPhaseTick() {
  const b = battle;
  if (!b || !b.e || !b.e.boss || b.phase2 || b.e.hp <= 0 || b.e.hp > b.e.max * 0.5) return;
  b.phase2 = true;
  const old = (b.e.weak || []).slice();
  const pool = ORDER.filter((r) => !old.includes(r) && (player.runes || []).includes(r));
  b.e.weak = pool.length ? [pk(pool)] : old;
  b.e.resist = old;
  b.e.hp = Math.min(b.e.max, b.e.hp + Math.round(b.e.max * 0.12));
  b.e.atk *= 1.15;
  b.e.cor = shade(b.e.cor || "#5a3a7a", -0.35);
  game.shake = 0.6;
  playSound(80, 0.8, "sawtooth");
  battleLog(`${b.e.nome} RUGE E MUDA DE FORMA! A fraqueza agora é ${b.e.weak.map((r) => RUNES[r].nome).join(", ")}; o que funcionava antes, agora ele resiste!`);
  if (typeof renderBattle === "function") renderBattle();
}
function pickAlly(type) {
  if (lifeMode() || type === "boneco") return null;
  const e = ENEMIES[type] || {};
  if (!e.boss) return null;
  const done = arcsDone().filter((id) => CREW.includes(id) || id === "luca");
  if (type === "silenciador" && player.flags.kaelChoice === "ajudou") return "kael";
  const pool = (done.length ? done : CREW.filter((id) => friendshipLevel(id) >= 2)).filter((id) => NPCS[id] && !isDead(id));
  return pool.length ? pool.sort((a, b) => friendship(b) - friendship(a))[0] : null;
}
{
  const sbBase = startBattle;
  startBattle = function (type, mob, opts = {}) {
    // 12. Inimigos se adaptam à runa preferida (difícil e Novo Jogo+).
    const r = sbBase(type, mob, opts);
    if (!battle) return r;
    const B = battle;
    if (player.ngp) {
      const k = 1 + 0.35 * player.ngp;
      B.e.hp = Math.round(B.e.hp * k);
      B.e.max = Math.round(B.e.max * k);
      B.e.atk *= 1 + 0.2 * player.ngp;
    }
    if ((player.diff === "dificil" || player.ngp) && type !== "boneco") {
      const use = player.runeUse || {};
      const tot = Object.values(use).reduce((a, b) => a + b, 0);
      const fav = Object.keys(use).sort((a, b) => use[b] - use[a])[0];
      if (fav && tot >= 12 && use[fav] / tot >= 0.35 && !(B.e.weak || []).includes(fav)) {
        B.e.resist = [...new Set([...(B.e.resist || []), fav])];
        setTimeout(() => battle === B && battleLog(`${B.e.nome} já ouviu falar de você: aprendeu a resistir a ${RUNES[fav].nome}!`), 700);
      }
    }
    // 7. Batalha em dupla.
    const ally = pickAlly(type);
    if (ally) {
      B.ally = { id: ally, healed: false, bonus: arcs()[ally] && arcs()[ally].done ? 1.4 : 1 };
      setTimeout(() => battle === B && battleLog(`${shortName(ally)} chega correndo e luta ao seu lado!`), 900);
    }
    // 1 e 2. As escolhas da história pesam na luta final.
    if (type === "silenciador") {
      const kind = vesperKindness() + (player.flags.hondaChoice === "confiou" ? 1 : 0);
      if (kind) {
        B.e.hp = Math.round(B.e.hp * (1 - kind * 0.05));
        setTimeout(() => battle === B && battleLog(`As lembranças boas de Vesper (${kind}) enfraquecem o Silêncio. Ele hesita...`), 1600);
      }
      const n = arcsDone().length;
      if (n) setTimeout(() => battle === B && battleLog(`${n} amigo(s) com a missão pessoal cumprida lutam com força total! (+${n * 4}% de dano)`), 2200);
    }
    return r;
  };
  const etBase = enemyTurn;
  enemyTurn = function () {
    const B = battle;
    if (B && B.ally && B.e.hp > 0) {
      const A = B.ally,
        n = shortName(A.id);
      if (!A.healed && player.hp < maxHp() * 0.3) {
        A.healed = true;
        const h = Math.round(maxHp() * 0.3);
        healPlayer(h, "#8affb0");
        battleLog(`${n} te puxa para trás e cuida dos seus ferimentos: +${h} HP!`);
      } else {
        const dmg = Math.max(3, Math.round((6 + player.lvl * 1.6) * A.bonus * (0.8 + Math.random() * 0.4)));
        damageEnemy(dmg, "#8ad0ff", -40, 10);
        battleLog(`${n} ${pk(["acerta um golpe certeiro", "joga uma pedra na cabeça dele", "distrai o inimigo e acerta", "grita e ataca"])}: ${dmg} de dano!`);
        if (B.e.hp <= 0) return setTimeout(win, DELAY.WIN);
      }
    }
    return etBase();
  };
  const dmBase = dmgMul;
  dmgMul = function (els) {
    let m = dmBase(els);
    if (battle && battle.type === "silenciador") m *= 1 + arcsDone().length * 0.04;
    return m;
  };
}

/* ===================== COMBOS SECRETOS ===================== */
const COMBOS = {
  "agua>fogo": { n: "Vapor Escaldante", mult: 1.6 },
  "fogo>ar": { n: "Tornado de Fogo", mult: 1.7 },
  "agua>terra": { n: "Lama Pegajosa", mult: 1.3, stun: 1 },
  "luz>sombra": { n: "Eclipse", mult: 2 },
  "ar>agua": { n: "Chuva de Agulhas", mult: 1.5 },
  "fogo>terra": { n: "Magma", mult: 1.8 },
  "sombra>luz": { n: "Aurora", mult: 1.2, heal: 0.25 },
  "terra>ar": { n: "Tempestade de Areia", mult: 1.4, stun: 1 },
};
{
  const asBase = applySpellDamage;
  applySpellDamage = function (spell, messages) {
    const before = battle.e.hp;
    const r = asBase(spell, messages);
    const prev = battle.prevEl,
      cur = spell.el[spell.el.length - 1];
    battle.prevEl = cur;
    const C = COMBOS[`${prev}>${cur}`];
    if (prev && C && battle.e.hp > 0) {
      const extra = Math.max(4, Math.round((before - battle.e.hp) * (C.mult - 1)));
      damageEnemy(extra, "#ffe066", 20, -24);
      if (C.stun) battle.e.stun = Math.max(battle.e.stun || 0, 1);
      if (C.heal) healPlayer(Math.round(maxHp() * C.heal), "#ffe8a0");
      player.combos = player.combos || [];
      const novo = !player.combos.includes(C.n);
      if (novo) player.combos.push(C.n);
      messages.push(`COMBO${novo ? " SECRETO DESCOBERTO" : ""}: ${C.n}! +${extra} de dano.`);
      game.shake = 0.3;
      playSound(988, 0.15, "triangle");
      battle.prevEl = null;
    }
    return r;
  };
  const pcBase = playerCast;
  playerCast = function () {
    if (battle && battle.sel && battle.sel.length) {
      player.runeUse = player.runeUse || {};
      for (const r of battle.sel) player.runeUse[r] = (player.runeUse[r] || 0) + 1;
    }
    return pcBase();
  };
  const winBase = win;
  win = function () {
    if (battle && !battle.done) {
      player.winsTotal = (player.winsTotal || 0) + 1;
      if (battle.night) player.nightWin = true;
      if (battle.type === "kaelSil") player.flags.kaelSalvo = true;
    }
    return winBase.apply(this, arguments);
  };
}

/* ===================== LIGAÇÕES ===================== */
{
  const drawBase = draw;
  draw = function () {
    drawBase();
    if (game.mode === "battle" && battle) {
      ctx.save();
      ctx.translate((viewWidth - 640) / 2, 0);
      if (battle.phase2) {
        ctx.fillStyle = `rgba(120,0,40,${0.12 + 0.05 * Math.sin(game.t * 4)})`;
        ctx.fillRect(-200, 0, 1040, 480);
      }
      if (battle.ally && NPCS[battle.ally.id]) {
        const n = NPCS[battle.ally.id],
          pc = playerCenter();
        const u = BATTLE_PLAYER_POS.u * 0.8;
        ctx.fillStyle = "rgba(0,0,0,.25)";
        ctx.beginPath();
        ctx.ellipse(pc.x - 80, pc.y + 7 * u, 6 * u, 1.6 * u, 0, 0, 7);
        ctx.fill();
        drawSprite(wizardRects(n.robe, n.hat, n.hair, null, "right", Math.floor(game.t * 3) % 2), pc.x - 80 - 8 * u, pc.y - 9 * u, u, false);
        ctx.font = '600 12px "Pixelify Sans", sans-serif';
        ctx.fillStyle = "#cfe8ff";
        ctx.textAlign = "center";
        ctx.fillText(shortName(battle.ally.id), pc.x - 80, pc.y - 10 * u);
      }
      ctx.restore();
    }
  };
  const updBase = update;
  update = function (dt) {
    updBase(dt);
    if (story() && game.mode === "battle") bossPhaseTick();
  };
}
