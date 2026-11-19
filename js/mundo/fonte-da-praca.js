/**
 * ECOS DO ARCANO — fonte-da-praca.js
 * A fonte da praça de Cinzaluz, como as fontes de praça das cidades
 * medievais: tanque redondo de pedra bruta com degrau e musgo, pilar de
 * pedra com bicas de cabeça de leão jorrando água e a imagem de pedra do
 * cavaleiro padroeiro em cima; água escura com ondas e moedas no fundo. Por baixo continua sendo o mesmo lugar de
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
    // fonte medieval de praça: tanque redondo de pedra bruta, pilar com bicas de
    // cabeça de leão e uma imagem de pedra em cima; água escura, musgo e moedas
    const cx = ((X0 + X1 + 1) / 2) * TILE,
      cy = ((Y0 + Y1 + 1) / 2) * TILE + 8;
    const RX = 72,
      RY = 34;
    const R = (x, y, w, h, c) => ((ctx.fillStyle = c), ctx.fillRect(Math.round(x), Math.round(y), w, h));
    const night = nightAlpha() > 0.25;
    // sombra no chão e o degrau de pedra em volta
    ell(cx + 4, cy + 16, RX + 14, RY + 12, "rgba(0,0,0,.22)");
    ell(cx, cy + 8, RX + 10, RY + 10, "#7d776b");
    ell(cx, cy + 6, RX + 8, RY + 8, "#8f897c");
    // a parede do tanque: pedras brutas, uma por uma
    const wallH = 20;
    ell(cx, cy + wallH - 4, RX, RY, "#6e685d");
    for (let a = 0; a < Math.PI; a += Math.PI / 14) {
      const x0 = cx + Math.cos(a) * RX,
        y0 = cy + Math.sin(a) * RY;
      const sh = 0.75 + Math.sin(a * 3 + 1) * 0.1;
      ctx.fillStyle = `rgb(${Math.round(150 * sh)},${Math.round(143 * sh)},${Math.round(128 * sh)})`;
      ctx.fillRect(Math.round(x0 - 9), Math.round(y0 - 4), 18, wallH);
      R(x0 - 9, y0 - 4, 18, 2, "rgba(255,255,255,.14)");
      R(x0 + 8, y0 - 4, 1, wallH, "rgba(40,36,30,.45)");
      R(x0 - 9, y0 + 6, 18, 1, "rgba(40,36,30,.35)");
    }
    // a borda de cima do tanque
    ctx.strokeStyle = "#a59f91";
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.ellipse(cx, cy - 4, RX - 3, RY - 3, 0, 0, 7);
    ctx.stroke();
    ctx.strokeStyle = "rgba(40,36,30,.35)";
    ctx.lineWidth = 1;
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 10) {
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * (RX - 6), cy - 4 + Math.sin(a) * (RY - 6));
      ctx.lineTo(cx + Math.cos(a) * RX, cy - 4 + Math.sin(a) * RY);
      ctx.stroke();
    }
    // a água: escura, com ondas que andam
    ell(cx, cy - 3, RX - 7, RY - 7, night ? "#1d3448" : "#2f5868");
    ell(cx - 10, cy - 7, RX - 26, RY - 16, night ? "#24405a" : "#3d6e7e");
    for (let i = 0; i < 4; i++) {
      const r = ((t * 14 + i * 14) % 56) + 6;
      ctx.strokeStyle = `rgba(200,230,240,${0.28 * (1 - r / 62)})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(cx, cy - 3, r, r * 0.46, 0, 0, 7);
      ctx.stroke();
    }
    // moedas no fundo e musgo na beira
    for (let i = 0; i < 6; i++) R(cx - 40 + ((i * 17) % 70), cy - 10 + ((i * 11) % 16), 3, 2, Math.sin(t * 2 + i) > 0.3 ? "#f2d26a" : "#b8942e");
    for (let i = 0; i < 9; i++) {
      const a = 0.25 + i * 0.32;
      R(cx + Math.cos(a) * (RX - 2) - 3, cy - 4 + Math.sin(a) * (RY - 2) + 2, 6, 3, i % 2 ? "#4f7a3a" : "#3f6a2e");
    }
    // o pilar no meio: pedra com faixas e base quadrada
    const px = cx - 10,
      pTop = cy - 62;
    R(px - 6, cy - 14, 32, 10, "#857f72");
    R(px - 6, cy - 14, 32, 2, "rgba(255,255,255,.15)");
    R(px, pTop, 20, cy - 14 - pTop, "#9a9486");
    R(px, pTop, 4, cy - 14 - pTop, "rgba(255,250,235,.16)");
    R(px + 15, pTop, 5, cy - 14 - pTop, "rgba(0,0,0,.18)");
    for (const yy of [pTop + 12, pTop + 30]) R(px - 2, yy, 24, 4, "#7d776b");
    // bicas de cabeça de leão nos dois lados, jorrando água no tanque
    for (const s of [-1, 1]) {
      const hx = s < 0 ? px - 6 : px + 20;
      R(hx, pTop + 18, 6, 8, "#b0a48a");
      R(hx + (s < 0 ? 0 : 3), pTop + 20, 3, 2, "#3a2a1a");
      // a água caindo em arco
      ctx.strokeStyle = "rgba(170,215,235,.85)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      const sx = hx + (s < 0 ? 0 : 6);
      ctx.moveTo(sx, pTop + 24);
      ctx.quadraticCurveTo(sx + s * 16, pTop + 26, sx + s * 22, cy - 8);
      ctx.stroke();
      // respingos onde cai
      for (let k = 0; k < 3; k++) {
        const ph = (t * 3 + k * 0.33 + (s > 0 ? 0.5 : 0)) % 1;
        R(sx + s * 22 + (k - 1) * 4, cy - 10 - Math.sin(ph * Math.PI) * 6, 2, 2, "rgba(220,240,250,.8)");
      }
    }
    // a imagem de pedra em cima: um cavaleiro com escudo (o padroeiro da vila)
    const sx0 = cx - 8,
      sy0 = pTop - 34;
    R(sx0 - 3, pTop - 4, 22, 5, "#857f72"); // pedestal
    R(sx0 + 2, sy0 + 10, 12, 20, "#b8b2a3"); // corpo
    R(sx0 + 2, sy0 + 10, 3, 20, "rgba(255,255,255,.16)");
    R(sx0 + 4, sy0, 8, 10, "#c2bcad"); // cabeça (elmo)
    R(sx0 + 5, sy0 + 4, 6, 2, "#6a655b"); // viseira
    R(sx0 - 3, sy0 + 12, 7, 11, "#a39d8f"); // escudo
    R(sx0 - 1, sy0 + 15, 3, 4, "#8a8474");
    R(sx0 + 14, sy0 + 6, 2, 24, "#a39d8f"); // espada de pé
    R(sx0 + 12, sy0 + 12, 6, 2, "#a39d8f");
    // musgo e manchas de tempo no pilar e na estátua
    for (let i = 0; i < 6; i++) R(px + ((i * 7) % 18), pTop + 34 + ((i * 5) % 14), 3, 2, "rgba(70,110,50,.55)");
    R(sx0 + 3, sy0 + 26, 4, 3, "rgba(70,110,50,.5)");
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
