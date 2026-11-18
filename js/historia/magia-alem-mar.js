/**
 * ECOS DO ARCANO — magia-alem-mar.js (modo História)
 * O Silêncio também atravessou o mar. No modo História, os nove países
 * além-mar (Cais dos Navegantes > passagem ou navio próprio) têm:
 *  - MISSÕES ARCANAS: em cada porto, um mago da terra pede ajuda com um mal
 *    mágico de lá (a maré enfeitiçada de Coralina, o eco das brumas, o golem
 *    de gelo de Gelomar...). Vencer dá ouro e uma Relíquia do país, e cada
 *    relíquia conta um pedaço do que o Silêncio fez longe de Valdária.
 *  - CAÇADORES DE MAGOS: Ferrofundo, Áurea e Jadeluz querem magia para as
 *    suas guerras e caçam magos estrangeiros. Os caçadores patrulham as ruas;
 *    se virem você, o olho vermelho enche e eles correm atrás. Dá para se
 *    esconder num barril ou num monte de feno, entrar numa casa ou usar
 *    capuz (eles enxergam menos). Se pegarem: fugir, lutar ou ser preso.
 * Modifica (envolve) funções de outros arquivos: win, endBattle, update,
 * crewDrawList, targetAt, interactAt, walkable, enterZone.
 */

"use strict";

(() => {
  const story = () => !lifeMode();
  const here = () => (player.zone && player.zone.startsWith("pais-") ? player.zone.split("-")[1] : null);
  const port = () => here() && player.zone.split("-").length === 2;
  const Q = {
    coral: { mage: "Xamã das Marés Iolana", enemy: "hidra", n: "A Maré Enfeitiçada", ask: "Uma cobra de muitas cabeças sobe do recife toda noite e o mar ficou mudo. Os peixes não cantam mais. Você tem magia de verdade, eu sinto. Me ajuda?", lore: "Antes de morrer, a criatura solta um sussurro: 'O Silêncio passou por aqui num barco... há trezentos anos.'" },
    zahar: { mage: "Astróloga Nahid", enemy: "quimera", n: "A Fera da Miragem", ask: "As estrelas sumiram do céu do deserto e uma fera de três cabeças nasceu da miragem. Ela come as caravanas.", lore: "No lugar da fera fica um mapa de estrelas. Uma delas tem o nome Vesper escrito em letra miúda." },
    brumas: { mage: "Sineira Morwen", enemy: "espectro", n: "Os Sinos Calados", ask: "*sussurra* Os sinos pararam de tocar sozinhos. Um espectro come o som. Se ele terminar, a névoa vai engolir os vivos também.", lore: "Quando o espectro some, todos os sinos tocam ao mesmo tempo. A névoa recua pela primeira vez em anos." },
    verde: { mage: "Pajé Jaci", enemy: "roc", n: "A Ave que Rouba a Chuva", ask: "Uma ave gigante prende as nuvens nas garras. A mata tem sede. Os espíritos me disseram que viria alguém do outro mar.", lore: "As nuvens se soltam e chove por três dias seguidos. A Árvore-Mãe floresce fora de época." },
    gelo: { mage: "Völva Sigrun", enemy: "golem", n: "O Golem de Gelo Eterno", ask: "Ja. Um gigante de gelo anda pelo fiorde e congela quem dorme. Nem os nossos guerreiros dão conta. Magia contra magia, ja?", lore: "Dentro do gelo do golem, uma runa quebrada com o mesmo símbolo da Torre do Silêncio." },
    ferro: { mage: "Ferreira-Bruxa Kessa", enemy: "colosso", n: "O Colosso da Cratera", ask: "Pelo martelo! Fala baixo: o rei caça magos, mas eu sou uma. Um colosso de lava acordou na cratera. Se você vencer, ninguém precisa saber de onde veio a ajuda.", lore: "O colosso desmancha em ferro negro. Kessa forja dele um broche que esconde a sua magia dos caçadores." },
    ouro: { mage: "Alquimista Topázio", enemy: "sentinela", n: "A Sentinela Dourada", ask: "Meu caro, o Imperador mandou fazer uma sentinela de ouro movida a magia roubada. Ela enlouqueceu. Eu não consigo desligá-la sozinho.", lore: "Dentro da sentinela, frascos com magia de magos presos. Você liberta todos: faíscas de cor sobem para o céu." },
    jade: { mage: "Monja Lian", enemy: "eco", n: "O Eco do Templo Vermelho", ask: "Honrado visitante, um eco repete as preces ao contrário e as lanternas vermelhas apagam. A Imperatriz quer usar esse eco como arma. Não podemos deixar.", lore: "O eco some e as mil lanternas vermelhas se acendem sozinhas. A monja se curva até o chão." },
    gigantes: { mage: "Ermitão Pedrão", enemy: "sentinela", n: "O Guardião do Gigante", ask: "Ora pois, um guardião de pedra acordou no peito do gigante e não deixa ninguém passar. Lá dentro tem algo que é seu, sinto aqui.", lore: "No peito do gigante, um cajado antigo com o nome de Odelia gravado. Ela esteve aqui, jovem, procurando o irmão." },
  };
  const HUNT = { ferro: "Caçadores do Rei-Forjador", ouro: "Guarda Dourada do Imperador", jade: "Lâminas da Imperatriz" };
  const MAGE = [17, 11];
  // esconderijos: os primeiros lugares livres de cada planta de cidade
  const CAND = [[10, 8], [33, 8], [10, 16], [33, 16], [26, 19], [8, 21], [36, 21], [14, 9], [29, 9], [16, 19]];
  const hideCache = {};
  const hidesOf = (zid) => {
    if (hideCache[zid]) return hideCache[zid];
    const z = ZONES[zid];
    // esconderijo nunca em portão, junto de cerca ou dentro de lote
    const fenceNear = (x, y) => [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => (z.map[y + dy] || "")[x + dx] === "f");
    const inPlan = (x, y) => z.town && z.town.bld.some((b) => b.plan && b.plan[x + "," + y]);
    return (hideCache[zid] = z ? CAND.filter(([x, y]) => ".,".includes(z.map[y][x]) && !fenceNear(x, y) && !inPlan(x, y)).slice(0, 5) : []);
  };
  const HIDES_ = () => hidesOf(player.zone);
  const S = () => (player.overseas = player.overseas || { done: {} });

  /* ----- missões ----- */
  function mageTalk(id) {
    const q = Q[id];
    if (S().done[id]) return say([[q.mage, "Você salvou a minha terra. Aqui você terá sempre um teto e um chá quente."]]);
    choice(q.n, `<b>${q.mage}</b>: ${q.ask}`, [
      {
        t: "Aceitar a missão (batalha)",
        icon: "sword",
        fn: () => {
          game.afterWin = () => {
            S().done[id] = player.day;
            player.gold += 150;
            if (typeof addItem === "function" && ITEMS.relicaAlem) addItem("relicaAlem", 1);
            saveGame();
            say([["", q.lore], [q.mage, "Obrigado. Leve esta relíquia e 150 de ouro. Que a magia volte a ser compartilhada, como deve ser."], ["", `Relíquias de além-mar: ${Object.keys(S().done).length}/9.`]]);
          };
          startBattle(q.enemy);
        },
      },
      { t: "Agora não", fn: null },
    ]);
  }
  const wBase = win;
  win = function () {
    const r = wBase.apply(this, arguments);
    if (game.afterWin) game.wonPending = game.afterWin;
    game.afterWin = null;
    return r;
  };
  const ebBase = endBattle;
  endBattle = function () {
    const r = ebBase.apply(this, arguments);
    const f = game.wonPending;
    game.wonPending = null;
    game.afterWin = null;
    if (f) setTimeout(f, 600);
    return r;
  };

  /* ----- caçadores de magos ----- */
  let H = null;
  function spawnHunters() {
    H = { z: player.zone, eye: 0, chase: false, list: [{ x: 6, y: 8, d: 1, row: 8 }, { x: 36, y: 16, d: -1, row: 16 }, { x: 20, y: 20, d: 1, row: 20 }] };
  }
  const hidden = () => !!game.hiding;
  const ezBase = enterZone;
  enterZone = function () {
    const r = ezBase.apply(this, arguments);
    game.hiding = false;
    if (!story() || !here()) return ((H = null), r);
    if (HUNT[here()]) {
      spawnHunters();
      if (!S()["warn" + here()]) ((S()["warn" + here()] = 1), setTimeout(() => say([["", `Cuidado: em ${cOfName()} os ${HUNT[here()]} caçam magos estrangeiros para as guerras do reino.`], ["", "Fique longe deles, use capuz ou se esconda em barris e montes de feno (E). Se o olho vermelho encher, eles correm atrás de você!"]]), 1500));
    } else H = null;
    return r;
  };
  const cOfName = () => ((window.SEA_COUNTRIES || []).find((c) => c.id === here()) || { n: "aqui" }).n;
  let acc = 0;
  const upBase = update;
  update = function (dt) {
    upBase(dt);
    if (!H || H.z !== player.zone || game.mode !== "world" || game.dialog) return;
    acc += dt;
    for (const h of H.list) ((h.rx = h.rx ?? h.x), (h.ry = h.ry ?? h.y), (h.rx += (h.x - h.rx) * Math.min(1, dt * 6)), (h.ry += (h.y - h.ry) * Math.min(1, dt * 6)));
    if (acc < 0.35) return;
    acc = 0;
    const hood = player.look && player.look.hat === "capuz";
    const range = hood ? 2.5 : 4.5;
    let seen = false;
    for (const h of H.list) {
      const d = Math.abs(h.x - player.x) + Math.abs(h.y - player.y);
      if (!hidden() && d <= range) seen = true;
      if (H.chase && !hidden()) {
        // corre atrás: um passo na direção do aprendiz
        const dx = Math.sign(player.x - h.x),
          dy = Math.sign(player.y - h.y);
        const nx = h.x + (Math.abs(player.x - h.x) >= Math.abs(player.y - h.y) ? dx : 0),
          ny = h.y + (Math.abs(player.x - h.x) >= Math.abs(player.y - h.y) ? 0 : dy);
        if (walkable(player.zone, nx, ny) || (nx === player.x && ny === player.y)) ((h.x = nx), (h.y = ny));
        if (Math.abs(h.x - player.x) + Math.abs(h.y - player.y) <= 1) return caught();
      } else {
        // patrulha a rua de lá para cá
        const nx = h.x + h.d;
        if (nx < 2 || nx > 41 || !walkable(player.zone, nx, h.row)) h.d *= -1;
        else h.x = nx;
        h.y = h.row;
      }
    }
    H.eye = Math.max(0, Math.min(1, H.eye + (seen ? 0.22 : -0.08)));
    if (H.eye >= 1 && !H.chase) ((H.chase = true), toast(`Os ${HUNT[here()]} viram você! CORRA ou se esconda!`, 3500), playSound(220, 0.3, "square"));
    if (H.chase && H.eye <= 0) ((H.chase = false), toast("Eles perderam você de vista.", 2500));
  };
  function caught() {
    H.chase = false;
    H.eye = 0;
    spawnHunters();
    const who = HUNT[here()];
    say([[who, "Mago estrangeiro! O reino precisa da sua magia na guerra. Você vem com a gente, por bem ou por mal."]], () =>
      choice("Capturad" + genderWord("o", "a", "e") + "!", "Os caçadores te cercam com correntes de ferro frio.", [
        { t: "Lutar para fugir", icon: "sword", fn: () => ((game.afterWin = () => say([["", "Você abre caminho com magia e some pelas vielas antes que chegue reforço."]])), startBattle("sentinela")) },
        { t: "Fingir aceitar e fugir de noite (perde 50 ouro)", icon: "door", fn: () => ((player.gold = Math.max(0, player.gold - 50)), typeof passTime === "function" && passTime(12, "Você passa o dia preso numa cela e foge de madrugada pelo telhado."), toast("Você escapou, mas deixou para trás parte do ouro.", 3500)) },
        { t: "Ser lev" + genderWord("ado", "ada", "ade") + " ao palácio", icon: "crown", fn: () => ((player.gold = Math.max(0, player.gold - 100)), say([["", "No palácio, o governante exige que você lute por ele. Você se recusa, e passa três dias na masmorra antes de ser expuls" + genderWord("o", "a", "e") + " do país."]], () => (typeof passTime === "function" && passTime(72, "Três dias na masmorra..."), typeof countryTown === "function" && player.zone !== "cais" && ((player.zone = "cais"), ([player.x, player.y] = [12, 9]), enterZone(true))))) },
      ]),
    );
  }

  /* ----- esconderijos, mago e desenho ----- */
  const at = (x, y, p) => x === p[0] && y === p[1];
  const hideAt = (x, y) => story() && here() && HIDES_().some((p) => at(x, y, p));
  const mageAt = (x, y) => story() && port() && Q[here()] && at(x, y, MAGE);
  const tgBase = targetAt;
  targetAt = function (x, y) {
    if (mageAt(x, y)) return S().done[here()] ? `Falar com ${Q[here()].mage}` : `${Q[here()].mage}: ${Q[here()].n}`;
    if (hideAt(x, y)) return game.hiding ? "Sair do esconderijo" : HUNT[here()] ? "Esconder-se (os caçadores não te veem)" : "Barril e feno";
    return tgBase(x, y);
  };
  const iaBase = interactAt;
  interactAt = function (x, y) {
    if (mageAt(x, y)) return mageTalk(here());
    if (hideAt(x, y)) {
      game.hiding = !game.hiding;
      if (H && game.hiding) ((H.chase = false), (H.eye = 0));
      return toast(game.hiding ? "Você se encolhe atrás do barril. Ninguém te vê." : "Você sai do esconderijo.", 2200);
    }
    return iaBase(x, y);
  };
  const wkBase = walkable;
  walkable = function (z, x, y) {
    if (story() && z && z.startsWith("pais-") && (hidesOf(z).some((p) => at(x, y, p)) || (z.split("-").length === 2 && at(x, y, MAGE)))) return false;
    return wkBase(z, x, y);
  };
  // quem está escondido não anda: o primeiro passo te tira do esconderijo
  const tmBase = tryMove;
  tryMove = function () {
    if (game.hiding) ((game.hiding = false), toast("Você sai do esconderijo.", 1500));
    return tmBase.apply(this, arguments);
  };
  const cdBase = crewDrawList;
  crewDrawList = function (list, t) {
    cdBase(list, t);
    if (!story() || !here()) return;
    const T = TILE;
    const R = (x, y, w, h, c) => ((ctx.fillStyle = c), ctx.fillRect(Math.round(x), Math.round(y), w, h));
    HIDES_().forEach(([x, y], i) =>
      list.push({
        y,
        draw: () => {
          const X = x * T,
            Y = y * T;
          R(X + 2, Y + 27, 28, 4, "rgba(0,0,0,.25)");
          if (i % 2) {
            R(X + 3, Y + 10, 26, 18, "#d9b84a");
            R(X + 5, Y + 6, 22, 6, "#e8cc6a");
            for (let k = 0; k < 6; k++) R(X + 5 + k * 4, Y + 12, 1, 14, "#b8963a");
          } else {
            R(X + 6, Y + 6, 20, 22, "#7a4f2a");
            R(X + 6, Y + 10, 20, 2, "#4a3a2a");
            R(X + 6, Y + 22, 20, 2, "#4a3a2a");
            R(X + 8, Y + 6, 3, 22, "#8a5f3a");
          }
        },
      }),
    );
    if (port() && Q[here()])
      list.push({
        y: MAGE[1],
        draw: () => {
          const X = MAGE[0] * T,
            Y = MAGE[1] * T;
          ctx.fillStyle = "rgba(0,0,0,.25)";
          ctx.beginPath();
          ctx.ellipse(X + 16, Y + 30, 9, 3, 0, 0, 7);
          ctx.fill();
          drawSprite(wizardRects("#5a2a7a", "#3a1a5a", "#d9d9d9", "#b48aff", player.x < MAGE[0] ? "left" : "right", 0), X, Y, 2, player.x < MAGE[0]);
          if (!S().done[here()]) drawPixelIcon("sparkle", X + 16, Y - 10 + Math.sin(t * 3) * 2, 2);
        },
      });
    if (H && H.z === player.zone)
      for (const h of H.list)
        list.push({
          y: h.ry,
          draw: () => {
            const X = h.rx * T,
              Y = h.ry * T;
            ctx.fillStyle = "rgba(0,0,0,.25)";
            ctx.beginPath();
            ctx.ellipse(X + 16, Y + 30, 9, 3, 0, 0, 7);
            ctx.fill();
            drawSprite(wizardRects("#2a2a2a", "#5a5a64", "#1a1a1a", null, h.d > 0 ? "right" : "left", Math.floor(t * 4) % 2), X, Y, 2, h.d < 0);
            R(X + 24, Y + 6, 2, 22, "#8a8a96");
            // o olho que vai enchendo
            const e = H.eye;
            if (e > 0.05) {
              R(X + 8, Y - 14, 16, 8, "#1a1a1a");
              R(X + 9, Y - 13, 14 * e, 6, H.chase ? "#ff3a3a" : "#e8a03a");
            }
          },
        });
  };
  if (typeof ITEMS !== "undefined" && !ITEMS.relicaAlem) ITEMS.relicaAlem = { nome: "Relíquia de Além-Mar", tipo: "mat", preco: 120, desc: "Um pedaço da história do Silêncio, achado do outro lado do mar." };
})();
