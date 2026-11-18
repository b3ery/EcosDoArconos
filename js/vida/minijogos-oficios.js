/**
 * ECOS DO ARCANO — minijogos-oficios.js
 * Cada ofício tem o seu próprio minijogo (nada de repetir a mesma barrinha):
 *  - Padeiro: sovar a massa (toques rápidos) e tirar o pão do forno na cor certa.
 *  - Ferreiro: usar o fole para esquentar o ferro e martelar só quando está em brasa.
 *  - Costureiro: costurar os pontos na ordem numerada antes do tempo acabar.
 *  - Cozinheiro / pratos da taverna: escolher os ingredientes certos da receita.
 *  - Taverneiro (bebidas): segurar para encher a caneca até a marca, sem transbordar.
 *  - Escriba: copiar a palavra letra por letra.
 *  - Boticário: separar as ervas da receita e dosar o frasco.
 *  - Pintor: misturar tintas até chegar na cor da encomenda.
 *  - Marceneiro: posicionar a serra na medida pedida, só olhando a régua.
 *  - Professor: responder às perguntas da turma.
 * jobGame(id, info, title, onDone(score, max)).
 */

"use strict";

(() => {
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const shuffle = (a) => a.slice().sort(() => Math.random() - 0.5);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  let el, G, tick;

  function open(title, sub) {
    el = byId("jmg");
    if (!el) {
      el = document.createElement("div");
      el.id = "jmg";
      el.className = "ui";
      byId("screen").appendChild(el);
    }
    el.style.display = "flex";
    game.mode = "jmg";
    el.innerHTML = `<div class="jm-card"><h3>${title}</h3><p class="jm-sub">${sub}</p><div class="jm-body"></div><div class="jm-foot"><span class="jm-time"></span><button class="jm-quit">Desistir</button></div></div>`;
    el.querySelector(".jm-quit").onclick = () => finish(0, true);
    return el.querySelector(".jm-body");
  }
  function setTime(s) {
    const t = el && el.querySelector(".jm-time");
    if (t) t.textContent = s;
  }
  function loop(fn) {
    clearInterval(tick);
    let last = performance.now();
    tick = setInterval(() => {
      if (game.mode !== "jmg") return;
      const now = performance.now();
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      fn(dt);
    }, 30);
  }
  /** Termina a etapa atual e passa para a próxima (ou encerra). q = 0..1 */
  function finish(q, quit) {
    clearInterval(tick);
    if (!G) return;
    if (quit) {
      el.style.display = "none";
      G = null;
      if (game.mode === "jmg") game.mode = "world";
      return toast("Você desistiu.", 1200);
    }
    G.scores.push(clamp(q, 0, 1));
    playSound(q >= 0.8 ? 1047 : q >= 0.4 ? 784 : 220, 0.1, q >= 0.4 ? "sine" : "square");
    if (G.steps.length) {
      const next = G.steps.shift();
      return setTimeout(() => G && next(), 350);
    }
    const avg = G.scores.reduce((s, v) => s + v, 0) / G.scores.length;
    const done = G.onDone;
    el.style.display = "none";
    G = null;
    if (game.mode === "jmg") game.mode = "world";
    toast(avg >= 0.8 ? "Perfeito!" : avg >= 0.5 ? "Bom trabalho." : "Ficou meio ruim...", 1400);
    done(Math.round(avg * 6), 6);
  }
  function bigBtn(body, label, cls = "") {
    const b = document.createElement("button");
    b.className = "go jm-big " + cls;
    b.textContent = label;
    body.appendChild(b);
    return b;
  }

  /* ===================== OS MINIJOGOS ===================== */

  /** Toques rápidos: sovar a massa, moer ervas... */
  function mash(title, verb, need, secs) {
    const body = open(title, `Toque em "${verb}" o mais rápido que puder! Meta: ${need} vezes em ${secs}s.`);
    body.innerHTML = `<div class="jm-meter"><i></i></div>`;
    let n = 0,
      t = secs;
    const bar = body.querySelector("i");
    const b = bigBtn(body, verb);
    const hit = () => {
      n++;
      bar.style.width = Math.min(100, (n / need) * 100) + "%";
      playSound(300 + n * 15, 0.03, "triangle");
      b.style.transform = `scale(${n % 2 ? 0.94 : 1})`;
      if (n >= need) finish(1);
    };
    b.onclick = hit;
    G.key = (k) => (k === " " || k === "e") && hit();
    loop((dt) => {
      t -= dt;
      setTime(`${Math.max(0, t).toFixed(1)}s`);
      if (t <= 0) finish(n / need);
    });
  }

  /** O pão muda de cor no forno: tire quando estiver dourado. */
  function oven() {
    const body = open("Forno", "O pão vai dourando... tire quando estiver DOURADO. Se demorar, queima!");
    body.innerHTML = `<div class="jm-oven"><div class="jm-bread"></div><div class="jm-ref"><span style="background:#d9a441"></span>dourado</div></div>`;
    const br = body.querySelector(".jm-bread");
    let p = 0;
    const sp = 0.13 + Math.random() * 0.06;
    const col = (p) => {
      const stops = [
        [0, [240, 228, 190]],
        [0.6, [217, 164, 65]],
        [0.8, [140, 80, 30]],
        [1, [40, 25, 15]],
      ];
      for (let i = 1; i < stops.length; i++)
        if (p <= stops[i][0]) {
          const [a, ca] = stops[i - 1],
            [b, cb] = stops[i];
          const f = (p - a) / (b - a);
          return `rgb(${ca.map((v, k) => Math.round(v + (cb[k] - v) * f)).join(",")})`;
        }
      return "rgb(40,25,15)";
    };
    const take = () => finish(p >= 0.53 && p <= 0.68 ? 1 : p >= 0.45 && p <= 0.76 ? 0.6 : p < 0.45 ? 0.2 : 0);
    bigBtn(body, "Tirar do forno").onclick = take;
    G.key = (k) => (k === " " || k === "e") && take();
    loop((dt) => {
      p += dt * sp;
      br.style.background = col(Math.min(1, p));
      br.classList.toggle("smoke", p > 0.8);
      setTime(p > 0.8 ? "Cheiro de queimado!" : "");
      if (p >= 1.05) finish(0);
    });
  }

  /** Forja: fole esquenta, martelo só vale com o ferro em brasa. */
  function forge() {
    const body = open("Forja", "Use o FOLE para esquentar o ferro. Martele só quando o termômetro estiver na faixa laranja. Passou do branco, estraga!");
    body.innerHTML = `<div class="jm-forge"><div class="jm-therm"><b class="z"></b><i></i></div><div class="jm-iron"></div><div class="jm-hits"></div></div>`;
    const th = body.querySelector(".jm-therm i"),
      iron = body.querySelector(".jm-iron"),
      hits = body.querySelector(".jm-hits");
    let T = 0.3,
      good = 0,
      bad = 0,
      t = 14;
    const need = 5;
    const row = document.createElement("div");
    row.className = "jm-row";
    body.appendChild(row);
    const bF = bigBtn(row, "Fole (A)", "alt");
    const bM = bigBtn(row, "Martelar (E)");
    const fole = () => ((T = Math.min(1.1, T + 0.11)), playSound(120, 0.05, "sawtooth"));
    const hammer = () => {
      if (T >= 0.6 && T <= 0.88) {
        good++;
        T -= 0.06;
        playSound(900, 0.06, "square");
        game.shake = 0.08;
      } else {
        bad++;
        playSound(180, 0.08, "square");
        toast(T < 0.6 ? "Ferro frio: o martelo quica!" : "Quente demais!", 900);
      }
      hits.textContent = "●".repeat(good) + "○".repeat(Math.max(0, need - good));
      if (good >= need) finish(clamp(1 - bad * 0.12, 0.3, 1));
    };
    bF.onclick = fole;
    bM.onclick = hammer;
    G.key = (k) => (k === "a" ? fole() : k === "e" || k === " " ? hammer() : 0);
    hits.textContent = "○".repeat(need);
    loop((dt) => {
      T = Math.max(0, T - dt * 0.16);
      t -= dt;
      th.style.height = Math.min(100, T * 90) + "%";
      iron.style.background = T < 0.4 ? "#5a5a6a" : T < 0.6 ? "#a84a2a" : T < 0.88 ? "#ff8a2a" : "#fff2c0";
      setTime(`${Math.max(0, t).toFixed(1)}s`);
      if (T > 1.02) return toast("O ferro derreteu na ponta!", 1200), finish(good / need / 2);
      if (t <= 0) finish((good / need) * (1 - bad * 0.1));
    });
  }

  /** Costura: clique nos pontos na ordem. */
  function stitch() {
    const body = open("Costura", "Clique nos pontos na ordem dos números para costurar a peça.");
    body.innerHTML = `<div class="jm-cloth"></div>`;
    const cl = body.querySelector(".jm-cloth");
    const N = 7;
    const pts = [];
    while (pts.length < N) {
      const p = [8 + Math.random() * 84, 10 + Math.random() * 78];
      if (pts.every((q) => Math.hypot(q[0] - p[0], (q[1] - p[1]) * 0.6) > 14)) pts.push(p);
    }
    let i = 0,
      miss = 0,
      t = 10;
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 100 100");
    svg.setAttribute("preserveAspectRatio", "none");
    cl.appendChild(svg);
    pts.forEach((p, k) => {
      const b = document.createElement("button");
      b.className = "jm-dot";
      b.textContent = k + 1;
      b.style.left = p[0] + "%";
      b.style.top = p[1] + "%";
      b.onclick = () => {
        if (k !== i) return miss++, playSound(160, 0.06, "square"), b.classList.add("bad"), setTimeout(() => b.classList.remove("bad"), 300);
        b.classList.add("ok");
        if (i > 0) {
          const ln = document.createElementNS("http://www.w3.org/2000/svg", "line");
          const a = pts[i - 1];
          ln.setAttribute("x1", a[0]);
          ln.setAttribute("y1", a[1]);
          ln.setAttribute("x2", p[0]);
          ln.setAttribute("y2", p[1]);
          svg.appendChild(ln);
        }
        playSound(600 + i * 60, 0.04, "sine");
        i++;
        if (i >= N) finish(clamp(1 - miss * 0.12, 0.2, 1));
      };
      cl.appendChild(b);
    });
    loop((dt) => {
      t -= dt;
      setTime(`${Math.max(0, t).toFixed(1)}s`);
      if (t <= 0) finish((i / N) * 0.7);
    });
  }

  /** Receita: escolher os ingredientes certos. */
  const PANTRY = ["Carne", "Batata", "Cebola", "Alho", "Cenoura", "Abóbora", "Cogumelo", "Peixe", "Limão", "Mel", "Farinha", "Ovo", "Queijo", "Leite", "Alecrim", "Pimenta", "Manteiga", "Uva", "Maçã", "Açúcar", "Canela", "Feijão"];
  const RECIPES = {
    ensopado: ["Carne", "Batata", "Cebola", "Alecrim"],
    torta: ["Farinha", "Carne", "Cogumelo", "Manteiga"],
    sopa: ["Abóbora", "Cebola", "Alho", "Leite"],
    peixe: ["Peixe", "Farinha", "Limão", "Alho"],
    costela: ["Carne", "Mel", "Pimenta", "Alho"],
    queijo: ["Queijo", "Uva", "Mel"],
    bolinho: ["Farinha", "Ovo", "Açúcar", "Canela"],
    omelete: ["Ovo", "Queijo", "Alecrim", "Manteiga"],
    feijão: ["Feijão", "Cebola", "Alho", "Carne"],
  };
  function recipeFor(name) {
    const n = String(name).toLowerCase();
    const k = Object.keys(RECIPES).find((r) => n.includes(r.slice(0, 5)));
    return k ? RECIPES[k] : shuffle(PANTRY).slice(0, 3 + Math.floor(Math.random() * 2));
  }
  function recipe(title, need, pool = PANTRY, noun = "ingredientes") {
    const body = open(title, `Separe os ${noun} certos: <b>${need.join(", ")}</b>. Cuidado com os errados!`);
    const opts = shuffle([...need, ...shuffle(pool.filter((p) => !need.includes(p))).slice(0, Math.max(4, 9 - need.length))]);
    body.innerHTML = `<div class="jm-grid"></div><div class="jm-pot"></div>`;
    const grid = body.querySelector(".jm-grid"),
      pot = body.querySelector(".jm-pot");
    const chosen = new Set();
    let wrong = 0,
      t = 12;
    for (const o of opts) {
      const b = document.createElement("button");
      b.className = "jm-ing";
      b.textContent = o;
      b.onclick = () => {
        if (chosen.has(o)) return;
        chosen.add(o);
        b.disabled = true;
        if (need.includes(o)) b.classList.add("ok"), playSound(700, 0.04, "sine");
        else b.classList.add("bad"), wrong++, playSound(180, 0.06, "square");
        pot.textContent = [...chosen].join(" + ");
        if (need.every((x) => chosen.has(x))) finish(clamp(1 - wrong * 0.25, 0, 1));
      };
      grid.appendChild(b);
    }
    loop((dt) => {
      t -= dt;
      setTime(`${Math.max(0, t).toFixed(1)}s`);
      if (t <= 0) finish((need.filter((x) => chosen.has(x)).length / need.length) * 0.6 - wrong * 0.1);
    });
  }

  /** Segurar para encher até a marca. */
  function pour(title, foam, label = "Segure para encher") {
    const body = open(title, `${label} e solte na faixa marcada. ${foam ? "A espuma ainda sobe um pouquinho depois que você solta!" : "Nem uma gota a mais."}`);
    const lo = 0.58 + Math.random() * 0.2,
      hi = lo + (foam ? 0.1 : 0.07);
    body.innerHTML = `<div class="jm-glass ${foam ? "beer" : "vial"}"><b class="band" style="bottom:${lo * 100}%;height:${(hi - lo) * 100}%"></b><i></i></div>`;
    const fill = body.querySelector(".jm-glass i");
    let L = 0,
      hold = false,
      after = 0,
      done = false;
    const b = bigBtn(body, "Segure aqui (ou espaço)");
    const down = () => !done && (hold = true);
    const up = () => {
      if (!hold || done) return;
      hold = false;
      done = true;
      after = foam ? 0.04 + Math.random() * 0.03 : 0;
    };
    b.onpointerdown = down;
    b.onpointerup = up;
    b.onpointerleave = up;
    G.key = (k) => (k === " " || k === "e") && down();
    G.keyUp = (k) => (k === " " || k === "e") && up();
    let wait = 10;
    loop((dt) => {
      if (!hold && !done && (wait -= dt) <= 0) return finish(0);
      setTime(!hold && !done ? `${Math.max(0, wait).toFixed(1)}s` : "");
      if (hold) {
        L += dt * 0.38;
        playSound(200 + L * 300, 0.015, "sine");
      }
      if (done && after > 0) {
        const s = Math.min(after, dt * 0.12);
        L += s;
        after -= s;
      }
      fill.style.height = Math.min(100, L * 100) + "%";
      if (L > 1) return toast("Transbordou!", 900), finish(0);
      if (done && after <= 0) finish(L >= lo && L <= hi ? 1 : Math.abs(L - (lo + hi) / 2) < 0.12 ? 0.55 : 0.15);
    });
  }

  /** Escriba: copiar a palavra. */
  const WORDS = ["PERGAMINHO", "CINZALUZ", "CONTRATO", "TESTAMENTO", "HERDEIRO", "ESCRITURA", "RAINHA", "BRISAMAR", "PEDRAVALE", "CASAMENTO", "SELO REAL", "TRATADO"];
  function copyWord() {
    const w = pick(WORDS);
    const body = open("Copiar o documento", `Copie, letra por letra: <b class="jm-word">${w}</b>`);
    const letters = w.replace(/ /g, "").split("");
    body.innerHTML = `<div class="jm-paper"></div><div class="jm-grid keys"></div>`;
    const paper = body.querySelector(".jm-paper"),
      grid = body.querySelector(".jm-grid");
    let i = 0,
      miss = 0,
      t = 16;
    const pool = shuffle([...new Set([...letters, ...shuffle("ABCDEFGHILMNOPRSTU".split("")).slice(0, 4)])]);
    const press = (L) => {
      if (L !== letters[i]) return miss++, playSound(160, 0.05, "square"), paper.classList.add("blot"), setTimeout(() => paper.classList.remove("blot"), 250);
      i++;
      paper.textContent = letters.slice(0, i).join("");
      playSound(500 + i * 20, 0.03, "triangle");
      if (i >= letters.length) finish(clamp(1 - miss * 0.12, 0.1, 1));
    };
    for (const L of pool) {
      const b = document.createElement("button");
      b.className = "jm-key";
      b.textContent = L;
      b.onclick = () => press(L);
      grid.appendChild(b);
    }
    G.key = (k) => k.length === 1 && press(k.toUpperCase());
    loop((dt) => {
      t -= dt;
      setTime(`${Math.max(0, t).toFixed(1)}s`);
      if (t <= 0) finish((i / letters.length) * 0.6);
    });
  }

  /** Pintor: misturar até a cor pedida. */
  const PIG = { Vermelho: [200, 40, 40], Amarelo: [240, 200, 40], Azul: [40, 70, 200], Branco: [245, 245, 240], Preto: [25, 25, 30] };
  function mix() {
    const keys = Object.keys(PIG);
    const recipe = Array.from({ length: 2 + Math.floor(Math.random() * 3) }, () => pick(keys.slice(0, 4)));
    const avg = (list) => [0, 1, 2].map((k) => Math.round(list.reduce((s, c) => s + PIG[c][k], 0) / list.length));
    const target = avg(recipe);
    const body = open("Misturar as tintas", "Misture tintas na paleta até chegar na cor da encomenda. Cada toque é uma gota.");
    body.innerHTML = `<div class="jm-mix"><div><small>Encomenda</small><span class="sw t" style="background:rgb(${target})"></span></div><div><small>Sua paleta</small><span class="sw m"></span></div></div><div class="jm-grid pig"></div>`;
    const sw = body.querySelector(".sw.m"),
      grid = body.querySelector(".jm-grid");
    let drops = [],
      t = 20;
    const dist = () => (drops.length ? Math.hypot(...avg(drops).map((v, k) => v - target[k])) : 999);
    const paint = () => (sw.style.background = drops.length ? `rgb(${avg(drops)})` : "transparent");
    for (const k of keys) {
      const b = document.createElement("button");
      b.className = "jm-pig";
      b.innerHTML = `<i style="background:rgb(${PIG[k]})"></i>${k}`;
      b.onclick = () => (drops.push(k), drops.length > 8 && drops.shift(), paint(), playSound(400, 0.03, "sine"));
      grid.appendChild(b);
    }
    const row = document.createElement("div");
    row.className = "jm-row";
    body.appendChild(row);
    bigBtn(row, "Limpar", "alt").onclick = () => ((drops = []), paint());
    bigBtn(row, "Pronto!").onclick = () => finish(dist() < 18 ? 1 : dist() < 45 ? 0.7 : dist() < 80 ? 0.35 : 0.1);
    loop((dt) => {
      t -= dt;
      setTime(`${Math.max(0, t).toFixed(1)}s`);
      if (t <= 0) finish(dist() < 45 ? 0.5 : 0.1);
    });
  }

  /** Marceneiro: posicionar a serra na medida, só olhando a régua. */
  function measure() {
    const goal = 12 + Math.floor(Math.random() * 46);
    const body = open("Medir e serrar", `A tábua tem que ter <b>${goal} cm</b>. Mova a serra (◀ ▶) olhando a régua e serre.`);
    body.innerHTML = `<div class="jm-ruler"><div class="wood"></div><b class="saw"></b></div>`;
    const R = body.querySelector(".jm-ruler"),
      saw = body.querySelector(".saw");
    for (let c = 0; c <= 60; c += 5) {
      const m = document.createElement("span");
      m.className = c % 10 ? "tk s" : "tk";
      m.style.left = (c / 60) * 100 + "%";
      if (!(c % 10)) m.textContent = c;
      R.appendChild(m);
    }
    let pos = 30,
      t = 15;
    const draw = () => (saw.style.left = (pos / 60) * 100 + "%");
    draw();
    const row = document.createElement("div");
    row.className = "jm-row";
    body.appendChild(row);
    const mv = (d) => ((pos = clamp(pos + d, 0, 60)), draw(), playSound(300, 0.02, "triangle"));
    bigBtn(row, "◀◀", "alt").onclick = () => mv(-5);
    bigBtn(row, "◀", "alt").onclick = () => mv(-1);
    bigBtn(row, "▶", "alt").onclick = () => mv(1);
    bigBtn(row, "▶▶", "alt").onclick = () => mv(5);
    const cut = () => {
      const e = Math.abs(pos - goal);
      toast(`Ficou com ${pos} cm.`, 1400);
      finish(e === 0 ? 1 : e <= 1 ? 0.8 : e <= 3 ? 0.5 : 0.1);
    };
    bigBtn(body, "Serrar").onclick = cut;
    G.key = (k) => (k === "arrowleft" || k === "a" ? mv(-1) : k === "arrowright" || k === "d" ? mv(1) : k === "e" || k === " " ? cut() : 0);
    loop((dt) => {
      t -= dt;
      setTime(`${Math.max(0, t).toFixed(1)}s`);
      if (t <= 0) cut();
    });
  }

  /** Professor: perguntas da turma. */
  const LORE = [
    ["Quantas runas existem?", "6", ["4", "8"]],
    ["Qual é a capital do reino?", "Cinzaluz", ["Pedravale", "Brisamar"]],
    ["Quem governa Cinzaluz?", "A Rainha Aurélia", ["O Duque Matheus", "O Bardo"]],
    ["Que vila fica no mar?", "Porto Brisamar", ["Pedravale", "Cinzaluz"]],
    ["Que vila fica nas montanhas?", "Pedravale", ["Porto Brisamar", "Cinzaluz"]],
    ["Quantos dias tem o ano?", "15", ["30", "365"]],
    ["O que a runa da água vence?", "Fogo", ["Ar", "Terra"]],
  ];
  function quiz() {
    const body = open("Aula", "A turma está cheia de dúvidas. Responda certo!");
    const qs = [];
    for (let i = 0; i < 3; i++) {
      if (Math.random() < 0.5) {
        const a = 2 + Math.floor(Math.random() * 9),
          b = 2 + Math.floor(Math.random() * 9);
        const mul = Math.random() < 0.5;
        const r = mul ? a * b : a + b;
        qs.push([`Quanto é ${a} ${mul ? "×" : "+"} ${b}?`, String(r), [String(r + 1 + Math.floor(Math.random() * 3)), String(Math.max(0, r - 1 - Math.floor(Math.random() * 3)))]]);
      } else qs.push(pick(LORE));
    }
    let i = 0,
      ok = 0,
      t = 8;
    const show = () => {
      const [q, right, wrong] = qs[i];
      body.innerHTML = `<div class="jm-q"><small>${pick(["Bia", "Tiago", "Lulu", "Pedrinho", "Juca"])} levanta a mão:</small><b>${q}</b></div><div class="jm-grid ans"></div>`;
      const g = body.querySelector(".jm-grid");
      for (const a of shuffle([right, ...wrong])) {
        const b = document.createElement("button");
        b.className = "jm-ing";
        b.textContent = a;
        b.onclick = () => {
          if (a === right) ok++, playSound(800, 0.05, "sine");
          else playSound(180, 0.08, "square"), toast(`A resposta era ${right}.`, 1400);
          i++;
          t = 8;
          if (i >= qs.length) finish(ok / qs.length);
          else show();
        };
        g.appendChild(b);
      }
    };
    show();
    loop((dt) => {
      t -= dt;
      setTime(`${Math.max(0, t).toFixed(1)}s`);
      if (t <= 0) {
        i++;
        t = 8;
        if (i >= qs.length) finish(ok / qs.length);
        else show();
      }
    });
  }

  /* ===================== MINIJOGOS DAS PROFISSÕES NOVAS ===================== */

  /** Barbeiro: decorar o pedido do cliente e fazer o corte. */
  function haircut() {
    const OPTS = { Comprimento: ["Curto", "Médio", "Longo"], Franja: ["Sem franja", "Com franja"], Barba: ["Raspada", "Aparada", "Cheia"], Lados: ["Raspados", "Normais"] };
    const want = Object.fromEntries(Object.entries(OPTS).map(([k, v]) => [k, pick(v)]));
    const body = open("Cadeira do barbeiro", `O cliente diz: <b>"${Object.values(want).join(", ").toLowerCase()}"</b>. Memorize! O pedido some em 4 segundos.`);
    const sel = {};
    body.innerHTML = Object.entries(OPTS)
      .map(([k, v]) => `<div class="jm-opt"><small>${k}</small><div>${v.map((o) => `<button class="jm-ing" data-k="${k}" data-v="${o}">${o}</button>`).join("")}</div></div>`)
      .join("");
    body.querySelectorAll("[data-k]").forEach(
      (b) =>
        (b.onclick = () => {
          sel[b.dataset.k] = b.dataset.v;
          body.querySelectorAll(`[data-k="${b.dataset.k}"]`).forEach((q) => q.classList.toggle("ok", q === b));
          playSound(500, 0.03, "triangle");
        }),
    );
    const cut = () => finish(Object.keys(OPTS).filter((k) => sel[k] === want[k]).length / 4);
    bigBtn(body, "Cortar! ✂").onclick = cut;
    let t = 18;
    loop((dt) => {
      t -= dt;
      if (t < 14) el.querySelector(".jm-sub").innerHTML = "O que era mesmo que ele pediu? Escolha e corte.";
      setTime(`${Math.max(0, t).toFixed(1)}s`);
      if (t <= 0) cut();
    });
  }

  /** Bibliotecário: guardar os livros na ordem da numeração. */
  function books() {
    const nums = [];
    while (nums.length < 8) {
      const n = 100 + Math.floor(Math.random() * 800);
      if (!nums.includes(n)) nums.push(n);
    }
    const order = nums.slice().sort((a, b) => a - b);
    const body = open("Organizar a estante", "Guarde os livros na estante do MENOR número para o MAIOR. Clique no próximo da fila.");
    body.innerHTML = `<div class="jm-shelf done"></div><div class="jm-shelf pile"></div>`;
    const done = body.querySelector(".done"),
      pile = body.querySelector(".pile");
    const cols = ["#a84a4a", "#4a4aa8", "#5a9a4a", "#a8842a", "#7a3a8a", "#2a7a8a", "#8a5a2a", "#3a3a3a"];
    let i = 0,
      miss = 0,
      t = 18;
    nums.forEach((n, k) => {
      const b = document.createElement("button");
      b.className = "jm-book";
      b.style.background = cols[k];
      b.style.height = 54 + ((n * 7) % 26) + "px";
      b.textContent = n;
      b.onclick = () => {
        if (n !== order[i]) return miss++, playSound(160, 0.05, "square"), b.classList.add("bad"), setTimeout(() => b.classList.remove("bad"), 300);
        i++;
        done.appendChild(b);
        b.onclick = null;
        playSound(400 + i * 40, 0.03, "sine");
        if (i >= 8) finish(clamp(1 - miss * 0.1, 0.2, 1));
      };
      pile.appendChild(b);
    });
    loop((dt) => {
      t -= dt;
      setTime(`${Math.max(0, t).toFixed(1)}s`);
      if (t <= 0) finish((i / 8) * 0.7);
    });
  }

  /** Cavalariço: o cavalo mostra o que precisa; pegue a ferramenta certa rápido. */
  function horse() {
    const NEEDS = [
      ["Está com fome", "Feno"],
      ["Está com sede", "Balde d'água"],
      ["Está sujo de lama", "Escova"],
      ["Casco gasto", "Ferradura"],
      ["Crina embaraçada", "Pente"],
      ["Inquieto", "Carinho"],
    ];
    const body = open("Cuidar dos cavalos", "Leia o que o cavalo precisa e pegue a ferramenta certa antes que ele se irrite.");
    body.innerHTML = `<div class="jm-horse"><span class="hz">🐴</span><b class="need"></b><div class="jm-meter"><i></i></div></div><div class="jm-grid"></div>`;
    const need = body.querySelector(".need"),
      bar = body.querySelector(".jm-meter i"),
      grid = body.querySelector(".jm-grid");
    let round = 0,
      ok = 0,
      cur = null,
      left = 0;
    const next = () => {
      if (round >= 6) return finish(ok / 6);
      cur = pick(NEEDS);
      left = 2.6 - round * 0.15;
      cur.max = left;
      need.textContent = cur[0];
      round++;
    };
    for (const [, tool] of NEEDS) {
      const b = document.createElement("button");
      b.className = "jm-ing";
      b.textContent = tool;
      b.onclick = () => {
        if (!cur) return;
        if (tool === cur[1]) ok++, playSound(800, 0.04, "sine");
        else playSound(160, 0.06, "square"), toast("O cavalo bufou!", 600);
        next();
      };
      grid.appendChild(b);
    }
    next();
    loop((dt) => {
      left -= dt;
      bar.style.width = Math.max(0, (left / cur.max) * 100) + "%";
      setTime(`${round}/6`);
      if (left <= 0) toast("Demorou! O cavalo se irritou.", 700), next();
    });
  }

  /** Moleiro: girar a mó no ritmo certo, alternando os dois lados. */
  function crank() {
    const body = open("Moer o trigo", "Alterne PUXA e EMPURRA (ou A e D) para girar a mó. Mantenha a velocidade na faixa verde: devagar não mói, rápido demais trava.");
    body.innerHTML = `<div class="jm-mill"><div class="stone"></div><div class="jm-speed"><b class="z"></b><i></i></div></div><div class="jm-meter flour"><i></i></div>`;
    const stone = body.querySelector(".stone"),
      sp = body.querySelector(".jm-speed i"),
      flour = body.querySelector(".flour i");
    let v = 0,
      ang = 0,
      last = null,
      inZone = 0,
      t = 16,
      stall = 0;
    const push = (side) => {
      if (stall > 0) return;
      if (side === last) return (v = Math.max(0, v - 0.08));
      last = side;
      v = Math.min(1.1, v + 0.1);
      playSound(140 + v * 120, 0.03, "triangle");
    };
    const row = document.createElement("div");
    row.className = "jm-row";
    body.appendChild(row);
    bigBtn(row, "◀ Puxa", "alt").onclick = () => push("a");
    bigBtn(row, "Empurra ▶", "alt").onclick = () => push("d");
    G.key = (k) => (k === "a" || k === "arrowleft" ? push("a") : k === "d" || k === "arrowright" ? push("d") : 0);
    loop((dt) => {
      t -= dt;
      if (stall > 0) stall -= dt;
      v = Math.max(0, v - dt * 0.22);
      if (v > 0.95) (stall = 1.2), (v = 0), toast("Rápido demais! A mó travou.", 900);
      if (v >= 0.45 && v <= 0.78) inZone += dt;
      ang += v * dt * 600;
      stone.style.transform = `rotate(${ang}deg)`;
      sp.style.height = Math.min(100, v * 90) + "%";
      flour.style.width = Math.min(100, (inZone / 6) * 100) + "%";
      setTime(`${Math.max(0, t).toFixed(1)}s`);
      if (inZone >= 6) finish(1);
      else if (t <= 0) finish(inZone / 6);
    });
  }

  /** Açougueiro e peixeiro: pesar exatamente o que o cliente pediu. */
  function scale(title, what) {
    const goal = Math.round((0.6 + Math.random() * 2.6) * 10) / 10;
    const body = open(title, `O cliente quer <b>${goal.toFixed(1).replace(".", ",")} kg de ${what}</b>. Ponha os pedaços na balança e embrulhe.`);
    body.innerHTML = `<div class="jm-scale"><div class="dial"><b class="needle"></b></div><div class="kg">0,0 kg</div><div class="pile"></div></div>`;
    const needle = body.querySelector(".needle"),
      kg = body.querySelector(".kg"),
      pile = body.querySelector(".pile");
    let w = 0,
      parts = [],
      t = 14;
    const draw = () => {
      needle.style.transform = `rotate(${-90 + Math.min(4, w) * 45}deg)`;
      kg.textContent = w.toFixed(1).replace(".", ",") + " kg";
      pile.textContent = parts.map((p) => p.toFixed(1).replace(".", ",")).join(" + ");
    };
    const row = document.createElement("div");
    row.className = "jm-row";
    body.appendChild(row);
    for (const p of [1, 0.5, 0.3, 0.2, 0.1]) bigBtn(row, `${String(p).replace(".", ",")} kg`, "alt").onclick = () => ((w = Math.round((w + p) * 10) / 10), parts.push(p), draw(), playSound(300, 0.03, "triangle"));
    const row2 = document.createElement("div");
    row2.className = "jm-row";
    body.appendChild(row2);
    bigBtn(row2, "Tirar o último", "alt").onclick = () => parts.length && ((w = Math.round((w - parts.pop()) * 10) / 10), draw());
    const wrap = () => {
      const e = Math.abs(w - goal);
      finish(e < 0.05 ? 1 : e <= 0.15 ? 0.6 : e <= 0.3 ? 0.3 : 0);
    };
    bigBtn(row2, "Embrulhar").onclick = wrap;
    draw();
    loop((dt) => {
      t -= dt;
      setTime(`${Math.max(0, t).toFixed(1)}s`);
      if (t <= 0) wrap();
    });
  }

  /** Balconista: dar o troco certo. */
  function change() {
    const price = 3 + Math.floor(Math.random() * 45);
    const paid = [10, 20, 50, 100].find((v) => v > price + 2) || 100;
    const due = paid - price;
    const body = open("Caixa do armazém", `A compra deu <b>${price} ouro</b>. O cliente pagou com <b>${paid}</b>. Dê o troco certo com as moedas.`);
    body.innerHTML = `<div class="jm-paper troco">Troco: 0</div><div class="jm-coins"></div>`;
    const tr = body.querySelector(".troco"),
      cs = body.querySelector(".jm-coins");
    let given = 0,
      coins = [],
      t = 15;
    const draw = () => ((tr.textContent = `Troco: ${given}`), (cs.textContent = coins.join(" · ")));
    const row = document.createElement("div");
    row.className = "jm-row";
    body.appendChild(row);
    for (const c of [20, 10, 5, 2, 1]) bigBtn(row, `🪙 ${c}`, "alt").onclick = () => ((given += c), coins.push(c), draw(), playSound(900, 0.02, "sine"));
    const row2 = document.createElement("div");
    row2.className = "jm-row";
    body.appendChild(row2);
    bigBtn(row2, "Devolver tudo", "alt").onclick = () => ((given = 0), (coins = []), draw());
    const give = () => {
      if (given !== due) return toast(given > due ? "Você deu troco a mais! Prejuízo da loja." : "Faltou troco! O cliente reclamou.", 1600), finish(0.1);
      let r = due,
        min = 0;
      for (const c of [20, 10, 5, 2, 1]) while (r >= c) (r -= c), min++;
      finish(coins.length <= min ? 1 : 0.8);
    };
    bigBtn(row2, "Entregar o troco").onclick = give;
    draw();
    loop((dt) => {
      t -= dt;
      setTime(`${Math.max(0, t).toFixed(1)}s`);
      if (t <= 0) give();
    });
  }

  /** Bardo: repetir a melodia (memória). */
  function melody() {
    const NOTES = [
      ["Dó", 523, "#e05050"],
      ["Ré", 587, "#f2c14e"],
      ["Mi", 659, "#7ad36b"],
      ["Fá", 698, "#5fa0ff"],
    ];
    const body = open("Tocar para a taverna", "Ouça a melodia e repita na mesma ordem. Cada rodada tem uma nota a mais.");
    body.innerHTML = `<div class="jm-lute"></div>`;
    const lute = body.querySelector(".jm-lute");
    const btns = NOTES.map(([n, f, c], i) => {
      const b = document.createElement("button");
      b.className = "jm-note";
      b.style.background = c;
      b.textContent = n;
      b.onclick = () => press(i);
      lute.appendChild(b);
      return b;
    });
    const flash = (i) => {
      btns[i].classList.add("on");
      playSound(NOTES[i][1], 0.25, "triangle");
      setTimeout(() => btns[i].classList.remove("on"), 280);
    };
    let seq = [],
      pos = 0,
      round = 0,
      listening = false;
    const play = () => {
      listening = false;
      el.querySelector(".jm-sub").textContent = "Ouça...";
      seq.push(Math.floor(Math.random() * 4));
      if (seq.length < 3) seq.push(Math.floor(Math.random() * 4), Math.floor(Math.random() * 4));
      seq.forEach((n, k) => setTimeout(() => G && flash(n), 600 + k * 520));
      setTimeout(() => G && ((listening = true), (pos = 0), (el.querySelector(".jm-sub").textContent = "Sua vez!")), 600 + seq.length * 520);
    };
    function press(i) {
      if (!listening) return;
      flash(i);
      if (i !== seq[pos]) return toast("Desafinou!", 900), finish(round / 3);
      pos++;
      if (pos >= seq.length) {
        round++;
        if (round >= 3) return finish(1);
        toast("Aplausos!", 700);
        setTimeout(play, 500);
      }
    }
    G.key = (k) => ["1", "2", "3", "4"].includes(k) && press(+k - 1);
    play();
    loop(() => setTime(`Rodada ${Math.min(3, round + 1)}/3`));
  }

  /** Joalheiro: achar as pedras com defeito. */
  function gems() {
    const body = open("Avaliar as pedras", "Algumas pedras têm uma rachadura ou mancha escura. Separe só as com DEFEITO e confirme.");
    const n = 9,
      bad = new Set();
    while (bad.size < 3) bad.add(Math.floor(Math.random() * n));
    const cols = ["#5fd0ff", "#ff6b8a", "#7ad36b", "#c77dff", "#f2c14e"];
    body.innerHTML = `<div class="jm-gems"></div>`;
    const box = body.querySelector(".jm-gems");
    const picked = new Set();
    let t = 15;
    for (let i = 0; i < n; i++) {
      const b = document.createElement("button");
      b.className = "jm-gem";
      b.style.setProperty("--c", pick(cols));
      if (bad.has(i)) b.innerHTML = `<i style="left:${25 + Math.random() * 40}%;top:${25 + Math.random() * 40}%"></i>`;
      b.onclick = () => (picked.has(i) ? picked.delete(i) : picked.add(i), b.classList.toggle("sel"), playSound(700, 0.03, "sine"));
      box.appendChild(b);
    }
    const done = () => {
      let hit = 0,
        wrong = 0;
      for (const i of picked) bad.has(i) ? hit++ : wrong++;
      finish(clamp(hit / 3 - wrong * 0.3, 0, 1));
    };
    bigBtn(body, "Confirmar").onclick = done;
    loop((dt) => {
      t -= dt;
      setTime(`${Math.max(0, t).toFixed(1)}s`);
      if (t <= 0) done();
    });
  }

  /* ===================== QUAL JOGO PARA QUAL OFÍCIO ===================== */
  const HERBS = ["Guaco", "Hortelã", "Camomila", "Arnica", "Salgueiro", "Alecrim", "Mel", "Babosa", "Gengibre", "Urtiga", "Sálvia", "Erva-doce"];
  function jobGame(id, info, title, onDone) {
    G = { scores: [], steps: [], onDone, key: null, keyUp: null };
    const name = typeof info === "string" ? info : (info && info.n) || "";
    const S = G.steps;
    const run = {
      padeiro: () => (S.push(oven), mash(title, "Sovar", 16, 5)),
      ferreiro: () => forge(),
      costureiro: () => stitch(),
      cozinheiro: () => recipe(title, recipeFor(name)),
      escriba: () => copyWord(),
      boticario: () => (S.push(() => pour("Dosar o frasco", false, "Segure para pingar o remédio")), recipe(title, shuffle(HERBS).slice(0, 3), HERBS, "ervas")),
      pintor: () => mix(),
      marceneiro: () => measure(),
      professor: () => quiz(),
      barbeiro: () => haircut(),
      bibliotecario: () => books(),
      cavalarico: () => horse(),
      moleiro: () => crank(),
      acougueiro: () => scale(title, "carne"),
      peixeiro: () => scale(title, "peixe"),
      balconista: () => change(),
      bardo: () => melody(),
      joalheiro: () => gems(),
      taverneiro: () => (info && (info.drunk || info.water) && !info.food ? pour(title, !!info.drunk) : recipe(title, recipeFor(name))),
    }[id];
    if (run) return run();
    G = null;
    return timingGame(title, "star", ["Preparar", "Caprichar", "Entregar"], "Aperte no verde.", onDone);
  }
  window.jobGame = jobGame;

  KEY_HANDLERS.jmg = (k, e) => {
    if (k === "escape") return finish(0, true);
    if (e && e.repeat) return;
    if (G && G.key) G.key(k);
  };
  addEventListener("keyup", (e) => {
    if (game.mode === "jmg" && G && G.keyUp) G.keyUp(e.key.toLowerCase());
  });
  if (typeof BEFORE_DIALOG !== "undefined") BEFORE_DIALOG.add("jmg");

  const st = document.createElement("style");
  st.textContent = `#jmg{position:absolute;inset:0;display:none;align-items:center;justify-content:center;z-index:30;background:rgba(10,6,18,.65)}
  #jmg .jm-card{width:min(94%,30em);background:linear-gradient(#2e2246,#1c1530);border:3px solid #c9a03a;border-radius:14px;padding:1em;color:#fff;text-align:center;display:flex;flex-direction:column;gap:.6em;user-select:none;-webkit-user-select:none}
  #jmg h3{margin:0;font-family:"Pixelify Sans",sans-serif;color:#ffe08a}
  #jmg .jm-sub{margin:0;font-size:.9em;color:#d8c8f0}
  #jmg .jm-body{display:flex;flex-direction:column;align-items:center;gap:.6em}
  #jmg .jm-foot{display:flex;justify-content:space-between;align-items:center;font-size:.85em;color:#ffb0b0}
  #jmg .jm-big{font-size:1.1em;padding:.5em 1.2em;touch-action:none}
  #jmg .jm-big.alt{background:#4a3a6a;color:#fff}
  #jmg .jm-row{display:flex;gap:.5em;justify-content:center;flex-wrap:wrap}
  #jmg .jm-meter{width:90%;height:18px;border:2px solid #6a5a8a;border-radius:9px;overflow:hidden;background:#140e20}
  #jmg .jm-meter i{display:block;height:100%;width:0;background:linear-gradient(90deg,#f2c14e,#7ad36b)}
  #jmg .jm-oven{display:flex;align-items:center;gap:1em;background:#3a1a10;border:4px solid #5a3a2a;border-radius:40px 40px 8px 8px;padding:1em 1.6em}
  #jmg .jm-bread{width:110px;height:56px;border-radius:50% 50% 30% 30%;box-shadow:inset 0 -6px 0 rgba(0,0,0,.18);transition:background .1s}
  #jmg .jm-bread.smoke{box-shadow:0 -14px 18px rgba(120,120,120,.7)}
  #jmg .jm-ref{font-size:.75em;display:flex;align-items:center;gap:.3em}#jmg .jm-ref span{width:16px;height:16px;border-radius:4px;display:inline-block}
  #jmg .jm-forge{display:flex;align-items:flex-end;gap:1.2em}
  #jmg .jm-therm{position:relative;width:22px;height:120px;border:2px solid #aaa;border-radius:10px;background:#1a1a22;overflow:hidden}
  #jmg .jm-therm i{position:absolute;bottom:0;left:0;right:0;background:linear-gradient(#fff,#ff8a2a,#a83a2a)}
  #jmg .jm-therm .z{position:absolute;left:0;right:0;bottom:54%;height:25%;border-top:2px dashed #ffe08a;border-bottom:2px dashed #ffe08a;z-index:1}
  #jmg .jm-iron{width:120px;height:26px;border-radius:4px;box-shadow:0 0 14px rgba(255,140,40,.4)}
  #jmg .jm-hits{font-size:1.3em;color:#ffb060;letter-spacing:.15em}
  #jmg .jm-cloth{position:relative;width:100%;height:190px;border-radius:10px;background:repeating-linear-gradient(45deg,#7a4a8a 0 8px,#6a3a7a 8px 16px)}
  #jmg .jm-cloth svg{position:absolute;inset:0;width:100%;height:100%}#jmg .jm-cloth line{stroke:#ffe08a;stroke-width:1;stroke-dasharray:2 1.5}
  #jmg .jm-dot{position:absolute;transform:translate(-50%,-50%);width:2.1em;height:2.1em;border-radius:50%;border:2px solid #fff;background:#2a1a3a;color:#fff;font-weight:bold;padding:0}
  #jmg .jm-dot.ok{background:#7ad36b;color:#123}#jmg .jm-dot.bad{background:#e05050}
  #jmg .jm-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:.4em;width:100%}
  #jmg .jm-grid.keys{grid-template-columns:repeat(6,1fr)}#jmg .jm-grid.pig{grid-template-columns:repeat(5,1fr)}
  #jmg .jm-ing,#jmg .jm-key,#jmg .jm-pig{padding:.5em .3em;border-radius:8px;border:2px solid #6a5a8a;background:#2a2040;color:#fff;font-size:.95em}
  #jmg .jm-ing.ok{background:#2f6a3a;border-color:#7ad36b}#jmg .jm-ing.bad{background:#6a2a2a;border-color:#e05050}
  #jmg .jm-pig i{display:block;width:100%;height:18px;border-radius:4px;margin-bottom:.2em}
  #jmg .jm-pot{min-height:1.3em;font-size:.85em;color:#ffe08a}
  #jmg .jm-glass{position:relative;width:90px;height:140px;border:3px solid #cfe8f0;border-top:none;border-radius:0 0 14px 14px;overflow:hidden;background:rgba(255,255,255,.06)}
  #jmg .jm-glass.vial{width:60px;border-radius:0 0 26px 26px}
  #jmg .jm-glass i{position:absolute;bottom:0;left:0;right:0;height:0;background:linear-gradient(#fff8e0 0 10px,#d99a2a 10px)}
  #jmg .jm-glass.vial i{background:linear-gradient(#b8f0c0,#3aa85a)}
  #jmg .jm-glass .band{position:absolute;left:0;right:0;border-top:2px dashed #ffe08a;border-bottom:2px dashed #ffe08a;background:rgba(255,224,138,.15);z-index:1}
  #jmg .jm-paper{min-height:1.6em;min-width:70%;background:#f2e8d0;color:#3a2414;font-family:serif;font-size:1.4em;letter-spacing:.12em;border-radius:6px;padding:.2em .5em}
  #jmg .jm-paper.blot{background:#c8b8a0}
  #jmg .jm-mix{display:flex;gap:2em}#jmg .jm-mix div{display:flex;flex-direction:column;align-items:center;gap:.3em}
  #jmg .sw{width:70px;height:70px;border-radius:50%;border:3px solid #fff;display:block}
  #jmg .jm-ruler{position:relative;width:100%;height:84px}
  #jmg .jm-ruler .wood{position:absolute;left:0;right:0;top:10px;height:34px;background:repeating-linear-gradient(90deg,#b07a3a 0 30px,#a06a2a 30px 34px);border-radius:4px}
  #jmg .jm-ruler .tk{position:absolute;top:46px;transform:translateX(-50%);font-size:.7em;color:#ffe08a;border-left:2px solid #ffe08a;height:16px;padding-top:16px;line-height:1}
  #jmg .jm-ruler .tk.s{height:9px;padding:0;opacity:.6}
  #jmg .jm-ruler .saw{position:absolute;top:0;width:4px;height:54px;background:#e8e8f0;transform:translateX(-50%);box-shadow:0 0 6px #fff;transition:left .08s}
  #jmg .jm-q{display:flex;flex-direction:column;gap:.3em}#jmg .jm-q b{font-size:1.2em;color:#ffe08a}
  #jmg .jm-opt{display:flex;flex-direction:column;gap:.2em;width:100%}#jmg .jm-opt small{color:#c8b8e8}#jmg .jm-opt div{display:flex;gap:.3em;justify-content:center;flex-wrap:wrap}
  #jmg .jm-shelf{display:flex;align-items:flex-end;gap:3px;min-height:84px;width:100%;padding:4px;border-bottom:6px solid #6b4423;justify-content:center;flex-wrap:wrap}
  #jmg .jm-shelf.done{background:rgba(255,255,255,.04)}
  #jmg .jm-book{width:2.4em;border:none;border-radius:3px 3px 0 0;color:#fff;font-size:.72em;writing-mode:vertical-rl;padding:2px 0;font-weight:bold}#jmg .jm-book.bad{outline:3px solid #e05050}
  #jmg .jm-horse{display:flex;flex-direction:column;align-items:center;gap:.3em;width:100%}#jmg .jm-horse .hz{font-size:3em}#jmg .jm-horse .need{color:#ffe08a;font-size:1.15em}
  #jmg .jm-mill{display:flex;align-items:center;gap:1.4em}#jmg .jm-mill .stone{width:100px;height:100px;border-radius:50%;background:repeating-conic-gradient(#8a8a92 0 20deg,#6a6a72 20deg 40deg);border:4px solid #4a4a52}
  #jmg .jm-speed{position:relative;width:22px;height:110px;border:2px solid #aaa;border-radius:10px;overflow:hidden;background:#1a1a22}#jmg .jm-speed i{position:absolute;bottom:0;left:0;right:0;background:linear-gradient(#e05050,#7ad36b,#5fa0ff)}
  #jmg .jm-speed .z{position:absolute;left:0;right:0;bottom:40%;height:30%;border-top:2px dashed #7ad36b;border-bottom:2px dashed #7ad36b;z-index:1}
  #jmg .jm-meter.flour i{background:linear-gradient(90deg,#f2eee4,#fff)}
  #jmg .jm-scale{display:flex;flex-direction:column;align-items:center;gap:.3em}#jmg .jm-scale .dial{position:relative;width:140px;height:70px;border-radius:70px 70px 0 0;background:#e8e4dc;overflow:hidden}
  #jmg .jm-scale .needle{position:absolute;left:69px;bottom:0;width:3px;height:62px;background:#c94a4a;transform-origin:bottom center;transition:transform .2s}
  #jmg .jm-scale .kg{font-size:1.2em;color:#ffe08a}#jmg .jm-scale .pile{font-size:.8em;color:#c8b8e8;min-height:1em}
  #jmg .jm-coins{font-size:.85em;color:#ffe08a;min-height:1em}
  #jmg .jm-lute{display:grid;grid-template-columns:repeat(4,1fr);gap:.5em;width:100%}#jmg .jm-note{height:90px;border-radius:12px;border:3px solid rgba(0,0,0,.3);color:#1a1028;font-weight:bold;font-size:1.1em;opacity:.65}#jmg .jm-note.on{opacity:1;transform:scale(1.06);box-shadow:0 0 18px #fff}
  #jmg .jm-gems{display:grid;grid-template-columns:repeat(3,1fr);gap:.6em}
  #jmg .jm-gem{position:relative;width:64px;height:64px;border:none;background:none;padding:0}
  #jmg .jm-gem::before{content:"";position:absolute;inset:10px;background:var(--c);transform:rotate(45deg);border-radius:6px;box-shadow:inset -6px -6px 0 rgba(0,0,0,.18),inset 6px 6px 0 rgba(255,255,255,.35)}
  #jmg .jm-gem i{position:absolute;width:6px;height:6px;border-radius:50%;background:#1a1028;z-index:1;box-shadow:3px 2px 0 -1px #1a1028}
  #jmg .jm-gem.sel{outline:3px solid #ffe08a;border-radius:10px}`;
  document.head.appendChild(st);
})();
