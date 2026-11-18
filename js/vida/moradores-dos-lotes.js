/**
 * ECOS DO ARCANO — moradores-dos-lotes.js  (Simulador de Vida)
 * As casas do Bairro dos Lotes têm gente morando:
 *  - Cada lote tem uma família fixa (o tamanho do lote decide quanta gente:
 *    lote pequeno tem 1 ou 2 e o vizinho de cima; médio, 2 a 4; mansão, a
 *    família, um criado e um jardineiro), com nome, ofício e jeito.
 *  - De dia (7h às 19h) eles andam pelo próprio lote e fazem as tarefas do
 *    quintal: carpir a horta, estender roupa, jogar milho às galinhas, rachar
 *    lenha, varrer. À noite entram em casa.
 *  - Converse com eles no quintal; bata na porta (de dia atendem, de noite
 *    estão dormindo). No lote pequeno, quem atende é o vizinho de cima, da
 *    sacada.
 *  - Alguns lotes começam vazios, com placa de "Vende-se": dá para comprar
 *    (inclusive as mansões). Quando a vila é abandonada, as famílias vão
 *    embora; quando a água dos poços mata gente, morre gente daqui também,
 *    e o nome vai para o cemitério.
 * Modifica (envolve) funções de outros arquivos: allHouses, update,
 * crewDrawList, targetAt, interactAt, walkable, characterAt, bldAction,
 * onNewDay.
 */

"use strict";

(() => {
  if (typeof LOTES === "undefined") return;
  const hs = (a, b) => (((a * 2654435761) ^ (b * 40503)) >>> 0) % 10000 / 10000;
  const FIRST = { m: ["Bento", "Tomé", "Gaspar", "Anselmo", "Bartolomeu", "Inácio", "Joaquim", "Leandro", "Matias", "Rufino", "Silvério", "Vicente"], f: ["Beatriz", "Clara", "Dorotéia", "Ermelinda", "Filipa", "Graça", "Isabel", "Joana", "Leonor", "Margarida", "Teresa", "Violante"] };
  const JOBS = ["sapateiro", "tecelã", "carpinteiro", "lavadeira", "ferreiro", "padeira", "lavrador", "costureira", "oleiro", "pastora", "carroceiro", "parteira"];
  const MOOD = ["simpático", "fofoqueiro", "ranzinza", "tímido", "falante", "desconfiado"];
  const ROBES = ["#7a5a3a", "#5a6a8a", "#8a3a3a", "#4a6a3a", "#a8784a", "#6a4a7a", "#c9a050", "#3a5a6a"];
  const HAIRS = ["#3a2414", "#d9a441", "#1a1a1a", "#8a3a1a", "#d9d9d9", "#5a3a22"];
  const surname = (L) => L.fam.replace(/^Família |^Mansão d(os|as|e) |^Mansão /, "");
  // mansões de burguês em todos os reinos: as maiores casas sem dono famoso
  for (const [zid, Z] of Object.entries(ZONES)) {
    if (zid === "vila" || !Z.town || Z.town.indoor || !Z.town.bld) continue;
    const cand = Z.town.bld.filter((b) => !b.flats && (!b.name || /^Casa|Mansão/.test(b.name)) && b.w >= 5 && b.h >= 3 && !["castle", "fortaleza", "palacio", "templo", "celeiro", "moinho", "farol", "mina"].includes(b.style));
    cand.sort((a, b) => b.w * b.h - a.w * a.h);
    for (const b of cand.slice(0, zid.startsWith("pais-") ? 1 : 2)) b.big = true;
  }
  // cada bairro com o seu tipo de casa (depois que casas-e-realeza já classificou)
  for (const L of LOTES.lots) L.b.style = L.size === "M" ? "casa" : L.size === "L" ? "casa2" : "casa";
  // ao entrar num bairro, a placa do nome aparece
  let lastB = null;
  const upB = update;
  update = function (dt) {
    upB(dt);
    const B = LOTES.bairros;
    if (!B || player.zone !== "vila" || game.mode !== "world") return void (lastB = null);
    let cur = null;
    if (player.x >= B.x0 && player.x <= B.x1) for (const k of ["nobres", "oficios", "remendos"]) if (player.y >= B[k].y0 && player.y <= B[k].y1) cur = k;
    if (cur && cur !== lastB) game.banner = { text: `${B[cur].n} · ${B[cur].d}`, t: 2.6 };
    lastB = cur;
  };
  // lama no Beco dos Remendos
  const cdM = crewDrawList;
  crewDrawList = function (list, t) {
    cdM(list, t);
    if (player.zone !== "vila" || !LOTES.mud) return;
    list.push({
      y: -1.3,
      draw: () => {
        for (const [x, y] of LOTES.mud) {
          ctx.fillStyle = "rgba(70,52,30,.6)";
          ctx.beginPath();
          ctx.ellipse(x * TILE + 16, y * TILE + 18, 13, 6, 0, 0, 7);
          ctx.fill();
          ctx.fillStyle = "rgba(140,160,180,.35)";
          ctx.fillRect(x * TILE + 10, y * TILE + 16, 8, 2);
        }
        // varais atravessando o beco, de um telhado ao outro
        for (const [x, y] of LOTES.lines || []) {
          const X = x * TILE + 4,
            Y = y * TILE - 6,
            G = y * TILE + 28;
          // dois postes firmes no chão segurando a corda
          for (const px of [X - 2, X + 58]) ((ctx.fillStyle = "rgba(0,0,0,.22)"), ctx.fillRect(px - 2, G - 2, 8, 3), (ctx.fillStyle = "#5a3a1e"), ctx.fillRect(px, Y - 2, 4, G - Y + 2), (ctx.fillStyle = "#7a4f2a"), ctx.fillRect(px, Y - 2, 1, G - Y));
          ctx.strokeStyle = "#c9b080";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(X, Y);
          ctx.quadraticCurveTo(X + 30, Y + 10, X + 60, Y);
          ctx.stroke();
          for (let i = 0; i < 4; i++) ((ctx.fillStyle = ["#e8e0d0", "#c94a5a", "#5a7ab0", "#d9c08a"][(i + x) % 4]), ctx.fillRect(X + 8 + i * 12, Y + 3 + (i % 2), 7, 9));
        }
      },
    });
  };
  // lotes vazios no começo (com placa de vende-se)
  for (const L of LOTES.lots) L.vacant = hs(L.x0, L.road) < 0.22;

  // as mansões também viram casas à venda quando vazias
  if (typeof allHouses === "function") {
    const ahBase = allHouses;
    allHouses = function () {
      const list = ahBase.apply(this, arguments);
      for (const L of LOTES.lots) {
        const b = L.b;
        const key = `vila:${b.door[0]},${b.y + b.h - 1}`;
        if (!list[key]) list[key] = { key, zone: "vila", x: b.door[0], y: b.y + b.h - 1, n: b.name || `Casa do lote ${L.size === "S" ? "pequeno" : "médio"}`, price: { L: 3500, M: 1200, S: 400 }[L.size], size: { L: "grande", M: "média", S: "pequena" }[L.size], tier: L.size === "L" ? "mansao" : L.size === "M" ? "casa" : "casebre" };
        else list[key].price = { L: 3500, M: 1200, S: 400 }[L.size];
      }
      return list;
    };
  }
  const houseKey = (L) => `vila:${L.b.door[0]},${L.b.y + L.b.h - 1}`;
  const owned = (L) => player && (player.houses || []).includes(houseKey(L));
  const gone = () => player && player.dis && player.dis.extinct;
  const dead = (p) => player && player.lotDead && player.lotDead[p.id];
  const lives = (L) => !L.vacant && !owned(L) && !gone();
  window.lotLives = lives;

  // família de cada lote
  for (const L of LOTES.lots) {
    const n = L.size === "S" ? 1 + (hs(L.x0, 3) < 0.5 ? 1 : 0) : L.size === "M" ? 2 + Math.floor(hs(L.x0, 5) * 3) : 3;
    L.people = [];
    for (let i = 0; i < n; i++) {
      const g = hs(L.x0 + i, 7) < 0.5 ? "m" : "f";
      L.people.push({ id: L.b.id + "p" + i, nm: `${FIRST[g][Math.floor(hs(L.x0, i + 11) * 12)]} ${surname(L)}`, g, job: JOBS[Math.floor(hs(L.x0 + i, 13) * 12)], mood: MOOD[Math.floor(hs(L.x0 + i, 17) * 6)], robe: ROBES[Math.floor(hs(L.x0 + i, 19) * 8)], hair: HAIRS[Math.floor(hs(L.x0 + i, 23) * 6)], L });
    }
    if (L.size === "L") L.people.push({ id: L.b.id + "cr", nm: "Criado Lourenço", g: "m", job: "criado", mood: "tímido", robe: "#2a2a3a", hair: "#3a2414", L }, { id: L.b.id + "ja", nm: "Jardineiro Abel", g: "m", job: "jardineiro", mood: "simpático", robe: "#4a6a3a", hair: "#d9d9d9", L, hat: "#c9a050" });
    if (L.size === "S") {
      const sn = ["Quaresma", "Pereira", "Sardinha", "Moleiro", "Rosário", "Bento", "Lagoa", "Freitas"][Math.floor(hs(L.x0, 37) * 8)];
      L.upFam = "Família " + sn;
      L.up = { id: L.b.id + "up", nm: `${FIRST.f[Math.floor(hs(L.x0, 29) * 12)]} ${sn}`, g: "f", job: JOBS[Math.floor(hs(L.x0, 31) * 12)], mood: "fofoqueiro", L };
    }
    // onde dá para andar no lote: grama, gramado e o caminho da frente
    L.walk = Object.entries(L.b.plan)
      .filter(([, k]) => k === "grama" || k === "gramado" || k === "lama")
      .map(([k]) => k.split(",").map(Number));
    L.tasks = Object.entries(L.b.plan)
      .filter(([, k]) => ["horta", "ervas", "varal", "galinheiro", "lenha", "flores", "chiqueiro", "colmeias"].includes(k))
      .map(([k, kind]) => [...k.split(",").map(Number), kind]);
  }
  const day = () => currentHour() >= 7 && currentHour() < 19;
  const actors = () => (lifeMode() && player.zone === "vila" && day() ? LOTES.lots.filter(lives).flatMap((L) => L.people.filter((p) => !dead(p))) : []);
  const actorAt = (x, y) => actors().find((p) => p.x === x && p.y === y);
  // começa cada um num ponto livre do lote
  for (const L of LOTES.lots)
    L.people.forEach((p, i) => {
      const c = L.walk[(i * 5 + 3) % Math.max(1, L.walk.length)] || [L.b.door[0], L.b.y + L.b.h];
      [p.x, p.y] = c;
      p.rx = p.x;
      p.ry = p.y;
      p.t = Math.random() * 3;
      p.dir = "down";
      p.work = null;
    });

  const upBase = update;
  update = function (dt) {
    upBase(dt);
    if (game.mode !== "world" || game.dialog) return;
    for (const p of actors()) {
      p.rx += (p.x - p.rx) * Math.min(1, dt * 5);
      p.ry += (p.y - p.ry) * Math.min(1, dt * 5);
      p.t -= dt;
      if (p.t > 0) continue;
      p.t = 1 + Math.random() * 2.5;
      const L = p.L;
      // às vezes para e trabalha numa tarefa vizinha
      const task = L.tasks.find(([tx, ty]) => Math.abs(tx - p.x) + Math.abs(ty - p.y) === 1);
      if (task && Math.random() < 0.55) {
        p.work = task[2];
        p.dir = task[0] > p.x ? "right" : task[0] < p.x ? "left" : task[1] < p.y ? "up" : "down";
        p.t = 3 + Math.random() * 3;
        continue;
      }
      p.work = null;
      const opts = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dy]) => [p.x + dx, p.y + dy]).filter(([nx, ny]) => L.walk.some(([a, b]) => a === nx && b === ny) && !(nx === player.x && ny === player.y) && !L.people.some((o) => o !== p && o.x === nx && o.y === ny));
      if (!opts.length) continue;
      const [nx, ny] = opts[Math.floor(Math.random() * opts.length)];
      p.dir = nx > p.x ? "right" : nx < p.x ? "left" : ny > p.y ? "down" : "up";
      p.x = nx;
      p.y = ny;
    }
  };
  const WORKTXT = { horta: "carpindo a horta", ervas: "colhendo ervas", varal: "estendendo roupa", galinheiro: "jogando milho às galinhas", lenha: "rachando lenha", flores: "regando as flores", chiqueiro: "dando lavagem ao porco", colmeias: "olhando as colmeias" };
  function talk(p) {
    const lines = {
      simpático: ["Bom dia, vizinh" + genderWord("o", "a", "e") + "! Entra, o portão tá aberto.", "Quer uma maçã do pomar? Pega duas."],
      fofoqueiro: ["Você viu quem saiu da casa ao lado de madrugada? Eu vi.", "Não espalha, mas a vizinha de cima deve três meses de aluguel."],
      ranzinza: ["Não pisa na horta!", "Esse barulho da praça não me deixa dormir."],
      tímido: ["Ah... oi.", "...a horta tá bonita esse ano, né?"],
      falante: ["Pois é, o meu ofício é " + p.job + " e deixa eu te contar como foi a semana...", "A gente veio pra este lote faz três invernos. Antes morava num casebre lá perto do rio!"],
      desconfiado: ["Quem é você? O que quer no meu lote?", "Hm. Pode falar daí mesmo."],
    }[p.mood] || ["Bom dia."];
    const extra = p.work ? [["", `${p.nm.split(" ")[0]} está ${WORKTXT[p.work] || "trabalhando"}.`]] : [];
    const pol = typeof workerTalk === "function" && Math.random() < 0.5 ? workerTalk(p.L.size === "S") : null;
    say([...extra, [p.nm, pk(lines)], ...(pol ? [[p.nm, pol]] : typeof genLine === "function" && Math.random() < 0.4 ? [[p.nm, genLine(null)]] : [])]);
  }
  const tgBase = targetAt;
  targetAt = function (x, y) {
    const p = actorAt(x, y);
    if (p) return `Conversar com ${p.nm} (${p.job})`;
    return tgBase(x, y);
  };
  const iaBase = interactAt;
  interactAt = function (x, y) {
    const p = actorAt(x, y);
    if (p) return talk(p);
    return iaBase(x, y);
  };
  const wkBase = walkable;
  walkable = function (z, x, y) {
    if (z === "vila" && actorAt(x, y)) return false;
    return wkBase(z, x, y);
  };
  if (typeof characterAt === "function") {
    const caBase = characterAt;
    characterAt = function (x, y) {
      return !!actorAt(x, y) || caBase(x, y);
    };
  }
  // bater na porta
  const lotOfB = (b) => LOTES.lots.find((L) => L.b === b);
  const baBase = bldAction;
  bldAction = function (b) {
    const L = b && lifeMode() && lotOfB(b);
    if (!L || !lives(L)) return baBase.apply(this, arguments);
    if (!day()) return say([["", `Toc, toc... Ninguém responde. A ${L.fam} já está dormindo.`]]);
    if (L.up)
      return choice("Casinha de dois andares", `Embaixo mora a ${L.fam}. Em cima, pela escada de fora, mora a ${L.upFam}.`, [
        { t: `Bater embaixo (${L.fam})`, icon: "door", fn: () => knockDown(L) },
        { t: `Subir a escada e bater em cima (${L.upFam})`, icon: "door", fn: () => say([[L.up.nm, pk(["*abre a porta de cima* Pois não? Cuidado com o degrau quebrado!", "Aqui em cima é pequeno, mas o aluguel é mais barato e a vista do beco é... bom, é o beco.", "Você é da família de baixo? Diz pra eles pararem de cozinhar repolho!"])], ...(typeof workerTalk === "function" ? [[L.up.nm, workerTalk(true)]] : [])]) },
        { t: "Ir embora", fn: null },
      ]);
    return knockDown(L);
  };
  function knockDown(L) {
    const living = L.people.filter((p) => !dead(p));
    const host = living[0];
    if (!host) return say([["", "A casa está em silêncio. A família partiu."]]);
    choice(L.fam, `${host.nm} abre a porta. Moram aqui: ${living.map((p) => p.nm.split(" ")[0] + " (" + p.job + ")").join(", ")}.`, [
      { t: "Conversar", icon: "chat", fn: () => talk(host) },
      { t: "Oferecer ajuda no quintal (+ouro, cansa)", icon: "hammer", fn: () => (lifeNeed("energy") < 15 ? say([[host.nm, "Você mal para em pé! Vai descansar."]]) : (addNeed("energy", -12), passMin(60), (player.gold += L.size === "L" ? 15 : 8), say([["", "Uma hora carpindo, carregando lenha e consertando a cerca."], [host.nm, `Toma, ${L.size === "L" ? 15 : 8} de ouro. E volte quando quiser!`]]))) },
      { t: "Pedir um copo d'água", icon: "water", fn: () => ((player.water = Math.min(100, (player.water || 0) + 30)), say([[host.nm, pk(["Claro, entra! Água fresquinha do poço.", "Toma. Mas o copo eu quero de volta, hein."])]])) },
      { t: "Ir embora", fn: null },
    ]);
  }
  // placa: vende-se nos lotes vazios
  if (typeof targetAt === "function") {
    const tg2 = targetAt;
    targetAt = function (x, y) {
      const r = tg2(x, y);
      if (typeof r === "string" && r.startsWith("Placa:")) {
        const L = LOTES.lots.find((q) => q.b.plan[x + "," + y] === "placa");
        if (L && owned(L)) return "Placa: o seu lote";
        if (L && !lives(L)) return `Placa: VENDE-SE · ${{ L: 3500, M: 1200, S: 400 }[L.size]} ouro (bata na porta)`;
      }
      return r;
    };
  }
  // mortes pela água levam moradores daqui
  const ndBase = onNewDay;
  onNewDay = function () {
    const before = (player.dis && player.dis.named && player.dis.named.length) || 0;
    const r = ndBase.apply(this, arguments);
    const named = (player.dis && player.dis.named) || [];
    for (let i = before; i < named.length; i++) {
      const alive = LOTES.lots.filter(lives).flatMap((L) => L.people.filter((p) => !dead(p)));
      if (!alive.length) break;
      const p = alive[Math.floor(Math.random() * alive.length)];
      player.lotDead = player.lotDead || {};
      player.lotDead[p.id] = player.day;
      named[i].n = p.nm;
    }
    return r;
  };
  // desenho dos moradores com a ferramenta da tarefa
  const cdBase = crewDrawList;
  crewDrawList = function (list, t) {
    cdBase(list, t);
    for (const p of actors())
      list.push({
        y: p.ry,
        draw: () => {
          const X = p.rx * TILE,
            Y = p.ry * TILE;
          ctx.fillStyle = "rgba(0,0,0,.22)";
          ctx.beginPath();
          ctx.ellipse(X + 16, Y + 30, 8, 3, 0, 0, 7);
          ctx.fill();
          const walking = Math.abs(p.rx - p.x) + Math.abs(p.ry - p.y) > 0.05;
          drawSprite(wizardRects(p.robe, p.hat || null, p.hair, null, p.dir, walking ? walkFrame(true, t) : 0), X, Y, 2, p.dir === "left");
          if (p.work) {
            const sw = Math.sin(t * 6) * 4;
            ctx.fillStyle = "#6b4423";
            if (p.work === "horta" || p.work === "ervas" || p.work === "flores") (ctx.fillRect(X + 24, Y + 6 + sw, 2, 16), (ctx.fillStyle = "#8a8a96"), ctx.fillRect(X + 22, Y + 20 + sw, 6, 2));
            else if (p.work === "lenha") (ctx.fillRect(X + 24, Y + 4 + sw, 2, 14), (ctx.fillStyle = "#9a9aa0"), ctx.fillRect(X + 22, Y + 4 + sw, 6, 3));
            else if (p.work === "galinheiro") for (let i = 0; i < 3; i++) ((ctx.fillStyle = "#e8c04a"), ctx.fillRect(X + 26 + i * 3, Y + 22 + ((t * 30 + i * 5) % 8), 2, 2));
            else if (p.work === "varal") (ctx.fillStyle = "#e8e0d0"), ctx.fillRect(X + 22, Y + 2 + sw * 0.3, 8, 6);
          }
        },
      });
  };
})();
