/**
 * ECOS DO ARCANO — clima-e-agua.js
 * O clima muda a água:
 *  - TEMPESTADE no mar: água escura, cristas brancas espumando por todo lado;
 *    quem está nadando é empurrado pelas ondas (o mar te leva para o fundo,
 *    onde o fôlego acaba e o tubarão mora) e toma caldo de vez em quando;
 *    o barqueiro não aluga barco e avisa.
 *  - CHUVA nos rios e lagos: o rio enche (água barrenta, correnteza mais
 *    forte e mais rápida) e a correnteza arrasta quem nada.
 *  - Nado com chuva ou tempestade tem aviso na hora de entrar.
 * Modifica (envolve) drawTile, updateVilaLife, interactAt e startSwim.
 */

"use strict";

(() => {
  const W = () => player.weather || "sol";
  const storm = () => W() === "tempestade";
  const rainy = () => W() === "chuva" || W() === "tempestade";
  const isLake = (z, x, y) => ((window.LAKES || {})[z] || []).some((R) => x >= R.x0 - 1 && x <= R.x1 + 1 && y >= R.y0 - 1 && y <= R.y1 + 1);
  const isSea = (z, x, y) => ZONES[z] && ZONES[z].theme === "porto" && !isLake(z, x, y);

  /* ----- desenho ----- */
  const dtBase = drawTile;
  drawTile = function (z, x, y, c, t) {
    const r = dtBase.apply(this, arguments);
    if (c !== "~" || !ZONES[z] || !ZONES[z].town || (typeof isFrozen === "function" && isFrozen(z, x, y))) return r;
    const X = x * TILE,
      Y = y * TILE,
      h = (x * 928371 + y * 1237) % 997;
    if (isSea(z, x, y) && storm()) {
      // mar bravo: escuro, espuma correndo
      ctx.fillStyle = "rgba(20,30,50,.32)";
      ctx.fillRect(X, Y, TILE, TILE);
      for (let i = 0; i < 2; i++) {
        const f = (t * 0.9 + h * 0.01 + i * 0.5) % 1;
        const a = Math.sin(f * Math.PI);
        ctx.fillStyle = `rgba(240,248,255,${0.75 * a})`;
        ctx.fillRect(X + ((h * (i + 2)) % 18) + f * 10, Y + ((h * (i + 5)) % 24) + 2, 10, 2);
        ctx.fillRect(X + ((h * (i + 2)) % 18) + f * 10 + 3, Y + ((h * (i + 5)) % 24), 5, 2);
      }
    } else if (!isSea(z, x, y) && rainy()) {
      // rio cheio: barrento e correndo forte
      ctx.fillStyle = storm() ? "rgba(110,90,50,.38)" : "rgba(110,95,60,.24)";
      ctx.fillRect(X, Y, TILE, TILE);
      for (let i = 0; i < 3; i++) {
        const p = (t * (storm() ? 90 : 60) + h * 7 + i * 11) % (TILE + 12);
        ctx.fillStyle = "rgba(230,225,200,.45)";
        ctx.fillRect(X + p - 12, Y + 6 + i * 9 + ((h + i) % 4), 9, 1);
      }
    }
    return r;
  };

  /* ----- quem nada é levado pela água ----- */
  if (typeof updateVilaLife === "function") {
    const uvBase = updateVilaLife;
    let acc = 0;
    updateVilaLife = function (dt) {
      const r = uvBase.apply(this, arguments);
      const S = game.swim;
      if (!S || !S.on || game.mode !== "world" || game.dialog) return r;
      const z = player.zone;
      const sea = isSea(z, player.x, player.y);
      const force = sea && storm() ? 1 : !sea && rainy() ? (storm() ? 0.8 : 0.5) : 0;
      if (!force) return r;
      acc += dt * force;
      if (acc < 1.6) return r;
      acc = 0;
      // no mar: para longe da praia; no rio: para o lado de onde a água corre
      const Z = ZONES[z];
      let best = null;
      for (const [dx, dy] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
        const nx = player.x + dx,
          ny = player.y + dy;
        if (tileAt(z, nx, ny) !== "~") continue;
        // mede o quanto de água tem em volta (o mar empurra para onde tem mais água)
        let deep = 0;
        for (let k = -2; k <= 2; k++) for (let j = -2; j <= 2; j++) if (tileAt(z, nx + k, ny + j) === "~") deep++;
        const score = sea ? deep : dx === 1 ? 30 : deep; // rio corre para leste
        if (!best || score > best.s) best = { nx, ny, s: score };
      }
      if (!best) return r;
      player.x = best.nx;
      player.y = best.ny;
      S.splash && S.splash.push({ x: player.x, y: player.y, t: 0.5 });
      if (sea) {
        S.breath = Math.max(0, S.breath - 12);
        toast("Uma onda grande te leva para o fundo! Nade para a praia!", 1800);
      } else toast("A correnteza do rio cheio te arrasta!", 1600);
      playSound(140, 0.15, "sawtooth");
      return r;
    };
  }

  /* ----- avisos ----- */
  if (typeof startSwim === "function") {
    const ssBase = startSwim;
    window.startSwim = startSwim = function (x, y) {
      const r = ssBase.apply(this, arguments);
      if (isSea(player.zone, x, y) && storm()) setTimeout(() => toast("Mar de tempestade! As ondas vão te puxar para o fundo.", 3200), 1200);
      else if (!isSea(player.zone, x, y) && rainy()) setTimeout(() => toast("O rio está cheio com a chuva: a correnteza puxa forte.", 3200), 1200);
      return r;
    };
  }
  const iaBase = interactAt;
  interactAt = function (x, y) {
    const lbl = typeof targetAt === "function" ? targetAt(x, y) : "";
    if (/Alugar barco/.test(lbl || "") && rainy()) return say([["Barqueiro", storm() ? "Com essa tempestade? Nem pensar! O rio está bravo. Volte quando o tempo abrir." : "Com chuva o rio enche e corre forte. Melhor esperar o tempo firmar."]]);
    return iaBase.apply(this, arguments);
  };
})();
