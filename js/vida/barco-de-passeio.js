/**
 * ECOS DO ARCANO — barco-de-passeio.js
 * BARQUINHO A REMO nos rios e lagos dos parques (todas as cidades):
 *  - no cais de madeira na beira do rio do parque, "Alugar barco" (5 ouro);
 *  - você rema pela água com as mesmas teclas/toque de andar, sem fôlego e
 *    sem perigo; chegando na margem, desce do barco;
 *  - se você namora ou é casad(o), dá para levar a pessoa junto: ela senta
 *    na proa, e o passeio rende romance (e diversão);
 *  - de noite os lampiões refletem na água... e o passeio é mais romântico.
 * Só nos rios e lagos (não no mar).
 * Modifica (envolve) walkable, tryMove, drawSprite, targetAt, interactAt,
 * crewDrawList e enterZone.
 */

"use strict";

(() => {
  const B = (game.boat = game.boat || { on: false, mate: null, t: 0 });
  const lakeOf = (z, x, y) => ((window.LAKES || {})[z] || []).find((R) => x >= R.x0 - 1 && x <= R.x1 + 1 && y >= R.y0 - 1 && y <= R.y1 + 1);
  const water = (z, x, y) => tileAt(z, x, y) === "~" && !!lakeOf(z, x, y) && !(typeof isFrozen === "function" && isFrozen(z, x, y));
  const life = () => typeof lifeMode === "function" && lifeMode();

  /* ----- o cais do barco: a beira de terra de cada lago, perto de uma ponte ----- */
  const DOCK = {};
  function dockOf(z) {
    if (z in DOCK) return DOCK[z];
    DOCK[z] = null;
    const Z = ZONES[z];
    const L = ((window.LAKES || {})[z] || [])[0];
    if (!Z || !L) return null;
    const cx = (L.x0 + L.x1) / 2;
    let best = null;
    for (let y = L.y0 - 1; y <= L.y1 + 1; y++)
      for (let x = L.x0; x <= L.x1; x++) {
        const c = Z.map[y] && Z.map[y][x];
        if (c !== "." && c !== ",") continue;
        if (!water(z, x, y + 1) && !water(z, x, y - 1)) continue;
        if (!walkable(z, x, y)) continue;
        const d = Math.abs(x - cx) + (c === "," ? 0 : 2);
        if (!best || d < best.d) best = { x, y, d, wy: water(z, x, y + 1) ? y + 1 : y - 1 };
      }
    return (DOCK[z] = best);
  }
  const atDock = (x, y) => {
    const D = dockOf(player.zone);
    return D && D.x === x && D.y === y;
  };

  // o primeiro nome de verdade (sem título: "Príncipe Pedro Max" -> "Pedro")
  const TITLES = /^(Príncipe|Princesa|Rei|Rainha|Duque|Duquesa|General|Professor|Professora|Dona|Seu|Senhor|Senhora|Mestre|Mestra|Sir|Lady|Capitão|Capitã|Irmão|Irmã|Padre|Madre)\s+/i;
  const firstName = (id) => ((NPCS[id] && NPCS[id].nome) || id).replace(TITLES, "").replace(TITLES, "").split(/[ ,]/)[0];
  function partner() {
    const id = player.spouse || player.dating;
    return id && typeof NPCS !== "undefined" && NPCS[id] ? id : null;
  }
  function startBoat(withMate) {
    const D = dockOf(player.zone);
    if (!D) return;
    if (player.gold < 5) return toast("O barqueiro cobra 5 de ouro.", 2000);
    player.gold -= 5;
    B.on = true;
    B.mate = withMate ? partner() : null;
    B.t = 0;
    player.riding = false;
    player.x = D.x;
    player.y = D.wy;
    game.moveCd = 0.3;
    playSound(330, 0.15, "triangle");
    toast(B.mate ? `Você e ${firstName(B.mate)} entram no barco. Reme pela água; na margem, vocês descem.` : "Você entra no barco. Reme pela água; na margem, você desce.", 3400);
  }
  function stopBoat(msg) {
    if (!B.on) return;
    const mins = Math.round(B.t / 60);
    B.on = false;
    if (B.mate && life()) {
      const id = B.mate;
      if (typeof addNeed === "function") (addNeed("fun", 25), addNeed("social", 30));
      if (typeof addRel === "function") addRel(id, 6);
      else if (player.rel) player.rel[id] = (player.rel[id] || 0) + 6;
      say([[NPCS[id].nome, nightAlpha() > 0.4 ? "Remar sob as estrelas com você... foi o melhor passeio da minha vida." : "Que passeio lindo! Vamos voltar outro dia?"]]);
      if (typeof grantTrophy === "function") grantTrophy("barco-romance");
    } else if (msg) toast(msg, 2200);
    B.mate = null;
  }
  window.boatOn = () => B.on;

  /* ----- remar ----- */
  const wkBase = walkable;
  walkable = function (z, x, y) {
    if (B.on && z === player.zone && Math.abs(x - player.x) + Math.abs(y - player.y) === 1 && water(z, x, y)) return true;
    return wkBase.apply(this, arguments);
  };
  const tmBase = tryMove;
  tryMove = function () {
    const r = tmBase.apply(this, arguments);
    if (B.on) {
      game.moveCd = Math.max(game.moveCd || 0, 0.2);
      if (!water(player.zone, player.x, player.y)) stopBoat("Você desce do barco na margem.");
    }
    return r;
  };
  if (typeof updateVilaLife === "function") {
    const uvBase = updateVilaLife;
    updateVilaLife = function (dt) {
      const r = uvBase.apply(this, arguments);
      if (B.on) {
        B.t += dt;
        if (!water(player.zone, player.x, player.y)) stopBoat();
        if (life() && typeof addNeed === "function") addNeed("fun", 0.8 * dt);
      }
      return r;
    };
  }
  const ezBase = enterZone;
  enterZone = function () {
    if (B.on) ((B.on = false), (B.mate = null));
    return ezBase.apply(this, arguments);
  };

  /* ----- desenho: o barco embaixo de você (e quem você ama na proa) ----- */
  function drawBoat(X, Y, t) {
    const bob = Math.sin(t * 2) * 1.2;
    const R = (x, y, w, h, c) => ((ctx.fillStyle = c), ctx.fillRect(Math.round(x), Math.round(y + bob), w, h));
    // rastro na água
    ctx.strokeStyle = "rgba(255,255,255,.45)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(X + 16, Y + 30 + bob, 22, 5, 0, 0, 7);
    ctx.stroke();
    // casco de madeira
    ctx.fillStyle = "#6b4423";
    fillPolygon(X - 8, Y + 18 + bob, X + 40, Y + 18 + bob, X + 34, Y + 30 + bob, X - 2, Y + 30 + bob);
    R(X - 8, Y + 17, 48, 3, "#a8784a");
    R(X - 2, Y + 24, 36, 1, "#4a2e17");
    R(X + 2, Y + 18, 2, 10, "#4a2e17");
    R(X + 28, Y + 18, 2, 10, "#4a2e17");
    // remos
    const a = Math.sin(t * 4) * 0.5;
    ctx.strokeStyle = "#8a5e32";
    ctx.lineWidth = 2;
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(X + 16 + s * 10, Y + 18 + bob);
      ctx.lineTo(X + 16 + s * 26, Y + 30 + bob + a * s * 6);
      ctx.stroke();
    }
  }
  const dsBase = drawSprite;
  drawSprite = function (rects, x, y, u, flip) {
    const me = B.on && !window.__inReflection && player.rx != null && Math.abs(x - player.rx * TILE) < 0.5 && Math.abs(y - player.ry * TILE) < 3 && u === 2;
    if (!me) return dsBase.apply(this, arguments);
    const t = performance.now() / 1000;
    drawBoat(x, y, t);
    // sentado: só o tronco aparece acima da borda
    ctx.save();
    ctx.beginPath();
    ctx.rect(x - 20, y - 60, 80, 78);
    ctx.clip();
    dsBase.call(this, rects, x - 6, y - 2, u, flip);
    ctx.restore();
    if (B.mate && NPCS[B.mate] && typeof wizardRects === "function") {
      const n = NPCS[B.mate];
      ctx.save();
      ctx.beginPath();
      ctx.rect(x - 20, y - 60, 80, 78);
      ctx.clip();
      dsBase.call(this, wizardRects(n.robe, n.hat, n.hair, null, "left"), x + 16, y - 2, u, true);
      ctx.restore();
      // coraçãozinho
      const f = (t * 0.6) % 1;
      ctx.fillStyle = `rgba(255,110,150,${1 - f})`;
      ctx.fillRect(x + 14, y - 14 - f * 16, 4, 3);
      ctx.fillRect(x + 13, y - 15 - f * 16, 2, 2);
      ctx.fillRect(x + 17, y - 15 - f * 16, 2, 2);
    }
  };

  // o barquinho amarrado no cais (quando ninguém está nele)
  const cdBase = crewDrawList;
  crewDrawList = function (list, t) {
    cdBase(list, t);
    const D = ZONES[player.zone] && ZONES[player.zone].town && dockOf(player.zone);
    if (!D) return;
    list.push({
      y: D.y,
      draw: () => {
        const X = D.x * TILE,
          Y = D.y * TILE;
        // tablado do cais
        ctx.fillStyle = "#8a5e32";
        ctx.fillRect(X + 2, Y + 8, 28, 22);
        ctx.fillStyle = "#6b4423";
        for (let i = 0; i < 4; i++) ctx.fillRect(X + 2, Y + 12 + i * 5, 28, 1);
        ctx.fillStyle = "#4a2e17";
        ctx.fillRect(X + 4, Y + 4, 3, 26);
        ctx.fillRect(X + 25, Y + 4, 3, 26);
        // placa
        ctx.fillStyle = "#a8784a";
        ctx.fillRect(X + 8, Y - 4, 16, 8);
        ctx.fillStyle = "#3a2414";
        ctx.fillRect(X + 10, Y - 1, 12, 2);
        if (!B.on) drawBoat(X, (D.wy - 0.5) * TILE, t);
      },
    });
  };

  /* ----- alugar ----- */
  const tgBase = targetAt;
  targetAt = function (x, y) {
    if (atDock(x, y) && !B.on) return "Alugar barco a remo (5 ouro)";
    if (B.on && water(player.zone, x, y)) return null;
    return tgBase.apply(this, arguments);
  };
  const iaBase = interactAt;
  interactAt = function (x, y) {
    if (atDock(x, y) && !B.on) {
      const p = partner();
      const opts = [{ t: "Remar (5 ouro)", icon: "fish", fn: () => startBoat(false) }];
      if (p && life()) opts.unshift({ t: `Levar ${firstName(p)} para um passeio (5 ouro)`, icon: "heart", fn: () => startBoat(true) });
      return choice("Barqueiro do parque", "Um passeio de barco pelo rio do parque. Volte para a margem quando quiser descer.", opts.concat([{ t: "Agora não", fn: null }]));
    }
    if (B.on && water(player.zone, x, y)) return;
    return iaBase.apply(this, arguments);
  };
})();
