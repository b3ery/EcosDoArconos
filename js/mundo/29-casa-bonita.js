/**
 * ECOS DO ARCANO — 29-casa-bonita.js
 * Casa mais bonita e do seu jeito:
 *  - móveis redesenhados com luz, sombra, contorno e detalhes;
 *  - 12 móveis novos (sofá, poltrona, piano, relógio de pêndulo, cama de casal...);
 *  - pintar a casa: paredes e piso de cada andar, e por fora: parede, telhado e madeira;
 *  - construir o segundo andar em qualquer casa (com escada e janela no telhado);
 *  - tela de Decorar nova, com abas: Móveis, Pintar e Reformar.
 */

"use strict";

/* ===================== CORES ===================== */


/* ===================== MÓVEIS NOVOS ===================== */

const NEW_FURN = {
  m_sofa: { nome: "Sofá de Veludo", preco: 220, desc: "Móvel. Sentar e relaxar (+energia, +diversão).", icon: ["bench", "#8a2a4a"] },
  m_poltrona: { nome: "Poltrona de Leitura", preco: 140, desc: "Móvel. Ler um pouco (+XP, +diversão).", icon: ["chair", "#4a6a9a"] },
  m_comoda: { nome: "Cômoda Entalhada", preco: 130, desc: "Móvel. Gavetas cheias de lembranças.", icon: ["chest", "#8a5a2e"] },
  m_espelho: { nome: "Espelho de Pé", preco: 120, desc: "Móvel. Mudar o visual sem sair de casa.", icon: ["mirror", "#c9a03a"] },
  m_abajur: { nome: "Abajur de Vitral", preco: 70, desc: "Móvel. Luz quentinha à noite.", icon: ["lamp", "#d9a441"] },
  m_jantar: { nome: "Mesa de Jantar", preco: 190, desc: "Móvel. Jantar em família (+fome, +amizade).", icon: ["table", "#6b4423"] },
  m_piano: { nome: "Piano de Cauda", preco: 520, desc: "Móvel. Tocar música (+diversão para a casa toda).", icon: ["table", "#1a1a22"] },
  m_relogio: { nome: "Relógio de Pêndulo", preco: 160, desc: "Móvel. Tic-tac. Mostra a hora certinha.", icon: ["clock", "#6b4423"] },
  m_camaCasal: { nome: "Cama de Casal", preco: 260, desc: "Móvel. Dormir de conchinha (descansa mais).", icon: ["bed", "#c94a6a"] },
  m_tapeteP: { nome: "Tapete Persa", preco: 150, desc: "Móvel. Dá para pisar. Lindo e macio.", icon: ["rug", "#2a4a8a"] },
  m_samambaia: { nome: "Samambaia Pendurada", preco: 60, desc: "Móvel. Verde que alegra a casa.", icon: ["plant", "#3d8a3a"] },
  m_penteadeira: { nome: "Penteadeira", preco: 170, desc: "Móvel. Arrumar o cabelo (+higiene).", icon: ["mirror", "#e8b8c8"] },
};
for (const [id, d] of Object.entries(NEW_FURN)) {
  ITEMS[id] = { nome: d.nome, tipo: "movel", preco: d.preco, desc: d.desc };
  ITEM_ICONS[id] = gIcon(d.icon[0], d.icon[1], "#f2c14e", 1);
  if (!SHOPS.moveis.items.includes(id)) SHOPS.moveis.items.push(id);
}
{
  const walkBase = furnWalk;
  furnWalk = (id) => id === "m_tapeteP" || walkBase(id);
}
{
  const useBase = furnUseExtra;
  furnUseExtra = function (f) {
    const id = f.id;
    const once = (k) => player.famDay["fx" + k] !== player.day && (player.famDay["fx" + k] = player.day);
    const life = lifeMode();
    switch (id) {
      case "m_sofa":
        player.clock = Math.min(1439, player.clock + 30);
        if (life) addNeed("energy", 12), addNeed("fun", 10);
        else player.mp = Math.min(maxMp(), player.mp + 12);
        say([["", pk(["Você afunda no sofá de veludo. Ninguém te tira daqui tão cedo.", "Que sofá macio... você quase cochila.", "Você estica as pernas no sofá e suspira."])]]);
        return true;
      case "m_poltrona":
        if (!once("polt")) return say([["", "Você já leu bastante na poltrona hoje."]]), true;
        player.xp += 10 + player.lvl * 2;
        if (life) addNeed("fun", 12);
        say([["", pk(["Você lê um romance de capa e espada na poltrona.", "Um livro de receitas antigas. Deu fome.", "Poesias do Pedro Poeta. Você se emociona sem querer."])]]);
        return true;
      case "m_comoda":
        say([["", pk(["Na gaveta: cartas antigas, um botão e uma semente de girassol.", "Você arruma as gavetas. Achou uma moeda perdida!", "Meias, mais meias... e um bilhete de amor de anos atrás."])]]);
        if (once("comoda")) player.gold += 3;
        return true;
      case "m_espelho":
        showCreate("wardrobe");
        return true;
      case "m_penteadeira":
        if (life) addNeed("hygiene", 25);
        say([["", "Você penteia o cabelo e se arruma. Pront" + genderWord("o", "a", "e") + " para a vila!"]]);
        return true;
      case "m_abajur":
        toast(isNight() ? "A luz colorida do vitral pinta a parede." : "De dia ele fica só bonito, de noite fica mágico.", 2200);
        return true;
      case "m_jantar":
        if (!once("jantar")) return say([["", "O jantar de hoje já foi servido."]]), true;
        if (life) addNeed("hunger", 30), addNeed("fun", 10);
        player.food = Math.min(100, (player.food || 0) + 30);
        if (player.spouse) addFriendship(player.spouse, 3);
        say([["", player.spouse ? `Você e ${shortName(player.spouse)} jantam juntos e conversam sobre o dia.` : "Você janta com calma, à luz de velas."]]);
        return true;
      case "m_piano":
        playTune();
        if (life) addNeed("fun", 18);
        if (player.spouse) addFriendship(player.spouse, 2);
        toast("Você toca uma valsa no piano. Até os vizinhos param para ouvir.", 2600);
        return true;
      case "m_relogio":
        toast(`Tic-tac... ${clockStr()}`, 2600);
        return true;
      case "m_camaCasal":
        restMenu();
        return true;
      case "m_tapeteP":
      case "m_samambaia":
        say([["", `${furnName(id)}. Ficou lindo aqui.`]]);
        return true;
    }
    return useBase(f);
  };
}

/* ===================== MÓVEIS REDESENHADOS ===================== */

/** Desenha a peça com contorno, luz em cima e sombra embaixo. */
function drawFurnPretty(f, t) {
  const X = f.x * TILE,
    Y = f.y * TILE;
  const c = (col, a, b, w, h) => {
    ctx.fillStyle = col;
    ctx.fillRect(X + a, Y + b, w, h);
  };
  const box = (col, a, b, w, h) => {
    c(shade(col, -0.45), a - 1, b - 1, w + 2, h + 2);
    c(col, a, b, w, h);
    c(shade(col, 0.22), a, b, w, 2);
    c(shade(col, -0.22), a, b + h - 2, w, 2);
    c(shade(col, -0.12), a + w - 2, b, 2, h);
  };
  const sh = (w = 26) => {
    ctx.fillStyle = "rgba(0,0,0,.25)";
    ctx.beginPath();
    ctx.ellipse(X + 16, Y + 29, w / 2, 3.5, 0, 0, 7);
    ctx.fill();
  };
  const glow = (gx, gy, r, a) => {
    if (!isNight() && curFloor() === 0 && !a) return;
    const g = ctx.createRadialGradient(X + gx, Y + gy, 1, X + gx, Y + gy, r);
    g.addColorStop(0, "rgba(255,214,107,.45)");
    g.addColorStop(1, "rgba(255,214,107,0)");
    ctx.fillStyle = g;
    ctx.fillRect(X + gx - r, Y + gy - r, r * 2, r * 2);
  };
  const legs = (col, y, h, xs = [4, 25]) => xs.forEach((x) => box(col, x, y, 3, h));
  switch (f.id) {
    case "cama":
      sh();
      box("#7a4a26", 2, -2, 28, 6); // cabeceira
      box("#8a5a2e", 2, 2, 28, 26);
      c("#f6f2ea", 4, 4, 24, 8);
      c("#e2dccf", 4, 10, 24, 2);
      c("#5a84d4", 4, 12, 24, 15);
      c("#7aa0e8", 4, 12, 24, 3);
      for (let k = 0; k < 4; k++) c("#4a6ab4", 6 + k * 6, 17, 3, 3);
      return true;
    case "m_camaLux":
      sh(30);
      box("#4a2e17", 1, -14, 3, 42);
      box("#4a2e17", 28, -14, 3, 42);
      c("#8a2a5a", 0, -16, 32, 5);
      c("#c94a8a", 0, -11, 4, 18);
      c("#c94a8a", 28, -11, 4, 18);
      c("#f2c14e", 0, -16, 32, 1);
      box("#6b4423", 3, 2, 26, 26);
      c("#f6f2ea", 5, 4, 10, 6);
      c("#f6f2ea", 17, 4, 10, 6);
      c("#a82a5a", 5, 11, 22, 16);
      c("#c94a7a", 5, 11, 22, 3);
      c("#f2c14e", 5, 14, 22, 1);
      return true;
    case "m_camaCasal":
      sh(30);
      box("#6b4423", 1, -4, 30, 7);
      c("#8a5a2e", 13, -3, 6, 3);
      box("#8a5a2e", 1, 2, 30, 26);
      c("#f6f2ea", 3, 4, 12, 7);
      c("#f6f2ea", 17, 4, 12, 7);
      c("#c94a6a", 3, 12, 26, 15);
      c("#e07a90", 3, 12, 26, 3);
      ctx.fillStyle = "#f6f2ea";
      circle(X + 16, Y + 20, 3);
      return true;
    case "armario":
      sh();
      box("#5a3a1e", 3, -12, 26, 40);
      c("#7a5030", 5, -9, 10, 34);
      c("#7a5030", 17, -9, 10, 34);
      c("#8a6038", 6, -8, 8, 2);
      c("#8a6038", 18, -8, 8, 2);
      c("#f2c14e", 13, 6, 2, 4);
      c("#f2c14e", 17, 6, 2, 4);
      c("#4a2e17", 3, -14, 26, 3);
      return true;
    case "lareira":
    case "m_lareira": {
      sh(30);
      const st = f.id === "m_lareira" ? "#8f897d" : "#8a5a3a";
      box(st, 1, -8, 30, 36);
      for (let r = 0; r < 5; r++) c("rgba(0,0,0,.15)", 1, -6 + r * 7, 30, 1);
      c(shade(st, 0.2), -1, -10, 34, 4);
      c("#1a1210", 7, 8, 18, 18);
      const fl = Math.sin(t * 9) * 2;
      c("#ff7a3d", 10, 16 + fl / 2, 12, 9);
      c("#ffd166", 13, 18 + fl, 6, 7);
      c("#fff3b0", 15, 21, 2, 4);
      c("#5a3a22", 9, 24, 14, 2);
      glow(16, 18, 34, 1);
      return true;
    }
    case "mesa":
    case "m_mesa":
      sh();
      legs("#6b4423", 16, 12);
      box(f.id === "m_mesa" ? "#7a4a26" : "#8a5a2e", 1, 7, 30, 10);
      c("#f6f2ea", 8, 9, 16, 5);
      c("#e2dccf", 8, 13, 16, 1);
      c("#c94a4a", 14, 4, 4, 5);
      c("#3d7a2a", 15, 2, 2, 2);
      return true;
    case "m_jantar":
      sh(30);
      legs("#5a3a1e", 18, 10, [3, 26]);
      box("#6b4423", 0, 6, 32, 13);
      c("#f6f2ea", 2, 8, 28, 9);
      c("#e2dccf", 2, 15, 28, 2);
      for (const x of [6, 22]) {
        ctx.fillStyle = "#ffffff";
        circle(X + x, Y + 11, 3);
        ctx.fillStyle = "#c9a050";
        circle(X + x, Y + 11, 1.5);
      }
      c("#c9a050", 15, 2, 2, 8);
      c("#f6f2ea", 15, -2, 2, 4);
      ctx.fillStyle = "#ffd66b";
      circle(X + 16, Y - 3, 1.6);
      glow(16, -2, 18);
      return true;
    case "cadeira":
    case "m_cadeira":
      sh(18);
      box("#7a5030", 9, -2, 14, 16);
      c("#8a6038", 11, 0, 10, 2);
      box(f.id === "m_cadeira" ? "#a82a3a" : "#8a5a2e", 7, 14, 18, 5);
      legs("#5a3a1e", 19, 9, [9, 21]);
      return true;
    case "m_poltrona":
      sh(26);
      box("#3a5a8a", 4, -4, 24, 18);
      box("#4a6a9a", 2, 6, 6, 16);
      box("#4a6a9a", 24, 6, 6, 16);
      box("#5a7aaa", 7, 12, 18, 8);
      c("#f2c14e", 15, 2, 2, 2);
      legs("#4a2e17", 22, 6, [4, 25]);
      return true;
    case "m_sofa":
      sh(30);
      box("#7a2442", 1, -2, 30, 14);
      for (const x of [3, 11, 19]) c("#93305a", x, 0, 8, 9);
      box("#8a2a4a", -1, 8, 6, 14);
      box("#8a2a4a", 27, 8, 6, 14);
      box("#a83a5a", 4, 12, 24, 8);
      c("#c95a7a", 5, 12, 22, 2);
      c("#f2c14e", 8, 3, 4, 4);
      legs("#3a2414", 21, 6, [1, 28]);
      return true;
    case "tapete":
    case "m_tapete":
    case "m_tapeteR":
    case "m_tapeteP": {
      const pal = {
        tapete: ["#8a3a4a", "#c9a050", "#8a3a4a", "#e8d0a0"],
        m_tapete: ["#4a6a3a", "#d9c08a", "#6a8a4a", "#f6ecd2"],
        m_tapeteR: ["#a82a2a", "#f2c14e", "#a82a2a", "#f2c14e"],
        m_tapeteP: ["#2a3a7a", "#c9a03a", "#8a2a3a", "#e8d8b0"],
      }[f.id];
      c(pal[0], 0, 3, 32, 26);
      c(pal[1], 2, 5, 28, 22);
      c(pal[2], 4, 7, 24, 18);
      c(pal[3], 13, 13, 6, 6);
      c(pal[1], 15, 9, 2, 14);
      c(pal[1], 8, 15, 16, 2);
      for (let k = 0; k < 8; k++) {
        c(pal[3], 1 + k * 4, 1, 2, 2);
        c(pal[3], 1 + k * 4, 29, 2, 2);
      }
      return true;
    }
    case "m_estante":
      sh();
      box("#5a3a1e", 1, -14, 30, 42);
      for (let r = 0; r < 3; r++) {
        c("#2e1d10", 3, -11 + r * 12, 26, 10);
        for (let k = 0; k < 6; k++) {
          const hgt = 7 + ((k * 3 + r) % 3);
          c(["#c94a4a", "#4a74c9", "#5a9a4a", "#d9a441", "#8a4ad9", "#e8e0c0"][(k + r * 2) % 6], 4 + k * 4, -11 + r * 12 + 10 - hgt, 3, hgt);
          c("rgba(255,255,255,.25)", 4 + k * 4, -11 + r * 12 + 10 - hgt, 1, hgt);
        }
        c("#7a5030", 1, -2 + r * 12, 30, 2);
      }
      return true;
    case "m_comoda":
      sh();
      box("#8a5a2e", 2, 2, 28, 26);
      for (let r = 0; r < 3; r++) {
        c("#7a4a26", 4, 5 + r * 7, 24, 6);
        c("#a8784a", 4, 5 + r * 7, 24, 1);
        c("#f2c14e", 15, 7 + r * 7, 2, 2);
      }
      c("#6b4423", 1, 0, 30, 3);
      c("#7ab0d9", 5, -6, 6, 6);
      c("#5a9a4a", 21, -5, 5, 5);
      return true;
    case "m_espelho":
      sh(18);
      box("#c9a03a", 8, -16, 16, 40);
      c("#bfe0f0", 10, -14, 12, 34);
      c("#e8f6ff", 11, -12, 3, 20);
      c("#9cc4dc", 18, 4, 3, 14);
      box("#8a6a2a", 6, 24, 20, 4);
      return true;
    case "m_penteadeira":
      sh(28);
      box("#e8b8c8", 2, 10, 28, 14);
      c("#d49ab0", 4, 13, 10, 8);
      c("#d49ab0", 18, 13, 10, 8);
      c("#f2c14e", 8, 16, 2, 2);
      c("#f2c14e", 22, 16, 2, 2);
      box("#c9a03a", 9, -12, 14, 20);
      c("#bfe0f0", 11, -10, 10, 16);
      c("#e8f6ff", 12, -9, 2, 10);
      c("#c94a8a", 4, 7, 3, 4);
      c("#5ad0ff", 25, 7, 3, 4);
      legs("#c9a3b3", 23, 5, [3, 26]);
      return true;
    case "m_abajur":
      sh(14);
      glow(16, 4, 30);
      box("#6b4423", 13, 10, 6, 16);
      box("#5a3a1e", 9, 25, 14, 3);
      ctx.fillStyle = "#d9a441";
      fillPolygon(X + 6, Y + 11, X + 26, Y + 11, X + 21, Y - 4, X + 11, Y - 4);
      c("#c94a4a", 9, 2, 3, 6);
      c("#4a74c9", 15, 0, 3, 8);
      c("#5a9a4a", 20, 2, 3, 6);
      c("#fff3b0", 8, 10, 16, 1);
      return true;
    case "m_relogio": {
      sh(16);
      box("#6b4423", 8, -18, 16, 46);
      c("#4a2e17", 7, -20, 18, 3);
      ctx.fillStyle = "#f6f2ea";
      circle(X + 16, Y - 9, 6);
      ctx.strokeStyle = "#2a1a0c";
      ctx.lineWidth = 1;
      const hh = currentHour();
      for (const [len, a] of [
        [3.5, ((hh % 12) / 12) * Math.PI * 2],
        [5, ((player.clock % 60) / 60) * Math.PI * 2],
      ]) {
        ctx.beginPath();
        ctx.moveTo(X + 16, Y - 9);
        ctx.lineTo(X + 16 + Math.sin(a) * len, Y - 9 - Math.cos(a) * len);
        ctx.stroke();
      }
      c("#2a1a10", 11, 0, 10, 20);
      const sw = Math.sin(t * 3) * 3;
      c("#c9a03a", 15 + sw / 2, 2, 2, 12);
      ctx.fillStyle = "#f2c14e";
      circle(X + 16 + sw, Y + 15, 3);
      return true;
    }
    case "m_piano":
      sh(32);
      box("#1a1a22", 0, -6, 32, 22);
      c("#2a2a36", 2, -4, 28, 3);
      c("#f6f2ea", 2, 8, 28, 5);
      for (let k = 0; k < 9; k++) c("#2a2a30", 4 + k * 3, 8, 1, 5);
      for (const k of [0, 1, 3, 4, 5, 7, 8]) c("#1a1a22", 5 + k * 3, 8, 2, 3);
      legs("#1a1a22", 16, 12, [2, 27]);
      c("#c9a03a", 13, -2, 6, 1);
      if (Math.sin(t * 2) > 0.6) drawPixelIcon("note", X + 26, Y - 12, 1.5);
      return true;
    case "m_planta":
    case "m_samambaia": {
      sh(16);
      const hang = f.id === "m_samambaia";
      if (hang) {
        c("#8a6a3a", 15, -18, 2, 10);
        box("#a85a3a", 9, -8, 14, 9);
      } else box("#b4643f", 9, 17, 14, 11);
      const y0 = hang ? -2 : 4,
        leaf = ["#2f6a26", "#3d8a3a", "#5aaa4a"];
      for (let k = 0; k < 7; k++) {
        const a = -1.4 + k * 0.47 + Math.sin(t * 1.5 + k) * 0.05;
        ctx.fillStyle = leaf[k % 3];
        ctx.beginPath();
        ctx.ellipse(X + 16 + Math.cos(a) * 7, Y + y0 + (hang ? 8 : 8) + Math.sin(a) * (hang ? -6 : 7) * (hang ? -1 : 1), 5, 2.4, a, 0, 7);
        ctx.fill();
      }
      return true;
    }
    case "m_flores":
      sh(14);
      box("#5a6a9a", 11, 17, 10, 11);
      c("#7a8aba", 12, 18, 2, 8);
      c("#3d7a2a", 13, 8, 2, 10);
      c("#3d7a2a", 17, 6, 2, 12);
      c("#3d7a2a", 20, 10, 2, 8);
      for (const [x, y, col] of [
        [13, 7, "#ff6b8a"],
        [18, 4, "#f5d76e"],
        [21, 9, "#c77dff"],
        [10, 11, "#ffffff"],
      ]) {
        ctx.fillStyle = col;
        circle(X + x, Y + y, 3.2);
        ctx.fillStyle = "#ffd66b";
        circle(X + x, Y + y, 1);
      }
      return true;
    case "m_quadro":
      sh(18);
      box("#a8783a", 3, -2, 26, 20);
      c("#7ab0d9", 5, 0, 22, 9);
      c("#f6f2ea", 18, 2, 5, 2);
      c("#5a9a4a", 5, 9, 22, 7);
      c("#3d7a2a", 5, 12, 22, 4);
      ctx.fillStyle = "#4a8a3a";
      fillPolygon(X + 6, Y + 10, X + 12, Y + 3, X + 18, Y + 10);
      c("#f2c14e", 22, 1, 3, 3);
      box("#6b4423", 8, 18, 2, 10);
      box("#6b4423", 22, 18, 2, 10);
      return true;
    case "m_bau":
      sh();
      box("#6b4423", 3, 10, 26, 18);
      box("#8a5a2e", 3, 4, 26, 8);
      c("#c9a03a", 3, 11, 26, 2);
      c("#c9a03a", 8, 4, 2, 24);
      c("#c9a03a", 22, 4, 2, 24);
      box("#f2c14e", 14, 11, 4, 6);
      c("#3a2414", 15, 14, 2, 2);
      return true;
    case "m_vela":
      sh(14);
      glow(16, 2, 22);
      box("#c9a050", 14, 10, 4, 17);
      box("#c9a050", 5, 9, 22, 3);
      box("#b4903a", 10, 25, 12, 3);
      for (const x of [5, 14, 23]) {
        c("#f6f2ea", x, x === 14 ? 1 : 3, 3, x === 14 ? 8 : 6);
        ctx.fillStyle = "#ffd66b";
        circle(X + x + 1.5, Y + (x === 14 ? -1 : 1) + Math.sin(t * 10 + x) * 0.6, 2);
        ctx.fillStyle = "#fff3b0";
        circle(X + x + 1.5, Y + (x === 14 ? 0 : 2), 0.9);
      }
      return true;
    case "m_berco":
      sh();
      box("#c9a878", 3, 8, 26, 18);
      c("#f6f2ea", 5, 10, 22, 10);
      c("#ffb3c8", 5, 15, 22, 5);
      for (let k = 0; k < 6; k++) c("#a8784a", 5 + k * 4, 8, 1, 18);
      c("#8a5a2e", 3, 6, 26, 3);
      c("#f2c14e", 14, -4, 4, 10);
      ctx.fillStyle = "#ff8ad0";
      circle(X + 16, Y - 5 + Math.sin(t * 2) * 1.5, 2.5);
      return true;
  }
  return false;
}
{
  const furnBase = drawFurn;
  drawFurn = function (f, t) {
    if (drawFurnPretty(f, t)) return;
    furnBase(f, t);
  };
}

/* ===================== PINTURA E REFORMA ===================== */

const PAINT_WALLS = [
  ["Cal branca", "#efe8da"], ["Creme", "#e8d8b8"], ["Rosa antigo", "#ecc8cc"], ["Azul céu", "#cfe0ef"], ["Verde menta", "#cfe8d4"], ["Amarelo sol", "#f2e2a0"],
  ["Lilás", "#ddd0ee"], ["Pêssego", "#f2cfb0"], ["Terracota", "#c97a5a"], ["Verde musgo", "#8aa070"], ["Azul real", "#6a86c0"], ["Vinho", "#8a3a4a"],
];
const PAINT_FLOORS = [
  ["Carvalho", "#8a6038"], ["Nogueira", "#5a3a22"], ["Pinho claro", "#c9a06a"], ["Cerejeira", "#8a3a2a"], ["Pedra cinza", "#8a8a88"], ["Ardósia", "#4a5060"],
  ["Mármore", "#e8e2d8"], ["Lajota", "#b4643f"], ["Madeira branca", "#d8d0c2"], ["Verde-água", "#6a9a8a"],
];
const PAINT_ROOFS = [["Telha vermelha", "#a8382a"], ["Azul real", "#2f4f99"], ["Verde floresta", "#3a6a3a"], ["Ardósia", "#4a4e5a"], ["Roxo", "#5a3a7a"], ["Terracota", "#c46a3a"], ["Preto", "#2a2a30"], ["Dourado", "#c9a03a"], ["Rosa", "#c96a8a"]];
const PAINT_EXT = [["Cal branca", "#f2ecdc"], ["Creme", "#efe3c4"], ["Rosa", "#f0cfd2"], ["Azul", "#cfdcf0"], ["Verde", "#d4e8cc"], ["Amarelo", "#f2e2a0"], ["Lilás", "#e2d4f0"], ["Tijolo", "#b4644a"], ["Pedra", "#a8a294"]];
const PAINT_BEAMS = [["Madeira escura", "#5a3a22"], ["Madeira clara", "#a8784a"], ["Branco", "#f6f2ea"], ["Preto", "#2a2420"], ["Verde", "#3a5a3a"], ["Azul", "#2a3a6a"]];
const FLOOR2_COST = 450;

function homeKey() {
  return player.home || STARTER_HOUSE;
}
function paintOf(key) {
  player.paint = player.paint || {};
  return (player.paint[key || homeKey()] = player.paint[key || homeKey()] || {});
}
function hasFloor2() {
  return !!(player.floors2 || {})[homeKey()];
}
/* Paredes e piso pintados (cada andar com a sua cor). */
{
  const cache = {};
  const wrapPal = (PAL, up) => {
    for (const tier of Object.keys(PAL)) {
      const base = PAL[tier];
      Object.defineProperty(PAL, tier, {
        configurable: true,
        enumerable: true,
        get() {
          if (player.zone !== "casa") return base;
          const p = paintOf();
          const w = p[up ? "wall1" : "wall0"],
            fl = p[up ? "floor1" : "floor0"];
          if (!w && !fl) return base;
          const k = tier + up + w + fl;
          if (!cache[k]) {
            const o = { ...base };
            if (w) Object.assign(o, { wall: w, wallLine: shade(w, -0.1) });
            if (fl) {
              const marble = fl === "#e8e2d8";
              Object.assign(o, { f1: fl, f2: shade(fl, marble ? -0.08 : 0.06), line: shade(fl, -0.25), marble: marble ? 1 : 0, dirt: 0 });
            }
            cache[k] = o;
          }
          return cache[k];
        },
      });
    }
  };
  wrapPal(HOME_PAL_UP, 1);
  wrapPal(HOME_PAL, 0);
}
/* Segundo andar em qualquer casa. */
{
  const featBase = houseFeat;
  houseFeat = function () {
    const F = featBase();
    return hasFloor2() && !F.andar ? { ...F, andar: true } : F;
  };
}
/* Fachada pintada e janela no telhado de quem tem segundo andar. */
function isMyHomeBld(b) {
  if (player.zone === "casa" || player.zone === "interior" || !b || !b.door) return null;
  const h = houseAt(player.zone, b.door[0], b.y + b.h - 1);
  return h && (h.key === homeKey() || (player.houses || []).includes(h.key)) ? h.key : null;
}
{
  const bldBase = drawBuilding;
  drawBuilding = function (b, t) {
    const key = isMyHomeBld(b);
    const p = key && (player.paint || {})[key];
    const S0 = BUILDING_STYLES[b.style];
    if (p && S0 && (p.roof || p.ext || p.beam)) {
      BUILDING_STYLES[b.style] = { ...S0, roof: p.roof || S0.roof, r2: p.roof ? shade(p.roof, 0.18) : S0.r2, wall: p.ext || S0.wall, beam: p.beam || S0.beam };
      try {
        bldBase(b, t);
      } finally {
        BUILDING_STYLES[b.style] = S0;
      }
    } else bldBase(b, t);
    if (key && (player.floors2 || {})[key]) drawDormer(b, p, t);
  };
}
function drawDormer(b, p, t) {
  const X = b.x * TILE,
    Y = b.y * TILE,
    W = b.w * TILE;
  const roof = (p && p.roof) || (BUILDING_STYLES[b.style] || {}).roof || "#2f4f99";
  const wall = (p && p.ext) || (BUILDING_STYLES[b.style] || {}).wall || "#efe3c4";
  const cx = X + W / 2;
  ctx.fillStyle = wall;
  ctx.fillRect(cx - 14, Y - 6, 28, 22);
  ctx.fillStyle = roof;
  fillPolygon(cx - 19, Y - 4, cx, Y - 22, cx + 19, Y - 4);
  ctx.fillStyle = shade(roof, 0.2);
  fillPolygon(cx - 19, Y - 4, cx, Y - 22, cx - 4, Y - 4);
  const night = nightAlpha() > 0.25;
  ctx.fillStyle = "#4a2e17";
  ctx.fillRect(cx - 8, Y - 1, 16, 13);
  ctx.fillStyle = night ? "#ffe9a8" : "#7aa0c9";
  ctx.fillRect(cx - 6, Y + 1, 12, 9);
  ctx.fillStyle = "#4a2e17";
  ctx.fillRect(cx - 1, Y + 1, 2, 9);
  // Floreira.
  ctx.fillStyle = "#8a5a2e";
  ctx.fillRect(cx - 9, Y + 12, 18, 3);
  for (let k = 0; k < 4; k++) {
    ctx.fillStyle = ["#ff6b8a", "#f5d76e", "#c77dff", "#ff9a3c"][k];
    ctx.fillRect(cx - 7 + k * 4, Y + 10 + Math.sin(t * 2 + k) * 0.5, 2, 2);
  }
}

/* ===================== TELA DE DECORAR (NOVA) ===================== */

function swatchRow(list, cur, attr) {
  return `<div class="dc-sw">${list.map(([n, col]) => `<button class="${cur === col ? "on" : ""}" data-${attr}="${col}" title="${n}" style="background:${col}"><span>${n}</span></button>`).join("")}<button class="clr ${!cur ? "on" : ""}" data-${attr}="" title="Cor original"><span>Original</span></button></div>`;
}
renderDecor = function () {
  const tab = game.decorTab || "moveis";
  const [fx, fy] = frontTile(),
    fr = furnAt(fx, fy),
    ok = canPlace(fx, fy);
  const fl = curFloor();
  const p = paintOf();
  const tabs = [
    ["moveis", "Móveis", "chair"],
    ["pintar", "Pintar", "sparkle"],
    ["reformar", "Reformar", "hammer"],
  ]
    .map(([k, n, ic]) => `<button data-dtab="${k}" class="${tab === k ? "on" : ""}">${iconHTML(ic, 16)}${n}</button>`)
    .join("");
  let body = "";
  if (tab === "moveis") {
    const ids = Object.keys(player.inv).filter((id) => ITEMS[id] && ITEMS[id].tipo === "movel");
    body = `<div class="dc-front ${fr ? "has" : ok ? "ok" : "no"}">${iconHTML(fr ? itemIcon(fr.id) : ok ? "sparkle" : "lock", 22)}<div><b>À sua frente</b><span>${fr ? furnName(fr.id) : ok ? "Espaço vazio: escolha um móvel abaixo" : "Aqui não dá para colocar móvel"}</span></div>${fr ? `<button id="dpick">Guardar</button>` : ""}</div>
    <h3>Seus móveis guardados</h3>
    ${ids.length ? `<div class="dc-grid">${ids.map((id) => `<button class="dc-it" data-pl="${id}" ${ok ? "" : "disabled"} title="${ITEMS[id].desc}"><canvas width="64" height="64" data-fpv="${id}"></canvas><b>${ITEMS[id].nome}</b><small>×${itemCount(id)}</small></button>`).join("")}</div>` : `<div class="qtip">Nenhum móvel guardado. Compre na Marcenaria do Tonico (praça oeste de Cinzaluz) — tem sofá, piano, relógio de pêndulo e muito mais.</div>`}
    <div class="qtip">${(player.furn || []).filter((f) => (f.fl || 0) === fl).length} móveis neste andar. Feche (Esc), ande até outro lugar e abra de novo para colocar em outro ponto.</div>`;
  } else if (tab === "pintar") {
    const w = fl ? "wall1" : "wall0",
      f = fl ? "floor1" : "floor0";
    body = `<div class="gsub">${iconHTML("sparkle", 14)} Tinta grátis! Mudou de ideia? É só pintar de novo. Você está no ${fl ? "andar de cima" : "térreo"}: cada andar tem a sua cor.</div>
    <h3>Paredes (${fl ? "andar de cima" : "térreo"})</h3>${swatchRow(PAINT_WALLS, p[w], "pw")}
    <h3>Piso (${fl ? "andar de cima" : "térreo"})</h3>${swatchRow(PAINT_FLOORS, p[f], "pf")}
    <h3>Por fora: paredes</h3>${swatchRow(PAINT_EXT, p.ext, "pe")}
    <h3>Por fora: telhado</h3>${swatchRow(PAINT_ROOFS, p.roof, "pr")}
    <h3>Por fora: vigas e janelas</h3>${swatchRow(PAINT_BEAMS, p.beam, "pb")}`;
  } else {
    const F = houseFeat(),
      cost = withTax(FLOOR2_COST);
    body = `<div class="dc-ref">
      <div class="dc-card ${F.andar ? "done" : ""}">${iconHTML("house", 32)}<b>Segundo andar</b><small>${F.andar ? "Sua casa já tem andar de cima. Suba pela escada do canto." : `Constrói um andar de cima com escada, quartos e uma janela no telhado (com floreira!). ${cost} ouro.`}</small>${F.andar ? "" : `<button id="dfloor2" ${player.gold >= cost ? "" : "disabled"}>Construir (${cost} ouro)</button>`}</div>
      <div class="dc-card ${F.quintal ? "done" : ""}">${iconHTML("flower", 32)}<b>Quintal</b><small>${F.quintal ? "Sua casa tem quintal: porta dos fundos no térreo." : "Casebres não têm quintal. Mude para uma casa maior para ter um."}</small></div>
      <div class="dc-card">${iconHTML("sparkle", 32)}<b>Pintura</b><small>Use a aba Pintar para mudar paredes, piso, telhado e fachada.</small></div>
    </div>`;
  }
  byId("shop").innerHTML = `<div class="gh"><h2>${iconHTML("house", 22)} Decorar a casa</h2><button id="shclose">Fechar (Esc)</button></div><div class="dc-tabs">${tabs}</div><div class="dc-body">${body}</div>`;
  byId("shclose").onclick = closeShop;
  const root = byId("shop");
  root.querySelectorAll("[data-dtab]").forEach((b) => (b.onclick = () => ((game.decorTab = b.dataset.dtab), renderDecor())));
  root.querySelectorAll("[data-fpv]").forEach((cv) => {
    const c2 = cv.getContext("2d");
    const old = ctx;
    try {
      // Desenha o móvel de verdade na miniatura.
      ctx = c2;
      c2.imageSmoothingEnabled = false;
      c2.setTransform(1.5, 0, 0, 1.5, 8, 22);
      drawFurn({ id: cv.dataset.fpv, x: 0, y: 0 }, 0);
    } catch (e) {
    } finally {
      ctx = old;
    }
  });
  if (byId("dpick"))
    byId("dpick").onclick = () => {
      const it = fr.id;
      player.furn = player.furn.filter((q) => q !== fr);
      if (ITEMS[it]) addItem(it);
      else (player.furnBase = player.furnBase || []).push(it);
      playSound(500, 0.08, "sine");
      saveGame();
      renderDecor();
    };
  root.querySelectorAll("[data-pl]").forEach(
    (b) =>
      (b.onclick = () => {
        const id = b.dataset.pl;
        if (!canPlace(fx, fy)) return;
        removeItem(id);
        player.furn.push({ id, x: fx, y: fy, fl: curFloor() });
        playSound(700, 0.1, "sine");
        saveGame();
        renderDecor();
      }),
  );
  const paint = (attr, field) =>
    root.querySelectorAll(`[data-${attr}]`).forEach(
      (b) =>
        (b.onclick = () => {
          const v = b.dataset[attr];
          if (v) p[field] = v;
          else delete p[field];
          playSound(640, 0.06, "sine");
          saveGame();
          renderDecor();
        }),
    );
  paint("pw", fl ? "wall1" : "wall0");
  paint("pf", fl ? "floor1" : "floor0");
  paint("pe", "ext");
  paint("pr", "roof");
  paint("pb", "beam");
  if (byId("dfloor2"))
    byId("dfloor2").onclick = () => {
      if (player.gold < withTax(FLOOR2_COST)) return;
      payWithTax(FLOOR2_COST);
      (player.floors2 = player.floors2 || {})[homeKey()] = player.day;
      saveGame();
      playSound(523, 0.2, "triangle");
      toast("Segundo andar pronto! A escada fica no canto da sala.", 3200);
      renderDecor();
    };
};
