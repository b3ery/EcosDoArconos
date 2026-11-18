/**
 * ECOS DO ARCANO — festas-medievais.js
 * Os festivais ganham costumes medievais de verdade:
 *  - Festival das Flores (o Primeiro de Maio): Mastro de Maio com fitas para
 *    dançar em volta e coroação da Rainha (ou Rei) de Maio.
 *  - Festival da Colheita (Lammas): maçã na tina, corrida de sacos e a
 *    oferenda do primeiro pão no Templo.
 *  - Festival das Lanternas (noite de São João): pular a fogueira para ter
 *    sorte e procissão das velas.
 *  - Festival das Runas (Noite de Reis): bolo do Rei da Fava (quem acha a
 *    fava vira o Rei dos Tolos do dia) e a peça dos mascarados.
 *  - Em todos: concurso de arco e flecha, torneio de justa (aposte no
 *    cavaleiro) e o porco ensebado solto na praça.
 *  - A praça fica enfeitada: bandeirolas, o mastro, a fogueira, feixes de
 *    trigo ou máscaras, conforme a festa.
 * Modifica (envolve) funções de outros arquivos: festivalMenu, update,
 * crewDrawList, targetAt, interactAt, walkable.
 */

"use strict";

(() => {
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const kind = () => {
    const f = festivalToday();
    if (!f) return null;
    return /Flores/.test(f.n) ? "flores" : /Colheita/.test(f.n) ? "colheita" : /Lanternas/.test(f.n) ? "lanternas" : "runas";
  };
  const once = (k) => {
    const key = "fm" + player.day + k;
    if (player.famDay[key]) return false;
    player.famDay[key] = 1;
    return true;
  };
  const fun = (v) => typeof addNeed === "function" && lifeMode() && addNeed("fun", v);
  const prize = (gold, msg) => ((player.gold += gold), toast(`${msg} +${gold} ouro`, 2600), playSound(988, 0.12, "sine"));

  /* ----- lugar da festa: perto da fonte da praça ----- */
  function plaza() {
    const z = ZONES.vila;
    for (let y = 0; y < z.h; y++) {
      const x = z.map[y].indexOf("F");
      if (x >= 0) return [x, y];
    }
    return [29, 23];
  }
  const spot = (dx, dy) => {
    const [fx, fy] = plaza();
    const p = typeof freeNear === "function" ? freeNear("vila", fx + dx, fy + dy, 3) : null;
    return p || [fx + dx, fy + dy];
  };
  let DECOR = null;
  const decor = () => (DECOR = DECOR || { pole: spot(5, 1), fire: spot(-5, 1), pig: null });

  /* ----- as atividades ----- */
  function activities() {
    const k = kind(),
      out = [];
    if (k === "flores") {
      out.push({ t: "Dançar em volta do Mastro de Maio", icon: "flower", fn: () => (once("mastro") ? festGame("mastro", (q) => (fun(25), q > 0.6 ? prize(10, "As fitas ficaram trançadas perfeitas!") : toast("As fitas embolaram... mas todo mundo riu.", 2200))) : toast("Você já dançou no mastro hoje.", 1600)) });
      out.push({ t: "Coroação da Rainha (ou Rei) de Maio", icon: "crown", fn: crowning });
    }
    if (k === "colheita") {
      out.push({ t: "Maçã na tina (com a boca!)", icon: "apple", fn: () => (once("maca") ? festGame("maca", (q) => (fun(20), q > 0.6 ? (addItem("maca", 3), toast("Três maçãs! E o rosto encharcado.", 2200)) : toast("Mais água do que maçã...", 1800))) : toast("Você já tentou a tina hoje.", 1600)) });
      out.push({ t: "Corrida de sacos", icon: "bag", fn: () => (once("sacos") ? festGame("sacos", (q) => (fun(20), q >= 1 ? prize(15, "Você venceu a corrida de sacos!") : toast("Chegou em segundo. O moleiro ganhou de novo.", 2200))) : toast("Uma corrida por festa, senão o saco rasga.", 1600)) });
      out.push({
        t: "Oferenda do primeiro pão no Templo",
        icon: "bread",
        fn: () => {
          if (!once("pao")) return toast("Você já fez a oferenda.", 1600);
          const has = itemCount("pao") > 0;
          if (has) removeItem("pao");
          if (typeof repAdd === "function") repAdd(has ? 2 : 1);
          say([["Padre Anselmo", has ? "Um pão do trigo novo! Que a colheita do ano que vem seja farta para todos." : "Sem pão? Tudo bem, filho. A intenção também alimenta."], ["", "Os sinos tocam. O povo agradece a colheita."]]);
        },
      });
    }
    if (k === "lanternas") {
      out.push({ t: "Pular a fogueira de São João", icon: "sun", fn: () => (once("fogueira") ? festGame("fogueira", (q) => (fun(25), q > 0.6 ? (toast("Três saltos! Dizem que dá sorte o ano inteiro.", 2600), (player.flags.sorteSJ = player.day)) : toast("Chamuscou a barra, mas valeu.", 2000))) : toast("Já pulou a fogueira hoje.", 1600)) });
      out.push({ t: "Procissão das velas", icon: "note", fn: () => (once("velas") ? (fun(15), say([["", "Você segue a procissão com uma vela na mão. As lanternas sobem para o céu e todo mundo canta baixinho."], ["", "Uma paz estranha toma conta da vila."]])) : toast("A procissão já passou.", 1600)) });
    }
    if (k === "runas") {
      out.push({ t: "Fatia do Bolo do Rei da Fava (2 ouro)", icon: "cake", fn: beanCake });
      out.push({ t: "Assistir à peça dos mascarados", icon: "laugh", fn: mummers });
    }
    out.push({ t: "Concurso de arco e flecha (3 ouro)", icon: "star", fn: () => (player.gold < 3 ? toast("Precisa de 3 de ouro.", 1600) : ((player.gold -= 3), festGame("arco", (q) => (fun(15), q >= 0.8 ? prize(25, "Na mosca! Você ganhou o concurso!") : q >= 0.4 ? prize(6, "Bons tiros! Prêmio de consolação:") : toast("As flechas foram para o celeiro do vizinho.", 2200))))) });
    out.push({ t: "Torneio de justa (apostar)", icon: "sword", fn: joust });
    out.push({ t: "Soltar o porco ensebado na praça", icon: "paw", fn: releasePig });
    return out;
  }

  function crowning() {
    if (!once("coroa")) return toast("A coroação já aconteceu hoje.", 1600);
    const rep = player.rep ?? 50;
    const win = Math.random() < 0.2 + rep / 150;
    const t = genderWord("Rei", "Rainha", "Monarca");
    if (win) {
      player.flags.mayCrown = player.day;
      fun(30);
      if (typeof repAdd === "function") repAdd(3);
      say([["Organizadora", `Pelo voto da vila... ${player.name} é ${t} de Maio!`], ["", "Colocam uma coroa de flores na sua cabeça. Até o fim do dia, todo mundo te chama de Majestade."]]);
    } else say([["Organizadora", `${pick(WALKER_NAMES)} é a Rainha de Maio deste ano!`], ["", "Você aplaude. Ano que vem, quem sabe."]]);
  }
  function beanCake() {
    if (player.gold < 2) return toast("Precisa de 2 de ouro.", 1600);
    if (!once("fava")) return toast("Uma fatia por pessoa!", 1600);
    player.gold -= 2;
    fun(10);
    if (Math.random() < 0.25) {
      player.flags.beanKing = player.day;
      fun(25);
      if (ITEMS.hidromel) addItem("hidromel", 1);
      say([["", "Crec! Tem algo duro na sua fatia... É A FAVA!"], ["Organizadora", `Salve o Rei dos Tolos! Hoje ${player.name} manda na festa!`], ["", "Todo mundo levanta a caneca para você. O taberneiro manda uma rodada de hidromel por conta da casa!"]]);
    } else say([["", "Só bolo. Gostoso, mas sem fava."], ["", `${pick(WALKER_NAMES)} achou a fava e já está mandando todo mundo dançar.`]]);
  }
  function mummers() {
    if (!once("peca")) return toast("A peça já acabou por hoje.", 1600);
    fun(20);
    say([
      ["", "Os mascarados entram na praça: São Jorge, um Dragão de pano e um Doutor muito suspeito."],
      ["São Jorge (mascarado)", "Eu sou São Jorge, vim salvar esta vila!"],
      ["Dragão (mascarado)", "ROOOAR! ...Desculpa, perdi a cabeça. Literalmente."],
      ["Doutor (mascarado)", "Tenho um remédio que cura até dragão morto! Três gotas e... ressuscitou!"],
      ["", "A plateia ri e joga moedas. A peça termina com todo mundo dançando."],
    ]);
  }
  function joust() {
    if (!once("justa")) return toast("O torneio de hoje já terminou.", 1600);
    const k = [
      ["Sir Bento do Moinho", "#c94a4a"],
      ["Sir Lucius da Serra", "#3a74c9"],
    ];
    choice("Torneio de justa", "Dois cavaleiros vão correr com lanças. Em quem você aposta 5 de ouro?", [
      ...k.map(([n]) => ({
        t: `Apostar em ${n}`,
        icon: "sword",
        fn: () => {
          if (player.gold < 5) return toast("Precisa de 5 de ouro.", 1600);
          player.gold -= 5;
          const winner = pick(k)[0];
          playSound(120, 0.3, "sawtooth");
          say([["", "Os cavalos disparam. As lanças batem com um estalo enorme!"], ["Arauto", `${winner} derruba o rival e vence o torneio!`]], () => (winner === n ? prize(11, "Você ganhou a aposta!") : toast("Perdeu a aposta. O cavaleiro ficou com a sua moeda e a honra.", 2400)));
          fun(15);
        },
      })),
      { t: "Só assistir", fn: () => (fun(10), say([["", "Que barulho! Um cavaleiro cai de costas na lama e a plateia vai à loucura."]])) },
    ]);
  }

  /* ----- o porco ensebado ----- */
  function releasePig() {
    const D = decor();
    if (D.pig) return toast("O porco já está solto! Pegue ele!", 1600);
    if (!once("porco")) return toast("O porco cansou por hoje.", 1600);
    const [x, y] = spot(2, 3);
    D.pig = { x, y, rx: x, ry: y, step: 0, t: 40 };
    toast("O porco ensebado está solto! Pegue ele antes que fuja (E perto dele).", 3000);
  }
  function pigTick(dt) {
    const P = DECOR && DECOR.pig;
    if (!P || player.zone !== "vila") return;
    P.rx += (P.x - P.rx) * Math.min(1, dt * 9);
    P.ry += (P.y - P.ry) * Math.min(1, dt * 9);
    P.t -= dt;
    if (P.t <= 0) return (DECOR.pig = null), toast("O porco fugiu para o mato! Ninguém pegou.", 2200);
    P.step -= dt;
    if (P.step > 0) return;
    P.step = 0.3;
    const d = Math.abs(P.x - player.x) + Math.abs(P.y - player.y);
    const opts = DIRS4.map(([a, b]) => [P.x + a, P.y + b]).filter(([x, y]) => walkable("vila", x, y) && !(x === player.x && y === player.y));
    if (!opts.length) return;
    if (d < 5) opts.sort((a, b) => Math.abs(b[0] - player.x) + Math.abs(b[1] - player.y) - (Math.abs(a[0] - player.x) + Math.abs(a[1] - player.y)));
    else opts.sort(() => Math.random() - 0.5);
    // escorrega: às vezes não sai do lugar
    if (Math.random() < 0.15) return;
    [P.x, P.y] = opts[0];
  }

  /* ===================== LIGAÇÕES ===================== */
  const fmBase = festivalMenu;
  festivalMenu = function () {
    const r = fmBase.apply(this, arguments);
    if (game.mode === "choice" && Array.isArray(game.choice) && festivalToday()) {
      const extra = activities();
      const opts = game.choice.filter((o) => !/^Corrida de Sacos|^Tiro ao alvo/.test(o.t));
      if (!extra.some((o) => /Corrida de sacos/.test(o.t))) extra.push({ t: "Corrida de sacos", icon: "bag", fn: () => (once("sacos") ? festGame("sacos", (q) => (fun(20), q >= 1 ? prize(15, "Você venceu a corrida de sacos!") : toast("Chegou em segundo. O moleiro ganhou de novo.", 2200))) : toast("Uma corrida por festa, senão o saco rasga.", 1600)) });
      const i = opts.findIndex((o) => /Sair|Voltar|Fechar/.test(o.t));
      opts.splice(i >= 0 ? i : opts.length, 0, ...extra);
      choice(`${festivalToday().n}`, "Costumes da festa:", opts);
    }
    return r;
  };
  const upBase = update;
  update = function (dt) {
    upBase(dt);
    if (!player || game.mode !== "world" || game.dialog || !festivalToday()) return;
    pigTick(Math.min(dt, 0.1));
  };
  const tgBase = targetAt;
  targetAt = function (x, y) {
    const P = DECOR && DECOR.pig;
    if (player.zone === "vila" && P && P.x === x && P.y === y) return "Agarrar o porco ensebado!";
    if (player.zone === "vila" && festivalToday() && kind() === "flores" && DECOR && x === DECOR.pole[0] && y === DECOR.pole[1]) return "Mastro de Maio";
    if (player.zone === "vila" && festivalToday() && kind() === "lanternas" && DECOR && x === DECOR.fire[0] && y === DECOR.fire[1]) return "Fogueira de São João";
    return tgBase(x, y);
  };
  const iaBase = interactAt;
  interactAt = function (x, y) {
    const P = DECOR && DECOR.pig;
    if (player.zone === "vila" && P && P.x === x && P.y === y) {
      if (Math.random() < 0.45) return toast("Escorregou! O porco está todo ensebado.", 1400), playSound(200, 0.1, "square");
      DECOR.pig = null;
      fun(25);
      return prize(20, "Você agarrou o porco ensebado! A praça inteira aplaude.");
    }
    if (player.zone === "vila" && festivalToday() && DECOR && kind() === "flores" && x === DECOR.pole[0] && y === DECOR.pole[1]) return activities()[0].fn();
    if (player.zone === "vila" && festivalToday() && DECOR && kind() === "lanternas" && x === DECOR.fire[0] && y === DECOR.fire[1]) return activities()[0].fn();
    return iaBase(x, y);
  };
  const wkBase = walkable;
  walkable = function (z, x, y) {
    if (z === "vila" && festivalToday() && DECOR) {
      if (DECOR.pig && DECOR.pig.x === x && DECOR.pig.y === y) return false;
      if (kind() === "flores" && x === DECOR.pole[0] && y === DECOR.pole[1]) return false;
      if (kind() === "lanternas" && x === DECOR.fire[0] && y === DECOR.fire[1]) return false;
    }
    return wkBase(z, x, y);
  };
  const cdBase = crewDrawList;
  crewDrawList = function (list, t) {
    cdBase(list, t);
    if (player.zone !== "vila" || !festivalToday()) return;
    const D = decor(),
      k = kind(),
      T = TILE,
      cols = festivalToday().c;
    const [fx, fy] = plaza();
    // bandeirolas cruzando a praça
    list.push({
      y: fy - 6,
      draw: () => {
        for (let row = 0; row < 2; row++) {
          const y0 = (fy - 4 + row * 7) * T;
          for (let i = 0; i < 26; i++) {
            const x = (fx - 12) * T + i * 24,
              sag = Math.sin((i / 25) * Math.PI) * 18;
            ctx.fillStyle = cols[i % cols.length];
            ctx.beginPath();
            ctx.moveTo(x, y0 + sag);
            ctx.lineTo(x + 20, y0 + sag);
            ctx.lineTo(x + 10, y0 + sag + 14);
            ctx.fill();
          }
          ctx.strokeStyle = "#5a3a22";
          ctx.lineWidth = 1;
          ctx.beginPath();
          for (let i = 0; i <= 26; i++) ctx.lineTo((fx - 12) * T + i * 24, y0 + Math.sin((i / 25) * Math.PI) * 18);
          ctx.stroke();
        }
      },
    });
    if (k === "flores")
      list.push({
        y: D.pole[1],
        draw: () => {
          const X = D.pole[0] * T + 14,
            Y = D.pole[1] * T + 30;
          ctx.fillStyle = "#e8dcc0";
          ctx.fillRect(X, Y - 120, 5, 120);
          ctx.fillStyle = "#7ab04a";
          ctx.beginPath();
          ctx.arc(X + 2, Y - 120, 10, 0, 7);
          ctx.fill();
          ["#ff6b8a", "#f5d76e", "#5fa0ff", "#7ad36b", "#c77dff", "#fff"].forEach((c, i) => {
            const a = t * 0.8 + (i * Math.PI) / 3;
            ctx.strokeStyle = c;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(X + 2, Y - 116);
            ctx.lineTo(X + 2 + Math.cos(a) * 46, Y - 6 + Math.sin(a) * 10);
            ctx.stroke();
          });
        },
      });
    if (k === "lanternas")
      list.push({
        y: D.fire[1],
        draw: () => {
          const X = D.fire[0] * T,
            Y = D.fire[1] * T;
          ctx.fillStyle = "#5a3a22";
          ctx.fillRect(X - 4, Y + 22, 40, 8);
          for (let i = 0; i < 5; i++) {
            const h = 26 + Math.sin(t * 9 + i) * 8;
            ctx.fillStyle = ["#ff6a2a", "#ffb04a", "#ffe08a"][i % 3];
            ctx.beginPath();
            ctx.moveTo(X + i * 7, Y + 24);
            ctx.lineTo(X + i * 7 + 4, Y + 24 - h);
            ctx.lineTo(X + i * 7 + 8, Y + 24);
            ctx.fill();
          }
          const gl = ctx.createRadialGradient(X + 16, Y + 10, 4, X + 16, Y + 10, 120);
          gl.addColorStop(0, "rgba(255,150,60,.3)");
          gl.addColorStop(1, "rgba(255,150,60,0)");
          ctx.fillStyle = gl;
          ctx.fillRect(X - 110, Y - 110, 250, 250);
        },
      });
    if (k === "colheita")
      for (const [dx, dy] of [[4, 2], [-4, 2], [6, -1]])
        list.push({
          y: fy + dy,
          draw: () => {
            const X = (fx + dx) * T,
              Y = (fy + dy) * T;
            ctx.fillStyle = "#d9b050";
            for (let i = 0; i < 6; i++) ctx.fillRect(X + 6 + i * 3, Y + 4, 2, 24);
            ctx.fillStyle = "#8a5a2e";
            ctx.fillRect(X + 5, Y + 16, 20, 3);
            ctx.fillStyle = "#e8862a";
            ctx.beginPath();
            ctx.ellipse(X + 26, Y + 26, 7, 5, 0, 0, 7);
            ctx.fill();
          },
        });
    if (k === "runas")
      for (const [dx, dy] of [[4, 2], [-4, 2]])
        list.push({
          y: fy + dy,
          draw: () => {
            const X = (fx + dx) * T,
              Y = (fy + dy) * T;
            ctx.fillStyle = "#3a3a42";
            ctx.fillRect(X + 14, Y - 10, 4, 40);
            ctx.fillStyle = `rgba(255,180,80,${0.7 + 0.3 * Math.sin(t * 8 + dx)})`;
            ctx.beginPath();
            ctx.arc(X + 16, Y - 14, 6, 0, 7);
            ctx.fill();
            ctx.fillStyle = "#f2eecf";
            ctx.fillRect(X + 4, Y + 6, 10, 8);
            ctx.fillStyle = "#1a1028";
            ctx.fillRect(X + 6, Y + 8, 2, 2);
            ctx.fillRect(X + 10, Y + 8, 2, 2);
          },
        });
    const P = D.pig;
    if (P)
      list.push({
        y: P.ry,
        draw: () => {
          const X = P.rx * T,
            Y = P.ry * T;
          ctx.fillStyle = "#f0a8b8";
          ctx.beginPath();
          ctx.ellipse(X + 16, Y + 20, 12, 8, 0, 0, 7);
          ctx.fill();
          ctx.fillStyle = "#e890a0";
          ctx.fillRect(X + 24, Y + 16, 6, 6);
          ctx.fillStyle = "#1a1028";
          ctx.fillRect(X + 22, Y + 15, 2, 2);
          ctx.fillStyle = "rgba(255,255,255,.6)";
          ctx.fillRect(X + 8, Y + 14, 8, 2);
          ctx.fillStyle = "#c97a8a";
          for (const lx of [8, 13, 19, 23]) ctx.fillRect(X + lx, Y + 26, 3, 4);
        },
      });
  };
})();
