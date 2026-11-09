# Arquitetura do Ecos do Arcano

> Gerado por `node tools/arquitetura.js`. Não edite à mão.

O jogo é JavaScript puro, sem framework: cada arquivo é um `<script>` comum e todos compartilham
o mesmo escopo global. **A ordem importa:** um arquivo só pode usar o que veio antes.

Para acrescentar algo sem mexer no arquivo antigo, os arquivos novos **embrulham** funções antigas:

```js
const _abrirLojaBase = openShop;   // guarda a original
openShop = function (id) {          // substitui
  _abrirLojaBase(id);               // chama a original
  // ...e faz algo a mais
};
```

A coluna "Embrulha" mostra exatamente isso. Antes de mudar uma função, procure aqui quem a embrulha.

## Pastas

| Pasta | Assunto |
|---|---|
| `js/nucleo` | Dados, estado, laço principal, entrada (teclado), gerador de ícones |
| `js/mundo` | Mapas, geração do mundo, reinos, casas, floresta, quintal, clima |
| `js/historia` | Batalha, caminho do vilão, missões da mina e do farol |
| `js/pessoas` | Família, amizades, diálogos, turma, contatos, interações |
| `js/vida` | Simulador de Vida, profissões, carreiras, saúde, calendário |
| `js/interface` | Telas: inventário, lojas, criador, menus, opções, conquistas |

## Scripts (na ordem de carregamento)

| # | Arquivo | O que faz | Embrulha |
|---|---|---|---|
| 1 | `js/nucleo/01-dados.js` | Dados do jogo: runas, feitiços, inimigos, itens, lojas, personagens e textos da história. | — |
| 2 | `js/nucleo/02-estado-som-e-sprites.js` | Estado do jogador, salvamento, efeitos sonoros e funções de desenho de sprites. | `iconHTML`, `drawPixelIcon` |
| 3 | `js/mundo/03-mapa-e-geracao.js` | Desenho do mapa, clima, estações, interação com o mundo e vida das vilas. | — |
| 4 | `js/pessoas/04-familia-e-dialogos.js` | Família, aparência, reputação, mascotes, traição, fofocas, bebedeira, brigas, escola e passeata. | — |
| 5 | `js/interface/05-interface-e-comercio.js` | Quadro de trabalhos, central de trocas, cavalo, carruagem e ataques à vila. | — |
| 6 | `js/historia/06-batalha.js` | Sistema de batalha por turnos: feitiços, habilidades, turno do inimigo e recompensas. Estado global da batalha: `B` (definido em 02-estado-som-e-sprites.js). Outros arquivos leem:  | — |
| 7 | `js/nucleo/07-loop-e-desenho.js` | Loop principal: atualização do jogo e desenho de cada tela. | — |
| 8 | `js/interface/08-opcoes-musica-missoes.js` | Tela de opções, música de fundo, qualidade gráfica, pedidos de Porto Brisamar e Pedravale, e as interações extras com elfos, filhos crescidos e família secreta. | — |
| 9 | `js/vida/09-simulador-e-profissoes.js` | Modo Simulador de Vida: sem runas e sem batalhas da história. O jogador cuida das necessidades básicas, trabalha de verdade (com minijogos), pode ter a própria tendinha e entrar pa | — |
| 10 | `js/mundo/10-reinos-e-idade.js` | Só no Simulador de Vida: - Idade: o ano dura 15 dias (veja 33-pedro-max-e-vida-inteligente.js). Você envelhece, e um dia a vida acaba. Se tiver um filho adulto, ele herda tudo e vo | — |
| 11 | `js/mundo/11-casas-e-quintal.js` | Só no Simulador de Vida: - Casas à venda nas três vilas: comprar, morar, alugar as outras. - Coletor Real: uma pessoa do palácio vem até você cobrar o imposto da casa e dos móveis. | — |
| 12 | `js/pessoas/12-vila-amigos-e-contatos.js` | Simulador de Vida mais cheio de vida: - Móveis novos (banheira, mesa de jogos, fogão a lenha) e todos os móveis úteis. - Muitas interações com os moradores (piada, conselho, fofoca | `npcSpot` (04-familia-e-dialogos.js), `npcHidden` (02-estado-som-e-sprites.js), `drawFurnExtra` |
| 13 | `js/vida/13-saude.js` | Saúde: - Nos dois modos: comer frutas silvestres ou beber água de rio/fonte pode causar intoxicação. - No Simulador de Vida: doenças (gripe, disenteria, febre e peste), com causas, | — |
| 14 | `js/interface/14-pizza-catalogo-e-lojas.js` | Menu de interação no estilo "The Sims": ao clicar num personagem (ou apertar E perto dele), as opções aparecem em círculo ao redor dele, agrupadas por categoria (Amigável, Romântic | `itemIcon` (02-estado-som-e-sprites.js), `useItemEffect` (02-estado-som-e-sprites.js), `furnWalk` (03-mapa-e-geracao.js), `drawFurnExtra` (12-vila-amigos-e-contatos.js) |
| 15 | `js/mundo/15-floresta-e-clima.js` | Floresta Grande (só no Simulador de Vida): animais que andam pelo mapa. Lobos, javalis e ursos atacam quem chega perto; cervos fogem. Lutar e caçar é com E na hora certa do medidor | `dmgMul` (02-estado-som-e-sprites.js), `startBattle` (06-batalha.js) |
| 16 | `js/historia/16-vilao-e-missoes.js` | Caminho do vilão (modo História), do começo ao fim: - Escolhas em todos os momentos da história (treino, mercado, Odelia, Porto, Farol, Pedravale, Mina, Forja e cada Guardião): her | `enterMine` (09-simulador-e-profissoes.js) |
| 17 | `js/pessoas/17-interacoes.js` | Painel de interações estilo The Sims (nos dois modos): mais de 100 ações separadas por categoria. Cada pessoa reage de um jeito, conforme a personalidade e a amizade. Algumas ações | — |
| 18 | `js/nucleo/18-entrada.js` | Controles (teclado e toque), botões da interface e inicialização do jogo. | — |
| 19 | `js/interface/19-melhorias-e-criador.js` | 1. Tutorial jogável nos primeiros minutos (cartão com o próximo passo). 2. Três espaços de jogo salvo, com retrato e resumo de cada um. 3. Música própria para cada lugar (floresta, | `desiredTrack` (08-opcoes-musica-missoes.js), `drawDialogPortrait` (05-interface-e-comercio.js), `drawMinimap` (05-interface-e-comercio.js), `crewGathering` (12-vila-amigos-e-contatos.js), `onNewDay` (04-familia-e-dialogos.js), `crewItems` (12-vila-amigos-e-contatos.js), `crewDoor` (12-vila-amigos-e-contatos.js), `shopAll` (14-pizza-catalogo-e-lojas.js), `questLabel` (16-vilao-e-missoes.js), `questInteract` (16-vilao-e-missoes.js), `trappedTarget` (16-vilao-e-missoes.js), `questDrawList` (16-vilao-e-missoes.js), `vetMenu` (12-vila-amigos-e-contatos.js), `renderOptions` (08-opcoes-musica-missoes.js) |
| 20 | `js/interface/20-inventario.js` | Inventário em grade: o personagem no meio com os 4 espaços de equipamento em volta, uma grade de quadradinhos com todos os itens (ícone + quantidade), filtros por categoria em abas | `renderInv` (05-interface-e-comercio.js) |
| 21 | `js/vida/21-carreiras.js` | 20 carreiras jogáveis (as 13 novas são do Simulador de Vida), com plano de carreira: - Oficina (medidor de força na porta do lugar): Padeiro, Ferreiro, Costureiro, Cozinheiro, Escr | `jobPay` (09-simulador-e-profissoes.js), `endJob` (09-simulador-e-profissoes.js), `startJob` (09-simulador-e-profissoes.js), `jobAvailableHere` (09-simulador-e-profissoes.js), `jobTick` (09-simulador-e-profissoes.js), `jobLabel` (09-simulador-e-profissoes.js), `jobInteract` (09-simulador-e-profissoes.js), `jobTarget` (09-simulador-e-profissoes.js), `jobStatusText` (09-simulador-e-profissoes.js), `jobDrawList` (09-simulador-e-profissoes.js), `professionsMenu` (09-simulador-e-profissoes.js) |
| 22 | `js/pessoas/22-turma-aa.js` | - A Júlia Oliveira entra para a turma, que tem nome: Alcoólatras Anônimos. - Reunião semanal do grupo na Taverna Javali Dourado (a cada 7 dias, das 19h às 23h). - Mais 32 interaçõe | `crewGroupMenu` (12-vila-amigos-e-contatos.js), `crewItems` (12-vila-amigos-e-contatos.js), `crewTarget` (12-vila-amigos-e-contatos.js), `crewHomeOf` (12-vila-amigos-e-contatos.js), `genInterior` (03-mapa-e-geracao.js), `interiorPersonMenu` (12-vila-amigos-e-contatos.js), `onNewDay` (04-familia-e-dialogos.js) |
| 23 | `js/vida/23-calendario-e-vida-extra.js` | 1. Calendário da vila (tecla L): festivais, desfiles, aniversários, reuniões, exposições. 2. Diário do jogador: registra sozinho o que você viveu (aba no mesmo painel). 3. Ofícios  | `earn` (09-simulador-e-profissoes.js), `festivalMenu` (04-familia-e-dialogos.js), `drawDialogPortrait` (05-interface-e-comercio.js), `socialMenu` (04-familia-e-dialogos.js), `crewItems` (12-vila-amigos-e-contatos.js), `onNewDay` (04-familia-e-dialogos.js), `enterZone` (03-mapa-e-geracao.js), `openInv` (05-interface-e-comercio.js), `payWithTax` (04-familia-e-dialogos.js), `endJob` (09-simulador-e-profissoes.js) |
| 24 | `js/historia/24-batalha-visual.js` | Batalha com mais emoção: - Cartão do jogador (retrato, vida, magia, fôlego e efeitos) dentro do painel. - Runas viram botões grandes com a cor do elemento. - Trama das runas com pr | `renderBattle` (06-batalha.js), `battleLog` (06-batalha.js), `enemyTurn` (06-batalha.js), `startPlayerTurn` (06-batalha.js), `startBattle` (06-batalha.js), `applySpellDamage` (06-batalha.js), `endBattle` (06-batalha.js) |
| 25 | `js/pessoas/25-turma-luca-e-iluministas.js` | - Luca: careca, maluco, quebra a quarta parede. Às vezes aparece com o grupão. - Iluministas: Luca e Lucas Marzocca contra a monarquia; dá para entrar e convencer os outros. - Famí | `crewTarget` (12-vila-amigos-e-contatos.js), `crewHomeOf` (12-vila-amigos-e-contatos.js), `genInterior` (03-mapa-e-geracao.js), `interiorPersonMenu` (12-vila-amigos-e-contatos.js), `bldService` (04-familia-e-dialogos.js), `crewDoor` (12-vila-amigos-e-contatos.js), `crewItems` (12-vila-amigos-e-contatos.js), `interReqOk` (17-interacoes.js), `lifeSocialItems` (17-interacoes.js), `onNewDay` (04-familia-e-dialogos.js), `renderShop` (14-pizza-catalogo-e-lojas.js), `renderCosmetic` (14-pizza-catalogo-e-lojas.js) |
| 26 | `js/interface/26-celular-e-tela-inicio.js` | Ajustes para jogar no celular: - o jogo é só deitado (em pé aparece um aviso para girar o aparelho); - os botões pequenos (Itens, Missões, Mapa...) ficam guardados num botão ☰, ass | — |
| 27 | `js/vida/27-almas-e-autonomia.js` | Cada pessoa tem um jeito de ser: - gênero, personalidade (2 traços) e orientação (de quem ela gosta); - casais entre os moradores (além dos casais da turma); - você escolhe a sua p | — |
| 28 | `js/vida/28-protestos-e-golpe.js` | Protesto dos Iluministas na frente do castelo (Simulador): 1. Concentração: cartazes, gritos de guerra, Luca e Lucas puxando o coro. 2. A Rainha aparece na escadaria: começam a voa | — |
| 29 | `js/mundo/29-casa-bonita.js` | Casa mais bonita e do seu jeito: - móveis redesenhados com luz, sombra, contorno e detalhes; - 12 móveis novos (sofá, poltrona, piano, relógio de pêndulo, cama de casal...); - pint | — |
| 30 | `js/vida/30-crime-calabouco-e-forca.js` | Crimes, castigo e o calabouço (nos dois modos): - Qualquer adulto pode morrer (crianças não). Magos são imortais para mortais: no Simulador ninguém mata a Odelia; no modo História  | — |
| 31 | `js/mundo/31-castelos.js` | Os outros reinos ganham as suas sedes: - Palácio das Marés (Porto Brisamar): numa ilha no mar, ligada pela ponte do cais. Paredes brancas, cúpulas azul-turquesa e bandeiras com a o | — |
| 32 | `js/vida/32-realeza-e-mundo-vivo.js` | Simulador de Vida: quem você é quando nasce. - Na criação (aba Origem): plebeu, artesão, comerciante, burguês, nobre ou realeza, e uma ocupação inicial (qualquer carreira, já com e | — |
| 33 | `js/vida/33-pedro-max-e-vida-inteligente.js` | - Ciúme nos dois modos e mais frequente: quem é casado descobre mais (o par perto vê na hora; longe, a fofoca chega em poucos segundos). - Pedro Max é o mais bolado de todos: deu e | — |
| 34 | `js/vida/34-mortes.js` | 30 jeitos de morrer no Simulador (e o duelo de magos na história). Cada morte tem a sua cena: o cenário onde aconteceu, quem matou, os efeitos (sangue, água, raio, neve, veneno...) | — |
| 35 | `js/vida/35-reino-e-iluministas.js` | - Luca e Lucas Marzocca puxam o protesto na primeira fila, com nome em cima da cabeça, megafone e gritos próprios (o Marzoca dá em cima até da Rainha). - Botão "Golpe" (☰ no celula | — |
| 36 | `js/vida/36-legado.js` | - Fofoca que se espalha: seus segredos (furtos, arrombamentos, flerte com gente casada) passam de boca em boca pelas amizades. Dá para abafar (pagar para guardar segredo) ou desmen | — |
| 37 | `js/interface/37-polimento.js` | - Guia do Simulador: o tutorial agora apresenta conversar, o menu de Ações, os objetivos do dia e os perigos. Dá para rever em Ações → Rever o guia. - O painel do tutorial não fica | — |

## Testes

- `npm run check`: confere a sintaxe de todos os scripts.
- `npm test`: abre o jogo num navegador (Playwright) e passa pelas telas principais dos dois modos.
- Os dois rodam sozinhos no GitHub a cada push (`.github/workflows/testes.yml`).

## Versão de um arquivo só

`npm run build` junta todos os scripts em `dist/ecos.js` (pasta ignorada pelo git).
