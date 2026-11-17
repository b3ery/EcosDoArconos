/**
 * ECOS DO ARCANO — trabalhos-e-roupas-novos.js (Simulador)
 *  - 12 trabalhos novos: 10 de oficina (Barbeiro, Sineiro, Moleiro,
 *    Açougueiro, Livreiro, Tecelão, Cavalariço, Peixeiro, Ajudante de
 *    Veterinária e Secretário da Guilda) e 2 de ronda (Pregoeiro e Varredor).
 *    Todos sobem de cargo como as outras carreiras.
 *  - 10 roupas novas no guarda-roupa e na loja: avental de camponês, avental
 *    de ferreiro, batina, roupa de marinheiro, pijama listrado, roupa de
 *    ladino, casaco de pele, gibão de nobre, armadura de placas e vestido de baile.
 * Modifica (envolve) funções de outros arquivos: heroRects.
 */

"use strict";

/* ===================== TRABALHOS ===================== */
Object.assign(PROFESSIONS, {
  barbeiro: { n: "Barbeiro", icon: "mirror", kind: "station", sim: true, place: "Salão Tesoura de Ouro", verb: "Cortar o cabelo", unit: "corte", pay: 9, desc: "Corte cabelos e aparar barbas no Salão Tesoura de Ouro. Cliente satisfeito volta." },
  sineiro: { n: "Sineiro", icon: "bell", kind: "station", sim: true, place: "Templo da Luz", verb: "Tocar o sino", unit: "badalada", pay: 6, desc: "Toque o sino do Templo nas horas certas. Trabalho leve, mas ninguém pode atrasar." },
  moleiro: { n: "Moleiro", icon: "pouch", kind: "station", sim: true, place: "Moinho", verb: "Moer o trigo", unit: "saco de farinha", pay: 9, desc: "Moa o trigo no Moinho e encha os sacos de farinha da padaria." },
  acougueiro: { n: "Açougueiro", icon: "meat", kind: "station", sim: true, place: "Açougue do Bento", verb: "Cortar a carne", unit: "peça", pay: 10, desc: "Corte e embrulhe carnes no Açougue do Bento." },
  livreiro: { n: "Livreiro", icon: "book", kind: "station", sim: true, place: "Livraria Pena de Ouro", verb: "Encadernar o livro", unit: "livro", pay: 10, desc: "Encaderne livros na Livraria Pena de Ouro. Mão firme e cola na medida." },
  tecelao: { n: "Tecelão", icon: "cloth", kind: "station", sim: true, place: "Tecidos & Cia", verb: "Tecer o pano", unit: "peça de pano", pay: 9, desc: "Trabalhe no tear da Tecidos & Cia. Cada peça vira roupa na Alfaiataria." },
  cavalarico: { n: "Cavalariço", icon: "horse", kind: "station", sim: true, place: "Estábulo", verb: "Escovar o cavalo", unit: "cavalo", pay: 8, desc: "Escove e alimente os cavalos do Estábulo." },
  peixeiro: { n: "Peixeiro", icon: "fish", kind: "station", sim: true, place: "Peixaria Rio Claro", verb: "Limpar o peixe", unit: "peixe", pay: 8, desc: "Limpe e venda peixe fresco na Peixaria Rio Claro." },
  vetAjudante: { n: "Ajudante de Veterinária", icon: "paw", kind: "station", sim: true, place: "Clínica Veterinária da Júlia", verb: "Cuidar do bicho", unit: "bicho tratado", pay: 11, desc: "Ajude a Júlia Oliveira a cuidar dos bichos na Clínica Veterinária." },
  guildaSec: { n: "Secretário da Guilda", icon: "map", kind: "station", sim: true, place: "Guilda dos Aventureiros", verb: "Organizar os contratos", unit: "contrato", pay: 12, desc: "Organize contratos e mapas na Guilda dos Aventureiros. Bem pago, muito papel." },
  pregoeiro: { n: "Pregoeiro", icon: "scroll", kind: "rounds", sim: true, verb: "Anunciar a notícia", unit: "anúncio", pay: 6, desc: "Leia as notícias do dia em voz alta na porta de cada lugar da vila." },
  varredor: { n: "Varredor de Ruas", icon: "shovel", kind: "rounds", sim: true, verb: "Varrer a calçada", unit: "calçada", pay: 5, desc: "Varra a calçada em frente aos prédios da vila. Simples, honesto e sempre tem vaga." },
});
HIT_VERBS.push("Cortar", "Tocar", "Encadernar", "Tecer", "Escovar", "Limpar", "Cuidar", "Organizar");
Object.assign(CAREER_GICON, {
  barbeiro: gIcon("mirror", "#c9d0e0"),
  sineiro: gIcon("bell", "#d9a441"),
  moleiro: gIcon("pouch", "#e8e0c0"),
  acougueiro: gIcon("meat", "#c94a4a"),
  livreiro: gIcon("book", "#8a5a2e"),
  tecelao: gIcon("cloth", "#3a78b0", "#f2c14e", 1),
  cavalarico: gIcon("boots", "#8a5a2e"),
  peixeiro: gIcon("fish", "#6a9ac8"),
  vetAjudante: gIcon("bone", "#f2eee4"),
  guildaSec: gIcon("map", "#2a5a3a"),
  pregoeiro: gIcon("scroll", "#c9a03a"),
  varredor: gIcon("shovel", "#8a8a96"),
});

/* ===================== ROUPAS ===================== */
const NEW_OUTFITS = [
  ["camponesa", "Avental de camponês", 25],
  ["ferreiroA", "Avental de ferreiro", 60],
  ["batina", "Batina", 80],
  ["marinheiro", "Roupa de marinheiro", 70],
  ["pijama", "Pijama listrado", 30],
  ["ladino", "Roupa de ladino", 120],
  ["pele", "Casaco de pele", 140],
  ["nobre", "Gibão de nobre", 220],
  ["armadura", "Armadura de placas", 260],
  ["baile", "Vestido de baile", 300],
];
for (const o of NEW_OUTFITS) if (!COSMETICS.outfit.some((q) => q[0] === o[0])) COSMETICS.outfit.push(o);
/** Desenho de cada roupa nova (grade 16×16, do pescoço para baixo). */
function outfitRects(o, rb, dk, tr) {
  const shoes = "#3a2a1e";
  switch (o) {
    case "camponesa":
      return [[4, 9, 8, 4, rb], [5, 9, 6, 5, "#ece4d0"], [5, 10, 6, 1, "#c8bea8"], [5, 13, 2, 2, shoes], [9, 13, 2, 2, shoes]];
    case "ferreiroA":
      return [[4, 9, 8, 4, rb], [5, 9, 6, 5, "#6a4428"], [5, 9, 1, 1, "#3a2414"], [10, 9, 1, 1, "#3a2414"], [5, 12, 6, 1, "#4a2e18"], [5, 13, 2, 2, "#2a2a30"], [9, 13, 2, 2, "#2a2a30"]];
    case "batina":
      return [[4, 9, 8, 6, "#1c1a22"], [7, 9, 2, 1, "#f2eee4"], [4, 9, 1, 5, "#121016"], [11, 9, 1, 5, "#121016"], [7, 11, 2, 1, tr]];
    case "marinheiro":
      return [[4, 9, 8, 4, "#f2f2f6"], [4, 9, 8, 1, "#2a4a8a"], [6, 10, 4, 1, "#2a4a8a"], [7, 11, 2, 1, "#c94a4a"], [5, 13, 2, 2, "#2a4a8a"], [9, 13, 2, 2, "#2a4a8a"]];
    case "pijama":
      return [[4, 9, 8, 6, "#d8e4f0"], [4, 10, 8, 1, "#6a8ac8"], [4, 12, 8, 1, "#6a8ac8"], [4, 14, 8, 1, "#6a8ac8"], [7, 9, 2, 1, "#f2f2f6"]];
    case "ladino":
      return [[3, 9, 10, 4, "#24222a"], [5, 9, 6, 4, "#3a3644"], [5, 11, 6, 1, "#5a4a2a"], [9, 11, 1, 1, tr], [5, 13, 2, 2, "#1a1a1e"], [9, 13, 2, 2, "#1a1a1e"]];
    case "pele":
      return [[3, 9, 10, 5, "#8a6a4a"], [3, 9, 10, 1, "#e8e0d0"], [3, 13, 10, 1, "#e8e0d0"], [7, 10, 2, 3, "#6a4a2a"], [5, 14, 2, 1, shoes], [9, 14, 2, 1, shoes]];
    case "nobre":
      return [[4, 9, 8, 4, rb], [6, 9, 4, 2, "#f2eee4"], [5, 11, 6, 1, tr], [4, 9, 1, 3, tr], [11, 9, 1, 3, tr], [5, 13, 2, 2, "#2a2a30"], [9, 13, 2, 2, "#2a2a30"]];
    case "armadura":
      return [[3, 9, 10, 4, "#a8b0c0"], [4, 9, 8, 1, "#d8dee8"], [7, 9, 2, 4, "#8a92a2"], [3, 9, 2, 2, "#c8d0dc"], [11, 9, 2, 2, "#c8d0dc"], [5, 13, 2, 2, "#7a8292"], [9, 13, 2, 2, "#7a8292"], [5, 12, 6, 1, rb]];
    case "baile":
      return [[5, 9, 6, 2, rb], [4, 11, 8, 1, rb], [3, 12, 10, 1, rb], [2, 13, 12, 2, rb], [5, 9, 6, 1, tr], [2, 14, 12, 1, dk], [7, 10, 2, 1, tr], [4, 13, 1, 1, tr], [8, 13, 1, 1, tr], [11, 13, 1, 1, tr]];
  }
  return null;
}
{
  const hrBase = heroRects;
  heroRects = function (L, dir, glow, fr) {
    if (!L || !NEW_OUTFITS.some((o) => o[0] === L.outfit)) return hrBase.apply(this, arguments);
    const base = hrBase.call(this, { ...L, outfit: "tunica" }, dir, glow, fr);
    const rb = L.robe,
      extra = outfitRects(L.outfit, rb, shade(rb, -0.35), "#f2c14e") || [];
    // a roupa nova é desenhada por cima da túnica
    return base.concat(extra);
  };
}
