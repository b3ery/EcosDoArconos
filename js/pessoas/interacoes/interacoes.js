/**
 * ECOS DO ARCANO — interacoes.js
 * Painel de interações estilo The Sims (nos dois modos): mais de 100 ações
 * separadas por categoria. Cada pessoa reage de um jeito, conforme a
 * personalidade e a amizade. Algumas ações custam ouro, levam tempo, mexem
 * na reputação ou só aparecem para quem namora ou é casado.
 */

"use strict";

/* Personalidades: G gentil · E engraçado · A aventureiro · T tímido · S sério
   O orgulhoso · X esperto · B sábio · C criança */
const PS_CODE = { gentil: "G", engracado: "E", aventureiro: "A", timido: "T", serio: "S", orgulhoso: "O", esperto: "X", sabio: "B", crianca: "C" };

const INTER_CATS = [
  { k: "amigo", n: "Amigável", icon: "smile" },
  { k: "graca", n: "Engraçado", icon: "laugh" },
  { k: "papo", n: "Conversa", icon: "chat" },
  { k: "ativ", n: "Atividades", icon: "party" },
  { k: "ajuda", n: "Ajudar", icon: "gift" },
  { k: "amor", n: "Romântico", icon: "heart" },
  { k: "mal", n: "Malvado", icon: "anger" },
  { k: "paz", n: "Fazer as pazes", icon: "flower" },
];

/**
 * [chave, categoria, texto do botão, ícone, amizade se der certo, gosta, não gosta,
 *  resposta boa, resposta ruim, extras]
 * extras: cost (ouro), time (minutos), fun/energy/hyg (Simulador), rep, req, you (sua fala), fx, mean
 * req: "romance" (pode namorar), "partner" (namora/casado), "spouse" (casado), "friend" (amigo+),
 *      "night", "day", "story", "life", "debt"
 */
const INTERACTIONS = [
  /* ---------- AMIGÁVEL (20) ---------- */
  ["oi", "amigo", "Cumprimentar", "wave", 1, "GEA", "", "Oi, {v}! Que bom te ver.", "Ah. Oi.", { you: "Bom dia! Tudo bem?" }],
  ["dia", "amigo", "Perguntar como foi o dia", "chat", 2, "GTB", "O", "Foi corrido, mas melhorou agora que alguém perguntou.", "Normal. Por quê?", {}],
  ["roupa", "amigo", "Elogiar a roupa", "shirt", 2, "OGE", "S", "Gostou? Eu mesmo escolhi o tecido!", "...Isso é ironia?", { you: "Que roupa bonita, hein!" }],
  ["cabelo", "amigo", "Elogiar o cabelo", "hair", 2, "OTG", "S", "*passa a mão no cabelo* Obrigado, levei uma hora.", "Hm. Tá desarrumado hoje, na verdade.", {}],
  ["tapinha", "amigo", "Tapinha nas costas", "smile", 2, "AES", "T", "*ri* Valeu, parceiro!", "Ai! Mais devagar...", {}],
  ["abraco", "amigo", "Abraço de amigo", "heart", 3, "GEC", "OS", "*abraça forte* Precisava disso!", "*fica duro igual estátua* ...Tá. Chega.", { req: "friend" }],
  ["tempo", "amigo", "Falar do tempo", "cloud", 1, "BTG", "A", "Dizem que amanhã chove. Meu joelho nunca erra.", "Você me parou pra falar do tempo?", {}],
  ["familia", "amigo", "Perguntar da família", "house", 2, "GBT", "O", "Minha mãe mandou lembranças! Ela fala de você.", "Família é assunto meu.", {}],
  ["aventura", "amigo", "Contar uma aventura", "sword", 3, "ACE", "T", "E aí? O que aconteceu depois?! Conta tudo!", "Hm... parece meio inventado.", { you: "Aí o lobo pulou e eu... BAM! Feitiço na cara!" }],
  ["ouvir", "amigo", "Ouvir os problemas", "eye", 4, "TGS", "", "*suspira* Obrigado por me ouvir. Ninguém faz isso.", "Esquece, não quero falar disso.", { time: 30 }],
  ["obrigado", "amigo", "Agradecer por tudo", "heart", 2, "GBT", "", "Ah, que isso! Amigo é pra essas coisas.", "Tá... de nada?", {}],
  ["caminhar", "amigo", "Convidar para caminhar", "flag", 3, "AGB", "S", "Bora! Uma volta na praça faz bem.", "Agora não, estou ocupado.", { time: 40, fun: 6, energy: -3 }],
  ["lanche", "amigo", "Dividir um lanche", "bread", 3, "CGE", "", "Hmm! Você sempre traz coisa boa.", "Não estou com fome, valeu.", { cost: 4, fx: () => (player.food = Math.min(100, (player.food ?? 100) + 15)) }],
  ["trabalho", "amigo", "Elogiar o trabalho", "hammer", 3, "SOX", "", "Finalmente alguém repara! Dou duro todo dia.", "Elogio não paga as contas.", {}],
  ["sonho", "amigo", "Perguntar o sonho da vida", "star", 3, "ATB", "", "Meu sonho? Ver o mar do outro lado do mundo...", "Sonhar é pra quem tem tempo.", {}],
  ["mascote", "amigo", "Mostrar seu mascote", "paw", 3, "CGE", "S", "Que fofura! Posso fazer carinho?", "Mantenha esse bicho longe de mim.", { req: () => !!player.pet }],
  ["brinde", "amigo", "Propor um brinde", "mug", 2, "EAO", "S", "Saúde! À nossa amizade!", "Não bebo em serviço.", {}],
  ["animar", "amigo", "Encorajar", "joy", 3, "TGA", "O", "Você acha mesmo que eu consigo? ...Obrigado.", "Eu não preciso de incentivo.", {}],
  ["promessa", "amigo", "Prometer ajudar sempre", "flag", 3, "GTS", "X", "Vou cobrar essa promessa, hein!", "Promessa é fácil fazer.", { req: "friend" }],
  ["saudade", "amigo", "Dizer que sentiu saudade", "heart", 3, "GTC", "O", "Eu também! Você sumiu!", "Saudade? A gente se viu ontem.", { req: "friend" }],

  /* ---------- ENGRAÇADO (15) ---------- */
  ["piada", "graca", "Contar uma piada", "laugh", 3, "EAC", "SB", "HAHAHA! Essa foi boa!", "*silêncio constrangedor* ...Entendi. Acho.", { you: "@piada", fun: 8 }],
  ["careta", "graca", "Fazer careta", "laugh", 2, "CEA", "OS", "Pfff! Para, para! Hahaha!", "Que coisa infantil.", { fun: 5 }],
  ["coletor", "graca", "Imitar o Coletor Real", "coin", 3, "EXA", "S", "\"Imposto do imposto do imposto!\" HAHAHA, igualzinho!", "Cuidado, as paredes têm ouvidos.", { fun: 8, you: "*voz fina* Ouro, ouro, ouuuro! Paga o imposto da respiração!" }],
  ["rainha", "graca", "Imitar a Rainha", "crown", 3, "EAX", "SBG", "Hahaha! Se a Guarda ouve, você tá frito!", "Isso é falta de respeito com a Coroa!", { fun: 8, rep: -1 }],
  ["galinha", "graca", "Imitar uma galinha", "laugh", 3, "CEG", "O", "Có-có-có! HAHAHA, você é doido!", "...As pessoas estão olhando.", { fun: 10, you: "Có-có-CÓÓÓ! *bate os braços*" }],
  ["trocadilho", "graca", "Fazer um trocadilho ruim", "chat", 2, "EXB", "OA", "*geme* Que horrível... HAHA, horrível!", "Eu vou fingir que não ouvi.", { you: "Sabe qual é o feitiço preferido do padeiro? Pão-cus-pocus!" }],
  ["fantasma", "graca", "Fingir que viu um fantasma", "skull", 2, "EAC", "TG", "AAAH! ...Seu bobo! Quase morri!", "Ai! Isso não tem graça, eu tenho medo!", { fun: 6 }],
  ["danca", "graca", "Dança desengonçada", "party", 3, "ECG", "O", "*dança junto* Ninguém segura a gente!", "Por favor, pare.", { fun: 10, energy: -4 }],
  ["moeda", "graca", "Truque da moeda na orelha", "coin", 3, "CXE", "", "Como você fez isso?! Faz de novo!", "Eu vi a moeda na sua manga.", { fun: 6 }],
  ["anao", "graca", "Contar piada de anão", "laugh", 2, "EA", "SG", "HAHA! Não conta pro Brann!", "Isso é meio preconceituoso, né?", { fun: 5 }],
  ["cocegas", "graca", "Fazer cócegas", "laugh", 4, "CEG", "OS", "HAHAHA para! PARA! Hahaha!", "Não encosta em mim!", { req: "friend", fun: 10 }],
  ["serio", "graca", "Desafio de não rir", "meh", 3, "EXC", "", "*segura* ...*segura*... PFFFHAHAHA! Perdi!", "*cara de pedra* Ganhei. Fácil.", { fun: 8 }],
  ["musica", "graca", "Inventar uma música boba", "note", 3, "ECA", "S", "\"O {v} comeu pão e caiu no chão\"... HAHA, canta de novo!", "Meus ouvidos...", { fun: 8 }],
  ["magica", "graca", "Truque de mágica com faíscas", "sparkle", 3, "CAX", "S", "Uau! Que faíscas lindas!", "Magia não é brinquedo.", { fun: 6 }],
  ["escorregar", "graca", "Fingir que escorregou", "sweat", 2, "ECG", "O", "*corre ajudar* Tudo bem?! ...Ah, era brincadeira! HAHA!", "Hm. Que susto à toa.", { fun: 5 }],

  /* ---------- CONVERSA (15) ---------- */
  ["magiaP", "papo", "Falar de magia", "staff", 3, "BXA", "C", "As runas cantam, sabia? Quem escuta, aprende.", "Magia me dá arrepio.", {}],
  ["comida", "papo", "Falar de comida", "stew", 3, "CGE", "", "O ensopado da taverna! Nada supera.", "Só penso em comida quando tenho fome.", {}],
  ["politica", "papo", "Falar de política do reino", "crown", 3, "SXB", "CE", "A Coroa cobra demais e explica de menos.", "Política dá briga. Não, obrigado.", {}],
  ["reinos", "papo", "Falar dos reinos vizinhos", "flag", 3, "AXB", "", "Dizem que em Marés o mar brilha à noite!", "Nunca saí daqui. Nem quero.", {}],
  ["guerra", "papo", "Falar sobre a guerra", "sword", 3, "SAO", "TG", "Guerra é negócio de rei. Quem paga é o povo.", "Não quero pensar nisso.", { req: "life" }],
  ["silencio", "papo", "Falar do Silenciador", "skull", 3, "SBA", "TC", "Desde que a Canção calou, até os pássaros cantam baixo.", "Não diga esse nome em voz alta!", { req: "story" }],
  ["amorP", "papo", "Falar sobre amor", "heart", 3, "GTB", "S", "Amor é quando a pessoa some e o dia fica sem cor.", "Amor? Hm. Assunto encerrado.", {}],
  ["passado", "papo", "Perguntar do passado", "scroll", 3, "BGS", "O", "Quando eu era criança, a vila era só uma estrada de terra.", "O passado fica onde está.", {}],
  ["livros", "papo", "Falar de livros", "book", 3, "BXT", "AC", "Você leu As Crônicas de Vesper? Me empresta!", "Livro me dá sono.", {}],
  ["bichos", "papo", "Falar de animais", "paw", 3, "CGA", "", "Eu tinha um cachorro chamado Biscoito. Saudade...", "Bicho só dá trabalho.", {}],
  ["moda", "papo", "Falar de moda", "hat", 3, "OEG", "S", "Chapéu pontudo voltou! A Mylena que lançou.", "Roupa serve pra esquentar. Fim.", {}],
  ["oficio", "papo", "Falar de trabalho", "hammer", 3, "SXO", "C", "Hoje vendi o dobro. Mas o Coletor levou metade.", "Fora do expediente eu não falo de trabalho.", {}],
  ["templo", "papo", "Falar da fé e do Templo", "sparkle", 3, "BGT", "X", "O monge diz que até o silêncio tem uma canção.", "Cada um com sua fé.", {}],
  ["lendas", "papo", "Contar lendas antigas", "book", 3, "ACB", "S", "E o dragão debaixo do lago? Você acredita?", "Lenda é história pra boi dormir.", {}],
  ["conselho", "papo", "Pedir um conselho", "book", 2, "BGS", "C", "@conselho", "Conselho? Eu mal sei cuidar da minha vida.", {}],
  ["fofoca", "papo", "Fofocar sobre alguém", "eye", 3, "EXO", "SB", "Não acredito! {o} fez isso?! Conta mais!", "Não gosto de falar dos outros pelas costas. Nem de {o}.", { rep: -1 }],

  /* ---------- ATIVIDADES (15) ---------- */
  ["beber", "ativ", "Beber juntos na taverna", "mug", 5, "EAO", "C", "Mais uma rodada! Hoje eu pago a próxima!", "Bebo pouco, mas obrigado.", { cost: 8, time: 90, fun: 15, fx: () => (player.drunk = Math.min(110, (player.drunk || 0) + 15)) }],
  ["dados", "ativ", "Jogar dados", "gem", 3, "AXE", "B", "Seis e seis! Mais uma!", "Jogo de azar não é comigo.", { time: 30, fun: 10, fx: () => (player.gold += Math.random() < 0.5 ? 5 : -Math.min(player.gold, 5)) }],
  ["cartas", "ativ", "Jogar cartas", "scroll", 3, "XSB", "C", "Truco! Hahaha, eu sabia!", "Você rouba nas cartas, eu sei.", { time: 40, fun: 10 }],
  ["braco", "ativ", "Queda de braço", "anger", 3, "AOS", "TG", "*bate na mesa* Revanche! Agora!", "Não vou suar à toa.", { energy: -6, fun: 8 }],
  ["pescar", "ativ", "Pescar juntos", "fish", 4, "BGA", "O", "Pegou um! Hoje o jantar é por sua conta.", "Pescar é tão parado...", { time: 120, fun: 10, energy: -5, fx: () => Math.random() < 0.5 && addItem("peixe") }],
  ["treinar", "ativ", "Treinar juntos", "sword", 4, "ASO", "TC", "Boa esquiva! Você melhorou muito.", "Hoje não, meus braços doem.", { time: 60, energy: -10, fx: () => (player.xp = (player.xp || 0) + 5) }],
  ["cantar", "ativ", "Cantar juntos", "note", 3, "EGC", "S", "♪ Lá na serra tem um anão... ♪ Hahaha!", "Eu canto mal. Muito mal.", { fun: 10 }],
  ["sol", "ativ", "Ver o pôr do sol", "sun", 4, "GTB", "", "Olha essas cores... Valeu a pena parar.", "Já vi muitos. São todos iguais.", { req: "day", time: 45, fun: 8 }],
  ["praca", "ativ", "Passear na praça", "flower", 3, "GEC", "", "Olha, artistas de rua! Vamos ver!", "Muita gente. Eu prefiro sossego.", { time: 45, fun: 8, energy: -3 }],
  ["corrida", "ativ", "Apostar corrida", "bolt", 3, "ACE", "BT", "Ganhei! Hahaha, de novo amanhã!", "*ofegante* Nunca mais...", { energy: -8, fun: 10 }],
  ["flores", "ativ", "Colher flores no campo", "flower", 3, "GTC", "S", "Essas amarelas são as mais bonitas!", "Tenho alergia...", { req: "day", time: 40, fx: () => Math.random() < 0.6 && addItem("flor") }],
  ["xadrez", "ativ", "Jogar xadrez", "crown", 4, "XBS", "CE", "Xeque-mate. Mas você jogou muito bem.", "Muito devagar. Desisto.", { time: 60, fun: 6 }],
  ["estrelas", "ativ", "Contar estrelas", "star", 4, "TGB", "", "Aquela ali parece um cajado! Olha!", "Está frio aqui fora.", { req: "night", time: 45, fun: 8 }],
  ["templo2", "ativ", "Visitar o Templo juntos", "sparkle", 3, "BGT", "X", "Acendi uma vela por nós dois.", "Templo me dá sono.", { time: 40, fx: () => (player.blessDay = Math.random() < 0.3 ? player.day : player.blessDay) }],
  ["padaria", "ativ", "Tomar café na padaria", "cake", 4, "CGE", "", "Esse bolo de mel é de outro mundo!", "Já comi, obrigado.", { cost: 10, time: 40, fun: 6, fx: () => (player.food = Math.min(100, (player.food ?? 100) + 30)) }],

  /* ---------- AJUDAR (12) ---------- */
  ["tarefas", "ajuda", "Ajudar nas tarefas", "hammer", 5, "SGT", "O", "Que mão na roda! Terminamos rapidinho.", "Eu dou conta sozinho.", { time: 60, energy: -8 }],
  ["compras", "ajuda", "Carregar as compras", "crate", 4, "GBT", "O", "Minhas costas agradecem!", "Não precisa, tá leve.", { energy: -5 }],
  ["consertar", "ajuda", "Consertar algo da casa", "hammer", 4, "SGX", "", "A porta parou de ranger! Você é demais.", "Hm... ficou pior?", { time: 60, energy: -6 }],
  ["pet", "ajuda", "Cuidar do bicho dele", "paw", 4, "CGT", "", "Ele gostou de você! Raro, viu?", "Ele não gosta de estranhos.", { time: 30 }],
  ["ler", "ajuda", "Ensinar a ler", "book", 5, "TCB", "O", "Eu li a placa da taverna sozinho! Obrigado!", "Eu já sei ler, tá?", { time: 60 }],
  ["ensinar", "ajuda", "Ensinar um truque de magia", "staff", 4, "AXC", "S", "Saiu uma faísca! Eu fiz magia!", "Não leve a mal, mas magia não é pra mim.", { req: "story", time: 30 }],
  ["oficio2", "ajuda", "Ensinar seu ofício", "hammer", 4, "SXA", "O", "Agora eu entendi o segredo!", "Cada um no seu ofício.", { req: "life", time: 60 }],
  ["emprestar", "ajuda", "Emprestar 20 de ouro", "coin", 5, "GTX", "O", "Você salvou meu mês! Devolvo assim que der.", "Não preciso de esmola!", { cost: 20 }],
  ["valentao", "ajuda", "Defender de um valentão", "sword", 6, "TGC", "", "Você enfrentou ele por mim? ...Nunca vou esquecer.", "Eu sabia me virar sozinho.", { energy: -5, rep: 2 }],
  ["recado", "ajuda", "Levar um recado", "scroll", 3, "SGB", "", "Entregou? Ótimo! Você é de confiança.", "Eu mesmo levo, obrigado.", { time: 30 }],
  ["pedirEmp", "ajuda", "Pedir 50 de ouro emprestado", "coin", 0, "", "", "Tá bom, 50 de ouro. Mas me devolve, hein!", "Emprestar? A gente nem é tão próximo assim.", { special: "loan" }],
  ["pagar", "ajuda", "Pagar a dívida (50 ouro)", "coin", 4, "", "", "Pagou certinho! Gente honesta é rara.", "", { special: "repay", req: "debt" }],

  /* ---------- ROMÂNTICO (20) ---------- */
  ["flertar", "amor", "Flertar", "blush", 3, "OEA", "S", "*fica vermelho* Você é ousado, hein...", "Hm. Guarde isso pra outra pessoa.", { req: "romance" }],
  ["piscar", "amor", "Piscar o olho", "blush", 2, "EAO", "T", "*pisca de volta* ...", "Tem algo no seu olho?", { req: "romance" }],
  ["olhos", "amor", "Elogiar os olhos", "eye", 3, "TGO", "", "Ninguém nunca me disse isso...", "Você fala isso pra todo mundo.", { req: "romance" }],
  ["poema", "amor", "Recitar um poema", "book", 4, "BTG", "A", "*suspira* Foi você que escreveu?", "Rimou \"amor\" com \"flor\"? Sério?", { req: "romance", you: "\"Teus olhos são runas de luz, e meu coração... é teu cajado.\"" }],
  ["cantada", "amor", "Cantada medieval", "chat", 3, "EAO", "SB", "HAHA! Essa foi péssima. Adorei.", "Por favor, pare de falar.", { req: "romance", you: "Você é mágico? Porque quando te vejo, todo mundo some." }],
  ["mao", "amor", "Segurar a mão", "heart", 4, "TGB", "", "*aperta sua mão de volta*", "*puxa a mão* Calma, vamos devagar.", { req: "romance" }],
  ["sussurrar", "amor", "Sussurrar no ouvido", "blush", 4, "TOE", "S", "*arrepia* ...Fala de novo.", "Que isso! Aqui na frente de todos?", { req: "partner" }],
  ["dancaL", "amor", "Dança lenta", "note", 5, "GTB", "", "*encosta a cabeça no seu ombro*", "Eu piso no seu pé, sério.", { req: "partner", fun: 10 }],
  ["beijoR", "amor", "Beijo no rosto", "blush", 4, "GTC", "", "*sorri de canto* Que fofo.", "Ei! Pede antes!", { req: "romance" }],
  ["beijo", "amor", "Beijo apaixonado", "heart", 6, "GOA", "", "*sem fôlego* ...Uau.", "Hoje não, tô gripado.", { req: "partner", fun: 12 }],
  ["teamo", "amor", "Dizer \"eu te amo\"", "heart", 6, "GTB", "", "Eu também te amo. Muito.", "...Eu ainda não consigo dizer isso.", { req: "partner" }],
  ["serenata", "amor", "Fazer uma serenata", "note", 6, "TOG", "S", "*abre a janela* A vila inteira ouviu... e eu amei!", "Silêncio! Tem gente dormindo!", { req: "romance", req2: "night", fun: 8 }],
  ["florA", "amor", "Dar uma flor", "flower", 5, "GTO", "", "*cheira* É a minha cor preferida!", "Obrigado... vou pôr na água.", { req: "romance", item: "flor" }],
  ["futuro", "amor", "Falar do futuro juntos", "house", 5, "SGB", "A", "Uma casinha com horta... e você. É tudo que eu quero.", "Vamos viver o hoje primeiro?", { req: "partner" }],
  ["filhosP", "amor", "Planejar ter filhos", "baby", 4, "GSB", "A", "Um menino ou uma menina? Tanto faz, desde que puxe você.", "Ainda não estou pronto pra isso.", { req: "spouse" }],
  ["massagem", "amor", "Massagem nos ombros", "heart", 5, "STO", "", "Aaah... aí mesmo. Não para.", "Ai! Mão pesada!", { req: "partner", energy: 3 }],
  ["arvore", "amor", "Gravar os nomes numa árvore", "heart", 5, "TGA", "B", "\"{v} + {n}\"... Agora é pra sempre.", "Coitada da árvore.", { req: "partner", time: 30 }],
  ["cafe", "amor", "Levar café na cama", "tea", 5, "GSO", "", "Você existe mesmo? Que delícia de manhã.", "Eu não tomo café, amor.", { req: "spouse", req2: "day" }],
  ["ciume", "amor", "Fazer ciúme de brincadeira", "anger", 2, "OE", "TG", "Ah é? Então eu também sei jogar esse jogo!", "Isso não tem graça. Fiquei chateado.", { req: "partner" }],
  ["juras", "amor", "Fazer juras de amor eterno", "ring", 6, "GTB", "X", "Eu juro de volta. Pela Canção Arcana.", "Eterno é muito tempo...", { req: "partner" }],

  /* ---------- MALVADO (16) ---------- */
  ["discutir", "mal", "Discutir", "anger", -8, "", "", "Você acha que manda em tudo, né?", "", { mean: true, fun: -5, rep: -1 }],
  ["insultar", "mal", "Insultar", "anger", -10, "", "", "Como é que é?! Repete se tiver coragem!", "", { mean: true, rep: -2, you: "Você tem cara de batata cozida." }],
  ["zombarRoupa", "mal", "Zombar da roupa", "shirt", -6, "", "", "Pelo menos eu tenho espelho em casa.", "", { mean: true, rep: -1 }],
  ["empurrar", "mal", "Empurrar", "anger", -10, "", "", "Ei! Encosta em mim de novo pra você ver!", "", { mean: true, rep: -3 }],
  ["roubarLanche", "mal", "Roubar o lanche dele", "bread", -8, "", "", "Meu pão! Devolve, seu ladrão!", "", { mean: true, rep: -3, fx: () => (player.food = Math.min(100, (player.food ?? 100) + 15)) }],
  ["boato", "mal", "Espalhar um boato", "eye", -12, "", "", "Foi VOCÊ que inventou aquilo?! A vila toda tá rindo de mim!", "", { mean: true, rep: -4 }],
  ["ameacar", "mal", "Ameaçar", "skull", -14, "", "", "*recua* ...Você não teria coragem.", "", { mean: true, rep: -5 }],
  ["rir", "mal", "Rir da cara dele", "laugh", -6, "", "", "Tá rindo de quê? Qual é a graça?", "", { mean: true, rep: -1, fun: 3 }],
  ["ignorar", "mal", "Ignorar de propósito", "meh", -4, "", "", "...Tá me ignorando? Tá bom. Anotado.", "", { mean: true }],
  ["olhos2", "mal", "Revirar os olhos", "meh", -4, "", "", "Revirou os olhos pra mim? Que maduro.", "", { mean: true }],
  ["pe", "mal", "Pisar no pé", "anger", -6, "", "", "AI! Foi de propósito, eu vi!", "", { mean: true, rep: -1 }],
  ["duelo", "mal", "Desafiar para um duelo", "sword", -5, "", "", "Duelo? Ao meio-dia, na praça. Não se atrase.", "", { mean: true, energy: -6 }],
  ["covarde", "mal", "Chamar de covarde", "anger", -9, "", "", "Covarde é quem fala e sai correndo!", "", { mean: true, rep: -2 }],
  ["chapeu", "mal", "Derrubar o chapéu dele", "hat", -7, "", "", "Meu chapéu! Na lama! Você me paga!", "", { mean: true, rep: -2, fun: 4 }],
  ["segredo", "mal", "Contar um segredo dele a todos", "chat", -15, "", "", "Eu confiei em você! NUNCA MAIS!", "", { mean: true, rep: -5, req: "friend" }],
  ["traicao", "mal", "Dizer que tem outra pessoa", "anger", -25, "", "", "...O quê? Quem é? QUEM É?!", "", { mean: true, rep: -3, req: "partner" }],

  /* ---------- FAZER AS PAZES (6) ---------- */
  ["desculpa", "paz", "Pedir desculpas", "heart", 6, "GBT", "O", "Tudo bem. Eu também exagerei.", "Desculpas aceitas... mais ou menos.", {}],
  ["paz", "paz", "Oferecer um presente de paz", "gift", 8, "GOC", "", "*pega o pacote* ...Tá bom. Está perdoado.", "Não é com presente que se resolve.", { cost: 15 }],
  ["abracoP", "paz", "Abraço de reconciliação", "heart", 6, "GTC", "OS", "*abraça* Senti falta de você, sabia?", "Ainda é cedo pra abraço.", {}],
  ["explicar", "paz", "Explicar o que aconteceu", "chat", 5, "SBX", "O", "Entendi. Foi um mal-entendido, então.", "Explicação não muda o que você fez.", {}],
  ["carta", "paz", "Escrever uma carta de perdão", "scroll", 6, "TBG", "", "Eu li três vezes. Obrigado por ter escrito.", "Rasguei sem ler. Desculpa.", { time: 30 }],
  ["bolo", "paz", "Levar um bolo de desculpas", "cake", 7, "CGE", "", "Bolo de mel?! Ok, ok, você venceu!", "Estou de dieta. E bravo.", { cost: 12 }],
];

const INTER_BY_KEY = Object.fromEntries(INTERACTIONS.map((r) => [r[0], r]));
const MEAN_REPLY = {
  gentil: "Por que você está fazendo isso comigo?",
  engracado: "Nossa, perdeu a graça agora.",
  aventureiro: "Quer briga? Então vem!",
  timido: "*os olhos enchem de lágrimas* ...",
  serio: "Vou lembrar disso.",
  orgulhoso: "Você sabe com quem está falando?!",
  esperto: "Hm. Isso vai ter troco.",
  sabio: "Quem planta raiva colhe solidão.",
  crianca: "Buáá! Vou contar pra minha mãe!",
};

function isRomanticWith(id) {
  return player.spouse === id || player.dating === id || (player.lovers || []).includes(id) || (player.sspouses || []).includes(id);
}
function interReqOk(req, id) {
  if (!req) return true;
  if (typeof req === "function") return req(id);
  switch (req) {
    case "romance":
      return ROMANCE.includes(id) && (isRomanticWith(id) || friendshipLevel(id) >= 2);
    case "partner":
      return isRomanticWith(id);
    case "spouse":
      return player.spouse === id || (player.sspouses || []).includes(id);
    case "friend":
      return friendshipLevel(id) >= 2;
    case "night":
      return isNight();
    case "day":
      return !isNight();
    case "story":
      return !lifeMode();
    case "life":
      return lifeMode();
    case "debt":
      return player.debtTo === id;
  }
  return true;
}
function interAvailable(r, id) {
  const x = r[9];
  if (r[0] === "pedirEmp" && player.debtTo === id) return false;
  return interReqOk(x.req, id) && interReqOk(x.req2, id);
}
function interDoneToday(id, key) {
  return player.relDay[id + "x" + key] === player.day;
}
/** Quantas interações existem (para o README e o Guia). */
function interactionCount() {
  return INTERACTIONS.length;
}

/* ===================== MENU EM PIZZA ===================== */

/** Onde a pessoa está agora (para o círculo abrir em volta dela). */
function interAnchorFor(id) {
  if (game.pieAnchor) return { x: game.pieAnchor.x, y: game.pieAnchor.y };
  const sp = (typeof crewSpot === "function" && crewSpot(id)) || npcSpot(id);
  if (sp && Math.abs(sp[0] - player.x) + Math.abs(sp[1] - player.y) <= 8) return { x: sp[0], y: sp[1] };
  const w = (game.walkers || []).find((q) => q.cid === id);
  if (w) return { x: w.x, y: w.y };
  return { x: player.x, y: player.y };
}
const IP_PAGE = 7;
const PSN = { gentil: "Gentil", engracado: "Engraçado", aventureiro: "Aventureiro", timido: "Tímido", serio: "Sério", orgulhoso: "Orgulhoso", esperto: "Esperto", sabio: "Sábio", crianca: "Criança" };

/** Abre as interações em círculo: primeiro as categorias, depois as ações (7 por vez). */
function openInterPanel(id, cat, page = 0) {
  if (!NPCS[id]) return;
  game.ipId = id;
  game.ipAnchor = game.ipAnchor && game.ipAnchor.id === id ? game.ipAnchor : { ...interAnchorFor(id), id };
  const n = NPCS[id].nome.split(",")[0];
  const ps = PERSONALITIES[id] || "gentil";
  const status = player.spouse === id ? "Casados" : player.dating === id ? "Namorando" : isRomanticWith(id) ? "Romance" : REL_LV[friendshipLevel(id)][1];
  const info = `<span class="pie-info">${PSN[ps] || ps} · ${status} · <span class="pie-heart">${iconHTML("heart", 12)}${friendship(id)}/100</span></span>`;
  if (!cat) {
    game.pieAnchor = { x: game.ipAnchor.x, y: game.ipAnchor.y, group: "Interações", ring: "cats" };
    const opts = INTER_CATS.map((c) => {
      const cnt = INTERACTIONS.filter((r) => r[1] === c.k && interAvailable(r, id)).length;
      return {
        t: `${c.n} (${cnt})`,
        icon: c.icon,
        cls: c.k === "amor" ? "love" : c.k === "mal" ? "mean" : "cat",
        off: !cnt,
        fn: () => openInterPanel(id, c.k, 0),
      };
    });
    opts.push({ t: "Voltar", icon: "door", fn: () => ((game.pieAnchor = { x: game.ipAnchor.x, y: game.ipAnchor.y }), (game.ipAnchor = null), socialMenu(id)) });
    return choice(n, info, opts);
  }
  const C = INTER_CATS.find((c) => c.k === cat);
  const list = INTERACTIONS.filter((r) => r[1] === cat && interAvailable(r, id));
  const pages = Math.max(1, Math.ceil(list.length / IP_PAGE));
  page = ((page % pages) + pages) % pages;
  game.pieAnchor = { x: game.ipAnchor.x, y: game.ipAnchor.y, group: C.n, ring: "acts" };
  const opts = list.slice(page * IP_PAGE, page * IP_PAGE + IP_PAGE).map((r) => {
    const x = r[9];
    const done = interDoneToday(id, r[0]);
    const tag = done ? " · amanhã" : x.cost ? ` · ${withTax(x.cost)} ouro` : x.item ? ` · ${ITEMS[x.item].nome}` : x.time ? ` · ${x.time >= 60 ? x.time / 60 + "h" : x.time + "min"}` : "";
    return { t: r[2] + tag, icon: r[3], cls: cat === "amor" ? "love" : cat === "mal" ? "mean" : "", off: done, fn: () => doInteraction(id, r[0]) };
  });
  if (pages > 1) opts.push({ t: `Mais (${page + 1}/${pages})`, icon: "scroll", cls: "nav", fn: () => openInterPanel(id, cat, page + 1) });
  opts.push({ t: "Voltar", icon: "door", cls: "nav", fn: () => openInterPanel(id) });
  game.ipCat = cat;
  game.ipPage = page;
  choice(n, info, opts);
}
function closeInterPanel() {
  game.ipAnchor = null;
  if (typeof closePie === "function") closePie();
}

/** Faz a interação e mostra a reação. Depois volta para o painel. */
function doInteraction(id, key) {
  const r = INTER_BY_KEY[key];
  const [, cat, label, icon, rel, likes, dislikes, okT, noT, x] = r;
  const n = NPCS[id].nome.split(",")[0];
  const ps = PERSONALITIES[id] || "gentil";
  const code = PS_CODE[ps] || "G";
  const page = game.ipPage || 0;
  const back = () => openInterPanel(id, cat, page);
  const others = Object.keys(FRIENDS).filter((k) => k !== id && NPCS[k]);
  const o = others.length ? NPCS[pickOne(others)].nome.split(",")[0] : "o Coletor";
  const fmt = (s) => (s === "@conselho" ? pickOne(LIFE_ADVICE) : s).replace(/\{n\}/g, n).replace(/\{v\}/g, player.name || "você").replace(/\{o\}/g, o);
  hidePie();
  if (x.cost && player.gold < withTax(x.cost)) return say([["", `Você precisa de ${withTax(x.cost)} de ouro para isso.`]], back);
  if (x.item && !itemCount(x.item)) return say([["", `Você precisa de ${ITEMS[x.item].nome} na bolsa.`]], back);
  if (x.special === "loan") {
    player.relDay[id + "x" + key] = player.day;
    if (friendship(id) < 60 || player.debtTo) {
      addFriendship(id, -2);
      return say([[n, player.debtTo ? "Você ainda deve pra alguém! Paga primeiro." : noT]], back);
    }
    player.gold += 50;
    player.debtTo = id;
    saveGame();
    return say([[n, okT], ["", "Você pegou 50 de ouro emprestado. Pague em Ajudar → Pagar a dívida."]], back);
  }
  if (x.special === "repay") {
    if (player.gold < 50) return say([["", "Você não tem 50 de ouro ainda."]], back);
    player.gold -= 50;
    player.debtTo = null;
    addFriendship(id, rel);
    saveGame();
    return say([[n, okT]], back);
  }
  player.relDay[id + "x" + key] = player.day;
  if (x.cost) payWithTax(x.cost);
  if (x.item) removeItem(x.item);
  if (x.time) {
    player.clock = Math.min(1439, player.clock + x.time);
    if (x.time >= 60) game.fade = 1;
  }
  if (lifeMode()) {
    if (x.energy) addNeed("energy", x.energy);
    if (x.hyg) addNeed("hygiene", x.hyg);
  }
  if (x.rep) repAdd(x.rep);
  const lines = [];
  if (x.you) lines.push(["Você", x.you === "@piada" ? pickOne(LIFE_JOKES) : fmt(x.you)]);
  let ok;
  if (x.mean) {
    ok = true;
    addFriendship(id, rel);
    if (!player.angry) player.angry = {};
    if (rel <= -10) player.angry[id] = player.day;
    lines.push([n, Math.random() < 0.5 ? fmt(okT) : MEAN_REPLY[ps] || fmt(okT)]);
    if (lifeMode() && x.fun) addNeed("fun", x.fun);
    bubble(id, "anger");
    game.shake = Math.abs(rel) >= 10 ? 0.2 : 0;
    playSound(150, 0.12, "square");
  } else {
    let chance = 0.62 + (likes.includes(code) ? 0.26 : 0) - (dislikes.includes(code) ? 0.38 : 0) + (friendship(id) - 30) / 260;
    if (isRomanticWith(id) && cat === "amor") chance += 0.25;
    if (cat === "paz" && angry(id)) chance -= 0.15;
    if (lifeMode() && lifeNeed("hygiene") < 25) chance -= 0.15;
    chance = Math.max(0.08, Math.min(0.96, chance));
    ok = Math.random() < chance;
    if (ok) {
      addFriendship(id, rel);
      if (cat === "paz" && player.angry) delete player.angry[id];
      if (x.fx) x.fx();
      if (lifeMode() && x.fun) addNeed("fun", x.fun);
      bubble(id, cat === "amor" ? "heart" : cat === "graca" ? "laugh" : "smile");
      playSound(cat === "amor" ? 880 : 700, 0.12, "sine");
    } else {
      addFriendship(id, -Math.max(1, Math.ceil(rel / 2)));
      if (cat === "amor" && player.dating !== id && player.spouse !== id && Math.random() < 0.3) repAdd(-1);
      bubble(id, "sweat");
      playSound(240, 0.1, "square");
    }
    lines.push([n, fmt(ok ? okT : noT)]);
  }
  // Romance escondido pode ser visto.
  if (cat === "amor" && ((player.lovers || []).includes(id) || (player.sspouses || []).includes(id)) && typeof witnessCheck === "function") {
    saveGame();
    return say(lines, () => witnessCheck(id));
  }
  saveGame();
  say(lines, back);
}

/** Item que aparece no menu de cada pessoa. */
function lifeSocialItems(id) {
  return [{ t: `Interações… (${INTERACTIONS.filter((r) => interAvailable(r, id)).length})`, icon: "chat", fn: () => ((game.ipAnchor = null), openInterPanel(id)) }];
}

/* ===================== NASCIMENTO ===================== */

/** "Parabéns! É um menino!" / "É uma menina!" com confete. */
function celebrateBirth(g, after) {
  const boy = g === "m";
  let el = byId("birth");
  if (!el) {
    el = document.createElement("div");
    el.id = "birth";
    el.className = "ui";
    byId("screen").appendChild(el);
  }
  const conf = Array.from({ length: 36 }, (_, i) => {
    const c = boy ? ["#5aa8ff", "#9fd0ff", "#f2c14e", "#ffffff"][i % 4] : ["#ff8aa8", "#ffc0d4", "#f2c14e", "#ffffff"][i % 4];
    return `<i style="left:${(i * 37) % 100}%;background:${c};animation-delay:${(i % 9) * 0.12}s;animation-duration:${2 + (i % 5) * 0.4}s"></i>`;
  }).join("");
  el.className = "ui " + (boy ? "boy" : "girl");
  el.innerHTML = `${conf}<div class="birth-card">
      <div class="birth-ic">${iconHTML("baby", 48)}</div>
      <div class="birth-top">Parabéns!</div>
      <div class="birth-big">${boy ? "É um menino!" : "É uma menina!"}</div>
      <div class="birth-sub">Um novo ${boy ? "herdeiro" : "amor"} chegou à família ${iconHTML("heart", 14)}</div>
      <button class="birth-ok">Escolher o nome</button>
    </div>`;
  el.style.display = "block";
  game.mode = "birth";
  playSound(784, 0.2, "sine");
  setTimeout(() => playSound(988, 0.2, "sine"), 160);
  setTimeout(() => playSound(1175, 0.35, "sine"), 320);
  const done = () => {
    el.style.display = "none";
    game.mode = "world";
    if (after) after();
  };
  el.querySelector(".birth-ok").onclick = done;
  game.birthDone = done;
}
