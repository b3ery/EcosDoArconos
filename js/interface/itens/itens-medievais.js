/**
 * ECOS DO ARCANO — itens-medievais.js
 * Troca os nomes de itens e roupas que soavam modernos (ou de comida que não
 * existia na Europa medieval: chocolate, café, batata, milho, goiaba...) por
 * equivalentes medievais. Os ids e efeitos continuam os mesmos.
 */

"use strict";

(() => {
  const ITEM_RENAME = {
    "Aquário": "Tina de Peixes",
    "Broa de Milho": "Broa de Centeio",
    "Broa de Milho com Erva-doce": "Broa de Centeio com Erva-doce",
    "Bolo de Fubá": "Bolo de Farinha de Castanha",
    "Bolo de Fubá Cremoso": "Bolo de Castanha Cremoso",
    "Pão de Queijo": "Bolinho de Queijo Fresco",
    "Pão de Queijo da Serra": "Fogaça de Queijo da Serra",
    Sonho: "Bolinho Frito de Mel",
    "Sonho de Creme": "Bolinho Frito com Nata",
    "Pudim de Leite": "Flã de Leite e Ovos",
    "Pudim de Leite Condensado": "Flã de Mel",
    Quindim: "Doce de Gemas",
    "Cocada Branca": "Doce de Amêndoas",
    "Feijoada do Gus": "Panelada de Favas do Gus",
    "Água com Gás": "Água da Fonte Termal",
    Kefir: "Coalhada",
    "Caldo de Cana": "Água de Mel",
    "Chocolate Quente": "Leite Quente com Especiarias",
    "Chocolate Quente com Canela": "Vinho Quente com Canela",
    "Café do Oriente": "Infusão do Oriente",
    "Café Coado": "Infusão de Cevada Torrada",
    "Café Encantado": "Infusão Encantada",
    Salsicha: "Chouriço",
    "Tilápia": "Carpa do Lago",
    Atum: "Arenque",
    Limonada: "Água de Limão",
    "Limonada com Hortelã": "Água de Limão com Hortelã",
    "Espiga de Milho": "Espiga de Cevada",
    Batata: "Pastinaca",
    "Goiaba": "Nêspera",
    Pitanga: "Groselha Vermelha",
    Jabuticaba: "Ameixa Brava",
    Abajur: "Lamparina de Mesa",
    "Relógio de Parede": "Relógio de Sol",
    "Relógio de Pêndulo": "Ampulheta Grande",
    Bonsai: "Vaso de Ervas",
    "Peixe na Folha de Bananeira": "Peixe na Folha de Parreira",
    "Bacalhau com Batatas": "Bacalhau com Nabos",
    "Ovos Mexidos com Bacon": "Ovos com Toucinho",
    "Milho Cozido na Manteiga": "Favas na Manteiga",
    "Batata-doce na Brasa": "Castanhas na Brasa",
    "Creme de Milho": "Creme de Cevada",
    "Bolo de Chocolate": "Bolo de Nozes",
    "Bolo de Chocolate Amargo": "Bolo de Mel e Especiarias",
    "Bolo Floresta Negra": "Bolo de Cerejas Negras",
    "Torta Holandesa": "Torta de Nata",
    "Rosquinha com Granulado": "Rosca de Açúcar",
    Rosquinha: "Rosca Frita",
    "Chá de Hibisco Gelado": "Chá de Flor de Sabugueiro",
    "Água de Coco": "Água de Rosas",
    "Vela Perfumada de Baunilha": "Vela de Cera de Abelha",
    "Chaveiro de Runa": "Pingente de Runa",
    "Quebra-cabeça de Madeira": "Enigma de Madeira",
    "Guarda-chuva": "Capa de Oleado",
    "Caixinha de Música": "Caixinha de Sinetas",
    "Viola Caipira": "Viela de Roda",
    "Água de Colônia": "Água de Flores",
    "Suco de Uva Integral": "Mosto de Uva",
    "Pastel de Carne Seca": "Pastel de Carne Salgada",
    "Pastelão de Carne": "Empadão de Carne",
    "Suco de Laranja": "Sumo de Laranja",
    "Suco de Uva": "Sumo de Uva",
    "Suco de Maçã": "Sumo de Maçã",
    "Bola de Gude": "Bolinhas de Barro",
    "Bolinhas de Gude": "Bolinhas de Barro",
    "Soldadinho de Chumbo": "Cavaleiro de Madeira",
  };
  const COS_RENAME = {
    "Boné de marinheiro": "Gorro de marinheiro",
    "Capacete de mineiro": "Gorro de mineiro com vela",
    "Pijama listrado": "Camisolão de dormir",
    "Camisa xadrez": "Camisa de lã xadrez",
    "Vestido de bolinhas": "Vestido estampado",
    "Quimono com faixa": "Robe oriental com faixa",
    "Fraque de gala": "Gibão de gala",
    "Sobretudo de inverno": "Capote de inverno",
    "Roupa de verão": "Túnica leve de verão",
    "Macacão de mineiro": "Gibão de mineiro",
    "Óculos redondos": "Lentes de leitura",
    "Mochila de viagem": "Alforje de viagem",
    "Gravata-borboleta": "Laço de fita no pescoço",
    Batom: "Lábios pintados",
    Moicano: "Crista de guerreiro",
    "Rosa chiclete": "Rosa vivo",
    "Chapéu de Festa (prêmio)": "Chapéu de Festa do Mastro (prêmio)",
  };
  const DESC_SWAP = [
    [/chocolate/gi, "mel com especiarias"],
    [/\bcafé\b/gi, "infusão"],
    [/batatas?/gi, "nabos"],
    [/\bmilho\b/gi, "cevada"],
  ];
  if (typeof ITEMS !== "undefined")
    for (const it of Object.values(ITEMS)) {
      if (ITEM_RENAME[it.nome]) it.nome = ITEM_RENAME[it.nome];
      if (typeof it.desc === "string") for (const [re, s] of DESC_SWAP) it.desc = it.desc.replace(re, s);
    }
  if (typeof COSMETICS !== "undefined")
    for (const list of Object.values(COSMETICS)) if (Array.isArray(list)) for (const o of list) if (Array.isArray(o) && COS_RENAME[o[1]]) o[1] = COS_RENAME[o[1]];
})();
