/**
 * ECOS DO ARCANO — 42-vida-autonoma.js
 * Moradores com vontade própria:
 *  - a turma sente fome, saudade dos amigos e tédio, e decide sozinha aonde ir
 *    (comer, visitar alguém, passear, fugir da chuva);
 *  - quem se encontra conversa de verdade, com balões de fala (rua e lojas);
 *  - nos diálogos, quem está por perto entra na conversa;
 *  - ciúme: dar em cima de gente casada pode acabar em briga ou com o marido
 *    (ou a esposa) correndo atrás com uma faca. Vale para qualquer um;
 *  - Lucas Marzocca é o campeão: vive flertando com gente casada e fugindo.
 */

"use strict";

/* ===================== CAMINHO EM QUALQUER LUGAR ===================== */

/** Caminho (BFS) na zona atual. Devolve a lista de passos ou null. */
function zonePath(zone, sx, sy, tx, ty, limit = 2500, goalOk) {
  if (sx === tx && sy === ty) return [];
  const key = (x, y) => x * 4096 + y;
  const prev = new Map([[key(sx, sy), null]]);
  const q = [[sx, sy]];
  let end = null;
  while (q.length) {
    const [x, y] = q.shift();
    if ((x === tx && y === ty) || (goalOk && goalOk(x, y))) {
      end = [x, y];
      break;
    }
    for (const [dx, dy] of DIRS4) {
      const nx = x + dx,
        ny = y + dy,
        k = key(nx, ny);
      if (prev.has(k)) continue;
      if (!(nx === tx && ny === ty) && !walkable(zone, nx, ny)) continue;
      prev.set(k, [x, y]);
      q.push([nx, ny]);
    }
    if (prev.size > limit) break;
  }
  if (!end) return null;
  const path = [];
  let cur = end;
  while (cur && !(cur[0] === sx && cur[1] === sy)) {
    path.unshift(cur);
    cur = prev.get(key(cur[0], cur[1]));
  }
  return path;
}
const dist1 = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
const dirTo = (from, to) => (Math.abs(to.x - from.x) >= Math.abs(to.y - from.y) ? (to.x > from.x ? "right" : "left") : to.y > from.y ? "down" : "up");
function nearPlayer(o, r = 12) {
  return Math.abs(o.x - player.x) + Math.abs(o.y - player.y) <= r;
}

/* ===================== CONVERSAS COM BALÃO ===================== */

game.convs = [];
/**
 * Duas (ou mais) pessoas conversam com balões de fala.
 * parts: [{ref, nome, id}] (ref tem x/y e fica parado durante a conversa);
 * lines: [[nome, fala]].
 */
function startConv(parts, lines, opt = {}) {
  if (parts.some((p) => p.ref.talking)) return false;
  const total = lines.reduce((a, [, s]) => a + 2.2 + s.length / 24, 0) + 0.6;
  for (const p of parts) {
    p.ref.talking = total;
    freezeRef(p.ref, total);
  }
  for (let i = 0; i < parts.length; i++) {
    const o = parts[(i + 1) % parts.length];
    parts[i].ref.dir = dirTo(parts[i].ref, o.ref);
  }
  game.convs.push({ parts, lines, i: -1, t: 0.2, zone: player.zone, ...opt });
  return true;
}
function freezeRef(ref, s) {
  if (ref.kind === "crew") ref.step = Math.max(ref.step || 0, s);
  else if (ref.kind === "roam") ref.timer = Math.max(ref.timer || 0, s);
  else if (ref.kind === "walker" || ref.nm) ref.chat = Math.max(ref.chat || 0, s);
}
function convTick(dt) {
  for (const c of game.convs) {
    if (c.zone !== player.zone) {
      c.done = true;
      continue;
    }
    c.t -= dt;
    if (c.t > 0) continue;
    c.i++;
    if (c.i >= c.lines.length) {
      c.done = true;
      if (c.onEnd) c.onEnd();
      continue;
    }
    const [who, txt] = c.lines[c.i];
    const p = c.parts.find((q) => q.nome === who) || c.parts[c.i % c.parts.length];
    const dur = 2.2 + txt.length / 24;
    c.t = dur;
    if (nearPlayer(p.ref, 16)) {
      game.shouts = (game.shouts || []).concat([{ x: p.ref.x, y: p.ref.y, txt, t: dur }]);
      if (c.loud) playSound(200 + Math.random() * 200, 0.05, "square");
    }
  }
  game.convs = game.convs.filter((c) => !c.done);
  const dec = (o) => o && o.talking > 0 && (o.talking -= dt);
  for (const a of Object.values(game.crewA || {})) dec(a);
  for (const r of game.roam || []) dec(r);
  for (const w of game.walkers || []) dec(w);
  for (const p of (game.inter && game.inter.people) || []) dec(p);
}

/* ===================== VONTADE PRÓPRIA DA TURMA ===================== */

const DESIRES = {
  comer: { ic: "apple", why: "foi comer alguma coisa", need: "fome" },
  social: { ic: "chat", why: "foi visitar um amigo", need: "social" },
  passear: { ic: "note", why: "foi passear", need: "fun" },
  sentar: { ic: "zzz", why: "foi descansar um pouco", need: "energia" },
  namorar: { ic: "heart", why: "foi ver quem ama", need: "social" },
};
function crewNeeds(id) {
  game.cneeds = game.cneeds || {};
  return (game.cneeds[id] = game.cneeds[id] || { fome: 50 + Math.random() * 50, social: 40 + Math.random() * 60, fun: 40 + Math.random() * 60, energia: 60 + Math.random() * 40 });
}
function vilaSpot(name) {
  const b = typeof vilaBuilding === "function" ? vilaBuilding(name) : null;
  return b ? doorOut(b) : null;
}
function freeNear(zone, x, y, r = 2) {
  for (let k = 0; k < 20; k++) {
    const nx = x + Math.round((Math.random() - 0.5) * 2 * r),
      ny = y + Math.round((Math.random() - 0.5) * 2 * r);
    if ((nx !== x || ny !== y) && walkable(zone, nx, ny)) return [nx, ny];
  }
  return null;
}
function chooseDesire(a) {
  const N = crewNeeds(a.id);
  const w = { comer: (100 - N.fome) / 20, social: (100 - N.social) / 18, passear: (100 - N.fun) / 22, sentar: (100 - N.energia) / 25, namorar: 0 };
  if (npcSpouse(a.id) && game.crewA[npcSpouse(a.id)] && crewVisible(game.crewA[npcSpouse(a.id)])) w.namorar = hasTrait(a.id, "romant") ? 3 : 1.2;
  if (hasTrait(a.id, "extro") || hasTrait(a.id, "fofoqueiro")) w.social += 2;
  if (hasTrait(a.id, "preguicoso")) w.sentar += 2;
  if (hasTrait(a.id, "aventureiro")) w.passear += 2;
  let r = Math.random() * Object.values(w).reduce((s, v) => s + v, 0),
    kind = "passear";
  for (const [k, v] of Object.entries(w)) if ((r -= v) < 0) {
    kind = k;
    break;
  }
  const z = ZONES.vila;
  let dest = null,
    with_ = null;
  if (kind === "comer") dest = vilaSpot(pk(["Taverna Javali Dourado", "Padaria", "Taverna Javali Dourado"]));
  else if (kind === "social" || kind === "namorar") {
    const others = Object.values(game.crewA).filter((o) => o !== a && crewVisible(o) && !o.talking && (kind === "social" || o.id === npcSpouse(a.id)));
    if (others.length) {
      const o = pk(others);
      with_ = o.id;
      dest = freeNear("vila", o.x, o.y, 1) || [o.x, o.y + 1];
    }
  } else {
    if (!z.pois) buildPointsOfInterest(z);
    const pool = z.pois.filter((p) => (kind === "sentar" ? p.kind === "look" || p.kind === "drink" : p.kind !== "door"));
    if (pool.length) {
      const p = pk(pool);
      dest = [p.x, p.y];
    }
  }
  if (!dest) return;
  a.auto = { kind, dest, with: with_, until: player.day * 1440 + player.clock + 40 + Math.random() * 80 };
  game.bubbles.push({ x: a.x, y: a.y, icon: DESIRES[kind].ic, t: 2 });
}
{
  const targetBase = crewTarget;
  crewTarget = function (id) {
    const base = targetBase(id);
    const a = game.crewA && game.crewA[id];
    if (!a || !Array.isArray(base) || crewGathering() || (typeof girlsCoffee === "function" && girlsCoffee())) return base;
    if (game.chase && game.chase.who === id) return base;
    // Chuva forte: quem não está trabalhando corre para casa.
    if ((player.weather === "tempestade" || (player.weather === "chuva" && hashStr(id) % 2)) && !(typeof workplaceOf === "function" && workplaceOf(id)) && crewHomeOf(id)) return "home";
    const now = player.day * 1440 + player.clock;
    if (a.auto && now < a.auto.until) return a.auto.dest;
    if (a.auto) a.auto = null;
    return base;
  };
}
let autoAcc = 0;
function autonomyTick(dt) {
  if (!lifeMode() || player.zone !== "vila" || !game.crewA) return;
  const sdt = dt * (typeof timeSpeed === "function" ? timeSpeed() : 1);
  for (const id of Object.keys(game.crewA)) {
    const N = crewNeeds(id);
    N.fome = Math.max(0, N.fome - sdt * 0.3);
    N.social = Math.max(0, N.social - sdt * 0.4);
    N.fun = Math.max(0, N.fun - sdt * 0.25);
    N.energia = Math.max(0, N.energia - sdt * 0.15);
  }
  autoAcc += dt;
  if (autoAcc < 1) return;
  autoAcc = 0;
  for (const a of Object.values(game.crewA)) {
    if (!crewVisible(a) || a.talking > 0 || (game.chase && (game.chase.who === a.id || (game.chase.tgt && game.chase.tgt === a)))) continue;
    const N = crewNeeds(a.id);
    // Chegou aonde queria: satisfaz a vontade.
    if (a.auto && a.path && !a.path.length) {
      const k = a.auto.kind;
      if (k === "comer") (N.fome = 100), game.bubbles.push({ x: a.x, y: a.y, icon: "apple", t: 1.6 });
      if (k === "passear") N.fun = Math.min(100, N.fun + 50);
      if (k === "sentar") N.energia = Math.min(100, N.energia + 40);
      if ((k === "social" || k === "namorar") && a.auto.with) {
        const o = game.crewA[a.auto.with];
        if (o && crewVisible(o) && dist1(a, o) <= 2 && !o.talking) {
          N.social = 100;
          crewNeeds(o.id).social = Math.min(100, crewNeeds(o.id).social + 40);
          startConv(
            [
              { ref: a, nome: shortName(a.id), id: a.id },
              { ref: o, nome: shortName(o.id), id: o.id },
            ],
            genExchange({ id: a.id, nome: shortName(a.id) }, { id: o.id, nome: shortName(o.id) }),
          );
        }
      }
      if (k !== "social" && k !== "namorar") a.auto.until = Math.min(a.auto.until, player.day * 1440 + player.clock + 20);
      else a.auto = null;
      continue;
    }
    if (!a.auto && (Math.random() < 0.035 || Object.values(N).some((v) => v < 20))) chooseDesire(a);
  }
  // Quem se esbarra puxa conversa (turma, moradores com nome e gente da rua).
  if (Math.random() < 0.25) bumpChats();
}
function talkers() {
  const out = [];
  for (const a of Object.values(game.crewA || {})) if (player.zone === "vila" && crewVisible(a)) (a.kind = "crew"), out.push({ ref: a, id: a.id, nome: shortName(a.id) });
  for (const r of game.roam || []) if (NPCS[r.id] && !(typeof npcAsleep === "function" && npcAsleep(r.id))) (r.kind = "roam"), out.push({ ref: r, id: r.id, nome: shortName(r.id) });
  for (const w of game.walkers || []) if (!(w.inside > 0) && !(w.sit > 0)) (w.kind = "walker"), out.push({ ref: w, id: "w:" + w.nm, nome: w.nm });
  return out.filter((p) => !(p.ref.talking > 0) && nearPlayer(p.ref, 14));
}
function bumpChats() {
  if (!ZONES[player.zone] || !ZONES[player.zone].town) return;
  if (game.convs.length >= 3) return;
  const ps = talkers();
  // O Marzoca perto de alguém casado: confusão garantida.
  const lu = ps.find((p) => p.id === "lucas");
  if (lu) {
    const foe = ps.find((p) => p !== lu && hatesMarzoca(p.id) && dist1(p.ref, lu.ref) <= 3);
    if (foe) {
      game.bubbles.push({ x: foe.ref.x, y: foe.ref.y, icon: "anger", t: 2.4 });
      startConv([foe, lu], genExchange(foe, lu), { loud: true });
      return;
    }
  }
  for (let i = 0; i < ps.length; i++)
    for (let j = i + 1; j < ps.length; j++) {
      const a = ps[i],
        b = ps[j];
      if (dist1(a.ref, b.ref) > 2 || (a.id.startsWith("w:") && b.id.startsWith("w:") && Math.random() < 0.5)) continue;
      startConv([a, b], genExchange(a, b));
      return;
    }
}
/* Nas lojas e na taverna, quem está lá dentro também conversa. */
let interAcc = 0;
function interiorChatTick(dt) {
  if (player.zone !== "interior" || !game.inter || game.convs.length) return;
  interAcc += dt;
  if (interAcc < 9) return;
  interAcc = 0;
  const ps = (game.inter.people || []).filter((p) => !(p.talking > 0));
  if (ps.length < 2 || Math.random() < 0.3) return;
  const a = pk(ps);
  const b = ps.filter((p) => p !== a).sort((p, q) => dist1(p, a) - dist1(q, a))[0];
  const A = { ref: a, id: a.cid || "w:" + (a.nm || "c1"), nome: a.nm || "Cliente" },
    B = { ref: b, id: b.cid || "w:" + (b.nm || "c2"), nome: b.nm || "Cliente" };
  startConv([A, B], genExchange(A, B));
}

/* ===================== QUEM ESTÁ PERTO ENTRA NA CONVERSA ===================== */

{
  const chatBase = chatWith;
  chatWith = function (id) {
    chatBase(id);
    const d = game.dialog;
    if (!d || !Math.random() || Math.random() > 0.35) return;
    const o = talkers().find((p) => p.id && p.id !== id && NPCS[p.id] && Math.abs(p.ref.x - player.x) + Math.abs(p.ref.y - player.y) <= 4);
    if (!o) return;
    const n = shortName(id),
      on = o.nome;
    const extra = [
      [on, pk([`Ei, ${n}, você tá falando de mim?`, `Posso me meter? ${genLine(o.id)}`, `${n} sempre conta essa história errado!`, `Concordo com ${n}. ${genLine(o.id, "voce")}`, `Hahaha, ${n} e ${player.name} fofocando de novo!`, `Ô ${n}, conta pra ${player.name} aquela do ${shortName(someCrew(o.id))}!`])],
      [n, pk([`Ninguém te chamou, ${on}!`, `Ah, ${on}, você não perde uma.`, `Tá vendo, ${player.name}? Essa vila não tem segredo.`, `${on}, depois a gente conversa.`, genLine(id)])],
    ];
    if (Math.random() < 0.5) extra.push([on, genLine(o.id)]);
    d.lines.push(...extra);
  };
}

/* ===================== PERSEGUIÇÃO (FACA) ===================== */

game.chase = null;
function spawnNear(zone, x, y, dmin = 5, dmax = 8) {
  for (let k = 0; k < 80; k++) {
    const nx = x + Math.round((Math.random() - 0.5) * 2 * dmax),
      ny = y + Math.round((Math.random() - 0.5) * 2 * dmax);
    const d = Math.abs(nx - x) + Math.abs(ny - y);
    if (d >= dmin && d <= dmax * 1.5 && walkable(zone, nx, ny) && zonePath(zone, nx, ny, x, y, 1200)) return [nx, ny];
  }
  return null;
}
const CHASE_YELLS = ["VOLTA AQUI, {T}!", "Ninguém mexe com {quem}!", "EU VOU TE PEGAR!", "Não adianta correr, {T}!", "Larga de ser sem-vergonha!", "Hoje você não escapa!", "{T}! Vem cá conversar com a faquinha!", "Era só um elogio, né? SEI!"];
const VICTIM_YELLS = ["SOCORRO!", "Foi só um elogio!", "Eu juro que não fiz nada!", "Alguém me esconde!", "Era brincadeira!!", "Não sou eu, é meu irmão gêmeo!", "Desculpa, desculpa, desculpaaa!"];
const CROWD_YELLS = ["Socorro! Uma faca!", "Corre, corre!", "De novo o Marzoca!", "Chama os guardas!", "Briga de casal na praça!", "Ai, minha nossa!"];
/**
 * who: quem corre atrás (id). target: "player" ou o ator perseguido (crew).
 * flirted: com quem flertaram (para as falas).
 */
function startChase(who, target, flirted) {
  if (game.chase) return false;
  const tg = target === "player" ? player : target;
  const at = spawnNear(player.zone, tg.x, tg.y, 5, 8);
  if (!at) return false;
  const n = NPCS[who];
  game.chase = {
    who,
    n,
    x: at[0],
    y: at[1],
    rx: at[0],
    ry: at[1],
    dir: "down",
    step: 0.6,
    fstep: 0,
    tgt: target === "player" ? null : target,
    flirted,
    t: 0,
    dur: target === "player" ? 32 : 22,
    hits: 0,
    stun: 0,
    yell: 0.4,
    zone: player.zone,
  };
  game.shake = 0.2;
  playSound(130, 0.4, "sawtooth");
  return true;
}
function chaseYell(c, txt) {
  game.shouts = (game.shouts || []).concat([{ x: c.x, y: c.y, txt, t: 2.2 }]);
}
function endChase(msg) {
  const c = game.chase;
  if (!c) return;
  game.chase = null;
  if (c.tgt) {
    c.tgt.step = 0;
    c.tgt.tk = null;
    c.tgt.talking = 0;
  }
  if (game.crewA && game.crewA[c.who]) {
    const a = game.crewA[c.who];
    [a.x, a.y] = [c.x, c.y];
    a.rx = a.x;
    a.ry = a.y;
    a.tk = null;
  }
  if (msg) toast(msg, 3600);
}
function chaseTick(dt) {
  const c = game.chase;
  if (!c) return;
  if (game.mode === "title") return (game.chase = null);
  if (game.mode !== "world" || game.dialog) return;
  const toPlayer = !c.tgt;
  if (player.zone !== c.zone) return endChase(toPlayer ? `${shortName(c.who)} ficou esperando lá fora... e desistiu. Ufa!` : null);
  c.t += dt;
  c.rx += (c.x - c.rx) * Math.min(1, dt * 9);
  c.ry += (c.y - c.ry) * Math.min(1, dt * 9);
  const T = toPlayer ? player : c.tgt;
  const tName = toPlayer ? player.name : shortName(c.tgt.id);
  c.yell -= dt;
  if (c.yell <= 0) {
    c.yell = 2.6;
    const quem = c.flirted ? gw(c.flirted, "o meu marido", "a minha esposa") : "a minha família";
    chaseYell(c, pk(CHASE_YELLS).replace("{T}", tName.toUpperCase()).replace("{quem}", quem));
    if (!toPlayer && Math.random() < 0.7) game.shouts.push({ x: T.x, y: T.y, txt: pk(VICTIM_YELLS), t: 2 });
  }
  // A rua entra em pânico.
  for (const w of game.walkers || [])
    if (Math.abs(w.x - c.x) + Math.abs(w.y - c.y) <= 5 && !(w.flee > 0)) {
      w.flee = 4;
      if (Math.random() < 0.15) {
        w.sayT = 2.4;
        w.sayTxt = pk(CROWD_YELLS);
      }
    }
  // Quem é perseguido (NPC) foge.
  if (!toPlayer) {
    const a = c.tgt;
    a.step = 99;
    a.kind = "crew";
    c.fstep -= dt;
    if (c.fstep <= 0) {
      c.fstep = 0.24;
      let best = null,
        bd = -1;
      for (const [dx, dy] of DIRS4) {
        const nx = a.x + dx,
          ny = a.y + dy;
        if (!walkable("vila", nx, ny) || (nx === player.x && ny === player.y)) continue;
        const d = Math.abs(nx - c.x) + Math.abs(ny - c.y) + Math.random() * 1.6;
        if (d > bd) (bd = d), (best = [nx, ny, dx, dy]);
      }
      if (best) {
        a.dir = best[2] > 0 ? "right" : best[2] < 0 ? "left" : best[3] > 0 ? "down" : "up";
        a.x = best[0];
        a.y = best[1];
      }
    }
  }
  if (c.stun > 0) return void (c.stun -= dt);
  c.step -= dt;
  if (c.step <= 0) {
    c.step = toPlayer ? (player.riding ? 0.15 : 0.19) : 0.27;
    const p = zonePath(c.zone, c.x, c.y, T.x, T.y, 1800);
    if (p && p.length > 1) {
      const [nx, ny] = p[0];
      c.dir = nx > c.x ? "right" : nx < c.x ? "left" : ny > c.y ? "down" : "up";
      c.x = nx;
      c.y = ny;
    }
  }
  const d = Math.abs(c.x - T.x) + Math.abs(c.y - T.y);
  if (d <= 1) {
    c.stun = 1.8;
    c.hits++;
    game.shake = 0.35;
    playSound(110, 0.25, "sawtooth");
    game.bubbles.push({ x: T.x, y: T.y, icon: "anger", t: 1.2 });
    if (toPlayer) {
      const mx = typeof maxHp === "function" ? maxHp() : player.maxHp || 60;
      player.hp = Math.max(1, Math.round(player.hp - mx * 0.22));
      if (lifeMode() && typeof addNeed === "function") addNeed("energy", -8);
      toast(c.hits >= 3 ? "Você desmaiou de susto!" : `Ai! ${shortName(c.who)} te acertou de raspão! (${c.hits}/3)`, 2200);
      if (c.hits >= 3) {
        const lost = Math.round(player.gold * 0.12);
        player.gold -= lost;
        player.hp = Math.max(player.hp, Math.round(mx * 0.4));
        const hosp = player.zone === "vila" && vilaSpot("Hospital");
        endChase();
        if (hosp) {
          [player.x, player.y] = hosp;
          player.rx = player.x;
          player.ry = player.y;
          game.fade = 1;
        }
        repAdd(-3);
        say([["", `Você acordou ${hosp ? "na porta do Hospital" : "no chão"}, com um curativo na testa e ${lost} de ouro a menos no bolso.`], ["Curandeira Maíra", pk(["Mais um que mexeu com gente casada... Próximo!", "Ciúme de faca é o que mais chega aqui. Cuidado, viu?"])]]);
        return;
      }
    } else {
      chaseYell(c, pk(["TE PEGUEI!", "Toma isso!", "Aprendeu?!"]));
      game.shouts.push({ x: T.x, y: T.y, txt: pk(["AIII!", "Minha bunda!", "Foi de raspão, foi de raspão!"]), t: 1.8 });
      if (c.hits >= 2) {
        vilaNews(`${shortName(c.who)} alcançou o Lucas Marzocca ${pk(PLACES)} e deu uma lição nele!`.replace("o Lucas Marzocca", c.tgt.id === "lucas" ? "o Lucas Marzocca" : shortName(c.tgt.id)));
        return endChase();
      }
    }
  }
  const far = Math.abs(c.x - T.x) + Math.abs(c.y - T.y) > 18;
  if (c.t > c.dur || far) {
    chaseYell(c, pk(["Isso não vai ficar assim!", "Da próxima vez você não escapa!", "*ofegante* ...Volta... aqui...", "Eu sei onde você mora!"]));
    if (toPlayer) {
      vilaNews(`${shortName(c.who)} correu atrás de ${player.name} com uma faca pela vila!`);
      endChase(far ? "Você despistou! Mas a vila inteira viu." : `${shortName(c.who)} cansou de correr. Você escapou... por hoje.`);
    } else {
      player.lucasRuns = (player.lucasRuns || 0) + (c.tgt.id === "lucas" ? 1 : 0);
      vilaNews(`${c.tgt.id === "lucas" ? "Lucas Marzocca" : shortName(c.tgt.id)} fugiu de ${shortName(c.who)} (e de uma faca) ${pk(PLACES)}${c.tgt.id === "lucas" ? `. Já são ${player.lucasRuns} fuga${player.lucasRuns > 1 ? "s" : ""}!` : "!"}`);
      endChase();
    }
  }
}
{
  const visBase = crewVisible;
  crewVisible = function (a) {
    if (game.chase && a && a.id === game.chase.who) return false;
    return visBase(a);
  };
}
function drawKnifeGuy(c, t) {
  const n = c.n,
    X = c.rx * TILE,
    Y = c.ry * TILE + Math.abs(Math.sin(t * 16)) * -2;
  ctx.fillStyle = "rgba(0,0,0,.25)";
  ctx.beginPath();
  ctx.ellipse(X + 16, c.ry * TILE + 30, 9, 3, 0, 0, 7);
  ctx.fill();
  drawSprite(wizardRects(n.robe, n.hat, n.hair, null, c.dir, 1 + (Math.floor(t * 9) % 2)), X, Y, 2, c.dir === "left");
  // Faca levantada.
  const side = c.dir === "left" ? -1 : 1,
    hx = X + 16 + side * 11,
    hy = Y + 12 + Math.sin(t * 14) * 3;
  ctx.fillStyle = "#3a2414";
  ctx.fillRect(hx - 2, hy - 1, 6, 7);
  ctx.fillStyle = "#6b4423";
  ctx.fillRect(hx - 1, hy, 4, 5);
  ctx.fillStyle = "#9aa4b0";
  ctx.fillRect(hx - 3, hy - 2, 8, 2);
  ctx.fillStyle = "#dfe6ee";
  ctx.fillRect(hx - 1, hy - 15, 4, 13);
  ctx.fillRect(hx, hy - 17, 2, 2);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(hx, hy - 14, 1, 10);
  if (Math.sin(t * 12) > 0.7) {
    ctx.fillStyle = "#fff";
    ctx.fillRect(hx + 4, hy - 16, 2, 2);
  }
  if (c.stun <= 0) drawPixelIcon("anger", X + 16, Y - 10, 2);
}

/* ===================== CIÚME (QUALQUER CASADO) ===================== */

/** Você deu em cima de alguém casado: o par pode descobrir e reagir. */
function jealousTrigger(id) {
  if (!lifeMode()) return;
  const sp = npcSpouse(id);
  if (!sp || !NPCS[sp]) return;
  player.famDay.jealN = player.famDay.jealD === player.day ? player.famDay.jealN || 0 : 0;
  player.famDay.jealD = player.day;
  if (player.famDay.jealN >= 2 || game.jealousQ) return;
  const spot = npcSpot(sp);
  const sees = spot && Math.abs(spot[0] - player.x) + Math.abs(spot[1] - player.y) <= 10;
  if (Math.random() > (sees ? 0.85 : 0.35)) return;
  player.famDay.jealN++;
  game.jealousQ = { id, sp, at: performance.now() + (sees ? 600 : 15000 + Math.random() * 25000), sees };
}
function jealousTick() {
  const q = game.jealousQ;
  if (!q || performance.now() < q.at || game.mode !== "world" || game.dialog || game.chase || game.brawl) return;
  if (!ZONES[player.zone] || !ZONES[player.zone].town) return;
  game.jealousQ = null;
  const sp = q.sp,
    id = q.id,
    spN = shortName(sp),
    idN = shortName(id);
  const w = { faca: 1, briga: 1, conversa: 0.8 };
  if (hasTrait(sp, "ciumento")) w.faca += 2;
  if (hasTrait(sp, "esquentado")) w.briga += 2;
  if (hasTrait(sp, "calmo") || hasTrait(sp, "timido")) w.conversa += 2.5;
  let r = Math.random() * (w.faca + w.briga + w.conversa),
    kind = r < w.faca ? "faca" : r < w.faca + w.briga ? "briga" : "conversa";
  addFriendship(sp, -20);
  player.angry = player.angry || {};
  player.angry[sp] = player.day;
  repAdd(-3);
  const meu = gw(id, "o meu marido", "a minha esposa");
  const intro = q.sees ? `${spN} viu tudo!` : `A fofoca chegou rapidinho: ${spN} ficou sabendo que você deu em cima de ${idN}.`;
  game.bubbles.push({ x: player.x, y: player.y, icon: "sweat", t: 2 });
  if (kind === "faca") {
    say(
      [
        ["", intro],
        [spN, pk([`VOCÊ DEU EM CIMA D${meu.slice(0, 1).toUpperCase()}${meu.slice(1)}?!`, `${player.name.toUpperCase()}! Fica longe d${gw(id, "o", "a")} ${idN}!`, `Eu vi você de olho n${gw(id, "o", "a")} ${idN}!`])],
        ["", `${spN} puxou uma faca de cozinha! CORRE!!`],
      ],
      () => {
        if (!startChase(sp, "player", id)) say([[spN, "Da próxima vez eu te pego!"]]);
        vilaNews(`${spN} correu atrás de ${player.name} com uma faca por ciúme de ${idN}!`);
      },
    );
  } else if (kind === "briga") {
    say(
      [
        ["", intro],
        [spN, pk([`Ninguém mexe com ${meu}! Sai na mão comigo!`, "Você vai aprender a respeitar casamento dos outros!", `Tira o olho d${gw(id, "o", "a")} ${idN}! Vem!`])],
      ],
      () => {
        const had = NO_FIGHT.has(sp);
        NO_FIGHT.delete(sp);
        startBrawl(sp, NPCS[sp].nome);
        if (had) NO_FIGHT.add(sp);
        vilaNews(`${spN} saiu no braço com ${player.name} por causa de ${idN}!`);
      },
    );
  } else {
    say([
      ["", intro],
      [spN, pk([`Eu sei o que você fez com ${idN}. Não vou fazer escândalo... mas nunca mais olhe pra minha família.`, `Pensei que você era ${genderWord("um amigo", "uma amiga", "alguém de confiança")}. Me enganei.`, `*olhos cheios d'água* Por quê? ${idN} é tudo que eu tenho.`])],
      [idN, pk(["...Melhor a gente se afastar um tempo.", "Que vergonha. A vila toda vai saber.", "Eu avisei que era casad" + gw(id, "o", "a") + "!"])],
    ]);
    addFriendship(id, -8);
    vilaNews(`${spN} descobriu que ${player.name} deu em cima de ${idN}. Que climão!`);
  }
}
/* Interações românticas com gente casada acendem o ciúme. */
{
  const doBase = doInteraction;
  doInteraction = function (id, key) {
    const r = INTER_BY_KEY[key];
    const res = doBase(id, key);
    if (r && (r[1] === "amor" || r[1] === "cor") && !isRomanticWith(id) && attractedTo(id)) jealousTrigger(id);
    else if (r && (r[1] === "amor" || r[1] === "cor") && npcSpouse(id) && (player.lovers || []).includes(id)) jealousTrigger(id);
    return res;
  };
}

/* ===================== O MARZOCA ATACA (DE NOVO) ===================== */

const LUCAS_FLIRTS = ["Oi, sumid{a}... esse {roupa} é novo?", "Se beleza desse ouro, você pagava o Imposto Real sozinh{a}.", "Você vem sempre aqui ou só quando eu estou?", "Seu par sabe que você é a pessoa mais bonita da vila?", "Me empresta um sorriso? Devolvo amanhã.", "Tá calor ou é você chegando?", "Eu ia passar reto, mas meus pés travaram."];
const FLIRT_REACT = ["*cora* Lucas, eu sou casad{a}!", "Hahaha, você não presta!", "Sai daqui, Marzoca!", "...Fala de novo? Não ouvi.", "Meu {par} está logo ali, hein!", "Que cantada horrível. Gostei."];
let lucasAcc = 40;
/** Um galanteador (quase sempre o Lucas) dá em cima de alguém casado. O par aparece... */
function galanteioTick(dt) {
  if (!lifeMode() || player.zone !== "vila" || !game.crewA || game.chase || game.mode !== "world") return;
  lucasAcc -= dt;
  if (lucasAcc > 0) return;
  lucasAcc = 60 + Math.random() * 60;
  const gal = Math.random() < 0.85 ? "lucas" : "luca";
  const L = game.crewA[gal];
  if (!L || !crewVisible(L) || !nearPlayer(L, 18) || L.talking > 0) return;
  const targets = Object.values(game.crewA).filter((o) => o !== L && crewVisible(o) && npcSpouse(o.id) && NPCS[npcSpouse(o.id)] && !o.talking && nearPlayer(o, 20));
  if (!targets.length) return;
  // Ele vai muito mais atrás de mulher casada do que de homem casado.
  let o = null,
    tot = targets.reduce((acc, q) => acc + (npcGender(q.id) === "f" ? 4 : 1) / (1 + dist1(q, L) / 8), 0),
    r = Math.random() * tot;
  for (const q of targets) if ((r -= (npcGender(q.id) === "f" ? 4 : 1) / (1 + dist1(q, L) / 8)) < 0) {
    o = q;
    break;
  }
  o = o || targets[0];
  const dest = freeNear("vila", o.x, o.y, 1);
  if (!dest) return;
  [L.x, L.y] = dest;
  L.tk = null;
  L.kind = "crew";
  o.kind = "crew";
  const sp = npcSpouse(o.id);
  const f = (s) => s.replace(/\{a\}/g, gw(o.id, "o", "a")).replace("{roupa}", gw(o.id, "colete", "vestido")).replace("{par}", gw(sp, "marido", "esposa"));
  const lines = [
    [shortName(gal), f(pk(LUCAS_FLIRTS))],
    [shortName(o.id), f(pk(FLIRT_REACT))],
    [shortName(gal), pk(["Casad" + gw(o.id, "o", "a") + ", não mort" + gw(o.id, "o", "a") + "!", "Seu par nem precisa saber...", "Eu só estava elogiando! Juro pelas runas!"])],
  ];
  startConv(
    [
      { ref: L, nome: shortName(gal), id: gal },
      { ref: o, nome: shortName(o.id), id: o.id },
    ],
    lines,
    {
      loud: true,
      onEnd: () => {
        if (!crewVisible(L)) return;
        if (Math.random() < 0.3) {
          // Briga na rua.
          game.shouts.push({ x: L.x, y: L.y, txt: `${shortName(sp).toUpperCase()} CHEGOU! Calma, calma!`, t: 2.4 });
          for (let i = 0; i < 6; i++) setTimeout(() => (game.bubbles.push({ x: L.x, y: L.y, icon: "anger", t: 0.8 }), (game.shake = 0.1), playSound(150 + i * 20, 0.06, "square")), i * 350);
          vilaNews(`${shortName(sp)} e ${shortName(gal)} saíram no tapa ${pk(PLACES)} por causa de ${shortName(o.id)}!`);
        }
        if (startChase(sp, L, o.id)) {
          game.chase.x = Math.max(1, Math.min(ZONES.vila.w - 2, game.chase.x));
          chaseYell(game.chase, `${shortName(gal).toUpperCase()}!!! EU VI ISSO!`);
        }
      },
    },
  );
}

/* ===================== LIGAÇÕES ===================== */

{
  const updBase = update;
  update = function (dt) {
    updBase(dt);
    if (game.mode === "title") return;
    convTick(dt);
    if (game.mode === "world" && !game.dialog) {
      autonomyTick(dt);
      interiorChatTick(dt);
      galanteioTick(dt);
      jealousTick();
      chaseTick(dt);
      if (ZONES[player.zone] && ZONES[player.zone].town && player.zone !== "vila" && Math.random() < dt * 0.25) bumpChats();
    }
  };
  const drawBase = crewDrawList;
  crewDrawList = function (list, t) {
    drawBase(list, t);
    const c = game.chase;
    if (c && c.zone === player.zone) list.push({ y: c.ry, draw: () => drawKnifeGuy(c, t) });
    // Quem foge do ciúme corre com cara de pânico.
    if (c && c.tgt && crewVisible(c.tgt)) list.push({ y: c.tgt.ry + 0.01, draw: () => drawPixelIcon("sweat", c.tgt.rx * TILE + 16, c.tgt.ry * TILE - 10, 2) });
  };
  // Durante a perseguição, a turma corre mais rápido que o normal (o "a.step" fica com a fuga).
  const crewTickBase = crewTick;
  crewTick = function (dt) {
    crewTickBase(dt);
    const c = game.chase;
    if (c && c.tgt) {
      c.tgt.rx += (c.tgt.x - c.tgt.rx) * Math.min(1, dt * 9);
      c.tgt.ry += (c.tgt.y - c.tgt.ry) * Math.min(1, dt * 9);
    }
  };
}
