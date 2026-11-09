/**
 * ECOS DO ARCANO — 51-alteza.js
 *  - Quem nasce na realeza é reconhecido: a Rainha Aurélia trata você como
 *    sobrinho(a) e herdeiro(a); o povo se curva, chama de "Alteza" e a guarda bate continência.
 *  - Ala Real redesenhada: piso próprio em cada cômodo (parquet, mármore, azulejo,
 *    lajota), papel de parede, rodapé de madeira, janelas com cortinas, quadros,
 *    tapeçarias, colunas, arandelas e lustres de velas.
 */

"use strict";

function isRoyalBorn() {
  return lifeMode() && !!player.royalBirth;
}
function alteza() {
  return `${player.titleWord || genderWord("Príncipe", "Princesa", "Alteza")} ${player.name}`;
}

/* ===================== A RAINHA, SUA TIA ===================== */

{
  const castleBase = castleMenu;
  castleMenu = function () {
    if (!isRoyalBorn()) return castleBase();
    hookChoice(castleBase, (title, text, opts) => {
      const n = "Rainha Aurélia";
      const extra = [
        {
          t: "Abraçar a tia Aurélia",
          icon: "heart",
          fn: () => (addFriendship("rainha", 3), say([[n, pk([`${genderWord("Meu sobrinho", "Minha sobrinha", "Meu bem")} querid${genderWord("o", "a", "e")}! Venha cá. Você cresceu tanto!`, `${alteza()}... sempre que você entra, este salão fica mais claro.`, "Abraço de família no salão do trono. Os guardas fingem que não viram."])]])),
        },
        {
          t: "Perguntar sobre a sucessão ao trono",
          icon: "crown",
          fn: () => say([[n, `Se algo me acontecer, a coroa de Aurélia passa para você, ${alteza()}. Prepare-se. Um reino não se governa com bailes.`], [n, "...Mas um baile de vez em quando não faz mal a ninguém."]]),
        },
        {
          t: "Pedir conselho de família",
          icon: "scroll",
          fn: () => say([[n, pk(["Nunca confie num conselheiro que concorda com tudo.", "O povo não precisa te amar. Precisa confiar em você. É mais difícil.", "Os iluministas têm algumas ideias boas. Não conte para ninguém que eu disse isso.", "Case por amor, governe com a cabeça. Nunca o contrário."])]]),
        },
        {
          t: "Pedir aumento da mesada",
          icon: "coin",
          fn: () => {
            if (player.famDay.mesada === player.day) return say([[n, "Hoje já não, querid" + genderWord("o", "a", "e") + ". O tesouro tem limite."]]);
            player.famDay.mesada = player.day;
            if (friendship("rainha") >= 60 && Math.random() < 0.6) {
              player.gold += 150;
              saveGame();
              return say([[n, "Está bem, está bem. Mais 150 de ouro. E nada de gastar tudo na taverna com aquele Marzoca!"]]);
            }
            say([[n, "Mesada maior? Primeiro me mostre que sabe usar a que já tem."]]);
          },
        },
      ];
      return [title, `A Rainha Aurélia desce do trono para receber ${genderWord("o seu sobrinho", "a sua sobrinha", "você")}, ${alteza()}. Os guardas se curvam.`, extra.concat(opts)];
    });
  };
  const talkBase = NPCS.rainha && NPCS.rainha.talk;
  if (talkBase)
    NPCS.rainha.talk = function () {
      if (isRoyalBorn() && Math.random() < 0.7)
        return [["Rainha Aurélia", pk([`${alteza()}! Venha almoçar comigo amanhã. Família é família.`, `Não ande pela vila sem um guarda, ${genderWord("meu sobrinho", "minha sobrinha", "querid@")}. Você é ${genderWord("o herdeiro", "a herdeira", "herdeire")} do trono.`, "Seu pai teria orgulho de você. Ele também fugia das aulas de etiqueta.", "Os nobres andam cochichando sobre você. Bom sinal: quer dizer que importa."])]];
      return talkBase.apply(this, arguments);
    };
}

/* ===================== O POVO RECONHECE ===================== */

{
  const voceBase = TOPICS.voce;
  TOPICS.voce = function (id) {
    if (isRoyalBorn() && Math.random() < 0.5) {
      const L = [`Bom dia, ${alteza()}! *faz uma reverência*`, "Vossa Alteza por aqui, no meio do povo? Que honra!", `Alteza, a Rainha sua tia está bem?`, "*tira o chapéu* Alteza! Quer provar o meu pão? É de graça pra família real.", `Dizem que ${genderWord("o príncipe", "a princesa", "Vossa Alteza")} é mais simpátic${genderWord("o", "a", "e")} que a Rainha. Não conta pra ela!`, "Alteza, o meu filho sonha em trabalhar no castelo. Será que tem vaga?", "*cochicha* É a realeza! Arruma o cabelo!"];
      if (id && hasTrait(id, "rebelde")) L.push("Alteza... pois é. Nada pessoal, mas eu prefiro um conselho do povo.", `Mais ${genderWord("um príncipe", "uma princesa", "alguém da realeza")} passeando com o nosso imposto, hein?`);
      return pk(L);
    }
    return voceBase(id);
  };
  // Cumprimentos de quem passa perto.
  let acc = 0;
  const updBase = update;
  update = function (dt) {
    updBase(dt);
    if (!isRoyalBorn() || game.mode !== "world" || game.dialog || !ZONES[player.zone] || !ZONES[player.zone].town) return;
    acc += dt;
    if (acc < 7) return;
    acc = 0;
    const near = (game.walkers || []).filter((w) => Math.abs(w.x - player.x) + Math.abs(w.y - player.y) <= 4 && !(w.inside > 0));
    if (!near.length || Math.random() < 0.4) return;
    const w = pk(near);
    w.dir = Math.abs(player.x - w.x) >= Math.abs(player.y - w.y) ? (player.x > w.x ? "right" : "left") : player.y > w.y ? "down" : "up";
    w.sayT = 2.8;
    w.sayTxt = pk([`Bom dia, ${alteza()}!`, "*reverência* Alteza!", "Vossa Alteza!", `Viva ${genderWord("o príncipe", "a princesa", "a realeza")}!`, "Que honra, Alteza!", "Alteza, que roupa linda!"]);
    game.bubbles.push({ x: w.x, y: w.y, icon: "crown", t: 2 });
    if (Math.random() < 0.3) repAdd(0);
  };
  // No menu dos moradores sem nome, a primeira fala é de reverência.
  const wkBase = walkerContactItems;
  walkerContactItems = function (wk) {
    const items = wkBase(wk);
    if (isRoyalBorn())
      items.unshift({
        t: "Aceitar a reverência",
        icon: "crown",
        fn: () => say([[wk.nm, pk([`*se curva até o chão* ${alteza()}! A senhora/o senhor falou comigo! Vou contar pra minha mãe!`, "Alteza! Desculpe a roupa simples, eu não sabia que ia encontrar a realeza hoje.", "*ajoelha* Que as runas protejam a família real!"]).replace("A senhora/o senhor", genderWord("O príncipe", "A princesa", "Vossa Alteza"))]]),
      });
    return items;
  };
}
/* O título aparece nas falas em que o jogo usa o seu nome. */
{
  const fillBase = typeof fillN === "function" ? fillN : null;
  if (fillBase)
    fillN = function (s) {
      const r = fillBase(s);
      return isRoyalBorn() && typeof r === "string" ? r.replace(new RegExp(`\\b${player.name}\\b`), alteza()) : r;
    };
}

/* ===================== ALA REAL BONITA ===================== */

const RW_STYLE = {
  "Quarto Real": { floor: "parquet", wall: "#7a1e34", pat: "#9a2e48", trim: "#c9a03a" },
  Banheiro: { floor: "azulejo", wall: "#2a5a7a", pat: "#3a7a9a", trim: "#e8e4dc" },
  "Quarto de Hóspedes": { floor: "parquet2", wall: "#2a4a3a", pat: "#3a6a4a", trim: "#c9a03a" },
  "Sala de Jantar": { floor: "xadrez", wall: "#5a2a5a", pat: "#7a3a7a", trim: "#c9a03a" },
  Cozinha: { floor: "lajota", wall: "#c9b48a", pat: "#b8a070", trim: "#6b4423" },
  "Salão de Festas": { floor: "marmore", wall: "#2a2a5a", pat: "#3a3a7a", trim: "#f2c14e" },
};
function rwRoomAt(x, y) {
  return RW_ROOMS.find((r) => x >= r.x0 && x <= r.x1 && y >= r.y0 && y <= r.y1);
}
function rwFloor(kind, X, Y, x, y) {
  const c = (col, a, b, w, h) => {
    ctx.fillStyle = col;
    ctx.fillRect(X + a, Y + b, w, h);
  };
  switch (kind) {
    case "parquet":
    case "parquet2": {
      const base = kind === "parquet" ? "#8a5a32" : "#a8784a",
        d = shade(base, -0.18),
        l = shade(base, 0.12);
      c(base, 0, 0, 32, 32);
      for (let k = 0; k < 4; k++) {
        const off = ((x + y + k) % 2) * 12;
        c(d, 0, k * 8 + 7, 32, 1);
        c(d, off + 6, k * 8, 1, 8);
        c(l, 0, k * 8, 32, 1);
      }
      break;
    }
    case "azulejo":
      for (let a = 0; a < 2; a++)
        for (let b = 0; b < 2; b++) {
          c((x + y + a + b) % 2 ? "#e8f2f8" : "#bcdcec", a * 16, b * 16, 16, 16);
          c("#8ab0c4", a * 16, b * 16, 16, 1);
          c("#8ab0c4", a * 16, b * 16, 1, 16);
        }
      c("#5a8ab0", 15, 15, 2, 2);
      break;
    case "xadrez":
      for (let a = 0; a < 2; a++) for (let b = 0; b < 2; b++) c((a + b) % 2 ? "#2a2430" : "#efe8dc", a * 16, b * 16, 16, 16);
      c("rgba(255,255,255,.12)", 2, 3, 10, 1);
      break;
    case "lajota":
      c("#b4643f", 0, 0, 32, 32);
      c("#8a4a2a", 0, 15, 32, 2);
      c("#8a4a2a", 15, 0, 2, 32);
      c("rgba(255,220,180,.15)", 2, 2, 12, 2);
      break;
    case "marmore": {
      c("#f2ebdc", 0, 0, 32, 32);
      c("rgba(150,140,120,.25)", (x * 7) % 20, 4, 12, 1);
      c("rgba(150,140,120,.2)", 4, (y * 5) % 24 + 4, 1, 8);
      c("#d8cfb8", 0, 0, 32, 1);
      c("#d8cfb8", 0, 0, 1, 32);
      // Losango dourado nos cruzamentos.
      ctx.fillStyle = "#c9a03a";
      fillPolygon(X - 4, Y, X, Y - 4, X + 4, Y, X, Y + 4);
      break;
    }
    default: {
      c((x + y) % 2 ? "#efe6d2" : "#e2d8c2", 0, 0, 32, 32);
      c("#cfc3a8", 0, 0, 32, 1);
    }
  }
}
function drawRoyalWingNice(t) {
  const z = ZONES.alareal;
  const T = TILE;
  const isWall = (x, y) => !z.map[y] || z.map[y][x] === "#";
  for (let y = 0; y < RW.h; y++)
    for (let x = 0; x < RW.w; x++) {
      const X = x * T,
        Y = y * T;
      if (!isWall(x, y)) {
        const r = rwRoomAt(x, y);
        rwFloor(r ? RW_STYLE[r.n].floor : "corredor", X, Y, x, y);
        continue;
      }
      const below = !isWall(x, y + 1) && y + 1 < RW.h;
      if (below) {
        // Parede da frente com papel de parede, rodapé e moldura.
        const r = rwRoomAt(x, y + 1) || { n: "corredor" };
        const S = RW_STYLE[r.n] || { wall: "#4a2a3a", pat: "#6a3a4a", trim: "#c9a03a" };
        ctx.fillStyle = S.wall;
        ctx.fillRect(X, Y, T, T);
        ctx.fillStyle = S.pat;
        for (let k = 0; k < 3; k++) for (let j = 0; j < 2; j++) ctx.fillRect(X + 5 + k * 10 + (j % 2) * 5, Y + 6 + j * 9, 3, 3);
        ctx.fillStyle = "#3a2414";
        ctx.fillRect(X, Y + T - 8, T, 8);
        ctx.fillStyle = "#5a3a22";
        ctx.fillRect(X, Y + T - 8, T, 2);
        ctx.fillStyle = S.trim;
        ctx.fillRect(X, Y + 1, T, 2);
        ctx.fillRect(X, Y + T - 10, T, 1);
        // Janelas com cortinas na parede de fora; quadros e arandelas nas outras.
        if (y === 1 && x % 4 === 2) {
          ctx.fillStyle = "#e8d8b0";
          ctx.fillRect(X + 6, Y + 3, 20, 17);
          ctx.fillStyle = nightAlpha() > 0.3 ? "#1a2a4a" : "#9fd0f0";
          ctx.fillRect(X + 8, Y + 5, 16, 13);
          ctx.fillStyle = "rgba(255,255,255,.4)";
          ctx.fillRect(X + 9, Y + 6, 4, 10);
          ctx.fillStyle = "#e8d8b0";
          ctx.fillRect(X + 15, Y + 5, 2, 13);
          ctx.fillStyle = "#a82a3a";
          ctx.fillRect(X + 3, Y + 2, 5, 20);
          ctx.fillRect(X + 24, Y + 2, 5, 20);
          ctx.fillStyle = "#c9a03a";
          ctx.fillRect(X + 2, Y + 2, 28, 2);
        } else if ((x * 7 + y * 3) % 9 === 0) {
          ctx.fillStyle = "#c9a03a";
          ctx.fillRect(X + 7, Y + 4, 18, 14);
          ctx.fillStyle = ["#3a6a9a", "#6a3a2a", "#3a6a3a", "#7a5a9a"][(x + y) % 4];
          ctx.fillRect(X + 9, Y + 6, 14, 10);
          ctx.fillStyle = "#f2d6c2";
          ctx.fillRect(X + 14, Y + 8, 4, 4);
        } else if ((x * 5 + y) % 7 === 0) {
          ctx.fillStyle = "#c9a03a";
          ctx.fillRect(X + 14, Y + 10, 4, 6);
          ctx.fillStyle = `rgba(255,${190 + Math.floor(Math.sin(t * 8 + x) * 30)},90,1)`;
          ctx.beginPath();
          ctx.arc(X + 16, Y + 8 + Math.sin(t * 9 + x) * 0.6, 2.5, 0, 7);
          ctx.fill();
          const g = ctx.createRadialGradient(X + 16, Y + 9, 1, X + 16, Y + 9, 22);
          g.addColorStop(0, "rgba(255,200,110,.35)");
          g.addColorStop(1, "rgba(255,200,110,0)");
          ctx.fillStyle = g;
          ctx.fillRect(X - 6, Y - 13, 44, 44);
        }
      } else {
        // Topo das paredes: pedra escura com borda dourada.
        ctx.fillStyle = "#2e2433";
        ctx.fillRect(X, Y, T, T);
        ctx.fillStyle = "#3e3245";
        ctx.fillRect(X + 2, Y + 2, T - 4, T - 4);
        ctx.fillStyle = "rgba(201,160,58,.5)";
        if (!isWall(x - 1, y)) ctx.fillRect(X, Y, 2, T);
        if (!isWall(x + 1, y)) ctx.fillRect(X + T - 2, Y, 2, T);
      }
    }
  // Corredor: tapete vermelho com franjas e colunas.
  ctx.fillStyle = "#8a1e2a";
  ctx.fillRect(T, 10 * T + 6, (RW.w - 2) * T, T * 2 - 12);
  ctx.fillStyle = "#a82a3a";
  ctx.fillRect(T, 10 * T + 10, (RW.w - 2) * T, T * 2 - 20);
  ctx.fillStyle = "#f2c14e";
  ctx.fillRect(T, 10 * T + 6, (RW.w - 2) * T, 2);
  ctx.fillRect(T, 12 * T - 8, (RW.w - 2) * T, 2);
  for (let x = 2; x < RW.w - 1; x += 3) {
    ctx.fillStyle = "#c9a03a";
    ctx.fillRect(x * T + 14, 10 * T + 18, 4, 4);
  }
  // Escada de saída.
  for (let k = 0; k < 4; k++) {
    ctx.fillStyle = k % 2 ? "#8f897d" : "#a39d90";
    ctx.fillRect(4, 10 * T + k * 16, T - 8, 14);
  }
  // Colunas de mármore no salão de festas.
  for (const [x, y] of [
    [25, 14],
    [31, 14],
    [25, 19],
    [31, 19],
  ]) {
    const X = x * T,
      Y = y * T;
    ctx.fillStyle = "rgba(0,0,0,.2)";
    ctx.fillRect(X + 8, Y + 26, 18, 4);
    ctx.fillStyle = "#e8e0cc";
    ctx.fillRect(X + 10, Y - 14, 12, 40);
    ctx.fillStyle = "#cfc3a8";
    ctx.fillRect(X + 13, Y - 14, 2, 40);
    ctx.fillRect(X + 18, Y - 14, 2, 40);
    ctx.fillStyle = "#c9a03a";
    ctx.fillRect(X + 7, Y - 18, 18, 5);
    ctx.fillRect(X + 7, Y + 24, 18, 4);
  }
  // Placas dos cômodos.
  ctx.font = '700 9px "VT323", monospace';
  ctx.textAlign = "center";
  for (const r of RW_ROOMS) {
    const cx = ((r.x0 + r.x1 + 1) / 2) * T,
      cy = (r.y1 + 1) * T - 4;
    const w = ctx.measureText(r.n).width + 12;
    ctx.fillStyle = "#3a2414";
    ctx.fillRect(cx - w / 2, cy - 10, w, 13);
    ctx.fillStyle = "#c9a03a";
    ctx.fillRect(cx - w / 2, cy - 10, w, 1);
    ctx.fillRect(cx - w / 2, cy + 2, w, 1);
    ctx.fillStyle = "#f2c14e";
    ctx.fillText(r.n, cx, cy);
  }
  ctx.textAlign = "left";
}
function drawChandeliers(t) {
  const T = TILE;
  for (const r of RW_ROOMS) {
    if (r.n === "Banheiro") continue;
    const cx = ((r.x0 + r.x1 + 1) / 2) * T,
      cy = (r.y0 + 1.6) * T;
    const g = ctx.createRadialGradient(cx, cy, 4, cx, cy, 110);
    g.addColorStop(0, "rgba(255,214,140,.22)");
    g.addColorStop(1, "rgba(255,214,140,0)");
    ctx.fillStyle = g;
    ctx.fillRect(cx - 110, cy - 110, 220, 220);
    ctx.fillStyle = "#c9a03a";
    ctx.fillRect(cx - 1, cy - 30, 2, 18);
    ctx.fillRect(cx - 16, cy - 12, 32, 3);
    ctx.beginPath();
    ctx.arc(cx, cy - 10, 5, 0, Math.PI);
    ctx.fill();
    for (let k = -2; k <= 2; k++) {
      const x = cx + k * 7;
      ctx.fillStyle = "#f6f2ea";
      ctx.fillRect(x - 1, cy - 18, 3, 6);
      ctx.fillStyle = `rgba(255,${200 + Math.floor(Math.sin(t * 10 + k) * 30)},90,1)`;
      ctx.beginPath();
      ctx.arc(x + 0.5, cy - 20 + Math.sin(t * 12 + k) * 0.5, 2, 0, 7);
      ctx.fill();
    }
    ctx.fillStyle = "rgba(191,224,240,.8)";
    for (let k = -1; k <= 1; k++) ctx.fillRect(cx + k * 10, cy - 6, 2, 4);
  }
}
drawWingDecor = drawRoyalWingNice;
{
  const drawBase = crewDrawList;
  crewDrawList = function (list, t) {
    drawBase(list, t);
    if (player.zone === "alareal") list.push({ y: 999, draw: () => drawChandeliers(t) });
  };
}
