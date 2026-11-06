/**
 * ECOS DO ARCANO — 41-almas.js
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
const NPC_TRAITS_FIXED = {
  lucas: ["galanteador", "rebelde"], luca: ["rebelde", "engracado"], matheus: ["leal", "calmo"], malu: ["ciumento", "generoso"],
  marcos: ["serio", "esquentado"], julia: ["ciumento", "dramatico"], andressa: ["intelectual", "fofoqueiro"], gabriel: ["romant", "dramatico"],
  mylena: ["extro", "romant"], pedro: ["ciumento", "leal"], juliaO: ["generoso", "extro"], vini: ["esquentado", "ambicioso"],
  rainha: ["serio", "ambicioso"], odelia: ["intelectual", "calmo"], bruno: ["engracado", "ciumento"], rosa: ["fofoqueiro", "generoso"],
  ferreiro: ["esquentado", "leal"], curandeira: ["calmo", "romant"], kael: ["serio", "aventureiro"], lia: ["extro", "engracado"],
  iara: ["timido", "intelectual"], tome: ["serio", "leal"], marina: ["aventureiro", "esquentado"], tobias: ["timido", "ciumento"],
  capitao: ["ciumento", "esquentado"], zaid: ["ambicioso", "engracado"], doran: ["preguicoso", "galanteador"], ancia: ["fofoqueiro", "calmo"],
};
function hashStr(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}
function npcTraits(id) {
  if (NPC_TRAITS_FIXED[id]) return NPC_TRAITS_FIXED[id];
  const keys = Object.keys(TRAITS),
    h = hashStr(id || "x");
  const a = keys[h % keys.length];
  let b = keys[(h >>> 8) % keys.length];
  if (b === a) b = keys[(h >>> 16) % keys.length] === a ? "calmo" : keys[(h >>> 16) % keys.length];
  return [a, b];
}
function hasTrait(id, t) {
  return id === "player" ? (player.traits || []).includes(t) : npcTraits(id).includes(t);
}
function traitName(t, g) {
  return TRAITS[t] ? (g === "f" ? TRAITS[t].f : TRAITS[t].m) : t;
}
function traitsText(id) {
  return npcTraits(id)
    .map((t) => traitName(t, npcGender(id)))
    .join(" e ");
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
const NPC_ORIENT_FIXED = { iara: "homo", mercOri: "homo", tobias: "homo", nicoP: "homo", curandeira: "bi", doran: "pan", odelia: "ace", lia: "ace" };
function npcOrient(id) {
  if (NPC_ORIENT_FIXED[id]) return NPC_ORIENT_FIXED[id];
  if (typeof CREW_ALL !== "undefined" && CREW_ALL.includes(id)) return "hetero";
  const r = hashStr("o" + id) % 100;
  return r < 66 ? "hetero" : r < 78 ? "homo" : r < 94 ? "bi" : r < 98 ? "pan" : "ace";
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
  lucas: () =>
    pk([
      `Lucas Marzocca deu em cima d${pk(["a mulher do ferreiro", "o marido da Rosa", "a esposa do Capitão", "a Princesa Julia", "a Duquesa Malu"])} e saiu correndo ${pk(PLACES)}!`,
      "O Marzoca de novo fugindo de marido bravo. Esse aí não aprende!",
      "Se ouvir alguém gritando 'VOLTA AQUI, MARZOCA', não se assuste. É terça-feira.",
      `O Lucas jura que só estava ${pk(["pedindo informação", "elogiando o chapéu", "ajudando a carregar a cesta"])}. Sei.`,
      "Dizem que o Lucas já correu mais de marido do que de lobo.",
    ]),
  voce: (id) => {
    const rep = player.rep ?? 50,
      f = id && typeof friendship === "function" ? friendship(id) : 30;
    if (player.spouse && Math.random() < 0.35) return `E ${shortName(player.spouse)}, como vai? ${pk(["Manda um abraço!", "Vocês formam um casal bonito.", "Cuida bem, hein!"])}`;
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
        if (!(typeof CREW_ALL !== "undefined" && CREW_ALL.includes(id))) {
          if (f >= 30 || hasTrait(id, "extro")) lines.push([n, npcOrient(id) === "ace" ? "Romance não é pra mim. Prefiro amizade, livros e chá." : `Se quer saber, eu sou ${ORIENTS[npcOrient(id)].n.toLowerCase()}. ${attractedTo(id) ? pk(["E você não é de se jogar fora...", "Por quê? Tá interessad" + genderWord("o", "a", "e") + "?"]) : "Mas a gente pode ser amigos!"}`]);
          else lines.push([n, "Isso de com quem eu namoro? A gente ainda não tem essa intimidade."]);
        }
        say(lines);
      },
    });
    return items;
  };
}
