/**
 * ECOS DO ARCANO — 13-simulador-de-vida.js
 * Modo Simulador de Vida: sem runas e sem batalhas da história.
 * O jogador cuida das necessidades básicas, trabalha de verdade (com minijogos),
 * pode ter a própria tendinha e entrar para a Guarda Real.
 * O modo história continua igual: tudo aqui só liga quando player.mode === "vida".
 */

"use strict";

function lifeMode() {
  return player.mode === "vida";
}

/* ===================== NECESSIDADES BÁSICAS ===================== */

/** Além de fome e sede: energia, higiene e diversão (0 a 100). */
const LIFE_NEEDS = {
  energy: { n: "Energia", icon: "zzz", rate: 0.17, low: "Você está exausto. Vá dormir!" },
  hygiene: { n: "Higiene", icon: "water", rate: 0.12, low: "Você precisa de um banho. As pessoas estão se afastando..." },
  fun: { n: "Diversão", icon: "party", rate: 0.13, low: "Que tédio... vá se divertir na taverna, dançar ou namorar." },
};
function lifeNeed(k) {
  return player[k] ?? 100;
}
function addNeed(k, v) {
  player[k] = Math.max(0, Math.min(100, lifeNeed(k) + v));
}
function lifeNeedsTick(dt) {
  if (!lifeMode()) return;
  for (const k in LIFE_NEEDS) {
    const before = lifeNeed(k);
    addNeed(k, -dt * LIFE_NEEDS[k].rate);
    if (before >= 15 && lifeNeed(k) < 15) toast(LIFE_NEEDS[k].low, 3500);
  }
}
/** Necessidades baixas atrapalham o trabalho: o pagamento cai. */
function needsPayMul() {
  let m = 1;
  if (lifeNeed("energy") < 20) m *= 0.6;
  if (lifeNeed("fun") < 15) m *= 0.8;
  if (lifeNeed("hygiene") < 15) m *= 0.85;
  if (starving()) m *= 0.7;
  return m;
}
/** Custo de um turno de trabalho nas necessidades. */
function spendShift(hours) {
  addNeed("energy", -hours * 6);
  addNeed("hygiene", -hours * 3);
  addNeed("fun", -hours * 3);
  player.food = Math.max(0, player.food - hours * 3);
  player.water = Math.max(0, player.water - hours * 4);
  player.clock = Math.min(1439, player.clock + hours * 60);
  game.fade = 1;
}

/* ===================== INÍCIO DO MODO ===================== */

function startLifeMode() {
  player.mode = "vida";
  player.runes = [];
  player.spells = [];
  player.gold = 60;
  player.energy = 100;
  player.hygiene = 100;
  player.fun = 80;
  game.seenArr = {};
  game.mm = {};
  startGame(false);
  say([
    ["", `Bem-vindo a Cinzaluz, ${player.name}. Aqui não tem magia nem aventura: tem boletos, fome e vizinhos curiosos.`],
    [
      "Professor Bruno Honda",
      "Recém-chegado? O Quadro de Trabalhos fica na praça, ao lado da fonte. Dá pra trabalhar na feira, abrir uma tendinha ou tentar a Guarda Real no castelo.",
    ],
    [
      "",
      "Cuide de fome, sede, energia, higiene e diversão (painel no canto). Durma em casa, tome banho e se divirta. Faça amigos, namore, case, tenha filhos e veja eles crescerem.",
    ],
  ]);
  saveGame();
}

/* ===================== MINIJOGOS (tela comum) ===================== */

let miniTimer = null;
function miniBox() {
  let el = byId("mini");
  if (!el) {
    el = document.createElement("div");
    el.id = "mini";
    el.className = "box ui";
    byId("screen").appendChild(el);
  }
  return el;
}
function openMini(html) {
  game.prevMode = "world";
  game.mode = "mini";
  const el = miniBox();
  el.innerHTML = html;
  el.style.display = "block";
  return el;
}
function closeMini() {
  clearInterval(miniTimer);
  miniTimer = null;
  const el = byId("mini");
  if (el) el.style.display = "none";
  game.mode = "world";
}
/** Barra de tempo: chama onEnd quando acaba. */
function miniCountdown(seconds, onEnd) {
  clearInterval(miniTimer);
  const start = performance.now();
  miniTimer = setInterval(() => {
    const left = Math.max(0, 1 - (performance.now() - start) / (seconds * 1000));
    const bar = byId("minibar");
    if (bar) bar.style.width = left * 100 + "%";
    if (left <= 0) {
      clearInterval(miniTimer);
      onEnd();
    }
  }, 50);
}
const miniBar = () => '<div class="bar" style="height:8px;margin:.5em 0"><i id="minibar" style="width:100%;background:#f2c14e"></i></div>';
function miniButtons(opts) {
  return `<div class="btns mini-grid">${opts
    .map((o, i) => `<button data-mi="${i}">${o.icon ? iconHTML(o.icon, 20) : ""}${i + 1}. ${o.t}</button>`)
    .join("")}</div>`;
}
function bindMini(opts, pick) {
  byId("mini")
    .querySelectorAll("[data-mi]")
    .forEach((b) => (b.onclick = () => pick(+b.dataset.mi)));
  game.miniKeys = (k) => {
    const i = +k - 1;
    if (i >= 0 && i < opts.length) pick(i);
  };
}
addEventListener("keydown", (e) => {
  if (game.mode === "mini" && game.miniKeys) game.miniKeys(e.key);
});
function miniResult(title, lines, after) {
  openMini(`<h3>${title}</h3>${lines.map((l) => `<p>${l}</p>`).join("")}<div class="btns"><button id="miniok">Continuar</button></div>`);
  game.miniKeys = (k) => (k === "Enter" || k === " " || k === "e") && done();
  const done = () => {
    closeMini();
    if (after) after();
  };
  byId("miniok").onclick = done;
}

/* ===================== TRABALHO 1: ATENDER NA FEIRA ===================== */

const FAIR_GOODS = [
  ["pao", "Pão"],
  ["maca", "Maçã"],
  ["queijo", "Queijo"],
  ["peixe", "Peixe"],
  ["cha", "Chá"],
  ["mel", "Mel"],
  ["bolo", "Bolo"],
  ["carne", "Carne"],
];
const CUSTOMER_NAMES = ["Dona Zefa", "Seu Lauro", "Tonico", "Bia", "Mestre Olavo", "Dita", "Juvenal", "Cida"];

/** Clientes pedem um produto; você tem poucos segundos para entregar o certo. */
function fairJob() {
  if (currentHour() < 7 || currentHour() >= 19) return say([["Rosa, a Quitandeira", "A feira só funciona das 7h às 19h!"]]);
  if (lifeNeed("energy") < 10) return say([["", "Você está cansado demais para trabalhar. Durma um pouco."]]);
  const rounds = 6;
  let i = 0,
    right = 0;
  const next = () => {
    if (i >= rounds) return endFair();
    const want = FAIR_GOODS[Math.floor(Math.random() * FAIR_GOODS.length)];
    const opts = [want];
    while (opts.length < 4) {
      const g = FAIR_GOODS[Math.floor(Math.random() * FAIR_GOODS.length)];
      if (!opts.includes(g)) opts.push(g);
    }
    opts.sort(() => Math.random() - 0.5);
    const who = CUSTOMER_NAMES[Math.floor(Math.random() * CUSTOMER_NAMES.length)];
    const seconds = Math.max(1.8, 4 - i * 0.35);
    const items = opts.map(([id, n]) => ({ t: n, icon: itemIcon(id), id }));
    openMini(
      `<h3>${iconHTML("bag", 20)}Feira de Cinzaluz · cliente ${i + 1}/${rounds}</h3>
       <p><b>${who}:</b> "Me vê um${want[1].endsWith("a") || want[1] === "Mel" ? "" : ""} pouco de <b style="color:#f2c14e">${want[1]}</b>, por favor!"</p>
       ${miniBar()}${miniButtons(items)}<p class="ds">Acertos: ${right}</p>`,
    );
    let answered = false;
    const pick = (k) => {
      if (answered) return;
      answered = true;
      clearInterval(miniTimer);
      if (k >= 0 && items[k].id === want[0]) {
        right++;
        playSound(880, 0.06, "sine");
      } else playSound(180, 0.12, "square");
      i++;
      setTimeout(next, 250);
    };
    bindMini(items, pick);
    miniCountdown(seconds, () => pick(-1));
  };
  const endFair = () => {
    const pay = Math.round((10 + right * 6) * needsPayMul());
    player.gold += pay;
    spendShift(3);
    addFriendship("rosa", right >= 5 ? 3 : 1);
    if (right === rounds) repAdd(1);
    saveGame();
    miniResult("Fim do turno na feira", [
      `Você atendeu ${right} de ${rounds} clientes direito.`,
      `Pagamento: <b style="color:#f2c14e">${pay} ouro</b>${needsPayMul() < 1 ? " (cansaço e necessidades baixas diminuíram o pagamento)" : ""}.`,
      right === rounds ? "A Rosa ficou impressionada! Reputação +1." : "",
    ]);
  };
  next();
}

/* ===================== TRABALHO 2: MINHA TENDINHA ===================== */

/** Produtos da tendinha: [id do ícone, nome, custo por unidade, valor justo]. */
const STALL_PRODUCTS = [
  { k: "pao", n: "Pão caseiro", cost: 3, value: 8 },
  { k: "canteen", n: "Suco de frutas", cost: 2, value: 6 },
  { k: "flower", n: "Buquê de flores", cost: 5, value: 14 },
  { k: "cake", n: "Bolo de pote", cost: 6, value: 16 },
  { k: "ring", n: "Bijuteria", cost: 12, value: 30 },
];
const STALL_LICENSE = 250;
const STALL_STOCK = 8;

function stallMenu() {
  if (!player.flags.stall)
    return choice(
      "Sua própria tendinha",
      `Uma licença da Prefeitura custa ${withTax(STALL_LICENSE)} de ouro (com Imposto Real). Com ela, você monta uma tenda na feira e vende o que quiser.`,
      [
        {
          t: `Comprar a licença (${withTax(STALL_LICENSE)} ouro)`,
          fn: () => {
            if (player.gold < withTax(STALL_LICENSE)) return say([["", "Você não tem ouro suficiente. Trabalhe na feira primeiro!"]]);
            payWithTax(STALL_LICENSE);
            player.flags.stall = true;
            saveGame();
            say([["", "Parabéns, empreendedor! Agora você tem uma tendinha na feira. Abra quando quiser pelo Quadro de Trabalhos."]]);
          },
        },
        { t: "Sair", fn: null },
      ],
    );
  if (currentHour() < 7 || currentHour() >= 19) return say([["", "A feira só funciona das 7h às 19h."]]);
  if (player.famDay.stall === player.day) return say([["", "Você já abriu a tendinha hoje. Amanhã tem mais!"]]);
  choice(
    "O que vender hoje?",
    `Você compra ${STALL_STOCK} unidades no atacado. O que não vender, estraga (menos bijuteria).`,
    STALL_PRODUCTS.map((p) => ({
      t: `${p.n} · custo ${p.cost * STALL_STOCK} ouro`,
      fn: () => stallPrice(p),
    })).concat([{ t: "Sair", fn: null }]),
  );
}
function stallPrice(p) {
  const total = p.cost * STALL_STOCK;
  if (player.gold < total) return say([["", `Você precisa de ${total} de ouro para comprar o estoque.`]]);
  choice(
    p.n,
    "Qual preço você vai cobrar? Mais caro dá mais lucro, mas espanta clientes.",
    [
      ["Barato", 0.8, 0.9],
      ["Justo", 1, 0.7],
      ["Caro", 1.4, 0.45],
      ["Abusivo (capitalismo!)", 2, 0.25],
    ].map(([n, mul, chance]) => ({
      t: `${n}: ${Math.round(p.value * mul)} ouro cada`,
      fn: () => {
        player.gold -= total;
        player.famDay.stall = player.day;
        stallGame(p, Math.round(p.value * mul), chance);
      },
    })),
  );
}
/** Minijogo: um marcador vai e volta; aperte "Anunciar!" na hora certa para atrair o cliente. */
function stallGame(p, price, baseChance) {
  const tries = 8;
  let i = 0,
    sold = 0,
    pos = 0,
    dir = 1;
  const zone = () => [0.38, 0.62];
  const render = (msg = "") =>
    openMini(
      `<h3>${iconHTML(p.k, 20)}Sua tendinha · ${p.n} a ${price} ouro</h3>
       <p>Aperte <b>Anunciar!</b> quando o marcador estiver na faixa verde. Cliente ${Math.min(i + 1, tries)}/${tries} · Vendidos: ${sold}/${STALL_STOCK}</p>
       <div style="position:relative;height:18px;background:#2a2238;border:1px solid #6a5a9a;margin:.6em 0">
         <div style="position:absolute;left:38%;width:24%;top:0;bottom:0;background:#3f7a3f"></div>
         <div id="stallmk" style="position:absolute;left:0;width:4%;top:-3px;bottom:-3px;background:#f2c14e"></div>
       </div>
       <p class="ds">${msg}</p>
       <div class="btns"><button id="stallgo">${iconHTML("chat", 20)}Anunciar! (Espaço)</button></div>`,
    );
  const step = () => {
    pos += dir * 0.035 * (1 + i * 0.12);
    if (pos > 0.96 || pos < 0) dir *= -1;
    const mk = byId("stallmk");
    if (mk) mk.style.left = pos * 100 + "%";
  };
  const shout = () => {
    const [a, b] = zone();
    const hit = pos + 0.02 >= a && pos + 0.02 <= b;
    // Mesmo acertando, o cliente pode achar caro. Boa fama ajuda.
    const chance = baseChance + ((player.rep ?? 50) - 50) / 250;
    let msg;
    if (hit && Math.random() < chance) {
      sold = Math.min(STALL_STOCK, sold + 1 + (Math.random() < chance / 2 ? 1 : 0));
      msg = "Vendeu! O cliente saiu sorrindo.";
      playSound(988, 0.06, "sine");
    } else if (hit) {
      msg = '"Tá caro, hein?" O cliente foi embora.';
      playSound(300, 0.1, "triangle");
    } else {
      msg = "Ninguém ouviu. Tente de novo no próximo cliente.";
      playSound(180, 0.1, "square");
    }
    i++;
    if (i >= tries || sold >= STALL_STOCK) return finish();
    render(msg);
    bindStall();
  };
  const bindStall = () => {
    byId("stallgo").onclick = shout;
    game.miniKeys = (k) => (k === " " || k === "Enter" || k === "1") && shout();
    clearInterval(miniTimer);
    miniTimer = setInterval(step, 30);
  };
  const finish = () => {
    clearInterval(miniTimer);
    const gross = sold * price;
    const tax = Math.floor(gross * TAX.sell * (player.spouse === "rainha" || festivalToday() ? 0 : 1));
    const net = Math.round((gross - tax) * needsPayMul());
    const spent = p.cost * STALL_STOCK;
    player.gold += net;
    if (p.k === "ring" && sold < STALL_STOCK) player.gold += (STALL_STOCK - sold) * p.cost; // bijuteria não estraga: devolve ao estoque
    player.taxPaid = (player.taxPaid || 0) + tax;
    player.stallProfit = (player.stallProfit || 0) + (net - spent);
    spendShift(4);
    addNeed("fun", 8);
    saveGame();
    const profit = net - spent + (p.k === "ring" ? (STALL_STOCK - sold) * p.cost : 0);
    miniResult("Fechando a tendinha", [
      `Vendeu ${sold} de ${STALL_STOCK} · Faturou ${gross} ouro.`,
      `Imposto Real sobre as vendas: −${tax} ouro.`,
      `Estoque: −${spent} ouro.`,
      `<b style="color:${profit >= 0 ? "#7ad36b" : "#ff8a8a"}">${profit >= 0 ? "Lucro" : "Prejuízo"}: ${profit} ouro</b>`,
      profit < 0 ? "Dica: preço abusivo espanta clientes. O mercado é cruel!" : "",
    ]);
  };
  render();
  bindStall();
}

/* ===================== TRABALHO 3: GUARDA REAL ===================== */

const GUARD_RANKS = [
  { n: "Recruta", pay: 1, need: 0 },
  { n: "Soldado", pay: 1.3, need: 4 },
  { n: "Sargento", pay: 1.6, need: 10 },
  { n: "Capitão da Guarda", pay: 2, need: 18 },
];
function guardRank() {
  const s = player.guardShifts || 0;
  return [...GUARD_RANKS].reverse().find((r) => s >= r.need);
}
const PASS_SEALS = ["crown", "star", "heart", "coin", "sword", "flower"];

/** Minijogo do portão: deixe entrar só quem tem o selo do dia. */
function guardJob() {
  if (currentHour() < 8 || currentHour() >= 20) return say([["Guarda Real", "O turno da Guarda é das 8h às 20h. Volte de manhã!"]]);
  if (lifeNeed("energy") < 15 && lifeMode()) return say([["Guarda Real", "Guarda sonolento não serve. Vá dormir, recruta!"]]);
  const seal = PASS_SEALS[player.day % PASS_SEALS.length];
  const rounds = 8;
  let i = 0,
    right = 0;
  const next = () => {
    if (i >= rounds) return endGuard();
    const ok = Math.random() < 0.55;
    const shown = ok ? seal : PASS_SEALS.filter((s) => s !== seal)[Math.floor(Math.random() * (PASS_SEALS.length - 1))];
    const who = CUSTOMER_NAMES[Math.floor(Math.random() * CUSTOMER_NAMES.length)];
    const seconds = Math.max(1.6, 3.2 - i * 0.2);
    const opts = [
      { t: "Deixar entrar", icon: "door" },
      { t: "Barrar!", icon: "anger" },
    ];
    openMini(
      `<h3>${iconHTML("sword", 20)}Portão do Castelo · visitante ${i + 1}/${rounds}</h3>
       <p>Selo do dia: ${iconHTML(seal, 28)} · Patente: <b>${guardRank().n}</b></p>
       <p><b>${who}</b> mostra o passe: ${iconHTML(shown, 36)}</p>
       ${miniBar()}${miniButtons(opts)}<p class="ds">Acertos: ${right}</p>`,
    );
    let answered = false;
    const pick = (k) => {
      if (answered) return;
      answered = true;
      clearInterval(miniTimer);
      const good = (k === 0 && ok) || (k === 1 && !ok);
      if (good) {
        right++;
        playSound(784, 0.06, "sine");
      } else playSound(160, 0.15, "square");
      i++;
      setTimeout(next, 250);
    };
    bindMini(opts, pick);
    miniCountdown(seconds, () => pick(-1));
  };
  const endGuard = () => {
    const before = guardRank();
    const good = right >= 6;
    if (good) player.guardShifts = (player.guardShifts || 0) + 1;
    player.flags.guardaReal = true;
    const rank = guardRank();
    const pay = Math.round((15 + right * 4) * rank.pay * needsPayMul());
    player.gold += pay;
    spendShift(4);
    if (right === rounds) repAdd(1);
    saveGame();
    miniResult("Fim do turno na Guarda Real", [
      `Você acertou ${right} de ${rounds} visitantes.`,
      `Soldo: <b style="color:#f2c14e">${pay} ouro</b> · Patente: ${rank.n}.`,
      rank !== before ? `<b style="color:#7ad36b">Promoção! Agora você é ${rank.n}.</b>` : good ? "Turno exemplar: conta para a próxima promoção." : "Turno ruim: não conta para promoção (precisa de 6 acertos).",
      right === rounds ? "A Rainha soube do seu trabalho. Reputação +1." : "",
    ]);
  };
  next();
}

/* ===================== MENUS ===================== */

/** Quadro de Trabalhos no modo vida. */
function lifeJobsMenu() {
  const r = guardRank();
  choice(
    "Quadro de Trabalhos",
    `Trabalho cansa: gasta energia, fome e sede. Necessidades baixas diminuem o pagamento.<br>Guarda Real: ${r.n} · Tendinha: ${player.flags.stall ? "sua!" : "sem licença"}`,
    [
      { t: "Atender na feira (3h · minijogo)", fn: fairJob },
      { t: player.flags.stall ? "Abrir minha tendinha (4h · minijogo)" : "Ter minha própria tendinha", fn: stallMenu },
      { t: `Turno na Guarda Real (4h · minijogo) · ${r.n}`, fn: guardJob },
      { t: "Ver tarefas do quadro", fn: () => openJobs(true) },
      { t: "Sair", fn: null },
    ],
  );
}

/** Opções extras em casa no modo vida. */
function lifeHomeItems() {
  if (!lifeMode()) return [];
  return [
    {
      t: "Tomar banho (30 min)",
      fn: () => {
        player[`hygiene`] = 100;
        player.clock = Math.min(1439, player.clock + 30);
        saveGame();
        say([["", "Água quentinha e sabão de ervas. Higiene cheia!"]]);
      },
    },
  ];
}

/** Texto do objetivo no topo da tela, no modo vida. */
function lifeGoalText() {
  const low = Object.keys(LIFE_NEEDS).find((k) => lifeNeed(k) < 20);
  if (low) return `! ${LIFE_NEEDS[low].n} baixa: ${LIFE_NEEDS[low].low}`;
  if (starving()) return "! Coma e beba alguma coisa!";
  const r = guardRank();
  return `Simulador de Vida · ${player.gold} ouro · Guarda: ${r.n}${player.flags.stall ? " · Tem tendinha" : ""}`;
}
