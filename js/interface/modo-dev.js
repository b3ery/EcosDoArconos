/**
 * ECOS DO ARCANO — modo-dev.js
 * Versão dev, para testar rápido. Como um código de trapaça: segure CTRL e
 * digite E, C, O (ou abra dev.html / index.html?dev).
 * Aparece um botão DEV no canto e a tecla F9 abre o painel:
 *  - Liberar tudo: nível 20, todas as runas e magias, ouro e itens.
 *  - Pular para qualquer etapa da história (as anteriores ficam feitas) e ir até ela.
 *  - Ir para qualquer região.
 *  - Invencível, vencer a luta agora, resolver o quebra-cabeça aberto,
 *    resolver as provas da Torre, revelar o mapa.
 *  - Ver cenas: cartões de capítulo, sonho, Torre, união dos poderes, reencontro.
 *  - Aba "Apresentação" (a única visível de início): liga o modo demo
 *    (modo-demo.js), vai ao próximo objetivo, vence a luta, resolve o
 *    quebra-cabeça. As outras abas ficam em "Mais ferramentas".
 * Fora da versão dev, nada disto existe para o jogador.
 */

"use strict";

let DEV = (() => {
  try {
    if (/[?&#]dev\b/.test(location.search + location.hash)) localStorage.setItem("ecosDev", "1");
    if (/[?&#]nodev\b/.test(location.search + location.hash)) localStorage.removeItem("ecosDev");
    return localStorage.getItem("ecosDev") === "1";
  } catch (e) {
    return /dev/.test(location.search);
  }
})();

/* ===================== AÇÕES ===================== */
function devUnlockAll(quiet) {
  player.lvl = Math.max(player.lvl, 20);
  player.basehp = 60 + (player.lvl - 1) * 15;
  player.basemp = 30 + (player.lvl - 1) * 6;
  player.runes = ORDER.slice();
  player.spells = Object.keys(SPELLS);
  player.gold = Math.max(player.gold, 99999);
  for (const [it, n] of [["pocao", 20], ["eter", 20], ["fenix", 5], ["fragmento", 5], ["maca", 10], ["pao", 10]]) if (ITEMS[it]) player.inv[it] = Math.max(itemCount(it), n);
  player.hp = maxHp();
  player.mp = maxMp();
  player.food = player.water = 100;
  player.stamina = 100;
  player.tutDone = player.tutAsked = true;
  saveGame();
  if (!quiet) toast("DEV: tudo liberado (nível 20, runas, magias, ouro, itens).", 2600);
}
/** Marca uma etapa como feita. */
function devDoStep(s) {
  const F = player.flags,
    id = s.id;
  const guardOf = { ent: "bosque", serp: "pantano", grif: "picos", basil: "mina", levi: "porto" };
  if (id === "treino") F.treino = true;
  else if (id === "mercado") F.bought = true;
  else if (guardOf[id]) {
    if (!player.guards.includes(guardOf[id])) player.guards.push(guardOf[id]);
  } else if (/^(r2|r3|r4|porto1|porto2|serra1|serra2|serra3)$/.test(id)) F[id] = true;
  else if (id.startsWith("q-")) (player.puzzles = player.puzzles || {})[id.slice(2)] = 1;
  else if (id.startsWith("m-")) (player.calm = player.calm || {})[id.slice(2)] = { st: "feito", clues: [], got: [0, 1, 2], done: [] };
  else if (id === "x-lugares") for (const L of LANDMARKS) lmFound()[L.id] = 1;
  else if (id === "x-estrada") for (const e of ENCOUNTERS.slice(0, ENC_NEEDED)) enc()[e.id] = enc()[e.id] || "dev";
  else if (id === "t-sinos") trials().sinos = true;
  else if (id === "t-espelhos") trials().espelhos = true;
  else if (id === "t-lajes") trials().lajes = true;
  // As runas acompanham os Guardiões libertados.
  const n = guardiansFreed();
  const want = player.order.slice(0, Math.min(4, n + 1));
  if (n >= 4) want.push(...ORDER.filter((r) => !want.includes(r)).slice(0, n - 3));
  player.runes = [...new Set([...player.runes, ...want])].filter((r) => !isDom(r));
  if (player.dom && F.porto2 && !player.runes.includes("fogo")) player.runes.push("fogo");
}
/** Pula para a etapa i: tudo antes dela fica feito. */
function devJumpTo(i) {
  const target = STEPS[i];
  if (!target) return;
  for (let k = 0; k < i; k++) if (!STEPS[k].done()) devDoStep(STEPS[k]);
  player.cards = [...new Set([...(player.cards || []), ...Object.keys(CHAPTER_CARDS).filter((c) => STEPS.findIndex((s) => s.id === c) <= i)])];
  player.lvl = Math.max(player.lvl, target.lvl || Math.min(20, 3 + guardiansFreed() * 2));
  player.basehp = Math.max(player.basehp, 60 + (player.lvl - 1) * 15);
  player.basemp = Math.max(player.basemp, 30 + (player.lvl - 1) * 6);
  player.hp = maxHp();
  player.mp = maxMp();
  player.tutDone = player.tutAsked = true;
  saveGame();
  const now = curStep();
  if (now !== target) toast(`DEV: parou em "${now.t}" (não consegui marcar como feita).`, 4000);
  devGoToStep(now);
}
function devGoZone(z, pos) {
  if (!ZONES[z]) return;
  closeDevPanel();
  if (battle) endBattle();
  game.dialog = null;
  byId("dialog").style.display = "none";
  player.zone = z;
  const Z = ZONES[z];
  const p = pos || (Z.town && Z.town.arrive) || (Z.spawn && Z.spawn[0]) || [Math.floor(Z.w / 2), Math.floor(Z.h / 2)];
  let spot = p;
  if (!walkable(z, p[0], p[1])) for (const [dx, dy] of [[0, 1], [0, -1], [1, 0], [-1, 0], [1, 1], [-1, -1]]) if (walkable(z, p[0] + dx, p[1] + dy)) ((spot = [p[0] + dx, p[1] + dy]), (player.dir = dy > 0 ? "up" : dy < 0 ? "down" : dx > 0 ? "left" : "right"));
  [player.x, player.y] = spot;
  player.rx = player.x;
  player.ry = player.y;
  game.fade = 1;
  enterZone(true);
  game.mode = "world";
}
function devGoToStep(s) {
  const z = s.zone;
  devGoZone(z, s.pos());
}
function devWinBattle() {
  if (!battle || battle.done) return toast("DEV: não há luta agora.", 1800);
  closeDevPanel();
  battle.e.hp = 0;
  win();
}
function devSolvePuzzle() {
  const L = typeof lairOfZone === "function" && lairOfZone(player.zone);
  if (L) {
    closeDevPanel();
    return lairSolved(L, "DEV: desafio do covil resolvido.");
  }
  if (typeof PZ !== "undefined" && PZ) {
    closeDevPanel();
    return winPuzzle();
  }
  toast("DEV: abra um quebra-cabeça primeiro (pedestal brilhando).", 2200);
}
function devSolveTrials() {
  const S = trials();
  S.sinos = S.espelhos = S.lajes = true;
  trialsApply();
  saveGame();
  toast("DEV: provas da Torre vencidas.", 2000);
}
function devRevealMap() {
  for (const z of Object.keys(ZONES)) {
    const s = seenOf(z);
    for (let i = 0; i < s.length; i++) s[i] = 1;
  }
  toast("DEV: mapas revelados.", 1800);
}
const DEV_SCENES = {
  "Cartão: Prólogo": () => playCine(chapterCard(...CHAPTER_CARDS.treino), 3.6),
  "Cartão: Capítulo Final": () => playCine(chapterCard(...CHAPTER_CARDS.sile), 3.6),
  "Sonho com Vesper": () => playCine(dreamScene, 3.2),
  "Chegada à Torre": () => playCine(towerScene, 6),
  "Guardião libertado (Ent)": () => playCine(guardianScene("ent", player.order[1] || "terra"), 6),
  "Máscara caindo": () => playCine(maskScene, 6),
  "Reencontro": () => playCine(reunionScene, 8),
};

/* ===================== PAINEL (versão para apresentação) =====================
   Abas simples com botões grandes: cada botão testa uma mecânica.
   Começo · Lugares · Tempo e clima · História · Simulador · Avançado */
let devTab = "demo";
let devMore = false; // "Mais ferramentas": as abas completas ficam escondidas na apresentação
const DEV_PLACES = () => {
  const L = typeof LOTES !== "undefined" ? LOTES.lots.filter((q) => q.zid === "vila") : [];
  const lot = (k) => L.find((q) => q.size === k);
  const at = (z, x, y) => () => devGoZone(z, [x, y]);
  const lotSpot = (k) => () => {
    const q = lot(k);
    if (q) devGoZone("vila", [q.b.door[0], q.road + 1]);
  };
  const mata = (town, i) => () => {
    const id = `mata-${town}-${i}`;
    if (typeof buildLocalForest !== "function") return;
    buildLocalForest(id);
    const Z = ZONES[id];
    devGoZone(id, Object.values(Z.open)[0]);
  };
  return [
    ["Cinzaluz", [["Praça e fonte", "house", at("vila", 31, 24)], ["Sua casa e quintal", "house", () => devGoZone("vila", [5, 18])], ["Taverna", "mug", at("vila", 16, 19)], ["Castelo", "crown", at("vila", 31, 13)]]],
    ["Bairros em lotes", [["Alto dos Nobres (mansões)", "crown", lotSpot("L")], ["Rua dos Ofícios (classe média)", "house", lotSpot("M")], ["Beco dos Remendos (pobres)", "house", lotSpot("S")], ["Bairro das Flores", "flower", at("vila", 30, 59)]]],
    ["Reinos", [["Marés (porto)", "fish", () => devGoZone("porto")], ["Pedravale (serra)", "gem", () => devGoZone("serra")], ["Solmar (festival)", "sun", () => devGoZone("solmar")], ["Rosalva", "wine", () => devGoZone("rosalva")]]],
    ["Além-mar", [["Zahar (deserto)", "sun", () => devGoZone("pais-zahar")], ["Gelomar (gelo)", "snow", () => devGoZone("pais-gelo")], ["Jadeluz", "flower", () => devGoZone("pais-jade")], ["Verdemata", "herb", () => devGoZone("pais-verde")]]],
    ["Navegação", [["Cais dos Navegantes (Capitania)", "anchor", () => devGoZone("cais", [11, 10])], ["Zarpar agora pelo Mar Aberto", "flag", devSail], ["Porto de Marés (portal do cais)", "fish", at("porto", 58, 21)]]],
    ["Florestas", [["Mata do Rio Grande", "water", mata("vila", 0)], ["Cachoeira Grande", "water", mata("pais-verde-3", 2)], ["Vulcão de Ferrofundo", "sun", mata("pais-ferro", 2)], ["Montanha nevada", "snow", mata("pais-gelo", 1)], ["Savana", "paw", mata("pais-ouro", 0)]]],
  ];
};
const demoOn = () => typeof DEMO !== "undefined" && DEMO;
function devNextGoal() {
  const s = curStep();
  if (!s) return;
  if (typeof demoZoneOk === "function" && demoOn() && !demoZoneOk(s.zone)) return toast("A demo já chegou ao fim desta parte.", 2000);
  devGoToStep(s);
  toast(`Objetivo: ${s.t}`, 2600);
}
function devSail() {
  closeDevPanel();
  if (typeof seaSetSail !== "function") return;
  devGoZone("cais", [11, 10]);
  player.gold = Math.max(player.gold, 2000);
  interactAt(11, 9);
  const i = (game.choice || []).findIndex((o) => /Zarpar/.test(o.t));
  if (i >= 0) return pickChoice(i);
  const r = (game.choice || []).findIndex((o) => /Alugar/.test(o.t));
  if (r >= 0) pickChoice(r);
  toast("Navio alugado: fale com o Capitão do Porto (à frente) e escolha Zarpar.", 3200);
}
const DEV_ACTIONS = {
  demo: [
    ["Próximo objetivo (ir até lá)", "flag", () => (closeDevPanel(), devNextGoal()), null, "historia"],
    ["Vencer a luta", "sword", () => devWinBattle(), null, "historia"],
    ["Resolver quebra-cabeça / covil", "lock", () => devSolvePuzzle(), null, "historia"],
    ["Invencível", "heart", () => ((game.devGod = !game.devGod), toast(`Invencível ${game.devGod ? "ligado" : "desligado"}.`, 1600)), () => game.devGod],
    ["Abrir os Trabalhos", "hammer", () => (closeDevPanel(), professionsMenu()), null, "vida"],
    ["Governo do reino (K)", "flag", () => (closeDevPanel(), kingdomsMenu()), null, "vida"],
    ["Recomeçar a demo do zero", "scroll", () => (typeof demoRestart === "function" ? demoRestart() : null)],
    ["Passeio pelos lugares bonitos", "eye", () => (closeDevPanel(), typeof startTour === "function" && startTour())],
  ],
  comeco: [
    ["Passeio pelos lugares bonitos (apresentação)", "eye", () => (closeDevPanel(), typeof startTour === "function" && startTour())],
    ["Liberar tudo", "star", () => devUnlockAll()],
    ["Invencível", "heart", () => ((game.devGod = !game.devGod), toast(`Invencível ${game.devGod ? "ligado" : "desligado"}.`, 1600)), () => game.devGod],
    ["+1000 de ouro", "coin", () => ((player.gold += 1000), toast("+1000 de ouro.", 1400))],
    ["Encher fome, sede e energia", "bread", () => ((player.food = player.water = 100), (player.stamina = 100), typeof addNeed === "function" && lifeMode() && ["energy", "fun", "social", "hygiene", "bladder"].forEach((n) => addNeed(n, 100)), toast("Tudo cheio.", 1400))],
    ["Trocar de modo (História ↔ Simulador)", "book", () => ((player.mode = lifeMode() ? "historia" : "vida"), saveGame(), toast(`Agora: ${lifeMode() ? "Simulador de Vida" : "Modo História"}. Recarregando...`, 1500), setTimeout(() => location.reload(), 900))],
  ],
  tempo: [
    ["Manhã (8h)", "sun", () => devClock(8)],
    ["Meio-dia", "sun", () => devClock(12)],
    ["Hora dourada (17h30)", "sun", () => devClock(17.5)],
    ["Noite (22h)", "zzz", () => devClock(22)],
    ["+1 dia", "scroll", () => passTime(24, "DEV: um dia depois.")],
    ["Próxima estação", "flower", () => ((player.day += seasonLen(seasonIdx(player.day)) - seasonDay() + 1), toast(`Estação: ${season().n || season().id}.`, 1600))],
    ["Sol", "sun", () => devWeather("sol")],
    ["Chuva", "rain", () => devWeather("chuva")],
    ["Tempestade", "storm", () => devWeather("tempestade")],
    ["Neve", "snow", () => devWeather("neve")],
    ["Neblina", "fog", () => devWeather("neblina")],
  ],
  historia: [
    ["Vencer a luta", "sword", () => devWinBattle()],
    ["Resolver quebra-cabeça / covil", "lock", () => devSolvePuzzle()],
    ["Vencer as provas da Torre", "star", () => devSolveTrials()],
  ],
  simulador: [
    ["Minigame: padeiro", "bread", () => devGame("padeiro")],
    ["Minigame: ferreiro", "sword", () => devGame("ferreiro")],
    ["Minigame: cavalariço", "paw", () => devGame("cavalarico")],
    ["Minigame: bardo", "note", () => devGame("bardo")],
    ["Minigame: troco", "coin", () => devGame("balconista")],
    ["Minigame: lenhador", "herb", () => devGame("lenhador")],
    ["Minigame: colheita", "herb", () => devGame("fazendeiro")],
    ["Minigame: mina", "gem", () => devGame("minerador")],
    ["Desastre: incêndio", "sun", () => devDisaster("fire")],
    ["Desastre: terremoto", "skull", () => devDisaster("quake")],
  ],
};
function devClock(h) {
  player.clock = Math.round(h * 60);
  toast(`Hora: ${Math.floor(h)}h${h % 1 ? "30" : ""}.`, 1400);
}
function devWeather(w) {
  player.weather = w;
  toast(`Clima: ${(WEATHER[w] && WEATHER[w].n) || w}.`, 1400);
}
function devGame(id) {
  closeDevPanel();
  if (typeof gestureTest === "function") gestureTest(id, {});
}
function devDisaster(k) {
  closeDevPanel();
  if (!lifeMode()) return toast("Desastres são do Simulador de Vida.", 2000);
  if (typeof disasterTest !== "undefined" && disasterTest[k]) disasterTest[k]();
}
function devPanelHTML() {
  const cur = curStep();
  const allTabs = [["comeco", "Começo"], ["lugares", "Lugares"], ["tempo", "Tempo e clima"], ["historia", "História"], ["simulador", "Simulador"], ["avancado", "Avançado"]];
  // a aba História só na História; a aba Simulador só no Simulador
  const tabs = [["demo", "Apresentação"]].concat(devMore ? allTabs.filter(([k]) => !(k === "historia" && lifeMode()) && !(k === "simulador" && !lifeMode())) : []);
  if (!tabs.some(([k]) => k === devTab)) devTab = "demo";
  // cada botão só aparece no modo em que funciona (5º campo: "historia" ou "vida")
  const fits = (a) => !a[4] || a[4] === (lifeMode() ? "vida" : "historia");
  const btn = (id, a) => (fits(a) ? `<button class="dv-big ${a[3] && a[3]() ? "on" : ""}" data-act="${id}">${iconHTML(a[1], 18)}<span>${a[0]}</span></button>` : "");
  let body = "";
  if (devTab === "lugares")
    body = DEV_PLACES()
      .map(([g, list], gi) => `<h4>${g}</h4><div class="dv-grid">${list.map((p, i) => `<button class="dv-big" data-place="${gi}:${i}">${iconHTML(p[1], 18)}<span>${p[0]}</span></button>`).join("")}</div>`)
      .join("");
  else if (devTab === "historia") {
    const steps = STEPS.map((s, i) => `<option value="${i}" ${s === cur ? "selected" : ""}>${i + 1}. ${s.done() ? "✓ " : ""}${s.t}</option>`).join("");
    const scenes = Object.keys(DEV_SCENES).map((k) => `<option>${k}</option>`).join("");
    body = `<div class="dv-grid">${DEV_ACTIONS.historia.map((a, i) => btn("historia:" + i, a)).join("")}</div>
      <h4>Pular para a etapa</h4><div class="dv-row"><select id="dvStep">${steps}</select><button data-dv="jump" class="go">Ir</button></div>
      <h4>Ver uma cena</h4><div class="dv-row"><select id="dvScene">${scenes}</select><button data-dv="scene" class="go">Ver</button></div>`;
  } else if (devTab === "avancado") {
    const zones = Object.keys(ZONES)
      .filter((z) => ZONES[z].nome)
      .map((z) => `<option value="${z}" ${z === player.zone ? "selected" : ""}>${ZONES[z].nome}</option>`)
      .join("");
    body = `<h4>Ir para qualquer lugar</h4><div class="dv-row"><select id="dvZone">${zones}</select><button data-dv="zone" class="go">Ir</button></div>
      <small>Etapa: <b>${cur.id}</b> · ${player.zone} ${player.x},${player.y} · nível ${player.lvl}</small>
      <div class="dv-row"><button data-dv="off">Sair da versão dev</button></div>`;
  } else if (devTab === "demo") {
    const st = curStep();
    body = `<p style="margin:4px 0 8px">${demoOn() ? `<b style="color:#ffe08a">Modo demo ligado.</b> Só o começo da história, do zero e guiado. Agora: <b>${st ? st.t : "-"}</b>` : "Para a apresentação, ligue o <b>modo demo</b>: começa do zero, só o prólogo e a primeira runa, com a primeira parte do mundo aberta."}</p>
      <div class="dv-grid">${DEV_ACTIONS.demo.map((a, i) => btn("demo:" + i, a)).join("")}</div>
      <h4>Comando</h4><div class="dv-row"><input id="dvCmd" placeholder="/apresentacao" autocomplete="off" style="flex:1;min-width:0"><button data-dv="cmd" class="go">Ok</button></div>
      <div class="dv-row"><button data-dv="demo">${demoOn() ? "Desligar o modo demo" : "Ligar o modo demo"}</button><button data-dv="more">${devMore ? "Esconder ferramentas" : "Mais ferramentas ▾"}</button></div>`;
  } else body = `<div class="dv-grid">${(DEV_ACTIONS[devTab] || []).map((a, i) => btn(devTab + ":" + i, a)).join("")}</div>`;
  return `<div class="gh"><h2>Painel de testes</h2><button id="devx">✕</button></div>
  <small class="dv-now">${lifeMode() ? "Simulador de Vida" : "Modo História"} · ${ZONES[player.zone] ? ZONES[player.zone].nome : player.zone} · dia ${player.day}, ${String(Math.floor(player.clock / 60)).padStart(2, "0")}h</small>
  <div class="dv-tabs">${tabs.map(([k, n]) => `<button data-tab="${k}" class="${k === devTab ? "on" : ""}">${n}</button>`).join("")}</div>
  ${body}`;
}
function openDevPanel() {
  let el = byId("devpanel");
  if (!el) {
    el = document.createElement("div");
    el.id = "devpanel";
    el.className = "box ui ov";
    byId("screen").appendChild(el);
  }
  el.innerHTML = devPanelHTML();
  el.style.display = "block";
  byId("devx").onclick = closeDevPanel;
  if (byId("dvCmd")) byId("dvCmd").onkeydown = (e) => (e.stopPropagation(), e.key === "Enter" && runDevCmd());
  el.querySelectorAll("[data-tab]").forEach((b) => (b.onclick = () => ((devTab = b.dataset.tab), openDevPanel())));
  el.querySelectorAll("[data-act]").forEach(
    (b) =>
      (b.onclick = () => {
        const [g, i] = b.dataset.act.split(":");
        DEV_ACTIONS[g][+i][2]();
        if (byId("devpanel").style.display === "block") openDevPanel();
      }),
  );
  el.querySelectorAll("[data-place]").forEach(
    (b) =>
      (b.onclick = () => {
        const [g, i] = b.dataset.place.split(":").map(Number);
        DEV_PLACES()[g][1][i][2]();
        closeDevPanel();
      }),
  );
  el.querySelectorAll("[data-dv]").forEach(
    (b) =>
      (b.onclick = () => {
        const a = b.dataset.dv;
        if (a === "jump") return (closeDevPanel(), devJumpTo(+byId("dvStep").value));
        if (a === "zone") return devGoZone(byId("dvZone").value);
        if (a === "scene") return (closeDevPanel(), DEV_SCENES[byId("dvScene").value]());
        if (a === "demo") return typeof setDemo === "function" && setDemo(!demoOn());
        if (a === "more") return ((devMore = !devMore), openDevPanel());
        if (a === "cmd") return runDevCmd();
        if (a === "off") {
          try {
            localStorage.removeItem("ecosDev");
          } catch (e) {}
          location.href = location.pathname.replace(/dev\.html$/, "index.html");
        }
      }),
  );
}
function runDevCmd() {
  const el = byId("dvCmd");
  if (!el) return;
  if (typeof devCommand === "function" && devCommand(el.value)) return closeDevPanel();
  toast(`Comando desconhecido: ${el.value || "(vazio)"}. Use /apresentacao para abrir a demo.`, 2600);
}
function closeDevPanel() {
  const el = byId("devpanel");
  if (el) el.style.display = "none";
}
function setupDev() {
  const st = document.createElement("style");
  st.textContent = `#devbtn{position:fixed;left:8px;bottom:8px;z-index:9999;background:#c0392b;color:#fff;font:700 12px monospace;border:2px solid #fff;border-radius:6px;padding:4px 8px;opacity:.85}
  #devpanel{position:absolute;right:8px;top:8px;width:min(460px,94vw);max-height:92vh;overflow:auto;z-index:9998;padding:10px 14px;font-size:13px}
  #devpanel label{display:block;margin-top:8px;opacity:.8} #devpanel select{flex:1;min-width:0;max-width:100%}
  .dv-row{display:flex;flex-wrap:wrap;gap:6px;margin:6px 0} #devpanel button.on{outline:2px solid #ffd34d}
  #devpanel h4{margin:10px 0 4px;font-size:12px;color:#ffe08a;text-transform:uppercase;letter-spacing:.08em}
  #devpanel .dv-now{display:block;opacity:.8;margin-bottom:6px}
  .dv-tabs{display:flex;flex-wrap:wrap;gap:4px;margin:6px 0 8px}.dv-tabs button{padding:5px 10px;font-size:12px}.dv-tabs button.on{background:#c9a03a;color:#1a1028}
  .dv-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:6px}
  .dv-big{display:flex;align-items:center;gap:6px;text-align:left;padding:8px;font-size:12px;line-height:1.15;min-height:42px}
  .dv-big span{flex:1}`;
  document.head.appendChild(st);
  const b = document.createElement("button");
  b.id = "devbtn";
  b.textContent = "TESTES (F9)";
  b.onclick = () => (byId("devpanel") && byId("devpanel").style.display === "block" ? closeDevPanel() : openDevPanel());
  document.body.appendChild(b);
  addEventListener("keydown", (e) => {
    if (e.key === "F9") {
      e.preventDefault();
      byId("devpanel") && byId("devpanel").style.display === "block" ? closeDevPanel() : openDevPanel();
    }
  });
  const updBase = update;
  update = function (dt) {
    updBase(dt);
    if (game.devGod && player && player.hp < maxHp()) player.hp = maxHp();
  };
  document.title = "[DEV] " + document.title;

  // Na versão dev tudo já começa liberado: nível 20, as seis runas (a barreira do
  // sul abre), todas as magias, ouro e itens, em jogo novo ou carregado.
  const sgBase = startGame;
  startGame = function () {
    const r = sgBase.apply(this, arguments);
    setTimeout(() => {
      if (!player || !player.name) return;
      if (typeof DEMO !== "undefined" && DEMO) return; // a demo começa do zero, sem nada liberado
      devUnlockAll(true);
      toast("DEV: tudo liberado. F9 abre o painel.", 3000);
    }, 300);
    return r;
  };
  // E nada fica trancado: os selos dos Guardiões, a porta do Silenciador e a regra
  // "liberte três Guardiões antes do Basilisco e do Leviatã" não valem no modo dev.
  if (typeof sealMessage === "function") sealMessage = () => null;
  const iaBase = interactAt;
  interactAt = function (x, y) {
    const z = ZONES[player.zone];
    if (!lifeMode() && z && z.guard && !z.lair && tileAt(player.zone, x, y) === "G" && !player.guards.includes(player.zone) && (z.guard === "basilisco" || z.guard === "leviata") && guardiansFreed() < 3)
      return startBattle(z.guard, null);
    return iaBase(x, y);
  };
}
if (DEV) setupDev();

/* ----- código secreto: segure Ctrl e digite E, C, O ----- */
{
  let typed = "";
  addEventListener(
    "keydown",
    (e) => {
      if (!e.ctrlKey || e.altKey || e.metaKey) return void (typed = "");
      const k = (e.key || "").toLowerCase();
      if (!/^[a-z]$/.test(k)) return;
      typed = (typed + k).slice(-3);
      if ("eco".startsWith(typed.slice(-Math.min(typed.length, 3))) || typed.endsWith("e") || typed.endsWith("ec")) e.preventDefault(); // Ctrl+E/C/O não abrem nada do navegador
      if (typed !== "eco") return;
      typed = "";
      e.preventDefault();
      enableCheats();
    },
    true,
  );
}
/** Liga os truques (Ctrl + E C O no teclado; no celular, 5 toques no título do Menu do jogo). */
function enableCheats() {
  if (DEV) return toast && toast("Os truques já estão ligados. F9 ou TESTES abre o painel.", 2400);
  DEV = true;
  try {
    localStorage.setItem("ecosDev", "1");
  } catch (err) {}
  setupDev();
  if (player && player.name && !(typeof DEMO !== "undefined" && DEMO)) devUnlockAll(true);
  playSound && playSound(1047, 0.2, "triangle");
  toast && toast("Truques liberados! O painel TESTES está no Menu do jogo (ou F9).", 3200);
}
