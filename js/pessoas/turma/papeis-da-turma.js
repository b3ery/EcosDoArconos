/**
 * ECOS DO ARCANO — papeis-da-turma.js
 * Cada pessoa da turma ganha o seu papel na vila:
 *  - Andressa: faz a Exposição dos Poemas do marido (Pedro Poeta) na
 *    biblioteca, a cada 3 dias à noite, e ajuda a Rainha nos eventos (festivais).
 *  - Princesa Julia: cuida dos bichos de rua e tem um Aviário. Dá para visitar
 *    as aves, alimentar os bichos com ela e adotar um.
 *  - Mylena: organiza as Noites de Arte do Ateliê (a cada 4 dias): exposição,
 *    retrato ao vivo, quadro à venda.
 *  - General Marcos: anuncia as sentenças de morte e comanda a forca. A cada
 *    5 dias, no Simulador, um condenado é enforcado ao meio-dia na praça.
 *    Quando a sentença é sua, é ele quem anuncia.
 * Modifica (envolve) funções de outros arquivos: crewItems, execution, onNewDay, update.
 */

"use strict";

const sarauDay = () => player.day % 3 === 1;
const arteDay = () => player.day % 4 === 2;
const forcaDay = () => player.day % 5 === 3;
const POEMS = [
  ["Cinzaluz ao Entardecer", "A torre dorme, o sino cala,\na praça inteira vira sala;\ne a Andressa, de óculo e chá,\nsabe o segredo que ninguém dirá."],
  ["Soneto (quase) do Pão", "Da padaria vem o cheiro,\nque acorda a vila por inteiro.\nRimar pão é fácil, eu sei,\ndifícil é pagar o que comprei."],
  ["Para a Bibliotecária", "Nos teus livros cabe o mundo,\nno teu silêncio, o mar profundo.\nTrês reinos leem o que escreves,\neu só leio os teus olhares breves."],
  ["Ode ao Marzoca", "Ó Lucas da taverna eterna,\nque dança e canta e quebra a perna,\nse um dia a vila acordar calada,\né que o Marzoca dormiu de madrugada."],
  ["A Runa Perdida", "Seis luzes no céu de Arcanum,\ncinco voltaram, falta um.\nNão é runa, não é magia:\né o verso que eu perdi um dia."],
];
const CRIMES = ["roubar o tesouro do templo", "envenenar o poço da vila", "assassinar um mercador na estrada", "incendiar o celeiro do Duque", "traição contra a Coroa", "atacar a guarda do castelo"];

/* ===================== FALAS NOVAS ===================== */
{
  const extra = {
    andressa: ["Hoje à noite tem a exposição dos poemas do Pedro na biblioteca. Vai ter chá. E segredos.", "A Rainha me pediu para organizar o próximo festival. Eu organizo tudo. Inclusive o que ela não sabe.", "Leio os poemas do Pedro antes de todo mundo. Uns eu emolduro. Outros eu escondo."],
    gabriel: ["A Andressa vai expor meus poemas! Eu vou ficar escondido atrás de uma estante.", "Escrevi um poema novo para a exposição. Rima 'saudade' com 'novidade'. Ousado, eu sei."],
    julia: ["Hoje achei três gatinhos atrás do mercado. Já estão no Aviário, junto com as corujas. Não conta pro Marcos.", "Meu Aviário tem corujas, pardais, um papagaio que fala palavrão e uma pomba muito julgadora.", "Bicho de rua não é bicho sem dono. É bicho com a vila inteira de dona."],
    mylena: ["Noite de Arte no Ateliê! Tem quadro, tem música e tem eu, coberta de tinta.", "Estou preparando uma exposição nova. Tema: 'Cinzaluz como ela devia ser'.", "Quer posar para um retrato ao vivo? Prometo que fica parecido. Mais ou menos."],
    marcos: ["Quando a lei manda, eu anuncio. Não gosto da forca, mas a vila precisa de ordem.", "Ao meio-dia, na praça, eu leio a sentença. Quem deve, paga.", "Disciplina, honra e justiça. E café forte antes de ler uma sentença."],
  };
  for (const [id, L] of Object.entries(extra)) {
    if (!NPCS[id] || !NPCS[id].talk) continue;
    const t0 = NPCS[id].talk,
      who = { andressa: "Andressa", gabriel: "Pedro Poeta", julia: "Princesa Julia", mylena: "Mylena", marcos: "General Marcos" }[id];
    NPCS[id].talk = function () {
      return Math.random() < 0.5 ? [[who, pk(L)]] : t0.apply(this, arguments);
    };
  }
}

/* ===================== ANDRESSA E PEDRO POETA ===================== */
function poetryExpo() {
  const p = POEMS.slice().sort(() => Math.random() - 0.5).slice(0, 3);
  game.fade = 1;
  player.clock = Math.max(player.clock, 18 * 60);
  const lines = [["", "Biblioteca de Cinzaluz, à luz de velas. Nas paredes, folhas emolduradas com a letra caprichada do Pedro Poeta."], ["Andressa", "Bem-vind" + genderWord("o", "a", "e") + " à exposição. Leia com calma. E não toque nas molduras."]];
  for (const [t, v] of p) lines.push(["", `<b>${t}</b><br><i>${v.replace(/\n/g, "<br>")}</i>`]);
  lines.push(["Pedro Poeta", "*escondido atrás de uma estante* ...Gostou? Não precisa responder. Precisa sim."]);
  say(lines, () =>
    choice("Exposição dos Poemas", "O que você faz?", [
      { t: "Elogiar os poemas", icon: "heart", fn: () => (addFriendship("gabriel", 6), addFriendship("andressa", 3), say([["Pedro Poeta", "Vou escrever um poema sobre esse elogio! ...Vai rimar com 'ocasião'."]])) },
      { t: "Comprar um poema emoldurado (20 ouro)", icon: "scroll", fn: () => (player.gold < 20 ? say([["", "Sem 20 de ouro."]]) : ((player.gold -= 20), addItem("papiro", 1), addFriendship("gabriel", 8), say([["Andressa", "Ótima escolha. Esse eu quase guardei para mim."]]))) },
      { t: "Tomar chá e ouvir as fofocas da Andressa", icon: "eye", fn: () => (typeof addNeed === "function" && addNeed("fun", 12), say([["Andressa", pk(["Sabia que o Coletor Real esconde ouro no colchão?", "O Luca anda planejando alguma coisa. Eu sempre sei.", "A Rainha não dorme direito há uma semana. Isso fica entre nós."])]])) },
    ]),
  );
  addFriendship("andressa", 2);
  saveGame();
}
function helpQueenEvent() {
  if (player.famDay.rainhaEvt === player.day) return say([["Andressa", "Hoje já ajudou! A Rainha está encantada."]]);
  player.famDay.rainhaEvt = player.day;
  player.clock = Math.min(1439, player.clock + 120);
  player.gold += 30;
  addFriendship("andressa", 6);
  if (NPCS.rainha) addFriendship("rainha", 5);
  game.fade = 1;
  saveGame();
  say([["Andressa", "Você pendura as bandeirinhas, eu cuido da lista de convidados e da segurança. A Rainha não pode saber que o bolo atrasou."], ["", "Duas horas depois, o salão está lindo. A Rainha Aurélia aparece e sorri."], ["Rainha Aurélia", "Andressa, você nunca falha. E você também, " + player.name + ". Tome, pelo trabalho."], ["", "+30 de ouro. A Andressa e a Rainha gostaram de você."]]);
}

/* ===================== PRINCESA JULIA: BICHOS E AVIÁRIO ===================== */
function aviary() {
  game.fade = 1;
  say(
    [
      ["", "Atrás da Casa do General, um viveiro enorme de madeira e tela. Lá dentro: corujas, pardais, um papagaio verde e uma pomba que te encara."],
      ["Princesa Julia", "Este é o meu Aviário! Todos vieram da rua, machucados ou perdidos. Agora são da família."],
      ["Papagaio", pk(["CURRUPACO! O MARCOS ESQUECEU A ESPADA!", "Bom dia, princesa! BOM DIA!", "Dá biscoito! Dá biscoito!"])],
    ],
    () =>
      choice("Aviário da Princesa Julia", "O que você faz?", [
        { t: "Dar sementes para as aves", icon: "feather", fn: () => (addFriendship("julia", 4), typeof addNeed === "function" && addNeed("fun", 10), say([["", "As aves pousam no seu braço para comer. Uma coruja pequena dorme no seu ombro."]])) },
        { t: "Adotar um bicho do abrigo", icon: "paw", fn: () => (typeof petShelter === "function" ? petShelter() : say([["Princesa Julia", "Volte outro dia, estou arrumando o abrigo."]])) },
        { t: "Voltar", fn: null },
      ]),
  );
}
function feedStrays() {
  if (player.famDay.strays === player.day) return say([["Princesa Julia", "Já alimentamos todo mundo hoje! Volta amanhã?"]]);
  if (player.gold < 5) return say([["Princesa Julia", "Precisamos de 5 de ouro para a ração. Fica pra próxima!"]]);
  player.famDay.strays = player.day;
  player.gold -= 5;
  player.clock = Math.min(1439, player.clock + 30);
  addFriendship("julia", 7);
  if (typeof repAdd === "function") repAdd(2);
  saveGame();
  say([["", "Você e a Princesa Julia andam pela vila com um saco de ração. Gatos saem dos telhados, cachorros correm do mercado."], ["Princesa Julia", pk(["Esse caramelo é o Bolinha. Ele manda na praça.", "Olha a gata frajola! Teve filhotes semana passada.", "O pretinho de três patas é o mais rápido de todos!"])], ["", "Reputação +2. A Princesa Julia gostou muito da ajuda."]]);
}

/* ===================== MYLENA: NOITES DE ARTE ===================== */
function artNight() {
  game.fade = 1;
  player.clock = Math.max(player.clock, 19 * 60);
  say(
    [
      ["", "Noite de Arte no Ateliê da Mylena! Lanternas coloridas, música de alaúde e quadros por toda parte."],
      ["Mylena", pk(["Bem-vind" + genderWord("o", "a", "e") + "! Hoje o tema é 'Cinzaluz como ela devia ser'.", "Essa exposição se chama 'Tinta no Lugar Errado'. É autobiográfica.", "Tem um quadro novo da Rainha. Tirei três rugas desta vez."])],
      ["Príncipe Pedro Max", "Eu sou o assistente. Quer dizer, eu seguro a escada."],
    ],
    () =>
      choice("Noite de Arte", "O que você faz?", [
        { t: "Posar para um retrato ao vivo", icon: "smile", fn: () => (addFriendship("mylena", 6), typeof addNeed === "function" && addNeed("fun", 14), say([["Mylena", "Fica parad" + genderWord("o", "a", "e") + "! ...Pronto! Ficou lindo. O nariz ficou um pouco maior, mas é arte."]])) },
        { t: "Comprar um quadro (40 ouro)", icon: "coin", fn: () => (player.gold < 40 ? say([["", "Sem 40 de ouro."]]) : ((player.gold -= 40), ITEMS.m_quadro && addItem("m_quadro", 1), addFriendship("mylena", 8), say([["Mylena", "Vendido! Pendura num lugar com luz, tá? Quadro gosta de sol."]]))) },
        { t: "Aplaudir e dançar", icon: "note", fn: () => (addFriendship("mylena", 3), typeof addNeed === "function" && addNeed("fun", 18), say([["", "Você dança entre os quadros até tarde. Que noite!"]])) },
      ]),
  );
  saveGame();
}

/* ===================== GENERAL MARCOS: SENTENÇAS E FORCA ===================== */
if (typeof DEATHS !== "undefined" && DEATHS.forca) {
  DEATHS.forca.killer = "marcos";
  DEATHS.forca.padre = "O General Marcos leu a sentença. A forca fez o resto. Que as runas tenham piedade.";
}
{
  const exeBase = execution;
  execution = function (id) {
    if (!lifeMode() || !NPCS.marcos || (typeof isDead === "function" && isDead("marcos"))) return exeBase.apply(this, arguments);
    const args = arguments;
    say([["General Marcos", `Pela lei de Cinzaluz, eu, General Marcos, anuncio a sentença de ${player.name}: morte na forca. Que a justiça seja feita.`], ["", "Ele mesmo puxa a alavanca."]], () => exeBase.apply(this, args));
  };
}
function todaysCondemned() {
  const R = rng(player.day * 131 + 7);
  return { nm: WALKER_NAMES[Math.floor(R() * WALKER_NAMES.length)], crime: CRIMES[Math.floor(R() * CRIMES.length)], hair: ["#3a2414", "#1a1a1a", "#8a3a1a", "#d9a441"][Math.floor(R() * 4)], skin: ["#f1c9a5", "#d9a07a", "#a8704a", "#7a4a2a"][Math.floor(R() * 4)] };
}
function condG(c) {
  return /[aeí]$/i.test(c.nm) && !/(e|é)$/i.test(c.nm) ? "a" : "o";
}
function publicHanging() {
  const c = todaysCondemned();
  player.famDay.forca = player.day;
  say(
    [
      ["", "A praça do castelo está lotada. Uma forca de madeira foi montada na escadaria."],
      ["General Marcos", `Cidadãos de Cinzaluz! ${c.nm} foi julgad${condG(c)} e condenad${condG(c)} por ${c.crime}.`],
      ["General Marcos", "A sentença é a morte na forca. Alguém tem algo a dizer?"],
      ["Multidão", pk(["FORCA!", "Justiça!", "...", "Coitado..."])],
    ],
    () =>
      choice("A execução", `${c.nm} sobe a escada com as mãos amarradas.`, [
        { t: "Assistir até o fim", icon: "eye", fn: () => hangingScene(c) },
        { t: "Pedir clemência ao General", icon: "heart", fn: () => (Math.random() < 0.25 + ((player.rep ?? 50) - 50) / 200 ? (addFriendship("marcos", -3), vilaNews(`${c.nm} foi poupad${condG(c)} da forca depois de um pedido de ${player.name}.`), say([["General Marcos", "...Hoje a lei terá piedade. Exílio, em vez da forca."], ["Multidão", "Ohhh!"]])) : say([["General Marcos", "A lei é a lei. Afaste-se."]], () => hangingScene(c))) },
        { t: "Ir embora (não quer ver)", icon: "door", fn: () => toast("Você sai da praça. Ao longe, ouve-se o tambor parar.", 2600) },
      ]),
  );
}
function hangingScene(c) {
  game.dialog = null;
  byId("dialog").style.display = "none";
  byId("choice").style.display = "none";
  const look = JSON.parse(JSON.stringify(player.look));
  Object.assign(look, { hair: c.hair, skin: c.skin, hat: "nenhum", outfit: "tunica", robe: "#5a4a3a", acc: "nenhum" });
  game.deathScene = {
    id: "forca",
    D: DEATHS.forca,
    t0: game.t,
    name: c.nm,
    age: 20 + (hashStr(c.nm) % 40),
    born: "",
    look,
    killerLook: NPCS.marcos,
    killerName: "General Marcos",
    title: `${c.nm}: enforcad${condG(c)} na praça`,
    stoneT: "Enforcado(a)",
    sub: `Sentença anunciada pelo General Marcos: ${c.crime}`,
    epi: "Pagou pelo que fez.",
    mourn: [{ npc: { robe: "#2a2230", hat: null, hair: "#cfc6b8" }, n: "Padre Anselmo" }, { npc: NPCS.marcos, n: "General Marcos" }],
    novo: false,
    count: 0,
    next: () => (vilaNews(`${c.nm} foi enforcad${condG(c)} ao meio-dia por ${c.crime}. A sentença foi lida pelo General Marcos.`), saveGame()),
  };
  game.mode = "cutscene";
  document.body.classList.add("cutscene");
  playSound(70, 1.4, "sine");
}
{
  const dayBase = onNewDay;
  onNewDay = function () {
    const r = dayBase.apply(this, arguments);
    if (!lifeMode()) return r;
    if (forcaDay() && NPCS.marcos && !isDead("marcos")) {
      const c = todaysCondemned();
      vilaNews(`O General Marcos anuncia: ${c.nm} será enforcad${condG(c)} hoje ao meio-dia, na praça do castelo, por ${c.crime}.`);
    }
    if (sarauDay() && !isDead("andressa")) vilaNews("Hoje à noite: Exposição dos Poemas do Pedro Poeta, na biblioteca. Organização: Andressa.");
    if (arteDay() && !isDead("mylena")) vilaNews("Hoje: Noite de Arte no Ateliê da Mylena! Quadros, música e retrato ao vivo.");
    return r;
  };
}
{
  let acc = 0;
  const upBase = update;
  update = function (dt) {
    const r = upBase.apply(this, arguments);
    acc += dt || 0;
    if (acc < 1) return r;
    acc = 0;
    if (!player || !lifeMode() || game.mode !== "world" || game.dialog || game.dying || game.deathScene || player.zone !== "vila") return r;
    if (forcaDay() && player.famDay.forca !== player.day && player.clock >= 12 * 60 && player.clock < 13 * 60 && NPCS.marcos && !isDead("marcos")) {
      player.famDay.forca = player.day;
      choice("Tambores na praça", "O General Marcos vai ler uma sentença de morte na praça do castelo. Quer ir ver?", [
        { t: "Ir à praça", icon: "eye", fn: publicHanging },
        { t: "Não, obrigado", icon: "door", fn: null },
      ]);
    }
    return r;
  };
}

/* ===================== MENUS ===================== */
{
  const ciBase = crewItems;
  crewItems = function (id) {
    const out = ciBase.apply(this, arguments) || [];
    const life = lifeMode();
    if (id === "andressa" || id === "gabriel") {
      if (sarauDay()) out.push({ t: "Ir à Exposição dos Poemas (hoje à noite)", icon: "scroll", fn: poetryExpo });
      else if (id === "andressa") out.push({ t: `Próxima exposição de poemas: dia ${player.day + ((1 - (player.day % 3) + 3) % 3 || 3)}`, icon: "scroll", fn: () => say([["Andressa", "Os poemas do Pedro ficam expostos a cada 3 dias. Venha à noite!"]]) });
      if (id === "andressa" && festivalToday()) out.push({ t: "Ajudar a Andressa no evento da Rainha (+30 ouro)", icon: "crown", fn: helpQueenEvent });
    }
    if (id === "julia") {
      out.push({ t: "Visitar o Aviário da Julia", icon: "feather", fn: aviary });
      out.push({ t: "Alimentar os bichos de rua com ela (5 ouro)", icon: "paw", fn: feedStrays });
    }
    if (id === "mylena" || id === "pedro") {
      if (arteDay()) out.push({ t: "Ir à Noite de Arte no Ateliê", icon: "note", fn: artNight });
      else if (id === "mylena") out.push({ t: "Quando é a próxima Noite de Arte?", icon: "note", fn: () => say([["Mylena", `A cada 4 dias! A próxima é no dia ${player.day + ((2 - (player.day % 4) + 4) % 4 || 4)}. Traz amigos!`]]) });
    }
    if (id === "marcos" && life) out.push({ t: "Perguntar sobre as sentenças", icon: "scroll", fn: () => say([["General Marcos", forcaDay() ? `Hoje ao meio-dia: ${todaysCondemned().nm}, por ${todaysCondemned().crime}. Eu leio a sentença.` : `A próxima sentença é no dia ${player.day + ((3 - (player.day % 5) + 5) % 5 || 5)}. Espero que nunca seja a sua.`]]) });
    return out;
  };
}
