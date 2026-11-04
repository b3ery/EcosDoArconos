/**
 * ECOS DO ARCANO — 03-mapa-e-mundo.js
 * Desenho do mapa, clima, estações, interação com o mundo e vida das vilas.
 */

/* ===================== MAPA ===================== */

const THEMES = {
  vila: {
    g1: "#6c8f4e",
    g2: "#668948",
    dot: "#86a862",
    water: "#3f86c7",
  },
  bosque: {
    g1: "#3f6b3a",
    g2: "#3b6536",
    dot: "#5c8a4a",
    water: "#2f6f8f",
  },
  pantano: {
    g1: "#4a5a3c",
    g2: "#465637",
    dot: "#66764a",
    water: "#3c5e4f",
  },
  picos: {
    g1: "#8c8a86",
    g2: "#86847f",
    dot: "#a8a6a0",
    water: "#5aa0c8",
  },
  torre: {
    g1: "#3e3556",
    g2: "#3a3251",
    dot: "#51476b",
    water: "#3a2f5a",
  },
  interior: {
    g1: "#8a6038",
    g2: "#946840",
    dot: "#6b4423",
    water: "#3f86c7",
  },
  casa: {
    g1: "#8a6038",
    g2: "#946840",
    dot: "#6b4423",
    water: "#3f86c7",
  },
  escola: {
    g1: "#5a4632",
    g2: "#54412e",
    dot: "#6e573d",
    water: "#3a4f7a",
  },
  porto: {
    g1: "#cdb886",
    g2: "#c6af7c",
    dot: "#b39a64",
    water: "#2f8ac0",
  },
  serra: {
    g1: "#7d8a6a",
    g2: "#778464",
    dot: "#929f7c",
    water: "#4a8ab0",
  },
};
function tileAt(z, x, y) {
  const Z = ZONES[z];
  if (x < 0 || y < 0 || x >= Z.w || y >= Z.h) return null;
  return Z.map[y][x];
}
function walkable(z, x, y) {
  const c = tileAt(z, x, y);
  if (c === null) return false;
  if (z === "interior") {
    if (c === "X") return true;
    const ip = interPropAt(x, y);
    if (
      c === "." &&
      ((ip && SOLID_PROPS.has(ip[0])) ||
        interPersonAt(x, y) ||
        (game.inter && x === game.inter.kx && y === game.inter.ky))
    )
      return false;
  }
  if (z === "casa") {
    if (c === "X") return true;
    if (c === "." && furnAt(x, y, true)) return false;
  }
  if (
    c === "." ||
    c === "," ||
    c === "P" ||
    c === "E" ||
    c === "L" ||
    c === "=" ||
    c === "g" ||
    c === "w" ||
    c === "u"
  )
    return true;
  if (ZONES[z].town && "bxhnkqAozYVZtRp".includes(c)) return true;
  if (c === "N" && z === player.zone && npcHidden(ZONES[z].npcs[x + "," + y])) return true;
  if (c === "B") return player.runes.length >= 4;
  if (c === "G") return player.guards.includes(z);
  return false;
}
function ground(th, X, Y, h) {
  ctx.fillStyle = h < 0.5 ? th.g1 : th.g2;
  ctx.fillRect(X, Y, TILE, TILE);
  ctx.fillStyle = th.dot;
  if (h > 0.3) {
    ctx.fillRect(X + Math.floor(h * 24) + 2, Y + Math.floor((1 - h) * 22) + 4, 2, 2);
  }
  if (h > 0.7) {
    ctx.fillRect(X + Math.floor((1 - h) * 20) + 6, Y + Math.floor(h * 14) + 12, 2, 1);
  }
  const zt = ZONES[player.zone] && ZONES[player.zone].theme;
  if (zt === "vila" || zt === "bosque" || zt === "serra" || zt === "porto") {
    const sid = season().id;
    if (sid === "inv" && zt !== "porto") {
      ctx.fillStyle = "rgba(236,242,248,.72)";
      ctx.fillRect(X, Y, TILE, TILE);
      ctx.fillStyle = "rgba(180,200,220,.6)";
      if (h > 0.4) ctx.fillRect(X + Math.floor(h * 22) + 3, Y + Math.floor((1 - h) * 20) + 5, 4, 2);
    } else if (sid === "out") {
      ctx.fillStyle = "rgba(190,120,30,.28)";
      ctx.fillRect(X, Y, TILE, TILE);
      if (h > 0.6) {
        ctx.fillStyle = h > 0.8 ? "#c9622a" : "#e0a040";
        ctx.fillRect(X + Math.floor(h * 24) + 2, Y + Math.floor((1 - h) * 20) + 6, 3, 2);
      }
    } else if (sid === "ver") {
      ctx.fillStyle = "rgba(230,210,90,.12)";
      ctx.fillRect(X, Y, TILE, TILE);
    } else if (sid === "pri" && h > 0.86) {
      ctx.fillStyle = ["#ff9ac8", "#fff", "#f5d76e"][Math.floor(h * 100) % 3];
      ctx.fillRect(X + Math.floor(h * 24) + 3, Y + Math.floor((1 - h) * 22) + 5, 2, 2);
    }
  }
  if (zt === "bosque" || zt === "vila") {
    if (h > 0.955) {
      ctx.fillStyle = "#efe2c0";
      ctx.fillRect(X + 10, Y + 20, 2, 4);
      ctx.fillStyle = "#c94a4a";
      ctx.fillRect(X + 8, Y + 17, 6, 3);
      ctx.fillStyle = "#fff";
      ctx.fillRect(X + 9, Y + 17, 1, 1);
    } else if (h > 0.91 && zt === "bosque") {
      ctx.fillStyle = "#4a8a3a";
      for (let i = 0; i < 4; i++) ctx.fillRect(X + 8 + i * 4, Y + 14 + (i % 2) * 3, 2, 8);
    }
  } else if (zt === "pantano") {
    if (h > 0.9) {
      ctx.fillStyle = "#55603a";
      for (let i = 0; i < 3; i++) ctx.fillRect(X + 8 + i * 5, Y + 12 + i, 2, 12);
      ctx.fillStyle = "#6b4a2a";
      ctx.fillRect(X + 8, Y + 10, 2, 4);
    }
  } else if (zt === "picos") {
    if (h > 0.88) {
      ctx.fillStyle = "#6a6760";
      ctx.fillRect(X + 8, Y + 18, 5, 3);
      ctx.fillRect(X + 18, Y + 12, 3, 2);
    }
    if (h < 0.06) {
      ctx.fillStyle = "#e8eef3";
      ctx.fillRect(X + 4, Y + 20, 12, 4);
    }
  } else if (zt === "escola") {
    if (h > 0.93) {
      ctx.fillStyle = "#efe2c0";
      ctx.fillRect(X + 8, Y + 18, 8, 6);
      ctx.fillStyle = "#5a2d8a";
      ctx.fillRect(X + 8, Y + 18, 8, 1);
    }
  }
}
function drawWall(theme, X, Y, h, t) {
  if (theme === "porto") {
    ctx.fillStyle = "#7a5530";
    ctx.fillRect(X, Y, TILE, TILE);
    ctx.fillStyle = "#5a3d22";
    for (let i = 0; i < 4; i++) {
      ctx.fillRect(X + i * 8, Y, 1, TILE);
    }
    ctx.fillStyle = "#9a7040";
    for (let i = 0; i < 4; i++) fillPolygon(X + i * 8, Y + 4, X + i * 8 + 4, Y, X + i * 8 + 8, Y + 4);
    ctx.fillStyle = "#4a2e17";
    ctx.fillRect(X, Y + 10, TILE, 2);
    ctx.fillRect(X, Y + 24, TILE, 2);
    return;
  }
  if (theme === "serra") {
    ctx.fillStyle = "#6a6f62";
    fillPolygon(X, Y + 32, X + 3, Y + 8, X + 14, Y + 1, X + 28, Y + 6, X + 32, Y + 32);
    ctx.fillStyle = "#858b7c";
    fillPolygon(X + 3, Y + 8, X + 14, Y + 1, X + 18, Y + 12, X + 6, Y + 16);
    ctx.fillStyle = "#4f5448";
    ctx.fillRect(X + 20, Y + 14, 6, 2);
    ctx.fillRect(X + 8, Y + 22, 8, 2);
    return;
  }
  if (theme === "vila") {
    ctx.fillStyle = "#7f796d";
    ctx.fillRect(X, Y, TILE, TILE);
    ctx.fillStyle = "#69645a";
    for (let r = 0; r < 4; r++) {
      ctx.fillRect(X, Y + r * 8 + 7, TILE, 1);
      const o = (r % 2) * 8;
      for (let k = 0; k < 3; k++) ctx.fillRect(X + o + k * 16, Y + r * 8, 1, 7);
    }
    ctx.fillStyle = "#9a9487";
    ctx.fillRect(X, Y, TILE, 2);
  } else if (theme === "bosque") {
    const sid = season().id,
      tc =
        sid === "out"
          ? ["#8a3a12", "#b85a1a", "#e0903a"]
          : sid === "inv"
            ? ["#1f3a2e", "#2a4a3a", "#3d5e4a"]
            : sid === "pri"
              ? ["#24502a", "#3a7a3a", "#7ab04a"]
              : ["#1f3d22", "#2c5530", "#3d6e3a"];
    ctx.fillStyle = "#4a3020";
    ctx.fillRect(X + 13, Y + 18, 6, 14);
    ctx.fillStyle = tc[0];
    circle(X + 16, Y + 13, 14);
    ctx.fillStyle = tc[1];
    circle(X + 11, Y + 10, 7);
    circle(X + 21, Y + 15, 6);
    ctx.fillStyle = tc[2];
    circle(X + 12, Y + 8, 3);
    if (sid === "inv") {
      ctx.fillStyle = "#f2f6fa";
      ctx.beginPath();
      ctx.ellipse(X + 15, Y + 3, 10, 4, 0, 0, 7);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(X + 22, Y + 9, 5, 3, 0, 0, 7);
      ctx.fill();
    }
    if (sid === "pri" && h > 0.5) {
      ctx.fillStyle = "#ffb3d0";
      ctx.fillRect(X + 8, Y + 12, 2, 2);
      ctx.fillRect(X + 19, Y + 7, 2, 2);
      ctx.fillRect(X + 22, Y + 16, 2, 2);
    }
  } else if (theme === "pantano") {
    if (h < 0.5) {
      ctx.fillStyle = "#3a2f24";
      ctx.fillRect(X + 14, Y + 6, 4, 26);
      ctx.fillRect(X + 8, Y + 10, 6, 3);
      ctx.fillRect(X + 18, Y + 14, 7, 3);
      ctx.fillRect(X + 7, Y + 5, 3, 6);
      ctx.fillRect(X + 23, Y + 10, 2, 5);
    } else {
      for (let i = 0; i < 5; i++) {
        const o = (i * 7) % 8;
        ctx.fillStyle = "#55603a";
        ctx.fillRect(X + 4 + i * 5, Y + 10 + o, 2, 22 - o);
        ctx.fillStyle = "#6b4a2a";
        ctx.fillRect(X + 4 + i * 5, Y + 8 + o, 2, 4);
      }
    }
  } else if (theme === "picos") {
    ctx.fillStyle = "#5d5a56";
    fillPolygon(X + 1, Y + 31, X + 9, Y + 6, X + 20, Y + 2, X + 30, Y + 14, X + 31, Y + 31);
    ctx.fillStyle = "#77736d";
    fillPolygon(X + 9, Y + 6, X + 20, Y + 2, X + 24, Y + 9, X + 12, Y + 13);
    ctx.fillStyle = "#e8eef3";
    fillPolygon(X + 13, Y + 5, X + 20, Y + 2, X + 23, Y + 7, X + 16, Y + 8);
  } else if (theme === "escola") {
    ctx.fillStyle = "#2c3550";
    ctx.fillRect(X, Y, TILE, TILE);
    ctx.fillStyle = "#3d4a6e";
    for (let r = 0; r < 4; r++) {
      ctx.fillRect(X, Y + r * 8 + 7, TILE, 1);
      const o = (r % 2) * 10;
      ctx.fillRect(X + o + 4, Y + r * 8, 1, 7);
      ctx.fillRect(X + o + 18, Y + r * 8, 1, 7);
    }
    if (h < 0.18) {
      ctx.fillStyle = "#6b4423";
      ctx.fillRect(X + 4, Y + 6, 24, 22);
      ctx.fillStyle = ["#c94a4a", "#4a74c9", "#5a9a4a", "#d9a441"][Math.floor(h * 40) % 4];
      for (let i = 0; i < 5; i++) ctx.fillRect(X + 6 + i * 4, Y + 9, 3, 7);
      ctx.fillStyle = "#8a5a2e";
      for (let i = 0; i < 5; i++) ctx.fillRect(X + 6 + i * 4, Y + 19, 3, 7);
    }
  } else {
    ctx.fillStyle = "#1d1729";
    ctx.fillRect(X, Y, TILE, TILE);
    ctx.fillStyle = "#2b2240";
    for (let r = 0; r < 4; r++) {
      ctx.fillRect(X, Y + r * 8 + 7, TILE, 1);
      const o = (r % 2) * 10;
      ctx.fillRect(X + o + 4, Y + r * 8, 1, 7);
      ctx.fillRect(X + o + 18, Y + r * 8, 1, 7);
    }
    if (h < 0.22) {
      ctx.save();
      ctx.globalAlpha = 0.4 + 0.4 * Math.sin(t * 2 + h * 20);
      glyph(ORDER[Math.floor(h * 16) % 4], X + 16, Y + 16, 10);
      ctx.restore();
    }
  }
}
const HOUSE_STYLE = {
  "3,3": "home",
  "29,8": "hosp",
  "21,6": "forja",
  "24,18": "troca",
  "29,18": "estab",
};
function houseStyle(z, x, y) {
  if (z !== "vila") return null;
  const m = ZONES[z].map;
  const tx = x > 0 && m[y][x - 1] === "H" ? x - 1 : x,
    ty = y > 0 && m[y - 1][x] === "H" ? y - 1 : y;
  return HOUSE_STYLE[tx + "," + ty] || null;
}
function house(z, x, y, X, Y, t) {
  const m = ZONES[z].map;
  const top = !(y > 0 && m[y - 1][x] === "H");
  const leftH = x > 0 && m[y][x - 1] === "H";
  const st = houseStyle(z, x, y);
  if (top) {
    const rc =
      st === "home"
        ? ["#2f4f99", "#3f66bf", "#1d3166"]
        : st === "hosp"
          ? ["#d8d2c4", "#f2eee4", "#a39d90"]
          : st === "forja"
            ? ["#4a4a52", "#5e5e68", "#2a2a30"]
            : st === "troca"
              ? ["#6a3a8a", "#8a52ad", "#3d1f52"]
              : st === "estab"
                ? ["#8a6a3a", "#a8844e", "#5a4220"]
                : ["#8c3b2e", "#a8483a", "#5e2820"];
    ctx.fillStyle = rc[0];
    ctx.fillRect(X, Y + 4, TILE, 28);
    ctx.fillStyle = rc[1];
    for (let r = 0; r < 4; r++) ctx.fillRect(X, Y + 6 + r * 7, TILE, 3);
    ctx.fillStyle = rc[2];
    ctx.fillRect(X, Y + 29, TILE, 3);
    if (leftH && st !== "hosp") {
      ctx.fillStyle = "#6b6258";
      ctx.fillRect(X + 16, Y - 2, 6, 10);
      if (st === "forja") {
        ctx.fillStyle = `rgba(255,${120 + Math.floor(Math.sin(t * 6) * 40)},40,.8)`;
        ctx.fillRect(X + 17, Y - 5, 4, 4);
      }
    }
    if (leftH && st === "hosp") {
      ctx.fillStyle = "#e0303a";
      ctx.fillRect(X - 4, Y + 8, 8, 20);
      ctx.fillRect(X - 10, Y + 14, 20, 8);
    }
  } else {
    ctx.fillStyle = "#e3d3b0";
    ctx.fillRect(X, Y, TILE, TILE - 2);
    ctx.fillStyle = "#b8a47e";
    ctx.fillRect(X, Y + TILE - 4, TILE, 2);
    if (leftH) {
      ctx.fillStyle = "#5a3a22";
      ctx.fillRect(X + 4, Y + 10, 11, 20);
      ctx.fillStyle = "#f2c14e";
      ctx.fillRect(X + 12, Y + 20, 2, 2);
    } else {
      ctx.fillStyle = "#3b5e8a";
      ctx.fillRect(X + 10, Y + 8, 14, 10);
      ctx.fillStyle = "#f6d77a";
      ctx.fillRect(X + 11, Y + 9, 5, 4);
    }
  }
}
function poolRim(X, Y, x, y) {
  const w = (a, b) => {
    const c = tileAt("vila", a, b);
    return c === "~" || c === "F";
  };
  ctx.fillStyle = "#b8b2a4";
  if (!w(x, y - 1)) ctx.fillRect(X, Y, TILE, 5);
  if (!w(x, y + 1)) ctx.fillRect(X, Y + TILE - 5, TILE, 5);
  if (!w(x - 1, y)) ctx.fillRect(X, Y, 5, TILE);
  if (!w(x + 1, y)) ctx.fillRect(X + TILE - 5, Y, 5, TILE);
  ctx.fillStyle = "#8a8478";
  if (!w(x, y + 1)) ctx.fillRect(X, Y + TILE - 2, TILE, 2);
}
function water(th, X, Y, t, h) {
  ctx.fillStyle = th.water;
  ctx.fillRect(X, Y, TILE, TILE);
  ctx.fillStyle = shade(th.water, 0.25);
  for (let i = 0; i < 3; i++) {
    const ox = (t * 14 + h * 40 + i * 13) % (TILE - 7);
    ctx.fillRect(X + ox, Y + 6 + i * 10, 7, 2);
  }
  {
    const x = X / TILE,
      y = Y / TILE,
      wt = (a, b) => {
        const c = tileAt(player.zone, a, b);
        return c === "~" || c === "=" || c === "F" || c === null;
      };
    const sc = shade(th.water, 0.45),
      dk = shade(th.water, -0.25);
    if (!wt(x, y - 1)) {
      ctx.fillStyle = dk;
      ctx.fillRect(X, Y, TILE, 4);
      ctx.fillStyle = sc;
      for (let i = 0; i < 4; i++) ctx.fillRect(X + i * 8 + (((h * 5) | 0) % 4), Y + 4, 5, 2);
    }
    if (!wt(x, y + 1)) {
      ctx.fillStyle = sc;
      ctx.fillRect(X, Y + TILE - 3, TILE, 3);
    }
    if (!wt(x - 1, y)) {
      ctx.fillStyle = sc;
      ctx.fillRect(X, Y, 3, TILE);
    }
    if (!wt(x + 1, y)) {
      ctx.fillStyle = sc;
      ctx.fillRect(X + TILE - 3, Y, 3, TILE);
    }
  }
  if (
    player.day &&
    season().id === "inv" &&
    ZONES[player.zone] &&
    ["vila", "bosque", "serra", "picos"].includes(ZONES[player.zone].theme)
  ) {
    ctx.fillStyle = "rgba(225,240,255,.55)";
    ctx.fillRect(X, Y, TILE, TILE);
    ctx.fillStyle = "rgba(255,255,255,.7)";
    ctx.fillRect(X + h * 20, Y + 6, 8, 1);
    ctx.fillRect(X + 4, Y + (1 - h) * 24 + 4, 6, 1);
    return;
  }
  if (h > 0.82) {
    ctx.fillStyle = "#3d8a3a";
    ctx.beginPath();
    ctx.arc(X + 12 + h * 8, Y + 16, 6, 0.4, Math.PI * 2 - 0.2);
    ctx.lineTo(X + 12 + h * 8, Y + 16);
    ctx.fill();
    if (h > 0.92) {
      ctx.fillStyle = "#ff9ac8";
      ctx.fillRect(X + 10 + h * 8, Y + 13, 4, 3);
      ctx.fillStyle = "#fff";
      ctx.fillRect(X + 11 + h * 8, Y + 12, 2, 2);
    }
  }
  if (Math.sin(t * 3 + h * 40) > 0.96) {
    ctx.fillStyle = "#fff";
    ctx.fillRect(X + h * 24, Y + (1 - h) * 24, 2, 2);
  }
}
function inPlazaT(z, x, y) {
  return z === "vila" && x >= 25 && x <= 38 && y >= 15 && y <= 24;
}
function cobble(X, Y, x, y) {
  ctx.fillStyle = "#9a9488";
  ctx.fillRect(X, Y, TILE, TILE);
  ctx.fillStyle = "#857f73";
  for (let r = 0; r < 4; r++) {
    const off = (r + y) % 2 ? 8 : 0;
    for (let c = 0; c < 3; c++) {
      const bx = X + ((c * 16 + off) % TILE),
        by = Y + r * 8;
      ctx.fillRect(bx, by, 1, 8);
    }
    ctx.fillRect(X, Y + r * 8, TILE, 1);
  }
  ctx.fillStyle = "rgba(255,255,255,.06)";
  ctx.fillRect(X + ((x * 7 + y * 3) % 4) * 8 + 2, Y + ((x + y) % 4) * 8 + 2, 5, 3);
  if ((x + y) % 2 === 0 && x >= 27 && x <= 35 && y >= 17 && y <= 22) {
    ctx.fillStyle = "rgba(200,170,110,.18)";
    ctx.fillRect(X, Y, TILE, TILE);
  }
}
function drawPathTile(X, Y, h) {
  ctx.fillStyle = "#a8916a";
  ctx.fillRect(X, Y, TILE, TILE);
  ctx.fillStyle = "#937d58";
  ctx.fillRect(X + Math.floor(h * 26) + 2, Y + Math.floor((1 - h) * 26) + 2, 3, 2);
  ctx.fillRect(X + Math.floor((1 - h) * 22) + 5, Y + Math.floor(h * 20) + 8, 2, 2);
}
const ON_PATH = "nSJlbxkRWNCPMKhTwqtAoZYVzuE";
/** Coqueiro do litoral. */
function drawPalm(X, Y, h, t) {
  const sway = Math.sin(t * 1.2 + h * 6) * 2;
  ctx.fillStyle = "rgba(0,0,0,.2)";
  ctx.beginPath();
  ctx.ellipse(X + 16, Y + 29, 9, 3, 0, 0, 7);
  ctx.fill();
  ctx.fillStyle = "#8a6038";
  for (let i = 0; i < 6; i++) ctx.fillRect(X + 13 + i * 0.6, Y + 28 - i * 5, 5, 6);
  ctx.fillStyle = "#3d8a3a";
  const cx = X + 17 + sway,
    cy = Y - 2;
  fillPolygon(cx, cy, cx - 18, cy + 6, cx - 14, cy + 2);
  fillPolygon(cx, cy, cx + 18, cy + 6, cx + 14, cy + 2);
  fillPolygon(cx, cy, cx - 10, cy - 10, cx - 4, cy - 4);
  fillPolygon(cx, cy, cx + 10, cy - 10, cx + 4, cy - 4);
  ctx.fillStyle = "#5aa84a";
  fillPolygon(cx, cy, cx - 16, cy + 3, cx - 8, cy);
  fillPolygon(cx, cy, cx + 16, cy + 3, cx + 8, cy);
  ctx.fillStyle = "#6b4423";
  circle(cx - 2, cy + 3, 2.5);
  circle(cx + 2, cy + 4, 2.5);
}

/** Pinheiro da serra (com neve no inverno). */
function drawPine(X, Y, h) {
  ctx.fillStyle = "rgba(0,0,0,.2)";
  ctx.beginPath();
  ctx.ellipse(X + 16, Y + 29, 9, 3, 0, 0, 7);
  ctx.fill();
  ctx.fillStyle = "#4a3020";
  ctx.fillRect(X + 14, Y + 22, 4, 8);
  const greens = ["#1f4a32", "#2a5a3a", "#356a44"];
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = greens[i];
    fillPolygon(X + 16, Y - 8 + i * 9, X + 4 + i * 1, Y + 10 + i * 6, X + 28 - i * 1, Y + 10 + i * 6);
  }
  if (season().id === "inv") {
    ctx.fillStyle = "#f2f6fa";
    fillPolygon(X + 16, Y - 8, X + 12, Y - 1, X + 20, Y - 1);
    ctx.fillRect(X + 8, Y + 15, 16, 2);
  }
}

function drawTile(z, x, y, c, t) {
  const theme = ZONES[z].theme,
    th = THEMES[theme],
    X = x * TILE,
    Y = y * TILE,
    h = tileHash(x, y);
  ground(th, X, Y, h);
  if (
    (inPlazaT(z, x, y) || inMarket(z, x, y)) &&
    (c === "," || ON_PATH.includes(c) || c === "p" || c === "y" || c === "M" || c === "N")
  ) {
    cobble(X, Y, x, y);
    if (c === ",") return;
  } else if (ON_PATH.includes(c) && ZONES[z].town) {
    let n = 0,
      g = 0;
    for (const [dx, dy] of DIRS4) {
      const q = tileAt(z, x + dx, y + dy);
      if (q === "," || q === "=") n++;
      else if (q === "." || q === "w" || q === "u") g++;
    }
    if (n >= 2 || (n >= 1 && g === 0)) drawPathTile(X, Y, h);
  }
  if (theme === "vila" && c === "." && h > 0.94) {
    ctx.fillStyle = ["#f5d76e", "#e9799a", "#fff"][Math.floor(h * 1000) % 3];
    ctx.fillRect(X + 10, Y + 12, 3, 3);
    ctx.fillRect(X + 20, Y + 20, 3, 3);
  }
  if (ZONES[z].town && (c === "H" || c === "D" || c === "M")) {
    if (
      !inMarket(z, x, y) &&
      !inPlazaT(z, x, y) &&
      DIRS4.concat([
        [1, 1],
        [-1, 1],
        [1, -1],
        [-1, -1],
        [0, 2],
        [2, 0],
        [-2, 0],
      ]).some(([dx, dy]) => {
        const q = tileAt(z, x + dx, y + dy);
        return q === "," || q === "=";
      })
    )
      drawPathTile(X, Y, h);
    return;
  }
  if (theme === "interior" && game.inter) {
    const pl = game.inter.pal,
      zz = ZONES.interior;
    if (c === "." || c === "X") {
      ctx.fillStyle = y % 2 ? pl[0] : pl[1];
      ctx.fillRect(X, Y, TILE, TILE);
      ctx.fillStyle = pl[2];
      if (pl === INTER_PAL.stone) {
        ctx.fillRect(X, Y, TILE, 1);
        ctx.fillRect(X, Y, 1, TILE);
        ctx.fillRect(X + (y % 2 ? 16 : 0), Y, 1, TILE);
      } else {
        ctx.fillRect(X, Y + 15, TILE, 1);
        ctx.fillRect(X + ((x + y) % 2 ? 8 : 24), Y, 1, 15);
        ctx.fillRect(X + ((x + y) % 2 ? 20 : 4), Y + 16, 1, 16);
      }
      if (c === "X") {
        ctx.fillStyle = "#6a2a2a";
        ctx.fillRect(X + 2, Y + 18, 28, 12);
        ctx.fillStyle = "#f2c14e";
        ctx.fillRect(X + 4, Y + 20, 24, 1);
      }
      return;
    }
    if (c === "Q") {
      ctx.fillStyle = y % 2 ? pl[0] : pl[1];
      ctx.fillRect(X, Y, TILE, TILE);
      ctx.fillStyle = "#6b4423";
      ctx.fillRect(X, Y + 6, TILE, 24);
      ctx.fillStyle = "#a8784a";
      ctx.fillRect(X, Y + 4, TILE, 6);
      ctx.fillStyle = "#4a2e17";
      ctx.fillRect(X, Y + 28, TILE, 3);
      const st = game.inter.st,
        k = x % 4;
      ctx.fillStyle = "#8a5a2e";
      ctx.fillRect(X + 4, Y + 12, 24, 1);
      if (k === 0) {
        ctx.fillStyle = "#c9a050";
        ctx.fillRect(X + 8, Y - 4, 2, 8);
        ctx.fillRect(X + 4, Y - 4, 10, 2);
        ctx.fillRect(X + 4, Y - 2, 3, 3);
        ctx.fillRect(X + 11, Y - 2, 3, 3);
      } else if (k === 1) {
        const cs =
          {
            padaria: "#d9a441",
            taverna: "#d9b84a",
            boticario: "#7ad36b",
            acougue: "#c94a4a",
            emporio: "#c77dff",
            perola: "#5fd0ff",
            cristal: "#9fd8ff",
          }[st] || "#bfe0f0";
        ctx.fillStyle = cs;
        ctx.fillRect(X + 6, Y - 3, 6, 7);
        ctx.fillRect(X + 15, Y - 5, 6, 9);
        ctx.fillStyle = "rgba(255,255,255,.4)";
        ctx.fillRect(X + 7, Y - 2, 2, 3);
      } else if (k === 2) {
        ctx.fillStyle = "#f2eee4";
        ctx.fillRect(X + 6, Y, 12, 4);
        ctx.fillStyle = "#3a2414";
        ctx.fillRect(X + 8, Y + 1, 8, 1);
        ctx.fillStyle = "#f2c14e";
        circle(X + 24, Y + 1, 3);
      } else {
        ctx.fillStyle = "#f2eee4";
        ctx.fillRect(X + 12, Y - 6, 3, 9);
        ctx.fillStyle = "#ffd66b";
        ctx.fillRect(X + 12, Y - 9, 3, 3);
      }
      return;
    }
    if (y === 1 && x > 0 && x < zz.w - 1) {
      ctx.fillStyle = pl[3];
      ctx.fillRect(X, Y, TILE, TILE);
      ctx.fillStyle = "rgba(0,0,0,.08)";
      for (let k = 0; k < 4; k++) ctx.fillRect(X + k * 8 + 3, Y, 2, 22);
      ctx.fillStyle = "#6b4423";
      ctx.fillRect(X, Y + 22, TILE, 10);
      if (x % 4 === 2) {
        ctx.fillStyle = "#4a2e17";
        ctx.fillRect(X + 5, Y + 3, 22, 16);
        ctx.fillStyle = isNight() ? "#1a2a4a" : "#9fd0f0";
        ctx.fillRect(X + 7, Y + 5, 18, 12);
        ctx.fillStyle = "#4a2e17";
        ctx.fillRect(X + 15, Y + 5, 2, 12);
      } else wallDecor(game.inter.st, X, Y, x, t);
      return;
    }
    ctx.fillStyle = "#2a1a10";
    ctx.fillRect(X, Y, TILE, TILE);
    ctx.fillStyle = "#3a2414";
    ctx.fillRect(X + 2, Y + 2, TILE - 4, TILE - 4);
    return;
  }
  if (z === "vila" && inPlazaT(z, x, y) && c === "~") {
    ctx.fillStyle = "#3f9ad7";
    ctx.fillRect(X, Y, TILE, TILE);
    ctx.fillStyle = "#6cc0f0";
    for (let i = 0; i < 2; i++) {
      const ox = (t * 10 + h * 40 + i * 15) % (TILE - 8);
      ctx.fillRect(X + ox, Y + 9 + i * 11, 8, 2);
    }
    poolRim(X, Y, x, y);
    return;
  }
  if (theme === "casa") {
    if (c === "." || c === "X") {
      ctx.fillStyle = y % 2 ? "#8a6038" : "#946840";
      ctx.fillRect(X, Y, TILE, TILE);
      ctx.fillStyle = "#6b4423";
      ctx.fillRect(X, Y + 15, TILE, 1);
      ctx.fillRect(X + ((x + y) % 2 ? 8 : 24), Y, 1, 15);
      ctx.fillRect(X + ((x + y) % 2 ? 20 : 4), Y + 16, 1, 16);
      if (c === "X") {
        ctx.fillStyle = "#4a3a6a";
        ctx.fillRect(X + 2, Y + 18, 28, 12);
        ctx.fillStyle = "#f2c14e";
        ctx.fillRect(X + 4, Y + 20, 24, 1);
      }
      return;
    }
    if (y === 1 && x > 0 && x < ZONES.casa.w - 1) {
      ctx.fillStyle = "#e8d8b8";
      ctx.fillRect(X, Y, TILE, TILE);
      ctx.fillStyle = "#d4c09a";
      for (let k = 0; k < 4; k++) ctx.fillRect(X + k * 8 + 3, Y, 2, 22);
      ctx.fillStyle = "#6b4423";
      ctx.fillRect(X, Y + 22, TILE, 10);
      ctx.fillStyle = "#8a5a2e";
      ctx.fillRect(X, Y + 22, TILE, 2);
      if (x === 3 || x === 8 || x === 11) {
        ctx.fillStyle = "#4a2e17";
        ctx.fillRect(X + 5, Y + 3, 22, 16);
        ctx.fillStyle = isNight() ? "#1a2a4a" : "#9fd0f0";
        ctx.fillRect(X + 7, Y + 5, 18, 12);
        ctx.fillStyle = "#4a2e17";
        ctx.fillRect(X + 15, Y + 5, 2, 12);
        ctx.fillRect(X + 7, Y + 10, 18, 2);
        if (isNight()) {
          ctx.fillStyle = "#fff";
          ctx.fillRect(X + 10, Y + 7, 1, 1);
          ctx.fillRect(X + 21, Y + 12, 1, 1);
        }
      }
      return;
    }
    ctx.fillStyle = "#3a2414";
    ctx.fillRect(X, Y, TILE, TILE);
    ctx.fillStyle = "#4a2e17";
    ctx.fillRect(X + 2, Y + 2, TILE - 4, TILE - 4);
    return;
  }
  switch (c) {
    case "#":
      drawWall(theme, X, Y, h, t);
      break;
    case "=":
      ctx.fillStyle = "#3f86c7";
      ctx.fillRect(X, Y, TILE, TILE);
      ctx.fillStyle = "#8a6038";
      ctx.fillRect(X, Y + 2, TILE, 28);
      ctx.fillStyle = "#6b4423";
      for (let i = 0; i < 4; i++) ctx.fillRect(X, Y + 2 + i * 7, TILE, 2);
      ctx.fillStyle = "#4a2e17";
      ctx.fillRect(X, Y, TILE, 3);
      ctx.fillRect(X, Y + 29, TILE, 3);
      break;
    case "g":
      ctx.fillStyle = "#7a5a32";
      ctx.fillRect(X, Y, TILE, TILE);
      ctx.fillStyle = "#5f4426";
      for (let i = 0; i < 4; i++) ctx.fillRect(X, Y + i * 8 + 6, TILE, 2);
      ctx.fillStyle = isNight() ? "#8a8a3a" : "#d9c25a";
      for (let i = 0; i < 4; i++) {
        const sw = Math.sin(t * 2 + x + i) * 1.5;
        ctx.fillRect(X + 3 + i * 8 + sw, Y + 2, 2, 6);
        ctx.fillRect(X + 3 + i * 8 + sw, Y + 18, 2, 6);
      }
      ctx.fillStyle = "#7ab04a";
      for (let i = 0; i < 4; i++) {
        ctx.fillRect(X + 2 + i * 8, Y + 8, 4, 2);
        ctx.fillRect(X + 2 + i * 8, Y + 24, 4, 2);
      }
      break;
    case "w":
      for (let i = 0; i < 5; i++) {
        const fx = X + 4 + ((h * 97 + i * 13) % 24),
          fy = Y + 4 + ((h * 53 + i * 17) % 24);
        ctx.fillStyle = "#3d6e2a";
        ctx.fillRect(fx, fy + 2, 2, 4);
        ctx.fillStyle = ["#ff6b8a", "#f5d76e", "#fff", "#c77dff", "#ff9a3c"][(i + Math.floor(h * 10)) % 5];
        ctx.fillRect(fx - 1, fy, 4, 3);
      }
      break;
    case "f": {
      const F = (a, b) => {
          const c2 = tileAt(z, a, b);
          return c2 === "f";
        },
        L = F(x - 1, y),
        R = F(x + 1, y),
        U = F(x, y - 1),
        D = F(x, y + 1);
      ctx.fillStyle = "#a8784a";
      if (L) {
        ctx.fillRect(X, Y + 11, 16, 3);
        ctx.fillRect(X, Y + 19, 16, 3);
      }
      if (R) {
        ctx.fillRect(X + 16, Y + 11, 16, 3);
        ctx.fillRect(X + 16, Y + 19, 16, 3);
      }
      if (U) {
        ctx.fillRect(X + 13, Y, 3, 14);
        ctx.fillRect(X + 17, Y, 3, 14);
      }
      if (D) {
        ctx.fillRect(X + 13, Y + 14, 3, 18);
        ctx.fillRect(X + 17, Y + 14, 3, 18);
      }
      ctx.fillStyle = "rgba(0,0,0,.22)";
      ctx.fillRect(X + 12, Y + 26, 9, 3);
      ctx.fillStyle = "#6b4423";
      ctx.fillRect(X + 13, Y + 6, 6, 22);
      ctx.fillStyle = "#8a6038";
      ctx.fillRect(X + 13, Y + 5, 6, 3);
      break;
    }
    case "l": {
      const lit = nightAlpha() > 0.1 || ["chuva", "tempestade", "neblina"].includes(player.weather);
      ctx.fillStyle = "rgba(0,0,0,.25)";
      ctx.beginPath();
      ctx.ellipse(X + 16, Y + 30, 8, 2.5, 0, 0, 7);
      ctx.fill();
      ctx.fillStyle = "#2a2a30";
      ctx.fillRect(X + 11, Y + 26, 10, 4);
      ctx.fillRect(X + 13, Y + 22, 6, 4);
      ctx.fillRect(X + 15, Y + 2, 2, 22);
      ctx.fillStyle = "#3a3a44";
      ctx.fillRect(X + 14, Y + 12, 4, 2);
      ctx.fillStyle = "#2a2a30";
      ctx.fillRect(X + 10, Y - 6, 12, 2);
      fillPolygon(X + 11, Y - 6, X + 21, Y - 6, X + 16, Y - 11);
      ctx.fillRect(X + 11, Y - 4, 1, 9);
      ctx.fillRect(X + 20, Y - 4, 1, 9);
      ctx.fillRect(X + 10, Y + 5, 12, 2);
      ctx.fillStyle = lit ? `rgba(255,214,107,${0.85 + 0.15 * Math.sin(t * 9 + x)})` : "#cfd8e0";
      ctx.fillRect(X + 12, Y - 4, 8, 9);
      ctx.fillStyle = lit ? "#fff3c0" : "#e8eef3";
      ctx.fillRect(X + 14, Y - 2, 2, 5);
      break;
    }
    case "b":
      ctx.fillStyle = "rgba(0,0,0,.25)";
      ctx.fillRect(X + 7, Y + 26, 20, 4);
      ctx.fillStyle = "#8a5a2e";
      ctx.fillRect(X + 8, Y + 8, 16, 20);
      ctx.fillStyle = "#6b4423";
      ctx.fillRect(X + 8, Y + 12, 16, 2);
      ctx.fillRect(X + 8, Y + 22, 16, 2);
      ctx.fillStyle = "#a8784a";
      ctx.fillRect(X + 10, Y + 8, 12, 3);
      break;
    case "x":
      ctx.fillStyle = "rgba(0,0,0,.25)";
      ctx.fillRect(X + 5, Y + 27, 24, 4);
      ctx.fillStyle = "#a8844e";
      ctx.fillRect(X + 5, Y + 12, 22, 16);
      ctx.fillRect(X + 9, Y + 2, 14, 11);
      ctx.fillStyle = "#6b4423";
      ctx.strokeStyle = "#6b4423";
      ctx.lineWidth = 2;
      ctx.strokeRect(X + 5, Y + 12, 22, 16);
      ctx.strokeRect(X + 9, Y + 2, 14, 11);
      ctx.beginPath();
      ctx.moveTo(X + 5, Y + 12);
      ctx.lineTo(X + 27, Y + 28);
      ctx.stroke();
      break;
    case "h":
      ctx.fillStyle = "rgba(0,0,0,.2)";
      ctx.fillRect(X + 3, Y + 26, 26, 4);
      ctx.fillStyle = "#d9b84a";
      ctx.fillRect(X + 3, Y + 10, 26, 18);
      ctx.fillStyle = "#b8952e";
      for (let i = 0; i < 4; i++) ctx.fillRect(X + 3, Y + 12 + i * 4, 26, 1);
      ctx.fillStyle = "#8a6a2a";
      ctx.fillRect(X + 10, Y + 10, 2, 18);
      ctx.fillRect(X + 20, Y + 10, 2, 18);
      break;
    case "S":
      ctx.fillStyle = "rgba(0,0,0,.25)";
      ctx.fillRect(X + 5, Y + 26, 22, 5);
      ctx.fillStyle = "#8a8498";
      ctx.fillRect(X + 6, Y + 22, 20, 8);
      ctx.fillStyle = "#a6a0b4";
      ctx.fillRect(X + 11, Y + 2, 10, 20);
      ctx.fillStyle = "#bfb9cc";
      ctx.fillRect(X + 12, Y + 0, 8, 5);
      if (player.zone === "vila" && !(x < 10 && y < 10)) {
        ctx.fillStyle = "#7a7488";
        ctx.fillRect(X + 8, Y + 8, 16, 3);
        circle(X + 16, Y + 3, 4);
      }
      break;
    case "p":
      ctx.fillStyle = "#6b6458";
      ctx.fillRect(X + 1, Y + 4, 30, 26);
      ctx.fillStyle = "#4a3a2a";
      ctx.fillRect(X + 3, Y + 6, 26, 22);
      ctx.fillStyle = "#3d7a34";
      ctx.fillRect(X + 3, Y + 6, 26, 22);
      for (let i = 0; i < 6; i++) {
        ctx.fillStyle = ["#ff6b8a", "#f5d76e", "#fff", "#c77dff", "#ff9a3c", "#5fd0ff"][(i + x + y) % 6];
        circle(X + 7 + (i % 3) * 9, Y + 11 + Math.floor(i / 3) * 10, 3);
      }
      ctx.fillStyle = "#857f73";
      ctx.fillRect(X + 1, Y + 28, 30, 2);
      break;
    case "y":
      ctx.fillStyle = "rgba(0,0,0,.25)";
      ctx.fillRect(X + 4, Y + 26, 24, 5);
      ctx.fillStyle = "#7a746a";
      ctx.fillRect(X + 6, Y + 20, 20, 10);
      ctx.fillStyle = "#9a948a";
      ctx.fillRect(X + 6, Y + 20, 20, 2);
      ctx.fillStyle = "#4a3020";
      ctx.fillRect(X + 14, Y + 8, 4, 14);
      {
        const sid = season().id,
          tc =
            sid === "out"
              ? ["#a84a1a", "#d9822a"]
              : sid === "inv"
                ? ["#3a5a4a", "#f2f6fa"]
                : sid === "pri"
                  ? ["#3a7a3a", "#ffb3d0"]
                  : ["#2c6a30", "#4a9a3a"];
        ctx.fillStyle = tc[0];
        circle(X + 16, Y + 6, 11);
        ctx.fillStyle = tc[1];
        circle(X + 12, Y + 3, 4);
        circle(X + 20, Y + 7, 3);
      }
      break;
    case "A":
      ctx.fillStyle = "rgba(0,0,0,.22)";
      ctx.fillRect(X + 3, Y + 24, 26, 6);
      ctx.fillStyle = "#2f5a2a";
      circle(X + 16, Y + 18, 12);
      ctx.fillStyle = "#3d7a34";
      circle(X + 11, Y + 15, 7);
      circle(X + 21, Y + 17, 7);
      ctx.fillStyle = "#5a9a4a";
      circle(X + 12, Y + 12, 3);
      if (h > 0.5) {
        ctx.fillStyle = "#e0306a";
        ctx.fillRect(X + 18, Y + 12, 2, 2);
        ctx.fillRect(X + 9, Y + 20, 2, 2);
      }
      break;
    case "o":
      ctx.fillStyle = "rgba(0,0,0,.22)";
      ctx.fillRect(X + 4, Y + 24, 24, 5);
      ctx.fillStyle = "#7a776e";
      fillPolygon(X + 4, Y + 26, X + 8, Y + 12, X + 18, Y + 8, X + 27, Y + 14, X + 29, Y + 26);
      ctx.fillStyle = "#9a968a";
      fillPolygon(X + 8, Y + 12, X + 18, Y + 8, X + 20, Y + 15, X + 10, Y + 17);
      ctx.fillStyle = "#5a8a4a";
      ctx.fillRect(X + 20, Y + 22, 6, 2);
      break;
    case "u":
      for (let i = 0; i < 3; i++) {
        const ux = X + 6 + i * 8 + ((h * 50 + i * 7) % 5),
          uy = Y + 18 + ((h * 30 + i * 11) % 8);
        ctx.fillStyle = "#efe2c0";
        ctx.fillRect(ux + 1, uy, 2, 4);
        ctx.fillStyle = i % 2 ? "#c94a4a" : "#d9a441";
        ctx.fillRect(ux - 1, uy - 3, 6, 3);
        ctx.fillStyle = "#fff";
        ctx.fillRect(ux, uy - 3, 1, 1);
      }
      break;
    case "z":
      ctx.fillStyle = "rgba(0,0,0,.22)";
      ctx.fillRect(X + 2, Y + 24, 28, 5);
      ctx.fillStyle = "#6b4423";
      ctx.fillRect(X + 2, Y + 14, 28, 11);
      ctx.fillStyle = "#8a5a2e";
      ctx.fillRect(X + 2, Y + 14, 28, 3);
      ctx.fillStyle = "#c9a878";
      circle(X + 28, Y + 19, 5);
      ctx.fillStyle = "#8a6a4a";
      circle(X + 28, Y + 19, 2);
      ctx.fillStyle = "#4a7a3a";
      ctx.fillRect(X + 8, Y + 12, 4, 3);
      break;
    case "Y":
      ctx.fillStyle = "#7a5a32";
      ctx.fillRect(X, Y, TILE, TILE);
      ctx.fillStyle = "#6b4423";
      ctx.fillRect(X + 15, Y + 8, 3, 24);
      ctx.fillRect(X + 4, Y + 12, 24, 3);
      ctx.fillStyle = "#c94a4a";
      ctx.fillRect(X + 10, Y + 14, 12, 10);
      ctx.fillStyle = "#e8d8a0";
      circle(X + 16, Y + 7, 5);
      ctx.fillStyle = "#8a6a2a";
      ctx.fillRect(X + 9, Y, 14, 3);
      ctx.fillRect(X + 11, Y - 3, 10, 4);
      ctx.fillStyle = "#d9b84a";
      ctx.fillRect(X + 3, Y + 15, 3, 4);
      ctx.fillRect(X + 26, Y + 15, 3, 4);
      ctx.fillStyle = "#222";
      ctx.fillRect(X + 14, Y + 6, 1, 1);
      ctx.fillRect(X + 18, Y + 6, 1, 1);
      break;
    case "V":
      ctx.fillStyle = "#6b4423";
      ctx.fillRect(X + 1, Y + 4, 3, 26);
      ctx.fillRect(X + 28, Y + 4, 3, 26);
      ctx.strokeStyle = "#ddd";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(X + 2, Y + 6);
      ctx.quadraticCurveTo(X + 16, Y + 10, X + 30, Y + 6);
      ctx.stroke();
      [
        ["#4a74c9", 6],
        ["#f2eee4", 13],
        ["#c94a4a", 20],
      ].forEach(([cl, ox]) => {
        const sw = Math.sin(t * 2 + ox) * 1.5;
        ctx.fillStyle = cl;
        ctx.fillRect(X + ox + sw, Y + 8, 6, 10);
      });
      break;
    case "Z":
      ctx.fillStyle = "rgba(0,0,0,.22)";
      ctx.fillRect(X + 6, Y + 26, 20, 4);
      ctx.fillStyle = "#6b4423";
      ctx.fillRect(X + 8, Y + 22, 16, 6);
      ctx.fillStyle = "#d9a441";
      for (let i = 0; i < 4; i++) {
        ctx.fillRect(X + 9 + i, Y + 20 - i * 4, 14 - i * 2, 4);
      }
      ctx.fillStyle = "#4a2e17";
      ctx.fillRect(X + 14, Y + 18, 4, 3);
      for (let i = 0; i < 3; i++) {
        const a = t * 3 + i * 2.1;
        ctx.fillStyle = "#222";
        ctx.fillRect(X + 16 + Math.cos(a) * 10, Y + 8 + Math.sin(a * 1.3) * 6, 2, 2);
        ctx.fillStyle = "#f2c14e";
        ctx.fillRect(X + 17 + Math.cos(a) * 10, Y + 8 + Math.sin(a * 1.3) * 6, 1, 2);
      }
      break;
    case "t":
      ctx.fillStyle = "#4a3a2a";
      ctx.fillRect(X + 14, Y + 10, 4, 20);
      ctx.fillStyle = "#3a3a44";
      ctx.fillRect(X + 11, Y + 8, 10, 4);
      {
        const fl = Math.sin(t * 10 + x) * 2;
        ctx.fillStyle = "#ff9a3c";
        fillPolygon(X + 11, Y + 8, X + 21, Y + 8, X + 16 + fl, Y - 6);
        ctx.fillStyle = "#ffe066";
        fillPolygon(X + 13, Y + 8, X + 19, Y + 8, X + 16 + fl, Y);
        if (nightAlpha() > 0.1) {
          ctx.fillStyle = "rgba(255,160,60,.18)";
          circle(X + 16, Y + 4, 18);
        }
      }
      break;
    case "q":
      ctx.fillStyle = "rgba(0,0,0,.22)";
      ctx.fillRect(X + 8, Y + 26, 16, 4);
      ctx.fillStyle = "#a85a3a";
      fillPolygon(X + 9, Y + 18, X + 23, Y + 18, X + 21, Y + 28, X + 11, Y + 28);
      ctx.fillStyle = "#8a4a2a";
      ctx.fillRect(X + 8, Y + 17, 16, 3);
      ctx.fillStyle = "#3d7a2a";
      ctx.fillRect(X + 12, Y + 10, 2, 8);
      ctx.fillRect(X + 18, Y + 11, 2, 7);
      ctx.fillStyle = ["#ff6b8a", "#f5d76e", "#c77dff"][Math.floor(h * 3)];
      circle(X + 13, Y + 9, 3);
      circle(X + 19, Y + 10, 3);
      circle(X + 16, Y + 13, 2);
      break;
    case "R":
      ctx.fillStyle = "rgba(0,0,0,.25)";
      ctx.fillRect(X + 10, Y + 28, 12, 3);
      ctx.fillStyle = "#6b4423";
      ctx.fillRect(X + 14, Y + 4, 4, 26);
      ctx.fillStyle = "#a8784a";
      fillPolygon(X + 2, Y + 6, X + 26, Y + 6, X + 31, Y + 11, X + 26, Y + 16, X + 2, Y + 16);
      fillPolygon(X + 30, Y + 18, X + 6, Y + 18, X + 1, Y + 23, X + 6, Y + 28, X + 30, Y + 28);
      ctx.fillStyle = "#4a2e17";
      ctx.fillRect(X + 6, Y + 10, 16, 2);
      ctx.fillRect(X + 10, Y + 22, 16, 2);
      break;
    case "n":
      ctx.fillStyle = "rgba(0,0,0,.22)";
      ctx.fillRect(X + 3, Y + 24, 26, 4);
      ctx.fillStyle = "#8a5a2e";
      ctx.fillRect(X + 3, Y + 14, 26, 5);
      ctx.fillRect(X + 3, Y + 8, 26, 3);
      ctx.fillStyle = "#5a3a1e";
      ctx.fillRect(X + 5, Y + 19, 3, 8);
      ctx.fillRect(X + 24, Y + 19, 3, 8);
      break;
    case "k":
      ctx.fillStyle = "rgba(0,0,0,.25)";
      ctx.fillRect(X + 2, Y + 26, 28, 5);
      ctx.fillStyle = "#8a5a2e";
      ctx.fillRect(X + 2, Y + 10, 28, 12);
      ctx.fillStyle = "#a8784a";
      ctx.fillRect(X + 2, Y + 8, 28, 3);
      ctx.fillStyle = "#d9b84a";
      ctx.fillRect(X + 5, Y + 3, 22, 7);
      ctx.fillStyle = "#3a2414";
      circle(X + 9, Y + 24, 5);
      circle(X + 24, Y + 24, 5);
      ctx.fillStyle = "#8a6038";
      circle(X + 9, Y + 24, 2);
      circle(X + 24, Y + 24, 2);
      break;
    case "W":
      ctx.fillStyle = "rgba(0,0,0,.25)";
      ctx.fillRect(X + 3, Y + 26, 26, 5);
      ctx.fillStyle = "#7f796d";
      ctx.fillRect(X + 4, Y + 14, 24, 14);
      ctx.fillStyle = "#2a3a5a";
      ctx.fillRect(X + 8, Y + 14, 16, 5);
      ctx.fillStyle = "#6b4423";
      ctx.fillRect(X + 5, Y + 2, 3, 14);
      ctx.fillRect(X + 24, Y + 2, 3, 14);
      ctx.fillStyle = "#8c3b2e";
      fillPolygon(X + 2, Y + 6, X + 16, Y - 4, X + 30, Y + 6);
      ctx.fillStyle = "#ccc";
      ctx.fillRect(X + 15, Y + 6, 2, 8);
      break;
    case "T":
      if (theme === "porto") drawPalm(X, Y, h, t);
      else if (theme === "serra") drawPine(X, Y, h);
      else drawWall("bosque", X, Y, h, t);
      break;
    case ",":
      ctx.fillStyle = "#a8916a";
      ctx.fillRect(X, Y, TILE, TILE);
      ctx.fillStyle = "#937d58";
      ctx.fillRect(X + Math.floor(h * 26) + 2, Y + Math.floor((1 - h) * 26) + 2, 3, 2);
      ctx.fillRect(X + Math.floor((1 - h) * 22) + 5, Y + Math.floor(h * 20) + 8, 2, 2);
      if ((player.weather === "chuva" || player.weather === "tempestade") && h > 0.72) {
        ctx.fillStyle = "rgba(110,140,190,.45)";
        ctx.beginPath();
        ctx.ellipse(X + 16, Y + 18, 10, 4, 0, 0, 7);
        ctx.fill();
        ctx.strokeStyle = "rgba(220,235,255,.5)";
        ctx.beginPath();
        ctx.ellipse(X + 16, Y + 18, (t * 8 + h * 10) % 9, (t * 3 + h * 4) % 3.5, 0, 0, 7);
        ctx.stroke();
      }
      if (season().id === "inv" && h > 0.8) {
        ctx.fillStyle = "rgba(240,245,250,.7)";
        ctx.fillRect(X + h * 20, Y + (1 - h) * 20, 8, 3);
      }
      break;
    case "H":
      house(z, x, y, X, Y, t);
      break;
    case "E":
      ctx.fillStyle = "#6a6478";
      ctx.fillRect(X + 2, Y + 4, 7, 28);
      ctx.fillRect(X + 23, Y + 4, 7, 28);
      ctx.fillRect(X + 2, Y + 2, 28, 6);
      ctx.fillStyle = "#1a1428";
      ctx.fillRect(X + 9, Y + 8, 14, 24);
      ctx.fillStyle = `rgba(176,108,255,${0.35 + 0.25 * Math.sin(t * 3)})`;
      ctx.fillRect(X + 10, Y + 9, 12, 22);
      ctx.fillStyle = "#8a8498";
      ctx.fillRect(X + 0, Y + 26, 6, 6);
      break;
    case "J":
      ctx.fillStyle = "#6b4423";
      ctx.fillRect(X + 5, Y + 16, 3, 16);
      ctx.fillRect(X + 24, Y + 16, 3, 16);
      ctx.fillStyle = "#a8844e";
      ctx.fillRect(X + 2, Y + 4, 28, 16);
      ctx.fillStyle = "#f3ead2";
      ctx.fillRect(X + 5, Y + 6, 8, 6);
      ctx.fillRect(X + 16, Y + 7, 10, 5);
      ctx.fillRect(X + 8, Y + 13, 9, 5);
      ctx.fillStyle = "#c94a4a";
      ctx.fillRect(X + 8, Y + 6, 2, 2);
      ctx.fillRect(X + 20, Y + 7, 2, 2);
      break;
    case "L":
      if (!player.books.includes(`${z}:${x},${y}`)) {
        const b = Math.sin(t * 3) * 2;
        ctx.fillStyle = "rgba(199,125,255,.3)";
        circle(X + 16, Y + 16 + b, 12);
        ctx.fillStyle = "#5a2d8a";
        ctx.fillRect(X + 8, Y + 9 + b, 16, 14);
        ctx.fillStyle = "#efe2c0";
        ctx.fillRect(X + 10, Y + 10 + b, 12, 11);
        ctx.fillStyle = "#5a2d8a";
        ctx.fillRect(X + 15, Y + 9 + b, 2, 14);
        ctx.fillStyle = "#f2c14e";
        ctx.fillRect(X + 11, Y + 12 + b, 3, 1);
        ctx.fillRect(X + 18, Y + 12 + b, 3, 1);
      }
      break;
    case "M": {
      const col = x <= 5 ? "#c94a4a" : x <= 9 ? "#d9a441" : "#4a74c9";
      ctx.fillStyle = "#6b4423";
      ctx.fillRect(X + 2, Y + 12, 3, 20);
      ctx.fillRect(X + 27, Y + 12, 3, 20);
      ctx.fillStyle = "#8a5a2e";
      ctx.fillRect(X, Y + 18, TILE, 12);
      ctx.fillStyle = "#5a3a1e";
      ctx.fillRect(X, Y + 28, TILE, 3);
      for (let i = 0; i < 4; i++) {
        ctx.fillStyle = i % 2 ? "#f3ead2" : col;
        ctx.fillRect(X + i * 8, Y + 2, 8, 10);
      }
      ctx.fillStyle = x <= 5 ? "#ff6b8a" : x <= 9 ? "#f2c14e" : "#9fd0ff";
      ctx.fillRect(X + 8, Y + 14, 5, 5);
      ctx.fillRect(X + 19, Y + 14, 5, 5);
      break;
    }
    case "K":
      ctx.fillStyle = "#6b4423";
      ctx.fillRect(X + 14, Y + 6, 4, 26);
      ctx.fillRect(X + 4, Y + 12, 24, 3);
      ctx.fillStyle = "#d9b26a";
      ctx.fillRect(X + 9, Y + 4, 14, 16);
      ctx.fillStyle = "#c94a4a";
      circle(X + 16, Y + 12, 5);
      ctx.fillStyle = "#fff";
      circle(X + 16, Y + 12, 2);
      break;
    case "~":
      water(th, X, Y, t, h);
      break;
    case "F":
      if (theme !== "vila") {
        ctx.fillStyle = "rgba(0,0,0,.25)";
        ctx.beginPath();
        ctx.ellipse(X + 16, Y + 24, 13, 5, 0, 0, 7);
        ctx.fill();
        ctx.fillStyle = "#77708a";
        ctx.fillRect(X + 8, Y + 12, 16, 14);
        ctx.fillStyle = "#958eab";
        ctx.fillRect(X + 6, Y + 8, 20, 5);
        const r = ORDER[Math.floor(t * 0.8) % 4];
        ctx.save();
        ctx.globalAlpha = 0.25 + 0.2 * Math.sin(t * 3);
        ctx.fillStyle = RUNES[r].cor;
        circle(X + 16, Y + 6, 10);
        ctx.restore();
        glyph(r, X + 16, Y + 3 + Math.sin(t * 2) * 2, 10);
        break;
      }
      ctx.fillStyle = "#4f9be0";
      ctx.fillRect(X, Y, TILE, TILE);
      ctx.fillStyle = "#8f8a80";
      circle(X + 16, Y + 18, 13);
      ctx.fillStyle = "#5aa8ec";
      circle(X + 16, Y + 18, 9);
      ctx.fillStyle = "#a19c91";
      ctx.fillRect(X + 13, Y + 6, 6, 12);
      ctx.fillStyle = "#d6f0ff";
      {
        const k = (t * 2) % 1;
        ctx.fillRect(X + 15, Y + 5 - k * 5, 2, 3);
        ctx.fillRect(X + 10 + k * 3, Y + 12 + k * 4, 2, 2);
        ctx.fillRect(X + 20 - k * 3, Y + 12 + k * 4, 2, 2);
      }
      break;
    case "C": {
      const open = player.taken.includes(`${z}:${x},${y}`);
      const rar = chestRarity(z, x, y);
      if (!open && rar !== "com") {
        ctx.fillStyle =
          rar === "lend"
            ? `rgba(255,210,80,${0.35 + 0.25 * Math.sin(t * 4)})`
            : `rgba(90,170,255,${0.3 + 0.2 * Math.sin(t * 3)})`;
        circle(X + 16, Y + 18, 15);
      }
      ctx.fillStyle = rar === "lend" ? "#b8862a" : rar === "raro" ? "#2f5a9a" : "#6b4423";
      ctx.fillRect(X + 5, Y + 12, 22, 16);
      ctx.fillStyle = "#4a2e17";
      ctx.fillRect(X + 5, Y + 26, 22, 2);
      if (open) {
        ctx.fillStyle = "#2a1a0c";
        ctx.fillRect(X + 7, Y + 12, 18, 4);
        ctx.fillStyle = "#7d5230";
        ctx.fillRect(X + 5, Y + 5, 22, 6);
      } else {
        ctx.fillStyle = rar === "lend" ? "#f2c14e" : rar === "raro" ? "#4a84d9" : "#8a5a2e";
        ctx.fillRect(X + 5, Y + 8, 22, 7);
        ctx.fillStyle = rar === "lend" ? "#fff3b0" : "#f2c14e";
        ctx.fillRect(X + 14, Y + 13, 4, 5);
        ctx.fillRect(X + 5, Y + 15, 22, 1);
      }
      break;
    }
    case "P":
      if (!player.pages.includes(z)) {
        const b = Math.sin(t * 3) * 3;
        ctx.fillStyle = "rgba(242,193,78,.28)";
        circle(X + 16, Y + 16 + b, 12);
        ctx.fillStyle = "#f3ead2";
        ctx.fillRect(X + 10, Y + 8 + b, 12, 15);
        ctx.fillStyle = "#b9a77c";
        for (let i = 0; i < 4; i++) ctx.fillRect(X + 12, Y + 11 + b + i * 3, 8, 1);
      }
      break;
    case "B":
      if (player.runes.length < 4) {
        for (let i = 0; i < 4; i++) {
          ctx.fillStyle = `rgba(176,108,255,${0.35 + 0.3 * Math.sin(t * 4 + i + x)})`;
          ctx.fillRect(X + 3 + i * 8, Y, 3, TILE);
        }
      } else {
        ctx.strokeStyle = "rgba(176,108,255,.35)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(X + 16, Y + 16, 10, 0, 7);
        ctx.stroke();
      }
      break;
    case "G":
      if (player.guards.includes(z)) {
        ctx.strokeStyle = "rgba(242,193,78,.4)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(X + 16, Y + 16, 11, 0, 7);
        ctx.stroke();
        const er = ENEMIES[ZONES[z].guard].rune;
        if (er) glyph(er, X + 16, Y + 16, 10, 0.6);
      }
      break;
  }
}

/* ===================== MUNDO ===================== */

function spawnMobs() {
  game.mobs = [];
  const z = ZONES[player.zone];
  if (!z.enemies.length || !z.spawn.length) return;
  const n = Math.round(
    Math.min(26, Math.max(8, Math.round(z.spawn.length / 75))) * (isNight() ? 1.5 : 1) * difficulty().mobs,
  );
  let tries = 0;
  while (game.mobs.length < n && tries < 2000) {
    tries++;
    const [x, y] = z.spawn[Math.floor(Math.random() * z.spawn.length)];
    if (tileAt(player.zone, x, y) !== "." || Math.abs(x - player.x) + Math.abs(y - player.y) < 9) continue;
    if (game.mobs.some((m) => m.x === x && m.y === y)) continue;
    game.mobs.push({
      type: z.enemies[Math.floor(Math.random() * z.enemies.length)],
      x,
      y,
      rx: x,
      ry: y,
      timer: Math.random(),
    });
  }
}
function initAmbient() {
  game.amb = [];
  const th = ZONES[player.zone].theme;
  const n = {
    vila: 10,
    bosque: 22,
    pantano: 8,
    picos: 45,
    torre: 24,
  }[th];
  for (let i = 0; i < n; i++)
    game.amb.push({
      x: Math.random() * viewWidth,
      y: Math.random() * 480,
      s: Math.random(),
      p: Math.random() * 6,
    });
}
function seenOf(id) {
  if (!game.seenArr[id]) {
    const z = ZONES[id];
    const a = new Uint8Array(z.w * z.h);
    const s = player.seen && player.seen[id];
    if (s && s.length === a.length) for (let i = 0; i < a.length; i++) a[i] = s.charCodeAt(i) === 49 ? 1 : 0;
    game.seenArr[id] = a;
  }
  return game.seenArr[id];
}
function mmColor(c, theme) {
  if (c === "H" || c === "D") return "#7a3b2e";
  if (c === "R") return "#f2c14e";
  if ("#TMKJlbxhfSWnkAozYVZtqpy".includes(c)) return "#2a2138";
  if (c === "E") return "#b06cff";
  if (c === "=" || c === ",") return "#b9a37a";
  if (c === "g") return "#9a8a3a";
  if (c === "~") return "#3a78b0";
  if (c === ",") return "#a8916a";
  return THEMES[theme].g1;
}
function minimapOf(id) {
  if (!game.mm[id]) {
    const z = ZONES[id];
    const c = document.createElement("canvas");
    c.width = z.w;
    c.height = z.h;
    const g = c.getContext("2d");
    const s = seenOf(id);
    for (let y = 0; y < z.h; y++)
      for (let x = 0; x < z.w; x++)
        if (s[y * z.w + x]) {
          g.fillStyle = mmColor(z.map[y][x], z.theme);
          g.fillRect(x, y, 1, 1);
        }
    game.mm[id] = {
      c,
      g,
    };
  }
  return game.mm[id];
}
function reveal() {
  const z = ZONES[player.zone],
    s = seenOf(player.zone),
    mm = minimapOf(player.zone),
    r = 7;
  for (let dy = -r; dy <= r; dy++)
    for (let dx = -r; dx <= r; dx++) {
      if (dx * dx + dy * dy > r * r) continue;
      const x = player.x + dx,
        y = player.y + dy;
      if (x < 0 || y < 0 || x >= z.w || y >= z.h) continue;
      const i = y * z.w + x;
      if (s[i]) continue;
      s[i] = 1;
      mm.g.fillStyle = mmColor(z.map[y][x], z.theme);
      mm.g.fillRect(x, y, 1, 1);
    }
}
const CORRUPTED_ECHOES = {
  bosque: "lobo_alfa",
  pantano: "hidra",
  picos: "roc",
  escola: "quimera",
  torre: "colosso",
};
function spawnEco() {
  const zid = player.zone,
    t = CORRUPTED_ECHOES[zid];
  if (!t || (player.ecos || []).includes(t)) return;
  const z = ZONES[zid];
  if (!z.spawn || !z.spawn.length) return;
  const ent = Object.values(z.open || {})[0] || [0, 0];
  const far = z.spawn
    .slice()
    .sort(
      (a, b) =>
        Math.abs(b[0] - ent[0]) +
        Math.abs(b[1] - ent[1]) -
        (Math.abs(a[0] - ent[0]) + Math.abs(a[1] - ent[1])),
    );
  const p = far[Math.min(far.length - 1, 12)];
  game.mobs.push({
    type: t,
    x: p[0],
    y: p[1],
    rx: p[0],
    ry: p[1],
    timer: 0,
    eco: true,
  });
}
function enterZone(showBanner = true) {
  if (ZONES[player.zone].town && game.lifeZone !== player.zone) initVilaLife();
  if (!player.visited.includes(player.zone)) player.visited.push(player.zone);
  if (player.zone === "torre") player.riding = false;
  player.rx = player.x;
  player.ry = player.y;
  game.petPos = null;
  game.petTarget = null;
  spawnMobs();
  spawnEco();
  spawnForestElves();
  initAmbient();
  game.grace = 1;
  reveal();
  if (showBanner)
    game.banner = {
      text: ZONES[player.zone].nome,
      t: 2.2,
    };
}
function changeZone(dest, dir) {
  const opp = {
    w: "e",
    e: "w",
    n: "s",
    s: "n",
  }[dir];
  const p = ZONES[dest].open[opp];
  player.zone = dest;
  player.x = p[0];
  player.y = p[1];
  game.fade = 1;
  enterZone();
  saveGame();
  playSound(330, 0.12, "triangle");
  if (dest === "torre" && !player.flags.flash) {
    player.flags.flash = true;
    saveGame();
    setTimeout(() => {
      if (game.mode === "world") say(FLASH);
    }, 700);
  }
}
function startEpilogue() {
  game.fade = 1;
  player.zone = "vila";
  player.x = 30;
  player.y = 16;
  player.dir = "down";
  game.mode = "cutscene";
  enterZone(false);
  game.mobs = [];
  game.ep = {
    x: 33,
    y: 38,
    path: [
      [33, 17],
      [28, 17],
    ],
    done: false,
  };
}
function tryMove(dir) {
  player.dir = dir;
  const [dx, dy] = DIR_VECTORS[dir];
  const nx = player.x + dx,
    ny = player.y + dy;
  const z = ZONES[player.zone];
  if (nx < 0 || ny < 0 || nx >= z.w || ny >= z.h) {
    if (player.zone === "escola") {
      player.zone = "vila";
      player.x = VILLAGE_POINTS.escolaRet[0];
      player.y = VILLAGE_POINTS.escolaRet[1];
      game.fade = 1;
      enterZone();
      saveGame();
      playSound(330, 0.12, "triangle");
      return;
    }
    const ex = {
      "-1,0": "w",
      "1,0": "e",
      "0,-1": "n",
      "0,1": "s",
    }[dx + "," + dy];
    const dest = z.exits[ex];
    if (dest) changeZone(dest, ex);
    return;
  }
  if (!walkable(player.zone, nx, ny)) return;
  game.petTarget = [player.x, player.y];
  player.x = nx;
  player.y = ny;
  game.moveCd = player.riding ? 0.065 : 0.13;
  reveal();
  onStep();
}
function onStep() {
  const c = tileAt(player.zone, player.x, player.y);
  if (c === "X" && player.zone === "casa") {
    leaveHouse();
    return;
  }
  if (c === "X" && player.zone === "interior") {
    leaveBuilding();
    return;
  }
  if (c === "E" && player.zone === "vila") {
    const o = ZONES.escola.open.n;
    player.zone = "escola";
    player.x = o[0];
    player.y = o[1] + 1;
    player.riding = false;
    game.fade = 1;
    enterZone();
    saveGame();
    playSound(330, 0.2, "triangle");
    if (!player.flags.escola) {
      player.flags.escola = true;
      setTimeout(
        () =>
          say([
            ["", "Você desce os degraus de pedra. O ar cheira a papel velho e magia esquecida."],
            [
              "",
              "Esta é a Antiga Academia Arcana. Procure os livros brilhando: eles ensinam feitiços do seu elemento.",
            ],
          ]),
        500,
      );
    }
    return;
  }
  if (c === "L" && !player.books.includes(`${player.zone}:${player.x},${player.y}`)) {
    player.books.push(`${player.zone}:${player.x},${player.y}`);
    pickBook();
  }
  for (const j of player.jobs)
    if (
      j.type === "visit" &&
      j.prog < 1 &&
      j.zone === player.zone &&
      Math.abs(j.x - player.x) + Math.abs(j.y - player.y) <= 3
    ) {
      j.prog = 1;
      playSound(880, 0.12, "sine");
      toast(`Mensagem entregue em ${j.place}! Volte ao quadro para receber.`, 3200);
      saveGame();
    }
  for (const j of player.jobs)
    if (j.type === "gather" && j.zone === player.zone && j.herbs) {
      const i = j.herbs.findIndex(([hx, hy]) => hx === player.x && hy === player.y);
      if (i >= 0) {
        j.herbs.splice(i, 1);
        j.prog++;
        addItem("ervaS");
        playSound(880, 0.1, "sine");
        toast(
          `Erva Silvestre coletada (${j.prog}/${j.n})` +
            (j.prog >= j.n ? " · volte ao quadro de trabalhos!" : ""),
          3000,
        );
        saveGame();
      }
    }
  if (c === "P" && !player.pages.includes(player.zone)) {
    player.pages.push(player.zone);
    playSound(880, 0.15, "sine");
    playSound(1320, 0.2, "sine");
    say([[`Página perdida (${player.pages.length}/5)`, PAGES[player.zone]]]);
    saveGame();
  }
  checkMobs();
}
function checkMobs() {
  if (game.grace > 0 || game.mode !== "world" || game.dialog) return;
  const m = game.mobs.find((m) => m.x === player.x && m.y === player.y);
  if (m) startBattle(m.type, m);
}
function targetAt(x, y) {
  const z = ZONES[player.zone],
    c = tileAt(player.zone, x, y),
    tw = z.town;
  if (c == null) return null;
  const elf = elfAt(x, y);
  if (elf) return "Conversar com " + elf.nm;
  if (tw && familyList().some((f) => f.x === x && f.y === y)) return "Família";
  if (tw && festivalToday() && player.zone === "vila" && x === FEST_NPC[0] && y === FEST_NPC[1])
    return "Festival: falar com a organizadora";
  if (paradeActive() && paradePositions().some((pp) => Math.abs(pp.x - x) < 1 && Math.abs(pp.y - y) < 1))
    return "Saudar a família real";
  if (
    activePet() &&
    game.petPos &&
    game.petPos.x === x &&
    game.petPos.y === y &&
    !(x === player.x && y === player.y)
  )
    return "Carinho em " + activePet().name;
  if (player.zone === "casa") {
    const hp = homePetAt(x, y);
    if (hp != null) return "Brincar com " + player.pets[hp].name;
  }
  if (
    tw &&
    dayOutside() &&
    (game.farmers || []).concat(schoolTime() ? [] : game.kidsP || []).some((q) => q.x === x && q.y === y)
  )
    return "Conversar";
  if (tw && roamAt(x, y)) return "Falar com " + NPCS[roamAt(x, y).id].nome.split(",")[0];
  if (tw && walkerAt(x, y)) return "Conversar com " + walkerAt(x, y).nm;
  if (c === "N" && !npcHidden(z.npcs[x + "," + y])) {
    const n = NPCS[z.npcs[x + "," + y]];
    return "Falar com " + (n ? n.nome.split(",")[0] : "");
  }
  if (c === "D" && tw) {
    const b = tw.doors[x + "," + y];
    return b && b.name ? b.name : "Bater na porta";
  }
  if (c === "M" && tw && sleepTime() && !festivalToday()) return "Barraca fechada";
  if (c === "M" && tw) {
    const sh = SHOPS[tw.stalls[x + "," + y]];
    return "Comprar" + (sh ? " · " + sh.nome.split(",")[0] : "");
  }
  if (c === "C") return player.taken.includes(`${player.zone}:${x},${y}`) ? null : "Abrir baú";
  if (c === "F") return player.zone === "vila" ? "Beber da fonte" : "Altar (curar e salvar)";
  if (c === "W") return "Beber do poço";
  if (c === "J") return "Quadro de trabalhos";
  if (c === "R") return "Placa: viajar para outras vilas";
  if (player.zone === "interior" && game.inter) {
    if (c === "Q" || (x === game.inter.kx && y === game.inter.ky))
      return "Falar com " + game.inter.keeper.split(",")[0];
    const pe = interPersonAt(x, y);
    if (pe) return "Conversar com " + pe.nm;
    if (c === "X") return null;
  }
  if (player.zone === "casa") {
    const fu = furnAt(x, y, true);
    if (fu) {
      const u = {
        cama: "Dormir",
        m_camaLux: "Dormir",
        armario: "Guarda-roupa",
        lareira: "Esquentar-se",
        m_lareira: "Esquentar-se",
        m_estante: "Ler",
        m_aquario: "Ver os peixes",
        m_harpa: "Tocar harpa",
        m_caldeirao: "Fazer poção",
      }[fu.id];
      return u || "Ver: " + furnName(fu.id);
    }
  }
  if (c === "G" && !player.guards.includes(player.zone)) return "Enfrentar o Guardião";
  if (c === "B" && player.runes.length < 4) return "Barreira";
  if (c === "S") return "Examinar";
  if (c === "K") return "Boneco de treino";
  if (c === "~") return itemCount("vara") ? "Pescar  / beber" : "Beber água";
  return null;
}
const FISH_T = {
  vila: [
    ["peixe", 0.5],
    ["carpa", 0.25],
    ["bota", 0.13],
    ["peixeR", 0.1],
    ["perolaN", 0.02],
  ],
  porto: [
    ["peixe", 0.48],
    ["carpa", 0.12],
    ["bota", 0.1],
    ["peixeR", 0.12],
    ["perolaN", 0.18],
  ],
  pantano: [
    ["carpa", 0.45],
    ["bota", 0.3],
    ["peixe", 0.15],
    ["peixeR", 0.1],
  ],
  def: [
    ["peixe", 0.45],
    ["carpa", 0.3],
    ["bota", 0.15],
    ["peixeR", 0.1],
  ],
};
function startFishing(x, y) {
  game.fish = {
    x,
    y,
    t: 0,
    bite: 1.8 + Math.random() * 3.5,
    phase: "wait",
  };
  toast(" Você joga a linha... Aperte E (ou A) quando o peixe morder!", 2600);
  playSound(500, 0.08, "sine");
}
function fishAction() {
  const f = game.fish;
  if (!f) return;
  if (f.phase === "wait") {
    game.fish = null;
    toast("Você puxou cedo demais! O peixe fugiu.", 2200);
    playSound(200, 0.1, "square");
    return;
  }
  if (f.phase === "bite") {
    const tb = FISH_T[player.zone] || FISH_T.def;
    let r = Math.random(),
      it = tb[0][0];
    for (const [k, p] of tb) {
      if ((r -= p) < 0) {
        it = k;
        break;
      }
    }
    game.fish = null;
    addItem(it);
    player.fishCaught = (player.fishCaught || 0) + (it === "bota" ? 0 : 1);
    saveGame();
    game.bubbles.push({
      x: player.x,
      y: player.y,
      icon: it === "bota" ? "meh" : it === "peixeR" || it === "perolaN" ? "sparkle" : "fish",
      t: 2.4,
    });
    playSound(it === "bota" ? 180 : 880, 0.15, "sine");
    toast(
      it === "bota"
        ? "Você pescou... uma bota velha. "
        : `Você pescou: ${ITEMS[it].nome}!` + (it === "peixeR" ? " Que sorte!" : ""),
      2600,
    );
  }
}
function updateFishing(dt) {
  const f = game.fish;
  if (!f) return;
  f.t += dt;
  if (f.phase === "wait" && f.t >= f.bite) {
    f.phase = "bite";
    f.bt = 0;
    playSound(1100, 0.06, "square");
    setTimeout(() => playSound(1100, 0.06, "square"), 90);
  } else if (f.phase === "bite") {
    f.bt += dt;
    if (f.bt > (player.diff === "dificil" ? 0.65 : player.diff === "facil" ? 1.2 : 0.85)) {
      game.fish = null;
      toast("O peixe escapou! Seja mais rápido.", 2200);
    }
  }
}
function drawFishing(t) {
  const f = game.fish;
  if (!f) return;
  const px = player.rx * TILE + (player.dir === "left" ? 4 : 28),
    py = player.ry * TILE + 6,
    bx = f.x * TILE + 16,
    by = f.y * TILE + 16 + (f.phase === "bite" ? 4 + Math.sin(t * 30) * 2 : Math.sin(t * 3) * 1.5);
  ctx.strokeStyle = "#6b4423";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(player.rx * TILE + 16, player.ry * TILE + 18);
  ctx.lineTo(px, py - 10);
  ctx.stroke();
  ctx.strokeStyle = "rgba(240,240,240,.8)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(px, py - 10);
  ctx.quadraticCurveTo((px + bx) / 2, Math.max(py, by) + 8, bx, by);
  ctx.stroke();
  ctx.fillStyle = "#e0303a";
  circle(bx, by, 3);
  ctx.fillStyle = "#fff";
  ctx.fillRect(bx - 3, by - 1, 6, 1);
  if (f.phase === "bite") {
    ctx.fillStyle = "#ffe066";
    ctx.font = "700 14px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("!", bx, by - 8);
    ctx.strokeStyle = "rgba(255,255,255,.6)";
    ctx.beginPath();
    ctx.arc(bx, by, 6 + ((t * 20) % 8), 0, 7);
    ctx.stroke();
  }
}
function findTarget() {
  const [dx, dy] = DIR_VECTORS[player.dir];
  for (const d of [1, 2]) {
    const x = player.x + dx * d,
      y = player.y + dy * d,
      l = targetAt(x, y);
    if (l && !(d === 2 && l === "Beber água"))
      return {
        x,
        y,
        l,
      };
    if (d === 1 && !walkable(player.zone, x, y) && !l) break;
  }
  let best = null,
    bd = 9;
  for (let oy = -2; oy <= 2; oy++)
    for (let ox = -2; ox <= 2; ox++) {
      if (!ox && !oy) continue;
      const dist = Math.hypot(ox, oy);
      if (dist > 2.3) continue;
      const x = player.x + ox,
        y = player.y + oy,
        l = targetAt(x, y);
      if (!l || (l === "Beber água" && dist > 1.01)) continue;
      if (dist < bd) {
        bd = dist;
        best = {
          x,
          y,
          l,
        };
      }
    }
  return best;
}
function interact() {
  if (game.fish) {
    fishAction();
    return;
  }
  const tg = findTarget();
  if (!tg) return;
  const dx = tg.x - player.x,
    dy = tg.y - player.y;
  player.dir = Math.abs(dx) >= Math.abs(dy) ? (dx > 0 ? "right" : "left") : dy > 0 ? "down" : "up";
  interactAt(tg.x, tg.y);
}
function interactAt(x, y) {
  game.talkTarget = talkTargetAt(x, y);
  const elf = elfAt(x, y);
  if (elf) {
    elf.dir = x < player.x ? "right" : x > player.x ? "left" : y < player.y ? "down" : "up";
    elfMenu(elf);
    return;
  }
  const c = tileAt(player.zone, x, y);
  const z = ZONES[player.zone];
  const tw = ZONES[player.zone].town;
  const fm = tw && familyList().find((f) => f.x === x && f.y === y);
  if (fm) {
    familyMenu(fm);
    return;
  }
  if (tw && festivalToday() && player.zone === "vila" && x === FEST_NPC[0] && y === FEST_NPC[1]) {
    festivalMenu();
    return;
  }
  if (paradeActive() && paradePositions().some((pp) => Math.abs(pp.x - x) < 1 && Math.abs(pp.y - y) < 1)) {
    paradeMenu();
    return;
  }
  if (activePet() && game.petPos && game.petPos.x === x && game.petPos.y === y) {
    petMenu(player.petA);
    return;
  }
  if (player.zone === "casa") {
    const hp = homePetAt(x, y);
    if (hp != null) {
      petMenu(hp);
      return;
    }
  }
  {
    const fk = tw && dayOutside() && (game.farmers || []).find((q) => q.x === x && q.y === y);
    if (fk) {
      say([
        [
          fk.nm,
          [
            "A colheita está boa este ano!",
            "Terra boa, mão calejada e paciência. É isso.",
            "Cuidado pra não pisar nas mudas!",
            "No inverno a gente só conserta cerca.",
          ][Math.floor(Math.random() * 4)],
        ],
      ]);
      return;
    }
    const kd = tw && dayOutside() && !schoolTime() && (game.kidsP || []).find((q) => q.x === x && q.y === y);
    if (kd) {
      say([
        [
          kd.nm,
          [
            "Tá com você! Hahaha!",
            "Você é " + genderWord("o mago", "a maga", "e mague") + "? Faz uma mágica!",
            "Pega-pega! Ninguém me pega!",
            "Minha mãe disse que eu tenho que voltar antes de escurecer.",
          ][Math.floor(Math.random() * 4)],
        ],
      ]);
      return;
    }
  }
  const ro = tw && roamAt(x, y);
  if (ro && despised(ro.id)) {
    despiseMenu(ro.id);
    return;
  }
  if (ro) {
    const id = ro.id;
    if (FRIENDS[id]) socialMenu(id);
    else {
      const l = NPCS[id].talk();
      if (l) say(l);
    }
    return;
  }
  const wk = tw && walkerAt(x, y);
  if (wk) {
    choice(wk.nm + ", morador" + (player.zone === "vila" ? " de Cinzaluz" : ""), "Para e olha para você.", [
      {
        t: "Cumprimentar",
        fn: () => {
          say([
            [
              wk.nm,
              fillN(
                pickUnheard(
                  "walk",
                  ctxLines("").concat([
                    wk.line,
                    "Olá! Belo dia, não?",
                    "Opa, tudo bem?",
                    "Bom te ver por aqui!",
                  ]),
                ),
              ),
            ],
          ]);
          game.bubbles.push({
            x: wk.x,
            y: wk.y,
            icon: "wave",
            t: 2.4,
          });
        },
      },
      {
        t: "Puxar conversa",
        fn: () => {
          if (Math.random() < 0.45) {
            const gl = gossipLines();
            say([
              [wk.nm, "Sabe o que andam falando de você? " + gl[Math.floor(Math.random() * gl.length)]],
              ["Você", ["Sério?!", "Quem falou isso?", "Hmpf. Fofoqueiros."][Math.floor(Math.random() * 3)]],
            ]);
            return;
          }
          const l = pickUnheard("walkpool", WALKER_POOL.concat(WALKER_LINES));
          say([
            [wk.nm, l],
            [
              "Você",
              ["Sério?", "Que interessante!", "Hahaha, não acredito!", "Vou ficar de olho."][
                Math.floor(Math.random() * 4)
              ],
            ],
            [
              wk.nm,
              [
                "Pois é! Até mais.",
                "Bom papo! Cuide-se.",
                "Volte sempre que quiser prosear.",
                "Agora deixa eu ir, que a feira não espera.",
              ][Math.floor(Math.random() * 4)],
            ],
          ]);
        },
      },
      {
        t: "Flertar ♥",
        fn: () => {
          say([
            ["Você", "Você vem sempre por aqui?"],
            [
              "Morador",
              [
                "Hahaha! Que cantada antiga!",
                "Ai, que vergonha! *sai rindo*",
                "Sou casado, mas obrigado pelo elogio!",
              ][Math.floor(Math.random() * 3)],
            ],
          ]);
          game.bubbles.push({
            x: wk.x,
            y: wk.y,
            icon: "blush",
            t: 2.4,
          });
        },
      },
      {
        t: "Partir para a briga ",
        fn: () => startBrawl(null, wk.nm, wk),
      },
      {
        t: "Ser grosseiro ",
        fn: () => {
          repAdd(-1);
          player.rudeCount = (player.rudeCount || 0) + 1;
          say([
            ["Você", "Sai do meu caminho!"],
            ["Morador", "Que grosseria! Vou contar pra todo mundo!"],
          ]);
          game.bubbles.push({
            x: wk.x,
            y: wk.y,
            icon: "anger",
            t: 2.4,
          });
          wk.flee = 4;
          Object.keys(FRIENDS).forEach((k) => {
            if (Math.random() < 0.3) player.rel[k] = Math.max(0, friendship(k) - 1);
          });
        },
      },
      {
        t: "Sair",
        fn: null,
      },
    ]);
    return;
  }
  if (c === "D" && tw) {
    bldAction(tw.doors[`${x},${y}`]);
    return;
  }
  if (c === "M" && tw && sleepTime() && !festivalToday()) {
    say([["", "A barraca está fechada. O comerciante foi dormir. Abre às 6h."]]);
    return;
  }
  if (c === "M" && tw) {
    const sid = tw.stalls[`${x},${y}`];
    if (sid === "abrigo") {
      petShelter();
      return;
    }
    if (FRIENDS[sid]) socialMenu(sid);
    else openShop(sid);
    return;
  }
  if (player.zone === "interior" && game.inter) {
    const I = game.inter;
    if (c === "Q" || (x === I.kx && y === I.ky)) {
      const greetL = {
        padaria: "Pão quentinho saindo do forno!",
        taverna: "Senta aí, forasteiro! O que vai ser?",
        guilda: "Procurando trabalho?",
        biblio: "Shhh... fale baixo, por favor.",
        templo: "Que a luz esteja com você.",
        hosp: "Está machucado? Deixe-me ver.",
        forja: "O mestre Brann está lá fora, mas eu atendo!",
        alfaiate: "Bem-vindo! Temos tecidos novos.",
        salao: "Senta na cadeira, vamos dar um trato nesse visual!",
        marcenaria: "Cheiro de madeira fresca, não é bom?",
        troca: "O Zaid me deixou cuidando da loja.",
        estab: "Os cavalos estão bem tratados!",
        pousada: "Precisa de um quarto?",
        perola: "Joias dignas de uma rainha.",
        moda: "Moda é magia que se veste!",
        cristal: "Cuidado, os cristais são frágeis.",
        pedra: "Uma xícara de chá quente?",
      }[I.st];
      if (I.st === "castle") {
        castleMenu();
        return;
      }
      if (greetL) toast(I.keeper.split(",")[0] + ": " + greetL, 2400);
      bldService(I.b);
      return;
    }
    const pe = interPersonAt(x, y);
    if (pe && pe.kid) {
      say([
        [
          pe.nm,
          [
            "Oi! Hoje aprendemos sobre runas!",
            "A professora disse que eu sou " +
              (pe.kid.study >= 55 ? "muito inteligente" : "muito falante") +
              "!",
            "Você veio me buscar? Ainda não acabou a aula!",
            "Olha meu desenho de um dragão!",
          ][Math.floor(Math.random() * 4)],
        ],
      ]);
      return;
    }
    if (pe && pe.child) {
      say([
        [
          pe.nm,
          [
            "Psiu! A professora está olhando!",
            "Você é " + genderWord("o mago", "a maga", "e mague") + " das runas? Que legal!",
          ][Math.floor(Math.random() * 2)],
        ],
      ]);
      return;
    }
    if (pe) {
      say([
        [
          pe.nm,
          pe.guard ? "O castelo está seguro enquanto estivermos aqui." : pickUnheard("inter", WALKER_POOL),
        ],
      ]);
      return;
    }
  }
  if (player.zone === "casa") {
    const fu = furnAt(x, y, true);
    if (fu) {
      furnUse(fu);
      return;
    }
  }
  if (c === "R") {
    if (!player.flags.rode) toast("A primeira viagem de carruagem é grátis!", 3000);
    carriageMenu();
    return;
  }
  if (c === "W") {
    player.water = 100;
    playSound(500, 0.12, "sine");
    toast("Você bebe água fresca do poço. Sede saciada.");
    return;
  }
  if (c === "S") {
    say([
      [
        "",
        player.zone === "vila" && x > 10
          ? "Estátua de Aurion, o fundador de Cinzaluz. Ele segura um cajado erguido para o céu."
          : "Colunas quebradas da antiga Academia. A entrada fica no arco roxo.",
      ],
    ]);
    return;
  }
  if (c === "N" && despised(z.npcs[`${x},${y}`])) {
    despiseMenu(z.npcs[`${x},${y}`]);
    return;
  }
  if (c === "N" && !npcHidden(z.npcs[`${x},${y}`])) {
    const id = z.npcs[`${x},${y}`];
    if (FRIENDS[id]) socialMenu(id);
    else {
      const l = NPCS[id].talk();
      if (l) say(l);
    }
  } else if (c === "J") {
    openJobs();
  } else if (c === "K") {
    say([["", "Um boneco de treino. Fale com o Instrutor Kael para treinar."]]);
  } else if (c === "F" && player.zone === "vila") {
    player.water = 100;
    player.checkpoint = {
      zone: player.zone,
      x: player.x,
      y: player.y,
    };
    saveGame();
    playSound(660, 0.2, "sine");
    say([["", "Você bebe da Fonte de Cinzaluz. Sede saciada. Jogo salvo."]]);
  } else if (c === "F") {
    player.hp = maxHp();
    player.mp = maxMp();
    player.checkpoint = {
      zone: player.zone,
      x: player.x,
      y: player.y,
    };
    saveGame();
    playSound(660, 0.2, "sine");
    say([["", "Um altar antigo ressoa com o eco das runas. HP e MP restaurados. Jogo salvo."]]);
  }
  if (c === "~" && itemCount("vara")) {
    choice("Água", "O que você quer fazer?", [
      {
        t: "Pescar ",
        fn: () => startFishing(x, y),
      },
      {
        t: "Beber água",
        fn: () => {
          player.water = 100;
          toast("Você bebe água fresca.");
        },
      },
      {
        t: "Cancelar",
        fn: null,
      },
    ]);
    return;
  } else if (c === "~") {
    player.water = Math.min(100, player.water + 35);
    playSound(500, 0.1, "sine");
    toast("Você bebe água. Sede +35.");
  } else if (c === "C") {
    const k = `${player.zone}:${x},${y}`;
    if (player.taken.includes(k)) say([["", "O baú está vazio."]]);
    else {
      player.taken.push(k);
      const rar = chestRarity(player.zone, x, y);
      const pick = (a) => a[Math.floor(Math.random() * a.length)];
      let g,
        got = [];
      if (rar === "lend") {
        g = 150 + Math.floor(Math.random() * 101);
        const pool = ["cajadoVes", "mantoEst", "armDrag", "amuCan", "fenix"].filter((i) => !itemCount(i));
        const e = pool.length ? pick(pool) : "elixir";
        addItem(e);
        addItem("fragmento");
        got.push("<b>" + ITEMS[e].nome + "</b>", "Fragmento Arcano");
      } else if (rar === "raro") {
        g = 60 + Math.floor(Math.random() * 61);
        const pool = [
          "pocaoG",
          "eterG",
          "ervas",
          "elixir",
          "manto2",
          "amu3",
          "cajado2",
          "armMalha",
          "escudo",
        ].filter((i) => ITEMS[i].tipo !== "equip" || !itemCount(i));
        const e = pick(pool);
        addItem(e);
        got.push(ITEMS[e].nome);
        if (Math.random() < 0.5) {
          addItem("fragmento");
          got.push("Fragmento Arcano");
        }
      } else {
        g = 20 + Math.floor(Math.random() * 31);
        const it = Math.random() < 0.6 ? "pocao" : "eter";
        addItem(it);
        got.push(ITEMS[it].nome);
      }
      g = Math.round(g * difficulty().gold);
      player.gold += g;
      got.unshift(`${g} de ouro`);
      playSound(700, 0.1);
      playSound(990, 0.15);
      if (rar !== "com") setTimeout(() => playSound(1320, 0.25, "sine"), 150);
      say([
        [
          "",
          (rar === "lend" ? "✦ BAÚ LENDÁRIO! ✦ " : rar === "raro" ? "Baú raro! " : "") +
            "Você encontrou: " +
            got.join(", ").replace(/<\/?b>/g, "") +
            "!",
        ],
      ]);
      saveGame();
    }
  } else if (c === "G" && !player.guards.includes(player.zone)) {
    say(GUARD_PRE[z.guard](), () => startBattle(z.guard, null));
  } else if (c === "B" && player.runes.length < 4) {
    say([
      [
        "",
        `Uma barreira de silêncio bloqueia o sul. Só as quatro runas juntas podem rompê-la. (${player.runes.length}/4)`,
      ],
    ]);
  }
}
