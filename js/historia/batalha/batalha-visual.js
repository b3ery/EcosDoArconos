/**
 * ECOS DO ARCANO — batalha-visual.js
 * Batalha com mais emoção:
 *  - Cartão do jogador (retrato, vida, magia, fôlego e efeitos) dentro do painel.
 *  - Runas viram botões grandes com a cor do elemento.
 *  - Trama das runas com prévia da magia e aviso de "Super efetivo!" / "Pouco efetivo".
 *  - Faixa de turno: "Seu turno!" e "Vez do inimigo".
 *  - Vida do inimigo com rastro (você vê quanto tirou) e selo de nível.
 *  - O registro da batalha vira um balão no alto da tela.
 *  - Números de dano maiores, com contorno e "pulo"; acerto na fraqueza pisca a tela.
 * Modifica (envolve) funções de outros arquivos: applySpellDamage, battleLog, endBattle, enemyTurn, renderBattle, startBattle, startPlayerTurn.
 */

"use strict";

/* ---------- Montagem do painel ---------- */
(function buildBattleUI() {
  const panel = byId("bpanel");
  const card = document.createElement("div");
  card.id = "bplayer";
  card.innerHTML = `<canvas id="bpport" width="64" height="64"></canvas><div class="bp-i"><b id="bpname"></b><div class="bp-bar hp"><i id="bphp"></i><span id="bphpt"></span></div><div class="bp-bar mp"><i id="bpmp"></i><span id="bpmpt"></span></div><div id="bpchips"></div></div>`;
  panel.insertBefore(card, panel.firstChild);
  const ghost = document.createElement("i");
  ghost.id = "ehpg";
  byId("ehp").parentNode.insertBefore(ghost, byId("ehp"));
  const lv = document.createElement("span");
  lv.id = "elv";
  byId("ebox").insertBefore(lv, byId("ebox").firstChild);
  const banner = document.createElement("div");
  banner.id = "tbanner";
  byId("battle").appendChild(banner);
  // O registro sai do painel e vira um balão no alto.
  byId("battle").appendChild(byId("blog"));
})();

function turnBanner(text, enemy) {
  const b = byId("tbanner");
  b.textContent = text;
  b.className = enemy ? "enemy" : "";
  void b.offsetWidth;
  b.classList.add("show");
}
const RUNE_TINT = () => Object.fromEntries(Object.entries(RUNES).map(([k, r]) => [k, r.cor]));

function renderPlayerCard() {
  if (!battle) return;
  byId("bpname").textContent = `${player.name} · Nv ${player.lvl}`;
  byId("bphp").style.width = Math.max(0, (100 * player.hp) / maxHp()) + "%";
  byId("bphpt").textContent = `${Math.max(0, player.hp)}/${maxHp()}`;
  byId("bpmp").style.width = Math.max(0, (100 * player.mp) / maxMp()) + "%";
  byId("bpmpt").textContent = `${player.mp}/${maxMp()}`;
  const chips = [];
  if (battle.defending) chips.push(["armor", "Defendendo"]);
  if (battle.shield > 0) chips.push(["armor", `Muralha ${battle.shield}`]);
  if (battle.poison > 0) chips.push(["skull", `Veneno ${battle.poison}`]);
  if (battle.fury > 0) chips.push(["anger", "Fúria"]);
  if (typeof stamina === "function" && !lifeMode()) chips.push(["bolt", `Fôlego ${Math.round(stamina())}`]);
  byId("bpchips").innerHTML = chips.map(([ic, t]) => `<span>${iconHTML(ic, 12)}${t}</span>`).join("");
  const cv = byId("bpport");
  drawBust(cv, player.look);
  byId("bplayer").classList.toggle("low", player.hp / maxHp() < 0.3);
}
const _renderBattleV = renderBattle;
renderBattle = function () {
  _renderBattleV();
  renderPlayerCard();
  const e = battle.e;
  byId("ename").textContent = e.nome;
  byId("elv").textContent = e.lvl ? `Nv ${e.lvl}` : e.boss ? "Chefe" : "";
  byId("ehpg").style.width = Math.max(0, (100 * e.hp) / e.max) + "%";
  byId("ebox").classList.toggle("boss", !!(e.boss || e.eco));
  // Runas coloridas
  const tint = RUNE_TINT();
  byId("rbtns")
    .querySelectorAll(".rbtn")
    .forEach((b) => b.style.setProperty("--rc", tint[b.dataset.r] || "#7a62b8"));
  // Efetividade na prévia
  if (battle.sel.length) {
    const key = spellKey(battle.sel),
      sp = SPELLS[key];
    const known = player.best[battle.type] || { w: [], r: [] };
    if (sp && sp.el && sp.el.length) {
      const weak = sp.el.some((el) => known.w.includes(el) || (isFinalBoss(e) && e.weakNow === el));
      const res = sp.el.every((el) => known.r.includes(el));
      if (weak || res) byId("prev").insertAdjacentHTML("beforeend", `<em class="${weak ? "good" : "bad"}">${weak ? "Super efetivo!" : "Pouco efetivo"}</em>`);
    }
  }
  byId("bCast").classList.toggle("ready", !byId("bCast").disabled);
  document.body.classList.toggle("in-battle", game.mode === "battle");
};
const _battleLogV = battleLog;
battleLog = function (m) {
  _battleLogV(m);
  const b = byId("blog");
  b.classList.remove("pop");
  void b.offsetWidth;
  b.classList.add("pop");
};
const _enemyTurnV = enemyTurn;
enemyTurn = function () {
  if (battle && battle.e.hp > 0) turnBanner(`Vez de ${battle.e.nome}`, true);
  setTimeout(() => battle && _enemyTurnV(), 450);
};
const _startPlayerTurnV = startPlayerTurn;
startPlayerTurn = function () {
  _startPlayerTurnV();
  if (battle && player.hp > 0) turnBanner("Seu turno!");
};
const _startBattleV = startBattle;
startBattle = function (type, mob, opts) {
  const r = _startBattleV(type, mob, opts);
  if (battle) setTimeout(() => battle && turnBanner(battle.e.boss ? `${battle.e.nome} aparece!` : "Batalha!", !!battle.e.boss), 200);
  return r;
};
/* Acerto na fraqueza: a tela pisca e treme mais. */
const _applySpellDamageV = applySpellDamage;
applySpellDamage = function (spell, messages) {
  const before = game.floats.length;
  _applySpellDamageV(spell, messages);
  const crit = game.floats.slice(before).some((f) => f.col === COLORS.CRIT_HIT);
  if (crit) {
    game.flash = 0.35;
    game.shake = 0.45;
    const ec = enemyCenter();
    floatText(ec.x, ec.y + 70, "SUPER EFETIVO!", "#ffe066");
  }
};

const _endBattleV = endBattle;
endBattle = function () {
  document.body.classList.remove("in-battle");
  return _endBattleV.apply(this, arguments);
};
