/**
 * ECOS DO ARCANO — cenas.js
 * Cenas de tela cheia (coroação, flashbacks): playCine(desenho, duração, depois).
 * Enter, Espaço ou um toque continuam.
 * Modifica (envolve) funções de outros arquivos: draw.
 */

"use strict";

/* ===================== CENA GENÉRICA ===================== */
function playCine(draw, dur, next) {
  game.cine = { t0: game.t, draw, dur, next };
  game.dialog = null;
  byId("dialog").style.display = "none";
  byId("choice").style.display = "none";
  if (typeof hidePie === "function") hidePie();
  game.mode = "cutscene";
  document.body.classList.add("cutscene");
}
function endCine() {
  const c = game.cine;
  // Não pula sem querer: só deixa seguir depois que quase todo o texto apareceu.
  if (!c || game.t - c.t0 < Math.min(c.dur * 0.75, 4)) return;
  game.cine = null;
  document.body.classList.remove("cutscene");
  // Se uma luta começou por baixo da cena, volta para ela (antes ficava presa no mapa).
  game.mode = typeof battle !== "undefined" && battle && !battle.done ? "battle" : "world";
  game.fade = 1;
  c.next && c.next();
}
addEventListener("keydown", (e) => {
  if (!game.cine) return;
  e.stopImmediatePropagation();
  e.preventDefault();
  if (["Enter", " ", "e", "E", "Escape"].includes(e.key)) endCine();
}, true);
addEventListener("pointerdown", (e) => {
  if (!game.cine) return;
  e.stopImmediatePropagation();
  e.preventDefault();
  endCine();
}, true);
{
  const drawBase = draw;
  draw = function () {
    drawBase();
    const c = game.cine;
    if (!c) return;
    const t = game.t - c.t0;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(ctx.canvas.width / viewWidth, ctx.canvas.height / 480);
    ctx.imageSmoothingEnabled = false;
    ctx.textAlign = "center";
    c.draw(viewWidth, 480, t);
    // A cena espera você: o aviso aparece quando todo o texto já entrou,
    // e ela só segue quando você toca (ou aperta Enter).
    if (t > c.dur) {
      ctx.font = '600 14px "Pixelify Sans", sans-serif';
      ctx.fillStyle = `rgba(255,255,255,${0.5 + 0.5 * Math.sin(t * 4)})`;
      ctx.fillText(TOUCH ? "Toque para continuar" : "Enter para continuar", viewWidth / 2, 466);
    }
    ctx.restore();
    if (settings.cineAuto && t > c.dur + 4) endCine();
  };
}
