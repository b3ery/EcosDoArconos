/**
 * ECOS DO ARCANO — graficos-lindos.js
 * Camadas de luz e cor por cima do mundo, seguindo o que os artistas de
 * pixel art fazem para dar profundidade:
 *  - COR DA HORA (color grading): amanhecer rosado, meio-dia limpo, hora
 *    dourada alaranjada no fim da tarde e noite azulada. A cor entra em
 *    "soft-light", então tinge sem apagar os detalhes.
 *  - RAIOS DE SOL entrando na diagonal (de cima à esquerda, a mesma direção
 *    da luz dos desenhos) de manhã cedo e no fim da tarde.
 *  - SOMBRA DAS NUVENS passando devagar pelo chão. Ficam presas ao mundo e
 *    andam com o vento: não seguem o jogador.
 *  - NOITE DE VERDADE: escuro por padrão, e luz só onde tem fonte. Cada casa
 *    acende as janelas e joga uma poça de luz quente na frente da porta, e o
 *    jogador leva uma lanterninha.
 *  - Vaga-lumes à noite e borboletas de dia (primavera e verão).
 *  - Vinheta suave nos cantos da tela.
 * Na qualidade "Baixa" fica só a cor da hora, para não pesar.
 * Modifica (envolve) drawWeather.
 */

"use strict";

(() => {
  const VH = 480;
  const rnd = (i, k) => {
    const s = Math.sin(i * 127.1 + k * 311.7) * 43758.5453;
    return s - Math.floor(s);
  };
  const lerp = (a, b, f) => a + (b - a) * f;
  const bell = (h, c, w) => Math.max(0, 1 - Math.abs(h - c) / w);

  // cor da hora: [r,g,b,força]
  function grade(h) {
    const dawn = bell(h, 6.6, 1.6),
      gold = bell(h, 17.4, 1.9),
      noon = bell(h, 12.5, 4),
      night = nightAlpha() / 0.62;
    const out = [];
    if (dawn) out.push([255, 140, 130, 0.62 * dawn]);
    if (gold) out.push([255, 130, 30, 0.8 * gold]);
    if (noon) out.push([255, 236, 200, 0.18 * noon]);
    if (night > 0.05) out.push([70, 90, 190, 0.45 * night]);
    return out;
  }

  // vinheta: guardada e refeita só quando a tela muda de tamanho
  let vig = null,
    vigW = 0;
  function vignette() {
    if (!vig || vigW !== viewWidth) {
      vigW = viewWidth;
      vig = ctx.createRadialGradient(viewWidth / 2, VH / 2, VH * 0.45, viewWidth / 2, VH / 2, viewWidth * 0.75);
      vig.addColorStop(0, "rgba(10,6,20,0)");
      vig.addColorStop(1, "rgba(10,6,20,.34)");
    }
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, viewWidth, VH);
  }

  function sunRays(t, h, cam) {
    const k = Math.max(bell(h, 7, 1.6), bell(h, 17.2, 1.6));
    const w = player.weather || "sol";
    if (k <= 0 || !(w === "sol" || w === "nublado")) return;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    const warm = h > 12 ? "255,190,110" : "255,215,190";
    for (let i = 0; i < 6; i++) {
      // os raios ficam presos ao mundo: andam junto com o cenário
      const wx = (i * 380 + rnd(i, 1) * 200) % 2400;
      const sx = ((wx - cam.camX * 0.6) % 2400 + 2400) % 2400 - 400;
      const a = k * (0.1 + 0.04 * Math.sin(t * 0.4 + i)) * (w === "nublado" ? 0.5 : 1);
      const bw = 50 + rnd(i, 2) * 90;
      const g = ctx.createLinearGradient(sx, 0, sx + 260, VH);
      g.addColorStop(0, `rgba(${warm},${a})`);
      g.addColorStop(1, `rgba(${warm},0)`);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(sx, -10);
      ctx.lineTo(sx + bw, -10);
      ctx.lineTo(sx + bw + 300, VH + 10);
      ctx.lineTo(sx + 300, VH + 10);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  function cloudShadows(t, z, cam) {
    const w = player.weather || "sol";
    if (nightAlpha() > 0.3 || w === "neblina") return;
    const Z = cam.Z,
      WW = z.w * 32 + 1200,
      HH = z.h * 32 + 600;
    const n = w === "nublado" || w === "chuva" ? 9 : 5;
    ctx.save();
    for (let i = 0; i < n; i++) {
      let wx = rnd(i, 3) * WW + t * (10 + rnd(i, 4) * 8),
        wy = rnd(i, 5) * HH + t * 3;
      wx = (wx % WW) - 600;
      wy = (wy % HH) - 300;
      const sx = (wx - cam.camX) * Z,
        sy = (wy - cam.camY) * Z,
        r = (160 + rnd(i, 6) * 180) * Z;
      if (sx < -r * 1.6 || sx > viewWidth + r * 1.6 || sy < -r || sy > VH + r) continue;
      const g = ctx.createRadialGradient(sx, sy, r * 0.2, sx, sy, r);
      g.addColorStop(0, "rgba(20,30,60,.13)");
      g.addColorStop(1, "rgba(20,30,60,0)");
      ctx.fillStyle = g;
      ctx.save();
      ctx.translate(sx, sy);
      ctx.scale(1.6, 0.8);
      ctx.translate(-sx, -sy);
      ctx.fillRect(sx - r, sy - r, r * 2, r * 2);
      ctx.restore();
    }
    ctx.restore();
  }

  function nightLights(t, z, cam, psx, psy) {
    const nA = nightAlpha();
    if (nA < 0.15) return;
    const Z = cam.Z,
      k = Math.min(1, nA / 0.5);
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    const pool = (sx, sy, r, a, col) => {
      const g = ctx.createRadialGradient(sx, sy, 1, sx, sy, r);
      g.addColorStop(0, `rgba(${col},${a})`);
      g.addColorStop(1, `rgba(${col},0)`);
      ctx.fillStyle = g;
      ctx.fillRect(sx - r, sy - r, r * 2, r * 2);
    };
    if (z.town && z.town.bld) {
      const empty = typeof lotLives === "function";
      for (const b of z.town.bld) {
        const sx = (b.x * 32 + (b.w * 32) / 2 - cam.camX) * Z,
          sy = ((b.y + b.h) * 32 - cam.camY) * Z;
        if (sx < -200 || sx > viewWidth + 200 || sy < -120 || sy > VH + 260) continue;
        if (b.lot && empty && typeof LOTES !== "undefined") {
          const L = LOTES.lots.find((q) => q.b === b);
          if (L && !lotLives(L) && !(player.houses || []).includes(`${L.zid}:${b.door[0]},${b.y + b.h - 1}`)) continue; // casa vazia fica no escuro
        }
        const flick = 0.85 + 0.15 * Math.sin(t * 7 + b.x * 3) * Math.sin(t * 3.1 + b.y);
        // janelas acesas no meio da fachada e a poça de luz na porta
        pool(sx, sy - 40 * Z, b.w * 18 * Z, 0.16 * k * flick, "255,170,80");
        const dx = (b.door[0] * 32 + 16 - cam.camX) * Z;
        pool(dx, sy + 10 * Z, 46 * Z, 0.3 * k * flick, "255,190,100");
      }
    }
    // a lanterninha do jogador
    pool(psx, psy, 110 * Z, 0.2 * k, "255,200,130");
    ctx.restore();
  }

  // vaga-lumes e borboletas, presos ao mundo em volta da câmera
  function critters(t, cam, th) {
    const night = nightAlpha() > 0.3;
    const sid = typeof season === "function" ? season().id : "pri";
    const w = player.weather || "sol";
    if (w === "chuva" || w === "tempestade" || w === "neve" || th === "picos") return;
    const Z = cam.Z;
    const cx = Math.floor(cam.camX / 320),
      cy = Math.floor(cam.camY / 320);
    for (let gx = cx - 1; gx <= cx + Math.ceil(viewWidth / Z / 320) + 1; gx++)
      for (let gy = cy - 1; gy <= cy + Math.ceil(VH / Z / 320) + 1; gy++) {
        const cell = gx * 7919 + gy * 104729;
        if (night) {
          for (let i = 0; i < 3; i++) {
            const ph = rnd(cell, i) * 6.28;
            const wx = gx * 320 + rnd(cell, i + 10) * 320 + Math.sin(t * 0.6 + ph) * 26,
              wy = gy * 320 + rnd(cell, i + 20) * 320 + Math.cos(t * 0.45 + ph) * 18;
            const a = Math.max(0, Math.sin(t * 2 + ph * 3));
            if (a < 0.1) continue;
            const sx = (wx - cam.camX) * Z,
              sy = (wy - cam.camY) * Z;
            ctx.fillStyle = `rgba(200,255,120,${0.15 * a})`;
            ctx.beginPath();
            ctx.arc(sx, sy, 6 * Z, 0, 7);
            ctx.fill();
            ctx.fillStyle = `rgba(230,255,160,${0.9 * a})`;
            ctx.fillRect(sx - Z, sy - Z, 2 * Z, 2 * Z);
          }
        } else if (sid === "pri" || sid === "ver") {
          if (rnd(cell, 99) < 0.45) continue;
          const ph = rnd(cell, 1) * 6.28;
          const wx = gx * 320 + 160 + Math.sin(t * 0.35 + ph) * 120 + Math.sin(t * 1.3 + ph) * 20,
            wy = gy * 320 + 160 + Math.cos(t * 0.27 + ph) * 90 + Math.sin(t * 2.1) * 6;
          const sx = (wx - cam.camX) * Z,
            sy = (wy - cam.camY) * Z;
          const flap = Math.abs(Math.sin(t * 14 + ph));
          const col = ["#f6f2ea", "#f2c14e", "#e86a8a", "#9ac8ff"][Math.floor(rnd(cell, 2) * 4)];
          ctx.fillStyle = "rgba(0,0,0,.12)";
          ctx.fillRect(sx - 2 * Z, sy + 14 * Z, 4 * Z, Z);
          ctx.fillStyle = col;
          const ww = (1 + flap * 2) * Z;
          ctx.fillRect(sx - ww - Z * 0.5, sy - Z, ww, 2 * Z);
          ctx.fillRect(sx + Z * 0.5, sy - Z, ww, 2 * Z);
          ctx.fillStyle = "#3a2a1a";
          ctx.fillRect(sx - Z * 0.5, sy - 1.5 * Z, Z, 3 * Z);
        }
      }
  }

  const base = drawWeather;
  drawWeather = function (t, th, psx, psy) {
    const z = ZONES[player.zone];
    const cam = game.cam;
    const hi = typeof currentQuality !== "function" || currentQuality().ambience !== false;
    const out = outdoorTheme(th);
    if (out && cam && game.mode !== "battle") {
      if (hi) cloudShadows(t, z, cam);
      if (hi) nightLights(t, z, cam, psx, psy);
    }
    base.apply(this, arguments);
    if (out && cam && game.mode !== "battle") {
      if (hi) critters(t, cam, th);
      const h = currentHour();
      ctx.save();
      ctx.globalCompositeOperation = "soft-light";
      for (const [r, g, b, a] of grade(h)) {
        ctx.fillStyle = `rgba(${r},${g},${b},${a})`;
        ctx.fillRect(0, 0, viewWidth, VH);
      }
      // a hora dourada também esquenta as sombras (sombra puxando pro roxo, luz pro laranja)
      const gk = bell(h, 17.4, 1.9);
      if (gk > 0) {
        ctx.globalCompositeOperation = "multiply";
        ctx.fillStyle = `rgba(255,214,190,${0.35 * gk})`;
        ctx.fillRect(0, 0, viewWidth, VH);
      }
      ctx.restore();
      if (hi) sunRays(t, h, cam);
    }
    if (hi) vignette();
  };
})();
