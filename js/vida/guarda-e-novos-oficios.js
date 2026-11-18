/**
 * ECOS DO ARCANO — guarda-e-novos-oficios.js
 *  - Novas profissões de prédio (cada uma com o seu minijogo): barbeiro,
 *    bibliotecário, cavalariço, moleiro, açougueiro, peixeiro, balconista do
 *    armazém, bardo da taverna e joalheiro (Porto).
 *  - Guarda Real de verdade: no começo do turno o General Marcos dá a ordem
 *    do dia (patrulha, caçar um procurado ou vigiar a masmorra). Quem você
 *    prende vai algemado atrás de você até o Guarda Tomé, na entrada do
 *    calabouço. Na masmorra: rondas, presos pedindo água, tentativa de fuga
 *    e suborno do Professor L.
 * Modifica (envolve) funções de outros arquivos: startJob, jobInteract,
 * jobLabel, jobTarget, jobStatusText, update, crewDrawList, targetAt,
 * interactAt.
 */

"use strict";

(() => {
  const pick = (a) => a[Math.floor(Math.random() * a.length)];

  /* ===================== PROFISSÕES NOVAS ===================== */
  const NEW = {
    barbeiro: { n: "Barbeiro", icon: "sparkle", style: "salao", pay: 9, desc: "Na cadeira do Salão: decore o pedido do cliente e faça o corte certinho." },
    bibliotecario: { n: "Bibliotecário", icon: "book", style: "biblio", pay: 8, desc: "Atenda os leitores da Biblioteca e guarde os livros na ordem da numeração." },
    cavalarico: { n: "Cavalariço", icon: "horse", style: "estab", pay: 8, desc: "No Estábulo: entenda o que cada cavalo precisa e cuide dele rápido." },
    moleiro: { n: "Moleiro", icon: "bread", style: "moinho", pay: 9, desc: "No Moinho: gire a mó no ritmo certo para transformar trigo em farinha." },
    acougueiro: { n: "Açougueiro", icon: "stew", style: "acougue", pay: 9, desc: "No Açougue: pese a carne exatamente como o cliente pediu." },
    peixeiro: { n: "Peixeiro", icon: "fish", style: "peixaria", pay: 8, desc: "Na Peixaria: pese o peixe certinho, nem um grama a mais." },
    balconista: { n: "Balconista", icon: "coin", style: "armazem", pay: 8, desc: "No caixa do Armazém: cobre e dê o troco certo, com o menor número de moedas." },
    bardo: { n: "Bardo", icon: "note", style: "taverna", pay: 10, desc: "No palco da taverna: os clientes pedem músicas; toque a melodia sem desafinar." },
    joalheiro: { n: "Joalheiro", icon: "ring", style: "perola", pay: 14, desc: "Na Joalheria Pérola (Porto): avalie as pedras e separe as com defeito." },
  };
  for (const [id, p] of Object.entries(NEW)) {
    PROFESSIONS[id] = Object.assign({ kind: "inside", sim: true }, p);
    if (typeof CAREER_GICON !== "undefined") CAREER_GICON[id] = p.icon;
  }
  Object.assign(window.JOB_ORDERS || {}, {
    barbeiro: ["corte e barba", "um degradê", "aparar a franja", "raspar a barba", "corte de noivo"],
    bibliotecario: ["devolver 3 livros", "achar um livro de runas", "renovar o empréstimo", "organizar a seção de mapas"],
    cavalarico: ["cuidar do cavalo dele", "escovar a égua", "trocar a ferradura", "dar feno ao potro"],
    moleiro: ["um saco de farinha", "fubá para o bolo", "farinha de centeio", "moer a colheita dele"],
    acougueiro: ["carne para o ensopado", "costela", "linguiça", "carne moída"],
    peixeiro: ["sardinhas", "um robalo", "peixe para o almoço", "camarão"],
    balconista: ["um saco de sal", "óleo de lampião", "feijão e arroz", "pregos e corda"],
    bardo: ["a canção do dragão", "uma música romântica", "a balada da Rainha", "algo animado!"],
    joalheiro: ["avaliar um colar", "um anel de noivado", "conferir pérolas do mar", "avaliar uma herança"],
  });

  /* ===================== GUARDA REAL ===================== */
  PROFESSIONS.guarda.desc = "Receba as ordens do General Marcos: patrulhar, caçar procurados e vigiar a masmorra. Quem você prende vai algemado até o calabouço.";
  const CRIMES = ["roubo de cavalo", "furto no mercado", "briga na taverna", "sonegação do Imposto Real", "contrabando no porto", "vandalismo na fonte", "roubo de galinhas"];
  const ORDERS = {
    patrulha: ["Patrulha", "Hoje é patrulha. Passe pelos pontos marcados e fique de olho em ladrão. Ladrão preso vai para o calabouço, entendido?"],
    cacada: ["Caçar procurado", "Temos um procurado solto pela vila. Ache, prenda e traga para o calabouço. Ele vai correr. Corra mais."],
    masmorra: ["Vigiar a masmorra", "Hoje você fica na masmorra. Faça as rondas, cuide dos presos e não deixe ninguém fugir. E nada de conversa com o Professor L."],
  };
  function tomeSpot(zone = "vila") {
    const z = ZONES[zone];
    if (!z || !z.npcs) return null;
    const k = Object.keys(z.npcs).find((q) => z.npcs[q] === "tome");
    return k ? k.split(",").map(Number) : null;
  }
  const adj = (x, y) => Math.abs(player.x - x) + Math.abs(player.y - y) <= 1;

  const sjBase = startJob;
  startJob = function (id, extra) {
    sjBase(id, extra);
    const j = player.job;
    if (!j || id !== "guarda") return;
    const tipo = player.zone === "vila" || j.zone === "vila" ? pick(["patrulha", "cacada", "masmorra"]) : "patrulha";
    j.order = tipo;
    if (tipo === "cacada") {
      j.thiefT = 9999;
      j.wantedCrime = pick(CRIMES);
      setTimeout(() => {
        const cands = (game.walkers || []).filter((w) => !w.inside && Math.abs(w.x - player.x) + Math.abs(w.y - player.y) > 8);
        if (!cands.length || !player.job) return;
        const w = pick(cands);
        w.thief = true;
        w.wanted = true;
        j.wantedNm = w.nm;
        toast(`PROCURADO: ${w.nm}, por ${j.wantedCrime}. Siga a seta!`, 4000);
      }, 2500);
    }
    if (tipo === "masmorra") j.jail = { tasks: [], t: 4, rounds: [3, 10, 16].map((x) => [x, 6]), next: 0 };
    say([["General Marcos", `Guarda! Ordem do dia: ${ORDERS[tipo][0]}.`], ["General Marcos", ORDERS[tipo][1]]]);
  };

  /* ----- prender e escoltar ----- */
  const jiBase = jobInteract;
  jobInteract = function (x, y) {
    const j = player.job;
    if (j && j.id === "guarda") {
      const label = jobLabel(x, y);
      if (label && label.startsWith("Prender")) {
        const w = (game.walkers || []).find((q) => q.thief && q.x === x && q.y === y);
        const r = jiBase(x, y);
        if (w && player.zone === "vila" && tomeSpot()) {
          j.escort = { nm: w.nm, robe: w.robe, hair: w.hair, hat: w.hat || null, crime: w.wanted ? j.wantedCrime : pick(CRIMES), trail: [], x: w.x, y: w.y };
          w.inside = 99999;
          w.wanted = false;
          say([["", `Você algema ${w.nm}.`], [w.nm, pick(["Eu sou inocente! Foi o vento!", "Tá bom, tá bom, eu vou...", "Você não sabe com quem está mexendo!", "Pelo menos me deixa terminar o pão..."])], ["", "Leve o preso até o Guarda Tomé, na entrada do calabouço (siga a seta)."]]);
        }
        return r;
      }
      if (label === "Entregar o preso ao Tomé") {
        const e = j.escort;
        j.escort = null;
        j.done++;
        j.good = (j.good || 0) + 1;
        const bonus = jobPay(e.crime === j.wantedCrime ? 22 : 12);
        earn(bonus, `${e.nm} foi para o calabouço!`);
        if (typeof vilaNews === "function") vilaNews(`${e.nm} foi pres${pick(["o", "a"])} por ${e.crime}. O General Marcos elogiou a guarda.`);
        say([["Guarda Tomé", `Mais um para o calabouço. ${e.nm}, por ${e.crime}. Cela do canto.`], ["General Marcos", e.crime === j.wantedCrime ? "Era esse que eu queria. Excelente trabalho, guarda." : "Bom. A vila dorme mais tranquila hoje."]]);
        if (j.order === "cacada") (j.order = "patrulha"), (j.thiefT = 30);
        return true;
      }
    }
    return jiBase(x, y);
  };
  const jlBase = jobLabel;
  jobLabel = function (x, y) {
    const j = player.job;
    if (j && j.id === "guarda" && j.escort && player.zone === "vila") {
      const t = tomeSpot();
      if (t && t[0] === x && t[1] === y) return "Entregar o preso ao Tomé";
    }
    return jlBase(x, y);
  };
  const jtBase = jobTarget;
  jobTarget = function () {
    const j = player.job;
    if (j && j.id === "guarda" && player.zone === "vila" && (j.escort || (j.order === "masmorra" && !j.inJail))) {
      const t = tomeSpot();
      if (t) return { x: t[0], y: t[1] };
    }
    if (j && j.id === "guarda" && player.zone === "calabouco" && j.jail) {
      const tk = j.jail.tasks[0];
      if (tk) return { x: tk.x, y: tk.y };
      const r = j.jail.rounds[j.jail.next % 3];
      return { x: r[0], y: r[1] };
    }
    return jtBase();
  };
  const jsBase = jobStatusText;
  jobStatusText = function () {
    const j = player.job;
    const s = jsBase();
    if (!j || j.id !== "guarda") return s;
    const what = j.escort
      ? `Escoltando ${j.escort.nm} até o Tomé`
      : j.order === "masmorra"
        ? player.zone === "calabouco"
          ? `Masmorra: ${j.jail.tasks.length ? j.jail.tasks[0].label : "faça a ronda"}`
          : "Desça para a masmorra (fale com o Tomé)"
        : j.order === "cacada" && j.wantedNm
          ? `Procurado: ${j.wantedNm}`
          : ORDERS[j.order || "patrulha"][0];
    return s.replace(/·[^·]*·/, `· ${what} ·`);
  };

  /* ----- a masmorra durante o turno ----- */
  function jailWork(dt) {
    const j = player.job;
    if (!j || j.id !== "guarda" || j.order !== "masmorra" || player.zone !== "calabouco" || !game.jailA) return;
    j.inJail = true;
    const S = j.jail;
    const r = S.rounds[S.next % 3];
    if (Math.abs(player.x - r[0]) + Math.abs(player.y - r[1]) <= 1 && !S.tasks.length) {
      S.next++;
      j.done++;
      earn(jobPay(4), "Ronda feita: tudo em ordem.");
    }
    S.t -= dt;
    if (S.t <= 0 && S.tasks.length < 2) {
      S.t = 16 + Math.random() * 10;
      const J = game.jailA;
      const k = Math.random();
      if (k < 0.4) S.tasks.push({ kind: "agua", x: J.other.x, y: JAIL.barsY, label: "Preso pedindo água", pat: 40 });
      else if (k < 0.7 && !S.escape) {
        S.escape = { x: J.other.x, y: JAIL.barsY + 1, rx: J.other.x, ry: JAIL.barsY + 1, step: 0 };
        S.tasks.unshift({ kind: "fuga", x: S.escape.x, y: S.escape.y, label: "FUGA! Pegue o preso!", pat: 99 });
        toast("Alarme! Um preso abriu a cela e está fugindo!", 3000);
        playSound(1200, 0.2, "square");
      } else S.tasks.push({ kind: "suborno", x: J.prof.x, y: JAIL.barsY, label: "O Professor L te chama", pat: 30 });
    }
    for (const tk of S.tasks) {
      tk.pat -= dt;
      if (tk.pat <= 0 && tk.kind === "agua") {
        j.bad = (j.bad || 0) + 1;
        toast("O preso ficou sem água. O General vai saber disso.", 2400);
      }
    }
    S.tasks = S.tasks.filter((tk) => tk.pat > 0);
    const E = S.escape;
    if (E) {
      E.rx += (E.x - E.rx) * Math.min(1, dt * 8);
      E.ry += (E.y - E.ry) * Math.min(1, dt * 8);
      E.step -= dt;
      if (E.step <= 0) {
        E.step = 0.55;
        const ex = JAIL.exit[0],
          ey = JAIL.h - 2;
        if (E.x !== ex) E.x += Math.sign(ex - E.x);
        else if (E.y < ey) E.y++;
        const tk = S.tasks.find((q) => q.kind === "fuga");
        if (tk) (tk.x = E.x), (tk.y = E.y);
        if (E.x === ex && E.y >= ey) {
          S.escape = null;
          S.tasks = S.tasks.filter((q) => q.kind !== "fuga");
          j.bad = (j.bad || 0) + 2;
          say([["", "O preso escapou pela escada!"], ["General Marcos", "UM PRESO FUGIU NO SEU TURNO?! Isso vai para a sua ficha, guarda."]]);
        }
      }
    }
  }
  function jailTaskAt(x, y) {
    const j = player.job;
    if (!j || !j.jail || player.zone !== "calabouco") return null;
    return j.jail.tasks.find((tk) => (tk.kind === "fuga" ? tk.x === x && tk.y === y : tk.x === x && Math.abs(tk.y - y) <= 0));
  }
  function doJailTask(tk) {
    const j = player.job,
      S = j.jail;
    S.tasks = S.tasks.filter((q) => q !== tk);
    if (tk.kind === "agua") {
      j.done++;
      j.good = (j.good || 0) + 1;
      earn(jobPay(3), "Você deu água ao preso.");
      return say([["Preso", pick(["Obrigado, guarda. Você é dos bons.", "Finalmente! Essa cela parece um forno.", "Que as runas te paguem em dobro."])]]);
    }
    if (tk.kind === "fuga") {
      S.escape = null;
      j.done++;
      j.good = (j.good || 0) + 2;
      game.shake = 0.2;
      earn(jobPay(15), "Fuga impedida!");
      return say([["", "Você agarra o fugitivo pela gola e o arrasta de volta para a cela."], ["General Marcos", "Ouvi o alarme. Bom reflexo, guarda. Muito bom."]]);
    }
    if (tk.kind === "suborno")
      return choice("Professor L", '"Psiu. 30 de ouro se você esquecer a minha cela destrancada hoje à noite. Ninguém precisa saber."', [
        {
          t: "Recusar e avisar o General",
          icon: "shield",
          fn: () => ((j.good = (j.good || 0) + 2), addFriendship("marcos", 3), say([["Professor L", "Honesto. Que tédio."], ["General Marcos", "Ele tentou te comprar? Típico. Fez bem, guarda."]])),
        },
        {
          t: "Aceitar os 30 de ouro",
          icon: "coin",
          fn: () => {
            player.gold += 30;
            if (Math.random() < 0.45) {
              player.fired = player.fired || {};
              player.fired.guarda = player.day + 7;
              repAdd(-6);
              say([["General Marcos", "Eu vi você pegando o ouro daquele careca. Entregue o uniforme. Você está FORA da guarda por 7 dias."]], () => endJob("O General te expulsou do turno."));
            } else say([["Professor L", "Pessoa sensata. Raro por aqui."], ["", "Ninguém viu... desta vez."]]);
          },
        },
      ]);
  }
  const tgBase = targetAt;
  targetAt = function (x, y) {
    const tk = jailTaskAt(x, y);
    if (tk) return tk.label;
    return tgBase(x, y);
  };
  const iaBase = interactAt;
  interactAt = function (x, y) {
    const tk = jailTaskAt(x, y);
    if (tk) return doJailTask(tk);
    return iaBase(x, y);
  };
  // O Tomé também leva você para a masmorra durante o turno.
  const lsBase = lifeSocialItems;
  lifeSocialItems = function (id) {
    const items = lsBase.apply(this, arguments);
    const j = player.job;
    if (id === "tome" && j && j.id === "guarda" && j.order === "masmorra") items.unshift({ t: "Descer para a masmorra (turno)", icon: "lock", fn: () => enterJail(false) });
    return items;
  };

  /* ----- desenho: preso algemado e fugitivo ----- */
  const upBase = update;
  update = function (dt) {
    upBase(dt);
    const j = player.job;
    if (!j || j.id !== "guarda") return;
    const e = j.escort;
    if (e) {
      const last = e.trail[e.trail.length - 1];
      if (!last || last[0] !== player.x || last[1] !== player.y) e.trail.push([player.x, player.y]);
      if (e.trail.length > 2) e.trail.shift();
      const tg = e.trail.length > 1 ? e.trail[0] : [e.x, e.y];
      e.x += (tg[0] - e.x) * Math.min(1, dt * 6);
      e.y += (tg[1] - e.y) * Math.min(1, dt * 6);
    }
    if (game.mode === "world" && !game.dialog) jailWork(Math.min(dt, 0.1));
  };
  const cdBase = crewDrawList;
  crewDrawList = function (list, t) {
    cdBase(list, t);
    const j = player.job;
    if (!j || j.id !== "guarda") return;
    const e = j.escort;
    if (e && player.zone === "vila")
      list.push({
        y: e.y,
        draw: () => {
          drawSprite(wizardRects(e.robe || "#6a5a4a", e.hat, e.hair || "#3a2414", null, "down", walkFrame(true, t)), e.x * TILE, e.y * TILE, 2);
          ctx.fillStyle = "#c8c8d8";
          ctx.fillRect(e.x * TILE + 11, e.y * TILE + 22, 10, 3);
        },
      });
    const E = j.jail && j.jail.escape;
    if (E && player.zone === "calabouco")
      list.push({
        y: E.ry,
        draw: () => {
          drawSprite(wizardRects("#6a5a4a", null, "#3a2414", null, "down", walkFrame(true, t)), E.rx * TILE, E.ry * TILE, 2);
          drawPixelIcon("anger", E.rx * TILE + 16, E.ry * TILE - 10, 2);
        },
      });
    if (j.jail && player.zone === "calabouco")
      for (const tk of j.jail.tasks)
        if (tk.kind !== "fuga") list.push({ y: tk.y + 0.5, draw: () => drawPixelIcon(tk.kind === "agua" ? "water" : "coin", tk.x * TILE + 16, tk.y * TILE - 8 - Math.abs(Math.sin(t * 4)) * 3, 2) });
  };
})();
