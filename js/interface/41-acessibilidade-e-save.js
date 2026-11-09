/**
 * ECOS DO ARCANO — 41-acessibilidade-e-save.js
 *  - Levar o jogo salvo para outro navegador ou celular: exportar como arquivo
 *    ou código, e importar de volta (Opções → Seu jogo salvo).
 *  - Acessibilidade (Opções → Acessibilidade): letra maior e um modo calmo
 *    sem tremores de tela nem flashes.
 */

"use strict";

/* ===================== ACESSIBILIDADE ===================== */
function applyA11y() {
  const b = document.body;
  b.classList.toggle("font-g", settings.font === "g");
  b.classList.toggle("font-e", settings.font === "e");
  b.classList.toggle("calm", !!settings.calm);
}
applyA11y();
{
  const updBase = update;
  update = function (dt) {
    updBase(dt);
    if (settings.calm) {
      game.shake = 0;
      game.flash = 0;
    }
  };
}

/* ===================== SAVE PARA LEVAR ===================== */
const EXTRA_KEYS = ["ecosMortes", "ecosDesafios"];
function savePacket() {
  saveGame();
  const extra = {};
  for (const k of EXTRA_KEYS)
    try {
      const v = localStorage.getItem(k);
      if (v) extra[k] = v;
    } catch (e) {}
  return { app: "ecos-do-arcano", v: 3, at: Date.now(), player: JSON.parse(JSON.stringify(player)), extra };
}
function toCode(obj) {
  return btoa(unescape(encodeURIComponent(JSON.stringify(obj))));
}
function fromCode(txt) {
  const t = String(txt || "").trim();
  if (t.startsWith("{")) return JSON.parse(t);
  return JSON.parse(decodeURIComponent(escape(atob(t))));
}
function exportSaveFile() {
  if (!player || !player.name) return toast("Ainda não há jogo para exportar.", 2600);
  const blob = new Blob([JSON.stringify(savePacket())], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `ecos-do-arcano-${(player.name || "save").replace(/[^\w-]+/g, "_")}.json`;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => (URL.revokeObjectURL(a.href), a.remove()), 500);
  toast("Arquivo do jogo salvo baixado! Guarde bem.", 3200);
}
function exportSaveCode() {
  if (!player || !player.name) return toast("Ainda não há jogo para exportar.", 2600);
  const code = toCode(savePacket());
  const done = () => toast("Código copiado! Cole no outro aparelho em Opções → Importar.", 3800);
  try {
    navigator.clipboard.writeText(code).then(done, () => window.prompt("Copie este código:", code));
  } catch (e) {
    window.prompt("Copie este código:", code);
  }
}
function importPacket(pkt) {
  if (!pkt || pkt.app !== "ecos-do-arcano" || !pkt.player || !pkt.player.name) throw new Error("formato");
  if (!window.confirm(`Carregar o jogo de ${pkt.player.name}? O progresso atual deste espaço será substituído.`)) return;
  localStorage.setItem(slotKey(curSlot()), JSON.stringify(pkt.player));
  for (const [k, v] of Object.entries(pkt.extra || {})) if (EXTRA_KEYS.includes(k)) localStorage.setItem(k, v);
  toast("Jogo importado! Recarregando...", 2000);
  setTimeout(() => location.reload(), 900);
}
function importSaveFile() {
  const inp = document.createElement("input");
  inp.type = "file";
  inp.accept = ".json,application/json";
  inp.onchange = () => {
    const f = inp.files && inp.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      try {
        importPacket(fromCode(r.result));
      } catch (e) {
        toast("Esse arquivo não é um jogo salvo do Ecos do Arcano.", 3400);
      }
    };
    r.readAsText(f);
  };
  inp.click();
}
function importSaveCode() {
  const code = window.prompt("Cole aqui o código do jogo salvo:");
  if (!code) return;
  try {
    importPacket(fromCode(code));
  } catch (e) {
    toast("Código inválido. Confira se copiou ele inteiro.", 3400);
  }
}

/* ===================== NAS OPÇÕES ===================== */
{
  const roBase = renderOptions;
  renderOptions = function () {
    roBase();
    const box = byId("options");
    const help = [...box.querySelectorAll("h3")].find((h) => /Ajuda/.test(h.textContent));
    const seg = (k, list, cur) => list.map(([v, n]) => `<button data-a11y="${k}" data-v="${v}" class="${String(cur) === v ? "on" : ""}">${n}</button>`).join("");
    const html = `<h3>Acessibilidade</h3>
      <div class="opt"><span>Tamanho da letra</span><div class="seg">${seg("font", [["n", "Normal"], ["g", "Grande"], ["e", "Enorme"]], settings.font || "n")}</div></div>
      <div class="opt"><span>Tremores e flashes</span><div class="seg">${seg("calm", [["0", "Ligados"], ["1", "Desligados"]], settings.calm ? "1" : "0")}</div></div>
      <h3>Seu jogo salvo</h3>
      <div class="opt"><span>Levar para outro aparelho</span><div class="sv-btns"><button id="svExpF">Baixar arquivo</button><button id="svExpC">Copiar código</button></div></div>
      <div class="opt"><span>Trazer de outro aparelho</span><div class="sv-btns"><button id="svImpF">Abrir arquivo</button><button id="svImpC">Colar código</button></div></div>`;
    if (help) help.insertAdjacentHTML("beforebegin", html);
    else box.insertAdjacentHTML("beforeend", html);
    box.querySelectorAll("[data-a11y]").forEach((b) => {
      b.onclick = () => {
        const k = b.dataset.a11y;
        settings[k] = k === "calm" ? b.dataset.v === "1" : b.dataset.v;
        saveSettings();
        applyA11y();
        renderOptions();
      };
    });
    byId("svExpF").onclick = exportSaveFile;
    byId("svExpC").onclick = exportSaveCode;
    byId("svImpF").onclick = importSaveFile;
    byId("svImpC").onclick = importSaveCode;
  };
}
