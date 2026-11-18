/**
 * ECOS DO ARCANO — cosmeticos-novos.js
 * Mais 200 itens de estilo para o personagem (alfaiataria, salão, criador e
 * guarda-roupa):
 *   60 cores de roupa · 20 cores de chapéu · 20 cores de cabelo ·
 *   15 cristais de cajado · 25 roupas · 25 chapéus · 25 acessórios · 10 auras.
 * Cada roupa, chapéu e acessório tem desenho próprio.
 * Modifica (envolve) funções de outros arquivos: heroRects, drawAura.
 */

"use strict";

const addCos = (cat, list) => {
  for (const it of list) if (!COSMETICS[cat].some((q) => q[0] === it[0])) COSMETICS[cat].push(it);
};

/* ===================== CORES ===================== */
const ROBE_NEW = [
  ["#a8323a", "Carmim"], ["#c0504a", "Telha"], ["#e0705a", "Coral"], ["#f29a7a", "Salmão"], ["#f2b8a0", "Pêssego"], ["#d9662a", "Laranja queimado"], ["#f28a2a", "Abóbora"], ["#e8b04a", "Mostarda"], ["#f2d23a", "Girassol"], ["#f2e8a0", "Baunilha"],
  ["#c8e070", "Lima"], ["#9ad04a", "Folha nova"], ["#5aa83a", "Grama"], ["#3a7a3a", "Floresta"], ["#2a5a3a", "Musgo"], ["#5a7a5a", "Sálvia"], ["#7ac4a0", "Menta"], ["#3ab0a0", "Turquesa"], ["#2a8a8a", "Petróleo"], ["#1a5a6a", "Mar profundo"],
  ["#7ad0f0", "Céu"], ["#4fa8e0", "Azul claro"], ["#2a6ad9", "Azul real"], ["#1a3a8a", "Marinho"], ["#2a2a5a", "Meia-noite"], ["#6a7ad9", "Pervinca"], ["#8a6ad9", "Lavanda"], ["#6a3ab0", "Violeta"], ["#4a1a6a", "Uva"], ["#9a4aa8", "Ametista"],
  ["#c86ac0", "Orquídea"], ["#e07ab0", "Rosa chiclete"], ["#f2a8c8", "Rosa bebê"], ["#c83a6a", "Framboesa"], ["#8a1a3a", "Vinho"], ["#5a1a2a", "Bordô"], ["#6a4a3a", "Café"], ["#8a6a4a", "Camelo"], ["#b09070", "Areia"], ["#d8c8a8", "Linho"],
  ["#e8e0d0", "Marfim"], ["#f8f4ec", "Neve"], ["#c8c8d0", "Prata"], ["#8a8a96", "Chumbo"], ["#5a5a66", "Grafite"], ["#2a2a30", "Carvão"], ["#3a2a2a", "Ébano"], ["#c9a03a", "Ouro velho"], ["#a87a3a", "Bronze"], ["#b0602a", "Cobre"],
  ["#d0e8f0", "Gelo"], ["#a0d0c0", "Água-marinha"], ["#f0d0e0", "Algodão-doce"], ["#e0c0f0", "Lilás"], ["#f0e0c0", "Creme"], ["#7a8a3a", "Oliva"], ["#4a6a2a", "Pinheiro"], ["#a83a8a", "Magenta"], ["#3a3a7a", "Índigo"], ["#7a2a2a", "Ferrugem"],
];
addCos("robe", ROBE_NEW.map(([c, n], i) => [c, n, 30 + (i % 5) * 15]));
addCos("hatc", [
  ["#a8323a", "Vermelho", 20], ["#f28a2a", "Laranja", 20], ["#f2d23a", "Amarelo", 20], ["#5aa83a", "Verde", 20], ["#2a8a8a", "Turquesa", 25], ["#4fa8e0", "Azul claro", 20], ["#1a3a8a", "Marinho", 25], ["#6a3ab0", "Violeta", 25], ["#e07ab0", "Rosa", 20], ["#8a1a3a", "Vinho", 25],
  ["#6a4a3a", "Marrom", 20], ["#b09070", "Areia", 20], ["#f8f4ec", "Branco", 25], ["#8a8a96", "Cinza", 20], ["#2a2a30", "Preto", 25], ["#c9a03a", "Dourado", 40], ["#c8c8d0", "Prateado", 40], ["#3a7a3a", "Floresta", 25], ["#f2a8c8", "Rosa bebê", 25], ["#7a2a2a", "Ferrugem", 25],
]);
addCos("hair", [
  ["#f2e0a0", "Loiro platinado", 40], ["#e8c070", "Mel", 30], ["#b0602a", "Acobreado", 30], ["#c83a2a", "Ruivo vivo", 40], ["#5a2a1a", "Chocolate", 25], ["#2a1a10", "Café escuro", 25], ["#8a8a8a", "Grisalho", 25], ["#f8f8f8", "Branco", 30], ["#3a4ab0", "Azul", 60], ["#2a8a8a", "Turquesa", 60],
  ["#6ad0a0", "Verde menta", 60], ["#5aa83a", "Verde", 60], ["#9a4aa8", "Roxo", 60], ["#e07ab0", "Rosa", 60], ["#f2a8c8", "Rosa claro", 60], ["#f28a2a", "Laranja", 60], ["#a8323a", "Vermelho", 60], ["#c9a03a", "Dourado", 80], ["#c8d0e0", "Prata", 80], ["#2a2a5a", "Azul-noite", 60],
]);
addCos("staffc", [
  ["#5aff8a", "Cristal esmeralda", 60], ["#c86aff", "Cristal ametista", 60], ["#ff6ad0", "Cristal rosa", 60], ["#f8f8ff", "Cristal diamante", 120], ["#3ae0e0", "Cristal turquesa", 60], ["#ffb03a", "Cristal topázio", 60], ["#8a1a3a", "Cristal granada", 80], ["#a8f0ff", "Cristal de gelo", 80],
  ["#2a2a5a", "Cristal noturno", 90], ["#ffe8a0", "Cristal solar", 90], ["#7ad36b", "Cristal de folha", 60], ["#ff3a3a", "Cristal de brasa", 80], ["#c9a03a", "Âmbar antigo", 70], ["#9aa0b0", "Pedra-da-lua", 70], ["#e0e0ff", "Cristal de nuvem", 70],
]);

/* ===================== ROUPAS (25) ===================== */
const OUT2 = [
  ["listrada", "Túnica listrada", 60], ["xadrez", "Camisa xadrez", 60], ["bolinhas", "Vestido de bolinhas", 70], ["colete", "Colete de couro", 80], ["kimono", "Quimono com faixa", 120],
  ["florido", "Vestido florido", 90], ["uniforme", "Uniforme da guarda", 110], ["bobo", "Roupa de bobo da corte", 100], ["pastor", "Manto de pastor", 50], ["cacador", "Roupa de caçador", 90],
  ["cozinheiro", "Dólmã de cozinheiro", 60], ["dancarina", "Saia de dança", 90], ["monge", "Hábito de monge", 60], ["pirata", "Roupa de pirata", 130], ["noiva", "Vestido de noiva", 300],
  ["fraque", "Fraque de gala", 260], ["inverno", "Sobretudo de inverno", 140], ["praia", "Roupa de verão", 50], ["mineiro", "Macacão de mineiro", 60], ["bardo", "Gibão de bardo", 110],
  ["estrelado", "Manto estrelado", 220], ["folhagem", "Manto de folhas", 160], ["chamas2", "Manto de brasas", 220], ["mare2", "Manto das marés", 220], ["rei", "Manto de arminho", 400],
];
COSMETICS.outfit.push(...OUT2.filter((o) => !COSMETICS.outfit.some((q) => q[0] === o[0])));
function outfit2Rects(o, rb, dk, tr) {
  const sh = "#3a2a1e";
  const legs = [[5, 13, 2, 2, sh], [9, 13, 2, 2, sh]];
  const body = [[4, 9, 8, 4, rb]];
  switch (o) {
    case "listrada": return body.concat([[4, 10, 8, 1, "#f2eee4"], [4, 12, 8, 1, "#f2eee4"]], legs);
    case "xadrez": return body.concat([[4, 9, 2, 2, dk], [8, 9, 2, 2, dk], [6, 11, 2, 2, dk], [10, 11, 2, 2, dk]], legs);
    case "bolinhas": return [[5, 9, 6, 2, rb], [4, 11, 8, 2, rb], [3, 13, 10, 2, rb], [5, 10, 1, 1, "#fff"], [9, 9, 1, 1, "#fff"], [7, 12, 1, 1, "#fff"], [4, 14, 1, 1, "#fff"], [11, 13, 1, 1, "#fff"]];
    case "colete": return [[4, 9, 8, 4, "#e8e0d0"], [4, 9, 3, 4, "#8a5a2e"], [9, 9, 3, 4, "#8a5a2e"], [7, 10, 1, 1, tr]].concat(legs);
    case "kimono": return [[4, 9, 8, 5, rb], [6, 9, 1, 3, "#f2eee4"], [9, 9, 1, 3, "#f2eee4"], [4, 11, 8, 1, tr], [5, 14, 2, 1, sh], [9, 14, 2, 1, sh]];
    case "florido": return [[5, 9, 6, 2, rb], [4, 11, 8, 2, rb], [3, 13, 10, 2, rb], [5, 12, 1, 1, "#ff6b8a"], [9, 11, 1, 1, "#ffd86a"], [7, 13, 1, 1, "#ff6b8a"], [11, 14, 1, 1, "#ffd86a"], [4, 14, 1, 1, "#c88aff"]];
    case "uniforme": return [[4, 9, 8, 4, "#3a4a8a"], [7, 9, 2, 4, "#2a3a6a"], [7, 10, 1, 1, tr], [7, 12, 1, 1, tr], [4, 9, 1, 1, tr], [11, 9, 1, 1, tr]].concat([[5, 13, 2, 2, "#1a1a2a"], [9, 13, 2, 2, "#1a1a2a"]]);
    case "bobo": return [[4, 9, 4, 4, "#d9303a"], [8, 9, 4, 4, "#f2d23a"], [5, 13, 2, 2, "#f2d23a"], [9, 13, 2, 2, "#d9303a"], [7, 9, 2, 1, "#fff"]];
    case "pastor": return [[3, 9, 10, 6, "#c8b080"], [5, 9, 6, 1, "#8a6a4a"], [5, 14, 2, 1, sh], [9, 14, 2, 1, sh]];
    case "cacador": return [[4, 9, 8, 4, "#4a6a3a"], [4, 11, 8, 1, "#6a4428"], [10, 9, 2, 2, "#6a4428"]].concat(legs);
    case "cozinheiro": return [[4, 9, 8, 4, "#f8f8f8"], [7, 9, 1, 1, "#c8c8d0"], [7, 11, 1, 1, "#c8c8d0"], [4, 12, 8, 1, "#e0e0e8"], [5, 13, 2, 2, "#3a3a44"], [9, 13, 2, 2, "#3a3a44"]];
    case "dancarina": return [[5, 9, 6, 2, rb], [3, 11, 10, 1, tr], [2, 12, 12, 2, rb], [3, 14, 10, 1, dk], [6, 9, 4, 1, tr]];
    case "monge": return [[3, 9, 10, 6, "#6a4a2a"], [4, 11, 8, 1, "#c8b080"], [7, 12, 1, 2, "#c8b080"]];
    case "pirata": return [[4, 9, 8, 4, "#f2eee4"], [4, 9, 2, 4, "#2a2a30"], [10, 9, 2, 4, "#2a2a30"], [4, 12, 8, 1, "#a8323a"], [6, 10, 1, 1, tr]].concat([[5, 13, 2, 2, "#1a1a1a"], [9, 13, 2, 2, "#1a1a1a"]]);
    case "noiva": return [[5, 9, 6, 2, "#fbfbf8"], [4, 11, 8, 1, "#fbfbf8"], [3, 12, 10, 2, "#fbfbf8"], [2, 14, 12, 1, "#e8e8f0"], [6, 9, 4, 1, "#e8d8f0"], [7, 11, 2, 1, "#f2a8c8"]];
    case "fraque": return [[4, 9, 8, 4, "#1a1a22"], [7, 9, 2, 3, "#f8f8f8"], [7, 9, 2, 1, "#a8323a"], [3, 12, 2, 3, "#1a1a22"], [11, 12, 2, 3, "#1a1a22"]].concat([[5, 13, 2, 2, "#1a1a1a"], [9, 13, 2, 2, "#1a1a1a"]]);
    case "inverno": return [[3, 9, 10, 6, "#5a3a2a"], [3, 9, 10, 1, "#e8e0d0"], [7, 10, 2, 4, "#4a2a1a"], [3, 14, 10, 1, "#e8e0d0"]];
    case "praia": return [[5, 9, 6, 3, "#f2d23a"], [5, 10, 6, 1, "#f28a2a"], [5, 12, 6, 1, "#4fa8e0"], [5, 13, 2, 2, "#f2c8a0"], [9, 13, 2, 2, "#f2c8a0"]];
    case "mineiro": return [[4, 9, 8, 5, "#3a5a8a"], [5, 9, 1, 2, "#c8b080"], [10, 9, 1, 2, "#c8b080"], [7, 11, 2, 1, "#2a3a5a"]].concat(legs);
    case "bardo": return [[4, 9, 8, 4, "#8a2a6a"], [4, 9, 4, 2, "#f2d23a"], [8, 11, 4, 2, "#f2d23a"], [7, 12, 2, 1, tr]].concat(legs);
    case "estrelado": return [[3, 9, 10, 6, "#1a1a4a"], [4, 10, 1, 1, "#fff8c0"], [9, 11, 1, 1, "#fff8c0"], [6, 13, 1, 1, "#fff8c0"], [11, 13, 1, 1, "#c8c8ff"], [7, 9, 2, 1, tr]];
    case "folhagem": return [[3, 9, 10, 6, "#3a7a3a"], [3, 10, 2, 2, "#5aa83a"], [8, 9, 2, 2, "#5aa83a"], [5, 12, 2, 2, "#7ad36b"], [10, 13, 2, 2, "#5aa83a"]];
    case "chamas2": return [[3, 9, 10, 6, "#6a1a1a"], [3, 13, 10, 2, "#d9662a"], [4, 12, 2, 1, "#ffb03a"], [8, 12, 2, 1, "#ffb03a"], [6, 14, 2, 1, "#ffe066"]];
    case "mare2": return [[3, 9, 10, 6, "#1a4a7a"], [3, 12, 10, 1, "#4fb8ff"], [4, 13, 2, 1, "#a8e8ff"], [8, 13, 3, 1, "#a8e8ff"], [3, 14, 10, 1, "#2a6ad9"]];
    case "rei": return [[3, 9, 10, 6, "#8a1a2a"], [3, 9, 10, 1, "#f8f8f8"], [3, 9, 1, 6, "#f8f8f8"], [12, 9, 1, 6, "#f8f8f8"], [5, 10, 1, 1, "#1a1a1a"], [10, 12, 1, 1, "#1a1a1a"], [7, 10, 2, 2, tr]];
  }
  return null;
}

/* ===================== CHAPÉUS (25) ===================== */
const HATS2 = [
  ["palha", "Chapéu de palha", 30], ["cartola", "Cartola", 120], ["bruxa", "Chapéu de bruxa torto", 90], ["bandana", "Bandana", 25], ["gorro", "Gorro de lã", 35],
  ["pirata", "Chapéu de pirata", 110], ["elmo", "Elmo de cavaleiro", 160], ["cozinheiro", "Chapéu de cozinheiro", 40], ["bobo", "Chapéu de bobo", 70], ["turbante", "Turbante", 60],
  ["laco", "Laço gigante", 40], ["gatinho", "Orelhas de gato", 80], ["chifres", "Chifres", 90], ["aureola", "Auréola", 200], ["marinheiro", "Boné de marinheiro", 50],
  ["mineiro", "Capacete de mineiro", 45], ["louros", "Coroa de louros", 120], ["estrelado", "Chapéu estrelado", 180], ["veu", "Véu de noiva", 150], ["natal", "Gorro de inverno", 40],
  ["cacador", "Chapéu de caçador", 70], ["penacho", "Chapéu com penacho", 130], ["tiara2", "Tiara de estrelas", 140], ["sol", "Chapéu de sol", 45], ["fones", "Orelhas de coelho", 80],
];
addCos("hat", HATS2);
function hat2Rects(h, hc, tr) {
  const d = shade(hc, -0.3);
  switch (h) {
    case "palha": return [[5, 3, 6, 2, "#e8c070"], [2, 5, 12, 1, "#d9b050"], [5, 4, 6, 1, "#a8323a"]];
    case "cartola": return [[5, 0, 6, 5, "#1a1a1a"], [3, 5, 10, 1, "#1a1a1a"], [5, 3, 6, 1, "#a8323a"]];
    case "bruxa": return [[9, 0, 2, 1, hc], [8, 1, 3, 1, hc], [7, 2, 4, 1, hc], [5, 3, 6, 2, hc], [5, 4, 6, 1, tr], [2, 5, 12, 1, d]];
    case "bandana": return [[5, 4, 6, 2, hc], [11, 5, 2, 1, hc], [12, 6, 1, 2, d], [6, 5, 1, 1, "#fff"], [9, 4, 1, 1, "#fff"]];
    case "gorro": return [[5, 2, 6, 4, hc], [5, 5, 6, 1, d], [7, 1, 2, 1, "#f8f8f8"], [5, 3, 6, 1, shade(hc, 0.2)]];
    case "pirata": return [[4, 3, 8, 3, "#1a1a1a"], [3, 4, 1, 1, "#1a1a1a"], [12, 4, 1, 1, "#1a1a1a"], [7, 4, 2, 1, "#f8f8f8"]];
    case "elmo": return [[5, 2, 6, 5, "#a8b0c0"], [5, 6, 6, 1, "#5a5a66"], [7, 1, 2, 1, "#c8d0dc"], [8, 0, 1, 2, "#a8323a"]];
    case "cozinheiro": return [[5, 0, 6, 4, "#f8f8f8"], [4, 1, 1, 2, "#f8f8f8"], [11, 1, 1, 2, "#f8f8f8"], [5, 4, 6, 1, "#e0e0e8"]];
    case "bobo": return [[5, 3, 3, 2, "#d9303a"], [8, 3, 3, 2, "#f2d23a"], [3, 1, 2, 2, "#d9303a"], [11, 1, 2, 2, "#f2d23a"], [3, 0, 1, 1, tr], [12, 0, 1, 1, tr]];
    case "turbante": return [[4, 2, 8, 4, hc], [5, 3, 6, 1, d], [7, 2, 2, 1, tr], [7, 1, 2, 1, "#5fd0ff"]];
    case "laco": return [[3, 3, 3, 3, hc], [10, 3, 3, 3, hc], [6, 4, 4, 2, d]];
    case "gatinho": return [[5, 2, 2, 2, hc], [9, 2, 2, 2, hc], [5, 3, 1, 1, "#f2a8c8"], [10, 3, 1, 1, "#f2a8c8"], [5, 4, 6, 1, hc]];
    case "chifres": return [[4, 2, 1, 3, "#e8e0d0"], [11, 2, 1, 3, "#e8e0d0"], [3, 1, 1, 2, "#e8e0d0"], [12, 1, 1, 2, "#e8e0d0"]];
    case "aureola": return [[5, 0, 6, 1, "#ffe066"], [4, 1, 1, 1, "#ffe066"], [11, 1, 1, 1, "#ffe066"], [5, 2, 6, 1, "#fff3b0"]];
    case "marinheiro": return [[5, 3, 6, 2, "#f8f8f8"], [4, 5, 8, 1, "#1a3a8a"], [7, 3, 2, 1, "#1a3a8a"]];
    case "mineiro": return [[5, 2, 6, 4, "#f2d23a"], [4, 5, 8, 1, "#c9a03a"], [7, 3, 2, 2, "#fff8c0"]];
    case "louros": return [[4, 4, 1, 2, "#5aa83a"], [11, 4, 1, 2, "#5aa83a"], [5, 3, 2, 1, "#5aa83a"], [9, 3, 2, 1, "#5aa83a"], [7, 3, 2, 1, tr]];
    case "estrelado": return [[7, 0, 2, 1, "#1a1a4a"], [6, 1, 4, 2, "#1a1a4a"], [5, 3, 6, 2, "#1a1a4a"], [3, 5, 10, 1, "#2a2a6a"], [7, 1, 1, 1, "#fff8c0"], [9, 3, 1, 1, "#fff8c0"], [5, 4, 1, 1, "#fff8c0"]];
    case "veu": return [[4, 3, 8, 2, "#f8f8f8"], [3, 5, 2, 7, "rgba(255,255,255,.75)"], [11, 5, 2, 7, "rgba(255,255,255,.75)"], [7, 3, 2, 1, "#f2a8c8"]];
    case "natal": return [[5, 3, 6, 2, "#c83a3a"], [9, 1, 2, 2, "#c83a3a"], [11, 2, 1, 1, "#f8f8f8"], [5, 5, 6, 1, "#f8f8f8"]];
    case "cacador": return [[5, 3, 6, 2, "#4a6a3a"], [4, 5, 8, 1, "#3a5a2a"], [10, 2, 1, 3, "#c83a3a"]];
    case "penacho": return [[5, 3, 6, 2, hc], [3, 5, 10, 1, d], [10, 0, 1, 3, "#f8f8f8"], [11, 0, 1, 2, "#e07ab0"], [9, 1, 1, 2, "#f2d23a"]];
    case "tiara2": return [[5, 4, 6, 1, tr], [5, 3, 1, 1, "#fff8c0"], [7, 2, 2, 2, "#fff8c0"], [10, 3, 1, 1, "#fff8c0"]];
    case "sol": return [[5, 3, 6, 2, hc], [1, 5, 14, 1, shade(hc, 0.15)], [5, 4, 6, 1, "#f2eee4"]];
    case "fones": return [[5, 0, 2, 4, "#f8f8f8"], [9, 0, 2, 4, "#f8f8f8"], [6, 1, 1, 2, "#f2a8c8"], [10, 1, 1, 2, "#f2a8c8"], [5, 4, 6, 1, "#f8f8f8"]];
  }
  return null;
}

/* ===================== ACESSÓRIOS (25) ===================== */
const ACC2 = [
  ["cachimbo", "Cachimbo", 40], ["monoculo", "Monóculo", 60], ["mochila", "Mochila de viagem", 50], ["espadacost", "Espada nas costas", 120], ["alaudecost", "Alaúde nas costas", 90],
  ["aljava", "Aljava de flechas", 80], ["asas", "Asas de fada", 200], ["capinha", "Capinha curta", 70], ["lenco", "Lenço no pescoço", 25], ["dentes", "Colar de dentes", 50],
  ["broche", "Broche de rosa", 35], ["mascara", "Máscara de baile", 90], ["rosa", "Rosa na lapela", 20], ["sino", "Sininho no pescoço", 25], ["faixa", "Faixa de rainha da festa", 150],
  ["livro", "Livro debaixo do braço", 30], ["cesta", "Cesta de flores", 35], ["bengala", "Bengala", 40], ["florelha", "Flor atrás da orelha", 20], ["gravata", "Gravata-borboleta", 30],
  ["gargantilha", "Gargantilha de veludo", 45], ["tatuagem", "Tatuagem de runa", 70], ["chave", "Chave no pescoço", 35], ["coroinha", "Mini coroa de lado", 160], ["ave", "Passarinho no ombro", 140],
];
addCos("acc", ACC2);
function acc2Rects(a, dir, tr) {
  const up = dir === "up";
  switch (a) {
    case "cachimbo": return up ? [] : [[9, 8, 3, 1, "#6a4428"], [11, 7, 2, 1, "#3a2414"], [12, 5, 1, 1, "rgba(220,220,220,.7)"]];
    case "monoculo": return up ? [] : [[8, 6, 2, 2, "#c9a03a"], [8, 7, 1, 1, "rgba(200,230,255,.8)"], [10, 8, 1, 3, "#c9a03a"]];
    case "mochila": return up ? [[4, 9, 8, 5, "#8a5a2e"], [5, 10, 6, 1, "#6a4428"]] : [[4, 9, 1, 4, "#6a4428"], [11, 9, 1, 4, "#6a4428"]];
    case "espadacost": return up ? [[7, 3, 2, 11, "#c8d0dc"], [6, 9, 4, 1, "#6a4428"]] : [[11, 4, 1, 3, "#c8d0dc"], [10, 7, 3, 1, "#6a4428"]];
    case "alaudecost": return up ? [[5, 9, 6, 5, "#c9a050"], [7, 5, 2, 4, "#8a5a2e"]] : [[11, 6, 2, 3, "#8a5a2e"]];
    case "aljava": return up ? [[9, 6, 3, 8, "#8a5a2e"], [9, 5, 1, 1, "#f8f8f8"], [11, 5, 1, 1, "#c83a3a"]] : [[3, 6, 1, 1, "#f8f8f8"], [3, 7, 1, 1, "#c83a3a"]];
    case "asas": return [[1, 8, 3, 4, "rgba(200,240,255,.7)"], [12, 8, 3, 4, "rgba(200,240,255,.7)"], [0, 9, 1, 2, "rgba(255,220,255,.7)"], [15, 9, 1, 2, "rgba(255,220,255,.7)"]];
    case "capinha": return up ? [[3, 9, 10, 4, "#a8323a"]] : [[3, 9, 1, 4, "#a8323a"], [12, 9, 1, 4, "#a8323a"], [4, 9, 8, 1, "#a8323a"]];
    case "lenco": return up ? [] : [[5, 9, 6, 1, "#c83a3a"], [7, 10, 2, 2, "#c83a3a"]];
    case "dentes": return up ? [] : [[5, 9, 6, 1, "#6a4428"], [6, 10, 1, 1, "#f2eee4"], [8, 10, 1, 1, "#f2eee4"], [10, 10, 1, 1, "#f2eee4"]];
    case "broche": return up ? [] : [[9, 10, 2, 2, "#e07ab0"], [10, 10, 1, 1, "#c83a6a"]];
    case "mascara": return up ? [] : [[5, 6, 6, 2, "#9a4aa8"], [6, 6, 1, 1, "#1a1a1a"], [9, 6, 1, 1, "#1a1a1a"], [4, 5, 1, 1, tr], [11, 5, 1, 1, tr]];
    case "rosa": return up ? [] : [[5, 10, 2, 2, "#d9303a"], [5, 12, 1, 1, "#3a7a3a"]];
    case "sino": return up ? [] : [[7, 9, 2, 1, "#c83a3a"], [7, 10, 2, 2, tr]];
    case "faixa": return up ? [] : [[4, 9, 1, 1, "#f2a8c8"], [5, 10, 1, 1, "#f2a8c8"], [6, 11, 1, 1, "#f2a8c8"], [7, 12, 1, 1, "#f2a8c8"], [8, 13, 1, 1, "#f2a8c8"], [9, 11, 2, 2, tr]];
    case "livro": return up ? [] : [[2, 10, 3, 4, "#6a2a8a"], [2, 10, 3, 1, tr]];
    case "cesta": return up ? [] : [[1, 11, 4, 3, "#c9a06a"], [1, 10, 1, 1, "#ff6b8a"], [3, 10, 1, 1, "#ffd86a"], [2, 9, 1, 1, "#c88aff"]];
    case "bengala": return up ? [] : [[2, 9, 1, 6, "#3a2414"], [2, 8, 2, 1, tr]];
    case "florelha": return dir === "right" ? [] : [[10, 5, 2, 2, "#ff6b8a"], [11, 6, 1, 1, "#ffd86a"]];
    case "gravata": return up ? [] : [[6, 9, 1, 1, "#a8323a"], [9, 9, 1, 1, "#a8323a"], [7, 9, 2, 1, "#8a1a2a"]];
    case "gargantilha": return up ? [] : [[6, 9, 4, 1, "#2a1a3a"], [7, 9, 2, 1, "#c86aff"]];
    case "tatuagem": return up ? [] : [[3, 11, 1, 1, "#3a4ab0"], [3, 12, 1, 1, "#5a6ad9"]];
    case "chave": return up ? [] : [[7, 9, 2, 1, "#6a4428"], [7, 10, 1, 2, tr], [8, 11, 1, 1, tr]];
    case "coroinha": return [[10, 3, 3, 2, tr], [10, 2, 1, 1, tr], [12, 2, 1, 1, tr], [11, 3, 1, 1, "#d9303a"]];
    case "ave": return [[12, 7, 3, 2, "#4fa8e0"], [14, 7, 1, 1, "#f2d23a"], [12, 9, 1, 1, "#2a4a8a"]];
  }
  return null;
}

/* ===================== DESENHO ===================== */
{
  const known = (list, v) => list.some((x) => x[0] === v);
  const hrBase = heroRects;
  heroRects = function (L, dir, glow, fr) {
    if (!L) return hrBase.apply(this, arguments);
    const isOut = known(OUT2, L.outfit),
      isHat = known(HATS2, L.hat),
      isAcc = known(ACC2, L.acc);
    if (!isOut && !isHat && !isAcc) return hrBase.apply(this, arguments);
    const L2 = { ...L };
    if (isOut) L2.outfit = "tunica";
    if (isHat) L2.hat = "nenhum";
    if (isAcc) L2.acc = "nenhum";
    const r = hrBase.call(this, L2, dir, glow, fr);
    const rb = L.robe || "#3d4fa8",
      tr = "#f2c14e";
    if (isOut) r.push(...(outfit2Rects(L.outfit, rb, shade(rb, -0.35), tr) || []));
    if (isAcc) r.push(...(acc2Rects(L.acc, dir, tr) || []));
    if (isHat) r.push(...(hat2Rects(L.hat, L.hatc || "#2a2f6e", tr) || []));
    return r;
  };
}

/* ===================== AURAS (10) ===================== */
const AURA2 = {
  bolhas: ["Bolhas de sabão", 150, ["#bfe8ff", "#ffffff"]],
  petalas: ["Pétalas de cerejeira", 180, ["#f2a8c8", "#ffffff"]],
  notas: ["Notas musicais", 180, ["#f2c14e", "#c88aff"]],
  vagalumes: ["Vaga-lumes", 200, ["#e8ff7a", "#fff8c0"]],
  neve: ["Floquinhos de neve", 160, ["#ffffff", "#d0f0ff"]],
  raios: ["Faíscas de raio", 220, ["#fff066", "#7ad0ff"]],
  arcoiris: ["Arco-íris", 260, ["#ff6b6b", "#ffd86a", "#7ad36b", "#4fb8ff", "#c88aff"]],
  sombras: ["Sombras dançantes", 220, ["#3a2a5a", "#6a4a9a"]],
  moedas: ["Chuva de moedas", 300, ["#f2c14e", "#ffe8a0"]],
  runas: ["Seis runas", 400, ["#ff7a3d", "#4fb8ff", "#9ff0cf", "#c9a050", "#ffe066", "#9a5ad9"]],
};
addCos("aura", Object.entries(AURA2).map(([k, v]) => [k, v[0], v[1]]));
{
  const daBase = drawAura;
  drawAura = function (cx, cy, t, a, back) {
    const A = AURA2[a];
    if (!A) return daBase.apply(this, arguments);
    const cols = A[2];
    for (let i = 0; i < 8; i++) {
      const an = t * 1.4 + (i * Math.PI) / 4,
        front = Math.sin(an) > 0;
      if (front === back) continue;
      let x = cx + Math.cos(an) * 15,
        y = cy + Math.sin(an) * 5 - 4;
      if (a === "petalas" || a === "neve" || a === "moedas") y = cy - 18 + ((t * 18 + i * 9) % 30);
      if (a === "bolhas" || a === "notas") y = cy + 6 - ((t * 14 + i * 7) % 28);
      ctx.globalAlpha = a === "vagalumes" ? 0.4 + 0.5 * Math.abs(Math.sin(t * 4 + i)) : 0.85;
      ctx.fillStyle = cols[i % cols.length];
      if (a === "bolhas") {
        ctx.strokeStyle = cols[0];
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(x, y, 2.5, 0, 7);
        ctx.stroke();
      } else if (a === "notas") ctx.fillRect(x - 1, y - 3, 2, 4), ctx.fillRect(x, y - 3, 2, 1);
      else if (a === "raios") ctx.fillRect(x - 1, y - 2, 1, 2), ctx.fillRect(x, y, 1, 2);
      else if (a === "moedas") ctx.fillRect(x - 1, y - 1, 3, 2);
      else ctx.fillRect(x - 1, y - 1, 2, 2);
      ctx.globalAlpha = 1;
    }
  };
}

/* ===================== CHARUTO ===================== */
/* Acessório novo, e o Luca, o Lucas Marzocca e o Matheus andam fumando. */
addCos("acc", [["charuto", "Charuto", 60]]);
ACC2.push(["charuto", "Charuto", 60]);
function cigarRects(dir) {
  if (dir === "up") return [[12, 5, 1, 1, "rgba(220,220,220,.55)"]];
  const t = Math.floor(performance.now() / 400) % 3;
  return [
    [9, 8, 3, 1, "#6a4428"],
    [11, 8, 1, 1, "#4a2e18"],
    [12, 8, 1, 1, "#ff7a3d"],
    [12, 6 - t, 1, 1, "rgba(220,220,220,.6)"],
    [13, 4 - t, 1, 1, "rgba(220,220,220,.4)"],
  ];
}
{
  const accBase = acc2Rects;
  acc2Rects = function (a, dir, tr) {
    if (a === "charuto") return cigarRects(dir);
    return accBase.apply(this, arguments);
  };
  const SMOKERS = ["luca", "lucas", "matheus"];
  const keys = new Set(
    SMOKERS.map((id) => typeof CREW_LOOKS !== "undefined" && CREW_LOOKS[id])
      .filter(Boolean)
      .map((c) => `${c.robe}|${c.hat ?? null}|${c.hair}`),
  );
  const wrBase = wizardRects;
  wizardRects = function (robe, hat, hair, glow, dir) {
    const r = wrBase.apply(this, arguments);
    if (keys.has(`${robe}|${hat ?? null}|${hair}`)) r.push(...cigarRects(dir));
    return r;
  };
}
