/* 19-melhorias-e-criador.js: junta 31-melhorias.js, 35-criador.js. */
/**
 * ECOS DO ARCANO — 19-melhorias-e-criador.js
 *  1. Tutorial jogável nos primeiros minutos (cartão com o próximo passo).
 *  2. Três espaços de jogo salvo, com retrato e resumo de cada um.
 *  3. Música própria para cada lugar (floresta, mina, porto, serra, casa, pântano, torre).
 *  4. Expressões nos retratos dos diálogos (feliz, bravo, triste, apaixonado, surpreso).
 *  5. Conquistas com tela de troféus (tecla U).
 *  6. Mapa do mundo ilustrado (Tab dentro do mapa).
 *  7. Celular: segurar o dedo num personagem abre o menu em pizza; botões maiores.
 *  8. Eventos da turma: aniversários, exposição da Mylena, casamento do Lucas.
 *  9. Clínica da Júlia: missões de resgate de animais.
 * Carrega depois do 18-entrada.js.
 */

"use strict";

/* ===================== 2. ESPAÇOS DE JOGO SALVO ===================== */

const SLOTS = 3;
function slotKey(i) {
  return i === 0 ? SAVE_KEY : `${SAVE_KEY}-${i}`;
}
function curSlot() {
  try {
    return Math.max(0, Math.min(SLOTS - 1, +localStorage.getItem("ecos-slot") || 0));
  } catch (e) {
    return 0;
  }
}
function setSlot(i) {
  try {
    localStorage.setItem("ecos-slot", String(i));
  } catch (e) {}
}
function readSlot(i) {
  try {
    const s = localStorage.getItem(slotKey(i));
    return s ? JSON.parse(s) : null;
  } catch (e) {
    return null;
  }
}
saveGame = function () {
  try {
    for (const z in game.seenArr) player.seen[z] = Array.from(game.seenArr[z]).join("");
    player.savedAt = Date.now();
    localStorage.setItem(slotKey(curSlot()), JSON.stringify(player));
  } catch (e) {}
};
loadSave = function () {
  return readSlot(curSlot());
};
clearSave = function () {
  try {
    localStorage.removeItem(slotKey(curSlot()));
  } catch (e) {}
};
function anySave() {
  for (let i = 0; i < SLOTS; i++) if (readSlot(i)) return true;
  return false;
}
function slotSummary(s) {
  if (!s) return "";
  return s.mode === "vida" ? `Simulador de Vida · ${s.age ?? 18} anos · Dia ${s.day}` : `Modo História · Nível ${s.lvl} · Dia ${s.day}`;
}
/** Painel de espaços salvos. mode: "load" (continuar) ou "new" (escolher onde começar). */
function openSlots(mode, onPick) {
  let el = byId("svs");
  if (!el) {
    el = document.createElement("div");
    el.id = "svs";
    el.className = "box ui ov";
    byId("screen").appendChild(el);
  }
  game.slotsPrev = game.mode;
  game.mode = "svs";
  const cards = [];
  for (let i = 0; i < SLOTS; i++) {
    const s = readSlot(i);
    const when = s && s.savedAt ? new Date(s.savedAt).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "";
    cards.push(`<div class="sv ${s ? "" : "empty"} ${i === curSlot() ? "cur" : ""}">
      <div class="sv-n">Espaço ${i + 1}</div>
      ${s ? `<canvas class="sv-pv" data-pv="${i}" width="96" height="96"></canvas>` : `<div class="sv-pv empty">${iconHTML("scroll", 40)}</div>`}
      <b>${s ? s.name : "Vazio"}</b>
      <small>${s ? slotSummary(s) : mode === "new" ? "Comece um jogo novo aqui" : "Nenhum jogo salvo"}</small>
      ${s ? `<small class="sv-g">${iconHTML("coin", 12)}${s.gold} ouro${when ? ` · salvo ${when}` : ""}</small>` : ""}
      <div class="sv-b">
        ${mode === "load" && s ? `<button data-play="${i}">Jogar</button><button class="del" data-del="${i}">Apagar</button>` : ""}
        ${mode === "new" ? `<button data-new="${i}">${s ? "Substituir" : "Começar aqui"}</button>` : ""}
      </div>
    </div>`);
  }
  el.innerHTML = `<div class="gh"><h2>${mode === "load" ? "Jogos salvos" : "Onde salvar o jogo novo?"}</h2><button id="slotclose">Voltar (Esc)</button></div><div class="svs">${cards.join("")}</div>`;
  el.style.display = "block";
  el.querySelectorAll("[data-pv]").forEach((cv) => {
    const s = readSlot(+cv.dataset.pv);
    if (s && s.look) drawPreview(cv, s.look, "down");
  });
  byId("slotclose").onclick = closeSlots;
  el.querySelectorAll("[data-play]").forEach((b) => (b.onclick = () => (setSlot(+b.dataset.play), closeSlots(), onPick && onPick())));
  el.querySelectorAll("[data-new]").forEach((b) => (b.onclick = () => (setSlot(+b.dataset.new), closeSlots(), onPick && onPick())));
  el.querySelectorAll("[data-del]").forEach(
    (b) =>
      (b.onclick = () => {
        if (!confirm("Apagar este jogo salvo? Não dá para desfazer.")) return;
        try {
          localStorage.removeItem(slotKey(+b.dataset.del));
        } catch (e) {}
        refreshTitle();
        anySave() ? openSlots(mode, onPick) : closeSlots();
      }),
  );
}
function closeSlots() {
  const el = byId("svs");
  if (el) el.style.display = "none";
  game.mode = game.slotsPrev === "svs" ? "title" : game.slotsPrev || "title";
}
{
  const contBase = byId("btnCont").onclick,
    newBase = byId("btnNew").onclick,
    lifeBase = byId("btnLife").onclick;
  byId("btnCont").onclick = () => openSlots("load", contBase);
  // Jogo novo: sem nenhum salvo, usa o espaço 1; senão pergunta em qual espaço salvar.
  const pickNew = (base) => () => {
    if (!anySave()) return (setSlot(0), base());
    openSlots("new", base);
  };
  byId("btnNew").onclick = pickNew(newBase);
  byId("btnLife").onclick = pickNew(lifeBase);
}
refreshTitle = function () {
  const b = byId("btnCont");
  if (!anySave()) return (b.style.display = "none");
  b.style.display = "";
  const s = loadSave() || [0, 1, 2].map(readSlot).find(Boolean);
  const n = [0, 1, 2].filter((i) => readSlot(i)).length;
  b.innerHTML = `▶ Continuar: ${s.name} · ${slotSummary(s)}${n > 1 ? ` <small>(+${n - 1} salvo${n > 2 ? "s" : ""})</small>` : ""}`;
};
refreshTitle();
KEY_HANDLERS.svs = (k) => k === "escape" && closeSlots();

/* ===================== 1. TUTORIAL JOGÁVEL ===================== */

const TOUCH = matchMedia("(pointer:coarse)").matches;
const TUT_STORY = [
  { t: TOUCH ? "Use o direcional na tela para andar." : "Use <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> ou as setas para andar.", done: () => game.tutMoved >= 4 },
  { t: TOUCH ? "Chegue perto de alguém e toque no botão A para conversar." : "Chegue perto de alguém e aperte <kbd>E</kbd> para conversar.", done: () => game.mode === "choice" || !!game.dialog },
  { t: TOUCH ? "Toque em <b>Itens</b> para abrir a bolsa." : "Aperte <kbd>I</kbd> para abrir a bolsa (inventário).", done: () => game.mode === "inv" },
  { t: TOUCH ? "Toque em <b>Missões</b> para ver o que fazer." : "Aperte <kbd>Q</kbd> para ver as missões.", done: () => game.mode === "quests" },
  { t: "Siga a <b style='color:var(--gold)'>seta dourada</b>: ela sempre mostra o próximo passo. Boa aventura!", done: () => game.tutT > 9 },
];
const TUT_LIFE = [
  TUT_STORY[0],
  TUT_STORY[1],
  { t: "Fique de olho no painel: fome, sede, energia, higiene e diversão. Se uma barra acabar, você passa mal.", done: () => game.tutT > 7 },
  { t: TOUCH ? "Toque em <b>Itens</b> para ver o que tem na bolsa." : "Aperte <kbd>I</kbd> para ver a bolsa.", done: () => game.mode === "inv" },
  { t: "Ganhe ouro no <b style='color:var(--gold)'>Quadro de Trabalhos</b> da praça, ao lado da fonte. Boa vida!", done: () => game.tutT > 9 || !!player.job },
];
function tutSteps() {
  return lifeMode() ? TUT_LIFE : TUT_STORY;
}
function tutTick(dt) {
  if (!player.tutStep && !player.tutDone && player.day > 1) player.tutDone = true;
  if (player.tutDone || game.mode === "title" || !player.name) return hideTut();
  const steps = tutSteps();
  const i = player.tutStep || 0;
  if (i >= steps.length) {
    player.tutDone = true;
    saveGame();
    return hideTut();
  }
  if (!game.dialog) game.tutT = (game.tutT || 0) + dt;
  if (steps[i].done()) {
    player.tutStep = i + 1;
    game.tutT = 0;
    game.tutMoved = 0;
    playSound(880, 0.08, "sine");
  }
  showTut(steps[Math.min(player.tutStep || 0, steps.length - 1)].t, player.tutStep || 0, steps.length);
}
function showTut(text, i, n) {
  let el = byId("coach");
  if (!el) {
    el = document.createElement("div");
    el.id = "coach";
    el.className = "ui";
    byId("screen").appendChild(el);
  }
  const html = `<div class="tut-h">${iconHTML("star", 14)} Primeiros passos <span>${Math.min(i + 1, n)}/${n}</span><button id="tutskip" title="Pular o tutorial">Pular</button></div><div class="tut-t">${text}</div><div class="tut-dots">${Array.from({ length: n }, (_, k) => `<i class="${k < i ? "ok" : k === i ? "on" : ""}"></i>`).join("")}</div>`;
  if (el.dataset.h !== html) {
    el.innerHTML = html;
    el.dataset.h = html;
    byId("tutskip").onclick = () => {
      player.tutDone = true;
      saveGame();
      hideTut();
    };
  }
  el.style.display = ["world", "choice", "quests", "inv"].includes(game.mode) && !game.dialog && !(game.mode === "inv" && player.tutStep !== 2) ? "block" : "none";
}
function hideTut() {
  const el = byId("coach");
  if (el) el.style.display = "none";
}
let tutLast = null;
setInterval(() => {
  if (game.mode === "title") return hideTut();
  const p = `${player.x},${player.y},${player.zone}`;
  if (tutLast && p !== tutLast) game.tutMoved = (game.tutMoved || 0) + 1;
  tutLast = p;
  tutTick(0.25);
}, 250);

/* ===================== 3. MÚSICA POR LUGAR ===================== */

Object.assign(TRACKS, {
  floresta: { bpm: 84, lead: "triangle", melody: [64, 0, 67, 0, 69, 0, 71, 69, 67, 0, 64, 0, 62, 0, 64, 0, 67, 0, 69, 71, 72, 0, 71, 69, 67, 0, 64, 0, 64, 0, 0, 0], bass: [40, 0, 0, 0, 43, 0, 0, 0, 45, 0, 0, 0, 38, 0, 0, 0] },
  mina: { bpm: 76, lead: "triangle", melody: [57, 0, 0, 60, 0, 0, 59, 0, 57, 0, 0, 0, 55, 0, 56, 0, 57, 0, 0, 62, 0, 0, 60, 0, 59, 0, 56, 0, 57, 0, 0, 0], bass: [33, 0, 0, 0, 33, 0, 0, 0, 31, 0, 0, 0, 32, 0, 0, 0] },
  porto: { bpm: 100, lead: "square", melody: [74, 0, 72, 74, 76, 0, 79, 0, 76, 74, 72, 0, 69, 0, 72, 0, 74, 0, 76, 79, 81, 0, 79, 76, 74, 0, 72, 0, 74, 0, 0, 0], bass: [50, 0, 57, 0, 48, 0, 55, 0, 45, 0, 52, 0, 43, 0, 50, 0] },
  serra: { bpm: 90, lead: "square", melody: [67, 0, 71, 0, 74, 0, 72, 71, 69, 0, 67, 0, 66, 0, 67, 0, 71, 0, 74, 76, 79, 0, 78, 76, 74, 0, 71, 0, 72, 0, 0, 0], bass: [43, 0, 50, 0, 40, 0, 47, 0, 45, 0, 52, 0, 38, 0, 45, 0] },
  casa: { bpm: 66, lead: "triangle", melody: [72, 0, 0, 76, 0, 0, 79, 0, 77, 0, 76, 0, 74, 0, 0, 0, 72, 0, 0, 74, 0, 0, 76, 0, 74, 0, 72, 0, 72, 0, 0, 0], bass: [48, 0, 0, 0, 53, 0, 0, 0, 55, 0, 0, 0, 48, 0, 0, 0] },
  pantano: { bpm: 72, lead: "triangle", melody: [62, 0, 63, 0, 62, 0, 0, 58, 0, 0, 62, 0, 65, 0, 63, 62, 60, 0, 58, 0, 0, 0, 57, 0, 58, 0, 60, 0, 62, 0, 0, 0], bass: [38, 0, 0, 0, 34, 0, 0, 0, 36, 0, 0, 0, 33, 0, 0, 0] },
  torre: { bpm: 80, lead: "sawtooth", melody: [57, 0, 60, 0, 63, 0, 62, 0, 60, 0, 57, 0, 56, 0, 0, 0, 57, 0, 60, 63, 66, 0, 65, 63, 62, 0, 60, 0, 57, 0, 0, 0], bass: [33, 33, 0, 0, 32, 32, 0, 0, 30, 30, 0, 0, 29, 29, 0, 0] },
});
const ZONE_TRACK = { floresta: "floresta", bosque: "floresta", mina: "mina", porto: "porto", serra: "serra", picos: "serra", casa: "casa", quintal: "casa", pantano: "pantano", torre: "torre" };
const _desiredTrackBase = desiredTrack;
desiredTrack = function () {
  const base = _desiredTrackBase();
  if (["titulo", "batalha", "chefe", "festival", "taverna"].includes(base)) return base;
  const t = ZONE_TRACK[player.zone];
  if (t && !(t === "porto" && isNight()) && !(t === "serra" && isNight())) return t;
  return base;
};

/* ===================== 4. EXPRESSÕES NOS RETRATOS ===================== */

function lineEmotion(text) {
  if (/HAHA|haha|kkk|risada|Hahaha|engraçad/.test(text)) return "laugh";
  if (/te amo|amor|coração|♥|beij|apaixon/i.test(text)) return "heart";
  if (/!!|\?!|COMO|Saia|nunca mais|vou lembrar|Ladrão|Some daqui|briga/i.test(text) || /^[A-ZÁÉÍÓÚ ,!]{8,}$/.test(text)) return "anger";
  if (/\.\.\.|triste|chor|saudade|perdi|desculp|sozinh/i.test(text)) return "sweat";
  if (/\?$/.test(text.trim()) || /Uau|Nossa|O quê|sério\?/i.test(text)) return "eye";
  if (/!$/.test(text.trim())) return "smile";
  return null;
}
const _drawDialogPortraitBase = drawDialogPortrait;
drawDialogPortrait = function (d, talking) {
  _drawDialogPortraitBase(d, talking);
  if (!d || !d.look || d.look.enemy) return;
  const em = lineEmotion(d.lines[d.i][1]);
  const cv = byId("dport");
  const c2 = cv.getContext("2d");
  if (!em) return;
  withContext(c2, () => {
    const s = 2.6,
      bob = Math.sin(game.t * 6) * 1.5;
    c2.fillStyle = "#fff3d6";
    c2.beginPath();
    c2.arc(cv.width - 14, 14 + bob, 13, 0, 7);
    c2.fill();
    c2.strokeStyle = "#f2c14e";
    c2.lineWidth = 2;
    c2.stroke();
    drawPixelIcon(em, cv.width - 14, 14 + bob, s);
  });
};

/* ===================== 5. CONQUISTAS ===================== */

const ACHIEVEMENTS = [
  ["passos", "Primeiros passos", "Termine o tutorial.", "star", () => player.tutDone],
  ["amigo", "Bom de papo", "Fique amigo (2 corações) de alguém.", "smile", () => Object.keys(FRIENDS).some((id) => friendshipLevel(id) >= 2)],
  ["melhor", "Melhor amigo", "Tenha um melhor amigo (3 corações).", "heart", () => Object.keys(FRIENDS).some((id) => friendshipLevel(id) >= 3)],
  ["turma", "Da turma", "Fique amigo dos cinco da turma de Cinzaluz.", "party", () => typeof CREW !== "undefined" && CREW.every((id) => friendshipLevel(id) >= 1)],
  ["namoro", "Coração ocupado", "Comece um namoro.", "heart", () => !!(player.dating || player.spouse)],
  ["casado", "Felizes para sempre", "Case-se.", "ring", () => !!player.spouse],
  ["realeza", "Sangue azul", "Case-se com a Rainha.", "crown", () => player.spouse === "rainha"],
  ["filho", "Família cresceu", "Tenha um filho.", "baby", () => (player.kids || []).length > 0],
  ["tresfilhos", "Casa cheia", "Tenha três filhos.", "house", () => (player.kids || []).length >= 3],
  ["rico", "Bolsos cheios", "Junte 1000 de ouro.", "coin", () => player.gold >= 1000],
  ["milionario", "Magnata de Aurélia", "Junte 10000 de ouro.", "crown", () => player.gold >= 10000],
  ["mansao", "Vida de rico", "More numa Mansão.", "house", () => typeof homeTier === "function" && homeTier() === "mansao"],
  ["casas", "Dono de imóveis", "Tenha três casas.", "house", () => (player.houses || []).length >= 3],
  ["mineiros", "Herói de Pedravale", "Resgate os 3 mineiros da mina.", "pick", () => player.q && player.q.mina && player.q.mina.st === 2],
  ["farol", "Guardião da luz", "Conserte o Farol de Brisamar.", "sun", () => player.q && player.q.farol && player.q.farol.st === 2],
  ["resgate", "Amigo dos bichos", "Resgate um animal para a Júlia.", "paw", () => (player.rescues || 0) >= 1],
  ["resgate5", "Veterinário honorário", "Resgate cinco animais.", "paw", () => (player.rescues || 0) >= 5],
  ["guardiao", "Primeira runa", "Vença um Guardião.", "skull", () => (player.guards || []).length >= 1],
  ["guardioes", "Mestre das runas", "Vença os cinco Guardiões.", "staff", () => (player.guards || []).length >= 5],
  ["heroi", "Coração de herói", "Faça 5 escolhas de herói.", "heart", () => (player.heroPts || 0) >= 5],
  ["vilao", "Lado sombrio", "Faça 5 escolhas de vilão.", "skull", () => (player.villain || 0) >= 5],
  ["fimheroi", "A Canção voltou", "Termine a história como herói.", "note", () => player.finished && !player.villainEnd],
  ["fimvilao", "Fim sombrio", "Termine a história como vilão.", "skull", () => player.finished && !!player.villainEnd],
  ["pao", "Padeiro de mão cheia", "Asse 10 pães em casa.", "bread", () => (player.breadBaked || 0) >= 10],
  ["mineiro", "Picareta afiada", "Quebre 30 pedras na mina.", "pick", () => (player.mined || 0) >= 30],
  ["cacador", "Caçador da Floresta", "Vença 10 animais na Floresta Grande.", "sword", () => (player.huntKills || 0) >= 10],
  ["colecao", "Colecionador", "Tenha 50 itens diferentes na bolsa ao mesmo tempo.", "bag", () => Object.keys(player.inv || {}).filter((k) => itemCount(k) > 0).length >= 50],
  ["moveis", "Decorador", "Tenha 15 móveis em casa.", "chair", () => (player.furn || []).length >= 15],
  ["mascote", "Melhor amigo de quatro patas", "Adote um mascote.", "paw", () => (player.pets || []).length > 0],
  ["fama", "Amado pela vila", "Chegue a 90 de reputação.", "star", () => (player.rep ?? 50) >= 90],
  ["dia30", "Morador antigo", "Chegue ao dia 30.", "clock", () => player.day >= 30],
  ["idoso", "Cabelos brancos", "No Simulador, chegue aos 60 anos.", "clock", () => lifeMode() && (player.age || 0) >= 60],
];
function achTick() {
  if (game.mode === "title" || !player.name) return;
  player.ach = player.ach || {};
  for (const [id, n, , icon, ok] of ACHIEVEMENTS) {
    if (player.ach[id]) continue;
    let got = false;
    try {
      got = !!ok();
    } catch (e) {}
    if (!got) continue;
    player.ach[id] = player.day;
    saveGame();
    showAchToast(n, icon);
    break;
  }
}
setInterval(achTick, 2000);
function showAchToast(n, icon) {
  let el = byId("achtoast");
  if (!el) {
    el = document.createElement("div");
    el.id = "achtoast";
    el.className = "ui";
    byId("screen").appendChild(el);
  }
  el.innerHTML = `<span class="ach-ic">${iconHTML(icon, 26)}</span><div><small>Conquista desbloqueada!</small><b>${n}</b></div>`;
  el.classList.remove("show");
  void el.offsetWidth;
  el.classList.add("show");
  playSound(784, 0.12, "sine");
  setTimeout(() => playSound(1047, 0.12, "sine"), 120);
  setTimeout(() => playSound(1319, 0.2, "sine"), 240);
}
function openAch() {
  if (!["world", "title"].includes(game.mode)) return;
  let el = byId("achs");
  if (!el) {
    el = document.createElement("div");
    el.id = "achs";
    el.className = "box ui ov";
    byId("screen").appendChild(el);
  }
  game.achPrev = game.mode;
  game.mode = "achs";
  const got = player.ach || {};
  const n = ACHIEVEMENTS.filter(([id]) => got[id]).length;
  el.innerHTML = `<div class="gh"><h2>Conquistas</h2><button id="achclose">Fechar (U)</button></div>
    <div class="ach-sum">${iconHTML("crown", 18)} <b>${n}</b> de ${ACHIEVEMENTS.length} conquistas<span class="st-bar"><i style="width:${(n / ACHIEVEMENTS.length) * 100}%"></i></span></div>
    <div class="ach-grid">${ACHIEVEMENTS.map(
      ([id, nm, d, icon]) => `<div class="ach ${got[id] ? "on" : ""}"><span class="ach-ic">${iconHTML(got[id] ? icon : "lock", 26)}</span><div><b>${nm}</b><small>${d}${got[id] ? ` · dia ${got[id]}` : ""}</small></div></div>`,
    ).join("")}</div>`;
  el.style.display = "block";
  byId("achclose").onclick = closeAch;
}
function closeAch() {
  const el = byId("achs");
  if (el) el.style.display = "none";
  game.mode = game.achPrev || "world";
}
KEY_HANDLERS.achs = (k) => (k === "escape" || k === "u") && closeAch();
WORLD_SHORTCUTS.u = openAch;
BEFORE_DIALOG.add("achs");
BEFORE_DIALOG.add("svs");

/* ===================== 6. MAPA DO MUNDO ===================== */

const WORLD_NODE_ICON = { vila: "house", porto: "fish", serra: "pick", floresta: "axe", bosque: "herb", pantano: "fog", picos: "storm", torre: "skull", mina: "gem", academia: "book" };
const WORLD_SHORT = { vila: "Cinzaluz", bosque: "Bosque", pantano: "Pântano", porto: "Porto Brisamar", serra: "Pedravale", picos: "Picos Uivantes", torre: "Torre do Silêncio", mina: "Mina", floresta: "Floresta Grande", academia: "Academia" };
function worldLayout() {
  const pos = { vila: [0, 0] },
    q = ["vila"];
  const D = { n: [0, -1], s: [0, 1], e: [1, 0], w: [-1, 0] };
  while (q.length) {
    const z = q.shift();
    const def = ZONE_DEFS[z];
    if (!def) continue;
    let ex = Object.entries(def.exits || {});
    if (lifeMode() && z === "vila") ex = [["e", "porto"], ["n", "serra"], ["w", "floresta"]];
    if (!lifeMode() && z === "vila") ex = ex.concat([["e2", "porto"], ["n2", "serra"]]);
    for (const [dir, to] of ex) {
      if (!ZONES[to] || pos[to] || (lifeMode() && !["porto", "serra", "floresta"].includes(to))) continue;
      const d = D[dir[0]] || [1, 1];
      const [x, y] = pos[z];
      let p = [x + d[0] * (dir.length > 1 ? 1.9 : 1.25), y + d[1] * (dir.length > 1 ? 1.5 : 1) + (dir.length > 1 ? 0.75 : 0)];
      while (Object.values(pos).some(([a, b]) => Math.abs(a - p[0]) < 0.6 && Math.abs(b - p[1]) < 0.6)) p = [p[0] + 0.7, p[1] + 0.35];
      pos[to] = p;
      q.push(to);
    }
  }
  if (pos.serra && !pos.mina && !lifeMode()) pos.mina = [pos.serra[0] + 0.9, pos.serra[1] - 0.5];
  return pos;
}
function drawWorldMap(t) {
  ctx.fillStyle = "rgba(8,5,14,.85)";
  ctx.fillRect(0, 0, viewWidth, 480);
  const W = Math.min(620, viewWidth - 40),
    H = 360,
    ox = viewWidth / 2 - W / 2,
    oy = 70;
  // Pergaminho
  ctx.fillStyle = "#e8d6a8";
  ctx.fillRect(ox, oy, W, H);
  ctx.fillStyle = "#d4c08a";
  for (let i = 0; i < 40; i++) ctx.fillRect(ox + ((i * 97) % W), oy + ((i * 53) % H), 3, 2);
  ctx.strokeStyle = "#8a5a2e";
  ctx.lineWidth = 4;
  ctx.strokeRect(ox, oy, W, H);
  ctx.fillStyle = "#5a3a1a";
  ctx.font = '700 20px "Pixelify Sans", sans-serif';
  ctx.textAlign = "center";
  ctx.fillText(lifeMode() ? "Reinos de Aurélia" : "O Mundo de Cinzaluz", viewWidth / 2, oy - 14);
  const pos = worldLayout();
  const xs = Object.values(pos).map((p) => p[0]),
    ys = Object.values(pos).map((p) => p[1]);
  const minX = Math.min(...xs),
    maxX = Math.max(...xs),
    minY = Math.min(...ys),
    maxY = Math.max(...ys);
  const sc = Math.min((W - 140) / Math.max(1, maxX - minX), (H - 110) / Math.max(1, maxY - minY));
  const P = (z) => [ox + 70 + (pos[z][0] - minX) * sc + (W - 140 - (maxX - minX) * sc) / 2, oy + 55 + (pos[z][1] - minY) * sc + (H - 110 - (maxY - minY) * sc) / 2];
  // Caminhos
  ctx.setLineDash([6, 5]);
  ctx.lineWidth = 3;
  for (const z of Object.keys(pos)) {
    const def = ZONE_DEFS[z];
    const outs = Object.values((def && def.exits) || {}).concat(z === "vila" ? ["porto", "serra"] : z === "serra" ? ["mina"] : []);
    for (const to of outs) {
      if (!pos[to]) continue;
      const [a, b] = P(z),
        [c, d] = P(to);
      const war = lifeMode() && typeof atWar === "function" && ((z === "vila" && to === "porto" && atWar("aurelia", "mares")) || (z === "vila" && to === "serra" && atWar("aurelia", "serra")));
      ctx.strokeStyle = war ? "#c9302a" : "#8a6a3a";
      ctx.beginPath();
      ctx.moveTo(a, b);
      ctx.lineTo(c, d);
      ctx.stroke();
    }
  }
  ctx.setLineDash([]);
  for (const z of Object.keys(pos)) {
    const [x, y] = P(z);
    const seen = player.visited.includes(z) || z === "vila";
    const here = player.zone === z || (player.zone === "casa" && z === "vila") || (player.zone === "interior" && z === (player.ret && player.ret.zone));
    ctx.fillStyle = seen ? "#f6ecd0" : "#c9b88a";
    ctx.beginPath();
    ctx.arc(x, y, 24, 0, 7);
    ctx.fill();
    ctx.strokeStyle = here ? "#c9302a" : "#5a3a1a";
    ctx.lineWidth = here ? 4 : 2;
    ctx.stroke();
    if (seen) drawPixelIcon(WORLD_NODE_ICON[z] || "flag", x, y, 3);
    else {
      ctx.fillStyle = "#8a7a5a";
      ctx.font = '700 22px "Pixelify Sans", sans-serif';
      ctx.fillText("?", x, y + 8);
    }
    ctx.fillStyle = "#3a2414";
    ctx.font = '700 12px "Pixelify Sans", sans-serif';
    ctx.fillText(seen ? WORLD_SHORT[z] || (ZONE_DEFS[z] && ZONE_DEFS[z].nome) || z : "???", x, y + 40);
    if (here) {
      ctx.fillStyle = "#c9302a";
      const b = Math.abs(Math.sin(t * 4)) * 4;
      ctx.beginPath();
      ctx.moveTo(x, y - 28 - b);
      ctx.lineTo(x - 7, y - 40 - b);
      ctx.lineTo(x + 7, y - 40 - b);
      ctx.fill();
    }
  }
  ctx.fillStyle = "#cbbfe3";
  ctx.font = '13px "VT323", monospace';
  ctx.fillText("Tab: mapa da região · M ou Esc: fechar", viewWidth / 2, oy + H + 26);
}
const _drawMinimapBase = drawMinimap;
drawMinimap = function (big, t) {
  if (big && game.worldMap) return drawWorldMap(t);
  _drawMinimapBase(big, t);
  if (big) {
    ctx.fillStyle = "#cbbfe3";
    ctx.font = '13px "VT323", monospace';
    ctx.textAlign = "center";
    ctx.fillText("Tab: mapa do mundo", viewWidth / 2, 462);
  }
};
{
  const mapBase = KEY_HANDLERS.map;
  KEY_HANDLERS.map = (k, e) => {
    if (k === "tab") {
      e.preventDefault();
      game.worldMap = !game.worldMap;
      playSound(520, 0.05, "sine");
      return;
    }
    mapBase(k, e);
  };
}

/* ===================== 7. CELULAR: SEGURAR O DEDO ===================== */

{
  const cv = byId("cv");
  let timer = null;
  cv.addEventListener(
    "touchstart",
    (e) => {
      if (game.mode !== "world" || e.touches.length !== 1) return;
      const tch = e.touches[0];
      timer = setTimeout(() => {
        timer = null;
        cv.dispatchEvent(new MouseEvent("click", { clientX: tch.clientX, clientY: tch.clientY, bubbles: true }));
        if (navigator.vibrate) navigator.vibrate(25);
      }, 420);
    },
    { passive: true },
  );
  const cancel = () => timer && (clearTimeout(timer), (timer = null));
  cv.addEventListener("touchend", cancel, { passive: true });
  cv.addEventListener("touchmove", cancel, { passive: true });
}

/* ===================== 8. EVENTOS DA TURMA ===================== */

const CREW_BDAY = { lucas: 5, matheus: 9, marcos: 13, andressa: 17, mylena: 21, juliaO: 25 };
function yearDay() {
  return ((player.day - 1) % 28) + 1;
}
function birthdayToday() {
  return Object.keys(CREW_BDAY).find((id) => CREW_BDAY[id] === yearDay()) || null;
}
function exhibitionToday() {
  return player.day % 7 === 3;
}
function lucasWeddingDay() {
  return player.lucasWed && player.lucasWed === player.day;
}
const _crewGatheringBase = crewGathering;
crewGathering = function () {
  const h = currentHour();
  if ((birthdayToday() || lucasWeddingDay()) && h >= 18 && h < 22) return true;
  return _crewGatheringBase();
};
const _onNewDayBase = onNewDay;
onNewDay = function () {
  _onNewDayBase.apply(this, arguments);
  const b = birthdayToday();
  if (b) setTimeout(() => toast(`Hoje é aniversário de ${crewName(b)}! Festa na fonte às 18h. Presentes valem o dobro.`, 5200), 5200);
  if (exhibitionToday()) setTimeout(() => toast("Exposição no Ateliê da Mylena hoje! Quadros raros até as 17h.", 4800), 7400);
  // O Lucas sossega: se você não namora com ele e é amigo dele, ele marca o casamento.
  if (!player.lucasWed && player.day >= 20 && friendship("lucas") >= 50 && !isRomanticWith("lucas")) {
    player.lucasWed = player.day + 2;
    setTimeout(() => toast("Notícia bomba: o Lucas Marzocca vai casar com a Florista Bia daqui a 2 dias! A vila não acredita.", 6000), 8800);
  }
  if (player.lucasWed && player.day === player.lucasWed + 1) {
    const i = ROMANCE.indexOf("lucas");
    if (i >= 0) ROMANCE.splice(i, 1);
  }
};
const _crewItemsBase = crewItems;
crewItems = function (id) {
  const items = _crewItemsBase(id);
  if (birthdayToday() === id && player.famDay["bday" + id] !== player.day)
    items.unshift({
      t: "Dar parabéns 🎂",
      icon: "cake",
      fn: () => {
        player.famDay["bday" + id] = player.day;
        addFriendship(id, 10);
        saveGame();
        say([
          ["Você", "Feliz aniversário!"],
          [crewName(id), pickOne(["Você lembrou! Que coisa boa. Vem pra festa na fonte hoje à noite!", "Ah, para! Tô ficando velho. Mas obrigado, de coração."])],
        ]);
      },
    });
  if (id === "lucas" && lucasWeddingDay() && player.famDay.lucasWedGo !== player.day)
    items.unshift({
      t: "Ir ao casamento do Lucas 💍",
      icon: "ring",
      fn: () => {
        player.famDay.lucasWedGo = player.day;
        for (const c of CREW) addFriendship(c, 4);
        if (lifeMode()) addNeed("fun", 40);
        player.clock = Math.min(1439, player.clock + 120);
        game.fade = 1;
        saveGame();
        say([
          ["", "O Templo está cheio de flores. O Matheus chora de soluçar no primeiro banco."],
          ["Lucas Marzocca", "Eu, o rei das festas, casando. Quem diria? A Bia me pegou pelo coração... e pela torta de amora."],
          ["Mylena", "Eu prometi pintar o retrato se durasse uma semana. Vou começar já, por via das dúvidas!"],
          ["", "A turma inteira dança até de madrugada. Amizade com todos +4."],
        ]);
      },
    });
  return items;
};
const _crewDoorBase = crewDoor;
crewDoor = function (b) {
  if (b && b.id === "atelie" && exhibitionToday() && currentHour() >= 7 && currentHour() < 17 && !player.famDay.expo) {
    player.famDay.expo = player.day;
    say(
      [
        ["Mylena", "Bem-vindo à exposição! Hoje tem quadro que só existe um no mundo inteiro."],
        ["", "As paredes do Ateliê estão cheias de pinturas da vila, do mar e da turma."],
      ],
      () => openShop("atelie"),
    );
    if (lifeMode()) addNeed("fun", 15);
    return true;
  }
  return _crewDoorBase(b);
};
// Quadro exclusivo da exposição.
ITEMS.m_obra = { nome: "Obra-Prima da Exposição", tipo: "movel", preco: 600, desc: "Móvel. Só existe um: a turma inteira pintada pela Mylena.", gicon: gIcon("painting", "#c94a8b", "#f2c14e", 1), cat: "Móveis" };
CATALOG.push("m_obra");
const _shopAllBase = shopAll;
shopAll = function () {
  const l = _shopAllBase();
  if (game.shopId === "atelie" && game.shopTab === "buy" && exhibitionToday() && !l.includes("m_obra") && !itemCount("m_obra")) return ["m_obra", ...l];
  return l;
};

/* ===================== 9. RESGATES DA CLÍNICA ===================== */

const RESCUE_ANIMALS = [
  ["um filhote de raposa", "#e8702a"],
  ["um gatinho", "#8a8a8a"],
  ["um cachorrinho", "#d9a441"],
  ["uma corujinha", "#8a6a4a"],
  ["um coelhinho", "#f2eee4"],
];
function rescueZone() {
  return lifeMode() ? "floresta" : "bosque";
}
function startRescue() {
  if (player.famDay.rescue === player.day) return say([["Júlia Oliveira", "Já teve resgate hoje! Os bichinhos agradecem. Volte amanhã."]]);
  const z = ZONES[rescueZone()];
  const spots = (z.spawn || []).filter(([x, y]) => walkable(rescueZone(), x, y));
  const [x, y] = spots.length ? spots[Math.floor(Math.random() * spots.length)] : [10, 10];
  const [nm, col] = pickOne(RESCUE_ANIMALS);
  player.q = player.q || {};
  player.q.rescue = { zone: rescueZone(), x, y, nm, col, st: 1 };
  player.famDay.rescue = player.day;
  saveGame();
  say([
    ["Júlia Oliveira", `Um caçador viu ${nm} machucado ${lifeMode() ? "na Floresta Grande" : "no Bosque Murmurante"}. Pode ir buscar? Siga a seta e aperte E nele.`],
    ["Júlia Oliveira", "Traga com cuidado até a clínica. Eu cuido do resto!"],
  ]);
}
function rescueAt(x, y) {
  const r = player.q && player.q.rescue;
  return r && r.st === 1 && player.zone === r.zone && r.x === x && r.y === y ? r : null;
}
const _questLabelBase = questLabel;
questLabel = function (x, y) {
  const r = rescueAt(x, y);
  return r ? `Pegar ${r.nm} no colo` : _questLabelBase(x, y);
};
const _questInteractBase = questInteract;
questInteract = function (x, y) {
  const r = rescueAt(x, y);
  if (!r) return _questInteractBase(x, y);
  r.st = 2;
  saveGame();
  playSound(880, 0.12, "sine");
  say([["", `Você enrola ${r.nm} no seu manto. Ele treme, mas encosta a cabecinha em você. Leve para a Clínica da Júlia!`]]);
  return true;
};
const _trappedTargetBase = trappedTarget;
trappedTarget = function () {
  const r = player.q && player.q.rescue;
  if (r && r.st === 1 && player.zone === r.zone) return { x: r.x, y: r.y };
  if (r && r.st === 2 && player.zone === "vila") {
    const b = CREW_BUILDINGS.find((q) => q.id === "clinica");
    return { x: b.door[0], y: b.y + b.h };
  }
  return _trappedTargetBase();
};
const _questDrawListBase = questDrawList;
questDrawList = function (list, t) {
  _questDrawListBase(list, t);
  const r = player.q && player.q.rescue;
  if (!r || r.st !== 1 || player.zone !== r.zone) return;
  list.push({
    y: r.y,
    draw: () => {
      const X = r.x * TILE,
        Y = r.y * TILE;
      ctx.fillStyle = "rgba(0,0,0,.25)";
      ctx.beginPath();
      ctx.ellipse(X + 16, Y + 28, 9, 3, 0, 0, 7);
      ctx.fill();
      ctx.fillStyle = r.col;
      ctx.fillRect(X + 8, Y + 16 + Math.sin(t * 8) * 0.6, 16, 10);
      ctx.fillRect(X + 18, Y + 10, 9, 8);
      ctx.fillRect(X + 19, Y + 7, 2, 3);
      ctx.fillRect(X + 24, Y + 7, 2, 3);
      ctx.fillStyle = "#1a1222";
      ctx.fillRect(X + 22, Y + 13, 2, 2);
      ctx.fillStyle = "#e0303a";
      ctx.fillRect(X + 10, Y + 18, 5, 2);
      drawPixelIcon("sweat", X + 16, Y - 2 - Math.abs(Math.sin(t * 4)) * 3, 2);
    },
  });
};
const _vetMenuBase = vetMenu;
vetMenu = function () {
  const r = player.q && player.q.rescue;
  if (r && r.st === 2) {
    r.st = 3;
    player.rescues = (player.rescues || 0) + 1;
    player.gold += 80;
    repAdd(4);
    addFriendship("juliaO", 6);
    saveGame();
    return say([
      ["Júlia Oliveira", `Ah, coitadinho! Deixa comigo... *enfaixa a patinha* Pronto. ${r.nm[0].toUpperCase() + r.nm.slice(1)} vai ficar bem.`],
      ["Júlia Oliveira", "Tome 80 de ouro. E se quiser adotar alguém, o Abrigo está de portas abertas!"],
      ["", `Resgates feitos: ${player.rescues}. Reputação +4.`],
    ]);
  }
  _vetMenuBase();
  // Acrescenta a missão de resgate no menu da clínica.
  if (game.choice && game.mode === "choice")
    game.choice.splice(game.choice.length - 1, 0, { t: "Missão de resgate de animal", icon: "paw", fn: startRescue }),
      choice("Clínica Veterinária da Júlia", '"Bem-vindo! Aqui todo bicho é tratado como da família."', game.choice);
};

/* ===================== BOTÕES NOVOS ===================== */
{
  const sb = document.querySelector("#title .small-btns");
  if (sb) {
    const b = document.createElement("button");
    b.textContent = "Conquistas";
    b.onclick = () => (game.mode === "title" ? openAch() : null);
    sb.insertBefore(b, sb.lastElementChild);
  }
  const small = document.querySelector("#touch .small");
  if (small) {
    const b = document.createElement("button");
    b.textContent = "Troféus";
    b.addEventListener("click", () => game.mode === "world" && openAch());
    small.appendChild(b);
  }
}
const _renderOptionsBase = renderOptions;
renderOptions = function () {
  _renderOptionsBase();
  const g = byId("optGuide");
  if (g && !byId("optAch")) {
    const b = document.createElement("button");
    b.id = "optAch";
    b.textContent = "Conquistas";
    b.onclick = () => {
      closeOptions();
      openAch();
    };
    g.parentNode.appendChild(document.createTextNode(" "));
    g.parentNode.appendChild(b);
  }
};

/* ======================================================================
   (antes: 35-criador.js)
   ====================================================================== */

/**
 * ECOS DO ARCANO — 19-melhorias-e-criador.js
 * Criador de personagem completo (criação e guarda-roupa):
 *  - Barra lateral com ícones: Perfil, Rosto, Cabelo, Chapéu, Roupa, Acessórios, Cajado.
 *  - Abas dentro de cada parte (ex.: Cabelo → Penteado | Cor).
 *  - Grade de miniaturas: cada opção aparece já desenhada no seu personagem.
 *  - Fileira de cores com "+" para escolher qualquer cor (na criação).
 *  - Personagem grande à direita, com poses (Frente, Lado, Costas, Andando).
 *  - No guarda-roupa, o que você ainda não tem aparece com cadeado e preço.
 */


const CC_SECTIONS = [
  { k: "perfil", n: "Perfil", ic: "chat", only: "new" },
  { k: "origem", n: "Origem", ic: "crown", only: "new", life: true },
  { k: "jeito", n: "Jeito", ic: "heart" },
  // [parte, nome, cor que aparece em cima]: em cima as cores, embaixo os formatos.
  { k: "rosto", n: "Rosto", ic: "eye", subs: [["face", "Rosto e pele", "skin"], ["eyeshape", "Olhos", "eyes"]] },
  { k: "cabelo", n: "Cabelo", ic: "hair", subs: [["hstyle", "Penteado", "hair"]] },
  { k: "chapeu", n: "Chapéu", ic: "hat", subs: [["hat", "Chapéu", "hatc"]] },
  { k: "roupa", n: "Roupa", ic: "shirt", subs: [["outfit", "Roupa", "robe"]] },
  { k: "acess", n: "Acessórios", ic: "glasses", subs: [["acc", "Acessório"], ["aura", "Aura"]] },
  { k: "cajado", n: "Cajado", ic: "staff", subs: [["staffs", "Cajado", "staffc"]], story: true },
];
const CC_COLOR = new Set(["skin", "eyes", "hair", "hatc", "robe", "staffc"]);
const CC_BODY = new Set(["outfit", "robe", "staffc", "aura", "staffs"]);
/* Formatos e detalhes novos (de graça na criação; no guarda-roupa alguns custam ouro). */
Object.assign(COSMETICS, {
  face: [
    ["nenhum", "Liso", 0],
    ["bochechas", "Bochechas rosadas", 0],
    ["sardas", "Sardas", 0],
    ["pinta", "Pinta", 0],
    ["sorriso", "Sorriso", 0],
    ["olheiras", "Olheiras", 0],
    ["cicatriz", "Cicatriz", 0],
    ["barba", "Barba", 0],
    ["cavanhaque", "Cavanhaque", 0],
    ["bigode", "Bigode", 0],
    ["batom", "Batom", 0],
    ["guerra", "Pintura de guerra", 0],
  ],
  eyeshape: [
    ["ponto", "Simples", 0],
    ["grandes", "Grandes", 0],
    ["cilios", "Com cílios", 0],
    ["sobrancelhas", "Sobrancelhas", 0],
    ["sonolentos", "Sonolentos", 0],
    ["bravos", "Bravos", 0],
    ["fechados", "Sorridentes", 0],
    ["brilho", "Brilhantes", 0],
  ],
  staffs: [
    ["reto", "Reto", 0],
    ["galho", "Galho", 0],
    ["espiral", "Espiral dourada", 0],
    ["lua", "Lua crescente", 0],
    ["estrela", "Estrela", 0],
    ["duplo", "Duplo cristal", 0],
  ],
});
for (const k of ["face", "eyeshape", "staffs"]) COSMETIC_ICONS[k] = { face: "smile", eyeshape: "eye", staffs: "staff" }[k];
const CC_POSES = [
  ["down", "Frente"],
  ["right", "Lado"],
  ["up", "Costas"],
  ["walk", "Andando"],
];

/** Só a cabeça e os ombros, grandes (para as miniaturas de rosto, cabelo e chapéu). */
function drawBust(cv, L) {
  const c2 = cv.getContext("2d");
  c2.clearRect(0, 0, cv.width, cv.height);
  const u = Math.floor(cv.width / 11);
  const ox = Math.round(cv.width / 2 - 8 * u),
    oy = Math.round(cv.height - 12.2 * u);
  for (const [x, y, w, h, col] of heroRects(L, "down", null)) {
    if (y > 11) continue;
    c2.fillStyle = col;
    c2.fillRect(ox + x * u, oy + y * u, w * u, Math.min(h, 12 - y) * u);
  }
}
/** Personagem inteiro numa pose (com passos para "Andando"). */
function drawPose(cv, L, pose, t) {
  const c2 = cv.getContext("2d");
  c2.clearRect(0, 0, cv.width, cv.height);
  const dir = pose === "walk" ? "right" : pose;
  const fr = pose === "walk" ? 1 + (Math.floor(t * 6) % 2) : 0;
  const u = Math.floor(cv.width / 18);
  const ox = (cv.width - 16 * u) / 2,
    oy = cv.height - 16 * u - 10 - (pose === "walk" ? Math.abs(Math.sin(t * 12)) * u * 0.4 : 0);
  c2.fillStyle = "rgba(0,0,0,.28)";
  c2.beginPath();
  c2.ellipse(cv.width / 2, cv.height - 12, cv.width / 3.2, 7, 0, 0, 7);
  c2.fill();
  if (L.aura && L.aura !== "nenhuma") {
    const g = c2.createRadialGradient(cv.width / 2, cv.height * 0.55, 4, cv.width / 2, cv.height * 0.55, cv.width * 0.45);
    g.addColorStop(0, "rgba(255,240,160,.35)");
    g.addColorStop(1, "rgba(255,240,160,0)");
    c2.fillStyle = g;
    c2.fillRect(0, 0, cv.width, cv.height);
  }
  for (const [x, y, w, h, col] of heroRects(L, dir, lifeMode() ? null : L.staffc || "#ffe066", fr)) {
    c2.fillStyle = col;
    c2.fillRect(ox + (dir === "left" ? 16 - x - w : x) * u, oy + y * u, w * u, h * u);
  }
}

function ccAvail(cat) {
  const owned = (o) => (game.lookMode === "new" ? o[2] === 0 : cosOwned(cat, o[0]));
  return (COSMETICS[cat] || []).filter((o) => o[2] < 9999 || owned(o)).map((o) => ({ id: o[0], n: o[1], pr: o[2], ok: owned(o) }));
}
function renderCreate() {
  const L = game.lookDraft,
    mode = game.lookMode;
  L.eyes = L.eyes || "#222222";
  L.acc = L.acc || "nenhum";
  L.staffc = L.staffc || "#ffe066";
  L.aura = L.aura || "nenhuma";
  // Sardas e bigode agora são do rosto (não acessórios).
  if (L.acc === "sardas" || L.acc === "bigode") (L.face = L.acc), (L.acc = "nenhum");
  L.hatc = L.hatc || "#2a2f6e";
  const secs = CC_SECTIONS.filter((s) => (!s.only || s.only === mode) && !(s.story && lifeMode()) && !(s.life && !lifeMode()));
  if (!secs.some((s) => s.k === game.ccTab)) game.ccTab = secs[0].k;
  const sec = secs.find((s) => s.k === game.ccTab);
  const subs = sec.subs || [];
  if (!subs.some((s) => s[0] === game.ccSub)) game.ccSub = subs[0] ? subs[0][0] : null;
  const cat = game.ccSub;
  const colKey = ((subs.find((q) => q[0] === cat) || [])[2]) || (CC_COLOR.has(cat) ? cat : null);
  game.ccPose = game.ccPose || "down";

  let panel = "";
  if (sec.k === "perfil") {
    panel = `<div class="cc-prof">
      <label>${iconHTML("scroll", 18)}<span>Nome</span><input id="cname" maxlength="12" value="${(game.draftName || "").replace(/"/g, "")}" autocomplete="off" placeholder="Seu nome"></label>
      <div class="cc-lbl">${iconHTML("heart", 18)}<span>Gênero</span></div>
      <div class="cc-seg">${[
        ["m", "Masculino", "smile"],
        ["f", "Feminino", "flower"],
        ["n", "Prefiro não dizer", "star"],
      ]
        .map(([k, n, ic]) => `<button data-gen="${k}" class="${game.draftGender === k ? "on" : ""}">${iconHTML(ic, 18)}${n}</button>`)
        .join("")}</div>
      <div class="cc-lbl">${iconHTML("skull", 18)}<span>Dificuldade</span></div>
      <div class="cc-difs">${Object.entries(DIFFICULTIES)
        .map(([k, d]) => `<button data-dif="${k}" class="${(game.draftDiff || "normal") === k ? "on" : ""}"><b>${d.n}</b><small>${d.desc}</small></button>`)
        .join("")}</div>
    </div>`;
  } else if (sec.k === "origem" && typeof ccOriginPanel === "function") {
    panel = ccOriginPanel();
  } else if (sec.k === "jeito") {
    const tr = game.draftTraits || [];
    const g = game.draftGender === "f" ? "f" : "m";
    panel = `<div class="cc-prof">
      <div class="cc-lbl">${iconHTML("smile", 18)}<span>Personalidade <small>(escolha até 3)</small></span></div>
      <div class="cc-traits">${Object.entries(TRAITS)
        .map(([k, d]) => `<button data-trait="${k}" class="${tr.includes(k) ? "on" : ""}" title="${d.d}">${iconHTML(d.ic, 18)}<b>${traitName(k, g)}</b><small>${d.d}</small></button>`)
        .join("")}</div>
      <div class="cc-lbl">${iconHTML("heart", 18)}<span>De quem você gosta</span></div>
      <div class="cc-seg cc-or">${Object.entries(ORIENTS)
        .map(([k, d]) => `<button data-orient="${k}" class="${(game.draftOrient || "bi") === k ? "on" : ""}" title="${d.d}">${d.n}<small>${d.d}</small></button>`)
        .join("")}</div>
      <div class="cc-note">${iconHTML("star", 14)} Seus traços dão bônus nas interações que combinam com eles. A orientação muda quem flerta com você (e quem você pode namorar).</div>
    </div>`;
  } else {
    const opts = ccAvail(cat);
    const COLN = { skin: "Cor da pele", eyes: "Cor dos olhos", hair: "Cor do cabelo", hatc: "Cor do chapéu", robe: "Cor da roupa", staffc: "Cor do cristal" };
    const palette = colKey
      ? `<div class="cc-lbl cc-pl">${iconHTML("sparkle", 14)}<span>${COLN[colKey] || "Cor"}</span></div><div class="cc-pal">${ccAvail(colKey)
          .filter((o) => o.ok)
          .map((o) => `<button class="cc-sw ${L[colKey] === o.id ? "on" : ""}" data-pick="${o.id}" style="background:${o.id}" title="${o.n}"></button>`)
          .join("")}<label class="cc-sw plus ${mode === "new" ? "" : "off"}" title="${mode === "new" ? "Escolher qualquer cor" : "Cores livres só na criação. Compre tinturas no Salão e na Alfaiataria."}">+<input type="color" id="ccolor" value="${/^#[0-9a-f]{6}$/i.test(L[colKey]) ? L[colKey] : "#888888"}" ${mode === "new" ? "" : "disabled"}></label></div><div class="cc-lbl cc-pl">${iconHTML("star", 14)}<span>${{ face: "Detalhes do rosto", eyeshape: "Formato dos olhos", hstyle: "Penteado", hat: "Modelo", outfit: "Modelo", staffs: "Formato do cajado" }[cat] || "Modelo"}</span></div>`
      : "";
    const tiles = (CC_COLOR.has(cat) ? [] : opts)
      .map(
        (o, i) => `<button class="cc-tile ${L[cat] === o.id ? "on" : ""} ${o.ok ? "" : "lock"}" data-opt="${i}" title="${o.n}">
        <canvas width="84" height="84" data-th="${i}"></canvas>
        <span>${o.n || ""}</span>${o.ok ? "" : `<em>${iconHTML("lock", 12)}${o.pr} ouro</em>`}
      </button>`,
      )
      .join("");
    panel = `${palette}<div class="cc-grid">${tiles}</div>${mode === "new" ? "" : `<div class="cc-note">${iconHTML("bag", 14)} O que tem cadeado se compra na Alfaiataria e no Salão Tesoura de Ouro (Cinzaluz) ou na Moda Brisamar (Porto).</div>`}`;
  }

  const el = byId("create");
  el.classList.add("cc");
  el.innerHTML = `<div class="cc-win">
    <div class="cc-side">${secs.map((s) => `<button data-sec="${s.k}" class="${s.k === sec.k ? "on" : ""}" title="${s.n}">${iconHTML(s.ic, 24)}<span>${s.n}</span></button>`).join("")}</div>
    <div class="cc-main">
      <h2>${mode === "new" ? (lifeMode() ? "Crie seu morador" : "Crie seu mago") : "Guarda-roupa"} <small>· ${sec.n}</small></h2>
      ${subs.length > 1 ? `<div class="cc-subs">${subs.map(([k, n]) => `<button data-sub="${k}" class="${k === cat ? "on" : ""}">${n}</button>`).join("")}</div>` : ""}
      <div class="cc-panel">${panel}</div>
    </div>
    <div class="cc-stage">
      <div class="cc-pose"><button data-pose="-1">‹</button><span>${CC_POSES.find((p) => p[0] === game.ccPose)[1]}</span><button data-pose="1">›</button></div>
      <div class="cc-room"><canvas id="pvc" width="220" height="220"></canvas><div class="cc-name">${(game.draftName || player.name || "").trim() || "Aprendiz"}</div></div>
      <div class="cc-btns">
        <button id="crand">${iconHTML("star", 16)}Aleatório</button>
        ${mode === "new" ? "" : '<button id="ccancel">Cancelar</button>'}
        <button id="cgo" class="go">${mode === "new" ? "Começar ▶" : "Salvar visual"}</button>
      </div>
    </div>
  </div>`;
  // Miniaturas
  if (cat) {
    const opts = ccAvail(cat);
    el.querySelectorAll("[data-th]").forEach((cv) => {
      const o = opts[+cv.dataset.th];
      const Lm = Object.assign({}, L, { [cat]: o.id });
      if (cat === "hatc" && L.hat === "nenhum") Lm.hat = "mago";
      if (cat === "hstyle" || cat === "hair" || cat === "face" || cat === "eyeshape") Lm.hat = "nenhum";
      CC_BODY.has(cat) ? drawPose(cv, Lm, "down", 0) : drawBust(cv, Lm);
    });
  }
  // Pose animada
  clearInterval(game.ccAnim);
  const dr = () => byId("pvc") && drawPose(byId("pvc"), L, game.ccPose, game.t || performance.now() / 1000);
  dr();
  game.ccAnim = setInterval(dr, 120);
  // Eventos
  el.querySelectorAll("[data-sec]").forEach((b) => (b.onclick = () => ((game.ccTab = b.dataset.sec), (game.ccSub = null), playSound(520, 0.03, "sine"), renderCreate())));
  el.querySelectorAll("[data-sub]").forEach((b) => (b.onclick = () => ((game.ccSub = b.dataset.sub), renderCreate())));
  el.querySelectorAll("[data-opt]").forEach(
    (b) =>
      (b.onclick = () => {
        const o = ccAvail(cat)[+b.dataset.opt];
        if (!o.ok) return toast(`${o.n}: compre por ${o.pr} ouro na loja de roupas ou no salão.`, 2600);
        L[cat] = o.id;
        playSound(660, 0.04, "sine");
        renderCreate();
      }),
  );
  el.querySelectorAll("[data-pick]").forEach((b) => (b.onclick = () => ((L[colKey || cat] = b.dataset.pick), playSound(700, 0.03, "sine"), renderCreate())));
  const cc = byId("ccolor");
  if (cc) cc.onchange = () => ((L[colKey || cat] = cc.value), renderCreate());
  el.querySelectorAll("[data-pose]").forEach(
    (b) =>
      (b.onclick = () => {
        const i = CC_POSES.findIndex((p) => p[0] === game.ccPose);
        game.ccPose = CC_POSES[(i + +b.dataset.pose + CC_POSES.length) % CC_POSES.length][0];
        renderCreate();
      }),
  );
  const ni = byId("cname");
  if (ni)
    ni.oninput = () => {
      game.draftName = ni.value;
      el.querySelector(".cc-name").textContent = ni.value.trim() || "Aprendiz";
    };
  el.querySelectorAll("[data-gen]").forEach((b) => (b.onclick = () => ((game.draftGender = b.dataset.gen), renderCreate())));
  el.querySelectorAll("[data-trait]").forEach(
    (b) =>
      (b.onclick = () => {
        const k = b.dataset.trait,
          tr = (game.draftTraits = game.draftTraits || []);
        if (tr.includes(k)) tr.splice(tr.indexOf(k), 1);
        else if (tr.length < 3) tr.push(k);
        else toast("No máximo 3 traços.", 1400);
        renderCreate();
      }),
  );
  if (typeof ccOriginBind === "function") ccOriginBind(el);
  el.querySelectorAll("[data-orient]").forEach((b) => (b.onclick = () => ((game.draftOrient = b.dataset.orient), renderCreate())));
  el.querySelectorAll("[data-dif]").forEach((b) => (b.onclick = () => ((game.draftDiff = b.dataset.dif), renderCreate())));
  byId("crand").onclick = () => {
    for (const c of ["hstyle", "hair", "hat", "outfit", "robe", "hatc", "eyes", "acc", "staffc", "face", "eyeshape", "staffs"].concat(mode === "new" ? ["skin"] : [])) {
      const a = ccAvail(c).filter((o) => o.ok);
      if (a.length) L[c] = a[Math.floor(Math.random() * a.length)].id;
    }
    playSound(880, 0.05, "sine");
    renderCreate();
  };
  if (byId("ccancel"))
    byId("ccancel").onclick = () => {
      clearInterval(game.ccAnim);
      byId("create").style.display = "none";
      game.mode = "world";
    };
  byId("cgo").onclick = () => {
    clearInterval(game.ccAnim);
    player.look = JSON.parse(JSON.stringify(L));
    player.traits = (game.draftTraits || []).slice();
    player.orient = game.draftOrient || "bi";
    if (mode === "new") {
      player.name = (game.draftName || "").trim().slice(0, 12) || "Aprendiz";
      player.gender = game.draftGender;
      player.diff = game.draftDiff || "normal";
      byId("create").style.display = "none";
      playSound(784, 0.15, "sine");
      if (lifeMode()) startLifeMode();
      else showStory();
    } else {
      byId("create").style.display = "none";
      game.mode = "world";
      saveGame();
      playSound(784, 0.12, "sine");
      toast("Visual salvo!");
    }
  };
}
