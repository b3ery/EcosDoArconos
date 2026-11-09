/**
 * ECOS DO ARCANO — vida-na-vila.js
 * Simulador de Vida mais cheio de vida:
 *  - Móveis novos (banheira, mesa de jogos, fogão a lenha) e todos os móveis úteis.
 *  - Muitas interações com os moradores (piada, conselho, fofoca, empréstimo,
 *    discussão, desculpas, terminar namoro, divórcio...).
 *  - Acontecimentos do dia na vila.
 */

"use strict";

/* ===================== MÓVEIS NOVOS ===================== */

Object.assign(ITEMS, {
  m_banheira: { nome: "Banheira de Madeira", tipo: "movel", preco: 180, desc: "Móvel. Tomar banho em casa (higiene cheia)." },
  m_jogos: { nome: "Mesa de Xadrez", tipo: "movel", preco: 150, desc: "Móvel. Jogar sozinho ou com a família (+diversão)." },
  m_fogao: { nome: "Fogão a Lenha", tipo: "movel", preco: 240, desc: "Móvel. Cozinhar: carne + água vira Ensopado Quente." },
});
SHOPS.moveis.items.push("m_banheira", "m_jogos", "m_fogao");

/** Desenho dos móveis novos. Retorna true se desenhou. */
function drawFurnExtra(f, t) {
  const X = f.x * TILE,
    Y = f.y * TILE;
  const c = (col, a, b, w, h) => {
    ctx.fillStyle = col;
    ctx.fillRect(X + a, Y + b, w, h);
  };
  const sh = () => c("rgba(0,0,0,.22)", 3, 27, 26, 4);
  switch (f.id) {
    case "m_banheira":
      sh();
      c("#8a5a2e", 2, 12, 28, 14);
      c("#a8784a", 2, 10, 28, 4);
      c("#4fb8ff", 5, 13, 22, 6);
      c("#cfeaff", 8 + Math.sin(t * 2) * 2, 14, 6, 2);
      c("#6b4423", 4, 26, 3, 4);
      c("#6b4423", 25, 26, 3, 4);
      return true;
    case "m_jogos":
      sh();
      c("#6b4423", 4, 18, 3, 10);
      c("#6b4423", 25, 18, 3, 10);
      c("#8a5a2e", 2, 10, 28, 10);
      for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) c((i + j) % 2 ? "#f2eee4" : "#2a1d14", 6 + i * 5, 11 + j * 4, 5, 4);
      c("#f2c14e", 9, 6, 3, 5);
      c("#2a1d14", 20, 6, 3, 5);
      return true;
    case "m_fogao":
      sh();
      c("#3a3a44", 2, 4, 28, 24);
      c("#5a5a6a", 2, 4, 28, 3);
      c("#1a1a22", 7, 14, 18, 10);
      c(`rgb(255,${130 + Math.floor(Math.sin(t * 8) * 40)},40)`, 10, 18, 12, 5);
      c("#7a7a8a", 22, -6, 5, 10);
      return true;
  }
  return false;
}

/** Uso dos móveis. Retorna true se tratou. */
function furnUseExtra(f) {
  const id = f.id;
  const once = (k) => {
    if (player.famDay["furn" + k] === player.day) return false;
    player.famDay["furn" + k] = player.day;
    return true;
  };
  if (id === "m_banheira") {
    player.hygiene = 100;
    addNeed("fun", 6);
    player.clock = Math.min(1439, player.clock + 30);
    saveGame();
    say([["", "Banho quente de banheira, com sabão de ervas. Higiene cheia!"]]);
    return true;
  }
  if (id === "m_jogos") {
    const partner = player.spouse && NPCS[player.spouse] ? NPCS[player.spouse].nome.split(",")[0] : null;
    addNeed("fun", partner ? 30 : 18);
    if (partner) addFriendship(player.spouse, once("xadrez") ? 3 : 0);
    player.clock = Math.min(1439, player.clock + 60);
    saveGame();
    say([
      [
        "",
        partner
          ? `Você e ${partner} jogam uma partida de xadrez. ${Math.random() < 0.5 ? "Você ganhou!" : `${partner} ganhou e não para de se gabar.`}`
          : "Você joga xadrez contra si mesmo. Empate, como sempre.",
      ],
    ]);
    return true;
  }
  if (id === "m_fogao") {
    if (!itemCount("carne") || !itemCount("agua"))
      return say([["", "Para cozinhar um ensopado: 1 Carne Assada + 1 Cantil de Água. Compre no açougue e no mercado."]]), true;
    removeItem("carne");
    removeItem("agua");
    addItem("ensopado", 2);
    addNeed("fun", 5);
    player.clock = Math.min(1439, player.clock + 60);
    saveGame();
    say([["", "Você cozinha um ensopado cheiroso no fogão a lenha. +2 Ensopados Quentes!"]]);
    return true;
  }
  if (id === "mesa" || id === "m_mesa") {
    const food = ["ensopado", "torta", "assado", "carne", "peixe", "pao", "queijo", "maca"].find((k) => itemCount(k));
    if (!food) return say([["", "A mesa está vazia. Cozinhe, asse pão ou compre comida para comer em casa."]]), true;
    useItemEffect(food);
    const family = (player.spouse ? 1 : 0) + (player.kids || []).filter((k) => !k.movedOut).length;
    addNeed("fun", 6 + family * 4);
    if (player.spouse) addFriendship(player.spouse, once("jantar") ? 2 : 0);
    saveGame();
    say([["", family ? `Refeição em família! Todo mundo conta como foi o dia. (${ITEMS[food].nome})` : `Você come ${ITEMS[food].nome} em silêncio, olhando pela janela.`]]);
    return true;
  }
  if (!lifeMode()) return false;
  // No Simulador, os móveis "de enfeite" também ajudam.
  if (id === "m_aquario" || id === "m_harpa" || id === "m_quadro") {
    addNeed("fun", id === "m_harpa" ? 15 : 8);
    return false;
  }
  if (id === "m_estante") {
    addNeed("fun", 10);
    return false;
  }
  return false;
}

/* ===================== INTERAÇÕES COM MORADORES ===================== */

const LIFE_JOKES = [
  "Por que o anão não joga xadrez? Porque não alcança a rainha!",
  "O que o mago disse para a poção? Você me deixa sem palavras... e sem mana.",
  "Sabe por que o Ent nunca mente? Porque ele tem raízes muito profundas.",
  "Fui pescar e peguei um resfriado. O peixe fugiu.",
];
const LIFE_ADVICE = [
  "Nunca compre uma casa em dia de festival: o corretor está bêbado e você também.",
  "Durma bem. Gente cansada briga à toa e trabalha mal.",
  "Guarde ouro para o Coletor Real. Ele sempre volta.",
  "Se for pedir alguém em casamento, tome banho antes. Sério.",
  "Amigos valem mais que ouro. Mas ouro paga o aluguel.",
];
/** Terminar namoro e divórcio (aparecem no menu da pessoa). */
function relationEndItems(id) {
  const n = NPCS[id].nome.split(",")[0];
  const opts = [];
  if (player.dating === id)
    opts.push({
      t: "Terminar o namoro",
      fn: () => {
        player.dating = null;
        player.openRel = null;
        addFriendship(id, -30);
        addNeed("fun", -20);
        saveGame();
        say([[n, "...Então é isso. Tudo bem. Espero que você seja feliz."]]);
      },
    });
  if (player.spouse === id && id !== "rainha")
    opts.push({
      t: "Pedir o divórcio",
      fn: () =>
        choice("Divórcio", `Tem certeza? ${n} sai de casa e fica com metade do seu ouro. Os filhos ficam com você.`, [
          {
            t: "Sim, quero o divórcio",
            fn: () => {
              const half = Math.floor(player.gold / 2);
              player.gold -= half;
              player.spouse = null;
              player.openRel = null;
              addFriendship(id, -40);
              repAdd(-4);
              addNeed("fun", -30);
              saveGame();
              say([
                [n, "Eu levo meus móveis e metade do ouro. Os filhos... cuide bem deles."],
                ["", `Divórcio assinado no Templo. ${n} saiu de casa e levou ${half} de ouro.`],
              ]);
            },
          },
          { t: "Não, pensando bem...", fn: null },
        ]),
    });
  return opts;
}

/* ===================== ACONTECIMENTOS DO DIA ===================== */

const VILLAGE_EVENTS = [
  { t: "Casamento na praça! Dois moradores se casaram e a vila inteira comemorou.", fun: 10 },
  { t: "Artistas de rua chegaram à praça: malabaristas e um urso que dança.", fun: 12 },
  { t: "Mercado de pulgas hoje: tudo mais barato nas bancas da praça.", gold: 15 },
  { t: "Briga de vizinhos por causa de uma galinha. A Guarda precisou intervir.", rep: 0 },
  { t: "Nasceu um bebê na casa do moleiro. Todo mundo foi visitar.", fun: 6 },
  { t: "Um mercador do Oriente passou pela vila vendendo especiarias.", fun: 4 },
  { t: "Incêndio no celeiro! Os moradores fizeram uma corrente de baldes.", rep: 1 },
  { t: "Procissão do Templo pelas ruas, com velas e cânticos.", fun: 5 },
  { t: "Um bardo viajante cantou na taverna até de madrugada.", fun: 10 },
  { t: "Ladrões assaltaram a feira à noite. A Guarda Real está atrás deles.", gold: -10 },
];
function villageEventOfDay() {
  if (!lifeMode() || Math.random() > 0.7) return;
  const e = VILLAGE_EVENTS[Math.floor(Math.random() * VILLAGE_EVENTS.length)];
  if (e.fun) addNeed("fun", e.fun);
  if (e.gold) player.gold = Math.max(0, player.gold + e.gold);
  if (e.rep) repAdd(e.rep);
  player.lastEvent = e.t;
  setTimeout(() => toast("Na vila hoje: " + e.t, 5200), 6400);
}
