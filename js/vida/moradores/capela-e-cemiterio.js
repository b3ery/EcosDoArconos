/**
 * ECOS DO ARCANO — capela-e-cemiterio.js (Simulador)
 * Capela e Cemitério de Cinzaluz, ao ar livre (entrada ao lado do Templo da Luz):
 *  - a Capela de pedra, com torre e sino: rezar, acender vela, pedir a bênção
 *    do Frei Bento, confessar, fazer doação;
 *  - ao lado, o cemitério todo cercado, com portão em arco. Um túmulo para cada
 *    morador que morreu e para os antepassados da sua família: ler o epitáfio,
 *    deixar flores e rezar.
 * Modifica (envolve) funções de outros arquivos: targetAt, interactAt, walkable,
 * crewDrawList.
 */

"use strict";

const CEM = { w: 28, h: 17, exit: [13, 16], arrive: [13, 15], chapel: { x: 2, y: 2, w: 8, h: 7, door: [6, 8] }, yard: { x: 12, y: 2, x2: 26, y2: 13, gate: [19, 13] } };
const CEM_TREES = [[10, 3], [10, 12], [3, 13], [8, 14], [24, 15], [1, 10]];
const CEM_SLOTS = [];
for (const y of [4, 7, 10]) for (const x of [14, 16, 18, 20, 22, 24]) CEM_SLOTS.push([x, y]);

ZONE_DEFS.cemiterio = { nome: "Capela e Cemitério", theme: "casa", exits: {}, enemies: [] };
ZONES.cemiterio = (() => {
  const { w, h, chapel: C, yard: Y } = CEM;
  const m = makeGrid(w, h, (x, y) => (x === 0 || y === 0 || x === w - 1 || y === h - 1 ? "#" : "."));
  for (let y = C.y; y <= C.y + C.h - 1; y++) for (let x = C.x; x < C.x + C.w; x++) m[y][x] = "#";
  for (let x = Y.x; x <= Y.x2; x++) ((m[Y.y][x] = "#"), (m[Y.y2][x] = "#"));
  for (let y = Y.y; y <= Y.y2; y++) ((m[y][Y.x] = "#"), (m[y][Y.x2] = "#"));
  m[Y.gate[1]][Y.gate[0]] = ".";
  for (const [x, y] of CEM_TREES) m[y][x] = "#";
  m[CEM.exit[1]][CEM.exit[0]] = "#";
  const z = finalize("cemiterio", ZONE_DEFS.cemiterio, m, w, h, {}, {}, null);
  z.town = { bld: [], doors: {}, stalls: {}, huts: [], arrive: CEM.arrive.slice(), horses: [], boats: [], indoor: true };
  return z;
})();

function cemGraves() {
  const out = [];
  for (const g of typeof lineage === "function" ? lineage() : []) out.push({ k: "fam" + g.gen, n: g.name, sub: `${g.age} anos · ${g.cause}`, fam: true });
  if (typeof deadList === "function")
    for (const [id, d] of Object.entries(deadList())) if (NPCS[id]) out.push({ k: id, id, n: shortName(id), sub: d.how === "velhice" ? "Morreu de velhice" : d.found ? "Assassinad" + gw(id, "o", "a") : "Desaparecid" + gw(id, "o", "a"), fam: false });
  return out.slice(-CEM_SLOTS.length).map((g, i) => ({ ...g, pos: CEM_SLOTS[i] }));
}
let cemGate = null;
function cemGatePos() {
  if (cemGate) return cemGate;
  const b = ZONES.vila.town.bld.find((q) => q.name === "Templo da Luz");
  if (!b) return null;
  for (const [x, y] of [[b.x + b.w, b.y + b.h], [b.x - 1, b.y + b.h], [b.x + b.w, b.y + b.h + 1], [b.x - 1, b.y + b.h + 1]]) if (walkable("vila", x, y)) return (cemGate = [x, y]);
  return null;
}
const cemOn = () => lifeMode() && player && player.name;
const at = (p, x, y) => p && p[0] === x && p[1] === y;
function cemLabel(x, y) {
  if (!cemOn()) return null;
  if (player.zone === "vila") return at(cemGatePos(), x, y) ? "Ir à Capela e ao Cemitério" : null;
  if (player.zone !== "cemiterio") return null;
  if (at(CEM.exit, x, y)) return "Voltar para a vila";
  if (at(CEM.chapel.door, x, y)) return "Entrar na Capela";
  const gr = cemGraves().find((g) => at(g.pos, x, y));
  return gr ? `Túmulo de ${gr.n}` : null;
}
function chapelMenu() {
  const sinner = (player.murders || 0) > 0 && player.confessed !== player.murders;
  choice("Capela de Cinzaluz", "Bancos de madeira, vitrais coloridos e o cheiro de vela. O Frei Bento acena com a cabeça.", [
    { t: "Rezar em silêncio (15 min)", icon: "sparkle", fn: () => ((player.clock = Math.min(1439, player.clock + 15)), typeof addNeed === "function" && addNeed("fun", 5), say([["", pk(["A luz dos vitrais pinta o chão de azul e vermelho. Você se sente mais leve.", "O silêncio da capela acalma qualquer coração.", "Você agradece pelo dia. Até pelas partes difíceis."])]])) },
    { t: "Acender uma vela por quem se foi (2 ouro)", icon: "candle", fn: () => (player.gold < 2 ? say([["", "Sem 2 de ouro para a vela."]]) : ((player.gold -= 2), saveGame(), say([["", `Você acende uma vela${cemGraves().length ? ` e pensa em ${pk(cemGraves()).n}` : ""}. A chama dança, quieta.`]]))) },
    {
      t: "Pedir a bênção do Frei Bento",
      icon: "heart",
      fn: () => {
        if (player.blessDay === player.day) return say([["Frei Bento", "Você já foi abençoad" + genderWord("o", "a", "e") + " hoje. A bênção não acaba no almoço!"]]);
        player.blessDay = player.day;
        if (typeof addNeed === "function") addNeed("fun", 8);
        saveGame();
        say([["Frei Bento", pk(["Que as runas iluminem o seu caminho hoje.", "Vai em paz. E come alguma coisa, tá magr" + genderWord("o", "a", "e") + ".", "Que o seu dia seja leve como uma pena."])], ["", "Você se sente abençoad" + genderWord("o", "a", "e") + "."]]);
      },
    },
    {
      t: "Confessar",
      icon: "eye",
      fn: () =>
        sinner
          ? ((player.confessed = player.murders), saveGame(), say([["", "Você se ajoelha no confessionário e conta tudo. Tudo mesmo."], ["Frei Bento", "...O segredo da confissão é sagrado. Mas as runas sabem. Tente fazer o bem daqui pra frente."], ["", "Um peso sai das suas costas. Ninguém mais vai saber por ele."]]))
          : say([["Frei Bento", pk(["Pecado? Comer o último pão da padaria não conta.", "Você tem a alma mais limpa da vila. Ou esconde muito bem."])]]),
    },
    { t: "Fazer uma doação (10 ouro)", icon: "coin", fn: () => (player.gold < 10 ? say([["", "Sem 10 de ouro."]]) : ((player.gold -= 10), typeof repAdd === "function" && repAdd(1), saveGame(), say([["Frei Bento", "Obrigado! Vai virar sopa para quem precisa."]]))) },
    { t: "Sair", fn: null },
  ]);
}
function cemInteract(x, y) {
  const l = cemLabel(x, y);
  if (!l) return false;
  const go = (zone, pos, dir) => {
    player.zone = zone;
    [player.x, player.y] = pos;
    player.rx = player.x;
    player.ry = player.y;
    player.dir = dir;
    game.fade = 1;
    enterZone(false);
  };
  if (l === "Ir à Capela e ao Cemitério") {
    go("cemiterio", CEM.arrive, "up");
    if (!cemGraves().length) toast("A Capela fica à esquerda; o cemitério, cercado, à direita.", 3200);
    return true;
  }
  if (l === "Voltar para a vila") {
    const g = cemGatePos();
    go("vila", [g[0], g[1] + 1], "down");
    return true;
  }
  if (l === "Entrar na Capela") return chapelMenu(), true;
  const gr = cemGraves().find((g) => at(g.pos, x, y));
  player.graveFl = player.graveFl || {};
  choice(`Túmulo de ${gr.n}`, `<i>Aqui jaz ${gr.n}. ${gr.sub}.</i>${gr.fam ? "<br><small>Da sua família.</small>" : ""}`, [
    {
      t: player.graveFl[gr.k] === player.day ? "Flores já deixadas hoje" : "Deixar flores (3 ouro)",
      icon: "flower",
      fn: () => {
        if (player.graveFl[gr.k] === player.day) return;
        if (player.gold < 3 && !itemCount("flor")) return say([["", "Sem flores nem ouro para comprar."]]);
        itemCount("flor") ? removeItem("flor") : (player.gold -= 3);
        player.graveFl[gr.k] = player.day;
        const sp = gr.id && typeof npcSpouse === "function" && npcSpouse(gr.id);
        if (sp && named(sp)) addFriendship(sp, 3);
        if (typeof addNeed === "function") addNeed("fun", 4);
        saveGame();
        say([["", "Você deixa as flores com cuidado. Parece que alguém sorriu em algum lugar."]]);
      },
    },
    { t: "Rezar um pouco", icon: "sparkle", fn: () => ((player.clock = Math.min(1439, player.clock + 15)), say([["", pk(["Você fecha os olhos. O vento passa pelas lápides.", "Uma paz estranha toma conta de você.", "Você lembra de um momento bom. Dá saudade."])]])) },
    { t: "Voltar", fn: null },
  ]);
  return true;
}

/* ===================== DESENHO ===================== */
function cemTree(x, y, t) {
  const T = TILE,
    X = x * T + T / 2,
    Y = y * T + T;
  ctx.fillStyle = "rgba(0,0,0,.25)";
  ctx.beginPath();
  ctx.ellipse(X, Y - 2, 16, 5, 0, 0, 7);
  ctx.fill();
  ctx.fillStyle = "#4a3020";
  ctx.fillRect(X - 4, Y - 26, 8, 24);
  const sw = Math.sin(t * 1.5 + x) * 1.5;
  for (const [dx, dy, r, c] of [[0, -40, 18, "#24452a"], [-9, -32, 12, "#2c5432"], [9, -33, 12, "#2c5432"], [0, -48, 11, "#35613a"]]) {
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.arc(X + dx + sw, Y + dy, r, 0, 7);
    ctx.fill();
  }
}
function drawCemetery(t) {
  const T = TILE,
    { w, h, chapel: C, yard: Y } = CEM;
  const night = typeof nightAlpha === "function" && nightAlpha() > 0.25;
  // grama
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      ctx.fillStyle = (x * 7 + y * 3) % 5 ? "#4a7a3e" : "#538446";
      ctx.fillRect(x * T, y * T, T, T);
      if ((x * 13 + y * 7) % 9 === 0) ((ctx.fillStyle = "#6a9a52"), ctx.fillRect(x * T + 8, y * T + 12, 2, 4), ctx.fillRect(x * T + 20, y * T + 22, 2, 4));
    }
  // caminhos de terra
  ctx.fillStyle = "#9a8462";
  const path = (x1, y1, x2, y2) => ctx.fillRect(Math.min(x1, x2) * T + 6, Math.min(y1, y2) * T + 6, (Math.abs(x2 - x1) + 1) * T - 12, (Math.abs(y2 - y1) + 1) * T - 12);
  path(6, 15, 19, 15);
  path(13, 15, 13, 16);
  path(6, 9, 6, 15);
  path(19, 13, 19, 15);
  path(19, 3, 19, 12);
  // muro baixo de pedra em volta
  ctx.fillStyle = "#6a6a72";
  for (let x = 0; x < w; x++) (ctx.fillRect(x * T, 0, T, T - 10), ctx.fillRect(x * T, (h - 1) * T + 10, T, T - 10));
  for (let y = 0; y < h; y++) (ctx.fillRect(0, y * T, T - 10, T), ctx.fillRect((w - 1) * T + 10, y * T, T - 10, T));
  // saída para a vila
  ctx.fillStyle = "#3a2a1a";
  ctx.fillRect(CEM.exit[0] * T + 2, (h - 1) * T + 6, T - 4, T - 6);
  ctx.fillStyle = "#e8e0d0";
  ctx.font = '700 9px "Pixelify Sans", sans-serif';
  ctx.textAlign = "center";
  ctx.fillText("VILA", CEM.exit[0] * T + T / 2, (h - 1) * T + 4);

  /* ---- a Capela ---- */
  const cx = C.x * T,
    cy = C.y * T,
    cw = C.w * T;
  ctx.fillStyle = "rgba(0,0,0,.28)";
  ctx.fillRect(cx + 6, cy + C.h * T - 6, cw, 10);
  // paredes de pedra
  ctx.fillStyle = "#b8b0a2";
  ctx.fillRect(cx, cy + 2.4 * T, cw, C.h * T - 2.4 * T);
  ctx.fillStyle = "#9a9284";
  for (let r = 0; r < 9; r++) {
    ctx.fillRect(cx, cy + 2.4 * T + r * 12, cw, 1);
    for (let k = 0; k < cw / 20; k++) ctx.fillRect(cx + (r % 2) * 10 + k * 20, cy + 2.4 * T + r * 12, 1, 12);
  }
  // telhado
  ctx.fillStyle = "#6a2a2a";
  fillPolygon(cx - 10, cy + 2.6 * T, cx + cw / 2, cy + 0.4 * T, cx + cw + 10, cy + 2.6 * T);
  ctx.fillStyle = "#8a3a3a";
  fillPolygon(cx - 10, cy + 2.6 * T, cx + cw / 2, cy + 0.4 * T, cx + cw / 2 - 8, cy + 2.6 * T);
  // torre com sino
  const tx = cx + cw / 2 - 18;
  ctx.fillStyle = "#a8a092";
  ctx.fillRect(tx, cy - 1.4 * T, 36, 2 * T);
  ctx.fillStyle = "#2a2430";
  ctx.fillRect(tx + 8, cy - 1.1 * T, 20, 22);
  ctx.fillStyle = "#d9a441";
  const bs = Math.sin(t * 2) * 2;
  fillPolygon(tx + 12 + bs, cy - 1.1 * T + 6, tx + 24 + bs, cy - 1.1 * T + 6, tx + 27 + bs, cy - 1.1 * T + 20, tx + 9 + bs, cy - 1.1 * T + 20);
  ctx.fillStyle = "#4a2a2a";
  fillPolygon(tx - 6, cy - 1.4 * T, tx + 18, cy - 2.6 * T, tx + 42, cy - 1.4 * T);
  ctx.fillStyle = "#f2e6c0";
  ctx.fillRect(tx + 17, cy - 3.4 * T, 3, 26);
  ctx.fillRect(tx + 11, cy - 3.2 * T, 15, 3);
  // vitral redondo
  const rx = cx + cw / 2,
    ry = cy + 3.4 * T;
  for (const [r, c] of [[15, "#4a3a2a"], [12, night ? "#ffd86a" : "#4a6aaa"]]) ((ctx.fillStyle = c), ctx.beginPath(), ctx.arc(rx, ry, r, 0, 7), ctx.fill());
  ctx.fillStyle = night ? "#ff9a5a" : "#c84a5a";
  for (let k = 0; k < 4; k++) (ctx.beginPath(), ctx.moveTo(rx, ry), ctx.arc(rx, ry, 12, (k * Math.PI) / 2, (k * Math.PI) / 2 + 0.7), ctx.fill());
  // janelas compridas
  for (const wx of [cx + 14, cx + cw - 26]) {
    ctx.fillStyle = "#4a3a2a";
    ctx.fillRect(wx - 2, cy + 3 * T - 2, 16, 36);
    ctx.fillStyle = night ? "#ffd86a" : "#6a8aca";
    ctx.fillRect(wx, cy + 3 * T, 12, 32);
    ctx.fillStyle = night ? "#ff9a5a" : "#c8a04a";
    ctx.fillRect(wx, cy + 3 * T + 12, 12, 4);
  }
  // porta em arco
  const [dx, dy] = C.door;
  ctx.fillStyle = "#3a2414";
  ctx.fillRect(dx * T - 8, dy * T - 12, T + 16, T + 12);
  ctx.beginPath();
  ctx.arc(dx * T + T / 2, dy * T - 12, T / 2 + 8, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = "#7a4a26";
  ctx.fillRect(dx * T - 4, dy * T - 10, T + 8, T + 10);
  ctx.fillStyle = "#5a3418";
  ctx.fillRect(dx * T + T / 2 - 1, dy * T - 10, 2, T + 10);
  ctx.fillStyle = "#e8e0d0";
  ctx.font = '700 10px "Pixelify Sans", sans-serif';
  ctx.fillText("CAPELA", cx + cw / 2, cy + C.h * T + 12);

  /* ---- o cemitério cercado ---- */
  // chão de dentro mais escuro
  ctx.fillStyle = "rgba(20,40,20,.18)";
  ctx.fillRect((Y.x + 1) * T, (Y.y + 1) * T, (Y.x2 - Y.x - 1) * T, (Y.y2 - Y.y - 1) * T);
  // cerca de ferro: postes + duas travessas
  const iron = "#2a2a32",
    tip = "#5a5a66";
  const fenceTile = (x, y, horiz) => {
    if (horiz) {
      ctx.fillStyle = iron;
      ctx.fillRect(x * T, y * T + 10, T, 3);
      ctx.fillRect(x * T, y * T + 24, T, 3);
      for (let k = 0; k < 4; k++) ((ctx.fillStyle = iron), ctx.fillRect(x * T + 3 + k * 8, y * T + 4, 3, 26), (ctx.fillStyle = tip), ctx.fillRect(x * T + 2 + k * 8, y * T + 2, 5, 3));
    } else {
      ctx.fillStyle = iron;
      ctx.fillRect(x * T + 14, y * T, 4, T);
      for (let k = 0; k < 2; k++) ((ctx.fillStyle = tip), ctx.fillRect(x * T + 12, y * T + 4 + k * 16, 8, 3));
    }
  };
  for (let x = Y.x; x <= Y.x2; x++) {
    fenceTile(x, Y.y, true);
    if (x !== Y.gate[0]) fenceTile(x, Y.y2, true);
  }
  for (let y = Y.y + 1; y < Y.y2; y++) (fenceTile(Y.x, y, false), fenceTile(Y.x2, y, false));
  // portão em arco
  const [gx, gy] = Y.gate;
  ctx.fillStyle = "#7a7480";
  ctx.fillRect(gx * T - 8, gy * T - 22, 9, T + 22);
  ctx.fillRect(gx * T + T - 1, gy * T - 22, 9, T + 22);
  ctx.strokeStyle = iron;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(gx * T + T / 2, gy * T - 18, T / 2 + 4, Math.PI, 0);
  ctx.stroke();
  ctx.fillStyle = "#3a2a1a";
  ctx.fillRect(gx * T - 14, gy * T - 46, T + 28, 13);
  ctx.fillStyle = "#e8e0d0";
  ctx.font = '700 9px "Pixelify Sans", sans-serif';
  ctx.fillText("CEMITÉRIO", gx * T + T / 2, gy * T - 36);
  // anjo de pedra e lampiões
  ctx.fillStyle = "#c8c4bc";
  ctx.fillRect(25 * T - 4, 11 * T + 2, 10, 24);
  ctx.fillRect(25 * T - 12, 11 * T + 6, 26, 5);
  for (const [lx, ly] of [[5, 10], [11, 14], [16, 14], [22, 14]]) {
    ctx.fillStyle = "#2a2a32";
    ctx.fillRect(lx * T + 14, ly * T - 8, 4, 34);
    ctx.fillStyle = night ? `rgba(255,214,110,${0.8 + 0.2 * Math.sin(t * 7 + lx)})` : "#8a8a7a";
    ctx.fillRect(lx * T + 10, ly * T - 16, 12, 10);
  }
  // túmulos
  const gs = cemGraves();
  for (const [x, y] of CEM_SLOTS) {
    const g = gs.find((q) => at(q.pos, x, y));
    ctx.fillStyle = "rgba(0,0,0,.18)";
    ctx.fillRect(x * T + 4, y * T + 26, T - 8, 4);
    if (!g) continue;
    ctx.fillStyle = "#5a3a22";
    ctx.fillRect(x * T + 3, y * T + 20, T - 6, 10);
    ctx.fillStyle = g.fam ? "#b8b0c8" : "#a8a49c";
    ctx.fillRect(x * T + 7, y * T + 2, T - 14, 20);
    ctx.beginPath();
    ctx.arc(x * T + T / 2, y * T + 4, (T - 14) / 2, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = "#4a4650";
    ctx.fillRect(x * T + T / 2 - 1, y * T + 5, 2, 9);
    ctx.fillRect(x * T + T / 2 - 4, y * T + 8, 8, 2);
    if (player.graveFl && player.graveFl[g.k] === player.day) for (const [dx2, c] of [[5, "#ff6a8a"], [10, "#ffd86a"], [T - 9, "#b48aff"]]) ((ctx.fillStyle = c), ctx.fillRect(x * T + dx2, y * T + 22, 4, 4));
    ctx.font = '600 9px "Pixelify Sans", sans-serif';
    ctx.fillStyle = "#fff";
    ctx.fillText(g.n.slice(0, 12), x * T + T / 2, y * T + 40);
  }
  for (const [x, y] of CEM_TREES) cemTree(x, y, t);
}
/** Entrada na vila: arco com placa e um pedaço de cerca dos dois lados. */
function drawCemGate() {
  const g = cemGatePos();
  if (!g) return;
  const [x, y] = g,
    T = TILE;
  const iron = "#2a2a32";
  for (const side of [-1, 1]) {
    const fx = side < 0 ? x * T - T : x * T + T;
    ctx.fillStyle = iron;
    ctx.fillRect(fx, y * T + 8, T, 3);
    ctx.fillRect(fx, y * T + 20, T, 3);
    for (let k = 0; k < 4; k++) ((ctx.fillStyle = iron), ctx.fillRect(fx + 3 + k * 8, y * T + 2, 3, 26), (ctx.fillStyle = "#5a5a66"), ctx.fillRect(fx + 2 + k * 8, y * T, 5, 3));
  }
  ctx.fillStyle = "#7a7480";
  ctx.fillRect(x * T - 4, y * T - 14, 7, T + 14);
  ctx.fillRect(x * T + T - 3, y * T - 14, 7, T + 14);
  ctx.strokeStyle = iron;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(x * T + T / 2, y * T - 10, T / 2 + 2, Math.PI, 0);
  ctx.stroke();
  ctx.fillStyle = "#3a2a1a";
  ctx.fillRect(x * T - 26, y * T - 40, T + 52, 13);
  ctx.fillStyle = "#e8e0d0";
  ctx.font = '700 9px "Pixelify Sans", sans-serif';
  ctx.textAlign = "center";
  ctx.fillText("CAPELA E CEMITÉRIO", x * T + T / 2, y * T - 30);
}
(() => {
  const tgBase = targetAt;
  targetAt = function (x, y) {
    return cemLabel(x, y) || tgBase(x, y);
  };
  const iaBase = interactAt;
  interactAt = function (x, y) {
    if (cemInteract(x, y)) return;
    return iaBase(x, y);
  };
  const wkBase = walkable;
  walkable = function (z, x, y) {
    if (z === "cemiterio" && CEM_SLOTS.some((p) => at(p, x, y)) && cemGraves().some((g) => at(g.pos, x, y))) return false;
    return wkBase(z, x, y);
  };
  cemGatePos();
  const cdBase = crewDrawList;
  crewDrawList = function (list, t) {
    cdBase(list, t);
    if (!cemOn()) return;
    if (player.zone === "cemiterio") list.push({ y: -6, draw: () => drawCemetery(t) });
    if (player.zone === "vila") {
      const g = cemGatePos();
      if (g) list.push({ y: g[1] - 0.5, draw: () => drawCemGate() });
    }
  };
})();
