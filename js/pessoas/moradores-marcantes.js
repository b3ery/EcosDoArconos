/**
 * ECOS DO ARCANO — moradores-marcantes.js
 * 14 moradores novos, cada um com personalidade forte: mania, jeito de falar,
 * o que ama ganhar, um segredo (contado só com amizade alta) e notícias próprias
 * no jornal. Andam pela vila (e pelo porto e pela serra) e têm o menu completo:
 * amizade, presentes, namoro, casamento.
 * Modifica (envolve) funções de outros arquivos: addContactWalkers, lifeSocialItems, onNewDay.
 */

"use strict";

const MARCANTES = [
  { id: "mm_cotinha", nm: "Dona Cotinha", t: "a Fofoqueira da Janela", age: 78, zone: "vila", ps: "esperto", fav: "doce", robe: "#8a5a7a", hair: "#e8e4dc", hat: null,
    mania: "Passa o dia na janela anotando quem entra e sai de cada casa.",
    lines: ["Menin" + "@, você viu quem saiu da casa do Gaspar ontem? Eu vi. Eu sempre vejo.", "Não sou fofoqueira, sou BEM INFORMADA. É diferente.", "Senta aqui, que eu te conto da Bibi e do Zeca. Mas não fui eu que te contei!", "Na minha época, namoro era com a família inteira olhando. Hoje é essa pouca vergonha.", "Tô de olho em você. Com carinho. Mas tô de olho."],
    secret: "Quem escreve as cartas anônimas de amor da vila sou eu. Faço casais há 40 anos. Nunca errei um.", news: ["Dona Cotinha jura ter visto um fantasma na janela da Guilda.", "Dona Cotinha anunciou que sabe de um casamento secreto na vila. Não disse qual."] },
  { id: "mm_zeca", nm: "Zeca Trovão", t: "o Bardo Desafinado", age: 34, zone: "vila", ps: "engracado", fav: "hidromel", robe: "#c94a2a", hair: "#3a2414", hat: "#5a3a22",
    mania: "Canta em toda esquina. Desafinado. Muito alto.",
    lines: ["🎵 Ó Cinzaluuuuz, terra do pãããão... 🎵 Gostou? Fiz agora!", "Os críticos dizem que eu desafino. Eu digo que eu INOVO.", "Toquei na taverna e me pagaram para parar. Considero um cachê.", "Se você me der um hidromel, eu faço uma música sobre você. Se não der, faço também, mas maldosa.", "Meu alaúde tem nome: Dolores. Ela me entende."],
    secret: "Eu sei cantar afinado. Desafino de propósito porque a Bibi ri. É o único jeito de ela rir.", news: ["Zeca Trovão cantou na praça por 4 horas seguidas. Os cachorros fugiram.", "Zeca Trovão lançou a música 'Balada do Pão Queimado'. Polêmica na padaria."] },
  { id: "mm_zuleica", nm: "Madame Zuleica", t: "a Cartomante", age: 52, zone: "vila", ps: "sabio", fav: "cha", robe: "#5a2a7a", hair: "#1a1a1a", hat: "#2a1a4a",
    mania: "Lê a sorte de todo mundo, peça ou não peça.",
    lines: ["As cartas dizem que hoje você vai encontrar alguém especial. Ou um pão. As cartas são vagas.", "Vejo uma grande viagem no seu futuro... ou você vai até o mercado. É, é o mercado.", "Não me pergunte o futuro de graça. O futuro custa 5 de ouro. O passado é de graça.", "A Lua está em Escorpião. Ou em cima do telhado. Daqui não dá pra saber.", "Suas mãos dizem muito. Principalmente que você precisa lavar."],
    secret: "Eu não vejo o futuro. Eu escuto a Dona Cotinha. Ela sabe de tudo antes de acontecer.", news: ["Madame Zuleica previu chuva. Fez sol. Ela disse que a chuva 'mudou de ideia'.", "Madame Zuleica avisou: alguém da vila vai se apaixonar esta semana."] },
  { id: "mm_tobias", nm: "Tobias Ferrugem", t: "o Inventor Maluco", age: 45, zone: "vila", ps: "esperto", fav: "minerio", robe: "#6a6a5a", hair: "#c9853a", hat: null,
    mania: "Inventa máquinas que quase funcionam. Quase.",
    lines: ["Minha nova invenção: uma vassoura que varre sozinha! Ela fugiu ontem. Se vir, me avisa.", "BUM! ...Não se preocupe, foi só a sobrancelha.", "Estou construindo uma máquina de voar. Por enquanto, é uma máquina de cair.", "Engrenagem, mola, fé. Os três pilares da ciência.", "A Rita quebrou meu protótipo de novo. Ela diz que foi um abraço."],
    secret: "Minha maior invenção funcionou uma vez: um relógio que adianta o tempo. Eu escondi. Tenho medo do que faria.", news: ["Explosão na oficina de Tobias Ferrugem! Ninguém se feriu. A sobrancelha dele, sim.", "Tobias Ferrugem apresentou uma 'carroça sem cavalo'. Andou 3 metros e parou num muro."] },
  { id: "mm_bibi", nm: "Bibi Pimenta", t: "a Cozinheira Brava", age: 23, zone: "vila", ps: "orgulhoso", fav: "queijo", robe: "#a83a3a", hair: "#1a1a1a", hat: null,
    mania: "Cozinha como ninguém e odeia cebola com todas as forças.",
    lines: ["Se você falar a palavra 'cebola' perto de mim, eu jogo a panela.", "Minha sopa é a melhor de três reinos. Discorda? Sai da minha cozinha.", "O Zeca de novo cantando na minha janela. ...Não, eu NÃO estou sorrindo.", "Tempero é igual gente: pouco é sem graça, muito é insuportável.", "Comeu? Tá magr" + "@. Toma, come isso. Não é um pedido."],
    secret: "Eu não odeio cebola. Eu choro cortando cebola, e não deixo ninguém me ver chorar. Pronto, falei.", news: ["Bibi Pimenta expulsou um cliente da taverna por pedir 'mais cebola'.", "A torta de Bibi Pimenta ganhou o concurso da praça. Pela terceira vez."] },
  { id: "mm_arlindo", nm: "Seu Arlindo", t: "o Veterano", age: 70, zone: "vila", ps: "serio", fav: "vinho", robe: "#4a5a3a", hair: "#d9d9d9", hat: "#3a4a3a",
    mania: "Conta a mesma história da Batalha da Ponte. Sempre com um detalhe diferente.",
    lines: ["Já te contei da Batalha da Ponte? Éramos 12 contra 100. Ou 100 contra 12. Faz tempo.", "Na minha época, soldado acordava antes do galo. O galo acordava com medo da gente.", "Esse General Marcos é bom rapaz. Mas falta pegar uma chuva de flechas na cara.", "Joelho dói quando vai chover. Hoje vai chover. Pode anotar.", "Respeito se conquista. E se perde num dia. Lembre disso."],
    secret: "Na Batalha da Ponte eu não lutei. Eu cuidei dos feridos, escondido, com medo. Foi a coisa mais corajosa que eu fiz.", news: ["Seu Arlindo contou a história da Batalha da Ponte pela 1.000ª vez. A ponte, agora, tem um dragão.", "Seu Arlindo acertou a previsão de chuva pelo joelho. De novo."] },
  { id: "mm_nina", nm: "Nina Faísca", t: "a Ex-Ladra", age: 19, zone: "vila", ps: "aventureiro", fav: "maca", robe: "#2a3a4a", hair: "#8a3a1a", hat: null,
    mania: "Mexe nos bolsos dos outros sem perceber. Devolve tudo, juro.",
    lines: ["Oi! Tó, sua moeda. Caiu. Do seu bolso. Quando eu enfiei a mão. Por acidente.", "Eu mudei de vida! Agora só roubo corações. Hahaha. ...Desculpa.", "Conheço todos os telhados da vila. Quer um passeio? É ilegal, mas é lindo.", "O Guarda Tomé me conhece pelo nome. Pelo apelido. Pelo cheiro.", "Um dia eu vou ser aventureira da Guilda. Daí vou roubar só de dragão."],
    secret: "Eu roubava pra comprar remédio pra minha avó. Ela morreu no inverno. Agora eu não sei mais pra quem roubar.", news: ["Nina Faísca devolveu um colar que 'achou' no bolso do Gaspar Moedas.", "Nina Faísca foi vista correndo pelos telhados de novo. A guarda desistiu."] },
  { id: "mm_duda", nm: "Duda Calada", t: "a Pintora de Muros", age: 27, zone: "vila", ps: "timido", fav: "flor", robe: "#3a7a8a", hair: "#d9a441", hat: null,
    mania: "Quase não fala, mas pinta murais lindos de madrugada.",
    lines: ["...Oi.", "*mostra um desenho de você, perfeito, feito em dois segundos*", "...Gostou do muro da praça? ...Não fui eu. ...Fui eu.", "Falar é difícil. Pintar é fácil. As cores não me olham estranho.", "*sorri e esconde o rosto atrás do caderno*"],
    secret: "...Todo mural que eu pinto tem uma pessoa escondida. É sempre a mesma. ...É a Mylena. Ela me inspira.", news: ["Um mural novo apareceu no muro do Celeiro durante a noite. Ninguém viu quem pintou.", "Duda Calada falou três frases seguidas em público. A vila ficou em choque."] },
  { id: "mm_gaspar", nm: "Gaspar Moedas", t: "o Agiota", age: 50, zone: "vila", ps: "orgulhoso", fav: "vinho", robe: "#2a2a1a", hair: "#5a3a22", hat: "#1a1a1a",
    mania: "Conta as moedas três vezes. Empresta com juros. Muitos juros.",
    lines: ["Precisa de ouro? Eu empresto. Juros de 50%. Por semana. É uma pechincha.", "Tempo é dinheiro. Você está me custando 2 moedas por minuto.", "Caridade? Ah, sim, conheço. Coisa de quem não sabe fazer conta.", "Uma moeda, duas moedas, três... Shhh! Perdi a conta. De novo: uma...", "A Nina andou perto de mim de novo. Vou contar os bolsos."],
    secret: "Todo o ouro que eu junto vai para o orfanato do Porto. Anonimamente. Se contar pra alguém, eu cobro juros.", news: ["Gaspar Moedas cobrou juros de um cachorro que comeu a sua torta.", "Uma doação anônima enorme chegou ao orfanato do Porto. Ninguém sabe de quem."] },
  { id: "mm_lulu", nm: "Lulu Ventania", t: "a Mensageira", age: 31, zone: "vila", ps: "aventureiro", fav: "pao", robe: "#d98a2a", hair: "#3a2414", hat: "#c9a03a",
    mania: "Corre para todo lado. Nunca anda. Nem dentro de casa.",
    lines: ["Oi-tchau-to-com-pressa!", "Entreguei 40 cartas hoje. Antes do almoço. Almoço? Não sei o que é isso.", "Correr é a melhor coisa do mundo. Depois de chegar.", "Se precisar mandar recado pra alguém, me chama. Chego antes de você terminar a frase.", "Já corri da Serra até o Porto. Os cavalos ficaram com inveja."],
    secret: "Eu corro porque se eu parar, eu penso. E pensar me deixa triste. Correr é mais fácil.", news: ["Lulu Ventania bateu o recorde: Serra–Porto em meio dia, a pé.", "Lulu Ventania trombou com o Zeca Trovão. O alaúde Dolores sobreviveu."] },
  { id: "mm_quirino", nm: "Dr. Quirino", t: "o Médico Hipocondríaco", age: 61, zone: "vila", ps: "serio", fav: "cha", robe: "#e8e4dc", hair: "#8a8a8a", hat: null,
    mania: "Cura todo mundo, mas acha que está morrendo de tudo.",
    lines: ["Não chega perto, acho que estou com febre. Ou é o sol. Ou é febre do sol.", "Lave as mãos. Lavou? Lave de novo. Agora seque. Agora lave.", "Diagnóstico: você está bem. Já eu, estou péssimo. Olha essa unha!", "Tomei sete chás hoje. Um para cada doença que talvez eu tenha.", "Medicina é ciência. E paciência. E muito sabão."],
    secret: "Eu nunca fiquei doente na vida. Tenho medo de ficar sozinho, então invento doença pra alguém vir me visitar.", news: ["Dr. Quirino declarou-se 'quase morto' pela quinta vez este mês. Passa bem.", "Dr. Quirino curou uma epidemia de tosse no Porto. Depois achou que pegou."] },
  { id: "mm_rita", nm: "Rita Raio", t: "a Ferreira Forte", age: 40, zone: "serra", ps: "engracado", fav: "carne", robe: "#5a3a2a", hair: "#a82a1a", hat: null,
    mania: "Forte demais. Quebra tudo que toca. Inclusive apertos de mão.",
    lines: ["Aperto de mão? Não, melhor não. Da última vez quebrei três dedos. Os meus.", "Levantei a carroça do Tobias com uma mão. Ele estava dentro. Gritou bonito.", "Ferro, fogo e força! E um cochilo depois do almoço.", "Hahaha! Desculpa, ri muito alto. Caiu uma telha ali?", "Se alguém te incomodar, me chama. Eu não bato. Eu abraço. É pior."],
    secret: "Eu gosto do Tobias. Toda vez que tento dizer, quebro alguma invenção dele de nervoso.", news: ["Rita Raio levantou o sino do Templo para trocar a corda. Sozinha.", "Rita Raio abraçou o Tobias Ferrugem. Ele está bem. Mais ou menos."] },
  { id: "mm_teodoro", nm: "Teodoro Lírio", t: "o Poeta Rival", age: 29, zone: "vila", ps: "orgulhoso", fav: "livro", robe: "#6a2a5a", hair: "#1a1a1a", hat: "#3a1a3a",
    mania: "Odeia o Pedro Poeta. Escreve poemas melhores (segundo ele).",
    lines: ["Pedro Poeta? Aquele rimador de feira? Por favor.", "\"Ó vila, ó luz, ó pão, ó cruz.\" Profundo, não? Meu.", "A Andressa expõe os poemas do marido. Os meus, ela 'arquiva'.", "A arte é sofrimento. E eu sofro muito. Principalmente quando o Pedro é aplaudido.", "Me peça um poema e eu farei. Me peça dois e eu cobro."],
    secret: "O Pedro Poeta foi quem me ensinou a escrever, quando a gente era criança. Eu morro de saudade da nossa amizade.", news: ["Teodoro Lírio declamou na praça um poema contra Pedro Poeta. Pedro aplaudiu.", "Teodoro Lírio rasgou seus poemas em público. Depois juntou os pedaços."] },
  { id: "mm_marisol", nm: "Marisol das Ondas", t: "a Pescadora Contadora de Lendas", age: 57, zone: "porto", ps: "sabio", fav: "peixe", robe: "#2a5a7a", hair: "#d9d9d9", hat: "#2a3a4a",
    mania: "Toda conversa vira uma lenda do mar.",
    lines: ["Sabe por que o mar é salgado? Porque a Serpente chorou quando perdeu a runa.", "Vi uma sereia uma vez. Ela me pediu um peixe. Dei. Era meu almoço.", "O farol guarda mais segredos que a Andressa. E olha que é difícil.", "Mar calmo nunca fez bom marinheiro. Nem bom pescador. Nem boa história.", "Senta, que lá vem lenda. Essa tem até monstro."],
    secret: "Meu marido sumiu no mar há 20 anos. Toda noite eu acendo uma vela no cais. Ainda acho que ele volta.", news: ["Marisol das Ondas pescou um peixe 'do tamanho de um barco'. Testemunhas: nenhuma.", "Marisol das Ondas contou uma lenda nova no cais. As crianças não dormiram."] },
];
const MM_BY_ID = Object.fromEntries(MARCANTES.map((c) => [c.id, c]));
const mmLine = (s) => s.replace(/@/g, genderWord("o", "a", "e"));

/* ----- cada um vira personagem completo ----- */
for (const c of MARCANTES) {
  NPCS[c.id] = {
    nome: `${c.nm}, ${c.t}`,
    robe: c.robe,
    hat: c.hat,
    hair: c.hair,
    talk: () => [[c.nm, mmLine(pk(c.lines))]],
  };
  FRIENDS[c.id] = { fav: c.fav, r80: [c.fav, 2] };
  PERSONALITIES[c.id] = c.ps;
  if (c.age < 70 && !ROMANCE.includes(c.id)) ROMANCE.push(c.id);
}
{
  const naBase = typeof npcAge === "function" ? npcAge : null;
  if (naBase)
    npcAge = function (id) {
      const c = MM_BY_ID[id];
      return c ? c.age + Math.floor(Math.max(0, (player.day || 1) - 1) / 15) : naBase.apply(this, arguments);
    };
}

/* ----- andam pela vila, pelo porto e pela serra ----- */
{
  const acBase = addContactWalkers;
  addContactWalkers = function () {
    acBase.apply(this, arguments);
    if (!game.walkers || !game.walkers.length) return;
    for (const c of MARCANTES) {
      if (c.zone !== player.zone || player.spouse === c.id || (typeof isDead === "function" && isDead(c.id))) continue;
      const base = game.walkers[Math.floor(Math.random() * game.walkers.length)];
      game.walkers.push({ ...base, nm: c.nm, robe: c.robe, hat: c.hat, hair: c.hair, seed: undefined, elf: false, cid: c.id, line: mmLine(pk(c.lines)) });
    }
  };
}

/* ----- conhecer de verdade: mania e segredo ----- */
{
  const lsBase = lifeSocialItems;
  lifeSocialItems = function (id) {
    const out = lsBase.apply(this, arguments) || [];
    const c = MM_BY_ID[id];
    if (!c) return out;
    out.push({ t: `Perguntar sobre a vida de ${c.nm}`, icon: "chat", fn: () => say([["", `${c.nm}, ${c.age} anos, ${c.t}. ${c.mania}`], [c.nm, mmLine(pk(c.lines))]]) });
    if (friendship(id) >= 55) out.push({ t: "Perguntar um segredo", icon: "eye", fn: () => (((player.mmSecrets = player.mmSecrets || {})[id] = 1), saveGame(), say([[c.nm, "*olha em volta e fala baixinho*"], [c.nm, c.secret], ["", "Esse segredo agora é seu também. Guarde bem."]])) });
    else out.push({ t: "Perguntar um segredo (amizade 55)", icon: "eye", fn: () => say([[c.nm, pk(["Segredo? A gente mal se conhece!", "Hmm... quem sabe um dia. Me traga um presente primeiro.", "Ha! Boa tentativa."])]]) });
    return out;
  };
}

/* ----- aparecem no jornal ----- */
{
  const dayBase = onNewDay;
  onNewDay = function () {
    const r = dayBase.apply(this, arguments);
    if (!lifeMode()) return r;
    const alive = MARCANTES.filter((c) => !(typeof isDead === "function" && isDead(c.id)));
    if (alive.length && Math.random() < 0.8) vilaNews(pk(pk(alive).news));
    return r;
  };
}
