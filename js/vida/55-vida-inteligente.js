/**
 * ECOS DO ARCANO — 55-vida-inteligente.js
 *  - O ano dura 15 dias: o aniversário é a cada 15 dias, com festa.
 *  - Cena da morte do personagem: o corpo cai, a alma sobe e há um velório
 *    no cemitério com lápide, epitáfio e quem você amou.
 *  - Moradores com cérebro: cada par tem uma relação que muda a cada conversa
 *    (pelo jeito de cada um). Eles fazem amizade e inimizade, flertam, namoram,
 *    noivam, casam, traem, se separam, têm filhos e saem na porrada na rua.
 *    Você pode separar a briga, torcer, apostar ou entrar nela.
 */

"use strict";

/* ===================== O ANO DE 15 DIAS ===================== */

const YEAR_DAYS = 15;
/** Migra o jogo salvo (antes cada dia era um ano). */
function yearMigrate() {
  if (!player || player.yr15) return;
  player.yr15 = true;
  player.bdayDay = player.day;
  for (const k of player.kids || []) {
    k.ageBase = Math.max(0, player.day - k.born);
    k.born2 = player.day;
  }
}
kidAge = function (k) {
  if (k.born2 === undefined) return Math.floor((player.day - k.born) / YEAR_DAYS);
  return (k.ageBase || 0) + Math.floor((player.day - k.born2) / YEAR_DAYS);
};
function daysToBirthday() {
  const d = (player.day - (player.bdayDay ?? 1)) % YEAR_DAYS;
  return d === 0 ? 0 : YEAR_DAYS - d;
}
{
  const ageBase = ageTick;
  ageTick = function () {
    yearMigrate();
    const left = daysToBirthday();
    if (left === 2) setTimeout(() => toast("Seu aniversário é daqui a 2 dias!", 3200), 2000);
    if (left !== 0 || player.day === player.bdayDay) return;
    const toastBase = toast;
    // O aniversário base mostra um aviso curto; aqui tem festa.
    toast = () => {};
    try {
      ageBase();
    } finally {
      setTimeout(() => (toast = toastBase), 1900);
    }
    setTimeout(birthdayParty, 2600);
  };
}
function bestFriends(n = 3) {
  return Object.keys(player.rel || {})
    .filter((id) => NPCS[id] && !(typeof isDead === "function" && isDead(id)) && friendship(id) >= 20)
    .sort((a, b) => friendship(b) - friendship(a))
    .slice(0, n);
}
function birthdayParty() {
  if (game.mode !== "world" || game.dialog) return setTimeout(birthdayParty, 1500);
  const a = playerAge(),
    me = player.name;
  const fr = bestFriends(3);
  const gift = 10 + fr.length * 12;
  player.gold += gift;
  if (typeof addNeed === "function") addNeed("fun", 35);
  const lines = [["", `Hoje é seu aniversário! ${me} faz ${a} anos.`]];
  if (player.spouse && NPCS[player.spouse]) lines.push([NPCS[player.spouse].nome, pk([`Feliz aniversário, amor! ${a} anos e cada vez mais lind${genderWord("o", "a", "e")}.`, "Acordei cedo pra fazer seu bolo. Não olha a cozinha!", `Mais um ano do seu lado. Parabéns, ${me}!`])]);
  for (const id of fr) lines.push([shortName(id), pk([`Parabéns, ${me}! Trouxe um presentinho.`, `${a} anos?! Tá conservad${genderWord("o", "a", "e")}, hein!`, "Bolo, música e hidromel! Hoje é festa!", "Feliz aniversário! Que as runas te protejam mais um ano.", `Faz um pedido, ${me}! ...Não conta, senão não vale.`])]);
  if (!fr.length && !player.spouse) lines.push(["", "Ninguém lembrou... mas o padeiro te deu um pão de mel de graça. Já é alguma coisa."]);
  if ((player.kids || []).length) lines.push([player.kids[0].name, "Parabéns! Eu fiz um desenho de você. É você mesmo, juro."]);
  lines.push(["", `Você ganhou ${gift} de ouro em presentes. Próximo aniversário: daqui a ${YEAR_DAYS} dias.`]);
  vilaNews(`${me} fez ${a} anos e teve festa na vila!`);
  playSound(660, 0.15, "triangle");
  say(lines);
}
/* Aniversários da turma cabem no ano de 15 dias. */
Object.assign(CREW_BDAY, { lucas: 3, matheus: 5, marcos: 7, andressa: 9, mylena: 11, juliaO: 13 });
yearDay = function () {
  return ((player.day - 1) % YEAR_DAYS) + 1;
};
/* Os filhos só anunciam a nova fase uma vez (agora cada idade dura 15 dias). */
growKids = function () {
  for (const k of player.kids || []) {
    const age = kidAge(k),
      novo = k.seenAge !== age;
    k.seenAge = age;
    if (novo && age === 10) setTimeout(() => toast(`${k.name} virou adolescente! Prepare-se para as portas batendo.`, 4000), 2600);
    if (novo && age === 16) setTimeout(() => toast(`${k.name} chegou à vida adulta! Agora pode namorar e casar.`, 4000), 2600);
    if (novo && age > 0 && age !== 10 && age !== 16) setTimeout(() => toast(`${k.name} fez ${age} anos!`, 3000), 3400);
    if (age < 16) continue;
    if (!k.spouse && !k.partner && Math.random() < 0.2) {
      k.partner = pickOne(SUITOR_NAMES);
      k.partnerDay = player.day;
      setTimeout(() => toast(`Fofoca: ${k.name} está namorando ${k.partner}!`, 4000), 3200);
    } else if (!k.spouse && k.partner && player.day - k.partnerDay >= 3 && Math.random() < 0.3) marryKid(k, k.partner, 0, false);
    if (k.spouse && player.day - (k.married || 0) >= 4 && Math.random() < 0.18 && (k.grandkids || 0) < 4) {
      k.grandkids = (k.grandkids || 0) + 1;
      const gb = Math.random() < 0.5;
      setTimeout(() => toast(`Parabéns! ${k.name} teve ${gb ? "um menino" : "uma menina"}! Você virou ${genderWord("avô", "avó", "avô/avó")} (${k.grandkids} neto(s)).`, 4500), 3800);
    }
  }
};

/* ===================== A CENA DA MORTE ===================== */

function epitaph() {
  const g = (m, f) => genderWord(m, f, m);
  const l = [];
  if (player.ruler || player.spouse === "rainha") l.push(`Governou Cinzaluz com mão ${pk(["firme", "de ferro", "generosa"])}.`);
  if (player.spouse && NPCS[player.spouse]) l.push(`Amad${g("o", "a")} espos${g("o", "a")} de ${shortName(player.spouse)}.`);
  if ((player.kids || []).length) l.push(`Deixou ${player.kids.length} filho${player.kids.length > 1 ? "s" : ""} e muita saudade.`);
  if ((player.murders || 0) > 0) l.push("Que as runas tenham piedade.");
  if (player.gold > 1500) l.push("Morreu rico. Os herdeiros agradecem.");
  if ((player.brawlWins || 0) >= 3) l.push("Nunca fugiu de uma briga.");
  if (!l.length) l.push(pk(["Viveu do seu jeito.", "Foi gente boa. Quase sempre.", "Partiu cedo demais. Ou tarde. Ninguém sabe.", "Aqui descansa quem amou Cinzaluz."]));
  return l.slice(0, 2).join(" ");
}
function mournersList() {
  const out = [];
  if (player.spouse && NPCS[player.spouse]) out.push({ npc: NPCS[player.spouse], n: shortName(player.spouse) });
  for (const k of (player.kids || []).slice(0, 3)) if (k.look) out.push({ hero: k.look, n: k.name });
  for (const id of bestFriends(5)) if (out.length < 6 && id !== player.spouse) out.push({ npc: NPCS[id], n: shortName(id) });
  if (!out.length) out.push({ npc: { robe: "#2a2230", hat: null, hair: "#cfc6b8" }, n: "Padre Anselmo" });
  return out;
}
/** Toca a cena e depois chama next(). */
function deathScene(cause, next) {
  if (game.deathScene) return;
  game.deathScene = {
    t0: game.t,
    cause,
    name: player.name,
    age: playerAge(),
    born: START_AGE,
    look: JSON.parse(JSON.stringify(player.look)),
    epi: epitaph(),
    mourn: mournersList(),
    prevMode: game.mode,
    next,
  };
  game.dialog = null;
  byId("dialog").style.display = "none";
  byId("choice").style.display = "none";
  if (typeof hidePie === "function") hidePie();
  game.mode = "cutscene";
  document.body.classList.add("cutscene");
  playSound(70, 1.4, "sine");
  setTimeout(() => playSound(55, 1.6, "sine"), 900);
}
function endDeathScene() {
  const d = game.deathScene;
  if (!d || game.t - d.t0 < 6.5) return;
  game.deathScene = null;
  document.body.classList.remove("cutscene");
  game.mode = "world";
  game.fade = 1;
  d.next && d.next();
}
addEventListener("keydown", (e) => {
  if (!game.deathScene) return;
  e.stopImmediatePropagation();
  e.preventDefault();
  if (e.key === "Enter" || e.key === " " || e.key === "e" || e.key === "E" || e.key === "Escape") endDeathScene();
}, true);
addEventListener("pointerdown", (e) => {
  if (!game.deathScene) return;
  e.stopImmediatePropagation();
  e.preventDefault();
  endDeathScene();
}, true);
function drawDeathScene() {
  const d = game.deathScene;
  if (!d) return;
  const W = viewWidth,
    H = 480,
    t = game.t - d.t0;
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  const sc = ctx.canvas.width / W;
  ctx.scale(sc, ctx.canvas.height / H);
  ctx.imageSmoothingEnabled = false;
  if (t < 6) {
    // 1) O corpo cai e a alma sobe.
    ctx.fillStyle = `rgba(20,0,6,${Math.min(0.92, t / 1.6)})`;
    ctx.fillRect(0, 0, W, H);
    const cx = W / 2,
      cy = H / 2 + 40;
    ctx.fillStyle = `rgba(150,10,20,${Math.min(0.75, t / 3)})`;
    ctx.beginPath();
    ctx.ellipse(cx + 4, cy + 8, 26 + Math.min(20, t * 8), 9 + Math.min(6, t * 2), 0, 0, 7);
    ctx.fill();
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(Math.min(1, t / 0.8) * (Math.PI / 2));
    drawSprite(heroRects(d.look, "down", null), -48, -48, 3, false);
    ctx.restore();
    if (t > 2.2) {
      const k = Math.min(1, (t - 2.2) / 3.6);
      ctx.globalAlpha = 0.55 * (1 - k * 0.5);
      ctx.save();
      ctx.translate(cx + Math.sin(t * 3) * 10, cy - 30 - k * 170);
      const ghost = heroRects(d.look, "down", null).map(([x, y, w, h]) => [x, y, w, h, "#eaf4ff"]);
      drawSprite(ghost, -48, -48, 3, false);
      ctx.restore();
      ctx.globalAlpha = 1;
    }
    ctx.textAlign = "center";
    ctx.font = '700 24px "Pixelify Sans", sans-serif';
    ctx.fillStyle = `rgba(255,220,220,${Math.min(1, t / 1.5)})`;
    ctx.fillText(d.cause, W / 2, 80);
    ctx.font = '600 18px "Pixelify Sans", sans-serif';
    ctx.fillStyle = `rgba(255,255,255,${Math.min(1, Math.max(0, t - 1.5))})`;
    ctx.fillText(`${d.name} · ${d.age} anos`, W / 2, 110);
  } else {
    // 2) O velório no cemitério, à noite.
    const k = Math.min(1, (t - 6) / 1.2);
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, "#0b0a1e");
    sky.addColorStop(0.6, "#2a2346");
    sky.addColorStop(1, "#1a1626");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 40; i++) {
      ctx.fillStyle = `rgba(255,255,255,${0.3 + 0.5 * Math.abs(Math.sin(i * 7.3 + t))})`;
      ctx.fillRect((i * 97) % W, (i * 53) % 200, 2, 2);
    }
    ctx.fillStyle = "#f4ecc8";
    ctx.beginPath();
    ctx.arc(W - 110, 80, 30, 0, 7);
    ctx.fill();
    ctx.fillStyle = "#2a2346";
    ctx.beginPath();
    ctx.arc(W - 98, 72, 26, 0, 7);
    ctx.fill();
    ctx.fillStyle = "#1e3324";
    ctx.beginPath();
    ctx.ellipse(W / 2, H + 60, W * 0.8, 210, 0, 0, 7);
    ctx.fill();
    // Outras lápides ao fundo.
    ctx.fillStyle = "#3d3a48";
    for (const x of [80, 170, W - 190, W - 80]) {
      ctx.fillRect(x - 12, 262, 24, 34);
      ctx.beginPath();
      ctx.arc(x, 262, 12, Math.PI, 0);
      ctx.fill();
    }
    // A lápide.
    const gx = W / 2,
      gy = 230;
    ctx.fillStyle = "#8a8698";
    ctx.fillRect(gx - 80, gy, 160, 130);
    ctx.beginPath();
    ctx.arc(gx, gy, 80, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = "#6d6a7c";
    ctx.fillRect(gx - 80, gy + 120, 160, 10);
    ctx.fillStyle = "#4a3a2a";
    ctx.fillRect(gx - 90, gy + 128, 180, 14);
    ctx.textAlign = "center";
    ctx.fillStyle = "#24202e";
    ctx.font = '700 15px "Pixelify Sans", sans-serif';
    ctx.fillText("AQUI JAZ", gx, gy - 38);
    ctx.font = '700 19px "Pixelify Sans", sans-serif';
    ctx.fillText(d.name.slice(0, 16), gx, gy - 12);
    ctx.font = '600 14px "Pixelify Sans", sans-serif';
    ctx.fillText(`${d.born} – ${d.age} anos`, gx, gy + 10);
    ctx.font = '500 11px "Pixelify Sans", sans-serif';
    const words = d.epi.split(" ");
    let line = "",
      ly = gy + 34;
    for (const w of words) {
      if ((line + " " + w).length > 24) {
        ctx.fillText(line, gx, ly);
        ly += 14;
        line = w;
      } else line = line ? line + " " + w : w;
    }
    if (line) ctx.fillText(line, gx, ly);
    // Velas e flores.
    for (const [x, c] of [
      [gx - 70, "#ff6a8a"],
      [gx - 50, "#ffd86a"],
      [gx + 50, "#b48aff"],
      [gx + 70, "#ff6a8a"],
    ]) {
      ctx.fillStyle = "#2e6a34";
      ctx.fillRect(x, gy + 118, 2, 10);
      ctx.fillStyle = c;
      ctx.fillRect(x - 3, gy + 114, 8, 6);
    }
    for (const x of [gx - 100, gx + 96]) {
      ctx.fillStyle = "#efe6cf";
      ctx.fillRect(x, gy + 104, 6, 22);
      ctx.fillStyle = `rgba(255,200,90,${0.7 + 0.3 * Math.sin(t * 9 + x)})`;
      ctx.fillRect(x + 1, gy + 96 + Math.sin(t * 12 + x), 4, 7);
    }
    // Quem veio se despedir.
    const n = d.mourn.length;
    d.mourn.forEach((m, i) => {
      const side = i % 2 ? 1 : -1,
        idx = Math.floor(i / 2);
      const x = gx + side * (130 + idx * 60) - 24,
        y = 316 + idx * 6;
      ctx.fillStyle = "rgba(0,0,0,.3)";
      ctx.beginPath();
      ctx.ellipse(x + 24, y + 46, 14, 4, 0, 0, 7);
      ctx.fill();
      const rects = m.hero ? heroRects(m.hero, "down", null) : wizardRects(m.npc.robe, m.npc.hat || null, m.npc.hair, null, side < 0 ? "right" : "left", 0);
      drawSprite(rects, x, y + Math.sin(t * 2 + i) * 1.2, 3, side > 0);
      ctx.fillStyle = "rgba(140,200,255,.9)";
      if (Math.sin(t * 3 + i) > 0.2) ctx.fillRect(x + 20, y + 22 + ((t * 30 + i * 9) % 14), 2, 3);
      ctx.font = '600 11px "Pixelify Sans", sans-serif';
      ctx.fillStyle = "#e8e0ff";
      ctx.fillText(m.n, x + 24, y + 62);
    });
    void n;
    // Pétalas caindo.
    for (let i = 0; i < 18; i++) {
      const px = (i * 131 + t * 30) % W,
        py = (i * 67 + t * 45) % H;
      ctx.fillStyle = i % 2 ? "#ff9ab8" : "#fff0f4";
      ctx.fillRect(px, py, 3, 2);
    }
    ctx.fillStyle = "#fff";
    ctx.font = '700 20px "Pixelify Sans", sans-serif';
    ctx.fillText(d.cause, W / 2, 44);
    if (t > 6.5) {
      ctx.font = '600 14px "Pixelify Sans", sans-serif';
      ctx.fillStyle = `rgba(255,255,255,${0.5 + 0.5 * Math.sin(t * 4)})`;
      ctx.fillText(matchMedia("(pointer: coarse)").matches ? "Toque para continuar" : "Enter para continuar", W / 2, H - 18);
    }
    ctx.fillStyle = `rgba(0,0,0,${1 - k})`;
    ctx.fillRect(0, 0, W, H);
  }
  ctx.restore();
}
{
  const drawBase = draw;
  draw = function () {
    drawBase();
    drawDeathScene();
  };
  const endsBase = lifeEnds;
  lifeEnds = function () {
    if (game.deathShown) return endsBase.apply(this, arguments);
    if (game.mode !== "world" || game.dialog) return setTimeout(lifeEnds, 2000);
    game.deathShown = true;
    deathScene(pk(["O coração parou de bater...", "Chegou a hora.", "A vida apagou devagar, como uma vela."]), () => endsBase());
  };
  const exeBase = execution;
  execution = function (id) {
    if (!lifeMode()) return exeBase(id);
    exeBase(id);
    // A cena roda logo depois da fala do carrasco.
    const d = game.dialog;
    if (d && d.lines.length > 3) {
      const cb = d.cb;
      const rest = d.lines.splice(3);
      d.cb = () => deathScene("Executad" + genderWord("o", "a", "e") + " na forca", () => say(rest, cb));
    }
  };
  const heirBase = continueAsHeir;
  continueAsHeir = function (k, tax) {
    game.deathShown = false;
    const r = heirBase(k, tax);
    player.bdayDay = player.day;
    return r;
  };
}

/* ===================== O CÉREBRO SOCIAL DOS MORADORES ===================== */

function soc() {
  player.soc = player.soc || { rel: {}, dating: {}, mar: {}, div: {}, since: {}, wed: [], babies: 0 };
  return player.soc;
}
const npcPair = (a, b) => (a < b ? a + "|" + b : b + "|" + a);
const NEVER_SPLIT = new Set(["mylena|pedro"]);
const TRAIT_CLASH = [
  ["calmo", "esquentado"],
  ["timido", "fofoqueiro"],
  ["generoso", "avarento"],
  ["intelectual", "preguicoso"],
  ["leal", "galanteador"],
  ["calmo", "dramatico"],
];
function compat(a, b) {
  let c = 0;
  const ta = npcTraits(a),
    tb = npcTraits(b);
  for (const t of ta) if (tb.includes(t)) c += 12;
  for (const [x, y] of TRAIT_CLASH) if ((ta.includes(x) && tb.includes(y)) || (ta.includes(y) && tb.includes(x))) c -= 15;
  if (ta.includes("extro") || tb.includes("extro")) c += 4;
  return c + (hashStr(npcPair(a, b)) % 21) - 10;
}
function relOf(a, b) {
  const S = soc(),
    k = npcPair(a, b);
  if (S.rel[k] === undefined) {
    let r = compat(a, b) + 10;
    if (npcSpouse(a) === b) r += 55;
    if ((a === "lucas" && hatesMarzoca(b)) || (b === "lucas" && hatesMarzoca(a))) r -= 45;
    S.rel[k] = Math.max(-80, Math.min(90, r));
  }
  return S.rel[k];
}
function relAdd(a, b, v) {
  const S = soc(),
    k = npcPair(a, b);
  S.rel[k] = Math.max(-100, Math.min(100, relOf(a, b) + v));
  return S.rel[k];
}
const named = (id) => !!id && !!NPCS[id] && !id.startsWith("w") && !(typeof isDead === "function" && isDead(id));
function npcPartner(id) {
  const S = soc();
  return S.dating[id] || null;
}
function mutualAttraction(a, b) {
  return likesGender(npcOrient(a), npcGender(a), npcGender(b), a + b) && likesGender(npcOrient(b), npcGender(b), npcGender(a), b + a);
}
function singleNpc(id) {
  return named(id) && !npcSpouse(id) && !npcPartner(id) && player.spouse !== id && player.dating !== id && !(player.lovers || []).includes(id) && !isChildNpc(id) && id !== "rainha";
}
/* Casamentos e divórcios dinâmicos valem para o resto do jogo (ciúme, conversas...). */
{
  const spBase = npcSpouse;
  npcSpouse = function (id) {
    if (!id || player.spouse === id || player.dating === id) return null;
    const S = player.soc;
    if (S && S.mar[id] && !(typeof isDead === "function" && isDead(S.mar[id]))) return S.mar[id];
    const r = spBase(id);
    if (r && S && S.div[npcPair(id, r)]) return null;
    return r;
  };
}
const ASK_OUT = [
  ["Sabe... eu gosto de conversar com você. Quer sair comigo?", "...Achei que você nunca ia perguntar!"],
  ["Toma, colhi essa flor pensando em você.", "Ai, que coisa mais linda. Sim, eu aceito namorar!"],
  ["Vamos ver as estrelas hoje à noite? Só nós dois?", "Vamos. E pode segurar minha mão."],
  ["Eu ensaiei isso a semana toda: quer namorar comigo?", "Quero! Mas não precisava ter ensaiado."],
];
const INSULTS = [
  ["Olha só quem apareceu. A pessoa mais insuportável de Cinzaluz.", "Melhor insuportável do que falso, igual você!"],
  ["Você falou mal de mim pra vila inteira, né?", "Falei a VERDADE. Doeu?"],
  ["Sai da minha frente.", "Sai você! A rua é minha também!"],
  ["Ainda não esqueci o que você fez.", "E eu não me arrependo de nada!"],
  ["Você me deve dinheiro desde o último festival!", "Devo nada! Você que é muquirana!"],
];
const FIGHT_YELLS = ["TOMA!", "Vem que tem!", "Segura ele!", "Ai, meu nariz!", "Me larga!", "Isso é por ontem!", "Covarde!", "Pode vir!"];
const CROWD_FIGHT = ["Briga! Briga! Briga!", "Separa! Separa!", "Chama o guarda!", "Aposto no menor!", "De novo esses dois?", "Vai, bate nele!", "Que vergonha!"];
const WED_LINES = [
  "Prometo te amar na colheita e no inverno.",
  "Prometo dividir o último pão de mel.",
  "Prometo nunca roncar... muito.",
  "Você é a melhor coisa que me aconteceu em Cinzaluz.",
];

/** Depois de cada conversa entre dois moradores com nome, a relação muda. */
function afterChat(a, b, hostile) {
  if (!named(a) || !named(b)) return;
  const S = soc();
  let d = compat(a, b) / 8 + (Math.random() * 9 - 3);
  if (hostile) d = -6 - Math.random() * 8;
  if (npcSpouse(a) === b) d += 2;
  if ((hasTrait(a, "esquentado") || hasTrait(b, "esquentado")) && relOf(a, b) < 0) d -= 3;
  const r = relAdd(a, b, d);
  // Começa um namoro.
  if (!hostile && r >= 45 && singleNpc(a) && singleNpc(b) && mutualAttraction(a, b) && Math.random() < 0.3) {
    S.dating[a] = b;
    S.dating[b] = a;
    S.since[npcPair(a, b)] = player.day;
    const ref = convRef(a);
    if (ref) game.bubbles.push({ x: ref.x, y: ref.y, icon: "heart", t: 3 });
    vilaNews(`${shortName(a)} e ${shortName(b)} estão namorando! A vila só fala nisso.`);
    if (ref && nearPlayer(ref, 14)) toast(`Fofoca fresquinha: ${shortName(a)} e ${shortName(b)} começaram a namorar!`, 3600);
    return;
  }
  // Pulando a cerca: alguém comprometido flerta com outra pessoa... e o par vê.
  const com = npcSpouse(a) || npcPartner(a);
  if (!hostile && com && com !== b && r >= 55 && mutualAttraction(a, b) && hasTrait(a, "galanteador") + (Math.random() < 0.12) > 0 && Math.random() < 0.35) {
    relAdd(com, a, -25);
    relAdd(com, b, -40);
    const rc = convRef(com),
      rb = convRef(b);
    vilaNews(`${shortName(a)} foi vist${gw(a, "o", "a")} de gracinha com ${shortName(b)}. ${shortName(com)} já sabe...`);
    if (rc && rb && dist1(rc, rb) <= 8) setTimeout(() => startNpcFight(com, b, "ciúme"), 1200);
    else if (relOf(com, a) < -20) breakUp(com, a, "traição");
  }
}
function convRef(id) {
  if (game.crewA && game.crewA[id] && crewVisible(game.crewA[id])) return game.crewA[id];
  return (game.roam || []).find((r) => r.id === id) || null;
}
function breakUp(a, b, why) {
  const S = soc(),
    k = npcPair(a, b);
  if (NEVER_SPLIT.has(k)) return;
  if (S.dating[a] === b) {
    delete S.dating[a];
    delete S.dating[b];
    vilaNews(`Acabou! ${shortName(a)} e ${shortName(b)} terminaram o namoro${why ? ` (${why})` : ""}.`);
  } else if (npcSpouse(a) === b) {
    if (S.mar[a] === b) {
      delete S.mar[a];
      delete S.mar[b];
    } else S.div[k] = player.day;
    vilaNews(`Divórcio em Cinzaluz: ${shortName(a)} e ${shortName(b)} se separaram${why ? ` por causa de ${why}` : ""}.`);
  }
  relAdd(a, b, -20);
}
{
  const convBase = startConv;
  startConv = function (parts, lines, opt = {}) {
    if (parts.length === 2 && named(parts[0].id) && named(parts[1].id)) {
      const [p, q] = parts;
      const a = p.id,
        b = q.id;
      const r = relOf(a, b);
      let hostile = !!opt.loud;
      if (r < -30) {
        // Inimigos não conversam: se provocam.
        hostile = true;
        const ins = pk(INSULTS);
        lines = [
          [p.nome, ins[0]],
          [q.nome, ins[1]],
          [p.nome, pk(["Repete se tiver coragem!", "Hmpf. Você vai ver.", "Não me provoca!"])],
        ];
        opt = Object.assign({}, opt, { loud: true });
      } else if (singleNpc(a) && singleNpc(b) && r >= 45 && mutualAttraction(a, b) && Math.random() < 0.3) {
        const ask = pk(ASK_OUT);
        lines = [
          [p.nome, ask[0]],
          [q.nome, ask[1]],
        ];
      } else if (npcPartner(a) === b) {
        lines = [[p.nome, pk(["Oi, meu bem!", "Tava com saudade!", "Que bom te ver!"])], ...lines.slice(0, 3)];
      }
      const end = opt.onEnd;
      const fightRisk = hostile && r < -30 ? (hasTrait(a, "esquentado") || hasTrait(b, "esquentado") ? 0.55 : 0.22) : hostile && r < -10 ? 0.12 : 0;
      opt = Object.assign({}, opt, {
        onEnd: () => {
          end && end();
          afterChat(a, b, hostile);
          if (fightRisk && Math.random() < fightRisk) startNpcFight(a, b, a === "lucas" || b === "lucas" ? "o Marzoca" : "uma rixa antiga");
        },
      });
    }
    return convBase(parts, lines, opt);
  };
}
/* Esquentado procura o inimigo; quem namora procura o par. */
{
  const desBase = chooseDesire;
  chooseDesire = function (a) {
    const crew = game.crewA || {};
    const pt = npcPartner(a.id);
    if (pt && crew[pt] && crewVisible(crew[pt]) && !crew[pt].talking && Math.random() < 0.35) {
      const o = crew[pt];
      a.auto = { kind: "namorar", dest: freeNear("vila", o.x, o.y, 1) || [o.x, o.y + 1], with: o.id, until: player.day * 1440 + player.clock + 60 };
      game.bubbles.push({ x: a.x, y: a.y, icon: "heart", t: 2 });
      return;
    }
    if (hasTrait(a.id, "esquentado") && Math.random() < 0.2) {
      const foe = Object.values(crew).find((o) => o !== a && crewVisible(o) && !o.talking && relOf(a.id, o.id) < -40);
      if (foe) {
        a.auto = { kind: "social", dest: freeNear("vila", foe.x, foe.y, 1) || [foe.x, foe.y + 1], with: foe.id, until: player.day * 1440 + player.clock + 40 };
        game.bubbles.push({ x: a.x, y: a.y, icon: "anger", t: 2 });
        return;
      }
    }
    desBase(a);
    // Quem é tranquilo evita o desafeto.
    if (a.auto && a.auto.with && relOf(a.id, a.auto.with) < -35 && !hasTrait(a.id, "esquentado")) a.auto = null;
  };
}

/* ----- Brigas de rua entre moradores ----- */

game.npcFights = [];
function fightPower(id) {
  return (FIGHTER_STRENGTH[PERSONALITIES[id]] || 1) * (STRONG_FIGHTERS[id] || 1) * (id === "pedro" ? 2.2 : 1) * (hasTrait(id, "esquentado") ? 1.2 : 1);
}
function startNpcFight(a, b, why) {
  if (!named(a) || !named(b) || game.npcFights.some((f) => [f.a, f.b].some((x) => x === a || x === b))) return false;
  const ra = convRef(a),
    rb = convRef(b);
  if (!ra || !rb || dist1(ra, rb) > 10) return false;
  if (MAGES.has(a) || MAGES.has(b)) return false;
  // Quem está longe vem correndo pro lado do outro.
  if (dist1(ra, rb) > 1) {
    const s = freeNear(player.zone, rb.x + 1, rb.y, 1);
    if (s) [ra.x, ra.y] = s;
  }
  const f = { a, b, ra, rb, why, t: 7 + Math.random() * 4, hit: 0.3, ha: 100, hb: 100, zone: player.zone };
  for (const r of [ra, rb]) {
    r.talking = f.t + 1;
    freezeRef(r, f.t + 1);
  }
  ra.dir = dirTo(ra, rb);
  rb.dir = dirTo(rb, ra);
  game.npcFights.push(f);
  relAdd(a, b, -15);
  if (nearPlayer(ra, 16)) {
    game.shake = 0.2;
    playSound(160, 0.25, "square");
    toast(`Briga na rua! ${shortName(a)} x ${shortName(b)} (${why}). Chegue perto para interagir.`, 3800);
  }
  return true;
}
function npcFightTick(dt) {
  for (const f of game.npcFights) {
    if (f.zone !== player.zone) {
      f.done = true;
      continue;
    }
    f.t -= dt;
    f.hit -= dt;
    if (f.hit <= 0) {
      f.hit = 0.45 + Math.random() * 0.35;
      const aHits = Math.random() * (fightPower(f.a) + fightPower(f.b)) < fightPower(f.a);
      if (aHits) f.hb -= 8 + Math.random() * 10;
      else f.ha -= 8 + Math.random() * 10;
      f.pow = { x: (aHits ? f.rb : f.ra).x, y: (aHits ? f.rb : f.ra).y, t: 0.35 };
      if (nearPlayer(f.ra, 14)) {
        playSound(110 + Math.random() * 60, 0.06, "square");
        if (Math.random() < 0.35) game.shouts = (game.shouts || []).concat([{ x: (aHits ? f.ra : f.rb).x, y: (aHits ? f.ra : f.rb).y, txt: pk(FIGHT_YELLS), t: 1.4 }]);
        if (Math.random() < 0.18) {
          const by = talkers().find((p) => p.id !== f.a && p.id !== f.b && dist1(p.ref, f.ra) <= 7);
          if (by) {
            by.ref.dir = dirTo(by.ref, f.ra);
            game.shouts = game.shouts.concat([{ x: by.ref.x, y: by.ref.y, txt: pk(CROWD_FIGHT), t: 1.6 }]);
          }
        }
      }
    }
    if (f.pow) f.pow.t -= dt;
    if (f.t <= 0 || f.ha <= 0 || f.hb <= 0) endNpcFight(f);
  }
  game.npcFights = game.npcFights.filter((f) => !f.done);
}
function endNpcFight(f, how) {
  if (f.done) return;
  f.done = true;
  for (const r of [f.ra, f.rb]) r.talking = 0;
  const win = f.ha >= f.hb ? f.a : f.b,
    lose = win === f.a ? f.b : f.a;
  const lr = win === f.a ? f.rb : f.ra;
  if (how !== "separada") {
    game.bubbles.push({ x: lr.x, y: lr.y, icon: "sweat", t: 3 });
    vilaNews(`${shortName(win)} e ${shortName(lose)} saíram na porrada por causa de ${f.why}. ${shortName(win)} levou a melhor.`);
    if (f.bet) {
      const won = f.bet.on === win;
      player.gold += won ? f.bet.v * 2 : 0;
      toast(won ? `Você ganhou a aposta! +${f.bet.v * 2} de ouro.` : `Você perdeu a aposta de ${f.bet.v} de ouro.`, 3200);
    }
    if (typeof guardNear === "function" && guardNear() && Math.random() < 0.6) game.shouts = (game.shouts || []).concat([{ x: lr.x, y: lr.y, txt: "GUARDA! Acabou a palhaçada!", t: 2 }]);
  }
  // Briga de casal pode virar divórcio.
  if (npcSpouse(f.a) === f.b || npcPartner(f.a) === f.b) if (relOf(f.a, f.b) < -10 && Math.random() < 0.5) breakUp(f.a, f.b, "uma briga feia");
}
function fightAt(x, y) {
  return game.npcFights.find((f) => !f.done && [f.ra, f.rb].some((r) => Math.abs(r.x - x) <= 0.5 && Math.abs(r.y - y) <= 0.5));
}
function fightMenu(f) {
  const A = shortName(f.a),
    B = shortName(f.b);
  game.pieAnchor = { x: f.ra.x, y: f.ra.y };
  choice(`Briga: ${A} x ${B}`, `Os dois estão rolando no chão por causa de ${f.why}. O que você faz?`, [
    {
      t: "Separar a briga",
      icon: "smile",
      fn: () => {
        endNpcFight(f, "separada");
        repAdd(2);
        addFriendship(f.a, 4);
        addFriendship(f.b, 4);
        relAdd(f.a, f.b, 6);
        const hit = Math.random() < 0.3;
        if (hit) player.hp = Math.max(1, player.hp - 8);
        say([
          ["", `Você entra no meio e segura os dois.${hit ? " Leva um soco perdido no caminho! (-8 de vida)" : ""}`],
          [A, "Ele começou!"],
          [B, "Mentira! Foi ele!"],
          ["", "Pelo menos pararam. A vila te olha com respeito. Reputação +2."],
        ]);
      },
    },
    { t: `Torcer por ${A}`, icon: "party", fn: () => (addFriendship(f.a, 5), addFriendship(f.b, -8), say([["Você", `VAI, ${A.toUpperCase()}!`], [B, "Você vai me pagar por isso!"]])) },
    { t: `Torcer por ${B}`, icon: "party", fn: () => (addFriendship(f.b, 5), addFriendship(f.a, -8), say([["Você", `VAI, ${B.toUpperCase()}!`], [A, "Traíra!"]])) },
    {
      t: "Apostar 10 de ouro…",
      icon: "coin",
      fn: () => {
        if (player.gold < 10) return say([["", "Você não tem 10 de ouro."]]);
        choice("Apostar em quem?", "Se acertar, ganha o dobro.", [f.a, f.b].map((id) => ({ t: shortName(id), fn: () => ((player.gold -= 10), (f.bet = { on: id, v: 10 }), toast(`Apostou 10 em ${shortName(id)}.`, 2200)) })));
      },
    },
    {
      t: `Entrar na briga contra ${B}`,
      icon: "sword",
      fn: () => {
        endNpcFight(f, "separada");
        addFriendship(f.a, 8);
        startBrawl(f.b, NPCS[f.b].nome);
      },
    },
    { t: "Só assistir", icon: "eye", fn: () => {} },
  ]);
}
{
  const charBase = characterAt;
  characterAt = function (x, y) {
    return !!fightAt(x, y) || charBase(x, y);
  };
  const interBase = interactAt;
  interactAt = function (x, y) {
    const f = fightAt(x, y);
    if (f) return fightMenu(f);
    return interBase(x, y);
  };
  const tgtBase = targetAt;
  targetAt = function (x, y) {
    const f = fightAt(x, y);
    if (f) return `Briga: ${shortName(f.a)} x ${shortName(f.b)}`;
    return tgtBase(x, y);
  };
  const cdBase = crewDrawList;
  crewDrawList = function (list, t) {
    cdBase(list, t);
    for (const f of game.npcFights) {
      if (f.done || f.zone !== player.zone) continue;
      list.push({ y: Math.max(f.ra.ry, f.rb.ry) + 0.02, draw: () => drawNpcFight(f, t) });
    }
  };
}
function drawNpcFight(f, t) {
  const mx = ((f.ra.rx + f.rb.rx) / 2) * TILE + 16,
    my = ((f.ra.ry + f.rb.ry) / 2) * TILE + 18;
  // Nuvem de poeira.
  for (let i = 0; i < 7; i++) {
    const a = t * 5 + i * 0.9;
    ctx.fillStyle = `rgba(200,180,150,${0.35 + 0.15 * Math.sin(a * 2)})`;
    ctx.beginPath();
    ctx.arc(mx + Math.cos(a) * 16, my + Math.sin(a) * 7, 7 + (i % 3) * 2, 0, 7);
    ctx.fill();
  }
  // Punhos e estrelinhas.
  for (let i = 0; i < 2; i++) {
    const a = t * 9 + i * Math.PI;
    ctx.fillStyle = "#e8b48a";
    ctx.fillRect(mx + Math.cos(a) * 12 - 3, my - 6 + Math.sin(a) * 6, 6, 6);
  }
  for (let i = 0; i < 3; i++) {
    const a = t * 3 + i * 2.1;
    ctx.fillStyle = "#ffe066";
    ctx.fillRect(mx + Math.cos(a) * 20, my - 26 + Math.sin(a) * 4, 3, 3);
  }
  if (f.pow && f.pow.t > 0) {
    ctx.font = '700 14px "Pixelify Sans", sans-serif';
    ctx.textAlign = "center";
    ctx.lineWidth = 4;
    ctx.strokeStyle = "#140a1e";
    const txt = pk(["POW!", "PAF!", "TUM!", "SOC!"]);
    f.powTxt = f.powTxt && f.pow.t < 0.3 ? f.powTxt : txt;
    ctx.strokeText(f.powTxt, f.pow.x * TILE + 16, f.pow.y * TILE - 8);
    ctx.fillStyle = "#ff5a3a";
    ctx.fillText(f.powTxt, f.pow.x * TILE + 16, f.pow.y * TILE - 8);
  }
  // Barrinhas de "fôlego" dos dois.
  for (const [r, h] of [
    [f.ra, f.ha],
    [f.rb, f.hb],
  ]) {
    ctx.fillStyle = "#140a1e";
    ctx.fillRect(r.rx * TILE + 4, r.ry * TILE - 16, 24, 4);
    ctx.fillStyle = h > 50 ? "#7ad06a" : h > 25 ? "#ffd84a" : "#ff5a4a";
    ctx.fillRect(r.rx * TILE + 5, r.ry * TILE - 15, Math.max(0, (22 * h) / 100), 2);
  }
}

/* ----- O dia a dia dos casais: pedido, casamento, bebês, separação ----- */

function npcDaily() {
  if (!lifeMode()) return;
  const S = soc();
  // Se você roubou o par de alguém, o namoro antigo acaba.
  for (const id of [player.spouse, player.dating, ...(player.lovers || [])].filter(Boolean)) {
    const ex = S.dating[id] || S.mar[id];
    if (ex) {
      if (S.dating[id]) delete S.dating[ex], delete S.dating[id];
      if (S.mar[id]) delete S.mar[ex], delete S.mar[id];
      relAdd(ex, id, -40);
      vilaNews(`${shortName(ex)} levou um pé na bunda: ${shortName(id)} trocou ${gw(ex, "ele", "ela")} por ${player.name}!`);
    }
  }
  const seen = new Set();
  for (const [a, b] of Object.entries(S.dating)) {
    const k = npcPair(a, b);
    if (seen.has(k) || !named(a) || !named(b)) continue;
    seen.add(k);
    const r = relAdd(a, b, Math.random() * 6 - 2 + compat(a, b) / 20);
    if (r < 10) breakUp(a, b, "brigas demais");
    else if (r >= 70 && player.day - (S.since[k] || player.day) >= 3 && !S.wed.some((w) => w.k === k) && Math.random() < 0.35) {
      const day = player.day + 2;
      S.wed.push({ k, a, b, day });
      vilaNews(`${shortName(a)} pediu ${shortName(b)} em casamento! A festa é daqui a 2 dias, às 17h, no Templo.`);
      toast(`Noivado! ${shortName(a)} e ${shortName(b)} vão casar no dia ${day}.`, 4200);
    }
  }
  // Casais casados: o amor sobe ou desce; filhos às vezes.
  const couples = new Set();
  for (const id of Object.keys(NPCS)) {
    const sp = named(id) && npcSpouse(id);
    if (sp && named(sp)) couples.add(npcPair(id, sp));
  }
  for (const k of couples) {
    const [a, b] = k.split("|");
    const r = relAdd(a, b, Math.random() * 5 - 2.2 + compat(a, b) / 25);
    if (r < -25 && Math.random() < 0.3) breakUp(a, b, "muita briga em casa");
    else if (r > 55 && Math.random() < 0.04 && !isChildNpc(a)) {
      S.babies = (S.babies || 0) + 1;
      const nm = pk(["Tiago", "Lia", "Bento", "Clara", "Davi", "Nina", "Otto", "Íris", "Caio", "Luna"]);
      vilaNews(`Nasceu ${nm}, filh${/a$/.test(nm) ? "a" : "o"} de ${shortName(a)} e ${shortName(b)}! A vila mandou flores.`);
    }
  }
  // Inimizades antigas esfriam um pouco com o tempo.
  for (const k of Object.keys(S.rel)) if (S.rel[k] < -50 && Math.random() < 0.2) S.rel[k] += 5;
}
function weddingTick() {
  const S = player.soc;
  if (!S || !S.wed.length || !lifeMode()) return;
  for (const w of S.wed) {
    if (w.done || player.day < w.day) continue;
    if (player.day > w.day || player.clock >= 17 * 60) {
      if (game.mode !== "world" || game.dialog) return;
      w.done = true;
      if (!named(w.a) || !named(w.b) || npcSpouse(w.a) || npcSpouse(w.b)) continue;
      delete S.dating[w.a];
      delete S.dating[w.b];
      S.mar[w.a] = w.b;
      S.mar[w.b] = w.a;
      relAdd(w.a, w.b, 10);
      const A = shortName(w.a),
        B = shortName(w.b);
      vilaNews(`Casamento! ${A} e ${B} disseram sim no Templo da Luz.`);
      if (player.zone === "vila" && player.day === w.day) {
        say(
          [
            ["", `Os sinos tocam! Começou o casamento de ${A} e ${B} no Templo da Luz.`],
            ["Padre Anselmo", `${A}, aceita ${B}?`],
            [A, `Aceito! ${pk(WED_LINES)}`],
            [B, `Aceito! ${pk(WED_LINES)}`],
            ["Padre Anselmo", "Então eu vos declaro casados! Pode beijar!"],
            ["", "A vila inteira aplaude e joga pétalas. Alguém do fundo grita: \"E o Marzoca, foi convidado?!\""],
          ],
          () =>
            choice(`Casamento de ${A} e ${B}`, "Quer dar um presente aos noivos?", [
              { t: "Dar 15 de ouro de presente", icon: "coin", fn: () => (player.gold >= 15 ? ((player.gold -= 15), addFriendship(w.a, 10), addFriendship(w.b, 10), say([[A, "Obrigad" + gw(w.a, "o", "a") + "! Você é de casa!"]])) : say([["", "Você não tem 15 de ouro."]])) },
              { t: "Dançar na festa", icon: "note", fn: () => (typeof addNeed === "function" && addNeed("fun", 30), addFriendship(w.a, 4), addFriendship(w.b, 4), say([["", "Você dança até os pés doerem. Que festa!"]])) },
              { t: "Só dar os parabéns", icon: "heart", fn: () => (addFriendship(w.a, 2), addFriendship(w.b, 2)) },
            ]),
        );
      } else toast(`${A} e ${B} se casaram hoje!`, 3600);
      return;
    }
  }
  S.wed = S.wed.filter((w) => !w.done || player.day - w.day < 3);
}
/* "Perguntar da vida amorosa": o que esta pessoa sente pelos outros. */
{
  const itemsBase = lifeSocialItems;
  lifeSocialItems = function (id) {
    const items = itemsBase(id);
    if (!named(id)) return items;
    items.push({
      t: "Perguntar da vida amorosa e das rixas",
      icon: "heart",
      fn: () => {
        const n = shortName(id);
        const others = Object.keys(NPCS).filter((o) => o !== id && named(o) && !isChildNpc(o));
        const S = soc();
        const known = others.filter((o) => S.rel[npcPair(id, o)] !== undefined);
        const best = known.sort((a, b) => relOf(id, b) - relOf(id, a))[0];
        const worst = known.sort((a, b) => relOf(id, a) - relOf(id, b))[0];
        const sp = npcSpouse(id),
          pt = npcPartner(id);
        const lines = [];
        if (sp) lines.push([n, relOf(id, sp) > 40 ? `Sou casad${gw(id, "o", "a")} com ${shortName(sp)} e cada dia gosto mais.` : relOf(id, sp) > 0 ? `${shortName(sp)} e eu... a gente vai levando.` : `Nem me fala de ${shortName(sp)}. Tô por um fio.`]);
        else if (pt) lines.push([n, `Tô namorando ${shortName(pt)}! ${relOf(id, pt) >= 65 ? "Acho que vem pedido aí..." : "Tá no começo ainda."}`]);
        else lines.push([n, pk(["Solteir" + gw(id, "o", "a") + " e feliz. Por enquanto.", "Coração livre. Mas tô de olho em alguém...", "Amor? Só pelo meu trabalho."])]);
        const crush = !sp && !pt && others.filter((o) => singleNpc(o) && mutualAttraction(id, o) && relOf(id, o) > 25).sort((a, b) => relOf(id, b) - relOf(id, a))[0];
        if (crush) lines.push([n, `*sussurra* Acho ${shortName(crush)} uma graça. Não conta pra ninguém!`]);
        if (best && relOf(id, best) > 30 && best !== sp && best !== pt) lines.push([n, `Meu melhor amigo na vila? ${shortName(best)}, com certeza.`]);
        if (worst && relOf(id, worst) < -20) lines.push([n, `Agora, ${shortName(worst)}... ${relOf(id, worst) < -50 ? "um dia eu ainda saio na mão com essa pessoa." : "não desce. Não desce mesmo."}`]);
        say(lines);
      },
    });
    return items;
  };
}
{
  const dayBase = onNewDay;
  onNewDay = function () {
    dayBase.apply(this, arguments);
    npcDaily();
  };
  const updBase = update;
  update = function (dt) {
    updBase(dt);
    if (game.mode === "title" || game.mode === "cutscene") return;
    if (lifeMode()) yearMigrate();
    npcFightTick(dt);
    if (game.mode === "world" && !game.dialog) weddingTick();
  };
}
