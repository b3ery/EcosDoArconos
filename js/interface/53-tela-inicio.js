/**
 * ECOS DO ARCANO — 53-tela-inicio.js
 * Tela de início mais limpa, em dois passos:
 *  1. Logo + Jogar, Opções e Créditos.
 *  2. Depois de Jogar: Continuar (se tiver jogo salvo) e a escolha do modo.
 * O Guia e as Conquistas ficam dentro de Opções.
 */

"use strict";

(function titleSteps() {
  const T = byId("title");
  if (!T) return;
  const menu = document.createElement("div");
  menu.id = "tmenu";
  menu.innerHTML = `<button id="tPlay" class="t-play">▶ Jogar</button><div class="t-row"><button id="tOpt">${iconHTML("gear", 16)} Opções</button><button id="tCred">${iconHTML("star", 16)} Créditos</button></div>`;
  T.insertBefore(menu, T.querySelector(".title-panel"));
  const back = document.createElement("button");
  back.id = "tBack";
  back.className = "t-back";
  back.textContent = "‹ Voltar";
  T.querySelector(".title-panel").appendChild(back);
  const step = (n) => {
    T.classList.toggle("step1", n === 1);
    T.classList.toggle("step2", n === 2);
    playSound(n === 2 ? 660 : 520, 0.05, "sine");
  };
  T.classList.add("step1");
  byId("tPlay").onclick = () => step(2);
  byId("tBack").onclick = () => step(1);
  byId("tOpt").onclick = () => byId("btnOpt").click();
  byId("tCred").onclick = () => byId("btnCredits").click();
  // Esc no passo 2 volta para o primeiro.
  addEventListener("keydown", (e) => {
    if (game.mode === "title" && e.key === "Escape" && T.classList.contains("step2")) step(1);
  });
})();
