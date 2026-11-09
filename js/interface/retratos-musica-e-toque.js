/**
 * ECOS DO ARCANO — retratos-musica-e-toque.js
 * Retratos das falas com lágrimas e raiva, músicas do golpe, velório,
 * casamento e eleição, e o toque e segure no celular.
 * Modifica (envolve) funções de outros arquivos: desiredTrack, drawDialogPortrait, lineEmotion.
 */

"use strict";

/* ===================== RETRATOS COM EXPRESSÃO ===================== */
{
  const leBase = lineEmotion;
  lineEmotion = function (text) {
    if (/\*(chora|soluça|funga)|snif|lágrima|triste|chorando|buá/i.test(text)) return "cry";
    if (/!!|grr|ódio|maldito|VOU TE|raiva|SAI DAQUI/i.test(text)) return "anger";
    return leBase(text);
  };
  const dpBase = drawDialogPortrait;
  drawDialogPortrait = function (d, talking) {
    const em = d && d.lines && d.lines[d.i] ? lineEmotion(d.lines[d.i][1]) : null;
    if (em === "cry") {
      // Desenha o retrato normal e as lágrimas por cima.
      const leb = lineEmotion;
      lineEmotion = () => null;
      try {
        dpBase(d, talking);
      } finally {
        lineEmotion = leb;
      }
      const cv = byId("dport"),
        c2 = cv.getContext("2d");
      const t = game.t;
      c2.fillStyle = "#7ac8ff";
      for (const ex of [0.38, 0.6]) {
        const y = (cv.height * 0.5 + ((t * 40) % 24)) | 0;
        c2.fillRect((cv.width * ex) | 0, y, 4, 7);
      }
      return;
    }
    dpBase(d, talking);
    if (em === "anger") {
      const cv = byId("dport"),
        c2 = cv.getContext("2d");
      c2.fillStyle = "rgba(255,60,60,.18)";
      c2.fillRect(0, 0, cv.width, cv.height);
    }
  };
}

/* ===================== MÚSICAS ===================== */
Object.assign(TRACKS, {
  golpe: { bpm: 112, lead: "sawtooth", melody: [57, 0, 57, 60, 0, 57, 62, 0, 60, 0, 57, 0, 55, 0, 57, 0, 57, 0, 57, 60, 0, 64, 62, 0, 60, 0, 59, 0, 57, 0, 0, 0], bass: [33, 33, 0, 33, 31, 31, 0, 31, 29, 29, 0, 29, 28, 0, 28, 0] },
  velorio: { bpm: 56, lead: "triangle", melody: [64, 0, 0, 62, 0, 0, 60, 0, 0, 0, 59, 0, 57, 0, 0, 0, 60, 0, 0, 59, 0, 0, 57, 0, 55, 0, 0, 0, 57, 0, 0, 0], bass: [45, 0, 0, 0, 41, 0, 0, 0, 43, 0, 0, 0, 40, 0, 0, 0] },
  casamento: { bpm: 96, lead: "triangle", melody: [72, 0, 77, 77, 77, 0, 0, 0, 72, 0, 79, 76, 77, 0, 0, 0, 72, 0, 77, 81, 84, 0, 81, 0, 79, 0, 77, 76, 77, 0, 0, 0], bass: [53, 0, 0, 0, 48, 0, 0, 0, 50, 0, 0, 0, 53, 0, 0, 0] },
  eleicao: { bpm: 120, lead: "square", melody: [67, 0, 67, 69, 71, 0, 67, 0, 72, 0, 71, 0, 69, 0, 67, 0, 64, 0, 67, 69, 71, 0, 74, 0, 72, 71, 69, 0, 67, 0, 0, 0], bass: [43, 0, 50, 0, 43, 0, 50, 0, 48, 0, 55, 0, 43, 0, 50, 0] },
});
{
  const dtBase = desiredTrack;
  desiredTrack = function () {
    if (game.deathScene) return "velorio";
    if (game.cine) return "festival";
    const ch = byId("choice");
    const title = ch && ch.style.display !== "none" && ch.querySelector("h2,h3,.ttl") ? ch.querySelector("h2,h3,.ttl").textContent : "";
    if (/Muralha|corredores|quarto real|Portões|Salão do Castelo|Sala do Trono|GOLPE/i.test(title)) return "golpe";
    if (/Casamento de|casamento/i.test(title) || (game.dialog && /Padre Anselmo/.test((game.dialog.lines[game.dialog.i] || [])[0] || "") && /aceita/.test((game.dialog.lines[game.dialog.i] || [])[1] || ""))) return "casamento";
    if (/Eleição/.test(title)) return "eleicao";
    return dtBase();
  };
}

/* ===================== TOQUE E SEGURE ===================== */
(function holdToInteract() {
  const cv = byId("cv");
  if (!cv) return;
  let tm = null,
    start = null;
  const tileAtPoint = (cx, cy) => {
    const r = cv.getBoundingClientRect();
    const C = game.cam;
    if (!C) return null;
    const px = ((cx - r.left) / r.width) * viewWidth,
      py = ((cy - r.top) / r.height) * 480;
    return [Math.floor((px / C.Z + C.camX) / TILE), Math.floor((py / C.Z + C.camY) / TILE)];
  };
  cv.addEventListener("pointerdown", (e) => {
    if (e.pointerType !== "touch" || game.mode !== "world" || game.dialog) return;
    start = [e.clientX, e.clientY];
    clearTimeout(tm);
    tm = setTimeout(() => {
      const p = tileAtPoint(start[0], start[1]);
      if (!p) return;
      for (const [dx, dy] of [[0, 0], [0, 1], [0, -1], [1, 0], [-1, 0]]) {
        const x = p[0] + dx,
          y = p[1] + dy;
        if (characterAt(x, y)) {
          game.autoPath = null;
          if (navigator.vibrate) navigator.vibrate(30);
          interactAt(x, y);
          return;
        }
      }
    }, 500);
  });
  const cancel = (e) => {
    if (!start) return;
    if (e.type === "pointermove" && Math.hypot(e.clientX - start[0], e.clientY - start[1]) < 12) return;
    clearTimeout(tm);
    start = null;
  };
  cv.addEventListener("pointermove", cancel);
  cv.addEventListener("pointerup", cancel);
  cv.addEventListener("pointercancel", cancel);
})();
