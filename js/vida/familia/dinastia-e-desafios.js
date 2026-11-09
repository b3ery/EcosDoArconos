/**
 * ECOS DO ARCANO — dinastia-e-desafios.js (Simulador)
 * Conquistas de dinastia, Diário da Vida ao morrer (copiar e compartilhar),
 * desafios de começo e os atalhos novos no menu de Ações.
 * Modifica (envolve) funções de outros arquivos: actionsMenu, caughtStealing, continueAsHeir, deathAftermath, update.
 */

"use strict";

/* ===================== CONQUISTAS DE DINASTIA ===================== */
ACHIEVEMENTS.push(
  ["dinastia3", "Família de verdade", "Chegue à 3ª geração.", "house", () => lifeMode() && (player.generation || 1) >= 3],
  ["dinastia5", "Dinastia", "Chegue à 5ª geração.", "crown", () => lifeMode() && (player.generation || 1) >= 5],
  ["sangueReal", "Sangue real", "Tenha 3 governantes na família.", "crown", () => lifeMode() && (player.lineage || []).filter((g) => g.ruled).length + (rulesK("aurelia") ? 1 : 0) >= 3],
  ["centenario", "Centenário", "Chegue aos 100 anos.", "clock", () => lifeMode() && playerAge() >= 100],
  ["golpeSolo", "Lobo solitário", "Dê um golpe de estado sozinh@.", "sword", () => !!player.soloCoup],
  ["eleito", "Voz do povo", "Vença uma eleição do Conselho.", "flag", () => !!player.councilChief],
  ["mortes10", "Já morri de tudo", "Descubra 10 jeitos de morrer.", "skull", () => typeof deathBook === "function" && deathBook().length >= 10],
  ["rivalVencido", "Rival vencido", "Vença seu rival 3 vezes.", "party", () => !!(player.prival && player.prival.done)],
);

/* ===================== DIÁRIO DA VIDA ===================== */
function lifeSummary(causeTitle) {
  const start = player.genStart || 0;
  const log = (player.log || []).filter((l) => l[0] >= start).slice(-14);
  const lines = [
    `📜 A vida de ${player.name} (${START_AGE}–${playerAge()} anos, ${player.generation || 1}ª geração)`,
    causeTitle ? `⚰️ ${causeTitle}` : "",
    player.spouse && NPCS[player.spouse] ? `💍 Casou com ${shortName(player.spouse)}` : player.consort ? `💍 Casou com ${player.consort}` : "💔 Nunca casou",
    (player.kids || []).length ? `👶 ${player.kids.length} filho(s): ${player.kids.map((k) => k.name).join(", ")}` : "",
    rulesK("aurelia") ? `👑 Morreu governando: ${royalTitle()}` : "",
    (player.murders || 0) ? `🗡️ ${player.murders} morte(s) nas costas` : "",
    `💰 ${player.gold} de ouro · reputação ${player.rep ?? 50}`,
    ...log.map((l) => `• Dia ${l[0]}: ${String(l[2]).replace(/<[^>]+>/g, "")}`),
  ].filter(Boolean);
  return lines;
}
function showLifeSummary(causeTitle, next) {
  let el = byId("diariovida");
  if (!el) {
    el = document.createElement("div");
    el.id = "diariovida";
    el.className = "ui ov";
    byId("screen").appendChild(el);
  }
  const L = lifeSummary(causeTitle);
  el.innerHTML = `<h2>Diário da Vida</h2><div class="dv-l">${L.map((l) => `<p>${l}</p>`).join("")}</div><div class="dv-b"><button data-c>Copiar para compartilhar</button><button data-n class="go">Continuar ▶</button></div>`;
  el.querySelector("[data-c]").onclick = () => {
    try {
      navigator.clipboard.writeText(L.join("\n") + "\n\n— Ecos do Arcano");
      toast("Copiado! Cole onde quiser.", 2200);
    } catch (e) {}
  };
  el.querySelector("[data-n]").onclick = () => {
    el.style.display = "none";
    game.mode = "world";
    next();
  };
  el.style.display = "block";
  game.mode = "diariovida";
}
{
  const daBase = deathAftermath;
  deathAftermath = function (id, opt) {
    if (!lifeMode()) return daBase(id, opt);
    showLifeSummary(dz(DEATHS[id].t), () => daBase(id, opt));
  };
  const heirBase = continueAsHeir;
  continueAsHeir = function (k, tax) {
    const r = heirBase(k, tax);
    player.genStart = player.day;
    player.court = {};
    player.consort = null;
    player.prival = null;
    return r;
  };
}
KEY_HANDLERS.diariovida = () => {};

/* ===================== DESAFIOS DE COMEÇO ===================== */
const CHALLENGES = {
  orfao: { n: "Órfão sem ouro", d: "Comece com 0 de ouro e chegue a 1000.", start: () => (player.gold = 0), ok: () => player.gold >= 1000 },
  rainha25: { n: "Coroa antes dos 25", d: "Governe Aurélia antes dos 25 anos.", ok: () => rulesK("aurelia") && playerAge() < 25, fail: () => playerAge() >= 25 },
  limpo: { n: "Mãos limpas", d: "Roube 10 vezes sem nunca ser pego.", ok: () => (player.thefts || 0) - (player.challenge.t0 || 0) >= 10, fail: () => !!player.caughtOnce },
  amado: { n: "Amado por todos", d: "Chegue a reputação 95.", ok: () => (player.rep ?? 50) >= 95 },
};
function challengeMenu() {
  const C = player.challenge;
  const done = (() => {
    try {
      return JSON.parse(localStorage.getItem("ecosDesafios") || "[]");
    } catch (e) {
      return [];
    }
  })();
  if (C) return choice("Desafio ativo", `<b>${CHALLENGES[C.id].n}</b>: ${CHALLENGES[C.id].d}`, [{ t: "Desistir do desafio", fn: () => ((player.challenge = null), toast("Desafio abandonado.", 2000)) }, { t: "Fechar", fn: null }]);
  if (player.day > 2) return say([["", "Desafios só podem começar nos 2 primeiros dias de uma vida nova."]]);
  choice("Desafios", "Escolha um desafio para esta vida:", Object.entries(CHALLENGES).map(([k, c]) => ({ t: `${done.includes(k) ? "✅ " : ""}${c.n}: ${c.d}`, fn: () => ((player.challenge = { id: k, t0: player.thefts || 0 }), c.start && c.start(), saveGame(), toast(`Desafio aceito: ${c.n}!`, 2600)) })).concat([{ t: "Fechar", fn: null }]));
}
function challengeTick() {
  const C = player.challenge;
  if (!C) return;
  const D = CHALLENGES[C.id];
  if (D.ok()) {
    player.challenge = null;
    try {
      const done = JSON.parse(localStorage.getItem("ecosDesafios") || "[]");
      if (!done.includes(C.id)) done.push(C.id);
      localStorage.setItem("ecosDesafios", JSON.stringify(done));
    } catch (e) {}
    repAdd(5);
    playSound(1047, 0.3, "triangle");
    toast(`🏆 DESAFIO CUMPRIDO: ${D.n}!`, 5000);
  } else if (D.fail && D.fail()) {
    player.challenge = null;
    toast(`Desafio perdido: ${D.n}. Fica para a próxima vida!`, 4200);
  }
}
{
  const csBase = caughtStealing;
  caughtStealing = function () {
    player.caughtOnce = true;
    return csBase.apply(this, arguments);
  };
}

/* ===================== AÇÕES: novos atalhos ===================== */
{
  const amBase = actionsMenu;
  actionsMenu = function () {
    hookChoice(amBase, (title, text, opts) => {
      if (!lifeMode()) return [title, text, opts];
      const at = opts.findIndex((o) => /Árvore/.test(o.t));
      opts.splice(at + 1, 0, { t: player.challenge ? `Desafio: ${CHALLENGES[player.challenge.id].n}` : "Desafios", icon: "flag", fn: challengeMenu });
      if (myRival()) opts.splice(at + 2, 0, { t: `Meu rival: ${shortName(myRival().id)} (${myRival().wins}x${myRival().losses})`, icon: "sword", fn: () => say([["", `${shortName(myRival().id)} é ${gw(myRival().id, "seu rival", "sua rival")}. Fale com ${gw(myRival().id, "ele", "ela")} para desafiar.`]]) });
      return [title, text, opts];
    });
  };
}


/* ===================== LIGAÇÕES ===================== */
{
  let acc = 0;
  const updBase = update;
  update = function (dt) {
    updBase(dt);
    if (!lifeMode() || game.mode === "title" || game.mode === "cutscene") return;
    acc += dt;
    if (acc < 1) return;
    acc = 0;
    challengeTick();
  };
}
