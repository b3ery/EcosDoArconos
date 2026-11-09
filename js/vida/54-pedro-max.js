/**
 * ECOS DO ARCANO — 54-pedro-max.js
 *  - Ciúme nos dois modos e mais frequente: quem é casado descobre mais (o par
 *    perto vê na hora; longe, a fofoca chega em poucos segundos).
 *  - Pedro Max é o mais bolado de todos: deu em cima da Mylena, ele SEMPRE fica
 *    sabendo, sai na porrada com você e, acabando a briga, puxa a faca e tenta te
 *    matar pela vila (cada facada dói muito mais).
 */

"use strict";

jealousTrigger = function (id) {
  const sp = npcSpouse(id);
  if (!sp || !NPCS[sp] || isDead(sp)) return;
  const pedro = sp === "pedro";
  player.famDay.jealN = player.famDay.jealD === player.day ? player.famDay.jealN || 0 : 0;
  player.famDay.jealD = player.day;
  if ((!pedro && player.famDay.jealN >= 3) || game.jealousQ) return;
  const spot = npcSpot(sp);
  const sees = pedro || (spot && Math.abs(spot[0] - player.x) + Math.abs(spot[1] - player.y) <= 12);
  if (!pedro && Math.random() > (sees ? 1 : 0.6)) return;
  player.famDay.jealN++;
  game.jealousQ = { id, sp, at: performance.now() + (sees ? 700 : 6000 + Math.random() * 9000), sees, pedro };
};
{
  const tickBase = jealousTick;
  jealousTick = function () {
    const q = game.jealousQ;
    if (!q || !q.pedro) return tickBase();
    if (performance.now() < q.at || game.mode !== "world" || game.dialog || game.chase || game.brawl) return;
    if (!ZONES[player.zone] || !ZONES[player.zone].town) return;
    game.jealousQ = null;
    pedroRage(q.id);
  };
}
function pedroRage(id) {
  const me = player.name;
  addFriendship("pedro", -40);
  player.angry = player.angry || {};
  player.angry.pedro = player.day;
  repAdd(-4);
  game.pedroRage = { id, phase: "briga" };
  game.shake = 0.4;
  playSound(110, 0.5, "sawtooth");
  vilaNews(`Príncipe Pedro Max partiu pra cima de ${me} por causa da Mylena!`);
  say(
    [
      ["Príncipe Pedro Max", pk([`${me.toUpperCase()}!!! VOCÊ DEU EM CIMA DA MINHA MULHER?!`, `Eu vi você de gracinha com a Mylena. Você tá MORT${genderWord("O", "A", "E")}!`, `Mexeu com a Mylena, mexeu comigo. VEM!`])],
      ["Mylena", "Pedro, calma! PEDRO! Larga essa cara de quem vai matar alguém!"],
      ["Príncipe Pedro Max", "Primeiro na mão. Depois a gente vê."],
    ],
    () => {
      const had = NO_FIGHT.has("pedro");
      NO_FIGHT.delete("pedro");
      startBrawl("pedro", NPCS.pedro.nome);
      if (had) NO_FIGHT.add("pedro");
      if (game.brawl) game.brawl.foe.pow *= 1.35;
    },
  );
}
/* Acabou a briga: o Pedro puxa a faca. */
{
  const finBase = finishBrawl;
  finishBrawl = function (won) {
    const r = finBase.apply(this, arguments);
    if (game.pedroRage && game.pedroRage.phase === "briga") {
      game.pedroRage.phase = "faca";
      game.pedroRage.won = won;
      game.pedroRage.wait = performance.now() + 800;
    }
    return r;
  };
}
function pedroKnife() {
  const R = game.pedroRage;
  if (!R || R.phase !== "faca" || performance.now() < R.wait || game.mode !== "world" || game.dialog || game.brawl) return;
  R.phase = "caca";
  say(
    [
      ["Príncipe Pedro Max", R.won ? "*levanta cuspindo sangue* Acha que acabou? Isso NÃO ACABOU!" : "Isso foi só o aquecimento."],
      ["", "Pedro Max puxa uma faca da bota. Os olhos dele dizem que ele quer te matar. CORRE!!!"],
    ],
    () => {
      if (startChase("pedro", "player", "mylena")) {
        game.chase.dur = 45;
        game.chase.deadly = true;
        game.chase.lastHits = 0;
      } else game.pedroRage = null;
    },
  );
}
const PEDRO_YELLS = ["EU VOU TE MATAR!", "NINGUÉM ENCOSTA NA MYLENA!", "VOLTA AQUI, COVARDE!", "VOCÊ NÃO VAI VER O SOL DE AMANHÃ!", "CORRE MESMO, CORRE!", "É PELA MYLENA!"];
function pedroChaseTick() {
  const c = game.chase;
  if (!c || !c.deadly) {
    if (game.pedroRage && game.pedroRage.phase === "caca" && !game.chase) {
      game.pedroRage = null;
      vilaNews(`Pedro Max correu atrás de ${player.name} com uma faca pela vila. A Mylena teve que segurar ele.`);
    }
    return;
  }
  if (Math.random() < 0.02) game.shouts = (game.shouts || []).concat([{ x: c.x, y: c.y, txt: pk(PEDRO_YELLS), t: 2 }]);
  // Cada facada do Pedro dói bem mais.
  if (c.hits > c.lastHits) {
    c.lastHits = c.hits;
    const mx = maxHp();
    player.hp = Math.max(1, Math.round(player.hp - mx * 0.18));
    game.flash = 0.6;
    if (lifeMode()) addNeed("energy", -10);
    if (c.hits >= 2 && player.hp <= mx * 0.25) {
      game.chase = null;
      game.pedroRage = null;
      const lost = Math.round(player.gold * 0.25);
      player.gold -= lost;
      player.hp = Math.max(1, Math.round(mx * 0.3));
      repAdd(-3);
      const hosp = player.zone === "vila" && vilaSpot("Hospital");
      if (hosp) {
        [player.x, player.y] = hosp;
        player.rx = player.x;
        player.ry = player.y;
        game.fade = 1;
      }
      vilaNews(`Pedro Max quase matou ${player.name} a facadas! A guarda levou o Príncipe para esfriar a cabeça.`);
      saveGame();
      say([
        ["", "A última facada te derruba. Tudo fica escuro..."],
        ["Curandeira Maíra", `Você teve sorte. Mais um centímetro e era caixão. Quem fez isso? ...O PEDRO MAX?! Ninguém mexe com a Mylena, ${player.name}.`],
        ["", `Você perdeu ${lost} de ouro no caminho e passou a noite no Hospital.`],
      ]);
    }
  }
}
/* Quem flerta com a Mylena recebe um aviso dela. */
{
  const doBase = doInteraction;
  doInteraction = function (id, key) {
    const r = INTER_BY_KEY[key];
    const res = doBase(id, key);
    if (id === "mylena" && r && (r[1] === "amor" || r[1] === "cor") && !isRomanticWith(id) && game.dialog)
      game.dialog.lines.push(["Mylena", pk(["...O Pedro vai te matar se descobrir. Literalmente.", "Ai, para! O Pedro é ciumento, sabia?", "*olha pros lados* Se o Pedro vir isso, eu não respondo por ele."])]);
    return res;
  };
}
{
  const updBase = update;
  update = function (dt) {
    updBase(dt);
    if (game.mode === "title") return;
    // O ciúme interrompe até o menu de interações aberto.
    const q = game.jealousQ;
    if (q && game.mode === "choice" && !game.dialog && performance.now() >= q.at) {
      if (typeof closeInterPanel === "function") closeInterPanel();
      hidePie();
      byId("choice").style.display = "none";
      game.pieAnchor = null;
      game.mode = "world";
    }
    pedroKnife();
    pedroChaseTick();
  };
}
