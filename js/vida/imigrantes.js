/**
 * ECOS DO ARCANO — imigrantes.js  (Simulador de Vida)
 * Gente de além-mar vem morar em Cinzaluz.
 *  - Toda semana chegam imigrantes dos nove países (mais quando o reino vai
 *    bem e as fronteiras estão abertas; ninguém quer vir para um reino sujo
 *    ou em guerra). Quando o reino vai mal, eles também vão embora.
 *  - Na rua eles andam com as roupas da sua terra, têm nomes de lá e falam
 *    com o sotaque de casa ("Na minha terra..."), contam saudade e
 *    costumes, e alguns abrem barraca, trabalham na lavoura ou na forja.
 *  - Quem governa decide as FRONTEIRAS: abertas (vem muita gente, mais
 *    trabalho e imposto, um pouco de briga no começo), controladas ou
 *    fechadas (quase ninguém entra; os outros países acham ruim).
 *  - Às vezes os imigrantes fazem a festa da terra deles na praça.
 *  - Os imigrantes também seguram a vila de pé: com eles, a população
 *    demora mais a sumir quando o reino é mal cuidado.
 * Modifica (envolve) funções de outros arquivos: onNewDay, enterZone,
 * choice (menu de governo).
 */

"use strict";

(() => {
  const C = {
    coral: { n: "Coralina", robes: ["#e86a5a", "#f2c14e", "#3ab0a0"], hat: null, names: ["Kaila", "Moana", "Iolo", "Lani"], say: ["Na minha terra a gente dança antes do jantar. Aqui todo mundo janta correndo!", "Sinto falta do barulho do mar à noite.", "Ocê já comeu peixe no coco? Um dia eu faço."] },
    zahar: { n: "Zahar", robes: ["#efe8d8", "#d9c08a", "#3a4a8a"], hat: "#efe8d8", names: ["Amira", "Karim", "Layla", "Tarek"], say: ["Ya, aqui chove demais! No deserto a gente agradece cada gota.", "Abri uma barraca de chá de hortelã perto da fonte. Passa lá!", "Aqui o vinho é liberado... ainda não me acostumei."] },
    brumas: { n: "Brumária", robes: ["#5a5a6a", "#3a3a4a"], hat: "#3a3a4a", names: ["Eira", "Morwen", "Tulo", "Brena"], say: ["*sussurra* ...aqui ninguém acende vela para os mortos... que estranho...", "O sol de vocês é forte demais para os meus olhos...", "Eu ouço os sinos da minha terra quando sonho..."] },
    verde: { n: "Verdemata", robes: ["#3a7a3a", "#7a5a32", "#c9a050"], hat: null, names: ["Araci", "Tainá", "Iberê", "Potira"], say: ["Hum-hum. Tu cortaste aquela árvore sem pedir licença? Que coisa.", "Trouxe sementes de cacau. Vou plantar no Campo do Leste.", "A mata daqui é pequena, mas é bonita."] },
    gelo: { n: "Gelomar", robes: ["#8a6a4a", "#5a4a3a", "#c9c0b0"], hat: "#8a6a4a", names: ["Astrid", "Bjorn", "Freya", "Leif"], say: ["Ja! Aqui o inverno é uma piada. Eu ando de manga curta, ja?", "Trabalho na forja do Brann agora. Ele martela bem, para um sulista.", "Quem quer mergulhar no rio comigo amanhã cedo? Ninguém? Ja."] },
    ferro: { n: "Ferrofundo", robes: ["#4a4040", "#6a4a3a"], hat: "#5a5a64", names: ["Torg", "Marga", "Durin", "Kessa"], say: ["Pela bigorna! Aqui ninguém trabalha antes do galo?", "Fugi do Rei-Forjador. Ele queria minha filha na guerra.", "As espadas daqui são moles. Eu conserto, se quiser."] },
    ouro: { n: "Áurea", robes: ["#c9a040", "#7a3ab0"], hat: "#f2c14e", names: ["Dourada", "Topázio", "Brilha", "Solano"], say: ["Meu caro, aqui ninguém se curva para ninguém. Que liberdade!", "Vim fugido do imposto do Imperador. Aqui é bem mais barato.", "Seu rio tem ouro? Não? Que pena."] },
    jade: { n: "Jadeluz", robes: ["#c94a3a", "#2a8a6a", "#1a3a5a"], hat: "#d9c08a", names: ["Lian", "Mei", "Shen", "Yun"], say: ["Honrado vizinho, ensinei o Gus a fazer chá do jeito certo. *curva-se*", "As cerejeiras da minha terra já devem ter florido.", "Aqui todo mundo fala alto. Mas é gente boa."] },
    gigantes: { n: "Gigântia", robes: ["#8a8474", "#6a6a5a"], hat: null, names: ["Pedrão", "Musgo", "Lasca"], say: ["Ora pois, vosmecê nunca viu um gigante? Eu vi um mexer o dedo.", "Saí da ilha depois de trinta anos sozinho. Tanta gente aqui!", "Canto baixinho de noite, por costume. Não liga."] },
  };
  const IDS = Object.keys(C);
  const JOBS = ["lavrador(a) nos Campos do Leste", "ajudante na Ferraria do Leste", "vendedor(a) de chá na praça", "tecelã(o) na Tecelagem Nova", "pescador(a) no rio", "cozinheira(o) na taverna", "pastor(a) das ovelhas", "carregador(a) no armazém"];
  // as casas do Bairro Novo (Campos do Leste) viram as casas dos imigrantes
  const HOUSES = () => ZONES.vila.town.bld.filter((b) => b.id && /^le(1[3-9]|20)$/.test(b.id));
  function homeOf(b) {
    const L = (player.imm && player.imm.list) || [];
    const i = HOUSES().indexOf(b);
    return i >= 0 && L[i] ? L[i] : null;
  }
  const S = () => (player.imm = player.imm || { list: [], border: "controladas", fest: 0 });
  const avg = () => {
    const r = player.realm;
    return r ? (r.limp + r.seg + r.edu + r.saude + r.social + (r.agua ?? 60)) / 6 : 60;
  };
  window.immigrantCount = () => (player.imm ? player.imm.list.length : 0);

  const ndBase = onNewDay;
  onNewDay = function () {
    const r = ndBase.apply(this, arguments);
    if (!lifeMode()) return r;
    const I = S(),
      a = avg();
    const war = typeof kingdomAtWar === "function" && kingdomAtWar("aurelia");
    const pull = { abertas: 1.6, controladas: 0.8, fechadas: 0.1 }[I.border] * (a / 60) * (war ? 0.3 : 1) * (player.dis && player.dis.extinct ? 0.2 : 1);
    // chegadas
    let came = 0;
    if (Math.random() < Math.min(0.9, 0.35 * pull) && I.list.length < 30) {
      const n = 1 + (Math.random() < pull * 0.3 ? 1 : 0) + (Math.random() < pull * 0.15 ? 1 : 0);
      for (let i = 0; i < n; i++) {
        const c = pk(IDS);
        I.list.push({ c, nm: `${pk(C[c].names)} de ${C[c].n}`, since: player.day, job: pk(JOBS) });
        came++;
      }
    }
    // partidas quando a vida aperta
    let left = 0;
    if (a < 35) for (let i = I.list.length - 1; i >= 0; i--) if (Math.random() < 0.25) (I.list.splice(i, 1), left++);
    if (came) setTimeout(() => toast(`Chegaram ${came} imigrante(s) de além-mar a Cinzaluz. (${I.list.length} no total)`, 4200), 5600);
    if (left) setTimeout(() => toast(`${left} imigrante(s) foram embora: o reino está mal cuidado.`, 4200), 6000);
    // efeitos: mais gente trabalhando e pagando imposto; um pouco de atrito com fronteira aberta
    if (player.realm && I.list.length) {
      if (typeof playerRules === "function" && playerRules()) player.gold += I.list.length * 3;
      if (I.border === "abertas" && I.list.length > 15 && Math.random() < 0.2) ((player.realm.social = Math.max(0, player.realm.social - 2)), setTimeout(() => toast("Discussão na feira entre moradores antigos e novos. O governo precisa integrar o povo.", 4500), 7000));
      else player.realm.social = Math.min(100, player.realm.social + Math.min(2, I.list.length * 0.1));
    }
    // a festa da terra deles na praça
    if (I.list.length >= 5 && player.day - I.fest > 6 && Math.random() < 0.3) {
      I.fest = player.day;
      const c = pk([...new Set(I.list.map((q) => q.c))]);
      I.festC = c;
      setTimeout(() => toast(`Hoje os imigrantes de ${C[c].n} fazem a festa da terra deles na praça! Comida e música de lá.`, 5000), 8000);
      if (typeof vilaNews === "function") vilaNews(`Festa de ${C[c].n} na praça de Cinzaluz: os imigrantes trouxeram música e comida da terra deles.`);
    }
    // fechar a fronteira pesa na relação com os outros reinos
    if (I.border === "fechadas" && typeof worldState === "function") for (const [p1, p2] of KINGDOM_PAIRS) if (p1 === "aurelia" || p2 === "aurelia") worldState().rel[pairKey(p1, p2)] = Math.max(0, worldState().rel[pairKey(p1, p2)] - 0.5);
    return r;
  };

  // na rua: imigrantes com a roupa da terra e falas com sotaque
  const ezBase = enterZone;
  enterZone = function () {
    const r = ezBase.apply(this, arguments);
    if (!lifeMode() || player.zone !== "vila" || !player.imm || !game.walkers || !game.walkers.length) return r;
    const L = player.imm.list.slice(0, 14);
    L.forEach((q, i) => {
      const w = game.walkers[(i * 3 + 1) % game.walkers.length];
      if (!w || w.imm) return;
      const c = C[q.c];
      w.imm = q.c;
      w.robe = c.robes[i % c.robes.length];
      w.hat = c.hat;
      w.nm = q.nm;
      w.line = pk(c.say);
      w.elf = false;
    });
    return r;
  };
  // conversar com um imigrante: a fala dele vem da terra dele
  if (typeof genLine === "function") {
    const glBase = genLine;
    genLine = function (id) {
      if (lifeMode() && player.zone === "vila" && player.imm && player.imm.list.length && Math.random() < Math.min(0.35, player.imm.list.length / 40)) {
        const q = pk(player.imm.list);
        return pk(C[q.c].say);
      }
      return glBase.apply(this, arguments);
    };
  }

  // fronteiras no menu de governo
  function borderMenu() {
    const I = S();
    choice("Fronteiras de Aurélia", `Imigrantes morando em Cinzaluz: <b>${I.list.length}</b>. Fronteiras: <b>${I.border}</b>.`, [
      { t: "Abertas: vem muita gente (mais trabalho e imposto, algum atrito)", icon: "door", fn: () => ((I.border = "abertas"), toast("Fronteiras abertas. Que venham!", 2500)) },
      { t: "Controladas: entra quem tem ofício", icon: "scroll", fn: () => ((I.border = "controladas"), toast("Fronteiras controladas.", 2500)) },
      { t: "Fechadas: quase ninguém entra (os vizinhos acham ruim)", icon: "lock", fn: () => ((I.border = "fechadas"), toast("Fronteiras fechadas.", 2500)) },
      { t: "Voltar", fn: () => typeof politicsMenu === "function" && politicsMenu() },
    ]);
  }
  window.borderMenu = borderMenu;
  if (typeof bldAction === "function") {
    const baBase = bldAction;
    bldAction = function (b) {
      const q = lifeMode() && player.zone === "vila" && b && homeOf(b);
      if (q) {
        const c = C[q.c];
        return say([[q.nm, pk(c.say)], ["", `${q.nm.split(" de ")[0]} mora aqui desde o dia ${q.since} e trabalha como ${q.job}.`]]);
      }
      return baBase.apply(this, arguments);
    };
  }
  if (typeof targetAt === "function") {
    const tgBase = targetAt;
    targetAt = function (x, y) {
      if (lifeMode() && player.zone === "vila" && tileAt("vila", x, y) === "D") {
        const b = ZONES.vila.town.doors[x + "," + y];
        const q = b && homeOf(b);
        if (q) return `Casa de ${q.nm}`;
      }
      return tgBase(x, y);
    };
  }
  const chBase = choice;
  choice = function (title, text, opts) {
    if (title === "Política" && lifeMode() && Array.isArray(opts) && !opts.some((o) => /Imigração/.test(o.t))) {
      const I = S();
      const it = typeof playerRules === "function" && playerRules() ? { t: `Imigração e fronteiras (${I.list.length} imigrantes)`, icon: "door", fn: borderMenu } : { t: `Ver os imigrantes da vila (${I.list.length})`, icon: "smile", fn: () => say([["", I.list.length ? `Moram em Cinzaluz: ${[...new Set(I.list.map((q) => C[q.c].n))].map((n) => `${I.list.filter((q) => C[q.c].n === n).length} de ${n}`).join(", ")}.` : "Ainda não chegou ninguém de além-mar."], ...I.list.slice(0, 6).map((q) => ["", `${q.nm}: ${q.job}${HOUSES().some((b) => homeOf(b) === q) ? " · mora no Bairro Novo" : ""}.`])]) };
      opts = opts.slice(0, -1).concat([it, opts[opts.length - 1]]);
    }
    return chBase.call(this, title, text, opts);
  };
})();
