/**
 * ECOS DO ARCANO — estabelecimentos-vivos.js
 * Os estabelecimentos ganham vida, como num mercado medieval de verdade:
 *  - Fregueses entram, andam até as prateleiras, olham as mercadorias,
 *    pechincham no balcão (o dono responde), compram e vão embora; outros
 *    chegam pela porta.
 *  - O dono não fica parado: anda atrás do balcão, arruma as coisas e faz
 *    pregão.
 *  - Taverna: a taberneira circula com canecas entre o balcão e as mesas, um
 *    menestrel toca perto da lareira, há brindes, dados e cantoria.
 *  - Na rua, os comerciantes fazem pregão na porta da loja quando você passa.
 * Modifica (envolve) funções de outros arquivos: genInterior, update,
 * crewDrawList.
 */

"use strict";

(() => {
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const rnd = (a, b) => a + Math.random() * (b - a);
  const shout = (x, y, txt, t = 3) => (game.shouts = (game.shouts || []).concat([{ x, y, txt, t }]));
  const bubble = (x, y, icon, t = 1.6) => game.bubbles.push({ x, y, icon, t });

  const LINES = {
    padaria: { ask: ["Uma broa de centeio, por favor!", "Ainda tem pão quente?", "Me vê seis pãezinhos.", "Esse pão de mel é de hoje?"], keep: ["Saiu agora do forno!", "Pão quente, freguês!", "Leva dois que faço preço."], cry: ["Pão quentinho! Saído do forno!", "Broa, rosca e pão de mel!"] },
    taverna: { ask: ["Mais uma rodada!", "À saúde do Rei!", "Taberneira, mais hidromel!", "Quem perdeu nos dados paga a próxima!", "Essa cerveja tá mais aguada que o rio!", "Canta aquela do dragão, menestrel!"], keep: ["Quem não paga, deixa o gibão!", "Hidromel fresco, barril novo!", "Sem briga aqui dentro!"], cry: ["Cerveja escura e ensopado de javali!", "Entra, viajante! Tem lugar perto do fogo!"] },
    forja: { ask: ["Consegue afiar minha foice?", "Quanto pra trocar as ferraduras?", "Essa lâmina aguenta um lobo?"], keep: ["Ferro bom é ferro malhado.", "Volta amanhã que fica pronto."], cry: ["Ferraduras, pregos e lâminas!", "Conserto de panela e de espada!"] },
    boticario: { ask: ["Tem algo pra dor de dente?", "Minha sogra tá com febre...", "Esse unguento serve pra queimadura?"], keep: ["Três gotas antes de dormir.", "Chá de salgueiro, freguesa."], cry: ["Ervas, xaropes e unguentos!", "Remédio pra tudo, menos pra saudade!"] },
    acougue: { ask: ["Um quilo de costela.", "Essa linguiça é de javali?", "Tem toucinho fresco?"], keep: ["Carne boa, abatida hoje!", "Corto do jeito que quiser."], cry: ["Carne fresca! Costela e toucinho!"] },
    peixaria: { ask: ["Tem sardinha hoje?", "Esse peixe é do rio ou do mar?", "Quanto o arenque?"], keep: ["Pescado agora de manhã!", "Cheira a mar, né? É fresco."], cry: ["Peixe fresco do rio! Olha a truta!"] },
    armazem: { ask: ["Me vê um saco de sal.", "Tem óleo de lampião?", "Corda boa, dessa grossa?"], keep: ["Pesado na balança certa, juro pela Coroa.", "Isso aqui não falta nunca."], cry: ["Sal, farinha, corda e óleo!"] },
    tecidos: { ask: ["Quanto o côvado de linho?", "Esse veludo é do Oriente?", "Tem fita vermelha?"], keep: ["Linho da Serra, o melhor.", "Seda só pra quem tem bolsa cheia."], cry: ["Linho, lã e seda fina!"] },
    alfaiate: { ask: ["Preciso de um gibão pra festa.", "Dá pra apertar essa túnica?"], keep: ["Fica pronto em três dias.", "Tira a medida aqui, freguês."], cry: ["Gibões, capas e vestidos de festa!"] },
    livraria: { ask: ["Tem algum romance de cavalaria?", "Quanto custa copiar esse livro?"], keep: ["Copiado à mão, letra por letra.", "Livro bom é livro com dragão."], cry: ["Livros e pergaminhos!"] },
    emporio: { ask: ["Isso é canela de verdade?", "Quanto o tapete do Oriente?"], keep: ["Veio de navio, de muito longe.", "Especiaria vale ouro, freguês."], cry: ["Especiarias do Oriente! Canela e pimenta!"] },
    marcenaria: { ask: ["Faz um berço pra mim?", "Essa cadeira aguenta um anão?"], keep: ["Carvalho bom não racha.", "Madeira seca, móvel eterno."], cry: ["Móveis de carvalho! Conserto de carroça!"] },
    salao: { ask: ["Só aparar a barba, por favor.", "Corta igual ao do Príncipe!"], keep: ["Navalha afiada, mão firme.", "Senta, que eu deixo você nobre."], cry: ["Barba e cabelo! Sangria às quartas!"] },
    estab: { ask: ["Quanto pra guardar meu cavalo?", "Tem feno pra uma noite?"], keep: ["Cavalo escovado é cavalo feliz.", "Esse aí tem gênio forte."], cry: ["Cavalos, selas e feno!"] },
    pousada: { ask: ["Tem quarto pra hoje?", "Quanto a noite com banho?"], keep: ["Lençol limpo e sopa quente.", "O quarto do fundo é o mais quieto."], cry: ["Quarto e comida pro viajante!"] },
    templo: { ask: ["Vim acender uma vela.", "Reze por minha colheita, padre."], keep: ["Que a luz te proteja.", "Uma moeda pros pobres?"], cry: [] },
    perola: { ask: ["Esse anel é ouro mesmo?", "Quanto o colar de pérolas?"], keep: ["Pérola do fundo do mar.", "Joia boa dura gerações."], cry: ["Joias e pérolas do mar!"] },
    moda: { ask: ["Tem vestido pro baile?", "Esse chapéu tá na moda da Corte?"], keep: ["A Princesa usou um igual.", "Feito sob medida."], cry: ["A moda da Corte chegou!"] },
    cristal: { ask: ["Esse cristal brilha no escuro?", "Serve pra amuleto?"], keep: ["Tirado da Mina de Cristal.", "Cada um canta numa nota."], cry: ["Cristais da montanha!"] },
  };
  const HAGGLE = [
    ["Três moedas? Dou duas!", "Duas e meia, e é minha última palavra!"],
    ["Isso é um roubo!", "Roubo é o imposto da Coroa, freguês."],
    ["Faz um precinho, vai...", "Pra você, uma moeda a menos."],
    ["Na feira de Brisamar é mais barato.", "Então vá a pé até Brisamar!"],
    ["Pago metade agora e metade na colheita.", "Fiado só com fiador!"],
  ];
  const BARD = ["♪ Lá vem o cavaleiro... sem cavalo ♪", "♪ Ó taberneira, enche o meu copo ♪", "♪ A Rainha Aurélia tem olhos de mar ♪", "♪ O dragão comeu a ponte, e a ponte comeu o dragão ♪", "♪ Três runas no céu, seis no meu coração ♪"];
  const TAVERN_FUN = ["Saúde!", "À Cinzaluz!", "Seis! Ganhei!", "Dados viciados, isso sim!", "Hahaha!", "Mais uma!", "Eu queda de braço com qualquer um!"];

  /* ===================== TERRENO DO INTERIOR ===================== */
  const solid = (x, y) => {
    const I = game.inter;
    if (tileAt("interior", x, y) !== ".") return true;
    const ip = interPropAt(x, y);
    if (ip && SOLID_PROPS.has(ip[0])) return true;
    if (I.kx === x && I.ky === y) return true;
    if (I.people.some((p) => Math.round(p.x) === x && Math.round(p.y) === y)) return true;
    if ((I.movers || []).some((m) => m.tx === x && m.ty === y)) return true;
    if (player.x === x && player.y === y) return true;
    return false;
  };
  function bfsStep(fx, fy, tx, ty) {
    const key = (x, y) => x + "," + y;
    const prev = new Map([[key(fx, fy), null]]);
    const q = [[fx, fy]];
    while (q.length) {
      const [x, y] = q.shift();
      if (x === tx && y === ty) break;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx,
          ny = y + dy,
          k = key(nx, ny);
        if (prev.has(k) || ny < 2) continue;
        if (!(nx === tx && ny === ty) && solid(nx, ny)) continue;
        prev.set(k, [x, y]);
        q.push([nx, ny]);
      }
    }
    if (!prev.has(key(tx, ty))) return null;
    let cur = [tx, ty];
    while (prev.get(key(...cur)) && !(prev.get(key(...cur))[0] === fx && prev.get(key(...cur))[1] === fy)) cur = prev.get(key(...cur));
    return cur;
  }
  function spots(I) {
    const out = [];
    const z = ZONES.interior;
    for (const [t, x, y] of I.props) {
      if (["rug", "carpet"].includes(t)) continue;
      for (const [dx, dy] of [[0, 1], [1, 0], [-1, 0]]) {
        const nx = x + dx,
          ny = y + dy;
        if (ny >= 5 && nx > 0 && nx < z.w - 1 && ny < z.h - 1 && tileAt("interior", nx, ny) === ".") out.push([nx, ny, "olhar"]);
      }
    }
    const cx = (I.kx0 ?? I.kx) + 1;
    for (let x = cx - 2; x <= cx + 1; x++) out.push([x, I.st === "castle" ? 4 : 5, "balcao"]);
    return out;
  }
  const regular = (p) => !p.guard && !p.kid && !p.child && !p.order && !p.cid && !p.bard && !p.aa && !p.gossip;

  /* ===================== PERSONAGENS EXTRAS ===================== */
  const giBase = genInterior;
  genInterior = function (b) {
    const z = giBase.apply(this, arguments);
    const I = game.inter;
    if (!I) return z;
    I.movers = [];
    I.life = { t: 2, keeperT: 5, cryT: 3, bardT: 2 };
    if (I.st === "taverna") {
      const fire = I.props.find((p) => p[0] === "fire");
      const near = fire ? [[fire[1] + 1, fire[2]], [fire[1], fire[2] + 1], [fire[1] - 1, fire[2]]].find(([x, y]) => !solid(x, y)) : null;
      if (near) I.people.push({ x: near[0], y: near[1], robe: "#2a6a4a", hair: "#d9a441", hat: "#8a3a3a", nm: "Menestrel Tiago", bard: true });
      const cx = I.kx + 1;
      I.maid = { x: cx, y: 5, fx: cx, fy: 5, tx: cx, ty: 5, nm: "Taberneira Marta", robe: "#8a3a5a", hair: "#8a3a1a", carry: false, wait: 2 };
    }
    return z;
  };

  /* ===================== A CADA QUADRO ===================== */
  function think(I, dt) {
    const L = LINES[I.st] || LINES.armazem;
    const W = I.work;
    I.life.t -= dt;
    // fregueses
    if (I.life.t <= 0 && !W) {
      I.life.t = rnd(0.5, 1.1);
      const pool = I.people.filter(regular);
      const tav = I.st === "taverna";
      if (pool.length) {
        const pe = pick(pool);
        const r = Math.random();
        if (tav && r < 0.35) {
          shout(pe.x, pe.y, pick(TAVERN_FUN), 2.4);
          bubble(pe.x, pe.y, pick(["mug", "laugh", "mug", "note"]));
        } else if (r < 0.15 && I.people.length > 1 && !tav) {
          move(I, pe, ZONES.interior.town.arrive, "sair");
        } else {
          const sp = pick(spots(I).filter(([x, y]) => !solid(x, y)));
          if (sp) move(I, pe, sp, sp[2]);
        }
      }
      // novos fregueses entram pela porta
      const total = I.people.filter(regular).length + I.movers.filter((m) => m.pe && regular(m.pe)).length;
      const want = I.st === "taverna" ? 6 : I.st === "castle" || I.st === "escola" ? 0 : 3;
      if (total < want && Math.random() < 0.35) {
        const [ax, ay] = ZONES.interior.town.arrive;
        const pe = { x: ax, y: ay, robe: pick(["#8a3a3a", "#3a6a8a", "#5a7a3a", "#8a6a2a", "#6a3a7a", "#2a6a6a"]), hair: pick(["#3a2414", "#d9a441", "#1a1a1a", "#8a3a1a", "#d9d9d9"]), hat: null, nm: pick(WALKER_NAMES) };
        const sp = pick(spots(I).filter(([x, y]) => !solid(x, y)));
        if (sp) move(I, pe, sp, sp[2], true);
      }
    }
    // dono andando atrás do balcão e fazendo pregão
    I.life.keeperT -= dt;
    if (I.life.keeperT <= 0 && !W && I.kx > 0) {
      I.life.keeperT = rnd(2, 4.5);
      const cx = (I.kx0 ?? I.kx) + 1;
      I.kx0 = I.kx0 ?? I.kx;
      const nx = Math.max(cx - 2, Math.min(cx + 1, I.kx + pick([-1, 1])));
      if (!(player.x === nx && player.y === I.ky) && Math.abs(player.x - I.kx) + Math.abs(player.y - I.ky) > 1) I.kx = nx;
      if (Math.random() < 0.4 && L.keep) shout(I.kx, I.ky, pick(L.keep), 2.6);
    }
    // menestrel
    const bard = I.people.find((p) => p.bard);
    if (bard) {
      I.life.bardT -= dt;
      if (I.life.bardT <= 0) {
        I.life.bardT = rnd(3, 6);
        shout(bard.x, bard.y, pick(BARD), 3.2);
        bubble(bard.x, bard.y, "note", 2);
        playSound(pick([392, 440, 494, 523, 587]), 0.12, "triangle", 0.02);
      }
    }
    // taberneira
    const M = I.maid;
    if (M && !W) {
      const dx = M.tx - M.fx,
        dy = M.ty - M.fy,
        d = Math.hypot(dx, dy);
      if (d > 0.05) {
        const s = Math.min(d, dt * 2.4);
        M.fx += (dx / d) * s;
        M.fy += (dy / d) * s;
        M.dir = Math.abs(dy) > Math.abs(dx) ? (dy < 0 ? "up" : "down") : dx < 0 ? "left" : "right";
        M.walk = true;
      } else {
        M.walk = false;
        M.wait -= dt;
        if (M.wait <= 0) {
          const cx = (I.kx0 ?? I.kx) + 1;
          if (M.carry) {
            M.carry = false;
            M.tx = cx;
            M.ty = 5;
            if (M.serving) shout(M.serving.x, M.serving.y, pick(["Obrigado, Marta!", "Põe na minha conta!", "Essa é das boas!"]), 2.2);
          } else {
            const pe = pick(I.people.filter(regular));
            if (pe) {
              const sp = [[pe.x + 1, pe.y], [pe.x - 1, pe.y], [pe.x, pe.y + 1], [pe.x, pe.y - 1]].find(([x, y]) => tileAt("interior", x, y) === "." && !interPropAt(x, y));
              if (sp) ((M.tx = sp[0]), (M.ty = sp[1]), (M.carry = true), (M.serving = pe));
            }
          }
          M.wait = rnd(1.5, 3);
        }
      }
    }
    // quem está andando
    for (const m of I.movers) {
      m.acc += dt;
      m.rx += (m.cx - m.rx) * Math.min(1, dt * 9);
      m.ry += (m.cy - m.ry) * Math.min(1, dt * 9);
      if (m.acc < 0.34) continue;
      m.acc = 0;
      if (m.cx === m.tx && m.cy === m.ty) {
        m.done = true;
        continue;
      }
      const nx = bfsStep(m.cx, m.cy, m.tx, m.ty);
      if (!nx || ++m.steps > 40) {
        m.done = true;
        continue;
      }
      m.dir = nx[1] < m.cy ? "up" : nx[1] > m.cy ? "down" : nx[0] < m.cx ? "left" : "right";
      [m.cx, m.cy] = nx;
    }
    for (const m of I.movers.filter((q) => q.done)) {
      const pe = m.pe;
      if (m.kind === "sair" && m.cx === m.tx && m.cy === m.ty) continue;
      pe.x = m.cx;
      pe.y = m.cy;
      I.people.push(pe);
      if (m.kind === "balcao") {
        const [a, b] = pick(HAGGLE);
        const ask = Math.random() < 0.5 ? pick(L.ask || ["Quanto custa?"]) : a;
        shout(pe.x, pe.y, ask, 2.8);
        setTimeout(() => game.inter === I && (shout(I.kx, I.ky, ask === a ? b : pick(L.keep || ["Feito!"]), 2.8), bubble(pe.x, pe.y, "coin", 1.4), playSound(988, 0.05, "sine", 0.02)), 1500);
      } else if (m.kind === "olhar") bubble(pe.x, pe.y, pick(["eye", "star", "chat"]), 1.4);
    }
    I.movers = I.movers.filter((q) => !q.done);
  }
  function move(I, pe, [tx, ty], kind, fromDoor) {
    if (!fromDoor) {
      const i = I.people.indexOf(pe);
      if (i < 0) return;
      I.people.splice(i, 1);
    }
    I.movers.push({ pe, cx: Math.round(pe.x), cy: Math.round(pe.y), rx: pe.x, ry: pe.y, tx, ty, kind, acc: 0, steps: 0, dir: "down" });
  }

  /* ----- pregão na rua ----- */
  let cryT = 4;
  function streetCries(dt) {
    if (!ZONES[player.zone] || !ZONES[player.zone].town || player.zone === "interior") return;
    cryT -= dt;
    if (cryT > 0) return;
    cryT = rnd(7, 13);
    const near = ZONES[player.zone].town.bld.filter((b) => b.name && LINES[b.style] && LINES[b.style].cry.length && Math.abs(b.door[0] - player.x) + Math.abs(b.y + b.h - player.y) < 9);
    if (!near.length || sleepTime()) return;
    const b = pick(near);
    shout(b.door[0], b.y + b.h, pick(LINES[b.style].cry), 3.2);
  }

  const upBase = update;
  update = function (dt) {
    upBase(dt);
    if (!player || game.mode !== "world" || game.dialog) return;
    dt = Math.min(dt, 0.1);
    try {
      if (player.zone === "interior" && game.inter && game.inter.life) think(game.inter, dt);
      else streetCries(dt);
    } catch (e) {
      console.error(e);
    }
  };
  const cdBase = crewDrawList;
  crewDrawList = function (list, t) {
    cdBase(list, t);
    const I = game.inter;
    if (player.zone !== "interior" || !I || !I.life) return;
    const drawP = (o, x, y, dir, walk, extra) => {
      ctx.fillStyle = "rgba(0,0,0,.22)";
      ctx.beginPath();
      ctx.ellipse(x * TILE + 16, y * TILE + 30, 8, 3, 0, 0, 7);
      ctx.fill();
      drawSprite(wizardRects(o.robe, o.hat || null, o.hair, null, dir || "down", walk ? walkFrame(true, t) : 0), x * TILE, y * TILE, 2);
      if (extra) extra();
    };
    for (const m of I.movers) list.push({ y: m.ry, draw: () => drawP(m.pe, m.rx, m.ry, m.dir, true) });
    const M = I.maid;
    if (M && !I.work)
      list.push({
        y: M.fy,
        draw: () =>
          drawP(M, M.fx, M.fy, M.dir, M.walk, () => {
            ctx.fillStyle = "#f2eee4";
            ctx.fillRect(M.fx * TILE + 6, M.fy * TILE + 18, 20, 8);
            if (M.carry) drawPixelIcon("mug", M.fx * TILE + 26, M.fy * TILE + 14, 2);
          }),
      });
    const bard = I.people.find((p) => p.bard);
    if (bard)
      list.push({
        y: bard.y + 0.02,
        draw: () => {
          ctx.fillStyle = "#c9925a";
          ctx.beginPath();
          ctx.ellipse(bard.x * TILE + 24, bard.y * TILE + 22, 6, 8, 0.4, 0, 7);
          ctx.fill();
          ctx.fillStyle = "#5a3a22";
          ctx.fillRect(bard.x * TILE + 26, bard.y * TILE + 6, 3, 14);
        },
      });
  };
  // A taberneira e quem está andando também contam como gente para falar.
  const ipBase = interPersonAt;
  interPersonAt = function (x, y) {
    const r = ipBase(x, y);
    if (r) return r;
    const I = game.inter;
    if (player.zone === "interior" && I && I.maid && Math.round(I.maid.fx) === x && Math.round(I.maid.fy) === y && !I.work) return I.maid;
    return null;
  };
})();
