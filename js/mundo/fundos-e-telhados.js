/**
 * ECOS DO ARCANO — fundos-e-telhados.js
 *  - PORTA DOS FUNDOS: na sua casa (comprada ou a do começo) com quintal,
 *    a porta da frente pergunta se você quer entrar em casa ou sair pelos
 *    fundos para o quintal. No quintal, olhando para a parede de trás da
 *    casa, dá para entrar de novo pela porta dos fundos.
 *  - TELHADO NÃO INVADE A RUA: se a fileira logo acima de uma casa é rua,
 *    o desenho da casa (telhado, chaminé, frontão) é cortado na linha do
 *    terreno dela, como os lotes do The Sims: cada casa fica dentro do
 *    próprio lote.
 * Modifica (envolve) bldAction, targetAt, interactAt e drawBuilding.
 */

"use strict";

(() => {
  // todo quintal cercado precisa de uma entrada (abre um portão onde faltar)
  if (typeof openYardGates === "function") openYardGates();
  const mine = (b) => typeof isMyHomeBld === "function" && isMyHomeBld(b);
  // as células do quintal atrás da casa onde dá para pisar
  function yardSpot(b) {
    if (!b.plan) return null;
    const cells = Object.entries(b.plan)
      .filter(([, k]) => k === "grama" || k === "varal" || k === "horta" || k === "ervas" || k === "flores")
      .map(([k]) => k.split(",").map(Number))
      .filter(([x, y]) => y < b.y && walkable(player.zone, x, y));
    if (!cells.length) return null;
    const dx = b.door[0];
    cells.sort((a, c) => c[1] - a[1] || Math.abs(a[0] - dx) - Math.abs(c[0] - dx));
    return cells[0];
  }
  const baBase = bldAction;
  bldAction = function (b) {
    const spot = b && mine(b) && yardSpot(b);
    if (!spot) return baBase.apply(this, arguments);
    const args = arguments;
    choice("Sua casa", "Entrar em casa, ou sair pela porta dos fundos para o quintal?", [
      { t: "Entrar em casa", icon: "house", fn: () => baBase.apply(this, args) },
      {
        t: "Ir para o quintal (porta dos fundos)",
        icon: "door",
        fn: () => {
          [player.x, player.y] = spot;
          player.rx = player.x;
          player.ry = player.y;
          player.dir = "down";
          toast("Você saiu pelos fundos. Bem-vind" + (typeof genderWord === "function" ? genderWord("o", "a", "e") : "o") + " ao quintal!", 1800);
        },
      },
      { t: "Sair", fn: null },
    ]);
  };
  // olhando para a parede de trás da sua casa, de dentro do quintal
  const backOf = (x, y) => {
    const z = ZONES[player.zone];
    if (!z || !z.town) return null;
    const b = z.town.bld.find((q) => x >= q.x && x < q.x + q.w && y === q.y && q.plan);
    return b && player.y === b.y - 1 && player.x === x && mine(b) ? b : null;
  };
  const tgBase = targetAt;
  targetAt = function (x, y) {
    if (backOf(x, y)) return "Entrar pela porta dos fundos";
    return tgBase.apply(this, arguments);
  };
  const iaBase = interactAt;
  interactAt = function (x, y) {
    const b = backOf(x, y);
    if (b) return baBase(b);
    return iaBase.apply(this, arguments);
  };

  // telhado dentro do lote
  const FREE = new Set(["castle", "palacio", "fortaleza"]);
  // como no The Sims: quem está atrás da casa não some debaixo do telhado,
  // a casa fica meio transparente enquanto você anda no quintal
  const fade = new WeakMap();
  const dbFade = drawBuilding;
  drawBuilding = function (b, t) {
    const zz = ZONES[player.zone];
    const onRoad = zz && zz.map && zz.map[player.y] && ",=".includes(zz.map[player.y][player.x]);
    const behind = !onRoad && player.rx >= b.x - 1.5 && player.rx <= b.x + b.w + 0.5 && player.ry >= b.y - 2 && player.ry < b.y + 0.2;
    const a = Math.max(0.42, Math.min(1, (fade.get(b) ?? 1) + (behind ? -0.08 : 0.08)));
    fade.set(b, a);
    if (a >= 1) return dbFade.apply(this, arguments);
    ctx.save();
    ctx.globalAlpha *= a;
    try {
      return dbFade.apply(this, arguments);
    } finally {
      ctx.restore();
    }
  };
  const dbClip = drawBuilding;
  drawBuilding = function (b, t) {
    const z = ZONES[player.zone];
    if (!z || !z.map || FREE.has(b.style) || b.y < 1) return dbClip.apply(this, arguments);
    const row = z.map[b.y - 1] || "";
    let road = false;
    for (let x = b.x - 1; x <= b.x + b.w; x++) if (",=".includes(row[x])) road = true;
    if (!road) return dbClip.apply(this, arguments);
    ctx.save();
    ctx.beginPath();
    ctx.rect(b.x * TILE - 48, b.y * TILE - 2, b.w * TILE + 96, b.h * TILE + 40);
    ctx.clip();
    try {
      return dbClip.apply(this, arguments);
    } finally {
      ctx.restore();
    }
  };
})();
