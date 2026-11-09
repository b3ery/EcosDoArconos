/**
 * ECOS DO ARCANO — carreiras.js
 * 20 carreiras jogáveis (as 13 novas são do Simulador de Vida), com plano de carreira:
 *  - Oficina (medidor de força na porta do lugar): Padeiro, Ferreiro, Costureiro,
 *    Cozinheiro, Escriba, Boticário, Pintor, Marceneiro e Professor.
 *  - Rondas pela vila (vá de ponto em ponto): Carteiro, Acendedor de Lampiões, Enfermeiro.
 *  - Balcão (os clientes vêm até você): Taverneiro.
 * Cada carreira sobe de cargo com o trabalho feito: Aprendiz → Ajudante → Oficial →
 * Mestre → Lenda. Cargo maior paga mais. Tudo num painel de carreiras novo.
 * Modifica (envolve) funções de outros arquivos: endJob, jobAvailableHere, jobDrawList, jobInteract, jobLabel, jobPay, jobStatusText, jobTarget, jobTick, professionsMenu, startJob.
 */

"use strict";

const STATION_NEED = 4;
Object.assign(PROFESSIONS, {
  padeiro: { n: "Padeiro", icon: "bread", kind: "station", sim: true, place: "Padaria", verb: "Sovar a massa", unit: "fornada de pão", pay: 9, desc: "Na porta da Padaria, sove a massa no ritmo do medidor. Cada fornada é paga." },
  ferreiro: { n: "Ferreiro", icon: "hammer", kind: "station", sim: true, place: "Forja do Brann", verb: "Martelar o ferro", unit: "ferradura", pay: 12, desc: "Martele o ferro quente na Forja do Brann. Golpe perfeito rende mais rápido." },
  costureiro: { n: "Costureiro", icon: "shirt", kind: "station", sim: true, place: "Alfaiataria", verb: "Costurar a roupa", unit: "roupa", pay: 10, desc: "Costure encomendas na Alfaiataria Fio de Prata." },
  cozinheiro: { n: "Cozinheiro", icon: "stew", kind: "station", sim: true, place: "Taverna Javali Dourado", verb: "Mexer o caldeirão", unit: "prato", pay: 9, desc: "Na cozinha da taverna, mexa o caldeirão na hora certa." },
  escriba: { n: "Escriba", icon: "book", kind: "station", sim: true, place: "Biblioteca", verb: "Copiar o livro", unit: "página copiada", pay: 8, desc: "Copie livros à mão na Biblioteca. Trabalho calmo e bem pago para quem tem paciência." },
  boticario: { n: "Boticário", icon: "potion", kind: "station", sim: true, place: "Boticário Raiz", verb: "Moer as ervas", unit: "remédio", pay: 11, desc: "Moa ervas e prepare remédios no Boticário Raiz." },
  pintor: { n: "Pintor", icon: "staff", kind: "station", sim: true, place: "Ateliê da Mylena", verb: "Pintar a tela", unit: "quadro", pay: 13, desc: "Pinte quadros por encomenda no Ateliê da Mylena." },
  marceneiro: { n: "Marceneiro", icon: "chair", kind: "station", sim: true, place: "Marcenaria do Tonico", verb: "Serrar a tábua", unit: "móvel", pay: 11, desc: "Serre e monte móveis na Marcenaria do Tonico." },
  professor: { n: "Professor", icon: "scroll", kind: "station", sim: true, place: "Escola de Cinzaluz", verb: "Ensinar a turma", unit: "aula", pay: 10, desc: "Dê aulas na Escola de Cinzaluz. As crianças aprendem, você ganha." },
  carteiro: { n: "Carteiro", icon: "scroll", kind: "rounds", sim: true, verb: "Entregar carta", unit: "carta", pay: 6, desc: "Entregue cartas nas portas da vila. Siga a seta de porta em porta." },
  acendedor: { n: "Acendedor de Lampiões", icon: "sun", kind: "rounds", sim: true, verb: "Acender lampião", unit: "lampião", pay: 5, desc: "Acenda os lampiões da vila, um por um. Paga mais no fim da tarde." },
  enfermeiro: { n: "Enfermeiro", icon: "heart", kind: "rounds", sim: true, verb: "Cuidar do doente", unit: "visita", pay: 9, desc: "Visite doentes em casa a pedido do Hospital." },
  taverneiro: { n: "Taverneiro", icon: "mug", kind: "serve", sim: true, desc: "Atrás do balcão: os clientes vêm até você. Sirva (E) antes que desistam.", pay: 6 },
});
HIT_VERBS.push("Sovar", "Martelar", "Costurar", "Mexer", "Copiar", "Moer", "Pintar", "Serrar", "Ensinar");
const CAREER_GICON = {
  lenhador: gIcon("axe", "#8a8a96"),
  fazendeiro: gIcon("corn", "#f2c14e"),
  minerador: gIcon("pickaxe", "#a8b0c8"),
  pescador: gIcon("rod", "#8a5a2e", "#e0303a"),
  carregador: gIcon("crate" in GSHAPES ? "crate" : "chest", "#a87a4a"),
  guarda: gIcon("sword", "#8a5a2e", "#c9d0e0"),
  feirante: gIcon("pouch", "#c9853a"),
  padeiro: gIcon("bread", "#d9a050", "#f2c14e", 0),
  ferreiro: gIcon("hammer", "#5a5a6a"),
  costureiro: gIcon("cloth", "#c94a8b", "#f2c14e", 1),
  cozinheiro: gIcon("soup", "#d9603a"),
  escriba: gIcon("book", "#5a3ab0"),
  boticario: gIcon("potion", "#5aa83a", "#f2c14e", 1),
  pintor: gIcon("painting", "#3a78b0"),
  marceneiro: gIcon("plank", "#8a5a2e"),
  professor: gIcon("scroll", "#3a78b0"),
  carteiro: gIcon("map", "#c94a4a"),
  acendedor: gIcon("lantern", "#c9a03a"),
  enfermeiro: gIcon("potion", "#f2eee4", "#e0303a", 3),
  taverneiro: gIcon("mug", "#e8b030", "#f2c14e", 1),
};

/* ===================== PLANO DE CARREIRA ===================== */

const CAREER_RANKS = [
  { n: "Aprendiz", xp: 0, mul: 1 },
  { n: "Ajudante", xp: 6, mul: 1.25 },
  { n: "Oficial", xp: 16, mul: 1.5 },
  { n: "Mestre", xp: 32, mul: 1.85 },
  { n: "Lenda", xp: 56, mul: 2.3 },
];
function careerXp(id) {
  return (player.careers || {})[id] || 0;
}
function careerRank(id) {
  const xp = careerXp(id);
  let r = 0;
  CAREER_RANKS.forEach((q, i) => xp >= q.xp && (r = i));
  return r;
}
function careerTitle(id) {
  return `${CAREER_RANKS[careerRank(id)].n} de ${PROFESSIONS[id].n}`;
}
const _jobPayBase = jobPay;
jobPay = function (base) {
  const j = player.job;
  const mul = j && PROFESSIONS[j.id] && j.id !== "guarda" ? CAREER_RANKS[careerRank(j.id)].mul : 1;
  return Math.max(1, Math.round(_jobPayBase(base) * mul));
};
const _endJobBase = endJob;
endJob = function (reason) {
  const j = player.job;
  const before = j && PROFESSIONS[j.id] ? careerRank(j.id) : 0;
  if (j && PROFESSIONS[j.id]) {
    player.careers = player.careers || {};
    player.careers[j.id] = careerXp(j.id) + j.done;
  }
  _endJobBase(reason);
  if (j && PROFESSIONS[j.id] && careerRank(j.id) > before) {
    const r = CAREER_RANKS[careerRank(j.id)];
    setTimeout(() => {
      playSound(784, 0.15, "sine");
      setTimeout(() => playSound(1047, 0.2, "sine"), 140);
      say([["", `Promoção! Agora você é ${r.n} de ${PROFESSIONS[j.id].n}. Seu pagamento nessa carreira subiu para ${Math.round(r.mul * 100)}%.`]]);
      repAdd(2);
    }, 400);
  }
};

/* ===================== TIPOS NOVOS DE TRABALHO ===================== */

function stationSpot(j) {
  const p = PROFESSIONS[j.id];
  return findBuilding(j.zone, p.place);
}
function roundTargets(id, zone) {
  const z = ZONES[zone];
  const out = [];
  if (id === "acendedor") {
    for (let y = 0; y < z.h; y++) for (let x = 0; x < z.w; x++) if (z.map[y][x] === "l") out.push([x, y, "lampião"]);
  } else {
    for (const b of z.town.bld) {
      const isHouse = !b.name || (b.home && b.home.length);
      if (id === "enfermeiro" ? isHouse : b.name) out.push([b.door[0], b.y + b.h - 1, b.name || "Casa de morador"]);
    }
  }
  return out.sort(() => Math.random() - 0.5).slice(0, 5);
}
const _startJobBase = startJob;
startJob = function (id, extra = {}) {
  _startJobBase(id, extra);
  const p = PROFESSIONS[id];
  if (p && p.kind === "station") player.job.prog = 0;
  if (p && p.kind === "rounds") player.job.targets = roundTargets(id, player.job.zone);
};
const _jobAvailableBase = jobAvailableHere;
jobAvailableHere = function (id, zone) {
  const p = PROFESSIONS[id];
  if (p && p.sim && !lifeMode()) return false;
  if (p && p.kind === "station") return !!findBuilding(zone, p.place);
  if (p && p.kind === "rounds") return !!ZONES[zone].town && roundTargets(id, zone).length > 0;
  if (p && p.kind === "serve") return !!ZONES[zone].town;
  return _jobAvailableBase(id, zone);
};
const _jobTickBase = jobTick;
jobTick = function (dt) {
  _jobTickBase(dt);
  const j = player.job;
  if (!j || game.mode !== "world" || game.dialog || player.zone !== j.zone) return;
  if (PROFESSIONS[j.id] && PROFESSIONS[j.id].kind === "serve") customersTick(dt);
};
const _jobLabelBase = jobLabel;
jobLabel = function (x, y) {
  const j = player.job;
  const p = j && PROFESSIONS[j.id];
  if (p && p.kind && player.zone === j.zone) {
    if (p.kind === "station") {
      const s = stationSpot(j);
      if (s && s.x === x && s.y === y) return `${p.verb} (${j.prog || 0}/${STATION_NEED})`;
    }
    if (p.kind === "rounds") {
      const t = (j.targets || []).find(([a, b]) => a === x && b === y);
      if (t) return `${p.verb}: ${t[2]}`;
    }
    if (p.kind === "serve" && customerAt(x, y)) return "Atender cliente";
  }
  return _jobLabelBase(x, y);
};
const _jobInteractBase = jobInteract;
jobInteract = function (x, y) {
  const j = player.job;
  const p = j && PROFESSIONS[j.id];
  const label = jobLabel(x, y);
  if (p && p.kind === "station" && label && label.startsWith(p.verb)) {
    const q = swingFeedback(x, y, p.icon);
    if (!q) return true;
    j.prog = (j.prog || 0) + q;
    playSound(j.id === "ferreiro" ? 900 : 520 + q * 80, 0.06, j.id === "ferreiro" ? "square" : "sine");
    if (lifeMode()) addNeed("energy", -1);
    if (j.prog >= STATION_NEED) {
      j.prog -= STATION_NEED;
      j.done++;
      earn(jobPay(p.pay), `${p.unit[0].toUpperCase() + p.unit.slice(1)} pronto!`);
    }
    return true;
  }
  if (p && p.kind === "rounds" && label && label.startsWith(p.verb)) {
    j.targets = j.targets.filter(([a, b]) => !(a === x && b === y));
    j.done++;
    const evening = j.id === "acendedor" && currentHour() >= 16 ? 2 : 0;
    earn(jobPay(p.pay) + evening, `${p.unit[0].toUpperCase() + p.unit.slice(1)} feita!`.replace("Lampião feita", "Lampião aceso").replace("Carta feita", "Carta entregue").replace("Visita feita", "Doente cuidado"));
    if (j.id === "enfermeiro") repAdd(1);
    if (!j.targets.length) {
      j.targets = roundTargets(j.id, j.zone);
      toast("Nova lista de pontos! Siga a seta.", 1800);
    }
    return true;
  }
  if (p && p.kind === "serve" && label === "Atender cliente") {
    const cu = customerAt(x, y);
    game.jobCustomers = game.jobCustomers.filter((q) => q !== cu);
    j.done++;
    earn(jobPay(p.pay) + (Math.random() < 0.3 ? 3 : 0), pickOne(["Hidromel servido!", "Ensopado na mesa!", "Cliente feliz!"]));
    return true;
  }
  return _jobInteractBase(x, y);
};
const _jobTargetBase = jobTarget;
jobTarget = function () {
  const j = player.job;
  const p = j && PROFESSIONS[j.id];
  if (p && p.kind && player.zone === j.zone) {
    if (p.kind === "station") return stationSpot(j);
    if (p.kind === "rounds") {
      const t = (j.targets || []).slice().sort((a, b) => Math.abs(a[0] - player.x) + Math.abs(a[1] - player.y) - (Math.abs(b[0] - player.x) + Math.abs(b[1] - player.y)))[0];
      return t ? { x: t[0], y: t[1] } : null;
    }
    return null;
  }
  return _jobTargetBase();
};
const _jobStatusBase = jobStatusText;
jobStatusText = function () {
  const j = player.job;
  const p = j && PROFESSIONS[j.id];
  if (!p || !p.kind) return _jobStatusBase();
  const left = Math.max(0, j.endAt - absMinutes());
  const time = `${Math.floor(left / 60)}h${String(Math.round(left % 60)).padStart(2, "0")} restantes`;
  const what =
    p.kind === "station"
      ? `${p.verb} na porta: ${p.place} (${j.prog || 0}/${STATION_NEED})`
      : p.kind === "rounds"
        ? `${(j.targets || []).length} ponto(s) na lista · siga a seta`
        : "Espere os clientes e sirva com E";
  return `${careerTitle(j.id)} · ${what} · ${j.earned} ouro · ${time}`;
};
const _jobDrawListBase = jobDrawList;
jobDrawList = function (list, t) {
  _jobDrawListBase(list, t);
  const j = player.job;
  const p = j && PROFESSIONS[j.id];
  if (!p || !p.kind || player.zone !== j.zone) return;
  const marks = p.kind === "station" ? [stationSpot(j)].filter(Boolean).map((s) => [s.x, s.y]) : p.kind === "rounds" ? j.targets || [] : [];
  for (const [x, y] of marks)
    list.push({
      y: y + 0.9,
      draw: () => drawPixelIcon(CAREER_GICON[j.id], x * TILE + 16, y * TILE - 6 - Math.abs(Math.sin(t * 4)) * 4, 2),
    });
};

/* ===================== PAINEL DE CARREIRAS ===================== */

function openCareers() {
  let el = byId("careers");
  if (!el) {
    el = document.createElement("div");
    el.id = "careers";
    el.className = "box ui ov";
    byId("screen").appendChild(el);
  }
  game.mode = "careers";
  const zone = player.zone;
  const hour = currentHour();
  const open = hour >= 6 && hour < 19;
  const ids = Object.keys(PROFESSIONS).filter((id) => !PROFESSIONS[id].sim || lifeMode());
  const cards = ids
    .map((id) => {
      const p = PROFESSIONS[id];
      const r = careerRank(id),
        xp = careerXp(id);
      const next = CAREER_RANKS[r + 1];
      const pct = next ? ((xp - CAREER_RANKS[r].xp) / (next.xp - CAREER_RANKS[r].xp)) * 100 : 100;
      const here = jobAvailableHere(id, zone);
      return `<div class="cr-card ${r >= 3 ? "master" : ""}">
        <div class="cr-ic">${iconHTML(CAREER_GICON[id] || p.icon, 34)}</div>
        <div class="cr-i"><b>${p.n}</b><small class="cr-rank">${"★".repeat(r + 1)}${"☆".repeat(4 - r)} ${CAREER_RANKS[r].n}</small>
        <p>${p.desc}</p>
        <div class="ip-bar" title="${xp} de experiência"><i style="width:${pct}%"></i><span>${next ? `${xp}/${next.xp} até ${next.n}` : "Topo da carreira!"}</span></div></div>
        <div class="cr-b"><span>${iconHTML("coin", 12)}${Math.round((p.pay || 5) * CAREER_RANKS[r].mul)}/tarefa</span><button data-job="${id}" ${here && open && !player.job ? "" : "disabled"}>${!here ? "Não tem aqui" : !open ? "Fechado" : "Trabalhar"}</button></div>
      </div>`;
    })
    .join("");
  const extra = [];
  if (lifeMode() || player.flags.stall) extra.push(`<button data-x="stall">${iconHTML("bag", 16)}${player.flags.stall ? "Abrir minha tendinha" : "Ter minha tendinha"}</button>`);
  if (!lifeMode()) extra.push(`<button data-x="jobs">${iconHTML("scroll", 16)}Tarefas do quadro</button>`);
  extra.push(`<button data-x="mural">${iconHTML("heart", 16)}Mural dos Corações</button>`);
  const best = ids.filter((id) => careerXp(id) > 0).sort((a, b) => careerXp(b) - careerXp(a))[0];
  el.innerHTML = `<div class="gh"><h2>${iconHTML("hammer", 22)} Carreiras</h2><button id="crclose">Fechar (Esc)</button></div>
    <div class="cr-top"><div>${best ? `Sua carreira principal: <b>${careerTitle(best)}</b>` : "Escolha um trabalho para começar sua carreira."} · Turnos de ${SHIFT_HOURS}h, das 6h às 19h.${open ? "" : ` <b style="color:#ff9a9a">Agora está fechado.</b>`}</div><div class="cr-x">${extra.join("")}</div></div>
    <div class="cr-grid">${cards}</div>`;
  el.style.display = "block";
  byId("crclose").onclick = closeCareers;
  el.querySelectorAll("[data-job]").forEach((b) => (b.onclick = () => (closeCareers(), startJob(b.dataset.job))));
  el.querySelectorAll("[data-x]").forEach(
    (b) =>
      (b.onclick = () => {
        closeCareers();
        ({ stall: stallMenu, jobs: () => openJobs(true), mural: heartBoardMenu })[b.dataset.x]();
      }),
  );
}
function closeCareers() {
  const el = byId("careers");
  if (el) el.style.display = "none";
  if (game.mode === "careers") game.mode = "world";
}
KEY_HANDLERS.careers = (k) => k === "escape" && closeCareers();
BEFORE_DIALOG.add("careers");
const _professionsMenuBase = professionsMenu;
professionsMenu = function () {
  if (player.job) return _professionsMenuBase();
  openCareers();
};
