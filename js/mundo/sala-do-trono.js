/**
 * ECOS DO ARCANO — sala-do-trono.js
 * O salão do trono dos castelos (Cinzaluz, Palácio das Marés e Fortaleza de
 * Pedravale), inspirado nos grandes salões góticos:
 *  - trono dourado de espaldar alto num estrado de mármore com degraus, sob um
 *    dossel de veludo com o brasão do reino;
 *  - quem governa aparece SENTAD(O) NO TRONO, DE FRENTE para quem entra
 *    (a Rainha, o governante do reino, o usurpador... ou ninguém, com o trono
 *    vago coberto de pano preto se a Rainha morreu);
 *  - dois guardas reais com alabardas ao lado do estrado;
 *  - fileiras de colunas de pedra ao longo do tapete vermelho;
 *  - vitrais coloridos na parede (com a luz colorida no chão), tapeçarias e
 *    lustres de velas pendurados que tremeluzem.
 * Cada castelo com as suas cores: vinho e ouro (Aurélia), turquesa e branco
 * (Marés), ferro e vermelho-escuro (Pedravale).
 * Modifica (envolve) funções de outros arquivos: genInterior, drawTile,
 * walkable, targetAt, update, crewDrawList.
 */

"use strict";

(() => {
  const SEATS = { castle: 1, palacio: 1, fortaleza: 1 };
  const PAL = {
    castle: { vel: "#7a1e3a", velD: "#4e1024", gold: "#e8b84a", goldD: "#a87a22", stone: "#bdb6aa", stoneD: "#8a8478", glass: ["#c93a3a", "#3a6ac9", "#e8b84a", "#3a9a5a"], arms: "#e8b84a" },
    palacio: { vel: "#1e6a7a", velD: "#0e3e4a", gold: "#f2d27a", goldD: "#b0903a", stone: "#e4e0d6", stoneD: "#b4b0a4", glass: ["#2ab0c9", "#ffffff", "#3a7ac9", "#7ad0c0"], arms: "#ffffff" },
    fortaleza: { vel: "#5a1a14", velD: "#341008", gold: "#c9a050", goldD: "#8a6a2a", stone: "#6a6460", stoneD: "#4a4440", glass: ["#c95a2a", "#e8b84a", "#8a2a2a", "#5a8a9a"], arms: "#c9a050" },
  };
  const I = () => (player.zone === "interior" && game.inter && game.inter.throne ? game.inter : null);
  const pal = () => PAL[game.inter.st] || PAL.castle;

  /* ----- quem está no trono ----- */
  function who(st) {
    if (!lifeMode() && st === "castle") return { kind: "ruler", n: "Rainha Aurélia", robe: "#8a2a5a", hair: "#d9a441" };
    if (st === "castle") {
      if (typeof rulesK === "function" && rulesK("aurelia")) return { kind: "me" };
      if (player.usurper && !player.council) return { kind: "ruler", n: player.usurper, robe: "#3a2a4a", hair: "#2a1a10" };
      if (typeof isDead === "function" && isDead("rainha")) return { kind: "empty", mourn: true };
      return { kind: "ruler", n: "Rainha Aurélia", robe: "#8a2a5a", hair: "#d9a441" };
    }
    const R = REALM_SEATS[st];
    if (typeof rulesK === "function" && rulesK(R.k)) return { kind: "me" };
    if (typeof isDead === "function" && isDead(R.k === "mares" ? "tarso" : "durgan")) return { kind: "empty", mourn: true };
    const kp = KEEPERS[st];
    return { kind: "ruler", n: R.ruler, robe: kp[1], hair: kp[2] };
  }

  /* ----- monta o salão ----- */
  const genBase = genInterior;
  genInterior = function (b) {
    const z = genBase.apply(this, arguments);
    const G = game.inter;
    if (!G || !SEATS[G.st]) return z;
    const w = z.w,
      cx = Math.floor(w / 2);
    G.throne = true;
    G.kx = cx - 1;
    G.ky = 2;
    G.kx0 = G.kx;
    G.tx = cx - 0.5; // centro do trono (no meio do tapete)
    // tira o que é de loja (barril, caixote) e põe o salão no lugar
    G.props = G.props.filter(([id, x, y]) => !["barrel", "crate", "candle", "fire"].includes(id) && !(id === "plant" && y === 2));
    G.cols = [];
    for (const y of [5, 8]) for (const x of [cx - 4, cx + 3]) G.cols.push([x, y]);
    G.guards = [
      [cx - 3, 3],
      [cx + 2, 3],
    ];
    // estrado de 3 blocos, centrado no tapete (o 3º bloco também não deixa passar)
    const block = new Set([...G.cols, ...G.guards, [cx - 2, 3]].map(([x, y]) => x + "," + y));
    G.block = block;
    G.props = G.props.filter(([id, x, y]) => !block.has(x + "," + y));
    G.people = (G.people || []).filter((p) => !block.has(Math.round(p.x) + "," + Math.round(p.y)));
    G.wins = [3, 5, w - 6, w - 4];
    G.who = who(G.st);
    if (G.who.kind === "ruler") ((G.keeper = G.who.n), (G.kc = G.who.robe), (G.kh = G.who.hair));
    else G.keeper = G.who.kind === "me" ? "Mordomo Real" : "Mordomo Real";
    return z;
  };

  /* ----- colunas e guardas não deixam passar ----- */
  const wkBase = walkable;
  walkable = function (z, x, y) {
    const G = z === "interior" && I();
    if (G && G.block && G.block.has(x + "," + y)) return false;
    return wkBase.apply(this, arguments);
  };
  // o governante fica sentado (sem andar atrás do balcão)
  const upBase = update;
  update = function (dt) {
    upBase(dt);
    const G = I();
    if (G) ((G.kx = G.kx0), (G.ky = 2));
  };
  const tgBase = targetAt;
  targetAt = function (x, y) {
    const G = I();
    if (G && (tileAt("interior", x, y) === "Q" || (x === G.kx && y === G.ky))) {
      const k = G.who.kind;
      if (k === "me") return "Sentar no trono e governar";
      if (k === "empty") return G.who.mourn ? "Trono vago (luto)" : "Trono vago";
    }
    if (G && G.guards.some(([gx, gy]) => gx === x && gy === y)) return "Falar com o Guarda Real";
    return tgBase.apply(this, arguments);
  };
  const iaBase = interactAt;
  interactAt = function (x, y) {
    const G = I();
    if (G && G.guards.some(([gx, gy]) => gx === x && gy === y)) {
      const k = G.who.kind;
      return say([["Guarda Real", k === "me" ? pk(["Às suas ordens, Majestade!", "Nenhum traidor passa por esta alabarda, Majestade.", "*bate a alabarda no chão e fica em posição de sentido*"]) : k === "empty" ? "O trono está de luto. Ninguém se senta nele sem a bênção da corte." : pk(["Mantenha distância do trono, cidadão.", "Sem armas no salão. Regra antiga.", "*olha fixo para frente e não responde*"])]]);
    }
    return iaBase.apply(this, arguments);
  };

  /* ----- o estrado de mármore no lugar do balcão ----- */
  const dtBase = drawTile;
  drawTile = function (z, x, y, c, t) {
    if (z === "interior" && c === "Q" && I()) return dtBase.call(this, z, x, y, ".", t);
    return dtBase.apply(this, arguments);
  };
  function drawDais(G) {
    const P = pal(),
      CX = G.tx * TILE,
      X0 = CX - 48,
      Y = 3 * TILE;
    const R = (x, y, w, h, c) => ((ctx.fillStyle = c), ctx.fillRect(Math.round(x), Math.round(y), w, h));
    R(X0 - 6, Y - 22, 108, 24, P.stoneD); // plataforma atrás do trono
    R(X0 - 6, Y - 22, 108, 3, "#f4f0e8");
    for (let k = 0; k < 3; k++) {
      // três degraus, cada um um pouco mais largo
      const w = 96 + k * 8,
        x = CX - w / 2,
        y = Y + k * 10;
      R(x, y, w, 10, k % 2 ? P.stone : "#e8e2d6");
      R(x, y, w, 2, "#fbf8f0");
      R(x, y + 9, w, 1, P.stoneD);
    }
    R(CX - 14, Y - 22, 28, 52, P.gold); // tapete subindo os degraus
    R(CX - 12, Y - 22, 24, 52, P.vel);
    R(CX - 12, Y - 22, 24, 2, P.velD);
  }

  /* ----- desenhos ----- */
  function drawThrone(G, t) {
    const P = pal(),
      cX = G.tx * TILE,
      top = 0.2 * TILE,
      Y = G.ky * TILE;
    const R = (x, y, w, h, c) => ((ctx.fillStyle = c), ctx.fillRect(Math.round(x), Math.round(y), w, h));
    // dossel de veludo com cortinas
    R(cX - 52, top - 4, 104, 10, P.gold);
    R(cX - 50, top + 6, 100, 8, P.vel);
    for (let k = 0; k < 9; k++) R(cX - 48 + k * 11, top + 14, 6, 4 + (k % 2) * 2, P.gold);
    for (const s of [-1, 1]) {
      ctx.fillStyle = P.vel;
      fillPolygon(cX + s * 50, top + 6, cX + s * 36, top + 6, cX + s * 44, Y + 22, cX + s * 52, Y + 22);
      ctx.fillStyle = P.velD;
      fillPolygon(cX + s * 50, top + 6, cX + s * 46, top + 6, cX + s * 50, Y + 22, cX + s * 52, Y + 22);
      R(cX + s * 46 - 3, Y - 4, 6, 4, P.gold); // cordão
    }
    // espaldar alto dourado com ponta
    ctx.fillStyle = P.goldD;
    fillPolygon(cX - 22, Y + 18, cX - 22, Y - 22, cX - 10, Y - 36, cX, Y - 44, cX + 10, Y - 36, cX + 22, Y - 22, cX + 22, Y + 18);
    ctx.fillStyle = P.gold;
    fillPolygon(cX - 19, Y + 16, cX - 19, Y - 20, cX - 9, Y - 32, cX, Y - 39, cX + 9, Y - 32, cX + 19, Y - 20, cX + 19, Y + 16);
    ctx.fillStyle = P.vel;
    fillPolygon(cX - 14, Y + 14, cX - 14, Y - 16, cX, Y - 30, cX + 14, Y - 16, cX + 14, Y + 14);
    // brasão no espaldar
    R(cX - 6, Y - 22, 12, 12, P.arms);
    ctx.fillStyle = P.arms;
    fillPolygon(cX - 6, Y - 10, cX + 6, Y - 10, cX, Y - 4);
    R(cX - 2, Y - 20, 4, 9, P.vel);
    R(cX - 5, Y - 17, 10, 3, P.vel);
    // pedras preciosas no topo
    R(cX - 2, Y - 42, 4, 4, "#e0303a");
    R(cX - 21, Y - 24, 3, 3, "#3ab0e0");
    R(cX + 18, Y - 24, 3, 3, "#3ab0e0");
    // assento
    R(cX - 20, Y + 16, 40, 8, P.vel);
    R(cX - 20, Y + 15, 40, 2, P.gold);
  }
  function drawThroneFront(G, t) {
    // braços do trono (na frente de quem senta) e pés
    const P = pal(),
      cX = G.tx * TILE,
      Y = G.ky * TILE;
    const R = (x, y, w, h, c) => ((ctx.fillStyle = c), ctx.fillRect(Math.round(x), Math.round(y), w, h));
    for (const s of [-1, 1]) {
      R(cX + s * 22 - (s < 0 ? 0 : 6), Y + 8, 6, 22, P.goldD);
      R(cX + s * 22 - (s < 0 ? -1 : 5), Y + 8, 4, 20, P.gold);
      R(cX + s * 22 - (s < 0 ? 1 : 7), Y + 5, 8, 5, P.gold);
      R(cX + s * 22 - (s < 0 ? 0 : 6), Y + 4, 6, 2, "#fff3c0");
    }
    R(cX - 20, Y + 26, 40, 4, P.goldD);
    if (G.who.kind === "empty" && G.who.mourn) {
      // pano preto de luto
      ctx.fillStyle = "rgba(14,12,16,.92)";
      fillPolygon(cX - 18, Y - 26, cX + 18, Y - 26, cX + 22, Y + 28, cX - 22, Y + 28);
      ctx.fillStyle = "rgba(70,60,80,.6)";
      for (let k = 0; k < 4; k++) ctx.fillRect(cX - 14 + k * 9, Y - 22, 1, 48);
      // vela acesa ao pé do trono
      R(cX - 30, Y + 18, 4, 10, "#efe6d0");
      R(cX - 29, Y + 14 - Math.abs(Math.sin(t * 9)) * 2, 2, 4, "#ffb030");
    }
  }
  function drawRuler(G, t) {
    const W = G.who;
    if (W.kind !== "ruler") return;
    const X = G.tx * TILE - 16,
      Y = G.ky * TILE - 6 + Math.sin(t * 1.5) * 0.4;
    // sentad(o): de frente, um pouco mais baixo no assento
    drawSprite(wizardRects(W.robe, null, W.hair, null, "down"), X, Y, 2, false);
    // coroa
    ctx.fillStyle = "#f2c14e";
    ctx.fillRect(X + 10, Y + 2, 12, 4);
    ctx.fillRect(X + 10, Y, 2, 3);
    ctx.fillRect(X + 15, Y - 1, 2, 3);
    ctx.fillRect(X + 20, Y, 2, 3);
    ctx.fillStyle = "#e0303a";
    ctx.fillRect(X + 15, Y + 3, 2, 2);
    // cetro na mão
    ctx.fillStyle = pal().gold;
    ctx.fillRect(X + 27, Y + 6, 2, 20);
    ctx.fillStyle = "#3ab0e0";
    ctx.fillRect(X + 26, Y + 3, 4, 4);
  }
  function drawGuard(x, y, t) {
    const X = x * TILE,
      Y = y * TILE;
    ctx.fillStyle = "rgba(0,0,0,.25)";
    ctx.beginPath();
    ctx.ellipse(X + 16, Y + 30, 9, 3, 0, 0, 7);
    ctx.fill();
    const P = pal();
    drawSprite(wizardRects(P.vel, "#8a8a96", "#3a2414", null, "down"), X, Y, 2, x > game.inter.tx);
    // capacete de ferro e alabarda
    ctx.fillStyle = "#9a9aa6";
    ctx.fillRect(X + 9, Y + 1, 14, 5);
    ctx.fillStyle = "#c9c9d2";
    ctx.fillRect(X + 15, Y - 3, 2, 5);
    const hx = x > game.inter.tx ? X + 2 : X + 28;
    ctx.fillStyle = "#5a3a22";
    ctx.fillRect(hx, Y - 18, 2, 48);
    ctx.fillStyle = "#c9c9d2";
    fillPolygon(hx - 4, Y - 18, hx + 6, Y - 18, hx + 1, Y - 28);
    ctx.fillRect(hx - 6, Y - 14, 14, 3);
    ctx.fillStyle = P.vel;
    ctx.fillRect(X + 10, Y + 14, 12, 8); // tabardo com brasão
    ctx.fillStyle = P.arms;
    ctx.fillRect(X + 14, Y + 16, 4, 4);
  }
  function drawColumn(x, y) {
    const P = pal(),
      X = x * TILE,
      Y = y * TILE;
    const R = (a, b, w, h, c) => ((ctx.fillStyle = c), ctx.fillRect(X + a, Y + b, w, h));
    ctx.fillStyle = "rgba(0,0,0,.22)";
    ctx.beginPath();
    ctx.ellipse(X + 18, Y + 29, 14, 4, 0, 0, 7);
    ctx.fill();
    R(4, 22, 24, 9, P.stoneD); // base
    R(5, 21, 22, 3, P.stone);
    R(8, -50, 16, 72, P.stone); // fuste
    R(8, -50, 4, 72, "#ffffff22");
    R(20, -50, 4, 72, P.stoneD);
    for (let k = 0; k < 3; k++) R(13 + k * 3, -48, 1, 68, "rgba(0,0,0,.12)");
    R(4, -58, 24, 9, P.stone); // capitel
    R(4, -50, 24, 2, P.stoneD);
    R(6, -62, 20, 4, P.stoneD);
    R(9, -40, 14, 3, P.gold); // anel dourado
  }
  function drawWindow(x, t) {
    const P = pal(),
      X = x * TILE + 6,
      Y = 0.25 * TILE;
    const w = 20,
      h = 46;
    ctx.fillStyle = P.stoneD;
    ctx.fillRect(X - 3, Y + 4, w + 6, h);
    ctx.beginPath();
    ctx.arc(X + w / 2, Y + 6, w / 2 + 3, Math.PI, 0);
    ctx.fill();
    // vitral em losangos coloridos
    ctx.save();
    ctx.beginPath();
    ctx.rect(X, Y + 6, w, h - 6);
    ctx.arc(X + w / 2, Y + 6, w / 2, Math.PI, 0);
    ctx.clip();
    for (let j = -1; j < 7; j++)
      for (let i = 0; i < 3; i++) {
        ctx.fillStyle = P.glass[(i + j + x) & 3];
        ctx.fillRect(X + i * 7, Y + j * 7 + 2, 7, 7);
      }
    ctx.fillStyle = "rgba(255,255,255," + (0.12 + 0.06 * Math.sin(t + x)) + ")";
    ctx.fillRect(X, Y - 4, w, h + 4);
    ctx.strokeStyle = "#2a2420";
    ctx.lineWidth = 1;
    for (let i = 1; i < 3; i++) (ctx.beginPath(), ctx.moveTo(X + i * 7, Y - 4), ctx.lineTo(X + i * 7, Y + h), ctx.stroke());
    for (let j = 0; j < 7; j++) (ctx.beginPath(), ctx.moveTo(X, Y + j * 7 + 2), ctx.lineTo(X + w, Y + j * 7 + 2), ctx.stroke());
    ctx.restore();
  }
  function drawLightPool(x, t) {
    // luz colorida do vitral no chão
    const P = pal(),
      X = x * TILE + 16,
      Y = 4.2 * TILE;
    ctx.save();
    ctx.globalAlpha = 0.14 + 0.03 * Math.sin(t * 0.7 + x);
    for (let k = 0; k < 4; k++) {
      ctx.fillStyle = P.glass[(k + x) & 3];
      ctx.beginPath();
      ctx.ellipse(X - 10 + k * 7, Y + k * 5, 12, 22, 0.3, 0, 7);
      ctx.fill();
    }
    ctx.restore();
  }
  function drawChandelier(cx, y, t) {
    const P = pal(),
      X = cx,
      Y = y * TILE;
    ctx.strokeStyle = "#3a3028";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(X, Y - 60);
    ctx.lineTo(X, Y);
    ctx.stroke();
    ctx.fillStyle = P.goldD;
    ctx.fillRect(X - 26, Y, 52, 4);
    ctx.fillRect(X - 3, Y - 6, 6, 12);
    ctx.fillStyle = P.gold;
    ctx.fillRect(X - 26, Y, 52, 2);
    for (let k = 0; k < 5; k++) {
      const vx = X - 24 + k * 12;
      ctx.fillStyle = "#efe6d0";
      ctx.fillRect(vx, Y - 7, 3, 7);
      const f = Math.abs(Math.sin(t * 8 + k * 1.7));
      ctx.fillStyle = "#ffb030";
      ctx.fillRect(vx, Y - 11 - f, 3, 4);
      ctx.fillStyle = "#fff0a0";
      ctx.fillRect(vx + 1, Y - 10 - f, 1, 2);
    }
    // brilho das velas
    const g = ctx.createRadialGradient(X, Y - 6, 2, X, Y - 6, 60);
    g.addColorStop(0, "rgba(255,200,110,.28)");
    g.addColorStop(1, "rgba(255,200,110,0)");
    ctx.fillStyle = g;
    ctx.fillRect(X - 60, Y - 66, 120, 120);
  }

  const cdBase = crewDrawList;
  crewDrawList = function (list, t) {
    cdBase(list, t);
    const G = I();
    if (!G) return;
    // vitrais e luz no chão (embaixo de tudo)
    list.push({ y: -5, draw: () => (G.wins.forEach((x) => drawWindow(x, t)), G.wins.forEach((x) => drawLightPool(x, t))) });
    list.push({ y: -4, draw: () => drawDais(G) });
    list.push({ y: G.ky - 0.6, draw: () => drawThrone(G, t) });
    list.push({ y: G.ky + 0.01, draw: () => drawRuler(G, t) });
    list.push({ y: G.ky + 0.02, draw: () => drawThroneFront(G, t) });
    for (const [x, y] of G.guards) list.push({ y, draw: () => drawGuard(x, y, t) });
    for (const [x, y] of G.cols) list.push({ y: y + 0.05, draw: () => drawColumn(x, y) });
    // lustres por cima de tudo
    list.push({ y: 999, draw: () => [5.6, 9.2].forEach((y) => drawChandelier(G.tx * TILE, y, t)) });
  };
})();
