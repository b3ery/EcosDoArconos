/**
 * ECOS DO ARCANO — icones-medievais.js
 * Todos os ícones (itens, menus, balões) passam a seguir o mesmo padrão de
 * pixel art dos jogos de RPG: um contorno escuro (marrom quase preto, nunca
 * preto puro), luz sempre vindo do alto à esquerda e sombra embaixo à
 * direita, com 3 tons por cor. A ampulheta substitui o relógio moderno.
 * Modifica (envolve) funções de outros arquivos: iconHTML, drawPixelIcon.
 */

"use strict";

(() => {
  const OUTLINE = "rgba(42,26,16,.92)";
  const hex = (c) => {
    if (!c || c[0] !== "#") return null;
    let h = c.slice(1);
    if (h.length === 3) h = h.replace(/./g, (m) => m + m);
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  };
  const shade = (c, f) => {
    const v = hex(c);
    if (!v) return c;
    const m = f > 0 ? v.map((x) => x + (255 - x) * f) : v.map((x) => x * (1 + f));
    return `rgb(${m.map((x) => Math.max(0, Math.min(255, Math.round(x)))).join(",")})`;
  };

  // A ampulheta no lugar do relógio de ponteiro.
  if (typeof PIXEL_ICONS !== "undefined")
    PIXEL_ICONS.clock = {
      c: { w: "#8a5a2e", g: "#cfe8f0", s: "#f2c14e" },
      p: ["wwwwww..", ".gsssg..", "..gsg...", "...g....", "..gsg...", ".gsssg..", "wwwwww.."],
    };

  const cache = {};
  function build(key) {
    const icon = PIXEL_ICONS[key];
    if (!icon) return null;
    const rows = icon.p;
    const H = rows.length,
      Wd = Math.max(...rows.map((r) => r.length));
    const cell = (x, y) => (y >= 0 && y < H && x >= 0 && x < rows[y].length ? icon.c[rows[y][x]] || null : null);
    const cv = document.createElement("canvas");
    cv.width = Wd + 2;
    cv.height = H + 2;
    const g = cv.getContext("2d");
    // contorno
    g.fillStyle = OUTLINE;
    for (let y = -1; y <= H; y++)
      for (let x = -1; x <= Wd; x++) {
        if (cell(x, y)) continue;
        if (cell(x + 1, y) || cell(x - 1, y) || cell(x, y + 1) || cell(x, y - 1)) g.fillRect(x + 1, y + 1, 1, 1);
      }
    // cores com luz (alto-esquerda) e sombra (baixo-direita)
    for (let y = 0; y < H; y++)
      for (let x = 0; x < Wd; x++) {
        const c = cell(x, y);
        if (!c) continue;
        const lit = !cell(x, y - 1) || !cell(x - 1, y);
        const dark = !cell(x, y + 1) || !cell(x + 1, y);
        g.fillStyle = lit && !dark ? shade(c, 0.22) : dark && !lit ? shade(c, -0.22) : c;
        g.fillRect(x + 1, y + 1, 1, 1);
      }
    return { cv, w: Wd + 2, h: H + 2, url: cv.toDataURL() };
  }
  const get = (key) => (cache[key] !== undefined ? cache[key] : (cache[key] = build(key)));

  const ihBase = iconHTML,
    dpBase = drawPixelIcon;
  iconHTML = function (key, size = 16) {
    if (!key || key.startsWith("g:") || !PIXEL_ICONS[key]) return ihBase(key, size);
    const I = get(key);
    if (!I) return ihBase(key, size);
    return `<img class="pxi" src="${I.url}" width="${size}" height="${size}" alt="" style="image-rendering:pixelated">`;
  };
  drawPixelIcon = function (key, cx, cy, size = 2) {
    if (!key || key.startsWith("g:") || !PIXEL_ICONS[key]) return dpBase(key, cx, cy, size);
    const I = get(key);
    if (!I) return dpBase(key, cx, cy, size);
    const sm = ctx.imageSmoothingEnabled;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(I.cv, Math.round(cx - (I.w / 2) * size), Math.round(cy - (I.h / 2) * size), I.w * size, I.h * size);
    ctx.imageSmoothingEnabled = sm;
  };
  window.refreshIcons = () => Object.keys(cache).forEach((k) => delete cache[k]);
})();

/* ----- formatos de comida e objetos redesenhados à moda medieval ----- */
(() => {
  if (typeof GSHAPES === "undefined") return;
  const clay = "#b8693a",
    clayD = "#8a4a2a",
    clayL = "#d9935a";
  // caneco de barro (no lugar do copo de vidro)
  GSHAPES.glass = ({ R, E, set }, p) => {
    R(4, 4, 8, 10, clay);
    R(4, 4, 8, 2, clayL);
    R(5, 5, 6, 1, p.m);
    R(4, 9, 8, 1, clayD);
    R(12, 6, 2, 1, clay);
    R(13, 6, 1, 5, clay);
    R(12, 10, 2, 1, clay);
    R(5, 14, 6, 1, clayD);
    set(5, 7, clayL);
  };
  // jarra de barro bojuda com rolha (no lugar da garrafa de vidro)
  GSHAPES.bottle = ({ R, E, set }, p, v) => {
    E(8, 10, 5, 4.6, p.m);
    R(6, 3, 4, 4, p.m);
    R(6, 1, 4, 2, "#a8784a");
    R(5, 7, 6, 1, p.a);
    R(11, 5, 2, 1, p.m);
    R(12, 5, 1, 5, p.m);
    set(5, 9, "#ffffff");
    if (v % 2) R(5, 11, 6, 2, "#efe2c0");
  };
  // pote de barro com pano amarrado (mel)
  GSHAPES.honey = ({ R, E, set }, p) => {
    E(8, 10, 5, 4.6, clay);
    R(4, 4, 8, 3, "#efe2c0");
    R(3, 6, 10, 1, "#c94a4a");
    R(7, 7, 2, 2, p.m);
    R(6, 12, 4, 1, clayD);
    set(5, 9, clayL);
  };
  // xícara de barro (chás e infusões)
  GSHAPES.cup = ({ E, R, set }, p) => {
    E(7, 10, 5, 4, clay);
    R(2, 6, 10, 4, clay);
    R(3, 6, 8, 2, p.m);
    R(12, 8, 2, 3, clay);
    R(4, 14, 7, 1, clayD);
    set(5, 3, "#dfe8f0");
    set(8, 2, "#dfe8f0");
  };
  // candeia de óleo de barro (no lugar do abajur)
  GSHAPES.lamp = ({ E, R, set }, p) => {
    E(8, 11, 6, 3, clay);
    R(11, 9, 4, 2, clay);
    R(2, 10, 3, 2, clayD);
    set(14, 8, "#ffb04a");
    set(14, 7, "#ffe08a");
    set(13, 8, "#ff8a2a");
    R(5, 10, 5, 1, clayL);
  };
  // relógio de sol (no lugar do relógio de ponteiro)
  GSHAPES.clock = ({ E, R, L }, p) => {
    E(8, 11, 7, 3.5, "#bdb3a0");
    E(8, 10.5, 6, 2.6, "#d8d0c0");
    L(8, 10, 8, 3, "#5a4a3a");
    L(8, 3, 12, 10, "#5a4a3a");
    for (const [x, y] of [[3, 10], [13, 10], [8, 13]]) R(x, y, 1, 1, "#5a4a3a");
  };
  if (typeof gIconCache !== "undefined") for (const k of Object.keys(gIconCache)) delete gIconCache[k];
})();
