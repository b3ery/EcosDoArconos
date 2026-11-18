/**
 * ECOS DO ARCANO — festa-das-lanternas.js
 * A Noite das Mil Lanternas, no Reino de Solmar (a cidade da praia).
 * Inspirada nas festas de lanternas de verdade: na lua cheia, o povo solta
 * lanternas de papel no céu (dizem que elas levam embora os males de quem
 * solta) e põe lanterninhas de flor na água, para agradecer ao mar.
 *  - Acontece a cada 5 dias, só à NOITE (das 19h30 até de madrugada). O jornal e os
 *    mensageiros avisam alguns dias antes (a viagem até lá leva dias!).
 *  - Na areia, a Vendedora de Lanternas vende lanterna do céu (5 ouro) e
 *    lanterna de flor (3 ouro).
 *  - Na ponta do píer largo: aquecer e soltar a lanterna (gesto) e fazer um
 *    pedido. Na beira d'água: pousar a lanterninha devagar.
 *  - No píer da esquerda, o barqueiro leva você (e quem estiver no encontro)
 *    para remar entre as lanternas.
 *  - O céu e o mar se enchem de centenas de lanternas brilhando por cima da
 *    noite, e varais de lanternas enfeitam a praça o dia todo.
 * Modifica (envolve) funções de outros arquivos: targetAt, interactAt,
 * walkable, crewDrawList, drawBrawlScene, onNewDay.
 */

"use strict";

(() => {
  const ZID = "solmar";
  const fest = () => player && player.day % 5 === 0;
  const night = () => fest() && (currentHour() >= 19.5 || currentHour() < 3);
  window.lanternFestToday = fest;
  window.lanternFestNight = night;
  const inv = () => (player.lant = player.lant || { ceu: 0, agua: 0, wish: null });
  const SELL = [24, 22];
  const SPOTS = {
    "24,22": "vender",
    "27,28": "soltar",
    "28,28": "soltar",
    "12,28": "barco",
  };
  const shoreSpot = (x, y) => y === 23 && x > 1 && x < 54 && ZONES[ZID].map[24][x] === "~";
  function kindAt(x, y) {
    if (player.zone !== ZID) return null;
    const k = SPOTS[x + "," + y];
    if (k) return k;
    if (shoreSpot(x, y) && fest()) return "agua";
    return null;
  }
  const LABEL = {
    vender: () => "Falar com a Vendedora de Lanternas",
    soltar: () => (night() ? `Soltar uma lanterna no céu (${inv().ceu} na bolsa)` : "Ponta do píer (a festa é à noite)"),
    agua: () => (night() ? `Pôr uma lanterna de flor na água (${inv().agua})` : null),
    barco: () => `Barqueiro: remar entre as lanternas (10 ouro)`,
  };
  const spend = (g) => (player.gold < g ? (toast(`Precisa de ${g} de ouro.`, 1800), false) : ((player.gold -= g), true));
  // quem está com você: encontro marcado em Solmar ou par
  const company = () => (game.dateIn && game.dateIn.id) || player.spouse || player.dating || null;

  function wish(after) {
    choice("Faça um pedido", "A sua lanterna sobe e some entre as outras. O que você pede?", [
      { t: "Amor", icon: "heart", fn: () => ((inv().wish = "amor"), after("Que o amor encontre o caminho até você.")) },
      { t: "Saúde", icon: "herb", fn: () => ((inv().wish = "saude"), player.hp != null && (player.hp = maxHp()), after("Que os males fiquem lá em cima, com a lanterna.")) },
      { t: "Fortuna", icon: "coin", fn: () => ((inv().wish = "ouro"), after("Que a bolsa nunca fique vazia.")) },
      { t: "Paz entre os reinos", icon: "flag", fn: () => ((inv().wish = "paz"), typeof worldState === "function" && Object.keys(worldState().rel).forEach((k) => (worldState().rel[k] = Math.min(100, worldState().rel[k] + 2))), after("Os sinos de Solmar tocam ao longe.")) },
    ]);
  }
  function act(k) {
    const I = inv();
    if (k === "vender") {
      const opts = [
        { t: "Lanterna do céu (5 ouro)", icon: "sun", fn: () => spend(5) && (I.ceu++, toast("Uma lanterna de papel de arroz, dobradinha. Abra no píer!", 3000)) },
        { t: "Lanterna de flor para a água (3 ouro)", icon: "flower", fn: () => spend(3) && (I.agua++, toast("Uma lanterninha de folha com uma vela. Ponha na beira d'água!", 3000)) },
        { t: "Perguntar sobre a festa", icon: "chat", fn: () => say([["Vendedora Iara", fest() ? "É hoje, meu bem! Quando a noite fechar, lá pelas sete e meia, todo mundo solta a sua lá no píer largo. Dizem que ela leva embora o que pesa no peito." : `A Noite das Mil Lanternas é na lua cheia, a cada 5 dias. Faltam ${5 - (player.day % 5)} dia(s).`]]) },
        { t: "Até logo", fn: null },
      ];
      return choice("Vendedora de Lanternas", "Uma banca cheia de lanternas de papel e flores de folha.", opts);
    }
    if (k === "soltar") {
      if (!night()) return say([["", fest() ? "Ainda está claro. A festa começa quando a noite fecha (19h30). Volte quando escurecer!" : "Nenhuma lanterna hoje. A festa é na lua cheia, a cada 5 dias."]]);
      if (!I.ceu) return say([["", "Você não tem lanterna. A Vendedora de Lanternas fica na areia, perto do píer."]]);
      I.ceu--;
      return festGame("lanterna", (q) =>
        q < 0.3
          ? say([["", "A lanterna não subiu direito e caiu no mar. O barqueiro ri: — Na próxima, mais paciência!"]])
          : wish((msg) => {
              const c = company();
              if (typeof needAdd === "function") needAdd("fun", 25);
              if (typeof repAdd === "function") repAdd(1);
              if (c && NPCS[c]) addFriendship(c, 8);
              game.lantMine = { t: performance.now() };
              say([["", msg], ...(c && NPCS[c] ? [[shortName(c), pk(["Você pediu o quê? ...Não, não conta. Senão não vale.", "Olha a nossa lá no meio das outras!", "Eu pedi a mesma coisa. Tenho certeza."])]] : [])]);
            }),
      );
    }
    if (k === "agua") {
      if (!I.agua) return say([["", "Você precisa de uma lanterna de flor. A Vendedora de Lanternas tem."]]);
      I.agua--;
      return festGame("lanternaAgua", (q) => {
        if (q >= 0.5) (typeof needAdd === "function" && needAdd("fun", 12), (game.lantWater = (game.lantWater || 0) + 1));
        say([["", q >= 0.5 ? "A lanterninha vai embora com a maré, se juntando a centenas de outras no mar." : "Ela virou. Uma criança te empresta a dela: — Tenta de novo depois!"]]);
      });
    }
    if (k === "barco") {
      if (!night()) return say([["Barqueiro Tito", "De dia eu só pesco. Volte na Noite das Mil Lanternas!"]]);
      if (!spend(10)) return;
      const c = company();
      return playCine(boatScene(c), 7, () => {
        if (typeof needAdd === "function") needAdd("fun", 30);
        if (c && NPCS[c]) addFriendship(c, 12);
        say([["", c && NPCS[c] ? `Vocês remam devagar entre as lanternas. ${shortName(c)} encosta a cabeça no seu ombro e ninguém fala nada por um bom tempo.` : "Você rema sozinho entre as lanternas. O mar inteiro brilha. É impossível ficar triste aqui."]]);
      });
    }
  }

  /* ----- a cena do barco ----- */
  function boatScene(c) {
    const N = c && NPCS[c];
    return (W, H, t) => {
      const sky = ctx.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0, "#0e1030");
      sky.addColorStop(1, "#3a2850");
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "#f2eee0";
      ctx.beginPath();
      ctx.arc(W * 0.8, 70, 26, 0, 7);
      ctx.fill();
      const sea = H * 0.62;
      ctx.fillStyle = "#14223e";
      ctx.fillRect(0, sea, W, H - sea);
      for (let i = 0; i < 120; i++) {
        const sp = 8 + (i % 7) * 3,
          x = (i * 83 + Math.sin(t * 0.6 + i) * 10) % W,
          y = sea - ((t * sp + i * 29) % sea);
        lantern(x, y, y < sea * 0.4 ? 1 : i % 4 === 0 ? 3 : 2, 0.4 + (y / sea) * 0.5);
      }
      for (let i = 0; i < 40; i++) {
        const x = (i * 61 + t * 6) % W,
          y = sea + 14 + (i % 6) * 18;
        lantern(x, y, 2 + (i % 2), 0.7, true);
      }
      // o barquinho apoiado na água
      const bx = W / 2 - 80,
        by = sea + 40 + Math.sin(t * 1.5) * 3;
      ctx.fillStyle = "#5a3a1e";
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.lineTo(bx + 160, by);
      ctx.lineTo(bx + 140, by + 26);
      ctx.lineTo(bx + 20, by + 26);
      ctx.fill();
      ctx.fillStyle = "#8a5a2e";
      ctx.fillRect(bx, by - 4, 160, 6);
      drawSprite(heroRects(player.look, "right", null), bx + 30, by - 58, 3.4, false);
      if (N) drawSprite(wizardRects(N.robe, N.hat ?? null, N.hair, null, "left", 0), bx + 86, by - 58, 3.4, true);
      ctx.textAlign = "center";
      ctx.font = '700 26px "Pixelify Sans", sans-serif';
      ctx.fillStyle = "#ffe8b0";
      ctx.fillText("A Noite das Mil Lanternas", W / 2, 50);
    };
  }
  /** uma lanterna de papel com brilho (coordenadas já na tela) */
  // Lanternas em pixel art, desenhadas uma vez em canvas pequenos e copiadas
  // sem suavizar: papel com 3 tons, boca aberta com a chama e um brilho curto.
  const SKY = [".ooooo.", "ooOOOoo", "oOyyyOo", "oOyyyOo", "Oyy*yyO", "Oy***yO", ".y***y.", "..y*y..", "..rrr..", "...f..."];
  const LOTUS = ["...F...", "...f...", ".p.c.p.", "pPpPpPp", "PPPPPPP", ".ggggg."];
  const PAL = { o: "#b8502a", O: "#e07a36", y: "#f6b04a", "*": "#ffe6a0", r: "#6b3418", f: "#fff3c0", F: "#ffa040", c: "#f2eecf", p: "#f2a8c8", P: "#ffd0e0", g: "#3a7a3a" };
  const SPR = {};
  function sprite(rows, key) {
    if (SPR[key]) return SPR[key];
    const cv = document.createElement("canvas");
    cv.width = rows[0].length;
    cv.height = rows.length;
    const g = cv.getContext("2d");
    rows.forEach((r, y) => [...r].forEach((ch, x) => PAL[ch] && ((g.fillStyle = PAL[ch]), g.fillRect(x, y, 1, 1))));
    return (SPR[key] = cv);
  }
  let GLOW = null;
  function glowSprite() {
    if (GLOW) return GLOW;
    GLOW = document.createElement("canvas");
    GLOW.width = GLOW.height = 32;
    const g = GLOW.getContext("2d");
    const gl = g.createRadialGradient(16, 18, 1, 16, 16, 16);
    gl.addColorStop(0, "rgba(255,190,90,.55)");
    gl.addColorStop(0.45, "rgba(255,150,60,.18)");
    gl.addColorStop(1, "rgba(255,150,60,0)");
    g.fillStyle = gl;
    g.fillRect(0, 0, 32, 32);
    return GLOW;
  }
  /** s = escala inteira do pixel (1 longe, 2 perto, 3 bem perto); a = brilho */
  function lantern(x, y, s, a, water) {
    s = Math.max(1, Math.round(s));
    const sp = water ? sprite(LOTUS, "lotus") : sprite(SKY, "sky");
    const w = sp.width * s,
      h = sp.height * s;
    const X = Math.round(x - w / 2),
      Y = Math.round(y - h / 2);
    const fl = 0.85 + 0.15 * Math.sin(performance.now() / 140 + x);
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = a * fl * 0.8;
    const gs = w * 2.4;
    ctx.drawImage(glowSprite(), Math.round(x - gs / 2), Math.round(Y + h * (water ? 0.1 : 0.55) - gs / 2), gs, gs);
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = Math.min(1, a + 0.25);
    const sm = ctx.imageSmoothingEnabled;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(sp, X, Y, w, h);
    ctx.imageSmoothingEnabled = sm;
    ctx.globalAlpha = 1;
    if (water) {
      // reflexo tremido na água
      ctx.fillStyle = `rgba(255,170,70,${0.45 * a})`;
      for (let i = 1; i <= 3; i++) ctx.fillRect(X + s * (1 + (i % 2)), Y + h + i * 2 * s, w - s * 2 * (1 + (i % 2)), s);
    }
  }

  /* ----- ligações no mundo ----- */
  const tgBase = targetAt;
  targetAt = function (x, y) {
    const k = kindAt(x, y);
    if (k) {
      const l = LABEL[k]();
      if (l) return l;
    }
    return tgBase(x, y);
  };
  const iaBase = interactAt;
  interactAt = function (x, y) {
    const k = kindAt(x, y);
    if (k && LABEL[k]()) return act(k);
    return iaBase(x, y);
  };
  const wkBase = walkable;
  walkable = function (z, x, y) {
    if (z === ZID && x === SELL[0] && y === SELL[1]) return false;
    return wkBase(z, x, y);
  };
  const cdBase = crewDrawList;
  crewDrawList = function (list, t) {
    cdBase(list, t);
    if (player.zone !== ZID) return;
    const T = TILE;
    const R = (x, y, w, h, c) => ((ctx.fillStyle = c), ctx.fillRect(x, y, w, h));
    // banca e vendedora, apoiadas na areia
    list.push({
      y: SELL[1],
      draw: () => {
        const X = SELL[0] * T,
          Y = SELL[1] * T;
        R(X - 20, Y + 26, 72, 5, "rgba(0,0,0,.2)");
        drawSprite(wizardRects("#c94a5a", null, "#2a1a10", null, "down", 0), X, Y - 16, 2, false);
        R(X - 18, Y + 14, 68, 14, "#8a5a2e");
        R(X - 18, Y + 14, 68, 3, "#a8784a");
        R(X - 16, Y + 28, 4, 4, "#5a3a1e");
        R(X + 44, Y + 28, 4, 4, "#5a3a1e");
        for (let i = 0; i < 6; i++) (R(X - 14 + i * 11, Y + 4, 7, 10, ["#ffb04a", "#ffd07a", "#f2a8c8"][i % 3]), R(X - 12 + i * 11, Y + 2, 3, 2, "#5a3a1e"));
      },
    });
    // varais de lanternas na praça, presos em postes de madeira
    if (night())
      list.push({
        y: 9.5,
        draw: () => {
          for (const [x0, x1, y] of [[16, 39, 10], [16, 39, 14]]) {
            R(x0 * T + 14, y * T - 34, 4, 40, "#5a3a1e");
            R(x1 * T + 14, y * T - 34, 4, 40, "#5a3a1e");
            ctx.strokeStyle = "#3a2414";
            ctx.lineWidth = 1;
            ctx.beginPath();
            const A = x0 * T + 16,
              B = x1 * T + 16,
              yy = y * T - 32;
            ctx.moveTo(A, yy);
            ctx.quadraticCurveTo((A + B) / 2, yy + 24, B, yy);
            ctx.stroke();
            for (let i = 1; i < 20; i++) {
              const u = i / 20,
                lx = A + (B - A) * u,
                ly = yy + 4 * 24 * u * (1 - u) * 0.5 * 2;
              R(lx - 1, ly, 1, 3, "#3a2414");
              R(lx - 4, ly + 3, 8, 9, ["#ffb04a", "#f2a8c8", "#ffd07a", "#e86a5a"][i % 4]);
              R(lx - 4, ly + 3, 8, 1, "#8a5a2e");
            }
          }
        },
      });
  };
  // o céu de lanternas brilha por cima da escuridão da noite
  const dbBase = drawBrawlScene;
  drawBrawlScene = function (t) {
    const r = dbBase.apply(this, arguments);
    if (player.zone !== ZID || !night() || !game.cam || game.mode === "map") return r;
    const { camX, camY, Z } = game.cam;
    const T = TILE;
    // noite fechada: céu escuro de verdade para as lanternas brilharem
    ctx.fillStyle = "rgba(6,8,30,.5)";
    ctx.fillRect(0, 0, viewWidth, 480);
    ctx.save();
    const sx = (wx) => (wx - camX) * Z,
      sy = (wy) => (wy - camY) * Z;
    const n = 120;
    for (let i = 0; i < n; i++) {
      const sp = 0.012 + (i % 7) * 0.004;
      const ph = (t * sp + i * 0.137) % 1;
      const wx = (2 + ((i * 37) % 52)) * T + Math.sin(t * 0.5 + i) * 14;
      const wy = 23 * T - ph * 30 * T;
      const X = sx(wx),
        Y = sy(wy);
      if (X < -20 || Y < -20 || X > viewWidth + 20 || Y > 500) continue;
      lantern(X, Y, Z * (ph > 0.55 ? 1 : i % 5 === 0 ? 3 : 2), Math.max(0.2, 0.95 - ph * 0.7));
    }
    // lanterninhas no mar
    const many = 40 + (game.lantWater || 0) * 3;
    for (let i = 0; i < many; i++) {
      const wx = ((i * 71 + t * 9) % (54 * T)) + T,
        wy = (24.4 + (i % 5) * 0.9) * T + Math.sin(t * 2 + i) * 2;
      const X = sx(wx),
        Y = sy(wy);
      if (X < -20 || Y < -20 || X > viewWidth + 20 || Y > 500) continue;
      lantern(X, Y, Z * 2, 0.7, true);
    }
    // a sua lanterna, mais perto, subindo do píer
    if (game.lantMine) {
      const e = (performance.now() - game.lantMine.t) / 1000;
      if (e < 30) lantern(sx(27.5 * T + Math.sin(e) * 10), sy(27 * T - e * 22), Z * (e < 8 ? 4 : 3), 1);
      else game.lantMine = null;
    }
    ctx.restore();
    return r;
  };
  // avisos: a festa é longe, o povo avisa antes
  if (typeof onNewDay === "function") {
    const ndBase = onNewDay;
    onNewDay = function () {
      const r = ndBase.apply(this, arguments);
      if (!lifeMode()) return r;
      const left = (5 - (player.day % 5)) % 5;
      if (player.zone !== ZID && left > 0 && left <= 3) setTimeout(() => toast(`Mensageiro: a Noite das Mil Lanternas em Solmar é daqui a ${left} dia(s). A viagem de carruagem leva ${typeof travelDays === "function" ? travelDays(player.zone, ZID) : 3}.`, 5200), 3500);
      if (player.zone === ZID && left === 0) setTimeout(() => toast("Hoje é a Noite das Mil Lanternas! Compre sua lanterna na areia de dia e volte ao píer quando a noite fechar (19h30).", 5200), 3500);
      return r;
    };
  }
})();
