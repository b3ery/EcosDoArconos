/**
 * ECOS DO ARCANO — graficos-4k.js
 * Mais definição e profundidade:
 *  - ULTRA (4K): a resolução interna do jogo acompanha a tela de verdade
 *    (altura da janela × densidade de pixels), até 2160 linhas, para ficar
 *    nítido em monitor 4K. Os pixels continuam duros (sem borrão). Se o jogo
 *    ficar lento, a qualidade automática desce sozinha.
 *  - SOMBRA PROJETADA: cada construção joga uma sombra macia no chão, na
 *    direção contrária ao sol. Comprida de manhã e no fim da tarde, curta ao
 *    meio-dia, e some à noite.
 *  - SOMBRA DE CONTATO (oclusão): uma faixa escura e suave onde a parede
 *    encosta no chão, e embaixo de árvores, poços e baús.
 * Na qualidade "Baixa" só a sombra de contato fica, para não pesar.
 * Modifica (envolve) applyQuality, drawBuilding e drawTile.
 */

"use strict";

(() => {
  /* ----- ULTRA (4K) ----- */
  const screenRatio = () => {
    const dpr = window.devicePixelRatio || 1;
    const h = Math.max(window.innerHeight || 480, 480) * dpr;
    return Math.max(1, Math.min(4.5, Math.round((h / 480) * 2) / 2));
  };
  QUALITY.ultra = {
    label: "Ultra (4K)",
    get pixelRatio() {
      return screenRatio();
    },
    walkers: 1,
    ambience: true,
    weather: 1,
  };
  // a "Alta" também acompanha a tela (até 3x); a Ultra vai até 4K
  const alta = QUALITY.alta;
  if (alta) Object.defineProperty(alta, "pixelRatio", { get: () => Math.min(3, Math.max(2, screenRatio())), configurable: true });
  // no computador, o automático começa no Ultra (o monitor de desempenho desce se pesar)
  if (!isTouchDevice()) autoQuality = "ultra";
  // quando fica lento, desce um degrau por vez: Ultra → Alta → Média → Baixa
  const ORDER = ["ultra", "alta", "media", "baixa"];
  monitorPerformance = function (dt) {
    if (settings.quality !== "auto") return;
    fpsMonitor.frames++;
    fpsMonitor.time += dt;
    if (fpsMonitor.time < 2) return;
    const fps = fpsMonitor.frames / fpsMonitor.time;
    fpsMonitor.frames = 0;
    fpsMonitor.time = 0;
    fpsMonitor.slowStreak = fps < 38 ? fpsMonitor.slowStreak + 1 : 0;
    const i = ORDER.indexOf(autoQuality);
    if (fpsMonitor.slowStreak >= 2 && i >= 0 && i < ORDER.length - 1) {
      autoQuality = ORDER[i + 1];
      fpsMonitor.slowStreak = 0;
      applyQuality();
      toast(`O jogo ficou lento: qualidade ajustada para ${currentQuality().label}.`, 3000);
    }
  };
  addEventListener("resize", () => typeof applyQuality === "function" && applyQuality());

  const low = () => currentQuality() === QUALITY.baixa;
  // direção e tamanho da sombra pela hora: o sol nasce a leste e se põe a oeste
  const sun = () => {
    const h = typeof currentHour === "function" ? currentHour() : 12;
    if (h < 5.5 || h > 19.5) return null;
    const f = (h - 12.5) / 7; // -1 de manhã, +1 no fim da tarde
    const len = 0.35 + Math.abs(f) * 1.1; // comprimento (em alturas do prédio)
    const a = Math.max(0, 1 - nightAlpha() * 1.6) * (0.22 + Math.abs(f) * 0.06);
    return { dx: -f * 1.0, dy: 0.55, len, a };
  };

  /* ----- prédios: sombra projetada, oclusão, lateral e luz ----- */
  const FLAT = new Set(["terreno"]);
  const dbBase = drawBuilding;
  drawBuilding = function (b, t) {
    if (!b || FLAT.has(b.style) || !ZONES[player.zone] || !ZONES[player.zone].town) return dbBase.apply(this, arguments);
    const X = b.x * TILE,
      Y = b.y * TILE,
      W = b.w * TILE,
      Hh = b.h * TILE;
    const S = !low() && sun();
    if (S) {
      // sombra projetada: um polígono do pé do prédio para o lado contrário ao sol
      const ht = Math.min(Hh + 40, 150) * S.len;
      const ox = S.dx * ht * 0.6,
        oy = S.dy * ht * 0.35;
      const g = ctx.createLinearGradient(X, Y + Hh, X + ox, Y + Hh + oy);
      g.addColorStop(0, `rgba(20,16,30,${S.a})`);
      g.addColorStop(1, "rgba(20,16,30,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(X, Y + Hh - 2);
      ctx.lineTo(X + W, Y + Hh - 2);
      ctx.lineTo(X + W + ox, Y + Hh - 2 + oy);
      ctx.lineTo(X + ox, Y + Hh - 2 + oy);
      ctx.closePath();
      ctx.fill();
    }
    const r = dbBase.apply(this, arguments);
    // oclusão: escurece de leve o chão rente à parede (frente) e o rodapé
    const ao = ctx.createLinearGradient(0, Y + Hh, 0, Y + Hh + 8);
    ao.addColorStop(0, "rgba(10,8,18,.26)");
    ao.addColorStop(1, "rgba(10,8,18,0)");
    ctx.fillStyle = ao;
    ctx.fillRect(X, Y + Hh, W, 8);
    return r;
  };

  /* ----- sombra de contato embaixo das coisas do chão ----- */
  const PROPS = new Set(["T", "W", "C", "l", "b", "k", "x"]);
  const dtBase = drawTile;
  drawTile = function (z, x, y, c, t) {
    if (PROPS.has(c) && ZONES[z] && ZONES[z].town) {
      const X = x * TILE,
        Y = y * TILE;
      ctx.fillStyle = "rgba(10,8,18,.22)";
      ctx.beginPath();
      ctx.ellipse(X + 16, Y + 28, c === "T" ? 13 : 10, 4, 0, 0, 7);
      ctx.fill();
    }
    return dtBase.apply(this, arguments);
  };
  // aplica já (a tela foi montada antes deste arquivo carregar)
  if (typeof applyQuality === "function" && canvas.dataset.ready) applyQuality();
  addEventListener("load", () => typeof applyQuality === "function" && applyQuality());
})();
