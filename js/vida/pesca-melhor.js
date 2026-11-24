/**
 * ECOS DO ARCANO — pesca-melhor.js
 * Pescar ficou um jogo de verdade:
 *  - quando o peixe morde e você puxa (E), começa a BRIGA COM O PEIXE: uma
 *    barra aparece do lado; o peixe sobe e desce e você mantém a faixa verde
 *    em cima dele tocando E (ou o botão de ação) — cada toque sobe a faixa, e
 *    ela cai sozinha. Peixe dentro da faixa enche a linha; fora, ela afrouxa.
 *  - ESPÉCIES de verdade, com TAMANHO em cm: lambari, tilápia, carpa, truta,
 *    bagre, enguia e o raro dourado no rio e no lago; sardinha, robalo, pargo,
 *    atum, peixe-espada e ostras no mar. Uns só aparecem de noite.
 *  - Na ponta do PÍER (água funda) os peixes grandes e raros aparecem mais.
 *  - CADERNO DE PESCA: cada espécie e o seu maior peixe. Bater recorde avisa.
 * Modifica (envolve) fishAction, updateFishing e drawFishing.
 */

"use strict";

(() => {
  // [nome, item, cm mín, cm máx, peso, dificuldade, só de noite]
  const DOCE = [
    ["Lambari", "peixe", 8, 16, 30, 0.6],
    ["Tilápia", "peixe", 15, 38, 24, 0.8],
    ["Carpa", "carpa", 30, 75, 16, 1.1],
    ["Truta-arco-íris", "peixeR", 25, 55, 8, 1.4],
    ["Bagre", "carpa", 30, 95, 9, 1.3, 1],
    ["Enguia", "carpa", 40, 110, 5, 1.6, 1],
    ["Dourado do rio", "peixeR", 45, 95, 3, 2.0],
    ["Bota velha", "bota", 0, 0, 7, 0],
  ];
  const MAR = [
    ["Sardinha", "peixe", 10, 22, 30, 0.6],
    ["Robalo", "peixe", 30, 75, 20, 1.0],
    ["Pargo", "carpa", 25, 65, 14, 1.1],
    ["Lula", "carpa", 20, 60, 8, 1.2, 1],
    ["Atum", "peixeR", 60, 160, 5, 2.0],
    ["Peixe-espada", "peixeR", 60, 130, 3, 2.1, 1],
    ["Ostra com pérola", "perolaN", 0, 0, 6, 0.5],
    ["Bota velha", "bota", 0, 0, 5, 0],
  ];
  const ALL = new Set([...DOCE, ...MAR].filter((s) => s[1] !== "bota").map((s) => s[0]));
  const log = () => (player.fishLog = player.fishLog || {});
  const isLake = (z, x, y) => ((window.LAKES || {})[z] || []).some((R) => x >= R.x0 - 1 && x <= R.x1 + 1 && y >= R.y0 - 1 && y <= R.y1 + 1);
  const night = () => {
    const h = player.clock / 60;
    return h >= 19 || h < 5;
  };
  function pickSpecies(f) {
    const z = player.zone;
    const sea = ZONES[z] && ZONES[z].theme === "porto" && !isLake(z, f.x, f.y);
    const T = sea ? MAR : DOCE;
    // na ponta do píer (ou bem longe da margem) a água é funda: mais peixe grande
    const deep = tileAt(z, player.x, player.y) === "=" || [[2, 0], [-2, 0], [0, 2], [0, -2]].every(([dx, dy]) => tileAt(z, f.x + dx, f.y + dy) === "~");
    const w = T.map((s) => {
      let v = s[4];
      if (s[6]) v *= night() ? 2.5 : 0.15;
      if (deep && s[5] >= 1.4) v *= 2.2;
      if (deep && s[1] === "bota") v *= 0.4;
      return v;
    });
    let r = Math.random() * w.reduce((a, b) => a + b, 0);
    for (let i = 0; i < T.length; i++) if ((r -= w[i]) < 0) return T[i];
    return T[0];
  }

  /* ----- a briga com o peixe ----- */
  const fa = fishAction;
  fishAction = function () {
    const R = game.reel;
    if (R) {
      // cada toque sobe a faixa
      R.v = Math.min(1.6, R.v + 0.95);
      playSound(620 + R.p * 300, 0.03, "triangle", 0.02);
      return;
    }
    const f = game.fish;
    if (f && f.phase === "bite") {
      const sp = pickSpecies(f);
      if (sp[1] === "bota" || sp[5] < 0.55) {
        // bota e ostra vêm fácil
        game.fish = null;
        return land(sp, f);
      }
      game.fish = null;
      game.reel = { sp, f, x: f.x, y: f.y, fish: 0.5, tgt: 0.5, tT: 0, z: 0.35, v: 0, p: 0.3, size: 0.3 - Math.min(0.12, (sp[5] - 1) * 0.08) + (player.diff === "facil" ? 0.06 : 0) };
      toast(`Fisgou! Toque E para manter a faixa verde em cima do peixe!`, 2600);
      playSound(900, 0.1, "square", 0.03);
      return;
    }
    return fa.apply(this, arguments);
  };
  function land(sp, f) {
    const [nome, item, a, b] = sp;
    if (ITEMS[item]) addItem(item);
    if (typeof jobOnFish === "function") jobOnFish(item);
    if (item !== "bota") player.fishCaught = (player.fishCaught || 0) + 1;
    let msg;
    if (item === "bota") msg = "Você pescou... uma bota velha.";
    else if (!b) msg = `Você pescou: ${nome}!`;
    else {
      const cm = Math.round(a + (b - a) * Math.pow(Math.random(), 1.6));
      const L = log(),
        e = (L[nome] = L[nome] || { n: 0, best: 0 });
      const novo = !e.n,
        rec = cm > e.best && e.n > 0;
      e.n++;
      e.best = Math.max(e.best, cm);
      const got = Object.keys(L).filter((k) => ALL.has(k)).length;
      msg = `Você pescou: ${nome}, ${cm} cm!${novo ? ` Espécie nova no caderno (${got}/${ALL.size})!` : rec ? " NOVO RECORDE!" : ""}`;
    }
    if (nome === "Ostra com pérola") {
      const L = log();
      L[nome] = L[nome] || { n: 0, best: 0 };
      L[nome].n++;
    }
    saveGame();
    game.bubbles && game.bubbles.push({ x: player.x, y: player.y, icon: item === "bota" ? "meh" : sp[5] >= 1.4 ? "sparkle" : "fish", t: 2.4 });
    playSound(item === "bota" ? 180 : 880, 0.15, "sine");
    toast(msg, 3400);
  }
  const uf = updateFishing;
  updateFishing = function (dt) {
    uf.apply(this, arguments);
    const R = game.reel;
    if (!R) return;
    if (game.mode !== "world") return;
    game.moveCd = Math.max(game.moveCd || 0, 0.15);
    const d = R.sp[5];
    // o peixe muda de ideia de vez em quando e nada para lá
    R.tT -= dt;
    if (R.tT <= 0) ((R.tgt = Math.random()), (R.tT = 0.4 + Math.random() * (1.4 - Math.min(1, d * 0.35))));
    R.fish += (R.tgt - R.fish) * Math.min(1, dt * (1.2 + d * 1.3));
    // a faixa cai sozinha e sobe com os toques
    R.v -= 2.4 * dt;
    R.z = Math.max(0, Math.min(1 - R.size, R.z + R.v * dt));
    if (R.z <= 0 && R.v < 0) R.v = 0;
    if (R.z >= 1 - R.size && R.v > 0) R.v = 0;
    const inside = R.fish >= R.z && R.fish <= R.z + R.size;
    R.p += (inside ? 0.32 : -0.22 * Math.sqrt(d)) * dt;
    if (R.p >= 1) {
      game.reel = null;
      land(R.sp, R.f);
    } else if (R.p <= 0) {
      game.reel = null;
      toast(`${R.sp[0]} arrebentou a linha e fugiu!`, 2600);
      playSound(200, 0.12, "square");
    }
  };
  const df = drawFishing;
  drawFishing = function (t) {
    df.apply(this, arguments);
    const R = game.reel;
    if (!R) return;
    // a linha esticada até a água agitada
    const px = player.rx * TILE + 16,
      py = player.ry * TILE + 4;
    const bx = R.x * TILE + 16 + Math.sin(t * 20) * 3,
      by = R.y * TILE + 16;
    ctx.strokeStyle = "rgba(240,240,240,.9)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(bx, by);
    ctx.stroke();
    ctx.strokeStyle = "rgba(255,255,255,.7)";
    ctx.beginPath();
    ctx.arc(bx, by, 4 + ((t * 30) % 10), 0, 7);
    ctx.stroke();
    // a barra da briga, do lado do personagem
    const X = player.rx * TILE + 44,
      Y = player.ry * TILE - 70,
      H = 96;
    ctx.fillStyle = "rgba(20,14,10,.85)";
    ctx.fillRect(X - 4, Y - 4, 30, H + 8);
    ctx.fillStyle = "#3f86c7";
    ctx.fillRect(X, Y, 14, H);
    ctx.fillStyle = "rgba(90,210,110,.85)";
    ctx.fillRect(X, Y + H * (1 - R.z - R.size), 14, H * R.size);
    // o peixe
    const fy = Y + H * (1 - R.fish);
    ctx.fillStyle = R.sp[5] >= 1.4 ? "#f2c14e" : "#e8e0d0";
    ctx.beginPath();
    ctx.ellipse(X + 7, fy, 6, 3, 0, 0, 7);
    ctx.fill();
    ctx.fillRect(X + 12, fy - 2, 3, 4);
    // a linha enchendo
    ctx.fillStyle = "#3a2a20";
    ctx.fillRect(X + 17, Y, 6, H);
    ctx.fillStyle = R.p > 0.66 ? "#5ad06a" : R.p > 0.33 ? "#e8c040" : "#d9533a";
    ctx.fillRect(X + 17, Y + H * (1 - R.p), 6, H * R.p);
  };
  window.fishBook = () => {
    const L = log();
    const rows = [...ALL].map((n) => (L[n] ? `✓ ${n}${L[n].best ? ` · recorde ${L[n].best} cm` : ""} (${L[n].n}x)` : `? ${n}`));
    say([["Caderno de pesca", rows.slice(0, 7).join(" · ")], ["Caderno de pesca", rows.slice(7).join(" · ") + ` — ${Object.keys(L).filter((k) => ALL.has(k)).length}/${ALL.size} espécies.`]]);
  };
  if (typeof ACHIEVEMENTS !== "undefined") ACHIEVEMENTS.push(["pescador", "Pescador de verdade", "Pesque 8 espécies diferentes (caderno de pesca).", "fish", () => Object.keys(player.fishLog || {}).filter((k) => ALL.has(k)).length >= 8]);
})();
