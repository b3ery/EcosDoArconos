/**
 * ECOS DO ARCANO — covis-camaras.js (modo História)
 * Cada covil agora é uma descida de 5 câmaras até o Guardião:
 *   Câmara 1: o desafio próprio do covil (sementes, névoa, ventos, blocos,
 *             maré ou lamparinas) + os 3 Ecos Perdidos.
 *   Câmaras 2 a 5: quatro destes desafios, numa ordem diferente em cada covil:
 *     - Labirinto: um labirinto escuro (o escuro aperta com as runas).
 *     - Alavancas da Runa: puxe as alavancas na ordem gravada na tábua.
 *     - Placas de Luz: acenda todas as placas; cada uma vira as vizinhas.
 *     - Vigias do Silêncio: atravesse sem ser tocado pelos vigias.
 *     - Arena dos Calados: vença as ondas de inimigos.
 *   O Guardião espera no fim da última câmara.
 * A dificuldade sobe com cada runa já libertada (nível de 0 a 5): labirinto
 * maior escuridão, sequências mais longas, mais placas, vigias mais rápidos,
 * mais ondas e inimigos mais fortes; a câmara 1 também endurece.
 * Modifica (envolve) funções de outros arquivos: applyPostBattleRewards,
 * crewDrawList, enterLair, interactAt, lairTarget, setTile (via lairApply),
 * simonPlay, startBattle, targetAt, update, walkable.
 */

"use strict";

/* ===================== DIFICULDADE ===================== */
const GUARD_REGIONS = ["bosque", "farol", "pantano", "picos", "mina", "porto"];
function lairTier() {
  const g = player.guards || [];
  return Math.min(5, GUARD_REGIONS.filter((r) => g.includes(r)).length);
}

/* ===================== AS CÂMARAS ===================== */
const CH_ORDER = {
  bosque: ["maze", "levers", "arena", "plates"],
  farol: ["levers", "watch", "maze", "arena"],
  pantano: ["plates", "maze", "watch", "arena"],
  picos: ["watch", "levers", "maze", "arena"],
  mina: ["plates", "arena", "maze", "levers"],
  porto: ["maze", "watch", "plates", "arena"],
};
const CH_INFO = {
  maze: { n: "O Labirinto", sub: "Todas as paredes são iguais. Quase todas.", hint: "Um labirinto. Ache a saída do outro lado. Quanto mais runas você já libertou, mais escuro ele fica." },
  levers: { n: "Alavancas da Runa", sub: "A ordem certa abre. A errada machuca.", hint: "Leia a tábua gravada perto da entrada: ela diz a ordem das alavancas. Errar a ordem dá um choque e recomeça." },
  plates: { n: "Placas de Luz", sub: "Uma luz acende a outra.", hint: "Toque nas placas para acendê-las. Cuidado: cada placa também vira as vizinhas (cima, baixo e lados). Acenda TODAS. A alavanca do canto recomeça." },
  watch: { n: "Vigias do Silêncio", sub: "Eles não dormem. Eles não piscam.", hint: "Vigias andam de um lado para o outro. Atravesse a sala sem que eles encostem em você, ou volta para o começo." },
  arena: { n: "Arena dos Calados", sub: "Só sai quem vence.", hint: "Pise no círculo do centro para chamar os inimigos. Vença todas as ondas para abrir a passagem." },
};
const CH_COUNT = 4;
const chId = (L, k) => `${L.id}-${k}`; // k = 2..5
const CHAMBER = {}; // id -> { L, k, mech }
function chamberOf(z) {
  return CHAMBER[z] || null;
}
function lairZones(L) {
  return [L.id, ...Array.from({ length: CH_COUNT }, (_, i) => chId(L, i + 2))];
}
function lairOfAny(z) {
  return lairOfZone(z) || (CHAMBER[z] && CHAMBER[z].L) || null;
}

/** Labirinto com semente (sempre o mesmo para cada câmara). */
function chMaze(m, seed) {
  let s = seed >>> 0 || 1;
  const rnd = () => ((s = (s * 1103515245 + 12345) >>> 0) / 4294967296);
  for (let y = 1; y <= 9; y++) for (let x = 2; x <= 18; x++) m[y][x] = "#";
  const CW = 9,
    CH = 5,
    seen = new Set(["0,2"]),
    stack = [[0, 2]];
  m[5][2] = ".";
  while (stack.length) {
    const [cx, cy] = stack[stack.length - 1];
    const nb = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dy]) => [cx + dx, cy + dy, dx, dy]).filter(([nx, ny]) => nx >= 0 && ny >= 0 && nx < CW && ny < CH && !seen.has(nx + "," + ny));
    if (!nb.length) {
      stack.pop();
      continue;
    }
    const [nx, ny, dx, dy] = nb[Math.floor(rnd() * nb.length)];
    m[1 + cy * 2 + dy][2 + cx * 2 + dx] = ".";
    m[1 + ny * 2][2 + nx * 2] = ".";
    seen.add(nx + "," + ny);
    stack.push([nx, ny]);
  }
}
function genChamber(L, k, mech) {
  const { w, h } = LAIR;
  const id = chId(L, k);
  const m = makeGrid(w, h, (x, y) => (x === 0 || y === 0 || x === w - 1 || y === h - 1 ? "#" : "."));
  for (let y = 1; y < h - 1; y++) m[y][LAIR.door[0]] = "#";
  for (let y = 1; y < h - 1; y++) if (y !== 5) m[y][1] = "#";
  if (mech === "maze") chMaze(m, [...id].reduce((a, c) => a * 31 + c.charCodeAt(0), 7));
  m[LAIR.door[1]][LAIR.door[0]] = "#";
  const last = k === CH_COUNT + 1;
  if (last) m[LAIR.guard[1]][LAIR.guard[0]] = "G";
  ZONE_DEFS[id] = { nome: `${L.n} · ${CH_INFO[mech].n}`, theme: L.theme, exits: {}, enemies: [], guard: last ? L.guard : undefined };
  const z = finalize(id, ZONE_DEFS[id], m, w, h, {}, {}, null);
  z.town = { bld: [], doors: {}, stalls: {}, huts: [], arrive: LAIR.spawn.slice(), horses: [], boats: [], yard: true };
  ZONES[id] = z;
  CHAMBER[id] = { L, k, mech, last };
}
for (const L of Object.values(LAIRS)) {
  CH_ORDER[L.region].forEach((mech, i) => genChamber(L, i + 2, mech));
  // a câmara 1 não tem mais o Guardião: no lugar dele, a escada para baixo
  setTile(L.id, LAIR.guard[0], LAIR.guard[1], ".");
  if (ZONE_DEFS[L.id]) ZONE_DEFS[L.id].guard = undefined;
  ZONES[L.id].guard = undefined;
}

/* ===================== ESTADO ===================== */
function chState(id) {
  player.chambers = player.chambers || {};
  return (player.chambers[id] = player.chambers[id] || { ok: false, seen: false });
}
const chFreed = (L) => player.guards.includes(L.region) || player.guards.includes(L.id);
function chOpen(id) {
  if (typeof DEV !== "undefined" && DEV) return true;
  const C = CHAMBER[id];
  return chState(id).ok || (C && chFreed(C.L));
}
function chApply(id) {
  setTile(id, LAIR.door[0], LAIR.door[1], chOpen(id) ? "." : "#");
}
function chSolved(id, msg) {
  const S = chState(id);
  if (S.ok) return;
  S.ok = true;
  chApply(id);
  gainXP(60 + 15 * lairTier());
  saveGame();
  if (!settings.calm) game.shake = 0.3;
  [523, 659, 784].forEach((f, i) => setTimeout(() => playSound(f, 0.2, "triangle", 0.05), i * 110));
  const C = CHAMBER[id];
  say([["", msg], ["", C.last ? `A última porta se abre. ${["serpente", "fenixf"].includes(C.L.guard) ? "A" : "O"} ${ENEMIES[C.L.guard].nome} espera lá dentro.` : "A passagem se abre. A escada desce para a próxima câmara."]]);
}

/* ===================== IR E VOLTAR ===================== */
function goChamber(id, at) {
  const C = CHAMBER[id];
  player.zone = id;
  [player.x, player.y] = at || LAIR.spawn;
  player.rx = player.x;
  player.ry = player.y;
  player.dir = "right";
  game.fade = 1;
  game.autoPath = null;
  enterZone(true);
  chApply(id);
  chReset(id);
  const S = chState(id);
  if (!S.seen) {
    S.seen = true;
    saveGame();
    const I = CH_INFO[C.mech];
    playCine(chapterCard(`Câmara ${C.k} de 5`, I.n, I.sub), 3, () => say([["", I.hint + (lairTier() ? ` (Dificuldade ${lairTier() + 1} de 6: ela sobe a cada runa libertada.)` : "")]]));
  }
}
function nextZoneOf(z) {
  const L = lairOfAny(z);
  if (!L) return null;
  const k = CHAMBER[z] ? CHAMBER[z].k : 1;
  return k <= CH_COUNT ? chId(L, k + 1) : null;
}
function prevZoneOf(z) {
  const C = CHAMBER[z];
  if (!C) return null;
  return C.k === 2 ? C.L.id : chId(C.L, C.k - 1);
}

/* ===================== OS DESAFIOS ===================== */
const LEVER = { tab: [3, 2], pos: [[6, 2], [10, 2], [14, 2], [6, 8], [10, 8], [14, 8]] };
const LEVER_RUNES = ["fogo", "agua", "ar", "terra", "luz", "sombra"];
const ARENA = { sigil: [10, 5] };
const PL = { reset: [3, 8] };
function plGrid(id) {
  const n = lairTier() >= 3 ? 4 : 3;
  const cells = [];
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) cells.push([6 + i * 2 + (n === 3 ? 1 : 0), 2 + j * 2 + (n === 3 ? 1 : 0)]);
  return { n, cells };
}
function chReset(id) {
  const C = CHAMBER[id],
    S = chState(id);
  if (S.ok) return;
  const t = lairTier();
  game.ch = { id, t0: game.t };
  if (C.mech === "levers") {
    const len = Math.min(6, 3 + Math.ceil(t / 2));
    if (!S.seq || S.seq.length !== len) {
      const pool = [0, 1, 2, 3, 4, 5].sort(() => Math.random() - 0.5);
      S.seq = pool.slice(0, len);
    }
    S.pos = 0;
  }
  if (C.mech === "plates") {
    const G = plGrid(id);
    if (!S.lit || S.lit.length !== G.cells.length) {
      // parte de tudo aceso e aperta placas ao acaso: sempre tem solução
      S.lit = G.cells.map(() => true);
      const presses = 4 + t;
      for (let p = 0; p < presses; p++) plPress(S, G, Math.floor(Math.random() * G.cells.length));
      if (S.lit.every(Boolean)) plPress(S, G, 0);
      S.start = S.lit.slice();
    }
  }
  if (C.mech === "arena") S.left = S.left || 0;
}
function plPress(S, G, i) {
  const x = i % G.n,
    y = Math.floor(i / G.n);
  for (const [dx, dy] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const nx = x + dx,
      ny = y + dy;
    if (nx >= 0 && ny >= 0 && nx < G.n && ny < G.n) S.lit[ny * G.n + nx] = !S.lit[ny * G.n + nx];
  }
}
// Vigias: andam na vertical em colunas, cada um com o seu ritmo.
function watchers() {
  const t = lairTier();
  const cols = t >= 3 ? [4, 6, 8, 10, 12, 14, 16] : t >= 1 ? [5, 8, 11, 14, 17] : [6, 10, 14];
  const speed = 2.2 + 0.5 * t;
  return cols.map((x, i) => {
    const ph = game.t * speed / 8 + i * 0.37;
    const k = ph % 2,
      y = 1 + (k < 1 ? k : 2 - k) * 8;
    return [x, y];
  });
}

/* ===================== ALVOS E INTERAÇÃO ===================== */
function chTarget(x, y) {
  const C = chamberOf(player.zone);
  if (!C) return null;
  const S = chState(player.zone);
  if (near(LAIR.exit, x, y)) return "Voltar à câmara anterior";
  if (!C.last && near(LAIR.guard, x, y)) return "Descer para a próxima câmara";
  if (near(LAIR.door, x, y) && !chOpen(player.zone)) return "Passagem fechada";
  if (C.mech === "levers") {
    if (near(LEVER.tab, x, y)) return "Ler a tábua gravada";
    if (LEVER.pos.some((p) => near(p, x, y))) return S.ok ? "Alavanca" : "Puxar a alavanca";
  }
  if (C.mech === "plates") {
    if (near(PL.reset, x, y)) return "Recomeçar as placas";
    if (plGrid(player.zone).cells.some((p) => near(p, x, y))) return S.ok ? "Placa acesa" : "Tocar na placa";
  }
  if (C.mech === "arena" && near(ARENA.sigil, x, y) && !S.ok) return "Chamar os inimigos";
  return null;
}
function chInteract(x, y) {
  const id = player.zone,
    C = chamberOf(id),
    S = C && chState(id),
    l = chTarget(x, y);
  if (!l) return false;
  if (l === "Voltar à câmara anterior") {
    if (C.last && chFreed(C.L)) return leaveLair(C.L), true;
    const p = prevZoneOf(id);
    if (p === C.L.id) {
      player.zone = p;
      [player.x, player.y] = [LAIR.guard[0] - 1, LAIR.guard[1]];
      player.rx = player.x;
      player.ry = player.y;
      game.fade = 1;
      enterZone(true);
      lairApply(C.L);
    } else goChamber(p, [LAIR.guard[0] - 1, LAIR.guard[1]]);
    return true;
  }
  if (l === "Descer para a próxima câmara") return goChamber(nextZoneOf(id)), true;
  if (l === "Passagem fechada") return say([["", "Uma parede de pedra viva fecha a passagem. Vença o desafio desta câmara para ela se abrir."]]), true;
  if (C.mech === "levers") {
    if (l === "Ler a tábua gravada") {
      const seq = S.seq.map((i) => RUNES[LEVER_RUNES[i]].nome);
      const rev = lairTier() >= 3;
      return say([["", `Na tábua, símbolos gravados ${rev ? "DE TRÁS PARA FRENTE (comece pelo último)" : "em ordem"}: ${(rev ? seq.slice().reverse() : seq).join(" → ")}.`]]), true;
    }
    if (l === "Puxar a alavanca") {
      const i = LEVER.pos.findIndex((p) => near(p, x, y));
      playSound(300 + i * 60, 0.15, "square", 0.04);
      if (S.seq[S.pos] === i) {
        S.pos++;
        game.leverFlash = { i, t: game.t };
        if (S.pos >= S.seq.length) chSolved(id, "As alavancas travam no lugar com um estalo. O símbolo da tábua se acende.");
        else toast(`Certo! (${S.pos}/${S.seq.length})`, 1000);
      } else {
        S.pos = 0;
        const dmg = Math.max(1, Math.round(maxHp() * (0.05 + 0.02 * lairTier())));
        player.hp = Math.max(1, player.hp - dmg);
        if (!settings.calm) game.shake = 0.3;
        playSound(110, 0.3, "sawtooth", 0.05);
        say([["", `Ordem errada! Um choque de silêncio sobe pela alavanca: -${dmg} HP. Tudo volta ao começo.`]]);
      }
    }
    return true;
  }
  if (C.mech === "plates") {
    const G = plGrid(id);
    if (l === "Recomeçar as placas") {
      S.lit = (S.start || S.lit).slice();
      playSound(200, 0.2, "square", 0.04);
      return toast("As placas voltam como estavam.", 1400), true;
    }
    if (l === "Tocar na placa") {
      const i = G.cells.findIndex((p) => near(p, x, y));
      plPress(S, G, i);
      playSound(S.lit[i] ? 660 : 330, 0.12, "triangle", 0.04);
      if (S.lit.every(Boolean)) chSolved(id, "Todas as placas brilham ao mesmo tempo. A sala inteira se ilumina.");
    }
    return true;
  }
  if (C.mech === "arena" && l === "Chamar os inimigos") {
    const waves = 2 + Math.ceil(lairTier() / 2);
    S.left = waves;
    arenaNext(id);
    return true;
  }
  return true;
}
function arenaNext(id) {
  const C = CHAMBER[id],
    S = chState(id);
  const foes = (typeof SHARD_FOES !== "undefined" && SHARD_FOES[C.L.region]) || ["espectro"];
  const type = foes[S.left % foes.length];
  game.arenaFight = { id };
  say([["", `Onda ${2 + Math.ceil(lairTier() / 2) - S.left + 1}: ${ENEMIES[type].nome} sai das sombras!`]], () => startBattle(type, null));
}

/* ===================== DESENHO ===================== */
function drawChamber(t) {
  const id = player.zone,
    C = chamberOf(id);
  if (!C) return;
  const S = chState(id),
    T = TILE;
  ctx.fillStyle = "#0a0810";
  ctx.fillRect(LAIR.exit[0] * T + 2, LAIR.exit[1] * T + 2, 28, 28);
  if (!chOpen(id)) {
    ctx.fillStyle = "#5a5048";
    ctx.fillRect(LAIR.door[0] * T, LAIR.door[1] * T, T, T);
    ctx.fillStyle = `rgba(180,140,255,${0.3 + 0.2 * Math.sin(t * 3)})`;
    ctx.fillRect(LAIR.door[0] * T + 12, LAIR.door[1] * T + 6, 8, 20);
  }
  if (!C.last) drawStairs(t);
  if (C.mech === "levers") {
    const [tx, ty] = LEVER.tab;
    ctx.fillStyle = "#6a6070";
    ctx.fillRect(tx * T + 4, ty * T + 4, 24, 22);
    ctx.fillStyle = "#c8b8e8";
    for (let i = 0; i < 3; i++) ctx.fillRect(tx * T + 8, ty * T + 9 + i * 5, 16, 2);
    LEVER.pos.forEach(([x, y], i) => {
      const on = S.ok || (game.leverFlash && game.leverFlash.i === i && game.t - game.leverFlash.t < 0.5);
      ctx.fillStyle = "#4a3a2a";
      ctx.fillRect(x * T + 8, y * T + 20, 16, 8);
      ctx.strokeStyle = on ? "#ffe08a" : "#b8a080";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x * T + 16, y * T + 22);
      ctx.lineTo(x * T + (on ? 24 : 10), y * T + 6);
      ctx.stroke();
      glyph(LEVER_RUNES[i], x * T + 16, y * T - 4, 7, 0.9);
    });
    if (!S.ok && S.seq) {
      ctx.fillStyle = "#ffe08a";
      ctx.font = '600 12px "Pixelify Sans", sans-serif';
      ctx.textAlign = "center";
      ctx.fillText(`${S.pos}/${S.seq.length}`, 10 * T, 0.8 * T);
    }
  }
  if (C.mech === "plates") {
    const G = plGrid(id);
    G.cells.forEach(([x, y], i) => {
      const lit = S.ok || (S.lit && S.lit[i]);
      ctx.fillStyle = lit ? "#ffe08a" : "#3a3048";
      ctx.fillRect(x * T + 4, y * T + 4, T - 8, T - 8);
      ctx.strokeStyle = lit ? "#fff6c8" : "#6a5a88";
      ctx.lineWidth = 2;
      ctx.strokeRect(x * T + 4, y * T + 4, T - 8, T - 8);
      if (lit) {
        ctx.fillStyle = `rgba(255,224,138,${0.15 + 0.1 * Math.sin(t * 4 + i)})`;
        ctx.fillRect(x * T - 4, y * T - 4, T + 8, T + 8);
      }
    });
    const [rx, ry] = PL.reset;
    ctx.fillStyle = "#6a5a48";
    ctx.fillRect(rx * T + 8, ry * T + 18, 16, 8);
    ctx.fillStyle = "#c8a060";
    ctx.fillRect(rx * T + 14, ry * T + 4, 3, 16);
  }
  if (C.mech === "watch" && !S.ok) {
    for (const [x, y] of watchers()) {
      const X = x * T + 16,
        Y = y * T + 16;
      ctx.fillStyle = "rgba(150,70,220,.25)";
      ctx.beginPath();
      ctx.arc(X, Y, 18, 0, 7);
      ctx.fill();
      ctx.fillStyle = "#3a2050";
      ctx.beginPath();
      ctx.arc(X, Y, 10, 0, 7);
      ctx.fill();
      ctx.fillStyle = "#e0c8ff";
      ctx.fillRect(X - 5, Y - 3, 3, 3);
      ctx.fillRect(X + 2, Y - 3, 3, 3);
    }
  }
  if (C.mech === "arena") {
    const [x, y] = ARENA.sigil;
    ctx.strokeStyle = S.ok ? "rgba(255,224,138,.5)" : `rgba(220,80,80,${0.5 + 0.3 * Math.sin(t * 3)})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x * T + 16, y * T + 16, 26, 0, 7);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x * T + 16, y * T + 16, 14, 0, 7);
    ctx.stroke();
  }
}
function drawStairs(t) {
  const [x, y] = LAIR.guard,
    T = TILE;
  ctx.fillStyle = "#1a1420";
  ctx.fillRect(x * T + 2, y * T + 2, 28, 28);
  ctx.fillStyle = "#5a5068";
  for (let i = 0; i < 4; i++) ctx.fillRect(x * T + 4 + i * 2, y * T + 6 + i * 6, 24 - i * 4, 3);
  ctx.fillStyle = `rgba(180,140,255,${0.2 + 0.15 * Math.sin(t * 3)})`;
  ctx.fillRect(x * T + 2, y * T + 2, 28, 28);
}
function drawMazeDark() {
  const C = chamberOf(player.zone);
  if (!C || C.mech !== "maze" || chState(player.zone).ok || player.x >= LAIR.door[0]) return;
  const t = lairTier();
  if (t < 1) return;
  const T = TILE,
    px = player.rx * T + 16,
    py = player.ry * T + 16,
    r = T * Math.max(2.4, 5 - 0.6 * t);
  ctx.save();
  ctx.fillStyle = "rgba(4,3,8,.94)";
  ctx.beginPath();
  ctx.rect(0, 0, LAIR.door[0] * T, LAIR.h * T);
  ctx.arc(px, py, r, 0, Math.PI * 2, true);
  ctx.fill("evenodd");
  ctx.restore();
}

/* ===================== LIGAÇÕES ===================== */
(() => {
  // Câmara 1: a escada no lugar do Guardião.
  const ltBase = lairTarget;
  lairTarget = function (x, y) {
    const L = lairOfZone(player.zone);
    if (L && near(LAIR.guard, x, y)) return "Descer para a próxima câmara";
    return ltBase(x, y);
  };
  const liBase = lairInteract;
  lairInteract = function (x, y) {
    const L = lairOfZone(player.zone);
    if (L && near(LAIR.guard, x, y)) return goChamber(chId(L, 2)), true;
    return liBase(x, y);
  };
  const dlBase = drawLair;
  drawLair = function (t) {
    dlBase(t);
    if (lairOfZone(player.zone)) drawStairs(t);
  };

  const tgBase = targetAt;
  targetAt = function (x, y) {
    if (story() && chamberOf(player.zone)) {
      const l = chTarget(x, y);
      if (l) return l;
    }
    return tgBase(x, y);
  };
  const iaBase = interactAt;
  interactAt = function (x, y) {
    if (story() && chamberOf(player.zone) && chInteract(x, y)) return;
    return iaBase(x, y);
  };
  const wkBase = walkable;
  walkable = function (z, x, y) {
    if (CHAMBER[z] && z === player.zone) {
      const l = chTarget(x, y);
      if (l && l !== "Passagem fechada") return false;
    }
    return wkBase(z, x, y);
  };
  const cdBase = crewDrawList;
  crewDrawList = function (list, t) {
    cdBase(list, t);
    if (story() && chamberOf(player.zone)) {
      list.push({ y: -5, draw: () => drawChamber(t) });
      list.push({ y: 999, draw: () => drawMazeDark() });
    }
  };
  const ezBase = enterZone;
  enterZone = function () {
    const r = ezBase.apply(this, arguments);
    if (CHAMBER[player.zone]) chApply(player.zone);
    return r;
  };

  // Desafios que correm no tempo: labirinto e vigias.
  const upBase = update;
  update = function (dt) {
    const r = upBase.apply(this, arguments);
    if (!story() || !player) return r;
    // Vencer o Guardião na última câmara conta para o covil e para a região.
    for (const [id, C] of Object.entries(CHAMBER)) if (C.last && player.guards.includes(id) && !player.guards.includes(C.L.id)) player.guards.push(C.L.id);
    const C = chamberOf(player.zone);
    if (game.arenaFight && game.arenaFight.started && !battle && game.mode === "world") {
      // perdeu ou fugiu da arena: recomeça
      const S = chState(game.arenaFight.id);
      if (!S.ok) S.left = 0;
      game.arenaFight = null;
    }
    if (!C || game.mode !== "world" || game.dialog) return r;
    const S = chState(player.zone);
    if (S.ok || player.x >= LAIR.door[0]) return r;
    if (C.mech === "maze" && player.x >= 18) chSolved(player.zone, "Você acha a saída do labirinto. Atrás de você, as paredes rangem como se quisessem te segurar.");
    if (C.mech === "watch") {
      const hit = watchers().some(([wx, wy]) => wx === player.x && Math.abs(wy - player.y) < 0.75);
      if (hit) knockBack("Um vigia do Silêncio te tocou! De volta ao começo.");
      else if (player.x >= 18) chSolved(player.zone, "Você passa pelo último vigia. Eles param e olham para você... e voltam a andar.");
    }
    return r;
  };

  // Arena: cada vitória chama a próxima onda.
  const sbBase = startBattle;
  startBattle = function () {
    const r = sbBase.apply(this, arguments);
    const A = game.arenaFight;
    if (A && !A.started && battle && battle.e && !battle.e.boss) {
      A.started = true;
      const k = 1 + 0.12 * lairTier();
      battle.e.max = Math.round(battle.e.max * 1.3 * k);
      battle.e.hp = battle.e.max;
      battle.e.atk *= 1.15 * k;
      battle.e.nome = `${battle.e.nome} da Arena`;
    }
    return r;
  };
  const prBase = applyPostBattleRewards;
  applyPostBattleRewards = function () {
    const A = game.arenaFight;
    const r = prBase.apply(this, arguments);
    if (A && A.started) {
      game.arenaFight = null;
      const S = chState(A.id);
      S.left = Math.max(0, (S.left || 1) - 1);
      saveGame();
      if (S.left > 0 && player.zone === A.id) setTimeout(() => game.mode === "world" && arenaNext(A.id), 1400);
      else if (player.zone === A.id) setTimeout(() => chSolved(A.id, "O último inimigo cai. O círculo da arena se apaga, e a parede do fundo se abre."), 1200);
    }
    return r;
  };
  // O nome do Silenciado / guarda dos Ecos fica mais forte com o nível.
  const sb2 = startBattle;
  startBattle = function () {
    const r = sb2.apply(this, arguments);
    if (battle && battle.shardFight && !battle.tierDone) {
      battle.tierDone = true;
      const k = 1 + 0.1 * lairTier();
      battle.e.max = Math.round(battle.e.max * k);
      battle.e.hp = battle.e.max;
      battle.e.atk *= k;
    }
    return r;
  };

  // A câmara 1 endurece com o nível.
  const elBase = enterLair;
  enterLair = function (L) {
    const t = lairTier();
    TIDE.period = Math.max(3, 4.6 - 0.25 * t);
    LAMPS.life = Math.max(4.5, 7.5 - 0.5 * t);
    return elBase.apply(this, arguments);
  };
  const spBase = simonPlay;
  simonPlay = function (L) {
    const S = lairState(L);
    const len = Math.min(10, 5 + lairTier());
    if (!S.seq || S.seq.length !== len) S.seq = Array.from({ length: len }, () => Math.floor(Math.random() * 4));
    return spBase.apply(this, arguments);
  };
})();

/* ---- a seta e as missões acompanham as câmaras ---- */
{
  const byStep = { ent: "bosque", serp: "pantano", grif: "picos", basil: "mina", levi: "porto", porto2: "farol" };
  for (const s of STEPS) {
    const reg = byStep[s.id];
    if (!reg) continue;
    const L = Object.values(LAIRS).find((x) => x.region === reg);
    const z0 = Object.getOwnPropertyDescriptor(s, "zone"),
      p0 = s.pos;
    const zones = lairZones(L);
    Object.defineProperty(s, "zone", {
      get: () => (zones.includes(player.zone) ? player.zone : z0.get ? z0.get.call(s) : z0.value),
      configurable: true,
      enumerable: true,
    });
    s.pos = () => (zones.includes(player.zone) ? LAIR.guard : p0.call(s));
  }
}
