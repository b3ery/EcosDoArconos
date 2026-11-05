/**
 * ECOS DO ARCANO — 40-celular.js
 * Ajustes para jogar no celular:
 *  - o jogo é só deitado (em pé aparece um aviso para girar o aparelho);
 *  - os botões pequenos (Itens, Missões, Mapa...) ficam guardados num botão ☰,
 *    assim não cobrem o jogo nem o botão B;
 *  - um toque rápido na metade esquerda (área do joystick) conta como toque
 *    no jogo, então dá para tocar nas pessoas dentro das lojas;
 *  - minimapa ligado também no celular, abaixo do relógio.
 */

"use strict";

const IS_TOUCH = matchMedia("(pointer:coarse)").matches;

/* ---- Só deitado ---- */
(function rotateNotice() {
  const el = document.createElement("div");
  el.id = "rotate";
  el.innerHTML = `<div class="rot-ph"></div><b>Gire o celular</b><small>Ecos do Arcano é jogado com o celular deitado.</small>`;
  document.body.appendChild(el);
  // Quando o navegador deixa, trava na horizontal (só funciona em tela cheia).
  const lock = () => {
    try {
      const p = screen.orientation && screen.orientation.lock && screen.orientation.lock("landscape");
      if (p && p.catch) p.catch(() => {});
    } catch (e) {}
  };
  document.addEventListener("fullscreenchange", () => document.fullscreenElement && lock());
  document.addEventListener("webkitfullscreenchange", lock);
  lock();
})();

/* ---- Botão ☰ com os atalhos ---- */
(function touchMenu() {
  const small = document.querySelector("#touch .small"),
    abx = document.querySelector("#touch .abx");
  if (!small || !abx) return;
  const b = document.createElement("button");
  b.id = "tMenu";
  b.setAttribute("aria-label", "Atalhos");
  b.textContent = "☰";
  abx.appendChild(b);
  const close = () => document.body.classList.remove("tmenu");
  b.addEventListener("click", (e) => {
    e.stopPropagation();
    document.body.classList.toggle("tmenu");
  });
  // Escolher um atalho fecha a lista.
  small.addEventListener("click", (e) => e.target.closest("button") && setTimeout(close, 0));
  addEventListener("pointerdown", (e) => {
    if (!e.target.closest || (!e.target.closest("#touch .small") && e.target !== b)) close();
  });
})();

/* ---- Toque rápido na área do joystick = toque no jogo ---- */
(function tapThroughJoyzone() {
  const zone = byId("joyzone");
  if (!zone) return;
  let down = null;
  zone.addEventListener("pointerdown", (e) => (down = { x: e.clientX, y: e.clientY, t: performance.now(), id: e.pointerId }));
  zone.addEventListener("pointerup", (e) => {
    const d = down;
    down = null;
    if (!d || d.id !== e.pointerId) return;
    if (performance.now() - d.t > 350 || Math.hypot(e.clientX - d.x, e.clientY - d.y) > 12) return;
    byId("cv").dispatchEvent(new MouseEvent("click", { clientX: e.clientX, clientY: e.clientY, bubbles: true }));
  });
})();

/* ---- Minimapa no celular ---- */
if (IS_TOUCH) {
  try {
    const v = localStorage.getItem("ecos-mm");
    game.showMM = v === null ? true : v === "1";
  } catch (e) {
    game.showMM = true;
  }
}
/** Liga/desliga o minimapa e lembra a escolha. */
function toggleMinimap() {
  game.showMM = !game.showMM;
  try {
    localStorage.setItem("ecos-mm", game.showMM ? "1" : "0");
  } catch (e) {}
  toast(game.showMM ? "Minimapa ligado" : "Minimapa desligado", 1200);
}
(function minimapButton() {
  const small = document.querySelector("#touch .small");
  if (!small) return;
  const b = document.createElement("button");
  b.id = "tMM";
  b.textContent = "Minimapa";
  b.addEventListener("click", () => game.mode === "world" && toggleMinimap());
  small.appendChild(b);
})();
// No celular deitado o minimapa desce para não ficar embaixo do relógio.
{
  const mmBase = drawMinimap;
  drawMinimap = function (big, t) {
    if (big || !document.body.classList.contains("mland")) return mmBase(big, t);
    ctx.save();
    ctx.translate(0, 42);
    mmBase(big, t);
    ctx.restore();
  };
}

/* ---- Menu pizza sempre inteiro na tela ---- */
{
  const pieBase = renderPie;
  renderPie = function (title, text, opts) {
    const r = pieBase(title, text, opts);
    if (r) fitPie();
    return r;
  };
}
/** Empurra o menu pizza para dentro da tela quando algum botão passaria da borda. */
function fitPie() {
  const wrap = document.querySelector(".pie-wrap"),
    scr = byId("screen");
  if (!wrap || !scr) return;
  const S = scr.getBoundingClientRect(),
    m = 6;
  wrap.classList.add("measure");
  let x0 = Infinity,
    x1 = -Infinity,
    y0 = Infinity,
    y1 = -Infinity;
  for (const b of wrap.querySelectorAll(".pie-opt")) {
    const r = b.getBoundingClientRect();
    x0 = Math.min(x0, r.left);
    x1 = Math.max(x1, r.right);
    y0 = Math.min(y0, r.top);
    y1 = Math.max(y1, r.bottom);
  }
  wrap.classList.remove("measure");
  if (x0 === Infinity) return;
  let dx = 0,
    dy = 0;
  if (x0 < S.left + m) dx = S.left + m - x0;
  else if (x1 > S.right - m) dx = S.right - m - x1;
  if (y0 < S.top + m) dy = S.top + m - y0;
  else if (y1 > S.bottom - m) dy = S.bottom - m - y1;
  if (dx || dy) wrap.style.translate = `${Math.round(dx)}px ${Math.round(dy)}px`;
}

/* ---- Jogos salvos: o cartão inteiro serve para jogar ---- */
{
  const slotsBase = openSlots;
  openSlots = function (mode, onPick) {
    slotsBase(mode, onPick);
    const el = byId("svs");
    if (!el) return;
    el.querySelectorAll(".sv").forEach((card) => {
      const btn = card.querySelector("[data-play],[data-new]");
      if (!btn) return;
      card.classList.add("tap");
      card.addEventListener("click", (e) => !e.target.closest("button") && btn.click());
    });
  };
}
