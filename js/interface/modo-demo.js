/**
 * ECOS DO ARCANO — modo-demo.js
 * Demo para apresentações: só o começo do Modo História, bem guiado.
 *  - Liga com index.html?demo (ou no painel de testes: "Modo demo"). Desliga
 *    com ?nodemo ou no próprio painel.
 *  - Começa do zero, sem nada liberado: treino, mercado, o Cofre de Vesper no
 *    Bosque e o covil do Ent (a primeira runa).
 *  - Livre para explorar a primeira parte (Cinzaluz, o Bosque, as casas e o
 *    covil do Ent). As outras regiões ficam fechadas com um aviso.
 *  - Guiada: cartões de tutorial ligados, a seta dourada e um aviso do
 *    próximo objetivo a cada passo.
 *  - As seis runas e todos os feitiços já vêm liberados ao entrar na demo.
 *  - Termina com a tela "Final da demo" assim que o Ent é libertado: convite
 *    para continuar no jogo completo (itch.io) ou sair da demo.
 *  - DEMO DO SIMULADOR (5 minutos, só em Cinzaluz): quem joga ganha a coroa
 *    de Aurélia e uma lista no alto da tela guia três coisas: um trabalho de
 *    verdade, conversar com um morador (menu em pizza) e governar o reino.
 *    O relógio corre só com o jogo andando; no fim, a tela "Fim da demo".
 *  - Salva num espaço próprio: não mexe nos seus jogos salvos.
 *  - No modo testes, digitar /apresentacao (no jogo ou no campo de comando do
 *    painel TESTES) abre o modo demo.
 * Modifica (envolve): slotKey, startGame, enterZone, journey, update.
 */

"use strict";

let DEMO = (() => {
  try {
    const q = location.search + location.hash;
    if (/[?&#]demo\b/.test(q)) localStorage.setItem("ecosDemo", "1");
    if (/[?&#]nodemo\b/.test(q)) localStorage.removeItem("ecosDemo");
    return localStorage.getItem("ecosDemo") === "1";
  } catch (e) {
    return /demo/.test(location.search);
  }
})();

/** Etapas da demo: até libertar o Ent (a primeira runa). */
const DEMO_LAST = "ent";
const demoZoneOk = (z) => !z || /^(vila|bosque|casa|interior|escola|covil-bosque(-\d+)?)$/.test(z);
const demoStepIdx = () => STEPS.indexOf(curStep());
const demoLastIdx = () => STEPS.findIndex((s) => s.id === DEMO_LAST);
const demoOver = () => demoStepIdx() > demoLastIdx();

function setDemo(on) {
  try {
    if (on) localStorage.setItem("ecosDemo", "1");
    else localStorage.removeItem("ecosDemo");
  } catch (e) {}
  location.href = location.pathname + (on ? "?demo" : "?nodemo");
}

/** Comandos do modo testes. Devolve true se reconheceu. */
function devCommand(txt) {
  const c = String(txt || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  if (c === "/apresentacao") {
    if (typeof toast === "function") toast("Abrindo o modo demo da apresentação...", 1500);
    setTimeout(() => setDemo(true), 400);
    return true;
  }
  return false;
}
// (a escuta do teclado para os comandos fica em js/nucleo/comandos-de-teste.js, que carrega primeiro)

const JOGO_COMPLETO = "https://b3ery.itch.io/ecos-do-arcano";
function demoEndScreen() {
  if (player.demoEnded) return;
  player.demoEnded = true;
  player.tutDone = true; // o cartão de ajuda não cobre a tela final
  for (const id of ["tutc", "coach", "dialog", "choice"]) if (byId(id)) byId(id).style.display = "none";
  game.dialog = null;
  game.mode = "fimdemo";
  saveGame();
  // o mago de quem jogou, em tamanho grande
  let mago = "";
  try {
    const cv = document.createElement("canvas");
    cv.width = cv.height = 16 * 16;
    drawRectsOn(cv, heroRects(player.look, "down", true, 0), 16);
    mago = `<img class="mago" src="${cv.toDataURL()}" alt="">`;
  } catch (e) {}
  const el = document.createElement("div");
  el.id = "fimDemo";
  el.setAttribute("role", "dialog");
  el.setAttribute("aria-label", "Final da demo");
  el.innerHTML = `<div class="estrelas"></div><div class="lua"></div><div class="casas"></div>
    <div class="conteudo">
      <div class="lado">
        <div class="selo">FINAL DA DEMO</div>
        <h1>Ecos do Arcano</h1>
        <div class="runas">${ORDER.map((r) => `<span>${runeSVG(r, 40)}</span>`).join("")}</div>
        ${mago}
        <div class="feito">Você libertou o Ent e recuperou a primeira runa. A aventura continua com mais cinco Guardiões, o Porto, o Pântano, Pedravale, a Torre do Silêncio e o Simulador de Vida.</div>
      </div>
      <div class="lado">
        <div class="pergunta">Se interessou? Continue jogando!</div>
        <div class="qr"><img src="assets/qr_ecos_itch.png" alt="QR code do jogo"></div>
        <div class="link">${JOGO_COMPLETO.replace("https://", "")}</div>
        <div class="botoes">
          <button class="principal" id="fdJogar">Continuar jogando</button>
          <button class="secundario" id="fdSair">Sair da demo</button>
        </div>
      </div>
    </div>`;
  document.body.appendChild(el);
  byId("fdJogar").onclick = demoFullGame;
  byId("fdSair").onclick = () => setDemo(false);
}
/** Abre o jogo completo: a página do jogo no itch.io numa aba nova; se o navegador bloquear, sai da demo aqui mesmo. */
function demoFullGame() {
  let w = null;
  try {
    w = window.open(JOGO_COMPLETO, "_blank", "noopener");
  } catch (e) {}
  if (!w) setDemo(false);
}
// na tela final as teclas não mexem no jogo (e um Enter sem querer não fecha a tela): só os botões
KEY_HANDLERS.fimdemo = () => {};
function demoRestart() {
  clearSave();
  location.href = location.pathname + "?demo";
}

/* ===================== DEMO DO SIMULADOR (5 minutos) ===================== */
const SIM_DEMO_S = 5 * 60;
const simZoneOk = (z) => !z || /^(vila|casa|interior|alareal|calabouco|taverna-cima|banheiro|escola)$/.test(z);
const SIM_GOALS = [
  ["job", "Trabalhar", "Faça um trabalho: Menu → Trabalhos (ou o Quadro de Trabalhos da praça)."],
  ["talk", "Conversar", "Clique num morador e escolha uma ação no menu em pizza."],
  ["gov", "Governar", "Aperte K (ou Menu → Reinos) e cuide do reino: orçamento, impostos e decretos."],
];
function simStart() {
  player.demoSim = { t: 0, job: false, talk: false, gov: false, over: false };
  // para mostrar o governo, quem joga a demo usa a coroa de Aurélia
  if (typeof throne === "function") throne().aurelia = true;
  if (typeof syncRulers === "function") syncRulers();
  player.gold = Math.max(player.gold || 0, 500);
  // a coroa é emprestada pela demo: não conta como golpe de estado
  player.ach = player.ach || {};
  player.ach.golpe = player.ach.golpe || player.day || 1;
  // o regime fica para o teste "Governar" (K): não abre a pergunta sozinha
  if (!player.crownRegime) player.crownRegime = -1;
  saveGame();
  setTimeout(() => {
    if (game.mode === "world" && !game.dialog)
      say([
        ["Demo", "Bem-vindo à demo do Simulador de Vida! Você tem 5 minutos em Cinzaluz, e a coroa de Aurélia está com você."],
        ["Demo", "Experimente três coisas: um trabalho de verdade, conversar com um morador e governar o reino. A lista fica no alto da tela."],
      ]);
  }, 1400);
}
function simBar() {
  let el = byId("demoSimBar");
  if (!el) {
    el = document.createElement("div");
    el.id = "demoSimBar";
    el.style.cssText = "position:fixed;top:8px;left:50%;transform:translateX(-50%);z-index:60;background:rgba(26,16,40,.9);color:#f2e8d0;border:2px solid #f2c14e;border-radius:12px;padding:6px 14px;font:600 15px/1.3 'Pixelify Sans',sans-serif;display:flex;gap:14px;align-items:center;pointer-events:none;white-space:nowrap;max-width:96vw;overflow:hidden";
    document.body.appendChild(el);
  }
  return el;
}
function simTick(dt) {
  const D = player.demoSim;
  const el = simBar();
  const show = game.mode !== "title" && !D.over;
  el.style.display = show ? "flex" : "none";
  if (!show) return;
  // o relógio só começa quando o jogador já escolheu a casa e leu as boas-vindas
  const choiceOpen = byId("choice") && byId("choice").style.display !== "none" && byId("choice").style.display !== "";
  // (a escolha da casa abre logo depois das boas-vindas: espera 3 s de jogo livre)
  if (!D.go) D.free = game.mode === "world" && !game.dialog && !choiceOpen ? (D.free || 0) + dt : 0;
  if (!D.go && (D.free > 3 || (player.home && D.free > 0.5))) D.go = true;
  if (D.go && !game.paused && game.mode !== "cutscene") D.t += dt;
  const left = Math.max(0, SIM_DEMO_S - D.t);
  const mm = Math.floor(left / 60),
    ss = String(Math.floor(left % 60)).padStart(2, "0");
  // cronômetro grande (fica vermelho no último minuto) e a lista dos três testes
  const late = left < 60;
  const nxt = SIM_GOALS.find(([k]) => !D[k]);
  el.innerHTML =
    `<span style="font-size:22px;color:${late ? "#ff6b5a" : "#f2c14e"};${late && Math.floor(D.t * 2) % 2 ? "opacity:.55" : ""}">⏳ ${mm}:${ss}</span>` +
    SIM_GOALS.map(([k, n]) => `<span style="opacity:${D[k] ? 0.55 : 1}${nxt && nxt[0] === k ? ";color:#ffe08a;text-decoration:underline" : ""}">${D[k] ? "✓" : "○"} ${n}</span>`).join("") +
    (nxt ? `<span style="color:#cfc3e6;font-size:12px">siga a seta dourada</span>` : "");
  // a cada minuto, lembra o que falta
  const next = SIM_GOALS.find(([k]) => !D[k]);
  const minute = Math.floor(D.t / 60);
  if (next && minute !== D.tipAt && game.mode === "world" && !game.dialog) ((D.tipAt = minute), toast(next[2], 4200));
  if (left <= 0) simEnd();
}
/** Para onde a seta dourada aponta na demo do Simulador (o próximo teste que falta). */
let simBoard = null;
function simTarget() {
  const D = player && player.demoSim;
  if (!D || D.over || !lifeMode() || player.zone !== "vila" || player.job) return null;
  const next = SIM_GOALS.find(([k]) => !D[k]);
  if (!next) return null;
  const Z = ZONES.vila;
  if (next[0] === "job") {
    if (!simBoard)
      for (let y = 0; y < Z.h && !simBoard; y++) {
        const x = Z.map[y].indexOf("J");
        if (x >= 0) simBoard = { x, y: y + 1 };
      }
    return simBoard;
  }
  if (next[0] === "talk") {
    // o morador parado mais perto
    let best = null,
      bd = 1e9;
    for (const [x, y] of Z.npcList || []) {
      const d = Math.abs(x - player.x) + Math.abs(y - player.y);
      if (d > 1 && d < bd) ((bd = d), (best = { x, y: y + 1 }));
    }
    return best;
  }
  // governo: a porta do castelo (o trono fica lá dentro; a tecla K também abre)
  const c = (Z.town.bld || []).find((b) => /^(castle|palacio|fortaleza)$/.test(b.style));
  return c && c.door ? { x: c.door[0], y: c.y + c.h } : null;
}
if (DEMO && typeof trappedTarget === "function") {
  const ttBase = trappedTarget;
  trappedTarget = function () {
    return ttBase.apply(this, arguments) || simTarget();
  };
}
function simMark(k) {
  const D = player && player.demoSim;
  if (!D || D[k] || D.over) return;
  D[k] = true;
  const g = SIM_GOALS.find((q) => q[0] === k);
  const next = SIM_GOALS.find(([q]) => !D[q]);
  setTimeout(() => toast(`✓ ${g[1]}!${next ? " Agora: " + next[2] : " Você viu as três coisas principais. Fique à vontade para explorar até o fim do tempo."}`, 4200), 300);
}
function simEnd() {
  const D = player.demoSim;
  if (D.over) return;
  D.over = true;
  if (byId("demoSimBar")) byId("demoSimBar").style.display = "none";
  if (typeof endJob === "function" && player.job) endJob();
  saveGame();
  const feitos = SIM_GOALS.filter(([k]) => D[k]).map((q) => q[1].toLowerCase());
  choice(
    "Fim da demo do Simulador",
    `Os 5 minutos acabaram${feitos.length ? ` (você experimentou: ${feitos.join(", ")})` : ""}. No jogo completo tem família, casamento, casas, carreiras, eleições, guerra, 50 reinos e 10 países além-mar. Obrigado por jogar!`,
    [
      { t: "Recomeçar a demo", icon: "scroll", fn: demoRestart },
      { t: "Voltar à tela de título", icon: "flag", fn: () => location.reload() },
    ],
  );
}
if (DEMO) {
  // o que a demo do simulador acompanha
  const mark = (k) => player && player.demoSim && lifeMode() && simMark(k);
  if (typeof earn === "function") {
    const eBase = earn;
    earn = function () {
      mark("job");
      return eBase.apply(this, arguments);
    };
  }
  if (typeof socialMenu === "function") {
    const sBase = socialMenu;
    socialMenu = function () {
      mark("talk");
      return sBase.apply(this, arguments);
    };
  }
  // escolher uma ação no menu em pizza de um morador também conta como conversa
  if (typeof pickChoice === "function") {
    const pBase = pickChoice;
    pickChoice = function () {
      if (game.pieAnchor) mark("talk");
      return pBase.apply(this, arguments);
    };
  }
  if (typeof kingdomsMenu === "function") {
    const kBase = kingdomsMenu;
    kingdomsMenu = function () {
      mark("gov");
      return kBase.apply(this, arguments);
    };
  }
  // sem sair de Cinzaluz: as saídas da vila não levam a outro reino
  if (typeof simTravel === "function") {
    const stBase = simTravel;
    simTravel = function () {
      if (player && player.demoSim) return toast("Na demo do Simulador você fica em Cinzaluz. Os outros reinos chegam no jogo completo!", 2600), true;
      return stBase.apply(this, arguments);
    };
  }
}

if (DEMO) {
  // um espaço de jogo salvo só da demo
  if (typeof slotKey === "function") {
    const sk = slotKey;
    slotKey = (i) => sk(i) + "-demo";
  }
  // tela de título: só o Modo História, com o selo DEMO
  addEventListener("DOMContentLoaded", demoTitle);
  if (document.readyState !== "loading") demoTitle();
  function demoTitle() {
    const life = byId("btnLife");
    if (life) {
      const t = life.querySelector("span:not(.mode-ic)");
      if (t) t.textContent = "Demo de 5 minutos em Cinzaluz: um trabalho de verdade, as interações com os moradores e o governo do reino.";
    }
    const sub = document.querySelector("#title .sub");
    if (sub && !byId("demoTag")) sub.insertAdjacentHTML("afterend", `<div id="demoTag" style="margin:6px auto;padding:4px 12px;border:2px solid #f2c14e;border-radius:8px;color:#f2c14e;font-weight:700;letter-spacing:.12em;width:max-content">DEMO · Prólogo e a primeira runa</div>`);
  }

  // começa do zero, guiada (os cartões de tutorial ficam ligados)
  const sgBase = startGame;
  startGame = function () {
    const r = sgBase.apply(this, arguments);
    if (player && player.name && lifeMode() && !player.demoSim) simStart();
    if (player && player.name && !lifeMode() && !player.demo) {
      player.demo = true;
      player.tutDone = false;
      player.tutAsked = true;
      // na demo as seis runas e todos os feitiços já vêm liberados para testar
      player.runes = ORDER.slice();
      if (typeof SPELLS !== "undefined") player.spells = Object.keys(SPELLS);
      saveGame();
      setTimeout(() => {
        if (game.mode === "world" && !game.dialog)
          say([["Demo", "Bem-vindo à demo do Ecos do Arcano! Você vai jogar o começo da história: treinar, explorar Cinzaluz e o Bosque e enfrentar o primeiro Guardião. As seis runas já estão liberadas para você testar todos os feitiços. Siga a seta dourada e os cartões de ajuda."]]);
      }, 1200);
    }
    return r;
  };

  // regiões fora da primeira parte ficam fechadas (no Simulador: só Cinzaluz)
  let lastOk = null;
  const zoneOk = (z) => (lifeMode() ? simZoneOk(z) : demoZoneOk(z));
  const ezBase = enterZone;
  enterZone = function () {
    if (player && (player.demo || player.demoSim) && !zoneOk(player.zone) && lastOk) {
      [player.zone, player.x, player.y] = lastOk;
      player.rx = player.x;
      player.ry = player.y;
      const r = ezBase.call(this, false);
      setTimeout(() => toast(lifeMode() ? "Na demo do Simulador você fica em Cinzaluz. Os outros reinos chegam no jogo completo!" : "Na demo, só a primeira parte está aberta: Cinzaluz e o Bosque. O resto do reino chega no jogo completo!", 3200), 50);
      return r;
    }
    return ezBase.apply(this, arguments);
  };
  if (typeof journey === "function") {
    const jBase = journey;
    journey = function (to) {
      if (player && (player.demo || player.demoSim) && !zoneOk(to)) return toast("Na demo, a viagem para outras regiões está fechada.", 2600);
      return jBase.apply(this, arguments);
    };
  }

  // avisa o próximo objetivo e termina a demo quando o Ent é libertado
  let lastStep = null;
  const upBase = update;
  update = function (dt) {
    upBase(dt);
    if (player && player.demoSim && lifeMode()) {
      if (simZoneOk(player.zone)) lastOk = [player.zone, player.x, player.y];
      return simTick(dt);
    }
    if (!player || !player.name || lifeMode() || !player.demo) return;
    if (demoZoneOk(player.zone)) lastOk = [player.zone, player.x, player.y];
    if (game.mode !== "world" || game.dialog) return;
    if (demoOver()) return demoEndScreen();
    const s = curStep();
    if (s && s.id !== lastStep) {
      if (lastStep) toast(`Próximo objetivo: ${s.t}`, 3400);
      lastStep = s.id;
    }
  };
}
