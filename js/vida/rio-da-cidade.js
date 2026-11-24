/**
 * ECOS DO ARCANO — rio-da-cidade.js
 * O rio e os lagos das cidades servem para a vida do dia a dia. Na beira
 * da água (em qualquer vila, cidade ou reino) dá para:
 *  - PESCAR (com vara) e BEBER, como antes;
 *  - LAVAR ROUPA: 1 hora esfregando na pedra; as roupas ficam limpas
 *    (higiene sobe um pouco) e dá para ganhar uns trocados lavando para fora;
 *  - TOMAR BANHO: meia hora, a higiene enche (água fria: cansa um pouco);
 *  - NADAR: entra na água de verdade (nadar.js: fôlego, afogamento, tubarão).
 * Tudo passa o tempo do relógio. No modo História, banho e roupa não têm
 * necessidade, mas o tempo passa do mesmo jeito.
 * Os lagos grandes (preencher-mapas.js) ganham um lavadouro de pedra e
 * taboas na margem, e de dia tem gente lavando roupa e criança nadando.
 * Modifica (envolve) targetAt, interactAt e drawTile.
 */

"use strict";

(() => {
  const isTownZ = (z) => ZONES[z] && ZONES[z].town && !ZONES[z].town.indoor;
  const life = () => typeof lifeMode === "function" && lifeMode();
  const need = (k, v) => life() && typeof addNeed === "function" && addNeed(k, v);
  const cold = () => typeof season === "function" && season().id === "inv";

  const tBase = targetAt;
  targetAt = function (x, y) {
    if (window.SWIM && SWIM.on) return tBase.apply(this, arguments);
    if (isTownZ(player.zone) && tileAt(player.zone, x, y) === "~" && !(typeof inPlazaT === "function" && inPlazaT(player.zone, x, y))) return (ZONES[player.zone].theme === "porto" && !((window.LAKES || {})[player.zone] || []).some((R) => x >= R.x0 - 1 && x <= R.x1 + 1 && y >= R.y0 - 1 && y <= R.y1 + 1) ? "Mar" : "Rio") + ": pescar, lavar roupa, banho, nadar";
    return tBase.apply(this, arguments);
  };

  function waterMenu(x, y) {
    const opts = [];
    if (itemCount("vara")) opts.push({ t: "Pescar", fn: () => startFishing(x, y) });
    opts.push(
      {
        t: "Beber água",
        fn: () => {
          player.water = Math.min(100, player.water + 35);
          toast("Você bebe água do rio. Sede +35.");
          riskyIntake("rio");
        },
      },
      {
        t: "Lavar roupa (1 hora)",
        fn: () => {
          need("hygiene", 15);
          need("energy", -8);
          player.cleanClothes = player.day;
          // às vezes alguém paga para você lavar a roupa dele
          let extra = "";
          if (Math.random() < 0.35) {
            const g = 3 + Math.floor(Math.random() * 6);
            player.gold += g;
            extra = ` Uma vizinha pagou ${g} de ouro para você lavar a dela também.`;
          }
          passTime(1, "Você esfrega a roupa na pedra e estende no varal da margem." + extra);
        },
      },
      {
        t: "Tomar banho (meia hora)",
        fn: () => {
          need("hygiene", 100);
          need("energy", cold() ? -12 : -3);
          passTime(0.5, cold() ? "Banho gelado de inverno! Limpinho, mas tremendo." : "Você toma banho no rio. A água fresca leva o cansaço da poeira.");
        },
      },
      {
        t: typeof riverDirty === "function" && riverDirty() ? "Nadar (ÁGUA SUJA: pode matar!)" : "Nadar (entrar na água)",
        fn: () => {
          if (typeof startSwim === "function") return startSwim(x, y);
          need("fun", 30);
          passTime(1, "Você nada de uma margem à outra.");
        },
      },
      ...(typeof fishBook === "function" ? [{ t: "Ver o caderno de pesca", icon: "book", fn: () => fishBook() }] : []),
      { t: "Cancelar", fn: null },
    );
    choice("Beira do rio", "O que você quer fazer na água?", opts);
  }

  const iBase = interactAt;
  interactAt = function (x, y) {
    if (window.SWIM && SWIM.on && tileAt(player.zone, x, y) === "~") return toast("Você está nadando. Volte para a terra (ou um píer) para sair.", 1800);
    if (isTownZ(player.zone) && tileAt(player.zone, x, y) === "~" && !(typeof inPlazaT === "function" && inPlazaT(player.zone, x, y))) return waterMenu(x, y);
    return iBase.apply(this, arguments);
  };

  /* ----- lavadouro, taboas e gente na água dos lagos grandes ----- */
  const shoreMap = {};
  const shore = (z) => {
    if (shoreMap[z]) return shoreMap[z];
    const M = (shoreMap[z] = new Map());
    const Z = ZONES[z];
    for (const R of (window.LAKES || {})[z] || []) {
      let stone = null;
      for (let y = R.y0 - 1; y <= R.y1 + 1; y++)
        for (let x = R.x0 - 1; x <= R.x1 + 1; x++) {
          const c = Z.map[y] && Z.map[y][x];
          if (c !== "." && c !== ",") continue;
          const wetN = [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([dx, dy]) => Z.map[y + dy] && Z.map[y + dy][x + dx] === "~");
          if (!wetN.length) continue;
          // o lavadouro fica no fim do caminho (onde a rua encosta na água)
          if (c === "," && !stone) ((stone = [x, y]), M.set(x + "," + y, "lava"));
          else if (c === "." && (x * 7 + y * 3) % 4 === 0 && !((window.PARKS || {})[z] && PARKS[z].has(x + "," + y)) && !((window.PARKS || {})[z] && PARKS[z].has(x + 1 + "," + y))) M.set(x + "," + y, "taboa");
        }
    }
    return M;
  };
  const lakeOf = (z, x, y) => ((window.LAKES || {})[z] || []).find((R) => x >= R.x0 && x <= R.x1 && y >= R.y0 && y <= R.y1);
  const SH = [128, 178, 172],
    DP = [32, 82, 140];
  // água do lago: degradê suave (raso na beira, fundo no meio), ondinhas e espuma
  function lakeWater(z, R, x, y, X, Y, t) {
    const cx = ((R.x0 + R.x1 + 1) / 2) * TILE,
      cy = ((R.y0 + R.y1 + 1) / 2) * TILE,
      rx = ((R.x1 - R.x0 + 1) / 2) * TILE,
      ry = ((R.y1 - R.y0 + 1) / 2) * TILE;
    const Q = 8;
    for (let sy = 0; sy < TILE; sy += Q)
      for (let sx = 0; sx < TILE; sx += Q) {
        const d = Math.min(1, Math.hypot((X + sx + Q / 2 - cx) / rx, (Y + sy + Q / 2 - cy) / ry));
        const f = Math.max(0, Math.min(1, (1 - d) * 1.6));
        ctx.fillStyle = `rgb(${SH.map((v, i) => Math.round(v + (DP[i] - v) * f)).join(",")})`;
        ctx.fillRect(X + sx, Y + sy, Q, Q);
      }
    // ondinhas que balançam
    ctx.fillStyle = "rgba(220,240,255,.35)";
    for (let i = 0; i < 2; i++) {
      const ox = (t * 10 + x * 23 + i * 15) % (TILE - 8);
      ctx.fillRect(X + ox, Y + 8 + i * 13, 8, 2);
    }
    // beira: areia molhada e espuma onde a água encontra a terra
    const dry = (a, b) => tileAt(z, a, b) !== "~";
    const edge = (fx, fy, w, h) => {
      ctx.fillStyle = "rgba(196,170,116,.95)";
      ctx.fillRect(fx, fy, w, h);
    };
    // margem natural: a grama avança e recua em curvas sobre a água
    const bump = (u) => 5 + 4 * Math.sin(u * 0.9 + x * 1.7 + y * 2.3) + 2 * Math.sin(u * 2.1 + y);
    ctx.fillStyle = "#6a9a46";
    for (let u = 0; u < TILE; u += 4) {
      const b = Math.max(1, bump(u / 4));
      if (dry(x, y - 1)) ctx.fillRect(X + u, Y, 4, b);
      if (dry(x, y + 1)) ctx.fillRect(X + u, Y + TILE - b, 4, b);
      if (dry(x - 1, y)) ctx.fillRect(X, Y + u, b, 4);
      if (dry(x + 1, y)) ctx.fillRect(X + TILE - b, Y + u, b, 4);
    }
    ctx.save();
    const shift = (fn) => fn;
    for (let u = 0; u < TILE; u += 4) {
      const b = Math.max(1, bump(u / 4));
      ctx.fillStyle = "rgba(196,170,116,.95)";
      if (dry(x, y - 1)) ctx.fillRect(X + u, Y + b, 4, 2);
      if (dry(x, y + 1)) ctx.fillRect(X + u, Y + TILE - b - 2, 4, 2);
      if (dry(x - 1, y)) ctx.fillRect(X + b, Y + u, 2, 4);
      if (dry(x + 1, y)) ctx.fillRect(X + TILE - b - 2, Y + u, 2, 4);
      ctx.fillStyle = "rgba(255,255,255,.55)";
      if (dry(x, y - 1)) ctx.fillRect(X + u, Y + b + 2, 4, 1);
      if (dry(x, y + 1)) ctx.fillRect(X + u, Y + TILE - b - 3, 4, 1);
      if (dry(x - 1, y)) ctx.fillRect(X + b + 2, Y + u, 1, 4);
      if (dry(x + 1, y)) ctx.fillRect(X + TILE - b - 3, Y + u, 1, 4);
    }
    ctx.restore();
    // vitória-régia de vez em quando
    if ((x * 31 + y * 17) % 23 === 0) {
      ctx.fillStyle = "#4a8a3a";
      ctx.beginPath();
      ctx.arc(X + 16, Y + 16, 5, 0.4, Math.PI * 2);
      ctx.lineTo(X + 16, Y + 16);
      ctx.fill();
    }
  }
  const dtBase = drawTile;
  drawTile = function (z, x, y, c, t) {
    const r = dtBase.apply(this, arguments);
    if (!isTownZ(z) || !(window.LAKES || {})[z]) return r;
    const X = x * TILE,
      Y = y * TILE,
      k = shore(z).get(x + "," + y);
    if (c === "~") {
      const L = lakeOf(z, x, y);
      if (L) lakeWater(z, L, x, y, X, Y, t);
    }
    if (k === "taboa") {
      ctx.fillStyle = "#4a7a3a";
      for (let i = 0; i < 4; i++) ctx.fillRect(X + 6 + i * 6, Y + 8 + (i % 2) * 4, 2, 18);
      ctx.fillStyle = "#6a4a2a";
      ctx.fillRect(X + 11, Y + 6, 3, 6);
      ctx.fillRect(X + 23, Y + 10, 3, 6);
    } else if (k === "lava") {
      // pedra de lavar roupa e um cesto
      ctx.fillStyle = "#8a8a96";
      ctx.fillRect(X + 4, Y + 16, 24, 10);
      ctx.fillStyle = "#a8a8b4";
      ctx.fillRect(X + 4, Y + 16, 24, 3);
      ctx.fillStyle = "#a8784a";
      ctx.fillRect(X + 20, Y + 6, 9, 8);
      ctx.fillStyle = "#f2efe6";
      ctx.fillRect(X + 21, Y + 4, 7, 3);
    }
    // de dia: alguém nadando no meio do lago (cabecinha e braçadas)
    if (c === "~" && typeof currentHour === "function") {
      const h = currentHour();
      if (h >= 9 && h < 17 && !cold() && (player.weather || "sol") === "sol" && (x * 13 + y * 7) % 37 === 0) {
        const s = Math.sin(t * 2 + x);
        ctx.fillStyle = "rgba(255,255,255,.5)";
        ctx.fillRect(X + 6, Y + 18, 20, 2);
        ctx.fillStyle = "#e0b090";
        ctx.fillRect(X + 13, Y + 12 + s, 6, 6);
        ctx.fillStyle = "#3a2a1a";
        ctx.fillRect(X + 13, Y + 11 + s, 6, 2);
        ctx.fillStyle = "#e0b090";
        ctx.fillRect(X + (s > 0 ? 6 : 22), Y + 14, 4, 2);
      }
    }
    return r;
  };
})();

/* ----- barcos ancorados: cada um na água aberta (o mapa esticou e alguns
   ficaram encostados no píer ou na areia) ----- */
(() => {
  for (const z in ZONES) {
    const Z = ZONES[z];
    const B = Z && Z.town && Z.town.boats;
    if (!B || !B.length || !Z.map) continue;
    const used = [];
    const open = (x, y) => [-2, -1, 0, 1, 2].every((d) => (Z.map[y] || "")[x + d] === "~") && !used.some(([ux, uy]) => uy === y && Math.abs(ux - x) < 4);
    for (const bt of B) {
      const y = Math.floor(bt[1]),
        x0 = Math.floor(bt[0]);
      let best = null;
      for (let d = 0; d < 30 && !best; d++)
        for (const x of [x0 - d, x0 + d])
          for (const yy of [y, y - 1, y + 1])
            if (!best && open(x, yy)) best = [x, yy];
      if (best) {
        bt[0] = best[0] + (bt[0] % 1);
        bt[1] = best[1] + (bt[1] % 1);
        used.push(best);
      }
    }
  }
})();
