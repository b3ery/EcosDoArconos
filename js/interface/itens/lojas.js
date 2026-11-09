/**
 * ECOS DO ARCANO — lojas.js
 * Telas de compra caprichadas: vitrine com o atendente falando, carrossel em leque
 * (o item do meio fica grande, os vizinhos aparecem menores dos lados), painel de
 * detalhes com atributos, raridade, quantidade e imposto.
 * Vale para todas as lojas de itens e para as lojas de roupa e cabelo.
 */

"use strict";


const ITEM_TYPE_NAMES = {
  food: "Comida",
  cons: "Consumível",
  equip: "Equipamento",
  movel: "Móvel",
  gift: "Presente",
  mat: "Material",
  pet: "Mascote",
  tool: "Ferramenta",
};
const RARITY = [
  { max: 40, n: "Comum", c: "#b9b0cc" },
  { max: 150, n: "Incomum", c: "#7ad36b" },
  { max: 350, n: "Raro", c: "#5aa8ff" },
  { max: 800, n: "Épico", c: "#c27aff" },
  { max: 1e9, n: "Lendário", c: "#f2c14e" },
];
function rarityOf(price, lend) {
  return lend ? RARITY[4] : RARITY.find((r) => price <= r.max);
}
const KEEPER_LINES = {
  hello: ["Seja bem-vindo! Fique à vontade.", "Olha só quem apareceu! Dá uma olhada.", "Tudo fresquinho, chegou hoje.", "Precisando de alguma coisa?"],
  buy: ["Ótima escolha!", "Isso aí vai te servir bem.", "Volte sempre!", "Negócio fechado!", "Você tem bom gosto."],
  poor: ["Hm... falta ouro aí, hein.", "Fiado eu não vendo, viu?", "Volta quando tiver mais moedas."],
  sell: ["Hm, deixa eu ver... fechado.", "Isso eu consigo revender.", "Pago justo, pode confiar."],
  look: ["Esse aí é dos bons.", "Esse vende muito.", "Quer experimentar esse?", "Esse é o meu preferido."],
};

/** Quem atende em cada loja (para o retrato). */
function shopKeeperName(id) {
  if (id === "__cos") return { roupa: "Costureira Dália", cabelo: "Cabeleireira Nina", moda: "Estilista Marina" }[game.cosKind] || "Costureira Dália";
  if (KEEPERS[id]) return KEEPERS[id][0];
  const fr = Object.keys(FRIENDS).find((k) => FRIENDS[k].shop === id);
  if (fr) return NPCS[fr].nome;
  return (SHOPS[id] && SHOPS[id].nome) || "Atendente";
}
function keeperSays(kind) {
  game.keeperLine = pickOne(KEEPER_LINES[kind]);
}

/** Desenha o atendente (meio corpo) num canvas pequeno. */
function drawKeeper(cv, name) {
  if (!cv) return;
  const c2 = cv.getContext("2d");
  c2.clearRect(0, 0, cv.width, cv.height);
  const look = speakerLook(name) || {};
  const rects = look.hero
    ? heroRects(player.look, "down", null)
    : look.elf
      ? elfRects(look.robe, look.hair, "down")
      : wizardRects(look.robe || "#5a4a7a", look.hat ?? null, look.hair || "#3a2414", null, "down", 0, look.seed);
  const u = 5,
    ox = cv.width / 2 - 8 * u,
    oy = 6 + Math.sin(game.t * 2) * 0.8;
  for (const [x, y, w, h, col] of rects) {
    c2.fillStyle = col;
    c2.fillRect(ox + x * u, oy + y * u, w * u, h * u);
  }
}

/** Atributos do item como "chips". */
function itemStatChips(it) {
  const s = [];
  if (it.food) s.push(["bread", `Fome +${it.food}`]);
  if (it.water) s.push(["water", `Sede +${it.water}`]);
  if (it.hp) s.push(["heart", `${it.tipo === "equip" ? "Vida máx." : "Vida"} +${it.hp}`]);
  if (it.mp) s.push(["star", `${it.tipo === "equip" ? "Magia máx." : "Magia"} +${it.mp}`]);
  if (it.pow) s.push(["bolt", `Dano +${Math.round(it.pow * 100)}%`]);
  if (it.def) s.push(["armor", `Defesa ${Math.round(it.def * 100)}%`]);
  if (it.atk) s.push(["sword", `Ataque +${it.atk}`]);
  return s;
}

/* ===================== LOJA DE ITENS ===================== */

function shopAll() {
  const sh = SHOPS[game.shopId];
  return game.shopTab === "buy"
    ? sh.items.filter((id) => ITEMS[id])
    : Object.keys(player.inv).filter((id) => ITEMS[id] && itemCount(id) > (Object.values(player.eq).includes(id) ? 1 : 0));
}
/** Categoria de um item (para os filtros da loja). */
function itemCat(id) {
  const it = ITEMS[id];
  return it.cat || (it.slot ? { cajado: "Cajados", manto: "Roupas e armaduras", armadura: "Roupas e armaduras", amuleto: "Joias" }[it.slot] : null) || { movel: "Móveis", cons: "Poções", gift: "Presentes", mat: "Materiais", tool: "Ferramentas", food: "Comida", pet: "Mascotes" }[it.tipo] || "Outros";
}
function shopCats() {
  const seen = [];
  for (const id of shopAll()) if (!seen.includes(itemCat(id))) seen.push(itemCat(id));
  return seen;
}
function shopList() {
  const all = shopAll();
  if (!game.shopCat || !shopCats().includes(game.shopCat)) game.shopCat = null;
  return game.shopCat ? all.filter((id) => itemCat(id) === game.shopCat) : all;
}
function shopPrice(id) {
  const it = ITEMS[id];
  if (game.shopTab === "sell") return { pr: saleAfterTax(Math.floor(it.preco / 2)), base: Math.floor(it.preco / 2) };
  const base = Math.round(it.preco * discount(game.shopId));
  return { pr: withTax(base), base };
}
function canStack(it) {
  return game.shopTab === "sell" ? true : !["equip", "pet", "movel"].includes(it.tipo);
}

function renderShop() {
  const sh = SHOPS[game.shopId];
  const list = shopList();
  game.shopList = list;
  game.shopIdx = Math.max(0, Math.min(list.length - 1, game.shopIdx || 0));
  game.shopQty = game.shopQty || 1;
  if (!game.keeperLine) keeperSays("hello");
  const keeper = shopKeeperName(game.shopId);
  const cards = list
    .map((id, i) => {
      const it = ITEMS[id];
      const r = rarityOf(it.preco, it.lend);
      const lock = game.shopTab === "buy" && it.req && guardiansFreed() < it.req;
      return `<button class="st-card${lock ? " lock" : ""}" data-go="${i}" style="--rc:${r.c}">
        <span class="st-gem"></span>
        <span class="st-ic">${iconHTML(itemIcon(id), 64)}</span>
        <span class="st-nm">${it.nome}</span>
        <span class="st-tag">${iconHTML("coin", 12)}${shopPrice(id).pr}</span>
        ${lock ? `<span class="st-lock">${iconHTML("lock", 22)}</span>` : ""}
      </button>`;
    })
    .join("");
  byId("shop").innerHTML = `<div class="store slider">
    <header class="st-head">
      <div class="st-sign"><span class="st-sign-ic">${iconHTML(game.shopTab === "buy" ? "bag" : "coin", 22)}</span><div><b>${sh.nome}</b><small>${sh.sub}</small></div></div>
      <div class="st-purse">${iconHTML("coin", 18)}<b>${player.gold}</b><small>ouro</small></div>
      <button id="shclose" class="st-x" title="Fechar (Esc)">✕</button>
    </header>
    <div class="st-top">
      <div class="st-keeper"><canvas id="stk" width="80" height="80"></canvas><div class="st-bubble"><b>${keeper.split(",")[0]}</b><span id="stline">${game.keeperLine}</span></div></div>
      <div class="st-tabs">
        <button data-t="buy" class="${game.shopTab === "buy" ? "on" : ""}">${iconHTML("bag")}Comprar</button>
        <button data-t="sell" class="${game.shopTab === "sell" ? "on" : ""}">${iconHTML("coin")}Vender</button>
      </div>
    </div>
    ${
      shopCats().length > 1
        ? `<div class="st-cats"><button data-scat="" class="${!game.shopCat ? "on" : ""}">Tudo <em>${shopAll().length}</em></button>${shopCats()
            .map((c) => `<button data-scat="${c}" class="${game.shopCat === c ? "on" : ""}">${iconHTML(itemIcon(shopAll().find((id) => itemCat(id) === c)), 16)}${c} <em>${shopAll().filter((id) => itemCat(id) === c).length}</em></button>`)
            .join("")}</div>`
        : ""
    }
    ${
      list.length
        ? `<div class="st-stage">
      <button class="st-nav" data-nav="-1" ${list.length < 2 ? "disabled" : ""} aria-label="Anterior">‹</button>
      <div class="st-track">${cards}</div>
      <button class="st-nav" data-nav="1" ${list.length < 2 ? "disabled" : ""} aria-label="Próximo">›</button>
      <div class="st-shelf"></div>
    </div>
    <div class="st-detail" id="stdetail"></div>
    ${list.length > 24 ? `<div class="st-count"><b id="stcount">${game.shopIdx + 1}</b> de ${list.length}<span class="st-bar"><i id="stbar" style="width:${((game.shopIdx + 1) / list.length) * 100}%"></i></span></div>` : `<div class="st-dots">${list.map((_, i) => `<i data-go="${i}"></i>`).join("")}</div>`}`
        : `<div class="st-empty">${iconHTML("bag", 40)}<p>Você não tem nada para vender aqui.</p></div>`
    }
    <footer class="st-keys"><span><kbd>←</kbd><kbd>→</kbd> passar</span><span><kbd>↑</kbd><kbd>↓</kbd> quantidade</span><span><kbd>Enter</kbd> ${game.shopTab === "buy" ? "comprar" : "vender"}</span><span><kbd>Tab</kbd> comprar/vender</span><span><kbd>Esc</kbd> sair</span></footer>
    <div class="st-tax">${taxNote()}${player.taxPaid ? ` · Você já pagou ${player.taxPaid} de imposto` : ""}</div>
  </div>`;
  byId("shclose").onclick = closeShop;
  const root = byId("shop");
  root.querySelectorAll("[data-t]").forEach(
    (b) =>
      (b.onclick = () => {
        shopSwitchTab(b.dataset.t);
      }),
  );
  root.querySelectorAll("[data-scat]").forEach(
    (b) =>
      (b.onclick = () => {
        game.shopCat = b.dataset.scat || null;
        game.shopIdx = 0;
        game.shopQty = 1;
        playSound(600, 0.03, "sine");
        renderShop();
      }),
  );
  root.querySelectorAll("[data-nav]").forEach((b) => (b.onclick = () => shopSlide(+b.dataset.nav)));
  root.querySelectorAll("[data-go]").forEach(
    (b) =>
      (b.onclick = () => {
        const i = +b.dataset.go;
        if (i === game.shopIdx) return shopConfirm();
        game.shopIdx = i;
        game.shopQty = 1;
        playSound(520, 0.03, "sine");
        shopFocus();
      }),
  );
  const stage = root.querySelector(".st-stage");
  if (stage) {
    stage.onpointerdown = (e) => (game.swipeX = e.clientX);
    stage.onpointerup = (e) => {
      const dx = e.clientX - (game.swipeX ?? e.clientX);
      if (Math.abs(dx) > 40) shopSlide(dx < 0 ? 1 : -1);
    };
    stage.onwheel = (e) => {
      if (Math.abs(e.deltaY) + Math.abs(e.deltaX) < 20) return;
      e.preventDefault();
      shopSlide(e.deltaY + e.deltaX > 0 ? 1 : -1);
    };
  }
  shopFocus();
  clearInterval(game.cosAnim);
  const dk = () => drawKeeper(byId("stk"), keeper);
  dk();
  game.cosAnim = setInterval(dk, 120);
}

/** Atualiza só o leque e o painel: os cartões deslizam com transição. */
function shopFocus() {
  const root = byId("shop");
  const list = game.shopList || [];
  const n = list.length;
  if (!n) return;
  const cards = root.querySelectorAll(".st-card");
  cards.forEach((c, i) => {
    let d = i - game.shopIdx;
    if (n > 2) {
      if (d > n / 2) d -= n;
      if (d < -n / 2) d += n;
    }
    // Cartão que dá a volta (do fim para o começo) troca de lado sem atravessar a prateleira.
    const prev = c.dataset.d == null ? d : +c.dataset.d;
    c.dataset.d = d;
    if (Math.abs(d - prev) > 2) {
      c.style.transition = "none";
      requestAnimationFrame(() => requestAnimationFrame(() => (c.style.transition = "")));
    }
    const a = Math.abs(d);
    c.classList.toggle("on", d === 0);
    c.style.transform = `translateX(calc(-50% + ${d * 10}em)) translateY(${a ? 0.9 + a * 0.3 : 0}em) scale(${d === 0 ? 1.12 : a === 1 ? 0.86 : 0.7}) rotate(${d * 2}deg)`;
    c.style.opacity = a > 2 ? 0 : d === 0 ? 1 : a === 1 ? 0.75 : 0.4;
    c.style.zIndex = 10 - a;
    c.style.pointerEvents = a > 2 ? "none" : "auto";
    c.tabIndex = d === 0 ? 0 : -1;
  });
  root.querySelectorAll(".st-dots i").forEach((dot, i) => dot.classList.toggle("on", i === game.shopIdx));
  if (byId("stcount")) {
    byId("stcount").textContent = game.shopIdx + 1;
    byId("stbar").style.width = ((game.shopIdx + 1) / n) * 100 + "%";
  }
  const id = list[game.shopIdx],
    it = ITEMS[id];
  const r = rarityOf(it.preco, it.lend);
  const { pr, base } = shopPrice(id);
  const buy = game.shopTab === "buy";
  const lock = buy && it.req && guardiansFreed() < it.req;
  const maxQ = buy ? Math.max(1, Math.min(10, Math.floor(player.gold / Math.max(1, pr)))) : itemCount(id) - (Object.values(player.eq).includes(id) ? 1 : 0);
  game.shopQty = canStack(it) ? Math.max(1, Math.min(game.shopQty || 1, maxQ)) : 1;
  const q = game.shopQty;
  const total = pr * q;
  const owned = itemCount(id);
  const equipped = Object.values(player.eq).includes(id);
  const stats = itemStatChips(it)
    .map(([ic, tx]) => `<span class="st-chip">${iconHTML(ic, 14)}${tx}</span>`)
    .join("");
  const action = lock
    ? `<div class="st-locked">${iconHTML("lock", 16)}Libere ${it.req} Guardião(ões) para comprar</div>`
    : buy
      ? `<button class="sl-buy st-buy" data-b="${id}" ${player.gold >= total ? "" : "disabled"}>${player.gold >= total ? `Comprar${q > 1 ? ` ${q}×` : ""}` : "Ouro insuficiente"}</button>`
      : `<button class="sl-buy st-buy sell" data-s="${id}">${iconHTML("bag", 18)}Vender${q > 1 ? ` ${q}×` : ""}</button>`;
  byId("stdetail").innerHTML = `
    <div class="st-info">
      <div class="st-title"><span>${it.nome}</span><em style="--rc:${r.c}">${r.n}</em></div>
      <div class="st-meta">${iconHTML(itemIcon(id), 14)}${ITEM_TYPE_NAMES[it.tipo] || "Item"}${owned ? ` · você tem <b>${owned}</b>` : ""}${equipped ? " · <b style='color:#7ad36b'>equipado</b>" : ""}</div>
      <p class="st-desc">${it.desc || ""}</p>
      ${stats ? `<div class="st-chips">${stats}</div>` : ""}
    </div>
    <div class="st-buybox">
      <div class="st-price">${iconHTML("coin", 20)}<b>${total}</b><small>${q > 1 ? `${pr} cada` : buy && pr > base ? `${base} + ${pr - base} imposto` : buy ? "sem imposto" : "após imposto"}</small></div>
      ${
        canStack(it) && !lock
          ? `<div class="st-qty"><button data-q="-1" ${q <= 1 ? "disabled" : ""}>−</button><span>${q}</span><button data-q="1" ${q >= maxQ ? "disabled" : ""}>+</button></div>`
          : ""
      }
      ${action}
    </div>`;
  const det = byId("stdetail");
  det.querySelectorAll("[data-q]").forEach((b) => (b.onclick = () => shopQty(+b.dataset.q)));
  const bb = det.querySelector("[data-b]");
  if (bb) bb.onclick = () => shopBuy(id);
  const sb = det.querySelector("[data-s]");
  if (sb) sb.onclick = () => shopSell(id);
}
function shopQty(d) {
  game.shopQty = (game.shopQty || 1) + d;
  playSound(660, 0.02, "sine");
  shopFocus();
}
function shopSwitchTab(t) {
  game.shopTab = t || (game.shopTab === "buy" ? "sell" : "buy");
  game.shopCat = null;
  game.shopIdx = 0;
  game.shopQty = 1;
  keeperSays(game.shopTab === "buy" ? "hello" : "look");
  renderShop();
}
function shopBuy(id) {
  const it = ITEMS[id];
  const { base, pr } = shopPrice(id);
  const q = game.shopQty || 1;
  if (player.gold < pr * q) {
    keeperSays("poor");
    playSound(160, 0.1, "square");
    return renderShop();
  }
  for (let i = 0; i < q; i++) {
    payWithTax(base);
    addItem(id);
  }
  if (game.shopId === "rosa" || game.shopId === "bruno") player.flags.bought = true;
  playSound(880, 0.08, "sine");
  setTimeout(() => playSound(1175, 0.08, "sine"), 70);
  toast(`Comprou: ${q > 1 ? q + "× " : ""}${it.nome}` + (it.tipo === "equip" ? " · equipe no inventário (I)" : ""), 1800, itemIcon(id));
  keeperSays("buy");
  game.shopQty = 1;
  saveGame();
  renderShop();
  const c = byId("shop").querySelector(".st-card.on");
  if (c) c.classList.add("pop");
}
function shopSell(id) {
  const it = ITEMS[id];
  const q = game.shopQty || 1;
  for (let i = 0; i < q; i++) {
    player.gold += saleAfterTax(Math.floor(it.preco / 2));
    removeItem(id);
  }
  playSound(600, 0.08, "sine");
  keeperSays("sell");
  game.shopQty = 1;
  saveGame();
  renderShop();
}
/** Passa o carrossel para o próximo (1) ou anterior (-1). */
function shopSlide(d) {
  const n = (game.shopList || []).length;
  if (!n) return;
  game.shopIdx = (game.shopIdx + d + n) % n;
  game.shopQty = 1;
  playSound(520, 0.03, "sine");
  if (Math.random() < 0.15) {
    keeperSays("look");
    const l = byId("stline");
    if (l) l.textContent = game.keeperLine;
  }
  shopFocus();
}
/** Enter compra (ou vende, ou veste) o item do meio. */
function shopConfirm() {
  const b = byId("shop").querySelector(".sl-buy:not([disabled])");
  if (b) b.click();
}

/* ===================== ALFAIATARIA E SALÃO ===================== */

function cosPrice(cpr) {
  return withTax(cpr);
}
function renderCosmetic() {
  const sh = COS_SHOPS[game.cosKind];
  game.cosCat = sh.cats.includes(game.cosCat) ? game.cosCat : sh.cats[0];
  const cat = game.cosCat;
  const list = COSMETICS[cat].filter(
    ([id, , pr]) => !((pr === 0 && game.cosKind !== "roupa" && game.cosKind !== "cabelo") || (pr >= 9999 && !cosOwned(cat, id))),
  );
  game.cosList = list;
  game.cosIdx = Math.max(0, Math.min(list.length - 1, game.cosIdx || 0));
  if (!game.keeperLine) keeperSays("hello");
  const keeper = shopKeeperName("__cos");
  const swatch = cat === "hair" || cat === "robe";
  const cards = list
    .map(([id, nm, pr], i) => {
      const own = cosOwned(cat, id);
      return `<button class="st-card cos${own ? " owned" : ""}" data-go="${i}" style="--rc:${own ? "#7ad36b" : rarityOf(pr).c}">
        <span class="st-gem"></span>
        <span class="st-ic">${swatch ? `<span class="st-sw" style="background:${id}"></span>` : `<canvas class="st-pv" data-pv="${i}" width="72" height="72"></canvas>`}</span>
        <span class="st-nm">${nm}</span>
        <span class="st-tag">${own ? "seu" : `${iconHTML("coin", 12)}${cosPrice(pr)}`}</span>
      </button>`;
    })
    .join("");
  byId("shop").innerHTML = `<div class="store slider cosstore">
    <header class="st-head">
      <div class="st-sign"><span class="st-sign-ic">${iconHTML("shirt", 22)}</span><div><b>${sh.nome}</b><small>${sh.sub}</small></div></div>
      <div class="st-purse">${iconHTML("coin", 18)}<b>${player.gold}</b><small>ouro</small></div>
      <button id="shclose" class="st-x" title="Fechar (Esc)">✕</button>
    </header>
    <div class="st-top">
      <div class="st-keeper"><canvas id="stk" width="80" height="80"></canvas><div class="st-bubble"><b>${keeper.split(",")[0]}</b><span id="stline">${game.keeperLine}</span></div></div>
      <div class="st-tabs">${sh.cats.map((c) => `<button data-cat="${c}" class="${c === cat ? "on" : ""}">${iconHTML(COSMETIC_ICONS[c] || "shirt")}${COS_NAMES[c]}</button>`).join("")}</div>
    </div>
    <div class="st-cosmain">
      <div class="st-mirror">
        <canvas id="cosc" width="160" height="160"></canvas>
        <div class="st-mirror-bar"><button id="cosrot">↻ Girar</button><span>Espelho</span></div>
      </div>
      <div class="st-cosright">
        <div class="st-stage small">
          <button class="st-nav" data-cnav="-1" ${list.length < 2 ? "disabled" : ""} aria-label="Anterior">‹</button>
          <div class="st-track">${cards}</div>
          <button class="st-nav" data-cnav="1" ${list.length < 2 ? "disabled" : ""} aria-label="Próximo">›</button>
          <div class="st-shelf"></div>
        </div>
        <div class="st-detail" id="stdetail"></div>
      </div>
    </div>
    <footer class="st-keys"><span><kbd>←</kbd><kbd>→</kbd> passar</span><span><kbd>Enter</kbd> comprar / vestir</span><span><kbd>Tab</kbd> categoria</span><span><kbd>Esc</kbd> sair</span></footer>
    <div class="st-tax">O espelho já mostra como fica. Troque o visual quando quiser no inventário (I) → Aparência, ou em casa.</div>
  </div>`;
  const root = byId("shop");
  byId("shclose").onclick = () => {
    game.tryOn = null;
    clearInterval(game.cosAnim);
    closeShop();
  };
  byId("cosrot").onclick = () => {
    const o = ["down", "left", "up", "right"];
    game.cosDir = o[(o.indexOf(game.cosDir || "down") + 1) % 4];
  };
  root.querySelectorAll("[data-cat]").forEach((b) => (b.onclick = () => cosCategory(b.dataset.cat)));
  root.querySelectorAll("[data-cnav]").forEach((b) => (b.onclick = () => cosSlide(+b.dataset.cnav)));
  root.querySelectorAll("[data-go]").forEach(
    (b) =>
      (b.onclick = () => {
        const i = +b.dataset.go;
        if (i === game.cosIdx) return shopConfirm();
        game.cosIdx = i;
        playSound(520, 0.03, "sine");
        cosFocus();
      }),
  );
  const stage = root.querySelector(".st-stage");
  stage.onpointerdown = (e) => (game.swipeX = e.clientX);
  stage.onpointerup = (e) => {
    const dx = e.clientX - (game.swipeX ?? e.clientX);
    if (Math.abs(dx) > 40) cosSlide(dx < 0 ? 1 : -1);
  };
  cosFocus();
  root.querySelectorAll("[data-pv]").forEach((cv) => drawPreview(cv, Object.assign({}, player.look, { [cat]: list[+cv.dataset.pv][0] }), "down"));
  game.cosDir = game.cosDir || "down";
  clearInterval(game.cosAnim);
  const dr = () => {
    const look = game.tryOn ? Object.assign({}, player.look, { [game.tryOn.c]: game.tryOn.id }) : player.look;
    if (byId("cosc")) drawPreview(byId("cosc"), look, game.cosDir);
    drawKeeper(byId("stk"), keeper);
  };
  dr();
  game.cosAnim = setInterval(dr, 150);
}
function cosFocus() {
  const root = byId("shop");
  const list = game.cosList || [];
  const n = list.length;
  if (!n) return;
  root.querySelectorAll(".st-card").forEach((c, i) => {
    let d = i - game.cosIdx;
    if (n > 4) {
      if (d > n / 2) d -= n;
      if (d < -n / 2) d += n;
    }
    const a = Math.abs(d);
    c.classList.toggle("on", d === 0);
    c.style.transform = `translateX(calc(-50% + ${d * 9}em)) translateY(${a ? 0.7 + a * 0.3 : 0}em) scale(${d === 0 ? 1.05 : a === 1 ? 0.82 : 0.66}) rotate(${d * 2}deg)`;
    c.style.opacity = a > 2 ? 0 : d === 0 ? 1 : a === 1 ? 0.75 : 0.4;
    c.style.zIndex = 10 - a;
    c.style.pointerEvents = a > 2 ? "none" : "auto";
  });
  const cat = game.cosCat;
  const [cid, cnm, cpr] = list[game.cosIdx];
  const own = cosOwned(cat, cid),
    on = player.look[cat] === cid;
  game.tryOn = !on ? { c: cat, id: cid } : null;
  const pr = cosPrice(cpr);
  const r = own ? { n: "Seu", c: "#7ad36b" } : rarityOf(cpr);
  byId("stdetail").innerHTML = `
    <div class="st-info">
      <div class="st-title"><span>${cnm}</span><em style="--rc:${r.c}">${r.n}</em></div>
      <div class="st-meta">${iconHTML(COSMETIC_ICONS[cat] || "shirt", 14)}${COS_NAMES[cat]} · ${game.cosIdx + 1} de ${n}</div>
      <p class="st-desc">${on ? "É o que você está usando agora." : own ? "Já é seu. Quer vestir?" : "Veja no espelho como fica antes de comprar."}</p>
    </div>
    <div class="st-buybox">
      ${own ? "" : `<div class="st-price">${iconHTML("coin", 20)}<b>${pr}</b><small>${pr > cpr ? `${cpr} + ${pr - cpr} imposto` : "sem imposto"}</small></div>`}
      ${
        on
          ? `<div class="st-locked" style="color:#7ad36b">${iconHTML("shirt", 16)}Você está usando</div>`
          : own
            ? `<button class="sl-buy st-buy" data-wear="1">${iconHTML("shirt", 18)}Vestir</button>`
            : `<button class="sl-buy st-buy" data-buy="1" ${player.gold >= pr ? "" : "disabled"}>${player.gold >= pr ? "Comprar e vestir" : "Ouro insuficiente"}</button>`
      }
    </div>`;
  const det = byId("stdetail");
  const bw = det.querySelector("[data-wear]");
  if (bw)
    bw.onclick = () => {
      player.look[cat] = cid;
      game.tryOn = null;
      playSound(700, 0.08, "sine");
      keeperSays("buy");
      saveGame();
      renderCosmetic();
    };
  const bb = det.querySelector("[data-buy]");
  if (bb)
    bb.onclick = () => {
      if (player.gold < pr) {
        keeperSays("poor");
        return renderCosmetic();
      }
      payWithTax(cpr);
      (player.owned[cat] = player.owned[cat] || []).push(cid);
      player.look[cat] = cid;
      game.tryOn = null;
      playSound(880, 0.08, "sine");
      toast(`Comprou: ${cnm}`, 1800, COSMETIC_ICONS[cat] || "shirt");
      keeperSays("buy");
      saveGame();
      renderCosmetic();
    };
}
function cosCategory(c) {
  const cats = COS_SHOPS[game.cosKind].cats;
  game.cosCat = c || cats[(cats.indexOf(game.cosCat) + 1) % cats.length];
  game.cosIdx = 0;
  renderCosmetic();
}
function cosSlide(d) {
  const n = (game.cosList || []).length;
  if (!n) return;
  game.cosIdx = (game.cosIdx + d + n) % n;
  playSound(520, 0.03, "sine");
  cosFocus();
}
