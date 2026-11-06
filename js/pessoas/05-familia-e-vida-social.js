/**
 * ECOS DO ARCANO — 05-familia-e-vida-social.js
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
    ["sardas", "Sardas", 0],
    ["bigode", "Bigode", 0],
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
