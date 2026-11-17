/**
 * ECOS DO ARCANO — coracoes-jornal-cemiterio.js (Simulador)
 *  - Corações (o "Tinder" de Cinzaluz): cartões com a pessoa DESENHADA, idade,
 *    cidade, jeito de ser, gostos e o bilhete. Passar (✕) ou curtir (♥); se
 *    curtir de volta, dá match. A aba "Meus matches" lista todo mundo com o
 *    desenho e um botão "Marcar encontro" para achar a pessoa de novo.
 *  - Botões na tela (só no Simulador): Jornal (com bolinha quando tem notícia
 *    nova) e Corações.
 * Modifica (envolve) funções de outros arquivos: heartBoardMenu, openPaper, update.
 */

"use strict";

/* ===================== DESENHO EM CARTÃO ===================== */
function drawRectsOn(cv, rects, scale, flip) {
  const c = cv.getContext("2d");
  c.imageSmoothingEnabled = false;
  c.clearRect(0, 0, cv.width, cv.height);
  const ox = (cv.width - 16 * scale) / 2,
    oy = (cv.height - 16 * scale) / 2;
  for (const [rx, ry, rw, rh, col] of rects) {
    c.fillStyle = col;
    const X = flip ? ox + (16 - rx - rw) * scale : ox + rx * scale;
    c.fillRect(Math.round(X), Math.round(oy + ry * scale), Math.ceil(rw * scale), Math.ceil(rh * scale));
  }
}
function personRects(p) {
  if (p.hero) return heroRects(p.hero, "down", null);
  return wizardRects(p.robe, p.hat ?? null, p.hair, null, "down", 0);
}
function paintPortraits(root) {
  root.querySelectorAll("canvas[data-pp]").forEach((cv) => {
    try {
      drawRectsOn(cv, personRects(JSON.parse(cv.dataset.pp)), +cv.dataset.sc || 8, false);
    } catch (e) {}
  });
}
const ppAttr = (o) => JSON.stringify(o).replace(/"/g, "&quot;");

/* ===================== CORAÇÕES ===================== */
const PS_DESC = {
  gentil: ["Gentil", "Coração mole, ajuda todo mundo."],
  engracado: ["Engraçad@", "Piada pronta pra qualquer hora."],
  aventureiro: ["Aventureir@", "Nunca fica parad@ num lugar só."],
  timido: ["Tímid@", "Fala pouco, mas sente muito."],
  serio: ["Séri@", "Palavra dada é palavra cumprida."],
  orgulhoso: ["Orgulhos@", "Sabe o quanto vale. E cobra."],
  esperto: ["Espert@", "Sempre tem um plano (ou três)."],
  sabio: ["Sábi@", "Conselho bom e chá quentinho."],
};
const INTERESTS = ["Festivais", "Pescar no porto", "Ler na biblioteca", "Cozinhar", "Dançar", "Cavalgar", "Jardinagem", "Música de taverna", "Pôr do sol no farol", "Colecionar conchas", "Trilhas na serra", "Jogos de cartas", "Bichos", "Poesia", "Feira da praça"];
const PS_LIKE = { gentil: 0.62, engracado: 0.6, aventureiro: 0.55, timido: 0.4, serio: 0.42, orgulhoso: 0.3, esperto: 0.5, sabio: 0.5 };
const gz = (s, fem) => s.replace(/@/g, fem ? "a" : "o");

function heartsDeck() {
  const base = heartBoardAds();
  const R = rng(player.day * 4421 + 77);
  const more = [5, 6, 7].map((i) => ({ ...base[i % base.length], i, nm: WALKER_NAMES[Math.floor(R() * WALKER_NAMES.length)], age: 19 + Math.floor(R() * 40), robe: ["#2a6a6a", "#9a4a2a", "#5a3a8a"][i - 5], hair: ["#d9a441", "#1a1a1a", "#8a3a1a"][i - 5] }));
  return base.concat(more).map((a) => {
    const r2 = rng(hashStr(a.nm + a.i + player.day));
    const ints = INTERESTS.slice().sort(() => r2() - 0.5).slice(0, 3);
    return { ...a, ints, fem: r2() < 0.5, fav: CONTACT_FAVS[Math.floor(r2() * CONTACT_FAVS.length)] };
  });
}
function heartsState() {
  if (player.famDay.mural !== player.day) {
    player.famDay.mural = player.day;
    player.muralAnswered = [];
  }
  return player.muralAnswered;
}
function openHearts(tab) {
  if (!["world", "choice"].includes(game.mode) && game.mode !== "hearts") return;
  byId("choice").style.display = "none";
  let el = byId("hearts");
  if (!el) {
    el = document.createElement("div");
    el.id = "hearts";
    el.className = "ui ov";
    byId("screen").appendChild(el);
  }
  game.mode = "hearts";
  game.heartsTab = tab || game.heartsTab || "deck";
  el.style.display = "flex";
  renderHearts();
}
function closeHearts() {
  const el = byId("hearts");
  if (el) el.style.display = "none";
  if (game.mode === "hearts") game.mode = "world";
}
function renderHearts() {
  const el = byId("hearts");
  const done = heartsState();
  const deck = heartsDeck().filter((a) => !done.includes(a.i));
  const tabs = `<div class="ht-tabs"><button data-tab="deck" class="${game.heartsTab === "deck" ? "on" : ""}">${iconHTML("heart", 16)} Descobrir</button><button data-tab="mine" class="${game.heartsTab === "mine" ? "on" : ""}">${iconHTML("ring", 16)} Meus matches (${(player.contacts || []).length})</button><button id="htx">✕</button></div>`;
  let body = "";
  if (game.heartsTab === "deck") {
    const a = deck[0];
    if (!a) body = `<div class="ht-empty">${iconHTML("heart", 30)}<p>Acabaram os perfis de hoje.<br>Volte amanhã: sempre aparece gente nova.</p></div>`;
    else {
      const ps = PS_DESC[a.ps] || PS_DESC.gentil;
      body = `<div class="ht-card" id="htcard">
        <div class="ht-pic"><canvas width="160" height="160" data-sc="9" data-pp="${ppAttr({ robe: a.robe, hat: null, hair: a.hair })}"></canvas><span class="ht-want ${a.want}">${a.want === "casamento" ? "Quer casar" : "Quer namorar"}</span></div>
        <div class="ht-info"><h3>${a.nm}, ${a.age}</h3><div class="ht-town">${iconHTML("map", 14)} Mora ${TOWN_LABEL[a.zone] || "na região"}</div>
        <div class="ht-ps"><b>${gz(ps[0], a.fem)}</b> · ${gz(ps[1], a.fem)}</div>
        <div class="ht-ints">${a.ints.map((i) => `<span>${i}</span>`).join("")}</div>
        <p class="ht-bio">"${a.text}"</p><div class="ht-fav">Ama ganhar: <b>${ITEMS[a.fav] ? ITEMS[a.fav].nome : a.fav}</b></div></div></div>
        <div class="ht-btns"><button id="htno" title="Passar (←)">✕</button><button id="htyes" title="Curtir (→)">♥</button></div>
        <div class="ht-left">${deck.length} perfil(is) hoje · arraste o cartão para o lado</div>`;
    }
  } else {
    const L = (player.contacts || []).filter((c) => NPCS[c.id] && !(typeof isDead === "function" && isDead(c.id)));
    body = L.length
      ? `<div class="ht-list">${L.map(
          (c) => `<div class="ht-row"><canvas width="64" height="64" data-sc="4" data-pp="${ppAttr({ robe: c.robe, hat: c.hat, hair: c.hair })}"></canvas><div><b>${c.nm}</b>${c.age ? `, ${c.age}` : ""}<small>${(PS_DESC[c.ps] || PS_DESC.gentil)[0].replace(/@/g, "o/a")} · ${TOWN_LABEL[c.zone] || ""} · ${player.spouse === c.id ? "casad@ com você".replace("@", "o/a") : player.dating === c.id ? "namorando você" : `amizade ${friendship(c.id)}`}</small></div><button data-meet="${c.id}">Marcar encontro</button></div>`,
        ).join("")}</div>`
      : `<div class="ht-empty">${iconHTML("ring", 30)}<p>Nenhum match ainda.<br>Curta alguém na aba Descobrir!</p></div>`;
  }
  el.innerHTML = `<div class="ht-box">${tabs}${body}</div>`;
  paintPortraits(el);
  el.querySelectorAll("[data-tab]").forEach((b) => (b.onclick = () => ((game.heartsTab = b.dataset.tab), renderHearts())));
  byId("htx").onclick = closeHearts;
  el.querySelectorAll("[data-meet]").forEach((b) => (b.onclick = () => meetContact(b.dataset.meet)));
  const a = deck[0];
  if (game.heartsTab === "deck" && a) {
    byId("htno").onclick = () => swipe(a, false);
    byId("htyes").onclick = () => swipe(a, true);
    const card = byId("htcard");
    let x0 = null;
    card.onpointerdown = (e) => ((x0 = e.clientX), card.setPointerCapture(e.pointerId));
    card.onpointermove = (e) => {
      if (x0 == null) return;
      const dx = e.clientX - x0;
      card.style.transform = `translateX(${dx}px) rotate(${dx / 20}deg)`;
      card.style.boxShadow = dx > 40 ? "0 0 0 4px #ff5a8a" : dx < -40 ? "0 0 0 4px #8a8a9a" : "";
    };
    card.onpointerup = (e) => {
      if (x0 == null) return;
      const dx = e.clientX - x0;
      x0 = null;
      if (Math.abs(dx) > 90) swipe(a, dx > 0);
      else card.style.transform = card.style.boxShadow = "";
    };
  }
}
function swipe(a, like) {
  const card = byId("htcard");
  if (card) ((card.style.transition = "transform .25s"), (card.style.transform = `translateX(${like ? 500 : -500}px) rotate(${like ? 25 : -25}deg)`));
  heartsState().push(a.i);
  playSound(like ? 760 : 300, 0.08, "sine");
  setTimeout(() => {
    if (!like) return renderHearts();
    if (a.want === "casamento" && player.spouse && !openRelationship()) {
      renderHearts();
      return toast(`${a.nm} viu que você é casad${genderWord("o", "a", "e")} e passou.`, 2600);
    }
    const chance = (PS_LIKE[a.ps] || 0.5) + ((player.rep ?? 50) - 50) / 200 + ((player.hygiene ?? 70) > 60 ? 0.08 : -0.12) + (typeof hasTrait === "function" && hasTrait("player", "charmoso") ? 0.15 : 0);
    if (Math.random() > chance) {
      renderHearts();
      return toast(`${a.nm} ainda não curtiu de volta...`, 2200);
    }
    const id = registerContact(a, a.want === "casamento" ? 40 : 30);
    saveGame();
    showMatch(a, id);
  }, 260);
}
function showMatch(a, id) {
  const el = byId("hearts");
  el.innerHTML = `<div class="ht-box ht-match"><h2>Deu match!</h2><div class="ht-pair"><canvas width="120" height="120" data-sc="7" data-pp="${ppAttr({ hero: player.look })}"></canvas><span>♥</span><canvas width="120" height="120" data-sc="7" data-pp="${ppAttr({ robe: a.robe, hat: null, hair: a.hair })}"></canvas></div><p>Você e ${a.nm} se curtiram!</p><div class="ht-btns2"><button class="go" id="htmeet">Marcar encontro agora</button><button id="htlater">Continuar vendo perfis</button></div></div>`;
  paintPortraits(el);
  playSound(880, 0.2, "sine");
  setTimeout(() => playSound(1175, 0.25, "sine"), 160);
  byId("htmeet").onclick = () => meetContact(id);
  byId("htlater").onclick = () => renderHearts();
}
/** Encontro marcado: a pessoa vem até você (não some mais no mapa). */
function meetContact(id) {
  closeHearts();
  const c = (player.contacts || []).find((q) => q.id === id);
  if (!c || !NPCS[id]) return;
  const lugar = pk(["na taverna", "na praça", "no banco da fonte", "na feira"]);
  player.clock = Math.min(1439, player.clock + 60);
  game.fade = 1;
  addFriendship(id, 3);
  saveGame();
  say([["", `Você manda um bilhete e ${c.nm} aparece ${lugar} uma hora depois.`], [c.nm, pk(CONTACT_LINES[c.ps] || CONTACT_LINES.gentil)]], () => socialMenu(id));
}
heartBoardMenu = () => openHearts("deck");
KEY_HANDLERS.hearts = (k) => {
  if (k === "escape") return closeHearts(), true;
  const a = heartsDeck().filter((q) => !heartsState().includes(q.i))[0];
  if (game.heartsTab === "deck" && a && (k === "arrowleft" || k === "arrowright")) return swipe(a, k === "arrowright"), true;
};
OVERLAY_MODES.hearts = "hearts";

/* ===================== JORNAL VISÍVEL ===================== */
{
  const opBase = openPaper;
  openPaper = function () {
    const n = (player.news || []).length + ":" + ((player.news || []).slice(-1)[0] || {}).t;
    if (game.paperSig !== n) ((game.paperDay = null), (game.paperSig = n));
    const r = opBase.apply(this, arguments);
    player.paperSeen = n;
    return r;
  };
}
(() => {
  const mk = (id, ic, label, fn) => {
    const b = document.createElement("button");
    b.id = id;
    b.className = "ui lifeb";
    b.title = label;
    b.innerHTML = `${iconHTML(ic, 18)}<span>${label}</span><i></i>`;
    b.onclick = (e) => (e.stopPropagation(), fn());
    byId("hud").parentNode.appendChild(b);
    return b;
  };
  mk("jnb", "scroll", "Jornal", () => openPaper());
  mk("htb", "heart", "Corações", () => openHearts("deck"));
  const st = document.createElement("style");
  st.textContent = `
  .lifeb{position:absolute;left:1%;z-index:6;display:none;align-items:center;gap:.35em;font-size:.82em;padding:.25em .55em;opacity:.92}
  .lifeb i{display:none;position:absolute;right:-4px;top:-4px;width:11px;height:11px;border-radius:50%;background:#ff4a5a;border:2px solid #fff}
  .lifeb.new i{display:block}
  #jnb{top:27%}#htb{top:33.5%}
  body.tallui .lifeb,body.ontitle .lifeb{display:none!important}
  @media (max-height:520px){.lifeb span{display:none}.lifeb{font-size:.75em}#jnb{top:30%}#htb{top:39%}}
  #hearts{position:absolute;inset:0;display:none;align-items:center;justify-content:center;z-index:30;background:rgba(10,6,18,.72)}
  .ht-box{width:min(94%,26em);max-height:94%;overflow:auto;background:linear-gradient(#2a1838,#1a1028);border:3px solid #ff6a9a;border-radius:16px;padding:.7em;color:#fff;box-shadow:0 8px 0 rgba(0,0,0,.4)}
  .ht-tabs{display:flex;gap:.35em;margin-bottom:.6em}.ht-tabs button{flex:1;font-size:.85em;padding:.35em}.ht-tabs button.on{background:#ff6a9a;color:#2a0a18}.ht-tabs #htx{flex:0 0 2.4em}
  .ht-card{background:#fff6f9;color:#2a1a24;border-radius:14px;overflow:hidden;touch-action:none;user-select:none;cursor:grab}
  .ht-pic{position:relative;height:160px;display:grid;place-items:center;background:radial-gradient(#ffd6e4,#e88aa8)}
  .ht-pic canvas{width:160px;height:160px;image-rendering:pixelated}
  .ht-want{position:absolute;right:8px;top:8px;font-size:.72em;font-weight:700;padding:.15em .5em;border-radius:20px;background:#ff4a7a;color:#fff}.ht-want.casamento{background:#d9a441;color:#3a2410}
  .ht-info{padding:.55em .8em .7em}.ht-info h3{margin:0;font-family:"Pixelify Sans",sans-serif;font-size:1.4em}
  .ht-town{font-size:.8em;color:#7a5a6a}.ht-ps{margin:.35em 0;font-size:.9em}
  .ht-ints{display:flex;flex-wrap:wrap;gap:.3em}.ht-ints span{font-size:.75em;padding:.1em .5em;border-radius:20px;background:#ffe0ea;border:1px solid #ff9ab8}
  .ht-bio{font-style:italic;margin:.5em 0 .3em;font-size:.9em}.ht-fav{font-size:.8em;color:#7a5a6a}
  .ht-btns{display:flex;justify-content:center;gap:2em;margin-top:.6em}.ht-btns button{width:3.2em;height:3.2em;border-radius:50%;font-size:1.5em;padding:0}
  #htno{background:#3a3048;color:#c8c0d8}#htyes{background:#ff4a7a;color:#fff;border-color:#fff}
  .ht-left{text-align:center;font-size:.75em;color:#d8b8c8;margin-top:.4em}
  .ht-empty{text-align:center;padding:2em 1em;color:#e8d0dc}
  .ht-list{display:flex;flex-direction:column;gap:.4em}.ht-row{display:flex;align-items:center;gap:.6em;background:rgba(255,255,255,.06);border-radius:10px;padding:.3em .5em}
  .ht-row canvas{width:56px;height:56px;image-rendering:pixelated;background:radial-gradient(#ffd6e4,#c86a8a);border-radius:8px}
  .ht-row div{flex:1;line-height:1.2}.ht-row small{display:block;font-size:.75em;color:#d8b8c8}.ht-row button{font-size:.78em;padding:.3em .6em}
  .ht-match{text-align:center}.ht-match h2{font-family:"Pixelify Sans",sans-serif;color:#ff9ab8;margin:.2em 0}
  .ht-pair{display:flex;align-items:center;justify-content:center;gap:.4em}.ht-pair canvas{width:110px;height:110px;image-rendering:pixelated;background:radial-gradient(#ffd6e4,#c86a8a);border-radius:50%;border:3px solid #fff}
  .ht-pair span{font-size:2em;color:#ff4a7a}.ht-btns2{display:flex;flex-direction:column;gap:.4em;margin-top:.6em}
  #hearts canvas{position:static!important;inset:auto!important;transform:none!important;display:block}
  #hearts .ht-info h3{color:#2a1a24!important;border:0!important;background:none!important;text-shadow:none!important;display:block}
  #hearts .ht-info h3::after,#hearts .ht-info h3::before{display:none!important}
  #hearts.ov{padding:0!important;border:0!important}
  @media (max-height:520px){
    .ht-box{width:min(96%,40em);padding:.45em}
    .ht-tabs{margin-bottom:.35em}.ht-tabs button{font-size:.75em;padding:.2em}
    .ht-card{display:flex}.ht-pic{height:auto;min-height:150px;flex:0 0 150px}.ht-pic canvas{width:130px;height:130px}
    .ht-info{padding:.4em .6em;font-size:.88em}.ht-info h3{font-size:1.15em}
    .ht-btns{margin-top:.35em;gap:1.4em}.ht-btns button{width:2.5em;height:2.5em;font-size:1.2em}
    .ht-left{display:none}
  }`;
  document.head.appendChild(st);
  let acc = 0;
  const upBase = update;
  update = function (dt) {
    const r = upBase.apply(this, arguments);
    acc += dt || 0;
    if (acc < 0.3) return r;
    acc = 0;
    const show = !!(player && player.name && lifeMode() && game.mode === "world" && !game.dialog && !game.cine);
    for (const id of ["jnb", "htb"]) byId(id).style.display = show ? "flex" : "none";
    if (show) {
      const n = (player.news || []).length + ":" + ((player.news || []).slice(-1)[0] || {}).t;
      byId("jnb").classList.toggle("new", (player.news || []).length > 0 && player.paperSeen !== n);
      byId("htb").classList.toggle("new", heartsDeck().some((a) => !heartsState().includes(a.i)) && player.heartsSeenDay !== player.day);
    }
    return r;
  };
  const ohBase = openHearts;
  openHearts = function () {
    player.heartsSeenDay = player.day;
    return ohBase.apply(this, arguments);
  };
})();

/* O cemitério e a capela ficam em capela-e-cemiterio.js. */
