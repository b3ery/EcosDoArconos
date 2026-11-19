/**
 * ECOS DO ARCANO — mapa-quadrado.js
 * O mapa da região (M) como nos jogos de RPG:
 *  - uma janela QUADRADA fixa no meio da tela, que abre centrada em você;
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
  const SQ = 420; // lado do quadrado (na tela de 480 de altura)
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
    if (!big || game.worldMap) return base.apply(this, arguments);
    const z = ZONES[player.zone];
    if (!z) return base.apply(this, arguments);
    const B = regionMapBox(player.zone);
    // fundo escurecido da tela toda
    ctx.fillStyle = "rgba(8,5,14,.82)";
    ctx.fillRect(0, 0, viewWidth, 480);
    // tudo o que é do mapa fica dentro do quadrado
    ctx.save();
    ctx.beginPath();
    ctx.rect(B.sx, B.sy, SQ, SQ);
    ctx.clip();
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
        if (used.some(([ux, uy]) => Math.abs(ux - x) < 64 && Math.abs(uy - y) < 13)) continue;
        used.push([x, y]);
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
    ctx.strokeStyle = "#c9a03a";
    ctx.lineWidth = 3;
    ctx.strokeRect(B.sx - 2, B.sy - 2, SQ + 4, SQ + 4);
    ctx.textAlign = "center";
    ctx.font = '700 20px "Pixelify Sans", sans-serif';
    ctx.fillStyle = "#f2c14e";
    ctx.fillText(z.nome || "", viewWidth / 2, B.sy - 8);
    ctx.font = "15px VT323, monospace";
    ctx.fillStyle = "#cfc3e6";
    const help = ["Arraste ou setas: andar pelo mapa", "+ / −: zoom", "C: voltar para você", "Tab: mapa do mundo", "M ou Esc: fechar"];
    ctx.textAlign = "left";
    const lx = B.sx + SQ + 16;
    if (lx + 150 < viewWidth) help.forEach((h, i) => ctx.fillText(h, lx, B.sy + 20 + i * 20));
    else {
      ctx.textAlign = "center";
      ctx.fillText(help.join(" · "), viewWidth / 2, B.sy + SQ + 18);
    }
    // escala do zoom
    const zl = B.sx - 18;
    if (zl > 40) {
      ctx.textAlign = "right";
      ctx.fillText("Zoom", zl, B.sy + 20);
      for (let i = 0; i < ZOOMS.length; i++) {
        ctx.fillStyle = i <= V.zi ? "#f2c14e" : "#4a3f66";
        ctx.fillRect(zl - 30, B.sy + 30 + (ZOOMS.length - 1 - i) * 12, 30, 8);
      }
    }
  };

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
      if (x < sx || y < sy || x > sx + SQ || y > sy + SQ) return;
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
