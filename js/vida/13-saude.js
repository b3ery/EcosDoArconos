/**
 * ECOS DO ARCANO — 13-saude.js
 * Saúde:
 *  - Nos dois modos: comer frutas silvestres ou beber água de rio/fonte
 *    pode causar intoxicação.
 *  - No Simulador de Vida: doenças (gripe, disenteria, febre e peste),
 *    com causas, sintomas e tratamento.
 */

"use strict";

/* ===================== DOENÇAS ===================== */

/**
 * hours: quanto dura sem tratamento (null = só passa com tratamento).
 * drain: perdas por segundo de jogo (vida, energia, diversão, fome, sede).
 * cure: o que cura (itens) e se a Curandeira resolve.
 */
const SICKNESSES = {
  intox: {
    n: "Intoxicado",
    icon: "skull",
    color: "#9ad36b",
    hours: 8,
    drain: { hp: 0.05, food: 0.15, water: 0.2 },
    pay: 0.8,
    cureItems: ["ervas", "cha", "remedio"],
    desc: "Comida ou água estragada. Passa sozinho em algumas horas; Chá de Ervas, Ervas Medicinais ou Xarope curam.",
  },
  gripe: {
    n: "Gripado",
    icon: "snow",
    color: "#7fd0ff",
    hours: 30,
    drain: { energy: 0.08, fun: 0.05 },
    pay: 0.75,
    cureItems: ["cha", "remedio"],
    desc: "Pegou chuva ou frio cansado. Descanse, tome chá ou xarope.",
  },
  disenteria: {
    n: "Disenteria",
    icon: "meh",
    color: "#c9a04a",
    hours: 24,
    drain: { hp: 0.04, water: 0.3, hygiene: 0.15 },
    pay: 0.6,
    cureItems: ["remedio", "ervas"],
    desc: "Falta de higiene. Beba água limpa, tome banho e use xarope ou ervas.",
  },
  febre: {
    n: "Com febre",
    icon: "anger",
    color: "#ff7a7a",
    hours: 20,
    drain: { energy: 0.12, hp: 0.03 },
    pay: 0.5,
    cureItems: ["remedio"],
    desc: "Febre forte. Durma bastante e tome xarope.",
  },
  peste: {
    n: "Com peste",
    icon: "skull",
    color: "#b08aff",
    hours: null,
    drain: { hp: 0.06, energy: 0.1, fun: 0.08 },
    pay: 0.3,
    cureItems: [],
    desc: "Doença grave dos tempos de guerra. Só a Curandeira cura. Não espere!",
  },
};

Object.assign(ITEMS, {
  frutaS: {
    nome: "Frutas Silvestres",
    tipo: "food",
    preco: 2,
    food: 20,
    water: 8,
    desc: "Colhidas no mato. Matam a fome... mas às vezes fazem mal (chance de intoxicação).",
  },
  remedio: {
    nome: "Xarope de Ervas",
    tipo: "cons",
    preco: 30,
    desc: "Cura intoxicação, gripe, disenteria e febre.",
  },
});
SHOPS.bruno.items.push("remedio");
ITEM_ICONS.frutaS = "apple";
ITEM_ICONS.remedio = "potionB";

function sickness() {
  return player.sick ? SICKNESSES[player.sick.id] : null;
}
function getSick(id) {
  if (player.sick) return;
  const s = SICKNESSES[id];
  player.sick = { id, until: s.hours ? absMinutes() + s.hours * 60 : null };
  saveGame();
  playSound(180, 0.25, "triangle");
  toast(`Você está ${s.n.toLowerCase()}! ${s.desc}`, 5200);
}
function cureSickness(why) {
  const s = sickness();
  if (!s) return;
  player.sick = null;
  saveGame();
  playSound(784, 0.15, "sine");
  toast(`${why || "Você melhorou!"} Não está mais ${s.n.toLowerCase()}.`, 3200);
}
/** Sintomas a cada quadro e cura pelo tempo. */
function sicknessTick(dt) {
  const s = sickness();
  if (!s || game.mode !== "world") return;
  if (player.sick.until && absMinutes() >= player.sick.until) return cureSickness("O mal-estar passou.");
  const k = dt * timeSpeed();
  const d = s.drain;
  if (d.hp) player.hp = Math.max(1, player.hp - d.hp * k);
  if (d.food) player.food = Math.max(0, player.food - d.food * k);
  if (d.water) player.water = Math.max(0, player.water - d.water * k);
  if (lifeMode()) {
    if (d.energy) addNeed("energy", -d.energy * k);
    if (d.fun) addNeed("fun", -d.fun * k);
    if (d.hygiene) addNeed("hygiene", -d.hygiene * k);
  }
  player.hp = Math.round(player.hp * 100) / 100;
}
/** Remédios curam a doença certa. Retorna o texto do efeito. */
function medicineEffect(id) {
  const s = sickness();
  if (!s) return "";
  if (s.cureItems.includes(id) && (id !== "cha" || Math.random() < 0.6)) {
    player.sick = null;
    return `você não está mais ${s.n.toLowerCase()}`;
  }
  return id === "cha" && s.cureItems.includes(id) ? "o chá aliviou, mas ainda não curou" : "";
}
/** Doenças do Simulador: chance todo dia, conforme o jeito que você vive. */
function dailySicknessRoll() {
  if (!lifeMode() || player.sick) return;
  const wet = ["chuva", "neve", "tempestade"].includes(player.weather);
  const odds = [
    ["gripe", (wet ? 0.08 : 0.02) + (lifeNeed("energy") < 30 ? 0.06 : 0)],
    ["disenteria", lifeNeed("hygiene") < 30 ? 0.1 : 0.01],
    ["febre", 0.02 + (playerAge() > 60 ? 0.04 : 0)],
    ["peste", kingdomAtWar(kingdomOf(player.zone)) ? 0.03 : 0],
  ];
  for (const [id, p] of odds)
    if (Math.random() < p) {
      setTimeout(() => getSick(id), 3000);
      return;
    }
}
/** Pagamento menor quando doente. */
function sickPayMul() {
  const s = sickness();
  return s ? s.pay : 1;
}

/* ===================== COMIDA E ÁGUA SUSPEITAS ===================== */

const RISK = { rio: 0.15, fonte: 0.08, frutaS: 0.25 };
function riskyIntake(kind) {
  if (Math.random() < RISK[kind]) setTimeout(() => getSick("intox"), 1800);
}
/** Árvores do bosque e do pântano dão frutas silvestres (uma vez por dia cada). */
function forageLabel(x, y) {
  const z = ZONES[player.zone];
  if (!["bosque", "pantano"].includes(z.theme)) return null;
  if (tileAt(player.zone, x, y) !== "#" || !innerTile(x, y)) return null;
  if ((game.foraged || {})[`${player.zone},${x},${y}`] === player.day) return null;
  return (tileHash(x, y) * 7) % 1 < 0.35 ? "Colher frutas silvestres" : null;
}
function forageInteract(x, y) {
  if (!forageLabel(x, y)) return false;
  game.foraged = game.foraged || {};
  game.foraged[`${player.zone},${x},${y}`] = player.day;
  const n = 1 + Math.floor(Math.random() * 3);
  addItem("frutaS", n);
  game.bubbles.push({ x, y, icon: "apple", t: 1.2 });
  playSound(660, 0.06, "sine");
  toast(`Você colheu ${n} Frutas Silvestres. Cuidado: algumas fazem mal!`, 2400);
  return true;
}

/* ===================== CURANDEIRA ===================== */

function sickHealerItems() {
  const s = sickness();
  if (!s) return [];
  const cost = s === SICKNESSES.peste ? 80 : 25;
  return [
    {
      t: `Tratar: ${s.n} (${withTax(cost)} ouro)`,
      fn: () => {
        if (player.gold < withTax(cost)) return say([["Curandeira Maíra", "Sem ouro para o tratamento... volte quando tiver. E rápido!"]]);
        payWithTax(cost);
        cureSickness("A Curandeira Maíra preparou um tratamento.");
      },
    },
  ];
}
