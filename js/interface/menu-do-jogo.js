/**
 * ECOS DO ARCANO — menu-do-jogo.js
 * Um MENU só, em vez de botões soltos na lateral e da lista ☰ no celular.
 * O que se usa o tempo todo continua na tela (vida, relógio, botões A e B,
 * barra de itens); o resto fica num painel com ícones grandes e nomes,
 * separado em grupos:
 *   Você (Mochila, Mapa, Missões ou Jornada) · Vida (Jornal, Corações,
 *   Calendário, Decorar a casa, Cavalo) · Magia (Grimório, Objetivo) ·
 *   Jogo (Zoom, Minimapa, Tela cheia, Salvar, Opções)
 * As bolinhas vermelhas de novidade (jornal, corações) aparecem no botão
 * Menu e no item. No celular, 5 toques no título do menu ligam os truques.
 * Teclas: Tab ou O abrem o menu; os atalhos de sempre continuam valendo.
 */

"use strict";

(() => {
  const click = (id) => () => {
    const b = byId(id);
    if (b) b.click();
  };
  const isNew = (id) => {
    const b = byId(id);
    return !!(b && b.classList.contains("new"));
  };
  const ITEMS = () =>
    [
      [
        "Você",
        [
          ["Mochila", "bag", "I", click("tI")],
          ["Mapa", "scroll", "M", click("tM")],
          [lifeMode() ? "Missões" : "Jornada", "book", lifeMode() ? "Q" : "J", lifeMode() ? click("tQ") : () => (typeof openJourney === "function" ? openJourney() : click("tQ")())],
        ],
      ],
      lifeMode()
        ? [
            "Sua vida",
            [
              ["Jornal", "scroll", "", click("jnb"), () => isNew("jnb")],
              ["Corações", "heart", "", click("htb"), () => isNew("htb")],
              ["Calendário e diário", "clock", "", click("calb")],
              ["Decorar a casa", "house", "", click("tR")],
              ["Cavalo", "paw", "C", click("tC")],
            ],
          ]
        : [
            "Magia",
            [
              ["Grimório", "book", "G", click("tG")],
              ["Ir até o objetivo", "star", "", () => typeof goToObjective === "function" && goToObjective()],
              ["Cavalo", "paw", "C", click("tC")],
            ],
          ],
      [
        "Jogo",
        [
          ["Zoom", "eye", "Z", click("tZ")],
          ["Minimapa", "scroll", "N", () => (typeof toggleMinimap === "function" ? toggleMinimap() : (game.showMM = !game.showMM))],
          ["Tela cheia", "sparkle", "F", () => typeof toggleFull === "function" && toggleFull()],
          ["Salvar", "star", "", () => (saveGame(), toast("Jogo salvo.", 1400))],
          ["Opções", "chair", "O", () => openOptions()],
        ].concat(typeof DEV !== "undefined" && DEV ? [["TESTES (truques)", "gem", "F9", () => typeof openDevPanel === "function" && openDevPanel()]] : []),
      ],
    ].filter(Boolean);

  let open = false;
  function render() {
    let el = byId("gmenu");
    if (!el) {
      el = document.createElement("div");
      el.id = "gmenu";
      el.className = "ui";
      byId("screen").appendChild(el);
    }
    const groups = ITEMS();
    el.innerHTML = `<div class="gm-box"><div class="gm-h"><b id="gmTitle">Menu do jogo</b><button id="gmx" aria-label="Fechar">✕</button></div>
      ${groups
        .map(
          ([g, list], gi) =>
            `<div class="gm-g">${g}</div><div class="gm-grid">${list
              .map(([n, ic, key, , nw], i) => `<button class="gm-it" data-g="${gi}" data-i="${i}">${iconHTML(ic, 28)}<span>${n}</span>${key ? `<kbd>${key}</kbd>` : ""}${nw && nw() ? "<i></i>" : ""}</button>`)
              .join("")}</div>`,
        )
        .join("")}</div>`;
    el.style.display = "flex";
    el.querySelector("#gmx").onclick = close;
    el.onclick = (e) => e.target === el && close();
    el.querySelectorAll(".gm-it").forEach(
      (b) =>
        (b.onclick = () => {
          const it = groups[+b.dataset.g][1][+b.dataset.i];
          close();
          setTimeout(() => it[3](), 10);
        }),
    );
    // truques no celular: 5 toques seguidos no título
    let taps = [];
    el.querySelector("#gmTitle").onclick = () => {
      const now = performance.now();
      taps = taps.filter((t) => now - t < 2500).concat(now);
      if (taps.length >= 5 && typeof enableCheats === "function") ((taps = []), enableCheats(), render());
    };
  }
  function show() {
    if (game.mode !== "world" || game.dialog) return;
    open = true;
    game.mode = "gmenu";
    render();
  }
  function close() {
    const el = byId("gmenu");
    if (el) el.style.display = "none";
    if (open && game.mode === "gmenu") game.mode = "world";
    open = false;
  }
  window.openGameMenu = show;
  if (typeof KEY_HANDLERS !== "undefined") KEY_HANDLERS.gmenu = (k) => (k === "escape" || k === "tab" || k === "o") && close();
  if (typeof BEFORE_DIALOG !== "undefined") BEFORE_DIALOG.add("gmenu");
  addEventListener("keydown", (e) => {
    if (e.key === "Tab" && game.mode === "world" && !game.dialog) (e.preventDefault(), show());
  });

  // o botão Menu da esquerda e o ☰ do celular abrem o mesmo menu
  const optb = byId("optb");
  if (optb) optb.onclick = (e) => (e.stopPropagation(), game.mode === "gmenu" ? close() : show());
  const tMenu = byId("tMenu");
  if (tMenu) {
    const nb = tMenu.cloneNode(true);
    tMenu.replaceWith(nb);
    nb.addEventListener("click", (e) => (e.stopPropagation(), game.mode === "gmenu" ? close() : show()));
  }
  // bolinha de novidade no botão Menu
  const upBase = update;
  update = function (dt) {
    const r = upBase.apply(this, arguments);
    const any = isNew("jnb") || isNew("htb");
    for (const id of ["optb", "tMenu"]) {
      const b = byId(id);
      if (b) b.classList.toggle("gm-new", any);
    }
    return r;
  };

  const st = document.createElement("style");
  st.textContent = `
  /* sem botões soltos: tudo isso agora mora no Menu do jogo */
  .lifeb,#goalb,#touch .small,body.tmenu #touch .small{display:none!important}
  #optb{position:relative}
  #optb.gm-new::after,#tMenu.gm-new::after{content:"";position:absolute;right:-3px;top:-3px;width:11px;height:11px;border-radius:50%;background:#ff4a5a;border:2px solid #fff}
  #gmenu{position:absolute;inset:0;z-index:40;display:none;align-items:center;justify-content:center;background:rgba(8,5,16,.6)}
  #gmenu .gm-box{width:min(94%,34em);max-height:92%;overflow:auto;background:linear-gradient(#2e2246,#1c1530);border:3px solid #c9a03a;border-radius:16px;padding:.7em .9em 1em;color:#fff;box-shadow:0 10px 40px rgba(0,0,0,.6)}
  #gmenu .gm-h{display:flex;align-items:center;justify-content:space-between;margin-bottom:.2em}
  #gmenu .gm-h b{font-family:"Pixelify Sans",sans-serif;font-size:1.35em;color:#ffe08a;user-select:none}
  #gmenu .gm-g{margin:.7em 0 .35em;font-size:.72em;letter-spacing:.12em;text-transform:uppercase;color:#c8b8e8}
  #gmenu .gm-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(6.6em,1fr));gap:.45em}
  #gmenu .gm-it{position:relative;display:flex;flex-direction:column;align-items:center;gap:.3em;padding:.6em .3em;min-height:5.2em;font-size:.82em;line-height:1.1;border-radius:12px}
  #gmenu .gm-it kbd{position:absolute;right:.35em;top:.3em;font-size:.7em;opacity:.55}
  #gmenu .gm-it i{position:absolute;right:.4em;bottom:.4em;width:10px;height:10px;border-radius:50%;background:#ff4a5a;border:2px solid #fff}
  @media (pointer:coarse){
    #gmenu .gm-it kbd{display:none}
    /* no celular o Menu fica só no botão grande da direita, perto do polegar */
    body.mland #optb{display:none!important}
    #gmenu .gm-box{width:min(96%,52em);font-size:.92em;padding:.5em .8em .7em}
    #gmenu .gm-grid{grid-template-columns:repeat(auto-fill,minmax(7.2em,1fr));gap:.4em}
    #gmenu .gm-it{min-height:4.2em;padding:.4em .3em;flex-direction:row;justify-content:flex-start;gap:.5em;text-align:left}
    #gmenu .gm-g{margin:.45em 0 .25em}
  }
  `;
  document.head.appendChild(st);
})();
