/**
 * ECOS DO ARCANO — 52-mundo-vivo.js
 *  - O Eco de Cinzaluz: o jornal do dia (tecla J ou ☰ → Jornal), com manchete,
 *    notícias, política, fofocas, previsão do tempo, classificados, obituário,
 *    horóscopo das runas e a tirinha do Luca.
 *  - Sucessão: herdeiro(a) da realeza é coroado(a) quando a Rainha morre ou abdica,
 *    e um nobre rival pode contestar a coroa.
 *  - Cada reino com identidade: lema, leis que valem de verdade, prato típico e
 *    festa própria (Noite das Velas nas Marés, Festa da Forja em Pedravale).
 *  - Mascotes na Ala Real e no quintal, com carinho e brincadeira.
 *  - Estações no visual: flores na primavera, folhas laranja no outono,
 *    neve nos telhados e nas árvores no inverno.
 */

"use strict";

/* ===================== O ECO DE CINZALUZ ===================== */

function paperRand(seed) {
  let s = hashStr("jornal" + seed);
  return () => ((s = Math.imul(s ^ (s >>> 15), 2246822519) >>> 0), (s % 10000) / 10000);
}
function buildPaper() {
  const R = paperRand(player.day + (player.name || ""));
  const pick = (a) => a[Math.floor(R() * a.length)];
  const news = (player.news || []).filter((n) => player.day - n.d <= 3).map((n) => n.t);
  const head =
    news.length
      ? news[news.length - 1]
      : pick([`Pão sobe de novo e o povo reclama na fila da padaria`, `Lucas Marzocca jura que mudou. A vila não acredita`, `Rainha Aurélia promete estrada nova até o Porto`, `Galinha foge e para o trânsito de carroças na praça`, `Festival da estação promete fogos e hidromel`]);
  const w = worldState();
  const pol = KINGDOM_PAIRS.map(([a, b]) => {
    const r = w.rel[pairKey(a, b)];
    return `<li><b>${KINGDOMS[a].short} × ${KINGDOMS[b].short}</b>: ${atWar(a, b) ? "<span class='jn-red'>EM GUERRA</span>" : r >= 70 ? "aliados" : r >= 40 ? "neutros" : "tensão"}</li>`;
  }).join("");
  const rulers = Object.values(KINGDOMS)
    .map((k) => `<li>${k.n}: <b>${k.ruler}</b></li>`)
    .join("");
  const heir = player.royalBirth && !(typeof rulesK === "function" && rulesK("aurelia")) ? `<p>Herdeir${genderWord("o", "a", "e")} do trono: <b>${alteza()}</b>.</p>` : "";
  const gossip = [genLine(null, "casal"), genLine(null, "turma"), genLine(null, "lucas")];
  const wx = pick(Object.keys(WEATHER));
  const deaths = Object.entries(player.dead || {}).filter(([, d]) => player.day - d.day <= 7);
  const houses = Object.values(allHouses())
    .filter((h) => !(player.houses || []).includes(h.key) && h.key !== STARTER_HOUSE)
    .sort(() => R() - 0.5)
    .slice(0, 3);
  const profs = Object.keys(PROFESSIONS).sort(() => R() - 0.5).slice(0, 2);
  const tr = (player.traits || [])[0];
  const horo = tr
    ? `Para ${traitName(tr, player.gender === "f" ? "f" : "m").toLowerCase()}s como você: ${pick(["hoje é dia de arriscar no amor.", "cuidado com o coletor de impostos.", "uma amizade antiga vai bater na sua porta.", "evite tavernas depois da meia-noite.", "um presente inesperado está a caminho."])}`
    : pick(["As runas dizem: coma bem e não confie em gansos.", "Hoje a sorte sorri para quem acorda cedo.", "Um segredo seu corre perigo. Bico calado!"]);
  const lore = KINGDOM_LORE[kingdomOf(player.zone)] || KINGDOM_LORE.aurelia;
  return `
  <div class="jn-mast"><small>Edição nº ${player.day} · ${season().n} · 1 ouro</small><h1>O Eco de Cinzaluz</h1><small>"${lore.lema}"</small></div>
  <div class="jn-head">${head}</div>
  <div class="jn-cols">
    <section><h3>Notícias</h3>${news.length ? `<ul>${news.slice(-6).reverse().map((t) => `<li>${t}</li>`).join("")}</ul>` : "<p>Dia calmo em Cinzaluz. Calmo demais, dizem as fofoqueiras.</p>"}
      <h3>Obituário</h3>${deaths.length ? `<ul>${deaths.map(([id, d]) => `<li>${shortName(id)} († dia ${d.day})${d.found ? "" : " — desaparecid" + gw(id, "o", "a")}</li>`).join("")}</ul>` : "<p>Ninguém morreu esta semana. Que milagre.</p>"}
    </section>
    <section><h3>Política</h3><ul>${rulers}</ul><ul>${pol}</ul>${heir}
      <h3>Leis do reino</h3><p>${lore.lei}</p>
      <h3>Previsão do tempo</h3><p>${iconHTML(WEATHER_ICONS[wx] || "sun", 14)} Amanhã: ${WEATHER[wx].n}.</p>
    </section>
    <section><h3>Fofocas da taverna</h3>${gossip.map((g) => `<p>"${g}"</p>`).join("")}
      <h3>Classificados</h3><ul>${houses.map((h) => `<li>VENDE-SE: ${h.n}, ${h.size}. ${h.price} ouro.</li>`).join("")}${profs.map((p) => `<li>PRECISA-SE: ${PROFESSIONS[p].n}. Falar no Quadro de Trabalhos.</li>`).join("")}</ul>
      <h3>Horóscopo das runas</h3><p>${horo}</p>
      <div class="jn-strip"><b>Tirinha do Luca:</b> ${pick(lucaLines())}</div>
    </section>
  </div>`;
}
function openPaper() {
  if (game.mode !== "world" || game.dialog) return;
  let el = byId("jornal");
  if (!el) {
    el = document.createElement("div");
    el.id = "jornal";
    el.className = "ui ov";
    byId("screen").appendChild(el);
  }
  if (game.paperDay !== player.day) {
    game.paperHtml = buildPaper();
    game.paperDay = player.day;
  }
  el.innerHTML = `<button class="jn-x" id="jnx">✕</button><div class="jn-paper">${game.paperHtml}</div>`;
  el.style.display = "block";
  game.mode = "jornal";
  byId("jnx").onclick = closePaper;
  playSound(520, 0.05, "triangle");
}
function closePaper() {
  const el = byId("jornal");
  if (el) el.style.display = "none";
  game.mode = "world";
}
KEY_HANDLERS.jornal = (k) => (k === "escape" || k === "j") && closePaper();
WORLD_SHORTCUTS.j = openPaper;
(function paperButton() {
  const small = document.querySelector("#touch .small");
  if (!small) return;
  const b = document.createElement("button");
  b.textContent = "Jornal";
  b.addEventListener("click", openPaper);
  small.appendChild(b);
})();

/* ===================== SUCESSÃO ===================== */

{
  const dayBase = onNewDay;
  onNewDay = function () {
    dayBase.apply(this, arguments);
    if (!lifeMode() || !player.royalBirth || rulesK("aurelia")) return;
    if (isDead("rainha")) game.pendingCrown = "morte";
    else if (player.day >= 21 && friendship("rainha") >= 75 && Math.random() < 0.04) game.pendingCrown = "abdica";
  };
}
function coronation(why) {
  throne().aurelia = player.day;
  syncRulers();
  repAdd(8);
  vilaNews(`${alteza()} foi coroad${genderWord("o", "a", "e")}! Longa vida à nova Majestade de Aurélia!`);
  announceWorld(`COROAÇÃO! ${player.name} agora governa Aurélia!`);
  const intro =
    why === "morte"
      ? [["Padre Anselmo", "A Rainha Aurélia nos deixou. Pela lei de sucessão, a coroa passa para a família."], ["", `No dia seguinte, os sinos tocam. ${player.name} recebe a coroa na escadaria do castelo.`]]
      : [["Rainha Aurélia", `Estou cansada, ${genderWord("meu sobrinho", "minha sobrinha", "querid@")}. Trinta anos de coroa pesam. Ela agora é sua.`], ["", "A Rainha tira a coroa e coloca na sua cabeça diante da vila inteira."]];
  saveGame();
  say(intro.concat([["", `Você agora é ${royalTitle()}! Aperte K para governar.`]]), () => {
    if (Math.random() < 0.5) setTimeout(rivalNoble, 1500);
  });
}
function rivalNoble() {
  if (game.mode !== "world" || game.dialog) return setTimeout(rivalNoble, 3000);
  const n = "Duque Ramiro de Valsombra";
  choice(n, `"Essa coroa devia ser minha! Metade da nobreza está comigo." Os nobres cochicham pelos corredores.`, [
    {
      t: "Desafiar o Duque para um duelo",
      icon: "sword",
      fn: () => {
        const ok = Math.random() < 0.45 + (player.army || 0) / 200 + (friendshipLevel("marcos") >= 2 ? 0.15 : 0);
        if (ok) (repAdd(6), say([["", "Espadas cruzam no pátio do castelo. O Duque cai de joelhos e jura lealdade."], [n, "...Vida longa à Majestade."]]));
        else (repAdd(-8), (player.gold = Math.max(0, player.gold - 300)), say([["", "O Duque é mais rápido. Você sobrevive, mas paga 300 de ouro para ele sumir do reino."]]));
        saveGame();
      },
    },
    {
      t: `Comprar o apoio da nobreza (${withTax(500)} ouro)`,
      icon: "coin",
      off: player.gold < withTax(500),
      fn: () => (player.gold >= withTax(500) ? (payWithTax(500), saveGame(), say([["", "Banquetes, presentes e terras. A nobreza agora jura lealdade a você. O Duque fica sozinho."]])) : null),
    },
    { t: "Ignorar o Duque", icon: "meh", fn: () => ((player.rep = Math.max(0, (player.rep ?? 50) - 10)), saveGame(), say([[n, "Vai se arrepender, Majestade. Os nobres não esquecem."]]), Math.random() < 0.4 && setTimeout(counterCoup, 20000)) },
  ]);
}

/* ===================== IDENTIDADE DOS REINOS ===================== */

const KINGDOM_LORE = {
  aurelia: { lema: "Luz, pão e coroa", lei: "Imposto Real em todas as compras. Quem ataca a família real vai para a forca.", prato: "Pão de Cinzaluz" },
  mares: { lema: "O mar dá, o mar cobra", lei: "Lei do Cais: comércio com imposto mais baixo (é um porto livre), mas quem rouba no cais apanha da tripulação.", prato: "Caldeirada das Marés", greet: ["Bons ventos!", "Que o mar te seja leve!", "Ô de bordo!"] },
  serra: { lema: "Pedra não esquece", lei: "Lei da Pedra: furto é crime grave (a guarda anã vê tudo) e todo forasteiro paga um ouro de pedágio ao entrar.", prato: "Pão de Pedra dos Anões", greet: ["Pela pedra!", "Que a forja te aqueça!", "Barba forte, forasteiro!"] },
};
Object.assign(ITEMS, {
  caldeirada: { nome: "Caldeirada das Marés", tipo: "food", preco: 22, food: 70, water: 20, desc: "Peixe, camarão e tomate. Fome +70, sede +20. Prato típico das Marés." },
  paoPedra: { nome: "Pão de Pedra dos Anões", tipo: "food", preco: 14, food: 60, desc: "Duro como granito, gostoso como saudade. Fome +60. Prato típico de Pedravale." },
});
ITEM_ICONS.caldeirada = gIcon("soup", "#c94a3a", "#f2c14e", 1);
ITEM_ICONS.paoPedra = gIcon("bread", "#8a8478", "#c9a050", 2);
for (const [shop, it] of [
  ["tavPorto", "caldeirada"],
  ["padPorto", "caldeirada"],
  ["padSerra", "paoPedra"],
  ["chaSerra", "paoPedra"],
])
  if (SHOPS[shop] && !SHOPS[shop].items.includes(it)) SHOPS[shop].items.push(it);
{
  // Porto livre: imposto menor nas Marés.
  const taxBase = taxRate;
  taxRate = () => (kingdomOf(player.zone) === "mares" ? taxBase() * 0.5 : taxBase());
  // Lei da Pedra: roubar em Pedravale é bem mais difícil.
  const stealBase = stealChance;
  stealChance = (id, base) => stealBase(id, base) - (kingdomOf(player.zone) === "serra" ? 0.2 : 0);
  // Saudação local nas falas de quem mora lá.
  const lineBase = genLine;
  genLine = function (id, topic) {
    const L = KINGDOM_LORE[kingdomOf(player.zone)];
    const s = lineBase(id, topic);
    return L && L.greet && Math.random() < 0.25 ? `${pk(L.greet)} ${s}` : s;
  };
  // Ao chegar num reino, um aviso com o lema e a lei.
  const zoneBase = enterZone;
  enterZone = function () {
    const r = zoneBase.apply(this, arguments);
    const k = kingdomOf(player.zone);
    if (["porto", "serra"].includes(player.zone) && player.famDay["lore" + k] !== player.day) {
      player.famDay["lore" + k] = player.day;
      const L = KINGDOM_LORE[k];
      setTimeout(() => toast(`${KINGDOMS[k].n} · "${L.lema}". ${L.lei}`, 6000), 1500);
      if (k === "serra" && lifeMode() && player.gold > 0) player.gold -= 1;
    }
    return r;
  };
  // No trono de cada reino: leis e costumes.
  const seatBase = seatMenu;
  seatMenu = function (b) {
    hookChoice(
      () => seatBase(b),
      (title, text, opts) => {
        const L = KINGDOM_LORE[REALM_SEATS[b.style].k];
        opts.splice(opts.length - 1, 0, { t: "Leis e costumes do reino", icon: "scroll", fn: () => say([[REALM_SEATS[b.style].ruler, `Nosso lema: "${L.lema}".`], ["", L.lei], ["", `Prato típico: ${L.prato}. Festa: ${b.style === "palacio" ? "Noite das Velas (4º dia de cada estação)" : "Festa da Forja (6º dia de cada estação)"}.`]]) });
        return [title, text, opts];
      },
    );
  };
}
function localFestival() {
  if (player.zone === "porto" && seasonDay() === 4) return "velas";
  if (player.zone === "serra" && seasonDay() === 6) return "forja";
  return null;
}
function drawLocalFestival(t) {
  const f = localFestival();
  if (!f || !game.cam) return;
  const z = ZONES[player.zone];
  if (f === "velas") {
    // Velas flutuando no mar.
    for (let y = 24; y < z.h - 1; y++)
      for (let x = 1; x < z.w - 1; x += 2) {
        if (z.map[y][x] !== "~" || (x * 7 + y * 3) % 5) continue;
        const X = x * TILE + 12 + Math.sin(t + x) * 4,
          Y = y * TILE + 14 + Math.cos(t * 0.8 + y) * 2;
        ctx.fillStyle = "#f6f2ea";
        ctx.fillRect(X, Y, 6, 4);
        ctx.fillStyle = `rgba(255,${200 + Math.floor(Math.sin(t * 9 + x) * 30)},90,1)`;
        ctx.beginPath();
        ctx.arc(X + 3, Y - 2, 2, 0, 7);
        ctx.fill();
        const g = ctx.createRadialGradient(X + 3, Y - 2, 1, X + 3, Y - 2, 16);
        g.addColorStop(0, "rgba(255,210,120,.4)");
        g.addColorStop(1, "rgba(255,210,120,0)");
        ctx.fillStyle = g;
        ctx.fillRect(X - 13, Y - 18, 32, 32);
      }
  } else {
    // Faíscas da forja subindo pela vila.
    for (let k = 0; k < 40; k++) {
      const ph = (t * 0.4 + k * 0.137) % 1;
      const X = ((k * 197) % (z.w * TILE)) + Math.sin(t * 3 + k) * 6,
        Y = 20 * TILE - ph * 14 * TILE;
      ctx.fillStyle = `rgba(255,${150 + (k % 4) * 25},60,${1 - ph})`;
      ctx.fillRect(X, Y, 2, 2);
    }
  }
}
let festAcc = 0;
function festivalShouts(dt) {
  const f = localFestival();
  if (!f) return;
  festAcc += dt;
  if (festAcc < 6) return;
  festAcc = 0;
  const w = pk((game.walkers || []).filter((q) => Math.abs(q.x - player.x) + Math.abs(q.y - player.y) <= 8));
  if (!w) return;
  w.sayT = 2.6;
  w.sayTxt = f === "velas" ? pk(["Feliz Noite das Velas!", "Solta a sua vela no mar e faz um pedido!", "Bons ventos para todos!"]) : pk(["Pela pedra e pelo fogo!", "Viva a Festa da Forja!", "Bebe, que o martelo paga!"]);
}

/* ===================== MASCOTES NA ALA REAL E NO QUINTAL ===================== */

const WING_PET_SPOTS = [
  [7, 7],
  [27, 18],
  [4, 18],
];
const YARD_PET_SPOTS = [
  [6, 4],
  [9, 6],
  [11, 3],
];
function petSpots() {
  return player.zone === "alareal" ? WING_PET_SPOTS : player.zone === "quintal" ? YARD_PET_SPOTS : player.zone === "casa" ? HOME_PET_SPOTS : null;
}
function homePets() {
  const sp = petSpots();
  if (!sp) return [];
  const out = [];
  let k = 0;
  (player.pets || []).forEach((p, i) => {
    if (i === player.petA) return;
    const s = sp[k++];
    if (s) out.push({ p, i, x: s[0], y: s[1] });
  });
  return out;
}
function homePetAt(x, y) {
  return homePets().find((q) => q.x === x && q.y === y);
}
function petCareMenu(q) {
  const p = q.p;
  game.pieAnchor = { x: q.x, y: q.y };
  const n = p.name || "Bichinho";
  choice(n, `Amor: ${p.love || 0}/100`, [
    { t: "Fazer carinho", icon: "heart", fn: () => ((p.love = Math.min(100, (p.love || 0) + 5)), (player.famDay["pet" + q.i + "c"] = player.day), lifeMode() && addNeed("fun", 8), game.bubbles.push({ x: q.x, y: q.y, icon: "heart", t: 2 }), say([["", pk([`${n} fecha os olhos e se espreguiça.`, `${n} rola de barriga pra cima. Mais carinho!`, `${n} faz um barulhinho feliz.`])]])) },
    { t: "Brincar", icon: "party", fn: () => ((p.love = Math.min(100, (p.love || 0) + 8)), lifeMode() && addNeed("fun", 14), lifeMode() && addNeed("energy", -4), say([["", `Você e ${n} correm pela casa até cansar.`]])) },
    { t: "Levar para passear (vira o mascote ativo)", icon: "paw", fn: () => ((player.petA = q.i), saveGame(), toast(`${n} agora te acompanha.`, 2000)) },
    { t: "Sair", fn: null },
  ]);
}
{
  const drawBase = crewDrawList;
  crewDrawList = function (list, t) {
    drawBase(list, t);
    if (player.zone === "alareal" || player.zone === "quintal")
      for (const q of homePets()) list.push({ y: q.y, draw: () => drawPet(q.p, q.x * TILE + 7 + Math.sin(t * 0.7 + q.i) * 4, q.y * TILE + 14, Math.sin(t * 0.35 + q.i) < 0, t, false) });
    if (ZONES[player.zone] && ZONES[player.zone].town && game.cam) {
      list.push({ y: -2, draw: () => drawSeasonGround(t) });
      list.push({ y: 998, draw: () => drawLocalFestival(t) });
    }
  };
  const charBase = characterAt;
  characterAt = (x, y) => !!homePetAt(x, y) || charBase(x, y);
  const tgtBase = targetAt;
  targetAt = (x, y) => {
    const q = homePetAt(x, y);
    return q ? `${q.p.name || "Mascote"} (carinho)` : tgtBase(x, y);
  };
  const interBase = interactAt;
  interactAt = (x, y) => {
    const q = homePetAt(x, y);
    return q ? petCareMenu(q) : interBase(x, y);
  };
}

/* ===================== ESTAÇÕES NO VISUAL ===================== */

function viewTiles() {
  const c = game.cam;
  const x0 = Math.max(0, Math.floor(c.camX / TILE) - 1),
    y0 = Math.max(0, Math.floor(c.camY / TILE) - 1);
  const x1 = Math.ceil((c.camX + viewWidth / c.Z) / TILE) + 1,
    y1 = Math.ceil((c.camY + 480 / c.Z) / TILE) + 1;
  return [x0, y0, x1, y1];
}
function drawSeasonGround(t) {
  const s = season().id;
  if (s === "ver") return;
  const z = ZONES[player.zone];
  const [x0, y0, x1, y1] = viewTiles();
  for (let y = y0; y <= Math.min(y1, z.h - 1); y++)
    for (let x = x0; x <= Math.min(x1, z.w - 1); x++) {
      const c = z.map[y] && z.map[y][x];
      const h = tileHash(x, y);
      const X = x * TILE,
        Y = y * TILE;
      if (c === "T" && z.theme !== "porto") {
        if (s === "out") {
          for (let k = 0; k < 7; k++) {
            ctx.fillStyle = ["#d9742a", "#c94a2a", "#e8a03a", "#a8502a"][(k + Math.floor(h * 9)) % 4];
            ctx.fillRect(X + 5 + ((k * 7 + h * 30) % 20), Y + 3 + ((k * 5) % 14), 4, 3);
          }
          const ph = (t * 0.3 + h) % 1;
          ctx.fillStyle = "#d9742a";
          ctx.fillRect(X + 8 + Math.sin(t * 2 + h * 9) * 8, Y + 16 + ph * 26, 3, 2);
        } else if (s === "inv") {
          ctx.fillStyle = "rgba(245,248,252,.92)";
          ctx.fillRect(X + 7, Y + 2, 18, 4);
          ctx.fillRect(X + 4, Y + 8, 7, 3);
          ctx.fillRect(X + 20, Y + 9, 8, 3);
        } else if (s === "pri") {
          for (let k = 0; k < 5; k++) {
            ctx.fillStyle = (k + Math.floor(h * 5)) % 2 ? "#ffb3c8" : "#fff0f5";
            ctx.fillRect(X + 6 + ((k * 9 + h * 20) % 20), Y + 4 + ((k * 6) % 12), 3, 3);
          }
        }
      } else if (c === "." || c === "g") {
        if (s === "pri" && h > 0.72) {
          ctx.fillStyle = ["#ff6b8a", "#f5d76e", "#c77dff", "#ffffff"][Math.floor(h * 100) % 4];
          ctx.fillRect(X + h * 24, Y + (1 - h) * 22 + 4, 3, 3);
          ctx.fillStyle = "#3d7a2a";
          ctx.fillRect(X + h * 24 + 1, Y + (1 - h) * 22 + 7, 1, 3);
        } else if (s === "out" && h > 0.6) {
          ctx.fillStyle = ["#d9742a", "#c94a2a", "#e8a03a"][Math.floor(h * 100) % 3];
          ctx.fillRect(X + h * 26, Y + (1 - h) * 24 + 2, 4, 2);
        } else if (s === "inv" && h > 0.45) {
          ctx.fillStyle = "rgba(240,245,250,.65)";
          ctx.fillRect(X + h * 18, Y + (1 - h) * 18 + 4, 10, 4);
        }
      }
    }
}
{
  // Neve nos telhados no inverno.
  const bldBase = drawBuilding;
  drawBuilding = function (b, t) {
    bldBase(b, t);
    if (season().id !== "inv" || ["castle", "farol", "mina", "palacio", "fortaleza", "moinho"].includes(b.style)) return;
    const X = b.x * TILE,
      Y = b.y * TILE,
      W = b.w * TILE,
      Hh = b.h * TILE;
    const S = BUILDING_STYLES[b.style] || {};
    const roofH = Math.max(36, Math.round(Hh * 0.5));
    ctx.fillStyle = "rgba(246,249,252,.95)";
    if (S.thatch) {
      fillPolygon(X + W / 2 - 22, Y - 4, X + W / 2, Y - 18, X + W / 2 + 22, Y - 4);
    } else {
      ctx.fillRect(X + 14, Y - 12, W - 28, 6);
      ctx.fillRect(X + 10, Y - 6, W - 20, 3);
      for (let k = 0; k < W / 14; k++) ctx.fillRect(X + 12 + k * 14, Y - 3, 3, 2 + (k % 3));
    }
    ctx.fillRect(X - 6, Y + roofH - 4, W + 12, 2);
  };
  const updBase = update;
  update = function (dt) {
    updBase(dt);
    if (game.mode !== "world" || game.dialog) return;
    festivalShouts(dt);
    if (game.pendingCrown && ZONES[player.zone] && ZONES[player.zone].town) {
      const w = game.pendingCrown;
      game.pendingCrown = null;
      if (w === "abdica")
        choice("A Rainha quer abdicar", `A Rainha Aurélia chama você ao castelo: "Estou cansada. Quer a coroa, ${alteza()}?"`, [
          { t: "Aceitar a coroa", icon: "crown", fn: () => coronation("abdica") },
          { t: "Ainda não, tia", icon: "heart", fn: () => (addFriendship("rainha", 5), say([["Rainha Aurélia", "Sábia escolha. Aproveite enquanto é só príncipe. Depois é só dor de cabeça."]])) },
        ]);
      else coronation("morte");
    }
  };
}
