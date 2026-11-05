/**
 * ECOS DO ARCANO — 07-trabalhos-comercio-ataques.js
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
  return player.guards.filter((z) => ["bosque", "pantano", "picos"].includes(z)).length;
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
        fn: () => {
          if (player.gold < withTax(cost)) {
            say([["Cocheiro", "Sem ouro, sem viagem."]]);
            return;
          }
          payWithTax(cost);
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
function renderShop() {
  const sh = SHOPS[game.shopId];
  let h = `<div class="gh"><h2>${sh.nome}</h2><button id="shclose">Fechar (Esc)</button></div>
  <div class="gsub">${sh.sub} · Seu ouro: <b style="color:var(--gold)">${player.gold}</b></div>
  <div class="gsub">${taxNote()}${player.taxPaid ? ` · Você já pagou ${player.taxPaid} de imposto` : ""}</div>
  <div class="tabs"><button data-t="buy" class="${game.shopTab === "buy" ? "on" : ""}">Comprar</button><button data-t="sell" class="${game.shopTab === "sell" ? "on" : ""}">Vender</button></div>`;
  if (game.shopTab === "buy") {
    for (const id of sh.items) {
      const it = ITEMS[id];
      const lock = it.req && guardiansFreed() < it.req;
      const base = Math.round(it.preco * discount(game.shopId));
      const pr = withTax(base);
      const can = !lock && player.gold >= pr;
      h += `<div class="irow"><div><div class="nm">${iconHTML(itemIcon(id))}${it.nome}${itemCount(id) ? ` <span class="ds">(tem ${itemCount(id)})</span>` : ""}</div><div class="ds">${lock ? `Disponível após libertar ${it.req} Guardião(ões).` : it.desc}</div></div>
      <div><span class="pr">${pr} ouro</span>${pr > base ? ` <span class="ds">(${base} + ${pr - base} imposto)</span>` : ""} <button data-b="${id}" ${can ? "" : "disabled"}>Comprar</button></div></div>`;
    }
  } else {
    const ids = Object.keys(player.inv).filter(
      (id) => itemCount(id) > (Object.values(player.eq).includes(id) ? 1 : 0),
    );
    if (!ids.length) h += '<div class="qtip">Nada para vender.</div>';
    for (const id of ids) {
      const it = ITEMS[id];
      const pr = saleAfterTax(Math.floor(it.preco / 2));
      h += `<div class="irow"><div><div class="nm">${iconHTML(itemIcon(id))}${it.nome} <span class="ds">(tem ${itemCount(id)})</span></div><div class="ds">${it.desc}</div></div><div><span class="pr">${pr} ouro</span> <button data-s="${id}">Vender</button></div></div>`;
    }
  }
  byId("shop").innerHTML = h;
  byId("shclose").onclick = closeShop;
  byId("shop")
    .querySelectorAll("[data-t]")
    .forEach(
      (b) =>
        (b.onclick = () => {
          game.shopTab = b.dataset.t;
          renderShop();
        }),
    );
  byId("shop")
    .querySelectorAll("[data-b]")
    .forEach(
      (b) =>
        (b.onclick = () => {
          const it = ITEMS[b.dataset.b];
          const base = Math.round(it.preco * discount(game.shopId));
          if (player.gold < withTax(base)) return;
          payWithTax(base);
          addItem(b.dataset.b);
          if (game.shopId === "rosa" || game.shopId === "bruno") player.flags.bought = true;
          playSound(880, 0.08, "sine");
          toast(`Comprou: ${it.nome}` + (it.tipo === "equip" ? " · equipe no inventário (I)" : ""));
          saveGame();
          renderShop();
        }),
    );
  byId("shop")
    .querySelectorAll("[data-s]")
    .forEach(
      (b) =>
        (b.onclick = () => {
          const it = ITEMS[b.dataset.s];
          player.gold += saleAfterTax(Math.floor(it.preco / 2));
          removeItem(b.dataset.s);
          playSound(600, 0.08, "sine");
          saveGame();
          renderShop();
        }),
    );
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
    ["hab", "Habilidades"],
    ["amigos", "Amizades"],
    ["familia", "Família"],
    ["visual", "Aparência"],
    ["status", "Status"],
  ]
    .map(([k, n]) => `<button data-t="${k}" class="${t === k ? "on" : ""}">${n}</button>`)
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
