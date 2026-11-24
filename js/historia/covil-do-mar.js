/**
 * ECOS DO ARCANO — covil-do-mar.js (modo História)
 * O covil do Leviatã (o Guardião da Maré) agora fica NO FUNDO DO MAR:
 *  - a entrada saiu da ponta do píer e foi para o mar aberto do Porto: um
 *    redemoinho escuro com runas brilhando debaixo d'água;
 *  - para entrar é preciso NADAR até lá e MERGULHAR (cena descendo pelo azul,
 *    com bolhas, raios de luz e a boca da gruta acesa no fundo);
 *  - dentro, a gruta é submarina: luz azul, raios do sol lá de cima, bolhas
 *    subindo, algas balançando e peixinhos. Um bolsão de ar mágico deixa você
 *    respirar. As correntes do abismo sobem e descem (o desafio da maré).
 *  - ao sair, você volta nadando no redemoinho.
 * Modifica (envolve) funções de outros arquivos: drawLairEntrance, targetAt,
 * interactAt, leaveLair, crewDrawList.
 */

"use strict";

(() => {
  const L = typeof LAIRS !== "undefined" && LAIRS.porto;
  const Z = ZONES.porto;
  if (!L || !Z || !Z.guardPos) return;
  const story = () => !(typeof lifeMode === "function" && lifeMode());

  /* ----- a entrada vai para o mar aberto ----- */
  const [ox, oy] = Z.guardPos;
  // a ponta do píer volta a ser píer
  if (Z.map[oy] && Z.map[oy][ox] === "G") Z.map[oy] = Z.map[oy].slice(0, ox) + "=" + Z.map[oy].slice(ox + 1);
  const sea = (x, y) => Z.map[y] && Z.map[y][x] === "~";
  const shore = (x, y) => {
    for (let r = 1; r <= 8; r++)
      for (let dy = -r; dy <= r; dy++)
        for (let dx = -r; dx <= r; dx++) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
          const c = Z.map[y + dy] && Z.map[y + dy][x + dx];
          if (c && c !== "~" && c !== "#") return r - 1;
        }
    return 9;
  };
  let best = null;
  for (let y = oy; y < Math.min(Z.h - 2, oy + 16); y++)
    for (let x = 4; x < Math.min(Z.w - 4, 60); x++) {
      if (!sea(x, y)) continue;
      const d = shore(x, y);
      if (d < 4 || d > 5) continue; // fundo, mas dá para chegar com fôlego
      const s = Math.abs(x - 18) + Math.abs(y - (oy + 6));
      if (!best || s < best.s) best = { x, y, s };
    }
  if (best) Z.guardPos = [best.x, best.y];
  const G = () => Z.guardPos;
  L.n = "Gruta do Leviatã";
  L.sub = "No fundo do mar, a água respira.";
  L.hint = "Você está numa gruta no fundo do mar. Um bolsão de ar mágico deixa você respirar. As correntes do abismo sobem e descem: atravesse quando acalmarem e espere nas pedras quando subirem. Quem a corrente pega volta para a entrada.";

  /* ----- o redemoinho no mar ----- */
  const dleBase = drawLairEntrance;
  drawLairEntrance = function (t) {
    if (player.zone !== "porto") return dleBase.apply(this, arguments);
    if (player.guards.includes("porto")) return;
    const [x, y] = G(),
      X = x * TILE + 16,
      Y = y * TILE + 16;
    ctx.save();
    // sombra da gruta lá no fundo
    const g = ctx.createRadialGradient(X, Y, 4, X, Y, 46);
    g.addColorStop(0, "rgba(4,10,30,.85)");
    g.addColorStop(0.6, "rgba(10,30,70,.45)");
    g.addColorStop(1, "rgba(10,30,70,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(X, Y, 46, 0, 7);
    ctx.fill();
    // espirais do redemoinho
    ctx.strokeStyle = "rgba(220,240,255,.55)";
    ctx.lineWidth = 2;
    for (let k = 0; k < 3; k++) {
      ctx.beginPath();
      for (let a = 0; a < Math.PI * 2.4; a += 0.2) {
        const r = 6 + a * 7 + k * 3;
        const ang = a + t * 1.6 + (k * Math.PI * 2) / 3;
        const px = X + Math.cos(ang) * r,
          py = Y + Math.sin(ang) * r * 0.6;
        a === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.stroke();
    }
    // runas brilhando debaixo d'água
    for (let k = 0; k < 6; k++) {
      const a = t * 0.5 + (k * Math.PI) / 3;
      ctx.fillStyle = `rgba(120,220,255,${0.35 + 0.3 * Math.sin(t * 3 + k)})`;
      ctx.fillRect(X + Math.cos(a) * 30 - 2, Y + Math.sin(a) * 18 - 2, 4, 4);
    }
    // bolhas subindo
    for (let k = 0; k < 5; k++) {
      const f = (t * 0.7 + k * 0.2) % 1;
      ctx.fillStyle = `rgba(255,255,255,${0.7 * (1 - f)})`;
      ctx.beginPath();
      ctx.arc(X + Math.sin(k * 7 + t) * 10, Y - f * 26, 2 + (k % 2), 0, 7);
      ctx.fill();
    }
    ctx.restore();
  };

  /* ----- nadar até lá e mergulhar ----- */
  const swimming = () => game.swim && game.swim.on;
  const atEntrance = (x, y) => {
    const [gx, gy] = G();
    return (x === gx && y === gy) || (player.x === gx && player.y === gy) || Math.abs(player.x - gx) + Math.abs(player.y - gy) <= 1;
  };
  const open = () => story() && player.zone === "porto" && !player.guards.includes("porto");
  const tgBase = targetAt;
  targetAt = function (x, y) {
    if (open() && atEntrance(x, y)) return swimming() ? `Mergulhar: ${L.n}` : null;
    return tgBase.apply(this, arguments);
  };
  const iaBase = interactAt;
  interactAt = function (x, y) {
    if (open() && atEntrance(x, y)) {
      if (!swimming()) return say([["", "A gruta do Leviatã fica no fundo do mar. Nade até o redemoinho e mergulhe."]]);
      const m = typeof sealMessage === "function" ? sealMessage(Z) : null;
      if (m) return say([["", m]]);
      return dive();
    }
    return iaBase.apply(this, arguments);
  };
  function dive() {
    const [gx, gy] = G();
    game.swim.on = false;
    game.swim.shark = null;
    playSound(220, 0.6, "sine", 0.05);
    const sc = diveScene();
    setTimeout(() => {
      const c = game.cine;
      if (c && c.draw === sc) ((c.t0 = -999), endCine());
    }, 5200);
    playCine(sc, 4.2, () => {
      player.x = gx;
      player.y = gy;
      enterLair(L);
      game.lairBack = { zone: "porto", x: gx, y: gy };
    });
  }
  // saindo da gruta: você sobe nadando no redemoinho
  const llBase = leaveLair;
  leaveLair = function (Lr) {
    const r = llBase.apply(this, arguments);
    if (Lr && Lr.region === "porto" && player.zone === "porto" && sea(player.x, player.y) && typeof startSwim === "function") {
      startSwim(player.x, player.y);
      if (game.swim) game.swim.breath = 100;
      toast("Você sobe pelo redemoinho e respira fundo na superfície!", 3000);
    }
    return r;
  };
  function diveScene() {
    return (W, H, t) => {
      const p = Math.min(1, t / 3.6);
      const sky = ctx.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0, `rgb(${Math.round(60 - p * 55)},${Math.round(150 - p * 130)},${Math.round(200 - p * 150)})`);
      sky.addColorStop(1, `rgb(${Math.round(20 - p * 18)},${Math.round(60 - p * 55)},${Math.round(110 - p * 90)})`);
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, W, H);
      // raios de sol que somem com a profundidade
      ctx.save();
      ctx.globalAlpha = 0.18 * (1 - p);
      ctx.fillStyle = "#e8f8ff";
      for (let i = 0; i < 6; i++) {
        const x = (i * W) / 6 + Math.sin(t + i) * 20;
        fillPolygon(x, 0, x + 40, 0, x + 140, H, x + 60, H);
      }
      ctx.restore();
      // algas e rochas subindo (a câmera desce)
      for (let i = 0; i < 14; i++) {
        const x = ((i * 137) % W) + 10,
          base = H + 260 - p * 420 + (i % 3) * 30;
        ctx.strokeStyle = "#2a6a4a";
        ctx.lineWidth = 6;
        ctx.beginPath();
        for (let k = 0; k < 8; k++) {
          const yy = base - k * 18;
          const xx = x + Math.sin(t * 2 + k * 0.6 + i) * 8;
          k ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy);
        }
        ctx.stroke();
      }
      ctx.fillStyle = "#14202e";
      ctx.fillRect(0, H + 120 - p * 260, W, 400);
      // a boca da gruta acesa no fundo
      if (p > 0.55) {
        const a = (p - 0.55) / 0.45;
        const cx = W / 2,
          cy = H + 120 - p * 260;
        ctx.fillStyle = "#05070c";
        ctx.beginPath();
        ctx.arc(cx, cy, 90, Math.PI, 0);
        ctx.fill();
        for (let k = 0; k < 8; k++) {
          const ang = Math.PI + (k / 7) * Math.PI;
          ctx.fillStyle = `rgba(120,220,255,${a * (0.5 + 0.4 * Math.sin(t * 4 + k))})`;
          ctx.fillRect(cx + Math.cos(ang) * 100 - 4, cy + Math.sin(ang) * 100 - 4, 8, 8);
        }
      }
      // você nadando para baixo
      drawSprite(heroRects(player.look, "down", null), W / 2 - 24, H * 0.38 + Math.sin(t * 3) * 6, 3, false);
      for (let k = 0; k < 18; k++) {
        const f = (t * 0.8 + k * 0.13) % 1;
        ctx.fillStyle = `rgba(255,255,255,${0.6 * (1 - f)})`;
        ctx.beginPath();
        ctx.arc(W / 2 + Math.sin(k * 5 + t * 2) * 30, H * 0.38 - f * H * 0.4, 2 + (k % 3), 0, 7);
        ctx.fill();
      }
      ctx.textAlign = "center";
      ctx.fillStyle = "#e8f8ff";
      ctx.font = '700 26px "Pixelify Sans", sans-serif';
      ctx.fillText("Você prende a respiração e mergulha...", W / 2, 54);
      if (p > 0.6) {
        ctx.font = '600 18px "Pixelify Sans", sans-serif';
        ctx.fillText("Lá no fundo, uma gruta brilha com runas antigas.", W / 2, 84);
      }
    };
  }

  /* ----- dentro: gruta submarina ----- */
  const cdBase = crewDrawList;
  crewDrawList = function (list, t) {
    cdBase(list, t);
    if (player.zone !== L.id) return;
    const W = LAIR.w * TILE,
      H = LAIR.h * TILE;
    // algas no chão (por baixo das pessoas)
    list.push({
      y: -4,
      draw: () => {
        for (let i = 0; i < 26; i++) {
          const x = ((i * 53) % (W - 60)) + 30,
            top = i % 2 === 0;
          const y0 = top ? TILE * 1.1 : H - TILE * 1.1;
          ctx.strokeStyle = i % 3 ? "#2a7a5a" : "#3a8a3a";
          ctx.lineWidth = 4;
          ctx.beginPath();
          for (let k = 0; k < 5; k++) {
            const yy = y0 + (top ? k * 7 : -k * 7);
            const xx = x + Math.sin(t * 1.8 + k * 0.7 + i) * 4;
            k ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy);
          }
          ctx.stroke();
        }
      },
    });
    // a água por cima de tudo: tom azul, raios de luz, bolhas e peixes
    list.push({
      y: 1000,
      draw: () => {
        ctx.save();
        ctx.fillStyle = "rgba(20,70,140,.30)";
        ctx.fillRect(0, 0, W, H);
        ctx.globalAlpha = 0.1;
        ctx.fillStyle = "#cfeeff";
        for (let i = 0; i < 7; i++) {
          const x = i * (W / 6) + Math.sin(t * 0.4 + i) * 30;
          fillPolygon(x, 0, x + 26, 0, x + 120, H, x + 70, H);
        }
        ctx.globalAlpha = 1;
        // cáusticas no chão
        ctx.fillStyle = "rgba(200,240,255,.07)";
        for (let i = 0; i < 40; i++) {
          const x = (i * 97 + Math.sin(t + i) * 20) % W,
            y = (i * 61 + Math.cos(t * 0.8 + i) * 14) % H;
          ctx.fillRect(x, y, 14, 3);
        }
        for (let k = 0; k < 30; k++) {
          const f = (t * 0.25 + k * 0.071) % 1;
          ctx.fillStyle = `rgba(255,255,255,${0.5 * (1 - f)})`;
          ctx.beginPath();
          ctx.arc(((k * 113) % W) + Math.sin(t * 2 + k) * 6, H - f * H, 1.5 + (k % 3), 0, 7);
          ctx.fill();
        }
        for (let k = 0; k < 5; k++) {
          const dir = k % 2 ? 1 : -1;
          const x = (((t * 40 * dir + k * 233) % (W + 80)) + W + 80) % (W + 80) - 40,
            y = TILE * (2 + k * 1.6) + Math.sin(t * 2 + k) * 6;
          ctx.fillStyle = ["#f2a040", "#e8d040", "#60c0e0", "#f27a7a", "#c0a0f0"][k];
          ctx.beginPath();
          ctx.ellipse(x, y, 8, 4, 0, 0, 7);
          ctx.fill();
          fillPolygon(x - dir * 8, y, x - dir * 14, y - 4, x - dir * 14, y + 4);
        }
        ctx.restore();
      },
    });
  };
})();
