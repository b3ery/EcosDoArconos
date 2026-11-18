/**
 * ECOS DO ARCANO — gestos-oficios.js
 * Minijogos de GESTO (arrastar, esfregar, girar, traçar), no estilo Cooking Mama:
 *  - Padeiro: rolar a massa com o rolo até o tamanho marcado; empurrar a forma
 *    para dentro do forno e puxar de volta quando o pão dourar.
 *  - Barbeiro: tesoura que corta mecha por mecha na linha pedida; navalha que
 *    raspa a barba esfregando.
 *  - Ferreiro: bombear o fole (arrastar para cima e para baixo) e martelar com
 *    um golpe rápido para baixo quando o ferro estiver em brasa.
 *  - Cozinheiro e pratos: cortar os legumes nas marcas com a faca e mexer o
 *    caldeirão em círculos no ritmo da colher-guia.
 *  - Taverneiro (bebida): puxar a alavanca do barril (quanto mais, mais rápido
 *    e mais espuma) e soltar na marca.
 *  - Costureiro: passar a agulha pelo caminho pontilhado.
 *  - Escriba: escrever as letras com a pena, seguindo o traço.
 *  - Pintor: escolher a tinta e pintar cada parte do quadro.
 *  - Moleiro: girar a mó em círculos.
 *  - Açougueiro/peixeiro: passar a faca no ponto certo para dar o peso pedido.
 *  - Boticário: arrastar as ervas certas para o pilão e moer em círculos.
 *  - Cavalariço: escovar a lama do cavalo e levar o balde até o cocho.
 *  - Balconista: arrastar as moedas do troco até a mão do cliente.
 *  - Bardo: dedilhar a corda certa quando a nota chega.
 *  - Joalheiro: procurar defeitos com a lupa e polir a pedra boa.
 *  - Bibliotecário: arrastar os livros para a estante, em ordem.
 *  - Professor: arrastar o giz da resposta certa para a lousa.
 * Substitui jobGame (os minijogos de botão ficam só como reserva).
 */

"use strict";

(() => {
  const W = 360,
    H = 240;
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const shuffle = (a) => a.slice().sort(() => Math.random() - 0.5);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  let el, cv, g, S, raf, chain;

  /* ===================== MOTOR ===================== */
  function ensure() {
    el = byId("ges");
    if (!el) {
      el = document.createElement("div");
      el.id = "ges";
      el.className = "ui";
      byId("screen").appendChild(el);
    }
  }
  function stage(spec) {
    ensure();
    S = Object.assign({ spec, t: 0, left: spec.time || 20, down: false, p: { x: -99, y: -99 }, last: null, path: [] }, spec.state ? spec.state() : {});
    el.innerHTML = `<div class="gs-card"><h3>${spec.title}</h3><p class="gs-sub">${spec.sub}</p>
      <canvas width="${W}" height="${H}"></canvas><div class="gs-tools"></div>
      <div class="gs-foot"><span class="gs-time"></span><span class="gs-msg"></span><span><button class="gs-quit">Desistir</button>${spec.ready ? ` <button class="go gs-ok">${spec.ready}</button>` : ""}</span></div></div>`;
    el.style.display = "flex";
    game.mode = "ges";
    cv = el.querySelector("canvas");
    g = cv.getContext("2d");
    g.imageSmoothingEnabled = false;
    const tools = el.querySelector(".gs-tools");
    (spec.tools || []).forEach((tl, i) => {
      const b = document.createElement("button");
      b.textContent = tl.n;
      b.className = i === 0 ? "on" : "";
      b.onclick = () => {
        S.tool = tl.id;
        tools.querySelectorAll("button").forEach((q) => q.classList.toggle("on", q === b));
      };
      tools.appendChild(b);
      if (i === 0) S.tool = tl.id;
    });
    el.querySelector(".gs-quit").onclick = () => quit();
    const ok = el.querySelector(".gs-ok");
    if (ok) ok.onclick = () => end(spec.finish(S));
    const pos = (e) => {
      const r = cv.getBoundingClientRect();
      return { x: ((e.clientX - r.left) * W) / r.width, y: ((e.clientY - r.top) * H) / r.height, tm: performance.now() };
    };
    cv.onpointerdown = (e) => {
      e.preventDefault();
      cv.setPointerCapture(e.pointerId);
      S.down = true;
      S.p = pos(e);
      S.start = S.p;
      S.last = S.p;
      spec.down && spec.down(S, S.p);
    };
    cv.onpointermove = (e) => {
      const p = pos(e);
      S.last = S.p;
      S.p = p;
      spec.move && spec.move(S, p, S.last);
    };
    const up = (e) => {
      if (!S.down) return;
      S.down = false;
      const p = pos(e);
      spec.up && spec.up(S, p, S.start);
    };
    cv.onpointerup = up;
    cv.onpointercancel = up;
    let last = performance.now();
    const frame = (now) => {
      if (!S || S.spec !== spec) return;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      S.t += dt;
      if (spec.time) S.left -= dt;
      g.clearRect(0, 0, W, H);
      SCN = chain && SCENES[chain.scene] ? SCENES[chain.scene] : null;
      if (SCN) (g.fillStyle = "#000"), g.fillRect(0, 0, W, H), SCN.bg();
      spec.draw(g, S, dt);
      if (SCN && SCN.lt) light(...SCN.lt);
      finishFrame();
      el.querySelector(".gs-time").textContent = spec.time ? `${Math.max(0, S.left).toFixed(1)}s` : "";
      el.querySelector(".gs-msg").textContent = S.msg || "";
      const a = spec.auto ? spec.auto(S, dt) : null;
      if (a != null) return end(a);
      if (spec.time && S.left <= 0) return end(spec.finish(S));
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
  }
  function end(q) {
    cancelAnimationFrame(raf);
    const C = chain;
    if (!C) return;
    C.scores.push(clamp(q, 0, 1));
    playSound(q >= 0.8 ? 1047 : q >= 0.45 ? 784 : 220, 0.1, q >= 0.45 ? "sine" : "square");
    S = null;
    if (C.stages.length) return setTimeout(() => chain === C && stage(C.stages.shift()), 300);
    const avg = C.scores.reduce((s, v) => s + v, 0) / C.scores.length;
    chain = null;
    el.style.display = "none";
    if (game.mode === "ges") game.mode = "world";
    toast(avg >= 0.8 ? "Perfeito!" : avg >= 0.5 ? "Bom trabalho." : "Ficou meio ruim...", 1400);
    C.onDone(Math.round(avg * 6), 6);
  }
  function quit() {
    cancelAnimationFrame(raf);
    chain = null;
    S = null;
    el.style.display = "none";
    if (game.mode === "ges") game.mode = "world";
    toast("Você desistiu.", 1200);
  }
  function run(stages, onDone, scene) {
    chain = { stages: stages.slice(1), scores: [], onDone, scene };
    stage(stages[0]);
  }
  const runS = (scene, st, cb) => run(st, cb, scene);
  KEY_HANDLERS.ges = (k) => k === "escape" && quit();
  if (typeof BEFORE_DIALOG !== "undefined") BEFORE_DIALOG.add("ges");

  /* ----- desenho ----- */
  let SCN = null;
  const R = (x, y, w, h, c) => (SCN && x === 0 && y === 0 && w === W && h === H ? 0 : ((g.fillStyle = c), g.fillRect(x, y, w, h)));
  /* Formas com volume, como pixel art: contorno no tom escuro da própria
     cor, sombra embaixo à direita e brilho em cima à esquerda (a luz vem
     sempre de cima à esquerda). Só para cores sólidas e formas grandes. */
  const HEX = /^#[0-9a-f]{6}$/i;
  const blob = (x, y, rx, ry, c) => {
    rx = Math.max(1, rx);
    ry = Math.max(1, ry);
    const path = () => (g.beginPath(), g.ellipse(x, y, rx, ry, 0, 0, 7));
    if (!HEX.test(c) || rx < 4 || ry < 3) return ((g.fillStyle = c), path(), g.fill());
    g.fillStyle = shade(c, -0.5);
    g.beginPath();
    g.ellipse(x, y, rx + 1.5, ry + 1.5, 0, 0, 7);
    g.fill();
    g.fillStyle = c;
    path();
    g.fill();
    g.save();
    path();
    g.clip();
    g.fillStyle = shade(c, -0.2);
    g.beginPath();
    g.ellipse(x + rx * 0.35, y + ry * 0.45, rx, ry, 0, 0, 7);
    g.fill();
    g.fillStyle = c;
    g.beginPath();
    g.ellipse(x - rx * 0.08, y - ry * 0.1, rx * 0.86, ry * 0.8, 0, 0, 7);
    g.fill();
    g.fillStyle = shade(c, 0.3);
    g.beginPath();
    g.ellipse(x - rx * 0.4, y - ry * 0.45, rx * 0.3, ry * 0.2, -0.4, 0, 7);
    g.fill();
    g.restore();
  };
  const C = (x, y, r, c) => blob(x, y, r, r, c);
  const E = (x, y, rx, ry, c) => blob(x, y, rx, ry, c);
  const T = (s, x, y, c = "#fff", sz = 11, al = "center") => ((g.fillStyle = c), (g.font = `bold ${sz}px monospace`), (g.textAlign = al), g.fillText(s, x, y));
  const dash = (x1, y1, x2, y2, c = "#ffe08a") => (g.setLineDash([5, 4]), (g.strokeStyle = c), (g.lineWidth = 2), g.beginPath(), g.moveTo(x1, y1), g.lineTo(x2, y2), g.stroke(), g.setLineDash([]));
  const table = (c = "#6b4423") => (SCN ? 0 : (R(0, 0, W, H, "#2a1e30"), R(0, 60, W, H - 60, c), R(0, 60, W, 4, "#8a5a2e")));

  /* ===================== TIPOS DE GESTO ===================== */

  /** Traçar um caminho (costura, letras). strokes = [[{x,y}...], ...] */
  function sample(pts, step = 6) {
    const out = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i],
        b = pts[i + 1],
        n = Math.max(1, Math.round(dist(a, b) / step));
      for (let k = 0; k < n; k++) out.push({ x: a.x + ((b.x - a.x) * k) / n, y: a.y + ((b.y - a.y) * k) / n, v: false });
    }
    out.push({ x: pts[pts.length - 1].x, y: pts[pts.length - 1].y, v: false });
    return out;
  }
  function traceStage(title, sub, strokes, bg, ink, time = 16) {
    return {
      title,
      sub,
      time,
      state: () => ({ dots: strokes.flatMap((s) => sample(s)), off: 0, trail: [] }),
      move(S, p) {
        if (!S.down) return;
        S.trail.push(p);
        if (S.trail.length > 400) S.trail.shift();
        let near = false;
        for (const d of S.dots)
          if (Math.hypot(d.x - p.x, d.y - p.y) < 11) (d.v = true), (near = true);
          else if (Math.hypot(d.x - p.x, d.y - p.y) < 18) near = true;
        if (!near) S.off++;
      },
      draw(g, S) {
        bg(S);
        for (const d of S.dots) C(d.x, d.y, d.v ? 3 : 2, d.v ? ink : "rgba(255,255,255,.55)");
        g.strokeStyle = ink;
        g.lineWidth = 3;
        g.beginPath();
        S.trail.forEach((q, i) => (i ? g.lineTo(q.x, q.y) : g.moveTo(q.x, q.y)));
        g.stroke();
        S.msg = `${Math.round((S.dots.filter((d) => d.v).length / S.dots.length) * 100)}%`;
      },
      up(S) {
        S.trail = [];
      },
      auto: (S) => (S.dots.every((d) => d.v) ? clamp(1 - S.off / 260, 0.3, 1) : null),
      finish: (S) => (S.dots.filter((d) => d.v).length / S.dots.length) * clamp(1 - S.off / 260, 0.3, 1) * 0.8,
    };
  }

  /** Girar em círculos (mexer, moer). */
  function circleStage(title, sub, opt) {
    const { cx = 180, cy = 150, r = 60, lo = 3, hi = 7, need = 5, drawBg, ghost = true } = opt;
    return {
      title,
      sub,
      time: 18,
      state: () => ({ ang: null, spd: 0, ok: 0, rot: 0, g: 0 }),
      move(S, p) {
        if (!S.down) return;
        const a = Math.atan2(p.y - cy, p.x - cx);
        if (S.ang != null && Math.hypot(p.x - cx, p.y - cy) > 14) {
          let d = a - S.ang;
          if (d > Math.PI) d -= 2 * Math.PI;
          if (d < -Math.PI) d += 2 * Math.PI;
          S.acc = (S.acc || 0) + Math.abs(d);
          S.rot += d;
        }
        S.ang = a;
      },
      up(S) {
        S.ang = null;
      },
      draw(g, S, dt) {
        S.spd = S.spd * 0.85 + ((S.acc || 0) / Math.max(dt, 0.001)) * 0.15;
        S.acc = 0;
        if (!S.down) S.spd *= 0.9;
        if (S.spd >= lo && S.spd <= hi) S.ok += dt;
        S.g += dt * ((lo + hi) / 2);
        drawBg(S);
        if (ghost) C(cx + Math.cos(S.g) * r * 0.7, cy + Math.sin(S.g) * r * 0.7, 6, "rgba(255,224,138,.6)");
        // velocímetro
        R(330, 70, 14, 150, "#140e20");
        const k = (v) => 220 - clamp(v / (hi * 1.6), 0, 1) * 150;
        R(330, k(hi), 14, k(lo) - k(hi), "rgba(122,211,107,.5)");
        R(328, k(S.spd) - 2, 18, 4, S.spd > hi ? "#e05050" : "#fff");
        R(20, 225, 300 * clamp(S.ok / need, 0, 1), 8, "#7ad36b");
        S.msg = S.spd > hi ? "Rápido demais!" : S.spd < lo ? "Mais rápido..." : "Isso, nesse ritmo!";
      },
      auto: (S) => (S.ok >= need ? 1 : null),
      finish: (S) => S.ok / need,
    };
  }

  /** Esfregar para limpar (escova, navalha, polir). */
  function rubCells(mask, step = 6) {
    const cells = [];
    for (let y = 0; y < H; y += step) for (let x = 0; x < W; x += step) if (mask(x + step / 2, y + step / 2)) cells.push({ x, y, on: true });
    return cells;
  }
  function rub(S, p, rad = 14) {
    for (const c of S.cells) if (c.on && Math.hypot(c.x + 3 - p.x, c.y + 3 - p.y) < rad) (c.on = false), (S.rubbed = (S.rubbed || 0) + 1);
  }
  const cleaned = (S) => 1 - S.cells.filter((c) => c.on).length / Math.max(1, S.cells.length);

  /** Arrastar e soltar. items: {x,y,w,h,label,c,...}; drop(S,item,p) decide. */
  function dragStage(spec) {
    return Object.assign(
      {
        down(S, p) {
          S.held = [...S.items].reverse().find((it) => !it.fixed && p.x >= it.x && p.x <= it.x + it.w && p.y >= it.y && p.y <= it.y + it.h) || null;
          if (S.held) (S.ox = p.x - S.held.x), (S.oy = p.y - S.held.y), spec.grab && spec.grab(S, S.held);
        },
        move(S, p) {
          if (S.held) (S.held.x = p.x - S.ox), (S.held.y = p.y - S.oy);
        },
        up(S, p) {
          if (S.held) spec.drop(S, S.held, p);
          S.held = null;
        },
      },
      spec,
    );
  }
  const drawItem = (it) => {
    if (it.crate) {
      R(it.x, it.y, it.w, it.h, "#8a5a2e");
      R(it.x + 3, it.y + 3, it.w - 6, it.h - 6, "#b07a42");
      for (let k = 1; k < 3; k++) R(it.x + 3, it.y + (it.h * k) / 3, it.w - 6, 2, "#8a5a2e");
      g.strokeStyle = "#6b4423";
      g.lineWidth = 3;
      g.beginPath();
      g.moveTo(it.x + 4, it.y + 4);
      g.lineTo(it.x + it.w - 4, it.y + it.h - 4);
      g.stroke();
      R(it.x, it.y, 4, 4, "#4a4a52");
      R(it.x + it.w - 4, it.y, 4, 4, "#4a4a52");
      R(it.x, it.y + it.h - 4, 4, 4, "#4a4a52");
      R(it.x + it.w - 4, it.y + it.h - 4, 4, 4, "#4a4a52");
      return;
    }
    if (it.icon) {
      R(it.x, it.y, it.w, it.h, "#5a3a22");
      R(it.x + 2, it.y + 2, it.w - 4, it.h - 4, "#efe2c0");
      icon(it.icon, it.x + 14, it.y + it.h / 2, 2);
      if (it.label) T(it.label, it.x + 26, it.y + it.h / 2 + 4, "#3a2414", it.sz || 9, "left");
      return;
    }
    if (it.v != null && /^\d+$/.test(it.label || "")) {
      // moeda de verdade: um montinho com borda, brilho e o valor cunhado
      const cx = it.x + it.w / 2,
        cy = it.y + it.h / 2;
      const base = it.c || "#f2c14e";
      for (let k = 2; k >= 0; k--) E(cx, cy + k * 3, 15, 8, shade(base, -0.25 - k * 0.05));
      E(cx, cy - 2, 15, 9, base);
      g.strokeStyle = shade(base, -0.35);
      g.lineWidth = 1;
      g.beginPath();
      g.ellipse(cx, cy - 2, 11, 6, 0, 0, 7);
      g.stroke();
      T(it.label, cx, cy + 2, shade(base, -0.55), it.sz || 10);
      return;
    }
    // etiqueta com bisel (luz em cima, sombra embaixo)
    R(it.x, it.y, it.w, it.h, shade(it.c || "#c9a050", -0.45));
    R(it.x + 1, it.y + 1, it.w - 2, it.h - 2, it.c || "#c9a050");
    R(it.x + 1, it.y + 1, it.w - 2, 2, shade(it.c || "#c9a050", 0.3));
    R(it.x + 1, it.y + it.h - 3, it.w - 2, 2, shade(it.c || "#c9a050", -0.2));
    if (it.label) T(it.label, it.x + it.w / 2, it.y + it.h / 2 + 4, it.tc || "#1a1028", it.sz || 10);
  };

  /* ===================== CENÁRIOS EM PIXEL ART =====================
   * Cada ofício tem a sua bancada vista de perto, com paleta quente e luz
   * (janela, fogo, vela) como última camada, no estilo do resto do jogo. */
  const PX = 4;
  const rr = (x, y, w, h, c) => ((g.fillStyle = c), g.fillRect(Math.round(x / 2) * 2, Math.round(y / 2) * 2, Math.round(w / 2) * 2, Math.round(h / 2) * 2));
  function icon(key, x, y, size = 3) {
    const old = ctx;
    ctx = g;
    try {
      drawPixelIcon(key, x, y, size);
    } finally {
      ctx = old;
    }
  }
  function planks(y0, y1, a, b, seam) {
    for (let y = y0; y < y1; y += 12) {
      rr(0, y, W, 12, (y / 12) % 2 ? a : b);
      rr(0, y + 11, W, 1, seam);
      for (let x = ((y / 12) % 2) * 40; x < W; x += 80) rr(x, y, 1, 12, seam);
    }
  }
  function bricks(y0, y1, a, b, mortar) {
    rr(0, y0, W, y1 - y0, mortar);
    for (let y = y0, r = 0; y < y1; y += 10, r++)
      for (let x = -(r % 2) * 12; x < W; x += 24) rr(x + 1, y + 1, 22, 8, (x + y) % 48 ? a : b);
  }
  function plaster(y0, y1, a, b) {
    rr(0, y0, W, y1 - y0, a);
    for (let i = 0; i < 40; i++) rr((i * 97) % W, y0 + ((i * 53) % (y1 - y0)), 6, 2, b);
  }
  function windowAt(x, y, w = 44, h = 36, sky = "#9fd0f0") {
    rr(x - 4, y - 4, w + 8, h + 8, "#5a3a22");
    rr(x, y, w, h, sky);
    rr(x, y + h - 10, w, 10, "#cfe8f8");
    rr(x + w / 2 - 1, y, 2, h, "#5a3a22");
    rr(x, y + h / 2 - 1, w, 2, "#5a3a22");
  }
  function shelf(x, y, w, icons) {
    rr(x, y + 18, w, 4, "#6b4423");
    rr(x, y + 22, w, 2, "#3a2414");
    icons.forEach((k, i) => icon(k, x + 12 + i * ((w - 16) / Math.max(1, icons.length - 1 || 1)), y + 10, 2));
  }
  function counter(y, top = "#8a5a2e", front = "#6b4423") {
    rr(0, y, W, 6, top);
    rr(0, y + 6, W, H - y - 6, front);
    for (let x = 0; x < W; x += 60) rr(x, y + 6, 2, H - y - 6, "#4a2e17");
    rr(0, y + 6, W, 2, "rgba(0,0,0,.25)");
  }
  function sky(top, bot) {
    const gr = g.createLinearGradient(0, 0, 0, H);
    gr.addColorStop(0, top);
    gr.addColorStop(1, bot);
    g.fillStyle = gr;
    g.fillRect(0, 0, W, H);
  }
  function light(x, y, r, col, a = 0.35) {
    const gr = g.createRadialGradient(x, y, 4, x, y, r);
    gr.addColorStop(0, col.replace("A", a));
    gr.addColorStop(1, col.replace("A", 0));
    g.fillStyle = gr;
    g.fillRect(0, 0, W, H);
  }
  // textura de pixel (pontilhado) e luz de cima à esquerda em toda cena
  let grain = null;
  function finishFrame() {
    if (!grain) {
      const c = document.createElement("canvas");
      c.width = 64;
      c.height = 64;
      const q = c.getContext("2d");
      for (let y = 0; y < 64; y += 2)
        for (let x = 0; x < 64; x += 2) {
          const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
          const v = n - Math.floor(n);
          if (v > 0.82) ((q.fillStyle = "rgba(255,255,255,.07)"), q.fillRect(x, y, 2, 2));
          else if (v < 0.18) ((q.fillStyle = "rgba(0,0,0,.08)"), q.fillRect(x, y, 2, 2));
        }
      grain = g.createPattern(c, "repeat");
    }
    g.fillStyle = grain;
    g.fillRect(0, 0, W, H);
    const gr = g.createLinearGradient(0, 0, W, H);
    gr.addColorStop(0, "rgba(255,236,190,.16)");
    gr.addColorStop(0.55, "rgba(255,236,190,0)");
    gr.addColorStop(1, "rgba(30,10,40,.18)");
    g.fillStyle = gr;
    g.fillRect(0, 0, W, H);
    vignette();
  }
  function vignette() {
    const gr = g.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 0.95);
    gr.addColorStop(0, "rgba(0,0,0,0)");
    gr.addColorStop(1, "rgba(10,5,15,.55)");
    g.fillStyle = gr;
    g.fillRect(0, 0, W, H);
  }
  /* ----- paisagem de verdade para os ofícios ao ar livre ----- */
  const hn = (i) => {
    const v = Math.sin(i * 91.7) * 43758.5453;
    return v - Math.floor(v);
  };
  function landscape(top, bot, ground, gy = 186) {
    sky(top, bot);
    // sol e nuvens
    const sg = g.createRadialGradient(300, 34, 4, 300, 34, 46);
    sg.addColorStop(0, "rgba(255,250,210,.95)");
    sg.addColorStop(0.3, "rgba(255,240,180,.5)");
    sg.addColorStop(1, "rgba(255,240,180,0)");
    g.fillStyle = sg;
    g.fillRect(250, 0, 100, 90);
    for (const [cx, cy, k] of [[70, 34, 1], [180, 22, 0.8], [250, 60, 0.6]]) for (let i = 0; i < 5; i++) E(cx + (i - 2) * 11 * k, cy - (i % 2) * 5 * k, 13 * k, 8 * k, i % 2 ? "#ffffff" : "#eef6fb");
    // morros ao longe (mais azulados quanto mais longe)
    for (const [yy, col, amp, fr] of [[gy - 62, "#9ab8a8", 10, 0.018], [gy - 40, "#7aa07a", 14, 0.025], [gy - 18, "#5a8a4a", 8, 0.04]]) {
      g.fillStyle = col;
      g.beginPath();
      g.moveTo(0, gy);
      for (let x = 0; x <= W; x += 6) g.lineTo(x, yy + Math.sin(x * fr + yy) * amp + Math.sin(x * fr * 2.7) * amp * 0.3);
      g.lineTo(W, gy);
      g.fill();
    }
    // fileira de árvores pequenas no horizonte
    for (let i = 0; i < 14; i++) {
      const x = i * 27 + hn(i) * 14,
        y = gy - 14 - hn(i + 3) * 8;
      rr(x - 1, y, 2, 10, "#4a3a2a");
      E(x, y - 2, 7, 6, ["#4a7a3a", "#3a6a32", "#5a8a42"][i % 3]);
    }
    // chão com tufos de capim e florzinhas
    rr(0, gy, W, H - gy, ground);
    rr(0, gy, W, 2, shade(ground, 0.18));
    for (let i = 0; i < 60; i++) {
      const x = hn(i * 7) * W,
        y = gy + 4 + hn(i * 13) * (H - gy - 8);
      rr(x, y, 1, 4, shade(ground, -0.25));
      rr(x + 2, y + 1, 1, 3, shade(ground, 0.2));
      if (i % 9 === 0) rr(x + 1, y - 1, 2, 2, ["#f2eee4", "#f2c14e", "#e86a8a"][i % 3]);
    }
  }
  function leafyTree(x, base, h, r, cols = ["#3a6a2a", "#4a8a3a", "#5a9a42"]) {
    // tronco que afina, com raízes e casca
    g.fillStyle = "#5a3a1e";
    g.beginPath();
    g.moveTo(x - r * 0.32 - 6, base);
    g.lineTo(x - r * 0.18, base - h);
    g.lineTo(x + r * 0.18, base - h);
    g.lineTo(x + r * 0.32 + 6, base);
    g.fill();
    g.fillStyle = "#7a5230";
    g.fillRect(x - r * 0.18, base - h, r * 0.14, h);
    for (let k = 0; k < h; k += 9) rr(x - r * 0.1 + ((k * 7) % 9) - 4, base - h + k, 2, 6, "#3a2414");
    // copa: um cacho de folhagens, do escuro (atrás) para o claro (na frente)
    const blobs = [[0, -1.05, 1], [-0.7, -0.75, 0.75], [0.7, -0.78, 0.72], [-0.4, -1.4, 0.7], [0.45, -1.35, 0.68], [-0.95, -0.45, 0.55], [0.95, -0.48, 0.52], [0, -0.55, 0.7]];
    blobs.forEach(([dx, dy, k], i) => E(x + dx * r, base - h + dy * r * 0.6, r * 0.62 * k + 6, r * 0.5 * k + 5, cols[Math.min(2, Math.floor((i / blobs.length) * 3))]));
    for (let i = 0; i < 26; i++) rr(x + (hn(i + x) - 0.5) * r * 1.8, base - h - r * 0.9 + hn(i * 3 + x) * r * 1.1, 2, 2, i % 2 ? shade(cols[2], 0.25) : shade(cols[0], -0.2));
  }
  function wheatEar(x, top, len, col = "#e8b84a") {
    for (let k = 0; k < 7; k++) {
      const yy = top + k * (len / 7);
      E(x - 2.2, yy, 2.4, 3.2, k % 2 ? col : shade(col, -0.12));
      E(x + 2.2, yy + 1.5, 2.4, 3.2, k % 2 ? shade(col, -0.12) : col);
      rr(x - 5, yy - 3, 1, 4, shade(col, 0.15)); // barbas da espiga
      rr(x + 5, yy - 2, 1, 4, shade(col, 0.15));
    }
  }
  const SCENES = {
    padeiro: { bg: () => (bricks(0, 64, "#c97a4a", "#b86a3a", "#8a4a2a"), windowAt(24, 10), shelf(90, 6, 120, ["bread", "cake", "wheat", "pie"]), counter(64, "#d9b07a", "#a8784a")), lt: [300, 30, 200, "rgba(255,180,90,A)"] },
    ferreiro: { bg: () => (bricks(0, 64, "#4a3a3a", "#3a2e2e", "#2a1e1e"), shelf(150, 8, 160, ["sword", "axe", "hammer", "pick"]), counter(64, "#4a4a52", "#2a2a32")), lt: [250, 160, 220, "rgba(255,120,40,A)"] },
    cozinheiro: { bg: () => (plaster(0, 64, "#d8c8a8", "#c8b898"), windowAt(280, 10), shelf(30, 6, 160, ["stew", "cheese", "meat", "herb", "honey"]), counter(64, "#c9a878", "#8a6a3a")), lt: [300, 20, 220, "rgba(255,230,170,A)"] },
    taverneiro: { bg: () => (planks(0, 64, "#6b4423", "#5a3a1e", "#3a2414"), shelf(20, 6, 140, ["mug", "wine", "mug", "wine"]), shelf(200, 6, 140, ["cheese", "bread", "pie"]), counter(64, "#8a5a2e", "#5a3a1e")), lt: [180, 0, 260, "rgba(255,190,100,A)"] },
    costureiro: { bg: () => (plaster(0, 64, "#e8d8e8", "#d8c8d8"), windowAt(20, 10), shelf(90, 6, 220, ["shirt", "robe", "hat", "feather"]), counter(64, "#a8784a", "#7a5a2e")), lt: [40, 20, 220, "rgba(255,240,200,A)"] },
    escriba: { bg: () => (planks(0, 64, "#4a3020", "#3e281a", "#2a1a10"), shelf(20, 6, 320, ["book", "scroll", "book", "feather", "scroll", "book"]), counter(64, "#6b4423", "#4a2e17"), icon("sun", 330, 90, 2)), lt: [330, 80, 200, "rgba(255,200,110,A)"] },
    pintor: { bg: () => (plaster(0, 64, "#f2eee4", "#e2ded4"), windowAt(270, 10), shelf(20, 6, 200, ["flower", "staff", "gem"]), counter(64, "#c9a878", "#a8784a")), lt: [290, 20, 240, "rgba(255,245,220,A)"] },
    moleiro: { bg: () => (planks(0, 240, "#a8784a", "#9a6a3e", "#6b4423"), shelf(20, 6, 120, ["wheat", "wheat", "bread"])), lt: [180, 40, 240, "rgba(255,230,170,A)"] },
    acougueiro: { bg: () => (plaster(0, 64, "#e8e4dc", "#d8d4cc"), shelf(40, 6, 280, ["meat", "meat", "cheese", "meat"]), counter(64, "#c9a878", "#8a6a3a")), lt: [180, 0, 240, "rgba(255,240,220,A)"] },
    peixeiro: { bg: () => (plaster(0, 64, "#cfe0e8", "#bfd0d8"), shelf(40, 6, 280, ["fish", "fish", "water", "fish"]), counter(64, "#8ab0c0", "#5a8090")), lt: [180, 0, 240, "rgba(220,240,255,A)"] },
    boticario: { bg: () => (planks(0, 240, "#3a4a32", "#34422c", "#22301c"), shelf(20, 6, 320, ["potion", "herb", "potionB", "herb", "potion", "flower"])), lt: [60, 40, 220, "rgba(180,255,170,A)"] },
    cavalarico: { bg: () => (planks(0, 240, "#8a6a3a", "#7a5a2e", "#5a3a1e"), shelf(220, 6, 120, ["horse", "wheat", "water"])), lt: [180, 0, 260, "rgba(255,230,170,A)"] },
    balconista: { bg: () => (planks(0, 64, "#6b4423", "#5a3a1e", "#3a2414"), shelf(20, 6, 320, ["bag", "crate", "honey", "bread", "soap", "bag"]), counter(186, "#8a5a2e", "#6b4423")), lt: [180, 0, 240, "rgba(255,210,140,A)"] },
    carregador: { bg: () => (bricks(0, 130, "#8a6a4a", "#7a5a3e", "#4a3424"), shelf(20, 20, 140, ["crate", "bag", "crate"]), shelf(200, 20, 140, ["bag", "crate", "bag"]), shelf(20, 70, 320, ["crate", "crate", "bag", "crate", "bag"]), planks(130, 240, "#a8784a", "#9a6a3e", "#6b4423")), lt: [180, 0, 260, "rgba(255,220,160,A)"] },
    bardo: { bg: () => (planks(0, 240, "#5a3a1e", "#4e321a", "#2a1a10"), icon("note", 40, 30, 3), icon("note", 320, 40, 3)), lt: [70, 130, 160, "rgba(255,200,110,A)"] },
    joalheiro: { bg: () => (plaster(0, 64, "#2a3a5a", "#24324e"), shelf(40, 6, 280, ["gem", "ring", "amulet", "gem"])), lt: [180, 130, 220, "rgba(200,230,255,A)"] },
    bibliotecario: { bg: () => (planks(0, 240, "#3a2a1e", "#34261a", "#20160e")), lt: [180, 0, 260, "rgba(255,220,160,A)"] },
    professor: { bg: () => (plaster(0, 240, "#d8c8a8", "#c8b898"), windowAt(10, 70, 24, 60)), lt: [20, 100, 220, "rgba(255,240,200,A)"] },
    lenhador: { bg: () => (landscape("#7ab8e0", "#d8eef8", "#5a8a3a", 190), leafyTree(44, 196, 70, 40, ["#3a5a32", "#4a6a3a", "#5a7a42"]), leafyTree(316, 198, 80, 44, ["#3a5a32", "#4a6a3a", "#5a7a42"])), lt: [300, 0, 300, "rgba(255,250,200,A)"] },
    fazendeiro: { bg: () => (landscape("#7ab8e0", "#f8e8b8", "#8a6a3a", 150), (() => { for (let y = 152; y < 190; y += 6) rr(0, y, W, 3, y % 12 ? "#c9a050" : "#b8903e"); })()), lt: [320, 0, 320, "rgba(255,240,180,A)"] },
    minerador: { bg: () => (rr(0, 0, W, H, "#1a1418"), bricks(0, 240, "#3a3038", "#342a32", "#241c22")), lt: [40, 40, 160, "rgba(255,190,90,A)"] },
    feirante: { bg: () => (sky("#9fd0f0", "#e8f0f8"), (() => { for (let x = 0; x < W; x += 30) rr(x, 0, 30, 26, (x / 30) % 2 ? "#c94a4a" : "#f2eee4"); for (let x = 0; x < W; x += 30) (g.fillStyle = (x / 30) % 2 ? "#c94a4a" : "#f2eee4"), g.beginPath(), g.arc(x + 15, 26, 15, 0, Math.PI), g.fill(); })(), counter(150, "#a8784a", "#7a5a2e")), lt: [180, 0, 280, "rgba(255,240,200,A)"] },
    acendedor: { bg: () => (sky("#141434", "#2a2a5a"), [30, 250].forEach((x) => (rr(x, 120, 90, 120, "#3a3048"), rr(x + 10, 140, 14, 14, "#ffd66b"), rr(x + 60, 140, 14, 14, "#ffd66b"), (g.fillStyle = "#4a2a3a"), g.beginPath(), g.moveTo(x - 6, 120), g.lineTo(x + 45, 90), g.lineTo(x + 96, 120), g.fill()))), lt: [180, 90, 140, "rgba(255,200,110,A)"] },
  };
  SCENES.feirante2 = SCENES.feirante;
  SCENES.stall = SCENES.feirante;

  /* ===================== OS OFÍCIOS ===================== */

  /* ----- Padeiro ----- */
  const rollDough = {
    title: "Abrir a massa",
    sub: "Arraste o rolo sobre a massa, para os lados e para cima e para baixo, até ela encher a marca. Passar do ponto rasga!",
    time: 18,
    ready: "Pronta!",
    state: () => ({ rx: 36, ry: 26, tx: 96, ty: 62 }),
    move(S, p, l) {
      if (!S.down || !l) return;
      const inside = ((p.x - 180) / (S.rx + 10)) ** 2 + ((p.y - 150) / (S.ry + 10)) ** 2 <= 1;
      if (!inside) return;
      S.rx = Math.min(S.tx + 20, S.rx + Math.abs(p.x - l.x) * 0.05);
      S.ry = Math.min(S.ty + 16, S.ry + Math.abs(p.y - l.y) * 0.05);
    },
    draw(g, S) {
      table("#a8784a");
      for (let i = 0; i < 30; i++) C((i * 53) % W, 70 + ((i * 37) % 160), 1.5, "rgba(255,255,255,.35)");
      E(180, 150, S.tx, S.ty, "rgba(0,0,0,.08)");
      g.setLineDash([6, 4]);
      g.strokeStyle = "#ffe08a";
      g.lineWidth = 2;
      g.beginPath();
      g.ellipse(180, 150, S.tx, S.ty, 0, 0, 7);
      g.stroke();
      g.setLineDash([]);
      const torn = S.rx > S.tx + 12 || S.ry > S.ty + 10;
      E(180, 150, S.rx, S.ry, torn ? "#d8c08a" : "#f0e0b0");
      if (torn) dash(170, 140, 190, 160, "#8a5a2e");
      // rolo
      const px = S.down ? S.p.x : 300,
        py = S.down ? S.p.y : 90;
      R(px - 48, py - 7, 96, 14, "#c9925a");
      R(px - 62, py - 4, 14, 8, "#8a5a2e");
      R(px + 48, py - 4, 14, 8, "#8a5a2e");
      S.msg = torn ? "Rasgou um pouco!" : "";
    },
    auto: (S) => (Math.abs(S.rx - S.tx) < 5 && Math.abs(S.ry - S.ty) < 4 ? 1 : null),
    finish: (S) => clamp(1 - (Math.abs(S.rx - S.tx) / S.tx + Math.abs(S.ry - S.ty) / S.ty) * 1.2, 0, 1),
  };
  const oven = dragStage({
    title: "Assar o pão",
    sub: "Arraste a forma para dentro do forno. Quando o pão dourar, puxe de volta para a mesa.",
    time: 30,
    state: () => ({ items: [{ x: 40, y: 140, w: 70, h: 30, c: "#5a5a6a", tray: true }], cook: 0, inside: false, done: false }),
    drop(S, it) {
      const inOven = it.x + it.w / 2 > 220;
      if (inOven) (S.inside = true), (it.x = 248), (it.y = 128);
      else if (S.inside) (S.inside = false), (S.done = true);
    },
    draw(g, S, dt) {
      table();
      R(220, 70, 130, 120, "#6a6a72");
      R(236, 96, 98, 70, "#1a0a08");
      const fire = 0.5 + Math.sin(S.t * 9) * 0.1;
      R(240, 156, 90, 8, `rgba(255,120,40,${fire})`);
      if (S.inside && !S.held) S.cook += dt * 0.16;
      const it = S.items[0];
      drawItem(it);
      const p = S.cook;
      const col = p < 0.55 ? `rgb(${240 - p * 40},${228 - p * 110},${190 - p * 230})` : p < 0.72 ? "#d9a441" : p < 0.9 ? "#8a5020" : "#2a1a10";
      E(it.x + it.w / 2, it.y + 6, 28, 12, col);
      if (p > 0.85) C(it.x + 35, it.y - 20 - (S.t % 1) * 20, 6, "rgba(160,160,160,.6)");
      R(10, 200, 16, 16, "#d9a441");
      T("dourado", 30, 212, "#fff", 10, "left");
      S.msg = S.inside ? (p < 0.5 ? "Assando..." : p < 0.72 ? "Dourado! Puxe agora!" : "Está queimando!") : "";
    },
    auto: (S) => (S.done ? (S.cook >= 0.55 && S.cook <= 0.72 ? 1 : S.cook >= 0.45 && S.cook <= 0.8 ? 0.6 : 0.15) : S.cook > 1.05 ? 0 : null),
    finish: (S) => (S.cook >= 0.55 && S.cook <= 0.72 ? 0.8 : 0.1),
  });

  /* ----- Barbeiro ----- */
  // want: comprimento pedido (em pixels) a partir da raiz de cada mecha
  // want: até que altura (y) cortar; m = mecha da franja (em cima do rosto)
  const STYLES = [
    { n: "reto na altura do queixo, franja acima dos olhos", f: (i, N, m) => (m ? 86 : 138) },
    { n: "curtinho, bem rente", f: (i, N, m, top) => top + 14 },
    { n: "repicado em V (mais curto dos lados) e franja aparada", f: (i, N, m) => (m ? 86 : 112 + (1 - Math.abs(i - (N - 1) / 2) / ((N - 1) / 2)) * 44) },
    { n: "franja curtinha e o resto comprido", f: (i, N, m) => (m ? 80 : 160) },
  ];
  function haircut() {
    const st = pick(STYLES);
    const beard = Math.random() < 0.6;
    return {
      title: "Cadeira do barbeiro",
      sub: `O cliente quer o cabelo <b>${st.n}</b>${beard ? " e a <b>barba raspada</b>" : ""}. Passe a tesoura pelas mechas na linha marcada${beard ? "; com a navalha, esfregue a barba" : ""}.`,
      time: 30,
      ready: "Pronto!",
      tools: [{ id: "tes", n: "✂ Tesoura" }, ...(beard ? [{ id: "nav", n: "🪒 Navalha" }] : [])],
      state() {
        const PAL = [
          ["#e8b896", "#c99272"],
          ["#c08458", "#9a6440"],
          ["#8a5a3a", "#6a4028"],
          ["#f4dccb", "#d8b8a0"],
        ];
        const HAIR = [
          ["#5a3a22", "#3a2414"],
          ["#1a1a1b", "#0a0a0c"],
          ["#d9a441", "#a87a28"],
          ["#8a3a1a", "#5a2410"],
          ["#d9d9d9", "#a8a8a8"],
        ];
        const [skin, skin2] = pick(PAL),
          [hair, hair2] = pick(HAIR);
        const N = 21,
          strands = [];
        for (let i = 0; i < N; i++) {
          const x = 140 + i * 4;
          const dx = (x + 2 - 180) / 40;
          const top = Math.round((100 - Math.sqrt(Math.max(0, 1 - dx * dx)) * 34) / 4) * 4;
          const mid = Math.abs(x + 2 - 180) < 22;
          const len = Math.round(((mid ? 108 : 172) - top) / 4) * 4 + Math.floor(Math.random() * 2) * 4;
          strands.push({ x, top, len, want: Math.max(8, Math.min(len, st.f(i, N, mid, top) - top)) });
        }
        const cells = beard ? rubCells((x, y) => ((x - 180) / 26) ** 2 + ((y - 130) / 14) ** 2 <= 1 && y > 122, 4) : [];
        return { strands, cells, snips: [], skin, skin2, hair, hair2 };
      },
      move(S, p, l) {
        if (!S.down || !l) return;
        if (S.tool === "nav") return rub(S, p, 9);
        const x1 = Math.min(l.x, p.x) - 2,
          x2 = Math.max(l.x, p.x) + 2;
        for (const s of S.strands) {
          if (s.x + 4 < x1 || s.x > x2) continue;
          const y = l.x === p.x ? p.y : l.y + ((p.y - l.y) * (s.x + 2 - l.x)) / (p.x - l.x || 1);
          const cut = Math.round((y - s.top) / 4) * 4;
          if (cut >= 4 && cut < s.len) {
            s.len = cut;
            S.snips.push({ x: s.x, y, t: 0.7, c: Math.random() < 0.5 ? S.hair : S.hair2 });
            playSound(1800 + Math.random() * 400, 0.015, "square");
          }
        }
      },
      draw(g, S, dt) {
        // salão: parede listrada, espelho, cadeira
        for (let x = 0; x < W; x += 16) R(x, 0, 16, H, (x / 16) % 2 ? "#4a3a5a" : "#433452");
        R(0, 196, W, 44, "#6b4423");
        for (let x = 0; x < W; x += 24) R(x, 196, 2, 44, "#5a3a1e");
        R(108, 24, 144, 4, "#c9a050");
        R(108, 24, 4, 120, "#c9a050");
        R(248, 24, 4, 120, "#c9a050");
        R(124, 120, 112, 96, "#7a2a2a");
        R(124, 120, 112, 4, "#9a3a3a");
        // pescoço e capa listrada
        R(168, 132, 24, 16, S.skin2);
        for (let y = 144; y < 240; y += 4) {
          const half = 30 + (y - 144) * 0.9;
          for (let x = 180 - half; x < 180 + half; x += 4) R(Math.round(x / 4) * 4, y, 4, 4, Math.floor((x - 180) / 12) % 2 ? "#e8e4dc" : "#c9d8e8");
        }
        R(176, 146, 8, 6, "#c9a050");
        // cabeça em pixel
        for (let y = 60; y < 140; y += 4)
          for (let x = 140; x < 220; x += 4) {
            const ex = (x + 2 - 180) / 32,
              ey = (y + 2 - 100) / 38;
            const d = ex * ex + ey * ey;
            if (d <= 1) R(x, y, 4, 4, d > 0.8 ? S.skin2 : S.skin);
          }
        R(144, 96, 4, 12, S.skin2);
        R(212, 96, 4, 12, S.skin2);
        // rosto
        R(164, 96, 8, 8, "#fff");
        R(188, 96, 8, 8, "#fff");
        R(168, 96, 4, 8, "#1a1028");
        R(192, 96, 4, 8, "#1a1028");
        R(164, 90, 12, 3, S.hair2);
        R(184, 90, 12, 3, S.hair2);
        R(178, 104, 4, 8, S.skin2);
        R(172, 118, 16, 4, "#a85a4a");
        // barba (some com a navalha)
        for (const c of S.cells) if (c.on) R(c.x, c.y, 4, 4, (c.x + c.y) % 8 ? S.hair2 : S.hair);
        // touca do cabelo (raiz)
        for (const s of S.strands) R(s.x, s.top - 8, 4, 10, S.hair2);
        // mechas (por cima do rosto: cortar revela o rosto)
        S.strands.forEach((s, i) => {
          const sway = Math.round(Math.sin(S.t * 2 + i) * 0.6) * 4 * 0;
          for (let y = 0; y < s.len; y += 4) R(s.x + sway, s.top + y, 4, 4, (i + (y >> 3)) % 3 ? S.hair : S.hair2);
          R(s.x, s.top + s.len - 4, 4, 4, S.hair2);
        });
        // linha do corte pedido
        g.setLineDash([4, 4]);
        g.strokeStyle = "#ffe08a";
        g.lineWidth = 2;
        g.beginPath();
        S.strands.forEach((s, i) => (i ? g.lineTo(s.x + 2, s.top + s.want) : g.moveTo(s.x + 2, s.top + s.want)));
        g.stroke();
        g.setLineDash([]);
        for (const sn of S.snips) (sn.t -= dt), sn.t > 0 && R(sn.x, sn.y + (0.7 - sn.t) * 80, 4, 8, sn.c);
        S.snips = S.snips.filter((q) => q.t > 0);
        // ferramenta em pixel
        if (S.p.x > 0) {
          const px = Math.round(S.p.x / 2) * 2,
            py = Math.round(S.p.y / 2) * 2;
          if (S.tool === "nav") (R(px - 2, py - 10, 4, 12, "#c9a050"), R(px - 6, py - 14, 12, 4, "#e8e8f0"));
          else (R(px - 8, py - 2, 16, 2, "#e8e8f0"), R(px - 8, py + 2, 16, 2, "#c9c9d0"), R(px + 6, py - 6, 6, 6, "#c94a4a"), R(px + 6, py + 2, 6, 6, "#c94a4a"));
        }
      },
      finish(S) {
        const err = S.strands.reduce((s, q) => s + Math.abs(q.len - q.want) + (q.len < q.want - 8 ? 8 : 0), 0) / S.strands.length;
        const hair = clamp(1 - err / 30, 0, 1);
        return beard ? hair * 0.7 + cleaned(S) * 0.3 : hair;
      },
    };
  }

  /* ----- Ferreiro ----- */
  const forge = {
    title: "Forjar",
    sub: "Bombeie o FOLE (arraste para cima e para baixo na esquerda). Com o ferro laranja, MARTELE: um golpe rápido de cima para baixo em cima do ferro.",
    time: 24,
    state: () => ({ T: 0.25, dir: 0, run: 0, shape: 0, bad: 0, fx: 0 }),
    move(S, p, l) {
      if (!S.down || !l || S.start.x > 120) return;
      const d = Math.sign(p.y - l.y);
      if (d && d !== S.dir) {
        if (S.run > 30) (S.T = Math.min(1.1, S.T + 0.1)), playSound(110, 0.06, "sawtooth");
        S.run = 0;
        S.dir = d;
      }
      S.run += Math.abs(p.y - l.y);
    },
    up(S, p, s) {
      if (!s || s.x < 140) return;
      const fast = p.tm - s.tm < 350 && p.y - s.y > 40 && p.x > 170 && p.x < 330;
      if (!fast) return;
      S.fx = 0.15;
      if (S.T >= 0.55 && S.T <= 0.88) (S.shape++, (S.T -= 0.05), playSound(900, 0.07, "square"), (game.shake = 0.06));
      else (S.bad++, playSound(200, 0.08, "square"), (S.msg2 = S.T < 0.55 ? "Ferro frio: o martelo quica!" : "Quente demais!"));
    },
    draw(g, S, dt) {
      R(0, 0, W, H, "#241a1a");
      S.T = Math.max(0, S.T - dt * 0.12);
      // a forja de pedra com o carvão em brasa atrás
      const glow = clamp(S.T, 0.2, 1);
      const FX = 200;
      R(FX, 74, 110, 66, "#4a3a3a");
      for (let r = 0; r < 6; r++) for (let k = 0; k < 5; k++) R(FX + 2 + k * 22 + (r % 2) * 10, 76 + r * 10, 20, 8, (r + k) % 3 ? "#5a4646" : "#3e3030");
      R(FX + 10, 60, 90, 16, "#3a2e2e"); // coifa
      R(FX + 8, 116, 94, 16, "#1a0e0e");
      for (let i = 0; i < 14; i++) E(FX + 16 + i * 6, 122 + Math.sin(S.t * 6 + i) * 1.5, 4, 3, i % 3 ? `rgb(255,${100 + glow * 80},40)` : "#ffe08a");
      light(FX + 55, 122, 130, "rgba(255,140,40,A)", 0.25 + glow * 0.3);
      // fole de couro: as tábuas abrem e fecham com o seu movimento
      const fy = S.down && S.start && S.start.x < 120 ? clamp(S.p.y, 90, 200) : 150;
      const open = clamp((fy - 90) / 110, 0, 1);
      R(18, 196, 92, 10, "#3a2414");
      g.fillStyle = "#8a5a32";
      g.beginPath();
      g.moveTo(26, 150 - 30 * open);
      g.lineTo(96, 140);
      g.lineTo(96, 160);
      g.lineTo(26, 150 + 30 * open);
      g.fill();
      for (let k = 0; k < 4; k++) R(34 + k * 14, 150 - 26 * open + k * 4, 3, 52 * open - k * 8 + 6, "#5a3a1e"); // dobras do couro
      R(20, 146 - 32 * open, 82, 6, "#6b4423");
      R(20, 150 + 28 * open, 82, 6, "#6b4423");
      R(96, 146, 30, 6, "#4a4a52"); // bico
      R(0, 140 - 32 * open, 26, 8, "#a8784a"); // cabo
      T("FOLE", 60, 225, "#ffe08a", 10);
      // bigorna de ferro em cima do toco
      R(214, 200, 70, 40, "#6b4423");
      R(214, 200, 70, 4, "#8a5a2e");
      g.fillStyle = "#3a3a44";
      g.beginPath();
      g.moveTo(176, 168);
      g.lineTo(330, 168);
      g.lineTo(318, 182);
      g.lineTo(286, 186);
      g.lineTo(276, 200);
      g.lineTo(222, 200);
      g.lineTo(212, 186);
      g.lineTo(196, 182);
      g.closePath();
      g.fill();
      R(176, 168, 154, 4, "#7a7a88");
      g.fillStyle = "#3a3a44";
      g.beginPath();
      g.moveTo(330, 168);
      g.lineTo(352, 172);
      g.lineTo(330, 178);
      g.fill(); // o chifre da bigorna
      const col = S.T < 0.4 ? "#6a6a72" : S.T < 0.55 ? "#a84a2a" : S.T < 0.88 ? "#ff8a2a" : "#fff2c0";
      const bend = S.shape * 4;
      g.fillStyle = col;
      g.beginPath();
      g.moveTo(190, 160);
      g.quadraticCurveTo(250, 160 - bend, 310, 160);
      g.lineTo(310, 170);
      g.quadraticCurveTo(250, 170 - bend, 190, 170);
      g.fill();
      if (S.T > 0.55) C(250, 162, 30, "rgba(255,140,40,.12)");
      // termômetro
      R(130, 70, 14, 130, "#140e20");
      R(130, 200 - 0.88 * 130, 14, (0.88 - 0.55) * 130, "rgba(255,138,42,.35)");
      R(130, 200 - clamp(S.T, 0, 1) * 130, 14, 3, "#fff");
      // martelo
      if (S.fx > 0) {
        S.fx -= dt;
        for (let i = 0; i < 10; i++) R(250 + Math.cos(i * 0.63) * (30 - S.fx * 120), 160 + Math.sin(i * 0.63) * (18 - S.fx * 70) - 6, 3, 3, i % 2 ? "#ffe08a" : "#ff8a2a"); // faíscas
      }
      // o martelo seguindo o dedo
      if (S.p.x > 140) {
        g.save();
        g.translate(S.p.x, S.p.y);
        g.rotate(S.down ? 0.5 : -0.3);
        R(-3, 0, 6, 46, "#8a5a2e");
        R(-14, -12, 28, 14, "#5a5a66");
        R(-14, -12, 28, 3, "#9a9aa8");
        g.restore();
      }
      T("●".repeat(S.shape) + "○".repeat(Math.max(0, 5 - S.shape)), 250, 60, "#ffb060", 16);
      S.msg = S.msg2 || "";
      if (S.msg2 && Math.random() < 0.01) S.msg2 = "";
    },
    auto: (S) => (S.shape >= 5 ? clamp(1 - S.bad * 0.1, 0.3, 1) : S.T > 1.05 ? 0.2 : null),
    finish: (S) => (S.shape / 5) * clamp(1 - S.bad * 0.1, 0.3, 1),
  };

  /* ----- Cozinha ----- */
  const VEG = [
    ["cenoura", "#e8862a"],
    ["abobrinha", "#5a9a3a"],
    ["alho-poró", "#d8e8b0"],
    ["linguiça", "#a84a3a"],
  ];
  function chop() {
    const [nm, col] = pick(VEG);
    const marks = shuffle([90, 140, 190, 240, 290]).slice(0, 4).sort((a, b) => a - b);
    return {
      title: `Cortar ${nm}`,
      sub: "Passe a faca de cima para baixo em cada marca pontilhada.",
      time: 14,
      state: () => ({ cuts: [], marks: marks.map((x) => ({ x, done: false })) }),
      up(S, p, s) {
        if (!s || Math.abs(p.y - s.y) < 40 || Math.min(p.y, s.y) > 130 || Math.max(p.y, s.y) < 160) return;
        const x = (p.x + s.x) / 2;
        const m = S.marks.filter((q) => !q.done).sort((a, b) => Math.abs(a.x - x) - Math.abs(b.x - x))[0];
        if (!m) return;
        m.done = true;
        S.cuts.push({ x, err: Math.abs(m.x - x) });
        playSound(600, 0.03, "square");
      },
      draw(g) {
        table("#8a6a3a");
        R(50, 120, 270, 70, "#c9a878");
        R(60, 135, 250, 40, col);
        for (const m of S.marks) if (!m.done) dash(m.x, 125, m.x, 185);
        for (const c of S.cuts) R(c.x - 1, 132, 3, 46, "#2a1e30");
        if (S.down && S.start) dash(S.start.x, S.start.y, S.p.x, S.p.y, "#ffffff");
        if (S.p.x > 0) T("🔪", S.p.x, S.p.y, "#fff", 18);
      },
      auto: (S) => (S.marks.every((m) => m.done) ? clamp(1 - S.cuts.reduce((s, c) => s + c.err, 0) / S.cuts.length / 25, 0, 1) : null),
      finish: (S) => (S.cuts.length / 4) * 0.6,
    };
  }
  const stir = circleStage("Mexer o caldeirão", "Faça círculos dentro do caldeirão no mesmo ritmo da colher dourada.", {
    cx: 180,
    cy: 150,
    r: 70,
    lo: 3,
    hi: 6.5,
    need: 5,
    drawBg(S) {
      R(0, 0, W, H, "#2a1e30");
      R(150, 210, 60, 20, "#ff8a2a");
      E(180, 150, 90, 60, "#2a2a32");
      E(180, 145, 78, 48, "#8a5a2a");
      for (let i = 0; i < 6; i++) C(180 + Math.cos(S.rot + i) * 40, 145 + Math.sin(S.rot + i) * 24, 5, ["#e8862a", "#5a9a3a", "#f2eecf"][i % 3]);
      if (S.down) T("🥄", S.p.x, S.p.y, "#fff", 18);
    },
  });

  /* ----- Taverneiro: chope ----- */
  const pour = {
    title: "Tirar do barril",
    sub: "Puxe a ALAVANCA para baixo (direita). Mais puxada = mais rápido e mais espuma. Solte quando chegar na marca.",
    time: 16,
    state: () => ({ lever: 0, lvl: 0, foam: 0, opened: false, rest: 0, lo: 0.6 + Math.random() * 0.15 }),
    draw(g, S, dt) {
      R(0, 0, W, H, "#2a1e1a");
      R(130, 20, 110, 40, "#6b4423");
      R(170, 60, 14, 26, "#8a8a92");
      S.lever = S.down && S.start && S.start.x > 260 ? clamp((S.p.y - 60) / 120, 0, 1) : Math.max(0, S.lever - dt * 4);
      if (S.lever > 0.05) S.opened = true;
      // alavanca
      g.strokeStyle = "#c9a050";
      g.lineWidth = 8;
      g.beginPath();
      g.moveTo(290, 60);
      g.lineTo(290 + 20, 60 + S.lever * 110);
      g.stroke();
      C(310, 60 + S.lever * 110, 10, "#5a3a22");
      // caneca
      const top = 110,
        h = 110;
      R(150, top, 70, h, "rgba(220,240,250,.15)");
      g.strokeStyle = "#cfe8f0";
      g.lineWidth = 3;
      g.strokeRect(150, top, 70, h);
      g.strokeRect(220, top + 30, 18, 40);
      S.lvl += S.lever * dt * 0.32;
      S.foam = Math.max(0, S.foam + Math.max(0, S.lever - 0.55) * dt * 0.5 - dt * 0.02);
      const L = S.lvl * h,
        F = S.foam * h;
      R(151, top + h - L, 68, L, "#d99a2a");
      R(151, top + h - L - F, 68, F, "#fff8e0");
      if (S.lever > 0.05) R(175, 86, 4, top + h - L - F - 86, "#d99a2a");
      // marca
      dash(145, top + h - S.lo * h, 225, top + h - S.lo * h);
      dash(145, top + h - (S.lo + 0.1) * h, 225, top + h - (S.lo + 0.1) * h);
      if (S.opened && S.lever < 0.02) S.rest += dt;
      else S.rest = 0;
      S.msg = S.foam > 0.12 ? "Muita espuma!" : "";
    },
    auto(S) {
      const tot = S.lvl + S.foam;
      if (tot > 1) return toast("Transbordou!", 900), 0;
      if (S.rest > 0.8 && S.lvl > 0.2) return (tot >= S.lo && tot <= S.lo + 0.1 ? 1 : Math.abs(tot - S.lo - 0.05) < 0.12 ? 0.55 : 0.15) * (S.foam > 0.12 ? 0.7 : 1);
      return null;
    },
    finish: (S) => 0.1,
  };

  /* ----- Costureiro e escriba ----- */
  function stitch() {
    const amp = 30 + Math.random() * 30,
      fr = 0.02 + Math.random() * 0.02,
      ph = Math.random() * 6;
    const pts = [];
    for (let x = 30; x <= 330; x += 10) pts.push({ x, y: 140 + Math.sin(x * fr + ph) * amp });
    return traceStage("Costurar", "Passe a agulha por cima dos pontinhos, do começo ao fim, sem sair do caminho.", [pts], () => {
      R(0, 0, W, H, "#3a2a4a");
      R(10, 60, 340, 170, "#7a4a8a");
      for (let i = 0; i < 340; i += 12) R(10 + i, 60, 2, 170, "rgba(255,255,255,.05)");
      T("🪡", pts[0].x, pts[0].y - 12, "#fff", 14);
    }, "#ffe08a");
  }
  const LETTERS = {
    A: [[[0, 1], [0.5, 0], [1, 1]], [[0.25, 0.55], [0.75, 0.55]]],
    M: [[[0, 1], [0, 0], [0.5, 0.6], [1, 0], [1, 1]]],
    N: [[[0, 1], [0, 0], [1, 1], [1, 0]]],
    V: [[[0, 0], [0.5, 1], [1, 0]]],
    Z: [[[0, 0], [1, 0], [0, 1], [1, 1]]],
    E: [[[1, 0], [0, 0], [0, 1], [1, 1]], [[0, 0.5], [0.7, 0.5]]],
    L: [[[0, 0], [0, 1], [1, 1]]],
    W: [[[0, 0], [0.25, 1], [0.5, 0.4], [0.75, 1], [1, 0]]],
  };
  function quill() {
    const ks = shuffle(Object.keys(LETTERS)).slice(0, 3);
    const strokes = [];
    ks.forEach((k, i) => {
      const ox = 40 + i * 100,
        oy = 90,
        w = 80,
        h = 110;
      for (const s of LETTERS[k]) strokes.push(s.map(([x, y]) => ({ x: ox + x * w, y: oy + y * h })));
    });
    return traceStage(`Copiar: ${ks.join("")}`, "Escreva com a pena por cima das letras pontilhadas.", strokes, () => {
      R(0, 0, W, H, "#2a1e30");
      R(20, 70, 320, 160, "#f2e8d0");
      R(20, 70, 320, 6, "#d8c8a8");
    }, "#2a1a3a", 20);
  }

  /* ----- Pintor ----- */
  const PAL = { Azul: "#5fa0ff", Amarelo: "#f2c14e", Verde: "#5a9a3a", Vermelho: "#c94a4a", Branco: "#f2eecf", Marrom: "#8a5a2e" };
  function paint() {
    const sky = pick(["Azul", "Amarelo"]),
      sun = sky === "Azul" ? "Amarelo" : "Branco",
      hill = pick(["Verde", "Marrom"]),
      house = pick(["Vermelho", "Branco"].filter((c) => c !== hill));
    const regions = [
      { n: "céu", want: sky, m: (x, y) => y < 150 && !((x - 270) ** 2 + (y - 100) ** 2 < 22 ** 2) && !(x > 90 && x < 150 && y > 105) },
      { n: "sol", want: sun, m: (x, y) => (x - 270) ** 2 + (y - 100) ** 2 < 22 ** 2 },
      { n: "morro", want: hill, m: (x, y) => y >= 150 },
      { n: "casa", want: house, m: (x, y) => x > 90 && x < 150 && y > 105 && y < 150 },
    ];
    return {
      title: "Pintar a encomenda",
      sub: `O cliente quer: céu <b>${sky}</b>, sol <b>${sun}</b>, morro <b>${hill}</b> e casinha <b>${house}</b>. Escolha a tinta e pinte arrastando o pincel.`,
      time: 35,
      ready: "Terminei!",
      tools: Object.keys(PAL).map((k) => ({ id: k, n: k })),
      state: () => ({ cells: rubCells((x, y) => x > 20 && x < 340 && y > 70 && y < 230, 6).map((c) => Object.assign(c, { col: null })) }),
      move(S, p) {
        if (!S.down) return;
        for (const c of S.cells) if (Math.hypot(c.x + 3 - p.x, c.y + 3 - p.y) < 13) c.col = S.tool;
      },
      draw(g) {
        R(0, 0, W, H, "#3a2a20");
        R(14, 64, 332, 172, "#8a5a2e");
        for (const c of S.cells) R(c.x, c.y, 6, 6, c.col ? PAL[c.col] : "#f8f4ec");
        g.strokeStyle = "rgba(60,40,30,.6)";
        g.lineWidth = 1.5;
        g.beginPath();
        g.arc(270, 100, 22, 0, 7);
        g.moveTo(20, 150);
        g.lineTo(340, 150);
        g.rect(90, 105, 60, 45);
        g.stroke();
        if (S.p.x > 0) C(S.p.x, S.p.y, 5, PAL[S.tool]);
      },
      finish(S) {
        let sc = 0;
        for (const r of regions) {
          const cs = S.cells.filter((c) => r.m(c.x + 3, c.y + 3));
          sc += cs.filter((c) => c.col === r.want).length / Math.max(1, cs.length);
        }
        return sc / regions.length;
      },
    };
  }

  /* ----- Moleiro, boticário ----- */
  const mill = circleStage("Moer o trigo", "Gire a mó fazendo círculos em volta do centro, num ritmo firme. Rápido demais, trava.", {
    cx: 180,
    cy: 145,
    r: 70,
    lo: 2.5,
    hi: 6,
    need: 6,
    ghost: false,
    drawBg(S) {
      R(0, 0, W, H, "#3a2e22");
      E(180, 150, 92, 70, "#5a4a3a");
      g.save();
      g.translate(180, 145);
      g.rotate(S.rot);
      E(0, 0, 80, 60, "#8a8a92");
      for (let i = 0; i < 8; i++) R(Math.cos(i) * 40 - 3, Math.sin(i) * 30 - 3, 6, 6, "#6a6a72");
      R(-6, -50, 12, 30, "#5a3a22");
      g.restore();
      E(180, 228, 40 * clamp(S.ok / 6, 0.05, 1), 8, "#f2eecf");
    },
  });
  const HERBS = ["Guaco", "Hortelã", "Camomila", "Arnica", "Salgueiro", "Babosa", "Gengibre", "Sálvia"];
  function herbs() {
    const need = shuffle(HERBS).slice(0, 3);
    const all = shuffle([...need, ...shuffle(HERBS.filter((h) => !need.includes(h))).slice(0, 4)]);
    return dragStage({
      title: "Separar as ervas",
      sub: `A receita pede: <b>${need.join(", ")}</b>. Arraste só essas para o pilão.`,
      time: 18,
      state: () => ({ items: all.map((h, i) => ({ x: 14 + (i % 4) * 82, y: 70 + Math.floor(i / 4) * 40, w: 76, h: 30, label: h, icon: "herb", h0: h })), got: [], wrong: 0 }),
      drop(S, it) {
        if (it.x + it.w / 2 > 200 && it.y + it.h / 2 > 150) {
          S.items = S.items.filter((q) => q !== it);
          if (need.includes(it.h0)) S.got.push(it.h0), playSound(700, 0.04, "sine");
          else S.wrong++, playSound(180, 0.06, "square"), (S.msg = `${it.h0} não é da receita!`);
        }
      },
      draw(g) {
        R(0, 0, W, H, "#2a3a2a");
        E(270, 200, 60, 30, "#8a8a92");
        E(270, 194, 48, 20, "#4a4a52");
        T("pilão", 270, 236, "#ffe08a", 10);
        S.items.forEach(drawItem);
      },
      auto: (S) => (need.every((h) => S.got.includes(h)) ? clamp(1 - S.wrong * 0.25, 0, 1) : null),
      finish: (S) => (S.got.length / 3) * 0.6,
    });
  }
  const grind = circleStage("Moer no pilão", "Gire o pilão em círculos até virar pó.", {
    cx: 180,
    cy: 150,
    r: 50,
    lo: 3,
    hi: 7,
    need: 4,
    ghost: false,
    drawBg(S) {
      R(0, 0, W, H, "#2a3a2a");
      E(180, 160, 80, 50, "#8a8a92");
      E(180, 152, 64, 32, "#4a4a52");
      E(180, 154, 50 * clamp(S.ok / 4, 0.1, 1), 22 * clamp(S.ok / 4, 0.1, 1), "#9ad36b");
      if (S.down) R(S.p.x - 5, S.p.y - 50, 10, 56, "#c9a878");
    },
  });
  const vial = Object.assign({}, pour, {
    title: "Dosar o frasco",
    sub: "Puxe a alavanca do alambique (direita) e solte na marca. Devagar é mais preciso.",
  });

  /* ----- Açougueiro / peixeiro ----- */
  function knife(what) {
    const want = Math.round((0.6 + Math.random() * 2.4) * 10) / 10;
    const x0 = 40,
      ppk = 80;
    return {
      title: `Cortar ${what}`,
      sub: `O cliente quer <b>${String(want).replace(".", ",")} kg</b>. Cada risco da régua é 1 kg. Passe a faca de cima para baixo no ponto certo.`,
      time: 14,
      state: () => ({ cut: null }),
      up(S, p, s) {
        if (!s || Math.abs(p.y - s.y) < 50) return;
        S.cut = (p.x + s.x) / 2;
        playSound(500, 0.05, "square");
      },
      draw(g) {
        table("#a8a8b0");
        const c = what === "peixe" ? "#8ab0c9" : "#c94a4a";
        g.fillStyle = c;
        g.beginPath();
        g.moveTo(x0, 120);
        g.lineTo(330, 115);
        g.lineTo(335, 175);
        g.lineTo(x0, 180);
        g.fill();
        if (what === "peixe") (C(332, 145, 4, "#1a1028"), T("🐟", 20, 150, "#fff", 18));
        else for (let i = 0; i < 6; i++) R(x0 + 20 + i * 45, 128, 12, 40, "rgba(255,255,255,.25)");
        for (let k = 0; k <= 3; k++) (R(x0 + k * ppk - 1, 185, 2, 12, "#ffe08a"), T(`${k}`, x0 + k * ppk, 210, "#ffe08a", 11));
        if (S.cut != null) R(S.cut - 1, 110, 3, 72, "#1a1028");
        if (S.down && S.start) dash(S.start.x, S.start.y, S.p.x, S.p.y, "#fff");
        if (S.p.x > 0) T("🔪", S.p.x, S.p.y, "#fff", 18);
        if (S.cut != null) S.msg = `Deu ${((S.cut - x0) / ppk).toFixed(1).replace(".", ",")} kg`;
      },
      auto(S) {
        if (S.cut == null) return null;
        const e = Math.abs((S.cut - x0) / ppk - want);
        return e < 0.08 ? 1 : e < 0.2 ? 0.65 : e < 0.4 ? 0.3 : 0.05;
      },
      finish: () => 0,
    };
  }

  /* ----- Cavalariço ----- */
  function brush() {
    const blobs = Array.from({ length: 7 }, () => ({ x: 110 + Math.random() * 150, y: 110 + Math.random() * 50, r: 10 + Math.random() * 10 }));
    return {
      title: "Escovar o cavalo",
      sub: "Esfregue a escova em cima das manchas de lama até o cavalo ficar limpinho.",
      time: 16,
      state: () => ({ cells: rubCells((x, y) => blobs.some((b) => (x - b.x) ** 2 + (y - b.y) ** 2 < b.r ** 2), 4) }),
      move(S, p) {
        if (S.down) rub(S, p, 12);
      },
      draw(g) {
        R(0, 0, W, H, "#5a7a3a");
        // a baia: chão de palha, feno no canto e a janela de luz
        R(0, 196, W, 44, "#c9a050");
        for (let i = 0; i < 40; i++) R((i * 37) % W, 198 + ((i * 13) % 40), 8, 1, i % 2 ? "#e8c860" : "#a8843a");
        E(30, 196, 40, 20, "#d9b050");
        E(46, 186, 28, 16, "#e8c860");
        const coat = "#a86a3a",
          dark = "#7a4a26";
        // rabo e pernas de trás
        g.strokeStyle = "#3a2414";
        g.lineWidth = 9;
        g.lineCap = "round";
        g.beginPath();
        g.moveTo(96, 120);
        g.quadraticCurveTo(70, 150 + Math.sin(S.t * 3) * 6, 80, 190);
        g.stroke();
        g.lineCap = "butt";
        for (const [lx, c] of [[118, dark], [238, dark], [140, coat], [262, coat]]) {
          R(lx, 160, 14, 34, c);
          R(lx - 1, 194, 16, 7, "#2a1a10"); // casco
          R(lx + 2, 186, 10, 3, "#e8e0d0");
        }
        // corpo, peito e pescoço
        E(185, 135, 95, 42, coat);
        g.fillStyle = coat;
        g.beginPath();
        g.moveTo(240, 120);
        g.lineTo(262, 66);
        g.lineTo(292, 70);
        g.lineTo(282, 140);
        g.fill();
        // cabeça: testa larga em cima do pescoço, afinando até o focinho embaixo
        g.fillStyle = coat;
        g.beginPath();
        g.moveTo(260, 70);
        g.lineTo(284, 56);
        g.lineTo(326, 92);
        g.lineTo(322, 108);
        g.lineTo(306, 110);
        g.lineTo(282, 90);
        g.closePath();
        g.fill();
        E(318, 100, 11, 10, "#8a5a32"); // focinho
        R(320, 98, 3, 3, "#2a1a10"); // narina
        R(300, 110, 18, 2, dark); // boca
        // orelhas presas na testa
        for (const [ex, ey] of [[268, 62], [278, 56]]) {
          g.fillStyle = dark;
          g.beginPath();
          g.moveTo(ex - 5, ey + 4);
          g.lineTo(ex, ey - 14);
          g.lineTo(ex + 5, ey + 4);
          g.fill();
        }
        C(290, 74, 3, "#1a1028");
        R(289, 73, 1, 1, "#ffffff");
        // crina: uma faixa escura descendo pelo pescoço, com mechas
        g.fillStyle = "#3a2414";
        g.beginPath();
        g.moveTo(258, 64);
        g.lineTo(270, 60);
        g.lineTo(250, 126);
        g.lineTo(238, 124);
        g.closePath();
        g.fill();
        for (let k = 0; k < 6; k++) R(244 + k * 3 - 6, 72 + k * 9, 6, 3, "#3a2414");
        for (const c of S.cells) if (c.on) R(c.x, c.y, 4, 4, "#4a3a22");
        if (S.down || S.p.x > 0) {
          // a escova: madeira com cerdas
          R(S.p.x - 15, S.p.y - 8, 30, 10, "#8a5a2e");
          R(S.p.x - 15, S.p.y - 8, 30, 3, "#a8784a");
          for (let k = 0; k < 9; k++) R(S.p.x - 14 + k * 3, S.p.y + 2, 2, 5, "#e8d8a8");
        }
        S.msg = `${Math.round(cleaned(S) * 100)}% limpo`;
      },
      auto: (S) => (cleaned(S) > 0.97 ? 1 : null),
      finish: (S) => cleaned(S),
    };
  }
  const bucket = dragStage({
    title: "Dar água",
    sub: "Arraste o balde até o cocho do cavalo, sem derramar (devagar!).",
    time: 12,
    state: () => ({ items: [{ x: 30, y: 160, w: 40, h: 36, c: "#8a8a92", label: "💧" }], spill: 0 }),
    move(S, p, l) {
      if (S.held && l) {
        S.held.x = p.x - S.ox;
        S.held.y = p.y - S.oy;
        const v = Math.hypot(p.x - l.x, p.y - l.y);
        if (v > 14) S.spill += (v - 14) * 0.004;
      }
    },
    drop(S, it) {
      if (it.x > 240 && it.y > 120) S.done = true;
    },
    draw(g) {
      R(0, 0, W, H, "#5a7a3a");
      R(250, 170, 90, 30, "#6b4423");
      T("cocho", 295, 220, "#ffe08a", 10);
      S.items.forEach(drawItem);
      S.msg = S.spill > 0.05 ? `Derramou ${Math.round(clamp(S.spill, 0, 1) * 100)}%` : "";
    },
    auto: (S) => (S.done ? clamp(1 - S.spill, 0, 1) : null),
    finish: () => 0,
  });

  /* ----- Balconista ----- */
  function coins() {
    const price = 3 + Math.floor(Math.random() * 45);
    const paid = [10, 20, 50, 100].find((v) => v > price + 2) || 100;
    const due = paid - price;
    const kinds = [20, 10, 5, 2, 1];
    const mk = (v, i) => ({ x: 20 + i * 66, y: 196, w: 40, h: 34, label: String(v), c: v >= 10 ? "#f2c14e" : "#c9c9d0", v, src: true });
    return dragStage({
      title: "Dar o troco",
      sub: `A compra deu <b>${price}</b>, o cliente pagou <b>${paid}</b>. Arraste as moedas até a mão dele e aperte Entregar.`,
      time: 25,
      ready: "Entregar",
      state: () => ({ items: kinds.map(mk), given: [] }),
      grab(S, it) {
        if (it.src) {
          const copy = Object.assign({}, it, { src: false });
          S.items.push(copy);
          S.held = copy;
        }
      },
      drop(S, it) {
        if (it.src) return;
        if (it.x > 220 && it.y < 140) {
          S.given.push(it.v);
          S.items = S.items.filter((q) => q !== it);
          playSound(1200, 0.03, "sine");
        } else S.items = S.items.filter((q) => q !== it);
      },
      draw(g) {
        R(0, 0, W, H, "#3a2e22");
        R(0, 186, W, 54, "#6b4423");
        // a loja lá atrás: parede de tábua com prateleiras cheias
        planks(64, 186, "#7a5230", "#6b4423", "#4a2e17");
        for (const [yy, ics] of [[98, ["bread", "cheese", "honey", "wine"]], [142, ["bag", "crate", "soap", "herb"]]]) {
          rr(14, yy, 150, 4, "#8a5a2e");
          rr(14, yy + 4, 150, 2, "#3a2414");
          ics.forEach((k, i) => icon(k, 30 + i * 38, yy - 8, 2));
        }
        // o cliente atrás do balcão: túnica, braço esticado e a mão aberta esperando o troco
        const skin = "#e8b896";
        g.save();
        g.beginPath();
        g.rect(0, 0, W, 186);
        g.clip();
        E(300, 200, 60, 46, "#4a6a9a");
        E(300, 150, 28, 30, "#4a6a9a");
        g.restore();
        R(286, 112, 28, 20, "#e8b896");
        E(300, 104, 20, 20, skin);
        E(300, 92, 22, 12, "#5a3a22"); // cabelo
        R(292, 104, 3, 3, "#2a1a10");
        R(305, 104, 3, 3, "#2a1a10");
        R(296, 114, 8, 2, "#b0705a");
        g.strokeStyle = "#3a5a8a";
        g.lineWidth = 16;
        g.lineCap = "round";
        g.beginPath();
        g.moveTo(286, 150);
        g.quadraticCurveTo(250, 150, 236, 116);
        g.stroke();
        g.lineCap = "butt";
        E(236, 104, 26, 13, skin); // palma
        for (let k = 0; k < 4; k++) E(214 + k * 12, 92 - (k === 0 || k === 3 ? 0 : 3), 5, 9, skin); // dedos
        E(262, 104, 6, 9, skin); // polegar
        R(220, 106, 30, 2, "#c9906a");
        T("a mão do cliente", 236, 66, "#ffe08a", 10);
        S.given.forEach((v, i) => C(224 + (i % 4) * 9, 100 - Math.floor(i / 4) * 5, 5, v >= 10 ? "#f2c14e" : "#c9c9d0"));
        S.items.forEach(drawItem);
        S.msg = `Na mão: ${S.given.reduce((s, v) => s + v, 0)}`;
      },
      finish(S) {
        const sum = S.given.reduce((s, v) => s + v, 0);
        if (sum !== due) return toast(sum > due ? "Troco a mais! Prejuízo." : "Faltou troco!", 1500), 0.1;
        let r = due,
          min = 0;
        for (const c of kinds) while (r >= c) (r -= c), min++;
        return S.given.length <= min ? 1 : 0.8;
      },
    });
  }

  /* ----- Bardo ----- */
  function strum() {
    const ys = [80, 115, 150, 185];
    const notes = Array.from({ length: 12 }, (_, i) => ({ s: Math.floor(Math.random() * 4), x: 380 + i * 70, hit: false, miss: false }));
    return {
      title: "Tocar o alaúde",
      sub: "Quando a nota chegar na linha dourada, passe o dedo atravessando a corda dela (para cima ou para baixo).",
      time: 16,
      state: () => ({ notes, hits: 0, wrong: 0 }),
      move(S, p, l) {
        if (!S.down || !l) return;
        ys.forEach((y, si) => {
          if ((l.y - y) * (p.y - y) < 0) {
            const n = S.notes.find((q) => q.s === si && !q.hit && !q.miss && Math.abs(q.x - 70) < 22);
            playSound([392, 440, 494, 523][si], 0.18, "triangle");
            if (n) (n.hit = true), S.hits++;
            else S.wrong++;
          }
        });
      },
      draw(g, S, dt) {
        R(0, 0, W, H, "#3a2420");
        // o braço do alaúde visto de perto: madeira com veios e trastes de metal
        R(0, 60, W, 150, "#8a5a2e");
        for (let i = 0; i < 14; i++) R(0, 64 + i * 10.5, W, 1, i % 2 ? "#7a4a24" : "#9a6a3a");
        for (let x = 110; x < W; x += 52) (R(x, 60, 3, 150, "#c9c0b0"), R(x, 60, 1, 150, "#ffffff"));
        for (const x of [136, 240]) C(x, 135, 4, "#f2eee4"); // marcações de madrepérola
        R(0, 58, W, 4, "#4a2e17");
        R(0, 208, W, 4, "#4a2e17");
        ys.forEach((y, i) => (R(0, y - 1, W, 2 + i * 0.5, "#e8e4dc"), R(0, y + 1 + i * 0.5, W, 1, "rgba(0,0,0,.35)")));
        // a linha de tocar, dourada e brilhando
        R(66, 60, 8, 150, "rgba(255,224,138,.25)");
        R(68, 60, 4, 150, "#ffe08a");
        for (const n of S.notes) {
          n.x -= dt * 110;
          if (!n.hit && !n.miss && n.x < 40) n.miss = true;
          if (!n.hit && n.x > -20) {
            const col = n.miss ? "#6a4a4a" : ["#e05050", "#f2c14e", "#7ad36b", "#5fa0ff"][n.s];
            C(n.x, ys[n.s], 9, col);
            R(n.x + 7, ys[n.s] - 22, 2, 22, shade(col, -0.3)); // haste da nota
            R(n.x + 7, ys[n.s] - 22, 7, 3, shade(col, -0.3));
          }
        }
        S.msg = `${S.hits} acertos`;
      },
      auto: (S) => (S.notes.every((n) => n.hit || n.miss) ? clamp(S.hits / 12 - S.wrong * 0.03, 0, 1) : null),
      finish: (S) => clamp(S.hits / 12 - S.wrong * 0.03, 0, 1),
    };
  }

  /* ----- Joalheiro ----- */
  function loupe() {
    const gems = Array.from({ length: 6 }, (_, i) => ({ x: 60 + (i % 3) * 120, y: 105 + Math.floor(i / 3) * 80, c: pick(["#5fd0ff", "#ff6b8a", "#7ad36b", "#c77dff"]), bad: false, mark: false, fx: Math.random() * 16 - 8, fy: Math.random() * 10 - 5 }));
    shuffle(gems).slice(0, 2).forEach((q) => (q.bad = true));
    return {
      title: "Avaliar com a lupa",
      sub: "Passe a lupa por cima das pedras: só com ela dá para ver a rachadura. Toque nas pedras com defeito e aperte Pronto.",
      time: 25,
      ready: "Pronto",
      state: () => ({ gems }),
      up(S, p, s) {
        if (s && dist(p, s) < 8) {
          const gm = S.gems.find((q) => Math.hypot(q.x - p.x, q.y - p.y) < 24);
          if (gm) (gm.mark = !gm.mark), playSound(700, 0.03, "sine");
        }
      },
      draw(g) {
        R(0, 0, W, H, "#1a2a3a");
        // bandeja de veludo com almofadinhas
        R(18, 58, 324, 174, "#c9a040");
        R(20, 60, 320, 170, "#4a1a3a");
        for (let i = 0; i < 6; i++) E(60 + (i % 3) * 120, 105 + Math.floor(i / 3) * 80 + 10, 30, 14, "#5a2448");
        for (const q of S.gems) {
          g.save();
          g.translate(q.x, q.y);
          g.rotate(Math.PI / 4);
          R(-17, -17, 34, 34, shade(q.c, -0.45));
          R(-16, -16, 32, 32, q.c);
          R(-16, -16, 16, 16, shade(q.c, 0.25)); // faceta de cima, pega a luz
          R(0, 0, 16, 16, shade(q.c, -0.2));
          R(-6, -6, 12, 12, shade(q.c, 0.1));
          R(-14, -14, 5, 5, "#ffffff");
          g.restore();
          if (q.mark) (g.strokeStyle = "#ffe08a"), (g.lineWidth = 2), g.strokeRect(q.x - 26, q.y - 26, 52, 52);
        }
        // lupa
        const p = S.p;
        if (p.x > 0) {
          g.save();
          g.beginPath();
          g.arc(p.x, p.y, 30, 0, 7);
          g.clip();
          for (const q of S.gems)
            if (q.bad) {
              g.strokeStyle = "#1a1028";
              g.lineWidth = 2;
              g.beginPath();
              g.moveTo(q.x + q.fx - 6, q.y + q.fy - 4);
              g.lineTo(q.x + q.fx, q.y + q.fy + 2);
              g.lineTo(q.x + q.fx + 5, q.y + q.fy - 3);
              g.stroke();
            }
          R(p.x - 30, p.y - 30, 60, 60, "rgba(255,255,255,.08)");
          g.restore();
          g.strokeStyle = "#c9a050";
          g.lineWidth = 4;
          g.beginPath();
          g.arc(p.x, p.y, 30, 0, 7);
          g.stroke();
        }
      },
      finish(S) {
        let hit = 0,
          wrong = 0;
        for (const q of S.gems) if (q.mark) q.bad ? hit++ : wrong++;
        return clamp(hit / 2 - wrong * 0.3, 0, 1);
      },
    };
  }
  function polish() {
    return {
      title: "Polir a pedra",
      sub: "Esfregue o pano na pedra até ela brilhar.",
      time: 12,
      state: () => ({ cells: rubCells((x, y) => Math.abs(x - 180) + Math.abs(y - 150) < 60, 5) }),
      move(S, p) {
        if (S.down) rub(S, p, 10);
      },
      draw(g) {
        R(0, 0, W, H, "#1a2a3a");
        g.save();
        g.translate(180, 150);
        g.rotate(Math.PI / 4);
        R(-42, -42, 84, 84, "#5fd0ff");
        g.restore();
        for (const c of S.cells) if (c.on) R(c.x, c.y, 5, 5, "rgba(120,120,130,.55)");
        if (cleaned(S) > 0.95) T("✨", 180 + Math.sin(S.t * 5) * 30, 110, "#fff", 18);
        if (S.down) R(S.p.x - 12, S.p.y - 12, 24, 24, "rgba(232,228,220,.8)");
      },
      auto: (S) => (cleaned(S) > 0.97 ? 1 : null),
      finish: (S) => cleaned(S),
    };
  }

  /* ----- Bibliotecário ----- */
  function shelf() {
    const nums = [];
    while (nums.length < 6) {
      const n = 100 + Math.floor(Math.random() * 800);
      if (!nums.includes(n)) nums.push(n);
    }
    const slots = Array.from({ length: 6 }, (_, i) => ({ x: 30 + i * 52, y: 70, w: 44, h: 70, book: null }));
    const cols = ["#a84a4a", "#4a4aa8", "#5a9a4a", "#a8842a", "#7a3a8a", "#2a7a8a"];
    return dragStage({
      title: "Guardar os livros",
      sub: "Arraste os livros do carrinho para a estante, do MENOR número (esquerda) para o MAIOR (direita).",
      time: 28,
      state: () => ({ items: nums.map((n, i) => ({ x: 20 + i * 56, y: 180, w: 40, h: 50, label: String(n), c: cols[i], tc: "#fff", n, sz: 9 })), slots }),
      drop(S, it, p) {
        const sl = S.slots.find((s) => p.x > s.x - 6 && p.x < s.x + s.w + 6 && p.y > s.y - 10 && p.y < s.y + s.h + 10 && !s.book);
        for (const s of S.slots) if (s.book === it) s.book = null;
        if (sl) (sl.book = it), (it.x = sl.x + 2), (it.y = sl.y + 10), playSound(500, 0.03, "triangle");
      },
      draw(g) {
        R(0, 0, W, H, "#2a1e30");
        R(20, 60, 330, 100, "#6b4423");
        for (const s of S.slots) R(s.x, s.y, s.w, s.h, "#3a2414");
        R(10, 225, 340, 10, "#8a6a3a");
        S.items.forEach(drawItem);
      },
      auto(S) {
        if (S.held || S.slots.some((s) => !s.book)) return null;
        const seq = S.slots.map((s) => s.book.n);
        let ok = 0;
        for (let i = 1; i < seq.length; i++) if (seq[i] > seq[i - 1]) ok++;
        return ok / 5;
      },
      finish: (S) => S.slots.filter((s) => s.book).length / 12,
    });
  }

  /* ----- Professor ----- */
  function chalk() {
    const a = 2 + Math.floor(Math.random() * 9),
      b = 2 + Math.floor(Math.random() * 9),
      mul = Math.random() < 0.5,
      r = mul ? a * b : a + b;
    const opts = shuffle([r, r + 1 + Math.floor(Math.random() * 3), Math.max(0, r - 1 - Math.floor(Math.random() * 3))]);
    return dragStage({
      title: "Aula",
      sub: `A turma pergunta: <b>quanto é ${a} ${mul ? "×" : "+"} ${b}?</b> Arraste o giz com a resposta certa até o quadro.`,
      time: 12,
      state: () => ({ items: opts.map((v, i) => ({ x: 40 + i * 100, y: 190, w: 70, h: 30, label: String(v), c: "#f2eecf", v })) }),
      drop(S, it) {
        if (it.y < 150) S.ans = it.v;
        else (it.y = 190);
      },
      draw(g) {
        R(0, 0, W, H, "#3a2a20");
        R(40, 50, 280, 110, "#1a3a2a");
        g.strokeStyle = "#8a6a3a";
        g.lineWidth = 6;
        g.strokeRect(40, 50, 280, 110);
        T(`${a} ${mul ? "×" : "+"} ${b} = ?`, 180, 100, "#f2eecf", 22);
        S.items.forEach(drawItem);
      },
      auto: (S) => (S.ans == null ? null : S.ans === r ? 1 : (toast(`Era ${r}!`, 1200), 0)),
      finish: () => 0,
    });
  }

  /* ===================== TRABALHOS DE RUA ===================== */

  /** Lenhador: golpes de machado na diagonal, alternando o lado marcado. */
  function chopTree() {
    const need = 5;
    return {
      title: "Derrubar a árvore",
      sub: "Golpeie com o machado de FORA para DENTRO do tronco, no lado e na altura da marca. A marca troca de lado a cada golpe.",
      time: 16,
      state: () => ({ cuts: 0, side: 1, h: 150, bad: 0, fall: 0 }),
      up(S, p, s) {
        if (!s || dist(p, s) < 40) return;
        const fromSide = s.x > 180 ? 1 : -1;
        const into = Math.sign(s.x - 180) !== Math.sign(p.x - 180) || Math.abs(p.x - 180) < 20;
        const hy = (s.y + p.y) / 2;
        if (fromSide === S.side && into && Math.abs(hy - S.h) < 26) {
          S.cuts++;
          S.side *= -1;
          S.h = 140 + Math.random() * 30;
          playSound(180, 0.08, "square");
          game.shake = 0.05;
        } else S.bad++, playSound(120, 0.05, "square"), (S.msg2 = "Golpe torto!");
      },
      draw(g, S, dt) {
        R(0, 0, W, H, "#8ac8e8");
        R(0, 190, W, 50, "#5a8a3a");
        if (S.cuts >= need) S.fall = Math.min(1, S.fall + dt * 1.5);
        g.save();
        g.translate(180, 190);
        g.rotate(S.fall * 1.4);
        // tronco grosso com casca, e a copa cheia
        R(-16, -150, 32, 150, "#7a5230");
        R(-16, -150, 8, 150, "#9a6a3e");
        R(10, -150, 6, 150, "#5a3a1e");
        for (let k = 0; k < 14; k++) R(-12 + ((k * 11) % 22), -146 + k * 10, 2, 7, "#4a2e17");
        R(-22, -6, 44, 6, "#5a3a1e");
        leafyTree(0, -120, 10, 62);
        const notch = Math.min(28, S.cuts * 6);
        R(-16, -42, notch / 2, 16, "#e8c890");
        R(16 - notch / 2, -42, notch / 2, 16, "#e8c890");
        g.restore();
        if (S.cuts < need) {
          const mx = S.side > 0 ? 210 : 150;
          T(S.side > 0 ? "◀" : "▶", mx + S.side * 20, S.h + 5, "#ffe08a", 18);
          dash(mx, S.h, mx - S.side * 16, S.h);
        }
        if (S.down && S.start) dash(S.start.x, S.start.y, S.p.x, S.p.y, "#fff");
        S.msg = S.cuts >= need ? "MADEIRA!" : S.msg2 || `${S.cuts}/${need}`;
      },
      auto: (S) => (S.fall >= 1 ? clamp(1 - S.bad * 0.1, 0.3, 1) : null),
      finish: (S) => (S.cuts / need) * 0.6,
    };
  }

  /** Fazendeiro: foice baixa passando pelo trigo, abaixo da linha. */
  function harvest() {
    const N = 16;
    return {
      title: "Colher o trigo",
      sub: "Arraste a foice de lado, BAIXO, entre a linha pontilhada e o chão. Alto demais estraga as espigas; no chão, a foice enrosca.",
      time: 12,
      state: () => ({ st: Array.from({ length: N }, (_, i) => ({ x: 40 + i * 18, cut: 0 })), bad: 0 }),
      move(S, p, l) {
        if (!S.down || !l) return;
        for (const s of S.st) {
          if (s.cut || s.x < Math.min(l.x, p.x) - 4 || s.x > Math.max(l.x, p.x) + 4) continue;
          if (p.y > 150 && p.y < 182) (s.cut = 1), playSound(900 + Math.random() * 200, 0.02, "square");
          else if (p.y <= 150 && p.y > 80) (s.cut = 2), S.bad++;
        }
      },
      draw(g) {
        R(0, 0, W, H, "#8ac8e8");
        R(0, 182, W, 58, "#7a5a2e");
        for (const s of S.st) {
          if (s.cut === 1) {
            R(s.x, 172, 4, 10, "#c9a050");
            continue;
          }
          R(s.x + 1, s.cut === 2 ? 120 : 92, 2, s.cut === 2 ? 62 : 90, "#c9a040");
          R(s.x + 1, s.cut === 2 ? 120 : 92, 1, s.cut === 2 ? 62 : 90, "#e8c860");
          if (!s.cut) {
            R(s.x - 4, 132 + (s.x % 3) * 4, 6, 2, "#b8a040"); // folha
            R(s.x + 3, 146 - (s.x % 4) * 3, 6, 2, "#b8a040");
            wheatEar(s.x + 2, 64 + Math.sin(S.t * 2 + s.x * 0.1) * 2, 28);
          }
        }
        dash(20, 150, 340, 150);
        if (S.p.x > 0) (R(S.p.x - 14, S.p.y - 2, 16, 4, "#c9c9d0"), R(S.p.x, S.p.y - 2, 4, 16, "#8a5a2e"));
        S.msg = `${S.st.filter((s) => s.cut === 1).length}/${N}`;
      },
      auto: (S) => (S.st.every((s) => s.cut) ? clamp(S.st.filter((s) => s.cut === 1).length / N, 0, 1) : null),
      finish: (S) => S.st.filter((s) => s.cut === 1).length / N,
    };
  }

  /** Minerador: picaretadas certeiras nos pontos de rachadura que brilham. */
  function mineRock() {
    const need = 6;
    const spot = () => ({ x: 120 + Math.random() * 120, y: 90 + Math.random() * 90, life: 1.4 });
    return {
      title: "Quebrar o minério",
      sub: "Dê uma picaretada (golpe rápido de cima para baixo) em cima do ponto que brilha, antes que ele apague.",
      time: 15,
      state: () => ({ hits: 0, miss: 0, sp: spot(), cracks: [] }),
      up(S, p, s) {
        if (!s || p.y - s.y < 25) return;
        if (dist(p, S.sp) < 22) {
          S.hits++;
          S.cracks.push({ x: S.sp.x, y: S.sp.y });
          playSound(260, 0.08, "square");
          game.shake = 0.06;
          S.sp = spot();
        } else S.miss++, playSound(140, 0.05, "square");
      },
      draw(g, S, dt) {
        R(0, 0, W, H, "#2a2028");
        // vigas da galeria e trilho no chão
        for (const vx of [14, 326]) (R(vx, 0, 20, 240, "#5a3a1e"), R(vx, 0, 6, 240, "#7a5230"));
        R(0, 0, W, 16, "#5a3a1e");
        R(0, 212, W, 4, "#6a6a72");
        R(0, 226, W, 4, "#6a6a72");
        for (let x = 0; x < W; x += 24) R(x, 210, 10, 22, "#4a2e17");
        // a rocha: pedaços facetados, mais claros em cima
        const facets = [[180, 140, 104, 82, "#4a4450"], [168, 128, 86, 64, "#5e5866"], [196, 150, 70, 46, "#544e5c"], [150, 116, 46, 30, "#7a7482"], [214, 112, 36, 24, "#6e6878"]];
        for (const [x, y, rx, ry, c] of facets) E(x, y, rx, ry, c);
        // veios de ametista
        for (let k = 0; k < 7; k++) {
          const gx = 130 + k * 16,
            gy = 120 + ((k * 37) % 50);
          g.fillStyle = "#7a3ab0";
          g.beginPath();
          g.moveTo(gx, gy - 8);
          g.lineTo(gx + 6, gy);
          g.lineTo(gx, gy + 6);
          g.lineTo(gx - 6, gy);
          g.fill();
          R(gx - 1, gy - 5, 2, 4, "#e0b0ff");
        }
        for (const c of S.cracks) (g.strokeStyle = "#1a1018"), (g.lineWidth = 3), g.beginPath(), g.moveTo(c.x - 10, c.y - 8), g.lineTo(c.x, c.y), g.lineTo(c.x + 8, c.y + 10), g.stroke();
        S.sp.life -= dt;
        if (S.sp.life <= 0) (S.sp = spot()), S.miss++;
        C(S.sp.x, S.sp.y, 8 + Math.sin(S.t * 14) * 2, `rgba(255,224,138,${S.sp.life / 1.4})`);
        if (S.p.x > 0) {
          // picareta: cabo de madeira e as duas pontas de ferro curvadas
          R(S.p.x - 2, S.p.y - 10, 4, 30, "#8a5a2e");
          g.strokeStyle = "#9a9aa8";
          g.lineWidth = 4;
          g.beginPath();
          g.moveTo(S.p.x - 18, S.p.y - 2);
          g.quadraticCurveTo(S.p.x, S.p.y - 18, S.p.x + 18, S.p.y - 2);
          g.stroke();
        }
        light(60, 40, 170, "rgba(255,190,90,A)", 0.3); // a lamparina pendurada
        R(56, 16, 2, 16, "#2a2a2a");
        R(50, 32, 14, 12, "#ffd06a");
        S.msg = `${S.hits}/${need}`;
      },
      auto: (S) => (S.hits >= need ? clamp(1 - S.miss * 0.08, 0.3, 1) : null),
      finish: (S) => (S.hits / need) * 0.7,
    };
  }

  /** Carregador: empilhar as caixas no carrinho sem derrubar. */
  function stackCrates() {
    return dragStage({
      title: "Carregar o carrinho",
      sub: "Arraste as caixas para cima do carrinho, uma em cima da outra. Mal centralizada, a pilha cai!",
      time: 20,
      state: () => ({ items: [0, 1, 2].map((i) => ({ x: 20 + i * 50, y: 190, w: 44, h: 34, crate: true, i })), stack: [], fell: 0 }),
      drop(S, it) {
        const top = S.stack.length ? S.stack[S.stack.length - 1] : { x: 230, w: 80 };
        const cx = it.x + it.w / 2,
          tcx = top.x + top.w / 2;
        const ty = 170 - (S.stack.length + 1) * 34;
        if (Math.abs(it.y + it.h - (ty + 34)) < 40 && Math.abs(cx - tcx) < 40) {
          if (Math.abs(cx - tcx) > 18 + (S.stack.length ? 0 : 20)) {
            S.fell++;
            playSound(90, 0.2, "sawtooth");
            S.msg2 = "A caixa caiu! Centralize melhor.";
            (it.x = 20 + it.i * 50), (it.y = 190);
            return;
          }
          it.x = tcx - it.w / 2;
          it.y = ty;
          it.fixed = true;
          S.stack.push(it);
          playSound(300, 0.06, "triangle");
        }
      },
      draw(g) {
        R(0, 0, W, H, "#3a2e22");
        // carroça de madeira
        R(214, 166, 112, 18, "#8a5a2e");
        R(214, 166, 112, 4, "#b07a42");
        for (let x = 222; x < 326; x += 20) R(x, 170, 2, 14, "#6b4423");
        R(326, 160, 28, 4, "#6b4423");
        for (const wx of [238, 302]) {
          C(wx, 192, 13, "#4a2e17");
          C(wx, 192, 10, "#8a5a2e");
          C(wx, 192, 3, "#4a4a52");
          g.strokeStyle = "#4a2e17";
          g.lineWidth = 2;
          for (let a = 0; a < 6; a++) g.beginPath(), g.moveTo(wx, 192), g.lineTo(wx + Math.cos(a) * 10, 192 + Math.sin(a) * 10), g.stroke();
        }
        S.items.forEach(drawItem);
        S.msg = S.msg2 || `${S.stack.length}/3`;
      },
      auto: (S) => (S.stack.length >= 3 ? clamp(1 - S.fell * 0.2, 0.2, 1) : null),
      finish: (S) => S.stack.length / 4,
    });
  }

  /** Feirante: separar o pedido do cliente na cesta. */
  const STALL_GOODS = ["Maçã", "Pão", "Queijo", "Mel", "Vinho", "Peixe", "Trigo", "Torta", "Carne"];
  const GOOD_ICON = { Maçã: "apple", Pão: "bread", Queijo: "cheese", Mel: "honey", Vinho: "wine", Peixe: "fish", Trigo: "wheat", Torta: "pie", Carne: "meat" };
  function basket() {
    const want = shuffle(STALL_GOODS).slice(0, 3);
    const all = shuffle([...want, ...shuffle(STALL_GOODS.filter((g) => !want.includes(g))).slice(0, 4)]);
    return dragStage({
      title: "Montar a cesta",
      sub: `O cliente quer: <b>${want.join(", ")}</b>. Arraste só isso para a cesta.`,
      time: 16,
      state: () => ({ items: all.map((n, i) => ({ x: 14 + (i % 4) * 84, y: 40 + Math.floor(i / 4) * 40, w: 78, h: 30, label: n, icon: GOOD_ICON[n] || "bag", n })), got: [], wrong: 0 }),
      drop(S, it) {
        if (it.y + it.h / 2 > 160 && it.x + it.w / 2 > 200) {
          S.items = S.items.filter((q) => q !== it);
          if (want.includes(it.n)) S.got.push(it.n), playSound(700, 0.04, "sine");
          else S.wrong++, playSound(180, 0.06, "square"), (S.msg = `Ele não pediu ${it.n}!`);
        }
      },
      draw(g) {
        R(0, 0, W, H, "#5a3a5a");
        E(270, 200, 66, 30, "#a8784a");
        E(270, 192, 56, 18, "#6b4423");
        T("cesta", 270, 238, "#ffe08a", 10);
        S.items.forEach(drawItem);
      },
      auto: (S) => (want.every((n) => S.got.includes(n)) ? clamp(1 - S.wrong * 0.25, 0, 1) : null),
      finish: (S) => (S.got.length / 3) * 0.6,
    });
  }

  /** Acendedor: levar a vara com a chama até o pavio e segurar firme no vento. */
  function lightLamp() {
    return {
      title: "Acender o lampião",
      sub: "Arraste a ponta da vara (a chama) até o pavio e segure parado em cima dele. O vento balança o lampião!",
      time: 14,
      state: () => ({ heat: 0 }),
      draw(g, S, dt) {
        R(0, 0, W, H, "#1a1a3a");
        for (let k = 0; k < 20; k++) C((k * 71) % W, (k * 37) % 120, 1, "#fff");
        // poste de ferro com braço; o lampião pende numa corrente e balança
        R(150, 40, 8, 200, "#2a2a32");
        R(152, 40, 2, 200, "#4a4a52");
        R(144, 228, 20, 12, "#2a2a32");
        R(150, 40, 70, 6, "#2a2a32");
        R(212, 36, 8, 14, "#2a2a32");
        const ang = Math.sin(S.t * 1.7) * 0.35 + Math.sin(S.t * 3.1) * 0.1;
        const px0 = 216,
          py0 = 46,
          len = 34;
        const lx = px0 + Math.sin(ang) * len,
          ly = py0 + Math.cos(ang) * len + 16;
        g.strokeStyle = "#5a5a62";
        g.lineWidth = 2;
        g.setLineDash([3, 2]);
        g.beginPath();
        g.moveTo(px0, py0);
        g.lineTo(lx, ly - 20);
        g.stroke();
        g.setLineDash([]);
        g.save();
        g.translate(lx, ly);
        g.rotate(-ang * 0.6);
        R(-12, -22, 24, 4, "#2a2a32");
        R(-6, -26, 12, 4, "#2a2a32");
        R(-14, -18, 28, 32, "rgba(255,240,180,.12)");
        g.strokeStyle = "#2a2a32";
        g.lineWidth = 3;
        g.strokeRect(-14, -18, 28, 32);
        R(-1, -18, 2, 32, "#2a2a32");
        R(-12, 14, 24, 4, "#2a2a32");
        R(-2, 4, 4, 8, "#e8e4dc");
        g.restore();
        const fx = S.down ? S.p.x : 80,
          fy = S.down ? S.p.y : 200;
        g.strokeStyle = "#8a5a2e";
        g.lineWidth = 4;
        g.beginPath();
        g.moveTo(40, 240);
        g.lineTo(fx, fy);
        g.stroke();
        C(fx, fy - 4, 5 + Math.sin(S.t * 20), "#ffb04a");
        if (S.down && Math.hypot(fx - lx, fy - 4 - (ly + 2)) < 12) S.heat += dt;
        else S.heat = Math.max(0, S.heat - dt * 0.8);
        if (S.heat > 0.2) C(lx, ly + 2, 3 + S.heat * 4, `rgba(255,190,80,${Math.min(1, S.heat)})`);
        R(20, 225, 300 * clamp(S.heat / 1.3, 0, 1), 8, "#ffb04a");
        S.msg = S.heat > 0 ? "Segura firme..." : "";
      },
      auto: (S) => (S.heat >= 1.3 ? clamp(1 - S.t / 14 * 0.4, 0.5, 1) : null),
      finish: (S) => clamp(S.heat / 1.3, 0, 1) * 0.5,
    };
  }

  /* ----- ligando nos trabalhos de rua ----- */
  const STREET = { lenhador: chopTree, fazendeiro: harvest, minerador: mineRock };
  if (typeof jobInteract === "function") {
    const jiBase = jobInteract;
    jobInteract = function (x, y) {
      const j = player.job,
        p = j && PROFESSIONS[j.id];
      const label = j && jobLabel(x, y);
      if (p && label && STREET[j.id] && p.tile && label.startsWith(p.verb) && !chain) {
        runS(j.id, [STREET[j.id]()], (s, max) => {
          if (s / max < 0.3) return toast("Não deu certo. Tente de novo.", 1500);
          const k = x + "," + y;
          j.hits[k] = p.hits;
          const sf = swingFeedback;
          swingFeedback = () => 2;
          try {
            jiBase(x, y);
          } finally {
            swingFeedback = sf;
          }
          if (s / max >= 0.8) earn(2, "Trabalho caprichado!");
        });
        return true;
      }
      if (label === "Carregar as caixas no armazém" && !chain) {
        runS("carregador", [stackCrates()], (s, max) => {
          if (s / max < 0.3) return toast("A pilha caiu toda. Tente de novo.", 1500);
          const z = j.zone;
          const doors = ZONES[z].town.bld.filter((b) => b.name && b.name !== WAREHOUSES[z]);
          const b = doors[Math.floor(Math.random() * doors.length)];
          j.to = { x: b.door[0], y: b.y + b.h - 1, name: b.name };
          j.step = "levar";
          j.pickedAt = absMinutes();
          toast(`Carrinho cheio! Saia e leve até: ${b.name}`, 2600);
        });
        return true;
      }
      if (j && (j.id === "feirante" || j.id === "stall") && label === "Atender cliente" && !chain) {
        runS("feirante", [basket()], (s, max) => (s / max < 0.3 ? toast("O cliente desistiu da cesta errada.", 1500) : jiBase(x, y)));
        return true;
      }
      if (j && j.id === "acendedor" && label && label.startsWith(p.verb) && (j.oil ?? 4) > 0 && !chain) {
        runS("acendedor", [lightLamp()], (s, max) => (s / max < 0.3 ? toast("O vento apagou a chama. De novo!", 1500) : jiBase(x, y)));
        return true;
      }
      return jiBase(x, y);
    };
  }

  // O carregador pega as caixas DENTRO do armazém (a porta só serve para entrar).
  if (typeof jobLabel === "function") {
    const jlBase = jobLabel;
    jobLabel = function (x, y) {
      const j = player.job;
      if (j && j.id === "carregador" && j.step === "pegar") {
        if (player.zone === "interior" && game.inter && game.inter.b && game.inter.b.name === WAREHOUSES[j.zone] && tileAt("interior", x, y) === "Q") return "Carregar as caixas no armazém";
        const r = jlBase(x, y);
        return r === "Pegar caixa" ? null : r;
      }
      return jlBase(x, y);
    };
  }

  /* ===================== A ESTANTE DO ÍNDICE (Biblioteca Caída) ===================== */
  const IDX_BOOKS = [
    ["Fogo", "#c94a4a"],
    ["Água", "#3a74c9"],
    ["Terra", "#7a5a2e"],
    ["Ar", "#9ad0d8"],
  ];
  function perms(a) {
    if (a.length <= 1) return [a];
    return a.flatMap((x, i) => perms([...a.slice(0, i), ...a.slice(i + 1)]).map((p) => [x, ...p]));
  }
  function makeClues(sol) {
    const N = sol.length,
      names = sol.slice();
    const kinds = [
      () => {
        const i = Math.floor(Math.random() * (N - 1));
        return { t: `O livro de ${sol[i]} fica logo à esquerda do de ${sol[i + 1]}.`, f: (p) => p.indexOf(sol[i]) + 1 === p.indexOf(sol[i + 1]) };
      },
      () => {
        const a = Math.floor(Math.random() * N);
        let b = Math.floor(Math.random() * N);
        while (b === a) b = Math.floor(Math.random() * N);
        const [x, y] = a < b ? [sol[a], sol[b]] : [sol[b], sol[a]];
        return { t: `${x} fica em algum lugar à esquerda de ${y}.`, f: (p) => p.indexOf(x) < p.indexOf(y) };
      },
      () => {
        const mid = sol.slice(1, N - 1);
        const x = mid[Math.floor(Math.random() * mid.length)];
        return { t: `${x} não fica em nenhuma das pontas.`, f: (p) => p.indexOf(x) > 0 && p.indexOf(x) < N - 1 };
      },
      () => {
        const i = Math.random() < 0.5 ? 0 : N - 1;
        return { t: `${sol[i]} fica na ${i === 0 ? "primeira" : "última"} posição.`, f: (p) => p[i] === sol[i] };
      },
    ];
    const all = perms(names);
    for (let tries = 0; tries < 200; tries++) {
      const clues = [];
      let left = all;
      while (left.length > 1 && clues.length < 5) {
        const c = kinds[Math.floor(Math.random() * kinds.length)]();
        if (clues.some((q) => q.t === c.t)) continue;
        const nl = left.filter(c.f);
        if (nl.length < left.length) clues.push(c), (left = nl);
      }
      if (left.length === 1) return clues.map((c) => c.t);
    }
    return [`A ordem é ${sol.join(", ")}.`];
  }
  window.indexPuzzle = function (onDone) {
    const sol = shuffle(IDX_BOOKS.map((b) => b[0]));
    const clues = makeClues(sol);
    const slots = Array.from({ length: 4 }, (_, i) => ({ x: 60 + i * 62, y: 110, w: 50, h: 70, book: null }));
    const st = dragStage({
      title: "A Estante do Índice",
      sub: "Ponha os quatro livros na estante na ordem certa. As pistas estão gravadas na madeira:<br>" + clues.map((c) => "• " + c).join("<br>"),
      time: 90,
      ready: "Fechar a estante",
      state: () => ({ items: shuffle(IDX_BOOKS).map(([n, c], i) => ({ x: 30 + i * 80, y: 196, w: 50, h: 40, label: n, c, tc: "#fff", n, sz: 10 })), slots }),
      drop(S, it, p) {
        for (const s of S.slots) if (s.book === it) s.book = null;
        const sl = S.slots.find((s) => p.x > s.x - 8 && p.x < s.x + s.w + 8 && p.y > s.y - 20 && p.y < s.y + s.h + 20 && !s.book);
        if (sl) (sl.book = it), (it.x = sl.x), (it.y = sl.y + 15), playSound(500, 0.04, "triangle");
      },
      draw(g) {
        R(0, 0, W, H, "#2a2030");
        R(44, 96, 264, 96, "#5a3a22");
        for (const s of S.slots) R(s.x, s.y, s.w, s.h, "#2a1a10");
        R(44, 186, 264, 8, "#8a6a3a");
        S.slots.forEach((s, i) => T(String(i + 1), s.x + s.w / 2, s.y - 4, "#ffe08a", 10));
        S.items.forEach(drawItem);
      },
      finish(S) {
        if (S.slots.some((s) => !s.book)) return toast("Ainda falta livro na estante.", 1400), 0;
        return S.slots.every((s, i) => s.book.n === sol[i]) ? 1 : 0;
      },
    });
    run([st], (s, m) => onDone(s >= m * 0.9));
  };

  /** Fundo de aldeia medieval: casas enxaimel, torre da igreja e bandeirolas. */
  function village(yb, night) {
    const roofs = ["#8a3a2a", "#6b4423", "#7a2a2a", "#5a4a3a", "#8a5a2e"];
    R(250, yb - 96, 26, 96, night ? "#2a2438" : "#bdb3a0");
    g.fillStyle = night ? "#3a2a3a" : "#5a4a5a";
    g.beginPath();
    g.moveTo(246, yb - 96);
    g.lineTo(263, yb - 130);
    g.lineTo(280, yb - 96);
    g.fill();
    for (let i = 0; i < 6; i++) {
      const x = i * 62 - 6,
        w = 50,
        h = 40 + ((i * 13) % 18);
      R(x, yb - h, w, h, night ? "#3a3048" : "#efe6d2");
      if (!night) {
        g.fillStyle = "#4a2e17";
        g.fillRect(x, yb - h, w, 3);
        g.fillRect(x, yb - h / 2, w, 3);
        g.fillRect(x, yb - h, 3, h);
        g.fillRect(x + w - 3, yb - h, 3, h);
        g.fillRect(x + w / 2 - 1, yb - h, 3, h);
      }
      R(x + 8, yb - h + 8, 8, 8, night ? "#ffd66b" : "#5a7a9a");
      R(x + 32, yb - h + 8, 8, 8, night ? "#ffd66b" : "#5a7a9a");
      g.fillStyle = night ? "#2a1e2a" : roofs[i % 5];
      g.beginPath();
      g.moveTo(x - 4, yb - h);
      g.lineTo(x + w / 2, yb - h - 22);
      g.lineTo(x + w + 4, yb - h);
      g.fill();
    }
    const cols = ["#c94a4a", "#f2c14e", "#3a74c9", "#7ab04a", "#f2eecf"];
    g.strokeStyle = "#5a3a22";
    g.lineWidth = 1;
    g.beginPath();
    for (let i = 0; i <= 18; i++) g.lineTo(i * 20, 20 + Math.sin((i / 18) * Math.PI) * 16);
    g.stroke();
    for (let i = 0; i < 18; i++) {
      const y = 20 + Math.sin(((i + 0.5) / 18) * Math.PI) * 16;
      g.fillStyle = cols[i % cols.length];
      g.beginPath();
      g.moveTo(i * 20 + 3, y);
      g.lineTo(i * 20 + 17, y);
      g.lineTo(i * 20 + 10, y + 12);
      g.fill();
    }
  }
  /* ===================== JOGOS DOS FESTIVAIS MEDIEVAIS ===================== */

  /** São João: pular a fogueira quando a chama baixa (golpe para cima). */
  function bonfire() {
    return {
      title: "Pular a fogueira",
      sub: "A chama sobe e desce. Quando ela estiver BAIXA, arraste o dedo para CIMA para pular. Três saltos para dar sorte no ano!",
      time: 20,
      state: () => ({ jumps: 0, burn: 0, jy: 0 }),
      up(S, p, s) {
        if (!s || s.y - p.y < 40 || S.jy > 0) return;
        const flame = 0.5 + 0.5 * Math.sin(S.t * 2.4);
        S.jy = 1;
        if (flame < 0.4) S.jumps++, playSound(784, 0.1, "sine");
        else S.burn++, playSound(160, 0.12, "sawtooth"), (S.msg2 = "Ai! Queimou a barra da roupa!");
      },
      draw(g, S, dt) {
        sky("#141434", "#3a2a4a");
        for (let k = 0; k < 20; k++) C((k * 71) % W, (k * 37) % 100, 1, "#fff");
        village(190, true);
        R(0, 190, W, 50, "#3a4a2a");
        const flame = 0.5 + 0.5 * Math.sin(S.t * 2.4);
        R(140, 186, 80, 10, "#5a3a22");
        for (let k = 0; k < 5; k++) {
          const h = 30 + flame * 70 + Math.sin(S.t * 9 + k) * 8;
          g.fillStyle = ["#ff6a2a", "#ffb04a", "#ffe08a"][k % 3];
          g.beginPath();
          g.moveTo(148 + k * 14, 188);
          g.lineTo(156 + k * 14, 188 - h);
          g.lineTo(164 + k * 14, 188);
          g.fill();
        }
        light(180, 150, 180, "rgba(255,140,50,A)", 0.3 + flame * 0.2);
        if (S.jy > 0) S.jy = Math.max(0, S.jy - dt * 1.4);
        const jy = Math.sin(S.jy * Math.PI) * 90;
        const px = 60 + (1 - S.jy) * 0 + (S.jy > 0 ? (1 - S.jy) * 240 : 0);
        const old = ctx;
        ctx = g;
        try {
          drawSprite(wizardRects(player.look.robe || "#3d4fa8", null, player.look.hair || "#3a2414", null, "right", 1), S.jy > 0 ? px : 40, 158 - jy, 2);
        } finally {
          ctx = old;
        }
        S.msg = S.msg2 || `${S.jumps}/3 saltos`;
      },
      auto: (S) => (S.jumps >= 3 && S.jy === 0 ? Math.max(0.3, 1 - S.burn * 0.2) : null),
      finish: (S) => S.jumps / 3,
    };
  }

  /** Colheita: pegar maçã com a boca na tina d'água. */
  function appleBob() {
    const apples = Array.from({ length: 5 }, (_, i) => ({ x: 110 + i * 34, y: 150, ph: Math.random() * 6, got: false }));
    return {
      title: "Maçã na tina",
      sub: "As maçãs boiam e fogem. Segure em cima da tina para mergulhar a cabeça e solte quando estiver em cima de uma maçã. Mãos para trás!",
      time: 20,
      state: () => ({ apples, got: 0, dive: 0, miss: 0 }),
      up(S, p) {
        const a = S.apples.find((q) => !q.got && Math.hypot(q.x - p.x, q.y - p.y) < 14);
        if (a) (a.got = true), S.got++, playSound(700, 0.08, "sine");
        else S.miss++, playSound(200, 0.06, "triangle"), (S.msg2 = "Splash! Só água.");
      },
      draw(g, S, dt) {
        sky("#8ac8e8", "#f8e8b8");
        village(150);
        R(0, 150, W, 90, "#7a9a3a");
        E(180, 170, 120, 40, "#6b4423");
        E(180, 160, 108, 30, "#3a74c9");
        for (const a of S.apples) {
          if (a.got) continue;
          a.ph += dt * 1.6;
          a.x += Math.sin(a.ph) * 0.6;
          a.y = 156 + Math.sin(a.ph * 1.3) * 3;
          C(a.x, a.y, 9, "#c94a4a");
          R(a.x - 1, a.y - 12, 2, 4, "#5a3a22");
          R(a.x + 1, a.y - 11, 5, 3, "#5a9a3a");
        }
        if (S.down) (C(S.p.x, S.p.y - 6, 12, player.look.skin || "#e8b896"), R(S.p.x - 12, S.p.y - 20, 24, 8, player.look.hair || "#3a2414"));
        S.msg = S.msg2 || `${S.got}/3 maçãs`;
      },
      auto: (S) => (S.got >= 3 ? Math.max(0.3, 1 - S.miss * 0.1) : null),
      finish: (S) => S.got / 3,
    };
  }

  /** Tiro com arco: puxar a corda para trás e soltar, com vento. */
  function archery() {
    return {
      title: "Concurso de arco e flecha",
      sub: "Puxe a flecha para TRÁS (arraste do arco para a esquerda) e solte. Mais puxada = mais longe. Olhe o vento na bandeira! Três flechas.",
      time: 30,
      state: () => ({ shots: [], arrow: null, wind: (Math.random() - 0.5) * 40 }),
      up(S, p, s) {
        if (!s || S.arrow || S.shots.length >= 3) return;
        const pull = Math.min(120, Math.max(0, s.x - p.x));
        const aim = (s.y - p.y) * 0.6;
        S.arrow = { x: 76, y: 160, vx: pull * 3.2, vy: -aim * 2 - pull * 1.1, t: 0 };
        playSound(300, 0.08, "triangle");
      },
      draw(g, S, dt) {
        sky("#8ac8e8", "#d8eef8");
        village(180);
        R(0, 180, W, 60, "#5a8a3a");
        // alvo de palha
        R(306, 120, 6, 70, "#6b4423");
        for (const [r, c] of [[22, "#f2eecf"], [17, "#c94a4a"], [11, "#f2eecf"], [6, "#c94a4a"]]) C(310, 130, r, c);
        // bandeira de vento
        R(200, 60, 3, 122, "#5a3a22");
        R(196, 178, 11, 4, "#4a2e17");
        g.fillStyle = "#c94a4a";
        g.beginPath();
        g.moveTo(203, 60);
        g.lineTo(203 + S.wind, 66);
        g.lineTo(203, 72);
        g.fill();
        // arqueiro
        {
          const old = ctx;
          ctx = g;
          try {
            drawSprite(wizardRects(player.look.robe || "#3d4fa8", null, player.look.hair || "#3a2414", null, "right", 0), 40, 148, 2);
          } finally {
            ctx = old;
          }
        }
        g.strokeStyle = "#8a5a2e";
        g.lineWidth = 3;
        g.beginPath();
        g.arc(72, 160, 16, -1.2, 1.2);
        g.stroke();
        if (S.down && S.start && !S.arrow) dash(72, 160, 72 - Math.min(120, S.start.x - S.p.x) * 0.3, 160 - (S.start.y - S.p.y) * 0.2, "#fff");
        const A = S.arrow;
        if (A) {
          A.t += dt;
          A.vx += S.wind * dt * 1.5;
          A.vy += 260 * dt;
          A.x += A.vx * dt;
          A.y += A.vy * dt;
          R(A.x - 8, A.y - 1, 16, 2, "#5a3a22");
          if (A.x >= 306 || A.y > 190) {
            const d = A.x >= 306 ? Math.abs(A.y - 130) : 99;
            S.shots.push(d);
            S.arrow = null;
            playSound(d < 6 ? 1047 : d < 22 ? 660 : 180, 0.1, "sine");
          }
        }
        S.shots.forEach((d, i) => d < 22 && C(310, 130 + (i - 1) * 3, 2, "#1a1028"));
        S.msg = S.shots.map((d) => (d < 6 ? "Na mosca!" : d < 22 ? "No alvo" : "Errou")).join(" · ");
      },
      auto: (S) => (S.shots.length >= 3 && !S.arrow ? S.shots.reduce((s, d) => s + (d < 6 ? 1 : d < 22 ? 0.5 : 0), 0) / 3 : null),
      finish: (S) => S.shots.reduce((s, d) => s + (d < 6 ? 1 : d < 22 ? 0.5 : 0), 0) / 3,
    };
  }

  /** Mastro de maio: dançar em volta trançando as fitas. */
  const maypole = circleStage("Dança do mastro de maio", "Gire em volta do mastro no ritmo da música, trançando as fitas coloridas.", {
    cx: 180,
    cy: 150,
    r: 70,
    lo: 2.2,
    hi: 5,
    need: 6,
    drawBg(S) {
      sky("#9fd0f0", "#f8f0d8");
      village(180);
      R(0, 180, W, 60, "#7ab04a");
      R(176, 30, 8, 160, "#d8c8a8");
      C(180, 30, 8, "#ff6b8a");
      const cols = ["#ff6b8a", "#f5d76e", "#5fa0ff", "#7ad36b", "#c77dff", "#fff"];
      cols.forEach((c, i) => {
        const a = S.rot + (i * Math.PI) / 3;
        g.strokeStyle = c;
        g.lineWidth = 3;
        g.beginPath();
        g.moveTo(180, 34);
        g.lineTo(180 + Math.cos(a) * 80, 170 + Math.sin(a) * 18);
        g.stroke();
      });
      for (let k = 0; k < Math.min(12, S.ok * 2); k++) R(176, 50 + k * 8, 8, 4, cols[k % 6]);
      if (S.down) C(S.p.x, S.p.y, 8, player.look.robe || "#3d4fa8");
    },
  });

  /** Corrida de sacos: pular alternando os dois pés. */
  function sackRace() {
    return {
      title: "Corrida de sacos",
      sub: "Toque ALTERNANDO no pé esquerdo e no direito (ou A e D) para pular dentro do saco. Ritmo, não pressa: trocar errado faz cair!",
      time: 15,
      state: () => ({ x: 20, last: null, falls: 0, rival: 20 }),
      down(S, p) {
        const side = p.x < W / 2 ? "a" : "d";
        hop(S, side);
      },
      draw(g, S, dt) {
        sky("#8ac8e8", "#f8e8b8");
        village(160);
        R(0, 160, W, 80, "#7ab04a");
        R(330, 156, 4, 60, "#f2eecf");
        R(0, 186, W, 2, "#5a8a3a");
        R(0, 214, W, 2, "#5a8a3a");
        S.rival += dt * 20;
        const sack = (x, bottom, skin, hair) => {
          R(x, bottom - 20, 18, 20, "#c9a878");
          R(x, bottom - 20, 18, 3, "#a8885a");
          R(x + 3, bottom - 30, 12, 10, skin);
          R(x + 3, bottom - 32, 12, 4, hair);
          R(x + 5, bottom - 26, 2, 2, "#1a1028");
          R(x + 11, bottom - 26, 2, 2, "#1a1028");
        };
        sack(S.rival, 214, "#d9a07a", "#3a2414");
        const hopY = S.hop > 0 ? Math.sin((S.hop / 0.3) * Math.PI) * 14 : 0;
        if (S.hop > 0) S.hop -= dt;
        if (hopY > 1) E(S.x + 9, 187, 9, 2, "rgba(0,0,0,.25)");
        sack(S.x, 186 - hopY, player.look.skin || "#e8b896", player.look.hair || "#3a2414");
        R(20, 220, 150, 18, "rgba(0,0,0,.3)");
        R(190, 220, 150, 18, "rgba(0,0,0,.3)");
        T("pé esquerdo (A)", 95, 233, "#fff", 10);
        T("pé direito (D)", 265, 233, "#fff", 10);
        S.msg = S.falls ? `Caiu ${S.falls}x` : "";
      },
      auto: (S) => (S.x >= 320 ? (S.rival < S.x ? 1 : 0.6) : S.rival >= 320 ? 0.2 : null),
      finish: (S) => S.x / 320,
    };
  }
  function hop(S, side) {
    if (S.hop > 0) return;
    if (side === S.last) {
      S.falls++;
      S.x = Math.max(20, S.x - 10);
      playSound(140, 0.1, "square");
      S.last = null;
      return;
    }
    S.last = side;
    S.x += 14;
    S.hop = 0.3;
    playSound(400, 0.04, "triangle");
  }
  /* ----- Festa das Mil Lanternas (Solmar) ----- */
  function nightSea(S) {
    const sky = g.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, "#0e1030");
    sky.addColorStop(0.7, "#2a2050");
    sky.addColorStop(1, "#3a2a50");
    g.fillStyle = sky;
    g.fillRect(0, 0, W, H);
    for (let i = 0; i < 30; i++) R((i * 97) % W, (i * 41) % 120, 1, 1, "rgba(255,255,255,.7)");
    C(300, 40, 14, "#f2eee0");
    C(305, 36, 12, "#0e1030");
    // outras lanternas subindo ao longe
    for (let i = 0; i < 24; i++) {
      const x = (i * 53 + S.t * 4) % W,
        y = 150 - ((S.t * (6 + (i % 5)) + i * 37) % 150);
      R(x, y, 3, 4, "#ffb04a");
      R(x, y, 3, 1, "#ffe08a");
    }
    R(0, 170, W, 70, "#1a2a4a");
    for (let i = 0; i < 12; i++) R((i * 37 + S.t * 10) % W, 180 + (i % 4) * 14, 18, 1, "rgba(255,190,90,.35)");
  }
  function skyLantern() {
    return {
      title: "Lanterna do céu",
      sub: "Segure no pavio para aquecer o ar. Quando a lanterna encher e brilhar, arraste para CIMA e solte. Segurar demais queima o papel!",
      time: 25,
      state: () => ({ heat: 0, fly: null, burnt: false }),
      down(S, p) {
        S.onWick = Math.abs(p.x - 180) < 40 && p.y > 140;
      },
      up(S, p, st) {
        if (S.fly || S.burnt) return;
        if (st && st.y - p.y > 40 && S.heat >= 0.7) S.fly = { y: 0, q: S.heat <= 1.3 ? 1 : 0.6 };
        else if (st && st.y - p.y > 40) S.msg = "Ainda está fria. Aqueça mais!";
      },
      draw(g, S, dt) {
        nightSea(S);
        if (S.down && S.onWick && !S.fly && !S.burnt) {
          S.heat += dt * 0.45;
          if (S.heat > 1.6) ((S.burnt = true), (S.msg = "O papel queimou!"));
        } else if (!S.fly) S.heat = Math.max(0, S.heat - dt * 0.08);
        const k = Math.min(1, S.heat);
        const fy = S.fly ? (S.fly.y += dt * 70) : 0;
        const cx = 180,
          by = 170 - fy;
        // a lanterna de papel: murcha quando fria, cheia e brilhando quando quente
        const w = 26 + k * 18,
          h = 30 + k * 26;
        if (k > 0.3) {
          const gl = g.createRadialGradient(cx, by - h / 2, 4, cx, by - h / 2, 70);
          gl.addColorStop(0, `rgba(255,190,90,${0.45 * k})`);
          gl.addColorStop(1, "rgba(255,190,90,0)");
          g.fillStyle = gl;
          g.fillRect(cx - 80, by - h - 60, 160, 160);
        }
        g.fillStyle = S.burnt ? "#3a2414" : `rgb(${200 + 55 * k},${120 + 70 * k},${60 + 30 * k})`;
        g.beginPath();
        g.moveTo(cx - w / 2 + 4, by);
        g.lineTo(cx - w / 2, by - h + 8);
        g.quadraticCurveTo(cx, by - h - 8, cx + w / 2, by - h + 8);
        g.lineTo(cx + w / 2 - 4, by);
        g.closePath();
        g.fill();
        R(cx - w / 2 + 4, by - 2, w - 8, 3, "#8a5a2e");
        for (let i = 1; i < 4; i++) R(cx - w / 2 + (w * i) / 4, by - h + 6, 1, h - 6, "rgba(120,60,20,.35)");
        // pavio
        R(cx - 3, by + 2, 6, 4, "#5a3a1e");
        if (S.down && S.onWick && !S.fly) ((g.fillStyle = "#ffe08a"), g.beginPath(), g.arc(cx, by + 1, 3 + Math.random() * 2, 0, 7), g.fill());
        // mãos segurando (somem quando ela voa)
        if (!S.fly) (R(cx - w / 2 - 8, by - 8, 8, 6, "#e8b890"), R(cx + w / 2, by - 8, 8, 6, "#e8b890"));
        // termômetro do ar quente
        R(20, 60, 10, 100, "#2a1a2a");
        R(20, 60 + 100 - Math.min(1.6, S.heat) * 62, 10, Math.min(1.6, S.heat) * 62, S.heat > 1.3 ? "#e05a3a" : S.heat >= 0.7 ? "#f2c14e" : "#8a6a42");
        R(16, 160 - 62, 18, 1, "#fff");
        R(16, 160 - 81, 18, 1, "#e05a3a");
        if (!S.fly && !S.burnt) S.msg = S.heat >= 0.7 ? (S.heat > 1.3 ? "Cuidado, está quente demais!" : "Pronta! Arraste para cima e solte.") : "Segure no pavio...";
        if (S.fly) S.msg = "Faça um pedido...";
      },
      auto: (S) => (S.burnt ? 0.1 : S.fly && S.fly.y > 190 ? S.fly.q : null),
      finish: (S) => (S.fly ? S.fly.q : Math.min(0.4, S.heat * 0.3)),
    };
  }
  function waterLantern() {
    return {
      title: "Lanterna na água",
      sub: "Arraste a lanterninha de flor até a água e solte DEVAGAR. Rápido demais, ela vira!",
      time: 20,
      state: () => ({ L: { x: 90, y: 205 }, held: false, done: null, v: 0 }),
      down(S, p) {
        S.held = !S.done && Math.hypot(p.x - S.L.x, p.y - S.L.y) < 22;
      },
      move(S, p, last) {
        if (!S.held) return;
        S.v = last ? Math.hypot(p.x - last.x, p.y - last.y) : 0;
        S.L.x = clamp(p.x, 10, W - 10);
        S.L.y = clamp(p.y, 150, 230);
      },
      up(S) {
        if (!S.held) return;
        S.held = false;
        if (S.L.y < 188) S.done = { q: S.v < 6 ? 1 : S.v < 12 ? 0.6 : 0.2, t: 0, tip: S.v >= 12 };
      },
      draw(g, S, dt) {
        nightSea(S);
        R(0, 196, W, 44, "#c9b080");
        R(0, 196, W, 3, "#e8d8a8");
        const L = S.L;
        if (S.done) ((S.done.t += dt), (L.x += dt * 14), (L.y = 186 - Math.min(10, S.done.t * 3) + Math.sin(S.t * 3) * 1.5));
        // reflexo
        if (L.y < 196) {
          const gl = g.createRadialGradient(L.x, L.y + 6, 2, L.x, L.y + 6, 30);
          gl.addColorStop(0, "rgba(255,190,90,.4)");
          gl.addColorStop(1, "rgba(255,190,90,0)");
          g.fillStyle = gl;
          g.fillRect(L.x - 30, L.y - 24, 60, 60);
        }
        g.save();
        g.translate(L.x, L.y);
        if (S.done && S.done.tip) g.rotate(Math.min(1.4, S.done.t * 2));
        E(0, 4, 14, 5, "#3a7a3a");
        for (let i = 0; i < 6; i++) E(Math.cos(i) * 8, Math.sin(i) * 2, 5, 3, i % 2 ? "#f2a8c8" : "#ffd0e0");
        R(-2, -10, 4, 10, "#f2eecf");
        if (!(S.done && S.done.tip && S.done.t > 0.6)) ((g.fillStyle = "#ffb04a"), g.beginPath(), g.arc(0, -12, 2.5 + Math.random(), 0, 7), g.fill());
        g.restore();
        S.msg = S.done ? (S.done.tip ? "Ela virou e apagou..." : "Lá vai ela, levando seus males embora.") : S.held ? (S.v > 12 ? "Devagar..." : "Isso, com calma.") : "Pegue a lanterna na areia.";
      },
      auto: (S) => (S.done && S.done.t > 2.2 ? S.done.q : null),
      finish: (S) => (S.done ? S.done.q : 0),
    };
  }
  window.festGame = function (kind, cb) {
    const st = { fogueira: bonfire, maca: appleBob, arco: archery, mastro: () => maypole, sacos: sackRace, lanterna: skyLantern, lanternaAgua: waterLantern }[kind];
    if (!st) return;
    const spec = st();
    if (kind === "sacos") spec.key = 1;
    run([spec], (s, m) => cb(s / m));
  };
  KEY_HANDLERS.ges2 = null;
  addEventListener("keydown", (e) => {
    if (game.mode !== "ges" || !S || !S.spec || S.spec.title !== "Corrida de sacos") return;
    const k = e.key.toLowerCase();
    if (k === "a" || k === "d") hop(S, k);
  });

  /* ===================== QUAL GESTO PARA QUAL OFÍCIO ===================== */
  const isDrink = (m) => m && (m.drunk || m.water) && !m.food;
  const MAP = {
    padeiro: () => [rollDough, oven],
    barbeiro: () => [haircut()],
    ferreiro: () => [forge],
    cozinheiro: () => [chop(), stir],
    taverneiro: (info) => (isDrink(info) ? [pour] : [chop(), stir]),
    costureiro: () => [stitch()],
    escriba: () => [quill()],
    pintor: () => [paint()],
    moleiro: () => [mill],
    acougueiro: () => [knife("carne")],
    peixeiro: () => [knife("peixe")],
    boticario: () => [herbs(), grind, vial],
    cavalarico: () => [brush(), bucket],
    balconista: () => [coins()],
    bardo: () => [strum()],
    joalheiro: () => [loupe(), polish()],
    bibliotecario: () => [shelf()],
    professor: () => [chalk(), chalk()],
  };
  const oldJobGame = window.jobGame;
  window.jobGame = function (id, info, title, onDone) {
    const mk = MAP[id];
    if (!mk) return oldJobGame(id, info, title, onDone);
    // estágios com estado novo a cada vez (os fixos são reiniciados pelo state())
    run(mk(info), onDone, id);
  };
  window.gestureTest = (id, info) => {
    const st = { lenhador: chopTree, fazendeiro: harvest, minerador: mineRock, carregador: stackCrates, feirante: basket, acendedor: lightLamp }[id];
    if (st) return run([st()], (s, m) => (window._gres = s + "/" + m), id);
    window.jobGame(id, info, "teste", (s, m) => (window._gres = s + "/" + m));
  };

  const st = document.createElement("style");
  st.textContent = `#ges{position:absolute;inset:0;display:none;align-items:center;justify-content:center;z-index:30;background:rgba(10,6,18,.7)}
  #ges .gs-card{width:min(96%,40em,calc(58vh * 1.5 + 1.8em));max-height:96%;background:linear-gradient(#2e2246,#1c1530);border:3px solid #c9a03a;border-radius:14px;padding:.7em .9em;color:#fff;display:flex;flex-direction:column;gap:.4em;user-select:none;-webkit-user-select:none}
  #ges h3{margin:0;text-align:center;font-family:"Pixelify Sans",sans-serif;color:#ffe08a}
  #ges .gs-sub{margin:0;font-size:.85em;color:#d8c8f0;text-align:center}#ges .gs-sub b{color:#ffe08a}
  #ges canvas{position:static!important;width:100%;height:auto!important;max-height:58vh;object-fit:contain;image-rendering:pixelated;border-radius:8px;touch-action:none;cursor:crosshair;background:#000}
  #ges .gs-tools{display:flex;gap:.3em;justify-content:center;flex-wrap:wrap}#ges .gs-tools:empty{display:none}
  #ges .gs-tools button{padding:.3em .7em;border-radius:8px;border:2px solid #6a5a8a;background:#2a2040;color:#fff}#ges .gs-tools button.on{border-color:#ffe08a;background:#4a3a6a}
  #ges .gs-foot{display:flex;justify-content:space-between;align-items:center;font-size:.85em;gap:.5em}#ges .gs-time{color:#ffb0b0;min-width:3em}#ges .gs-msg{color:#ffe08a;flex:1;text-align:center}`;
  document.head.appendChild(st);
})();
