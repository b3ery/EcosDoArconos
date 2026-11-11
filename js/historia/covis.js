/**
 * ECOS DO ARCANO — covis.js (modo História)
 * Os Guardiões agora vivem no fundo de uma caverna, e cada caverna tem o seu
 * desafio antes da sala do Guardião:
 *  - Covil do Ent (Bosque): Sementes da Memória. A árvore-mãe acende as
 *    sementes numa ordem; repita a ordem.
 *  - Ninho da Névoa (Pântano): um labirinto onde só se enxerga perto de você.
 *  - Ninho do Grifo (Picos): o Corredor dos Ventos. Rajadas acendem e apagam;
 *    quem é pego volta para o começo.
 *  - Galeria do Basilisco (Mina): empurre os blocos de cristal até as placas.
 *  - Gruta do Leviatã (Porto): a maré sobe e desce; atravesse na baixa,
 *    esperando nas pedras.
 * O quebra-cabeça do pedestal da região continua sendo a chave da entrada.
 * Também aqui: as cenas de recuperar a runa, uma para o herói (libertar o
 * Guardião) e outra para o vilão (arrancar a runa à força).
 * Modifica (envolve) funções de outros arquivos: crewDrawList, enterZone,
 * guardianScene, interactAt, possessGuardian, targetAt, tryMove, update, walkable.
 */

"use strict";

/* ===================== OS COVIS ===================== */
const LAIRS = {
  bosque: { id: "covil-bosque", n: "Covil do Ent", theme: "bosque", guard: "ent", mech: "simon", sub: "As raízes lembram de tudo.", hint: "No meio da sala, uma árvore-mãe. Toque nela: as sementes vão acender numa ordem. Depois, toque nas sementes na mesma ordem." },
  pantano: { id: "covil-pantano", n: "Ninho da Névoa", theme: "pantano", guard: "serpente", mech: "fog", sub: "Aqui, a névoa tem fome.", hint: "A névoa engole tudo. Você só enxerga bem perto. Ache o caminho até o outro lado." },
  picos: { id: "covil-picos", n: "Ninho do Grifo", theme: "picos", guard: "grifo", mech: "gust", sub: "O vento não deixa ninguém passar.", hint: "Rajadas de vento cortam o corredor. Quando o ar começa a tremer, a rajada vem: espere ela passar e atravesse." },
  mina: { id: "covil-mina", n: "Galeria do Basilisco", theme: "mina", guard: "basilisco", mech: "push", sub: "Cristais que pesam como montanhas.", hint: "Empurre os dois blocos de cristal até as placas brilhantes. Se um bloco travar, puxe a alavanca do canto para recomeçar." },
  porto: { id: "covil-porto", n: "Gruta do Leviatã", theme: "mina", guard: "leviata", mech: "tide", sub: "A maré respira devagar.", hint: "A maré sobe e desce. Atravesse quando ela baixar e espere nas pedras quando subir. Quem a água pega volta para a entrada." },
};
const LAIR_BY_ID = Object.fromEntries(Object.entries(LAIRS).map(([r, L]) => [L.id, Object.assign(L, { region: r })]));
const LAIR = { w: 30, h: 11, exit: [1, 5], spawn: [2, 5], door: [19, 5], guard: [26, 5] };
const lairOfZone = (z) => LAIR_BY_ID[z] || null;

/** Labirinto fixo (sempre o mesmo) para o Ninho da Névoa. */
function fogMaze(m) {
  let seed = 7;
  const rnd = () => ((seed = (seed * 1103515245 + 12345) >>> 0) / 4294967296);
  const CW = 9,
    CH = 5;
  for (let y = 1; y <= 9; y++) for (let x = 2; x <= 18; x++) m[y][x] = "#";
  const seen = new Set(["0,2"]),
    stack = [[0, 2]];
  const cell = (cx, cy) => (m[1 + cy * 2][2 + cx * 2] = ".");
  cell(0, 2);
  while (stack.length) {
    const [cx, cy] = stack[stack.length - 1];
    const nb = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dy]) => [cx + dx, cy + dy, dx, dy]).filter(([nx, ny]) => nx >= 0 && ny >= 0 && nx < CW && ny < CH && !seen.has(nx + "," + ny));
    if (!nb.length) {
      stack.pop();
      continue;
    }
    const [nx, ny, dx, dy] = nb[Math.floor(rnd() * nb.length)];
    m[1 + cy * 2 + dy][2 + cx * 2 + dx] = ".";
    cell(nx, ny);
    seen.add(nx + "," + ny);
    stack.push([nx, ny]);
  }
}
function genLair(L) {
  const { w, h } = LAIR;
  const m = makeGrid(w, h, (x, y) => (x === 0 || y === 0 || x === w - 1 || y === h - 1 ? "#" : "."));
  for (let y = 1; y < h - 1; y++) m[y][LAIR.door[0]] = "#";
  for (let y = 1; y < h - 1; y++) if (y !== 5) m[y][1] = "#";
  if (L.mech === "fog") fogMaze(m);
  m[LAIR.door[1]][LAIR.door[0]] = L.mech === "fog" ? "." : "#";
  m[LAIR.guard[1]][LAIR.guard[0]] = "G";
  ZONE_DEFS[L.id] = { nome: L.n, theme: L.theme, exits: {}, enemies: [], guard: L.guard };
  const z = finalize(L.id, ZONE_DEFS[L.id], m, w, h, {}, {}, null);
  z.town = { bld: [], doors: {}, stalls: {}, huts: [], arrive: LAIR.spawn.slice(), horses: [], boats: [], yard: true };
  return z;
}
for (const L of Object.values(LAIRS)) {
  ZONES[L.id] = genLair(L);
  if (ZONES[L.region]) ZONES[L.region].lair = L.id;
}
function lairState(L) {
  player.lairs = player.lairs || {};
  return (player.lairs[L.region] = player.lairs[L.region] || { ok: false, seen: false, seq: null, pos: 0, blocks: null });
}
function lairApply(L) {
  const S = lairState(L);
  if (L.mech !== "fog") setTile(L.id, LAIR.door[0], LAIR.door[1], S.ok ? "." : "#");
}
function lairSolved(L, msg) {
  const S = lairState(L);
  if (S.ok) return;
  S.ok = true;
  lairApply(L);
  gainXP(80);
  saveGame();
  if (!settings.calm) game.shake = 0.35;
  [523, 659, 784].forEach((f, i) => setTimeout(() => playSound(f, 0.2, "triangle", 0.05), i * 120));
  say([["", msg], ["", `A passagem para o fundo do covil se abriu. O ${(ENEMIES[L.guard] || {}).nome || "Guardião"} espera lá dentro. +80 XP.`]]);
}
function enterLair(L) {
  lairApply(L);
  game.lairBack = { zone: player.zone, x: player.x, y: player.y };
  player.zone = L.id;
  [player.x, player.y] = LAIR.spawn;
  player.rx = player.x;
  player.ry = player.y;
  player.dir = "right";
  player.riding = false;
  game.fade = 1;
  enterZone(true);
  const S = lairState(L);
  if (L.mech === "push" && !S.blocks) S.blocks = PUSH.blocks.map((b) => b.slice());
  if (!S.seen) {
    S.seen = true;
    saveGame();
    playCine(chapterCard("Covil", L.n, L.sub), 3.4, () => say([["", L.hint]]));
  }
}
function leaveLair(L) {
  const b = game.lairBack && game.lairBack.zone === L.region ? game.lairBack : null;
  const g = ZONES[L.region].guardPos;
  player.zone = L.region;
  if (b) [player.x, player.y] = [b.x, b.y];
  else {
    [player.x, player.y] = g;
    for (const [dx, dy] of [[0, 1], [1, 0], [-1, 0], [0, -1]]) if (walkable(L.region, g[0] + dx, g[1] + dy)) ((player.x = g[0] + dx), (player.y = g[1] + dy));
  }
  player.rx = player.x;
  player.ry = player.y;
  game.fade = 1;
  enterZone(true);
}
const inRoomA = () => player.x < LAIR.door[0];

/* ===================== 1. SEMENTES DA MEMÓRIA (Ent) ===================== */
const SIMON = { tree: [9, 5], seeds: [[5, 2], [13, 2], [5, 8], [13, 8]], cols: ["#7ad36b", "#f2c14e", "#ff8ab8", "#e8f0ff"], tone: [392, 494, 587, 698] };
function simonPlay(L) {
  const S = lairState(L);
  if (!S.seq) S.seq = Array.from({ length: 5 }, () => Math.floor(Math.random() * 4));
  S.pos = 0;
  game.simon = { t: 0, i: -1 };
}
function simonTick(L, dt) {
  const G = game.simon;
  if (!G) return;
  G.t += dt;
  const S = lairState(L),
    i = Math.floor(G.t / 0.75);
  if (i !== G.i && i < S.seq.length) {
    G.i = i;
    playSound(SIMON.tone[S.seq[i]], 0.4, "sine", 0.06);
  }
  if (G.t > S.seq.length * 0.75 + 0.3) game.simon = null;
}
function simonSeedLit(i) {
  const G = game.simon;
  return G && G.i >= 0 && G.t - G.i * 0.75 < 0.55 && lairState(LAIRS.bosque).seq[G.i] === i;
}

/* ===================== 4. BLOCOS DE CRISTAL (Basilisco) ===================== */
const PUSH = { blocks: [[8, 4], [12, 6]], plates: [[5, 2], [15, 8]], lever: [3, 8] };
const blockAt = (S, x, y) => (S.blocks || []).findIndex((b) => b[0] === x && b[1] === y);
const platesDone = (S) => PUSH.plates.every((p) => blockAt(S, p[0], p[1]) >= 0);

/* ===================== 3. CORREDOR DOS VENTOS (Grifo) ===================== */
const GUSTS = [5, 8, 11, 14, 17];
const gustPhase = (i) => ((game.t + i * 0.55) % 2.4) / 2.4; // 0..1
const gustOn = (i) => gustPhase(i) > 0.55; // ~1,1 s de rajada
const gustWarn = (i) => gustPhase(i) > 0.4 && !gustOn(i);

/* ===================== 5. A MARÉ (Leviatã) ===================== */
const TIDE = { x0: 4, x1: 17, rocks: [[7, 5], [11, 3], [11, 7], [14, 5], [8, 2], [8, 8]], period: 5 };
const tidePhase = () => (game.t % TIDE.period) / TIDE.period;
const tideHigh = () => tidePhase() > 0.56;
const tideWarn = () => tidePhase() > 0.4 && !tideHigh();
const onRock = (x, y) => TIDE.rocks.some((r) => r[0] === x && r[1] === y);
const inFlood = (x, y) => x >= TIDE.x0 && x <= TIDE.x1 && !onRock(x, y);

function knockBack(msg) {
  [player.x, player.y] = LAIR.spawn;
  player.rx = player.x;
  player.ry = player.y;
  game.autoPath = null;
  if (!settings.calm) game.shake = 0.3;
  playSound(120, 0.3, "sawtooth", 0.04);
  toast(msg, 2200);
}

/* ===================== ALVOS E INTERAÇÃO ===================== */
function lairTarget(x, y) {
  const L = lairOfZone(player.zone);
  if (!L) return null;
  const S = lairState(L);
  if (near(LAIR.exit, x, y)) return "Sair do covil";
  if (near(LAIR.door, x, y) && !S.ok && L.mech !== "fog") return "Passagem fechada";
  if (L.mech === "simon") {
    if (near(SIMON.tree, x, y)) return S.ok ? "Árvore-mãe" : "Tocar na árvore-mãe";
    const i = SIMON.seeds.findIndex((p) => near(p, x, y));
    if (i >= 0) return S.ok ? "Semente acesa" : "Tocar na semente";
  }
  if (L.mech === "push" && near(PUSH.lever, x, y)) return "Puxar a alavanca (recomeçar)";
  return null;
}
function lairInteract(x, y) {
  const L = lairOfZone(player.zone),
    S = L && lairState(L),
    l = lairTarget(x, y);
  if (!l) return false;
  if (l === "Sair do covil") return leaveLair(L), true;
  if (l === "Passagem fechada") return say([["", "Uma parede de pedra viva fecha a passagem. Ela só se abre com o desafio desta sala."]]), true;
  if (l === "Tocar na árvore-mãe") {
    if (game.simon) return true;
    say([["", "A árvore-mãe estremece. Observe as sementes..."]], () => simonPlay(L));
    return true;
  }
  if (l === "Tocar na semente") {
    if (game.simon) return true;
    if (!S.seq) return say([["", "A semente está dormindo. Toque primeiro na árvore-mãe."]]), true;
    const i = SIMON.seeds.findIndex((p) => near(p, x, y));
    playSound(SIMON.tone[i], 0.35, "sine", 0.06);
    game.seedFlash = { i, t: game.t };
    if (S.seq[S.pos] === i) {
      S.pos++;
      if (S.pos >= S.seq.length) lairSolved(L, "As cinco sementes brotam ao mesmo tempo. Raízes recuam da parede como cortinas.");
    } else {
      S.pos = 0;
      if (!settings.calm) game.shake = 0.15;
      say([["", "As sementes murcham. Toque na árvore-mãe para ver a ordem de novo."]]);
    }
    return true;
  }
  if (l === "Puxar a alavanca (recomeçar)") {
    S.blocks = PUSH.blocks.map((b) => b.slice());
    playSound(200, 0.2, "square", 0.04);
    toast("Os blocos voltam para o lugar.", 1600);
    return true;
  }
  return true;
}

/* ===================== DESENHO ===================== */
function drawLair(t) {
  const L = lairOfZone(player.zone);
  if (!L) return;
  const S = lairState(L),
    T = TILE;
  // saída
  ctx.fillStyle = "#0a0810";
  ctx.fillRect(LAIR.exit[0] * T + 2, LAIR.exit[1] * T + 2, 28, 28);
  // passagem fechada
  if (!S.ok && L.mech !== "fog") {
    ctx.fillStyle = "#5a5048";
    ctx.fillRect(LAIR.door[0] * T, LAIR.door[1] * T, T, T);
    ctx.fillStyle = `rgba(180,140,255,${0.3 + 0.2 * Math.sin(t * 3)})`;
    ctx.fillRect(LAIR.door[0] * T + 12, LAIR.door[1] * T + 6, 8, 20);
  }
  if (L.mech === "simon") {
    const [tx, ty] = SIMON.tree;
    const X = tx * T + 16,
      Y = ty * T;
    // aura (mostra que dá para tocar)
    ctx.strokeStyle = `rgba(255,230,140,${S.ok ? 0.25 : 0.35 + 0.3 * Math.sin(t * 3)})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(X, Y + 26, 22, 7, 0, 0, 7);
    ctx.stroke();
    ctx.fillStyle = "#3a2414";
    ctx.fillRect(X - 6, Y - 4, 12, 32);
    ctx.fillStyle = "#5a3a22";
    ctx.fillRect(X - 4, Y - 4, 4, 32);
    for (const [ox, oy, r, c] of [[0, -22, 20, "#2a5a1e"], [-14, -10, 14, "#3f7a2a"], [14, -10, 14, "#3f7a2a"], [0, -16, 15, S.ok ? "#b8f08a" : "#6ab04a"], [-6, -26, 8, "#9ad07a"]]) {
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.arc(X + ox, Y + oy, r, 0, 7);
      ctx.fill();
    }
    for (let i = 0; i < 5; i++) {
      ctx.fillStyle = `rgba(255,240,170,${0.5 + 0.5 * Math.sin(t * 4 + i * 1.3)})`;
      ctx.fillRect(X - 14 + i * 7, Y - 30 + ((i * 11) % 18), 3, 3);
    }
    SIMON.seeds.forEach(([x, y], i) => {
      const flash = simonSeedLit(i) || (game.seedFlash && game.seedFlash.i === i && game.t - game.seedFlash.t < 0.35) || S.ok;
      ctx.fillStyle = "#3a2a1a";
      ctx.fillRect(x * T + 6, y * T + 18, 20, 10);
      ctx.fillStyle = flash ? SIMON.cols[i] : "rgba(120,110,90,.8)";
      ctx.beginPath();
      ctx.arc(x * T + 16, y * T + 14, flash ? 9 : 6, 0, 7);
      ctx.fill();
      if (flash) {
        ctx.strokeStyle = SIMON.cols[i];
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x * T + 16, y * T + 14, 14, 0, 7);
        ctx.stroke();
      }
    });
    if (S.seq && !S.ok && !game.simon) {
      ctx.fillStyle = "#ffe08a";
      ctx.font = '600 12px "Pixelify Sans", sans-serif';
      ctx.textAlign = "center";
      ctx.fillText(`${S.pos}/${S.seq.length}`, tx * T + 16, ty * T - 46);
    }
  }
  if (L.mech === "gust") {
    GUSTS.forEach((gx, i) => {
      const on = gustOn(i),
        warn = gustWarn(i);
      if (!on && !warn) return;
      for (let y = 1; y <= 9; y++) {
        ctx.fillStyle = on ? "rgba(230,240,255,.55)" : `rgba(230,240,255,${0.12 + 0.1 * Math.sin(t * 30)})`;
        ctx.fillRect(gx * T + 2, y * T, T - 4, T);
        if (on) {
          ctx.fillStyle = "rgba(255,255,255,.9)";
          ctx.fillRect(gx * T + 6 + ((t * 120 + y * 7) % 18), y * T + ((t * 200 + y * 13) % 28), 2, 8);
        }
      }
    });
  }
  if (L.mech === "push") {
    PUSH.plates.forEach(([x, y]) => {
      const on = blockAt(S, x, y) >= 0;
      ctx.fillStyle = on ? "#9ae0ff" : `rgba(150,220,255,${0.35 + 0.2 * Math.sin(t * 3)})`;
      ctx.fillRect(x * T + 4, y * T + 4, T - 8, T - 8);
    });
    (S.blocks || []).forEach(([x, y]) => {
      ctx.fillStyle = "#7ab8d8";
      ctx.fillRect(x * T + 3, y * T + 3, T - 6, T - 6);
      ctx.fillStyle = "#cfefff";
      ctx.fillRect(x * T + 6, y * T + 6, 8, 8);
      ctx.strokeStyle = "#3a6a8a";
      ctx.lineWidth = 2;
      ctx.strokeRect(x * T + 3, y * T + 3, T - 6, T - 6);
    });
    const [lx, ly] = PUSH.lever;
    ctx.fillStyle = "#6a5a48";
    ctx.fillRect(lx * T + 8, ly * T + 18, 16, 8);
    ctx.fillStyle = "#c8a060";
    ctx.fillRect(lx * T + 14, ly * T + 4, 3, 16);
  }
  if (L.mech === "tide") {
    const high = tideHigh(),
      warn = tideWarn();
    const a = high ? 0.75 : warn ? 0.25 + 0.2 * Math.sin(t * 12) : 0.12;
    for (let y = 1; y <= 9; y++)
      for (let x = TIDE.x0; x <= TIDE.x1; x++) {
        if (onRock(x, y)) continue;
        ctx.fillStyle = `rgba(40,110,200,${a})`;
        ctx.fillRect(x * T, y * T, T, T);
      }
    TIDE.rocks.forEach(([x, y]) => {
      ctx.fillStyle = "#6a6a72";
      ctx.beginPath();
      ctx.ellipse(x * T + 16, y * T + 18, 13, 10, 0, 0, 7);
      ctx.fill();
    });
    ctx.fillStyle = high ? "#7ad0ff" : warn ? "#ffe08a" : "#cfe";
    ctx.font = '600 12px "Pixelify Sans", sans-serif';
    ctx.textAlign = "center";
    ctx.fillText(high ? "MARÉ ALTA" : warn ? "a maré está subindo..." : "maré baixa", ((TIDE.x0 + TIDE.x1) / 2) * T, 0.8 * T);
  }
}
function drawFog() {
  const L = lairOfZone(player.zone);
  if (!L || L.mech !== "fog" || !inRoomA()) return;
  const T = TILE,
    px = player.rx * T + 16,
    py = player.ry * T + 16;
  ctx.save();
  ctx.fillStyle = "rgba(200,210,215,.96)";
  ctx.beginPath();
  ctx.rect(0, 0, LAIR.door[0] * T, LAIR.h * T);
  ctx.arc(px, py, T * 2.6, 0, Math.PI * 2, true);
  ctx.fill("evenodd");
  const g = ctx.createRadialGradient(px, py, T * 1.6, px, py, T * 2.6);
  g.addColorStop(0, "rgba(200,210,215,0)");
  g.addColorStop(1, "rgba(200,210,215,.96)");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(px, py, T * 2.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
function drawLairEntrance(t) {
  const L = LAIRS[player.zone];
  if (!L || player.guards.includes(player.zone)) return;
  const [x, y] = ZONES[player.zone].guardPos,
    X = x * TILE,
    Y = y * TILE;
  ctx.fillStyle = "#4a4048";
  ctx.beginPath();
  ctx.arc(X + 16, Y + 20, 26, Math.PI, 0);
  ctx.fill();
  ctx.fillRect(X - 10, Y + 20, 52, 12);
  ctx.fillStyle = "#08060c";
  ctx.beginPath();
  ctx.arc(X + 16, Y + 22, 16, Math.PI, 0);
  ctx.fill();
  ctx.fillRect(X, Y + 22, 32, 10);
  ctx.fillStyle = `rgba(160,110,230,${0.3 + 0.25 * Math.sin(t * 3)})`;
  ctx.beginPath();
  ctx.arc(X + 16, Y + 16, 5, 0, 7);
  ctx.fill();
}

/* ===================== CENAS DA RUNA ===================== */
const VILLAIN_ECHO = {
  ent: ["A árvore mais antiga do bosque se curva.", "E não se levanta mais."],
  serpente: ["A névoa para de respirar.", "O pântano fica em silêncio pela segunda vez."],
  grifo: ["O grito do Grifo se parte ao meio.", "Nos Picos, o eco não volta."],
  basilisco: ["O cristal racha de dentro para fora.", "A mina escurece, uma lanterna de cada vez."],
  leviata: ["A maré recua e não volta.", "No cais, os barcos encalham na lama."],
};
/** Herói: as correntes de silêncio quebram, o Guardião volta a ter cor, a runa vem até você. */
function heroRuneScene(type, rune) {
  const R = rune && RUNES[rune] ? RUNES[rune] : { nome: "Luz", cor: "#ffe066" };
  const E = GUARD_ECHO[type] || ["Mais uma voz volta ao mundo.", ""];
  return (W, H, t) => {
    const cx = W / 2,
      cy = H / 2 - 30;
    ctx.fillStyle = "#06050c";
    ctx.fillRect(0, 0, W, H);
    const free = Math.min(1, Math.max(0, (t - 2) / 1.2));
    if (free > 0) {
      ctx.globalAlpha = 0.3 * free;
      rays(cx, cy, 14, W, R.cor, t);
      ctx.globalAlpha = 1;
    }
    ctx.save();
    if (free < 1) ctx.filter = `grayscale(${1 - free})`;
    const u = 6,
      shake = t < 2 ? Math.sin(t * 30) * 2 : 0;
    drawEnemy(type, cx - 8 * u + shake, cy - 8 * u - free * 10, u, t);
    ctx.restore();
    // correntes de silêncio
    if (t < 2.4) {
      ctx.strokeStyle = `rgba(150,140,170,${t < 2 ? 0.9 : 1 - (t - 2) / 0.4})`;
      ctx.lineWidth = 5;
      for (const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
        ctx.beginPath();
        ctx.moveTo(cx + a * 140, cy + b * 110);
        ctx.lineTo(cx + (t > 2 ? a * (20 + (t - 2) * 200) : a * 20), cy + (t > 2 ? b * (20 + (t - 2) * 160) : b * 20));
        ctx.stroke();
      }
    }
    if (t > 2 && t < 2.4) {
      ctx.fillStyle = `rgba(255,255,255,${1 - (t - 2) / 0.4})`;
      ctx.fillRect(0, 0, W, H);
    }
    // a runa vem até você
    if (t > 3) {
      const k = Math.min(1, (t - 3) / 1.6);
      const gx = cx,
        gy = cy + k * (H - 140 - cy);
      glyph(rune || "luz", gx, gy, 18 + 10 * Math.sin(t * 4), 1);
      for (let i = 0; i < 16; i++) {
        ctx.fillStyle = R.cor;
        ctx.globalAlpha = 0.6;
        ctx.fillRect(gx + Math.cos(t * 3 + i) * (20 + i * 3), gy + Math.sin(t * 2 + i) * (12 + i * 2), 3, 3);
      }
      ctx.globalAlpha = 1;
    }
    ctx.textAlign = "center";
    if (t < 2) txt("O Silêncio ainda prende o Guardião...", W / 2, 50, 18, "rgba(200,190,220,.9)", 600);
    if (t > 3.2) txt(`A Runa ${RUNE_OF[rune] || R.nome} despertou`, W / 2, 50, 26, R.cor);
    if (t > 4.2) txt(E[0], W / 2, H - 70, 18, `rgba(255,255,255,${Math.min(1, t - 4.2)})`, 600);
    if (t > 5.2) txt(E[1], W / 2, H - 42, 18, `rgba(255,255,255,${Math.min(1, t - 5.2)})`, 600);
  };
}
/** Vilão: tentáculos de silêncio, a runa racha e escurece, o Guardião vira pó. */
function villainRuneScene(type, rune) {
  const R = rune && RUNES[rune] ? RUNES[rune] : { nome: "Sombra", cor: "#8a4ad0" };
  const E = VILLAIN_ECHO[type] || ["O Guardião cai.", "E não se levanta mais."];
  return (W, H, t) => {
    const cx = W / 2,
      cy = H / 2 - 30;
    ctx.fillStyle = "#0a0410";
    ctx.fillRect(0, 0, W, H);
    const drain = Math.min(1, Math.max(0, (t - 1.5) / 2));
    // o Guardião perde a cor e se desfaz
    if (t < 5) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, 1 - Math.max(0, t - 3.6) / 1.4);
      ctx.filter = `grayscale(${drain}) brightness(${1 - drain * 0.5})`;
      const u = 6;
      drawEnemy(type, cx - 8 * u, cy - 8 * u + drain * 12, u, t);
      ctx.restore();
    }
    if (t > 3.6)
      for (let i = 0; i < 60; i++) {
        ctx.fillStyle = `rgba(90,70,100,${Math.max(0, 1 - (t - 3.6) / 2.5)})`;
        ctx.fillRect(cx - 50 + ((i * 37) % 100), cy - 40 + ((i * 53) % 90) + (t - 3.6) * (20 + (i % 7) * 12), 3, 3);
      }
    // tentáculos de silêncio
    ctx.strokeStyle = `rgba(140,60,220,${Math.min(0.85, t / 1.2)})`;
    ctx.lineWidth = 4;
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + t * 0.4,
        r0 = W,
        r1 = 40 + 30 * Math.sin(t * 2 + i);
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0);
      ctx.quadraticCurveTo(cx + Math.cos(a + 0.8) * 160, cy + Math.sin(a + 0.8) * 120, cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
      ctx.stroke();
    }
    // a runa racha e escurece
    if (t > 2) {
      const k = Math.min(1, (t - 2) / 2);
      const gy = cy + k * (H - 140 - cy);
      ctx.save();
      ctx.filter = `grayscale(${k}) brightness(${1 - k * 0.4})`;
      glyph(rune || "sombra", cx, gy, 22, 1);
      ctx.restore();
      ctx.strokeStyle = "#000";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx - 6, gy - 16);
      ctx.lineTo(cx + 2, gy - 2);
      ctx.lineTo(cx - 4, gy + 6);
      ctx.lineTo(cx + 5, gy + 16);
      ctx.stroke();
    }
    ctx.textAlign = "center";
    if (t > 1) txt(`Você arranca a Runa ${RUNE_OF[rune] || R.nome}`, W / 2, 50, 24, "#c89aff");
    if (t > 3.8) txt(E[0], W / 2, H - 70, 18, `rgba(220,200,240,${Math.min(1, t - 3.8)})`, 600);
    if (t > 4.8) txt(E[1], W / 2, H - 42, 18, `rgba(220,200,240,${Math.min(1, t - 4.8)})`, 600);
    if (t > 5.6) txt("Ela queima frio na sua mão.", W / 2, 80, 15, `rgba(180,150,220,${Math.min(1, t - 5.6)})`, 500);
  };
}

/* ===================== ETAPAS DA HISTÓRIA ===================== */
{
  const byStep = { ent: "bosque", serp: "pantano", grif: "picos", basil: "mina", levi: "porto" };
  for (const s of STEPS) {
    const region = byStep[s.id];
    if (!region) continue;
    const L = LAIRS[region];
    Object.defineProperty(s, "zone", { get: () => (player.zone === L.id ? L.id : region), configurable: true, enumerable: true });
    s.pos = () => (player.zone === L.id ? LAIR.guard : ZONES[region].guardPos);
  }
}

/* ===================== LIGAÇÕES ===================== */
{
  const wkBase = walkable;
  walkable = function (z, x, y) {
    const L = lairOfZone(z);
    if (L && z === player.zone) {
      const l = lairTarget(x, y);
      if (l && l !== "Passagem fechada") return false;
      if (L.mech === "push" && blockAt(lairState(L), x, y) >= 0) return false;
    }
    return wkBase(z, x, y);
  };
  // Empurrar blocos de cristal.
  const tmBase = tryMove;
  tryMove = function (dir) {
    const L = lairOfZone(player.zone);
    if (L && L.mech === "push" && game.mode === "world") {
      const S = lairState(L),
        [dx, dy] = DIR_VECTORS[dir],
        bx = player.x + dx,
        by = player.y + dy,
        bi = blockAt(S, bx, by);
      if (bi >= 0) {
        player.dir = dir;
        const nx = bx + dx,
          ny = by + dy;
        const free = nx < LAIR.door[0] && wkBase(L.id, nx, ny) && blockAt(S, nx, ny) < 0 && !lairTarget(nx, ny);
        if (!free) return;
        S.blocks[bi] = [nx, ny];
        playSound(140, 0.08, "square", 0.04);
        game.moveCd = 0.18;
        if (!S.ok && platesDone(S)) setTimeout(() => lairSolved(L, "Os dois cristais encaixam nas placas. A parede de cristal se abre com um estalo limpo."), 150);
        return tmBase(dir);
      }
    }
    return tmBase(dir);
  };
  const tgtBase = targetAt;
  targetAt = function (x, y) {
    if (story()) {
      const l = lairOfZone(player.zone) && lairTarget(x, y);
      if (l) return l;
      const L = LAIRS[player.zone];
      if (L && !player.guards.includes(player.zone) && near(ZONES[player.zone].guardPos, x, y)) return `Entrar: ${L.n}`;
    }
    return tgtBase(x, y);
  };
  const iaBase = interactAt;
  interactAt = function (x, y) {
    if (story()) {
      if (lairOfZone(player.zone) && lairInteract(x, y)) return;
      const L = LAIRS[player.zone];
      if (L && !player.guards.includes(player.zone) && near(ZONES[player.zone].guardPos, x, y)) {
        const m = typeof sealMessage === "function" ? sealMessage(ZONES[player.zone]) : null;
        if (m) return say([["", m]]);
        return enterLair(L);
      }
    }
    return iaBase(x, y);
  };
  const cdBase = crewDrawList;
  crewDrawList = function (list, t) {
    cdBase(list, t);
    if (!story()) return;
    if (lairOfZone(player.zone)) {
      list.push({ y: -5, draw: () => drawLair(t) });
      list.push({ y: 999, draw: () => drawFog() });
    }
    if (LAIRS[player.zone]) list.push({ y: ZONES[player.zone].guardPos[1] + 0.02, draw: () => drawLairEntrance(t) });
  };
  const ezBase = enterZone;
  enterZone = function () {
    const r = ezBase.apply(this, arguments);
    const L = lairOfZone(player.zone);
    if (story() && L) lairApply(L);
    return r;
  };
  const updBase = update;
  update = function (dt) {
    updBase(dt);
    // Vencer o Guardião dentro do covil conta como libertar a região.
    for (const L of Object.values(LAIRS)) if (player.guards.includes(L.id) && !player.guards.includes(L.region)) player.guards.push(L.region);
    const L = lairOfZone(player.zone);
    if (!story() || !L || game.mode !== "world") return;
    const S = lairState(L);
    if (L.mech === "simon") simonTick(L, dt);
    if (S.ok || !inRoomA()) return;
    if (L.mech === "gust") {
      const gi = GUSTS.indexOf(player.x);
      if (gi >= 0 && gustOn(gi)) knockBack("Uma rajada te joga de volta para a entrada!");
      else if (player.x >= 18) lairSolved(L, "Você atravessa o corredor. Atrás de você, o vento uiva de raiva.");
    }
    if (L.mech === "tide") {
      if (tideHigh() && inFlood(player.x, player.y)) knockBack("A maré te arrasta de volta para a entrada!");
      else if (player.x >= 18) lairSolved(L, "Você chega ao outro lado, encharcad" + genderWord("o", "a", "e") + ". A água recua como se respirasse.");
    }
    if (L.mech === "fog" && player.x >= 18 && !S.ok) {
      S.ok = true;
      saveGame();
      toast("Você saiu da névoa. A Serpente está logo à frente.", 2600);
    }
  };

  // Cenas da runa: herói e vilão.
  guardianScene = function (type, rune) {
    return heroRuneScene(type, rune);
  };
  const pgBase = possessGuardian;
  possessGuardian = function (enemy, type) {
    if (lifeMode() || !VILLAIN_ECHO[type]) return pgBase(enemy, type);
    playSound(90, 0.8, "sawtooth", 0.05);
    playCine(villainRuneScene(type, enemy.rune), 7, () => pgBase(enemy, type));
  };
}
ACHIEVEMENTS.push(["covis", "Pelos covis", "Vença os cinco desafios dos covis dos Guardiões.", "flag", () => Object.values(LAIRS).every((L) => player.lairs && player.lairs[L.region] && player.lairs[L.region].ok)]);

// ---- Troca de runas Serpente ↔ Leviatã em saves antigos ----
// (a runa do mar agora fica com o Leviatã, na ilha do oceano)
(() => {
  const baseUpdate = update;
  update = function (dt) {
    if (player && player.order && player.order.length >= 6 && player.flags && !player.flags.ordV2) {
      player.flags.ordV2 = true;
      const g = player.guards || [];
      const freed = (r) => g.includes(r) || g.includes("covil-" + r);
      if (!freed("pantano") && !freed("porto")) {
        [player.order[2], player.order[5]] = [player.order[5], player.order[2]];
      }
    }
    return baseUpdate.apply(this, arguments);
  };
})();
