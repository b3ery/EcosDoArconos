/**
 * ECOS DO ARCANO — reflexos-e-sombras.js
 * Acabamento gráfico (qualidade Média para cima):
 *  - REFLEXO NA ÁGUA: tudo o que fica na beira do rio, do lago e do mar
 *    (prédios, castelos, árvores, pessoas, barcos, você) aparece espelhado
 *    na água, de cabeça para baixo, só por cima da água, com ondulação
 *    (faixas que balançam), mais apagado quanto mais longe da margem e com
 *    o tom do céu (dourado ao pôr do sol, azul-escuro à noite).
 *  - BRILHO DO SOL na água: faiscas que piscam na direção do sol, e de noite
 *    o reflexo das janelas acesas e dos lampiões.
 *  - SOMBRAS QUE SEGUEM O SOL: pessoas, árvores, lampiões e postes jogam uma
 *    sombra alongada para o lado contrário do sol (comprida de manhã e no
 *    fim da tarde, curtinha ao meio-dia; à noite, só a sombra redonda).
 * Na qualidade Baixa nada disso é desenhado; na Média, só sombras e brilho
 * (o reflexo fica para Alta e Ultra).
 * Modifica (envolve) drawTile; e é chamado por drawWorld (drawReflections).
 */

"use strict";

(() => {
  const low = () => typeof currentQuality === "function" && typeof QUALITY !== "undefined" && currentQuality() === QUALITY.baixa;
  const wet = (z, x, y) => {
    const c = tileAt(z, x, y);
    return c === "~";
  };
  // cor do céu refletido pela hora do dia
  function skyTint() {
    const h = typeof currentHour === "function" ? currentHour() : 12;
    const n = typeof nightAlpha === "function" ? nightAlpha() : 0;
    if (n > 0.5) return [20, 30, 70, 0.18];
    if (h < 7.5) return [120, 170, 235, 0.16];
    if (h > 17) return [90, 140, 220, 0.2];
    return [200, 230, 255, 0.1];
  }

  /* ----- REFLEXOS ----- */
  const R_ = {};
  // só a forma da coisa (sem o chão do bloco): lampião ou copa da árvore
  function propShape(x, y, c, t) {
    const X = x * TILE,
      Y = y * TILE;
    if (c === "l") {
      const lit = typeof nightAlpha === "function" && nightAlpha() > 0.1;
      ctx.fillStyle = "#2a2a30";
      ctx.fillRect(X + 11, Y + 26, 10, 4);
      ctx.fillRect(X + 15, Y + 2, 2, 24);
      ctx.fillRect(X + 10, Y - 6, 12, 2);
      ctx.fillRect(X + 10, Y + 5, 12, 2);
      ctx.fillStyle = lit ? "rgba(255,214,107,.95)" : "#cfd8e0";
      ctx.fillRect(X + 12, Y - 4, 8, 9);
    } else {
      ctx.fillStyle = "#5a3a22";
      ctx.fillRect(X + 13, Y + 14, 6, 16);
      ctx.fillStyle = "#3f7a34";
      ctx.beginPath();
      ctx.ellipse(X + 16, Y + 4, 15, 14, 0, 0, 7);
      ctx.fill();
      ctx.fillStyle = "#5a9a44";
      ctx.beginPath();
      ctx.ellipse(X + 12, Y, 8, 7, 0, 0, 7);
      ctx.fill();
    }
  }
  // desenha só a coisa do tile (árvore, lampião), sem o chão e sem o caminho
  function propOnly(z, x, y, c, t) {
    const g0 = window.ground,
      p0 = window.drawPathTile,
      c0 = window.cobble;
    window.ground = () => {};
    window.drawPathTile = () => {};
    window.cobble = () => {};
    try {
      dtBase(z, x, y, c, t);
    } finally {
      window.ground = g0;
      window.drawPathTile = p0;
      window.cobble = c0;
    }
  }
  // cada coisa que tem água logo abaixo dela (até 3 blocos) ganha reflexo
  window.drawReflections = function (list, t, x0, y0, x1, y1) {
    if (low() || (typeof QUALITY !== "undefined" && currentQuality() === QUALITY.media)) return;
    const z = player.zone,
      Z = ZONES[z];
    if (!Z || !Z.map || Z.theme === "interior" || z === "casa") return;
    // a área de água na tela vira uma máscara (clip) para o reflexo
    // a água da tela em faixas (uma por trecho de cada linha): máscara leve
    const water = [];
    for (let y = y0; y <= y1; y++) {
      let s0 = -1;
      for (let x = x0; x <= x1 + 1; x++) {
        const w = x <= x1 && wet(z, x, y);
        if (w && s0 < 0) s0 = x;
        if (!w && s0 >= 0) (water.push([s0, y, x - s0]), (s0 = -1));
      }
    }
    if (!water.length) return;
    const nearWater = (bx, by, w) => {
      for (let dy = 1; dy <= 4; dy++) for (let dx = 0; dx < Math.max(1, w); dx++) if (wet(z, Math.floor(bx + dx), Math.floor(by + dy))) return true;
      return false;
    };
    const items = [];
    for (const it of list) {
      // descobre onde está a coisa: prédio (b), pessoa (x,y) ou tile solto
      const yy = it.y + 1;
      let bx = it.rx ?? it.x,
        w = it.w || 1;
      if (bx === undefined) {
        // pela posição do item nos prédios da cidade
        const b = Z.town && Z.town.bld.find((q) => Math.abs(q.y + q.h - 1.01 - it.y) < 0.02);
        if (b) ((bx = b.x), (w = b.w));
      }
      if (bx === undefined) {
        // pessoa: o jogador, ou quem anda pela cidade (pela linha e pela coluna dos andarilhos)
        if (Math.abs(it.y - player.ry) < 0.01) ((bx = player.rx), (w = 1));
        else {
          const wk = (game.walkers || []).find((q) => Math.abs((q.ry ?? q.y) - it.y) < 0.01);
          if (wk) ((bx = wk.rx ?? wk.x), (w = 1));
          else continue;
        }
      }
      if (nearWater(bx, Math.floor(yy) - 1, w)) items.push({ it, by: yy, bx, w });
    }
    for (let y = y0; y <= y1; y++)
      for (let x = x0; x <= x1; x++) {
        const c = Z.map[y] && Z.map[y][x];
        if (!"Tl".includes(c || "_") || !(wet(z, x, y + 1) || wet(z, x, y + 2))) continue;
        items.push({ it: { draw: () => propShape(x, y, c, t) }, by: y + 1, bx: x, w: 1 });
      }
    if (!items.length) return;
    // o espelho é desenhado numa imagem guardada (a cada 3 quadros ou se a câmera andou);
    // a ondulação usa essa imagem em todo quadro (fica leve)
    const T0 = ctx.getTransform();
    const cam = game.cam || { camX: 0, camY: 0 };
    const key = player.zone + ":" + cam.camX + ":" + cam.camY;
    R_.n = (R_.n || 0) + 1;
    if (!R_.c || R_.c.width !== canvas.width || R_.c.height !== canvas.height) {
      R_.c = document.createElement("canvas");
      R_.c.width = canvas.width;
      R_.c.height = canvas.height;
      R_.g = R_.c.getContext("2d");
      R_.key = null;
    }
    if (R_.key !== key || R_.n % 4 === 0) {
      R_.key = key;
      const g = R_.g;
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.clearRect(0, 0, R_.c.width, R_.c.height);
      g.setTransform(T0);
      g.imageSmoothingEnabled = false;
      const main = ctx;
      ctx = g;
      try {
        for (const { it, by, bx, w } of items) {
          const baseY = by * TILE;
          ctx.save();
          ctx.translate(0, 2 * baseY + 2);
          ctx.scale(1, -1);
          try {
            it.draw();
          } catch (e) {}
          ctx.restore();
          // apaga no fundo (o reflexo some com a profundidade)
          ctx.save();
          ctx.globalCompositeOperation = "destination-out";
          // a água começa algumas linhas abaixo (areia, margem): o degradê começa nela
          let wr = Math.floor(by);
          while (wr < Math.floor(by) + 5 && !wet(z, Math.floor(bx + w / 2), wr)) wr++;
          const fy = wr * TILE;
          const fade = ctx.createLinearGradient(0, fy, 0, fy + 280);
          fade.addColorStop(0, "rgba(0,0,0,0)");
          fade.addColorStop(1, "rgba(0,0,0,1)");
          ctx.fillStyle = fade;
          ctx.fillRect((bx - 1.5) * TILE, fy, (w + 3) * TILE, 290);
          ctx.restore();
        }
      } finally {
        ctx = main;
      }
    }
    // cola o espelho só por cima da água, em faixas que balançam
    ctx.save();
    ctx.beginPath();
    for (const [x, y, n] of water) ctx.rect(x * TILE, y * TILE, n * TILE, TILE);
    ctx.clip();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 0.72;
    // só as linhas da tela que têm água (em pixels de verdade)
    let wy0 = 1e9,
      wy1 = -1e9,
      wx0 = 1e9,
      wx1 = -1e9;
    for (const [x, y, n] of water) {
      wy0 = Math.min(wy0, y * TILE);
      wy1 = Math.max(wy1, (y + 1) * TILE);
      wx0 = Math.min(wx0, x * TILE);
      wx1 = Math.max(wx1, (x + n) * TILE);
    }
    const py0 = Math.max(0, Math.floor(T0.d * wy0 + T0.f)),
      py1 = Math.min(R_.c.height, Math.ceil(T0.d * wy1 + T0.f)),
      px0 = Math.max(0, Math.floor(T0.a * wx0 + T0.e) - 8),
      px1 = Math.min(R_.c.width, Math.ceil(T0.a * wx1 + T0.e) + 8);
    const band = Math.max(6, Math.round(8 * (T0.d || 1)));
    for (let sy = py0; sy < py1 && px1 > px0; sy += band) {
      const wob = Math.round(Math.sin(t * 2.2 + sy * 0.045) * 1.6 * (T0.a || 1));
      const hb = Math.min(band, py1 - sy);
      ctx.drawImage(R_.c, px0, sy, px1 - px0, hb, px0 + wob, sy, px1 - px0, hb);
    }
    ctx.setTransform(T0);
    // o reflexo pega a cor do céu e da água por cima (fica "dentro" d'água)
    ctx.globalAlpha = 1;
    const [r, g, b, a] = skyTint();
    ctx.fillStyle = `rgba(${r},${g},${b},${a})`;
    for (const [x, y, n] of water) ctx.fillRect(x * TILE, y * TILE, n * TILE, TILE);
    ctx.restore();
  };

  /* ----- BRILHO NA ÁGUA e SOMBRAS QUE SEGUEM O SOL ----- */
  const sun = () => {
    const h = typeof currentHour === "function" ? currentHour() : 12;
    if (h < 5.5 || h > 19.5 || (typeof nightAlpha === "function" && nightAlpha() > 0.45)) return null;
    const f = (h - 12.5) / 7; // -1 de manhã (sol a leste), +1 à tarde (sol a oeste)
    return { dx: -f, len: 0.4 + Math.abs(f) * 1.4, a: 0.2 };
  };
  const TALL = { T: 1.6, l: 1.5, W: 0.7, b: 0.4, k: 0.9, x: 0.7 };
  const dtBase = drawTile;
  drawTile = function (z, x, y, c, t) {
    const S = !low() && ZONES[z] && ZONES[z].theme !== "interior" ? sun() : null;
    // sombra alongada embaixo do que é alto (desenhada antes, fica no chão)
    if (S && TALL[c]) {
      const X = x * TILE + 16,
        Y = y * TILE + 28,
        L = TALL[c] * 22 * S.len;
      ctx.save();
      ctx.translate(X, Y);
      ctx.transform(1, 0, S.dx * 0.9, 0.35, 0, 0);
      const g = ctx.createLinearGradient(0, 0, 0, -L);
      g.addColorStop(0, `rgba(15,12,30,${S.a + 0.05})`);
      g.addColorStop(1, "rgba(15,12,30,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(0, -L / 2, c === "T" ? 11 : 5, L / 2, 0, 0, 7);
      ctx.fill();
      ctx.restore();
    }
    const r = dtBase.apply(this, arguments);
    if (c === "~" && !low() && ZONES[z]) {
      const X = x * TILE,
        Y = y * TILE;
      const h = (x * 928371 + y * 1237) % 997;
      const hh = typeof currentHour === "function" ? currentHour() : 12;
      if (S && (hh > 16.8 || hh < 7.2)) {
        // pôr/nascer do sol: o caminho dourado do sol na água
        const k = ((x * 31 + ((t * 0.6) | 0)) % 5) / 5;
        ctx.fillStyle = `rgba(255,190,110,${0.18 + 0.1 * Math.sin(t * 1.3 + x)})`;
        ctx.fillRect(X, Y + 6 + k * 18, TILE, 2);
        ctx.fillStyle = "rgba(255,140,170,.08)";
        ctx.fillRect(X, Y, TILE, TILE);
      }
      if (S) {
        // faíscas do sol: piscam e escorregam devagar
        for (let i = 0; i < 2; i++) {
          const ph = (t * (0.9 + i * 0.3) + h * 0.013 + i * 2.1) % 3;
          if (ph > 0.9) continue;
          const a = Math.sin((ph / 0.9) * Math.PI);
          const sx = X + ((h * (i + 3)) % 26) + 3 + S.dx * 3,
            sy = Y + ((h * (i + 7)) % 24) + 4;
          ctx.fillStyle = `rgba(255,252,230,${0.75 * a})`;
          ctx.fillRect(sx - 2, sy, 5, 1);
          ctx.fillRect(sx, sy - 1, 1, 3);
        }
      } else if (typeof nightAlpha === "function" && nightAlpha() > 0.45 && h % 7 === 0) {
        // à noite: brilho da lua e das janelas acesas na água
        const a = 0.25 + 0.2 * Math.sin(t * 1.5 + h);
        ctx.fillStyle = `rgba(255,220,150,${a})`;
        ctx.fillRect(X + (h % 20) + 4, Y + 10 + Math.sin(t * 2 + h) * 2, 8, 2);
        ctx.fillStyle = `rgba(200,220,255,${a * 0.7})`;
        ctx.fillRect(X + (h % 13) + 10, Y + 20, 5, 1);
      }
    }
    return r;
  };

  /* ----- sombra das pessoas seguindo o sol ----- */
  if (typeof drawSprite === "function") {
    const dsBase = drawSprite;
    drawSprite = function (rects, x, y, u, flip) {
      const S = !low() && u === 2 && !window.__inReflection ? sun() : null;
      if (S && ZONES[player.zone] && ZONES[player.zone].theme !== "interior" && player.zone !== "casa") {
        const X = x + 16,
          Y = y + 30,
          L = 26 * S.len;
        ctx.save();
        ctx.translate(X, Y);
        ctx.transform(1, 0, S.dx * 0.9, 0.32, 0, 0);
        ctx.fillStyle = `rgba(15,12,30,${S.a})`;
        ctx.beginPath();
        ctx.ellipse(0, -L / 2, 6, L / 2, 0, 0, 7);
        ctx.fill();
        ctx.restore();
      }
      return dsBase.apply(this, arguments);
    };
  }
})();
