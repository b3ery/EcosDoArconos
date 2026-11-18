/**
 * ECOS DO ARCANO — taverna-viva.js
 * Mais vida e realismo:
 *  - OBJETOS: dentro de qualquer prédio, os objetos têm ações próprias
 *    (lareira, barril, mesa, livros, forja, forno, espelho, altar, feno...).
 *    Cada lugar tem as suas coisas para fazer, além de falar com as pessoas.
 *  - TAVERNA: cardápio com pratos e bebidas diferentes (e efeitos), dados com
 *    aposta, vinte-e-um, dardos, dançar no salão, cantar no palco ou pedir
 *    música ao bardo, brindar com a mesa e se aquecer na lareira.
 *  - FESTIVAIS: barracas de comidas típicas, tiro ao alvo, argola e o baile.
 *  - CORAÇÕES: o encontro marcado acontece de verdade: você vai até o lugar
 *    (praça ou taverna) e a pessoa está lá esperando.
 * Modifica (envolve) funções de outros arquivos: targetAt, interactAt,
 * crewDrawList, festivalMenu, meetContact.
 */

"use strict";

const needAdd = (k, v) => typeof addNeed === "function" && lifeMode() && addNeed(k, v);
const spend = (g) => (player.gold < g ? (toast(`Precisa de ${g} de ouro.`, 1800), false) : ((player.gold -= g), true));
const passMin = (m) => (player.clock = Math.min(1439, player.clock + m));

/* ===================== MINIJOGO DE TEMPO (aperte no verde) ===================== */
function timingGame(title, icon, steps, desc, onDone) {
  let el = byId("tmg");
  if (!el) {
    el = document.createElement("div");
    el.id = "tmg";
    el.className = "ui";
    byId("screen").appendChild(el);
  }
  game.tmg = { title, icon, steps, desc, onDone, i: 0, score: 0 };
  game.mode = "tmg";
  el.style.display = "flex";
  renderTiming();
}
function renderTiming() {
  const g = game.tmg,
    el = byId("tmg");
  el.innerHTML = `<div class="mg-card"><div class="mg-ic">${iconHTML(g.icon, 44)}</div><h3>${g.title}</h3><p>${g.desc}</p>
    <div class="mg-step">${g.steps[g.i]} · ${g.i + 1}/${g.steps.length}</div><div class="mg-bar"><i class="r"></i><i class="y"></i><i class="g"></i><b id="tmgmark"></b></div>
    <div class="mg-score">Pontos: ${g.score}</div><button id="tmghit" class="go">Agora! (E)</button><button id="tmgquit">Desistir</button></div>`;
  byId("tmghit").onclick = timingHit;
  byId("tmgquit").onclick = () => closeTiming(true);
}
function timingHit() {
  const g = game.tmg;
  if (!g) return;
  const q = hitQuality();
  g.score += q;
  playSound(q === 2 ? 1047 : q ? 784 : 200, 0.08, q ? "sine" : "square");
  toast(q === 2 ? "Perfeito!" : q ? "Bom!" : "Errou...", 600);
  g.i++;
  if (g.i >= g.steps.length) {
    const { score, steps, onDone } = g;
    closeTiming(false);
    onDone(score, steps.length * 2);
  } else renderTiming();
}
function closeTiming(quit) {
  const el = byId("tmg");
  if (el) el.style.display = "none";
  game.tmg = null;
  if (game.mode === "tmg") game.mode = "world";
  if (quit) toast("Você desistiu.", 1200);
}
setInterval(() => {
  const m = byId("tmgmark");
  if (m && game.mode === "tmg") m.style.left = swingPos() * 100 + "%";
}, 30);
KEY_HANDLERS.tmg = (k, e) => {
  if (e && e.repeat) return;
  if (k === "e" || k === " " || k === "enter") timingHit();
  else if (k === "escape") closeTiming(true);
};
if (typeof BEFORE_DIALOG !== "undefined") BEFORE_DIALOG.add("tmg");
{
  const st = document.createElement("style");
  st.textContent = `#tmg{position:absolute;inset:0;display:none;align-items:center;justify-content:center;z-index:30;background:rgba(10,6,18,.6)}`;
  document.head.appendChild(st);
}

/* ===================== CARDÁPIO DA TAVERNA ===================== */
const TAVERN_MENU = [
  { n: "Ensopado de javali", p: 12, food: 45, fun: 6, txt: "Grosso, quente e com cheiro de alecrim. O Gus jura que o javali era bravo." },
  { n: "Torta de carne e cogumelos", p: 10, food: 38, fun: 4, txt: "A massa estala, o recheio derrete." },
  { n: "Sopa de abóbora com pão", p: 6, food: 28, water: 8, txt: "Simples e quentinha, como um abraço." },
  { n: "Peixe frito do Porto", p: 9, food: 32, fun: 3, txt: "Crocante por fora, com limão espremido na hora." },
  { n: "Costela assada no mel", p: 15, food: 50, fun: 10, txt: "Você suja as mãos até o cotovelo e não se arrepende." },
  { n: "Queijo com uvas", p: 7, food: 20, fun: 5, txt: "Petisco de quem quer conversar mais do que comer." },
  { n: "Bolinho de chuva", p: 4, food: 12, fun: 8, txt: "Com açúcar e canela. Vem uma porção generosa." },
  { n: "Caneca de cerveja escura", p: 5, water: 15, fun: 12, drunk: 18, txt: "Espuma até a borda. A mesa do lado canta." },
  { n: "Hidromel da casa", p: 8, water: 12, fun: 16, drunk: 25, txt: "Doce e traiçoeiro. O Lucas sempre pede dois." },
  { n: "Vinho tinto de Marés", p: 10, water: 10, fun: 14, drunk: 22, txt: "Encorpado. Dizem que vem da adega do palácio." },
  { n: "Chá de ervas da serra", p: 3, water: 25, energy: 6, txt: "Acalma o estômago e a cabeça." },
  { n: "Suco de maçã gelado", p: 3, water: 30, fun: 3, txt: "Para quem vai trabalhar amanhã cedo." },
];
function tavernCardapio() {
  choice(
    "Cardápio da taverna",
    "O Gus te entrega uma tábua de madeira com o cardápio escrito a giz.",
    TAVERN_MENU.map((m) => ({
      t: `${m.n} · ${m.p} ouro`,
      icon: m.drunk ? "mug" : m.food ? "stew" : "tea",
      fn: () => {
        if (!spend(m.p)) return;
        if (m.food) {
          if (lifeMode()) needAdd("food", m.food);
          else player.food = Math.min(100, (player.food ?? 100) + m.food);
        }
        if (m.water) {
          if (lifeMode()) needAdd("water", m.water);
          else player.water = Math.min(100, (player.water ?? 100) + m.water);
        }
        if (m.fun) needAdd("fun", m.fun);
        if (m.energy) needAdd("energy", m.energy);
        if (m.drunk) player.drunk = Math.min(100, (player.drunk || 0) + m.drunk);
        passMin(20);
        saveGame();
        say([["", m.txt + (m.drunk && (player.drunk || 0) > 60 ? " ...O chão começa a balançar um pouquinho." : "")]]);
      },
    })).concat([{ t: "Voltar", fn: null }]),
  );
}

/* ===================== JOGOS DE MESA ===================== */
const DIE = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];
function diceGame() {
  choice("Dados na mesa do canto", "Um anão de barba trançada sacode o copo: \"Quem tirar mais com dois dados leva tudo.\"", [
    ...[5, 10, 25].map((v) => ({
      t: `Apostar ${v} ouro`,
      icon: "coin",
      fn: () => {
        if (!spend(v)) return;
        const r = () => 1 + Math.floor(Math.random() * 6);
        const a = [r(), r()],
          b = [r(), r()];
        const me = a[0] + a[1],
          him = b[0] + b[1];
        playSound(300, 0.1, "square");
        const res = me > him ? "win" : me === him ? "tie" : "lose";
        if (res === "win") player.gold += v * 2;
        if (res === "tie") player.gold += v;
        needAdd("fun", 8);
        passMin(10);
        saveGame();
        say([["", `Você joga: ${DIE[a[0] - 1]} ${DIE[a[1] - 1]} = ${me}. O anão joga: ${DIE[b[0] - 1]} ${DIE[b[1] - 1]} = ${him}.`], ["Anão Brom", res === "win" ? "Sorte de principiante! Pega, pega o ouro." : res === "tie" ? "Empate! Cada um pega o seu de volta." : "Hah! O ouro é meu. Mais uma?"]], diceGame);
      },
    })),
    { t: "Sair da mesa", fn: null },
  ]);
}
function blackjack(bet) {
  if (bet == null)
    return choice("Vinte-e-um", "A cartomante Zuleica embaralha: \"Chegue perto de 21 sem passar. Eu jogo pela casa.\"", [...[5, 10, 25].map((v) => ({ t: `Apostar ${v} ouro`, icon: "coin", fn: () => spend(v) && blackjack(v) })), { t: "Sair", fn: null }]);
  const card = () => Math.min(10, 1 + Math.floor(Math.random() * 13));
  const hand = [card(), card()];
  const sum = (h) => {
    let s = h.reduce((a, b) => a + b, 0);
    if (h.includes(1) && s + 10 <= 21) s += 10;
    return s;
  };
  const end = () => {
    const me = sum(hand);
    const house = [card(), card()];
    while (sum(house) < 17) house.push(card());
    const hs = sum(house);
    let res;
    if (me > 21) res = "lose";
    else if (hs > 21 || me > hs) res = "win";
    else if (me === hs) res = "tie";
    else res = "lose";
    if (res === "win") player.gold += bet * 2;
    if (res === "tie") player.gold += bet;
    needAdd("fun", 10);
    passMin(15);
    saveGame();
    say([["", `Você: ${hand.join(" + ")} = ${me}. A casa: ${house.join(" + ")} = ${hs}.`], ["Madame Zuleica", res === "win" ? "As cartas gostam de você hoje." : res === "tie" ? "Empate. O destino está indeciso." : me > 21 ? "Passou de 21! As cartas avisaram." : "A casa sempre ganha. Quase sempre."]], () => blackjack());
  };
  const turn = () => {
    const s = sum(hand);
    if (s > 21) return end();
    choice("Vinte-e-um", `Suas cartas: <b>${hand.join(" + ")}</b> = <b>${s}</b>. Aposta: ${bet} ouro.`, [
      { t: "Mais uma carta", icon: "plus", fn: () => (hand.push(card()), turn()) },
      { t: "Parar", icon: "eye", fn: end },
    ]);
  };
  turn();
}
function dartsGame() {
  if (!spend(3)) return;
  timingGame("Dardos", "bolt", ["Primeiro dardo", "Segundo dardo", "Terceiro dardo"], "Aperte quando o marcador estiver no verde. Centro do alvo vale mais!", (s, max) => {
    const prize = s >= max ? 20 : s >= max - 2 ? 10 : s >= 3 ? 4 : 0;
    player.gold += prize;
    needAdd("fun", 10);
    passMin(10);
    saveGame();
    say([["", s >= max ? "Três na mosca! A taverna inteira grita seu nome." : s >= 3 ? "Bons arremessos! Um senhor te paga um aplauso." : "Um dardo acertou a parede. Outro, o chapéu do Gus."], ["", prize ? `Prêmio: ${prize} ouro.` : "Sem prêmio desta vez."]]);
  });
}
function danceGame(where) {
  timingGame(where === "baile" ? "Baile da festa" : "Dança no salão", "note", ["Passo à direita", "Passo à esquerda", "Giro", "Palma", "Pulo", "Pose final"], "Siga o ritmo do alaúde! Aperte no verde a cada batida.", (s, max) => {
    needAdd("fun", 10 + s * 2);
    passMin(20);
    const good = s >= max * 0.6;
    let partner = null;
    if (good && Math.random() < 0.6) {
      const pool = Object.keys(NPCS).filter((id) => typeof named === "function" && named(id) && FRIENDS[id] && !(typeof CREW_ALL !== "undefined" && CREW_ALL.includes(id)));
      partner = pool.length ? pk(pool) : null;
      if (partner) addFriendship(partner, 6);
    }
    saveGame();
    say([["", good ? "Você dança como se ninguém estivesse olhando. Todos estão, e todos aplaudem." : "Você pisa no pé de três pessoas. Mas ri, e a festa ri junto."], ...(partner ? [[shortName(partner), "Dança comigo a próxima? Você leva jeito!"]] : [])]);
  });
}
function stageGame() {
  timingGame("Cantar no palco", "note", ["Primeira estrofe", "Refrão", "Nota alta", "Final"], "O bardo empresta o alaúde. Acerte as notas!", (s, max) => {
    const great = s >= max - 1,
      ok = s >= max / 2;
    if (great) ((player.gold += 15), typeof repAdd === "function" && repAdd(2));
    else if (ok) player.gold += 5;
    needAdd("fun", 15);
    passMin(15);
    saveGame();
    say([["", great ? "A taverna inteira canta o refrão com você! Chovem moedas no palco: +15 ouro." : ok ? "Uns aplausos, umas risadas. Duas moedas e um pão voam no palco: +5 ouro." : "Alguém joga um tomate. Outro joga outro tomate. Você faz uma reverência mesmo assim."]]);
  });
}

/* ===================== OBJETOS EM TODO LUGAR ===================== */
const PROP_LABEL = {
  fire: "Aquecer-se na lareira",
  barrel: "Barril",
  table: "Sentar à mesa",
  chair: "Sentar",
  books: "Ler um livro",
  manneq: "Ver a roupa do manequim",
  rug: "Tapete bordado",
  pew: "Sentar e rezar",
  display: "Olhar a vitrine",
  shelfP: "Ver a prateleira",
  bed: "Deitar um pouco",
  armor: "Experimentar a armadura",
  mirror: "Olhar no espelho",
  crystal: "Tocar o cristal",
  weapons: "Admirar as armas",
  hay: "Pular no feno",
  bread: "Sentir o cheiro do pão",
  oven: "Ajudar no forno",
  horse: "Fazer carinho no cavalo",
  candle: "Acender uma vela",
  bench: "Sentar no banco",
  barber: "Cadeira do barbeiro",
  altar: "Rezar no altar",
  maptable: "Estudar o mapa",
  forge: "Ajudar na forja",
  bard: "O bardo",
  anvil: "Bater na bigorna",
  board: "Ler o quadro de avisos",
  crate: "Vasculhar o caixote",
};
function propAt(x, y) {
  if (player.zone !== "interior" || !game.inter || !game.inter.props) return null;
  const p = game.inter.props.find((q) => q[1] === x && q[2] === y);
  return p && PROP_LABEL[p[0]] ? p[0] : null;
}
const isTavern = () => game.inter && game.inter.st === "taverna";
function propLabel(type) {
  if (isTavern()) {
    if (type === "barrel") return "Servir um chope (3 ouro)";
    if (type === "table") return "Mesa da taverna";
    if (type === "rug") return "Dançar no salão";
  }
  return PROP_LABEL[type];
}
function propAct(type) {
  const T = isTavern();
  const once = (k, n) => {
    const kk = "prop" + k;
    if (player.famDay[kk] === player.day) return false;
    player.famDay[kk] = player.day;
    return true;
  };
  switch (type) {
    case "fire":
      passMin(20);
      needAdd("energy", 8);
      needAdd("fun", 4);
      if (player.sick === "gripe" && Math.random() < 0.4) player.sick = null;
      return say([["", pk(["Você estica as mãos perto do fogo. A lenha estala e o frio vai embora.", "Alguém do lado conta uma história de assombração. O fogo deixa tudo mais assustador.", "Você quase cochila olhando as brasas."])]]);
    case "barrel":
      if (T) {
        if (!spend(3)) return;
        player.drunk = Math.min(100, (player.drunk || 0) + 15);
        needAdd("fun", 8);
        needAdd("water", 10);
        return say([["", "Você abre a torneirinha do barril. Espuma por todo lado, e o Gus finge que não viu."]]);
      }
      return say([["", "O barril está cheio de... algo. Melhor não mexer."]]);
    case "table":
      if (T)
        return choice("Mesa da taverna", "Os bancos rangem, as canecas batem. O que você faz?", [
          { t: "Pedir do cardápio", icon: "stew", fn: tavernCardapio },
          { t: "Jogar dados (aposta)", icon: "coin", fn: diceGame },
          { t: "Vinte-e-um (cartas)", icon: "book", fn: () => blackjack() },
          { t: "Dardos (3 ouro)", icon: "bolt", fn: dartsGame },
          { t: "Brindar com a mesa", icon: "mug", fn: toastTable },
          { t: "Levantar", fn: null },
        ]);
      passMin(10);
      needAdd("energy", 4);
      return toast("Você senta um pouco e descansa as pernas.", 1800);
    case "chair":
    case "bench":
      passMin(10);
      needAdd("energy", 4);
      return toast(T ? "Você senta e ouve as conversas das mesas do lado." : "Você senta e descansa um pouco.", 2000);
    case "books":
      passMin(30);
      needAdd("fun", 10);
      if (!lifeMode()) player.xp = (player.xp || 0) + 5;
      return say([["", pk(["Um livro sobre os anões de Pedravale. Tem desenhos de picaretas em todas as páginas.", "Um romance proibido entre uma sereia e um pescador. Você não consegue parar.", "Um livro de receitas de poções. Metade das páginas está queimada.", "Um diário antigo com a letra tremida. Fala de seis luzes no céu."])]]);
    case "manneq":
    case "mirror":
    case "barber":
      return typeof showCreate === "function" ? showCreate("wardrobe") : null;
    case "rug":
      return T ? danceGame("salao") : toast("Um tapete bonito. Bordado à mão.", 1600);
    case "pew":
    case "altar":
      passMin(15);
      needAdd("fun", 5);
      return say([["", pk(["Você reza em silêncio. Por um momento, tudo fica em paz.", "Você agradece pelo dia. Até pelas partes difíceis.", "Uma vela tremula sozinha. Coincidência, claro."])]]);
    case "display":
    case "shelfP":
      return typeof bldService === "function" ? bldService(game.inter.b) : null;
    case "bed":
      passMin(30);
      needAdd("energy", 15);
      return toast("Você deita um pouquinho. Ninguém reclama. Ainda.", 2200);
    case "armor":
      needAdd("fun", 6);
      return say([["", "Você veste o elmo. É pesado, aperta o nariz e você não enxerga nada. Mas fica imponente."]]);
    case "crystal":
      if (!lifeMode()) player.mp = Math.min(maxMp(), player.mp + 10);
      return say([["", "O cristal vibra com o seu toque e solta um som baixinho, como um sino distante."]]);
    case "weapons":
      return say([["", "Espadas, lanças, um machado com nome gravado: \"Sossego\". Ironia de anão."]]);
    case "hay":
      needAdd("fun", 10);
      needAdd("hygiene", -10);
      return say([["", "Você pula no feno! Sai cheio de palha no cabelo e rindo sozinho."]]);
    case "bread":
      if (!once("pao")) return toast("O padeiro já te deu um pão hoje.", 1600);
      if (typeof addItem === "function") addItem("pao", 1);
      return say([["", "O cheiro de pão quente é tão bom que o padeiro te dá um, de presente."]]);
    case "oven":
    case "forge":
    case "anvil":
      if (!once(type)) return toast("Você já ajudou aqui hoje.", 1600);
      passMin(30);
      needAdd("energy", -10);
      player.gold += 6;
      return say([["", type === "oven" ? "Você ajuda a tirar as fornadas. Queima um dedo, ganha 6 de ouro." : "Você martela o ferro quente no ritmo do mestre. Suado, ganha 6 de ouro."]]);
    case "horse":
      needAdd("fun", 5);
      return toast("O cavalo encosta a cabeça no seu ombro.", 1800);
    case "candle":
      return toast("Você acende uma vela e faz um pedido.", 1800);
    case "maptable":
      if (typeof revealZone === "function") revealZone();
      return say([["", "Você estuda o mapa da região. Agora sabe uns atalhos que não sabia."]]);
    case "bard":
      if (!T) return toast("O bardo afina o alaúde.", 1600);
      return choice("O bardo", "\"Uma moeda e eu toco o que você quiser. Ou sobe aqui e canta você!\"", [
        { t: "Pedir uma música animada (2 ouro)", icon: "note", fn: () => spend(2) && (needAdd("fun", 12), say([["Bardo", "♪ Ei, Cinzaluz, bate o pé no chão! ♪"], ["", "A taverna inteira bate o pé no ritmo."]])) },
        { t: "Pedir uma música triste (2 ouro)", icon: "note", fn: () => spend(2) && (needAdd("fun", 6), say([["Bardo", "♪ Seis luzes no céu, uma voz que calou... ♪"], ["", "Até o Gus enxuga uma lágrima com o pano de prato."]])) },
        { t: "Subir no palco e cantar", icon: "star", fn: stageGame },
        { t: "Voltar", fn: null },
      ]);
    case "board":
      return typeof heartBoardMenu === "function" ? heartBoardMenu() : null;
    case "crate":
      if (Math.random() < 0.3) {
        if (typeof repAdd === "function") repAdd(-2);
        return say([["", "O dono te pega com a mão no caixote!"], ["", "\"Ei! Isso aí não é seu!\" (reputação -2)"]]);
      }
      return toast(pk(["Só tem palha e uns pregos.", "Você acha uma moeda esquecida: +1 ouro."]), 1800);
  }
}
function toastTable() {
  passMin(10);
  needAdd("fun", 10);
  const names = (game.inter.people || []).map((p) => p.nm).filter(Boolean);
  const who = names.length ? pk(names) : "a mesa";
  say([["", `Você ergue a caneca: "À Cinzaluz!"`], [who, pk(["À Cinzaluz! E ao próximo que pagar a rodada!", "Saúde! E que a Rainha não aumente o imposto!", "Saúde, amig" + genderWord("o", "a", "e") + "! Senta aqui com a gente."])]]);
}
(() => {
  const tgBase = targetAt;
  targetAt = function (x, y) {
    const p = propAt(x, y);
    return p ? propLabel(p) : tgBase(x, y);
  };
  const iaBase = interactAt;
  interactAt = function (x, y) {
    const p = propAt(x, y);
    if (p && !(typeof interPersonAt === "function" && interPersonAt(x, y))) return propAct(p);
    return iaBase(x, y);
  };
})();

/* ===================== FESTIVAIS MAIS FORTES ===================== */
const FEST_FOOD = [
  ["Espetinho de castanha na brasa", 3, 15],
  ["Maçã do amor", 3, 10],
  ["Pastel de feira", 4, 20],
  ["Algodão-doce de flor", 2, 6],
  ["Caldo de feijão da Dona Bia", 5, 25],
];
{
  const fmBase = festivalMenu;
  festivalMenu = function () {
    fmBase.apply(this, arguments);
    if (game.mode !== "choice") return;
    const opts = game.choice;
    const night = currentHour() >= 18;
    const extra = [
      {
        t: "Barracas de comida",
        icon: "pie",
        fn: () =>
          choice(
            "Barracas da festa",
            "Fumaça, cheiro de doce e gente por todo lado.",
            FEST_FOOD.map(([n, p, f]) => ({ t: `${n} · ${p} ouro`, icon: "pie", fn: () => spend(p) && (lifeMode() ? needAdd("food", f) : (player.food = Math.min(100, (player.food ?? 100) + f)), needAdd("fun", 4), say([["", pk([`${n}! Do jeitinho que lembra a infância.`, `Você come ${n.toLowerCase()} andando entre as barracas.`])]])) })).concat([{ t: "Voltar", fn: null }]),
          ),
      },
      { t: "Tiro ao alvo (3 ouro)", icon: "bolt", fn: dartsGame },
      {
        t: "Jogo da argola (2 ouro)",
        icon: "ring",
        fn: () =>
          spend(2) &&
          timingGame("Jogo da argola", "ring", ["Primeira argola", "Segunda argola", "Terceira argola"], "Jogue a argola no gargalo da garrafa!", (s, max) => {
            const win = s >= max - 1;
            if (win && typeof addItem === "function") addItem(pk(["brinquedo", "flor", "doce"]), 1);
            needAdd("fun", 8);
            say([["Feirante", win ? "Acertou! Escolhe um prêmio da prateleira!" : "Quase! Mais uma rodada?"]]);
          }),
      },
      ...(night ? [{ t: "Baile da noite", icon: "note", fn: () => danceGame("baile") }] : []),
    ];
    opts.splice(opts.length - 1, 0, ...extra);
    choice("Festival", "Escolha o que fazer na festa:", opts);
  };
}

/* ===================== CORAÇÕES: O ENCONTRO NO LUGAR ===================== */
const DATE_SPOTS = [
  { n: "na fonte da praça", spot: [29, 23], me: [30, 23] },
  { n: "no banco da praça", spot: [26, 22], me: [27, 22] },
  { n: "perto do mercado", spot: [37, 20], me: [38, 20] },
];
function startDate(id) {
  const c = (player.contacts || []).find((q) => q.id === id);
  if (!c || !NPCS[id]) return;
  const S = pk(DATE_SPOTS);
  const free = (p) => (walkable("vila", p[0], p[1]) ? p : (typeof freeNear === "function" && freeNear("vila", p[0], p[1], 3)) || p);
  const spot = free(S.spot);
  let me = free(S.me);
  if (me[0] === spot[0] && me[1] === spot[1]) me = [spot[0] + 1, spot[1]];
  game.date = { id, x: spot[0], y: spot[1], until: player.day * 1440 + player.clock + 180, n: S.n };
  player.zone = "vila";
  [player.x, player.y] = me;
  player.rx = player.x;
  player.ry = player.y;
  player.dir = me[0] > spot[0] ? "left" : "right";
  game.fade = 1;
  enterZone(false);
  saveGame();
  setTimeout(() => toast(`${c.nm} está te esperando ${S.n}. Vá falar com ${gw(id, "ele", "ela")}!`, 4200), 600);
}
function dateMenu() {
  const d = game.date,
    id = d.id,
    n = shortName(id);
  choice(`Encontro com ${n}`, `${n} sorri quando você chega ${d.n}.`, [
    { t: "Conversar sobre a vida", icon: "chat", fn: () => (addFriendship(id, 4), passMin(20), say([[n, pk(CONTACT_LINES[PERSONALITIES[id]] || CONTACT_LINES.gentil)], ["", "A conversa flui. Vocês riem das mesmas coisas."]], dateMenu)) },
    { t: "Passear juntos pela vila", icon: "boots", fn: () => (addFriendship(id, 5), passMin(30), needAdd("fun", 10), say([["", pk(["Vocês andam devagar até o mercado. Ninguém tem pressa.", "Vocês sentam na beira da fonte e contam as estrelas que aparecem.", "Um bardo toca na esquina e vocês param para ouvir."])]], dateMenu)) },
    { t: "Pagar um lanche (6 ouro)", icon: "pie", fn: () => spend(6) && (addFriendship(id, 6), needAdd("food", 15), say([[n, "Você pagou? Que fofo. Da próxima é por minha conta!"]], dateMenu)) },
    { t: "Mais opções (presente, romance...)", icon: "heart", fn: () => socialMenu(id) },
    { t: "Terminar o encontro", icon: "door", fn: () => (say([[n, pk(["Gostei muito. Vamos repetir?", "Foi ótimo. Me manda um bilhete de novo, tá?", "Até a próxima!"])]]), (game.date = null)) },
  ]);
}
if (typeof meetContact === "function") meetContact = function (id) {
  if (typeof closeHearts === "function") closeHearts();
  startDate(id);
};
(() => {
  const tgBase = targetAt;
  targetAt = function (x, y) {
    const d = game.date;
    if (d && player.zone === "vila" && d.x === x && d.y === y) return `Encontro com ${shortName(d.id)}`;
    return tgBase(x, y);
  };
  const iaBase = interactAt;
  interactAt = function (x, y) {
    const d = game.date;
    if (d && player.zone === "vila" && d.x === x && d.y === y) return dateMenu();
    return iaBase(x, y);
  };
  const wkBase = walkable;
  walkable = function (z, x, y) {
    const d = game.date;
    if (d && z === "vila" && d.x === x && d.y === y) return false;
    return wkBase(z, x, y);
  };
  const cdBase = crewDrawList;
  crewDrawList = function (list, t) {
    cdBase(list, t);
    const d = game.date;
    if (!d) return;
    if (player.day * 1440 + player.clock > d.until || !NPCS[d.id]) return void (game.date = null);
    if (player.zone !== "vila") return;
    const N = NPCS[d.id];
    list.push({
      y: d.y,
      draw: () => {
        const X = d.x * TILE,
          Y = d.y * TILE;
        ctx.fillStyle = "rgba(0,0,0,.25)";
        ctx.beginPath();
        ctx.ellipse(X + 16, Y + 30, 9, 3, 0, 0, 7);
        ctx.fill();
        drawSprite(wizardRects(N.robe, N.hat ?? null, N.hair, null, player.x < d.x ? "left" : "right", 0), X, Y + Math.sin(t * 2) * 0.8, 2, player.x < d.x);
        // coraçãozinho em cima
        ctx.fillStyle = "#ff5a8a";
        const hy = Y - 10 + Math.sin(t * 3) * 2;
        ctx.fillRect(X + 12, hy, 3, 3);
        ctx.fillRect(X + 17, hy, 3, 3);
        ctx.fillRect(X + 11, hy + 2, 10, 3);
        ctx.fillRect(X + 13, hy + 5, 6, 2);
        ctx.fillRect(X + 15, hy + 7, 2, 1);
      },
    });
  };
})();
