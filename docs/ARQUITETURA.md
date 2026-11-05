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
| 2 | `js/nucleo/02-estado-som-sprites.js` | Estado do jogador, salvamento, efeitos sonoros e funções de desenho de sprites. | — |
| 3 | `js/mundo/03-mapa-e-mundo.js` | Desenho do mapa, clima, estações, interação com o mundo e vida das vilas. | — |
| 4 | `js/mundo/04-geracao-do-mundo.js` | Geração das regiões, da Vila de Cinzaluz, Porto Brisamar, Pedravale e interiores. | — |
| 5 | `js/mundo/04b-bairro-novo.js` | Aumenta a Vila de Cinzaluz para o sul: 16 linhas novas com o Bairro das Flores, duas ruas com lampiões, árvores, bancos e lotes largos para as casas da turma (que antes ficavam esp | — |
| 6 | `js/pessoas/05-familia-e-vida-social.js` | Família, aparência, reputação, mascotes, traição, fofocas, bebedeira, brigas, escola e passeata. | — |
| 7 | `js/pessoas/06-festivais-amizades-dialogos.js` | Festivais, amizades, romance e diálogos dos personagens. | — |
| 8 | `js/interface/07-trabalhos-comercio-ataques.js` | Quadro de trabalhos, central de trocas, cavalo, carruagem e ataques à vila. | — |
| 9 | `js/interface/08-interface.js` | Caixas de diálogo, missões, HUD e grimório. | — |
| 10 | `js/historia/09-batalha.js` | Sistema de batalha por turnos: feitiços, habilidades, turno do inimigo e recompensas. Estado global da batalha: `B` (definido em 02-estado-som-sprites.js). Outros arquivos leem: B. | — |
| 11 | `js/nucleo/10-loop-e-desenho.js` | Loop principal: atualização do jogo e desenho de cada tela. | — |
| 12 | `js/interface/11-opcoes-musica-missoes.js` | Tela de opções, música de fundo, qualidade gráfica, pedidos de Porto Brisamar e Pedravale, e as interações extras com elfos, filhos crescidos e família secreta. | — |
| 13 | `js/vida/13-simulador-de-vida.js` | Modo Simulador de Vida: sem runas e sem batalhas da história. O jogador cuida das necessidades básicas, trabalha de verdade (com minijogos), pode ter a própria tendinha e entrar pa | — |
| 14 | `js/vida/14-profissoes.js` | Profissões medievais feitas de verdade, andando e agindo no mapa: lenhador, fazendeiro, minerador, pescador, carregador, guarda (patrulha e ladrões), feirante (clientes vêm até voc | — |
| 15 | `js/mundo/15-reinos-e-idade.js` | Só no Simulador de Vida: - Idade: cada dia do jogo é um ano. Você envelhece, e um dia a vida acaba. Se tiver um filho adulto, ele herda tudo e você continua jogando com ele. - Rein | — |
| 16 | `js/mundo/16-casas-e-realeza.js` | Só no Simulador de Vida: - Casas à venda nas três vilas: comprar, morar, alugar as outras. - Coletor Real: uma pessoa do palácio vem até você cobrar o imposto da casa e dos móveis. | — |
| 17 | `js/pessoas/17-vida-na-vila.js` | Simulador de Vida mais cheio de vida: - Móveis novos (banheira, mesa de jogos, fogão a lenha) e todos os móveis úteis. - Muitas interações com os moradores (piada, conselho, fofoca | — |
| 18 | `js/vida/18-saude.js` | Saúde: - Nos dois modos: comer frutas silvestres ou beber água de rio/fonte pode causar intoxicação. - No Simulador de Vida: doenças (gripe, disenteria, febre e peste), com causas, | — |
| 19 | `js/interface/19-menu-pizza.js` | Menu de interação no estilo "The Sims": ao clicar num personagem (ou apertar E perto dele), as opções aparecem em círculo ao redor dele, agrupadas por categoria (Amigável, Romântic | — |
| 20 | `js/mundo/20-floresta.js` | Floresta Grande (só no Simulador de Vida): animais que andam pelo mapa. Lobos, javalis e ursos atacam quem chega perto; cervos fogem. Lutar e caçar é com E na hora certa do medidor | — |
| 21 | `js/pessoas/21-amigos-criadores.js` | Os criadores do jogo viram personagens importantes de Cinzaluz, com seus parceiros: - Lucas Marzocca: o rolezeiro. Só conversa depois de ganhar um hidromel. - Matheus: o fazendeiro | `npcSpot` (05-familia-e-vida-social.js), `npcHidden` (02-estado-som-sprites.js), `drawFurnExtra` (17-vida-na-vila.js) |
| 22 | `js/historia/22-vilao.js` | Caminho do vilão (modo História), do começo ao fim: - Escolhas em todos os momentos da história (treino, mercado, Odelia, Porto, Farol, Pedravale, Mina, Forja e cada Guardião): her | — |
| 23 | `js/pessoas/23-contatos.js` | Namorar e casar com QUALQUER pessoa (nos dois modos): - Moradores da rua e frequentadores da taverna: "Conhecer melhor" vira um contato fixo, com amizade, presentes, namoro e casam | — |
| 24 | `js/nucleo/29-icones-pixel.js` | Gerador de ícones em pixel art 16×16: cada forma (espada, cajado, poção, fruta, peixe, móvel, joia...) é desenhada em código e pintada com a paleta do item. Depois um passo automát | `iconHTML` (02-estado-som-sprites.js), `drawPixelIcon` (02-estado-som-sprites.js) |
| 25 | `js/interface/30-catalogo-itens.js` | 500 itens novos, cada um com o seu ícone em pixel art (ver 29-icones-pixel.js): frutas, legumes, pães e doces, carnes, peixes, pratos, bebidas, poções, ervas, minérios e gemas, mad | `itemIcon` (02-estado-som-sprites.js), `useItemEffect` (02-estado-som-sprites.js), `furnWalk` (04-geracao-do-mundo.js), `drawFurnExtra` (17-vida-na-vila.js) |
| 26 | `js/interface/24-lojas.js` | Telas de compra caprichadas: vitrine com o atendente falando, carrossel em leque (o item do meio fica grande, os vizinhos aparecem menores dos lados), painel de detalhes com atribu | — |
| 27 | `js/pessoas/25-interacoes.js` | Painel de interações estilo The Sims (nos dois modos): mais de 100 ações separadas por categoria. Cada pessoa reage de um jeito, conforme a personalidade e a amizade. Algumas ações | — |
| 28 | `js/mundo/26-casa-quintal.js` | Casas com quintal e com andares: - Casa, Sobrado e Mansão têm quintal (porta no fundo da casa): horta, poço, árvores, banco e, na Mansão, laguinho e jardim. - Sobrado e Mansão têm  | — |
| 29 | `js/mundo/27-clima-e-cansaco.js` | - Equilíbrio das runas: combinações fortes demais ficaram mais caras ou mais fracas, e os bônus de dano (cajado, afinidade, poder sombrio, bebida...) têm um teto. - O clima mexe no | `dmgMul` (02-estado-som-sprites.js), `startBattle` (09-batalha.js) |
| 30 | `js/historia/28-missoes-farol-mina.js` | Missões nos dois modos: - Desabamento na Mina (Mina de Cristal, Pedravale): três mineiros presos lá no fundo. Ache cada um, cave e tire de lá. - A Lente Rachada (Farol de Brisamar, | `enterMine` (14-profissoes.js) |
| 31 | `js/nucleo/12-entrada.js` | Controles (teclado e toque), botões da interface e inicialização do jogo. | — |
| 32 | `js/interface/31-melhorias.js` | 1. Tutorial jogável nos primeiros minutos (cartão com o próximo passo). 2. Três espaços de jogo salvo, com retrato e resumo de cada um. 3. Música própria para cada lugar (floresta, | `desiredTrack` (11-opcoes-musica-missoes.js), `drawDialogPortrait` (08-interface.js), `drawMinimap` (07-trabalhos-comercio-ataques.js), `crewGathering` (21-amigos-criadores.js), `onNewDay` (05-familia-e-vida-social.js), `crewItems` (21-amigos-criadores.js), `crewDoor` (21-amigos-criadores.js), `shopAll` (24-lojas.js), `questLabel` (28-missoes-farol-mina.js), `questInteract` (28-missoes-farol-mina.js), `trappedTarget` (28-missoes-farol-mina.js), `questDrawList` (28-missoes-farol-mina.js), `vetMenu` (21-amigos-criadores.js), `renderOptions` (11-opcoes-musica-missoes.js) |
| 33 | `js/interface/33-inventario.js` | Inventário em grade: o personagem no meio com os 4 espaços de equipamento em volta, uma grade de quadradinhos com todos os itens (ícone + quantidade), filtros por categoria em abas | `renderInv` (07-trabalhos-comercio-ataques.js) |
| 34 | `js/vida/32-carreiras.js` | 20 carreiras jogáveis (as 13 novas são do Simulador de Vida), com plano de carreira: - Oficina (medidor de força na porta do lugar): Padeiro, Ferreiro, Costureiro, Cozinheiro, Escr | `jobPay` (14-profissoes.js), `endJob` (14-profissoes.js), `startJob` (14-profissoes.js), `jobAvailableHere` (14-profissoes.js), `jobTick` (14-profissoes.js), `jobLabel` (14-profissoes.js), `jobInteract` (14-profissoes.js), `jobTarget` (14-profissoes.js), `jobStatusText` (14-profissoes.js), `jobDrawList` (14-profissoes.js), `professionsMenu` (14-profissoes.js) |
| 35 | `js/pessoas/34-turma-aa.js` | - A Júlia Oliveira entra para a turma, que tem nome: Alcoólatras Anônimos. - Reunião semanal do grupo na Taverna Javali Dourado (a cada 7 dias, das 19h às 23h). - Mais 32 interaçõe | `crewGroupMenu` (21-amigos-criadores.js), `crewItems` (21-amigos-criadores.js), `crewTarget` (21-amigos-criadores.js), `crewHomeOf` (21-amigos-criadores.js), `genInterior` (04-geracao-do-mundo.js), `interiorPersonMenu` (23-contatos.js), `onNewDay` (05-familia-e-vida-social.js) |
| 36 | `js/interface/35-criador.js` | Criador de personagem completo (criação e guarda-roupa): - Barra lateral com ícones: Perfil, Rosto, Cabelo, Chapéu, Roupa, Acessórios, Cajado. - Abas dentro de cada parte (ex.: Cab | — |
| 37 | `js/vida/36-vida-extra.js` | 1. Calendário da vila (tecla L): festivais, desfiles, aniversários, reuniões, exposições. 2. Diário do jogador: registra sozinho o que você viveu (aba no mesmo painel). 3. Ofícios  | `earn` (14-profissoes.js), `festivalMenu` (06-festivais-amizades-dialogos.js), `drawDialogPortrait` (08-interface.js), `socialMenu` (06-festivais-amizades-dialogos.js), `crewItems` (21-amigos-criadores.js), `onNewDay` (05-familia-e-vida-social.js), `enterZone` (03-mapa-e-mundo.js), `openInv` (07-trabalhos-comercio-ataques.js), `payWithTax` (06-festivais-amizades-dialogos.js), `endJob` (14-profissoes.js) |
| 38 | `js/historia/37-batalha-visual.js` | Batalha com mais emoção: - Cartão do jogador (retrato, vida, magia, fôlego e efeitos) dentro do painel. - Runas viram botões grandes com a cor do elemento. - Trama das runas com pr | `renderBattle` (09-batalha.js), `battleLog` (09-batalha.js), `enemyTurn` (09-batalha.js), `startPlayerTurn` (09-batalha.js), `startBattle` (09-batalha.js), `applySpellDamage` (09-batalha.js), `endBattle` (09-batalha.js) |
| 39 | `js/pessoas/38-turma-luca.js` | - Luca: careca, maluco, quebra a quarta parede. Às vezes aparece com o grupão. - Iluministas: Luca e Lucas Marzocca contra a monarquia; dá para entrar e convencer os outros. - Famí | `crewTarget` (21-amigos-criadores.js), `crewHomeOf` (21-amigos-criadores.js), `genInterior` (04-geracao-do-mundo.js), `interiorPersonMenu` (23-contatos.js), `bldService` (06-festivais-amizades-dialogos.js), `crewDoor` (21-amigos-criadores.js), `crewItems` (21-amigos-criadores.js), `interReqOk` (25-interacoes.js), `lifeSocialItems` (25-interacoes.js), `onNewDay` (05-familia-e-vida-social.js), `renderShop` (24-lojas.js), `renderCosmetic` (24-lojas.js) |
| 40 | `js/pessoas/39-interacoes-mais.js` | Mais de 250 interações novas (o total passa de 400), com categorias novas: Elogiar, Brincadeiras, Jogos, Família e vizinhança, Reino (inclui o Iluminismo) e Coração (romance mais l | — |

## Testes

- `npm run check`: confere a sintaxe de todos os scripts.
- `npm test`: abre o jogo num navegador (Playwright) e passa pelas telas principais dos dois modos.
- Os dois rodam sozinhos no GitHub a cada push (`.github/workflows/testes.yml`).

## Versão de um arquivo só

`npm run build` junta todos os scripts em `dist/ecos.js` (pasta ignorada pelo git).
