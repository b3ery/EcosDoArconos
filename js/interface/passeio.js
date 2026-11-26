/**
 * ECOS DO ARCANO — passeio.js
 * MODO PASSEIO (para apresentar o jogo): no painel de TESTES › Começo,
 * "Passeio pelos lugares bonitos". A câmera visita sozinha, com legenda:
 * o castelo de Cinzaluz, o parque do rio, a Feira Medieval, o Palácio das
 * Marés refletido no mar à noite, o rio congelado no inverno, as roças, a
 * tempestade no mar, Jadeluz e o Castelo de Rosalva no pôr do sol.
 * Cada parada dura ~6 s. Qualquer tecla, toque ou clique termina o passeio
 * e devolve o jogo exatamente como estava (lugar, hora, dia, clima).
 */

"use strict";

(() => {
  const castleSpot = (z) => {
    const c = ZONES[z].town.bld.find((b) => /^(castle|palacio|fortaleza)$/.test(b.style));
    return c ? [c.x + (c.w >> 1), c.y + c.h + (c.w >= 16 ? 6 : 2)] : ZONES[z].town.arrive;
  };
  const lakeSpot = (z) => {
    const L = ((window.LAKES || {})[z] || [])[0];
    return L ? [Math.round((L.x0 + L.x1) / 2), L.y0 - 1] : ZONES[z].town.arrive;
  };
  const cropSpot = (z) => {
    const P = (window.FARM_PROPS || {})[z];
    if (P) for (const [k, v] of P) if (k.startsWith("crop:")) return [Math.round((v.R.x0 + v.R.x1) / 2), Math.round((v.R.y0 + v.R.y1) / 2)];
    return ZONES[z].town.arrive;
  };
  // [zona, ponto, hora, dia do ano (estação), clima, legenda]
  const STOPS = () => [
    ["vila", castleSpot("vila"), 11, 3, "sol", "Cinzaluz — o castelo da Rainha Aurélia"],
    ["vila", lakeSpot("vila"), 10, 4, "sol", "O parque do rio: parquinho, estátuas, coreto e reflexo na água"],
    ["vila", null, 11, 6, "sol", "Feira Medieval de fim de semana"],
    ["porto", castleSpot("porto"), 21.5, 12, "sol", "Palácio das Marés refletido no mar, à noite"],
    ["porto", castleSpot("porto"), 11, 12, "tempestade", "Tempestade: o mar fica bravo"],
    ["vila", lakeSpot("vila"), 11, 27, "sol", "Inverno: neve nos telhados e rio congelado para patinar"],
    ["pais-jade-2", cropSpot("pais-jade-2"), 11, 19, "sol", "Outono nas roças de Jadeluz"],
    ["pais-jade-2", castleSpot("pais-jade-2"), 10, 3, "sol", "Jadeluz, além-mar: primavera em flor"],
    ["rosalva", castleSpot("rosalva"), 17.6, 10, "sol", "Castelo de Rosalva no pôr do sol"],
  ];
  let T = null;
  function fairSpot() {
    // a primeira barraca da feira de Cinzaluz
    const Z = ZONES.vila;
    for (let y = 0; y < Z.h; y++) for (let x = 0; x < Z.w; x++) if (/^Feira/.test(targetAt(x, y) || "")) return [x + 4, y + 3];
    return Z.town.arrive;
  }
  function go(i) {
    if (!T) return;
    if (i >= T.stops.length) return stopTour();
    const [z, pt, h, d, w, cap] = T.stops[i];
    player.day = T.save.day - yearDayOf(T.save.day) + d;
    game.annDay = player.day; // trocar o dia no passeio não dispara os eventos do dia (convites, mortes...)
    game.dialog = null;
    game.mode = "world";
    for (const id of ["dialog", "choice"]) if (byId(id)) byId(id).style.display = "none";
    if (typeof hidePie === "function") hidePie();
    player.clock = Math.round(h * 60);
    player.weather = w;
    player.wLeft = 99999;
    if (player.zone !== z) {
      player.zone = z;
      enterZone(false);
    }
    const p = pt || fairSpot();
    player.x = p[0];
    player.y = p[1];
    player.rx = p[0];
    player.ry = p[1];
    game.fade = 1;
    T.cap = cap;
    T.i = i;
    T.timer = setTimeout(() => go(i + 1), 6000);
  }
  window.startTour = function () {
    if (T) return;
    T = { save: { zone: player.zone, x: player.x, y: player.y, day: player.day, clock: player.clock, weather: player.weather, wLeft: player.wLeft, mode: game.mode }, stops: STOPS(), i: 0 };
    game.dialog = null;
    if (byId("dialog")) byId("dialog").style.display = "none";
    game.mode = "world";
    game.cine = null;
    document.body.classList.remove("cutscene");
    game.tour = true;
    if (byId("tutc")) byId("tutc").style.display = "none";
    go(0);
  };
  function stopTour() {
    if (!T) return;
    clearTimeout(T.timer);
    const s = T.save;
    T = null;
    game.tour = false;
    player.zone = s.zone;
    enterZone(false);
    Object.assign(player, { x: s.x, y: s.y, rx: s.x, ry: s.y, day: s.day, clock: s.clock, weather: s.weather, wLeft: s.wLeft });
    game.annDay = s.day;
    game.dialog = null;
    for (const id of ["dialog", "choice"]) if (byId(id)) byId(id).style.display = "none";
    game.mode = "world";
    game.fade = 1;
    toast("Fim do passeio.", 1600);
  }
  window.stopTour = stopTour;
  // a legenda embaixo, como num documentário
  const dwBase = drawWeather;
  drawWeather = function () {
    const r = dwBase.apply(this, arguments);
    if (!T || !T.cap) return r;
    ctx.save();
    ctx.fillStyle = "rgba(10,6,16,.72)";
    ctx.fillRect(0, 404, viewWidth, 52);
    ctx.fillStyle = "#c9a03a";
    ctx.fillRect(0, 404, viewWidth, 2);
    ctx.font = '700 20px "Pixelify Sans", sans-serif';
    ctx.textAlign = "center";
    ctx.fillStyle = "#f6e7c1";
    ctx.fillText(T.cap, viewWidth / 2, 436);
    ctx.font = "13px VT323, monospace";
    ctx.fillStyle = "#cfc3e6";
    ctx.fillText(`${T.i + 1}/${T.stops.length} · qualquer tecla ou toque encerra`, viewWidth / 2, 452);
    ctx.restore();
    return r;
  };
  // durante o passeio, nenhuma janela abre por cima
  setInterval(() => {
    if (!T) return;
    // um cartão de capítulo ou outra cena cobria a tela inteira durante o passeio
    if (game.cine) ((game.cine = null), document.body.classList.remove("cutscene"));
    if (game.dialog || game.mode !== "world") {
      game.dialog = null;
      game.mode = "world";
      for (const id of ["dialog", "choice", "tutc"]) if (byId(id)) byId(id).style.display = "none";
      if (typeof hidePie === "function") hidePie();
    }
  }, 200);
  // o personagem não anda durante o passeio; qualquer tecla/toque termina
  const quit = (e) => {
    if (!T) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    stopTour();
  };
  addEventListener("keydown", quit, true);
  addEventListener("pointerdown", quit, true);
})();
