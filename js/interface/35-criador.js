/**
 * ECOS DO ARCANO — 35-criador.js
 * Criador de personagem completo (criação e guarda-roupa):
 *  - Barra lateral com ícones: Perfil, Rosto, Cabelo, Chapéu, Roupa, Acessórios, Cajado.
 *  - Abas dentro de cada parte (ex.: Cabelo → Penteado | Cor).
 *  - Grade de miniaturas: cada opção aparece já desenhada no seu personagem.
 *  - Fileira de cores com "+" para escolher qualquer cor (na criação).
 *  - Personagem grande à direita, com poses (Frente, Lado, Costas, Andando).
 *  - No guarda-roupa, o que você ainda não tem aparece com cadeado e preço.
 */

"use strict";

const CC_SECTIONS = [
  { k: "perfil", n: "Perfil", ic: "chat", only: "new" },
  { k: "origem", n: "Origem", ic: "crown", only: "new", life: true },
  { k: "jeito", n: "Jeito", ic: "heart" },
  // [parte, nome, cor que aparece em cima]: em cima as cores, embaixo os formatos.
  { k: "rosto", n: "Rosto", ic: "eye", subs: [["face", "Rosto e pele", "skin"], ["eyeshape", "Olhos", "eyes"]] },
  { k: "cabelo", n: "Cabelo", ic: "hair", subs: [["hstyle", "Penteado", "hair"]] },
  { k: "chapeu", n: "Chapéu", ic: "hat", subs: [["hat", "Chapéu", "hatc"]] },
  { k: "roupa", n: "Roupa", ic: "shirt", subs: [["outfit", "Roupa", "robe"]] },
  { k: "acess", n: "Acessórios", ic: "glasses", subs: [["acc", "Acessório"], ["aura", "Aura"]] },
  { k: "cajado", n: "Cajado", ic: "staff", subs: [["staffs", "Cajado", "staffc"]], story: true },
];
const CC_COLOR = new Set(["skin", "eyes", "hair", "hatc", "robe", "staffc"]);
const CC_BODY = new Set(["outfit", "robe", "staffc", "aura", "staffs"]);
/* Formatos e detalhes novos (de graça na criação; no guarda-roupa alguns custam ouro). */
Object.assign(COSMETICS, {
  face: [
    ["nenhum", "Liso", 0],
    ["bochechas", "Bochechas rosadas", 0],
    ["sardas", "Sardas", 0],
    ["pinta", "Pinta", 0],
    ["sorriso", "Sorriso", 0],
    ["olheiras", "Olheiras", 0],
    ["cicatriz", "Cicatriz", 0],
    ["barba", "Barba", 0],
    ["cavanhaque", "Cavanhaque", 0],
    ["bigode", "Bigode", 0],
    ["batom", "Batom", 0],
    ["guerra", "Pintura de guerra", 0],
  ],
  eyeshape: [
    ["ponto", "Simples", 0],
    ["grandes", "Grandes", 0],
    ["cilios", "Com cílios", 0],
    ["sobrancelhas", "Sobrancelhas", 0],
    ["sonolentos", "Sonolentos", 0],
    ["bravos", "Bravos", 0],
    ["fechados", "Sorridentes", 0],
    ["brilho", "Brilhantes", 0],
  ],
  staffs: [
    ["reto", "Reto", 0],
    ["galho", "Galho", 0],
    ["espiral", "Espiral dourada", 0],
    ["lua", "Lua crescente", 0],
    ["estrela", "Estrela", 0],
    ["duplo", "Duplo cristal", 0],
  ],
});
for (const k of ["face", "eyeshape", "staffs"]) COSMETIC_ICONS[k] = { face: "smile", eyeshape: "eye", staffs: "staff" }[k];
const CC_POSES = [
  ["down", "Frente"],
  ["right", "Lado"],
  ["up", "Costas"],
  ["walk", "Andando"],
];

/** Só a cabeça e os ombros, grandes (para as miniaturas de rosto, cabelo e chapéu). */
function drawBust(cv, L) {
  const c2 = cv.getContext("2d");
  c2.clearRect(0, 0, cv.width, cv.height);
  const u = Math.floor(cv.width / 11);
  const ox = Math.round(cv.width / 2 - 8 * u),
    oy = Math.round(cv.height - 12.2 * u);
  for (const [x, y, w, h, col] of heroRects(L, "down", null)) {
    if (y > 11) continue;
    c2.fillStyle = col;
    c2.fillRect(ox + x * u, oy + y * u, w * u, Math.min(h, 12 - y) * u);
  }
}
/** Personagem inteiro numa pose (com passos para "Andando"). */
function drawPose(cv, L, pose, t) {
  const c2 = cv.getContext("2d");
  c2.clearRect(0, 0, cv.width, cv.height);
  const dir = pose === "walk" ? "right" : pose;
  const fr = pose === "walk" ? 1 + (Math.floor(t * 6) % 2) : 0;
  const u = Math.floor(cv.width / 18);
  const ox = (cv.width - 16 * u) / 2,
    oy = cv.height - 16 * u - 10 - (pose === "walk" ? Math.abs(Math.sin(t * 12)) * u * 0.4 : 0);
  c2.fillStyle = "rgba(0,0,0,.28)";
  c2.beginPath();
  c2.ellipse(cv.width / 2, cv.height - 12, cv.width / 3.2, 7, 0, 0, 7);
  c2.fill();
  if (L.aura && L.aura !== "nenhuma") {
    const g = c2.createRadialGradient(cv.width / 2, cv.height * 0.55, 4, cv.width / 2, cv.height * 0.55, cv.width * 0.45);
    g.addColorStop(0, "rgba(255,240,160,.35)");
    g.addColorStop(1, "rgba(255,240,160,0)");
    c2.fillStyle = g;
    c2.fillRect(0, 0, cv.width, cv.height);
  }
  for (const [x, y, w, h, col] of heroRects(L, dir, lifeMode() ? null : L.staffc || "#ffe066", fr)) {
    c2.fillStyle = col;
    c2.fillRect(ox + (dir === "left" ? 16 - x - w : x) * u, oy + y * u, w * u, h * u);
  }
}

function ccAvail(cat) {
  const owned = (o) => (game.lookMode === "new" ? o[2] === 0 : cosOwned(cat, o[0]));
  return (COSMETICS[cat] || []).filter((o) => o[2] < 9999 || owned(o)).map((o) => ({ id: o[0], n: o[1], pr: o[2], ok: owned(o) }));
}
function renderCreate() {
  const L = game.lookDraft,
    mode = game.lookMode;
  L.eyes = L.eyes || "#222222";
  L.acc = L.acc || "nenhum";
  L.staffc = L.staffc || "#ffe066";
  L.aura = L.aura || "nenhuma";
  // Sardas e bigode agora são do rosto (não acessórios).
  if (L.acc === "sardas" || L.acc === "bigode") (L.face = L.acc), (L.acc = "nenhum");
  L.hatc = L.hatc || "#2a2f6e";
  const secs = CC_SECTIONS.filter((s) => (!s.only || s.only === mode) && !(s.story && lifeMode()) && !(s.life && !lifeMode()));
  if (!secs.some((s) => s.k === game.ccTab)) game.ccTab = secs[0].k;
  const sec = secs.find((s) => s.k === game.ccTab);
  const subs = sec.subs || [];
  if (!subs.some((s) => s[0] === game.ccSub)) game.ccSub = subs[0] ? subs[0][0] : null;
  const cat = game.ccSub;
  const colKey = ((subs.find((q) => q[0] === cat) || [])[2]) || (CC_COLOR.has(cat) ? cat : null);
  game.ccPose = game.ccPose || "down";

  let panel = "";
  if (sec.k === "perfil") {
    panel = `<div class="cc-prof">
      <label>${iconHTML("scroll", 18)}<span>Nome</span><input id="cname" maxlength="12" value="${(game.draftName || "").replace(/"/g, "")}" autocomplete="off" placeholder="Seu nome"></label>
      <div class="cc-lbl">${iconHTML("heart", 18)}<span>Gênero</span></div>
      <div class="cc-seg">${[
        ["m", "Masculino", "smile"],
        ["f", "Feminino", "flower"],
        ["n", "Prefiro não dizer", "star"],
      ]
        .map(([k, n, ic]) => `<button data-gen="${k}" class="${game.draftGender === k ? "on" : ""}">${iconHTML(ic, 18)}${n}</button>`)
        .join("")}</div>
      <div class="cc-lbl">${iconHTML("skull", 18)}<span>Dificuldade</span></div>
      <div class="cc-difs">${Object.entries(DIFFICULTIES)
        .map(([k, d]) => `<button data-dif="${k}" class="${(game.draftDiff || "normal") === k ? "on" : ""}"><b>${d.n}</b><small>${d.desc}</small></button>`)
        .join("")}</div>
    </div>`;
  } else if (sec.k === "origem" && typeof ccOriginPanel === "function") {
    panel = ccOriginPanel();
  } else if (sec.k === "jeito") {
    const tr = game.draftTraits || [];
    const g = game.draftGender === "f" ? "f" : "m";
    panel = `<div class="cc-prof">
      <div class="cc-lbl">${iconHTML("smile", 18)}<span>Personalidade <small>(escolha até 3)</small></span></div>
      <div class="cc-traits">${Object.entries(TRAITS)
        .map(([k, d]) => `<button data-trait="${k}" class="${tr.includes(k) ? "on" : ""}" title="${d.d}">${iconHTML(d.ic, 18)}<b>${traitName(k, g)}</b><small>${d.d}</small></button>`)
        .join("")}</div>
      <div class="cc-lbl">${iconHTML("heart", 18)}<span>De quem você gosta</span></div>
      <div class="cc-seg cc-or">${Object.entries(ORIENTS)
        .map(([k, d]) => `<button data-orient="${k}" class="${(game.draftOrient || "bi") === k ? "on" : ""}" title="${d.d}">${d.n}<small>${d.d}</small></button>`)
        .join("")}</div>
      <div class="cc-note">${iconHTML("star", 14)} Seus traços dão bônus nas interações que combinam com eles. A orientação muda quem flerta com você (e quem você pode namorar).</div>
    </div>`;
  } else {
    const opts = ccAvail(cat);
    const COLN = { skin: "Cor da pele", eyes: "Cor dos olhos", hair: "Cor do cabelo", hatc: "Cor do chapéu", robe: "Cor da roupa", staffc: "Cor do cristal" };
    const palette = colKey
      ? `<div class="cc-lbl cc-pl">${iconHTML("sparkle", 14)}<span>${COLN[colKey] || "Cor"}</span></div><div class="cc-pal">${ccAvail(colKey)
          .filter((o) => o.ok)
          .map((o) => `<button class="cc-sw ${L[colKey] === o.id ? "on" : ""}" data-pick="${o.id}" style="background:${o.id}" title="${o.n}"></button>`)
          .join("")}<label class="cc-sw plus ${mode === "new" ? "" : "off"}" title="${mode === "new" ? "Escolher qualquer cor" : "Cores livres só na criação. Compre tinturas no Salão e na Alfaiataria."}">+<input type="color" id="ccolor" value="${/^#[0-9a-f]{6}$/i.test(L[colKey]) ? L[colKey] : "#888888"}" ${mode === "new" ? "" : "disabled"}></label></div><div class="cc-lbl cc-pl">${iconHTML("star", 14)}<span>${{ face: "Detalhes do rosto", eyeshape: "Formato dos olhos", hstyle: "Penteado", hat: "Modelo", outfit: "Modelo", staffs: "Formato do cajado" }[cat] || "Modelo"}</span></div>`
      : "";
    const tiles = (CC_COLOR.has(cat) ? [] : opts)
      .map(
        (o, i) => `<button class="cc-tile ${L[cat] === o.id ? "on" : ""} ${o.ok ? "" : "lock"}" data-opt="${i}" title="${o.n}">
        <canvas width="84" height="84" data-th="${i}"></canvas>
        <span>${o.n || ""}</span>${o.ok ? "" : `<em>${iconHTML("lock", 12)}${o.pr} ouro</em>`}
      </button>`,
      )
      .join("");
    panel = `${palette}<div class="cc-grid">${tiles}</div>${mode === "new" ? "" : `<div class="cc-note">${iconHTML("bag", 14)} O que tem cadeado se compra na Alfaiataria e no Salão Tesoura de Ouro (Cinzaluz) ou na Moda Brisamar (Porto).</div>`}`;
  }

  const el = byId("create");
  el.classList.add("cc");
  el.innerHTML = `<div class="cc-win">
    <div class="cc-side">${secs.map((s) => `<button data-sec="${s.k}" class="${s.k === sec.k ? "on" : ""}" title="${s.n}">${iconHTML(s.ic, 24)}<span>${s.n}</span></button>`).join("")}</div>
    <div class="cc-main">
      <h2>${mode === "new" ? (lifeMode() ? "Crie seu morador" : "Crie seu mago") : "Guarda-roupa"} <small>· ${sec.n}</small></h2>
      ${subs.length > 1 ? `<div class="cc-subs">${subs.map(([k, n]) => `<button data-sub="${k}" class="${k === cat ? "on" : ""}">${n}</button>`).join("")}</div>` : ""}
      <div class="cc-panel">${panel}</div>
    </div>
    <div class="cc-stage">
      <div class="cc-pose"><button data-pose="-1">‹</button><span>${CC_POSES.find((p) => p[0] === game.ccPose)[1]}</span><button data-pose="1">›</button></div>
      <div class="cc-room"><canvas id="pvc" width="220" height="220"></canvas><div class="cc-name">${(game.draftName || player.name || "").trim() || "Aprendiz"}</div></div>
      <div class="cc-btns">
        <button id="crand">${iconHTML("star", 16)}Aleatório</button>
        ${mode === "new" ? "" : '<button id="ccancel">Cancelar</button>'}
        <button id="cgo" class="go">${mode === "new" ? "Começar ▶" : "Salvar visual"}</button>
      </div>
    </div>
  </div>`;
  // Miniaturas
  if (cat) {
    const opts = ccAvail(cat);
    el.querySelectorAll("[data-th]").forEach((cv) => {
      const o = opts[+cv.dataset.th];
      const Lm = Object.assign({}, L, { [cat]: o.id });
      if (cat === "hatc" && L.hat === "nenhum") Lm.hat = "mago";
      if (cat === "hstyle" || cat === "hair" || cat === "face" || cat === "eyeshape") Lm.hat = "nenhum";
      CC_BODY.has(cat) ? drawPose(cv, Lm, "down", 0) : drawBust(cv, Lm);
    });
  }
  // Pose animada
  clearInterval(game.ccAnim);
  const dr = () => byId("pvc") && drawPose(byId("pvc"), L, game.ccPose, game.t || performance.now() / 1000);
  dr();
  game.ccAnim = setInterval(dr, 120);
  // Eventos
  el.querySelectorAll("[data-sec]").forEach((b) => (b.onclick = () => ((game.ccTab = b.dataset.sec), (game.ccSub = null), playSound(520, 0.03, "sine"), renderCreate())));
  el.querySelectorAll("[data-sub]").forEach((b) => (b.onclick = () => ((game.ccSub = b.dataset.sub), renderCreate())));
  el.querySelectorAll("[data-opt]").forEach(
    (b) =>
      (b.onclick = () => {
        const o = ccAvail(cat)[+b.dataset.opt];
        if (!o.ok) return toast(`${o.n}: compre por ${o.pr} ouro na loja de roupas ou no salão.`, 2600);
        L[cat] = o.id;
        playSound(660, 0.04, "sine");
        renderCreate();
      }),
  );
  el.querySelectorAll("[data-pick]").forEach((b) => (b.onclick = () => ((L[colKey || cat] = b.dataset.pick), playSound(700, 0.03, "sine"), renderCreate())));
  const cc = byId("ccolor");
  if (cc) cc.onchange = () => ((L[colKey || cat] = cc.value), renderCreate());
  el.querySelectorAll("[data-pose]").forEach(
    (b) =>
      (b.onclick = () => {
        const i = CC_POSES.findIndex((p) => p[0] === game.ccPose);
        game.ccPose = CC_POSES[(i + +b.dataset.pose + CC_POSES.length) % CC_POSES.length][0];
        renderCreate();
      }),
  );
  const ni = byId("cname");
  if (ni)
    ni.oninput = () => {
      game.draftName = ni.value;
      el.querySelector(".cc-name").textContent = ni.value.trim() || "Aprendiz";
    };
  el.querySelectorAll("[data-gen]").forEach((b) => (b.onclick = () => ((game.draftGender = b.dataset.gen), renderCreate())));
  el.querySelectorAll("[data-trait]").forEach(
    (b) =>
      (b.onclick = () => {
        const k = b.dataset.trait,
          tr = (game.draftTraits = game.draftTraits || []);
        if (tr.includes(k)) tr.splice(tr.indexOf(k), 1);
        else if (tr.length < 3) tr.push(k);
        else toast("No máximo 3 traços.", 1400);
        renderCreate();
      }),
  );
  if (typeof ccOriginBind === "function") ccOriginBind(el);
  el.querySelectorAll("[data-orient]").forEach((b) => (b.onclick = () => ((game.draftOrient = b.dataset.orient), renderCreate())));
  el.querySelectorAll("[data-dif]").forEach((b) => (b.onclick = () => ((game.draftDiff = b.dataset.dif), renderCreate())));
  byId("crand").onclick = () => {
    for (const c of ["hstyle", "hair", "hat", "outfit", "robe", "hatc", "eyes", "acc", "staffc", "face", "eyeshape", "staffs"].concat(mode === "new" ? ["skin"] : [])) {
      const a = ccAvail(c).filter((o) => o.ok);
      if (a.length) L[c] = a[Math.floor(Math.random() * a.length)].id;
    }
    playSound(880, 0.05, "sine");
    renderCreate();
  };
  if (byId("ccancel"))
    byId("ccancel").onclick = () => {
      clearInterval(game.ccAnim);
      byId("create").style.display = "none";
      game.mode = "world";
    };
  byId("cgo").onclick = () => {
    clearInterval(game.ccAnim);
    player.look = JSON.parse(JSON.stringify(L));
    player.traits = (game.draftTraits || []).slice();
    player.orient = game.draftOrient || "bi";
    if (mode === "new") {
      player.name = (game.draftName || "").trim().slice(0, 12) || "Aprendiz";
      player.gender = game.draftGender;
      player.diff = game.draftDiff || "normal";
      byId("create").style.display = "none";
      playSound(784, 0.15, "sine");
      if (lifeMode()) startLifeMode();
      else showStory();
    } else {
      byId("create").style.display = "none";
      game.mode = "world";
      saveGame();
      playSound(784, 0.12, "sine");
      toast("Visual salvo!");
    }
  };
}
