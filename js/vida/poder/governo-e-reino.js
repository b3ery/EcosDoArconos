/**
 * ECOS DO ARCANO — governo-e-reino.js  (Simulador de Vida)
 * Governar custa, e não governar também.
 *  - ESTADO DO REINO de Aurélia: Limpeza, Segurança, Educação, Saúde e Bem-estar
 *    social (0 a 100). Quem governa (Coroa, Presidente ou Ditador) decide o
 *    ORÇAMENTO de cada área todo dia. Sem investimento, tudo piora:
 *      lixo e sujeira nas ruas, mais roubos, crianças aprendendo menos, mais
 *      doença e problemas sociais (mendigos, protestos). Imposto alto piora o
 *      bem-estar. Quando outra pessoa governa, ela investe do jeito dela.
 *  - FERIADOS no calendário (ano de 30 dias): Ano Novo, Dia da Coroa, Dia dos
 *    Finados, Dia do Trabalho e Dia da Fundação. O governante pode decretar
 *    feriado extra (o povo ama, o tesouro chora).
 *  - DIPLOMACIA: os outros reinos de Valdária olham o que você faz. Guerra,
 *    imposto alto, ditadura, colônias e reino sujo derrubam a relação; quem
 *    anda com relação baixa não faz negócio: as lojas de lá recusam vender e a
 *    estrada fica mais cara. Acordos comerciais rendem ouro todo dia.
 *  - REALEZA: convites para bailes, casamentos e festas de outros reinos
 *    (vá até lá a tempo!). E a Rainha pode impor um CASAMENTO ARRANJADO para
 *    manter a política: aceitar, recusar (com consequências) ou fugir.
 *  - QUALQUER PESSOA pode se candidatar: começar um movimento pela república,
 *    vencer a eleição e escolher o regime (democracia, comunismo, monarquia
 *    constitucional ou ditadura, com tudo de ruim que a ditadura traz).
 * Modifica (envolve) funções de outros arquivos: onNewDay, crewDrawList,
 * choice, openShop, regimeName, isCommunist, electionTick, journey.
 */

"use strict";

(() => {
  const AREAS = [
    ["limp", "Limpeza", "soap"],
    ["seg", "Segurança", "sword"],
    ["edu", "Educação", "book"],
    ["saude", "Saúde", "potion"],
    ["social", "Bem-estar social", "heart"],
    ["agua", "Poços e água limpa", "water"],
  ];
  const COST = [0, 25, 60]; // ouro por dia: nada, normal, alto
  const R = () => {
    player.realm = player.realm || { limp: 60, seg: 60, edu: 60, saude: 60, social: 60, agua: 60, bud: { limp: 1, seg: 1, edu: 1, saude: 1, social: 1, agua: 1 }, trade: {}, hol: [] };
    // reinos de saves antigos ganham os poços
    if (player.realm.agua == null) ((player.realm.agua = 60), (player.realm.bud.agua = 1));
    return player.realm;
  };
  const ruling = () => lifeMode() && ((typeof isMonarch === "function" && isMonarch()) || (typeof rulesK === "function" && rulesK("aurelia")) || (player.council && player.council.chief === "player"));
  window.playerRules = ruling;
  const title = () => (player.regime === "ditadura" ? "Ditador" + genderWord("", "a", "e") : player.council && player.council.chief === "player" ? "Presidente" : typeof royalTitle === "function" ? royalTitle() : "Coroa");
  const bar = (v) => `<span style="display:inline-block;width:90px;height:8px;background:#c9b890;vertical-align:middle"><span style="display:block;height:8px;width:${v * 0.9}px;background:${v < 35 ? "#c94a3a" : v < 60 ? "#c9a050" : "#5a8a3a"}"></span></span> ${Math.round(v)}`;

  /* ===================== O DIA DO REINO ===================== */
  function realmDay() {
    const r = R();
    const me = ruling();
    // quem não é você governa do seu jeito (às vezes mal)
    if (!me) for (const [k] of AREAS) r.bud[k] = Math.random() < 0.2 ? 0 : Math.random() < 0.15 ? 2 : 1;
    let spent = 0;
    for (const [k] of AREAS) {
      const b = r.bud[k];
      if (me) spent += COST[b];
      r[k] = Math.max(0, Math.min(100, r[k] + (b - 1) * 5 - 1.5 + (Math.random() - 0.5) * 2));
    }
    const tax = player.royalTax || "normal";
    if (tax === "alto") r.social = Math.max(0, r.social - 3);
    if (tax === "baixo") r.social = Math.min(100, r.social + 1);
    if (player.regime === "ditadura") ((r.social = Math.max(0, r.social - 2)), (r.seg = Math.min(100, r.seg + 2)));
    if (me && spent) {
      player.gold = Math.max(0, player.gold - spent);
      setTimeout(() => toast(`Tesouro: -${spent} ouro investidos no reino (limpeza, guarda, escolas, saúde, social).`, 3800), 6500);
    }
    // as consequências
    const ev = [];
    if (r.seg < 40 && Math.random() < (40 - r.seg) / 60 && player.gold > 20) {
      const lost = Math.min(80, Math.round(player.gold * (0.05 + Math.random() * 0.1)));
      player.gold -= lost;
      ev.push(`Um batedor de carteira levou ${lost} de ouro da sua bolsa! (Segurança baixa)`);
    }
    if (r.saude < 35 && Math.random() < 0.25 && typeof getSick === "function") setTimeout(() => getSick(pk(["gripe", "febre", "disenteria"])), 8000);
    if (r.limp < 30 && Math.random() < 0.2 && typeof getSick === "function") setTimeout(() => getSick("disenteria"), 9000);
    if (r.edu < 40) for (const k of player.kids || []) if (k.school && !k.grad) k.study = Math.max(0, (k.study || 0) - 5);
    if (r.social < 30) {
      ev.push("Fome e desemprego: mendigos na praça e gente revoltada nas esquinas.");
      if (me && typeof repAdd === "function") repAdd(-2);
      if (me && Math.random() < 0.15) ev.push(`PROTESTO! O povo cerca o castelo gritando contra ${player.name}.`);
    }
    if (me && Object.values(r).filter((v) => typeof v === "number").every((v) => v >= 70) && typeof repAdd === "function") (repAdd(2), ev.push("O povo elogia o governo: ruas limpas, escolas cheias, ninguém passa fome."));
    ev.forEach((m, i) => setTimeout(() => toast(m, 5000), 7500 + i * 2600));
    if (typeof vilaNews === "function" && (r.limp < 35 || r.seg < 35)) vilaNews(r.limp < 35 ? "Lixo se acumula nas ruas de Cinzaluz. Ratos já são vistos na feira." : "Onda de roubos assusta Cinzaluz. A guarda não dá conta.");
    // diplomacia: o mundo reage
    if (typeof worldState === "function") {
      const w = worldState();
      let d = 0;
      if (tax === "alto") d -= 1;
      if (player.regime === "ditadura") d -= 2;
      if (r.social < 30) d -= 1;
      if (player.sea && Object.keys(player.sea.col || {}).length) d -= 1;
      if (Object.values(r).filter((v) => typeof v === "number").every((v) => v >= 65)) d += 1;
      for (const [a, b] of KINGDOM_PAIRS) if (a === "aurelia" || b === "aurelia") w.rel[pairKey(a, b)] = Math.max(0, Math.min(100, w.rel[pairKey(a, b)] + d));
      // acordos comerciais rendem
      let inc = 0;
      for (const k of Object.keys(r.trade)) if (relWith(k) >= 30) inc += 30;
      else delete r.trade[k];
      if (inc) ((player.gold += inc), setTimeout(() => toast(`Acordos comerciais: +${inc} ouro.`, 3200), 11000));
    }
    holidayCheck();
    royalMail();
  }
  const relWith = (k) => (typeof worldState === "function" && k !== "aurelia" ? worldState().rel[pairKey("aurelia", k)] ?? 50 : 100);
  window.relWithAurelia = relWith;

  /* ===================== ORÇAMENTO (quem governa) ===================== */
  function budgetMenu() {
    const r = R();
    const opts = AREAS.map(([k, n, ic]) => ({
      t: `${n}: ${["nada", "normal", "alto"][r.bud[k]]} (${COST[r.bud[k]]} ouro/dia) · trocar`,
      icon: ic,
      fn: () => ((r.bud[k] = (r.bud[k] + 1) % 3), budgetMenu()),
    }));
    opts.push({ t: "Decretar feriado amanhã (150 ouro · o povo ama)", icon: "flag", fn: () => (player.gold < 150 ? toast("O tesouro não tem 150 de ouro.", 2000) : ((player.gold -= 150), R().hol.push(player.day + 1), (r.social = Math.min(100, r.social + 6)), toast("Decreto: amanhã é feriado no reino!", 3000), budgetMenu())) });
    opts.push({ t: "Acordos comerciais com os outros reinos", icon: "scroll", fn: tradeMenu });
    if (player.council && player.council.chief === "player") opts.push({ t: `Regime: ${typeof regimeName === "function" ? regimeName() : "?"} · mudar`, icon: "crown", fn: regimeMenu });
    opts.push({ t: "Voltar", fn: null });
    choice(`Governo · ${title()}`, `<div style="text-align:left;line-height:1.6">${AREAS.map(([k, n]) => `${n}: ${bar(r[k])}`).join("<br>")}</div><small>Sem investimento as áreas caem todo dia. Imposto: ${player.royalTax || "normal"}.</small>`, opts);
  }
  function tradeMenu() {
    const r = R();
    const ks = ["mares", "serra", "solmar", "rosalva"].filter((k) => KINGDOMS[k]);
    const opts = ks.map((k) => {
      const rel = relWith(k);
      if (r.trade[k]) return { t: `${KINGDOMS[k].short}: acordo ativo (+30/dia) · relação ${rel}`, icon: "coin", fn: tradeMenu };
      return { t: `${KINGDOMS[k].short}: propor acordo comercial (100 ouro) · relação ${rel}`, icon: "scroll", fn: () => (rel < 45 ? say([[KINGDOMS[k].ruler, `Fazer negócio com ${KINGDOMS.aurelia.short}? Depois de tudo o que vocês fizeram? Não.`]], tradeMenu) : player.gold < 100 ? toast("Precisa de 100 de ouro.", 1800) : ((player.gold -= 100), (r.trade[k] = player.day), say([[KINGDOMS[k].ruler, "Que as carroças de mercadoria nunca parem entre nós."]], tradeMenu))) };
    });
    choice("Acordos comerciais", "Reino com relação abaixo de 45 não assina. Abaixo de 30, o acordo é rompido e as lojas de lá param de vender para você.", opts.concat([{ t: "Voltar", fn: budgetMenu }]));
  }

  /* ===================== LOJAS QUE RECUSAM NEGÓCIO ===================== */
  if (typeof openShop === "function") {
    const osBase = openShop;
    openShop = function () {
      const k = typeof kingdomOf === "function" ? kingdomOf(player.zone) : "aurelia";
      if (lifeMode() && KINGDOMS[k] && !KINGDOMS[k].far && k !== "aurelia" && relWith(k) < 25 && (ruling() || (player.rep ?? 50) < 30))
        return say([["Comerciante", pk([`Gente de ${KINGDOMS.aurelia.short} aqui não compra nada. Ordem de ${KINGDOMS[k].ruler}.`, "Não faço negócio com quem o seu reino trata como trata. Pode ir embora."])]]);
      return osBase.apply(this, arguments);
    };
  }

  /* ===================== FERIADOS ===================== */
  const HOL = { 1: ["Ano Novo", "Fogos na praça e o primeiro pão do ano é de graça."], 8: ["Dia da Coroa", "Desfile da guarda e bandeiras no castelo."], 15: ["Dia dos Finados", "Flores no cemitério e velas acesas no Alto do Descanso."], 22: ["Dia do Trabalho", "Ninguém trabalha: piquenique na praça."], 28: ["Dia da Fundação de Cinzaluz", "Teatro de rua contando a história de Aurion."] };
  const yd = () => (typeof yearDay === "function" ? yearDay() : ((player.day - 1) % 30) + 1);
  function holidayToday() {
    if (HOL[yd()]) return HOL[yd()];
    if ((R().hol || []).includes(player.day)) return ["Feriado decretado", "O governo decretou folga para todos."];
    return null;
  }
  window.holidayToday = holidayToday;
  function holidayCheck() {
    const h = holidayToday();
    if (!h) return;
    if (typeof needAdd === "function") needAdd("fun", 20);
    R().social = Math.min(100, R().social + 3);
    setTimeout(() => toast(`Feriado: ${h[0]}! ${h[1]}`, 5200), 2500);
  }

  /* ===================== CORREIO REAL: CONVITES E CASAMENTO ARRANJADO ===================== */
  const royal = () => lifeMode() && ((typeof isRoyalBorn === "function" && isRoyalBorn()) || ruling());
  const EVENTS = [
    ["baile", "um baile de máscaras", "Baile de Máscaras"],
    ["casamento", "o casamento real", "Casamento Real"],
    ["festa", "a festa da colheita do palácio", "Festa do Palácio"],
  ];
  function royalMail() {
    if (!royal() || player.invite || Math.random() > 0.3) return;
    const ks = ["mares", "serra", "solmar", "rosalva"].filter((k) => KINGDOMS[k] && relWith(k) >= 25);
    if (!ks.length) return;
    const k = pk(ks),
      E = pk(EVENTS);
    const days = typeof travelDays === "function" ? travelDays("vila", KINGDOMS[k].zone) : 3;
    const when = player.day + days + 2;
    setTimeout(
      () =>
        choice(`Convite real de ${KINGDOMS[k].short}`, `"${KINGDOMS[k].ruler} tem a honra de convidar ${typeof alteza === "function" && isRoyalBorn() ? alteza() : player.name} para ${E[1]}, no dia ${when}." A viagem leva ${days} dias.`, [
          { t: "Aceitar (ir até lá a tempo)", icon: "heart", fn: () => ((player.invite = { k, day: when, kind: E[0], n: E[2] }), toast(`Anotado: ${E[2]} em ${KINGDOMS[k].short}, dia ${when}. Pegue a carruagem!`, 4500)) },
          { t: "Recusar com uma carta educada", icon: "scroll", fn: () => (bumpRel(k, -3), toast(`${KINGDOMS[k].short} ficou um pouco ofendido.`, 3000)) },
        ]),
      9000,
    );
  }
  function bumpRel(k, d) {
    if (typeof worldState !== "function" || k === "aurelia") return;
    const w = worldState();
    w.rel[pairKey("aurelia", k)] = Math.max(0, Math.min(100, (w.rel[pairKey("aurelia", k)] ?? 50) + d));
  }
  // chegou no reino do convite no dia certo: a festa acontece
  const ezBase = enterZone;
  enterZone = function () {
    const r = ezBase.apply(this, arguments);
    const I = player.invite;
    if (I && lifeMode()) {
      if (player.day > I.day) ((player.invite = null), bumpRel(I.k, -5), setTimeout(() => toast(`Você perdeu ${I.n} em ${KINGDOMS[I.k].short}. Acharam uma desfeita.`, 4500), 1500));
      else if (kingdomOf(player.zone) === I.k) setTimeout(() => attend(I), 1200);
    }
    return r;
  };
  function attend(I) {
    player.invite = null;
    playCine(ballScene(I), 6, () => {
      bumpRel(I.k, 10);
      if (typeof repAdd === "function") repAdd(3);
      if (typeof needAdd === "function") needAdd("fun", 40);
      say([["", `${I.n} no palácio de ${KINGDOMS[I.k].short}: música, banquete e nobres de todos os reinos. Você dança até os pés doerem.`], [KINGDOMS[I.k].ruler, "Que honra ter você aqui. Nossos reinos ficam mais perto a cada festa."]]);
    });
  }
  function ballScene(I) {
    return (W, H, t) => {
      ctx.fillStyle = "#2a1a2a";
      ctx.fillRect(0, 0, W, H);
      // salão: piso xadrez, colunas e lustres
      const fy = H * 0.62;
      for (let y = fy; y < H; y += 20) for (let x = 0; x < W; x += 20) ((ctx.fillStyle = ((x + y) / 20) % 2 ? "#e8dcc0" : "#5a3a2a"), ctx.fillRect(x, y, 20, 20));
      for (const cx of [W * 0.15, W * 0.85]) ((ctx.fillStyle = "#c9b8a0"), ctx.fillRect(cx - 14, 60, 28, fy - 60), (ctx.fillStyle = "#e8dcc0"), ctx.fillRect(cx - 18, 54, 36, 10));
      for (const lx of [W * 0.35, W * 0.65]) {
        ctx.fillStyle = "#c9a040";
        ctx.fillRect(lx - 1, 0, 2, 50);
        ctx.fillRect(lx - 30, 50, 60, 6);
        for (let i = 0; i < 5; i++) ((ctx.fillStyle = "#ffe08a"), ctx.fillRect(lx - 28 + i * 13, 42 + Math.sin(t * 8 + i), 3, 8));
      }
      // casais dançando, de pé no piso
      for (let i = 0; i < 6; i++) {
        const a = t * 1.2 + (i * Math.PI) / 3;
        const x = W / 2 + Math.cos(a) * 200,
          y = fy - 60 + Math.sin(a) * 30;
        drawSprite(wizardRects(["#7a2a4a", "#2a4a7a", "#4a7a3a", "#c9a040", "#5a3a8a", "#8a3a2a"][i], null, "#3a2414", null, Math.cos(a) > 0 ? "left" : "right", 0), x, y, 3, Math.cos(a) > 0);
      }
      drawSprite(heroRects(player.look, "down", null), W / 2 - 24, fy - 66, 3, false);
      ctx.textAlign = "center";
      ctx.font = '700 26px "Pixelify Sans", sans-serif';
      ctx.fillStyle = "#ffe8b0";
      ctx.fillText(`${I.n} · ${KINGDOMS[I.k].short}`, W / 2, 40);
    };
  }
  // A Rainha impõe um casamento arranjado para manter a política
  const SUITORS = [
    ["rosalva", (g) => (g === "f" ? "Príncipe Valério de Rosalva" : "Princesa Valéria de Rosalva")],
    ["solmar", (g) => (g === "f" ? "Príncipe Marino de Solmar" : "Princesa Marina de Solmar")],
    ["mares", (g) => (g === "f" ? "Príncipe Coral das Marés" : "Princesa Coral das Marés")],
  ];
  function arrangedCheck() {
    if (!lifeMode() || !(typeof isRoyalBorn === "function" && isRoyalBorn()) || player.spouse || player.consort || (player.arranged && player.arranged.done)) return;
    const A = (player.arranged = player.arranged || { refused: 0 });
    if (player.day < 6 || (A.next && player.day < A.next) || Math.random() > 0.35) return;
    A.next = player.day + 8;
    const [k, nm] = pk(SUITORS);
    const n = nm(player.gender);
    const love = player.dating && NPCS[player.dating] ? shortName(player.dating) : null;
    setTimeout(
      () =>
        say([["Rainha Aurélia", `${typeof alteza === "function" ? alteza() : player.name}, sente-se. ${KINGDOMS[k].short} anda inquieto e eu preciso da aliança. Você vai se casar com ${n}.`], ["Rainha Aurélia", "Não é um pedido. É política."]], () =>
          choice("Casamento arranjado", `A Rainha quer você casad${genderWord("o", "a", "e")} com ${n} para manter a paz com ${KINGDOMS[k].short}.${love ? ` E o seu coração é de ${love}...` : ""}`, [
            {
              t: "Aceitar pelo reino",
              icon: "ring",
              fn: () => {
                A.done = true;
                if (player.dating) player.dating = null;
                player.consort = n;
                bumpRel(k, 25);
                if (typeof repAdd === "function") repAdd(4);
                if (typeof vilaNews === "function") vilaNews(`Casamento real! ${player.name} e ${n} se casaram para unir ${KINGDOMS.aurelia.short} e ${KINGDOMS[k].short}.`);
                saveGame();
                say([["", `Os sinos tocam. ${n} chega com uma comitiva enorme e um sorriso educado.`], [n, "Não escolhemos isso. Mas podemos escolher ser gentis um com o outro."]]);
              },
            },
            {
              t: "Recusar",
              icon: "door",
              fn: () => {
                A.refused++;
                bumpRel(k, -15);
                if (typeof addFriendship === "function") addFriendship("rainha", -20);
                if (A.refused >= 2) {
                  player.royalBirth = false;
                  player.titleWord = null;
                  A.done = true;
                  return say([["Rainha Aurélia", "Duas vezes você envergonha a coroa. Saia do castelo. A partir de hoje, você não é mais d" + genderWord("o", "a", "e") + " realeza."]]);
                }
                say([["Rainha Aurélia", "Você vai se arrepender disso. A próxima proposta eu não pergunto."]]);
              },
            },
            ...(love
              ? [
                  {
                    t: `Fugir com ${love}`,
                    icon: "heart",
                    fn: () => {
                      A.done = true;
                      player.royalBirth = false;
                      player.titleWord = null;
                      bumpRel(k, -20);
                      if (typeof addFriendship === "function") (addFriendship(player.dating, 15), addFriendship("rainha", -40));
                      if (typeof vilaNews === "function") vilaNews(`Escândalo! Herdeir${genderWord("o", "a", "e")} da coroa foge com ${love} na véspera do casamento arranjado.`);
                      say([["", `De madrugada, você e ${love} saem pela porta dos fundos do castelo, com uma trouxa de roupa e muito medo.`], [love, "Ninguém manda no que a gente sente."], ["", "Você não é mais d" + genderWord("o", "a", "e") + " realeza. Mas é livre."]]);
                    },
                  },
                ]
              : []),
          ]),
        ),
      12000,
    );
  }

  /* ===================== CANDIDATURA E REGIME (qualquer pessoa) ===================== */
  function politicsMenu() {
    const C = player.council;
    const opts = [];
    if (!C) opts.push({ t: "Começar um movimento pela república (100 ouro, precisa de reputação 55)", icon: "flag", fn: movement });
    else if (C.chief !== "player" && typeof campaignMenu === "function") opts.push({ t: "Campanha: candidatar-se e fazer comícios", icon: "scroll", fn: campaignMenu });
    if (ruling()) opts.push({ t: "Governar: orçamento, feriados e acordos", icon: "crown", fn: budgetMenu });
    opts.push({ t: "Ver o Estado do Reino", icon: "eye", fn: realmView });
    opts.push({ t: "Voltar", fn: null });
    choice("Política", `Regime atual: <b>${typeof regimeName === "function" ? regimeName() : "Monarquia"}</b>.`, opts);
  }
  function realmView() {
    const r = R();
    say([["", AREAS.map(([k, n]) => `${n}: ${Math.round(r[k])}/100`).join(" · ")], ["", r.limp < 40 ? "As ruas estão sujas. Quem governa precisa investir em Limpeza." : r.seg < 40 ? "Os roubos aumentaram. Falta investimento na Guarda." : "O reino vai bem, por enquanto."]]);
  }
  function movement() {
    if ((player.rep ?? 50) < 55) return say([["", "Ninguém assina a petição de alguém com reputação tão baixa. Ajude o povo primeiro (reputação 55)."]]);
    if (player.gold < 100) return say([["", "Panfletos e comícios custam 100 de ouro."]]);
    player.gold -= 100;
    if (Math.random() < 0.6 + ((player.rep ?? 50) - 55) / 100) {
      player.council = { day: player.day, chief: "rainha", next: player.day + 5, cand: true, camp: {} };
      if (typeof vilaNews === "function") vilaNews(`Movimento de ${player.name} junta milhares de assinaturas. A Rainha aceita uma eleição em 5 dias!`);
      say([["Rainha Aurélia", "Muito bem. O povo quer votar? Que vote. Daqui a cinco dias, eu contra você."]]);
    } else say([["", "A guarda rasga os seus panfletos e o movimento esfria. Tente de novo quando o povo estiver do seu lado."]]);
  }
  const REGIMES = [
    ["democracia", "República democrática (eleição todo ano)"],
    ["comunismo", "República popular (comunismo: tudo é do povo)"],
    ["constitucional", "Monarquia constitucional (a Rainha reina, você governa)"],
    ["ditadura", "Ditadura (sem eleições, tudo nas suas mãos)"],
  ];
  function regimeMenu() {
    choice("Escolher o regime", "O regime muda como o povo vive e como os outros reinos te enxergam.", REGIMES.map(([k, n]) => ({ t: (player.regime === k ? "✓ " : "") + n, icon: k === "ditadura" ? "skull" : "flag", fn: () => setRegime(k) })).concat([{ t: "Voltar", fn: budgetMenu }]));
  }
  function setRegime(k) {
    player.regime = k;
    const C = player.council;
    if (C) C.next = k === "ditadura" ? Infinity : player.day + YEAR_DAYS;
    const msg = {
      democracia: "Eleição todo ano. O povo escolhe, e pode tirar você.",
      comunismo: "O ouro acima de 120 vai para o Fundo do Povo. Pão e salário iguais para todos.",
      constitucional: "A Rainha volta ao trono como símbolo. Você governa pelo parlamento.",
      ditadura: "Sem eleições. Jornal censurado, guarda nas ruas, opositores presos. Os outros reinos cortam negócios. E o povo... espera.",
    }[k];
    if (k === "ditadura") (bumpAll(-15), typeof repAdd === "function" && repAdd(-6));
    if (typeof vilaNews === "function") vilaNews(`Novo regime em Cinzaluz: ${REGIMES.find((q) => q[0] === k)[1]}.`);
    saveGame();
    say([["", msg]]);
  }
  function bumpAll(d) {
    for (const k of ["mares", "serra", "solmar", "rosalva"]) bumpRel(k, d);
  }
  if (typeof regimeName === "function") {
    const rnBase = regimeName;
    regimeName = function () {
      if (player.council && player.council.chief === "player" && player.regime) return { democracia: "República (democracia)", comunismo: `República Popular de ${player.name}`, constitucional: "Monarquia constitucional", ditadura: `Ditadura de ${player.name}` }[player.regime];
      return rnBase.apply(this, arguments);
    };
  }
  if (typeof isCommunist === "function") {
    const icBase = isCommunist;
    isCommunist = function () {
      if (player.council && player.council.chief === "player" && player.regime) return player.regime === "comunismo";
      return icBase.apply(this, arguments);
    };
  }
  // ditadura: revolta pode derrubar você
  const ndBase = onNewDay;
  onNewDay = function () {
    const r = ndBase.apply(this, arguments);
    if (!lifeMode()) return r;
    realmDay();
    arrangedCheck();
    if (player.regime === "ditadura" && player.council && player.council.chief === "player" && R().social < 35 && Math.random() < 0.12) {
      player.council.chief = "luca";
      player.councilChief = false;
      player.regime = null;
      setTimeout(() => say([["", "REVOLUÇÃO! O povo invade o palácio. Você foge pela janela com a roupa do corpo."], ["Luca", "Ninguém manda sozinho no povo. Nunca mais."]]), 5000);
    }
    return r;
  };
  // menu dos Reinos ganha a Política
  const chBase = choice;
  choice = function (title, text, opts) {
    if (title === "Reinos" && lifeMode() && Array.isArray(opts) && !opts.some((o) => o.t === "Política e governo")) opts = [{ t: "Política e governo", icon: "crown", fn: politicsMenu }, ...opts];
    return chBase.call(this, title, text, opts);
  };
  window.politicsMenu = politicsMenu;
  window.budgetMenu = budgetMenu;

  /* ===================== LIXO E SUJEIRA NAS RUAS ===================== */
  let spots = null;
  const cdBase = crewDrawList;
  crewDrawList = function (list, t) {
    cdBase(list, t);
    if (!lifeMode() || player.zone !== "vila" || !player.realm) return;
    const r = R();
    if (r.limp >= 50) return;
    if (!spots) {
      const z = ZONES.vila;
      spots = [];
      for (let y = 2; y < z.h - 2; y++) for (let x = 2; x < z.w - 2; x++) if (z.map[y][x] === "," && ((x * 7 + y * 13) % 17 === 0)) spots.push([x, y]);
    }
    const n = Math.round(((50 - r.limp) / 50) * spots.length);
    const T = TILE;
    for (let i = 0; i < n; i++) {
      const [x, y] = spots[i];
      list.push({
        y: y - 0.2,
        draw: () => {
          const X = x * T,
            Y = y * T;
          const Q = (a, b, w, h, c) => ((ctx.fillStyle = c), ctx.fillRect(X + a, Y + b, w, h));
          // poça de sujeira e um monte de lixo apoiado no chão
          Q(2, 22, 28, 8, "rgba(60,45,25,.45)");
          Q(6, 16, 12, 12, "#6a5a3a");
          Q(8, 14, 8, 4, "#7a6a4a");
          Q(16, 20, 10, 8, "#5a4a2a");
          Q(10, 18, 3, 2, "#c94a3a");
          Q(20, 22, 4, 2, "#e8e0c8");
          if (i % 3 === 0) Q(14 + Math.sin(t * 9 + i) * 5, 10 + Math.cos(t * 7 + i) * 3, 1, 1, "#1a1a1a");
        },
      });
    }
  };
})();

/* ===================== O REGIME E OS TRABALHADORES =====================
   Cada regime pesa de um jeito na vida de quem trabalha:
   - Monarquia: o imposto da Coroa decide (alto aperta o salário, baixo alivia).
   - Monarquia constitucional: pouco melhor, com feriados respeitados.
   - Democracia: salário melhor e trabalhador protegido (ninguém é obrigado a
     nada).
   - Comunismo: salário igual para todos os ofícios (o ganho de quem ganhava
     muito cai, o de quem ganhava pouco sobe) e ração de pão todo dia.
   - Ditadura: salário esmagado, turnos que cansam mais, e de vez em quando a
     guarda leva todo mundo para a corveia (trabalho forçado sem pagar). */
(() => {
  const regime = () => {
    if (!lifeMode()) return null;
    if (player.council && player.council.chief === "player" && player.regime) return player.regime;
    if (typeof isCommunist === "function" && isCommunist()) return "comunismo";
    if (player.council && !player.council.prov) return "democracia";
    return "monarquia";
  };
  window.workRegime = regime;
  const MUL = { constitucional: 1.05, democracia: 1.12, ditadura: 0.75 };
  const jpBase = jobPay;
  jobPay = function (base) {
    const r = regime();
    let b = base;
    if (r === "comunismo") b = (base + 14) / 2; // achata: todos ganham parecido
    let m = MUL[r] || 1;
    if (r === "monarquia") m = { alto: 0.85, baixo: 1.05 }[player.royalTax] || 1;
    return jpBase.call(this, Math.max(1, b * m));
  };
  // turno cansa mais na ditadura
  if (typeof addNeed === "function") {
    const anBase = addNeed;
    addNeed = function (k, v) {
      if (k === "energy" && v < 0 && player.job && regime() === "ditadura") v *= 1.3;
      return anBase.call(this, k, v);
    };
  }
  const ndBase = onNewDay;
  onNewDay = function () {
    const r0 = ndBase.apply(this, arguments);
    const r = regime();
    if (!r) return r0;
    if (r === "comunismo") ((player.food = Math.min(100, (player.food || 0) + 20)), setTimeout(() => toast("Ração do Fundo do Povo: um pão para cada família. (+20 fome)", 3500), 9500));
    if (r === "ditadura" && Math.random() < 0.2) {
      setTimeout(() => say([["Guarda do Regime", "Corveia! Todo trabalhador para a muralha. Quatro horas de pedra, sem pagamento. Quem reclamar vai para a masmorra."]], () => (typeof passTime === "function" && passTime(4, "Quatro horas carregando pedra para a muralha do ditador..."), addNeed("energy", -25), addNeed("fun", -15))), 10000);
    }
    return r0;
  };
  // o que os trabalhadores falam do regime (usado pelos moradores dos lotes)
  window.workerTalk = (poor) => {
    const r = regime();
    const L = {
      monarquia: poor ? ["A Coroa cobra imposto até da galinha. E a gente come o quê?", "Trabalho de sol a sol pra pagar o dízimo do castelo."] : ["Com a Coroa, se o imposto tá baixo, dá pra viver.", "A Rainha não é má. Os coletores é que são."],
      constitucional: ["Agora tem conselho e feriado de verdade. Melhorou um pouco.", "A Rainha virou enfeite, mas o salário subiu."],
      democracia: ["Agora a gente vota! O patrão não pode mais mandar embora por nada.", "Salário melhor e ninguém é obrigado a trabalhar doente."],
      comunismo: poor ? ["Pela primeira vez ganho igual ao ferreiro! E tem pão todo dia.", "No Fundo do Povo, ninguém passa fome."] : ["Trabalho o dobro e ganho igual ao preguiçoso do lado.", "Meu ouro foi todo para o Fundo do Povo. Grande coisa."],
      ditadura: ["*olha pros lados* Não posso falar... a guarda escuta tudo.", "Levaram meu marido pra corveia e não devolveram.", "Salário? Que salário. A gente trabalha pra não ser preso."],
    }[r];
    return L ? pk(L) : null;
  };
})();

/* ===================== O PATRÃO =====================
   O patrão quer lucro. Fora da democracia e do comunismo ele desconta do
   salário por qualquer coisa, segura você em hora extra sem pagar e embolsa
   o que o seu trabalho rendeu. Na democracia a lei protege (e hora extra é
   paga); no comunismo não tem patrão: a oficina é do povo e o ganho é
   dividido. Dá para reclamar ou chamar greve, com riscos diferentes em cada
   regime. */
(() => {
  if (typeof endJob !== "function") return;
  const ejBase = endJob;
  endJob = function (reason) {
    const j = player.job;
    const earned = j && j.earned ? j.earned : 0;
    const id = j && j.id;
    const r = ejBase.apply(this, arguments);
    if (!lifeMode() || !id || id === "guarda" || earned <= 0 || reason === "quit") return r;
    const reg = typeof workRegime === "function" ? workRegime() : "monarquia";
    const boss = "Patrão";
    setTimeout(() => {
      if (reg === "comunismo") return toast(`Oficina do Povo: o que você produziu (${earned * 2} ouro) foi dividido entre todos. Ninguém lucra em cima de ninguém.`, 4500);
      if (reg === "democracia") {
        if (Math.random() < 0.25) ((player.gold += Math.round(earned * 0.2)), toast(`Hora extra paga, como manda a lei: +${Math.round(earned * 0.2)} ouro.`, 3800));
        return;
      }
      const roll = Math.random();
      const lucro = Math.round(earned * (reg === "ditadura" ? 3 : 2));
      if (roll < 0.35) {
        const cut = Math.max(1, Math.round(earned * (reg === "ditadura" ? 0.3 : 0.15)));
        player.gold = Math.max(0, player.gold - cut);
        const why = pk(["uma caneca que quebrou", "você chegou atrasado(a)", "conversar no serviço", "desgaste das ferramentas", "a sopa do almoço"]);
        choice(boss, `"Descontei ${cut} de ouro: ${why}." Seu trabalho rendeu ${lucro} de ouro pra ele hoje, e você ficou com ${earned - cut}.`, [
          { t: "Engolir e ir embora", fn: null },
          { t: "Reclamar com o patrão", icon: "chat", fn: () => (Math.random() < 0.35 ? ((player.gold += cut), say([[boss, "Tá bom, tá bom. Toma o seu ouro. Mas não se acostume."]])) : ((player.warns = player.warns || {}), (player.warns[id] = (player.warns[id] || 0) + 1), say([[boss, "Reclamando? Tem fila de gente querendo o seu lugar. Advertência!"]]))) },
          {
            t: "Chamar os colegas para uma greve",
            icon: "flag",
            fn: () => {
              if (reg === "ditadura") return ((player.hp = Math.max(1, player.hp - 15)), (player.fired = player.fired || {}), (player.fired[id] = player.day + 5), say([["Guarda do Regime", "Greve é crime! *empurrões e porretes* Você está proibid" + genderWord("o", "a", "e") + " de trabalhar lá por 5 dias."]]));
              if (Math.random() < 0.45) {
                if (typeof ilumAdd === "function") ilumAdd(3);
                player.gold += cut * 2;
                return say([["", "Os colegas cruzam os braços. A oficina para."], [boss, "...Está bem! Sem descontos por um mês. Voltem ao trabalho!"]]);
              }
              (player.fired = player.fired || {}), (player.fired[id] = player.day + 3);
              say([["", "Ninguém te acompanha: todos têm medo de perder o emprego."], [boss, "Rua! Por três dias você não pisa aqui."]]);
            },
          },
        ]);
      } else if (roll < 0.6) {
        if (typeof passTime === "function") passTime(1, `${boss}: "Antes de ir, varre a oficina e arruma o estoque." Uma hora a mais... sem pagar.`);
        if (typeof addNeed === "function") addNeed("energy", -8);
      } else toast(`O seu turno rendeu ${lucro} de ouro para o patrão. Você levou ${earned}.`, 4000);
    }, 2600);
    return r;
  };
})();
