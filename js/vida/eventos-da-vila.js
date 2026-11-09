/**
 * ECOS DO ARCANO — eventos-da-vila.js (Simulador)
 * Eventos grandes (incêndio, enchente, circo, praga, mercador), sonhos dos
 * moradores que se realizam e o rival pessoal.
 * Modifica (envolve) funções de outros arquivos: crewDrawList, crewVisible, lifeSocialItems, npcHidden, onNewDay, update.
 */

"use strict";

/* ===================== EVENTOS GRANDES ===================== */
const BIG_EVENTS = {
  incendio: {
    n: "Incêndio no Armazém Geral!",
    t: "Fumaça preta sobe do Armazém Geral! Os moradores correm com baldes.",
    o: [
      ["Ajudar com baldes de água", () => (repAdd(6), Object.keys(FRIENDS).forEach((id) => addFriendship(id, 1)), say([["", "Você passa a tarde carregando baldes. O fogo apaga. A vila te chama de herói."]]))],
      ["Vender baldes a 5 de ouro", () => ((player.gold += 60), repAdd(-6), say([["", "Você lucra 60 de ouro... e todos lembram disso."]]))],
      ["Assistir de longe", () => say([["", "O armazém fica chamuscado, mas de pé."]])],
    ],
  },
  enchente: {
    n: "Enchente!",
    t: "O rio transbordou. As casas baixas estão com água pelos joelhos.",
    o: [
      ["Ajudar os vizinhos a salvar as coisas", () => (repAdd(5), addNeed("energy", -30), say([["", "Cansativo, mas ninguém perdeu as fotos da família."]]))],
      ["Proteger só a sua casa", () => say([["", "Sua casa ficou seca. A do vizinho, não."]])],
    ],
  },
  circo: {
    n: "O Circo chegou!",
    t: "Uma lona listrada apareceu na praça! Malabaristas, um urso que dança e um homem que come fogo.",
    o: [
      ["Assistir ao show (10 ouro)", () => (player.gold >= 10 ? ((player.gold -= 10), addNeed("fun", 45), say([["", "O urso dança valsa. Você ri até chorar."]])) : say([["", "Sem 10 de ouro..."]]))],
      ["Pedir para participar de um número", () => (Math.random() < 0.5 ? ((player.gold += 40), repAdd(3), say([["Dono do circo", "Você nasceu pra isso! Tome 40 de ouro."]])) : (repAdd(-2), say([["", "Você tropeça no trapézio. A plateia adora, mas por outro motivo."]])))],
    ],
  },
  praga: {
    n: "Praga na colheita!",
    t: "Gafanhotos comeram o trigo. O pão vai ficar caro por uns dias.",
    o: [
      ["Doar comida para quem precisa", () => (repAdd(5), say([["", "Você divide o que tem. Ninguém passa fome na sua rua."]]))],
      ["Estocar pão para revender", () => ((player.gold += 45), repAdd(-4), say([["", "Você revende pão pelo dobro. Lucro de 45 de ouro e olhares tortos."]]))],
    ],
  },
  mercador: {
    n: "Um mercador estrangeiro!",
    t: "Uma caravana do Oriente parou na praça com coisas que ninguém nunca viu.",
    o: [
      ["Comprar um amuleto da sorte (50 ouro)", () => (player.gold >= 50 ? ((player.gold -= 50), (player.luck = player.day + 15), say([["Mercador", "Sorte por quinze dias. Ou seu dinheiro... não volta."]])) : say([["", "Sem 50 de ouro."]]))],
      ["Pechinchar só por diversão", () => (addNeed("fun", 15), say([["Mercador", "Você é durx de negócio! Volte sempre."]]))],
    ],
  },
};
function bigEventDaily() {
  if (player.bigEv && player.bigEv.day === player.day - 1) player.bigEv = null;
  if (Math.random() < 0.12) {
    const k = pk(Object.keys(BIG_EVENTS));
    player.bigEv = { k, day: player.day, seen: false };
    vilaNews(BIG_EVENTS[k].n);
    setTimeout(() => toast(`${BIG_EVENTS[k].n} Vá até a praça!`, 4600), 4500);
  }
}
function bigEventTick() {
  const E = player.bigEv;
  if (!E || E.seen || E.day !== player.day || player.zone !== "vila" || game.mode !== "world" || game.dialog) return;
  if (currentHour() < 8 || currentHour() > 21) return;
  E.seen = true;
  const B = BIG_EVENTS[E.k];
  game.shake = E.k === "incendio" ? 0.3 : 0;
  choice(B.n, B.t, B.o.map(([t, fn]) => ({ t, fn: () => (fn(), saveGame()) })));
}
function drawBigEvent(list, t) {
  const E = player.bigEv;
  if (!E || E.day !== player.day || player.zone !== "vila") return;
  if (E.k === "incendio") {
    const b = typeof vilaBuilding === "function" && vilaBuilding("Armazém Geral");
    if (!b) return;
    list.push({
      y: b.y + b.h,
      draw: () => {
        const W = b.w * TILE,
          X0 = b.x * TILE,
          Y0 = b.y * TILE + 18;
        ctx.fillStyle = `rgba(255,140,40,${0.18 + 0.06 * Math.sin(t * 9)})`;
        ctx.beginPath();
        ctx.ellipse(X0 + W / 2, Y0, W * 0.6, 50, 0, 0, 7);
        ctx.fill();
        for (let i = 0; i < 9; i++) {
          const x = X0 + (W / 9) * (i + 0.5),
            h = 26 + Math.abs(Math.sin(t * 7 + i * 1.7)) * 30,
            w = 14 + (i % 3) * 3,
            sway = Math.sin(t * 5 + i) * 4;
          for (const [k, col] of [
            [1, "#e8461a"],
            [0.7, "#ff9a2a"],
            [0.4, "#ffe066"],
          ]) {
            ctx.fillStyle = col;
            ctx.beginPath();
            ctx.moveTo(x - (w * k) / 2, Y0);
            ctx.quadraticCurveTo(x - (w * k) / 2, Y0 - h * k * 0.5, x + sway, Y0 - h * k);
            ctx.quadraticCurveTo(x + (w * k) / 2, Y0 - h * k * 0.5, x + (w * k) / 2, Y0);
            ctx.fill();
          }
        }
        for (let i = 0; i < 6; i++) {
          ctx.fillStyle = `rgba(70,64,70,${0.45 - ((t * 0.4 + i / 6) % 1) * 0.4})`;
          ctx.beginPath();
          ctx.arc(X0 + W * (0.2 + (i % 4) * 0.2), Y0 - 50 - ((t * 25 + i * 20) % 110), 14 + i * 2, 0, 7);
          ctx.fill();
        }
      },
    });
  }
  if (E.k === "circo") {
    const { cx, cy } = protestPlaza();
    const X = (cx + 6) * TILE,
      Y = (cy + 8) * TILE;
    list.push({
      y: cy + 9,
      draw: () => {
        for (let i = 0; i < 8; i++) {
          ctx.fillStyle = i % 2 ? "#e03a3a" : "#f6ecd2";
          ctx.beginPath();
          ctx.moveTo(X + i * 12, Y + 40);
          ctx.lineTo(X + 48, Y - 20);
          ctx.lineTo(X + i * 12 + 12, Y + 40);
          ctx.fill();
        }
        ctx.fillStyle = "#ffd84a";
        ctx.fillRect(X + 46, Y - 34, 4, 16);
        ctx.fillRect(X + 50, Y - 34, 12, 7);
      },
    });
  }
}

/* ===================== SONHOS ===================== */
function npcDream(id) {
  return DREAMS[hashStr("sonho" + id) % DREAMS.length];
}
function dreamDaily() {
  player.dreamsDone = player.dreamsDone || {};
  player.away = player.away || {};
  for (const [id, d] of Object.entries(player.away)) if (player.day >= d) (delete player.away[id], vilaNews(`${shortName(id)} voltou de viagem cheio de histórias!`));
  if (Math.random() > 0.08) return;
  const pool = Object.keys(NPCS).filter((id) => named(id) && !isChildNpc(id) && !player.dreamsDone[id]);
  if (!pool.length) return;
  const id = pk(pool),
    dr = npcDream(id);
  player.dreamsDone[id] = player.day;
  if (/viajar|conhecer o mar|Pedravale/.test(dr)) {
    player.away[id] = player.day + 5;
    vilaNews(`${shortName(id)} realizou o sonho de ${dr} e saiu de viagem por 5 dias!`);
  } else vilaNews(`Sonho realizado: ${shortName(id)} conseguiu ${dr}! A vila fez festa.`);
  addFriendship(id, friendship(id) >= 40 ? 3 : 0);
  if (friendship(id) >= 50) setTimeout(() => toast(`${shortName(id)} realizou um sonho e mandou te contar: ${dr}!`, 4400), 4000);
}
{
  const nhBase = npcHidden;
  npcHidden = function (id) {
    if (player.away && player.away[id] && player.day < player.away[id]) return true;
    return nhBase(id);
  };
  const cvBase = crewVisible;
  crewVisible = function (a) {
    if (a && player.away && player.away[a.id] && player.day < player.away[a.id]) return false;
    return cvBase(a);
  };
}

/* ===================== RIVAL PESSOAL ===================== */
const RIVAL_ACTS = [
  (n) => `${n} disse na taverna que você é ${pk(["um zero à esquerda", "metid" + genderWord("o", "a", "e") + " a besta", "fraquinh" + genderWord("o", "a", "e") + " na queda de braço"])}.`,
  (n) => `${n} ganhou o concurso de tortas que você queria ganhar.`,
  (n) => `${n} ficou com a vaga de trabalho que você ia pegar.`,
  (n) => `${n} anda espalhando que é mais bonit${"o"} que você.`,
];
function myRival() {
  const R = player.prival;
  return R && named(R.id) && !R.done ? R : null;
}
function rivalDaily() {
  if (!player.prival && player.day >= 3) {
    const pool = Object.keys(NPCS).filter((id) => named(id) && !isChildNpc(id) && id !== player.spouse && (hasTrait(id, "ambicioso") || hasTrait(id, "esquentado") || hasTrait(id, "dramatico")));
    if (pool.length) {
      const id = pk(pool);
      player.prival = { id, wins: 0, losses: 0 };
      setTimeout(() => toast(`${shortName(id)} decidiu que você é ${gw(id, "o rival dele", "a rival dela")}. Prepare-se!`, 4600), 5200);
    }
    return;
  }
  const R = myRival();
  if (!R || Math.random() > 0.3) return;
  const n = shortName(R.id);
  if (player.dating && NPCS[player.dating] && Math.random() < 0.3) {
    vilaNews(`${n} foi vist${gw(R.id, "o", "a")} dando em cima de ${shortName(player.dating)}. Provocação pura!`);
    addFriendship(player.dating, -3);
  } else vilaNews(pk(RIVAL_ACTS)(n));
}
function rivalDuel(id) {
  const R = myRival();
  const n = shortName(id);
  choice(`Desafio contra ${n}`, `Placar: você ${R.wins} x ${R.losses} ${n}. Vença 3 vezes e a rivalidade vira respeito.`, [
    { t: "Queda de braço", icon: "sword", fn: () => duelRes(R, Math.random() < 0.45 + (player.brawlWins || 0) * 0.03, "Os braços tremem, a mesa range...") },
    { t: "Corrida até a fonte", icon: "flag", fn: () => duelRes(R, Math.random() < 0.5 + (lifeNeed("energy") - 50) / 200, "Vocês disparam pela praça!") },
    { t: "Debate na taverna", icon: "chat", fn: () => duelRes(R, Math.random() < 0.4 + ((player.rep ?? 50) - 50) / 150 + (hasTrait("player", "intelectual") ? 0.15 : 0), "A taverna inteira para pra ouvir...") },
    { t: "Agora não", fn: null },
  ]);
}
function duelRes(R, won, intro) {
  const n = shortName(R.id);
  if (won) R.wins++;
  else R.losses++;
  repAdd(won ? 2 : -1);
  if (R.wins >= 3) {
    R.done = true;
    addFriendship(R.id, 30);
    vilaNews(`Fim da rivalidade: ${n} reconheceu que ${player.name} é ${genderWord("o melhor", "a melhor", "quem manda")}. Agora são amigos!`);
    return say([["", intro], ["", "Você vence de novo!"], [n, "Tá bom, tá bom... você é bom. Muito bom. Amigos?"]]);
  }
  say([["", intro], ["", won ? `Você venceu! (${R.wins} x ${R.losses})` : `${n} venceu essa. (${R.wins} x ${R.losses})`], [n, won ? pk(["Sorte de principiante!", "Revanche amanhã!"]) : pk(["Hahaha! Fácil demais!", "Volta quando tiver treinado."])]]);
}
{
  const itemsBase = lifeSocialItems;
  lifeSocialItems = function (id) {
    const items = itemsBase(id);
    const R = myRival();
    if (R && R.id === id) items.unshift({ t: "Desafiar meu rival ⚔", icon: "sword", fn: () => rivalDuel(id) });
    if (named(id) && !isChildNpc(id)) items.push({ t: "Perguntar do sonho", icon: "star", fn: () => say([[shortName(id), player.dreamsDone && player.dreamsDone[id] ? `Eu consegui ${npcDream(id)}! Nem acredito até hoje.` : `Meu sonho? ${npcDream(id)[0].toUpperCase() + npcDream(id).slice(1)}. Um dia eu chego lá.`]]) });
    return items;
  };
}


/* ===================== LIGAÇÕES ===================== */
{
  const dayBase = onNewDay;
  onNewDay = function () {
    dayBase.apply(this, arguments);
    if (!lifeMode()) return;
    bigEventDaily();
    dreamDaily();
    rivalDaily();
  };
  const cdBase = crewDrawList;
  crewDrawList = function (list, t) {
    cdBase(list, t);
    if (lifeMode()) drawBigEvent(list, t);
  };
  let acc = 0;
  const updBase = update;
  update = function (dt) {
    updBase(dt);
    if (!lifeMode() || game.mode !== "world" || game.dialog) return;
    acc += dt;
    if (acc < 1) return;
    acc = 0;
    bigEventTick();
  };
}
