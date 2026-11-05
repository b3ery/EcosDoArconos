/**
 * ECOS DO ARCANO — 39-interacoes-mais.js
 * Mais de 250 interações novas (o total passa de 400), com categorias novas:
 * Elogiar, Brincadeiras, Jogos, Família e vizinhança, Reino (inclui o Iluminismo)
 * e Coração (romance mais leve, para quem ainda não namora).
 * Formato compacto: [texto do botão, ícone, resposta boa, resposta ruim].
 */

"use strict";

INTER_CATS.push(
  { k: "elog", n: "Elogiar", icon: "star" },
  { k: "brinc", n: "Brincadeiras", icon: "laugh" },
  { k: "jogo", n: "Jogos", icon: "gem" },
  { k: "fam", n: "Família e vizinhança", icon: "house" },
  { k: "reino", n: "Reino", icon: "crown" },
  { k: "cor", n: "Coração", icon: "heart" },
);
const BAD_GENERIC = ["Hm. Tá.", "Agora não, por favor.", "...Ok?", "Não é bem o meu dia.", "Que estranho isso.", "Depois a gente fala."];
function addInter(cat, base, rows) {
  rows.forEach(([label, icon, ok, bad, extra], i) => {
    const key = cat + "_" + slugItem(label).slice(2);
    if (INTER_BY_KEY[key]) return;
    const row = [key, cat, label, icon, base.rel, base.likes || "", base.dislikes || "", ok, bad || BAD_GENERIC[i % BAD_GENERIC.length], Object.assign({}, base.x || {}, extra || {})];
    INTERACTIONS.push(row);
    INTER_BY_KEY[key] = row;
  });
}

/* ---------- ELOGIAR (30) ---------- */
addInter("elog", { rel: 3, likes: "OGTE", dislikes: "S" }, [
  ["Elogiar o sorriso", "smile", "Ah, para! Agora eu vou sorrir o dia todo."],
  ["Elogiar a inteligência", "book", "Finalmente alguém reconhece!"],
  ["Elogiar a coragem", "sword", "Coragem? Eu só finjo bem. Mas obrigado!"],
  ["Elogiar o bom gosto", "gem", "Tenho mesmo, né? Que bom que você percebeu."],
  ["Elogiar a voz", "note", "Quer que eu cante alguma coisa? Mentira, tenho vergonha."],
  ["Elogiar o trabalho bem feito", "hammer", "Dei o sangue nisso. Obrigado por notar."],
  ["Elogiar a gentileza", "heart", "A gente tenta ser bom num mundo difícil, né?"],
  ["Elogiar a força", "anger", "*flexiona o braço* Treino todo dia!"],
  ["Elogiar a risada", "laugh", "HAHAHA! Ah, é contagiante, né?"],
  ["Elogiar o perfume", "flower", "É de lavanda! A Floricultura Jasmim tem."],
  ["Elogiar a paciência", "clock", "Paciência eu tenho. Tempo é que me falta."],
  ["Elogiar o jeito de falar", "chat", "Sério? Minha mãe diz que eu falo demais."],
  ["Elogiar a casa", "house", "Quer entrar pra um chá um dia desses?"],
  ["Elogiar os olhos", "eye", "Ninguém nunca tinha reparado nos meus olhos."],
  ["Elogiar o chapéu", "hat", "Esse chapéu é herança do meu avô!"],
  ["Elogiar a comida que fez", "stew", "Receita de família! Um dia te ensino."],
  ["Elogiar a honestidade", "scroll", "Mentir dá muito trabalho. Prefiro a verdade."],
  ["Elogiar o senso de humor", "laugh", "Alguém finalmente entende as minhas piadas!"],
  ["Elogiar a pontualidade", "clock", "Atrasado eu só fico pra ir embora da festa."],
  ["Elogiar a criatividade", "sparkle", "Eu tenho mil ideias. Faltam mil mãos."],
  ["Elogiar a calma", "cloud", "Respira fundo e conta até dez. Funciona!"],
  ["Elogiar o jeito com crianças", "baby", "Criança é sincera. Eu gosto disso."],
  ["Elogiar o jeito com animais", "paw", "Os bichos sentem quando a gente é do bem."],
  ["Elogiar a roupa nova", "shirt", "Comprei na Alfaiataria! Estava em promoção."],
  ["Elogiar o cabelo arrumado", "hair", "Levei meia hora. Valeu cada minuto."],
  ["Dizer que é a melhor pessoa da vila", "crown", "A melhor? Você vai me deixar convencido!", "Exagero. Mas obrigado."],
  ["Dizer que admira muito", "star", "Eu? Admirado? Isso me pegou de surpresa."],
  ["Elogiar em público", "flag", "*todo mundo olha* Ai, que vergonha boa!", "Shh! Todo mundo olhando!"],
  ["Mandar um bilhete de elogio", "scroll", "Vou guardar esse bilhete na gaveta das coisas boas."],
  ["Agradecer por existir", "heart", "Que coisa mais bonita de se ouvir."],
]);

/* ---------- BRINCADEIRAS (30) ---------- */
addInter("brinc", { rel: 3, likes: "ECA", dislikes: "SO", x: { fun: 7 } }, [
  ["Brincar de pega-pega", "bolt", "Tá com você! HAHA, me pega!"],
  ["Brincar de esconde-esconde", "eye", "Achei você atrás do barril! Fácil demais."],
  ["Jogar pedrinhas no lago", "drop", "Quatro pulos! Bate essa!"],
  ["Fazer guerra de folhas", "herb", "Tem folha até no meu ouvido! HAHA!"],
  ["Imitar um bicho", "paw", "Isso era um bode ou uma vaca? Não importa, ri muito!"],
  ["Desafio do equilíbrio no muro", "flag", "Você caiu primeiro! Eu venci!"],
  ["Fazer cosquinha com uma pena", "feather", "HAHAHA para! Para!"],
  ["Contar uma charada", "scroll", "Pensa, pensa... desisto! Qual é?"],
  ["Brincar de estátua", "statue", "...*treme*... perdi! HAHA!"],
  ["Jogar água de brincadeira", "water", "AH! Gelada! Agora é guerra!", "Tá maluco? Molhou tudo!"],
  ["Fazer bolhas de sabão", "soap", "Que lindas! Olha aquela gigante!"],
  ["Competir quem assobia mais alto", "note", "*assobia* O cachorro do moleiro veio correndo!"],
  ["Desenhar no chão com giz", "staff", "Desenhei você! ...Ficou parecido com uma batata."],
  ["Brincar de adivinhar o pensamento", "eye", "Você está pensando em... comida! Acertei?"],
  ["Inventar uma dança nova", "party", "Vamos chamar de 'a dança do Javali'!"],
  ["Jogar pião", "top", "Rodou um minuto inteiro! Recorde!"],
  ["Fazer careta no espelho do mercado", "mirror", "HAHA! O espelho quase rachou!"],
  ["Fingir ser estátua da praça", "statue", "Uma senhora deixou uma moeda pra mim!"],
  ["Brincar de telefone sem fio", "chat", "'Batata com mel'? Eu disse 'sapato de papel'!"],
  ["Pular corda", "bolt", "Cinquenta pulos sem errar!"],
  ["Contar histórias de terror", "skull", "Para, eu não vou dormir hoje!", "Eu não gosto disso, sério."],
  ["Brincar de detetive", "eye", "Caso resolvido: foi o gato que comeu o pão!"],
  ["Fazer um boneco de neve (ou de areia)", "snow", "Ficou com cara de Coletor Real! HAHA!"],
  ["Apostar quem ri primeiro", "laugh", "*segura*... PFFF! Perdi!"],
  ["Imitar o Instrutor Kael", "sword", "'Defenda quando a mana acabar!' HAHA, igualzinho!"],
  ["Brincar de rei e rainha", "crown", "Eu ordeno: bolo de mel para todos!"],
  ["Fazer fantasia com lençol", "cloud", "Uuuuh! Sou o fantasma da taverna!"],
  ["Jogar bola de meia", "ball", "Gol! Na janela da Rosa... corre!"],
  ["Inventar uma língua secreta", "book", "Flim-flam-blop significa 'amigo'. Combinado!"],
  ["Fazer uma corrida de caracóis", "bolt", "O meu ganhou por um centímetro!"],
]);

/* ---------- JOGOS (25) ---------- */
addInter("jogo", { rel: 3, likes: "XAE", dislikes: "C", x: { time: 30, fun: 9 } }, [
  ["Jogar xadrez de pedra", "crown", "Xeque-mate em sete jogadas. Revanche?"],
  ["Jogar damas", "gem", "Dama! Agora eu ando pra trás também!"],
  ["Jogar dominó", "dice", "Bati! Paga a próxima!"],
  ["Jogar cartas de truco", "scroll", "TRUCO! ...Seis! ...Nove!"],
  ["Jogar dados de três", "dice", "Três seis! Sorte de principiante?"],
  ["Jogar adivinha quem", "eye", "É a Rainha? ...Não? Então é o Luca!"],
  ["Jogar quebra-cabeça", "map", "Faltou uma peça... estava no seu bolso!"],
  ["Jogar forca", "scroll", "H-I-D-R-O-M-E-L! Acertei!"],
  ["Jogar jogo da velha", "flag", "Velha de novo. A gente é bom demais."],
  ["Jogar cama de gato com barbante", "cloth", "Fiz a 'estrela'! Sua vez."],
  ["Jogar bolinha de gude", "orb", "Peguei sua bolinha azul! É minha agora!"],
  ["Jogar argolas", "ring", "Três argolas no pino! Prêmio!"],
  ["Jogar dardos de penas", "feather", "Na mosca! Quase."],
  ["Jogar petecas", "feather", "Não deixa cair! Não deixa cair!"],
  ["Jogar cabo de guerra", "anger", "PUXA! ...Caímos os dois. Empate."],
  ["Jogar adivinhação de runas", "staff", "Era a runa da Maré! Eu sabia!"],
  ["Jogar mímica", "smile", "É um... peixe dançando? Ah, é a Rosa!"],
  ["Jogar cara ou coroa", "coin", "Coroa! A monarquia venceu essa.", "Cara. Que azar."],
  ["Jogar boliche de garrafas", "bottle", "Strike! Todas as garrafas no chão!"],
  ["Jogar jogo da memória", "eye", "Eu lembro de todos os pares. É um dom."],
  ["Jogar corrida de botões", "bolt", "Meu botão foi parar no bueiro!"],
  ["Jogar adivinhe o peso", "pumpkin", "A abóbora pesa três quilos e meio! Acertei!"],
  ["Jogar sete pedrinhas", "gem", "Peguei todas no ar!"],
  ["Jogar enigma da esfinge", "skull", "O que tem quatro patas de manhã...? Ah, essa eu sei!"],
  ["Jogar quente ou frio", "sun", "Quente... quente... PEGOU FOGO! Achei!"],
]);

/* ---------- FAMÍLIA E VIZINHANÇA (30) ---------- */
addInter("fam", { rel: 3, likes: "GBT", dislikes: "O" }, [
  ["Perguntar dos pais", "house", "Minha mãe ainda faz o melhor bolo da vila."],
  ["Perguntar dos irmãos", "smile", "Tenho três. A casa nunca fica em silêncio."],
  ["Perguntar dos avós", "clock", "Meu avô contava histórias do tempo da Canção Arcana."],
  ["Perguntar se tem filhos", "baby", "Ainda não... mas um dia, quem sabe!"],
  ["Contar sobre a sua família", "heart", "Que bonito. Família é o que a gente escolhe também."],
  ["Oferecer ajuda com a mudança", "crate", "Você é um anjo! Tem cada caixa pesada..."],
  ["Levar sopa quando está doente", "soup", "Você trouxe sopa? Já me sinto melhor."],
  ["Cuidar da casa enquanto viaja", "key", "Toma a chave. Rega as plantas, tá?"],
  ["Ajudar a pintar a cerca", "hammer", "Ficou mais bonita que a do vizinho!"],
  ["Emprestar uma escada", "hammer", "Agora eu alcanço o telhado! Obrigado!"],
  ["Trocar mudas de plantas", "herb", "Essa muda de alecrim pega fácil, cuida bem."],
  ["Perguntar da colheita", "corn", "Este ano o trigo veio bonito!"],
  ["Convidar para o almoço de domingo", "stew", "Domingo eu levo a sobremesa!"],
  ["Contar fofoca da vizinhança", "eye", "Não acredito! O moleiro e a florista?!", "Fofoca da vizinhança não, obrigado."],
  ["Reclamar do barulho junto", "anger", "O galo do vizinho canta às três da manhã!"],
  ["Organizar uma festa de rua", "party", "Eu levo as bandeirinhas!"],
  ["Ajudar a achar o gato sumido", "paw", "Achamos! Estava no telhado de novo."],
  ["Dividir lenha no inverno", "log", "Com esse frio, lenha é ouro. Obrigado!"],
  ["Ensinar uma receita de família", "bread", "O segredo é a pitada de canela!"],
  ["Contar histórias para as crianças da rua", "book", "Elas adoraram! Volta amanhã?"],
  ["Perguntar como conheceu o par", "ring", "Foi num festival. Ela pisou no meu pé dançando."],
  ["Dar conselhos de família", "chat", "Vou tentar conversar com eles do seu jeito."],
  ["Ajudar com o dever das crianças", "scroll", "Agora a minha filha entende frações!"],
  ["Trazer pão quentinho de manhã", "bread", "Cheiro de pão é cheiro de casa."],
  ["Ajudar a consertar o poço", "drop", "Água limpa de novo! A rua toda agradece."],
  ["Visitar com uma torta", "pie", "Torta de maçã! Entra, entra!"],
  ["Mostrar a sua casa", "house", "Que casa aconchegante! Decorou tudo sozinho?"],
  ["Apresentar seus filhos", "baby", "Que fofos! Puxaram a você."],
  ["Prometer cuidar dos filhos dele um dia", "heart", "Você seria um ótimo padrinho!"],
  ["Celebrar o aniversário do vizinho", "cake", "Você lembrou! Que alegria!"],
]);

/* ---------- REINO E POLÍTICA (30, incluindo o Iluminismo) ---------- */
addInter("reino", { rel: 2, likes: "SXB", dislikes: "CE" }, [
  ["Falar bem da Rainha", "crown", "A Rainha Aurélia é justa. Rígida, mas justa.", "Hm. Você é do palácio, por acaso?"],
  ["Criticar o Imposto Real", "coin", "Doze por cento! Doze! Em cima do pão!", "Imposto paga as estradas. Fala baixo."],
  ["Falar sobre as guerras", "sword", "Guerra é sempre o povo que paga."],
  ["Perguntar quem devia governar", "flag", "O povo, oras! Ou pelo menos um conselho."],
  ["Falar do desfile real", "party", "O Príncipe Pedro Max acenou pra mim!"],
  ["Comentar o casamento da Princesa Mylena", "ring", "Uma artista virou princesa! Que história."],
  ["Falar do Duque Matheus", "corn", "Um duque que ainda planta o próprio trigo. Gosto dele."],
  ["Discutir as leis da vila", "scroll", "Lei nova: proibido cantar alto depois das dez. Injusto!"],
  ["Falar do Coletor Real", "coin", "Ele passou aqui ontem. Escondi até as galinhas."],
  ["Falar dos reinos vizinhos", "map", "Dizem que em Marés o povo vota no capitão do porto!"],
  ["Falar da Guarda Real", "armor", "Eles protegem a vila. Mas também multam demais."],
  ["Perguntar sobre a justiça do reino", "scroll", "Pobre vai preso por roubar pão. Rico, não."],
  ["Comentar a fofoca do castelo", "eye", "Dizem que a Rainha dança sozinha à noite!"],
  ["Defender a monarquia", "crown", "Sem rei, quem cuida das estradas? Concordo!", "Pff. Você fala igual a um guarda."],
  ["Falar de escola para todos", "book", "Toda criança devia aprender a ler. Toda!"],
  ["Falar de um conselho do povo", "chat", "Um conselho onde a gente vota? Que ideia!"],
  ["Ler um panfleto iluminista junto", "scroll", "'A razão é a coroa do povo.' Bonito, hein.", "Isso é perigoso. Guarda isso."],
  ["Falar sobre liberdade", "flag", "Liberdade é poder escolher até o que não presta."],
  ["Comentar o luxo do castelo", "gem", "Um candelabro de ouro! E a estrada cheia de buraco."],
  ["Falar das Ordens dos Guardiões", "skull", "Os Guardiões eram os verdadeiros reis desta terra."],
  ["Imaginar um mundo sem coroa", "cloud", "Sem coroa... e sem imposto? Me conta mais!", "Sem coroa vira bagunça. Não."],
  ["Debater com calma", "chat", "Gosto de gente que discorda sem gritar."],
  ["Fazer um discurso na praça", "flag", "*a praça aplaude* Você leva jeito!", "*alguém joga um tomate* Ops."],
  ["Juntar assinaturas por uma praça nova", "scroll", "Assino! Uma praça com fonte e bancos!"],
  ["Falar do Luca e do Lucas", "laugh", "Aqueles dois querem derrubar o reino com festa e panfleto. Gosto deles!"],
  ["Contar a história de Vesper", "book", "Um mago que calou o mundo... por amor. Que coisa."],
  ["Perguntar se votaria num conselho", "flag", "Votaria! E me candidatava."],
  ["Falar do Príncipe Pedro Max", "crown", "Ele concorda com os iluministas às escondidas, eu sei!"],
  ["Comentar o preço do trigo", "corn", "O trigo subiu de novo. A culpa é de quem?"],
  ["Brindar ao povo", "mug", "Ao povo! Que manda mais do que imagina!"],
]);
/* Converter alguém para o Iluminismo (só para quem entrou no grupo). */
{
  const row = ["reino_ilum_converter", "reino", "Convencer a ser iluminista", "flag", 4, "XAE", "SB", "...Sabe que você tem razão? Conta comigo. Viva a razão!", "Isso é traição! Não quero ouvir.", { req: () => !!player.ilum }];
  INTERACTIONS.push(row);
  INTER_BY_KEY[row[0]] = row;
  const _doInteraction = doInteraction;
  doInteraction = function (id, key) {
    const before = friendship(id);
    _doInteraction(id, key);
    if (key === "reino_ilum_converter" && friendship(id) > before && !["rainha", "lucas", "luca"].includes(id)) {
      player.ilumConv = player.ilumConv || {};
      if (!player.ilumConv[id]) {
        player.ilumConv[id] = player.day;
        saveGame();
        setTimeout(() => toast(`${NPCS[id].nome.split(",")[0]} virou iluminista! (${ilumCount()} convencidos)`, 3000), 900);
      }
    }
  };
}

/* ---------- CORAÇÃO: romance leve, para qualquer adulto (30) ---------- */
addInter("cor", { rel: 4, likes: "TGOE", dislikes: "S", x: { req: "romance" } }, [
  ["Dar um sorriso demorado", "blush", "*sorri de volta e desvia o olhar*"],
  ["Ajeitar o cabelo dele(a)", "hair", "...Obrigado(a). Ficou um silêncio bom, né?", "Ei! Mão boba!"],
  ["Elogiar de um jeito diferente", "heart", "Ninguém nunca me disse isso desse jeito."],
  ["Oferecer o braço para caminhar", "flag", "*segura seu braço* Vamos pela praça?"],
  ["Mandar um recado de amor anônimo", "scroll", "Recebi um bilhete... era seu? Era, né?"],
  ["Dedicar uma música", "note", "Pra mim? Na frente de todo mundo? Ai, que vergonha boa."],
  ["Convidar para ver os vaga-lumes", "sparkle", "Que lindos! Igual a estrelinhas no chão."],
  ["Dar o último pedaço de bolo", "cake", "O último pedaço? Isso é amor de verdade."],
  ["Dizer que pensou nele(a) o dia todo", "heart", "...Eu também pensei em você. Muito."],
  ["Fazer uma coroa de flores", "flower", "*coloca na cabeça* Agora eu sou realeza do seu coração."],
  ["Esbarrar de propósito", "bolt", "Opa! ...Foi de propósito, né? Eu vi."],
  ["Convidar para dançar na praça", "party", "Só se você não pisar no meu pé!"],
  ["Contar um segredo bobo", "eye", "Seu segredo está seguro comigo. Promessa."],
  ["Dividir um guarda-chuva", "rain", "Pode chover a noite toda agora."],
  ["Escrever um verso para ele(a)", "book", "'Seus olhos são como...' Termina! Termina!"],
  ["Pedir para ver o pôr do sol junto", "sun", "*encosta no seu ombro* Valeu a pena esperar."],
  ["Dar a mão sem dizer nada", "heart", "*aperta de volta*"],
  ["Comprar uma flor na feira para ele(a)", "flower", "Uma rosa! Vou guardar num livro.", "", { cost: 6 }],
  ["Fazer um elogio tímido", "blush", "*cora* Você também...", ""],
  ["Fingir que precisa de ajuda só para ficar perto", "smile", "Você não precisava de ajuda, né? Hahaha. Tudo bem."],
  ["Convidar para um chá a dois", "cup", "Chá de hibisco, por favor. E sua companhia."],
  ["Dizer que gosta do jeito dele(a)", "heart", "Do meu jeito estranho? Você é estranho também. Combina."],
  ["Lembrar do primeiro dia que se viram", "clock", "Você lembra? Eu achei que você nem tinha me notado!"],
  ["Pedir uma mecha de cabelo de lembrança", "hair", "Isso é muito medieval... adorei.", "Que pedido esquisito!"],
  ["Fazer um piquenique a dois", "apple", "Só nós dois e o sol. Perfeito.", "", { req2: "day" }],
  ["Ler a mão dele(a)", "eye", "E aí? Diz que tem casamento na minha linha da vida?"],
  ["Contar estrelas e dar o nome dele(a) a uma", "star", "Uma estrela com o meu nome... ninguém nunca fez isso."],
  ["Dar um apelido carinhoso", "heart", "'Meu bem'? ...Pode continuar me chamando assim."],
  ["Prometer voltar logo de uma viagem", "flag", "Volta mesmo. Vou ficar contando os dias."],
  ["Declarar que está gostando dele(a)", "heart", "Eu... também estou gostando de você. Pronto, falei!", "Eu te vejo como amigo(a). Desculpa."],
]);

/* ---------- MAIS NAS CATEGORIAS ANTIGAS ---------- */
addInter("amigo", { rel: 2, likes: "GEA", dislikes: "" }, [
  ["Oferecer um copo d'água", "water", "Tava com uma sede! Obrigado."],
  ["Segurar a porta", "door", "Gentileza assim anda rara!"],
  ["Lembrar do nome dele(a)", "chat", "Você lembrou meu nome! Que bom."],
  ["Perguntar se precisa de algo", "gift", "Preciso de nada não, mas obrigado por perguntar."],
  ["Acenar de longe", "wave", "*acena de volta animado*"],
  ["Sentar junto na praça", "smile", "Bom ter companhia pra ver o movimento."],
  ["Dividir o banco à sombra", "sun", "Esse sol tá de matar. Senta aí."],
  ["Contar uma notícia boa", "star", "Que maravilha! Conta mais!"],
  ["Dar um abraço de bom dia", "heart", "Bom dia pra você também!", "Muito cedo pra abraço."],
  ["Oferecer companhia na caminhada", "flag", "Vamos! Dois andam mais rápido."],
  ["Perguntar do bichinho dele(a)", "paw", "Ele tá ótimo, comeu um sapato ontem."],
  ["Mandar lembranças para a família", "house", "Vou dar o recado! Eles vão adorar."],
  ["Cumprimentar com reverência", "crown", "*ri* Que elegância!"],
  ["Desejar boa sorte", "star", "Vou precisar! Obrigado."],
  ["Lembrar de algo que ele(a) contou", "book", "Você prestou atenção! Ninguém presta."],
  ["Oferecer uma maçã", "apple", "Crocante! Obrigado.", "", { fx: () => {} }],
  ["Combinar de se ver amanhã", "clock", "Combinado! Na fonte?"],
  ["Mostrar um truque com o cajado", "staff", "Uau! Faísca de verdade!"],
  ["Ajudar a levantar depois de tropeçar", "heart", "Ai, obrigado. Esse calçamento é traiçoeiro."],
  ["Dar parabéns por qualquer coisa", "party", "Parabéns pelo quê? ...Aceito mesmo assim!"],
]);
addInter("papo", { rel: 2, likes: "BXG", dislikes: "C" }, [
  ["Falar sobre o clima de amanhã", "cloud", "O monge diz que vai chover. Ele nunca acerta."],
  ["Falar sobre o mar", "fish", "Um dia eu atravesso o mar inteiro."],
  ["Falar sobre as estrelas", "star", "Cada estrela é um mago antigo. Dizem."],
  ["Falar sobre música", "note", "O bardo da taverna toca a mesma música há dez anos."],
  ["Falar sobre comida de festa", "cake", "Bolo de mel e torta de amora. Sem discussão."],
  ["Falar sobre medos", "skull", "Eu tenho medo de galinha. Não ri!"],
  ["Falar sobre viagens", "map", "Pedravale é fria, mas o queijo compensa."],
  ["Falar sobre o futuro da vila", "house", "Quero uma ponte nova no rio. E uma biblioteca maior."],
  ["Falar sobre amigos de infância", "smile", "A gente fazia barquinho de papel no rio."],
  ["Falar sobre o que faria rico", "coin", "Comprava uma taverna só pra mim. E dava de graça."],
  ["Falar sobre animais mágicos", "feather", "Já viu uma fênix? Eu juro que vi uma."],
  ["Falar sobre o melhor dia da vida", "sun", "O dia em que aprendi a ler. Mudou tudo."],
  ["Falar sobre o pior dia", "rain", "Melhor não lembrar. Mas obrigado por perguntar."],
  ["Falar sobre talentos escondidos", "sparkle", "Eu sei tocar flauta com o nariz. Sério."],
  ["Falar sobre o Luca", "laugh", "Ontem ele falou com uma parede por meia hora. Disse que era 'a tela'."],
  ["Falar sobre a Andressa", "eye", "Ela sabe de tudo. Às vezes sabe antes de acontecer."],
  ["Falar sobre a Mylena", "staff", "A Princesa Mylena pintou meu cachorro. Ficou mais bonito que ele."],
  ["Falar sobre o Marcos", "sword", "O General carregou uma carroça sozinho ontem!"],
  ["Falar sobre o Lucas", "mug", "O Lucas? Três namoradas e nenhuma sabe da outra. Ou sabem."],
  ["Falar sobre a Júlia", "paw", "A Júlia salvou o burrico do moleiro. É uma heroína."],
]);
addInter("ativ", { rel: 3, likes: "AGE", dislikes: "S", x: { time: 40, fun: 8 } }, [
  ["Nadar no rio", "drop", "A água tá gelada! Mas que delícia!", "Nem pensar, tem sapo."],
  ["Subir na torre do moinho", "flag", "Dá pra ver a vila inteira daqui!"],
  ["Visitar a biblioteca juntos", "book", "Achei um livro sobre dragões!"],
  ["Ir à feira juntos", "bag", "Comprei um chapéu que não preciso. Ótimo dia!"],
  ["Ver os barcos no cais", "fish", "Aquele barco veio de Marés, olha a bandeira!"],
  ["Pintar juntos no Ateliê", "staff", "A Mylena disse que temos talento!"],
  ["Ajudar na clínica da Júlia", "paw", "Segurei um gato bravo. Tô todo arranhado, mas feliz."],
  ["Treinar com o General Marcos", "sword", "Ele disse que eu ainda sou 'um saco de batatas'. Progresso!"],
  ["Plantar flores na praça", "flower", "Daqui a uma semana vai estar tudo colorido!"],
  ["Assistir a um teatro de rua", "mask", "Que final! Eu chorei, você viu?"],
  ["Fazer um passeio a cavalo", "bolt", "O vento no rosto! Que liberdade!", "Cavalo me dá medo."],
  ["Acampar fora da vila", "sun", "Fogueira, estrelas e histórias. Perfeito.", "", { time: 120 }],
  ["Colher cogumelos no bosque", "mushroom", "Só os que não são venenosos, hein!"],
  ["Ir à missa no Templo", "sparkle", "O canto do coral me arrepiou."],
  ["Cozinhar juntos", "stew", "Queimou um pouquinho... mas tá ótimo!"],
]);
addInter("ajuda", { rel: 4, likes: "SGB", dislikes: "O", x: { energy: -5 } }, [
  ["Ajudar a varrer a frente da casa", "hammer", "Tá brilhando! Obrigado."],
  ["Ajudar a carregar água do poço", "water", "Meus braços agradecem!"],
  ["Ajudar a tirar o gato da árvore", "paw", "Ele desceu! Finalmente!"],
  ["Ajudar a costurar uma roupa", "cloth", "Você costura melhor que eu!"],
  ["Ajudar a escrever uma carta", "scroll", "Ficou tão bonita! Vou mandar pra minha mãe."],
  ["Ajudar a vender na barraca", "coin", "Vendemos tudo! Toma uma parte.", "", { fx: () => (player.gold += 5) }],
  ["Ajudar a achar um anel perdido", "ring", "Estava no fundo do bolso! Que alívio."],
  ["Ajudar a ordenhar a vaca", "drop", "Ela gostou de você! Raridade."],
  ["Ajudar a preparar uma festa", "party", "Vai ser a melhor festa do ano!"],
  ["Ajudar a estudar para a escola", "book", "Tirei nota máxima! Graças a você."],
  ["Ajudar a cuidar de um doente", "heart", "Ele já está melhor. Você tem mão boa."],
  ["Ajudar a consertar a carroça", "hammer", "A roda tá firme de novo!"],
  ["Ajudar a recolher a roupa antes da chuva", "rain", "Bem a tempo! Tudo seco."],
  ["Ajudar a fazer pão", "bread", "Massa sovada com amizade fica mais macia."],
  ["Ajudar a pintar uma placa", "staff", "Agora a loja tem nome bonito!"],
]);
addInter("mal", { rel: -6, x: { mean: true, rep: -1 } }, [
  ["Fazer fofoca maldosa dele(a)", "eye", "Você anda falando de mim pelas costas?!"],
  ["Esconder o chapéu dele(a)", "hat", "Cadê meu chapéu?! Foi você!"],
  ["Rir quando ele(a) tropeça", "laugh", "Muito engraçado... só que não."],
  ["Interromper toda hora", "chat", "Me deixa terminar de falar!"],
  ["Contar spoiler de um livro", "book", "NÃO! Eu ia ler esse!"],
  ["Comer a comida dele(a) sem pedir", "bread", "Era meu almoço!"],
  ["Desafiar para uma briga de travesseiro", "anger", "Você vai ver só! *pega o travesseiro*"],
  ["Fazer barulho na janela à noite", "skull", "Quem tá aí?! ...Você?! Vou chamar a guarda!"],
  ["Mentir sobre o preço de algo", "coin", "Você me enganou! Nunca mais faço negócio contigo."],
  ["Pisar na flor que ele(a) plantou", "flower", "Minha flor! Levou semanas pra crescer!"],
  ["Imitar a voz dele(a)", "laugh", "Eu não falo assim! ...Falo?"],
  ["Esbarrar e não pedir desculpa", "anger", "Que grosseria! Nem um 'desculpa'?"],
  ["Contar que o bolo dele(a) estava ruim", "cake", "Você comeu três pedaços!"],
  ["Mexer nas coisas dele(a) sem pedir", "bag", "Larga isso! É pessoal!"],
  ["Dizer que ninguém gosta dele(a)", "anger", "...Isso foi cruel. Muito cruel.", "", { rep: -3 }],
]);
addInter("paz", { rel: 5, likes: "GBT", dislikes: "O" }, [
  ["Admitir que errou", "heart", "Admitir o erro é coisa de gente grande. Tá perdoado."],
  ["Trazer flores de desculpa", "flower", "Flores amarelas... são as minhas preferidas. Tá bom."],
  ["Prometer não repetir", "scroll", "Vou cobrar essa promessa, hein!"],
  ["Pagar o prejuízo", "coin", "Não precisava... mas obrigado.", "", { cost: 10 }],
  ["Escrever um poema de desculpas", "book", "Rimou 'perdão' com 'coração'... clichê, mas funcionou."],
  ["Convidar para um recomeço", "sun", "Recomeçar do zero? Pode ser."],
  ["Mandar um amigo em comum falar por você", "chat", "O Matheus disse que você está arrependido. É verdade?"],
  ["Fazer uma serenata de desculpas", "note", "*abre a janela* Ok, ok! Desculpado! Para de cantar!"],
  ["Levar o prato preferido dele(a)", "stew", "Você lembrou do meu prato preferido... tá bom."],
  ["Dar um abraço sincero", "heart", "*abraça forte* Senti sua falta."],
]);

