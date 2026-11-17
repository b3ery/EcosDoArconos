/**
 * ECOS DO ARCANO — barra-e-bolsa.js
 * Inventário mais fácil de entender:
 *  - Barra de itens embaixo da tela, como no Minecraft: 9 espaços sempre
 *    visíveis no mapa. Toque (ou tecla 1 a 9) usa o item: come, bebe, toma a
 *    poção ou equipa. A barra se enche sozinha com comida e poções; na bolsa
 *    dá para escolher o que fica em cada espaço.
 *  - Na bolsa: o nome de cada item aparece embaixo do ícone, um toque já
 *    mostra os detalhes com botões grandes (sem precisar de duplo clique), e a
 *    barra aparece no pé da bolsa, como no Minecraft.
 * Modifica (envolve) funções de outros arquivos: invBagHTML, invDetailHTML,
 * invAct, renderInv, update.
 */

"use strict";

const HB_SIZE = 9;
function hotbar() {
  player.hotbar = Array.isArray(player.hotbar) ? player.hotbar : [];
  while (player.hotbar.length < HB_SIZE) player.hotbar.push(null);
  return player.hotbar;
}
const hbUsable = (id) => ITEMS[id] && ["food", "cons", "equip", "tool"].includes(ITEMS[id].tipo) && id !== "fenix";
/** Espaços vazios se enchem sozinhos com comida e poções (o jogador pode trocar). */
function hbAutofill() {
  const H = hotbar();
  for (let i = 0; i < HB_SIZE; i++) if (H[i] && itemCount(H[i]) <= 0 && !player.hbPinned?.[i]) H[i] = null;
  const have = new Set(H.filter(Boolean));
  const pool = Object.keys(player.inv)
    .filter((id) => itemCount(id) > 0 && !have.has(id) && ITEMS[id] && ["food", "cons"].includes(ITEMS[id].tipo) && id !== "fenix")
    .sort((a, b) => (ITEMS[a].tipo === ITEMS[b].tipo ? 0 : ITEMS[a].tipo === "cons" ? -1 : 1));
  for (let i = 0; i < HB_SIZE && pool.length; i++) if (!H[i] && !player.hbPinned?.[i]) H[i] = pool.shift();
}
function hbUse(i) {
  const id = hotbar()[i];
  game.hbSel = i;
  if (!id || itemCount(id) <= 0) return toast("Espaço vazio. Abra a bolsa (I) e escolha um item para esta barra.", 2200);
  const it = ITEMS[id];
  if (it.tipo === "equip") {
    if (isEquipped(id)) toast(`${it.nome} já está equipado.`, 1400);
    else {
      player.eq[it.slot] = id;
      player.hp = Math.min(player.hp, maxHp());
      player.mp = Math.min(player.mp, maxMp());
      playSound(780, 0.1, "sine");
      toast(`Equipou: ${it.nome}`, 1400);
    }
  } else if (["food", "cons"].includes(it.tipo)) {
    const r = useItemEffect(id);
    playSound(660, 0.12, "sine");
    toast(r || `Usou: ${it.nome}`, 1600);
  } else return toast(`${it.nome}: use pelo menu da bolsa (I).`, 1800);
  saveGame();
  hbRender(true);
}
function hbVisible() {
  return !!(player && player.name && game.mode === "world" && !game.dialog && !game.cine && byId("title") && byId("title").style.display === "none");
}
let hbSig = "";
function hbRender(force) {
  const el = byId("hotbar");
  if (!el) return;
  const vis = hbVisible();
  el.style.display = vis ? "flex" : "none";
  document.body.classList.toggle("hasbar", vis);
  if (!vis) return;
  hbAutofill();
  const H = hotbar();
  const sig = H.map((id) => (id ? id + ":" + itemCount(id) + (isEquipped(id) ? "e" : "") : "-")).join("|") + "#" + (game.hbSel ?? -1);
  if (!force && sig === hbSig) return;
  hbSig = sig;
  el.innerHTML = H.map((id, i) => {
    const has = id && itemCount(id) > 0;
    return `<button class="hb-slot ${game.hbSel === i ? "sel" : ""} ${has ? "" : "empty"}" data-hb="${i}" title="${has ? ITEMS[id].nome : "vazio"}"><span class="hb-k">${i + 1}</span>${has ? iconHTML(itemIcon(id), 26) : ""}${has && itemCount(id) > 1 ? `<b>${itemCount(id)}</b>` : ""}${has && isEquipped(id) ? "<i>E</i>" : ""}</button>`;
  }).join("");
  el.querySelectorAll("[data-hb]").forEach((b) => {
    b.onclick = (e) => {
      e.stopPropagation();
      hbUse(+b.dataset.hb);
    };
    b.onpointerdown = (e) => e.stopPropagation();
  });
}
(() => {
  if (!byId("hotbar")) {
    const el = document.createElement("div");
    el.id = "hotbar";
    el.className = "ui";
    byId("hud").parentNode.appendChild(el);
  }
  const st = document.createElement("style");
  st.textContent = `
  #hotbar{position:absolute;left:50%;bottom:1.2%;transform:translateX(-50%);display:none;gap:0;z-index:7;padding:0;border-radius:2px;background:transparent;border:3px solid rgba(20,20,20,.55)}
  .hb-slot{position:relative;width:2.6em;height:2.6em;padding:0;display:grid;place-items:center;border-radius:0;background:rgba(40,40,40,.32);border:2px solid rgba(190,190,190,.45);box-shadow:none;min-width:0}
  .hb-slot:hover{background:rgba(255,255,255,.12)}
  .hb-slot.sel{border:3px solid #fff;box-shadow:0 0 0 1px rgba(0,0,0,.6)}
  .hb-slot.empty{opacity:1}
  .hb-slot .hb-k{position:absolute;left:3px;top:1px;font-size:.55em;color:#b8a8d8}
  .hb-slot b{position:absolute;right:3px;bottom:1px;font-size:.62em;color:#fff;text-shadow:0 1px 0 #000}
  .hb-slot i{position:absolute;right:3px;top:1px;font-size:.55em;font-style:normal;color:#ffe08a}
  body.hasbar #tgtpill{bottom:calc(4% + 3.6em)}
  /* nome do item: só aparece ao passar o mouse ou o dedo (balãozinho, como no Minecraft) */
  .inv-cell .inv-nm{position:absolute;left:50%;bottom:calc(100% + 4px);transform:translateX(-50%);display:none;z-index:5;padding:.25em .55em;border-radius:5px;background:rgba(16,6,32,.94);border:2px solid #5a2a9a;color:#fff;font-size:.72em;line-height:1.2;white-space:nowrap;pointer-events:none;box-shadow:0 2px 0 rgba(0,0,0,.4)}
  .inv-cell:hover .inv-nm,.inv-cell.touch .inv-nm{display:block}
  .inv-grid{overflow:visible!important;max-height:none!important}
  .inv-hb h4{text-align:center}
  .inv-hb{margin-top:.6em}
  .inv-hb h4{margin:0 0 .3em;font-size:.8em;color:#d8c8ff;font-weight:600}
  .inv-hb-row{display:grid;grid-template-columns:repeat(9,minmax(0,46px));justify-content:center;gap:4px}
  .inv-hb-row button{position:relative;aspect-ratio:1;padding:0;display:grid;place-items:center;border-radius:6px;background:linear-gradient(#3a2a18,#261a10);border:2px solid #8a5a2e}
  .inv-hb-row button.tgt{border-color:#ffe08a;box-shadow:0 0 0 2px rgba(255,224,138,.4)}
  .inv-hb-row button em{position:absolute;left:3px;top:1px;font-size:.55em;font-style:normal;color:#e8d0a0}
  .inv-btns button{font-size:1.05em;padding:.45em 1em}
  .inv-guide{display:flex;gap:1em;flex-wrap:wrap;font-size:.82em;color:#cfc3ea;margin:.2em 0 .5em}
  .inv-guide span{display:inline-flex;align-items:center;gap:.3em}
  @media (max-height:520px){
    #hotbar{bottom:.6%;gap:2px;padding:3px}
    .hb-slot{width:2.3em;height:2.3em}
    .inv-new .inv-top{display:none!important}
  }`;
  document.head.appendChild(st);
  const tick = () => {
    try {
      hbRender(false);
    } catch (e) {}
    requestAnimationFrame(tick);
  };
  tick();
  // teclas 1 a 9 no mapa usam a barra
  addEventListener("keydown", (e) => {
    if (!hbVisible() || e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
    if (document.activeElement && /INPUT|TEXTAREA/.test(document.activeElement.tagName)) return;
    if (e.key >= "1" && e.key <= "9") {
      hbUse(+e.key - 1);
      e.preventDefault();
    }
  });
})();

/* ===================== A BOLSA ===================== */
(() => {
  // nome embaixo de cada item + guia rápido + a barra no pé da bolsa
  const bagBase = invBagHTML;
  invBagHTML = function () {
    let h = bagBase.apply(this, arguments);
    // menos espaço vazio: só as linhas com itens (mínimo de 2), para os botões caberem na tela
    const n = invItems().length,
      keep = Math.max(INV_COLS * 2, Math.ceil(n / INV_COLS) * INV_COLS) - n;
    let seen = 0;
    h = h.replace(/<div class="inv-cell empty"><\/div>/g, (m) => (seen++ < keep ? m : ""));
    h = h.replace(/(<button class="inv-cell[^>]*data-i="([^"]+)"[^>]*>)([\s\S]*?)<\/button>/g, (m, open, id, inner) => `${open}${inner}<span class="inv-nm">${ITEMS[id] ? ITEMS[id].nome : ""}</span></button>`);
    const guide = `<div class="inv-guide"><span>${iconHTML("eye", 14)} Toque num item para ver o que ele faz</span><span>${iconHTML("bag", 14)} Os botões aparecem embaixo</span><span>${iconHTML("star", 14)} A barra de baixo é a sua mão: tecla 1 a 9 ou toque usa o item</span></div>`;
    h = h.replace('<div class="inv-grid">', guide + '<div class="inv-grid">');
    hbAutofill();
    const H = hotbar(),
      tgt = game.hbTarget ?? -1;
    const row = H.map((id, i) => `<button data-hbset="${i}" class="${tgt === i ? "tgt" : ""}" title="${id && ITEMS[id] ? ITEMS[id].nome : "vazio"}"><em>${i + 1}</em>${id && itemCount(id) > 0 ? iconHTML(itemIcon(id), 26) : ""}</button>`).join("");
    h = h.replace('<div class="inv-detail"', `<div class="inv-hb"><h4>Sua barra (embaixo da tela). Escolha um item e toque em "Pôr na barra".</h4><div class="inv-hb-row">${row}</div></div><div class="inv-detail"`);
    return h;
  };
  // os detalhes ganham "Pôr na barra" / "Tirar da barra"
  const detBase = invDetailHTML;
  invDetailHTML = function () {
    let h = detBase.apply(this, arguments);
    if (!game.invSel) return `<div class="inv-hint">${iconHTML("eye", 18)} Toque num item para ver o nome, o que ele faz e os botões para usar, equipar ou pôr na barra.</div>`;
    let id = game.invSel;
    if (String(id).startsWith("eq:")) id = player.eq[id.slice(3)];
    if (id && hbUsable(id)) {
      const inBar = hotbar().indexOf(id);
      const b = inBar >= 0 ? `<button data-act="hbout">Tirar da barra (${inBar + 1})</button>` : `<button data-act="hbin">Pôr na barra</button>`;
      h = h.replace('<div class="inv-btns">', `<div class="inv-btns">${b}`);
    }
    return h;
  };
  const actBase = invAct;
  invAct = function (act) {
    let id = game.invSel;
    if (String(id).startsWith("eq:")) id = player.eq[id.slice(3)];
    if (act === "hbin" && id) {
      const H = hotbar();
      player.hbPinned = player.hbPinned || {};
      let i = game.hbTarget >= 0 ? game.hbTarget : H.findIndex((x) => !x || itemCount(x) <= 0);
      if (i < 0) i = HB_SIZE - 1;
      H[i] = id;
      player.hbPinned[i] = true;
      game.hbTarget = -1;
      saveGame();
      toast(`${ITEMS[id].nome} está no espaço ${i + 1} da barra.`, 1800);
      hbRender(true);
      return renderInv();
    }
    if (act === "hbout" && id) {
      const H = hotbar(),
        i = H.indexOf(id);
      if (i >= 0) ((H[i] = null), ((player.hbPinned = player.hbPinned || {})[i] = true));
      saveGame();
      hbRender(true);
      return renderInv();
    }
    return actBase.apply(this, arguments);
  };
  const riBase = renderInv;
  renderInv = function () {
    const r = riBase.apply(this, arguments);
    const box = byId("inv");
    if (box)
      box.querySelectorAll(".inv-cell[data-i]").forEach((c) =>
        c.addEventListener("touchstart", () => {
          box.querySelectorAll(".inv-cell.touch").forEach((o) => o.classList.remove("touch"));
          c.classList.add("touch");
          clearTimeout(game.invNmT);
          game.invNmT = setTimeout(() => c.classList.remove("touch"), 1600);
        }, { passive: true }),
      );
    if (box)
      box.querySelectorAll("[data-hbset]").forEach(
        (b) =>
          (b.onclick = () => {
            const i = +b.dataset.hbset;
            game.hbTarget = game.hbTarget === i ? -1 : i;
            toast(game.hbTarget >= 0 ? `Espaço ${i + 1} escolhido: agora toque num item e em "Pôr na barra".` : "Espaço desmarcado.", 2000);
            renderInv();
          }),
      );
    return r;
  };
})();
