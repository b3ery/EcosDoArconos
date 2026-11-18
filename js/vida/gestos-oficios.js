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
      spec.draw(g, S, dt);
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
  function run(stages, onDone) {
    chain = { stages: stages.slice(1), scores: [], onDone };
    stage(stages[0]);
  }
  KEY_HANDLERS.ges = (k) => k === "escape" && quit();
  if (typeof BEFORE_DIALOG !== "undefined") BEFORE_DIALOG.add("ges");

  /* ----- desenho ----- */
  const R = (x, y, w, h, c) => ((g.fillStyle = c), g.fillRect(x, y, w, h));
  const C = (x, y, r, c) => ((g.fillStyle = c), g.beginPath(), g.arc(x, y, r, 0, 7), g.fill());
  const E = (x, y, rx, ry, c) => ((g.fillStyle = c), g.beginPath(), g.ellipse(x, y, Math.max(1, rx), Math.max(1, ry), 0, 0, 7), g.fill());
  const T = (s, x, y, c = "#fff", sz = 11, al = "center") => ((g.fillStyle = c), (g.font = `bold ${sz}px monospace`), (g.textAlign = al), g.fillText(s, x, y));
  const dash = (x1, y1, x2, y2, c = "#ffe08a") => (g.setLineDash([5, 4]), (g.strokeStyle = c), (g.lineWidth = 2), g.beginPath(), g.moveTo(x1, y1), g.lineTo(x2, y2), g.stroke(), g.setLineDash([]));
  const table = (c = "#6b4423") => (R(0, 0, W, H, "#2a1e30"), R(0, 60, W, H - 60, c), R(0, 60, W, 4, "#8a5a2e"));

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
    R(it.x, it.y, it.w, it.h, it.c || "#c9a050");
    g.strokeStyle = "rgba(0,0,0,.4)";
    g.strokeRect(it.x + 0.5, it.y + 0.5, it.w - 1, it.h - 1);
    if (it.label) T(it.label, it.x + it.w / 2, it.y + it.h / 2 + 4, it.tc || "#1a1028", it.sz || 10);
  };

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
      // fole
      const fy = S.down && S.start && S.start.x < 120 ? clamp(S.p.y, 90, 200) : 150;
      R(30, 100, 70, 100, "#5a3a22");
      R(40, fy - 20, 50, 40, "#8a5a3a");
      R(55, fy - 50, 20, 30, "#3a2414");
      T("FOLE", 65, 225, "#ffe08a", 10);
      // bigorna e ferro
      R(170, 170, 160, 26, "#4a4a52");
      R(200, 196, 100, 30, "#3a3a42");
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
      if (S.fx > 0) (S.fx -= dt), T("💥", 250, 150, "#fff", 22);
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
      state: () => ({ items: all.map((h, i) => ({ x: 14 + (i % 4) * 82, y: 70 + Math.floor(i / 4) * 40, w: 76, h: 30, label: h, c: "#7ad36b", h0: h })), got: [], wrong: 0 }),
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
        R(0, 190, W, 50, "#8a6a3a");
        E(185, 135, 95, 42, "#a86a3a");
        R(255, 70, 30, 70, "#a86a3a");
        E(285, 72, 26, 16, "#a86a3a");
        C(292, 68, 3, "#1a1028");
        for (const lx of [110, 140, 225, 255]) R(lx, 165, 12, 45, "#8a5a2e");
        R(250, 60, 10, 40, "#3a2414");
        for (const c of S.cells) if (c.on) R(c.x, c.y, 4, 4, "#4a3a22");
        if (S.down) R(S.p.x - 14, S.p.y - 6, 28, 12, "#c9925a");
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
        E(285, 90, 60, 40, "#e8b896");
        T("mão do cliente", 285, 30, "#ffe08a", 10);
        S.given.forEach((v, i) => C(255 + (i % 5) * 14, 80 + Math.floor(i / 5) * 14, 6, v >= 10 ? "#f2c14e" : "#c9c9d0"));
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
        R(0, 60, W, 150, "#8a5a2e");
        ys.forEach((y, i) => R(0, y - 1, W, 2 + i * 0.5, "#e8e4dc"));
        R(68, 60, 4, 150, "#ffe08a");
        for (const n of S.notes) {
          n.x -= dt * 110;
          if (!n.hit && !n.miss && n.x < 40) n.miss = true;
          if (!n.hit && n.x > -20) C(n.x, ys[n.s], 9, n.miss ? "#6a4a4a" : ["#e05050", "#f2c14e", "#7ad36b", "#5fa0ff"][n.s]);
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
        R(20, 60, 320, 170, "#2a1a3a");
        for (const q of S.gems) {
          g.save();
          g.translate(q.x, q.y);
          g.rotate(Math.PI / 4);
          R(-16, -16, 32, 32, q.c);
          R(-16, -16, 10, 10, "rgba(255,255,255,.35)");
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
        R(-16, -170, 32, 170, "#8a5a2e");
        for (let k = 0; k < 6; k++) R(-16, -160 + k * 26, 32, 2, "#6a4020");
        C(0, -170, 50, "#3a7a2a");
        C(-30, -150, 30, "#4a8a3a");
        C(30, -150, 30, "#4a8a3a");
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
          R(s.x, s.cut === 2 ? 120 : 80, 4, s.cut === 2 ? 62 : 102, "#d9b050");
          if (!s.cut) E(s.x + 2, 80, 6, 14, "#f2c14e");
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
        E(180, 140, 100, 80, "#6a6a72");
        E(180, 140, 80, 62, "#7a7a82");
        for (let k = 0; k < 7; k++) C(130 + k * 16, 120 + ((k * 37) % 50), 5, "#c77dff");
        for (const c of S.cracks) (g.strokeStyle = "#1a1018"), (g.lineWidth = 3), g.beginPath(), g.moveTo(c.x - 10, c.y - 8), g.lineTo(c.x, c.y), g.lineTo(c.x + 8, c.y + 10), g.stroke();
        S.sp.life -= dt;
        if (S.sp.life <= 0) (S.sp = spot()), S.miss++;
        C(S.sp.x, S.sp.y, 8 + Math.sin(S.t * 14) * 2, `rgba(255,224,138,${S.sp.life / 1.4})`);
        if (S.p.x > 0) (R(S.p.x - 12, S.p.y - 12, 24, 5, "#a8a8b0"), R(S.p.x - 2, S.p.y - 10, 4, 22, "#8a5a2e"));
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
      state: () => ({ items: [0, 1, 2].map((i) => ({ x: 20 + i * 50, y: 190, w: 44, h: 34, c: "#a8784a", label: "📦", i })), stack: [], fell: 0 }),
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
        R(220, 170, 100, 16, "#6b4423");
        C(240, 192, 10, "#3a2414");
        C(300, 192, 10, "#3a2414");
        S.items.forEach(drawItem);
        S.msg = S.msg2 || `${S.stack.length}/3`;
      },
      auto: (S) => (S.stack.length >= 3 ? clamp(1 - S.fell * 0.2, 0.2, 1) : null),
      finish: (S) => S.stack.length / 4,
    });
  }

  /** Feirante: separar o pedido do cliente na cesta. */
  const STALL_GOODS = ["Maçã", "Pão", "Queijo", "Mel", "Ovos", "Peixe", "Cenoura", "Uva", "Leite"];
  function basket() {
    const want = shuffle(STALL_GOODS).slice(0, 3);
    const all = shuffle([...want, ...shuffle(STALL_GOODS.filter((g) => !want.includes(g))).slice(0, 4)]);
    return dragStage({
      title: "Montar a cesta",
      sub: `O cliente quer: <b>${want.join(", ")}</b>. Arraste só isso para a cesta.`,
      time: 16,
      state: () => ({ items: all.map((n, i) => ({ x: 14 + (i % 4) * 84, y: 70 + Math.floor(i / 4) * 40, w: 76, h: 30, label: n, c: "#f2c14e", n })), got: [], wrong: 0 }),
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
        R(176, 120, 8, 120, "#3a3a42");
        const sway = Math.sin(S.t * 1.7) * 18 + Math.sin(S.t * 3.1) * 6;
        const lx = 180 + sway,
          ly = 90;
        R(lx - 16, ly - 20, 32, 40, "rgba(255,240,180,.15)");
        g.strokeStyle = "#c9a050";
        g.lineWidth = 2;
        g.strokeRect(lx - 16, ly - 20, 32, 40);
        R(lx - 2, ly + 4, 4, 8, "#e8e4dc");
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
        run([STREET[j.id]()], (s, max) => {
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
        run([stackCrates()], (s, max) => {
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
        run([basket()], (s, max) => (s / max < 0.3 ? toast("O cliente desistiu da cesta errada.", 1500) : jiBase(x, y)));
        return true;
      }
      if (j && j.id === "acendedor" && label && label.startsWith(p.verb) && (j.oil ?? 4) > 0 && !chain) {
        run([lightLamp()], (s, max) => (s / max < 0.3 ? toast("O vento apagou a chama. De novo!", 1500) : jiBase(x, y)));
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
    run(mk(info), onDone);
  };
  window.gestureTest = (id, info) => {
    const st = { lenhador: chopTree, fazendeiro: harvest, minerador: mineRock, carregador: stackCrates, feirante: basket, acendedor: lightLamp }[id];
    if (st) return run([st()], (s, m) => (window._gres = s + "/" + m));
    window.jobGame(id, info, "teste", (s, m) => (window._gres = s + "/" + m));
  };

  const st = document.createElement("style");
  st.textContent = `#ges{position:absolute;inset:0;display:none;align-items:center;justify-content:center;z-index:30;background:rgba(10,6,18,.7)}
  #ges .gs-card{width:min(96%,40em);max-height:96%;background:linear-gradient(#2e2246,#1c1530);border:3px solid #c9a03a;border-radius:14px;padding:.7em .9em;color:#fff;display:flex;flex-direction:column;gap:.4em;user-select:none;-webkit-user-select:none}
  #ges h3{margin:0;text-align:center;font-family:"Pixelify Sans",sans-serif;color:#ffe08a}
  #ges .gs-sub{margin:0;font-size:.85em;color:#d8c8f0;text-align:center}#ges .gs-sub b{color:#ffe08a}
  #ges canvas{position:static!important;width:100%;height:auto!important;max-height:58vh;object-fit:contain;image-rendering:pixelated;border-radius:8px;touch-action:none;cursor:crosshair;background:#000}
  #ges .gs-tools{display:flex;gap:.3em;justify-content:center;flex-wrap:wrap}#ges .gs-tools:empty{display:none}
  #ges .gs-tools button{padding:.3em .7em;border-radius:8px;border:2px solid #6a5a8a;background:#2a2040;color:#fff}#ges .gs-tools button.on{border-color:#ffe08a;background:#4a3a6a}
  #ges .gs-foot{display:flex;justify-content:space-between;align-items:center;font-size:.85em;gap:.5em}#ges .gs-time{color:#ffb0b0;min-width:3em}#ges .gs-msg{color:#ffe08a;flex:1;text-align:center}`;
  document.head.appendChild(st);
})();
