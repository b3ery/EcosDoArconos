/**
 * ECOS DO ARCANO — celular.js
 * Ajustes para jogar no celular:
 *  - o jogo é só deitado (em pé aparece um aviso para girar o aparelho);
 *  - os botões pequenos (Itens, Missões, Mapa...) ficam guardados num botão ☰,
 *    assim não cobrem o jogo nem o botão B;
 *  - um toque rápido na metade esquerda (área do joystick) conta como toque
 *    no jogo, então dá para tocar nas pessoas dentro das lojas;
 *  - minimapa ligado também no celular, abaixo do relógio.
 * Modifica (envolve) funções de outros arquivos: crewDrawList, drawMinimap, openSlots, renderPie, update.
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
// O minimapa desce para não ficar embaixo do relógio e dos botões de tempo.
{
  const mmBase = drawMinimap;
  drawMinimap = function (big, t) {
    if (big) return mmBase(big, t);
    ctx.save();
    ctx.translate(0, game.mmDy || 34);
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

/* ---- Andar com o dedo ----
 * Arrastar o dedo em qualquer ponto da tela anda (o joystick aparece embaixo do dedo
 * e some quando você solta). Tocar no chão faz o personagem andar até lá sozinho;
 * tocar numa porta, placa ou baú anda até lá e já interage. */
game.autoPath = null;
function tapWalkTo(tx, ty) {
  const z = player.zone;
  let interact = null;
  let path = null;
  if (walkable(z, tx, ty) && !(typeof furnAt === "function" && furnAt(tx, ty, true))) path = zonePath(z, player.x, player.y, tx, ty, 3000);
  else {
    interact = [tx, ty];
    path = zonePath(z, player.x, player.y, tx, ty, 3000, (x, y) => Math.abs(x - tx) + Math.abs(y - ty) === 1 && walkable(z, x, y));
    if (path && path.length && path[path.length - 1][0] === tx && path[path.length - 1][1] === ty) path.pop();
  }
  if (!path) return toast("Não dá para chegar aí.", 1200);
  game.autoPath = { path, interact, zone: z, stuck: 0, mark: [tx, ty], t: 0 };
}
for (const el of [byId("joyzone"), byId("joy")]) el && el.addEventListener("pointerdown", () => (game.autoPath = null));
byId("cv").addEventListener("click", (e) => {
  if (game.mode !== "world" || game.dialog || !game.cam || game.fish) return;
  const r = byId("cv").getBoundingClientRect();
  const lx = ((e.clientX - r.left) / r.width) * viewWidth,
    ly = ((e.clientY - r.top) / r.height) * 480;
  const tx = Math.floor((lx / game.cam.Z + game.cam.camX) / TILE),
    ty = Math.floor((ly / game.cam.Z + game.cam.camY) / TILE);
  if (characterAt(tx, ty) || characterAt(tx, Math.floor((ly / game.cam.Z + game.cam.camY + 12) / TILE))) return;
  if (tx === player.x && ty === player.y) return;
  tapWalkTo(tx, ty);
});
{
  const updBase = update;
  update = function (dt) {
    const A = game.autoPath;
    let drove = false;
    if (A) {
      const keys = ["arrowup", "arrowdown", "arrowleft", "arrowright", "w", "a", "s", "d"].some((k) => pressedKeys[k]);
      if (keys || A.zone !== player.zone || game.mode !== "world") game.autoPath = null;
      else if (!game.dialog) {
        while (A.path.length && A.path[0][0] === player.x && A.path[0][1] === player.y) A.path.shift();
        if (!A.path.length) {
          game.autoPath = null;
          if (A.interact) {
            const [ix, iy] = A.interact;
            player.dir = ix > player.x ? "right" : ix < player.x ? "left" : iy > player.y ? "down" : "up";
            if (typeof targetAt === "function" && targetAt(ix, iy)) interactAt(ix, iy);
          }
        } else {
          const [nx, ny] = A.path[0];
          if (Math.abs(nx - player.x) + Math.abs(ny - player.y) !== 1) game.autoPath = null;
          else {
            game.touch = nx > player.x ? "right" : nx < player.x ? "left" : ny > player.y ? "down" : "up";
            A.driving = true;
            drove = true;
            A.t += dt;
            if (A.t > 1.2 + A.path.length * 0.5) game.autoPath = null;
          }
        }
      }
    }
    updBase(dt);
    if (drove) game.touch = null;
  };
  const drawBase = crewDrawList;
  crewDrawList = function (list, t) {
    drawBase(list, t);
    const A = game.autoPath;
    if (!A) return;
    const [mx, my] = A.mark;
    list.push({
      y: -0.5,
      draw: () => {
        const X = mx * TILE + 16,
          Y = my * TILE + 24,
          s = 1 + Math.sin(t * 8) * 0.15;
        ctx.strokeStyle = "rgba(242,193,78,.9)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(X, Y, 9 * s, 4 * s, 0, 0, 7);
        ctx.stroke();
      },
    });
  };
}

/* ---- Pausa, velocidade e esperar: agora embaixo do relógio, lado a lado ---- */
(function timeButtons() {
  const scr = byId("screen");
  const grp = document.createElement("div");
  grp.id = "tgrp";
  grp.className = "ui";
  for (const id of ["pauseb", "speedb", "waitb"]) byId(id) && grp.appendChild(byId(id));
  scr.appendChild(grp);
  const place = () => {
    const hr = document.querySelector("#hud .hudR");
    if (!hr || !hr.offsetParent || game.mode === "title") return void (grp.style.visibility = "hidden");
    const S = scr.getBoundingClientRect(),
      R = hr.getBoundingClientRect();
    grp.style.visibility = "";
    grp.style.top = R.bottom - S.top + 4 + "px";
    grp.style.right = S.right - R.right + "px";
    const G = grp.getBoundingClientRect();
    game.mmDy = Math.max(0, ((G.bottom - S.top + 6) / S.height) * 480 - 37);
  };
  setInterval(place, 400);
  addEventListener("resize", place);
})();

/* Marca o corpo da página na tela de início (para esconder botões do jogo). */
setInterval(() => document.body.classList.toggle("ontitle", game.mode === "title"), 300);
