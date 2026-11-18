/**
 * ECOS DO ARCANO — biblioteca-caida.js (modo História)
 * A Antiga Academia Arcana virou uma BIBLIOTECA EM RUÍNAS (e não uma caverna):
 *  - Piso de mármore rachado, com musgo e grama onde o teto caiu, entulho e
 *    páginas soltas; paredes de pedra quebradas com hera, colunas partidas e
 *    estantes tombadas; fachos de luz entrando pelos buracos do teto.
 *  - Desafio da Biblioteca Caída: quatro Livros Fujões (Fogo, Água, Terra e
 *    Ar) voam pelas ruínas e fogem quando você chega perto. Encurrale e pegue
 *    cada um. Depois, a Estante do Índice (perto da sala do Diretor) pede os
 *    quatro na ordem certa, com pistas gravadas na madeira. Só então a porta
 *    do Diretor Espectral se abre.
 * Dicas: a Professora Selene explica ao entrar; a placa da estante repete as
 * pistas; depois de um tempo, os livros deixam rastro de páginas.
 * Modifica (envolve) funções de outros arquivos: ground, drawWall, update,
 * crewDrawList, targetAt, interactAt, walkable, enterZone.
 */

"use strict";

(() => {
  const ZID = "escola";
  const T = TILE;
  const hsh = (x, y, s = 0) => {
    let h = (x * 374761393 + y * 668265263 + s * 2246822519) >>> 0;
    h = ((h ^ (h >>> 13)) * 1274126177) >>> 0;
    return (h & 0xffff) / 0xffff;
  };
  const smooth = (x, y) => (hsh(x >> 2, y >> 2, 7) + hsh((x + 2) >> 2, (y + 2) >> 2, 7)) / 2;
  const here = () => player && player.zone === ZID && story();

  /* ===================== VISUAL DE RUÍNA ===================== */
  const gBase = ground;
  ground = function (th, X, Y, h) {
    if (!(player && player.zone === ZID)) return gBase.apply(this, arguments);
    const x = Math.round(X / T),
      y = Math.round(Y / T);
    const moss = smooth(x, y);
    if (moss > 0.82) {
      // teto caído: grama e terra
      ctx.fillStyle = h < 0.5 ? "#4a6a32" : "#527238";
      ctx.fillRect(X, Y, T, T);
      ctx.fillStyle = "#6a8a42";
      if (h > 0.4) ctx.fillRect(X + Math.floor(h * 20) + 4, Y + 8, 2, 6);
      if (h > 0.7) ctx.fillRect(X + 6, Y + Math.floor(h * 18) + 6, 2, 5);
      return;
    }
    // mármore em losangos, gasto
    ctx.fillStyle = (x + y) % 2 ? "#bdb3a0" : "#cfc6b4";
    ctx.fillRect(X, Y, T, T);
    ctx.fillStyle = "rgba(90,80,70,.35)";
    ctx.fillRect(X, Y, T, 1);
    ctx.fillRect(X, Y, 1, T);
    if (moss > 0.66) {
      ctx.fillStyle = "rgba(80,110,50,.55)";
      ctx.fillRect(X + 2, Y + 18, 14, 10);
      ctx.fillRect(X + 12, Y + 22, 14, 8);
    }
    if (h > 0.78) {
      ctx.strokeStyle = "rgba(60,50,40,.55)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(X + 4, Y + 6);
      ctx.lineTo(X + 14, Y + 15);
      ctx.lineTo(X + 12, Y + 26);
      ctx.moveTo(X + 14, Y + 15);
      ctx.lineTo(X + 26, Y + 18);
      ctx.stroke();
    }
    if (h < 0.08) {
      ctx.fillStyle = "#8a8070";
      ctx.fillRect(X + 6, Y + 20, 8, 6);
      ctx.fillStyle = "#a89a88";
      ctx.fillRect(X + 16, Y + 22, 6, 5);
      ctx.fillRect(X + 10, Y + 16, 4, 4);
    } else if (h > 0.94) {
      ctx.fillStyle = "#efe2c0";
      ctx.fillRect(X + 9, Y + 12, 10, 7);
      ctx.fillStyle = "#8a7a5a";
      ctx.fillRect(X + 10, Y + 14, 7, 1);
      ctx.fillRect(X + 10, Y + 16, 5, 1);
    }
  };
  const dwBase = drawWall;
  drawWall = function (theme, X, Y, h, t) {
    if (theme !== "escola") return dwBase.apply(this, arguments);
    const x = Math.round(X / T),
      y = Math.round(Y / T);
    // céu escuro por trás da parede quebrada
    ctx.fillStyle = "#1a1a2a";
    ctx.fillRect(X, Y, T, T);
    const broken = 4 + Math.floor(hsh(x, y, 3) * 12);
    ctx.fillStyle = "#8a8070";
    ctx.fillRect(X, Y + broken, T, T - broken);
    ctx.fillStyle = "#6a6052";
    for (let r = 0; r < 4; r++) {
      const yy = Y + r * 8 + 7;
      if (yy > Y + broken) ctx.fillRect(X, yy, T, 1);
      const o = (r % 2) * 10;
      if (Y + r * 8 >= Y + broken - 2) (ctx.fillRect(X + o + 4, Y + r * 8, 1, 7), ctx.fillRect(X + o + 18, Y + r * 8, 1, 7));
    }
    // borda quebrada irregular
    ctx.fillStyle = "#a89a88";
    for (let k = 0; k < 4; k++) ctx.fillRect(X + k * 8, Y + broken - (hsh(x * 4 + k, y, 9) * 5) | 0, 8, 3);
    if (h > 0.6) {
      ctx.fillStyle = "#3a6a2a";
      for (let k = 0; k < 3; k++) ctx.fillRect(X + 4 + k * 9, Y + broken, 3, 10 + ((k * 7 + Math.floor(h * 30)) % 14));
      ctx.fillStyle = "#5a8a3a";
      ctx.fillRect(X + 6, Y + broken + 6, 4, 3);
      ctx.fillRect(X + 20, Y + broken + 10, 4, 3);
    }
    if (h < 0.12) {
      // coluna partida
      ctx.fillStyle = "#d8d0c0";
      ctx.fillRect(X + 8, Y + 10, 16, 22);
      ctx.fillStyle = "#b8ae9c";
      ctx.fillRect(X + 12, Y + 10, 2, 22);
      ctx.fillRect(X + 18, Y + 10, 2, 22);
      ctx.fillStyle = "#1a1a2a";
      ctx.fillRect(X + 8, Y + 8, 6, 4);
      ctx.fillRect(X + 18, Y + 6, 6, 5);
    } else if (h < 0.24) {
      // estante tombada
      ctx.save();
      ctx.translate(X + 16, Y + 20);
      ctx.rotate(-0.35);
      ctx.fillStyle = "#5a3a22";
      ctx.fillRect(-14, -10, 28, 22);
      const cols = ["#c94a4a", "#4a74c9", "#5a9a4a", "#d9a441"];
      for (let i = 0; i < 5; i++) ((ctx.fillStyle = cols[i % 4]), ctx.fillRect(-12 + i * 5, -8, 3, 8));
      ctx.restore();
    }
  };

  /* ===================== OS LIVROS FUJÕES ===================== */
  const BOOKS = [
    ["Fogo", "#c94a4a"],
    ["Água", "#3a74c9"],
    ["Terra", "#7a5a2e"],
    ["Ar", "#9ad0d8"],
  ];
  const st = () => (player.biblio = player.biblio || { got: [], solved: false, met: false });
  let flyers = null;
  function shelfSpot() {
    const z = ZONES[ZID];
    const [gx, gy] = z.guardPos || [20, 28];
    for (const [dx, dy] of [[0, -2], [-2, 0], [2, 0], [0, -3], [-2, -2], [2, -2], [0, 2]]) {
      const x = gx + dx,
        y = gy + dy;
      if (z.map[y] && z.map[y][x] === ".") return [x, y];
    }
    return [gx, gy - 2];
  }
  let SHELF = null;
  function spawnFlyers() {
    const z = ZONES[ZID];
    const S = st();
    const free = (z.spawn || []).filter(([x, y]) => Math.abs(x - player.x) + Math.abs(y - player.y) > 8);
    flyers = BOOKS.filter(([n]) => !S.got.includes(n)).map(([n, c], i) => {
      const [x, y] = free[Math.floor(((i + 1) * 0.23 * free.length) % free.length)] || [5 + i * 3, 5];
      return { n, c, x, y, rx: x, ry: y, step: 0, trail: [], tired: 0 };
    });
  }
  function fleeStep(b) {
    const d = Math.abs(b.x - player.x) + Math.abs(b.y - player.y);
    const opts = DIRS4.map(([a, c]) => [b.x + a, b.y + c]).filter(([x, y]) => walkable(ZID, x, y) && !(x === player.x && y === player.y) && !flyers.some((o) => o !== b && o.x === x && o.y === y));
    if (!opts.length) return;
    if (d <= 4) {
      opts.sort((p, q) => Math.abs(q[0] - player.x) + Math.abs(q[1] - player.y) - (Math.abs(p[0] - player.x) + Math.abs(p[1] - player.y)));
      [b.x, b.y] = opts[0];
      b.tired += 1;
    } else if (Math.random() < 0.3) [b.x, b.y] = opts[Math.floor(Math.random() * opts.length)];
    b.trail.push([b.x, b.y, 4]);
    if (b.trail.length > 8) b.trail.shift();
  }
  const bookAt = (x, y) => flyers && flyers.find((b) => b.x === x && b.y === y);

  /* ===================== LIGAÇÕES ===================== */
  const ezBase = enterZone;
  enterZone = function () {
    const r = ezBase.apply(this, arguments);
    if (player.zone === ZID && story()) {
      SHELF = shelfSpot();
      const S = st();
      if (!S.solved) spawnFlyers();
      if (!S.met) {
        S.met = true;
        setTimeout(
          () =>
            say([
              ["Professora Selene", "A Biblioteca Caída... o teto desabou no Grande Silêncio e os livros enlouqueceram. Quatro deles fugiram das estantes: Fogo, Água, Terra e Ar."],
              ["Professora Selene", "Eles voam para longe quando você chega perto. Encurrale cada um contra uma parede ou num corredor e aperte E."],
              ["Professora Selene", "Com os quatro, vá até a Estante do Índice, perto da sala do Diretor. As pistas da ordem estão gravadas na madeira. Só assim a porta dele se abre."],
            ]),
          900,
        );
      }
    } else flyers = null;
    return r;
  };
  let acc = 0;
  const upBase = update;
  update = function (dt) {
    upBase(dt);
    if (!here() || !flyers || game.mode !== "world" || game.dialog) return;
    acc += dt;
    for (const b of flyers) {
      b.rx += (b.x - b.rx) * Math.min(1, dt * 8);
      b.ry += (b.y - b.ry) * Math.min(1, dt * 8);
      for (const tr of b.trail) tr[2] -= dt;
      b.trail = b.trail.filter((tr) => tr[2] > 0);
    }
    if (acc >= 0.34) {
      acc = 0;
      for (const b of flyers) fleeStep(b);
    }
  };
  const wkBase = walkable;
  walkable = function (z, x, y) {
    if (z === ZID && story() && player.zone === ZID) {
      if (bookAt(x, y)) return false;
      if (SHELF && x === SHELF[0] && y === SHELF[1]) return false;
    }
    return wkBase(z, x, y);
  };
  const tgBase = targetAt;
  targetAt = function (x, y) {
    if (here()) {
      const b = bookAt(x, y);
      if (b) return `Pegar o Livro de ${b.n}`;
      if (SHELF && x === SHELF[0] && y === SHELF[1]) return st().solved ? "Estante do Índice (completa)" : "Estante do Índice";
      const z = ZONES[ZID];
      if (z.guardPos && x === z.guardPos[0] && y === z.guardPos[1] && !st().solved) return "Porta selada do Diretor";
    }
    return tgBase(x, y);
  };
  const iaBase = interactAt;
  interactAt = function (x, y) {
    if (here()) {
      const S = st();
      const b = bookAt(x, y);
      if (b) {
        flyers = flyers.filter((q) => q !== b);
        S.got.push(b.n);
        saveGame();
        [523, 659, 784].forEach((f, i) => setTimeout(() => playSound(f, 0.12, "triangle"), i * 80));
        return say([["", `Você agarra o Livro de ${b.n}! Ele se debate um pouco e aquieta. (${S.got.length}/4)`], ...(S.got.length >= 4 ? [["Professora Selene", "Os quatro! Agora leve até a Estante do Índice, perto da sala do Diretor."]] : [])]);
      }
      if (SHELF && x === SHELF[0] && y === SHELF[1]) {
        if (S.solved) return say([["", "Os quatro livros descansam na estante, em ordem. A porta do Diretor está aberta."]]);
        if (S.got.length < 4) return say([["", `A estante tem quatro espaços vazios: Fogo, Água, Terra e Ar. Você tem ${S.got.length} de 4 livros. Os outros ainda voam pelas ruínas.`]]);
        return indexPuzzle((ok) => {
          if (!ok) return say([["", "Os livros pulam da estante, irritados. A ordem não era essa. Leia as pistas de novo com calma."]]);
          S.solved = true;
          saveGame();
          game.shake = 0.4;
          [392, 523, 659, 784].forEach((f, i) => setTimeout(() => playSound(f, 0.2, "triangle"), i * 110));
          say([["", "Os quatro livros brilham juntos. Um rangido enorme ecoa: a porta da sala do Diretor se abre."], ["Diretor Espectral (ao longe)", "QUEM MEXEU NA MINHA ESTANTE?!"]]);
        });
      }
      const z = ZONES[ZID];
      if (z.guardPos && x === z.guardPos[0] && y === z.guardPos[1] && !S.solved) return say([["", "A porta da sala do Diretor está selada por um índice mágico. Coloque os quatro Livros Fujões na Estante do Índice, na ordem certa."]]);
    }
    return iaBase(x, y);
  };
  const cdBase = crewDrawList;
  crewDrawList = function (list, t) {
    cdBase(list, t);
    if (!(player && player.zone === ZID)) return;
    // fachos de luz entrando pelo teto caído
    list.push({
      y: 998,
      draw: () => {
        const z = ZONES[ZID];
        for (let k = 0; k < 7; k++) {
          const x = Math.floor(hsh(k, 1, 5) * z.w),
            y = Math.floor(hsh(k, 2, 5) * z.h);
          const a = 0.08 + 0.03 * Math.sin(t * 0.7 + k);
          const gr = ctx.createLinearGradient(x * T, (y - 4) * T, x * T, (y + 2) * T);
          gr.addColorStop(0, `rgba(255,240,200,0)`);
          gr.addColorStop(1, `rgba(255,240,200,${a})`);
          ctx.fillStyle = gr;
          ctx.beginPath();
          ctx.moveTo(x * T + 10, (y - 4) * T);
          ctx.lineTo(x * T + 40, (y - 4) * T);
          ctx.lineTo(x * T + 64, (y + 2) * T);
          ctx.lineTo(x * T - 14, (y + 2) * T);
          ctx.fill();
        }
        // poeira e páginas no ar
        for (let k = 0; k < 18; k++) {
          const px = (hsh(k, 3, 1) * z.w * T + Math.sin(t * 0.5 + k) * 30) % (z.w * T);
          const py = (hsh(k, 4, 1) * z.h * T + t * 10 * (0.5 + hsh(k, 5, 1))) % (z.h * T);
          ctx.fillStyle = k % 4 ? "rgba(255,240,200,.35)" : "rgba(239,226,192,.8)";
          ctx.fillRect(px, py, k % 4 ? 2 : 6, k % 4 ? 2 : 4);
        }
      },
    });
    if (!story()) return;
    if (SHELF) {
      const [sx, sy] = SHELF,
        S = st();
      list.push({
        y: sy,
        draw: () => {
          ctx.fillStyle = "#5a3a22";
          ctx.fillRect(sx * T + 2, sy * T - 8, 28, 38);
          ctx.fillStyle = "#3a2414";
          for (let i = 0; i < 4; i++) ctx.fillRect(sx * T + 4 + i * 6, sy * T, 5, 14);
          if (S.solved) BOOKS.forEach(([n, c], i) => ((ctx.fillStyle = c), ctx.fillRect(sx * T + 4 + i * 6, sy * T + 1, 5, 13)));
          ctx.fillStyle = `rgba(255,224,138,${0.5 + 0.3 * Math.sin(t * 3)})`;
          ctx.font = "bold 12px monospace";
          ctx.textAlign = "center";
          if (!S.solved) ctx.fillText("?", sx * T + 16, sy * T - 12);
        },
      });
    }
    for (const b of flyers || [])
      list.push({
        y: b.ry,
        draw: () => {
          for (const [x, y, l] of b.trail) ((ctx.fillStyle = `rgba(239,226,192,${l / 4 * 0.5})`), ctx.fillRect(x * T + 12, y * T + 14, 8, 6));
          const X = b.rx * T,
            Y = b.ry * T - 6 + Math.sin(t * 6 + b.x) * 3;
          const flap = Math.abs(Math.sin(t * 10)) * 8;
          ctx.fillStyle = b.c;
          ctx.fillRect(X + 16 - 2 - (12 - flap), Y + 10, 12 - flap, 14);
          ctx.fillRect(X + 16 + 2, Y + 10, 12 - flap, 14);
          ctx.fillStyle = "#efe2c0";
          ctx.fillRect(X + 14, Y + 10, 4, 14);
          ctx.fillStyle = "#1a1028";
          ctx.fillRect(X + 10, Y + 14, 2, 2);
          ctx.fillRect(X + 20, Y + 14, 2, 2);
        },
      });
  };
})();
