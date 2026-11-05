/**
 * ECOS DO ARCANO — 09-batalha.js
 * Sistema de batalha por turnos: feitiços, habilidades, turno do inimigo e recompensas.
 *
 * Estado global da batalha: `B` (definido em 02-estado-som-sprites.js).
 * Outros arquivos leem: B.e, B.type, B.busy, B.panel, B.sel, B.shield, B.defending,
 * B.poison, B.fury e B.eshake — por isso esses nomes foram mantidos.
 */

/* ==========================================================================
   CONSTANTES
   ========================================================================== */

/** Posição e escala do mago na tela de batalha. */
const BATTLE_PLAYER_POS = {
  x: 100,
  y: 172,
  u: 6,
};
const DAMAGE = {
  WEAK: 1.8,
  RESIST: 0.5,
  RESIST_FINAL_BOSS: 0.6,
  LEVEL_SCALE: 0.12,
  HARDEN: 0.5,
};
const DEFENSE = {
  SHIELD: 0.4,
  DEFENDING: 0.5,
  ROCK_SKIN: 0.3,
  BLESSING: 0.9,
  MAX_EQUIP_DEF: 0.6,
  CRIT: 1.6,
  ROCK_REFLECT: 0.25,
  BLIND_MISS_CHANCE: 0.5,
  WEAKEN: 0.6,
};
const RESONANCE = {
  MAX: 100,
  ON_WEAK: 30,
  ON_HIT: 12,
  ON_SKILL: 8,
};
const DELAY = {
  WIN: 650,
  ENEMY_TURN: 800,
  ACTION_TO_ENEMY: 750,
  PLAYER_TURN: 450,
  LOSE: 900,
  SKILL: 800,
  ULTIMATE: 1100,
  REWARD: 1100,
};
const COLORS = {
  HEAL: "#7ad36b",
  MANA: "#7fb6ff",
  DAMAGE_TAKEN: "#ff6b6b",
  CRIT_HIT: "#ffd34d",
  NORMAL_HIT: "#fff",
  BURN: "#ff9a5a",
  POISON: "#c77dff",
  DRAIN: "#b08aff",
};

/** Material que cada monstro pode deixar cair. */
const MONSTER_MATERIAL = {
  lobo: "couro",
  cogumelo: "esporo",
  sapo: "pele",
  espectro: "essencia",
  harpia: "penaH",
  golem: "pedra",
  sentinela: "cristal",
  eco: "cristal",
  livro: "papiro",
  aprendiz: "cristal",
};
const GUARDIAN_ORDER_INDEX = {
  ent: 0,
  serpente: 1,
  grifo: 2,
};
const TUTORIAL_STEPS = [
  "1/5 · Clique em uma RUNA (ou aperte a tecla 1). Runas são os elementos da sua magia.",
  "2/5 · Escolha a mesma runa mais uma vez para um feitiço duplo, mais forte. Depois clique em LANÇAR (Enter).",
  "3/5 · Feitiços gastam MP (barra azul). Agora clique em DEFENDER: você toma metade do dano e recupera mana.",
  "4/5 · Clique em HABILIDADES e use a sua. Cada elemento tem uma habilidade especial.",
  "5/5 · Em ITENS você usa poções no meio da luta. Agora derrote o boneco! Acertar a fraqueza do inimigo dá quase o dobro de dano.",
];
let discTimer = null;

/* ==========================================================================
   UTILITÁRIOS
   ========================================================================== */

const randomBetween = (min, max) => min + Math.random() * (max - min);
const levelScale = () => 1 + DAMAGE.LEVEL_SCALE * (player.lvl - 1);
const isFinalBoss = (enemy) => enemy.special === "final";
const runeNames = (runes) => runes.map((r) => RUNES[r].nome).join(", ");
const petIs = (type) => petOk() && activePet().t === type;
function healPlayer(amount, color = COLORS.HEAL, label = "+" + amount) {
  player.hp = Math.min(maxHp(), player.hp + amount);
  const pc = playerCenter();
  floatText(pc.x, pc.y - 40, label, color);
}
function restoreMana(amount, label = `+${amount} MP`) {
  player.mp = Math.min(maxMp(), player.mp + amount);
  const pc = playerCenter();
  floatText(pc.x, pc.y - 40, label, COLORS.MANA);
}
function damageEnemy(amount, color = COLORS.CRIT_HIT, offsetX = 0, offsetY = 0) {
  battle.e.hp -= amount;
  const ec = enemyCenter();
  floatText(ec.x + offsetX, ec.y - 30 + offsetY, String(amount), color);
}
function addResonance(amount) {
  battle.res = Math.min(RESONANCE.MAX, (battle.res || 0) + amount);
}
function consumeFury() {
  if (battle.fury > 0) battle.fury--;
}
function effectivenessText(mult) {
  if (mult > 1) return " Super eficaz!";
  if (mult < 1) return " Pouco eficaz...";
  return "";
}

/** Termina a ação do jogador: vitória se o inimigo caiu, senão vez do inimigo. */
function finishPlayerAction(delay) {
  setTimeout(() => (battle.e.hp <= 0 ? win() : enemyTurn()), delay);
}

/* ==========================================================================
   POSIÇÕES NA TELA
   ========================================================================== */

function enemyPos() {
  const isSilencer = battle.type === "silenciador";
  const isBig = battle.e.boss || battle.e.eco;
  const u = isSilencer ? 11 : isBig ? 9 : 8;
  return {
    u,
    x: isSilencer ? 370 : 395,
    y: isSilencer || isBig ? 62 : 84,
  };
}
function enemyCenter() {
  const p = enemyPos();
  return {
    x: p.x + 8 * p.u,
    y: p.y + 8 * p.u,
  };
}
function playerCenter() {
  return {
    x: BATTLE_PLAYER_POS.x + 8 * BATTLE_PLAYER_POS.u,
    y: BATTLE_PLAYER_POS.y + 9 * BATTLE_PLAYER_POS.u,
  };
}

/* ==========================================================================
   FRAQUEZAS E RESISTÊNCIAS
   ========================================================================== */

function weakOf(enemy) {
  return isFinalBoss(enemy) ? [enemy.weakNow] : enemy.weak;
}
function resistOf(enemy) {
  return isFinalBoss(enemy) ? ORDER.filter((r) => r !== enemy.weakNow) : enemy.resist;
}
function pickBossWeak(previous) {
  const options = player.runes.filter((r) => r !== previous);
  return options[Math.floor(Math.random() * options.length)] || previous;
}

/**
 * Multiplicador de dano de um elemento contra o inimigo atual.
 * Também registra no bestiário a fraqueza/resistência descoberta.
 */
function elementMultiplier(element, { pierce = false } = {}) {
  const enemy = battle.e;
  const bestiary = player.best[battle.type];
  if (weakOf(enemy).includes(element)) {
    if (!isFinalBoss(enemy) && bestiary && !bestiary.w.includes(element)) bestiary.w.push(element);
    return DAMAGE.WEAK;
  }
  if (!pierce && resistOf(enemy).includes(element)) {
    if (!isFinalBoss(enemy) && bestiary && !bestiary.r.includes(element)) bestiary.r.push(element);
    return isFinalBoss(enemy) ? DAMAGE.RESIST_FINAL_BOSS : DAMAGE.RESIST;
  }
  return 1;
}

/** Calcula um golpe de dano com variação aleatória de ±10%. */
function rollDamage(power, mult, { ignoreHarden = false } = {}) {
  const harden = battle.e.harden > 0 && !ignoreHarden ? DAMAGE.HARDEN : 1;
  return Math.max(1, Math.round(power * levelScale() * mult * randomBetween(0.9, 1.1) * harden));
}

/* ==========================================================================
   INÍCIO DA BATALHA
   ========================================================================== */

/** Ajusta o inimigo conforme a história (Guardiões e chefes especiais). */
function applyStoryAdjustments(enemy, type) {
  if (type in GUARDIAN_ORDER_INDEX) {
    const i = GUARDIAN_ORDER_INDEX[type];
    enemy.weak = [player.order[i]];
    enemy.resist = [player.order[i + 1]];
    enemy.rune = player.order[i + 1];
  }
  if (type === "boneco") enemy.weak = [player.aff];
  if (type === "lider") {
    const freed = guardiansFreed();
    enemy.hp = Math.round(enemy.hp * (1 + freed * 0.45));
    enemy.atk *= 1 + freed * 0.25;
    enemy.xp = Math.round(enemy.xp * (1 + freed * 0.4));
    enemy.weak = [player.order[Math.min(3, freed)] || player.aff];
  }
  if (type === "diretor") {
    enemy.weak = [player.aff];
    enemy.resist = [];
  }
  if (type === "vitral") {
    enemy.weak = [player.order[2] || "fogo"];
    enemy.resist = [player.aff];
  }
}
/* ---- Nível dos monstros ----
 * Antes os monstros tinham sempre a mesma força, enquanto o aprendiz ficava
 * mais forte a cada nível. Agora cada monstro tem um nível: os comuns
 * acompanham o jogador dentro da faixa da região, e os chefes têm um nível
 * mínimo e sobem junto se o jogador treinar demais.
 *   base  = nível para o qual os números de ENEMIES foram feitos
 *   range = faixa de níveis em que o monstro aparece (comuns)
 *   min   = nível mínimo (chefes e Ecos)
 */
const ENEMY_LEVELS = {
  lobo: { base: 1, range: [1, 5] },
  cogumelo: { base: 1, range: [1, 5] },
  sapo: { base: 4, range: [4, 8] },
  espectro: { base: 4, range: [4, 8] },
  harpia: { base: 6, range: [6, 10] },
  golem: { base: 6, range: [6, 10] },
  livro: { base: 8, range: [8, 12] },
  aprendiz: { base: 8, range: [8, 12] },
  sentinela: { base: 9, range: [9, 14] },
  eco: { base: 9, range: [9, 14] },
  ent: { base: 3, min: 4, boss: true },
  serpente: { base: 5, min: 6, boss: true },
  grifo: { base: 6, min: 8, boss: true },
  vitral: { base: 6, min: 8, boss: true },
  diretor: { base: 8, min: 10, boss: true },
  silenciador: { base: 9, min: 12, boss: true },
  lobo_alfa: { base: 4, min: 5, boss: true },
  hidra: { base: 6, min: 7, boss: true },
  roc: { base: 8, min: 9, boss: true },
  quimera: { base: 10, min: 11, boss: true },
  colosso: { base: 12, min: 13, boss: true },
};
/** Quanto cada nível acima da base aumenta vida, ataque e XP. */
const LEVEL_GROWTH = { hp: 0.13, atk: 0.1, xp: 0.1 };

function enemyLevelFor(type) {
  const info = ENEMY_LEVELS[type];
  if (!info) return null;
  if (info.boss) return Math.max(info.min, player.lvl - 1);
  const [lo, hi] = info.range;
  const roll = player.lvl + Math.floor(Math.random() * 3) - 1;
  return Math.max(lo, Math.min(hi, roll));
}
function applyEnemyLevel(enemy, type) {
  if (type === "lider") {
    enemy.lvl = player.lvl + 1;
    return;
  }
  const lvl = enemyLevelFor(type);
  if (lvl == null) return;
  const steps = lvl - ENEMY_LEVELS[type].base;
  enemy.lvl = lvl;
  enemy.hp = Math.round(enemy.hp * (1 + LEVEL_GROWTH.hp * steps));
  enemy.atk *= 1 + LEVEL_GROWTH.atk * steps;
  enemy.xp = Math.round(enemy.xp * (1 + LEVEL_GROWTH.xp * steps));
}
function applyDifficulty(enemy) {
  const diff = difficulty();
  enemy.hp = Math.round(enemy.hp * diff.hp);
  enemy.atk *= diff.atk;
  enemy.xp = Math.round(enemy.xp * diff.xp);
}

/** Aplica tempestade e noite. Retorna se é uma luta noturna. */
function applyEnvironment(enemy, type) {
  const isTraining = type === "boneco";
  if (player.weather === "tempestade" && outdoorTheme(ZONES[player.zone].theme) && !isTraining)
    enemy.atk *= 1.1;
  const night = isNight() && !hasMoon() && !isTraining && !enemy.boss;
  if (night) {
    enemy.hp = Math.round(enemy.hp * 1.25);
    enemy.atk *= 1.35;
    enemy.xp = Math.round(enemy.xp * 1.4);
  }
  return night;
}
function createEnemy(type) {
  const enemy = Object.assign({}, ENEMIES[type]);
  applyStoryAdjustments(enemy, type);
  applyEnemyLevel(enemy, type);
  if (type !== "boneco") applyDifficulty(enemy);
  const night = applyEnvironment(enemy, type);
  return {
    enemy,
    night,
  };
}
function createBattleState(type, mob, enemy, night, isTutorial) {
  return {
    type,
    mob,
    night,
    tut: isTutorial ? 0 : -1,
    panel: null,
    cd: {},
    fury: 0,
    dodge: 0,
    rock: 0,
    regen: 0,
    e: Object.assign({}, enemy, {
      max: enemy.hp,
      burn: 0,
      blind: 0,
      frozen: 0,
      freezeImm: 0,
      weaken: 0,
      harden: 0,
      t: 0,
      phase: 1,
      atkMul: 1,
      weakNow: null,
    }),
    sel: [],
    busy: false,
    shield: 0,
    defending: false,
    poison: 0,
    sealed: {},
    logs: [],
    eshake: 0,
    res: (player.ecos || []).length >= 5 ? RESONANCE.MAX / 2 : 0,
  };
}
function showBattleScreen() {
  game.mode = "battle";
  game.flash = 1;
  game.parts = [];
  game.floats = [];
  game.proj = null;
  byId("screen").classList.add("inbattle");
  byId("battle").style.display = "block";
  playSound(220, 0.1);
  playSound(330, 0.1);
  playSound(440, 0.18);
}
function startBattle(type, mob, opts = {}) {
  if (lifeMode()) {
    say([["", "Sem runas, sem batalha. No Simulador de Vida, a vida já é luta suficiente."]]);
    return;
  }
  const { enemy, night } = createEnemy(type);
  battle = createBattleState(type, mob, enemy, night, opts.tut);
  if (type === "silenciador") battle.e.weakNow = pickBossWeak(null);
  if (!player.best[type])
    player.best[type] = {
      w: [],
      r: [],
    };
  showBattleScreen();
  const bossNote = enemy.boss ? " Um Guardião!" : "";
  const nightNote = night ? " É noite: ele está mais forte!" : "";
  battleLog(`${enemy.nome} aparece!${bossNote}${nightNote}`);
  const strong = ORDER.filter((r) => weatherMark(r) === "up").map((r) => RUNES[r].nome),
    weak = ORDER.filter((r) => weatherMark(r) === "down").map((r) => RUNES[r].nome);
  const listPt = (a) => (a.length > 1 ? a.slice(0, -1).join(", ") + " e " + a[a.length - 1] : a[0] || "");
  if (strong.length || weak.length)
    battleLog(
      `${currentWeather().n}${isNight() ? " à noite" : ""}: ${strong.length ? listPt(strong) + (strong.length > 1 ? " mais fortes" : " mais forte") : ""}${strong.length && weak.length ? "; " : ""}${weak.length ? listPt(weak) + (weak.length > 1 ? " mais fracas" : " mais fraca") : ""}.`,
    );
  renderBattle();
}

/* ==========================================================================
   INTERFACE DA BATALHA
   ========================================================================== */

function battleLog(message) {
  battle.logs.push(message);
  if (battle.logs.length > 2) battle.logs.shift();
  byId("blog").innerHTML = battle.logs
    .map((line, i) => `<div class="${i < battle.logs.length - 1 ? "old" : ""}">${line}</div>`)
    .join("");
}
const chip = (text, color) => `<span class="chip" style="color:${color}">${text}</span>`;
const backButton = '<button data-back="1">Voltar</button>';
function renderEnemyInfo() {
  const enemy = battle.e;
  byId("ename").textContent = enemy.lvl ? `${enemy.nome} · Nv ${enemy.lvl}` : enemy.nome;
  byId("ehp").style.width = Math.max(0, (100 * enemy.hp) / enemy.max) + "%";
  let info = `<span>${Math.max(0, enemy.hp)}/${enemy.max}</span>`;
  if (isFinalBoss(enemy)) {
    const rune = RUNES[enemy.weakNow];
    info += chip(`Vulnerável a ${rune.nome}`, rune.cor);
  } else {
    const known = player.best[battle.type];
    info += chip(`Fraco: ${known.w.length ? runeNames(known.w) : "?"}`, "#ffb3a8");
    if (known.r.length) info += chip(`Resiste: ${runeNames(known.r)}`, "#9aa");
  }
  const statuses = [
    [enemy.burn, "Queimando", "#ff7a3d"],
    [enemy.blind, "Cego", "#ddd"],
    [enemy.frozen, "Congelado", "#9ff0ff"],
    [enemy.weaken, "Enfraquecido", "#e0ab62"],
    [enemy.harden, "Endurecido", "#bbb"],
  ];
  for (const [turns, label, color] of statuses) if (turns > 0) info += chip(label, color);
  byId("einfo").innerHTML = info;
}
function renderItemPanel() {
  const usable = Object.keys(player.inv).filter(
    (id) => (ITEMS[id].tipo === "cons" || ITEMS[id].tipo === "food") && id !== "fenix",
  );
  const buttons = usable.length
    ? usable
        .map(
          (id) =>
            `<button data-it="${id}" ${battle.busy ? "disabled" : ""} title="${ITEMS[id].desc}">${ITEMS[id].nome} ×${itemCount(id)}</button>`,
        )
        .join("")
    : '<span style="color:var(--muted)">Sem itens. Compre no mercado.</span>';
  byId("rbtns").innerHTML = buttons + backButton;
  byId("rbtns")
    .querySelectorAll("[data-it]")
    .forEach((btn) => (btn.onclick = () => useItemBattle(btn.dataset.it)));
}
function renderSkillPanel() {
  const skills = Object.keys(SKILLS).filter(skillUnlocked);
  byId("rbtns").innerHTML =
    skills
      .map((id) => {
        const skill = SKILLS[id];
        const cooldown = battle.cd[id] || 0;
        const disabled = battle.busy || cooldown > 0 || player.mp < skill.mp;
        const cooldownText = cooldown > 0 ? ` (${cooldown})` : "";
        return `<button data-sk="${id}" ${disabled ? "disabled" : ""} title="${skill.desc}">${skill.nome} · ${skill.mp}MP${cooldownText}</button>`;
      })
      .join("") + backButton;
  byId("rbtns")
    .querySelectorAll("[data-sk]")
    .forEach((btn) => (btn.onclick = () => useSkill(btn.dataset.sk)));
}
function renderRunePanel() {
  byId("rbtns").innerHTML = player.runes
    .map((rune, i) => {
      const sealed = !!battle.sealed[rune];
      const picked = battle.sel.filter((r) => r === rune).length;
      const classes = `rbtn ${picked ? "pick" : ""} ${sealed ? "sealed" : ""}`;
      const title = sealed ? "Selada" : RUNES[rune].nome;
      const wm = weatherMark(rune);
      const pct = Math.round((weatherMul(rune) - 1) * 100);
      const tag = wm ? `<span class="wtag ${wm}" title="Clima: ${pct > 0 ? "+" : ""}${pct}%">${wm === "up" ? "▲" : "▼"}${Math.abs(pct)}%</span>` : "";
      return `<button class="${classes}" data-r="${rune}" ${sealed || battle.busy ? "disabled" : ""} title="${title}">${runeSVG(rune, 18)}${RUNES[rune].nome}${picked > 1 ? " ×2" : ""}${tag}<span class="k">${i + 1}</span></button>`;
    })
    .join("");
  byId("rbtns")
    .querySelectorAll("button")
    .forEach((btn) => (btn.onclick = () => pickRune(btn.dataset.r)));
}
function renderActionPanel() {
  if (battle.panel === "items") renderItemPanel();
  else if (battle.panel === "skills") renderSkillPanel();
  else renderRunePanel();
  byId("rbtns")
    .querySelectorAll("[data-back]")
    .forEach(
      (btn) =>
        (btn.onclick = () => {
          battle.panel = null;
          renderBattle();
        }),
    );
  byId("weave").style.display = battle.panel ? "none" : "flex";
}
function renderTutorial() {
  if (battle.tut < 0) {
    byId("tut").style.display = "none";
    return;
  }
  byId("tut").innerHTML = "<b>TUTORIAL DE LUTA · Instrutor Kael</b>" + TUTORIAL_STEPS[battle.tut];
  byId("tut").style.display = "block";
}
function renderSpellPreview() {
  [0, 1].forEach((i) => (byId("s" + i).innerHTML = battle.sel[i] ? runeSVG(battle.sel[i], 18) : ""));
  if (!battle.sel.length) {
    byId("prev").innerHTML = "<small>Escolha 1 ou 2 runas</small>";
    return;
  }
  const key = spellKey(battle.sel);
  const spell = SPELLS[key];
  const known = player.spells.includes(key);
  const stars = known && masteryLv(key) ? " · " + "★".repeat(masteryLv(key)) : "";
  const name = known ? spell.nome : "??? magia esquecida";
  const detail = known ? spellDesc(spell) : "Lance para descobrir";
  byId("prev").innerHTML = `${name} · ${spellCost(key)} MP${stars}<small>${detail}</small>`;
}
function renderActionButtons() {
  const key = battle.sel.length ? spellKey(battle.sel) : null;
  byId("bCast").disabled = battle.busy || !key || player.mp < spellCost(key);
  byId("bClear").disabled = battle.busy || !battle.sel.length;
  byId("bDef").disabled = battle.busy;
  byId("bPot").textContent = battle.panel === "items" ? "Itens ▲" : "Itens";
  byId("bPot").disabled = battle.busy;
  byId("bEth").textContent = battle.panel === "skills" ? "Habilidades ▲" : "Habilidades";
  byId("bEth").disabled = battle.busy;
  byId("bRun").disabled = battle.busy || battle.e.boss || battle.e.eco;
  const resonance = battle.res || 0;
  byId("resb").style.width = resonance + "%";
  byId("bUlt").style.display = resonance >= RESONANCE.MAX ? "inline-block" : "none";
  byId("bUlt").disabled = battle.busy;
}
function renderBattle() {
  renderEnemyInfo();
  renderActionPanel();
  renderTutorial();
  renderSpellPreview();
  renderActionButtons();
}

/* ==========================================================================
   EFEITOS VISUAIS
   ========================================================================== */

function floatText(x, y, txt, col) {
  game.floats.push({
    x,
    y,
    txt,
    col,
    life: 1.1,
  });
}
function burst(x, y, cols, n = 24, sp = 120) {
  for (let i = 0; i < n; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = sp * (0.3 + Math.random());
    game.parts.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 0.6 + Math.random() * 0.4,
      max: 1,
      col: cols[i % cols.length],
      size: 2 + Math.random() * 3,
    });
  }
}
function showDiscovery(spell) {
  const box = byId("disc");
  box.querySelector(".n").textContent = spell.nome;
  box.querySelector(".l").textContent = "“" + spell.lore + "”";
  box.style.display = "block";
  clearTimeout(discTimer);
  discTimer = setTimeout(() => (box.style.display = "none"), 2800);
  playSound(784, 0.12, "sine");
  setTimeout(() => playSound(1047, 0.2, "sine"), 110);
}

/* ==========================================================================
   TURNO DO JOGADOR: FEITIÇOS
   ========================================================================== */

function pickRune(rune) {
  if (!battle || battle.busy || battle.sealed[rune]) return;
  if (battle.sel.length >= 2) battle.sel = [];
  battle.sel.push(rune);
  playSound(600 + ORDER.indexOf(rune) * 120, 0.05);
  if (battle.tut === 0) battle.tut = 1;
  renderBattle();
}
function registerMastery(key, spell) {
  player.mastery = player.mastery || {};
  const before = masteryLv(key);
  player.mastery[key] = (player.mastery[key] || 0) + 1;
  const after = masteryLv(key);
  if (after > before) {
    const msg = `✦ Domínio de ${spell.nome}: nível ${after}! (+${after * 6}% de poder, -${after} de mana)`;
    setTimeout(() => toast(msg, 3200), 900);
  }
}

/** Bêbado, o feitiço pode sair torto. */
function isDrunkMiss() {
  const drunk = player.drunk || 0;
  return drunk > 40 && battle.tut < 0 && Math.random() < Math.min(0.3, drunk / 350);
}
/** Partículas de impacto com a cara de cada elemento. */
function spellImpact(element, x, y) {
  const add = (n, make) => {
    for (let i = 0; i < n; i++) game.parts.push(make(i));
  };
  const color = RUNES[element] ? RUNES[element].cor : "#fff";
  const shapes = {
    fogo: () =>
      add(18, () => ({
        x: x + randomBetween(-30, 30),
        y: y + randomBetween(-10, 20),
        vx: randomBetween(-20, 20),
        vy: randomBetween(-140, -60),
        life: 0.7,
        max: 0.7,
        col: Math.random() < 0.5 ? "#ff7a3d" : "#ffd34d",
        size: 7,
        shape: "flame",
      })),
    agua: () =>
      add(20, (i) => {
        const a = Math.PI + (i / 20) * Math.PI;
        return {
          x,
          y,
          vx: Math.cos(a) * 140,
          vy: Math.sin(a) * 160,
          g: 420,
          life: 0.8,
          max: 0.8,
          col: i % 2 ? "#4fb8ff" : "#bfe8ff",
          size: 5,
          shape: "drop",
        };
      }),
    ar: () =>
      add(14, (i) => ({
        x,
        y,
        vx: 0,
        vy: 0,
        orbit: { cx: x, cy: y, r: 10 + i * 4, a: i, spd: 8 },
        life: 0.7,
        max: 0.7,
        col: "#9ff0cf",
        size: 8,
        shape: "arc",
      })),
    terra: () =>
      add(14, () => ({
        x: x + randomBetween(-20, 20),
        y: y + 20,
        vx: randomBetween(-110, 110),
        vy: randomBetween(-260, -120),
        g: 600,
        life: 0.9,
        max: 0.9,
        col: Math.random() < 0.5 ? "#e0ab62" : "#8a6a3a",
        size: 7,
        shape: "shard",
      })),
    luz: () =>
      add(12, (i) => {
        const a = (i / 12) * Math.PI * 2;
        return {
          x,
          y,
          vx: Math.cos(a) * 30,
          vy: Math.sin(a) * 30,
          ang: a,
          life: 0.5,
          max: 0.5,
          col: "#fff0a0",
          size: 26,
          shape: "ray",
        };
      }),
    sombra: () =>
      add(16, () => ({
        x: x + randomBetween(-30, 30),
        y: y + randomBetween(-20, 30),
        vx: randomBetween(-30, 30),
        vy: randomBetween(-80, -30),
        life: 1,
        max: 1,
        col: Math.random() < 0.5 ? "#6a3aa8" : "#b08aff",
        size: 10,
        shape: "wisp",
      })),
  };
  (shapes[element] || shapes.luz)();
  burst(x, y, [color, "#fff"], 16, 140);
}

function launchProjectile(spell, colors) {
  const start = {
    x: BATTLE_PLAYER_POS.x + 13.5 * BATTLE_PLAYER_POS.u,
    y: BATTLE_PLAYER_POS.y + 3 * BATTLE_PLAYER_POS.u,
  };
  const target = enemyCenter();
  game.proj = {
    x: start.x,
    y: start.y,
    sx: start.x,
    sy: start.y,
    tx: target.x,
    ty: target.y,
    t: 0,
    dur: 0.45,
    cols: colors,
    els: spell.el.length ? spell.el : ["luz"],
    cb: () => {
      for (const el of spell.el.length ? spell.el : ["luz"]) spellImpact(el, target.x, target.y);
      resolveSpell(spell);
      afterPlayer();
    },
  };
}
function playerCast() {
  if (!battle || battle.busy || !battle.sel.length) return;
  const key = spellKey(battle.sel);
  const spell = SPELLS[key];
  const cost = spellCost(key);
  if (player.mp < cost) {
    battleLog("Mana insuficiente para esse feitiço.");
    return;
  }
  battle.busy = true;
  player.mp -= cost;
  battle.curKey = key;
  registerMastery(key, spell);
  if (battle.tut === 1) battle.tut = 2;
  if (isDrunkMiss()) {
    battle.sel = [];
    battleLog("*hic* Você está tão tont" + genderWord("o", "a", "e") + " que o feitiço sai torto e erra!");
    renderBattle();
    setTimeout(afterPlayer, 600);
    return;
  }
  const runesUsed = battle.sel.slice();
  battle.sel = [];
  if (!player.spells.includes(key)) {
    player.spells.push(key);
    showDiscovery(spell);
  }
  renderBattle();
  const colors = runesUsed.map((r) => RUNES[r].cor);
  playSound(500, 0.08, "sawtooth");
  if (spell.heal || spell.shield) {
    const pc = playerCenter();
    burst(pc.x, pc.y, colors, 30, 90);
    setTimeout(() => {
      resolveSpell(spell);
      afterPlayer();
    }, 380);
  } else {
    launchProjectile(spell, colors);
  }
}
function applySpellDamage(spell, messages) {
  const enemy = battle.e;
  const mult = Math.max(...spell.el.map((el) => elementMultiplier(el)));
  const bonus = dmgMul(spell.el) * (1 + 0.06 * masteryLv(battle.curKey || ""));
  consumeFury();
  const hits = spell.hits || 1;
  let total = 0;
  const ec = enemyCenter();
  for (let i = 0; i < hits; i++) {
    const dmg = rollDamage(spell.pow, mult * bonus);
    total += dmg;
    floatText(
      ec.x + (i * 24 - 12 * (hits - 1)),
      ec.y - 30 - i * 14,
      String(dmg),
      mult > 1 ? COLORS.CRIT_HIT : COLORS.NORMAL_HIT,
    );
  }
  enemy.hp -= total;
  battle.eshake = 0.3;
  playSound(mult > 1 ? 180 : 140, 0.15, "square", 0.07);
  addResonance(mult > 1 ? RESONANCE.ON_WEAK : RESONANCE.ON_HIT);
  if (spell.drain || battle.vamp > 0) {
    const absorbed = Math.round(total * (spell.drain ? 0.5 : 0.4));
    healPlayer(absorbed, COLORS.DRAIN);
    messages.push(`Você absorve ${absorbed} HP.`);
    if (battle.vamp > 0 && !spell.drain) battle.vamp--;
  }
  messages.push(`${enemy.nome} sofre ${total} de dano.${effectivenessText(mult)}`);
}
function applySpellStatus(spell, messages) {
  const enemy = battle.e;
  if (spell.burn) {
    enemy.burn = spell.burn;
    messages.push("Está em chamas!");
  }
  if (spell.blind) {
    enemy.blind = spell.blind;
    messages.push("A névoa o cega.");
  }
  if (spell.freeze) {
    const resists = enemy.freezeImm > 0 || (enemy.boss && Math.random() < 0.5);
    if (resists) {
      messages.push("Resiste ao gelo.");
    } else {
      enemy.frozen = 1;
      enemy.freezeImm = 3;
      messages.push("Congelado!");
    }
  }
  if (spell.weaken) {
    enemy.weaken = spell.weaken;
    messages.push("Seus golpes enfraquecem.");
  }
}
function resolveSpell(spell) {
  const messages = [`Você tece ${spell.nome}!`];
  if (spell.heal) {
    const amount = Math.round(spell.heal * (1 + 0.1 * (player.lvl - 1)));
    healPlayer(amount);
    battle.poison = 0;
    messages.push(`Recupera ${amount} HP.`);
  }
  if (spell.shield) {
    battle.shield = spell.shield;
    messages.push("Uma muralha de pedra te protege.");
  }
  if (spell.pow) applySpellDamage(spell, messages);
  if (battle.e.hp > 0) applySpellStatus(spell, messages);
  battleLog(messages.join(" "));
  renderBattle();
}
function afterPlayer() {
  if (battle.e.hp <= 0) return setTimeout(win, DELAY.WIN);
  setTimeout(enemyTurn, DELAY.ENEMY_TURN);
}

/* ==========================================================================
   TURNO DO JOGADOR: AÇÕES, ITENS, HABILIDADES E CANÇÃO ARCANA
   ========================================================================== */

/** Cada ação retorna: false (não fez nada), true (gasta o turno) ou "escaped". */
const ACTIONS = {
  def() {
    battle.defending = true;
    if (battle.tut === 2) battle.tut = 3;
    player.mp = Math.min(maxMp(), player.mp + 6);
    battleLog("Você se concentra e se defende. (+6 MP)");
    const pc = playerCenter();
    burst(pc.x, pc.y, ["#9fd0ff"], 14, 60);
    return true;
  },
  pot() {
    if (player.potions <= 0) return false;
    player.potions--;
    const amount = 45 + player.lvl * 3;
    healPlayer(amount);
    battleLog(`Você bebe uma poção. +${amount} HP.`);
    playSound(660, 0.15, "sine");
    return true;
  },
  eth() {
    if (player.ethers <= 0) return false;
    player.ethers--;
    restoreMana(25);
    battleLog("Você bebe um éter. +25 MP.");
    playSound(760, 0.15, "sine");
    return true;
  },
  run() {
    if (battle.e.boss || battle.e.eco) {
      battleLog("Não dá para fugir deste inimigo!");
      return false;
    }
    if (Math.random() < 0.65) {
      battle.busy = true;
      battleLog("Você escapa!");
      setTimeout(() => endBattle(), 600);
      renderBattle();
      return "escaped";
    }
    battleLog("Não conseguiu fugir!");
    return true;
  },
};
function useAction(kind) {
  if (!battle || battle.busy || !ACTIONS[kind]) return;
  const result = ACTIONS[kind]();
  if (!result || result === "escaped") return;
  battle.busy = true;
  renderBattle();
  setTimeout(enemyTurn, DELAY.ACTION_TO_ENEMY);
}
function useItemBattle(id) {
  if (!battle || battle.busy || !itemCount(id)) return;
  const item = ITEMS[id];
  if (item.tipo === "equip") return;
  battle.busy = true;
  const pc = playerCenter();
  const result = useItemEffect(id);
  const label = item.hp ? "+" + item.hp : item.mp ? `+${item.mp} MP` : "+";
  floatText(pc.x, pc.y - 40, label, COLORS.HEAL);
  burst(pc.x, pc.y, [COLORS.HEAL, "#fff"], 14, 70);
  battleLog(`Você usa ${item.nome}: ${result}.`);
  playSound(660, 0.15, "sine");
  battle.panel = null;
  renderBattle();
  setTimeout(enemyTurn, DELAY.ACTION_TO_ENEMY);
}
function useUltimate() {
  if (!battle || battle.busy || (battle.res || 0) < RESONANCE.MAX) return;
  battle.busy = true;
  battle.res = 0;
  const ec = enemyCenter();
  const power = 22 * player.runes.length * levelScale() * dmgMul(player.runes) * randomBetween(0.95, 1.05);
  const dmg = Math.max(1, Math.round(power));
  battle.e.hp -= dmg;
  battle.eshake = 0.5;
  game.shake = 0.3;
  const heal = Math.round(maxHp() * 0.15);
  healPlayer(heal);
  player.runes.forEach((r, i) =>
    setTimeout(() => burst(ec.x, ec.y, [RUNES[r].cor, "#fff"], 30, 200), i * 90),
  );
  floatText(ec.x, ec.y - 40, String(dmg), "#ffe066");
  [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => playSound(f, 0.25, "triangle", 0.05), i * 110));
  battleLog(`✦ CANÇÃO ARCANA! Todas as suas runas cantam juntas: ${dmg} de dano e +${heal} HP!`);
  renderBattle();
  finishPlayerAction(DELAY.ULTIMATE);
}

/** Habilidade ofensiva dos tomos (Meteoro, Tsunami etc.). Retorna o texto do log. */
function tomeAttack(skill) {
  const enemy = battle.e;
  const mult = elementMultiplier(skill.el, {
    pierce: skill.pierce,
  });
  const bonus = dmgMul([skill.el]);
  const hits = skill.hits || 1;
  let total = 0;
  for (let i = 0; i < hits; i++) {
    const dmg = rollDamage(skill.pow, mult * bonus, {
      ignoreHarden: skill.pierce,
    });
    total += dmg;
    damageEnemy(dmg, mult > 1 ? COLORS.CRIT_HIT : COLORS.NORMAL_HIT, (i - (hits - 1) / 2) * 24, -i * 12);
  }
  battle.eshake = 0.3;
  const ec = enemyCenter();
  burst(ec.x, ec.y, [RUNES[skill.el].cor, "#fff"], 34, 170);
  let text = ` ${total} de dano.${effectivenessText(mult)}`;
  if (enemy.hp > 0) {
    if (skill.burn) {
      enemy.burn = skill.burn;
      text += " Em chamas!";
    }
    if (skill.blind) {
      enemy.blind = skill.blind;
      text += " Cego!";
    }
    if (skill.weaken) {
      enemy.weaken = skill.weaken;
      text += " Enfraquecido!";
    }
    if (skill.freeze) {
      const freezes = isFinalBoss(enemy) ? Math.random() < 0.4 : !enemy.boss || Math.random() < 0.7;
      if (freezes) {
        enemy.frozen = skill.freeze;
        text += ` Congelado por ${skill.freeze} turnos!`;
      } else {
        text += " Resistiu ao gelo.";
      }
    }
  }
  consumeFury();
  return text;
}
function tomeSkill(skill) {
  const pc = playerCenter();
  if (skill.heal) {
    const amount = Math.round(maxHp() * skill.heal);
    healPlayer(amount);
    battle.regen = 3;
    battle.poison = 0;
    burst(pc.x, pc.y, ["#4fb8ff", COLORS.HEAL, "#fff"], 30, 90);
    return ` +${amount} HP e cura por 3 turnos.`;
  }
  if (skill.guard) {
    battle.shield = 3;
    battle.rock = 2;
    burst(pc.x, pc.y, ["#e0ab62", "#8a6a3a"], 30, 90);
    return " Um guardião de pedra se ergue ao seu lado.";
  }
  return tomeAttack(skill);
}

/** Drenar e Eco Arcano: dano direto. */
function directDamageSkill(id) {
  const isEcho = id === "eco";
  const base = isEcho ? 14 * player.runes.length : 20;
  const bonus = dmgMul(isEcho ? player.runes : []);
  const dmg = Math.max(1, Math.round(base * levelScale() * bonus * randomBetween(0.9, 1.1)));
  damageEnemy(dmg);
  battle.eshake = 0.3;
  const ec = enemyCenter();
  const colors = isEcho ? player.runes.map((r) => RUNES[r].cor) : ["#c77dff", COLORS.HEAL];
  burst(ec.x, ec.y, colors, 30, 150);
  let text = ` ${dmg} de dano.`;
  if (!isEcho) {
    const absorbed = Math.round(dmg / 2);
    healPlayer(absorbed);
    text += ` Você absorve ${absorbed} HP.`;
  }
  consumeFury();
  return text;
}
function burstOnPlayer(colors, count, speed) {
  const pc = playerCenter();
  burst(pc.x, pc.y, colors, count, speed);
}

/** Efeito de cada habilidade. Retorna o texto extra do log. */
const SKILL_EFFECTS = {
  furia() {
    battle.fury = 2;
    burstOnPlayer(["#ff7a3d", "#ffd34d"], 26, 90);
    return " Seus próximos 2 feitiços ficam muito mais fortes.";
  },
  mare() {
    const amount = Math.round(maxHp() * 0.15);
    healPlayer(amount);
    battle.regen = 3;
    battle.poison = 0;
    burstOnPlayer(["#4fb8ff", "#fff"], 26, 90);
    return ` +${amount} HP e cura por 3 turnos.`;
  },
  passo() {
    battle.dodge = 2;
    burstOnPlayer(["#9ff0cf", "#fff"], 26, 120);
    return " Você vai esquivar dos próximos 2 ataques.";
  },
  radiante() {
    const amount = Math.round(maxHp() * 0.2);
    healPlayer(amount, "#fff0a0");
    battle.shield = Math.max(battle.shield, 2);
    battle.poison = 0;
    burstOnPlayer(["#fff0a0", "#fff"], 30, 90);
    return ` +${amount} HP e um escudo de luz.`;
  },
  manto() {
    battle.vamp = 2;
    burstOnPlayer(["#b08aff", "#3a2a5a"], 30, 90);
    return " Sombras envolvem seus próximos ataques.";
  },
  rocha() {
    battle.rock = 2;
    burstOnPlayer(["#e0ab62", "#8a6a3a"], 26, 80);
    return " Sua pele vira pedra por 2 turnos.";
  },
  meditar() {
    const amount = Math.round(maxMp() * 0.4);
    restoreMana(amount);
    return ` +${amount} MP.`;
  },
  drenar: () => directDamageSkill("drenar"),
  eco: () => directDamageSkill("eco"),
};

/** Analisar não gasta o turno: só revela fraquezas e resistências. */
function analyzeEnemy(skill) {
  const enemy = battle.e;
  const known = player.best[battle.type];
  if (!isFinalBoss(enemy)) {
    known.w = enemy.weak.slice();
    known.r = enemy.resist.slice();
  }
  const detail = isFinalBoss(enemy)
    ? ` Agora ele é vulnerável a ${RUNES[enemy.weakNow].nome}.`
    : ` Fraco: ${runeNames(enemy.weak) || "nada"}. Resiste: ${runeNames(enemy.resist) || "nada"}.`;
  battleLog(`Você usa ${skill.nome}!${detail}`);
  playSound(880, 0.1, "sine");
  renderBattle();
}
function useSkill(id) {
  if (!battle || battle.busy) return;
  const skill = SKILLS[id];
  if (!skillUnlocked(id) || (battle.cd[id] || 0) > 0 || player.mp < skill.mp) return;
  player.mp -= skill.mp;
  battle.cd[id] = skill.cd + 1;
  addResonance(RESONANCE.ON_SKILL);
  if (battle.tut === 3) battle.tut = 4;
  if (id === "analisar") return analyzeEnemy(skill);
  const effect = SKILL_EFFECTS[id] || (skill.tome ? () => tomeSkill(skill) : () => "");
  const extraText = effect();
  battle.busy = true;
  battle.panel = null;
  playSound(520, 0.12, "triangle");
  battleLog(`Você usa ${skill.nome}!${extraText}`);
  renderBattle();
  finishPlayerAction(DELAY.SKILL);
}

/* ==========================================================================
   TURNO DO INIMIGO
   ========================================================================== */

/** Aplica dano ao jogador considerando todas as defesas. Retorna o dano causado. */
function hitPlayer(base, label, messages) {
  const enemy = battle.e;
  if (enemy.blind > 0 && Math.random() < DEFENSE.BLIND_MISS_CHANCE) {
    messages.push(`${enemy.nome} erra, cego pela névoa!`);
    return 0;
  }
  if (battle.dodge > 0) {
    battle.dodge--;
    messages.push("Você esquiva com o Passo do Vento!");
    return 0;
  }
  const raw = base * randomBetween(0.85, 1.15) * (enemy.weaken > 0 ? DEFENSE.WEAKEN : 1) * enemy.atkMul;
  let dmg = raw;
  if (battle.shield > 0) dmg *= DEFENSE.SHIELD;
  if (battle.defending) dmg *= DEFENSE.DEFENDING;
  dmg *= 1 - Math.min(DEFENSE.MAX_EQUIP_DEF, equipStat("def"));
  if (battle.rock > 0) dmg *= DEFENSE.ROCK_SKIN;
  if (player.blessDay === player.day) dmg *= DEFENSE.BLESSING;
  const isTraining = battle.tut >= 0 || battle.type === "boneco";
  if (!isTraining && Math.random() < difficulty().crit) {
    dmg *= DEFENSE.CRIT;
    messages.push("Golpe crítico!");
  }
  dmg = Math.max(1, Math.round(dmg));
  if (isTraining) dmg = Math.max(1, Math.min(dmg, player.hp - 5));
  player.hp -= dmg;
  game.shake = 0.25;
  if (battle.rock > 0) {
    const reflected = Math.max(1, Math.round(raw * DEFENSE.ROCK_REFLECT));
    enemy.hp -= reflected;
    messages.push(`A Pele de Rocha reflete ${reflected}.`);
  }
  const pc = playerCenter();
  floatText(pc.x, pc.y - 40, String(dmg), COLORS.DAMAGE_TAKEN);
  burst(pc.x, pc.y, ["#fff", enemy.cor], 10, 80);
  playSound(110, 0.12, "square", 0.07);
  messages.push(`${label} causa ${dmg} de dano.`);
  return dmg;
}
function drainMana(max, messages, describe = (n) => `(-${n} MP)`) {
  const amount = Math.min(player.mp, max);
  player.mp -= amount;
  messages.push(describe(amount));
}
function sealRune(messages) {
  const available = player.runes.filter((r) => !battle.sealed[r]);
  if (available.length <= 1) return false;
  const rune = available[Math.floor(Math.random() * available.length)];
  battle.sealed[rune] = 3;
  battle.sel = battle.sel.filter((r) => r !== rune);
  messages.push(`${battle.e.nome} sela a Runa ${RUNES[rune].nome}!`);
  playSound(90, 0.3, "sawtooth");
  return true;
}

/** O mascote ajuda na luta. Retorna true se o inimigo morreu. */
function applyPetAssist(messages) {
  if (!petOk() || battle.tut >= 0) return false;
  const pet = activePet();
  const enemy = battle.e;
  if (pet.t === "cao" && Math.random() < 0.28) {
    const dmg = 6 + player.lvl * 2;
    damageEnemy(dmg, "#f2c14e");
    battle.eshake = 0.2;
    messages.push(`${pet.name} morde ${enemy.nome}! (${dmg})`);
    if (enemy.hp <= 0) return true;
  }
  if (pet.t === "gato") player.mp = Math.min(maxMp(), player.mp + 3);
  if (pet.t === "coruja" && !enemy.blind && Math.random() < 0.15) {
    enemy.blind = 1;
    messages.push(`${pet.name} dá um rasante e cega ${enemy.nome}!`);
  }
  return false;
}

/** Dano da queimadura. Retorna true se o inimigo morreu. */
function applyBurn(messages) {
  const enemy = battle.e;
  if (enemy.burn <= 0) return false;
  const dmg = 5 + player.lvl;
  enemy.burn--;
  damageEnemy(dmg, COLORS.BURN);
  battle.eshake = 0.2;
  messages.push(`${enemy.nome} queima (${dmg}).`);
  return enemy.hp <= 0;
}

/** Fases e golpes especiais do Silenciador. Retorna true se ele já agiu. */
function finalBossTurn(messages) {
  const enemy = battle.e;
  if (enemy.phase === 1 && enemy.hp < enemy.max * 0.5) {
    enemy.phase = 2;
    enemy.atkMul = 1.3;
    messages.push('"Não... Se libertar a magia, ela desaparecerá novamente!" O poder do Silenciador cresce.');
  }
  if (enemy.t % 3 === 0) {
    enemy.weakNow = pickBossWeak(enemy.weakNow);
    messages.push(`A máscara muda de cor: agora é vulnerável a ${RUNES[enemy.weakNow].nome}!`);
  }
  if (enemy.frozen > 0) return false;
  if (enemy.t % 4 === 0) return sealRune(messages);
  if (Math.random() < 0.25) {
    hitPlayer(enemy.atk * 0.8, "Uma Onda de Silêncio", messages);
    drainMana(8, messages);
    return true;
  }
  return false;
}

/** Golpe especial de cada tipo de inimigo. Cada um retorna true se agiu. */
const ENEMY_SPECIALS = {
  poison(enemy, roll, messages) {
    if (roll >= 0.3) return false;
    hitPlayer(enemy.atk * 0.6, `${enemy.nome} solta esporos e`, messages);
    battle.poison = 3;
    messages.push("O veneno corre em suas veias.");
    return true;
  },
  drain(enemy, roll, messages) {
    if (roll >= 0.3) return false;
    hitPlayer(enemy.atk * 0.7, `${enemy.nome} atravessa você e`, messages);
    drainMana(8, messages, (n) => `Drena ${n} MP.`);
    return true;
  },
  harden(enemy, roll, messages) {
    if (roll >= 0.25 || enemy.harden > 0) return false;
    enemy.harden = 2;
    messages.push(`${enemy.nome} endurece a pele de pedra!`);
    return true;
  },
  root(enemy, roll, messages) {
    if (roll >= 0.3) return false;
    hitPlayer(enemy.atk * 0.8, "Raízes prendem você e", messages);
    drainMana(6, messages);
    return true;
  },
  regen(enemy, roll, messages) {
    if (enemy.hp >= enemy.max * 0.5 || roll >= 0.4) return false;
    const amount = 22;
    enemy.hp = Math.min(enemy.max, enemy.hp + amount);
    const ec = enemyCenter();
    floatText(ec.x, ec.y - 30, "+" + amount, COLORS.HEAL);
    messages.push(`${enemy.nome} se envolve em névoa e regenera ${amount} HP.`);
    return true;
  },
  double(enemy, roll, messages) {
    if (roll >= 0.35) return false;
    hitPlayer(enemy.atk * 0.7, `${enemy.nome} ataca duas vezes:`, messages);
    hitPlayer(enemy.atk * 0.7, "e de novo", messages);
    return true;
  },
  seal(enemy, roll, messages) {
    return roll < 0.3 && sealRune(messages);
  },
};
function enemyAttack(messages) {
  const enemy = battle.e;
  const special = ENEMY_SPECIALS[enemy.special];
  const acted = special ? special(enemy, Math.random(), messages) : false;
  if (!acted) hitPlayer(enemy.atk, `${enemy.nome} ataca e`, messages);
}

/** Reduz a duração de todos os efeitos no fim do turno. */
function tickStatusEffects() {
  const enemy = battle.e;
  for (const key of ["blind", "weaken", "harden", "freezeImm"]) if (enemy[key] > 0) enemy[key]--;
  if (battle.shield > 0) battle.shield--;
  if (battle.rock > 0) battle.rock--;
  for (const rune in battle.sealed) {
    battle.sealed[rune]--;
    if (battle.sealed[rune] <= 0) delete battle.sealed[rune];
  }
}
function endTurnWithVictory(messages) {
  battleLog(messages.join(" "));
  renderBattle();
  setTimeout(win, DELAY.WIN);
}
function enemyTurn() {
  const enemy = battle.e;
  enemy.t++;
  const messages = [];
  if (applyPetAssist(messages) || applyBurn(messages)) return endTurnWithVictory(messages);
  const alreadyActed = isFinalBoss(enemy) && finalBossTurn(messages);
  if (enemy.frozen > 0) {
    enemy.frozen--;
    messages.push(`${enemy.nome} está congelado e não age!`);
  } else if (!alreadyActed) {
    enemyAttack(messages);
  }
  tickStatusEffects();
  battleLog(messages.join(" "));
  renderBattle();
  if (enemy.hp <= 0) return setTimeout(win, 700);
  if (player.hp <= 0) return setTimeout(lose, DELAY.LOSE);
  setTimeout(startPlayerTurn, DELAY.PLAYER_TURN);
}
function startPlayerTurn() {
  if (!battle) return;
  battle.defending = false;
  player.mp = Math.min(maxMp(), player.mp + difficulty().mpr);
  for (const id in battle.cd) if (battle.cd[id] > 0) battle.cd[id]--;
  const elfBlessing = player.elfBless === player.day ? 3 : 0;
  const regenAmount = equipStat("regen") + elfBlessing + (battle.regen > 0 ? Math.round(maxHp() * 0.15) : 0);
  if (battle.regen > 0) battle.regen--;
  if (regenAmount > 0 && player.hp < maxHp()) healPlayer(regenAmount);
  if (battle.poison > 0) {
    player.hp -= 4;
    battle.poison--;
    const pc = playerCenter();
    floatText(pc.x, pc.y - 40, "4", COLORS.POISON);
    battleLog("O veneno arde (4).");
    if (player.hp <= 0) return setTimeout(lose, 700);
  }
  battle.busy = false;
  renderBattle();
}

/* ==========================================================================
   FIM DA BATALHA
   ========================================================================== */

function endBattle() {
  player.liquidCourage = false;
  byId("tut").style.display = "none";
  byId("battle").style.display = "none";
  byId("screen").classList.remove("inbattle");
  byId("disc").style.display = "none";
  game.mode = "world";
  game.grace = 1.5;
  battle = null;
  game.parts = [];
  game.floats = [];
}

/** Soma XP e retorna a lista de níveis alcançados. */
function gainXP(xp) {
  player.xp += xp;
  const levelsGained = [];
  while (player.xp >= xpToNextLevel(player.lvl)) {
    player.xp -= xpToNextLevel(player.lvl);
    player.lvl++;
    player.basehp += 15;
    player.basemp += 6;
    player.hp = maxHp();
    player.mp = maxMp();
    levelsGained.push(player.lvl);
  }
  return levelsGained;
}
function playVictoryJingle() {
  playSound(523, 0.1, "sine");
  setTimeout(() => playSound(659, 0.1, "sine"), 100);
  setTimeout(() => playSound(784, 0.2, "sine"), 200);
}
function winTraining() {
  const isFirstTime = battle.tut >= 0;
  battleLog("O boneco cai! Treino concluído.");
  playSound(659, 0.1, "sine");
  setTimeout(() => {
    endBattle();
    player.hp = Math.max(player.hp, Math.round(maxHp() * 0.6));
    if (!isFirstTime) return toast("Treino concluído!");
    player.flags.treino = true;
    player.gold += 30;
    addItem("pocao", 2);
    saveGame();
    say([
      [
        "Instrutor Kael",
        "Muito bem! Lembre: escolha runas, combine elementos, defenda quando a mana acabar e use itens quando precisar.",
      ],
      [
        "Instrutor Kael",
        "Tome 30 de ouro e 2 poções. Agora passe no mercado: a viagem é longa, e você vai sentir fome e sede.",
      ],
      [
        "Instrutor Kael",
        "Ah, e se quiser conhecer outras vilas, as placas de estrada e o Estábulo levam você de carruagem a Porto Brisamar e Pedravale.",
      ],
    ]);
  }, 900);
}

/** Ouro, itens e materiais. Retorna o texto das recompensas. */
function grantLoot(enemy, type) {
  let text = "";
  const goldMult = difficulty().gold * (battle.night ? 1.4 : 1) * (petIs("coelho") ? 1.15 : 1);
  const gold = Math.round(enemy.xp * 0.9 * goldMult) + Math.floor(Math.random() * 6);
  player.gold += gold;
  text += ` +${gold} de ouro.`;
  if (petIs("cao") && Math.random() < 0.22) {
    const found = 8 + Math.floor(Math.random() * 18);
    player.gold += found;
    text += ` ${activePet().name} farejou mais ${found} de ouro!`;
  }
  if (!enemy.boss && Math.random() < 0.2) {
    const item = Math.random() < 0.6 ? "pocao" : Math.random() < 0.5 ? "eter" : "maca";
    addItem(item);
    text += ` Encontrou: ${ITEMS[item].nome}!`;
  }
  const material = MONSTER_MATERIAL[type];
  if (material && Math.random() < 0.45) {
    addItem(material);
    text += ` +${ITEMS[material].nome}.`;
  }
  if (!enemy.boss && Math.random() < (battle.night ? 0.12 : 0.07)) {
    addItem("fragmento");
    text += " ✦ Fragmento Arcano!";
  }
  return text;
}
function progressHuntJobs(type) {
  let text = "";
  for (const job of player.jobs) {
    if (job.type === "hunt" && job.enemy === type && job.prog < job.n) {
      job.prog++;
      text += ` (Trabalho ${job.prog}/${job.n})`;
    }
  }
  return text;
}
function rewardCorruptedEcho(enemy, type) {
  player.ecos = player.ecos || [];
  if (player.ecos.includes(type)) return;
  player.ecos.push(type);
  player.basehp += 12;
  player.basemp += 6;
  player.hp = Math.min(maxHp(), player.hp + 12);
  addItem("fragmento", 2);
  saveGame();
  const lines = [
    ["", `A magia presa no ${enemy.nome} se liberta numa explosão de luz!`],
    [
      "",
      `Selo da Canção ${player.ecos.length}/5: +12 HP máximo, +6 MP máximo e +5% de dano para sempre. Você também recebeu 2 Fragmentos Arcanos.`,
    ],
  ];
  if (player.ecos.length === 5) {
    lines.push([
      "",
      "Todos os Ecos Corrompidos foram libertados! A Canção Arcana ressoa mais forte em você: a Canção Arcana da batalha começa com metade da ressonância.",
    ]);
  }
  say(lines);
}
function announceLevelUp() {
  const newSkill = Object.keys(SKILLS).find((id) => !SKILLS[id].el && SKILLS[id].lvl === player.lvl);
  const skillText = newSkill ? ` Nova habilidade: ${SKILLS[newSkill].nome}!` : "";
  toast(`Nível ${player.lvl}! HP e MP aumentaram.${skillText}`, 3500);
}
function maybeInjure(enemy) {
  if (enemy.boss || player.injured || player.hp >= maxHp() * 0.2 || Math.random() >= 0.5) return;
  player.injured = true;
  player.hp = Math.min(player.hp, maxHp());
  say([
    ["", "Você saiu da luta gravemente ferido! Seu HP máximo caiu pela metade."],
    ["", "Procure a Curandeira Maíra no hospital da vila (ou use Ervas Medicinais)."],
  ]);
}
function rewardStainedGlass() {
  const rune = missingRune(5);
  if (rune) player.runes.push(rune);
  player.flags.vitral = true;
  player.gold += 120;
  saveGame();
  say([
    ["Espírito do Vitral", "Você é digno... Leve o que eu guardei por trezentos anos."],
    ["Padre Anselmo", "Pela luz! O vitral voltou a brilhar!"],
    [
      "",
      rune
        ? `Você recuperou a Runa ${RUNE_OF[rune]}! Novas combinações disponíveis.`
        : "Você recebeu 120 de ouro.",
    ],
  ]);
}
function rewardSpectralDirector() {
  const rune = missingRune(4);
  if (rune) {
    player.runes.push(rune);
    const msg = `Uma runa escondida no cetro do Diretor desperta: você recuperou a Runa ${RUNE_OF[rune]}!`;
    setTimeout(() => say([["", msg]]), 300);
  }
  player.guards.push("escola");
  player.gold += 150;
  addItem("cajadoDir");
  addItem("fragmento", 2);
  const tome = Object.keys(SKILLS).find(
    (k) => SKILLS[k].tome && SKILLS[k].el === player.aff && !player.tomes.includes(k),
  );
  if (tome) player.tomes.push(tome);
  saveGame();
  say([
    ["Diretor Espectral", "...os alunos... finalmente... silêncio..."],
    ["Professora Selene", "Você o libertou. Leve o cajado dele: ele ensinou gerações com essa relíquia."],
    [
      "",
      "Você recebeu: Cajado do Diretor, 2 Fragmentos Arcanos e 150 de ouro!" +
        (tome ? ` E aprendeu ${SKILLS[tome].nome}!` : ""),
    ],
  ]);
}
function rewardGuardian(enemy, type) {
  player.guards.push(player.zone);
  player.runes.push(enemy.rune);
  addItem(GUARD_DROP[type]);
  const lines = GUARD_POST(type);
  if (player.runes.length === 4)
    lines.push(["", "Ao longe, ao sul de Cinzaluz, algo se rompe com um estalo."]);
  say(lines, saveGame);
}
function applyPostBattleRewards(enemy, type, mob, levelsGained) {
  endBattle();
  if (mob) game.mobs = game.mobs.filter((m) => m !== mob);
  if (enemy.eco) rewardCorruptedEcho(enemy, type);
  if (levelsGained.length) announceLevelUp();
  maybeInjure(enemy);
  if (type === "vitral") rewardStainedGlass();
  else if (type === "diretor") rewardSpectralDirector();
  else if (enemy.boss) rewardGuardian(enemy, type);
  saveGame();
  checkRaid();
}
function win() {
  if (battle.done) return;
  battle.done = true;
  const { e: enemy, type, mob } = battle;
  if (type === "silenciador") {
    endBattle();
    playSound(523, 0.3, "sine");
    say(FINALE, startEpilogue);
    return;
  }
  if (type === "boneco") return winTraining();
  const levelsGained = gainXP(Math.round(enemy.xp * (petIs("coruja") ? 1.1 : 1)));
  const rewards = grantLoot(enemy, type) + progressHuntJobs(type);
  player.food = Math.max(0, player.food - 2);
  player.water = Math.max(0, player.water - 3);
  battleLog(`${enemy.nome} foi derrotado! +${enemy.xp} XP.${rewards}`);
  playVictoryJingle();
  setTimeout(() => applyPostBattleRewards(enemy, type, mob, levelsGained), DELAY.REWARD);
}
function reviveWithPhoenix() {
  removeItem("fenix");
  player.hp = Math.round(maxHp() / 2);
  const pc = playerCenter();
  burst(pc.x, pc.y, ["#ff7a3d", "#ffd34d", "#fff"], 40, 140);
  floatText(pc.x, pc.y - 40, "+" + player.hp, "#ffd34d");
  battleLog("A Pena da Fênix queima em suas mãos e você renasce das cinzas!");
  playSound(523, 0.2, "sine");
  setTimeout(() => playSound(1047, 0.3, "sine"), 150);
  battle.busy = false;
  renderBattle();
  saveGame();
}
function wakeUpAtHospital() {
  endBattle();
  const lostGold = Math.floor(player.gold * 0.25);
  player.gold -= lostGold;
  player.injured = true;
  player.food = Math.max(player.food, 20);
  player.water = Math.max(player.water, 20);
  const [hx, hy] = npcPos("curandeira");
  player.zone = "vila";
  player.x = hx;
  player.y = hy + 1;
  player.dir = "up";
  player.hp = maxHp();
  player.mp = maxMp();
  game.fade = 1;
  enterZone();
  saveGame();
  const goldNote = lostGold ? ` e perdeu ${lostGold} de ouro pelo caminho` : "";
  say([
    ["", "A escuridão te envolve... Alguém te encontrou e te carregou até Cinzaluz."],
    [
      "Curandeira Maíra",
      `Você chegou muito machucado ao hospital${goldNote}. Seus ferimentos são graves: fale comigo para tratá-los.`,
    ],
  ]);
}
function lose() {
  if (battle && itemCount("fenix") && !battle.done) return reviveWithPhoenix();
  battleLog("Você caiu...");
  setTimeout(wakeUpAtHospital, DELAY.LOSE);
}

/* ==========================================================================
   TELA FINAL
   ========================================================================== */

function showEnd() {
  game.mode = "end";
  player.finished = true;
  saveGame();
  game.ep = null;
  game.sparkle = 0;
  byId("hud").innerHTML = "";
  hudCache = "";
  const seconds = Math.floor(player.playtime);
  const minutes = Math.floor(seconds / 60);
  const secs = String(seconds % 60).padStart(2, "0");
  const totalSpells = Object.keys(SPELLS).length;
  const completed = player.spells.length >= totalSpells && player.pages.length === 5;
  const ending = completed
    ? "<b>Final completo: você reescreveu o Grimório inteiro.</b>"
    : "Ainda há magias e páginas esquecidas por aí.";
  byId("estats").innerHTML = [
    `Tempo: <b>${minutes}:${secs}</b>`,
    `Nível final: <b>${player.lvl}</b>`,
    `Magias recuperadas: <b>${player.spells.length}/${totalSpells}</b>`,
    `Páginas encontradas: <b>${player.pages.length}/5</b>`,
    ending,
  ].join("<br>");
  byId("end").style.display = "flex";
}
