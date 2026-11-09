/**
 * ECOS DO ARCANO — 39-saga.js (modo História)
 *  1. Flashbacks jogáveis: cada página do diário de Vesper abre uma lembrança
 *     dos irmãos crianças, e você escolhe como o pequeno Vesper reage. As
 *     escolhas mudam a luta final.
 *  2. Escolhas no meio da história: o destino do Kael e o do diário com o Honda.
 *  3. Arcos da turma: uma missão pessoal para cada amigo; quem completar luta mais forte no final.
 *  4. Epílogo jogável: estátua (ou bandeiras negras), os irmãos na praça e falas novas.
 *  5. Chefes com fases: na metade da vida o Guardião muda de forma e de fraqueza.
 *  6. Combos secretos: duas magias seguidas, na ordem certa, viram um combo.
 *  7. Batalha em dupla: seu melhor amigo da turma luta junto contra os Guardiões.
 *  8. Cripta dos Ecos (Bosque): tochas em ordem, espelhos e a porta elemental.
 *  9. Segredos escondidos fora do caminho em cada região.
 * 10. Capítulos do Pântano e da Torre, com quem pede ajuda e recompensa.
 * 11. Novo Jogo+: recomeçar com o Grimório, inimigos mais fortes e déjà-vu.
 * 12. Difícil de verdade: os inimigos se adaptam à runa que você mais usa.
 */

"use strict";

const story = () => !lifeMode();
function sagaSpot(zone, seed, avoid = []) {
  const Z = ZONES[zone];
  if (!Z) return null;
  let h = hashStr(zone + seed);
  for (let k = 0; k < 3000; k++) {
    h = (h * 1103515245 + 12345) >>> 0;
    const x = 3 + (h % Math.max(1, Z.w - 6)),
      y = 3 + ((h >>> 8) % Math.max(1, Z.h - 6));
    let ok = true;
    for (let dy = -1; dy <= 1 && ok; dy++) for (let dx = -1; dx <= 1 && ok; dx++) if (!walkable(zone, x + dx, y + dy)) ok = false;
    if (ok && !avoid.some(([ax, ay]) => Math.abs(ax - x) + Math.abs(ay - y) < 6)) return [x, y];
  }
  return null;
}
const sagaCache = {};
function spotOf(zone, seed) {
  const k = zone + "|" + seed;
  if (!(k in sagaCache)) sagaCache[k] = sagaSpot(zone, seed);
  return sagaCache[k];
}

/* ===================== 1. FLASHBACKS ===================== */
const FLASHBACKS = [
  { t: "A primeira faísca", lines: ["Odelia, 9 anos, acende uma vela com o dedo.", "Vesper, 7, tenta... e só sai fumaça.", "\"Calma, Vesper. A faísca vem quando a gente para de brigar com ela.\""], q: "Como o pequeno Vesper responde?", o: [["\"Me ensina de novo?\"", 1], ["\"Pra você é fácil! Você é a preferida!\"", 0]] },
  { t: "O farol", lines: ["Os dois sobem o Farol de Brisamar escondidos.", "Lá em cima, Vesper ouve um sussurro no vento: um silêncio que chama.", "Odelia não ouve nada."], q: "O que Vesper faz com o sussurro?", o: [["Conta tudo para a irmã", 1], ["Guarda segredo e volta sozinho outras noites", 0]] },
  { t: "O cajado", lines: ["Pedravale. Vesper, já moço, encomenda um cajado aos anões.", "\"Que runa vai no topo?\", pergunta a ferreira."], q: "Qual runa Vesper escolhe?", o: [["Luz, como a da irmã", 1], ["Sombra. \"Ninguém usa. Vai ser só minha.\"", 0]] },
  { t: "A briga", lines: ["Odelia se recusa a ensinar a Canção Proibida.", "\"Ela cala o mundo, Vesper. Não é magia, é fome.\"", "A porta da torre treme."], q: "E Vesper?", o: [["Pede desculpas e fica", 1], ["Bate a porta e jura que vai aprender sozinho", 0]] },
  { t: "A última noite", lines: ["Noite de lua cheia. Vesper arruma uma bolsa pequena.", "Odelia dorme no quarto ao lado.", "O Silêncio sussurra: \"Venha.\""], q: "Antes de sair...", o: [["Deixa uma carta: \"Eu volto. Prometo.\"", 1], ["Sai sem olhar para trás", 0]] },
];
function flashbackScene(F) {
  return (W, H, t) => {
    ctx.fillStyle = "#2a2014";
    ctx.fillRect(0, 0, W, H);
    const g = ctx.createRadialGradient(W / 2, H / 2, 40, W / 2, H / 2, W * 0.7);
    g.addColorStop(0, "rgba(220,190,140,.55)");
    g.addColorStop(1, "rgba(40,28,16,.95)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "rgba(90,70,40,.5)";
    ctx.fillRect(0, H * 0.62, W, H * 0.38);
    const kid = (robe, hair, x, dir) => drawSprite(wizardRects(robe, null, hair, null, dir, Math.floor(t * 3) % 2), x, H * 0.62 - 58, 3.4, dir === "left");
    kid("#d8c090", "#3a2414", W / 2 - 90, "right");
    kid("#8a7a60", "#1a1410", W / 2 + 30, "left");
    ctx.font = '600 12px "Pixelify Sans", sans-serif';
    ctx.fillStyle = "#f6e6c0";
    ctx.fillText("Odelia", W / 2 - 64, H * 0.62 + 16);
    ctx.fillText("Vesper", W / 2 + 56, H * 0.62 + 16);
    ctx.font = '700 22px "Pixelify Sans", sans-serif';
    ctx.fillStyle = "#ffe8b0";
    ctx.fillText(`Lembrança: ${F.t}`, W / 2, 50);
    ctx.font = '500 15px "Pixelify Sans", sans-serif';
    F.lines.forEach((l, i) => {
      const a = Math.min(1, Math.max(0, t - 0.6 - i * 1.4));
      ctx.fillStyle = `rgba(255,240,210,${a})`;
      ctx.fillText(l, W / 2, 96 + i * 24);
    });
    for (let i = 0; i < 30; i++) {
      ctx.fillStyle = "rgba(255,230,180,.25)";
      ctx.fillRect((i * 131 + t * 12) % W, (i * 71 + t * 8) % H, 2, 2);
    }
  };
}
function playFlashback(i) {
  const F = FLASHBACKS[i];
  if (!F) return;
  player.fb = player.fb || [];
  playCine(flashbackScene(F), 7.5, () =>
    choice(`Lembrança: ${F.t}`, F.q, F.o.map(([t, kind]) => ({ t, fn: () => ((player.fb[i] = kind), saveGame(), say([["", kind ? "A lembrança fica quente, como uma vela acesa." : "A lembrança escurece, como se o Silêncio tivesse soprado."]])) }))),
  );
}
function flashbackTick() {
  const n = (player.pages || []).length;
  const seen = player.fbSeen || 0;
  if (n > seen && game.mode === "world" && !game.dialog) {
    player.fbSeen = seen + 1;
    playFlashback(seen);
  }
}
function vesperKindness() {
  return (player.fb || []).filter((x) => x === 1).length;
}

/* ===================== 2. ESCOLHAS NO MEIO ===================== */
ENEMIES.kaelSil = Object.assign({}, ENEMIES.aprendiz, { nome: "Kael Silenciado", hp: 210, atk: 15, xp: 140, cor: "#3a2a5a", boss: true });
function midChoicesTick() {
  if (player.zone !== "vila" || game.mode !== "world" || game.dialog) return;
  const F = player.flags;
  if (!F.kaelChoice && guardiansFreed() >= 2 && NPCS.kael && !isDead("kael")) {
    F.kaelChoice = "pendente";
    say([["Instrutor Kael", "Aprendiz... preciso te contar. Eu ouço o Silêncio. À noite ele me chama pelo nome."], ["Instrutor Kael", "Eu tenho medo do que estou virando."]], () =>
      choice("O destino do Kael", "O que você faz?", [
        { t: "Ficar do lado dele e ajudar a resistir", icon: "heart", fn: () => ((F.kaelChoice = "ajudou"), addFriendship("kael", 25), say([["Instrutor Kael", "Obrigado. Se a hora chegar, eu luto do seu lado."]])) },
        { t: "Contar tudo para a Odelia", icon: "scroll", fn: () => ((F.kaelChoice = "exilado"), vilaNews("A Arquimaga Odelia mandou o Instrutor Kael para longe de Cinzaluz."), say([["Arquimaga Odelia", "Já perdi um irmão para o Silêncio. Não vou perder outro aluno. Kael, vá para o norte."], ["", "Kael vai embora da vila. A Escola fica sem instrutor."]])) },
        { t: "Deixar ele decidir sozinho", icon: "door", fn: () => ((F.kaelChoice = "perdido"), say([["", "Na manhã seguinte, Kael sumiu. Alguém viu um vulto subindo para a Torre..."]])) },
      ]),
    );
    return;
  }
  if (!F.hondaChoice && (player.pages || []).length >= 3 && NPCS.honda) {
    F.hondaChoice = "pendente";
    say([["Professor Bruno Honda", "Esse diário... é a maior descoberta da minha vida. Me deixa ficar com ele uns dias? Eu decifro o resto."]], () =>
      choice("O diário de Vesper", "Confiar o diário ao Honda?", [
        { t: "Deixar com ele", icon: "book", fn: () => ((F.hondaChoice = "confiou"), addFriendship("honda", 20), say([["Professor Bruno Honda", "Achei uma frase escondida nas margens: 'Odelia, se você ler isso, a culpa nunca foi sua.'"], ["", "Essa frase pode mudar a luta final."]])) },
        { t: "Pegar de volta", icon: "lock", fn: () => ((F.hondaChoice = "recusou"), addFriendship("honda", -20), say([["Professor Bruno Honda", "...Entendo. É seu. Boa sorte, aprendiz."]])) },
      ]),
    );
  }
}
{
  const nhBase = npcHidden;
  npcHidden = function (id) {
    if (id === "kael" && story() && (player.flags.kaelChoice === "exilado" || (player.flags.kaelChoice === "perdido" && !player.flags.kaelSalvo))) return true;
    return nhBase(id);
  };
}

/* ===================== 3. ARCOS DA TURMA ===================== */
const ARCS = {
  marcos: { t: "O treino da guarda", d: "Vença 3 batalhas para mostrar aos soldados como se luta.", ok: (A) => (player.winsTotal || 0) - A.base >= 3 },
  luca: { t: "O panfleto nos Picos", d: "Leve um panfleto iluminista até os Picos.", ok: (A) => (player.visitAfter || {}).picos > A.day0 },
  mylena: { t: "O lírio do Pântano", d: "Traga um lírio do Pântano para a pintura dela.", ok: (A) => (player.visitAfter || {}).pantano > A.day0 },
  lucas: { t: "A noite sem medo", d: "Vença uma batalha à noite (ele diz que você não consegue).", ok: () => !!player.nightWin },
  andressa: { t: "As páginas perdidas", d: "Tenha 3 páginas do diário de Vesper.", ok: () => (player.pages || []).length >= 3 },
  matheus: { t: "Cristais para a fazenda", d: "Visite a Mina de Cristal.", ok: (A) => (player.visitAfter || {}).mina > A.day0 },
};
function arcs() {
  return (player.arcs = player.arcs || {});
}
function arcsDone() {
  return Object.keys(ARCS).filter((id) => arcs()[id] && arcs()[id].done);
}
{
  const itemsBase = lifeSocialItems;
  lifeSocialItems = function (id) {
    const items = itemsBase(id);
    if (!story() || !ARCS[id]) return items;
    const A = arcs()[id],
      R = ARCS[id],
      n = shortName(id);
    if (!A)
      items.unshift({ t: `Missão pessoal: ${R.t}`, icon: "star", fn: () => ((arcs()[id] = { base: player.winsTotal || 0, day0: player.day * 1440 + player.clock }), saveGame(), say([[n, `Preciso de você. ${R.d}`], ["", "Missão pessoal aceita! Veja em Missões (Q)."]])) });
    else if (!A.done && R.ok(A))
      items.unshift({ t: `Concluir: ${R.t}`, icon: "party", fn: () => ((A.done = true), addFriendship(id, 20), gainXP(60), (player.gold += 50), saveGame(), say([[n, "Você conseguiu! Eu não esqueço isso. Na luta final, pode contar comigo de verdade."], ["", "+60 XP, +50 de ouro. Esse amigo vai lutar mais forte ao seu lado."]])) });
    return items;
  };
  const oqBase = openQuests;
  openQuests = function () {
    oqBase();
    if (!story() || game.mode !== "quests") return;
    const el = byId("quests");
    if (!el) return;
    const A = arcs();
    const html = `<h3>${iconHTML("heart")}Missões da turma (${arcsDone().length}/${Object.keys(ARCS).length})</h3>` + Object.entries(ARCS).map(([id, R]) => `<div class="qs ${A[id] && A[id].done ? "done" : A[id] ? "cur" : ""}">${shortName(id)}: ${R.t}<div class="qtip">${A[id] ? (A[id].done ? "Concluída." : R.d + (R.ok(A[id]) ? " <b>Pronto: fale com " + shortName(id) + "!</b>" : "")) : "Converse com " + shortName(id) + " para começar."}</div></div>`).join("") + `<h3>${iconHTML("star")}Segredos e combos</h3><div class="qs">Segredos escondidos: ${(player.secretsFound || []).length}/${SECRET_SPOTS.length}</div><div class="qs">Combos secretos: ${(player.combos || []).length}/${Object.keys(COMBOS).length}</div>`;
    el.insertAdjacentHTML("beforeend", html);
  };
}

/* ===================== 5. CHEFES COM FASES / 7. DUPLA / 12. ADAPTAÇÃO ===================== */
function bossPhaseTick() {
  const b = battle;
  if (!b || !b.e || !b.e.boss || b.phase2 || b.e.hp <= 0 || b.e.hp > b.e.max * 0.5) return;
  b.phase2 = true;
  const old = (b.e.weak || []).slice();
  const pool = ORDER.filter((r) => !old.includes(r) && (player.runes || []).includes(r));
  b.e.weak = pool.length ? [pk(pool)] : old;
  b.e.resist = old;
  b.e.hp = Math.min(b.e.max, b.e.hp + Math.round(b.e.max * 0.12));
  b.e.atk *= 1.15;
  b.e.cor = shade(b.e.cor || "#5a3a7a", -0.35);
  game.shake = 0.6;
  playSound(80, 0.8, "sawtooth");
  battleLog(`${b.e.nome} RUGE E MUDA DE FORMA! A fraqueza agora é ${b.e.weak.map((r) => RUNES[r].nome).join(", ")}; o que funcionava antes, agora ele resiste!`);
  if (typeof renderBattle === "function") renderBattle();
}
function pickAlly(type) {
  if (lifeMode() || type === "boneco") return null;
  const e = ENEMIES[type] || {};
  if (!e.boss) return null;
  const done = arcsDone().filter((id) => CREW.includes(id) || id === "luca");
  if (type === "silenciador" && player.flags.kaelChoice === "ajudou") return "kael";
  const pool = (done.length ? done : CREW.filter((id) => friendshipLevel(id) >= 2)).filter((id) => NPCS[id] && !isDead(id));
  return pool.length ? pool.sort((a, b) => friendship(b) - friendship(a))[0] : null;
}
{
  const sbBase = startBattle;
  startBattle = function (type, mob, opts = {}) {
    // 12. Inimigos se adaptam à runa preferida (difícil e Novo Jogo+).
    const r = sbBase(type, mob, opts);
    if (!battle) return r;
    const B = battle;
    if (player.ngp) {
      const k = 1 + 0.35 * player.ngp;
      B.e.hp = Math.round(B.e.hp * k);
      B.e.max = Math.round(B.e.max * k);
      B.e.atk *= 1 + 0.2 * player.ngp;
    }
    if ((player.diff === "dificil" || player.ngp) && type !== "boneco") {
      const use = player.runeUse || {};
      const tot = Object.values(use).reduce((a, b) => a + b, 0);
      const fav = Object.keys(use).sort((a, b) => use[b] - use[a])[0];
      if (fav && tot >= 12 && use[fav] / tot >= 0.35 && !(B.e.weak || []).includes(fav)) {
        B.e.resist = [...new Set([...(B.e.resist || []), fav])];
        setTimeout(() => battle === B && battleLog(`${B.e.nome} já ouviu falar de você: aprendeu a resistir a ${RUNES[fav].nome}!`), 700);
      }
    }
    // 7. Batalha em dupla.
    const ally = pickAlly(type);
    if (ally) {
      B.ally = { id: ally, healed: false, bonus: arcs()[ally] && arcs()[ally].done ? 1.4 : 1 };
      setTimeout(() => battle === B && battleLog(`${shortName(ally)} chega correndo e luta ao seu lado!`), 900);
    }
    // 1 e 2. As escolhas da história pesam na luta final.
    if (type === "silenciador") {
      const kind = vesperKindness() + (player.flags.hondaChoice === "confiou" ? 1 : 0);
      if (kind) {
        B.e.hp = Math.round(B.e.hp * (1 - kind * 0.05));
        setTimeout(() => battle === B && battleLog(`As lembranças boas de Vesper (${kind}) enfraquecem o Silêncio. Ele hesita...`), 1600);
      }
      const n = arcsDone().length;
      if (n) setTimeout(() => battle === B && battleLog(`${n} amigo(s) com a missão pessoal cumprida lutam com força total! (+${n * 4}% de dano)`), 2200);
    }
    return r;
  };
  const etBase = enemyTurn;
  enemyTurn = function () {
    const B = battle;
    if (B && B.ally && B.e.hp > 0) {
      const A = B.ally,
        n = shortName(A.id);
      if (!A.healed && player.hp < maxHp() * 0.3) {
        A.healed = true;
        const h = Math.round(maxHp() * 0.3);
        healPlayer(h, "#8affb0");
        battleLog(`${n} te puxa para trás e cuida dos seus ferimentos: +${h} HP!`);
      } else {
        const dmg = Math.max(3, Math.round((6 + player.lvl * 1.6) * A.bonus * (0.8 + Math.random() * 0.4)));
        damageEnemy(dmg, "#8ad0ff", -40, 10);
        battleLog(`${n} ${pk(["acerta um golpe certeiro", "joga uma pedra na cabeça dele", "distrai o inimigo e acerta", "grita e ataca"])}: ${dmg} de dano!`);
        if (B.e.hp <= 0) return setTimeout(win, DELAY.WIN);
      }
    }
    return etBase();
  };
  const dmBase = dmgMul;
  dmgMul = function (els) {
    let m = dmBase(els);
    if (battle && battle.type === "silenciador") m *= 1 + arcsDone().length * 0.04;
    return m;
  };
}

/* ===================== 6. COMBOS SECRETOS ===================== */
const COMBOS = {
  "agua>fogo": { n: "Vapor Escaldante", mult: 1.6 },
  "fogo>ar": { n: "Tornado de Fogo", mult: 1.7 },
  "agua>terra": { n: "Lama Pegajosa", mult: 1.3, stun: 1 },
  "luz>sombra": { n: "Eclipse", mult: 2 },
  "ar>agua": { n: "Chuva de Agulhas", mult: 1.5 },
  "fogo>terra": { n: "Magma", mult: 1.8 },
  "sombra>luz": { n: "Aurora", mult: 1.2, heal: 0.25 },
  "terra>ar": { n: "Tempestade de Areia", mult: 1.4, stun: 1 },
};
{
  const asBase = applySpellDamage;
  applySpellDamage = function (spell, messages) {
    const before = battle.e.hp;
    const r = asBase(spell, messages);
    const prev = battle.prevEl,
      cur = spell.el[spell.el.length - 1];
    battle.prevEl = cur;
    const C = COMBOS[`${prev}>${cur}`];
    if (prev && C && battle.e.hp > 0) {
      const extra = Math.max(4, Math.round((before - battle.e.hp) * (C.mult - 1)));
      damageEnemy(extra, "#ffe066", 20, -24);
      if (C.stun) battle.e.stun = Math.max(battle.e.stun || 0, 1);
      if (C.heal) healPlayer(Math.round(maxHp() * C.heal), "#ffe8a0");
      player.combos = player.combos || [];
      const novo = !player.combos.includes(C.n);
      if (novo) player.combos.push(C.n);
      messages.push(`COMBO${novo ? " SECRETO DESCOBERTO" : ""}: ${C.n}! +${extra} de dano.`);
      game.shake = 0.3;
      playSound(988, 0.15, "triangle");
      battle.prevEl = null;
    }
    return r;
  };
  const pcBase = playerCast;
  playerCast = function () {
    if (battle && battle.sel && battle.sel.length) {
      player.runeUse = player.runeUse || {};
      for (const r of battle.sel) player.runeUse[r] = (player.runeUse[r] || 0) + 1;
    }
    return pcBase();
  };
  const winBase = win;
  win = function () {
    if (battle && !battle.done) {
      player.winsTotal = (player.winsTotal || 0) + 1;
      if (battle.night) player.nightWin = true;
      if (battle.type === "kaelSil") player.flags.kaelSalvo = true;
    }
    return winBase.apply(this, arguments);
  };
}

/* ===================== 8. CRIPTA DOS ECOS ===================== */
ZONE_DEFS.cripta = { nome: "Cripta dos Ecos", theme: "mina", exits: {}, enemies: [] };
const CRYPT = { w: 34, h: 11, exit: [3, 9], doors: [[11, 5], [22, 5]], torches: [[3, 2], [8, 2], [3, 8], [8, 8]], mirrors: [[14, 3], [18, 7], [20, 3]], src: [13, 8], crystal: [20, 8], edoor: [26, 5], chest: [31, 5] };
const TORCH_ORDER = [2, 0, 3, 1];
function genCrypt() {
  const { w, h } = CRYPT;
  const m = makeGrid(w, h, (x, y) => (x === 0 || y === 0 || x === w - 1 || y === h - 1 ? "#" : "."));
  for (const [dx] of CRYPT.doors) for (let y = 1; y < h - 1; y++) m[y][dx] = "#";
  for (let y = 1; y < h - 1; y++) m[y][CRYPT.edoor[0]] = "#";
  const z = finalize("cripta", ZONE_DEFS.cripta, m, w, h, {}, {}, null);
  z.town = { bld: [], doors: {}, stalls: {}, huts: [], arrive: CRYPT.exit.slice(), horses: [], boats: [], yard: true };
  return z;
}
ZONES.cripta = genCrypt();
function cryptState() {
  return (player.crypt = player.crypt || { lit: [], torchesOk: false, mir: [0, 0, 0], mirOk: false, eOk: false, chest: false, rune: null });
}
function setTile(zone, x, y, c) {
  const m = ZONES[zone].map,
    row = m[y];
  m[y] = typeof row === "string" ? row.slice(0, x) + c + row.slice(x + 1) : (row.splice(x, 1, c), row);
}
function cryptApply() {
  const S = cryptState();
  setTile("cripta", CRYPT.doors[0][0], CRYPT.doors[0][1], S.torchesOk ? "." : "#");
  setTile("cripta", CRYPT.doors[1][0], CRYPT.doors[1][1], S.mirOk ? "." : "#");
  setTile("cripta", CRYPT.edoor[0], CRYPT.edoor[1], S.eOk ? "." : "#");
}
function cryptEntrance() {
  return spotOf("bosque", "cripta");
}
function enterCrypt() {
  if (lifeMode()) return;
  cryptApply();
  game.cryptBack = { zone: player.zone, x: player.x, y: player.y };
  player.zone = "cripta";
  [player.x, player.y] = [CRYPT.exit[0], CRYPT.exit[1] - 1];
  player.rx = player.x;
  player.ry = player.y;
  player.dir = "up";
  player.riding = false;
  game.fade = 1;
  enterZone(true);
  if (!player.flags.criptaVista) {
    player.flags.criptaVista = true;
    say([["", "Uma cripta antiga, com o cheiro de três séculos. Inscrições cobrem as paredes."], ["", "\"Quem quiser a memória de Vesper, que acenda as chamas como as estrelas se acendem: primeiro a do sul, depois a do norte...\""]]);
  }
}
function leaveCrypt() {
  const b = game.cryptBack || { zone: "bosque", x: (cryptEntrance() || [5, 5])[0], y: (cryptEntrance() || [5, 5])[1] + 1 };
  player.zone = b.zone;
  [player.x, player.y, player.rx, player.ry] = [b.x, b.y, b.x, b.y];
  game.fade = 1;
  enterZone(true);
}
const near = (a, x, y) => a && a[0] === x && a[1] === y;
function cryptTarget(x, y) {
  const S = cryptState();
  if (near(CRYPT.exit, x, y)) return "Sair da cripta";
  const ti = CRYPT.torches.findIndex((p) => near(p, x, y));
  if (ti >= 0) return S.torchesOk ? "Tocha acesa" : "Acender a tocha";
  const mi = CRYPT.mirrors.findIndex((p) => near(p, x, y));
  if (mi >= 0) return "Girar o espelho";
  if (near([CRYPT.edoor[0] - 1, CRYPT.edoor[1]], x, y) || near(CRYPT.edoor, x, y)) return S.eOk ? null : "Porta elemental";
  if (near(CRYPT.chest, x, y)) return S.chest ? "Baú vazio" : "Abrir o baú de Vesper";
  if (near([2, 5], x, y)) return "Ler a inscrição";
  return null;
}
function cryptInteract(x, y) {
  const S = cryptState();
  const l = cryptTarget(x, y);
  if (!l) return false;
  if (l === "Sair da cripta") return leaveCrypt(), true;
  if (l === "Ler a inscrição") return say([["", "\"...primeiro a do sul, depois a do norte; volte ao sul pelo lado do sol nascente, e termine no norte do lado do poente.\""], ["", "(Dica: sul-oeste, norte-oeste, sul-leste, norte-leste.)"]]), true;
  if (l === "Acender a tocha") {
    const ti = CRYPT.torches.findIndex((p) => near(p, x, y));
    if (S.lit.includes(ti)) return true;
    S.lit.push(ti);
    playSound(440 + S.lit.length * 80, 0.12, "triangle");
    const ok = S.lit.every((v, i) => v === TORCH_ORDER[i]);
    if (!ok) {
      S.lit = [];
      game.shake = 0.2;
      say([["", "As chamas se apagam todas de uma vez. A ordem estava errada."]]);
    } else if (S.lit.length === 4) {
      S.torchesOk = true;
      cryptApply();
      game.shake = 0.3;
      say([["", "As quatro chamas ficam azuis. A parede de pedra desliza e abre passagem!"]]);
    }
    saveGame();
    return true;
  }
  if (l === "Girar o espelho") {
    const mi = CRYPT.mirrors.findIndex((p) => near(p, x, y));
    S.mir[mi] = (S.mir[mi] + 1) % 4;
    playSound(300 + mi * 60, 0.06, "square");
    if (!S.mirOk && S.mir[0] === 1 && S.mir[1] === 2 && S.mir[2] === 3) {
      S.mirOk = true;
      cryptApply();
      game.shake = 0.3;
      say([["", "A luz pula de espelho em espelho e acerta o cristal! A segunda porta se abre."]]);
    }
    saveGame();
    return true;
  }
  if (l === "Porta elemental") {
    S.rune = S.rune || pk((player.runes || []).length ? player.runes : ORDER);
    const sym = RUNES[S.rune];
    choice("Porta elemental", `Um símbolo brilha na porta: o desenho de <b style="color:${sym.cor}">${sym.nome}</b>. Qual runa você toca?`, (player.runes || []).map((r) => ({ t: RUNES[r].nome, fn: () => (r === S.rune ? ((S.eOk = true), cryptApply(), saveGame(), (game.shake = 0.3), say([["", "A porta responde à runa certa e se dissolve em pó brilhante."]])) : say([["", "Nada acontece. O símbolo pisca, como se risse de você."]])) })).concat([{ t: "Voltar", fn: null }]));
    return true;
  }
  if (l === "Abrir o baú de Vesper") {
    S.chest = true;
    addItem("fenix");
    player.gold += 200;
    gainXP(150);
    saveGame();
    say([["", "Dentro do baú: uma Pena de Fênix, 200 de ouro e um bilhete com a letra de criança de Vesper."], ["", "\"Quando eu crescer, quero ser tão bom quanto a Odelia. — V.\""], ["", "+150 XP."]]);
    return true;
  }
  return true;
}
function drawCrypt(t) {
  const S = cryptState();
  const T = TILE;
  CRYPT.torches.forEach(([x, y], i) => {
    const lit = S.torchesOk || S.lit.includes(i);
    ctx.fillStyle = "#5a4030";
    ctx.fillRect(x * T + 13, y * T + 10, 6, 18);
    if (lit) {
      ctx.fillStyle = S.torchesOk ? "#7ad0ff" : "#ffb04a";
      ctx.beginPath();
      ctx.arc(x * T + 16, y * T + 8 + Math.sin(t * 10 + i) * 1.5, 6, 0, 7);
      ctx.fill();
    } else {
      ctx.fillStyle = "#2a2020";
      ctx.fillRect(x * T + 12, y * T + 4, 8, 6);
    }
  });
  CRYPT.mirrors.forEach(([x, y], i) => {
    ctx.save();
    ctx.translate(x * T + 16, y * T + 16);
    ctx.rotate((S.mir[i] * Math.PI) / 2 + Math.PI / 4);
    ctx.fillStyle = "#cfe6ff";
    ctx.fillRect(-11, -3, 22, 6);
    ctx.fillStyle = "#6a7a8a";
    ctx.fillRect(-11, 2, 22, 2);
    ctx.restore();
  });
  // Feixe de luz até onde os espelhos estão certos.
  const pts = [CRYPT.src, CRYPT.mirrors[0], CRYPT.mirrors[1], CRYPT.mirrors[2], CRYPT.crystal];
  const okN = S.mirOk ? 4 : [S.mir[0] === 1, S.mir[1] === 2, S.mir[2] === 3].findIndex((v) => !v) + 1 || 4;
  ctx.strokeStyle = `rgba(255,240,160,${0.6 + 0.3 * Math.sin(t * 6)})`;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(pts[0][0] * T + 16, pts[0][1] * T + 16);
  for (let i = 1; i <= Math.min(okN, 4); i++) ctx.lineTo(pts[i][0] * T + 16, pts[i][1] * T + 16);
  ctx.stroke();
  ctx.fillStyle = "#ffe066";
  ctx.fillRect(CRYPT.src[0] * T + 10, CRYPT.src[1] * T + 10, 12, 12);
  ctx.fillStyle = S.mirOk ? "#ffffff" : "#7a6aa8";
  ctx.beginPath();
  ctx.moveTo(CRYPT.crystal[0] * T + 16, CRYPT.crystal[1] * T + 2);
  ctx.lineTo(CRYPT.crystal[0] * T + 26, CRYPT.crystal[1] * T + 16);
  ctx.lineTo(CRYPT.crystal[0] * T + 16, CRYPT.crystal[1] * T + 30);
  ctx.lineTo(CRYPT.crystal[0] * T + 6, CRYPT.crystal[1] * T + 16);
  ctx.fill();
  if (!S.eOk) {
    const sym = S.rune ? RUNES[S.rune] : null;
    ctx.fillStyle = sym ? sym.cor : "#8a7aa8";
    ctx.globalAlpha = 0.5 + 0.3 * Math.sin(t * 3);
    ctx.fillRect(CRYPT.edoor[0] * T + 8, CRYPT.edoor[1] * T + 4, 16, 24);
    ctx.globalAlpha = 1;
  }
  const [cx, cy] = CRYPT.chest;
  ctx.fillStyle = S.chest ? "#5a4030" : "#c8a030";
  ctx.fillRect(cx * T + 6, cy * T + 12, 20, 14);
  ctx.fillStyle = "#3a2414";
  ctx.fillRect(cx * T + 6, cy * T + 17, 20, 2);
  // Inscrição e saída.
  ctx.fillStyle = "#8a8098";
  ctx.fillRect(2 * T + 8, 5 * T + 4, 16, 22);
  ctx.fillStyle = "#3a3048";
  for (let i = 0; i < 4; i++) ctx.fillRect(2 * T + 10, 5 * T + 8 + i * 4, 12, 2);
  ctx.fillStyle = "#1a1420";
  ctx.fillRect(CRYPT.exit[0] * T + 4, CRYPT.exit[1] * T + 2, 24, 28);
}
function drawCryptEntrance(t) {
  const p = cryptEntrance();
  if (!p) return;
  const X = p[0] * TILE,
    Y = p[1] * TILE;
  ctx.fillStyle = "#6a6478";
  ctx.fillRect(X - 6, Y - 18, 44, 48);
  ctx.fillStyle = "#4a4458";
  ctx.beginPath();
  ctx.arc(X + 16, Y - 18, 22, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = "#120c18";
  ctx.fillRect(X + 4, Y - 6, 24, 36);
  ctx.fillStyle = `rgba(180,140,255,${0.4 + 0.3 * Math.sin(t * 3)})`;
  ctx.fillRect(X + 12, Y - 30, 8, 8);
}

/* ===================== 9. SEGREDOS / 10. PÂNTANO E TORRE ===================== */
const SECRET_SPOTS = ["bosque", "bosque", "pantano", "pantano", "picos", "picos", "mina", "torre", "porto", "serra", "escola", "picos"].map((z, i) => ({ z, k: "seg" + i }));
const SECRET_LORE = [
  "Uma pedra com dois nomes gravados: \"O + V\".",
  "Um pião de madeira, pequeno, pintado de roxo.",
  "Uma página rasgada: \"Hoje a Odelia me defendeu dos meninos do porto.\"",
  "Um sino de cobre que não faz barulho nenhum.",
  "Uma pena de grifo dourada, quente ao toque.",
  "Um anel de criança com uma runa de luz apagada.",
  "Um bilhete: \"Se alguém achar isto, diga à minha irmã que eu tentei.\"",
  "Um cristal que mostra, por um segundo, dois meninos rindo.",
  "Uma concha que, encostada no ouvido, sussurra o seu nome.",
  "Um martelo de anão pequeno demais para um anão.",
  "Um caderno com 100 tentativas de acender uma vela.",
  "Uma flor seca que nunca perdeu a cor.",
];
function secretAt(x, y) {
  return SECRET_SPOTS.findIndex((s, i) => s.z === player.zone && !(player.secretsFound || []).includes(i) && near(spotOf(s.z, s.k), x, y));
}
const CHAPTERS = {
  pantano: { npc: "Velha Juta", look: { robe: "#4a6a3a", hat: "#2a3a20", hair: "#cfc6b8" }, eco: "hidra", item: "lírio da névoa", intro: "O brejo adoece desde que a Hidra acordou. Traga 3 lírios da névoa e liberte a Hidra, e eu te conto o que vi há trezentos anos.", end: "Eu vi Vesper passar por aqui, menino ainda, chorando. Ele plantou o primeiro lírio. Disse que era para a irmã." },
  torre: { npc: "Eco do Bibliotecário", look: { robe: "#3a3a6a", hat: "#20204a", hair: "#9aa0c8" }, eco: "colosso", item: "eco da voz de Vesper", intro: "Esta torre guarda vozes. Junte 3 ecos da voz de Vesper e cale o Colosso. Então eu leio para você o último livro dele.", end: "O último livro de Vesper tem uma frase só, repetida mil vezes: \"Eu só queria ser ouvido.\"" },
};
function chapterNpcSpot(z) {
  return spotOf(z, "npc");
}
function chapterItemSpots(z) {
  return [0, 1, 2].map((i) => spotOf(z, "item" + i));
}
function chap(z) {
  player.chap = player.chap || {};
  return (player.chap[z] = player.chap[z] || { on: false, got: [], done: false });
}
function chapterInteract(x, y) {
  const z = player.zone,
    C = CHAPTERS[z];
  if (!C) return false;
  const S = chap(z);
  if (near(chapterNpcSpot(z), x, y)) {
    if (S.done) return say([[C.npc, C.end]]), true;
    if (!S.on) return ((S.on = true), saveGame(), say([[C.npc, C.intro], ["", `Capítulo novo: ${ZONES[z].nome}. Veja em Missões (Q).`]])), true;
    const eco = (player.ecos || []).includes(C.eco);
    if (S.got.length >= 3 && eco) {
      S.done = true;
      gainXP(200);
      player.gold += 150;
      player.maxHpBonus = (player.maxHpBonus || 0) + 10;
      saveGame();
      return say([[C.npc, C.end], ["", "Capítulo concluído! +200 XP, +150 de ouro e +10 de vida máxima."]]), true;
    }
    return say([[C.npc, `Faltam: ${3 - S.got.length} ${C.item}(s)${eco ? "" : ` e libertar o Eco (${ENEMIES[C.eco].nome})`}.`]]), true;
  }
  const ii = chapterItemSpots(z).findIndex((p) => near(p, x, y));
  if (ii >= 0 && S.on && !S.got.includes(ii)) {
    S.got.push(ii);
    playSound(880, 0.1, "sine");
    saveGame();
    return say([["", `Você encontrou um ${C.item}! (${S.got.length}/3)`]]), true;
  }
  return false;
}
{
  const mhBase = maxHp;
  maxHp = function () {
    return mhBase() + (story() ? player.maxHpBonus || 0 : 0);
  };
}

/* ===================== 4. EPÍLOGO / 11. NOVO JOGO+ ===================== */
const EPI_LINES = {
  heroi: ["Você viu a estátua na praça? Ficou a sua cara!", "Desde que a Canção voltou, até o galo canta afinado.", "Meus filhos brincam de ser você. Um faz a Odelia, outro faz o Vesper.", "A Odelia sorri de novo. Fazia trezentos anos que ninguém via isso."],
  vilao: ["...Bom dia, Majestade Sombria. Não, não estou tremendo.", "Ninguém canta mais na praça. Ninguém tem coragem.", "Dizem que você ouve tudo. Então: eu nunca falei mal de você."],
  dejavu: ["Engraçado... sinto que já vivi esse dia.", "Você de novo? Quer dizer... prazer, desconhecid@.", "Eu sonhei que você salvava o mundo. Era você mesmo?", "Tenho a sensação de que a Odelia vai dizer 'aprendiz' três vezes hoje."],
};
{
  const cwBase = chatWith;
  chatWith = function (id) {
    if (story() && player.finished && Math.random() < 0.5) return say([[shortName(id), pk(player.villainEnd ? EPI_LINES.vilao : EPI_LINES.heroi)]]);
    if (story() && player.ngp && Math.random() < 0.25) return say([[shortName(id), pk(EPI_LINES.dejavu).replace("@", genderWord("o", "a", "e"))]]);
    return cwBase(id);
  };
}
function drawEpilogue(t) {
  if (!player.finished || player.zone !== "vila") return;
  const { cx, cy } = protestPlaza();
  const X = (cx + 3) * TILE,
    Y = (cy + 6) * TILE;
  if (player.villainEnd) {
    for (const dx of [-5, 5]) {
      ctx.fillStyle = "#3a2a2a";
      ctx.fillRect((cx + dx) * TILE + 14, (cy + 2) * TILE - 30, 4, 60);
      ctx.fillStyle = "#1a0e1e";
      ctx.fillRect((cx + dx) * TILE + 18, (cy + 2) * TILE - 30 + Math.sin(t * 2) * 2, 26, 30);
    }
    return;
  }
  ctx.fillStyle = "#8a8090";
  ctx.fillRect(X - 4, Y + 18, 40, 14);
  const rects = heroRects(player.look, "down", null).map(([x, y, w, h]) => [x, y, w, h, "#d8c070"]);
  drawSprite(rects, X, Y - 18, 2.2, false);
  // Os irmãos, juntos de novo.
  drawSprite(wizardRects(NPCS.odelia ? NPCS.odelia.robe : "#5b3fa8", NPCS.odelia ? NPCS.odelia.hat : null, NPCS.odelia ? NPCS.odelia.hair : "#d9d9d9", null, "right", 0), X - 90, Y, 2, false);
  drawSprite(wizardRects("#3a2a5a", null, "#1a1410", null, "left", 0), X - 60, Y, 2, true);
  if (Math.sin(t * 1.2) > 0.6) drawPixelIcon("heart", X - 60, Y - 6, 2);
}
(function ngPlusButton() {
  const keep = byId("btnKeep");
  if (!keep) return;
  const b = document.createElement("button");
  b.id = "btnNGP";
  b.textContent = "Novo Jogo+ ✦";
  b.title = "Recomeça a história com o seu Grimório, inimigos mais fortes e falas novas";
  keep.parentNode.insertBefore(b, keep.nextSibling);
  b.onclick = () => {
    const o = player;
    player = newPlayer();
    Object.assign(player, { name: o.name, look: o.look, gender: o.gender, aff: o.aff, spells: (o.spells || []).slice(), mastery: Object.assign({}, o.mastery), combos: (o.combos || []).slice(), ngp: (o.ngp || 0) + 1, tutDone: true, diff: o.diff, traits: o.traits, orient: o.orient });
    game.seenArr = {};
    game.mm = {};
    saveGame();
    startGame(true);
    setTimeout(() => toast(`Novo Jogo+ ${player.ngp}: seu Grimório veio junto. Os inimigos estão ${Math.round(35 * player.ngp)}% mais fortes.`, 5200), 1500);
  };
})();

/* ===================== LIGAÇÕES ===================== */
{
  const charBase = characterAt;
  characterAt = function (x, y) {
    if (story()) {
      if (player.zone === "cripta" && cryptTarget(x, y)) return true;
      if (CHAPTERS[player.zone] && near(chapterNpcSpot(player.zone), x, y)) return true;
    }
    return charBase(x, y);
  };
  const tgtBase = targetAt;
  targetAt = function (x, y) {
    if (story()) {
      if (player.zone === "cripta") {
        const l = cryptTarget(x, y);
        if (l) return l;
      }
      if (player.zone === "bosque" && near(cryptEntrance(), x, y)) return "Entrar na Cripta dos Ecos";
      if (CHAPTERS[player.zone] && near(chapterNpcSpot(player.zone), x, y)) return CHAPTERS[player.zone].npc;
      if (CHAPTERS[player.zone] && chap(player.zone).on && chapterItemSpots(player.zone).some((p, i) => near(p, x, y) && !chap(player.zone).got.includes(i))) return `Pegar ${CHAPTERS[player.zone].item}`;
      if (secretAt(x, y) >= 0) return "Algo brilha aqui...";
    }
    return tgtBase(x, y);
  };
  const interBase = interactAt;
  interactAt = function (x, y) {
    if (story()) {
      if (player.zone === "cripta" && cryptInteract(x, y)) return;
      if (player.zone === "bosque" && near(cryptEntrance(), x, y)) return enterCrypt();
      if (chapterInteract(x, y)) return;
      const si = secretAt(x, y);
      if (si >= 0) {
        player.secretsFound = player.secretsFound || [];
        player.secretsFound.push(si);
        const g = 40 + Math.floor(Math.random() * 40);
        player.gold += g;
        gainXP(40);
        saveGame();
        playSound(1047, 0.15, "triangle");
        return say([["", `Segredo encontrado (${player.secretsFound.length}/${SECRET_SPOTS.length})! ${SECRET_LORE[si]}`], ["", `+${g} de ouro, +40 XP.`]]);
      }
    }
    return interBase(x, y);
  };
  const cdBase = crewDrawList;
  crewDrawList = function (list, t) {
    cdBase(list, t);
    if (!story()) return;
    if (player.zone === "cripta") list.push({ y: -5, draw: () => drawCrypt(t) });
    if (player.zone === "bosque" && cryptEntrance()) list.push({ y: cryptEntrance()[1], draw: () => drawCryptEntrance(t) });
    if (player.zone === "vila") list.push({ y: protestPlaza().cy + 6.5, draw: () => drawEpilogue(t) });
    const C = CHAPTERS[player.zone];
    if (C) {
      const p = chapterNpcSpot(player.zone);
      if (p) list.push({ y: p[1], draw: () => (drawSprite(wizardRects(C.look.robe, C.look.hat, C.look.hair, null, "down", 0), p[0] * TILE, p[1] * TILE, 2, false), !chap(player.zone).done && drawPixelIcon(chap(player.zone).on ? "chat" : "star", p[0] * TILE + 16, p[1] * TILE - 8, 2)) });
      if (chap(player.zone).on)
        chapterItemSpots(player.zone).forEach((q, i) => {
          if (!q || chap(player.zone).got.includes(i)) return;
          list.push({ y: q[1], draw: () => ((ctx.fillStyle = `rgba(200,240,255,${0.5 + 0.4 * Math.sin(t * 4 + i)})`), ctx.fillRect(q[0] * TILE + 12, q[1] * TILE + 12, 8, 8)) });
        });
    }
    SECRET_SPOTS.forEach((s, i) => {
      if (s.z !== player.zone || (player.secretsFound || []).includes(i)) return;
      const q = spotOf(s.z, s.k);
      if (!q || Math.abs(q[0] - player.x) + Math.abs(q[1] - player.y) > 5) return;
      list.push({ y: q[1], draw: () => ((ctx.fillStyle = `rgba(255,240,170,${0.3 + 0.5 * Math.abs(Math.sin(t * 3 + i))})`), ctx.fillRect(q[0] * TILE + 14, q[1] * TILE + 10 - Math.abs(Math.sin(t * 3)) * 4, 4, 4)) });
    });
  };
  const ezBase = enterZone;
  enterZone = function () {
    const r = ezBase.apply(this, arguments);
    if (story()) {
      player.visitAfter = player.visitAfter || {};
      player.visitAfter[player.zone] = player.day * 1440 + player.clock + 1;
      if (player.zone === "torre" && player.flags.kaelChoice === "perdido" && !player.flags.kaelSalvo) setTimeout(() => game.mode === "world" && say([["Kael Silenciado", "Aprendiz... o Silêncio é tão tranquilo. Fica comigo."]], () => startBattle("kaelSil", null)), 900);
      if (player.zone === "cripta") cryptApply();
    }
    return r;
  };
  const drawBase = draw;
  draw = function () {
    drawBase();
    if (game.mode === "battle" && battle) {
      ctx.save();
      ctx.translate((viewWidth - 640) / 2, 0);
      if (battle.phase2) {
        ctx.fillStyle = `rgba(120,0,40,${0.12 + 0.05 * Math.sin(game.t * 4)})`;
        ctx.fillRect(-200, 0, 1040, 480);
      }
      if (battle.ally && NPCS[battle.ally.id]) {
        const n = NPCS[battle.ally.id],
          pc = playerCenter();
        const u = BATTLE_PLAYER_POS.u * 0.8;
        ctx.fillStyle = "rgba(0,0,0,.25)";
        ctx.beginPath();
        ctx.ellipse(pc.x - 80, pc.y + 7 * u, 6 * u, 1.6 * u, 0, 0, 7);
        ctx.fill();
        drawSprite(wizardRects(n.robe, n.hat, n.hair, null, "right", Math.floor(game.t * 3) % 2), pc.x - 80 - 8 * u, pc.y - 9 * u, u, false);
        ctx.font = '600 12px "Pixelify Sans", sans-serif';
        ctx.fillStyle = "#cfe8ff";
        ctx.textAlign = "center";
        ctx.fillText(shortName(battle.ally.id), pc.x - 80, pc.y - 10 * u);
      }
      ctx.restore();
    }
  };
  let acc = 0;
  const updBase = update;
  update = function (dt) {
    updBase(dt);
    if (!story() || game.mode === "title") return;
    if (game.mode === "battle") bossPhaseTick();
    acc += dt;
    if (acc < 0.5) return;
    acc = 0;
    if (game.mode === "world" && !game.dialog && !game.cine) {
      flashbackTick();
      midChoicesTick();
    }
  };
}
