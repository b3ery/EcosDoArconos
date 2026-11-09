/* 27-almas-e-autonomia.js: junta 41-almas.js, 42-vida-autonoma.js. */
/**
 * ECOS DO ARCANO — 27-almas-e-autonomia.js
 * Cada pessoa tem um jeito de ser:
 *  - gênero, personalidade (2 traços) e orientação (de quem ela gosta);
 *  - casais entre os moradores (além dos casais da turma);
 *  - você escolhe a sua personalidade e a sua orientação no criador;
 *  - gerador de falas: frases montadas por partes (abertura + assunto + fecho),
 *    usando o que está acontecendo no jogo, com memória para não repetir;
 *  - conversas entre duas pessoas (usadas pelos moradores na rua e nos diálogos).
 */

"use strict";

/* ===================== GÊNERO ===================== */

const NPC_GENDER = {
  rainha: "f", odelia: "f", bruno: "m", rosa: "f", doran: "m", ferreiro: "m", curandeira: "f", kael: "m", lia: "f",
  iara: "f", tome: "m", marina: "f", tobias: "m", capitao: "m", cocheiro2: "f", nicoP: "m", mercOri: "f", minerA: "m",
  peleiro: "m", ancia: "f", cocheiro3: "m", cocheiro: "m", zaid: "m",
  lucas: "m", matheus: "m", marcos: "m", andressa: "f", mylena: "f", juliaO: "f", malu: "f", julia: "f", pedro: "m",
  gabriel: "m", vini: "m", luca: "m",
};
function npcGender(id) {
  if (NPC_GENDER[id]) return NPC_GENDER[id];
  const n = ((NPCS[id] && NPCS[id].nome) || id || "").split(/[ ,]/)[0];
  return /a$/i.test(n) ? "f" : "m";
}
/** Palavra no gênero da pessoa: gw("lucas", "o", "a") → "o". */
function gw(id, m, f) {
  return npcGender(id) === "f" ? f : m;
}

/* ===================== PERSONALIDADE ===================== */

const TRAITS = {
  extro: { m: "Extrovertido", f: "Extrovertida", ic: "party", d: "Fala com todo mundo e puxa conversa." },
  timido: { m: "Tímido", f: "Tímida", ic: "blush", d: "Fala pouco, fica vermelho fácil." },
  romant: { m: "Romântico", f: "Romântica", ic: "heart", d: "Ama o amor. Flertes dão mais certo." },
  ciumento: { m: "Ciumento", f: "Ciumenta", ic: "eye", d: "Não suporta ver ninguém de olho no seu par." },
  esquentado: { m: "Esquentado", f: "Esquentada", ic: "anger", d: "Pavio curto. Briga por qualquer coisa." },
  calmo: { m: "Calmo", f: "Calma", ic: "flower", d: "Respira fundo antes de tudo." },
  engracado: { m: "Engraçado", f: "Engraçada", ic: "laugh", d: "Sempre tem uma piada pronta." },
  serio: { m: "Sério", f: "Séria", ic: "meh", d: "Pouca brincadeira, muita responsabilidade." },
  fofoqueiro: { m: "Fofoqueiro", f: "Fofoqueira", ic: "chat", d: "Sabe da vida de todo mundo." },
  generoso: { m: "Generoso", f: "Generosa", ic: "gift", d: "Divide tudo o que tem." },
  ambicioso: { m: "Ambicioso", f: "Ambiciosa", ic: "coin", d: "Quer ouro, fama e um cargo melhor." },
  preguicoso: { m: "Preguiçoso", f: "Preguiçosa", ic: "zzz", d: "Banco de praça é o lugar favorito." },
  aventureiro: { m: "Aventureiro", f: "Aventureira", ic: "sword", d: "Sonha com estradas e dragões." },
  intelectual: { m: "Intelectual", f: "Intelectual", ic: "book", d: "Livros, perguntas e mais livros." },
  rebelde: { m: "Rebelde", f: "Rebelde", ic: "flag", d: "Desconfia da coroa e de qualquer regra." },
  galanteador: { m: "Galanteador", f: "Galanteadora", ic: "heart", d: "Dá em cima de todo mundo. Até de gente casada." },
  dramatico: { m: "Dramático", f: "Dramática", ic: "sweat", d: "Tudo vira uma tragédia (ou uma novela)." },
  leal: { m: "Leal", f: "Leal", ic: "smile", d: "Defende os amigos até o fim." },
};
/** Cada pessoa tem 3 traços, e nenhuma combinação se repete. */
const NPC_TRAITS_FIXED = {
  lucas: ["galanteador", "rebelde", "extro"], luca: ["rebelde", "engracado", "intelectual"], matheus: ["leal", "calmo", "generoso"], malu: ["ciumento", "generoso", "romant"],
  marcos: ["serio", "esquentado", "leal"], julia: ["ciumento", "dramatico", "romant"], andressa: ["intelectual", "fofoqueiro", "ambicioso"], gabriel: ["romant", "dramatico", "timido"],
  mylena: ["extro", "romant", "engracado"], pedro: ["ciumento", "leal", "esquentado"], juliaO: ["generoso", "extro", "aventureiro"], vini: ["esquentado", "ambicioso", "ciumento"],
  rainha: ["serio", "ambicioso", "dramatico"], odelia: ["intelectual", "calmo", "serio"], bruno: ["engracado", "ciumento", "preguicoso"], rosa: ["fofoqueiro", "generoso", "extro"],
  ferreiro: ["esquentado", "leal", "ambicioso"], curandeira: ["calmo", "romant", "generoso"], kael: ["serio", "aventureiro", "timido"], lia: ["extro", "engracado", "aventureiro"],
  iara: ["timido", "intelectual", "romant"], tome: ["serio", "leal", "preguicoso"], marina: ["aventureiro", "esquentado", "engracado"], tobias: ["timido", "ciumento", "leal"],
  capitao: ["ciumento", "esquentado", "dramatico"], zaid: ["ambicioso", "engracado", "galanteador"], doran: ["preguicoso", "galanteador", "calmo"], ancia: ["fofoqueiro", "calmo", "intelectual"],
  cocheiro2: ["extro", "aventureiro", "galanteador"], nicoP: ["engracado", "timido", "generoso"], mercOri: ["ambicioso", "fofoqueiro", "calmo"], minerA: ["esquentado", "preguicoso", "leal"],
  peleiro: ["timido", "aventureiro", "generoso"], cocheiro3: ["dramatico", "engracado", "fofoqueiro"], cocheiro: ["preguicoso", "extro", "fofoqueiro"],
};
const TRAIT_ASSIGN = {};
/** Para quem não está na lista: sorteia 3 traços que ninguém mais tem (fixo por pessoa). */
function assignTraits(id) {
  const keys = Object.keys(TRAITS);
  const used = new Set(Object.values(NPC_TRAITS_FIXED).concat(Object.values(TRAIT_ASSIGN)).map((t) => t.slice().sort().join("|")));
  let h = hashStr(id || "x");
  for (let k = 0; k < 400; k++) {
    const pick = [];
    for (let j = 0; pick.length < 3 && j < 12; j++) {
      const t = keys[(h >>> (j * 3)) % keys.length];
      if (!pick.includes(t)) pick.push(t);
      if (j % 3 === 2) h = Math.imul(h ^ (j + 7), 2654435761) >>> 0;
    }
    if (pick.length === 3 && !used.has(pick.slice().sort().join("|"))) return pick;
    h = Math.imul(h ^ (k + 101), 16777619) >>> 0;
  }
  return ["calmo", "leal", "generoso"];
}
function hashStr(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}
function npcTraits(id) {
  if (NPC_TRAITS_FIXED[id]) return NPC_TRAITS_FIXED[id];
  if (!id) return [];
  return (TRAIT_ASSIGN[id] = TRAIT_ASSIGN[id] || assignTraits(id));
}
function hasTrait(id, t) {
  return id === "player" ? (player.traits || []).includes(t) : npcTraits(id).includes(t);
}
function traitName(t, g) {
  return TRAITS[t] ? (g === "f" ? TRAITS[t].f : TRAITS[t].m) : t;
}
function traitsText(id) {
  const n = npcTraits(id).map((t) => traitName(t, npcGender(id)).toLowerCase());
  return n.length > 1 ? n.slice(0, -1).join(", ") + " e " + n[n.length - 1] : n.join("");
}

/* ===================== ORIENTAÇÃO ===================== */

const ORIENTS = {
  hetero: { n: "Hétero", d: "Gosta do gênero oposto." },
  homo: { n: "Gay / Lésbica", d: "Gosta do mesmo gênero." },
  bi: { n: "Bi", d: "Gosta de homens e de mulheres." },
  pan: { n: "Pan", d: "Gosta de pessoas, sem importar o gênero." },
  ace: { n: "Assexual", d: "Não sente atração romântica (amizades valem ouro)." },
};
/** Casais entre os moradores (a turma tem os seus em NPC_MARRIED). */
const NPC_COUPLES = [
  ["ferreiro", "curandeira"],
  ["rosa", "bruno"],
  ["marina", "capitao"],
  ["iara", "mercOri"],
  ["tobias", "nicoP"],
];
/** Orientação de cada um (os casais combinam entre si). */
const NPC_ORIENT_FIXED = {
  lucas: "bi", luca: "ace", matheus: "hetero", malu: "bi", marcos: "hetero", julia: "pan", andressa: "bi", gabriel: "pan", mylena: "bi", pedro: "hetero",
  juliaO: "pan", vini: "bi", rainha: "hetero", odelia: "ace", bruno: "bi", rosa: "hetero", doran: "pan", ferreiro: "bi", curandeira: "hetero", kael: "homo",
  iara: "homo", mercOri: "bi", tome: "hetero", marina: "pan", capitao: "hetero", tobias: "homo", nicoP: "pan", cocheiro2: "homo", minerA: "hetero",
  peleiro: "bi", cocheiro3: "bi", cocheiro: "hetero", zaid: "pan", ancia: "hetero",
};
function npcOrient(id) {
  if (NPC_ORIENT_FIXED[id]) return NPC_ORIENT_FIXED[id];
  const r = hashStr("o" + id) % 100;
  return r < 42 ? "hetero" : r < 62 ? "bi" : r < 78 ? "homo" : r < 92 ? "pan" : "ace";
}
function playerOrient() {
  return player.orient || "bi";
}
/** Gosta de alguém deste gênero? (m, f ou n) */
function likesGender(orient, myG, otherG, salt) {
  if (orient === "ace") return false;
  if (orient === "bi" || orient === "pan") return true;
  if (otherG === "n" || myG === "n") return hashStr(salt || "") % 2 === 0;
  return orient === "hetero" ? myG !== otherG : myG === otherG;
}
/** Esta pessoa sente atração por você? */
function attractedTo(id) {
  // O Lucas é bi, mas tem muito mais chance de se interessar por mulher.
  if (id === "lucas") return player.gender === "f" || hashStr("lm" + (player.name || "")) % 100 < (player.gender === "m" ? 30 : 60);
  return likesGender(npcOrient(id), npcGender(id), player.gender || "n", id + (player.name || ""));
}
/** Você sente atração por esta pessoa (pela orientação que escolheu)? */
function playerLikes(id) {
  return likesGender(playerOrient(), player.gender || "n", npcGender(id), "p" + id);
}
/** Com quem a pessoa é casada (fora você). */
function npcSpouse(id) {
  if (!id || player.spouse === id || player.dating === id) return null;
  if (typeof NPC_MARRIED !== "undefined" && NPC_MARRIED[id]) return NPC_MARRIED[id];
  for (const [a, b] of NPC_COUPLES) {
    if (a === id && player.spouse !== b && player.dating !== b) return b;
    if (b === id && player.spouse !== a && player.dating !== a) return a;
  }
  return null;
}
/** Todo mundo que é casado odeia o Lucas Marzocca. */
function hatesMarzoca(id) {
  return !!id && id !== "lucas" && !!npcSpouse(id);
}
const shortName = (id) => (NPCS[id] ? NPCS[id].nome.split(",")[0] : id);

/* ===================== GERADOR DE FALAS ===================== */

const pk = (a) => a[Math.floor(Math.random() * a.length)];
const LINE_MEM = [];
/** Escolhe sem repetir as últimas falas (memória de 240 frases). */
function freshPick(gen, tries = 10) {
  let s = gen();
  for (let i = 0; i < tries && LINE_MEM.includes(s); i++) s = gen();
  LINE_MEM.push(s);
  if (LINE_MEM.length > 240) LINE_MEM.shift();
  return s;
}
const OPEN = {
  base: ["", "", "", "Olha só,", "Sabe de uma coisa?", "Escuta essa:", "Cá entre nós,", "Eu tava pensando...", "Ai, ai...", "Bom,", "Ei,", "Então,", "Vou te contar:", "Pois é,", "Rapaz,", "Menina,", "Por todas as runas,", "Nem te conto:", "Sinceramente,", "Juro:"],
  timido: ["Hã...", "D-desculpa, é que...", "*olha pro chão*", "Eu... hum...", "*fala baixinho*"],
  engracado: ["HAHA, escuta:", "Pronto, lá vem:", "Segura o riso:", "Essa é boa:"],
  serio: ["Vou ser direto:", "Falando sério:", "Sem rodeios:"],
  dramatico: ["AI, que dia!", "Você não vai ACREDITAR:", "*suspiro longo*", "Tragédia!"],
  fofoqueiro: ["Menina, você não sabe da maior!", "Fofoca fresquinha:", "Não espalha:", "Fiquei sabendo de uma:"],
  rebelde: ["Abre o olho:", "Ninguém fala disso, mas"],
  romant: ["Ai, o amor...", "*suspira*"],
};
const TAIL = {
  base: ["", "", "", "", "Enfim.", "Mas fazer o quê, né?", "Acredita?", "Pensa nisso.", "Vida que segue.", "Só digo isso.", "Né?", "Que coisa.", "Tô te falando!", "Vê se pode."],
  engracado: ["HAHAHA!", "...tá, essa foi ruim.", "Ri, vai!"],
  timido: ["...esquece.", "*cora*", "Desculpa falar tanto."],
  dramatico: ["Eu NÃO aguento!", "Que novela!"],
  fofoqueiro: ["Mas você não ouviu de mim!", "Bico calado, hein!"],
  serio: ["É isso.", "Fica a dica."],
};
const PLACES = ["na praça", "na frente da taverna", "perto da fonte", "no mercado", "atrás do celeiro", "na porta da biblioteca", "no Bairro das Flores", "na beira do rio", "no Templo da Luz", "no moinho", "na escadaria do castelo", "na padaria", "embaixo da árvore grande", "na feira", "no estábulo"];
const COUPLE_ACTS = ["de mãos dadas", "discutindo baixinho", "dividindo um pão de mel", "rindo à toa", "dançando sem música", "trocando bilhetinhos", "olhando as estrelas", "brigando por causa de um gato", "comprando flores", "num abraço apertado", "fazendo planos pro casamento", "fingindo que não se conheciam"];
const CREW_DEEDS = [
  "levou um balde de água fria na cabeça", "ganhou no xadrez do Gus três vezes seguidas", "cantou desafinado na taverna e todo mundo aplaudiu", "dormiu no banco da praça de novo", "comprou um chapéu horroroso e acha lindo", "adotou mais um gato", "tropeçou na escadaria do castelo", "disse que viu um dragão no céu", "fez uma torta que explodiu", "foi pego dançando sozinho no moinho", "tentou pescar com a mão", "pintou o próprio cavalo de azul", "escreveu um poema pra uma vassoura", "discutiu com um ganso e perdeu", "jurou que vai acordar cedo amanhã",
  "pagou uma rodada pra taverna inteira", "chorou vendo o pôr do sol", "pediu desculpa pra uma árvore", "ensinou as crianças a assobiar", "trocou o sal pelo açúcar na padaria",
];
const DREAMS = ["abrir uma taverna só minha", "conhecer o mar do Porto Brisamar", "aprender a ler as runas antigas", "ter um cavalo branco", "casar numa festa com fogos", "ver um dragão de perto (de longe, na verdade)", "viajar até Pedravale", "escrever um livro", "ter uma horta enorme", "pintar o céu de Cinzaluz", "dormir uma semana inteira", "ganhar o Festival da Colheita", "morar num sobrado com quintal", "ser cavaleiro da Rainha", "fazer as pazes com meu irmão", "aprender a dançar valsa", "ter uma biblioteca em casa"];
const FOODS = ["um ensopado do Gus", "pão de mel da Rosa", "um peixe assado", "torta de abóbora", "sopa de cebola", "um queijo duro feito pedra", "maçã do amor", "bolo de fubá", "cogumelo da floresta", "mingau de aveia"];
const FOOD_REACT = ["foi a melhor coisa da semana", "me arrependi na hora", "repeti três vezes", "minha barriga ainda reclama", "quase chorei de felicidade", "dei metade pro cachorro"];
const MEMORIES = ["o festival em que choveu confete", "quando o lago congelou e todo mundo patinou", "o dia em que o sino do templo caiu", "a noite em que faltou hidromel na taverna", "quando a Rainha tropeçou no desfile", "o inverno em que a neve cobriu as portas", "a vez que o Lucas fugiu de três maridos no mesmo dia"];
const COMPLAINTS = ["O Imposto Real subiu de novo.", "Meu joelho avisa quando vai chover.", "Ninguém respeita mais a fila da padaria.", "As galinhas do vizinho fugiram pro meu quintal.", "A estrada pro Porto está cheia de buraco.", "Meu telhado pinga bem em cima da cama.", "O galo cantou às três da manhã.", "Os preços da feira estão um absurdo."];
const PHILO = ["Quem planta cedo colhe antes.", "Toda runa já foi só um rabisco um dia.", "A vida é curta, o inverno é comprido.", "Amizade é ouro que não paga imposto.", "Quem conta um segredo ganha um inimigo.", "Coragem é ter medo e ir mesmo assim."];
const WEATHER_TALK = {
  sol: ["esse sol tá de rachar o chapéu", "dia bom pra secar roupa", "o sol hoje tá de bom humor"],
  nublado: ["esse céu cinza dá preguiça", "parece que vai chover e não chove", "dia de ficar em casa com chá"],
  chuva: ["essa chuva não para nunca", "meus sapatos estão encharcados", "a chuva é boa pra horta, ruim pro meu cabelo"],
  tempestade: ["com esses trovões nem o cachorro sai de casa", "quase levei um raio na cabeça", "a tempestade derrubou a cerca do vizinho"],
  neve: ["essa neve vai cobrir as portas", "fiz um boneco de neve igualzinho à Rainha", "meus dedos viraram picolé"],
  neblina: ["nessa neblina eu dei bom dia pra um poste", "não enxergo um palmo na frente", "neblina assim esconde fantasma"],
};
/** Notícias recentes da vila (protestos, brigas, perseguições). Ficam 3 dias. */
function vilaNews(text) {
  player.news = (player.news || []).filter((n) => player.day - n.d <= 3);
  player.news.push({ d: player.day, t: text });
  if (player.news.length > 12) player.news.shift();
}
function someCouple() {
  const pairs = NPC_COUPLES.slice();
  if (typeof NPC_MARRIED !== "undefined") for (const [a, b] of Object.entries(NPC_MARRIED)) if (a < b) pairs.push([a, b]);
  return pk(pairs);
}
function someCrew(not) {
  const pool = (typeof CREW_ALL !== "undefined" ? CREW_ALL : ["lucas"]).filter((k) => k !== not && NPCS[k]);
  return pk(pool);
}
function wthr() {
  return (typeof currentWeather === "function" && player.weather) || "sol";
}
function partOfDay() {
  const h = typeof currentHour === "function" ? currentHour() : 12;
  return h < 6 ? "madrugada" : h < 12 ? "manhã" : h < 18 ? "tarde" : "noite";
}
/** Assuntos: cada um devolve uma frase pronta, conforme quem fala. */
const TOPICS = {
  clima: () => `${pk(["Ai,", "Olha,", "Rapaz,", ""])} ${pk(WEATHER_TALK[wthr()] || WEATHER_TALK.sol)}.`.trim(),
  hora: () =>
    ({
      madrugada: pk(["O que você faz acordado a essa hora?", "Madrugada é hora de fantasma e de padeiro.", "Não consigo dormir, a lua tá muito clara."]),
      manhã: pk(["Manhã boa é manhã com café.", "Acordei com o pé esquerdo hoje.", "O galo me acordou antes do sol de novo."]),
      tarde: pk(["Essa hora da tarde dá um soninho...", "A tarde passa voando quando tem trabalho.", "Já é tarde e eu nem almocei."]),
      noite: pk(["De noite a taverna fica boa.", "Olha quantas estrelas hoje.", "Noite é hora de contar segredo."]),
    })[partOfDay()],
  casal: () => {
    const [a, b] = someCouple();
    return `${pk(["Vi", "Peguei", "Passei e vi"])} ${shortName(a)} e ${shortName(b)} ${pk(COUPLE_ACTS)} ${pk(PLACES)}.`;
  },
  turma: (id) => `${pk(["Sabia que", "Diz que", "Ontem", "Hoje cedo"])} ${shortName(someCrew(id))} ${pk(CREW_DEEDS)}?`.replace(/^(Ontem|Hoje cedo) (.*)\?$/, "$1 $2!"),
  lucas: (id) =>
    hatesMarzoca(id)
      ? pk([
          `Se eu pegar o Marzoca olhando pra ${npcSpouse(id) ? shortName(npcSpouse(id)) : "minha família"} de novo...`,
          "Odeio aquele Lucas Marzocca. Com todas as forças das runas.",
          "Todo casado dessa vila tem um motivo pra correr atrás do Marzoca.",
          "O Marzoca passou na minha rua. Tranquei a porta e escondi a aliança.",
          `${shortName(npcSpouse(id))} diz que o Lucas é engraçado. EU não acho graça nenhuma.`,
          "Vou fazer um abaixo-assinado pra expulsar o Marzoca da vila.",
        ])
      : pk([
      `Lucas Marzocca deu em cima d${pk(["a mulher do ferreiro", "o marido da Rosa", "a esposa do Capitão", "a Princesa Julia", "a Duquesa Malu"])} e saiu correndo ${pk(PLACES)}!`,
      "O Marzoca de novo fugindo de marido bravo. Esse aí não aprende!",
      "Se ouvir alguém gritando 'VOLTA AQUI, MARZOCA', não se assuste. É terça-feira.",
      `O Lucas jura que só estava ${pk(["pedindo informação", "elogiando o chapéu", "ajudando a carregar a cesta"])}. Sei.`,
      "Dizem que o Lucas já correu mais de marido do que de lobo.",
    ]),
  voce: (id) => {
    const rep = player.rep ?? 50,
      f = id && FRIENDS[id] ? friendship(id) : 30;
    if (player.spouse && Math.random() < 0.35) return `E ${shortName(player.spouse)}, como vai? ${pk(["Manda um abraço!", "Vocês formam um casal bonito.", "Cuida bem, hein!"])}`;
    if (hatesMarzoca(id) && FRIENDS.lucas && friendshipLevel("lucas") >= 2 && Math.random() < 0.4) return pk(["Vi você andando com o Marzoca. Escolhe melhor as amizades, viu?", "Amig" + genderWord("o", "a", "e") + " do Lucas Marzocca, é? Hmm.", "Fala pro seu amigo Marzoca ficar longe da minha casa."]);
    if (rep < 30) return pk(["Andam falando umas coisas de você por aí...", "Não sei se posso confiar em você ainda.", "Sua fama não anda boa, viu?"]);
    if (f > 60) return pk([`${player.name}, você é das minhas pessoas favoritas.`, "Que bom que você passou por aqui!", "Com você por perto o dia melhora."]);
    return pk([`${player.name}, você parece cansad${genderWord("o", "a", "e")}.`, "Você é novo por aqui ou só parece?", "Gostei do seu jeito, sabia?", "Você sempre aparece na hora certa."]);
  },
  coroa: (id) =>
    hasTrait(id, "rebelde")
      ? pk(["A Rainha mora num castelo e eu num quarto com goteira. Justo?", "O Luca tem razão: o povo devia decidir.", "Conselho do povo já!", "Imposto pra pagar coroa nova? Não, obrigado."])
      : pk(["A Rainha Aurélia cuida bem da vila, apesar de tudo.", "Esses iluministas fazem um barulho!", "Coroa ou conselho, eu só quero pão barato.", "Vi a carruagem real hoje. Que luxo!"]),
  sonho: () => `${pk(["Um dia eu quero", "Meu sonho é", "Antes de ficar velho eu vou", "Às vezes penso em"])} ${pk(DREAMS)}.`,
  comida: () => `${pk(["Hoje eu comi", "Ontem jantei", "Provei"])} ${pk(FOODS)} e ${pk(FOOD_REACT)}.`,
  lembranca: () => `${pk(["Lembra", "Você lembra de", "Nunca esqueço"])} ${pk(MEMORIES)}?`,
  reclama: () => pk(COMPLAINTS),
  filosofia: () => `${pk(["Minha avó dizia:", "Aprendi uma coisa:", "Escreve aí:"])} ${pk(PHILO)}`,
  noticia: () => {
    const n = (player.news || []).filter((x) => player.day - x.d <= 3);
    return n.length ? `${pk(["Você viu?", "Ficou sabendo?", "A vila só fala disso:"])} ${pk(n).t}` : TOPICS.clima();
  },
  amor: (id) => {
    const sp = npcSpouse(id);
    if (sp) return pk([`${shortName(sp)} me trouxe flores hoje. Depois de anos!`, `Brigar com ${shortName(sp)} é rápido, fazer as pazes é melhor.`, `${shortName(sp)} ronca. Mas eu amo assim mesmo.`]);
    return pk(["Ai, queria alguém pra dividir o pôr do sol.", "O amor tá difícil nessa vila.", "Tem uma pessoa que não sai da minha cabeça...", "Solteiro e feliz. Às vezes."]);
  },
};
const TOPIC_W = { clima: 2, hora: 2, casal: 2, turma: 3, lucas: 2, voce: 2, coroa: 2, sonho: 2, comida: 2, lembranca: 1, reclama: 2, filosofia: 1, noticia: 3, amor: 2 };
function pickTopic(id) {
  const w = { ...TOPIC_W };
  if (hasTrait(id, "fofoqueiro")) (w.casal += 3), (w.lucas += 2), (w.noticia += 2);
  if (hasTrait(id, "rebelde")) w.coroa += 4;
  if (hasTrait(id, "romant")) w.amor += 3;
  if (hasTrait(id, "intelectual")) w.filosofia += 3;
  if (hasTrait(id, "preguicoso")) w.reclama += 2;
  if (!(player.news || []).length) w.noticia = 0;
  let r = Math.random() * Object.values(w).reduce((a, b) => a + b, 0);
  for (const [k, v] of Object.entries(w)) if ((r -= v) < 0) return k;
  return "clima";
}
function traitBank(bank, id) {
  const tr = id ? npcTraits(id) : [];
  let pool = bank.base.slice();
  for (const t of tr) if (bank[t]) pool = pool.concat(bank[t], bank[t]);
  return pool;
}
/** Uma fala nova para a pessoa (id do NPC, ou null para um morador sem nome). */
function genLine(id, topic) {
  return freshPick(() => {
    const t = topic || pickTopic(id);
    const body = (TOPICS[t] || TOPICS.clima)(id);
    const o = pk(traitBank(OPEN, id)),
      e = pk(traitBank(TAIL, id));
    const first = body.split(/[ ,.!?:]/)[0];
    const proper = !first || first === player.name || /^(Lucas|Luca|Rainha|Marzoca|Iluministas|O Lucas|Imposto)$/.test(first) || Object.values(NPCS).some((n) => n.nome && n.nome.split(/[ ,]/)[0] === first) || (typeof WALKER_NAMES !== "undefined" && WALKER_NAMES.includes(first));
    const lower = o && !/[.!?:*]$/.test(o) && !proper ? body.charAt(0).toLowerCase() + body.slice(1) : body;
    return [o, o ? lower : body, e].filter(Boolean).join(" ").replace(/\s+/g, " ");
  });
}

/* ===================== CONVERSA ENTRE DUAS PESSOAS ===================== */

const REPLY = {
  concorda: ["Verdade!", "Nem me fale.", "Eu falei isso ontem!", "Pois é, {A}.", "Exatamente!", "Tô contigo."],
  discorda: ["Ah, discordo.", "Você exagera, {A}.", "Não foi bem assim...", "Hmm, não sei não.", "Quem te contou isso?"],
  ri: ["HAHAHA!", "Para, {A}, assim eu choro de rir!", "Kkkkk, só você mesmo.", "*ri alto*"],
  espanta: ["NÃO!", "Mentira!", "Sério?!", "Pelas runas!", "Tá brincando!"],
  timido: ["*concorda com a cabeça*", "Ah... é.", "Hum, legal."],
  bravo: ["E daí?", "Não quero saber disso, {A}.", "Lá vem você de novo."],
};
const FOLLOW = ["Juro! Pergunta pra {X}.", "Por isso eu falo: abre o olho.", "Eu vi com estes olhos!", "E não foi a primeira vez.", "Mas fica entre nós.", "Ainda vai dar o que falar.", "Ah, {A}, você me conhece.", "Depois eu te conto o resto."];
const BYE = ["Bom, deixa eu ir.", "Depois a gente se fala!", "Vou contar pra {X}!", "Tchau, {A}!", "Até mais tarde!", "Bora, que o dia não espera.", "Fui!", "Cuida-se, {A}."];
const SWEET = [
  ["Bom dia, meu amor.", "Bom dia! Dormiu bem?"],
  ["Trouxe isso pra você.", "Ai, você lembrou!"],
  ["Hoje tem janta especial?", "Se você lavar a louça, tem."],
  ["Você tá linda(o) hoje.", "Só hoje?"],
];
const FIGHT = [
  ["Você esqueceu de novo!", "Esqueci o quê?!"],
  ["Por que você chegou tarde?", "Eu estava trabalhando!"],
  ["Para de me interromper!", "Eu NÃO interrompi—"],
];
/**
 * Diálogo de 4 a 6 falas entre a e b ({id?, nome}).
 * Devolve [[nome, fala], ...]. Casais trocam carinho (ou brigam), os outros fofocam.
 */
function genExchange(a, b) {
  const A = a.nome,
    B = b.nome,
    X = shortName(someCrew(a.id));
  // {A} = com quem se fala; {X} = alguém da turma.
  const fillB = (s) => s.replace(/\{A\}/g, A).replace(/\{B\}/g, A).replace(/\{X\}/g, X);
  const fillA = (s) => s.replace(/\{A\}/g, B).replace(/\{B\}/g, B).replace(/\{X\}/g, X);
  const out = [];
  const married = a.id && b.id && npcSpouse(a.id) === b.id;
  // Casados contra o Marzoca: sempre dá confusão.
  const lu = a.id === "lucas" ? a : b.id === "lucas" ? b : null,
    ca = lu === a ? b : a;
  if (lu && hatesMarzoca(ca.id)) {
    const L = lu.nome,
      C = ca.nome;
    const opener = lu === a ? [L, pk([`E aí, ${C}! Como vai a família? Manda um beijo pr${gw(npcSpouse(ca.id), "o", "a")} ${shortName(npcSpouse(ca.id))}!`, `Bom dia, ${C}! Que dia lindo, né? Tipo a sua família.`, `${C}, meu amigo! Calma, eu só passei pra dar oi.`])] : [C, pk(["Ih, olha quem apareceu. O Marzoca.", `Fica longe de mim, ${L}.`, "Pode ir dando meia-volta, Marzoca!"])];
    const angry = [C, pk([`Nem vem, ${L}! Tô de olho em você.`, "Sai daqui antes que eu perca a paciência!", `Se chegar perto d${gw(npcSpouse(ca.id), "o", "a")} ${shortName(npcSpouse(ca.id))}, eu juro...`, "Marzoca, você é um perigo pra qualquer casamento!"])];
    const excuse = [L, pk(["Que isso! Eu sou um homem de respeito!", "Calma, calma! Eu só sou simpático!", "Por que todo casado me trata assim? Injustiça!", "Eu? Eu nem gosto de... tá bom, gosto de todo mundo."])];
    const last = [C, pk(["SOME!", "Respeito? Você?! Hahaha. Some daqui.", "Última vez que eu aviso, Marzoca!", "*cospe no chão* Hmpf."])];
    return lu === a ? [opener, angry, excuse, last] : [opener, excuse, angry, [L, pk(["Tá bom, tá bom, já fui! ...Manda um beijo pra família!", "Nossa, que recepção calorosa.", "Um dia vocês ainda vão me amar."])], last];
  }
  if (married && Math.random() < 0.6) {
    const pair = Math.random() < 0.7 ? pk(SWEET) : pk(FIGHT);
    out.push([A, pair[0]], [B, pair[1]], [A, Math.random() < 0.5 ? genLine(a.id, "amor") : pk(["Te amo, viu?", "Bobo(a).", "Tá bom, tá bom."])]);
    return out;
  }
  const topic = pickTopic(a.id);
  out.push([A, genLine(a.id, topic)]);
  const angry = b.id && hasTrait(b.id, "esquentado") && Math.random() < 0.25;
  const kind = angry ? "bravo" : b.id && hasTrait(b.id, "timido") ? "timido" : pk(["concorda", "concorda", "discorda", "ri", "espanta"]);
  out.push([B, fillB(pk(REPLY[kind]))]);
  if (kind === "discorda" || kind === "espanta" || kind === "bravo") out.push([A, fillA(pk(FOLLOW))]);
  if (Math.random() < 0.6) out.push([B, genLine(b.id, Math.random() < 0.5 ? topic : null)]);
  if (Math.random() < 0.5) out.push([A, fillA(pk(REPLY[pk(["concorda", "ri", "espanta"])]))]);
  const byeA = Math.random() < 0.5;
  out.push([byeA ? A : B, (byeA ? fillA : fillB)(pk(BYE))]);
  return out;
}

/* ===================== FALAS NO JOGO ===================== */

/* Bater papo: metade das vezes a pessoa fala uma frase nova montada na hora. */
{
  const pickBase = pickUnheard;
  pickUnheard = function (key, pool) {
    if (NPCS[key] && FRIENDS[key] && Math.random() < (lifeMode() ? 0.6 : 0.4)) return genLine(key);
    return pickBase(key, pool);
  };
}
/* Moradores sem nome também falam frases novas na rua. */
{
  const gossipBase = gossipLines;
  gossipLines = function () {
    const base = gossipBase();
    return base.concat(Array.from({ length: 6 }, () => genLine(null)));
  };
}

/* ===================== VOCÊ: PERSONALIDADE E ORIENTAÇÃO ===================== */

/** Seus traços dão bônus de amizade nas interações que combinam com eles. */
const TRAIT_CAT_BONUS = { extro: "amigo", engracado: "graca", romant: "amor", intelectual: "papo", generoso: "ajuda", leal: "ajuda", galanteador: "cor", calmo: "paz" };
{
  const doBase = doInteraction;
  doInteraction = function (id, key) {
    const r = INTER_BY_KEY[key];
    const cat = r && r[1];
    // Flertar com quem não sente atração por você não dá certo (mas sem drama).
    if ((cat === "amor" || cat === "cor") && !isRomanticWith(id) && !attractedTo(id) && !isChildNpc(id)) {
      hidePie();
      const n = shortName(id);
      const g = player.gender === "f" ? "mulheres" : player.gender === "m" ? "homens" : "você desse jeito";
      addFriendship(id, 1);
      return say([[n, npcOrient(id) === "ace" ? pk(["Ah, que fofo... mas eu não sinto essas coisas por ninguém. Amizade?", "Romance não é pra mim. Mas um chá eu aceito!"]) : pk([`Você é um amor, mas eu não curto ${g}. Amigos?`, `Hahaha, fico lisonjead${gw(id, "o", "a")}! Mas não é meu tipo de... gênero.`, `Que fofo! Mas eu gosto de ${npcOrient(id) === "homo" ? (npcGender(id) === "f" ? "mulheres" : "homens") : npcGender(id) === "f" ? "homens" : "mulheres"}, viu?`])]], () => openInterPanel(id, cat, game.ipPage || 0));
    }
    game.curInterCat = cat;
    try {
      return doBase(id, key);
    } finally {
      game.curInterCat = null;
    }
  };
  const addBase = addFriendship;
  addFriendship = function (id, v) {
    if (v > 0 && game.curInterCat) for (const t of player.traits || []) if (TRAIT_CAT_BONUS[t] === game.curInterCat) v += 1;
    return addBase(id, v);
  };
}
/* Pedir em namoro: orientação conta, e casais da vila também são "casados". */
{
  const askBase = askOut;
  askOut = function (id) {
    if (!attractedTo(id)) {
      addFriendship(id, 1);
      return say([[shortName(id), npcOrient(id) === "ace" ? "Eu não namoro ninguém, de verdade. Mas fico feliz que pensou em mim!" : `Ai, que fofo! Mas eu gosto de ${npcGender(id) === "f" ? (npcOrient(id) === "homo" ? "mulheres" : "homens") : npcOrient(id) === "homo" ? "homens" : "mulheres"}. Fica a amizade?`]]);
    }
    const sp = npcSpouse(id),
      had = NPC_MARRIED[id];
    if (sp && !had) NPC_MARRIED[id] = sp;
    try {
      return askBase(id);
    } finally {
      if (sp && !had) delete NPC_MARRIED[id];
      if (sp && typeof jealousTrigger === "function") jealousTrigger(id);
    }
  };
}
/* Quem flerta com você é quem sente atração por você. */
{
  const okBase = NPC_INITS.flerte.ok;
  NPC_INITS.flerte.ok = (id) => (!okBase || okBase(id)) && attractedTo(id);
  const optsBase = NPC_INITS.flerte.opts;
  NPC_INITS.flerte.opts = (id, n) => {
    const o = optsBase(id, n).map((x) => (x.t.startsWith("Flertar") ? { ...x, fn: () => (x.fn(), typeof jealousTrigger === "function" && jealousTrigger(id)) } : x));
    if (!playerLikes(id))
      o.push({ t: `Dizer que não curte ${npcGender(id) === "f" ? "mulheres" : "homens"}`, icon: "smile", fn: () => (addFriendship(id, 1), say([[n, pk(["Ah, de boa! Amigos, então?", "Opa, tudo certo! Valeu pela sinceridade.", "Sem problema! Mas o elogio continua valendo."])]])) });
    return o;
  };
}
/* Conhecer melhor: mostra o jeito, a orientação (com amizade) e com quem é casado. */
{
  const itemsBase = lifeSocialItems;
  lifeSocialItems = function (id) {
    const items = itemsBase(id);
    items.push({
      t: "Conhecer melhor (personalidade)",
      icon: "eye",
      fn: () => {
        const n = shortName(id),
          f = friendship(id),
          sp = npcSpouse(id),
          tr = npcTraits(id);
        const lines = [["", `${n} é ${traitsText(id).toLowerCase()}. ${TRAITS[tr[0]].d}`]];
        if (sp) lines.push(["", `É casad${gw(id, "o", "a")} com ${shortName(sp)}.${hasTrait(sp, "ciumento") || hasTrait(sp, "esquentado") ? ` Cuidado: ${shortName(sp)} é ${traitsText(sp).toLowerCase()}!` : ""}`]);
        else lines.push(["", `${n} está solteir${gw(id, "o", "a")}.`]);
        if (sp && id !== "lucas" && hatesMarzoca(id)) lines.push([n, pk(["E se o Lucas Marzocca chegar perto da minha família, eu não respondo por mim.", "Marzoca? Nem fala esse nome perto de mim.", "Aquele Marzoca... um dia ainda pego ele."])]);
        if (id === "lucas") lines.push([n, "Eu? Gosto de todo mundo! ...Mas confesso que mulher me ganha bem mais fácil. E sim, todo marido da vila me odeia. Injustiça!"]);
        if (!isChildNpc(id)) {
          if (f >= 30 || hasTrait(id, "extro")) lines.push([n, npcOrient(id) === "ace" ? "Romance não é pra mim. Prefiro amizade, livros e chá." : `Se quer saber, eu sou ${ORIENTS[npcOrient(id)].n.toLowerCase()}. ${attractedTo(id) ? pk(["E você não é de se jogar fora...", "Por quê? Tá interessad" + genderWord("o", "a", "e") + "?"]) : "Mas a gente pode ser amigos!"}`]);
          else lines.push([n, "Isso de com quem eu namoro? A gente ainda não tem essa intimidade."]);
        }
        say(lines);
      },
    });
    return items;
  };
}

/* ======================================================================
   (antes: 42-vida-autonoma.js)
   ====================================================================== */

/**
 * ECOS DO ARCANO — 27-almas-e-autonomia.js
 * Moradores com vontade própria:
 *  - a turma sente fome, saudade dos amigos e tédio, e decide sozinha aonde ir
 *    (comer, visitar alguém, passear, fugir da chuva);
 *  - quem se encontra conversa de verdade, com balões de fala (rua e lojas);
 *  - nos diálogos, quem está por perto entra na conversa;
 *  - ciúme: dar em cima de gente casada pode acabar em briga ou com o marido
 *    (ou a esposa) correndo atrás com uma faca. Vale para qualquer um;
 *  - Lucas Marzocca é o campeão: vive flertando com gente casada e fugindo.
 */


/* ===================== CAMINHO EM QUALQUER LUGAR ===================== */

/** Caminho (BFS) na zona atual. Devolve a lista de passos ou null. */
function zonePath(zone, sx, sy, tx, ty, limit = 2500, goalOk) {
  if (sx === tx && sy === ty) return [];
  const key = (x, y) => x * 4096 + y;
  const prev = new Map([[key(sx, sy), null]]);
  const q = [[sx, sy]];
  let end = null;
  while (q.length) {
    const [x, y] = q.shift();
    if ((x === tx && y === ty) || (goalOk && goalOk(x, y))) {
      end = [x, y];
      break;
    }
    for (const [dx, dy] of DIRS4) {
      const nx = x + dx,
        ny = y + dy,
        k = key(nx, ny);
      if (prev.has(k)) continue;
      if (!(nx === tx && ny === ty) && !walkable(zone, nx, ny)) continue;
      prev.set(k, [x, y]);
      q.push([nx, ny]);
    }
    if (prev.size > limit) break;
  }
  if (!end) return null;
  const path = [];
  let cur = end;
  while (cur && !(cur[0] === sx && cur[1] === sy)) {
    path.unshift(cur);
    cur = prev.get(key(cur[0], cur[1]));
  }
  return path;
}
const dist1 = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
const dirTo = (from, to) => (Math.abs(to.x - from.x) >= Math.abs(to.y - from.y) ? (to.x > from.x ? "right" : "left") : to.y > from.y ? "down" : "up");
function nearPlayer(o, r = 12) {
  return Math.abs(o.x - player.x) + Math.abs(o.y - player.y) <= r;
}

/* ===================== CONVERSAS COM BALÃO ===================== */

game.convs = [];
game.speech = game.speech || [];
/**
 * Duas (ou mais) pessoas conversam com balões de fala.
 * parts: [{ref, nome, id}] (ref tem x/y e fica parado durante a conversa);
 * lines: [[nome, fala]].
 */
function startConv(parts, lines, opt = {}) {
  if (parts.some((p) => p.ref.talking)) return false;
  const total = lines.reduce((a, [, s]) => a + 2.2 + s.length / 24, 0) + 0.6;
  for (const p of parts) {
    p.ref.talking = total;
    freezeRef(p.ref, total);
  }
  for (let i = 0; i < parts.length; i++) {
    const o = parts[(i + 1) % parts.length];
    parts[i].ref.dir = dirTo(parts[i].ref, o.ref);
  }
  game.convs.push({ parts, lines, i: -1, t: 0.2, zone: player.zone, ...opt });
  return true;
}
function freezeRef(ref, s) {
  if (ref.kind === "crew") ref.step = Math.max(ref.step || 0, s);
  else if (ref.kind === "roam") ref.timer = Math.max(ref.timer || 0, s);
  else if (ref.kind === "walker" || ref.nm) ref.chat = Math.max(ref.chat || 0, s);
}
function convTick(dt) {
  for (const c of game.convs) {
    if (c.zone !== player.zone) {
      c.done = true;
      continue;
    }
    c.t -= dt;
    if (c.t > 0) continue;
    c.i++;
    if (c.i >= c.lines.length) {
      c.done = true;
      if (c.onEnd) c.onEnd();
      continue;
    }
    const [who, txt] = c.lines[c.i];
    const p = c.parts.find((q) => q.nome === who) || c.parts[c.i % c.parts.length];
    const dur = 2.2 + txt.length / 24;
    c.t = dur;
    if (nearPlayer(p.ref, 16)) {
      game.shouts = (game.shouts || []).concat([{ x: p.ref.x, y: p.ref.y, txt, t: dur }]);
      if (c.loud) playSound(200 + Math.random() * 200, 0.05, "square");
    }
  }
  game.convs = game.convs.filter((c) => !c.done);
  const dec = (o) => o && o.talking > 0 && (o.talking -= dt);
  for (const a of Object.values(game.crewA || {})) dec(a);
  for (const r of game.roam || []) dec(r);
  for (const w of game.walkers || []) dec(w);
  for (const p of (game.inter && game.inter.people) || []) dec(p);
}

/* ===================== VONTADE PRÓPRIA DA TURMA ===================== */

const DESIRES = {
  comer: { ic: "apple", why: "foi comer alguma coisa", need: "fome" },
  social: { ic: "chat", why: "foi visitar um amigo", need: "social" },
  passear: { ic: "note", why: "foi passear", need: "fun" },
  sentar: { ic: "zzz", why: "foi descansar um pouco", need: "energia" },
  namorar: { ic: "heart", why: "foi ver quem ama", need: "social" },
};
function crewNeeds(id) {
  game.cneeds = game.cneeds || {};
  return (game.cneeds[id] = game.cneeds[id] || { fome: 50 + Math.random() * 50, social: 40 + Math.random() * 60, fun: 40 + Math.random() * 60, energia: 60 + Math.random() * 40 });
}
function vilaSpot(name) {
  const b = typeof vilaBuilding === "function" ? vilaBuilding(name) : null;
  return b ? doorOut(b) : null;
}
function freeNear(zone, x, y, r = 2) {
  for (let k = 0; k < 20; k++) {
    const nx = x + Math.round((Math.random() - 0.5) * 2 * r),
      ny = y + Math.round((Math.random() - 0.5) * 2 * r);
    if ((nx !== x || ny !== y) && walkable(zone, nx, ny)) return [nx, ny];
  }
  return null;
}
function chooseDesire(a) {
  const N = crewNeeds(a.id);
  const w = { comer: (100 - N.fome) / 20, social: (100 - N.social) / 18, passear: (100 - N.fun) / 22, sentar: (100 - N.energia) / 25, namorar: 0 };
  if (npcSpouse(a.id) && game.crewA[npcSpouse(a.id)] && crewVisible(game.crewA[npcSpouse(a.id)])) w.namorar = hasTrait(a.id, "romant") ? 3 : 1.2;
  if (hasTrait(a.id, "extro") || hasTrait(a.id, "fofoqueiro")) w.social += 2;
  if (hasTrait(a.id, "preguicoso")) w.sentar += 2;
  if (hasTrait(a.id, "aventureiro")) w.passear += 2;
  let r = Math.random() * Object.values(w).reduce((s, v) => s + v, 0),
    kind = "passear";
  for (const [k, v] of Object.entries(w)) if ((r -= v) < 0) {
    kind = k;
    break;
  }
  const z = ZONES.vila;
  let dest = null,
    with_ = null;
  if (kind === "comer") dest = vilaSpot(pk(["Taverna Javali Dourado", "Padaria", "Taverna Javali Dourado"]));
  else if (kind === "social" || kind === "namorar") {
    const others = Object.values(game.crewA).filter((o) => o !== a && crewVisible(o) && !o.talking && (kind === "social" || o.id === npcSpouse(a.id)));
    if (others.length) {
      const o = pk(others);
      with_ = o.id;
      dest = freeNear("vila", o.x, o.y, 1) || [o.x, o.y + 1];
    }
  } else {
    if (!z.pois) buildPointsOfInterest(z);
    const pool = z.pois.filter((p) => (kind === "sentar" ? p.kind === "look" || p.kind === "drink" : p.kind !== "door"));
    if (pool.length) {
      const p = pk(pool);
      dest = [p.x, p.y];
    }
  }
  if (!dest) return;
  a.auto = { kind, dest, with: with_, until: player.day * 1440 + player.clock + 40 + Math.random() * 80 };
  game.bubbles.push({ x: a.x, y: a.y, icon: DESIRES[kind].ic, t: 2 });
}
{
  const targetBase = crewTarget;
  crewTarget = function (id) {
    const base = targetBase(id);
    const a = game.crewA && game.crewA[id];
    if (!a || !Array.isArray(base) || crewGathering() || (typeof girlsCoffee === "function" && girlsCoffee())) return base;
    if (game.chase && game.chase.who === id) return base;
    // Chuva forte: quem não está trabalhando corre para casa.
    if ((player.weather === "tempestade" || (player.weather === "chuva" && hashStr(id) % 2)) && !(typeof workplaceOf === "function" && workplaceOf(id)) && crewHomeOf(id)) return "home";
    const now = player.day * 1440 + player.clock;
    if (a.auto && now < a.auto.until) return a.auto.dest;
    if (a.auto) a.auto = null;
    return base;
  };
}
let autoAcc = 0;
function autonomyTick(dt) {
  if (!lifeMode() || player.zone !== "vila" || !game.crewA) return;
  const sdt = dt * (typeof timeSpeed === "function" ? timeSpeed() : 1);
  for (const id of Object.keys(game.crewA)) {
    const N = crewNeeds(id);
    N.fome = Math.max(0, N.fome - sdt * 0.3);
    N.social = Math.max(0, N.social - sdt * 0.4);
    N.fun = Math.max(0, N.fun - sdt * 0.25);
    N.energia = Math.max(0, N.energia - sdt * 0.15);
  }
  autoAcc += dt;
  if (autoAcc < 1) return;
  autoAcc = 0;
  for (const a of Object.values(game.crewA)) {
    if (!crewVisible(a) || a.talking > 0 || (game.chase && (game.chase.who === a.id || (game.chase.tgt && game.chase.tgt === a)))) continue;
    const N = crewNeeds(a.id);
    // Chegou aonde queria: satisfaz a vontade.
    if (a.auto && a.path && !a.path.length) {
      const k = a.auto.kind;
      if (k === "comer") (N.fome = 100), game.bubbles.push({ x: a.x, y: a.y, icon: "apple", t: 1.6 });
      if (k === "passear") N.fun = Math.min(100, N.fun + 50);
      if (k === "sentar") N.energia = Math.min(100, N.energia + 40);
      if ((k === "social" || k === "namorar") && a.auto.with) {
        const o = game.crewA[a.auto.with];
        if (o && crewVisible(o) && dist1(a, o) <= 2 && !o.talking) {
          N.social = 100;
          crewNeeds(o.id).social = Math.min(100, crewNeeds(o.id).social + 40);
          startConv(
            [
              { ref: a, nome: shortName(a.id), id: a.id },
              { ref: o, nome: shortName(o.id), id: o.id },
            ],
            genExchange({ id: a.id, nome: shortName(a.id) }, { id: o.id, nome: shortName(o.id) }),
          );
        }
      }
      if (k !== "social" && k !== "namorar") a.auto.until = Math.min(a.auto.until, player.day * 1440 + player.clock + 20);
      else a.auto = null;
      continue;
    }
    if (!a.auto && (Math.random() < 0.035 || Object.values(N).some((v) => v < 20))) chooseDesire(a);
  }
  // Quem se esbarra puxa conversa (turma, moradores com nome e gente da rua).
  if (Math.random() < 0.25) bumpChats();
}
function talkers() {
  const out = [];
  for (const a of Object.values(game.crewA || {})) if (player.zone === "vila" && crewVisible(a)) (a.kind = "crew"), out.push({ ref: a, id: a.id, nome: shortName(a.id) });
  for (const r of game.roam || []) if (NPCS[r.id] && !(typeof npcAsleep === "function" && npcAsleep(r.id))) (r.kind = "roam"), out.push({ ref: r, id: r.id, nome: shortName(r.id) });
  for (const w of game.walkers || []) if (!(w.inside > 0) && !(w.sit > 0)) (w.kind = "walker"), out.push({ ref: w, id: "w:" + w.nm, nome: w.nm });
  return out.filter((p) => !(p.ref.talking > 0) && nearPlayer(p.ref, 14));
}
function bumpChats() {
  if (!ZONES[player.zone] || !ZONES[player.zone].town) return;
  if (game.convs.length >= 3) return;
  const ps = talkers();
  // O Marzoca perto de alguém casado: confusão garantida.
  const lu = ps.find((p) => p.id === "lucas");
  if (lu) {
    const foe = ps.find((p) => p !== lu && hatesMarzoca(p.id) && dist1(p.ref, lu.ref) <= 3);
    if (foe) {
      game.bubbles.push({ x: foe.ref.x, y: foe.ref.y, icon: "anger", t: 2.4 });
      startConv([foe, lu], genExchange(foe, lu), { loud: true });
      return;
    }
  }
  for (let i = 0; i < ps.length; i++)
    for (let j = i + 1; j < ps.length; j++) {
      const a = ps[i],
        b = ps[j];
      if (dist1(a.ref, b.ref) > 2 || (a.id.startsWith("w:") && b.id.startsWith("w:") && Math.random() < 0.5)) continue;
      startConv([a, b], genExchange(a, b));
      return;
    }
}
/* Nas lojas e na taverna, quem está lá dentro também conversa. */
let interAcc = 0;
function interiorChatTick(dt) {
  if (player.zone !== "interior" || !game.inter || game.convs.length) return;
  interAcc += dt;
  if (interAcc < 9) return;
  interAcc = 0;
  const ps = (game.inter.people || []).filter((p) => !(p.talking > 0));
  if (ps.length < 2 || Math.random() < 0.3) return;
  const a = pk(ps);
  const b = ps.filter((p) => p !== a).sort((p, q) => dist1(p, a) - dist1(q, a))[0];
  const A = { ref: a, id: a.cid || "w:" + (a.nm || "c1"), nome: a.nm || "Cliente" },
    B = { ref: b, id: b.cid || "w:" + (b.nm || "c2"), nome: b.nm || "Cliente" };
  startConv([A, B], genExchange(A, B));
}

/* ===================== QUEM ESTÁ PERTO ENTRA NA CONVERSA ===================== */

{
  const chatBase = chatWith;
  chatWith = function (id) {
    chatBase(id);
    const d = game.dialog;
    if (!d || !Math.random() || Math.random() > 0.35) return;
    const o = talkers().find((p) => p.id && p.id !== id && NPCS[p.id] && Math.abs(p.ref.x - player.x) + Math.abs(p.ref.y - player.y) <= 4);
    if (!o) return;
    const n = shortName(id),
      on = o.nome;
    const extra = [
      [on, pk([`Ei, ${n}, você tá falando de mim?`, `Posso me meter? ${genLine(o.id)}`, `${n} sempre conta essa história errado!`, `Concordo com ${n}. ${genLine(o.id, "voce")}`, `Hahaha, ${n} e ${player.name} fofocando de novo!`, `Ô ${n}, conta pra ${player.name} aquela do ${shortName(someCrew(o.id))}!`])],
      [n, pk([`Ninguém te chamou, ${on}!`, `Ah, ${on}, você não perde uma.`, `Tá vendo, ${player.name}? Essa vila não tem segredo.`, `${on}, depois a gente conversa.`, genLine(id)])],
    ];
    if (Math.random() < 0.5) extra.push([on, genLine(o.id)]);
    d.lines.push(...extra);
  };
}

/* ===================== PERSEGUIÇÃO (FACA) ===================== */

game.chase = null;
function spawnNear(zone, x, y, dmin = 5, dmax = 8) {
  for (let k = 0; k < 80; k++) {
    const nx = x + Math.round((Math.random() - 0.5) * 2 * dmax),
      ny = y + Math.round((Math.random() - 0.5) * 2 * dmax);
    const d = Math.abs(nx - x) + Math.abs(ny - y);
    if (d >= dmin && d <= dmax * 1.5 && walkable(zone, nx, ny) && zonePath(zone, nx, ny, x, y, 1200)) return [nx, ny];
  }
  return null;
}
const CHASE_YELLS = ["VOLTA AQUI, {T}!", "Ninguém mexe com {quem}!", "EU VOU TE PEGAR!", "Não adianta correr, {T}!", "Larga de ser sem-vergonha!", "Hoje você não escapa!", "{T}! Vem cá conversar com a faquinha!", "Era só um elogio, né? SEI!"];
const VICTIM_YELLS = ["SOCORRO!", "Foi só um elogio!", "Eu juro que não fiz nada!", "Alguém me esconde!", "Era brincadeira!!", "Não sou eu, é meu irmão gêmeo!", "Desculpa, desculpa, desculpaaa!"];
const CROWD_YELLS = ["Socorro! Uma faca!", "Corre, corre!", "De novo o Marzoca!", "Chama os guardas!", "Briga de casal na praça!", "Ai, minha nossa!"];
/**
 * who: quem corre atrás (id). target: "player" ou o ator perseguido (crew).
 * flirted: com quem flertaram (para as falas).
 */
function startChase(who, target, flirted) {
  if (game.chase) return false;
  const tg = target === "player" ? player : target;
  const at = spawnNear(player.zone, tg.x, tg.y, 5, 8);
  if (!at) return false;
  const n = NPCS[who];
  game.chase = {
    who,
    n,
    x: at[0],
    y: at[1],
    rx: at[0],
    ry: at[1],
    dir: "down",
    step: 0.6,
    fstep: 0,
    tgt: target === "player" ? null : target,
    flirted,
    t: 0,
    dur: target === "player" ? 32 : 22,
    hits: 0,
    stun: 0,
    yell: 0.4,
    zone: player.zone,
  };
  game.shake = 0.2;
  playSound(130, 0.4, "sawtooth");
  return true;
}
function chaseYell(c, txt) {
  game.shouts = (game.shouts || []).concat([{ x: c.x, y: c.y, txt, t: 2.2 }]);
}
function endChase(msg) {
  const c = game.chase;
  if (!c) return;
  game.chase = null;
  if (c.tgt) {
    c.tgt.step = 0;
    c.tgt.tk = null;
    c.tgt.talking = 0;
  }
  if (game.crewA && game.crewA[c.who]) {
    const a = game.crewA[c.who];
    [a.x, a.y] = [c.x, c.y];
    a.rx = a.x;
    a.ry = a.y;
    a.tk = null;
  }
  if (msg) toast(msg, 3600);
}
function chaseTick(dt) {
  const c = game.chase;
  if (!c) return;
  if (game.mode === "title") return (game.chase = null);
  if (game.mode !== "world" || game.dialog) return;
  const toPlayer = !c.tgt;
  if (player.zone !== c.zone) return endChase(toPlayer ? `${shortName(c.who)} ficou esperando lá fora... e desistiu. Ufa!` : null);
  c.t += dt;
  c.rx += (c.x - c.rx) * Math.min(1, dt * 9);
  c.ry += (c.y - c.ry) * Math.min(1, dt * 9);
  const T = toPlayer ? player : c.tgt;
  const tName = toPlayer ? player.name : shortName(c.tgt.id);
  c.yell -= dt;
  if (c.yell <= 0) {
    c.yell = 2.6;
    const quem = c.flirted ? gw(c.flirted, "o meu marido", "a minha esposa") : "a minha família";
    chaseYell(c, pk(CHASE_YELLS).replace("{T}", tName.toUpperCase()).replace("{quem}", quem));
    if (!toPlayer && Math.random() < 0.7) game.shouts.push({ x: T.x, y: T.y, txt: pk(VICTIM_YELLS), t: 2 });
  }
  // A rua entra em pânico.
  for (const w of game.walkers || [])
    if (Math.abs(w.x - c.x) + Math.abs(w.y - c.y) <= 5 && !(w.flee > 0)) {
      w.flee = 4;
      if (Math.random() < 0.15) {
        w.sayT = 2.4;
        w.sayTxt = pk(CROWD_YELLS);
      }
    }
  // Quem é perseguido (NPC) foge.
  if (!toPlayer) {
    const a = c.tgt;
    a.step = 99;
    a.kind = "crew";
    c.fstep -= dt;
    if (c.fstep <= 0) {
      c.fstep = 0.24;
      let best = null,
        bd = -1;
      for (const [dx, dy] of DIRS4) {
        const nx = a.x + dx,
          ny = a.y + dy;
        if (!walkable("vila", nx, ny) || (nx === player.x && ny === player.y)) continue;
        const d = Math.abs(nx - c.x) + Math.abs(ny - c.y) + Math.random() * 1.6;
        if (d > bd) (bd = d), (best = [nx, ny, dx, dy]);
      }
      if (best) {
        a.dir = best[2] > 0 ? "right" : best[2] < 0 ? "left" : best[3] > 0 ? "down" : "up";
        a.x = best[0];
        a.y = best[1];
      }
    }
  }
  if (c.stun > 0) return void (c.stun -= dt);
  c.step -= dt;
  if (c.step <= 0) {
    c.step = toPlayer ? (player.riding ? 0.15 : 0.19) : 0.27;
    const p = zonePath(c.zone, c.x, c.y, T.x, T.y, 1800);
    if (p && p.length > 1) {
      const [nx, ny] = p[0];
      c.dir = nx > c.x ? "right" : nx < c.x ? "left" : ny > c.y ? "down" : "up";
      c.x = nx;
      c.y = ny;
    }
  }
  const d = Math.abs(c.x - T.x) + Math.abs(c.y - T.y);
  if (d <= 1) {
    c.stun = 1.8;
    c.hits++;
    game.shake = 0.35;
    playSound(110, 0.25, "sawtooth");
    game.bubbles.push({ x: T.x, y: T.y, icon: "anger", t: 1.2 });
    if (toPlayer) {
      const mx = typeof maxHp === "function" ? maxHp() : player.maxHp || 60;
      player.hp = Math.max(1, Math.round(player.hp - mx * 0.22));
      if (lifeMode() && typeof addNeed === "function") addNeed("energy", -8);
      toast(c.hits >= 3 ? "Você desmaiou de susto!" : `Ai! ${shortName(c.who)} te acertou de raspão! (${c.hits}/3)`, 2200);
      if (c.hits >= 3) {
        const lost = Math.round(player.gold * 0.12);
        player.gold -= lost;
        player.hp = Math.max(player.hp, Math.round(mx * 0.4));
        const hosp = player.zone === "vila" && vilaSpot("Hospital");
        endChase();
        if (hosp) {
          [player.x, player.y] = hosp;
          player.rx = player.x;
          player.ry = player.y;
          game.fade = 1;
        }
        repAdd(-3);
        say([["", `Você acordou ${hosp ? "na porta do Hospital" : "no chão"}, com um curativo na testa e ${lost} de ouro a menos no bolso.`], ["Curandeira Maíra", pk(["Mais um que mexeu com gente casada... Próximo!", "Ciúme de faca é o que mais chega aqui. Cuidado, viu?"])]]);
        return;
      }
    } else {
      chaseYell(c, pk(["TE PEGUEI!", "Toma isso!", "Aprendeu?!"]));
      game.shouts.push({ x: T.x, y: T.y, txt: pk(["AIII!", "Minha bunda!", "Foi de raspão, foi de raspão!"]), t: 1.8 });
      if (c.hits >= 2) {
        vilaNews(`${shortName(c.who)} alcançou o Lucas Marzocca ${pk(PLACES)} e deu uma lição nele!`.replace("o Lucas Marzocca", c.tgt.id === "lucas" ? "o Lucas Marzocca" : shortName(c.tgt.id)));
        return endChase();
      }
    }
  }
  const far = Math.abs(c.x - T.x) + Math.abs(c.y - T.y) > 18;
  if (c.t > c.dur || far) {
    chaseYell(c, pk(["Isso não vai ficar assim!", "Da próxima vez você não escapa!", "*ofegante* ...Volta... aqui...", "Eu sei onde você mora!"]));
    if (toPlayer) {
      vilaNews(`${shortName(c.who)} correu atrás de ${player.name} com uma faca pela vila!`);
      endChase(far ? "Você despistou! Mas a vila inteira viu." : `${shortName(c.who)} cansou de correr. Você escapou... por hoje.`);
    } else {
      player.lucasRuns = (player.lucasRuns || 0) + (c.tgt.id === "lucas" ? 1 : 0);
      vilaNews(`${c.tgt.id === "lucas" ? "Lucas Marzocca" : shortName(c.tgt.id)} fugiu de ${shortName(c.who)} (e de uma faca) ${pk(PLACES)}${c.tgt.id === "lucas" ? `. Já são ${player.lucasRuns} fuga${player.lucasRuns > 1 ? "s" : ""}!` : "!"}`);
      endChase();
    }
  }
}
{
  const visBase = crewVisible;
  crewVisible = function (a) {
    if (game.chase && a && a.id === game.chase.who) return false;
    return visBase(a);
  };
}
function drawKnifeGuy(c, t) {
  const n = c.n,
    X = c.rx * TILE,
    Y = c.ry * TILE + Math.abs(Math.sin(t * 16)) * -2;
  ctx.fillStyle = "rgba(0,0,0,.25)";
  ctx.beginPath();
  ctx.ellipse(X + 16, c.ry * TILE + 30, 9, 3, 0, 0, 7);
  ctx.fill();
  drawSprite(wizardRects(n.robe, n.hat, n.hair, null, c.dir, 1 + (Math.floor(t * 9) % 2)), X, Y, 2, c.dir === "left");
  // Faca levantada.
  const side = c.dir === "left" ? -1 : 1,
    hx = X + 16 + side * 11,
    hy = Y + 12 + Math.sin(t * 14) * 3;
  ctx.fillStyle = "#3a2414";
  ctx.fillRect(hx - 2, hy - 1, 6, 7);
  ctx.fillStyle = "#6b4423";
  ctx.fillRect(hx - 1, hy, 4, 5);
  ctx.fillStyle = "#9aa4b0";
  ctx.fillRect(hx - 3, hy - 2, 8, 2);
  ctx.fillStyle = "#dfe6ee";
  ctx.fillRect(hx - 1, hy - 15, 4, 13);
  ctx.fillRect(hx, hy - 17, 2, 2);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(hx, hy - 14, 1, 10);
  if (Math.sin(t * 12) > 0.7) {
    ctx.fillStyle = "#fff";
    ctx.fillRect(hx + 4, hy - 16, 2, 2);
  }
  if (c.stun <= 0) drawPixelIcon("anger", X + 16, Y - 10, 2);
}

/* ===================== CIÚME (QUALQUER CASADO) ===================== */

/** Você deu em cima de alguém casado: o par pode descobrir e reagir. */
function jealousTrigger(id) {
  if (!lifeMode()) return;
  const sp = npcSpouse(id);
  if (!sp || !NPCS[sp]) return;
  player.famDay.jealN = player.famDay.jealD === player.day ? player.famDay.jealN || 0 : 0;
  player.famDay.jealD = player.day;
  if (player.famDay.jealN >= 2 || game.jealousQ) return;
  const spot = npcSpot(sp);
  const sees = spot && Math.abs(spot[0] - player.x) + Math.abs(spot[1] - player.y) <= 10;
  if (Math.random() > (sees ? 0.85 : 0.35)) return;
  player.famDay.jealN++;
  game.jealousQ = { id, sp, at: performance.now() + (sees ? 600 : 15000 + Math.random() * 25000), sees };
}
function jealousTick() {
  const q = game.jealousQ;
  if (!q || performance.now() < q.at || game.mode !== "world" || game.dialog || game.chase || game.brawl) return;
  if (!ZONES[player.zone] || !ZONES[player.zone].town) return;
  game.jealousQ = null;
  const sp = q.sp,
    id = q.id,
    spN = shortName(sp),
    idN = shortName(id);
  const w = { faca: 1, briga: 1, conversa: 0.8 };
  if (hasTrait(sp, "ciumento")) w.faca += 2;
  if (hasTrait(sp, "esquentado")) w.briga += 2;
  if (hasTrait(sp, "calmo") || hasTrait(sp, "timido")) w.conversa += 2.5;
  let r = Math.random() * (w.faca + w.briga + w.conversa),
    kind = r < w.faca ? "faca" : r < w.faca + w.briga ? "briga" : "conversa";
  addFriendship(sp, -20);
  player.angry = player.angry || {};
  player.angry[sp] = player.day;
  repAdd(-3);
  const meu = gw(id, "o meu marido", "a minha esposa");
  const intro = q.sees ? `${spN} viu tudo!` : `A fofoca chegou rapidinho: ${spN} ficou sabendo que você deu em cima de ${idN}.`;
  game.bubbles.push({ x: player.x, y: player.y, icon: "sweat", t: 2 });
  if (kind === "faca") {
    say(
      [
        ["", intro],
        [spN, pk([`VOCÊ DEU EM CIMA D${meu.slice(0, 1).toUpperCase()}${meu.slice(1)}?!`, `${player.name.toUpperCase()}! Fica longe d${gw(id, "o", "a")} ${idN}!`, `Eu vi você de olho n${gw(id, "o", "a")} ${idN}!`])],
        ["", `${spN} puxou uma faca de cozinha! CORRE!!`],
      ],
      () => {
        if (!startChase(sp, "player", id)) say([[spN, "Da próxima vez eu te pego!"]]);
        vilaNews(`${spN} correu atrás de ${player.name} com uma faca por ciúme de ${idN}!`);
      },
    );
  } else if (kind === "briga") {
    say(
      [
        ["", intro],
        [spN, pk([`Ninguém mexe com ${meu}! Sai na mão comigo!`, "Você vai aprender a respeitar casamento dos outros!", `Tira o olho d${gw(id, "o", "a")} ${idN}! Vem!`])],
      ],
      () => {
        const had = NO_FIGHT.has(sp);
        NO_FIGHT.delete(sp);
        startBrawl(sp, NPCS[sp].nome);
        if (had) NO_FIGHT.add(sp);
        vilaNews(`${spN} saiu no braço com ${player.name} por causa de ${idN}!`);
      },
    );
  } else {
    say([
      ["", intro],
      [spN, pk([`Eu sei o que você fez com ${idN}. Não vou fazer escândalo... mas nunca mais olhe pra minha família.`, `Pensei que você era ${genderWord("um amigo", "uma amiga", "alguém de confiança")}. Me enganei.`, `*olhos cheios d'água* Por quê? ${idN} é tudo que eu tenho.`])],
      [idN, pk(["...Melhor a gente se afastar um tempo.", "Que vergonha. A vila toda vai saber.", "Eu avisei que era casad" + gw(id, "o", "a") + "!"])],
    ]);
    addFriendship(id, -8);
    vilaNews(`${spN} descobriu que ${player.name} deu em cima de ${idN}. Que climão!`);
  }
}
/* Interações românticas com gente casada acendem o ciúme. */
{
  const doBase = doInteraction;
  doInteraction = function (id, key) {
    const r = INTER_BY_KEY[key];
    const res = doBase(id, key);
    if (r && (r[1] === "amor" || r[1] === "cor") && !isRomanticWith(id) && attractedTo(id)) jealousTrigger(id);
    else if (r && (r[1] === "amor" || r[1] === "cor") && npcSpouse(id) && (player.lovers || []).includes(id)) jealousTrigger(id);
    return res;
  };
}

/* ===================== O MARZOCA ATACA (DE NOVO) ===================== */

const LUCAS_FLIRTS = ["Oi, sumid{a}... esse {roupa} é novo?", "Se beleza desse ouro, você pagava o Imposto Real sozinh{a}.", "Você vem sempre aqui ou só quando eu estou?", "Seu par sabe que você é a pessoa mais bonita da vila?", "Me empresta um sorriso? Devolvo amanhã.", "Tá calor ou é você chegando?", "Eu ia passar reto, mas meus pés travaram."];
const FLIRT_REACT = ["*cora* Lucas, eu sou casad{a}!", "Hahaha, você não presta!", "Sai daqui, Marzoca!", "...Fala de novo? Não ouvi.", "Meu {par} está logo ali, hein!", "Que cantada horrível. Gostei."];
let lucasAcc = 40;
/** Um galanteador (quase sempre o Lucas) dá em cima de alguém casado. O par aparece... */
function galanteioTick(dt) {
  if (!lifeMode() || player.zone !== "vila" || !game.crewA || game.chase || game.mode !== "world") return;
  lucasAcc -= dt;
  if (lucasAcc > 0) return;
  lucasAcc = 60 + Math.random() * 60;
  const gal = Math.random() < 0.85 ? "lucas" : "luca";
  const L = game.crewA[gal];
  if (!L || !crewVisible(L) || !nearPlayer(L, 18) || L.talking > 0) return;
  const targets = Object.values(game.crewA).filter((o) => o !== L && crewVisible(o) && npcSpouse(o.id) && NPCS[npcSpouse(o.id)] && !o.talking && nearPlayer(o, 20));
  if (!targets.length) return;
  // Ele vai muito mais atrás de mulher casada do que de homem casado.
  let o = null,
    tot = targets.reduce((acc, q) => acc + (npcGender(q.id) === "f" ? 4 : 1) / (1 + dist1(q, L) / 8), 0),
    r = Math.random() * tot;
  for (const q of targets) if ((r -= (npcGender(q.id) === "f" ? 4 : 1) / (1 + dist1(q, L) / 8)) < 0) {
    o = q;
    break;
  }
  o = o || targets[0];
  const dest = freeNear("vila", o.x, o.y, 1);
  if (!dest) return;
  [L.x, L.y] = dest;
  L.tk = null;
  L.kind = "crew";
  o.kind = "crew";
  const sp = npcSpouse(o.id);
  const f = (s) => s.replace(/\{a\}/g, gw(o.id, "o", "a")).replace("{roupa}", gw(o.id, "colete", "vestido")).replace("{par}", gw(sp, "marido", "esposa"));
  const lines = [
    [shortName(gal), f(pk(LUCAS_FLIRTS))],
    [shortName(o.id), f(pk(FLIRT_REACT))],
    [shortName(gal), pk(["Casad" + gw(o.id, "o", "a") + ", não mort" + gw(o.id, "o", "a") + "!", "Seu par nem precisa saber...", "Eu só estava elogiando! Juro pelas runas!"])],
  ];
  startConv(
    [
      { ref: L, nome: shortName(gal), id: gal },
      { ref: o, nome: shortName(o.id), id: o.id },
    ],
    lines,
    {
      loud: true,
      onEnd: () => {
        if (!crewVisible(L)) return;
        if (Math.random() < 0.3) {
          // Briga na rua.
          game.shouts.push({ x: L.x, y: L.y, txt: `${shortName(sp).toUpperCase()} CHEGOU! Calma, calma!`, t: 2.4 });
          for (let i = 0; i < 6; i++) setTimeout(() => (game.bubbles.push({ x: L.x, y: L.y, icon: "anger", t: 0.8 }), (game.shake = 0.1), playSound(150 + i * 20, 0.06, "square")), i * 350);
          vilaNews(`${shortName(sp)} e ${shortName(gal)} saíram no tapa ${pk(PLACES)} por causa de ${shortName(o.id)}!`);
        }
        if (startChase(sp, L, o.id)) {
          game.chase.x = Math.max(1, Math.min(ZONES.vila.w - 2, game.chase.x));
          chaseYell(game.chase, `${shortName(gal).toUpperCase()}!!! EU VI ISSO!`);
        }
      },
    },
  );
}

/* ===================== LIGAÇÕES ===================== */

{
  const updBase = update;
  update = function (dt) {
    updBase(dt);
    if (game.mode === "title") return;
    convTick(dt);
    if (game.mode === "world" && !game.dialog) {
      autonomyTick(dt);
      interiorChatTick(dt);
      galanteioTick(dt);
      jealousTick();
      chaseTick(dt);
      if (ZONES[player.zone] && ZONES[player.zone].town && player.zone !== "vila" && Math.random() < dt * 0.25) bumpChats();
    }
  };
  const drawBase = crewDrawList;
  crewDrawList = function (list, t) {
    drawBase(list, t);
    const c = game.chase;
    if (c && c.zone === player.zone) list.push({ y: c.ry, draw: () => drawKnifeGuy(c, t) });
    // Quem foge do ciúme corre com cara de pânico.
    if (c && c.tgt && crewVisible(c.tgt)) list.push({ y: c.tgt.ry + 0.01, draw: () => drawPixelIcon("sweat", c.tgt.rx * TILE + 16, c.tgt.ry * TILE - 10, 2) });
  };
  // Durante a perseguição, a turma corre mais rápido que o normal (o "a.step" fica com a fuga).
  const crewTickBase = crewTick;
  crewTick = function (dt) {
    crewTickBase(dt);
    const c = game.chase;
    if (c && c.tgt) {
      c.tgt.rx += (c.tgt.x - c.tgt.rx) * Math.min(1, dt * 9);
      c.tgt.ry += (c.tgt.y - c.tgt.ry) * Math.min(1, dt * 9);
    }
  };
}
