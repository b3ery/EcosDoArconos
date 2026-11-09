/**
 * ECOS DO ARCANO — 50-origem-e-ala-real.js
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
