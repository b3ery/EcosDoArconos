/**
 * ECOS DO ARCANO — comandos-de-teste.js
 * Carrega antes de todos os outros arquivos para ouvir o teclado primeiro
 * (até durante uma cena). No modo testes, digitar uma barra e o comando:
 *   /apresentacao  abre o modo demo da apresentação (veja modo-demo.js)
 * Depois da "/", as teclas vão para o comando: o boneco não anda nem
 * interage. Enter confirma, Esc cancela. Também funciona no campo de
 * comando do painel TESTES.
 */

"use strict";

// no modo testes, digitar /apresentacao em qualquer lugar do jogo abre a demo.
// Depois da "/", as teclas vão para o comando (o boneco não anda nem interage).
{
  let cmd = null,
    timer = 0;
  const show = () => typeof toast === "function" && toast(`Comando: ${cmd}`, 4000);
  const stop = () => ((cmd = null), clearTimeout(timer));
  addEventListener(
    "keydown",
    (e) => {
      if (typeof DEV === "undefined" || !DEV || e.ctrlKey || e.altKey || e.metaKey) return;
      const t = e.target;
      // o campo de comando do painel TESTES: Enter roda o comando
      if (t && t.id === "dvCmd") {
        if (e.key === "Enter" && typeof runDevCmd === "function") (e.preventDefault(), e.stopImmediatePropagation(), runDevCmd());
        else e.stopImmediatePropagation();
        return;
      }
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA")) return;
      if (cmd === null) {
        if (e.key !== "/") return;
        cmd = "/";
      } else if (e.key === "Escape") return (e.preventDefault(), e.stopImmediatePropagation(), stop(), toast("Comando cancelado.", 1200));
      else if (e.key === "Backspace") cmd = cmd.slice(0, -1) || "/";
      else if (e.key === "Enter") {
        e.preventDefault();
        e.stopImmediatePropagation();
        const c = cmd;
        stop();
        if (!devCommand(c)) toast(`Comando desconhecido: ${c}`, 2000);
        return;
      } else if (e.key.length === 1) cmd += e.key.toLowerCase();
      else return;
      e.preventDefault();
      e.stopImmediatePropagation();
      clearTimeout(timer);
      timer = setTimeout(stop, 6000);
      if (devCommand(cmd)) return stop();
      show();
    },
    true,
  );
}

