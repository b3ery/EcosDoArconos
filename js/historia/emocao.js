/**
 * ECOS DO ARCANO — emocao.js (modo História)
 * Cenas para os momentos que importam:
 *  - cada Guardião libertado: a runa desperta, com a cor dela, e um eco de Vesper;
 *  - a chegada à Torre do Silêncio;
 *  - a batalha final fala com você (75%, 50% e 25% da vida dele, e a voz da
 *    Odelia te cura uma vez se você estiver quase caindo);
 *  - a máscara do Silenciador se partindo;
 *  - o reencontro de Odelia e Vesper, antes dos créditos.
 */

"use strict";

const GUARD_ECHO = {
  ent: ["Vesper esteve aqui, criança, com a irmã.", "\"As árvores escutam\", ela dizia. Ele acreditou nela."],
  serpente: ["A névoa guardou o choro de um menino.", "Ele pediu ao pântano que escondesse o que sentia."],
  grifo: ["No topo dos Picos, Vesper gritou o nome da irmã.", "O eco ainda está aqui. Ninguém respondeu."],
  basilisco: ["No fundo da mina, um cajado foi forjado em segredo.", "Ele queria ser forte o bastante para proteger alguém."],
  leviata: ["Do cais, Vesper partiu sem olhar para trás.", "A maré lembra. A maré sempre lembra."],
};
/** Toca uma cena e, se havia uma fala aberta, devolve ela depois. */
function cineThen(drawFn, dur, next) {
  const d = game.dialog;
  playCine(drawFn, dur, () => {
    if (d) say(d.lines, d.cb);
    if (next) next();
  });
}
function txt(s, x, y, size, color, weight = 700) {
  ctx.font = `${weight} ${size}px "Pixelify Sans", sans-serif`;
  ctx.fillStyle = color;
  ctx.fillText(s, x, y);
}
function rays(cx, cy, n, len, color, t) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(t * 0.3);
  ctx.fillStyle = color;
  for (let i = 0; i < n; i++) {
    ctx.rotate((Math.PI * 2) / n);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(len, -10);
    ctx.lineTo(len, 10);
    ctx.fill();
  }
  ctx.restore();
}

/* ----- Guardião libertado ----- */
function guardianScene(type, rune) {
  const R = rune && RUNES[rune] ? RUNES[rune] : { nome: "Luz", cor: "#ffe066" };
  const E = GUARD_ECHO[type] || ["Mais uma voz volta ao mundo.", ""];
  return (W, H, t) => {
    ctx.fillStyle = "#07050c";
    ctx.fillRect(0, 0, W, H);
    const k = Math.min(1, t / 1.6);
    ctx.globalAlpha = 0.25 * k;
    rays(W / 2, H / 2 - 20, 12, W, R.cor, t);
    ctx.globalAlpha = 1;
    const g = ctx.createRadialGradient(W / 2, H / 2 - 20, 4, W / 2, H / 2 - 20, 160 * k + 10);
    g.addColorStop(0, "#ffffff");
    g.addColorStop(0.25, R.cor);
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(W / 2, H / 2 - 20, 170, 0, 7);
    ctx.fill();
    if (typeof drawEnemy === "function" && ENEMIES[type]) {
      ctx.globalAlpha = Math.max(0, 1 - t / 2.4);
      drawEnemy(type, W / 2 - 64, H / 2 - 84, 8, t);
      ctx.globalAlpha = 1;
    }
    for (let i = 0; i < 26; i++) {
      const a = i * 0.9 + t,
        r = 40 + ((t * 70 + i * 23) % 220);
      ctx.fillStyle = R.cor;
      ctx.fillRect(W / 2 + Math.cos(a) * r, H / 2 - 20 + Math.sin(a) * r * 0.6, 3, 3);
    }
    txt(`✦ A Runa ${R.nome} desperta ✦`, W / 2, 70, 28, "#fff");
    if (t > 1.8) txt(E[0], W / 2, H - 96, 17, `rgba(255,240,220,${Math.min(1, (t - 1.8) * 1.5)})`, 600);
    if (t > 3) txt(E[1], W / 2, H - 70, 17, `rgba(255,240,220,${Math.min(1, (t - 3) * 1.5)})`, 600);
  };
}
{
  const rgBase = rewardGuardian;
  rewardGuardian = function (enemy, type) {
    if (lifeMode() || !GUARD_ECHO[type]) return rgBase(enemy, type);
    playSound(523, 0.4, "triangle");
    setTimeout(() => playSound(784, 0.6, "triangle"), 400);
    playCine(guardianScene(type, enemy.rune), 6, () => rgBase(enemy, type));
  };
}

/* ----- A Torre do Silêncio ----- */
function towerScene(W, H, t) {
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, "#05030a");
  sky.addColorStop(1, "#1c1030");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 50; i++) {
    ctx.fillStyle = `rgba(200,180,255,${0.2 + 0.3 * Math.abs(Math.sin(i + t))})`;
    ctx.fillRect((i * 97) % W, (i * 53) % 260, 2, 2);
  }
  const rise = Math.min(1, t / 2.5);
  const tx = W / 2 - 60,
    th = 360;
  ctx.fillStyle = "#120a1e";
  ctx.fillRect(tx, H - th * rise, 120, th);
  ctx.beginPath();
  ctx.moveTo(tx - 16, H - th * rise);
  ctx.lineTo(W / 2, H - th * rise - 70);
  ctx.lineTo(tx + 136, H - th * rise);
  ctx.fill();
  for (let i = 0; i < 6; i++) {
    ctx.fillStyle = `rgba(150,90,255,${0.4 + 0.4 * Math.sin(t * 3 + i)})`;
    ctx.fillRect(tx + 24 + (i % 2) * 56, H - th * rise + 50 + Math.floor(i / 2) * 80, 16, 24);
  }
  // Os dois olhos no alto.
  if (t > 2.6) {
    const a = Math.min(1, (t - 2.6) * 1.5) * (0.7 + 0.3 * Math.sin(t * 5));
    ctx.fillStyle = `rgba(255,60,90,${a})`;
    ctx.fillRect(W / 2 - 14, H - th - 40, 8, 5);
    ctx.fillRect(W / 2 + 6, H - th - 40, 8, 5);
  }
  for (let i = 0; i < 40; i++) {
    ctx.fillStyle = "rgba(120,100,160,.35)";
    ctx.fillRect(((i * 131 + t * 90) % (W + 60)) - 30, (i * 37) % H, 40, 1);
  }
  txt("A Torre do Silêncio", W / 2, 60, 30, `rgba(230,210,255,${Math.min(1, t)})`);
  if (t > 3.2) txt("Aqui, há trezentos anos, um irmão deixou de ouvir a irmã.", W / 2, H - 40, 16, `rgba(255,230,240,${Math.min(1, t - 3.2)})`, 600);
}
{
  const ezBase = enterZone;
  enterZone = function () {
    const r = ezBase.apply(this, arguments);
    if (!lifeMode() && player.zone === "torre" && !player.flags.torreCine) {
      player.flags.torreCine = true;
      setTimeout(() => cineThen(towerScene, 7), 300);
    }
    return r;
  };
}

/* ----- A batalha final fala com você ----- */
const FINAL_BEATS = [
  { at: 0.75, k: "b75", lines: () => ["O Silenciador: \"Cada runa que você solta morre um pouco. Eu vi. EU VI!\""] },
  {
    at: 0.5,
    k: "b50",
    flash: true,
    lines: () => {
      const kind = (player.fb || []).filter((x) => x === 1).length;
      return kind >= 3
        ? ["Uma lembrança atravessa a torre: uma vela acesa, uma menina rindo.", "O Silenciador hesita. \"...Odelia?\""]
        : ["Uma lembrança atravessa a torre: uma porta batendo, um menino sozinho.", "O Silenciador ruge: \"Ninguém me ouviu! NINGUÉM!\""];
    },
  },
  { at: 0.25, k: "b25", shake: true, lines: () => ["CRAC! A máscara do Silenciador racha ao meio.", "Por baixo dela, um rosto cansado. E com medo."] },
];
function finalBattleTick() {
  const b = battle;
  if (!b || b.type !== "silenciador" || b.done || !b.e) return;
  b.beats = b.beats || {};
  const ratio = b.e.hp / b.e.max;
  for (const B of FINAL_BEATS) {
    if (b.beats[B.k] || ratio > B.at || b.e.hp <= 0) continue;
    b.beats[B.k] = true;
    for (const l of B.lines()) battleLog(l);
    if (B.flash && !settings.calm) game.flash = 0.6;
    if (B.shake && !settings.calm) game.shake = 0.5;
    playSound(B.at === 0.25 ? 90 : 220, 0.5, "sawtooth");
  }
  // A voz da Odelia, uma vez, quando você está quase caindo.
  if (!b.beats.odelia && player.hp > 0 && player.hp < maxHp() * 0.25 && !(player.flags && player.flags.odeliaMorta)) {
    b.beats.odelia = true;
    const h = Math.round(maxHp() * 0.35);
    healPlayer(h, "#d8b4ff");
    battleLog(`A voz da Odelia ecoa pela torre: "Eu estou com você, aprendiz. Ele ainda pode ouvir." (+${h} de vida)`);
    playSound(660, 0.4, "triangle");
  }
}

/* ----- A máscara se parte ----- */
function maskScene(W, H, t) {
  ctx.fillStyle = "#06040a";
  ctx.fillRect(0, 0, W, H);
  const cx = W / 2,
    cy = H / 2 - 10;
  const open = Math.min(1, Math.max(0, (t - 2) / 2.5));
  if (open > 0) {
    ctx.globalAlpha = open * 0.5;
    rays(cx, cy, 16, W, "#ffe8a0", t);
    ctx.globalAlpha = 1;
  }
  // A máscara: duas metades que se afastam.
  for (const side of [-1, 1]) {
    ctx.save();
    ctx.translate(cx + side * open * 70, cy + open * 40);
    ctx.rotate(side * open * 0.4);
    ctx.fillStyle = "#2a1f3d";
    ctx.beginPath();
    ctx.moveTo(0, -90);
    ctx.quadraticCurveTo(side * 90, -80, side * 80, 10);
    ctx.quadraticCurveTo(side * 60, 80, 0, 96);
    ctx.fill();
    ctx.fillStyle = "#ff3c5a";
    ctx.fillRect(side * 30 - 9, -18, 18, 7);
    ctx.restore();
  }
  // Rachaduras antes de abrir.
  if (t < 2.2) {
    ctx.strokeStyle = "#ffe8a0";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx, cy - 90);
    ctx.lineTo(cx - 8, cy - 30);
    ctx.lineTo(cx + 6, cy + 10);
    ctx.lineTo(cx - 4, cy + 90 * Math.min(1, t));
    ctx.stroke();
  }
  // O rosto de Vesper por baixo.
  if (open > 0.3) {
    ctx.globalAlpha = Math.min(1, (open - 0.3) * 2);
    drawSprite(wizardRects("#3a2a5a", null, "#1a1410", null, "down", 0), cx - 48, cy - 56, 6, false);
    ctx.globalAlpha = 1;
  }
  txt(t < 2 ? "A máscara racha..." : "...e por baixo dela, um menino que só queria ser ouvido.", W / 2, 54, 22, "#fff");
  if (t > 5) txt("Vesper.", W / 2, H - 46, 28, `rgba(255,232,160,${Math.min(1, t - 5)})`);
}
{
  const sdBase = silencerDefeated;
  silencerDefeated = function (heroic) {
    return sdBase(() => {
      playSound(392, 0.6, "triangle");
      playCine(maskScene, 7.5, heroic);
    });
  };
}

/* ----- O reencontro, antes dos créditos ----- */
function reunionScene(W, H, t) {
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, "#f2b07a");
  sky.addColorStop(0.6, "#b0607a");
  sky.addColorStop(1, "#3a2a4a");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#ffe2a0";
  ctx.beginPath();
  ctx.arc(W / 2, H * 0.62, 70, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = "#4a3a3a";
  ctx.fillRect(0, H * 0.62, W, H * 0.38);
  // A fonte da praça.
  ctx.fillStyle = "#8a8090";
  ctx.fillRect(W / 2 - 60, H * 0.62 + 30, 120, 26);
  ctx.fillStyle = "#6ab0e0";
  ctx.fillRect(W / 2 - 52, H * 0.62 + 34, 104, 8);
  // Os dois irmãos se aproximando.
  const meet = Math.min(1, t / 3.2);
  const o = NPCS.odelia || { robe: "#5b3fa8", hat: "#3a2878", hair: "#d9d9d9" };
  const ox = W / 2 - 150 + meet * 104,
    vx = W / 2 + 102 - meet * 104,
    y = H * 0.62 - 70;
  drawSprite(wizardRects(o.robe, o.hat, o.hair, null, "right", Math.floor(t * 4) % 2), ox, y, 4, false);
  drawSprite(wizardRects("#3a2a5a", null, "#1a1410", null, "left", Math.floor(t * 4) % 2), vx, y, 4, true);
  if (meet >= 1) {
    for (let i = 0; i < 3; i++) drawPixelIcon("heart", W / 2 + (i - 1) * 22, y - 20 - ((t * 20 + i * 12) % 40), 2);
    for (let i = 0; i < 40; i++) {
      ctx.fillStyle = ["#ffe066", "#ff9ab8", "#b48aff", "#7ad0ff"][i % 4];
      ctx.fillRect((i * 97 + Math.sin(t + i) * 20) % W, (i * 53 + t * 40) % (H * 0.6), 3, 3);
    }
  }
  txt("Trezentos anos depois...", W / 2, 54, 24, "#fff");
  if (t > 3.4) txt("\"Demorei um pouco para voltar, não foi?\"", W / 2, H - 64, 18, `rgba(255,255,255,${Math.min(1, t - 3.4)})`, 600);
  if (t > 4.8) txt("A Canção Arcana voltou.", W / 2, H - 32, 22, `rgba(255,232,160,${Math.min(1, t - 4.8)})`);
}
{
  const seBase = showEnd;
  showEnd = function () {
    // Uma vez por jogo (o Novo Jogo+ cria um jogador novo, e a cena volta).
    if (lifeMode() || player.villainEnd || player.reunionSeen) return seBase.apply(this, arguments);
    player.reunionSeen = true;
    playCine(reunionScene, 8, () => showEnd());
  };
}

/* ----- Ligações ----- */
{
  const updBase = update;
  update = function (dt) {
    updBase(dt);
    if (!lifeMode() && game.mode === "battle") finalBattleTick();
  };
}
