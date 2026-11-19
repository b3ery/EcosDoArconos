/**
 * ECOS DO ARCANO — mapa-quadrado.js
 * O mapa da região (M) como nos jogos de RPG:
 *  - uma janela REDONDA (como uma bússola) fixa no meio da tela, que abre
 *    centrada em você;
 *  - escala de dar para ler (os prédios aparecem com o nome escrito),
 *    com zoom (+ / − ou a rodinha do mouse);
 *  - dá para andar pelo mapa: setas/WASD ou arrastar com o dedo ou o mouse;
 *    o mapa não passa da borda da região; C volta para você;
 *  - os marcadores e você ficam sempre do mesmo tamanho na tela;
 *  - sem neblina: o mundo é grande e o mapa mostra tudo.
 * Clicar num lugar continua mostrando o que é (e "Ir até lá").
 * Modifica (envolve) regionMapBox, drawMinimap, openMap e KEY_HANDLERS.map.
 */

"use strict";

(() => {
  const SQ = 400; // diâmetro do círculo (na tela de 480 de altura)
  const ZOOMS = [3, 4, 6, 8, 11];
  const V = (game.mapView = game.mapView || { zi: 2, cx: 0, cy: 0, zone: null });
  const box = () => ({ sx: Math.round(viewWidth / 2 - SQ / 2), sy: Math.round(244 - SQ / 2) });
  const clamp = (z) => {
    const k = ZOOMS[V.zi],
      half = SQ / 2 / k;
    // se a região inteira cabe, fica no meio; senão não passa da borda
    V.cx = z.w * k <= SQ ? z.w / 2 : Math.max(half, Math.min(z.w - half, V.cx));
    V.cy = z.h * k <= SQ ? z.h / 2 : Math.max(half, Math.min(z.h - half, V.cy));
  };
  const centerOnPlayer = () => {
    V.cx = (player.rx ?? player.x) + 0.5;
    V.cy = (player.ry ?? player.y) + 0.5;
  };
  regionMapBox = function (zone) {
    const z = ZONES[zone];
    if (V.zone !== zone) {
      V.zone = zone;
      // zoom inicial: o maior em que um bom pedaço da região aparece
      V.zi = z.w * 6 > SQ * 2.2 || z.h * 6 > SQ * 2.2 ? 2 : 1;
      centerOnPlayer();
    }
    clamp(z);
    const k = ZOOMS[V.zi];
    const { sx, sy } = box();
    return { s: k, ox: Math.round(sx + SQ / 2 - V.cx * k), oy: Math.round(sy + SQ / 2 - V.cy * k), mw: z.w * k, mh: z.h * k, sx, sy, sq: SQ, view: true };
  };

  // nomes dos prédios que aparecem escritos no mapa
  const STYLE_N = { taverna: "Taverna", padaria: "Padaria", templo: "Templo", hosp: "Hospital", forja: "Forja", clinica: "Clínica", escola: "Escola", atelie: "Ateliê", alfaiate: "Alfaiate", boticario: "Boticário", acougue: "Açougue", armazem: "Armazém", tecidos: "Tecidos", livraria: "Livraria", emporio: "Empório", salao: "Salão", marcenaria: "Marcenaria", guilda: "Guilda", biblio: "Biblioteca", estab: "Estábulo", peixaria: "Peixaria", castle: "Castelo", palacio: "Palácio", fortaleza: "Fortaleza", farol: "Farol", home: "Sua casa", troca: "Central de Trocas", moinho: "Moinho", celeiro: "Celeiro", pousada: "Pousada", mansao: "Mansão" };
  const nameOf = (b) => (b.id === "home" ? "Sua casa" : b.name || STYLE_N[b.style] || null);

  const base = drawMinimap;
  drawMinimap = function (big, t) {
    if (!big) return roundMini(t);
    if (game.worldMap) return base.apply(this, arguments);
    const z = ZONES[player.zone];
    if (!z) return base.apply(this, arguments);
    const B = regionMapBox(player.zone);
    // fundo escurecido da tela toda
    ctx.fillStyle = "rgba(8,5,14,.93)";
    ctx.fillRect(0, 0, viewWidth, 480);
    // tudo o que é do mapa fica dentro do quadrado
    ctx.save();
    const R0 = SQ / 2,
      CX = B.sx + R0,
      CY = B.sy + R0;
    ctx.beginPath();
    ctx.arc(CX, CY, R0, 0, Math.PI * 2);
    ctx.clip();
    // fundo do pergaminho (aparece onde a região acaba)
    ctx.fillStyle = "#2a2238";
    ctx.fillRect(B.sx, B.sy, SQ, SQ);
    base.call(this, big, t);
    // nomes dos prédios (com contorno, legíveis em qualquer fundo)
    if (B.s >= 4) {
      ctx.font = `700 ${B.s >= 8 ? 12 : 10}px "Pixelify Sans", sans-serif`;
      ctx.textAlign = "center";
      ctx.lineJoin = "round";
      const used = [];
      for (const b of z.town ? z.town.bld : []) {
        const n = nameOf(b);
        if (!n) continue;
        const x = B.ox + (b.x + b.w / 2) * B.s,
          y = B.oy + b.y * B.s - 3;
        if (x < B.sx - 40 || x > B.sx + SQ + 40 || y < B.sy - 10 || y > B.sy + SQ + 10) continue;
        const tw = ctx.measureText(n).width + 6;
        if (used.some(([ux, uy, uw]) => Math.abs(ux - x) < (uw + tw) / 2 && Math.abs(uy - y) < 13)) continue;
        used.push([x, y, tw]);
        ctx.strokeStyle = "rgba(20,14,30,.95)";
        ctx.lineWidth = 3;
        ctx.strokeText(n, x, y);
        ctx.fillStyle = b.id === "home" ? "#9ff0a8" : "#fff3d6";
        ctx.fillText(n, x, y);
      }
    }
    // você: seta que pisca, sempre do mesmo tamanho
    const px = B.ox + ((player.rx ?? player.x) + 0.5) * B.s,
      py = B.oy + ((player.ry ?? player.y) + 0.5) * B.s;
    ctx.fillStyle = "rgba(255,255,255,.25)";
    ctx.beginPath();
    ctx.arc(px, py, 9 + Math.sin(t * 5) * 2, 0, 7);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.strokeStyle = "#1a1420";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(px, py - 7);
    ctx.lineTo(px + 5, py + 5);
    ctx.lineTo(px, py + 2);
    ctx.lineTo(px - 5, py + 5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    // moldura, título e ajuda
    // moldura redonda de bússola: aro dourado, marcas e os pontos cardeais
    ctx.strokeStyle = "#5a4320";
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(CX, CY, R0 + 4, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = "#c9a03a";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(CX, CY, R0 + 1, 0, Math.PI * 2);
    ctx.stroke();
    for (let i = 0; i < 32; i++) {
      const a = (i / 32) * Math.PI * 2,
        l = i % 8 ? 4 : 8;
      ctx.beginPath();
      ctx.moveTo(CX + Math.cos(a) * (R0 + 2), CY + Math.sin(a) * (R0 + 2));
      ctx.lineTo(CX + Math.cos(a) * (R0 + 2 + l), CY + Math.sin(a) * (R0 + 2 + l));
      ctx.stroke();
    }
    ctx.font = '700 14px "Pixelify Sans", sans-serif';
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (const [n, dx, dy] of [["N", 0, -1], ["S", 0, 1], ["L", 1, 0], ["O", -1, 0]]) {
      const x = CX + dx * (R0 + 16),
        y = CY + dy * (R0 + 16);
      ctx.fillStyle = "#1a1420";
      ctx.beginPath();
      ctx.arc(x, y, 9, 0, 7);
      ctx.fill();
      ctx.fillStyle = n === "N" ? "#ff7a6a" : "#f2c14e";
      ctx.fillText(n, x, y + 1);
    }
    ctx.textBaseline = "alphabetic";
    ctx.textAlign = "center";
    ctx.font = '700 20px "Pixelify Sans", sans-serif';
    ctx.fillStyle = "#f2c14e";
    // o nome da região fica à esquerda (em cima fica o N da bússola)
    if (B.sx > 200) {
      ctx.textAlign = "right";
      ctx.fillText(z.nome || "", B.sx - 24, B.sy + 24);
    } else ctx.fillText(z.nome || "", viewWidth / 4, 22);
    ctx.font = "15px VT323, monospace";
    ctx.fillStyle = "#cfc3e6";
    const help = ["Arraste ou setas: andar pelo mapa", "+ / −: zoom", "C: voltar para você", "Tab: mapa do mundo", "M ou Esc: fechar"];
    ctx.textAlign = "left";
    const lx = B.sx + SQ + 34;
    const hw = Math.max(...help.map((h) => ctx.measureText(h).width));
    if (lx + hw + 8 < viewWidth) help.forEach((h, i) => ctx.fillText(h, lx, B.sy + 20 + i * 20));
    else {
      ctx.textAlign = "center";
      ctx.fillText(help.join(" · "), viewWidth / 2, 477);
    }
    // escala do zoom
    const zl = B.sx - 34;
    if (zl > 40) {
      ctx.textAlign = "right";
      ctx.fillText("Zoom", zl, B.sy + 60);
      for (let i = 0; i < ZOOMS.length; i++) {
        ctx.fillStyle = i <= V.zi ? "#f2c14e" : "#4a3f66";
        ctx.fillRect(zl - 30, B.sy + 70 + (ZOOMS.length - 1 - i) * 12, 30, 8);
      }
    }
  };

  /* ----- o minimapa do canto também é redondo (uma bússola pequena) e abre o mapa ao tocar ----- */
  const MINI = (window.MINIMAP_HIT = { cx: 0, cy: 0, r: 46 });
  function roundMini(t) {
    const z = ZONES[player.zone];
    if (!z || z.town && z.town.indoor) return;
    const R = MINI.r,
      cx = viewWidth - 10 - R,
      cy = 40 + (game.mmDy || 34) + R;
    MINI.cx = cx;
    MINI.cy = cy;
    const k = 2.4; // pixels por bloco
    const px = (player.rx ?? player.x) + 0.5,
      py = (player.ry ?? player.y) + 0.5;
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(20,14,30,.92)";
    ctx.fill();
    ctx.clip();
    const mm = typeof minimapOf === "function" ? minimapOf(player.zone) : null;
    if (mm && mm.c) {
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(mm.c, cx - px * k, cy - py * k, z.w * k, z.h * k);
    }
    // você no meio
    ctx.fillStyle = "#fff";
    ctx.strokeStyle = "#1a1420";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx, cy - 5);
    ctx.lineTo(cx + 4, cy + 4);
    ctx.lineTo(cx, cy + 2);
    ctx.lineTo(cx - 4, cy + 4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    // aro dourado e o N
    ctx.strokeStyle = "#5a4320";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(cx, cy, R + 2, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = "#c9a03a";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = "#1a1420";
    ctx.beginPath();
    ctx.arc(cx, cy - R, 7, 0, 7);
    ctx.fill();
    ctx.fillStyle = "#ff7a6a";
    ctx.font = '700 10px "Pixelify Sans", sans-serif';
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("N", cx, cy - R + 1);
    ctx.textBaseline = "alphabetic";
  }
  // tocar no minimapa abre o mapa redondo
  const inMini = (e) => {
    if (game.mode !== "world" || !MINI.cx || !game.showMM) return false;
    const r = byId("cv").getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * viewWidth,
      y = ((e.clientY - r.top) / r.height) * 480;
    return Math.hypot(x - MINI.cx, y - MINI.cy) <= MINI.r + 4;
  };
  let miniDown = false;
  addEventListener(
    "pointerdown",
    (e) => {
      miniDown = inMini(e);
      if (miniDown) (e.stopImmediatePropagation(), e.preventDefault());
    },
    true,
  );
  addEventListener(
    "pointerup",
    (e) => {
      if (!miniDown) return;
      miniDown = false;
      e.stopImmediatePropagation();
      e.preventDefault();
      if (inMini(e) && typeof openMap === "function") openMap();
    },
    true,
  );

  // abrir: centra em você
  const omBase = openMap;
  openMap = function () {
    const r = omBase.apply(this, arguments);
    if (game.mode === "map") {
      V.zone = null; // recalcula o zoom e o centro
      game.worldMap = false;
    }
    return r;
  };

  // teclado: andar pelo mapa e zoom
  const kBase = KEY_HANDLERS.map;
  KEY_HANDLERS.map = (k, e) => {
    if (!game.worldMap && ZONES[player.zone]) {
      const step = 40 / ZOOMS[V.zi];
      const mv = { arrowleft: [-1, 0], a: [-1, 0], arrowright: [1, 0], d: [1, 0], arrowup: [0, -1], w: [0, -1], arrowdown: [0, 1], s: [0, 1] }[k];
      if (mv) {
        e && e.preventDefault && e.preventDefault();
        V.cx += mv[0] * step;
        V.cy += mv[1] * step;
        return;
      }
      if (k === "+" || k === "=" || k === "e") return (V.zi = Math.min(ZOOMS.length - 1, V.zi + 1)), playSound(620, 0.03, "sine");
      if (k === "-" || k === "_" || k === "q") return (V.zi = Math.max(0, V.zi - 1)), playSound(480, 0.03, "sine");
      if (k === "c") return centerOnPlayer();
    }
    return kBase(k, e);
  };

  // arrastar com o dedo/mouse e rodinha para o zoom
  let drag = null;
  const toLocal = (e) => {
    const r = byId("cv").getBoundingClientRect();
    return [((e.clientX - r.left) / r.width) * viewWidth, ((e.clientY - r.top) / r.height) * 480];
  };
  addEventListener(
    "pointerdown",
    (e) => {
      if (game.mode !== "map" || game.worldMap) return;
      const [x, y] = toLocal(e);
      const { sx, sy } = box();
      if (Math.hypot(x - (sx + SQ / 2), y - (sy + SQ / 2)) > SQ / 2) return;
      drag = { x: e.clientX, y: e.clientY, cx: V.cx, cy: V.cy };
    },
    true,
  );
  addEventListener("pointermove", (e) => {
    if (!drag || game.mode !== "map") return;
    const r = byId("cv").getBoundingClientRect();
    const k = ZOOMS[V.zi] * (r.width / viewWidth);
    V.cx = drag.cx - (e.clientX - drag.x) / k;
    V.cy = drag.cy - (e.clientY - drag.y) / k;
  });
  addEventListener("pointerup", () => (drag = null));
  addEventListener(
    "wheel",
    (e) => {
      if (game.mode !== "map" || game.worldMap) return;
      e.preventDefault();
      V.zi = Math.max(0, Math.min(ZOOMS.length - 1, V.zi + (e.deltaY < 0 ? 1 : -1)));
    },
    { passive: false },
  );
})();
