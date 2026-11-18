/**
 * ECOS DO ARCANO — covis-temas.js (modo História)
 * Cada covil agora tem três câmaras SÓ DELE, com a cara do Guardião (inspirado
 * nos templos de Zelda: espelhos, nível da água, lente da verdade, gelo...),
 * e a Arena antes do Guardião:
 *  - Bosque (Ent): Pontes de Cipó (regue as sementes antes da água secar),
 *    Raízes Vivas (paredes que trocam de lugar), Pedras de Musgo (empurre até
 *    os círculos).
 *  - Farol (Fênix): Jatos de Fogo em onda, Espelhos de Luz (gire os espelhos
 *    para levar o raio até o cristal), Espírito da Chama (atraia o espírito
 *    para perto das tochas sem deixar ele te tocar).
 *  - Pântano (Serpente): Lanterna da Verdade (só a lanterna mostra o caminho
 *    firme), Gás do Pântano (prenda a respiração e ache as bolhas de ar),
 *    Vitórias-régias (afundam se você parar).
 *  - Picos (Grifo): Gelo (você só para quando bate numa pedra), Correntes de
 *    Vento (empurram para o abismo), Chão que Desmorona (pise em todas as
 *    pedras uma vez só).
 *  - Mina (Basilisco): Trilhos (acerte as agulhas e mande o carrinho),
 *    Olhar do Basilisco (esconda-se atrás das colunas), Dinamite (exploda as
 *    rochas rachadas e saia de perto).
 *  - Porto (Leviatã): Comportas (a água sobe e desce), Tentáculos (fuja da
 *    sombra antes da pancada), Cardume (siga o peixe de luz de memória).
 * Modifica (envolve) funções de outros arquivos: chTarget, chInteract, chReset,
 * walkable, update, crewDrawList.
 */

"use strict";

(() => {
  const T = TILE;
  const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const key = (x, y) => x + "," + y;
  const tier = () => lairTier();
  const box = (x, y, c, pad = 0) => ((ctx.fillStyle = c), ctx.fillRect(x * T + pad, y * T + pad, T - pad * 2, T - pad * 2));
  const dot = (x, y, r, c) => ((ctx.fillStyle = c), ctx.beginPath(), ctx.arc(x * T + 16, y * T + 16, r, 0, 7), ctx.fill());
  const reach = (id, msg) => player.x >= 18 && chSolved(id, msg);
  const hurt = (f) => (player.hp = Math.max(1, player.hp - Math.max(1, Math.round(maxHp() * f))));
  const inRoom = (x, y) => x >= 3 && x <= 17 && y >= 1 && y <= 9;

  const M = {};

  /* ===================== BOSQUE ===================== */
  M.vines = {
    n: "Pontes de Cipó",
    sub: "A água da fonte é pouca. A sede das sementes, não.",
    hint: "Três abismos cortam a sala. Encha o regador na fonte (azul) e regue a semente perto de cada abismo: o cipó cresce e vira ponte. O regador seca rápido, então corra!",
    setup: (R) => Object.assign(R, { cols: [6, 10, 14], rows: [rnd(2, 8), rnd(2, 8), rnd(2, 8)], br: [false, false, false], water: 0, spring: [3, 2] }),
    seed: (R, i) => [R.cols[i] - 1, R.rows[i] - 1 < 1 ? R.rows[i] + 1 : R.rows[i] - 1],
    walk(R, x, y) {
      const i = R.cols.indexOf(x);
      if (i >= 0 && !(R.br[i] && y === R.rows[i])) return false;
    },
    target(R, x, y) {
      if (x === R.spring[0] && y === R.spring[1]) return "Encher o regador na fonte";
      const i = [0, 1, 2].find((k) => key(...this.seed(R, k)) === key(x, y));
      if (i != null) return R.br[i] ? "Cipó crescido" : "Regar a semente";
    },
    act(R, l, x, y) {
      if (l === "Encher o regador na fonte") return (R.water = 11 - tier()), playSound(500, 0.1, "sine"), toast("Regador cheio! Corra até a semente.", 1600);
      if (l === "Regar a semente") {
        const i = [0, 1, 2].find((k) => key(...this.seed(R, k)) === key(x, y));
        if (R.water <= 0) return toast("O regador está vazio. Encha na fonte.", 1800);
        R.br[i] = true;
        R.water = 0;
        [392, 494, 587].forEach((f, k) => setTimeout(() => playSound(f, 0.12, "triangle"), k * 90));
        toast("O cipó cresce e atravessa o abismo!", 1600);
      }
    },
    tick(R, dt, id) {
      if (R.water > 0 && (R.water -= dt) <= 0) toast("A água do regador secou.", 1400);
      reach(id, "Você atravessa a última ponte de cipó. As raízes aplaudem, do jeito delas.");
    },
    draw(R, t) {
      R.cols.forEach((x, i) => {
        for (let y = 1; y <= 9; y++) {
          box(x, y, "#0a0806");
          if (R.br[i] && y === R.rows[i]) (box(x, y, "#3a6a2a", 2), (ctx.fillStyle = "#7ad36b"), ctx.fillRect(x * T, y * T + 12, T, 6));
        }
        const [sx, sy] = this.seed(R, i);
        box(sx, sy, "#6b4423", 6);
        ctx.fillStyle = R.br[i] ? "#7ad36b" : "#a8c878";
        ctx.fillRect(sx * T + 14, sy * T + (R.br[i] ? 2 : 10), 4, R.br[i] ? 12 : 6);
      });
      box(R.spring[0], R.spring[1], "#3a6aa8", 3);
      dot(R.spring[0], R.spring[1], 6 + Math.sin(t * 4), "#8ad0ff");
      if (R.water > 0) {
        ctx.fillStyle = "#5fa0ff";
        ctx.fillRect(player.rx * T + 4, player.ry * T - 8, 24 * (R.water / (11 - tier())), 4);
      }
    },
  };

  M.roots = {
    n: "Raízes Vivas",
    sub: "As paredes respiram. E mudam de ideia.",
    hint: "As raízes trocam de lugar de tempos em tempos (as que vão nascer piscam antes). Espere nos corredores livres e passe pelos buracos. Se uma raiz nascer em cima de você, volta ao começo.",
    setup(R) {
      R.cols = [5, 7, 9, 11, 13, 15, 17];
      const gaps = () => {
        const a = rnd(1, 9);
        let b = rnd(1, 9);
        while (Math.abs(b - a) < 2) b = rnd(1, 9);
        return [a, b];
      };
      R.A = R.cols.map(gaps);
      R.B = R.cols.map(gaps);
      R.ph = 0;
      R.cur = "A";
      R.P = Math.max(2, 3.4 - 0.25 * tier());
    },
    isWall(R, x, y, set) {
      const i = R.cols.indexOf(x);
      return i >= 0 && !R[set][i].includes(y);
    },
    walk(R, x, y) {
      if (this.isWall(R, x, y, R.cur)) return false;
    },
    tick(R, dt, id) {
      R.ph += dt;
      if (R.ph >= R.P) {
        R.ph = 0;
        R.cur = R.cur === "A" ? "B" : "A";
        playSound(140, 0.12, "sawtooth", 0.03);
        if (this.isWall(R, player.x, player.y, R.cur)) knockBack("Uma raiz brotou embaixo de você!");
      }
      reach(id, "As raízes se recolhem quando você passa. Elas guardam o seu cheiro.");
    },
    draw(R, t) {
      const nxt = R.cur === "A" ? "B" : "A",
        warn = R.ph > R.P - 0.7;
      R.cols.forEach((x) => {
        for (let y = 1; y <= 9; y++) {
          if (this.isWall(R, x, y, R.cur)) (box(x, y, "#4a2e17", 1), box(x, y, "#6b4423", 6));
          else if (warn && this.isWall(R, x, y, nxt) && Math.sin(t * 20) > 0) box(x, y, "rgba(140,90,40,.5)", 8);
        }
      });
    },
  };

  M.stones = {
    n: "Pedras de Musgo",
    sub: "O que é pesado também sabe o caminho.",
    hint: "Empurre as pedras de musgo (E, de frente para elas) até os círculos de runa. Se uma pedra travar num canto, use a alavanca perto da entrada para recomeçar.",
    setup(R) {
      const occ = new Set();
      const inA = (x, y) => x >= 5 && x <= 15 && y >= 2 && y <= 8;
      const goals = [];
      while (goals.length < 3) {
        const p = [rnd(6, 14), rnd(3, 7)];
        if (!occ.has(key(...p))) occ.add(key(...p)), goals.push(p);
      }
      const st = goals.map((p) => p.slice());
      for (let n = 0; n < 60; n++) {
        const s = pick(st),
          [dx, dy] = pick([[1, 0], [-1, 0], [0, 1], [0, -1]]);
        const a = [s[0] + dx, s[1] + dy],
          b = [s[0] + 2 * dx, s[1] + 2 * dy];
        if (inA(...a) && inA(...b) && !st.some((q) => key(...q) === key(...a) || key(...q) === key(...b))) (s[0] = a[0]), (s[1] = a[1]);
      }
      if (st.every((s, i) => key(...s) === key(...goals[i]))) st[0][0] = Math.min(15, st[0][0] + 1);
      Object.assign(R, { goals, st, start: st.map((s) => s.slice()), lever: [3, 8] });
    },
    target(R, x, y) {
      if (x === R.lever[0] && y === R.lever[1]) return "Alavanca (recomeçar as pedras)";
      if (R.st.some((s) => s[0] === x && s[1] === y)) return "Empurrar a pedra";
    },
    act(R, l, x, y) {
      if (l.startsWith("Alavanca")) return (R.st = R.start.map((s) => s.slice())), playSound(200, 0.2, "square"), toast("As pedras voltam para o lugar.", 1400);
      const s = R.st.find((q) => q[0] === x && q[1] === y);
      const dx = Math.sign(x - player.x),
        dy = Math.sign(y - player.y);
      const nx = x + dx,
        ny = y + dy;
      if (nx < 4 || nx > 16 || ny < 1 || ny > 9 || R.st.some((q) => q[0] === nx && q[1] === ny) || (nx === R.lever[0] && ny === R.lever[1])) return playSound(120, 0.1, "square"), toast("A pedra não sai do lugar.", 900);
      s[0] = nx;
      s[1] = ny;
      playSound(90, 0.15, "triangle");
    },
    tick(R, dt, id) {
      if (R.goals.every((g) => R.st.some((s) => key(...s) === key(...g)))) chSolved(id, "As três pedras assentam nos círculos. As runas acendem em verde.");
    },
    draw(R, t) {
      for (const g of R.goals) {
        ctx.strokeStyle = `rgba(122,211,107,${0.5 + 0.3 * Math.sin(t * 3)})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(g[0] * T + 16, g[1] * T + 16, 12, 0, 7);
        ctx.stroke();
      }
      for (const s of R.st) {
        const on = R.goals.some((g) => key(...g) === key(...s));
        box(s[0], s[1], "#6a6a62", 2);
        box(s[0], s[1], on ? "#7ad36b" : "#5a8a3a", 9);
      }
      box(R.lever[0], R.lever[1], "#5a3a22", 10);
    },
  };

  /* ===================== FAROL ===================== */
  M.jets = {
    n: "Jatos de Fogo",
    sub: "O fogo anda em onda. Ande junto com ele.",
    hint: "Colunas de fogo acendem uma depois da outra, como uma onda. Elas piscam antes de queimar. Ache o ritmo e atravesse.",
    setup: (R) => Object.assign(R, { cols: [5, 7, 9, 11, 13, 15, 17], P: Math.max(1.6, 2.6 - 0.15 * tier()), on: 0.9 }),
    state(R, i, t) {
      const p = (t / R.P + i * 0.16) % 1;
      const ph = p * R.P;
      return ph < R.on ? "fogo" : ph > R.P - 0.5 ? "aviso" : "";
    },
    tick(R, dt, id) {
      const i = R.cols.indexOf(player.x);
      if (i >= 0 && this.state(R, i, game.t) === "fogo") knockBack("Queimou! O fogo te jogou para trás.");
      reach(id, "Você passa pelo último jato. O calor fica para trás.");
    },
    draw(R, t) {
      R.cols.forEach((x, i) => {
        const s = this.state(R, i, t);
        for (let y = 1; y <= 9; y++) {
          box(x, y, "#3a1a10", 4);
          if (s === "fogo") (box(x, y, "#ff8a2a", 2), box(x, y, "#ffe08a", 10));
          else if (s === "aviso" && Math.sin(t * 25) > 0) box(x, y, "rgba(255,120,40,.45)", 6);
        }
      });
    },
  };

  M.mirrors = {
    n: "Espelhos de Luz",
    sub: "A luz só sabe andar reto. Ensine-a a virar.",
    hint: "Um raio sai do cristal da esquerda. Gire os espelhos (E) para levar a luz até o cristal apagado da direita. Nem todo espelho faz parte do caminho.",
    setup(R) {
      const path = [[9, 2, "\\"], [9, 7, "\\"], [14, 7, "/"], [14, 4, "/"]];
      const decoy = [[6, 5], [16, 8], [11, 4]];
      R.mir = [...path.map(([x, y]) => ({ x, y, o: pick(["/", "\\"]) })), ...decoy.map(([x, y]) => ({ x, y, o: pick(["/", "\\"]) }))];
      if (path.every(([x, y, o], i) => R.mir[i].o === o)) R.mir[0].o = "/";
      R.src = [3, 2];
      R.dst = [17, 4];
      R.beam = [];
    },
    target(R, x, y) {
      if (R.mir.some((m) => m.x === x && m.y === y)) return "Girar o espelho";
      if (x === R.src[0] && y === R.src[1]) return "Cristal de luz";
      if (x === R.dst[0] && y === R.dst[1]) return "Cristal apagado";
    },
    act(R, l, x, y) {
      if (l !== "Girar o espelho") return;
      const m = R.mir.find((q) => q.x === x && q.y === y);
      m.o = m.o === "/" ? "\\" : "/";
      playSound(700, 0.06, "triangle");
    },
    trace(R) {
      let x = R.src[0],
        y = R.src[1],
        dx = 1,
        dy = 0;
      const out = [];
      for (let n = 0; n < 80; n++) {
        x += dx;
        y += dy;
        if (x < 2 || x > 18 || y < 1 || y > 9) break;
        out.push([x, y]);
        if (x === R.dst[0] && y === R.dst[1]) return (R.hit = true), out;
        const m = R.mir.find((q) => q.x === x && q.y === y);
        if (m) [dx, dy] = m.o === "/" ? [-dy, -dx] : [dy, dx];
      }
      R.hit = false;
      return out;
    },
    tick(R, dt, id) {
      R.beam = this.trace(R);
      if (R.hit) chSolved(id, "O raio acende o cristal da direita. O farol inteiro vibra com a luz.");
    },
    draw(R, t) {
      ctx.fillStyle = `rgba(255,240,160,${0.5 + 0.2 * Math.sin(t * 8)})`;
      for (const [x, y] of R.beam) ctx.fillRect(x * T + 13, y * T + 13, 6, 6);
      box(R.src[0], R.src[1], "#ffe08a", 6);
      box(R.dst[0], R.dst[1], R.hit ? "#ffe08a" : "#4a4a6a", 6);
      for (const m of R.mir) {
        box(m.x, m.y, "#2a2a3a", 3);
        ctx.strokeStyle = "#cfe8ff";
        ctx.lineWidth = 4;
        ctx.beginPath();
        if (m.o === "/") (ctx.moveTo(m.x * T + 6, m.y * T + 26), ctx.lineTo(m.x * T + 26, m.y * T + 6));
        else (ctx.moveTo(m.x * T + 6, m.y * T + 6), ctx.lineTo(m.x * T + 26, m.y * T + 26));
        ctx.stroke();
      }
    },
  };

  M.spirit = {
    n: "Espírito da Chama",
    sub: "Ele quer te abraçar. Não deixe.",
    hint: "Um espírito de fogo te persegue. Ele acende tudo o que passa perto. Atraia o espírito para junto das três tochas apagadas, sem deixar ele encostar em você. Use as colunas para despistar.",
    setup(R) {
      R.torch = [[6, 2], [12, 8], [16, 2]].map(([x, y]) => ({ x, y, lit: false }));
      R.pil = [[8, 4], [8, 6], [11, 3], [11, 6], [14, 5]];
      R.sp = { x: 16, y: 6, rx: 16, ry: 6, step: 1.2 };
      R.speed = Math.max(0.32, 0.55 - 0.04 * tier());
    },
    walk(R, x, y) {
      if (R.pil.some((p) => p[0] === x && p[1] === y)) return false;
    },
    target(R, x, y) {
      const tc = R.torch.find((q) => q.x === x && q.y === y);
      if (tc) return tc.lit ? "Tocha acesa" : "Tocha apagada";
    },
    act(R, l) {
      if (l === "Tocha apagada") toast("Você não tem fogo. Mas alguém ali tem...", 1600);
    },
    tick(R, dt, id) {
      const S = R.sp;
      S.rx += (S.x - S.rx) * Math.min(1, dt * 8);
      S.ry += (S.y - S.ry) * Math.min(1, dt * 8);
      if (player.x < 3) return;
      S.step -= dt;
      if (S.step <= 0) {
        S.step = R.speed;
        const opts = [[1, 0], [-1, 0], [0, 1], [0, -1]]
          .map(([dx, dy]) => [S.x + dx, S.y + dy])
          .filter(([x, y]) => inRoom(x, y) && !R.pil.some((p) => p[0] === x && p[1] === y) && !R.torch.some((q) => q.x === x && q.y === y));
        opts.sort((a, b) => Math.abs(a[0] - player.x) + Math.abs(a[1] - player.y) - (Math.abs(b[0] - player.x) + Math.abs(b[1] - player.y)));
        if (opts[0]) [S.x, S.y] = opts[0];
        for (const tc of R.torch)
          if (!tc.lit && Math.abs(tc.x - S.x) + Math.abs(tc.y - S.y) <= 1) (tc.lit = true), playSound(880, 0.15, "sine"), toast("A tocha pegou fogo!", 1200);
      }
      if (S.x === player.x && S.y === player.y) {
        knockBack("O espírito te abraçou. Quente demais!");
        S.x = 16;
        S.y = 6;
      }
      if (R.torch.every((q) => q.lit)) chSolved(id, "As três tochas ardem juntas. O espírito sorri, satisfeito, e some numa faísca.");
    },
    draw(R, t) {
      for (const p of R.pil) (box(p[0], p[1], "#5a5068", 2), box(p[0], p[1], "#7a7088", 8));
      for (const q of R.torch) {
        box(q.x, q.y, "#5a3a22", 8);
        box(q.x, q.y, q.lit ? "#ffb04a" : "#2a1a10", 12);
        if (q.lit) dot(q.x, q.y - 0.25, 6 + Math.sin(t * 12), "#ffb04a");
      }
      if (chState(player.zone).ok) return;
      const S = R.sp;
      dot(S.rx, S.ry, 11 + Math.sin(t * 10) * 1.5, "rgba(255,120,40,.85)");
      dot(S.rx, S.ry, 6, "#ffe08a");
    },
  };

  /* ===================== PÂNTANO ===================== */
  /** Caminho seguro aleatório da esquerda para a direita (conjunto + ordem). */
  const walkPath = () => {
    const set = new Set(),
      ord = [];
    const add = (x, y) => (set.has(key(x, y)) || ord.push([x, y]), set.add(key(x, y)));
    let y = 5;
    for (let x = 3; x <= 17; x++) {
      add(x, y);
      if (Math.random() < 0.55) {
        const ny = Math.max(1, Math.min(9, y + pick([-2, -1, 1, 2])));
        const s = Math.sign(ny - y);
        while (y !== ny) (y += s), add(x, y);
      }
    }
    set.ord = ord;
    return set;
  };
  M.lens = {
    n: "Lanterna da Verdade",
    sub: "O chão firme só aparece para quem tem luz.",
    hint: "A lama engole quem pisa fora do caminho. A sua lanterna mostra as pedras firmes bem pertinho de você. Vá devagar e olhe antes de pisar.",
    setup: (R) => Object.assign(R, { safe: walkPath(), r: Math.max(1.6, 2.3 - 0.15 * tier()) }),
    tick(R, dt, id) {
      if (inRoom(player.x, player.y) && !R.safe.has(key(player.x, player.y))) knockBack("A lama te puxou para baixo! De volta ao começo.");
      reach(id, "Você pisa na margem firme. A lanterna treme, aliviada.");
    },
    draw(R) {
      for (let x = 3; x <= 17; x++)
        for (let y = 1; y <= 9; y++) {
          box(x, y, "#2a3a22", 0);
          const d = Math.hypot(x - player.rx, y - player.ry);
          if (d <= R.r && R.safe.has(key(x, y))) (box(x, y, "#6a6a52", 3), box(x, y, "#8a8a6a", 9));
        }
      ctx.save();
      ctx.fillStyle = "rgba(10,14,8,.8)";
      ctx.beginPath();
      ctx.rect(3 * T, T, 15 * T, 9 * T);
      ctx.arc(player.rx * T + 16, player.ry * T + 16, R.r * T, 0, Math.PI * 2, true);
      ctx.fill("evenodd");
      ctx.restore();
    },
  };

  M.gas = {
    n: "Gás do Pântano",
    sub: "Respire fundo. Lá dentro, não dá.",
    hint: "O gás verde tira o seu fôlego. Ache as bolhas de ar (azuis) para respirar de novo antes que a barra acabe. Os troncos fecham o caminho: procure as passagens.",
    setup(R) {
      R.walls = [6, 10, 14].map((x) => ({ x, gap: rnd(1, 9) }));
      R.bub = [[4, rnd(1, 9)], [8, rnd(1, 9)], [12, rnd(1, 9)], [16, rnd(1, 9)]];
      R.max = Math.max(3.5, 6.5 - 0.5 * tier());
      R.air = R.max;
    },
    walk(R, x, y) {
      const w = R.walls.find((q) => q.x === x);
      if (w && w.gap !== y) return false;
    },
    tick(R, dt, id) {
      if (!inRoom(player.x, player.y)) return (R.air = R.max), reach(id, "Você sai do gás e respira fundo. Nunca o ar foi tão gostoso.");
      if (R.bub.some((b) => b[0] === player.x && b[1] === player.y)) R.air = Math.min(R.max, R.air + dt * 4);
      else R.air -= dt;
      if (R.air <= 0) (R.air = R.max), knockBack("Você ficou sem ar! De volta à entrada.");
    },
    draw(R, t) {
      for (const w of R.walls) for (let y = 1; y <= 9; y++) if (y !== w.gap) (box(w.x, y, "#4a3a22", 1), box(w.x, y, "#5a4a2a", 8));
      for (const b of R.bub) dot(b[0], b[1], 8 + Math.sin(t * 5 + b[1]) * 2, "rgba(140,200,255,.7)");
      ctx.fillStyle = `rgba(120,200,80,${0.16 + 0.04 * Math.sin(t * 2)})`;
      ctx.fillRect(3 * T, T, 15 * T, 9 * T);
      if (inRoom(player.x, player.y)) {
        ctx.fillStyle = "#1a1028";
        ctx.fillRect(player.rx * T, player.ry * T - 10, 32, 5);
        ctx.fillStyle = R.air / R.max > 0.35 ? "#8ad0ff" : "#e05050";
        ctx.fillRect(player.rx * T + 1, player.ry * T - 9, 30 * (R.air / R.max), 3);
      }
    },
  };

  M.lilies = {
    n: "Vitórias-régias",
    sub: "Elas aguentam o seu peso. Por pouco tempo.",
    hint: "Atravesse pulando de folha em folha. Se ficar parado numa folha, ela afunda. Não pare!",
    setup(R) {
      R.pads = new Map();
      let y = 5;
      for (let x = 3; x <= 17; x++) {
        R.pads.set(key(x, y), { s: 0, down: 0 });
        if (Math.random() < 0.5) {
          const ny = Math.max(1, Math.min(9, y + pick([-1, 1])));
          R.pads.set(key(x, ny), { s: 0, down: 0 });
          y = ny;
        }
        for (let k = 0; k < 2; k++) R.pads.set(key(x, rnd(1, 9)), { s: 0, down: 0 });
      }
      R.hold = Math.max(0.7, 1.3 - 0.1 * tier());
    },
    walk(R, x, y) {
      if (!inRoom(x, y)) return;
      const p = R.pads.get(key(x, y));
      if (!p || p.down > 0) return false;
    },
    tick(R, dt, id) {
      for (const [k, p] of R.pads) {
        const on = k === key(player.x, player.y);
        if (p.down > 0) p.down -= dt;
        else if (on) {
          p.s += dt;
          if (p.s > R.hold) (p.down = 2.5), (p.s = 0), knockBack("A folha afundou com você! Splash.");
        } else p.s = Math.max(0, p.s - dt);
      }
      reach(id, "Você pula da última folha para a margem. As rãs coaxam em aplauso.");
    },
    draw(R, t) {
      for (let x = 3; x <= 17; x++) for (let y = 1; y <= 9; y++) box(x, y, (x + y) % 2 ? "#1a3a3a" : "#1a3440");
      for (const [k, p] of R.pads) {
        if (p.down > 0) continue;
        const [x, y] = k.split(",").map(Number);
        const sink = p.s / R.hold;
        ctx.fillStyle = sink > 0.6 ? "#4a7a2a" : "#5aa83a";
        ctx.beginPath();
        ctx.arc(x * T + 16, y * T + 16 + sink * 4, 13 - sink * 4, 0.3, Math.PI * 2);
        ctx.lineTo(x * T + 16, y * T + 16);
        ctx.fill();
      }
    },
  };

  /* ===================== PICOS ===================== */
  M.ice = {
    n: "Lago Congelado",
    sub: "No gelo, quem decide onde parar é a pedra.",
    hint: "Você escorrega no gelo e só para quando bate numa pedra ou na beira. Chegue até a saída (a pedra azul no meio da parede da direita). Pense antes de deslizar!",
    setup(R) {
      for (let tries = 0; tries < 400; tries++) {
        const rocks = new Set();
        const n = 10 + tier() * 2;
        while (rocks.size < n) rocks.add(key(rnd(3, 17), rnd(1, 9)));
        rocks.delete(key(3, 5));
        R.rocks = rocks;
        const d = this.solve(R);
        if (d >= 4 + Math.floor(tier() / 2)) return;
      }
    },
    free(R, x, y) {
      if (x < 2 || x > 18 || y < 1 || y > 9) return false;
      if (x === 18 && y !== 5) return false;
      return !R.rocks.has(key(x, y));
    },
    slide(R, x, y, dx, dy) {
      let nx = x,
        ny = y;
      while (this.free(R, nx + dx, ny + dy)) {
        nx += dx;
        ny += dy;
        if (nx === 2 || nx === 18) break;
      }
      return [nx, ny];
    },
    solve(R) {
      const seen = new Map([[key(2, 5), 0]]);
      const q = [[2, 5]];
      while (q.length) {
        const [x, y] = q.shift();
        const d = seen.get(key(x, y));
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          let [nx, ny] = x === 2 ? [x + dx, y + dy] : [x, y];
          if (x === 2) {
            if (!this.free(R, nx, ny)) continue;
            if (nx !== 2) [nx, ny] = this.slide(R, nx, ny, dx, dy);
          } else [nx, ny] = this.slide(R, x, y, dx, dy);
          if (nx === 18 && ny === 5) return d + 1;
          if (!seen.has(key(nx, ny))) seen.set(key(nx, ny), d + 1), q.push([nx, ny]);
        }
      }
      return -1;
    },
    walk(R, x, y) {
      if (x === 18 && y !== 5) return false;
      if (R.rocks.has(key(x, y))) return false;
      if (R.sl && player.zone && !(x === player.x + R.sl[0] && y === player.y + R.sl[1])) return false;
    },
    tick(R, dt, id) {
      const onIce = (x) => x >= 3 && x <= 17;
      if (R.lx != null && (player.x !== R.lx || player.y !== R.ly)) {
        const dx = Math.sign(player.x - R.lx),
          dy = Math.sign(player.y - R.ly);
        R.sl = onIce(player.x) ? [dx, dy] : null;
      }
      R.lx = player.x;
      R.ly = player.y;
      if (R.sl && Math.abs(player.rx - player.x) < 0.2 && Math.abs(player.ry - player.y) < 0.2) {
        const nx = player.x + R.sl[0],
          ny = player.y + R.sl[1];
        if (this.free(R, nx, ny)) ((player.x = nx), (player.y = ny), (R.lx = nx), (R.ly = ny), !onIce(nx) && (R.sl = null));
        else R.sl = null;
      }
      if (player.x === 18 && player.y === 5) chSolved(id, "Você desliza direto para a saída. O Grifo, lá no fundo, deu uma risadinha.");
    },
    draw(R, t) {
      for (let x = 3; x <= 17; x++) for (let y = 1; y <= 9; y++) box(x, y, (x + y) % 2 ? "#bfe0f0" : "#cfeaf8");
      for (let y = 1; y <= 9; y++) if (y !== 5) box(18, y, "#5a6a7a", 2);
      box(18, 5, "#5fa0ff", 6);
      for (const k of R.rocks) {
        const [x, y] = k.split(",").map(Number);
        box(x, y, "#6a7a8a", 3);
        box(x, y, "#8a9aaa", 9);
      }
    },
  };

  M.winds = {
    n: "Correntes de Vento",
    sub: "O vento empurra. O abismo espera.",
    hint: "Faixas de vento empurram para cima ou para baixo, na direção das setas. Se o vento te levar até a beirada, você cai. Atravesse rápido e use as pedras do meio para se segurar.",
    setup(R) {
      R.bands = [[4, 6], [9, 11], [14, 16]].map(([a, b], i) => ({ a, b, d: i % 2 ? 1 : -1 }));
      R.step = Math.max(0.2, 0.32 - 0.02 * tier());
      R.acc = 0;
    },
    band: (R, x) => R.bands.find((b) => x >= b.a && x <= b.b),
    tick(R, dt, id) {
      const b = this.band(R, player.x);
      if (b) {
        R.acc += dt;
        if (R.acc >= R.step) {
          R.acc = 0;
          player.y += b.d;
          if (player.y <= 1 || player.y >= 9) return (R.acc = 0), knockBack("O vento te jogou no abismo! Ainda bem que o Grifo te devolveu.");
        }
      } else R.acc = 0;
      reach(id, "Você sai da última corrente de vento. Os cabelos nunca mais vão ficar no lugar.");
    },
    draw(R, t) {
      for (const b of R.bands)
        for (let x = b.a; x <= b.b; x++)
          for (let y = 1; y <= 9; y++) {
            if (y === 1 || y === 9) {
              box(x, y, "#0a0a14");
              continue;
            }
            box(x, y, "rgba(200,230,255,.12)");
            const off = ((t * 40 * -b.d) % T + T) % T;
            ctx.fillStyle = "rgba(220,240,255,.5)";
            ctx.fillRect(x * T + 14, y * T + off, 3, 6);
          }
    },
  };

  M.crumble = {
    n: "Chão que Desmorona",
    sub: "Cada pedra aguenta um passo. Só um.",
    hint: "As pedras desmoronam depois que você sai delas. Pise em TODAS, uma vez cada, e termine perto da saída. Se pisar num buraco, cai e as pedras voltam.",
    setup(R) {
      const nx = Math.min(8, 4 + tier()),
        ny = tier() >= 3 ? 5 : 3;
      R.x0 = 10 - Math.floor(nx / 2);
      R.y0 = 5 - Math.floor(ny / 2);
      R.nx = nx;
      R.ny = ny;
      R.x1 = R.x0 + nx - 1;
      R.y1 = R.y0 + ny - 1;
      R.cells = new Map();
      this.reset(R);
    },
    reset(R) {
      for (let x = R.x0; x <= R.x1; x++) for (let y = R.y0; y <= R.y1; y++) R.cells.set(key(x, y), 0);
      R.prev = null;
    },
    corridor(R, x, y) {
      return (y === R.y0 && x >= 3 && x < R.x0) || (y === R.y1 && x > R.x1 && x <= 17);
    },
    all: (R) => [...R.cells.values()].every((v) => v > 0),
    walk(R, x, y) {
      if (!inRoom(x, y)) return;
      if (R.cells.has(key(x, y)) || this.corridor(R, x, y)) {
        if (y === R.y1 && x === R.x1 + 1 && !this.all(R)) return false;
        return;
      }
      return false;
    },
    tick(R, dt, id) {
      const k = key(player.x, player.y);
      if (R.prev && R.prev !== k && R.cells.get(R.prev) === 1) R.cells.set(R.prev, 2);
      if (R.cells.has(k)) {
        if (R.cells.get(k) === 2) return this.reset(R), knockBack("O chão sumiu embaixo de você! As pedras voltam para o lugar.");
        if (R.cells.get(k) === 0) R.cells.set(k, 1), playSound(300, 0.04, "triangle");
      }
      R.prev = R.cells.has(k) ? k : null;
      reach(id, "A última pedra desmorona atrás de você. Não tem mais volta, só ida.");
    },
    draw(R) {
      for (let x = 3; x <= 17; x++)
        for (let y = 1; y <= 9; y++) {
          const v = R.cells.get(key(x, y));
          if (v === undefined && !this.corridor(R, x, y)) box(x, y, "#0a0a14");
          else if (v === 2) box(x, y, "#0a0a14", 2);
          else if (v !== undefined) (box(x, y, "#7a6a5a", 2), v === 1 && box(x, y, "#a89a8a", 8), v === 0 && (ctx.fillStyle = "#5a4a3a", ctx.fillRect(x * T + 8, y * T + 14, 16, 2)));
        }
      if (!this.all(R)) box(R.x1 + 1, R.y1, "rgba(80,60,120,.6)", 4);
    },
  };

  /* ===================== MINA ===================== */
  M.rails = {
    n: "Trilhos da Mina",
    sub: "Um carrinho, três agulhas e uma parede no caminho.",
    hint: "Ajuste as agulhas dos trilhos (alavancas embaixo de cada bifurcação) para que o carrinho não caia num trilho quebrado. Depois empurre o carrinho: ele arrebenta a parede do fim.",
    setup(R) {
      R.jx = tier() >= 3 ? [5, 9, 13] : [6, 11];
      R.good = R.jx.map(() => pick(["reto", "desvio"]));
      R.alt = R.jx.map(() => pick([3, 7]));
      R.sw = R.jx.map(() => "reto");
      R.cart = { x: 3, y: 5, run: null };
      R.wall = true;
    },
    lever: (R, i) => [R.jx[i], 9],
    target(R, x, y) {
      if (!R.cart.run && x === R.cart.x && y === R.cart.y) return "Empurrar o carrinho";
      const i = R.jx.findIndex((_, k) => key(...this.lever(R, k)) === key(x, y));
      if (i >= 0) return `Agulha ${i + 1}: ${R.sw[i] === "reto" ? "reto" : "desvio"} (trocar)`;
      if (R.wall && x === 18 && y === 5) return "Parede de rocha";
    },
    route(R) {
      const path = [];
      let x = 3;
      while (x < 18) {
        const i = R.jx.indexOf(x);
        if (i >= 0) {
          const ok = R.sw[i] === R.good[i];
          if (R.sw[i] === "reto") {
            path.push([x, 5]);
            if (!ok) return path.push([x + 1, 5]), { path, crash: true };
            x++;
          } else {
            const yy = R.alt[i],
              dy = Math.sign(yy - 5);
            for (let y = 5; y !== yy; y += dy) path.push([x, y]);
            for (let k = 0; k <= 3; k++) path.push([x + k, yy]);
            if (!ok) return { path, crash: true };
            for (let y = yy; y !== 5; y -= dy) path.push([x + 3, y]);
            x += 4;
          }
        } else path.push([x, 5]), x++;
      }
      path.push([18, 5]);
      return { path, crash: false };
    },
    act(R, l, x, y) {
      if (l === "Empurrar o carrinho") {
        const r = this.route(R);
        R.cart.run = { path: r.path, crash: r.crash, i: 0, acc: 0 };
        playSound(150, 0.3, "sawtooth");
        return;
      }
      if (l.startsWith("Agulha")) {
        const i = R.jx.findIndex((_, k) => key(...this.lever(R, k)) === key(x, y));
        R.sw[i] = R.sw[i] === "reto" ? "desvio" : "reto";
        playSound(400, 0.08, "square");
      }
    },
    walk(R, x, y) {
      if (R.wall && x === 18 && y === 5) return false;
    },
    tick(R, dt, id) {
      const run = R.cart.run;
      if (!run) return;
      run.acc += dt * 7;
      while (run.acc >= 1) {
        run.acc--;
        run.i++;
        if (run.i >= run.path.length) {
          if (run.crash) {
            game.shake = 0.3;
            playSound(90, 0.4, "sawtooth");
            toast("O carrinho caiu no trilho quebrado! Ajuste as agulhas.", 2200);
          } else {
            R.wall = false;
            game.shake = 0.4;
            chSolved(id, "O carrinho arrebenta a parede de rocha. Poeira de cristal para todo lado!");
          }
          R.cart = { x: 3, y: 5, run: null };
          return;
        }
        [R.cart.x, R.cart.y] = run.path[run.i];
      }
    },
    draw(R, t) {
      const rail = (x, y, broken) => {
        ctx.fillStyle = broken ? "#6a3a2a" : "#8a6a3a";
        ctx.fillRect(x * T, y * T + 10, T, 3);
        ctx.fillRect(x * T, y * T + 20, T, 3);
        ctx.fillStyle = "#5a3a22";
        for (let k = 0; k < 3; k++) ctx.fillRect(x * T + 3 + k * 10, y * T + 8, 4, 17);
        if (broken) (ctx.fillStyle = "#e05050"), ctx.fillRect(x * T + 10, y * T + 6, 12, 20);
      };
      let x = 3;
      for (x = 3; x < 18; x++) {
        const i = R.jx.indexOf(x);
        rail(x, 5, i < 0 && R.jx.some((j, k) => x === j + 1 && R.good[k] === "desvio"));
        if (i >= 0) {
          const yy = R.alt[i],
            dy = Math.sign(yy - 5);
          for (let y = 5 + dy; y !== yy; y += dy) rail(x, y);
          for (let k = 0; k <= 3; k++) rail(x + k, yy, R.good[i] === "reto" && k === 3);
          if (R.good[i] === "desvio") for (let y = yy - dy; y !== 5; y -= dy) rail(x + 3, y);
          const [lx, ly] = this.lever(R, i);
          box(lx, ly, "#3a2a1a", 6);
          ctx.fillStyle = "#c9a050";
          ctx.fillRect(lx * T + 14, ly * T + 4, 4, 18);
          ctx.fillStyle = R.sw[i] === "reto" ? "#7ad36b" : "#f2c14e";
          ctx.fillRect(lx * T + (R.sw[i] === "reto" ? 8 : 18), ly * T + 4, 8, 8);
        }
      }
      if (R.wall) (box(18, 5, "#5a4a3a", 1), box(18, 5, "#7a6a5a", 7));
      box(R.cart.x, R.cart.y, "#4a4a52", 4);
      box(R.cart.x, R.cart.y, "#c9c9d0", 9);
    },
  };

  M.gaze = {
    n: "Olhar do Basilisco",
    sub: "Quem cruza o olhar dele vira estátua.",
    hint: "A estátua do Basilisco varre a sala com o olhar, de um lado para o outro. Fique escondido atrás (embaixo) das colunas quando a luz verde passar.",
    setup(R) {
      R.pil = new Set();
      while (R.pil.size < 11) R.pil.add(key(rnd(4, 16), rnd(3, 7)));
      R.head = [10, 1];
      R.speed = 3 + tier() * 0.6;
      R.gx = 3;
      R.dir = 1;
    },
    walk(R, x, y) {
      if (R.pil.has(key(x, y)) || (x === R.head[0] && y === R.head[1])) return false;
    },
    hidden(R, x, y) {
      for (let yy = 1; yy < y; yy++) if (R.pil.has(key(x, yy))) return true;
      return false;
    },
    tick(R, dt, id) {
      R.gx += R.dir * R.speed * dt;
      if (R.gx > 17.4) (R.gx = 17.4), (R.dir = -1);
      if (R.gx < 2.6) (R.gx = 2.6), (R.dir = 1);
      const col = Math.round(R.gx);
      if (inRoom(player.x, player.y) && player.x === col && !this.hidden(R, player.x, player.y)) knockBack("O olhar do Basilisco te pegou! Você vira pedra por um instante... e acorda na entrada.");
      reach(id, "Você sai do alcance do olhar. Atrás de você, a estátua fecha os olhos, frustrada.");
    },
    draw(R, t) {
      const col = Math.round(R.gx);
      for (let y = 1; y <= 9; y++) {
        let blocked = false;
        for (let yy = 1; yy < y; yy++) if (R.pil.has(key(col, yy))) blocked = true;
        if (!blocked && !R.pil.has(key(col, y))) box(col, y, "rgba(120,255,120,.28)");
      }
      for (const k of R.pil) {
        const [x, y] = k.split(",").map(Number);
        box(x, y, "#5a5a62", 2);
        box(x, y, "#7a7a82", 9);
      }
      box(R.head[0], R.head[1], "#4a6a3a", 2);
      dot(R.head[0] - 0.15, R.head[1], 3, "#e8ff8a");
      dot(R.head[0] + 0.15, R.head[1], 3, "#e8ff8a");
    },
  };

  M.dynamite = {
    n: "Dinamite",
    sub: "Três paredes. Uma caixa de dinamite. Coragem opcional.",
    hint: "Pegue uma dinamite na caixa perto da entrada e coloque na rocha rachada de cada parede. Depois corra para longe: a explosão machuca quem estiver a até 2 passos.",
    setup(R) {
      R.walls = [7, 11, 15].map((x) => ({ x, crack: rnd(1, 9), open: false }));
      R.crate = [3, 2];
      R.carry = false;
      R.fuse = null;
    },
    walk(R, x, y) {
      const w = R.walls.find((q) => q.x === x);
      if (w && !(w.open && y === w.crack)) return false;
    },
    target(R, x, y) {
      if (x === R.crate[0] && y === R.crate[1]) return "Pegar dinamite";
      const w = R.walls.find((q) => q.x === x && q.crack === y && !q.open);
      if (w) return R.fuse ? "Pavio aceso!" : "Rocha rachada";
    },
    act(R, l, x, y) {
      if (l === "Pegar dinamite") return R.carry ? toast("Uma de cada vez, por favor.", 1200) : ((R.carry = true), toast("Dinamite na mão. Cuidado!", 1400));
      if (l === "Rocha rachada") {
        if (!R.carry) return toast("Precisa de dinamite. A caixa fica perto da entrada.", 1600);
        R.carry = false;
        R.fuse = { x, y, t: 3 };
        playSound(1400, 0.1, "square");
        toast("Pavio aceso! CORRA!", 1400);
      }
    },
    tick(R, dt, id) {
      if (R.fuse && (R.fuse.t -= dt) <= 0) {
        const f = R.fuse;
        R.fuse = null;
        const w = R.walls.find((q) => q.x === f.x);
        w.open = true;
        game.shake = 0.5;
        playSound(60, 0.6, "sawtooth");
        if (Math.abs(player.x - f.x) + Math.abs(player.y - f.y) <= 2) (hurt(0.08), toast("BUM! Você estava perto demais.", 2000));
        else toast("BUM! A rocha voou em pedacinhos.", 1600);
      }
      reach(id, "Você passa pela última parede aberta. Os ouvidos ainda zumbem.");
    },
    draw(R, t) {
      for (const w of R.walls)
        for (let y = 1; y <= 9; y++) {
          if (w.open && y === w.crack) continue;
          box(w.x, y, "#4a3a2a", 1);
          box(w.x, y, "#6a5a4a", 7);
          if (y === w.crack) (ctx.strokeStyle = "#1a1010", (ctx.lineWidth = 2), ctx.beginPath(), ctx.moveTo(w.x * T + 8, y * T + 6), ctx.lineTo(w.x * T + 16, y * T + 16), ctx.lineTo(w.x * T + 10, y * T + 26), ctx.stroke());
        }
      box(R.crate[0], R.crate[1], "#8a5a2e", 4);
      ctx.fillStyle = "#c94a4a";
      ctx.fillRect(R.crate[0] * T + 10, R.crate[1] * T + 8, 4, 14);
      ctx.fillRect(R.crate[0] * T + 18, R.crate[1] * T + 8, 4, 14);
      if (R.fuse) (dot(R.fuse.x - 0.5, R.fuse.y, 4, "#c94a4a"), Math.sin(t * 30) > 0 && dot(R.fuse.x - 0.5, R.fuse.y - 0.3, 3, "#ffe08a"));
      if (R.carry) ((ctx.fillStyle = "#c94a4a"), ctx.fillRect(player.rx * T + 22, player.ry * T + 6, 4, 12));
    },
  };

  /* ===================== PORTO ===================== */
  M.water = {
    n: "Comportas",
    sub: "Quando a água sobe, uns caminhos fecham e outros abrem.",
    hint: "Os túneis baixos só passam com a água BAIXA. As tábuas sobre o poço só boiam com a água ALTA. Puxe as alavancas das comportas na hora certa. A água alta não dura para sempre!",
    setup: (R) => Object.assign(R, { high: false, t: 0, dur: Math.max(4, 7 - 0.6 * tier()), levers: [[8, 3], [13, 3]] }),
    zone(x, y) {
      if ((x >= 3 && x <= 7) || (x >= 14 && x <= 17)) return y === 5 ? "tunel" : "rocha";
      if (x === 8 || x === 13) return y >= 3 && y <= 7 ? "plat" : "rocha";
      if (x >= 9 && x <= 12) return y >= 4 && y <= 6 ? "poco" : "rocha";
    },
    walk(R, x, y) {
      const z = this.zone(x, y);
      if (z === "rocha") return false;
      if (z === "poco" && !R.high) return false;
    },
    target(R, x, y) {
      if (R.levers.some((l) => l[0] === x && l[1] === y)) return R.high ? "Comporta: baixar a água" : "Comporta: subir a água";
    },
    act(R, l) {
      R.high = !R.high;
      R.t = 0;
      playSound(R.high ? 300 : 200, 0.4, "triangle");
      toast(R.high ? "A água sobe! As tábuas boiam." : "A água desce. Os túneis abrem.", 1600);
      this.check(R);
    },
    check(R) {
      const z = this.zone(player.x, player.y);
      if (R.high && z === "tunel") knockBack("A água encheu o túnel com você dentro!");
      if (!R.high && z === "poco") knockBack("As tábuas afundaram! Você caiu no poço.");
    },
    tick(R, dt, id) {
      if (R.high && (R.t += dt) > R.dur) {
        R.high = false;
        R.t = 0;
        toast("A comporta cede: a água desce.", 1400);
        this.check(R);
      }
      reach(id, "Você sai do último túnel, molhado até a alma. A comporta range atrás de você.");
    },
    draw(R, t) {
      for (let x = 3; x <= 17; x++)
        for (let y = 1; y <= 9; y++) {
          const z = this.zone(x, y);
          if (z === "rocha") box(x, y, "#2a2a32");
          else if (z === "tunel") box(x, y, R.high ? "#2a5a8a" : "#4a4a52", 1);
          else if (z === "plat") box(x, y, "#5a4a3a", 1);
          else if (z === "poco") (box(x, y, R.high ? "#2a5a8a" : "#0a0a14"), R.high && box(x, y, "#8a6a3a", 9));
        }
      for (const [x, y] of R.levers) (box(x, y, "#3a2a1a", 6), (ctx.fillStyle = R.high ? "#5fa0ff" : "#c9a050"), ctx.fillRect(x * T + 14, y * T + (R.high ? 4 : 12), 4, 14));
      if (R.high) ((ctx.fillStyle = "#5fa0ff"), ctx.fillRect(9 * T, 3 * T + 4, 4 * T * (1 - R.t / R.dur), 4));
    },
  };

  M.tentacles = {
    n: "Tentáculos",
    sub: "Primeiro vem a sombra. Depois, a pancada.",
    hint: "Os tentáculos do Leviatã batem em faixas da sala. A sombra escura avisa onde vai bater: saia dela antes da pancada!",
    setup: (R) => Object.assign(R, { hits: [], acc: 0, every: Math.max(0.55, 0.95 - 0.07 * tier()) }),
    tick(R, dt, id) {
      R.acc += dt;
      if (R.acc >= R.every && player.x >= 3) {
        R.acc = 0;
        const x = rnd(3, 16);
        R.hits.push({ x, w: 2, t: 0 });
      }
      for (const h of R.hits) {
        h.t += dt;
        if (h.t >= 0.9 && !h.done) {
          h.done = true;
          playSound(80, 0.2, "sawtooth");
          if (player.x >= h.x && player.x < h.x + h.w) knockBack("PLAFT! O tentáculo te jogou de volta.");
        }
      }
      R.hits = R.hits.filter((h) => h.t < 1.3);
      reach(id, "Você escapa da última pancada. O Leviatã urra de raiva lá no fundo.");
    },
    draw(R, t) {
      for (let x = 3; x <= 17; x++) for (let y = 1; y <= 9; y++) box(x, y, "#2a3a4a", 1);
      for (const h of R.hits)
        for (let x = h.x; x < h.x + h.w; x++)
          for (let y = 1; y <= 9; y++) {
            if (h.t < 0.9) box(x, y, `rgba(0,0,0,${0.2 + h.t * 0.5})`);
            else (box(x, y, "#5a3a6a", 2), box(x, y, "#8a5a9a", 10));
          }
    },
  };

  M.fish = {
    n: "O Cardume de Luz",
    sub: "Um peixinho conhece o caminho. Ele mostra uma vez.",
    hint: "A gruta está cheia de enguias escondidas. Toque na concha (perto da entrada) e um peixe de luz mostra o caminho seguro. Decore e siga! Pode chamar o peixe quantas vezes quiser.",
    setup: (R) => {
      const s = walkPath();
      const ord = s.ord;
      Object.assign(R, { safe: s, ord, shell: [2, 3], fish: null, trail: [] });
    },
    target(R, x, y) {
      if (x === R.shell[0] && y === R.shell[1]) return "Chamar o peixe de luz";
    },
    act(R) {
      R.fish = { i: 0, acc: 0 };
      playSound(880, 0.2, "sine");
    },
    tick(R, dt, id) {
      if (R.fish) {
        R.fish.acc += dt * 5;
        while (R.fish.acc >= 1) {
          R.fish.acc--;
          R.fish.i++;
          if (R.fish.i < R.ord.length) R.trail.push({ p: R.ord[R.fish.i], t: 1.6 });
        }
        if (R.fish.i >= R.ord.length) R.fish = null;
      }
      for (const q of R.trail) q.t -= dt;
      R.trail = R.trail.filter((q) => q.t > 0);
      if (inRoom(player.x, player.y) && !R.safe.has(key(player.x, player.y))) knockBack("Uma enguia te mordeu! De volta à entrada.");
      reach(id, "Você sai da gruta das enguias. O peixinho de luz dá uma volta em você e some.");
    },
    draw(R, t) {
      for (let x = 3; x <= 17; x++) for (let y = 1; y <= 9; y++) box(x, y, (x * 7 + y * 3) % 5 ? "#0e1a2a" : "#122236");
      for (const q of R.trail) ((ctx.fillStyle = `rgba(140,230,255,${q.t / 1.6 * 0.6})`), ctx.fillRect(q.p[0] * T + 8, q.p[1] * T + 8, 16, 16));
      if (R.fish) {
        const p = R.ord[Math.min(R.fish.i, R.ord.length - 1)];
        dot(p[0], p[1], 7, "#bff0ff");
      }
      box(R.shell[0], R.shell[1], "#e8c8b0", 7);
    },
  };

  /* ===================== QUAL COVIL TEM O QUÊ ===================== */
  const NEW_ORDER = {
    bosque: ["vines", "roots", "stones", "arena"],
    farol: ["jets", "mirrors", "spirit", "arena"],
    pantano: ["lens", "gas", "lilies", "arena"],
    picos: ["ice", "winds", "crumble", "arena"],
    mina: ["rails", "gaze", "dynamite", "arena"],
    porto: ["water", "tentacles", "fish", "arena"],
  };
  for (const [k, I] of Object.entries(M)) CH_INFO[k] = { n: I.n, sub: I.sub, hint: I.hint };
  for (const L of Object.values(LAIRS)) {
    const ord = NEW_ORDER[L.region];
    if (!ord) continue;
    CH_ORDER[L.region] = ord;
    ord.forEach((mech, i) => genChamber(L, i + 2, mech));
  }

  /* ===================== LIGAÇÕES ===================== */
  game.ch2 = {};
  const run = (id) => {
    const C = CHAMBER[id];
    const mech = C && M[C.mech];
    if (!mech) return null;
    let R = game.ch2[id];
    if (!R) R = game.ch2[id] = {};
    return { C, mech, R };
  };
  const crBase = chReset;
  chReset = function (id) {
    crBase.apply(this, arguments);
    const C = CHAMBER[id];
    if (!C || !M[C.mech]) return;
    const S = chState(id);
    if (S.mech !== C.mech) (S.mech = C.mech), (S.seen = S.ok ? S.seen : false);
    game.ch2[id] = {};
    M[C.mech].setup(game.ch2[id]);
  };
  // quem já tinha visto a câmara antiga vê a apresentação da nova
  const gcBase = goChamber;
  goChamber = function (id) {
    const C = CHAMBER[id];
    if (C && M[C.mech]) {
      const S = chState(id);
      if (S.mech !== C.mech && !S.ok) (S.seen = false), (S.mech = C.mech);
    }
    return gcBase.apply(this, arguments);
  };
  const ctBase = chTarget;
  chTarget = function (x, y) {
    const base = ctBase(x, y);
    if (base) return base;
    const r = run(player.zone);
    if (!r || chState(player.zone).ok || !r.mech.target) return null;
    return r.mech.target(r.R, x, y) || null;
  };
  const ciBase = chInteract;
  chInteract = function (x, y) {
    const r = run(player.zone);
    if (r && !chState(player.zone).ok && r.mech.target) {
      const l = r.mech.target(r.R, x, y);
      if (l) return r.mech.act && r.mech.act(r.R, l, x, y), true;
    }
    return ciBase(x, y);
  };
  const wkBase = walkable;
  walkable = function (z, x, y) {
    if (CHAMBER[z] && z === player.zone && story()) {
      const r = run(z);
      if (r && !chState(z).ok && r.mech.walk && r.R.setupDone !== false && Object.keys(r.R).length && r.mech.walk(r.R, x, y) === false) return false;
    }
    return wkBase(z, x, y);
  };
  const upBase = update;
  update = function (dt) {
    upBase(dt);
    if (!player || !story() || game.mode !== "world" || game.dialog) return;
    const id = player.zone;
    const r = run(id);
    if (!r || chState(id).ok || !Object.keys(r.R).length) return;
    try {
      r.mech.tick && r.mech.tick(r.R, Math.min(dt, 0.05), id);
    } catch (e) {
      console.error(e);
    }
  };
  const cdBase = crewDrawList;
  crewDrawList = function (list, t) {
    cdBase(list, t);
    const r = story() && run(player.zone);
    if (!r || !Object.keys(r.R).length) return;
    if (chState(player.zone).ok && !["stones", "mirrors", "rails"].includes(r.C.mech)) return;
    list.push({ y: -4, draw: () => r.mech.draw(r.R, t) });
  };
  window.CH_MECHS = M;
})();

/* ===================== DICAS DOS DESAFIOS =====================
 * Em toda câmara nova há uma Pedra das Dicas perto da entrada. Ela repete a
 * explicação e dá uma dica extra. Depois de 3 tropeços na mesma câmara, a
 * própria sala sopra a dica mais forte.
 */
(() => {
  const TIPS = {
    vines: ["Encha o regador e vá direto para a semente mais próxima, sem desvio.", "A semente de cada abismo fica do lado de cá dele, um pouco acima ou abaixo da ponte."],
    roots: ["As colunas livres (entre as raízes) são seguras: espere nelas.", "Olhe as raízes que piscam: é onde elas vão nascer. Fique fora delas."],
    stones: ["Empurre olhando para a pedra: ela vai para o lado oposto de onde você está.", "Nunca empurre uma pedra para um canto: de lá ela não sai. Se travou, use a alavanca."],
    jets: ["O fogo anda da esquerda para a direita, como uma onda. Entre logo atrás dela.", "Cada coluna pisca antes de queimar: se piscou, espere."],
    mirrors: ["Siga o raio com os olhos: onde ele bate num espelho, ele vira.", "O caminho usa quatro espelhos. Três estão lá só para confundir."],
    spirit: ["O espírito sempre vem na sua direção. Passe pertinho de uma tocha e deixe ele te seguir.", "Dê a volta numa coluna para ganhar tempo: ele não atravessa pedra."],
    lens: ["Ande um passo de cada vez e só pise onde aparece pedra.", "O caminho firme sempre vai para a direita: ele sobe ou desce, mas nunca volta."],
    gas: ["Respire nas bolhas azuis até a barra encher antes de seguir.", "Cada tronco tem só um buraco: ache o buraco antes de sair da bolha."],
    lilies: ["Não pare: ande de folha em folha sem soltar a direção.", "Folha afundando fica mais escura e menor. Pule antes!"],
    ice: ["Você só para quando bate numa pedra ou na beira. Use as pedras como freio.", "A saída fica no meio da parede da direita: você precisa chegar deslizando pela fileira do meio."],
    winds: ["Atravesse cada faixa de vento de uma vez, sem parar no meio.", "Se o vento te empurrar para perto da beira, volte para o meio antes de atravessar."],
    crumble: ["Faça zigue-zague: uma fileira inteira para um lado, desce, a próxima para o outro.", "Comece pela pedra de cima à esquerda e termine na de baixo à direita, perto da saída."],
    rails: ["Olhe para onde cada trilho vai: o que termina em vermelho está quebrado.", "Agulha verde = reto, amarela = desvio. Ajuste todas antes de empurrar."],
    gaze: ["Fique logo abaixo de uma coluna: a luz verde não passa por ela.", "Conte o vai e vem do olhar e corra quando ele estiver indo para o outro lado."],
    dynamite: ["Depois de acender o pavio, afaste-se pelo menos 3 passos.", "Uma dinamite por vez: depois de cada explosão, volte à caixa."],
    water: ["Água baixa: atravesse o túnel. Água alta: atravesse as tábuas do poço.", "A água alta dura pouco: suba a água só quando estiver do lado do poço."],
    tentacles: ["Quando a sombra aparecer em cima de você, ande para o lado, não para a frente.", "Avance logo depois de uma pancada: o lugar onde acabou de bater fica livre um instante."],
    fish: ["Chame o peixe e ande junto com ele, logo atrás.", "Repare onde o peixe sobe ou desce. O resto do caminho é sempre para a direita."],
  };
  const STONE = [2, 8];
  const fails = {};
  const isNew = () => {
    const C = chamberOf(player.zone);
    return C && window.CH_MECHS[C.mech] && !chState(player.zone).ok ? C : null;
  };
  const tip = (C) => {
    const t = TIPS[C.mech] || [];
    const n = fails[player.zone] || 0;
    return [["Pedra das Dicas", CH_INFO[C.mech].hint], ...t.slice(0, n >= 3 ? 2 : 1).map((s) => ["Pedra das Dicas", "Dica: " + s])];
  };
  const ctBase = chTarget;
  chTarget = function (x, y) {
    if (isNew() && x === STONE[0] && y === STONE[1]) return "Ler a Pedra das Dicas";
    return ctBase(x, y);
  };
  const ciBase = chInteract;
  chInteract = function (x, y) {
    const C = isNew();
    if (C && x === STONE[0] && y === STONE[1]) return say(tip(C)), true;
    return ciBase(x, y);
  };
  const kbBase = knockBack;
  knockBack = function () {
    const r = kbBase.apply(this, arguments);
    const C = isNew();
    if (C) {
      const n = (fails[player.zone] = (fails[player.zone] || 0) + 1);
      if (n === 3) setTimeout(() => say([["", "A sala parece ter pena de você..."], ["Pedra das Dicas", "Dica: " + (TIPS[C.mech] || [""])[1]]]), 600);
    }
    return r;
  };
  const cdBase = crewDrawList;
  crewDrawList = function (list, t) {
    cdBase(list, t);
    if (!story() || !isNew()) return;
    list.push({
      y: STONE[1],
      draw: () => {
        const X = STONE[0] * TILE,
          Y = STONE[1] * TILE;
        ctx.fillStyle = "#6a6a7a";
        ctx.fillRect(X + 6, Y + 6, 20, 24);
        ctx.fillStyle = "#8a8a9a";
        ctx.fillRect(X + 6, Y + 6, 20, 4);
        ctx.fillStyle = `rgba(255,224,138,${0.6 + 0.3 * Math.sin(t * 4)})`;
        ctx.font = "bold 14px monospace";
        ctx.textAlign = "center";
        ctx.fillText("?", X + 16, Y + 24);
      },
    });
  };
})();
