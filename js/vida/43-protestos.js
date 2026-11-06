/**
 * ECOS DO ARCANO — 43-protestos.js
 * Protesto dos Iluministas na frente do castelo (Simulador):
 *  1. Concentração: cartazes, gritos de guerra, Luca e Lucas puxando o coro.
 *  2. A Rainha aparece na escadaria: começam a voar tomates, ovos e repolhos.
 *  3. Caos: guardas correm atrás dos manifestantes, gente fugindo, a Rainha
 *     levando tomatada, o Luca falando com o jogador no meio da bagunça.
 *  4. Dispersão: a Rainha entra, os guardas levam alguns presos, a vila comenta.
 * Você pode entrar no protesto, jogar tomate, defender a Rainha ou acalmar todo mundo.
 * Acontece a cada 3 ou 4 dias (de manhã); quem é iluminista pode convocar um com o Luca.
 */

"use strict";

const PROTEST_SIGNS = ["FORA COROA", "O POVO DECIDE", "CONSELHO JÁ", "MENOS IMPOSTO", "ESCOLA P/ TODOS", "LUZ > COROA", "TAVERNA ATÉ TARDE", "RAZÃO!", "IGUALDADE", "PÃO BARATO"];
const PROTEST_CHANTS = ["Ô, ô, ô, a coroa acabou!", "O POVO, UNIDO, JAMAIS SERÁ VENCIDO!", "Conselho já! Conselho já!", "Imposto real é ilegal!", "Liberdade, igualdade e festa na sexta!", "Ei, Rainha, desce daí!", "A razão chegou, a coroa caiu!", "Queremos pão, não coroação!"];
const QUEEN_LINES = ["Que ultraje é este?!", "GUARDAS! Prendam esses baderneiros!", "Isto é um tomate?! Na MINHA coroa?!", "Eu sou a Rainha de Cinzaluz!", "Vamos conversar como pessoas civilizadas! *desvia de um ovo*", "Meu vestido de seda!!", "Quem jogou esse repolho?!", "Ok, ok! Uma reunião! Quinta-feira! PAREM!"];
const GUARD_LINES = ["Parado aí!", "Em nome da Rainha!", "Volta aqui, iluminista!", "Ninguém joga tomate na Majestade!", "Teje preso!"];
const RUN_LINES = ["Corre que é a guarda!", "Não me pega, eu sou só estudante!", "VIVA A RAZÃO!", "Eu só vim pelo tomate de graça!", "Me solta, eu tenho direitos!", "Aaaaai!"];
const LUCA_PROTEST = ["Jogador, isso tá sendo gravado? Manda pros seus amigos!", "Se o jogo travar agora, foi a monarquia.", "Olha a física desses tomates! Quem programou isso merece aumento.", "Eu vi o código: a Rainha tem só 3 falas a mais que eu. INJUSTIÇA!", "Ei, você aí do outro lado da tela! Aperta A pra apoiar a gente!"];

function protestPlaza() {
  const castle = typeof vilaBuilding === "function" && vilaBuilding("Castelo de Cinzaluz");
  const [cx, cy] = castle ? doorOut(castle) : [31, 11];
  return { cx, cy };
}
function protestSpots(n) {
  const { cx, cy } = protestPlaza();
  const out = [],
    used = new Set();
  for (let k = 0; k < 400 && out.length < n; k++) {
    const x = cx - 7 + Math.floor(Math.random() * 15),
      y = cy + 3 + Math.floor(Math.random() * 6);
    const key = x + "," + y;
    if (used.has(key) || !walkable("vila", x, y)) continue;
    used.add(key);
    out.push([x, y]);
  }
  return out;
}
const PROTEST_ROBES = ["#7a2a2a", "#2a4a7a", "#5a3a7a", "#3a6a3a", "#8a6a2a", "#4a4a4a", "#9a4a6a", "#2a6a6a"];
const PROTEST_HAIRS = ["#3a2414", "#d9a441", "#1a1a1a", "#8a3a1a", "#d9d9d9", "#5a3a22"];
function mkActor(x, y, o) {
  return { x, y, rx: x, ry: y, hx: x, hy: y, dir: "up", step: Math.random(), ...o };
}
/** Começa o protesto (força = true ignora o horário). */
function startProtest(force) {
  if (game.protest || !lifeMode() || player.zone !== "vila") return false;
  if (!force && (currentHour() < 8 || currentHour() > 15)) return false;
  const { cx, cy } = protestPlaza();
  const conv = Object.keys(player.ilumConv || {}).filter((k) => NPCS[k] && !CREW_ALL.includes(k));
  const spots = protestSpots(16 + conv.length);
  if (spots.length < 6) return false;
  const actors = [];
  const leaders = ["luca", "lucas"].filter((k) => NPCS[k]);
  leaders.forEach((id, i) => {
    const s = spots.shift();
    actors.push(mkActor(s[0], s[1], { id, nome: shortName(id), robe: NPCS[id].robe, hat: NPCS[id].hat, hair: NPCS[id].hair, sign: i ? "CONSELHO JÁ" : "FORA COROA", leader: true }));
  });
  for (const id of conv) {
    const s = spots.shift();
    if (s) actors.push(mkActor(s[0], s[1], { id, nome: shortName(id), robe: NPCS[id].robe, hat: NPCS[id].hat, hair: NPCS[id].hair, sign: pk(PROTEST_SIGNS) }));
  }
  const names = WALKER_NAMES.slice().sort(() => Math.random() - 0.5);
  while (spots.length) {
    const s = spots.shift();
    actors.push(mkActor(s[0], s[1], { nome: names.pop() || "Manifestante", robe: pk(PROTEST_ROBES), hair: pk(PROTEST_HAIRS), hat: Math.random() < 0.25 ? pk(["#5a3a22", "#3a4a6a", "#7a2a2a"]) : null, seed: Math.floor(Math.random() * 99999), sign: Math.random() < 0.7 ? pk(PROTEST_SIGNS) : null }));
  }
  const R = NPCS.rainha;
  const gl = NPCS.tome || { robe: "#4a5a7a", hat: "#3a3a4a", hair: "#3a2414" };
  game.protest = {
    t: 0,
    phase: 0,
    actors,
    queen: mkActor(cx, cy, { nome: "Rainha Aurélia", robe: R.robe, hat: null, hair: R.hair, hidden: true, dir: "down", splat: 0 }),
    guards: [mkActor(cx - 2, cy, { nome: "Guarda Real", robe: gl.robe, hat: gl.hat, hair: gl.hair, dir: "down", hidden: true }), mkActor(cx + 2, cy, { nome: "Guarda Real", robe: gl.robe, hat: gl.hat, hair: gl.hair, dir: "down", hidden: true }), mkActor(cx, cy + 1, { nome: "Guarda Real", robe: gl.robe, hat: gl.hat, hair: gl.hair, dir: "down", hidden: true })],
    shots: [],
    splats: [],
    chant: 1,
    hitsQueen: 0,
    arrested: 0,
    you: { joined: false, thrown: 0, defended: false, calmed: false },
    lucaT: 6,
  };
  player.protestLast = player.day;
  playSound(330, 0.3, "square");
  toast("📣 Protesto dos Iluministas na frente do castelo!", 4200);
  vilaNews("Os Iluministas fizeram um protesto enorme na frente do castelo!");
  return true;
}
function protestShout(o, txt, t = 2.4) {
  game.shouts = (game.shouts || []).concat([{ x: o.x, y: o.y, txt, t }]);
}
function throwAt(from, to, kind) {
  const P = game.protest;
  P.shots.push({ x0: from.x, y0: from.y, x1: to.x + (Math.random() - 0.5) * 0.6, y1: to.y + (Math.random() - 0.5) * 0.6, t: 0, dur: 0.75 + Math.random() * 0.35, kind: kind || pk(["tomate", "tomate", "ovo", "repolho"]), to });
}
const PHASES = [0, 26, 70, 124, 148]; // segundos: concentração, tomates, caos, dispersão, fim
function protestTick(dt) {
  const P = game.protest;
  if (!P) return;
  if (player.zone !== "vila" || game.mode === "title") return void (game.protest = null);
  if (game.mode !== "world" || game.dialog) return;
  P.t += dt;
  const ph = PHASES.findIndex((s, i) => P.t >= s && P.t < (PHASES[i + 1] ?? 1e9));
  if (ph !== P.phase) {
    P.phase = ph;
    if (ph === 1) {
      P.queen.hidden = false;
      P.guards.forEach((g) => (g.hidden = false));
      protestShout(P.queen, "O que significa esta gritaria na minha porta?!", 3);
      playSound(523, 0.2, "triangle");
    }
    if (ph === 2) {
      protestShout(P.queen, "GUARDAS! PRENDAM TODOS!", 3);
      game.shake = 0.25;
      toast("O protesto virou uma loucura! Guardas correndo, tomates voando!", 3600);
    }
    if (ph === 3) {
      protestShout(P.queen, pk(["Chega! Vou para dentro. Isso não acabou!", "Quinta-feira, reunião com o povo. Mas LAVEM ESSES TOMATES!"]), 3.4);
      P.queen.leaving = true;
    }
    if (ph === 4) return endProtest();
  }
  // Movimento suave.
  for (const a of [...P.actors, P.queen, ...P.guards]) {
    a.rx += (a.x - a.rx) * Math.min(1, dt * 8);
    a.ry += (a.y - a.ry) * Math.min(1, dt * 8);
  }
  // Gritos de guerra.
  P.chant -= dt;
  if (P.chant <= 0) {
    P.chant = P.phase === 2 ? 0.9 : 1.6;
    const a = pk(P.actors.filter((x) => !x.caught));
    if (a) protestShout(a, P.phase === 2 && Math.random() < 0.5 ? pk(RUN_LINES) : pk(PROTEST_CHANTS), 2.2);
    if (P.phase >= 1 && P.phase < 3 && Math.random() < 0.35) protestShout(P.queen, pk(QUEEN_LINES), 2.4);
    if (P.phase === 2 && Math.random() < 0.4) protestShout(pk(P.guards), pk(GUARD_LINES), 2);
  }
  // Luca quebrando a quarta parede.
  P.lucaT -= dt;
  const luca = P.actors.find((a) => a.id === "luca");
  if (luca && P.lucaT <= 0) {
    P.lucaT = 14 + Math.random() * 8;
    protestShout(luca, pk(LUCA_PROTEST), 3.4);
  }
  // Tomates!
  if (P.phase === 1 || P.phase === 2) {
    if (Math.random() < dt * (P.phase === 2 ? 3.2 : 1.2)) {
      const a = pk(P.actors.filter((x) => !x.caught));
      if (a) {
        const tg = Math.random() < 0.7 ? P.queen : pk(P.guards);
        throwAt(a, tg);
      }
    }
    // Às vezes sobra para você.
    if (Math.random() < dt * 0.05 && Math.abs(player.x - P.queen.x) + Math.abs(player.y - P.queen.y) < 10) throwAt(pk(P.actors), player, "tomate");
  }
  for (const s of P.shots) {
    s.t += dt;
    if (s.t >= s.dur) {
      s.done = true;
      P.splats.push({ x: s.x1, y: s.y1, kind: s.kind, t: 6 });
      if (s.to === P.queen) {
        P.hitsQueen++;
        P.queen.splat = 1;
        if (Math.random() < 0.5) protestShout(P.queen, pk(["AI!", "MEU CABELO!", "Isso é um OVO?!", "Repolho não!!"]), 1.6);
        playSound(180, 0.08, "square");
      } else if (s.to === player) {
        toast("SPLASH! Um tomate acertou você em cheio.", 2200);
        if (lifeMode()) addNeed("hygiene", -15);
        playSound(160, 0.1, "square");
      }
    }
  }
  P.shots = P.shots.filter((s) => !s.done);
  for (const sp of P.splats) sp.t -= dt;
  P.splats = P.splats.filter((s) => s.t > 0);
  if (P.queen.splat > 0) P.queen.splat -= dt * 0.5;
  // Andar de cada um.
  const busy = (x, y, me) => P.actors.some((o) => o !== me && o.x === x && o.y === y) || P.guards.some((o) => o !== me && o.x === x && o.y === y) || (player.x === x && player.y === y);
  for (const a of P.actors) {
    a.step -= dt;
    if (a.step > 0 || a.caught) continue;
    if (P.phase <= 1) {
      // Pula no lugar e balança o cartaz.
      a.step = 0.6 + Math.random();
      a.dir = "up";
      a.hop = 1;
      if (Math.random() < 0.3) {
        const d = pk(DIRS4);
        const nx = a.x + d[0],
          ny = a.y + d[1];
        if (Math.abs(nx - a.hx) + Math.abs(ny - a.hy) <= 1 && walkable("vila", nx, ny) && !busy(nx, ny, a)) (a.x = nx), (a.y = ny);
      }
    } else {
      // Caos: correm dos guardas (ou vão embora na dispersão).
      a.step = P.phase === 3 ? 0.25 : 0.2 + Math.random() * 0.15;
      const g = P.guards.slice().sort((p, q) => dist1(p, a) - dist1(q, a))[0];
      let best = null,
        bd = -1;
      for (const [dx, dy] of DIRS4) {
        const nx = a.x + dx,
          ny = a.y + dy;
        if (!walkable("vila", nx, ny) || busy(nx, ny, a)) continue;
        const d = P.phase === 3 ? Math.abs(ny - a.hy) * 2 + Math.random() * 3 : Math.abs(nx - g.x) + Math.abs(ny - g.y) + Math.random() * 2.4;
        if (d > bd) (bd = d), (best = [nx, ny, dx, dy]);
      }
      if (best) {
        a.dir = best[2] > 0 ? "right" : best[2] < 0 ? "left" : best[3] > 0 ? "down" : "up";
        a.x = best[0];
        a.y = best[1];
      }
    }
  }
  // Guardas correm atrás de manifestantes.
  if (P.phase === 2)
    for (const g of P.guards) {
      g.step -= dt;
      if (g.step > 0) continue;
      g.step = 0.26;
      if (!g.prey || g.prey.caught) g.prey = pk(P.actors.filter((a) => !a.caught && !a.leader));
      if (!g.prey) continue;
      const p = zonePath("vila", g.x, g.y, g.prey.x, g.prey.y, 900);
      if (p && p.length > 1 && !busy(p[0][0], p[0][1], g)) {
        g.dir = p[0][0] > g.x ? "right" : p[0][0] < g.x ? "left" : p[0][1] > g.y ? "down" : "up";
        [g.x, g.y] = p[0];
      }
      if (dist1(g, g.prey) <= 1 && Math.random() < 0.5) {
        g.prey.caught = true;
        P.arrested++;
        protestShout(g.prey, pk(["Me solta!", "Isso é censura!", "Eu volto amanhã!", "Viva a razão!"]), 2);
        game.bubbles.push({ x: g.prey.x, y: g.prey.y, icon: "anger", t: 1.6 });
      }
    }
  if (P.queen.leaving) {
    P.queen.step -= dt;
    if (P.queen.step <= 0) {
      P.queen.step = 0.5;
      P.queen.y = Math.max(P.queen.hy - 1, P.queen.y - 1);
      P.queen.dir = "up";
      if (P.queen.y < P.queen.hy) P.queen.hidden = true;
    }
  }
  // A rua toda fica agitada.
  if (P.phase === 2)
    for (const w of game.walkers || [])
      if (dist1(w, P.queen) < 14 && !(w.flee > 0) && Math.random() < 0.02) {
        w.flee = 3;
        if (Math.random() < 0.3) (w.sayT = 2), (w.sayTxt = pk(["Que loucura!", "Tomate voando!", "Chama a minha mãe!", "Eu só queria comprar pão!", "Isso vai pro jornal!"]));
      }
}
function endProtest() {
  const P = game.protest;
  game.protest = null;
  if (!P) return;
  const y = P.you;
  const lines = [["", `O protesto acabou. A Rainha levou ${P.hitsQueen} tomatadas e ${P.arrested} manifestantes foram levados pela guarda.`]];
  if (y.thrown) {
    const caught = Math.random() < 0.35 + y.thrown * 0.08;
    if (caught) {
      const fine = withTax(60);
      lines.push(["Guarda Real", `Ei, você! Vi você jogando tomate na Majestade. Multa de ${fine} ouro!`]);
      player.gold = Math.max(0, player.gold - fine);
      repAdd(-4);
    } else lines.push(["", "Ninguém viu quem jogou aqueles tomates... ou fingiram que não viram."]);
  }
  if (y.defended) lines.push(["Rainha Aurélia", `${player.name}, você me defendeu no meio daquela loucura. Não vou esquecer.`]);
  if (y.calmed) lines.push(["Lucas Marzocca", "Você acalmou a galera. Meio chato, mas... foi bonito."]);
  lines.push(["Luca", pk(["Mesma hora semana que vem! Tragam tomates. E ideias. Mais tomates.", "Revolução: 1, Coroa: 0. Ou 0 a 0. Ninguém tá contando.", "Se você gostou desse protesto, dá cinco estrelas pro jogo."])]);
  vilaNews(`O protesto iluminista terminou com ${P.hitsQueen} tomatadas na Rainha e ${P.arrested} presos!`);
  if (player.zone === "vila" && game.mode === "world") say(lines);
  saveGame();
}
/** O que você faz no meio do protesto. */
function protestMenu(a) {
  const P = game.protest;
  if (!P) return;
  game.pieAnchor = { x: a.x, y: a.y };
  const opts = [];
  if (!P.you.joined)
    opts.push({
      t: "Entrar no protesto (gritar junto)",
      icon: "flag",
      fn: () => {
        P.you.joined = true;
        addFriendship("luca", 4);
        addFriendship("lucas", 4);
        if (FRIENDS.rainha) player.rel.rainha = Math.max(0, friendship("rainha") - 4);
        if (lifeMode()) addNeed("fun", 15);
        protestShout(player, pk(PROTEST_CHANTS), 2.6);
        say([[a.nome, pk(["Isso! Mais um com a gente!", "Grita mais alto, a Rainha ainda não ouviu!", "Bem-vind" + genderWord("o", "a", "e") + " à revolução! Tem tomate ali no cesto."])]]);
      },
    });
  if (P.phase >= 1 && P.phase <= 2 && !P.queen.hidden)
    opts.push({
      t: "Jogar um tomate na Rainha",
      icon: "anger",
      fn: () => {
        P.you.thrown++;
        P.you.joined = true;
        throwAt(player, P.queen, "tomate");
        if (FRIENDS.rainha) player.rel.rainha = Math.max(0, friendship("rainha") - 8);
        addFriendship("luca", 3);
        addFriendship("lucas", 3);
        if (lifeMode()) addNeed("fun", 10);
        toast("Lá vai o tomate!", 1500);
      },
    });
  if (P.phase >= 1 && P.phase <= 2 && !P.you.defended)
    opts.push({
      t: "Defender a Rainha",
      icon: "crown",
      fn: () => {
        P.you.defended = true;
        if (FRIENDS.rainha) addFriendship("rainha", 10);
        addFriendship("luca", -5);
        addFriendship("lucas", -5);
        throwAt(a, player, "ovo");
        protestShout(player, "Parem! Assim ninguém conversa!", 2.4);
        say([[a.nome, pk(["Traidor" + genderWord("", "a", "e") + " da razão!", "Ah, puxa-saco da coroa!", "Você tá do lado DELA?!"])]]);
      },
    });
  if (!P.you.calmed && P.phase === 2)
    opts.push({
      t: "Tentar acalmar todo mundo",
      icon: "flower",
      fn: () => {
        const ok = Math.random() < 0.3 + (player.rep ?? 50) / 150;
        if (ok) {
          P.you.calmed = true;
          P.t = Math.max(P.t, PHASES[3] - 2);
          repAdd(5);
          say([["", `${player.name} sobe na beira da fonte e grita: "CHEGA! Vamos conversar!" ...e, por milagre, todo mundo para.`], ["Rainha Aurélia", "...Pois bem. Uma reunião com o povo. Quinta-feira."]]);
        } else {
          throwAt(a, player, "repolho");
          say([["", "Ninguém escutou. E ainda voou um repolho na sua direção."]]);
        }
      },
    });
  opts.push({ t: "Só assistir (que espetáculo!)", icon: "eye", fn: () => (lifeMode() && addNeed("fun", 8), toast("Você assiste à confusão de camarote.", 2000)) });
  opts.push({ t: "Sair", fn: null });
  choice(`${a.nome} · Protesto`, P.phase === 0 ? "Os iluministas estão se juntando na frente do castelo." : P.phase === 1 ? "A Rainha apareceu e os tomates começaram a voar!" : P.phase === 2 ? "É o caos: guardas, tomates, gente correndo para todo lado!" : "O protesto está acabando.", opts);
}
function protestActorAt(x, y) {
  const P = game.protest;
  if (!P) return null;
  return P.actors.find((a) => a.x === x && a.y === y) || (!P.queen.hidden && P.queen.x === x && P.queen.y === y ? P.queen : null) || P.guards.find((g) => !g.hidden && g.x === x && g.y === y) || null;
}
{
  const charBase = characterAt;
  characterAt = function (x, y) {
    return !!protestActorAt(x, y) || charBase(x, y);
  };
  const interBase = interactAt;
  interactAt = function (x, y) {
    const a = protestActorAt(x, y);
    if (a) return protestMenu(a);
    return interBase(x, y);
  };
  const tgtBase = targetAt;
  targetAt = function (x, y) {
    const a = protestActorAt(x, y);
    if (a) return a === game.protest.queen ? "Rainha Aurélia (protesto)" : `Protesto · ${a.nome}`;
    return tgtBase(x, y);
  };
}
/* Agenda: a cada 3 ou 4 dias, de manhã. */
{
  const dayBase = onNewDay;
  onNewDay = function () {
    dayBase.apply(this, arguments);
    if (lifeMode() && !player.protestNext) player.protestNext = player.day + 2 + Math.floor(Math.random() * 2);
  };
}
let protestAcc = 0;
function protestSchedule(dt) {
  protestAcc += dt;
  if (protestAcc < 2) return;
  protestAcc = 0;
  if (!lifeMode() || game.protest || player.zone !== "vila") return;
  if (!player.protestNext) player.protestNext = Math.max(player.day + 1, 3);
  if (player.day >= player.protestNext && currentHour() >= 9 && currentHour() < 14 && startProtest()) player.protestNext = player.day + 3 + Math.floor(Math.random() * 2);
}
/* Luca e Lucas: convocar um protesto (para iluministas). */
{
  const ilBase = ilumItems;
  ilumItems = function (id) {
    const items = ilBase(id);
    if (player.ilum && lifeMode() && player.zone === "vila" && !game.protest && player.protestLast !== player.day)
      items.push({
        t: "Convocar um protesto agora! 📣",
        icon: "flag",
        fn: () =>
          say([[shortName(id), pk(["AGORA? ...AGORA! Todo mundo pra frente do castelo!", "Busca os cartazes! Eu levo os tomates!"])]], () => {
            if (!startProtest(true)) toast("Agora não dá: precisa estar na vila, de dia.", 2600);
            else P_you_join();
          }),
      });
    return items;
  };
}
function P_you_join() {
  if (game.protest) game.protest.you.joined = true;
}

/* ===================== DESENHO ===================== */

function drawProtester(a, t, i) {
  const X = a.rx * TILE,
    hop = a.caught ? 0 : game.protest.phase <= 1 ? -Math.abs(Math.sin(t * 6 + i)) * 3 : Math.abs(Math.sin(t * 14 + i)) * -2;
  const Y = a.ry * TILE + hop;
  ctx.fillStyle = "rgba(0,0,0,.22)";
  ctx.beginPath();
  ctx.ellipse(X + 16, a.ry * TILE + 30, 8, 3, 0, 0, 7);
  ctx.fill();
  const moving = Math.abs(a.rx - a.x) + Math.abs(a.ry - a.y) > 0.05;
  drawSprite(wizardRects(a.robe, a.hat, a.hair, null, a.dir, walkFrame(moving, t), a.seed), X, Y, 2, a.dir === "left");
  if (a.caught) {
    ctx.fillStyle = "#c9c9d2";
    ctx.fillRect(X + 10, Y + 18, 12, 3);
  }
  if (a.sign && !a.caught && game.protest.phase < 3) {
    const sx = X + 16,
      sy = Y - 16 + Math.sin(t * 4 + i) * 2;
    ctx.fillStyle = "#6b4423";
    ctx.fillRect(sx - 1, sy, 2, 18);
    ctx.font = '700 8px "VT323", monospace';
    const w = Math.max(28, ctx.measureText(a.sign).width + 8);
    ctx.fillStyle = "#f6ecd2";
    ctx.fillRect(sx - w / 2, sy - 12, w, 12);
    ctx.strokeStyle = "#3a2414";
    ctx.lineWidth = 1;
    ctx.strokeRect(sx - w / 2 + 0.5, sy - 11.5, w - 1, 11);
    ctx.fillStyle = a.leader ? "#a8282a" : "#2a1a0c";
    ctx.textAlign = "center";
    ctx.fillText(a.sign, sx, sy - 3);
    ctx.textAlign = "left";
  }
}
function drawQueen(q, t) {
  const X = q.rx * TILE,
    Y = q.ry * TILE;
  ctx.fillStyle = "rgba(0,0,0,.25)";
  ctx.beginPath();
  ctx.ellipse(X + 16, Y + 30, 9, 3, 0, 0, 7);
  ctx.fill();
  const dodge = game.protest.phase === 2 ? Math.sin(t * 9) * 2 : 0;
  drawSprite(wizardRects(q.robe, null, q.hair, null, q.dir, 0), X + dodge, Y, 2, false);
  // Coroa.
  ctx.fillStyle = "#f2c14e";
  ctx.fillRect(X + 9 + dodge, Y - 3, 14, 4);
  for (const k of [9, 15, 21]) ctx.fillRect(X + k + dodge, Y - 7, 2, 4);
  ctx.fillStyle = "#c94a4a";
  ctx.fillRect(X + 15 + dodge, Y - 2, 2, 2);
  if (q.splat > 0) {
    ctx.globalAlpha = Math.min(1, q.splat);
    ctx.fillStyle = "#d33a2a";
    ctx.fillRect(X + 8 + dodge, Y + 4, 6, 4);
    ctx.fillRect(X + 18 + dodge, Y + 14, 5, 5);
    ctx.fillStyle = "#f2e27a";
    ctx.fillRect(X + 12 + dodge, Y + 20, 4, 3);
    ctx.globalAlpha = 1;
  }
}
function drawShot(s) {
  const k = s.t / s.dur,
    x = (s.x0 + (s.x1 - s.x0) * k) * TILE + 16,
    y = (s.y0 + (s.y1 - s.y0) * k) * TILE + 10 - Math.sin(k * Math.PI) * 40;
  const col = { tomate: "#d33a2a", ovo: "#f6f2e4", repolho: "#7ac36b" }[s.kind];
  ctx.fillStyle = "rgba(0,0,0,.2)";
  ctx.fillRect((s.x0 + (s.x1 - s.x0) * k) * TILE + 13, (s.y0 + (s.y1 - s.y0) * k) * TILE + 28, 6, 2);
  ctx.fillStyle = col;
  ctx.beginPath();
  ctx.arc(x, y, s.kind === "repolho" ? 4.5 : 3.5, 0, 7);
  ctx.fill();
  if (s.kind === "tomate") {
    ctx.fillStyle = "#3a8a3a";
    ctx.fillRect(x - 1, y - 4, 2, 2);
  }
}
function drawSplat(s) {
  const X = s.x * TILE + 16,
    Y = s.y * TILE + 22;
  ctx.globalAlpha = Math.min(1, s.t / 2);
  ctx.fillStyle = { tomate: "#b8281e", ovo: "#f2e27a", repolho: "#5a9a4a" }[s.kind];
  ctx.beginPath();
  ctx.ellipse(X, Y, 7, 3.5, 0, 0, 7);
  ctx.fill();
  ctx.fillRect(X + 6, Y - 3, 3, 2);
  ctx.fillRect(X - 9, Y + 1, 3, 2);
  ctx.globalAlpha = 1;
}
{
  const drawBase = crewDrawList;
  crewDrawList = function (list, t) {
    drawBase(list, t);
    const P = game.protest;
    if (!P || player.zone !== "vila") return;
    list.push({ y: -1, draw: () => P.splats.forEach(drawSplat) });
    P.actors.forEach((a, i) => list.push({ y: a.ry, draw: () => drawProtester(a, t, i) }));
    if (!P.queen.hidden) list.push({ y: P.queen.ry, draw: () => drawQueen(P.queen, t) });
    for (const g of P.guards) if (!g.hidden) list.push({ y: g.ry, draw: () => drawSprite(wizardRects(g.robe, g.hat, g.hair, null, g.dir, walkFrame(Math.abs(g.rx - g.x) > 0.05, t)), g.rx * TILE, g.ry * TILE, 2, g.dir === "left") });
    list.push({ y: 999, draw: () => P.shots.forEach(drawShot) });
  };
  // Durante o protesto, Luca e Lucas estão no protesto (não andando pela vila).
  const visBase = crewVisible;
  crewVisible = function (a) {
    if (game.protest && a && (a.id === "luca" || a.id === "lucas")) return false;
    return visBase(a);
  };
  const updBase = update;
  update = function (dt) {
    updBase(dt);
    if (game.mode === "title") return;
    if (game.mode === "world" && !game.dialog) {
      protestSchedule(dt);
      protestTick(dt);
    }
  };
}
