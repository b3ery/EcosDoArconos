/**
 * ECOS DO ARCANO — 28-missoes-farol-mina.js
 * Missões nos dois modos:
 *  - Desabamento na Mina (Mina de Cristal, Pedravale): três mineiros presos lá no fundo.
 *    Ache cada um, cave e tire de lá.
 *  - A Lente Rachada (Farol de Brisamar, Porto): a Faroleira Lúcia precisa de cristais e
 *    minério da mina para consertar a lente. Acenda o farol à noite e salve um navio.
 *    Depois, dá para fazer a vigia da noite no farol (uma vez por dia).
 */

"use strict";

const TRAPPED_NAMES = ["Bruno Picareta", "Dona Ilsa", "Tito Lamparina"];
function mineQ() {
  player.q = player.q || {};
  return player.q.mina || null;
}
function lightQ() {
  player.q = player.q || {};
  return player.q.farol || null;
}

/* ===================== DESABAMENTO NA MINA ===================== */

/** Três lugares fundos e longe da entrada, sempre os mesmos. */
function trappedSpots() {
  const z = ZONES.mina;
  const o = z.open.n;
  const cands = [];
  for (let y = 2; y < z.h - 1; y++)
    for (let x = 1; x < z.w - 1; x++) {
      if (z.map[y][x] !== ".") continue;
      const d = Math.abs(x - o[0]) + Math.abs(y - o[1]);
      if (d > 16) cands.push([x, y, d]);
    }
  cands.sort((a, b) => b[2] - a[2] || a[0] - b[0]);
  const out = [];
  for (const c of cands) {
    if (out.every((q) => Math.abs(q[0] - c[0]) + Math.abs(q[1] - c[1]) > 9)) out.push(c);
    if (out.length === 3) break;
  }
  return out;
}
function mineQuestEnter() {
  let q = mineQ();
  if (!q) {
    q = player.q.mina = { st: 1, saved: [] };
    saveGame();
    say([
      ["Anão Gorim", "Você chegou na hora! Teve um desabamento lá no fundo da mina!"],
      ["Anão Gorim", `Três dos meus estão presos: ${TRAPPED_NAMES.join(", ")}. Eu não passo mais por aqueles túneis... meus joelhos.`],
      ["Anão Gorim", "Ache cada um e aperte E para cavar e tirar de lá. Siga a seta. Se trouxer os três, a mina inteira fica te devendo!"],
    ]);
  }
  if (q.st !== 1) return (game.trapped = []);
  game.trapped = trappedSpots()
    .map(([x, y], i) => ({ x, y, i, nm: TRAPPED_NAMES[i] }))
    .filter((t) => !q.saved.includes(t.i));
}
const _enterMineBase = enterMine;
enterMine = function () {
  _enterMineBase();
  setTimeout(mineQuestEnter, player.flags.minaQuestSeen ? 50 : 900);
  player.flags.minaQuestSeen = true;
};
function trappedAt(x, y) {
  return player.zone === "mina" ? (game.trapped || []).find((t) => t.x === x && t.y === y) : null;
}
function rescueMiner(t) {
  const q = mineQ();
  q.saved.push(t.i);
  game.trapped = game.trapped.filter((o) => o !== t);
  player.clock = Math.min(1439, player.clock + 30);
  game.shake = 0.25;
  playSound(220, 0.15, "square");
  setTimeout(() => playSound(660, 0.15, "sine"), 200);
  if (lifeMode()) addNeed("energy", -8);
  const left = 3 - q.saved.length;
  if (left > 0) {
    saveGame();
    return say([
      ["", "Você tira as pedras uma a uma até abrir um buraco..."],
      [t.nm, pickOne(["Luz! LUZ! Achei que ia virar fóssil aqui!", "Ufa! Obrigado! Minhas pernas estão dormentes, mas eu acho a saída.", "Você é um anjo de capacete! Vou avisar o Gorim."])],
      ["", `${t.nm} foi resgatado. Faltam ${left}.`],
    ]);
  }
  q.st = 2;
  player.gold += 160;
  addItem("pocaoG", 2);
  addItem("cristal", 2);
  repAdd(6);
  saveGame();
  say([
    [t.nm, "Você achou todo mundo?! Vamos sair daqui antes que caia mais pedra!"],
    ["Anão Gorim", "Os três vivos! Pedravale nunca vai esquecer isso. Tome: ouro, poções e os melhores cristais da semana."],
    ["", "Missão concluída: Desabamento na Mina! +160 ouro, 2 Grandes Poções, 2 Cristais Sombrios e reputação +6."],
  ]);
}

/* ===================== A LENTE RACHADA DO FAROL ===================== */

const LENS_NEED = [
  ["cristal", 3],
  ["minerio", 2],
];
function lighthouseDoor(b) {
  if (!b || b.name !== "Farol de Brisamar") return false;
  let q = lightQ();
  if (!q) {
    q = player.q.farol = { st: 1 };
    saveGame();
    say([
      ["Faroleira Lúcia", "Ah, uma visita! Desculpe a bagunça. A lente do farol rachou na última tempestade."],
      ["Faroleira Lúcia", "Sem luz, os navios batem nas pedras. Para consertar preciso de 3 Cristais Sombrios e 2 Minérios de Ferro. Tudo isso sai da Mina de Cristal, em Pedravale."],
      ["Faroleira Lúcia", "Traga tudo e volte à noite: a lente só pode ser acesa depois que escurece."],
    ]);
    return true;
  }
  if (q.st === 1) {
    const miss = LENS_NEED.filter(([id, n]) => itemCount(id) < n).map(([id, n]) => `${n - itemCount(id)}× ${ITEMS[id].nome}`);
    if (miss.length) return say([["Faroleira Lúcia", `Ainda falta: ${miss.join(" e ")}. A mina de Pedravale tem tudo!`]]), true;
    if (!isNight()) return say([["Faroleira Lúcia", "Você trouxe tudo! Agora espere escurecer (depois das 19h) e suba comigo. Tecla H para esperar."]]), true;
    for (const [id, n] of LENS_NEED) for (let i = 0; i < n; i++) removeItem(id);
    q.st = 2;
    player.gold += 200;
    addItem("eterG", 2);
    repAdd(8);
    game.flash = 1;
    playSound(523, 0.4, "sine");
    setTimeout(() => playSound(784, 0.5, "sine"), 300);
    saveGame();
    say([
      ["", "Vocês sobem os 120 degraus. Lúcia encaixa os cristais na lente e você acende o pavio."],
      ["", "Um feixe de luz enorme corta a noite. Lá longe, um navio mercante desvia das pedras no último segundo."],
      ["Capitão do navio", "*grita do convés* OBRIGADO, FAROL! Esta noite a cerveja é por nossa conta!"],
      ["Faroleira Lúcia", "Você salvou aquela gente. Tome, é tudo que eu juntei. E volte quando quiser fazer a vigia comigo."],
      ["", "Missão concluída: A Lente Rachada! +200 ouro, 2 Grandes Essências e reputação +8."],
    ]);
    return true;
  }
  // Depois de consertado: vigia da noite, uma vez por dia.
  choice("Farol de Brisamar", "A luz gira devagar sobre o mar. A Faroleira Lúcia acena lá de cima.", [
    {
      t: isNight() ? "Fazer a vigia da noite com a Lúcia" : "Vigia da noite (só depois das 19h)",
      icon: "eye",
      fn: () => {
        if (!isNight()) return say([["Faroleira Lúcia", "A vigia é à noite! Volte depois que escurecer."]]);
        if (player.famDay.vigia === player.day) return say([["Faroleira Lúcia", "Você já fez a vigia hoje. Vá descansar!"]]);
        player.famDay.vigia = player.day;
        player.clock = Math.min(1439, player.clock + 180);
        game.fade = 1;
        const ship = Math.random() < 0.5;
        const pay = ship ? 70 : 35;
        player.gold += pay;
        if (lifeMode()) {
          addNeed("energy", -15);
          addNeed("fun", 10);
        } else player.stamina = Math.max(0, (player.stamina ?? 100) - 10);
        saveGame();
        say([
          ["", "Três horas olhando o mar, girando a lente e contando estrelas."],
          ship ? ["", `Um barco de pesca se perdeu na neblina e achou o caminho pela luz. O dono pagou ${pay} de ouro de gratidão!`] : ["", `Noite calma. A Lúcia te paga ${pay} de ouro pela vigia.`],
        ]);
      },
    },
    { t: "Sair", fn: null },
  ]);
  return true;
}

/* ===================== GANCHOS ===================== */

function questLabel(x, y) {
  const t = trappedAt(x, y);
  return t ? `Cavar e resgatar ${t.nm}` : null;
}
function questInteract(x, y) {
  const t = trappedAt(x, y);
  if (!t) return false;
  rescueMiner(t);
  return true;
}
/** Para a seta de missão: o mineiro preso mais perto. */
function trappedTarget() {
  if (player.zone !== "mina" || !(game.trapped || []).length) return null;
  return game.trapped.slice().sort((a, b) => Math.abs(a.x - player.x) + Math.abs(a.y - player.y) - (Math.abs(b.x - player.x) + Math.abs(b.y - player.y)))[0];
}
function questDrawList(list, t) {
  if (player.zone !== "mina") return;
  for (const m of game.trapped || []) {
    list.push({
      y: m.y,
      draw: () => {
        const X = m.x * TILE,
          Y = m.y * TILE;
        // Pedras caídas em volta.
        ctx.fillStyle = "#5a5560";
        ctx.fillRect(X - 6, Y + 18, 14, 12);
        ctx.fillRect(X + 24, Y + 14, 14, 16);
        ctx.fillStyle = "#7a7480";
        ctx.fillRect(X - 4, Y + 18, 8, 4);
        ctx.fillRect(X + 26, Y + 14, 8, 4);
        drawSprite(wizardRects("#6a5a3a", "#c9a03a", "#3a2414", null, "down", 0, 77 + m.i), X, Y + Math.sin(t * 3 + m.i) * 0.8, 2);
        drawPixelIcon("sweat", X + 16, Y - 6 - Math.abs(Math.sin(t * 4)) * 3, 2);
      },
    });
  }
}
