/**
 * ECOS DO ARCANO — dom-extras.js (modo História, jogo com dom)
 *  1. Diário do Fragmento na Jornada (J).
 *  2. O berço do sonho aparece em Cinzaluz depois da 2ª revelação.
 *  3. Odelia reage a cada revelação.
 *  4. Novo Jogo+ escolhe um novo elemento, e os dois ecos conversam.
 *  5. Árvore do Dom: um ponto por nível (Força, Fluxo e Eco).
 *  6. Feitiço de fusão com cena própria na luta.
 *  7. Covis revisitáveis depois de zerar: desafio contra o relógio.
 *  8. Bestiário dos Guardiões na Jornada.
 *  9. Botão "ir ao objetivo".
 * 12. Som próprio para cada elemento.
 * Modifica (envolve) funções de outros arquivos: applySpellDamage, crewDrawList,
 * gainXP, INTRO, interactAt, journeyHTML, lairSolved, openJourney, pickElement,
 * playerCast, spellCost, dmgMul, storyBuilding, targetAt, update.
 */

"use strict";

/* ===================== 5. ÁRVORE DO DOM ===================== */
const DOM_TREE = {
  forca: { n: "Força", d: (d) => `+8% de dano nos feitiços ${d.de} por nível.` },
  fluxo: { n: "Fluxo", d: (d) => `Feitiços ${d.de} custam 15% menos mana por nível.` },
  eco: { n: "Eco", d: () => "10% de chance por nível de o golpe ecoar e acertar de novo (metade do dano)." },
};
const treeOf = () => (player.domTree = player.domTree || { forca: 0, fluxo: 0, eco: 0 });
const treeSpent = () => Object.values(treeOf()).reduce((a, b) => a + b, 0);
const treePoints = () => Math.max(0, Math.min(9, player.lvl - 1) - treeSpent());
function openDomTree() {
  if (!fragOn()) return;
  const d = fragDom(),
    T = treeOf(),
    pts = treePoints();
  choice(
    `Árvore do Dom: ${d.nome}`,
    `Você ganha 1 ponto a cada nível. Pontos livres: <b>${pts}</b>. Cada ramo vai até o nível 3.`,
    [
      ...Object.entries(DOM_TREE).map(([k, B]) => ({
        t: `${B.n} ${"●".repeat(T[k])}${"○".repeat(3 - T[k])} · ${B.d(d)}`,
        icon: k === "forca" ? "sword" : k === "fluxo" ? "sparkle" : "note",
        fn: () => {
          if (T[k] >= 3) toast("Esse ramo já está no máximo.", 1800);
          else if (!treePoints()) toast("Sem pontos livres. Suba de nível para ganhar mais.", 2200);
          else {
            T[k]++;
            saveGame();
            playSound(659, 0.15, "triangle", 0.05);
            toast(`${B.n} subiu para o nível ${T[k]}!`, 1800);
          }
          setTimeout(openDomTree, 60);
        },
      })),
      { t: "Fechar", icon: "heart", fn: () => {} },
    ],
  );
}

/* ===================== 12. SOM DE CADA ELEMENTO ===================== */
const DOM_SOUND = {
  lava: () => [90, 70].forEach((f, i) => setTimeout(() => playSound(f, 0.25, "sawtooth", 0.05), i * 90)),
  gelo: () => [1568, 1976, 2349].forEach((f, i) => setTimeout(() => playSound(f, 0.12, "sine", 0.03), i * 60)),
  raio: () => [880, 220, 1760].forEach((f, i) => setTimeout(() => playSound(f, 0.06, "square", 0.04), i * 35)),
  metal: () => [330, 165].forEach((f, i) => setTimeout(() => playSound(f, 0.3, "triangle", 0.06), i * 50)),
  cristal: () => [1047, 1319, 1568, 2093].forEach((f, i) => setTimeout(() => playSound(f, 0.14, "sine", 0.03), i * 70)),
  veneno: () => [196, 185, 175].forEach((f, i) => setTimeout(() => playSound(f, 0.18, "sawtooth", 0.03), i * 110)),
};

/* ===================== 6. A FUSÃO ===================== */
function fusionKey() {
  return fragOn() ? spellKey([player.dom, fragDom().rune]) : null;
}
function fusionScene() {
  const d = fragDom(),
    R = RUNES[d.rune],
    ec = enemyCenter(),
    pc = playerCenter();
  game.flash = 1;
  if (!settings.calm) game.shake = 0.6;
  for (let i = 0; i < 5; i++)
    setTimeout(() => {
      burst(ec.x, ec.y, [d.cor, R.cor, "#fff"], 40, 260);
      burst(pc.x, pc.y, [d.cor, R.cor], 16, 120);
    }, i * 120);
  [262, 392, 523, 659, 784, 1047].forEach((f, i) => setTimeout(() => playSound(f, 0.3, i % 2 ? "triangle" : "sine", 0.05), i * 80));
  battleLog(`✦ FUSÃO! ${cap(RUNE_WITH_ARTICLE[d.rune])} e ${d.art} viram uma só: ${DOM_FUSION[player.dom].nome}!`);
}

/* ===================== 2. O BERÇO ===================== */
ITEMS.chocalho = {
  nome: "Chocalho de Vesper",
  tipo: "equip",
  slot: "amuleto",
  preco: 0,
  hp: 20,
  mp: 25,
  regen: 1,
  desc: "Achado no berço do sonho. +20 HP, +25 MP e 1 HP por turno. Ainda toca uma nota quando você o balança.",
};
let cradleCache = null;
const cradleSpot = () => cradleCache || (cradleCache = spotOf("vila", "berco-fragmento"));
const cradleOn = () => fragOn() && player.flags.frag2 && player.zone === "vila";
function drawCradle(t) {
  const [x, y] = cradleSpot(),
    X = x * TILE,
    Y = y * TILE,
    seen = player.flags.berco;
  if (!seen) {
    ctx.fillStyle = `rgba(255,240,180,${0.18 + 0.12 * Math.sin(t * 3)})`;
    ctx.beginPath();
    ctx.arc(X + 16, Y + 18, 24, 0, 7);
    ctx.fill();
  }
  ctx.fillStyle = "#6a4a2a";
  ctx.fillRect(X + 4, Y + 14, 24, 12);
  ctx.fillStyle = "#8a6238";
  ctx.fillRect(X + 4, Y + 12, 24, 3);
  ctx.fillStyle = "#4a3018";
  ctx.fillRect(X + 6, Y + 26, 3, 4);
  ctx.fillRect(X + 23, Y + 26, 3, 4);
  ctx.fillStyle = "#e8dcc0";
  ctx.fillRect(X + 8, Y + 16, 16, 6);
  if (!seen) {
    ctx.fillStyle = fragDom().cor;
    ctx.fillRect(X + 15, Y + 6 + Math.sin(t * 4) * 2, 3, 3);
  }
}

/* ===================== 7. COVIS CONTRA O RELÓGIO ===================== */
function startLairTrial(L) {
  const S = lairState(L);
  S.ok = false;
  S.seq = null;
  S.pos = 0;
  S.blocks = null;
  game.lamps = {};
  game.lairTrial = { region: L.region, t0: game.t };
  toast("Desafio do covil: o relógio começou!", 2200);
  enterLair(L);
}
function finishLairTrial(L) {
  const T = game.lairTrial;
  game.lairTrial = null;
  const secs = Math.max(1, Math.round(game.t - T.t0));
  player.lairRecords = player.lairRecords || {};
  const best = player.lairRecords[L.region];
  const novo = !best || secs < best;
  if (novo) player.lairRecords[L.region] = secs;
  saveGame();
  [523, 659, 784].forEach((f, i) => setTimeout(() => playSound(f, 0.2, "triangle", 0.05), i * 120));
  say([["", `${L.n}: ${secs} segundos. ${novo ? "NOVO RECORDE!" : `Seu recorde continua ${best} segundos.`}`]]);
}

/* ===================== 9. IR AO OBJETIVO ===================== */
function goToObjective() {
  if (!story() || game.mode !== "world" || game.dialog) return;
  const s = curStep();
  if (!s) return;
  if (s.zone !== player.zone) return toast(`${s.t}: fica em ${(ZONES[s.zone] || {}).nome || "outra região"}. Siga a seta dourada até a saída.`, 3600);
  const [x, y] = s.pos();
  toast(`Indo até: ${s.t}`, 2000);
  tapWalkTo(x, y);
}
(() => {
  if (byId("goalb")) return;
  const b = document.createElement("button");
  b.id = "goalb";
  b.className = "ui";
  b.title = "Ir até o objetivo atual";
  b.textContent = "◎";
  b.onclick = (e) => (e.stopPropagation(), goToObjective());
  const ref = byId("optb");
  if (ref && ref.parentNode) ref.parentNode.insertBefore(b, ref.nextSibling);
  const st = document.createElement("style");
  st.textContent = `#goalb{position:absolute;left:1%;top:27%;z-index:6;font-size:.8em;padding:.1em .45em;opacity:.7}
  body.tallui #goalb,body.ontitle #goalb,body.life #goalb{display:none!important}`;
  document.head.appendChild(st);
  const tick = () => {
    b.style.display = story() && player && player.name && game.mode === "world" ? "" : "none";
    requestAnimationFrame(tick);
  };
  tick();
})();

/* ===================== LIGAÇÕES ===================== */
(() => {
  // 3. Odelia reage às revelações (vem antes da conversa normal).
  const odTalk = NPCS.odelia.talk;
  const OD_FRAG = [
    ["frag1", "odF1", ["Vesper... quebrou uma runa? Ele nunca faria isso. A não ser que... a não ser que fosse para salvá-la.", "Ele sempre foi assim. Estragava uma coisa pequena para proteger uma grande."]],
    ["frag2", "odF2", ["Um berço em Cinzaluz. Trezentos anos e eu nunca procurei no lugar mais óbvio.", "Ele escondia as coisas importantes nas mãos das crianças. Dizia que ninguém desconfia de quem ainda não sabe falar."]],
    ["frag3", "odF3", ["Então ainda existe um pedaço bom dele. E está em você.", "Aprendiz... obrigada por carregar o meu irmão até aqui. Agora leve ele para casa."]],
  ];
  NPCS.odelia.talk = function () {
    if (fragOn()) {
      const F = player.flags;
      const hit = OD_FRAG.find(([need, done]) => F[need] && !F[done]);
      if (hit) {
        F[hit[1]] = true;
        saveGame();
        return hit[2].map((t) => ["Arquimaga Odelia", t]);
      }
    }
    return odTalk.apply(this, arguments);
  };

  // 2. o berço
  const tgBase = targetAt;
  targetAt = function (x, y) {
    if (cradleOn() && near(cradleSpot(), x, y)) return player.flags.berco ? "O berço do sonho" : "Olhar o berço do sonho";
    if (story() && player.finished && LAIRS[player.zone] && near(ZONES[player.zone].guardPos, x, y)) return "Desafio do covil (contra o relógio)";
    return tgBase(x, y);
  };
  const iaBase = interactAt;
  interactAt = function (x, y) {
    if (cradleOn() && near(cradleSpot(), x, y)) {
      if (player.flags.berco) return say([["", "O berço continua aqui, vazio. Às vezes, quando ninguém olha, ele balança sozinho."]]);
      player.flags.berco = true;
      addItem("chocalho");
      saveGame();
      game.flash = 1;
      playSound(784, 0.4, "sine", 0.05);
      return say([
        ["", "É o berço do sonho. Madeira velha, mas inteira, como se alguém tivesse cuidado dele por trezentos anos."],
        ["", "Dentro, embrulhado num pano azul, há um chocalho pequeno. Quando você o pega, o fragmento canta uma nota."],
        ["Vesper (eco)", "Se você achou isto... então deu certo. Obrigado, pequeno."],
        ["", "Você recebeu: Chocalho de Vesper."],
      ]);
    }
    if (story() && player.finished && LAIRS[player.zone] && near(ZONES[player.zone].guardPos, x, y)) return startLairTrial(LAIRS[player.zone]);
    return iaBase(x, y);
  };
  const cdBase = crewDrawList;
  crewDrawList = function (list, t) {
    cdBase(list, t);
    if (cradleOn()) list.push({ y: cradleSpot()[1] + 0.01, draw: () => drawCradle(t) });
  };
  const wkBase = walkable;
  walkable = function (z, x, y) {
    if (z === "vila" && cradleCache && cradleOn()) {
      const [cx, cy] = cradleCache;
      if (x === cx && y === cy) return false;
    }
    return wkBase(z, x, y);
  };

  // 7. covil do farol e fim do desafio
  const sbBase = storyBuilding;
  storyBuilding = function (b) {
    if (b && b.name === "Farol de Brisamar" && story() && player.finished && player.dom) return startLairTrial(LAIRS.farol), true;
    return sbBase.apply(this, arguments);
  };
  const lsBase = lairSolved;
  lairSolved = function (L, msg) {
    if (game.lairTrial && game.lairTrial.region === L.region) {
      lairState(L).ok = true;
      lairApply(L);
      return;
    }
    return lsBase.apply(this, arguments);
  };
  const upBase = update;
  update = function () {
    const r = upBase.apply(this, arguments);
    const T = game.lairTrial;
    if (T) {
      const L = LAIRS[T.region];
      if (!lairOfZone(player.zone)) game.lairTrial = null;
      else if (L && lairState(L).ok && game.mode === "world") finishLairTrial(L);
    }
    return r;
  };

  // 5. Árvore do Dom: efeitos
  const dmBase = dmgMul;
  dmgMul = function (els) {
    let m = dmBase.apply(this, arguments);
    if (fragOn() && els && els.includes(player.dom)) m *= 1 + 0.08 * treeOf().forca;
    return m;
  };
  const scBase = spellCost;
  spellCost = function (k) {
    const c = scBase.apply(this, arguments);
    if (!c || !fragOn() || !treeOf().fluxo || !k.split("+").includes(player.dom)) return c;
    return Math.max(1, Math.ceil(c * (1 - 0.15 * treeOf().fluxo)));
  };
  const asdBase = applySpellDamage;
  applySpellDamage = function (spell, messages) {
    const r = asdBase.apply(this, arguments);
    const e = battle && battle.e;
    if (fragOn() && e && e.hp > 0 && spell.el.includes(player.dom) && Math.random() < 0.1 * treeOf().eco) {
      const n = Math.max(1, Math.round(spell.pow * 0.5 * levelScale() * dmgMul(spell.el)));
      e.hp -= n;
      const ec = enemyCenter();
      floatText(ec.x + 20, ec.y - 52, String(n), fragDom().cor);
      messages.push(`O eco repete o golpe: +${n}!`);
    }
    return r;
  };
  const gxBase = gainXP;
  gainXP = function () {
    const lv = gxBase.apply(this, arguments);
    if (fragOn() && lv && lv.length && treeSpent() < 9) setTimeout(() => toast(`+1 ponto na Árvore do Dom! Abra a Jornada (J) para usar.`, 3200), 1600);
    return lv;
  };

  // 6 e 12. fusão e som do elemento
  const pcBase = playerCast;
  playerCast = function () {
    const B = battle;
    const sel = B && B.sel ? B.sel.slice() : [];
    const key = sel.length ? spellKey(sel) : null;
    const wasBusy = B && B.busy;
    const r = pcBase.apply(this, arguments);
    if (fragOn() && B && !wasBusy && B.busy && !B.done) {
      if (sel.includes(player.dom) && DOM_SOUND[player.dom]) DOM_SOUND[player.dom]();
      if (key && key === fusionKey()) setTimeout(() => battle === B && fusionScene(), 250);
    }
    return r;
  };

  // 1 e 8. Jornada: Diário do Fragmento, Árvore do Dom e bestiário dos Guardiões
  const jhBase = journeyHTML;
  journeyHTML = function () {
    let h = jhBase.apply(this, arguments);
    if (!fragOn()) return h;
    const F = player.flags,
      d = fragDom();
    const row = (ic, t, s) => `<div class="jr-row">${iconHTML(ic, 18)}<div><b>${t}</b><small>${s}</small></div></div>`;
    const ent = [
      [F.fragWake, "O fragmento acorda", `No treino com o Kael, um eco da Runa ${RUNE_OF[d.rune]} despertou em você: ${d.art}.`],
      [F.frag1, "A lasca de luz", `Vesper quebrou um pedaço da Runa ${RUNE_OF[d.rune]} para salvá-lo do Silêncio.`],
      [F.frag2, "O berço de Cinzaluz", "Ele escondeu a lasca num berço. O eco passou de geração em geração até você."],
      [F.berco, "O chocalho", "Você achou o berço de verdade, em Cinzaluz, e o chocalho que Vesper deixou."],
      [F.domAwake, "O despertar", `A Runa ${RUNE_OF[d.rune]} voltou e reconheceu o fragmento. Você tem afinidade com ela.`],
      [F.frag3, "O último pedaço bom", "O fragmento falou com a própria voz: ele é o que restou de bom em Vesper."],
    ];
    const diary = ent.map(([ok, t, s]) => (ok ? row("book", t, s) : row("book", "???", "Ainda não descoberto."))).join("");
    const T = treeOf();
    const tree = `<div class="jr-row">${iconHTML("sparkle", 18)}<div><b>Árvore do Dom: ${d.nome}</b><small>Força ${T.forca}/3 · Fluxo ${T.fluxo}/3 · Eco ${T.eco}/3 · ${treePoints()} ponto(s) livre(s)</small></div><button id="jrTree" style="margin-left:auto">Abrir</button></div>`;
    const fate = player.guardFate || {};
    const GT = [["ent", "bosque"], ["fenixf", "farol"], ["serpente", "pantano"], ["grifo", "picos"], ["basilisco", "mina"], ["leviata", "porto"]];
    const best = GT.map(([type, reg]) => {
      const E = ENEMIES[type],
        bs = (player.best || {})[type] || { w: [], r: [] },
        met = !!bs.seen || bs.w.length || fate[type] || player.guards.includes(reg);
      if (!met) return row("skull", "???", "Guardião ainda não encontrado.");
      const w = bs.w.length ? bs.w.map((r) => (RUNES[r] ? RUNES[r].nome : r)).join(", ") : "?";
      const how = fate[type] === "vilao" ? "Você arrancou a runa dele." : fate[type] ? "Você o libertou." : "Ainda não vencido.";
      const mech = GUARD_MECH[type] ? GUARD_MECH[type](w).split(":")[0] : "";
      return row("skull", E.nome, `Fraco contra: ${w}${mech ? " · " + mech : ""} · ${how}`);
    }).join("");
    const rec = player.lairRecords && Object.keys(player.lairRecords).length ? `<h3>Recordes dos covis</h3>${Object.entries(player.lairRecords).map(([r, s]) => row("flag", LAIRS[r] ? LAIRS[r].n : r, `${s} segundos`)).join("")}` : "";
    return h + `<h3>Diário do Fragmento</h3>${diary}<h3>O seu dom</h3>${tree}<h3>Bestiário dos Guardiões</h3>${best}${rec}`;
  };
  const ojBase = openJourney;
  openJourney = function () {
    const r = ojBase.apply(this, arguments);
    const b = byId("jrTree");
    if (b)
      b.onclick = () => {
        const c = byId("jrclose");
        if (c) c.click();
        setTimeout(openDomTree, 80);
      };
    return r;
  };

  // 4. Novo Jogo+: novo elemento, e os ecos conversam.
  const ngp = byId("btnNGP");
  if (ngp) {
    const old = ngp.onclick;
    ngp.onclick = function () {
      if (!player || !player.dom) return old && old.apply(this, arguments);
      const o = player;
      game.ngpKeep = { spells: (o.spells || []).slice(), mastery: Object.assign({}, o.mastery), combos: (o.combos || []).slice() };
      player = newPlayer();
      Object.assign(player, { name: o.name, look: o.look, gender: o.gender, ngp: (o.ngp || 0) + 1, tutDone: true, diff: o.diff, traits: o.traits, orient: o.orient, prevDoms: [...(o.prevDoms || []), o.dom], domTree: Object.assign({}, o.domTree), lairRecords: Object.assign({}, o.lairRecords) });
      game.seenArr = {};
      game.mm = {};
      byId("end").style.display = "none";
      showChoose();
    };
  }
  const peBase = pickElement;
  pickElement = function (r) {
    const keep = game.ngpKeep;
    const res = peBase.apply(this, arguments);
    if (keep && isDom(r)) {
      game.ngpKeep = null;
      player.spells = keep.spells.filter((k) => SPELLS[k]);
      player.mastery = keep.mastery;
      player.combos = keep.combos;
      saveGame();
      setTimeout(() => toast(`Novo Jogo+ ${player.ngp}: seu Grimório veio junto. Os inimigos estão ${Math.round(35 * player.ngp)}% mais fortes.`, 5200), 1500);
    }
    return res;
  };
  const inBase = INTRO;
  INTRO = function () {
    const l = inBase.apply(this, arguments);
    const prev = fragOn() && player.prevDoms && player.prevDoms[player.prevDoms.length - 1];
    if (prev && DONS[prev]) {
      const P = DONS[prev],
        d = fragDom();
      l.splice(
        2,
        0,
        prev === player.dom
          ? ["Arquimaga Odelia", `Estranho... ${d.art} em você parece lembrar do caminho. Como se já tivesse feito esta viagem antes.`]
          : ["Arquimaga Odelia", `Estranho... sinto dois ecos em você. ${cap(d.art)}, bem forte, e um sussurro ${P.de}, bem longe. Como se você já tivesse vivido esta história.`],
      );
    }
    return l;
  };
})();
