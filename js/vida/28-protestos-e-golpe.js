/* 28-protestos-e-golpe.js: junta 43-protestos.js, 45-golpe.js. */
/**
 * ECOS DO ARCANO — 28-protestos-e-golpe.js
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

/* ======================================================================
   (antes: 45-golpe.js)
   ====================================================================== */

/**
 * ECOS DO ARCANO — 28-protestos-e-golpe.js
 * Golpe de estado e conquista dos reinos (Simulador de Vida):
 *  1. Conspiração: junte apoio (aliados, guardas subornados, armas, o povo, os
 *     Iluministas) sem levantar suspeita. Suspeita demais e a guarda te prende.
 *  2. A noite do golpe: portões, salão e sala do trono, cada etapa com escolhas.
 *  3. Coroação: você vira Rei ou Rainha de Aurélia e governa (impostos, festas, guerra).
 *  4. Os outros reinos: conquiste Marés e Pedravale pela guerra, por um golpe
 *     infiltrado ou por união diplomática. Os três juntos: Imperador(a) dos Três Reinos.
 *  5. O povo descontente pode tentar um contragolpe.
 * Tecla K (Reinos) abre tudo; o Luca e o Lucas também topam conspirar.
 */


function throne() {
  return (player.throne = player.throne || {});
}
function rulesK(k) {
  return lifeMode() && !!throne()[k];
}
function ruledCount() {
  return ["aurelia", "mares", "serra"].filter(rulesK).length;
}
function plot() {
  return (player.plot = player.plot || { sup: 0, sus: 0, allies: [], bribes: 0, arms: 0, day: 0 });
}
const BASE_RULERS = Object.fromEntries(Object.entries(KINGDOMS).map(([k, v]) => [k, v.ruler]));
function syncRulers() {
  for (const k of Object.keys(KINGDOMS)) KINGDOMS[k].ruler = rulesK(k) ? `${player.name} (${genderWord("Rei", "Rainha", "Monarca")})` : BASE_RULERS[k];
}

/* ===================== COROA ===================== */

{
  const monBase = isMonarch;
  isMonarch = function () {
    return monBase() || rulesK("aurelia");
  };
  royalTitle = function () {
    const n = ruledCount();
    if (n === 3) return genderWord("Imperador", "Imperatriz", "Soberane") + " dos Três Reinos";
    const names = ["aurelia", "mares", "serra"].filter(rulesK).map((k) => KINGDOMS[k].short);
    return genderWord("Rei", "Rainha", "Monarca") + " de " + (names.length ? names.join(" e ") : "Aurélia");
  };
  const atWarBase = atWar;
  atWar = function (a, b) {
    if (rulesK(a) && rulesK(b)) return false;
    return atWarBase(a, b);
  };
  const dailyBase = royalDaily;
  royalDaily = function () {
    dailyBase();
    // Cada reino conquistado também paga imposto.
    const extra = (rulesK("mares") ? 70 : 0) + (rulesK("serra") ? 70 : 0);
    if (extra) {
      player.gold += extra;
      setTimeout(() => toast(`Tributos dos reinos conquistados: +${extra} ouro.`, 3200), 8200);
    }
  };
}

/* ===================== CONSPIRAÇÃO ===================== */

const CROWN_LOYAL = new Set(["rainha", "tome", "kael", "capitao", "odelia"]);
function joinChance(id) {
  let c = 0.25 + (friendship(id) - 50) / 100;
  if (hasTrait(id, "rebelde")) c += 0.35;
  if (hasTrait(id, "ambicioso")) c += 0.15;
  if (hasTrait(id, "leal")) c -= 0.1;
  if (hasTrait(id, "timido")) c -= 0.1;
  if (CROWN_LOYAL.has(id)) c -= 0.45;
  if (player.ilumConv && player.ilumConv[id]) c += 0.25;
  return Math.max(0.03, Math.min(0.95, c));
}
function allyWeight(id) {
  if (id === "marcos") return 22; // o General traz o exército
  if (id === "lucas" || id === "luca") return 12;
  return CREW_ALL.includes(id) ? 10 : 7;
}
function supportTotal() {
  const P = plot();
  let s = P.allies.reduce((a, id) => a + allyWeight(id), 0) + P.bribes * 9 + P.arms * 8;
  s += Math.max(0, ((player.rep ?? 50) - 40) / 3);
  if (player.ilum) s += Math.min(20, ilumCount() * 4);
  return Math.min(100, Math.round(s));
}
function raiseSus(v, who) {
  const P = plot();
  P.sus = Math.min(100, P.sus + v);
  if (P.sus >= 100) return arrested(who), true;
  return false;
}
function arrested(who) {
  const fine = Math.min(player.gold, 300);
  player.gold -= fine;
  repAdd(-25);
  player.plot = null;
  if (FRIENDS.rainha) player.rel.rainha = 0;
  passTime(36, "Um dia e meio na masmorra do castelo...");
  vilaNews(`${player.name} foi pres${genderWord("o", "a", "e")} por conspirar contra a coroa!`);
  say([
    ["Guarda Tomé", `${who ? who + " contou tudo. " : ""}${player.name}, você está pres${genderWord("o", "a", "e")} por traição à coroa!`],
    ["Rainha Aurélia", "Achou mesmo que eu não ia descobrir? Masmorra. E pague a multa."],
    ["", `Você passou um dia e meio na masmorra e pagou ${fine} de ouro. A conspiração acabou.`],
  ]);
  saveGame();
}
function plotMenu() {
  if (!lifeMode()) return;
  if (rulesK("aurelia")) return royalMenu();
  if (playerAge() < 18) return say([["", "Você ainda é jovem demais para derrubar uma coroa."]]);
  const P = plot();
  const sup = supportTotal();
  const txt = `<b>Apoio:</b> ${sup}/100 · <b>Suspeita da guarda:</b> ${P.sus}/100<br>Aliados: ${P.allies.map(shortName).join(", ") || "ninguém ainda"} · Guardas subornados: ${P.bribes} · Armas: ${P.arms}<br><small>Com 60+ de apoio o golpe tem boa chance. Se a suspeita chegar a 100, você é pres${genderWord("o", "a", "e")}.</small>`;
  const opts = [
    { t: "Chamar alguém para a conspiração", icon: "chat", fn: recruitMenu },
    {
      t: `Subornar um guarda (${withTax(150)} ouro)`,
      icon: "coin",
      fn: () => {
        if (player.gold < withTax(150)) return say([["", "Você não tem ouro para o suborno."]], plotMenu);
        payWithTax(150);
        P.bribes++;
        if (raiseSus(8 + Math.floor(Math.random() * 10), "Um guarda")) return;
        saveGame();
        say([["Guarda (cochichando)", pk(["Na noite certa, o portão vai estar destrancado. Não me viu.", "Eu não vi nada, não ouvi nada e não estou aqui.", "Por esse ouro eu até tropeço na hora certa."])]], plotMenu);
      },
    },
    {
      t: `Comprar armas na Forja (${withTax(200)} ouro)`,
      icon: "sword",
      fn: () => {
        if (player.gold < withTax(200)) return say([["", "Você não tem ouro para as armas."]], plotMenu);
        payWithTax(200);
        P.arms++;
        if (raiseSus(10, "O ferreiro")) return;
        saveGame();
        say([["Brann, o Ferreiro", hasTrait("ferreiro", "esquentado") ? "Vinte espadas pra uma 'festa'? Sei... Leva logo antes que eu mude de ideia." : "Não pergunto pra quê. Mas cuidado."]], plotMenu);
      },
    },
    {
      t: "Espalhar boatos contra a Rainha",
      icon: "chat",
      fn: () => {
        if (player.famDay.boato === player.day) return say([["", "Você já espalhou boatos hoje. Mais um e vão desconfiar."]], plotMenu);
        player.famDay.boato = player.day;
        repAdd(hasTrait("player", "fofoqueiro") ? 3 : 2);
        if (FRIENDS.rainha) player.rel.rainha = Math.max(0, friendship("rainha") - 4);
        if (raiseSus(6, null)) return;
        vilaNews(pk(["Dizem que a Rainha gasta o Imposto Real em perucas!", "Boato: a Rainha quer dobrar o imposto da padaria!", "Ouvi dizer que o castelo tem uma sala só de sapatos."]));
        saveGame();
        say([["", "Você cochicha na taverna, na feira e na fila do pão. O povo começa a duvidar da coroa."]], plotMenu);
      },
    },
    {
      t: "Esfriar a cabeça (diminuir a suspeita)",
      icon: "flower",
      fn: () => {
        passTime(8, "Você passa o dia longe de qualquer conspiração...");
        P.sus = Math.max(0, P.sus - 25);
        saveGame();
        say([["", "Ninguém viu você com ninguém hoje. A guarda relaxa um pouco."]], plotMenu);
      },
    },
  ];
  const h = currentHour();
  opts.push({
    t: h >= 22 || h < 4 ? `DAR O GOLPE AGORA (${sup}% de apoio)` : "Dar o golpe (só de noite, das 22h às 4h)",
    icon: "crown",
    off: !(h >= 22 || h < 4),
    fn: () => (h >= 22 || h < 4 ? coupNight() : null),
  });
  opts.push({ t: "Desistir da conspiração", icon: "door", fn: () => ((player.plot = null), saveGame(), toast("Você queimou os mapas do castelo. Conspiração encerrada.", 2600)) });
  opts.push({ t: "Fechar", fn: null });
  game.pieAnchor = null;
  choice("Conspiração contra a coroa", txt, opts);
}
function recruitMenu() {
  const P = plot();
  const cands = Object.keys(FRIENDS).filter((id) => NPCS[id] && id !== "rainha" && !P.allies.includes(id) && !isChildNpc(id) && friendship(id) >= 25 && player.famDay["plot" + id] !== player.day);
  if (!cands.length) return say([["", "Ninguém mais em quem você confie o bastante (amizade 25+). Faça amigos e volte."]], plotMenu);
  cands.sort((a, b) => joinChance(b) - joinChance(a));
  choice(
    "Quem chamar?",
    "Cada pessoa aceita ou não pelo jeito dela. Leais à coroa podem te entregar!",
    cands
      .slice(0, 12)
      .map((id) => ({
        t: `${shortName(id)} (${Math.round(joinChance(id) * 100)}%)`,
        fn: () => {
          player.famDay["plot" + id] = player.day;
          const n = shortName(id);
          if (Math.random() < joinChance(id)) {
            P.allies.push(id);
            raiseSus(4, null);
            saveGame();
            const line =
              id === "marcos"
                ? "Um general sabe quando o reino precisa de mudança. O exército vai comigo. Mas a Julia não pode saber!"
                : id === "luca"
                  ? "FINALMENTE! Eu sabia que o roteiro ia chegar nessa parte! Conta comigo."
                  : id === "lucas"
                    ? "Golpe? Eu topo. Mas se der errado eu nunca te conheci, combinado?"
                    : pk(["Tô dentro. Essa coroa já deu o que tinha que dar.", "Com você eu vou até o fim.", "Conta comigo. Mas ninguém pode saber!", "Finalmente alguém com coragem!"]);
            return say([[n, line], ["", `${n} entrou na conspiração! (+${allyWeight(id)} de apoio)`]], plotMenu);
          }
          if (CROWN_LOYAL.has(id) && Math.random() < 0.6) {
            addFriendship(id, -15);
            if (raiseSus(45, n)) return;
            saveGame();
            return say([[n, "Traição?! Vou fingir que não ouvi... por enquanto. Mas a guarda vai ficar de olho em você."]], plotMenu);
          }
          addFriendship(id, -3);
          raiseSus(8, null);
          saveGame();
          say([[n, pk(["Golpe? Tá louc" + genderWord("o", "a", "e") + "? Não quero me meter nisso.", "Eu gosto da minha cabeça no pescoço, obrigad" + gw(id, "o", "a") + ".", "Não conto pra ninguém. Mas também não ajudo."])]], plotMenu);
        },
      }))
      .concat([{ t: "Voltar", fn: plotMenu }]),
  );
}

/* ===================== A NOITE DO GOLPE ===================== */

function coupNight() {
  const P = plot();
  let power = supportTotal();
  const allyNames = P.allies.map(shortName);
  const roll = (bonus) => Math.random() * 100 < Math.max(8, Math.min(95, power + bonus));
  const stage3 = () =>
    choice("Sala do Trono", "A Rainha Aurélia está de pé ao lado do trono, com a coroa nas mãos.", [
      {
        t: "Exigir a coroa (discurso)",
        icon: "crown",
        fn: () => (roll((player.rep ?? 50) / 4 - 10) ? coupWin("discurso") : coupFail("A Rainha chama o resto da guarda enquanto você discursa.")),
      },
      {
        t: "Prender a Rainha",
        icon: "sword",
        fn: () => (roll(P.arms * 6) ? coupWin("prisão") : coupFail("A Rainha foge por uma passagem secreta e volta com a guarda!")),
      },
      {
        t: "Oferecer exílio em paz",
        icon: "flower",
        fn: () => (roll(10) ? coupWin("exílio") : coupFail("A Rainha recusa e grita por socorro. Os sinos tocam!")),
      },
    ]);
  const stage2 = () =>
    choice("O Salão do Castelo", "Guardas leais à Rainha bloqueiam o salão. Tochas, espadas e muita gritaria.", [
      {
        t: P.allies.includes("marcos") ? "O General Marcos manda os soldados recuarem" : "Lutar contra os guardas",
        icon: "sword",
        fn: () => {
          if (P.allies.includes("marcos") || roll(P.arms * 7 - 5)) {
            power += 5;
            say([["", P.allies.includes("marcos") ? 'O General Marcos ergue a mão: "Soldados, abaixem as armas." E eles obedecem.' : "Espadas batem, cadeiras voam... e os guardas se rendem!"]], stage3);
          } else coupFail("Os guardas leais eram muitos. Vocês recuam feridos.");
        },
      },
      {
        t: "Criar uma distração (Luca, faça alguma coisa!)",
        icon: "laugh",
        fn: () => {
          const luca = P.allies.includes("luca");
          if (luca || roll(-5)) {
            say([["Luca", luca ? "ATENÇÃO, GUARDAS! O JOGO VAI SALVAR AGORA! NÃO DESLIGUEM O VIDEOGAME!" : ""], ["", "Os guardas ficam confusos o suficiente para vocês passarem."]].filter((l) => l[1]), stage3);
          } else coupFail("A distração não funcionou. Os guardas riram e depois prenderam todo mundo.");
        },
      },
    ]);
  game.fade = 1;
  say(
    [
      ["", `Meia-noite em Cinzaluz. ${allyNames.length ? allyNames.join(", ") + (allyNames.length > 1 ? " esperam" : " espera") : "Sozinh" + genderWord("o", "a", "e") + ", você espera"} nas sombras da praça.`],
      ...(P.allies.includes("lucas") ? [["Lucas Marzocca", "Se alguém perguntar, a gente veio ver a lua. Bonita, né?"]] : []),
      ["", "Os portões do castelo estão logo à frente."],
    ],
    () =>
      choice("Os Portões", `Força do golpe: ${power}%`, [
        {
          t: P.bribes ? `Entrar pelo portão destrancado (${P.bribes} guarda${P.bribes > 1 ? "s" : ""} subornado${P.bribes > 1 ? "s" : ""})` : "Escalar o muro",
          icon: "door",
          fn: () => (P.bribes || roll(-10) ? say([["", P.bribes ? "O guarda subornado olha para o outro lado. O portão range... e abre." : "Você escala o muro com uma corda velha. Ninguém viu!"]], stage2) : coupFail("A corda arrebentou e você caiu bem em cima de um guarda.")),
        },
        {
          t: player.ilum && ilumCount() >= 3 ? "Chamar o povo (os Iluministas invadem junto)" : "Gritar para o povo acordar",
          icon: "flag",
          fn: () => {
            if (player.ilum && ilumCount() >= 3) power += 15;
            if (roll(player.ilum ? 10 : -15)) say([["", "Janelas se acendem. Gente de pijama e tocha na mão corre para o castelo gritando com você!"]], stage2);
            else coupFail("Só o galo acordou. A guarda chegou primeiro.");
          },
        },
      ]),
  );
}
function coupWin(how) {
  const T = throne();
  T.aurelia = player.day;
  player.plot = null;
  syncRulers();
  if (player.spouse === "rainha") {
    player.spouse = null;
    player.divorced = player.day;
  }
  if (FRIENDS.rainha) player.rel.rainha = 0;
  repAdd(how === "discurso" ? 8 : how === "exílio" ? 5 : -2);
  player.coupDay = player.day;
  game.fade = 1;
  playSound(523, 0.3, "triangle");
  setTimeout(() => playSound(659, 0.3, "triangle"), 250);
  setTimeout(() => playSound(784, 0.5, "triangle"), 500);
  vilaNews(`GOLPE! ${player.name} tomou o castelo e é ${genderWord("o novo Rei", "a nova Rainha", "a nova Majestade")} de Aurélia!`);
  announceWorld(`GOLPE DE ESTADO! ${player.name} agora governa Aurélia!`);
  ACH_CHECK();
  saveGame();
  say([
    ["Rainha Aurélia", { discurso: "...O povo está com você. Eu sei quando perdi. Fique com a coroa.", prisão: "Vocês vão se arrepender disso! Eu VOLTO!", exílio: "Exílio em paz... Vou para as Marés. Cuide do meu povo melhor do que eu cuidei." }[how]],
    ["", `Na manhã seguinte, o sino toca. ${player.name} é coroad${genderWord("o", "a", "e")} na escadaria do castelo.`],
    ["Luca", "Ok, agora a gente protesta contra VOCÊ? ...Brincadeira. Talvez."],
    ["", `Você agora é ${royalTitle()}! Aperte K para governar: impostos, festas, guerras e conquistar os outros reinos.`],
  ]);
}
function coupFail(why) {
  const P = plot();
  const caught = Math.random() < 0.6;
  for (const id of P.allies) addFriendship(id, -10);
  player.plot = null;
  if (caught) {
    say([["", why]], () => arrested(null));
  } else {
    repAdd(-10);
    passTime(4, "Vocês fogem pelos becos escuros...");
    vilaNews(`Tentaram dar um golpe no castelo esta noite! Ninguém sabe quem foi... ainda.`);
    saveGame();
    say([["", why], ["", "Vocês fugiram pelos becos antes de serem reconhecidos. A conspiração acabou, mas você está livre."]]);
  }
}

/* ===================== CONQUISTAR OS OUTROS REINOS ===================== */

function army() {
  return (player.army = player.army || 0);
}
function conquerMenu(k) {
  const K = KINGDOMS[k],
    w = worldState(),
    rel = w.rel[pairKey("aurelia", k)];
  const opts = [
    {
      t: `Recrutar 10 soldados (${withTax(120)} ouro) · exército: ${army()}`,
      icon: "sword",
      fn: () => {
        if (player.gold < withTax(120)) return say([["Sargento", "Sem ouro, sem soldado, Majestade."]], () => conquerMenu(k));
        payWithTax(120);
        player.army = army() + 10;
        saveGame();
        toast(`+10 soldados. Exército: ${player.army}.`, 1800);
        conquerMenu(k);
      },
    },
    {
      t: atWar("aurelia", k) ? `INVADIR ${K.short.toUpperCase()} (exército ${army()})` : `Declarar guerra e invadir ${K.short}`,
      icon: "flag",
      fn: () => invade(k),
    },
    {
      t: `Golpe infiltrado em ${K.short} (${withTax(600)} ouro em subornos)`,
      icon: "eye",
      fn: () => {
        if (player.gold < withTax(600)) return say([["Espiã Real", "Para comprar a guarda de lá, preciso de mais ouro."]], () => conquerMenu(k));
        payWithTax(600);
        const ch = 0.3 + (player.rep ?? 50) / 300 + (rel < 40 ? 0.1 : 0);
        if (Math.random() < ch) conquered(k, "golpe");
        else {
          repAdd(-6);
          w.rel[k === "mares" ? pairKey("aurelia", "mares") : pairKey("aurelia", "serra")] = Math.max(0, rel - 20);
          saveGame();
          say([["", `A espiã foi descoberta em ${K.short}. ${K.ruler} expulsou seus agentes e ficou furioso com Aurélia.`]]);
        }
      },
    },
    {
      t: rel >= 75 ? `União diplomática com ${K.short} (${withTax(2500)} ouro)` : `União diplomática (precisa de relação 75+, agora ${rel})`,
      icon: "heart",
      off: rel < 75,
      fn: () => {
        if (rel < 75) return;
        if (player.gold < withTax(2500)) return say([[K.ruler, "Uma união dos reinos tem seu preço. Volte com o dote."]], () => conquerMenu(k));
        payWithTax(2500);
        conquered(k, "uniao");
      },
    },
    { t: "Voltar", fn: royalMenu },
  ];
  choice(`Conquistar ${K.n}`, `Governante: ${K.ruler}. Relação com Aurélia: ${rel}/100${atWar("aurelia", k) ? " (EM GUERRA)" : ""}.<br>Exército: ${army()} soldados${friendshipLevel("marcos") >= 2 ? " · O General Marcos comanda as tropas" : ""}.`, opts);
}
function invade(k) {
  const K = KINGDOMS[k];
  const w = worldState();
  if (!atWar("aurelia", k)) {
    w.wars[pairKey("aurelia", k)] = { since: player.day };
    w.rel[pairKey("aurelia", k)] = 10;
    repAdd(-4);
    announceWorld(`GUERRA! ${royalTitle()} invadiu ${K.n}!`);
  }
  if (army() < 10) return say([["Sargento", "Majestade, sem soldados não dá para invadir nada. Recrute pelo menos 10."]], () => conquerMenu(k));
  const defense = k === "mares" ? 45 : 55;
  let score = army() + (friendshipLevel("marcos") >= 2 ? 20 : 0) + (rulesK(k === "mares" ? "serra" : "mares") ? 15 : 0);
  const fight = (label, bonus, nextFn) => {
    const ok = Math.random() * 100 < Math.max(10, Math.min(92, 50 + (score + bonus - defense)));
    const lost = Math.round(army() * (ok ? 0.1 : 0.3));
    player.army = Math.max(0, army() - lost);
    score -= lost / 2;
    say([["", `${label}: ${ok ? "vitória!" : "derrota!"} (${lost} soldados perdidos)`]], () => nextFn(ok));
  };
  const finale = (wins) => {
    if (wins >= 2) conquered(k, "guerra");
    else {
      repAdd(-8);
      saveGame();
      say([[K.ruler, "Volte para o seu castelo e conte quantos soldados sobraram!"], ["", `A invasão de ${K.short} falhou. A guerra continua.`]]);
    }
  };
  choice(`Invasão de ${K.n}`, `Escolha a estratégia. Exército: ${army()} soldados contra a defesa de ${K.short}.`, [
    { t: "Ataque frontal (rápido, arriscado)", icon: "sword", fn: () => fight("Ataque frontal", 0, (a) => fight("Batalha na praça", 5, (b) => finale(a + b + (Math.random() < 0.5 ? 1 : 0)))) },
    { t: "Cerco (lento, mais seguro)", icon: "house", fn: () => (passTime(12, "Doze horas de cerco..."), fight("Cerco às muralhas", 12, (a) => fight("Fome na cidade", 10, (b) => finale(a + b + (a && b ? 1 : 0))))) },
    { t: k === "mares" ? "Ataque pelo mar à noite" : "Emboscada nas montanhas", icon: "eye", fn: () => fight("Emboscada", 8, (a) => fight("Tomada do palácio", a ? 15 : -5, (b) => finale(a + b + (b ? 1 : 0)))) },
  ]);
}
function conquered(k, how) {
  const K = KINGDOMS[k];
  const old = BASE_RULERS[k];
  throne()[k] = player.day;
  delete worldState().wars[pairKey("aurelia", k)];
  worldState().rel[pairKey("aurelia", k)] = 70;
  syncRulers();
  repAdd(how === "uniao" ? 10 : how === "golpe" ? 2 : -3);
  const line = { guerra: `${old} entrega a espada: "${K.short} é sua. Trate bem o meu povo."`, golpe: `Na madrugada, os guardas de ${K.short} abrem as portas. ${old} acorda sem coroa.`, uniao: `${old} assina o tratado: "Que ${KINGDOMS.aurelia.short} e ${K.short} sejam um só reino."` }[how];
  vilaNews(`${player.name} agora governa ${K.n} também!`);
  const all = ruledCount() === 3;
  announceWorld(all ? `UM SÓ IMPÉRIO! ${player.name} governa os Três Reinos!` : `${K.n} agora pertence a ${player.name}!`);
  ACH_CHECK();
  saveGame();
  say([
    ["", line],
    ["", all ? `Aurélia, Marés e Pedravale agora são um só império. Você é ${royalTitle()}! As guerras entre os três reinos acabaram.` : `Você agora é ${royalTitle()}. ${K.short} paga tributo todo dia.`],
  ]);
}

/* ===================== CONTRAGOLPE ===================== */

{
  const dayBase = onNewDay;
  onNewDay = function () {
    dayBase.apply(this, arguments);
    if (!rulesK("aurelia") || player.spouse === "rainha") return;
    const rep = player.rep ?? 50;
    if (rep < 25 && player.day - (player.coupDay || 0) > 2 && Math.random() < 0.3) setTimeout(counterCoup, 6000);
  };
}
function counterCoup() {
  if (game.mode !== "world" || game.dialog) return setTimeout(counterCoup, 5000);
  choice("CONTRAGOLPE!", `A Rainha Aurélia voltou do exílio com soldados das Marés! O povo está insatisfeito com você (reputação ${player.rep}).`, [
    {
      t: `Defender o castelo (exército ${army()})`,
      icon: "sword",
      fn: () => {
        const ok = Math.random() * 100 < 35 + army() / 2 + (friendshipLevel("marcos") >= 2 ? 15 : 0);
        player.army = Math.max(0, army() - 10);
        if (ok) {
          repAdd(3);
          saveGame();
          say([["", "Seus soldados seguram os portões até o amanhecer. A Rainha recua. A coroa continua sua!"]]);
        } else loseThrone("Os portões caíram. A Rainha Aurélia retomou o castelo.");
      },
    },
    {
      t: "Baixar impostos e dar uma festa para o povo",
      icon: "party",
      fn: () => {
        player.royalTax = "baixo";
        repAdd(10);
        if (Math.random() < 0.55) say([["", "O povo sai às ruas com tochas... para festejar com você! A Rainha não acha apoio e volta para o exílio."]]);
        else loseThrone("Tarde demais: o povo abriu os portões para a Rainha.");
        saveGame();
      },
    },
    { t: "Fugir com o tesouro", icon: "coin", fn: () => ((player.gold += 200), loseThrone("Você foge pela passagem secreta com um saco de ouro.")) },
  ]);
}
function loseThrone(why) {
  player.throne = {};
  syncRulers();
  repAdd(-10);
  vilaNews(`A Rainha Aurélia voltou ao trono! ${player.name} perdeu a coroa.`);
  saveGame();
  say([["", why], ["Rainha Aurélia", "Bem-vind" + genderWord("o", "a", "e") + " de volta à vida de súdito. Os impostos agora são meus de novo."]]);
}

/* ===================== MENUS ===================== */

/** Roda fn e, na próxima chamada de choice() que ela fizer, deixa mexer nas opções e no texto. */
function hookChoice(fn, mutate) {
  const ch = choice;
  choice = function (title, text, opts) {
    choice = ch;
    const r = mutate(title, text, opts);
    return ch(r[0], r[1], r[2]);
  };
  try {
    fn();
  } finally {
    choice = ch;
  }
}
{
  const menuBase = royalMenu;
  royalMenu = function () {
    hookChoice(menuBase, (title, text, opts) => {
      if (!rulesK("aurelia")) return [title, text, opts];
      const extra = ["mares", "serra"].filter((k) => !rulesK(k)).map((k) => ({ t: `Conquistar ${KINGDOMS[k].short}…`, icon: "flag", fn: () => conquerMenu(k) }));
      if (extra.length) extra.push({ t: `Exército: ${army()} soldados (recrutar)`, icon: "sword", fn: () => conquerMenu(["mares", "serra"].find((k) => !rulesK(k))) });
      return [royalTitle(), `Tesouro: impostos de ${ruledCount()} reino(s) caem todo dia. Exército: ${army()}. Reputação: ${player.rep ?? 50}.`, opts.slice(0, -1).concat(extra, opts.slice(-1))];
    });
  };
  const kBase = kingdomsMenu;
  kingdomsMenu = function () {
    syncRulers();
    hookChoice(kBase, (title, text, opts) => {
      if (rulesK("aurelia")) text = text.replace(` e Rainha Aurélia`, "");
      if (lifeMode() && !rulesK("aurelia")) {
        const P = player.plot;
        opts.splice(opts.length - 1, 0, { t: P ? `Conspiração (apoio ${supportTotal()}%, suspeita ${P.sus}%)` : player.spouse === "rainha" ? "Golpe palaciano (governar sozinh" + genderWord("o", "a", "e") + ")" : "Conspirar contra a coroa (golpe de estado)", icon: "crown", fn: plotMenu });
      }
      return [title, text, opts];
    });
  };
  // Casado com a Rainha também pode dar um golpe palaciano.
  const ilBase = ilumItems;
  ilumItems = function (id) {
    const items = ilBase(id);
    if (lifeMode() && !rulesK("aurelia") && (id === "lucas" || id === "luca"))
      items.push({
        t: player.plot ? "Falar da conspiração" : "Propor um golpe de estado 👑",
        icon: "crown",
        fn: () => {
          const P = plot();
          if (!P.allies.includes(id)) P.allies.push(id);
          saveGame();
          say([[shortName(id), id === "luca" ? "Golpe? Eu já tinha o plano desenhado num guardanapo! Tô dentro." : "Derrubar a coroa? Finalmente uma festa que eu levo a sério. Tô dentro!"]], plotMenu);
        },
      });
    return items;
  };
}
/* Coroa sobre a cabeça de quem governa. */
{
  const drawBase = crewDrawList;
  crewDrawList = function (list, t) {
    drawBase(list, t);
    if (!lifeMode() || !ruledCount() || player.zone === "title") return;
    list.push({
      y: player.ry + 0.02,
      draw: () => {
        const X = player.rx * TILE + 9,
          Y = player.ry * TILE - 6 + Math.sin(t * 2) * 0.6 - (player.riding ? 12 : 0);
        ctx.fillStyle = "#c9a03a";
        ctx.fillRect(X, Y + 3, 14, 4);
        ctx.fillStyle = "#f2c14e";
        ctx.fillRect(X, Y + 2, 14, 3);
        for (const k of [0, 6, 12]) ctx.fillRect(X + k, Y - 1, 2, 4);
        ctx.fillStyle = ruledCount() === 3 ? "#5fd0ff" : "#c94a4a";
        ctx.fillRect(X + 6, Y + 3, 2, 2);
      },
    });
  };
}
/* Protestos contra a nova coroa: quem aparece na escadaria é você. */
{
  const startBase = startProtest;
  startProtest = function (force) {
    const r = startBase(force);
    if (r && rulesK("aurelia") && game.protest) {
      game.protest.queen.isPlayer = true;
      game.protest.queen.nome = player.name;
    }
    return r;
  };
  const drawQ = drawQueen;
  drawQueen = function (q, t) {
    if (!q.isPlayer) return drawQ(q, t);
    drawSprite(heroRects(player.look, "down", null, 0), q.rx * TILE, q.ry * TILE, 2, false);
  };
}
ACHIEVEMENTS.push(["golpe", "Golpe de estado", "Tome o trono de Aurélia.", "crown", () => !!(player.throne && player.throne.aurelia)]);
ACHIEVEMENTS.push(["imperio", "Um só império", "Governe os Três Reinos.", "crown", () => !!(player.throne && player.throne.aurelia && player.throne.mares && player.throne.serra)]);
function ACH_CHECK() {
  if (typeof achTick === "function") setTimeout(achTick, 1500);
}
syncRulers();
