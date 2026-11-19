/**
 * ECOS DO ARCANO — vida-no-campo.js
 * A vida nos bairros novos do leste de Cinzaluz (veja campos-do-leste.js):
 *  - Animais de verdade nos cercados: vacas e ovelhas no pasto do norte,
 *    porcos e galinhas no chiqueiro do sul. Eles andam, pastam e dá para
 *    fazer carinho, ordenhar a vaca, tosquiar a ovelha, pegar ovos e
 *    alimentar os porcos.
 *  - O Palco da Praça dos Eventos: todo fim de tarde (18h às 22h) tem
 *    espetáculo (menestréis, teatro de bonecos, malabaristas, coral). Nos
 *    feriados o show é maior. Dá para assistir ou subir no palco.
 * Modifica (envolve) funções de outros arquivos: crewDrawList, update,
 * targetAt, interactAt, walkable.
 */

"use strict";

(() => {
  const animals = [];
  LESTE.pens.forEach((p, pi) =>
    p.kinds.forEach((k, i) => {
      const x = p.x0 + ((i * 3 + pi) % (p.x1 - p.x0 + 1)),
        y = p.y0 + ((i * 2) % (p.y1 - p.y0 + 1));
      animals.push({ k, pen: p, x, y, rx: x, ry: y, t: Math.random() * 3, dir: i % 2 ? 1 : -1, done: -1 });
    }),
  );
  /* O mapa de Cinzaluz mudou depois (casas afastadas, ruas ligadas): o cercado
     de verdade é achado pela CERCA no mapa, e os bichos só andam por dentro dele. */
  let pensFixed = false;
  function fixPens() {
    pensFixed = true;
    const Z = ZONES.vila;
    if (!Z || !Z.map) return;
    const T = (x, y) => (Z.map[y] || "")[x];
    for (const P of LESTE.pens) {
      // a cerca mais perto do cercado antigo: o maior grupo de "f" ligados ali perto
      const X0 = P.x0 - 14,
        X1 = P.x1 + 14,
        Y0 = P.y0 - 10,
        Y1 = P.y1 + 10;
      const seen = new Set();
      let best = null;
      for (let y = Y0; y <= Y1; y++)
        for (let x = X0; x <= X1; x++) {
          if (T(x, y) !== "f" || seen.has(x + "," + y)) continue;
          const q = [[x, y]],
            comp = [];
          seen.add(x + "," + y);
          while (q.length) {
            const [a, b] = q.pop();
            comp.push([a, b]);
            for (let dy = -1; dy <= 1; dy++)
              for (let dx = -1; dx <= 1; dx++) {
                const k = a + dx + "," + (b + dy);
                if (seen.has(k) || T(a + dx, b + dy) !== "f" || a + dx < X0 - 6 || a + dx > X1 + 6) continue;
                seen.add(k);
                q.push([a + dx, b + dy]);
              }
          }
          // tem que ser a cerca EM VOLTA do cercado antigo (o centro dele fica dentro)
          const cx = (P.x0 + P.x1) / 2,
            cy = (P.y0 + P.y1) / 2;
          const xs0 = comp.map((p) => p[0]),
            ys0 = comp.map((p) => p[1]);
          const inside = cx > Math.min(...xs0) && cx < Math.max(...xs0) && cy > Math.min(...ys0) && cy < Math.max(...ys0);
          if (inside && (!best || comp.length > best.length)) best = comp;
        }
      if (!best || best.length < 10) continue;
      const xs = best.map((p) => p[0]),
        ys = best.map((p) => p[1]);
      const bx0 = Math.min(...xs),
        bx1 = Math.max(...xs),
        by0 = Math.min(...ys),
        by1 = Math.max(...ys);
      // por dentro: um bloco de folga da cerca (para o bicho não ficar em cima dela)
      P.x0 = bx0 + 1;
      P.x1 = bx1 - 1;
      P.y0 = by0 + 1;
      P.y1 = by1 - 1;
      // o chão de dentro é pasto: a terra da rua só entra um bloco pela porteira
      const rows = Z.map.map((r) => r.split(""));
      for (let y = P.y0; y <= P.y1; y++)
        for (let x = P.x0; x <= P.x1; x++) {
          if (rows[y][x] !== ",") continue;
          const gate = (rows[y - 1] && rows[y - 1][x] === "," && y === P.y0) || (rows[y + 1] && rows[y + 1][x] === "," && y === P.y1) || (x === P.x0 && rows[y][x - 1] === ",") || (x === P.x1 && rows[y][x + 1] === ",");
          if (!gate) rows[y][x] = ".";
        }
      Z.map = rows.map((r) => r.join(""));
      if (game.mm) delete game.mm.vila;
      P.ok = new Set();
      for (let y = P.y0; y <= P.y1; y++) for (let x = P.x0; x <= P.x1; x++) if (".gw,T".includes(T(x, y)) && T(x, y) !== "f") P.ok.add(x + "," + y);
    }
    // cada bicho volta para dentro do seu cercado
    const used = new Set();
    for (const a of animals) {
      const P = a.pen;
      if (!P.ok || P.ok.has(a.x + "," + a.y)) {
        used.add(a.x + "," + a.y);
        continue;
      }
      const free = [...P.ok].filter((k) => !used.has(k));
      const k = free[Math.floor(Math.random() * free.length)];
      if (!k) continue;
      [a.x, a.y] = k.split(",").map(Number);
      a.rx = a.x;
      a.ry = a.y;
      used.add(k);
    }
  }
  window.fixVilaPens = () => pensFixed || fixPens();
  const animalAt = (x, y) => player.zone === "vila" && animals.find((a) => a.x === x && a.y === y);
  const NAME = { vaca: "vaca", ovelha: "ovelha", porco: "porco", galinha: "galinha" };
  const WORK = { vaca: "Ordenhar a vaca", ovelha: "Tosquiar a ovelha", porco: "Dar lavagem aos porcos", galinha: "Pegar os ovos" };

  const upBase = update;
  update = function (dt) {
    upBase(dt);
    if (player.zone !== "vila" || game.mode !== "world") return;
    if (!pensFixed) fixPens();
    for (const a of animals) {
      a.rx += (a.x - a.rx) * Math.min(1, dt * 3);
      a.ry += (a.y - a.ry) * Math.min(1, dt * 3);
      a.t -= dt;
      if (a.t > 0) continue;
      a.t = (a.k === "galinha" ? 0.8 : 2.4) + Math.random() * 3;
      const [dx, dy] = pk([[1, 0], [-1, 0], [0, 1], [0, -1], [0, 0], [0, 0]]);
      const nx = a.x + dx,
        ny = a.y + dy,
        P = a.pen;
      if (nx < P.x0 || nx > P.x1 || ny < P.y0 || ny > P.y1) continue;
      if (P.ok && !P.ok.has(nx + "," + ny)) continue;
      if (animals.some((o) => o !== a && o.x === nx && o.y === ny) || (nx === player.x && ny === player.y)) continue;
      if (dx) a.dir = dx;
      a.x = nx;
      a.y = ny;
    }
  };

  /* ----- o palco ----- */
  const ST = LESTE.stage;
  const SPOT = [Math.floor((ST.x0 + ST.x1) / 2), ST.y1 + 1];
  const showOn = () => currentHour() >= 18 && currentHour() < 22;
  const SHOWS = [
    ["Menestréis do Leste", "Alaúde, flauta e um tambor. Todo mundo bate palma no refrão."],
    ["Teatro de Bonecos", "O boneco do dragão come o boneco do cavaleiro. As crianças gritam."],
    ["Malabaristas de Fogo", "Tochas girando no ar. Uma cai e quase queima o chapéu do Bento."],
    ["Coral do Templo", "Vinte vozes cantando juntas. Até o guarda da esquina se emociona."],
  ];
  const showNow = () => SHOWS[player.day % SHOWS.length];
  const onStage = (x, y) => player.zone === "vila" && x >= ST.x0 && x <= ST.x1 && y >= ST.y0 && y <= ST.y1;

  const tgBase = targetAt;
  targetAt = function (x, y) {
    const a = animalAt(x, y);
    if (a) return a.done === player.day ? `Fazer carinho na ${NAME[a.k]}` : WORK[a.k];
    if (player.zone === "vila" && (onStage(x, y) || (x === SPOT[0] && y === SPOT[1] - 0))) return showOn() ? `Palco: ${showNow()[0]} (assistir)` : "Palco da Praça dos Eventos (shows às 18h)";
    return tgBase(x, y);
  };
  const iaBase = interactAt;
  interactAt = function (x, y) {
    const a = animalAt(x, y);
    if (a) {
      if (a.done === player.day) {
        if (typeof needAdd === "function") needAdd("fun", 4);
        return toast(pk([`A ${NAME[a.k]} gostou do carinho.`, "Ela fecha os olhos de tão bom.", "Um barulhinho feliz."]), 1800);
      }
      a.done = player.day;
      const gain = { vaca: [6, "Um balde de leite morno. O fazendeiro te paga 6 de ouro."], ovelha: [8, "Lã branquinha num saco. A tecelagem compra por 8 de ouro."], porco: [3, "Os porcos atacam a lavagem fazendo um barulho enorme. O fazendeiro te dá 3 de ouro."], galinha: [4, "Quatro ovos ainda quentes. A doceria paga 4 de ouro."] }[a.k];
      player.gold += gain[0];
      if (typeof passMin === "function") passMin(20);
      return say([["", gain[1]]]);
    }
    if (onStage(x, y)) {
      if (!showOn()) return say([["", "O palco está vazio. Os espetáculos começam às 18h, todo dia."]]);
      const hol = typeof holidayToday === "function" && holidayToday();
      return choice(`Palco: ${showNow()[0]}`, showNow()[1] + (hol ? ` Hoje é ${hol[0]}: o show é dobrado!` : ""), [
        { t: "Assistir ao espetáculo", icon: "note", fn: () => (typeof passMin === "function" && passMin(60), typeof needAdd === "function" && needAdd("fun", hol ? 45 : 25), say([["", showNow()[1]]])) },
        { t: "Subir no palco e cantar", icon: "note", fn: () => (typeof karaoke === "function" ? karaoke() : say([["", "Você canta. Metade aplaude, metade tapa os ouvidos."]])) },
        { t: "Sair", fn: null },
      ]);
    }
    return iaBase(x, y);
  };
  const wkBase = walkable;
  walkable = function (z, x, y) {
    if (z === "vila" && (onStage(x, y) || animals.some((a) => a.x === x && a.y === y))) return false;
    return wkBase(z, x, y);
  };

  /* ----- desenho ----- */
  function drawAnimal(a, t) {
    const X = a.rx * TILE,
      Y = a.ry * TILE;
    const f = a.dir < 0;
    const R = (x, y, w, h, c) => ((ctx.fillStyle = c), ctx.fillRect(f ? X + 32 - x - w : X + x, Y + y, w, h));
    const chew = Math.sin(t * 4 + a.x) > 0 ? 1 : 0;
    R(4, 27, 24, 4, "rgba(0,0,0,.22)");
    if (a.k === "vaca") {
      R(5, 12, 20, 11, "#f2eee4");
      R(9, 13, 6, 5, "#2a2a2a");
      R(18, 17, 5, 4, "#2a2a2a");
      R(23, 9 + chew, 7, 8, "#f2eee4");
      R(26, 14 + chew, 5, 4, "#e8a8a8");
      R(24, 8, 2, 2, "#d9c08a");
      R(28, 8, 2, 2, "#d9c08a");
      R(27, 11 + chew, 1, 1, "#1a1a1a");
      for (const lx of [6, 10, 18, 22]) R(lx, 23, 3, 5, "#d8d0c0");
      R(3, 13, 2, 6, "#2a2a2a");
    } else if (a.k === "ovelha") {
      R(6, 13, 18, 11, "#f6f2ea");
      for (const [x, y] of [[6, 12], [11, 11], [16, 11], [21, 12]]) R(x, y, 5, 3, "#ffffff");
      R(22, 12 + chew, 7, 7, "#3a3030");
      R(26, 14 + chew, 1, 1, "#f2eee4");
      for (const lx of [8, 12, 17, 21]) R(lx, 24, 2, 4, "#3a3030");
    } else if (a.k === "porco") {
      R(6, 15, 18, 10, "#f2a8b0");
      R(22, 15, 6, 7, "#f2a8b0");
      R(27, 17, 3, 3, "#e08890");
      R(23, 14, 2, 2, "#e08890");
      R(25, 16, 1, 1, "#1a1a1a");
      R(4, 16, 2, 2, "#e08890");
      for (const lx of [8, 12, 17, 21]) R(lx, 25, 2, 3, "#e08890");
    } else {
      const hop = Math.abs(Math.sin(t * 6 + a.x)) * 2;
      R(12, 18 - hop, 9, 7, "#f6f2ea");
      R(19, 14 - hop, 5, 5, "#f6f2ea");
      R(20, 12 - hop, 3, 2, "#e03a3a");
      R(24, 16 - hop, 2, 1, "#f2a020");
      R(21, 15 - hop, 1, 1, "#1a1a1a");
      R(14, 25 - hop, 1, 3, "#f2a020");
      R(18, 25 - hop, 1, 3, "#f2a020");
    }
  }
  function drawStage(t) {
    const X = ST.x0 * TILE,
      Y = ST.y0 * TILE,
      w = (ST.x1 - ST.x0 + 1) * TILE,
      h = (ST.y1 - ST.y0 + 1) * TILE;
    const R = (x, y, ww, hh, c) => ((ctx.fillStyle = c), ctx.fillRect(Math.round(x), Math.round(y), ww, hh));
    R(X - 4, Y + h - 2, w + 8, 8, "rgba(0,0,0,.25)");
    // tablado de madeira apoiado em vigas
    R(X, Y + 20, w, h - 20, "#6b4423");
    R(X, Y + 20, w, 6, "#8a5a2e");
    for (let i = 0; i < w; i += 16) R(X + i, Y + 26, 1, h - 26, "#5a3a1e");
    // fundo com cortinas vermelhas e mastros
    R(X + 2, Y - 40, 6, 62, "#5a3a1e");
    R(X + w - 8, Y - 40, 6, 62, "#5a3a1e");
    R(X, Y - 46, w, 8, "#8a5a2e");
    R(X + 8, Y - 38, w - 16, 58, "#7a1a2a");
    for (let i = 0; i < 8; i++) R(X + 8 + i * ((w - 16) / 8), Y - 38, 2, 58, "#5a1020");
    // bandeirolas
    for (let i = 0; i < 12; i++) R(X + 4 + i * (w / 12), Y - 52 + (i % 2) * 2, 8, 7, ["#f2c14e", "#3a6ab0", "#c94a3a"][i % 3]);
    if (showOn()) {
      const k = player.day % SHOWS.length;
      const robes = [["#3a5a8a", "#8a3a3a", "#3a7a3a"], ["#c9a040", "#5a3a8a"], ["#c94a3a", "#e8702a"], ["#efe8d8", "#efe8d8", "#efe8d8", "#efe8d8"]][k];
      robes.forEach((r, i) => drawSprite(wizardRects(r, null, ["#3a2414", "#d9a441", "#1a1a1a"][i % 3], null, "down", Math.floor(t * 3 + i) % 2), X + 12 + i * ((w - 40) / Math.max(1, robes.length - 1 || 1)), Y - 8 + Math.sin(t * 4 + i) * 1.5, 2, false));
      if (k === 2) for (let i = 0; i < 3; i++) R(X + w / 2 - 10 + Math.cos(t * 5 + i * 2) * 20, Y - 30 + Math.sin(t * 5 + i * 2) * 14, 4, 6, "#ffb04a");
      // luz quente do palco
      const g = ctx.createRadialGradient(X + w / 2, Y, 10, X + w / 2, Y, w);
      g.addColorStop(0, "rgba(255,200,110,.18)");
      g.addColorStop(1, "rgba(255,200,110,0)");
      ctx.fillStyle = g;
      ctx.fillRect(X - w / 2, Y - w / 2, w * 2, w * 1.5);
    }
  }
  const cdBase = crewDrawList;
  crewDrawList = function (list, t) {
    cdBase(list, t);
    if (player.zone !== "vila") return;
    for (const a of animals) list.push({ y: a.ry, draw: () => drawAnimal(a, t) });
    list.push({ y: ST.y1 + 0.3, draw: () => drawStage(t) });
  };
})();
