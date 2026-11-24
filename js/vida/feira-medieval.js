/**
 * ECOS DO ARCANO — feira-medieval.js
 * FEIRA MEDIEVAL de fim de semana em todas as cidades, vilas e reinos:
 *  - nos dias 6 e 7 de cada semana, das 8h às 20h;
 *  - 5 barracas listradas na beira da rua perto da chegada da cidade
 *    (comida da feira, doces, joias e bijuterias, brinquedos, curiosidades
 *    de além-mar), com coisas que só aparecem na feira;
 *  - um malabarista jogando tochas e um menestrel tocando alaúde (dá para
 *    dar uma moeda e ganhar diversão);
 *  - aviso ao chegar na cidade e no Calendário.
 * As barracas são decoração (dá para passar por elas).
 * Modifica (envolve) crewDrawList, targetAt, interactAt, enterZone e dayEvents.
 */

"use strict";

(() => {
  const weekDay = (d) => ((d - 1) % 7) + 1;
  window.isFairDay = (d) => weekDay(d) >= 6;
  const fairOpen = () => {
    const Z = ZONES[player.zone];
    if (!Z || !Z.town || Z.town.indoor || !isFairDay(player.day)) return false;
    const h = currentHour();
    return h >= 8 && h < 20;
  };
  const STALLS = [
    { k: "comida", n: "Barraca dos Assados", c: ["#c0392b", "#f6e7c1"], it: [["i_torta_de_carne", 14], ["i_pao_de_mel", 9], ["i_cidra_de_maca", 10], ["i_leite_com_mel", 4]] },
    { k: "doces", n: "Doces da Feira", c: ["#e86ab0", "#fff2f6"], it: [["bolo", 11], ["i_doce_de_leite", 5], ["i_xarope_de_mel", 22], ["doce", 6]] },
    { k: "joias", n: "Joias e Bijuterias", c: ["#6a3aa8", "#f2c14e"], it: [["i_anel_de_prata", 60], ["i_anel_de_ametista", 240], ["perfume", 34]] },
    { k: "brinquedos", n: "Brinquedos do Mestre Bento", c: ["#2a7ab8", "#f6e7c1"], it: [["brinquedo", 9], ["flor", 12], ["m_vela", 38]] },
    { k: "curiosidades", n: "Curiosidades de Além-Mar", c: ["#2a8a5a", "#f2c14e"], it: [["i_cogumelo_dourado", 9], ["i_hidromel_de_flores", 14], ["i_cogumelo_azul", 7]] },
  ].map((s) => Object.assign(s, { it: s.it.filter(([id]) => typeof ITEMS !== "undefined" && ITEMS[id]) }));

  /* ----- onde ficam as barracas: na beira da rua, perto da chegada ----- */
  const SPOTS = {};
  function spotsOf(z) {
    if (SPOTS[z]) return SPOTS[z];
    const Z = ZONES[z];
    const T = (x, y) => (Z.map[y] || "")[x];
    const a = Z.town.arrive || [Math.floor(Z.w / 2), Math.floor(Z.h / 2)];
    const cand = [];
    for (let y = 3; y < Z.h - 3; y++)
      for (let x = 3; x < Z.w - 4; x++) {
        // grama livre (2 de largura) logo acima de uma rua de 2
        if (T(x, y) !== "." || T(x + 1, y) !== "." || T(x, y - 1) !== "." || T(x + 1, y - 1) !== ".") continue;
        if (T(x, y + 1) !== "," || T(x + 1, y + 1) !== "," || T(x, y + 2) !== ",") continue;
        if (Z.town.bld.some((b) => x >= b.x - 2 && x <= b.x + b.w + 1 && y >= b.y - 2 && y <= b.y + b.h + 2)) continue;
        // fora de quintal, jardim e lote (nada de barraca no jardim dos outros)
        const C = window.COMMUNITY_LOTS && COMMUNITY_LOTS[z];
        const inLot = (xx, yy) => (C && C.has(xx + "," + yy)) || Z.town.bld.some((b) => b.plan && b.plan[xx + "," + yy]) || (window.PARKS && PARKS[z] && PARKS[z].has(xx + "," + yy));
        if ([[0, 0], [1, 0], [0, -1], [1, -1], [-1, 0], [2, 0]].some(([dx, dy]) => inLot(x + dx, y + dy))) continue;
        // sem cerca encostada (barraca de rua, não de quintal)
        let fence = 0;
        for (let yy = y - 2; yy <= y; yy++) for (let xx = x - 2; xx <= x + 3; xx++) if (T(xx, yy) === "f") fence++;
        if (fence) continue;
        cand.push([x, y, Math.hypot(x - a[0], y - a[1])]);
      }
    // a feira fica junta: a fileira com mais lugares lado a lado (perto da entrada se empatar)
    const byRow = {};
    for (const c of cand) (byRow[c[1]] = byRow[c[1]] || []).push(c);
    let best = [];
    for (const row of Object.values(byRow)) {
      row.sort((p, q) => p[0] - q[0]);
      // pega uma sequência de lugares com 3 blocos entre eles
      let run = [];
      for (const c of row) {
        if (run.length && c[0] - run[run.length - 1][0] < 3) continue;
        if (run.length && c[0] - run[run.length - 1][0] > 6) {
          if (run.length > best.length || (run.length === best.length && run[0][2] < best[0][2])) best = run;
          run = [];
        }
        run.push(c);
      }
      if (run.length > best.length || (run.length === best.length && best.length && run[0][2] < best[0][2])) best = run;
    }
    const out = best.slice(0, 5);
    return (SPOTS[z] = out.map((p, i) => ({ x: p[0], y: p[1], s: STALLS[i % STALLS.length] })));
  }
  const stallAt = (x, y) => fairOpen() && spotsOf(player.zone).find((p) => (x === p.x || x === p.x + 1) && y === p.y);
  const perfAt = (x, y) => {
    if (!fairOpen()) return null;
    const P = spotsOf(player.zone);
    if (!P.length) return null;
    const j = [P[0].x + 2, P[0].y + 1],
      m = [P[Math.min(2, P.length - 1)].x + 2, P[Math.min(2, P.length - 1)].y + 1];
    if (x === j[0] && y === j[1]) return "malabarista";
    if (x === m[0] && y === m[1]) return "menestrel";
    return null;
  };

  /* ----- desenho ----- */
  function drawStall(p, t) {
    const X = p.x * TILE,
      Y = p.y * TILE,
      [c1, c2] = p.s.c;
    const R = (x, y, w, h, c) => ((ctx.fillStyle = c), ctx.fillRect(x, y, w, h));
    R(X + 2, Y + 28, 60, 5, "rgba(0,0,0,.25)");
    // balcão de madeira
    R(X + 4, Y + 12, 56, 18, "#7a4f2a");
    R(X + 4, Y + 12, 56, 3, "#a8784a");
    // mercadorias coloridas no balcão
    const cols = { comida: ["#c9822a", "#8a4a2a", "#e0b060"], doces: ["#f6b8d0", "#fff", "#c94a8a"], joias: ["#f2c14e", "#9ad8ff", "#c94a4a"], brinquedos: ["#4a7ad9", "#e8b23a", "#c94a4a"], curiosidades: ["#7ae0a0", "#d8b4ff", "#f2c14e"] }[p.s.k];
    for (let i = 0; i < 7; i++) R(X + 8 + i * 7, Y + 7, 5, 5, cols[i % 3]);
    // postes e toldo listrado ondulando
    R(X + 4, Y - 22, 3, 34, "#5a3a1c");
    R(X + 57, Y - 22, 3, 34, "#5a3a1c");
    for (let i = 0; i < 8; i++) R(X + 2 + i * 8, Y - 26, 8, 12, i % 2 ? c1 : c2);
    for (let i = 0; i < 8; i++) R(X + 2 + i * 8, Y - 14 + (i % 2 ? Math.sin(t * 3 + i) : 0), 8, 4, i % 2 ? c1 : c2);
    // bandeirola
    R(X + 31, Y - 38, 2, 12, "#5a3a1c");
    ctx.fillStyle = c1;
    fillPolygon(X + 33, Y - 38, X + 44 + Math.sin(t * 4) * 2, Y - 35, X + 33, Y - 32);
  }
  function drawJuggler(x, y, t) {
    const X = x * TILE + 16,
      Y = y * TILE + 30;
    if (typeof drawSprite === "function" && typeof wizardRects === "function") drawSprite(wizardRects("#c0392b", "#f2c14e", "#3a2414", null, "down"), X - 16, Y - 30, 2, false);
    for (let i = 0; i < 3; i++) {
      const a = t * 4 + (i * Math.PI * 2) / 3;
      const bx = X + Math.cos(a) * 12,
        by = Y - 46 - Math.abs(Math.sin(a)) * 18;
      ctx.fillStyle = "#5a3a1c";
      ctx.fillRect(bx - 1, by, 2, 7);
      ctx.fillStyle = Math.sin(t * 20 + i) > 0 ? "#ffd04a" : "#ff7a2a";
      ctx.fillRect(bx - 2, by - 4, 4, 4);
    }
  }
  function drawMinstrel(x, y, t) {
    const X = x * TILE + 16,
      Y = y * TILE + 30;
    if (typeof drawSprite === "function" && typeof wizardRects === "function") drawSprite(wizardRects("#2a7a4a", "#a8282a", "#c98a3a", null, "down"), X - 16, Y - 30, 2, false);
    ctx.fillStyle = "#c9a03a";
    ctx.fillRect(X + 4, Y - 16 + Math.sin(t * 6), 10, 6);
    ctx.fillStyle = "#5a3a1c";
    ctx.fillRect(X + 12, Y - 20, 8, 2);
    // notinhas
    for (let i = 0; i < 2; i++) {
      const f = (t * 0.7 + i * 0.5) % 1;
      ctx.fillStyle = `rgba(255,255,255,${1 - f})`;
      ctx.fillRect(X + 10 + i * 8 + Math.sin(f * 6) * 3, Y - 30 - f * 22, 3, 3);
      ctx.fillRect(X + 12 + i * 8 + Math.sin(f * 6) * 3, Y - 36 - f * 22, 1, 6);
    }
  }
  const cdBase = crewDrawList;
  crewDrawList = function (list, t) {
    cdBase(list, t);
    if (!fairOpen()) return;
    const P = spotsOf(player.zone);
    for (const p of P) list.push({ y: p.y, x: p.x, w: 2, draw: () => drawStall(p, t) });
    if (P.length) {
      const m = P[Math.min(2, P.length - 1)];
      list.push({ y: P[0].y + 1, draw: () => drawJuggler(P[0].x + 2, P[0].y + 1, t) });
      list.push({ y: m.y + 1, draw: () => drawMinstrel(m.x + 2, m.y + 1, t) });
    }
  };

  /* ----- interação ----- */
  const tgBase = targetAt;
  targetAt = function (x, y) {
    const s = stallAt(x, y);
    if (s) return `Feira: ${s.s.n}`;
    const pf = perfAt(x, y);
    if (pf) return pf === "malabarista" ? "Ver o malabarista (dar uma moeda)" : "Ouvir o menestrel (dar uma moeda)";
    return tgBase.apply(this, arguments);
  };
  const iaBase = interactAt;
  interactAt = function (x, y) {
    const s = stallAt(x, y);
    if (s) {
      const opts = s.s.it.map(([id, price]) => ({
        t: `${ITEMS[id].n || ITEMS[id].nome} · ${price} ouro`,
        fn: () => {
          if (player.gold < price) return toast(`Precisa de ${price} de ouro.`, 1800);
          player.gold -= price;
          addItem(id);
          playSound(880, 0.08, "triangle");
          toast(`Você comprou ${ITEMS[id].n || ITEMS[id].nome} na feira!`, 2000);
          if (typeof grantTrophy === "function") grantTrophy("feira");
        },
      }));
      return choice(s.s.n, "Só na feira de fim de semana! Preço de feira, pechinchado.", opts.concat([{ t: "Sair", fn: null }]));
    }
    const pf = perfAt(x, y);
    if (pf) {
      if (player.gold < 1) return toast("Você não tem nem uma moeda...", 1600);
      player.gold -= 1;
      if (typeof addNeed === "function" && typeof lifeMode === "function" && lifeMode()) addNeed("fun", 15);
      playSound(pf === "menestrel" ? 660 : 520, 0.15, "triangle");
      return say([["", pf === "malabarista" ? "Três tochas no ar, uma pirueta... e ele pega todas! Você aplaude e joga uma moeda no chapéu." : "O menestrel canta a balada do Grifo de Pedra. Você joga uma moeda e cantarola junto."]]);
    }
    return iaBase.apply(this, arguments);
  };

  /* ----- aviso ao chegar e no Calendário ----- */
  const ezBase = enterZone;
  enterZone = function () {
    const r = ezBase.apply(this, arguments);
    if (fairOpen() && spotsOf(player.zone).length) setTimeout(() => toast("Hoje tem Feira Medieval! Barracas, malabarista e menestrel perto da entrada.", 3600), 1500);
    return r;
  };
  if (typeof dayEvents === "function") {
    const deBase = dayEvents;
    dayEvents = function (d) {
      const ev = deBase.apply(this, arguments);
      if (isFairDay(d)) ev.push(["party", "Feira Medieval", "Em todas as cidades, das 8h às 20h: barracas, malabarista e menestrel."]);
      return ev;
    };
  }
})();
