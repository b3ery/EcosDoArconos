/**
 * ECOS DO ARCANO — estacoes.js
 * As estações mudam o mundo (em todas as cidades, vilas e reinos):
 *  - INVERNO: neve acumulada no alto de cada telhado, chaminé, torre e
 *    ameia (segue o desenho de cada prédio), pingentes de gelo nos beirais;
 *    rios e lagos das cidades CONGELAM (o mar não): dá para andar e
 *    PATINAR no gelo (desliza mais rápido e diverte).
 *  - OUTONO: folhas laranja e vermelhas caindo, rodando com o vento.
 *  - PRIMAVERA: árvores floridas (flores rosa e brancas) e pétalas no ar.
 * Modifica (envolve) drawBuilding, drawTile, drawWeather, walkable,
 * tryMove, targetAt e interactAt.
 */

"use strict";

(() => {
  const sid = () => (typeof season === "function" ? season().id : "pri");
  const outdoor = () => {
    const Z = ZONES[player.zone];
    return Z && Z.theme !== "interior" && player.zone !== "casa" && !(Z.town && Z.town.indoor);
  };
  // terras sem neve (praia, deserto, selva, vulcão)
  const noSnow = () => {
    const Z = ZONES[player.zone];
    if (!Z) return true;
    if (Z.theme === "porto") return true;
    const c = player.zone.startsWith("pais-") ? player.zone.split("-")[1] : null;
    return ["coral", "zahar", "verde", "ouro", "ferro"].includes(c);
  };
  const winter = () => sid() === "inv" && outdoor() && !noSnow();

  /* ----- NEVE NOS TELHADOS: o perfil de cima de cada prédio, guardado ----- */
  const PROFILE = new WeakMap();
  function profileOf(b, t) {
    const key = b.style + ":" + b.w + "x" + b.h;
    const old = PROFILE.get(b);
    if (old && old.key === key) return old;
    const W = b.w * TILE + 80,
      H = b.h * TILE + 220;
    const c = document.createElement("canvas");
    c.width = W;
    c.height = H;
    const g = c.getContext("2d");
    const main = ctx;
    ctx = g;
    const prevIR = window.__inReflection;
    window.__inReflection = true; // sem recortes nem transparência
    try {
      ctx.translate(40 - b.x * TILE, 200 - b.y * TILE);
      drawBuilding(b, 0);
    } catch (e) {
    } finally {
      ctx = main;
      window.__inReflection = prevIR;
    }
    const d = g.getImageData(0, 0, W, H).data;
    // para cada coluna: as bordas de cima (onde o desenho começa depois de vazio)
    const tops = [];
    for (let x = 0; x < W; x += 2) {
      const col = [];
      let wasEmpty = true;
      for (let y = 0; y < H; y++) {
        const a = d[(y * W + x) * 4 + 3];
        if (a > 200 && wasEmpty) col.push(y);
        wasEmpty = a < 40;
        if (col.length >= 3) break;
      }
      tops.push(col);
    }
    const P = { key, tops, ox: 40, oy: 200 };
    PROFILE.set(b, P);
    return P;
  }
  const BIG = new Set(["castle", "palacio", "fortaleza", "templo", "celeiro", "moinho", "farol", "mina"]);
  const dbBase = drawBuilding;
  drawBuilding = function (b, t) {
    const r = dbBase.apply(this, arguments);
    if (!winter() || window.__inReflection || !b) return r;
    const P = profileOf(b, t);
    const X0 = b.x * TILE - P.ox,
      Y0 = b.y * TILE - P.oy;
    ctx.save();
    for (let i = 0; i < P.tops.length; i++) {
      const col = P.tops[i];
      const x = X0 + i * 2;
      for (let k = 0; k < col.length; k++) {
        const y = Y0 + col[k];
        // camada de neve: mais grossa no alto, uma ondinha
        const th = (k === 0 ? 9 : 4) + ((i * 7 + k) % 3 === 0 ? 2 : 0) - (i % 5 === 0 ? 1 : 0);
        ctx.fillStyle = "#f4f8fc";
        ctx.fillRect(x, y - 2, 2, th);
        ctx.fillStyle = "rgba(255,255,255,.9)";
        ctx.fillRect(x, y - 2, 2, 2);
        // flocos espalhados telhado abaixo
        if (k === 0)
          for (let f = 0; f < 3; f++) {
            const fy = y + th + 4 + ((i * 17 + f * 23) % 34);
            if ((i + f * 3) % 4 === 0) ((ctx.fillStyle = "rgba(244,248,252,.85)"), ctx.fillRect(x, fy, 2, 2));
          }
        ctx.fillStyle = "rgba(170,195,225,.7)";
        ctx.fillRect(x, y + th - 1, 2, 1);
        // pingentes de gelo nos beirais (de vez em quando)
        if (k > 0 && (i * 13 + col[k]) % 11 === 0) {
          ctx.fillStyle = "rgba(220,240,255,.9)";
          ctx.fillRect(x, y + th, 1, 3 + ((i * 3) % 4));
        }
      }
    }
    ctx.restore();
    return r;
  };

  /* ----- GELO: rios e lagos das cidades congelam no inverno ----- */
  const isSeaTile = (z, x, y) => {
    const Z = ZONES[z];
    if (!Z || Z.theme !== "porto") return false;
    return !((window.LAKES || {})[z] || []).some((R) => x >= R.x0 - 1 && x <= R.x1 + 1 && y >= R.y0 - 1 && y <= R.y1 + 1);
  };
  window.isFrozen = (z, x, y) => sid() === "inv" && ZONES[z] && ZONES[z].town && !ZONES[z].town.indoor && !noSnowZ(z) && tileAt(z, x, y) === "~" && !isSeaTile(z, x, y);
  function noSnowZ(z) {
    const Z = ZONES[z];
    if (!Z || Z.theme === "porto") return true;
    const c = z.startsWith("pais-") ? z.split("-")[1] : null;
    return ["coral", "zahar", "verde", "ouro", "ferro"].includes(c);
  }
  const dtBase = drawTile;
  drawTile = function (z, x, y, c, t) {
    const r = dtBase.apply(this, arguments);
    if (c === "~" && isFrozen(z, x, y)) {
      const X = x * TILE,
        Y = y * TILE;
      ctx.fillStyle = "rgba(214,232,246,.86)";
      ctx.fillRect(X, Y, TILE, TILE);
      const h = (x * 928371 + y * 1237) % 997;
      // rachaduras e brilho do gelo
      ctx.strokeStyle = "rgba(140,175,210,.75)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(X + (h % 20) + 2, Y + 4);
      ctx.lineTo(X + (h % 13) + 10, Y + 14);
      ctx.lineTo(X + (h % 17) + 4, Y + 26);
      if (h % 3 === 0) (ctx.moveTo(X + (h % 13) + 10, Y + 14), ctx.lineTo(X + 28, Y + 18));
      ctx.stroke();
      ctx.fillStyle = "rgba(255,255,255,.75)";
      ctx.fillRect(X + ((h * 3) % 22) + 3, Y + ((h * 7) % 20) + 4, 6, 1);
      // risco de patins
      if (h % 5 === 0) ((ctx.strokeStyle = "rgba(255,255,255,.55)"), ctx.beginPath(), ctx.arc(X + 16, Y + 16, 9, 0.3, 2.2), ctx.stroke());
    } else if (c === "T" && sid() === "pri" && outdoor()) {
      // primavera: árvore florida
      const X = x * TILE,
        Y = y * TILE,
        h = (x * 31 + y * 17) % 97;
      for (let i = 0; i < 7; i++) {
        ctx.fillStyle = i % 3 ? "#f6b8d0" : "#fff2f6";
        ctx.fillRect(X + 6 + ((h * (i + 3)) % 20), Y - 6 + ((h * (i + 5)) % 22), 3, 3);
      }
    }
    return r;
  };
  // no gelo dá para andar (e patinar)
  const wkBase = walkable;
  walkable = function (z, x, y) {
    if (isFrozen(z, x, y)) return true;
    return wkBase.apply(this, arguments);
  };
  const tmBase = tryMove;
  tryMove = function () {
    const r = tmBase.apply(this, arguments);
    if (isFrozen(player.zone, player.x, player.y)) {
      game.moveCd = Math.min(game.moveCd || 0.13, 0.07); // desliza
      if (!game.skating) {
        game.skating = true;
        toast("Você está patinando no gelo! Wheee!", 1800);
      }
      if (typeof addNeed === "function" && typeof lifeMode === "function" && lifeMode()) addNeed("fun", 0.6);
    } else game.skating = false;
    return r;
  };
  // o gelo não é água: sem pescar/nadar, sem reflexo
  const tgBase = targetAt;
  targetAt = function (x, y) {
    if (isFrozen(player.zone, x, y)) return null;
    return tgBase.apply(this, arguments);
  };
  const iaBase = interactAt;
  interactAt = function (x, y) {
    if (isFrozen(player.zone, x, y)) return toast("O rio está congelado. Dá para patinar!", 1800);
    return iaBase.apply(this, arguments);
  };

  /* ----- folhas e pétalas no ar ----- */
  if (typeof drawWeather === "function") {
    const dwBase = drawWeather;
    drawWeather = function (t, th, psx, psy) {
      const r = dwBase.apply(this, arguments);
      const s = sid();
      if (!outdoor() || (s !== "out" && s !== "pri") || ["chuva", "tempestade", "neve"].includes(player.weather)) return r;
      const n = s === "out" ? 26 : 18;
      const cols = s === "out" ? ["#d0602a", "#e8a23a", "#a83a22", "#f0c040"] : ["#f6b8d0", "#fff2f6", "#f8c8dc"];
      const H = 480;
      for (let i = 0; i < n; i++) {
        const sp = 18 + ((i * 37) % 23);
        const y = ((t * sp + i * 97) % (H + 40)) - 20;
        const x = ((i * 173 + t * (s === "out" ? 24 : 12)) % (viewWidth + 40)) - 20 + Math.sin(t * 1.3 + i) * 18;
        const a = t * 2 + i;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(a);
        ctx.scale(Math.cos(a * 1.3), 1); // gira como folha
        ctx.fillStyle = cols[i % cols.length];
        if (s === "out") {
          ctx.beginPath();
          ctx.ellipse(0, 0, 5, 3, 0, 0, 7);
          ctx.fill();
          ctx.fillStyle = "rgba(90,40,20,.5)";
          ctx.fillRect(-4, 0, 8, 1);
        } else {
          ctx.beginPath();
          ctx.ellipse(0, 0, 3, 2, 0, 0, 7);
          ctx.fill();
        }
        ctx.restore();
      }
      return r;
    };
  }
})();
