/**
 * ECOS DO ARCANO — quintais.js
 * O que se faz no quintal das casas do Bairro dos Lotes (veja
 * bairro-dos-lotes.js):
 *  - PORÃO: o alçapão junto da casa. Guarde comida e coisas no porão (fresco
 *    e escuro, a comida não estraga) e pegue de volta quando quiser.
 *  - Latrina, colmeias (mel), galinheiro (ovos), lenha, banco para descansar,
 *    varal, galpão, horta de ervas, poço, forno de pão, pombal e lago com peixe.
 *  - A placa na frente diz de quem é o lote.
 * Construções do quintal não deixam passar por cima.
 * Modifica (envolve) funções de outros arquivos: targetAt, interactAt, walkable.
 */

"use strict";

(() => {
  const SOLID = new Set(["porao", "lenha", "banco", "latrina", "colmeias", "galpao", "galinheiro", "poco", "forno", "pombal", "lago", "pomar", "placa", "chiqueiro"]);
  const ZL = {};
  const zoneLots = (z) => ZL[z] || (ZL[z] = typeof LOTES === "undefined" ? [] : LOTES.lots.filter((L) => L.zid === z));
  const lotAt = (x, y) => {
    if (typeof LOTES === "undefined") return null;
    for (const L of zoneLots(player.zone)) {
      const k = L.b.plan[x + "," + y];
      if (k) return { L, k };
    }
    return null;
  };
  window.yardAt = lotAt;
  const LABEL = {
    porao: "Descer ao porão",
    latrina: "Usar a latrina",
    colmeias: "Colher mel das colmeias",
    galinheiro: "Pegar ovos no galinheiro",
    chiqueiro: "Dar comida ao porco",
    lenha: "Rachar lenha",
    banco: "Sentar no banco do quintal",
    varal: "Estender roupa no varal",
    galpao: "Olhar o galpão de ferramentas",
    ervas: "Colher ervas",
    poco: "Tirar água do poço",
    forno: "Assar pão no forno",
    pombal: "Ver o pombal",
    lago: "Pescar no lago",
    pomar: "Colher fruta",
    placa: null,
  };
  const day = (k, L) => {
    player.yardDay = player.yardDay || {};
    const key = L.b.id + k;
    if (player.yardDay[key] === player.day) return false;
    player.yardDay[key] = player.day;
    return true;
  };
  const tgBase = targetAt;
  targetAt = function (x, y) {
    const r = lotAt(x, y);
    if (r) {
      if (r.k === "placa") return `Placa: ${r.L.fam}${r.L.size === "S" ? " (com o vizinho de cima)" : ""}`;
      if (LABEL[r.k]) return LABEL[r.k];
    }
    return tgBase(x, y);
  };
  const wkBase = walkable;
  walkable = function (z, x, y) {
    if (typeof LOTES !== "undefined") for (const L of zoneLots(z)) if (SOLID.has(L.b.plan[x + "," + y])) return false;
    return wkBase(z, x, y);
  };
  function cellar(L) {
    player.cellar = player.cellar || {};
    const C = (player.cellar[L.b.id] = player.cellar[L.b.id] || {});
    const stored = Object.entries(C).filter(([, n]) => n > 0);
    const mine = Object.keys(player.inv || {}).filter((id) => ITEMS[id] && itemCount(id) > 0 && ITEMS[id].tipo !== "equip");
    const opts = [];
    for (const [id, n] of stored.slice(0, 8)) opts.push({ t: `Pegar ${ITEMS[id].nome} (${n})`, icon: typeof itemIcon === "function" ? null : null, fn: () => ((C[id]--, addItem(id, 1)), cellar(L)) });
    for (const id of mine.slice(0, 8)) opts.push({ t: `Guardar ${ITEMS[id].nome} (você tem ${itemCount(id)})`, fn: () => (removeItem(id, 1), (C[id] = (C[id] || 0) + 1), cellar(L)) });
    opts.push({ t: "Subir", fn: null });
    choice(`Porão · ${L.fam}`, "Uma escadinha de pedra desce para o escuro. Cheira a terra, maçã e vinho velho. Aqui embaixo é fresco: a comida guardada não estraga.", opts);
  }
  const iaBase = interactAt;
  interactAt = function (x, y) {
    const r = lotAt(x, y);
    if (!r || !LABEL[r.k]) return iaBase(x, y);
    const { L, k } = r;
    const need = (n, v) => typeof addNeed === "function" && lifeMode() && addNeed(n, v);
    switch (k) {
      case "porao":
        return cellar(L);
      case "latrina":
        need("hygiene", -2);
        return say([["", "Uma tábua com um buraco e uma porta que não fecha direito. Pelo menos tem vista para as colmeias."]]);
      case "colmeias":
        if (!day(k, L)) return toast("As abelhas já deram o mel de hoje.", 2000);
        if (Math.random() < 0.3) ((player.hp = Math.max(1, player.hp - 2)), toast("Ai! Uma abelha te picou.", 2200));
        addItem("mel", 1);
        return toast("Você tira um favo de mel dourado. (+1 Mel)", 2600);
      case "galinheiro":
        if (!day(k, L)) return toast("As galinhas ainda não botaram de novo.", 2000);
        player.gold += 3;
        return toast("Três ovos ainda quentes! A dona do lote te paga 3 de ouro por recolher.", 2800);
      case "chiqueiro":
        need("fun", 3);
        return toast("O porco come a lavagem fazendo um barulho enorme.", 2200);
      case "lenha":
        if (!day(k, L)) return toast("Já rachou lenha hoje. Seu braço agradece.", 2000);
        need("energy", -6);
        player.gold += 4;
        return toast("Toc! Toc! Uma pilha de lenha rachada. (+4 ouro)", 2400);
      case "banco":
        need("energy", 6);
        need("fun", 4);
        return toast("Você senta um pouco no banco do quintal e ouve as abelhas.", 2400);
      case "varal":
        need("hygiene", 4);
        return toast("Roupa estendida no sol. Cheirinho de limpo.", 2200);
      case "galpao":
        return say([["", "Enxada, ancinho, um machado cego, sacos de grão e um gato dormindo em cima de tudo."]]);
      case "ervas":
        if (!day(k, L)) return toast("As ervas precisam crescer de novo.", 2000);
        if (ITEMS.erva) addItem("erva", 1);
        return toast("Um maço de alecrim e sálvia, cheirosos.", 2200);
      case "poco":
        player.water = 100;
        return toast("Água fresca do poço da mansão.", 2000);
      case "forno":
        if (!day(k, L)) return toast("O forno ainda está esfriando da última fornada.", 2000);
        if (ITEMS.pao) addItem("pao", 1);
        return toast("Um pão redondo, com casca estalando. (+1 Pão)", 2600);
      case "pombal":
        return toast("Os pombos arrulham. Dizem que a mansão manda recados por eles.", 2400);
      case "lago":
        if (!day(k, L)) return toast("Os peixes se esconderam. Volte amanhã.", 2000);
        if (ITEMS.peixe) addItem("peixe", 1);
        return toast("Você pesca uma carpa gorda no lago da mansão!", 2600);
      case "pomar":
        if (!day(k + x + "," + y, L)) return toast("Já colheu as frutas daqui hoje.", 2000);
        if (ITEMS.maca) addItem("maca", 1);
        return toast("Uma maçã vermelha e doce.", 2200);
    }
    return iaBase(x, y);
  };
})();
