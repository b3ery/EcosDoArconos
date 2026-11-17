/**
 * ECOS DO ARCANO — modo-adulto.js (Simulador, opcional)
 * Modo +18, desligado por padrão (Opções → Conteúdo). Pede confirmação de idade.
 *  - Palavrões: os moradores falam como gente de taverna.
 *  - Sexo casual: "Passar a noite junto" com moradores e contatos (a cena corta
 *    para uma tela escura; nada explícito). Tem consequências: higiene,
 *    fofoca, ciúme de quem é casado com você.
 *  - Trisal: quem namora ou é casado pode propor um trisal a um terceiro;
 *    os dois precisam aceitar.
 * A turma (personagens inspirados nos criadores) fica fora das cenas casuais e do trisal.
 * Modifica (envolve) funções de outros arquivos: say, lifeSocialItems, renderOptions.
 */

"use strict";

const adultOn = () => !!(settings.adult && lifeMode());
const notCrew = (id) => !(typeof CREW_ALL !== "undefined" && CREW_ALL.includes(id)) && !["rainha", "kael", "odelia", "luca"].includes(id);

/* ===================== OPÇÕES ===================== */
{
  const roBase = renderOptions;
  renderOptions = function () {
    roBase.apply(this, arguments);
    const box = byId("options");
    if (!box || box.querySelector("#optAdult")) return;
    const html = `<h3>Conteúdo</h3><div class="opt" id="optAdult"><span>Modo +18 (palavrões, sexo casual sem cenas explícitas, trisal)</span><div class="seg"><button data-adult="0" class="${settings.adult ? "" : "on"}">Desligado</button><button data-adult="1" class="${settings.adult ? "on" : ""}">Ligado</button></div></div>`;
    const help = [...box.querySelectorAll("h3")].find((h) => /Ajuda/.test(h.textContent));
    if (help) help.insertAdjacentHTML("beforebegin", html);
    else box.insertAdjacentHTML("beforeend", html);
    box.querySelectorAll("[data-adult]").forEach((b) => {
      b.onclick = () => {
        if (b.dataset.adult === "1" && !settings.adult && !window.confirm("O Modo +18 tem palavrões e situações adultas (sem cenas explícitas). Você confirma que tem 18 anos ou mais?")) return;
        settings.adult = b.dataset.adult === "1";
        saveSettings();
        toast(settings.adult ? "Modo +18 ligado (só no Simulador)." : "Modo +18 desligado.", 2400);
        renderOptions();
      };
    });
  };
}

/* ===================== PALAVRÕES ===================== */
const SWEAR_PRE = ["Porra, ", "Caralho, ", "Puta merda, ", "Merda, ", "Cacete, ", "Puta que pariu, ", "Vixe, porra, "];
const SWEAR_POST = [" Que merda.", " Puta que pariu.", " Caralho!", " Porra!", " Foda-se."];
const SWEAR_SWAP = [
  [/\bDroga\b/g, "Merda"],
  [/\bdroga\b/g, "merda"],
  [/\bNossa\b/g, "Puta merda"],
  [/\bMinha nossa\b/gi, "Puta que pariu"],
  [/\bcaramba\b/gi, "caralho"],
  [/\bidiota\b/gi, "babaca"],
];
{
  const sayBase = say;
  say = function (lines, cb) {
    if (adultOn() && Array.isArray(lines))
      lines = lines.map((l) => {
        if (!Array.isArray(l) || !l[0] || l[0] === player.name || l[0] === "Você" || /Padre|Frei|Rainha/.test(l[0]) || typeof l[1] !== "string" || l[1].includes("<")) return l;
        let t = l[1];
        for (const [re, s] of SWEAR_SWAP) t = t.replace(re, s);
        const r = Math.random();
        if (r < 0.18) t = pk(SWEAR_PRE) + t.charAt(0).toLowerCase() + t.slice(1);
        else if (r < 0.28) t = t + pk(SWEAR_POST);
        return [l[0], t, ...l.slice(2)];
      });
    return sayBase.call(this, lines, cb);
  };
}

/* ===================== SEXO CASUAL ===================== */
function fadeNight(text, after) {
  let el = byId("adultFade");
  if (!el) {
    el = document.createElement("div");
    el.id = "adultFade";
    el.style.cssText = "position:absolute;inset:0;z-index:40;background:#000;color:#e8dcf0;display:flex;align-items:center;justify-content:center;text-align:center;padding:2em;font-size:1.1em;opacity:0;transition:opacity .8s";
    byId("screen").appendChild(el);
  }
  el.innerHTML = `<div><div style="font-size:2em;margin-bottom:.4em">🌙</div>${text}</div>`;
  el.style.display = "flex";
  requestAnimationFrame(() => (el.style.opacity = "1"));
  game.mode = "cutscene";
  setTimeout(() => {
    el.style.opacity = "0";
    setTimeout(() => ((el.style.display = "none"), (game.mode = "world"), after && after()), 800);
  }, 2600);
}
function casualNight(id) {
  const n = shortName(id);
  if (player.famDay["casual" + id] === player.day) return say([[n, "De novo hoje? Calma, fogos!"]]);
  const f = friendship(id);
  const ch = 0.25 + f / 160 + ((player.hygiene ?? 70) > 60 ? 0.1 : -0.2) + ((player.rep ?? 50) - 50) / 300;
  player.famDay["casual" + id] = player.day;
  if (Math.random() > ch) {
    addFriendship(id, -3);
    return say([[n, pk(["Hoje não, valeu. Mas me paga uma cerveja que eu penso no caso.", "Tá maluc" + genderWord("o", "a", "e") + "? A gente mal se conhece, porra.", "Hmm... não. Mas obrigad" + gw(id, "o", "a") + " pela confiança, eu acho."])]]);
  }
  say([[n, pk(["Sua casa ou a minha?", "Achei que nunca ia perguntar.", "Só se for agora. E ninguém fica sabendo, hein?"])]], () =>
    fadeNight(`Você e ${n} passam a noite juntos.<br><small>Algumas horas depois...</small>`, () => {
      player.clock = Math.min(1439, player.clock + 120);
      if (typeof addNeed === "function") addNeed("fun", 35);
      player.hygiene = Math.max(0, (player.hygiene ?? 70) - 25);
      addFriendship(id, 6);
      player.casualCount = (player.casualCount || 0) + 1;
      const partner = player.spouse || player.dating;
      const trio = player.trisal && player.trisal.includes(id);
      if (partner && partner !== id && !trio && !(typeof openRelationship === "function" && openRelationship()) && Math.random() < 0.4) {
        addFriendship(partner, -30);
        vilaNews(`Fofoca: ${player.name} foi vist${genderWord("o", "a", "e")} saindo da casa de ${n} de madrugada!`);
        say([["", "Na manhã seguinte, a vila inteira já sabe."], [shortName(partner), pk(["Você o QUÊ?! Seu... sua... PUTA QUE PARIU!", "Eu confiei em você, caralho!", "Não fala comigo. Hoje não. Talvez nunca."])]]);
      } else {
        if (Math.random() < 0.3) vilaNews(`Dizem por aí que ${player.name} e ${n} andam bem próximos...`);
        say([["", pk(["Ninguém viu. Acho.", "Você volta para casa com um sorriso besta no rosto.", "Valeu a pena. Sua higiene, nem tanto."])]]);
      }
      saveGame();
    }),
  );
}

/* ===================== TRISAL ===================== */
function proposeTrisal(id) {
  const partner = player.spouse || player.dating;
  const P = shortName(partner),
    n = shortName(id);
  const okA = friendship(partner) >= 60 && Math.random() < 0.55 + (friendship(partner) - 60) / 100;
  const okB = friendship(id) >= 50 && Math.random() < 0.5 + (friendship(id) - 50) / 100;
  if (!okA)
    return (addFriendship(partner, -12), say([["", `Você conversa com ${P} sobre chamar ${n} para a relação...`], [P, pk(["Um trisal? Você tá de sacanagem comigo?", "Eu não sou suficiente pra você, é isso?", "Não. Não, não e não."])]]));
  if (!okB) return say([[P, "...Tá. Se for pra ser, eu topo."], [n, pk(["Eu? Com vocês dois? Não, valeu. Gosto de vocês, mas não assim.", "Que convite... mas eu passo."])]]);
  player.trisal = [partner, id];
  player.lovers = [...new Set([...(player.lovers || []), id])];
  addFriendship(partner, 6);
  addFriendship(id, 12);
  vilaNews(`${player.name}, ${P} e ${n} agora são um trisal! A vila comenta, mas os três parecem felizes.`);
  saveGame();
  say([[P, "Então é isso. Nós três."], [n, "Nós três. Que loucura... e eu tô feliz."], ["", "Vocês agora são um trisal. Encontros a três aparecem no menu dos dois."]]);
}
function trioDate(id) {
  const [a, b] = player.trisal;
  if (player.famDay.trioDate === player.day) return say([["", "Vocês já saíram os três hoje."]]);
  player.famDay.trioDate = player.day;
  player.clock = Math.min(1439, player.clock + 120);
  addFriendship(a, 6);
  addFriendship(b, 6);
  if (typeof addNeed === "function") addNeed("fun", 25);
  saveGame();
  say([["", pk([`Jantar a três na taverna. ${shortName(a)} e ${shortName(b)} brigam pela última batata.`, `Piquenique a três no campo. ${shortName(b)} trouxe vinho; ${shortName(a)} trouxe o queijo.`, "Noite de dança a três na praça. A vila olha. Vocês nem ligam."])]], () =>
    choice("Noite a três", "Terminar a noite...", [
      { t: "Ir para casa juntos", icon: "heart", fn: () => fadeNight("A noite continua só para vocês três.<br><small>Algumas horas depois...</small>", () => ((player.hygiene = Math.max(0, (player.hygiene ?? 70) - 20)), saveGame())) },
      { t: "Cada um para sua casa", icon: "door", fn: null },
    ]),
  );
}

/* ===================== MENU ===================== */
{
  const lsBase = lifeSocialItems;
  lifeSocialItems = function (id) {
    const out = lsBase.apply(this, arguments) || [];
    if (!adultOn() || !NPCS[id] || !notCrew(id) || (typeof isChildNpc === "function" && isChildNpc(id)) || (typeof npcAge === "function" && npcAge(id) < 18)) return out;
    if (friendship(id) >= 25) out.push({ t: "Passar a noite junto (+18)", icon: "heart", fn: () => casualNight(id) });
    const partner = player.spouse || player.dating;
    if (player.trisal && player.trisal.includes(id)) out.push({ t: "Encontro a três (+18)", icon: "heart", fn: () => trioDate(id) });
    else if (partner && partner !== id && !player.trisal && notCrew(partner) && friendship(id) >= 40) out.push({ t: `Propor trisal com ${shortName(partner)} (+18)`, icon: "ring", fn: () => proposeTrisal(id) });
    return out;
  };
}
