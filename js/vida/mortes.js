/**
 * ECOS DO ARCANO — mortes.js
 * 30 jeitos de morrer no Simulador (e o duelo de magos na história).
 * Cada morte tem a sua cena: o cenário onde aconteceu, quem matou, os efeitos
 * (sangue, água, raio, neve, veneno...), a alma subindo e o velório com um
 * epitáfio que conta como foi. O Livro das Mortes (tecla B) guarda as que
 * você já descobriu, mesmo entre uma vida e outra.
 * Modifica (envolve) funções de outros arquivos: continueAsHeir, coupFail, draw, drink, endChase, enlist, execution, faintInForest, finishBrawl, gatherInteract, lifeEnds, lose, loseThrone, onNewDay, say, update, useItemEffect.
 */

"use strict";

/* {o} vira o/a/e conforme o seu gênero. */
const DEATHS = {
  velhice: { n: "Velhice", t: "Morreu de velhice, em paz", env: "quarto", fx: "velas", bed: 1, epi: "Viveu muito e viveu bem.", padre: "Uma vida inteira de trabalho, amor e histórias. Que descanse.", how: "Envelhecer além dos 70 anos." },
  forca: { n: "Forca", t: "Executad{o} na forca", env: "forca", fx: "corvos", epi: "A justiça da Coroa foi feita.", padre: "Que as runas tenham piedade de quem não teve piedade.", how: "Ser condenad{o} por assassinato." },
  pedro: { n: "Faca do Pedro Max", t: "Esfaquead{o} pelo Pedro Max", env: "rua", fx: "sangue", killer: "pedro", knife: 1, epi: "Mexeu com a Mylena.", padre: "Ninguém mexe com a Mylena. Ninguém.", how: "Dar em cima da Mylena e não escapar da faca do Pedro." },
  ciume: { n: "Ciúme", t: "Esfaquead{o} por ciúme", env: "rua", fx: "sangue", knife: 1, epi: "Deu em cima de quem não devia.", padre: "Quem brinca com o coração alheio...", how: "Flertar com gente casada e o par te alcançar com a faca." },
  briga: { n: "Briga de rua", t: "Morreu numa briga de rua", env: "rua", fx: "sangue", epi: "Bateu a cabeça na pedra errada.", padre: "Uma briga boba, um fim triste.", how: "Perder uma briga feia (a cabeça bate na calçada)." },
  fome: { n: "Fome", t: "Morreu de fome", env: "seco", fx: "prato", epi: "Que nunca mais lhe falte pão.", padre: "Em Cinzaluz ninguém devia morrer de fome. Que vergonha para todos nós.", how: "Ficar dois dias sem comer." },
  sede: { n: "Sede", t: "Morreu de sede", env: "seco", fx: "sol", epi: "Água, finalmente.", padre: "Que a fonte da praça lhe dê de beber do outro lado.", how: "Ficar um dia inteiro sem beber nada." },
  doenca: { n: "Doença", t: "Morreu de febre", env: "quarto", fx: "veneno", bed: 1, epi: "A febre venceu.", padre: "A Curandeira fez o que pôde.", how: "Deixar uma doença sem tratamento até a vida acabar." },
  peste: { n: "Peste", t: "Levad{o} pela peste", env: "quarto", fx: "peste", bed: 1, epi: "A peste não escolhe quem leva.", padre: "Queimem os lençóis. E rezem.", how: "Pegar peste e não ir à Curandeira." },
  intoxicacao: { n: "Intoxicação", t: "Morreu intoxicad{o}", env: "quarto", fx: "veneno", bed: 1, epi: "Aquela fruta tinha uma cor estranha.", padre: "Nunca comam frutas que vocês não conhecem.", how: "Intoxicar-se e não se tratar." },
  veneno: { n: "Veneno", t: "Envenenad{o}", env: "taverna", fx: "veneno", poisoner: 1, epi: "Alguém tinha raiva demais.", padre: "Quem pôs veneno no prato vai responder às runas.", how: "Ter desafetos demais... e comer o que não devia." },
  afogamento: { n: "Afogamento", t: "Afogad{o} no rio", env: "rio", fx: "bolhas", water: 1, epi: "O rio levou.", padre: "Bêbado e rio não combinam. Que isso sirva de lição.", how: "Andar bêbad{o} na beira da água." },
  alcool: { n: "Bebedeira", t: "Morreu de tanto beber", env: "taverna", fx: "garrafas", epi: "Só mais uma, ele disse.", padre: "O Gus nunca mais vai servir dose dupla.", how: "Beber até perder a conta (e a vida)." },
  raio: { n: "Raio", t: "Atingid{o} por um raio", env: "rua", fx: "raio", burnt: 1, epi: "O céu escolheu.", padre: "Em dia de tempestade, fiquem em casa!", how: "Ficar ao ar livre numa tempestade." },
  frio: { n: "Frio", t: "Morreu congelad{o}", env: "neve", fx: "neve", frozen: 1, epi: "Faltou uma lareira.", padre: "O inverno de Cinzaluz não perdoa quem dorme na rua.", how: "Passar a madrugada de inverno ao relento." },
  mina: { n: "Desabamento", t: "Soterrad{o} na mina", env: "mina", fx: "pedras", buried: 1, epi: "Cavou fundo demais.", padre: "A pedra devolveu o que era dela.", how: "Minerar até a mina desabar." },
  fera: { n: "Fera da floresta", t: "Atacad{o} por uma fera", env: "floresta", fx: "sangue", beast: "lobo", epi: "A floresta cobra caro.", padre: "Ninguém entra na Floresta Grande sem respeito.", how: "Perder para um lobo ou javali na Floresta Grande." },
  urso: { n: "Urso", t: "Mort{o} por um urso", env: "floresta", fx: "sangue", beast: "urso", epi: "O urso não quis conversa.", padre: "Um urso. Logo um urso.", how: "Enfrentar um urso e perder." },
  queda: { n: "Queda", t: "Caiu do penhasco", env: "serra", fx: "pedrinhas", epi: "Olhou pra baixo tarde demais.", padre: "A Serra de Pedravale é linda. E traiçoeira.", how: "Andar pela serra bêbad{o} ou caindo de sono à noite." },
  naufragio: { n: "Mar bravo", t: "Levad{o} pelas ondas", env: "mar", fx: "chuva", water: 1, epi: "O mar o quis para si.", padre: "Os pescadores vão acender uma vela no farol por você.", how: "Ficar na beira do mar do porto numa tempestade." },
  duelo: { n: "Duelo de magos", t: "Mort{o} num duelo de magos", env: "arena", fx: "magia", epi: "Só a magia mata um mago.", padre: "Magia contra magia... sempre termina assim.", how: "Desafiar um mago para um duelo e perder." },
  assassinado: { n: "Vingança", t: "Assassinad{o} por vingança", env: "noite", fx: "sangue", killerLook: "assassino", knife: 1, epi: "Quem com ferro fere...", padre: "A família da vítima não esqueceu.", how: "Matar alguém e a família vir cobrar." },
  contragolpe: { n: "Golpe de Estado", t: "Mort{o} pelos guardas do castelo", env: "castelo", fx: "sangue", killerLook: "guarda", spear: 1, epi: "Quis a coroa. Ganhou uma lápide.", padre: "O trono de Aurélia já enterrou muita gente ambiciosa.", how: "Dar golpe e perder o castelo para a guarda." },
  guerra: { n: "Guerra", t: "Morreu no front de batalha", env: "front", fx: "flechas", epi: "Lutou pelo reino.", padre: "Morreu pelo reino. O reino não vai esquecer.", how: "Alistar-se na guerra e não voltar." },
  ladrao: { n: "Assalto", t: "Mort{o} por um ladrão", env: "noite", fx: "sangue", killerLook: "bandido", knife: 1, epi: "Devia ter entregado a bolsa.", padre: "Por algumas moedas. Só por algumas moedas.", how: "Reagir a um assalto de madrugada." },
  cavalo: { n: "Coice", t: "Levou um coice de cavalo", env: "estabulo", fx: "estrelas", beast: "cavalo", epi: "Chegou por trás do cavalo.", padre: "Nunca, NUNCA passem por trás de um cavalo.", how: "Mexer com os cavalos do estábulo bêbad{o}." },
  engasgo: { n: "Engasgo", t: "Morreu engasgad{o}", env: "taverna", fx: "pao", epi: "Mastigue devagar.", padre: "Comam devagar, meus filhos.", how: "Engasgar comendo e ninguém ajudar." },
  protesto: { n: "Pisoteamento", t: "Pisotead{o} no protesto", env: "praca", fx: "tomates", crowd: 1, epi: "Estava no lugar errado, na hora errada.", padre: "Os iluministas pediram perdão. Tarde demais.", how: "Ficar no meio da confusão de um protesto." },
  exaustao: { n: "Exaustão", t: "Morreu de exaustão", env: "rua", fx: "zzz", epi: "Trabalhou até o fim. Literalmente.", padre: "Descanse agora. Você merece.", how: "Ficar muitas horas sem energia, sem dormir." },
  coracao: { n: "Coração", t: "O coração parou", env: "rua", fx: "coracao", epi: "O coração era grande demais.", padre: "Foi de repente. Ninguém esperava.", how: "Ter mais de 50 anos e viver no limite." },
};
const DEATH_IDS = Object.keys(DEATHS);
const dz = (s) => s.replace(/\{o\}/g, genderWord("o", "a", "e"));

/* ----- Livro das Mortes (fica guardado entre as vidas) ----- */
function deathBook() {
  try {
    return JSON.parse(localStorage.getItem("ecosMortes") || "[]");
  } catch (e) {
    return [];
  }
}
function bookAdd(id) {
  const b = deathBook();
  const novo = !b.includes(id);
  if (novo) b.push(id);
  try {
    localStorage.setItem("ecosMortes", JSON.stringify(b));
  } catch (e) {}
  return novo;
}
function openDeathBook() {
  if (game.mode !== "world" || game.dialog) return;
  let el = byId("mortes");
  if (!el) {
    el = document.createElement("div");
    el.id = "mortes";
    el.className = "ui ov";
    byId("screen").appendChild(el);
  }
  const b = deathBook();
  el.innerHTML = `<button class="jn-x" data-x>✕</button><h2>Livro das Mortes · ${b.length}/${DEATH_IDS.length}</h2><p class="mt-sub">Os jeitos de morrer que você já descobriu (vale para todas as suas vidas).</p><div class="mt-grid">${DEATH_IDS.map((id) => {
    const D = DEATHS[id],
      ok = b.includes(id);
    return `<div class="mt-c ${ok ? "ok" : ""}"><b>${ok ? D.n : "???"}</b><small>${ok ? dz(D.t) : "Dica: " + dz(D.how)}</small></div>`;
  }).join("")}</div>`;
  el.querySelector("[data-x]").addEventListener("click", closeDeathBook);
  el.style.display = "block";
  game.mode = "mortes";
}
function closeDeathBook() {
  const el = byId("mortes");
  if (el) el.style.display = "none";
  game.mode = "world";
}
KEY_HANDLERS.mortes = (k) => (k === "escape" || k === "b") && closeDeathBook();
WORLD_SHORTCUTS.b = openDeathBook;
(function bookButton() {
  const small = document.querySelector("#touch .small");
  if (!small) return;
  const b = document.createElement("button");
  b.textContent = "Mortes";
  b.addEventListener("click", openDeathBook);
  small.appendChild(b);
})();

/* ----- Morrer ----- */

function epitaph(id) {
  const g = (m, f) => genderWord(m, f, m);
  const l = [dz(DEATHS[id].epi)];
  if (player.spouse && NPCS[player.spouse]) l.push(`Amad${g("o", "a")} espos${g("o", "a")} de ${shortName(player.spouse)}.`);
  else if ((player.kids || []).length) l.push(`Deixou ${player.kids.length} filho${player.kids.length > 1 ? "s" : ""}.`);
  else if (player.ruler || player.spouse === "rainha") l.push("Governou Cinzaluz.");
  return l.join(" ");
}
function mournersList() {
  const out = [];
  if (player.spouse && NPCS[player.spouse]) out.push({ npc: NPCS[player.spouse], n: shortName(player.spouse) });
  for (const k of (player.kids || []).slice(0, 3)) if (k.look) out.push({ hero: k.look, n: k.name });
  for (const id of bestFriends(5)) if (out.length < 6 && id !== player.spouse) out.push({ npc: NPCS[id], n: shortName(id) });
  if (!out.length) out.push({ npc: { robe: "#2a2230", hat: null, hair: "#cfc6b8" }, n: "Padre Anselmo" });
  return out;
}
const KILLER_LOOKS = {
  assassino: { robe: "#1a1620", hat: "#0e0c12", hair: "#1a1620" },
  bandido: { robe: "#4a3a2a", hat: "#2a2018", hair: "#3a2414" },
  guarda: { robe: "#4a5a7a", hat: "#3a3a4a", hair: "#3a2414" },
};
/**
 * Mata o personagem. opt: { killer: id de NPC, beast: "lobo"|"javali"|"urso", why: texto extra, after: fn }
 * after (opcional) substitui o velório padrão (velhice e forca já têm o seu).
 */
function playerDies(id, opt = {}) {
  const D = DEATHS[id];
  if (!D || game.deathScene || game.dying) return false;
  if (!lifeMode() && id !== "duelo") return false;
  game.dying = true;
  game.killNext = null;
  game.chase = null;
  game.pedroRage = null;
  game.jealousQ = null;
  if (game.brawl) endBrawlScene();
  const killer = opt.killer || D.killer;
  const killerLook = killer && NPCS[killer] ? NPCS[killer] : D.killerLook ? KILLER_LOOKS[D.killerLook] : null;
  const novo = bookAdd(id);
  if (lifeMode()) vilaNews(`Luto em Cinzaluz: ${player.name} morreu. ${dz(D.t)}${killer && NPCS[killer] ? ` (${shortName(killer)})` : ""}.`);
  const d = {
    id,
    D,
    t0: game.t,
    name: player.name,
    age: playerAge(),
    born: START_AGE,
    look: JSON.parse(JSON.stringify(player.look)),
    killerLook,
    killerName: killer && NPCS[killer] ? shortName(killer) : opt.killerName || "",
    beast: opt.beast || D.beast,
    title: dz(D.t) + (opt.beast && id === "fera" ? ` (${opt.beast})` : ""),
    epi: epitaph(id),
    mourn: mournersList(),
    novo,
    count: deathBook().length,
    next: () => {
      game.dying = false;
      if (opt.after) return opt.after();
      deathAftermath(id, opt);
    },
  };
  game.dialog = null;
  byId("dialog").style.display = "none";
  byId("choice").style.display = "none";
  if (typeof hidePie === "function") hidePie();
  if (battle && game.mode === "battle") endBattle();
  game.deathScene = d;
  game.mode = "cutscene";
  document.body.classList.add("cutscene");
  playSound(70, 1.4, "sine");
  setTimeout(() => playSound(55, 1.6, "sine"), 900);
  return true;
}
function deathAftermath(id, opt) {
  const D = DEATHS[id],
    name = player.name,
    age = playerAge();
  if (!lifeMode()) {
    say([["", `Aqui termina a história de ${name}. ${dz(D.t)}.`], ["", "Sua história termina aqui... Você volta ao último ponto em que salvou."]], () => location.reload());
    return;
  }
  const list = heirs();
  const tax = Math.floor(player.gold * 0.1);
  const lines = [
    ["", `Aqui termina a vida de ${name}, aos ${age} anos. ${dz(D.t)}.${opt.why ? " " + opt.why : ""}`],
    ["Padre Anselmo", D.padre],
  ];
  if (!list.length) {
    clearSave();
    say(lines.concat([["", "Sem filhos adultos para continuar a família, esta história termina aqui. Obrigado por jogar!"]]), () => location.reload());
    return;
  }
  say(lines.concat([["", `A herança passa para os filhos. A Coroa cobra ${tax} de ouro de imposto sobre a herança.`]]), () =>
    choice(
      "Quem continua a família?",
      "Escolha o herdeiro. Você passa a jogar com ele, na mesma casa, com o ouro da família.",
      list.map((k) => ({
        t: `${k.name} · ${kidAge(k)} anos`,
        fn: () => {
          continueAsHeir(k, tax);
          player.zone = "vila";
          [player.x, player.y] = [5, 18];
          player.sick = null;
          player.drunk = 0;
          player.food = Math.max(player.food, 70);
          player.water = Math.max(player.water, 70);
          game.fade = 1;
          enterZone(false);
          saveGame();
        },
      })),
    ),
  );
}
function endDeathScene() {
  const d = game.deathScene;
  if (!d || game.t - d.t0 < 7) return;
  game.deathScene = null;
  document.body.classList.remove("cutscene");
  game.mode = "world";
  game.fade = 1;
  d.next();
}
addEventListener(
  "keydown",
  (e) => {
    if (!game.deathScene) return;
    e.stopImmediatePropagation();
    e.preventDefault();
    if (["Enter", " ", "e", "E", "Escape"].includes(e.key)) endDeathScene();
  },
  true,
);
addEventListener(
  "pointerdown",
  (e) => {
    if (!game.deathScene) return;
    e.stopImmediatePropagation();
    e.preventDefault();
    endDeathScene();
  },
  true,
);
/* Uma fala que estava para aparecer pode ser trocada pela morte (game.killNext). */
{
  const sayBase = say;
  say = function (lines, cb) {
    const k = game.killNext;
    if (k) {
      game.killNext = null;
      if (playerDies(k.id, k)) return;
    }
    return sayBase(lines, cb);
  };
}

/* ===================== A CENA ===================== */

function rect(x, y, w, h, c) {
  ctx.fillStyle = c;
  ctx.fillRect(x, y, w, h);
}
function drawEnv(env, W, H, t) {
  const G = H * 0.62; // linha do chão
  const sky = (a, b) => {
    const g = ctx.createLinearGradient(0, 0, 0, G);
    g.addColorStop(0, a);
    g.addColorStop(1, b);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, G);
  };
  switch (env) {
    case "quarto":
      rect(0, 0, W, G, "#5a3e2c");
      for (let x = 0; x < W; x += 40) rect(x, 0, 2, G, "#4a3022");
      rect(W * 0.15, 60, 120, 110, "#1a2440");
      rect(W * 0.15 + 58, 60, 4, 110, "#3a2a1c");
      rect(W * 0.15, 113, 120, 4, "#3a2a1c");
      rect(W * 0.15 + 70, 80, 14, 14, "#f4ecc8");
      rect(0, G, W, H - G, "#7a5434");
      for (let y = G; y < H; y += 18) rect(0, y, W, 2, "#6a4628");
      break;
    case "rua":
      sky("#3a2a4a", "#d0806a");
      for (let i = 0; i < 6; i++) {
        const x = i * (W / 5) - 40,
          h = 120 + (i % 3) * 30;
        rect(x, G - h, 110, h, ["#4a3a3a", "#5a4438", "#3e3446"][i % 3]);
        rect(x - 8, G - h - 26, 126, 26, "#2a1e22");
        rect(x + 20, G - h + 30, 16, 20, "#ffd27a");
        rect(x + 70, G - h + 30, 16, 20, "#ffd27a");
      }
      rect(0, G, W, H - G, "#6a6470");
      for (let y = G + 6; y < H; y += 14) for (let x = (y / 14) % 2 ? 0 : 14; x < W; x += 28) rect(x, y, 24, 10, "#7a7480");
      break;
    case "noite":
      sky("#05060e", "#1a1830");
      rect(0, 0, 90, G, "#14121c");
      rect(W - 90, 0, 90, G, "#14121c");
      rect(W * 0.7, G - 150, 6, 150, "#2a2830");
      rect(W * 0.7 - 8, G - 160, 22, 14, "#3a3640");
      ctx.fillStyle = `rgba(255,210,120,${0.15 + 0.05 * Math.sin(t * 7)})`;
      ctx.beginPath();
      ctx.arc(W * 0.7 + 3, G - 150, 70, 0, 7);
      ctx.fill();
      rect(0, G, W, H - G, "#2a2832");
      break;
    case "praca":
      sky("#7ab0e0", "#e0d0b0");
      rect(W * 0.38, G - 140, W * 0.24, 140, "#8a8090");
      rect(W * 0.36, G - 150, W * 0.28, 14, "#6a6070");
      rect(W / 2 - 14, G - 196, 28, 46, "#c8a030");
      rect(0, G, W, H - G, "#a09088");
      break;
    case "taverna":
      rect(0, 0, W, G, "#4a2e1c");
      for (let x = 0; x < W; x += 60) rect(x, 0, 4, G, "#3a2014");
      for (const x of [40, 110, W - 150, W - 80]) {
        rect(x, G - 70, 52, 70, "#6a4426");
        rect(x, G - 50, 52, 6, "#3a2414");
        rect(x, G - 24, 52, 6, "#3a2414");
      }
      rect(W * 0.6, 70, 140, 8, "#3a2014");
      for (let i = 0; i < 6; i++) rect(W * 0.6 + 8 + i * 22, 46, 10, 24, ["#3a7a3a", "#7a2a3a", "#c8a030"][i % 3]);
      rect(0, G, W, H - G, "#5a3a22");
      break;
    case "mina":
      rect(0, 0, W, H, "#16121a");
      for (let i = 0; i < 14; i++) rect((i * 151) % W, ((i * 83) % (G - 40)) + 10, 60, 36, "#2a2430");
      for (let i = 0; i < 6; i++) {
        ctx.fillStyle = ["#7ad0ff", "#b48aff", "#ff8ad0"][i % 3];
        ctx.fillRect((i * 211 + 30) % W, 40 + ((i * 97) % 200), 8, 14);
      }
      rect(0, G, W, H - G, "#3a3038");
      rect(W * 0.2, G - 160, 14, 160, "#5a3e22");
      rect(W * 0.8, G - 160, 14, 160, "#5a3e22");
      rect(W * 0.2, G - 166, W * 0.6 + 14, 12, "#5a3e22");
      break;
    case "floresta":
      sky("#0e1a14", "#2a3a2a");
      for (let i = 0; i < 9; i++) {
        const x = (i * 97) % W,
          h = 180 + (i % 4) * 30;
        rect(x + 16, G - h * 0.4, 14, h * 0.4, "#2a1a10");
        ctx.fillStyle = ["#163a22", "#1e4a2a", "#123020"][i % 3];
        ctx.beginPath();
        ctx.moveTo(x - 30, G - h * 0.35);
        ctx.lineTo(x + 23, G - h);
        ctx.lineTo(x + 76, G - h * 0.35);
        ctx.fill();
      }
      rect(0, G, W, H - G, "#24361e");
      break;
    case "neve":
      sky("#101830", "#3a4a70");
      for (const x of [60, W - 140]) {
        rect(x, G - 90, 90, 90, "#3a2e2a");
        ctx.fillStyle = "#eef4ff";
        ctx.beginPath();
        ctx.moveTo(x - 10, G - 90);
        ctx.lineTo(x + 45, G - 130);
        ctx.lineTo(x + 100, G - 90);
        ctx.fill();
      }
      rect(0, G, W, H - G, "#dfe8f6");
      break;
    case "rio":
      sky("#1a2a4a", "#4a6a8a");
      rect(0, G - 20, W, 30, "#3a5a2a");
      rect(0, G + 10, W, H - G, "#2a5a8a");
      for (let i = 0; i < 18; i++) rect(((i * 73 + t * 30) % (W + 40)) - 20, G + 30 + (i % 6) * 26, 30, 3, "#5a8ab8");
      break;
    case "mar":
      sky("#1a1e26", "#3a4450");
      rect(0, G - 10, W, H - G + 10, "#1e3a52");
      for (let i = 0; i < 12; i++) {
        const x = ((i * 113 + t * 60) % (W + 80)) - 40,
          y = G + (i % 5) * 34 + Math.sin(t * 3 + i) * 6;
        rect(x, y, 60, 6, "#cfe0ee");
      }
      rect(W * 0.12, G + 40, 120, 14, "#5a3e22");
      rect(W * 0.12 + 40, G - 40, 8, 80, "#5a3e22");
      break;
    case "serra":
      sky("#2a2440", "#8a7090");
      ctx.fillStyle = "#4a4250";
      ctx.beginPath();
      ctx.moveTo(0, G);
      ctx.lineTo(W * 0.25, 90);
      ctx.lineTo(W * 0.5, G);
      ctx.lineTo(W * 0.75, 60);
      ctx.lineTo(W, G);
      ctx.fill();
      rect(0, G, W, H - G, "#5a5060");
      rect(W * 0.55, G, W * 0.45, H - G, "#14101c");
      break;
    case "castelo":
      rect(0, 0, W, H, "#4a4654");
      for (let y = 0; y < G; y += 26) for (let x = (y / 26) % 2 ? 0 : 26; x < W; x += 52) rect(x, y, 50, 24, "#56525e");
      for (const x of [W * 0.2, W * 0.8 - 40]) {
        rect(x, 40, 40, 110, "#8a1a2a");
        rect(x + 14, 70, 12, 12, "#e0b030");
      }
      rect(0, G, W, H - G, "#6a2a2a");
      break;
    case "front":
      sky("#3a1a14", "#c86a3a");
      for (let i = 0; i < 6; i++) {
        const x = (i * 131) % W;
        rect(x, G - 80, 4, 80, "#3a2414");
        rect(x + 4, G - 80, 34, 20, ["#3a5ab0", "#b03a3a"][i % 2]);
      }
      rect(0, G, W, H - G, "#4a3a22");
      for (let i = 0; i < 8; i++) rect((i * 89) % W, G + 20 + (i % 3) * 40, 2, 22, "#9aa4b0");
      break;
    case "estabulo":
      sky("#7aa0c8", "#e0c890");
      rect(W * 0.55, G - 150, W * 0.4, 150, "#8a3a2a");
      rect(W * 0.55 - 10, G - 170, W * 0.4 + 20, 24, "#5a2a1a");
      rect(W * 0.66, G - 80, 70, 80, "#3a1a10");
      rect(0, G, W, H - G, "#b09060");
      for (let x = 0; x < W * 0.5; x += 50) rect(x, G - 40, 6, 40, "#6a4a2a");
      rect(0, G - 34, W * 0.5, 5, "#6a4a2a");
      rect(0, G - 16, W * 0.5, 5, "#6a4a2a");
      break;
    case "arena":
      rect(0, 0, W, H, "#120a20");
      ctx.strokeStyle = `rgba(180,120,255,${0.5 + 0.3 * Math.sin(t * 3)})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(W / 2, G + 40, 220, 60, 0, 0, 7);
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(W / 2, G + 40, 160, 42, 0, 0, 7);
      ctx.stroke();
      break;
    case "forca":
      sky("#2a2a3a", "#8a7a8a");
      rect(0, G, W, H - G, "#7a7078");
      rect(W / 2 - 120, G - 220, 12, 220, "#4a3020");
      rect(W / 2 - 120, G - 220, 150, 12, "#4a3020");
      rect(W / 2 + 20, G - 208, 3, 70, "#c8b48a");
      rect(W / 2 - 150, G - 30, 300, 30, "#5a3a22");
      for (let i = 0; i < 12; i++) rect(i * (W / 11), G + 60, 22, 40, "#2a2430");
      break;
    case "seco":
      sky("#c8a060", "#f0d8a0");
      rect(0, G, W, H - G, "#a07a48");
      ctx.strokeStyle = "#6a4a28";
      ctx.lineWidth = 2;
      for (let i = 0; i < 14; i++) {
        const x = (i * 97) % W,
          y = G + 20 + ((i * 41) % (H - G - 30));
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + 20, y + 8);
        ctx.lineTo(x + 34, y - 4);
        ctx.stroke();
      }
      break;
  }
}
function drawBeast(kind, x, y, t) {
  if (kind === "cavalo") {
    rect(x, y, 90, 40, "#7a4a2a");
    rect(x + 70, y - 34, 26, 40, "#7a4a2a");
    rect(x + 86, y - 30, 22, 16, "#7a4a2a");
    rect(x + 72, y - 40, 10, 14, "#3a2010");
    for (const lx of [6, 24, 58, 76]) rect(x + lx, y + 40, 9, 34 + (lx === 6 ? Math.sin(t * 12) * 6 : 0), "#5a3420");
    rect(x - 10, y + 4, 12, 26, "#3a2010");
    return;
  }
  const big = kind === "urso",
    col = kind === "urso" ? "#4a3020" : kind === "javali" ? "#6a4a2a" : "#6d6a7c";
  const s = big ? 1.4 : 1;
  rect(x, y, 80 * s, 36 * s, col);
  rect(x + 66 * s, y - 14 * s, 34 * s, 30 * s, col);
  rect(x + 92 * s, y - 2 * s, 12 * s, 10 * s, col);
  rect(x + 70 * s, y - 22 * s, 8 * s, 10 * s, col);
  if (!big) rect(x + 86 * s, y - 22 * s, 8 * s, 10 * s, col);
  rect(x + 84 * s, y - 6 * s, 5 * s, 5 * s, "#ff3a3a");
  for (const lx of [6, 22, 52, 66]) rect(x + lx * s, y + 36 * s, 9 * s, 22 * s, col);
  rect(x + 94 * s, y + 8 * s, 10 * s, 4 * s, "#fff");
}
function drawFx(fx, W, H, t, cx, cy) {
  const G = H * 0.62;
  switch (fx) {
    case "sangue":
      ctx.fillStyle = `rgba(150,10,20,${Math.min(0.8, t / 2)})`;
      ctx.beginPath();
      ctx.ellipse(cx + 4, cy + 10, 30 + Math.min(26, t * 9), 10 + Math.min(7, t * 2), 0, 0, 7);
      ctx.fill();
      break;
    case "bolhas":
      for (let i = 0; i < 10; i++) {
        const y = cy - ((t * 50 + i * 37) % 160);
        ctx.strokeStyle = "rgba(220,240,255,.8)";
        ctx.beginPath();
        ctx.arc(cx - 30 + ((i * 23) % 60), y, 3 + (i % 3) * 2, 0, 7);
        ctx.stroke();
      }
      break;
    case "raio":
      if (!settings.calm && (t % 1.6) < 0.18) {
        rect(0, 0, W, H, "rgba(255,255,255,.55)");
        ctx.strokeStyle = "#fff6a0";
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(cx + 10, 0);
        ctx.lineTo(cx - 20, cy * 0.4);
        ctx.lineTo(cx + 20, cy * 0.6);
        ctx.lineTo(cx, cy);
        ctx.stroke();
      }
      for (let i = 0; i < 40; i++) rect((i * 61 + t * 300) % W, (i * 37 + t * 600) % H, 2, 12, "rgba(160,190,230,.6)");
      for (let i = 0; i < 4; i++) rect(cx - 20 + i * 12, cy - 40 - ((t * 30 + i * 9) % 50), 6, 6, "rgba(90,90,90,.6)");
      break;
    case "chuva":
      for (let i = 0; i < 50; i++) rect((i * 61 + t * 300) % W, (i * 37 + t * 600) % H, 2, 12, "rgba(160,190,230,.6)");
      if (!settings.calm && (t % 2.3) < 0.12) rect(0, 0, W, H, "rgba(255,255,255,.4)");
      break;
    case "neve":
      for (let i = 0; i < 60; i++) rect(((i * 61 + Math.sin(t + i) * 20) % W + W) % W, (i * 37 + t * 40) % H, 3, 3, "#fff");
      break;
    case "veneno":
    case "peste":
      for (let i = 0; i < 9; i++) {
        const k = (t * 0.6 + i / 9) % 1;
        ctx.fillStyle = fx === "peste" ? `rgba(170,120,255,${0.5 * (1 - k)})` : `rgba(120,220,90,${0.5 * (1 - k)})`;
        ctx.beginPath();
        ctx.arc(cx - 40 + ((i * 29) % 80), cy - 20 - k * 120, 8 + k * 14, 0, 7);
        ctx.fill();
      }
      if (fx === "peste") for (let i = 0; i < 6; i++) rect(cx - 50 + i * 20 + Math.sin(t * 8 + i) * 6, cy - 50 + Math.cos(t * 9 + i) * 10, 3, 3, "#111");
      break;
    case "pedras":
      for (let i = 0; i < 16; i++) {
        const y = Math.min(cy - 4 + (i % 4) * 4, ((t * 260 + i * 70) % 600) - 100);
        rect(cx - 70 + ((i * 37) % 140), y, 14 + (i % 3) * 6, 12 + (i % 2) * 6, ["#6a6070", "#4a4250", "#7a7080"][i % 3]);
      }
      ctx.fillStyle = `rgba(160,150,140,${0.4 * Math.abs(Math.sin(t))})`;
      ctx.fillRect(0, 0, W, H);
      break;
    case "pedrinhas":
      for (let i = 0; i < 8; i++) rect(cx - 40 + i * 12, ((t * 200 + i * 40) % (G + 80)) - 40, 6, 6, "#6a6070");
      break;
    case "magia":
      for (let i = 0; i < 20; i++) {
        const a = t * 2 + i * 0.6,
          r = 40 + ((t * 40 + i * 13) % 120);
        ctx.fillStyle = i % 2 ? "#b48aff" : "#ff7ae0";
        ctx.fillRect(cx + Math.cos(a) * r, cy - 20 + Math.sin(a) * r * 0.5, 4, 4);
      }
      break;
    case "garrafas":
      for (let i = 0; i < 6; i++) {
        ctx.save();
        ctx.translate(cx - 100 + i * 40, cy + 26);
        ctx.rotate(1.2 + i);
        rect(-4, -12, 8, 18, ["#3a7a3a", "#7a2a3a", "#c8a030"][i % 3]);
        rect(-2, -18, 4, 6, "#3a2414");
        ctx.restore();
      }
      break;
    case "tomates":
      for (let i = 0; i < 12; i++) {
        ctx.fillStyle = "#d83a2a";
        ctx.beginPath();
        ctx.arc(((i * 97 + t * 120) % W), ((i * 53 + t * 160) % (G + 60)), 6, 0, 7);
        ctx.fill();
      }
      break;
    case "pao":
      rect(cx + 40, cy - 6, 26, 14, "#c8903a");
      rect(cx + 44, cy - 4, 18, 4, "#e8b05a");
      break;
    case "coracao": {
      const s = 1 + 0.15 * Math.max(0, Math.sin(t * (t < 2 ? 8 : 2)));
      ctx.save();
      ctx.translate(W / 2, 170);
      ctx.scale(s, s);
      ctx.fillStyle = "#d82a4a";
      ctx.beginPath();
      ctx.arc(-14, -6, 16, 0, 7);
      ctx.arc(14, -6, 16, 0, 7);
      ctx.moveTo(-30, 0);
      ctx.lineTo(0, 34);
      ctx.lineTo(30, 0);
      ctx.fill();
      if (t > 2) {
        ctx.strokeStyle = "#140a1e";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(0, -18);
        ctx.lineTo(-6, 0);
        ctx.lineTo(6, 10);
        ctx.lineTo(0, 32);
        ctx.stroke();
      }
      ctx.restore();
      break;
    }
    case "zzz":
      ctx.font = '700 22px "Pixelify Sans", sans-serif';
      ctx.fillStyle = "#cfe0ff";
      for (let i = 0; i < 3; i++) ctx.fillText("z", cx + 30 + i * 14, cy - 30 - ((t * 20 + i * 18) % 60));
      for (const [x, c] of [
        [cx - 120, "#9aa4b0"],
        [cx + 90, "#7a5a3a"],
      ])
        rect(x, cy + 14, 34, 8, c);
      break;
    case "prato":
    case "sol":
      if (fx === "sol") {
        ctx.fillStyle = "#fff0a0";
        ctx.beginPath();
        ctx.arc(W - 120, 90, 44 + Math.sin(t * 2) * 3, 0, 7);
        ctx.fill();
        rect(cx + 50, cy + 2, 26, 14, "#8a6a4a");
        rect(cx + 54, cy - 4, 18, 6, "#6a4a2a");
      } else {
        ctx.fillStyle = "#e8e0d0";
        ctx.beginPath();
        ctx.ellipse(cx + 70, cy + 14, 24, 8, 0, 0, 7);
        ctx.fill();
        ctx.fillStyle = "#c8c0b0";
        ctx.beginPath();
        ctx.ellipse(cx + 70, cy + 13, 14, 4, 0, 0, 7);
        ctx.fill();
      }
      break;
    case "flechas":
      for (let i = 0; i < 10; i++) {
        const x = ((t * 400 + i * 120) % (W + 200)) - 100,
          y = 60 + ((i * 47) % 200) + x * 0.15;
        rect(x, y, 30, 2, "#3a2414");
        rect(x + 28, y - 2, 6, 6, "#9aa4b0");
      }
      rect(cx - 6, cy - 40, 3, 34, "#3a2414");
      rect(cx + 20, cy - 34, 3, 30, "#3a2414");
      break;
    case "estrelas":
      for (let i = 0; i < 5; i++) {
        const a = t * 4 + i * 1.25;
        rect(cx + Math.cos(a) * 30, cy - 40 + Math.sin(a) * 8, 6, 6, "#ffe066");
      }
      break;
    case "velas":
      for (const x of [cx - 110, cx + 104]) {
        rect(x, cy - 30, 8, 30, "#efe6cf");
        rect(x + 1, cy - 40 + Math.sin(t * 12 + x), 6, 9, `rgba(255,200,90,${0.7 + 0.3 * Math.sin(t * 9 + x)})`);
      }
      break;
    case "corvos":
      for (let i = 0; i < 4; i++) {
        const x = (t * 60 + i * 160) % W,
          y = 60 + i * 20 + Math.sin(t * 4 + i) * 8;
        rect(x, y, 14, 5, "#111");
        rect(x + 4, y - 4 + (Math.sin(t * 14 + i) > 0 ? 0 : 8), 6, 4, "#111");
      }
      break;
  }
}
function drawDeathScene() {
  const d = game.deathScene;
  if (!d) return;
  const W = viewWidth,
    H = 480,
    t = game.t - d.t0,
    D = d.D;
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.scale(ctx.canvas.width / W, ctx.canvas.height / H);
  ctx.imageSmoothingEnabled = false;
  ctx.textAlign = "center";
  if (t < 6.5) {
    // 1) Onde e como aconteceu.
    drawEnv(D.env, W, H, t);
    const cx = W / 2,
      cy = H * 0.62 + 26;
    // Quem matou fica de pé ao lado.
    if (d.killerLook) {
      const kx = cx + 80,
        ky = cy - 116;
      drawSprite(wizardRects(d.killerLook.robe, d.killerLook.hat || null, d.killerLook.hair, null, "left", 0), kx, ky, 4, true);
      if (D.knife || d.id === "veneno") {
        rect(kx + 2, ky + 54, 8, 8, "#3a2414");
        rect(kx + 1, ky + 30, 6, 26, d.id === "veneno" ? "#3a7a3a" : "#dfe6ee");
        if (D.knife) rect(kx + 1, ky + 44, 6, 12, "#a01a24");
      }
      if (D.spear) rect(kx - 8, ky - 40, 5, 160, "#6a4a2a"), rect(kx - 12, ky - 52, 13, 16, "#cfd6e0");
      ctx.font = '600 13px "Pixelify Sans", sans-serif';
      ctx.fillStyle = "#fff";
      if (d.killerName) ctx.fillText(d.killerName, kx + 32, ky - 8);
    }
    if (d.beast) drawBeast(d.beast, cx + 60, cy - 60, t);
    if (D.crowd) for (let i = 0; i < 9; i++) drawSprite(wizardRects(pk(["#7a3a2a", "#3a5a7a", "#5a7a3a", "#7a6a3a"]), null, "#3a2414", null, i % 2 ? "left" : "right", Math.floor(t * 8 + i) % 3), (i * 97 + t * (i % 2 ? 60 : -60) + W * 4) % W, cy - 120 + (i % 3) * 10, 2.5, i % 2);
    if (D.bed) {
      rect(cx - 76, cy - 24, 152, 40, "#7a4a2a");
      rect(cx - 70, cy - 30, 140, 22, "#e8e0f0");
      rect(cx - 76, cy - 54, 14, 70, "#5a3420");
      rect(cx + 62, cy - 40, 14, 56, "#5a3420");
    }
    if (D.fx === "sangue") drawFx("sangue", W, H, t, cx, cy);
    // O corpo.
    const fall = Math.min(1, t / 0.8);
    ctx.save();
    ctx.translate(cx, D.bed ? cy - 40 : cy - 14);
    if (D.water) ctx.translate(0, Math.min(40, t * 14));
    ctx.rotate(fall * (Math.PI / 2));
    let rects = heroRects(d.look, "down", null);
    const tint = (c, a) => (/^#[0-9a-f]{6}$/i.test(c) ? shade(c, a) : c);
    if (D.frozen) rects = rects.map(([x, y, w, h, c]) => [x, y, w, h, tint(c, 0.35)]).concat([[2, 2, 12, 14, "rgba(190,230,255,.45)"]]);
    if (D.burnt) rects = rects.map(([x, y, w, h, c]) => [x, y, w, h, tint(c, -0.55)]);
    if (!D.buried || t < 1.4) drawSprite(rects, -32, -32, 4, false);
    ctx.restore();
    if (D.water) rect(0, cy + 6, W, H - cy, "rgba(40,90,140,.6)");
    if (D.buried) drawFx("pedras", W, H, Math.min(t, 1.6), cx, cy);
    if (D.fx !== "sangue") drawFx(D.fx, W, H, t, cx, cy);
    // A alma sobe.
    if (t > 2.3) {
      const k = Math.min(1, (t - 2.3) / 3.8);
      ctx.globalAlpha = 0.6 * (1 - k * 0.5);
      const ghost = heroRects(d.look, "down", null).map(([x, y, w, h]) => [x, y, w, h, "#eaf4ff"]);
      drawSprite(ghost, cx - 32 + Math.sin(t * 3) * 10, cy - 110 - k * 170, 4, false);
      ctx.globalAlpha = 1;
    }
    rect(0, 0, W, H, `rgba(0,0,0,${Math.max(0, 0.7 - t * 0.5) + Math.max(0, (t - 5.6) * 1.1)})`);
    ctx.fillStyle = "rgba(10,4,14,.6)";
    ctx.fillRect(0, 30, W, 70);
    ctx.font = '700 24px "Pixelify Sans", sans-serif';
    ctx.fillStyle = `rgba(255,225,225,${Math.min(1, t / 1.2)})`;
    ctx.fillText(d.title, W / 2, 62);
    ctx.font = '600 16px "Pixelify Sans", sans-serif';
    ctx.fillStyle = `rgba(255,255,255,${Math.min(1, Math.max(0, t - 1.2))})`;
    ctx.fillText(`${d.name} · ${d.age} anos`, W / 2, 88);
  } else {
    // 2) O velório no cemitério.
    const k = Math.min(1, (t - 6.5) / 1.2);
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, "#0b0a1e");
    sky.addColorStop(0.6, "#2a2346");
    sky.addColorStop(1, "#1a1626");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 40; i++) rect((i * 97) % W, (i * 53) % 200, 2, 2, `rgba(255,255,255,${0.3 + 0.5 * Math.abs(Math.sin(i * 7.3 + t))})`);
    ctx.fillStyle = "#f4ecc8";
    ctx.beginPath();
    ctx.arc(W - 110, 80, 30, 0, 7);
    ctx.fill();
    ctx.fillStyle = "#2a2346";
    ctx.beginPath();
    ctx.arc(W - 98, 72, 26, 0, 7);
    ctx.fill();
    ctx.fillStyle = "#1e3324";
    ctx.beginPath();
    ctx.ellipse(W / 2, H + 60, W * 0.8, 210, 0, 0, 7);
    ctx.fill();
    ctx.fillStyle = "#3d3a48";
    for (const x of [80, 170, W - 190, W - 80]) {
      ctx.fillRect(x - 12, 262, 24, 34);
      ctx.beginPath();
      ctx.arc(x, 262, 12, Math.PI, 0);
      ctx.fill();
    }
    const gx = W / 2,
      gy = 230;
    ctx.fillStyle = "#8a8698";
    ctx.fillRect(gx - 84, gy, 168, 130);
    ctx.beginPath();
    ctx.arc(gx, gy, 84, Math.PI, 0);
    ctx.fill();
    rect(gx - 84, gy + 120, 168, 10, "#6d6a7c");
    rect(gx - 94, gy + 128, 188, 14, "#4a3a2a");
    ctx.fillStyle = "#24202e";
    ctx.font = '700 14px "Pixelify Sans", sans-serif';
    ctx.fillText("AQUI JAZ", gx, gy - 44);
    ctx.font = '700 19px "Pixelify Sans", sans-serif';
    ctx.fillText(d.name.slice(0, 16), gx, gy - 20);
    ctx.font = '600 13px "Pixelify Sans", sans-serif';
    ctx.fillText(`${d.born} – ${d.age} anos`, gx, gy);
    ctx.font = '700 11px "Pixelify Sans", sans-serif';
    ctx.fillStyle = "#5a1a24";
    ctx.fillText(d.title.slice(0, 30), gx, gy + 20);
    ctx.fillStyle = "#24202e";
    ctx.font = '500 11px "Pixelify Sans", sans-serif';
    let line = "",
      ly = gy + 40;
    for (const w of d.epi.split(" ")) {
      if ((line + " " + w).length > 25) {
        ctx.fillText(line, gx, ly);
        ly += 13;
        line = w;
      } else line = line ? line + " " + w : w;
    }
    if (line && ly < gy + 118) ctx.fillText(line, gx, ly);
    for (const [x, c] of [
      [gx - 70, "#ff6a8a"],
      [gx - 50, "#ffd86a"],
      [gx + 50, "#b48aff"],
      [gx + 70, "#ff6a8a"],
    ]) {
      rect(x, gy + 118, 2, 10, "#2e6a34");
      rect(x - 3, gy + 114, 8, 6, c);
    }
    for (const x of [gx - 104, gx + 98]) {
      rect(x, gy + 104, 6, 22, "#efe6cf");
      rect(x + 1, gy + 96 + Math.sin(t * 12 + x), 4, 7, `rgba(255,200,90,${0.7 + 0.3 * Math.sin(t * 9 + x)})`);
    }
    d.mourn.forEach((m, i) => {
      const side = i % 2 ? 1 : -1,
        idx = Math.floor(i / 2);
      const x = gx + side * (134 + idx * 60) - 24,
        y = 316 + idx * 6;
      ctx.fillStyle = "rgba(0,0,0,.3)";
      ctx.beginPath();
      ctx.ellipse(x + 24, y + 46, 14, 4, 0, 0, 7);
      ctx.fill();
      const rects = m.hero ? heroRects(m.hero, "down", null) : wizardRects(m.npc.robe, m.npc.hat || null, m.npc.hair, null, side < 0 ? "right" : "left", 0);
      drawSprite(rects, x, y + Math.sin(t * 2 + i) * 1.2, 3, side > 0);
      if (Math.sin(t * 3 + i) > 0.2) rect(x + 20, y + 22 + ((t * 30 + i * 9) % 14), 2, 3, "rgba(140,200,255,.9)");
      ctx.font = '600 11px "Pixelify Sans", sans-serif';
      ctx.fillStyle = "#e8e0ff";
      ctx.fillText(m.n, x + 24, y + 62);
    });
    for (let i = 0; i < 18; i++) rect((i * 131 + t * 30) % W, (i * 67 + t * 45) % H, 3, 2, i % 2 ? "#ff9ab8" : "#fff0f4");
    ctx.fillStyle = "#fff";
    ctx.font = '700 20px "Pixelify Sans", sans-serif';
    ctx.fillText(d.title, W / 2, 40);
    ctx.font = '600 13px "Pixelify Sans", sans-serif';
    ctx.fillStyle = d.novo ? "#ffe066" : "#bfb6d8";
    ctx.fillText(`${d.novo ? "Nova morte descoberta! " : ""}Livro das Mortes: ${d.count}/${DEATH_IDS.length}`, W / 2, 64);
    if (t > 7) {
      ctx.font = '600 14px "Pixelify Sans", sans-serif';
      ctx.fillStyle = `rgba(255,255,255,${0.5 + 0.5 * Math.sin(t * 4)})`;
      ctx.fillText(matchMedia("(pointer: coarse)").matches ? "Toque para continuar" : "Enter para continuar", W / 2, H - 18);
    }
    rect(0, 0, W, H, `rgba(0,0,0,${1 - k})`);
  }
  ctx.restore();
}
{
  const drawBase = draw;
  draw = function () {
    drawBase();
    drawDeathScene();
  };
}

/* ===================== COMO CADA MORTE ACONTECE ===================== */

/* Velhice e forca: as cenas entram antes dos velórios que já existiam. */
{
  const endsBase = lifeEnds;
  lifeEnds = function () {
    if (game.deathShown) return endsBase.apply(this, arguments);
    if (game.mode !== "world" || game.dialog) return setTimeout(lifeEnds, 2000);
    game.deathShown = true;
    playerDies("velhice", { after: () => endsBase() });
  };
  const exeBase = execution;
  execution = function (id) {
    if (!lifeMode()) return exeBase(id);
    exeBase(id);
    const d = game.dialog;
    if (d && d.lines.length > 3) {
      const cb = d.cb;
      const rest = d.lines.splice(3);
      d.cb = () => playerDies("forca", { after: () => say(rest, cb) });
    }
  };
  const heirBase = continueAsHeir;
  continueAsHeir = function (k, tax) {
    game.deathShown = false;
    const r = heirBase(k, tax);
    player.bdayDay = player.day;
    return r;
  };
}
/* Briga: perder feio pode ser fatal (com o Pedro, bem mais). */
{
  const finBase = finishBrawl;
  finishBrawl = function (won) {
    const b = game.brawl;
    if (b && !won && lifeMode() && Math.random() < (b.pedro ? 0.25 : 0.05)) game.killNext = { id: "briga", killer: b.id };
    return finBase.apply(this, arguments);
  };
}
/* Faca do ciúme (par de quem você flertou). */
{
  const ecBase = endChase;
  endChase = function (msg) {
    const c = game.chase;
    if (c && !c.tgt && !c.deadly && c.hits >= 3 && lifeMode() && Math.random() < 0.3) game.killNext = { id: "ciume", killer: c.who };
    return ecBase.apply(this, arguments);
  };
}
/* Feras da Floresta Grande. */
{
  const fBase = faintInForest;
  faintInForest = function (by) {
    if (lifeMode()) {
      if (by === "Urso" && Math.random() < 0.45) game.killNext = { id: "urso", beast: "urso" };
      else if (by !== "Urso" && Math.random() < 0.3) game.killNext = { id: "fera", beast: by === "Javali" ? "javali" : "lobo" };
    }
    return fBase.apply(this, arguments);
  };
}
/* Guerra. */
{
  const enBase = enlist;
  enlist = function () {
    if (lifeNeed("energy") >= 40 && Math.random() < (playerAge() >= 60 ? 0.1 : 0.04)) game.killNext = { id: "guerra", why: "Uma flecha perdida no meio da batalha." };
    return enBase.apply(this, arguments);
  };
}
/* Golpe de Estado: perder o castelo (ou ser pego no golpe) pode custar a vida. */
{
  const ltBase = loseThrone;
  loseThrone = function (why) {
    if (lifeMode() && /portões/.test(why || "") && Math.random() < 0.5) game.killNext = { id: "contragolpe", why: "Os guardas da Rainha não fizeram prisioneiros." };
    return ltBase.apply(this, arguments);
  };
  const cfBase = coupFail;
  coupFail = function (why) {
    if (lifeMode() && Math.random() < 0.2) {
      const P = plot();
      for (const id of P.allies) addFriendship(id, -10);
      player.plot = null;
      return playerDies("contragolpe", { why: "Uma lança no corredor do castelo acabou com o golpe." });
    }
    return cfBase.apply(this, arguments);
  };
}
/* Duelo de magos (história e Simulador): perder é morrer. */
{
  const loseBase = lose;
  lose = function () {
    if (battle && battle.type === "duelo" && game.duelWith) {
      const id = game.duelWith;
      game.duelWith = null;
      battle.done = true;
      setTimeout(() => playerDies("duelo", { killer: id }), 900);
      return;
    }
    return loseBase.apply(this, arguments);
  };
}
/* Mina: desabamento. */
{
  const gBase = gatherInteract;
  gatherInteract = function (x, y) {
    const c = tileAt(player.zone, x, y);
    if (lifeMode() && c === "o" && player.zone === "mina" && gatherLabel(x, y)) {
      const risk = 0.004 + (lifeNeed("energy") < 20 ? 0.012 : 0);
      if (Math.random() < risk) {
        game.shake = 0.6;
        playSound(60, 0.8, "sawtooth");
        if (Math.random() < 0.55) return playerDies("mina"), true;
        player.hp = Math.max(1, Math.round(maxHp() * 0.25));
        player.injured = true;
        say([["", "CRAC! O teto da mina desaba do seu lado! Você escapa por um triz, coberto de poeira e machucado."]]);
        return true;
      }
    }
    return gBase(x, y);
  };
}
/* Bebedeira: passar do limite é coma alcoólico. */
{
  const dBase = drink;
  drink = function (amount, cost, nm) {
    const before = player.drunk || 0;
    const r = dBase.apply(this, arguments);
    if (lifeMode() && before >= 85 && (player.drunk || 0) >= 100 && Math.random() < 0.3) game.killNext = { id: "alcool" };
    return r;
  };
}
/* Comer: engasgo e veneno. */
{
  const uBase = useItemEffect;
  useItemEffect = function (id) {
    const it = ITEMS[id];
    const out = uBase(id);
    if (!lifeMode() || !it || !it.food || game.mode === "battle") return out;
    if (player.poisonDay === player.day && player.poisonBy) {
      const by = player.poisonBy;
      player.poisonDay = null;
      setTimeout(() => {
        if (Math.random() < 0.5) playerDies("veneno", { killer: by, why: `Na comida, um gosto amargo de beladona.` });
        else {
          getSick("intox");
          say([["", "Um gosto amargo... Você cospe a tempo! Alguém tentou te envenenar."], ["", `Você desconfia de ${shortName(by)}.`]]);
        }
      }, 600);
    } else if (Math.random() < 0.004) setTimeout(chokeEvent, 500);
    return out;
  };
}
function chokeEvent() {
  if (game.dying) return;
  const friend = typeof talkers === "function" ? (talkers().find((p) => NPCS[p.id] && nearPlayer(p.ref, 4)) || null) : null;
  game.shake = 0.3;
  choice("ENGASGOU!", "Um pedaço desceu errado! Você não consegue respirar...", [
    { t: "Tossir com toda a força", icon: "meh", fn: () => (Math.random() < 0.5 ? say([["", "*COF COF* O pedaço voa longe. Ufa! Mastigue devagar da próxima vez."]]) : playerDies("engasgo")) },
    {
      t: friend ? `Pedir socorro para ${friend.nome}` : "Pedir socorro (ninguém por perto...)",
      icon: "chat",
      fn: () => (friend && Math.random() < 0.85 ? (addFriendship(friend.id, 10), say([[friend.nome, "*aperta sua barriga com força* SAI, PEDAÇO!"], ["", `O pedaço voa longe. ${friend.nome} salvou sua vida!`]])) : playerDies("engasgo", { why: "Ninguém ouviu." })),
    },
  ]);
}
/* Assalto de madrugada e vingança pelos seus crimes. */
function ambush(kind) {
  if (game.dying || game.mode !== "world" || game.dialog) return;
  const thief = kind === "ladrao";
  game.shake = 0.3;
  playSound(140, 0.3, "sawtooth");
  const opts = [];
  if (thief)
    opts.push({
      t: "Entregar a bolsa",
      icon: "coin",
      fn: () => {
        const lost = Math.round(player.gold * 0.6);
        player.gold -= lost;
        player.robbedDay = player.day;
        vilaNews(`${player.name} foi assaltad${genderWord("o", "a", "e")} de madrugada. Levaram ${lost} de ouro.`);
        say([["Bandido", "Esperto. Boa noite!"], ["", `Você perdeu ${lost} de ouro, mas está viv${genderWord("o", "a", "e")}.`]]);
      },
    });
  opts.push({
    t: "Reagir e lutar",
    icon: "sword",
    fn: () => {
      player.robbedDay = player.day;
      if (Math.random() < (thief ? 0.5 : 0.45)) {
        repAdd(2);
        say([["", thief ? "Você acerta um soco no bandido, que foge mancando!" : "Você desvia do punhal e o assassino some no escuro. Por pouco!"]]);
      } else if (Math.random() < 0.6) playerDies(thief ? "ladrao" : "assassinado");
      else {
        player.hp = Math.max(1, Math.round(maxHp() * 0.2));
        player.injured = true;
        say([["", "Você leva uma facada de raspão, mas ele foge. Vá ao hospital!"]]);
      }
    },
  });
  opts.push({
    t: guardNear() ? "Gritar pelos guardas" : "Correr",
    icon: "door",
    fn: () => {
      player.robbedDay = player.day;
      if (Math.random() < (guardNear() ? 0.75 : 0.55)) say([["", guardNear() ? "O Guarda Tomé chega correndo e o vulto foge!" : "Você corre pelos becos e despista o vulto. Ufa!"]]);
      else playerDies(thief ? "ladrao" : "assassinado", { why: "Não deu para correr." });
    },
  });
  choice(thief ? "ASSALTO!" : "EMBOSCADA!", thief ? "Um bandido encapuzado encosta uma faca nas suas costas: <b>\"A bolsa ou a vida!\"</b>" : "Uma sombra salta do beco com um punhal: <b>\"Isso é pelo que você fez!\"</b>", opts);
}
/* Riscos que dependem de onde você está e de como está. */
let riskAcc = 0;
function deathRisks(dt) {
  if (!lifeMode() || game.mode !== "world" || game.dialog || game.dying || game.deathScene) return;
  riskAcc += dt;
  if (riskAcc < 1) return;
  const s = riskAcc;
  riskAcc = 0;
  const now = absMinutes();
  const z = player.zone,
    Z = ZONES[z] || {};
  const out = typeof outdoorsNow === "function" ? outdoorsNow() : !!Z.town;
  const h = player.clock / 60;
  const night = h >= 22 || h < 5;
  const drunk = player.drunk || 0;
  const roll = (p) => Math.random() < p * s;
  // Fome, sede e exaustão contam o tempo do jogo.
  const watch = (k, bad, lim, warnAt, warn, death) => {
    if (!bad) return (player[k] = null);
    player[k] = player[k] || now;
    const el = now - player[k];
    if (el >= warnAt && !player[k + "W"]) (player[k + "W"] = 1), toast(warn, 4200);
    if (el < warnAt) player[k + "W"] = 0;
    if (el >= lim) playerDies(death);
  };
  watch("starveAt", player.food <= 0, 2 * 1440, 1440, "Você está morrendo de fome! Coma alguma coisa AGORA.", "fome");
  if (game.dying) return;
  watch("thirstAt", player.water <= 0, 1440, 600, "Sua garganta arde. Você vai morrer de sede se não beber água!", "sede");
  if (game.dying) return;
  watch("tiredAt", lifeNeed("energy") <= 0, 30 * 60, 12 * 60, "Seu corpo não aguenta mais. Durma, ou vai morrer de exaustão!", "exaustao");
  if (game.dying) return;
  // Doença sem tratamento até o fim.
  const sk = player.sick && player.sick.id;
  if (sk && player.hp <= 1.5) {
    game.sickLow = (game.sickLow || 0) + s;
    if (game.sickLow > 3 && game.sickLow - s <= 3) toast("Você está à beira da morte! Vá à Curandeira ou tome remédio!", 4200);
    if (game.sickLow > 30) return playerDies(sk === "peste" ? "peste" : sk === "intox" ? "intoxicacao" : "doenca");
  } else game.sickLow = 0;
  // Água: bêbado no rio, tempestade no mar.
  const nearWater = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ].some(([dx, dy]) => tileAt(z, player.x + dx, player.y + dy) === "~");
  if (nearWater && out && drunk >= 60) {
    if (!game.wWarn) (game.wWarn = 1), toast("Cuidado: bêbad" + genderWord("o", "a", "e") + " na beira da água!", 3000);
    if (roll(0.006)) return playerDies("afogamento");
  }
  if (nearWater && z === "porto" && player.weather === "tempestade") {
    if (!game.seaWarn) (game.seaWarn = 1), toast("As ondas estão enormes! Saia da beira do mar!", 3200);
    if (roll(0.005)) return playerDies("naufragio");
  }
  // Raio na tempestade, ao ar livre.
  if (out && player.weather === "tempestade") {
    if (!game.stormWarn) (game.stormWarn = 1), toast("Tempestade forte! Ficar ao ar livre é perigoso (raios).", 3600);
    if (roll(0.0001)) return playerDies("raio");
  }
  // Frio da madrugada no inverno.
  if (out && season().id === "inv" && (h < 5 || h >= 22) && player.zone !== "casa") {
    game.cold = (game.cold || 0) + s;
    if (game.cold > 25 && game.cold - s <= 25) toast("Você está congelando! Vá para dentro de casa!", 4200);
    if (game.cold > 70) return playerDies("frio");
  } else game.cold = Math.max(0, (game.cold || 0) - s * 2);
  // Serra: bêbado ou caindo de sono à noite.
  if (z === "serra" && out && (drunk >= 50 || (night && lifeNeed("energy") < 15)) && roll(0.006)) return playerDies("queda");
  // Estábulo: bêbado mexendo com os cavalos.
  const est = z === "vila" && vilaSpot("Estábulo");
  if (est && drunk >= 40 && Math.abs(est[0] - player.x) + Math.abs(est[1] - player.y) <= 3 && roll(0.01)) return playerDies("cavalo");
  // Protesto: no meio da confusão.
  const P = game.protest;
  if (P && P.queen && P.phase === 2 && Math.abs(P.queen.x - player.x) + Math.abs(P.queen.y - player.y) <= 4 && roll(0.006)) return playerDies("protesto");
  // Assalto de madrugada (quem anda com muito ouro).
  if (Z.town && out && night && player.gold >= 200 && player.robbedDay !== player.day && roll(0.0008)) return ambush("ladrao");
  // Vingança agendada.
  if (player.revengeDay === player.day && night && out && roll(0.02)) {
    player.revengeDay = null;
    return ambush("assassinado");
  }
  // Coração (agendado no dia).
  if (player.heartAt && now >= player.heartAt) {
    player.heartAt = null;
    return playerDies("coracao");
  }
}
/* Sorteios do dia: coração, veneno, vingança. */
{
  const dayBase = onNewDay;
  onNewDay = function () {
    dayBase.apply(this, arguments);
    if (!lifeMode()) return;
    const a = playerAge();
    if (a >= 50) {
      const p = (a - 45) * 0.0016 + ((player.drunk || 0) > 50 ? 0.01 : 0) + (lifeNeed("fun") < 10 ? 0.006 : 0);
      if (Math.random() < p) player.heartAt = absMinutes() + 60 * (6 + Math.random() * 14);
    }
    const foes = Object.keys(player.despise || {}).filter((id) => NPCS[id] && !isDead(id));
    if (foes.length && Math.random() < Math.min(0.06, 0.01 + foes.length * 0.012)) {
      player.poisonDay = player.day;
      player.poisonBy = pk(foes);
    }
    if ((player.murders || 0) > 0 && Math.random() < Math.min(0.2, 0.06 * player.murders)) player.revengeDay = player.day;
  };
  const updBase = update;
  update = function (dt) {
    updBase(dt);
    if (game.mode === "title" || game.mode === "cutscene") return;
    deathRisks(dt);
  };
}
