/**
 * ECOS DO ARCANO — fim-do-carregamento.js
 * Último script do index.html (e do pacote dist/ecos.js): quando chega aqui,
 * o jogo inteiro já carregou. Some com a tela de carregamento (#carregando,
 * feita só com HTML e CSS para aparecer antes de qualquer script).
 */

"use strict";

(() => {
  const el = document.getElementById("carregando");
  if (!el) return;
  const tira = () => {
    el.classList.add("some");
    setTimeout(() => el.remove(), 700);
  };
  // espera as fontes (embutidas) e um quadro desenhado, para não piscar
  const pronto = () => requestAnimationFrame(() => setTimeout(tira, 250));
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(pronto, pronto);
  else pronto();
})();
