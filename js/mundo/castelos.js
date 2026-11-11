/**
 * ECOS DO ARCANO — castelos.js
 * Os outros reinos ganham as suas sedes:
 *  - Palácio das Marés (Porto Brisamar): numa ilha no mar, ligada pela ponte do cais.
 *    Paredes brancas, cúpulas azul-turquesa e bandeiras com a onda.
 *  - Fortaleza de Pedravale (Serra): pedra escura, ameias, runas e o portão de ferro.
 * Dentro, o salão do trono com o governante (ou com você, se tiver conquistado o reino).
 * Modifica (envolve) funções de outros arquivos: bldService, drawBuilding, genInterior.
 */

"use strict";

KEEPERS.palacio = ["Príncipe-Almirante Tarso", "#2a6a8a", "#d8d2c4"];
KEEPERS.fortaleza = ["Rei-Anão Durgan", "#6a3a2a", "#c9a050"];
const REALM_SEATS = {
  palacio: { k: "mares", name: "Palácio das Marés", ruler: "Príncipe-Almirante Tarso" },
  fortaleza: { k: "serra", name: "Fortaleza de Pedravale", ruler: "Rei-Anão Durgan" },
};

function setZoneTile(zone, x, y, c) {
  const rows = ZONES[zone].map;
  if (!rows[y] || x < 0 || x >= rows[y].length) return;
  rows[y] = rows[y].slice(0, x) + c + rows[y].slice(x + 1);
}
function placeSeat(zone, b) {
  const tw = ZONES[zone].town;
  for (let y = b.y; y < b.y + b.h; y++) for (let x = b.x; x < b.x + b.w; x++) setZoneTile(zone, x, y, "H");
  for (const dx of b.door) {
    setZoneTile(zone, dx, b.y + b.h - 1, "D");
    tw.doors[dx + "," + (b.y + b.h - 1)] = b;
  }
  tw.bld.push(b);
}
(function buildSeats() {
  // Porto: ilha no mar, ligada à ponte que já existe no meio do cais (x 31-32).
  const P = ZONES.porto;
  if (P && P.town && !P.town.bld.some((b) => b.style === "palacio")) {
    for (let y = 25; y <= 30; y++) for (let x = 22; x <= 41; x++) setZoneTile("porto", x, y, y === 25 || y === 30 || x === 22 || x === 41 ? "," : ".");
    for (const [x, y] of [
      [23, 29],
      [40, 29],
      [23, 26],
      [40, 26],
    ])
      setZoneTile("porto", x, y, "T");
    placeSeat("porto", { x: 27, y: 26, w: 9, h: 3, door: [31], name: "Palácio das Marés", style: "palacio" });
    // A ilha foi construída em cima do mar: os barcos que ficaram na areia vão para a água mais perto.
    const water = (x, y) => P.map[y] && P.map[y][Math.round(x)] === "~";
    P.town.boats = P.town.boats.map(([bx, by]) => {
      if (water(bx, by)) return [bx, by];
      for (let d = 1; d < 12; d++)
        for (const [nx, ny] of [[bx - d, by], [bx + d, by], [bx, by + d], [bx - d, by + d], [bx + d, by + d]])
          if (water(nx, ny) && water(nx + 1, ny) && !P.town.boats.some(([ox, oy]) => Math.abs(ox - nx) < 3 && oy === ny)) return [nx, ny];
      return null;
    }).filter(Boolean);
  }
  // Serra: terreno livre no canto de baixo à direita.
  const S = ZONES.serra;
  if (S && S.town && !S.town.bld.some((b) => b.style === "fortaleza")) {
    for (let y = 31; y <= 37; y++) for (let x = 50; x <= 60; x++) if (S.map[y][x] !== "#") setZoneTile("serra", x, y, y === 36 || y === 37 ? "," : ".");
    placeSeat("serra", { x: 51, y: 32, w: 9, h: 4, door: [55], name: "Fortaleza de Pedravale", style: "fortaleza" });
  }
})();

/* ===================== DESENHO ===================== */

function drawPalace(b, t) {
  const X = b.x * TILE,
    Y = b.y * TILE,
    W = b.w * TILE,
    H = b.h * TILE;
  const wall = "#f4f1ea",
    wall2 = "#dcd8ce",
    dome = "#2aa0b4",
    dome2 = "#5fd0e0",
    gold = "#f2c14e";
  ctx.fillStyle = "rgba(0,0,0,.25)";
  ctx.fillRect(X + 6, Y + H - 6, W, 10);
  // Corpo e torres laterais.
  ctx.fillStyle = wall;
  ctx.fillRect(X + 18, Y - 14, W - 36, H + 14);
  for (const tx of [X, X + W - 34]) {
    ctx.fillStyle = wall2;
    ctx.fillRect(tx, Y - 34, 34, H + 34);
    ctx.fillStyle = wall;
    ctx.fillRect(tx + 3, Y - 34, 28, H + 34);
    ctx.fillStyle = dome;
    ctx.beginPath();
    ctx.ellipse(tx + 17, Y - 34, 18, 20, 0, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = dome2;
    ctx.beginPath();
    ctx.ellipse(tx + 12, Y - 38, 6, 12, 0, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = gold;
    ctx.fillRect(tx + 16, Y - 64, 2, 12);
    ctx.beginPath();
    ctx.arc(tx + 17, Y - 64, 3, 0, 7);
    ctx.fill();
    // Janela em arco.
    ctx.fillStyle = "#1e5a7a";
    ctx.fillRect(tx + 11, Y - 6, 12, 16);
    ctx.beginPath();
    ctx.arc(tx + 17, Y - 6, 6, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,.35)";
    ctx.fillRect(tx + 12, Y - 6, 3, 14);
  }
  // Cúpula central.
  ctx.fillStyle = dome;
  ctx.beginPath();
  ctx.ellipse(X + W / 2, Y - 14, 40, 36, 0, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = dome2;
  ctx.beginPath();
  ctx.ellipse(X + W / 2 - 14, Y - 22, 10, 22, 0, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = gold;
  ctx.fillRect(X + W / 2 - 1, Y - 66, 2, 16);
  ctx.fillRect(X + W / 2 - 1, Y - 82, 2, 16);
  const fw = Math.sin(t * 4) * 3;
  ctx.fillStyle = "#2a6a8a";
  fillPolygon(X + W / 2 + 1, Y - 82, X + W / 2 + 22, Y - 76 + fw, X + W / 2 + 1, Y - 70);
  ctx.fillStyle = "#f4f1ea";
  ctx.fillRect(X + W / 2 + 6, Y - 77 + fw / 2, 8, 2);
  // Faixa dourada, colunas e janelas.
  ctx.fillStyle = gold;
  ctx.fillRect(X + 18, Y - 14, W - 36, 3);
  ctx.fillStyle = wall2;
  for (let k = 0; k < 6; k++) ctx.fillRect(X + 40 + k * 40, Y - 8, 6, H + 4);
  for (const wx of [X + 52, X + W - 72]) {
    ctx.fillStyle = "#1e5a7a";
    ctx.fillRect(wx, Y + 4, 16, 18);
    ctx.beginPath();
    ctx.arc(wx + 8, Y + 4, 8, Math.PI, 0);
    ctx.fill();
  }
  // Portão.
  const gx = (b.door[0] - b.x) * TILE + X;
  ctx.fillStyle = "#c9a03a";
  ctx.fillRect(gx - 4, Y + H - 44, 40, 44);
  ctx.fillStyle = "#1a3a4a";
  ctx.fillRect(gx, Y + H - 40, 32, 40);
  ctx.beginPath();
  ctx.arc(gx + 16, Y + H - 40, 16, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = gold;
  ctx.fillRect(gx + 15, Y + H - 52, 2, 36);
  // Ondas batendo nos pés.
  ctx.fillStyle = "rgba(255,255,255,.5)";
  for (let k = 0; k < 6; k++) ctx.fillRect(X - 30 + ((t * 20 + k * 60) % (W + 60)), Y + H + 70, 10, 2);
}
function drawFortress(b, t) {
  const X = b.x * TILE,
    Y = b.y * TILE,
    W = b.w * TILE,
    H = b.h * TILE;
  const st = "#5a5560",
    st2 = "#6e6878",
    dk = "#3e3a44";
  ctx.fillStyle = "rgba(0,0,0,.3)";
  ctx.fillRect(X + 6, Y + H - 6, W, 10);
  ctx.fillStyle = st;
  ctx.fillRect(X + 10, Y - 20, W - 20, H + 20);
  // Pedras.
  ctx.fillStyle = dk;
  for (let r = 0; r < (H + 20) / 10; r++) {
    ctx.fillRect(X + 10, Y - 20 + r * 10, W - 20, 1);
    for (let k = 0; k < W / 20; k++) ctx.fillRect(X + 10 + (r % 2) * 10 + k * 20, Y - 20 + r * 10, 1, 10);
  }
  // Ameias.
  ctx.fillStyle = st2;
  for (let k = 0; k < (W - 20) / 18; k++) ctx.fillRect(X + 10 + k * 18, Y - 32, 11, 13);
  // Torres quadradas.
  for (const tx of [X - 6, X + W - 40]) {
    ctx.fillStyle = st2;
    ctx.fillRect(tx, Y - 52, 46, H + 52);
    ctx.fillStyle = dk;
    for (let r = 0; r < (H + 52) / 10; r++) ctx.fillRect(tx, Y - 52 + r * 10, 46, 1);
    ctx.fillStyle = st;
    for (let k = 0; k < 3; k++) ctx.fillRect(tx + 2 + k * 16, Y - 62, 11, 11);
    ctx.fillStyle = "#1a1418";
    ctx.fillRect(tx + 19, Y - 30, 8, 14);
    ctx.fillStyle = `rgba(255,${150 + Math.floor(Math.sin(t * 3 + tx) * 30)},60,.9)`;
    ctx.fillRect(tx + 20, Y - 26, 6, 8);
  }
  // Runas anãs brilhando na pedra.
  ctx.fillStyle = `rgba(95,208,255,${0.5 + 0.3 * Math.sin(t * 2)})`;
  for (const rx of [X + 60, X + W - 70]) {
    ctx.fillRect(rx, Y + 6, 2, 12);
    ctx.fillRect(rx - 4, Y + 10, 10, 2);
    ctx.fillRect(rx + 4, Y + 4, 2, 4);
  }
  // Estandartes.
  for (const bx of [X + 44, X + W - 60]) {
    ctx.fillStyle = "#8a2a2a";
    ctx.fillRect(bx, Y - 14, 16, 40);
    ctx.fillStyle = "#c9a050";
    ctx.fillRect(bx + 4, Y - 6, 8, 8);
    ctx.fillRect(bx + 7, Y + 4, 2, 12);
    ctx.fillStyle = "#8a2a2a";
    fillPolygon(bx, Y + 26, bx + 8, Y + 20, bx + 16, Y + 26);
  }
  // Portão de ferro.
  const gx = (b.door[0] - b.x) * TILE + X;
  ctx.fillStyle = "#2a2420";
  ctx.fillRect(gx - 8, Y + H - 52, 48, 52);
  ctx.beginPath();
  ctx.arc(gx + 16, Y + H - 52, 24, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = "#4a4a52";
  for (let k = 0; k < 5; k++) ctx.fillRect(gx - 4 + k * 10, Y + H - 66, 3, 66);
  for (let k = 0; k < 4; k++) ctx.fillRect(gx - 8, Y + H - 58 + k * 14, 48, 2);
  // Bandeira no topo.
  ctx.fillStyle = "#5a3a22";
  ctx.fillRect(X + W / 2 - 1, Y - 70, 2, 40);
  ctx.fillStyle = "#8a2a2a";
  fillPolygon(X + W / 2 + 1, Y - 70, X + W / 2 + 24, Y - 63 + Math.sin(t * 4) * 3, X + W / 2 + 1, Y - 56);
}
{
  const bldBase = drawBuilding;
  drawBuilding = function (b, t) {
    if (b.style === "palacio") return drawPalace(b, t);
    if (b.style === "fortaleza") return drawFortress(b, t);
    return bldBase(b, t);
  };
  // Dentro: salão do trono grande, com o governante (ou você).
  const genBase = genInterior;
  genInterior = function (b) {
    if (!REALM_SEATS[b.style]) return genBase(b);
    const real = b.style;
    b.style = "castle";
    let z;
    try {
      z = genBase(b);
    } finally {
      b.style = real;
    }
    const R = REALM_SEATS[real];
    const kp = KEEPERS[real];
    Object.assign(game.inter, { st: real, keeper: typeof rulesK === "function" && rulesK(R.k) ? "Mordomo Real" : kp[0], kc: kp[1], kh: kp[2] });
    return z;
  };
  const svcBase = bldService;
  bldService = function (b) {
    if (b && REALM_SEATS[b.style]) return seatMenu(b);
    return svcBase(b);
  };
}
function seatMenu(b) {
  const R = REALM_SEATS[b.style];
  const K = KINGDOMS[R.k];
  const mine = typeof rulesK === "function" && rulesK(R.k);
  const w = worldState();
  const rel = w.rel[pairKey("aurelia", R.k)];
  const who = mine ? "Mordomo Real" : R.ruler;
  const opts = [];
  if (mine) {
    opts.push({ t: "Sentar no trono e governar", icon: "crown", fn: royalMenu });
    opts.push({ t: "Ouvir o povo do reino", icon: "chat", fn: () => say([["Mordomo Real", pk(["O povo pede uma ponte nova. E menos impostos. Como sempre, Majestade.", "Dizem que o antigo governante ainda tem espiões por aqui. Cuidado.", "Os pescadores querem um festival. Os anões querem cerveja. Todos querem ouro."])]]) });
  } else if (isDead(R.k === "mares" ? "tarso" : "durgan")) {
    opts.push({
      t: "Sentar no trono vago",
      icon: "crown",
      fn: () => {
        throne()[R.k] = player.day;
        syncRulers();
        repAdd(-5);
        vilaNews(`${player.name} sentou no trono vago de ${K.n}!`);
        saveGame();
        say([["Mordomo Real", `O trono estava vago... e agora é seu. Longa vida a ${player.name}, de ${K.short}!`]]);
      },
    });
  } else {
    opts.push({
      t: "Pedir uma audiência",
      icon: "chat",
      fn: () =>
        say([
          [
            R.ruler,
            R.k === "mares"
              ? pk(["As Marés não se curvam a Aurélia. Mas comerciam com ela. Fale rápido, viajante.", "O mar dá peixe, sal e paciência. Aurélia só dá impostos.", `Relação com Aurélia: ${rel >= 70 ? "aliados" : rel >= 40 ? "neutros" : "tensa"}. Diga à sua Rainha que eu vejo tudo do meu farol.`])
              : pk(["Pedra não esquece, forasteiro. Os anões de Pedravale também não.", "Quer cristais? Pague. Quer amizade? Prove.", "Minha forja é mais velha que a coroa de Aurélia. Respeite."]),
          ],
        ]),
    });
    opts.push({
      t: `Oferecer um presente diplomático (${withTax(100)} ouro)`,
      icon: "gift",
      fn: () => {
        if (player.gold < withTax(100)) return say([["", "Você não tem ouro suficiente."]]);
        payWithTax(100);
        w.rel[pairKey("aurelia", R.k)] = Math.min(100, rel + 10);
        repAdd(2);
        saveGame();
        say([[R.ruler, "Um gesto de respeito. As relações entre nossos reinos melhoram (+10)."]]);
      },
    });
    if (typeof rulesK === "function" && rulesK("aurelia")) opts.push({ t: `Negociar a conquista de ${K.short}…`, icon: "flag", fn: () => conquerMenu(R.k) });
    opts.push({ t: "Matar o governante…", icon: "skull", fn: () => killRuler(R) });
  }
  opts.push({ t: "Sair", fn: null });
  choice(mine ? `${R.name} · seu trono` : `${R.ruler}`, `${K.n}. ${mine ? "Você governa este reino." : `Relação com Aurélia: ${rel}/100.`}`, opts);
}
/** Matar o governante de outro reino: o trono fica vago... e alguém tem que ocupar. */
function killRuler(R) {
  const id = R.k === "mares" ? "tarso" : "durgan";
  if (!NPCS[id]) NPCS[id] = { nome: R.ruler, robe: KEEPERS[R.k === "mares" ? "palacio" : "fortaleza"][1], hat: null, hair: KEEPERS[R.k === "mares" ? "palacio" : "fortaleza"][2], temp: true };
  if (!FRIENDS[id]) FRIENDS[id] = { fav: "vinho", temp: true };
  ROYAL_BLOOD.add(id);
  killMenu(id);
}

/* Dentro de um prédio, o reino é o do lugar de onde você entrou. */
{
  const kBase = kingdomOf;
  kingdomOf = (zone) => (zone === "interior" && player.ret && player.ret.zone ? kBase(player.ret.zone) : kBase(zone));
}
