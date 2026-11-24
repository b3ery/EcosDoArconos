/**
 * ECOS DO ARCANO — festas-e-convites.js  (Simulador de Vida)
 * Convites que viram festa de verdade:
 *  - CONVITES chegam para todo mundo (não só para a realeza): aniversário de
 *    amig(o), festa na taverna, baile da colheita na praça, casamento de
 *    amigos (e de quem é conhecido na vila) e os grandes eventos dos outros
 *    reinos (baile de máscaras, casamento real, torneio, festa do palácio).
 *  - VIAGEM: quando a festa é em outro reino, no dia de partir a carruagem do
 *    anfitrião vem te buscar (de graça) e a cena da estrada mostra a viagem;
 *    você chega no dia da festa. Se estiver longe de Cinzaluz numa festa da
 *    vila, também dá para voltar de carruagem.
 *  - A FESTA: uma cena com o lugar enfeitado (templo com arco de flores,
 *    taverna com música, salão do baile, praça com fogueira) e depois você
 *    escolhe o que fazer, hora por hora: dançar, brindar e comer, conversar
 *    com o anfitrião, dar presente, conhecer alguém, pegar o buquê...
 *  - Os convites reais antigos e os casamentos confirmados passam por aqui.
 * Modifica (envolve) funções de outros arquivos: onNewDay, update, choice,
 * isCloseTo, weddingInvites, enterZone.
 */

"use strict";

(() => {
  const L = () => (player.parties = player.parties || []);
  const life = () => typeof lifeMode === "function" && lifeMode();
  const free = () => game.mode === "world" && !game.dialog && !game.dying && !game.cine && !(byId("choice") && byId("choice").style.display === "block");
  const gwi = (id, a, b) => (typeof gw === "function" ? gw(id, a, b) : a);
  const nm = (id) => (NPCS[id] ? shortName(id) : id);
  const alive = (id) => NPCS[id] && !(typeof isDead === "function" && isDead(id));
  // dentro de uma casa ou loja, você está na cidade de onde entrou
  const here = () => (player.zone === "interior" || player.zone === "casa" ? (player.ret && player.ret.zone) || "vila" : player.zone);
  const tdays = (z) => (here() === z ? 0 : typeof travelDays === "function" ? travelDays(here(), z) : 2);

  const LOCAL = [
    { kind: "aniversario", hour: 18, t: (h) => `Aniversário de ${nm(h)}`, where: (h) => `na casa de ${nm(h)}`, txt: (h) => `"Vou fazer uma festinha de aniversário e não tem graça sem você! Bolo, música e muita gente boa."` },
    { kind: "taverna", hour: 20, t: (h) => `Festa na Taverna`, where: () => "na Taverna", txt: (h) => `"${nm(h)} pagou a primeira rodada e chamou o bardo! Festa na Taverna, traga os amigos."` },
    { kind: "colheita", hour: 19, t: () => "Baile da Colheita", where: () => "na praça de Cinzaluz", txt: () => `"A colheita foi boa! A vila toda está convidada para o Baile da Colheita na praça: fogueira, dança e torta de maçã."` },
  ];
  const ROYAL = [
    ["baile", "Baile de Máscaras"],
    ["casamento_real", "Casamento Real"],
    ["festa", "Festa do Palácio"],
    ["torneio", "Torneio de Cavaleiros"],
  ];

  /* ===================== OS CONVITES ===================== */
  function hosts() {
    let f = typeof bestFriends === "function" ? bestFriends(8) : [];
    f = f.filter((id) => alive(id) && id !== player.spouse && !String(id).startsWith("w"));
    if (f.length < 2) f = f.concat(Object.keys(NPCS).filter((id) => alive(id) && typeof named === "function" && named(id) && !NPCS[id].kid).slice(0, 12));
    return f;
  }
  function invite(P) {
    playSound(880, 0.12, "sine");
    const days = P.zone !== "vila" ? tdays(P.zone) : 0;
    const quando = P.day === player.day ? "hoje" : P.day === player.day + 1 ? "amanhã" : `no dia ${P.day}`;
    choice(
      P.royal ? `Convite real de ${KINGDOMS[P.k].short}` : `Convite: ${P.title}`,
      `<i>${P.txt}</i><br><br><b>${P.title}</b> · ${quando}, às ${P.hour}h, ${P.where}.${days ? `<br><small>A viagem de carruagem leva ${days} dia(s): no dia de partir, a carruagem do anfitrião vem te buscar.</small>` : ""}`,
      [
        { t: "Aceitar o convite", icon: "heart", fn: () => ((P.acc = true), L().push(P), saveGame(), toast(days ? `Anotado! Partida no dia ${P.day - days}. A carruagem te busca de manhã.` : `Anotado: ${P.title}, ${quando} às ${P.hour}h. Uma hora antes eu te lembro.`, 4200)) },
        { t: "Recusar com educação", icon: "scroll", fn: () => (P.host && P.host.forEach((h) => NPCS[h] && addFriendship(h, -1)), P.k && bumpRel(P.k, -2)) },
      ],
    );
  }
  function bumpRel(k, d) {
    if (typeof worldState !== "function" || k === "aurelia" || !KINGDOMS[k]) return;
    const w = worldState(),
      key = pairKey("aurelia", k);
    w.rel[key] = Math.max(0, Math.min(100, (w.rel[key] ?? 50) + d));
  }
  function newInvite() {
    if (!life() || L().filter((p) => !p.done).length >= 2) return;
    const r = Math.random();
    if (r < 0.3) {
      const hs = hosts();
      if (!hs.length) return;
      const h = pk(hs),
        E = pk(LOCAL);
      if (E.kind === "taverna" && player.day % 7 === 0) return;
      const P = { id: "p" + player.day + "_" + Math.floor(Math.random() * 1e4), kind: E.kind, title: E.t(h), where: E.where(h), txt: E.txt(h), host: [h], day: player.day + 1 + (Math.random() < 0.5 ? 1 : 0), hour: E.hour, zone: "vila" };
      setTimeout(() => invite(P), 7000);
    } else if (r < 0.45 && ((player.rep ?? 50) >= 40 || (typeof playerRules === "function" && playerRules()))) {
      const ks = Object.keys(KINGDOMS).filter((k) => k !== "aurelia" && KINGDOMS[k].zone && !KINGDOMS[k].zone.startsWith("pais-") && ZONES[KINGDOMS[k].zone] && !(typeof rulesK === "function" && rulesK(k)) && !atWar("aurelia", k));
      if (!ks.length) return;
      const k = pk(ks),
        [kind, n] = pk(ROYAL);
      const days = Math.max(1, tdays(KINGDOMS[k].zone));
      const P = { id: "r" + player.day + k, kind, royal: true, k, title: `${n} em ${KINGDOMS[k].short}`, where: `no palácio de ${KINGDOMS[k].short}`, txt: `"${KINGDOMS[k].ruler} tem a honra de convidar ${player.name} para ${n.toLowerCase()}. A carruagem real buscará você."`, host: [], day: player.day + days + 2, hour: 20, zone: KINGDOMS[k].zone };
      setTimeout(() => invite(P), 9000);
    }
  }
  const ndBase = onNewDay;
  onNewDay = function () {
    const r = ndBase.apply(this, arguments);
    try {
      newInvite();
    } catch (e) {
      console.error(e);
    }
    return r;
  };
  // gente conhecida na vila também é convidada para os casamentos
  if (typeof weddingInvites === "function" && typeof isCloseTo === "function") {
    let wed = false;
    const icBase = isCloseTo;
    isCloseTo = function (id) {
      return icBase.apply(this, arguments) || (wed && (player.rep ?? 50) >= 55);
    };
    const wiBase = weddingInvites;
    weddingInvites = function () {
      wed = true;
      try {
        return wiBase.apply(this, arguments);
      } finally {
        wed = false;
      }
    };
  }
  // os convites reais antigos viram festas com viagem
  const chBase = choice;
  choice = function (title, text, opts) {
    if (/^Convite real de /.test(title || "") && Array.isArray(opts) && !opts.__festas) {
      opts = opts.map((o) =>
        /^Aceitar/.test(o.t || "")
          ? {
              ...o,
              fn: () => {
                o.fn && o.fn();
                const I = player.invite;
                if (!I) return;
                player.invite = null;
                L().push({ id: "i" + I.day + I.k, kind: I.kind === "casamento" ? "casamento_real" : I.kind, royal: true, k: I.k, title: `${I.n} em ${KINGDOMS[I.k].short}`, where: `no palácio de ${KINGDOMS[I.k].short}`, host: [], day: I.day, hour: 20, zone: KINGDOMS[I.k].zone, acc: true });
                saveGame();
              },
            }
          : o,
      );
      opts.__festas = 1;
    }
    return chBase.call(this, title, text, opts);
  };

  /* ===================== PARTIR, CHEGAR E COMEÇAR ===================== */
  function adoptWeddings() {
    const S = player.soc;
    if (!S || !S.wed) return;
    for (const w of S.wed)
      if (!w.done && w.inv === "sim" && !w.party && player.day <= w.day) {
        w.party = 1;
        w.called = true; // o lembrete antigo não precisa mais
        L().push({ id: "w" + w.day + w.a, kind: "casamento", title: `Casamento de ${nm(w.a)} e ${nm(w.b)}`, where: "no Templo da Luz", host: [w.a, w.b], a: w.a, b: w.b, day: w.day, hour: 17, zone: "vila", acc: true });
      }
  }
  function tick() {
    adoptWeddings();
    for (const P of L()) {
      if (!P.acc || P.done) continue;
      const days = tdays(P.zone);
      // perdeu a festa
      if (player.day > P.day + (P.late ? 1 : 0)) {
        P.done = true;
        P.host.forEach((h) => NPCS[h] && addFriendship(h, -5));
        if (P.k) bumpRel(P.k, -5);
        toast(`Você perdeu: ${P.title}. ${P.royal ? "Acharam uma desfeita." : "Sentiram a sua falta."}`, 4200);
        continue;
      }
      // hora de pegar a estrada (festa em outro lugar)
      if (here() !== P.zone && days > 0 && !P.asked && player.day >= P.day - days && player.clock >= 7 * 60) {
        P.asked = true;
        choice("Hora de partir!", `${P.royal ? "A carruagem real" : "Uma carruagem"} está te esperando para ${P.title}, ${P.where}. A viagem leva ${days} dia(s).`, [
          {
            t: "Subir na carruagem e viajar",
            icon: "horse",
            fn: () => {
              P.late = player.day + days > P.day;
              if (typeof journey === "function") journey(P.zone, false, 0);
              else ((player.zone = P.zone), enterZone());
            },
          },
          { t: "Não vou mais", icon: "meh", fn: () => ((P.done = true), P.k && bumpRel(P.k, -4), P.host.forEach((h) => NPCS[h] && addFriendship(h, -3))) },
        ]);
        return;
      }
      // chegou: começa na hora (ou já, se chegou atrasad(o))
      if (here() === P.zone && !P.started && ((player.day === P.day && player.clock >= (P.hour - 1) * 60) || (P.late && player.day >= P.day))) {
        P.started = true;
        choice(P.title, `${P.late ? "Você chega um pouco atrasad" + genderWord("o", "a", "e") + ", mas a festa ainda está animada!" : `A festa começa às ${P.hour}h, ${P.where}.`}`, [
          { t: "Ir à festa", icon: "party", fn: () => startParty(P) },
          { t: "Não vou conseguir ir", icon: "meh", fn: () => ((P.done = true), P.host.forEach((h) => NPCS[h] && addFriendship(h, -5)), P.k && bumpRel(P.k, -5)) },
        ]);
        return;
      }
    }
    player.parties = L().filter((p) => !p.done || player.day - p.day < 2);
  }
  const upBase = update;
  let acc = 0;
  update = function (dt) {
    const r = upBase.apply(this, arguments);
    acc += dt || 0;
    if (acc < 1) return r;
    acc = 0;
    if (!player || !player.name || !life() || !free()) return r;
    try {
      tick();
    } catch (e) {
      console.error(e);
    }
    return r;
  };

  /* ===================== A FESTA ===================== */
  function startParty(P) {
    if (player.clock < P.hour * 60 && player.day === P.day) player.clock = P.hour * 60;
    if (P.zone === "vila" && P.kind === "casamento" && typeof goToTemple === "function") goToTemple();
    const sc = scene(P);
    setTimeout(() => {
      const c = game.cine;
      if (c && c.draw === sc) ((c.t0 = -999), endCine());
    }, 7500);
    playSound(523, 0.2, "triangle");
    playCine(sc, 6, () => {
      if (P.kind === "casamento") marry(P);
      P.left = 3;
      P.fun = 0;
      partyMenu(P);
    });
  }
  function marry(P) {
    const S = player.soc;
    const w = S && S.wed && S.wed.find((q) => q.a === P.a && q.b === P.b && !q.done);
    if (!w) return;
    w.done = true;
    w.inv = "foi";
    if (named(w.a) && named(w.b) && !npcSpouse(w.a) && !npcSpouse(w.b)) {
      delete S.dating[w.a];
      delete S.dating[w.b];
      S.mar[w.a] = w.b;
      S.mar[w.b] = w.a;
      if (typeof relAdd === "function") relAdd(w.a, w.b, 10);
      vilaNews(`Casamento! ${nm(w.a)} e ${nm(w.b)} disseram sim no Templo da Luz.`);
    }
  }
  const SINGLES = () => Object.keys(NPCS).filter((id) => alive(id) && typeof named === "function" && named(id) && !NPCS[id].kid && id !== player.spouse && !(typeof npcSpouse === "function" && npcSpouse(id)) && id !== "rainha");
  function partyMenu(P) {
    if (P.left <= 0) return endParty(P);
    const h = P.host[0],
      H = h && NPCS[h] ? nm(h) : P.royal ? KINGDOMS[P.k].ruler : null;
    const hour = (txt, fn) => () => {
      P.left--;
      passTime(1, txt);
      fn();
      setTimeout(() => partyMenu(P), 400);
    };
    const opts = [
      {
        t: "Dançar",
        icon: "note",
        fn: hour("Uma hora dançando...", () => {
          addNeed("fun", 22);
          P.fun += 2;
          const s = SINGLES().filter((id) => !P.host.includes(id));
          if (s.length && Math.random() < 0.45) {
            const id = pk(s);
            addFriendship(id, 6);
            say([["", `Você dança com ${nm(id)}. Os passos combinam... e vocês riem quando pisam no pé um do outro.`], [nm(id), pk(["Você dança bem! Quer dançar a próxima também?", "Faz tempo que eu não me divirto assim.", "Se a música parar, a gente continua mesmo assim?"])]]);
          } else say([["", pk(["O bardo acelera a música e a roda fica cada vez maior!", "Você gira até ficar tonto. A plateia aplaude.", "Uma dança de roda: todo mundo de mãos dadas, até os velhinhos."])]]);
        }),
      },
      {
        t: "Brindar e comer do banquete",
        icon: "food",
        fn: hour("Uma hora no banquete...", () => {
          player.food = Math.min(100, (player.food || 0) + 35);
          player.water = Math.min(100, (player.water || 0) + 25);
          addNeed("fun", 10);
          P.fun++;
          say([["", P.royal ? "Faisão assado, tortas douradas e vinho de safra antiga. Os nobres brindam ao seu nome." : pk(["Torta de maçã, pão quentinho e cerveja gelada. Que banquete!", "Você prova um pouco de tudo. A tia do anfitrião insiste: 'Come mais, tá magr" + genderWord("o", "a", "e") + "!'"])]]);
        }),
      },
    ];
    if (H)
      opts.push({
        t: `Conversar com ${P.kind === "casamento" ? "os noivos" : H}`,
        icon: "chat",
        fn: hour("Uma hora de conversa...", () => {
          P.host.forEach((x) => NPCS[x] && addFriendship(x, 6));
          if (P.k) bumpRel(P.k, 4);
          addNeed("social", 20);
          say([[P.kind === "casamento" ? nm(P.a) : H, P.kind === "casamento" ? "Obrigad" + gwi(P.a, "o", "a") + " por vir! Esse dia não seria o mesmo sem você." : P.royal ? "Que honra ter você aqui. Nossos reinos ficam mais perto a cada festa." : pk(["Que bom que você veio! A festa só começou de verdade agora.", "Você é sempre bem-vind" + genderWord("o", "a", "e") + " aqui."])]]);
        }),
      });
    opts.push({
      t: `Dar um presente (${P.royal ? 40 : 15} ouro)`,
      icon: "gift",
      fn: () => {
        const c = P.royal ? 40 : 15;
        if (player.gold < c) return say([["", "Você não tem ouro para o presente."]], () => partyMenu(P));
        player.gold -= c;
        P.host.forEach((x) => NPCS[x] && addFriendship(x, 10));
        if (P.k) bumpRel(P.k, 8);
        repAdd(1);
        say([["", "O presente é aberto na frente de todos. Sorrisos e aplausos!"]], () => partyMenu(P));
      },
    });
    if (P.kind === "casamento" && !P.buque)
      opts.push({ t: "Disputar o buquê", icon: "flower", fn: () => ((P.buque = 1), say([["", Math.random() < 0.35 ? "O buquê voa... e cai direto nas suas mãos! Todo mundo grita: 'O próximo casamento é seu!'" : "O buquê voa, bate no lustre e cai na cabeça do Padre Anselmo. Gargalhada geral."]], () => partyMenu(P))) });
    if (P.kind === "torneio" && !P.justa)
      opts.push({ t: "Entrar na justa (cavaleiros)", icon: "sword", fn: hour("Uma hora de torneio...", () => ((P.justa = 1), Math.random() < 0.4 ? ((player.gold += 120), repAdd(3), say([["", "Sua lança acerta em cheio! O campeão cai do cavalo e a arquibancada explode. Prêmio: 120 ouro!"]])) : say([["", "Você cai do cavalo na primeira passada. Doeu mais o orgulho do que as costas."]]))) });
    if (P.kind === "aniversario" && !P.parab) opts.push({ t: "Puxar o parabéns e cortar o bolo", icon: "party", fn: () => ((P.parab = 1), addFriendship(h, 8), say([["", `"Parabéns pra você..." A sala inteira canta, ${nm(h)} assopra as velas e ganha o primeiro pedaço de bolo.`]], () => partyMenu(P))) });
    opts.push({ t: "Ir embora", icon: "door", fn: () => endParty(P) });
    choice(P.title, `${P.where[0].toUpperCase() + P.where.slice(1)} · ${clockStr()}. ${["", "Ainda dá tempo de uma coisa.", "A festa está no meio.", "A festa está começando a esquentar!"][Math.max(0, Math.min(3, P.left))]}`, opts);
  }
  function endParty(P) {
    P.done = true;
    P.host.forEach((x) => NPCS[x] && addFriendship(x, 4));
    if (P.k) bumpRel(P.k, 6);
    addNeed("fun", 10);
    repAdd(P.royal ? 3 : 1);
    saveGame();
    toast(`Fim da festa: ${P.title}. ${P.fun >= 3 ? "Que noite inesquecível!" : "Foi bom ter ido."}`, 3600);
  }
  window.partyNow = (P) => startParty(P);

  /* ===================== AS CENAS ===================== */
  function people(W, fy, t, n, colors, dance) {
    for (let i = 0; i < n; i++) {
      const a = t * (dance ? 1.2 : 0.2) + (i * Math.PI * 2) / n;
      const x = dance ? W / 2 + Math.cos(a) * (180 + (i % 2) * 40) : W * 0.12 + (i * W * 0.76) / (n - 1);
      const y = dance ? fy - 60 + Math.sin(a) * 26 : fy - 64 - (i % 2) * 10;
      const dir = dance ? (Math.cos(a) > 0 ? "left" : "right") : "up";
      drawSprite(wizardRects(colors[i % colors.length], null, ["#3a2414", "#d9a441", "#1a1a1a", "#8a3a1a"][i % 4], null, dir, dance ? Math.floor(t * 5 + i) % 2 : 0), x, y + (dance ? Math.abs(Math.sin(t * 6 + i)) * -4 : 0), 3, dir === "left");
    }
  }
  function scene(P) {
    const cols = ["#7a2a4a", "#2a4a7a", "#4a7a3a", "#c9a040", "#5a3a8a", "#8a3a2a", "#2a6a6a"];
    return (W, H, t) => {
      const fy = H * 0.64;
      const k = P.kind;
      if (k === "casamento" || k === "casamento_real") {
        // templo: vitrais, arco de flores, noivos e convidados
        ctx.fillStyle = "#3a3448";
        ctx.fillRect(0, 0, W, H);
        for (let i = 0; i < 5; i++) {
          const x = W * 0.1 + i * W * 0.2 - 20;
          ctx.fillStyle = ["#c93a3a", "#3a6ac9", "#e8b84a", "#3a9a5a", "#9a5ac9"][i];
          ctx.fillRect(x, 40, 40, 110);
          ctx.fillStyle = "rgba(255,255,255,.18)";
          ctx.fillRect(x, 40, 40, 110);
        }
        ctx.fillStyle = "#cfc6b8";
        ctx.fillRect(0, fy, W, H - fy);
        ctx.fillStyle = "#8a1e3a";
        ctx.fillRect(W / 2 - 50, fy, 100, H - fy);
        // arco de flores
        ctx.strokeStyle = "#5a8a3a";
        ctx.lineWidth = 10;
        ctx.beginPath();
        ctx.arc(W / 2, fy - 40, 110, Math.PI, 0);
        ctx.stroke();
        for (let i = 0; i <= 14; i++) {
          const a = Math.PI + (i / 14) * Math.PI;
          ctx.fillStyle = ["#ff8aa8", "#ffffff", "#ffd36a"][i % 3];
          ctx.fillRect(W / 2 + Math.cos(a) * 110 - 6, fy - 40 + Math.sin(a) * 110 - 6, 12, 12);
        }
        const A = P.a && NPCS[P.a],
          B = P.b && NPCS[P.b];
        drawSprite(wizardRects(A ? A.robe : "#f4f0e8", A ? A.hat : null, A ? A.hair : "#3a2414", null, "down"), W / 2 - 60, fy - 72, 3, false);
        drawSprite(wizardRects(B ? B.robe : "#f4f0e8", null, B ? B.hair : "#d9a441", null, "down"), W / 2 + 12, fy - 72, 3, false);
        // véu
        ctx.fillStyle = "rgba(255,255,255,.7)";
        ctx.fillRect(W / 2 + 18, fy - 76, 36, 44);
        drawSprite(wizardRects("#2a2230", null, "#cfc6b8", null, "down"), W / 2 - 24, fy - 120, 3, false);
        people(W, H * 0.96, t, 8, cols, false);
        // pétalas caindo
        for (let i = 0; i < 40; i++) {
          ctx.fillStyle = ["#ff8aa8", "#ffffff", "#ffc0d0"][i % 3];
          ctx.fillRect((i * 97 + Math.sin(t + i) * 30) % W, (t * 60 + i * 53) % H, 4, 3);
        }
      } else if (k === "taverna" || k === "aniversario") {
        ctx.fillStyle = "#3a2414";
        ctx.fillRect(0, 0, W, H);
        for (let x = 0; x < W; x += 60) ((ctx.fillStyle = "#4a2e17"), ctx.fillRect(x, 0, 4, fy));
        ctx.fillStyle = "#6b4423";
        ctx.fillRect(0, fy, W, H - fy);
        // bandeirinhas
        for (let i = 0; i < 24; i++) {
          ctx.fillStyle = cols[i % cols.length];
          fillPolygon(i * (W / 24), 30, (i + 1) * (W / 24), 30, (i + 0.5) * (W / 24), 52 + Math.sin(t * 2 + i) * 2);
        }
        // mesa com bolo ou canecas
        ctx.fillStyle = "#8a5e32";
        ctx.fillRect(W / 2 - 120, fy - 30, 240, 16);
        ctx.fillRect(W / 2 - 110, fy - 14, 10, 30);
        ctx.fillRect(W / 2 + 100, fy - 14, 10, 30);
        if (k === "aniversario") {
          ctx.fillStyle = "#f4e8d8";
          ctx.fillRect(W / 2 - 40, fy - 70, 80, 40);
          ctx.fillStyle = "#e87aa0";
          ctx.fillRect(W / 2 - 40, fy - 70, 80, 8);
          for (let i = 0; i < 5; i++) {
            ctx.fillStyle = "#fff";
            ctx.fillRect(W / 2 - 30 + i * 14, fy - 86, 4, 16);
            ctx.fillStyle = "#ffb030";
            ctx.fillRect(W / 2 - 30 + i * 14, fy - 92 - Math.abs(Math.sin(t * 9 + i)) * 3, 4, 6);
          }
        } else
          for (let i = 0; i < 6; i++) {
            ctx.fillStyle = "#c9a050";
            ctx.fillRect(W / 2 - 100 + i * 38, fy - 46, 16, 16);
            ctx.fillStyle = "#fff";
            ctx.fillRect(W / 2 - 100 + i * 38, fy - 50, 16, 5);
          }
        // bardo
        drawSprite(wizardRects("#2a6a3a", "#8a2a2a", "#3a2414", null, "down"), W * 0.82, fy - 80, 3, false);
        ctx.fillStyle = "#c9853a";
        ctx.fillRect(W * 0.82 + 30, fy - 40 + Math.sin(t * 8) * 2, 22, 12);
        for (let i = 0; i < 3; i++) ((ctx.fillStyle = "#ffe8a0"), ctx.fillText ? ctx.fillText("♪", W * 0.85 + i * 20, fy - 100 - ((t * 30 + i * 20) % 60)) : 0);
        people(W, fy, t, 6, cols, true);
      } else {
        // baile no palácio, festa, torneio, colheita
        const night = k === "colheita";
        ctx.fillStyle = night ? "#1a1a3a" : "#2a1a2a";
        ctx.fillRect(0, 0, W, H);
        if (night) {
          for (let i = 0; i < 60; i++) ((ctx.fillStyle = "#fff"), ctx.fillRect((i * 131) % W, (i * 71) % (fy - 40), 2, 2));
          ctx.fillStyle = "#4a6a3a";
          ctx.fillRect(0, fy, W, H - fy);
          // fogueira
          for (let i = 0; i < 8; i++) {
            ctx.fillStyle = ["#ffb030", "#ff7a20", "#ffe080"][i % 3];
            const h = 30 + Math.abs(Math.sin(t * 9 + i)) * 30;
            ctx.fillRect(W / 2 - 24 + i * 6, fy - 20 - h, 6, h);
          }
          ctx.fillStyle = "#5a3a22";
          ctx.fillRect(W / 2 - 34, fy - 16, 68, 10);
          for (let i = 0; i < 12; i++) ((ctx.fillStyle = cols[i % cols.length]), ctx.fillRect(i * (W / 12) + 20, 40 + Math.sin(i) * 10, 14, 18));
        } else {
          for (let y = fy; y < H; y += 20) for (let x = 0; x < W; x += 20) ((ctx.fillStyle = ((x + y) / 20) % 2 ? "#e8dcc0" : "#5a3a2a"), ctx.fillRect(x, y, 20, 20));
          for (const cx of [W * 0.12, W * 0.88]) ((ctx.fillStyle = "#c9b8a0"), ctx.fillRect(cx - 14, 60, 28, fy - 60), (ctx.fillStyle = "#e8dcc0"), ctx.fillRect(cx - 18, 54, 36, 10));
          for (const lx of [W * 0.35, W * 0.65]) {
            ctx.fillStyle = "#c9a040";
            ctx.fillRect(lx - 1, 0, 2, 50);
            ctx.fillRect(lx - 30, 50, 60, 6);
            for (let i = 0; i < 5; i++) ((ctx.fillStyle = "#ffe08a"), ctx.fillRect(lx - 28 + i * 13, 42 + Math.sin(t * 8 + i), 3, 8));
          }
          if (k === "torneio") {
            ctx.fillStyle = "#8a5e32";
            ctx.fillRect(0, fy - 8, W, 8);
            const x = ((t * 200) % (W + 200)) - 100;
            ctx.fillStyle = "#e8e0d0";
            ctx.fillRect(x, fy - 60, 70, 34);
            ctx.fillStyle = "#7a1e3a";
            ctx.fillRect(x + 10, fy - 96, 26, 40);
            ctx.fillStyle = "#c9c9d2";
            ctx.fillRect(x + 36, fy - 80, 80, 4);
          }
          if (k === "baile")
            for (let i = 0; i < 6; i++) ((ctx.fillStyle = "rgba(255,255,255,.08)"), ctx.fillRect(((t * 80 + i * 200) % W) - 50, fy - 200, 100, 200));
        }
        people(W, fy, t, 8, cols, k !== "torneio");
      }
      const wed = /casamento/.test(P.kind);
      drawSprite(heroRects(player.look, wed ? "up" : "down", null), W / 2 - 24, wed ? H * 0.96 - 64 : fy - 66, 3, false);
      if (P.kind === "casamento_real")
        for (const cx of [W / 2 - 60, W / 2 + 12]) {
          ctx.fillStyle = "#f2c14e";
          ctx.fillRect(cx + 15, fy - 72, 18, 6);
          for (const d of [0, 7, 14]) ctx.fillRect(cx + 15 + d, fy - 77, 4, 6);
        }
      ctx.textAlign = "center";
      ctx.font = '700 28px "Pixelify Sans", sans-serif';
      ctx.fillStyle = "#ffe8b0";
      ctx.fillText(P.title, W / 2, 34);
      ctx.font = '600 16px "Pixelify Sans", sans-serif';
      ctx.fillText(P.where[0].toUpperCase() + P.where.slice(1), W / 2, 58);
    };
  }
})();
