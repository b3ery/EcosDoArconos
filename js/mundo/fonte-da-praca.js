/**
 * ECOS DO ARCANO — fonte-da-praca.js
 * A fonte da praça de Cinzaluz, como as fontes de praça das cidades
 * medievais: tanque de pedra octogonal com degrau, coluna no meio com uma
 * taça em cima e outra menor no topo, a água jorrando para cima e caindo em
 * cascata de uma taça para a outra até o tanque, com ondinhas, respingos e
 * moedas brilhando no fundo. Por baixo continua sendo o mesmo lugar de
 * "Beber da fonte" (os tiles de água seguem bloqueando a passagem).
 * Modifica (envolve) drawTile e crewDrawList.
 */

"use strict";

(() => {
  const X0 = 29,
    X1 = 33,
    Y0 = 18,
    Y1 = 21;
  const inF = (z, x, y) => z === "vila" && x >= X0 && x <= X1 && y >= Y0 && y <= Y1;
  const dtBase = drawTile;
  drawTile = function (z, x, y, c, t) {
    if (inF(z, x, y)) return dtBase.call(this, z, x, y, ",", t); // o chão de pedra da praça por baixo
    return dtBase.apply(this, arguments);
  };
  const oct = (cx, cy, rx, ry) => {
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4 + Math.PI / 8;
      const px = cx + Math.cos(a) * rx,
        py = cy + Math.sin(a) * ry;
      i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
    }
    ctx.closePath();
  };
  const ell = (cx, cy, rx, ry, col) => ((ctx.fillStyle = col), ctx.beginPath(), ctx.ellipse(cx, cy, rx, ry, 0, 0, 7), ctx.fill());
  function drawFountain(t) {
    const cx = ((X0 + X1 + 1) / 2) * TILE,
      cy = ((Y0 + Y1 + 1) / 2) * TILE + 6;
    const RX = 80,
      RY = 50;
    const night = nightAlpha() > 0.3;
    // sombra no chão
    ell(cx + 6, cy + 14, RX + 6, RY + 4, "rgba(0,0,0,.22)");
    // degrau de pedra em volta
    ctx.fillStyle = "#8a847a";
    oct(cx, cy + 10, RX + 6, RY + 6);
    ctx.fill();
    ctx.fillStyle = "#a39d92";
    oct(cx, cy + 6, RX + 6, RY + 6);
    ctx.fill();
    // parede do tanque (a face da frente, mais escura, com os blocos)
    ctx.fillStyle = "#6e6960";
    oct(cx, cy + 4, RX, RY);
    ctx.fill();
    ctx.save();
    oct(cx, cy + 4, RX, RY);
    ctx.clip();
    ctx.fillStyle = "rgba(0,0,0,.18)";
    for (let k = -RX; k < RX; k += 16) ctx.fillRect(cx + k, cy + RY * 0.55, 1, 14);
    ctx.fillRect(cx - RX, cy + RY * 0.55 + 7, RX * 2, 1);
    ctx.restore();
    // borda de cima do tanque
    ctx.fillStyle = "#c9c2b2";
    oct(cx, cy - 6, RX, RY);
    ctx.fill();
    ctx.fillStyle = "#e2dccd";
    oct(cx, cy - 8, RX - 2, RY - 2);
    ctx.fill();
    // a água
    const g = ctx.createLinearGradient(0, cy - RY, 0, cy + RY);
    g.addColorStop(0, night ? "#2a4a7a" : "#5aa8e0");
    g.addColorStop(1, night ? "#1a2e54" : "#2f6fa8");
    ctx.fillStyle = g;
    oct(cx, cy - 6, RX - 9, RY - 8);
    ctx.fill();
    ctx.save();
    oct(cx, cy - 6, RX - 9, RY - 8);
    ctx.clip();
    // moedas no fundo
    for (let i = 0; i < 9; i++) {
      const a = i * 2.4,
        r = 20 + ((i * 17) % 40);
      const px = cx + Math.cos(a) * r,
        py = cy - 4 + Math.sin(a) * r * 0.55;
      ctx.fillStyle = i % 3 ? "#c9a040" : "#e8d090";
      ctx.fillRect(Math.round(px), Math.round(py), 3, 2);
      if ((Math.floor(t * 2) + i) % 7 === 0) ((ctx.fillStyle = "#fff8d0"), ctx.fillRect(Math.round(px) + 1, Math.round(py) - 1, 1, 1));
    }
    // ondinhas saindo de onde a água cai
    ctx.strokeStyle = "rgba(220,240,255,.5)";
    ctx.lineWidth = 1;
    for (let i = 0; i < 3; i++) {
      const k = (t * 0.6 + i / 3) % 1;
      ctx.globalAlpha = 1 - k;
      ctx.beginPath();
      ctx.ellipse(cx, cy - 4, 20 + k * 46, (20 + k * 46) * 0.5, 0, 0, 7);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    // reflexo do céu
    ell(cx - 30, cy - 24, 18, 4, "rgba(255,255,255,.18)");
    ctx.restore();
    // coluna do meio
    const colTop = cy - 48;
    ctx.fillStyle = "#9a9488";
    ctx.fillRect(cx - 7, colTop, 14, cy - 4 - colTop);
    ctx.fillStyle = "#c9c2b2";
    ctx.fillRect(cx - 7, colTop, 4, cy - 4 - colTop);
    ctx.fillStyle = "#6e6960";
    ctx.fillRect(cx + 4, colTop, 3, cy - 4 - colTop);
    ell(cx, cy - 4, 12, 4, "#8a847a");
    // taça grande
    ell(cx, colTop + 2, 30, 9, "#7a756a");
    ell(cx, colTop, 30, 9, "#d6cfc0");
    ell(cx, colTop - 1, 25, 6.5, night ? "#2a4a7a" : "#5aa8e0");
    // coluna de cima e taça pequena
    const top2 = colTop - 22;
    ctx.fillStyle = "#a39d92";
    ctx.fillRect(cx - 4, top2, 8, colTop - top2);
    ctx.fillStyle = "#d6cfc0";
    ctx.fillRect(cx - 4, top2, 2, colTop - top2);
    ell(cx, top2 + 1, 14, 5, "#7a756a");
    ell(cx, top2, 14, 5, "#e2dccd");
    ell(cx, top2 - 1, 10, 3, night ? "#2a4a7a" : "#5aa8e0");
    // pinha de pedra no topo
    ell(cx, top2 - 6, 4, 5, "#c9c2b2");
    // o jato subindo e a água caindo
    const water = night ? "rgba(170,200,255,.75)" : "rgba(225,245,255,.85)";
    ctx.fillStyle = water;
    const jh = 16 + Math.sin(t * 9) * 2;
    ctx.fillRect(cx - 1, top2 - 8 - jh, 2, jh);
    for (let i = 0; i < 6; i++) {
      const k = (t * 1.4 + i / 6) % 1;
      const side = i % 2 ? 1 : -1;
      // da pinha para a taça pequena
      ctx.fillRect(Math.round(cx + side * k * 10), Math.round(top2 - 8 - jh + k * k * (jh + 10)), 2, 2);
      // da taça pequena para a grande
      ctx.fillRect(Math.round(cx + side * (13 + k * 8)), Math.round(top2 + k * k * 22), 1, 3);
      // da taça grande para o tanque
      ctx.fillRect(Math.round(cx + side * (29 + k * 10)), Math.round(colTop + k * k * 40), 1, 3);
      ctx.fillRect(Math.round(cx + (i - 2.5) * 8), Math.round(colTop + 6 + k * k * 34), 1, 2);
    }
    // cortinas de água escorrendo da borda das taças
    ctx.fillStyle = night ? "rgba(170,200,255,.28)" : "rgba(225,245,255,.32)";
    ctx.fillRect(cx - 30, colTop + 2, 60, 3);
    ctx.fillRect(cx - 14, top2 + 2, 28, 2);
    // respingos no tanque
    for (let i = 0; i < 8; i++) {
      const k = (t * 2 + i * 0.37) % 1;
      const a = (i / 8) * Math.PI * 2;
      ctx.fillStyle = `rgba(235,248,255,${0.8 * (1 - k)})`;
      ctx.fillRect(Math.round(cx + Math.cos(a) * 36), Math.round(cy - 6 + Math.sin(a) * 14 - k * 6), 2, 2);
    }
  }
  const cdBase = crewDrawList;
  crewDrawList = function (list, t) {
    cdBase(list, t);
    if (player.zone !== "vila") return;
    list.push({ y: Y1 - 0.4, draw: () => drawFountain(t) });
  };
  // os quatro cantos viram chão de praça (a fonte é redonda, não quadrada)
  const Z = ZONES.vila;
  const m = Z.map.map((r) => r.split(""));
  for (const [x, y] of [[X0, Y0], [X1, Y0], [X0, Y1], [X1, Y1]]) if (m[y][x] === "~") m[y][x] = ",";
  Z.map = m.map((r) => r.join(""));
})();
