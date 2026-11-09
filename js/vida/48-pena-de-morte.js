/**
 * ECOS DO ARCANO — 48-pena-de-morte.js
 *  - Pena de morte: quem mata duas vezes (ou mata alguém da realeza) vai a
 *    julgamento. Clemência, fuga ou forca. No Simulador a forca é o fim (a
 *    família continua com um herdeiro, se houver). No modo História você é
 *    mago, e mortais não matam magos: a corda arrebenta e você é exilado.
 *  - Moradores sem nome e elfos também podem morrer (crianças, nunca).
 *  - O menu pizza volta a aparecer quando um menu da mesma pessoa abre de novo.
 */

"use strict";

/* ===================== MENU PIZZA SEMPRE QUE FOR UMA PESSOA ===================== */

{
  const pieBase = renderPie;
  renderPie = function (title, text, opts) {
    const r = pieBase(title, text, opts);
    if (r && game.pieAnchor) game.lastPie = { x: game.pieAnchor.x, y: game.pieAnchor.y, name: String(title).split(/[·,]/)[0].trim(), t: performance.now() };
    return r;
  };
  const choiceBase = choice;
  choice = function (title, text, opts) {
    const L = game.lastPie;
    if (!game.pieAnchor && !game.brawl && L && performance.now() - L.t < 90000 && L.name && String(title).includes(L.name) && Math.abs(L.x - player.x) + Math.abs(L.y - player.y) <= 8) game.pieAnchor = { x: L.x, y: L.y };
    return choiceBase(title, text, opts);
  };
}

/* ===================== MORADORES SEM NOME E ELFOS ===================== */

/** Cria (ou recupera) uma ficha para quem não tem ficha própria, para poder morrer. */
function tempNpc(prefix, o) {
  const id = prefix + o.nm;
  if (!NPCS[id]) NPCS[id] = { nome: o.nm, robe: o.robe || ELF_ROBES[0], hat: o.hat || null, hair: o.hair || "#3a2414", temp: true, talk: () => [[o.nm, genLine(id)]] };
  if (!FRIENDS[id]) FRIENDS[id] = { fav: "flor", temp: true };
  return id;
}
{
  const itemsBase = walkerContactItems;
  walkerContactItems = function (wk) {
    const items = itemsBase(wk);
    const id = tempNpc("w_", wk);
    // As mesmas interações de todo mundo, em pizza ao redor do morador.
    items.unshift({ t: `Interações… (${INTERACTIONS.filter((r) => interAvailable(r, id)).length})`, icon: "chat", fn: () => ((game.ipAnchor = { x: wk.x, y: wk.y, id }), (game.pieAnchor = { x: wk.x, y: wk.y }), openInterPanel(id)) });
    items.push({ t: "Matar…", icon: "skull", fn: () => killMenu(id) });
    return items;
  };
  const elfBase = elfMenu;
  elfMenu = function (elf) {
    hookChoice(
      () => elfBase(elf),
      (title, text, opts) => {
        const id = tempNpc("e_", { nm: elf.nm, robe: ELF_ROBES[elf.nm.length % 4], hair: ELF_HAIRS[elf.nm.length % 4] });
        return [
          title,
          text,
          [{ t: `Interações… (${INTERACTIONS.filter((r) => interAvailable(r, id)).length})`, icon: "chat", fn: () => ((game.ipAnchor = { x: elf.x, y: elf.y, id }), (game.pieAnchor = { x: elf.x, y: elf.y }), openInterPanel(id)) }].concat(opts.slice(0, -1), [{ t: "Matar…", icon: "skull", fn: () => killMenu(id) }], opts.slice(-1)),
        ];
      },
    );
  };
  const posBase = victimPos;
  victimPos = function (id) {
    const nm = id.slice(2);
    if (id.startsWith("w_")) {
      const w = (game.walkers || []).find((q) => q.nm === nm);
      if (w) return { zone: player.zone, x: w.x, y: w.y };
    }
    if (id.startsWith("e_")) {
      const e = (game.elves || []).find((q) => q.nm === nm);
      if (e) return { zone: player.zone, x: e.x, y: e.y };
    }
    return posBase(id);
  };
  const killBase = killNpc;
  killNpc = function (id, how) {
    killBase(id, how);
    const d = deadList()[id];
    if (d && NPCS[id] && NPCS[id].temp) d.npc = { nome: NPCS[id].nome, robe: NPCS[id].robe, hat: NPCS[id].hat, hair: NPCS[id].hair, temp: true };
  };
}
/** Quem morreu sai da rua (e volta a ter ficha depois de recarregar o jogo). */
function purgeTemps() {
  for (const [id, d] of Object.entries(player.dead || {})) if (d.npc && !NPCS[id]) NPCS[id] = d.npc;
  if (!player.dead) return;
  if ((game.walkers || []).some((w) => player.dead["w_" + w.nm])) game.walkers = game.walkers.filter((w) => !player.dead["w_" + w.nm]);
  if ((game.elves || []).some((e) => player.dead["e_" + e.nm])) game.elves = game.elves.filter((e) => !player.dead["e_" + e.nm]);
}

/* ===================== PENA DE MORTE ===================== */

const ROYAL_BLOOD = new Set(["rainha", "pedro", "mylena", "matheus", "malu", "julia", "vini", "juliaO"]);
{
  const foundBase = murderFound;
  murderFound = function (id) {
    const d = deadList()[id];
    if (!d) return;
    const severe = (player.murders || 0) >= 2 || ROYAL_BLOOD.has(id);
    if (!severe) return foundBase(id);
    d.found = true;
    hateEveryone(20);
    vilaNews(`${shortName(id)} foi assassinad${gw(id, "o", "a")}! ${player.name} vai a julgamento e pode pegar a pena de morte.`);
    trial(id);
  };
}
function trial(id) {
  const n = shortName(id);
  const crimes = player.murders || 1;
  const judge = rulesK && rulesK("aurelia") ? "Conselho dos Anciãos" : "Rainha Aurélia";
  game.fade = 1;
  say(
    [
      ["Guarda Tomé", `${player.name}, você está pres${genderWord("o", "a", "e")}. Desta vez não é só calabouço.`],
      ["", "No dia seguinte, a praça do castelo está lotada. Uma forca foi montada na escadaria."],
      [judge, `${player.name}, você é acusad${genderWord("o", "a", "e")} de ${crimes > 1 ? `${crimes} assassinatos, o último` : "assassinato"} contra ${n}${ROYAL_BLOOD.has(id) ? ", sangue da realeza" : ""}.`],
      ["Multidão", pk(["FORCA! FORCA!", "Assassin" + genderWord("o", "a", "e") + "!", "Justiça para " + n + "!"])],
      [judge, "A sentença é a morte. Tem algo a dizer antes que eu bata o martelo?"],
    ],
    () =>
      choice("A sentença", `Crimes: ${crimes} morte(s). Reputação: 0. Ninguém na vila quer te defender.`, [
        {
          t: "Pedir clemência",
          icon: "heart",
          fn: () => {
            const friends = Object.keys(FRIENDS).filter((k) => !isDead(k) && (player.rel[k] || 0) >= 50).length;
            const ch = 0.08 + Math.min(0.3, friends * 0.05) + (crimes === 1 ? 0.1 : 0);
            if (Math.random() < ch) {
              say([[judge, "...A sentença está trocada. Prisão perpétua não existe nesta vila, então: uma semana no calabouço e exílio da sua dignidade."], ["Multidão", "Buuuu!"]], () => startJail(24 * 7, `assassinato de ${n} (clemência)`));
            } else say([[judge, "Clemência negada."]], () => execution(id));
          },
        },
        {
          t: "Tentar fugir da forca",
          icon: "door",
          fn: () => {
            if (Math.random() < (lifeMode() ? 0.15 : 0.6)) {
              player.hatedUntil = player.day + 30;
              player.outlaw = true;
              vilaNews(`${player.name} fugiu da forca! Procurad${genderWord("o", "a", "e")} vivo ou morto.`);
              saveGame();
              say([["", lifeMode() ? "Você empurra o carrasco, pula da escadaria e some pelos telhados da vila!" : "Um raio de magia rompe as cordas. Você some numa nuvem de fumaça violeta."], ["Guarda Tomé", "PEGUEM! Não deixem escapar!"], ["", "Você é agora um fora da lei. A vila inteira te odeia por 30 dias."]]);
            } else say([["", "Você corre... e tropeça na própria corda. Os guardas te seguram."]], () => execution(id));
          },
        },
        { t: "Aceitar a sentença", icon: "skull", fn: () => execution(id) },
      ]),
  );
}
function execution(id) {
  game.shake = 0.4;
  playSound(90, 0.8, "sawtooth");
  if (!lifeMode()) {
    // Mortais não matam magos.
    player.hatedUntil = player.day + 30;
    player.exiled = player.day;
    vilaNews(`A forca não matou ${player.name}. Magos não morrem pelas mãos de mortais. Exilad${genderWord("o", "a", "e")}!`);
    say(
      [
        ["", "O carrasco puxa a alavanca. A corda estica... e arrebenta, soltando faíscas."],
        ["Arquimaga Odelia (eco)", "Mortais não matam magos. Você sabe disso."],
        ["Rainha Aurélia", "Então que seja o exílio! Saia de Cinzaluz e não volte tão cedo!"],
        ["", "Você foi exilad" + genderWord("o", "a", "e") + " para o Bosque. A vila te odeia por 30 dias."],
      ],
      () => {
        player.zone = "bosque";
        const z = ZONES.bosque;
        const s = (z.spawn && z.spawn[0]) || [5, 5];
        player.x = s[0];
        player.y = s[1];
        game.fade = 1;
        enterZone();
        saveGame();
      },
    );
    return;
  }
  const name = player.name;
  const list = typeof heirs === "function" ? heirs() : [];
  const lines = [
    ["", "O tambor rufa. O carrasco ajusta a corda."],
    ["", `${name} foi executad${genderWord("o", "a", "e")} na escadaria do castelo, diante da vila inteira.`],
    ["Padre Anselmo", "Que as runas tenham piedade de quem não teve piedade."],
  ];
  if (!list.length) {
    clearSave();
    say(lines.concat([["", "Sem herdeiros, esta história termina aqui. FIM. (Comece um novo jogo para tentar outra vida.)"]]), () => location.reload());
    return;
  }
  say(lines.concat([["", "A família carrega a vergonha do nome. Um filho adulto continua a história."]]), () =>
    choice(
      "Quem continua a família?",
      "O herdeiro começa com a reputação manchada pelo crime da família.",
      list.map((k) => ({
        t: `${k.name} · ${kidAge(k)} anos`,
        fn: () => {
          continueAsHeir(k, Math.floor(player.gold * 0.5));
          player.jail = null;
          player.hatedUntil = player.day + 7;
          player.rep = 10;
          player.murders = 0;
          player.zone = "vila";
          [player.x, player.y] = [5, 18];
          game.fade = 1;
          enterZone(false);
          saveGame();
        },
      })),
    ),
  );
}

/* ===================== LIGAÇÕES ===================== */

{
  const updBase = update;
  update = function (dt) {
    updBase(dt);
    if (game.mode !== "title") purgeTemps();
  };
}
// O menu Matar… agora abre em pizza ao redor da pessoa.
{
  const killBase = killMenu;
  killMenu = function (id) {
    const a = game.pieAnchor || (game.lastPie && { x: game.lastPie.x, y: game.lastPie.y });
    killBase(id);
    if (a && game.mode === "choice" && !game.pieAnchor) {
      game.pieAnchor = a;
      choice(`Matar ${shortName(id)}?`, "", game.choice);
    }
  };
}
