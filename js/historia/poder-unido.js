/**
 * ECOS DO ARCANO — poder-unido.js (modo História)
 * Na luta final, quando o Silenciador chega à metade da vida, aparece o botão
 * "✦ Unir todos os poderes": os cinco Guardiões, todas as runas e todo mundo
 * que você ajudou pelo caminho atacam juntos, numa cena só.
 * Quanto mais gente você ajudou, mais forte fica o golpe.
 * Modifica (envolve) funções de outros arquivos: renderBattle.
 */

"use strict";

const GUARD_NAMES = { bosque: ["Ent", "#7ad36b"], pantano: ["Serpente", "#9ad0c0"], picos: ["Grifo", "#c8b08a"], mina: ["Basilisco", "#b48aff"], porto: ["Leviatã", "#5aa0e8"] };

/** Quem chega para ajudar: Guardiões libertados, aliados e quem você ajudou. */
function unionHelpers() {
  const h = [];
  for (const z of player.guards || []) if (GUARD_NAMES[z]) h.push({ n: GUARD_NAMES[z][0], c: GUARD_NAMES[z][1], p: 0.03, l: `O ${GUARD_NAMES[z][0]} empresta a força dele.` });
  const N = player.nyx || {};
  if (N.ally && !N.dead) h.push({ n: "Nyx", c: "#6ff0dc", p: 0.05, l: "Nyx canta com a própria voz, pela primeira vez." });
  if (player.flags.kaelChoice === "ajudou" || player.flags.kaelSalvo) h.push({ n: "Kael", c: "#ff9a6a", p: 0.04, l: "Kael grita o seu nome e ataca junto." });
  if (!player.flags.odeliaMorta) h.push({ n: "Odelia", c: "#d8b4ff", p: 0.04, l: "De Cinzaluz, Odelia empresta a última magia que tem." });
  const arcs = typeof arcsDone === "function" ? arcsDone().length : 0;
  if (arcs) h.push({ n: `A turma (${arcs})`, c: "#ffd34d", p: 0.02 * arcs, l: "A turma inteira aparece na escada, gritando." });
  if (player.flags.dreamPromise) h.push({ n: "A promessa", c: "#c9a8ff", p: 0.03, l: "Vesper lembra da promessa que você fez no sonho." });
  const saved = Object.values(player.enc || {}).filter((r) => /defendeu|levou|deu|curou|soltou|ajudou/.test(r)).length;
  if (saved) h.push({ n: `Gente da estrada (${saved})`, c: "#f0d090", p: 0.01 * saved, l: "Todo mundo que você ajudou na estrada está torcendo por você." });
  return h;
}
function unionReady() {
  const B = battle;
  return !!(B && B.type === "silenciador" && !B.done && !B.unionUsed && B.e && B.e.hp > 0 && (B.phase2 || B.e.hp <= B.e.max * 0.5));
}
function unionScene(helpers) {
  return (W, H, t) => {
    ctx.fillStyle = "#05030a";
    ctx.fillRect(0, 0, W, H);
    const cx = W / 2,
      cy = H / 2;
    ctx.globalAlpha = Math.min(1, t / 2) * 0.3;
    (player.runes || []).forEach((r, i) => RUNES[r] && rays(cx, cy, 6, W, RUNES[r].cor, t + i));
    ctx.globalAlpha = 1;
    // runas girando em volta do centro
    (player.runes || []).forEach((r, i, a) => {
      if (!RUNES[r]) return;
      const ang = t * 1.6 + (i / a.length) * Math.PI * 2,
        rad = 150 - Math.min(110, t * 22);
      ctx.fillStyle = RUNES[r].cor;
      ctx.beginPath();
      ctx.arc(cx + Math.cos(ang) * rad, cy + Math.sin(ang) * rad * 0.6, 12, 0, 7);
      ctx.fill();
    });
    ctx.textAlign = "center";
    helpers.forEach((h, i) => {
      const at = 0.6 + i * 0.45;
      if (t < at) return;
      const a = Math.min(1, (t - at) * 2);
      const col = i % 2 ? W * 0.78 : W * 0.22,
        y = 90 + Math.floor(i / 2) * 44;
      ctx.globalAlpha = a;
      txt(h.n, col, y, 20, h.c);
      ctx.globalAlpha = 1;
    });
    const fin = 0.8 + helpers.length * 0.45;
    if (t > fin) {
      const k = Math.min(1, (t - fin) * 1.5);
      ctx.fillStyle = `rgba(255,255,255,${0.5 * k * Math.max(0, 1 - (t - fin) / 1.2)})`;
      ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = k;
      txt("TODOS OS PODERES, JUNTOS!", cx, H - 70, 30, "#ffe08a");
      ctx.globalAlpha = 1;
    }
  };
}
function uniteAll() {
  if (!unionReady() || battle.busy) return;
  const B = battle;
  B.busy = true;
  B.unionUsed = true;
  battle.sel = [];
  const helpers = unionHelpers();
  const pct = Math.min(0.4, 0.15 + helpers.reduce((a, h) => a + h.p, 0));
  const dur = Math.min(7.5, 2.4 + helpers.length * 0.45);
  [523, 659, 784, 1047, 1319].forEach((f, i) => setTimeout(() => playSound(f, 0.4, "triangle", 0.05), i * 160));
  playCine(unionScene(helpers), dur, () => {
    if (battle !== B) return;
    const dmg = Math.max(1, Math.round(B.e.max * pct));
    B.e.hp -= dmg;
    B.eshake = 0.8;
    if (!settings.calm) game.shake = 0.6;
    const ec = enemyCenter();
    (player.runes || []).forEach((r, i) => RUNES[r] && setTimeout(() => burst(ec.x, ec.y, [RUNES[r].cor, "#fff"], 40, 240), i * 80));
    floatText(ec.x, ec.y - 50, String(dmg), "#ffe066");
    player.hp = Math.min(maxHp(), player.hp + Math.round(maxHp() * 0.4));
    player.mp = maxMp();
    helpers.slice(0, 4).forEach((h, i) => setTimeout(() => battle === B && battleLog(h.l), 300 + i * 500));
    setTimeout(() => battle === B && battleLog(`✦ TODOS OS PODERES JUNTOS: ${dmg} de dano! Vida +40% e mana cheia.`), 300 + Math.min(4, helpers.length) * 500);
    renderBattle();
    finishPlayerAction(800 + Math.min(4, helpers.length) * 500);
  });
}
{
  const resw = byId("resw");
  if (resw && !byId("bUnion")) {
    const b = document.createElement("button");
    b.id = "bUnion";
    b.textContent = "✦ Unir todos os poderes";
    b.style.display = "none";
    b.onclick = uniteAll;
    resw.appendChild(b);
    const st = document.createElement("style");
    st.textContent = `#bUnion{background:linear-gradient(90deg,#ff7a3d,#5aa0e8,#7ad36b,#c8b08a,#b48aff);color:#fff;font-weight:700;border:2px solid #ffe08a;animation:unionPulse 1s infinite alternate;margin-left:6px}
    @keyframes unionPulse{from{box-shadow:0 0 4px #ffe08a}to{box-shadow:0 0 16px #ffe08a}}`;
    document.head.appendChild(st);
  }
  const rbBase = renderBattle;
  renderBattle = function () {
    const r = rbBase.apply(this, arguments);
    const b = byId("bUnion");
    if (b) {
      const show = story() && unionReady();
      b.style.display = show ? "inline-block" : "none";
      b.disabled = !!(battle && battle.busy);
      if (show && !battle.unionTold) {
        battle.unionTold = true;
        battleLog("A máscara treme. Você sente todo mundo que ajudou chamando por você... ✦ Unir todos os poderes!");
      }
    }
    return r;
  };
  BATTLE_SHORTCUTS.u = () => unionReady() && uniteAll();
}
