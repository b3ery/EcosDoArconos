/**
 * ECOS DO ARCANO — runas-reunidas.js
 * Quando as seis runas voltam a você (Modo História), acontece algo especial:
 *  - uma cena própria: o céu escurece, as seis runas aparecem uma por uma em
 *    volta do aprendiz, se ligam numa estrela de seis pontas e explodem numa
 *    luz de todas as cores; aparece "As Seis Vozes";
 *  - Odelia (ou o fantasma dela) e o Narrador falam desse momento;
 *  - recompensa: +20 de vida e de magia máximas, +10% de dano com todas as
 *    magias e o título "Voz das Seis Runas";
 *  - dali em diante, seis luzinhas das runas giram em volta do personagem.
 * Modifica (envolve) funções de outros arquivos: update, dmgMul, crewDrawList.
 */

"use strict";

const SIX = ["fogo", "agua", "ar", "terra", "luz", "sombra"];
const hasSix = () => SIX.every((r) => (player.runes || []).includes(r));

function sixRunesScene(W, H, t) {
  const cx = W / 2,
    cy = H / 2 - 10;
  // céu: do escuro para um amanhecer de todas as cores
  const dawn = Math.min(1, Math.max(0, (t - 5.2) / 2));
  ctx.fillStyle = "#05040a";
  ctx.fillRect(0, 0, W, H);
  if (dawn > 0) {
    const g = ctx.createRadialGradient(cx, cy, 10, cx, cy, W * 0.7);
    g.addColorStop(0, `rgba(255,250,220,${0.55 * dawn})`);
    g.addColorStop(0.4, `rgba(180,120,255,${0.35 * dawn})`);
    g.addColorStop(1, "rgba(5,4,10,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }
  // estrelas
  for (let i = 0; i < 60; i++) {
    ctx.fillStyle = `rgba(255,255,255,${0.3 + 0.3 * Math.sin(t * 2 + i)})`;
    ctx.fillRect((i * 97) % W, (i * 53) % (H - 60), 2, 2);
  }
  // o aprendiz no centro
  const u = 5;
  drawSprite(heroRects(player.look, "down", null), cx - 8 * u, cy - 8 * u + Math.sin(t * 2) * 3 - Math.min(20, t * 4), u, false);
  // as seis runas, uma por uma
  const R = 140;
  const pts = SIX.map((r, i) => {
    const a = -Math.PI / 2 + (i * Math.PI * 2) / 6 + t * 0.25;
    return [r, cx + Math.cos(a) * R, cy + Math.sin(a) * R * 0.75];
  });
  pts.forEach(([r, x, y], i) => {
    const k = Math.min(1, Math.max(0, (t - 0.4 - i * 0.55) / 0.5));
    if (k <= 0) return;
    ctx.globalAlpha = 0.35 * k;
    ctx.fillStyle = RUNES[r].cor;
    ctx.beginPath();
    ctx.arc(x, y, 26 + 6 * Math.sin(t * 4 + i), 0, 7);
    ctx.fill();
    ctx.globalAlpha = 1;
    glyph(r, x, y, 16 + 4 * k, k);
  });
  // estrela de seis pontas ligando as runas
  const link = Math.min(1, Math.max(0, (t - 3.8) / 1));
  if (link > 0) {
    ctx.lineWidth = 3;
    for (const off of [0, 1]) {
      ctx.beginPath();
      for (let j = 0; j <= 3; j++) {
        const [, x, y] = pts[(off + j * 2) % 6];
        j ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }
      const g = ctx.createLinearGradient(cx - R, cy, cx + R, cy);
      SIX.forEach((r, i) => g.addColorStop(i / 5, RUNES[r].cor));
      ctx.strokeStyle = g;
      ctx.globalAlpha = link;
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
  // a explosão de luz
  if (t > 5 && t < 5.6) {
    ctx.fillStyle = `rgba(255,255,255,${1 - (t - 5) / 0.6})`;
    ctx.fillRect(0, 0, W, H);
  }
  if (t > 5.2) {
    if (typeof rays === "function") {
      ctx.globalAlpha = 0.25 * dawn;
      rays(cx, cy, 18, W, pk(SIX.map((r) => RUNES[r].cor)), t);
      ctx.globalAlpha = 1;
    }
    for (let i = 0; i < 40; i++) {
      const a = i * 2.4 + t,
        d = ((t - 5.2) * 90 + i * 13) % (W * 0.6);
      ctx.fillStyle = RUNES[SIX[i % 6]].cor;
      ctx.fillRect(cx + Math.cos(a) * d, cy + Math.sin(a) * d * 0.7, 3, 3);
    }
  }
  // título
  if (t > 6) {
    const k = Math.min(1, (t - 6) / 1);
    ctx.globalAlpha = k;
    ctx.textAlign = "center";
    ctx.fillStyle = "#fff8e0";
    ctx.font = '700 34px "Pixelify Sans", sans-serif';
    ctx.fillText("As Seis Vozes", cx, 60);
    ctx.font = '600 15px "Pixelify Sans", sans-serif';
    ctx.fillStyle = "#e8d8ff";
    ctx.fillText("Pela primeira vez em trezentos anos, todas as runas cantam juntas.", cx, 88);
    ctx.globalAlpha = 1;
  }
}

function sixRunesReward() {
  player.flags.seisRunas = true;
  player.basehp += 20;
  player.basemp += 20;
  player.hp = maxHp();
  player.mp = maxMp();
  player.title = "Voz das Seis Runas";
  saveGame();
  const odelia = typeof isDead === "function" && isDead("odelia") ? "Fantasma de Odelia" : "Arquimaga Odelia";
  const lines = [
    ["", "O chão de Cinzaluz treme de leve. Em todas as casas, as velas se acendem sozinhas ao mesmo tempo."],
    [odelia, "Você sentiu? Seis vozes. Nem Vesper conseguiu ouvir todas juntas."],
    [odelia, "A Canção Arcana não é um feitiço, aprendiz. É isto: tudo cantando junto, sem ninguém mandar em ninguém."],
    ["", "Recompensa: +20 de vida e de magia máximas, +10% de dano com todas as magias e o título \"Voz das Seis Runas\"."],
    ["", "Agora só falta uma coisa: levar essa canção até a Torre do Silêncio."],
  ];
  say(lines);
  if (typeof vilaNews === "function") vilaNews(`Todas as velas de Cinzaluz se acenderam sozinhas. Dizem que ${player.name} reuniu as seis runas.`);
}

/* ----- quando acontece ----- */
{
  let acc = 0;
  const upBase = update;
  update = function (dt) {
    const r = upBase.apply(this, arguments);
    acc += dt || 0;
    if (acc < 0.5) return r;
    acc = 0;
    // na demo as runas vêm liberadas de presente: a cena especial fica para o jogo completo
    if (!player || !player.name || lifeMode() || player.demo || !player.flags || player.flags.seisRunas) return r;
    if (game.mode !== "world" || game.dialog || game.cine || game.deathScene || battle) return r;
    if (!hasSix()) return r;
    player.flags.seisRunas = true;
    playSound(523, 0.6, "sine", 0.06);
    setTimeout(() => playSound(659, 0.6, "sine", 0.06), 500);
    setTimeout(() => playSound(784, 0.8, "sine", 0.06), 1000);
    setTimeout(() => playSound(1047, 1.2, "sine", 0.05), 5000);
    playCine(sixRunesScene, 8, sixRunesReward);
    return r;
  };
}

/* ----- +10% de dano depois de reunir as seis ----- */
{
  const dmBase = dmgMul;
  dmgMul = function () {
    const m = dmBase.apply(this, arguments);
    return player && player.flags && player.flags.seisRunas && !lifeMode() ? m * 1.1 : m;
  };
}

/* ----- as seis luzinhas em volta do personagem ----- */
{
  const cdBase = crewDrawList;
  crewDrawList = function (list, t) {
    cdBase(list, t);
    if (!player || lifeMode() || !player.flags || !player.flags.seisRunas || !hasSix()) return;
    list.push({
      y: player.ry + 0.6,
      draw: () => {
        const cx = player.rx * TILE + 16,
          cy = player.ry * TILE + 14;
        SIX.forEach((r, i) => {
          const a = t * 1.6 + (i * Math.PI * 2) / 6;
          const x = cx + Math.cos(a) * 20,
            y = cy + Math.sin(a) * 8;
          ctx.globalAlpha = 0.85;
          ctx.fillStyle = RUNES[r].cor;
          ctx.fillRect(Math.round(x) - 2, Math.round(y) - 2, 4, 4);
          ctx.globalAlpha = 0.25;
          ctx.fillRect(Math.round(x) - 4, Math.round(y) - 4, 8, 8);
        });
        ctx.globalAlpha = 1;
      },
    });
  };
}
