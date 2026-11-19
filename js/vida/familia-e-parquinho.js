/**
 * ECOS DO ARCANO — familia-e-parquinho.js
 *  - PARQUINHO DE VERDADE: os brinquedos do parque (balanço, escorregador,
 *    gangorra, caixa de areia, trepa-trepa e gira-gira) agora funcionam.
 *    Criança (ou adolescente) brinca: diverte muito, faz amigos e cansa.
 *    Adulto leva os filhos: as crianças da família aparecem nos brinquedos
 *    (com a cara delas) por uma hora, ficam felizes e gostam mais de você.
 *    Os bancos da praça servem para descansar olhando as crianças.
 *  - CONTROLAR A FAMÍLIA (tecla N ou Menu de Ações › Família): como no
 *    The Sims, você troca para outro membro da casa com 5 anos ou mais e
 *    passa a jogar com ele. Quem você deixou continua na família e dá para
 *    voltar para ele quando quiser. O ouro da casa é um só.
 *    (O cônjuge é morador da vila e segue a vida dele: não dá para controlar.)
 * Só no Simulador de Vida (no modo História a família não existe).
 * Modifica (envolve) targetAt, interactAt e actionsMenu.
 */

"use strict";

(() => {
  const life = () => typeof lifeMode === "function" && lifeMode();
  const NAMES = { balanco: "balanço", escorrega: "escorregador", gangorra: "gangorra", areia: "caixa de areia", trepa: "trepa-trepa", gira: "gira-gira", banco: "banco da praça" };
  const TOYS = new Set(["balanco", "escorrega", "gangorra", "areia", "trepa", "gira"]);
  const thing = (x, y) => (typeof parkThingAt === "function" ? parkThingAt(player.zone, x, y) : null);
  const isChild = () => (typeof playerAge === "function" ? playerAge() : 18) < 16;
  const littleKids = () => (player.kids || []).filter((k) => !k.isParent && !k.movedOut && typeof kidAge === "function" && kidAge(k) >= 2 && kidAge(k) < 14);

  /* ----- as crianças da família no parque ----- */
  // game.parkFam = { zone, until (relógio), toys: ["x,y", ...], kids: [look, ...] }
  const famOn = () => {
    const F = game.parkFam;
    if (!F || F.zone !== player.zone) return null;
    const now = player.day * 1440 + player.clock;
    if (now > F.until) return (game.parkFam = null), null;
    return F;
  };
  window.parkFamilyAt = (x, y) => {
    const F = famOn();
    if (!F) return 0;
    const i = F.toys.indexOf(x + "," + y);
    return i >= 0 ? i + 1 : 0;
  };
  window.parkFamilyLook = (i) => {
    const F = famOn();
    if (!F || i < 100 || !F.kids.length) return null;
    return F.kids[(i - 100) % F.kids.length];
  };
  function nearToys(x, y, n) {
    const M = (window.PARKS || {})[player.zone];
    if (!M) return [];
    const out = [];
    for (const [k, v] of M) if (TOYS.has(v)) {
      const [a, b] = k.split(",").map(Number);
      out.push([Math.hypot(a - x, b - y), k]);
    }
    return out.sort((p, q) => p[0] - q[0]).slice(0, n).map((p) => p[1]);
  }

  /* ----- o que aparece quando você chega perto de um brinquedo ----- */
  const tgBase = targetAt;
  targetAt = function (x, y) {
    const k = thing(x, y);
    if (k && life()) {
      if (k === "banco") return "Sentar no banco da praça";
      if (TOYS.has(k)) {
        if (isChild()) return `Brincar no ${NAMES[k]}`;
        if (littleKids().length) return `Levar as crianças ao ${NAMES[k]}`;
        return `Brincar no ${NAMES[k]} (ninguém está olhando...)`;
      }
    }
    return tgBase.apply(this, arguments);
  };
  const iaBase = interactAt;
  interactAt = function (x, y) {
    const k = thing(x, y);
    if (!k || !life() || !(TOYS.has(k) || k === "banco")) return iaBase.apply(this, arguments);
    const add = (n, v) => typeof addNeed === "function" && addNeed(n, v);
    if (k === "banco") {
      add("energy", 12);
      add("fun", 6);
      return passTime(0.5, "Você senta no banco e fica olhando as crianças correndo e os patos no rio.");
    }
    if (isChild()) {
      add("fun", 35);
      add("social", 15);
      add("energy", -10);
      add("hygiene", -6);
      const fala = {
        balanco: "Você balança bem alto, até quase tocar as nuvens!",
        escorrega: "Você desce o escorregador de barriga. De novo! De novo!",
        gangorra: "Uma criança da vila senta do outro lado e vocês brincam de gangorra até cansar.",
        areia: "Você constrói um castelo de areia com torre, muralha e fosso.",
        trepa: "Você sobe até o alto do trepa-trepa e grita: «Sou o rei do castelo!»",
        gira: "Vocês rodam no gira-gira até o mundo girar junto.",
      }[k];
      return passTime(0.5, fala + " Diversão +35, amigos +15.");
    }
    const kids = littleKids();
    if (!kids.length) {
      add("fun", 10);
      return passTime(0.25, `Você brinca no ${NAMES[k]}... um aldeão passa e finge que não viu.`);
    }
    // leva a família: por 1 hora os filhos aparecem nos brinquedos mais perto
    game.parkFam = { zone: player.zone, until: player.day * 1440 + player.clock + 60, toys: nearToys(x, y, kids.length), kids: kids.map((q) => q.look || {}) };
    for (const q of kids) {
      q.happy = Math.min(100, (q.happy || 50) + 20);
      q.bond = Math.min(100, (q.bond || 50) + 8);
    }
    add("fun", 18);
    add("energy", -6);
    playSound(660, 0.15, "triangle");
    toast(`${kids.map((q) => q.name).join(", ")} ${kids.length > 1 ? "correm" : "corre"} para os brinquedos! Fiquem um pouco e olhem eles brincando.`, 3800);
    if (typeof objCount === "function") objCount("familia");
  };

  /* ----- CONTROLAR A FAMÍLIA ----- */
  const NEEDS = ["energy", "fun", "hygiene", "social", "bladder", "food", "water", "hp"];
  function snapshot() {
    const me = {
      name: player.name,
      g: player.gender === "f" ? "f" : player.gender === "m" ? "m" : "n",
      look: JSON.parse(JSON.stringify(player.look || {})),
      ageBase: typeof playerAge === "function" ? playerAge() : 18,
      born2: player.day,
      born: player.day,
      isParent: !(player.ctlFrom && player.ctlFrom.length),
      grad: true,
      seenAge: typeof playerAge === "function" ? playerAge() : 18,
      spouseNpc: player.spouse || null,
      datingNpc: player.dating || null,
      job: player.job || null,
      needs: {},
    };
    for (const n of NEEDS) if (player[n] != null) me.needs[n] = player[n];
    return me;
  }
  function become(k) {
    const me = snapshot();
    const i = player.kids.indexOf(k);
    if (i < 0) return;
    player.kids.splice(i, 1, me);
    player.name = k.name;
    player.gender = k.g === "f" ? "f" : k.g === "m" ? "m" : player.gender;
    player.look = Object.assign({}, player.look, k.look || {}, k.isParent ? {} : { hat: "nenhum" });
    player.age = kidAge(k);
    player.spouse = k.spouseNpc || null;
    player.dating = k.datingNpc || null;
    player.job = k.job || null;
    for (const n of NEEDS) if (k.needs && k.needs[n] != null) player[n] = k.needs[n];
    else if (n !== "hp" && n !== "food" && n !== "water") player[n] = Math.max(player[n] || 0, 70);
    player.hp = Math.max(1, player.hp || (typeof maxHp === "function" ? maxHp() : 60));
    game.fade = 1;
    saveGame();
    playSound(523, 0.15, "triangle");
    setTimeout(() => playSound(784, 0.2, "triangle"), 140);
    const who = k.isParent ? "de volta" : `${player.age} anos`;
    say([["", `Agora você controla ${player.name} (${who}). ${me.name} continua em casa, cuidando da vida.`], ["", "Para trocar de novo: tecla N ou Menu de Ações › Família."]]);
  }
  window.familyMenu = function () {
    if (!life()) return toast("A família só existe no Simulador de Vida.", 2200);
    const opts = [];
    for (const k of player.kids || []) {
      if (k.movedOut) continue;
      const a = kidAge(k);
      const papel = k.isParent ? (k.g === "f" ? "mãe" : k.g === "m" ? "pai" : "responsável") : a < 16 ? "filho(a)" : "filho(a) adulto(a)";
      if (a < 5) opts.push({ t: `${k.name} · ${a} ano(s) · pequeno demais para controlar`, icon: "baby", fn: () => familyMenu() });
      else opts.push({ t: `Controlar ${k.name} (${papel}, ${a} anos)`, icon: "smile", fn: () => become(k) });
    }
    if (player.spouse && typeof NPCS !== "undefined" && NPCS[player.spouse]) opts.push({ t: `${NPCS[player.spouse].name || player.spouse} (cônjuge): segue a vida na vila`, icon: "heart", fn: () => familyMenu() });
    opts.push({ t: "Fechar", fn: null });
    choice("Família", opts.length > 1 ? `Você joga com ${player.name}, ${typeof playerAge === "function" ? playerAge() : ""} anos. Escolha com quem jogar agora:` : "Ainda não há ninguém na casa para controlar. Tenha ou adote um filho!", opts);
  };
  // quem você deixou de controlar (pai/mãe) não entra nas fases de filho (namoro, escola...)
  if (typeof growKids === "function") {
    const gkBase = growKids;
    growKids = function () {
      const all = player.kids || [];
      const keep = all.filter((k) => k.isParent);
      player.kids = all.filter((k) => !k.isParent);
      try {
        return gkBase.apply(this, arguments);
      } finally {
        player.kids = player.kids.concat(keep);
      }
    };
  }
  if (typeof WORLD_SHORTCUTS !== "undefined" && !WORLD_SHORTCUTS.n) WORLD_SHORTCUTS.n = () => game.mode === "world" && !game.dialog && familyMenu();
  if (typeof actionsMenu === "function") {
    const amBase = actionsMenu;
    actionsMenu = function () {
      const r = amBase.apply(this, arguments);
      if (life() && game.mode === "choice" && Array.isArray(game.choice) && !game.choice.some((o) => /Família \(N\)/.test(o.t))) {
        game.choice.splice(Math.max(0, game.choice.length - 1), 0, { t: "Família (N): controlar outro membro", icon: "house", fn: familyMenu });
        // redesenha a lista com a opção nova
        const opts = game.choice.slice();
        choice("Ações", "", opts);
      }
      return r;
    };
    if (typeof WORLD_SHORTCUTS !== "undefined") WORLD_SHORTCUTS.y = actionsMenu;
  }
})();
