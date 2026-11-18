/**
 * ECOS DO ARCANO — idade.js
 * Como nos aplicativos: na primeira vez que apertar Jogar, o jogo pergunta o
 * ano de nascimento (só o ano) e guarda.
 *  - Menos de 16 anos: o sangue fica desligado (e a opção travada).
 *  - Menos de 18 anos: o Modo +18 fica travado.
 * Nas Opções aparece o ano informado.
 * Modifica (envolve) funções de outros arquivos: renderOptions.
 */

"use strict";

const THIS_YEAR = new Date().getFullYear();
const playerAgeYears = () => (settings.birthYear ? THIS_YEAR - settings.birthYear : null);
function applyAgeRules() {
  const a = playerAgeYears();
  if (a == null) return;
  if (a < 16) settings.noBlood = true;
  if (a < 18) settings.adult = false;
}
function askBirthYear(after) {
  let el = byId("agegate");
  if (!el) {
    el = document.createElement("div");
    el.id = "agegate";
    document.body.appendChild(el);
  }
  const years = [];
  for (let y = THIS_YEAR; y >= THIS_YEAR - 100; y--) years.push(y);
  el.innerHTML = `<div class="ag-box"><h2>Antes de começar</h2><p>Em que ano você nasceu?</p>
    <select id="agyear"><option value="">Escolha o ano</option>${years.map((y) => `<option value="${y}">${y}</option>`).join("")}</select>
    <small>Usamos só para ajustar o conteúdo do jogo (sangue a partir de 16 anos, Modo +18 só para maiores).</small>
    <button id="agok" class="go" disabled>Confirmar</button></div>`;
  el.style.display = "flex";
  const sel = byId("agyear");
  sel.onchange = () => (byId("agok").disabled = !sel.value);
  byId("agok").onclick = () => {
    if (!sel.value) return;
    settings.birthYear = +sel.value;
    applyAgeRules();
    saveSettings();
    el.style.display = "none";
    if (after) after();
  };
}
{
  const st = document.createElement("style");
  st.textContent = `#agegate{position:fixed;inset:0;z-index:100;display:none;align-items:center;justify-content:center;background:rgba(8,5,16,.85)}
  #agegate .ag-box{width:min(92%,24em);background:linear-gradient(#2a2040,#1a1428);border:3px solid #c9a03a;border-radius:14px;padding:1.2em;color:#fff;text-align:center;display:flex;flex-direction:column;gap:.6em}
  #agegate h2{margin:0;font-family:"Pixelify Sans",sans-serif;color:#ffe08a}
  #agegate p{margin:0;font-size:1.05em}
  #agegate select{font-size:1.1em;padding:.4em;border-radius:8px;background:#1a1028;color:#fff;border:2px solid #6a5a8a}
  #agegate small{font-size:.75em;color:#c8b8e8}`;
  document.head.appendChild(st);
}
applyAgeRules();

/* ----- o botão Jogar pergunta antes ----- */
(() => {
  const b = byId("tPlay");
  if (!b) return;
  b.addEventListener(
    "click",
    (e) => {
      if (settings.birthYear) return;
      e.stopImmediatePropagation();
      e.preventDefault();
      askBirthYear(() => b.click());
    },
    true,
  );
})();

/* ----- nas Opções: trava o que a idade não permite ----- */
{
  const roBase = renderOptions;
  renderOptions = function () {
    roBase.apply(this, arguments);
    applyAgeRules();
    const box = byId("options");
    if (!box) return;
    const a = playerAgeYears();
    const lock = (sel, minAge, label) => {
      if (a != null && a >= minAge) return;
      box.querySelectorAll(sel).forEach((btn) => {
        btn.disabled = true;
        btn.title = label;
      });
      const row = box.querySelector(sel) && box.querySelector(sel).closest(".opt");
      if (row && !row.querySelector(".ag-note")) row.insertAdjacentHTML("beforeend", `<small class="ag-note" style="display:block;width:100%;color:#c8b8e8;font-size:.75em">${label}</small>`);
    };
    lock('[data-wopt="noBlood"]', 16, a == null ? "Informe o ano de nascimento para liberar." : "Disponível a partir de 16 anos.");
    lock("[data-adult]", 18, a == null ? "Informe o ano de nascimento para liberar." : "Só para maiores de 18 anos.");
    if (!box.querySelector("#optAge")) {
      const html = `<div class="opt" id="optAge"><span>Ano de nascimento</span><div class="seg"><button id="agchg">${settings.birthYear || "Informar"}</button></div></div>`;
      const help = [...box.querySelectorAll("h3")].find((h) => /Ajuda/.test(h.textContent));
      if (help) help.insertAdjacentHTML("beforebegin", html);
      else box.insertAdjacentHTML("beforeend", html);
      byId("agchg").onclick = () => askBirthYear(() => renderOptions());
    }
  };
}
/* O Modo +18 não precisa mais do "confirm": a idade já foi informada. */
{
  const conf = window.confirm;
  window.confirm = function (msg) {
    if (String(msg).includes("Modo +18")) return (playerAgeYears() ?? 0) >= 18;
    return conf.apply(this, arguments);
  };
}
