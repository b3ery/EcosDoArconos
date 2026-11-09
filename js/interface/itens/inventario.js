/**
 * ECOS DO ARCANO — inventario.js
 * Inventário em grade: o personagem no meio com os 4 espaços de equipamento em volta,
 * uma grade de quadradinhos com todos os itens (ícone + quantidade), filtros por
 * categoria em abas com ícones e um painel com o item escolhido (usar, equipar,
 * tirar, descartar). Setas andam pela grade, Enter usa/equipa, duplo clique também.
 * As outras abas (amizades, status, aparência) ganharam cartões.
 * Modifica (envolve) funções de outros arquivos: renderInv.
 */

"use strict";

const INV_FILTERS = [
  ["all", "Tudo", "bag", () => true],
  ["food", "Comida", "bread", (it) => it.tipo === "food"],
  ["cons", "Poções", "potion", (it) => it.tipo === "cons"],
  ["equip", "Equipamento", "armor", (it) => it.tipo === "equip"],
  ["mat", "Materiais", "gem", (it) => it.tipo === "mat"],
  ["gift", "Presentes", "gift", (it) => it.tipo === "gift"],
  ["movel", "Móveis", "chair", (it) => it.tipo === "movel"],
  ["other", "Outros", "rod", (it) => ["tool", "pet"].includes(it.tipo)],
];
const EQ_SLOTS = [
  ["cajado", "Cajado", "staff"],
  ["manto", "Manto", "robe"],
  ["armadura", "Armadura", "armor"],
  ["amuleto", "Amuleto", "amulet"],
];
const INV_COLS = 9;

function invItems() {
  const f = INV_FILTERS.find((q) => q[0] === (game.invFilter || "all")) || INV_FILTERS[0];
  return Object.keys(player.inv)
    .filter((id) => ITEMS[id] && itemCount(id) > 0 && f[3](ITEMS[id]))
    .sort((a, b) => {
      const ta = INV_FILTERS.findIndex((q, i) => i && q[3](ITEMS[a])),
        tb = INV_FILTERS.findIndex((q, i) => i && q[3](ITEMS[b]));
      return ta - tb || ITEMS[a].nome.localeCompare(ITEMS[b].nome);
    });
}
function isEquipped(id) {
  return Object.values(player.eq).includes(id);
}
function invTabsHTML(t) {
  return `<div class="inv-tabs">${[
    ["itens", "Bolsa", "bag"],
    ...(lifeMode() ? [] : [["hab", "Habilidades", "sparkle"]]),
    ["amigos", "Amizades", "heart"],
    ["familia", "Família", "house"],
    ["visual", "Aparência", "shirt"],
    ["status", "Status", "star"],
  ]
    .map(([k, n, ic]) => `<button data-t="${k}" class="${t === k ? "on" : ""}" title="${n}">${iconHTML(ic, 20)}<span>${n}</span></button>`)
    .join("")}</div>`;
}

/** A aba principal: personagem, equipamentos e grade. */
function invBagHTML() {
  const ids = invItems();
  if (game.invSel && !player.inv[game.invSel] && !String(game.invSel).startsWith("eq:")) game.invSel = null;
  const sel = game.invSel;
  const slot = (s) => {
    const [k, n, ic] = s;
    const id = player.eq[k];
    return `<button class="inv-eq ${sel === "eq:" + k ? "sel" : ""}" data-eq="${k}" title="${n}${id ? ": " + ITEMS[id].nome : ""}">${id ? iconHTML(itemIcon(id), 34) : `<span class="ghost">${iconHTML(ic, 30)}</span>`}<em>${n}</em></button>`;
  };
  const total = Math.max(INV_COLS * 4, Math.ceil(ids.length / INV_COLS) * INV_COLS);
  const cells = [];
  for (let i = 0; i < total; i++) {
    const id = ids[i];
    if (!id) {
      cells.push(`<div class="inv-cell empty"></div>`);
      continue;
    }
    const it = ITEMS[id];
    const r = rarityOf(it.preco || 0, it.lend);
    cells.push(
      `<button class="inv-cell ${sel === id ? "sel" : ""} ${isEquipped(id) ? "eqd" : ""}" data-i="${id}" style="--rc:${r.c}" title="${it.nome}">${iconHTML(itemIcon(id), 34)}${itemCount(id) > 1 ? `<b>${itemCount(id)}</b>` : ""}${isEquipped(id) ? "<i>E</i>" : ""}</button>`,
    );
  }
  const stats = [
    ["heart", "Vida", `${player.hp}/${maxHp()}`],
    ...(lifeMode() ? [] : [["star", "Magia", `${player.mp}/${maxMp()}`]]),
    ["bolt", "Dano", `+${Math.round(equipStat("pow") * 100)}%`],
    ["armor", "Defesa", `${Math.round(equipStat("def") * 100)}%`],
    ["meat", "Fome", `${Math.round(player.food)}`],
    ["water", "Sede", `${Math.round(player.water)}`],
    ["coin", "Ouro", `${player.gold}`],
  ];
  return `<div class="inv-top">
      <div class="inv-doll">
        <div class="inv-col">${slot(EQ_SLOTS[0])}${slot(EQ_SLOTS[1])}</div>
        <div class="inv-pv"><canvas id="ivpv" width="120" height="120"></canvas><span>${player.name}</span></div>
        <div class="inv-col">${slot(EQ_SLOTS[2])}${slot(EQ_SLOTS[3])}</div>
      </div>
      <div class="inv-stats">${stats.map(([ic, n, v]) => `<div>${iconHTML(ic, 16)}<span>${n}</span><b>${v}</b></div>`).join("")}</div>
    </div>
    <div class="inv-filters">${INV_FILTERS.map(([k, n, ic]) => {
      const cnt = Object.keys(player.inv).filter((id) => ITEMS[id] && itemCount(id) > 0 && INV_FILTERS.find((q) => q[0] === k)[3](ITEMS[id])).length;
      return `<button data-f="${k}" class="${(game.invFilter || "all") === k ? "on" : ""}" title="${n}" ${cnt || k === "all" ? "" : "disabled"}>${iconHTML(ic, 18)}<span>${n}</span><em>${cnt}</em></button>`;
    }).join("")}</div>
    <div class="inv-grid">${cells.join("")}</div>
    <div class="inv-detail" id="ivdetail">${invDetailHTML()}</div>`;
}
function invDetailHTML() {
  const sel = game.invSel;
  if (!sel) return `<div class="inv-hint">${iconHTML("eye", 18)} Clique num item para ver os detalhes. Duplo clique usa ou equipa. Setas andam pela grade.</div>`;
  let id = sel,
    eqSlot = null;
  if (String(sel).startsWith("eq:")) {
    eqSlot = sel.slice(3);
    id = player.eq[eqSlot];
    if (!id) return `<div class="inv-hint">${iconHTML(EQ_SLOTS.find((s) => s[0] === eqSlot)[2], 18)} Espaço de ${EQ_SLOTS.find((s) => s[0] === eqSlot)[1].toLowerCase()} vazio. Escolha um equipamento na grade.</div>`;
  }
  const it = ITEMS[id];
  const r = rarityOf(it.preco || 0, it.lend);
  const chips = (typeof itemStatChips === "function" ? itemStatChips(it) : []).map(([ic, tx]) => `<span class="st-chip">${iconHTML(ic, 14)}${tx}</span>`).join("");
  const btns = [];
  if (it.tipo === "equip") btns.push(isEquipped(id) ? (it.slot !== "cajado" || lifeMode() ? `<button data-act="unequip">Tirar</button>` : "") : `<button class="go" data-act="equip">Equipar</button>`);
  else if (["food", "cons"].includes(it.tipo) && id !== "fenix") btns.push(`<button class="go" data-act="use">${it.tipo === "food" ? "Comer / beber" : "Usar"}</button>`);
  else if (it.tipo === "movel") btns.push(`<span class="inv-note">Coloque em casa com R</span>`);
  else if (it.tipo === "gift") btns.push(`<span class="inv-note">Dê de presente pelo menu da pessoa</span>`);
  if (!isEquipped(id) && !it.lend && !["vara", "fragmento"].includes(id)) btns.push(`<button class="bad" data-act="drop">Descartar 1</button>`);
  return `<div class="inv-big" style="--rc:${r.c}">${iconHTML(itemIcon(id), 52)}</div>
    <div class="inv-info"><div class="st-title"><span>${it.nome}</span><em style="--rc:${r.c}">${r.n}</em>${itemCount(id) > 1 ? `<small>×${itemCount(id)}</small>` : ""}</div>
    <div class="st-meta">${(typeof ITEM_TYPE_NAMES !== "undefined" && ITEM_TYPE_NAMES[it.tipo]) || ""}${it.slot ? " · " + it.slot : ""} · vale ${Math.floor((it.preco || 0) / 2)} ouro</div>
    <p class="st-desc">${it.desc || ""}</p>${chips ? `<div class="st-chips">${chips}</div>` : ""}</div>
    <div class="inv-btns">${btns.join("")}</div>`;
}
function invAct(act) {
  let id = game.invSel;
  if (String(id).startsWith("eq:")) id = player.eq[id.slice(3)];
  if (!id) return;
  const it = ITEMS[id];
  if (act === "use" || (act === "auto" && ["food", "cons"].includes(it.tipo))) {
    const r = useItemEffect(id);
    playSound(660, 0.12, "sine");
    toast(r || "Nada aconteceu.");
  } else if (act === "equip" || (act === "auto" && it.tipo === "equip" && !isEquipped(id))) {
    player.eq[it.slot] = id;
    player.hp = Math.min(player.hp, maxHp());
    player.mp = Math.min(player.mp, maxMp());
    playSound(780, 0.1, "sine");
    toast(`Equipou: ${it.nome}`, 1400);
  } else if (act === "unequip") {
    player.eq[it.slot] = null;
    player.hp = Math.min(player.hp, maxHp());
    player.mp = Math.min(player.mp, maxMp());
    playSound(520, 0.1, "sine");
  } else if (act === "drop") {
    removeItem(id);
    playSound(300, 0.08, "triangle");
    toast(`Descartou 1 ${it.nome}.`, 1400);
  } else return;
  saveGame();
  renderInv();
}

/** Amizades em cartões com barra de amizade. */
function invFriendsHTML() {
  const ids = Object.keys(FRIENDS).sort((a, b) => friendship(b) - friendship(a));
  return `<div class="qtip">Converse todo dia, dê presentes e trabalhe junto para subir a amizade. Melhores amigos dão itens únicos.</div><div class="fr-grid">${ids
    .map((id) => {
      const lv = friendshipLevel(id),
        f = friendship(id);
      const st = player.spouse === id ? "Casados" : player.dating === id ? "Namorando" : REL_LV[lv][1];
      return `<div class="fr-card ${lv >= 3 ? "best" : ""}"><canvas class="fr-pv" data-npc="${id}" width="48" height="48"></canvas><div class="fr-i"><b>${NPCS[id].nome.split(",")[0]}</b><small>${st} · favorito: ${lv >= 1 && ITEMS[FRIENDS[id].fav] ? ITEMS[FRIENDS[id].fav].nome : "???"}</small><div class="ip-bar"><i style="width:${f}%"></i><span>${iconHTML("heart", 10)}${f}</span></div></div></div>`;
    })
    .join("")}</div><h3>Montaria</h3><div class="qtip">${player.horse ? "Você tem um cavalo. Aperte C para montar ou desmontar." : "Sem cavalo. O Tião vende um no estábulo por 250 de ouro."}</div>`;
}
function invStatusHTML() {
  const cards = [
    ...(lifeMode() ? [["clock", "Idade", `${playerAge ? playerAge() : 18} anos`]] : [["star", "Nível", `${player.lvl} (${player.xp}/${xpToNextLevel(player.lvl)} XP)`]]),
    ["heart", "Vida", `${player.hp}/${maxHp()}`],
    ...(lifeMode() ? [] : [["sparkle", "Magia", `${player.mp}/${maxMp()}`], ["bolt", "Afinidade", RUNES[player.aff] ? RUNES[player.aff].nome + " (+25%)" : "—"]]),
    ["sword", "Bônus de dano", `+${Math.round(equipStat("pow") * 100)}%`],
    ["armor", "Redução de dano", `${Math.round(equipStat("def") * 100)}%`],
    ["coin", "Ouro", player.gold],
    ["flag", "Reputação", `${player.rep ?? 50} · ${repLabel()}`],
    ["crown", "Conquistas", `${Object.keys(player.ach || {}).length}`],
    ["sun", "Estação", `${season().n} (dia ${seasonDay()}/7)`],
    [WEATHER_ICONS[player.weather] || "sun", "Clima", currentWeather().n],
    ["party", "Próximo festival", festivalToday() ? "hoje!" : "em " + daysToFest() + " dia(s)"],
    ["skull", "Dificuldade", difficulty().n],
  ];
  return `<div class="sc-grid">${cards.map(([ic, n, v]) => `<div class="sc"><span class="sc-ic">${iconHTML(ic, 22)}</span><div><small>${n}</small><b>${v}</b></div></div>`).join("")}</div><div class="qtip">${currentWeather().fx}</div>`;
}
function invVisualHTML() {
  const L = player.look;
  const part = (cat, label) => {
    const e = (COSMETICS[cat] || []).find((o) => o[0] === L[cat]);
    const sw = cat === "hair" || cat === "robe" || cat === "eyes";
    return `<div class="vs-row">${iconHTML(COSMETIC_ICONS[cat] || "shirt", 18)}<span>${label}</span><b>${sw ? `<i class="vs-sw" style="background:${L[cat]}"></i>` : ""}${e ? e[1] : L[cat] || "—"}</b></div>`;
  };
  return `<div class="vs">
    <div class="vs-mirror"><canvas id="ivpv" width="160" height="160"></canvas><div class="vs-rot">${["down", "left", "up", "right"].map((d) => `<button data-dir="${d}">${{ down: "Frente", left: "Lado", up: "Costas", right: "Outro lado" }[d]}</button>`).join("")}</div></div>
    <div class="vs-list"><h3>Seu visual</h3>${part("hstyle", "Penteado")}${part("hair", "Cor do cabelo")}${part("eyes", "Olhos")}${part("hat", "Chapéu")}${part("outfit", "Roupa")}${part("robe", "Cor da roupa")}${part("acc", "Acessório")}
    <button id="ivward" class="vs-btn">${iconHTML("shirt", 18)}Abrir guarda-roupa</button>
    <div class="qtip">Roupas e chapéus na Alfaiataria, cortes e cores no Salão Tesoura de Ouro e novidades na Moda Brisamar (Porto).</div></div></div>`;
}

const _renderInvBase = renderInv;
renderInv = function () {
  let t = game.invTab;
  if (t === "equip") t = game.invTab = "itens";
  if (!["itens", "amigos", "status", "visual"].includes(t)) {
    // Habilidades e Família continuam como antes, só com as abas novas.
    _renderInvBase();
    const box = byId("inv");
    const old = box.querySelector(".tabs");
    if (old) old.outerHTML = invTabsHTML(t);
    const gh = box.querySelector(".gh");
    if (gh) gh.outerHTML = `<div class="gh"><h2>${iconHTML("bag", 22)} ${player.name}</h2><span class="inv-gold">${iconHTML("coin", 16)}<b>${player.gold}</b></span><button id="ivclose">Fechar (I)</button></div>`;
    const sub = box.querySelector(".gsub");
    if (sub) sub.remove();
    byId("ivclose").onclick = closeInv;
    box.classList.add("inv-new");
    wireInvTabs();
    return;
  }
  const body = t === "itens" ? invBagHTML() : t === "amigos" ? invFriendsHTML() : t === "status" ? invStatusHTML() : invVisualHTML();
  const box = byId("inv");
  box.classList.add("inv-new");
  box.innerHTML = `<div class="gh"><h2>${iconHTML("bag", 22)} ${player.name}</h2><span class="inv-gold">${iconHTML("coin", 16)}<b>${player.gold}</b></span><button id="ivclose">Fechar (I)</button></div>${invTabsHTML(t)}<div class="inv-body inv-${t}">${body}</div>`;
  byId("ivclose").onclick = closeInv;
  wireInvTabs();
  if (byId("ivpv")) drawPreview(byId("ivpv"), player.look, game.invDir || "down");
  box.querySelectorAll("[data-npc]").forEach((cv) => drawKeeper(cv, NPCS[cv.dataset.npc].nome));
  box.querySelectorAll("[data-dir]").forEach((b) => (b.onclick = () => ((game.invDir = b.dataset.dir), drawPreview(byId("ivpv"), player.look, game.invDir))));
  if (byId("ivward"))
    byId("ivward").onclick = () => {
      byId("inv").style.display = "none";
      showCreate("wardrobe");
    };
  box.querySelectorAll("[data-f]").forEach((b) => (b.onclick = () => ((game.invFilter = b.dataset.f), (game.invSel = null), playSound(600, 0.03, "sine"), renderInv())));
  box.querySelectorAll("[data-i]").forEach((b) => {
    b.onclick = () => {
      game.invSel = b.dataset.i;
      playSound(560, 0.03, "sine");
      renderInv();
    };
    b.ondblclick = () => ((game.invSel = b.dataset.i), invAct("auto"));
  });
  box.querySelectorAll("[data-eq]").forEach((b) => (b.onclick = () => ((game.invSel = "eq:" + b.dataset.eq), renderInv())));
  box.querySelectorAll("[data-act]").forEach((b) => (b.onclick = () => invAct(b.dataset.act)));
  const selEl = box.querySelector(".inv-cell.sel");
  if (selEl) selEl.scrollIntoView({ block: "nearest" });
};
function wireInvTabs() {
  byId("inv")
    .querySelectorAll(".inv-tabs [data-t]")
    .forEach((b) => (b.onclick = () => ((game.invTab = b.dataset.t), playSound(520, 0.03, "sine"), renderInv())));
}
/** Setas andam pela grade; Enter usa ou equipa. */
{
  const invKeys = KEY_HANDLERS.inv;
  KEY_HANDLERS.inv = (k, e) => {
    if (game.invTab === "itens" && ["arrowleft", "arrowright", "arrowup", "arrowdown", "enter"].includes(k)) {
      const ids = invItems();
      if (!ids.length) return;
      let i = ids.indexOf(game.invSel);
      if (k === "enter") return i >= 0 && invAct("auto");
      if (i < 0) i = 0;
      else i += { arrowleft: -1, arrowright: 1, arrowup: -INV_COLS, arrowdown: INV_COLS }[k];
      game.invSel = ids[Math.max(0, Math.min(ids.length - 1, i))];
      playSound(560, 0.02, "sine");
      return renderInv();
    }
    invKeys(k, e);
  };
}

/* ===================== CELULAR EM PÉ: TELAS GRANDES OCUPAM A TELA TODA ===================== */
{
  const PANEL_MODES = new Set(["inv", "shop", "create", "cal", "careers", "achs", "svs", "quests", "grim", "options", "guide", "mgame"]);
  let last = null;
  setInterval(() => {
    const tall = matchMedia("(pointer:coarse)").matches && innerHeight > innerWidth && PANEL_MODES.has(game.mode);
    if (tall === last) return;
    last = tall;
    document.body.classList.toggle("tallui", tall);
    byId("screen").style.aspectRatio = tall ? "auto" : innerWidth > innerHeight ? "auto" : "4 / 3";
  }, 150);
}
