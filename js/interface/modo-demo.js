/**
 * ECOS DO ARCANO — modo-demo.js
 * Demo para apresentações: só o começo do Modo História, bem guiado.
 *  - Liga com index.html?demo (ou no painel de testes: "Modo demo"). Desliga
 *    com ?nodemo ou no próprio painel.
 *  - Começa do zero, sem nada liberado: treino, mercado, o Cofre de Vesper no
 *    Bosque, o covil do Ent (a primeira runa), contar à Odelia e o Mosaico.
 *  - Livre para explorar a primeira parte (Cinzaluz, o Bosque, as casas e o
 *    covil do Ent). As outras regiões ficam fechadas com um aviso.
 *  - Guiada: cartões de tutorial ligados, a seta dourada e um aviso do
 *    próximo objetivo a cada passo.
 *  - Termina com a tela "Fim da demo" quando o Mosaico é montado.
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

/** Etapas da demo: até o Mosaico de Vesper (a primeira runa e os primeiros quebra-cabeças). */
const DEMO_LAST = "q-mosaico";
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

function demoEndScreen() {
  if (player.demoEnded) return;
  player.demoEnded = true;
  player.tutDone = true; // o cartão de ajuda não cobre a tela final
  for (const id of ["tutc", "coach"]) if (byId(id)) byId(id).style.display = "none";
  saveGame();
  choice(
    "Fim da demo",
    "Você recuperou a primeira runa e decifrou os primeiros segredos de Vesper. O Ecos do Arcano continua com mais cinco Guardiões, o Porto, o Pântano, Pedravale, a Torre do Silêncio e o Simulador de Vida. Obrigado por jogar!",
    [
      { t: "Continuar explorando Cinzaluz e o Bosque", icon: "flag", fn: () => toast("A primeira parte continua aberta para explorar.", 2400) },
      { t: "Recomeçar a demo do início", icon: "scroll", fn: demoRestart },
    ],
  );
}
function demoRestart() {
  clearSave();
  location.href = location.pathname + "?demo";
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
    if (life) life.style.display = "none";
    const sub = document.querySelector("#title .sub");
    if (sub && !byId("demoTag")) sub.insertAdjacentHTML("afterend", `<div id="demoTag" style="margin:6px auto;padding:4px 12px;border:2px solid #f2c14e;border-radius:8px;color:#f2c14e;font-weight:700;letter-spacing:.12em;width:max-content">DEMO · Prólogo e a primeira runa</div>`);
  }

  // começa do zero, guiada (os cartões de tutorial ficam ligados)
  const sgBase = startGame;
  startGame = function () {
    const r = sgBase.apply(this, arguments);
    if (player && player.name && !lifeMode() && !player.demo) {
      player.demo = true;
      player.tutDone = false;
      player.tutAsked = true;
      saveGame();
      setTimeout(() => {
        if (game.mode === "world" && !game.dialog)
          say([["Demo", "Bem-vindo à demo do Ecos do Arcano! Você vai jogar o começo da história: treinar, explorar Cinzaluz e o Bosque e recuperar a primeira runa. Siga a seta dourada e os cartões de ajuda."]]);
      }, 1200);
    }
    return r;
  };

  // regiões fora da primeira parte ficam fechadas
  let lastOk = null;
  const ezBase = enterZone;
  enterZone = function () {
    if (!lifeMode() && !demoZoneOk(player.zone) && lastOk) {
      [player.zone, player.x, player.y] = lastOk;
      player.rx = player.x;
      player.ry = player.y;
      const r = ezBase.call(this, false);
      setTimeout(() => toast("Na demo, só a primeira parte está aberta: Cinzaluz e o Bosque. O resto do reino chega no jogo completo!", 3200), 50);
      return r;
    }
    return ezBase.apply(this, arguments);
  };
  if (typeof journey === "function") {
    const jBase = journey;
    journey = function (to) {
      if (!lifeMode() && !demoZoneOk(to)) return toast("Na demo, a viagem para outras regiões está fechada.", 2600);
      return jBase.apply(this, arguments);
    };
  }

  // avisa o próximo objetivo e termina a demo no fim do Mosaico
  let lastStep = null;
  const upBase = update;
  update = function (dt) {
    upBase(dt);
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
