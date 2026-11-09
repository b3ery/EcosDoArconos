/* 05-interface-e-comercio.js: junta 07-trabalhos-comercio-ataques.js, 08-interface.js. */
/**
 * ECOS DO ARCANO — 05-interface-e-comercio.js
 * Quadro de trabalhos, central de trocas, cavalo, carruagem e ataques à vila.
 */

/* ===================== TRABALHOS ===================== */

const POSTERS = ["lia", "iara", "tome", "odelia", "kael", "rosa", "bruno", "ferreiro"];
function genJobs() {
  const g = guardiansFreed(),
    R = Math.random,
    list = [];
  const hunts = [
    ["lobo", "bosque", 1],
    ["cogumelo", "bosque", 1],
  ];
  if (g >= 1) hunts.push(["sapo", "pantano", 2], ["espectro", "pantano", 2]);
  if (g >= 2) hunts.push(["harpia", "picos", 3], ["golem", "picos", 3]);
  if (player.visited.includes("escola")) hunts.push(["livro", "escola", 3]);
  const gz = [["bosque", 1]];
  if (g >= 1) gz.push(["pantano", 2]);
  if (g >= 2) gz.push(["picos", 3]);
  const h = hunts[Math.floor(R() * hunts.length)],
    n = 3 + Math.floor(R() * 3);
  list.push({
    type: "hunt",
    enemy: h[0],
    zone: h[1],
    n,
    prog: 0,
    poster: POSTERS[Math.floor(R() * POSTERS.length)],
    reward: n * (10 + h[2] * 8) + player.lvl * 3,
    t: `Derrote ${n} ${ENEMIES[h[0]].nome} (${ZONES[h[1]].nome})`,
  });
  const z = gz[Math.floor(R() * gz.length)];
  list.push({
    type: "gather",
    zone: z[0],
    n: 3,
    prog: 0,
    herbs: null,
    poster: POSTERS[Math.floor(R() * POSTERS.length)],
    reward: 35 + z[1] * 25 + player.lvl * 2,
    t: `Colete 3 Ervas Silvestres em ${ZONES[z[0]].nome}`,
  });
  const vis = [
    ["bosque", "Altar do Bosque"],
    ["porto", "Farol de Brisamar"],
    ["serra", "Mina de Cristal"],
  ];
  if (g >= 1) vis.push(["pantano", "Altar do Pântano"]);
  if (g >= 2) vis.push(["picos", "Altar dos Picos"]);
  const v = vis[Math.floor(R() * vis.length)],
    vz = ZONES[v[0]];
  const vp =
    v[0] === "porto"
      ? [39, 21]
      : v[0] === "serra"
        ? [21, 7]
        : (vz.feats.find((f) => f[2] === "F") || [2, 2]).slice(0, 2);
  list.push({
    type: "visit",
    zone: v[0],
    x: vp[0],
    y: vp[1],
    place: v[1],
    n: 1,
    prog: 0,
    poster: POSTERS[Math.floor(R() * POSTERS.length)],
    reward: 45 + player.lvl * 4 + (v[0] === "picos" ? 40 : v[0] === "pantano" ? 25 : 0),
    t: `Leve uma mensagem até ${v[1]} (${vz.nome.split(",")[0]})`,
  });
  const items = ["pao", "agua", "maca", "cha", "ensopado"],
    it = items[Math.floor(R() * items.length)],
    to = ["lia", "iara", "tome", "odelia", "kael"][Math.floor(R() * 5)],
    dn = 1 + Math.floor(R() * 3);
  list.push({
    type: "deliver",
    item: it,
    to,
    n: dn,
    prog: 0,
    poster: to,
    reward: ITEMS[it].preco * dn + 25 + player.lvl * 2,
    t: `Leve ${dn}× ${ITEMS[it].nome} para ${NPCS[to].nome}`,
  });
  return list;
}
function guardiansFreed() {
  return player.guards.filter((z) => ["bosque", "pantano", "picos", "mina", "porto"].includes(z)).length;
}
function openJobs(direct) {
  if (!direct) return professionsMenu();
  if (!player.board || player.board.day !== player.day)
    player.board = {
      day: player.day,
      list: genJobs(),
    };
  game.mode = "shop";
  game.shopId = "__jobs";
  renderJobs();
  byId("shop").style.display = "block";
  playSound(440, 0.1, "sine");
}
const JOB_ICON = {
  hunt: ["", "Caça", "#e06b5a"],
  gather: ["", "Coleta", "#7ad36b"],
  deliver: ["", "Entrega", "#d9a441"],
  visit: ["", "Mensageiro", "#5fb8ff"],
};
function jobCard(j, i, mine) {
  const [ic, lab, col] = JOB_ICON[j.type],
    pct =
      j.type === "deliver"
        ? itemCount(j.item) >= j.n
          ? 100
          : Math.round((100 * itemCount(j.item)) / j.n)
        : Math.round((100 * j.prog) / j.n);
  const stars =
    "★".repeat(Math.min(3, 1 + Math.floor(j.reward / 70))) +
    "☆".repeat(3 - Math.min(3, 1 + Math.floor(j.reward / 70)));
  const prog =
    j.type === "deliver"
      ? `Você tem ${itemCount(j.item)}/${j.n} · entregue falando com ${NPCS[j.to].nome.split(",")[0]}`
      : j.type === "visit"
        ? j.prog
          ? "Mensagem entregue!"
          : `Vá até ${j.place}`
        : `${j.prog}/${j.n}`;
  const done = mine && j.prog >= j.n && j.type !== "deliver";
  return `<div class="jcard ${done ? "jdone" : ""}" style="--jc:${col}"><div class="jtop"><span class="jic">${ic}</span><span class="jlab">${lab}</span><span class="jst">${stars}</span></div>
    <div class="jt">${j.t}</div><div class="jpo">Pedido por <b>${NPCS[j.poster].nome.split(",")[0]}</b></div>
    ${mine ? `<div class="jbar"><i style="width:${pct}%"></i></div><div class="jpr">${prog}</div>` : ""}
    <div class="jft"><span class="jgold">◆ ${j.reward}</span><span class="jheart">♥ amizade</span>
    ${mine ? (done ? `<button data-c="${i}" class="jbtn">Receber</button>` : `<button data-x="${i}" class="jbtn2">Desistir</button>`) : `<button data-a="${i}" class="jbtn" ${player.jobs.length >= 2 ? "disabled" : ""}>Aceitar</button>`}</div></div>`;
}
function renderJobs() {
  let h = `<div class="gh"><h2> Quadro de Trabalhos</h2><button id="shclose">Fechar (Esc)</button></div>
  <div class="gsub">Dia ${player.day} · Aceite até 2 trabalhos · Seu ouro: <b style="color:var(--gold)">${player.gold}</b> · Novos pedidos chegam todo dia.</div>
  <h3>Seus trabalhos (${player.jobs.length}/2)</h3><div class="jgrid">`;
  if (!player.jobs.length) h += '<div class="qtip">Nenhum trabalho aceito. Escolha um pedido abaixo!</div>';
  player.jobs.forEach((j, i) => (h += jobCard(j, i, true)));
  h += '</div><h3>Pedidos de hoje</h3><div class="jgrid">';
  player.board.list.forEach((j, i) => (h += jobCard(j, i, false)));
  if (!player.board.list.length)
    h += '<div class="qtip">Você pegou todos os pedidos de hoje. Volte amanhã!</div>';
  h += "</div>";
  byId("shop").innerHTML = h;
  byId("shclose").onclick = closeShop;
  byId("shop")
    .querySelectorAll("[data-a]")
    .forEach(
      (b) =>
        (b.onclick = () => {
          const j = player.board.list.splice(+b.dataset.a, 1)[0];
          if (j.type === "gather") {
            const z = ZONES[j.zone];
            j.herbs = [];
            for (let k = 0; k < 40 && j.herbs.length < 3; k++) {
              const p = z.spawn[Math.floor(Math.random() * z.spawn.length)];
              if (!j.herbs.some((q) => Math.abs(q[0] - p[0]) + Math.abs(q[1] - p[1]) < 10)) j.herbs.push(p);
            }
          }
          player.jobs.push(j);
          toast("Trabalho aceito: " + j.t, 3000);
          playSound(700, 0.1, "sine");
          saveGame();
          renderJobs();
        }),
    );
  byId("shop")
    .querySelectorAll("[data-x]")
    .forEach(
      (b) =>
        (b.onclick = () => {
          player.jobs.splice(+b.dataset.x, 1);
          saveGame();
          renderJobs();
        }),
    );
  byId("shop")
    .querySelectorAll("[data-c]")
    .forEach(
      (b) =>
        (b.onclick = () => {
          const j = player.jobs.splice(+b.dataset.c, 1)[0];
          player.gold += j.reward;
          repAdd(2);
          addFriendship(j.poster, 8);
          playSound(880, 0.15, "sine");
          setTimeout(() => playSound(1175, 0.2, "sine"), 120);
          toast(`Trabalho concluído! +${j.reward} de ouro`, 3000);
          saveGame();
          renderJobs();
        }),
    );
}
function deliverJob(j) {
  const nm = NPCS[j.to].nome;
  if (itemCount(j.item) < j.n) {
    say([
      [
        nm,
        `Preciso de ${j.n}× ${ITEMS[j.item].nome}. Você tem ${itemCount(j.item)}. Dá para comprar no mercado.`,
      ],
    ]);
    return;
  }
  removeItem(j.item, j.n);
  player.jobs = player.jobs.filter((x) => x !== j);
  player.gold += j.reward;
  addFriendship(j.to, 8);
  playSound(880, 0.15, "sine");
  saveGame();
  say([
    [nm, "Era exatamente disso que eu precisava. Obrigado!"],
    ["", `Trabalho concluído! +${j.reward} de ouro.`],
  ]);
}

/* ===================== CENTRAL DE TROCAS ===================== */

const TRADES = [
  {
    give: {
      couro: 3,
    },
    get: "pocaoG",
    n: 1,
  },
  {
    give: {
      esporo: 2,
      pele: 1,
    },
    get: "ervas",
    n: 1,
  },
  {
    give: {
      essencia: 3,
    },
    get: "eterG",
    n: 2,
  },
  {
    give: {
      penaH: 3,
    },
    get: "amu2",
    n: 1,
  },
  {
    give: {
      pedra: 3,
      couro: 2,
    },
    get: "armMalha",
    n: 1,
  },
  {
    give: {
      cristal: 3,
    },
    get: "elixir",
    n: 1,
  },
  {
    give: {
      papiro: 3,
    },
    get: "cajadoDir",
    n: 1,
  },
  {
    give: {
      fragmento: 3,
    },
    get: "fenix",
    n: 1,
  },
  {
    give: {
      fragmento: 5,
      cristal: 2,
    },
    get: "mantoEst",
    n: 1,
  },
  {
    give: {
      fragmento: 8,
    },
    get: "cajadoVes",
    n: 1,
  },
];
function openTrade() {
  game.mode = "shop";
  game.shopId = "__trade";
  renderTrade();
  byId("shop").style.display = "block";
  playSound(440, 0.1, "sine");
}
function renderTrade() {
  let h = `<div class="gh"><h2>Central de Trocas · Zaid</h2><button id="shclose">Fechar (Esc)</button></div><div class="gsub">Troque materiais que os monstros deixam por itens raros. Fragmentos Arcanos caem raramente de qualquer monstro.</div>`;
  TRADES.forEach((t, i) => {
    const can = Object.entries(t.give).every(([k, v]) => itemCount(k) >= v);
    const it = ITEMS[t.get];
    h += `<div class="irow"><div><div class="nm" style="${it.lend ? "color:#ffe066" : ""}">${t.n > 1 ? t.n + "× " : ""}${it.nome}</div><div class="ds">${it.desc}</div><div class="ds">Custa: ${Object.entries(
      t.give,
    )
      .map(
        ([k, v]) =>
          `<span style="color:${itemCount(k) >= v ? "#7ad36b" : "#ff8a8a"}">${v}× ${ITEMS[k].nome} (${itemCount(k)})</span>`,
      )
      .join(", ")}</div></div><button data-tr="${i}" ${can ? "" : "disabled"}>Trocar</button></div>`;
  });
  byId("shop").innerHTML = h;
  byId("shclose").onclick = closeShop;
  byId("shop")
    .querySelectorAll("[data-tr]")
    .forEach(
      (b) =>
        (b.onclick = () => {
          const t = TRADES[+b.dataset.tr];
          for (const [k, v] of Object.entries(t.give)) removeItem(k, v);
          addItem(t.get, t.n);
          addFriendship("zaid", 4);
          playSound(880, 0.15, "sine");
          toast("Troca feita: " + ITEMS[t.get].nome, 3000);
          saveGame();
          renderTrade();
        }),
    );
}

/* ===================== CAVALO E CARRUAGEM ===================== */

function buyHorse() {
  if (player.horse) {
    say([["Tião, o Cocheiro", "Seu cavalo está forte e bem alimentado. Aperte C para montar."]]);
    return;
  }
  if (player.gold < 250) {
    say([
      [
        "Tião, o Cocheiro",
        `Um bom cavalo custa 250 de ouro. Você tem ${player.gold}. Faça uns trabalhos no quadro perto da fonte!`,
      ],
    ]);
    return;
  }
  player.gold -= 250;
  player.horse = true;
  player.riding = true;
  addFriendship("cocheiro", 10);
  playSound(784, 0.2, "sine");
  saveGame();
  say([
    ["Tião, o Cocheiro", "Ele é seu! Cuide bem dele."],
    [
      "",
      "Você comprou um cavalo! Aperte C para montar e desmontar. Montado, você anda duas vezes mais rápido.",
    ],
  ]);
}
function carriageMenu() {
  const free = friendshipLevel("cocheiro") >= 2 || !player.flags.rode,
    cost = free ? 0 : 20;
  const towns = ["vila", "porto", "serra"].filter((z) => z !== player.zone);
  const dests = towns.concat(
    player.visited.filter((z) => !ZONES[z].town && z !== "torre" && z !== player.zone),
  );
  choice(
    "Carruagem",
    `Para onde? Custa ${withTax(cost)} de ouro (com Imposto Real) e leva 1 hora. Vilas vizinhas: Porto Brisamar (litoral) e Pedravale (serra).`,
    dests
      .map((z) => ({
        t: ZONES[z].nome + (ZONES[z].town ? " (vila)" : ""),
        fn: () =>
          borderCheck(z, (mul) => {
          const price = Math.max(cost * mul, mul > 1 ? 30 : 0);
          if (player.gold < withTax(price)) {
            say([["Cocheiro", "Sem ouro, sem viagem."]]);
            return;
          }
          payWithTax(price);
          player.flags.rode = true;
          player.clock = (player.clock + 60) % 1440;
          const zz = ZONES[z];
          const o = zz.town ? zz.town.arrive : z === "escola" ? zz.open.n : zz.open[zz.side];
          player.zone = z;
          player.x = o[0];
          player.y = o[1];
          player.dir = "down";
          game.fade = 1;
          enterZone();
          saveGame();
          playSound(330, 0.2, "triangle");
          toast(`A carruagem deixa você em ${zz.nome}.`, 3000);
          }),
      }))
      .concat(walkHomeItems())
      .concat([
        {
          t: "Cancelar",
          fn: null,
        },
      ]),
  );
}
function toggleRide() {
  if (!player.horse) {
    toast("Você não tem cavalo. Compre um no estábulo da vila.");
    return;
  }
  if (player.zone !== "vila" && ZONES[player.zone].theme === "torre") {
    toast("O cavalo não entra na torre.");
    return;
  }
  player.riding = !player.riding;
  playSound(player.riding ? 600 : 400, 0.1, "triangle");
  toast(player.riding ? "Você montou no cavalo." : "Você desmontou.");
}

/* ===================== ATAQUES À VILA ===================== */

function raidPool() {
  const g = guardiansFreed();
  return g >= 2
    ? ["harpia", "golem", "espectro"]
    : g >= 1
      ? ["sapo", "espectro", "lobo"]
      : ["lobo", "cogumelo"];
}
const RAID_GATES = [
  [2, 26],
  [61, 26],
  [10, 2],
  [31, 45],
];
function spawnRaidWave(n, leader) {
  const z = ZONES.vila,
    pool = raidPool();
  let tries = 0;
  while (n > 0 && tries < 600) {
    tries++;
    const g = RAID_GATES[Math.floor(Math.random() * RAID_GATES.length)];
    const x = g[0] + Math.floor(Math.random() * 5) - 2,
      y = g[1] + Math.floor(Math.random() * 5) - 2;
    if (
      x < 1 ||
      y < 1 ||
      x >= z.w - 1 ||
      y >= z.h - 1 ||
      !walkable("vila", x, y) ||
      game.mobs.some((m) => m.x === x && m.y === y) ||
      Math.abs(x - player.x) + Math.abs(y - player.y) < 4
    )
      continue;
    game.mobs.push({
      type: pool[Math.floor(Math.random() * pool.length)],
      x,
      y,
      rx: x,
      ry: y,
      timer: Math.random(),
      raid: true,
    });
    n--;
  }
  if (leader) {
    for (let k = 0; k < 200; k++) {
      const g = RAID_GATES[Math.floor(Math.random() * RAID_GATES.length)];
      if (walkable("vila", g[0], g[1]) && !game.mobs.some((m) => m.x === g[0] && m.y === g[1])) {
        game.mobs.push({
          type: "lider",
          x: g[0],
          y: g[1],
          rx: g[0],
          ry: g[1],
          timer: 0,
          raid: true,
          elite: true,
        });
        break;
      }
    }
  }
}
function startRaid() {
  if (lifeMode()) return;
  game.raid = {
    wave: 1,
    waves: 2,
    left: 240,
  };
  player.raidDay = player.day;
  spawnRaidWave(4 + Math.floor(Math.random() * 2), false);
  game.banner = {
    text: " ATAQUE À VILA! ",
    t: 3.5,
  };
  [0, 350, 700].forEach((d) =>
    setTimeout(() => {
      playSound(660, 0.5, "triangle", 0.06);
      playSound(990, 0.4, "sine", 0.03);
    }, d),
  );
  say([
    ["Guarda Tomé", "O SINO! Monstros nos portões! Moradores, para dentro das casas!"],
    [
      "",
      `Defenda Cinzaluz: derrote as 2 ondas de monstros antes que amanheça o estrago (4 horas do jogo). Eles atacam pelos portões e marcham para a praça.`,
    ],
  ]);
}
function raidLeft() {
  return game.mobs.filter((m) => m.raid).length;
}
function checkRaid() {
  if (!game.raid) return;
  if (player.zone !== "vila") {
    failRaid("Você saiu da vila durante o ataque...");
    return;
  }
  if (game.raid.left <= 0) {
    failRaid("O tempo acabou!");
    return;
  }
  if (!raidLeft()) {
    if (game.raid.wave < game.raid.waves) {
      game.raid.wave++;
      spawnRaidWave(3, true);
      game.banner = {
        text: " ONDA 2: O CHEFE DA HORDA! ",
        t: 3,
      };
      playSound(150, 0.4, "sawtooth");
      toast("Uma nova onda chegou com o Chefe da Horda!", 3500);
      return;
    }
    const g = 60 + player.lvl * 10;
    game.raid = null;
    player.gold += g;
    repAdd(6);
    player.raidsWon = (player.raidsWon || 0) + 1;
    const it = Math.random() < 0.5 ? "fragmento" : "pocaoG";
    addItem(it);
    Object.keys(FRIENDS).forEach((id) => addFriendship(id, 3));
    saveGame();
    playTune();
    say([
      ["Guarda Tomé", "Conseguimos! Você salvou Cinzaluz!"],
      ["Rainha Aurélia", "(mensageiro do castelo) A Rainha agradece sua coragem."],
      ["", `Recompensa: ${g} de ouro e ${ITEMS[it].nome}. Todos os moradores gostam mais de você agora.`],
    ]);
  }
}
function failRaid(why) {
  repAdd(-5);
  const lost = Math.min(200, Math.floor(player.gold * 0.1));
  player.gold -= lost;
  game.mobs = game.mobs.filter((m) => !m.raid);
  game.raid = null;
  Object.keys(FRIENDS).forEach((id) => (player.rel[id] = Math.max(0, friendship(id) - 2)));
  saveGame();
  say([
    ["Guarda Tomé", `${why} Os monstros saquearam parte do mercado antes de fugir.`],
    ["", `Você perdeu ${lost} de ouro ajudando nos reparos. Os moradores ficaram decepcionados.`],
  ]);
}
/* ---- loja ---- */

function openShop(id) {
  {
    const own =
      Object.keys(FRIENDS).find((k) => FRIENDS[k].shop === id) ||
      {
        peixaria: "peixeiro",
        ervanaria: "flor",
        joalheiro: "lucio",
        doceria: "cocada",
        floricultura: "florista",
        bazar: "bazarista",
        chas: "chazeira",
        brinquedos: "brinqueiro",
      }[id];
    if (own && despised(own)) {
      say([[NPCS[own].nome.split(",")[0], "Não vendo nada pra você. Vai embora!"]]);
      return;
    }
  }
  game.mode = "shop";
  game.shopId = id;
  game.shopTab = "buy";
  game.shopIdx = 0;
  game.shopQty = 1;
  game.shopCat = null;
  game.keeperLine = null;
  renderShop();
  byId("shop").style.display = "block";
  playSound(440, 0.1, "sine");
}
function closeShop() {
  byId("shop").style.display = "none";
  game.mode = "world";
  game.tryOn = null;
  clearInterval(game.cosAnim);
}
/* ---- inventário ---- */

function openInv() {
  if (game.dialog) return;
  if (game.mode === "map") closeMap();
  game.mode = "inv";
  game.invTab = game.invTab || "itens";
  renderInv();
  byId("inv").style.display = "block";
  playSound(440, 0.1, "sine");
}
function closeInv() {
  byId("inv").style.display = "none";
  game.mode = "world";
}
function skillUnlocked(id) {
  const k = SKILLS[id];
  if (k.tome) return k.el === player.aff && player.tomes.includes(id);
  return k.el ? k.el === player.aff : player.lvl >= k.lvl;
}
function renderInv() {
  const t = game.invTab;
  let h = `<div class="gh"><h2>Inventário · ${player.name}</h2><button id="ivclose">Fechar (I)</button></div>
  <div class="gsub">Ouro: <b style="color:var(--gold)">${player.gold}</b> · Fome ${Math.round(player.food)}/100 · Sede ${Math.round(player.water)}/100${player.injured ? ' · <span style="color:#ff8a8a">FERIDO</span>' : ""}</div>
  <div class="tabs">${[
    ["itens", "Itens"],
    ["equip", "Equipamento"],
    ...(lifeMode() ? [] : [["hab", "Habilidades"]]),
    ["amigos", "Amizades"],
    ["familia", "Família"],
    ["visual", "Aparência"],
    ["status", "Status"],
  ]
    .map(
      ([k, n]) =>
        `<button data-t="${k}" class="${t === k ? "on" : ""}">${iconHTML({ itens: "bag", equip: "armor", hab: "sparkle", amigos: "heart", familia: "house", visual: "shirt", status: "star" }[k])}${n}</button>`,
    )
    .join("")}</div>`;
  if (t === "itens") {
    const ids = Object.keys(player.inv).filter((id) => ITEMS[id].tipo !== "equip");
    if (!ids.length) h += '<div class="qtip">Sua bolsa está vazia. Compre itens no mercado da vila.</div>';
    for (const id of ids) {
      const it = ITEMS[id];
      const act =
        it.tipo === "tool"
          ? '<span class="ds">ferramenta</span>'
          : it.tipo === "gift"
            ? '<span class="ds">presente</span>'
            : it.tipo === "pet"
              ? '<span class="ds">para mascote</span>'
              : it.tipo === "movel"
                ? '<span class="ds">móvel (decore em casa: R)</span>'
                : it.tipo === "mat"
                  ? '<span class="ds">material</span>'
                  : id === "fenix"
                    ? '<span class="pr">automático</span>'
                    : `<button data-u="${id}">${it.tipo === "food" ? "Consumir" : "Usar"}</button>`;
      h += `<div class="irow"><div><div class="nm" style="${it.lend ? "color:#ffe066" : ""}">${iconHTML(itemIcon(id))}${it.nome} ×${itemCount(id)}</div><div class="ds">${it.desc}</div></div>${act}</div>`;
    }
  } else if (t === "equip") {
    h +=
      '<div class="statl">' +
      ["cajado", "manto", "armadura", "amuleto"]
        .map(
          (sl) =>
            `<div>${sl[0].toUpperCase() + sl.slice(1)}: <b>${player.eq[sl] ? ITEMS[player.eq[sl]].nome : "—"}</b></div>`,
        )
        .join("") +
      "</div><h3>Seus equipamentos</h3>";
    const ids = Object.keys(player.inv).filter((id) => ITEMS[id].tipo === "equip");
    for (const id of ids) {
      const it = ITEMS[id],
        on = player.eq[it.slot] === id;
      h += `<div class="irow ${on ? "eqd" : ""}"><div><div class="nm">${iconHTML(itemIcon(id))}${it.nome} <span class="ds">(${it.slot})</span></div><div class="ds">${it.desc}</div></div>${on ? '<span class="pr">Equipado</span>' : `<button data-e="${id}">Equipar</button>`}</div>`;
    }
    h +=
      '<div class="qtip">Equipamentos melhores são vendidos pelo Doran no mercado. Os Guardiões também deixam presentes poderosos.</div>';
  } else if (t === "visual") {
    h += `<div class="crow"><div class="pv"><canvas id="ivpv" width="140" height="140"></canvas></div><div class="cform"><div class="statl"><div>Penteado: <b>${COSMETICS.hstyle.find((o) => o[0] === player.look.hstyle)[1]}</b></div><div>Chapéu: <b>${COSMETICS.hat.find((o) => o[0] === player.look.hat)[1]}</b></div><div>Roupa: <b>${COSMETICS.outfit.find((o) => o[0] === player.look.outfit)[1]}</b></div></div>
    <p><button id="ivward">Abrir guarda-roupa</button></p><div class="qtip">Compre roupas e chapéus na Alfaiataria, cortes e cores no Salão Tesoura de Ouro (Cinzaluz) e novidades na Moda Brisamar (Porto).</div></div></div>`;
  } else if (t === "familia") {
    h += familyHTML();
  } else if (t === "amigos") {
    h +=
      '<div class="qtip">Converse todo dia, dê presentes (cada pessoa tem um favorito), trabalhe e faça os trabalhos do quadro para aumentar a amizade. Amigos dão descontos e presentes; melhores amigos dão itens únicos.</div>';
    for (const id in FRIENDS) {
      const lv = friendshipLevel(id);
      h += `<div class="irow"><div><div class="nm">${NPCS[id].nome} <span style="color:#ff8aa8">${hearts(id)}</span></div><div class="ds">${REL_LV[lv][1]} · ${friendship(id)}/100 · Presente favorito: ${lv >= 1 ? ITEMS[FRIENDS[id].fav].nome : "???"}</div></div><span class="pr">${lv >= 3 ? "Melhor amigo" : lv >= 2 ? "Amigo" : ""}</span></div>`;
    }
    h += `<h3>Montaria</h3><div class="qtip">${player.horse ? "Você tem um cavalo. Aperte C para montar ou desmontar." : "Sem cavalo. O Tião vende um no estábulo por 250 de ouro."}</div>`;
  } else if (t === "hab") {
    h += `<div class="qtip">Habilidades são usadas na batalha pelo botão Habilidades. Sua afinidade: <b style="color:${RUNES[player.aff].cor}">${RUNES[player.aff].nome}</b>.</div>`;
    for (const id in SKILLS) {
      const k = SKILLS[id];
      if (k.el && k.el !== player.aff) continue;
      const u = skillUnlocked(id);
      if (k.tome && !u) {
        h += `<div class="irow"><div><div class="nm" style="color:#6d6188">??? (Tomo ${["I", "II", "III"][k.tome - 1]})</div><div class="ds">Encontre este tomo na Antiga Academia Arcana.</div></div><span class="pr">Escola</span></div>`;
        continue;
      }
      h += `<div class="irow"><div><div class="nm" style="${u ? "" : "color:#6d6188"}">${k.nome}${k.tome ? ' <span class="ds">(tomo)</span>' : ""}</div><div class="ds">${k.desc} · ${k.mp} MP · recarga ${k.cd} turnos</div></div><span class="pr">${u ? "Aprendida" : "Nível " + k.lvl}</span></div>`;
    }
  } else {
    h += `<div class="statl"><div>Nível: <b>${player.lvl}</b></div><div>XP: <b>${player.xp}/${xpToNextLevel(player.lvl)}</b></div><div>HP: <b>${player.hp}/${maxHp()}</b></div><div>MP: <b>${player.mp}/${maxMp()}</b></div>
    <div>Bônus de dano: <b>+${Math.round(equipStat("pow") * 100)}%</b></div><div>Redução de dano: <b>${Math.round(equipStat("def") * 100)}%</b></div>
    <div>Afinidade: <b>${RUNES[player.aff].nome} (+25%)</b></div><div>Regeneração: <b>${equipStat("regen")} HP/turno</b></div>
    <div>Dificuldade: <b>${difficulty().n}</b></div><div>Estação: <b>${season().ic} ${season().n}</b> (dia ${seasonDay()}/7)</div><div>Clima: <b>${currentWeather().ic} ${currentWeather().n}</b></div></div><div class="qtip">${currentWeather().fx} ${
      {
        pri: "Primavera: flores por toda parte.",
        ver: "Verão: a sede cai mais rápido.",
        out: "Outono: folhas caindo e colheita farta.",
        inv: "Inverno: a fome cai mais rápido e os rios congelam.",
      }[season().id]
    }</div><div class="statl"><div>Hora: <b>${clockStr()}</b></div><div>Próximo festival: <b>${festivalToday() ? "hoje!" : "em " + daysToFest() + " dia(s)"}</b></div><div>Noite protegida: <b>${hasMoon() ? "sim" : "não"}</b></div></div>
    <h3>Como sobreviver</h3><div class="qtip">· Fome e sede caem com o tempo. Se zerarem, você perde vida e sua magia enfraquece.</div>
    <div class="qtip">· Beba da fonte da vila ou de rios (fique de frente para a água e aperte E).</div>
    <div class="qtip">· Durma em casa para recuperar tudo. Se ficar ferido, vá ao hospital.</div>`;
  }
  byId("inv").innerHTML = h;
  byId("ivclose").onclick = closeInv;
  if (byId("ivpv")) drawPreview(byId("ivpv"), player.look);
  if (byId("ivward"))
    byId("ivward").onclick = () => {
      byId("inv").style.display = "none";
      showCreate("wardrobe");
    };
  byId("inv")
    .querySelectorAll("[data-t]")
    .forEach(
      (b) =>
        (b.onclick = () => {
          game.invTab = b.dataset.t;
          renderInv();
        }),
    );
  byId("inv")
    .querySelectorAll("[data-u]")
    .forEach(
      (b) =>
        (b.onclick = () => {
          const r = useItemEffect(b.dataset.u);
          playSound(660, 0.12, "sine");
          toast(r || "Nada aconteceu.");
          saveGame();
          renderInv();
        }),
    );
  byId("inv")
    .querySelectorAll("[data-e]")
    .forEach(
      (b) =>
        (b.onclick = () => {
          const it = ITEMS[b.dataset.e];
          player.eq[it.slot] = b.dataset.e;
          player.hp = Math.min(player.hp, maxHp());
          player.mp = Math.min(player.mp, maxMp());
          playSound(780, 0.1, "sine");
          saveGame();
          renderInv();
        }),
    );
}
/* ---- escolha do elemento ---- */

function showChoose() {
  game.mode = "choose";
  byId("story").style.display = "none";
  byId("cards").innerHTML = ORDER.map((r, i) => {
    const e = ELEM_INFO[r],
      k = SKILLS[e.sk];
    return `<button class="card" data-r="${r}"><h4>${runeSVG(r, 22)}<span style="color:${RUNES[r].cor}">${i + 1}. ${e.t}</span></h4><p>${e.d}</p><p>Habilidade: <b style="color:#fff">${k.nome}</b>. ${k.desc}</p></button>`;
  }).join("");
  byId("cards")
    .querySelectorAll(".card")
    .forEach((b) => (b.onclick = () => pickElement(b.dataset.r)));
  byId("choose").style.display = "flex";
}
function missingRune(i) {
  const o = player.order || [];
  return o[i] && !player.runes.includes(o[i]) ? o[i] : ORDER.find((r) => !player.runes.includes(r));
}
function pickElement(r) {
  player.aff = r;
  player.runes = [r];
  player.order = [r].concat(["terra", "agua", "ar", "fogo", "luz", "sombra"].filter((x) => x !== r));
  byId("choose").style.display = "none";
  playSound(784, 0.15, "sine");
  startGame(true);
}
function needsTick(dt) {
  if (player.food < 25 && !game.wf) {
    game.wf = true;
    toast("Você está com fome. Coma algo (tecla I).", 3000);
  }
  if (player.food > 30) game.wf = false;
  if (player.water < 25 && !game.ww) {
    game.ww = true;
    toast("Você está com sede. Beba água (tecla I, fonte ou rio).", 3000);
  }
  if (player.water > 30) game.ww = false;
  if (starving()) {
    game.starveT = (game.starveT || 0) + dt;
    if (game.starveT >= 3) {
      game.starveT = 0;
      if (player.hp > 1) {
        player.hp = Math.max(1, player.hp - 2);
        game.shake = 0.1;
      }
    }
    if (!game.wz) {
      game.wz = true;
      toast("Fraco de fome ou sede! Você está perdendo vida.", 3500);
    }
  } else game.wz = false;
}
function openMap() {
  if (game.mode !== "world" || game.dialog) return;
  game.mode = "map";
  byId("hud").style.visibility = "hidden";
  playSound(440, 0.08, "sine");
}
function closeMap() {
  if (game.mode === "map") {
    game.mode = "world";
    byId("hud").style.visibility = "visible";
  }
}
function drawMinimap(big, t) {
  const z = ZONES[player.zone],
    mm = minimapOf(player.zone),
    seen = seenOf(player.zone);
  if (big) {
    ctx.fillStyle = "rgba(8,5,14,.78)";
    ctx.fillRect(0, 0, viewWidth, 480);
  }
  const s = big ? Math.min(560 / z.w, 330 / z.h) : Math.min(96 / z.w, 72 / z.h);
  const mw = z.w * s,
    mh = z.h * s,
    ox = big ? Math.round(viewWidth / 2 - mw / 2) : Math.round(viewWidth - 8 - mw),
    oy = big ? Math.round(236 - mh / 2) : 40;
  if (!big) ctx.globalAlpha = 0.85;
  ctx.fillStyle = "rgba(12,8,20,.85)";
  ctx.fillRect(ox - 3, oy - 3, mw + 6, mh + 6);
  ctx.strokeStyle = "#7a62b8";
  ctx.lineWidth = 1.5;
  ctx.strokeRect(ox - 3, oy - 3, mw + 6, mh + 6);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(mm.c, ox, oy, mw, mh);
  const r = Math.max(1.5, s * (big ? 0.45 : 0.8));
  for (const [x, y, c] of z.feats) {
    if (!seen[y * z.w + x]) continue;
    let col = null;
    if (c === "G" && !player.guards.includes(player.zone)) col = "#ff4d6d";
    else if (c === "N") col = "#f2c14e";
    else if (c === "F") col = "#5ff0ff";
    else if (c === "C" && !player.taken.includes(`${player.zone}:${x},${y}`))
      col = chestRarity(player.zone, x, y) === "lend" ? "#ffe066" : "#ff9a3c";
    else if (c === "L" && !player.books.includes(`${player.zone}:${x},${y}`)) col = "#c77dff";
    else if (c === "P" && !player.pages.includes(player.zone)) col = "#fff3b0";
    if (col) {
      ctx.fillStyle = col;
      ctx.fillRect(ox + (x + 0.5) * s - r, oy + (y + 0.5) * s - r, r * 2, r * 2);
    }
  }
  if (!lifeMode()) {
    const q = questTarget();
    const qr = Math.max(3, r * 1.8);
    ctx.save();
    ctx.translate(ox + (q.x + 0.5) * s, oy + (q.y + 0.5) * s);
    ctx.rotate(Math.PI / 4);
    ctx.fillStyle = Math.sin(t * 6) > 0 ? "#f2c14e" : "#fff3b0";
    ctx.fillRect(-qr, -qr, qr * 2, qr * 2);
    ctx.restore();
  }
  if (Math.sin(t * 8) > -0.3) {
    ctx.fillStyle = "#fff";
    const pr = r * 1.3;
    ctx.globalAlpha = 1;
    ctx.fillRect(ox + (player.rx + 0.5) * s - pr, oy + (player.ry + 0.5) * s - pr, pr * 2, pr * 2);
  }
  if (big) {
    let pct = 0;
    for (let i = 0; i < seen.length; i++) pct += seen[i];
    ctx.textAlign = "center";
    ctx.font = '700 22px "Pixelify Sans", sans-serif';
    ctx.fillStyle = "#f2c14e";
    ctx.fillText(z.nome, viewWidth / 2, oy - 14);
    ctx.font = "18px VT323, monospace";
    ctx.fillStyle = "#cfc3e6";
    ctx.fillText(
      `Explorado: ${Math.round((100 * pct) / seen.length)}%  ·   M ou Esc fecha`,
      viewWidth / 2,
      oy + mh + 20,
    );
    const leg = [
      ["#c77dff", "Livro"],
      ["#f2c14e", "Missão"],
      ["#ff4d6d", "Guardião"],
      ["#5ff0ff", "Altar"],
      ["#f2c14e", "Pessoa"],
      ["#ff9a3c", "Baú"],
      ["#fff3b0", "Página"],
      ["#fff", "Você"],
    ];
    ctx.textAlign = "left";
    const ws = leg.map(([, n]) => ctx.measureText(n).width + 30);
    let lx = viewWidth / 2 - ws.reduce((a, b) => a + b, 0) / 2;
    leg.forEach(([c, n], i) => {
      ctx.fillStyle = c;
      ctx.fillRect(lx, oy + mh + 32, 8, 8);
      ctx.fillStyle = "#cfc3e6";
      ctx.fillText(n, lx + 12, oy + mh + 41);
      lx += ws[i];
    });
  }
}

/* ======================================================================
   (antes: 08-interface.js)
   ====================================================================== */

/**
 * ECOS DO ARCANO — 05-interface-e-comercio.js
 * Caixas de diálogo, missões, HUD e grimório.
 */

/* ===================== DIÁLOGO ===================== */

const DIALOG_SPEED = 55;
const NAME_COLORS = ["#f2c14e", "#7fd0ff", "#ff8ad0", "#9ff0cf", "#ffb36b", "#c9a8ff", "#a8e06b"];

const nameHash = (name) => [...name].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7);

/** Descobre a aparência de quem está falando, para o retrato. */
/** Nomes da história que não estão em NPCS: chefes, ecos e família real. */
const STORY_SPEAKERS = {
  "Ent Guardião": { enemy: "ent" },
  "Grifo Dourado": { enemy: "grifo" },
  "Serpente das Águas": { enemy: "serpente" },
  Vesper: { enemy: "silenciador" },
  "Vesper (eco)": { enemy: "silenciador" },
  "Odelia (eco)": { npc: "odelia" },
  "Espírito de um Aprendiz": { enemy: "aprendiz" },
  Narrador: null,
};

function enemyByName(name) {
  return Object.keys(ENEMIES).find((type) => ENEMIES[type].nome === name);
}

/** Aparência de um morador que anda pela vila, igual ao desenho no mapa. */
function walkerLook(w) {
  if (w.elf) return { robe: ELF_ROBES[w.robe.length % 4], hair: ELF_HAIRS[w.nm.length % 4], elf: true };
  return { robe: w.robe, hat: w.hat ?? null, hair: w.hair, seed: w.seed };
}

/** Nomes pelos quais alguém pode aparecer no diálogo: completo, sem o apelido e só o primeiro nome. */
function speakerNames(full, extra = []) {
  return [full, full.split(",")[0], full.split(" ")[0], ...extra];
}

/**
 * Descobre quem está no tile (x, y) quando o jogador vai falar com alguém.
 * Assim o retrato mostra exatamente essa pessoa, mesmo que ela fale com um apelido.
 */
function talkTargetAt(x, y) {
  const z = ZONES[player.zone];
  const town = z.town;
  const at = (q) => q.x === x && q.y === y;
  const elf = elfAt(x, y);
  if (elf) return { names: speakerNames(elf.nm), look: { robe: elf.robe, hair: elf.hair, elf: true } };
  const fm = town && familyList().find(at);
  if (fm) {
    if (fm.kind === "spouse" && NPCS[fm.id]) return { names: speakerNames(NPCS[fm.id].nome), look: npcLook(fm.id) };
    if (fm.k) return { names: [fm.k.name], look: { kid: fm.k } };
  }
  const ro = town && roamAt(x, y);
  const id = ro ? ro.id : z.npcs && z.npcs[`${x},${y}`];
  if (id && NPCS[id]) return { names: speakerNames(NPCS[id].nome), look: npcLook(id) };
  const wk = town && walkerAt(x, y);
  if (wk) return { names: speakerNames(wk.nm, ["Morador"]), look: walkerLook(wk) };
  const fk = (game.farmers || []).find(at);
  if (fk) return { names: speakerNames(fk.nm), look: { robe: fk.robe, hat: "#c9a03a", hair: fk.hair } };
  const kd = (game.kidsP || []).find(at);
  if (kd) return { names: [kd.nm], look: { robe: kd.robe, hat: null, hair: kd.hair } };
  return null;
}

function npcLook(id) {
  const n = NPCS[id];
  return { robe: n.robe, hat: n.hat, hair: n.hair, id, glow: MAGIC_KEEPERS.has(id), crown: n.crown };
}

/** Descobre quem está falando, para desenhar o retrato certo. */
function speakerLook(name) {
  if (!name) return null;
  if (name === "Você") return { hero: true };
  const short = name.split(",")[0];
  const target = game.talkTarget;
  if (target && target.names.includes(name)) return target.look;
  if (name in STORY_SPEAKERS) {
    const s = STORY_SPEAKERS[name];
    if (!s) return null;
    if (s.enemy) return { enemy: s.enemy };
    if (s.npc)
      return { robe: NPCS[s.npc].robe, hat: NPCS[s.npc].hat, hair: NPCS[s.npc].hair, id: s.npc, glow: true };
  }
  const enemy = enemyByName(name);
  if (enemy) return { enemy };
  const kid = (player.kids || []).find((k) => k.name === name);
  if (kid) return { kid };
  if (player.zone === "interior" && game.inter) {
    const I = game.inter;
    if (I.keeper && I.keeper.split(",")[0] === short) return { robe: I.kc, hat: null, hair: I.kh };
    const pe = (I.people || []).find((q) => q.nm === short);
    if (pe) return pe.kid ? { kid: pe.kid } : { robe: pe.robe, hat: pe.hat ?? null, hair: pe.hair };
  }
  for (const id in NPCS) {
    const n = NPCS[id];
    if (n.nome === name || n.nome.split(",")[0] === short) return npcLook(id);
  }
  const royal = (typeof PARADE_MEM !== "undefined" ? PARADE_MEM : []).find((m) => m.n === name);
  if (royal) return { robe: royal.robe, hat: royal.hat, hair: royal.hair, crown: royal.crown };
  // Os atendentes são desenhados sem chapéu: o retrato precisa usar o mesmo "null".
  const keeper = Object.values(KEEPERS).find(([n]) => n === name || n.split(",")[0] === short);
  if (keeper) return { robe: keeper[1], hat: null, hair: keeper[2] };
  // Vários moradores podem ter o mesmo nome: fica com o mais perto do jogador.
  const dist = (w) => Math.abs(w.x - player.x) + Math.abs(w.y - player.y);
  const walker = (game.walkers || [])
    .filter((w) => w.nm === short)
    .sort((a, b) => dist(a) - dist(b))[0];
  if (walker) return walkerLook(walker);
  const elf = (game.elves || []).find((e) => e.nm === short);
  if (elf) return { robe: elf.robe, hair: elf.hair, elf: true };
  const farmer = (game.farmers || []).find((f) => f.nm === name);
  if (farmer) return { robe: farmer.robe, hat: "#c9a03a", hair: farmer.hair };
  const child = (game.kidsP || []).find((k) => k.nm === name);
  if (child) return { robe: child.robe, hat: null, hair: child.hair };
  const seed = nameHash(name);
  return {
    robe: NAME_COLORS[seed % NAME_COLORS.length],
    hat: null,
    hair: ["#3a2414", "#d9a441", "#1a1a1a", "#8a3a1a"][seed % 4],
    seed,
  };
}

function escapeHtml(text) {
  return text.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]);
}

/** *ações* em itálico e "falas citadas" em destaque. */
function formatDialogText(text) {
  return escapeHtml(text)
    .replace(/"([^"]*)"?/g, "<b class=d-quote>&quot;$1&quot;</b>")
    .replace(/\*([^*]*)\*?/g, "<i class=d-act>$1</i>");
}

function lineMood(text) {
  if (/!{1}/.test(text) && /[A-ZÁÉÍÓÚ]{4,}|!!|\?!/.test(text)) return "shout";
  if (text.trim().endsWith("!")) return "excited";
  if (/\.\.\.|…/.test(text)) return "soft";
  return "";
}

function say(lines, cb) {
  game.dialog = { lines, i: 0, chars: 0, cb, shown: -1, pause: 0 };
  renderDialogLine();
  byId("dialog").style.display = "block";
}

function renderDialogLine() {
  const d = game.dialog;
  const [who, text] = d.lines[d.i];
  const nameBox = byId("dwho");
  nameBox.textContent = who;
  nameBox.style.display = who ? "block" : "none";
  nameBox.style.color = who === "Você" ? "#fff" : NAME_COLORS[nameHash(who || "x") % NAME_COLORS.length];
  byId("dtxt").innerHTML = "";
  byId("dtxt").className = lineMood(text);
  byId("dialog").classList.toggle("narration", !who);
  d.look = speakerLook(who);
  d.voice = who ? 180 + (nameHash(who) % 6) * 45 : 0;
  d.shown = -1;
  d.pause = 0;
  byId("dport").style.display = d.look ? "block" : "none";
  if (d.look && d.look.id) {
    const spot = typeof npcSpot === "function" ? npcSpot(d.look.id) : null;
    if (spot) game.bubbles.push({ x: spot[0], y: spot[1], icon: "chat", t: 1.6 });
  }
}

/** Digitação com ritmo: pausa em pontuação e uma "voz" para cada personagem. */
function updateDialogTyping(d, dt) {
  const full = d.lines[d.i][1];
  if (d.pause > 0) d.pause -= dt;
  else if (d.chars < full.length) {
    const speed = byId("dtxt").className === "soft" ? DIALOG_SPEED * 0.6 : DIALOG_SPEED;
    const before = Math.floor(d.chars);
    d.chars = Math.min(full.length, d.chars + dt * speed);
    const after = Math.floor(d.chars);
    if (after > before) {
      const ch = full[after - 1];
      if (".!?".includes(ch)) d.pause = 0.22;
      else if (ch === ",") d.pause = 0.08;
      if (d.voice && after % 2 === 0 && ch.trim() && audioCtx)
        playSound(d.voice + Math.random() * 30, 0.03, "square", 0.015);
    }
  }
  const n = Math.floor(d.chars);
  if (n !== d.shown) {
    byId("dtxt").innerHTML = formatDialogText(full.slice(0, n));
    d.shown = n;
  }
  drawDialogPortrait(d, n < full.length);
}

/** Retrato animado: pisca, mexe a boca enquanto fala e pula quando grita. */
function drawDialogPortrait(d, talking) {
  if (!d.look) return;
  const cv = byId("dport");
  const c2 = cv.getContext("2d");
  const t = game.t;
  c2.clearRect(0, 0, cv.width, cv.height);
  const mood = byId("dtxt").className;
  const bounce =
    talking && (mood === "shout" || mood === "excited")
      ? Math.abs(Math.sin(t * 18)) * 3
      : Math.sin(t * 2) * 0.6;
  if (d.look.enemy) {
    withContext(c2, () => {
      const u = 4.6;
      drawEnemy(d.look.enemy, cv.width / 2 - 8 * u, cv.height / 2 - 8 * u - bounce, u, t);
    });
    return;
  }
  const rects = d.look.hero
    ? heroRects(player.look, "down", lifeMode() ? null : player.look.staffc || "#ffe066")
    : d.look.kid
      ? heroRects(d.look.kid.look, "down", null)
      : d.look.elf
      ? elfRects(d.look.robe, d.look.hair, "down")
      : wizardRects(
          d.look.robe,
          d.look.hat,
          d.look.hair,
          d.look.glow ? "#c9a8ff" : null,
          "down",
          0,
          d.look.seed,
        );
  const u = 6;
  const ox = cv.width / 2 - 8 * u,
    oy = 8 - bounce;
  for (const [x, y, w, h, col] of rects) {
    if (y > 12) continue;
    c2.fillStyle = col;
    c2.fillRect(ox + x * u, oy + y * u, w * u, Math.min(h, 13 - y) * u);
  }
  if (d.look.crown) {
    c2.fillStyle = "#f2c14e";
    c2.fillRect(ox + 5 * u, oy + 2 * u, 6 * u, u);
    c2.fillRect(ox + 5 * u, oy + 1 * u, u, u);
    c2.fillRect(ox + 7.5 * u, oy + 1 * u, u, u);
    c2.fillRect(ox + 10 * u, oy + 1 * u, u, u);
  }
  const skin = d.look.hero
    ? player.look.skin
    : d.look.kid
      ? d.look.kid.look.skin
      : d.look.elf
      ? "#f1d8b8"
      : d.look.seed != null
        ? SKIN_TONES[d.look.seed % SKIN_TONES.length]
        : npcSkin(d.look.robe, d.look.hat, d.look.hair);
  const blink = Math.floor(t * 10) % 34 === 0;
  if (blink) {
    c2.fillStyle = skin;
    c2.fillRect(ox + 6 * u, oy + 7 * u, 4 * u, u);
  }
  if (talking && Math.floor(t * 12) % 2 === 0) {
    c2.fillStyle = "#6a2a2a";
    c2.fillRect(ox + 7 * u, oy + 8.4 * u, 2 * u, u * 0.6);
  }
}

function advanceDialog() {
  const d = game.dialog;
  if (!d) return;
  const full = d.lines[d.i][1];
  if (d.chars < full.length) {
    d.chars = full.length;
    d.pause = 0;
    return;
  }
  d.i++;
  playSound(520, 0.04);
  if (d.i >= d.lines.length) {
    byId("dialog").style.display = "none";
    game.dialog = null;
    if (d.cb) d.cb();
    if (game.pendingMoral) setTimeout(runPendingMoral, 50);
  } else {
    d.chars = 0;
    renderDialogLine();
  }
}

/* ===================== MISSÕES ===================== */

const SIDE_OF = {
  bosque: "w",
  pantano: "e",
  picos: "n",
  torre: "s",
};
function npcPos(id) {
  if (player.zone === "vila" && game.roam) {
    const r = game.roam.find((q) => q.id === id);
    if (r) return [r.x, r.y];
  }
  for (const [x, y, n] of ZONES.vila.npcList) if (n === id) return [x, y];
  return [16, 12];
}
/** Posição de um morador fixo em qualquer vila (Porto, Pedravale...). */
function zoneNpcPos(zone, id) {
  for (const [x, y, n] of ZONES[zone].npcList || []) if (n === id) return [x, y];
  const a = ZONES[zone].town.arrive;
  return [a[0], a[1]];
}
function zoneDoorPos(zone, name) {
  const d = findBuilding(zone, name);
  return d ? [d.x, d.y + 1] : ZONES[zone].town.arrive;
}
const STEPS = [
  {
    id: "treino",
    t: "Treine com o Instrutor Kael",
    zone: "vila",
    pos: () => {
      const p = npcPos("kael");
      return [p[0], p[1] + 1];
    },
    d: "O campo de treino cercado fica ao lado do castelo, no norte da vila. Kael vai te ensinar a lutar passo a passo.",
    done: () => player.flags.treino,
  },
  {
    id: "mercado",
    t: "Compre suprimentos no mercado",
    zone: "vila",
    pos: () => VILLAGE_POINTS.mercado,
    d: "O mercado fica a leste da praça central. Compre comida e água com a Rosa (barraca amarela) ou poções com o Bruno (barraca vermelha).",
    done: () => player.flags.bought,
  },
  {
    id: "ent",
    t: "Liberte o Ent Silenciado",
    zone: "bosque",
    pos: () => ZONES.bosque.guardPos,
    lvl: 3,
    get d() {
      return `O Guardião está no extremo oeste do Bosque Murmurante. Ele é fraco contra ${RUNE_WITH_ARTICLE[player.order[0]]}, a sua runa: use um feitiço duplo dela.`;
    },
    done: () => player.guards.includes("bosque"),
  },
  {
    id: "r2",
    get t() {
      return `Conte à Odelia sobre a Runa ${RUNE_OF[player.order[1]]}`;
    },
    zone: "vila",
    pos: () => npcPos("odelia"),
    d: "Volte à vila e fale com a Arquimaga Odelia.",
    done: () => player.flags.r2,
  },
  {
    id: "porto1",
    t: "Vá ao Porto Brisamar e fale com o Capitão Bento",
    zone: "porto",
    pos: () => {
      const p = zoneNpcPos("porto", "capitao");
      return [p[0], p[1] + 1];
    },
    d: "A névoa do pântano veio do mar. Pegue a carruagem no estábulo de Cinzaluz até o Porto Brisamar. O Capitão Bento viu Vesper partir de lá, anos atrás.",
    done: () => player.flags.porto1,
  },
  {
    id: "porto2",
    t: "Acenda o Farol de Brisamar à noite",
    zone: "porto",
    pos: () => zoneDoorPos("porto", "Farol de Brisamar"),
    d: "O farol só mostra o que guarda depois que escurece (a partir das 19h). Entre no farol à noite. Se precisar, espere com a tecla H.",
    done: () => player.flags.porto2,
  },
  {
    id: "serp",
    t: "Liberte a Serpente de Névoa",
    zone: "pantano",
    pos: () => ZONES.pantano.guardPos,
    lvl: 5,
    get d() {
      return `Ela está no extremo leste do Pântano das Brumas. É fraca contra ${RUNE_WITH_ARTICLE[player.order[1]]}.`;
    },
    done: () => player.guards.includes("pantano"),
  },
  {
    id: "r3",
    get t() {
      return `Conte à Odelia sobre a Runa ${RUNE_OF[player.order[2]]}`;
    },
    zone: "vila",
    pos: () => npcPos("odelia"),
    d: "Volte à vila e fale com a Arquimaga Odelia.",
    done: () => player.flags.r3,
  },
  {
    id: "serra1",
    t: "Vá a Pedravale e fale com a Anciã Berta",
    zone: "serra",
    pos: () => {
      const p = zoneNpcPos("serra", "ancia");
      return [p[0], p[1] + 1];
    },
    d: "Os anões de Pedravale forjaram algo para Vesper. Pegue a carruagem até a Vila da Serra e procure a Anciã Berta.",
    done: () => player.flags.serra1,
  },
  {
    id: "serra2",
    t: "Ache um Fragmento Arcano na Mina de Cristal",
    zone: "serra",
    pos: () => zoneDoorPos("serra", "Mina de Cristal"),
    d: "A Anciã Berta precisa de um Fragmento Arcano para reabrir o molde de Vesper. Entre na Mina de Cristal: a sorte melhora com a história em jogo.",
    done: () => player.flags.serra2 || itemCount("fragmento") > 0,
  },
  {
    id: "serra3",
    t: "Leve o fragmento à Forja Anã",
    zone: "serra",
    pos: () => zoneDoorPos("serra", "Forja Anã"),
    d: "Entre na Forja Anã com o Fragmento Arcano. Os anões vão reabrir o molde do cajado de Vesper.",
    done: () => player.flags.serra3,
  },
  {
    id: "grif",
    t: "Liberte o Grifo de Pedra",
    zone: "picos",
    pos: () => ZONES.picos.guardPos,
    lvl: 7,
    get d() {
      return `Ele está no topo dos Picos Uivantes, ao norte. É fraco contra ${RUNE_WITH_ARTICLE[player.order[2]]}.`;
    },
    done: () => player.guards.includes("picos"),
  },
  {
    id: "r4",
    t: "Conte à Odelia que as quatro runas voltaram",
    zone: "vila",
    pos: () => npcPos("odelia"),
    d: "Volte à vila e fale com a Arquimaga Odelia. A barreira ao sul vai se abrir.",
    done: () => player.flags.r4,
  },
  {
    id: "basil",
    t: "Liberte o Basilisco de Cristal",
    zone: "mina",
    pos: () => ZONES.mina.guardPos,
    d: "No fundo da Mina de Cristal, em Pedravale, dorme o quinto Guardião. Ele endurece a pele: use feitiços fortes e o clima a seu favor.",
    done: () => player.guards.includes("mina"),
  },
  {
    id: "levi",
    t: "Liberte o Leviatã do Cais",
    zone: "porto",
    pos: () => ZONES.porto.guardPos,
    d: "Na ponta do píer do Porto Brisamar, o sexto Guardião se esconde nas ondas. Ele se regenera: ataque sem parar.",
    done: () => player.guards.includes("porto"),
  },
  {
    id: "sile",
    t: "Enfrente o Silenciador",
    zone: "torre",
    pos: () => ZONES.torre.guardPos,
    lvl: 9,
    d: "Atravesse a barreira ao sul da vila. Ele está na sala mais funda da Torre do Silêncio. A fraqueza dele muda a cada 3 turnos.",
    done: () => false,
  },
];
function urgent() {
  const hp = npcPos("curandeira"),
    hpos = () => [hp[0], hp[1] + 1];
  if (player.injured)
    return {
      id: "u1",
      t: "Vá ao hospital da vila",
      d: "Você está ferido: HP máximo pela metade e magia mais fraca. A Curandeira Maíra trata você (hospital de telhado branco).",
      zone: "vila",
      pos: hpos,
    };
  if (player.hp < maxHp() * 0.3 && itemCount("pocao") + itemCount("pocaoG") === 0)
    return {
      id: "u2",
      t: "Procure ajuda: HP baixo e sem poções",
      d: "Volte à vila: a Curandeira Maíra cura você, ou compre poções com o Bruno no mercado.",
      zone: "vila",
      pos: hpos,
    };
  if (player.water < 12)
    return {
      id: "u3",
      t: "Beba água!",
      d: "Use um cantil (tecla I), beba da fonte da vila ou de um rio (fique de frente para a água e aperte E).",
      zone: "vila",
      pos: () => VILLAGE_POINTS.fonte,
    };
  if (player.food < 12)
    return {
      id: "u4",
      t: "Coma alguma coisa!",
      d: "Use comida pelo inventário (tecla I) ou compre na barraca da Rosa, no mercado.",
      zone: "vila",
      pos: () => VILLAGE_POINTS.mercado,
    };
  return null;
}
function curStep() {
  return STEPS.find((q) => !q.done()) || STEPS[STEPS.length - 1];
}
function route(zone, pos) {
  if (zone === player.zone)
    return {
      x: pos[0],
      y: pos[1],
      hop: null,
    };
  // A Mina fica dentro de Pedravale; de dentro dela, a saída é pelo topo.
  if (player.zone === "mina") {
    const o = ZONES.mina.open.n;
    return { x: o[0], y: 0, hop: "Pedravale" };
  }
  if (zone === "mina") {
    if (player.zone === "serra") {
      const d = zoneDoorPos("serra", "Mina de Cristal");
      return { x: d[0], y: d[1], hop: "Mina de Cristal" };
    }
    return route("serra", zoneDoorPos("serra", "Mina de Cristal"));
  }
  // Porto e Pedravale ficam longe: o caminho é a carruagem do estábulo.
  if (ZONES[zone].town && zone !== "vila" && (player.zone === "vila" || ZONES[player.zone].town)) {
    if (player.zone === "vila") {
      const c = npcPos("cocheiro");
      return { x: c[0], y: c[1] + 1, hop: `${ZONES[zone].nome} (carruagem)` };
    }
    const a = ZONES[player.zone].town.arrive;
    return { x: a[0], y: a[1], hop: `${ZONES[zone].nome} (carruagem)` };
  }
  if (player.zone === "casa")
    return {
      x: 6,
      y: 9,
      hop: "Cinzaluz",
    };
  if (player.zone === "interior") {
    const a = ZONES.interior.town.arrive;
    return {
      x: a[0],
      y: a[1] + 1,
      hop: "lá fora",
    };
  }
  if (ZONES[player.zone].town && player.zone !== "vila") {
    const a = ZONES[player.zone].town.arrive;
    return {
      x: a[0],
      y: a[1],
      hop: "Cinzaluz (carruagem)",
    };
  }
  if (player.zone === "vila") {
    const o = ZONES.vila.open[SIDE_OF[zone]];
    return {
      x: o[0],
      y: o[1],
      hop: ZONES[zone].nome,
    };
  }
  const z = ZONES[player.zone];
  const o = z.open[z.side];
  return {
    x: o[0],
    y: o[1],
    hop: "Vila de Cinzaluz",
  };
}
function questTarget() {
  if (game.raid && player.zone === "vila") {
    let b = null,
      bd = 1e9;
    for (const m of game.mobs)
      if (m.raid) {
        const d = Math.abs(m.x - player.x) + Math.abs(m.y - player.y);
        if (d < bd) {
          bd = d;
          b = m;
        }
      }
    if (b)
      return {
        x: b.x,
        y: b.y,
        hop: null,
      };
  }
  const q = urgent() || curStep();
  return route(q.zone, q.pos());
}
function exitWord(zone) {
  return {
    w: "oeste (esquerda)",
    e: "leste (direita)",
    n: "norte (cima)",
    s: "sul (baixo)",
  }[zone];
}
function questHint(q, r) {
  if (!r.hop) return q.d;
  if (ZONES[player.zone].town && player.zone !== "vila")
    return "Pegue a carruagem no estábulo para voltar a Cinzaluz.";
  if (player.zone === "vila")
    return (
      `Saia da vila pelo ${exitWord(SIDE_OF[q.zone])} até ${r.hop}.` +
      (q.zone === "torre" && player.runes.length < 4 ? " (precisa das 4 runas)" : "")
    );
  return "Volte para a Vila de Cinzaluz pela saída por onde você entrou.";
}
function claimSide(i) {
  player.sideClaim = player.sideClaim || {};
  if (player.sideClaim[i]) return;
  player.sideClaim[i] = 1;
  player.gold += SIDEQ[i].r;
  playSound(880, 0.15, "sine");
  toast(`Missão secundária concluída! +${SIDEQ[i].r} de ouro`, 3000);
  saveGame();
  openQuests();
}
/** Missões no Simulador: pedidos dos moradores e metas da vida (sem a história). */
function openLifeQuests() {
  game.mode = "quests";
  let h = `<div class="gh"><h2>Missões</h2><button id="qclose">Fechar (Q)</button></div>
  <div class="qs cur">${iconHTML("house")}<b>${player.name}, ${playerAge()} anos</b> · ${KINGDOMS[kingdomOf(player.zone)].n}${player.job ? ` · ${PROFESSIONS[player.job.id] ? PROFESSIONS[player.job.id].n : "Tendinha"}` : ""}</div>`;
  h += townQuestsHTML() + sideHTML();
  byId("quests").innerHTML = h;
  byId("quests").style.display = "block";
  byId("qclose").onclick = closeQuests;
  byId("quests")
    .querySelectorAll("[data-side]")
    .forEach((b) => (b.onclick = () => claimSide(+b.dataset.side)));
}
function openQuests() {
  if (lifeMode()) return openLifeQuests();
  game.mode = "quests";
  const q = curStep();
  const ci = STEPS.indexOf(q);
  const totalC = Object.values(ZONES).reduce((a, z) => a + z.feats.filter((f) => f[2] === "C").length, 0);
  let h = `<div class="gh"><h2>Missões</h2><button id="qclose">Fechar (Q)</button></div>${player.finished ? '<div class="qs cur"> <b>História concluída!</b> A Canção Arcana voltou. Continue com as missões secundárias.</div>' + sideHTML() : ""}<h3>${iconHTML("scroll")}História principal</h3>`;
  STEPS.forEach((s, i) => {
    if (i < ci) h += `<div class="qs done">${s.t}</div>`;
    else if (i === ci)
      h += `<div class="qs cur">▶ <b>${s.t}</b><div class="qd">${s.d}${s.lvl ? ` Nível sugerido: ${s.lvl}.` : ""}</div>${route(s.zone, s.pos()).hop ? `<div class="qd" style="color:var(--gold)">Agora: ${questHint(s, route(s.zone, s.pos()))}</div>` : ""}</div>`;
  });
  if (ci < STEPS.length - 1) h += `<div class="qs fut">${iconHTML("eye", 12)} Mais ${STEPS.length - 1 - ci} capítulos ainda por descobrir...</div>`;
  h += `<h3>Missões opcionais</h3>
  <div class="qs ${player.pages.length === 5 ? "done" : ""}">Diário de Vesper: ${player.pages.length}/5 páginas<div class="qtip">Procure papéis brilhando em cada região. Eles contam o segredo da história.</div></div>
  <div class="qs ${player.spells.length === 14 ? "done" : ""}">Grimório completo: ${player.spells.length}/14 magias<div class="qtip">Teste combinações de duas runas na batalha. Cada combinação nova é uma magia recuperada.</div></div>
  ${urgent() ? `<div class="qs cur" style="color:#ff8a8a"> <b style="color:#ff8a8a">${urgent().t}</b><div class="qd">${urgent().d}</div></div>` : ""}
  <div class="qs">Tesouros: ${player.taken.length}/${totalC} baús abertos<div class="qtip">Baús azuis são raros e baús dourados brilhantes são LENDÁRIOS, com os itens mais fortes do jogo.</div></div>
  <div class="qs ${player.tomes.length >= 3 ? "done" : ""}">Antiga Academia Arcana: ${player.tomes.length}/3 tomos do seu elemento<div class="qtip">A entrada fica no noroeste da vila (arco roxo). Os tomos ensinam feitiços novos de ${RUNES[player.aff].nome}.</div></div>
  <div class="qs">Amizades: ${Object.keys(FRIENDS).filter((id) => friendshipLevel(id) >= 3).length} melhores amigos<div class="qtip">Converse, dê presentes e trabalhe com os moradores. Veja tudo em I → Amizades.</div></div>
  <div class="qs ${(player.ecos || []).length >= 5 ? "done" : ""}">Ecos Corrompidos libertados: ${(player.ecos || []).length}/5<div class="qtip">Monstros gigantes com aura roxa e  guardam magia presa: Lobo Alfa (Bosque), Hidra (Pântano), Roc (Picos), Quimera (Academia) e Colosso (Torre). Cada um dá um Selo da Canção com bônus permanentes.</div></div>
  <div class="qs ${player.visited.includes("porto") && player.visited.includes("serra") ? "done" : ""}">Vilas vizinhas: ${["porto", "serra"].filter((z) => player.visited.includes(z)).length}/2 visitadas<div class="qtip">Use as placas de estrada (amarelas no mapa) ou o Estábulo: a carruagem leva a Porto Brisamar (litoral) e Pedravale (serra). A primeira viagem é grátis!</div></div>
  <div class="qs">Trabalhos ativos: ${player.jobs.length}/2<div class="qtip">O quadro de trabalhos fica ao lado da fonte. Também dá para trabalhar 3 horas com Rosa, Bruno, Brann, Kael ou Tião.</div></div>
  <h3>Dicas</h3>
  <div class="qtip">· A seta dourada sempre aponta para o próximo objetivo.</div>
  <div class="qtip">· Altares (ciano no mapa) e a fonte da vila curam e salvam o jogo. Se você perder, volta para o último usado.</div>
  <div class="qtip">· Na batalha, acertar a fraqueza do inimigo dá dano quase dobrado. Fraquezas descobertas ficam marcadas.</div>
  <div class="qtip">· Defender recupera mana. Monstros deixam ouro: gaste no mercado com poções, comida e equipamentos.</div>
  <div class="qtip">· À noite (☾) os monstros ficam mais fortes, mas dão mais ouro e XP. Durma em casa para pular para a manhã.</div>
  <div class="qtip">· Fome e sede caem com o tempo. Ferimentos graves só são curados no hospital.</div>`;
  h += townQuestsHTML();
  if (!player.finished) h += sideHTML();
  byId("quests").innerHTML = h;
  byId("quests").style.display = "block";
  byId("quests")
    .querySelectorAll("[data-side]")
    .forEach(
      (b) =>
        (b.onclick = () => {
          const i = +b.dataset.side;
          player.sideClaim = player.sideClaim || {};
          if (player.sideClaim[i]) return;
          player.sideClaim[i] = 1;
          player.gold += SIDEQ[i].r;
          playSound(880, 0.15, "sine");
          toast(`Missão secundária concluída! +${SIDEQ[i].r} de ouro`, 3000);
          saveGame();
          openQuests();
        }),
    );
  byId("qclose").onclick = closeQuests;
  byId("quests").scrollTop = 0;
  playSound(440, 0.1, "sine");
}
function closeQuests() {
  byId("quests").style.display = "none";
  game.mode = "world";
}
function toggleQuests() {
  if (game.dialog) return;
  if (game.mode === "map") closeMap();
  if (game.mode === "grimoire") closeGrim();
  if (game.mode === "world") openQuests();
  else if (game.mode === "quests") closeQuests();
}
function checkQuest() {
  const id = curStep().id;
  if (game.lastStep && game.lastStep !== id) {
    toast("✓ Missão concluída · Próxima: " + curStep().t, 2600);
    playSound(660, 0.12, "sine");
    setTimeout(() => playSound(880, 0.2, "sine"), 120);
  }
  game.lastStep = id;
}
function drawQuestArrow(t, camX, camY, Z = 1) {
  // Durante um turno de trabalho a seta mostra o próximo passo do trabalho.
  const jt = player.job ? jobTarget() : trappedTarget();
  if (player.job && !jt) return;
  if (!jt && lifeMode()) return;
  if (!jt && player.finished && !urgent() && !(game.raid && player.zone === "vila")) return;
  const r = jt || questTarget();
  const tx = (r.x * TILE + 16 - camX) * Z,
    ty = (r.y * TILE + 16 - camY) * Z;
  ctx.save();
  if (tx > 24 && tx < viewWidth - 24 && ty > 24 && ty < 456) {
    const b = Math.sin(t * 5) * 4;
    ctx.fillStyle = "#f2c14e";
    ctx.strokeStyle = "#3a1d5a";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(tx, ty - 16 + b);
    ctx.lineTo(tx - 7, ty - 27 + b);
    ctx.lineTo(tx + 7, ty - 27 + b);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.globalAlpha = 0.35 + 0.25 * Math.sin(t * 4);
    ctx.strokeStyle = "#f2c14e";
    ctx.beginPath();
    ctx.arc(tx, ty, 14 + Math.sin(t * 4) * 2, 0, 7);
    ctx.stroke();
  } else {
    const cx = viewWidth / 2,
      cy = 250,
      a = Math.atan2(ty - cy, tx - cx);
    const ex = Math.max(40, Math.min(viewWidth - 40, cx + Math.cos(a) * (viewWidth * 0.6))),
      ey0 = Math.max(90, Math.min(440, cy + Math.sin(a) * 400)),
      ey = ex < 180 && ey0 < 130 ? 130 : ey0;
    ctx.translate(ex, ey);
    ctx.rotate(a);
    ctx.fillStyle = "#f2c14e";
    ctx.strokeStyle = "#3a1d5a";
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.85;
    ctx.beginPath();
    ctx.moveTo(14, 0);
    ctx.lineTo(-8, -9);
    ctx.lineTo(-3, 0);
    ctx.lineTo(-8, 9);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.rotate(-a);
    ctx.font = "14px VT323, monospace";
    ctx.textAlign = "center";
    ctx.fillStyle = "#fff";
    ctx.fillText(Math.abs(r.x - player.x) + Math.abs(r.y - player.y) + " passos", 0, 30);
  }
  ctx.restore();
}

/* ===================== HUD ===================== */
let hudCache = "";
/** Ícone do objetivo do topo da tela. */
function questIcon(text) {
  if (player.job) return (PROFESSIONS[player.job.id] || { icon: "bag" }).icon;
  if (/^!/.test(text) || /Ataque/.test(text)) return "anger";
  if (/Guardião|Liberte|Silenciador|Enfrente/.test(text)) return "skull";
  if (lifeMode()) return isMonarch() ? "crown" : "house";
  return choiceIcon(text) || "scroll";
}
function updateHUD() {
  let chips = "";
  if (player.injured) chips += `<span class="chip" style="color:#ff6b6b">${iconHTML("anger", 12)}Ferido</span>`;
  const ml = !lifeMode() && moralLabel();
  if (ml)
    chips += `<span class="chip" style="color:${ml.c}" title="Escolhas de herói: ${player.heroPts || 0} · de vilão: ${player.villain || 0}. Elas mexem na sua reputação.">${iconHTML(ml.icon, 12)}${ml.n}</span>`;
  if (sickness()) chips += `<span class="chip" style="color:${sickness().color}" title="${sickness().desc}">${iconHTML(sickness().icon, 12)}${sickness().n}</span>`;
  if (starving()) chips += `<span class="chip" style="color:#ffb35a">Fraco de fome/sede</span>`;
  const body = bodyState();
  if (body) chips += `<span class="chip" style="color:${body.c}" title="${body.d}">${iconHTML(body.icon, 12)}${body.n}</span>`;
  if (!lifeMode() && stamina() < 30) chips += `<span class="chip" style="color:#ffd66b" title="Volte para a vila e durma.">${iconHTML("zzz", 12)}Exaust${genderWord("o", "a", "e")}</span>`;
  if (game.mode === "battle" && battle) {
    if (battle.shield > 0)
      chips += `<span class="chip" style="color:#e0ab62">Muralha ${battle.shield}</span>`;
    if (battle.poison > 0) chips += `<span class="chip" style="color:#c77dff">Veneno ${battle.poison}</span>`;
    if (battle.defending) chips += `<span class="chip" style="color:#9fd0ff">Defendendo</span>`;
  }
  if ((player.drunk || 0) >= 30)
    chips += `<span class="chip" style="color:#f2a8c8"> Bêbad${genderWord("o", "a", "e")}</span>`;
  if ((player.rep ?? 50) < 25) chips += `<span class="chip" style="color:#ff8a8a"> Má fama</span>`;
  if (player.blessDay === player.day && game.mode !== "battle") {
    chips += `<span class="chip" style="color:#f2c14e">Abençoado</span>`;
  }
  const needBar = (k, cls) =>
    `<span title="${LIFE_NEEDS[k].n}">${iconHTML(LIFE_NEEDS[k].icon, 14)}</span><div class="bar ${cls}"><i style="width:${lifeNeed(k)}%"></i></div>`;
  const storyRow = !lifeMode()
    ? `<div class="hrow nd"><span title="Fôlego: cada luta cansa. Durma para recuperar.">${iconHTML("bolt", 14)}</span><div class="bar en${stamina() < 30 ? " low" : ""}" title="Fôlego ${Math.round(stamina())}/100"><i style="width:${stamina()}%"></i></div></div>`
    : "";
  const lifeRows = lifeMode()
    ? `<div class="hrow nd">${needBar("energy", "en")}${needBar("hygiene", "hy")}</div><div class="hrow nd">${needBar("fun", "fu")}<span style="font-size:.75em;color:#c9a8ff">${playerAge()} anos</span></div>`
    : "";
  const s = `<div class="box hudL"><div class="hrow"><span class="lv">${lifeMode() ? iconHTML("heart", 12) + "Vida" : iconHTML("star", 12) + "Nv" + player.lvl}</span><div class="bar hp"><i style="width:${Math.max(0, (100 * player.hp) / maxHp())}%"></i><em>${Math.max(0, player.hp)}/${maxHp()}</em></div></div>
  <div class="hrow"><span class="gd">${iconHTML("coin", 12)}${player.gold}</span>${lifeMode() ? '<span style="font-size:.8em;color:#c9a8ff">Simulador de Vida</span>' : `<div class="bar mp"><i style="width:${(100 * player.mp) / maxMp()}%"></i><em>${player.mp}/${maxMp()}</em></div>`}</div>
  <div class="hrow nd"><span title="Fome">${iconHTML("meat", 14)}</span><div class="bar fd"><i style="width:${player.food}%"></i></div><span title="Sede">${iconHTML("water", 14)}</span><div class="bar wt"><i style="width:${player.water}%"></i></div></div>
  ${storyRow}${lifeRows}${chips ? `<div class="chips">${chips}</div>` : ""}</div>
  <div class="box hudR"><span class="clock">${iconHTML(WEATHER_ICONS[player.weather] || "sun", 14)}${clockStr()}${festivalToday() ? ` · <b style="color:#ff8ad0"> ${festivalToday().n.replace("Festival ", "")}</b>` : ""}</span>${lifeMode() ? "" : ORDER.map((r) => `<span class="rune ${player.runes.includes(r) ? "on" : ""} ${weatherMark(r)}" title="${RUNES[r].nome}${weatherMark(r) ? ` (${weatherMark(r) === "up" ? "forte" : "fraca"} com este clima)` : ""}">${runeSVG(r, 16)}${weatherMark(r) ? `<i class="wmk">${weatherMark(r) === "up" ? "▲" : "▼"}</i>` : ""}</span>`).join("")}</div>`;
  if (s !== hudCache) {
    byId("hud").innerHTML = s;
    hudCache = s;
  }
  const tp = byId("tgtpill");
  if (game.tgt && game.mode === "world" && !game.dialog) {
    const lb = (matchMedia("(pointer:coarse)").matches ? "A" : "E") + " · " + game.tgt.l;
    if (tp.dataset.s !== lb) {
      tp.innerHTML = iconHTML(choiceIcon(game.tgt.l) || "") + escapeHtml(lb);
      tp.dataset.s = lb;
    }
    tp.style.display = "block";
  } else tp.style.display = "none";
  const qp = byId("qpill");
  if (game.mode === "world" && !game.dialog && game.raid) {
    const qs = ` Ataque! Onda ${game.raid.wave}/${game.raid.waves} · ${raidLeft()} inimigos · ${Math.max(0, Math.ceil(game.raid.left / 60))}h restantes`;
    if (qp.dataset.s !== qs) {
      qp.innerHTML = iconHTML(questIcon(qs)) + escapeHtml(qs);
      qp.dataset.s = qs;
    }
    qp.className = "box ui urg";
    qp.style.display = "block";
  } else if (game.mode === "world" && !game.dialog && player.zone === "casa") {
    const qs = " Sua casa · R: decorar · porta embaixo para sair";
    if (qp.dataset.s !== qs) {
      qp.innerHTML = iconHTML(questIcon(qs)) + escapeHtml(qs);
      qp.dataset.s = qs;
    }
    qp.className = "box ui";
    qp.style.display = "block";
  } else if (game.mode === "world" && !game.dialog && player.job) {
    const qs = jobStatusText();
    if (qp.dataset.s !== qs) {
      qp.innerHTML = iconHTML(questIcon(qs)) + escapeHtml(qs);
      qp.dataset.s = qs;
    }
    qp.className = "box ui";
    qp.style.display = "block";
  } else if (game.mode === "world" && !game.dialog && lifeMode()) {
    const qs = lifeGoalText();
    if (qp.dataset.s !== qs) {
      qp.innerHTML = iconHTML(questIcon(qs)) + escapeHtml(qs);
      qp.dataset.s = qs;
    }
    qp.className = "box ui" + (qs.startsWith("!") ? " urg" : "");
    qp.style.display = "block";
  } else if (game.mode === "world" && !game.dialog && game.ep == null && player.finished && !urgent()) {
    const ns = nextSide();
    const qs = ns
      ? `★ ${ns.t} · ${Math.min(ns.p(), sideN(ns))}/${sideN(ns)}`
      : "★ Todas as missões secundárias concluídas!";
    if (qp.dataset.s !== qs) {
      qp.innerHTML = iconHTML(questIcon(qs)) + escapeHtml(qs);
      qp.dataset.s = qs;
    }
    qp.className = "box ui";
    qp.style.display = "block";
  } else if (game.mode === "world" && !game.dialog && game.ep == null) {
    const u = urgent(),
      q = u || curStep(),
      r = questTarget();
    const d = Math.abs(r.x - player.x) + Math.abs(r.y - player.y);
    const qs = `${u ? "" : "▶"} ${q.t} · ${d}`;
    if (qp.dataset.s !== qs) {
      qp.innerHTML = iconHTML(questIcon(qs)) + escapeHtml(qs);
      qp.dataset.s = qs;
    }
    qp.className = "box ui" + (u ? " urg" : "");
    qp.style.display = "block";
  } else qp.style.display = "none";
}
let toastTimer = null;
function toast(msg, ms = 2200) {
  const el = byId("toast");
  const ic = choiceIcon(msg);
  el.innerHTML = (ic ? iconHTML(ic) : "") + escapeHtml(String(msg));
  el.style.display = "block";
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (el.style.display = "none"), ms);
}

/* ===================== GRIMÓRIO ===================== */

function spellDesc(s) {
  const p = [];
  if (s.pow) p.push(`${s.hits ? s.hits + "× " : ""}dano de ${s.el.map((e) => RUNES[e].nome).join("/")}`);
  if (s.heal) p.push("cura");
  if (s.shield) p.push("escudo por 3 turnos");
  if (s.burn) p.push("queima");
  if (s.drain) p.push("rouba vida");
  if (s.blind) p.push("cega");
  if (s.freeze) p.push("congela");
  if (s.weaken) p.push("enfraquece");
  return p.join(", ");
}
function openGrim() {
  if (lifeMode()) return toast("No Simulador de Vida não há magia nem grimório.", 2200);
  game.mode = "grimoire";
  let h = `<div class="gh"><h2>Grimório Arcano</h2><button id="gclose">Fechar (G)</button></div>
  <p class="gsub">Magias recuperadas: ${player.spells.length} de ${Object.keys(SPELLS).length}. Páginas encontradas: ${player.pages.length} de 5.</p>
  <div class="gruns">${ORDER.map((r) => `<div class="gr ${player.runes.includes(r) ? "on" : ""}">${runeSVG(r, 26)}<span>${player.runes.includes(r) ? RUNES[r].nome : "Runa perdida"}</span></div>`).join("")}</div>
  <h3>Magias</h3><div class="glist">`;
  for (const k of Object.keys(SPELLS)) {
    const s = SPELLS[k],
      known = player.spells.includes(k);
    h += `<div class="gs ${known ? "on" : ""}"><div class="gsym">${k
      .split("+")
      .map((r) => runeSVG(r, 20))
      .join("")}</div><div>
      <b>${known ? s.nome : "???"}</b> <span class="gm">${s.mp ? spellCost(k) : 0} MP${known ? ", " + spellDesc(s) : ""}${known ? ` · Domínio ${"★".repeat(masteryLv(k))}${"☆".repeat(5 - masteryLv(k))} (${(player.mastery || {})[k] || 0} usos)` : ""}</span>
      <div class="glore">${known ? "“" + s.lore + "”" : "Combinação esquecida. Teste estas runas em batalha."}</div></div></div>`;
  }
  h += "</div><h3>Páginas perdidas</h3>";
  PAGE_ORDER.forEach((z, i) => {
    h += player.pages.includes(z)
      ? `<div class="gp"><b>Página ${i + 1}.</b> ${PAGES[z]}</div>`
      : `<div class="gp off"><b>Página ${i + 1}.</b> Ainda perdida em ${ZONES[z].nome}.</div>`;
  });
  byId("grim").innerHTML = h;
  byId("grim").style.display = "block";
  byId("gclose").onclick = closeGrim;
  byId("grim").scrollTop = 0;
  playSound(440, 0.1, "sine");
}
function closeGrim() {
  byId("grim").style.display = "none";
  game.mode = "world";
}
