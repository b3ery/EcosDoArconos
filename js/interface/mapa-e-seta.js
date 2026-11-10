/**
 * ECOS DO ARCANO — mapa-e-seta.js (os dois modos)
 *  - Seta azul das entregas: trabalhos do quadro (entregar itens, levar
 *    mensagens) e pedidos das vilas prontos para entregar ganham uma seta azul
 *    própria, com o nome de quem espera. A seta dourada continua na história.
 *  - Mapa clicável (M): clique ou toque em qualquer coisa do mapa da região
 *    para ver o que é, e em "Ir até lá" para o personagem andar sozinho.
 *    No mapa do mundo (Tab), clique numa região para ver o que tem lá.
 *  - O mapa mostra também quebra-cabeças, lugares descobertos, pedidos e entregas.
 * Modifica (envolve) funções de outros arquivos: closeMap, draw, drawMinimap.
 */

"use strict";

/* ===================== ALVOS DAS ENTREGAS ===================== */
function npcZoneOf(id) {
  for (const z of Object.keys(ZONES)) if ((ZONES[z].npcList || []).some((n) => n[2] === id)) return z;
  return "vila";
}
function npcSpotIn(z, id) {
  if (z === "vila") {
    const p = npcPos(id);
    return [p[0], p[1] + 1];
  }
  const p = zoneNpcPos(z, id);
  return [p[0], p[1] + 1];
}
/** Lista de entregas e pedidos em andamento: { label, zone, pos }. */
function deliveryTargets() {
  const out = [];
  for (const j of player.jobs || []) {
    if (j.type === "deliver" && NPCS[j.to]) {
      const z = npcZoneOf(j.to);
      out.push({ label: `Entrega: ${shortName(j.to)}${itemCount(j.item) < j.n ? ` (falta ${ITEMS[j.item].nome})` : ""}`, zone: z, pos: npcSpotIn(z, j.to) });
    } else if (j.type === "visit" && ZONES[j.zone]) out.push({ label: `Mensagem: ${j.place}`, zone: j.zone, pos: [j.x, j.y] });
  }
  if (typeof TOWN_QUESTS !== "undefined" && typeof townQuestState === "function")
    for (const q of TOWN_QUESTS) {
      if (townQuestState(q) !== "ativo") continue;
      const ready = Object.entries(q.need || {}).every(([it, n]) => itemCount(it) >= n);
      if (!ready || !NPCS[q.giver]) continue;
      const z = npcZoneOf(q.giver);
      out.push({ label: `Pedido pronto: ${shortName(q.giver)}`, zone: z, pos: npcSpotIn(z, q.giver) });
    }
  return out;
}
/** A entrega mais perto (as da região onde você está vêm primeiro). */
function deliveryTarget() {
  const list = deliveryTargets();
  if (!list.length) return null;
  const here = list.filter((d) => d.zone === player.zone);
  const pick = (here.length ? here : list).sort((a, b) => Math.abs(a.pos[0] - player.x) + Math.abs(a.pos[1] - player.y) - (Math.abs(b.pos[0] - player.x) + Math.abs(b.pos[1] - player.y)))[0];
  const r = route(pick.zone, pick.pos);
  return { ...pick, x: r.x, y: r.y, hop: r.hop };
}

/* ===================== SETA AZUL ===================== */
function drawDeliveryArrow(t) {
  const D = deliveryTarget();
  if (!D || !game.cam) return;
  const { camX, camY, Z } = game.cam;
  const tx = (D.x * TILE + 16 - camX) * Z,
    ty = (D.y * TILE + 16 - camY) * Z;
  const label = D.hop ? `${D.label} · ${ZONES[D.zone].nome}` : D.label;
  ctx.save();
  ctx.font = '600 13px "Pixelify Sans", sans-serif';
  ctx.textAlign = "center";
  if (tx > 24 && tx < viewWidth - 24 && ty > 24 && ty < 456) {
    const b = Math.sin(t * 5 + 1) * 4;
    ctx.fillStyle = "#5fd0ff";
    ctx.strokeStyle = "#0a2a4a";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(tx, ty - 16 + b);
    ctx.lineTo(tx - 7, ty - 27 + b);
    ctx.lineTo(tx + 7, ty - 27 + b);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.strokeText(label, tx, ty - 32 + b);
    ctx.fillText(label, tx, ty - 32 + b);
  } else {
    const cx = viewWidth / 2,
      cy = 250,
      a = Math.atan2(ty - cy, tx - cx);
    const ex = Math.max(50, Math.min(viewWidth - 50, cx + Math.cos(a) * (viewWidth * 0.55))),
      ey = Math.max(110, Math.min(420, cy + Math.sin(a) * 380));
    ctx.translate(ex, ey);
    ctx.fillStyle = "#5fd0ff";
    ctx.strokeStyle = "#0a2a4a";
    ctx.lineWidth = 2;
    ctx.save();
    ctx.rotate(a);
    ctx.beginPath();
    ctx.moveTo(14, 0);
    ctx.lineTo(-8, -9);
    ctx.lineTo(-3, 0);
    ctx.lineTo(-8, 9);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    ctx.strokeText(label, 0, 26);
    ctx.fillText(label, 0, 26);
  }
  ctx.restore();
}

/* ===================== O QUE TEM NO MAPA ===================== */
const FEAT_NAME = { C: "Baú", F: "Altar (cura e salva)", L: "Livro antigo", P: "Página do diário de Vesper", G: "Guardião" };
function mapThings(zone) {
  const z = ZONES[zone],
    seen = seenOf(zone),
    out = [];
  const isSeen = (x, y) => !!seen[y * z.w + x];
  for (const [x, y, c] of z.feats) {
    if (!isSeen(x, y)) continue;
    if (c === "N") {
      const id = z.npcs && z.npcs[`${x},${y}`];
      if (id && NPCS[id]) out.push({ x, y, n: NPCS[id].nome, d: typeof calmMarker === "function" && story() && calmMarker(id) ? "★ Tem um pedido para você." : "Morador." });
    } else if (c === "C") {
      const open = player.taken.includes(`${zone}:${x},${y}`);
      out.push({ x, y, n: FEAT_NAME.C, d: open ? "Já aberto." : "Ainda fechado!" });
    } else if (c === "G") out.push({ x, y, n: `${FEAT_NAME.G}: ${(ENEMIES[z.guard] || {}).nome || "?"}`, d: player.guards.includes(zone) ? "Já libertado." : "Ainda preso." });
    else if (FEAT_NAME[c]) out.push({ x, y, n: FEAT_NAME[c], d: c === "P" && player.pages.includes(zone) ? "Já lida." : "" });
  }
  if (story()) {
    if (typeof PUZZLES !== "undefined")
      for (const P of PUZZLES) {
        const p = P.zone === zone && pzSpot(P);
        if (p && isSeen(p[0], p[1])) out.push({ x: p[0], y: p[1], n: P.n, d: pzSolved(P.id) ? "Quebra-cabeça resolvido." : "Quebra-cabeça ainda não resolvido.", col: "#c99aff" });
      }
    if (typeof LANDMARKS !== "undefined")
      for (const L of LANDMARKS) {
        const p = L.z === zone && lmSpot(L);
        if (!p || !isSeen(p[0], p[1])) continue;
        if (lmFound()[L.id]) out.push({ x: p[0], y: p[1], n: L.n, d: "Lugar descoberto.", col: "#ffd34d" });
        else if (L.need) out.push({ x: p[0], y: p[1], n: OBSTACLE[L.need].n, d: `Algo escondido. Precisa de ${RUNES[L.need].nome}.`, col: "#9a8a70" });
      }
    const q = urgent() || curStep();
    if (q.zone === zone) {
      const p = q.pos();
      if (p) out.push({ x: p[0], y: p[1], n: "Missão", d: q.t, col: "#f2c14e" });
    }
  }
  for (const D of deliveryTargets()) if (D.zone === zone) out.push({ x: D.pos[0], y: D.pos[1], n: D.label, d: "Entrega em andamento.", col: "#5fd0ff" });
  return out;
}

/* ===================== GEOMETRIA DOS MAPAS ===================== */
function regionMapBox(zone) {
  const z = ZONES[zone];
  const s = Math.min(560 / z.w, 330 / z.h),
    mw = z.w * s,
    mh = z.h * s;
  return { s, ox: Math.round(viewWidth / 2 - mw / 2), oy: Math.round(236 - mh / 2), mw, mh };
}
function worldMapNodes() {
  const W = Math.min(620, viewWidth - 40),
    H = 360,
    ox = viewWidth / 2 - W / 2,
    oy = 70;
  const pos = worldLayout();
  const xs = Object.values(pos).map((p) => p[0]),
    ys = Object.values(pos).map((p) => p[1]);
  const minX = Math.min(...xs),
    maxX = Math.max(...xs),
    minY = Math.min(...ys),
    maxY = Math.max(...ys);
  const sc = Math.min((W - 140) / Math.max(1, maxX - minX), (H - 110) / Math.max(1, maxY - minY));
  return Object.keys(pos).map((z) => ({ z, x: ox + 70 + (pos[z][0] - minX) * sc + (W - 140 - (maxX - minX) * sc) / 2, y: oy + 55 + (pos[z][1] - minY) * sc + (H - 110 - (maxY - minY) * sc) / 2 }));
}
function zoneSummary(z) {
  const Z = ZONES[z] || {};
  const lines = [];
  const seen = player.visited.includes(z) || z === "vila";
  if (!seen) return ["Você ainda não esteve aqui."];
  if (Z.guard && Z.guard !== "silenciador") lines.push(`Guardião: ${(ENEMIES[Z.guard] || {}).nome || "?"} · ${player.guards.includes(z) ? "libertado ✓" : "preso"}`);
  if (story() && typeof LANDMARKS !== "undefined" && LM_REGIONS.includes(z)) lines.push(`Lugares escondidos: ${lmCount(z)[0]}/${lmCount(z)[1]}`);
  if (story() && typeof PUZZLES !== "undefined") for (const P of PUZZLES.filter((q) => q.zone === z)) lines.push(`${P.n}: ${pzSolved(P.id) ? "resolvido ✓" : "a resolver"}`);
  const chests = (Z.feats || []).filter((f) => f[2] === "C");
  if (chests.length) lines.push(`Baús abertos: ${chests.filter(([x, y]) => player.taken.includes(`${z}:${x},${y}`)).length}/${chests.length}`);
  if (story() && !player.finished && curStep().zone === z) lines.push(`Missão aqui: ${curStep().t}`);
  for (const D of deliveryTargets()) if (D.zone === z) lines.push(D.label);
  return lines.length ? lines : ["Nada de especial por enquanto."];
}

/* ===================== CARTÃO DE INFORMAÇÃO ===================== */
function mapInfoEl() {
  let el = byId("mapinfo");
  if (!el) {
    el = document.createElement("div");
    el.id = "mapinfo";
    el.className = "box ui";
    byId("screen").appendChild(el);
    const st = document.createElement("style");
    st.textContent = `#mapinfo{position:absolute;z-index:65;min-width:180px;max-width:280px;padding:8px 10px;font-size:13px;display:none;pointer-events:auto}
    #mapinfo b{display:block;color:var(--gold,#ffd34d);margin-bottom:2px} #mapinfo small{display:block;opacity:.85;margin:2px 0}
    #mapinfo button{margin-top:6px;margin-right:4px}`;
    document.head.appendChild(st);
  }
  return el;
}
function hideMapInfo() {
  const el = byId("mapinfo");
  if (el) el.style.display = "none";
}
function showMapInfo(clientX, clientY, html, go) {
  const el = mapInfoEl();
  el.innerHTML = html + `<div>${go ? '<button id="mapgo">Ir até lá</button>' : ""}<button id="mapx">Fechar</button></div>`;
  el.style.display = "block";
  const sr = byId("screen").getBoundingClientRect();
  el.style.left = Math.min(sr.width - 290, Math.max(8, clientX - sr.left + 12)) + "px";
  el.style.top = Math.min(sr.height - 150, Math.max(8, clientY - sr.top - 20)) + "px";
  byId("mapx").onclick = (e) => (e.stopPropagation(), hideMapInfo());
  if (go)
    byId("mapgo").onclick = (e) => {
      e.stopPropagation();
      hideMapInfo();
      closeMap();
      go();
    };
}
function mapClick(e) {
  if (game.mode !== "map") return;
  const r = byId("cv").getBoundingClientRect();
  const lx = ((e.clientX - r.left) / r.width) * viewWidth,
    ly = ((e.clientY - r.top) / r.height) * 480;
  if (game.worldMap) {
    const n = worldMapNodes().find((q) => Math.hypot(q.x - lx, q.y - ly) < 30);
    if (!n) return hideMapInfo();
    const nome = (ZONES[n.z] && ZONES[n.z].nome) || n.z;
    const here = player.zone === n.z;
    return showMapInfo(e.clientX, e.clientY, `<b>${nome}${here ? " · você está aqui" : ""}</b>${zoneSummary(n.z).map((l) => `<small>${l}</small>`).join("")}`, here ? null : null);
  }
  const z = ZONES[player.zone];
  if (!z) return;
  const B = regionMapBox(player.zone);
  const tx = (lx - B.ox) / B.s - 0.5,
    ty = (ly - B.oy) / B.s - 0.5;
  if (tx < -2 || ty < -2 || tx > z.w + 1 || ty > z.h + 1) return hideMapInfo();
  const near = mapThings(player.zone)
    .map((q) => ({ ...q, dd: Math.hypot(q.x - tx, q.y - ty) }))
    .filter((q) => q.dd <= Math.max(2.2, 10 / B.s))
    .sort((a, b) => a.dd - b.dd);
  const X = Math.round(tx),
    Y = Math.round(ty);
  const seen = seenOf(player.zone);
  const go = (gx, gy) => () => typeof tapWalkTo === "function" && tapWalkTo(gx, gy);
  if (near.length) {
    const top = near.slice(0, 3);
    return showMapInfo(e.clientX, e.clientY, top.map((q) => `<b style="color:${q.col || ""}">${q.n}</b>${q.d ? `<small>${q.d}</small>` : ""}`).join(""), go(top[0].x, top[0].y));
  }
  if (X >= 0 && Y >= 0 && X < z.w && Y < z.h && seen[Y * z.w + X]) {
    const lab = typeof targetAt === "function" ? targetAt(X, Y) : null;
    return showMapInfo(e.clientX, e.clientY, `<b>${lab || (walkable(player.zone, X, Y) ? "Caminho livre" : "Não dá para passar")}</b>`, walkable(player.zone, X, Y) || lab ? go(X, Y) : null);
  }
  showMapInfo(e.clientX, e.clientY, "<b>Ainda não explorado</b><small>Ande por aqui para revelar o mapa.</small>", null);
}

/* ===================== LIGAÇÕES ===================== */
{
  byId("cv").addEventListener("click", mapClick);
  const cmBase = closeMap;
  closeMap = function () {
    hideMapInfo();
    return cmBase.apply(this, arguments);
  };
  const drawBase = draw;
  draw = function () {
    drawBase();
    if (game.mode === "world" && !game.cine) {
      try {
        drawDeliveryArrow(game.t);
      } catch (e) {}
    }
  };
  const dmBase = drawMinimap;
  drawMinimap = function (big, t) {
    dmBase(big, t);
    if (big && game.worldMap) return;
    const z = ZONES[player.zone];
    if (!z) return;
    let s, ox, oy;
    if (big) ({ s, ox, oy } = regionMapBox(player.zone));
    else {
      s = Math.min(96 / z.w, 72 / z.h);
      ox = Math.round(viewWidth - 8 - z.w * s);
      oy = 40;
    }
    const r = Math.max(2, s * (big ? 0.6 : 1));
    ctx.save();
    if (!big) ctx.globalAlpha = 0.9;
    for (const q of mapThings(player.zone)) {
      if (!q.col || q.n === "Missão") continue;
      ctx.fillStyle = q.col;
      ctx.beginPath();
      ctx.arc(ox + (q.x + 0.5) * s, oy + (q.y + 0.5) * s, r, 0, 7);
      ctx.fill();
    }
    ctx.restore();
    if (big) {
      ctx.save();
      ctx.font = "15px VT323, monospace";
      ctx.textAlign = "center";
      const items = [["#5fd0ff", "Entrega"], ["#c99aff", "Quebra-cabeça"], ["#ffd34d", "Lugar descoberto"], ["#9a8a70", "Obstáculo"]];
      const label = "Clique ou toque para ver o que é:";
      ctx.textAlign = "left";
      const widths = items.map(([, n]) => ctx.measureText(n).width + 22);
      let x = viewWidth / 2 - (ctx.measureText(label).width + 10 + widths.reduce((a, b) => a + b, 0)) / 2;
      ctx.fillStyle = "#cfe8ff";
      ctx.fillText(label, x, 476);
      x += ctx.measureText(label).width + 10;
      items.forEach(([c, n], i) => {
        ctx.fillStyle = c;
        ctx.beginPath();
        ctx.arc(x + 5, 471, 4, 0, 7);
        ctx.fill();
        ctx.fillStyle = "#cfe8ff";
        ctx.fillText(n, x + 13, 476);
        x += widths[i];
      });
      ctx.restore();
    }
  };
}
