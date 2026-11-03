/**
 * ECOS DO ARCANO — 08-interface.js
 * Caixas de diálogo, missões, HUD e grimório.
 */

/* ===================== DIÁLOGO ===================== */

const DIALOG_SPEED = 55;
const NAME_COLORS = ["#f2c14e", "#7fd0ff", "#ff8ad0", "#9ff0cf", "#ffb36b", "#c9a8ff", "#a8e06b"];

const nameHash = (name) => [...name].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7);

/** Descobre a aparência de quem está falando, para o retrato. */
function speakerLook(name) {
  if (!name) return null;
  if (name === "Você") return { hero: true };
  const short = name.split(",")[0];
  for (const id in NPCS) {
    const n = NPCS[id];
    if (n.nome === name || n.nome.split(",")[0] === short)
      return { robe: n.robe, hat: n.hat, hair: n.hair, id };
  }
  const walker = (game.walkers || []).find((w) => w.nm === short);
  if (walker) return { robe: walker.robe, hat: walker.hat, hair: walker.hair };
  if (game.inter && game.inter.keeper && game.inter.keeper.split(",")[0] === short)
    return { robe: game.inter.kc, hair: game.inter.kh };
  const seed = nameHash(name);
  return {
    robe: NAME_COLORS[seed % NAME_COLORS.length],
    hair: ["#3a2414", "#d9a441", "#1a1a1a", "#8a3a1a"][seed % 4],
  };
}

function escapeHtml(text) {
  return text.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]);
}

/** *ações* em itálico e "falas citadas" em destaque. */
function formatDialogText(text) {
  return escapeHtml(text)
    .replace(/"([^"]*)"?/g, "<b class=d-quote>&quot;$1&quot;</b>")
    .replace(/\*([^*]*)\*?/g, "<i class=d-act>$1</i>");
}

function lineMood(text) {
  if (/!{1}/.test(text) && /[A-ZÁÉÍÓÚ]{4,}|!!|\?!/.test(text)) return "shout";
  if (text.trim().endsWith("!")) return "excited";
  if (/\.\.\.|…/.test(text)) return "soft";
  return "";
}

function say(lines, cb) {
  game.dialog = { lines, i: 0, chars: 0, cb, shown: -1, pause: 0 };
  renderDialogLine();
  byId("dialog").style.display = "block";
}

function renderDialogLine() {
  const d = game.dialog;
  const [who, text] = d.lines[d.i];
  const nameBox = byId("dwho");
  nameBox.textContent = who;
  nameBox.style.display = who ? "block" : "none";
  nameBox.style.color = who === "Você" ? "#fff" : NAME_COLORS[nameHash(who || "x") % NAME_COLORS.length];
  byId("dtxt").innerHTML = "";
  byId("dtxt").className = lineMood(text);
  byId("dialog").classList.toggle("narration", !who);
  d.look = speakerLook(who);
  d.voice = who ? 180 + (nameHash(who) % 6) * 45 : 0;
  d.shown = -1;
  d.pause = 0;
  byId("dport").style.display = d.look ? "block" : "none";
  if (d.look && d.look.id) {
    const spot = typeof npcSpot === "function" ? npcSpot(d.look.id) : null;
    if (spot) game.bubbles.push({ x: spot[0], y: spot[1], icon: "chat", t: 1.6 });
  }
}

/** Digitação com ritmo: pausa em pontuação e uma "voz" para cada personagem. */
function updateDialogTyping(d, dt) {
  const full = d.lines[d.i][1];
  if (d.pause > 0) d.pause -= dt;
  else if (d.chars < full.length) {
    const speed = byId("dtxt").className === "soft" ? DIALOG_SPEED * 0.6 : DIALOG_SPEED;
    const before = Math.floor(d.chars);
    d.chars = Math.min(full.length, d.chars + dt * speed);
    const after = Math.floor(d.chars);
    if (after > before) {
      const ch = full[after - 1];
      if (".!?".includes(ch)) d.pause = 0.22;
      else if (ch === ",") d.pause = 0.08;
      if (d.voice && after % 2 === 0 && ch.trim() && audioCtx)
        playSound(d.voice + Math.random() * 30, 0.03, "square", 0.015);
    }
  }
  const n = Math.floor(d.chars);
  if (n !== d.shown) {
    byId("dtxt").innerHTML = formatDialogText(full.slice(0, n));
    d.shown = n;
  }
  drawDialogPortrait(d, n < full.length);
}

/** Retrato animado: pisca, mexe a boca enquanto fala e pula quando grita. */
function drawDialogPortrait(d, talking) {
  if (!d.look) return;
  const cv = byId("dport");
  const c2 = cv.getContext("2d");
  const t = game.t;
  c2.clearRect(0, 0, cv.width, cv.height);
  const mood = byId("dtxt").className;
  const bounce =
    talking && (mood === "shout" || mood === "excited")
      ? Math.abs(Math.sin(t * 18)) * 3
      : Math.sin(t * 2) * 0.6;
  const rects = d.look.hero
    ? heroRects(player.look, "down", player.look.staffc || "#ffe066")
    : wizardRects(d.look.robe, d.look.hat, d.look.hair, null, "down");
  const u = 6;
  const ox = cv.width / 2 - 8 * u,
    oy = 8 - bounce;
  for (const [x, y, w, h, col] of rects) {
    if (y > 12) continue;
    c2.fillStyle = col;
    c2.fillRect(ox + x * u, oy + y * u, w * u, Math.min(h, 13 - y) * u);
  }
  const skin = d.look.hero ? player.look.skin : "#f1c8a5";
  const blink = Math.floor(t * 10) % 34 === 0;
  if (blink) {
    c2.fillStyle = skin;
    c2.fillRect(ox + 6 * u, oy + 7 * u, 4 * u, u);
  }
  if (talking && Math.floor(t * 12) % 2 === 0) {
    c2.fillStyle = "#6a2a2a";
    c2.fillRect(ox + 7 * u, oy + 8.4 * u, 2 * u, u * 0.6);
  }
}

function advanceDialog() {
  const d = game.dialog;
  if (!d) return;
  const full = d.lines[d.i][1];
  if (d.chars < full.length) {
    d.chars = full.length;
    d.pause = 0;
    return;
  }
  d.i++;
  playSound(520, 0.04);
  if (d.i >= d.lines.length) {
    byId("dialog").style.display = "none";
    game.dialog = null;
    if (d.cb) d.cb();
  } else {
    d.chars = 0;
    renderDialogLine();
  }
}

/* ===================== MISSÕES ===================== */

const SIDE_OF = {
  bosque: "w",
  pantano: "e",
  picos: "n",
  torre: "s",
};
function npcPos(id) {
  if (player.zone === "vila" && game.roam) {
    const r = game.roam.find((q) => q.id === id);
    if (r) return [r.x, r.y];
  }
  for (const [x, y, n] of ZONES.vila.npcList) if (n === id) return [x, y];
  return [16, 12];
}
const STEPS = [
  {
    id: "treino",
    t: "Treine com o Instrutor Kael",
    zone: "vila",
    pos: () => {
      const p = npcPos("kael");
      return [p[0], p[1] + 1];
    },
    d: "O campo de treino cercado fica ao lado do castelo, no norte da vila. Kael vai te ensinar a lutar passo a passo.",
    done: () => player.flags.treino,
  },
  {
    id: "mercado",
    t: "Compre suprimentos no mercado",
    zone: "vila",
    pos: () => VILLAGE_POINTS.mercado,
    d: "O mercado fica a leste da praça central. Compre comida e água com a Rosa (barraca amarela) ou poções com o Bruno (barraca vermelha).",
    done: () => player.flags.bought,
  },
  {
    id: "ent",
    t: "Liberte o Ent Silenciado",
    zone: "bosque",
    pos: () => ZONES.bosque.guardPos,
    lvl: 3,
    get d() {
      return `O Guardião está no extremo oeste do Bosque Murmurante. Ele é fraco contra ${RUNE_WITH_ARTICLE[player.order[0]]}, a sua runa: use um feitiço duplo dela.`;
    },
    done: () => player.guards.includes("bosque"),
  },
  {
    id: "r2",
    get t() {
      return `Conte à Odelia sobre a Runa ${RUNE_OF[player.order[1]]}`;
    },
    zone: "vila",
    pos: () => npcPos("odelia"),
    d: "Volte à vila e fale com a Arquimaga Odelia.",
    done: () => player.flags.r2,
  },
  {
    id: "serp",
    t: "Liberte a Serpente de Névoa",
    zone: "pantano",
    pos: () => ZONES.pantano.guardPos,
    lvl: 5,
    get d() {
      return `Ela está no extremo leste do Pântano das Brumas. É fraca contra ${RUNE_WITH_ARTICLE[player.order[1]]}.`;
    },
    done: () => player.guards.includes("pantano"),
  },
  {
    id: "r3",
    get t() {
      return `Conte à Odelia sobre a Runa ${RUNE_OF[player.order[2]]}`;
    },
    zone: "vila",
    pos: () => npcPos("odelia"),
    d: "Volte à vila e fale com a Arquimaga Odelia.",
    done: () => player.flags.r3,
  },
  {
    id: "grif",
    t: "Liberte o Grifo de Pedra",
    zone: "picos",
    pos: () => ZONES.picos.guardPos,
    lvl: 7,
    get d() {
      return `Ele está no topo dos Picos Uivantes, ao norte. É fraco contra ${RUNE_WITH_ARTICLE[player.order[2]]}.`;
    },
    done: () => player.guards.includes("picos"),
  },
  {
    id: "r4",
    t: "Conte à Odelia que as quatro runas voltaram",
    zone: "vila",
    pos: () => npcPos("odelia"),
    d: "Volte à vila e fale com a Arquimaga Odelia. A barreira ao sul vai se abrir.",
    done: () => player.flags.r4,
  },
  {
    id: "sile",
    t: "Enfrente o Silenciador",
    zone: "torre",
    pos: () => ZONES.torre.guardPos,
    lvl: 9,
    d: "Atravesse a barreira ao sul da vila. Ele está na sala mais funda da Torre do Silêncio. A fraqueza dele muda a cada 3 turnos.",
    done: () => false,
  },
];
function urgent() {
  const hp = npcPos("curandeira"),
    hpos = () => [hp[0], hp[1] + 1];
  if (player.injured)
    return {
      id: "u1",
      t: "Vá ao hospital da vila",
      d: "Você está ferido: HP máximo pela metade e magia mais fraca. A Curandeira Maíra trata você (hospital de telhado branco).",
      zone: "vila",
      pos: hpos,
    };
  if (player.hp < maxHp() * 0.3 && itemCount("pocao") + itemCount("pocaoG") === 0)
    return {
      id: "u2",
      t: "Procure ajuda: HP baixo e sem poções",
      d: "Volte à vila: a Curandeira Maíra cura você, ou compre poções com o Bruno no mercado.",
      zone: "vila",
      pos: hpos,
    };
  if (player.water < 12)
    return {
      id: "u3",
      t: "Beba água!",
      d: "Use um cantil (tecla I), beba da fonte da vila ou de um rio (fique de frente para a água e aperte E).",
      zone: "vila",
      pos: () => VILLAGE_POINTS.fonte,
    };
  if (player.food < 12)
    return {
      id: "u4",
      t: "Coma alguma coisa!",
      d: "Use comida pelo inventário (tecla I) ou compre na barraca da Rosa, no mercado.",
      zone: "vila",
      pos: () => VILLAGE_POINTS.mercado,
    };
  return null;
}
function curStep() {
  return STEPS.find((q) => !q.done()) || STEPS[STEPS.length - 1];
}
function route(zone, pos) {
  if (zone === player.zone)
    return {
      x: pos[0],
      y: pos[1],
      hop: null,
    };
  if (player.zone === "casa")
    return {
      x: 6,
      y: 9,
      hop: "Cinzaluz",
    };
  if (player.zone === "interior") {
    const a = ZONES.interior.town.arrive;
    return {
      x: a[0],
      y: a[1] + 1,
      hop: "lá fora",
    };
  }
  if (ZONES[player.zone].town && player.zone !== "vila") {
    const a = ZONES[player.zone].town.arrive;
    return {
      x: a[0],
      y: a[1],
      hop: "Cinzaluz (carruagem)",
    };
  }
  if (player.zone === "vila") {
    const o = ZONES.vila.open[SIDE_OF[zone]];
    return {
      x: o[0],
      y: o[1],
      hop: ZONES[zone].nome,
    };
  }
  const z = ZONES[player.zone];
  const o = z.open[z.side];
  return {
    x: o[0],
    y: o[1],
    hop: "Vila de Cinzaluz",
  };
}
function questTarget() {
  if (game.raid && player.zone === "vila") {
    let b = null,
      bd = 1e9;
    for (const m of game.mobs)
      if (m.raid) {
        const d = Math.abs(m.x - player.x) + Math.abs(m.y - player.y);
        if (d < bd) {
          bd = d;
          b = m;
        }
      }
    if (b)
      return {
        x: b.x,
        y: b.y,
        hop: null,
      };
  }
  const q = urgent() || curStep();
  return route(q.zone, q.pos());
}
function exitWord(zone) {
  return {
    w: "oeste (esquerda)",
    e: "leste (direita)",
    n: "norte (cima)",
    s: "sul (baixo)",
  }[zone];
}
function questHint(q, r) {
  if (!r.hop) return q.d;
  if (ZONES[player.zone].town && player.zone !== "vila")
    return "Pegue a carruagem no estábulo para voltar a Cinzaluz.";
  if (player.zone === "vila")
    return (
      `Saia da vila pelo ${exitWord(SIDE_OF[q.zone])} até ${r.hop}.` +
      (q.zone === "torre" && player.runes.length < 4 ? " (precisa das 4 runas)" : "")
    );
  return "Volte para a Vila de Cinzaluz pela saída por onde você entrou.";
}
function openQuests() {
  game.mode = "quests";
  const q = curStep();
  const ci = STEPS.indexOf(q);
  const totalC = Object.values(ZONES).reduce((a, z) => a + z.feats.filter((f) => f[2] === "C").length, 0);
  let h = `<div class="gh"><h2>Missões</h2><button id="qclose">Fechar (Q)</button></div>${player.finished ? '<div class="qs cur"> <b>História concluída!</b> A Canção Arcana voltou. Continue com as missões secundárias.</div>' + sideHTML() : ""}<h3>História principal</h3>`;
  STEPS.forEach((s, i) => {
    if (i < ci) h += `<div class="qs done">✓ ${s.t}</div>`;
    else if (i === ci)
      h += `<div class="qs cur">▶ <b>${s.t}</b><div class="qd">${s.d}${s.lvl ? ` Nível sugerido: ${s.lvl}.` : ""}</div>${route(s.zone, s.pos()).hop ? `<div class="qd" style="color:var(--gold)">Agora: ${questHint(s, route(s.zone, s.pos()))}</div>` : ""}</div>`;
    else h += `<div class="qs fut">· ???</div>`;
  });
  h += `<h3>Missões opcionais</h3>
  <div class="qs ${player.pages.length === 5 ? "done" : ""}">Diário de Vesper: ${player.pages.length}/5 páginas<div class="qtip">Procure papéis brilhando em cada região. Eles contam o segredo da história.</div></div>
  <div class="qs ${player.spells.length === 14 ? "done" : ""}">Grimório completo: ${player.spells.length}/14 magias<div class="qtip">Teste combinações de duas runas na batalha. Cada combinação nova é uma magia recuperada.</div></div>
  ${urgent() ? `<div class="qs cur" style="color:#ff8a8a"> <b style="color:#ff8a8a">${urgent().t}</b><div class="qd">${urgent().d}</div></div>` : ""}
  <div class="qs">Tesouros: ${player.taken.length}/${totalC} baús abertos<div class="qtip">Baús azuis são raros e baús dourados brilhantes são LENDÁRIOS, com os itens mais fortes do jogo.</div></div>
  <div class="qs ${player.tomes.length >= 3 ? "done" : ""}">Antiga Academia Arcana: ${player.tomes.length}/3 tomos do seu elemento<div class="qtip">A entrada fica no noroeste da vila (arco roxo). Os tomos ensinam feitiços novos de ${RUNES[player.aff].nome}.</div></div>
  <div class="qs">Amizades: ${Object.keys(FRIENDS).filter((id) => friendshipLevel(id) >= 3).length} melhores amigos<div class="qtip">Converse, dê presentes e trabalhe com os moradores. Veja tudo em I → Amizades.</div></div>
  <div class="qs ${(player.ecos || []).length >= 5 ? "done" : ""}">Ecos Corrompidos libertados: ${(player.ecos || []).length}/5<div class="qtip">Monstros gigantes com aura roxa e  guardam magia presa: Lobo Alfa (Bosque), Hidra (Pântano), Roc (Picos), Quimera (Academia) e Colosso (Torre). Cada um dá um Selo da Canção com bônus permanentes.</div></div>
  <div class="qs ${player.visited.includes("porto") && player.visited.includes("serra") ? "done" : ""}">Vilas vizinhas: ${["porto", "serra"].filter((z) => player.visited.includes(z)).length}/2 visitadas<div class="qtip">Use as placas de estrada (amarelas no mapa) ou o Estábulo: a carruagem leva a Porto Brisamar (litoral) e Pedravale (serra). A primeira viagem é grátis!</div></div>
  <div class="qs">Trabalhos ativos: ${player.jobs.length}/2<div class="qtip">O quadro de trabalhos fica ao lado da fonte. Também dá para trabalhar 3 horas com Rosa, Bruno, Brann, Kael ou Tião.</div></div>
  <h3>Dicas</h3>
  <div class="qtip">· A seta dourada sempre aponta para o próximo objetivo.</div>
  <div class="qtip">· Altares (ciano no mapa) e a fonte da vila curam e salvam o jogo. Se você perder, volta para o último usado.</div>
  <div class="qtip">· Na batalha, acertar a fraqueza do inimigo dá dano quase dobrado. Fraquezas descobertas ficam marcadas.</div>
  <div class="qtip">· Defender recupera mana. Monstros deixam ouro: gaste no mercado com poções, comida e equipamentos.</div>
  <div class="qtip">· À noite (☾) os monstros ficam mais fortes, mas dão mais ouro e XP. Durma em casa para pular para a manhã.</div>
  <div class="qtip">· Fome e sede caem com o tempo. Ferimentos graves só são curados no hospital.</div>`;
  h += townQuestsHTML();
  byId("quests").innerHTML = h;
  byId("quests").style.display = "block";
  byId("quests")
    .querySelectorAll("[data-side]")
    .forEach(
      (b) =>
        (b.onclick = () => {
          const i = +b.dataset.side;
          player.sideClaim = player.sideClaim || {};
          if (player.sideClaim[i]) return;
          player.sideClaim[i] = 1;
          player.gold += SIDEQ[i].r;
          playSound(880, 0.15, "sine");
          toast(`Missão secundária concluída! +${SIDEQ[i].r} de ouro`, 3000);
          saveGame();
          openQuests();
        }),
    );
  byId("qclose").onclick = closeQuests;
  byId("quests").scrollTop = 0;
  playSound(440, 0.1, "sine");
}
function closeQuests() {
  byId("quests").style.display = "none";
  game.mode = "world";
}
function toggleQuests() {
  if (game.dialog) return;
  if (game.mode === "map") closeMap();
  if (game.mode === "grimoire") closeGrim();
  if (game.mode === "world") openQuests();
  else if (game.mode === "quests") closeQuests();
}
function checkQuest() {
  const id = curStep().id;
  if (game.lastStep && game.lastStep !== id) {
    toast("✓ Missão concluída · Próxima: " + curStep().t, 2600);
    playSound(660, 0.12, "sine");
    setTimeout(() => playSound(880, 0.2, "sine"), 120);
  }
  game.lastStep = id;
}
function drawQuestArrow(t, camX, camY, Z = 1) {
  if (player.finished && !urgent() && !(game.raid && player.zone === "vila")) return;
  const r = questTarget();
  const tx = (r.x * TILE + 16 - camX) * Z,
    ty = (r.y * TILE + 16 - camY) * Z;
  ctx.save();
  if (tx > 24 && tx < viewWidth - 24 && ty > 24 && ty < 456) {
    const b = Math.sin(t * 5) * 4;
    ctx.fillStyle = "#f2c14e";
    ctx.strokeStyle = "#3a1d5a";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(tx, ty - 16 + b);
    ctx.lineTo(tx - 7, ty - 27 + b);
    ctx.lineTo(tx + 7, ty - 27 + b);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.globalAlpha = 0.35 + 0.25 * Math.sin(t * 4);
    ctx.strokeStyle = "#f2c14e";
    ctx.beginPath();
    ctx.arc(tx, ty, 14 + Math.sin(t * 4) * 2, 0, 7);
    ctx.stroke();
  } else {
    const cx = viewWidth / 2,
      cy = 250,
      a = Math.atan2(ty - cy, tx - cx);
    const ex = Math.max(40, Math.min(viewWidth - 40, cx + Math.cos(a) * (viewWidth * 0.6))),
      ey0 = Math.max(90, Math.min(440, cy + Math.sin(a) * 400)),
      ey = ex < 180 && ey0 < 130 ? 130 : ey0;
    ctx.translate(ex, ey);
    ctx.rotate(a);
    ctx.fillStyle = "#f2c14e";
    ctx.strokeStyle = "#3a1d5a";
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.85;
    ctx.beginPath();
    ctx.moveTo(14, 0);
    ctx.lineTo(-8, -9);
    ctx.lineTo(-3, 0);
    ctx.lineTo(-8, 9);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.rotate(-a);
    ctx.font = "14px VT323, monospace";
    ctx.textAlign = "center";
    ctx.fillStyle = "#fff";
    ctx.fillText(Math.abs(r.x - player.x) + Math.abs(r.y - player.y) + " passos", 0, 30);
  }
  ctx.restore();
}

/* ===================== HUD ===================== */
let hudCache = "";
function updateHUD() {
  let chips = "";
  if (player.injured) chips += `<span class="chip" style="color:#ff6b6b">Ferido</span>`;
  if (starving()) chips += `<span class="chip" style="color:#ffb35a">Fraco de fome/sede</span>`;
  if (game.mode === "battle" && battle) {
    if (battle.shield > 0)
      chips += `<span class="chip" style="color:#e0ab62">Muralha ${battle.shield}</span>`;
    if (battle.poison > 0) chips += `<span class="chip" style="color:#c77dff">Veneno ${battle.poison}</span>`;
    if (battle.defending) chips += `<span class="chip" style="color:#9fd0ff">Defendendo</span>`;
  }
  if ((player.drunk || 0) >= 30)
    chips += `<span class="chip" style="color:#f2a8c8"> Bêbad${genderWord("o", "a", "e")}</span>`;
  if ((player.rep ?? 50) < 25) chips += `<span class="chip" style="color:#ff8a8a"> Má fama</span>`;
  if (player.blessDay === player.day && game.mode !== "battle") {
    chips += `<span class="chip" style="color:#f2c14e">Abençoado</span>`;
  }
  const s = `<div class="box hudL"><div class="hrow"><span class="lv">Nv${player.lvl}</span><div class="bar hp"><i style="width:${Math.max(0, (100 * player.hp) / maxHp())}%"></i><em>${Math.max(0, player.hp)}/${maxHp()}</em></div></div>
  <div class="hrow"><span class="gd">◆${player.gold}</span><div class="bar mp"><i style="width:${(100 * player.mp) / maxMp()}%"></i><em>${player.mp}/${maxMp()}</em></div></div>
  <div class="hrow nd"><span title="Fome"></span><div class="bar fd"><i style="width:${player.food}%"></i></div><span title="Sede"></span><div class="bar wt"><i style="width:${player.water}%"></i></div></div>
  ${chips ? `<div class="chips">${chips}</div>` : ""}</div>
  <div class="box hudR"><span class="clock">${clockStr()}${festivalToday() ? ` · <b style="color:#ff8ad0"> ${festivalToday().n.replace("Festival ", "")}</b>` : ""}</span>${ORDER.map((r) => `<span class="rune ${player.runes.includes(r) ? "on" : ""}" title="${RUNES[r].nome}">${runeSVG(r, 16)}</span>`).join("")}</div>`;
  if (s !== hudCache) {
    byId("hud").innerHTML = s;
    hudCache = s;
  }
  const tp = byId("tgtpill");
  if (game.tgt && game.mode === "world" && !game.dialog) {
    const lb = (matchMedia("(pointer:coarse)").matches ? "A" : "E") + " · " + game.tgt.l;
    if (tp.dataset.s !== lb) {
      tp.textContent = lb;
      tp.dataset.s = lb;
    }
    tp.style.display = "block";
  } else tp.style.display = "none";
  const qp = byId("qpill");
  if (game.mode === "world" && !game.dialog && game.raid) {
    const qs = ` Ataque! Onda ${game.raid.wave}/${game.raid.waves} · ${raidLeft()} inimigos · ${Math.max(0, Math.ceil(game.raid.left / 60))}h restantes`;
    if (qp.dataset.s !== qs) {
      qp.textContent = qs;
      qp.dataset.s = qs;
    }
    qp.className = "box ui urg";
    qp.style.display = "block";
  } else if (game.mode === "world" && !game.dialog && player.zone === "casa") {
    const qs = " Sua casa · R: decorar · porta embaixo para sair";
    if (qp.dataset.s !== qs) {
      qp.textContent = qs;
      qp.dataset.s = qs;
    }
    qp.className = "box ui";
    qp.style.display = "block";
  } else if (game.mode === "world" && !game.dialog && game.ep == null && player.finished && !urgent()) {
    const ns = nextSide();
    const qs = ns
      ? `★ ${ns.t} · ${Math.min(ns.p(), sideN(ns))}/${sideN(ns)}`
      : "★ Todas as missões secundárias concluídas!";
    if (qp.dataset.s !== qs) {
      qp.textContent = qs;
      qp.dataset.s = qs;
    }
    qp.className = "box ui";
    qp.style.display = "block";
  } else if (game.mode === "world" && !game.dialog && game.ep == null) {
    const u = urgent(),
      q = u || curStep(),
      r = questTarget();
    const d = Math.abs(r.x - player.x) + Math.abs(r.y - player.y);
    const qs = `${u ? "" : "▶"} ${q.t} · ${d}`;
    if (qp.dataset.s !== qs) {
      qp.textContent = qs;
      qp.dataset.s = qs;
    }
    qp.className = "box ui" + (u ? " urg" : "");
    qp.style.display = "block";
  } else qp.style.display = "none";
}
let toastTimer = null;
function toast(msg, ms = 2200) {
  const el = byId("toast");
  el.textContent = msg;
  el.style.display = "block";
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (el.style.display = "none"), ms);
}

/* ===================== GRIMÓRIO ===================== */

function spellDesc(s) {
  const p = [];
  if (s.pow) p.push(`${s.hits ? s.hits + "× " : ""}dano de ${s.el.map((e) => RUNES[e].nome).join("/")}`);
  if (s.heal) p.push("cura");
  if (s.shield) p.push("escudo por 3 turnos");
  if (s.burn) p.push("queima");
  if (s.drain) p.push("rouba vida");
  if (s.blind) p.push("cega");
  if (s.freeze) p.push("congela");
  if (s.weaken) p.push("enfraquece");
  return p.join(", ");
}
function openGrim() {
  game.mode = "grimoire";
  let h = `<div class="gh"><h2>Grimório Arcano</h2><button id="gclose">Fechar (G)</button></div>
  <p class="gsub">Magias recuperadas: ${player.spells.length} de ${Object.keys(SPELLS).length}. Páginas encontradas: ${player.pages.length} de 5.</p>
  <div class="gruns">${ORDER.map((r) => `<div class="gr ${player.runes.includes(r) ? "on" : ""}">${runeSVG(r, 26)}<span>${player.runes.includes(r) ? RUNES[r].nome : "Runa perdida"}</span></div>`).join("")}</div>
  <h3>Magias</h3><div class="glist">`;
  for (const k of Object.keys(SPELLS)) {
    const s = SPELLS[k],
      known = player.spells.includes(k);
    h += `<div class="gs ${known ? "on" : ""}"><div class="gsym">${k
      .split("+")
      .map((r) => runeSVG(r, 20))
      .join("")}</div><div>
      <b>${known ? s.nome : "???"}</b> <span class="gm">${s.mp ? spellCost(k) : 0} MP${known ? ", " + spellDesc(s) : ""}${known ? ` · Domínio ${"★".repeat(masteryLv(k))}${"☆".repeat(5 - masteryLv(k))} (${(player.mastery || {})[k] || 0} usos)` : ""}</span>
      <div class="glore">${known ? "“" + s.lore + "”" : "Combinação esquecida. Teste estas runas em batalha."}</div></div></div>`;
  }
  h += "</div><h3>Páginas perdidas</h3>";
  PAGE_ORDER.forEach((z, i) => {
    h += player.pages.includes(z)
      ? `<div class="gp"><b>Página ${i + 1}.</b> ${PAGES[z]}</div>`
      : `<div class="gp off"><b>Página ${i + 1}.</b> Ainda perdida em ${ZONES[z].nome}.</div>`;
  });
  byId("grim").innerHTML = h;
  byId("grim").style.display = "block";
  byId("gclose").onclick = closeGrim;
  byId("grim").scrollTop = 0;
  playSound(440, 0.1, "sine");
}
function closeGrim() {
  byId("grim").style.display = "none";
  game.mode = "world";
}
