/**
 * ECOS DO ARCANO — parquinho.js
 * Desenha os brinquedos dos parques (preencher-mapas.js monta os parques):
 * balanço, escorregador, gangorra, caixa de areia, trepa-trepa e gira-gira,
 * tudo de madeira e corda, como numa vila medieval. De dia (7h às 18h)
 * aparecem crianças brincando neles; com chuva ou à noite o parque fica vazio.
 * Os brinquedos são decoração: dá para passar por eles (como árvores e bancos).
 * Cada brinquedo ocupa 2 blocos e é desenhado no bloco da direita.
 * Modifica (envolve) drawTile.
 */

"use strict";

(() => {
  const P = () => (window.PARKS || {})[player.zone];
  const WOOD = "#8a5a2e",
    DARK = "#5a3a1c",
    ROPE = "#d9c08a";
  const kidColors = [
    ["#d94a4a", "#f2c9a0"],
    ["#4a7ad9", "#8a5a3a"],
    ["#e8b23a", "#f2d0b0"],
    ["#4aa86a", "#5a3a22"],
    ["#b04ad9", "#e0b090"],
    ["#e07a3a", "#3a2a1a"],
  ];
  const daytime = () => {
    const h = typeof currentHour === "function" ? currentHour() : 12;
    const rain = typeof weather !== "undefined" && weather && /chuva|tempest|neve/.test(String(weather.kind || weather.type || ""));
    return h >= 7 && h < 18 && !rain;
  };
  // criança pequena (desenhada com o pé em fx, fy)
  function kid(fx, fy, i, pose) {
    // os filhos de verdade (quando você leva a família ao parque) usam a cara deles
    const fam = window.parkFamilyLook && parkFamilyLook(i);
    const [shirt, skin] = fam ? [fam.robe || "#4a7ad9", fam.skin || "#f1c8a5"] : kidColors[i % kidColors.length];
    ctx.fillStyle = "rgba(0,0,0,.2)";
    ctx.fillRect(fx - 4, fy, 8, 2);
    ctx.fillStyle = "#3a2a3a";
    if (pose === "sit") ctx.fillRect(fx - 3, fy - 4, 6, 3);
    else (ctx.fillRect(fx - 3, fy - 4, 2, 4), ctx.fillRect(fx + 1, fy - 4, 2, 4));
    ctx.fillStyle = shirt;
    ctx.fillRect(fx - 3, fy - 10, 6, 6);
    ctx.fillStyle = skin;
    ctx.fillRect(fx - 3, fy - 15, 6, 5);
    ctx.fillStyle = fam ? fam.hair || "#3a2a1a" : i % 2 ? "#3a2a1a" : "#c98a3a";
    ctx.fillRect(fx - 3, fy - 16, 6, 2);
    if (pose === "up") (ctx.fillStyle = skin), ctx.fillRect(fx - 5, fy - 14, 2, 4), ctx.fillRect(fx + 3, fy - 14, 2, 4);
  }

  const draw = {
    balanco(X, Y, t, i, kids) {
      // armação em A dos dois lados e a trave em cima
      ctx.fillStyle = DARK;
      ctx.fillRect(X - 30, Y - 12, 3, 40);
      ctx.fillRect(X + 26, Y - 12, 3, 40);
      ctx.fillStyle = WOOD;
      ctx.fillRect(X - 32, Y - 14, 63, 4);
      // dois balanços
      for (const [sx, ph] of [[-14, 0], [12, 1.7]]) {
        const a = kids ? Math.sin(t * 2.4 + ph + i) * 6 : Math.sin(t * 0.6 + ph) * 1;
        ctx.strokeStyle = ROPE;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(X + sx - 5, Y - 10);
        ctx.lineTo(X + sx - 5 + a, Y + 14);
        ctx.moveTo(X + sx + 5, Y - 10);
        ctx.lineTo(X + sx + 5 + a, Y + 14);
        ctx.stroke();
        ctx.fillStyle = WOOD;
        ctx.fillRect(X + sx - 6 + a, Y + 14, 12, 3);
        if (kids && ph === 0) kid(X + sx + a, Y + 18, i, "sit");
      }
    },
    escorrega(X, Y, t, i, kids) {
      // escada à esquerda, plataforma, rampa descendo para a direita
      ctx.fillStyle = DARK;
      ctx.fillRect(X - 26, Y - 10, 2, 38);
      ctx.fillRect(X - 16, Y - 10, 2, 38);
      for (let k = 0; k < 6; k++) ctx.fillRect(X - 26, Y - 6 + k * 6, 12, 2);
      ctx.fillStyle = WOOD;
      ctx.fillRect(X - 28, Y - 12, 16, 4);
      ctx.fillStyle = "#b07a3a";
      ctx.beginPath();
      ctx.moveTo(X - 12, Y - 12);
      ctx.lineTo(X + 26, Y + 22);
      ctx.lineTo(X + 26, Y + 28);
      ctx.lineTo(X - 12, Y - 4);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "rgba(255,240,200,.35)";
      ctx.fillRect(X - 8, Y - 9, 3, 2);
      if (kids) {
        const f = (t * 0.45 + i * 0.3) % 1;
        if (f < 0.5) kid(X - 20, Y + 28 - f * 70, i, "up");
        else {
          const g = (f - 0.5) * 2;
          kid(X - 10 + g * 34, Y - 8 + g * 30, i + 1, "sit");
        }
      }
    },
    gangorra(X, Y, t, i, kids) {
      const a = kids ? Math.sin(t * 1.8 + i) * 0.28 : 0.18;
      ctx.fillStyle = DARK;
      ctx.beginPath();
      ctx.moveTo(X - 6, Y + 26);
      ctx.lineTo(X, Y + 14);
      ctx.lineTo(X + 6, Y + 26);
      ctx.fill();
      ctx.save();
      ctx.translate(X, Y + 14);
      ctx.rotate(a);
      ctx.fillStyle = WOOD;
      ctx.fillRect(-28, -2, 56, 4);
      ctx.fillStyle = DARK;
      ctx.fillRect(-24, -6, 2, 4);
      ctx.fillRect(22, -6, 2, 4);
      ctx.restore();
      if (kids) {
        kid(X - 24, Y + 14 - Math.sin(a) * 24, i, "sit");
        kid(X + 24, Y + 14 + Math.sin(a) * 24, i + 2, "sit");
      }
    },
    areia(X, Y, t, i, kids) {
      // caixa de areia com borda de madeira, baldinho e castelinho
      ctx.fillStyle = DARK;
      ctx.fillRect(X - 30, Y + 4, 60, 24);
      ctx.fillStyle = "#e6cf8f";
      ctx.fillRect(X - 27, Y + 7, 54, 18);
      ctx.fillStyle = "#cdb070";
      ctx.fillRect(X - 10, Y + 12, 10, 8);
      ctx.fillRect(X - 8, Y + 9, 2, 3);
      ctx.fillRect(X - 4, Y + 9, 2, 3);
      ctx.fillStyle = "#c94a3a";
      ctx.fillRect(X + 12, Y + 14, 6, 6);
      if (kids) kid(X + 4 + Math.sin(t + i) * 2, Y + 24, i + 3, "sit");
    },
    trepa(X, Y, t, i, kids) {
      // trepa-trepa: grade de troncos
      ctx.fillStyle = WOOD;
      for (let k = 0; k < 4; k++) ctx.fillRect(X - 26 + k * 17, Y - 6, 3, 34);
      for (let k = 0; k < 4; k++) ctx.fillRect(X - 26, Y - 6 + k * 10, 54, 2);
      if (kids) kid(X - 9 + ((t * 8 + i * 20) % 30), Y + 6, i + 4, "up");
    },
    gira(X, Y, t, i, kids) {
      // gira-gira: disco de madeira que roda
      const a = t * (kids ? 2 : 0.2);
      ctx.fillStyle = DARK;
      ctx.beginPath();
      ctx.ellipse(X, Y + 20, 22, 8, 0, 0, 7);
      ctx.fill();
      ctx.fillStyle = WOOD;
      ctx.beginPath();
      ctx.ellipse(X, Y + 17, 22, 8, 0, 0, 7);
      ctx.fill();
      ctx.strokeStyle = ROPE;
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let k = 0; k < 3; k++) {
        const b = a + (k * Math.PI * 2) / 3;
        ctx.moveTo(X, Y + 17);
        ctx.lineTo(X + Math.cos(b) * 20, Y + 17 + Math.sin(b) * 7);
      }
      ctx.stroke();
      if (kids) kid(X + Math.cos(a) * 14, Y + 20 + Math.sin(a) * 5, i + 5, "sit");
    },
  };

  // estátua de pedra num pedestal (1 bloco): cavaleiro, rainha ou mago, pela posição
  draw.estatua = function (X, Y, t, i) {
    const S1 = "#b8b4aa",
      S2 = "#8e8a80",
      S3 = "#d8d4ca";
    ctx.fillStyle = "rgba(0,0,0,.25)";
    ctx.fillRect(X + 4, Y + 27, 26, 4);
    ctx.fillStyle = S2;
    ctx.fillRect(X + 5, Y + 18, 22, 10);
    ctx.fillStyle = S1;
    ctx.fillRect(X + 7, Y + 14, 18, 6);
    ctx.fillStyle = S3;
    ctx.fillRect(X + 7, Y + 14, 18, 2);
    // a figura
    const k = i % 3;
    ctx.fillStyle = S1;
    ctx.fillRect(X + 12, Y - 6, 8, 20);
    ctx.fillRect(X + 13, Y - 13, 6, 7);
    ctx.fillStyle = S3;
    ctx.fillRect(X + 13, Y - 13, 2, 7);
    ctx.fillStyle = S2;
    if (k === 0) {
      // cavaleiro com espada erguida
      ctx.fillRect(X + 20, Y - 22, 2, 18);
      ctx.fillRect(X + 18, Y - 5, 6, 2);
      ctx.fillRect(X + 8, Y - 2, 5, 9);
    } else if (k === 1) {
      // rainha com coroa e manto
      ctx.fillRect(X + 10, Y + 2, 12, 12);
      ctx.fillRect(X + 13, Y - 16, 6, 3);
      ctx.fillRect(X + 13, Y - 18, 1, 2);
      ctx.fillRect(X + 15, Y - 19, 2, 3);
      ctx.fillRect(X + 18, Y - 18, 1, 2);
    } else {
      // mago com cajado e chapéu pontudo
      ctx.beginPath();
      ctx.moveTo(X + 11, Y - 12);
      ctx.lineTo(X + 21, Y - 12);
      ctx.lineTo(X + 16, Y - 24);
      ctx.fill();
      ctx.fillRect(X + 23, Y - 16, 2, 30);
      ctx.fillStyle = "#9ad8ff";
      ctx.globalAlpha = 0.5 + 0.3 * Math.sin(t * 2);
      ctx.fillRect(X + 22, Y - 19, 4, 4);
      ctx.globalAlpha = 1;
    }
    // musgo
    ctx.fillStyle = "rgba(90,130,60,.6)";
    ctx.fillRect(X + 6, Y + 25, 5, 2);
    ctx.fillRect(X + 21, Y + 19, 4, 2);
  };
  // coreto de madeira (2 blocos) com telhado e um músico de dia
  draw.coreto = function (X, Y, t, i, kids) {
    ctx.fillStyle = "#7a5a3a";
    ctx.fillRect(X - 28, Y + 14, 56, 12);
    ctx.fillStyle = "#a8784a";
    ctx.fillRect(X - 30, Y + 12, 60, 4);
    ctx.fillStyle = "#5a3a1c";
    for (const px of [-26, -9, 8, 24]) ctx.fillRect(X + px, Y - 10, 3, 24);
    ctx.fillStyle = "#8a1f1f";
    ctx.beginPath();
    ctx.moveTo(X - 34, Y - 8);
    ctx.lineTo(X, Y - 30);
    ctx.lineTo(X + 34, Y - 8);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#c9a03a";
    ctx.fillRect(X - 1, Y - 36, 2, 7);
    ctx.fillRect(X - 34, Y - 9, 68, 2);
    if (kids) {
      // um bardo tocando alaúde
      ctx.fillStyle = "#3a6a4a";
      ctx.fillRect(X - 4, Y, 8, 10);
      ctx.fillStyle = "#e0b090";
      ctx.fillRect(X - 3, Y - 6, 6, 6);
      ctx.fillStyle = "#c9a03a";
      ctx.fillRect(X + 3, Y + 3 + Math.sin(t * 6), 7, 4);
      if (((t * 2) | 0) % 2) ((ctx.fillStyle = "#fff"), ctx.fillRect(X + 10, Y - 12 - ((t * 8) % 8), 3, 4));
    }
  };
  // banco de praça de madeira com encosto e pés de ferro
  draw.banco = function (X, Y) {
    ctx.fillStyle = "rgba(0,0,0,.22)";
    ctx.fillRect(X + 3, Y + 26, 26, 4);
    ctx.fillStyle = "#3a3a44";
    ctx.fillRect(X + 5, Y + 18, 3, 9);
    ctx.fillRect(X + 24, Y + 18, 3, 9);
    ctx.fillStyle = "#8a5a2e";
    ctx.fillRect(X + 3, Y + 16, 26, 4);
    ctx.fillStyle = "#a8784a";
    ctx.fillRect(X + 3, Y + 16, 26, 1);
    ctx.fillStyle = "#7a4a22";
    ctx.fillRect(X + 3, Y + 6, 26, 3);
    ctx.fillRect(X + 3, Y + 11, 26, 3);
    ctx.fillStyle = "#3a3a44";
    ctx.fillRect(X + 5, Y + 5, 2, 12);
    ctx.fillRect(X + 25, Y + 5, 2, 12);
  };
  const dtBase = drawTile;
  drawTile = function (z, x, y, c, t) {
    const r = dtBase.apply(this, arguments);
    const M = z === player.zone && P();
    if (!M) return r;
    const kind = M.get(x + "," + y);
    if (!kind || kind === "-") return r;
    // chão de terra batida embaixo dos brinquedos
    const X = x * TILE,
      Y = y * TILE;
    if (kind !== "estatua" && kind !== "coreto" && kind !== "banco") {
      ctx.fillStyle = "rgba(196,160,104,.55)";
      ctx.fillRect(X - TILE + 2, Y + 2, TILE * 2 - 4, TILE - 4);
    }
    const i = window.parkFamilyAt && parkFamilyAt(x, y) ? 100 + parkFamilyAt(x, y) - 1 : (x * 3 + y * 5) % 7;
    const famHere = window.parkFamilyAt && parkFamilyAt(x, y);
    const kids = famHere || (daytime() && (x + y) % 4 !== 0);
    draw[kind] && draw[kind](X, Y, t || performance.now() / 1000, i, kids);
    return r;
  };

  // dá para olhar o brinquedo
  window.parkThingAt = (z, x, y) => {
    const M = (window.PARKS || {})[z];
    if (!M) return null;
    const k = M.get(x + "," + y);
    if (k === "-") return M.get(x + 1 + "," + y) || null;
    return k || null;
  };
})();
