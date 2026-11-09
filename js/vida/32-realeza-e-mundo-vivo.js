/* 32-realeza-e-mundo-vivo.js: junta 50-origem-e-ala-real.js, 51-alteza.js, 52-mundo-vivo.js. */
/**
 * ECOS DO ARCANO — 32-realeza-e-mundo-vivo.js
 * Simulador de Vida: quem você é quando nasce.
 *  - Na criação (aba Origem): plebeu, artesão, comerciante, burguês, nobre ou realeza,
 *    e uma ocupação inicial (qualquer carreira, já com experiência).
 *  - Depois de criar, você escolhe a casa conforme a origem (casebres para o povo,
 *    sobrados e mansões para os ricos, a Ala Real do castelo para a realeza).
 *  - Ala Real do Castelo: quarto real, quarto de hóspedes, dois banheiros, sala de
 *    jantar, cozinha e salão de festas, com mordomo, cozinheira, camareira e criado.
 *    Quem nasce na realeza, quem casa com a Rainha e quem dá o golpe mora lá.
 */

"use strict";

/* ===================== ORIGENS ===================== */

const ORIGINS = {
  plebeu: { m: "Plebeu", f: "Plebeia", ic: "bread", gold: 40, rep: 45, tiers: ["casebre"], d: "Nasceu do povo. Pouco ouro, um casebre e muita vontade." },
  artesao: { m: "Artesão", f: "Artesã", ic: "hammer", gold: 150, rep: 50, tiers: ["casebre", "casa"], d: "Vive do próprio ofício. Uma casa simples e mãos calejadas." },
  comerciante: { m: "Comerciante", f: "Comerciante", ic: "coin", gold: 350, rep: 52, tiers: ["casa"], d: "Compra barato, vende caro e conhece todo mundo." },
  burgues: { m: "Burguês", f: "Burguesa", ic: "gem", gold: 800, rep: 55, tiers: ["casa", "sobrado"], d: "Família rica da cidade. Sobrado, roupas finas e criados de vez em quando." },
  nobre: { m: "Nobre (Duque)", f: "Nobre (Duquesa)", ic: "scroll", gold: 1800, rep: 65, tiers: ["sobrado", "mansao"], title: ["Duque", "Duquesa"], d: "Título, terras e uma mansão. A corte conhece o seu nome." },
  realeza: { m: "Realeza (Príncipe)", f: "Realeza (Princesa)", ic: "crown", gold: 3000, rep: 70, castle: true, title: ["Príncipe", "Princesa"], d: "Sobrinho(a) da Rainha Aurélia. Mora na Ala Real do castelo, com empregados." },
};
function originName(k) {
  const o = ORIGINS[k];
  return o ? (game.draftGender === "f" || player.gender === "f" ? o.f : o.m) : "";
}
function ccOriginPanel() {
  const cur = game.draftOrigin || "plebeu",
    occ = game.draftOcc || "";
  const profs = Object.keys(PROFESSIONS).filter((id) => !PROFESSIONS[id].story);
  return `<div class="cc-prof">
    <div class="cc-lbl">${iconHTML("crown", 18)}<span>Origem <small>(define o ouro, a fama e onde você mora)</small></span></div>
    <div class="cc-origs">${Object.entries(ORIGINS)
      .map(([k, o]) => `<button data-orig="${k}" class="${cur === k ? "on" : ""}">${iconHTML(o.ic, 22)}<b>${originName(k)}</b><small>${o.d}</small><em>${iconHTML("coin", 12)}${o.gold} ouro</em></button>`)
      .join("")}</div>
    <div class="cc-lbl">${iconHTML("hammer", 18)}<span>Ocupação <small>(começa já com experiência)</small></span></div>
    <div class="cc-occs"><button data-occ="" class="${!occ ? "on" : ""}">Nenhuma ainda</button>${profs
      .map((id) => `<button data-occ="${id}" class="${occ === id ? "on" : ""}">${iconHTML(PROFESSIONS[id].icon || "hammer", 16)}${PROFESSIONS[id].n}</button>`)
      .join("")}</div>
  </div>`;
}
function ccOriginBind(el) {
  el.querySelectorAll("[data-orig]").forEach((b) => (b.onclick = () => ((game.draftOrigin = b.dataset.orig), playSound(620, 0.04, "sine"), renderCreate())));
  el.querySelectorAll("[data-occ]").forEach((b) => (b.onclick = () => ((game.draftOcc = b.dataset.occ), playSound(620, 0.04, "sine"), renderCreate())));
}
{
  const showBase = showCreate;
  showCreate = function (mode) {
    if (mode === "new") {
      game.draftOrigin = game.draftOrigin || "plebeu";
      game.draftOcc = game.draftOcc || "";
    }
    return showBase(mode);
  };
  const startBase = startLifeMode;
  startLifeMode = function () {
    startBase();
    applyOrigin(game.draftOrigin || "plebeu", game.draftOcc || "");
  };
}
function applyOrigin(k, occ) {
  const o = ORIGINS[k] || ORIGINS.plebeu;
  player.origin = k;
  player.gold = o.gold;
  player.rep = o.rep;
  if (o.title) player.titleWord = o.title[player.gender === "f" ? 1 : 0];
  if (occ && PROFESSIONS[occ]) (player.careers = player.careers || {})[occ] = 16;
  if (o.castle) {
    player.royalBirth = true;
    if (FRIENDS.rainha) player.rel.rainha = 70;
  }
  saveGame();
  const after = () => chooseHome(k);
  // Espera a fala de boas-vindas acabar para escolher a casa.
  const wait = () => (game.dialog || game.mode !== "world" ? setTimeout(wait, 400) : after());
  setTimeout(wait, 600);
}
function chooseHome(k) {
  const o = ORIGINS[k];
  const opts = [];
  if (o.castle)
    opts.push({
      t: "Ala Real do Castelo (quartos, salão de festas e empregados)",
      icon: "crown",
      fn: () => {
        player.home = STARTER_HOUSE;
        saveGame();
        enterRoyalWing();
        say([["Mordomo Albérico", `Bem-vind${genderWord("o", "a", "e")} de volta, ${player.titleWord} ${player.name}. Seus aposentos estão prontos. A cozinheira já começou o jantar.`], ["", "A Ala Real tem quarto, banheiro, sala de jantar, cozinha e salão de festas. Fale com os empregados para pedir banho, refeição, festas e mais."]]);
      },
    });
  // Até 3 casas de cada padrão que a origem permite (Cinzaluz primeiro).
  const H = [];
  for (const tier of o.tiers || []) {
    Object.values(allHouses())
      .filter((h) => h.tier === tier && h.key !== STARTER_HOUSE)
      .sort((a, b) => (a.zone === "vila" ? 0 : 1) - (b.zone === "vila" ? 0 : 1) || a.price - b.price)
      .slice(0, o.castle ? 2 : 3)
      .forEach((h) => H.push(h));
  }
  if (k === "plebeu" && !H.some((h) => h.key === STARTER_HOUSE)) H.unshift(allHouses()[STARTER_HOUSE]);
  for (const h of H)
    opts.push({
      t: `${HOUSE_TIERS[h.tier].n} ${h.size} ${h.zone === "vila" ? (h.y > 45 ? "no Bairro das Flores" : "no centro de Cinzaluz") : h.zone === "porto" ? "no Porto" : "na Serra"} (vale ${h.price} ouro)`,
      icon: "house",
      fn: () => {
        player.houses = [...new Set([...(player.houses || []), h.key])];
        player.home = h.key;
        player.zone = h.zone;
        player.x = h.x;
        player.y = h.y + 1;
        player.rx = player.x;
        player.ry = player.y;
        game.fade = 1;
        enterZone(false);
        saveGame();
        toast(`Sua casa: ${h.n}. A porta fica bem à sua frente.`, 3200);
      },
    });
  if (!opts.length) return;
  game.pieAnchor = null;
  choice(`Onde ${genderWord("o", "a", "e")} ${originName(k).toLowerCase()} vai morar?`, `${ORIGINS[k].d}<br>Escolha a sua casa. Você começa com ${player.gold} de ouro.`, opts);
}
{
  const taxBase = dailyPropertyTax;
  dailyPropertyTax = () => (player.royalBirth ? 0 : taxBase());
  const goalBase = lifeGoalText;
  lifeGoalText = function () {
    const t = goalBase();
    if (player.titleWord && !t.startsWith("!") && !isMonarch()) return t.replace(`${player.name},`, `${player.titleWord} ${player.name},`);
    return t;
  };
  // Mesada da família real (os empregados também recebem).
  const dayBase = onNewDay;
  onNewDay = function () {
    dayBase.apply(this, arguments);
    if (lifeMode() && player.royalBirth && !isMonarch()) {
      player.gold += 90;
      setTimeout(() => toast("Mesada da família real: +90 ouro (já descontado o salário dos empregados).", 3200), 6000);
    }
  };
}
function livesInCastle() {
  return lifeMode() && (player.royalBirth || isMonarch());
}

/* ===================== ALA REAL ===================== */

ZONE_DEFS.alareal = { nome: "Ala Real do Castelo", theme: "casa", exits: {}, enemies: [] };
const RW = { w: 36, h: 22 };
const RW_ROOMS = [
  { n: "Quarto Real", x0: 1, y0: 2, x1: 10, y1: 9 },
  { n: "Banheiro", x0: 12, y0: 2, x1: 16, y1: 9 },
  { n: "Quarto de Hóspedes", x0: 18, y0: 2, x1: 27, y1: 9 },
  { n: "Banheiro", x0: 29, y0: 2, x1: 34, y1: 9 },
  { n: "Sala de Jantar", x0: 1, y0: 13, x1: 11, y1: 20 },
  { n: "Cozinha", x0: 13, y0: 13, x1: 20, y1: 20 },
  { n: "Salão de Festas", x0: 22, y0: 13, x1: 34, y1: 20 },
];
const RW_FURN = [
  // Quarto real
  ["m_camaLux", 2, 3], ["m_camaCasal", 5, 3], ["armario", 9, 3], ["m_tapeteR", 5, 6], ["m_penteadeira", 2, 8], ["m_espelho", 9, 7], ["m_vela", 8, 3], ["m_abajur", 3, 3],
  // Banheiros
  ["m_banheira", 14, 3], ["m_espelho", 12, 3], ["m_planta", 16, 8], ["m_banheira", 31, 3], ["m_samambaia", 33, 8], ["m_espelho", 29, 3],
  // Quarto de hóspedes
  ["cama", 19, 3], ["cama", 22, 3], ["m_comoda", 26, 3], ["m_tapete", 21, 6], ["m_quadro", 25, 3], ["m_poltrona", 26, 8],
  // Sala de jantar (mesa comprida)
  ["m_jantar", 3, 15], ["m_jantar", 4, 15], ["m_jantar", 5, 15], ["m_jantar", 6, 15], ["m_jantar", 7, 15], ["m_cadeira", 3, 14], ["m_cadeira", 5, 14], ["m_cadeira", 7, 14], ["m_cadeira", 3, 16], ["m_cadeira", 5, 16], ["m_cadeira", 7, 16], ["m_lareira", 10, 13], ["m_relogio", 1, 13], ["m_vela", 9, 19], ["m_tapeteP", 5, 18],
  // Cozinha
  ["m_fogao", 14, 13], ["m_fogao", 15, 13], ["mesa", 17, 16], ["m_caldeirao", 19, 13], ["m_estante", 20, 17], ["m_bau", 13, 19],
  // Salão de festas
  ["m_piano", 23, 13], ["m_tapeteR", 27, 16], ["m_tapeteR", 28, 16], ["m_tapeteR", 29, 16], ["m_tapeteR", 27, 17], ["m_tapeteR", 28, 17], ["m_tapeteR", 29, 17], ["m_harpa", 33, 13], ["m_flores", 22, 20], ["m_flores", 34, 20], ["m_vela", 25, 20], ["m_vela", 31, 20], ["m_trofeu", 34, 15], ["m_sofa", 23, 18],
];
function genRoyalWing() {
  const { w, h } = RW;
  const m = makeGrid(w, h, (x, y) => (x === 0 || y === 0 || x === w - 1 || y === h - 1 || y === 1 ? "#" : "."));
  // Paredes dos cômodos: corredor nas linhas 10-11.
  for (let x = 1; x < w - 1; x++) {
    // parede de cima do corredor (y = 9 é o fundo dos quartos) e de baixo (y = 12)
    if (![5, 14, 22, 31].includes(x)) m[9][x] = "#";
    if (![6, 16, 28].includes(x)) m[12][x] = "#";
  }
  for (const x of [11, 17, 28]) for (let y = 2; y <= 9; y++) m[y][x] = "#";
  for (const x of [12, 21]) for (let y = 12; y <= 20; y++) m[y][x] = "#";
  m[9][5] = m[9][14] = m[9][22] = m[9][31] = ".";
  m[12][6] = m[12][16] = m[12][28] = ".";
  const z = finalize("alareal", ZONE_DEFS.alareal, m, w, h, {}, {}, null);
  z.town = { bld: [], doors: {}, stalls: {}, huts: [], arrive: [1, 10], horses: [], boats: [], yard: true };
  return z;
}
const RW_EXIT = [1, 10];
const SERVANTS = [
  { id: "mordomo", nm: "Mordomo Albérico", robe: "#1a1a22", hair: "#d9d9d9", room: [2, 10, 34, 11] },
  { id: "cozinheira", nm: "Cozinheira Benta", robe: "#f2eee4", hair: "#3a2414", room: [13, 14, 20, 20] },
  { id: "camareira", nm: "Camareira Lis", robe: "#3a2a4a", hair: "#8a3a1a", room: [2, 4, 10, 8] },
  { id: "criado", nm: "Criado Teo", robe: "#2a3a6a", hair: "#1a1a1a", room: [22, 14, 34, 20] },
];
function rwFurnAt(x, y) {
  return RW_FURN.find(([, fx, fy]) => fx === x && fy === y);
}
function enterRoyalWing() {
  ZONES.alareal = ZONES.alareal || genRoyalWing();
  if (player.zone !== "alareal") game.rwBack = { zone: player.zone === "interior" ? "vila" : player.zone, x: 31, y: 12 };
  player.zone = "alareal";
  [player.x, player.y] = [2, 10];
  player.rx = player.x;
  player.ry = player.y;
  player.dir = "right";
  player.riding = false;
  game.fade = 1;
  enterZone(false);
  game.rwStaff = SERVANTS.map((s) => {
    const [x0, y0, x1, y1] = s.room;
    const x = x0 + Math.floor(Math.random() * (x1 - x0)),
      y = y0 + Math.floor(Math.random() * (y1 - y0));
    const ok = walkable("alareal", x, y) ? [x, y] : [x0 + 1, y0 + 1];
    return { ...s, x: ok[0], y: ok[1], rx: ok[0], ry: ok[1], dir: "down", t: Math.random() * 2, npc: tempNpc("s_", { nm: s.nm, robe: s.robe, hair: s.hair }) };
  });
  playSound(392, 0.15, "triangle");
}
function leaveRoyalWing() {
  const b = game.rwBack || { zone: "vila", x: 31, y: 12 };
  player.zone = b.zone;
  player.x = b.x;
  player.y = b.y;
  player.rx = b.x;
  player.ry = b.y;
  player.dir = "down";
  game.fade = 1;
  enterZone(false);
}
{
  // Os móveis da ala bloqueiam a passagem (menos tapetes e cadeiras).
  const walkBase = walkable;
  walkable = function (z, x, y) {
    if (z === "alareal") {
      const f = rwFurnAt(x, y);
      if (f && !furnWalk(f[0])) return false;
      if (game.rwStaff && game.rwStaff.some((s) => s.x === x && s.y === y)) return false;
    }
    return walkBase(z, x, y);
  };
  // Mármore no chão da ala.
  const tierBase = homeTier;
  homeTier = () => (player.zone === "alareal" ? "mansao" : tierBase());
  // Porta do castelo: sala do trono ou os seus aposentos.
  const actBase = bldAction;
  bldAction = function (b) {
    if (b && b.style === "castle" && livesInCastle())
      return choice("Castelo de Cinzaluz", "Os guardas se curvam quando você passa.", [
        { t: "Ir para a Ala Real (seus aposentos)", icon: "crown", fn: () => ((game.rwBack = { zone: player.zone, x: player.x, y: player.y }), enterRoyalWing()) },
        { t: "Ir para a sala do trono", icon: "house", fn: () => actBase(b) },
        { t: "Ficar aqui fora", fn: null },
      ]);
    return actBase(b);
  };
}
function servantAt(x, y) {
  return player.zone === "alareal" && (game.rwStaff || []).find((s) => s.x === x && s.y === y);
}
function servantMenu(s) {
  game.pieAnchor = { x: s.x, y: s.y };
  const L = lifeMode();
  const need = (k, v) => L && addNeed(k, v);
  const items = {
    mordomo: [
      { t: `Preparar um banquete (${withTax(80)} ouro)`, icon: "stew", fn: () => (player.gold >= withTax(80) ? (payWithTax(80), need("hunger", 100), need("fun", 25), Object.keys(FRIENDS).filter((k) => CREW_ALL.includes(k) && !isDead(k)).forEach((k) => addFriendship(k, 3)), passTime(2, "Um banquete na sala de jantar, com a turma toda convidada..."), say([["Mordomo Albérico", "O banquete está servido. A turma inteira veio e comeu como se não houvesse amanhã."]])) : say([["Mordomo Albérico", "O tesouro não permite, Alteza."]])) },
      { t: `Organizar um baile no salão (${withTax(200)} ouro)`, icon: "party", fn: () => (player.gold >= withTax(200) ? (payWithTax(200), need("fun", 60), repAdd(6), passTime(3, "Música, dança e lustres acesos no salão de festas..."), vilaNews(`Baile na Ala Real! ${player.name} dançou até de manhã.`), say([["", "O baile foi um sucesso. A vila inteira comenta. Reputação +6!"]])) : say([["Mordomo Albérico", "Um baile custa caro, Alteza."]])) },
      { t: "Trazer as notícias do reino", icon: "scroll", fn: () => say([["Mordomo Albérico", (player.news || []).length ? pk(player.news).t : "Tudo calmo no reino, por enquanto. Calmo demais, se me permite."]]) },
    ],
    cozinheira: [
      { t: "Pedir uma refeição", icon: "bread", fn: () => (need("hunger", 60), need("thirst", 40), (player.food = Math.min(100, (player.food || 0) + 50)), (player.water = Math.min(100, (player.water || 0) + 40)), say([["Cozinheira Benta", pk(["Ensopado de cordeiro com pão quentinho. Come tudo!", "Torta de frango e suco de maçã. Do jeito que a Alteza gosta.", "Sopa de cebola, a receita da minha avó."])]])) },
      { t: "Pedir um doce", icon: "cake", fn: () => (need("fun", 12), need("hunger", 15), say([["Cozinheira Benta", "Bolo de mel, mas não conta pro mordomo que eu dei antes do jantar."]])) },
      { t: "Ajudar a cozinhar", icon: "stew", fn: () => (need("fun", 10), addItem("ensopado") , say([["Cozinheira Benta", "Olha só, tem jeito pra coisa! Leve um ensopado."]])) },
    ],
    camareira: [
      { t: "Preparar o banho", icon: "drop", fn: () => (need("hygiene", 100), need("fun", 8), say([["Camareira Lis", "Água quente, sais de lavanda e toalhas novas. O banho está pronto."]])) },
      { t: "Escolher a roupa do dia", icon: "shirt", fn: () => showCreate("wardrobe") },
      { t: "Arrumar os aposentos", icon: "house", fn: () => (need("energy", 10), say([["Camareira Lis", "Lençóis trocados e janelas abertas. Descanse bem, Alteza."]])) },
    ],
    criado: [
      { t: "Tocar música no salão", icon: "note", fn: () => (playTune(), need("fun", 20), say([["Criado Teo", "Uma valsa para a Alteza. *toca o piano com floreios exagerados*"]])) },
      { t: "Chamar a turma para uma festa", icon: "party", fn: () => (need("fun", 35), Object.keys(FRIENDS).filter((k) => CREW_ALL.includes(k) && !isDead(k)).forEach((k) => addFriendship(k, 2)), passTime(2, "A turma chega com hidromel e risadas..."), say([["Lucas Marzocca", "Festa no castelo?! Eu nunca saio daqui!"], ["Criado Teo", "Alguém escondeu o Marzoca da guarda de novo..."]])) },
    ],
  }[s.id];
  const opts = items.concat([
    { t: `Interações… (${INTERACTIONS.filter((r) => interAvailable(r, s.npc)).length})`, icon: "chat", fn: () => ((game.ipAnchor = { x: s.x, y: s.y, id: s.npc }), openInterPanel(s.npc)) },
    { t: "Matar…", icon: "skull", fn: () => killMenu(s.npc) },
    { t: "Sair", fn: null },
  ]);
  choice(s.nm, "Um empregado da Ala Real. Às suas ordens.", opts);
}
{
  const tgtBase = targetAt;
  targetAt = function (x, y) {
    if (player.zone === "alareal") {
      const s = servantAt(x, y);
      if (s && !isDead(s.npc)) return s.nm;
      const f = rwFurnAt(x, y);
      if (f) return furnName(f[0]);
      if (x === 0 && (y === 10 || y === 11)) return "Descer para o pátio do castelo";
    }
    return tgtBase(x, y);
  };
  const interBase = interactAt;
  interactAt = function (x, y) {
    if (player.zone === "alareal") {
      const s = servantAt(x, y);
      if (s && !isDead(s.npc)) return servantMenu(s);
      const f = rwFurnAt(x, y);
      if (f) return furnUse({ id: f[0], x, y });
      if (x === 0 && (y === 10 || y === 11)) return leaveRoyalWing();
    }
    return interBase(x, y);
  };
  const charBase = characterAt;
  characterAt = (x, y) => !!servantAt(x, y) || charBase(x, y);
  const drawBase = crewDrawList;
  crewDrawList = function (list, t) {
    drawBase(list, t);
    if (player.zone !== "alareal") return;
    list.push({ y: -6, draw: () => drawWingDecor(t) });
    for (const [id, x, y] of RW_FURN) list.push({ y: furnWalk(id) ? -3 : y, draw: () => drawFurn({ id, x, y }, t) });
    for (const s of game.rwStaff || [])
      if (!isDead(s.npc))
        list.push({
          y: s.ry,
          draw: () => {
            drawSprite(wizardRects(s.robe, null, s.hair, null, s.dir, walkFrame(Math.abs(s.rx - s.x) > 0.05, t)), s.rx * TILE, s.ry * TILE, 2, s.dir === "left");
            // Avental branco ou gravata.
            ctx.fillStyle = s.id === "cozinheira" ? "#ffffff" : s.id === "mordomo" ? "#f2eee4" : "#c9a03a";
            ctx.fillRect(s.rx * TILE + 13, s.ry * TILE + 19, 6, s.id === "cozinheira" ? 8 : 3);
          },
        });
  };
}
function drawWingDecor(t) {
  // Placas com o nome de cada cômodo, tochas e a escada de saída.
  ctx.font = '700 9px "VT323", monospace';
  ctx.textAlign = "center";
  for (const r of RW_ROOMS) {
    const cx = ((r.x0 + r.x1 + 1) / 2) * TILE,
      cy = (r.y1 + 1) * TILE - 6;
    const w = ctx.measureText(r.n).width + 10;
    ctx.fillStyle = "rgba(40,24,12,.75)";
    ctx.fillRect(cx - w / 2, cy - 9, w, 12);
    ctx.fillStyle = "#f2c14e";
    ctx.fillText(r.n, cx, cy);
  }
  ctx.textAlign = "left";
  // Tapete vermelho do corredor.
  ctx.fillStyle = "rgba(168,40,42,.85)";
  ctx.fillRect(TILE, 10 * TILE + 6, (RW.w - 2) * TILE, TILE * 2 - 12);
  ctx.fillStyle = "#f2c14e";
  ctx.fillRect(TILE, 10 * TILE + 6, (RW.w - 2) * TILE, 2);
  ctx.fillRect(TILE, 12 * TILE - 8, (RW.w - 2) * TILE, 2);
  // Escada de saída no começo do corredor.
  for (let k = 0; k < 4; k++) {
    ctx.fillStyle = k % 2 ? "#8f897d" : "#a39d90";
    ctx.fillRect(4, 10 * TILE + k * 16, TILE - 8, 14);
  }
}
let rwAcc = 0;
function rwTick(dt) {
  if (player.zone !== "alareal" || !game.rwStaff) return;
  rwAcc += dt;
  for (const s of game.rwStaff) {
    s.rx += (s.x - s.rx) * Math.min(1, dt * 6);
    s.ry += (s.y - s.ry) * Math.min(1, dt * 6);
  }
  if (rwAcc < 0.6) return;
  rwAcc = 0;
  for (const s of game.rwStaff) {
    if (Math.random() < 0.5) continue;
    const [x0, y0, x1, y1] = s.room;
    const d = pk(DIRS4);
    const nx = s.x + d[0],
      ny = s.y + d[1];
    if (nx < x0 || nx > x1 || ny < y0 || ny > y1 || (nx === player.x && ny === player.y)) continue;
    const before = [s.x, s.y];
    s.x = -1;
    if (walkable("alareal", nx, ny)) [s.x, s.y] = [nx, ny];
    else [s.x, s.y] = before;
    s.dir = d[0] > 0 ? "right" : d[0] < 0 ? "left" : d[1] > 0 ? "down" : "up";
    if (Math.random() < 0.04)
      game.shouts = (game.shouts || []).concat([{ x: s.x, y: s.y, txt: pk({ mordomo: ["Tudo em ordem, Alteza.", "Alguém viu as colheres de prata?", "O jantar será às oito em ponto."], cozinheira: ["Quem mexeu no meu caldeirão?!", "Hoje tem torta!", "Sal, pimenta e paciência."], camareira: ["Mais lençóis pra lavar...", "Essa poeira não acaba nunca!", "A banheira está quente, Alteza!"], criado: ["*assobia uma valsa*", "Esse lustre precisa de vela nova.", "O piano está afinado!"] }[s.id]), t: 2.6 }]);
  }
}
{
  const updBase = update;
  update = function (dt) {
    updBase(dt);
    if (game.mode === "world" && !game.dialog) rwTick(dt);
    if (player.zone === "alareal" && !game.rwStaff && game.mode !== "title") enterRoyalWing();
  };
}
ZONES.alareal = genRoyalWing();

/* ======================================================================
   (antes: 51-alteza.js)
   ====================================================================== */

/**
 * ECOS DO ARCANO — 32-realeza-e-mundo-vivo.js
 *  - Quem nasce na realeza é reconhecido: a Rainha Aurélia trata você como
 *    sobrinho(a) e herdeiro(a); o povo se curva, chama de "Alteza" e a guarda bate continência.
 *  - Ala Real redesenhada: piso próprio em cada cômodo (parquet, mármore, azulejo,
 *    lajota), papel de parede, rodapé de madeira, janelas com cortinas, quadros,
 *    tapeçarias, colunas, arandelas e lustres de velas.
 */


function isRoyalBorn() {
  return lifeMode() && !!player.royalBirth;
}
function alteza() {
  return `${player.titleWord || genderWord("Príncipe", "Princesa", "Alteza")} ${player.name}`;
}

/* ===================== A RAINHA, SUA TIA ===================== */

{
  const castleBase = castleMenu;
  castleMenu = function () {
    if (!isRoyalBorn()) return castleBase();
    hookChoice(castleBase, (title, text, opts) => {
      const n = "Rainha Aurélia";
      const extra = [
        {
          t: "Abraçar a tia Aurélia",
          icon: "heart",
          fn: () => (addFriendship("rainha", 3), say([[n, pk([`${genderWord("Meu sobrinho", "Minha sobrinha", "Meu bem")} querid${genderWord("o", "a", "e")}! Venha cá. Você cresceu tanto!`, `${alteza()}... sempre que você entra, este salão fica mais claro.`, "Abraço de família no salão do trono. Os guardas fingem que não viram."])]])),
        },
        {
          t: "Perguntar sobre a sucessão ao trono",
          icon: "crown",
          fn: () => say([[n, `Se algo me acontecer, a coroa de Aurélia passa para você, ${alteza()}. Prepare-se. Um reino não se governa com bailes.`], [n, "...Mas um baile de vez em quando não faz mal a ninguém."]]),
        },
        {
          t: "Pedir conselho de família",
          icon: "scroll",
          fn: () => say([[n, pk(["Nunca confie num conselheiro que concorda com tudo.", "O povo não precisa te amar. Precisa confiar em você. É mais difícil.", "Os iluministas têm algumas ideias boas. Não conte para ninguém que eu disse isso.", "Case por amor, governe com a cabeça. Nunca o contrário."])]]),
        },
        {
          t: "Pedir aumento da mesada",
          icon: "coin",
          fn: () => {
            if (player.famDay.mesada === player.day) return say([[n, "Hoje já não, querid" + genderWord("o", "a", "e") + ". O tesouro tem limite."]]);
            player.famDay.mesada = player.day;
            if (friendship("rainha") >= 60 && Math.random() < 0.6) {
              player.gold += 150;
              saveGame();
              return say([[n, "Está bem, está bem. Mais 150 de ouro. E nada de gastar tudo na taverna com aquele Marzoca!"]]);
            }
            say([[n, "Mesada maior? Primeiro me mostre que sabe usar a que já tem."]]);
          },
        },
      ];
      return [title, `A Rainha Aurélia desce do trono para receber ${genderWord("o seu sobrinho", "a sua sobrinha", "você")}, ${alteza()}. Os guardas se curvam.`, extra.concat(opts)];
    });
  };
  const talkBase = NPCS.rainha && NPCS.rainha.talk;
  if (talkBase)
    NPCS.rainha.talk = function () {
      if (isRoyalBorn() && Math.random() < 0.7)
        return [["Rainha Aurélia", pk([`${alteza()}! Venha almoçar comigo amanhã. Família é família.`, `Não ande pela vila sem um guarda, ${genderWord("meu sobrinho", "minha sobrinha", "querid@")}. Você é ${genderWord("o herdeiro", "a herdeira", "herdeire")} do trono.`, "Seu pai teria orgulho de você. Ele também fugia das aulas de etiqueta.", "Os nobres andam cochichando sobre você. Bom sinal: quer dizer que importa."])]];
      return talkBase.apply(this, arguments);
    };
}

/* ===================== O POVO RECONHECE ===================== */

{
  const voceBase = TOPICS.voce;
  TOPICS.voce = function (id) {
    if (isRoyalBorn() && Math.random() < 0.5) {
      const L = [`Bom dia, ${alteza()}! *faz uma reverência*`, "Vossa Alteza por aqui, no meio do povo? Que honra!", `Alteza, a Rainha sua tia está bem?`, "*tira o chapéu* Alteza! Quer provar o meu pão? É de graça pra família real.", `Dizem que ${genderWord("o príncipe", "a princesa", "Vossa Alteza")} é mais simpátic${genderWord("o", "a", "e")} que a Rainha. Não conta pra ela!`, "Alteza, o meu filho sonha em trabalhar no castelo. Será que tem vaga?", "*cochicha* É a realeza! Arruma o cabelo!"];
      if (id && hasTrait(id, "rebelde")) L.push("Alteza... pois é. Nada pessoal, mas eu prefiro um conselho do povo.", `Mais ${genderWord("um príncipe", "uma princesa", "alguém da realeza")} passeando com o nosso imposto, hein?`);
      return pk(L);
    }
    return voceBase(id);
  };
  // Cumprimentos de quem passa perto.
  let acc = 0;
  const updBase = update;
  update = function (dt) {
    updBase(dt);
    if (!isRoyalBorn() || game.mode !== "world" || game.dialog || !ZONES[player.zone] || !ZONES[player.zone].town) return;
    acc += dt;
    if (acc < 7) return;
    acc = 0;
    const near = (game.walkers || []).filter((w) => Math.abs(w.x - player.x) + Math.abs(w.y - player.y) <= 4 && !(w.inside > 0));
    if (!near.length || Math.random() < 0.4) return;
    const w = pk(near);
    w.dir = Math.abs(player.x - w.x) >= Math.abs(player.y - w.y) ? (player.x > w.x ? "right" : "left") : player.y > w.y ? "down" : "up";
    w.sayT = 2.8;
    w.sayTxt = pk([`Bom dia, ${alteza()}!`, "*reverência* Alteza!", "Vossa Alteza!", `Viva ${genderWord("o príncipe", "a princesa", "a realeza")}!`, "Que honra, Alteza!", "Alteza, que roupa linda!"]);
    game.bubbles.push({ x: w.x, y: w.y, icon: "crown", t: 2 });
    if (Math.random() < 0.3) repAdd(0);
  };
  // No menu dos moradores sem nome, a primeira fala é de reverência.
  const wkBase = walkerContactItems;
  walkerContactItems = function (wk) {
    const items = wkBase(wk);
    if (isRoyalBorn())
      items.unshift({
        t: "Aceitar a reverência",
        icon: "crown",
        fn: () => say([[wk.nm, pk([`*se curva até o chão* ${alteza()}! A senhora/o senhor falou comigo! Vou contar pra minha mãe!`, "Alteza! Desculpe a roupa simples, eu não sabia que ia encontrar a realeza hoje.", "*ajoelha* Que as runas protejam a família real!"]).replace("A senhora/o senhor", genderWord("O príncipe", "A princesa", "Vossa Alteza"))]]),
      });
    return items;
  };
}
/* O título aparece nas falas em que o jogo usa o seu nome. */
{
  const fillBase = typeof fillN === "function" ? fillN : null;
  if (fillBase)
    fillN = function (s) {
      const r = fillBase(s);
      return isRoyalBorn() && typeof r === "string" ? r.replace(new RegExp(`\\b${player.name}\\b`), alteza()) : r;
    };
}

/* ===================== ALA REAL BONITA ===================== */

const RW_STYLE = {
  "Quarto Real": { floor: "parquet", wall: "#7a1e34", pat: "#9a2e48", trim: "#c9a03a" },
  Banheiro: { floor: "azulejo", wall: "#2a5a7a", pat: "#3a7a9a", trim: "#e8e4dc" },
  "Quarto de Hóspedes": { floor: "parquet2", wall: "#2a4a3a", pat: "#3a6a4a", trim: "#c9a03a" },
  "Sala de Jantar": { floor: "xadrez", wall: "#5a2a5a", pat: "#7a3a7a", trim: "#c9a03a" },
  Cozinha: { floor: "lajota", wall: "#c9b48a", pat: "#b8a070", trim: "#6b4423" },
  "Salão de Festas": { floor: "marmore", wall: "#2a2a5a", pat: "#3a3a7a", trim: "#f2c14e" },
};
function rwRoomAt(x, y) {
  return RW_ROOMS.find((r) => x >= r.x0 && x <= r.x1 && y >= r.y0 && y <= r.y1);
}
function rwFloor(kind, X, Y, x, y) {
  const c = (col, a, b, w, h) => {
    ctx.fillStyle = col;
    ctx.fillRect(X + a, Y + b, w, h);
  };
  switch (kind) {
    case "parquet":
    case "parquet2": {
      const base = kind === "parquet" ? "#8a5a32" : "#a8784a",
        d = shade(base, -0.18),
        l = shade(base, 0.12);
      c(base, 0, 0, 32, 32);
      for (let k = 0; k < 4; k++) {
        const off = ((x + y + k) % 2) * 12;
        c(d, 0, k * 8 + 7, 32, 1);
        c(d, off + 6, k * 8, 1, 8);
        c(l, 0, k * 8, 32, 1);
      }
      break;
    }
    case "azulejo":
      for (let a = 0; a < 2; a++)
        for (let b = 0; b < 2; b++) {
          c((x + y + a + b) % 2 ? "#e8f2f8" : "#bcdcec", a * 16, b * 16, 16, 16);
          c("#8ab0c4", a * 16, b * 16, 16, 1);
          c("#8ab0c4", a * 16, b * 16, 1, 16);
        }
      c("#5a8ab0", 15, 15, 2, 2);
      break;
    case "xadrez":
      for (let a = 0; a < 2; a++) for (let b = 0; b < 2; b++) c((a + b) % 2 ? "#2a2430" : "#efe8dc", a * 16, b * 16, 16, 16);
      c("rgba(255,255,255,.12)", 2, 3, 10, 1);
      break;
    case "lajota":
      c("#b4643f", 0, 0, 32, 32);
      c("#8a4a2a", 0, 15, 32, 2);
      c("#8a4a2a", 15, 0, 2, 32);
      c("rgba(255,220,180,.15)", 2, 2, 12, 2);
      break;
    case "marmore": {
      c("#f2ebdc", 0, 0, 32, 32);
      c("rgba(150,140,120,.25)", (x * 7) % 20, 4, 12, 1);
      c("rgba(150,140,120,.2)", 4, (y * 5) % 24 + 4, 1, 8);
      c("#d8cfb8", 0, 0, 32, 1);
      c("#d8cfb8", 0, 0, 1, 32);
      // Losango dourado nos cruzamentos.
      ctx.fillStyle = "#c9a03a";
      fillPolygon(X - 4, Y, X, Y - 4, X + 4, Y, X, Y + 4);
      break;
    }
    default: {
      c((x + y) % 2 ? "#efe6d2" : "#e2d8c2", 0, 0, 32, 32);
      c("#cfc3a8", 0, 0, 32, 1);
    }
  }
}
function drawRoyalWingNice(t) {
  const z = ZONES.alareal;
  const T = TILE;
  const isWall = (x, y) => !z.map[y] || z.map[y][x] === "#";
  for (let y = 0; y < RW.h; y++)
    for (let x = 0; x < RW.w; x++) {
      const X = x * T,
        Y = y * T;
      if (!isWall(x, y)) {
        const r = rwRoomAt(x, y);
        rwFloor(r ? RW_STYLE[r.n].floor : "corredor", X, Y, x, y);
        continue;
      }
      const below = !isWall(x, y + 1) && y + 1 < RW.h;
      if (below) {
        // Parede da frente com papel de parede, rodapé e moldura.
        const r = rwRoomAt(x, y + 1) || { n: "corredor" };
        const S = RW_STYLE[r.n] || { wall: "#4a2a3a", pat: "#6a3a4a", trim: "#c9a03a" };
        ctx.fillStyle = S.wall;
        ctx.fillRect(X, Y, T, T);
        ctx.fillStyle = S.pat;
        for (let k = 0; k < 3; k++) for (let j = 0; j < 2; j++) ctx.fillRect(X + 5 + k * 10 + (j % 2) * 5, Y + 6 + j * 9, 3, 3);
        ctx.fillStyle = "#3a2414";
        ctx.fillRect(X, Y + T - 8, T, 8);
        ctx.fillStyle = "#5a3a22";
        ctx.fillRect(X, Y + T - 8, T, 2);
        ctx.fillStyle = S.trim;
        ctx.fillRect(X, Y + 1, T, 2);
        ctx.fillRect(X, Y + T - 10, T, 1);
        // Janelas com cortinas na parede de fora; quadros e arandelas nas outras.
        if (y === 1 && x % 4 === 2) {
          ctx.fillStyle = "#e8d8b0";
          ctx.fillRect(X + 6, Y + 3, 20, 17);
          ctx.fillStyle = nightAlpha() > 0.3 ? "#1a2a4a" : "#9fd0f0";
          ctx.fillRect(X + 8, Y + 5, 16, 13);
          ctx.fillStyle = "rgba(255,255,255,.4)";
          ctx.fillRect(X + 9, Y + 6, 4, 10);
          ctx.fillStyle = "#e8d8b0";
          ctx.fillRect(X + 15, Y + 5, 2, 13);
          ctx.fillStyle = "#a82a3a";
          ctx.fillRect(X + 3, Y + 2, 5, 20);
          ctx.fillRect(X + 24, Y + 2, 5, 20);
          ctx.fillStyle = "#c9a03a";
          ctx.fillRect(X + 2, Y + 2, 28, 2);
        } else if ((x * 7 + y * 3) % 9 === 0) {
          ctx.fillStyle = "#c9a03a";
          ctx.fillRect(X + 7, Y + 4, 18, 14);
          ctx.fillStyle = ["#3a6a9a", "#6a3a2a", "#3a6a3a", "#7a5a9a"][(x + y) % 4];
          ctx.fillRect(X + 9, Y + 6, 14, 10);
          ctx.fillStyle = "#f2d6c2";
          ctx.fillRect(X + 14, Y + 8, 4, 4);
        } else if ((x * 5 + y) % 7 === 0) {
          ctx.fillStyle = "#c9a03a";
          ctx.fillRect(X + 14, Y + 10, 4, 6);
          ctx.fillStyle = `rgba(255,${190 + Math.floor(Math.sin(t * 8 + x) * 30)},90,1)`;
          ctx.beginPath();
          ctx.arc(X + 16, Y + 8 + Math.sin(t * 9 + x) * 0.6, 2.5, 0, 7);
          ctx.fill();
          const g = ctx.createRadialGradient(X + 16, Y + 9, 1, X + 16, Y + 9, 22);
          g.addColorStop(0, "rgba(255,200,110,.35)");
          g.addColorStop(1, "rgba(255,200,110,0)");
          ctx.fillStyle = g;
          ctx.fillRect(X - 6, Y - 13, 44, 44);
        }
      } else {
        // Topo das paredes: pedra escura com borda dourada.
        ctx.fillStyle = "#2e2433";
        ctx.fillRect(X, Y, T, T);
        ctx.fillStyle = "#3e3245";
        ctx.fillRect(X + 2, Y + 2, T - 4, T - 4);
        ctx.fillStyle = "rgba(201,160,58,.5)";
        if (!isWall(x - 1, y)) ctx.fillRect(X, Y, 2, T);
        if (!isWall(x + 1, y)) ctx.fillRect(X + T - 2, Y, 2, T);
      }
    }
  // Corredor: tapete vermelho com franjas e colunas.
  ctx.fillStyle = "#8a1e2a";
  ctx.fillRect(T, 10 * T + 6, (RW.w - 2) * T, T * 2 - 12);
  ctx.fillStyle = "#a82a3a";
  ctx.fillRect(T, 10 * T + 10, (RW.w - 2) * T, T * 2 - 20);
  ctx.fillStyle = "#f2c14e";
  ctx.fillRect(T, 10 * T + 6, (RW.w - 2) * T, 2);
  ctx.fillRect(T, 12 * T - 8, (RW.w - 2) * T, 2);
  for (let x = 2; x < RW.w - 1; x += 3) {
    ctx.fillStyle = "#c9a03a";
    ctx.fillRect(x * T + 14, 10 * T + 18, 4, 4);
  }
  // Escada de saída.
  for (let k = 0; k < 4; k++) {
    ctx.fillStyle = k % 2 ? "#8f897d" : "#a39d90";
    ctx.fillRect(4, 10 * T + k * 16, T - 8, 14);
  }
  // Colunas de mármore no salão de festas.
  for (const [x, y] of [
    [25, 14],
    [31, 14],
    [25, 19],
    [31, 19],
  ]) {
    const X = x * T,
      Y = y * T;
    ctx.fillStyle = "rgba(0,0,0,.2)";
    ctx.fillRect(X + 8, Y + 26, 18, 4);
    ctx.fillStyle = "#e8e0cc";
    ctx.fillRect(X + 10, Y - 14, 12, 40);
    ctx.fillStyle = "#cfc3a8";
    ctx.fillRect(X + 13, Y - 14, 2, 40);
    ctx.fillRect(X + 18, Y - 14, 2, 40);
    ctx.fillStyle = "#c9a03a";
    ctx.fillRect(X + 7, Y - 18, 18, 5);
    ctx.fillRect(X + 7, Y + 24, 18, 4);
  }
  // Placas dos cômodos.
  ctx.font = '700 9px "VT323", monospace';
  ctx.textAlign = "center";
  for (const r of RW_ROOMS) {
    const cx = ((r.x0 + r.x1 + 1) / 2) * T,
      cy = (r.y1 + 1) * T - 4;
    const w = ctx.measureText(r.n).width + 12;
    ctx.fillStyle = "#3a2414";
    ctx.fillRect(cx - w / 2, cy - 10, w, 13);
    ctx.fillStyle = "#c9a03a";
    ctx.fillRect(cx - w / 2, cy - 10, w, 1);
    ctx.fillRect(cx - w / 2, cy + 2, w, 1);
    ctx.fillStyle = "#f2c14e";
    ctx.fillText(r.n, cx, cy);
  }
  ctx.textAlign = "left";
}
function drawChandeliers(t) {
  const T = TILE;
  for (const r of RW_ROOMS) {
    if (r.n === "Banheiro") continue;
    const cx = ((r.x0 + r.x1 + 1) / 2) * T,
      cy = (r.y0 + 1.6) * T;
    const g = ctx.createRadialGradient(cx, cy, 4, cx, cy, 110);
    g.addColorStop(0, "rgba(255,214,140,.22)");
    g.addColorStop(1, "rgba(255,214,140,0)");
    ctx.fillStyle = g;
    ctx.fillRect(cx - 110, cy - 110, 220, 220);
    ctx.fillStyle = "#c9a03a";
    ctx.fillRect(cx - 1, cy - 30, 2, 18);
    ctx.fillRect(cx - 16, cy - 12, 32, 3);
    ctx.beginPath();
    ctx.arc(cx, cy - 10, 5, 0, Math.PI);
    ctx.fill();
    for (let k = -2; k <= 2; k++) {
      const x = cx + k * 7;
      ctx.fillStyle = "#f6f2ea";
      ctx.fillRect(x - 1, cy - 18, 3, 6);
      ctx.fillStyle = `rgba(255,${200 + Math.floor(Math.sin(t * 10 + k) * 30)},90,1)`;
      ctx.beginPath();
      ctx.arc(x + 0.5, cy - 20 + Math.sin(t * 12 + k) * 0.5, 2, 0, 7);
      ctx.fill();
    }
    ctx.fillStyle = "rgba(191,224,240,.8)";
    for (let k = -1; k <= 1; k++) ctx.fillRect(cx + k * 10, cy - 6, 2, 4);
  }
}
drawWingDecor = drawRoyalWingNice;
{
  const drawBase = crewDrawList;
  crewDrawList = function (list, t) {
    drawBase(list, t);
    if (player.zone === "alareal") list.push({ y: 999, draw: () => drawChandeliers(t) });
  };
}

/* ======================================================================
   (antes: 52-mundo-vivo.js)
   ====================================================================== */

/**
 * ECOS DO ARCANO — 32-realeza-e-mundo-vivo.js
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
