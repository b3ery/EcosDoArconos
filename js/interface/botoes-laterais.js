/**
 * ECOS DO ARCANO — botoes-laterais.js
 * Os botões da esquerda (Tela cheia, Menu, Objetivo, Jornal, Corações,
 * Calendário) ficam sempre empilhados logo abaixo do painel de vida, sem
 * encostar nele nem uns nos outros. No computador, cada um mostra o nome.
 */

"use strict";

(() => {
  const LABELS = { fsb: "Tela cheia", optb: "Menu", goalb: "Objetivo" };
  const ORDER = ["fsb", "optb", "goalb", "jnb", "htb", "calb"];
  const st = document.createElement("style");
  st.textContent = `
  #fsb .bl,#optb .bl,#goalb .bl{display:none;margin-left:.4em;font-size:.62em;vertical-align:middle}
  @media (min-width: 900px) and (min-height: 560px) and (hover: hover){
    #fsb .bl,#optb .bl,#goalb .bl{display:inline}
    #fsb,#optb,#goalb{min-width:0!important;display:inline-flex;align-items:center}
  }`;
  document.head.appendChild(st);
  const addLabels = () => {
    for (const [id, n] of Object.entries(LABELS)) {
      const b = byId(id);
      if (b && !b.querySelector(".bl")) b.insertAdjacentHTML("beforeend", `<span class="bl">${n}</span>`);
    }
  };
  let sig = "";
  const place = () => {
    addLabels();
    const hud = byId("hud");
    if (!hud || !hud.offsetParent) return;
    let top = hud.offsetTop + hud.offsetHeight + 8;
    const parts = [top];
    for (const id of ORDER) {
      const b = byId(id);
      if (!b || !b.offsetParent || getComputedStyle(b).display === "none") continue;
      b.style.setProperty("top", top + "px", "important");
      top += b.offsetHeight + 6;
      parts.push(id, top);
    }
    sig = parts.join(",");
  };
  let acc = 0;
  const upBase = update;
  update = function (dt) {
    const r = upBase.apply(this, arguments);
    acc += dt || 0;
    if (acc >= 0.25) {
      acc = 0;
      try {
        place();
      } catch (e) {}
    }
    return r;
  };
  addEventListener("resize", () => setTimeout(place, 50));
})();

/* Tela cheia agora fica dentro do Menu (o botão solto some; a tecla F continua valendo). */
{
  const st = document.createElement("style");
  st.textContent = `#fsb{display:none!important}`;
  document.head.appendChild(st);
  const roFs = renderOptions;
  renderOptions = function () {
    roFs.apply(this, arguments);
    const box = byId("options");
    if (!box || box.querySelector("#optFull")) return;
    const on = !!document.fullscreenElement;
    const html = `<div class="opt" id="optFull"><span>Tela cheia (F)</span><div class="seg"><button id="optfsb" class="${on ? "on" : ""}">${on ? "Sair da tela cheia" : "Entrar em tela cheia"}</button></div></div>`;
    const firstOpt = box.querySelector(".opt");
    if (firstOpt) firstOpt.insertAdjacentHTML("beforebegin", html);
    else box.insertAdjacentHTML("beforeend", html);
    byId("optfsb").onclick = () => {
      toggleFull();
      setTimeout(() => (box.querySelector("#optFull") && box.querySelector("#optFull").remove(), renderOptions()), 300);
    };
  };
}
