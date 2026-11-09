/**
 * ECOS DO ARCANO — alcoolatras-anonimos.js
 *  - A Júlia Oliveira entra para a turma, que tem nome: Alcoólatras Anônimos.
 *  - Reunião semanal do grupo na Taverna Javali Dourado (a cada 7 dias, das 19h às 23h).
 *  - Mais 32 interações (com a categoria nova "Na taverna").
 *  - 14 pedidos novos: um de cada pessoa da turma e outros dos moradores.
 * Modifica (envolve) funções de outros arquivos: crewGroupMenu, crewHomeOf, crewItems, crewTarget, genInterior, interiorPersonMenu, onNewDay.
 */

"use strict";

const GROUP_NAME = "Alcoólatras Anônimos";
if (!CREW.includes("juliaO")) CREW.push("juliaO");
{
  const cands = [
    [36, 22],
    [26, 22],
    [36, 21],
    [26, 21],
    [33, 23],
  ];
  const spot = cands.find(([x, y]) => walkable("vila", x, y) && !CREW_GATHER_SPOTS.some(([a, b]) => a === x && b === y));
  if (spot) CREW_GATHER_SPOTS.push(spot);
}
CREW_BANTER.push(
  [
    ["Júlia Oliveira", "Gente, hoje atendi um dragãozinho com dor de dente. Ele me deu uma escama de presente!"],
    ["Mylena", "Eu quero essa escama para um quadro!"],
    ["Andressa", "E eu quero saber de onde veio esse dragão. Segurança, gente."],
  ],
  [
    ["Lucas Marzocca", "Proponho um nome novo pro grupo. Algo sério."],
    ["Matheus", "A gente já tem nome, Lucas: Alcoólatras Anônimos."],
    ["Júlia Oliveira", "E anônimos a gente não é. A vila inteira sabe quem a gente é!"],
  ],
);
// Os 6 agora: o resto do jogo conta com a Júlia.
for (const q of typeof SIDEQ !== "undefined" ? SIDEQ : []) if (q.t === "Fique amigo da turma de Cinzaluz") Object.assign(q, { t: `Fique amigo dos ${GROUP_NAME} (a turma)`, n: CREW.length });
{
  const a = ACHIEVEMENTS.find((q) => q[0] === "turma");
  if (a) Object.assign(a, { 1: "Membro honorário", 2: `Fique amigo dos seis ${GROUP_NAME}.` });
}
const _crewGroupMenuBase = crewGroupMenu;
crewGroupMenu = function () {
  _crewGroupMenuBase();
  if (game.mode === "choice") {
    const opts = game.choice;
    choice(GROUP_NAME, "Lucas, Matheus, Marcos, Andressa, Mylena e Júlia conversam na fonte.", opts);
  }
};
const _crewItemsAA = crewItems;
crewItems = function (id) {
  const items = _crewItemsAA(id);
  if (id === "juliaO")
    items.push({ t: "Pedir ajuda com um bichinho", icon: "paw", fn: vetMenu });
  return items;
};

/* ===================== REUNIÃO NA TAVERNA ===================== */

function aaMeeting() {
  const h = currentHour();
  return player.day % 7 === 5 && h >= 19 && h < 23;
}
const TAVERN_BLD = ZONES.vila.town.bld.find((b) => b.style === "taverna");
const _crewTargetAA = crewTarget;
crewTarget = function (id) {
  if (aaMeeting() && CREW.includes(id)) return "home";
  return _crewTargetAA(id);
};
const _crewHomeOfAA = crewHomeOf;
crewHomeOf = function (id) {
  if (aaMeeting() && CREW.includes(id) && TAVERN_BLD) return TAVERN_BLD;
  return _crewHomeOfAA(id);
};
const _genInteriorAA = genInterior;
genInterior = function (b) {
  const z = _genInteriorAA(b);
  if (b.style === "taverna" && aaMeeting() && game.inter) {
    const spots = [
      [3, 6],
      [4, 6],
      [5, 6],
      [3, 8],
      [4, 8],
      [5, 8],
    ];
    game.inter.people = game.inter.people.filter((p) => !spots.some(([x, y]) => x === p.x && y === p.y));
    CREW.forEach((id, i) => {
      const L = CREW_LOOKS[id];
      const [x, y] = spots[i];
      if (z.map[y] && z.map[y][x] === ".") game.inter.people.push({ x, y, robe: L.robe, hat: L.hat, hair: L.hair, nm: crewName(id), aa: true, cid: id });
    });
  }
  return z;
};
const _interiorPersonMenuAA = interiorPersonMenu;
interiorPersonMenu = function (pe) {
  if (pe && pe.aa) return aaMeetingMenu();
  return _interiorPersonMenuAA(pe);
};
const AA_OPENERS = [
  [
    ["Lucas Marzocca", "Olá, meu nome é Lucas e eu estou há... *olha o copo* ...zero minutos sem hidromel."],
    ["Todos", "OLÁ, LUCAS!"],
    ["Matheus", "Pelo menos ele é honesto."],
  ],
  [
    ["General Marcos", "Declaro aberta a reunião número... alguém anotou?"],
    ["Andressa", "Número 47. Eu anoto tudo. Inclusive quem pagou a última rodada: ninguém."],
    ["Júlia Oliveira", "Então essa é minha! Garçom, a do Vini vai na conta do reino!"],
  ],
  [
    ["Mylena", "Pauta de hoje: 1) fofoca, 2) fofoca, 3) quem desenha o brasão do grupo."],
    ["Lucas Marzocca", "Um copo de hidromel com asas. Pronto, tá desenhado."],
    ["Mylena", "Lucas, isso é exatamente o que eu ia propor. Estou preocupada."],
  ],
  [
    ["Júlia Oliveira", "Hoje o Biscoito, o cachorro do moleiro, comeu uma meia inteira. Sobreviveu. Eu quase não."],
    ["Matheus", "Brindemos ao Biscoito!"],
    ["Todos", "AO BISCOITO!"],
  ],
];
function aaMeetingMenu() {
  choice(`Reunião dos ${GROUP_NAME}`, "A mesa do canto da taverna é deles. Copos, risadas e um caderno de atas que ninguém lê.", [
    {
      t: "Sentar com o grupo",
      icon: "party",
      fn: () => {
        const first = player.famDay.aa !== player.day;
        player.famDay.aa = player.day;
        if (first) for (const id of CREW) addFriendship(id, 3);
        if (lifeMode()) addNeed("fun", 25);
        saveGame();
        say(pickOne(AA_OPENERS).concat(first ? [["", `Você virou membro honorário da reunião de hoje. Amizade com o grupo +3.`]] : []));
      },
    },
    {
      t: `Pagar uma rodada para todos (${withTax(30)} ouro)`,
      icon: "mug",
      fn: () => {
        if (player.famDay.aaRound === player.day) return say([["Lucas Marzocca", "Você já pagou hoje! Agora é a vez do... *todos olham para o Lucas* ...ah."]]);
        if (player.gold < withTax(30)) return say([["Andressa", "Anotei: rodada prometida e não paga. Fica pra próxima."]]);
        payWithTax(30);
        player.famDay.aaRound = player.day;
        for (const id of CREW) addFriendship(id, 5);
        player.drunk = Math.min(110, (player.drunk || 0) + 20);
        repAdd(1);
        saveGame();
        say([
          ["", "Seis canecas batem ao mesmo tempo. Metade do hidromel vai parar na mesa."],
          ["Todos", "SAÚDE!"],
          ["", "Amizade com todo o grupo +5."],
        ]);
      },
    },
    {
      t: "Ler a ata da última reunião",
      icon: "scroll",
      fn: () =>
        say([
          ["Andressa", "*abre o caderno* Ata da reunião anterior: o Lucas prometeu parar de namorar três ao mesmo tempo."],
          ["Andressa", "Item dois: o Marcos ganhou a queda de braço de todo mundo. De novo."],
          ["Andressa", "Item três: a Mylena pintou a ata. Ficou linda, mas não dá para ler."],
        ]),
    },
    {
      t: "Desafiar o Marcos na queda de braço",
      icon: "anger",
      fn: () => {
        const win = Math.random() < 0.2 + (player.lvl || 1) * 0.02;
        if (lifeMode()) addNeed("energy", -8);
        addFriendship("marcos", 2);
        saveGame();
        say(win ? [["General Marcos", "*a mesa range* ...Você... ganhou? Ninguém ganha de mim! Respeito."], ["", "A taverna inteira explode em aplausos. Reputação +2."]] : [["General Marcos", "*vence sem suar* Boa tentativa! Treine comigo de manhã."]]);
        if (win) repAdd(2);
      },
    },
    { t: "Sair", fn: null },
  ]);
}
const _onNewDayAA = onNewDay;
onNewDay = function () {
  _onNewDayAA.apply(this, arguments);
  if (player.day % 7 === 5) setTimeout(() => toast(`Hoje tem reunião dos ${GROUP_NAME} na Taverna Javali Dourado, das 19h às 23h!`, 5200), 9600);
};

/* ===================== MAIS INTERAÇÕES ===================== */

INTER_CATS.splice(4, 0, { k: "tav", n: "Na taverna", icon: "mug" });
INTERACTIONS.push(
  ["brindeV", "tav", "Brindar à vida", "mug", 3, "EAO", "S", "À vida! E ao hidromel, que ajuda a vida a ser melhor.", "Brindar a quê? Ao dia ruim que eu tive?", { cost: 5, fun: 8 }],
  ["rodadaU", "tav", "Pagar uma bebida", "mug", 5, "EAOG", "", "Você é dos bons! Na próxima eu pago.", "Não bebo, mas valeu a intenção.", { cost: 8, fun: 6 }],
  ["cancao", "tav", "Puxar uma canção de taverna", "note", 4, "EAC", "TS", "♪ E o anão bebeu o barril inteiro... ♪ HAHA!", "Por favor, não. Tem gente comendo.", { fun: 12 }],
  ["dardos", "tav", "Jogar dardos", "bolt", 3, "AXE", "B", "Na mosca! Quer dizer, quase. Na mosca da parede.", "Eu só jogo se valer ouro.", { time: 30, fun: 10 }],
  ["mesaVira", "tav", "Desafiar no jogo do copo virado", "mug", 3, "EA", "SB", "Virou de primeira! Você é bom nisso.", "Isso é coisa de criança.", { fun: 10 }],
  ["historiaT", "tav", "Ouvir causos da taverna", "chat", 3, "BAG", "", "E aí o pescador puxou a rede... e veio uma sereia brava!", "Hoje eu não tô pra causo.", { time: 30, fun: 6 }],
  ["fofocaT", "tav", "Fofocar baixinho no canto", "eye", 3, "EXO", "S", "Psiu! Olha quem entrou... o Coletor Real, de folga!", "Fofoca dá briga, eu tô fora.", { rep: -1 }],
  ["dancaT", "tav", "Dançar em cima da mesa", "party", 3, "EAC", "SOB", "Sobe aqui também! A mesa aguenta!", "Desce daí, vai quebrar tudo!", { fun: 15, rep: -1, energy: -6 }],
  ["apostaT", "tav", "Apostar quem bebe mais devagar", "coin", 2, "XE", "B", "Você perdeu de propósito, eu vi! Hahaha!", "Aposta boba, não entro.", { cost: 4, fun: 8 }],
  ["confissao", "tav", "Contar um segredo depois da terceira caneca", "heart", 5, "GTB", "", "...Eu nunca vou contar pra ninguém. Prometo.", "Melhor você ir pra casa dormir.", { req: "friend" }],
  ["cantarAmor", "tav", "Cantar uma balada de amor", "note", 4, "TGO", "S", "*suspira* Foi pra mim essa?", "Desafinou no refrão, hein.", { req: "romance", fun: 8 }],
  ["levarCasa", "tav", "Levar para casa depois da festa", "house", 5, "GTO", "", "Obrigado por cuidar de mim... *soluço*", "Eu vou sozinho, tô ótimo! *tropeça*", { req: "friend", time: 30 }],
  ["receita", "papo", "Trocar receitas", "bread", 3, "GCB", "A", "A minha torta leva uma pitada de canela. Segredo de família!", "Eu queimo até água.", {}],
  ["sonhoNoite", "papo", "Contar um sonho estranho", "zzz", 3, "TBE", "S", "Sonhou que era um peixe? Eu sonhei que era uma batata!", "Sonho é só sonho.", {}],
  ["infancia", "papo", "Lembrar da infância", "baby", 4, "GTB", "O", "Eu subia na árvore da praça e não sabia descer!", "Prefiro não lembrar.", { req: "friend" }],
  ["planos", "papo", "Perguntar dos planos", "flag", 3, "ASX", "", "Quero abrir um negócio no Porto. Você investiria?", "Planos? Eu vivo um dia de cada vez.", {}],
  ["noticia", "papo", "Contar a notícia do dia", "scroll", 2, "XEO", "", "Não acredito! Preciso contar para todo mundo!", "Já sabia. Notícia velha.", {}],
  ["elogioFilho", "amigo", "Elogiar a família dele", "house", 3, "GBT", "", "Que gentileza! Vou contar lá em casa.", "Minha família é complicada...", {}],
  ["presenteFlor", "amigo", "Colher uma flor do caminho para dar", "flower", 3, "GTC", "S", "Para mim? Que fofura!", "Ah... obrigado. Eu tenho alergia.", {}],
  ["ajudaCarregar", "ajuda", "Ajudar a carregar lenha", "axe", 4, "SGO", "", "Com você ajudando, termino antes do almoço!", "Eu consigo sozinho, obrigado.", { energy: -6 }],
  ["consertarTelhado", "ajuda", "Consertar o telhado", "hammer", 5, "SGX", "", "Nunca mais vai pingar na minha cama! Obrigado!", "Eu chamo o Tonico, valeu.", { time: 60, energy: -8 }],
  ["cuidarHorta", "ajuda", "Cuidar da horta dele", "herb", 4, "GBC", "", "Minhas couves nunca estiveram tão bonitas!", "Cuidado com os tomates, são sensíveis.", { time: 45 }],
  ["passearCao", "ajuda", "Levar o cachorro para passear", "paw", 4, "CGT", "", "Ele voltou feliz e cansado. Perfeito!", "Ele só anda comigo, desculpe.", { time: 30, fun: 6 }],
  ["piqueniqueA", "ativ", "Fazer um piquenique", "apple", 5, "GTC", "S", "Que dia lindo! Precisamos fazer isso mais vezes.", "Formiga demais pra mim.", { req: "day", cost: 6, time: 60, fun: 12 }],
  ["pescarRio", "ativ", "Apostar quem pesca primeiro", "fish", 4, "ABE", "O", "Peguei! Ganhei! Hahaha!", "Os peixes não querem nada hoje.", { time: 60, fun: 8 }],
  ["colherFrutas", "ativ", "Colher frutas no pomar", "apple", 3, "GCA", "", "Essa maçã tá perfeita! Toma, é sua.", "Tá muito sol pra isso.", { req: "day", time: 40, fx: () => addItem("i_maca_vermelha") }],
  ["corridaCavalo", "ativ", "Apostar corrida a cavalo", "bolt", 4, "AO", "TB", "Você monta bem! Quase me passou!", "Cavalo me dá medo.", { req: () => !!player.horse, fun: 12 }],
  ["poemaAmor", "amor", "Escrever o nome dele no seu caderno", "book", 4, "TGO", "S", "Você... escreveu meu nome com coraçãozinho?", "Isso é coisa de adolescente!", { req: "romance" }],
  ["abracoForte", "amor", "Abraço apertado e demorado", "heart", 5, "GTC", "S", "*não solta* ...Só mais um pouquinho.", "Ok, ok, já deu.", { req: "partner" }],
  ["surpresa", "amor", "Preparar uma surpresa", "gift", 6, "GTOE", "", "Você fez tudo isso por mim? Eu vou chorar!", "Eu odeio surpresas, sério.", { req: "partner", cost: 20, fun: 10 }],
  ["roubarDoce", "mal", "Roubar o doce dele", "cake", -6, "", "", "Meu doce! Volta aqui!", "", { mean: true, rep: -2, fx: () => (player.food = Math.min(100, (player.food ?? 100) + 10)) }],
  ["imitarMal", "mal", "Imitar o jeito dele de andar", "laugh", -7, "", "", "Eu não ando assim! ...Ando?", "", { mean: true, rep: -1, fun: 4 }],
);
for (const r of INTERACTIONS.slice(-32)) INTER_BY_KEY[r[0]] = r;

/* ===================== MAIS PEDIDOS (MISSÕES) ===================== */

TOWN_QUESTS.push(
  { id: "aaLucas", town: "Cinzaluz", giver: "lucas", title: "Estoque da Festa", need: { hidromel: 3, i_cerveja_clara: 2 }, reward: { gold: 120, rel: 12 }, intro: "A próxima reunião dos Alcoólatras Anônimos vai ser histórica. Me arranja 3 Hidroméis e 2 Cervejas Claras?", done: "Agora sim! A reunião vai entrar para a ata. A Andressa vai anotar tudo." },
  { id: "aaMatheus", town: "Cinzaluz", giver: "matheus", title: "Sementes Raras", need: { i_abobora: 2, i_espiga_de_milho: 3 }, reward: { gold: 110, rel: 12, item: "i_torta_de_abobora" }, intro: "Quero plantar coisa nova na fazenda. Me traz 2 Abóboras e 3 Espigas de Milho para eu tirar as sementes?", done: "Ano que vem a fazenda vai ser a mais colorida do reino! Toma uma torta da Malu." },
  { id: "aaMarcos", town: "Cinzaluz", giver: "marcos", title: "Equipar a Guarda", need: { i_lingote_de_ferro: 2, i_couro_curtido: 2 }, reward: { gold: 180, rel: 12, rep: 3 }, intro: "Os novatos da guarda estão sem escudo. Preciso de 2 Lingotes de Ferro e 2 Couros Curtidos.", done: "Com isso a guarda fica pronta. Cinzaluz agradece, e eu também." },
  { id: "aaAndressa", town: "Cinzaluz", giver: "andressa", title: "O Atlas Perdido", need: { i_atlas_dos_reinos: 1 }, reward: { gold: 150, rel: 14 }, intro: "Uma das minhas bibliotecas perdeu o Atlas dos Reinos. A Livraria Pena de Ouro vende um. Pode trazer? É... para segurança.", done: "*folheia rápido* Perfeito. Agora sei exatamente onde fica... não importa. Obrigada." },
  { id: "aaMylena", town: "Cinzaluz", giver: "mylena", title: "Tintas da Mylena", need: { i_ametista: 1, i_girassol: 2, i_papoula: 1 }, reward: { gold: 140, rel: 14, item: "m_paisagem" }, intro: "Preciso de cores novas! Uma Ametista para o roxo, 2 Girassóis para o amarelo e 1 Papoula para o vermelho.", done: "Olha essa cor! Vou pintar o pôr do sol mais lindo de Cinzaluz. Fica com esta paisagem." },
  { id: "aaJulia", town: "Cinzaluz", giver: "juliaO", title: "Ração para o Abrigo", need: { i_coxa_de_frango: 2, i_sardinha: 3 }, reward: { gold: 130, rel: 14, rep: 4 }, intro: "Os bichinhos do abrigo estão com fome. Me traz 2 Coxas de Frango e 3 Sardinhas?", done: "Olha eles comendo! Você é um anjo. O Vini vai mandar um presente do Sul." },
  { id: "rosaFeira", town: "Cinzaluz", giver: "rosa", title: "Frutas para a Feira", need: { i_morango: 4, i_laranja: 3 }, reward: { gold: 70, rel: 8 }, intro: "Amanhã é dia de feira grande e minha banca está vazia. 4 Morangos e 3 Laranjas, por favor!", done: "Banca cheia, cliente feliz! Obrigada, meu bem." },
  { id: "brunoErvas", town: "Cinzaluz", giver: "bruno", title: "Ervas do Alquimista", need: { i_salvia: 2, i_camomila: 2, i_mandragora: 1 }, reward: { gold: 100, item: "i_pocao_de_vida_grande" }, intro: "Vou preparar um elixir novo. Preciso de 2 Sálvias, 2 Camomilas e 1 Mandrágora. Cuidado com a mandrágora: ela grita.", done: "Perfeito! Tome uma Poção de Vida Grande, fresquinha." },
  { id: "doranCristal", town: "Cinzaluz", giver: "doran", title: "O Cajado de Cristal", need: { i_quartzo_rosa: 2, i_diamante: 1 }, reward: { gold: 200, item: "i_bastao_de_cristal_puro" }, intro: "Quero fazer o cajado mais bonito da minha vida. Preciso de 2 Quartzos Rosa e 1 Diamante.", done: "Ficou perfeito! E é seu: o Bastão de Cristal Puro." },
  { id: "kaelTreino", town: "Cinzaluz", giver: "kael", title: "Bonecos Novos", need: { i_tabuas_de_pinho: 3, i_rolo_de_la: 1 }, reward: { gold: 90, rep: 2 }, intro: "Os bonecos de treino estão em pedaços. 3 Tábuas de Pinho e 1 Rolo de Lã resolvem.", done: "Bonecos novinhos! Os aprendizes vão apanhar deles agora." },
  { id: "curaFebre", town: "Cinzaluz", giver: "curandeira", title: "Remédio para a Febre", need: { i_xarope_de_mel: 2, i_cha_de_camomila: 2 }, reward: { gold: 120, rep: 4 }, intro: "Muita gente com febre nesta estação. Me traga 2 Xaropes de Mel e 2 Chás de Camomila para os doentes.", done: "Você ajudou muita gente hoje. A vila fica te devendo." },
  { id: "liaLivros", town: "Cinzaluz", giver: "lia", title: "Livros para a Escola", need: { i_contos_de_fadas: 1, i_almanaque_do_campones: 1 }, reward: { gold: 90, rel: 10 }, intro: "As crianças da escola leram tudo! Pode trazer Contos de Fadas e um Almanaque do Camponês?", done: "As crianças vão adorar! Obrigada, de verdade." },
  { id: "capitaoRede", town: "Porto Brisamar", giver: "capitao", title: "Rede Nova", need: { i_rolo_de_algodao: 2, i_corda: 0 }, reward: { gold: 110, rep: 2 }, intro: "Minha rede rasgou numa pedra. Me traz 2 Rolos de Algodão que eu costuro outra.", done: "Rede nova, pesca farta! Obrigado, marujo." },
  { id: "anciaFossil", town: "Pedravale", giver: "ancia", title: "Memórias da Serra", need: { i_fossil_de_concha: 1, i_moeda_antiga: 1 }, reward: { gold: 160, rep: 3 }, intro: "Quero deixar um museu para os meus netos. Um Fóssil de Concha e uma Moeda Antiga seriam um começo.", done: "Meu pequeno museu começou! Pedravale nunca vai esquecer você." },
);
for (const q of TOWN_QUESTS) for (const k of Object.keys(q.need)) if (!q.need[k]) delete q.need[k];
