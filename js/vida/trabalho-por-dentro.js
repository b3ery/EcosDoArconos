/**
 * ECOS DO ARCANO — trabalho-por-dentro.js
 * Trabalhos com realismo:
 *  - Os ofícios de oficina (padeiro, ferreiro, costureiro...) e o taverneiro
 *    agora trabalham DENTRO do prédio. O dono sai para descansar e você fica
 *    atrás do balcão: clientes entram, fazem fila, pedem, perdem a paciência.
 *    Cada pedido é preparado num minijogo; a qualidade e a rapidez mudam o
 *    pagamento e a gorjeta.
 *  - Taverneiro: além do balcão, as mesas pedem. Prepare no balcão, carregue
 *    a bandeja e entregue na mesa certa.
 *  - Carteiro (cartas registradas, casa vazia, gorjetas), enfermeiro
 *    (diagnóstico do doente) e acendedor (lata de óleo que acaba).
 *  - Avaliação do patrão no fim de cada turno: bônus, advertência e demissão.
 *  - Comércio próprio: compre um negócio da vila, compre estoque, defina o
 *    preço, contrate atendente. Os aldeões compram todo dia; o livro-caixa
 *    mostra receita, imposto, salário, aluguel, perdas e lucro ou prejuízo.
 *    Você também pode atender no balcão do seu comércio.
 * Modifica (envolve) funções de outros arquivos: jobAvailableHere, jobLabel,
 * jobInteract, jobTarget, jobStatusText, startJob, endJob, swingFeedback,
 * targetAt, interactAt, walkable, crewDrawList, update, onNewDay, openCareers.
 */

"use strict";

(() => {
  const rnd = (a, b) => a + Math.random() * (b - a);
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const cap = (s) => s[0].toUpperCase() + s.slice(1);
  const curJob = () => player.job;
  const prof = (j) => j && PROFESSIONS[j.id];

  /* ===================== ONDE CADA UM TRABALHA ===================== */

  PROFESSIONS.taverneiro.kind = "inside";
  PROFESSIONS.taverneiro.style = "taverna";
  PROFESSIONS.taverneiro.pay = 7;
  PROFESSIONS.taverneiro.desc = "Você assume o balcão da taverna no lugar do taverneiro: sirva quem chega ao balcão e leve os pedidos às mesas antes que percam a paciência.";
  for (const id of ["padeiro", "ferreiro", "costureiro", "cozinheiro", "escriba", "boticario", "pintor", "marceneiro", "professor"])
    if (PROFESSIONS[id]) PROFESSIONS[id].desc = PROFESSIONS[id].desc.replace("Na porta da", "Dentro da").replace(/^Na cozinha/, "Dentro da cozinha") + " Clientes entram e fazem fila no balcão.";

  /** Nome do prédio onde o trabalho acontece, na zona do turno. */
  function workPlace(j, zone = j.zone) {
    const p = prof(j);
    if (!p) return null;
    if (p.kind === "station") return findBuilding(zone, p.place) ? p.place : null;
    if (p.kind === "inside") {
      const town = ZONES[zone] && ZONES[zone].town;
      const b = town && town.bld.find((q) => q.style === p.style && q.name);
      return b ? b.name : null;
    }
    return null;
  }
  const insideJob = (j) => j && prof(j) && (prof(j).kind === "station" || prof(j).kind === "inside");
  function atWork() {
    const j = curJob();
    if (!insideJob(j) || player.zone !== "interior" || !game.inter || !game.inter.b) return false;
    return (player.ret ? player.ret.zone : j.zone) === j.zone && game.inter.b.name === workPlace(j);
  }

  const ORDERS = {
    padeiro: ["2 pães de milho", "um bolo de fubá", "pão doce com coco", "uma broa", "6 pãezinhos", "rosca de canela"],
    ferreiro: ["uma ferradura", "pregos de telhado", "uma enxada", "dobradiças", "conserto de espada", "uma panela de ferro"],
    costureiro: ["barra da calça", "um vestido de festa", "remendo na capa", "botões novos", "uma túnica", "ajuste no manto"],
    cozinheiro: ["ensopado", "sopa de abóbora", "torta de carne", "peixe frito", "costela no mel", "omelete de ervas"],
    escriba: ["cópia de um contrato", "uma carta de amor", "um testamento", "página de um livro", "um convite de casamento"],
    boticario: ["xarope de tosse", "pomada de arnica", "chá para dormir", "remédio de febre", "unguento de queimadura"],
    pintor: ["retrato da família", "paisagem do rio", "placa de loja", "retrato do cachorro", "quadro de flores"],
    marceneiro: ["uma cadeira", "conserto de mesa", "um banquinho", "uma estante", "berço de bebê", "uma porta nova"],
    professor: ["dúvida de conta", "ler um texto", "ditado", "mapa dos reinos", "tabuada do 7"],
  };
  const STEPS = {
    padeiro: ["Sovar a massa", "Modelar", "Tirar do forno"],
    ferreiro: ["Esquentar o ferro", "Martelar", "Temperar na água"],
    costureiro: ["Cortar o tecido", "Costurar", "Pregar os botões"],
    cozinheiro: ["Picar", "Mexer o caldeirão", "Temperar"],
    escriba: ["Molhar a pena", "Copiar", "Secar a tinta"],
    boticario: ["Moer as ervas", "Ferver", "Engarrafar"],
    pintor: ["Misturar as tintas", "Pintar o fundo", "Dar os detalhes"],
    marceneiro: ["Serrar", "Lixar", "Encaixar"],
    professor: ["Explicar", "Dar um exemplo", "Conferir"],
  };
  const COMPLAINTS = ["Isso aqui tá malfeito...", "Eu esperava mais.", "Vou pensar antes de voltar.", "Hmm. Serve."];
  const PRAISES = ["Perfeito! Volto amanhã.", "Que capricho!", "Melhor da vila!", "Obrigad" + "o! Fica com o troco."];

  /* ===================== O BALCÃO (fila de clientes) ===================== */

  function counterSpots(I) {
    const z = ZONES.interior;
    const out = [];
    const cx = I.kx0 + 1;
    for (let x = cx - 1; x <= cx + 1; x++) {
      const y = I.st === "castle" ? 4 : 5;
      if (tileAt("interior", x, y) !== ".") continue;
      const ip = interPropAt(x, y);
      if (ip && SOLID_PROPS.has(ip[0])) continue;
      if (I.people.some((p) => p.x === x && p.y === y)) continue;
      out.push([x, y]);
    }
    return out.length ? out : [[cx, Math.min(z.h - 3, 5)]];
  }
  function takeCounter(mode) {
    const I = game.inter;
    if (!I || I.work) return;
    I.kx0 = I.kx;
    I.ky0 = I.ky;
    I.work = { mode, cust: [], spawn: 1.5, tray: null, tableT: 8 };
    I.kx = -20;
    I.ky = -20;
    player.x = I.kx0;
    player.y = I.ky0;
    if ("rx" in player) (player.rx = player.x), (player.ry = player.y);
    player.dir = "down";
    const who = I.keeper.split(",")[0];
    if (mode === "job") toast(`${who} foi descansar. Hoje quem cuida do balcão é você!`, 3200);
    else toast(`Você assume o balcão do seu comércio. ${who} vai arrumar o estoque.`, 3200);
    playSound(660, 0.1, "sine");
  }
  function releaseCounter(msg) {
    const I = game.inter;
    if (!I || !I.work) return;
    I.kx = I.kx0;
    I.ky = I.ky0;
    for (const p of I.people) p.order = null;
    I.work = null;
    if (msg) toast(msg, 2600);
  }
  game.inter && (game.inter.work = null);

  function newCustomer(I) {
    const W = I.work;
    const spots = counterSpots(I).filter(([x, y]) => !W.cust.some((c) => c.tx === x && c.ty === y && c.state !== "out"));
    if (!spots.length) return;
    const [tx, ty] = pick(spots);
    const z = ZONES.interior;
    const door = z.town.arrive;
    const robes = ["#8a3a3a", "#3a6a8a", "#5a7a3a", "#8a6a2a", "#6a3a7a", "#2a6a6a", "#a8602a"];
    const hairs = ["#3a2414", "#d9a441", "#1a1a1a", "#8a3a1a", "#d9d9d9", "#5a3a22"];
    const j = curJob();
    let want;
    if (W.mode === "biz") want = pick(BIZ[I.st].goods);
    else if (j.id === "taverneiro") want = pick(TAVERN_MENU);
    else want = pick(ORDERS[j.id] || ["uma encomenda"]);
    const pat = W.mode === "biz" ? rnd(35, 50) : rnd(38, 55);
    W.cust.push({ x: door[0], y: door[1], tx, ty, state: "in", want, pat, max: pat, nm: pick(WALKER_NAMES), robe: pick(robes), hair: pick(hairs) });
  }
  const custAtSpot = (x, y) => {
    const W = game.inter && game.inter.work;
    return W && W.cust.find((c) => c.state === "wait" && c.tx === x && c.ty === y);
  };
  /** O cliente que você atende olhando para (x, y): o próprio cliente ou o balcão na frente dele. */
  function custFor(x, y) {
    const W = game.inter && game.inter.work;
    if (!W) return null;
    return custAtSpot(x, y) || (tileAt("interior", x, y) === "Q" ? custAtSpot(x, y + 1) : null);
  }
  const wantName = (cu) => (typeof cu.want === "string" ? cu.want : cu.want.n);
  const isDrink = (m) => !!(m.drunk || m.water) && !m.food;

  function leave(cu, angry) {
    cu.state = "out";
    const door = ZONES.interior.town.arrive;
    cu.tx = door[0];
    cu.ty = door[1];
    cu.mood = angry ? "anger" : "heart";
    cu.moodT = 2;
  }

  /* ---------- servir no balcão (emprego) ---------- */
  function serveJobCustomer(cu) {
    const j = curJob(),
      p = prof(j);
    const tav = j.id === "taverneiro";
    const m = cu.want;
    const steps = tav ? (isDrink(m) ? ["Pegar a caneca", "Encher do barril", "Entregar sem derramar"] : ["Pegar o prato", "Servir do caldeirão", "Enfeitar o prato"]) : STEPS[j.id] || ["Preparar", "Caprichar", "Entregar"];
    const icon = tav ? (isDrink(m) ? "mug" : "stew") : p.icon;
    timingGame(`${cu.nm}: ${wantName(cu)}`, icon, steps, tav ? "Aperte no verde. Capricho e rapidez rendem gorjeta." : `Encomenda de ${cu.nm}. Capricho e rapidez rendem gorjeta.`, (s, max) => {
      const q = s / max,
        mood = cu.pat / cu.max;
      const pay = Math.max(1, Math.round(jobPay(p.pay) * (0.5 + q)));
      const tip = q >= 0.66 && mood > 0.4 ? 1 + Math.floor(Math.random() * (tav ? 6 : 4)) : 0;
      j.done++;
      if (q < 0.4) {
        j.bad = (j.bad || 0) + 1;
        game.bubbles.push({ x: cu.tx, y: cu.ty, icon: "meh", t: 1.6 });
        toast(`${cu.nm}: "${pick(COMPLAINTS)}"`, 2200);
      } else {
        j.good = (j.good || 0) + 1;
        if (q >= 0.83) toast(`${cu.nm}: "${pick(PRAISES)}"`, 2000);
      }
      earn(pay + tip, `${cap(wantName(cu))} pronto${tip ? ` (+${tip} de gorjeta)` : ""}!`);
      if (lifeMode()) addNeed("energy", -1);
      leave(cu, q < 0.4);
    });
  }

  /* ---------- mesas da taverna ---------- */
  const seated = (I) => I.people.filter((p) => !p.guard && !p.kid && !p.child && !p.dance && !p.left);
  function prepareTable() {
    const I = game.inter,
      W = I.work;
    const list = seated(I).filter((p) => p.order);
    if (!list.length) return toast("Nenhuma mesa pediu nada ainda.", 1500);
    choice(
      "Preparar pedido da mesa",
      "Qual pedido você prepara agora? Os que estão esperando há mais tempo ficam impacientes.",
      list
        .sort((a, b) => a.order.pat - b.order.pat)
        .map((pe) => ({
          t: `${pe.order.m.n} para ${pe.nm} (${Math.ceil(pe.order.pat)}s)`,
          icon: isDrink(pe.order.m) ? "mug" : "stew",
          fn: () =>
            timingGame(`Preparar: ${pe.order.m.n}`, isDrink(pe.order.m) ? "mug" : "stew", isDrink(pe.order.m) ? ["Pegar a caneca", "Encher", "Tirar a espuma"] : ["Esquentar", "Servir", "Arrumar a bandeja"], `Depois leve até ${pe.nm}.`, (s, max) => {
              W.tray = { pe, m: pe.order.m, q: s / max };
              toast(`Bandeja pronta: ${pe.order.m.n}. Leve até ${pe.nm}!`, 2000);
            }),
        }))
        .concat([{ t: "Voltar", fn: null }]),
    );
  }
  function deliverTable(pe) {
    const I = game.inter,
      W = I.work,
      j = curJob();
    const tr = W.tray;
    if (tr.pe !== pe) {
      j.bad = (j.bad || 0) + 1;
      toast(`${pe.nm}: "Não foi isso que eu pedi! É da mesa de ${tr.pe.nm}."`, 2400);
      playSound(200, 0.1, "square");
      return;
    }
    const q = tr.q,
      mood = pe.order.pat / pe.order.max;
    const pay = Math.max(1, Math.round(jobPay(PROFESSIONS.taverneiro.pay) * (0.5 + q)));
    const tip = q >= 0.66 && mood > 0.35 ? 2 + Math.floor(Math.random() * 6) : 0;
    j.done++;
    if (q < 0.4) j.bad = (j.bad || 0) + 1;
    else j.good = (j.good || 0) + 1;
    game.bubbles.push({ x: pe.x, y: pe.y, icon: q < 0.4 ? "meh" : "heart", t: 1.4 });
    earn(pay + tip, `${tr.m.n} na mesa de ${pe.nm}${tip ? ` (+${tip} de gorjeta)` : ""}!`);
    pe.order = null;
    pe.cool = rnd(15, 30);
    W.tray = null;
  }

  /* ---------- balcão do seu comércio ---------- */
  function serveBizCustomer(cu) {
    const I = game.inter,
      b = player.biz[I.b.name],
      S = BIZ[b.style];
    const price = bizUnitPrice(b);
    if (b.stock <= 0) {
      toast(`${cu.nm}: "Acabou o estoque? Que pena..."`, 2200);
      bizNote(b, "Cliente voltou sem comprar: faltou estoque.");
      return leave(cu, true);
    }
    const sell = (pr, extra) => {
      const chance = [0.97, 0.88, 0.6, 0.35][b.lv] + ((player.rep ?? 50) - 50) / 300 + extra;
      if (Math.random() < chance) {
        const tax = bizTax(pr);
        b.stock--;
        b.today.sold++;
        b.today.rev += pr;
        b.today.tax += tax;
        b.cash += pr - tax;
        playSound(988, 0.06, "sine");
        game.bubbles.push({ x: cu.tx, y: cu.ty, icon: "coin", t: 1.4 });
        toast(`Vendeu ${cu.want} por ${pr} ouro${tax ? ` (−${tax} de Imposto Real)` : ""}. Foi para o caixa.`, 2200);
        leave(cu, false);
      } else {
        toast(`${cu.nm}: "${pick(["Tá caro demais!", "No Empório é mais barato.", "Vou pensar...", "Com esse preço? Nem pensar."])}"`, 2200);
        bizNote(b, "Cliente achou caro e foi embora.");
        leave(cu, true);
      }
    };
    choice(`${cu.nm} quer ${cu.want}`, `Seu preço: ${price} ouro (${BIZ_LV[b.lv].n}). Estoque: ${b.stock}. Custo de cada um: ${S.cost} ouro.`, [
      { t: `Vender por ${price} ouro`, icon: "coin", fn: () => sell(price, 0) },
      { t: `Dar desconto: ${Math.max(1, Math.round(price * 0.8))} ouro`, icon: "smile", fn: () => sell(Math.max(1, Math.round(price * 0.8)), 0.25) },
      { t: "Dispensar o cliente", fn: () => leave(cu, true) },
    ]);
  }

  /* ---------- a cada quadro ---------- */
  function workTick(dt) {
    const I = game.inter;
    if (player.zone !== "interior" || !I) return;
    if (!I.work && atWork()) takeCounter("job");
    const W = I.work;
    if (!W) return;
    if (W.mode === "job" && !atWork()) return releaseCounter(`${I.keeper.split(",")[0]} voltou ao balcão: "Bom trabalho hoje!"`);
    if (W.mode === "biz" && !(player.biz && player.biz[I.b.name])) return releaseCounter();
    if (game.mode !== "world" || game.dialog) return;
    const j = curJob();
    W.spawn -= dt;
    const waiting = W.cust.filter((c) => c.state !== "out").length;
    if (W.spawn <= 0) {
      if (waiting < 3) newCustomer(I);
      const lv = W.mode === "biz" ? player.biz[I.b.name].lv : 1;
      W.spawn = (W.mode === "biz" ? rnd(6, 10) * [0.75, 1, 1.4, 1.9][lv] : j && j.id === "taverneiro" ? rnd(10, 15) : rnd(7, 11)) * (festivalToday() ? 0.7 : 1);
    }
    for (const c of W.cust) {
      const dx = c.tx - c.x,
        dy = c.ty - c.y,
        d = Math.hypot(dx, dy);
      if (d > 0.05) {
        const s = Math.min(d, dt * 2.6);
        c.x += (dx / d) * s;
        c.y += (dy / d) * s;
        c.dir = Math.abs(dy) > Math.abs(dx) ? (dy < 0 ? "up" : "down") : dx < 0 ? "left" : "right";
        c.walk = true;
      } else {
        c.x = c.tx;
        c.y = c.ty;
        c.walk = false;
        if (c.state === "in") (c.state = "wait"), (c.dir = "up");
        else if (c.state === "out") c.gone = true;
      }
      if (c.moodT) c.moodT -= dt;
      if (c.state === "wait") {
        c.pat -= dt;
        if (c.pat <= 0) {
          toast(`${c.nm} cansou de esperar e foi embora.`, 2000);
          if (W.mode === "job" && j) j.bad = (j.bad || 0) + 1;
          if (W.mode === "biz") bizNote(player.biz[I.b.name], "Um cliente desistiu de esperar na fila.");
          leave(c, true);
        }
      }
    }
    W.cust = W.cust.filter((c) => !c.gone);
    // mesas da taverna
    if (W.mode === "job" && j && j.id === "taverneiro") {
      W.tableT -= dt;
      const ppl = seated(I);
      for (const pe of ppl) {
        if (pe.cool) pe.cool = Math.max(0, pe.cool - dt);
        if (!pe.order) continue;
        pe.order.pat -= dt;
        if (pe.order.pat <= 0) {
          toast(`${pe.nm} desistiu do pedido e reclamou do atendimento!`, 2200);
          game.bubbles.push({ x: pe.x, y: pe.y, icon: "anger", t: 1.8 });
          j.bad = (j.bad || 0) + 1;
          if (W.tray && W.tray.pe === pe) W.tray = null;
          pe.order = null;
          pe.cool = 25;
        }
      }
      if (W.tableT <= 0) {
        W.tableT = rnd(9, 16);
        const free = ppl.filter((p) => !p.order && !p.cool);
        if (free.length && ppl.filter((p) => p.order).length < 3) {
          const pe = pick(free);
          const pat = rnd(50, 70);
          pe.order = { m: pick(TAVERN_MENU), pat, max: pat };
          toast(`${pe.nm} chamou: "${pick(["Ô, taverneir" + genderWord("o", "a", "e") + "!", "Me vê um", "Aqui, por favor!"])} ${pe.order.m.n}!"`, 2000);
          playSound(740, 0.05, "triangle");
        }
      }
    }
  }

  /* ---------- desenho ---------- */
  function patBar(x, y, f) {
    ctx.fillStyle = "rgba(0,0,0,.55)";
    ctx.fillRect(x * TILE + 4, y * TILE - 12, 24, 5);
    ctx.fillStyle = f > 0.5 ? "#7ad36b" : f > 0.25 ? "#f2c14e" : "#e05050";
    ctx.fillRect(x * TILE + 5, y * TILE - 11, 22 * Math.max(0, f), 3);
  }
  function drawWork(list, t) {
    const I = game.inter;
    if (player.zone !== "interior" || !I || !I.work) return;
    const W = I.work;
    const j = curJob();
    for (const c of W.cust)
      list.push({
        y: c.y,
        draw: () => {
          ctx.fillStyle = "rgba(0,0,0,.22)";
          ctx.beginPath();
          ctx.ellipse(c.x * TILE + 16, c.y * TILE + 30, 8, 3, 0, 0, 7);
          ctx.fill();
          drawSprite(wizardRects(c.robe, null, c.hair, null, c.dir || "up", c.walk ? walkFrame(true, t) : 0), c.x * TILE, c.y * TILE, 2);
          if (c.state === "wait") {
            patBar(c.x, c.y, c.pat / c.max);
            const ic = W.mode === "biz" ? BIZ[I.st].icon : j && j.id === "taverneiro" ? (isDrink(c.want) ? "mug" : "stew") : prof(j).icon;
            drawPixelIcon(ic, c.x * TILE + 16, c.y * TILE - 22 - Math.abs(Math.sin(t * 3)) * 2, 2);
          } else if (c.moodT > 0) drawPixelIcon(c.mood, c.x * TILE + 16, c.y * TILE - 14, 2);
        },
      });
    if (j && j.id === "taverneiro")
      for (const pe of seated(I))
        if (pe.order)
          list.push({
            y: pe.y + 0.01,
            draw: () => {
              patBar(pe.x, pe.y, pe.order.pat / pe.order.max);
              drawPixelIcon(isDrink(pe.order.m) ? "mug" : "stew", pe.x * TILE + 16, pe.y * TILE - 22 - Math.abs(Math.sin(t * 3 + pe.x)) * 2, 2);
            },
          });
    if (W.tray)
      list.push({
        y: player.y + 0.05,
        draw: () => drawPixelIcon(isDrink(W.tray.m) ? "mug" : "stew", player.x * TILE + 16, player.y * TILE - 14, 2),
      });
  }

  /* ===================== RONDAS COM REALISMO ===================== */

  const SYMPTOMS = [
    { s: "febre alta e calafrios", r: "Chá de casca de salgueiro e pano frio na testa" },
    { s: "tosse seca que não para", r: "Xarope de mel com guaco" },
    { s: "um corte fundo na mão", r: "Limpar com água fervida e enfaixar" },
    { s: "dor de barriga depois do almoço", r: "Chá de hortelã e jejum leve" },
    { s: "tornozelo inchado de uma queda", r: "Compressa fria e perna para cima" },
    { s: "queimadura de panela no braço", r: "Água fria corrente e unguento" },
    { s: "dor de cabeça e cansaço", r: "Água, descanso e chá de camomila" },
  ];
  function nurseVisit(x, y, base) {
    const j = curJob();
    const sy = pick(SYMPTOMS);
    const wrong = SYMPTOMS.filter((q) => q !== sy)
      .sort(() => Math.random() - 0.5)
      .slice(0, 2);
    const who = pick(WALKER_NAMES);
    const opts = [sy, ...wrong].sort(() => Math.random() - 0.5);
    choice(`Visita: ${who}`, `${who} está com ${sy.s}. O que você faz?`, opts.map((o) => ({
      t: o.r,
      icon: "potion",
      fn: () => {
        base(x, y);
        if (o === sy) {
          j.good = (j.good || 0) + 1;
          say([[who, pick(["Já estou me sentindo melhor. Obrigad" + "o!", "Que mãos boas! Deus te abençoe.", "Vou contar pro hospital que você é ótim" + genderWord("o", "a", "e") + "."])]]);
        } else {
          j.bad = (j.bad || 0) + 1;
          const back = Math.ceil(jobPay(PROFESSIONS.enfermeiro.pay) / 2);
          player.gold -= back;
          j.earned -= back;
          toast(`Tratamento errado: ${who} piorou. O Hospital descontou ${back} ouro.`, 3200);
          repAdd(-1);
        }
      },
    })));
  }
  function mailVisit(x, y, base, label) {
    const j = curJob();
    const who = label.includes("Casa de morador") ? pick(WALKER_NAMES) : label.split(": ")[1];
    const r = Math.random();
    if (r < 0.2) {
      choice("Carta registrada", `É uma carta registrada para ${who}. Precisa de assinatura.`, [
        {
          t: "Bater e pedir a assinatura",
          icon: "scroll",
          fn: () => {
            base(x, y);
            j.good = (j.good || 0) + 1;
            passMin(5);
            toast(`${who} assinou. Serviço correto!`, 2000);
          },
        },
        {
          t: "Deixar embaixo da porta (mais rápido)",
          fn: () => {
            base(x, y);
            j.bad = (j.bad || 0) + 1;
            toast("Carta registrada sem assinatura! O correio vai receber uma reclamação.", 2800);
          },
        },
      ]);
      return true;
    }
    base(x, y);
    if (r < 0.4) {
      const tip = 1 + Math.floor(Math.random() * 3);
      player.gold += tip;
      j.earned += tip;
      toast(`${who} abriu a porta sorrindo e te deu ${tip} de gorjeta.`, 2400);
    } else if (r < 0.55) toast(`Ninguém em casa. Você deixou a carta de ${who} embaixo da porta.`, 2200);
    else if (r < 0.65) {
      toast("Um cachorro bravo te perseguiu até a esquina! Você perdeu uns minutos.", 2400);
      passMin(10);
    }
    return true;
  }

  /* ===================== ENVOLVENDO OS EMPREGOS ===================== */

  const javBase = jobAvailableHere;
  jobAvailableHere = function (id, zone) {
    const p = PROFESSIONS[id];
    if (p && p.kind === "inside") return lifeMode() && !!workPlace({ id, zone }, zone);
    return javBase(id, zone);
  };
  const sjBase = startJob;
  startJob = function (id, extra) {
    const f = player.fired && player.fired[id];
    if (f && f > player.day) return say([["", `O patrão de ${PROFESSIONS[id] ? PROFESSIONS[id].n : "lá"} não quer você de volta até o dia ${f}. Três advertências dão nisso!`]]);
    sjBase(id, extra);
    const j = curJob();
    if (!j) return;
    j.good = 0;
    j.bad = 0;
    j.miss = 0;
    if (id === "acendedor") j.oil = 4;
    if (insideJob(j)) toast(`Vá até ${workPlace(j) || "o seu posto"} (siga a seta) e entre: você trabalha lá dentro.`, 3000);
  };
  const sfBase = swingFeedback;
  swingFeedback = function (x, y, icon) {
    const q = sfBase(x, y, icon);
    const j = curJob();
    if (j) {
      if (!q) j.miss = (j.miss || 0) + 1;
      if (q === 2) j.good = (j.good || 0) + 0.25;
    }
    return q;
  };
  const armazem = (j) => findBuilding(j.zone, "Armazém Geral") || findBuilding(j.zone, "Armazém do Cais") || findBuilding(j.zone, "Armazém Anão");
  const jlBase = jobLabel;
  jobLabel = function (x, y) {
    const j = curJob(),
      p = prof(j);
    if (p && player.zone === j.zone) {
      if (p.kind === "station") {
        const s = stationSpot(j);
        if (s && s.x === x && s.y === y) return null; // a porta só serve para entrar
      }
      if (j.id === "acendedor" && j.oil <= 0) {
        const a = armazem(j);
        if (a && a.x === x && a.y === y) return "Encher a lata de óleo";
      }
    }
    return jlBase(x, y);
  };
  const jiBase = jobInteract;
  jobInteract = function (x, y) {
    const j = curJob(),
      p = prof(j);
    const label = jobLabel(x, y);
    if (p && label && p.kind === "rounds" && label.startsWith(p.verb)) {
      if (j.id === "acendedor") {
        if ((j.oil ?? 4) <= 0) {
          toast("A lata de óleo acabou! Encha no Armazém (siga a seta).", 2400);
          return true;
        }
        j.oil--;
        if (Math.random() < 0.15) toast("O vento quase apagou a chama... mas pegou!", 1600);
        const r = jiBase(x, y);
        if (j.oil <= 0) toast("Lata de óleo vazia. Vá encher no Armazém.", 2400);
        return r;
      }
      if (j.id === "enfermeiro") return nurseVisit(x, y, jiBase), true;
      if (j.id === "carteiro") return mailVisit(x, y, jiBase, label);
    }
    if (label === "Encher a lata de óleo") {
      j.oil = 4;
      playSound(400, 0.1, "triangle");
      toast("Lata cheia: dá para acender mais 4 lampiões.", 2000);
      return true;
    }
    return jiBase(x, y);
  };
  const jtBase = jobTarget;
  jobTarget = function () {
    const j = curJob(),
      p = prof(j);
    if (p && player.zone === j.zone) {
      if (j.id === "acendedor" && j.oil <= 0) return armazem(j);
      if (p.kind === "inside") {
        const n = workPlace(j);
        return n ? findBuilding(j.zone, n) : null;
      }
    }
    return jtBase();
  };
  const jsBase = jobStatusText;
  jobStatusText = function () {
    const j = curJob(),
      p = prof(j);
    if (!insideJob(j) && !(j && j.id === "acendedor")) return jsBase();
    const left = Math.max(0, j.endAt - absMinutes());
    const time = `${Math.floor(left / 60)}h${String(Math.floor(left % 60)).padStart(2, "0")}`;
    const ev = ` · ${iconText("+", Math.floor(j.good || 0))} ${iconText("−", j.bad || 0)}`;
    if (j.id === "acendedor") return jsBase().replace(" · siga a seta", ` · óleo ${j.oil}/4 · siga a seta`);
    const where = workPlace(j);
    const what = atWork() ? (j.id === "taverneiro" ? `Balcão e mesas de ${where}` : `No balcão: ${where}`) : `Vá até ${where} e entre`;
    return `${careerTitle(j.id)} · ${what}${ev} · ${j.earned} ouro · ${time}`;
  };
  const iconText = (s, n) => `${s}${n}`;

  /* Avaliação do patrão no fim do turno (vale para todas as profissões). */
  const ejBase = endJob;
  endJob = function (reason) {
    const j = curJob();
    let note = null;
    if (j && PROFESSIONS[j.id]) {
      const bad = (j.bad || 0) + Math.floor((j.miss || 0) / 4);
      const good = Math.floor(j.good || 0);
      player.warns = player.warns || {};
      if (j.done >= 3 && bad === 0) {
        const bonus = Math.max(2, Math.round(j.earned * 0.15));
        player.gold += bonus;
        j.earned += bonus;
        note = `Avaliação do patrão: excelente! Bônus de ${bonus} ouro.`;
        if (player.warns[j.id]) player.warns[j.id]--;
      } else if (bad >= 3 && bad > good) {
        player.warns[j.id] = (player.warns[j.id] || 0) + 1;
        if (player.warns[j.id] >= 3) {
          player.warns[j.id] = 0;
          player.fired = player.fired || {};
          player.fired[j.id] = player.day + 3;
          note = `Avaliação do patrão: péssima. Terceira advertência: você foi DEMITID${genderWord("O", "A", "E")} de ${PROFESSIONS[j.id].n} por 3 dias.`;
        } else note = `Avaliação do patrão: muitas reclamações. Advertência ${player.warns[j.id]}/3.`;
      } else if (j.done > 0) note = `Avaliação do patrão: ${good > bad ? "bom trabalho" : "dá para melhorar"} (${good} elogio(s), ${bad} reclamação(ões)).`;
    }
    ejBase(reason);
    if (note) setTimeout(() => toast(note, 4200), 1400);
  };

  /* ===================== COMÉRCIO PRÓPRIO ===================== */

  const BIZ = {
    padaria: { goods: ["um pão de milho", "um bolo de fubá", "uma broa", "pão doce"], cost: 2, price: 5, demand: 16, perish: true, value: 600, icon: "bread" },
    taverna: { goods: ["uma caneca de cerveja", "um ensopado", "um hidromel", "uma torta"], cost: 3, price: 8, demand: 18, perish: true, value: 1200, icon: "mug" },
    acougue: { goods: ["um quilo de carne", "linguiça", "costela", "toucinho"], cost: 4, price: 9, demand: 10, perish: true, value: 700, icon: "stew" },
    peixaria: { goods: ["um peixe", "camarão", "sardinhas", "um polvo"], cost: 3, price: 7, demand: 11, perish: true, value: 600, icon: "fish" },
    armazem: { goods: ["um saco de farinha", "sal", "óleo de lampião", "feijão"], cost: 3, price: 6, demand: 14, perish: false, value: 700, icon: "bag" },
    tecidos: { goods: ["um metro de linho", "lã", "seda", "fita"], cost: 5, price: 11, demand: 7, perish: false, value: 650, icon: "shirt" },
    alfaiate: { goods: ["uma túnica", "uma capa", "um vestido", "calças"], cost: 8, price: 18, demand: 5, perish: false, value: 800, icon: "shirt" },
    boticario: { goods: ["um xarope", "uma pomada", "chá de ervas", "um tônico"], cost: 6, price: 14, demand: 7, perish: false, value: 800, icon: "potion" },
    livraria: { goods: ["um livro de contos", "um mapa", "um almanaque", "pena e tinta"], cost: 7, price: 15, demand: 5, perish: false, value: 700, icon: "book" },
    emporio: { goods: ["especiarias", "um tapete", "chá do oriente", "incenso"], cost: 9, price: 20, demand: 5, perish: false, value: 1000, icon: "bag" },
    forja: { goods: ["uma ferradura", "uma enxada", "uma faca", "pregos"], cost: 10, price: 22, demand: 5, perish: false, value: 1000, icon: "hammer" },
    marcenaria: { goods: ["uma cadeira", "um banco", "uma mesa", "uma estante"], cost: 15, price: 32, demand: 3, perish: false, value: 900, icon: "chair" },
    salao: { goods: ["um corte de cabelo", "uma barba", "uma trança", "um penteado"], cost: 1, price: 6, demand: 9, perish: false, value: 700, icon: "sparkle" },
    perola: { goods: ["um anel", "um colar de pérolas", "brincos", "uma pulseira"], cost: 20, price: 45, demand: 2, perish: false, value: 1500, icon: "coin" },
    moda: { goods: ["um vestido fino", "um chapéu", "um manto bordado", "botas"], cost: 12, price: 26, demand: 4, perish: false, value: 1100, icon: "shirt" },
    cristal: { goods: ["um cristal", "uma geodo", "um amuleto", "pó de cristal"], cost: 14, price: 30, demand: 3, perish: false, value: 1200, icon: "sparkle" },
    pousada: { goods: ["uma diária", "um café da manhã", "uma diária com banho", "um quarto duplo"], cost: 2, price: 10, demand: 6, perish: false, value: 1100, icon: "bed" },
  };
  const BIZ_LV = [
    { n: "Barato", mul: 0.8, dem: 1.35 },
    { n: "Justo", mul: 1, dem: 1 },
    { n: "Caro", mul: 1.3, dem: 0.7 },
    { n: "Muito caro", mul: 1.6, dem: 0.42 },
  ];
  const BIZ_UPG = {
    vitrine: { n: "Vitrine bonita", cost: 150, desc: "+20% de clientes" },
    letreiro: { n: "Letreiro pintado", cost: 80, desc: "+10% de clientes" },
    cadeado: { n: "Cadeado e tranca", cost: 100, desc: "acaba com os furtos" },
    adega: { n: "Despensa fresca", cost: 120, desc: "metade das perdas de estoque" },
  };
  const WAGE = 12;
  const bizRent = (S) => Math.round(S.value * 0.012);
  const bizUnitPrice = (b) => Math.max(1, Math.round(BIZ[b.style].price * BIZ_LV[b.lv].mul));
  const bizTax = (v) => (festivalToday() || player.spouse === "rainha" ? 0 : Math.floor(v * TAX.sell));
  const freshDay = () => ({ sold: 0, rev: 0, tax: 0, buy: 0, notes: [] });
  function bizNote(b, n) {
    b.today.notes = b.today.notes || [];
    if (!b.today.notes.includes(n) && b.today.notes.length < 4) b.today.notes.push(n);
  }
  const bizList = () => Object.entries(player.biz || {});
  const townZone = () => (player.zone === "interior" && player.ret ? player.ret.zone : player.zone);
  function bizForSale(zone) {
    const town = ZONES[zone] && ZONES[zone].town;
    if (!town) return [];
    return town.bld.filter((b) => b.name && BIZ[b.style] && !(player.biz && player.biz[b.name]));
  }

  function bizMenu() {
    if (!lifeMode()) return say([["", "Ter um comércio é coisa do Simulador de Vida."]]);
    const owned = bizList();
    const sale = bizForSale(townZone());
    const total = owned.reduce((s, [, b]) => s + (b.hist[0] ? b.hist[0].profit : 0), 0);
    choice(
      "Comércios",
      owned.length ? `Você tem ${owned.length} comércio(s). Resultado de ontem: ${total >= 0 ? "lucro" : "prejuízo"} de ${Math.abs(total)} ouro.` : "Compre um negócio da vila e viva de lucro (ou de prejuízo). Os aldeões compram todo dia.",
      owned
        .map(([n, b]) => ({ t: `${n} · caixa ${b.cash} · estoque ${b.stock}`, icon: BIZ[b.style].icon, fn: () => bizManage(n) }))
        .concat(sale.map((b) => ({ t: `Comprar ${b.name} (${withTax(BIZ[b.style].value)} ouro)`, icon: "coin", fn: () => bizBuy(b) })))
        .concat([{ t: "Sair", fn: null }]),
    );
  }
  function bizBuy(bd) {
    const S = BIZ[bd.style];
    const z = townZone();
    choice(
      bd.name,
      `Preço: ${S.value} ouro + Imposto Real (${withTax(S.value)} no total). Aluguel e manutenção: ${bizRent(S)} ouro/dia. Atendente: ${WAGE} ouro/dia. Cada unidade custa ${S.cost} ouro no atacado e vende por uns ${S.price}. ${S.perish ? "Mercadoria estraga: o que sobra, parte se perde." : "Mercadoria não estraga."}`,
      [
        {
          t: `Fechar negócio (${withTax(S.value)} ouro)`,
          icon: "coin",
          fn: () => {
            if (player.gold < withTax(S.value)) return say([["", "Você não tem ouro suficiente para comprar esse negócio."]]);
            payWithTax(S.value);
            player.biz = player.biz || {};
            player.biz[bd.name] = { zone: z, style: bd.style, stock: 20, lv: 1, staff: true, cash: 0, upg: {}, hist: [], today: freshDay(), since: player.day };
            saveGame();
            playSound(784, 0.15, "sine");
            say([["", `Agora ${bd.name} é seu! O antigo dono deixou 20 unidades de estoque e o atendente continua trabalhando. Toda manhã você recebe o resultado do dia no livro-caixa.`]]);
            if (typeof vilaNews === "function") vilaNews(`${player.name} comprou ${bd.name}. Será que vai dar lucro?`);
          },
        },
        { t: "Voltar", fn: bizMenu },
      ],
    );
  }
  function bizManage(name) {
    const b = player.biz[name],
      S = BIZ[b.style];
    const here = player.zone === "interior" && game.inter && game.inter.b && game.inter.b.name === name;
    const last = b.hist[0];
    const opts = [
      { t: "Livro-caixa", icon: "book", fn: () => bizLedger(name) },
      b.cash > 0
        ? { t: `Retirar o caixa (${b.cash} ouro)`, icon: "coin", fn: () => ((player.gold += b.cash), toast(`Você retirou ${b.cash} ouro do caixa.`, 2000), (b.cash = 0), playSound(988, 0.08, "sine"), bizManage(name)) }
        : b.cash < 0
          ? { t: `Cobrir a dívida do caixa (${-b.cash} ouro)`, icon: "coin", fn: () => (player.gold < -b.cash ? toast("Ouro insuficiente.", 1600) : ((player.gold += b.cash), (b.cash = 0), toast("Dívida paga.", 1600)), bizManage(name)) }
          : null,
      { t: `Comprar estoque (tem ${b.stock})`, icon: "bag", fn: () => bizRestock(name) },
      { t: `Preço: ${BIZ_LV[b.lv].n} (${bizUnitPrice(b)} ouro) · mudar`, icon: "coin", fn: () => bizPrice(name) },
      { t: b.staff ? `Demitir o atendente (economiza ${WAGE}/dia, mas a loja só abre com você)` : `Contratar atendente (${WAGE} ouro/dia)`, icon: "smile", fn: () => ((b.staff = !b.staff), toast(b.staff ? "Atendente contratado." : "Atendente demitido. Sem você no balcão, a loja fica fechada.", 2400), bizManage(name)) },
      { t: "Melhorias", icon: "hammer", fn: () => bizUpgrades(name) },
      here && !(game.inter.work)
        ? { t: "Atender no balcão agora", icon: "smile", fn: () => (currentHour() < 7 || currentHour() >= 20 ? say([["", "A loja abre das 7h às 20h."]]) : takeCounter("biz")) }
        : here && game.inter.work && game.inter.work.mode === "biz"
          ? { t: "Sair do balcão", fn: () => releaseCounter("Você deixou o balcão.") }
          : null,
      here ? { t: "Atendimento normal da loja", fn: () => bldService(game.inter.b) } : null,
      { t: `Vender o negócio (${Math.round(S.value * 0.7 + b.stock * S.cost * 0.5)} ouro)`, icon: "skull", fn: () => bizSell(name) },
      { t: "Sair", fn: null },
    ].filter(Boolean);
    choice(name, `Caixa: ${b.cash} ouro · Estoque: ${b.stock} · Preço ${BIZ_LV[b.lv].n} · ${b.staff ? "com atendente" : "sem atendente"}${last ? ` · Ontem: ${last.profit >= 0 ? "lucro" : "prejuízo"} de ${Math.abs(last.profit)} ouro` : ""}`, opts);
  }
  function bizRestock(name) {
    const b = player.biz[name],
      S = BIZ[b.style];
    choice(
      "Comprar estoque no atacado",
      `Cada unidade custa ${S.cost} ouro + Imposto Real. Você vende por ${bizUnitPrice(b)}. ${S.perish ? "Cuidado: mercadoria parada estraga." : ""}`,
      [10, 25, 50]
        .map((q) => ({
          t: `${q} unidades · ${withTax(S.cost * q)} ouro`,
          icon: "bag",
          fn: () => {
            if (player.gold < withTax(S.cost * q)) return toast("Ouro insuficiente.", 1600);
            const tax = payWithTax(S.cost * q);
            b.stock += q;
            b.today.buy += S.cost * q + tax;
            toast(`Chegaram ${q} unidades. Estoque: ${b.stock}.`, 2000);
            bizManage(name);
          },
        }))
        .concat([{ t: "Voltar", fn: () => bizManage(name) }]),
    );
  }
  function bizPrice(name) {
    const b = player.biz[name];
    choice(
      "Preço de venda",
      "Mais caro dá mais lucro por venda, mas espanta clientes. Preço abusivo pode chamar o fiscal da Coroa.",
      BIZ_LV.map((L, i) => ({
        t: `${L.n}: ${Math.max(1, Math.round(BIZ[b.style].price * L.mul))} ouro${i === b.lv ? " (atual)" : ""}`,
        icon: "coin",
        fn: () => ((b.lv = i), bizManage(name)),
      })),
    );
  }
  function bizUpgrades(name) {
    const b = player.biz[name];
    choice(
      "Melhorias",
      "Investir custa agora, mas pode render depois.",
      Object.entries(BIZ_UPG)
        .map(([k, u]) => ({
          t: b.upg[k] ? `${u.n} (já tem)` : `${u.n} · ${withTax(u.cost)} ouro · ${u.desc}`,
          icon: "hammer",
          fn: () => {
            if (b.upg[k]) return bizUpgrades(name);
            if (player.gold < withTax(u.cost)) return toast("Ouro insuficiente.", 1600);
            b.today.buy += u.cost + payWithTax(u.cost);
            b.upg[k] = true;
            toast(`${u.n} instalado!`, 1800);
            bizUpgrades(name);
          },
        }))
        .concat([{ t: "Voltar", fn: () => bizManage(name) }]),
    );
  }
  function bizSell(name) {
    const b = player.biz[name],
      S = BIZ[b.style];
    const v = Math.round(S.value * 0.7 + b.stock * S.cost * 0.5);
    choice("Vender o negócio?", `Você recebe ${v} ouro${b.cash ? ` e o caixa (${b.cash})` : ""}. Não tem volta.`, [
      {
        t: "Vender",
        fn: () => {
          player.gold += v + b.cash;
          delete player.biz[name];
          if (game.inter && game.inter.work && game.inter.work.mode === "biz") releaseCounter();
          say([["", `Você vendeu ${name} por ${v} ouro.`]]);
        },
      },
      { t: "Voltar", fn: () => bizManage(name) },
    ]);
  }

  /* ---------- o dia que passou: os aldeões compraram? ---------- */
  function bizSimDay(name, b) {
    const S = BIZ[b.style];
    const t = b.today || freshDay();
    const notes = (t.notes || []).slice();
    const liveSold = t.sold;
    let sold = 0,
      rev = t.rev,
      tax = t.tax,
      fines = 0,
      spoil = 0;
    const wages = b.staff ? WAGE : 0;
    const rent = bizRent(S);
    if (b.staff) {
      let dem = S.demand * BIZ_LV[b.lv].dem * (1 + (b.upg.vitrine ? 0.2 : 0) + (b.upg.letreiro ? 0.1 : 0));
      dem *= 0.8 + ((player.rep ?? 50) / 100) * 0.4;
      if (player.weather === "chuva" || player.weather === "tempestade") (dem *= 0.75), notes.push("Choveu: pouca gente na rua.");
      if (festivalToday()) (dem *= 1.4), notes.push("Dia de festa: movimento forte!");
      if (liveSold) dem *= 0.5;
      dem *= rnd(0.75, 1.25);
      if (Math.random() < 0.07) (dem += S.demand * 0.6), notes.push("Encomenda grande de uma família da vila!");
      sold = Math.max(0, Math.min(b.stock, Math.round(dem)));
      if (b.stock <= 0) notes.push("Sem estoque: a loja abriu e não tinha o que vender.");
      else if (sold >= b.stock) notes.push("O estoque acabou antes de fechar. Dava para vender mais!");
      b.stock -= sold;
      const r = sold * bizUnitPrice(b);
      rev += r;
      tax += bizTax(r);
    } else if (!liveSold) notes.push("Loja fechada: sem atendente e você não atendeu.");
    if (S.perish && b.stock > 0) {
      spoil = Math.ceil(b.stock * (b.upg.adega ? 0.15 : 0.3));
      b.stock -= spoil;
      notes.push(`${spoil} unidade(s) estragaram (−${spoil * S.cost} ouro em mercadoria).`);
    }
    if (!b.upg.cadeado && b.stock > 4 && Math.random() < 0.1) {
      const f = Math.ceil(b.stock * 0.2);
      b.stock -= f;
      spoil += f;
      notes.push(`Furto! Levaram ${f} unidade(s) durante a noite.`);
    }
    if (Math.random() < 0.05) (fines += 15), notes.push("Goteira no telhado: conserto de 15 ouro.");
    if (b.lv === 3 && Math.random() < 0.3) (fines += 30), notes.push("O fiscal da Coroa multou o preço abusivo: 30 ouro.");
    const cmv = (sold + liveSold) * S.cost;
    if (t.buy) notes.push(`Você investiu ${t.buy} ouro em estoque e melhorias.`);
    const profit = rev - tax - wages - rent - fines - cmv - spoil * S.cost;
    b.cash += rev - liveRevNet(t) - (tax - t.tax) - wages - rent - fines;
    const buyers = [];
    for (let i = 0; i < Math.min(3, sold + liveSold); i++) buyers.push(pick(WALKER_NAMES));
    if (buyers.length) notes.unshift(`Compraram: ${[...new Set(buyers)].join(", ")}${sold + liveSold > 3 ? " e outros" : ""}.`);
    b.hist.unshift({ d: Math.max(1, player.day - 1), sold: sold + liveSold, rev, tax, wages, rent, fines, buy: t.buy, cmv, spoil, lost: spoil * S.cost, profit, notes });
    b.hist = b.hist.slice(0, 10);
    b.today = freshDay();
    if (b.cash < -300) {
      delete player.biz[name];
      if (typeof vilaNews === "function") vilaNews(`${name} faliu! O banco tomou o negócio de ${player.name}.`);
      return { name, profit, broke: true };
    }
    return { name, profit };
  }
  /** A parte das vendas ao vivo já entrou no caixa na hora. */
  const liveRevNet = (t) => t.rev;
  const ndBase = onNewDay;
  onNewDay = function () {
    ndBase.apply(this, arguments);
    if (!player.biz || !lifeMode()) return;
    const res = bizList().map(([n, b]) => bizSimDay(n, b));
    if (!res.length) return;
    const tot = res.reduce((s, r) => s + r.profit, 0);
    const broke = res.filter((r) => r.broke);
    setTimeout(() => {
      toast(`Seus comércios ontem: ${tot >= 0 ? "lucro" : "prejuízo"} de ${Math.abs(tot)} ouro. Veja o livro-caixa.`, 4200);
      if (broke.length) say([["", `${broke.map((r) => r.name).join(", ")} faliu. As dívidas passaram de 300 ouro e o banco tomou o negócio.`]]);
    }, 3200);
  };

  /* ---------- livro-caixa ---------- */
  function bizLedger(name) {
    const b = player.biz[name];
    let el = byId("bizov");
    if (!el) {
      el = document.createElement("div");
      el.id = "bizov";
      el.className = "box ui ov";
      byId("screen").appendChild(el);
    }
    game.mode = "bizov";
    const t = b.today;
    const row = (h) =>
      `<tr><td>Dia ${h.d}</td><td>${h.sold}</td><td class="p">+${h.rev}</td><td class="n">−${h.tax}</td><td class="n">−${h.wages}</td><td class="n">−${h.rent}</td><td class="n">−${h.cmv ?? h.buy}</td><td class="n">${h.fines ? "−" + h.fines : "0"}</td><td class="n">${h.lost ? "−" + h.lost : "0"}</td><td class="${h.profit >= 0 ? "p" : "n"}"><b>${h.profit >= 0 ? "+" : ""}${h.profit}</b></td></tr>`;
    const sum = b.hist.reduce((s, h) => s + h.profit, 0);
    el.innerHTML = `<div class="gh"><h2>${iconHTML("book", 22)} Livro-caixa · ${name}</h2><button id="bzclose">Fechar (Esc)</button></div>
      <div class="bz-top"><span>Caixa: <b class="${b.cash >= 0 ? "p" : "n"}">${b.cash} ouro</b></span><span>Estoque: <b>${b.stock}</b></span><span>Preço: <b>${BIZ_LV[b.lv].n} (${bizUnitPrice(b)})</b></span><span>${b.staff ? "Com atendente" : "Sem atendente"}</span><span>Últimos ${b.hist.length} dias: <b class="${sum >= 0 ? "p" : "n"}">${sum >= 0 ? "lucro" : "prejuízo"} de ${Math.abs(sum)}</b></span></div>
      <div class="bz-today">Resultado = receita − imposto − salário − aluguel − custo do que vendeu − multas − perdas.<br>Hoje até agora: ${t.sold} venda(s) no balcão · +${t.rev} receita · −${t.tax} imposto · −${t.buy} em compras</div>
      <div class="bz-wrap"><table><tr><th>Dia</th><th>Vendas</th><th>Receita</th><th>Imposto</th><th>Salário</th><th>Aluguel</th><th title="Quanto custou no atacado o que foi vendido">Custo</th><th>Multas</th><th>Perdas</th><th>Resultado</th></tr>${b.hist.map(row).join("") || `<tr><td colspan="10">Ainda não fechou nenhum dia. Amanhã cedo sai o primeiro balanço.</td></tr>`}</table></div>
      ${b.hist[0] ? `<div class="bz-notes"><b>Ontem:</b><ul>${b.hist[0].notes.map((n) => `<li>${n}</li>`).join("")}</ul></div>` : ""}`;
    el.style.display = "block";
    byId("bzclose").onclick = closeLedger;
  }
  function closeLedger() {
    const el = byId("bizov");
    if (el) el.style.display = "none";
    if (game.mode === "bizov") game.mode = "world";
  }
  KEY_HANDLERS.bizov = (k) => k === "escape" && closeLedger();
  if (typeof BEFORE_DIALOG !== "undefined") BEFORE_DIALOG.add("bizov");
  {
    const st = document.createElement("style");
    st.textContent = `#bizov{z-index:45;max-width:min(96%,60em);max-height:88%;overflow:auto}
    #bizov .bz-top{display:flex;flex-wrap:wrap;gap:.4em 1.2em;margin:.4em 0;font-size:.95em}
    #bizov .bz-today{font-size:.85em;color:#c8b8e8;margin-bottom:.5em}
    #bizov .bz-wrap{overflow-x:auto}
    #bizov table{border-collapse:collapse;width:100%;font-size:.85em}
    #bizov th,#bizov td{padding:.3em .5em;border-bottom:1px solid #4a3a6a;text-align:right;white-space:nowrap}
    #bizov th:first-child,#bizov td:first-child{text-align:left}
    #bizov th{color:#ffe08a}
    #bizov .p{color:#7ad36b}#bizov .n{color:#ff9a9a}
    #bizov .bz-notes{margin-top:.6em;font-size:.9em}#bizov ul{margin:.3em 0 0 1.2em;padding:0}`;
    document.head.appendChild(st);
  }

  /* ---------- botão no Quadro de Carreiras ---------- */
  const ocBase = openCareers;
  openCareers = function () {
    ocBase.apply(this, arguments);
    if (!lifeMode()) return;
    const box = document.querySelector("#careers .cr-x");
    if (box && !byId("crbiz")) {
      box.insertAdjacentHTML("afterbegin", `<button id="crbiz">${iconHTML("coin", 16)}Meus comércios</button>`);
      byId("crbiz").onclick = () => (closeCareers(), bizMenu());
    }
  };

  /* ===================== LIGANDO NO MUNDO ===================== */

  const ownedHere = () => player.zone === "interior" && game.inter && game.inter.b && player.biz && player.biz[game.inter.b.name];
  const tgBase = targetAt;
  targetAt = function (x, y) {
    const I = game.inter;
    if (player.zone === "interior" && I && I.work) {
      const cu = custFor(x, y);
      if (cu) return `Atender ${cu.nm}: ${wantName(cu)}`;
      const j = curJob();
      if (I.work.mode === "job" && j && j.id === "taverneiro") {
        const pe = interPersonAt(x, y);
        if (pe && pe.order) return I.work.tray ? `Entregar ${I.work.tray.m.n} a ${pe.nm}` : `Pedido de ${pe.nm}: ${pe.order.m.n}`;
        if (tileAt("interior", x, y) === "Q") return I.work.tray ? `Bandeja: ${I.work.tray.m.n} (leve à mesa)` : seated(I).some((p) => p.order) ? "Preparar pedido das mesas" : "Balcão (esperando clientes)";
      }
      if (tileAt("interior", x, y) === "Q") return I.work.mode === "biz" ? "Seu balcão" : "Balcão (esperando clientes)";
    }
    if (ownedHere() && I && (tileAt("interior", x, y) === "Q" || (x === I.kx && y === I.ky))) return "Administrar meu comércio";
    return tgBase(x, y);
  };
  const iaBase = interactAt;
  interactAt = function (x, y) {
    const I = game.inter;
    if (player.zone === "interior" && I && I.work) {
      const cu = custFor(x, y);
      if (cu) return I.work.mode === "biz" ? serveBizCustomer(cu) : serveJobCustomer(cu);
      const j = curJob();
      if (I.work.mode === "job" && j && j.id === "taverneiro") {
        const pe = interPersonAt(x, y);
        if (pe && pe.order) {
          if (I.work.tray) return deliverTable(pe);
          return toast(`${pe.nm} quer ${pe.order.m.n}. Prepare no balcão e traga aqui.`, 2000);
        }
        if (tileAt("interior", x, y) === "Q") return I.work.tray ? toast(`Leve ${I.work.tray.m.n} até ${I.work.tray.pe.nm}.`, 1600) : prepareTable();
      }
      if (tileAt("interior", x, y) === "Q") return I.work.mode === "biz" ? bizManage(I.b.name) : toast("Espere: os clientes fazem fila do outro lado do balcão.", 1600);
    }
    if (ownedHere() && I && (tileAt("interior", x, y) === "Q" || (x === I.kx && y === I.ky))) return bizManage(I.b.name);
    return iaBase(x, y);
  };
  const wkBase = walkable;
  walkable = function (z, x, y) {
    if (z === "interior" && game.inter && game.inter.work && game.inter.work.cust.some((c) => c.state === "wait" && c.tx === x && c.ty === y)) return false;
    return wkBase(z, x, y);
  };
  const cdBase = crewDrawList;
  crewDrawList = function (list, t) {
    cdBase(list, t);
    drawWork(list, t);
  };
  const upBase = update;
  update = function (dt) {
    upBase(dt);
    try {
      workTick(Math.min(dt, 0.1));
    } catch (e) {
      console.error(e);
    }
  };

  window.bizMenu = bizMenu;
  window.bizManage = bizManage;
  window.bizLedger = bizLedger;
  window.bizSimDay = bizSimDay;
  window.takeCounter = takeCounter;
  window.workAtWork = atWork;
})();
