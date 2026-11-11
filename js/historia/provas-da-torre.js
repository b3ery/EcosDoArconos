/**
 * ECOS DO ARCANO — provas-da-torre.js (modo História, capítulo final)
 * A Antessala do Silêncio: três provas no mapa, no estilo da Cripta dos Ecos,
 * antes da sala do Silenciador. Uma porta de silêncio separa cada sala.
 *  1. Os Sinos do Silêncio: quatro sinos (Árvore, Névoa, Pedra e Onda).
 *     Toque na ordem da inscrição. Errou, todos se calam.
 *  2. Os Espelhos de Luz: um feixe de luz de verdade sai da lanterna e reflete
 *     em seis espelhos (/ ou \). Gire os certos até a luz acertar o cristal.
 *  3. As Lajes do Silêncio: dezesseis lajes. Pise em todas, uma vez só cada.
 *     Pisou numa já acesa, todas se apagam.
 * Vencidas as três, a porta se abre para a sala mais funda da Torre.
 * A entrada é um arco selado dentro da Torre do Silêncio.
 * Modifica (envolve) funções de outros arquivos: characterAt, crewDrawList,
 * enterZone, interactAt, targetAt, update.
 */

"use strict";

ZONE_DEFS.provas = { nome: "Antessala do Silêncio", theme: "torre", exits: {}, enemies: [] };
const TRIAL = {
  w: 41,
  h: 11,
  exit: [2, 9],
  spawn: [2, 8],
  door1: [13, 5],
  door2: [27, 5],
  stone: [6, 5],
  bells: [
    { p: [3, 3], n: "Pedra", c: "#a08a70" },
    { p: [10, 3], n: "Névoa", c: "#bcd4e0" },
    { p: [3, 7], n: "Onda", c: "#4a90e0" },
    { p: [10, 7], n: "Árvore", c: "#6ac060" },
  ],
  bellOrder: [3, 1, 0, 2], // Árvore, Névoa, Pedra, Onda
  room2: [14, 26],
  src: [14, 2],
  crystal: [15, 9],
  mirrors: [
    [18, 2, "/"],
    [18, 6, "/"],
    [23, 6, "/"],
    [23, 9, "\\"],
    [21, 2, "/"],
    [16, 6, "\\"],
  ],
  corridor: [28, 5],
  plates: { x0: 29, y0: 3, w: 4, h: 4 },
};
function genTrials() {
  const { w, h } = TRIAL;
  const m = makeGrid(w, h, (x, y) => (x === 0 || y === 0 || x === w - 1 || y === h - 1 ? "#" : "."));
  for (let y = 1; y < h - 1; y++) m[y][TRIAL.door1[0]] = m[y][TRIAL.door2[0]] = "#";
  // Sala 3: só o corredor e as lajes.
  const P = TRIAL.plates;
  for (let y = 1; y < h - 1; y++)
    for (let x = TRIAL.door2[0] + 1; x < w - 1; x++) {
      const inPlates = x >= P.x0 && x < P.x0 + P.w && y >= P.y0 && y < P.y0 + P.h;
      m[y][x] = inPlates || (x === TRIAL.corridor[0] && y === TRIAL.corridor[1]) ? "." : "#";
    }
  const z = finalize("provas", ZONE_DEFS.provas, m, w, h, {}, {}, null);
  z.town = { bld: [], doors: {}, stalls: {}, huts: [], arrive: TRIAL.spawn.slice(), horses: [], boats: [], yard: true };
  return z;
}
ZONES.provas = genTrials();
function trials() {
  return (player.provas = player.provas || { rung: [], sinos: false, mir: TRIAL.mirrors.map((m) => m[2]), espelhos: false, lit: [], lajes: false, visto: false, viuLajes: false });
}
function trialsApply() {
  const S = trials();
  setTile("provas", TRIAL.door1[0], TRIAL.door1[1], S.sinos ? "." : "#");
  setTile("provas", TRIAL.door2[0], TRIAL.door2[1], S.espelhos ? "." : "#");
}
const trialEntrance = () => spotOf("torre", "provas");
function enterTrials() {
  trialsApply();
  game.trialBack = { x: player.x, y: player.y };
  player.zone = "provas";
  [player.x, player.y] = TRIAL.spawn;
  player.rx = player.x;
  player.ry = player.y;
  player.dir = "up";
  game.fade = 1;
  enterZone(true);
  const S = trials();
  if (!S.visto) {
    S.visto = true;
    saveGame();
    say([
      ["", "Atrás do arco, uma antessala fria. O silêncio aqui é tão denso que dá para ouvir o próprio coração."],
      ["", "Três portas de silêncio fecham o caminho. Cada uma pede uma prova."],
    ]);
  }
}
function leaveTrials() {
  const b = game.trialBack || { x: (trialEntrance() || [22, 3])[0], y: (trialEntrance() || [22, 3])[1] + 1 };
  player.zone = "torre";
  [player.x, player.y, player.rx, player.ry] = [b.x, b.y, b.x, b.y];
  game.fade = 1;
  enterZone(true);
}

/* ----- Feixe de luz ----- */
const DIRS = { E: [1, 0], W: [-1, 0], N: [0, -1], S: [0, 1] };
const BOUNCE = { "/": { E: "N", N: "E", W: "S", S: "W" }, "\\": { E: "S", S: "E", W: "N", N: "W" } };
/** Caminho da luz: lista de casas e se acertou o cristal. */
function traceBeam(mir) {
  const S = mir || trials().mir;
  let [x, y] = TRIAL.src,
    d = "E";
  const path = [[x, y]];
  for (let k = 0; k < 200; k++) {
    x += DIRS[d][0];
    y += DIRS[d][1];
    if (x < TRIAL.room2[0] || x > TRIAL.room2[1] || y < 1 || y > TRIAL.h - 2) break;
    path.push([x, y]);
    if (near(TRIAL.crystal, x, y)) return { path, hit: true };
    const mi = TRIAL.mirrors.findIndex((m) => m[0] === x && m[1] === y);
    if (mi >= 0) d = BOUNCE[S[mi]][d];
  }
  return { path, hit: false };
}

/* ----- Lajes ----- */
const plateKey = (x, y) => `${x},${y}`;
function onPlate(x, y) {
  const P = TRIAL.plates;
  return x >= P.x0 && x < P.x0 + P.w && y >= P.y0 && y < P.y0 + P.h;
}
function stepPlate(x, y) {
  const S = trials();
  if (S.lajes || !onPlate(x, y)) return;
  const k = plateKey(x, y);
  if (S.lit.includes(k)) {
    S.lit = [k];
    playSound(110, 0.3, "sawtooth", 0.04);
    if (!settings.calm) game.shake = 0.2;
    toast("As lajes se apagam. Só esta continua acesa: comece daqui.", 2600);
    return;
  }
  S.lit.push(k);
  playSound(500 + S.lit.length * 40, 0.08, "triangle", 0.04);
  if (S.lit.length >= TRIAL.plates.w * TRIAL.plates.h) {
    S.lajes = true;
    saveGame();
    gainXP(120);
    if (!settings.calm) game.shake = 0.4;
    [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => playSound(f, 0.25, "triangle", 0.05), i * 120));
    say(
      [
        ["", "As dezesseis lajes brilham juntas. O chão inteiro canta uma nota só."],
        ["", "A última porta de silêncio se desfaz. Atrás dela, uma escada desce para a sala mais funda da Torre."],
        ["", "Prova vencida! +120 XP. O Silenciador espera."],
      ],
      goToSilencer,
    );
  }
}
function goToSilencer() {
  player.zone = "torre";
  const g = ZONES.torre.guardPos;
  const opts = [[0, -1], [-1, 0], [1, 0], [0, 1]];
  for (const [dx, dy] of opts)
    if (walkable("torre", g[0] + dx, g[1] + dy)) {
      [player.x, player.y] = [g[0] + dx, g[1] + dy];
      break;
    }
  player.rx = player.x;
  player.ry = player.y;
  game.fade = 1;
  enterZone(true);
}

/* ----- O que tem em cada casa ----- */
function trialTarget(x, y) {
  const S = trials();
  if (near(TRIAL.exit, x, y)) return "Voltar para a Torre";
  if (near(TRIAL.stone, x, y)) return "Ler a inscrição";
  const bi = TRIAL.bells.findIndex((b) => near(b.p, x, y));
  if (bi >= 0) return S.sinos ? `Sino da ${TRIAL.bells[bi].n} (calado)` : `Tocar o sino da ${TRIAL.bells[bi].n}`;
  const mi = TRIAL.mirrors.findIndex((m) => m[0] === x && m[1] === y);
  if (mi >= 0) return S.espelhos ? "Espelho" : "Girar o espelho";
  if (near(TRIAL.src, x, y)) return "Lanterna de luz";
  if (near(TRIAL.crystal, x, y)) return S.espelhos ? "Cristal aceso" : "Cristal apagado";
  if ((near(TRIAL.door1, x, y) && !S.sinos) || (near(TRIAL.door2, x, y) && !S.espelhos)) return "Porta de silêncio";
  return null;
}
function trialInteract(x, y) {
  const S = trials();
  const l = trialTarget(x, y);
  if (!l) return false;
  if (l === "Voltar para a Torre") return leaveTrials(), true;
  if (l === "Ler a inscrição")
    return say([["", "\"Primeiro, a voz que mora na madeira. Depois, a que se esconde no brejo. A terceira grita do alto das pedras. A última canta no sal do mar.\""]]), true;
  if (l === "Porta de silêncio") return say([["", "Uma porta feita de silêncio. A mão atravessa, mas o corpo não. Ela só se abre com a prova desta sala."]]), true;
  if (l.startsWith("Tocar o sino")) {
    const bi = TRIAL.bells.findIndex((b) => near(b.p, x, y));
    if (S.rung.includes(bi)) return true;
    S.rung.push(bi);
    playSound([392, 523, 330, 440][bi], 0.6, "sine", 0.06);
    const ok = S.rung.every((v, i) => v === TRIAL.bellOrder[i]);
    if (!ok) {
      S.rung = [];
      if (!settings.calm) game.shake = 0.2;
      setTimeout(() => playSound(80, 0.5, "sawtooth", 0.03), 250);
      say([["", "Os quatro sinos se calam de uma vez. O silêncio volta, mais pesado. A ordem estava errada."]]);
    } else if (S.rung.length === 4) {
      S.sinos = true;
      trialsApply();
      gainXP(100);
      if (!settings.calm) game.shake = 0.3;
      say([["", "Os sinos tocam juntos: Árvore, Névoa, Pedra e Onda. A primeira porta de silêncio se desfaz! +100 XP."]]);
    }
    saveGame();
    return true;
  }
  if (l === "Girar o espelho") {
    const mi = TRIAL.mirrors.findIndex((m) => m[0] === x && m[1] === y);
    S.mir[mi] = S.mir[mi] === "/" ? "\\" : "/";
    playSound(300 + mi * 50, 0.06, "square", 0.03);
    if (traceBeam().hit) {
      S.espelhos = true;
      trialsApply();
      gainXP(100);
      if (!settings.calm) game.shake = 0.3;
      say([["", "A luz pula de espelho em espelho e acerta o cristal em cheio! A segunda porta de silêncio se desfaz. +100 XP."]]);
    }
    saveGame();
    return true;
  }
  if (l === "Lanterna de luz") return say([["", "Uma lanterna que nunca se apaga. A luz dela segue reta até bater num espelho."]]), true;
  if (l.startsWith("Cristal")) return say([["", S.espelhos ? "O cristal brilha forte." : "Um cristal apagado. Ele espera a luz chegar até ele."]]), true;
  return true;
}

/* ----- Desenho ----- */
function drawTrials(t) {
  const S = trials(),
    T = TILE;
  // Inscrição e saída
  ctx.fillStyle = "#8a8098";
  ctx.fillRect(TRIAL.stone[0] * T + 8, TRIAL.stone[1] * T + 4, 16, 24);
  ctx.fillStyle = "#3a3048";
  for (let i = 0; i < 4; i++) ctx.fillRect(TRIAL.stone[0] * T + 10, TRIAL.stone[1] * T + 8 + i * 4, 12, 2);
  ctx.fillStyle = "#1a1420";
  ctx.fillRect(TRIAL.exit[0] * T + 4, TRIAL.exit[1] * T + 2, 24, 28);
  // Sinos
  TRIAL.bells.forEach((b, i) => {
    const X = b.p[0] * T,
      Y = b.p[1] * T,
      on = S.sinos || S.rung.includes(i);
    ctx.fillStyle = "#3a3040";
    ctx.fillRect(X + 4, Y + 2, 24, 3);
    ctx.fillRect(X + 6, Y + 2, 2, 26), ctx.fillRect(X + 24, Y + 2, 2, 26);
    const sw = on ? Math.sin(t * 8 + i) * 2 : 0;
    ctx.fillStyle = b.c;
    ctx.beginPath();
    ctx.moveTo(X + 16 + sw, Y + 7);
    ctx.lineTo(X + 23 + sw, Y + 22);
    ctx.lineTo(X + 9 + sw, Y + 22);
    ctx.closePath();
    ctx.fill();
    if (on) {
      ctx.strokeStyle = `rgba(255,240,180,${0.4 + 0.4 * Math.sin(t * 5 + i)})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(X + 16, Y + 16, 13, 0, 7);
      ctx.stroke();
    }
  });
  // Lanterna, feixe, espelhos e cristal
  const beam = traceBeam();
  ctx.strokeStyle = `rgba(255,236,150,${0.65 + 0.3 * Math.sin(t * 7)})`;
  ctx.lineWidth = 3;
  ctx.beginPath();
  beam.path.forEach(([x, y], i) => (i ? ctx.lineTo(x * T + 16, y * T + 16) : ctx.moveTo(x * T + 16, y * T + 16)));
  ctx.stroke();
  ctx.fillStyle = "#ffe066";
  ctx.fillRect(TRIAL.src[0] * T + 9, TRIAL.src[1] * T + 9, 14, 14);
  TRIAL.mirrors.forEach(([x, y], i) => {
    ctx.fillStyle = "#4a4458";
    ctx.fillRect(x * T + 10, y * T + 24, 12, 5);
    ctx.save();
    ctx.translate(x * T + 16, y * T + 16);
    ctx.rotate(S.mir[i] === "/" ? -Math.PI / 4 : Math.PI / 4);
    ctx.fillStyle = "#d8ecff";
    ctx.fillRect(-12, -2, 24, 4);
    ctx.restore();
  });
  const [cx, cy] = TRIAL.crystal;
  ctx.fillStyle = S.espelhos ? "#ffffff" : "#6a5a98";
  ctx.beginPath();
  ctx.moveTo(cx * T + 16, cy * T + 2);
  ctx.lineTo(cx * T + 26, cy * T + 16);
  ctx.lineTo(cx * T + 16, cy * T + 30);
  ctx.lineTo(cx * T + 6, cy * T + 16);
  ctx.fill();
  // Portas de silêncio
  [[TRIAL.door1, S.sinos], [TRIAL.door2, S.espelhos]].forEach(([d, open]) => {
    if (open) return;
    ctx.fillStyle = `rgba(150,110,230,${0.45 + 0.25 * Math.sin(t * 3)})`;
    ctx.fillRect(d[0] * T + 4, d[1] * T, 24, T);
  });
  // Lajes
  const P = TRIAL.plates;
  for (let y = P.y0; y < P.y0 + P.h; y++)
    for (let x = P.x0; x < P.x0 + P.w; x++) {
      const lit = S.lajes || S.lit.includes(plateKey(x, y));
      ctx.fillStyle = lit ? `rgba(120,200,255,${0.55 + 0.2 * Math.sin(t * 4 + x + y)})` : "#3a3450";
      ctx.fillRect(x * T + 3, y * T + 3, T - 6, T - 6);
      ctx.strokeStyle = lit ? "#cfeaff" : "#5a5470";
      ctx.lineWidth = 1;
      ctx.strokeRect(x * T + 3.5, y * T + 3.5, T - 7, T - 7);
    }
}
function drawTrialEntrance(t) {
  const p = trialEntrance();
  if (!p) return;
  const X = p[0] * TILE,
    Y = p[1] * TILE;
  ctx.fillStyle = "#4a4060";
  ctx.fillRect(X - 6, Y - 18, 44, 48);
  ctx.beginPath();
  ctx.arc(X + 16, Y - 18, 22, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = "#0a0612";
  ctx.fillRect(X + 4, Y - 6, 24, 36);
  ctx.fillStyle = `rgba(200,160,255,${0.4 + 0.3 * Math.sin(t * 3)})`;
  ctx.fillRect(X + 12, Y - 30, 8, 8);
}

/* ----- Etapas da história ----- */
const trialZone = () => (player.zone === "provas" ? "provas" : "torre");
const trialPos = (inside) => () => (player.zone === "provas" ? inside() : trialEntrance() || ZONES.torre.guardPos);
{
  const list = [
    { id: "t-sinos", t: "Prova da Torre 1: toque os Sinos do Silêncio", d: "Atrás do arco selado da Torre, leia a inscrição e toque os quatro sinos na ordem certa.", pos: trialPos(() => TRIAL.stone), done: () => trials().sinos },
    { id: "t-espelhos", t: "Prova da Torre 2: leve a luz até o cristal", d: "Gire os espelhos (/ ou \\) para o feixe da lanterna chegar ao cristal. Nem todo espelho está no caminho.", pos: trialPos(() => TRIAL.mirrors[0]), done: () => trials().espelhos },
    { id: "t-lajes", t: "Prova da Torre 3: acenda as dezesseis lajes", d: "Pise em todas as lajes, uma vez só cada. Pisou numa já acesa, todas se apagam.", pos: trialPos(() => TRIAL.corridor), done: () => trials().lajes },
  ].map((s) => Object.assign(s, { get zone() { return trialZone(); } }));
  // O getter acima foi copiado como valor pelo Object.assign; refaz como getter.
  for (const s of list) Object.defineProperty(s, "zone", { get: trialZone, enumerable: true });
  const i = STEPS.findIndex((s) => s.id === "sile");
  if (i >= 0) STEPS.splice(i, 0, ...list);
}

/* ----- Ligações ----- */
{
  // Não dá para ficar em cima de sinos, espelhos, lanterna, cristal, tochas e baús
  // (de cima deles, não daria para girar nem tocar).
  const wkBase = walkable;
  walkable = function (z, x, y) {
    if (z === "provas" && player.zone === "provas") {
      const l = trialTarget(x, y);
      if (l && l !== "Porta de silêncio") return false;
    }
    if (z === "cripta" && player.zone === "cripta" && typeof cryptTarget === "function") {
      const l = cryptTarget(x, y);
      if (l && l !== "Porta elemental" && l !== "Sair da cripta") return false;
    }
    return wkBase(z, x, y);
  };
  const charBase = characterAt;
  characterAt = function (x, y) {
    if (story() && player.zone === "provas" && trialTarget(x, y)) return true;
    return charBase(x, y);
  };
  const tgtBase = targetAt;
  targetAt = function (x, y) {
    if (story()) {
      if (player.zone === "provas") {
        const l = trialTarget(x, y);
        if (l) return l;
      }
      if (player.zone === "torre" && near(trialEntrance(), x, y)) return trials().lajes ? "Arco aberto (provas vencidas)" : "Entrar na Antessala do Silêncio";
    }
    return tgtBase(x, y);
  };
  const iaBase = interactAt;
  interactAt = function (x, y) {
    if (story()) {
      if (player.zone === "provas" && trialInteract(x, y)) return;
      if (player.zone === "torre" && near(trialEntrance(), x, y)) return trials().lajes ? say([["", "O arco está aberto. As três provas já foram vencidas."]]) : enterTrials();
    }
    return iaBase(x, y);
  };
  const cdBase = crewDrawList;
  crewDrawList = function (list, t) {
    cdBase(list, t);
    if (!story()) return;
    if (player.zone === "provas") list.push({ y: -5, draw: () => drawTrials(t) });
    if (player.zone === "torre" && trialEntrance()) list.push({ y: trialEntrance()[1], draw: () => drawTrialEntrance(t) });
  };
  const ezBase = enterZone;
  enterZone = function () {
    const r = ezBase.apply(this, arguments);
    if (story() && player.zone === "provas") trialsApply();
    return r;
  };
  // Lajes: reage a cada passo dentro da sala 3.
  let lastPos = "";
  const updBase = update;
  update = function (dt) {
    updBase(dt);
    if (!story() || player.zone !== "provas" || game.mode !== "world") return (lastPos = "");
    const k = plateKey(player.x, player.y);
    if (k === lastPos) return;
    lastPos = k;
    const S = trials();
    if (onPlate(player.x, player.y) && !S.viuLajes) {
      S.viuLajes = true;
      say([["", "Dezesseis lajes. Na parede, riscado: \"Pise em cada uma uma vez só. O Silêncio não perdoa quem volta atrás.\""]]);
    }
    stepPlate(player.x, player.y);
  };
}
ACHIEVEMENTS.push(["provas", "As três provas", "Vença as provas da Antessala do Silêncio.", "gem", () => !!(player.provas && player.provas.lajes)]);
