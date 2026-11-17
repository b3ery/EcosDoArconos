/**
 * ECOS DO ARCANO — democracia.js
 * Depois do golpe dos Iluministas, Cinzaluz vira uma democracia:
 *  - um governo provisório chama a primeira eleição para Presidente em 3 dias;
 *  - candidatos: Luca (Frente Iluminista), Lucas Marzocca (Taverna Vermelha),
 *    alguém do Partido da Ordem e você, se registrar a candidatura;
 *  - se Luca ou Marzocca vencer, Cinzaluz segue o comunismo 100%: bandeiras
 *    vermelhas no castelo, o ouro acima de 120 vai para o Fundo do Povo,
 *    salário igual e ração de pão para todo mundo, decretos do Presidente;
 *  - a cada 15 dias há nova eleição (dá para votar o comunismo para fora).
 * Modifica (envolve) funções de outros arquivos: ilumCoupResolve, electionTick,
 * syncRulers, onNewDay, drawBuilding, campaignMenu.
 */

"use strict";

const COMMIE = ["luca", "lucas"];
const PARTY = { luca: "Frente Iluminista", lucas: "Taverna Vermelha", player: "Independente" };
const ORDEM_POOL = ["doran", "bruno", "rosa", "mercOri", "capitao"];

function isCommunist() {
  const C = player.council;
  return !!(lifeMode() && C && !C.prov && COMMIE.includes(C.chief));
}
function regimeName() {
  const C = player.council;
  if (!C) return "Monarquia";
  if (C.prov) return "Governo provisório";
  return isCommunist() ? "República Popular (comunismo)" : "República (democracia)";
}
function ordemCand() {
  return ORDEM_POOL.find((id) => NPCS[id] && !(typeof isDead === "function" && isDead(id))) || null;
}
/** Quem disputa a eleição. */
function electionCands() {
  const C = player.council;
  const pow = player.ilumPow || 30;
  const out = [];
  for (const id of COMMIE) if (NPCS[id] && !(typeof isDead === "function" && isDead(id))) out.push({ id, n: shortName(id), p: PARTY[id], w: (id === "luca" ? 30 : 24) + pow * (id === "luca" ? 0.3 : 0.2) });
  const o = ordemCand();
  if (o) out.push({ id: o, n: shortName(o), p: "Partido da Ordem", w: 36 + Math.max(0, 50 - pow) * 0.3 });
  return out;
}
function runElection() {
  const C = player.council;
  const list = electionCands();
  const me = C.cand ? myVotes() : 0;
  const tot = list.reduce((a, c) => a + c.w, 0) || 1;
  for (const c of list) c.v = Math.max(1, ((100 - me) * c.w) / tot + (Math.random() * 12 - 6));
  if (C.cand) list.push({ id: "player", n: player.name, p: PARTY.player, v: me + (Math.random() * 8 - 4) });
  const sum = list.reduce((a, c) => a + c.v, 0);
  list.forEach((c) => (c.v = Math.round((c.v / sum) * 100)));
  list.sort((a, b) => b.v - a.v);
  return list;
}

/* ----- o golpe agora leva a uma eleição ----- */
{
  const base = ilumCoupResolve;
  ilumCoupResolve = function (won, how) {
    const aw = typeof announceWorld === "function" ? announceWorld : null;
    if (aw) announceWorld = (m, ...a) => aw(String(m).replace("agora governa o Conselho do Povo!", "vem aí a democracia e a eleição para Presidente!"), ...a);
    let r;
    try {
      r = base.apply(this, arguments);
    } finally {
      if (aw) announceWorld = aw;
    }
    if (won && player.council && lifeMode()) {
      const C = player.council;
      C.prov = true;
      C.next = player.day + 3;
      syncRulers();
      vilaNews("Democracia em Cinzaluz! Daqui a 3 dias o povo vota para Presidente. Candidatos: Luca, Lucas Marzocca e o Partido da Ordem.");
      setTimeout(() => toast("Eleição para Presidente em 3 dias! Para se candidatar: Ações → Eleição.", 5200), 2500);
      saveGame();
    }
    return r;
  };
}
{
  const srBase = syncRulers;
  syncRulers = function () {
    srBase();
    const C = player.council;
    if (!C || (typeof rulesK === "function" && rulesK("aurelia"))) return;
    if (C.prov) KINGDOMS.aurelia.ruler = "Governo provisório (eleição em breve)";
    else if (player.councilChief) KINGDOMS.aurelia.ruler = `Presidente ${player.name}`;
    else KINGDOMS.aurelia.ruler = `Presidente ${shortName(C.chief)}${isCommunist() ? " · comunismo" : ""}`;
  };
}
{
  const cmBase = campaignMenu;
  campaignMenu = function () {
    const C = player.council;
    if (C && !player.councilChief) {
      const cs = electionCands()
        .map((c) => `${c.n} (${c.p}${COMMIE.includes(c.id) ? ", comunista" : ""})`)
        .join(" · ");
      toast(`${regimeName()}. Candidatos: ${cs}${C.cand ? " · você" : ""}`, 5200);
    }
    return cmBase.apply(this, arguments);
  };
}

/* ----- a apuração ----- */
electionTick = function () {
  if (!game.electionNow || game.mode !== "world" || game.dialog || game.dying) return;
  game.electionNow = false;
  const C = player.council;
  if (!C) return;
  const wasComm = isCommunist();
  const res = runElection();
  const win = res[0];
  const myV = (res.find((c) => c.id === "player") || {}).v || 0;
  C.next = player.day + YEAR_DAYS;
  C.camp = {};
  C.cand = false;
  C.prov = false;
  const wasChief = player.councilChief;
  player.councilChief = win.id === "player";
  C.chief = win.id;
  const comm = isCommunist();
  syncRulers();
  const board = res.map((c) => `${c.n}: ${c.v}%`).join(" · ");
  vilaNews(`Eleição para Presidente: ${win.id === "player" ? player.name : win.n} venceu com ${win.v}%! (${board})`);
  const lines = [["", `Apuração na praça... ${board}.`]];
  if (win.id === "player") {
    lines.push(["", `Você venceu! ${genderWord("Presidente", "Presidenta", "Presidente")} ${player.name}: salário de 40 ouro por dia. Com reputação 70+, pode convocar um plebiscito para a monarquia.`]);
    if (COMMIE.some((id) => NPCS[id])) lines.push(["Luca", "O povo escolheu. Mas eu vou fiscalizar cada moeda, viu?"]);
  } else if (comm) {
    lines.push(
      [win.n, win.id === "luca" ? "CAMARADAS! A partir de hoje, tudo é de todos! Nada de rei, nada de nobre, nada de rico!" : "O POVO VENCEU! E a primeira coisa: cerveja grátis... quer dizer, cerveja DO POVO!"],
      ["", "Bandeiras vermelhas sobem nas torres do castelo. Começa o comunismo em Cinzaluz."],
      ["", "Decretos: o ouro acima de 120 vai para o Fundo do Povo · todo mundo ganha o mesmo salário (15/dia) · ração de pão todo dia · títulos de nobreza abolidos."],
    );
    if (!wasComm) player.commSince = player.day;
  } else {
    lines.push([win.n, "Ordem, trabalho e pão na mesa. Cinzaluz continua livre!"]);
    if (wasComm) lines.push(["", "As bandeiras vermelhas descem do castelo. O comunismo acabou."]);
  }
  if (myV && win.id !== "player") lines.push(["", `Você teve ${myV}% dos votos.`]);
  if (wasChief && win.id !== "player") lines.push(["", "Você deixa o cargo de Presidente."]);
  say(lines);
  saveGame();
};

/* ----- o dia a dia no comunismo ----- */
const DECRETOS = [
  "Decreto do Presidente: a padaria agora é a Padaria do Povo. Pão para todos!",
  "Decreto: o castelo virou Casa do Povo. Qualquer um pode visitar o salão do trono.",
  "Decreto: proibido usar coroa em público. Chapéu de camponês é o novo chique.",
  "Decreto: toda sexta tem assembleia na praça. Presença obrigatória (mas tem bolo).",
  "Decreto: as joias da antiga coroa foram derretidas e viraram panelas para o povo.",
  "Decreto: todo mundo se chama de 'camarada' a partir de hoje.",
  "Decreto: a taverna fecha mais cedo... não, mentira, o Marzoca vetou.",
  "Decreto: as terras dos nobres viraram hortas comunitárias.",
];
{
  const dayBase = onNewDay;
  onNewDay = function () {
    const r = dayBase.apply(this, arguments);
    if (!isCommunist() || player.councilChief) return r;
    const out = [];
    if (player.gold > 120) {
      const take = Math.floor((player.gold - 120) * 0.6);
      if (take > 0) {
        player.gold -= take;
        player.fundoPovo = (player.fundoPovo || 0) + take;
        out.push(`${take} de ouro foram para o Fundo do Povo`);
      }
    }
    player.gold += 15;
    out.push("+15 de salário do povo");
    if (typeof addItem === "function" && ITEMS.pao) addItem("pao", 1), out.push("+1 pão de ração");
    if (Math.random() < 0.6) vilaNews(pk(DECRETOS));
    setTimeout(() => toast(`Comunismo em Cinzaluz: ${out.join(" · ")}.`, 4600), 5200);
    return r;
  };
}

/* ----- bandeiras vermelhas no castelo ----- */
function commStar(x, y, r) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5,
      rr = i % 2 ? r * 0.45 : r;
    ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  ctx.closePath();
  ctx.fill();
}
{
  const dbBase = drawBuilding;
  drawBuilding = function (b, t) {
    const r = dbBase.apply(this, arguments);
    if (!b || b.style !== "castle" || b.id !== "castle" || player.zone !== "vila" || !isCommunist()) return r;
    const X = b.x * TILE,
      Y = b.y * TILE,
      W = b.w * TILE;
    const flag = (px, py, len, h) => {
      const fw = Math.sin(t * 4 + px) * 3;
      ctx.fillStyle = "#5a3a22";
      ctx.fillRect(px - 1, py, 3, h + 30);
      ctx.fillStyle = "#c8141e";
      fillPolygon(px + 2, py, px + len, py + 2 + fw, px + len, py + h + fw, px + 2, py + h);
      ctx.fillStyle = "#ffd23a";
      commStar(px + 12, py + h / 2 + fw / 2, 5);
    };
    // bandeiras nas duas torres e no topo
    for (const tx of [X, X + W - 48]) flag(tx + 24, Y - 100, 30, 18);
    flag(X + W / 2, Y - 116, 38, 22);
    // estandartes compridos pendurados no muro e na torre do meio
    for (const bx of [X + 64, X + W - 80, X + W / 2 - 46, X + W / 2 + 30]) {
      const top = bx === X + 64 || bx === X + W - 80 ? Y + 28 : Y - 22;
      ctx.fillStyle = "#c8141e";
      ctx.fillRect(bx, top, 16, 48);
      fillPolygon(bx, top + 48, bx + 8, top + 40, bx + 16, top + 48);
      ctx.fillStyle = "#8a0a12";
      ctx.fillRect(bx, top, 16, 3);
      ctx.fillStyle = "#ffd23a";
      commStar(bx + 8, top + 16, 5);
    }
    // dois estandartes grandes dos lados do portão
    const Hh = b.h * TILE,
      gx = X + (b.door[0] - b.x) * TILE;
    for (const bx of [gx - 70, gx + 94]) {
      const top = Y + Hh - 190;
      ctx.fillStyle = "#c8141e";
      ctx.fillRect(bx, top, 40, 110);
      fillPolygon(bx, top + 110, bx + 20, top + 92, bx + 40, top + 110);
      ctx.fillStyle = "#8a0a12";
      ctx.fillRect(bx - 4, top - 4, 48, 6);
      ctx.fillStyle = "#ffd23a";
      commStar(bx + 20, top + 34, 12);
      ctx.fillRect(bx + 8, top + 60, 24, 3);
      ctx.fillRect(bx + 8, top + 68, 24, 3);
    }
    return r;
  };
}
