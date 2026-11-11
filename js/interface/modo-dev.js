/**
 * ECOS DO ARCANO — modo-dev.js
 * Versão dev, para testar rápido. Abra dev.html (ou index.html?dev).
 * Aparece um botão DEV no canto e a tecla F9 abre o painel:
 *  - Liberar tudo: nível 20, todas as runas e magias, ouro e itens.
 *  - Pular para qualquer etapa da história (as anteriores ficam feitas) e ir até ela.
 *  - Ir para qualquer região.
 *  - Invencível, vencer a luta agora, resolver o quebra-cabeça aberto,
 *    resolver as provas da Torre, revelar o mapa.
 *  - Ver cenas: cartões de capítulo, sonho, Torre, união dos poderes, reencontro.
 * Fora da versão dev, nada disto existe para o jogador.
 */

"use strict";

const DEV = (() => {
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
  player.runes = [...new Set([...player.runes, ...want])];
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

/* ===================== PAINEL ===================== */
function devPanelHTML() {
  const cur = curStep();
  const steps = STEPS.map((s, i) => `<option value="${i}" ${s === cur ? "selected" : ""}>${i + 1}. ${s.done() ? "✓ " : ""}${s.t}</option>`).join("");
  const zones = Object.keys(ZONES)
    .filter((z) => ZONES[z].nome)
    .map((z) => `<option value="${z}" ${z === player.zone ? "selected" : ""}>${ZONES[z].nome}</option>`)
    .join("");
  const scenes = Object.keys(DEV_SCENES).map((k) => `<option>${k}</option>`).join("");
  return `<div class="gh"><h2>Modo DEV</h2><button id="devx">Fechar (F9)</button></div>
  <small>Etapa: <b>${cur.id}</b> · ${player.zone} ${player.x},${player.y} · nível ${player.lvl} · ${lifeMode() ? "Simulador" : "História"}</small>
  <div class="dv-row"><button data-dv="all">Liberar tudo</button><button data-dv="god" class="${game.devGod ? "on" : ""}">Invencível</button><button data-dv="win">Vencer a luta</button><button data-dv="pz">Resolver quebra-cabeça</button><button data-dv="trials">Vencer provas da Torre</button><button data-dv="map">Revelar mapas</button></div>
  <label>Pular para a etapa</label><div class="dv-row"><select id="dvStep">${steps}</select><button data-dv="jump">Ir</button></div>
  <label>Ir para a região</label><div class="dv-row"><select id="dvZone">${zones}</select><button data-dv="zone">Ir</button></div>
  <label>Ver cena</label><div class="dv-row"><select id="dvScene">${scenes}</select><button data-dv="scene">Ver</button></div>
  <div class="dv-row"><button data-dv="off">Sair da versão dev</button></div>`;
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
  el.querySelectorAll("[data-dv]").forEach(
    (b) =>
      (b.onclick = () => {
        const a = b.dataset.dv;
        if (a === "all") devUnlockAll();
        else if (a === "god") ((game.devGod = !game.devGod), toast(`DEV: invencível ${game.devGod ? "ligado" : "desligado"}.`, 1600));
        else if (a === "win") return devWinBattle();
        else if (a === "pz") return devSolvePuzzle();
        else if (a === "trials") devSolveTrials();
        else if (a === "map") devRevealMap();
        else if (a === "jump") return (closeDevPanel(), devJumpTo(+byId("dvStep").value));
        else if (a === "zone") return devGoZone(byId("dvZone").value);
        else if (a === "scene") return (closeDevPanel(), DEV_SCENES[byId("dvScene").value]());
        else if (a === "off") {
          try {
            localStorage.removeItem("ecosDev");
          } catch (e) {}
          location.href = location.pathname.replace(/dev\.html$/, "index.html");
          return;
        }
        openDevPanel();
      }),
  );
}
function closeDevPanel() {
  const el = byId("devpanel");
  if (el) el.style.display = "none";
}
if (DEV) {
  const st = document.createElement("style");
  st.textContent = `#devbtn{position:fixed;left:8px;bottom:8px;z-index:9999;background:#c0392b;color:#fff;font:700 12px monospace;border:2px solid #fff;border-radius:6px;padding:4px 8px;opacity:.85}
  #devpanel{position:absolute;right:8px;top:8px;width:min(460px,94vw);max-height:92vh;overflow:auto;z-index:9998;padding:10px 14px;font-size:13px}
  #devpanel label{display:block;margin-top:8px;opacity:.8} #devpanel select{flex:1;min-width:0;max-width:100%}
  .dv-row{display:flex;flex-wrap:wrap;gap:6px;margin:6px 0} #devpanel button.on{outline:2px solid #ffd34d}`;
  document.head.appendChild(st);
  const b = document.createElement("button");
  b.id = "devbtn";
  b.textContent = "DEV";
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
    if (!lifeMode() && z && z.guard && tileAt(player.zone, x, y) === "G" && !player.guards.includes(player.zone) && (z.guard === "basilisco" || z.guard === "leviata") && guardiansFreed() < 3)
      return startBattle(z.guard, null);
    return iaBase(x, y);
  };
}
