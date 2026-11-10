/**
 * ECOS DO ARCANO — jornada.js
 * Modo História:
 *  - Encontros na estrada: gente pelo caminho, cada um com uma escolha.
 *  - Sonhos com Vesper: quando você dorme, ele fala com você.
 *  - A turma reage: depois de cada Guardião, os amigos comentam.
 *  - Jornada (J): tudo o que você fez, salvou e escolheu.
 * Nos dois modos:
 *  - Tutorial opcional (pergunta no começo, e dá para rever nas Opções).
 *  - Sons de ambiente por região e músicas novas (vila em silêncio, luta final).
 *  - Conquistas novas.
 * Modifica (envolve) funções de outros arquivos: crewDrawList, desiredTrack,
 * enterZone, renderOptions, rewardGuardian, say, socialMenu, speakerLook,
 * startBattle, tutTick, update.
 */

"use strict";

/* ===================== GENTE PELO CAMINHO ===================== */
ENEMIES.bandido = Object.assign({}, ENEMIES.aprendiz, { nome: "Bandido Encapuzado", hp: 70, atk: 11, xp: 45, cor: "#7a5a3a", weak: ["fogo", "ar"], resist: [], special: null });
ENEMY_LEVELS.bandido = { base: 6, range: [3, 13] };
STORY_FIGHTS.push("bandido");

const addHero = (n = 1) => (player.heroPts = (player.heroPts || 0) + n);
const addVill = (n = 1) => (player.villain = (player.villain || 0) + n);
function enc() {
  return (player.enc = player.enc || {});
}
function encDone(id, result) {
  enc()[id] = result;
  saveGame();
}
const ENCOUNTERS = [
  {
    id: "mercador",
    zones: ["bosque", "porto", "serra"],
    who: "Mercador Ivo",
    look: { robe: "#8a6a3a", hat: "#4a3a20", hair: "#5a4030" },
    lines: [["", "Gritos na estrada! Um bandido encapuzado está arrancando a bolsa de um mercador."], ["Mercador Ivo", "Socorro! É tudo o que eu tenho!"]],
    opts: () => [
      { t: "Defender o mercador", icon: "armor", fn: () => (addHero(), encDone("mercador", "defendeu"), say([["Bandido Encapuzado", "Quer brincar de herói? Então vem!"]], () => startBattle("bandido", null))) },
      { t: "Ajudar o bandido e dividir o ouro", icon: "skull", fn: () => (addVill(), (player.gold += 60), encDone("mercador", "roubou"), say([["", "Vocês dividem a bolsa. O mercador te olha como quem nunca vai esquecer seu rosto."], ["", "+60 de ouro."]])) },
      { t: "Fingir que não viu", icon: "door", fn: () => (encDone("mercador", "ignorou"), say([["", "Você segue em frente. Os gritos ficam para trás."]])) },
    ],
    after: () => ((player.gold += 40), say([["Mercador Ivo", "Você salvou a minha vida! Tome, é pouco, mas é de coração."], ["", "+40 de ouro. Em Cinzaluz, vão saber disso."]])),
  },
  {
    id: "crianca",
    zones: ["pantano", "bosque"],
    who: "Tito",
    look: { robe: "#c06040", hat: null, hair: "#3a2a1a" },
    lines: [["", "Um menino pequeno chora sentado numa raiz."], ["Tito", "Eu segui um vagalume e me perdi... A minha mãe vai me matar..."]],
    opts: () => [
      { t: "Levar ele de volta para casa (custa 2 horas)", icon: "heart", fn: () => (addHero(), (player.clock = (player.clock || 0) + 120), addItem("maca", 3), encDone("crianca", "levou"), say([["Tito", "Você é igual aos heróis das histórias do Bardo!"], ["", "A mãe dele te dá 3 maçãs e um abraço apertado."]])) },
      { t: "Apontar o caminho e seguir", icon: "flag", fn: () => (encDone("crianca", "apontou"), say([["Tito", "É... por ali? Tá bom... obrigado."]])) },
      { t: "Assustar ele para ir mais rápido", icon: "skull", fn: () => (addVill(), encDone("crianca", "assustou"), say([["", "Tito sai correndo e chorando mais alto. Funciona. Mas não é bonito."]])) },
    ],
  },
  {
    id: "ecovoz",
    zones: ["picos", "pantano", "bosque"],
    who: "Eco",
    look: { robe: "#5a5a7a", hat: "#2a2a4a", hair: "#c0c0e0" },
    lines: () => [["", "Um vulto sem rosto fala com a voz da Odelia. Igualzinha."], ["Eco", `Desista, ${player.name}. Ninguém vai lembrar de você. Ninguém lembrou de Vesper.`]],
    opts: () => [
      { t: "Ouvir até o fim (perde 10 de mana, aprende algo)", icon: "book", fn: () => ((player.mp = Math.max(0, player.mp - 10)), gainXP(40), encDone("ecovoz", "ouviu"), say([["Eco", "Ela trancou a porta. Ele bateu a noite inteira. Ela tinha onze anos e estava com medo."], ["", "Isso não estava no diário. +40 XP."]])) },
      { t: "Calar o Eco com magia", icon: "bolt", fn: () => (encDone("ecovoz", "calou"), startBattle("espectro", null)) },
    ],
  },
  {
    id: "peregrino",
    zones: ["bosque", "pantano", "picos", "porto", "serra"],
    who: "Peregrino",
    look: { robe: "#9a9080", hat: "#5a5040", hair: "#e0e0e0" },
    lines: [["", "Um velho peregrino, de pés cansados, para você na estrada."], ["Peregrino", "Faz dois dias que não como nada. Teria algo para um velho?"]],
    opts: () => {
      const food = ["maca", "pao", "peixe", "queijo"].find((k) => ITEMS[k] && itemCount(k));
      return [
        food
          ? { t: `Dar ${ITEMS[food].nome}`, icon: "heart", fn: () => (removeItem(food), addHero(), (player.blessDay = player.day), encDone("peregrino", "deu"), say([["Peregrino", "Que as runas cantem para você hoje."], ["", "Bênção do peregrino: +10% de dano até o fim do dia."]])) }
          : { t: "Dar 15 de ouro", icon: "coin", fn: () => ((player.gold = Math.max(0, player.gold - 15)), addHero(), (player.blessDay = player.day), encDone("peregrino", "deu"), say([["Peregrino", "Que as runas cantem para você hoje."], ["", "Bênção do peregrino: +10% de dano até o fim do dia."]])) },
        { t: "Dizer que não tem nada", icon: "door", fn: () => (encDone("peregrino", "negou"), say([["Peregrino", "Entendo. Os tempos são duros para todos."]])) },
      ];
    },
  },
  {
    id: "soldado",
    zones: ["picos", "serra"],
    who: "Soldado de Pedravale",
    look: { robe: "#6a6a70", hat: "#3a3a40", hair: "#4a3020" },
    lines: [["", "Um soldado ferido está encostado numa pedra, com a espada ainda na mão."], ["Soldado de Pedravale", "Os Ecos atacaram a patrulha. Só eu sobrei..."]],
    opts: () => [
      itemCount("pocao")
        ? { t: "Dar uma poção para ele", icon: "heart", fn: () => (removeItem("pocao"), addHero(), addItem("fragmento", 1), encDone("soldado", "curou"), say([["Soldado de Pedravale", "Fique com isso. Achei na mina antes do ataque."], ["", "Você ganhou um Fragmento Arcano."]])) }
        : { t: "Fazer um curativo com a sua capa", icon: "heart", fn: () => (addHero(), encDone("soldado", "curou"), say([["Soldado de Pedravale", "Pedravale não esquece quem ajuda os seus."]])) },
      { t: "Pegar a espada dele e vender", icon: "skull", fn: () => (addVill(), (player.gold += 45), encDone("soldado", "roubou"), say([["", "Ele está fraco demais para impedir. +45 de ouro."]])) },
    ],
  },
  {
    id: "raposa",
    zones: ["bosque", "pantano"],
    who: "Caçador",
    look: { robe: "#4a5a2a", hat: "#2a3a1a", hair: "#6a4020" },
    lines: [["", "Uma raposinha prateada está presa numa armadilha. O caçador já vem chegando."], ["Caçador", "Pele de raposa-prata vale ouro. Quer comprar antes de eu tirar?"]],
    opts: () => [
      { t: "Pagar 30 de ouro e soltar a raposa", icon: "heart", fn: () => ((player.gold = Math.max(0, player.gold - 30)), addHero(), encDone("raposa", "soltou"), say([["", "A raposa some no mato. Mais tarde, você jura que viu dois olhos prateados te seguindo de longe, cuidando de você."]])) },
      { t: "Comprar a pele (40 de ouro)", icon: "coin", fn: () => ((player.gold = Math.max(0, player.gold - 40)), addVill(), (player.maxHpBonus = (player.maxHpBonus || 0) + 5), encDone("raposa", "comprou"), say([["", "Uma capa quente de pele prateada. +5 de vida máxima. Ela não te olha mais."]])) },
      { t: "Seguir em frente", icon: "door", fn: () => (encDone("raposa", "seguiu"), say([["", "Você ouve o estalo da armadilha ficando para trás."]])) },
    ],
  },
  {
    id: "ladra",
    zones: ["porto"],
    who: "Menina de rua",
    look: { robe: "#7a4a6a", hat: null, hair: "#2a1a1a" },
    lines: () => [["", "Uma mão pequena puxa a sua bolsa e sai correndo! Você alcança a menina no fim do cais."], ["Menina de rua", "Desculpa! Desculpa! Eu só queria pão!"]],
    opts: () => [
      { t: "Deixar ela ficar com as moedas (e dar mais 10)", icon: "heart", fn: () => ((player.gold = Math.max(0, player.gold - 10)), addHero(), encDone("ladra", "ajudou"), say([["Menina de rua", "...Ninguém nunca fez isso. Eu vou lembrar de você."]])) },
      { t: "Pegar de volta e soltar", icon: "flag", fn: () => (encDone("ladra", "soltou"), say([["", "Ela foge antes que você mude de ideia."]])) },
      { t: "Entregar para a guarda do porto", icon: "lock", fn: () => (addVill(), encDone("ladra", "entregou"), say([["", "O guarda arrasta a menina pelo braço. Ela não chora. Só te encara."]])) },
    ],
  },
  {
    id: "bardo",
    zones: ["porto", "serra", "picos"],
    who: "Bardo Itinerante",
    look: { robe: "#a03a5a", hat: "#5a1a2a", hair: "#d0a060" },
    lines: () => {
      const good = (player.heroPts || 0) >= (player.villain || 0);
      return [["", "Na beira da estrada, um bardo afina o alaúde."], ["Bardo Itinerante", good ? `Ei! Você é ${player.name}? Já tem canção sobre você! "Quem acorda as runas não dorme de noite..."` : `Ei... você é ${player.name}? Já cantam sobre você. Mas é uma canção de medo.`]];
    },
    opts: () => [
      { t: "Pagar 10 de ouro para ele cantar em Cinzaluz", icon: "note", fn: () => ((player.gold = Math.max(0, player.gold - 10)), typeof repAdd === "function" && repAdd(3), encDone("bardo", "pagou"), say([["Bardo Itinerante", "Combinado! Até o fim da semana, a vila inteira vai saber a letra."]])) },
      { t: "Agradecer e seguir", icon: "door", fn: () => (encDone("bardo", "ouviu"), say([["Bardo Itinerante", "Boa estrada! Volte com mais versos para mim."]])) },
    ],
  },
];
function encTick() {
  const z = player.zone;
  if (game.encWait > 0) return false;
  if ((player.playtime || 0) - (player.encLast || -999) < 100) return false;
  const pool = ENCOUNTERS.filter((e) => e.zones.includes(z) && !(e.id in enc()));
  if (!pool.length || Math.random() > 0.45) return ((game.encWait = 9999), false);
  const E = pool[Math.floor(Math.random() * pool.length)];
  player.encLast = player.playtime || 0;
  game.encWait = 9999;
  game.encFight = E.id;
  placeActor(E.look);
  const lines = typeof E.lines === "function" ? E.lines() : E.lines;
  say(lines, () => choice(E.who, "O que você faz?", E.opts()));
  return true;
}
/** Põe alguém no mapa ao seu lado enquanto a cena durar. */
function placeActor(look) {
  for (const [dx, dy] of [[0, -2], [2, 0], [-2, 0], [0, 2], [0, -1], [1, 0], [-1, 0]]) {
    const x = player.x + dx,
      y = player.y + dy;
    if (walkable(player.zone, x, y)) return (game.actor = { z: player.zone, x, y, look });
  }
}

/* ===================== SONHOS COM VESPER ===================== */
const VESPER_DREAMS = [
  { need: 0, lines: [["Vesper", "Você também ouve, não ouve? O silêncio entre uma nota e outra."], ["Vesper", "Eu tinha a sua idade quando ouvi pela primeira vez. Volte a dormir. Ainda é cedo."]] },
  { need: 1, lines: [["Vesper", "Você acordou o Ent. Ele gostava de mim, sabia? Eu subia nos galhos dele."], ["Vesper", "Por que você está desfazendo tudo o que eu guardei?"]] },
  { need: 2, lines: [["Vesper", "Sonho com uma porta fechada toda noite. Do outro lado, alguém respira."], ["Vesper", "Se a Odelia te contou que foi culpa minha... ela mentiu. Ou não. Eu não lembro mais."]] },
  { need: 3, lines: [["Vesper", "Estou cansado, aprendiz. Trezentos anos segurando uma canção para ninguém roubar."], ["Vesper", "Quando você chegar à Torre, eu vou ter que lutar. Não sei fazer outra coisa."]] },
  {
    need: 4,
    lines: [["Vesper", "Faltam poucos passos. Eu consigo ouvir os seus daqui."], ["Vesper", "Me diz uma coisa... se eu perder, alguém vai lembrar do meu nome?"]],
    ask: true,
  },
];
function dreamScene(W, H, t) {
  ctx.fillStyle = "#070a1c";
  ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 70; i++) {
    ctx.fillStyle = `rgba(190,200,255,${0.15 + 0.35 * Math.abs(Math.sin(i * 3.1 + t * 0.7))})`;
    ctx.fillRect((i * 131) % W, (i * 71 + t * 6) % H, 2, 2);
  }
  ctx.save();
  ctx.globalAlpha = Math.min(1, t / 1.5) * 0.9;
  drawSprite(wizardRects("#3a2a5a", "#1a1030", "#d8d0f0", "#c9a8ff", "down", Math.floor(t * 2) % 2), W / 2 - 48, H / 2 - 80 + Math.sin(t * 1.4) * 6, 6, false);
  ctx.restore();
  ctx.textAlign = "center";
  txt("Você sonha...", W / 2, 70, 22, `rgba(220,220,255,${Math.min(1, t / 1)})`, 600);
}
function dreamTick() {
  if (!player.dreamPending) return false;
  player.dreamPending = false;
  const n = player.dreams || 0,
    D = VESPER_DREAMS[n];
  if (!D || guardiansFreed() < D.need) return false;
  player.dreams = n + 1;
  saveGame();
  playCine(dreamScene, 3.2, () =>
    say(D.lines, () => {
      if (!D.ask) return say([["", "Você acorda com o rosto molhado. Não lembra de ter chorado."]]);
      choice("O sonho", "Vesper espera a sua resposta.", [
        { t: "\"Eu vou lembrar. Prometo.\"", icon: "heart", fn: () => ((player.flags.dreamPromise = true), saveGame(), say([["Vesper", "...Então talvez eu deixe você vencer."], ["", "Essa promessa vai pesar na luta final."]])) },
        { t: "\"Você vai ser esquecido. Como merece.\"", icon: "skull", fn: () => (addVill(), say([["Vesper", "Então somos dois."], ["", "Você acorda com frio."]])) },
      ]);
    }),
  );
  return true;
}

/* ===================== A TURMA REAGE ===================== */
const CREW_REACT = {
  ent: ["Você soltou o Ent?! Eu sempre achei que aquela árvore me olhava torto.", "O bosque tá cheirando a chuva de novo. Foi você, né?", "Me leva da próxima vez! Eu carrego as poções!"],
  serpente: ["A névoa do pântano baixou. Minha avó chorou de alegria.", "Uma serpente de NÉVOA? E você lutou com ela? Eu teria desmaiado.", "Agora dá pra pescar de novo no brejo. Te devo um peixe."],
  grifo: ["Ouvi o Grifo gritando lá dos Picos. A vila inteira parou pra olhar.", "Você tá diferente. Mais... sei lá. Corajos" + "a/o de verdade.", "Três Guardiões. Três! A gente devia fazer uma festa."],
  basilisco: ["Debaixo da terra? Com um basilisco? Você é louc" + "a/o.", "Os mineiros estão contando a história na taverna. Cada vez fica maior.", "Falta pouco, né? Tô com medo do que vem depois."],
  leviata: ["O mar tá calmo. Calmo de um jeito bom.", "Só falta a Torre... Promete que volta?", "Se precisar de mim lá em cima, é só chamar. Sério."],
};
function crewReactLine(id, type) {
  const pool = CREW_REACT[type] || ["Que coisa, hein?"];
  let l = pool[hashStr(id + type) % pool.length].replace("a/o", genderWord("o", "a", "e"));
  const sil = (player.silenced || [])[0];
  if (sil && NPCS[sil] && hashStr(id) % 2) l += ` ...E a ${shortName(sil)}? Ela não fala mais. Dá um aperto ver.`;
  if (player.nyx && player.nyx.ally && hashStr(id) % 3 === 0) l += " E que história é essa de você andar com uma caçadora de capa verde?";
  return l;
}

/* ===================== JORNADA (J) ===================== */
function journeyHTML() {
  const F = player.flags || {},
    N = player.nyx || {},
    S = player.siege || {};
  const row = (ic, t, d) => `<div class="jr-row">${iconHTML(ic, 18)}<div><b>${t}</b><small>${d}</small></div></div>`;
  const GU = [["bosque", "Ent"], ["pantano", "Serpente"], ["picos", "Grifo"], ["mina", "Basilisco"], ["porto", "Leviatã"]];
  const cards = Object.entries(CHAPTER_CARDS).map(([id, c]) => `<span class="jr-chip ${(player.cards || []).includes(id) ? "on" : ""}">${c[0]}: ${c[1]}</span>`).join("");
  const guards = GU.map(([z, n]) => `<span class="jr-chip ${player.guards.includes(z) ? "on" : ""}">${player.guards.includes(z) ? "✓ " : ""}${n}</span>`).join("");
  const nyxTxt = !N.s1 ? "Você ainda não cruzou com ela." : N.dead ? "Ela caiu nos Picos. Por sua mão." : N.ally ? "Aliada. Ela luta do seu lado." : N.final ? "Vocês se enfrentaram na Torre. Ela seguiu o próprio caminho." : `Confiança: ${"♥".repeat(Math.max(0, N.trust || 0)) || "nenhuma"} (precisa de 2 para ela ficar do seu lado)`;
  const sg = (k, a, b) => (S[k] && S[k] !== "andando" && S[k] !== "pulado" ? `Você salvou ${shortName(S[k])}; ${shortName(S[k] === a ? b : a)} perdeu a voz${(player.silenced || []).includes(S[k] === a ? b : a) ? "" : " (já voltou)"}.` : "Ainda não aconteceu.");
  const encs = ENCOUNTERS.map((e) => `<span class="jr-chip ${e.id in enc() ? "on" : ""}">${e.who}${e.id in enc() ? ": " + enc()[e.id] : ""}</span>`).join("");
  const kael = { ajudou: "Você ficou do lado dele.", exilado: "Você contou para a Odelia e ele foi embora.", perdido: player.flags.kaelSalvo ? "Ele se perdeu, mas você o salvou na Torre." : "Ele se perdeu no Silêncio." }[F.kaelChoice] || "Ainda não decidido.";
  const honda = { confiou: "Você deixou o diário com ele.", recusou: "Você pegou o diário de volta." }[F.hondaChoice] || "Ainda não decidido.";
  return `<div class="gh"><h2>Sua Jornada</h2><button id="jrclose">Fechar (J)</button></div>
  <div class="jr-sum">${(moralLabel() || { n: "Ainda sem lado" }).n} · Herói ${player.heroPts || 0} · Vilão ${player.villain || 0} · ${player.runes.length} runas</div>
  <h3>Capítulos</h3><div class="jr-chips">${cards}</div>
  <h3>Guardiões</h3><div class="jr-chips">${guards}</div>
  <h3>Pessoas</h3>
  ${row("star", "Nyx, a Caçadora de Runas", nyxTxt)}
  ${row("sword", "Instrutor Kael", kael)}
  ${row("book", "Professor Honda e o diário", honda)}
  ${row("sparkle", "Sonhos com Vesper", `${player.dreams || 0} de ${VESPER_DREAMS.length}${F.dreamPromise ? " · você prometeu lembrar dele" : ""}`)}
  <h3>Cinzaluz</h3>
  ${row("armor", "Primeiro ataque do Silêncio", sg("c1", SIEGES.c1.a.id, SIEGES.c1.b.id))}
  ${row("armor", "Segundo ataque do Silêncio", sg("c2", SIEGES.c2.a.id, SIEGES.c2.b.id))}
  <h3>Gente pelo caminho (${Object.keys(enc()).length}/${ENCOUNTERS.length})</h3><div class="jr-chips">${encs}</div>`;
}
function openJourney() {
  if (game.mode !== "world") return;
  let el = byId("jornada");
  if (!el) {
    el = document.createElement("div");
    el.id = "jornada";
    el.className = "box ui ov";
    byId("screen").appendChild(el);
  }
  el.innerHTML = journeyHTML();
  el.style.display = "block";
  game.mode = "jornada";
  byId("jrclose").onclick = closeJourney;
}
function closeJourney() {
  const el = byId("jornada");
  if (el) el.style.display = "none";
  game.mode = "world";
}
KEY_HANDLERS.jornada = (k) => (k === "escape" || k === "j") && closeJourney();
BEFORE_DIALOG.add("jornada");
{
  const jBase = WORLD_SHORTCUTS.j;
  WORLD_SHORTCUTS.j = () => (story() ? openJourney() : jBase && jBase());
}
(function journeyCSS() {
  const st = document.createElement("style");
  st.textContent = `#jornada{position:absolute;inset:4% 6%;overflow:auto;z-index:60;padding:14px 18px}
  #jornada h3{margin:12px 0 6px;font-size:15px;color:var(--gold,#ffd34d)}
  .jr-sum{opacity:.85;font-size:13px}
  .jr-chips{display:flex;flex-wrap:wrap;gap:6px}
  .jr-chip{font-size:12px;padding:3px 8px;border-radius:10px;background:rgba(255,255,255,.06);opacity:.55}
  .jr-chip.on{opacity:1;background:rgba(255,211,77,.16)}
  .jr-row{display:flex;gap:10px;align-items:flex-start;margin:6px 0}
  .jr-row small{display:block;opacity:.8}`;
  document.head.appendChild(st);
})();

/* ===================== TUTORIAL OPCIONAL ===================== */
function tutAskTick() {
  if (player.tutAsked || player.tutDone || !player.name || game.mode !== "world" || game.dialog || game.cine) return false;
  player.tutAsked = true;
  choice("Primeira vez aqui?", "Quer umas dicas rápidas enquanto joga? (Dá para rever nas Opções.)", [
    { t: "Sim, me mostra", icon: "book", fn: () => ((player.tutStep = 0), saveGame()) },
    { t: "Não, já sei jogar", icon: "door", fn: () => ((player.tutDone = true), saveGame()) },
  ]);
  return true;
}
TUT_STORY.splice(TUT_STORY.length - 1, 0, { t: "Aperte <kbd>J</kbd> para ver a sua <b>Jornada</b>: quem você salvou, o que escolheu e o que falta.", done: () => game.mode === "jornada" || game.tutT > 12 });
{
  const ttBase = tutTick;
  tutTick = function (dt) {
    if (!player.tutAsked && !player.tutDone) return hideTut();
    return ttBase(dt);
  };
  const roBase = renderOptions;
  renderOptions = function () {
    roBase();
    const g = byId("optAch") || byId("optGuide");
    if (!g) return;
    if (!byId("optTut")) {
      const b = document.createElement("button");
      b.id = "optTut";
      b.textContent = "Rever tutorial";
      b.onclick = () => {
        player.tutDone = false;
        player.tutAsked = true;
        player.tutStep = 0;
        game.tutT = 0;
        closeOptions();
        toast("O tutorial vai aparecer no canto da tela.", 2400);
      };
      g.parentNode.appendChild(document.createTextNode(" "));
      g.parentNode.appendChild(b);
    }
    if (story() && !byId("optJr")) {
      const b = document.createElement("button");
      b.id = "optJr";
      b.textContent = "Jornada";
      b.onclick = () => (closeOptions(), openJourney());
      g.parentNode.appendChild(document.createTextNode(" "));
      g.parentNode.appendChild(b);
    }
  };
}

/* ===================== SONS E MÚSICAS ===================== */
Object.assign(TRACKS, {
  silencio: { bpm: 60, lead: "triangle", melody: [69, 0, 0, 0, 0, 0, 72, 0, 0, 0, 0, 0, 0, 0, 0, 0, 67, 0, 0, 0, 0, 0, 64, 0, 0, 0, 0, 0, 0, 0, 0, 0], bass: [45, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
  final: { bpm: 132, lead: "sawtooth", melody: [57, 60, 64, 0, 63, 0, 60, 57, 56, 0, 57, 0, 60, 63, 66, 0, 65, 0, 63, 60, 57, 0, 56, 0, 57, 0, 69, 0, 68, 0, 64, 0], bass: [33, 33, 45, 33, 32, 32, 44, 32, 30, 30, 42, 30, 29, 41, 29, 41] },
});
{
  const dtBase = desiredTrack;
  desiredTrack = function () {
    if (game.mode === "battle" && battle && battle.type === "silenciador") return "final";
    const base = dtBase();
    if (story() && player.zone === "vila" && !player.finished && (player.runes || []).length < 2 && (base === "vila" || base === "noite")) return "silencio";
    return base;
  };
}
const AMBIENT = {
  bosque: () => (playSound(2400 + Math.random() * 900, 0.05, "sine", 0.018), setTimeout(() => playSound(2900 + Math.random() * 600, 0.04, "sine", 0.015), 90)),
  floresta: () => AMBIENT.bosque(),
  pantano: () => (playSound(105 + Math.random() * 20, 0.09, "square", 0.02), setTimeout(() => playSound(95, 0.08, "square", 0.016), 160)),
  picos: () => playSound(180 + Math.random() * 60, 0.9, "triangle", 0.012),
  serra: () => playSound(200 + Math.random() * 60, 0.7, "triangle", 0.01),
  porto: () => (playSound(1500 + Math.random() * 300, 0.12, "sine", 0.014), setTimeout(() => playSound(1250, 0.14, "sine", 0.012), 140)),
  mina: () => playSound(1700 + Math.random() * 500, 0.03, "sine", 0.02),
  torre: () => playSound(55, 1.2, "sawtooth", 0.008),
};
let ambT = 3;
function ambientTick(dt) {
  if (game.mode !== "world" || !AMBIENT[player.zone] || (typeof settings !== "undefined" && settings.calm)) return;
  ambT -= dt;
  if (ambT > 0) return;
  ambT = 3 + Math.random() * 5;
  try {
    AMBIENT[player.zone]();
  } catch (e) {}
}

/* ===================== CONQUISTAS NOVAS ===================== */
ACHIEVEMENTS.push(
  ["nyxAliada", "Ninguém fica para trás", "Faça a Nyx lutar do seu lado na Torre.", "heart", () => !!(player.nyx && player.nyx.ally)],
  ["cerco", "Escudo de Cinzaluz", "Sobreviva aos dois ataques do Silêncio à vila.", "armor", () => !!(player.siege && player.siege.c1done && player.siege.c2done)],
  ["estrada", "Gente da estrada", "Viva 5 encontros pelo caminho.", "flag", () => Object.keys(player.enc || {}).length >= 5],
  ["sonhos", "Sonhando com Vesper", "Tenha todos os sonhos com Vesper.", "sparkle", () => (player.dreams || 0) >= VESPER_DREAMS.length],
  ["vozes", "Devolver as vozes", "Traga de volta a voz de quem o Silêncio levou.", "note", () => !!(player.siege && player.siege.c1done && !(player.silenced || []).length)],
);

/* ===================== LIGAÇÕES ===================== */
{
  const ezBase = enterZone;
  enterZone = function () {
    const r = ezBase.apply(this, arguments);
    game.encWait = 2.6;
    game.actor = null;
    return r;
  };
  const sayBase = say;
  say = function (lines, cb) {
    if (story() && Array.isArray(lines) && lines.some((l) => l && /^Você dorme/.test(l[1] || ""))) player.dreamPending = true;
    return sayBase.apply(this, arguments);
  };
  const updBase = update;
  let acc = 0;
  update = function (dt) {
    updBase(dt);
    ambientTick(dt);
    if (game.encWait > 0 && game.encWait < 999) game.encWait -= dt;
    if (game.mode !== "world" || game.dialog || game.cine) return;
    acc += dt;
    if (acc < 0.5) return;
    acc = 0;
    if (tutAskTick()) return;
    if (!storyFree() || storyWait > 0) return;
    dreamTick() || encTick();
  };
  const aprBase = applyPostBattleRewards;
  applyPostBattleRewards = function (enemy, type) {
    const r = aprBase.apply(this, arguments);
    if (story() && type === "bandido" && game.encFight === "mercador") {
      game.encFight = null;
      const E = ENCOUNTERS.find((e) => e.id === "mercador");
      setTimeout(() => E.after(), 400);
    }
    return r;
  };
  const rgBase = rewardGuardian;
  rewardGuardian = function (enemy, type) {
    const r = rgBase.apply(this, arguments);
    if (story()) player.reacts = { type, ids: CREW.filter((id) => NPCS[id] && !(typeof isDead === "function" && isDead(id))) };
    return r;
  };
  const smBase = socialMenu;
  socialMenu = function (id) {
    const R = player.reacts;
    if (story() && R && R.ids.includes(id) && !(player.silenced || []).includes(id)) {
      R.ids = R.ids.filter((q) => q !== id);
      return say([[NPCS[id].nome, crewReactLine(id, R.type)]], () => smBase(id));
    }
    return smBase(id);
  };
  const slBase = speakerLook;
  speakerLook = function (name) {
    if (name === "Vesper") return { robe: "#3a2a5a", hat: "#1a1030", hair: "#d8d0f0", glow: true };
    if (game.actor && game.actor.look && ENCOUNTERS.some((e) => e.who === name)) return Object.assign({ seed: hashStr(name) % 6 }, game.actor.look);
    return slBase(name);
  };
  const cdBase = crewDrawList;
  crewDrawList = function (list, t) {
    cdBase(list, t);
    const A = game.actor;
    if (!story() || !A || A.z !== player.zone || !(game.dialog || game.mode === "choice")) return;
    list.push({ y: A.y, draw: () => drawSprite(wizardRects(A.look.robe, A.look.hat, A.look.hair, null, A.x < player.x ? "right" : A.x > player.x ? "left" : A.y < player.y ? "down" : "up", 0, 3), A.x * TILE, A.y * TILE, 2, false) });
  };
  // A promessa do sonho pesa na luta final.
  const sbBase = startBattle;
  startBattle = function (type, mob, opts = {}) {
    const r = sbBase(type, mob, opts);
    if (story() && battle && type === "silenciador" && player.flags.dreamPromise) {
      const B = battle;
      B.e.hp = Math.round(B.e.hp * 0.95);
      setTimeout(() => battle === B && battleLog("Vesper lembra da sua promessa. A mão dele treme."), 2600);
    }
    return r;
  };
}
