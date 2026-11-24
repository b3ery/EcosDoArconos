/**
 * ECOS DO ARCANO — gabinete-e-eleicoes.js  (Simulador de Vida)
 * Governar de verdade (para quem está no trono ou na Presidência):
 *  - GABINETE DO REINO com painel: aprovação do povo, receita e despesa do dia.
 *  - IMPOSTOS separados: do campo, do comércio e das estradas/porto (isento,
 *    baixo, médio, alto). Mais imposto, mais ouro... e menos aprovação.
 *  - LEIS que você assina ou revoga: escola obrigatória, lei da higiene,
 *    salário mínimo, toque de recolher, serviço militar, liberdade de imprensa,
 *    liberdade de culto, fim da pena de morte. Cada lei mexe no reino todo dia.
 *  - OBRAS PÚBLICAS que levam dias para ficar prontas: hospital, universidade,
 *    aqueduto, muralha, mercado, quartel, estradas e teatro.
 *  - MINISTROS: nomeie amig(os) para Tesouro, Guerra, Justiça e Relações
 *    Exteriores (quanto mais amizade, mais ajudam).
 *  - DILEMAS: o povo chega com problemas para você decidir.
 * Eleições mais fortes (quando há Conselho/República):
 *  - PROMESSAS de campanha, COMÍCIO por bairro, PORTA A PORTA, PESQUISA de
 *    opinião com barras, DEBATE com perguntas de verdade e a APURAÇÃO numa cena
 *    com os votos subindo.
 * Modifica (envolve) funções de outros arquivos: onNewDay, choice, budgetMenu,
 * campaignMenu, myVotes, electionTick.
 */

"use strict";

(() => {
  const G = () => {
    const g = (player.gov = player.gov || { laws: {}, works: {}, build: [], min: {}, tax: { campo: 1, comercio: 1, estrada: 1 }, appr: 60 });
    g.tax = g.tax || { campo: 1, comercio: 1, estrada: 1 };
    return g;
  };
  const R = () => player.realm;
  const rules = () => typeof playerRules === "function" && playerRules();
  const up = (k, v) => {
    const r = R();
    if (r && r[k] != null) r[k] = Math.max(0, Math.min(100, r[k] + v));
  };
  const LV = ["isento", "baixo", "médio", "alto"];
  const TAX = {
    campo: ["Imposto do campo (camponeses)", 15, 2.2],
    comercio: ["Imposto do comércio (lojas e feira)", 25, 1.6],
    estrada: ["Pedágio das estradas e do porto", 10, 1],
  };
  const LAWS = {
    escola: { n: "Escola obrigatória", d: "Educação +1,5/dia · custa 15 ouro/dia", fx: () => (up("edu", 1.5), -15), ap: 2 },
    higiene: { n: "Lei da higiene (latrinas e esgoto)", d: "Limpeza +2/dia, Saúde +0,5 · custa 20 ouro/dia", fx: () => (up("limp", 2), up("saude", 0.5), -20), ap: 1 },
    salario: { n: "Salário mínimo", d: "Bem-estar +1,5/dia · os comerciantes pagam menos imposto (-15/dia)", fx: () => (up("social", 1.5), -15), ap: 4 },
    toque: { n: "Toque de recolher", d: "Segurança +2/dia · o povo detesta", fx: () => (up("seg", 2), up("social", -1), 0), ap: -5 },
    militar: { n: "Serviço militar obrigatório", d: "+5 soldados por dia · as famílias reclamam", fx: () => ((player.army = (player.army || 0) + 5), up("social", -0.5), 0), ap: -3 },
    imprensa: { n: "Liberdade de imprensa", d: "O jornal critica você, mas o povo confia mais", fx: () => 0, ap: 3, no: "ditadura" },
    culto: { n: "Liberdade de culto", d: "Bem-estar +0,5/dia · os outros reinos gostam", fx: () => (up("social", 0.5), 0), ap: 1 },
    pena: { n: "Fim da pena de morte", d: "Reputação sobe com o tempo · Segurança -0,5/dia", fx: () => (up("seg", -0.5), 0), ap: 2 },
  };
  const WORKS = {
    hospital: { n: "Hospital Real", c: 600, d: 4, fx: () => up("saude", 1.2), info: "Saúde +1,2 por dia, para sempre" },
    universidade: { n: "Universidade de Cinzaluz", c: 800, d: 5, fx: () => up("edu", 1.2), info: "Educação +1,2 por dia" },
    aqueduto: { n: "Aqueduto", c: 500, d: 3, fx: () => (up("agua", 1.5), up("limp", 0.5)), info: "Água +1,5 e Limpeza +0,5 por dia" },
    muralha: { n: "Muralha nova", c: 900, d: 5, fx: () => up("seg", 1), info: "Segurança +1 por dia e o castelo mais difícil de tomar" },
    mercado: { n: "Mercado coberto", c: 700, d: 4, fx: () => 40, info: "+40 ouro por dia de impostos" },
    quartel: { n: "Quartel novo", c: 600, d: 3, fx: () => (player.army = (player.army || 0) + 2), info: "+2 soldados por dia" },
    estradas: { n: "Estradas de pedra", c: 400, d: 3, fx: () => 15, info: "+15 ouro por dia e comércio com os vizinhos" },
    teatro: { n: "Teatro da praça", c: 450, d: 3, fx: () => (up("social", 1), addNeed("fun", 3)), info: "Bem-estar +1 por dia" },
  };
  const MIN = {
    tesouro: ["Tesouro", "coin", "+ouro todo dia"],
    guerra: ["Guerra", "sword", "+soldados e segurança"],
    justica: ["Justiça", "scroll", "+segurança, menos crime"],
    relacoes: ["Relações Exteriores", "flag", "+relação com os outros reinos"],
  };
  const friendsList = () => (typeof bestFriends === "function" ? bestFriends(10) : []).filter((id) => NPCS[id] && !(typeof isDead === "function" && isDead(id)) && !String(id).startsWith("w"));

  /* ===================== O DIA DO GOVERNO ===================== */
  function govDay() {
    if (!rules()) return;
    const g = G(),
      r = R();
    if (!r) return;
    let money = 0,
      ap = 0;
    // impostos
    for (const k in TAX) {
      const lv = g.tax[k] ?? 1;
      money += lv * TAX[k][1];
      ap -= (lv - 1) * TAX[k][2] * 2;
    }
    const avg = (g.tax.campo + g.tax.comercio + g.tax.estrada) / 3;
    player.royalTax = avg >= 2.2 ? "alto" : avg <= 0.8 ? "baixo" : "normal";
    // leis
    for (const k in g.laws) if (g.laws[k] && LAWS[k]) ((money += LAWS[k].fx() || 0), (ap += LAWS[k].ap));
    if (g.laws.pena && Math.random() < 0.2) repAdd(1);
    if (g.laws.culto && typeof worldState === "function") for (const k of Object.keys(KINGDOMS)) if (k !== "aurelia") worldState().rel[pairKey("aurelia", k)] = Math.min(100, (worldState().rel[pairKey("aurelia", k)] ?? 50) + 0.3);
    // obras
    for (const k in g.works) if (g.works[k] && WORKS[k]) money += +WORKS[k].fx() || 0;
    const done = [];
    g.build = (g.build || []).filter((b) => {
      if (player.day >= b.end) return (g.works[b.k] = player.day), done.push(WORKS[b.k].n), false;
      return true;
    });
    // ministros
    for (const k in g.min) {
      const id = g.min[k];
      if (!id || !NPCS[id] || (typeof isDead === "function" && isDead(id))) {
        delete g.min[k];
        continue;
      }
      const f = Math.min(1.5, (friendship(id) || 0) / 60);
      if (k === "tesouro") money += Math.round(30 * f);
      if (k === "guerra") ((player.army = (player.army || 0) + Math.round(2 * f)), up("seg", 0.5 * f));
      if (k === "justica") up("seg", 1.2 * f);
      if (k === "relacoes" && typeof worldState === "function") for (const q of Object.keys(KINGDOMS)) if (q !== "aurelia") worldState().rel[pairKey("aurelia", q)] = Math.min(100, (worldState().rel[pairKey("aurelia", q)] ?? 50) + f);
    }
    player.gold = Math.max(0, player.gold + money);
    // aprovação do povo: o reino, os impostos, as leis e o regime
    const areas = ["limp", "seg", "edu", "saude", "social", "agua"].map((k) => r[k] ?? 60);
    const base = areas.reduce((a, b) => a + b, 0) / areas.length;
    const reg = { ditadura: -12, socialismo: 6, comunismo: 2, capitalismo: -2, democracia: 5 }[player.regime] || 0;
    g.appr = Math.round(Math.max(0, Math.min(100, g.appr * 0.6 + (base + ap + reg) * 0.4)));
    if (g.appr < 30) (repAdd(-1), up("social", -1));
    if (g.appr > 75 && Math.random() < 0.3) repAdd(1);
    g.last = { money, appr: g.appr };
    setTimeout(() => toast(`Gabinete: ${money >= 0 ? "+" : ""}${money} ouro hoje · aprovação do povo ${g.appr}%`, 4200), 12500);
    done.forEach((n, i) => setTimeout(() => (vilaNews(`Inaugurada: ${n}! O povo comemora.`), toast(`Obra pronta: ${n}!`, 4000)), 14000 + i * 2500));
    if (Math.random() < 0.4) setTimeout(dilemma, 16000);
  }
  const ndBase = onNewDay;
  onNewDay = function () {
    const r = ndBase.apply(this, arguments);
    try {
      if (typeof lifeMode === "function" && lifeMode()) govDay();
    } catch (e) {
      console.error(e);
    }
    return r;
  };

  /* ===================== O GABINETE ===================== */
  const bar = (v) => `<span style="display:inline-block;width:80px;height:7px;background:#c9b890;vertical-align:middle"><span style="display:block;height:7px;width:${v * 0.8}px;background:${v < 35 ? "#c94a3a" : v < 60 ? "#c9a050" : "#5a8a3a"}"></span></span>`;
  function cabinet() {
    const g = G();
    const L = g.last || {};
    choice(
      "Gabinete do Reino",
      `<div style="text-align:left;line-height:1.6">Aprovação do povo: ${bar(g.appr)} <b>${g.appr}%</b><br>Saldo de ontem: <b>${L.money != null ? (L.money >= 0 ? "+" : "") + L.money : "?"} ouro</b> · Tesouro: ${player.gold}<br>Leis em vigor: ${Object.keys(g.laws).filter((k) => g.laws[k]).length} · Obras prontas: ${Object.keys(g.works).length}${g.build.length ? ` · em construção: ${g.build.map((b) => WORKS[b.k].n).join(", ")}` : ""}</div>`,
      [
        { t: "Impostos", icon: "coin", fn: taxMenu },
        { t: "Leis e decretos", icon: "scroll", fn: lawMenu },
        { t: "Obras públicas", icon: "house", fn: worksMenu },
        { t: "Ministros", icon: "crown", fn: ministerMenu },
        { t: "Orçamento das áreas (limpeza, guarda, escolas...)", icon: "book", fn: () => (typeof budgetMenu === "function" ? budgetMenu() : null) },
        { t: "Ouvir o povo (audiência pública)", icon: "chat", fn: () => dilemma(true) },
        { t: "Fechar", fn: null },
      ],
    );
  }
  window.cabinetMenu = cabinet;
  function taxMenu() {
    const g = G();
    choice(
      "Impostos",
      "Toque para trocar o nível. Imposto alto enche o tesouro e esvazia a paciência do povo.",
      Object.entries(TAX)
        .map(([k, [n, per]]) => ({ t: `${n}: ${LV[g.tax[k]]} (+${g.tax[k] * per} ouro/dia)`, icon: "coin", fn: () => ((g.tax[k] = (g.tax[k] + 1) % 4), taxMenu()) }))
        .concat([{ t: "Voltar", fn: cabinet }]),
    );
  }
  function lawMenu() {
    const g = G();
    choice(
      "Leis e decretos",
      "Assinar ou revogar. As leis valem a partir de amanhã.",
      Object.entries(LAWS)
        .map(([k, L]) => ({
          t: `${g.laws[k] ? "✓ " : ""}${L.n} · ${L.d}`,
          icon: g.laws[k] ? "scroll" : "flag",
          fn: () => {
            if (!g.laws[k] && L.no === player.regime) return say([["", "Na ditadura? O jornal livre seria o seu fim. Mude o regime primeiro."]], lawMenu);
            g.laws[k] = !g.laws[k];
            vilaNews(`${g.laws[k] ? "Nova lei" : "Lei revogada"}: ${L.n}.`);
            saveGame();
            lawMenu();
          },
        }))
        .concat([{ t: "Voltar", fn: cabinet }]),
    );
  }
  function worksMenu() {
    const g = G();
    const opts = Object.entries(WORKS).map(([k, W]) => {
      const b = g.build.find((q) => q.k === k);
      if (g.works[k]) return { t: `✓ ${W.n} (pronta) · ${W.info}`, icon: "house", fn: worksMenu };
      if (b) return { t: `${W.n}: em obra, fica pronta no dia ${b.end}`, icon: "house", fn: worksMenu };
      return {
        t: `Construir ${W.n} (${W.c} ouro, ${W.d} dias) · ${W.info}`,
        icon: "house",
        fn: () => {
          if (player.gold < W.c) return say([["Tesoureiro", `O tesouro não tem ${W.c} de ouro, Majestade.`]], worksMenu);
          player.gold -= W.c;
          g.build.push({ k, end: player.day + W.d });
          vilaNews(`Começou a obra: ${W.n}. Pedreiros e carroças de pedra pela vila!`);
          saveGame();
          worksMenu();
        },
      };
    });
    choice("Obras públicas", "Obras levam dias. Quando ficam prontas, ajudam o reino para sempre.", opts.concat([{ t: "Voltar", fn: cabinet }]));
  }
  function ministerMenu() {
    const g = G();
    choice(
      "Ministros",
      "Escolha gente de confiança. Quanto maior a amizade, mais o ministro ajuda.",
      Object.entries(MIN)
        .map(([k, [n, ic, d]]) => ({ t: `${n}: ${g.min[k] ? shortName(g.min[k]) : "vago"} · ${d}`, icon: ic, fn: () => pickMinister(k) }))
        .concat([{ t: "Voltar", fn: cabinet }]),
    );
  }
  function pickMinister(k) {
    const g = G();
    const fs = friendsList().filter((id) => !Object.values(g.min).includes(id));
    if (!fs.length) return say([["", "Você ainda não tem amigos de confiança para o cargo. Faça amizades pela vila."]], ministerMenu);
    choice(
      `Ministério: ${MIN[k][0]}`,
      "Quem vai ocupar o cargo?",
      fs
        .slice(0, 6)
        .map((id) => ({ t: `${shortName(id)} (amizade ${friendship(id)})`, icon: "smile", fn: () => ((g.min[k] = id), addFriendship(id, 8), vilaNews(`${shortName(id)} é ${MIN[k][0] === "Guerra" ? "o novo ministro da Guerra" : "ministro(a) " + (k === "relacoes" ? "das Relações Exteriores" : "do " + MIN[k][0])}.`), saveGame(), say([[shortName(id), "Que honra! Não vou te decepcionar."]], ministerMenu)) }))
        .concat(g.min[k] ? [{ t: `Demitir ${shortName(g.min[k])}`, icon: "meh", fn: () => (addFriendship(g.min[k], -10), delete g.min[k], ministerMenu()) }] : [])
        .concat([{ t: "Voltar", fn: ministerMenu }]),
    );
  }

  /* ===================== DILEMAS ===================== */
  const DIL = [
    ["Os padeiros", "O trigo encareceu e o pão vai dobrar de preço. Os padeiros pedem ajuda do tesouro.", [["Subsidiar o trigo (100 ouro)", () => ((player.gold = Math.max(0, player.gold - 100)), up("social", 6), apr(5))], ["Deixar o mercado resolver", () => (up("social", -4), apr(-4))], ["Tabelar o preço do pão", () => (up("social", 3), apr(2), (G().tax.comercio = Math.max(0, G().tax.comercio - 1)))]]],
    ["Peste no bairro pobre", "Uma febre se espalha nas casas do rio. O curandeiro pede quarentena.", [["Pagar médicos e remédios (150 ouro)", () => ((player.gold = Math.max(0, player.gold - 150)), up("saude", 10), apr(6))], ["Fechar o bairro com a guarda", () => (up("saude", 4), up("social", -5), apr(-3))], ["Ignorar", () => (up("saude", -10), apr(-8))]]],
    ["Os nobres", "Os nobres pedem para não pagar imposto do campo. Em troca, prometem apoio na corte.", [["Aceitar (menos golpes, menos ouro)", () => ((G().tax.campo = Math.max(0, G().tax.campo - 1)), (player.palaceGuard = Math.min(5, (player.palaceGuard || 0) + 1)), apr(-3))], ["Recusar: todos pagam igual", () => (apr(4), repAdd(2))]]],
    ["A ponte caiu", "A ponte velha do rio desabou com a chuva. Os carroceiros estão parados.", [["Reconstruir já (120 ouro)", () => ((player.gold = Math.max(0, player.gold - 120)), apr(4))], ["Mandar o povo construir na corveia", () => (up("social", -4), apr(-5))]]],
    ["Os mineiros em greve", "Os mineiros de Pedravale querem salário melhor e menos horas na mina.", [["Atender (salário mínimo)", () => ((G().laws.salario = true), apr(5))], ["Negociar um meio-termo (60 ouro)", () => ((player.gold = Math.max(0, player.gold - 60)), apr(2))], ["Mandar a guarda acabar a greve", () => (up("seg", 3), up("social", -6), apr(-7))]]],
    ["O jornal", "O Arauto de Cinzaluz publicou uma charge zombando de você. A corte está furiosa.", [["Rir junto e deixar quieto", () => (apr(3), repAdd(1))], ["Fechar o jornal", () => ((G().laws.imprensa = false), apr(-6))], ["Dar uma entrevista e explicar", () => apr(2)]]],
    ["Os imigrantes", "Famílias de além-mar chegaram fugindo da fome e pedem para morar em Cinzaluz.", [["Receber e dar trabalho", () => (up("social", 2), apr(1), (player.gold += 30))], ["Receber só quem tem ofício", () => apr(0)], ["Fechar o porto", () => (apr(-2), up("social", -2))]]],
    ["A festa do padroeiro", "O Padre Anselmo pede ouro para a festa do padroeiro. A vila adora a festa.", [["Pagar a festa (80 ouro)", () => ((player.gold = Math.max(0, player.gold - 80)), up("social", 5), addNeed("fun", 15), apr(4))], ["Cada um paga o seu", () => apr(-2)]]],
    ["Os ladrões da estrada", "Bandidos atacam as carroças na estrada do bosque.", [["Mandar 10 soldados caçar os bandidos", () => ((player.army = Math.max(0, (player.army || 0) - 3)), up("seg", 6), apr(3))], ["Oferecer perdão a quem se render", () => (up("seg", 3), apr(1))], ["Aumentar o pedágio para pagar escolta", () => ((G().tax.estrada = Math.min(3, G().tax.estrada + 1)), up("seg", 2), apr(-2))]]],
  ];
  function apr(v) {
    const g = G();
    g.appr = Math.max(0, Math.min(100, g.appr + v));
  }
  function dilemma(asked) {
    if (!rules()) return;
    if (game.mode !== "world" || game.dialog || game.dying || game.war) return asked ? null : setTimeout(dilemma, 6000);
    const [who, txt, opts] = pk(DIL);
    choice(`Audiência: ${who}`, `${txt}<br><small>Aprovação do povo agora: ${G().appr}%</small>`, opts.map(([t, fn]) => ({ t, icon: "scroll", fn: () => (fn(), saveGame(), toast(`Decisão tomada. Aprovação: ${G().appr}%`, 2600)) })));
  }

  /* ----- o gabinete aparece nos menus de quem governa ----- */
  const chBase = choice;
  choice = function (title, text, opts) {
    if (Array.isArray(opts) && rules() && !opts.some((o) => o.t === "Gabinete do Reino (impostos, leis, obras, ministros)") && (/^Governo · /.test(title || "") || / · salão do trono$/.test(title || "") || title === "Política" || (typeof royalTitle === "function" && title === royalTitle())))
      opts = [{ t: "Gabinete do Reino (impostos, leis, obras, ministros)", icon: "crown", fn: cabinet }, ...opts];
    return chBase.call(this, title, text, opts);
  };

  /* ===================== CAMPANHA ELEITORAL ===================== */
  const BAIRROS = {
    centro: ["Centro antigo", ["escola", "saude"]],
    comercio: ["Rua do Comércio", ["impostos", "estradas"]],
    lotes: ["Bairro dos Lotes", ["seguranca", "agua"]],
    campo: ["Fazendas e campo", ["impostos", "pao"]],
    porto: ["Beira-rio e pescadores", ["pao", "saude"]],
  };
  const PROM = {
    escola: "Escola de graça para todas as crianças",
    saude: "Um hospital em cada bairro",
    impostos: "Baixar os impostos",
    estradas: "Estradas de pedra até os outros reinos",
    seguranca: "Mais guarda nas ruas à noite",
    agua: "Poços limpos e água para todos",
    pao: "Pão barato todo dia",
  };
  const C = () => player.council;
  const camp = () => {
    const c = C();
    c.camp = c.camp || {};
    c.camp.dist = c.camp.dist || {};
    c.camp.prom = c.camp.prom || [];
    return c.camp;
  };
  function distScore(k) {
    const cp = camp();
    const want = BAIRROS[k][1];
    return (cp.dist[k] || 0) + cp.prom.filter((p) => want.includes(p)).length * 6;
  }
  function campExtras() {
    const c = C();
    if (!c || player.councilChief || !c.cand) return [];
    const cp = camp();
    return [
      { t: `Promessas de campanha (${cp.prom.length}/3)`, icon: "scroll", fn: promMenu },
      { t: "Comício num bairro (1x por dia)", icon: "flag", fn: rallyMenu },
      { t: "Porta a porta (2 horas)", icon: "door", fn: () => (passTime(2, "Duas horas batendo de porta em porta..."), (cp.pts = (cp.pts || 0) + 2), say([["", pk(["Uma senhora te oferece café e promete o voto.", "Um ferreiro diz que vota em quem baixar o imposto.", "Uma criança pergunta se você é famos" + genderWord("o", "a", "e") + ". Os pais riem e prometem pensar."])]], openCamp)) },
      { t: "Pesquisa de opinião (10 ouro)", icon: "eye", fn: poll },
      ...(cp.realDeb ? [] : [{ t: "Debate na praça (perguntas do povo)", icon: "chat", fn: debate }]),
    ];
  }
  function openCamp() {
    if (typeof campaignMenu === "function") campaignMenu();
  }
  function promMenu() {
    const cp = camp();
    choice(
      "Promessas de campanha",
      "Escolha até 3. Cada bairro quer coisas diferentes (e lembra se você não cumprir).",
      Object.entries(PROM)
        .map(([k, n]) => ({ t: `${cp.prom.includes(k) ? "✓ " : ""}${n}`, icon: "scroll", fn: () => (cp.prom.includes(k) ? (cp.prom = cp.prom.filter((q) => q !== k)) : cp.prom.length < 3 && cp.prom.push(k), promMenu()) }))
        .concat([{ t: "Voltar", fn: openCamp }]),
    );
  }
  function rallyMenu() {
    const cp = camp();
    if (cp.ral2 === player.day) return say([["", "Você já fez comício hoje. A garganta agradece o descanso."]], openCamp);
    choice(
      "Comício em qual bairro?",
      "Cada bairro tem as suas preocupações.",
      Object.entries(BAIRROS)
        .map(([k, [n, want]]) => ({
          t: `${n} · quer: ${want.map((w) => PROM[w].toLowerCase()).join(" e ")}`,
          icon: "flag",
          fn: () => {
            cp.ral2 = player.day;
            const hit = cp.prom.some((p) => want.includes(p));
            cp.dist[k] = (cp.dist[k] || 0) + (hit ? 10 : 4);
            cp.pts = (cp.pts || 0) + (hit ? 4 : 2);
            passTime(2, `Comício no ${n}...`);
            say([["", hit ? `A multidão do ${n} aplaude cada palavra: você prometeu exatamente o que eles queriam!` : `O povo do ${n} escuta educado... mas esperava ouvir outra coisa.`]], openCamp);
          },
        }))
        .concat([{ t: "Voltar", fn: openCamp }]),
    );
  }
  function poll() {
    if (player.gold < 10) return say([["", "Os pesquisadores cobram 10 de ouro."]], openCamp);
    player.gold -= 10;
    const me = typeof myVotes === "function" ? myVotes() : 30;
    const rows = Object.entries(BAIRROS).map(([k, [n]]) => {
      const v = Math.max(3, Math.min(95, Math.round(me + distScore(k) - 8 + (Math.random() * 6 - 3))));
      return `${n}: ${bar(v)} ${v}%`;
    });
    choice("Pesquisa de opinião", `<div style="text-align:left;line-height:1.7">Geral: ${bar(me)} <b>${me}%</b><br>${rows.join("<br>")}</div><small>Margem de erro: 3 pontos (e um pouco de chute).</small>`, [{ t: "Voltar à campanha", fn: openCamp }]);
  }
  const QS = [
    ["Uma padeira", "O que você vai fazer com o preço do pão?", [["Tabelar o preço e ajudar os padeiros", 6], ["O mercado se regula sozinho", -2], ["Plantar mais trigo nas terras do castelo", 4]]],
    ["Um estudante", "E as escolas? Meu irmão não sabe ler.", [["Escola de graça para todas as crianças", 6], ["Quem quiser estudar que pague", -4], ["Bibliotecas abertas à noite", 3]]],
    ["Um comerciante", "Os impostos estão matando a minha loja!", [["Vou baixar o imposto do comércio", 5], ["Imposto alto paga hospital e escola", 1], ["Imposto menor para quem contratar gente da vila", 4]]],
    ["Uma mãe", "As ruas estão perigosas à noite. Vai fazer o quê?", [["Mais guarda e lampiões", 5], ["Toque de recolher para todo mundo", -3], ["Trabalho para os jovens, menos crime", 4]]],
    ["Um velho pescador", "E o rio sujo? Os peixes estão morrendo.", [["Lei da higiene e esgoto longe do rio", 5], ["Isso é coisa de mago, não de governo", -4], ["Multa para quem sujar o rio", 3]]],
  ];
  function debate() {
    const cp = camp();
    cp.realDeb = true;
    const c = C();
    const rival = c && c.chief && c.chief !== "player" ? shortName(c.chief) : "o rival";
    const qs = QS.slice().sort(() => Math.random() - 0.5).slice(0, 3);
    let i = 0,
      score = 0;
    const next = () => {
      if (i >= qs.length) {
        const pts = Math.round(score + (hasTraitSafe("intelectual") ? 4 : 0));
        cp.pts = (cp.pts || 0) + pts;
        return say([[rival, pts >= 10 ? "...Eu não tenho mais nada a dizer." : pts >= 4 ? "Bom debate. Mas o povo sabe quem tem experiência." : "Viram? Nenhuma proposta séria!"], ["", `Fim do debate. ${pts >= 0 ? "+" : ""}${pts} pontos de campanha.`]], openCamp);
      }
      const [who, q, ans] = qs[i++];
      choice(`Debate · pergunta ${i} de ${qs.length}`, `<b>${who}:</b> "${q}"`, ans.sort(() => Math.random() - 0.5).map(([t, v]) => ({ t, icon: "chat", fn: () => ((score += v), say([["", v >= 5 ? "A praça explode em aplausos!" : v >= 3 ? "Muitos concordam com a cabeça." : v >= 0 ? "Alguns aplaudem, outros cochicham." : "Vaias! Alguém joga um tomate."]], next)) })));
    };
    say([["", `A praça está lotada. De um lado, ${rival}. Do outro, você. O povo vai fazer as perguntas.`]], next);
  }
  const hasTraitSafe = (t) => typeof hasTrait === "function" && hasTrait("player", t);
  if (typeof campaignMenu === "function") {
    const cmBase = campaignMenu;
    campaignMenu = function () {
      const ex = campExtras();
      if (!ex.length) return cmBase.apply(this, arguments);
      hookChoice(cmBase, (t, x, o) => [t, x + `<br><small>Promessas: ${camp().prom.map((p) => PROM[p]).join(" · ") || "nenhuma ainda"}</small>`, o.filter((q) => !/^Debate com /.test(q.t)).slice(0, -1).concat(ex, o.slice(-1))]);
    };
  }
  // os bairros contam nos votos
  if (typeof myVotes === "function") {
    const mvBase = myVotes;
    myVotes = function () {
      const v = mvBase.apply(this, arguments);
      if (!C() || !C().camp || !C().camp.dist) return v;
      const ks = Object.keys(BAIRROS);
      const extra = ks.reduce((a, k) => a + distScore(k), 0) / ks.length / 3;
      return Math.max(3, Math.min(97, Math.round(v + extra)));
    };
  }

  /* ----- a apuração: os votos sobem na tela ----- */
  if (typeof electionTick === "function" && typeof runElection === "function") {
    const etBase = electionTick;
    electionTick = function () {
      if (!game.electionNow || game.mode !== "world" || game.dialog || game.dying || !player.council) return etBase.apply(this, arguments);
      game.electionNow = false;
      const rBase = runElection;
      const res = rBase();
      const sc = countScene(res);
      setTimeout(() => {
        const c = game.cine;
        if (c && c.draw === sc) ((c.t0 = -999), endCine());
      }, 8000);
      // depois da contagem, o resultado é anunciado com os mesmos números da cena
      playCine(sc, 6.5, () => {
        game.electionNow = true;
        runElection = () => res;
        try {
          etBase();
        } finally {
          runElection = rBase;
        }
      });
    };
  }
  function countScene(res) {
    const cols = ["#c94a5a", "#3a6ac9", "#e8b84a", "#3a9a5a", "#9a5ac9"];
    return (W, H, t) => {
      ctx.fillStyle = "#2a2230";
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "#4a3a2a";
      ctx.fillRect(0, H * 0.78, W, H * 0.22);
      // urnas
      for (let i = 0; i < 3; i++) {
        const x = W * 0.2 + i * W * 0.3 - 30;
        ctx.fillStyle = "#8a5e32";
        ctx.fillRect(x, H * 0.7, 60, 50);
        ctx.fillStyle = "#2a1a10";
        ctx.fillRect(x + 20, H * 0.7, 20, 4);
        const f = (t * 1.3 + i * 0.4) % 1;
        ctx.fillStyle = "#f4e8d0";
        ctx.fillRect(x + 24, H * 0.7 - 30 + f * 30, 12, 8);
      }
      ctx.textAlign = "center";
      ctx.fillStyle = "#ffe8b0";
      ctx.font = '700 28px "Pixelify Sans", sans-serif';
      ctx.fillText("Apuração dos votos", W / 2, 50);
      const p = Math.min(1, t / 5);
      ctx.font = '600 16px "Pixelify Sans", sans-serif';
      ctx.fillText(`Urnas apuradas: ${Math.round(p * 100)}%`, W / 2, 78);
      const bw = Math.min(520, W * 0.6),
        x0 = W / 2 - bw / 2 + 80;
      res.forEach((c, i) => {
        const y = 110 + i * 46;
        const wob = p < 1 ? Math.sin(t * 3 + i) * 3 * (1 - p) : 0;
        const v = Math.max(0, c.v * p + wob);
        ctx.textAlign = "right";
        ctx.fillStyle = c.id === "player" ? "#ffe08a" : "#fff";
        ctx.fillText(`${c.n}`, x0 - 10, y + 18);
        ctx.fillStyle = "#3a3040";
        ctx.fillRect(x0, y, bw - 80, 26);
        ctx.fillStyle = cols[i % cols.length];
        ctx.fillRect(x0, y, ((bw - 80) * v) / 100, 26);
        ctx.textAlign = "left";
        ctx.fillStyle = "#fff";
        ctx.fillText(`${Math.round(v)}%`, x0 + ((bw - 80) * v) / 100 + 6, y + 18);
      });
    };
  }
})();
