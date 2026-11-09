/**
 * ECOS DO ARCANO — festivais-amizades-e-dialogos.js
 * Festivais, amizades, romance e diálogos dos personagens.
 */

/* ===================== FESTIVAIS ===================== */

const FEST_NPC = [29, 17];
function festivalMenu() {
  const fe = festivalToday(),
    k = "fest" + player.day,
    did = (a) => player.famDay[k + a];
  const opts = [];
  opts.push({
    t: did("d") ? "Dançar (já dançou hoje)" : "Dançar na praça ♪",
    fn: () => {
      if (did("d")) return;
      player.famDay[k + "d"] = 1;
      playTune();
      player.mp = maxMp();
      Object.keys(FRIENDS).forEach((id) => addFriendship(id, 2));
      saveGame();
      say([
        ["", "Você dança no meio da praça com os moradores. Todos riem e batem palmas!"],
        ["", "MP restaurado e a amizade com todos aumentou."],
      ]);
    },
  });
  opts.push({
    t: did("b") ? "Banquete (já comeu)" : "Banquete do festival (grátis)",
    fn: () => {
      if (did("b")) return;
      player.famDay[k + "b"] = 1;
      player.food = 100;
      player.water = 100;
      player.hp = maxHp();
      saveGame();
      say([["", "Mesas cheias de comida! Você come até não aguentar mais. Fome, sede e HP cheios."]]);
    },
  });
  opts.push({
    t: "Jogo das argolas (5 ouro)",
    fn: () => {
      if (player.gold < 5) {
        say([["Organizadora", "Precisa de 5 de ouro para jogar!"]]);
        return;
      }
      player.gold -= 5;
      if (Math.random() < 0.45) {
        const pool = ["pocaoG", "eterG", "fragmento", "elixir", "festa"];
        const pr = pool[Math.floor(Math.random() * pool.length)];
        if (pr === "festa") {
          (player.owned.hat = player.owned.hat || []).includes("festa")
            ? addItem("pocaoG")
            : player.owned.hat.push("festa");
        } else addItem(pr);
        playSound(880, 0.15, "sine");
        saveGame();
        say([
          [
            "Organizadora",
            `Na mosca! Você ganhou: ${pr === "festa" ? "Chapéu de Festa (visual)" : ITEMS[pr].nome}!`,
          ],
        ]);
      } else {
        playSound(200, 0.1, "square");
        say([["Organizadora", "Quase! A argola bateu na borda. Tenta de novo?"]]);
      }
    },
  });
  opts.push({
    t: did("f") ? "Concurso de fantasia (já participou)" : "Concurso de fantasia",
    fn: () => {
      if (did("f")) return;
      const fancy =
        ["gibao", "real", "capa"].includes(player.look.outfit) ||
        ["coroa", "tiara", "abas", "festa", "flor"].includes(player.look.hat);
      if (!fancy) {
        say([
          [
            "Organizadora",
            "Para o concurso você precisa de uma roupa ou chapéu especial. A Alfaiataria tem ótimas opções!",
          ],
        ]);
        return;
      }
      player.famDay[k + "f"] = 1;
      const g = 80 + player.lvl * 5;
      player.gold += g;
      repAdd(3);
      player.festWins = (player.festWins || 0) + 1;
      saveGame();
      playSound(784, 0.2, "sine");
      say([
        ["Organizadora", "E a vencedora do concurso de fantasia é... você! Que visual!"],
        ["", `Prêmio: ${g} de ouro!`],
      ]);
    },
  });
  if (isNight())
    opts.push({
      t: "Assistir aos fogos",
      fn: () => {
        game.fwBoost = 6;
        playTune();
        toast("Que espetáculo! O céu de Cinzaluz se enche de cores.");
      },
    });
  opts.push({
    t: "Sair",
    fn: null,
  });
  choice(
    fe.n,
    `A praça está enfeitada e cheia de gente. ${isNight() ? "Os fogos vão começar!" : "À noite tem fogos de artifício!"} A festa vai até tarde: hoje ninguém dorme cedo.`,
    opts,
  );
}
function drawFestival(t) {
  const fe = festivalToday();
  if (!fe || player.zone !== "vila") return;
  const lines = [
    [
      [25, 15],
      [38, 15],
    ],
    [
      [25, 24],
      [38, 24],
    ],
    [
      [25, 15],
      [25, 24],
    ],
    [
      [38, 15],
      [38, 24],
    ],
    [
      [25, 15],
      [38, 24],
    ],
    [
      [38, 15],
      [25, 24],
    ],
  ];
  for (const [[ax, ay], [bx, by]] of lines) {
    const X1 = ax * TILE + 16,
      Y1 = ay * TILE - 6,
      X2 = bx * TILE + 16,
      Y2 = by * TILE - 6,
      n = Math.round(Math.hypot(X2 - X1, Y2 - Y1) / 18);
    ctx.strokeStyle = "#5a3a22";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(X1, Y1);
    ctx.quadraticCurveTo((X1 + X2) / 2, (Y1 + Y2) / 2 + 20, X2, Y2);
    ctx.stroke();
    for (let i = 1; i < n; i++) {
      const k = i / n,
        x = X1 + (X2 - X1) * k,
        y = Y1 + (Y2 - Y1) * k + Math.sin(k * Math.PI) * 16;
      ctx.fillStyle = fe.c[i % fe.c.length];
      if (fe.n.includes("Lanternas")) {
        ctx.fillRect(x - 3, y, 7, 8);
        if (isNight()) {
          ctx.fillStyle = "rgba(255,200,90,.25)";
          circle(x, y + 4, 9);
        }
      } else fillPolygon(x - 5, y, x + 5, y, x, y + 9);
    }
  }
  const [fx, fy] = FEST_NPC;
  drawSprite(
    wizardRects("#e066a4", "#6a2a5a", null, null, "down"),
    fx * TILE,
    fy * TILE + Math.sin(t * 3) * 1,
    2,
  );
  ctx.fillStyle = "#f2c14e";
  ctx.font = "12px sans-serif";
  ctx.textAlign = "center";
  drawPixelIcon("party", fx * TILE + 16, fy * TILE - 6);
  for (const p of game.fw || []) {
    ctx.globalAlpha = Math.max(0, p.l / p.m);
    ctx.fillStyle = p.c;
    ctx.fillRect(p.x - 1.5, p.y - 1.5, 3, 3);
  }
  ctx.globalAlpha = 1;
}
function updateFestival(dt) {
  game.fw = (game.fw || []).filter((p) => {
    p.l -= dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 40 * dt;
    return p.l > 0;
  });
  const fe = festivalToday();
  if (!fe || player.zone !== "vila" || !isNight()) return;
  game.fwT = (game.fwT || 0) - dt * ((game.fwBoost || 0) > 0 ? 3 : 1);
  if (game.fwBoost > 0) game.fwBoost -= dt;
  if (game.fwT <= 0) {
    game.fwT = 0.7 + Math.random() * 0.6;
    const cx = (26 + Math.random() * 12) * TILE,
      cy = (9 + Math.random() * 6) * TILE,
      c = fe.c[Math.floor(Math.random() * fe.c.length)];
    for (let i = 0; i < 34; i++) {
      const a = Math.random() * Math.PI * 2,
        v = 50 + Math.random() * 80;
      game.fw.push({
        x: cx,
        y: cy,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v,
        l: 1.4,
        m: 1.4,
        c: Math.random() < 0.3 ? "#fff" : c,
      });
    }
    playSound(300 + Math.random() * 300, 0.08, "triangle", 0.02);
  }
}
/* ---- prédios da vila ---- */

const RESIDENT = [
  "Ninguém atende. Deve estar no mercado.",
  'Uma senhora acena da janela: "Cuidado com os lobos, criança!"',
  "Você ouve uma criança praticando flauta lá dentro.",
  '"Volte mais tarde, estou fazendo o almoço!"',
  'Um velhinho sorri: "No meu tempo a magia acendia as lareiras sozinha..."',
];
function bldAction(b) {
  if (!b) return;
  if (crewDoor(b) || lifeHouseDoor(b) || storyBuilding(b) || lighthouseDoor(b)) return;
  if (sleepTime() && !festivalToday() && CLOSED_STYLES.has(b.style)) {
    say([["", `${b.name || "A loja"} está fechada. Todos foram dormir. Abre às 6h.`]]);
    return;
  }
  if (b.name && ENTER_STYLES.has(b.style)) {
    enterBuilding(b);
    return;
  }
  bldService(b);
}
function bldService(b) {
  if (!b) return;
  if (b.style === "escola") {
    if (SPECIAL_SCHOOLS[b.id]) specialSchoolMenu(b.id);
    else schoolMenu();
    return;
  }
  if (b.inn) {
    choice(b.name, `Um quarto limpo e uma cama macia por ${withTax(b.inn)} de ouro a noite (com Imposto Real).`, [
      {
        t: `Dormir até o amanhecer (${withTax(b.inn)} ouro)`,
        fn: () => {
          if (player.gold < withTax(b.inn)) {
            say([["", "Você não tem ouro suficiente."]]);
            return;
          }
          payWithTax(b.inn);
          player.clock = 6 * 60;
          player.day++;
          player.hp = maxHp();
          player.mp = maxMp();
          player.stamina = 100;
          player.food = Math.max(0, player.food - 15);
          player.water = Math.max(0, player.water - 15);
          player.checkpoint =
            player.zone === "interior" && player.ret
              ? {
                  zone: player.ret.zone,
                  x: player.ret.x,
                  y: player.ret.y,
                }
              : {
                  zone: player.zone,
                  x: player.x,
                  y: player.y,
                };
          game.fade = 1;
          saveGame();
          say([["", "Você dorme bem. Bom dia! HP e MP restaurados. Jogo salvo."]]);
        },
      },
      {
        t: "Sair",
        fn: null,
      },
    ]);
    return;
  }
  if (b.cos) {
    openCosmetic(b.cos);
    return;
  }
  if (b.shop && b.style !== "taverna") {
    openShop(b.shop);
    return;
  }
  if (b.shop && b.style === "taverna" && player.zone !== "vila") {
    choice(b.name, "Marinheiros cantam e o cheiro de peixe frito enche o salão.", [
      {
        t: "Comprar comida e bebida",
        fn: () => openShop(b.shop),
      },
      {
        t: "Ouvir boatos (5 ouro)",
        fn: rumor,
      },
      {
        t: "Jogar dados (10 ouro)",
        fn: playDice,
      },
      {
        t: "Sair",
        fn: null,
      },
    ]);
    return;
  }
  if (b.style === "mina") {
    enterMine();
    return;
  }
  if (b.style === "minaVelha") {
    if (player.relDay["mina"] === player.day) {
      say([["", "Seus braços ainda doem da mineração de hoje. Volte amanhã."]]);
      return;
    }
    player.relDay["mina"] = player.day;
    player.clock = Math.min(1439, player.clock + 120);
    player.food = Math.max(0, player.food - 12);
    player.water = Math.max(0, player.water - 12);
    const got = Math.random() < 0.15 ? "fragmento" : Math.random() < 0.5 ? "cristal" : "pedra";
    addItem(got);
    addItem("pedra");
    game.fade = 1;
    saveGame();
    say([
      ["", "Você passa 2 horas minerando com os anões de Pedravale."],
      ["", `Você encontrou: ${ITEMS[got].nome} e uma Pedra de Golem!`],
    ]);
    return;
  }
  if (b.style === "farol") {
    say([
      [
        "",
        "Do alto do farol você vê o mar inteiro. Dizem que barcos de terras distantes chegam aqui com tesouros.",
      ],
    ]);
    return;
  }
  if (b.style === "estab" && player.zone !== "vila") {
    carriageMenu();
    return;
  }
  switch (b.style) {
    case "home":
      enterHouse();
      break;
    case "padaria":
      openShop("padaria");
      break;
    case "taverna":
      tavernMenu();
      break;
    case "guilda":
      choice(
        "Guilda dos Aventureiros",
        'A mestre Helga levanta os olhos do mapa: "Procurando trabalho, aprendiz?"',
        [
          {
            t: "Ver quadro de trabalhos",
            fn: openJobs,
          },
          {
            t: "Conversar com Helga",
            fn: () =>
              say([
                ["Mestre Helga", "Faça trabalhos, ganhe ouro e fama. Os moradores lembram de quem ajuda."],
                ["Mestre Helga", "Os trabalhos mudam todo dia. Caçar, colher, entregar: tudo paga."],
              ]),
          },
          {
            t: "Sair",
            fn: null,
          },
        ],
      );
      break;
    case "biblio":
      say([
        [
          "Biblioteca de Cinzaluz",
          [
            'Um livro aberto diz: "As runas se combinam: duas runas iguais formam o feitiço mais forte daquele elemento."',
            "Um mapa antigo mostra a Academia Arcana no noroeste da vila, atrás de colunas quebradas.",
            'Anotação na margem: "Guardiões ficam fracos contra a runa recuperada por último."',
            "Um tratado diz que a Pena da Fênix só aparece em baús dourados ou em trocas raríssimas.",
          ][Math.floor(Math.random() * 4)],
        ],
      ]);
      break;
    case "castle":
      castleMenu();
      break;
    case "templo":
      templeMenu();
      break;
    case "hosp":
      healerMenu();
      break;
    case "forja":
      openShop("ferreiro");
      break;
    case "alfaiate":
      choice("Alfaiataria Fio de Prata", "A costureira mostra rolos de tecido e chapéus pendurados.", [
        {
          t: "Roupas, chapéus e cores (visual)",
          fn: () => openCosmetic("roupa"),
        },
        {
          t: "Mantos mágicos (equipamento)",
          fn: () => openShop("alfaiate"),
        },
        {
          t: "Sair",
          fn: null,
        },
      ]);
      break;
    case "salao":
      openCosmetic("cabelo");
      break;
    case "troca":
      openTrade();
      break;
    case "estab":
      socialMenu("cocheiro");
      break;
    case "moinho":
      say([["", "As pás do moinho rangem ao vento. Lá dentro, sacos de farinha para a padaria."]]);
      break;
    case "celeiro":
      say([["", "O celeiro cheira a feno. Galinhas cacarejam do lado de fora."]]);
      break;
    default: {
      const k = b.id + player.day;
      if (!player.relDay[k] && Math.random() < 0.3) {
        player.relDay[k] = 1;
        addItem("maca");
        say([["", 'Um morador abre a porta e te dá uma Maçã Dourada. "Para a viagem!"']]);
      } else say([["", RESIDENT[Math.floor(Math.random() * RESIDENT.length)]]]);
    }
  }
}
function playTune() {
  [523, 659, 784, 659, 880, 784].forEach((f, i) =>
    setTimeout(() => playSound(f, 0.22, "triangle", 0.04), i * 180),
  );
}
const DRINKS = [
  ["cerveja", "Caneca de cerveja ", 6, 24, ""],
  ["preta", "Cerveja preta ", 9, 32, ""],
  ["sidra", "Sidra de maçã ", 8, 18, "hp"],
  ["vinho", "Vinho tinto ", 12, 30, "mp"],
  ["licor", "Licor de frutas vermelhas ", 10, 26, "rel"],
  ["hidromel", "Hidromel forte ", 14, 40, ""],
  ["fogo", "Fogo Anão (aguardente) ", 20, 55, "cor"],
  ["suco", "Suco de uva ", 4, 0, "water"],
  ["chaq", "Chá quente ", 3, -15, "water"],
];
function drinksMenu() {
  choice(
    "Bebidas do Gus",
    '"O que vai ser hoje?" ' +
      ((player.drunk || 0) >= 30 ? "<br><i>Você já está um pouco alegre...</i>" : ""),
    DRINKS.map(([id, nm, pr, dk, fx]) => ({
      t: `${nm} · ${withTax(pr)} ouro`,
      fn: () => {
        if (player.gold < withTax(pr)) {
          say([["Gus, o Taverneiro", "Sem ouro, sem bebida!"]]);
          return;
        }
        if (fx === "hp") player.hp = Math.min(maxHp(), player.hp + 15);
        if (fx === "mp") player.mp = Math.min(maxMp(), player.mp + 15);
        if (fx === "cor") {
          player.liquidCourage = true;
          toast("Coragem líquida! +15% de dano na próxima batalha.", 3000);
        }
        if (fx === "rel") {
          player.charm = player.day;
        }
        if (fx === "water") player.water = Math.min(100, player.water + 35);
        if (dk <= 0) {
          payWithTax(pr);
          player.drunk = Math.max(0, (player.drunk || 0) + dk);
          toast(dk < 0 ? "A bebida quente clareia sua cabeça." : "Refrescante!");
          return;
        }
        drink(dk, pr, nm.replace(/ [^ ]+$/, "").toLowerCase());
      },
    })).concat([
      {
        t: "Voltar",
        fn: tavernMenu,
      },
    ]),
  );
}
function tavernParty() {
  const h = currentHour();
  return h >= 18 || h < 2;
}
function drinkingContest() {
  if (player.gold < 20) {
    say([["Gus, o Taverneiro", "A aposta é 20 de ouro!"]]);
    return;
  }
  player.gold -= 20;
  const rivals = ["Grandalhão Bruto", "Anão Thorin", "Marinheira Rita", "Velho Joca"],
    rv = rivals[Math.floor(Math.random() * rivals.length)],
    tol = 3 + Math.floor(Math.random() * 4);
  let r = 0;
  const round = () => {
    r++;
    player.drunk = Math.min(110, (player.drunk || 0) + 18);
    if (player.drunk >= 100) {
      say(
        [
          ["", `Rodada ${r}... tudo gira... você cai da cadeira!`],
          [rv, "HAHAHA! Mais um que não aguenta!"],
        ],
        passOut,
      );
      return;
    }
    if (r >= tol) {
      player.gold += 60;
      repAdd(1);
      player.contestWin = player.day;
      saveGame();
      say([
        ["", `Rodada ${r}: ${rv} desaba em cima da mesa!`],
        [
          "Gus, o Taverneiro",
          `Temos ${genderWord("um campeão", "uma campeã", "ume campeã")}! ${player.name} leva 60 de ouro!`,
        ],
      ]);
      return;
    }
    choice(
      `Rodada ${r}`,
      `${rv} vira o caneco e te encara. Você está ${player.drunk < 40 ? "firme" : player.drunk < 70 ? "tont" + genderWord("o", "a", "e") : "quase caindo"}.`,
      [
        {
          t: "Beber mais uma!",
          fn: round,
        },
        {
          t: "Desistir",
          fn: () =>
            say([
              [rv, "Fraco! Hahaha!"],
              ["", "Você perdeu a aposta."],
            ]),
        },
      ],
    );
  };
  say(
    [["Gus, o Taverneiro", `Concurso de bebida! ${player.name} contra ${rv}. Quem cair primeiro perde!`]],
    round,
  );
}
function armWrestle() {
  if (player.gold < 15) {
    say([["Gus, o Taverneiro", "Aposta de 15 de ouro!"]]);
    return;
  }
  player.gold -= 15;
  const ch =
    0.35 +
    player.lvl * 0.03 +
    (player.look.outfit === "gibao" ? 0.1 : 0) -
    ((player.drunk || 0) > 50 ? 0.1 : 0);
  if (Math.random() < ch) {
    player.gold += 32;
    repAdd(1);
    saveGame();
    say([
      ["", "Você segura firme... e derruba o braço do adversário na mesa! BAM!"],
      ["", "A taverna vibra! +32 de ouro."],
    ]);
  } else
    say([
      ["", "O adversário vira seu braço sem esforço. Ai!"],
      ["", "Você perdeu 15 de ouro."],
    ]);
}
function karaoke() {
  const good = Math.random() < 0.55 - ((player.drunk || 0) > 50 ? 0.2 : 0);
  if (good) {
    repAdd(2);
    player.mp = maxMp();
    playTune();
    say([
      ["", "Você sobe no palco com o Bardo Lírio e canta com toda a alma!"],
      ["", "A taverna aplaude de pé! Reputação +2 e MP cheio."],
    ]);
  } else {
    repAdd(-1);
    playSound(150, 0.3, "square");
    say([
      ["", "Você desafina tanto que um cachorro começa a uivar lá fora."],
      ["", "Algumas risadas... reputação -1."],
    ]);
  }
}
function tavernMenu() {
  const party = tavernParty();
  choice(
    "Taverna Javali Dourado" + (party ? " ·  Noite de festa!" : ""),
    party
      ? "A taverna está lotada! Música alta, gente dançando nas mesas e canecos voando."
      : "Cheiro de ensopado, risadas e o som do alaúde. O taverneiro Gus enxuga um caneco." +
          "<br><i>Toda noite, das 18h às 2h, tem festa!</i>",
    [
      {
        t: " Pedir bebidas",
        fn: drinksMenu,
      },
      {
        t: "Mural dos Corações (namoro e casamento)",
        icon: "heart",
        fn: heartBoardMenu,
      },
      ...(party
        ? [
            {
              t: " Dançar no salão",
              fn: () => {
                if (player.famDay["tdance"] === player.day) {
                  say([["", "Suas pernas não aguentam mais dançar hoje!"]]);
                  return;
                }
                player.famDay["tdance"] = player.day;
                player.mp = maxMp();
                Object.keys(FRIENDS).forEach((k) => addFriendship(k, 1));
                repAdd(1);
                playTune();
                say([
                  ["", "Você dança até o chão tremer! Todo mundo entra na roda."],
                  ["", "MP cheio, +amizade com todos e reputação +1."],
                ]);
              },
            },
            {
              t: " Concurso de bebida (aposta 20)",
              fn: drinkingContest,
            },
            {
              t: " Queda de braço (aposta 15)",
              fn: armWrestle,
            },
            {
              t: " Cantar com o bardo",
              fn: karaoke,
            },
          ]
        : []),
      {
        t: "Comprar comida e bebida",
        fn: () => openShop("taverna"),
      },
      {
        t: "Ouvir boatos (5 ouro)",
        fn: rumor,
      },
      {
        t: "Ouvir fofocas sobre você  (3 ouro)",
        fn: () => {
          if (player.gold < 3) {
            say([["Gus, o Taverneiro", "Fofoca boa custa 3 de ouro!"]]);
            return;
          }
          player.gold -= 3;
          hearGossip();
        },
      },
      {
        t: "Pagar uma rodada para todos (40 ouro)",
        fn: () => {
          if (player.gold < 40) {
            say([["Gus, o Taverneiro", "Uma rodada para todo mundo custa 40!"]]);
            return;
          }
          player.gold -= 40;
          repAdd(3);
          Object.keys(FRIENDS).forEach((k) => addFriendship(k, 1));
          player.drunk = Math.min(110, (player.drunk || 0) + 15);
          playTune();
          saveGame();
          say(
            [
              ["", 'A taverna inteira levanta os canecos: "Um viva para ' + player.name + '!"'],
              ["", "Reputação +3 e todos gostam um pouco mais de você."],
            ],
            () => {
              if (player.drunk >= 100) passOut();
            },
          );
        },
      },
      ...((player.drunk || 0) > 0
        ? [
            {
              t: "Beber água para ficar sóbrio (1 ouro)",
              fn: () => {
                if (player.gold < 1) return;
                player.gold -= 1;
                player.drunk = Math.max(0, player.drunk - 25);
                player.water = Math.min(100, player.water + 30);
                toast("Você bebe água. A cabeça clareia um pouco.");
              },
            },
          ]
        : []),
      {
        t: "Jogar dados (aposta de 10 ouro)",
        fn: playDice,
      },
      {
        t: "Pedir uma música ao bardo",
        fn: () => {
          playTune();
          player.mp = Math.min(maxMp(), player.mp + 10);
          toast("A música enche seu coração: +10 MP.");
        },
      },
      {
        t: "Alugar um quarto (25 ouro)",
        fn: () => {
          if (player.gold < 25) {
            say([["Gus, o Taverneiro", "Sem ouro, sem cama. Sua casa é de graça, sabia?"]]);
            return;
          }
          player.gold -= 25;
          player.clock = 6 * 60;
          player.day++;
          player.hp = maxHp();
          player.mp = maxMp();
          player.stamina = 100;
          player.food = Math.max(0, player.food - 15);
          player.water = Math.max(0, player.water - 15);
          game.fade = 1;
          saveGame();
          say([["", "Você dorme num quarto quentinho em cima da taverna. Bom dia! HP e MP restaurados."]]);
        },
      },
      {
        t: "Sair",
        fn: null,
      },
    ],
  );
}
function rumor() {
  if (player.gold < 5) {
    say([["Gus, o Taverneiro", "Boato bom custa 5 de ouro, amigo."]]);
    return;
  }
  player.gold -= 5;
  const ids = Object.keys(FRIENDS).filter((id) => friendshipLevel(id) < 1 && !player.relRew[id + "fav"]);
  if (ids.length && Math.random() < 0.5) {
    const id = ids[Math.floor(Math.random() * ids.length)];
    player.relRew[id + "fav"] = 1;
    saveGame();
    say([
      [
        "Gus, o Taverneiro",
        `Ouvi dizer que ${NPCS[id].nome} adora ganhar ${ITEMS[FRIENDS[id].fav].nome}. Fica a dica!`,
      ],
    ]);
    return;
  }
  const R = [
    "Dizem que baús dourados escondem itens lendários. Vi um brilhando nos Picos Uivantes.",
    "O Zaid paga caro por Fragmentos Arcanos. Monstros soltam mais deles à noite.",
    "A Academia em ruínas tem um Diretor fantasma. Ele guarda um cajado poderoso.",
    "A Rainha recompensa quem liberta um Guardião. Já foi ao castelo?",
    "Os monstros atacam a vila de vez em quando, principalmente de noite.",
    "O Templo dá bênçãos que deixam você mais forte por um dia.",
  ];
  say([["Gus, o Taverneiro", R[Math.floor(Math.random() * R.length)]]]);
}
function playDice() {
  if (player.gold < 10) {
    say([["Jogador de Dados", "Volte quando tiver 10 de ouro pra apostar!"]]);
    return;
  }
  const a = 1 + Math.floor(Math.random() * 6),
    b = 1 + Math.floor(Math.random() * 6),
    c = 1 + Math.floor(Math.random() * 6),
    d = 1 + Math.floor(Math.random() * 6);
  const win = a + b > c + d;
  player.gold += win ? 10 : -10;
  playSound(win ? 880 : 200, 0.15, win ? "sine" : "square");
  saveGame();
  say([
    [
      "Jogador de Dados",
      `Seus dados: ${a} + ${b} = ${a + b}. Os meus: ${c} + ${d} = ${c + d}. ${win ? "Você ganhou 10 de ouro!" : a + b === c + d ? "Empate... mas a casa leva. -10 ouro." : "Perdeu! -10 ouro."}`,
    ],
  ]);
}
function castleMenu() {
  const n = "Rainha Aurélia";
  const g = guardiansFreed();
  const pend = ["bosque", "pantano", "picos"].filter(
    (z) => player.guards.includes(z) && !player.royal.includes(z),
  );
  choice(
    "Castelo de Cinzaluz",
    "Os guardas abrem o portão. No salão do trono, a Rainha Aurélia recebe você.",
    [
      {
        t: "Audiência com a Rainha",
        fn: () => {
          if (pend.length) {
            const gold = pend.length * 120;
            player.gold += gold;
            player.royal.push(...pend);
            addFriendship("odelia", 5);
            saveGame();
            say([
              [
                n,
                `Cinzaluz canta outra vez graças a você. ${pend.length > 1 ? "Os Guardiões foram libertados" : "Um Guardião foi libertado"}!`,
              ],
              [n, `Aceite ${gold} de ouro do tesouro real. O reino agradece.`],
            ]);
          } else if (g === 0)
            say([
              [n, `Então você é ${player.name}, de quem Odelia fala. O reino está nas suas mãos.`],
              [n, "Liberte os Guardiões e eu recompensarei cada vitória com ouro do tesouro real."],
            ]);
          else if (g < 3)
            say([
              [
                n,
                `Já são ${g} Guardiões livres. Continue, aprendiz. Cada um que você liberta vale uma recompensa.`,
              ],
            ]);
          else
            say([
              [
                n,
                "As quatro runas estão com você. A Torre do Silêncio espera ao sul. Que a Canção Arcana te proteja.",
              ],
            ]);
        },
      },
      {
        t: `Trabalhar na Guarda Real (patrulha) · ${guardRank().n}`,
        fn: () => {
          if (player.job) return professionsMenu();
          if (currentHour() < 6 || currentHour() >= 19) return say([["Guarda Real", "O turno da Guarda começa entre 6h e 19h."]]);
          startJob("guarda");
        },
      },
      {
        t: player.spouse === "rainha" ? "Ver sua esposa, a Rainha ♥" : "Conversar com a Rainha (amizade)",
        fn: () => socialMenu("rainha"),
      },
      {
        t: "Admirar o salão",
        fn: () =>
          say([
            [
              "",
              "Tapeçarias contam a história das Quatro Runas. Uma delas mostra dois irmãos magos de mãos dadas.",
            ],
          ]),
      },
      {
        t: "Sair",
        fn: null,
      },
    ],
  );
}
function templeMenu() {
  const n = "Padre Anselmo";
  choice("Templo da Luz", "Velas tremulam diante de um vitral com as Quatro Runas.", [
    { t: "Adotar uma criança (doação de 50 ouro)", fn: adoptChild },
    {
      t: player.blessDay === player.day ? "Bênção ativa hoje" : "Receber bênção (20 ouro)",
      fn: () => {
        if (player.blessDay === player.day) {
          say([[n, "A luz já está com você hoje."]]);
          return;
        }
        if (player.gold < 20) {
          say([[n, "Uma pequena oferta de 20 de ouro é pedida para a bênção."]]);
          return;
        }
        player.gold -= 20;
        player.blessDay = player.day;
        playSound(784, 0.3, "sine");
        saveGame();
        say([
          [n, "Que a luz guie seus feitiços."],
          ["", "Bênção recebida! Até o fim do dia: +10% de dano e -10% de dano recebido."],
        ]);
      },
    },
    ...(!player.flags.vitral && guardiansFreed() >= 2
      ? [
          {
            t: " Provação do Vitral (runa escondida)",
            fn: () =>
              say(
                [
                  [
                    "Padre Anselmo",
                    "O vitral guarda um espírito antigo e uma runa perdida. Só quem libertou Guardiões pode tentar.",
                  ],
                  ["Padre Anselmo", "Prepare-se. Que a luz te proteja."],
                ],
                () => startBattle("vitral", null),
              ),
          },
        ]
      : []),
    {
      t: "Rezar em silêncio",
      fn: () => {
        if (player.relDay["reza"] === player.day) {
          toast("Você já rezou hoje.");
          return;
        }
        player.relDay["reza"] = player.day;
        player.mp = maxMp();
        saveGame();
        toast("Uma paz profunda: MP restaurado.");
      },
    },
    {
      t: "Sair",
      fn: null,
    },
  ]);
}
/* ---- escolhas, casa, curandeira, treino ---- */

/** Ícone de cada opção de menu, pelo que ela faz. */
// A ordem importa: a primeira regra que bater define o ícone. Sem regra, o botão fica sem ícone.
const CHOICE_ICONS = [
  [/^(Sair|Cancelar|Voltar|Fugir|Desistir|Fechar)/, "door"],
  [/Enfrentar o Guardião|Barreira|GUERRA|Ataque!/, "skull"],
  [/^Entrar|porta/, "door"],
  [/^Falar com|^Conversar com/, "chat"],
  [/Cortar árvore|tora/, "axe"],
  [/Colher trigo|feixe|Trigo/, "wheat"],
  [/Quebrar pedra|Minerar|minério|Fragmento|Cristal/, "pick"],
  [/caixa|Entregar/, "crate"],
  [/Prender|ladrão|Ladrão|Pega ladrão/, "sword"],
  [/Atender cliente|cliente|Vendeu/, "bag"],
  [/Família|Saudar a família real|família real/, "crown"],
  [/Boneco de treino|Treine|Golpe/, "sword"],
  [/Examinar|Ver:|Ler/, "eye"],
  [/Beber água|Sede|sede|chuva/i, "water"],
  [/Pescar|peixe|Pescou/i, "fish"],
  [/Festival|festa|Banquete/i, "party"],
  [/Página|Missão|Pedido|Trabalhos|Quadro/, "scroll"],
  [/Nível|Promoção|Parabéns|Feliz aniversário|aniversário/, "star"],
  [/ouro|Ouro|Imposto|imposto|Aluguel|aluguel|Coletor/, "coin"],
  [/noite|Dormir|cochila|zzz|cansado|exausto/i, "zzz"],
  [/fome|Coma|Comer|pão|Pão/, "bread"],
  [/Guarda Real|Patrulh|Vigiar|portão/i, "sword"],
  [/Lenhador|lenha|Cortar/i, "axe"],
  [/Minera|mina\b|Minerar/i, "pick"],
  [/Fazend|Colheita|Plantar|campo/i, "wheat"],
  [/Ferreir|Forja|Martel/i, "hammer"],
  [/Carregador|Entreg|caixa|Carga/i, "crate"],
  [/Carruagem|cavalo|Viajar|Montar/i, "horse"],
  [/^Esperar|Passar o tempo|Avançar/i, "clock"],
  [/banho|Banho/, "bath"],
  [/tendinha|tenda|feira|Feira|Feirante/i, "bag"],
  [/Reino|guerra|Guerra|Alistar|exército/i, "flag"],
  [/Comprar|Vender|Loja|ouro\)|imposto|dote/, "coin"],
  [/Abraçar|Beijar|namorar|casamento|Namorar|Dançar juntos|Carinhos|Encontros|relacionamento|Rainha/, "heart"],
  [/Comer|refeição|Piquenique|Jantar|comida/i, "bread"],
  [/Beber água|Cantil/, "water"],
  [/Ler|livro|Estudar|Biblioteca/i, "book"],
  [/Visual|Guarda-roupa|roupa|Roupa|cabelo/i, "shirt"],
  [/Mascote|ração|Passear com/i, "paw"],
  [/Toca aqui/, "wave"],
  [/presente|Presente/, "gift"],
  [/Conversar|Falar|Ouvir|Perguntar|Fofoca|fofoca|Bater papo/, "chat"],
  [/Pedido|Entregar|Trabalh|Quadro/, "scroll"],
  [/Dormir|Descansar|cochilo/, "zzz"],
  [/briga|Soco|Gancho|Chute|Golpe|Bloquear|Esquivar/, "sword"],
  [/bebida|Beber|Cerveja|Taverna|Concurso/, "mug"],
  [/Cantar|Karaok|Dançar|música/, "note"],
  [/filho|Adotar|colo|cócegas|Bebê|bebê/, "baby"],
  [/Pescar|pesca/, "fish"],
  [/bênção|Bênção|Aula|Treinar|Rezar|Orar/, "sparkle"],
  [/Elixir|Poção|poção|Curar|Tratar/, "potion"],
  [/casa|Casa|Decorar/, "house"],
];
const choiceIcon = (text) => (CHOICE_ICONS.find(([re]) => re.test(text)) || [null, null])[1];

function choice(title, text, opts) {
  game.prevMode = game.mode === "choice" ? game.prevMode : game.mode;
  game.mode = "choice";
  game.choice = opts;
  if (renderPie(title, text, opts)) return;
  hidePie();
  byId("choice").innerHTML =
    `<h3>${title}</h3><p>${text}</p><div class="btns">${opts.map((o, i) => `<button data-i="${i}">${iconHTML(o.icon || choiceIcon(o.t) || "")}${i + 1}. ${o.t}</button>`).join("")}</div>`;
  byId("choice").style.display = "block";
  byId("choice")
    .querySelectorAll("button")
    .forEach((b) => (b.onclick = () => pickChoice(+b.dataset.i)));
}
function pickChoice(i) {
  const o = game.choice[i];
  byId("choice").style.display = "none";
  hidePie();
  game.mode = "world";
  if (o && o.fn) o.fn();
  // A interação com o personagem acabou (ninguém abriu outro menu): fecha o círculo.
  if (game.mode !== "choice") game.pieAnchor = null;
}
function restMenu() {
  choice("Sua casa", "Uma cama quente, uma lareira e silêncio. O que você quer fazer?", [
    {
      t: "Dormir até o amanhecer (recupera tudo)",
      fn: () => {
        player.clock = 6 * 60;
        player.day++;
        player.hp = maxHp();
        player.mp = maxMp();
        player.energy = 100;
        player.stamina = 100;
        if (lifeMode()) addNeed("fun", Math.round((homeComfort() - 1) * 40));
        player.food = Math.max(0, player.food - 20);
        player.water = Math.max(0, player.water - 20);
        player.checkpoint = {
          zone: "vila",
          x: 5,
          y: 18,
        };
        game.fade = 1;
        saveGame();
        playSound(330, 0.3, "sine");
        say(
          [["", "Você dorme profundamente. Um novo dia começa em Cinzaluz. HP e MP restaurados. Jogo salvo."]]
            .concat(
              player.injured
                ? [["", "Seus ferimentos ainda doem. Só a Curandeira Maíra pode tratá-los."]]
                : [],
            )
            .concat(
              player.food < 30 || player.water < 30
                ? [["", "Você acorda com fome e sede. Coma e beba algo (tecla I)."]]
                : [],
            ),
        );
      },
    },
    {
      t: "Guarda-roupa (trocar visual)",
      fn: () => showCreate("wardrobe"),
    },
    ...lifeHomeItems(),
    {
      t: "Cochilar 2 horas (recupera metade)",
      fn: () => {
        player.clock = (player.clock + 120) % 1440;
        player.hp = Math.min(maxHp(), player.hp + Math.round(maxHp() * 0.5));
        player.mp = Math.min(maxMp(), player.mp + Math.round(maxMp() * 0.5));
        player.food = Math.max(0, player.food - 6);
        player.water = Math.max(0, player.water - 6);
        addNeed("energy", 35);
        game.fade = 1;
        saveGame();
        toast(lifeMode() ? "Você cochila. Energia +35. Jogo salvo." : "Você cochila. HP e MP +50%. Jogo salvo.");
      },
    },
    {
      t: "Sair",
      fn: null,
    },
  ]);
}
function healerMenu() {
  const n = "Curandeira Maíra",
    cost = friendshipLevel("curandeira") >= 2 ? 0 : 15 + 5 * player.lvl;
  if (sickness() && !player.injured) {
    choice(n, `${sickness().desc}`, [...sickHealerItems(), { t: "Agora não", fn: null }]);
    return;
  }
  if (!player.injured && player.hp >= maxHp()) {
    say([
      [n, "Você está inteiro, aprendiz. Volte se os monstros pegarem pesado."],
      [n, "Lembre: poções curam HP, mas ferimentos graves só eu ou as Ervas Medicinais tratam."],
    ]);
    return;
  }
  choice(
    n,
    player.injured
      ? `Você está gravemente ferido: seu HP máximo caiu pela metade e sua magia enfraqueceu. O tratamento custa ${cost} de ouro.`
      : `Deixe-me cuidar desses machucados. Custa ${cost} de ouro.`,
    [
      {
        t: `Tratar ferimentos (${cost} ouro)`,
        fn: () => {
          let msg = "Pronto. Ferimentos tratados e vida restaurada. Tente não voltar tão cedo!";
          if (player.gold >= cost) player.gold -= cost;
          else if (!difficulty().heal) {
            say([[n, `Sinto muito, o tratamento custa ${cost} de ouro. Volte quando tiver.`]]);
            return;
          } else {
            msg =
              "Você não tem ouro suficiente... tudo bem, eu cuido de você assim mesmo. Pague quando puder.";
            player.gold = 0;
          }
          player.injured = false;
          player.hp = maxHp();
          player.mp = maxMp();
          playSound(660, 0.2, "sine");
          saveGame();
          say([[n, msg]]);
        },
      },
      ...sickHealerItems(),
      {
        t: "Agora não",
        fn: null,
      },
    ],
  );
}
function kaelTalk() {
  if (lifeMode())
    return [
      ["Instrutor Kael", "Magia? Isso é lenda. Aqui eu treino a Guarda Real: espada, escudo e disciplina."],
      ["Instrutor Kael", "Quer servir? Procure o castelo. E se for à Floresta Grande, leve um porrete: os ursos não perdoam."],
    ];
  const n = "Instrutor Kael";
  if (!player.flags.treino) {
    say(
      [
        [n, `Então você é ${player.name}, quem ouve as runas. Mostre o que sabe contra este boneco.`],
        [n, "Eu vou te guiar passo a passo. Leia as dicas no topo da tela."],
      ],
      () =>
        startBattle("boneco", null, {
          tut: true,
        }),
    );
    return null;
  }
  choice(n, "Quer treinar de novo? O boneco não morde... muito.", [
    {
      t: "Treinar contra o boneco",
      fn: () => startBattle("boneco", null, {}),
    },
    {
      t: "Pedir uma dica",
      fn: () =>
        say([
          [
            n,
            [
              "Cada inimigo tem fraquezas. Use a habilidade Olho Arcano para descobri-las.",
              "À noite os monstros batem mais forte. O Amuleto da Lua do Doran anula isso.",
              "Cajados elementais do Doran aumentam muito o dano do elemento deles.",
              "Feitiços duplos custam mana, mas valem a pena. Defender recupera mana.",
            ][Math.floor(Math.random() * 4)],
          ],
        ]),
    },
    {
      t: "Sair",
      fn: null,
    },
  ]);
  return null;
}
function pickBook() {
  const n = player.books.filter((b) => b.startsWith("escola")).length;
  const order = Object.keys(SKILLS)
    .filter((k) => SKILLS[k].tome && SKILLS[k].el === player.aff)
    .sort((a, b) => SKILLS[a].tome - SKILLS[b].tome);
  playSound(784, 0.15, "sine");
  setTimeout(() => playSound(1047, 0.2, "sine"), 120);
  if (n === 1 || n === 3 || n === 5) {
    const t = order.find((k) => !player.tomes.includes(k));
    if (t) {
      player.tomes.push(t);
      saveGame();
      say([
        ["", `Você encontrou o Tomo ${RUNE_OF[player.aff]} ${["I", "II", "III"][SKILLS[t].tome - 1]}!`],
        [
          "",
          `Você aprendeu o feitiço ${SKILLS[t].nome}: ${SKILLS[t].desc} Use pelo botão Habilidades na batalha.`,
        ],
      ]);
      return;
    }
  }
  player.basemp += 5;
  player.mp = Math.min(maxMp(), player.mp + 5);
  player.xp += 25;
  addItem("papiro");
  saveGame();
  say([
    [
      "",
      [
        '"Diário de um aluno: hoje a Professora Selene fez a sala inteira flutuar. Ninguém conseguiu descer até o almoço."',
        '"Regra 14 da Academia: é proibido ensinar feitiços a quem não sabe ouvir a Canção."',
      ][n % 2],
    ],
    ["", "Ler este livro ampliou sua mente: +5 MP máximo e +25 XP. Você também pegou um Papiro Encantado."],
  ]);
}

/* ===================== AMIZADES ===================== */

const FRIENDS = {
  rainha: {
    fav: "perolaN",
    r80: ["amuPerola", 1],
  },
  odelia: {
    fav: "cha",
    r80: ["amuCan", 1],
  },
  bruno: {
    fav: "esporo",
    shop: "bruno",
    work: true,
    r80: ["elixir", 2],
  },
  rosa: {
    fav: "cha",
    shop: "rosa",
    work: true,
    r80: ["ensopado", 5],
  },
  doran: {
    fav: "cristal",
    shop: "doran",
    r80: ["amu3", 1],
  },
  ferreiro: {
    fav: "pedra",
    shop: "ferreiro",
    work: true,
    r80: ["armRunica", 1],
  },
  curandeira: {
    fav: "ervas",
    r80: ["fenix", 1],
  },
  kael: {
    fav: "couro",
    work: true,
    r80: ["pocaoG", 3],
  },
  lia: {
    fav: "maca",
    r80: ["amu1", 1],
  },
  iara: {
    fav: "papiro",
    r80: ["tomo", 1],
  },
  tome: {
    fav: "ensopado",
    r80: ["armMalha", 1],
  },
  marina: {
    fav: "peixe",
    r80: ["amuPerola", 1],
  },
  tobias: {
    fav: "cristal",
    r80: ["cajadoCristal", 1],
  },
  capitao: {
    fav: "hidromel",
    r80: ["amu2", 1],
  },
  cocheiro2: {
    fav: "maca",
    work: true,
    r80: ["pocaoG", 3],
  },
  nicoP: {
    fav: "agua",
    shop: "peixeG",
    work: true,
    r80: ["caldeirada", 5],
  },
  mercOri: {
    fav: "cha",
    shop: "especiarias",
    r80: ["eterG", 3],
  },
  minerA: {
    fav: "pedra",
    shop: "minerios",
    work: true,
    r80: ["fragmento", 3],
  },
  peleiro: {
    fav: "torta",
    shop: "peles",
    r80: ["armPele", 1],
  },
  ancia: {
    fav: "cha",
    r80: ["elixir", 1],
  },
  cocheiro3: {
    fav: "maca",
    work: true,
    r80: ["pocaoG", 3],
  },
  cocheiro: {
    fav: "maca",
    work: true,
    r80: ["horse", 1],
  },
  zaid: {
    fav: "fragmento",
    r80: ["fragmento", 4],
  },
};
const REL_LV = [
  [0, "Desconhecido"],
  [12, "Conhecido"],
  [35, "Amigo"],
  [65, "Melhor amigo"],
];
function friendship(id) {
  return player.rel[id] || 0;
}
function friendshipLevel(id) {
  let l = 0;
  REL_LV.forEach(([v], i) => {
    if (friendship(id) >= v) l = i;
  });
  return l;
}
function hearts(id) {
  const l = friendshipLevel(id);
  return "♥".repeat(l) + "♡".repeat(3 - l);
}
function discount(shop) {
  const id = Object.keys(FRIENDS).find((k) => FRIENDS[k].shop === shop);
  const rm = (player.rep ?? 50) < 25 ? 1.15 : (player.rep ?? 50) >= 80 ? 0.95 : 1;
  return (id && angry(id) ? 1.3 : id && friendshipLevel(id) >= 2 ? 0.85 : 1) * rm;
}
/* ===================== IMPOSTO REAL ===================== */

/**
 * A Rainha Aurélia cobra o Imposto Real em toda compra: 12% sobre o preço.
 * Dia de festival é livre de imposto, e quem tem boa fama (80+) paga metade.
 * Vender também tem taxa: 10% do valor fica com a Coroa.
 */
const TAX = { buy: 0.12, sell: 0.1 };
function taxRate() {
  if (festivalToday() || player.spouse === "rainha") return 0;
  return ((player.rep ?? 50) >= 80 ? TAX.buy / 2 : TAX.buy) + warTax();
}
function taxOf(price) {
  return price > 0 ? Math.ceil(price * taxRate()) : 0;
}
function withTax(price) {
  return price + taxOf(price);
}
/** Cobra o preço com imposto e guarda quanto já foi para a Coroa. */
function payWithTax(price) {
  const tax = taxOf(price);
  player.gold -= price + tax;
  player.taxPaid = (player.taxPaid || 0) + tax;
  return tax;
}
function saleAfterTax(value) {
  if (festivalToday() || player.spouse === "rainha") return value;
  return value - Math.floor(value * TAX.sell);
}
function taxNote() {
  if (player.spouse === "rainha") return '<span style="color:#f2c14e">Consorte Real: isento do Imposto Real!</span>';
  if (festivalToday()) return '<span style="color:#7ad36b">Dia de festival: sem Imposto Real!</span>';
  const pct = Math.round(taxRate() * 100);
  return `Imposto Real: ${pct}% na compra · ${Math.round(TAX.sell * 100)}% na venda${warTax() ? " (inclui 8% de imposto de guerra)" : pct < 12 ? " (desconto por boa fama)" : ""}`;
}

function addFriendship(id, n) {
  if (!FRIENDS[id]) return;
  if (n > 0) n = Math.ceil(n * 1.7);
  const before = friendshipLevel(id);
  player.rel[id] = Math.max(0, Math.min(100, friendship(id) + n));
  const after = friendshipLevel(id);
  if (after > before) {
    const nm = NPCS[id].nome;
    toast(`${nm}: agora ${REL_LV[after][1]}! ${hearts(id)}`, 3500);
    playSound(880, 0.15, "sine");
    if (after === 2 && !player.relRew[id + "50"]) {
      player.relRew[id + "50"] = 1;
      const msg = FRIENDS[id].shop
        ? "Você ganhou 15% de desconto comigo."
        : id === "curandeira"
          ? "A partir de agora, eu trato você de graça."
          : id === "cocheiro"
            ? "Minha carruagem agora é de graça para você."
            : "Tome, um presente de amigo.";
      if (!FRIENDS[id].shop && !["curandeira", "cocheiro"].includes(id)) addItem("pocaoG");
      setTimeout(
        () =>
          say([
            [
              nm,
              `Sabe, você virou ${genderWord("um grande amigo", "uma grande amiga", "alguém muito especial")} pra mim. ` +
                msg,
            ],
          ]),
        400,
      );
    }
    if (after === 3 && !player.relRew[id + "80"]) {
      player.relRew[id + "80"] = 1;
      const [it, n2] = FRIENDS[id].r80;
      let txt;
      if (it === "horse") {
        if (player.horse) {
          addItem("pocaoG", 3);
          txt = "3 Grandes Poções";
        } else {
          player.horse = true;
          txt = "um cavalo só seu (aperte C para montar)";
        }
      } else if (it === "tomo") {
        const t = Object.keys(SKILLS).find(
          (k) => SKILLS[k].tome && SKILLS[k].el === player.aff && !player.tomes.includes(k),
        );
        if (t) {
          player.tomes.push(t);
          txt = `o feitiço ${SKILLS[t].nome}, de um tomo perdido`;
        } else {
          addItem("papiro", 3);
          txt = "3 Papiros Encantados";
        }
      } else {
        addItem(it, n2);
        txt = (n2 > 1 ? n2 + "× " : "") + ITEMS[it].nome;
      }
      setTimeout(
        () =>
          say([
            [
              nm,
              `Você é ${genderWord("meu melhor amigo", "minha melhor amiga", "a pessoa mais querida")} por aqui. Quero que fique com isto.`,
            ],
            ["", `Você recebeu: ${txt}!`],
          ]),
        400,
      );
    }
  }
}

/* ===================== DIÁLOGOS RICOS ===================== */
// cada fala: texto (a pessoa fala) ou lista de [quem,texto]; "Y" = você; {N}=seu nome

const NPC_LINES = {
  odelia: {
    a: [
      "Quando eu era jovem, Vesper e eu subíamos no telhado da Academia para contar estrelas. Ele sempre perdia a conta de propósito.",
      [
        ["", "*Odelia olha para a fonte por um longo tempo."],
        ["Y", "Está tudo bem?"],
        ["", "Só lembrando de como a água brilhava quando ainda havia magia."],
      ],
      "A Canção Arcana não se ouve com os ouvidos, {N}. Se ouve com o peito, quando você para de ter medo.",
      "Os moradores me chamam de Arquimaga, mas na verdade eu sou só alguém que esperou demais.",
      [
        ["Y", "Você nunca dorme?"],
        ["", "Durmo pouco. Trezentos anos de sono atrasado não se recuperam numa noite."],
      ],
      "Cada runa tem um temperamento. A Chama é impaciente, a Maré é teimosa, o Vento é distraído e a Terra... a Terra nunca esquece.",
    ],
    f: [
      "Você me lembra alguém que eu conheci há muito tempo. No bom sentido.",
      "Obrigada por voltar sempre. Esta velha arquimaga gosta de companhia.",
    ],
    b: [
      "Se eu tivesse tido um aprendiz como você naquela época, talvez Vesper não tivesse se perdido.",
      "Você é a melhor coisa que aconteceu a Cinzaluz em três séculos. Não conte a ninguém que eu disse isso.",
    ],
  },
  bruno: {
    a: [
      "Ontem explodi um caldeirão tentando fazer poção de crescer cabelo. Agora minhas sobrancelhas estão... criativas.",
      [
        ["Y", "Que cheiro é esse?"],
        ["", "Poção de menta com cogumelo. Ou cogumelo com menta. Ainda não decidi se é remédio ou veneno."],
      ],
      "Minha avó dizia que uma boa poção tem três ingredientes: erva fresca, paciência e uma pitada de sorte.",
      "Se você vir um Cogumelo Mudo por aí, traz um esporo pra mim? Eles dão um caldo fantástico.",
      [
        ["", "*Bruno tenta equilibrar três frascos ao mesmo tempo."],
        ["", "*Um cai e quica no chão sem quebrar."],
        ["", "Viu? Frasco reforçado! Invenção minha!"],
      ],
      "O segredo das Grandes Poções? Mexer no sentido do relógio. Contra o relógio vira sopa.",
    ],
    f: [
      "Você é meu cliente favorito. Não conta pros outros, senão todo mundo vai querer desconto.",
      "Tô pensando em batizar uma poção com o seu nome. Poção {N}! Que tal?",
    ],
    b: [
      "Se um dia eu abrir uma loja grande, quero você como sócio. Você entra com a coragem, eu com as explosões.",
    ],
  },
  rosa: {
    a: [
      "As maçãs douradas chegaram fresquinhas hoje. Pegam a cor do sol da manhã, sabia?",
      [
        ["Y", "Como vão as vendas?"],
        ["", "Bem! O Kael compra ensopado todo dia, mas jura que é pros bonecos de treino."],
      ],
      "Minha mãe tinha uma horta enorme antes do Silêncio. Dizem que as abóboras falavam. Eu acho que era exagero dela.",
      "Ai, de novo uma galinha fugiu da fazenda e entrou na minha barraca. Ela comeu metade das uvas!",
      "Gosto de acordar cedo e ver a vila acordando junto. O cheiro de pão da Dona Bia, o barulho da forja do Brann...",
      [
        ["", "*Rosa arruma as frutas em forma de coração."],
        ["Y", "Ficou bonito."],
        ["", "Ah! Era só pra organizar... juro."],
      ],
    ],
    f: [
      "Separei uma maçã das boas pra você. Não fala pra ninguém!",
      "Quando você sai em aventura eu fico olhando pro portão até você voltar. É bobagem, eu sei.",
    ],
    b: ["Sabe o que eu mais gosto em você? Você sempre volta. Mesmo machucado, mesmo cansado. Você volta."],
  },
  doran: {
    a: [
      "Este cajado levou três semanas para ficar pronto. Três. Semanas. E ainda acho que o cristal está meio torto.",
      "Os anões de Pedravale dizem que fazem cajados melhores. Os anões de Pedravale estão errados.",
      [
        ["Y", "Como você escolhe a madeira?"],
        ["", "Escuto. Cada galho tem uma nota. Os bons cantam baixinho."],
      ],
      "Um cajado do seu elemento multiplica sua magia. Um cajado errado é só um pedaço de pau caro.",
      "Já recusei vender para nobre que não sabia segurar um cajado. Ofendeu meu trabalho.",
    ],
    f: [
      "Você trata bem os cajados que eu faço. Isso conta muito pra mim.",
      "Estou guardando um cristal especial. Quando estiver pronto, você vai ser o primeiro a saber.",
    ],
    b: [
      "Nunca disse isso a ninguém: eu comecei a fazer cajados porque queria ser mago. Ver você usando os meus... é quase a mesma coisa.",
    ],
  },
  ferreiro: {
    a: [
      "O segredo de uma boa armadura não é o ferro. É o suor. Muito suor.",
      [
        ["", "*Brann bate o martelo e faíscas voam."],
        ["Y", "Você não se queima?"],
        ["", "Já me queimei tanto que agora o fogo tem medo de mim."],
      ],
      "Mago de manto fino morre na primeira mordida. Eu vejo isso todo inverno.",
      "Minha filha quer ser ferreira também. Já levanta o martelo pequeno. Orgulho!",
      "Se quiser me deixar de bom humor, traga Pedras de Golem. Fazem as melhores ligas.",
    ],
    f: [
      "Você é dos poucos magos que respeita o trabalho braçal. Gosto disso.",
      "Fiz um ajuste na sua armadura de cabeça. Vai ver como encaixa melhor.",
    ],
    b: ["Considero você da família, {N}. E família de ferreiro nunca anda desprotegida."],
  },
  curandeira: {
    a: [
      "Hoje cuidei de três crianças com joelho ralado e um guarda com o dedo preso na porta do castelo.",
      [
        ["Y", "Você nunca descansa?"],
        ["", "Descanso quando todo mundo estiver bem. Ou seja... nunca, né?"],
      ],
      "Camomila para dormir, hortelã para a barriga, ervas medicinais para ferimentos graves. Anota aí.",
      "Aprendi a curar com minha avó, no tempo em que ainda dava para usar magia de luz. Agora é tudo na mão.",
      "Por favor, não volte ferido de novo. Meu coração não aguenta.",
    ],
    f: [
      "Guardei um chá calmante pra você. Aventureiro também precisa de paz.",
      "Gosto quando você passa aqui só para conversar, e não porque se machucou.",
    ],
    b: ["Às vezes rezo no templo pra você voltar inteiro. Pronto, contei."],
  },
  kael: {
    a: [
      "Treinei duzentas estocadas hoje antes do sol nascer. Amanhã serão duzentas e uma.",
      [
        ["Y", "Você já perdeu uma luta?"],
        ["", "Perdi muitas. Cada derrota me ensinou mais que dez vitórias."],
      ],
      "A guarda alta salva vidas. Repita comigo: guarda alta.",
      "Os bonecos de treino têm nome, sabia? Aquele é o Boris. Ele aguenta tudo.",
      "Disciplina é fazer o que precisa ser feito, mesmo quando ninguém está olhando.",
    ],
    f: [
      "Você melhorou muito desde o primeiro treino. Não deixe isso subir à cabeça.",
      "Se quiser, treinamos juntos ao amanhecer. Traga café.",
    ],
    b: ["Confio em você para proteger esta vila tanto quanto confio em mim mesmo. E eu não confio fácil."],
  },
  lia: {
    a: [
      "Hoje eu vi uma borboleta azul! Ela pousou no meu nariz!",
      [
        ["Y", "O que você está fazendo?"],
        ["", "Procurando quatro-folhas. Minha avó disse que dá sorte. Já achei duas de três!"],
      ],
      "Você já lutou com um dragão? Mentira! Conta como foi!",
      "O Bardo Lírio me ensinou uma música, mas eu esqueci o meio. E o começo. Só lembro do fim!",
      "Quando eu crescer, vou ser maga igual a você. Ou cozinheira. Ou as duas coisas!",
    ],
    f: [
      "Fiz um desenho de você com um chapéu enorme. Ficou lindo!",
      "Você é a pessoa mais legal da vila. Depois da minha avó.",
    ],
    b: ["Você é meu herói. Mas não conta pra ninguém que eu chorei quando você foi pra torre."],
  },
  iara: {
    a: [
      "Estou catalogando livros que ninguém abre há trezentos anos. A poeira tem histórias também.",
      [
        ["Y", "O que você está lendo?"],
        ["", "Um tratado sobre runas antigas. E... um romance. Mas fala baixo."],
      ],
      "Os grimórios estão voltando a mostrar palavras. Cada magia que você recupera aparece numa página.",
      "Achei uma receita de bolo escrita por um mago de dois séculos atrás. Tinha uma instrução: 'adicione relâmpago'.",
      "Silêncio na biblioteca, por favor... ah, desculpa, é só você. Pode falar.",
    ],
    f: [
      "Separei um livro que acho que você vai gostar. Sobre viajantes e terras distantes.",
      "É bom ter alguém para conversar sobre livros. A maioria só pergunta onde fica o banheiro.",
    ],
    b: ["Se a minha vida fosse um livro, você seria o capítulo favorito."],
  },
  tome: {
    a: [
      "Vinte anos de guarda e nunca vi monstros tão ousados quanto agora.",
      [
        ["Y", "Nunca fica entediado aqui?"],
        ["", "Guarda bom gosta de tédio. Tédio quer dizer que ninguém morreu."],
      ],
      "A barreira do sul vibra à noite. Dá arrepios.",
      "Minha esposa faz um ensopado que aquece até a alma. Melhor que o da taverna, mas não conte ao Gus.",
      "Se ouvir o sino tocar, é ataque. Corra para a praça e ajude.",
    ],
    f: [
      "Durmo mais tranquilo sabendo que você está na vila.",
      "Você tem a coragem de um guarda veterano. Isso é elogio, viu?",
    ],
    b: ["Se precisar, eu largo o posto e luto do seu lado. Sem pensar duas vezes."],
  },
  cocheiro: {
    a: [
      "O Trovão, meu cavalo mais velho, ainda puxa a carruagem melhor que qualquer potro.",
      [
        ["Y", "Qual é o segredo para cuidar de cavalos?"],
        ["", "Maçã, escova e conversa. Eles adoram fofoca."],
      ],
      "A estrada para Pedravale tem uma curva onde o vento canta. Os cavalos sempre param pra ouvir.",
      "Já levei a Rainha de carruagem uma vez. Ela pediu pra ir mais rápido. Eu quase morri de susto!",
      "Em Porto Brisamar tem uma cocheira, a Lila. Ela dirige que nem um furacão.",
    ],
    f: [
      "Seu cavalo pergunta de você. Bom, ele relincha. Mas eu entendo.",
      "Você tem jeito com animais. Já pensou em ter um estábulo?",
    ],
    b: ["Se um dia eu me aposentar, deixo o Trovão com você. Só com você."],
  },
  zaid: {
    a: [
      "Comprei um vaso que dizem ser amaldiçoado. Por enquanto, só está feio.",
      [
        ["Y", "De onde vêm suas mercadorias?"],
        ["", "Segredo comercial. Mas digamos que conheço muitos marinheiros em Brisamar."],
      ],
      "Fragmentos Arcanos estão valorizando. Quem guarda hoje, enriquece amanhã.",
      "Já troquei uma galinha por um mapa do tesouro. O mapa era falso. A galinha era ótima.",
      "Aqui tudo tem preço. Menos amizade. Amizade custa caro demais.",
    ],
    f: [
      "Para você faço condições especiais. Não espalha.",
      "Você negocia bem. Quase tão bem quanto eu. Quase.",
    ],
    b: [
      "Já fui roubado, enganado e afundado num naufrágio. Mas ganhar um amigo como você foi meu melhor negócio.",
    ],
  },
  marina: {
    a: [
      "O mar estava tão calmo hoje que dava para ver os peixes conversando.",
      [
        ["Y", "Você não tem medo de tempestade?"],
        ["", "Medo? Eu nasci numa! Minha mãe diz que eu chorava mais alto que o trovão."],
      ],
      "Um dia vou navegar até o horizonte e ver o que tem do outro lado.",
      "Pesquei um peixe tão grande hoje que ele quase me pescou.",
      "O Capitão Bento conta histórias de monstros marinhos. Metade é mentira. A outra metade eu quero ver.",
    ],
    f: [
      "Guardei a melhor parte da pesca pra você.",
      "Quando o farol acende, eu penso em quem está longe. Hoje pensei em você.",
    ],
    b: ["Se eu fosse navegar até o fim do mundo, ia querer você no barco comigo."],
  },
  capitao: {
    a: [
      "Já enfrentei uma lula gigante com uma colher de pau. Bom, era uma lula pequena. Mas a colher era de pau mesmo.",
      [
        ["Y", "Sente falta do mar aberto?"],
        ["", "Todo dia. O mar é a única coisa que nunca mente."],
      ],
      "Barco sem nome dá azar. O meu se chama Saudade.",
      "Já vi o farol de Brisamar salvar mais vidas que qualquer mago.",
    ],
    f: ["Você tem pernas de marinheiro, sabia? Nunca cambaleia."],
    b: ["Se um dia eu fizer minha última viagem, quero você no leme."],
  },
  cocheiro2: {
    a: [
      "Dirigir rápido? Eu? Imagina! ...Segura o chapéu na próxima viagem.",
      "Meu cavalo se chama Relâmpago. Ele odeia chuva. Ironia, né?",
      [
        ["Y", "Quantas viagens você faz por dia?"],
        ["", "Perdi a conta! Mas cada uma tem uma história."],
      ],
    ],
    f: ["Você é minha passageira favorita. Nunca reclama dos solavancos."],
    b: ["Pra você, a carruagem é sempre de graça. Amigos não pagam."],
  },
  nicoP: {
    a: [
      "Peixe fresco é aquele que ainda olha feio pra você.",
      "Acordo antes do sol pra pegar os barcos chegando.",
      [
        ["Y", "Qual é o melhor peixe?"],
        ["", "O que foi pescado com carinho. E com isca boa."],
      ],
    ],
    f: ["Separei o peixe mais bonito da manhã pra você."],
    b: ["Você é como família pra mim, viu?"],
  },
  mercOri: {
    a: [
      "Essas especiarias vieram de uma terra onde o sol nunca se põe. Ou foi o que o marinheiro me disse.",
      "Canela, cravo, pimenta-de-dragão... cuidado com essa última.",
      [
        ["Y", "De onde você é?"],
        ["", "De muito longe. Tão longe que até eu esqueci o caminho."],
      ],
    ],
    f: ["Pra você, um desconto de amiga. Pequeno, mas de coração."],
    b: ["Já viajei o mundo, mas foi aqui que encontrei uma amizade de verdade."],
  },
  minerA: {
    a: [
      "Martelo, picareta e uma boa cantoria. É tudo que um anão precisa.",
      "Os humanos acham que minerar é bater na pedra. Minerar é escutar a pedra.",
      [
        ["Y", "Você já achou um tesouro?"],
        ["", "Todo dia. Mas o maior tesouro é voltar pra superfície inteiro."],
      ],
    ],
    f: ["Você até que aguenta uma mina. Para um humano."],
    b: ["Te considero um anão honorário. É a maior honra que existe!"],
  },
  peleiro: {
    a: [
      "O inverno aqui é cruel. Pele boa salva vidas.",
      "Caço só o necessário. A montanha se lembra de quem desrespeita.",
      [
        ["Y", "Não sente frio?"],
        ["", "Sinto. Por isso vendo peles."],
      ],
    ],
    f: ["Você respeita a montanha. Isso me basta."],
    b: ["Se precisar de abrigo na serra, minha cabana é sua."],
  },
  ancia: {
    a: [
      "Já vi três gerações de anões nascerem nesta serra.",
      "Quando eu era menina, os cristais da mina cantavam. Hoje só cochicham.",
      [
        ["Y", "Qual o segredo da sua idade?"],
        ["", "Chá quente, caminhada na serra e não guardar rancor."],
      ],
    ],
    f: ["Você me lembra meu neto. Ele também vivia se metendo em encrenca."],
    b: ["Quando eu partir, quero que fique com meu velho livro de receitas."],
  },
  cocheiro3: {
    a: [
      "A estrada da serra é estreita. Mas meu cavalo conhece cada pedra.",
      "Já levei um anão bêbado até Cinzaluz. Ele cantou a viagem inteira.",
      [
        ["Y", "Não tem medo de cair do penhasco?"],
        ["", "Tenho. Por isso vou devagar. Bem devagar."],
      ],
    ],
    f: ["Gosto de levar você. Conversa boa encurta a estrada."],
    b: ["Se precisar ir a qualquer lugar, é só chamar. A qualquer hora."],
  },
  tobias: {
    a: [
      "Lá embaixo na mina é tão silencioso que dá pra ouvir o próprio coração.",
      [
        ["Y", "O que você mais gosta na mina?"],
        ["", "Quando a lanterna bate num cristal e tudo vira arco-íris. Dura um segundo, mas vale o dia."],
      ],
      "Achei um cristal com forma de estrela hoje. Guardei. Não sei pra quê.",
      "Os anões cantam enquanto mineram. Eu só sei uma música, e é sobre uma cabra.",
      "De noite subo no telhado e olho o céu. Depois de tanto tempo no escuro, as estrelas parecem gritar.",
    ],
    f: [
      "Você é fácil de conversar. Normalmente eu fico mudo perto das pessoas.",
      "Guardei um cristal bonito pra te mostrar. Brilha azul quando você chega perto. Será coincidência?",
    ],
    b: ["Eu nunca fui bom com palavras, então vou dizer simples: gosto muito de estar com você."],
  },
};
const NPC_QUESTIONS = {
  rosa: [
    {
      q: "Você prefere doce ou salgado?",
      a: [
        ["Doce, sempre!", "Eu também! Vou guardar um bolo pra você.", 4],
        ["Salgado, um ensopado bem quente.", "Hmm, sabia que você tinha bom gosto!", 3],
        ["Tanto faz, eu como qualquer coisa.", "Ah... tá bom então.", 0],
      ],
    },
  ],
  kael: [
    {
      q: "Na batalha, você prefere atacar primeiro ou esperar o inimigo errar?",
      a: [
        ["Atacar primeiro, sem dó.", "Agressivo. Cuidado para não abrir a guarda.", 2],
        ["Esperar e contra-atacar.", "Isso é sabedoria de veterano. Gostei.", 5],
        ["Fugir, se der.", "...Vamos treinar mais.", -1],
      ],
    },
  ],
  bruno: [
    {
      q: "Se você pudesse inventar uma poção, o que ela faria?",
      a: [
        ["Faria a pessoa voar!", "Voar! Já tentei. Fiquei grudado no teto por uma hora.", 4],
        ["Faria as pessoas falarem a verdade.", "Perigoso... mas genial!", 3],
        ["Curaria qualquer tristeza.", "Que bonito. Essa eu queria fazer de verdade.", 5],
      ],
    },
  ],
  iara: [
    {
      q: "Qual tipo de história você mais gosta?",
      a: [
        ["Aventura!", "Combina com você. Tenho uma prateleira inteira.", 4],
        ["Romance.", "Ah! E-eu também... digo, é um gênero interessante.", 6],
        ["Não gosto muito de ler.", "Ah. Tudo bem... cada um é cada um.", -2],
      ],
    },
  ],
  marina: [
    {
      q: "Se pudesse ir a qualquer lugar do mundo, para onde iria?",
      a: [
        ["Para o horizonte, no seu barco.", "Hahaha! Então tá combinado, marujo!", 6],
        ["Para o topo dos Picos Uivantes.", "Lá de cima dá pra ver o mar? Me conta depois!", 3],
        ["Ficaria aqui mesmo.", "Que caseiro! Mas tudo bem.", 0],
      ],
    },
  ],
  tobias: [
    {
      q: "Você acha que as estrelas são cristais muito distantes?",
      a: [
        ["Com certeza, cristais mágicos!", "Eu sabia! Ninguém nunca concordou comigo antes.", 6],
        ["Acho que são fogueiras de deuses.", "Hmm, também é bonito de pensar.", 3],
        ["São só pontinhos no céu.", "Ah... é. Talvez.", -1],
      ],
    },
  ],
  lia: [
    {
      q: "Qual é o seu animal favorito?",
      a: [
        ["Dragão!", "EU SABIA! O meu também!", 5],
        ["Cavalo.", "O Tião deixa eu dar maçã pro cavalo dele!", 3],
        ["Galinha.", "Hahaha! As galinhas da fazenda são malucas!", 4],
      ],
    },
  ],
  curandeira: [
    {
      q: "Você tem se cuidado direito nas viagens?",
      a: [
        ["Sempre levo poções e ervas.", "Muito bem! Assim que eu gosto.", 4],
        ["Mais ou menos...", "Mais ou menos não serve! Promete que vai se cuidar?", 1],
        ["Não preciso, sou forte.", "Todo mundo diz isso antes de chegar aqui carregado.", -2],
      ],
    },
  ],
  doran: [
    {
      q: "O que é mais importante num cajado: beleza ou poder?",
      a: [
        ["Poder, claro.", "Prático. Mas um cajado feio dá vergonha.", 2],
        ["Os dois em equilíbrio.", "Finalmente alguém que entende de cajados!", 6],
        ["Tanto faz, é só um pau.", "SÓ UM PAU?!", -4],
      ],
    },
  ],
  odelia: [
    {
      q: "Você tem medo do que vai encontrar na Torre?",
      a: [
        ["Tenho, mas vou mesmo assim.", "Isso é coragem de verdade, {N}.", 5],
        ["Não, nada me assusta.", "Cuidado com quem não sente medo. Às vezes é só cegueira.", 1],
        ["Prefiro nem pensar nisso.", "Às vezes não pensar é a única forma de seguir. Eu entendo.", 3],
      ],
    },
  ],
};
const PERSONALITY_QUESTIONS = {
  sabio: [
    {
      q: "O que você faria se pudesse voltar no tempo?",
      a: [
        ["Salvaria quem eu amo.", "Todos nós faríamos isso. Mas o passado também nos ensina.", 4],
        ["Nada. Gosto de quem eu sou hoje.", "Sábia resposta. Raramente ouço isso.", 5],
        ["Ficaria rico!", "Hahaha. Honesto, pelo menos.", 1],
      ],
    },
  ],
  engracado: [
    {
      q: "Qual foi a coisa mais engraçada que já te aconteceu?",
      a: [
        ["Uma galinha roubou meu chapéu.", "HAHAHA! Imaginei a cena!", 5],
        ["Escorreguei na frente da Rainha.", "Não acredito! Que vergonha! Hahaha!", 4],
        ["Nada engraçado acontece comigo.", "Ah, que triste! Vamos mudar isso.", 0],
      ],
    },
  ],
  gentil: [
    {
      q: "Você tem conseguido descansar?",
      a: [
        ["Durmo bem em casa.", "Que bom! Descanso é remédio.", 3],
        ["Quase nada, muita aventura.", "Ah, assim você vai adoecer! Cuide-se, por favor.", 2],
        ["Descansar é para os fracos.", "Não fale assim... até heróis precisam dormir.", -1],
      ],
    },
    {
      q: "Qual é a sua comida favorita?",
      a: [
        ["Ensopado quente.", "Ah, conforto puro numa tigela!", 3],
        ["Bolo de mel.", "Que delícia! Você tem bom gosto.", 3],
        ["Qualquer coisa que eu não precise cozinhar.", "Hahaha, sincero!", 2],
      ],
    },
  ],
  orgulhoso: [
    {
      q: "Você acha que o meu trabalho é o melhor da região?",
      a: [
        ["Sem dúvida!", "Finalmente alguém com bom senso.", 5],
        ["Já vi melhores em Pedravale.", "...Como é que é?", -4],
        ["Ainda não sei, preciso conhecer mais.", "Justo. Mas vai concordar comigo.", 2],
      ],
    },
  ],
  serio: [
    {
      q: "Por que você luta?",
      a: [
        ["Para proteger as pessoas.", "Esse é o único motivo que importa.", 5],
        ["Pela glória.", "Glória não aquece ninguém no inverno.", -1],
        ["Porque não tenho escolha.", "Muitos começam assim. Os bons ficam por escolha.", 3],
      ],
    },
  ],
  crianca: [
    {
      q: "Você já viu um unicórnio?",
      a: [
        ["Já! Brilhava muito.", "NÃO ACREDITO! Onde? Onde?", 5],
        ["Ainda não, mas vou procurar.", "Me leva junto quando for!", 4],
        ["Unicórnios não existem.", "Existem sim! Buáá!", -2],
      ],
    },
  ],
  timido: [
    {
      q: "Você... prefere lugares cheios ou silenciosos?",
      a: [
        ["Silenciosos, como você.", "S-sério? Que bom... eu também.", 6],
        ["Cheios, adoro festa!", "Ah... você deve ser muito corajoso.", 1],
        ["Depende do dia.", "É... faz sentido.", 2],
      ],
    },
  ],
  esperto: [
    {
      q: "Se eu te oferecesse um negócio arriscado mas lucrativo, você aceitaria?",
      a: [
        ["Depende dos termos.", "Ha! Fala como um verdadeiro comerciante.", 5],
        ["Claro, adoro risco!", "Você seria um ótimo cliente... para mim.", 2],
        ["Não, prefiro garantias.", "Prudente. Chato, mas prudente.", 1],
      ],
    },
  ],
  aventureiro: [
    {
      q: "Qual foi o lugar mais bonito que você já viu?",
      a: [
        ["O topo dos Picos Uivantes.", "Um dia eu vou subir lá também!", 4],
        ["O farol de Brisamar à noite.", "É o meu lugar favorito no mundo!", 6],
        ["Minha casa.", "Que fofo. Casa também é aventura, né?", 3],
      ],
    },
  ],
};
const WALKER_NAMES = [
  "Joaquim",
  "Benedita",
  "Firmino",
  "Clarice",
  "Severino",
  "Adelaide",
  "Otávio",
  "Lurdes",
  "Teodoro",
  "Zélia",
  "Matias",
  "Rosalina",
  "Cândido",
  "Filomena",
  "Bento",
  "Isaura",
];
const WALKER_POOL = [
  "Você viu o preço do pão? A Dona Bia aumentou de novo!",
  "Meu marido jura que viu um fantasma perto da escola em ruínas.",
  "Hoje é dia de feira? Ah, todo dia é dia de feira em Cinzaluz!",
  "As galinhas do celeiro botaram ovos azuis. Deve ser coisa de magia!",
  "Ouvi o Bardo Lírio cantando lá na taverna ontem. Que voz!",
  "Dizem que a Rainha Aurélia era aventureira quando jovem.",
  "Minha avó jura que já viu a Odelia jovem. Mas a avó tem noventa anos...",
  "Cuidado com o rio: a correnteza é forte depois da ponte.",
  "O Kael passou a manhã gritando com bonecos de palha. Normal.",
  "A forja do Brann não para nunca. Às vezes acordo com o martelo.",
  "Tô juntando ouro pra comprar um cavalo do Tião.",
  "Você é aquele mago das runas? Minha filha tem um desenho seu na parede!",
  "O moinho rangeu a noite inteira. Vento forte vem aí.",
  "Já foi ao Porto Brisamar? O peixe lá é de outro mundo.",
  "Pedravale é frio que só. Leva casaco se for.",
  "A Iara me emprestou um livro de receitas mágicas. Explodi a cozinha.",
  "Ontem dois guardas brigaram por causa de uma torta. O Tomé teve que separar.",
  "Dizem que o Zaid troca qualquer coisa. Até a sogra, se deixar.",
  "Se você vir meu gato laranja, avisa? Ele some todo dia.",
  "O templo vai ter festa no fim da estação. Vai ter doce!",
];
function ctxLines(id) {
  const L = [],
    h = Math.floor(player.clock / 60),
    g = guardiansFreed();
  if (h < 10)
    L.push(
      "Bom dia, {N}! Dormiu bem?",
      "Acordou cedo hoje, hein, {N}?",
      "Já tomou café da manhã? Saco vazio não para em pé.",
    );
  else if (h >= 19 || h < 5)
    L.push(
      "O que faz acordado a essa hora, {N}? A noite é perigosa.",
      "Boa noite... quase não vejo ninguém na rua a essa hora.",
      "As estrelas estão bonitas hoje. Já reparou?",
    );
  else if (h >= 12 && h < 14) L.push("Hora do almoço! Meu estômago já está reclamando.");
  if (player.injured) L.push("Você está todo machucado! Vá ver a Curandeira Maíra agora mesmo.");
  if (player.food < 30) L.push("Ouvi sua barriga roncar daqui. Vá comer alguma coisa!");
  if (player.water < 30) L.push("Seus lábios estão rachados. Beba água, criatura!");
  if (player.riding) L.push("Que cavalo bonito! Cuida bem dele.");
  if (["coroa", "tiara"].includes(player.look.hat)) L.push("Que chique! Vai a uma festa no castelo?");
  if (["#4a7ad9", "#e86ab0", "#4ab06a", "#8a4ad9", "#e8e4dc"].includes(player.look.hair))
    L.push("Cabelo novo? Ficou diferente... no bom sentido!");
  if (player.look.outfit === "real") L.push("Com essa roupa até parece nobreza!");
  if (g === 1) L.push("Dizem que você libertou o Ent do bosque. É verdade?");
  if (g === 2) L.push("Duas runas de volta! A vila inteira está falando de você.");
  if (g >= 3) L.push("As quatro runas estão com você... a Torre do Silêncio espera. Tenha cuidado.");
  if (player.lvl >= 8)
    L.push("Você está ficando muito forte. Dá pra sentir a magia no ar quando você passa.");
  if (player.gold >= 1000) L.push("Tá cheio de ouro, hein? Não vai esquecer dos amigos!");
  if (player.spouse && player.spouse !== id)
    L.push(`Como vai a vida de casado com ${NPCS[player.spouse].nome.split(",")[0]}?`);
  if (player.kids.length) L.push(`E ${player.kids[0].name}? Deve estar enorme!`);
  if (player.angry && player.angry[id] === player.day - 1)
    L.push("Ainda lembro do que você me disse ontem... mas vou deixar passar.");
  if (player.raidDay === player.day && !game.raid)
    L.push("Obrigado por defender a vila hoje! Você foi incrível.");
  if (player.blessDay === player.day) L.push("Você está brilhando um pouquinho. Foi ao templo?");
  if (isNight() && player.zone !== "vila") L.push("Viajando à noite? Você é corajoso.");
  return L;
}
function pickUnheard(id, pool) {
  player.heard = player.heard || {};
  const hs = (player.heard[id] = player.heard[id] || []);
  const key = (e) => JSON.stringify(e).slice(0, 40);
  let opts = pool.filter((e) => !hs.includes(key(e)));
  if (!opts.length) {
    player.heard[id] = [];
    opts = pool;
  }
  const e = opts[Math.floor(Math.random() * opts.length)];
  player.heard[id].push(key(e));
  if (player.heard[id].length > 30) player.heard[id].shift();
  return e;
}
function fillN(t) {
  return t.replace(/\{N\}/g, player.name);
}
function chatWith(id) {
  const first = NPCS[id].nome.split(",")[0],
    ps = PERSONALITIES[id] || "gentil";
  if ((player.drunk || 0) >= 40 && Math.random() < 0.5) {
    say([
      [
        first,
        [
          "Você está bêbad" + genderWord("o", "a", "e") + "? Vai pra casa dormir!",
          "*sente o cheiro* Hidromel do Gus, né?",
          "Fala mais devagar, não estou entendendo nada!",
          "Hahaha, você está trocando as pernas!",
        ][Math.floor(Math.random() * 4)],
      ],
    ]);
    bubble(id, "sweat");
    return;
  }
  if (angry(id)) {
    say([
      [
        first,
        [
          "Hmpf. Não estou com vontade de conversar com você hoje.",
          "Depois do que você disse? Me deixa em paz.",
          "...",
          "Vai procurar outra pessoa pra conversar.",
        ][Math.floor(Math.random() * 4)],
      ],
    ]);
    bubble(id, "anger");
    return;
  }
  if (player.relDay[id + "t"] !== player.day) {
    player.relDay[id + "t"] = player.day;
    player.relDay[id + "tc"] = 0;
    addFriendship(id, 4);
  } else if ((player.relDay[id + "tc"] || 0) < 3) {
    player.relDay[id + "tc"] = (player.relDay[id + "tc"] || 0) + 1;
    addFriendship(id, 1);
  }
  player.asked = player.asked || {};
  const askd = (player.asked[id] = player.asked[id] || []);
  const qs = (NPC_QUESTIONS[id] || [])
    .concat(PERSONALITY_QUESTIONS[ps] || [])
    .filter((q) => !askd.includes(q.q));
  if (qs.length && player.relDay[id + "q"] !== player.day && Math.random() < 0.35) {
    player.relDay[id + "q"] = player.day;
    const q = qs[Math.floor(Math.random() * qs.length)];
    askd.push(q.q);
    choice(
      first,
      fillN(q.q),
      q.a.map(([ans, re, dv]) => ({
        t: ans,
        fn: () => {
          addFriendship(id, dv);
          say([
            ["Você", ans],
            [first, fillN(re)],
          ]);
          bubble(id, dv > 3 ? "smile" : dv < 0 ? "meh" : "chat");
          saveGame();
        },
      })),
    );
    return;
  }
  const ctx = ctxLines(id),
    nl = NPC_LINES[id] || {
      a: [],
      f: [],
      b: [],
    },
    lv = friendshipLevel(id);
  let pool = nl.a.concat(lv >= 2 ? nl.f : [], lv >= 3 ? nl.b : [], SMALLTALK[ps]);
  if (lv === 0)
    pool = pool.concat([`Ainda não nos conhecemos direito. Sou ${NPCS[id].nome}. E você é {N}, certo?`]);
  player.ctxH = player.ctxH || {};
  const fresh = ctx.filter((l) => (player.ctxH[id + l.slice(0, 28)] || -9) < player.day - 1);
  let e;
  if (fresh.length && Math.random() < 0.35) {
    e = fresh[Math.floor(Math.random() * fresh.length)];
    player.ctxH[id + e.slice(0, 28)] = player.day;
  } else e = pickUnheard(id, pool);
  if (typeof e === "string") say([[first, fillN(e)]]);
  else
    say(
      e.map(([w, t]) =>
        t[0] === "*" ? ["", fillN(t.slice(1))] : [w === "Y" ? "Você" : w === "" ? first : w, fillN(t)],
      ),
    );
  bubble(id, "chat");
  saveGame();
}
function greet(id) {
  const h = Math.floor(player.clock / 60),
    t = h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite",
    lv = friendshipLevel(id);
  if (angry(id)) return "Te olha de cara fechada.";
  return [
    `"${t}." Te olha com curiosidade.`,
    `"${t}, ${player.name}."`,
    `"${t}, ${player.name}! Que bom te ver."`,
    `"${player.name}! Meu dia ficou melhor agora."`,
  ][lv];
}

/* ===================== CONVERSAS VIVAS ===================== */

const PERSONALITIES = {
  rainha: "sabio",
  capitao: "aventureiro",
  cocheiro2: "engracado",
  nicoP: "gentil",
  mercOri: "esperto",
  minerA: "orgulhoso",
  peleiro: "serio",
  ancia: "sabio",
  cocheiro3: "engracado",
  odelia: "sabio",
  bruno: "engracado",
  rosa: "gentil",
  doran: "orgulhoso",
  ferreiro: "orgulhoso",
  curandeira: "gentil",
  kael: "serio",
  lia: "crianca",
  iara: "timido",
  tome: "serio",
  cocheiro: "engracado",
  zaid: "esperto",
  marina: "aventureiro",
  tobias: "timido",
};
const SMALLTALK = {
  sabio: [
    "O vento hoje tem cheiro de chuva... e de magia antiga.",
    "Cada runa tem uma voz. Você já aprendeu a ouvir a sua?",
    "Trezentos anos ensinam paciência. E saudade.",
  ],
  engracado: [
    "Sabe por que o mago atravessou a ponte? Porque a ponte era mágica! ...Tá, essa foi ruim.",
    'Ontem um cliente me pediu uma poção de beleza. Falei: "milagre eu não faço"!',
    "Se a vida te der limões, faça uma poção de limão. Vende bem!",
  ],
  gentil: [
    "Você comeu direito hoje? Aventureiro de barriga vazia não vai longe.",
    "Vi um passarinho fazendo ninho no telhado. Que coisa linda, né?",
    "Se precisar de qualquer coisa, é só falar comigo.",
  ],
  orgulhoso: [
    "Meu trabalho é o melhor desta região. Não é opinião, é fato.",
    "Já viu um cajado tão bem polido quanto os meus? Duvido.",
    "Respeito se conquista com trabalho duro.",
  ],
  serio: [
    "Treino todos os dias ao amanhecer. Disciplina vence talento.",
    "Mantenha a guarda alta. Sempre.",
    "Os monstros estão mais inquietos ultimamente.",
  ],
  crianca: [
    "Sabia que eu consigo pular três pedras no rio? Três!",
    "Quando eu crescer quero ter um dragão de estimação!",
    "Você já viu um monstro de verdade? Ele era feio?",
  ],
  timido: [
    "Ah... oi. Eu estava, hum, lendo. Mas pode falar.",
    "Eu gosto de lugares calmos. Você também?",
    "Desculpa, eu não sou muito boa... bom de conversa.",
  ],
  esperto: [
    "Tudo tem um preço, amigo. Até a informação.",
    "Comprei barato, vendi caro. Isso é magia também.",
    "Ouvi dizer que fragmentos arcanos vão valorizar...",
  ],
  aventureiro: [
    "Um dia vou navegar até o fim do mundo e voltar com histórias!",
    "O mar estava agitado hoje. Perfeito!",
    "Você parece gostar de aventura tanto quanto eu.",
  ],
};
const COMPLIMENT = {
  sabio: ["Palavras doces aquecem até corações antigos. Obrigada.", 3],
  engracado: ["Fala isso pra minha mãe! Ela nunca acredita.", 4],
  gentil: ["Ah, que gentileza a sua! Fiquei toda boba.", 4],
  orgulhoso: ["Eu sei. Mas... obrigado por notar.", 3],
  serio: ["Hm. Elogios não vencem batalhas. Mas obrigado.", 2],
  crianca: ["Hehe! Você também é muito legal!", 4],
  timido: ["E-eu? Obrigado... ninguém nunca tinha dito isso.", 5],
  esperto: ["Elogio não abaixa preço, viu? ...Mas gostei.", 2],
  aventureiro: ["Você também não é nada mau!", 4],
};
const COMP_EXTRA = {
  sabio: ["Você tem o dom de fazer uma velha sorrir."],
  engracado: ["Para, para, assim eu fico vermelho que nem poção de morango!"],
  gentil: ["Você é um amor, sabia?", "Ai, assim eu fico sem jeito!"],
  orgulhoso: ["Finalmente alguém com olhos bons nesta vila."],
  serio: ["...Obrigado. Agora volte ao treino."],
  crianca: ["Sério? Vou contar pra minha avó!"],
  timido: ["N-não precisa exagerar... mas obrigado."],
  esperto: ["Gostei. Vou cobrar menos... daqui a uns dez anos."],
  aventureiro: ["Ha! Você também tem um brilho de aventureiro no olhar!"],
};
const JOKE_EXTRA = {
  sabio: ["Essa era piada até no meu tempo!"],
  engracado: ["Essa foi tão ruim que ficou boa!", "Hahaha! Tô chorando de rir!"],
  gentil: ["Que fofo, você tentando me fazer rir."],
  orgulhoso: ["Que nível..."],
  serio: ["Foco.", "Isso não tem graça."],
  crianca: ["Mais uma! Mais uma!"],
  timido: ["Hihi... desculpa, rir alto me deixa sem graça."],
  esperto: ["Piada velha. Essa eu vendo por dois cobres."],
  aventureiro: ["Vou contar essa pros marujos!"],
};
const JOKES = [
  "Por que o esqueleto não foi à festa? Porque não tinha corpo para isso!",
  "Qual é o cúmulo do mago? Ter feitiço de vento e viver resfriado!",
  "Por que a poção foi ao psicólogo? Estava se sentindo muito diluída.",
  "O que a Runa da Terra disse para a da Chama? Fica fria, parceira!",
  "Por que o lobo oco não ganha discussão? Porque não tem argumento por dentro!",
  "Sabe por que o grimório é tão calmo? Porque já viu de tudo, página por página.",
  'O que o feitiço de fogo disse ao de gelo? "Que frieza a sua!"',
  "Qual é o doce preferido do mago? Pé-de-moleque encantado!",
  "Por que o Ent foi ao médico? Estava com galho quebrado!",
];
const JOKE_R = {
  sabio: ["Ha! Faz séculos que não rio assim.", 2],
  engracado: ["HAHAHA! Essa eu vou roubar pra mim!", 6],
  gentil: ["Hihi, que bobinho! Gostei.", 3],
  orgulhoso: ["...Isso foi uma piada?", -1],
  serio: ["Não.", -1],
  crianca: ["HAHAHA! Conta outra! Conta outra!", 6],
  timido: ["Pff... hihi. Desculpa, foi engraçado.", 3],
  esperto: ["Piada boa vale ouro. Essa vale cobre.", 0],
  aventureiro: ["Hahaha! Essa é ótima, marujo!", 5],
};
const FLIRT_OK = {
  sabio: "",
  engracado: "Opa! Assim você me deixa sem graça... e eu adoro.",
  gentil: "Ai... você fala cada coisa. Meu coração disparou.",
  orgulhoso: "Hmpf. Você tem bom gosto, isso eu admito... e um sorriso bonito.",
  serio: "...Você me desconcentrou. Isso não acontece com frequência.",
  timido: "E-eu... você está falando sério? *fica vermelho*",
  aventureiro: "Uau, direto assim? Gosto de quem tem coragem!",
  esperto: "",
  crianca: "",
};
const FLIRT_NO = {
  sabio: "Ora, ora. Guarde esse charme para alguém da sua idade, aprendiz. Tenho trezentos anos!",
  engracado: "Hahaha, essa cantada foi pior que as minhas piadas!",
  orgulhoso: "Concentre-se nas suas aventuras, sim?",
  serio: "Isso não é apropriado. Foco.",
  esperto: "Charme não paga as contas, amigo.",
  gentil: "Ah... você é um doce, mas vamos ser só amigos, tá?",
};
const RUDE_LINES = [
  "Você é bem esquisito, sabia?",
  "Sai da minha frente.",
  "Que trabalho mais inútil o seu.",
  "Nem sei por que estou falando com você.",
];
const RUDE_R = {
  sabio: ["Trezentos anos e ainda me surpreendo com a falta de educação das pessoas.", "…"],
  engracado: ["Nossa... essa doeu. Não tem graça nenhuma.", "anger"],
  gentil: ["Por que você está falando assim comigo? Eu só quis ajudar...", "sweat"],
  orgulhoso: ["COMO É? Saia da minha loja antes que eu perca a paciência!", "anger"],
  serio: ["Repita isso e vamos resolver no campo de treino.", "anger"],
  crianca: ["Buáá! Vou contar pra minha avó!", "sweat"],
  timido: ["...desculpa por existir, então.", "sweat"],
  esperto: ["Grosseria agora custa mais caro. Os preços subiram pra você.", "anger"],
  aventureiro: ["Ei! Fala assim de novo e vai nadar com os peixes!", "anger"],
};
function angry(id) {
  return player.angry && player.angry[id] === player.day;
}
function bubble(id, icon) {
  const z = ZONES[player.zone];
  for (const [x, y, n] of z.npcList)
    if (n === id)
      game.bubbles.push({
        x,
        y,
        icon,
        t: 2.6,
      });
}
function talkMenu(id) {
  const nm = NPCS[id].nome,
    first = nm.split(",")[0],
    ps = PERSONALITIES[id] || "gentil",
    once = (k) => player.relDay[id + k] !== player.day,
    mark = (k) => (player.relDay[id + k] = player.day);
  const opts = [
    {
      t: "Bater papo",
      fn: () => chatWith(id),
    },
    {
      t: "Elogiar",
      fn: () => {
        const [l0, v] = COMPLIMENT[ps];
        const l = pickUnheard(id + "C", [l0].concat(COMP_EXTRA[ps] || []));
        if (angry(id)) {
          say([[first, "Elogio agora? Depois do que você disse? Hmpf."]]);
          return;
        }
        if (once("c")) {
          mark("c");
          addFriendship(id, v);
        } else {
          say([[first, "Você já me elogiou hoje... está querendo alguma coisa?"]]);
          return;
        }
        say([
          [
            "Você",
            ["Você está ótimo hoje!", "Admiro muito o seu trabalho.", "Esta vila é melhor com você nela."][
              Math.floor(Math.random() * 3)
            ],
          ],
          [first, l],
        ]);
        bubble(id, "smile");
        saveGame();
      },
    },
    {
      t: "Contar uma piada",
      fn: () => {
        const [l0, v] = JOKE_R[ps];
        const l = pickUnheard(id + "J", [l0].concat(JOKE_EXTRA[ps] || []));
        const j = pickUnheard("jokes", JOKES);
        if (once("j")) {
          mark("j");
          addFriendship(id, v);
        }
        say([
          ["Você", j],
          [first, l],
        ]);
        bubble(id, v > 3 ? "laugh" : v < 0 ? "meh" : "smile");
        saveGame();
      },
    },
  ];
  if (id !== "lia")
    opts.push({
      t: player.spouse === id ? "Fazer um carinho ♥" : "Flertar ♥",
      fn: () => {
        if (player.spouse === id) {
          if (once("f")) {
            mark("f");
            player.mp = Math.min(maxMp(), player.mp + 10);
          }
          say([[first, "Você sempre sabe me fazer sorrir. Te amo."]]);
          bubble(id, "heart");
          return;
        }
        if (angry(id)) {
          say([[first, "Flertando depois de ser grosso? Sério?"]]);
          addFriendship(id, -2);
          bubble(id, "anger");
          return;
        }
        const line = [
          "Seus olhos brilham mais que qualquer runa.",
          "Se eu soubesse que você estaria aqui, teria penteado o cabelo.",
          "Você acredita em magia à primeira vista?",
          "Toda vez que te vejo, meu mana sobe.",
        ][Math.floor(Math.random() * 4)];
        if (!ROMANCE.includes(id)) {
          say([
            ["Você", line],
            [first, FLIRT_NO[ps] || "Hã? Hahaha, que coisa!"],
          ]);
          bubble(id, "sweat");
          return;
        }
        if (player.spouse && player.spouse !== id) {
          say([
            ["Você", line],
            [first, `Ei! Você não é casado(a) com ${NPCS[player.spouse].nome.split(",")[0]}? Que feio!`],
          ]);
          addFriendship(id, -3);
          addFriendship(player.spouse, -5);
          bubble(id, "anger");
          saveGame();
          return;
        }
        if ((player.rep ?? 50) < 25 && friendship(id) < 45) {
          say([
            ["Você", line],
            [
              first,
              "Ouvi falar de você... Não, obrigad" +
                (["rosa", "curandeira", "iara", "marina"].includes(id) ? "a" : "o") +
                ".",
            ],
          ]);
          bubble(id, "meh");
          return;
        }
        const ok = friendship(id) >= 18 || Math.random() < 0.5;
        if (ok) {
          if (once("f")) {
            mark("f");
            addFriendship(id, 6);
          }
          say([
            ["Você", line],
            [first, FLIRT_OK[ps]],
          ]);
          bubble(id, "heart");
          playSound(784, 0.15, "sine");
        } else {
          addFriendship(id, -2);
          say([
            ["Você", line],
            [first, 'Hã... a gente mal se conhece. Que tal começar com um "bom dia"?'],
          ]);
          bubble(id, "blush");
        }
        saveGame();
      },
    });
  opts.push({
    t: "Pedir um conselho",
    fn: () => {
      const A = {
        odelia: "Os Guardiões são fracos contra a última runa que você recuperou. Lembre disso.",
        kael: "Defender recupera mana. Use quando o MP acabar.",
        zaid: "Monstros soltam mais fragmentos à noite. Arriscado, mas lucrativo.",
        curandeira: "Ervas Medicinais curam ferimentos graves. Leve sempre uma.",
        bruno: "Grandes Poções salvam vidas contra chefes.",
        rosa: "Coma bem antes de viajar. Fome enfraquece a magia.",
        doran: "Um cajado do seu elemento aumenta muito o dano.",
        ferreiro: "Armadura e manto juntos reduzem bastante o dano.",
        iara: "A Academia em ruínas tem tomos que ensinam feitiços novos.",
        tome: "À noite os monstros são mais fortes. Volte cedo.",
        cocheiro: "Com um cavalo você anda duas vezes mais rápido.",
        lia: "Minha avó diz que a fonte da praça mata a sede!",
        marina: "O Amuleto de Pérola protege bem nas viagens.",
        tobias: "Minere todo dia em Pedravale. Às vezes sai fragmento!",
      };
      say([[first, A[id] || "Siga seu coração... e a seta dourada."]]);
    },
  });
  if (angry(id))
    opts.push({
      t: "Pedir desculpas",
      fn: () => {
        player.angry[id] = 0;
        addFriendship(id, 4);
        say([
          ["Você", "Desculpa pelo que eu disse. Foi errado."],
          [
            first,
            ps === "orgulhoso"
              ? "...Tudo bem. Mas não se repita."
              : "Tudo bem... eu aceito. Mas não faça de novo, tá?",
          ],
        ]);
        bubble(id, "smile");
        saveGame();
      },
    });
  if (!NO_FIGHT.has(id) && id !== player.spouse)
    opts.push({
      t: "Partir para a briga ",
      fn: () => startBrawl(id, NPCS[id].nome),
    });
  opts.push({
    t: "Ser grosseiro ",
    fn: () => {
      const [l, ic] = RUDE_R[ps];
      repAdd(-2);
      player.rudeCount = (player.rudeCount || 0) + 1;
      player.angry = player.angry || {};
      player.angry[id] = player.day;
      addFriendship(id, -10);
      say([
        ["Você", RUDE_LINES[Math.floor(Math.random() * RUDE_LINES.length)]],
        [first, l],
        [
          "",
          `${first} ficou chateado(a) com você. Amizade -10. Até amanhã, os preços dele(a) sobem 30% e a conversa fica fria. Peça desculpas para melhorar.`,
        ],
      ]);
      bubble(id, ic);
      playSound(160, 0.2, "square");
      saveGame();
    },
  });
  opts.push({
    t: "Voltar",
    fn: () => socialMenu(id),
  });
  choice(
    `Conversar com ${first}`,
    `Personalidade: ${
      {
        sabio: "sábia",
        engracado: "brincalhão",
        gentil: "gentil",
        orgulhoso: "orgulhoso",
        serio: "sério",
        crianca: "criança curiosa",
        timido: "tímido",
        esperto: "esperto",
        aventureiro: "aventureira",
      }[ps]
    }${angry(id) ? ' · <span style="color:#ff8a8a">irritado com você</span>' : ""}`,
    opts,
  );
}
function socialMenu(id) {
  if (despised(id)) {
    despiseMenu(id);
    return;
  }
  if (id === "lucas" && lucasGate()) return;
  const fr = FRIENDS[id],
    nm = NPCS[id].nome,
    opts = [];
  if (fr.shop)
    opts.push({
      t:
        "Comprar" + (angry(id) ? " (irritado: preços +30%)" : discount(fr.shop) < 1 ? " (15% desconto)" : ""),
      fn: () => openShop(fr.shop),
    });
  if (id === "curandeira")
    opts.push({
      t: "Tratamento",
      fn: healerMenu,
    });
  if (id === "kael")
    opts.push({
      t: "Treinar",
      fn: () => {
        const l = kaelTalk();
        if (l) say(l);
      },
    });
  if (id === "zaid")
    opts.push({
      t: "Fazer trocas",
      fn: openTrade,
    });
  if (id === "cocheiro2" || id === "cocheiro3")
    opts.push({
      t: "Viajar de carruagem",
      fn: carriageMenu,
    });
  if (id === "cocheiro")
    opts.push(
      {
        t: player.horse ? "Cuidar do cavalo (já é seu)" : "Comprar cavalo (250 ouro)",
        fn: buyHorse,
      },
      {
        t: "Viajar de carruagem",
        fn: carriageMenu,
      },
    );
  opts.push(...crewItems(id));
  opts.push(...moralItems(id));
  opts.push(...townQuestMenuItems(id));
  opts.push(...affectionMenuItems({ id }));
  opts.push(...openRelationshipItems(id));
  opts.push(...lifeSocialItems(id));
  opts.push(...relationEndItems(id));
  opts.push({
    t: "Conversar…",
    fn: () => talkMenu(id),
  });
  if (
    ![
      "bruno",
      "rosa",
      "doran",
      "zaid",
      "cocheiro",
      "curandeira",
      "cocheiro2",
      "cocheiro3",
      "nicoP",
      "mercOri",
      "minerA",
      "peleiro",
    ].includes(id)
  )
    opts.push({
      t: "Ouvir o que tem a dizer",
      fn: () => {
        const l = NPCS[id].talk();
        if (l) say(l);
      },
    });
  const dj = player.jobs.find((j) => j.type === "deliver" && j.to === id);
  if (dj)
    opts.push({
      t: `Entregar ${dj.n}× ${ITEMS[dj.item].nome} (trabalho)`,
      fn: () => deliverJob(dj),
    });
  opts.push({
    t: "Dar presente",
    fn: () => giftMenu(id),
  });
  if (ROMANCE.includes(id) && !player.spouse && !player.dating && friendshipLevel(id) >= 2)
    opts.push({
      t: "Convidar para namorar ♥" + (lifeMode() ? ` (chance ~${Math.round(romanceOdds(id, "namoro").chance * 100)}%)` : ""),
      fn: () => {
        if (id === "rainha" && !royalSuitor()) {
          say([
            [nm, "*ri baixinho* Você é encantador. Mas uma rainha não namora qualquer pessoa."],
            ["", "Para cortejar a Rainha você precisa de reputação 70+ e ter feito algo pelo reino (libertar um Guardião ou servir na Guarda Real)."],
          ]);
          return;
        }
        if (lifeMode() && !romanceAccepts(id, "namoro")) return;
        player.dating = id;
        player.datingSince = player.day;
        addFriendship(id, 5);
        saveGame();
        playSound(784, 0.2, "sine");
        say([
          [nm, "Eu... estava esperando você perguntar. Sim! Vamos tentar."],
          [
            "",
            `Vocês estão namorando! Continue fortalecendo a relação. Com amizade 75+ e um Anel de Compromisso, peça em casamento.`,
          ],
        ]);
      },
    });
  if (player.dating === id && !player.spouse)
    opts.push({
      t: "Pedir em casamento" + (lifeMode() ? ` (chance ~${Math.round(romanceOdds(id, "casamento").chance * 100)}%)` : ""),
      fn: () => {
        if (!itemCount("anel")) {
          say([[nm, "(Você precisa de um Anel de Compromisso. O Ourives Lúcio vende no mercado.)"]]);
          return;
        }
        if (friendship(id) < 75) {
          say([[nm, "Eu gosto muito de você... mas vamos esperar mais um pouco? (amizade 75+)"]]);
          return;
        }
        if (id === "rainha" && (player.rep ?? 50) < 80) {
          say([[nm, "Eu digo sim com o coração. Mas o reino precisa amar você também. (reputação 80+)"]]);
          return;
        }
        if (lifeMode() && !romanceAccepts(id, "casamento")) return;
        removeItem("anel");
        if (id === "rainha") {
          say(
            [
              [nm, "*tira a luva e estende a mão* Sim. Que Cinzaluz inteira escute: sim!"],
              ["", "O castelo prepara um casamento real. Sinos, pétalas e a vila inteira na porta do Templo."],
            ],
            () => startWedding(id),
          );
          return;
        }
        say([[nm, "Sim! Mil vezes sim!"]], () => startWedding(id));
      },
    });
  player.lovers = player.lovers || [];
  player.sspouses = player.sspouses || [];
  player.skids = player.skids || [];
  if (ROMANCE.includes(id) && (player.spouse || player.dating) && !isPartner(id) && friendshipLevel(id) >= 2)
    opts.push({
      t: openRelationship() ? "Namorar também ♥ (relação aberta)" : "Namorar em segredo ",
      fn: () => {
        if (openRelationship()) {
          player.lovers.push(id);
          addFriendship(id, 5);
          saveGame();
          say([
            [nm, "Você tem uma relação aberta? Que moderno! Então... sim, vamos sair juntos."],
            ["", `Agora vocês namoram. ${NPCS[player.spouse || player.dating].nome.split(",")[0]} já sabe e está tudo bem.`],
          ]);
          return;
        }
        if ((player.rep ?? 50) < 25 && friendship(id) < 60) {
          say([[nm, "Com a fama que você tem? Nem pensar."]]);
          return;
        }
        player.lovers.push(id);
        addFriendship(id, 5);
        saveGame();
        say(
          [
            [nm, "Isso é errado... mas eu também sinto algo por você. Ninguém pode saber, ouviu?"],
            [
              "",
              `Agora vocês namoram escondido. Cuidado: se ${NPCS[player.spouse || player.dating].nome.split(",")[0]} ou a vila descobrir, sua fama vai despencar.`,
            ],
          ],
          () => witnessCheck(id),
        );
      },
    });
  if (player.lovers.includes(id) && !player.spouse && !player.dating)
    opts.push({
      t: "Assumir o namoro para todos",
      fn: () => {
        player.lovers = player.lovers.filter((x) => x !== id);
        player.dating = id;
        saveGame();
        say([[nm, "Finalmente! Não aguentava mais esconder."]]);
      },
    });
  if (player.lovers.includes(id))
    opts.push({
      t: "Encontro escondido ♥",
      fn: () => {
        if (player.relDay[id + "s"] === player.day) {
          say([[nm, "Já nos vimos hoje... alguém pode desconfiar."]]);
          return;
        }
        player.relDay[id + "s"] = player.day;
        addFriendship(id, 6);
        bubble(id, "heart");
        saveGame();
        say([["", "Vocês se encontram atrás do moinho, longe dos olhares curiosos."]], () =>
          witnessCheck(id),
        );
      },
    });
  if (player.lovers.includes(id) && friendship(id) >= 75)
    opts.push({
      t: "Casar em segredo ",
      fn: () => {
        if (!itemCount("anel")) {
          say([[nm, "(Você precisa de um Anel de Compromisso.)"]]);
          return;
        }
        removeItem("anel");
        player.lovers = player.lovers.filter((x) => x !== id);
        player.sspouses.push(id);
        player.smarried = player.smarried || {};
        player.smarried[id] = player.day;
        game.fade = 1;
        saveGame();
        say([
          ["", "À meia-noite, numa capelinha escondida na serra, vocês trocam votos sem testemunhas."],
          [nm, "Agora somos uma família. Uma família secreta."],
          ["", "Você tem uma família secreta. Visite sempre que puder... e reze para ninguém descobrir."],
        ]);
      },
    });
  if (player.sspouses.includes(id)) {
    opts.push({
      t: "Visitar a família secreta",
      fn: () => {
        if (player.relDay[id + "v"] === player.day) {
          say([[nm, "Volte amanhã, meu amor. Os vizinhos estão olhando."]]);
          return;
        }
        player.relDay[id + "v"] = player.day;
        addFriendship(id, 4);
        player.hp = Math.min(maxHp(), player.hp + Math.round(maxHp() * 0.3));
        player.mp = Math.min(maxMp(), player.mp + Math.round(maxMp() * 0.3));
        saveGame();
        const sk = player.skids.filter((k) => k.p === id);
        const gift = secretVisitGift();
        say(
          [
            [
              "",
              `Você passa a tarde com ${nm.split(",")[0]}${sk.length ? " e " + sk.map((k) => k.name).join(" e ") : ""}. +30% HP e MP.${gift}`,
            ],
          ],
          () => witnessCheck(id),
        );
      },
    });
    if (
      player.day - (player.smarried || {})[id] >= 2 &&
      player.skids.filter((k) => k.p === id).every((k) => player.day - k.born >= 2)
    )
      opts.push({
        t: "Ter um filho com " + nm.split(",")[0],
        fn: () => {
          const g = Math.random() < 0.5 ? "m" : "f",
            name = (g === "m" ? ["Caio", "Davi", "Theo", "Enzo"] : ["Alice", "Clara", "Lívia", "Maya"])[
              Math.floor(Math.random() * 4)
            ];
          player.skids.push({
            name,
            g,
            p: id,
            born: player.day,
          });
          saveGame();
          celebrateBirth(g, () =>
            say([
              [nm, "Nasceu! Olha que coisinha linda..."],
              ["", `${name} nasceu! Mais um segredo para guardar.`],
            ]),
          );
        },
      });
  }
  if (player.lovers.includes(id) || player.sspouses.includes(id))
    opts.push({
      t: "Terminar em segredo",
      fn: () => {
        player.lovers = player.lovers.filter((x) => x !== id);
        player.sspouses = player.sspouses.filter((x) => x !== id);
        player.rel[id] = Math.max(0, friendship(id) - 25);
        saveGame();
        say([[nm, "Então era só isso que eu valia pra você? Vai embora!"]]);
      },
    });
  if (fr.work)
    opts.push({
      t: "Trabalhar 3 horas (ganhar ouro)",
      fn: () => doWork(id),
    });
  opts.push({
    t: "Sair",
    fn: null,
  });
  choice(
    nm,
    `${greet(id)}<br>Amizade: <span style="color:#ff8aa8">${hearts(id)}</span> ${REL_LV[friendshipLevel(id)][1]} (${friendship(id)}/100)`,
    opts,
  );
}
function giftMenu(id) {
  const nm = NPCS[id].nome;
  if (player.relDay[id + "g"] === player.day) {
    say([[nm, "Você já me deu um presente hoje. Obrigado mesmo assim!"]]);
    return;
  }
  const ids = Object.keys(player.inv)
    .filter((i) => ITEMS[i].tipo !== "equip")
    .slice(0, 8);
  if (!ids.length) {
    say([["", "Você não tem nada para dar. Compre algo no mercado."]]);
    return;
  }
  choice(
    "Dar presente para " + nm,
    `Dica: cada pessoa tem um presente favorito. Favorito de ${nm.split(",")[0]}: ${friendshipLevel(id) >= 1 || player.relRew[id + "fav"] ? ITEMS[FRIENDS[id].fav].nome : "??? (fique mais amigo ou ouça boatos na taverna)"}`,
    ids
      .map((i) => ({
        t: `${ITEMS[i].nome} ×${itemCount(i)}`,
        fn: () => {
          removeItem(i);
          player.relDay[id + "g"] = player.day;
          const fav = i === FRIENDS[id].fav;
          addFriendship(id, fav ? 15 : i === "perfume" ? 12 : ["flor", "lenco"].includes(i) ? 10 : 6);
          playSound(700, 0.12, "sine");
          say([
            [
              nm,
              fav ? "Isso é o meu favorito! Como você sabia? Muito obrigado!" : "Que gentileza! Obrigado.",
            ],
          ]);
          saveGame();
        },
      }))
      .concat([
        {
          t: "Cancelar",
          fn: null,
        },
      ]),
  );
}
function doWork(id) {
  const nm = NPCS[id].nome;
  if (isNight()) {
    say([[nm, "Já está escuro. Volte de dia para trabalhar."]]);
    return;
  }
  if (player.relDay[id + "w"] === player.day) {
    say([[nm, "Por hoje chega! Volte amanhã."]]);
    return;
  }
  const pay = 20 + player.lvl * 4;
  player.relDay[id + "w"] = player.day;
  player.gold += pay;
  player.clock = Math.min(1439, player.clock + 180);
  player.food = Math.max(0, player.food - 15);
  player.water = Math.max(0, player.water - 18);
  addFriendship(id, 5);
  game.fade = 1;
  playSound(660, 0.12, "sine");
  const job = {
    bruno: "mexendo caldeirões de poção",
    rosa: "atendendo clientes na barraca",
    ferreiro: "segurando o ferro na forja",
    kael: "arrumando os bonecos de treino",
    cocheiro: "escovando os cavalos",
  }[id];
  say([
    ["", `Você passa 3 horas ${job}. Ganhou ${pay} de ouro!`],
    [nm, "Bom trabalho! Volte amanhã se quiser mais."],
  ]);
  saveGame();
}


/* ===================== CAPÍTULOS NAS OUTRAS VILAS ===================== */

/** Recompensa comum dos capítulos: XP, ouro e um item. */
function chapterReward(xp, gold, item) {
  gainXP(xp);
  player.gold += gold;
  if (item) addItem(item);
  saveGame();
  return `+${xp} XP, +${gold} ouro${item ? ` e ${ITEMS[item].nome}` : ""}.`;
}

/** Porto Brisamar e Pedravale: prédios que fazem parte da história. */
function storyBuilding(b) {
  if (lifeMode()) return false;
  // Capítulo do Porto: o Farol que Lembra.
  if (b.name === "Farol de Brisamar" && player.flags.porto1 && !player.flags.porto2) {
    if (!isNight()) {
      say([["", "O farol está apagado. O Capitão disse que ele só mostra o que guarda depois que escurece. Volte à noite (tecla H espera)."]]);
      return true;
    }
    player.flags.porto2 = true;
    queueMoral("farol");
    game.flash = 1;
    playSound(523, 0.4, "sine");
    say([
      ["", "Você sobe os degraus e acende a grande lanterna. A luz varre o mar... e a névoa forma duas figuras na areia."],
      ["Odelia (eco)", "Vesper! Olha, o farol acendeu sozinho! Faz um pedido!"],
      ["Vesper (eco)", "Eu peço que a Canção nunca acabe. E que a gente nunca brigue."],
      ["Odelia (eco)", "Bobo. Irmãos brigam. Depois fazem as pazes. É a regra."],
      ["", "As figuras se desfazem. Eram crianças. Eram Odelia e Vesper, há trezentos anos."],
      ["Capitão Bento", "Viu? Meu avô dizia que o farol lembra de tudo que viu. Tome, isto estava guardado lá em cima."],
      ["", chapterReward(70, 80, "amu2") + " Capítulo do Porto concluído!"],
    ]);
    return true;
  }
  // Capítulo de Pedravale: a Forja do Irmão.
  if (b.name === "Mina de Cristal" && player.flags.serra1 && !player.flags.serra2 && !itemCount("fragmento")) {
    player.flags.serra2 = true;
    queueMoral("mina");
    addItem("fragmento");
    player.clock = Math.min(1439, player.clock + 120);
    game.fade = 1;
    saveGame();
    say([
      ["", "Lá no fundo da mina, um cristal pulsa no ritmo de uma canção que você quase reconhece."],
      ["", "Você encontrou um Fragmento Arcano! Leve à Forja Anã."],
    ]);
    return true;
  }
  if (b.name === "Forja Anã" && player.flags.serra1 && !player.flags.serra3 && itemCount("fragmento")) {
    removeItem("fragmento");
    player.flags.serra3 = true;
    queueMoral("forja");
    game.flash = 1;
    playSound(392, 0.3, "square");
    say([
      ["Anciã Berta", "Os anões guardaram o molde por trezentos anos. Ninguém tinha coragem de reabri-lo."],
      ["", "O fragmento derrete no molde. Gravadas no metal, aparecem palavras numa letra apertada:"],
      ["", '"Para proteger a Canção, eu a guardo. Para proteger Odelia, eu me guardo junto. — V."'],
      ["Anciã Berta", "Ele não fez o cajado para destruir a magia. Fez para trancá-la... e se trancou junto. Leve esta lembrança da forja."],
      ["", chapterReward(90, 120, "amu3") + " Capítulo de Pedravale concluído!"],
      ["", "Agora vá aos Picos Uivantes libertar o Grifo de Pedra."],
    ]);
    return true;
  }
  return false;
}
