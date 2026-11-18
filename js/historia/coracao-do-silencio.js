/**
 * ECOS DO ARCANO — coracao-do-silencio.js (modo História, chefe final)
 * Antes da batalha final, o Silenciador te puxa para o Coração do Silêncio:
 * uma luta em tempo real, em três atos, que cobra tudo o que você aprendeu.
 *  Ato 1 · Os Seis Ecos: ele usa contra você os desafios dos seis covis
 *    (jatos de fogo, tentáculos, olhar do basilisco, raízes, vento e névoa),
 *    um de cada vez, sempre com aviso antes. Desperte as seis runas nos
 *    pilares: cada runa acesa cala um eco e racha o escudo dele.
 *  Ato 2 · A Torre Desaba: o chão desmorona e anéis de silêncio saem dele
 *    (passe pela fresta de luz do anel). Pegue as quatro vozes dos seus
 *    amigos que aparecem pela arena.
 *  Ato 3 · A batalha final: começa com o escudo quebrado (menos vida para
 *    ele) e cada voz recolhida aumenta o seu dano.
 * Dicas: a voz da Odelia explica cada ato; depois de 3 golpes levados, ela
 * dá uma dica extra. Cair até o fim do fôlego recomeça só o ato atual.
 * Modifica (envolve) funções de outros arquivos: startBattle, walkable,
 * targetAt, interactAt, update, crewDrawList, dmgMul.
 */

"use strict";

(() => {
  const ZID = "coracao-silencio";
  const AW = 22,
    AH = 13;
  const BOSS = { x: 11, y: 2 };
  const SPAWN = [11, 10];
  const PILLARS = [
    { p: [4, 3], r: "fogo", hz: "fire" },
    { p: [18, 3], r: "agua", hz: "tentacle" },
    { p: [2, 7], r: "terra", hz: "roots" },
    { p: [20, 7], r: "ar", hz: "wind" },
    { p: [6, 10], r: "luz", hz: "gaze" },
    { p: [16, 10], r: "sombra", hz: "fog" },
  ];
  const HZ_NAME = { fire: "Jatos de Fogo do Farol", tentacle: "Tentáculos do Leviatã", roots: "Raízes do Ent", wind: "Vento do Grifo", gaze: "Olhar do Basilisco", fog: "Névoa da Serpente" };
  const VOICES = ["Odelia", "Kael", "a turma de Cinzaluz", "Vesper, o irmão"];
  const T = TILE;
  const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const box = (x, y, c, pad = 0) => ((ctx.fillStyle = c), ctx.fillRect(x * T + pad, y * T + pad, T - pad * 2, T - pad * 2));
  const dot = (x, y, r, c) => ((ctx.fillStyle = c), ctx.beginPath(), ctx.arc(x * T + 16, y * T + 16, r, 0, Math.PI * 2), ctx.fill());
  const inA = (x, y) => x >= 1 && x <= AW - 2 && y >= 1 && y <= AH - 2;
  const bossTile = (x, y) => Math.abs(x - BOSS.x) <= 1 && y <= BOSS.y + 1 && y >= BOSS.y;

  ZONE_DEFS[ZID] = { nome: "Coração do Silêncio", theme: "torre", exits: {}, enemies: [] };
  {
    const m = makeGrid(AW, AH, (x, y) => (x === 0 || y === 0 || x === AW - 1 || y === AH - 1 ? "#" : "."));
    const z = finalize(ZID, ZONE_DEFS[ZID], m, AW, AH, {}, {}, null);
    z.town = { bld: [], doors: {}, stalls: {}, huts: [], arrive: SPAWN.slice(), horses: [], boats: [], yard: true };
    ZONES[ZID] = z;
  }

  let A = null; // estado da luta
  const say2 = (lines, cb) => say(lines.map((l) => (typeof l === "string" ? ["Odelia (eco)", l] : l)), cb);

  function enterHeart(back) {
    A = { act: 1, lit: [], hz: null, hzT: 0, hzIdx: 0, inv: 0, hits: 0, t: 0, back, fx: [], holes: new Map(), rings: [], orbs: 0, orb: null };
    player.zone = ZID;
    [player.x, player.y] = SPAWN;
    player.rx = player.x;
    player.ry = player.y;
    player.dir = "up";
    game.fade = 1;
    game.autoPath = null;
    enterZone(false);
    playSound(80, 1.2, "sawtooth", 0.05);
    playCine(chapterCard("O Coração do Silêncio", "Ato 1 · Os Seis Ecos", "Tudo o que você enfrentou, de uma vez."), 3, () =>
      say2([
        ["O Silenciador", "Você calou meus Guardiões, um por um. Agora vai ouvir os seis ao mesmo tempo."],
        "Ele vai usar contra você os desafios dos covis, um de cada vez. Todos avisam antes de atacar: olhe o chão!",
        "Os seis pilares em volta guardam as runas. Chegue perto de cada um e aperte E para despertar. Cada runa acesa cala um dos ecos.",
      ]),
    );
  }

  /* ===================== ATO 1: OS SEIS ECOS ===================== */
  const activeHz = () => PILLARS.filter((P, i) => !A.lit.includes(i)).map((P) => P.hz);
  function nextHazard() {
    const left = activeHz();
    if (!left.length) return (A.hz = null);
    const hz = left[A.hzIdx++ % left.length];
    A.hz = { k: hz, t: 0, dur: 7, data: setupHz(hz) };
    toast(`${HZ_NAME[hz]}!`, 1600);
  }
  function setupHz(k) {
    if (k === "fire") return { cols: [3, 5, 7, 9, 13, 15, 17, 19], P: 2.2 };
    if (k === "tentacle") return { hits: [], acc: 0 };
    if (k === "roots") return { sprouts: [], acc: 0 };
    if (k === "wind") return { d: Math.random() < 0.5 ? -1 : 1, acc: 0, flip: 2.2 };
    if (k === "gaze") return { gx: 2, dir: 1 };
    if (k === "fog") return { mud: [], acc: 0 };
  }
  function hit(msg) {
    if (A.inv > 0) return;
    A.inv = 1.3;
    A.hits++;
    const dmg = Math.max(1, Math.round(maxHp() * 0.07));
    game.shake = 0.3;
    playSound(110, 0.3, "sawtooth", 0.05);
    toast(`${msg} −${dmg} HP`, 1600);
    if (player.hp - dmg <= 1) {
      player.hp = Math.round(maxHp() * 0.6);
      toast("O silêncio quase te engoliu... Você levanta e o ato recomeça.", 2600);
      restartAct();
      return;
    }
    player.hp -= dmg;
    if (A.hits === 3) setTimeout(() => say2([A.act === 1 ? "Dica: desperte primeiro os pilares mais perto de você. Cada pilar aceso tira um eco da rodada, então fica mais fácil a cada um." : "Dica: o anel de silêncio tem uma fresta de luz. Fique onde a fresta vai passar. E fuja das pedras que racham (elas brilham antes de cair)."]), 400);
  }
  function restartAct() {
    if (A.act === 1) (A.hz = null), (A.hzT = 0);
    else (A.holes = new Map()), (A.rings = []);
    [player.x, player.y] = SPAWN;
    player.rx = player.x;
    player.ry = player.y;
  }
  function tickHazard(dt) {
    const H = A.hz;
    if (!H) {
      A.hzT += dt;
      if (A.hzT > 1.2) (A.hzT = 0), nextHazard();
      return;
    }
    H.t += dt;
    const D = H.data;
    const px = player.x,
      py = player.y;
    if (H.k === "fire") {
      D.cols.forEach((x, i) => {
        const ph = ((H.t / D.P + i * 0.12) % 1) * D.P;
        D[x] = ph < 0.8 ? "on" : ph > D.P - 0.5 ? "warn" : "";
        if (D[x] === "on" && px === x) hit("Queimou nos jatos de fogo!");
      });
    }
    if (H.k === "tentacle") {
      D.acc += dt;
      if (D.acc > 0.8) (D.acc = 0), D.hits.push({ x: rnd(1, AW - 3), t: 0 });
      for (const h of D.hits) {
        h.t += dt;
        if (h.t >= 0.9 && !h.done) (h.done = true), playSound(80, 0.2, "sawtooth"), px >= h.x && px < h.x + 2 && hit("Um tentáculo te acertou!");
      }
      D.hits = D.hits.filter((h) => h.t < 1.3);
    }
    if (H.k === "roots") {
      D.acc += dt;
      if (D.acc > 0.45) (D.acc = 0), D.sprouts.push({ x: rnd(1, AW - 2), y: rnd(3, AH - 2), t: 0 });
      for (const s of D.sprouts) {
        s.t += dt;
        if (s.t >= 0.9 && s.t < 1.6 && s.x === px && s.y === py) hit("Uma raiz brotou embaixo de você!");
      }
      D.sprouts = D.sprouts.filter((s) => s.t < 1.6);
    }
    if (H.k === "wind") {
      D.acc += dt;
      D.flip -= dt;
      if (D.flip <= 0) (D.flip = 2.2), (D.d *= -1), toast(D.d > 0 ? "O vento vira para a direita!" : "O vento vira para a esquerda!", 1000);
      if (D.acc > 0.35) {
        D.acc = 0;
        const nx = px + D.d;
        if (!inA(nx, py)) hit("O vento te jogou contra a parede!");
        else if (!blocked(nx, py)) (player.x = nx), (player.rx = nx);
      }
    }
    if (H.k === "gaze") {
      D.gx += D.dir * 5 * dt;
      if (D.gx > AW - 2.4) D.dir = -1;
      if (D.gx < 1.4) D.dir = 1;
      const col = Math.round(D.gx);
      const cover = PILLARS.some((P) => P.p[0] === px && P.p[1] < py);
      if (px === col && !cover) hit("O olhar do Basilisco te pegou!");
    }
    if (H.k === "fog") {
      D.acc += dt;
      if (D.acc > 0.5) (D.acc = 0), D.mud.push({ x: rnd(1, AW - 2), y: rnd(3, AH - 2), t: 0 });
      for (const s of D.mud) {
        s.t += dt;
        if (s.t >= 1 && s.t < 2.4 && s.x === px && s.y === py) hit("Afundou na lama da névoa!");
      }
      D.mud = D.mud.filter((s) => s.t < 2.4);
    }
    if (H.t >= H.dur) (A.hz = null), (A.hzT = 0);
  }
  const blocked = (x, y) => bossTile(x, y) || PILLARS.some((P) => P.p[0] === x && P.p[1] === y);

  /* ===================== ATO 2: A TORRE DESABA ===================== */
  function startAct2() {
    A.act = 2;
    A.hz = null;
    A.hits = 0;
    A.holes = new Map();
    A.rings = [];
    A.ringT = 2;
    A.crackT = 0;
    A.orbs = 0;
    A.orb = null;
    playCine(chapterCard("O Coração do Silêncio", "Ato 2 · A Torre Desaba", "O chão some. As vozes ficam."), 3, () =>
      say2([
        ["O Silenciador", "Chega de brincadeira. Se não posso te calar, derrubo a Torre com você dentro."],
        "O chão vai rachar: a pedra brilha antes de cair. Saia dela!",
        "Ele vai soltar anéis de silêncio. Cada anel tem uma fresta de luz: passe por ela.",
        "Junte as quatro vozes que aparecerem pela sala. São as pessoas que acreditam em você.",
      ]),
    );
  }
  function freeTile() {
    for (let k = 0; k < 80; k++) {
      const x = rnd(1, AW - 2),
        y = rnd(3, AH - 2);
      if (!blocked(x, y) && !A.holes.has(x + "," + y) && Math.abs(x - player.x) + Math.abs(y - player.y) > 3) return [x, y];
    }
    return [rnd(2, AW - 3), AH - 2];
  }
  function tickAct2(dt) {
    // chão rachando
    A.crackT += dt;
    if (A.crackT > 0.55) {
      A.crackT = 0;
      const [x, y] = freeTile();
      if (A.holes.size < 70) A.holes.set(x + "," + y, { t: 0 });
    }
    for (const [k, h] of A.holes) {
      h.t += dt;
      if (h.t > 8) A.holes.delete(k);
    }
    const here = A.holes.get(player.x + "," + player.y);
    if (here && here.t >= 1 && here.t < 8) {
      hit("O chão desabou embaixo de você!");
      const [x, y] = freeTile();
      player.x = x;
      player.y = y;
    }
    // anéis
    A.ringT -= dt;
    if (A.ringT <= 0) {
      A.ringT = 2.6;
      A.rings.push({ r: 0.5, gap: Math.random() * Math.PI * 2 });
      playSound(60, 0.4, "sine", 0.04);
    }
    const dx = player.x - BOSS.x,
      dy = player.y - BOSS.y;
    const pd = Math.hypot(dx, dy),
      pa = Math.atan2(dy, dx);
    for (const R of A.rings) {
      const r0 = R.r;
      R.r += dt * 3.2;
      if (r0 < pd && R.r >= pd) {
        let d = Math.abs(((pa - R.gap + Math.PI * 3) % (Math.PI * 2)) - Math.PI);
        if (d > 0.5) hit("O anel de silêncio te atravessou!");
      }
    }
    A.rings = A.rings.filter((R) => R.r < 26);
    // vozes
    if (!A.orb) A.orb = freeTile();
    if (A.orb && player.x === A.orb[0] && player.y === A.orb[1]) {
      const v = VOICES[A.orbs];
      A.orbs++;
      A.orb = null;
      [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => playSound(f, 0.15, "triangle"), i * 80));
      toast(`A voz de ${v} volta para você! (${A.orbs}/4)`, 2200);
      if (A.orbs >= 4) finishHeart();
    }
  }
  function finishHeart() {
    player.flags.coracaoDone = true;
    player.flags.coracaoVoices = 4;
    saveGame();
    A.act = 3;
    say2(
      [
        ["O Silenciador", "NÃO! Essas vozes... eu calei todas elas há trezentos anos!"],
        "O escudo dele quebrou! Agora é com você. As vozes estão do seu lado: cada uma deixa a sua magia mais forte.",
      ],
      () => {
        const b = A.back;
        A = null;
        player.zone = b.zone;
        player.x = b.x;
        player.y = b.y;
        player.rx = b.x;
        player.ry = b.y;
        game.fade = 1;
        enterZone(false);
        game.heartPass = true;
        startBattle("silenciador", null);
      },
    );
  }

  /* ===================== LIGAÇÕES ===================== */
  const sbBase = startBattle;
  startBattle = function (type) {
    if (type === "silenciador" && story() && !player.flags.coracaoDone && !game.heartPass && player.zone === "torre") {
      enterHeart({ zone: player.zone, x: player.x, y: player.y });
      return;
    }
    const r = sbBase.apply(this, arguments);
    if (type === "silenciador" && battle && battle.e && player.flags.coracaoDone && !battle.heartDone) {
      battle.heartDone = true;
      battle.e.hp = Math.round(battle.e.hp * 0.85);
      toast("O escudo do Silenciador está quebrado: ele começa com menos vida.", 2600);
    }
    game.heartPass = false;
    return r;
  };
  const dmBase = dmgMul;
  dmgMul = function () {
    const m = dmBase.apply(this, arguments);
    return battle && battle.type === "silenciador" && player.flags.coracaoDone ? m * (1 + 0.05 * (player.flags.coracaoVoices || 0)) : m;
  };
  const wkBase = walkable;
  walkable = function (z, x, y) {
    if (z === ZID && blocked(x, y)) return false;
    return wkBase(z, x, y);
  };
  const tgBase = targetAt;
  targetAt = function (x, y) {
    if (player.zone === ZID && A && A.act === 1) {
      const i = PILLARS.findIndex((P) => P.p[0] === x && P.p[1] === y);
      if (i >= 0) return A.lit.includes(i) ? `Runa ${RUNES[PILLARS[i].r].nome} acesa` : `Despertar a runa ${RUNES[PILLARS[i].r].nome}`;
    }
    if (player.zone === ZID && bossTile(x, y)) return "O Silenciador";
    return tgBase(x, y);
  };
  const iaBase = interactAt;
  interactAt = function (x, y) {
    if (player.zone === ZID && A) {
      const i = PILLARS.findIndex((P) => P.p[0] === x && P.p[1] === y);
      if (A.act === 1 && i >= 0 && !A.lit.includes(i)) {
        A.lit.push(i);
        if (A.hz && A.hz.k === PILLARS[i].hz) A.hz = null;
        game.shake = 0.3;
        [392, 523, 659].forEach((f, k) => setTimeout(() => playSound(f, 0.2, "triangle"), k * 100));
        toast(`A runa ${RUNES[PILLARS[i].r].nome} desperta! ${HZ_NAME[PILLARS[i].hz]} se calam. (${A.lit.length}/6)`, 2600);
        if (A.lit.length >= 6) setTimeout(startAct2, 800);
        return;
      }
      if (bossTile(x, y)) return say([["O Silenciador", pick(["Shhh.", "Você ainda está falando?", "Silêncio é paz. Por que você não entende?"])]]);
      return;
    }
    return iaBase(x, y);
  };
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const upBase = update;
  update = function (dt) {
    upBase(dt);
    if (!A || player.zone !== ZID || game.mode !== "world" || game.dialog) return;
    dt = Math.min(dt, 0.05);
    A.t += dt;
    if (A.inv > 0) A.inv -= dt;
    try {
      if (A.act === 1) tickHazard(dt);
      else if (A.act === 2) tickAct2(dt);
    } catch (e) {
      console.error(e);
    }
  };

  /* ===================== DESENHO ===================== */
  function drawHeart(t) {
    // chão de ruína e runas
    for (let x = 1; x < AW - 1; x++)
      for (let y = 1; y < AH - 1; y++) {
        box(x, y, (x + y) % 2 ? "#1a1428" : "#1e1830");
        if ((x * 7 + y * 13) % 11 === 0) ((ctx.fillStyle = "rgba(180,140,255,.08)"), ctx.fillRect(x * T + 6, y * T + 6, 20, 2));
      }
    if (A && A.act === 1 && A.hz) {
      const H = A.hz,
        D = H.data;
      if (H.k === "fire")
        for (const x of D.cols)
          for (let y = 1; y < AH - 1; y++) {
            if (D[x] === "on") (box(x, y, "#ff8a2a", 2), box(x, y, "#ffe08a", 10));
            else if (D[x] === "warn" && Math.sin(t * 25) > 0) box(x, y, "rgba(255,120,40,.4)", 6);
          }
      if (H.k === "tentacle")
        for (const h of D.hits) for (let x = h.x; x < h.x + 2; x++) for (let y = 1; y < AH - 1; y++) h.t < 0.9 ? box(x, y, `rgba(0,0,0,${0.2 + h.t * 0.5})`) : (box(x, y, "#5a3a6a", 2), box(x, y, "#8a5a9a", 10));
      if (H.k === "roots") for (const s of D.sprouts) s.t < 0.9 ? Math.sin(t * 20) > 0 && box(s.x, s.y, "rgba(140,90,40,.5)", 6) : (box(s.x, s.y, "#4a2e17", 1), box(s.x, s.y, "#6b4423", 6));
      if (H.k === "wind") {
        ctx.fillStyle = "rgba(220,240,255,.35)";
        for (let k = 0; k < 30; k++) {
          const x = ((t * 300 * D.d + k * 97) % (AW * T) + AW * T) % (AW * T),
            y = ((k * 53) % (AH - 2)) * T + T + 12;
          ctx.fillRect(x, y, 18, 2);
        }
      }
      if (H.k === "gaze") {
        const col = Math.round(D.gx);
        for (let y = 1; y < AH - 1; y++) {
          const cover = PILLARS.some((P) => P.p[0] === col && P.p[1] < y);
          if (!cover) box(col, y, "rgba(120,255,120,.3)");
        }
      }
      if (H.k === "fog") for (const s of D.mud) s.t < 1 ? Math.sin(t * 20) > 0 && box(s.x, s.y, "rgba(80,100,60,.5)", 6) : box(s.x, s.y, "#3a4a22", 2);
    }
    if (A && A.act === 2) {
      for (const [k, h] of A.holes) {
        const [x, y] = k.split(",").map(Number);
        if (h.t < 1) Math.sin(t * 22) > 0 && box(x, y, "rgba(255,224,138,.35)", 3);
        else box(x, y, "#05030a");
      }
      for (const R of A.rings) {
        ctx.strokeStyle = "rgba(180,140,255,.7)";
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.arc(BOSS.x * T + 16, BOSS.y * T + 16, R.r * T, R.gap + 0.5, R.gap + Math.PI * 2 - 0.5);
        ctx.stroke();
        ctx.strokeStyle = "rgba(255,240,180,.8)";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(BOSS.x * T + 16, BOSS.y * T + 16, R.r * T, R.gap - 0.5, R.gap + 0.5);
        ctx.stroke();
      }
      if (A.orb) {
        dot(A.orb[0], A.orb[1], 9 + Math.sin(t * 6) * 2, "rgba(255,240,180,.85)");
        dot(A.orb[0], A.orb[1], 4, "#fff");
      }
    }
    // pilares das runas
    PILLARS.forEach((P, i) => {
      const lit = A && A.lit.includes(i);
      box(P.p[0], P.p[1], "#4a4058", 2);
      box(P.p[0], P.p[1], lit ? RUNES[P.r].cor || "#ffe08a" : "#2a2438", 8);
      if (lit) dot(P.p[0], P.p[1] - 0.6, 5 + Math.sin(t * 5 + i) * 2, RUNES[P.r].cor || "#ffe08a");
    });
    // o Silenciador
    const sh = A ? 1 - (A.act === 1 ? A.lit.length / 6 : 1) : 0;
    if (sh > 0) dot(BOSS.x, BOSS.y + 0.4, 40 + Math.sin(t * 2) * 3, `rgba(120,90,200,${0.15 + sh * 0.2})`);
    try {
      drawEnemy("silenciador", (BOSS.x - 1) * T, (BOSS.y - 1) * T + Math.sin(t * 1.5) * 4, 4, t);
    } catch (e) {}
    if (A && A.act === 1 && A.hz && A.hz.k === "fog") {
      ctx.save();
      ctx.fillStyle = "rgba(10,14,8,.75)";
      ctx.beginPath();
      ctx.rect(0, 0, AW * T, AH * T);
      ctx.arc(player.rx * T + 16, player.ry * T + 16, T * 3, 0, Math.PI * 2, true);
      ctx.fill("evenodd");
      ctx.restore();
    }
    if (A && A.inv > 0 && Math.sin(t * 30) > 0) ((ctx.fillStyle = "rgba(255,80,80,.25)"), ctx.fillRect(player.rx * T, player.ry * T, T, T));
  }
  const cdBase = crewDrawList;
  crewDrawList = function (list, t) {
    cdBase(list, t);
    if (player.zone === ZID) list.push({ y: -6, draw: () => drawHeart(t) });
  };
  // Se o jogo for salvo dentro do Coração, volta para a Torre.
  const ezBase = enterZone;
  enterZone = function () {
    if (player.zone === ZID && !A) {
      player.zone = "torre";
      const z = ZONES.torre;
      const s = (z && z.spawn && z.spawn[0]) || [5, 5];
      [player.x, player.y] = s;
    }
    return ezBase.apply(this, arguments);
  };
  window.enterHeart = enterHeart;
  window.heartDebug = { get: () => A, act2: () => startAct2() };
})();
