/**
 * ECOS DO ARCANO — casas-formas.js
 * Diversidade de verdade: as casas comuns não mudam só de cor, mudam de
 * FORMA. Referência dos tipos de casa medievais:
 *  - CHALÉ DE PALHA (casa de "cruck"): paredes baixas caiadas e um telhado
 *    de palha enorme e arredondado, quase até o chão, com água-furtada em
 *    "sobrancelha" e roseira na porta.
 *  - CASA LONGA DE PEDRA: comprida e baixa, telhado de ardósia; numa ponta
 *    mora a família, na outra ficam os bichos (portão de estábulo).
 *  - CASA-TORRE: torre estreita de pedra com ameias e seteiras, e uma ala
 *    baixa de madeira encostada.
 *  - CASA DE FRONTÃO: a empena virada para a rua, com enxaimel em X no
 *    frontão, beiral recortado e um alpendre na porta.
 *  - CASA-OFICINA: térreo aberto com balcão e toldo listrado (a loja da
 *    família), andar de cima avançado e placa pendurada.
 * Cada casa sorteia (pela posição) a forma, a cor da parede, a madeira e o
 * telhado (telha, ardósia, tabuinha, palha ou telha verde), então nenhuma
 * rua fica com casas repetidas.
 * Modifica (envolve) drawBuilding.
 */

"use strict";

(() => {
  const hash = (a, b) => {
    let h = (a * 2654435761) ^ (b * 40503);
    h = (h ^ (h >>> 15)) * 2246822519;
    return Math.abs(h ^ (h >>> 13));
  };
  const COMMON = new Set(["casa", "casa2"]);
  const WALLS = ["#efe6d2", "#e8d9b0", "#d9b46a", "#e8b8b0", "#c9d6b8", "#c8d8e8", "#f2eee4", "#d8c8a8"];
  const TIMBER = ["#3a2414", "#4a2e17", "#2a2020", "#5a2a20"];
  const ROOFS = [
    ["#9a4a32", "#b0583a", "tile"],
    ["#4a5060", "#5a6274", "slate"],
    ["#6a4a32", "#7a5a3e", "shingle"],
    ["#3a6a4a", "#4a7a56", "tile"],
    ["#7a3a3a", "#8e4a44", "tile"],
  ];
  const SHUT = ["#3a6a4a", "#8a3a2a", "#3a4a7a", "#6a5a3a", "#2a5a5a"];
  function look(b) {
    const h = hash(b.x * 3 + 1, b.y * 7 + 5);
    const r = ROOFS[(h >> 4) % ROOFS.length];
    return { h, wall: WALLS[h % WALLS.length], beam: TIMBER[(h >> 3) % TIMBER.length], roof: r[0], r2: r[1], rk: r[2], shut: SHUT[(h >> 6) % SHUT.length], form: h % 8 };
  }
  // 0 e 1 continuam com o desenho antigo (sobrado e companhia); o resto ganha forma nova
  const FORMS = { 2: cottage, 3: longhouse, 4: towerHouse, 5: gableFront, 6: workshop, 7: cottage };

  let R;
  const night = () => nightAlpha() > 0.25;
  function win(x, y, w, h, L, shutters = true) {
    R(x - 1, y - 1, w + 2, h + 2, L.beam);
    R(x, y, w, h, night() ? "#ffcf6a" : "#5a7aa0");
    if (!night()) R(x + 1, y + 1, Math.max(2, w / 3), 2, "rgba(255,255,255,.45)");
    R(x + w / 2 - 1, y, 2, h, L.beam);
    R(x, y + h / 2 - 1, w, 2, L.beam);
    if (shutters) (R(x - 5, y - 1, 4, h + 2, L.shut), R(x + w + 1, y - 1, 4, h + 2, L.shut));
  }
  function door(dx, base, L, arch) {
    R(dx + 7, base - 30, 18, 28, "#2a1a10");
    R(dx + 8, base - 29, 16, 27, "#6b4423");
    for (let i = 0; i < 3; i++) R(dx + 10 + i * 5, base - 28, 1, 25, "#4a2e17");
    if (arch) {
      ctx.fillStyle = "#6b4423";
      ctx.beginPath();
      ctx.arc(dx + 16, base - 29, 8, Math.PI, 0);
      ctx.fill();
    }
    R(dx + 20, base - 16, 2, 2, "#c9b080");
    R(dx + 4, base - 3, 24, 3, "#8a8474"); // degrau de pedra
  }
  function stoneWall(x, y, w, h, h0) {
    R(x, y, w, h, "#9a9284");
    for (let r = 0; r < h / 8; r++)
      for (let k = 0; k < w / 11 + 1; k++) {
        const sx = x + (r % 2) * 5 + k * 11;
        if (sx >= x + w) continue;
        R(sx, y + r * 8, Math.min(10, x + w - sx), 7, ((k + r) * 5 + h0) % 3 ? "#a8a090" : "#8a8274");
        R(sx, y + r * 8 + 6, Math.min(10, x + w - sx), 1, "#6a6458");
      }
  }
  function roofLines(L, x0, x1, y0, y1) {
    const step = L.rk === "slate" ? 5 : L.rk === "shingle" ? 6 : 7;
    for (let y = y0 + 4; y < y1; y += step) {
      R(x0, y, x1 - x0, 1, "rgba(0,0,0,.18)");
      if (L.rk !== "slate") for (let x = x0 + ((y / step) % 2) * 5; x < x1; x += 10) R(x, y - step + 1, 1, step - 1, "rgba(0,0,0,.12)");
    }
  }
  function chimney(b, cx, top, L) {
    R(cx, top, 12, 28, "#8a4a3a");
    for (let r = 0; r < 5; r++) R(cx, top + r * 6, 12, 1, "#6a3428");
    R(cx - 2, top - 2, 16, 4, "#5a2a20");
    b.chimTops = [[cx + 6, top - 4]];
  }

  /* chalé de palha */
  function cottage(b, L, t, X, Y, W, H, base) {
    const wallTop = base - 34;
    R(X + 4, wallTop, W - 8, 34, L.wall);
    R(X + 4, base - 6, W - 8, 4, "rgba(80,60,40,.25)"); // barra de terra na parede
    // palha grossa e arredondada
    const th = ["#c9a24a", "#b8923e", "#d6b05a"][L.h % 3];
    ctx.fillStyle = "#8a6a2a";
    fillPolygon(X - 8, wallTop + 10, X + 16, Y - 2, X + W - 16, Y - 2, X + W + 8, wallTop + 10);
    ctx.fillStyle = th;
    fillPolygon(X - 6, wallTop + 6, X + 18, Y - 6, X + W - 18, Y - 6, X + W + 6, wallTop + 6);
    for (let y = Y; y < wallTop + 6; y += 5) R(X + 2 - ((y - Y) * 22) / (wallTop - Y), y, W - 4 + ((y - Y) * 44) / (wallTop - Y), 1, "rgba(90,60,20,.25)");
    ctx.fillStyle = "#a8843a";
    ctx.beginPath();
    ctx.ellipse(X + W / 2, wallTop + 7, W / 2 + 7, 5, 0, 0, Math.PI);
    ctx.fill();
    R(X + 16, Y - 8, W - 32, 4, "#a8843a"); // cumeeira
    // água-furtada em sobrancelha
    const ex = X + W / 2;
    ctx.fillStyle = th;
    ctx.beginPath();
    ctx.ellipse(ex, wallTop - 14, 18, 12, 0, Math.PI, 0);
    ctx.fill();
    win(ex - 6, wallTop - 20, 12, 9, L, false);
    chimney(b, L.h % 2 ? X + 12 : X + W - 24, Y - 22, L);
    for (const dx of b.door) {
      const d = X + (dx - b.x) * TILE;
      door(d, base, L, true);
      for (let i = 0; i < 6; i++) R(d + 2 + (i % 2) * 24, base - 34 + i * 5, 4, 4, i % 3 ? "#3a7a3a" : "#e86a8a"); // roseira
    }
    for (let x = X + 12; x < X + W - 22; x += 40) if (!b.door.some((dx) => Math.abs(X + (dx - b.x) * TILE + 16 - (x + 6)) < 26)) win(x, wallTop + 8, 12, 10, L);
  }

  /* casa longa de pedra */
  function longhouse(b, L, t, X, Y, W, H, base) {
    const wallTop = base - 46;
    stoneWall(X, wallTop, W, 46, L.h);
    ctx.fillStyle = shade(L.roof, -0.25);
    fillPolygon(X - 6, wallTop + 6, X + 8, Y + 6, X + W - 8, Y + 6, X + W + 6, wallTop + 6);
    ctx.fillStyle = L.rk === "tile" ? "#4a5060" : L.roof;
    fillPolygon(X - 4, wallTop + 2, X + 10, Y + 2, X + W - 10, Y + 2, X + W + 4, wallTop + 2);
    roofLines({ rk: "slate" }, X, X + W, Y + 2, wallTop + 2);
    R(X + 10, Y, W - 20, 4, "#3a3a44");
    // ponta dos bichos: portão de estábulo com o X de madeira
    const left = L.h % 2 === 0;
    const gx = left ? X + 6 : X + W - 42;
    if (!b.door.some((dx) => Math.abs(X + (dx - b.x) * TILE - gx) < 30)) {
      R(gx, base - 34, 36, 32, "#6b4423");
      R(gx, base - 34, 36, 3, "#4a2e17");
      ctx.strokeStyle = "#4a2e17";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(gx + 2, base - 31);
      ctx.lineTo(gx + 34, base - 4);
      ctx.moveTo(gx + 34, base - 31);
      ctx.lineTo(gx + 2, base - 4);
      ctx.stroke();
      R(gx + 17, base - 34, 2, 32, "#4a2e17");
      R(gx + 4, base - 2, 6, 2, "#c9a24a"); // palha no chão
    }
    for (const dx of b.door) door(X + (dx - b.x) * TILE, base, L, true);
    for (let x = X + (left ? 52 : 12); x < X + W - (left ? 12 : 52); x += 34) if (!b.door.some((dx) => Math.abs(X + (dx - b.x) * TILE + 16 - (x + 5)) < 24)) win(x, wallTop + 12, 10, 12, L);
    chimney(b, left ? X + W - 30 : X + 18, Y - 14, L);
  }

  /* casa-torre */
  function towerHouse(b, L, t, X, Y, W, H, base) {
    const tw = Math.min(Math.round(W * 0.55), 84);
    const left = L.h % 2 === 0;
    const tx = left ? X + 2 : X + W - tw - 2;
    const top = Y - 34;
    // ala de madeira baixa encostada
    const wx = left ? tx + tw : X,
      ww = W - tw - 2;
    const wTop = base - 40;
    R(wx, wTop, ww, 40, L.wall);
    for (let k = 0; k <= ww; k += 16) R(wx + k, wTop, 3, 40, L.beam);
    R(wx, wTop, ww, 3, L.beam);
    ctx.fillStyle = L.roof;
    if (left) fillPolygon(wx - 2, wTop - 18, wx + ww + 6, wTop + 4, wx - 2, wTop + 4);
    else fillPolygon(wx + ww + 2, wTop - 18, wx - 6, wTop + 4, wx + ww + 2, wTop + 4);
    roofLines(L, wx, wx + ww, wTop - 14, wTop + 2);
    // a torre
    stoneWall(tx, top, tw, base - top, L.h);
    R(tx, top, tw, 2, "#6a6458");
    for (let k = 0; k < tw; k += 14) (R(tx + k, top - 10, 9, 10, "#9a9284"), R(tx + k, top - 10, 9, 2, "#b8b0a0"));
    R(tx - 3, top + 18, tw + 6, 4, "#7a7468"); // cornija
    for (let i = 0; i < 2; i++) R(tx + tw / 2 - 2 + (i ? 14 : -14), top + 30, 4, 12, "#2a2420"); // seteiras
    win(tx + tw / 2 - 6, top + 54, 12, 14, L, false);
    if (b.flag !== false) (R(tx + tw / 2 - 1, top - 30, 2, 22, "#3a3a3a"), R(tx + tw / 2 + 1, top - 30 + Math.sin(t * 3), 12, 7, L.shut));
    for (const dx of b.door) door(X + (dx - b.x) * TILE, base, L, true);
    if (ww > 40) win(wx + ww / 2 - 6, wTop + 10, 12, 10, L);
    b.chimTops = [];
  }

  /* casa de frontão com alpendre */
  function gableFront(b, L, t, X, Y, W, H, base) {
    const wallTop = base - Math.round(H * 0.5);
    R(X + 2, wallTop, W - 4, base - wallTop, L.wall);
    // os panos do telhado aparecendo atrás do frontão
    ctx.fillStyle = L.r2;
    fillPolygon(X - 8, wallTop + 4, X + W / 2, Y - 26, X + W + 8, wallTop + 4);
    roofLines(L, X - 6, X + W + 6, Y - 20, wallTop + 2);
    // o frontão
    ctx.fillStyle = L.wall;
    fillPolygon(X + 4, wallTop + 2, X + W / 2, Y - 16, X + W - 4, wallTop + 2);
    ctx.strokeStyle = L.beam;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(X + 4, wallTop + 2);
    ctx.lineTo(X + W / 2, Y - 16);
    ctx.lineTo(X + W - 4, wallTop + 2);
    ctx.moveTo(X + W / 2, Y - 16);
    ctx.lineTo(X + W / 2, wallTop + 2);
    ctx.moveTo(X + W * 0.25, wallTop + 2);
    ctx.lineTo(X + W / 2, (Y - 16 + wallTop) / 2);
    ctx.lineTo(X + W * 0.75, wallTop + 2);
    ctx.stroke();
    // beiral recortado
    ctx.strokeStyle = shade(L.beam, 0.2);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(X - 6, wallTop + 6);
    ctx.lineTo(X + W / 2, Y - 22);
    ctx.lineTo(X + W + 6, wallTop + 6);
    ctx.stroke();
    win(X + W / 2 - 14, (Y - 16 + wallTop) / 2 + 4, 10, 10, L, false);
    win(X + W / 2 + 4, (Y - 16 + wallTop) / 2 + 4, 10, 10, L, false);
    R(X + 2, wallTop, W - 4, 4, L.beam);
    for (const k of [0, W - 8]) R(X + 2 + k, wallTop, 4, base - wallTop, L.beam);
    // alpendre na porta
    for (const dx of b.door) {
      const d = X + (dx - b.x) * TILE;
      door(d, base, L, false);
      R(d - 2, base - 44, 36, 6, L.roof);
      R(d - 2, base - 38, 36, 2, "rgba(0,0,0,.25)");
      R(d - 1, base - 38, 3, 36, L.beam);
      R(d + 30, base - 38, 3, 36, L.beam);
    }
    for (let x = X + 12; x < X + W - 20; x += 30) if (!b.door.some((dx) => Math.abs(X + (dx - b.x) * TILE + 16 - (x + 6)) < 28)) win(x, wallTop + 12, 12, 12, L);
    chimney(b, X + W - 26, Y - 4, L);
  }

  /* casa-oficina com loja no térreo */
  function workshop(b, L, t, X, Y, W, H, base) {
    const g = 40,
      gTop = base - g,
      uTop = Y + Math.round(H * 0.3);
    // andar de cima avançado
    R(X - 4, uTop, W + 8, gTop - uTop + 2, L.wall);
    for (let k = 0; k <= W + 8; k += 18) R(X - 4 + k, uTop, 3, gTop - uTop, L.beam);
    R(X - 4, uTop, W + 8, 3, L.beam);
    R(X - 4, gTop - 2, W + 8, 5, L.beam);
    for (let x = X + 8; x < X + W - 12; x += 26) win(x, uTop + 10, 12, 12, L);
    // telhado com a cumeeira paralela à rua
    ctx.fillStyle = L.roof;
    fillPolygon(X - 8, uTop + 2, X + 6, Y - 18, X + W - 6, Y - 18, X + W + 8, uTop + 2);
    roofLines(L, X - 6, X + W + 6, Y - 16, uTop);
    R(X + 6, Y - 20, W - 12, 4, shade(L.roof, -0.3));
    // térreo: parede, porta e a loja aberta com balcão
    R(X + 2, gTop, W - 4, g, shade(L.wall, -0.08));
    const dset = b.door.map((dx) => X + (dx - b.x) * TILE);
    const sx = dset[0] > X + W / 2 ? X + 8 : X + W - 62;
    R(sx, gTop + 6, 54, 22, "#2a1a10");
    R(sx + 2, gTop + 8, 50, 18, night() ? "#c9904a" : "#4a3020");
    const goods = ["#c94a3a", "#f2c14e", "#7aa04a", "#d9a46a", "#8a6ac0"];
    for (let i = 0; i < 6; i++) R(sx + 5 + i * 8, gTop + 16, 6, 6, goods[(i + L.h) % goods.length]);
    R(sx - 2, gTop + 28, 58, 5, "#8a6a42"); // balcão (a janela de baixo abaixada)
    // toldo listrado
    const c1 = ["#c94a3a", "#3a6a9a", "#3a8a5a", "#d9a03a"][L.h % 4];
    for (let i = 0; i < 8; i++) R(sx - 4 + i * 8, gTop - 2, 8, 9, i % 2 ? "#f2eee4" : c1);
    for (let i = 0; i < 8; i++) R(sx - 4 + i * 8 + 2, gTop + 7, 4, 2, i % 2 ? "#f2eee4" : c1);
    for (const d of dset) door(d, base, L, false);
    // placa pendurada
    const px = dset[0] > X + W / 2 ? X + W + 2 : X - 18;
    R(px, uTop + 26, 16, 2, "#2a2a2a");
    R(px + 2, uTop + 28, 12, 10, "#8a6a42");
    R(px + 5, uTop + 31, 6, 4, c1);
    chimney(b, X + W / 2 - 6, Y - 32, L);
  }

  // as formas vão se revezando pela rua: vizinho nunca tem a mesma casa
  const CYCLE = [2, 3, 5, 0, 6, 4, 1, 5, 2, 3];
  function assignForms(zid) {
    const Z = ZONES[zid];
    if (!Z || !Z.town) return;
    const list = Z.town.bld.filter((q) => COMMON.has(q.style) && q._form == null).sort((p, q) => p.y - q.y || p.x - q.x);
    const off = hash(zid.length, zid.charCodeAt(0)) % CYCLE.length;
    list.forEach((q, i) => (q._form = CYCLE[(i + off) % CYCLE.length]));
  }
  const dbBase = drawBuilding;
  drawBuilding = function (b, t) {
    if (!COMMON.has(b.style) || b.flats || b.big || b.small || (player && player.zone && player.zone.startsWith("pais-"))) return dbBase.apply(this, arguments);
    const famous = b.name && !/Casa para alugar|Casa à venda/.test(b.name);
    const mine = typeof isMyHomeBld === "function" && isMyHomeBld(b);
    if (famous || mine || b.w < 4 || b.h < 3) return dbBase.apply(this, arguments);
    const L = look(b);
    if (b._form == null) assignForms(player.zone);
    if (b._form != null) L.form = b._form;
    const F = FORMS[L.form];
    if (!F) return dbBase.apply(this, arguments);
    R = (x, y, w, hh, c) => ((ctx.fillStyle = c), ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(hh)));
    const X = b.x * TILE,
      Y = b.y * TILE,
      W = b.w * TILE,
      H = b.h * TILE,
      base = Y + H - 2;
    ctx.fillStyle = "rgba(0,0,0,.22)";
    ctx.fillRect(X + 6, base - 2, W, 8);
    F(b, L, t, X, Y, W, H, base);
  };
})();
