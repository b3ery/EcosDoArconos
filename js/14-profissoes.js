/**
 * ECOS DO ARCANO — 14-profissoes.js
 * Profissões medievais feitas de verdade, andando e agindo no mapa:
 * lenhador, fazendeiro, minerador, pescador, carregador, guarda (patrulha e ladrões),
 * feirante (clientes vêm até você) e a sua própria tendinha.
 * Funciona nos dois modos. Um turno dura algumas horas do jogo.
 */

"use strict";

/* ===================== DADOS ===================== */

/** Onde entregar o que você coletou, em cada vila. */
const JOB_DROPS = {
  lenhador: { vila: "Marcenaria do Tonico", porto: "Estaleiro Brisamar", serra: "Serraria do Pico" },
  fazendeiro: { vila: "Moinho", serra: "Moinho da Serra" },
  minerador: { serra: "Mina de Cristal" },
  pescador: { vila: "Peixaria Rio Claro", porto: "Peixaria do Porto" },
};
const PROFESSIONS = {
  lenhador: {
    n: "Lenhador",
    icon: "axe",
    desc: "Corte árvores (E várias vezes) e leve as toras à serraria ou marcenaria.",
    tile: "T",
    hits: 3,
    carry: 3,
    unit: "tora",
    pay: 7,
    verb: "Cortar árvore",
    after: ",",
  },
  fazendeiro: {
    n: "Fazendeiro",
    icon: "wheat",
    desc: "Colha o trigo da plantação e leve os feixes ao moinho.",
    tile: "g",
    hits: 1,
    carry: 6,
    unit: "feixe",
    pay: 3,
    verb: "Colher trigo",
    after: ",",
  },
  minerador: {
    n: "Minerador",
    icon: "pick",
    desc: "Em Pedravale ou dentro da Mina de Cristal, quebre as pedras (E várias vezes) e entregue na porta da mina.",
    tile: "o",
    hits: 4,
    carry: 3,
    unit: "minério",
    pay: 10,
    verb: "Quebrar pedra",
    after: ".",
  },
  pescador: {
    n: "Pescador",
    icon: "fish",
    desc: "Pesque no rio ou no mar e entregue os peixes na peixaria.",
    carry: 4,
    unit: "peixe",
    pay: 6,
  },
  carregador: {
    n: "Carregador",
    icon: "crate",
    desc: "Pegue caixas no armazém e entregue nas casas e lojas da vila. Rápido rende gorjeta!",
    pay: 9,
  },
  guarda: {
    n: "Guarda Real",
    icon: "sword",
    desc: "Patrulhe os pontos marcados da vila e prenda os ladrões (E perto deles).",
    pay: 5,
  },
  feirante: {
    n: "Feirante",
    icon: "bag",
    desc: "Fique na feira: os clientes vêm até você. Atenda (E) antes que desistam.",
    pay: 4,
  },
};
const SHIFT_HOURS = 4;
const WAREHOUSES = { vila: "Armazém Geral", porto: "Armazém do Cais", serra: "Armazém Anão" };

/* ===================== AJUDANTES ===================== */

const absMinutes = () => player.day * 1440 + player.clock;
function findBuilding(zone, name) {
  const town = ZONES[zone] && ZONES[zone].town;
  if (!town) return null;
  const b = town.bld.find((q) => q.name === name);
  return b ? { x: b.door[0], y: b.y + b.h - 1, name } : null;
}
function setTile(zone, x, y, c) {
  const rows = ZONES[zone].map;
  rows[y] = rows[y].slice(0, x) + c + rows[y].slice(x + 1);
}
/** Árvores cortadas, trigo colhido e pedras quebradas voltam no dia seguinte. */
function restoreWorkTiles() {
  for (const k of Object.keys(game.depleted || {})) {
    const [zone, x, y, c] = k.split(",");
    setTile(zone, +x, +y, c);
  }
  game.depleted = {};
}
function deplete(zone, x, y, original, after) {
  game.depleted = game.depleted || {};
  game.depleted[`${zone},${x},${y},${original}`] = player.day;
  setTile(zone, x, y, after);
}
function randomRoadTile(minDist = 6) {
  const z = ZONES[player.zone];
  for (let i = 0; i < 400; i++) {
    const x = 2 + Math.floor(Math.random() * (z.w - 4)),
      y = 2 + Math.floor(Math.random() * (z.h - 4));
    const c = tileAt(player.zone, x, y);
    if ((c === "." || c === "," || c === "=") && walkable(player.zone, x, y)) {
      if (Math.abs(x - player.x) + Math.abs(y - player.y) >= minDist) return [x, y];
    }
  }
  return null;
}
function jobPay(base) {
  const rank = player.job && player.job.id === "guarda" ? guardRank().pay * warGuardMul() : 1;
  const age = lifeMode() ? ageWorkMul() : 1;
  return Math.max(1, Math.round(base * rank * age * needsPayMul()));
}
function earn(amount, why) {
  player.gold += amount;
  player.job.earned += amount;
  playSound(988, 0.06, "sine");
  game.bubbles.push({ x: player.x, y: player.y, icon: "coin", t: 1.6 });
  toast(`${why} +${amount} ouro`, 1800);
}

/* ===================== COMEÇAR E TERMINAR ===================== */

function professionsMenu() {
  if (player.job) {
    return choice(`Turno de ${PROFESSIONS[player.job.id].n}`, jobStatusText(), [
      { t: "Continuar trabalhando", fn: null },
      { t: "Encerrar o turno agora", fn: () => endJob("Você encerrou o turno.") },
    ]);
  }
  if (currentHour() < 6 || currentHour() >= 19)
    return say([["", "Os trabalhos começam às 6h e o último turno sai às 19h. Durma ou espere (H)."]]);
  const zone = player.zone;
  const opts = Object.entries(PROFESSIONS)
    .filter(([id]) => jobAvailableHere(id, zone))
    .map(([id, p]) => ({
      t: `${p.n}: ${p.desc}`,
      icon: p.icon,
      fn: () => startJob(id),
    }));
  if (lifeMode() || player.flags.stall)
    opts.push({
      t: player.flags.stall ? "Abrir minha tendinha (você vende e fica com o lucro)" : "Ter minha própria tendinha",
      icon: "bag",
      fn: stallMenu,
    });
  if (!lifeMode()) opts.push({ t: "Ver tarefas do quadro (missões)", fn: () => openJobs(true) });
  opts.push({ t: "Sair", fn: null });
  choice(
    "Trabalhos da vila",
    `Cada turno dura ${SHIFT_HOURS}h e é feito no mapa. O pagamento sai a cada entrega. Guarda Real: ${guardRank().n}.`,
    opts,
  );
}
function jobAvailableHere(id, zone) {
  if (!ZONES[zone].town) return false;
  if (JOB_DROPS[id]) return !!findBuilding(zone, JOB_DROPS[id][zone] || "");
  if (id === "carregador") return !!findBuilding(zone, WAREHOUSES[zone]);
  return true;
}
function startJob(id, extra = {}) {
  // Quem é contratado dentro de um prédio (ex.: castelo) trabalha na vila lá fora.
  const zone = ZONES[player.zone].town ? player.zone : "vila";
  player.job = {
    id,
    zone,
    endAt: absMinutes() + SHIFT_HOURS * 60,
    cargo: 0,
    done: 0,
    earned: 0,
    hits: {},
    ...extra,
  };
  game.jobCustomers = [];
  game.jobSpawn = 2;
  const p = PROFESSIONS[id] || { n: "Tendinha" };
  if (id === "pescador" && !itemCount("vara")) {
    addItem("vara");
    player.job.lentRod = true;
  }
  if (id === "carregador") player.job.step = "pegar";
  if (id === "guarda") {
    player.job.points = [];
    player.job.thiefT = 20;
  }
  saveGame();
  playSound(659, 0.1, "sine");
  say([["", `Turno de ${p.n} começou! ${jobStatusText()}`]]);
}
function endJob(reason) {
  const j = player.job;
  if (!j) return;
  if (j.lentRod && itemCount("vara")) removeItem("vara");
  if (j.done > 0) player.shiftsDone = (player.shiftsDone || 0) + 1;
  if (j.id === "guarda" && j.done >= 4) player.guardShifts = (player.guardShifts || 0) + 1;
  if (j.id === "guarda") player.flags.guardaReal = true;
  if (j.id === "stall" && j.stock > 0 && j.product.k === "ring") player.gold += j.stock * j.product.cost;
  for (const w of game.walkers || []) w.thief = false;
  game.jobCustomers = [];
  player.job = null;
  addNeed("energy", -SHIFT_HOURS * 5);
  addNeed("hygiene", -SHIFT_HOURS * 4);
  saveGame();
  const p = PROFESSIONS[j.id] || { n: "Tendinha" };
  const lines = [`${reason} Turno de ${p.n}: ${j.done} tarefa(s) feita(s), ${j.earned} ouro ganho.`];
  if (j.id === "stall") lines.push(`Lucro do dia: ${j.earned - j.spent} ouro (gastou ${j.spent} no estoque).`);
  if (j.id === "guarda") lines.push(`Patente: ${guardRank().n}. Turnos exemplares (4+ tarefas) contam para promoção.`);
  say([["", lines.join(" ")]]);
}

/* ===================== A CADA QUADRO ===================== */

function jobTick(dt) {
  const j = player.job;
  if (!j || game.mode !== "world" || game.dialog) return;
  if (absMinutes() >= j.endAt) return endJob("Fim do turno!");
  if (player.zone !== j.zone && !["lenhador"].includes(j.id)) return;
  if (j.id === "guarda") guardTick(dt);
  if (j.id === "feirante" || j.id === "stall") customersTick(dt);
}

/* ---- Guarda: patrulha e ladrões ---- */
function guardTick(dt) {
  const j = player.job;
  if (!j.points.length)
    for (let i = 0; i < 4; i++) {
      const np = randomRoadTile(8);
      if (np) j.points.push(np);
    }
  const pt = j.points[0];
  if (pt && Math.abs(pt[0] - player.x) + Math.abs(pt[1] - player.y) <= 1) {
    j.points.shift();
    j.done++;
    earn(jobPay(PROFESSIONS.guarda.pay), "Ponto de patrulha verificado.");
  }
  j.thiefT -= dt * timeSpeed();
  const thief = (game.walkers || []).find((w) => w.thief);
  if (!thief && j.thiefT <= 0) {
    const cands = (game.walkers || []).filter((w) => !w.inside && Math.abs(w.x - player.x) + Math.abs(w.y - player.y) > 5);
    if (cands.length) {
      const w = cands[Math.floor(Math.random() * cands.length)];
      w.thief = true;
      toast(`Pega ladrão! ${w.nm} roubou uma bolsa no mercado!`, 3000);
      playSound(1200, 0.08, "square");
    }
    j.thiefT = 35;
  }
}

/* ---- Feirante e tendinha: clientes que andam até você ---- */
const CUSTOMER_WANTS = ["bread", "apple", "cheese", "fish", "honey", "cake", "meat", "tea"];
function customersTick(dt) {
  const j = player.job;
  const list = (game.jobCustomers = game.jobCustomers || []);
  game.jobSpawn -= dt * timeSpeed();
  if (game.jobSpawn <= 0 && list.length < 3) {
    const field = distanceField();
    let pt = null;
    for (let i = 0; i < 20 && !pt; i++) {
      const q = randomRoadTile(7);
      if (q && (field.get(q[0] + "," + q[1]) ?? 99) <= 30) pt = q;
    }
    if (pt)
      list.push({
        x: pt[0],
        y: pt[1],
        rx: pt[0],
        ry: pt[1],
        step: 0,
        wait: 0,
        dir: "down",
        robe: ["#8a3a3a", "#3a6a8a", "#5a7a3a", "#8a6a2a", "#6a3a7a"][Math.floor(Math.random() * 5)],
        hair: ["#3a2414", "#d9a441", "#1a1a1a", "#8a3a1a", "#d9d9d9"][Math.floor(Math.random() * 5)],
        seed: Math.floor(Math.random() * 99999),
        want: j.id === "stall" ? j.product.k : CUSTOMER_WANTS[Math.floor(Math.random() * CUSTOMER_WANTS.length)],
      });
    game.jobSpawn = 5 + Math.random() * 5;
  }
  for (const c of list) {
    c.rx += (c.x - c.rx) * Math.min(1, dt * 8);
    c.ry += (c.y - c.ry) * Math.min(1, dt * 8);
    const d = Math.abs(c.x - player.x) + Math.abs(c.y - player.y);
    if (d <= 1) {
      c.wait += dt;
      c.dir = c.x < player.x ? "right" : c.x > player.x ? "left" : c.y < player.y ? "down" : "up";
      continue;
    }
    c.step -= dt;
    if (c.step > 0) continue;
    c.step = 0.24;
    // Segue o caminho mais curto até você (mapa de distâncias calculado a partir do jogador).
    const field = distanceField();
    const here = field.get(c.x + "," + c.y) ?? 1e9;
    let best = null;
    for (const [a, b] of DIRS4) {
      const nx = c.x + a,
        ny = c.y + b;
      const d = field.get(nx + "," + ny);
      if (d != null && d < here && !(nx === player.x && ny === player.y) && !list.some((o) => o !== c && o.x === nx && o.y === ny))
        if (!best || d < best[2]) best = [a, b, d];
    }
    if (best) {
      c.x += best[0];
      c.y += best[1];
      c.dir = best[0] > 0 ? "right" : best[0] < 0 ? "left" : best[1] > 0 ? "down" : "up";
    }
  }
  // Quem espera demais desiste.
  for (const c of list.filter((q) => q.wait > 9)) {
    toast("Um cliente cansou de esperar e foi embora.", 1800);
    playSound(200, 0.1, "triangle");
  }
  game.jobCustomers = list.filter((q) => q.wait <= 9);
}
/** Distância a pé de cada tile até o jogador (recalcula só quando ele se move). */
function distanceField() {
  const key = player.zone + ":" + player.x + "," + player.y;
  if (game.distKey === key) return game.distField;
  const field = new Map([[player.x + "," + player.y, 0]]);
  const queue = [[player.x, player.y]];
  while (queue.length) {
    const [x, y] = queue.shift();
    const d = field.get(x + "," + y);
    if (d > 40) continue;
    for (const [a, b] of DIRS4) {
      const k = x + a + "," + (y + b);
      if (!field.has(k) && walkable(player.zone, x + a, y + b)) {
        field.set(k, d + 1);
        queue.push([x + a, y + b]);
      }
    }
  }
  game.distKey = key;
  game.distField = field;
  return field;
}
function customerAt(x, y) {
  return (game.jobCustomers || []).find((c) => c.x === x && c.y === y);
}

/* ===================== INTERAÇÃO (tecla E) ===================== */

/** Texto do "E · ..." quando você olha para algo do seu trabalho. */
function jobLabel(x, y) {
  const j = player.job;
  if (!j || (player.zone !== j.zone && !(j.id === "lenhador" || (j.id === "minerador" && player.zone === "mina")))) return null;
  const c = tileAt(player.zone, x, y);
  const p = PROFESSIONS[j.id];
  if (p && p.tile && j.cargo < p.carry) {
    if (c === p.tile || (j.id === "lenhador" && c === "#" && ZONES[player.zone].theme === "bosque" && innerTile(x, y)))
      return `${p.verb} (${(j.hits[x + "," + y] || 0) + 1}/${p.hits})`;
  }
  const drop = jobDrop();
  if (drop && drop.x === x && drop.y === y && j.cargo > 0) return `Entregar ${j.cargo} ${p.unit}(s)`;
  if (j.id === "carregador") {
    const t = carrierTarget();
    if (t && t.x === x && t.y === y) return j.step === "pegar" ? "Pegar caixa" : `Entregar caixa em ${t.name}`;
  }
  if (j.id === "guarda") {
    const w = (game.walkers || []).find((q) => q.thief && q.x === x && q.y === y);
    if (w) return `Prender ${w.nm}!`;
  }
  if ((j.id === "feirante" || j.id === "stall") && customerAt(x, y)) return "Atender cliente";
  return null;
}
function innerTile(x, y) {
  const z = ZONES[player.zone];
  return x > 1 && y > 1 && x < z.w - 2 && y < z.h - 2;
}
function jobDrop() {
  const j = player.job;
  if (!j || !JOB_DROPS[j.id]) return null;
  return findBuilding(player.zone, JOB_DROPS[j.id][player.zone] || "");
}
function carrierTarget() {
  const j = player.job;
  if (j.step === "pegar") return findBuilding(player.zone, WAREHOUSES[player.zone]);
  return j.to;
}
/** Retorna true se o E foi usado pelo trabalho. */
function jobInteract(x, y) {
  const label = jobLabel(x, y);
  if (!label) return false;
  const j = player.job,
    p = PROFESSIONS[j.id],
    c = tileAt(player.zone, x, y);
  // Coletar: cada E é uma batida; com batidas suficientes, vira um item.
  if (p && p.tile && label.startsWith(p.verb)) {
    const k = x + "," + y;
    j.hits[k] = (j.hits[k] || 0) + 1;
    game.shake = 0.08;
    game.bubbles.push({ x, y, icon: p.icon, t: 0.6 });
    playSound(j.id === "minerador" ? 260 : j.id === "lenhador" ? 180 : 520, 0.06, "square");
    if (j.hits[k] >= p.hits) {
      delete j.hits[k];
      deplete(player.zone, x, y, c, p.after);
      j.cargo++;
      if (c === "o") player.mined = (player.mined || 0) + 1;
      if (c === "g") player.harvested = (player.harvested || 0) + 1;
      toast(`+1 ${p.unit} (${j.cargo}/${p.carry})${j.cargo >= p.carry ? " · cheio! Vá entregar." : ""}`, 1600);
    }
    return true;
  }
  if (label.startsWith("Entregar") && j.id !== "carregador") {
    const n = j.cargo;
    j.cargo = 0;
    j.done += n;
    earn(jobPay(p.pay * n), `Entregou ${n} ${p.unit}(s).`);
    return true;
  }
  if (j.id === "carregador") {
    if (j.step === "pegar") {
      const doors = ZONES[player.zone].town.bld.filter((b) => b.name && b.name !== WAREHOUSES[player.zone]);
      const b = doors[Math.floor(Math.random() * doors.length)];
      j.to = { x: b.door[0], y: b.y + b.h - 1, name: b.name };
      j.step = "levar";
      j.pickedAt = absMinutes();
      toast(`Caixa pega! Leve até: ${b.name}`, 2200);
      playSound(440, 0.06, "sine");
    } else {
      const mins = absMinutes() - j.pickedAt;
      const tip = mins <= 40 ? 4 : 0;
      j.step = "pegar";
      j.done++;
      earn(jobPay(p.pay) + tip, tip ? "Entrega rápida, com gorjeta!" : "Entrega feita.");
      j.to = null;
    }
    return true;
  }
  if (j.id === "guarda" && label.startsWith("Prender")) {
    const w = (game.walkers || []).find((q) => q.thief && q.x === x && q.y === y);
    w.thief = false;
    j.done++;
    repAdd(1);
    earn(jobPay(18), `${w.nm} foi preso! Reputação +1.`);
    return true;
  }
  if (label === "Atender cliente") {
    const cu = customerAt(x, y);
    game.jobCustomers = game.jobCustomers.filter((q) => q !== cu);
    if (j.id === "stall") return stallSale(cu);
    j.done++;
    earn(jobPay(p.pay), "Cliente atendido!");
    return true;
  }
  return false;
}
/** Pesca durante o turno de pescador: o peixe vai para a caixa do trabalho. */
function jobOnFish(item) {
  const j = player.job;
  if (!j || j.id !== "pescador" || item === "bota" || item === "perolaN") return;
  if (j.cargo >= PROFESSIONS.pescador.carry) return toast("Sua caixa de peixes está cheia. Entregue na peixaria!", 2000);
  removeItem(item);
  j.cargo++;
}

/* ===================== TENDINHA PRÓPRIA ===================== */

/** Abre a tendinha: os clientes vêm até você e cada um decide se paga o seu preço. */
function openOwnStall(p, price, chance) {
  const total = p.cost * STALL_STOCK;
  player.gold -= total;
  player.famDay.stall = player.day;
  startJob("stall", { product: p, price, chance, stock: STALL_STOCK, spent: total });
}
function stallSale(cu) {
  const j = player.job;
  const chance = j.chance + ((player.rep ?? 50) - 50) / 250;
  if (Math.random() < chance) {
    const tax = Math.floor(j.price * TAX.sell * (player.spouse === "rainha" || festivalToday() ? 0 : 1));
    player.taxPaid = (player.taxPaid || 0) + tax;
    j.stock--;
    j.done++;
    earn(Math.round((j.price - tax) * needsPayMul()), `Vendeu ${j.product.n}${tax ? ` (−${tax} de imposto)` : ""}!`);
    if (j.stock <= 0) endJob("Estoque esgotado!");
  } else {
    toast('"Tá caro, hein?" O cliente foi embora sem comprar.', 2000);
    playSound(300, 0.1, "triangle");
  }
  return true;
}

/* ===================== HUD, SETA E DESENHO ===================== */

function jobStatusText() {
  const j = player.job;
  if (!j) return "";
  const p = PROFESSIONS[j.id] || { n: "Tendinha" };
  const left = Math.max(0, j.endAt - absMinutes());
  const time = `${Math.floor(left / 60)}h${String(Math.round(left % 60)).padStart(2, "0")} restantes`;
  let what = "";
  if (p.tile || j.id === "pescador") {
    const drop = JOB_DROPS[j.id][j.zone];
    what = j.cargo >= p.carry ? `Cheio! Entregue em ${drop}` : `${j.cargo}/${p.carry} ${p.unit}(s) · entregue em ${drop}`;
  } else if (j.id === "carregador") what = j.step === "pegar" ? `Pegue uma caixa no ${WAREHOUSES[j.zone]}` : `Leve a caixa até ${j.to.name}`;
  else if (j.id === "guarda")
    what = (game.walkers || []).some((w) => w.thief) ? "Ladrão à solta! Siga a seta" : "Patrulhe o ponto marcado";
  else if (j.id === "stall") what = `${j.product.n} a ${j.price} ouro · estoque ${j.stock}`;
  else what = "Espere os clientes e atenda com E";
  return `${p.n} · ${what} · ${j.earned} ouro · ${time}`;
}
/** Para onde a seta aponta durante o turno. */
function jobTarget() {
  const j = player.job;
  if (!j || player.zone !== j.zone) return null;
  const p = PROFESSIONS[j.id];
  if (p && (p.tile || j.id === "pescador")) {
    if (j.cargo >= (p.carry || 1) || (j.cargo > 0 && j.id === "pescador")) return jobDrop();
    if (!p.tile) return null;
    let best = null,
      bd = 1e9;
    const z = ZONES[player.zone];
    for (let y = 0; y < z.h; y++)
      for (let x = 0; x < z.w; x++)
        if (z.map[y][x] === p.tile) {
          const d = Math.abs(x - player.x) + Math.abs(y - player.y);
          if (d < bd) {
            bd = d;
            best = { x, y };
          }
        }
    return best;
  }
  if (j.id === "carregador") return carrierTarget();
  if (j.id === "guarda") {
    const w = (game.walkers || []).find((q) => q.thief);
    if (w) return { x: w.x, y: w.y };
    const pt = j.points[0];
    return pt ? { x: pt[0], y: pt[1] } : null;
  }
  return null;
}
/** Clientes, ladrão e pontos de patrulha no mapa. */
function jobDrawList(list, t) {
  const j = player.job;
  if (!j || player.zone !== j.zone) return;
  for (const c of game.jobCustomers || []) {
    list.push({
      y: c.ry,
      draw: () => {
        const X = c.rx * TILE,
          Y = c.ry * TILE;
        ctx.fillStyle = "rgba(0,0,0,.22)";
        ctx.beginPath();
        ctx.ellipse(X + 16, Y + 30, 8, 3, 0, 0, 7);
        ctx.fill();
        drawSprite(wizardRects(c.robe, null, c.hair, null, c.dir, 0, c.seed), X, Y, 2, c.dir === "left");
        const near = Math.abs(c.x - player.x) + Math.abs(c.y - player.y) <= 1;
        ctx.fillStyle = "rgba(255,255,255,.92)";
        ctx.fillRect(X + 6, Y - 18, 20, 16);
        drawPixelIcon(c.want, X + 16, Y - 10, 2);
        if (near) {
          ctx.fillStyle = c.wait > 6 ? "#e0303a" : "#f2c14e";
          ctx.fillRect(X + 4, Y - 22, 24 * Math.max(0, 1 - c.wait / 9), 3);
        }
      },
    });
  }
  if (j.id === "guarda") {
    for (const w of game.walkers || [])
      if (w.thief)
        list.push({
          y: w.ry + 0.01,
          draw: () => {
            const b = Math.abs(Math.sin(t * 8)) * 3;
            drawPixelIcon("anger", w.rx * TILE + 16, w.ry * TILE - 10 - b, 2);
          },
        });
    const pt = j.points[0];
    if (pt)
      list.push({
        y: pt[1] - 0.5,
        draw: () => {
          const X = pt[0] * TILE,
            Y = pt[1] * TILE;
          ctx.strokeStyle = Math.sin(t * 6) > 0 ? "#f2c14e" : "#fff3b0";
          ctx.lineWidth = 2;
          ctx.strokeRect(X + 3, Y + 3, TILE - 6, TILE - 6);
          drawPixelIcon("flag", X + 16, Y + 14, 2);
        },
      });
  }
}

/* ===================== MINA, TRIGO E PÃO (nos dois modos) ===================== */

function enterMine() {
  const o = ZONES.mina.open.n;
  player.zone = "mina";
  player.x = o[0];
  player.y = o[1] + 1;
  player.riding = false;
  game.fade = 1;
  enterZone();
  saveGame();
  playSound(220, 0.2, "triangle");
  if (!player.flags.minaVisitada) {
    player.flags.minaVisitada = true;
    setTimeout(
      () =>
        say([
          ["", "Você desce pela boca da mina. Lá embaixo, os cristais brilham nas paredes."],
          ["", "Fique de frente para uma pedra e aperte E várias vezes para minerar. Saia pelo topo do mapa."],
        ]),
      500,
    );
  }
}
function leaveMine() {
  const d = findBuilding("serra", "Mina de Cristal");
  player.zone = "serra";
  player.x = d.x;
  player.y = d.y + 1;
  player.dir = "down";
  game.fade = 1;
  enterZone();
  saveGame();
}
/** O que sai de cada pedra da mina. */
function mineLoot() {
  const r = Math.random();
  if (r < 0.04) return "fragmento";
  if (r < 0.2) return "cristal";
  if (r < 0.55) return "minerio";
  return "pedra";
}
const GATHER_HITS = { o: 4, g: 1 };
/** Minerar e colher fora de um turno de trabalho. */
function gatherLabel(x, y) {
  const c = tileAt(player.zone, x, y);
  if (c === "o" && player.zone === "mina") return `Minerar (${(game.gatherHits?.[x + "," + y] || 0) + 1}/4)`;
  if (c === "g" && ZONES[player.zone].town) return "Colher trigo";
  return null;
}
function gatherInteract(x, y) {
  const label = gatherLabel(x, y);
  if (!label) return false;
  const c = tileAt(player.zone, x, y);
  if (lifeMode() && lifeNeed("energy") < 8) {
    say([["", "Você está cansado demais. Durma antes de trabalhar."]]);
    return true;
  }
  game.gatherHits = game.gatherHits || {};
  const k = x + "," + y;
  game.gatherHits[k] = (game.gatherHits[k] || 0) + 1;
  game.shake = 0.06;
  game.bubbles.push({ x, y, icon: c === "o" ? "pick" : "wheat", t: 0.6 });
  playSound(c === "o" ? 260 : 520, 0.06, "square");
  if (game.gatherHits[k] < GATHER_HITS[c]) return true;
  delete game.gatherHits[k];
  deplete(player.zone, x, y, c, c === "o" ? "." : ",");
  const it = c === "o" ? mineLoot() : "trigo";
  addItem(it);
  if (c === "o") player.mined = (player.mined || 0) + 1;
  else player.harvested = (player.harvested || 0) + 1;
  addNeed("energy", c === "o" ? -2 : -0.5);
  player.clock = Math.min(1439, player.clock + (c === "o" ? 10 : 3));
  toast(`Você conseguiu: ${ITEMS[it].nome}!${it === "fragmento" ? " Que sorte!" : ""}`, 1800);
  saveGame();
  return true;
}
/** Lareira de casa: esquentar-se ou assar pão com o trigo colhido. */
function fireplaceMenu() {
  choice("Lareira", `Feixes de trigo: ${itemCount("trigo")} · Cantis de água: ${itemCount("agua")}`, [
    {
      t: "Esquentar-se (+20 MP)",
      fn: () => {
        player.mp = Math.min(maxMp(), player.mp + 20);
        addNeed("fun", 5);
        toast("Você se esquenta perto do fogo.");
      },
    },
    {
      t: "Assar pão (3 trigo + 1 água = 2 pães)",
      fn: () => {
        if (itemCount("trigo") < 3 || !itemCount("agua"))
          return say([["", "Faltam ingredientes. Colha trigo na plantação (E no trigo) e compre um cantil de água."]]);
        removeItem("trigo", 3);
        removeItem("agua");
        addItem("pao", 2);
        player.clock = Math.min(1439, player.clock + 60);
        player.breadBaked = (player.breadBaked || 0) + 2;
        addNeed("fun", 6);
        game.fade = 1;
        saveGame();
        say([["", "Você sova a massa, espera crescer e assa na lareira. A casa inteira cheira a pão quente! +2 Pães de Cinzaluz."]]);
      },
    },
    { t: "Sair", fn: null },
  ]);
}
