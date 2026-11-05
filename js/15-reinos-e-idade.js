/**
 * ECOS DO ARCANO — 15-reinos-e-idade.js
 * Só no Simulador de Vida:
 *  - Idade: cada dia do jogo é um ano. Você envelhece, e um dia a vida acaba.
 *    Se tiver um filho adulto, ele herda tudo e você continua jogando com ele.
 *  - Reinos: cada vila pertence a um reino. As relações mudam todo dia,
 *    e podem virar guerra (fronteiras fechadas, imposto de guerra, alistamento).
 */

"use strict";

/* ===================== IDADE ===================== */

const START_AGE = 18;
function playerAge() {
  return player.age ?? START_AGE;
}
function lifeStage() {
  const a = playerAge();
  return a < 30 ? "Jovem" : a < 50 ? "Adulto" : a < 65 ? "Meia-idade" : "Idoso";
}
/** Mais velho cansa mais rápido e rende menos nos trabalhos pesados. */
function ageWorkMul() {
  const a = playerAge();
  return a >= 75 ? 0.6 : a >= 65 ? 0.75 : a >= 55 ? 0.9 : 1;
}
function ageTick() {
  player.age = playerAge() + 1;
  const a = player.age;
  if ([30, 50, 65].includes(a))
    setTimeout(() => toast(`Feliz aniversário! ${a} anos: agora você é ${lifeStage().toLowerCase()}.`, 4200), 1800);
  else setTimeout(() => toast(`Feliz aniversário! ${a} anos.`, 2600), 1800);
  // A partir dos 70, a cada ano cresce a chance de a vida terminar.
  if (a >= 70 && Math.random() < (a - 66) * 0.035) setTimeout(lifeEnds, 2500);
}
function heirs() {
  return (player.kids || []).filter((k) => kidAge(k) >= 16);
}
/** Fim da vida: funeral e, se houver herdeiro adulto, a família continua. */
function lifeEnds() {
  if (game.mode !== "world") return setTimeout(lifeEnds, 2000);
  const name = player.name,
    age = playerAge();
  const list = heirs();
  const tax = Math.floor(player.gold * 0.1);
  if (!list.length) {
    clearSave();
    say(
      [
        ["", `${name} morreu em paz aos ${age} anos, em Cinzaluz.`],
        ["Padre Anselmo", "Que a terra seja leve. A vila inteira veio se despedir."],
        ["", "Sem filhos adultos para continuar a família, esta história termina aqui. Obrigado por jogar!"],
      ],
      () => location.reload(),
    );
    return;
  }
  say(
    [
      ["", `${name} morreu em paz aos ${age} anos. A vila inteira veio ao funeral.`],
      ["Padre Anselmo", "Uma vida inteira de trabalho, amor e histórias. Que descanse."],
      ["", `A herança passa para os filhos. A Coroa cobra ${tax} de ouro de imposto sobre a herança.`],
    ],
    () =>
      choice(
        "Quem continua a família?",
        "Escolha o herdeiro. Você passa a jogar com ele, na mesma casa, com o ouro da família.",
        list.map((k) => ({
          t: `${k.name} · ${kidAge(k)} anos${k.spouse ? ` · casado(a) com ${k.spouse}` : ""}`,
          fn: () => continueAsHeir(k, tax),
        })),
      ),
  );
}
function continueAsHeir(k, tax) {
  const oldName = player.name;
  player.gold -= tax;
  player.taxPaid = (player.taxPaid || 0) + tax;
  player.name = k.name;
  player.look = Object.assign({}, player.look, k.look, { hat: "nenhum" });
  player.age = kidAge(k);
  player.spouse = null;
  player.dating = null;
  player.lovers = [];
  player.sspouses = [];
  player.openRel = null;
  player.generation = (player.generation || 1) + 1;
  player.ancestors = [...(player.ancestors || []), oldName];
  // Os irmãos continuam na família; o herdeiro sai da lista de filhos.
  player.kids = player.kids.filter((q) => q !== k);
  player.kids.forEach((q) => (q.sibling = true));
  player.hp = maxHp();
  player.energy = 100;
  player.hygiene = 100;
  player.fun = 70;
  saveGame();
  say([
    ["", `Agora você é ${k.name}, ${player.age} anos, ${player.generation}ª geração da família.`],
    ["", `Os outros filhos de ${oldName} agora são seus irmãos. A vida continua!`],
  ]);
}

/* ===================== REINOS ===================== */

const KINGDOMS = {
  aurelia: { n: "Reino de Aurélia", short: "Aurélia", zone: "vila", ruler: "Rainha Aurélia" },
  mares: { n: "Principado das Marés", short: "Marés", zone: "porto", ruler: "Príncipe-Almirante Tarso" },
  serra: { n: "Clãs de Pedravale", short: "Pedravale", zone: "serra", ruler: "Rei-Anão Durgan" },
};
const KINGDOM_PAIRS = [
  ["aurelia", "mares"],
  ["aurelia", "serra"],
  ["mares", "serra"],
];
const pairKey = (a, b) => [a, b].sort().join("-");

/** Reino de cada região. As regiões selvagens ficam com o reino vizinho. */
function kingdomOf(zone) {
  if (zone === "porto") return "mares";
  if (zone === "serra" || zone === "picos") return "serra";
  return "aurelia";
}
function worldState() {
  if (!player.world) {
    player.world = { rel: {}, wars: {} };
    for (const [a, b] of KINGDOM_PAIRS) player.world.rel[pairKey(a, b)] = 55 + Math.floor(Math.random() * 20);
  }
  return player.world;
}
function atWar(a, b) {
  return a !== b && !!worldState().wars[pairKey(a, b)];
}
function kingdomAtWar(k) {
  return KINGDOM_PAIRS.some(([a, b]) => (a === k || b === k) && atWar(a, b));
}
/** Todo dia as relações mudam um pouco; muito baixo vira guerra, e guerras acabam em tratados. */
function worldTick() {
  const w = worldState();
  for (const [a, b] of KINGDOM_PAIRS) {
    const k = pairKey(a, b);
    const war = w.wars[k];
    if (war) {
      w.rel[k] = Math.min(100, w.rel[k] + 3 + Math.floor(Math.random() * 6));
      if (player.day - war.since >= 3 && (w.rel[k] >= 45 || Math.random() < 0.15)) {
        delete w.wars[k];
        w.rel[k] = Math.max(w.rel[k], 50);
        setTimeout(() => announceWorld(`Paz! ${KINGDOMS[a].short} e ${KINGDOMS[b].short} assinaram um tratado. As fronteiras reabriram.`), 3200);
      }
    } else {
      w.rel[k] = Math.max(0, Math.min(100, w.rel[k] + Math.floor(Math.random() * 15) - 8));
      if (w.rel[k] < 20) {
        w.wars[k] = { since: player.day };
        setTimeout(() => announceWorld(`GUERRA! ${KINGDOMS[a].n} declarou guerra a ${KINGDOMS[b].n}!`), 3200);
      }
    }
  }
  // Durante a guerra, saqueadores às vezes atacam a feira da vila onde você está.
  const here = kingdomOf(player.zone);
  if (kingdomAtWar(here) && ZONES[player.zone].town && Math.random() < 0.25) {
    const lost = Math.min(player.gold, 10 + Math.floor(Math.random() * 25));
    player.gold -= lost;
    setTimeout(() => toast(`Saqueadores inimigos atacaram a feira à noite! Você perdeu ${lost} de ouro.`, 4000), 4200);
  }
}
function announceWorld(msg) {
  game.banner = { text: msg.split("!")[0] + "!", t: 3.5 };
  toast(msg, 5000);
  playSound(196, 0.3, "triangle");
}
/** Imposto extra de guerra (8%) para pagar o exército. */
function warTax() {
  return lifeMode() && kingdomAtWar(kingdomOf(player.zone)) ? 0.08 : 0;
}
/** Soldo da Guarda dobra em tempo de guerra. */
function warGuardMul() {
  return lifeMode() && kingdomAtWar(kingdomOf(player.zone)) ? 1.5 : 1;
}
/** Viajar para um reino em guerra com o seu: só com contrabandista, e caro. */
function borderCheck(dest, go) {
  if (!lifeMode()) return go(1);
  const a = kingdomOf(player.zone),
    b = kingdomOf(dest);
  if (!atWar(a, b)) return go(1);
  choice(
    "Fronteira fechada",
    `${KINGDOMS[a].short} e ${KINGDOMS[b].short} estão em guerra. A estrada oficial está fechada.`,
    [
      { t: "Pagar um contrabandista (preço x3)", fn: () => go(3) },
      { t: "Desistir da viagem", fn: null },
    ],
  );
}
function kingdomsMenu() {
  if (!lifeMode()) return;
  const w = worldState();
  const here = kingdomOf(player.zone);
  const lines = KINGDOM_PAIRS.map(([a, b]) => {
    const r = w.rel[pairKey(a, b)];
    const st = atWar(a, b) ? "<b style='color:#ff6b6b'>EM GUERRA</b>" : r >= 70 ? "aliados" : r >= 40 ? "neutros" : "tensão";
    return `${KINGDOMS[a].short} × ${KINGDOMS[b].short}: ${st} (${r}/100)`;
  }).join("<br>");
  const opts = [];
  if (isMonarch()) opts.push({ t: `Governar o reino (${royalTitle()})`, fn: royalMenu });
  if (kingdomAtWar(here))
    opts.push({
      t: "Alistar-se no exército por um dia (perigoso, paga bem)",
      fn: enlist,
    });
  opts.push({ t: "Fechar", fn: null });
  choice(
    "Reinos",
    `Você está em <b>${ZONES[player.zone].nome}</b>, ${KINGDOMS[here].n} (governante: ${here === "aurelia" && isMonarch() ? `${player.name} e Rainha Aurélia` : KINGDOMS[here].ruler}).<br>${playerAge()} anos · ${lifeStage()}${player.generation > 1 ? ` · ${player.generation}ª geração` : ""}<br><br>${lines}`,
    opts,
  );
}
/** Um dia no front: pagamento alto, risco de ferimento. */
function enlist() {
  if (lifeNeed("energy") < 40) return say([["Sargento", "Você mal fica em pé, recruta. Durma antes de ir pra guerra."]]);
  passTime(12, "Doze horas no front de batalha...");
  const r = Math.random() * (playerAge() >= 60 ? 0.7 : 1);
  if (r < 0.2) {
    player.injured = true;
    player.hp = Math.max(1, Math.round(maxHp() * 0.3));
    player.gold += 40;
    say([["", "Você foi ferido na batalha e voltou carregado. Soldo: 40 ouro. Vá ao hospital!"]]);
  } else {
    const pay = 90 + Math.floor(Math.random() * 70);
    player.gold += pay;
    repAdd(4);
    say([["", `Você lutou com coragem e voltou inteiro. Soldo: ${pay} ouro. Reputação +4.`]]);
  }
  addNeed("energy", -40);
  saveGame();
}

/* ===================== VIAGEM A PÉ ENTRE OS REINOS ===================== */

/** No Simulador, as saídas de Cinzaluz levam aos reinos vizinhos e à Floresta Grande. */
const SIM_EXITS = { e: "porto", n: "serra", w: "floresta" };
function simTravel(dir) {
  if (player.zone !== "vila") return false;
  const dest = SIM_EXITS[dir];
  if (!dest) return false;
  if (dest === "floresta") {
    changeZone("floresta", "w");
    return true;
  }
  walkTo(dest);
  return true;
}
/** Caminhar até outra vila: 2 horas, e na guerra só com contrabandista. */
function walkTo(dest) {
  borderCheck(dest, (mul) => {
    if (mul > 1) {
      const price = 30;
      if (player.gold < price) return say([["Contrabandista", "Sem 30 de ouro, sem trilha escondida. Volte quando tiver."]]);
      player.gold -= price;
    }
    const a = ZONES[dest].town.arrive;
    passTime(2, `Você caminha 2 horas pela estrada até ${ZONES[dest].nome}.`);
    player.zone = dest;
    player.x = a[0];
    player.y = a[1];
    player.dir = "down";
    enterZone();
    addNeed("energy", -8);
    saveGame();
    setTimeout(() => announceBorder(dest), 600);
  });
}
function announceBorder(dest) {
  const k = KINGDOMS[kingdomOf(dest)];
  toast(`Fronteira: você entrou no ${k.n}. Governante: ${k.ruler}.`, 3600);
}
/** Opção "ir a pé" no estábulo das vilas vizinhas. */
function walkHomeItems() {
  if (!lifeMode()) return [];
  const towns = ["vila", "porto", "serra"].filter((z) => z !== player.zone);
  return towns.map((z) => ({
    t: `Ir a pé para ${ZONES[z].nome} (grátis, 2h)`,
    fn: () => walkTo(z),
  }));
}
