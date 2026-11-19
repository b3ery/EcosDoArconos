/**
 * ECOS DO ARCANO — castelo-bonito.js
 * O castelo (Cinzaluz e os castelos dos reinos de fora) desenhado como um
 * castelo medieval de verdade:
 *  - muralha da frente com ameias, passadiço e base de pedra mais escura;
 *  - duas torres redondas nos cantos (sombra de cilindro, mata-cães e telhado
 *    cônico de ardósia com bandeira);
 *  - torre de menagem alta ao fundo, com duas torrinhas;
 *  - guarita no meio com arco de pedra, grade levadiça, portas de madeira
 *    abertas e tochas;
 *  - estandartes do reino, seteiras que acendem à noite, hera e musgo.
 * Cabe em qualquer tamanho de castelo. Modifica (envolve) drawBuilding.
 */

"use strict";

(() => {
  const hs = (a, b) => ((((a * 73856093) ^ (b * 19349663)) >>> 0) % 1000) / 1000;
  // cores do reino de cada castelo
  const HERALD = {
    vila: ["#a8282a", "#f2c14e"],
    _: [
      ["#2a5aa8", "#f2eee4"],
      ["#2a7a4a", "#f2c14e"],
      ["#6a2a8a", "#f2c14e"],
      ["#a85a1a", "#f2eee4"],
      ["#1a5a6a", "#e8d070"],
    ],
  };
  const R = (x, y, w, h, c) => ((ctx.fillStyle = c), ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)));
  const poly = (...p) => fillPolygon(...p);

  // parede de pedra com fiadas desencontradas e manchas de tempo
  function stone(x, y, w, h, seed, base = "#8d877b") {
    R(x, y, w, h, base);
    const rowH = 8;
    for (let r = 0; r * rowH < h; r++) {
      const yy = y + r * rowH;
      R(x, yy, w, 1, "rgba(60,55,48,.55)");
      const off = (r % 2) * 9;
      for (let k = -1; k * 18 < w; k++) {
        const xx = x + off + k * 18;
        if (xx > x && xx < x + w) R(xx, yy, 1, Math.min(rowH, y + h - yy), "rgba(60,55,48,.45)");
        // pedra mais clara ou mais escura, aqui e ali
        const v = hs(Math.floor(xx), Math.floor(yy) + seed);
        if (v > 0.82 && xx + 2 > x && xx + 16 < x + w) R(xx + 2, yy + 2, 14, rowH - 3, v > 0.92 ? "rgba(255,250,235,.12)" : "rgba(40,36,30,.14)");
      }
    }
    // luz de cima e sombra de baixo
    R(x, y, w, 2, "rgba(255,255,255,.12)");
    R(x, y + h - 4, w, 4, "rgba(0,0,0,.18)");
  }
  // ameias: os dentes de cima da muralha
  function merlons(x, y, w, step = 14, mw = 9, mh = 9, c = "#a39d90") {
    for (let k = 0; x + k * step + mw <= x + w + 1; k++) {
      R(x + k * step, y - mh, mw, mh, c);
      R(x + k * step, y - mh, mw, 2, "rgba(255,255,255,.18)");
      R(x + k * step + mw - 2, y - mh, 2, mh, "rgba(0,0,0,.15)");
    }
  }
  // seteira: fresta estreita (brilha à noite)
  function slit(x, y, h, night, t) {
    R(x - 2, y - 2, 6, h + 4, "#6a655b");
    R(x, y, 2, h, night ? `rgba(255,${190 + Math.floor(Math.sin(t * 3 + x) * 25)},100,1)` : "#1e1a16");
  }
  // torre redonda: cilindro com sombra, mata-cães e telhado cônico
  function roundTower(cx, top, bottom, rw, roof, flag, t, night, seed) {
    const x = cx - rw;
    const w = rw * 2;
    stone(x, top, w, bottom - top, seed, "#8a8478");
    // sombra de cilindro (luz da esquerda)
    for (let i = 0; i < w; i += 2) {
      const f = i / w;
      const a = f < 0.3 ? 0.12 - f * 0.3 : (f - 0.3) * 0.42;
      R(x + i, top, 2, bottom - top, f < 0.3 ? `rgba(255,250,235,${Math.max(0, a)})` : `rgba(20,18,15,${a})`);
    }
    // mata-cães (os suportes que seguram o topo saliente)
    R(x - 4, top - 10, w + 8, 10, "#9a9488");
    for (let k = 0; k < (w + 8) / 8; k++) R(x - 4 + k * 8, top - 2, 5, 6, "#6a655b");
    merlons(x - 4, top - 10, w + 8, 10, 6, 8, "#a39d90");
    // telhado cônico de ardósia
    const rt = top - 10,
      apex = rt - rw * 2.1;
    poly(x - 8, rt, cx, apex, x + w + 8, rt);
    ctx.fillStyle = roof[0];
    poly(x - 8, rt, cx, apex, x + w + 8, rt);
    ctx.fillStyle = roof[1];
    poly(x - 8, rt, cx, apex, cx - 3, rt);
    // telhas em escamas
    for (let r = 1; r < 6; r++) {
      const yy = rt - (rt - apex) * (r / 6);
      const half = (w / 2 + 8) * (1 - r / 6);
      R(cx - half, yy, half * 2, 1, "rgba(0,0,0,.22)");
    }
    R(x - 8, rt - 2, w + 16, 3, "rgba(0,0,0,.25)");
    // ponta e bandeira
    R(cx - 1, apex - 22, 2, 22, "#4a3a2a");
    R(cx - 2, apex - 3, 4, 4, "#c9a03a");
    const fw = Math.sin(t * 4 + cx) * 3;
    ctx.fillStyle = flag[0];
    poly(cx + 1, apex - 22, cx + 20, apex - 17 + fw, cx + 1, apex - 11);
    ctx.fillStyle = flag[1];
    poly(cx + 1, apex - 19, cx + 9, apex - 17 + fw / 2, cx + 1, apex - 15);
    // seteiras
    slit(cx - 1, top + 16, 14, night, t);
    if (bottom - top > 90) slit(cx - 1, top + 60, 14, night, t);
  }

  function drawCastle(b, t) {
    const X = b.x * TILE,
      Y = b.y * TILE,
      W = b.w * TILE,
      Hh = b.h * TILE;
    const night = nightAlpha() > 0.25;
    const z = player.zone;
    const big = b.w >= 14;
    const flag = z === "vila" ? HERALD.vila : HERALD._[Math.floor(hs(b.x, b.y) * HERALD._.length)];
    const roof = z === "vila" ? ["#34466a", "#4a5f8a"] : flag[0] === "#2a7a4a" ? ["#2f5a3a", "#43784f"] : ["#3a3a4a", "#55556a"];
    const seed = b.x * 7 + b.y;
    const tr = big ? 30 : 22; // raio das torres
    // o castelo cabe inteiro na tela: o que sobe acima do terreno só usa o espaço que existe no mapa
    const top = big ? Y - 8 : Y - Math.min(Math.max(0, Y - 6), 90);
    const room = Y + Hh - top; // altura total disponível
    const kt0 = top + Math.round(room * (big ? 0.27 : 0.3)); // topo da menagem
    const wallTop = Math.max(Y + (big ? 34 : 24), top + Math.round(room * 0.52));
    // sombra no chão
    R(X + 8, Y + Hh - 4, W, 10, "rgba(0,0,0,.28)");

    /* --- torre de menagem (ao fundo) --- */
    const kw = big ? 150 : 96,
      kx = X + W / 2 - kw / 2,
      kt = kt0;
    stone(kx, kt, kw, wallTop - kt + 10, seed + 3, "#857f73");
    R(kx, kt, 6, wallTop - kt + 10, "rgba(255,250,235,.10)");
    R(kx + kw - 10, kt, 10, wallTop - kt + 10, "rgba(0,0,0,.16)");
    merlons(kx, kt, kw, 14, 9, 10);
    // janelas da menagem (arco) e o salão iluminado à noite
    for (let i = 0; i < (big ? 3 : 2); i++) {
      const wx = kx + (kw / ((big ? 3 : 2) + 1)) * (i + 1) - 6;
      R(wx - 2, kt + 18, 16, 22, "#6a655b");
      R(wx, kt + 22, 12, 18, night ? "#ffcf6a" : "#26303e");
      ctx.fillStyle = night ? "#ffcf6a" : "#26303e";
      ctx.beginPath();
      ctx.arc(wx + 6, kt + 22, 6, Math.PI, 0);
      ctx.fill();
      R(wx + 5, kt + 18, 2, 22, "#6a655b");
    }
    // duas torrinhas da menagem, com telhado
    for (const sx of [kx - 6, kx + kw - 18]) {
      R(sx, kt - 26, 24, 30, "#8a8478");
      R(sx + 16, kt - 26, 8, 30, "rgba(0,0,0,.16)");
      ctx.fillStyle = roof[0];
      poly(sx - 4, kt - 26, sx + 12, kt - 62, sx + 28, kt - 26);
      ctx.fillStyle = roof[1];
      poly(sx - 4, kt - 26, sx + 12, kt - 62, sx + 9, kt - 26);
      R(sx + 11, kt - 76, 2, 14, "#4a3a2a");
      slit(sx + 11, kt - 18, 10, night, t);
    }
    // grande estandarte do reino no meio da menagem
    const bw = big ? 26 : 18;
    R(X + W / 2 - bw / 2 - 2, kt + (big ? 48 : 40), bw + 4, 3, "#4a3a2a");
    R(X + W / 2 - bw / 2, kt + (big ? 50 : 42), bw, big ? 40 : 28, flag[0]);
    poly(X + W / 2 - bw / 2, kt + (big ? 90 : 70), X + W / 2, kt + (big ? 82 : 64), X + W / 2 + bw / 2, kt + (big ? 90 : 70));
    ctx.fillStyle = flag[0];
    poly(X + W / 2 - bw / 2, kt + (big ? 90 : 70), X + W / 2, kt + (big ? 98 : 76), X + W / 2 + bw / 2, kt + (big ? 90 : 70));
    // brasão: coroa e estrela
    R(X + W / 2 - 6, kt + (big ? 62 : 50), 12, 3, flag[1]);
    R(X + W / 2 - 6, kt + (big ? 57 : 46), 3, 5, flag[1]);
    R(X + W / 2 - 1, kt + (big ? 55 : 44), 3, 7, flag[1]);
    R(X + W / 2 + 4, kt + (big ? 57 : 46), 3, 5, flag[1]);
    R(X + W / 2 - 3, kt + (big ? 70 : 56), 6, 6, flag[1]);
    // bandeira no topo da menagem
    R(X + W / 2 - 1, kt - 40, 2, 30, "#4a3a2a");
    ctx.fillStyle = flag[1];
    poly(X + W / 2 + 1, kt - 40, X + W / 2 + 28, kt - 33 + Math.sin(t * 4) * 3, X + W / 2 + 1, kt - 26);

    /* --- muralha da frente --- */
    const wx0 = X + tr,
      wx1 = X + W - tr;
    stone(wx0, wallTop, wx1 - wx0, Y + Hh - wallTop, seed);
    // passadiço: a borda de cima saliente
    R(wx0, wallTop - 3, wx1 - wx0, 5, "#a39d90");
    R(wx0, wallTop + 2, wx1 - wx0, 2, "rgba(0,0,0,.25)");
    merlons(wx0, wallTop - 3, wx1 - wx0, 16, 10, 10);
    // base de pedra mais escura (o embasamento)
    R(wx0, Y + Hh - 14, wx1 - wx0, 14, "#6e695e");
    R(wx0, Y + Hh - 14, wx1 - wx0, 2, "rgba(255,255,255,.12)");
    // seteiras na muralha
    for (let k = 0; k < (big ? 4 : 2); k++) {
      const sx = wx0 + 26 + k * ((wx1 - wx0 - 52) / Math.max(1, (big ? 4 : 2) - 1));
      if (Math.abs(sx - (X + W / 2)) < 56) continue;
      slit(sx, wallTop + 20, 16, night, t);
    }
    // hera e musgo subindo pela pedra
    for (let k = 0; k < (big ? 3 : 2); k++) {
      const ix = wx0 + 10 + hs(seed, k) * (wx1 - wx0 - 40);
      if (Math.abs(ix - (X + W / 2)) < 60) continue;
      const ih = 30 + hs(k, seed) * 40;
      for (let i = 0; i < ih; i += 3) R(ix + Math.sin(i * 0.4 + k) * 4, Y + Hh - 14 - i, 5, 4, i % 2 ? "#3f6e2e" : "#4f8a3a");
    }

    /* --- guarita com o portão --- */
    const gw = big ? 92 : 70,
      gx = X + (b.door.length ? ((b.door[0] + b.door[b.door.length - 1]) / 2 - b.x + 0.5) * TILE : W / 2) - gw / 2,
      gt = wallTop - (big ? 26 : 18);
    stone(gx, gt, gw, Y + Hh - gt, seed + 9, "#928c80");
    R(gx, gt, 4, Y + Hh - gt, "rgba(255,250,235,.10)");
    R(gx + gw - 6, gt, 6, Y + Hh - gt, "rgba(0,0,0,.16)");
    merlons(gx - 2, gt, gw + 4, 13, 9, 10);
    // duas torrinhas da guarita
    for (const sx of [gx - 10, gx + gw - 6]) {
      R(sx, gt - 14, 16, Y + Hh - gt + 14, "#8a8478");
      R(sx + 10, gt - 14, 6, Y + Hh - gt + 14, "rgba(0,0,0,.15)");
      merlons(sx - 1, gt - 14, 18, 7, 5, 6);
    }
    // arco do portão com aduelas
    const aw = big ? 54 : 42,
      ax = gx + gw / 2 - aw / 2,
      ah = big ? 62 : 48,
      ay = Y + Hh - ah;
    ctx.fillStyle = "#6a655b";
    ctx.beginPath();
    ctx.arc(ax + aw / 2, ay + aw / 2 - 2, aw / 2 + 6, Math.PI, 0);
    ctx.fill();
    R(ax - 6, ay + aw / 2 - 2, aw + 12, ah - aw / 2 + 2, "#6a655b");
    for (let k = 0; k <= 8; k++) {
      const a = Math.PI + (Math.PI * k) / 8;
      R(ax + aw / 2 + Math.cos(a) * (aw / 2 + 3) - 1, ay + aw / 2 - 2 + Math.sin(a) * (aw / 2 + 3) - 1, 3, 3, "#4f4a42");
    }
    // a passagem escura
    ctx.fillStyle = "#1e1914";
    ctx.beginPath();
    ctx.arc(ax + aw / 2, ay + aw / 2, aw / 2, Math.PI, 0);
    ctx.fill();
    R(ax, ay + aw / 2, aw, ah - aw / 2, "#1e1914");
    // pátio iluminado lá dentro
    R(ax + 6, Y + Hh - 12, aw - 12, 12, night ? "rgba(255,190,90,.35)" : "rgba(160,150,120,.35)");
    // portas de madeira abertas para os lados
    for (const [dx, s] of [[ax - 2, 1], [ax + aw - 8, -1]]) {
      R(dx, ay + aw / 2, 10, ah - aw / 2, "#6b4423");
      for (let i = 0; i < 3; i++) R(dx, ay + aw / 2 + 6 + i * 14, 10, 2, "#3e2814");
    }
    // grade levadiça meio erguida
    const gh = (ah - aw / 2) * 0.45 + aw / 2;
    ctx.save();
    ctx.beginPath();
    ctx.arc(ax + aw / 2, ay + aw / 2, aw / 2, Math.PI, 0);
    ctx.rect(ax, ay + aw / 2, aw, gh - aw / 2);
    ctx.clip();
    for (let k = 4; k < aw; k += 7) R(ax + k, ay, 2, gh, "#4a4a52");
    for (let k = 6; k < gh; k += 8) R(ax, ay + k, aw, 2, "#4a4a52");
    for (let k = 4; k < aw; k += 7) R(ax + k - 1, ay + gh - 3, 4, 4, "#3a3a42");
    ctx.restore();
    // tochas dos dois lados
    for (const tx of [gx + 8, gx + gw - 12]) {
      R(tx, Y + Hh - 40, 4, 12, "#4a3a2a");
      const fl = Math.sin(t * 12 + tx) * 2;
      R(tx - 2, Y + Hh - 50 + fl, 8, 10, "#ff8a3a");
      R(tx, Y + Hh - 46 + fl, 4, 6, "#ffe08a");
      if (night) {
        ctx.fillStyle = "rgba(255,170,80,.18)";
        ctx.beginPath();
        ctx.arc(tx + 2, Y + Hh - 44, 26, 0, 7);
        ctx.fill();
      }
    }
    // estandartes pendurados na guarita
    for (const sx of [gx + 12, gx + gw - 26]) {
      R(sx, gt + 10, 14, big ? 34 : 24, flag[0]);
      R(sx + 5, gt + 14, 4, big ? 18 : 12, flag[1]);
      ctx.fillStyle = flag[0];
      poly(sx, gt + 10 + (big ? 34 : 24), sx + 7, gt + 4 + (big ? 34 : 24), sx + 14, gt + 10 + (big ? 34 : 24));
    }

    /* --- torres redondas dos cantos (por último: ficam na frente) --- */
    // as torres sobem até perto do topo: telhado cônico + mata-cães
    const tTop = Math.max(top + Math.round(tr * 2.1) + 16, wallTop - (big ? 120 : 70));
    roundTower(X + tr, tTop, Y + Hh, tr, roof, flag, t, night, seed + 1);
    roundTower(X + W - tr, tTop, Y + Hh, tr, roof, flag, t, night, seed + 2);
  }

  const base = drawBuilding;
  drawBuilding = function (b, t) {
    if (b && b.style === "castle") return drawCastle(b, t);
    return base.apply(this, arguments);
  };
})();
