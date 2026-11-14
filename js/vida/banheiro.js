/**
 * ECOS DO ARCANO — banheiro.js (Simulador de Vida)
 * A casa ganha um banheiro de verdade: porta na parede da direita da sala,
 * com banheira, pia e espelho. Antes o banho era uma opção do menu da cama.
 *  - Banheira: banho completo (higiene cheia, 30 min).
 *  - Pia: lavar o rosto e as mãos (um pouco de higiene, 5 min).
 *  - Espelho: trocar o visual.
 * No Casebre o banheiro é simples: uma tina de madeira no lugar da banheira.
 * Também tira do caminho os móveis que ficaram na frente das portas novas.
 */

"use strict";

const BATH_DOOR = [13, 5]; // parede da direita da sala
const BATH = { w: 9, h: 7, door: [4, 6], arrive: [4, 5], tub: [[2, 2], [3, 2]], sink: [6, 2], mirror: [6, 1], shelf: [7, 2] };
ZONE_DEFS.banheiro = { nome: "Banheiro", theme: "casa", exits: {}, enemies: [] };
ZONES.banheiro = (() => {
  const { w, h } = BATH;
  const m = makeGrid(w, h, (x, y) => (x === 0 || y === 0 || x === w - 1 || y === h - 1 || y === 1 ? "#" : "."));
  m[BATH.door[1]][BATH.door[0]] = "#";
  const z = finalize("banheiro", ZONE_DEFS.banheiro, m, w, h, {}, {}, null);
  z.town = { bld: [], doors: {}, stalls: {}, huts: [], arrive: BATH.arrive.slice(), horses: [], boats: [], indoor: true };
  return z;
})();
const bathOn = () => lifeMode() && player && player.name;
const poorBath = () => typeof homeTier === "function" && homeTier() === "casebre";

function enterBath() {
  player.zone = "banheiro";
  [player.x, player.y] = BATH.arrive;
  player.dir = "up";
  player.floor = 0;
  game.fade = 1;
  game.lifeZone = "banheiro";
  enterZone(false);
  playSound(330, 0.12, "triangle");
}
function leaveBath() {
  player.zone = "casa";
  player.x = BATH_DOOR[0] - 1;
  player.y = BATH_DOOR[1];
  player.dir = "left";
  player.floor = 0;
  game.fade = 1;
  game.lifeZone = null;
  enterZone(false);
  playSound(330, 0.12, "triangle");
}
function bathLabel(x, y) {
  if (!bathOn()) return null;
  if (player.zone === "casa" && !curFloor() && x === BATH_DOOR[0] && y === BATH_DOOR[1]) return "Ir ao banheiro";
  if (player.zone !== "banheiro") return null;
  if (x === BATH.door[0] && y === BATH.door[1]) return "Voltar para a sala";
  if (BATH.tub.some(([a, b]) => a === x && b === y)) return poorBath() ? "Tomar banho na tina (30 min)" : "Tomar banho de banheira (30 min)";
  if (x === BATH.sink[0] && y === BATH.sink[1]) return "Lavar o rosto e as mãos";
  if (x === BATH.mirror[0] && y === BATH.mirror[1]) return "Olhar no espelho (trocar visual)";
  if (x === BATH.shelf[0] && y === BATH.shelf[1]) return "Prateleira de toalhas";
  return null;
}
function bathInteract(x, y) {
  const l = bathLabel(x, y);
  if (!l) return false;
  if (l === "Ir ao banheiro") return enterBath(), true;
  if (l === "Voltar para a sala") return leaveBath(), true;
  if (l.startsWith("Tomar banho")) {
    player.hygiene = 100;
    if (typeof addNeed === "function") addNeed("fun", poorBath() ? 2 : 6);
    player.clock = Math.min(1439, player.clock + 30);
    if (player.sick === "sarna" || player.sick === "piolho") player.sick = null;
    saveGame();
    playSound(523, 0.3, "sine", 0.05);
    return say([["", poorBath() ? "Água morna na tina de madeira e um pedaço de sabão. Não é luxo, mas resolve. Higiene cheia!" : "Banho quente de banheira, com sabão de ervas e espuma. Higiene cheia!"]]), true;
  }
  if (l === "Lavar o rosto e as mãos") {
    player.hygiene = Math.min(100, (player.hygiene || 0) + 15);
    player.clock = Math.min(1439, player.clock + 5);
    saveGame();
    playSound(700, 0.12, "sine", 0.04);
    return toast("Você lava o rosto e as mãos. Higiene +15.", 1800), true;
  }
  if (l.startsWith("Olhar no espelho")) return showCreate("wardrobe"), true;
  if (l === "Prateleira de toalhas") return say([["", "Toalhas limpas, dobradas. Alguém nesta casa é organizado."]]), true;
  return false;
}
function drawBath(t) {
  const T = TILE;
  // piso de ladrilhos
  for (let y = 2; y < BATH.h - 1; y++)
    for (let x = 1; x < BATH.w - 1; x++) {
      ctx.fillStyle = (x + y) % 2 ? "#cfd8dc" : "#e8eef0";
      ctx.fillRect(x * T, y * T, T, T);
    }
  // porta de volta
  const [dx, dy] = BATH.door;
  ctx.fillStyle = "#3a2414";
  ctx.fillRect(dx * T + 4, dy * T, 24, 30);
  ctx.fillStyle = "#8a5a2e";
  ctx.fillRect(dx * T + 6, dy * T + 2, 20, 28);
  // banheira (ou tina)
  const [tx, ty] = BATH.tub[0];
  if (poorBath()) {
    ctx.fillStyle = "#7a5a3a";
    ctx.beginPath();
    ctx.ellipse(tx * T + T, ty * T + 18, 26, 13, 0, 0, 7);
    ctx.fill();
    ctx.fillStyle = "#8fc8e8";
    ctx.beginPath();
    ctx.ellipse(tx * T + T, ty * T + 16, 20, 8, 0, 0, 7);
    ctx.fill();
  } else {
    ctx.fillStyle = "#f4f4f4";
    ctx.fillRect(tx * T + 2, ty * T + 6, T * 2 - 4, 24);
    ctx.fillStyle = "#b8c4c8";
    ctx.fillRect(tx * T + 2, ty * T + 28, T * 2 - 4, 3);
    ctx.fillStyle = "#8fc8e8";
    ctx.fillRect(tx * T + 6, ty * T + 9, T * 2 - 12, 14);
    ctx.fillStyle = "rgba(255,255,255,.8)";
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.arc(tx * T + 12 + i * 9, ty * T + 11 + Math.sin(t * 2 + i) * 1.5, 3, 0, 7);
      ctx.fill();
    }
    ctx.fillStyle = "#c9a03a";
    ctx.fillRect(tx * T + 4, ty * T + 4, 4, 6);
  }
  // pia
  const [sx, sy] = BATH.sink;
  ctx.fillStyle = "#e8e8e8";
  ctx.fillRect(sx * T + 4, sy * T + 8, 24, 10);
  ctx.fillStyle = "#8fc8e8";
  ctx.fillRect(sx * T + 8, sy * T + 10, 16, 5);
  ctx.fillStyle = "#b8c4c8";
  ctx.fillRect(sx * T + 13, sy * T + 18, 6, 12);
  // espelho na parede
  const [mx, my] = BATH.mirror;
  ctx.fillStyle = "#c9a03a";
  ctx.fillRect(mx * T + 6, my * T + 6, 20, 22);
  ctx.fillStyle = "#bfe4f0";
  ctx.fillRect(mx * T + 8, my * T + 8, 16, 18);
  ctx.fillStyle = "rgba(255,255,255,.6)";
  ctx.fillRect(mx * T + 10, my * T + 10, 3, 10);
  // prateleira com toalhas
  const [hx, hy] = BATH.shelf;
  ctx.fillStyle = "#8a5a2e";
  ctx.fillRect(hx * T + 4, hy * T + 18, 24, 4);
  ctx.fillStyle = "#e86a8a";
  ctx.fillRect(hx * T + 6, hy * T + 8, 9, 10);
  ctx.fillStyle = "#6ab0e8";
  ctx.fillRect(hx * T + 16, hy * T + 8, 9, 10);
}
function drawBathDoor() {
  const [x, y] = BATH_DOOR,
    T = TILE;
  ctx.fillStyle = "#3a2414";
  ctx.fillRect(x * T + 2, y * T - 4, 12, 36);
  ctx.fillStyle = "#6a8aa8";
  ctx.fillRect(x * T + 3, y * T - 2, 10, 32);
  ctx.fillStyle = "#f2c14e";
  ctx.fillRect(x * T + 4, y * T + 14, 2, 3);
}

(() => {
  const tgBase = targetAt;
  targetAt = function (x, y) {
    return bathLabel(x, y) || tgBase(x, y);
  };
  const iaBase = interactAt;
  interactAt = function (x, y) {
    if (bathInteract(x, y)) return;
    return iaBase(x, y);
  };
  const wkBase = walkable;
  walkable = function (z, x, y) {
    if (z === "banheiro") {
      if (BATH.tub.some(([a, b]) => a === x && b === y)) return false;
      if ((x === BATH.sink[0] && y === BATH.sink[1]) || (x === BATH.shelf[0] && y === BATH.shelf[1])) return false;
    }
    return wkBase(z, x, y);
  };
  // ninguém põe móvel na frente da porta do banheiro
  const cpBase = canPlace;
  canPlace = function (x, y) {
    if (x === BATH_DOOR[0] - 1 && y === BATH_DOOR[1]) return false;
    return cpBase(x, y);
  };
  const cdBase = crewDrawList;
  crewDrawList = function (list, t) {
    cdBase(list, t);
    if (!bathOn()) return;
    if (player.zone === "banheiro") list.push({ y: -6, draw: () => drawBath(t) });
    if (player.zone === "casa" && !curFloor()) list.push({ y: -6, draw: () => drawBathDoor() });
  };
  // Saves antigos: tira móveis da frente da porta do quintal (que mudou de lugar) e da do banheiro.
  const upBase = update;
  update = function () {
    const r = upBase.apply(this, arguments);
    if (player && player.furn && !player.flags.portasV2) {
      player.flags = player.flags || {};
      player.flags.portasV2 = true;
      const blocked = [[BACKDOOR[0], BACKDOOR[1] + 1], [BATH_DOOR[0] - 1, BATH_DOOR[1]]];
      for (const f of player.furn) {
        if ((f.floor || 0) !== 0 || !blocked.some(([a, b]) => f.x === a && f.y === b)) continue;
        outer: for (let y = 3; y < ZONES.casa.h - 2; y++)
          for (let x = 2; x < ZONES.casa.w - 2; x++)
            if (!player.furn.some((g) => g !== f && g.x === x && g.y === y && (g.floor || 0) === 0) && !blocked.some(([a, b]) => a === x && b === y)) {
              f.x = x;
              f.y = y;
              break outer;
            }
      }
      saveGame();
    }
    return r;
  };
})();
