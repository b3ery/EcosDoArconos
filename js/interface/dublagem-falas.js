/**
 * ECOS DO ARCANO — dublagem-falas.js
 * Falas soltas do Narrador que não vêm de uma lista do jogo (cenas da Nyx,
 * ataques à vila, gente da estrada, sonhos e caminho do vilão).
 * O texto precisa ser IGUAL ao que aparece na tela: é assim que o jogo acha o
 * áudio certo. As outras seções do roteiro são montadas em dublagem.js, direto
 * das listas do jogo (abertura, capítulos, Guardiões, lembranças...).
 */

"use strict";

const VOICE_LOOSE = {
  NYX: [
    "Uma figura de capa verde-escura está agachada ao lado das raízes, desenhando runas na terra.",
    "Nyx está de pé sobre a água parada, enchendo um frasco com a névoa da Serpente.",
    "Você ergue a mão. Nyx não tenta fugir. Ela só fecha os olhos.",
    "O vento dos Picos leva o último som que ela faz. Ninguém ouve.",
    "Encolhida atrás de uma pedra, Nyx tenta se levantar e não consegue. Há marcas roxas de silêncio nos braços dela.",
    "Passos atrás de você. Nyx, com a capa rasgada e os olhos firmes.",
    "No primeiro andar da torre, Nyx bloqueia a escada. A voz dela soa estranha: dupla, como um eco.",
    "A voz dupla se desfaz. Sobra só a de Nyx: rouca, baixinha, dela.",
    "Nos Picos Uivantes, ninguém lembra o nome da caçadora de capa verde. O vento lembra.",
    "Nyx ficou em Cinzaluz. Odelia a aceitou como aprendiz. A primeira canção que ela cantou com a própria voz tinha o seu nome.",
    "Nyx foi embora pela estrada do sul. Dizem que, toda primavera, alguém deixa um lírio da névoa na porta da Torre.",
  ],
  CER: [
    "Os sinos de Cinzaluz param no meio da batida. O vento para. Até os passarinhos param.",
    "A vila escurece em pleno dia. As sombras das casas começam a andar sozinhas.",
    "Você corre o mais rápido que consegue. Do outro lado da vila, um grito começa... e para no meio.",
  ],
  EST: [
    "Gritos na estrada! Um bandido encapuzado está arrancando a bolsa de um mercador.",
    "Vocês dividem a bolsa. O mercador te olha como quem nunca vai esquecer seu rosto.",
    "Você segue em frente. Os gritos ficam para trás.",
    "Um menino pequeno chora sentado numa raiz.",
    "A mãe dele te dá 3 maçãs e um abraço apertado.",
    "Tito sai correndo e chorando mais alto. Funciona. Mas não é bonito.",
    "Um vulto sem rosto fala com a voz da Odelia. Igualzinha.",
    "Um velho peregrino, de pés cansados, para você na estrada.",
    "Um soldado ferido está encostado numa pedra, com a espada ainda na mão.",
    "Uma raposinha prateada está presa numa armadilha. O caçador já vem chegando.",
    "A raposa some no mato. Mais tarde, você jura que viu dois olhos prateados te seguindo de longe, cuidando de você.",
    "Você ouve o estalo da armadilha ficando para trás.",
    "Uma mão pequena puxa a sua bolsa e sai correndo! Você alcança a menina no fim do cais.",
    "Ela foge antes que você mude de ideia.",
    "O guarda arrasta a menina pelo braço. Ela não chora. Só te encara.",
    "Na beira da estrada, um bardo afina o alaúde.",
    "Seu Pipoca fica vermelho como amora.",
    "Você lê devagar. Dona Flor fecha os olhos e sorri.",
    "Ela aperta a carta contra o peito.",
  ],
  SON: [
    "Você acorda com o rosto molhado. Não lembra de ter chorado.",
  ],
  VIL: [
    "Ao longe, ao sul de Cinzaluz, algo se rompe com um estalo.",
    "Você estende a mão. O Silenciador sorri pela primeira vez em trezentos anos.",
    "Os dois descem da Torre lado a lado. Em Cinzaluz, Odelia fecha os olhos e chora em silêncio.",
    "Em um ano, os três reinos se rendem. A Canção Arcana passa a tocar só para os dois.",
    "Você pisa sobre a máscara partida e ergue as seis runas.",
    "A Canção Arcana dobra os joelhos dos reis. Aurélia, Marés e Pedravale juram lealdade ao novo soberano das runas.",
    "Dizem que, nas noites frias, ainda se ouve uma irmã chamando o nome do irmão. Mas ninguém mais tem coragem de responder.",
    "Um estalo, gritos, madeira partindo. Na manhã seguinte, caixotes boiam até a praia.",
    "Você empurra os anões e despeja o metal num molde de lâmina. A runa de Vesper brilha roxa no aço.",
    "Uma voz fria sussurra dentro da sua cabeça: \"Continue assim. Eu estou esperando você na Torre.\"",
  ],
};
