/**
 * ECOS DO ARCANO — taverna-por-mesas.js
 * Menos menu, mais taverna: cada diversão fica num lugar de verdade.
 *  - Mesa da esquerda: dados.  Mesa da direita: queda de braço.  Mesa do
 *    meio: vinte-e-um.  Alvo de dardos na parede.  Barril do canto:
 *    concurso de bebida.  Canto do menestrel: cantar junto.
 *  - Quadro de boatos e Mural dos Corações na parede; escada para os quartos.
 *  - Dona Cotinha, a fofoqueira, sentada perto do balcão: conta o que falam
 *    de você (3 ouro).
 *  - O Gus, no balcão, só cuida de bebida, comida e da rodada para todos.
 * Modifica (envolve) funções de outros arquivos: genInterior, tavernMenu,
 * targetAt, interactAt, walkable, crewDrawList.
 */

"use strict";

(() => {
  const isTav = () => player.zone === "interior" && game.inter && game.inter.st === "taverna";
  let ZMAP = null;
  const free = (x, y) => (ZMAP ? ZMAP[y] && ZMAP[y][x] === "." : tileAt("interior", x, y) === ".") && !game.inter.props.some((p) => p[1] === x && p[2] === y) && !game.inter.people.some((p) => p.x === x && p.y === y);
  const SPOTS = {};

  const giBase = genInterior;
  genInterior = function (b) {
    const z = giBase.apply(this, arguments);
    const I = game.inter;
    if (!I || I.st !== "taverna") return z;
    const w = z.w,
      h = z.h;
    ZMAP = z.map;
    const pickFree = (list) => list.find(([x, y]) => free(x, y)) || null;
    const scan = (xs, ys) => {
      for (const y of ys) for (const x of xs) if (free(x, y)) return [x, y];
      return null;
    };
    I.tavSpots = {
      boatos: pickFree([[4, 2], [5, 2], [3, 2]]),
      dardos: pickFree([[6, 2], [7, 2], [5, 2]]),
      mural: pickFree([[9, 2], [10, 2], [11, 2]]),
      escada: pickFree([[w - 2, h - 3], [w - 2, h - 4], [w - 3, h - 2]]) || scan([w - 2, w - 3, w - 4], [h - 3, h - 4, h - 2, h - 5, 7, 8]),
    };
    const gp = pickFree([[w - 3, 5], [w - 4, 5], [w - 3, 6]]) || scan([w - 3, w - 4, w - 2, w - 5], [5, 6, 7]);
    if (gp) I.people.push({ x: gp[0], y: gp[1], robe: "#7a5a8a", hair: "#d9d9d9", hat: null, nm: "Dona Cotinha, a fofoqueira", gossip: true });
    ZMAP = null;
    return z;
  };

  /* ----- o que cada lugar faz ----- */
  const tables = () => (game.inter.props || []).filter((p) => p[0] === "table").sort((a, b) => a[1] - b[1] || a[2] - b[2]);
  function placeAt(x, y) {
    if (!isTav()) return null;
    const I = game.inter;
    const S = I.tavSpots || {};
    for (const [k, p] of Object.entries(S)) if (p && p[0] === x && p[1] === y) return k;
    const ts = tables();
    const ti = ts.findIndex((p) => p[1] === x && p[2] === y);
    if (ti >= 0) return ["dados", "cartas", "braco"][Math.min(2, ti)];
    const pr = I.props.find((p) => p[1] === x && p[2] === y);
    if (pr && pr[0] === "barrel" && pr[2] === 3) return "concurso";
    if (pr && pr[0] === "bard") return "cantar";
    const pe = I.people.find((p) => p.gossip && p.x === x && p.y === y);
    if (pe) return "fofoca";
    return null;
  }
  const LABEL = {
    dados: "Mesa de dados (aposta)",
    cartas: "Mesa do vinte-e-um",
    braco: "Mesa da queda de braço (aposta 15)",
    concurso: "Barril do concurso de bebida (aposta 20)",
    cantar: "Cantar com o menestrel",
    boatos: "Quadro de boatos (5 ouro)",
    dardos: "Alvo de dardos (3 ouro)",
    mural: "Mural dos Corações",
    escada: "Escada para os quartos (25 ouro)",
    fofoca: "Ouvir a Dona Cotinha (3 ouro)",
  };
  function rentRoom() {
    if (player.gold < 25) return say([["Gus, o Taverneiro", "Sem ouro, sem cama. Sua casa é de graça, sabia?"]]);
    player.gold -= 25;
    player.clock = 6 * 60;
    player.day++;
    player.hp = maxHp();
    player.mp = maxMp();
    player.stamina = 100;
    player.food = Math.max(0, player.food - 15);
    player.water = Math.max(0, player.water - 15);
    game.fade = 1;
    saveGame();
    say([["", "Você sobe a escada rangendo e dorme num quarto quentinho em cima da taverna. Bom dia! Vida e mana cheias."]]);
  }
  const ACT = {
    dados: () => (typeof diceGame === "function" ? diceGame() : playDice()),
    cartas: () => blackjack(),
    braco: () => armWrestle(),
    concurso: () => drinkingContest(),
    cantar: () => karaoke(),
    boatos: () => rumor(),
    dardos: () => dartsGame(),
    mural: () => heartBoardMenu(),
    escada: rentRoom,
    fofoca: () => {
      if (player.gold < 3) return say([["Dona Cotinha", "Fofoca boa não é de graça, meu bem. Três moedinhas."]]);
      player.gold -= 3;
      hearGossip();
    },
  };

  const tgBase = targetAt;
  targetAt = function (x, y) {
    const k = placeAt(x, y);
    if (k) return LABEL[k];
    return tgBase(x, y);
  };
  const iaBase = interactAt;
  interactAt = function (x, y) {
    const k = placeAt(x, y);
    if (k) {
      game.pieAnchor = null;
      return ACT[k]();
    }
    return iaBase(x, y);
  };
  const wkBase = walkable;
  walkable = function (z, x, y) {
    if (z === "interior" && isTav() && game.inter.tavSpots) for (const p of Object.values(game.inter.tavSpots)) if (p && p[0] === x && p[1] === y) return false;
    return wkBase(z, x, y);
  };

  // O Gus só cuida do balcão: bebida, comida e a rodada.
  const tmBase = tavernMenu;
  tavernMenu = function () {
    const r = tmBase.apply(this, arguments);
    if (isTav() && game.mode === "choice" && Array.isArray(game.choice)) {
      const keep = game.choice.filter((o) => /bebidas|Cardápio|rodada|Comprar comida|Sair/i.test(o.t));
      if (!player.flags.tavMesas) {
        player.flags.tavMesas = true;
        setTimeout(() => toast("Dica: dados, cartas, queda de braço, dardos, boatos e quartos ficam nas mesas, na parede e na escada. É só chegar perto!", 5000), 300);
      }
      choice("Balcão do Gus", "O Gus enxuga uma caneca. — O que vai ser, freguês?", keep);
    }
    return r;
  };

  /* ----- desenho dos lugares novos ----- */
  const cdBase = crewDrawList;
  crewDrawList = function (list, t) {
    cdBase(list, t);
    if (!isTav() || !game.inter.tavSpots) return;
    const S = game.inter.tavSpots,
      T = TILE;
    const at = (p, fn) => p && list.push({ y: p[1] - 0.05, draw: () => fn(p[0] * T, p[1] * T) });
    at(S.boatos, (X, Y) => {
      ctx.fillStyle = "#6b4423";
      ctx.fillRect(X + 3, Y - 6, 26, 26);
      ctx.fillStyle = "#8a5a2e";
      ctx.fillRect(X + 5, Y - 4, 22, 22);
      for (const [dx, dy, c] of [[7, -2, "#efe2c0"], [16, 0, "#f2eecf"], [9, 8, "#e8d8b0"]]) ((ctx.fillStyle = c), ctx.fillRect(X + dx, Y + dy, 9, 8), (ctx.fillStyle = "#c94a4a"), ctx.fillRect(X + dx + 4, Y + dy, 2, 2));
    });
    at(S.dardos, (X, Y) => {
      for (const [r, c] of [[12, "#3a2414"], [10, "#f2eecf"], [7, "#c94a4a"], [4, "#f2eecf"], [2, "#c94a4a"]]) ((ctx.fillStyle = c), ctx.beginPath(), ctx.arc(X + 16, Y + 6, r, 0, 7), ctx.fill());
      ctx.fillStyle = "#8a8a92";
      ctx.fillRect(X + 18, Y + 2, 6, 1);
      ctx.fillRect(X + 12, Y + 9, 6, 1);
    });
    at(S.mural, (X, Y) => {
      ctx.fillStyle = "#6b4423";
      ctx.fillRect(X + 3, Y - 6, 26, 26);
      ctx.fillStyle = "#f2e0e8";
      ctx.fillRect(X + 5, Y - 4, 22, 22);
      drawPixelIcon("heart", X + 16, Y + 7, 2);
    });
    at(S.escada, (X, Y) => {
      for (let i = 0; i < 5; i++) {
        ctx.fillStyle = i % 2 ? "#8a5a2e" : "#a8784a";
        ctx.fillRect(X + 2, Y + 26 - i * 6, 28 - i * 2, 6);
      }
      ctx.fillStyle = "#4a2e17";
      ctx.fillRect(X + 28, Y - 4, 3, 32);
    });
    const g = game.inter.people.find((p) => p.gossip);
    if (g) list.push({ y: g.y + 0.02, draw: () => drawPixelIcon("chat", g.x * T + 16, g.y * T - 10 - Math.abs(Math.sin(t * 3)) * 3, 2) });
  };
})();
