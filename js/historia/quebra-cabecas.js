/**
 * ECOS DO ARCANO — quebra-cabecas.js (modo História)
 * Cinco quebra-cabeças de verdade, jogados com o mouse ou o dedo:
 *  - Mosaico de Vesper (Vila): peças deslizantes 3×3.
 *  - Selo das Runas (Pântano): acenda todas as runas; cada toque vira a runa e as vizinhas.
 *  - Canais do Porto (Porto): gire os canos até a água chegar ao moinho.
 *  - Balança dos Anões (Pedravale): equilibre a pedra misteriosa com os pesos.
 *  - Cofre de Vesper (Bosque): descubra o código de 4 runas em 8 tentativas.
 * Cada um fica num pedestal brilhando no mapa. Aparecem em Missões (Q).
 * Modifica (envolve) funções de outros arquivos: crewDrawList, interactAt,
 * targetAt, townQuestsHTML.
 */

"use strict";

const PZ_RUNES = ["fogo", "agua", "ar", "terra"];
const rnd = (n) => Math.floor(Math.random() * n);
function pzSolved(id) {
  return !!(player.puzzles && player.puzzles[id]);
}

/* ===================== JANELA DO QUEBRA-CABEÇA ===================== */
let PZ = null; // quebra-cabeça aberto agora
function openPuzzle(def) {
  if (game.mode !== "world") return;
  let el = byId("puzzle");
  if (!el) {
    el = document.createElement("div");
    el.id = "puzzle";
    el.className = "box ui ov";
    byId("screen").appendChild(el);
  }
  PZ = { def, state: def.make() };
  game.mode = "puzzle";
  el.style.display = "block";
  renderPuzzle();
  playSound(440, 0.1, "sine");
}
function closePuzzle() {
  const el = byId("puzzle");
  if (el) el.style.display = "none";
  PZ = null;
  game.mode = "world";
}
function renderPuzzle() {
  if (!PZ) return;
  const { def, state } = PZ;
  const el = byId("puzzle");
  el.innerHTML = `<div class="gh"><h2>${def.n}</h2><button id="pzclose">Sair (Esc)</button></div>
    <div class="pz-help">${def.help}</div>
    <div class="pz-body">${def.html(state)}</div>
    <div class="pz-foot">${def.status ? def.status(state) : ""} <button id="pzreset">Recomeçar</button></div>`;
  byId("pzclose").onclick = closePuzzle;
  byId("pzreset").onclick = () => ((PZ.state = def.make()), renderPuzzle());
  el.querySelectorAll("[data-a]").forEach((b) =>
    (b.onclick = () => {
      def.act(state, b.dataset.a);
      playSound(520 + rnd(200), 0.04, "triangle", 0.03);
      if (def.won(state)) return winPuzzle();
      renderPuzzle();
    }),
  );
}
function winPuzzle() {
  const def = PZ.def;
  renderPuzzle();
  player.puzzles = player.puzzles || {};
  const first = !player.puzzles[def.id];
  player.puzzles[def.id] = player.day || 1;
  [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => playSound(f, 0.2, "triangle", 0.05), i * 110));
  setTimeout(() => {
    closePuzzle();
    if (!first) return say([["", "Resolvido de novo! Você já pegou a recompensa daqui."]]);
    const R = def.reward;
    player.gold += R.gold || 0;
    if (R.xp) gainXP(R.xp);
    for (const [it, n] of R.items || []) addItem(it, n);
    saveGame();
    say([["", def.win], ["", `Quebra-cabeça resolvido! +${R.gold || 0} de ouro, +${R.xp || 0} XP${(R.items || []).map(([it, n]) => `, ${n}× ${ITEMS[it] ? ITEMS[it].nome : it}`).join("")}.`]]);
  }, 700);
}
KEY_HANDLERS.puzzle = (k) => k === "escape" && closePuzzle();
BEFORE_DIALOG.add("puzzle");

/* ===================== 1. MOSAICO (peças deslizantes) ===================== */
const MOSAIC_COL = ["#ff7a3d", "#ff9f4d", "#ffc65a", "#9ad06a", "#5ac08a", "#4aa0d0", "#5a7ae0", "#8a6ae0"];
const PZ_MOSAIC = {
  id: "mosaico",
  n: "Mosaico de Vesper",
  zone: "vila",
  where: "Vila de Cinzaluz",
  help: "Toque numa peça ao lado do espaço vazio para deslizá-la. Deixe as cores na ordem, de 1 a 8, com o vazio no fim.",
  win: "As cores se alinham e formam um arco-íris. No meio, gravado: \"Para Odelia, que pintava o céu.\"",
  reward: { gold: 60, xp: 70 },
  make() {
    const b = [1, 2, 3, 4, 5, 6, 7, 8, 0];
    let z = 8,
      last = -1;
    for (let k = 0; k < 80; k++) {
      const n = [z - 3, z + 3, z % 3 ? z - 1 : -1, z % 3 < 2 ? z + 1 : -1].filter((q) => q >= 0 && q < 9 && q !== last);
      const m = n[rnd(n.length)];
      [b[z], b[m]] = [b[m], b[z]];
      last = z;
      z = m;
    }
    return { b, moves: 0 };
  },
  html: (s) => `<div class="pz-grid g3">${s.b.map((v, i) => (v ? `<button class="pz-t" data-a="${i}" style="background:${MOSAIC_COL[v - 1]}">${v}</button>` : `<div class="pz-t empty"></div>`)).join("")}</div>`,
  status: (s) => `Movimentos: ${s.moves}`,
  act(s, a) {
    const i = +a,
      z = s.b.indexOf(0);
    const adj = Math.abs(i - z) === 3 || (Math.abs(i - z) === 1 && Math.floor(i / 3) === Math.floor(z / 3));
    if (!adj) return;
    [s.b[i], s.b[z]] = [s.b[z], s.b[i]];
    s.moves++;
  },
  won: (s) => s.b.every((v, i) => v === (i === 8 ? 0 : i + 1)),
};

/* ===================== 2. SELO DAS RUNAS (acender tudo) ===================== */
const PZ_LIGHTS = {
  id: "selo",
  n: "Selo das Runas",
  zone: "pantano",
  where: "Pântano das Brumas",
  help: "Toque numa runa: ela e as vizinhas (cima, baixo, lados) trocam entre acesa e apagada. Acenda todas as 16.",
  win: "As dezesseis runas brilham juntas. A névoa do pântano se abre num círculo perfeito, só por um instante.",
  reward: { gold: 70, xp: 90, items: [["eter", 1]] },
  make() {
    const on = Array(16).fill(true);
    const flip = (i) => [i, i - 4, i + 4, i % 4 ? i - 1 : -1, i % 4 < 3 ? i + 1 : -1].forEach((q) => q >= 0 && q < 16 && (on[q] = !on[q]));
    for (let k = 0; k < 7; k++) flip(rnd(16));
    if (on.every(Boolean)) flip(5);
    return { on, moves: 0 };
  },
  html: (s) => `<div class="pz-grid g4">${s.on.map((v, i) => `<button class="pz-t rune ${v ? "on" : ""}" data-a="${i}" style="--rc:${RUNES[PZ_RUNES[i % 4]].cor}">${v ? "✦" : "·"}</button>`).join("")}</div>`,
  status: (s) => `Acesas: ${s.on.filter(Boolean).length}/16 · Toques: ${s.moves}`,
  act(s, a) {
    const i = +a;
    [i, i - 4, i + 4, i % 4 ? i - 1 : -1, i % 4 < 3 ? i + 1 : -1].forEach((q) => q >= 0 && q < 16 && (s.on[q] = !s.on[q]));
    s.moves++;
  },
  won: (s) => s.on.every(Boolean),
};

/* ===================== 3. CANAIS DO PORTO (girar canos) ===================== */
// Lados: 0 cima, 1 direita, 2 baixo, 3 esquerda. Cada cano é um conjunto de lados abertos.
const PIPE_W = 5,
  PIPE_H = 4;
function pipeSides(p) {
  return p.base.map((d) => (d + p.rot) % 4);
}
const PIPE_GLYPH = { "0,2": "┃", "1,3": "━", "0,1": "┗", "1,2": "┏", "2,3": "┓", "0,3": "┛" };
function pipeGlyph(p) {
  const k = pipeSides(p).sort().join(",");
  return PIPE_GLYPH[k] || "╋";
}
function pipeFlow(s) {
  // A água entra pela esquerda da linha s.src e precisa sair pela direita da linha s.dst.
  const wet = new Set(),
    q = [];
  const at = (x, y) => s.g[y * PIPE_W + x];
  if (pipeSides(at(0, s.src)).includes(3)) (q.push([0, s.src]), wet.add(s.src * PIPE_W));
  const D = [[0, -1], [1, 0], [0, 1], [-1, 0]];
  let out = false;
  while (q.length) {
    const [x, y] = q.shift();
    for (const d of pipeSides(at(x, y))) {
      if (x === PIPE_W - 1 && y === s.dst && d === 1) out = true;
      const nx = x + D[d][0],
        ny = y + D[d][1];
      if (nx < 0 || ny < 0 || nx >= PIPE_W || ny >= PIPE_H) continue;
      const k = ny * PIPE_W + nx;
      if (wet.has(k) || !pipeSides(at(nx, ny)).includes((d + 2) % 4)) continue;
      wet.add(k);
      q.push([nx, ny]);
    }
  }
  return { wet, out };
}
const PZ_PIPES = {
  id: "canos",
  n: "Canais do Porto",
  zone: "porto",
  where: "Porto Brisamar",
  help: "Toque num cano para girar. Leve a água da entrada (à esquerda) até o moinho (à direita). Os canos molhados ficam azuis.",
  win: "A água corre, a roda do moinho range e começa a girar. Os pescadores aplaudem do cais.",
  reward: { gold: 80, xp: 80, items: [["peixe", 2]] },
  make() {
    for (let tries = 0; tries < 200; tries++) {
      const src = rnd(PIPE_H),
        dst = rnd(PIPE_H);
      // caminho aleatório sem repetir casas
      const path = [[0, src]],
        seen = new Set([`0,${src}`]);
      const dfs = () => {
        const [x, y] = path[path.length - 1];
        if (x === PIPE_W - 1 && y === dst) return true;
        const opts = [[1, 0], [0, 1], [0, -1], [-1, 0]].sort(() => Math.random() - 0.5);
        for (const [dx, dy] of opts) {
          const nx = x + dx,
            ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= PIPE_W || ny >= PIPE_H || seen.has(`${nx},${ny}`)) continue;
          seen.add(`${nx},${ny}`);
          path.push([nx, ny]);
          if (path.length < 16 && dfs()) return true;
          path.pop();
          seen.delete(`${nx},${ny}`);
        }
        return false;
      };
      if (!dfs() || path.length < 7) continue;
      const g = Array.from({ length: PIPE_W * PIPE_H }, () => ({ base: Math.random() < 0.5 ? [0, 2] : [0, 1], rot: 0 }));
      const dirTo = (a, b) => (b[0] > a[0] ? 1 : b[0] < a[0] ? 3 : b[1] > a[1] ? 2 : 0);
      path.forEach((c, i) => {
        const inn = i === 0 ? 3 : (dirTo(c, path[i - 1]) + 0) % 4;
        const out = i === path.length - 1 ? 1 : dirTo(c, path[i + 1]);
        g[c[1] * PIPE_W + c[0]] = { base: [inn, out], rot: 0 };
      });
      g.forEach((p) => (p.rot = rnd(4)));
      const s = { g, src, dst, moves: 0 };
      if (!pipeFlow(s).out) return s;
    }
    return PZ_PIPES.make();
  },
  html(s) {
    const { wet, out } = pipeFlow(s);
    let h = `<div class="pz-pipes" style="grid-template-columns:28px repeat(${PIPE_W},1fr) 28px">`;
    for (let y = 0; y < PIPE_H; y++) {
      h += `<div class="pz-end">${y === s.src ? "💧" : ""}</div>`;
      for (let x = 0; x < PIPE_W; x++) {
        const k = y * PIPE_W + x;
        h += `<button class="pz-t pipe ${wet.has(k) ? "wet" : ""}" data-a="${k}">${pipeGlyph(s.g[k])}</button>`;
      }
      h += `<div class="pz-end">${y === s.dst ? (out ? "⚙️" : "🏠") : ""}</div>`;
    }
    return h + "</div>";
  },
  status: (s) => `Giros: ${s.moves}`,
  act(s, a) {
    s.g[+a].rot = (s.g[+a].rot + 1) % 4;
    s.moves++;
  },
  won: (s) => pipeFlow(s).out,
};

/* ===================== 4. BALANÇA DOS ANÕES ===================== */
const WEIGHTS = [1, 2, 3, 5, 8, 13];
const PZ_SCALE = {
  id: "balanca",
  n: "Balança dos Anões",
  zone: "serra",
  where: "Pedravale",
  help: "A pedra misteriosa fica no prato da esquerda. Toque num peso para mudar de lugar: fora → direita → esquerda → fora. Deixe a balança reta.",
  win: "Os pratos param retinhos. O mestre anão bate palmas: \"Cabeça de ferreiro, essa aí!\"",
  reward: { gold: 70, xp: 80, items: [["fragmento", 1]] },
  make() {
    let W = 0;
    while (W < 9 || WEIGHTS.includes(W)) {
      W = 0;
      for (const w of WEIGHTS) {
        const r = rnd(3);
        if (r === 1) W += w;
        if (r === 2) W -= w;
      }
    }
    return { W, pos: WEIGHTS.map(() => 0), moves: 0 };
  },
  html(s) {
    const L = s.W + WEIGHTS.reduce((a, w, i) => a + (s.pos[i] === 2 ? w : 0), 0);
    const R = WEIGHTS.reduce((a, w, i) => a + (s.pos[i] === 1 ? w : 0), 0);
    const tilt = Math.max(-18, Math.min(18, (R - L) * 1.5));
    const pile = (side) => WEIGHTS.map((w, i) => (s.pos[i] === side ? `<span class="pz-w">${w}</span>` : "")).join("");
    return `<div class="pz-scale"><div class="beam" style="transform:rotate(${tilt}deg)">
        <div class="pan l"><span class="pz-w stone">?</span>${pile(2)}</div><div class="pan r">${pile(1)}</div></div><div class="post"></div></div>
      <div class="pz-weights">${WEIGHTS.map((w, i) => `<button class="pz-t wt ${["", "r", "l"][s.pos[i]]}" data-a="${i}">${w}<small>${["fora", "direita", "esquerda"][s.pos[i]]}</small></button>`).join("")}</div>`;
  },
  status(s) {
    const L = s.W + WEIGHTS.reduce((a, w, i) => a + (s.pos[i] === 2 ? w : 0), 0);
    const R = WEIGHTS.reduce((a, w, i) => a + (s.pos[i] === 1 ? w : 0), 0);
    return L === R ? "Equilibrada!" : L > R ? "Pende para a esquerda" : "Pende para a direita";
  },
  act(s, a) {
    s.pos[+a] = (s.pos[+a] + 1) % 3;
    s.moves++;
  },
  won(s) {
    const L = s.W + WEIGHTS.reduce((a, w, i) => a + (s.pos[i] === 2 ? w : 0), 0);
    const R = WEIGHTS.reduce((a, w, i) => a + (s.pos[i] === 1 ? w : 0), 0);
    return L === R;
  },
};

/* ===================== 5. COFRE DE VESPER (código) ===================== */
const PZ_CODE = {
  id: "cofre",
  n: "Cofre de Vesper",
  zone: "bosque",
  where: "Bosque Murmurante",
  help: "Monte um código de 4 runas (pode repetir) e toque em Testar. Depois de cada tentativa, cada runa ganha uma cor: <b style='color:#7ad36b'>verde</b> = runa certa no lugar certo · <b style='color:#f2c14e'>amarelo</b> = essa runa existe no código, mas em outro lugar · <b style='color:#9a98a8'>cinza</b> = essa runa não está (ou já não sobra mais dela). Você tem 8 tentativas.",
  win: "CLIQUE. O cofre abre. Dentro, um bilhete de criança: \"Se alguém achar isso, diga para a minha irmã que eu não estou bravo.\"",
  reward: { gold: 100, xp: 100, items: [["pocao", 2]] },
  make: () => ({ code: Array.from({ length: 4 }, () => PZ_RUNES[rnd(4)]), cur: [], tries: [] }),
  html(s) {
    const MARK = { g: "#7ad36b", y: "#f2c14e", x: "#5a5868" };
    const TIP = { g: "certa no lugar certo", y: "existe, mas em outro lugar", x: "não está no código" };
    const dot = (r, m) =>
      `<span class="pz-dot ${m ? "mk" : ""}" style="background:${RUNES[r].cor};${m ? `box-shadow:0 0 0 3px ${MARK[m]};${m === "x" ? "opacity:.45;" : ""}` : ""}" title="${RUNES[r].nome}${m ? ": " + TIP[m] : ""}">${RUNES[r].nome[0]}</span>`;
    const rows = s.tries.map((t) => `<div class="pz-row">${t.g.map((r, i) => dot(r, t.m[i])).join("")}<span class="pz-fb">${t.b === 4 ? "Abriu!" : `${t.b} no lugar certo`}</span></div>`).join("");
    const lost = s.tries.length >= 8 && !(s.tries.length && s.tries[s.tries.length - 1].b === 4);
    return `<div class="pz-code">${rows || "<div class='pz-row dim'>Nenhuma tentativa ainda. Comece com qualquer combinação.</div>"}
      <div class="pz-row cur">${[0, 1, 2, 3].map((i) => (s.cur[i] ? dot(s.cur[i]) : `<span class="pz-dot empty"></span>`)).join("")}</div>
      ${lost ? `<div class="pz-lost">Acabaram as tentativas. O código era ${s.code.map((r) => dot(r)).join("")}. Toque em Recomeçar.</div>` : `<div class="pz-keys">${PZ_RUNES.map((r) => `<button class="pz-t key" data-a="r:${r}" style="--rc:${RUNES[r].cor}">${RUNES[r].nome}</button>`).join("")}<button class="pz-t key" data-a="del">⌫</button><button class="pz-t key go" data-a="go" ${s.cur.length < 4 ? "disabled" : ""}>Testar</button></div>`}</div>`;
  },
  status: (s) => `Tentativas: ${s.tries.length}/8`,
  act(s, a) {
    if (s.tries.length >= 8) return;
    if (a.startsWith("r:") && s.cur.length < 4) s.cur.push(a.slice(2));
    else if (a === "del") s.cur.pop();
    else if (a === "go" && s.cur.length === 4) {
      // Cores por runa, como no Termo: verde primeiro, depois amarelo com o que sobra.
      const m = ["x", "x", "x", "x"],
        left = {};
      s.cur.forEach((r, i) => (r === s.code[i] ? (m[i] = "g") : (left[s.code[i]] = (left[s.code[i]] || 0) + 1)));
      s.cur.forEach((r, i) => {
        if (m[i] === "g") return;
        if (left[r] > 0) ((m[i] = "y"), left[r]--);
      });
      s.tries.push({ g: s.cur.slice(), m, b: m.filter((x) => x === "g").length });
      s.cur = [];
    }
  },
  won: (s) => s.tries.length > 0 && s.tries[s.tries.length - 1].b === 4,
};

/* ===================== NO MAPA ===================== */
const PUZZLES = [PZ_MOSAIC, PZ_LIGHTS, PZ_PIPES, PZ_SCALE, PZ_CODE];
function pzSpot(P) {
  return ZONES[P.zone] ? spotOf(P.zone, "pz-" + P.id) : null;
}
function puzzleAt(x, y) {
  return PUZZLES.find((P) => P.zone === player.zone && near(pzSpot(P), x, y)) || null;
}
(function puzzleCSS() {
  const st = document.createElement("style");
  st.textContent = `#puzzle{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:min(560px,94vw);height:auto !important;max-height:94vh !important;overflow:auto !important;z-index:70;padding:12px 16px;inset:auto !important;left:50% !important;top:50% !important}
  .pz-help{font-size:13px;opacity:.85;margin:4px 0 10px}
  .pz-foot{display:flex;justify-content:space-between;align-items:center;margin-top:10px;font-size:13px}
  .pz-grid{display:grid;gap:6px;margin:0 auto;width:min(240px,62vh,80vw)}
  .pz-grid.g3{grid-template-columns:repeat(3,1fr)} .pz-grid.g4{grid-template-columns:repeat(4,1fr)}
  .pz-t{aspect-ratio:1;font:700 22px "Pixelify Sans",sans-serif;border-radius:8px;border:2px solid rgba(255,255,255,.25);color:#fff;cursor:pointer;padding:0}
  .pz-t.empty{background:rgba(0,0,0,.35);border-style:dashed}
  .pz-t.rune{background:rgba(255,255,255,.05);color:rgba(255,255,255,.3)}
  .pz-t.rune.on{background:var(--rc);color:#fff;box-shadow:0 0 12px var(--rc)}
  .pz-pipes{display:grid;gap:4px;margin:0 auto;width:min(380px,88vw);align-items:center}
  .pz-t.pipe{background:#3a3226;color:#9a8a70;font-size:30px;line-height:1}
  .pz-t.pipe.wet{background:#21405a;color:#7ad0ff}
  .pz-end{text-align:center;font-size:20px}
  .pz-scale{position:relative;height:140px;margin:0 auto 8px;width:min(340px,86vw)}
  .pz-scale .beam{position:absolute;left:5%;right:5%;top:40px;height:6px;background:#c8a060;border-radius:3px;transition:transform .3s}
  .pz-scale .pan{position:absolute;top:8px;width:42%;min-height:60px;border-bottom:4px solid #a08050;display:flex;flex-wrap:wrap;gap:3px;align-items:flex-end;justify-content:center}
  .pz-scale .pan.l{left:0} .pz-scale .pan.r{right:0}
  .pz-scale .post{position:absolute;left:50%;top:44px;width:8px;height:90px;margin-left:-4px;background:#8a6a40}
  .pz-w{display:inline-block;min-width:22px;padding:2px 4px;background:#6a6a78;border-radius:4px;font-size:12px;text-align:center}
  .pz-w.stone{background:#4a3a6a;font-weight:700}
  .pz-weights{display:grid;grid-template-columns:repeat(6,1fr);gap:6px}
  .pz-t.wt{aspect-ratio:auto;padding:6px 0;font-size:18px;background:#4a4a58}
  .pz-t.wt small{display:block;font-size:10px;opacity:.8}
  .pz-t.wt.r{background:#3a6a4a} .pz-t.wt.l{background:#6a4a3a}
  .pz-code{display:flex;flex-direction:column;gap:6px;align-items:center}
  .pz-row{display:flex;gap:6px;align-items:center} .pz-row.dim{opacity:.6;font-size:13px}
  .pz-row.cur{padding:6px;border:2px dashed rgba(255,255,255,.3);border-radius:8px}
  .pz-dot{display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:50%;border:2px solid rgba(255,255,255,.4);font:700 12px monospace;color:rgba(0,0,0,.55)} .pz-dot.mk{margin:0 3px}
  .pz-dot.empty{background:rgba(0,0,0,.3)}
  .pz-fb{min-width:110px;margin-left:10px;font-size:12px;color:#ffe08a}
  .pz-keys{display:flex;flex-wrap:wrap;gap:6px;justify-content:center;margin-top:6px}
  .pz-t.key{aspect-ratio:auto;padding:8px 10px;font-size:14px;background:var(--rc,#4a4a58)}
  .pz-t.key.go{background:#5a8a4a} .pz-t.key:disabled{opacity:.4}
  .pz-lost{font-size:13px;color:#ffb0b0;text-align:center}`;
  document.head.appendChild(st);
})();
{
  const tgtBase = targetAt;
  targetAt = function (x, y) {
    if (story()) {
      const P = puzzleAt(x, y);
      if (P) return `${pzSolved(P.id) ? "✓ " : ""}Examinar: ${P.n}`;
    }
    return tgtBase(x, y);
  };
  const iaBase = interactAt;
  interactAt = function (x, y) {
    if (story()) {
      const P = puzzleAt(x, y);
      if (P) return openPuzzle(P);
    }
    return iaBase(x, y);
  };
  const cdBase = crewDrawList;
  crewDrawList = function (list, t) {
    cdBase(list, t);
    if (!story()) return;
    PUZZLES.forEach((P, i) => {
      if (P.zone !== player.zone) return;
      const p = pzSpot(P);
      if (!p) return;
      list.push({
        y: p[1],
        draw: () => {
          const X = p[0] * TILE,
            Y = p[1] * TILE,
            done = pzSolved(P.id);
          ctx.fillStyle = "#5a5560";
          ctx.fillRect(X + 6, Y + 14, 20, 16);
          ctx.fillStyle = "#7a7580";
          ctx.fillRect(X + 4, Y + 10, 24, 6);
          const c = RUNES[PZ_RUNES[i % 4]].cor;
          ctx.globalAlpha = done ? 0.35 : 0.6 + 0.4 * Math.sin(t * 3 + i);
          ctx.fillStyle = c;
          ctx.fillRect(X + 12, Y + 2 - (done ? 0 : Math.abs(Math.sin(t * 2)) * 3), 8, 8);
          ctx.globalAlpha = 1;
        },
      });
    });
  };
  const thBase = townQuestsHTML;
  townQuestsHTML = function () {
    let h = thBase();
    if (!story()) return h;
    h += `<h3>${iconHTML("gem")}Quebra-cabeças (${PUZZLES.filter((P) => pzSolved(P.id)).length}/${PUZZLES.length})</h3>`;
    for (const P of PUZZLES) h += `<div class="qs ${pzSolved(P.id) ? "done" : ""}">${P.n}<div class="qtip">${pzSolved(P.id) ? "resolvido" : `Um pedestal brilhando em ${P.where}.`}</div></div>`;
    return h;
  };
}
ACHIEVEMENTS.push(["puzzles", "Mente arcana", "Resolva os 5 quebra-cabeças dos pedestais.", "gem", () => PUZZLES.every((P) => pzSolved(P.id))]);
