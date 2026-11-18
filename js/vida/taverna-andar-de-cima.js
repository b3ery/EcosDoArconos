/**
 * ECOS DO ARCANO — taverna-andar-de-cima.js
 * A taverna ganha um segundo andar (a escada perto da parede da direita):
 *  - Corredor com três portas e uma camareira que vai e volta.
 *  - Quarto de hóspede: a cama aluga a noite (25 ouro); baú e janela.
 *  - Sala de jogos: mesa de cartas com apostas altas e dois jogadores
 *    resmungões.
 *  - Quarto do viajante encapuzado: conta boatos de graça uma vez por dia
 *    e olha a vila pela janela.
 * Modifica (envolve) funções de outros arquivos: targetAt, interactAt,
 * walkable, crewDrawList, update.
 */

"use strict";

(() => {
  const ZID = "taverna-cima";
  const W = 18,
    H = 12;
  const SPAWN = [2, 9];
  const DOWN = [1, 9];
  const pick = (a) => a[Math.floor(Math.random() * a.length)];

  ZONE_DEFS[ZID] = { nome: "Taverna · Andar de cima", theme: "casa", exits: {}, enemies: [] };
  {
    const m = makeGrid(W, H, (x, y) => (x === 0 || y === 0 || x === W - 1 || y === H - 1 ? "#" : "."));
    for (let x = 1; x < W - 1; x++) m[7][x] = "#";
    for (let y = 1; y < 7; y++) (m[y][6] = "#"), (m[y][12] = "#");
    for (const x of [3, 9, 15]) m[7][x] = ".";
    const z = finalize(ZID, ZONE_DEFS[ZID], m, W, H, {}, {}, null);
    z.town = { bld: [], doors: {}, stalls: {}, huts: [], arrive: SPAWN.slice(), horses: [], boats: [], indoor: true, yard: true };
    ZONES[ZID] = z;
  }

  const PLACES = {
    "2,2": { t: "Cama do quarto (dormir · 25 ouro)", k: "cama" },
    "3,2": { t: "Cama do quarto (dormir · 25 ouro)", k: "cama" },
    "5,2": { t: "Baú do hóspede", k: "bau" },
    "1,4": { t: "Janela do quarto", k: "janela" },
    "9,4": { t: "Mesa de cartas (apostas altas)", k: "cartas" },
    "16,4": { t: "Janela do viajante", k: "janela2" },
    "1,9": { t: "Descer para o salão", k: "descer" },
  };
  const NPCS2 = [
    { x: 8, y: 3, nm: "Jogador Barnabé", robe: "#5a3a5a", hair: "#3a2414", dir: "right", k: "jogador" },
    { x: 10, y: 3, nm: "Jogadora Inês", robe: "#2a5a5a", hair: "#d9a441", dir: "left", k: "jogador" },
    { x: 14, y: 3, nm: "Viajante encapuzado", robe: "#2a2a3a", hair: "#1a1a1a", hat: "#2a2a3a", dir: "down", k: "viajante" },
  ];
  const maid = { x: 6, y: 9, rx: 6, ry: 9, dir: "right", step: 0, v: 1 };
  const placeAt = (x, y) => PLACES[x + "," + y] || null;
  const npcAt = (x, y) => NPCS2.find((n) => n.x === x && n.y === y) || (maid.x === x && maid.y === y ? { nm: "Camareira Rosa", k: "camareira" } : null);

  function goUp() {
    game.tavBack = { b: game.inter && game.inter.b, ret: player.ret };
    player.zone = ZID;
    [player.x, player.y] = SPAWN;
    player.rx = player.x;
    player.ry = player.y;
    player.dir = "right";
    game.fade = 1;
    enterZone(true);
    playSound(300, 0.1, "triangle");
  }
  function goDown() {
    const B = game.tavBack;
    if (B && B.b) {
      const ret = B.ret;
      enterBuilding(B.b);
      if (ret) player.ret = ret;
      const S = game.inter && game.inter.tavSpots && game.inter.tavSpots.escada;
      if (S) ((player.x = S[0] - 1), (player.y = S[1]), (player.rx = player.x), (player.ry = player.y), (player.dir = "left"));
    } else {
      player.zone = "vila";
      enterZone(false);
    }
  }
  window.tavernUpstairs = goUp;

  function act(k, n) {
    if (k === "descer") return goDown();
    if (k === "cama") {
      if (player.gold < 25) return say([["", "A Camareira Rosa cruza os braços: — A noite custa 25, meu bem."]]);
      player.gold -= 25;
      player.clock = 6 * 60;
      player.day++;
      player.hp = maxHp();
      player.mp = maxMp();
      player.stamina = 100;
      game.fade = 1;
      saveGame();
      return say([["", "Lençol limpo, travesseiro de pena e o barulho da taverna lá embaixo. Você dorme como pedra. Bom dia! Vida e mana cheias."]]);
    }
    if (k === "bau") return say([["", pick(["Um gibão esquecido, duas meias furadas e uma carta de amor sem assinatura.", "Vazio. O último hóspede levou até o travesseiro extra.", "Uma moeda perdida no fundo! (+1 ouro)"])]], () => 0);
    if (k === "janela") return say([["", "Da janela dá para ver a praça inteira, a fonte e o castelo lá no alto."]]);
    if (k === "janela2") return say([["", "O viajante abriu a janela. Lá fora, a estrada some no Bosque. Ele não tira os olhos dela."]]);
    if (k === "cartas") {
      if (player.gold < 20) return say([["Jogador Barnabé", "Aqui a aposta mínima é 20. Volta quando tiver bolsa cheia."]]);
      return typeof blackjack === "function" ? blackjack() : 0;
    }
    if (k === "jogador") return say([[n.nm, pick(["Não fala comigo, tô perdendo.", "Essa mesa tá amaldiçoada, juro.", "Senta aí se tiver coragem e ouro.", "Ela rouba. Eu sei que ela rouba."])]]);
    if (k === "camareira") return say([["Camareira Rosa", pick(["O quarto da esquerda está livre.", "Não liga pro viajante, ele é calado assim mesmo.", "Se ouvir alguém chorando de madrugada, é o Barnabé que perdeu nas cartas."])]]);
    if (k === "viajante") {
      const key = "viajante" + player.day;
      if (player.famDay[key]) return say([["Viajante encapuzado", "Já te contei o que sei hoje. Volte amanhã."]]);
      player.famDay[key] = 1;
      return typeof rumor === "function" ? ((player.gold += 5), rumor()) : say([["Viajante encapuzado", "Os ventos do sul trazem notícias estranhas..."]]);
    }
  }

  const tgBase = targetAt;
  targetAt = function (x, y) {
    if (player.zone === ZID) {
      const p = placeAt(x, y);
      if (p) return p.t;
      const n = npcAt(x, y);
      if (n) return "Falar com " + n.nm;
      return null;
    }
    return tgBase(x, y);
  };
  const iaBase = interactAt;
  interactAt = function (x, y) {
    if (player.zone === ZID) {
      const p = placeAt(x, y);
      if (p) return act(p.k);
      const n = npcAt(x, y);
      if (n) return act(n.k, n);
      return;
    }
    return iaBase(x, y);
  };
  const wkBase = walkable;
  walkable = function (z, x, y) {
    if (z === ZID && (placeAt(x, y) || npcAt(x, y))) return false;
    return wkBase(z, x, y);
  };
  const upBase = update;
  update = function (dt) {
    upBase(dt);
    if (player.zone !== ZID || game.mode !== "world" || game.dialog) return;
    maid.rx += (maid.x - maid.rx) * Math.min(1, dt * 8);
    maid.ry += (maid.y - maid.ry) * Math.min(1, dt * 8);
    maid.step -= dt;
    if (maid.step > 0) return;
    maid.step = 0.5;
    const nx = maid.x + maid.v;
    if (nx < 3 || nx > 16 || (nx === player.x && maid.y === player.y)) return (maid.v *= -1), (maid.dir = maid.v > 0 ? "right" : "left");
    maid.x = nx;
    maid.dir = maid.v > 0 ? "right" : "left";
  };
  // calçamento, flores da estação e festa de rua não entram no andar de cima
  for (const nm of ["drawVilaLife", "drawSeasonGround", "drawLocalFestival"])
    if (typeof window[nm] === "function") {
      const base = window[nm];
      window[nm] = function () {
        if (player.zone === ZID) return;
        return base.apply(this, arguments);
      };
    }
  const cdBase = crewDrawList;
  crewDrawList = function (list, t) {
    cdBase(list, t);
    if (player.zone !== ZID) return;
    const T = TILE;
    const R = (x, y, w, h, c) => ((ctx.fillStyle = c), ctx.fillRect(x, y, w, h));
    list.push({
      y: -10,
      draw: () => {
        // assoalho de tábuas por cima do chão (nada de flor dentro de casa)
        const z = ZONES[ZID];
        for (let y = 1; y < H - 1; y++)
          for (let x = 1; x < W - 1; x++) {
            if (z.map[y][x] !== ".") continue;
            // quatro tábuas por ladrilho, emendas desencontradas, pregos
            for (let b = 0; b < 4; b++) {
              const Y = y * T + b * 8,
                sh = (x * 7 + y * 3 + b * 5) % 3;
              R(x * T, Y, T, 8, ["#8a6038", "#946840", "#7e5732"][sh]);
              R(x * T, Y + 7, T, 1, "#5a3a1e");
              R(x * T, Y, T, 1, "#a47a4e");
              const seam = ((x + b * 2 + y) % 4) * 8;
              if ((x + b + y) % 2 === 0) (R(x * T + seam, Y, 1, 7, "#5a3a1e"), R(x * T + seam + 2, Y + 3, 1, 1, "#3a2414"));
            }
          }
      },
    });
    list.push({
      y: -3,
      draw: () => {
        // tapete do corredor e luz de velas
        R(2 * T, 8 * T + 6, 15 * T, T + 20, "#7a2a2a");
        R(2 * T, 8 * T + 10, 15 * T, 2, "#c9a050");
        R(2 * T, 9 * T + 20, 15 * T, 2, "#c9a050");
        // escada descendo
        for (let i = 0; i < 4; i++) R(DOWN[0] * T + 2, DOWN[1] * T + 4 + i * 7, 28 - i * 3, 6, i % 2 ? "#5a3a1e" : "#7a5a2e");
        // cama
        R(2 * T, 2 * T - 6, 2 * T, T + 6, "#6b4423");
        R(2 * T + 4, 2 * T - 2, 2 * T - 8, T - 2, "#e8e4dc");
        R(2 * T + 4, 2 * T + 8, 2 * T - 8, T - 12, "#8a3a5a");
        R(2 * T + 6, 2 * T, 18, 8, "#f8f4ec");
        // baú
        R(5 * T + 3, 2 * T + 8, 26, 20, "#8a5a2e");
        R(5 * T + 3, 2 * T + 8, 26, 6, "#a8784a");
        R(5 * T + 14, 2 * T + 14, 4, 5, "#c9a050");
        // mesa de cartas com vela
        R(9 * T - 6, 4 * T + 6, T + 12, 18, "#5a3a1e");
        R(9 * T - 4, 4 * T + 4, T + 8, 6, "#2a5a3a");
        for (let i = 0; i < 4; i++) R(9 * T + i * 6, 4 * T + 6, 4, 6, i % 2 ? "#f2eecf" : "#c94a4a");
        R(9 * T + 26, 4 * T - 6, 3, 10, "#f2eecf");
        ctx.fillStyle = `rgba(255,190,80,${0.8 + 0.2 * Math.sin(t * 9)})`;
        ctx.fillRect(9 * T + 26, 4 * T - 10, 3, 4);
        // janelas com a noite
        for (const [x, y] of [[1, 4], [16, 4]]) (R(x * T + 4, y * T - 2, 24, 28, "#4a2e17"), R(x * T + 7, y * T + 1, 18, 22, currentHour() >= 18 || currentHour() < 6 ? "#1a2a4a" : "#9fd0f0"), R(x * T + 15, y * T + 1, 2, 22, "#4a2e17"));
        // velas do corredor
        for (const x of [4, 10, 16]) {
          const gl = ctx.createRadialGradient(x * T + 16, 8 * T, 2, x * T + 16, 8 * T, 70);
          gl.addColorStop(0, "rgba(255,190,90,.25)");
          gl.addColorStop(1, "rgba(255,190,90,0)");
          ctx.fillStyle = gl;
          ctx.fillRect(x * T - 54, 8 * T - 70, 140, 140);
        }
      },
    });
    for (const n of NPCS2)
      list.push({ y: n.y, draw: () => drawSprite(wizardRects(n.robe, n.hat || null, n.hair, null, n.dir), n.x * T, n.y * T + Math.sin(t * 2 + n.x) * 0.6, 2) });
    list.push({
      y: maid.ry,
      draw: () => {
        drawSprite(wizardRects("#3a3a5a", null, "#8a3a1a", null, maid.dir, walkFrame(true, t)), maid.rx * T, maid.ry * T, 2);
        R(maid.rx * T + 6, maid.ry * T + 18, 20, 8, "#f2eee4");
      },
    });
  };
})();
