/**
 * ECOS DO ARCANO — 59-legado.js
 *  - Fofoca que se espalha: seus segredos (furtos, arrombamentos, flerte com
 *    gente casada) passam de boca em boca pelas amizades. Dá para abafar
 *    (pagar para guardar segredo) ou desmentir. Se metade da vila souber, vira notícia.
 *  - Memória de gerações: a vila lembra dos seus pais e avós.
 *  - Árvore da família, com cada geração, causa da morte e herdeiros.
 *  - Testamento: escolha o herdeiro e doe ao Templo. Sem testamento, os irmãos brigam.
 *  - Filhos herdam o jeito dos pais (traços de personalidade).
 *  - Menu de Ações (tecla Y ou botão Ações): tudo num lugar só.
 *  - Objetivos do dia no Simulador, com recompensa.
 *  - Modo História: finais diferentes (herói, vilão, monarca, exilado, assassino,
 *    amado pelo povo) e a turma não ajuda na batalha final quem matou gente.
 */

"use strict";

/* ===================== FOFOCA QUE SE ESPALHA ===================== */

const SECRET_KINDS = {
  furto: (w) => `roubou ${w || "alguém"}`,
  arrombou: (w) => `arrombou ${w || "uma casa"}`,
  malandro: () => "anda metid" + genderWord("o", "a", "e") + " em malandragem",
  flerteCasado: (w) => `deu em cima de ${w}, que é casad${/a$/.test(w) ? "a" : "o"}`,
};
function secrets() {
  return (player.secrets = player.secrets || []);
}
function addSecret(kind, what, firstWho) {
  if (!lifeMode() || !SECRET_KINDS[kind]) return;
  const key = kind + ":" + (what || "");
  let s = secrets().find((x) => x.key === key && !x.out);
  if (!s) {
    s = { key, kind, what: what || "", day: player.day, knows: [], out: false };
    secrets().push(s);
    if (secrets().length > 12) secrets().shift();
  }
  if (firstWho && !s.knows.includes(firstWho)) s.knows.push(firstWho);
}
function secretText(s) {
  return SECRET_KINDS[s.kind](s.what);
}
{
  const remBase = remember;
  remember = function (id, k, what) {
    remBase(id, k, what);
    if (k === "furto" || k === "arrombou" || k === "malandro") addSecret(k, what, id);
    if (k === "flerte" && id && npcSpouse(id)) addSecret("flerteCasado", shortName(id), npcSpouse(id));
  };
}
/** Todo dia, quem sabe conta para os amigos. */
function spreadSecrets() {
  const all = Object.keys(NPCS).filter((id) => named(id) && !isChildNpc(id));
  for (const s of secrets()) {
    if (s.out || s.hush) continue;
    for (const k of s.knows.slice()) {
      const talk = hasTrait(k, "fofoqueiro") ? 3 : hasTrait(k, "timido") || hasTrait(k, "leal") ? 0 : 1;
      for (let i = 0; i < talk + 1; i++) {
        const o = pk(all);
        if (!o || s.knows.includes(o) || o === k) continue;
        if (relOf(k, o) > 10 || Math.random() < 0.3) s.knows.push(o);
      }
    }
    for (const k of s.knows) if (Math.random() < 0.3) addFriendship(k, -1);
    if (s.knows.length >= all.length * 0.5) {
      s.out = true;
      repAdd(-5);
      vilaNews(`A vila inteira já sabe: ${player.name} ${secretText(s)}!`);
      setTimeout(() => toast(`Seu segredo virou notícia: ${secretText(s)}. Reputação -5.`, 4600), 3000);
    }
  }
}
function gossipPanel() {
  const list = secrets().filter((s) => !s.out);
  if (!list.length) return say([["", "Ninguém está falando de você pelas costas. Por enquanto."]]);
  const all = Object.keys(NPCS).filter((id) => named(id) && !isChildNpc(id)).length;
  choice(
    "Fofocas sobre você",
    list.map((s) => `• Que você ${secretText(s)}: <b>${Math.round((s.knows.length / all) * 100)}%</b> da vila sabe${s.hush ? " (abafado)" : ""}`).join("<br>") + "<br><small>Fale com quem sabe para abafar ou desmentir.</small>",
    [{ t: "Fechar", fn: null }],
  );
}
/* Falando com alguém que sabe de um segredo seu. */
{
  const itemsBase = lifeSocialItems;
  lifeSocialItems = function (id) {
    const items = itemsBase(id);
    const s = secrets().find((x) => !x.out && x.knows.includes(id));
    if (!s) return items;
    items.push({
      t: "Pedir para guardar segredo (30 ouro)",
      icon: "lock",
      fn: () => {
        if (player.gold < 30) return say([["", "Você não tem 30 de ouro."]]);
        player.gold -= 30;
        s.knows = s.knows.filter((k) => k !== id);
        if (Math.random() < 0.5) s.hush = player.day;
        say([[shortName(id), pk(["Segredo? Que segredo? Nunca ouvi falar.", "*guarda o ouro* Meus lábios estão selados.", "Tá bom... mas não faz de novo, hein."])]]);
      },
    });
    items.push({
      t: "Desmentir a fofoca",
      icon: "chat",
      fn: () => {
        const ok = Math.random() < 0.45 + (friendship(id) - 50) / 150;
        if (ok) {
          s.knows = s.knows.filter((k) => k !== id);
          say([[shortName(id), "Ah, então era mentira? Eu sabia que você não era disso!"]]);
        } else {
          addFriendship(id, -5);
          say([[shortName(id), "Ah, para. Eu SEI que foi você. Não mente pra mim."]]);
        }
      },
    });
    return items;
  };
}

/* ===================== GERAÇÕES ===================== */

function lineage() {
  return (player.lineage = player.lineage || []);
}
/** Guarda quem morreu na árvore da família. */
function recordDeath(cause) {
  if (!lifeMode()) return;
  const L = lineage();
  if (L.some((g) => g.gen === (player.generation || 1))) return;
  L.push({
    gen: player.generation || 1,
    name: player.name,
    age: playerAge(),
    cause: cause || "Morreu",
    spouse: player.spouse && NPCS[player.spouse] ? shortName(player.spouse) : player.spouse || "",
    kids: (player.kids || []).map((k) => k.name),
    ruled: rulesK("aurelia"),
    gold: player.gold,
  });
}
{
  const pdBase = playerDies;
  playerDies = function (id, opt) {
    const ok = !game.deathScene && !game.dying;
    const r = pdBase(id, opt);
    if (r && ok && DEATHS[id]) recordDeath(dz(DEATHS[id].t));
    return r;
  };
}
TOPICS.antepassado = () => {
  const g = pk(lineage());
  if (!g) return pk(["Minha avó dizia que Cinzaluz já foi só um vilarejo.", "Família é tudo."]);
  return pk([
    `Eu conheci ${g.name}, sabia? ${g.ruled ? "Governou essa vila!" : "Gente boa."} Morreu com ${g.age} anos.`,
    `Você tem o jeito de ${g.name}. ${g.cause}... que história.`,
    `${g.name} me devia três moedas. Será que a família paga?`,
    `No meu tempo, ${g.name} era ${pk(["o mais falado da vila", "o mais bonito da taverna", "quem dançava melhor no festival"])}.`,
    `Fui no velório de ${g.name}. A vila inteira chorou.`,
  ]);
};
TOPIC_W.antepassado = 0;

/* ===================== FILHOS HERDAM O JEITO ===================== */

function parentTraits() {
  const mine = player.traits || [];
  const other = player.spouse && NPCS[player.spouse] ? npcTraits(player.spouse) : [];
  return [...mine, ...other];
}
function giveKidTraits() {
  for (const k of player.kids || []) {
    if (k.traits) continue;
    const pool = parentTraits();
    const out = [];
    while (pool.length && out.length < 2) {
      const t = pool.splice(Math.floor(Math.random() * pool.length), 1)[0];
      if (!out.includes(t)) out.push(t);
    }
    const all = Object.keys(TRAITS);
    while (out.length < 3) {
      const t = pk(all);
      if (!out.includes(t)) out.push(t);
    }
    k.traits = out;
    k.orient = k.orient || pk(["hetero", "hetero", "bi", "homo", "pan"]);
  }
}
{
  const heirBase = continueAsHeir;
  continueAsHeir = function (k, tax) {
    giveKidTraits();
    const traits = k.traits,
      orient = k.orient;
    const others = (player.kids || []).filter((q) => q !== k && kidAge(q) >= 16);
    const will = player.will;
    const r = heirBase(k, tax);
    if (traits) player.traits = traits.slice();
    if (orient) player.orient = orient;
    // Sem testamento, os irmãos brigam pela herança.
    if (others.length && !(will && will.heir === k.name)) {
      const lost = Math.round(player.gold * 0.15);
      player.gold -= lost;
      vilaNews(`Briga de herança! Os filhos de ${(lineage().slice(-1)[0] || {}).name || "uma família"} foram parar no tribunal.`);
      setTimeout(() => toast(`Sem testamento, seus irmãos brigaram na justiça. Advogados levaram ${lost} de ouro.`, 4800), 2600);
    }
    if (will && will.temple) repAdd(6);
    player.will = null;
    player.secrets = [];
    TOPIC_W.antepassado = 3;
    setTimeout(() => toast(`Você herdou o jeito da família: ${(player.traits || []).map((t) => traitName(t, player.gender)).join(", ")}.`, 4200), 4200);
    return r;
  };
  // O herdeiro escolhido no testamento vem primeiro (e é o único, se for adulto).
  const hBase = heirs;
  heirs = function () {
    const list = hBase();
    const w = player.will;
    if (w && w.heir) {
      const k = list.find((q) => q.name === w.heir);
      if (k) return [k];
    }
    return list;
  };
}

/* ===================== ÁRVORE DA FAMÍLIA ===================== */

function openFamilyTree() {
  if (game.mode !== "world" || game.dialog) return;
  giveKidTraits();
  let el = byId("arvore");
  if (!el) {
    el = document.createElement("div");
    el.id = "arvore";
    el.className = "ui ov";
    byId("screen").appendChild(el);
  }
  const L = lineage();
  const card = (g, now) => `<div class="av-c ${now ? "now" : ""}"><small>${g.gen}ª geração</small><b>${g.name}</b><span>${now ? `${playerAge()} anos · viv${genderWord("o", "a", "e")}` : `${g.age} anos · ${g.cause}`}</span>${g.spouse ? `<span>💍 ${g.spouse}</span>` : ""}${g.ruled ? "<span>👑 Governou Aurélia</span>" : ""}</div>`;
  const me = { gen: player.generation || 1, name: player.name, spouse: player.spouse && NPCS[player.spouse] ? shortName(player.spouse) : player.spouse || "", ruled: rulesK("aurelia") };
  const kids = (player.kids || []).map((k) => `<div class="av-k"><b>${k.name}</b><span>${kidAge(k)} ${kidAge(k) === 1 ? "ano" : "anos"}${k.spouse ? " · 💍 " + k.spouse : ""}${k.grandkids ? ` · ${k.grandkids} neto(s)` : ""}</span><small>${(k.traits || []).map((t) => traitName(t, k.g || "m")).join(", ")}</small></div>`).join("");
  el.innerHTML = `<button class="jn-x" data-x>✕</button><h2>Árvore da Família</h2><div class="av-line">${L.map((g) => card(g)).join('<div class="av-arrow">↓</div>')}${L.length ? '<div class="av-arrow">↓</div>' : ""}${card(me, true)}</div>${kids ? `<h3>Filhos</h3><div class="av-kids">${kids}</div>` : "<p class='av-none'>Ainda sem filhos. Sem herdeiro adulto, a família acaba com você.</p>"}${player.will ? `<p class="av-will">📜 Testamento: herdeiro <b>${player.will.heir || "—"}</b>${player.will.temple ? " · doação ao Templo" : ""}</p>` : ""}`;
  el.querySelector("[data-x]").addEventListener("click", closeFamilyTree);
  el.style.display = "block";
  game.mode = "arvore";
}
function closeFamilyTree() {
  const el = byId("arvore");
  if (el) el.style.display = "none";
  game.mode = "world";
}
KEY_HANDLERS.arvore = (k) => (k === "escape" || k === "y") && closeFamilyTree();

/* ===================== TESTAMENTO ===================== */

function willMenu() {
  if (!lifeMode()) return;
  const kids = player.kids || [];
  if (!kids.length) return say([["Padre Anselmo", "Testamento sem filhos? Pode deixar tudo para o Templo... mas a família acaba com você. Que tal pensar em filhos primeiro?"]]);
  const W = (player.will = player.will || { heir: null, temple: false });
  choice("Testamento", `Herdeiro: <b>${W.heir || "não escolhido"}</b> · Doação ao Templo: <b>${W.temple ? "sim (10% do ouro)" : "não"}</b><br><small>Sem testamento, os filhos brigam na justiça e os advogados levam 15% do ouro.</small>`, [
    ...kids.map((k) => ({ t: `Deixar tudo para ${k.name} (${kidAge(k)} anos)${kidAge(k) < 16 ? " · ainda criança" : ""}`, icon: "scroll", fn: () => ((W.heir = k.name), saveGame(), toast(`Testamento: ${k.name} é ${k.g === "f" ? "a herdeira" : "o herdeiro"}.`, 2600), willMenu()) })),
    { t: W.temple ? "Cancelar doação ao Templo" : "Doar 10% ao Templo (o herdeiro começa mais respeitado)", icon: "flower", fn: () => ((W.temple = !W.temple), saveGame(), willMenu()) },
    { t: "Fechar", fn: null },
  ]);
}
{
  const exeBase = deathAftermath;
  deathAftermath = function (id, opt) {
    if (player.will && player.will.temple) player.gold = Math.round(player.gold * 0.9);
    return exeBase(id, opt);
  };
}

/* ===================== OBJETIVOS DO DIA ===================== */

const OBJECTIVES = [
  { id: "conversar", t: "Conversar com 3 pessoas", ok: (c) => (c.talk || 0) >= 3 },
  { id: "comer", t: "Comer alguma coisa", ok: (c) => (c.eat || 0) >= 1 },
  { id: "ouro", t: "Ganhar 30 de ouro", ok: (c) => player.gold - (c.gold0 || 0) >= 30 },
  { id: "presente", t: "Dar um presente", ok: (c) => (c.gift || 0) >= 1 },
  { id: "flerte", t: "Flertar com alguém", ok: (c) => (c.flirt || 0) >= 1 },
  { id: "amigo", t: "Fazer 5 interações", ok: (c) => (c.inter || 0) >= 5 },
  { id: "passeio", t: "Visitar outra vila ou a floresta", ok: (c) => !!c.away },
  { id: "jornal", t: "Ler o jornal", ok: (c) => !!c.paper },
];
function objectives() {
  const O = player.obj;
  if (O && O.day === player.day) return O;
  const pool = OBJECTIVES.slice().sort(() => Math.random() - 0.5).slice(0, 3);
  player.obj = { day: player.day, list: pool.map((o) => ({ id: o.id, done: false })), c: { gold0: player.gold } };
  return player.obj;
}
function objCount(k, v = 1) {
  if (!lifeMode()) return;
  const O = objectives();
  O.c[k] = (O.c[k] || 0) + v;
}
function objTick() {
  if (!lifeMode() || game.mode !== "world") return;
  const O = objectives();
  if (["porto", "serra", "floresta", "mina", "bosque"].includes(player.zone)) O.c.away = 1;
  for (const o of O.list) {
    if (o.done) continue;
    const def = OBJECTIVES.find((d) => d.id === o.id);
    if (def && def.ok(O.c)) {
      o.done = true;
      player.gold += 15;
      if (typeof addNeed === "function") addNeed("fun", 8);
      playSound(784, 0.12, "sine");
      toast(`Objetivo do dia cumprido: ${def.t}! +15 de ouro.`, 3200);
      if (O.list.every((x) => x.done)) setTimeout(() => (repAdd(2), toast("Todos os objetivos de hoje! Reputação +2.", 3200)), 1800);
    }
  }
}
function objPanel() {
  const O = objectives();
  choice("Objetivos de hoje", O.list.map((o) => `${o.done ? "✅" : "⬜"} ${OBJECTIVES.find((d) => d.id === o.id).t}`).join("<br>") + "<br><small>Cada um vale 15 de ouro. Os três juntos: reputação +2.</small>", [{ t: "Fechar", fn: null }]);
}
{
  const diBase = doInteraction;
  doInteraction = function (id, key) {
    const r = INTER_BY_KEY[key];
    objCount("inter");
    if (r && (r[1] === "amor" || r[1] === "cor")) objCount("flirt");
    return diBase(id, key);
  };
  const cwBase = chatWith;
  chatWith = function (id) {
    objCount("talk");
    return cwBase(id);
  };
  const uBase = useItemEffect;
  useItemEffect = function (id) {
    if (ITEMS[id] && ITEMS[id].food) objCount("eat");
    return uBase(id);
  };
  const opBase = openPaper;
  openPaper = function () {
    objCount("paper");
    return opBase();
  };
  const remBase = remember;
  remember = function (id, k, what) {
    if (k === "presente") objCount("gift");
    return remBase(id, k, what);
  };
}

/* ===================== MENU DE AÇÕES ===================== */

function actionsMenu() {
  if (game.mode !== "world" || game.dialog) return;
  const life = lifeMode();
  const opts = [
    { t: "Jornal do dia (J)", icon: "scroll", fn: openPaper },
    { t: rulesK("aurelia") ? "Governar o reino (V)" : "Golpe de estado (V)", icon: "crown", fn: coupButton },
    { t: "Crime (X)", icon: "skull", fn: crimeMenu },
    { t: "Livro das Mortes (B)", icon: "skull", fn: openDeathBook },
  ];
  if (life) {
    opts.push({ t: "Objetivos de hoje", icon: "party", fn: objPanel });
    opts.push({ t: "Árvore da família", icon: "house", fn: openFamilyTree });
    opts.push({ t: "Testamento", icon: "scroll", fn: willMenu });
    opts.push({ t: "Fofocas sobre você", icon: "chat", fn: gossipPanel });
    if (player.council) opts.push({ t: "Eleição do Conselho", icon: "flag", fn: campaignMenu });
    opts.push({ t: "Reinos (K)", icon: "flag", fn: kingdomsMenu });
    opts.push({ t: "Calendário (L)", icon: "book", fn: () => openCalendar() });
  }
  opts.push({ t: "Fechar", fn: null });
  choice("Ações", life ? `Iluministas: ${ilumPow()}% de força${player.council ? " · Cinzaluz é governada pelo Conselho do Povo" : ""}.` : "Atalhos do jogo.", opts);
}
WORLD_SHORTCUTS.y = actionsMenu;
(function actionsButton() {
  const small = document.querySelector("#touch .small");
  if (!small) return;
  // Junta os atalhos soltos num botão só.
  for (const b of [...small.querySelectorAll("button")]) if (["Jornal", "Mortes", "Golpe", "Crime"].includes(b.textContent.trim())) b.remove();
  const b = document.createElement("button");
  b.textContent = "Ações";
  b.addEventListener("click", actionsMenu);
  small.insertBefore(b, small.firstChild);
})();

/* ===================== HISTÓRIA: FINAIS E ALIADOS ===================== */

{
  const crBase = crewReady;
  crewReady = function () {
    if (CREW.some((id) => typeof isDead === "function" && isDead(id))) return false;
    if ((player.murders || 0) >= 1) return false;
    return crBase();
  };
  const endBase = showEnd;
  showEnd = function () {
    endBase();
    if (player.villainEnd) return;
    const h1 = byId("end").querySelector("h1"),
      note = byId("end").querySelector(".sub-note");
    const g = (m, f) => genderWord(m, f, m);
    let title = null,
      text = null;
    if (rulesK("aurelia")) (title = g("Fim do Rei", "Fim da Rainha")), (text = `A Canção voltou, e Cinzaluz tem ${g("um Rei mago", "uma Rainha maga")} no trono. ${player.soloCoup ? "Conquistado sozinh" + g("o", "a") + "." : ""}`);
    else if (player.exiled) (title = "Fim do Exílio"), (text = "A Canção voltou, mas você assistiu de longe, do Bosque. Cinzaluz não te quer de volta.");
    else if ((player.murders || 0) > 0) (title = "Fim Manchado"), (text = "Você salvou o mundo... e enterrou gente pelo caminho. A turma não lutou ao seu lado.");
    else if ((player.rep ?? 50) >= 80) (title = "Fim d" + g("o Herói", "a Heroína")), (text = "A Canção voltou e a vila inteira canta o seu nome. Estátua na praça incluída.");
    if (title) {
      h1.textContent = title;
      note.textContent = text;
    }
    const allies = CREW.filter((id) => friendshipLevel(id) >= 1 && !(typeof isDead === "function" && isDead(id))).map(shortName);
    byId("estats").innerHTML += `<br>Lutaram ao seu lado: <b>${crewReady() ? allies.join(", ") : "ninguém da turma"}</b>`;
  };
}

/* ===================== LIGAÇÕES ===================== */
{
  const dayBase = onNewDay;
  onNewDay = function () {
    dayBase.apply(this, arguments);
    if (!lifeMode()) return;
    spreadSecrets();
    giveKidTraits();
    if (lineage().length) TOPIC_W.antepassado = 3;
  };
  let acc = 0;
  const updBase = update;
  update = function (dt) {
    updBase(dt);
    if (game.mode === "title" || game.mode === "cutscene") return;
    acc += dt;
    if (acc > 1) {
      acc = 0;
      objTick();
    }
  };
}
