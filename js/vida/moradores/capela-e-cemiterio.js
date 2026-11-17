/**
 * ECOS DO ARCANO — capela-e-cemiterio.js
 * O Alto do Descanso, no sul da vila (o mapa está em alto-do-descanso.js):
 *  - Capela Branca: paredes caiadas, telhado de telha, porta azul em arco,
 *    sino e cruz. Lá dentro: rezar, acender vela, bênção do Frei Bento,
 *    confessar, doação.
 *  - Cemitério cercado por muro baixo branco, com túmulos de pedra e vasos de
 *    flores. Quem morreu na vila (e os antepassados da sua família) ganha um
 *    túmulo com nome; os outros são túmulos antigos de Cinzaluz.
 *  - Opções: desligar o golpe automático dos Iluministas e os ataques de
 *    monstros à vila.
 * Modifica (envolve) funções de outros arquivos: targetAt, interactAt, walkable,
 * crewDrawList, drawMinimap, enterZone, goToTemple, ilumCoupTick, startRaid,
 * renderOptions.
 */

"use strict";

const cemOn = () => !!(player && player.name);
const at = (p, x, y) => p && p[0] === x && p[1] === y;
const OLD_NAMES = ["Amélia Cardoso", "Joaquim Torres", "Benedita Luz", "Sebastião Ramos", "Isaura Prado", "Custódio Neves", "Firmina Rocha", "Damião Freitas", "Alzira Campos", "Honório Brás", "Eulália Serra", "Severino Lago", "Rosalina Dias", "Anacleto Mota", "Leocádia Paz", "Teobaldo Reis"];
const OLD_EPI = ["Saudades eternas da família.", "Aqui descansa um bom coração.", "Partiu cedo, ficou para sempre.", "Viveu para os outros.", "Que as runas o guardem.", "Amou Cinzaluz até o fim."];

/** Túmulos: primeiro os que você conhece, depois os antigos da vila. */
function cemGraves() {
  const known = [];
  for (const g of typeof lineage === "function" ? lineage() : []) known.push({ k: "fam" + g.gen, n: g.name, sub: `${g.age} anos · ${g.cause}`, fam: true });
  if (typeof deadList === "function")
    for (const [id, d] of Object.entries(deadList())) if (NPCS[id]) known.push({ k: id, id, n: shortName(id), sub: d.how === "velhice" ? "Morreu de velhice" : d.found ? "Assassinad" + gw(id, "o", "a") : "Desaparecid" + gw(id, "o", "a") });
  const L = known.slice(-DESC.graves.length);
  return DESC.graves.map((pos, i) => {
    if (L[i]) return { ...L[i], pos, known: true };
    const h = (pos[0] * 31 + pos[1] * 17) >>> 0;
    return { k: "old" + i, n: OLD_NAMES[h % OLD_NAMES.length], sub: OLD_EPI[h % OLD_EPI.length], pos, old: true };
  });
}
const chapelFront = () => [DESC.chapel.door[0], DESC.chapel.door[1] + 1];
function cemLabel(x, y) {
  if (!cemOn() || player.zone !== "vila") return null;
  if (at(DESC.chapel.door, x, y)) return "Entrar na Capela Branca";
  const gr = DESC.graves.some((p) => at(p, x, y)) && cemGraves().find((g) => at(g.pos, x, y));
  return gr ? `Túmulo de ${gr.n}` : null;
}
function chapelMenu() {
  const sinner = (player.murders || 0) > 0 && player.confessed !== player.murders;
  choice("Capela Branca", "Paredes caiadas, bancos de madeira e o cheiro de vela. O Frei Bento acena da frente do altar.", [
    { t: "Rezar em silêncio (15 min)", icon: "sparkle", fn: () => ((player.clock = Math.min(1439, player.clock + 15)), typeof addNeed === "function" && addNeed("fun", 5), say([["", pk(["A luz entra pela porta azul e pinta o chão. Você se sente mais leve.", "O silêncio da capela acalma qualquer coração.", "Você agradece pelo dia. Até pelas partes difíceis."])]])) },
    { t: "Acender uma vela por quem se foi (2 ouro)", icon: "candle", fn: () => (player.gold < 2 ? say([["", "Sem 2 de ouro para a vela."]]) : ((player.gold -= 2), saveGame(), say([["", `Você acende uma vela e pensa em ${pk(cemGraves()).n}. A chama dança, quieta.`]]))) },
    {
      t: "Pedir a bênção do Frei Bento",
      icon: "heart",
      fn: () => {
        if (player.blessDay === player.day) return say([["Frei Bento", "Você já foi abençoad" + genderWord("o", "a", "e") + " hoje. A bênção não acaba no almoço!"]]);
        player.blessDay = player.day;
        if (typeof addNeed === "function") addNeed("fun", 8);
        saveGame();
        say([["Frei Bento", pk(["Que as runas iluminem o seu caminho hoje.", "Vai em paz. E come alguma coisa, tá magr" + genderWord("o", "a", "e") + ".", "Que o seu dia seja leve como uma pena."])]]);
      },
    },
    {
      t: "Confessar",
      icon: "eye",
      fn: () =>
        sinner
          ? ((player.confessed = player.murders), saveGame(), say([["", "Você se ajoelha no confessionário e conta tudo."], ["Frei Bento", "...O segredo da confissão é sagrado. Mas as runas sabem. Tente fazer o bem daqui pra frente."]]))
          : say([["Frei Bento", pk(["Pecado? Comer o último pão da padaria não conta.", "Você tem a alma mais limpa da vila. Ou esconde muito bem."])]]),
    },
    { t: "Fazer uma doação (10 ouro)", icon: "coin", fn: () => (player.gold < 10 ? say([["", "Sem 10 de ouro."]]) : ((player.gold -= 10), typeof repAdd === "function" && repAdd(1), saveGame(), say([["Frei Bento", "Obrigado! Vai virar sopa para quem precisa."]]))) },
    { t: "Sair", fn: null },
  ]);
}
function graveMenu(gr) {
  player.graveFl = player.graveFl || {};
  choice(`Túmulo de ${gr.n}`, `<i>Aqui jaz ${gr.n}. ${gr.sub}.</i>${gr.fam ? "<br><small>Da sua família.</small>" : gr.old ? "<br><small>Um túmulo antigo de Cinzaluz.</small>" : ""}`, [
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
        say([["", "Você troca a água do vaso e deixa flores novas. Parece que alguém sorriu em algum lugar."]]);
      },
    },
    { t: "Rezar um pouco", icon: "sparkle", fn: () => ((player.clock = Math.min(1439, player.clock + 15)), say([["", pk(["Você fecha os olhos. O vento passa entre os túmulos.", "Uma paz estranha toma conta de você.", "Você lembra de um momento bom. Dá saudade."])]])) },
    { t: "Voltar", fn: null },
  ]);
}
function cemInteract(x, y) {
  const l = cemLabel(x, y);
  if (!l) return false;
  if (l === "Entrar na Capela Branca") return chapelMenu(), true;
  graveMenu(cemGraves().find((g) => at(g.pos, x, y)));
  return true;
}
/** Velórios e convites agora levam até a frente da Capela Branca. */
function goToChapel() {
  player.zone = "vila";
  [player.x, player.y] = chapelFront();
  player.rx = player.x;
  player.ry = player.y;
  player.dir = "up";
  game.fade = 1;
  enterZone(false);
}
if (typeof goToTemple === "function") goToTemple = goToChapel;

/* ===================== DESENHO ===================== */
const FLOWER_C = ["#ff6a8a", "#ffd86a", "#ff9a3c", "#ffffff", "#c88aff", "#ff4a6a", "#8ad0ff", "#ffb8d0"];
function pot(px, py, seed, big) {
  ctx.fillStyle = "#3a3a3a";
  ctx.fillRect(px - 3, py, 6, 5);
  for (let i = 0; i < (big ? 6 : 4); i++) {
    const a = seed * 7 + i * 2.1;
    ctx.fillStyle = "#2e6a34";
    ctx.fillRect(px - 1 + Math.cos(a) * 3, py - 3 + Math.sin(a) * 2, 2, 3);
    ctx.fillStyle = FLOWER_C[(seed + i) % FLOWER_C.length];
    ctx.fillRect(px - 2 + Math.cos(a) * 4, py - 5 + Math.sin(a) * 2.5, 3, 3);
  }
}
function drawGrave(g) {
  const T = TILE,
    [x, y] = g.pos,
    X = x * T,
    Y = y * T;
  const seed = (x * 13 + y * 7) % 97;
  ctx.fillStyle = "rgba(0,0,0,.22)";
  ctx.fillRect(X + 3, Y + 6, T - 2, T - 2);
  // laje de pedra
  ctx.fillStyle = g.fam ? "#bdb6c8" : "#b8b4aa";
  ctx.fillRect(X + 1, Y + 4, T - 2, T - 6);
  ctx.fillStyle = g.fam ? "#d6d0e0" : "#d2cec4";
  ctx.fillRect(X + 1, Y + 4, T - 2, 4);
  ctx.fillStyle = "#8a867c";
  ctx.fillRect(X + 1, Y + T - 3, T - 2, 1);
  // cabeceira com cruz
  ctx.fillStyle = "#e8e4dc";
  ctx.fillRect(X + T / 2 - 5, Y - 6, 10, 12);
  ctx.fillStyle = "#6a665e";
  ctx.fillRect(X + T / 2 - 1, Y - 4, 2, 8);
  ctx.fillRect(X + T / 2 - 3, Y - 2, 6, 2);
  // vasos de flores (mais quando você deixou flores hoje)
  pot(X + 8, Y + 16, seed, false);
  pot(X + T - 8, Y + 18, seed + 3, false);
  if (player.graveFl && player.graveFl[g.k] === player.day) (pot(X + T / 2, Y + 22, seed + 5, true), pot(X + 6, Y + 24, seed + 1, true));
  if (g.known) {
    ctx.fillStyle = "#2a5a3a";
    ctx.fillRect(X + T / 2 - 6, Y + 9, 12, 6);
    ctx.fillStyle = "#e8f0e0";
    ctx.fillRect(X + T / 2 - 4, Y + 11, 8, 1);
  }
}
function drawWallSeg(x, y, horiz) {
  const T = TILE,
    X = x * T,
    Y = y * T;
  if (!horiz) {
    // muro lateral: faixa branca contínua, vista de cima
    ctx.fillStyle = "rgba(0,0,0,.18)";
    ctx.fillRect(X + 12, Y, 18, T);
    ctx.fillStyle = "#f2f0ea";
    ctx.fillRect(X + 8, Y, 16, T);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(X + 8, Y, 4, T);
    ctx.fillStyle = "#d8d4ca";
    ctx.fillRect(X + 22, Y, 2, T);
    return;
  }
  ctx.fillStyle = "rgba(0,0,0,.18)";
  ctx.fillRect(X + 3, Y + 14, T, 18);
  ctx.fillStyle = "#f2f0ea";
  ctx.fillRect(X, Y + 6, T, 20);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(X, Y + 4, T, 4);
  ctx.fillStyle = "#d8d4ca";
  ctx.fillRect(X, Y + 24, T, 2);
  if (horiz)
    for (let k = 0; k < 4; k++) {
      // balaústres vazados, como no muro da foto
      ctx.fillStyle = "#cfcbc0";
      ctx.fillRect(X + 3 + k * 8, Y + 11, 4, 9);
    }
}
function drawChapel(t) {
  const T = TILE,
    C = DESC.chapel,
    X = C.x * T,
    Y = C.y * T,
    W = C.w * T,
    H = C.h * T;
  const night = typeof nightAlpha === "function" && nightAlpha() > 0.25;
  ctx.fillStyle = "rgba(0,0,0,.25)";
  ctx.fillRect(X + 8, Y + H - 4, W, 10);
  // corpo da capela (parede lateral caiada)
  ctx.fillStyle = "#f4f2ec";
  ctx.fillRect(X, Y + 1.6 * T, W, H - 1.6 * T);
  ctx.fillStyle = "#e2ded4";
  ctx.fillRect(X, Y + H - 6, W, 6);
  // telhado de telha (laranja-terracota, com fileiras)
  ctx.fillStyle = "#a8502a";
  fillPolygon(X - 8, Y + 1.8 * T, X + 10, Y + 0.2 * T, X + W - 10, Y + 0.2 * T, X + W + 8, Y + 1.8 * T);
  ctx.fillStyle = "#8a3e20";
  for (let r = 0; r < 5; r++) ctx.fillRect(X - 6 + r * 1.6, Y + 0.4 * T + r * 10, W + 12 - r * 3.2, 2);
  for (let k = 0; k < W / 10; k++) ctx.fillRect(X + k * 10, Y + 0.3 * T, 1, 1.5 * T);
  // fachada da frente (empena branca com duas torrinhas)
  const fx = X + W / 2 - 2.2 * T,
    fw = 4.4 * T,
    fy = Y + 1.2 * T;
  ctx.fillStyle = "#fbfaf6";
  ctx.fillRect(fx, fy + 0.8 * T, fw, H - 2 * T);
  fillPolygon(fx, fy + 0.85 * T, fx + fw / 2, fy - 0.6 * T, fx + fw, fy + 0.85 * T);
  ctx.fillStyle = "#e6e2d8";
  ctx.fillRect(fx, fy + 0.8 * T, 8, H - 2 * T);
  ctx.fillRect(fx + fw - 8, fy + 0.8 * T, 8, H - 2 * T);
  for (const px of [fx + 4, fx + fw - 4]) {
    ctx.fillStyle = "#fbfaf6";
    ctx.fillRect(px - 6, fy + 0.1 * T, 12, 0.8 * T);
    fillPolygon(px - 6, fy + 0.1 * T, px, fy - 0.9 * T, px + 6, fy + 0.1 * T);
    ctx.fillStyle = "#d8d4ca";
    ctx.fillRect(px - 6, fy + 0.1 * T, 12, 2);
  }
  // cruz no topo
  ctx.fillStyle = "#3a3a44";
  ctx.fillRect(fx + fw / 2 - 1.5, fy - 1.4 * T, 3, 0.9 * T);
  ctx.fillRect(fx + fw / 2 - 7, fy - 1.2 * T, 14, 3);
  // sininho na empena
  const sw = Math.sin(t * 2.2) * 2;
  ctx.fillStyle = "#3a3a44";
  ctx.fillRect(fx + fw / 2 - 1, fy - 0.1 * T, 2, 5);
  ctx.fillStyle = "#c9a03a";
  fillPolygon(fx + fw / 2 - 5 + sw, fy - 0.1 * T + 5, fx + fw / 2 + 5 + sw, fy - 0.1 * T + 5, fx + fw / 2 + 7 + sw, fy + 0.1 * T + 10, fx + fw / 2 - 7 + sw, fy + 0.1 * T + 10);
  // lampião ao lado da porta
  ctx.fillStyle = "#2a2a30";
  ctx.fillRect(fx + 14, fy + 1.4 * T, 6, 8);
  ctx.fillStyle = night ? "#ffd86a" : "#8a8a7a";
  ctx.fillRect(fx + 15, fy + 1.4 * T + 1, 4, 5);
  // porta azul em arco
  const [dx, dy] = C.door,
    D0 = dx * T,
    dh = 1.6 * T;
  const doorTop = (dy + 1) * T - dh;
  ctx.fillStyle = "#e0dcd2";
  ctx.fillRect(D0 - 4, doorTop - 2, T + 8, dh + 2);
  ctx.beginPath();
  ctx.arc(D0 + T / 2, doorTop + 2, T / 2 + 4, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = "#2a5ab0";
  ctx.fillRect(D0, doorTop + 2, T, dh - 2);
  ctx.beginPath();
  ctx.arc(D0 + T / 2, doorTop + 2, T / 2, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = "#1c4290";
  for (let k = 1; k < 4; k++) ctx.fillRect(D0 + k * 8, doorTop - 6, 1, dh + 4);
  ctx.fillStyle = "#d9a441";
  ctx.fillRect(D0 + T / 2 + 3, doorTop + dh / 2, 2, 3);
  // degrau de pedra
  ctx.fillStyle = "#c8c4ba";
  ctx.fillRect(D0 - 6, (dy + 1) * T - 3, T + 12, 4);
}
function drawCemArea(t) {
  const T = TILE,
    { x0, x1, y0, y1 } = DESC.wall;
  // piso de pedra dentro do muro
  for (let y = y0 + 1; y < y1; y++)
    for (let x = x0 + 1; x < x1; x++) {
      ctx.fillStyle = (x + y) % 2 ? "#a8a49a" : "#b2aea4";
      ctx.fillRect(x * T, y * T, T, T);
      ctx.fillStyle = "#96928a";
      ctx.fillRect(x * T, y * T, T, 1);
      ctx.fillRect(x * T, y * T, 1, T);
    }
  // caminho e entrada
  ctx.fillStyle = "#9a8462";
  for (const [gx, gy] of DESC.gate) ctx.fillRect(34 * T, gy * T + 4, 3 * T, T - 8);
}
/** Placa na estrada e no portão. */
function drawCemSign() {
  const T = TILE,
    [gx, gy] = DESC.gate[0];
  ctx.fillStyle = "#5a3a22";
  ctx.fillRect(34 * T + 14, gy * T - 30, 4, 34);
  ctx.fillStyle = "#f2f0ea";
  ctx.fillRect(34 * T - 34, gy * T - 46, 100, 18);
  ctx.strokeStyle = "#8a7a62";
  ctx.lineWidth = 2;
  ctx.strokeRect(34 * T - 34, gy * T - 46, 100, 18);
  ctx.fillStyle = "#3a3a44";
  ctx.font = '700 10px "Pixelify Sans", sans-serif';
  ctx.textAlign = "center";
  ctx.fillText("CAPELA E CEMITÉRIO", 34 * T + 16, gy * T - 33);
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
  const cdBase = crewDrawList;
  crewDrawList = function (list, t) {
    cdBase(list, t);
    if (!cemOn() || player.zone !== "vila") return;
    const { x0, x1, y0, y1 } = DESC.wall;
    list.push({ y: -6, draw: () => drawCemArea(t) });
    // muro: cada pedaço entra na ordem de profundidade da sua linha
    list.push({ y: y0 + 0.2, draw: () => { for (let x = x0; x <= x1; x++) drawWallSeg(x, y0, true); } });
    list.push({ y: y1 + 0.2, draw: () => { for (let x = x0; x <= x1; x++) drawWallSeg(x, y1, true); } });
    for (let y = y0 + 1; y < y1; y++)
      list.push({ y: y + 0.2, draw: () => { for (const x of [x0, x1]) if (!DESC.gate.some((g) => at(g, x, y))) drawWallSeg(x, y, false); } });
    const gs = cemGraves();
    for (const g of gs) list.push({ y: g.pos[1] + 0.3, draw: () => drawGrave(g) });
    list.push({ y: DESC.chapel.door[1] + 0.4, draw: () => drawChapel(t) });
    list.push({ y: DESC.gate[0][1] - 1, draw: () => drawCemSign() });
  };
  // saves antigos que estavam no cemitério separado voltam para a frente da capela
  const ezBase = enterZone;
  enterZone = function () {
    if (player && player.zone === "cemiterio") ((player.zone = "vila"), ([player.x, player.y] = chapelFront()), (player.rx = player.x), (player.ry = player.y));
    return ezBase.apply(this, arguments);
  };
})();

/* ===================== NO MAPA ===================== */
{
  const dmBase = drawMinimap;
  drawMinimap = function (big, t) {
    const r = dmBase.apply(this, arguments);
    if (!cemOn() || player.zone !== "vila") return r;
    const z = ZONES.vila;
    const s = big ? Math.min(560 / z.w, 330 / z.h) : Math.min(96 / z.w, 72 / z.h);
    const ox = big ? Math.round(viewWidth / 2 - (z.w * s) / 2) : Math.round(viewWidth - 8 - z.w * s),
      oy = big ? Math.round(236 - (z.h * s) / 2) : 40;
    const [gx, gy] = DESC.chapel.door;
    const cx = ox + (gx + 0.5) * s,
      cy = oy + (gy - 2) * s,
      k = big ? 5 : 3;
    ctx.save();
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#1a1420";
    ctx.fillRect(cx - k / 2 - 1, cy - k * 1.6 - 1, k + 2, k * 3.2 + 2);
    ctx.fillRect(cx - k * 1.3 - 1, cy - k * 0.8 - 1, k * 2.6 + 2, k + 2);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(cx - k / 2, cy - k * 1.6, k, k * 3.2);
    ctx.fillRect(cx - k * 1.3, cy - k * 0.8, k * 2.6, k);
    if (big) {
      ctx.font = '700 13px "Pixelify Sans", sans-serif';
      ctx.textAlign = "left";
      ctx.strokeStyle = "#1a1420";
      ctx.lineWidth = 3;
      ctx.strokeText("Capela e Cemitério", cx + 10, cy + 4);
      ctx.fillStyle = "#ffffff";
      ctx.fillText("Capela e Cemitério", cx + 10, cy + 4);
    }
    ctx.restore();
    return r;
  };
}
{
  let told = false;
  const ezBase = enterZone;
  enterZone = function () {
    const r = ezBase.apply(this, arguments);
    if (!told && player && player.name && player.zone === "vila" && !(player.flags && player.flags.descTip)) {
      told = true;
      player.flags = player.flags || {};
      player.flags.descTip = true;
      setTimeout(() => toast("A vila cresceu! No sul fica o Alto do Descanso, com a Capela Branca e o Cemitério (a cruz no mapa, tecla M).", 5600), 4000);
    }
    return r;
  };
}

/* ===================== OPÇÕES: GOLPE E MONSTROS ===================== */
{
  const ctBase = ilumCoupTick;
  ilumCoupTick = function () {
    if (settings.noCoup) {
      if (player && player.ilumCoupDay) player.ilumCoupDay = null;
      return;
    }
    return ctBase.apply(this, arguments);
  };
  const srBase = startRaid;
  startRaid = function () {
    if (settings.noRaid) return;
    return srBase.apply(this, arguments);
  };
  const roBase = renderOptions;
  renderOptions = function () {
    roBase.apply(this, arguments);
    const box = byId("options");
    if (!box || box.querySelector("#optWorld")) return;
    const seg = (k, on) => `<div class="seg"><button data-wopt="${k}" data-v="0" class="${settings[k] ? "" : "on"}">Ligado</button><button data-wopt="${k}" data-v="1" class="${settings[k] ? "on" : ""}">Desligado</button></div>`;
    const html = `<h3 id="optWorld">Acontecimentos da vila</h3>
      <div class="opt"><span>Golpe de Estado automático dos Iluministas</span>${seg("noCoup")}</div>
      <div class="opt"><span>Ataques de monstros à vila</span>${seg("noRaid")}</div>`;
    const help = [...box.querySelectorAll("h3")].find((h) => /Ajuda/.test(h.textContent));
    if (help) help.insertAdjacentHTML("beforebegin", html);
    else box.insertAdjacentHTML("beforeend", html);
    box.querySelectorAll("[data-wopt]").forEach((b) => {
      b.onclick = () => {
        settings[b.dataset.wopt] = b.dataset.v === "1";
        saveSettings();
        toast(b.dataset.wopt === "noCoup" ? (settings.noCoup ? "Os Iluministas não vão mais dar golpe sozinhos." : "Golpe automático ligado de novo.") : settings.noRaid ? "Sem ataques de monstros à vila." : "Ataques de monstros ligados de novo.", 2600);
        renderOptions();
      };
    });
  };
}
