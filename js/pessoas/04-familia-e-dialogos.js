/* 04-familia-e-dialogos.js: junta 05-familia-e-vida-social.js, 06-festivais-amizades-dialogos.js. */
/**
 * ECOS DO ARCANO — 04-familia-e-dialogos.js
 * Família, aparência, reputação, mascotes, traição, fofocas, bebedeira, brigas, escola e passeata.
 */

/* ===================== FAMÍLIA ===================== */

const ROMANCE = ["rosa", "curandeira", "kael", "iara", "ferreiro", "marina", "tobias", "rainha"];

/** A Rainha só aceita ser cortejada por quem é querido e já serviu ao reino. */
function royalSuitor() {
  return (player.rep ?? 50) >= 70 && (guardiansFreed() >= 1 || player.flags.guardaReal);
}
/** Coroa desenhada por cima de um sprite de 32px (u = 2). */
function drawCrown(X, Y) {
  ctx.fillStyle = "#f2c14e";
  ctx.fillRect(X + 10, Y + 2, 12, 4);
  ctx.fillRect(X + 10, Y, 2, 3);
  ctx.fillRect(X + 15, Y - 1, 2, 3);
  ctx.fillRect(X + 20, Y, 2, 3);
  ctx.fillStyle = "#e0303a";
  ctx.fillRect(X + 15, Y + 3, 2, 2);
}

/* ===================== ACONTECIMENTOS DO DIA ===================== */

/** Roda uma vez por dia, quando o dia vira. */
function onNewDay() {
  if (player.spouse === "rainha") {
    player.gold += 50;
    setTimeout(() => toast("Mesada real: +50 de ouro do tesouro da Coroa.", 3500), 2200);
  }
  if (typeof growKids === "function") growKids();
  if (lifeMode()) {
    ageTick();
    worldTick();
    houseDaily();
    villageEventOfDay();
    dailySicknessRoll();
  }
  restoreWorkTiles();
}
const FAM_SPOTS = {
  spouse: [11, 7],
  kids: [
    [3, 7],
    [4, 8],
    [8, 7],
    [2, 5],
    [12, 5],
    [7, 8],
  ],
};
/** Lugar de cada filho dentro de casa: os 6 primeiros fixos, os demais nos espaços livres. */
function kidSpot(i) {
  if (i < FAM_SPOTS.kids.length) return FAM_SPOTS.kids[i];
  const taken = new Set([...FAM_SPOTS.kids, FAM_SPOTS.spouse, [6, 8], [7, 8]].map(([x, y]) => x + "," + y));
  const free = [];
  for (let y = 3; y <= 8; y++)
    for (let x = 1; x <= 12; x++) {
      const occupied = (player.furn || []).some((f) => f.x === x && f.y === y);
      if (!taken.has(x + "," + y) && !occupied) free.push([x, y]);
    }
  return free[(i - FAM_SPOTS.kids.length) % Math.max(1, free.length)] || null;
}
function schoolTime() {
  const h = currentHour();
  return h >= 8 && h < 14 && !festivalToday();
}
function atSchool(k) {
  return k.school && kidAge(k) >= 2 && schoolTime();
}
function familyList() {
  if (player.zone !== "casa") return [];
  const l = [];
  if (player.spouse)
    l.push({
      kind: "spouse",
      id: player.spouse,
      x: FAM_SPOTS.spouse[0],
      y: FAM_SPOTS.spouse[1],
    });
  player.kids.forEach((k, i) => {
    const spot = kidSpot(i);
    const away = k.movedOut && !festivalToday();
    if (!away && !atSchool(k) && spot) l.push({ kind: "kid", k, i, x: spot[0], y: spot[1] });
  });
  return l;
}
function kidAge(k) {
  return player.day - k.born;
}
/** Bebê dormindo no berço, com manta, móbile e respiração. */
function drawBaby(X, Y, k, t) {
  const wood = "#a8784a",
    woodDark = "#7a5230";
  ctx.fillStyle = woodDark;
  ctx.fillRect(X + 3, Y + 26, 3, 5);
  ctx.fillRect(X + 26, Y + 26, 3, 5);
  ctx.fillStyle = "#f6efe2";
  ctx.fillRect(X + 4, Y + 18, 24, 9);
  const breathe = Math.sin(t * 2.2) * 0.8;
  ctx.fillStyle = k.look.skin;
  circle(X + 11, Y + 18, 5);
  ctx.fillStyle = k.look.hair;
  ctx.fillRect(X + 8, Y + 13, 6, 2);
  ctx.fillRect(X + 10, Y + 12, 2, 1);
  ctx.fillStyle = "#3a2414";
  ctx.fillRect(X + 8, Y + 18, 2, 1);
  ctx.fillRect(X + 12, Y + 18, 2, 1);
  ctx.fillStyle = "#ff9ab0";
  ctx.fillRect(X + 7, Y + 20, 2, 1);
  ctx.fillRect(X + 13, Y + 20, 2, 1);
  ctx.fillStyle = k.look.robe || "#e86ab0";
  ctx.fillRect(X + 13, Y + 19 - breathe, 14, 8 + breathe);
  ctx.fillStyle = shade(k.look.robe || "#e86ab0", 0.35);
  for (let i = 0; i < 3; i++) ctx.fillRect(X + 15 + i * 4, Y + 21 - breathe, 2, 2);
  ctx.fillStyle = wood;
  ctx.fillRect(X + 2, Y + 14, 28, 2);
  ctx.fillRect(X + 2, Y + 26, 28, 2);
  ctx.fillStyle = woodDark;
  for (let i = 0; i < 7; i++) ctx.fillRect(X + 3 + i * 4, Y + 16, 1, 10);
  ctx.fillRect(X + 2, Y + 10, 2, 18);
  ctx.fillRect(X + 28, Y + 10, 2, 18);
  ctx.strokeStyle = "#8a6038";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(X + 16, Y + 2);
  ctx.lineTo(X + 16, Y + 6);
  ctx.stroke();
  const spin = Math.sin(t * 1.5) * 4;
  ctx.fillStyle = "#f2c14e";
  circle(X + 12 + spin, Y + 8, 2);
  ctx.fillStyle = "#7fd0ff";
  circle(X + 20 - spin, Y + 8, 2);
  ctx.fillStyle = "#ff8aa8";
  circle(X + 16, Y + 9 + spin * 0.3, 2);
  if (Math.sin(t * 0.7) > 0.85) {
    ctx.fillStyle = "rgba(255,255,255,.8)";
    ctx.font = '10px "VT323", monospace';
    ctx.fillText("z", X + 4, Y + 10 - (t % 1) * 4);
  }
}

function drawFamily(f, t) {
  const X = f.x * TILE,
    Y = f.y * TILE;
  ctx.fillStyle = "rgba(0,0,0,.22)";
  ctx.beginPath();
  ctx.ellipse(X + 16, Y + 30, 8, 3, 0, 0, 7);
  ctx.fill();
  if (f.kind === "spouse") {
    const n = NPCS[f.id];
    drawSprite(wizardRects(n.robe, n.hat, n.hair, null, "down"), X, Y + Math.sin(t * 2) * 0.8, 2);
    if (n.crown) drawCrown(X, Y + Math.sin(t * 2) * 0.8);
    ctx.fillStyle = "#ff6b8a";
    ctx.font = "12px sans-serif";
    ctx.textAlign = "center";
    if (Math.sin(t * 1.5) > 0.6) drawPixelIcon("heart", X + 16, Y - 6);
  } else if (kidAge(f.k) < 2) {
    drawBaby(X, Y, f.k, t);
  } else {
    // Criança pequena, adolescente médio, adulto do tamanho de todo mundo.
    const stage = kidStage(f.k);
    const sc = stage.key === "crianca" ? 1.4 : stage.key === "teen" ? 1.75 : 2;
    const b = Math.abs(Math.sin(t * 4 + f.i)) * (stage.key === "adulto" ? -0.6 : -2);
    ctx.save();
    ctx.translate(X + (32 - 16 * sc) / 2, Y + 32 - 16 * sc + b);
    for (const [x, y, w, h, c] of heroRects(f.k.look, "down", null)) {
      ctx.fillStyle = c;
      ctx.fillRect(x * sc, y * sc, w * sc, h * sc);
    }
    ctx.restore();
    if (f.k.spouse && stage.key === "adulto") drawPixelIcon("ring", X + 16, Y - 6);
  }
}
function familyMenu(f) {
  if (f.kind === "spouse") {
    const id = f.id,
      n = NPCS[id].nome.split(",")[0];
    const opts = [
      {
        t: "Conversar",
        fn: () =>
          say([
            [
              n,
              [
                "Que bom ver você em casa. Senti sua falta hoje.",
                "Você parece cansado... quer que eu prepare um chá?",
                "As crianças da vila vivem perguntando das suas aventuras!",
                "Prometa que vai voltar inteiro da próxima vez.",
                "Às vezes fico olhando o céu e pensando em você lá fora, enfrentando monstros.",
              ][Math.floor(Math.random() * 5)],
            ],
          ]),
      },
      ...affectionMenuItems({ id }),
      ...openRelationshipItems(id),
      {
        t: "Pedir uma refeição caseira",
        fn: () => {
          if (player.famDay.meal === player.day) {
            say([[n, "Já comemos juntos hoje! Volte amanhã."]]);
            return;
          }
          player.famDay.meal = player.day;
          player.food = 100;
          player.water = 100;
          player.hp = Math.min(maxHp(), player.hp + Math.round(maxHp() * 0.3));
          saveGame();
          say([
            [n, "Fiz seu prato favorito. Coma tudo!"],
            ["", "Fome e sede cheias e +30% HP."],
          ]);
        },
      },
      {
        t: "Passear juntos pela vila",
        fn: () => {
          player.clock = Math.min(1439, player.clock + 60);
          player.mp = maxMp();
          game.fade = 1;
          saveGame();
          say([["", `Vocês passeiam de mãos dadas pela praça. ${n} ri das suas histórias. MP restaurado.`]]);
        },
      },
    ];
    if (
      !player.kids.length ||
      player.day - Math.max(...player.kids.filter((k) => !k.adopted).map((k) => k.born), -99) >= 1
    )
      opts.push({
        t: "Conversar sobre ter um filho",
        fn: () => {
          const g = Math.random() < 0.5 ? "m" : "f";
          say([[n, "Eu também sonho com uma família maior..."], ["", "Alguns meses depois..."]], () =>
            celebrateBirth(g, () => promptName(g === "m" ? "Nome do menino" : "Nome da menina", "Como vai se chamar?", (nm) => {
              const L = {
                skin: Math.random() < 0.5 ? player.look.skin : "#d9a07a",
                hair: Math.random() < 0.5 ? player.look.hair : NPCS[id].hair,
                hstyle: ["curto", "longo", "cacheado", "rabo"][Math.floor(Math.random() * 4)],
                hat: "nenhum",
                hatc: "#2a2f6e",
                outfit: g === "f" ? ["vestido", "tunica"][Math.floor(Math.random() * 2)] : ["tunica", "manto"][Math.floor(Math.random() * 2)],
                robe: g === "f" ? ["#e86ab0", "#c94a8a", "#f2c14e"][Math.floor(Math.random() * 3)] : ["#4a7ad9", "#7ab04a", "#3d4fa8"][Math.floor(Math.random() * 3)],
              };
              player.kids.push({
                name: nm,
                g,
                born: player.day,
                look: L,
              });
              saveGame();
              playSound(784, 0.2, "sine");
              setTimeout(() => playSound(1047, 0.3, "sine"), 180);
              say([
                ["", `Um bebê chegou à família! Bem-vindo ao mundo, ${nm}!`],
                [n, "Olha... tem os seus olhos."],
                ["", `O bebê fica dentro de casa. Em 2 dias ${g === "f" ? "ela" : "ele"} vira uma criança.`],
              ]);
            })),
          );
        },
      });
    opts.push({
      t: "Sair",
      fn: null,
    });
    choice(
      `${NPCS[id].nome} ♥`,
      `Casados desde o dia ${player.married}. ${player.kids.length ? "Filhos: " + player.kids.map((k) => k.name).join(", ") + "." : ""}`,
      opts,
    );
    return;
  }
  const k = f.k,
    age = kidAge(k);
  if (age < 2) {
    choice(k.name, `${k.name} é um bebê. Ri e agarra seu dedo com força.`, [
      { t: "Abraçar", fn: () => playAffection("hug", { kind: "kid", k }) },
      { t: "Sair", fn: null },
    ]);
    return;
  }
  const lines = KID_LINES[kidStage(k).key];
  const opts = [
    {
      t: "Conversar",
      fn: () => {
        if (player.famDay["kidtalk" + k.name] !== player.day) {
          player.famDay["kidtalk" + k.name] = player.day;
          k.mood = Math.min(100, (k.mood ?? 60) + 3);
        }
        say([[k.name, lines[Math.floor(Math.random() * lines.length)]]]);
      },
    },
    ...(kidStage(k).key === "adulto" ? [] : affectionMenuItems({ kind: "kid", k })),
    ...grownKidMenuItems(k),
    ...adultKidItems(k),
    {
      t: "Brincar",
      fn: () => {
        player.mp = Math.min(maxMp(), player.mp + 15);
        player.food = Math.max(0, player.food - 5);
        toast(`Você brinca de pega-pega com ${k.name}. +15 MP.`);
      },
    },
  ];
  if (player.famDay["gift" + f.i] !== player.day)
    opts.push({
      t: "Ganhar um presente",
      fn: () => {
        player.famDay["gift" + f.i] = player.day;
        const it = ["maca", "pao", "agua", "cha"][Math.floor(Math.random() * 4)];
        addItem(it);
        saveGame();
        say([
          [k.name, `Achei isso pra você! É um presente!`],
          ["", `${k.name} te deu: ${ITEMS[it].nome}.`],
        ]);
      },
    });
  opts.push({
    t: "Sair",
    fn: null,
  });
  choice(k.name, `${kidStage(k).n} · ${age} dias de vida${k.spouse ? ` · casado(a) com ${k.spouse}` : k.partner ? ` · namorando ${k.partner}` : ""} · Humor: ${kidMood(k)}`, opts);
}
function promptName(title, text, cb) {
  game.mode = "prompt";
  byId("choice").innerHTML =
    `<h3>${title}</h3><p>${text}</p><input id="pname" maxlength="12" autocomplete="off" style="font-family:VT323,monospace;font-size:1.2em;background:#1a1328;color:#fff;border:2px solid var(--edge);border-radius:3px;padding:.15em .4em;width:12em"><div class="btns" style="margin-top:.6em"><button id="pok">Confirmar</button></div>`;
  byId("choice").style.display = "block";
  setTimeout(() => byId("pname").focus(), 50);
  const go = () => {
    const v = (byId("pname").value || "").trim().slice(0, 12) || "Pequeno";
    byId("choice").style.display = "none";
    game.mode = "world";
    cb(v);
  };
  byId("pok").onclick = go;
  byId("pname").onkeydown = (e) => {
    if (e.key === "Enter") go();
  };
}
function familyHTML() {
  let h =
    '<div class="qtip">Fique Amigo (♥♥) de alguém especial, convide para namorar, compre um Anel de Compromisso (Ourives Lúcio ou Joalheria Pérola) e faça o pedido. Depois do casamento, sua família mora com você e vocês podem ter filhos.</div>';
  if (player.spouse)
    h += `<div class="irow eqd"><div><div class="nm">${NPCS[player.spouse].nome} ♥</div><div class="ds">Casados desde o dia ${player.married}. Mora com você, dentro de casa.</div></div></div>`;
  else if (player.dating)
    h += `<div class="irow"><div><div class="nm">Namorando: ${NPCS[player.dating].nome}</div><div class="ds">Amizade ${friendship(player.dating)}/100. Com 75 ou mais e um anel, você pode pedir em casamento.</div></div></div>`;
  else h += '<div class="irow"><div class="ds">Você ainda não está namorando.</div></div>';
  h += `<div class="irow"><div><div class="nm">Reputação: ${player.rep ?? 50}/100 · ${repLabel()}</div><div class="ds">Ajudar a vila, vencer ataques e ser gentil melhora sua fama. Traição descoberta, bebedeira e grosseria pioram. Com má fama, preços sobem e ninguém quer namorar você.</div></div></div>`;
  (player.lovers || []).forEach((id) => {
    h += openRelationship()
      ? `<div class="irow"><div><div class="nm">${iconHTML("heart")}Namoro aberto: ${NPCS[id].nome}</div><div class="ds">Amizade ${friendship(id)}/100. Relação aberta: sem risco de ser descoberto.</div></div></div>`
      : `<div class="irow"><div><div class="nm"> Namoro secreto: ${NPCS[id].nome}</div><div class="ds">Amizade ${friendship(id)}/100. Risco de ser descoberto todo dia.</div></div></div>`;
  });
  (player.sspouses || []).forEach((id) => {
    h += `<div class="irow"><div><div class="nm"> Família secreta: ${NPCS[id].nome}</div><div class="ds">${
      (player.skids || [])
        .filter((k) => k.p === id)
        .map((k) => "Filho(a): " + k.name)
        .join(", ") || "Ainda sem filhos."
    }</div></div></div>`;
  });
  player.kids.forEach((k) => {
    const extra = k.spouse
      ? ` · casado(a) com ${k.spouse}${k.movedOut ? " (mora fora, visita nos festivais)" : ""}${k.grandkids ? ` · ${k.grandkids} neto(s)` : ""}`
      : k.partner
        ? ` · namorando ${k.partner}`
        : "";
    h += `<div class="irow"><div><div class="nm">${iconHTML(kidStage(k).key === "bebe" ? "baby" : "smile")}${k.name}</div><div class="ds">${kidStage(k).n} · nasceu no dia ${k.born}${k.school ? " · Escola: nota " + grade(k) : kidAge(k) >= 2 && kidAge(k) < 16 ? " · Pode ir à escola" : ""}${extra}</div></div></div>`;
  });
  h +=
    "<h3>Pessoas especiais</h3>" +
    ROMANCE.map(
      (id) =>
        `<div class="irow"><div class="nm">${NPCS[id].nome} <span style="color:#ff8aa8">${hearts(id)}</span></div><span class="pr">${player.spouse === id ? "Casados" : player.dating === id ? "Namorando" : (player.sspouses || []).includes(id) ? "Casados em segredo" : (player.lovers || []).includes(id) ? (openRelationship() ? "Namoro aberto" : "Namoro secreto") : friendshipLevel(id) >= 2 ? "Pode namorar" : ""}</span></div>`,
    ).join("");
  return h;
}

/* ===================== APARÊNCIA ===================== */

const COSMETICS = {
  hstyle: [
    ["curto", "Curto", 0],
    ["longo", "Longo", 0],
    ["rabo", "Rabo de cavalo", 0],
    ["cacheado", "Cacheado", 0],
    ["careca", "Raspado", 0],
    ["trancas", "Tranças", 60],
    ["coque", "Coque", 50],
    ["moicano", "Moicano", 70],
  ],
  hair: [
    ["#3a2414", "Castanho", 0],
    ["#1a1a1a", "Preto", 0],
    ["#d9a441", "Loiro", 0],
    ["#a8442a", "Ruivo", 0],
    ["#e8e4dc", "Prateado", 45],
    ["#4a7ad9", "Azul", 45],
    ["#e86ab0", "Rosa", 45],
    ["#4ab06a", "Verde", 45],
    ["#8a4ad9", "Roxo", 45],
  ],
  skin: [
    ["#f6d5b8", "", 0],
    ["#f1c8a5", "", 0],
    ["#d9a07a", "", 0],
    ["#a8704a", "", 0],
    ["#7a4a2a", "", 0],
    ["#4a2e1a", "", 0],
  ],
  hat: [
    ["mago", "Chapéu de mago", 0],
    ["nenhum", "Sem chapéu", 0],
    ["capuz", "Capuz", 0],
    ["boina", "Boina", 60],
    ["flor", "Flor no cabelo", 40],
    ["tiara", "Tiara", 90],
    ["abas", "Chapéu de abas largas", 150],
    ["coroa", "Coroa dourada", 500],
    ["festa", "Chapéu de Festa (prêmio)", 9999],
  ],
  outfit: [
    ["manto", "Manto de aprendiz", 0],
    ["tunica", "Túnica", 0],
    ["vestido", "Vestido arcano", 0],
    ["capa", "Capa de viajante", 90],
    ["gibao", "Gibão de cavaleiro", 160],
    ["real", "Traje real", 400],
  ],
  robe: [
    ["#3d4fa8", "Azul", 0],
    ["#8a2b2b", "Vermelho", 0],
    ["#2f6f4a", "Verde", 0],
    ["#5b3fa8", "Roxo", 0],
    ["#4a4a52", "Cinza", 0],
    ["#c9853a", "Ocre", 0],
    ["#e8e4dc", "Branco", 60],
    ["#1a1a2a", "Negro", 60],
    ["#2ab0b0", "Turquesa", 80],
    ["#c94a8a", "Magenta", 80],
    ["#d4a020", "Dourado", 120],
  ],
  eyes: [
    ["#222222", "Escuros", 0],
    ["#3a6ab0", "Azuis", 0],
    ["#3a8a4a", "Verdes", 0],
    ["#8a5a2a", "Castanhos", 0],
    ["#c9a020", "Dourados mágicos", 80],
    ["#c94a8a", "Rosados mágicos", 80],
    ["#9a4aff", "Violeta mágicos", 80],
  ],
  acc: [
    ["nenhum", "Nenhum", 0],
    ["laco", "Laço no cabelo", 0],
    ["pena", "Pena no cabelo", 0],
    ["bolsa", "Bolsa a tiracolo", 0],
    ["cinto", "Cinto de fivela", 0],
    ["pulseiras", "Pulseiras", 20],
    ["medalha", "Medalha", 40],
    ["oculos", "Óculos redondos", 50],
    ["brincos", "Brincos de ouro", 60],
    ["cachecol", "Cachecol", 40],
    ["colar", "Colar de cristal", 90],
    ["tapaolho", "Tapa-olho", 70],
  ],
  staffc: [
    ["#ffe066", "Cristal âmbar", 0],
    ["#5fd0ff", "Cristal safira", 0],
    ["#ff7a3d", "Cristal rubi", 0],
    ["#7ad36b", "Cristal esmeralda", 0],
    ["#c77dff", "Cristal ametista", 60],
    ["#ffffff", "Cristal diamante", 120],
  ],
  aura: [
    ["nenhuma", "Nenhuma", 0],
    ["brilho", "Brilho dourado", 150],
    ["folhas", "Folhas ao vento", 150],
    ["coracoes", "Corações", 180],
    ["chamas", "Chamas", 200],
    ["gelo", "Cristais de gelo", 200],
    ["estrelas", "Poeira estelar", 250],
  ],
  hatc: [
    ["#2a2f6e", "", 0],
    ["#5a2a2a", "", 0],
    ["#2a4a2a", "", 0],
    ["#3a2a5a", "", 0],
    ["#1a1a1a", "", 0],
    ["#8a6a3a", "", 0],
  ],
};
const COS_NAMES = {
  hstyle: "Penteado",
  hair: "Cor do cabelo",
  hat: "Chapéu",
  outfit: "Roupa",
  robe: "Cor da roupa",
  eyes: "Cor dos olhos",
  acc: "Acessório",
  staffc: "Cristal do cajado",
  aura: "Aura mágica",
};
const COS_SHOPS = {
  roupa: {
    nome: "Alfaiataria Fio de Prata",
    sub: "Roupas, chapéus e tinturas",
    cats: ["outfit", "robe", "hat", "acc"],
  },
  cabelo: {
    nome: "Salão Tesoura de Ouro",
    sub: "Cortes, cores e lentes mágicas",
    cats: ["hstyle", "hair", "eyes", "acc"],
  },
  moda: {
    nome: "Moda Brisamar",
    sub: "Novidades que chegaram de navio",
    cats: ["outfit", "hat", "robe", "hair", "acc", "aura", "staffc"],
  },
};
function cosOwned(cat, id) {
  const e = COSMETICS[cat].find((o) => o[0] === id);
  return !e || e[2] === 0 || (player.owned[cat] || []).includes(id);
}
function drawPreview(cv, L, dir) {
  const c2 = cv.getContext("2d");
  c2.clearRect(0, 0, cv.width, cv.height);
  c2.fillStyle = "rgba(122,98,184,.15)";
  c2.beginPath();
  c2.ellipse(cv.width / 2, cv.height - 10, cv.width / 3, 8, 0, 0, 7);
  c2.fill();
  const u = Math.floor(cv.width / 18);
  const ox = (cv.width - 16 * u) / 2,
    oy = cv.height - 16 * u - 8;
  for (const [x, y, w, h, col] of heroRects(L, dir || "down", lifeMode() ? null : L.staffc || "#ff7a3d")) {
    c2.fillStyle = col;
    c2.fillRect(ox + (dir === "left" ? 16 - x - w : x) * u, oy + y * u, w * u, h * u);
  }
}
function showCreate(mode) {
  game.mode = "create";
  game.lookMode = mode;
  game.lookDraft = JSON.parse(JSON.stringify(player.look));
  game.draftName = player.name;
  game.draftGender = player.gender;
  game.draftTraits = (player.traits || []).slice();
  game.draftOrient = player.orient || "bi";
  game.prevDir = "down";
  byId("title").style.display = "none";
  renderCreate();
  byId("create").style.display = "flex";
}
function renderCreate() {
  const L = game.lookDraft,
    mode = game.lookMode;
  L.eyes = L.eyes || "#222222";
  L.acc = L.acc || "nenhum";
  L.staffc = L.staffc || "#ffe066";
  L.aura = L.aura || "nenhuma";
  const avail = (cat) => COSMETICS[cat].filter((o) => (mode === "new" ? o[2] === 0 : cosOwned(cat, o[0])));
  const sw = (cat) =>
    avail(cat)
      .map(
        (o) =>
          `<button class="swb ${L[cat] === o[0] ? "on" : ""}" data-sw="${cat}:${o[0]}" style="background:${o[0]}" title="${o[1]}"></button>`,
      )
      .join("");
  const cyc = (cat) => {
    const a = avail(cat),
      i = a.findIndex((o) => o[0] === L[cat]);
    return `<button data-cy="${cat}:-1">◀</button><b>${(a[i] || a[0])[1]}</b><button data-cy="${cat}:1">▶</button>`;
  };
  let h = `<h2>${mode === "new" ? "Crie seu mago" : "Guarda-roupa"}</h2><div class="crow"><div class="pv"><canvas id="pvc" width="180" height="180"></canvas><div class="pvb"><button data-rot="1">↻ Girar</button></div></div><div class="cform">`;
  if (mode === "new")
    h += `<label class="opt"><span>Nome</span><input id="cname" maxlength="12" value="${game.draftName.replace(/"/g, "")}" autocomplete="off"></label>
    <div class="opt"><span>Dificuldade</span><div class="seg">${Object.entries(DIFFICULTIES)
      .map(
        ([k, d]) =>
          `<button data-dif="${k}" class="${(game.draftDiff || "normal") === k ? "on" : ""}" title="${d.desc}">${d.n}</button>`,
      )
      .join(
        "",
      )}</div></div><div class="opt"><span></span><div class="qtip" style="margin:0">${DIFFICULTIES[game.draftDiff || "normal"].desc}</div></div>
    <div class="opt"><span>Gênero</span><div class="seg">${[
      ["m", "Masculino"],
      ["f", "Feminino"],
      ["n", "Prefiro não dizer"],
    ]
      .map(([k, n]) => `<button data-gen="${k}" class="${game.draftGender === k ? "on" : ""}">${n}</button>`)
      .join("")}</div></div>
    <div class="opt"><span>Pele</span><div class="sws">${sw("skin")}</div></div>`;
  h += `<div class="opt"><span>Penteado</span><div class="cy">${cyc("hstyle")}</div></div>
    <div class="opt"><span>Cabelo</span><div class="sws">${sw("hair")}</div></div>
    <div class="opt"><span>Chapéu</span><div class="cy">${cyc("hat")}</div></div>
    ${["mago", "boina", "abas"].includes(L.hat) ? `<div class="opt"><span>Cor do chapéu</span><div class="sws">${sw("hatc")}</div></div>` : ""}
    <div class="opt"><span>Roupa</span><div class="cy">${cyc("outfit")}</div></div>
    <div class="opt"><span>Cor da roupa</span><div class="sws">${sw("robe")}</div></div>
    <div class="opt"><span>Olhos</span><div class="sws">${sw("eyes")}</div></div>
    <div class="opt"><span>Acessório</span><div class="cy">${cyc("acc")}</div></div>
    <div class="opt"><span>Cristal do cajado</span><div class="sws">${sw("staffc")}</div></div>
    ${avail("aura").length > 1 || mode !== "new" ? `<div class="opt"><span>Aura</span><div class="cy">${cyc("aura")}</div></div>` : ""}`;
  if (mode !== "new")
    h +=
      '<div class="qtip">Mais roupas e cabelos: Alfaiataria e Salão em Cinzaluz, e Moda Brisamar no porto.</div>';
  h += `</div></div><div class="cbtns"><button id="crand"> Aleatório</button><button id="cgo">${mode === "new" ? "Começar aventura ▶" : "Salvar visual"}</button>${mode === "new" ? "" : '<button id="ccancel">Cancelar</button>'}</div>`;
  const el = byId("create");
  el.innerHTML = h;
  drawPreview(byId("pvc"), L, game.prevDir);
  const ni = byId("cname");
  if (ni)
    ni.oninput = () => {
      game.draftName = ni.value;
    };
  el.querySelectorAll("[data-sw]").forEach(
    (b) =>
      (b.onclick = () => {
        const [c, v] = b.dataset.sw.split(":");
        L[c] = v;
        renderCreate();
      }),
  );
  el.querySelectorAll("[data-cy]").forEach(
    (b) =>
      (b.onclick = () => {
        const [c, d] = b.dataset.cy.split(":");
        const a = avail(c);
        let i = a.findIndex((o) => o[0] === L[c]);
        i = (i + +d + a.length) % a.length;
        L[c] = a[i][0];
        renderCreate();
      }),
  );
  el.querySelectorAll("[data-gen]").forEach(
    (b) =>
      (b.onclick = () => {
        game.draftGender = b.dataset.gen;
        renderCreate();
      }),
  );
  el.querySelectorAll("[data-dif]").forEach(
    (b) =>
      (b.onclick = () => {
        game.draftDiff = b.dataset.dif;
        renderCreate();
      }),
  );
  el.querySelector("[data-rot]").onclick = () => {
    game.prevDir = {
      down: "right",
      right: "up",
      up: "left",
      left: "down",
    }[game.prevDir];
    drawPreview(byId("pvc"), L, game.prevDir);
  };
  byId("crand").onclick = () => {
    for (const c of ["hstyle", "hair", "hat", "outfit", "robe", "hatc", "eyes", "acc", "staffc"].concat(
      mode === "new" ? ["skin"] : [],
    )) {
      const a = avail(c);
      L[c] = a[Math.floor(Math.random() * a.length)][0];
    }
    renderCreate();
  };
  if (byId("ccancel"))
    byId("ccancel").onclick = () => {
      byId("create").style.display = "none";
      game.mode = "world";
    };
  byId("cgo").onclick = () => {
    player.look = JSON.parse(JSON.stringify(L));
    if (mode === "new") {
      player.name = (game.draftName || "").trim().slice(0, 12) || "Aprendiz";
      player.gender = game.draftGender;
      player.diff = game.draftDiff || "normal";
      byId("create").style.display = "none";
      playSound(784, 0.15, "sine");
      if (lifeMode()) startLifeMode();
      else showStory();
    } else {
      byId("create").style.display = "none";
      game.mode = "world";
      saveGame();
      playSound(784, 0.12, "sine");
      toast("Visual salvo!");
    }
  };
}
function openCosmetic(kind) {
  game.keeperLine = null;
  game.mode = "shop";
  game.shopId = "__cos";
  game.cosKind = kind;
  game.cosIdx = 0;
  game.cosCat = null;
  renderCosmetic();
  byId("shop").style.display = "block";
  playSound(440, 0.1, "sine");
}
/* ===================== REPUTAÇÃO ===================== */

function repAdd(n) {
  player.rep = Math.max(0, Math.min(100, (player.rep ?? 50) + n));
}
function repLabel() {
  const r = player.rep ?? 50;
  return r < 20
    ? "Mal falad" + genderWord("o", "a", "e")
    : r < 40
      ? "Duvidos" + genderWord("o", "a", "e")
      : r < 60
        ? "Comum"
        : r < 80
          ? "Respeitad" + genderWord("o", "a", "e")
          : genderWord("Herói amado", "Heroína amada", "Heroíne amade");
}

/* ===================== MASCOTES ===================== */

const PET_T = {
  cao: {
    n: "Cachorro",
    ic: "",
    b: "Fareja tesouros depois das batalhas e morde inimigos.",
  },
  gato: {
    n: "Gato",
    ic: "",
    b: "Recupera +3 MP por turno nas batalhas.",
  },
  coruja: {
    n: "Coruja",
    ic: "",
    b: "+10% de XP e às vezes cega o inimigo.",
  },
  coelho: {
    n: "Coelho",
    ic: "",
    b: "Sorte: +15% de ouro nas batalhas.",
  },
};
const PET_NAMES = {
  cao: ["Rex", "Bolinha", "Thor", "Pipoca", "Luna", "Pingo"],
  gato: ["Mimi", "Frajola", "Nina", "Salem", "Tom", "Pantufa"],
  coruja: ["Sábia", "Pena", "Noturna", "Estrela", "Hoot"],
  coelho: ["Floquinho", "Algodão", "Pompom", "Cenourinha"],
};
const PET_COLS = {
  cao: ["#d9a441", "#3a2a1a", "#e8e4dc", "#8a6a4a"],
  gato: ["#e8902a", "#2a2a2a", "#e8e4dc", "#8a8a8a"],
  coruja: ["#8a6a4a", "#d9d0c0"],
  coelho: ["#f2eee4", "#8a6a4a", "#5a5a5a"],
};
function activePet() {
  return player.petA != null && player.pets && player.pets[player.petA] ? player.pets[player.petA] : null;
}
function petOk() {
  const p = activePet();
  return p && p.love >= 25;
}
function petShelter() {
  player.pets = player.pets || [];
  const opts = Object.entries(PET_T).map(([k, v]) => ({
    t: `Adotar ${v.ic} ${v.n} (doação de 30 ouro)`,
    fn: () => adoptPet(k),
  }));
  if (player.pets.length)
    opts.push({
      t: "Ver meus mascotes",
      fn: () => petList(),
    });
  opts.push({
    t: "Sair",
    fn: null,
  });
  choice(
    "Abrigo dos Bichos",
    'Cuidadora Lila: "Todos esses bichinhos precisam de um lar! Cada um tem um jeitinho e te ajuda de um modo diferente."<br>' +
      Object.values(PET_T)
        .map((v) => `${v.ic} <b>${v.n}</b>: ${v.b}`)
        .join("<br>") +
      `<br>Mascotes: ${player.pets.length}/3`,
    opts,
  );
}
function adoptPet(k) {
  if (player.pets.length >= 3) {
    say([["Cuidadora Lila", "Três bichinhos já dão bastante trabalho! Cuide bem deles."]]);
    return;
  }
  if (player.gold < 30) {
    say([["Cuidadora Lila", "A doação é de 30 de ouro. Ela ajuda a alimentar os outros bichinhos."]]);
    return;
  }
  const names = PET_NAMES[k]
      .slice()
      .sort(() => Math.random() - 0.5)
      .slice(0, 3),
    cols = PET_COLS[k],
    col = cols[Math.floor(Math.random() * cols.length)];
  choice(
    `Que nome dar ao seu ${PET_T[k].n.toLowerCase()}?`,
    "Escolha um nome:",
    names
      .map((nm) => ({
        t: nm,
        fn: () => {
          player.gold -= 30;
          player.pets.push({
            t: k,
            name: nm,
            col,
            love: 45,
            day: player.day,
          });
          if (player.petA == null) player.petA = player.pets.length - 1;
          repAdd(2);
          game.petPos = null;
          saveGame();
          playSound(880, 0.15, "sine");
          say([
            ["Cuidadora Lila", `${nm} vai ser muito feliz com você!`],
            [
              "",
              `Você adotou ${nm}! ${player.petA === player.pets.length - 1 ? "Agora " + nm + " te segue pela aventura." : nm + " foi morar na sua casa."} Faça carinho todo dia e dê ração para aumentar o carinho.`,
            ],
          ]);
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
function petList() {
  choice(
    "Seus mascotes",
    "Quem te acompanha nas aventuras?",
    player.pets
      .map((p, i) => ({
        t: `${PET_T[p.t].ic} ${p.name} · carinho ${p.love}/100 ${player.petA === i ? "(com você)" : "(em casa)"}`,
        fn: () => {
          player.petA = i;
          game.petPos = null;
          saveGame();
          toast(p.name + " agora te acompanha!");
        },
      }))
      .concat([
        {
          t: "Deixar todos em casa",
          fn: () => {
            player.petA = null;
            saveGame();
          },
        },
        {
          t: "Voltar",
          fn: null,
        },
      ]),
  );
}
function petMenu(i) {
  const p = player.pets[i];
  if (!p) return;
  const k = "pet" + i;
  const opts = [
    {
      t: "Fazer carinho ♥",
      fn: () => {
        if (player.famDay[k + "c"] !== player.day) {
          player.famDay[k + "c"] = player.day;
          p.love = Math.min(100, p.love + 8);
        }
        game.bubbles.push({
          x: game.petPos ? game.petPos.x : player.x,
          y: game.petPos ? game.petPos.y : player.y,
          icon: "heart",
          t: 2.4,
        });
        playSound(988, 0.08, "sine");
        toast(`${p.name} adorou o carinho!`);
        saveGame();
      },
    },
  ];
  if (itemCount("racao"))
    opts.push({
      t: "Dar ração",
      fn: () => {
        removeItem("racao");
        p.love = Math.min(100, p.love + 12);
        toast(`${p.name} comeu tudo! Carinho +12`);
        saveGame();
      },
    });
  if (itemCount("petisco"))
    opts.push({
      t: "Dar petisco especial",
      fn: () => {
        removeItem("petisco");
        p.love = Math.min(100, p.love + 22);
        toast(`${p.name} ficou radiante! Carinho +22`);
        saveGame();
      },
    });
  if (itemCount("brinquedo"))
    opts.push({
      t: "Brincar com o Boneco de Pano",
      fn: () => {
        if (player.famDay[k + "b"] === player.day) {
          toast(p.name + " já brincou bastante hoje.");
          return;
        }
        player.famDay[k + "b"] = player.day;
        p.love = Math.min(100, p.love + 10);
        player.mp = Math.min(maxMp(), player.mp + 10);
        toast(`Vocês brincam juntos! Carinho +10 e +10 MP.`);
        saveGame();
      },
    });
  opts.push({
    t: player.petA === i ? "Deixar em casa" : "Levar comigo",
    fn: () => {
      player.petA = player.petA === i ? null : i;
      game.petPos = null;
      saveGame();
    },
  });
  opts.push(
    {
      t: "Trocar de mascote",
      fn: petList,
    },
    {
      t: "Sair",
      fn: null,
    },
  );
  choice(
    `${PET_T[p.t].ic} ${p.name}`,
    `${PET_T[p.t].n} · Carinho: ${"♥".repeat(Math.ceil(p.love / 20))}${"♡".repeat(5 - Math.ceil(p.love / 20))} (${p.love}/100)<br>${p.love >= 25 ? "Bônus ativo: " + PET_T[p.t].b : "Está triste... faça carinho para reativar o bônus."}`,
    opts,
  );
}
const HOME_PET_SPOTS = [
  [8, 7],
  [3, 6],
  [11, 4],
];
function homePetAt(x, y) {
  let k = 0;
  for (let i = 0; i < (player.pets || []).length; i++) {
    if (i === player.petA) continue;
    const s2 = HOME_PET_SPOTS[k++];
    if (s2 && s2[0] === x && s2[1] === y) return i;
  }
  return null;
}
function drawPet(p, X, Y, flip, t, moving) {
  const c = p.col,
    hop = moving ? Math.abs(Math.sin(t * 12)) * -3 : 0;
  Y += hop;
  ctx.fillStyle = "rgba(0,0,0,.22)";
  ctx.fillRect(X + 2, Y + 14 - hop, 14, 3);
  const r = (a, b, w, h, col) => {
    ctx.fillStyle = col || c;
    ctx.fillRect(flip ? X + 18 - a - w : X + a, Y + b, w, h);
  };
  if (p.t === "cao") {
    r(2, 4, 13, 8);
    r(12, 0, 7, 7);
    r(13, -1, 2, 3, shade(c, -0.3));
    r(-1, 3, 3, 2);
    r(3, 12, 2, 3);
    r(11, 12, 2, 3);
    r(17, 2, 1, 1, "#111");
  } else if (p.t === "gato") {
    r(2, 5, 12, 7);
    r(11, 0, 7, 7);
    r(11, -2, 2, 2);
    r(16, -2, 2, 2);
    r(0, 1, 2, 6);
    r(3, 12, 2, 3);
    r(10, 12, 2, 3);
    r(15, 2, 1, 1, "#2a8a2a");
  } else if (p.t === "coelho") {
    r(3, 5, 11, 8);
    r(11, 2, 6, 6);
    r(12, -4, 2, 7);
    r(15, -4, 2, 7);
    r(2, 6, 2, 2, "#fff");
    r(15, 4, 1, 1, "#c94a6a");
  } else {
    const fy = Math.sin(t * 5) * 2 - 8;
    Y += fy;
    r(4, 2, 10, 11);
    r(5, 0, 8, 4);
    r(2, 5, 3, 6, shade(c, -0.2));
    r(13, 5, 3, 6, shade(c, -0.2));
    ctx.fillStyle = "#ffe066";
    ctx.fillRect(X + 6, Y + 3, 2, 2);
    ctx.fillRect(X + 10, Y + 3, 2, 2);
    ctx.fillStyle = "#d9a441";
    ctx.fillRect(X + 8, Y + 6, 2, 2);
  }
}

/* ===================== TRAIÇÃO E FAMÍLIAS SECRETAS ===================== */

/* ---- Relacionamento aberto ----
 * Com o acordo do par (cônjuge ou namoro), os outros namoros deixam de ser
 * traição: ninguém flagra, a vila não fofoca e a fama não cai.
 */
function openRelationship() {
  const main = player.spouse || player.dating;
  return !!main && player.openRel === main;
}
/** Quem topa abrir a relação, conforme a personalidade. */
const OPEN_REL_CHANCE = {
  aventureiro: 0.85,
  engracado: 0.7,
  esperto: 0.6,
  gentil: 0.45,
  sabio: 0.5,
  timido: 0.25,
  serio: 0.2,
  orgulhoso: 0.15,
};
function proposeOpenRelationship(id) {
  const n = NPCS[id].nome.split(",")[0];
  if (player.famDay["openAsk" + id] === player.day)
    return say([[n, "A gente já conversou sobre isso hoje. Me dá um tempo pra pensar."]]);
  player.famDay["openAsk" + id] = player.day;
  if (friendship(id) < 70)
    return say([[n, "Abrir a relação? A gente nem se entende direito ainda... (amizade 70+)"]]);
  const chance = OPEN_REL_CHANCE[PERSONALITIES[id]] ?? 0.4;
  if (Math.random() < chance) {
    player.openRel = id;
    player.lovers = player.lovers || [];
    addFriendship(id, 2);
    saveGame();
    return say([
      [n, "*pensa um pouco* Sabe... confiança é isso. Tudo bem. Mas a gente continua sendo prioridade um do outro, combinado?"],
      ["", "Agora vocês têm um relacionamento aberto. Outros namoros não contam como traição e a vila não vai fofocar."],
    ]);
  }
  addFriendship(id, -8);
  saveGame();
  say([[n, "*fica em silêncio* ...Não. Eu quero você só pra mim. Não pergunta isso de novo tão cedo."]]);
}
function closeOpenRelationship(id) {
  const n = NPCS[id].nome.split(",")[0];
  player.openRel = null;
  addFriendship(id, 3);
  saveGame();
  say([
    [n, "Só nós dois de novo? *sorri* Eu gosto da ideia."],
    ["", "O relacionamento voltou a ser fechado. Namoros com outras pessoas agora são segredo de novo."],
  ]);
}
function openRelationshipItems(id) {
  if (player.spouse !== id && player.dating !== id) return [];
  if (openRelationship())
    return [{ t: "Fechar o relacionamento", fn: () => closeOpenRelationship(id) }];
  return [{ t: "Propor relacionamento aberto", fn: () => proposeOpenRelationship(id) }];
}

function secretCount() {
  return (player.lovers || []).length + (player.sspouses || []).length;
}
function isPartner(id) {
  return (
    player.spouse === id ||
    player.dating === id ||
    (player.lovers || []).includes(id) ||
    (player.sspouses || []).includes(id)
  );
}
function npcSpot(id) {
  const z = ZONES[player.zone];
  if (!z || !z.npcList) return null;
  if (game.roam) {
    const r = game.roam.find((q) => q.id === id);
    if (r) return [r.x, r.y];
  }
  const e = z.npcList.find((q) => q[2] === id);
  return e ? [e[0], e[1]] : null;
}
function witnessCheck(culprit) {
  if (openRelationship()) return;
  const off = player.spouse || player.dating;
  if (!off || off === culprit) return;
  if (off === player.spouse && player.zone === "casa") return discover(culprit, true);
  const sp = npcSpot(off);
  if (sp && Math.abs(sp[0] - player.x) + Math.abs(sp[1] - player.y) <= 7 && Math.random() < 0.5)
    discover(culprit, true);
}
function discover(culprit, caught) {
  if (openRelationship()) return;
  const secrets = [...(player.lovers || []), ...(player.sspouses || [])];
  if (!secrets.length) return;
  culprit = culprit || secrets[Math.floor(Math.random() * secrets.length)];
  let victim = player.spouse || player.dating;
  if (!victim) {
    victim = secrets.find((x) => x !== culprit);
    if (!victim) return;
  }
  const vn = NPCS[victim].nome.split(",")[0],
    cn = NPCS[culprit].nome.split(",")[0];
  repAdd(-25);
  player.cheatDay = player.day;
  player.cheatV = victim;
  player.cheatC = culprit;
  player.cheatCount = (player.cheatCount || 0) + 1;
  Object.keys(FRIENDS).forEach((k) => {
    if (k !== victim) player.rel[k] = Math.max(0, friendship(k) - 3);
  });
  const end = () => {
    if (player.spouse === victim) {
      player.spouse = null;
      player.divorced = player.day;
    }
    if (player.dating === victim) player.dating = null;
    player.lovers = (player.lovers || []).filter((x) => x !== victim);
    player.sspouses = (player.sspouses || []).filter((x) => x !== victim);
    player.rel[victim] = Math.max(0, friendship(victim) - 50);
  };
  const culpritReact = () => {
    if (Math.random() < 0.5) {
      player.lovers = player.lovers.filter((x) => x !== culprit);
      player.sspouses = player.sspouses.filter((x) => x !== culprit);
      player.rel[culprit] = Math.max(0, friendship(culprit) - 30);
      return `${cn} também ficou sabendo de tudo e terminou com você.`;
    }
    return `${cn} decidiu continuar com você... por enquanto.`;
  };
  playSound(150, 0.5, "sawtooth");
  game.shake = 0.3;
  say(
    [
      [
        "",
        caught
          ? `${vn} viu você com ${cn}!`
          : `A fofoca chegou aos ouvidos de ${vn}: você está com ${cn} escondido!`,
      ],
      [
        vn,
        [
          "Como você pôde fazer isso comigo?!",
          "Eu confiei em você! E você me traiu com " + cn + "?!",
          "Todo mundo na vila sabia, menos eu! Que vergonha!",
        ][Math.floor(Math.random() * 3)],
      ],
    ],
    () => {
      choice("Você foi descoberto(a)!", `${vn} está furioso(a). A notícia já se espalhou pela vila.`, [
        {
          t: "Pedir perdão de joelhos",
          fn: () => {
            const ok = Math.random() < 0.25 + friendship(victim) / 300;
            let msg;
            if (ok) {
              player.rel[victim] = Math.max(0, friendship(victim) - 35);
              msg = `${vn}: "...Vou te dar uma última chance. Uma só."`;
            } else {
              end();
              msg =
                `${vn}: "Não quero mais te ver. Acabou!"` +
                (player.divorced === player.day
                  ? " (Vocês se divorciaram. Os filhos continuam morando com você.)"
                  : "");
            }
            const cr = culpritReact();
            saveGame();
            say([
              ["", msg],
              ["", cr],
              ["", "Sua reputação despencou. Agora a vila inteira fala de você."],
            ]);
          },
        },
        {
          t: "Assumir e terminar",
          fn: () => {
            end();
            const cr = culpritReact();
            saveGame();
            say([
              [vn, "Então é assim. Adeus."],
              ["", cr],
              ["", "Sua reputação despencou. A vila inteira está comentando."],
            ]);
          },
        },
      ]);
    },
  );
}
function dailyCheat() {
  if (openRelationship()) return;
  const sc = secretCount();
  if (!sc) return;
  if (!(player.spouse || player.dating) && sc < 2) return;
  let risk = 0.07 * (player.lovers || []).length + 0.12 * (player.sspouses || []).length;
  if ((player.rep ?? 50) < 30) risk += 0.05;
  if (Math.random() < risk)
    setTimeout(() => {
      if (game.mode === "world" && !game.dialog) discover(null, false);
    }, 2500);
}

/* ===================== FOFOCAS ===================== */

function gossipLines() {
  const N = player.name,
    o = genderWord("o", "a", "o"),
    L = [],
    nm = (id) => NPCS[id].nome.split(",")[0];
  if (player.cheatDay && player.day - player.cheatDay < 8)
    L.push(
      `Ficou sabendo? ${N} foi peg${o} traindo ${nm(player.cheatV)} com ${nm(player.cheatC)}! Que escândalo!`,
      `Depois do que ${N} fez com ${nm(player.cheatV)}... eu não confiaria nessa pessoa nem para segurar um balde.`,
      `Coitad${player.cheatV && ["rosa", "curandeira", "iara", "marina"].includes(player.cheatV) ? "a" : "o"} d${["rosa", "curandeira", "iara", "marina"].includes(player.cheatV) ? "a" : "o"} ${nm(player.cheatV)}... ${N} partiu o coração dessa pessoa.`,
    );
  if ((player.lovers || []).length && Math.random() < 0.5) {
    const l = player.lovers[Math.floor(Math.random() * player.lovers.length)];
    L.push(
      `Vi ${N} cochichando com ${nm(l)} atrás da taverna... estranho, né?`,
      `${nm(l)} anda sorrindo à toa. Será que tem a ver com ${N}?`,
    );
  }
  if ((player.sspouses || []).length)
    L.push(
      `Dizem que ${N} vive sumindo... e que tem gente esperando por ${genderWord("ele", "ela", "elu")} em outra casa.`,
    );
  if (player.drunkDay && player.day - player.drunkDay < 4)
    L.push(
      `${N} bebeu tanto na taverna que dormiu abraçad${o} num barril!`,
      `Ontem ${N} cantou desafinad${o} em cima da mesa da taverna. Que vergonha alheia!`,
    );
  if ((player.drunk || 0) >= 40) L.push(`Olha lá ${N} cambaleando... já tomou umas, hein?`);
  if (player.lastBrawl && player.day - player.lastBrawl.day < 5)
    L.push(
      player.lastBrawl.won
        ? `${N} saiu na porrada com ${player.lastBrawl.nm.split(",")[0]} e ganhou! Que violência!`
        : `${N} arrumou briga com ${player.lastBrawl.nm.split(",")[0]} e apanhou feio. Hahaha!`,
    );
  if ((player.brawlWins || 0) >= 3) L.push(`Não mexa com ${N}. Dizem que bate mais forte que o ferreiro.`);
  if ((player.rudeCount || 0) >= 3)
    L.push(
      `${N} é bem grosseir${o}. Trata todo mundo mal.`,
      `Cuidado com ${N}, ${genderWord("ele", "ela", "elu")} tem uma língua afiada!`,
    );
  if (guardiansFreed() >= 1)
    L.push(
      `${N} libertou ${guardiansFreed() > 1 ? guardiansFreed() + " Guardiões" : "um Guardião"}! Dizem que a magia está voltando por causa del${genderWord("e", "a", "u")}.`,
    );
  if ((player.ecos || []).length) L.push(`Contam que ${N} derrotou um Eco Corrompido gigante. Será verdade?`);
  if ((player.raidsWon || 0) >= 1)
    L.push(`${N} defendeu a vila dos monstros! Se não fosse ${genderWord("ele", "ela", "elu")}...`);
  if (player.spouse) L.push(`${N} e ${nm(player.spouse)} formam um casal lindo.`);
  if (player.dating && !player.spouse)
    L.push(`${N} e ${nm(player.dating)} estão namorando! Será que vai ter casamento?`);
  if (player.kids && player.kids.length)
    L.push(
      `${player.kids[0].name}, filh${player.kids[0].g === "f" ? "a" : "o"} de ${N}, é a cara de ${genderWord("ele", "ela", "elu")}!`,
    );
  if ((player.fishCaught || 0) >= 5)
    L.push(`${N} vive pescando no rio. Dizem que já pegou um Peixe Dourado!`);
  if (activePet())
    L.push(`Você viu o ${PET_T[activePet().t].n.toLowerCase()} de ${N}? ${activePet().name} é uma graça!`);
  if (player.gold >= 1500)
    L.push(
      `${N} está pod${genderWord("re de rico", "re de rica", "re de rique")}. Deve ter achado um baú lendário.`,
    );
  if (player.gold < 15) L.push(`Coitad${o} de ${N}, vive sem um tostão no bolso.`);
  if (["real", "gibao"].includes(player.look.outfit) || player.look.hat === "coroa")
    L.push(`${N} anda vestid${o} como nobreza agora. Quem pensa que é?`);
  if ((player.festWins || 0) >= 1) L.push(`${N} ganhou o concurso de fantasia do festival! Que estilo!`);
  if ((player.rep ?? 50) >= 75) L.push(`Todo mundo gosta de ${N}. Gente boa demais.`);
  if ((player.rep ?? 50) < 25)
    L.push(`${N}? Fique longe. Ninguém confia nessa pessoa.`, `Minha mãe disse para eu não falar com ${N}.`);
  if (!L.length || Math.random() < 0.2)
    L.push(
      `${N} chegou faz pouco tempo, né? Parece ser aprendiz de mago.`,
      `Dizem que ${N} conversa com as runas. Será que ouve vozes?`,
    );
  return L;
}
function hearGossip() {
  const L = gossipLines()
    .sort(() => Math.random() - 0.5)
    .slice(0, 3);
  say(
    [["Gus, o Taverneiro", "Quer saber o que falam de você por aí? Senta aí..."]]
      .concat(L.map((l) => ["Freguês", l]))
      .concat([
        ["Gus, o Taverneiro", `Resumindo: sua fama na vila é "${repLabel()}" (${player.rep ?? 50}/100).`],
      ]),
  );
}

/* ===================== BEBEDEIRA ===================== */

function drink(amount, cost, nm) {
  if (player.gold < withTax(cost)) {
    say([["Gus, o Taverneiro", "Sem ouro, sem bebida!"]]);
    return;
  }
  payWithTax(cost);
  addNeed("fun", 15);
  player.drunk = Math.min(110, (player.drunk || 0) + amount);
  player.water = Math.min(100, player.water + 15);
  playSound(330, 0.1, "triangle");
  const d = player.drunk;
  const lines =
    d < 30
      ? ["Você toma um gole. Hmm, gostoso!"]
      : d < 60
        ? ["Você começa a rir de tudo. O mundo está... balançando um pouquinho.", "*hic*"]
        : d < 100
          ? [
              "Você sobe na mesa e canta uma música que ninguém conhece!",
              "O chão está se mexendo... ou é você?",
            ]
          : ["Tudo fica escuro..."];
  say([["", `Você bebe ${nm}. ` + lines[Math.floor(Math.random() * lines.length)]]], () => {
    if (player.drunk >= 100) passOut();
  });
}
function passOut() {
  const lost = Math.min(80, Math.floor(player.gold * 0.1));
  player.gold -= lost;
  player.drunk = 0;
  player.drunkDay = player.day;
  repAdd(-4);
  if (player.clock > 6 * 60) player.day++;
  player.clock = 7 * 60;
  player.hp = Math.max(1, Math.round(maxHp() * 0.6));
  player.zone = "casa";
  player.x = 3;
  player.y = 3;
  game.fade = 1;
  enterZone(false);
  saveGame();
  say([
    ["", "..."],
    ["", "Você acorda na sua cama com uma dor de cabeça terrível. Não lembra de nada da noite passada."],
    ["", `Sua bolsa está mais leve (-${lost} ouro) e a vila inteira já está comentando. Reputação -4.`],
  ]);
}

/* ===================== BRIGAS ===================== */
const NO_FIGHT = new Set(["lia", "odelia", "guarda", "guarda2", "espirito", "druida", "pescador", "monge"]);
function despised(id) {
  return !!(player.despise || {})[id];
}
function guardNear() {
  if (player.zone !== "vila") return false;
  return (
    [
      [30, 11],
      [33, 11],
    ].some(([x, y]) => Math.abs(x - player.x) + Math.abs(y - player.y) <= 12) ||
    (game.roam || []).some((r) => r.id === "tome" && Math.abs(r.x - player.x) + Math.abs(r.y - player.y) <= 8)
  );
}
/* ===================== CARINHO: ABRAÇOS, BEIJOS E GESTOS ===================== */

const AFFECTION_DURATION = 2.4;

/** Cada gesto: rótulo, ganho de amizade (uma vez por dia) e o que a pessoa responde. */
const AFFECTION_ACTIONS = {
  hug: {
    label: "Abraçar",
    rel: 3,
    lines: [
      "Ah... eu precisava disso.",
      "Que abraço apertado! Obrigado.",
      "Você é muito especial pra mim, sabia?",
    ],
  },
  kiss: {
    label: "Beijar",
    rel: 5,
    lines: [
      "*fica vermelho* ...Faz isso de novo?",
      "Você sempre me pega de surpresa.",
      "Meu coração disparou.",
    ],
  },
  highfive: {
    label: "Toca aqui!",
    rel: 2,
    lines: ["Isso aí! Toca aqui!", "Hahaha! Que energia!", "Somos uma dupla e tanto."],
  },
  dance: {
    label: "Dançar juntos",
    rel: 4,
    lines: [
      "Você dança melhor do que eu imaginava!",
      "Mais uma música? Por favor!",
      "*rindo* Pisei no seu pé, desculpa!",
    ],
  },
  lift: {
    label: "Pegar no colo",
    rel: 3,
    lines: ["Mais alto! Mais alto!", "Hihi! Me gira de novo!", "Eu tô voando!"],
  },
  tickle: {
    label: "Fazer cócegas",
    rel: 2,
    lines: ["HAHAHA! Para! Para!", "Não vale! Hahaha!", "Agora é minha vez!"],
  },
  handhold: {
    label: "Andar de mãos dadas",
    rel: 3,
    lines: ["*aperta sua mão* Não solta, tá?", "Todo mundo está olhando... e eu nem ligo.", "Sua mão é tão quentinha."],
  },
  serenade: {
    label: "Fazer uma serenata",
    rel: 4,
    lines: ["*tapa o rosto, rindo* Você desafinou... e foi perfeito.", "Ninguém nunca cantou pra mim antes.", "Canta mais uma? Só pra mim?"],
  },
  flowers: {
    label: "Entregar flores",
    rel: 4,
    lines: ["São lindas! Vou colocar na janela.", "*cheira as flores* Você lembrou que eu gosto dessas!", "Flores do nada? Você está aprontando alguma..."],
  },
  forehead: {
    label: "Beijo na testa",
    rel: 3,
    lines: ["*fecha os olhos* ...Que paz.", "Você sabe me acalmar como ninguém.", "Isso vale mais que mil poções."],
  },
  spin: {
    label: "Girar nos braços",
    rel: 3,
    lines: ["Me põe no chão! ...Não, espera, mais uma volta!", "Tô tonto de tanto rir!", "*segura forte* Você é doido! Adoro."],
  },
};

/** Gestos que só aparecem para quem você namora ou com quem é casado. */
const ROMANTIC_GESTURES = ["hug", "kiss", "dance", "handhold", "serenade", "flowers", "forehead", "spin", "highfive"];

/** Reação ao beijo conforme a personalidade de quem foi beijado. */
const KISS_REACTIONS = {
  timido: [
    "*esconde o rosto nas mãos* E-eu... nem sei o que dizer.",
    "*vermelho até as orelhas* ...Foi meu primeiro beijo de verdade.",
  ],
  orgulhoso: [
    "Hmpf. ...Tá. Foi bom. Não conta pra ninguém.",
    "*desvia o olhar, sorrindo* Você é bem atrevido, sabia?",
  ],
  engracado: [
    "Uau. Fiquei até sem piada. Isso nunca acontece!",
    "*ri nervoso* Acho que meu coração deu uma cambalhota.",
  ],
  gentil: [
    "*segura suas mãos* Você é a melhor coisa que me aconteceu.",
    "*sorri devagar* Fica mais um pouquinho comigo?",
  ],
  aventureiro: [
    "Isso foi melhor que qualquer tempestade em alto-mar!",
    "*ri e te gira* Vamos fugir pra uma aventura, só nós dois?",
  ],
  serio: [
    "*respira fundo* ...Faz de novo.",
    "Eu treino todo dia pra não perder o foco. E você acabou de me desconcentrar.",
  ],
};

/** Quais gestos fazem sentido com cada pessoa. */
function affectionOptionsFor(target) {
  if (target.kind === "kid") return ["hug", "lift", "tickle"];
  const romantic =
    target.id &&
    (player.spouse === target.id ||
      player.dating === target.id ||
      (player.lovers || []).includes(target.id) ||
      (player.sspouses || []).includes(target.id));
  if (romantic) return ROMANTIC_GESTURES;
  if (target.id && friendshipLevel(target.id) >= 2) return ["hug", "highfive"];
  if (target.id && friendshipLevel(target.id) >= 1) return ["highfive"];
  return [];
}

function affectionMenuItems(target, onBack) {
  const items = affectionOptionsFor(target).map((key) => ({
    t: AFFECTION_ACTIONS[key].label,
    fn: () => playAffection(key, target),
  }));
  if (items.length <= 4) return items;
  // Muitos gestos: ficam num submenu para não lotar a conversa.
  const name = target.id ? NPCS[target.id].nome.split(",")[0] : target.k.name;
  return [
    {
      t: "Carinhos ♥",
      fn: () => choice("Carinhos ♥", `O que você quer fazer com ${name}?`, items),
    },
    ...romanticDateItems(target.id),
  ];
}

/* ---- Encontros românticos: uma vez por dia com cada pessoa ---- */
const ROMANTIC_DATES = [
  {
    key: "picnic",
    t: "Piquenique no campo",
    cost: 12,
    rel: 6,
    ok: () => !isNight() && !["chuva", "tempestade", "neve"].includes(player.weather),
    no: "Hoje não dá: piquenique é de dia e com tempo bom.",
    fx: () => {
      player.food = 100;
      player.water = Math.min(100, player.water + 40);
    },
    text: (n) => `Vocês estendem uma toalha xadrez na grama. ${n} trouxe bolo e você trouxe a fome. Fome cheia!`,
  },
  {
    key: "dinner",
    t: "Jantar à luz de velas",
    cost: 30,
    rel: 8,
    ok: () => currentHour() >= 18 || currentHour() < 2,
    no: "Jantar à luz de velas é à noite, depois das 18h.",
    fx: () => {
      player.hp = maxHp();
      player.mp = maxMp();
    },
    text: (n) => `O Gus reserva a mesa do canto e acende duas velas. ${n} não para de sorrir. HP e MP cheios!`,
  },
  {
    key: "stars",
    t: "Ver as estrelas juntos",
    cost: 0,
    rel: 7,
    ok: () => isNight() && !["chuva", "tempestade", "neblina"].includes(player.weather),
    no: "Precisa ser à noite e com o céu limpo.",
    fx: () => {
      player.mp = maxMp();
    },
    text: (n) => `Deitados na grama, ${n} aponta uma estrela cadente. "Faz um pedido!" Vocês dois pedem a mesma coisa. MP cheio!`,
  },
  {
    key: "sunset",
    t: "Pôr do sol no farol",
    cost: 0,
    rel: 9,
    ok: () => player.zone === "porto" && currentHour() >= 16.5 && currentHour() < 19.5,
    no: "Só no Porto Brisamar, no fim da tarde (16h30 às 19h30).",
    fx: () => {
      player.blessDay = player.day;
    },
    text: (n) => `O céu fica laranja e rosa sobre o mar. ${n} encosta a cabeça no seu ombro. Vocês ficam abençoados pelo resto do dia!`,
  },
  {
    key: "letter",
    t: "Escrever uma carta de amor",
    cost: 0,
    rel: 5,
    ok: () => true,
    fx: () => {},
    text: (n) => `Você escreve três páginas, risca duas e entrega a última. ${n} lê, guarda no bolso e diz que vai ler de novo antes de dormir.`,
  },
];
function romanticDateItems(id) {
  if (!id) return [];
  const n = NPCS[id].nome.split(",")[0];
  return [
    {
      t: "Encontros ♥",
      fn: () =>
        choice(
          "Encontros ♥",
          `Um encontro por dia com ${n}. Cada um tem sua hora certa.`,
          ROMANTIC_DATES.map((d) => ({
            t: d.t + (d.cost ? ` (${withTax(d.cost)} ouro)` : ""),
            fn: () => goOnDate(id, d),
          })),
        ),
    },
  ];
}
function goOnDate(id, d) {
  const n = NPCS[id].nome.split(",")[0];
  const dayKey = "date" + id;
  if (player.famDay[dayKey] === player.day) return say([[n, "Já tivemos nosso encontro hoje. Amanhã tem mais!"]]);
  if (!d.ok()) return say([["", d.no]]);
  if (d.cost && player.gold < withTax(d.cost)) return say([["", "Você não tem ouro suficiente para esse encontro."]]);
  if (d.cost) payWithTax(d.cost);
  player.famDay[dayKey] = player.day;
  d.fx();
  addNeed("fun", 30);
  addFriendship(id, d.rel);
  player.clock = Math.min(1439, player.clock + 90);
  game.fade = 1;
  bubble(id, "heart");
  saveGame();
  say([["", d.text(n)]], () => {
    if ((player.lovers || []).includes(id) || (player.sspouses || []).includes(id)) witnessCheck(id);
  });
}

function targetLook(target) {
  if (target.kind === "kid") return { hero: true, look: target.k.look, small: true, name: target.k.name };
  const n = NPCS[target.id];
  return { robe: n.robe, hat: n.hat, hair: n.hair, name: n.nome.split(",")[0] };
}

function playAffection(key, target) {
  game.affection = { key, target, look: targetLook(target), start: game.t };
  game.mode = "affection";
  byId("tgtpill").style.display = "none";
  game.tgt = null;
  if (key === "kiss") {
    [523, 659, 784, 1047, 784].forEach((f, i) =>
      setTimeout(() => playSound(f, 0.35, "sine", 0.035), 400 + i * 220),
    );
    return;
  }
  playSound(660, 0.08, "sine");
  setTimeout(() => playSound(880, 0.1, "sine"), 300);
}

function finishAffection() {
  const a = game.affection;
  game.affection = null;
  game.mode = "world";
  const action = AFFECTION_ACTIONS[a.key];
  const dayKey = "aff" + a.key + (a.target.id || a.target.k.name);
  if (player.famDay[dayKey] !== player.day) {
    player.famDay[dayKey] = player.day;
    if (a.target.id) addFriendship(a.target.id, action.rel);
    addNeed("fun", 8);
    if (a.key === "dance") player.mp = maxMp();
  }
  saveGame();
  const personal = a.key === "kiss" && a.target.id ? KISS_REACTIONS[PERSONALITIES[a.target.id]] : null;
  const pool = personal || action.lines;
  const line = pool[Math.floor(Math.random() * pool.length)];
  say([[a.look.name, line]], () => {
    if (
      a.target.id &&
      ((player.lovers || []).includes(a.target.id) || (player.sspouses || []).includes(a.target.id))
    )
      witnessCheck(a.target.id);
  });
}

function updateAffection() {
  if (game.affection && game.t - game.affection.start >= AFFECTION_DURATION) finishAffection();
}

/** Desenha a cena do gesto: os dois se aproximam e a animação acontece. */
/** Fecha os olhos e cora as bochechas de um personagem desenhado em escala u. */
function drawKissFace(x, y, u, skin, eyesClosed, blush) {
  if (eyesClosed) {
    ctx.fillStyle = skin;
    ctx.fillRect(x + 6 * u, y + 7 * u, 4 * u, u);
    ctx.fillStyle = "#3a2414";
    ctx.fillRect(x + 6 * u, y + 7.6 * u, 1.4 * u, 0.4 * u);
    ctx.fillRect(x + 8.6 * u, y + 7.6 * u, 1.4 * u, 0.4 * u);
  }
  if (blush > 0) {
    ctx.globalAlpha = blush;
    ctx.fillStyle = "#ff7a9a";
    ctx.fillRect(x + 5.6 * u, y + 8 * u, 1.2 * u, 0.7 * u);
    ctx.fillRect(x + 9.2 * u, y + 8 * u, 1.2 * u, 0.7 * u);
    ctx.globalAlpha = 1;
  }
}

/** Cena do beijo: pôr do sol, os dois se olham, coram, fecham os olhos e se aproximam. */
function drawKissScene(a, t) {
  const p = Math.min(1, (game.t - a.start) / AFFECTION_DURATION);
  const W = viewWidth,
    cx = W / 2,
    groundY = 300,
    u = 5;
  const sky = ctx.createLinearGradient(0, 0, 0, 480);
  sky.addColorStop(0, "rgba(70,30,80,.82)");
  sky.addColorStop(0.55, "rgba(230,110,90,.55)");
  sky.addColorStop(1, "rgba(30,10,30,.85)");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, 480);
  ctx.fillStyle = "rgba(255,200,120,.55)";
  circle(cx, groundY - 30, 70);

  for (let i = 0; i < 26; i++) {
    const q = (t * 0.15 + i * 0.07) % 1;
    ctx.fillStyle = i % 2 ? "#ffb3c8" : "#ffd6e0";
    ctx.fillRect(((i * 97) % W) + Math.sin(t + i) * 20, q * 480, 4, 3);
  }

  const zoom = 1 + 0.15 * Math.sin(Math.min(1, Math.max(0, (p - 0.3) / 0.5)) * Math.PI);
  ctx.save();
  ctx.translate(cx, groundY);
  ctx.scale(zoom, zoom);
  ctx.translate(-cx, -groundY);

  ctx.fillStyle = "rgba(0,0,0,.35)";
  ctx.beginPath();
  ctx.ellipse(cx, groundY + 4, 90, 12, 0, 0, 7);
  ctx.fill();

  const approach = Math.min(1, p / 0.3);
  const leanIn = Math.min(1, Math.max(0, (p - 0.42) / 0.13));
  const stepBack = Math.min(1, Math.max(0, (p - 0.8) / 0.15));
  const gap = 140 - 90 * approach - 28 * leanIn + 26 * stepBack;
  const tilt = 0.09 * leanIn * (1 - stepBack);
  const eyesClosed = p > 0.45 && p < 0.8;
  const blush = Math.min(1, Math.max(0, (p - 0.32) / 0.1));

  const myX = cx - gap / 2 - 16 * u + 30,
    otherX = cx + gap / 2 - 30,
    topY = groundY - 16 * u;

  ctx.save();
  ctx.translate(myX + 8 * u, groundY);
  ctx.rotate(tilt);
  drawSprite(heroRects(player.look, "right", null), -8 * u, -16 * u, u);
  drawKissFace(-8 * u, -16 * u, u, player.look.skin, eyesClosed, blush);
  ctx.restore();

  ctx.save();
  ctx.translate(otherX + 8 * u, groundY);
  ctx.rotate(-tilt);
  const rise = leanIn * (1 - stepBack) * 4;
  drawSprite(wizardRects(a.look.robe, a.look.hat, a.look.hair, null, "left"), -8 * u, -16 * u - rise, u);
  drawKissFace(-8 * u, -16 * u - rise, u, npcSkin(a.look.robe, a.look.hat, a.look.hair), eyesClosed, blush);
  ctx.restore();
  ctx.restore();

  if (p > 0.5 && p < 0.8) {
    const pulse = 1 + 0.2 * Math.sin(t * 10);
    const glow = ctx.createRadialGradient(cx, topY + 40, 4, cx, topY + 40, 90 * pulse);
    glow.addColorStop(0, "rgba(255,170,200,.55)");
    glow.addColorStop(1, "rgba(255,170,200,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(cx - 120, topY - 60, 240, 220);
    drawPixelIcon("sparkle", cx, topY + 36, 2);
  }
  if (p > 0.78) {
    const q = (p - 0.78) / 0.22;
    for (let i = 0; i < 8; i++) {
      const ang = -Math.PI / 2 + (i - 3.5) * 0.3;
      ctx.globalAlpha = 1 - q;
      drawPixelIcon("heart", cx + Math.cos(ang) * q * 120, topY + 30 + Math.sin(ang) * q * 140, 3);
    }
    ctx.globalAlpha = 1;
  }
  ctx.fillStyle = "#ffe0ea";
  ctx.font = '700 18px "Pixelify Sans", sans-serif';
  ctx.textAlign = "center";
  ctx.fillText(`Um beijo para ${a.look.name}`, cx, 60);
}

function drawAffectionScene(t) {
  const a = game.affection;
  if (!a) return;
  if (a.key === "kiss" && !a.look.hero) return drawKissScene(a, t);
  const p = Math.min(1, (game.t - a.start) / AFFECTION_DURATION);
  const W = viewWidth,
    cx = W / 2,
    groundY = 300;
  ctx.fillStyle = "rgba(10,6,18,.55)";
  ctx.fillRect(0, 0, W, 480);
  const glow = ctx.createRadialGradient(cx, groundY - 60, 20, cx, groundY - 60, 220);
  glow.addColorStop(0, a.key === "kiss" || a.key === "hug" ? "rgba(255,138,168,.35)" : "rgba(242,193,78,.3)");
  glow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, 480);
  ctx.fillStyle = "rgba(0,0,0,.35)";
  ctx.beginPath();
  ctx.ellipse(cx, groundY + 4, 120, 16, 0, 0, 7);
  ctx.fill();

  const approach = Math.min(1, p / 0.35);
  const gapStart = 140;
  const gapEnd = {
    hug: 6,
    kiss: 30,
    highfive: 60,
    dance: 56,
    lift: 40,
    tickle: 40,
    handhold: 34,
    serenade: 90,
    flowers: 50,
    forehead: 24,
    spin: 20,
  }[a.key];
  let gap = gapStart + (gapEnd - gapStart) * approach;
  const u = 5;
  const smallScale = a.look.small ? 0.7 : 1;
  let myY = groundY - 16 * u,
    otherY = groundY - 16 * u * smallScale;
  let myDir = "right",
    otherDir = "left";
  const hold = p > 0.35 && p < 0.85;

  if (a.key === "dance" && hold) {
    const dirs = ["right", "down", "left", "up"];
    myDir = dirs[Math.floor(t * 3) % 4];
    otherDir = dirs[(Math.floor(t * 3) + 2) % 4];
    myY -= Math.abs(Math.sin(t * 7)) * 8;
    otherY -= Math.abs(Math.sin(t * 7 + 1)) * 8;
  }
  if (a.key === "lift" && hold) {
    otherY -= 60 * Math.sin(Math.min(1, (p - 0.35) / 0.2) * (Math.PI / 2));
    gap = 10;
  }
  if (a.key === "hug" && hold) gap -= Math.sin((p - 0.35) * 20) * 3;
  if (a.key === "spin" && hold) {
    otherY -= 40 + Math.sin(t * 9) * 6;
    otherDir = ["left", "down", "right", "up"][Math.floor(t * 8) % 4];
  }
  if (a.key === "handhold" && hold) {
    myY -= Math.abs(Math.sin(t * 6)) * 3;
    otherY -= Math.abs(Math.sin(t * 6 + 1.5)) * 3;
  }
  if (a.key === "tickle" && hold) otherY -= Math.abs(Math.sin(t * 20)) * 5;

  const myX = cx - gap / 2 - 16 * u + 30,
    otherX = cx + gap / 2 - 30;
  drawSprite(
    heroRects(player.look, myDir, null, a.key === "dance" && hold ? walkFrame(true, t) : 0),
    myX,
    myY,
    u,
  );
  ctx.save();
  if (a.look.hero) {
    ctx.translate(otherX + 8 * u, otherY + 16 * u * smallScale);
    ctx.scale(smallScale, smallScale);
    drawSprite(
      heroRects(a.look.look, otherDir, null),
      -8 * u,
      -16 * u,
      u,
      otherDir === "left" ? false : false,
    );
  } else {
    drawSprite(
      wizardRects(
        a.look.robe,
        a.look.hat,
        a.look.hair,
        null,
        otherDir,
        a.key === "dance" && hold ? walkFrame(true, t) : 0,
      ),
      otherX,
      otherY,
      u,
      false,
    );
  }
  ctx.restore();

  // braços do abraço por cima dos dois
  if (a.key === "hug" && hold) {
    ctx.fillStyle = shade(player.look.robe, -0.2);
    ctx.fillRect(cx - 18, groundY - 40, 40, 8);
    ctx.fillStyle = a.look.hero ? a.look.look.robe : shade(a.look.robe, -0.2);
    ctx.fillRect(cx - 22, groundY - 28, 40, 8);
  }
  if (a.key === "highfive" && p > 0.45 && p < 0.7) {
    ctx.fillStyle = player.look.skin;
    ctx.fillRect(cx - 14, groundY - 120, 10, 26);
    ctx.fillStyle = "#f1c8a5";
    ctx.fillRect(cx + 4, groundY - 120, 10, 26);
    drawPixelIcon("sparkle", cx, groundY - 128, 4);
  }
  if (a.key === "kiss" && p > 0.45 && p < 0.8) drawPixelIcon("heart", cx, groundY - 100 - (p - 0.45) * 60, 4);
  if (a.key === "dance" && hold)
    for (let i = 0; i < 3; i++)
      drawPixelIcon("note", cx - 80 + i * 80, groundY - 140 - Math.abs(Math.sin(t * 3 + i)) * 20, 3);
  if (a.key === "tickle" && hold) drawPixelIcon("laugh", otherX + 40, otherY - 20, 3);
  if (a.key === "handhold" && hold) {
    ctx.fillStyle = player.look.skin;
    ctx.fillRect(cx - 18, groundY - 30, 18, 7);
    ctx.fillStyle = "#f1c8a5";
    ctx.fillRect(cx, groundY - 30, 18, 7);
  }
  if (a.key === "serenade" && hold)
    for (let i = 0; i < 4; i++) {
      const q = (t * 0.8 + i / 4) % 1;
      drawPixelIcon("note", myX + 80 + q * (gap + 40), myY + 10 - q * 60 - Math.sin(q * 9) * 10, 3);
    }
  if (a.key === "flowers" && p > 0.4) drawPixelIcon("flower", cx, groundY - 70 - Math.min(1, (p - 0.4) * 4) * 10, 4);
  if (a.key === "forehead" && p > 0.45 && p < 0.85) drawPixelIcon("heart", otherX + 40, otherY - 16, 3);

  if (hold && ["hug", "kiss", "lift", "spin", "forehead", "flowers"].includes(a.key)) {
    for (let i = 0; i < 6; i++) {
      const q = (t * 0.7 + i / 6) % 1;
      ctx.globalAlpha = 1 - q;
      drawPixelIcon("heart", cx - 90 + i * 36 + Math.sin(t * 2 + i) * 10, groundY - 80 - q * 120, 2);
    }
    ctx.globalAlpha = 1;
  }
  ctx.fillStyle = "#f2c14e";
  ctx.font = '700 18px "Pixelify Sans", sans-serif';
  ctx.textAlign = "center";
  ctx.fillText(`${AFFECTION_ACTIONS[a.key].label} · ${a.look.name}`, cx, 60);
}

/* ===================== BRIGAS (ARENA) ===================== */

const FIGHTER_STRENGTH = {
  serio: 1.5,
  orgulhoso: 1.35,
  aventureiro: 1.25,
  sabio: 1.1,
  esperto: 1,
  engracado: 1,
  gentil: 0.85,
  timido: 0.75,
};
const STRONG_FIGHTERS = { kael: 1.6, ferreiro: 1.6, minerA: 1.5, tome: 1.4 };
const FEMALE_IDS = new Set([
  "rosa",
  "curandeira",
  "iara",
  "marina",
  "mercOri",
  "ancia",
  "florista",
  "cocada",
  "chazeira",
  "abrigo",
]);

/** Golpes do jogador: custo de fôlego, chance de acerto e força. */
const BRAWL_MOVES = {
  jab: { label: "Soco rápido", cost: 8, hit: 0.9, mult: 1 },
  hook: { label: "Gancho forte", cost: 20, hit: 0.7, mult: 1.9 },
  kick: { label: "Chute giratório", cost: 30, hit: 0.5, mult: 2.6 },
  dirty: { label: "Golpe baixo", cost: 15, hit: 0.75, mult: 1.2, stun: true },
  block: { label: "Bloquear (recupera fôlego)", cost: -25 },
  dodge: { label: "Esquivar", cost: 10 },
};

/** Intenções do adversário; o golpe pesado é anunciado antes. */
const FOE_INTENTS = [
  { kind: "jab", weight: 5 },
  { kind: "heavy", weight: 3 },
  { kind: "guard", weight: 2 },
];

function brawlLook(id, walker) {
  if (id && NPCS[id]) return { robe: NPCS[id].robe, hat: NPCS[id].hat, hair: NPCS[id].hair };
  if (walker) return { robe: walker.robe, hat: walker.hat, hair: walker.hair, elf: walker.elf };
  return { robe: "#7a5a3a", hair: "#3a2414" };
}

function pickFoeIntent() {
  const total = FOE_INTENTS.reduce((sum, i) => sum + i.weight, 0);
  let roll = Math.random() * total;
  for (const intent of FOE_INTENTS) if ((roll -= intent.weight) < 0) return intent.kind;
  return "jab";
}

function startBrawl(id, name, walker) {
  if (id === "odelia") {
    say([
      ["Arquimaga Odelia", "Nem pense nisso, aprendiz."],
      ["", "Com um gesto, Odelia te congela no lugar por alguns segundos. Que vergonha..."],
    ]);
    repAdd(-2);
    return;
  }
  if (id && (NO_FIGHT.has(id) || id === player.spouse)) {
    say([[name, "Não vou brigar com você."]]);
    return;
  }
  const strength = (FIGHTER_STRENGTH[id ? PERSONALITIES[id] : "gentil"] || 1) * (STRONG_FIGHTERS[id] || 1);
  const maxHpFoe = Math.round((32 + player.lvl * 6) * strength);
  game.brawl = {
    id,
    name,
    short: name.split(",")[0],
    walker,
    look: brawlLook(id, walker),
    foe: { hp: maxHpFoe, max: maxHpFoe, pow: (4 + player.lvl * 1.4) * strength, stun: 0, intent: "jab" },
    me: { stamina: 100, dodge: false, block: false, stun: 0 },
    anim: null,
    log: "",
    round: 0,
  };
  repAdd(-4);
  player.fights = (player.fights || 0) + 1;
  playSound(160, 0.3, "square");
  game.shake = 0.2;
  const taunts = ["Quer briga? Então vem!", "Você vai se arrepender disso!", "Ninguém fala assim comigo!"];
  say([[name, taunts[Math.floor(Math.random() * taunts.length)]]], () =>
    nextBrawlRound("A briga começou! Os moradores fazem uma roda em volta."),
  );
}

function playerPunchPower() {
  const outfit = player.look.outfit === "gibao" ? 1.15 : 1;
  const drunk = (player.drunk || 0) >= 40 ? 1.15 : 1;
  return (5 + player.lvl * 1.6) * outfit * drunk;
}

function nextBrawlRound(message) {
  const b = game.brawl;
  if (!b) return;
  if (b.foe.hp <= 0) return finishBrawl(true);
  if (player.hp <= 0) {
    player.hp = 1;
    return finishBrawl(false);
  }
  b.round++;
  b.foe.intent = pickFoeIntent();
  const warning =
    b.foe.intent === "heavy"
      ? `<br><b style="color:#ff8a6a">${b.short} está preparando um golpe pesado!</b>`
      : b.foe.intent === "guard"
        ? `<br><i>${b.short} se fecha na defesa.</i>`
        : "";
  b.log = message;
  const options = Object.entries(BRAWL_MOVES)
    .filter(([, move]) => move.cost <= b.me.stamina)
    .map(([key, move]) => ({
      t: move.cost > 0 ? `${move.label} · ${move.cost} fôlego` : move.label,
      fn: () => brawlAct(key),
    }));
  options.push({ t: "Fugir da briga", fn: fleeBrawl });
  choice(`Briga contra ${b.short}`, `${message}${warning}`, options);
  byId("choice").classList.add("brawl-menu");
}

function animateBrawl(who, kind) {
  game.brawl.anim = { who, kind, start: game.t };
}

/** Golpe do jogador. Retorna o texto do que aconteceu. */
function playerBrawlMove(key) {
  const b = game.brawl;
  const move = BRAWL_MOVES[key];
  b.me.stamina = Math.max(0, Math.min(100, b.me.stamina - move.cost));
  b.me.block = key === "block";
  b.me.dodge = key === "dodge";
  if (b.me.stun > 0) {
    b.me.stun--;
    return `Você está tont${genderWord("o", "a", "e")} e não consegue reagir! `;
  }
  if (key === "block") return "Você levanta a guarda e respira fundo. ";
  if (key === "dodge") return "Você fica na ponta dos pés, pronto para esquivar. ";

  animateBrawl("me", key);
  const drunkPenalty = (player.drunk || 0) > 50 ? 0.15 : 0;
  if (Math.random() >= move.hit - drunkPenalty)
    return key === "kick" ? "Você erra o chute e quase cai! " : "Você erra! ";
  const foeGuard = b.foe.intent === "guard" ? 0.4 : 1;
  const dmg = Math.round(playerPunchPower() * move.mult * foeGuard * randomBetween(0.85, 1.15));
  b.foe.hp -= dmg;
  b.foe.flash = game.t;
  b.floats = (b.floats || []).concat([{ who: "foe", txt: String(dmg), start: game.t }]);
  playSound(120, 0.12, "square");
  game.shake = key === "kick" ? 0.25 : 0.12;
  if (move.stun) {
    b.foe.stun = 1;
    repAdd(-1);
  }
  const texts = {
    jab: `Soco rápido! ${dmg} de dano. `,
    hook: `Gancho em cheio! ${dmg} de dano. `,
    kick: `CHUTE GIRATÓRIO! ${dmg} de dano! `,
    dirty: `Golpe baixo! ${dmg}, e ${b.short} fica tont${FEMALE_IDS.has(b.id) ? "a" : "o"}! `,
  };
  return texts[key] + (foeGuard < 1 ? "(Ele estava defendendo.) " : "");
}

/** Resposta do adversário. Retorna o texto. */
function foeBrawlMove() {
  const b = game.brawl;
  const foe = b.foe;
  if (foe.hp <= 0) return "";
  if (foe.stun > 0) {
    foe.stun--;
    return `${b.short} cambaleia e não ataca.`;
  }
  if (foe.intent === "guard") return `${b.short} só se defende.`;
  const heavy = foe.intent === "heavy";
  animateBrawl("foe", heavy ? "hook" : "jab");
  if (b.me.dodge && Math.random() < (heavy ? 0.75 : 0.55)) return `Você esquiva do golpe de ${b.short}!`;
  if (Math.random() > (heavy ? 0.75 : 0.85)) return `${b.short} erra o golpe!`;
  let dmg = foe.pow * (heavy ? 2 : 1) * randomBetween(0.8, 1.2);
  if (b.me.block) dmg *= heavy ? 0.25 : 0.4;
  dmg = Math.max(1, Math.round(dmg));
  player.hp -= dmg;
  b.meFlash = game.t;
  b.floats = (b.floats || []).concat([{ who: "me", txt: String(dmg), start: game.t }]);
  playSound(90, 0.12, "square");
  game.shake = heavy ? 0.3 : 0.15;
  let text = heavy
    ? `${b.short} acerta um golpe pesado: ${dmg} de dano!`
    : `${b.short} revida: ${dmg} de dano.`;
  if (b.me.block) text += " (bloqueado)";
  if (heavy && !b.me.block && Math.random() < 0.3) {
    b.me.stun = 1;
    text += ` Você fica tont${genderWord("o", "a", "e")}!`;
  }
  return text;
}

function brawlAct(key) {
  const b = game.brawl;
  if (!b) return;
  const first = playerBrawlMove(key);
  setTimeout(() => {
    if (!game.brawl) return;
    const second = foeBrawlMove();
    b.me.stamina = Math.min(100, b.me.stamina + 6);
    setTimeout(() => nextBrawlRound(first + second), 380);
  }, 420);
}

function despiseEachOther(id) {
  if (!id) return;
  player.despise = player.despise || {};
  player.despise[id] = player.day;
  player.rel[id] = 0;
}

function fleeBrawl() {
  const b = game.brawl;
  repAdd(-1);
  if (b.walker) b.walker.flee = 3;
  despiseEachOther(b.id);
  endBrawlScene();
  saveGame();
  say([
    [b.name, "Covarde! Volta aqui!"],
    ["", "Você sai correndo. Agora vocês se desprezam."],
  ]);
}

function endBrawlScene() {
  game.brawl = null;
  byId("choice").classList.remove("brawl-menu");
}

function finishBrawl(won) {
  const b = game.brawl;
  despiseEachOther(b.id);
  if (won) player.brawlWins = (player.brawlWins || 0) + 1;
  player.lastBrawl = { nm: b.name, won, day: player.day };
  player.hp = Math.max(1, player.hp);
  let fine = "";
  if (guardNear()) {
    const amount = Math.min(player.gold, 25);
    player.gold -= amount;
    repAdd(-2);
    fine = ` O Guarda Tomé aparece correndo: "Briga na vila não! Multa de ${amount} de ouro!"`;
  }
  if (b.walker) b.walker.flee = 6;
  endBrawlScene();
  saveGame();
  const fallen = FEMALE_IDS.has(b.id) ? "derrotada" : "derrotado";
  say([
    [
      "",
      won
        ? `${b.name} cai sentado no chão, ${fallen}! A roda de gente vibra.`
        : "Você leva um soco e cai de costas no chão!",
    ],
    [
      b.name,
      won
        ? "Isso não vai ficar assim... Nunca mais fale comigo!"
        : "Hah! Toma, pra aprender! E nunca mais apareça na minha frente!",
    ],
    [
      "",
      (b.id ? `Agora vocês se desprezam: ${b.short} não vai mais falar nem negociar com você.` : "") +
        ` Reputação -4.${fine}`,
    ],
  ]);
}

/** Desenha a arena: roda de moradores, os dois lutadores, barras e golpes. */
function drawBrawlScene(t) {
  const b = game.brawl;
  if (!b) return;
  const W = viewWidth;
  ctx.fillStyle = "rgba(10,6,18,.62)";
  ctx.fillRect(0, 0, W, 480);
  const cx = W / 2,
    cy = 175;
  ctx.fillStyle = "rgba(168,145,106,.9)";
  ctx.beginPath();
  ctx.ellipse(cx, cy + 40, 230, 70, 0, 0, 7);
  ctx.fill();
  ctx.strokeStyle = "rgba(0,0,0,.3)";
  ctx.lineWidth = 3;
  ctx.stroke();

  // Roda de moradores em pé sobre um anel de chão, cada um com sombra.
  ctx.fillStyle = "rgba(120,100,70,.85)";
  ctx.beginPath();
  ctx.ellipse(cx, cy + 40, 300, 112, 0, 0, 7);
  ctx.fill();
  const robes = ["#8a3a3a", "#3a6a8a", "#5a7a3a", "#8a6a2a", "#6a3a7a", "#7a7a7a"];
  for (let i = 0; i < 12; i++) {
    const a = Math.PI * (1.06 + (i / 11) * 0.88);
    const feetX = cx + Math.cos(a) * 262,
      feetY = cy + 40 + Math.sin(a) * 92;
    const hop = Math.abs(Math.sin(t * 6 + i)) * 4;
    ctx.fillStyle = "rgba(0,0,0,.3)";
    ctx.beginPath();
    ctx.ellipse(feetX, feetY, 10, 3, 0, 0, 7);
    ctx.fill();
    const look = wizardRects(
      robes[i % 6],
      i % 4 === 0 ? "#5a3a22" : null,
      ["#3a2414", "#d9a441", "#1a1a1a"][i % 3],
      null,
      "down",
    );
    drawSprite(look, feetX - 16, feetY - 31 - hop, 2);
  }

  const anim = b.anim;
  const progress = anim ? Math.min(1, (game.t - anim.start) / 0.35) : 1;
  const lunge = (who) => (anim && anim.who === who && progress < 1 ? Math.sin(progress * Math.PI) * 50 : 0);
  const myX = cx - 150 + lunge("me"),
    foeX = cx + 54 - lunge("foe"),
    fy = cy - 60;
  const flashing = (stamp) => stamp && game.t - stamp < 0.18;

  ctx.fillStyle = "rgba(0,0,0,.3)";
  ctx.beginPath();
  ctx.ellipse(myX + 48, fy + 98, 40, 9, 0, 0, 7);
  ctx.ellipse(foeX + 48, fy + 98, 40, 9, 0, 0, 7);
  ctx.fill();
  const myFrame = anim && anim.who === "me" && progress < 1 ? 1 : 0;
  drawSprite(heroRects(player.look, "right", null, myFrame), myX, fy + (flashing(b.meFlash) ? 4 : 0), 6);
  const foeRects = b.look.elf
    ? elfRects(b.look.robe, b.look.hair, "left")
    : wizardRects(
        b.look.robe,
        b.look.hat,
        b.look.hair,
        null,
        "left",
        anim && anim.who === "foe" && progress < 1 ? 1 : 0,
      );
  ctx.save();
  if (flashing(b.foe.flash)) ctx.globalAlpha = 0.5;
  drawSprite(foeRects, foeX, fy + (flashing(b.foe.flash) ? 4 : 0), 6, true);
  ctx.restore();
  if (anim && progress < 1 && progress > 0.4) {
    const hx = anim.who === "me" ? foeX + 20 : myX + 76;
    drawPixelIcon("sparkle", hx, fy + 40, 4);
  }
  if (b.foe.intent === "heavy" && !anim) {
    ctx.fillStyle = `rgba(255,120,90,${0.5 + 0.4 * Math.sin(t * 10)})`;
    ctx.font = '700 22px "Pixelify Sans", sans-serif';
    ctx.textAlign = "center";
    ctx.fillText("!", foeX + 48, fy - 8);
  }

  for (const f of b.floats || []) {
    const age = game.t - f.start;
    if (age > 1) continue;
    ctx.globalAlpha = 1 - age;
    ctx.fillStyle = f.who === "foe" ? "#ffd34d" : "#ff6b6b";
    ctx.font = '700 22px "Pixelify Sans", sans-serif';
    ctx.textAlign = "center";
    ctx.fillText(f.txt, (f.who === "foe" ? foeX : myX) + 48, fy - 10 - age * 40);
  }
  ctx.globalAlpha = 1;

  const bar = (x, y, w, value, max, color, label) => {
    ctx.fillStyle = "rgba(0,0,0,.6)";
    ctx.fillRect(x, y, w, 14);
    ctx.fillStyle = color;
    ctx.fillRect(x + 2, y + 2, Math.max(0, (w - 4) * (value / max)), 10);
    ctx.fillStyle = "#fff";
    ctx.font = '12px "VT323", monospace';
    ctx.textAlign = "left";
    ctx.fillText(label, x, y - 3);
  };
  bar(
    cx - 220,
    40,
    180,
    player.hp,
    maxHp(),
    "#e05a5a",
    `Você  ${Math.max(0, Math.round(player.hp))}/${maxHp()}`,
  );
  bar(cx - 220, 74, 180, b.me.stamina, 100, "#7fd0ff", `Fôlego ${Math.round(b.me.stamina)}`);
  bar(
    cx + 40,
    40,
    180,
    Math.max(0, b.foe.hp),
    b.foe.max,
    "#d9a441",
    `${b.short}  ${Math.max(0, b.foe.hp)}/${b.foe.max}`,
  );
}

function despiseMenu(id) {
  const nm = NPCS[id].nome.split(",")[0],
    days = player.day - player.despise[id];
  choice(
    nm,
    `${nm} te olha com desprezo e vira a cara.${days < 3 ? " <i>(Ainda é cedo para tentar fazer as pazes.)</i>" : ""}`,
    [
      {
        t: "Tentar fazer as pazes ",
        fn: () => {
          if (days < 3) {
            say([[nm, "Some da minha frente."]]);
            return;
          }
          const gifts = Object.keys(player.inv).filter(
            (i) => ITEMS[i].tipo === "gift" || i === FRIENDS[id]?.fav,
          );
          if (!gifts.length) {
            say([
              [nm, "Palavras não bastam. Se quer perdão, mostre que se importa."],
              ["", "(Leve um presente: flores, perfume, lenço ou o favorito dessa pessoa.)"],
            ]);
            return;
          }
          const g = gifts.includes(FRIENDS[id]?.fav) ? FRIENDS[id].fav : gifts[0];
          removeItem(g);
          if (Math.random() < (g === FRIENDS[id]?.fav ? 0.8 : 0.5)) {
            delete player.despise[id];
            player.rel[id] = 10;
            repAdd(2);
            saveGame();
            say([
              ["Você", `Me desculpa pela briga. Trouxe ${ITEMS[g].nome} pra você.`],
              [nm, "...Tá bom. Vamos esquecer isso. Mas fica esperto."],
              ["", "Vocês fizeram as pazes!"],
            ]);
          } else {
            saveGame();
            say([
              [nm, "Você acha que um presente apaga tudo? Não!"],
              ["", "Não funcionou. Tente de novo outro dia."],
            ]);
          }
        },
      },
      {
        t: "Provocar de novo ",
        fn: () => startBrawl(id, NPCS[id].nome),
      },
      {
        t: "Sair",
        fn: null,
      },
    ],
  );
}

/* ===================== ESCOLA ===================== */

function grade(k) {
  const s = k.study || 0;
  return k.grad
    ? "Formad" + (k.g === "f" ? "a" : "o") + " "
    : s >= 80
      ? "A"
      : s >= 55
        ? "B"
        : s >= 30
          ? "C"
          : "D";
}
function schoolMenu() {
  const kids = player.kids.filter((k) => kidAge(k) >= 2),
    notIn = kids.filter((k) => !k.school);
  const opts = [];
  notIn.forEach((k) =>
    opts.push({
      t: `Matricular ${k.name} (20 ouro)`,
      fn: () => {
        if (player.gold < 20) {
          say([["Professora Helena", "A matrícula custa 20 de ouro."]]);
          return;
        }
        player.gold -= 20;
        k.school = true;
        k.study = k.study || 0;
        repAdd(1);
        saveGame();
        say([["Professora Helena", `${k.name} vai adorar a escola! As aulas são das 8h às 14h.`]]);
      },
    }),
  );
  if (kids.some((k) => k.school))
    opts.push({
      t: "Reunião de pais ",
      fn: () => {
        if (player.famDay.reun === player.day) {
          say([["Professora Helena", "Já conversamos hoje!"]]);
          return;
        }
        player.famDay.reun = player.day;
        kids.filter((k) => k.school && !k.grad).forEach((k) => (k.study = Math.min(100, (k.study || 0) + 5)));
        repAdd(1);
        saveGame();
        say(
          [["Professora Helena", "Vamos ver as notas..."]].concat(
            kids
              .filter((k) => k.school)
              .map((k) => [
                "Professora Helena",
                `${k.name}: nota ${grade(k)}. ${k.grad ? "Já se formou! Que orgulho." : (k.study || 0) >= 55 ? "Muito dedicad" + (k.g === "f" ? "a" : "o") + "!" : "Precisa estudar mais em casa."}`,
              ]),
          ),
        );
      },
    });
  if (itemCount("livro"))
    opts.push({
      t: "Doar um Livro de Contos",
      fn: () => {
        removeItem("livro");
        repAdd(2);
        player.kids
          .filter((k) => k.school && !k.grad)
          .forEach((k) => (k.study = Math.min(100, (k.study || 0) + 3)));
        saveGame();
        say([["Professora Helena", "Que generosidade! As crianças vão amar. (Reputação +2)"]]);
      },
    });
  opts.push({
    t: "Assistir a uma aula",
    fn: () => {
      if (player.famDay.aula === player.day) {
        say([["Professora Helena", "Por hoje é só!"]]);
        return;
      }
      player.famDay.aula = player.day;
      player.xp += 10 + player.lvl;
      player.clock = Math.min(1439, player.clock + 60);
      saveGame();
      say([
        [
          "Professora Helena",
          [
            "Hoje vamos aprender as quatro runas primordiais... e as duas escondidas!",
            "Aula de história: como Cinzaluz foi fundada por Aurion.",
            "Matemática mágica: quantas combinações de runas existem?",
          ][Math.floor(Math.random() * 3)],
        ],
        ["", `Você aprende algo novo. +${10 + player.lvl} XP.`],
      ]);
    },
  });
  opts.push({
    t: "Sair",
    fn: null,
  });
  choice(
    "Escola de Cinzaluz",
    `Professora Helena: "Bem-vind${genderWord("o", "a", "e")}! Educação também é um tipo de magia."<br>${kids.length ? kids.map((k) => `${k.name}: ${k.school ? "nota " + grade(k) : "não matriculad" + (k.g === "f" ? "a" : "o")}`).join(" · ") : "Você ainda não tem filhos em idade escolar (2+ dias)."}`,
    opts,
  );
}

/* ===================== PASSEATA REAL ===================== */

/** Rota da passeata: contorna a estátua e a fonte da praça pelo lado leste. */
const PARADE_PATH = [
  [31, 12],
  [31, 14],
  [35, 14],
  [35, 22],
  [34, 22],
  [34, 26],
  [48, 26],
  [34, 26],
  [12, 26],
  [34, 26],
  [34, 22],
  [35, 22],
  [35, 14],
  [31, 14],
  [31, 12],
];
const PARADE_MEM = [
  {
    n: "Guarda Real",
    robe: "#5a5a6a",
    hat: "#3a3a44",
    hair: "#3a2414",
    ban: 1,
  },
  {
    n: "Rainha Aurélia",
    robe: "#8a2a5a",
    hat: null,
    hair: "#d9a441",
    crown: 1,
    q: 1,
  },
  {
    n: "Príncipe Leon",
    robe: "#2a4a8a",
    hat: null,
    hair: "#d9a441",
    crown: 1,
  },
  {
    n: "Princesa Aurora",
    robe: "#c94a8a",
    hat: null,
    hair: "#d9a441",
    crown: 1,
  },
  {
    n: "Guarda Real",
    robe: "#5a5a6a",
    hat: "#3a3a44",
    hair: "#1a1a1a",
  },
  {
    n: "Guarda Real",
    robe: "#5a5a6a",
    hat: "#3a3a44",
    hair: "#8a3a1a",
    ban: 1,
  },
];
function paradeDay() {
  return player.day % 5 === 3 && !festivalToday();
}
function paradeActive() {
  const h = currentHour();
  return player.zone === "vila" && paradeDay() && h >= 10 && h < 12;
}
function paradePositions() {
  const segs = [];
  let L = 0;
  for (let i = 0; i < PARADE_PATH.length - 1; i++) {
    const [a, b] = PARADE_PATH[i],
      [c, d] = PARADE_PATH[i + 1],
      l = Math.abs(c - a) + Math.abs(d - b);
    segs.push([a, b, c, d, l, L]);
    L += l;
  }
  const prog = ((currentHour() - 10) / 2) * (L + 8);
  return PARADE_MEM.map((m, i) => {
    const s2 = prog - i * 1.3;
    if (s2 < 0 || s2 > L) return null;
    for (const [a, b, c, d, l, st] of segs) {
      if (s2 <= st + l) {
        const f = (s2 - st) / l;
        return {
          m,
          x: a + (c - a) * f,
          y: b + (d - b) * f,
          dir: c > a ? "right" : c < a ? "left" : d > b ? "down" : "up",
        };
      }
    }
    return null;
  }).filter(Boolean);
}
function paradeMenu() {
  const k = "par" + player.day;
  choice(
    " Passeata da Família Real",
    "A Rainha Aurélia acena para o povo, ao lado do Príncipe Leon e da Princesa Aurora.",
    [
      {
        t: "Fazer uma reverência",
        fn: () => {
          if (player.famDay[k]) {
            say([["Rainha Aurélia", "Já nos cumprimentamos hoje. Obrigada!"]]);
            return;
          }
          player.famDay[k] = 1;
          repAdd(2);
          let msg = "Que gentileza. Cinzaluz tem bons cidadãos.";
          if ((player.rep ?? 50) >= 70 || guardiansFreed() >= 2) {
            player.gold += 60;
            msg = `Ah, ${player.name}! Ouvi falar de seus feitos. Aceite isto como agradecimento da coroa. (+60 ouro)`;
          }
          saveGame();
          say([
            ["Rainha Aurélia", msg],
            ["", "Reputação +2."],
          ]);
        },
      },
      {
        t: "Acenar para os príncipes",
        fn: () => {
          say([
            [
              "Princesa Aurora",
              "Olha, mamãe! É " + genderWord("o mago", "a maga", "e mague") + " das runas!",
            ],
            ["Príncipe Leon", "Um dia vou ser forte assim!"],
          ]);
        },
      },
      {
        t: 'Gritar "Viva a Rainha!"',
        fn: () => {
          if (!player.famDay[k + "v"]) {
            player.famDay[k + "v"] = 1;
            repAdd(1);
          }
          toast("A multidão grita junto: VIVA A RAINHA!");
          playTune();
        },
      },
      {
        t: "Sair",
        fn: null,
      },
    ],
  );
}

/* ===================== MISSÕES SECUNDÁRIAS ===================== */

const SIDEQ = [
  {
    t: "Desabamento na Mina: resgate os 3 mineiros (Mina de Cristal)",
    p: () => ((player.q && player.q.mina && player.q.mina.saved) || []).length,
    n: 3,
    r: 60,
  },
  {
    t: "A Lente Rachada: conserte e acenda o Farol de Brisamar",
    p: () => (player.q && player.q.farol && player.q.farol.st === 2 ? 1 : 0),
    n: 1,
    r: 60,
  },
  {
    t: "Fique amigo da turma de Cinzaluz",
    p: () => CREW.filter((id) => friendshipLevel(id) >= 1).length,
    n: 5,
    r: 250,
  },
  {
    t: "Liberte os 5 Guardiões",
    p: () => guardiansFreed(),
    n: 5,
    r: 400,
  },
  {
    t: "Asse 10 pães em casa",
    p: () => player.breadBaked || 0,
    n: 10,
    r: 120,
  },
  {
    t: "Quebre 30 pedras na mina",
    p: () => player.mined || 0,
    n: 30,
    r: 150,
  },
  {
    t: "Colha 30 feixes de trigo",
    p: () => player.harvested || 0,
    n: 30,
    r: 100,
  },
  {
    t: "Complete 10 turnos de trabalho",
    p: () => player.shiftsDone || 0,
    n: 10,
    r: 200,
  },
  {
    t: "Atenda 5 pedidos de moradores",
    p: () => Object.values(player.townQ || {}).filter((v) => v === "feito").length,
    n: 5,
    r: 250,
  },
  {
    t: "Liberte os 5 Ecos Corrompidos",
    p: () => (player.ecos || []).length,
    n: 5,
    r: 500,
  },
  {
    t: "Recupere as 6 runas",
    p: () => player.runes.length,
    n: 6,
    r: 300,
  },
  {
    t: "Descubra todas as magias",
    p: () => player.spells.length,
    n: () => Object.keys(SPELLS).length,
    r: 400,
  },
  {
    t: "Domine uma magia (5 estrelas)",
    p: () => Math.max(0, ...Object.keys(player.mastery || {}).map(masteryLv)),
    n: 5,
    r: 250,
  },
  {
    t: "Encontre as 5 páginas do diário",
    p: () => player.pages.length,
    n: 5,
    r: 200,
  },
  {
    t: "Visite as vilas vizinhas",
    p: () => ["porto", "serra"].filter((z) => player.visited.includes(z)).length,
    n: 2,
    r: 100,
  },
  {
    t: "Tenha 3 melhores amigos",
    p: () => Object.keys(FRIENDS).filter((id) => friendshipLevel(id) >= 3).length,
    n: 3,
    r: 250,
  },
  {
    t: "Adote 3 mascotes",
    p: () => (player.pets || []).length,
    n: 3,
    r: 150,
  },
  {
    t: "Decore a casa com 12 móveis",
    p: () => (player.furn || []).length,
    n: 12,
    r: 200,
  },
  {
    t: "Defenda a vila de 3 ataques",
    p: () => player.raidsWon || 0,
    n: 3,
    r: 300,
  },
  {
    t: "Vença 2 concursos de fantasia",
    p: () => player.festWins || 0,
    n: 2,
    r: 200,
  },
  {
    t: "Tenha 3 filhos",
    p: () => player.kids.length,
    n: 3,
    r: 200,
  },
  {
    t: "Veja um filho se formar na escola",
    p: () => player.kids.filter((k) => k.grad).length,
    n: 1,
    r: 250,
  },
  {
    t: "Alcance reputação 90",
    p: () => player.rep ?? 50,
    n: 90,
    r: 300,
  },
  {
    t: "Pesque 15 peixes",
    p: () => player.fishCaught || 0,
    n: 15,
    r: 200,
  },
  {
    t: "Chegue ao nível 15",
    p: () => player.lvl,
    n: 15,
    r: 400,
  },
];
/** Metas que só fazem sentido no modo História (escondidas no Simulador). */
const STORY_SIDE = /Guardiões|Ecos|runas|magias|magia \(|páginas|ataques|nível/;
const sideVisible = (q) => !(lifeMode() && STORY_SIDE.test(q.t));
function sideN(q) {
  return typeof q.n === "function" ? q.n() : q.n;
}
function nextSide() {
  return SIDEQ.find((q, i) => sideVisible(q) && !(player.sideClaim || {})[i] && q.p() < sideN(q)) || null;
}
function sideHTML() {
  let h = `<h3>${iconHTML("star")}Missões secundárias</h3>`;
  SIDEQ.forEach((q, i) => {
    if (!sideVisible(q)) return;
    const v = Math.min(q.p(), sideN(q)),
      n = sideN(q),
      done = v >= n,
      cl = (player.sideClaim || {})[i];
    h += `<div class="qs ${cl ? "done" : ""}">${cl ? "✓ " : ""}${q.t} · ${v}/${n} <span style="color:var(--gold)">◆${q.r}</span>${done && !cl ? ` <button data-side="${i}">Receber</button>` : ""}<div class="jbar" style="height:.35em;background:#2b2142"><i style="width:${(100 * v) / n}%;background:var(--gold)"></i></div></div>`;
  });
  return h;
}


/* ===================== FILHOS CRESCEM ===================== */

/** Fases da vida dos filhos (em dias de jogo). */
const KID_STAGES = [
  { key: "bebe", n: "Bebê", from: 0 },
  { key: "crianca", n: "Criança", from: 2 },
  { key: "teen", n: "Adolescente", from: 10 },
  { key: "adulto", n: "Adulto", from: 16 },
];
function kidStage(k) {
  const age = kidAge(k);
  return [...KID_STAGES].reverse().find((s) => age >= s.from);
}
function kidMood(k) {
  const m = k.mood ?? 60;
  return m >= 75 ? "Feliz" : m >= 45 ? "Tranquilo" : m >= 25 ? "Chateado" : "Revoltado";
}
const KID_LINES = {
  bebe: ["*balbucia*"],
  crianca: [
    "Me ensina um feitiço? Por favor, por favor!",
    "Hoje eu vi um sapo enorme perto do rio!",
    "Quando eu crescer quero ser igual a você!",
    "Você trouxe alguma coisa pra mim?",
    "Desenhei você lutando contra um dragão!",
  ],
  teen: [
    "Ai, para de me abraçar na frente dos outros!",
    "Posso ir na festa da taverna hoje? Todo mundo vai!",
    "Ninguém me entende nesta casa...",
    "Tô pensando no que quero ser: Guarda Real ou dono de tenda?",
    "*fones de ouvido imaginários* Hã? Falou comigo?",
  ],
  adulto: [
    "Lembra quando eu tinha medo do escuro? Hoje eu que conto histórias.",
    "Tô juntando ouro pra ter minha própria casa.",
    "Obrigado por tudo que você fez por mim.",
    "Trabalhei na feira hoje. Agora entendo por que você chegava cansado!",
  ],
};
const SUITOR_NAMES = ["Heitor", "Lívia", "Caetano", "Marieta", "Benício", "Celeste", "Otília", "Ramiro", "Irene", "Ezequiel", "Glória", "Tadeu"];
const SUITOR_FAMILIES = ["Ferraz", "Valente", "Monteiro", "dos Anjos", "Brisamar", "da Serra", "Albuquerque", "Pedreira"];
const pickOne = (list) => list[Math.floor(Math.random() * list.length)];

/** Roda todo dia: filhos crescem, namoram, casam e trazem netos. */
function growKids() {
  for (const k of player.kids || []) {
    const age = kidAge(k);
    if (age === 10) setTimeout(() => toast(`${k.name} virou adolescente! Prepare-se para as portas batendo.`, 4000), 2600);
    if (age === 16) setTimeout(() => toast(`${k.name} chegou à vida adulta! Agora pode namorar e casar.`, 4000), 2600);
    if (age < 16) continue;
    if (!k.spouse && !k.partner && Math.random() < 0.2) {
      k.partner = pickOne(SUITOR_NAMES);
      k.partnerDay = player.day;
      setTimeout(() => toast(`Fofoca: ${k.name} está namorando ${k.partner}!`, 4000), 3200);
    } else if (!k.spouse && k.partner && player.day - k.partnerDay >= 3 && Math.random() < 0.3) {
      marryKid(k, k.partner, 0, false);
    }
    if (k.spouse && player.day - (k.married || 0) >= 4 && Math.random() < 0.18 && (k.grandkids || 0) < 4) {
      k.grandkids = (k.grandkids || 0) + 1;
      const gb = Math.random() < 0.5;
      setTimeout(
        () => toast(`Parabéns! ${k.name} teve ${gb ? "um menino" : "uma menina"}! Você virou ${genderWord("avô", "avó", "avô/avó")} (${k.grandkids} neto(s)).`, 4500),
        3800,
      );
    }
  }
}
/** Casamento de um filho: festa, dote e o casal vai morar na própria casa. */
function marryKid(k, partner, dowry, arranged) {
  k.spouse = partner;
  k.partner = null;
  k.married = player.day;
  k.movedOut = true;
  k.school = false;
  player.gold += dowry;
  repAdd(arranged ? 3 : 2);
  saveGame();
  const msg = arranged
    ? `${k.name} e ${partner} se casaram no Templo, num casamento arranjado pelas famílias.${dowry ? ` Dote recebido: ${dowry} ouro.` : ""}`
    : `${k.name} e ${partner} se casaram no Templo! Você chorou na primeira fila.`;
  if (game.mode === "world" && !game.dialog)
    say([
      ["Padre Anselmo", `Eu declaro ${k.name} e ${partner} unidos para sempre!`],
      ["", msg + " Eles vão morar na casa deles e visitam você nos dias de festival."],
    ]);
  else toast(msg, 5000);
}
function arrangedCandidates() {
  return [0, 1, 2].map(() => {
    const fame = Math.floor(Math.random() * 3);
    return {
      name: pickOne(SUITOR_NAMES),
      family: pickOne(SUITOR_FAMILIES),
      fame: ["humilde", "respeitada", "nobre"][fame],
      dowry: [20, 60, 150][fame] + Math.floor(Math.random() * 30),
      pick: [0.75, 0.55, 0.35][fame],
    };
  });
}
/** Opções para filhos adultos: namoro e casamento arranjado. */
function adultKidItems(k) {
  if (kidStage(k).key !== "adulto" || k.spouse) return [];
  const items = [];
  if (k.partner)
    items.push(
      {
        t: `Apoiar o namoro com ${k.partner}`,
        fn: () => {
          k.mood = Math.min(100, (k.mood ?? 60) + 10);
          if (player.day - (k.partnerDay || 0) >= 1 && Math.random() < 0.35) return marryKid(k, k.partner, 0, false);
          saveGame();
          say([[k.name, `Sério? Obrigado! ${k.partner} vai adorar saber. Acho que logo vem casamento...`]]);
        },
      },
      {
        t: `Proibir o namoro com ${k.partner}`,
        fn: () => {
          k.mood = Math.max(0, (k.mood ?? 60) - 25);
          if (Math.random() < 0.5) {
            saveGame();
            return say([[k.name, "Eu sou adulto! Vou continuar namorando, sim. *bate a porta*"]]);
          }
          k.partner = null;
          saveGame();
          say([[k.name, "...Tá bom. Mas eu nunca vou esquecer isso."]]);
        },
      },
    );
  items.push({
    t: "Arranjar um casamento",
    fn: () => {
      const list = arrangedCandidates();
      choice(
        "Casamento arranjado",
        `A casamenteira da vila trouxe três pretendentes para ${k.name}. ${k.name} precisa aceitar. Humor: ${kidMood(k)}.`,
        list
          .map((c) => ({
            t: `${c.name} ${c.family} · família ${c.fame} · dote ${c.dowry} ouro`,
            fn: () => {
              let chance = c.pick + ((k.mood ?? 60) - 50) / 200;
              if (k.partner) chance -= 0.3;
              if (Math.random() < chance) {
                say([[k.name, `${c.name}? *pensa* Conversamos na festa do mês passado... Tudo bem, eu aceito.`]], () =>
                  marryKid(k, c.name + " " + c.family, c.dowry, true),
                );
              } else {
                k.mood = Math.max(0, (k.mood ?? 60) - 10);
                saveGame();
                say([
                  [k.name, k.partner ? `Eu já amo ${k.partner}! Não vou casar com quem eu nem conheço.` : "Não. Quero escolher com quem eu caso."],
                  ["", "Dica: filhos felizes aceitam mais. Converse com eles todo dia."],
                ]);
              }
            },
          }))
          .concat([{ t: "Desistir", fn: null }]),
      );
    },
  });
  return items;
}

/* ======================================================================
   (antes: 06-festivais-amizades-dialogos.js)
   ====================================================================== */

/**
 * ECOS DO ARCANO — 04-familia-e-dialogos.js
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
