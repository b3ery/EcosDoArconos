/**
 * ECOS DO ARCANO — bichinhos.js
 * Bichinhos melhores:
 *  - 5 espécies novas: raposa, tartaruga, papagaio, porquinho e patinho.
 *  - O Abrigo virou uma tela com cartões: cada bicho desenhado, com nome,
 *    jeitinho (brincalhão, preguiçoso, medroso...), idade e uma historinha.
 *    Os bichos do abrigo mudam todo dia. Dá para adotar até 5.
 *  - Tela do bichinho: carinho, comida, banho, passeio, brincar de buscar e
 *    ensinar truques (sentar, dar a pata, rolar, dançar, fingir de morto).
 *    Cada bicho tem humor, fome e limpeza que mudam com o tempo.
 * Modifica (envolve) funções de outros arquivos: drawPet, petShelter, petList,
 * petMenu, adoptPet, onNewDay.
 */

"use strict";

Object.assign(PET_T, {
  raposa: { n: "Raposa", ic: "", b: "Esperta: +20% de ouro nas vendas para lojas." },
  tartaruga: { n: "Tartaruga", ic: "", b: "Calma: você cansa menos ao trabalhar." },
  papagaio: { n: "Papagaio", ic: "", b: "Tagarela: as conversas rendem mais amizade." },
  porquinho: { n: "Porquinho", ic: "", b: "Fuçador: às vezes acha comida no chão." },
  patinho: { n: "Patinho", ic: "", b: "Alegre: a diversão cai mais devagar." },
});
Object.assign(PET_NAMES, {
  raposa: ["Ruiva", "Fagulha", "Raposinha", "Canela", "Zorro"],
  tartaruga: ["Lentilha", "Casco", "Dona Lenta", "Tico", "Jabuti"],
  papagaio: ["Louro", "Paçoca", "Kiwi", "Tagarela", "Pirata"],
  porquinho: ["Toicinho", "Bolota", "Rosinha", "Trufa", "Pipoca"],
  patinho: ["Quack", "Gema", "Bolinha", "Patolino", "Plim"],
});
Object.assign(PET_COLS, {
  raposa: ["#d9662a", "#c94a1a", "#e8e4dc"],
  tartaruga: ["#5a8a3a", "#7a9a4a", "#4a6a3a"],
  papagaio: ["#2aa84a", "#2a6ad9", "#d93a2a"],
  porquinho: ["#f0a8b8", "#e8c0a8", "#8a5a4a"],
  patinho: ["#f2d23a", "#f2eee4", "#e8c86a"],
});
const PET_SPECIES = Object.keys(PET_T);
const PET_PERS = {
  brincalhao: ["Brincalhão", "Não para quieto um segundo."],
  preguicoso: ["Preguiçoso", "Dorme 18 horas por dia. Às vezes 19."],
  medroso: ["Medroso", "Se assusta com o próprio rabo."],
  guloso: ["Guloso", "Faria qualquer coisa por um petisco."],
  carinhoso: ["Carinhoso", "Pede colo o tempo todo."],
  curioso: ["Curioso", "Mete o focinho em tudo."],
  bravo: ["Bravinho", "Late para o vento. Mas tem bom coração."],
};
const PET_STORIES = [
  "Foi encontrado dentro de um barril vazio no mercado.",
  "Apareceu na porta do templo numa noite de chuva.",
  "Morava no telhado da padaria e roubava pãezinhos.",
  "Veio no barco de um pescador do Porto e não quis mais ir embora.",
  "Foi resgatado pela Princesa Julia perto da ponte.",
  "Seguia o carteiro todos os dias até que ele trouxe para o abrigo.",
  "Dormia dentro de um chapéu velho na Alfaiataria.",
];
const PET_TRICKS = [
  ["sentar", "Sentar"],
  ["pata", "Dar a pata"],
  ["rolar", "Rolar"],
  ["dancar", "Dançar"],
  ["morto", "Fingir de morto"],
];
const PET_MAX = 5;

/* ===================== DESENHO DAS ESPÉCIES NOVAS ===================== */
{
  const dpBase = drawPet;
  drawPet = function (p, X, Y, flip, t, moving) {
    if (!p || !["raposa", "tartaruga", "papagaio", "porquinho", "patinho"].includes(p.t)) return dpBase.apply(this, arguments);
    const c = p.col,
      hop = moving ? Math.abs(Math.sin(t * 12)) * -3 : 0;
    Y += hop;
    ctx.fillStyle = "rgba(0,0,0,.22)";
    ctx.fillRect(X + 2, Y + 14 - hop, 14, 3);
    const r = (a, b, w, h, col) => {
      ctx.fillStyle = col || c;
      ctx.fillRect(flip ? X + 18 - a - w : X + a, Y + b, w, h);
    };
    if (p.t === "raposa") {
      r(2, 5, 12, 7);
      r(11, 1, 7, 6);
      r(11, -2, 2, 3);
      r(16, -2, 2, 3);
      r(17, 4, 2, 2, "#2a1a10");
      r(12, 5, 4, 2, "#f2eee4");
      r(-3, 4, 6, 4);
      r(-4, 5, 2, 2, "#f2eee4");
      r(3, 12, 2, 3, "#2a1a10");
      r(11, 12, 2, 3, "#2a1a10");
      r(15, 2, 1, 1, "#111");
    } else if (p.t === "tartaruga") {
      r(3, 5, 12, 7, shade(c, -0.15));
      r(4, 4, 10, 2);
      r(5, 6, 3, 3, shade(c, 0.2));
      r(10, 6, 3, 3, shade(c, 0.2));
      r(14, 7, 5, 4, "#9ab06a");
      r(17, 8, 1, 1, "#111");
      r(3, 12, 3, 2, "#9ab06a");
      r(12, 12, 3, 2, "#9ab06a");
    } else if (p.t === "papagaio") {
      const fy = Math.sin(t * 6) * 1.5 - 4;
      Y += fy;
      r(5, 3, 8, 10);
      r(6, 0, 7, 5);
      r(12, 2, 3, 3, "#f2d23a");
      r(10, 1, 1, 1, "#111");
      r(4, 6, 3, 6, shade(c, -0.3));
      r(6, 13, 4, 4, "#d93a2a");
    } else if (p.t === "porquinho") {
      r(2, 5, 13, 8);
      r(11, 3, 7, 7);
      r(17, 6, 2, 3, shade(c, -0.15));
      r(12, 2, 2, 2, shade(c, -0.1));
      r(15, 4, 1, 1, "#111");
      r(0, 6, 2, 2, shade(c, -0.2));
      r(3, 13, 2, 2);
      r(11, 13, 2, 2);
    } else {
      r(3, 6, 10, 7);
      r(10, 2, 6, 6);
      r(15, 5, 4, 2, "#e8902a");
      r(13, 3, 1, 1, "#111");
      r(4, 7, 4, 3, shade(c, -0.1));
      r(5, 13, 2, 2, "#e8902a");
      r(9, 13, 2, 2, "#e8902a");
    }
  };
}
/** Desenha um bichinho num canvas da interface (troca o ctx por um instante). */
function petPortrait(cv, p, scale) {
  const g = cv.getContext("2d");
  g.clearRect(0, 0, cv.width, cv.height);
  g.imageSmoothingEnabled = false;
  const old = ctx;
  try {
    ctx = g;
    g.save();
    g.scale(scale, scale);
    drawPet(p, (cv.width / scale - 18) / 2, (cv.height / scale - 16) / 2 + 2, true, 0, false);
    g.restore();
  } finally {
    ctx = old;
  }
}
function paintPets(root) {
  root.querySelectorAll("canvas[data-pet]").forEach((cv) => {
    try {
      petPortrait(cv, JSON.parse(cv.dataset.pet), +cv.dataset.sc || 5);
    } catch (e) {}
  });
}
const petAttr = (p) => JSON.stringify({ t: p.t, col: p.col }).replace(/"/g, "&quot;");

/* ===================== ESTADO DE CADA BICHO ===================== */
function petState(p) {
  p.hunger = p.hunger ?? 70;
  p.clean = p.clean ?? 80;
  p.tricks = p.tricks || {};
  p.pers = p.pers || pk(Object.keys(PET_PERS));
  return p;
}
function petMood(p) {
  petState(p);
  const v = (p.love + p.hunger + p.clean) / 3;
  return v >= 75 ? ["Radiante", "#7bd88f"] : v >= 50 ? ["Feliz", "#c8e06a"] : v >= 30 ? ["Entediado", "#f2c14e"] : ["Triste", "#ff7a7a"];
}
{
  const dayBase = onNewDay;
  onNewDay = function () {
    const r = dayBase.apply(this, arguments);
    for (const p of player.pets || []) {
      petState(p);
      p.hunger = Math.max(0, p.hunger - 18);
      p.clean = Math.max(0, p.clean - 10);
      if (p.hunger < 25) p.love = Math.max(0, p.love - 6);
    }
    return r;
  };
}

/* ===================== O ABRIGO ===================== */
function shelterRoster() {
  const R = rng(player.day * 977 + 31);
  const pick = (a) => a[Math.floor(R() * a.length)];
  return [0, 1, 2, 3, 4, 5].map((i) => {
    const t = PET_SPECIES[Math.floor(R() * PET_SPECIES.length)];
    return { i, t, name: pick(PET_NAMES[t]), col: pick(PET_COLS[t]), pers: pick(Object.keys(PET_PERS)), age: 1 + Math.floor(R() * 9), story: pick(PET_STORIES) };
  });
}
function petOverlay() {
  let el = byId("petov");
  if (!el) {
    el = document.createElement("div");
    el.id = "petov";
    el.className = "ui ov";
    byId("screen").appendChild(el);
  }
  el.style.display = "flex";
  game.mode = "pets";
  return el;
}
function closePets() {
  const el = byId("petov");
  if (el) el.style.display = "none";
  if (game.mode === "pets") game.mode = "world";
}
KEY_HANDLERS.pets = (k) => k === "escape" && closePets();
if (typeof OVERLAY_MODES !== "undefined") OVERLAY_MODES.pets = "petov";

petShelter = function () {
  player.pets = player.pets || [];
  const el = petOverlay();
  const adopted = (player.shelterTaken && player.shelterTaken.day === player.day && player.shelterTaken.ids) || [];
  const cards = shelterRoster()
    .filter((a) => !adopted.includes(a.i))
    .map(
      (a) => `<div class="pv-card"><canvas width="140" height="110" data-sc="5" data-pet="${petAttr(a)}"></canvas>
      <b>${a.name}</b><small>${PET_T[a.t].n} · ${a.age} ${a.age > 1 ? "anos" : "ano"} · ${PET_PERS[a.pers][0]}</small>
      <p>${PET_PERS[a.pers][1]} ${a.story}</p><em>${PET_T[a.t].b}</em>
      <button class="go" data-adopt="${a.i}" ${player.pets.length >= PET_MAX ? "disabled" : ""}>Adotar (30 ouro)</button></div>`,
    )
    .join("");
  el.innerHTML = `<div class="pv-box"><div class="pv-head"><h2>${iconHTML("paw", 20)} Abrigo dos Bichos</h2><span>Seus bichinhos: ${player.pets.length}/${PET_MAX} · Ouro: ${player.gold}</span><button id="pvmine">Meus bichinhos</button><button id="pvx">✕</button></div>
    <p class="pv-intro">Cuidadora Lila: "Cada um tem um jeitinho. Os bichos mudam todo dia, então volte sempre!"</p>
    <div class="pv-grid">${cards || "<p>Todos foram adotados hoje! Volte amanhã.</p>"}</div></div>`;
  paintPets(el);
  byId("pvx").onclick = closePets;
  byId("pvmine").onclick = () => (player.pets.length ? petList() : toast("Você ainda não tem bichinhos.", 2000));
  el.querySelectorAll("[data-adopt]").forEach(
    (b) =>
      (b.onclick = () => {
        const a = shelterRoster()[+b.dataset.adopt];
        if (player.gold < 30) return toast("A doação é de 30 de ouro.", 2000);
        if (player.pets.length >= PET_MAX) return toast(`Já são ${PET_MAX} bichinhos!`, 2000);
        player.gold -= 30;
        player.pets.push(petState({ t: a.t, name: a.name, col: a.col, love: 45, day: player.day, pers: a.pers, age: a.age }));
        player.shelterTaken = { day: player.day, ids: [...adopted, a.i] };
        if (player.petA == null) player.petA = player.pets.length - 1;
        if (typeof repAdd === "function") repAdd(2);
        game.petPos = null;
        saveGame();
        playSound(880, 0.15, "sine");
        toast(`${a.name} agora é seu! Cuide bem dele(a).`, 2600);
        petMenu(player.pets.length - 1);
      }),
  );
};
adoptPet = function () {
  petShelter();
};

/* ===================== MEUS BICHINHOS ===================== */
petList = function () {
  const el = petOverlay();
  const cards = (player.pets || [])
    .map((p, i) => {
      const [m, mc] = petMood(p);
      return `<div class="pv-card"><canvas width="140" height="110" data-sc="5" data-pet="${petAttr(p)}"></canvas><b>${p.name}</b><small>${PET_T[p.t].n} · <span style="color:${mc}">${m}</span>${player.petA === i ? " · com você" : ""}</small><button class="go" data-open="${i}">Cuidar</button></div>`;
    })
    .join("");
  el.innerHTML = `<div class="pv-box"><div class="pv-head"><h2>${iconHTML("paw", 20)} Meus bichinhos</h2><button id="pvx">✕</button></div><div class="pv-grid">${cards || "<p>Nenhum ainda. Visite o Abrigo dos Bichos!</p>"}</div></div>`;
  paintPets(el);
  byId("pvx").onclick = closePets;
  el.querySelectorAll("[data-open]").forEach((b) => (b.onclick = () => petMenu(+b.dataset.open)));
};
const bar = (v, c) => `<div class="pv-bar"><i style="width:${Math.max(0, Math.min(100, v))}%;background:${c}"></i></div>`;
petMenu = function (i) {
  const p = player.pets && player.pets[i];
  if (!p) return;
  petState(p);
  const el = petOverlay();
  const [m, mc] = petMood(p);
  const tricks = PET_TRICKS.map(([k, n]) => `<span class="${(p.tricks[k] || 0) >= 3 ? "ok" : ""}">${n}${(p.tricks[k] || 0) >= 3 ? " ✓" : ` ${p.tricks[k] || 0}/3`}</span>`).join("");
  const acts = [
    ["carinho", "heart", "Fazer carinho"],
    ["comida", "meat", "Dar comida"],
    ["banho", "soap", "Dar banho"],
    ["passear", "boots", "Passear (30 min)"],
    ["buscar", "ball", "Brincar de buscar"],
    ["truque", "star", "Ensinar truque"],
    ["mostrar", "sparkle", "Pedir um truque"],
    ["levar", "paw", player.petA === i ? "Deixar em casa" : "Levar comigo"],
  ];
  el.innerHTML = `<div class="pv-box pv-one"><div class="pv-head"><h2>${p.name}</h2><span>${PET_T[p.t].n} · ${PET_PERS[p.pers][0]}</span><button id="pvback">Todos</button><button id="pvx">✕</button></div>
    <div class="pv-main"><div class="pv-pic"><canvas width="220" height="170" data-sc="8" data-pet="${petAttr(p)}"></canvas><div class="pv-mood" style="color:${mc}">${m}</div></div>
    <div class="pv-stats"><label>Carinho ${bar(p.love, "#ff7a9a")}</label><label>Barriga cheia ${bar(p.hunger, "#f2c14e")}</label><label>Limpeza ${bar(p.clean, "#7ac8ff")}</label>
    <div class="pv-tricks"><b>Truques</b>${tricks}</div><p class="pv-bonus">${p.love >= 25 ? "Bônus ativo: " + PET_T[p.t].b : "Está triste: faça carinho para o bônus voltar."}</p></div></div>
    <div class="pv-acts">${acts.map(([k, ic, n]) => `<button data-act="${k}">${iconHTML(ic, 16)} ${n}</button>`).join("")}</div></div>`;
  paintPets(el);
  byId("pvx").onclick = closePets;
  byId("pvback").onclick = petList;
  el.querySelectorAll("[data-act]").forEach((b) => (b.onclick = () => petAct(i, b.dataset.act)));
};
function petAct(i, k) {
  const p = petState(player.pets[i]);
  const once = (key) => {
    const kk = `pet${i}${key}`;
    if (player.famDay[kk] === player.day) return false;
    player.famDay[kk] = player.day;
    return true;
  };
  let msg = "";
  const P = PET_PERS[p.pers][0];
  if (k === "carinho") {
    if (once("c")) p.love = Math.min(100, p.love + (p.pers === "carinhoso" ? 12 : 8));
    msg = pk([`${p.name} fecha os olhos e encosta em você.`, `${p.name} se joga de barriga para cima!`, `${p.name} faz um barulhinho feliz.`]);
  } else if (k === "comida") {
    const food = ["petisco", "racao", "carne", "peixe", "pao", "maca", "queijo"].find((f) => itemCount(f));
    if (!food) msg = `Você não tem comida para ${p.name}. Ração e petisco ficam no Armazém.`;
    else {
      removeItem(food);
      p.hunger = Math.min(100, p.hunger + (food === "petisco" ? 45 : 30));
      p.love = Math.min(100, p.love + (food === "petisco" ? 10 : 4) + (p.pers === "guloso" ? 4 : 0));
      msg = `${p.name} comeu ${ITEMS[food].nome.toLowerCase()} ${p.pers === "guloso" ? "em dois segundos e pediu mais" : "todinho"}.`;
    }
  } else if (k === "banho") {
    p.clean = 100;
    if (p.pers === "medroso" || p.t === "gato") p.love = Math.max(0, p.love - 2);
    else p.love = Math.min(100, p.love + 3);
    msg = p.t === "gato" ? `${p.name} odiou o banho, mas está cheiroso.` : p.t === "patinho" || p.t === "tartaruga" ? `${p.name} adorou a água!` : `${p.name} saiu do banho e se sacudiu em você.`;
  } else if (k === "passear") {
    if (once("p")) ((p.love = Math.min(100, p.love + 10)), typeof addNeed === "function" && addNeed("fun", 12));
    player.clock = Math.min(1439, player.clock + 30);
    p.clean = Math.max(0, p.clean - 10);
    msg = pk([`Vocês dão uma volta pela vila. Todo mundo para para fazer carinho em ${p.name}.`, `${p.name} encontrou um amigo no caminho e ficou brincando.`, `${p.name} puxou você até a padaria. Coincidência?`]);
  } else if (k === "buscar") {
    if (p.pers === "preguicoso" && Math.random() < 0.5) msg = `Você joga a bolinha. ${p.name} olha para ela... e volta a dormir.`;
    else {
      if (once("b")) p.love = Math.min(100, p.love + 8);
      p.hunger = Math.max(0, p.hunger - 5);
      if (typeof addNeed === "function") addNeed("fun", 8);
      msg = `Você joga a bolinha longe. ${p.name} ${p.t === "tartaruga" ? "chega lá... amanhã." : "busca e traz de volta, todo orgulhoso!"}`;
    }
  } else if (k === "truque") {
    const next = PET_TRICKS.find(([t]) => (p.tricks[t] || 0) < 3);
    if (!next) msg = `${p.name} já sabe todos os truques! Que gênio.`;
    else if (!once("t")) msg = `${p.name} já treinou hoje. Amanhã tem mais.`;
    else {
      const ok = Math.random() < (p.pers === "curioso" || p.pers === "brincalhao" ? 0.85 : p.pers === "preguicoso" ? 0.45 : 0.65);
      if (ok) p.tricks[next[0]] = (p.tricks[next[0]] || 0) + 1;
      msg = ok ? ((p.tricks[next[0]] >= 3) ? `${p.name} aprendeu a ${next[1].toLowerCase()}!` : `${p.name} está pegando o jeito de ${next[1].toLowerCase()} (${p.tricks[next[0]]}/3).`) : `${p.name} não entendeu nada, mas ganhou carinho mesmo assim.`;
    }
  } else if (k === "mostrar") {
    const known = PET_TRICKS.filter(([t]) => (p.tricks[t] || 0) >= 3);
    if (!known.length) msg = `${p.name} ainda não sabe nenhum truque. Ensine primeiro!`;
    else {
      const [, n] = pk(known);
      if (typeof repAdd === "function" && once("m")) repAdd(1);
      msg = `"${p.name}, ${n.toLowerCase()}!" ... e ${p.name} faz direitinho! Quem está perto aplaude.`;
    }
  } else if (k === "levar") {
    player.petA = player.petA === i ? null : i;
    game.petPos = null;
    msg = player.petA === i ? `${p.name} vai com você.` : `${p.name} fica em casa.`;
  }
  playSound(820, 0.08, "sine");
  saveGame();
  petMenu(i);
  toast(msg + (k === "truque" || k === "mostrar" ? "" : ` (${P})`), 3200);
}

/* ===================== VISUAL ===================== */
{
  const st = document.createElement("style");
  st.textContent = `
  #petov canvas{position:static!important;inset:auto!important;transform:none!important;display:block;margin:0 auto}
  #petov.ov{padding:0!important;border:0!important}
  #petov{position:absolute;inset:0;display:none;align-items:center;justify-content:center;z-index:30;background:rgba(10,6,18,.72)}
  .pv-box{width:min(96%,52em);max-height:94%;overflow:auto;background:linear-gradient(#2a2040,#1a1428);border:3px solid #c9a03a;border-radius:14px;padding:.8em;color:#fff}
  .pv-head{display:flex;align-items:center;gap:.6em;flex-wrap:wrap}.pv-head h2{margin:0;font-family:"Pixelify Sans",sans-serif;color:#ffe08a;font-size:1.3em;flex:1}
  .pv-head span{font-size:.82em;color:#d8c8f0}.pv-head button{font-size:.8em;padding:.25em .7em}
  .pv-intro{font-size:.85em;color:#e8dcf8;margin:.4em 0 .6em}
  .pv-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(12em,1fr));gap:.6em}
  .pv-card{background:rgba(255,255,255,.06);border:2px solid #4a3a6a;border-radius:10px;padding:.5em;display:flex;flex-direction:column;align-items:center;text-align:center;gap:.2em}
  .pv-card canvas{width:140px;height:110px;image-rendering:pixelated;background:radial-gradient(#5a7a4a,#3a5a3a);border-radius:8px}
  .pv-card b{font-family:"Pixelify Sans",sans-serif;font-size:1.1em;color:#ffe08a}.pv-card small{font-size:.75em;color:#c8b8e8}
  .pv-card p{font-size:.75em;margin:.2em 0;color:#e8dcf8;line-height:1.3}.pv-card em{font-size:.7em;color:#9ad8a8;font-style:normal}
  .pv-card button{margin-top:auto;font-size:.8em}
  .pv-main{display:flex;gap:1em;flex-wrap:wrap;margin:.6em 0}.pv-pic{text-align:center}
  .pv-pic canvas{width:220px;height:170px;image-rendering:pixelated;background:radial-gradient(#6a8a5a,#3a5a3a);border-radius:12px;border:2px solid #4a3a6a}
  .pv-mood{font-family:"Pixelify Sans",sans-serif;font-size:1.1em;margin-top:.2em}
  .pv-stats{flex:1;min-width:14em;display:flex;flex-direction:column;gap:.35em;font-size:.85em}
  .pv-bar{height:10px;border-radius:6px;background:#3a2a5a;overflow:hidden;margin-top:2px}.pv-bar i{display:block;height:100%}
  .pv-tricks{display:flex;flex-wrap:wrap;gap:.3em;align-items:center}.pv-tricks b{width:100%}
  .pv-tricks span{font-size:.75em;padding:.1em .45em;border-radius:12px;background:#3a2a5a}.pv-tricks span.ok{background:#2a6a3a}
  .pv-bonus{font-size:.78em;color:#9ad8a8;margin:.2em 0}
  .pv-acts{display:grid;grid-template-columns:repeat(4,1fr);gap:.4em}.pv-acts button{font-size:.82em;padding:.4em .3em}
  @media (max-height:520px){.pv-box{padding:.5em}.pv-pic canvas{width:150px;height:116px}.pv-acts{grid-template-columns:repeat(4,1fr)}.pv-acts button{font-size:.72em}}`;
  document.head.appendChild(st);
}

/* casa: lugar para até 5 bichinhos */
if (typeof HOME_PET_SPOTS !== "undefined" && HOME_PET_SPOTS.length < PET_MAX) HOME_PET_SPOTS.push([6, 8], [9, 8]);
