/**
 * ECOS DO ARCANO — guardioes.js (modo História)
 * Cada Guardião luta de um jeito, além de "acertar a fraqueza":
 *  - Ent: raízes curam ele toda rodada, a não ser que você use a runa fraca dele.
 *  - Serpente: some na névoa; só a runa fraca dissipa (o resto acerta pela metade).
 *  - Grifo: levanta voo; só a runa fraca derruba (o resto quase não acerta).
 *  - Basilisco: repetir a mesma magia duas vezes seguidas te transforma em pedra.
 *  - Leviatã: a cada 4 turnos vem uma onda gigante. Defenda na hora certa!
 * Modifica (envolve) funções de outros arquivos: draw, elementMultiplier,
 * enemyTurn, playerCast, startBattle, startPlayerTurn, update.
 */

"use strict";

const GUARD_MECH = {
  ent: (w) => `Raízes: o Ent se cura toda rodada. Queime as raízes com ${w}!`,
  serpente: (w) => `Névoa: às vezes a Serpente some. Só ${w} dissipa a névoa; o resto acerta pela metade.`,
  grifo: (w) => `Voo: quando o Grifo voa, só ${w} derruba ele. O resto quase não acerta.`,
  basilisco: () => "Olhar de pedra: NÃO repita a mesma magia duas vezes seguidas, ou você vira pedra.",
  leviata: () => "Maré: a cada 4 turnos vem uma onda gigante. Quando a maré subir, DEFENDA!",
};
function gmWeak() {
  const w = battle && battle.e && (battle.e.weak || [])[0];
  return w && RUNES[w] ? w : null;
}
function gmWeakName() {
  const w = gmWeak();
  return w ? RUNES[w].nome : "a runa certa";
}
function gmOn() {
  return story() && battle && battle.gm && !battle.done;
}

{
  const sbBase = startBattle;
  startBattle = function (type, mob, opts = {}) {
    const r = sbBase(type, mob, opts);
    if (story() && battle && GUARD_MECH[type]) {
      battle.gm = { t: 0, mist: false, fly: false, burnt: 0, last: null, stone: false, tide: false };
      const B = battle;
      setTimeout(() => battle === B && battleLog("⚠ " + GUARD_MECH[type](gmWeakName())), 1900);
    }
    const zc = byId("zcard");
    if (zc) zc.classList.remove("show");
    return r;
  };

  const emBase = elementMultiplier;
  elementMultiplier = function (element, o) {
    let m = emBase(element, o);
    if (!gmOn()) return m;
    const G = battle.gm,
      weak = element === gmWeak();
    if (battle.type === "grifo" && G.fly) m *= weak ? 1.3 : 0.35;
    if (battle.type === "serpente" && G.mist && !weak) m *= 0.5;
    return m;
  };

  const pcBase = playerCast;
  playerCast = function () {
    const B = battle;
    const sel = B && B.sel ? B.sel.slice() : [];
    const key = sel.length ? spellKey(sel) : null;
    const wasBusy = B && B.busy;
    const r = pcBase.apply(this, arguments);
    if (!B || !B.gm || wasBusy || !B.busy || B.done) return r;
    const G = B.gm,
      hitWeak = sel.includes(gmWeak());
    if (B.type === "grifo" && G.fly && hitWeak) ((G.fly = false), setTimeout(() => battle === B && battleLog("O Grifo leva o golpe nas asas e despenca no chão!"), 500));
    if (B.type === "serpente" && G.mist && hitWeak) ((G.mist = false), setTimeout(() => battle === B && battleLog("A névoa se desfaz! A Serpente está à vista."), 500));
    if (B.type === "ent" && hitWeak) G.burnt = 2;
    if (B.type === "basilisco") {
      if (key && key === G.last) {
        G.stone = true;
        setTimeout(() => battle === B && battleLog("O Basilisco olha nos seus olhos... você repetiu a magia e começa a virar PEDRA!"), 500);
      }
      G.last = key;
    }
    return r;
  };

  const etBase = enemyTurn;
  enemyTurn = function () {
    const B = battle;
    if (B && B.gm && B.e && B.e.hp > 0 && !B.done) {
      const G = B.gm,
        E = B.e;
      G.t++;
      if (B.type === "ent") {
        if (G.burnt > 0) G.burnt--;
        else {
          const h = Math.round(E.max * 0.05);
          E.hp = Math.min(E.max, E.hp + h);
          battleLog(`As raízes do Ent bebem da terra: +${h} de vida.`);
        }
      }
      if (B.type === "serpente" && !G.mist && G.t % 3 === 0) ((G.mist = true), battleLog(`A Serpente afunda na névoa e some! (Use ${gmWeakName()})`));
      if (B.type === "grifo" && !G.fly && G.t % 3 === 1) ((G.fly = true), battleLog(`O Grifo levanta voo! Só ${gmWeakName()} alcança ele lá em cima.`));
      if (B.type === "leviata") {
        if (G.t % 4 === 3) ((G.tide = true), battleLog("🌊 A maré está subindo... DEFENDA no próximo turno!"));
        else if (G.tide) {
          G.tide = false;
          if (B.defending) {
            E.frozen = Math.max(E.frozen || 0, 1);
            battleLog("Você segura a onda gigante! O Leviatã fica atordoado.");
          } else {
            const dmg = Math.round(maxHp() * 0.2);
            player.hp = Math.max(0, player.hp - dmg);
            const pc = playerCenter();
            floatText(pc.x, pc.y - 40, "-" + dmg, "#7ad0ff");
            if (!settings.calm) game.shake = 0.5;
            battleLog(`A ONDA GIGANTE te acerta em cheio: ${dmg} de dano!`);
          }
        }
      }
    }
    return etBase.apply(this, arguments);
  };

  const sptBase = startPlayerTurn;
  startPlayerTurn = function () {
    const r = sptBase.apply(this, arguments);
    const B = battle;
    if (B && B.gm && B.gm.stone && !B.done) {
      B.gm.stone = false;
      B.busy = true;
      battleLog("Você está petrificad" + genderWord("o", "a", "e") + " e perde a vez!");
      setTimeout(() => battle === B && !B.done && enemyTurn(), 1200);
    }
    return r;
  };

  const drawBase = draw;
  draw = function () {
    drawBase();
    if (game.mode !== "battle" || !battle || !battle.gm) return;
    const G = battle.gm;
    ctx.save();
    ctx.translate((viewWidth - 640) / 2, 0);
    const ec = enemyCenter(),
      t = game.t;
    if (G.mist) {
      for (let i = 0; i < 7; i++) {
        ctx.fillStyle = `rgba(220,230,240,${0.18 + 0.06 * Math.sin(t * 2 + i)})`;
        ctx.beginPath();
        ctx.ellipse(ec.x + Math.sin(t + i * 1.7) * 40, ec.y + Math.cos(t * 0.8 + i) * 25, 70, 34, 0, 0, 7);
        ctx.fill();
      }
    }
    const tag = G.fly ? "VOANDO" : G.mist ? "NA NÉVOA" : G.tide ? "MARÉ SUBINDO" : G.stone ? "PEDRA!" : "";
    if (tag) {
      ctx.font = '700 14px "Pixelify Sans", sans-serif';
      ctx.textAlign = "center";
      ctx.fillStyle = G.tide ? "#7ad0ff" : "#ffe08a";
      ctx.fillText(tag, ec.x, ec.y - 90);
    }
    if (G.tide) {
      ctx.fillStyle = `rgba(60,140,220,${0.12 + 0.06 * Math.sin(t * 5)})`;
      ctx.fillRect(-200, 300, 1040, 180);
    }
    ctx.restore();
  };

  // O aviso "Você chegou em..." nunca fica por cima da luta.
  const updBase = update;
  update = function (dt) {
    updBase(dt);
    if (game.mode === "battle") {
      const zc = byId("zcard");
      if (zc && zc.classList.contains("show")) zc.classList.remove("show");
    }
  };
}
