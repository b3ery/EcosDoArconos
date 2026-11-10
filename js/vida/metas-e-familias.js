/**
 * ECOS DO ARCANO — metas-e-familias.js (Simulador de Vida)
 *  - Metas de vida: objetivos de longo prazo (chegar aos 70, 3 gerações,
 *    ficar rico...), cada um com recompensa.
 *  - Notícias com consequência: seca e boa colheita mudam os preços; a guerra
 *    convoca moradores, que somem da vila por uns dias.
 *  - Famílias de Cinzaluz: três famílias, duas delas rivais. Ficar amigo de
 *    um lado irrita o outro, e você pode tentar mediar a paz.
 * Tudo fica no menu Ações (Y).
 * Modifica (envolve) funções de outros arquivos: actionsMenu, addFriendship,
 * discount, npcHidden, onNewDay.
 */

"use strict";

/* ===================== METAS DE VIDA ===================== */
const LIFE_GOALS = [
  { id: "casar", n: "Casar", d: "Case com alguém da vila.", gold: 100, ok: () => !!player.spouse },
  { id: "filhos", n: "Casa cheia", d: "Tenha 3 filhos.", gold: 200, ok: () => (player.kids || []).length >= 3 },
  { id: "rico", n: "Fortuna", d: "Junte 5.000 de ouro.", gold: 0, rep: 5, ok: () => player.gold >= 5000 },
  { id: "amigos", n: "Rodeado de amigos", d: "Tenha 5 melhores amigos.", gold: 150, ok: () => Object.keys(FRIENDS).filter((id) => friendshipLevel(id) >= 3).length >= 5 },
  { id: "amado", n: "Querido pela vila", d: "Chegue a 80 de reputação.", gold: 150, ok: () => (player.rep ?? 50) >= 80 },
  { id: "velho", n: "Vida longa", d: "Chegue aos 70 anos.", gold: 300, ok: () => typeof playerAge === "function" && playerAge() >= 70 },
  { id: "dinastia", n: "Dinastia", d: "Chegue à 3ª geração da família.", gold: 500, ok: () => (player.generation || 1) >= 3 },
  { id: "trono", n: "Sangue real", d: "Governe um reino.", gold: 0, rep: 10, ok: () => typeof rulesK === "function" && ["aurelia", "mares", "pedravale"].some((k) => rulesK(k)) },
];
function goalsDone() {
  return (player.goals = player.goals || {});
}
function goalsTick() {
  for (const G of LIFE_GOALS) {
    if (goalsDone()[G.id]) continue;
    let ok = false;
    try {
      ok = G.ok();
    } catch (e) {}
    if (!ok) continue;
    goalsDone()[G.id] = player.day;
    if (G.gold) player.gold += G.gold;
    if (G.rep && typeof repAdd === "function") repAdd(G.rep);
    playSound(1047, 0.3, "triangle");
    toast(`🎯 META DE VIDA: ${G.n}!${G.gold ? ` +${G.gold} de ouro` : ""}`, 4500);
  }
}
function goalsPanel() {
  const D = goalsDone();
  const n = LIFE_GOALS.filter((g) => D[g.id]).length;
  choice(
    "Metas de vida",
    `${n} de ${LIFE_GOALS.length} metas cumpridas nesta família.<br><br>` +
      LIFE_GOALS.map((g) => `${D[g.id] ? "✅" : "⬜"} <b>${g.n}</b>: ${g.d}${g.gold ? ` <small>(+${g.gold} de ouro)</small>` : ""}`).join("<br>"),
    [{ t: "Fechar", fn: null }],
  );
}

/* ===================== NOTÍCIAS COM CONSEQUÊNCIA ===================== */
const VILA_FX = {
  seca: { n: "Seca", news: "A seca chegou a Cinzaluz: comida e bebida estão mais caras.", price: 1.3, days: 3 },
  colheita: { n: "Boa colheita", news: "Colheita farta! As bancas baixaram os preços.", price: 0.8, days: 3 },
  feira: { n: "Feira de mercadores", news: "Mercadores de fora chegaram: tudo com desconto por dois dias.", price: 0.85, days: 2 },
  guerra: { n: "Convocação", news: "", price: 1.1, days: 4, draft: 2 },
};
function villageEvent() {
  const E = player.vEvent;
  return E && E.until >= player.day ? E : null;
}
function startVillageEvent(k) {
  const V = VILA_FX[k];
  const E = { k, until: player.day + V.days - 1, drafted: [] };
  if (V.draft) {
    const pool = Object.values(ZONES.vila.npcs).filter((id) => FRIENDS[id] && NPCS[id] && !["odelia", "guarda", "guarda2", "tome", "curandeira"].includes(id) && id !== player.spouse && !(typeof isDead === "function" && isDead(id)));
    for (let i = 0; i < V.draft && pool.length; i++) E.drafted.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
    vilaNews(`O reino convocou ${E.drafted.map(shortName).join(" e ")} para a guerra. Voltam em ${V.days} dias, se tudo der certo.`);
  } else vilaNews(V.news);
  player.vEvent = E;
  toast(`📰 ${V.n}! Veja o jornal (J).`, 3600);
}
function villageEventsDay() {
  const E = player.vEvent;
  if (E && E.until < player.day) {
    if (E.drafted && E.drafted.length) vilaNews(`${E.drafted.map(shortName).join(" e ")} voltaram da guerra. A vila fez festa na praça.`);
    player.vEvent = null;
  }
  if (villageEvent() || Math.random() > 0.12) return;
  const keys = ["seca", "colheita", "feira"];
  const war = typeof kingdomAtWar === "function" && ["aurelia", "mares", "pedravale"].some((k) => kingdomAtWar(k));
  if (war || Math.random() < 0.2) keys.push("guerra", "guerra");
  startVillageEvent(keys[Math.floor(Math.random() * keys.length)]);
}

/* ===================== FAMÍLIAS DE CINZALUZ ===================== */
const FAMILIES = {
  brasa: { n: "Os Brasa", d: "comerciantes antigos, orgulhosos" },
  mare: { n: "Os Maré-Alta", d: "pescadores e artesãos, tranquilos" },
  pedregal: { n: "Os Pedregal", d: "ferreiros e guardas, teimosos" },
};
const FAM_KEYS = Object.keys(FAMILIES);
function familyOf(id) {
  if (!FRIENDS[id] || ["odelia", "guarda", "guarda2", "kael", "honda"].includes(id) || CREW.includes(id)) return null;
  if (!Object.values(ZONES.vila.npcs).includes(id)) return null;
  return FAM_KEYS[hashStr("fam" + id) % FAM_KEYS.length];
}
function familyMembers(k) {
  return [...new Set(Object.values(ZONES.vila.npcs))].filter((id) => familyOf(id) === k && NPCS[id]);
}
function feud() {
  const F = player.feud;
  return F && F.on ? F : null;
}
function familyStanding(k) {
  const m = familyMembers(k);
  return m.length ? Math.round(m.reduce((a, id) => a + friendship(id), 0) / m.length) : 0;
}
function feudDay() {
  const F = feud();
  if (F) {
    if (Math.random() < 0.3) {
      const a = familyMembers(F.a),
        b = familyMembers(F.b);
      if (a.length && b.length) vilaNews(`Briga na feira: ${shortName(a[Math.floor(Math.random() * a.length)])} (${FAMILIES[F.a].n}) e ${shortName(b[Math.floor(Math.random() * b.length)])} (${FAMILIES[F.b].n}) quase saíram no tapa.`);
    }
    return;
  }
  if (player.day < (player.feudNext || 3) || Math.random() > 0.15) return;
  const ks = FAM_KEYS.slice().sort(() => Math.random() - 0.5);
  player.feud = { on: true, a: ks[0], b: ks[1], since: player.day };
  vilaNews(`${FAMILIES[ks[0]].n} e ${FAMILIES[ks[1]].n} brigaram por causa de um terreno. Agora não se falam.`);
  toast(`🏠 ${FAMILIES[ks[0]].n} × ${FAMILIES[ks[1]].n}: rivalidade na vila!`, 3600);
}
function familiesPanel() {
  const F = feud();
  const txt = FAM_KEYS.map((k) => `<b>${FAMILIES[k].n}</b> <small>(${FAMILIES[k].d})</small><br>${familyMembers(k).map(shortName).join(", ") || "ninguém"}<br>Gostam de você: ${familyStanding(k)}/100`).join("<br><br>");
  const opts = [];
  if (F)
    opts.push({
      t: `Mediar a paz entre ${FAMILIES[F.a].n} e ${FAMILIES[F.b].n} (150 de ouro)`,
      icon: "heart",
      fn: () => {
        if (player.gold < 150) return say([["", "Você precisa de 150 de ouro para pagar o jantar de reconciliação."]]);
        const ok = Math.min(familyStanding(F.a), familyStanding(F.b)) >= 15 || Math.random() < 0.5;
        player.gold -= 150;
        if (!ok) return say([["", "Você paga o jantar, mas as duas famílias passam a noite se xingando. Tente de novo quando os dois lados gostarem mais de você."]]);
        player.feud = { on: false };
        player.feudNext = player.day + 6;
        player.peaceMade = (player.peaceMade || 0) + 1;
        if (typeof repAdd === "function") repAdd(6);
        vilaNews(`Graças a ${player.name}, ${FAMILIES[F.a].n} e ${FAMILIES[F.b].n} fizeram as pazes num jantar na praça.`);
        say([["", "Depois de muito vinho e duas tortas, os mais velhos das duas famílias apertam as mãos. A vila respira aliviada."], ["", "+6 de reputação."]]);
      },
    });
  opts.push({ t: "Fechar", fn: null });
  choice("Famílias de Cinzaluz", (F ? `⚔ <b>${FAMILIES[F.a].n} e ${FAMILIES[F.b].n} estão brigados.</b> Ficar amigo de um lado irrita o outro.<br><br>` : "Por enquanto, as famílias estão em paz.<br><br>") + txt, opts);
}

/* ===================== LIGAÇÕES ===================== */
{
  const ndBase = onNewDay;
  onNewDay = function () {
    const r = ndBase.apply(this, arguments);
    if (!lifeMode()) return r;
    try {
      villageEventsDay();
      feudDay();
      goalsTick();
    } catch (e) {
      console.warn("metas/famílias:", e);
    }
    return r;
  };
  const dBase = discount;
  discount = function (shop) {
    const E = lifeMode() && villageEvent();
    return dBase(shop) * (E ? VILA_FX[E.k].price : 1);
  };
  const nhBase = npcHidden;
  npcHidden = function (id) {
    const E = lifeMode() && villageEvent();
    if (E && E.drafted && E.drafted.includes(id)) return true;
    return nhBase(id);
  };
  const afBase = addFriendship;
  addFriendship = function (id, n) {
    const r = afBase.apply(this, arguments);
    const F = lifeMode() && n > 0 && feud();
    const fam = F && familyOf(id);
    if (F && (fam === F.a || fam === F.b)) {
      const rival = fam === F.a ? F.b : F.a;
      for (const o of familyMembers(rival)) player.rel[o] = Math.max(0, friendship(o) - 1);
      if (player.feudToast !== player.day) {
        player.feudToast = player.day;
        toast(`${FAMILIES[rival].n} não gostaram de te ver de amizade com ${FAMILIES[fam].n}.`, 3000);
      }
    }
    return r;
  };
  const amBase = actionsMenu;
  actionsMenu = function () {
    if (!lifeMode()) return amBase();
    hookChoice(amBase, (title, text, opts) => {
      const at = Math.max(0, opts.length - 1);
      const E = villageEvent();
      opts.splice(at, 0, { t: "Metas de vida", icon: "star", fn: goalsPanel }, { t: "Famílias da vila" + (feud() ? " ⚔" : ""), icon: "house", fn: familiesPanel });
      return [title, text + (E ? `<br>📰 Agora: <b>${VILA_FX[E.k].n}</b> (até o dia ${E.until}).` : ""), opts];
    });
  };
  let acc = 0;
  const updBase = update;
  update = function (dt) {
    updBase(dt);
    if (!lifeMode() || game.mode !== "world") return;
    acc += dt;
    if (acc < 5) return;
    acc = 0;
    goalsTick();
  };
}
ACHIEVEMENTS.push(
  ["metas3", "Uma vida completa", "Cumpra 3 metas de vida.", "star", () => Object.keys(player.goals || {}).length >= 3],
  ["paz", "Pacificador", "Faça duas famílias rivais fazerem as pazes.", "heart", () => (player.peaceMade || 0) >= 1],
);
