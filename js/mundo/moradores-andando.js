/**
 * ECOS DO ARCANO — moradores-andando.js
 * Os moradores da rua não ficam mais plantados perto de casa: de tempos em
 * tempos cada um sai para um compromisso (a porta de uma loja, a fonte, a
 * feira, um banco da praça), anda até lá pelo caminho, fica um pouco (entra
 * na loja, conversa, olha as barracas) e depois volta para o seu canto.
 * Modifica (envolve) funções de outros arquivos: update.
 */

"use strict";

(() => {
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const rnd = (a, b) => a + Math.random() * (b - a);
  const key = (x, y) => x + "," + y;

  function destinations(zone) {
    const z = ZONES[zone];
    const out = [];
    for (const b of z.town.bld) if (b.name && b.door) out.push({ x: b.door[0], y: b.y + b.h, kind: "loja", name: b.name });
    for (const k of Object.keys(z.town.stalls || {})) {
      const [x, y] = k.split(",").map(Number);
      out.push({ x, y: y + 1, kind: "feira" });
    }
    for (let y = 1; y < z.h - 1; y++)
      for (let x = 1; x < z.w - 1; x++) if (z.map[y][x] === "F" || z.map[y][x] === "W") out.push({ x, y: y + 1, kind: "fonte" });
    return out;
  }
  function path(zone, sx, sy, tx, ty) {
    const z = ZONES[zone];
    const prev = new Map([[key(sx, sy), null]]);
    const q = [[sx, sy]];
    let found = null;
    for (let qi = 0; qi < q.length && qi < 5000; qi++) {
      const [x, y] = q[qi];
      if (Math.abs(x - tx) + Math.abs(y - ty) <= 1) {
        found = [x, y];
        break;
      }
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx,
          ny = y + dy,
          k = key(nx, ny);
        if (prev.has(k) || nx < 1 || ny < 1 || nx >= z.w - 1 || ny >= z.h - 1) continue;
        if (!walkable(zone, nx, ny)) continue;
        prev.set(k, [x, y]);
        q.push([nx, ny]);
      }
    }
    if (!found) return null;
    const out = [];
    let cur = found;
    while (cur && !(cur[0] === sx && cur[1] === sy)) {
      out.unshift(cur);
      cur = prev.get(key(...cur));
    }
    return out;
  }
  const SAY = {
    loja: ["Vou ver se chegou tecido novo.", "Preciso de sal e farinha.", "Bom dia! Tem pão?"],
    feira: ["Quanto essa maçã?", "Na feira de ontem estava mais barato!", "Olha que queijo bonito."],
    fonte: ["Que calor... água fresquinha.", "Vou encher o balde.", "Soube da última? Senta aqui que eu conto."],
  };

  let acc = 0;
  const upBase = update;
  update = function (dt) {
    upBase(dt);
    const z = ZONES[player.zone];
    if (!z || !z.town || player.zone === "interior" || game.mode !== "world" || game.dialog || !game.roam) return;
    if (typeof sleepTime === "function" && sleepTime()) return;
    dt = Math.min(dt, 0.1);
    acc += dt;
    const step = acc >= 0.32;
    if (step) acc = 0;
    const busy = game.roam.filter((r) => r.errand).length;
    for (const r of game.roam) {
      const E = r.errand;
      if (!E) {
        r.calm = (r.calm ?? rnd(4, 18)) - dt;
        if (r.calm <= 0 && busy < Math.max(2, game.roam.length * 0.6) && Math.abs(r.x - player.x) + Math.abs(r.y - player.y) > 1) {
          r.calm = rnd(14, 30);
          const D = destinations(player.zone).filter((d) => Math.abs(d.x - r.x) + Math.abs(d.y - r.y) > 4 && Math.abs(d.x - r.x) + Math.abs(d.y - r.y) < 30);
          if (!D.length) continue;
          const d = pick(D);
          const p = path(player.zone, r.x, r.y, d.x, d.y);
          if (p && p.length) r.errand = { d, p, stay: rnd(5, 12), back: false };
        }
        continue;
      }
      r.timer = 1; // o passeio aleatório da base fica parado enquanto há compromisso
      if (!step) continue;
      if (E.p.length) {
        const [nx, ny] = E.p[0];
        const blocked = (nx === player.x && ny === player.y) || game.roam.some((o) => o !== r && o.x === nx && o.y === ny);
        if (blocked) {
          E.wait = (E.wait || 0) + 1;
          if (E.wait > 6) r.errand = null;
          continue;
        }
        E.wait = 0;
        r.dir = nx > r.x ? "right" : nx < r.x ? "left" : ny > r.y ? "down" : "up";
        r.x = nx;
        r.y = ny;
        r.moving = true;
        E.p.shift();
        continue;
      }
      r.moving = false;
      if (!E.back) {
        if (!E.said && Math.abs(r.x - player.x) + Math.abs(r.y - player.y) < 8) {
          E.said = true;
          game.shouts = (game.shouts || []).concat([{ x: r.x, y: r.y, txt: pick(SAY[E.d.kind] || SAY.loja), t: 2.6 }]);
        }
        E.stay -= 0.32;
        if (E.stay <= 0) {
          const p = path(player.zone, r.x, r.y, r.hx, r.hy);
          if (p) (E.p = p), (E.back = true);
          else r.errand = null;
        }
      } else r.errand = null;
    }
  };
})();
