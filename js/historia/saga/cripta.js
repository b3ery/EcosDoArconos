/**
 * ECOS DO ARCANO — cripta.js
 * Cripta dos Ecos, no Bosque: tochas na ordem certa, espelhos que levam a luz
 * até o cristal e a porta elemental. No fim, o baú de Vesper.
 * Modifica (envolve) funções de outros arquivos: characterAt, crewDrawList, enterZone, interactAt, targetAt.
 */

"use strict";

/* ===================== CRIPTA DOS ECOS ===================== */
ZONE_DEFS.cripta = { nome: "Cripta dos Ecos", theme: "mina", exits: {}, enemies: [] };
const CRYPT = { w: 34, h: 11, exit: [3, 9], doors: [[11, 5], [22, 5]], torches: [[3, 2], [8, 2], [3, 8], [8, 8]], mirrors: [[16, 8], [16, 3], [20, 3], [19, 6]], src: [12, 8], crystal: [20, 7], edoor: [26, 5], chest: [31, 5] };
const TORCH_ORDER = [2, 0, 3, 1];
function genCrypt() {
  const { w, h } = CRYPT;
  const m = makeGrid(w, h, (x, y) => (x === 0 || y === 0 || x === w - 1 || y === h - 1 ? "#" : "."));
  for (const [dx] of CRYPT.doors) for (let y = 1; y < h - 1; y++) m[y][dx] = "#";
  for (let y = 1; y < h - 1; y++) m[y][CRYPT.edoor[0]] = "#";
  const z = finalize("cripta", ZONE_DEFS.cripta, m, w, h, {}, {}, null);
  z.town = { bld: [], doors: {}, stalls: {}, huts: [], arrive: CRYPT.exit.slice(), horses: [], boats: [], yard: true };
  return z;
}
ZONES.cripta = genCrypt();
function cryptState() {
  const S = (player.crypt = player.crypt || { lit: [], torchesOk: false, mirOk: false, eOk: false, chest: false, rune: null });
  // Espelhos de duas posições (/ e \); saves antigos ganham a posição inicial.
  if (!Array.isArray(S.mir2) || S.mir2.length !== CRYPT.mirrors.length) S.mir2 = ["\\", "\\", "/", "/"];
  return S;
}
function setTile(zone, x, y, c) {
  const m = ZONES[zone].map,
    row = m[y];
  m[y] = typeof row === "string" ? row.slice(0, x) + c + row.slice(x + 1) : (row.splice(x, 1, c), row);
}
function cryptApply() {
  const S = cryptState();
  setTile("cripta", CRYPT.doors[0][0], CRYPT.doors[0][1], S.torchesOk ? "." : "#");
  setTile("cripta", CRYPT.doors[1][0], CRYPT.doors[1][1], S.mirOk ? "." : "#");
  setTile("cripta", CRYPT.edoor[0], CRYPT.edoor[1], S.eOk ? "." : "#");
}
function cryptEntrance() {
  return spotOf("bosque", "cripta");
}
function enterCrypt() {
  if (lifeMode()) return;
  cryptApply();
  game.cryptBack = { zone: player.zone, x: player.x, y: player.y };
  player.zone = "cripta";
  [player.x, player.y] = [CRYPT.exit[0], CRYPT.exit[1] - 1];
  player.rx = player.x;
  player.ry = player.y;
  player.dir = "up";
  player.riding = false;
  game.fade = 1;
  enterZone(true);
  if (!player.flags.criptaVista) {
    player.flags.criptaVista = true;
    say([["", "Uma cripta antiga, com o cheiro de três séculos. Inscrições cobrem as paredes."], ["", "\"Quem quiser a memória de Vesper, que acenda as chamas como as estrelas se acendem: primeiro a do sul, depois a do norte...\""], ["", "Mais adiante, uma lanterna e quatro espelhos. Gire os espelhos (/ ou \\) até a luz chegar ao cristal."]]);
  }
}
function leaveCrypt() {
  const b = game.cryptBack || { zone: "bosque", x: (cryptEntrance() || [5, 5])[0], y: (cryptEntrance() || [5, 5])[1] + 1 };
  player.zone = b.zone;
  [player.x, player.y, player.rx, player.ry] = [b.x, b.y, b.x, b.y];
  game.fade = 1;
  enterZone(true);
}
const near = (a, x, y) => a && a[0] === x && a[1] === y;
/** O feixe da cripta: sai da lanterna para a direita e reflete nos espelhos. */
function cryptBeam() {
  const S = cryptState(),
    D = { E: [1, 0], W: [-1, 0], N: [0, -1], S: [0, 1] },
    B = { "/": { E: "N", N: "E", W: "S", S: "W" }, "\\": { E: "S", S: "E", W: "N", N: "W" } };
  let [x, y] = CRYPT.src,
    d = "E";
  const path = [[x, y]];
  for (let k = 0; k < 120; k++) {
    x += D[d][0];
    y += D[d][1];
    if (x <= CRYPT.doors[0][0] || x >= CRYPT.doors[1][0] || y < 1 || y > CRYPT.h - 2) break;
    path.push([x, y]);
    if (near(CRYPT.crystal, x, y)) return { path, hit: true };
    const mi = CRYPT.mirrors.findIndex((m) => near(m, x, y));
    if (mi >= 0) d = B[S.mir2[mi]][d];
  }
  return { path, hit: false };
}
function cryptTarget(x, y) {
  const S = cryptState();
  if (near(CRYPT.exit, x, y)) return "Sair da cripta";
  const ti = CRYPT.torches.findIndex((p) => near(p, x, y));
  if (ti >= 0) return S.torchesOk ? "Tocha acesa" : "Acender a tocha";
  const mi = CRYPT.mirrors.findIndex((p) => near(p, x, y));
  if (mi >= 0) return "Girar o espelho";
  if (near([CRYPT.edoor[0] - 1, CRYPT.edoor[1]], x, y) || near(CRYPT.edoor, x, y)) return S.eOk ? null : "Porta elemental";
  if (near(CRYPT.chest, x, y)) return S.chest ? "Baú vazio" : "Abrir o baú de Vesper";
  if (near([2, 5], x, y)) return "Ler a inscrição";
  return null;
}
function cryptInteract(x, y) {
  const S = cryptState();
  const l = cryptTarget(x, y);
  if (!l) return false;
  if (l === "Sair da cripta") return leaveCrypt(), true;
  if (l === "Ler a inscrição") return say([["", "\"...primeiro a do sul, depois a do norte, as duas do lado do poente; depois volte ao sul pelo lado do sol nascente, e termine no norte, do mesmo lado.\""], ["", "(Dica: sul-oeste, norte-oeste, sul-leste, norte-leste.)"]]), true;
  if (l === "Acender a tocha") {
    const ti = CRYPT.torches.findIndex((p) => near(p, x, y));
    if (S.lit.includes(ti)) return true;
    S.lit.push(ti);
    playSound(440 + S.lit.length * 80, 0.12, "triangle");
    const ok = S.lit.every((v, i) => v === TORCH_ORDER[i]);
    if (!ok) {
      S.lit = [];
      game.shake = 0.2;
      say([["", "As chamas se apagam todas de uma vez. A ordem estava errada."]]);
    } else if (S.lit.length === 4) {
      S.torchesOk = true;
      cryptApply();
      game.shake = 0.3;
      say([["", "As quatro chamas ficam azuis. A parede de pedra desliza e abre passagem!"]]);
    }
    saveGame();
    return true;
  }
  if (l === "Girar o espelho") {
    const mi = CRYPT.mirrors.findIndex((p) => near(p, x, y));
    S.mir2[mi] = S.mir2[mi] === "/" ? "\\" : "/";
    playSound(300 + mi * 60, 0.06, "square");
    if (!S.mirOk && cryptBeam().hit) {
      S.mirOk = true;
      cryptApply();
      game.shake = 0.3;
      say([["", "A luz pula de espelho em espelho e acerta o cristal! A segunda porta se abre."]]);
    }
    saveGame();
    return true;
  }
  if (l === "Porta elemental") {
    S.rune = S.rune || pk((player.runes || []).length ? player.runes : ORDER);
    const sym = RUNES[S.rune];
    choice("Porta elemental", `Um símbolo brilha na porta: o desenho de <b style="color:${sym.cor}">${sym.nome}</b>. Qual runa você toca?`, (player.runes || []).map((r) => ({ t: RUNES[r].nome, fn: () => (r === S.rune ? ((S.eOk = true), cryptApply(), saveGame(), (game.shake = 0.3), say([["", "A porta responde à runa certa e se dissolve em pó brilhante."]])) : say([["", "Nada acontece. O símbolo pisca, como se risse de você."]])) })).concat([{ t: "Voltar", fn: null }]));
    return true;
  }
  if (l === "Abrir o baú de Vesper") {
    S.chest = true;
    addItem("fenix");
    player.gold += 200;
    gainXP(150);
    saveGame();
    say([["", "Dentro do baú: uma Pena de Fênix, 200 de ouro e um bilhete com a letra de criança de Vesper."], ["", "\"Quando eu crescer, quero ser tão bom quanto a Odelia. — V.\""], ["", "+150 XP."]]);
    return true;
  }
  return true;
}
function drawCrypt(t) {
  const S = cryptState();
  const T = TILE;
  CRYPT.torches.forEach(([x, y], i) => {
    const lit = S.torchesOk || S.lit.includes(i);
    ctx.fillStyle = "#5a4030";
    ctx.fillRect(x * T + 13, y * T + 10, 6, 18);
    if (lit) {
      ctx.fillStyle = S.torchesOk ? "#7ad0ff" : "#ffb04a";
      ctx.beginPath();
      ctx.arc(x * T + 16, y * T + 8 + Math.sin(t * 10 + i) * 1.5, 6, 0, 7);
      ctx.fill();
    } else {
      ctx.fillStyle = "#2a2020";
      ctx.fillRect(x * T + 12, y * T + 4, 8, 6);
    }
  });
  const beam = cryptBeam();
  ctx.strokeStyle = `rgba(255,240,160,${0.6 + 0.3 * Math.sin(t * 6)})`;
  ctx.lineWidth = 3;
  ctx.beginPath();
  beam.path.forEach(([bx, by], i) => (i ? ctx.lineTo(bx * T + 16, by * T + 16) : ctx.moveTo(bx * T + 16, by * T + 16)));
  ctx.stroke();
  CRYPT.mirrors.forEach(([x, y], i) => {
    ctx.fillStyle = "#4a4458";
    ctx.fillRect(x * T + 10, y * T + 24, 12, 5);
    ctx.save();
    ctx.translate(x * T + 16, y * T + 16);
    ctx.rotate(S.mir2[i] === "/" ? -Math.PI / 4 : Math.PI / 4);
    ctx.fillStyle = "#cfe6ff";
    ctx.fillRect(-12, -2, 24, 4);
    ctx.restore();
  });
  ctx.fillStyle = "#ffe066";
  ctx.fillRect(CRYPT.src[0] * T + 10, CRYPT.src[1] * T + 10, 12, 12);
  ctx.fillStyle = S.mirOk ? "#ffffff" : "#7a6aa8";
  ctx.beginPath();
  ctx.moveTo(CRYPT.crystal[0] * T + 16, CRYPT.crystal[1] * T + 2);
  ctx.lineTo(CRYPT.crystal[0] * T + 26, CRYPT.crystal[1] * T + 16);
  ctx.lineTo(CRYPT.crystal[0] * T + 16, CRYPT.crystal[1] * T + 30);
  ctx.lineTo(CRYPT.crystal[0] * T + 6, CRYPT.crystal[1] * T + 16);
  ctx.fill();
  if (!S.eOk) {
    const sym = S.rune ? RUNES[S.rune] : null;
    ctx.fillStyle = sym ? sym.cor : "#8a7aa8";
    ctx.globalAlpha = 0.5 + 0.3 * Math.sin(t * 3);
    ctx.fillRect(CRYPT.edoor[0] * T + 8, CRYPT.edoor[1] * T + 4, 16, 24);
    ctx.globalAlpha = 1;
  }
  const [cx, cy] = CRYPT.chest;
  ctx.fillStyle = S.chest ? "#5a4030" : "#c8a030";
  ctx.fillRect(cx * T + 6, cy * T + 12, 20, 14);
  ctx.fillStyle = "#3a2414";
  ctx.fillRect(cx * T + 6, cy * T + 17, 20, 2);
  // Inscrição e saída.
  ctx.fillStyle = "#8a8098";
  ctx.fillRect(2 * T + 8, 5 * T + 4, 16, 22);
  ctx.fillStyle = "#3a3048";
  for (let i = 0; i < 4; i++) ctx.fillRect(2 * T + 10, 5 * T + 8 + i * 4, 12, 2);
  ctx.fillStyle = "#1a1420";
  ctx.fillRect(CRYPT.exit[0] * T + 4, CRYPT.exit[1] * T + 2, 24, 28);
}
function drawCryptEntrance(t) {
  const p = cryptEntrance();
  if (!p) return;
  const X = p[0] * TILE,
    Y = p[1] * TILE;
  ctx.fillStyle = "#6a6478";
  ctx.fillRect(X - 6, Y - 18, 44, 48);
  ctx.fillStyle = "#4a4458";
  ctx.beginPath();
  ctx.arc(X + 16, Y - 18, 22, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = "#120c18";
  ctx.fillRect(X + 4, Y - 6, 24, 36);
  ctx.fillStyle = `rgba(180,140,255,${0.4 + 0.3 * Math.sin(t * 3)})`;
  ctx.fillRect(X + 12, Y - 30, 8, 8);
}

/* ===================== LIGAÇÕES ===================== */
{
  const charBase = characterAt;
  characterAt = function (x, y) {
    if (story() && player.zone === "cripta" && cryptTarget(x, y)) return true;
    return charBase(x, y);
  };
  const tgtBase = targetAt;
  targetAt = function (x, y) {
    if (story()) {
      if (player.zone === "cripta") {
        const l = cryptTarget(x, y);
        if (l) return l;
      }
      if (player.zone === "bosque" && near(cryptEntrance(), x, y)) return "Entrar na Cripta dos Ecos";
    }
    return tgtBase(x, y);
  };
  const interBase = interactAt;
  interactAt = function (x, y) {
    if (story()) {
      if (player.zone === "cripta" && cryptInteract(x, y)) return;
      if (player.zone === "bosque" && near(cryptEntrance(), x, y)) return enterCrypt();
    }
    return interBase(x, y);
  };
  const cdBase = crewDrawList;
  crewDrawList = function (list, t) {
    cdBase(list, t);
    if (!story()) return;
    if (player.zone === "cripta") list.push({ y: -5, draw: () => drawCrypt(t) });
    if (player.zone === "bosque" && cryptEntrance()) list.push({ y: cryptEntrance()[1], draw: () => drawCryptEntrance(t) });
  };
  const ezBase = enterZone;
  enterZone = function () {
    const r = ezBase.apply(this, arguments);
    if (story() && player.zone === "cripta") cryptApply();
    return r;
  };
}
