/**
 * ECOS DO ARCANO — missoes-da-turma.js
 * Uma missão pessoal para cada amigo da turma; quem completar luta mais forte no final.
 * Modifica (envolve) funções de outros arquivos: enterZone, lifeSocialItems, openQuests.
 */

"use strict";

/* ===================== ARCOS DA TURMA ===================== */
const ARCS = {
  marcos: { t: "O treino da guarda", d: "Vença 3 batalhas para mostrar aos soldados como se luta.", ok: (A) => (player.winsTotal || 0) - A.base >= 3 },
  luca: { t: "O panfleto nos Picos", d: "Leve um panfleto iluminista até os Picos.", ok: (A) => (player.visitAfter || {}).picos > A.day0 },
  mylena: { t: "O lírio do Pântano", d: "Traga um lírio do Pântano para a pintura dela.", ok: (A) => (player.visitAfter || {}).pantano > A.day0 },
  lucas: { t: "A noite sem medo", d: "Vença uma batalha à noite (ele diz que você não consegue).", ok: () => !!player.nightWin },
  andressa: { t: "As páginas perdidas", d: "Tenha 3 páginas do diário de Vesper.", ok: () => (player.pages || []).length >= 3 },
  matheus: { t: "Cristais para a fazenda", d: "Visite a Mina de Cristal.", ok: (A) => (player.visitAfter || {}).mina > A.day0 },
};
function arcs() {
  return (player.arcs = player.arcs || {});
}
function arcsDone() {
  return Object.keys(ARCS).filter((id) => arcs()[id] && arcs()[id].done);
}
{
  const itemsBase = lifeSocialItems;
  lifeSocialItems = function (id) {
    const items = itemsBase(id);
    if (!story() || !ARCS[id]) return items;
    const A = arcs()[id],
      R = ARCS[id],
      n = shortName(id);
    if (!A)
      items.unshift({ t: `Missão pessoal: ${R.t}`, icon: "star", fn: () => ((arcs()[id] = { base: player.winsTotal || 0, day0: player.day * 1440 + player.clock }), saveGame(), say([[n, `Preciso de você. ${R.d}`], ["", "Missão pessoal aceita! Veja em Missões (Q)."]])) });
    else if (!A.done && R.ok(A))
      items.unshift({ t: `Concluir: ${R.t}`, icon: "party", fn: () => ((A.done = true), addFriendship(id, 20), gainXP(60), (player.gold += 50), saveGame(), say([[n, "Você conseguiu! Eu não esqueço isso. Na luta final, pode contar comigo de verdade."], ["", "+60 XP, +50 de ouro. Esse amigo vai lutar mais forte ao seu lado."]])) });
    return items;
  };
  const oqBase = openQuests;
  openQuests = function () {
    oqBase();
    if (!story() || game.mode !== "quests") return;
    const el = byId("quests");
    if (!el) return;
    const A = arcs();
    const html = `<h3>${iconHTML("heart")}Missões da turma (${arcsDone().length}/${Object.keys(ARCS).length})</h3>` + Object.entries(ARCS).map(([id, R]) => `<div class="qs ${A[id] && A[id].done ? "done" : A[id] ? "cur" : ""}">${shortName(id)}: ${R.t}<div class="qtip">${A[id] ? (A[id].done ? "Concluída." : R.d + (R.ok(A[id]) ? " <b>Pronto: fale com " + shortName(id) + "!</b>" : "")) : "Converse com " + shortName(id) + " para começar."}</div></div>`).join("") + `<h3>${iconHTML("star")}Segredos e combos</h3><div class="qs">Segredos escondidos: ${(player.secretsFound || []).length}/${SECRET_SPOTS.length}</div><div class="qs">Combos secretos: ${(player.combos || []).length}/${Object.keys(COMBOS).length}</div>`;
    el.insertAdjacentHTML("beforeend", html);
  };
}

/* ===================== LIGAÇÕES ===================== */
{
  // Algumas missões pedem para visitar um lugar depois de aceitá-las.
  const ezBase = enterZone;
  enterZone = function () {
    const r = ezBase.apply(this, arguments);
    if (story()) {
      player.visitAfter = player.visitAfter || {};
      player.visitAfter[player.zone] = player.day * 1440 + player.clock + 1;
    }
    return r;
  };
}
