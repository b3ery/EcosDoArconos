/**
 * ECOS DO ARCANO — pos-jogo.js (modo História)
 *  1. Créditos com "fotos" dos momentos da sua jornada.
 *  2. Livro de Lendas: toda a lore que você descobriu, para reler.
 *  3. Arco final da Nyx: depois de zerar, ela pede ajuda para recuperar a voz.
 *  4. Vozes dos personagens: Odelia, Vesper e Nyx entram no roteiro de dublagem.
 *  5. Viagem rápida pelos altares já visitados.
 *  6. Montaria do Grifo: depois de libertá-lo, ele te leva voando.
 *  7. O clima muda o caminho: lagos congelam na neve; pontes alagam na tempestade.
 *  8. Torre Infinita: andares sem fim depois de zerar, com placar.
 *  9. Desafio do dia: uma luta com regra especial por dia de jogo.
 * 10. Modo daltônico (padrões nos botões das runas).
 * 11. Economia de bateria (menos partículas e 30 quadros por segundo).
 * E o labirinto das câmaras ficou mais difícil: escuro desde o começo, luz
 * bem curta e sem minimapa enquanto você está lá dentro.
 */

"use strict";

const pjOn = () => story() && player && player.name;

/* ===================== LABIRINTO MAIS DIFÍCIL ===================== */
const inDarkMaze = () => {
  const C = typeof chamberOf === "function" && chamberOf(player.zone);
  return !!(C && C.mech === "maze" && !chState(player.zone).ok && player.x < LAIR.door[0]);
};
drawMazeDark = function () {
  if (!inDarkMaze()) return;
  const t = lairTier(),
    T = TILE,
    px = player.rx * T + 16,
    py = player.ry * T + 16,
    r = T * Math.max(1.4, 2.4 - 0.2 * t) * (1 + 0.04 * Math.sin(game.t * 9));
  ctx.save();
  ctx.fillStyle = "rgba(3,2,6,.985)";
  ctx.beginPath();
  ctx.rect(0, 0, LAIR.door[0] * T, LAIR.h * T);
  ctx.arc(px, py, r, 0, Math.PI * 2, true);
  ctx.fill("evenodd");
  const g = ctx.createRadialGradient(px, py, r * 0.45, px, py, r);
  g.addColorStop(0, "rgba(3,2,6,0)");
  g.addColorStop(1, "rgba(3,2,6,.95)");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(px, py, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
};
{
  const mmBase = drawMinimap;
  drawMinimap = function (big) {
    if (pjOn() && (inDarkMaze() || (lairOfZone(player.zone) && lairOfZone(player.zone).mech === "fog" && !lairState(lairOfZone(player.zone)).ok))) {
      if (big) toast("O mapa não funciona no escuro do labirinto.", 1600);
      return;
    }
    return mmBase.apply(this, arguments);
  };
}

/* ===================== 5 e 6. VIAGEM RÁPIDA E O GRIFO ===================== */
const altars = () => (player.altars = player.altars || {});
function travelTo(z, x, y) {
  player.zone = z;
  let best = [x, y];
  for (const [dx, dy] of [[0, 1], [1, 0], [-1, 0], [0, -1], [1, 1], [-1, 1]])
    if (walkable(z, x + dx, y + dy)) {
      best = [x + dx, y + dy];
      break;
    }
  [player.x, player.y] = best;
  player.rx = player.x;
  player.ry = player.y;
  player.riding = false;
  game.fade = 1;
  game.autoPath = null;
  enterZone(true);
  saveGame();
}
function travelMenu(title, text, filter) {
  const list = Object.entries(altars()).filter(([z]) => z !== player.zone && ZONES[z] && (!filter || filter(z)));
  if (!list.length) return say([["", "Você ainda não visitou outro altar. Quando usar um altar novo, ele entra nesta lista."]]);
  choice(title, text, [
    ...list.map(([z, [x, y]]) => ({ t: ZONES[z].nome || z, icon: "map", fn: () => (game.flyTo = [z, x, y], playCine(flightScene, 2.6, () => travelTo(z, x, y))) })),
    { t: "Ficar aqui", icon: "heart", fn: () => {} },
  ]);
}
function flightScene(W, H, t) {
  const g = game.flyTo && game.flyMount;
  ctx.fillStyle = g ? "#6aa8e8" : "#1a1030";
  ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 14; i++) {
    ctx.fillStyle = g ? "rgba(255,255,255,.8)" : `rgba(190,160,255,${0.3 + 0.3 * Math.sin(i + t * 3)})`;
    const x = ((i * 173 - t * (g ? 420 : 260)) % (W + 200) + W + 200) % (W + 200) - 100;
    ctx.fillRect(x, (i * 61) % H, g ? 90 : 4, g ? 18 : 4);
  }
  if (g) drawEnemy("grifo", W / 2 - 48, H / 2 - 60 + Math.sin(t * 6) * 6, 6, t);
  ctx.textAlign = "center";
  txt(g ? "O Grifo te leva pelos céus..." : "O altar te leva pelo eco das runas...", W / 2, 60, 20, "#fff", 600);
}
const grifoOk = () => (player.guards || []).includes("picos") && (player.guardFate || {}).grifo !== "vilao";
function callGrifo() {
  if (!grifoOk()) return say([["", "Só um Grifo libertado atenderia o seu chamado."]]);
  if (lairOfAny(player.zone) || !outdoorTheme(ZONES[player.zone].theme)) return toast("O Grifo só consegue te buscar ao ar livre.", 2200);
  game.flyMount = true;
  travelMenu("Voar com o Grifo", "O Grifo Dourado pousa ao seu lado. Para onde?", null);
}

/* ===================== 7. O CLIMA MUDA O CAMINHO ===================== */
const ICE_ZONES = ["bosque", "pantano", "picos"],
  FLOOD_ZONES = ["bosque", "pantano"];
const floodOk = {};
let baseWalk = null; // walkable de antes deste arquivo (sem gelo nem enchente)
/** Só alaga as pontes de uma região se ainda der para ir da entrada ao Guardião sem elas. */
function canFlood(z) {
  if (z in floodOk) return floodOk[z];
  floodOk[z] = false;
  const Z = ZONES[z];
  if (!Z || !Z.guardPos || !baseWalk) return false;
  let s = Z.town && Z.town.arrive ? Z.town.arrive : null;
  if (!s) for (let y = 0; y < Z.h && !s; y++) for (let x = 0; x < Z.w && !s; x++) if (Z.map[y][x] === ".") s = [x, y];
  if (!s) return false;
  const seen = new Set([s.join()]),
    q = [s],
    g = Z.guardPos;
  while (q.length) {
    const [x, y] = q.shift();
    if (Math.abs(x - g[0]) + Math.abs(y - g[1]) <= 1) return (floodOk[z] = true);
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx,
        ny = y + dy,
        k = nx + "," + ny;
      if (seen.has(k) || !Z.map[ny] || Z.map[ny][nx] === "=" || !baseWalk(z, nx, ny)) continue;
      seen.add(k);
      q.push([nx, ny]);
    }
  }
  return false;
}
const snowing = () => player.weather === "neve";
const storming = () => player.weather === "tempestade";
{
  const wkBase = walkable;
  baseWalk = wkBase;
  walkable = function (z, x, y) {
    if (pjOn() && z === player.zone && ZONES[z]) {
      const c = ZONES[z].map[y] && ZONES[z].map[y][x];
      const here = ZONES[z].map[player.y] && ZONES[z].map[player.y][player.x];
      if (c === "~" && snowing() && ICE_ZONES.includes(z)) return true;
      if (here === "~" && ICE_ZONES.includes(z) && c === "~") return true; // o gelo derreteu com você em cima: dá para sair
      if (c === "=" && storming() && FLOOD_ZONES.includes(z) && here !== "=" && canFlood(z)) {
        if (!game.floodMsg || game.t - game.floodMsg > 6) ((game.floodMsg = game.t), toast("A tempestade alagou a ponte! Espere o tempo melhorar (H) ou ache outro caminho.", 3200));
        return false;
      }
    }
    return wkBase(z, x, y);
  };
  const cdBase = crewDrawList;
  crewDrawList = function (list, t) {
    cdBase(list, t);
    if (!pjOn()) return;
    const z = player.zone;
    if ((snowing() && ICE_ZONES.includes(z)) || (storming() && FLOOD_ZONES.includes(z))) list.push({ y: -4, draw: () => drawWeatherPaths(z) });
  };
}
function drawWeatherPaths(z) {
  const Z = ZONES[z],
    T = TILE;
  const x0 = Math.max(0, Math.floor(player.rx - 22)),
    x1 = Math.min(Z.w - 1, Math.ceil(player.rx + 22)),
    y0 = Math.max(0, Math.floor(player.ry - 14)),
    y1 = Math.min(Z.h - 1, Math.ceil(player.ry + 14));
  for (let y = y0; y <= y1; y++)
    for (let x = x0; x <= x1; x++) {
      const c = Z.map[y][x];
      if (c === "~" && snowing()) {
        ctx.fillStyle = "rgba(220,240,255,.72)";
        ctx.fillRect(x * T, y * T, T, T);
        ctx.fillStyle = "rgba(255,255,255,.5)";
        ctx.fillRect(x * T + ((x * 7) % 20), y * T + ((y * 11) % 20), 8, 2);
      }
      if (c === "=" && storming() && canFlood(z)) {
        ctx.fillStyle = "rgba(40,90,170,.55)";
        ctx.fillRect(x * T, y * T, T, T);
      }
    }
}

/* ===================== 8. TORRE INFINITA ===================== */
const INF = { id: "torre-inf", L: { id: "torre-inf", region: "torre-inf", n: "Torre Infinita", theme: "torre", guard: null } };
const INF_MECHS = ["maze", "levers", "plates", "watch", "arena"];
const infSpot = () => spotOf("torre", "torre-infinita");
function infFloor() {
  return (player.infFloor = player.infFloor || 0);
}
function buildInfFloor(n) {
  const mech = INF_MECHS[(n * 7 + 3) % INF_MECHS.length];
  delete CHAMBER[INF.id];
  if (player.chambers) delete player.chambers[INF.id];
  // gera a câmara no mesmo formato das câmaras dos covis
  const L = INF.L;
  const { w, h } = LAIR;
  const m = makeGrid(w, h, (x, y) => (x === 0 || y === 0 || x === w - 1 || y === h - 1 ? "#" : "."));
  for (let y = 1; y < h - 1; y++) m[y][LAIR.door[0]] = "#";
  for (let y = 1; y < h - 1; y++) if (y !== 5) m[y][1] = "#";
  if (mech === "maze") chMaze(m, n * 7919 + 17);
  ZONE_DEFS[INF.id] = { nome: `Torre Infinita · Andar ${n}`, theme: "torre", exits: {}, enemies: [] };
  const z = finalize(INF.id, ZONE_DEFS[INF.id], m, w, h, {}, {}, null);
  z.town = { bld: [], doors: {}, stalls: {}, huts: [], arrive: LAIR.spawn.slice(), horses: [], boats: [], yard: true };
  ZONES[INF.id] = z;
  CHAMBER[INF.id] = { L, k: Math.min(5, 2 + (n % 4)), mech, last: false, inf: true };
}
function enterInf(n) {
  player.infFloor = n;
  buildInfFloor(n);
  const I = CH_INFO[CHAMBER[INF.id].mech];
  chState(INF.id).seen = true;
  goChamber(INF.id);
  playCine(chapterCard(`Torre Infinita · Andar ${n}`, I.n, `Recorde: andar ${player.infBest || 0}`), 2.6, () => say([["", I.hint]]));
}
{
  const ltBase = lairTier;
  lairTier = function () {
    if (player && player.zone === INF.id) return Math.min(9, 2 + Math.floor(infFloor() / 2));
    return ltBase.apply(this, arguments);
  };
  const ciBase = chInteract;
  chInteract = function (x, y) {
    if (player.zone === INF.id) {
      const l = chTarget(x, y);
      if (l === "Descer para a próxima câmara") {
        const n = infFloor() + 1;
        player.infBest = Math.max(player.infBest || 0, infFloor());
        if (infFloor() % 5 === 0) {
          player.gold += 100 * infFloor();
          addItem(infFloor() % 10 === 0 ? "fenix" : "eter", 2);
          toast(`Andar ${infFloor()} vencido! +${100 * infFloor()} de ouro.`, 3000);
        }
        saveGame();
        enterInf(n);
        return true;
      }
      if (l === "Voltar à câmara anterior") {
        player.infBest = Math.max(player.infBest || 0, infFloor() - 1);
        saveGame();
        const [sx, sy] = infSpot();
        travelTo("torre", sx, sy);
        return true;
      }
    }
    return ciBase.apply(this, arguments);
  };
}

/* ===================== 9. DESAFIO DO DIA ===================== */
const DAILY_RULES = [
  { id: "dom", n: "Só o seu dom", d: "As runas ficam seladas: lute só com o seu elemento." },
  { id: "itens", n: "Sem itens", d: "Nada de poções nesta luta." },
  { id: "muda", n: "Fraqueza que muda", d: "O inimigo troca de fraqueza toda rodada." },
  { id: "pressa", n: "Contra o relógio", d: "Vença em até 8 turnos." },
];
const DAILY_FOES = ["golem", "harpia", "sentinela", "espectro", "lobo", "sapo"];
const dailySpot = () => spotOf("vila", "desafio-do-dia");
function dailyRule() {
  return DAILY_RULES[(player.day || 0) % DAILY_RULES.length];
}
function startDaily() {
  if (player.dailyDay === player.day) return say([["", "Você já venceu o Desafio do dia. Volte amanhã: a regra muda todo dia."]]);
  const R = dailyRule(),
    foe = DAILY_FOES[(player.day || 0) % DAILY_FOES.length];
  choice(`Desafio do dia: ${R.n}`, `${R.d} Inimigo: ${ENEMIES[foe].nome} (bem mais forte). Prêmio: ouro e um item raro.`, [
    { t: "Aceitar o desafio", icon: "sword", fn: () => ((game.daily = R.id), startBattle(foe, null)) },
    { t: "Agora não", icon: "heart", fn: () => {} },
  ]);
}
{
  const sbBase = startBattle;
  startBattle = function () {
    const r = sbBase.apply(this, arguments);
    const B = battle;
    if (game.daily && B && B.e && !B.dailyRule) {
      B.dailyRule = game.daily;
      game.daily = null;
      const k = 1.6 + 0.1 * Math.min(10, player.lvl);
      B.e.max = Math.round(B.e.max * k);
      B.e.hp = B.e.max;
      B.e.atk *= 1.3;
      B.e.nome = `${B.e.nome} do Desafio`;
      if (B.dailyRule === "dom") for (const r2 of player.runes) B.sealed[r2] = 999;
      if (B.dailyRule === "muda") B.canShift = true;
      B.turnsLeft = 8;
      setTimeout(() => battle === B && battleLog(`⚔ Desafio do dia: ${dailyRule().n}. ${dailyRule().d}`), 1800);
    }
    return r;
  };
  const uiBase = useItemBattle;
  useItemBattle = function () {
    if (battle && battle.dailyRule === "itens") return battleLog("Regra do desafio: nada de itens nesta luta!");
    return uiBase.apply(this, arguments);
  };
  const etBase = enemyTurn;
  enemyTurn = function () {
    const B = battle;
    if (B && B.dailyRule && B.e && B.e.hp > 0 && !B.done) {
      if (B.dailyRule === "muda") B.shifted = false;
      if (B.dailyRule === "pressa" && --B.turnsLeft <= 0) {
        battleLog("O tempo acabou! O desafio foi perdido.");
        player.hp = 0;
        return setTimeout(lose, 900);
      }
    }
    return etBase.apply(this, arguments);
  };
  const prBase = applyPostBattleRewards;
  applyPostBattleRewards = function () {
    const won = battle && battle.dailyRule;
    const r = prBase.apply(this, arguments);
    if (won) {
      player.dailyDay = player.day;
      player.dailyWins = (player.dailyWins || 0) + 1;
      const gold = 150 + 20 * player.lvl;
      player.gold += gold;
      const prize = ["fenix", "eter", "pocao2", "elixir"].filter((i) => ITEMS[i]);
      const it = prize[player.dailyWins % prize.length];
      if (it) addItem(it);
      saveGame();
      setTimeout(() => say([["", `Desafio do dia vencido! +${gold} de ouro${it ? ` e ${ITEMS[it].nome}` : ""}. (${player.dailyWins} vitórias no total)`]]), 900);
    }
    return r;
  };
}

/* ===================== 3. O ARCO FINAL DA NYX ===================== */
ENEMIES.ecoNyx = Object.assign({}, ENEMIES.nyx3, { nome: "O Eco que Roubou a Voz", hp: 360, atk: 19, xp: 300, cor: "#3a1f5a" });
ENEMY_LEVELS.ecoNyx = { base: 11, min: 11, boss: true };
const nyxArcOn = () => pjOn() && player.finished && player.nyx && player.nyx.ally && !player.nyx.dead;
const lilySpot = () => spotOf("pantano", "voz-da-nyx");
function nyxArcTick() {
  if (!nyxArcOn() || player.flags.nyxArc || game.mode !== "world" || game.dialog || game.cine || player.zone !== "vila") return;
  player.flags.nyxArc = 1;
  saveGame();
  say([
    ["Nyx", "Ei. Posso te pedir uma coisa? Só uma."],
    ["Nyx", "A minha voz voltou... mas não inteira. Tem um pedaço dela preso no Pântano, na Ilha dos Lírios. Eu ouço ele de noite."],
    ["Nyx", "O Silêncio deixou um eco lá. Ele canta com a MINHA voz. Me ajuda a trazer ela de volta?"],
    ["", "Nova missão: vá ao Pântano das Brumas e procure o lírio que canta."],
  ]);
}
const NYX_SONG = [
  ["", "O eco se desfaz em mil notas. Elas voam pelo pântano e entram, uma por uma, na garganta de Nyx."],
  ["Nyx", "...Ah. AH. É... é a minha voz. A minha de verdade."],
  ["", "Pela primeira vez, Nyx canta. É desafinado, é baixinho, e é a coisa mais bonita que o pântano ouviu em trezentos anos."],
  ["Nyx", "Obrigada. Eu nunca disse isso pra ninguém. Obrigada."],
];

/* ===================== 1. CRÉDITOS COM FOTOS ===================== */
function journeyMoments() {
  const out = [],
    f = player.guardFate || {};
  for (const [type, nm] of [["ent", "Ent"], ["fenixf", "Fênix"], ["serpente", "Serpente"], ["grifo", "Grifo"], ["basilisco", "Basilisco"], ["leviata", "Leviatã"]])
    if (f[type]) out.push({ draw: type, t: nm, s: f[type] === "vilao" ? "Você arrancou a runa" : ["fenixf", "serpente"].includes(type) ? "Você a libertou" : "Você o libertou" });
  const N = player.nyx || {};
  if (N.s1) out.push({ draw: "nyx1", t: "Nyx", s: N.dead ? "Caiu nos Picos" : N.ally ? (player.flags.nyxVoz ? "Cantou de novo" : "Virou aliada") : "Seguiu o próprio caminho" });
  if (player.dom && DONS[player.dom]) out.push({ glyph: player.dom, t: DONS[player.dom].nome, s: player.flags.domAwake ? "O seu dom despertou" : "O seu dom" });
  out.push({ draw: "silenciador", t: "O Silenciador", s: player.villainEnd ? "Você tomou o lugar dele" : player.flags.ecoEnd ? "Vesper voltou inteiro" : "Vesper foi libertado" });
  return out;
}

/* ===================== 2. LIVRO DE LENDAS ===================== */
function legendsHTML() {
  const sec = (t, items) => `<h3>${t} (${items.filter((i) => i[1]).length}/${items.length})</h3>${items.map(([n, ok, txt2]) => `<div class="jr-row">${iconHTML("book", 18)}<div><b>${ok ? n : "???"}</b><small>${ok ? txt2 : "Ainda não descoberto."}</small></div></div>`).join("")}`;
  const lm = typeof LANDMARKS !== "undefined" ? LANDMARKS.map((L) => [L.n, !!lmFound()[L.id], L.lore]) : [];
  const sc = typeof SECRET_LORE !== "undefined" ? SECRET_LORE.map((t2, i) => [`Segredo ${i + 1}`, (player.secretsFound || []).includes(i), t2]) : [];
  const pg = Object.entries(PAGES).map(([z, t2]) => [`Página: ${(ZONES[z] || {}).nome || z}`, (player.pages || []).includes(z), t2]);
  const ge = Object.entries(GUARD_ECHO).map(([g, l]) => [(ENEMIES[g] || {}).nome || g, !!(player.guardFate || {})[g], l.join(" ")]);
  const fr = player.dom && DONS[player.dom] ? FRAG_REVEAL.map((R, i) => [`Revelação ${i + 1}`, !!player.flags["frag" + (i + 1)], R.lines(DONS[player.dom]).map((l) => (l[0] ? `${l[0]}: ` : "") + l[1]).join(" ")]) : [];
  return `<div class="gh"><h2>Livro de Lendas</h2><button id="lgclose">Fechar</button></div>
    <div class="jr-sum">Tudo o que você descobriu sobre Cinzaluz, Vesper e as runas.</div>
    ${fr.length ? sec("O Fragmento", fr) : ""}${sec("Páginas do diário de Vesper", pg)}${sec("Ecos dos Guardiões", ge)}${sec("Lugares escondidos", lm)}${sec("Segredos", sc)}`;
}
function openLegends() {
  if (game.mode !== "world") return;
  let el = byId("lendas");
  if (!el) {
    el = document.createElement("div");
    el.id = "lendas";
    el.className = "box ui ov";
    byId("screen").appendChild(el);
    const st = document.createElement("style");
    st.textContent = "#lendas{position:absolute;inset:4%;overflow-y:auto;z-index:30;padding:.6em 1em;display:none}";
    document.head.appendChild(st);
  }
  el.innerHTML = legendsHTML();
  el.style.display = "block";
  game.mode = "legends";
  byId("lgclose").onclick = () => ((el.style.display = "none"), (game.mode = "world"));
}

/* ===================== 4. VOZES DOS PERSONAGENS ===================== */
const NYX_LINES = ["Então você é a pessoa que a velha Odelia mandou. Achei que seria mais alta.", "Meu nome é Nyx. O Silenciador me paga em silêncio, e eu gosto do pagamento.", "As runas são dele. Volta pra casa, aprendiz, antes que alguém se machuque.", "Você de novo. Tem noção de quanta gente queria estar no seu lugar? Escolhida, ensinada, protegida...", "Eu fui uma criança que perdeu a voz numa febre. Ninguém me ouvia. O Silenciador foi o único que veio.", "...Não faz isso. Não finge que se importa.", "(Ela hesita um segundo a mais do que devia.) Em guarda!", "Lado errado? Só existe o lado de quem te escuta.", "Vem!", "Por quê...? Eu tentei te machucar duas vezes.", "...Escuta. Quando a máscara dele rachar, ele fica com medo. Medo de verdade. Bate com força nessa hora.", "E aprendiz... obrigada. Faz muito tempo que eu não digo isso.", "Claro. Todo mundo vai embora. Eu já devia saber.", "Você me ouviu quando ninguém ouvia. Agora eu escolho o meu lado.", "Vamos calar esse Silêncio. Lá em cima, eu luto com você.", "Ele me deu a voz dele. Agora eu falo o que ele quer. Que bonito, não é?", "Se você quer subir, vai ter que passar por mim.", "Tch... Sorte de principiante.", "Isso não acabou, aprendiz. Eu sempre chego antes.", "...Você é muito estranha, sabia?", "(Ela some na névoa, mas olha para trás uma vez.)", "Ele prometeu que eu nunca mais ficaria sem voz... e eu fiquei sem nada.", "Sobe. Termina isso. Eu... vou estar torcendo. Do meu jeito."];
if (typeof VOICE_SECTIONS !== "undefined") {
  VOICE_SECTIONS.ODE = { n: "Arquimaga Odelia", quando: "Falas da Odelia que não mudam com o seu nome ou elemento.", dir: "Voz de mulher sábia e cansada, com carinho de irmã mais velha. Às vezes firme, às vezes chorosa." };
  VOICE_SECTIONS.VES = { n: "Vesper", quando: "Sonhos, ecos e o fim da história.", dir: "Voz de homem jovem e cansado, como quem carrega um peso há trezentos anos. Nos sonhos, quase sussurrado." };
  VOICE_SECTIONS.NYV = { n: "Nyx", quando: "Encontros com a Nyx e o arco final dela.", dir: "Voz jovem, irônica e afiada. No fim, quando a voz volta, mais suave e insegura." };
  const vb = buildVoiceScript;
  buildVoiceScript = function () {
    const S = vb();
    const add = (sec, list, who) => {
      let i = 1;
      for (const t of list) if (t && !t.includes("${") && !S.some((e) => e.text === t)) S.push({ id: `${sec}-${two(i++)}`, sec, text: t, match: t, cue: null, nota: "", who });
    };
    const said = (arr, who) => arr.filter((l) => l[0] && l[0].startsWith(who)).map((l) => l[1]);
    const ode = [...said(EPILOGUE, "Arquimaga Odelia"), "Vesper... quebrou uma runa? Ele nunca faria isso. A não ser que... a não ser que fosse para salvá-la.", "Ele sempre foi assim. Estragava uma coisa pequena para proteger uma grande.", "Um berço em Cinzaluz. Trezentos anos e eu nunca procurei no lugar mais óbvio.", "Ele escondia as coisas importantes nas mãos das crianças. Dizia que ninguém desconfia de quem ainda não sabe falar.", "Então ainda existe um pedaço bom dele. E está em você.", "Aprendiz... obrigada por carregar o meu irmão até aqui. Agora leve ele para casa."];
    const ves = [...VESPER_DREAMS.flatMap((D) => D.lines.filter((l) => l[0] === "Vesper").map((l) => l[1])), ...said(EPILOGUE, "Vesper"), ...said(ECO_END, "Vesper"), "Se você achou isto... então deu certo. Obrigado, pequeno."];
    const nyx = [...NYX_LINES, ...NYX_SONG.filter((l) => l[0] === "Nyx").map((l) => l[1]), "Ei. Posso te pedir uma coisa? Só uma.", "A minha voz voltou... mas não inteira. Tem um pedaço dela preso no Pântano, na Ilha dos Lírios. Eu ouço ele de noite.", "O Silêncio deixou um eco lá. Ele canta com a MINHA voz. Me ajuda a trazer ela de volta?"];
    add("ODE", ode, "Odelia");
    add("VES", ves, "Vesper");
    add("NYV", nyx, "Nyx");
    return S;
  };
  if (typeof indexVoices === "function") indexVoices();
  // A caixa de diálogo toca a voz do personagem também (não só a do Narrador).
  const rd = renderDialogLine;
  renderDialogLine = function () {
    const r = rd.apply(this, arguments);
    const d = game.dialog;
    if (!d) return r;
    const [who, text] = d.lines[d.i] || [];
    const e = voiceForText(text);
    if (e && e.who && who && d._voiced !== d.i) {
      d._voiced = d.i;
      playVoice(e);
    }
    return r;
  };
}

/* ===================== 10 e 11. DALTÔNICO E BATERIA ===================== */
function applyPjSettings() {
  document.body.classList.toggle("cbmode", !!settings.cb);
}
{
  const st = document.createElement("style");
  st.textContent = `
  body.cbmode .rbtn{border-width:3px!important}
  body.cbmode .rbtn[data-r="fogo"],body.cbmode .rbtn[data-r="lava"]{border-style:double!important}
  body.cbmode .rbtn[data-r="agua"],body.cbmode .rbtn[data-r="gelo"]{border-style:dashed!important}
  body.cbmode .rbtn[data-r="ar"],body.cbmode .rbtn[data-r="raio"]{border-style:dotted!important}
  body.cbmode .rbtn[data-r="terra"],body.cbmode .rbtn[data-r="metal"]{border-style:solid!important;border-width:4px!important}
  body.cbmode .rbtn[data-r="luz"],body.cbmode .rbtn[data-r="cristal"]{border-style:groove!important}
  body.cbmode .rbtn[data-r="sombra"],body.cbmode .rbtn[data-r="veneno"]{border-style:ridge!important}
  body.cbmode .rbtn{font-weight:700;text-decoration:underline}`;
  document.head.appendChild(st);
  applyPjSettings();
  const bBase = burst;
  burst = function (x, y, cols, n, sp) {
    if (settings.eco) n = Math.max(1, Math.round(n * 0.3));
    const r = bBase.call(this, x, y, cols, n, sp);
    if (settings.eco && game.parts && game.parts.length > 120) game.parts.splice(0, game.parts.length - 120);
    return r;
  };
  let skip = false;
  const dBase = draw;
  draw = function () {
    if (settings.eco && game.mode === "world" && (skip = !skip)) return;
    return dBase.apply(this, arguments);
  };
  const roBase = renderOptions;
  renderOptions = function () {
    roBase();
    const box = byId("options");
    if (!box || byId("optPj")) return;
    const seg = (k, list, cur) => list.map(([v, n]) => `<button data-pj="${k}" data-v="${v}" class="${String(cur) === v ? "on" : ""}">${n}</button>`).join("");
    const div = document.createElement("div");
    div.id = "optPj";
    div.innerHTML = `<h3>Conforto</h3>
      <div class="opt"><span>Modo daltônico (padrões nas runas)</span><div class="seg">${seg("cb", [["0", "Desligado"], ["1", "Ligado"]], settings.cb ? "1" : "0")}</div></div>
      <div class="opt"><span>Economia de bateria</span><div class="seg">${seg("eco", [["0", "Desligada"], ["1", "Ligada"]], settings.eco ? "1" : "0")}</div></div>`;
    (box.querySelector(".opt-body, .ov-body") || box).appendChild(div);
    div.querySelectorAll("[data-pj]").forEach((b) => {
      b.onclick = () => {
        settings[b.dataset.pj] = b.dataset.v === "1";
        saveSettings();
        applyPjSettings();
        div.querySelectorAll(`[data-pj="${b.dataset.pj}"]`).forEach((x) => x.classList.toggle("on", x === b));
      };
    });
  };
}

/* ===================== LIGAÇÕES ===================== */
(() => {
  // altares: registrar e oferecer viagem
  const iaBase = interactAt;
  interactAt = function (x, y) {
    if (pjOn()) {
      const z = player.zone,
        c = ZONES[z] && ZONES[z].map[y] && ZONES[z].map[y][x];
      if (c === "F") {
        altars()[z] = [x, y];
        const r = iaBase.apply(this, arguments);
        const others = Object.keys(altars()).filter((k) => k !== z && ZONES[k]).length;
        if (others) setTimeout(() => game.mode === "world" && !game.dialog && ((game.flyMount = false), travelMenu("Viagem pelos altares", "O altar ressoa com os outros altares que você já tocou. Quer viajar?", null)), 300);
        return r;
      }
      if (player.finished && z === "torre" && near(infSpot(), x, y)) {
        return choice("Torre Infinita", `Andares sem fim, cada um com um desafio. A dificuldade sobe a cada andar. Seu recorde: andar ${player.infBest || 0}.`, [
          { t: "Começar do andar 1", icon: "flag", fn: () => enterInf(1) },
          ...(player.infBest >= 5 ? [{ t: `Começar do andar ${Math.floor(player.infBest / 5) * 5}`, icon: "star", fn: () => enterInf(Math.floor(player.infBest / 5) * 5) }] : []),
          { t: "Agora não", icon: "heart", fn: () => {} },
        ]);
      }
      if (z === "vila" && near(dailySpot(), x, y)) return startDaily();
      if (nyxArcOn() && player.flags.nyxArc && !player.flags.nyxVoz && z === "pantano" && near(lilySpot(), x, y)) {
        return say([["", "Um lírio da névoa canta sozinho... com a voz da Nyx. A névoa se junta e forma uma figura."]], () => ((game.nyxArcFight = true), startBattle("ecoNyx", null)));
      }
    }
    return iaBase(x, y);
  };
  const tgBase = targetAt;
  targetAt = function (x, y) {
    if (pjOn()) {
      const z = player.zone;
      if (player.finished && z === "torre" && near(infSpot(), x, y)) return "Torre Infinita";
      if (z === "vila" && near(dailySpot(), x, y)) return player.dailyDay === player.day ? "Desafio do dia (feito)" : "Desafio do dia";
      if (nyxArcOn() && player.flags.nyxArc && !player.flags.nyxVoz && z === "pantano" && near(lilySpot(), x, y)) return "O lírio que canta";
    }
    return tgBase(x, y);
  };
  const wk = walkable;
  walkable = function (z, x, y) {
    if (z === player.zone && pjOn()) {
      const s = sagaCache["vila|desafio-do-dia"],
        t = sagaCache["torre|torre-infinita"],
        l = sagaCache["pantano|voz-da-nyx"];
      if (z === "vila" && s && s[0] === x && s[1] === y) return false;
      if (z === "torre" && player.finished && t && t[0] === x && t[1] === y) return false;
      if (z === "pantano" && l && l[0] === x && l[1] === y && nyxArcOn() && player.flags.nyxArc && !player.flags.nyxVoz) return false;
    }
    return wk(z, x, y);
  };
  const cdBase = crewDrawList;
  crewDrawList = function (list, t) {
    cdBase(list, t);
    if (!pjOn()) return;
    const z = player.zone,
      T = TILE;
    if (z === "vila") {
      const [x, y] = dailySpot();
      list.push({
        y: y + 0.01,
        draw: () => {
          ctx.fillStyle = "#6a4a2a";
          ctx.fillRect(x * T + 6, y * T + 4, 20, 16);
          ctx.fillStyle = "#e8d8b0";
          ctx.fillRect(x * T + 8, y * T + 6, 16, 12);
          ctx.fillStyle = player.dailyDay === player.day ? "#7ad36b" : "#e05a5a";
          ctx.fillRect(x * T + 13, y * T + 8, 6, 6);
          ctx.fillStyle = "#4a3018";
          ctx.fillRect(x * T + 14, y * T + 20, 4, 10);
        },
      });
    }
    if (z === "torre" && player.finished) {
      const [x, y] = infSpot();
      list.push({ y: y + 0.01, draw: () => (drawStairs(t), 0) && 0 });
      list[list.length - 1].draw = () => {
        ctx.save();
        ctx.translate((x - LAIR.guard[0]) * T, (y - LAIR.guard[1]) * T);
        drawStairs(t);
        ctx.restore();
      };
    }
    if (z === "pantano" && nyxArcOn() && player.flags.nyxArc && !player.flags.nyxVoz) {
      const [x, y] = lilySpot();
      list.push({
        y: y + 0.01,
        draw: () => {
          ctx.fillStyle = `rgba(200,170,255,${0.3 + 0.2 * Math.sin(t * 3)})`;
          ctx.beginPath();
          ctx.arc(x * T + 16, y * T + 16, 18, 0, 7);
          ctx.fill();
          ctx.fillStyle = "#f0e8ff";
          for (let i = 0; i < 5; i++) ctx.fillRect(x * T + 16 + Math.cos(i * 1.25) * 6 - 2, y * T + 14 + Math.sin(i * 1.25) * 6 - 2, 4, 4);
        },
      });
    }
  };
  const upBase = update;
  update = function () {
    const r = upBase.apply(this, arguments);
    if (pjOn()) nyxArcTick();
    if (game.nyxArcFight && !battle && game.mode === "world" && !game.dialog) game.nyxArcFight = game.nyxArcStarted ? null : game.nyxArcFight;
    return r;
  };
  const sbBase = startBattle;
  startBattle = function (type) {
    const r = sbBase.apply(this, arguments);
    if (type === "ecoNyx" && battle) game.nyxArcStarted = true;
    return r;
  };
  const prBase = applyPostBattleRewards;
  applyPostBattleRewards = function (enemy, type) {
    const nyxWin = battle && battle.type === "ecoNyx";
    const r = prBase.apply(this, arguments);
    if (nyxWin) {
      player.flags.nyxVoz = true;
      game.nyxArcFight = null;
      saveGame();
      setTimeout(() => say(NYX_SONG), 900);
    }
    return r;
  };
  ACHIEVEMENTS.push(["nyxVoz", "A voz de verdade", "Ajude a Nyx a recuperar a voz inteira.", "heart", () => !!(player.flags || {}).nyxVoz]);
  ACHIEVEMENTS.push(["torre10", "Sem fim", "Chegue ao andar 10 da Torre Infinita.", "flag", () => (player.infBest || 0) >= 10]);
  ACHIEVEMENTS.push(["desafio7", "Desafiante", "Vença 7 Desafios do dia.", "sword", () => (player.dailyWins || 0) >= 7]);

  // Jornada: Livro de Lendas e Grifo
  const jh = journeyHTML;
  journeyHTML = function () {
    let h = jh.apply(this, arguments);
    const btns = `<div class="jr-row" style="gap:.5em;flex-wrap:wrap"><button id="jrLend">${iconHTML("book", 14)} Livro de Lendas</button>${grifoOk() ? `<button id="jrGrifo">${iconHTML("map", 14)} Voar com o Grifo</button>` : ""}</div>`;
    return h.replace("</div>", "</div>" + btns);
  };
  const oj = openJourney;
  openJourney = function () {
    const r = oj.apply(this, arguments);
    const close = () => byId("jrclose") && byId("jrclose").click();
    const a = byId("jrLend"),
      g = byId("jrGrifo");
    if (a) a.onclick = () => (close(), setTimeout(openLegends, 60));
    if (g) g.onclick = () => (close(), setTimeout(callGrifo, 60));
    return r;
  };

  // 1. créditos com fotos
  const chBase = creditsHTML;
  creditsHTML = function () {
    const h = chBase.apply(this, arguments);
    if (!pjOn()) return h;
    const M = journeyMoments();
    const block = `<div class="rc-block"><div class="rc-label">Momentos da sua jornada</div><div class="rc-moments">${M.map((m, i) => `<div class="rc-mom"><canvas data-mom="${i}" width="96" height="96"></canvas><b>${m.t}</b><small>${m.s}</small></div>`).join("")}</div></div>`;
    return h.replace('<div class="rc-block"><div class="rc-label">As suas escolhas</div>', block + '<div class="rc-block"><div class="rc-label">As suas escolhas</div>');
  };
  const rcBase = rollCredits;
  rollCredits = function () {
    const r = rcBase.apply(this, arguments);
    const M = journeyMoments();
    document.querySelectorAll("#rollcred canvas[data-mom]").forEach((cv) => {
      const m = M[+cv.dataset.mom];
      const c2 = cv.getContext("2d");
      c2.imageSmoothingEnabled = false;
      c2.fillStyle = "#1a1230";
      c2.fillRect(0, 0, 96, 96);
      withContext(c2, () => {
        if (m.draw) drawEnemy(m.draw, 8, 6, 5, 0);
        else if (m.glyph) glyph(m.glyph, 48, 48, 44, 1);
      });
    });
    if (!byId("rcMomCSS")) {
      const st = document.createElement("style");
      st.id = "rcMomCSS";
      st.textContent = ".rc-moments{display:flex;flex-wrap:wrap;justify-content:center;gap:.8em}.rc-mom{display:flex;flex-direction:column;align-items:center;width:7em}.rc-mom canvas{border:3px solid #c98a4a;border-radius:6px;image-rendering:pixelated;background:#1a1230;transform:rotate(-2deg)}.rc-mom:nth-child(even) canvas{transform:rotate(2deg)}.rc-mom small{opacity:.8;text-align:center}";
      document.head.appendChild(st);
    }
    return r;
  };
})();
