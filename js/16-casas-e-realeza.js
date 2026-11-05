/**
 * ECOS DO ARCANO — 16-casas-e-realeza.js
 * Só no Simulador de Vida:
 *  - Casas à venda nas três vilas: comprar, morar, alugar as outras.
 *  - Coletor Real: uma pessoa do palácio vem até você cobrar o imposto
 *    da casa e dos móveis.
 *  - Casar com a Rainha faz de você Rei, Rainha ou Monarca de Aurélia:
 *    imposto do reino, festas reais, guerra e paz.
 */

"use strict";

/* ===================== CASAS ===================== */

const HOUSE_ZONE_MUL = { vila: 1.2, porto: 1, serra: 0.9 };
const STARTER_HOUSE = "vila:5,17";
/* Casas de pobres e de ricos: Casebre, Casa, Sobrado e Mansão. */
const HOUSE_TIERS = {
  casebre: { n: "Casebre", cls: "pobre", base: 110, per: 6, comfort: 0.85, desc: "Chão de terra, telhado de palha e goteira. Barato, mas descansa menos." },
  casa: { n: "Casa", cls: "simples", base: 240, per: 14, comfort: 1, desc: "Casa simples de família: piso de madeira e lareira." },
  sobrado: { n: "Sobrado", cls: "confortável", base: 600, per: 24, comfort: 1.3, desc: "Dois andares, janelas grandes e tapetes. Descansa e diverte mais." },
  mansao: { n: "Mansão", cls: "rica", base: 1500, per: 40, comfort: 1.6, desc: "Piso de mármore, tapete vermelho e criados. Dá status: +1 de reputação por dia morando nela." },
};
/** Cada casa sem nome tem um padrão de riqueza fixo (pelo tamanho e pelo lugar). */
const HOUSE_TIER_FIXED = { c12: "mansao", p16: "mansao", c1: "casebre" };
function houseTierOf(b) {
  if (HOUSE_TIER_FIXED[b.id]) return HOUSE_TIER_FIXED[b.id];
  const area = b.w * b.h,
    h = (b.x * 7 + b.y * 13) % 10;
  if (area >= 30) return h < 5 ? "mansao" : "sobrado";
  if (area >= 16) return h < 3 ? "casebre" : h < 8 ? "casa" : "sobrado";
  return h < 6 ? "casebre" : "casa";
}
(function styleHouses() {
  for (const zone of ["vila", "porto", "serra"])
    for (const b of ZONES[zone].town.bld) if (!b.name && (b.style === "casa" || b.style === "casa2")) b.style = houseTierOf(b) === "casa" ? b.style : houseTierOf(b);
})();
/** Todas as casas: a sua casa inicial e as casas sem nome (de moradores) das vilas. */
function allHouses() {
  if (game.houseList) return game.houseList;
  const list = {};
  for (const zone of ["vila", "porto", "serra"]) {
    for (const b of ZONES[zone].town.bld) {
      const key = `${zone}:${b.door[0]},${b.y + b.h - 1}`;
      if (key === STARTER_HOUSE)
        list[key] = { key, zone, x: b.door[0], y: b.y + b.h - 1, n: "Casebre da família", price: 300, size: "pequena", tier: "casebre" };
      else if (!b.name) {
        const area = b.w * b.h;
        const tier = houseTierOf(b),
          T = HOUSE_TIERS[tier];
        const size = area >= 30 ? "grande" : area >= 18 ? "média" : "pequena";
        const price = Math.round(((T.base + area * T.per) * HOUSE_ZONE_MUL[zone]) / 10) * 10;
        const where = zone === "vila" ? "em Cinzaluz" : zone === "porto" ? "no Porto" : "na Serra";
        list[key] = { key, zone, x: b.door[0], y: b.y + b.h - 1, n: `${T.n} ${where}`, price, size, tier };
      }
    }
  }
  game.houseList = list;
  return list;
}
function houseAt(zone, x, y) {
  return allHouses()[`${zone}:${x},${y}`] || null;
}
function ownedHouses() {
  const owned = new Set([STARTER_HOUSE, ...(player.houses || [])]);
  return [...owned].map((k) => allHouses()[k]).filter(Boolean);
}
function homeHouse() {
  return allHouses()[player.home || STARTER_HOUSE];
}
/** Conforto da casa onde você mora: casas maiores descansam e divertem mais. */
function homeComfort() {
  const h = homeHouse();
  return h ? HOUSE_TIERS[h.tier || "casa"].comfort : 1;
}
/** Padrão da casa onde você está morando (o interior muda com ele). */
function homeTier() {
  if (!lifeMode()) return "casa";
  const h = homeHouse();
  return (h && h.tier) || "casa";
}
/** Porta de uma casa sem nome no Simulador: comprar, morar, alugar ou entrar. */
function lifeHouseDoor(b) {
  if (!lifeMode()) return false;
  const h = houseAt(player.zone, b.door[0], b.y + b.h - 1);
  if (!h || h.key === STARTER_HOUSE) return false;
  const mine = (player.houses || []).includes(h.key);
  const home = (player.home || STARTER_HOUSE) === h.key;
  if (!mine) {
    choice(
      `${h.n} (à venda)`,
      `${HOUSE_TIERS[h.tier].n} (casa ${HOUSE_TIERS[h.tier].cls}). ${HOUSE_TIERS[h.tier].desc}<br>Preço: ${withTax(h.price)} ouro com Imposto Real. Imposto: ${houseTax(h)} ouro por dia.`,
      [
        {
          t: `Comprar por ${withTax(h.price)} ouro`,
          fn: () => {
            if (player.gold < withTax(h.price)) return say([["Corretor Anselmo", "Sem ouro, sem escritura. Junte mais e volte!"]]);
            payWithTax(h.price);
            player.houses = [...(player.houses || []), h.key];
            repAdd(2);
            saveGame();
            say([
              ["Corretor Anselmo", `Escritura assinada! O ${h.n} é seu.`],
              ["", "Entre e escolha: morar aqui ou alugar para render ouro todo dia."],
            ]);
          },
        },
        { t: "Só olhar", fn: null },
      ],
    );
    return true;
  }
  const opts = [{ t: "Entrar", fn: () => enterHouse(h) }];
  if (!home)
    opts.push(
      {
        t: "Mudar para cá (vira sua casa)",
        fn: () => {
          player.home = h.key;
          player.rented = (player.rented || []).filter((k) => k !== h.key);
          saveGame();
          say([["", `Você se mudou para o ${h.n}! Família e móveis vêm junto.`]]);
        },
      },
      {
        t: (player.rented || []).includes(h.key) ? `Parar de alugar (rende ${houseRent(h)}/dia)` : `Alugar (rende ${houseRent(h)} ouro por dia)`,
        fn: () => {
          const r = new Set(player.rented || []);
          if (r.has(h.key)) r.delete(h.key);
          else r.add(h.key);
          player.rented = [...r];
          saveGame();
          toast(r.has(h.key) ? "Casa alugada! O aluguel cai todo dia." : "Você parou de alugar esta casa.", 2600);
        },
      },
      {
        t: `Vender por ${Math.round(h.price * 0.8)} ouro`,
        fn: () => {
          player.houses = (player.houses || []).filter((k) => k !== h.key);
          player.rented = (player.rented || []).filter((k) => k !== h.key);
          player.gold += saleAfterTax(Math.round(h.price * 0.8));
          saveGame();
          toast("Casa vendida.", 2200);
        },
      },
    );
  opts.push({ t: "Sair", fn: null });
  choice(h.n + (home ? " (sua casa)" : ""), `Casa ${h.size}. ${home ? "Você mora aqui." : ""}`, opts);
  return true;
}
const houseTax = (h) => Math.max(2, Math.round(h.price * 0.012));
const houseRent = (h) => Math.round(h.price * 0.03);

/* ===================== COLETOR REAL ===================== */

/** Imposto diário: casas que você tem e móveis da casa. */
function dailyPropertyTax() {
  if (isMonarch()) return 0;
  const houses = ownedHouses().reduce((a, h) => a + houseTax(h), 0);
  const furniture = (player.furn || []).length;
  return houses + furniture;
}
function houseDaily() {
  if (!lifeMode()) return;
  const rent = (player.rented || []).map((k) => allHouses()[k]).filter(Boolean).reduce((a, h) => a + houseRent(h), 0);
  if (rent) {
    player.gold += rent;
    setTimeout(() => toast(`Aluguéis recebidos: +${rent} ouro.`, 3000), 4600);
  }
  const tax = dailyPropertyTax();
  player.taxDue = (player.taxDue || 0) + tax;
  if (homeTier() === "mansao") repAdd(1);
  if (isMonarch()) royalDaily();
}
const COLLECTOR_NAMES = ["Coletor Real Osvaldo", "Coletora Real Benedita", "Fiscal da Coroa Eustáquio"];
/** O coletor aparece de dia na vila e anda até você. */
function collectorTick(dt) {
  if (!lifeMode() || game.mode !== "world" || game.dialog || !ZONES[player.zone].town) return;
  const due = player.taxDue || 0;
  const h = currentHour();
  if (!game.collector) {
    if (due < 1 || h < 9 || h > 17 || player.famDay.collector === player.day) return;
    const pt = randomRoadTile(8);
    if (!pt) return;
    game.collector = {
      x: pt[0],
      y: pt[1],
      rx: pt[0],
      ry: pt[1],
      step: 0,
      dir: "down",
      nm: COLLECTOR_NAMES[player.day % COLLECTOR_NAMES.length],
    };
    toast(`${game.collector.nm} está vindo cobrar o imposto da casa e dos móveis...`, 3000);
    return;
  }
  const c = game.collector;
  c.rx += (c.x - c.rx) * Math.min(1, dt * 8);
  c.ry += (c.y - c.ry) * Math.min(1, dt * 8);
  if (Math.abs(c.x - player.x) + Math.abs(c.y - player.y) <= 1) return collectorTalk();
  c.step -= dt;
  if (c.step > 0) return;
  c.step = 0.28;
  const field = distanceField();
  const here = field.get(c.x + "," + c.y) ?? 1e9;
  for (const [a, b] of DIRS4) {
    const d = field.get(c.x + a + "," + (c.y + b));
    if (d != null && d < here && !(c.x + a === player.x && c.y + b === player.y)) {
      c.x += a;
      c.y += b;
      c.dir = a > 0 ? "right" : a < 0 ? "left" : b > 0 ? "down" : "up";
      return;
    }
  }
}
function collectorTalk() {
  const c = game.collector;
  game.collector = null;
  player.famDay.collector = player.day;
  const due = player.taxDue || 0;
  const n = c.nm;
  choice(
    n,
    `"Em nome da Coroa: imposto das casas e dos móveis. Total devido: <b>${due} ouro</b>."${player.taxStrikes ? ` Atrasos: ${player.taxStrikes}.` : ""}`,
    [
      {
        t: `Pagar ${due} ouro`,
        fn: () => {
          if (player.gold < due) return say([[n, "Ouro insuficiente? Volto amanhã. E a dívida não some, hein."]]);
          player.gold -= due;
          player.taxPaid = (player.taxPaid || 0) + due;
          player.taxDue = 0;
          player.taxStrikes = 0;
          saveGame();
          say([[n, "Tudo certinho. A Coroa agradece. Até a próxima!"]]);
        },
      },
      {
        t: "Pedir mais prazo (juros de 10%)",
        fn: () => {
          player.taxDue = Math.round(due * 1.1);
          repAdd(-1);
          saveGame();
          say([[n, "Mais um dia, então. Com juros, claro. A Coroa não é instituição de caridade."]]);
        },
      },
      {
        t: "Se recusar a pagar",
        fn: () => {
          player.taxStrikes = (player.taxStrikes || 0) + 1;
          repAdd(-5);
          if (player.taxStrikes >= 3 && (player.furn || []).length > 3) {
            const taken = player.furn.pop();
            player.taxDue = Math.round(due * 0.5);
            player.taxStrikes = 0;
            saveGame();
            return say([
              [n, "Três recusas. Guardas! Levem um móvel como pagamento."],
              ["", `Os guardas levaram seu móvel (${furnName(taken.id)}) e metade da dívida foi perdoada. Reputação −5.`],
            ]);
          }
          saveGame();
          say([[n, `Vou anotar isso. Mais ${3 - player.taxStrikes} recusa(s) e os guardas vêm buscar seus móveis.`]]);
        },
      },
    ],
  );
}

/* ===================== REALEZA ===================== */

function isMonarch() {
  return lifeMode() && player.spouse === "rainha";
}
function royalTitle() {
  return genderWord("Rei", "Rainha", "Monarca") + " de Aurélia";
}
const ROYAL_TAX = { baixo: 0.08, normal: 0.12, alto: 0.18 };
/** Coroa recebe impostos do povo; imposto alto irrita, baixo agrada. */
function royalDaily() {
  const rate = player.royalTax || "normal";
  const income = { baixo: 40, normal: 80, alto: 140 }[rate];
  player.gold += income;
  if (rate === "alto") repAdd(-2);
  if (rate === "baixo") repAdd(1);
  setTimeout(() => toast(`Tesouro real: +${income} ouro em impostos do reino.`, 3200), 5200);
}
/** Imposto que o povo paga em Aurélia, decidido por você como monarca. */
function kingdomTaxRate() {
  return ROYAL_TAX[player.royalTax || "normal"];
}
function royalMenu() {
  if (!isMonarch()) return;
  const w = worldState();
  const others = ["mares", "serra"];
  const opts = [
    {
      t: `Imposto do reino: ${player.royalTax || "normal"} (mudar)`,
      fn: () =>
        choice("Imposto do reino", "Imposto alto enche o tesouro, mas o povo reclama. Baixo agrada o povo.", [
          ...Object.keys(ROYAL_TAX).map((k) => ({
            t: `${k[0].toUpperCase() + k.slice(1)} (${Math.round(ROYAL_TAX[k] * 100)}%)`,
            fn: () => {
              player.royalTax = k;
              saveGame();
              toast(`Decreto real: imposto ${k}.`, 2500);
            },
          })),
          { t: "Voltar", fn: null },
        ]),
    },
    {
      t: "Dar uma festa real (200 ouro)",
      fn: () => {
        if (player.gold < 200) return say([["Mordomo Real", "O tesouro não aguenta uma festa agora, Majestade."]]);
        player.gold -= 200;
        repAdd(6);
        addNeed("fun", 50);
        Object.keys(FRIENDS).forEach((k) => addFriendship(k, 2));
        game.fade = 1;
        saveGame();
        say([["", "Banquete no castelo, música até tarde e o povo inteiro convidado. Reputação +6!"]]);
      },
    },
  ];
  for (const o of others) {
    const k = pairKey("aurelia", o);
    if (atWar("aurelia", o))
      opts.push({
        t: `Propor paz a ${KINGDOMS[o].short}`,
        fn: () => {
          if (Math.random() < 0.5 + (w.rel[k] - 20) / 100) {
            delete w.wars[k];
            w.rel[k] = 55;
            saveGame();
            say([["", `Tratado assinado! ${KINGDOMS.aurelia.short} e ${KINGDOMS[o].short} estão em paz.`]]);
          } else say([[KINGDOMS[o].ruler, "Paz? Depois de tudo? Ainda não, Majestade."]]);
        },
      });
    else
      opts.push({
        t: `Declarar guerra a ${KINGDOMS[o].short}`,
        fn: () => {
          w.wars[k] = { since: player.day };
          w.rel[k] = 10;
          repAdd(-4);
          saveGame();
          announceWorld(`GUERRA! ${royalTitle()} declarou guerra a ${KINGDOMS[o].n}!`);
        },
      });
  }
  opts.push({ t: "Fechar", fn: null });
  choice(`${royalTitle()}`, `Tesouro: impostos do reino caem todo dia. Reputação: ${player.rep ?? 50}.`, opts);
}

/* ===================== DESENHO ===================== */

function lifeDrawList(list, t) {
  const c = game.collector;
  if (!c) return;
  list.push({
    y: c.ry,
    draw: () => {
      const X = c.rx * TILE,
        Y = c.ry * TILE;
      ctx.fillStyle = "rgba(0,0,0,.22)";
      ctx.beginPath();
      ctx.ellipse(X + 16, Y + 30, 8, 3, 0, 0, 7);
      ctx.fill();
      drawSprite(wizardRects("#6a2a4a", "#2a1f3d", "#3a2414", null, c.dir), X, Y, 2, c.dir === "left");
      drawPixelIcon("scroll", X + 16, Y - 8 - Math.abs(Math.sin(t * 5)) * 2, 2);
    },
  });
}
