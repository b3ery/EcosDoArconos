/**
 * ECOS DO ARCANO — nadar.js
 * Nadar de verdade, no rio, nos lagos e no mar das cidades:
 *  - "Nadar" na beira da água coloca você DENTRO da água; você controla o
 *    nado com as mesmas teclas/toque de andar (mais devagar que a pé).
 *    Sair para a terra (ou píer) termina o nado.
 *  - FÔLEGO: a barra azul acima da cabeça. Perto da margem cansa pouco e
 *    dá para recuperar o fôlego encostado na beira; no fundo (longe da
 *    terra) cansa rápido, mais ainda no inverno, na chuva e na tempestade.
 *  - AFOGAMENTO: sem fôlego, a vida cai. No Simulador você pode morrer
 *    afogad(o); no modo História um pescador te puxa para a margem.
 *  - TUBARÕES: só no MAR (Porto, Solmar e os portos de outros países), e
 *    só no fundo. Primeiro aparece a barbatana rondando; se chegar em você,
 *    morde. Fuja para o raso ou para o píer!
 *  - Nadar diverte, limpa e cansa (Simulador).
 * Modifica (envolve) walkable, tryMove, updateVilaLife e drawSprite.
 */

"use strict";

(() => {
  const S = (game.swim = game.swim || { on: false, breath: 100, shark: null, warnT: 0, splash: [] });
  const T = (x, y) => tileAt(player.zone, x, y);
  const wet = (x, y) => T(x, y) === "~";
  const isSea = () => ZONES[player.zone] && ZONES[player.zone].theme === "porto";
  const life = () => typeof lifeMode === "function" && lifeMode();
  const cold = () => typeof season === "function" && season().id === "inv";
  const storm = () => ["chuva", "tempestade", "neve"].includes(player.weather || "sol");
  // distância até a terra mais perto (0 = encostado na margem)
  const dirtyNow = () => typeof riverDirty === "function" && riverDirty();
  const shoreDist = (x, y) => {
    for (let r = 1; r <= 6; r++)
      for (let dy = -r; dy <= r; dy++)
        for (let dx = -r; dx <= r; dx++) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
          const c = T(x + dx, y + dy);
          if (c !== null && c !== "~" && c !== "#") return r - 1;
        }
    return 6;
  };

  // DEATHS ganha o tubarão (o afogamento já existe em mortes.js)
  if (typeof DEATHS !== "undefined" && !DEATHS.tubarao)
    DEATHS.aguasuja = { n: "Água podre", t: "Morreu da febre do rio sujo", env: "rio", fx: "bolhas", water: 1, epi: "Nadou onde a vila jogava o lixo.", padre: "Quando o reino não limpa o rio, o rio cobra de quem entra nele.", how: "Nadar no rio sujo (com a limpeza da vila baixa)." };
  if (typeof DEATHS !== "undefined" && !DEATHS.tubarao)
    DEATHS.tubarao = { n: "Tubarão", t: "Atacad{o} por um tubarão no mar", env: "rio", fx: "bolhas", water: 1, epi: "O mar tem dono.", padre: "Quem nada no fundo do mar nada na casa do tubarão.", how: "Nadar no fundo do mar e não fugir da barbatana." };

  window.startSwim = function (x, y) {
    if (!wet(x, y)) return;
    S.on = true;
    S.breath = 100;
    S.shark = null;
    player.riding = false;
    player.x = x;
    player.y = y;
    game.moveCd = 0.3;
    playSound(300, 0.2, "sine");
    if (dirtyNow()) return toast("Você entra na água... ela fede, está turva e cheia de lixo. Isto pode te matar! Saia logo.", 3600);
    toast(isSea() ? "Você mergulha no mar! Fôlego na barra azul. Cuidado com o fundo: lá tem tubarão." : "Você entra na água! Fôlego na barra azul. Volte para a margem para descansar.", 3600);
  };
  function stopSwim(msg) {
    S.on = false;
    S.shark = null;
    if (msg) toast(msg, 2400);
  }

  // dentro da água: dá para nadar para qualquer água vizinha
  const wkBase = walkable;
  walkable = function (z, x, y) {
    if (S.on && z === player.zone && Math.abs(x - player.x) + Math.abs(y - player.y) === 1 && wet(x, y)) return true;
    return wkBase.apply(this, arguments);
  };
  // nadar é mais devagar que andar; sair da água termina o nado
  const tmBase = tryMove;
  tryMove = function () {
    const r = tmBase.apply(this, arguments);
    if (S.on) {
      game.moveCd = Math.max(game.moveCd || 0, 0.27);
      if (!wet(player.x, player.y)) stopSwim("Você sai da água, pingando.");
      else S.splash.push({ x: player.x, y: player.y, t: 0.5 });
    }
    return r;
  };

  function drown() {
    stopSwim();
    if (life() && typeof playerDies === "function" && playerDies("afogamento")) return;
    rescue("Tudo fica escuro... Um pescador te puxa pelos cabelos até a margem. Você tosse água por meia hora.");
  }
  function sharkDeath() {
    stopSwim();
    if (life() && typeof playerDies === "function" && playerDies("tubarao")) return;
    rescue("O tubarão te arrasta... Um barco de pesca chega batendo os remos e te tira da água, sangrando.");
  }
  function rescue(txt) {
    // leva para a terra mais perto
    let best = null;
    for (let r = 1; r < 30 && !best; r++)
      for (let dy = -r; dy <= r && !best; dy++)
        for (let dx = -r; dx <= r && !best; dx++) {
          const x = player.x + dx,
            y = player.y + dy;
          if (!wet(x, y) && wkBase(player.zone, x, y)) best = [x, y];
        }
    if (best) [player.x, player.y] = best;
    player.rx = player.x;
    player.ry = player.y;
    player.hp = Math.max(1, Math.round((typeof maxHp === "function" ? maxHp() : 60) * 0.15));
    const lost = Math.floor(player.gold * 0.1);
    player.gold -= lost;
    game.fade = 1;
    say([["", txt + (lost ? ` Na confusão, ${lost} de ouro afundaram com a sua bolsa.` : "")]]);
  }

  // o nado, quadro a quadro
  const uvBase = updateVilaLife;
  updateVilaLife = function (dt) {
    const r = uvBase.apply(this, arguments);
    if (!S.on) return r;
    if (!wet(player.x, player.y)) return stopSwim(), r;
    if (game.mode !== "world" || game.dialog) return r;
    const d = shoreDist(player.x, player.y);
    const deep = d >= 3;
    // fôlego
    let drain = d === 0 ? -9 : deep ? 7 : 3;
    if (drain > 0 && cold()) drain *= 1.6;
    if (drain > 0 && storm()) drain *= 1.5;
    S.breath = Math.max(0, Math.min(100, S.breath - drain * dt));
    S.warnT -= dt;
    if (S.breath < 30 && S.breath > 0 && S.warnT <= 0) ((S.warnT = 4), toast("Pouco fôlego! Nade para a margem!", 1800), playSound(220, 0.1, "square"));
    if (S.breath <= 0) {
      player.hp -= 9 * dt;
      if (S.warnT <= 0) ((S.warnT = 2.5), toast("Você está se afogando!", 1600), playSound(140, 0.2, "sawtooth"));
      if (player.hp <= 1.5) return drown(), r;
    }
    // rio sujo: a água podre adoece e mata (quanto mais suja, mais rápido)
    if (dirtyNow()) {
      const lv = typeof riverDirtyLevel === "function" ? riverDirtyLevel() : 0.5;
      S.dirtyT = (S.dirtyT || 0) + dt;
      player.hp -= (2 + 4 * lv) * dt;
      if (typeof addNeed === "function") addNeed("hygiene", -4 * dt);
      if (!player.sick && S.dirtyT > 2 && typeof getSick === "function") (getSick(Math.random() < 0.5 ? "disenteria" : "intox"), toast("A água podre te fez mal! Você está doente.", 2600));
      if (S.warnT <= 0) ((S.warnT = 3), toast("Água suja! Cada segundo aqui te envenena. Saia da água!", 2000), playSound(160, 0.15, "square"));
      if (player.hp <= 1.5) {
        stopSwim();
        if (life() && typeof playerDies === "function" && playerDies("aguasuja")) return r;
        rescue("A febre da água podre te derruba. Alguém te arrasta para fora do rio.");
        return r;
      }
    } else S.dirtyT = 0;
    // Simulador: diverte, limpa e cansa
    if (life() && typeof addNeed === "function" && !dirtyNow()) {
      addNeed("fun", 1.4 * dt);
      addNeed("hygiene", 1.2 * dt);
      addNeed("energy", -0.5 * dt);
    }
    // tubarão: só no mar, só no fundo
    if (isSea()) {
      if (!S.shark && deep && Math.random() < dt * 0.05) {
        for (let k = 0; k < 20 && !S.shark; k++) {
          const a = Math.random() * 6.28,
            sx = player.x + Math.cos(a) * 7,
            sy = player.y + Math.sin(a) * 7;
          if (wet(Math.round(sx), Math.round(sy))) S.shark = { x: sx, y: sy, a, cool: 0, circ: 3 + Math.random() * 3 };
        }
        if (S.shark) (toast("Uma barbatana corta a água... TUBARÃO! Fuja para o raso!", 3000), playSound(110, 0.4, "sawtooth"));
      }
      const sh = S.shark;
      if (sh) {
        sh.cool -= dt;
        sh.circ -= dt;
        const px = player.rx ?? player.x,
          py = player.ry ?? player.y;
        let dx = px - sh.x,
          dy = py - sh.y;
        const dist = Math.hypot(dx, dy) || 1;
        // primeiro ronda; depois vem direto. No raso ele desiste.
        if (d <= 1 && dist > 2) {
          sh.x -= (dx / dist) * dt * 2;
          sh.y -= (dy / dist) * dt * 2;
          if (dist > 9) S.shark = null;
        } else {
          let vx, vy;
          if (sh.circ > 0 || sh.cool > 0) ((vx = -dy / dist), (vy = dx / dist));
          else ((vx = dx / dist), (vy = dy / dist));
          const sp = sh.circ > 0 || sh.cool > 0 ? 2.2 : 3;
          const nx = sh.x + vx * sp * dt,
            ny = sh.y + vy * sp * dt;
          if (wet(Math.round(nx), Math.round(ny))) ((sh.x = nx), (sh.y = ny));
          else sh.circ = 0;
          sh.a = Math.atan2(vy, vx);
          if (dist < 0.7 && sh.cool <= 0) {
            const dmg = Math.round((typeof maxHp === "function" ? maxHp() : 60) * 0.35);
            player.hp -= dmg;
            sh.cool = 3;
            sh.circ = 2;
            game.shake = 0.4;
            playSound(90, 0.4, "sawtooth");
            toast(`O tubarão morde! (−${dmg} de vida)`, 2000);
            S.splash.push({ x: player.x, y: player.y, t: 1, blood: 1 });
            if (player.hp <= 1.5) return sharkDeath(), r;
          }
        }
      }
    }
    for (const s of S.splash) s.t -= dt;
    S.splash = S.splash.filter((s) => s.t > 0);
    return r;
  };

  // desenho: só a cabeça e os ombros para fora d'água, ondinhas, fôlego e o tubarão
  const dsBase = drawSprite;
  drawSprite = function (rects, x, y, u, flip) {
    const me = S.on && player.rx != null && Math.abs(x - player.rx * TILE) < 0.5 && Math.abs(y - player.ry * TILE) < 3 && u === 2;
    if (!me) return dsBase.apply(this, arguments);
    const t = performance.now() / 1000;
    const sink = 12 + Math.sin(t * 3) * 1.5;
    ctx.save();
    ctx.beginPath();
    ctx.rect(x - 16, y - 40 + sink, TILE + 32, 40 + 18);
    ctx.clip();
    dsBase.call(this, rects, x, y + sink, u, flip);
    ctx.restore();
    // anel de água em volta
    ctx.strokeStyle = "rgba(235,248,255,.8)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(x + 16, y + sink + 18, 13 + Math.sin(t * 4) * 1.5, 4, 0, 0, 7);
    ctx.stroke();
    // respingos
    for (const s of S.splash) {
      const k = 1 - s.t / (s.blood ? 1 : 0.5);
      ctx.strokeStyle = s.blood ? `rgba(170,20,20,${0.7 * (1 - k)})` : `rgba(255,255,255,${0.6 * (1 - k)})`;
      ctx.beginPath();
      ctx.ellipse(s.x * TILE + 16, s.y * TILE + 30, 8 + k * 18, 3 + k * 6, 0, 0, 7);
      ctx.stroke();
    }
    // barra de fôlego
    const bx = x + 2,
      by = y + sink - 14;
    ctx.fillStyle = "rgba(10,20,40,.7)";
    ctx.fillRect(bx - 1, by - 1, 30, 6);
    ctx.fillStyle = S.breath > 30 ? "#6ac8ff" : S.breath > 0 ? "#ffb04a" : "#ff4a4a";
    ctx.fillRect(bx, by, Math.round(28 * (S.breath / 100)), 4);
    // o tubarão (barbatana e rastro); de perto aparece a sombra do corpo
    const sh = S.shark;
    if (sh) {
      const X = sh.x * TILE + 16,
        Y = sh.y * TILE + 20,
        dist = Math.hypot(sh.x - player.rx, sh.y - player.ry);
      if (dist < 3) {
        ctx.fillStyle = "rgba(20,30,50,.35)";
        ctx.beginPath();
        ctx.ellipse(X - Math.cos(sh.a) * 10, Y + 6 - Math.sin(sh.a) * 4, 26, 8, sh.a, 0, 7);
        ctx.fill();
      }
      ctx.strokeStyle = "rgba(255,255,255,.7)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(X - Math.cos(sh.a) * 22, Y + 6 - Math.sin(sh.a) * 8);
      ctx.lineTo(X, Y + 6);
      ctx.stroke();
      ctx.fillStyle = "#4a5866";
      const f = Math.cos(sh.a) >= 0 ? 1 : -1;
      ctx.beginPath();
      ctx.moveTo(X - 7 * f, Y + 6);
      ctx.lineTo(X + 5 * f, Y - 12);
      ctx.lineTo(X + 8 * f, Y + 6);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#6a7a88";
      ctx.fillRect(X - 3 * f, Y - 2, 2, 6);
    }
  };
  // nadando, a água em volta não é "alvo" (sem "Beber água" piscando na tela)
  const tgBase = targetAt;
  targetAt = function (x, y) {
    if (S.on && wet(x, y)) return null;
    return tgBase.apply(this, arguments);
  };
  // trocar de zona ou dormir: sai da água
  const ezBase = enterZone;
  enterZone = function () {
    if (S.on) stopSwim();
    return ezBase.apply(this, arguments);
  };
  window.SWIM = S;
})();
