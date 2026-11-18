# Ecos do Arcano — Documentação técnica

Guia para quem vai mexer no código. Para jogar, veja o [README](../README.md).

## 1. Como o jogo é montado

- **Sem framework e sem build obrigatório.** O `index.html` carrega 173 scripts em ordem (`<script src>`), e todos dividem o mesmo escopo global. Abrir o `index.html` no navegador já roda o jogo.
- **A ordem importa.** Um arquivo só pode usar o que foi carregado antes dele. Arquivos novos entram no `index.html` logo depois daquilo que eles modificam.
- **Tudo é desenhado no `<canvas>`**, pixel a pixel (sprites, ícones e cenários são gerados por código). A música e os sons são criados na hora com o Web Audio API.
- **`npm run build`** (`tools/build.js`) junta tudo num arquivo só em `dist/`, para publicar.

### O padrão de "embrulhar" funções

Quase todo arquivo novo acrescenta comportamento sem editar o original: guarda a função antiga e a substitui por uma que chama a antiga e faz algo a mais.

```js
const baseUpdate = update;
update = function (dt) {
  const r = baseUpdate.apply(this, arguments);
  // ... o que este arquivo acrescenta
  return r;
};
```

Por isso cada arquivo explica, no cabeçalho, **o que faz e quais funções de outros arquivos ele embrulha**. Antes de mudar uma função, procure (`grep`) quem mais a embrulha.

### Peças centrais

| Peça | Onde | Para que serve |
|---|---|---|
| `player` | `nucleo/estado-som-e-sprites.js` | Tudo que é salvo: nome, zona, posição, itens, relações, flags da história. |
| `game` | idem | Estado da tela, que não é salvo: `game.mode` (`title`, `world`, `battle`, `gmenu`...), diálogo aberto, câmera. |
| `saveGame()` / `loadGame()` | idem | Grava `player` em JSON no `localStorage` (`SAVE_KEY`). |
| `ZONES` | `mundo/geracao-do-mundo.js` | Cada lugar do mundo: `map` (linhas de caracteres), `w`/`h`, `town.bld` (prédios), `npcs`, `spawn`. |
| `update(dt)` / `draw()` / `loop()` | `nucleo/loop-e-desenho.js` | O laço principal, que roda a cada quadro. |
| `KEY_HANDLERS` | `nucleo/entrada.js` | Teclas por modo de tela (`KEY_HANDLERS[game.mode]`). |
| `lifeMode()` | `vida/simulador.js` | `true` no Simulador de Vida, `false` no Modo História. Separa o que é de cada modo. |
| `VILA_X(x, y)` | `mundo/alargar-rio.js` | Converte colunas antigas da vila para as novas, depois que o mapa cresceu em volta do rio. |
| `LOTES` | `mundo/bairro-dos-lotes.js` e `mundo/lotes-comunitarios.js` | Lotes no estilo The Sims (casa, quintal, cerca, portão) em todas as cidades. |
| `openGameMenu()` | `interface/menu-do-jogo.js` | O Menu do jogo, que reúne Mochila, Mapa, Missões, Opções etc. |
| `enableCheats()` | `interface/modo-dev.js` | Liga os truques e o painel TESTES. |

### Os mapas

Cada `ZONES[id].map` é uma lista de textos, e cada caractere é um tile. Alguns exemplos:

- `.` grama
- `,` chão de pedra
- `=` ponte
- `~` água
- `#` parede ou borda
- `H` prédio
- `D` porta

Os arquivos de `mundo/` crescem e reorganizam esses mapas depois que são gerados, e ajustam junto tudo o que tem posição (portas, NPCs, barracas, lotes).

## 2. Dois modos no mesmo código

- **Modo História:** runas, batalhas por turnos, chefes, covis e a saga (`js/historia/`).
- **Simulador de Vida:** necessidades, trabalho, família, realeza, governo e crime (`js/vida/`).
- O que vale para um modo só fica atrás de `lifeMode()`.
- Mundo, pessoas e interface são compartilhados.

## 3. Testes

```bash
npm run check   # sintaxe de todos os scripts + confere se todos estão no index.html
npm test        # abre o jogo no Chromium (Playwright) e passa pelos dois modos (74 verificações)
```

Rode os dois antes de cada commit. A verificação "Vencer o Silenciador" às vezes falha por tempo; se só ela falhar, rode de novo.

## 4. Truques (modo dev)

- **Computador:** segure **Ctrl** e digite **E C O**.
- **Celular:** toque 5 vezes no título do **Menu do jogo**.
- Os truques ligados ficam salvos no aparelho (`localStorage.ecosDev`).
- O painel **TESTES** abre pela tecla **F9** ou pelo Menu do jogo. Tem abas para Começo, Lugares, Tempo e clima, História, Simulador e Avançado.
- `dev.html` abre o jogo com os truques já ligados.

## 5. Como acrescentar algo

1. Crie um arquivo na pasta do assunto, com cabeçalho dizendo o que faz e o que embrulha.
2. Coloque o arquivo no `index.html`, depois dos arquivos de que ele depende.
3. Separe o que é de um modo só com `lifeMode()`.
4. Se o arquivo muda mapas de cidades, rode o teste de design: portas acessíveis, quintais sem bloqueio, nada sobreposto.
5. Rode `npm run check` e `npm test`.

**Regra de conteúdo:** a turma de Cinzaluz é baseada em pessoas reais. Nada de conteúdo +18 sexual envolvendo esses personagens.

## 6. Índice dos arquivos (na ordem de carregamento)

O número é a posição do arquivo no `index.html`.

### Núcleo (`js/nucleo/`, 6 arquivos)

| # | Arquivo | O que faz |
|---|---|---|
| 1 | `dados.js` | Dados do jogo: runas, feitiços, inimigos, itens, lojas, personagens e textos da história. |
| 2 | `estado-som-e-sprites.js` | Estado do jogador, salvamento, efeitos sonoros e funções de desenho de sprites. |
| 3 | `icones-pixel.js` | Gerador de ícones em pixel art 16×16: cada forma (espada, cajado, poção, fruta |
| 16 | `loop-e-desenho.js` | Loop principal: atualização do jogo e desenho de cada tela. |
| 37 | `entrada.js` | Controles (teclado e toque), botões da interface e inicialização do jogo. |
| 145 | `graficos-lindos.js` | Camadas de luz e cor por cima do mundo, seguindo o que os artistas de |

### Mundo (`js/mundo/`, 29 arquivos)

| # | Arquivo | O que faz |
|---|---|---|
| 4 | `mapa.js` | Desenho do mapa, clima, estações, interação com o mundo e vida das vilas. |
| 5 | `chao-suave.js` | O chão deixa de parecer um tabuleiro de xadrez. |
| 6 | `geracao-do-mundo.js` | Geração das regiões, da Vila de Cinzaluz, Porto Brisamar, Pedravale e interiores. |
| 7 | `bairro-das-flores.js` | Aumenta a Vila de Cinzaluz para o sul: 16 linhas novas com o Bairro das Flores |
| 8 | `alto-do-descanso.js` | A vila cresce mais um pouco para o sul: o Alto do Descanso. |
| 9 | `campos-do-leste.js` | Cinzaluz cresce para o LESTE (34 colunas novas), com quatro bairros |
| 10 | `bairro-dos-lotes.js` | O Bairro dos Lotes, planejado como os lotes do The Sims: cada casa tem o |
| 20 | `reinos-e-idade.js` | Só no Simulador de Vida |
| 21 | `casas-e-realeza.js` | Só no Simulador de Vida |
| 22 | `casa-e-quintal.js` | Casas com quintal e com andares |
| 31 | `floresta.js` | Floresta Grande (só no Simulador de Vida): animais que andam pelo mapa. |
| 32 | `clima-e-cansaco.js` |  - Equilíbrio das runas: combinações fortes demais ficaram mais caras ou mais fracas |
| 53 | `casa-bonita.js` | Casa mais bonita e do seu jeito |
| 57 | `castelos.js` | Os outros reinos ganham as suas sedes |
| 123 | `guarda-do-exilio.js` | Quando o mago é exilado (a forca não mata magos), o exílio vale de verdade |
| 126 | `reinos-novos-e-viagem.js` | Dois reinos novos (mais Aurélia, Marés e Pedravale) |
| 130 | `lotes-em-todos-os-reinos.js` | O padrão de bairro do The Sims vale para TODOS os reinos: cada cidade |
| 131 | `alargar-rio.js` | Respiro de verdade entre o rio e as construções de Cinzaluz: o mapa |
| 132 | `centro-em-lotes.js` | O centro de Cinzaluz também segue o padrão dos lotes (estilo The Sims) |
| 133 | `afastar-estruturas.js` | Respiro entre as estruturas em TODAS as cidades (vila, reinos e países) |
| 134 | `lotes-no-centro.js` | O padrão dos lotes (como no The Sims) também nas casas antigas do centro |
| 135 | `lotes-comunitarios.js` | No The Sims, além das casas (lotes residenciais) toda loja, templo e |
| 141 | `casas-e-terras-diversas.js` | Cada casa com cara própria, e cada terra com a sua paisagem. |
| 142 | `casas-formas.js` | Diversidade de verdade: as casas comuns não mudam só de cor, mudam de |
| 146 | `fonte-da-praca.js` | A fonte da praça de Cinzaluz, como as fontes de praça das cidades |
| 147 | `rio-vivo.js` | O rio de Cinzaluz deixa de ser um canal reto: ele serpenteia (curvas |
| 149 | `fundos-e-telhados.js` |  - PORTA DOS FUNDOS: na sua casa (comprada ou a do começo) com quintal |
| 150 | `florestas-locais.js` | Cada vila, reino e país tem 3 FLORESTAS LOCAIS, nos dois modos. As saídas |
| 165 | `moradores-andando.js` | Os moradores da rua não ficam mais plantados perto de casa: de tempos em |

### Pessoas (`js/pessoas/`, 15 arquivos)

| # | Arquivo | O que faz |
|---|---|---|
| 11 | `familia-e-vida-social.js` | Família, aparência, reputação, mascotes, traição, fofocas, bebedeira, brigas, escola e passeata. |
| 12 | `festivais-amizades-e-dialogos.js` | Festivais, amizades, romance e diálogos dos personagens. |
| 23 | `vida-na-vila.js` | Simulador de Vida mais cheio de vida |
| 24 | `turma/rotina-da-turma.js` | Os criadores do jogo viram personagens importantes de Cinzaluz, com seus parceiros |
| 25 | `contatos.js` | Namorar e casar com QUALQUER pessoa (nos dois modos) |
| 35 | `interacoes/interacoes.js` | Painel de interações estilo The Sims (nos dois modos): mais de 100 ações |
| 36 | `interacoes/interacoes-extras.js` | Mais de 250 interações novas (o total passa de 400), com categorias novas |
| 43 | `turma/alcoolatras-anonimos.js` |  - A Júlia Oliveira entra para a turma, que tem nome: Alcoólatras Anônimos. |
| 46 | `turma/luca-e-iluministas.js` |  - Luca: careca, maluco, quebra a quarta parede. Às vezes aparece com o grupão. |
| 110 | `turma/papeis-da-turma.js` | Cada pessoa da turma ganha o seu papel na vila |
| 114 | `moradores-marcantes.js` | 14 moradores novos, cada um com personalidade forte: mania, jeito de falar |
| 118 | `bichinhos.js` | Bichinhos melhores |
| 124 | `encontros.js` |  - O encontro usa o mesmo menu pizza de sempre (todas as interações da |
| 125 | `encontros-e-cartas.js` | Encontro não é na rua: a pessoa espera DENTRO de um lugar de verdade. |
| 155 | `turma/marzoca-hiperfoco.js` | O caos romântico da vila |

### Interface (`js/interface/`, 30 arquivos)

| # | Arquivo | O que faz |
|---|---|---|
| 13 | `trabalhos-e-comercio.js` | Quadro de trabalhos, central de trocas, cavalo, carruagem e ataques à vila. |
| 14 | `interface.js` | Caixas de diálogo, missões, HUD e grimório. |
| 17 | `opcoes-musica-e-missoes.js` | Tela de opções, música de fundo, qualidade gráfica, pedidos de Porto Brisamar |
| 27 | `menu-pizza.js` | Menu de interação no estilo "The Sims": ao clicar num personagem (ou apertar E |
| 28 | `itens/catalogo-de-itens.js` | 500 itens novos, cada um com o seu ícone em pixel art (ver estado-som-e-sprites.js) |
| 29 | `itens/itens-novos.js` | Mais 200 itens para comprar, cada um com ícone próprio, nas lojas certas |
| 30 | `itens/lojas.js` | Telas de compra caprichadas: vitrine com o atendente falando, carrossel em leque |
| 38 | `melhorias.js` |  1. Tutorial jogável nos primeiros minutos (cartão com o próximo passo). |
| 39 | `criador-de-personagem.js` | Criador de personagem completo (criação e guarda-roupa) |
| 40 | `itens/inventario.js` | Inventário em grade: o personagem no meio com os 4 espaços de equipamento em volta |
| 41 | `itens/equipamento-visivel.js` | O que você equipa aparece no seu personagem, no mundo, na batalha e no |
| 47 | `celular.js` | Ajustes para jogar no celular |
| 48 | `tela-inicio.js` | Tela de início mais limpa, em dois passos |
| 67 | `polimento.js` |  - Guia do Simulador: o tutorial agora apresenta conversar, o menu de Ações |
| 68 | `cenas.js` | Cenas de tela cheia (coroação, flashbacks): playCine(desenho, duração, depois). |
| 72 | `retratos-musica-e-toque.js` | Retratos das falas com lágrimas e raiva, músicas do golpe, velório |
| 93 | `mapa-e-seta.js` |  - Seta azul das entregas: trabalhos do quadro (entregar itens, levar |
| 94 | `lamento.js` | "Lamento de Cinzaluz": o tema triste do jogo. |
| 104 | `itens/barra-e-bolsa.js` | Inventário mais fácil de entender |
| 115 | `botoes-laterais.js` | Os botões da esquerda (Tela cheia, Menu, Objetivo, Jornal, Corações |
| 116 | `correcoes-gerais.js` | Pequenas correções juntas |
| 117 | `idade.js` | Como nos aplicativos: na primeira vez que apertar Jogar, o jogo pergunta o |
| 148 | `icones-pizza.js` | Ícones novos do menu de interação (estilo The Sims): cada opção ganha um |
| 152 | `tutoriais.js` | Tutoriais curtos que aparecem na primeira vez que você encontra cada |
| 163 | `itens/itens-medievais.js` | Troca os nomes de itens e roupas que soavam modernos (ou de comida que não |
| 164 | `menus-medievais.js` | As caixas de escolha deixam de ser uma lista roxa e viram peças medievais |
| 167 | `icones-medievais.js` | Todos os ícones (itens, menus, balões) passam a seguir o mesmo padrão de |
| 170 | `modo-dev.js` | Versão dev, para testar rápido. Como um código de trapaça: segure CTRL e |
| 172 | `acessibilidade-e-save.js` |  - Levar o jogo salvo para outro navegador ou celular: exportar como arquivo |
| 173 | `menu-do-jogo.js` | Um MENU só, em vez de botões soltos na lateral e da lista ☰ no celular. |

### Modo História (`js/historia/`, 40 arquivos)

| # | Arquivo | O que faz |
|---|---|---|
| 15 | `batalha/batalha.js` | Sistema de batalha por turnos: feitiços, habilidades, turno do inimigo e recompensas. |
| 33 | `vilao.js` | Caminho do vilão (modo História), do começo ao fim |
| 34 | `missoes-farol-e-mina.js` | Missões nos dois modos |
| 45 | `batalha/batalha-visual.js` | Batalha com mais emoção |
| 73 | `saga/base.js` | Ajudantes da saga: story() e lugares fixos e escondidos em cada região (spotOf). |
| 74 | `saga/flashbacks-e-escolhas.js` | Lembranças jogáveis de Odelia e Vesper a cada página do diário e as escolhas |
| 75 | `saga/missoes-da-turma.js` | Uma missão pessoal para cada amigo da turma; quem completar luta mais forte no final. |
| 76 | `saga/batalhas-especiais.js` | Chefes com duas fases, amigo lutando ao lado, inimigos que se adaptam à sua |
| 77 | `saga/cripta.js` | Cripta dos Ecos, no Bosque: tochas na ordem certa, espelhos que levam a luz |
| 78 | `saga/segredos-e-capitulos.js` | 12 segredos escondidos fora do caminho e os capítulos do Pântano (Velha Juta) |
| 79 | `saga/epilogo-e-novo-jogo.js` | Epílogo jogável (estátua ou bandeiras negras, falas novas, os irmãos juntos) |
| 80 | `creditos-finais.js` | Ao terminar o modo História, os créditos sobem na tela como no fim de um |
| 81 | `conversas-da-historia.js` | As falas que fazem a história andar (Odelia, Capitão Bento, Anciã Berta |
| 82 | `emocao.js` | Cenas para os momentos que importam |
| 83 | `rival-e-cerco.js` | Mais coisa acontecendo entre um Guardião e outro |
| 84 | `batalha/guardioes.js` | Cada Guardião luta de um jeito, além de "acertar a fraqueza" |
| 85 | `jornada.js` | Modo História |
| 86 | `poder-unido.js` | Na luta final, quando o Silenciador chega à metade da vida, aparece o botão |
| 87 | `missoes-sem-luta.js` | Missões para resolver com a cabeça, não com magia |
| 88 | `quebra-cabecas.js` | Cinco quebra-cabeças de verdade, jogados com o mouse ou o dedo |
| 89 | `exploracao.js` | Lugares escondidos pelo mundo: 15 ao todo, 3 em cada região. |
| 90 | `caminho-completo.js` | Para zerar, agora é preciso fazer tudo: as missões sem luta, os |
| 91 | `provas-da-torre.js` | A Antessala do Silêncio: três provas no mapa, no estilo da Cripta dos Ecos |
| 92 | `covis.js` | Os Guardiões agora vivem no fundo de uma caverna, e cada caverna tem o seu |
| 95 | `dons.js` | Os Dons: o elemento com que o aprendiz começa (Lava, Gelo, Raio, Metal, Cristal ou Veneno). |
| 96 | `farol.js` | O Guardião da Runa da Chama: a Fênix do Farol, no alto do Farol de Brisamar. |
| 97 | `fragmento.js` | O arco do Fragmento: de onde veio o pedaço de runa que ecoa no aprendiz. |
| 98 | `dom-extras.js` |  1. Diário do Fragmento na Jornada (J). |
| 99 | `covis-dificeis.js` | Covis mais difíceis: mais puzzle, mais exploração e mais luta. |
| 100 | `covis-camaras.js` | Cada covil agora é uma descida de 5 câmaras até o Guardião |
| 101 | `saga-final.js` |  1. O Silenciador aparece em 3 visões antes da Torre (depois do 1º, 3º e |
| 102 | `pos-jogo.js` |  1. Créditos com "fotos" dos momentos da sua jornada. |
| 103 | `fantasma-odelia.js` | Se a Arquimaga Odelia morrer (caminho do vilão), ela some da vila e o |
| 105 | `batalha/tutorial-luta.js` | Tutorial de luta refeito, mais claro |
| 119 | `runas-reunidas.js` | Quando as seis runas voltam a você (Modo História), acontece algo especial |
| 140 | `magia-alem-mar.js` | O Silêncio também atravessou o mar. No modo História, os nove países |
| 157 | `covis-temas.js` | Cada covil agora tem três câmaras SÓ DELE, com a cara do Guardião (inspirado |
| 158 | `coracao-do-silencio.js` | Antes da batalha final, o Silenciador te puxa para o Coração do Silêncio |
| 159 | `biblioteca-caida.js` | A Antiga Academia Arcana virou uma BIBLIOTECA EM RUÍNAS (e não uma caverna) |
| 160 | `odelia-morta-final.js` | Se a Arquimaga Odelia morreu, o Vesper não tem mais quem reencontrar. |

### Simulador de Vida (`js/vida/`, 53 arquivos)

| # | Arquivo | O que faz |
|---|---|---|
| 18 | `simulador.js` | Modo Simulador de Vida: sem runas e sem batalhas da história. |
| 19 | `profissoes.js` | Profissões medievais feitas de verdade, andando e agindo no mapa |
| 26 | `saude.js` | Saúde |
| 42 | `carreiras.js` | 20 carreiras jogáveis (as 13 novas são do Simulador de Vida), com plano de carreira |
| 44 | `calendario-e-diario.js` |  1. Calendário da vila (tecla L): festivais, desfiles, aniversários, reuniões, exposições. |
| 49 | `moradores/almas.js` | Cada pessoa tem um jeito de ser |
| 50 | `moradores/vida-autonoma.js` | Moradores com vontade própria |
| 51 | `poder/protestos.js` | Protesto dos Iluministas na frente do castelo (Simulador) |
| 52 | `poder/golpe.js` | Golpe de estado e conquista dos reinos (Simulador de Vida) |
| 54 | `crime/morte-e-calabouco.js` | Crimes, castigo e o calabouço (nos dois modos) |
| 55 | `crime/crime-e-memoria.js` |  - O corpo fica no chão, com sangue, onde a pessoa morreu. Quem passar perto |
| 56 | `crime/pena-de-morte.js` |  - Pena de morte: quem mata duas vezes (ou mata alguém da realeza) vai a |
| 58 | `realeza/origem-e-ala-real.js` | Simulador de Vida: quem você é quando nasce. |
| 59 | `realeza/alteza.js` |  - Quem nasce na realeza é reconhecido: a Rainha Aurélia trata você como |
| 60 | `mundo-vivo.js` |  - O Eco de Cinzaluz: o jornal do dia (tecla J ou ☰ → Jornal), com manchete |
| 61 | `moradores/pedro-max.js` |  - Ciúme nos dois modos e mais frequente: quem é casado descobre mais (o par |
| 62 | `moradores/vida-inteligente.js` |  - O ano dura 30 dias: o aniversário é a cada 30 dias, com festa. |
| 63 | `mortes.js` | 30 jeitos de morrer no Simulador (e o duelo de magos na história). |
| 64 | `poder/golpe-e-protesto.js` |  - Luca e Lucas Marzocca puxam o protesto na primeira fila, com nome em cima |
| 65 | `poder/iluministas-e-conselho.js` |  - Golpe solo: dá para derrubar a coroa sozinh@, sem aliados (planta do |
| 66 | `familia/legado.js` |  - Fofoca que se espalha: seus segredos (furtos, arrombamentos, flerte com |
| 69 | `poder/coroacao-e-corte.js` | Cena da coroação, Corte Real (General, Tesoureiro, Espião, com risco de traição) |
| 70 | `eventos-da-vila.js` | Eventos grandes (incêndio, enchente, circo, praga, mercador), sonhos dos |
| 71 | `familia/dinastia-e-desafios.js` | Conquistas de dinastia, Diário da Vida ao morrer (copiar e compartilhar) |
| 106 | `poder/democracia.js` | Depois do golpe dos Iluministas, Cinzaluz vira uma democracia |
| 107 | `moradores/convites.js` | Convites de casamento e de velório |
| 108 | `moradores/coracoes-jornal-cemiterio.js` |  - Corações (o "Tinder" de Cinzaluz): cartões com a pessoa DESENHADA, idade |
| 109 | `moradores/capela-e-cemiterio.js` | O Alto do Descanso, no sul da vila (o mapa está em alto-do-descanso.js) |
| 111 | `moradores/modo-adulto.js` | Modo +18, desligado por padrão (Opções → Conteúdo). Pede confirmação de idade. |
| 112 | `trabalhos-e-roupas-novos.js` |  - 12 trabalhos novos: 10 de oficina (Barbeiro, Sineiro, Moleiro |
| 113 | `cosmeticos-novos.js` | Mais 200 itens de estilo para o personagem (alfaiataria, salão, criador e |
| 120 | `taverna-viva.js` | Mais vida e realismo |
| 121 | `outras-vilas.js` | Porto Brisamar e Pedravale com vida própria |
| 122 | `trabalho-por-dentro.js` | Trabalhos com realismo |
| 127 | `festa-das-lanternas.js` | A Noite das Mil Lanternas, no Reino de Solmar (a cidade da praia). |
| 128 | `navegador.js` | Grandes navegações pelo Mar Aberto, além dos reinos conhecidos. |
| 129 | `paises-e-costumes.js` | Os dez países do mundo. O nosso é Valdária (Aurélia, Marés, Pedravale |
| 136 | `poder/governo-e-reino.js` | Governar custa, e não governar também. |
| 137 | `vida-no-campo.js` | A vida nos bairros novos do leste de Cinzaluz (veja campos-do-leste.js) |
| 138 | `quintais.js` | O que se faz no quintal das casas do Bairro dos Lotes (veja |
| 139 | `moradores-dos-lotes.js` | As casas do Bairro dos Lotes têm gente morando |
| 143 | `desastres-naturais.js` | A natureza não pede licença. Inspirado nos jogos de cidade em que o |
| 144 | `imigrantes.js` | Gente de além-mar vem morar em Cinzaluz. |
| 151 | `minijogos-oficios.js` | Cada ofício tem o seu próprio minijogo (nada de repetir a mesma barrinha) |
| 153 | `guarda-e-novos-oficios.js` |  - Novas profissões de prédio (cada uma com o seu minijogo): barbeiro |
| 154 | `moradores/intimidade.js` | A "noite juntos" ganhou uma cena curta e discreta: quarto à luz de vela |
| 156 | `gestos-oficios.js` | Minijogos de GESTO (arrastar, esfregar, girar, traçar), no estilo Cooking Mama |
| 161 | `estabelecimentos-vivos.js` | Os estabelecimentos ganham vida, como num mercado medieval de verdade |
| 162 | `festas-medievais.js` | Os festivais ganham costumes medievais de verdade |
| 166 | `taverna-por-mesas.js` | Menos menu, mais taverna: cada diversão fica num lugar de verdade. |
| 168 | `taverna-andar-de-cima.js` | A taverna ganha um segundo andar (a escada perto da parede da direita) |
| 169 | `banheiro.js` | A casa ganha um banheiro de verdade: porta na parede da direita da sala |
| 171 | `metas-e-familias.js` |  - Metas de vida: objetivos de longo prazo (chegar aos 70, 3 gerações |
