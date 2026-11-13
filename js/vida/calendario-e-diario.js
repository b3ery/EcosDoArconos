/**
 * ECOS DO ARCANO — calendario-e-diario.js
 *  1. Calendário da vila (tecla L): festivais, desfiles, aniversários, reuniões, exposições.
 *  2. Diário do jogador: registra sozinho o que você viveu (aba no mesmo painel).
 *  3. Ofícios fabricam itens de verdade (pão, ferramentas, roupas, livros, poções, quadros, móveis).
 *  4. Minijogos no festival: Concurso de Tortas, Corrida de Sacos e Dança na Praça.
 *  5. Retratos com expressão (feliz, bravo, triste, surpreso, apaixonado) para quem tem rosto detalhado.
 *  6. Ciúmes na turma: quem fica de lado reclama; dá para fazer as pazes.
 *  8. Transições: cartão com o nome do lugar e uma dica ao mudar de região.
 *  9. Sons de interface: clique, abrir a bolsa, compra, promoção.
 * Modifica (envolve) funções de outros arquivos: crewItems, drawDialogPortrait, earn, endJob, enterZone, festivalMenu, onNewDay, openInv, payWithTax, socialMenu.
 */

"use strict";

/* ===================== CALENDÁRIO E DIÁRIO ===================== */

function dayEvents(d) {
  const ev = [];
  const fest = d % 7 === 0 ? FESTS[(Math.floor(d / 7) - 1) % 4] : null;
  if (fest) ev.push(["party", fest.n, "Praça de Cinzaluz, o dia todo. Fogos à noite."]);
  if (d % 5 === 3 && !fest) ev.push(["crown", "Desfile da família real", "Das 10h às 12h, pelas ruas da vila."]);
  const yd = ((d - 1) % 28) + 1;
  for (const [id, b] of Object.entries(CREW_BDAY)) if (b === yd) ev.push(["cake", `Aniversário de ${crewName(id)}`, "Festa na fonte às 18h. Presentes valem o dobro."]);
  if (d % 7 === 5) ev.push(["mug", `Reunião dos ${GROUP_NAME}`, "Taverna Javali Dourado, das 19h às 23h."]);
  if (d % 7 === 3) ev.push(["flower", "Exposição da Mylena", "Ateliê da Mylena, até as 17h. Quadro único à venda."]);
  if (d % 3 === 1 && !fest) ev.push(["chat", "Turma na fonte", "Os seis se encontram na fonte das 17h às 21h."]);
  if (d % 7 === 6) ev.push(["crown", "Visita do Rei Vini", "O Rei do Sul passeia por Cinzaluz com a Júlia."]);
  if (player.lucasWed === d) ev.push(["ring", "Casamento do Lucas", "No Templo. Fale com o Lucas para ir."]);
  if (d % 7 === 1) ev.push(["sun", `Começa a ${SEASONS[Math.floor((d - 1) / 7) % 4].n}`, "Mudam o clima e as colheitas."]);
  return ev;
}
function logEvent(icon, text) {
  player.log = player.log || [];
  const last = player.log[player.log.length - 1];
  if (last && last[2] === text) return;
  player.log.push([player.day, icon, text]);
  if (player.log.length > 300) player.log.shift();
}
/** O diário observa o jogo e anota o que mudou. */
function diaryWatch() {
  if (game.mode === "title" || !player.name) return;
  const s = (game.diarySnap = game.diarySnap || {});
  const now = {
    spouse: player.spouse,
    dating: player.dating,
    kids: (player.kids || []).length,
    guards: freedGuardRegions().length,
    guardList: freedGuardRegions(),
    home: player.home,
    houses: (player.houses || []).length,
    pets: (player.pets || []).length,
    rescues: player.rescues || 0,
    ach: Object.keys(player.ach || {}).length,
    tq: Object.values(player.townQ || {}).filter((v) => v === "feito" || v === "done").length,
    careers: JSON.stringify(Object.fromEntries(Object.keys(player.careers || {}).map((k) => [k, careerRank(k)]))),
    finished: !!player.finished,
  };
  if (!s.ready) return Object.assign(s, now, { ready: true });
  const nm = (id) => (NPCS[id] ? NPCS[id].nome.split(",")[0] : id);
  if (now.dating && now.dating !== s.dating) logEvent("heart", `Começou a namorar ${nm(now.dating)}.`);
  if (now.spouse && now.spouse !== s.spouse) logEvent("ring", `Casou com ${nm(now.spouse)}.`);
  if (now.kids > s.kids) {
    const k = player.kids[player.kids.length - 1];
    logEvent("baby", `Nasceu ${k.g === "f" ? "a" : "o"} pequen${k.g === "f" ? "a" : "o"} ${k.name}.`);
  }
  if (now.guards > s.guards) {
    const g = freedGuardRegions().filter((z) => !(s.guardList || []).includes(z))[0];
    logEvent("skull", `Venceu o Guardião de ${g === "farol" ? "o Farol de Brisamar" : ZONE_DEFS[g]?.nome || "uma região"}.`);
  }
  if (now.home !== s.home && now.home) logEvent("house", `Mudou para ${allHouses()[now.home]?.n || "uma casa nova"}.`);
  if (now.houses > s.houses) logEvent("coin", "Comprou uma casa.");
  if (now.pets > s.pets) logEvent("paw", `Adotou ${player.pets[player.pets.length - 1].name}.`);
  if (now.rescues > s.rescues) logEvent("paw", "Resgatou um animal para a Clínica da Júlia.");
  if (now.ach > s.ach) {
    const id = Object.keys(player.ach).find((k) => player.ach[k] === player.day);
    const a = ACHIEVEMENTS.find((q) => q[0] === id);
    if (a) logEvent("crown", `Conquista: ${a[1]}.`);
  }
  if (now.careers !== s.careers) {
    const o = JSON.parse(s.careers || "{}"),
      n = JSON.parse(now.careers);
    for (const k of Object.keys(n)) if (n[k] > (o[k] ?? 0)) logEvent("hammer", `Promovido: ${careerTitle(k)}.`);
  }
  if (now.finished && !s.finished) logEvent("note", player.villainEnd ? "Terminou a história pelo caminho sombrio." : "Trouxe a Canção Arcana de volta.");
  Object.assign(s, now);
}
setInterval(diaryWatch, 2000);

function openCalendar(tab) {
  if (!["world", "title"].includes(game.mode) && game.mode !== "cal") return;
  let el = byId("cal");
  if (!el) {
    el = document.createElement("div");
    el.id = "cal";
    el.className = "box ui ov";
    byId("screen").appendChild(el);
  }
  if (game.mode !== "cal") game.calPrev = game.mode;
  game.mode = "cal";
  game.calTab = tab || game.calTab || "cal";
  let body = "";
  if (game.calTab === "cal") {
    const days = [];
    for (let d = player.day; d < player.day + 14; d++) {
      const ev = dayEvents(d);
      const s = SEASONS[Math.floor((d - 1) / 7) % 4];
      days.push(`<div class="cal-day ${d === player.day ? "today" : ""} ${ev.some((e) => e[0] === "party") ? "fest" : ""}">
        <div class="cal-h"><b>${d === player.day ? "Hoje" : d === player.day + 1 ? "Amanhã" : "Dia " + d}</b><small>${s.n} · ${((d - 1) % 7) + 1}/7</small></div>
        ${ev.length ? ev.map(([ic, n, desc]) => `<div class="cal-ev">${iconHTML(ic, 16)}<div><b>${n}</b><small>${desc}</small></div></div>`).join("") : `<div class="cal-none">Dia tranquilo.</div>`}
      </div>`);
    }
    body = `<div class="cal-grid">${days.join("")}</div>`;
  } else {
    const log = (player.log || []).slice().reverse();
    body = log.length
      ? `<div class="dia">${log.map(([d, ic, t]) => `<div class="dia-e"><span class="dia-d">Dia ${d}</span>${iconHTML(ic, 18)}<span>${t}</span></div>`).join("")}</div>`
      : `<div class="qtip">Seu diário ainda está em branco. Namore, case, tenha filhos, mude de casa, suba na carreira e vença Guardiões: tudo fica anotado aqui.</div>`;
  }
  el.innerHTML = `<div class="gh"><h2>${iconHTML(game.calTab === "cal" ? "clock" : "book", 22)} ${game.calTab === "cal" ? "Calendário da vila" : `Diário de ${player.name}`}</h2><button id="calclose">Fechar (L)</button></div>
    <div class="inv-tabs"><button data-ct="cal" class="${game.calTab === "cal" ? "on" : ""}">${iconHTML("clock", 18)}<span>Calendário</span></button><button data-ct="dia" class="${game.calTab === "dia" ? "on" : ""}">${iconHTML("book", 18)}<span>Diário</span></button></div>${body}`;
  el.style.display = "block";
  byId("calclose").onclick = closeCalendar;
  el.querySelectorAll("[data-ct]").forEach((b) => (b.onclick = () => openCalendar(b.dataset.ct)));
}
function closeCalendar() {
  const el = byId("cal");
  if (el) el.style.display = "none";
  game.mode = game.calPrev || "world";
}
WORLD_SHORTCUTS.l = () => openCalendar();
KEY_HANDLERS.cal = (k) => (k === "escape" || k === "l") && closeCalendar();
BEFORE_DIALOG.add("cal");
{
  const small = document.querySelector("#touch .small");
  if (small) {
    const b = document.createElement("button");
    b.textContent = "Agenda";
    b.addEventListener("click", () => game.mode === "world" && openCalendar());
    small.appendChild(b);
  }
}

/* ===================== OFÍCIOS FABRICAM ITENS ===================== */

const CRAFT_OUTPUT = {
  padeiro: ["i_pao_de_centeio", "i_broa_de_milho", "i_baguete", "i_pao_doce", "i_brioche", "i_rosca_trancada"],
  ferreiro: ["i_martelo", "i_picareta_de_ferro", "i_machado_de_lenhador", "i_foice", "i_lingote_de_ferro", "i_chave_antiga"],
  costureiro: ["i_tunica_de_linho", "i_manto_de_la", "i_capa_de_viagem", "i_luvas_de_couro"],
  cozinheiro: ["i_sopa_de_abobora", "i_sopa_de_legumes", "i_caldo_de_peixe", "i_omelete", "i_guisado_do_cacador"],
  escriba: ["i_diario_em_branco", "i_contos_de_fadas", "i_cancoes_de_taverna", "i_poemas_de_amor", "i_almanaque_do_campones"],
  boticario: ["i_pocao_de_vida_pequena", "i_pocao_de_mana_pequena", "i_antidoto", "i_unguento_de_ervas", "i_xarope_de_mel"],
  pintor: ["i_quadro_do_mar", "i_quadro_do_campo", "i_quadro_do_castelo"],
  marceneiro: ["i_cadeira_de_pinho", "i_banquinho", "i_mesa_de_pinho", "i_bau_de_pinho", "i_estante"],
};
const _earnCraft = earn;
earn = function (amount, why) {
  _earnCraft(amount, why);
  const j = player.job;
  const list = j && CRAFT_OUTPUT[j.id];
  if (!list || !/pronto/.test(why)) return;
  const pool = list.filter((id) => ITEMS[id]);
  if (!pool.length || Math.random() > 0.5) return;
  const id = pickOne(pool);
  addItem(id);
  setTimeout(() => toast(`Você ficou com ${ITEMS[id].nome} que fez! (está na bolsa)`, 2400), 600);
};

/* ===================== MINIJOGOS DO FESTIVAL ===================== */

const MINIGAMES = {
  torta: { n: "Concurso de Tortas", icon: "pie", rounds: 3, desc: "Acerte o ponto da massa, do recheio e do forno. Aperte E (ou o botão) quando o marcador estiver no verde.", steps: ["Sovar a massa", "Colocar o recheio", "Tirar do forno"] },
  danca: { n: "Dança na Praça", icon: "note", rounds: 6, desc: "Siga o ritmo da música! Aperte E no verde a cada batida.", steps: ["Passo 1", "Passo 2", "Giro", "Passo 3", "Palma", "Pose final"] },
  sacos: { n: "Corrida de Sacos", icon: "bolt", mash: 5, desc: "Aperte E (ou toque no botão) o mais rápido que puder por 5 segundos!" },
};
function openMinigame(k) {
  const M = MINIGAMES[k];
  if (player.famDay["mg" + k] === player.day) return say([["", `Você já participou do ${M.n} hoje. Volte no próximo festival!`]]);
  let el = byId("mgame");
  if (!el) {
    el = document.createElement("div");
    el.id = "mgame";
    el.className = "ui";
    byId("screen").appendChild(el);
  }
  game.mg = { k, step: 0, score: 0, presses: 0, t0: 0, done: false };
  game.mode = "mgame";
  el.style.display = "flex";
  renderMinigame();
}
function renderMinigame() {
  const g = game.mg,
    M = MINIGAMES[g.k];
  const el = byId("mgame");
  if (g.done) {
    const max = M.mash ? 40 : M.rounds * 2;
    const ratio = g.score / max;
    const place = ratio >= 0.8 ? 1 : ratio >= 0.55 ? 2 : ratio >= 0.3 ? 3 : 0;
    const prize = [0, 120, 60, 25][place];
    if (!g.paid) {
      g.paid = true;
      player.famDay["mg" + g.k] = player.day;
      player.gold += prize;
      if (place === 1) {
        repAdd(3);
        addItem(g.k === "torta" ? "i_torta_de_maca" : g.k === "danca" ? "i_coroa_de_flores" : "i_dobrao_de_ouro");
      }
      if (lifeMode()) addNeed("fun", 30);
      logEvent("party", place ? `Ficou em ${place}º lugar no ${M.n}.` : `Participou do ${M.n}.`);
      saveGame();
      playSound(place === 1 ? 1047 : 660, 0.3, "sine");
    }
    el.innerHTML = `<div class="mg-card"><div class="mg-ic">${iconHTML(place ? "crown" : M.icon, 44)}</div><h3>${M.n}</h3>
      <div class="mg-res">${place ? `${place}º lugar!` : "Não foi dessa vez..."}</div>
      <p>${M.mash ? `${g.presses} pulos em 5 segundos.` : `Pontuação: ${g.score} de ${max}.`} ${prize ? `Prêmio: <b>${prize} ouro</b>${place === 1 ? " e um presente especial" : ""}.` : "A vila aplaude mesmo assim!"}</p>
      <button id="mgok" class="go">Voltar à festa</button></div>`;
    byId("mgok").onclick = closeMinigame;
    return;
  }
  const meter = !M.mash;
  el.innerHTML = `<div class="mg-card"><div class="mg-ic">${iconHTML(M.icon, 44)}</div><h3>${M.n}</h3><p>${M.desc}</p>
    ${meter ? `<div class="mg-step">${M.steps[g.step]} · ${g.step + 1}/${M.rounds}</div><div class="mg-bar"><i class="r"></i><i class="y"></i><i class="g"></i><b id="mgmark"></b></div>` : `<div class="mg-step" id="mgtime">${g.t0 ? "Vai, vai, vai!" : "Pronto?"}</div><div class="mg-sack"><div id="mgsack" style="width:${Math.min(100, g.presses * 2.5)}%"></div></div><div class="mg-step">${g.presses} pulos</div>`}
    <div class="mg-score">${meter ? `Pontos: ${g.score}` : ""}</div>
    <button id="mghit" class="go">${meter ? "Agora! (E)" : g.t0 ? "Pular! (E)" : "Começar (E)"}</button><button id="mgquit">Desistir</button></div>`;
  byId("mghit").onclick = minigameHit;
  byId("mgquit").onclick = closeMinigame;
}
function minigameHit() {
  const g = game.mg;
  if (!g || g.done) return closeMinigame();
  const M = MINIGAMES[g.k];
  if (M.mash) {
    if (!g.t0) {
      g.t0 = performance.now();
      setTimeout(() => {
        g.done = true;
        g.score = g.presses;
        renderMinigame();
      }, M.mash * 1000);
    } else g.presses++;
    playSound(400 + Math.min(600, g.presses * 15), 0.03, "square");
    return renderMinigame();
  }
  const q = hitQuality();
  g.score += q;
  playSound(q === 2 ? 1047 : q ? 784 : 200, 0.08, q ? "sine" : "square");
  toast(q === 2 ? "Perfeito!" : q ? "Bom!" : "Errou...", 700);
  g.step++;
  if (g.step >= M.rounds) g.done = true;
  renderMinigame();
}
function closeMinigame() {
  const el = byId("mgame");
  if (el) el.style.display = "none";
  game.mg = null;
  game.mode = "world";
}
setInterval(() => {
  const m = byId("mgmark");
  if (m && game.mode === "mgame") m.style.left = swingPos() * 100 + "%";
}, 30);
KEY_HANDLERS.mgame = (k, e) => {
  if (e.repeat) return;
  if (k === "e" || k === " " || k === "enter") minigameHit();
  else if (k === "escape") closeMinigame();
};
BEFORE_DIALOG.add("mgame");
const _festivalMenuBase = festivalMenu;
festivalMenu = function () {
  _festivalMenuBase();
  if (game.mode !== "choice") return;
  const opts = game.choice;
  const extra = Object.entries(MINIGAMES).map(([k, M]) => ({ t: `${M.n}${player.famDay["mg" + k] === player.day ? " (já participou)" : ""}`, icon: M.icon, fn: () => openMinigame(k) }));
  opts.splice(opts.length - 1, 0, ...extra);
  choice("Festival", "Escolha o que fazer na festa:", opts);
};

/* ===================== RETRATOS COM EXPRESSÃO ===================== */

const _drawDialogPortraitExpr = drawDialogPortrait;
drawDialogPortrait = function (d, talking) {
  _drawDialogPortraitExpr(d, talking);
  if (!d || !d.look) return;
  const hero = d.look.hero || d.look.kid || (d.look.robe && HERO_LOOKS[`${d.look.robe}|${d.look.hat ?? null}|${d.look.hair}`]);
  if (!hero) return;
  const em = lineEmotion(d.lines[d.i][1]);
  if (!em) return;
  const cv = byId("dport"),
    c2 = cv.getContext("2d");
  const mood = byId("dtxt").className;
  const bounce = talking && (mood === "shout" || mood === "excited") ? Math.abs(Math.sin(game.t * 18)) * 3 : Math.sin(game.t * 2) * 0.6;
  const u = 6,
    ox = cv.width / 2 - 8 * u,
    oy = 8 - bounce;
  const P = (x, y, w, h, c) => {
    c2.fillStyle = c;
    c2.fillRect(ox + x * u, oy + y * u, w * u, h * u);
  };
  const dark = "#2a1a14";
  if (em === "anger") {
    P(5.6, 6.1, 1.6, 0.35, dark);
    P(8.8, 6.1, 1.6, 0.35, dark);
    P(6.2, 5.8, 0.5, 0.35, dark);
    P(9.3, 5.8, 0.5, 0.35, dark);
    P(7, 8.6, 2, 0.35, dark);
  } else if (em === "sweat") {
    P(5.8, 6.3, 1.4, 0.3, dark);
    P(8.8, 6.3, 1.4, 0.3, dark);
    P(7, 8.7, 2, 0.3, dark);
    P(6.6, 8.4, 0.4, 0.3, dark);
    P(9, 8.4, 0.4, 0.3, dark);
    P(10.3, 7.4, 0.4, 0.7, "#7ac0ff");
  } else if (em === "laugh" || em === "smile") {
    P(6.8, 8.3, 0.4, 0.35, dark);
    P(9, 8.3, 0.4, 0.35, dark);
    P(7.2, 8.6, 1.8, 0.4, em === "laugh" ? "#8a2a2a" : dark);
  } else if (em === "heart") {
    P(5.7, 8, 0.9, 0.4, "#ff8aa8");
    P(9.4, 8, 0.9, 0.4, "#ff8aa8");
    P(7.3, 8.6, 1.4, 0.3, dark);
  } else if (em === "eye") {
    P(7.6, 8.4, 0.8, 0.6, "#5a1a1a");
    P(5.9, 6.1, 1.2, 0.3, dark);
    P(8.9, 6.1, 1.2, 0.3, dark);
  }
};

/* ===================== CIÚMES NA TURMA ===================== */

const CREW_PAIRS = [
  ["lucas", "matheus"],
  ["mylena", "andressa"],
  ["mylena", "juliaO"],
  ["andressa", "juliaO"],
  ["marcos", "lucas"],
];
const _socialMenuJealous = socialMenu;
socialMenu = function (id) {
  if (CREW.includes(id)) {
    player.crewAttn = player.crewAttn || {};
    if (player.famDay["attn" + id] !== player.day) {
      player.famDay["attn" + id] = player.day;
      player.crewAttn[id] = (player.crewAttn[id] || 0) + 1;
    }
    const j = player.jealous;
    if (j && j.id === id && !j.shown) {
      j.shown = true;
      saveGame();
      return say(
        [[crewName(id), pickOne([`Ah, lembrou de mim? Achei que agora você só andava com ${crewName(j.of)}.`, `Tudo bem, ${crewName(j.of)} é mais divertido, né? Eu entendo... *cruza os braços*`, `Fiquei sabendo que você passou a semana com ${crewName(j.of)}. Nem um oi pra mim.`])]],
        () => _socialMenuJealous(id),
      );
    }
  }
  return _socialMenuJealous(id);
};
const _crewItemsJealous = crewItems;
crewItems = function (id) {
  const items = _crewItemsJealous(id);
  const j = player.jealous;
  if (j && j.id === id)
    items.unshift({
      t: "Fazer as pazes (ciúmes)",
      icon: "heart",
      fn: () => {
        player.jealous = null;
        addFriendship(id, 8);
        saveGame();
        say([
          ["Você", `Ei, você é especial pra mim também. ${crewName(j.of)} não toma o seu lugar.`],
          [crewName(id), pickOne(["...Tá bom. Mas amanhã você paga o hidromel.", "Desculpa o drama. Eu só senti sua falta!", "Promete que a gente sai essa semana? Então tá perdoado."])],
        ]);
      },
    });
  return items;
};
const _onNewDayJealous = onNewDay;
onNewDay = function () {
  _onNewDayJealous.apply(this, arguments);
  const a = player.crewAttn || {};
  if (player.jealous || player.day % 3) return;
  for (const [x, y] of CREW_PAIRS) {
    const ax = a[x] || 0,
      ay = a[y] || 0;
    const [more, less] = ax > ay ? [x, y] : [y, x];
    if (Math.abs(ax - ay) >= 3 && friendship(less) >= 20) {
      player.jealous = { id: less, of: more, day: player.day };
      addFriendship(less, -3);
      a[more] = a[less] = 0;
      setTimeout(() => toast(`${crewName(less)} anda meio emburrado com você... Fale com ele(a).`, 4200), 6200);
      break;
    }
  }
};

/* ===================== TRANSIÇÕES ===================== */

const ZONE_TIPS = [
  "Durma em casa para recuperar tudo e não perder o fôlego.",
  "Aperte L para ver o calendário: festivais e reuniões não passam batido.",
  "Clique numa pessoa para abrir o menu em pizza.",
  "Presentes favoritos valem muito mais amizade.",
  "Na tempestade, fique longe do círculo amarelo: é onde o raio vai cair!",
  "Cada carreira sobe de cargo: Aprendiz, Ajudante, Oficial, Mestre e Lenda.",
  "As lojas grandes têm filtros por categoria em cima do carrossel.",
  "Os Alcoólatras Anônimos se reúnem na taverna a cada 7 dias.",
  "Sem facão, a Floresta Grande é perigosa.",
  "No inventário, duplo clique num item usa ou equipa.",
];
const _enterZoneTrans = enterZone;
enterZone = function (showBanner = true) {
  const from = game.lastZoneCard;
  _enterZoneTrans(showBanner);
  const z = player.zone;
  if (["casa", "interior", "quintal"].includes(z) || from === z || game.mode === "title") return;
  game.lastZoneCard = z;
  if (!from) return;
  let el = byId("zcard");
  if (!el) {
    el = document.createElement("div");
    el.id = "zcard";
    el.className = "ui";
    byId("screen").appendChild(el);
  }
  el.innerHTML = `<div class="zc-in"><small>Você chegou em</small><b>${(ZONE_DEFS[z] && ZONE_DEFS[z].nome) || z}</b><span>${iconHTML("star", 14)} ${pickOne(ZONE_TIPS)}</span></div>`;
  el.classList.remove("show");
  void el.offsetWidth;
  el.classList.add("show");
};

/* ===================== SONS DE INTERFACE ===================== */

function uiSound(kind) {
  if (typeof settings !== "undefined" && !settings.sfx) return;
  if (kind === "click") playSound(880, 0.025, "triangle", 0.025);
  else if (kind === "bag") {
    playSound(220, 0.05, "triangle", 0.04);
    setTimeout(() => playSound(330, 0.06, "triangle", 0.04), 50);
  } else if (kind === "coin") {
    playSound(1319, 0.05, "square", 0.03);
    setTimeout(() => playSound(1760, 0.08, "square", 0.03), 60);
  } else if (kind === "fanfare") [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => playSound(f, 0.16, "square", 0.04), i * 110));
}
document.addEventListener(
  "click",
  (e) => {
    if (e.target.closest && e.target.closest("button") && !e.target.closest("#pie")) uiSound("click");
  },
  true,
);
const _openInvSnd = openInv;
openInv = function () {
  _openInvSnd();
  if (game.mode === "inv") uiSound("bag");
};
const _payWithTaxSnd = payWithTax;
payWithTax = function (v) {
  const r = _payWithTaxSnd(v);
  uiSound("coin");
  return r;
};
const _endJobSnd = endJob;
endJob = function (reason) {
  const j = player.job;
  const before = j && PROFESSIONS[j.id] ? careerRank(j.id) : 0;
  _endJobSnd(reason);
  if (j && PROFESSIONS[j.id] && careerRank(j.id) > before) setTimeout(() => uiSound("fanfare"), 300);
};
