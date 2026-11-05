/**
 * ECOS DO ARCANO — 26-casa-quintal.js
 * Casas com quintal e com andares:
 *  - Casa, Sobrado e Mansão têm quintal (porta no fundo da casa): horta, poço,
 *    árvores, banco e, na Mansão, laguinho e jardim.
 *  - Sobrado e Mansão têm andar de cima (escada no canto): móveis de cada andar
 *    ficam no seu andar.
 *  - O Casebre não tem nada disso: é uma casa de pobre.
 */

"use strict";

const HOUSE_FEATURES = {
  casebre: { quintal: false, andar: false },
  casa: { quintal: true, andar: false },
  sobrado: { quintal: true, andar: true },
  mansao: { quintal: true, andar: true },
};
const STAIRS = [12, 2],
  BACKDOOR = [2, 1],
  YARD_DOOR = [3, 0];
function houseFeat() {
  return HOUSE_FEATURES[typeof homeTier === "function" ? homeTier() : "casa"] || HOUSE_FEATURES.casa;
}
function curFloor() {
  return player.zone === "casa" ? player.floor || 0 : 0;
}

/* ===================== QUINTAL ===================== */

ZONE_DEFS.quintal = { nome: "Quintal", theme: "vila", exits: {}, enemies: [] };
function genQuintal(tier) {
  const rich = tier === "mansao",
    mid = tier === "sobrado";
  const w = rich ? 18 : mid ? 16 : 14,
    h = rich ? 13 : 11;
  const m = makeGrid(w, h, (x, y) => (x === 0 || y === 0 || x === w - 1 || y === h - 1 ? "#" : "."));
  const set = (x, y, c) => x > 0 && y > 0 && x < w - 1 && y < h - 1 && (m[y][x] = c);
  // Horta cercada.
  const hw = rich ? 6 : mid ? 5 : 4;
  for (let x = 2; x < 2 + hw + 2; x++) {
    set(x, h - 5, "f");
    set(x, h - 2, "f");
  }
  for (let y = h - 5; y <= h - 2; y++) {
    set(2, y, "f");
    set(2 + hw + 1, y, "f");
  }
  set(2 + Math.floor(hw / 2), h - 2, ".");
  for (let y = h - 4; y <= h - 3; y++) for (let x = 3; x < 3 + hw; x++) set(x, y, "g");
  // Poço, árvores, banco.
  set(w - 3, 3, "W");
  set(w - 2, h - 2, "T");
  set(w - 4, h - 2, "T");
  set(1, 3, "T");
  set(w - 6, 2, "n");
  if (mid || rich) {
    set(w - 7, 2, "n");
    set(7, 2, "l");
  }
  if (rich) {
    // Laguinho com ponte e um jardim de flores.
    for (let y = 5; y <= 7; y++) for (let x = w - 8; x <= w - 4; x++) set(x, y, "~");
    for (let x = w - 8; x <= w - 4; x++) set(x, 6, "=");
    for (const [x, y] of [
      [10, 3],
      [11, 3],
      [12, 9],
      [13, 9],
    ])
      set(x, y, "p");
    set(9, 2, "l");
  }
  const z = finalize("quintal", ZONE_DEFS.quintal, m, w, h, {}, {}, null);
  z.town = { bld: [], doors: {}, stalls: {}, huts: [], arrive: [YARD_DOOR[0], 1], horses: [], boats: [], yard: true };
  z.tier = tier;
  return z;
}
function enterYard() {
  const tier = homeTier();
  ZONES.quintal = genQuintal(tier);
  player.zone = "quintal";
  player.x = YARD_DOOR[0];
  player.y = 1;
  player.dir = "down";
  player.floor = 0;
  game.fade = 1;
  game.lifeZone = "quintal";
  enterZone(false);
  playSound(330, 0.12, "triangle");
  if (!player.flags.quintalTip) {
    player.flags.quintalTip = true;
    setTimeout(
      () =>
        say([
          ["", "O quintal da sua casa! Colha a horta (E no trigo), tire água do poço e relaxe no banco."],
          ["", "Para voltar para dentro, fique de frente para a porta dos fundos (em cima) e aperte E."],
        ]),
      400,
    );
  }
}
function leaveYard() {
  player.zone = "casa";
  player.x = BACKDOOR[0];
  player.y = BACKDOOR[1] + 1;
  player.dir = "down";
  player.floor = 0;
  game.fade = 1;
  enterZone(false);
  playSound(330, 0.12, "triangle");
}

/* ===================== ESCADA E PORTA DOS FUNDOS ===================== */

/** Texto do "E · ..." para escada, porta dos fundos e banco do quintal. */
function houseExtraLabel(x, y) {
  if (player.zone === "casa") {
    const F = houseFeat();
    if (F.andar && x === STAIRS[0] && y === STAIRS[1]) return curFloor() ? "Descer a escada" : "Subir para o andar de cima";
    if (F.quintal && !curFloor() && x === BACKDOOR[0] && y === BACKDOOR[1]) return "Ir para o quintal";
  }
  if (player.zone === "quintal") {
    if (x === YARD_DOOR[0] && y === YARD_DOOR[1]) return "Entrar em casa";
    if (tileAt("quintal", x, y) === "n") return "Relaxar no banco";
  }
  return null;
}
function houseExtraInteract(x, y) {
  const l = houseExtraLabel(x, y);
  if (!l) return false;
  if (l === "Ir para o quintal") enterYard();
  else if (l === "Entrar em casa") leaveYard();
  else if (l === "Relaxar no banco") {
    player.clock = Math.min(1439, player.clock + 30);
    if (lifeMode()) {
      addNeed("fun", 12);
      addNeed("energy", 6);
    } else player.mp = Math.min(maxMp(), player.mp + 10);
    playSound(660, 0.15, "sine");
    say([["", pickOne(["Você senta no banco e escuta os passarinhos. Que paz.", "O vento balança as árvores do quintal. Você respira fundo.", "Você fica olhando a horta crescer. Quase dá para ouvir."])]]);
  } else {
    // Escada.
    player.floor = curFloor() ? 0 : 1;
    player.x = STAIRS[0];
    player.y = STAIRS[1] + 1;
    player.dir = "down";
    game.fade = 1;
    playSound(player.floor ? 520 : 390, 0.1, "triangle");
    toast(player.floor ? "Andar de cima: quartos e sala íntima. Decore com R." : "Térreo", 1800);
  }
  return true;
}

/** Desenho da escada, da porta dos fundos e do piso do andar de cima. */
function drawHouseExtras(t) {
  if (player.zone === "casa") {
    const F = houseFeat();
    if (F.andar) {
      const X = STAIRS[0] * TILE,
        Y = STAIRS[1] * TILE;
      ctx.fillStyle = "#4a2e17";
      ctx.fillRect(X, Y, TILE, TILE);
      for (let k = 0; k < 4; k++) {
        ctx.fillStyle = k % 2 ? "#8a5a2e" : "#a8743e";
        ctx.fillRect(X + 2, Y + (curFloor() ? 24 - k * 8 : k * 8), TILE - 4, 7);
      }
      ctx.fillStyle = "#c9a03a";
      ctx.fillRect(X, Y, 3, TILE);
    }
    if (F.quintal && !curFloor()) {
      const X = BACKDOOR[0] * TILE,
        Y = BACKDOOR[1] * TILE;
      ctx.fillStyle = "#3a2414";
      ctx.fillRect(X + 6, Y + 2, 20, 30);
      ctx.fillStyle = "#6b8a3a";
      ctx.fillRect(X + 8, Y + 4, 16, 28);
      ctx.fillStyle = "#9fd07a";
      ctx.fillRect(X + 10, Y + 6, 12, 6);
      ctx.fillStyle = "#f2c14e";
      ctx.fillRect(X + 20, Y + 19, 2, 2);
    }
  }
  if (player.zone === "quintal") {
    const X = YARD_DOOR[0] * TILE,
      Y = YARD_DOOR[1] * TILE;
    ctx.fillStyle = "#e8dcc0";
    ctx.fillRect(X - TILE * 2, Y, TILE * 5, TILE);
    ctx.fillStyle = "#8c3b2e";
    ctx.fillRect(X - TILE * 2, Y, TILE * 5, 6);
    ctx.fillStyle = "#3a2414";
    ctx.fillRect(X + 6, Y + 4, 20, 28);
    ctx.fillStyle = "#6b4423";
    ctx.fillRect(X + 8, Y + 6, 16, 26);
    ctx.fillStyle = "#f2c14e";
    ctx.fillRect(X + 19, Y + 18, 2, 2);
  }
}
