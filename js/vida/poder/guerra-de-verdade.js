/**
 * ECOS DO ARCANO — guerra-de-verdade.js  (Simulador de Vida)
 * A guerra de verdade, na rua:
 *  - quem governa Aurélia JÁ TEM EXÉRCITO (60 soldados, mais 30 por reino
 *    conquistado). Não precisa recrutar: o quartel treina recrutas sozinho todo
 *    dia até encher de novo.
 *  - ATACAR um reino: o exército marcha (cena da marcha) e chega na cidade
 *    inimiga. Os seus soldados aparecem no mapa, com bandeira, e avançam pelas
 *    ruas até o castelo. Os defensores esperam no portão, com arqueiros
 *    atirando flechas. Cada lado luta de verdade, soldado contra soldado.
 *  - Você está no meio da batalha: ande e ataque os inimigos (E / toque), mas
 *    cuidado, eles também batem em você.
 *  - Ordens no painel: AVANÇAR, SEGURAR A LINHA ou RECUAR.
 *  - Ganhou: a bandeira de Aurélia sobe no castelo, o reino é seu e você
 *    continua governando os dois (ou os três). Perdeu: volta com quem sobrou.
 * Modifica (envolve) funções de outros arquivos: army, invade, conquerMenu,
 * royalMenu, update, crewDrawList, walkable, targetAt, interactAt, enterZone,
 * onNewDay.
 */

"use strict";

(() => {
  const CAP = () => 60 + 30 * Math.max(0, ruledCount() - 1);
  const COLORS = { aurelia: ["#7a1e3a", "#e8b84a"], mares: ["#1e6a7a", "#ffffff"], serra: ["#4a3020", "#c9a050"] };
  const DEF = { mares: 9, serra: 11 };

  /* ===================== O EXÉRCITO JÁ EXISTE ===================== */
  army = function () {
    if (lifeMode() && rulesK("aurelia") && !player.armyInit) ((player.armyInit = 1), (player.army = Math.max(player.army || 0, CAP())));
    return (player.army = player.army || 0);
  };
  const ndBase = onNewDay;
  onNewDay = function () {
    const r = ndBase.apply(this, arguments);
    if (lifeMode() && rulesK("aurelia") && army() < CAP()) player.army = Math.min(CAP(), army() + 5); // o quartel treina recrutas
    return r;
  };
  // sem "recrutar": o exército é do reino
  const cqBase = conquerMenu;
  conquerMenu = function (k) {
    hookChoice(
      () => cqBase(k),
      (t, x, o) => [t, x + `<br><small>O quartel treina 5 recrutas por dia (máximo ${CAP()}).</small>`, o.filter((q) => !/^Recrutar/.test(q.t))],
    );
  };
  const rmBase = royalMenu;
  royalMenu = function () {
    hookChoice(rmBase, (t, x, o) => [t, x, o.filter((q) => !/\(recrutar\)/.test(q.t))]);
  };

  /* ===================== DECLARAR E MARCHAR ===================== */
  invade = function (k) {
    const K = KINGDOMS[k];
    if (!rulesK("aurelia")) return;
    if (army() < 10) return say([["General", "Majestade, sobraram poucos soldados. Espere uns dias o quartel treinar novos recrutas."]], () => conquerMenu(k));
    choice(`Guerra contra ${K.short}`, `Seu exército: <b>${army()} soldados</b>${friendshipLevel("marcos") >= 2 ? " (o General Marcos comanda)" : ""}. ${K.short} defende o castelo com uns ${DEF[k] * 5} soldados e arqueiros no portão.<br>Você marcha junto, na frente das tropas.`, [
      { t: `Marchar e atacar ${K.short}!`, icon: "sword", fn: () => march(k) },
      { t: "Ainda não", fn: () => conquerMenu(k) },
    ]);
  };
  function march(k) {
    const K = KINGDOMS[k],
      w = worldState();
    if (!atWar("aurelia", k)) {
      w.wars[pairKey("aurelia", k)] = { since: player.day };
      w.rel[pairKey("aurelia", k)] = 10;
      repAdd(-4);
      announceWorld(`GUERRA! ${royalTitle()} marcha contra ${K.n}!`);
    }
    vilaNews(`O exército de Aurélia marchou contra ${K.short}!`);
    const n = army();
    const sc = marchScene(k, n);
    setTimeout(() => {
      const c = game.cine;
      if (c && c.draw === sc) ((c.t0 = -999), endCine());
    }, 6200);
    playCine(sc, 5, () => {
      passTime(6, `Seis horas de marcha até ${K.short}...`);
      startBattle(k);
    });
  }
  function marchScene(k, n) {
    const [c1, c2] = COLORS.aurelia;
    return (W, H, t) => {
      const sky = ctx.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0, "#5a6a9a");
      sky.addColorStop(1, "#e8b07a");
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, W, H);
      // montanhas e campo
      ctx.fillStyle = "#4a5a6a";
      for (let i = 0; i < 6; i++) {
        const x = ((i * 260 - t * 20) % (W + 300)) - 150;
        fillPolygon(x, H * 0.62, x + 140, H * 0.3, x + 300, H * 0.62);
      }
      ctx.fillStyle = "#5a8a3a";
      ctx.fillRect(0, H * 0.6, W, H * 0.4);
      ctx.fillStyle = "#8a7a52";
      ctx.fillRect(0, H * 0.72, W, H * 0.1);
      // a coluna de soldados
      const rows = Math.min(40, Math.ceil(n / 3));
      for (let i = 0; i < rows; i++)
        for (let j = 0; j < 3; j++) {
          const x = W * 0.75 - i * 34 + t * 40 - j * 10,
            y = H * 0.7 + j * 16,
            b = Math.abs(Math.sin(t * 8 + i)) * 3;
          if (x < -40 || x > W + 40) continue;
          ctx.fillStyle = "#3a2a1a";
          ctx.fillRect(x + 4, y + 22 - b, 4, 8);
          ctx.fillRect(x + 12, y + 22 + b - 3, 4, 8);
          ctx.fillStyle = c1;
          ctx.fillRect(x + 2, y + 8 - b, 16, 16);
          ctx.fillStyle = c2;
          ctx.fillRect(x + 8, y + 12 - b, 4, 4);
          ctx.fillStyle = "#e8c4a0";
          ctx.fillRect(x + 5, y - b, 10, 9);
          ctx.fillStyle = "#9a9aa6";
          ctx.fillRect(x + 4, y - 3 - b, 12, 5);
          ctx.fillStyle = "#5a3a22";
          ctx.fillRect(x + 19, y - 18 - b, 2, 42);
          ctx.fillStyle = "#c9c9d2";
          fillPolygon(x + 17, y - 18 - b, x + 23, y - 18 - b, x + 20, y - 26 - b);
          if (j === 1 && i % 8 === 0) {
            // bandeira
            ctx.fillStyle = "#5a3a22";
            ctx.fillRect(x + 8, y - 40 - b, 2, 48);
            ctx.fillStyle = c1;
            fillPolygon(x + 10, y - 40 - b, x + 34, y - 34 - b + Math.sin(t * 6 + i) * 3, x + 10, y - 26 - b);
            ctx.fillStyle = c2;
            ctx.fillRect(x + 15, y - 36 - b, 5, 5);
          }
        }
      // poeira
      ctx.fillStyle = "rgba(200,180,140,.25)";
      for (let i = 0; i < 18; i++) ctx.fillRect(((i * 97 + t * 60) % W) - 20, H * 0.8 + ((i * 31) % 30), 30, 6);
      ctx.textAlign = "center";
      ctx.fillStyle = "#fff";
      ctx.font = '700 28px "Pixelify Sans", sans-serif';
      ctx.fillText(`O exército de Aurélia marcha contra ${KINGDOMS[k].short}`, W / 2, 64);
      ctx.font = '600 18px "Pixelify Sans", sans-serif';
      ctx.fillText(`${n} soldados · tambores, lanças e a bandeira vinho e ouro`, W / 2, 94);
    };
  }

  /* ===================== A BATALHA NA CIDADE ===================== */
  const W8 = [
    [0, 1],
    [0, -1],
    [1, 0],
    [-1, 0],
  ];
  let PASS = null;
  function passMap(z) {
    const Z = ZONES[z],
      P = new Uint8Array(Z.w * Z.h);
    for (let y = 0; y < Z.h; y++) for (let x = 0; x < Z.w; x++) {
      const c = tileAt(z, x, y);
      P[y * Z.w + x] = walkable(z, x, y) || c === "N" || c === "," || c === "." ? 1 : 0;
    }
    return P;
  }
  const passable = (x, y) => {
    const G = game.war,
      w = ZONES[G.z].w;
    return x >= 0 && y >= 0 && x < w && !!G.pass[y * w + x];
  };
  function bfs(z, starts, max = 1e9) {
    const Z = ZONES[z],
      w = Z.w,
      h = Z.h;
    const P = PASS || passMap(z);
    const d = new Int32Array(w * h).fill(-1);
    const q = [];
    for (const [x, y] of starts) if (x >= 0 && y >= 0 && x < w && y < h && d[y * w + x] < 0) ((d[y * w + x] = 0), q.push(x, y));
    for (let i = 0; i < q.length; i += 2) {
      const x = q[i],
        y = q[i + 1],
        c = d[y * w + x];
      if (c >= max) continue;
      for (const [dx, dy] of W8) {
        const nx = x + dx,
          ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= w || ny >= h || d[ny * w + nx] >= 0) continue;
        if (!P[ny * w + nx]) continue;
        d[ny * w + nx] = c + 1;
        q.push(nx, ny);
      }
    }
    return { d, w, order: q };
  }
  function startBattle(k) {
    const K = KINGDOMS[k],
      z = K.zone,
      Z = ZONES[z];
    const seat = Z.town.bld.find((b) => /^(palacio|fortaleza|castle)$/.test(b.style));
    if (!seat) return conquered(k, "guerra");
    const door = [seat.door[0], seat.y + seat.h];
    // o exército se reúne a umas 18 ruas do castelo (perto o bastante para ver as torres)
    const pass = (PASS = passMap(z));
    const flow = bfs(z, [door, [door[0] - 1, door[1]], [door[0] + 1, door[1]]]);
    let a = Z.town.arrive;
    for (let i = 0; i < flow.order.length; i += 2)
      if (flow.d[flow.order[i + 1] * flow.w + flow.order[i]] >= 18) {
        a = [flow.order[i], flow.order[i + 1]];
        break;
      }
    player.zone = z;
    player.x = player.rx = a[0];
    player.y = player.ry = a[1];
    player.riding = false;
    player.dir = "up";
    enterZone();
    game.fade = 1;
    const nA = Math.max(4, Math.min(24, Math.ceil(army() / 5)));
    const per = army() / nA;
    const units = [];
    const near = bfs(z, [[player.x, player.y]], 14).order;
    for (let i = 2; i < near.length && units.filter((u) => u.side === "a").length < nA; i += 2) {
      const x = near[i],
        y = near[i + 1];
      if (flow.d[y * flow.w + x] < 0) continue;
      units.push(unit("a", x, y, false, units.length === 0));
    }
    const nD = DEF[k] || 10;
    let placed = 0;
    for (let i = 0; i < flow.order.length && placed < nD; i += 2) {
      const x = flow.order[i],
        y = flow.order[i + 1];
      if (units.some((u) => u.x === x && u.y === y)) continue;
      units.push(unit("d", x, y, placed < 3, false));
      placed++;
    }
    PASS = null;
    game.war = { k, z, flow, units, per, pass, rally: a, startA: army(), order: "avancar", arrows: [], fx: [], t: 0, pcd: 0, over: false };
    hud(true);
    say([
      ["General", `Chegamos a ${K.short}, Majestade! O castelo é logo ali. Os soldados esperam a sua ordem.`],
      ["", "Ande no meio da batalha e ataque os inimigos (E ou toque). Use os botões AVANÇAR, SEGURAR e RECUAR no painel."],
    ]);
  }
  function unit(side, x, y, arch, flag) {
    return { side, x, y, rx: x, ry: y, hp: arch ? 60 : 100, cd: Math.random(), mv: Math.random() * 0.5, arch, flag, dir: side === "a" ? "up" : "down", hit: 0 };
  }
  const alive = (s) => (game.war ? game.war.units.filter((u) => u.hp > 0 && (!s || u.side === s)) : []);
  const dist = (a, b) => Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));

  /* ----- painel com as ordens ----- */
  function hud(on) {
    let el = document.getElementById("warhud");
    if (!on) return el && el.remove();
    if (!el) {
      el = document.createElement("div");
      el.id = "warhud";
      el.style.cssText = "position:fixed;left:50%;top:56px;transform:translateX(-50%);z-index:40;background:rgba(30,18,12,.88);border:2px solid #c9a050;border-radius:8px;padding:6px 10px;color:#f4e8c8;font:600 13px 'Pixelify Sans',sans-serif;text-align:center;min-width:280px;max-width:calc(100vw - 32px)";
      el.innerHTML = `<div id="warbars"></div><div style="display:flex;gap:6px;justify-content:center;margin-top:5px">${[
        ["avancar", "Avançar!"],
        ["segurar", "Segurar a linha"],
        ["recuar", "Recuar"],
      ]
        .map(([k, n]) => `<button data-o="${k}" style="font:inherit;padding:4px 8px;border-radius:5px;border:1px solid #c9a050;background:#5a2a1a;color:#fff;cursor:pointer">${n}</button>`)
        .join("")}</div>`;
      el.addEventListener("click", (e) => {
        const o = e.target.dataset && e.target.dataset.o;
        if (!o || !game.war) return;
        game.war.order = o;
        toast({ avancar: "AVANÇAR! As tropas correm para o castelo!", segurar: "Segurar a linha! Ninguém sai do lugar.", recuar: "RECUAR! Toquem a corneta!" }[o], 1800);
        playSound(o === "recuar" ? 300 : 520, 0.3, "sawtooth", 0.04);
      });
      document.body.appendChild(el);
    }
    refreshHud();
  }
  function refreshHud() {
    const G = game.war,
      el = document.getElementById("warbars");
    if (!G || !el) return;
    const a = alive("a").length,
      d = alive("d").length;
    const tot = G.units.filter((u) => u.side === "a").length,
      totD = G.units.filter((u) => u.side === "d").length;
    const bar = (n, T, c) => `<span style="display:inline-block;width:90px;height:8px;background:#3a2a20;vertical-align:middle"><span style="display:block;height:8px;width:${(90 * n) / T}px;background:${c}"></span></span>`;
    el.innerHTML = `⚔ Aurélia ${Math.round(a * G.per)} ${bar(a, tot, "#c94a5a")} &nbsp;×&nbsp; ${bar(d, totD, "#5aa0c9")} ${d * 5} ${KINGDOMS[G.k].short}<br><small>Ordem: ${{ avancar: "avançar", segurar: "segurar a linha", recuar: "recuar" }[G.order]}</small>`;
  }

  /* ----- a luta ----- */
  function hit(t, dmg, from) {
    t.hp -= dmg;
    t.hit = 0.25;
    const G = game.war;
    G.fx.push({ x: t.x, y: t.y, t: 0.6, n: Math.round(dmg) });
    if (Math.random() < 0.35) playSound(700 + Math.random() * 500, 0.04, "square", 0.025);
    if (t.hp <= 0) ((t.dead = G.t), G.fx.push({ x: t.x, y: t.y, t: 1.2, blood: 1 }));
  }
  function stepToward(u, tx, ty, occ, away) {
    const z = game.war.z;
    let best = null,
      bd = Math.hypot(u.x - tx, u.y - ty) * (away ? -1 : 1);
    for (const [dx, dy] of W8) {
      const nx = u.x + dx,
        ny = u.y + dy;
      if (occ.has(nx + "," + ny) || !passable(nx, ny)) continue;
      const d = Math.hypot(nx - tx, ny - ty) * (away ? -1 : 1);
      if (d < bd - 0.01) ((bd = d), (best = [nx, ny, dx, dy]));
    }
    return best;
  }
  function stepFlow(u, occ, dir) {
    const F = game.war.flow,
      z = game.war.z;
    const cur = F.d[u.y * F.w + u.x];
    if (cur < 0) return null;
    let best = null,
      bv = cur;
    for (const [dx, dy] of W8) {
      const nx = u.x + dx,
        ny = u.y + dy;
      const v = F.d[ny * F.w + nx];
      if (v < 0 || occ.has(nx + "," + ny)) continue;
      if (dir > 0 ? v < bv : v > bv) ((bv = v), (best = [nx, ny, dx, dy]));
    }
    return best;
  }
  function tick(dt) {
    const G = game.war;
    if (!G || G.over) return;
    if (player.zone !== G.z) return endWar("fuga");
    G.t += dt;
    G.pcd -= dt;
    // cada lado vê onde estão os outros; quem ficou preso passa por entre os aliados
    const occOf = (side) => new Set(alive(side).map((u) => u.x + "," + u.y));
    const occS = { a: occOf("a"), d: occOf("d") };
    occS.d.add(player.x + "," + player.y);
    const me = { x: player.x, y: player.y, isPlayer: true };
    // as tropas andam juntas: quem está muito na frente espera o resto
    const fv = alive("a").map((u) => G.flow.d[u.y * G.flow.w + u.x]).sort((p, q) => p - q);
    const mid = fv.length ? fv[fv.length >> 1] : 0;
    const bonus = friendshipLevel("marcos") >= 2 ? 1.2 : 1;
    for (const u of alive()) {
      u.cd -= dt;
      u.mv -= dt;
      u.hit = Math.max(0, u.hit - dt);
      const foes = alive(u.side === "a" ? "d" : "a");
      if (u.side === "d" && player.hp > 0 && !G.ko) foes.push(me);
      let e = null,
        ed = 99;
      for (const f of foes) {
        const d = dist(u, f);
        if (d < ed) ((ed = d), (e = f));
      }
      if (e) u.dir = Math.abs(e.x - u.x) > Math.abs(e.y - u.y) ? (e.x > u.x ? "right" : "left") : e.y > u.y ? "down" : "up";
      // arqueiro: atira de longe
      if (u.arch) {
        if (e && ed <= 7 && u.cd <= 0) {
          u.cd = 1.7 + Math.random() * 0.6;
          G.arrows.push({ x: u.x, y: u.y, tx: e.x, ty: e.y, t: 0, tgt: e });
        }
        continue;
      }
      if (e && ed <= 1) {
        if (u.cd <= 0) {
          u.cd = 0.8 + Math.random() * 0.4;
          const dmg = u.side === "a" ? (12 + Math.random() * 10) * bonus : 10 + Math.random() * 8;
          if (e.isPlayer) {
            player.hp = Math.max(0, player.hp - Math.round(dmg * 0.18));
            G.fx.push({ x: player.x, y: player.y, t: 0.6, n: Math.round(dmg * 0.18), me: 1 });
            playSound(180, 0.08, "sawtooth", 0.04);
          } else hit(e, dmg, u);
        }
        continue;
      }
      if (u.mv > 0) continue;
      u.mv = 0.38 + Math.random() * 0.2;
      const foeOcc = occS[u.side === "a" ? "d" : "a"],
        myOcc = occS[u.side];
      const occ = u.side === "a" && (u.stuck || 0) > 1.2 ? foeOcc : new Set([...foeOcc, ...myOcc]);
      let s = null;
      if (u.side === "a") {
        if (G.order === "segurar") continue;
        if (G.order === "recuar") s = stepFlow(u, occ, -1);
        else if (e && ed <= 2) s = stepToward(u, e.x, e.y, occ) || stepFlow(u, occ, 1);
        else if (G.flow.d[u.y * G.flow.w + u.x] >= mid - 3) s = stepFlow(u, occ, 1);
      } else if (e && ed <= 3) s = stepToward(u, e.x, e.y, occ); // os defensores seguram o portão
      if (s) {
        myOcc.delete(u.x + "," + u.y);
        u.x = s[0];
        u.y = s[1];
        myOcc.add(u.x + "," + u.y);
        u.stuck = 0;
      } else u.stuck = (u.stuck || 0) + 0.45;
    }
    for (const u of G.units) ((u.rx += (u.x - u.rx) * Math.min(1, dt * 7)), (u.ry += (u.y - u.ry) * Math.min(1, dt * 7)));
    // flechas
    for (const A of G.arrows) {
      A.t += dt * 1.6;
      if (A.t >= 1 && !A.done) {
        A.done = true;
        if (A.tgt.isPlayer) {
          if (Math.abs(player.x - A.tx) + Math.abs(player.y - A.ty) <= 1) ((player.hp = Math.max(0, player.hp - 3)), G.fx.push({ x: player.x, y: player.y, t: 0.6, n: 3, me: 1 }));
        } else if (A.tgt.hp > 0) hit(A.tgt, 9, null);
      }
    }
    G.arrows = G.arrows.filter((A) => A.t < 1.1);
    for (const f of G.fx) f.t -= dt;
    G.fx = G.fx.filter((f) => f.t > 0 || f.blood);
    refreshHud();
    // fim?
    if (player.hp <= 0) {
      // caiu ferid(o): o General arrasta você para trás e a batalha continua
      player.hp = Math.max(1, Math.round(maxHp() * 0.3));
      player.x = player.rx = G.rally[0];
      player.y = player.ry = G.rally[1];
      G.ko = 10;
      say([["General", "Majestade, você caiu! Eu te trouxe para trás das linhas. Respire... as tropas seguram por você."]]);
    }
    G.ko = Math.max(0, (G.ko || 0) - dt);
    if (!alive("d").length) return endWar("vitoria");
    if (!alive("a").length) return endWar("derrota");
    G.recT = G.order === "recuar" ? (G.recT || 0) + dt : 0;
    if (G.recT > 6) return endWar("recuo");
  }
  function endWar(how) {
    const G = game.war;
    if (!G || G.over) return;
    G.over = true;
    const K = KINGDOMS[G.k];
    const left = Math.round(alive("a").length * G.per);
    const lost = Math.max(0, G.startA - left);
    player.army = Math.max(0, left);
    hud(false);
    game.war = null;
    saveGame();
    if (how === "vitoria") {
      playSound(660, 0.4, "triangle", 0.05);
      setTimeout(() => playSound(880, 0.5, "triangle", 0.05), 250);
      return say([["", `Os últimos soldados de ${K.short} largam as armas. A bandeira de Aurélia sobe na torre do castelo!`], ["General", `Vitória, Majestade! Perdemos ${lost} soldados, mas ${K.short} é sua.`]], () => conquered(G.k, "guerra"));
    }
    if (how === "morte") {
      player.hp = 1;
      if (typeof playerDies === "function" && playerDies("guerra", { killerName: `Soldado de ${K.short}` })) return;
    }
    repAdd(-8);
    say([[K.ruler, "Volte para o seu castelo e conte quantos soldados sobraram!"], ["", how === "fuga" ? "Você abandonou o campo de batalha. As tropas recuam sem você." : `A invasão de ${K.short} falhou. Voltaram ${left} soldados (${lost} perdidos). A guerra continua.`]]);
  }
  window.endWar = endWar;

  const upBase = update;
  update = function (dt) {
    upBase(dt);
    if (game.war && game.mode === "world" && !game.dialog) tick(Math.min(dt, 0.1));
  };
  const ezBase = enterZone;
  enterZone = function () {
    const r = ezBase.apply(this, arguments);
    if (game.war && player.zone !== game.war.z) endWar("fuga");
    return r;
  };

  /* ----- você também luta ----- */
  const enemyAt = (x, y) => alive("d").find((u) => u.x === x && u.y === y);
  const wkBase = walkable;
  walkable = function (z, x, y) {
    if (game.war && z === game.war.z && z === player.zone && Math.abs(x - player.x) + Math.abs(y - player.y) === 1 && alive("d").some((u) => u.x === x && u.y === y)) return false;
    return wkBase.apply(this, arguments);
  };
  const tgBase = targetAt;
  targetAt = function (x, y) {
    if (game.war && enemyAt(x, y)) return `Atacar soldado de ${KINGDOMS[game.war.k].short}`;
    if (game.war && alive("a").some((u) => u.x === x && u.y === y)) return "Seu soldado";
    return tgBase.apply(this, arguments);
  };
  const iaBase = interactAt;
  interactAt = function (x, y) {
    const G = game.war;
    if (G) {
      const e = enemyAt(x, y);
      if (e) {
        if (G.pcd > 0) return;
        G.pcd = 0.45;
        hit(e, 24 + Math.random() * 12, null);
        player.dir = x > player.x ? "right" : x < player.x ? "left" : y > player.y ? "down" : "up";
        playSound(900, 0.05, "square", 0.04);
        return;
      }
      if (alive("a").some((u) => u.x === x && u.y === y)) return toast(pk(["Pela Coroa!", "Às suas ordens!", "Vamos tomar esse castelo!"]), 1200);
    }
    return iaBase.apply(this, arguments);
  };

  /* ----- desenho ----- */
  function drawUnit(u, t) {
    const G = game.war,
      [c1, c2] = u.side === "a" ? COLORS.aurelia : COLORS[G.k] || ["#4a4a6a", "#c9c9d2"];
    const X = u.rx * TILE,
      Y = u.ry * TILE;
    if (u.hp <= 0) {
      // caído no chão
      ctx.fillStyle = "rgba(120,10,10,.55)";
      ctx.beginPath();
      ctx.ellipse(X + 16, Y + 26, 13, 5, 0, 0, 7);
      ctx.fill();
      ctx.fillStyle = c1;
      ctx.fillRect(X + 4, Y + 20, 22, 7);
      ctx.fillStyle = "#9a9aa6";
      ctx.fillRect(X + 24, Y + 19, 7, 6);
      return;
    }
    const moving = Math.abs(u.rx - u.x) + Math.abs(u.ry - u.y) > 0.05;
    const lunge = u.cd > 0.6 && !u.arch ? 2 : 0;
    ctx.fillStyle = "rgba(0,0,0,.25)";
    ctx.beginPath();
    ctx.ellipse(X + 16, Y + 30, 9, 3, 0, 0, 7);
    ctx.fill();
    drawSprite(wizardRects(c1, null, "#3a2414", null, u.dir, moving ? Math.floor(t * 6) % 2 : 0), X, Y - lunge, 2, u.dir === "left");
    if (u.hit > 0) ((ctx.fillStyle = "rgba(255,255,255,.55)"), ctx.fillRect(X + 6, Y, 20, 30));
    // capacete, tabardo e arma
    ctx.fillStyle = "#9a9aa6";
    ctx.fillRect(X + 9, Y + 1 - lunge, 14, 5);
    ctx.fillStyle = "#c9c9d2";
    ctx.fillRect(X + 9, Y + 1 - lunge, 14, 1);
    ctx.fillStyle = c2;
    ctx.fillRect(X + 14, Y + 16 - lunge, 4, 4);
    if (u.arch) {
      ctx.strokeStyle = "#6b4423";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(X + 27, Y + 16, 9, -1.2, 1.2);
      ctx.stroke();
      ctx.strokeStyle = "#e8e0c8";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(X + 30, Y + 8);
      ctx.lineTo(X + 30, Y + 24);
      ctx.stroke();
    } else {
      const sx = u.dir === "left" ? X + 2 : X + 28;
      ctx.fillStyle = "#5a3a22";
      ctx.fillRect(sx, Y - 12 - lunge * 2, 2, 40);
      ctx.fillStyle = "#c9c9d2";
      fillPolygon(sx - 2, Y - 12 - lunge * 2, sx + 4, Y - 12 - lunge * 2, sx + 1, Y - 20 - lunge * 2);
      // escudo
      const hx = u.dir === "left" ? X + 22 : X + 2;
      ctx.fillStyle = c1;
      ctx.fillRect(hx, Y + 12, 8, 11);
      ctx.fillStyle = c2;
      ctx.fillRect(hx + 3, Y + 15, 2, 5);
    }
    if (u.flag) {
      ctx.fillStyle = "#5a3a22";
      ctx.fillRect(X + 6, Y - 30, 2, 44);
      ctx.fillStyle = c1;
      fillPolygon(X + 8, Y - 30, X + 30, Y - 24 + Math.sin(t * 6) * 3, X + 8, Y - 16);
      ctx.fillStyle = c2;
      ctx.fillRect(X + 13, Y - 26, 5, 5);
    }
    if (u.hp < (u.arch ? 60 : 100)) {
      ctx.fillStyle = "#2a1a1a";
      ctx.fillRect(X + 6, Y - 6, 20, 3);
      ctx.fillStyle = u.side === "a" ? "#c94a5a" : "#5aa0c9";
      ctx.fillRect(X + 6, Y - 6, (20 * u.hp) / (u.arch ? 60 : 100), 3);
    }
  }
  const cdBase = crewDrawList;
  crewDrawList = function (list, t) {
    cdBase(list, t);
    const G = game.war;
    if (!G || player.zone !== G.z) return;
    for (const u of G.units) list.push({ y: u.hp > 0 ? u.ry : u.ry - 0.6, draw: () => drawUnit(u, t) });
    list.push({
      y: 998,
      draw: () => {
        for (const A of G.arrows) {
          if (A.t > 1) continue;
          const x = (A.x + (A.tx - A.x) * A.t) * TILE + 16,
            y = (A.y + (A.ty - A.y) * A.t) * TILE + 10 - Math.sin(A.t * Math.PI) * 30;
          const ang = Math.atan2(A.ty - A.y - Math.cos(A.t * Math.PI) * 1.5, A.tx - A.x);
          ctx.strokeStyle = "#3a2a1a";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(x - Math.cos(ang) * 8, y - Math.sin(ang) * 8);
          ctx.lineTo(x, y);
          ctx.stroke();
        }
        ctx.textAlign = "center";
        ctx.font = '700 13px "Pixelify Sans", sans-serif';
        for (const f of G.fx) {
          if (f.blood || f.t <= 0) continue;
          ctx.fillStyle = f.me ? "#ff6060" : "#fff2a0";
          ctx.fillText("-" + f.n, f.x * TILE + 16, f.y * TILE - 4 - (0.6 - f.t) * 30);
        }
      },
    });
  };
})();
