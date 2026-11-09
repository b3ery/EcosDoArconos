/**
 * ECOS DO ARCANO — golpe.js
 * Golpe de estado e conquista dos reinos (Simulador de Vida):
 *  1. Conspiração: junte apoio (aliados, guardas subornados, armas, o povo, os
 *     Iluministas) sem levantar suspeita. Suspeita demais e a guarda te prende.
 *  2. A noite do golpe: portões, salão e sala do trono, cada etapa com escolhas.
 *  3. Coroação: você vira Rei ou Rainha de Aurélia e governa (impostos, festas, guerra).
 *  4. Os outros reinos: conquiste Marés e Pedravale pela guerra, por um golpe
 *     infiltrado ou por união diplomática. Os três juntos: Imperador(a) dos Três Reinos.
 *  5. O povo descontente pode tentar um contragolpe.
 * Tecla K (Reinos) abre tudo; o Luca e o Lucas também topam conspirar.
 * Modifica (envolve) funções de outros arquivos: atWar, choice, crewDrawList, drawQueen, ilumItems, isMonarch, kingdomsMenu, onNewDay, royalDaily, royalMenu, royalTitle, startProtest.
 */

"use strict";


function throne() {
  return (player.throne = player.throne || {});
}
function rulesK(k) {
  return lifeMode() && !!throne()[k];
}
function ruledCount() {
  return ["aurelia", "mares", "serra"].filter(rulesK).length;
}
function plot() {
  return (player.plot = player.plot || { sup: 0, sus: 0, allies: [], bribes: 0, arms: 0, day: 0 });
}
const BASE_RULERS = Object.fromEntries(Object.entries(KINGDOMS).map(([k, v]) => [k, v.ruler]));
function syncRulers() {
  for (const k of Object.keys(KINGDOMS)) KINGDOMS[k].ruler = rulesK(k) ? `${player.name} (${genderWord("Rei", "Rainha", "Monarca")})` : BASE_RULERS[k];
}

/* ===================== COROA ===================== */

{
  const monBase = isMonarch;
  isMonarch = function () {
    return monBase() || rulesK("aurelia");
  };
  royalTitle = function () {
    const n = ruledCount();
    if (n === 3) return genderWord("Imperador", "Imperatriz", "Soberane") + " dos Três Reinos";
    const names = ["aurelia", "mares", "serra"].filter(rulesK).map((k) => KINGDOMS[k].short);
    return genderWord("Rei", "Rainha", "Monarca") + " de " + (names.length ? names.join(" e ") : "Aurélia");
  };
  const atWarBase = atWar;
  atWar = function (a, b) {
    if (rulesK(a) && rulesK(b)) return false;
    return atWarBase(a, b);
  };
  const dailyBase = royalDaily;
  royalDaily = function () {
    dailyBase();
    // Cada reino conquistado também paga imposto.
    const extra = (rulesK("mares") ? 70 : 0) + (rulesK("serra") ? 70 : 0);
    if (extra) {
      player.gold += extra;
      setTimeout(() => toast(`Tributos dos reinos conquistados: +${extra} ouro.`, 3200), 8200);
    }
  };
}

/* ===================== CONSPIRAÇÃO ===================== */

const CROWN_LOYAL = new Set(["rainha", "tome", "kael", "capitao", "odelia"]);
function joinChance(id) {
  let c = 0.25 + (friendship(id) - 50) / 100;
  if (hasTrait(id, "rebelde")) c += 0.35;
  if (hasTrait(id, "ambicioso")) c += 0.15;
  if (hasTrait(id, "leal")) c -= 0.1;
  if (hasTrait(id, "timido")) c -= 0.1;
  if (CROWN_LOYAL.has(id)) c -= 0.45;
  if (player.ilumConv && player.ilumConv[id]) c += 0.25;
  return Math.max(0.03, Math.min(0.95, c));
}
function allyWeight(id) {
  if (id === "marcos") return 22; // o General traz o exército
  if (id === "lucas" || id === "luca") return 12;
  return CREW_ALL.includes(id) ? 10 : 7;
}
function supportTotal() {
  const P = plot();
  let s = P.allies.reduce((a, id) => a + allyWeight(id), 0) + P.bribes * 9 + P.arms * 8;
  s += Math.max(0, ((player.rep ?? 50) - 40) / 3);
  if (player.ilum) s += Math.min(20, ilumCount() * 4);
  return Math.min(100, Math.round(s));
}
function raiseSus(v, who) {
  const P = plot();
  P.sus = Math.min(100, P.sus + v);
  if (P.sus >= 100) return arrested(who), true;
  return false;
}
function arrested(who) {
  const fine = Math.min(player.gold, 300);
  player.gold -= fine;
  repAdd(-25);
  player.plot = null;
  if (FRIENDS.rainha) player.rel.rainha = 0;
  passTime(36, "Um dia e meio na masmorra do castelo...");
  vilaNews(`${player.name} foi pres${genderWord("o", "a", "e")} por conspirar contra a coroa!`);
  say([
    ["Guarda Tomé", `${who ? who + " contou tudo. " : ""}${player.name}, você está pres${genderWord("o", "a", "e")} por traição à coroa!`],
    ["Rainha Aurélia", "Achou mesmo que eu não ia descobrir? Masmorra. E pague a multa."],
    ["", `Você passou um dia e meio na masmorra e pagou ${fine} de ouro. A conspiração acabou.`],
  ]);
  saveGame();
}
function plotMenu() {
  if (!lifeMode()) return;
  if (rulesK("aurelia")) return royalMenu();
  if (playerAge() < 18) return say([["", "Você ainda é jovem demais para derrubar uma coroa."]]);
  const P = plot();
  const sup = supportTotal();
  const txt = `<b>Apoio:</b> ${sup}/100 · <b>Suspeita da guarda:</b> ${P.sus}/100<br>Aliados: ${P.allies.map(shortName).join(", ") || "ninguém ainda"} · Guardas subornados: ${P.bribes} · Armas: ${P.arms}<br><small>Com 60+ de apoio o golpe tem boa chance. Se a suspeita chegar a 100, você é pres${genderWord("o", "a", "e")}.</small>`;
  const opts = [
    { t: "Chamar alguém para a conspiração", icon: "chat", fn: recruitMenu },
    {
      t: `Subornar um guarda (${withTax(150)} ouro)`,
      icon: "coin",
      fn: () => {
        if (player.gold < withTax(150)) return say([["", "Você não tem ouro para o suborno."]], plotMenu);
        payWithTax(150);
        P.bribes++;
        if (raiseSus(8 + Math.floor(Math.random() * 10), "Um guarda")) return;
        saveGame();
        say([["Guarda (cochichando)", pk(["Na noite certa, o portão vai estar destrancado. Não me viu.", "Eu não vi nada, não ouvi nada e não estou aqui.", "Por esse ouro eu até tropeço na hora certa."])]], plotMenu);
      },
    },
    {
      t: `Comprar armas na Forja (${withTax(200)} ouro)`,
      icon: "sword",
      fn: () => {
        if (player.gold < withTax(200)) return say([["", "Você não tem ouro para as armas."]], plotMenu);
        payWithTax(200);
        P.arms++;
        if (raiseSus(10, "O ferreiro")) return;
        saveGame();
        say([["Brann, o Ferreiro", hasTrait("ferreiro", "esquentado") ? "Vinte espadas pra uma 'festa'? Sei... Leva logo antes que eu mude de ideia." : "Não pergunto pra quê. Mas cuidado."]], plotMenu);
      },
    },
    {
      t: "Espalhar boatos contra a Rainha",
      icon: "chat",
      fn: () => {
        if (player.famDay.boato === player.day) return say([["", "Você já espalhou boatos hoje. Mais um e vão desconfiar."]], plotMenu);
        player.famDay.boato = player.day;
        repAdd(hasTrait("player", "fofoqueiro") ? 3 : 2);
        if (FRIENDS.rainha) player.rel.rainha = Math.max(0, friendship("rainha") - 4);
        if (raiseSus(6, null)) return;
        vilaNews(pk(["Dizem que a Rainha gasta o Imposto Real em perucas!", "Boato: a Rainha quer dobrar o imposto da padaria!", "Ouvi dizer que o castelo tem uma sala só de sapatos."]));
        saveGame();
        say([["", "Você cochicha na taverna, na feira e na fila do pão. O povo começa a duvidar da coroa."]], plotMenu);
      },
    },
    {
      t: "Esfriar a cabeça (diminuir a suspeita)",
      icon: "flower",
      fn: () => {
        passTime(8, "Você passa o dia longe de qualquer conspiração...");
        P.sus = Math.max(0, P.sus - 25);
        saveGame();
        say([["", "Ninguém viu você com ninguém hoje. A guarda relaxa um pouco."]], plotMenu);
      },
    },
  ];
  const h = currentHour();
  opts.push({
    t: h >= 22 || h < 4 ? `DAR O GOLPE AGORA (${sup}% de apoio)` : "Dar o golpe (só de noite, das 22h às 4h)",
    icon: "crown",
    off: !(h >= 22 || h < 4),
    fn: () => (h >= 22 || h < 4 ? coupNight() : null),
  });
  opts.push({ t: "Desistir da conspiração", icon: "door", fn: () => ((player.plot = null), saveGame(), toast("Você queimou os mapas do castelo. Conspiração encerrada.", 2600)) });
  opts.push({ t: "Fechar", fn: null });
  game.pieAnchor = null;
  choice("Conspiração contra a coroa", txt, opts);
}
function recruitMenu() {
  const P = plot();
  const cands = Object.keys(FRIENDS).filter((id) => NPCS[id] && id !== "rainha" && !P.allies.includes(id) && !isChildNpc(id) && friendship(id) >= 25 && player.famDay["plot" + id] !== player.day);
  if (!cands.length) return say([["", "Ninguém mais em quem você confie o bastante (amizade 25+). Faça amigos e volte."]], plotMenu);
  cands.sort((a, b) => joinChance(b) - joinChance(a));
  choice(
    "Quem chamar?",
    "Cada pessoa aceita ou não pelo jeito dela. Leais à coroa podem te entregar!",
    cands
      .slice(0, 12)
      .map((id) => ({
        t: `${shortName(id)} (${Math.round(joinChance(id) * 100)}%)`,
        fn: () => {
          player.famDay["plot" + id] = player.day;
          const n = shortName(id);
          if (Math.random() < joinChance(id)) {
            P.allies.push(id);
            raiseSus(4, null);
            saveGame();
            const line =
              id === "marcos"
                ? "Um general sabe quando o reino precisa de mudança. O exército vai comigo. Mas a Julia não pode saber!"
                : id === "luca"
                  ? "FINALMENTE! Eu sabia que o roteiro ia chegar nessa parte! Conta comigo."
                  : id === "lucas"
                    ? "Golpe? Eu topo. Mas se der errado eu nunca te conheci, combinado?"
                    : pk(["Tô dentro. Essa coroa já deu o que tinha que dar.", "Com você eu vou até o fim.", "Conta comigo. Mas ninguém pode saber!", "Finalmente alguém com coragem!"]);
            return say([[n, line], ["", `${n} entrou na conspiração! (+${allyWeight(id)} de apoio)`]], plotMenu);
          }
          if (CROWN_LOYAL.has(id) && Math.random() < 0.6) {
            addFriendship(id, -15);
            if (raiseSus(45, n)) return;
            saveGame();
            return say([[n, "Traição?! Vou fingir que não ouvi... por enquanto. Mas a guarda vai ficar de olho em você."]], plotMenu);
          }
          addFriendship(id, -3);
          raiseSus(8, null);
          saveGame();
          say([[n, pk(["Golpe? Tá louc" + genderWord("o", "a", "e") + "? Não quero me meter nisso.", "Eu gosto da minha cabeça no pescoço, obrigad" + gw(id, "o", "a") + ".", "Não conto pra ninguém. Mas também não ajudo."])]], plotMenu);
        },
      }))
      .concat([{ t: "Voltar", fn: plotMenu }]),
  );
}

/* ===================== A NOITE DO GOLPE ===================== */

function coupNight() {
  const P = plot();
  let power = supportTotal();
  const allyNames = P.allies.map(shortName);
  const roll = (bonus) => Math.random() * 100 < Math.max(8, Math.min(95, power + bonus));
  const stage3 = () =>
    choice("Sala do Trono", "A Rainha Aurélia está de pé ao lado do trono, com a coroa nas mãos.", [
      {
        t: "Exigir a coroa (discurso)",
        icon: "crown",
        fn: () => (roll((player.rep ?? 50) / 4 - 10) ? coupWin("discurso") : coupFail("A Rainha chama o resto da guarda enquanto você discursa.")),
      },
      {
        t: "Prender a Rainha",
        icon: "sword",
        fn: () => (roll(P.arms * 6) ? coupWin("prisão") : coupFail("A Rainha foge por uma passagem secreta e volta com a guarda!")),
      },
      {
        t: "Oferecer exílio em paz",
        icon: "flower",
        fn: () => (roll(10) ? coupWin("exílio") : coupFail("A Rainha recusa e grita por socorro. Os sinos tocam!")),
      },
    ]);
  const stage2 = () =>
    choice("O Salão do Castelo", "Guardas leais à Rainha bloqueiam o salão. Tochas, espadas e muita gritaria.", [
      {
        t: P.allies.includes("marcos") ? "O General Marcos manda os soldados recuarem" : "Lutar contra os guardas",
        icon: "sword",
        fn: () => {
          if (P.allies.includes("marcos") || roll(P.arms * 7 - 5)) {
            power += 5;
            say([["", P.allies.includes("marcos") ? 'O General Marcos ergue a mão: "Soldados, abaixem as armas." E eles obedecem.' : "Espadas batem, cadeiras voam... e os guardas se rendem!"]], stage3);
          } else coupFail("Os guardas leais eram muitos. Vocês recuam feridos.");
        },
      },
      {
        t: "Criar uma distração (Luca, faça alguma coisa!)",
        icon: "laugh",
        fn: () => {
          const luca = P.allies.includes("luca");
          if (luca || roll(-5)) {
            say([["Luca", luca ? "ATENÇÃO, GUARDAS! O JOGO VAI SALVAR AGORA! NÃO DESLIGUEM O VIDEOGAME!" : ""], ["", "Os guardas ficam confusos o suficiente para vocês passarem."]].filter((l) => l[1]), stage3);
          } else coupFail("A distração não funcionou. Os guardas riram e depois prenderam todo mundo.");
        },
      },
    ]);
  game.fade = 1;
  say(
    [
      ["", `Meia-noite em Cinzaluz. ${allyNames.length ? allyNames.join(", ") + (allyNames.length > 1 ? " esperam" : " espera") : "Sozinh" + genderWord("o", "a", "e") + ", você espera"} nas sombras da praça.`],
      ...(P.allies.includes("lucas") ? [["Lucas Marzocca", "Se alguém perguntar, a gente veio ver a lua. Bonita, né?"]] : []),
      ["", "Os portões do castelo estão logo à frente."],
    ],
    () =>
      choice("Os Portões", `Força do golpe: ${power}%`, [
        {
          t: P.bribes ? `Entrar pelo portão destrancado (${P.bribes} guarda${P.bribes > 1 ? "s" : ""} subornado${P.bribes > 1 ? "s" : ""})` : "Escalar o muro",
          icon: "door",
          fn: () => (P.bribes || roll(-10) ? say([["", P.bribes ? "O guarda subornado olha para o outro lado. O portão range... e abre." : "Você escala o muro com uma corda velha. Ninguém viu!"]], stage2) : coupFail("A corda arrebentou e você caiu bem em cima de um guarda.")),
        },
        {
          t: player.ilum && ilumCount() >= 3 ? "Chamar o povo (os Iluministas invadem junto)" : "Gritar para o povo acordar",
          icon: "flag",
          fn: () => {
            if (player.ilum && ilumCount() >= 3) power += 15;
            if (roll(player.ilum ? 10 : -15)) say([["", "Janelas se acendem. Gente de pijama e tocha na mão corre para o castelo gritando com você!"]], stage2);
            else coupFail("Só o galo acordou. A guarda chegou primeiro.");
          },
        },
      ]),
  );
}
function coupWin(how) {
  const T = throne();
  T.aurelia = player.day;
  player.plot = null;
  syncRulers();
  if (player.spouse === "rainha") {
    player.spouse = null;
    player.divorced = player.day;
  }
  if (FRIENDS.rainha) player.rel.rainha = 0;
  repAdd(how === "discurso" ? 8 : how === "exílio" ? 5 : -2);
  player.coupDay = player.day;
  game.fade = 1;
  playSound(523, 0.3, "triangle");
  setTimeout(() => playSound(659, 0.3, "triangle"), 250);
  setTimeout(() => playSound(784, 0.5, "triangle"), 500);
  vilaNews(`GOLPE! ${player.name} tomou o castelo e é ${genderWord("o novo Rei", "a nova Rainha", "a nova Majestade")} de Aurélia!`);
  announceWorld(`GOLPE DE ESTADO! ${player.name} agora governa Aurélia!`);
  ACH_CHECK();
  saveGame();
  say([
    ["Rainha Aurélia", { discurso: "...O povo está com você. Eu sei quando perdi. Fique com a coroa.", prisão: "Vocês vão se arrepender disso! Eu VOLTO!", exílio: "Exílio em paz... Vou para as Marés. Cuide do meu povo melhor do que eu cuidei." }[how]],
    ["", `Na manhã seguinte, o sino toca. ${player.name} é coroad${genderWord("o", "a", "e")} na escadaria do castelo.`],
    ["Luca", "Ok, agora a gente protesta contra VOCÊ? ...Brincadeira. Talvez."],
    ["", `Você agora é ${royalTitle()}! Aperte K para governar: impostos, festas, guerras e conquistar os outros reinos.`],
  ]);
}
function coupFail(why) {
  const P = plot();
  const caught = Math.random() < 0.6;
  for (const id of P.allies) addFriendship(id, -10);
  player.plot = null;
  if (caught) {
    say([["", why]], () => arrested(null));
  } else {
    repAdd(-10);
    passTime(4, "Vocês fogem pelos becos escuros...");
    vilaNews(`Tentaram dar um golpe no castelo esta noite! Ninguém sabe quem foi... ainda.`);
    saveGame();
    say([["", why], ["", "Vocês fugiram pelos becos antes de serem reconhecidos. A conspiração acabou, mas você está livre."]]);
  }
}

/* ===================== CONQUISTAR OS OUTROS REINOS ===================== */

function army() {
  return (player.army = player.army || 0);
}
function conquerMenu(k) {
  const K = KINGDOMS[k],
    w = worldState(),
    rel = w.rel[pairKey("aurelia", k)];
  const opts = [
    {
      t: `Recrutar 10 soldados (${withTax(120)} ouro) · exército: ${army()}`,
      icon: "sword",
      fn: () => {
        if (player.gold < withTax(120)) return say([["Sargento", "Sem ouro, sem soldado, Majestade."]], () => conquerMenu(k));
        payWithTax(120);
        player.army = army() + 10;
        saveGame();
        toast(`+10 soldados. Exército: ${player.army}.`, 1800);
        conquerMenu(k);
      },
    },
    {
      t: atWar("aurelia", k) ? `INVADIR ${K.short.toUpperCase()} (exército ${army()})` : `Declarar guerra e invadir ${K.short}`,
      icon: "flag",
      fn: () => invade(k),
    },
    {
      t: `Golpe infiltrado em ${K.short} (${withTax(600)} ouro em subornos)`,
      icon: "eye",
      fn: () => {
        if (player.gold < withTax(600)) return say([["Espiã Real", "Para comprar a guarda de lá, preciso de mais ouro."]], () => conquerMenu(k));
        payWithTax(600);
        const ch = 0.3 + (player.rep ?? 50) / 300 + (rel < 40 ? 0.1 : 0);
        if (Math.random() < ch) conquered(k, "golpe");
        else {
          repAdd(-6);
          w.rel[k === "mares" ? pairKey("aurelia", "mares") : pairKey("aurelia", "serra")] = Math.max(0, rel - 20);
          saveGame();
          say([["", `A espiã foi descoberta em ${K.short}. ${K.ruler} expulsou seus agentes e ficou furioso com Aurélia.`]]);
        }
      },
    },
    {
      t: rel >= 75 ? `União diplomática com ${K.short} (${withTax(2500)} ouro)` : `União diplomática (precisa de relação 75+, agora ${rel})`,
      icon: "heart",
      off: rel < 75,
      fn: () => {
        if (rel < 75) return;
        if (player.gold < withTax(2500)) return say([[K.ruler, "Uma união dos reinos tem seu preço. Volte com o dote."]], () => conquerMenu(k));
        payWithTax(2500);
        conquered(k, "uniao");
      },
    },
    { t: "Voltar", fn: royalMenu },
  ];
  choice(`Conquistar ${K.n}`, `Governante: ${K.ruler}. Relação com Aurélia: ${rel}/100${atWar("aurelia", k) ? " (EM GUERRA)" : ""}.<br>Exército: ${army()} soldados${friendshipLevel("marcos") >= 2 ? " · O General Marcos comanda as tropas" : ""}.`, opts);
}
function invade(k) {
  const K = KINGDOMS[k];
  const w = worldState();
  if (!atWar("aurelia", k)) {
    w.wars[pairKey("aurelia", k)] = { since: player.day };
    w.rel[pairKey("aurelia", k)] = 10;
    repAdd(-4);
    announceWorld(`GUERRA! ${royalTitle()} invadiu ${K.n}!`);
  }
  if (army() < 10) return say([["Sargento", "Majestade, sem soldados não dá para invadir nada. Recrute pelo menos 10."]], () => conquerMenu(k));
  const defense = k === "mares" ? 45 : 55;
  let score = army() + (friendshipLevel("marcos") >= 2 ? 20 : 0) + (rulesK(k === "mares" ? "serra" : "mares") ? 15 : 0);
  const fight = (label, bonus, nextFn) => {
    const ok = Math.random() * 100 < Math.max(10, Math.min(92, 50 + (score + bonus - defense)));
    const lost = Math.round(army() * (ok ? 0.1 : 0.3));
    player.army = Math.max(0, army() - lost);
    score -= lost / 2;
    say([["", `${label}: ${ok ? "vitória!" : "derrota!"} (${lost} soldados perdidos)`]], () => nextFn(ok));
  };
  const finale = (wins) => {
    if (wins >= 2) conquered(k, "guerra");
    else {
      repAdd(-8);
      saveGame();
      say([[K.ruler, "Volte para o seu castelo e conte quantos soldados sobraram!"], ["", `A invasão de ${K.short} falhou. A guerra continua.`]]);
    }
  };
  choice(`Invasão de ${K.n}`, `Escolha a estratégia. Exército: ${army()} soldados contra a defesa de ${K.short}.`, [
    { t: "Ataque frontal (rápido, arriscado)", icon: "sword", fn: () => fight("Ataque frontal", 0, (a) => fight("Batalha na praça", 5, (b) => finale(a + b + (Math.random() < 0.5 ? 1 : 0)))) },
    { t: "Cerco (lento, mais seguro)", icon: "house", fn: () => (passTime(12, "Doze horas de cerco..."), fight("Cerco às muralhas", 12, (a) => fight("Fome na cidade", 10, (b) => finale(a + b + (a && b ? 1 : 0))))) },
    { t: k === "mares" ? "Ataque pelo mar à noite" : "Emboscada nas montanhas", icon: "eye", fn: () => fight("Emboscada", 8, (a) => fight("Tomada do palácio", a ? 15 : -5, (b) => finale(a + b + (b ? 1 : 0)))) },
  ]);
}
function conquered(k, how) {
  const K = KINGDOMS[k];
  const old = BASE_RULERS[k];
  throne()[k] = player.day;
  delete worldState().wars[pairKey("aurelia", k)];
  worldState().rel[pairKey("aurelia", k)] = 70;
  syncRulers();
  repAdd(how === "uniao" ? 10 : how === "golpe" ? 2 : -3);
  const line = { guerra: `${old} entrega a espada: "${K.short} é sua. Trate bem o meu povo."`, golpe: `Na madrugada, os guardas de ${K.short} abrem as portas. ${old} acorda sem coroa.`, uniao: `${old} assina o tratado: "Que ${KINGDOMS.aurelia.short} e ${K.short} sejam um só reino."` }[how];
  vilaNews(`${player.name} agora governa ${K.n} também!`);
  const all = ruledCount() === 3;
  announceWorld(all ? `UM SÓ IMPÉRIO! ${player.name} governa os Três Reinos!` : `${K.n} agora pertence a ${player.name}!`);
  ACH_CHECK();
  saveGame();
  say([
    ["", line],
    ["", all ? `Aurélia, Marés e Pedravale agora são um só império. Você é ${royalTitle()}! As guerras entre os três reinos acabaram.` : `Você agora é ${royalTitle()}. ${K.short} paga tributo todo dia.`],
  ]);
}

/* ===================== CONTRAGOLPE ===================== */

{
  const dayBase = onNewDay;
  onNewDay = function () {
    dayBase.apply(this, arguments);
    if (!rulesK("aurelia") || player.spouse === "rainha") return;
    const rep = player.rep ?? 50;
    if (rep < 25 && player.day - (player.coupDay || 0) > 2 && Math.random() < 0.3) setTimeout(counterCoup, 6000);
  };
}
function counterCoup() {
  if (game.mode !== "world" || game.dialog) return setTimeout(counterCoup, 5000);
  choice("CONTRAGOLPE!", `A Rainha Aurélia voltou do exílio com soldados das Marés! O povo está insatisfeito com você (reputação ${player.rep}).`, [
    {
      t: `Defender o castelo (exército ${army()})`,
      icon: "sword",
      fn: () => {
        const ok = Math.random() * 100 < 35 + army() / 2 + (friendshipLevel("marcos") >= 2 ? 15 : 0);
        player.army = Math.max(0, army() - 10);
        if (ok) {
          repAdd(3);
          saveGame();
          say([["", "Seus soldados seguram os portões até o amanhecer. A Rainha recua. A coroa continua sua!"]]);
        } else loseThrone("Os portões caíram. A Rainha Aurélia retomou o castelo.");
      },
    },
    {
      t: "Baixar impostos e dar uma festa para o povo",
      icon: "party",
      fn: () => {
        player.royalTax = "baixo";
        repAdd(10);
        if (Math.random() < 0.55) say([["", "O povo sai às ruas com tochas... para festejar com você! A Rainha não acha apoio e volta para o exílio."]]);
        else loseThrone("Tarde demais: o povo abriu os portões para a Rainha.");
        saveGame();
      },
    },
    { t: "Fugir com o tesouro", icon: "coin", fn: () => ((player.gold += 200), loseThrone("Você foge pela passagem secreta com um saco de ouro.")) },
  ]);
}
function loseThrone(why) {
  player.throne = {};
  syncRulers();
  repAdd(-10);
  vilaNews(`A Rainha Aurélia voltou ao trono! ${player.name} perdeu a coroa.`);
  saveGame();
  say([["", why], ["Rainha Aurélia", "Bem-vind" + genderWord("o", "a", "e") + " de volta à vida de súdito. Os impostos agora são meus de novo."]]);
}

/* ===================== MENUS ===================== */

/** Roda fn e, na próxima chamada de choice() que ela fizer, deixa mexer nas opções e no texto. */
function hookChoice(fn, mutate) {
  const ch = choice;
  choice = function (title, text, opts) {
    choice = ch;
    const r = mutate(title, text, opts);
    return ch(r[0], r[1], r[2]);
  };
  try {
    fn();
  } finally {
    choice = ch;
  }
}
{
  const menuBase = royalMenu;
  royalMenu = function () {
    hookChoice(menuBase, (title, text, opts) => {
      if (!rulesK("aurelia")) return [title, text, opts];
      const extra = ["mares", "serra"].filter((k) => !rulesK(k)).map((k) => ({ t: `Conquistar ${KINGDOMS[k].short}…`, icon: "flag", fn: () => conquerMenu(k) }));
      if (extra.length) extra.push({ t: `Exército: ${army()} soldados (recrutar)`, icon: "sword", fn: () => conquerMenu(["mares", "serra"].find((k) => !rulesK(k))) });
      return [royalTitle(), `Tesouro: impostos de ${ruledCount()} reino(s) caem todo dia. Exército: ${army()}. Reputação: ${player.rep ?? 50}.`, opts.slice(0, -1).concat(extra, opts.slice(-1))];
    });
  };
  const kBase = kingdomsMenu;
  kingdomsMenu = function () {
    syncRulers();
    hookChoice(kBase, (title, text, opts) => {
      if (rulesK("aurelia")) text = text.replace(` e Rainha Aurélia`, "");
      if (lifeMode() && !rulesK("aurelia")) {
        const P = player.plot;
        opts.splice(opts.length - 1, 0, { t: P ? `Conspiração (apoio ${supportTotal()}%, suspeita ${P.sus}%)` : player.spouse === "rainha" ? "Golpe palaciano (governar sozinh" + genderWord("o", "a", "e") + ")" : "Conspirar contra a coroa (golpe de estado)", icon: "crown", fn: plotMenu });
      }
      return [title, text, opts];
    });
  };
  // Casado com a Rainha também pode dar um golpe palaciano.
  const ilBase = ilumItems;
  ilumItems = function (id) {
    const items = ilBase(id);
    if (lifeMode() && !rulesK("aurelia") && (id === "lucas" || id === "luca"))
      items.push({
        t: player.plot ? "Falar da conspiração" : "Propor um golpe de estado 👑",
        icon: "crown",
        fn: () => {
          const P = plot();
          if (!P.allies.includes(id)) P.allies.push(id);
          saveGame();
          say([[shortName(id), id === "luca" ? "Golpe? Eu já tinha o plano desenhado num guardanapo! Tô dentro." : "Derrubar a coroa? Finalmente uma festa que eu levo a sério. Tô dentro!"]], plotMenu);
        },
      });
    return items;
  };
}
/* Coroa sobre a cabeça de quem governa. */
{
  const drawBase = crewDrawList;
  crewDrawList = function (list, t) {
    drawBase(list, t);
    if (!lifeMode() || !ruledCount() || player.zone === "title") return;
    list.push({
      y: player.ry + 0.02,
      draw: () => {
        const X = player.rx * TILE + 9,
          Y = player.ry * TILE - 6 + Math.sin(t * 2) * 0.6 - (player.riding ? 12 : 0);
        ctx.fillStyle = "#c9a03a";
        ctx.fillRect(X, Y + 3, 14, 4);
        ctx.fillStyle = "#f2c14e";
        ctx.fillRect(X, Y + 2, 14, 3);
        for (const k of [0, 6, 12]) ctx.fillRect(X + k, Y - 1, 2, 4);
        ctx.fillStyle = ruledCount() === 3 ? "#5fd0ff" : "#c94a4a";
        ctx.fillRect(X + 6, Y + 3, 2, 2);
      },
    });
  };
}
/* Protestos contra a nova coroa: quem aparece na escadaria é você. */
{
  const startBase = startProtest;
  startProtest = function (force) {
    const r = startBase(force);
    if (r && rulesK("aurelia") && game.protest) {
      game.protest.queen.isPlayer = true;
      game.protest.queen.nome = player.name;
    }
    return r;
  };
  const drawQ = drawQueen;
  drawQueen = function (q, t) {
    if (!q.isPlayer) return drawQ(q, t);
    drawSprite(heroRects(player.look, "down", null, 0), q.rx * TILE, q.ry * TILE, 2, false);
  };
}
ACHIEVEMENTS.push(["golpe", "Golpe de estado", "Tome o trono de Aurélia.", "crown", () => !!(player.throne && player.throne.aurelia)]);
ACHIEVEMENTS.push(["imperio", "Um só império", "Governe os Três Reinos.", "crown", () => !!(player.throne && player.throne.aurelia && player.throne.mares && player.throne.serra)]);
function ACH_CHECK() {
  if (typeof achTick === "function") setTimeout(achTick, 1500);
}
syncRulers();
