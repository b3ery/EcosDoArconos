/**
 * ECOS DO ARCANO — iluministas-e-conselho.js
 *  - Golpe solo: dá para derrubar a coroa sozinh@, sem aliados (planta do
 *    castelo, treino, chave roubada, sonífero na guarda) e manter a monarquia.
 *  - Os Iluministas também tentam o golpe por conta própria. A força deles
 *    cresce com protestos, impostos altos e governante impopular. Você pode
 *    defender a coroa, se juntar a eles ou ficar em casa.
 *  - Se eles vencem: Conselho do Povo, com eleição a cada 15 dias. Eleit@,
 *    você pode até convocar um plebiscito e restaurar a monarquia.
 *  - Quem governa pode manter a monarquia: conceder um conselho consultivo,
 *    prender os líderes, dar banquetes. E um nobre rival trama nas sombras.
 * Modifica (envolve) funções de outros arquivos: coupNight, coupWin, onNewDay, plotMenu, royalMenu, supportTotal, syncRulers, update.
 */

"use strict";


/* ===================== GOLPE SOLO ===================== */

function soloP() {
  const P = plot();
  return (P.solo = P.solo || { map: 0, train: 0, key: 0, sleep: 0, day: {} });
}
{
  const supBase = supportTotal;
  supportTotal = function () {
    let s = supBase();
    const P = player.plot;
    if (!P || !P.solo) return s;
    const S = P.solo;
    s += S.map * 6 + S.train * 5 + (S.key ? 12 : 0) + (S.sleep ? 10 : 0);
    if (!P.allies.length && S.map >= 2) s += 10; // ninguém para dar com a língua nos dentes
    return Math.min(100, Math.round(s));
  };
}
function soloOnce(k) {
  const S = soloP();
  if (S.day[k] === player.day) {
    say([["", "Você já fez isso hoje. Amanhã de novo, senão a guarda desconfia."]], plotMenu);
    return false;
  }
  S.day[k] = player.day;
  return true;
}
const SOLO_ACTIONS = () => {
  const S = soloP();
  const out = [];
  if (S.map < 3)
    out.push({
      t: `Estudar a planta do castelo, sozinh${genderWord("o", "a", "e")} (${S.map}/3)`,
      icon: "scroll",
      fn: () => {
        if (!soloOnce("map")) return;
        S.map++;
        if (raiseSus(3)) return;
        passTime(2, "Duas horas desenhando corredores num pedaço de pergaminho...");
        saveGame();
        say([["", pk(["Você conta as janelas e as trocas de guarda. Tem uma passagem atrás da cozinha!", "Um mapa velho na biblioteca mostra um túnel até o salão.", "Você descobre que a guarda da torre leste dorme às 3h."])]], plotMenu);
      },
    });
  if (S.train < 3)
    out.push({
      t: `Treinar com a espada à noite (${S.train}/3)`,
      icon: "sword",
      fn: () => {
        if (!soloOnce("train")) return;
        if (lifeMode() && lifeNeed("energy") < 25) return say([["", "Você está cansad" + genderWord("o", "a", "e") + " demais para treinar."]], plotMenu);
        S.train++;
        if (lifeMode()) addNeed("energy", -25);
        passTime(2, "Duas horas golpeando um boneco de palha atrás do celeiro...");
        saveGame();
        say([["", "Seus braços doem, mas seus golpes estão bem mais rápidos."]], plotMenu);
      },
    });
  if (!S.key)
    out.push({
      t: "Roubar a chave do portão do castelo (arriscado)",
      icon: "lock",
      fn: () => {
        if (!soloOnce("key")) return;
        if (Math.random() < 0.5 + S.map * 0.08) {
          S.key = 1;
          saveGame();
          say([["", "Enquanto o Guarda Tomé cochila, você troca a chave dele por uma igualzinha de lata. Perfeito."]], plotMenu);
        } else {
          if (raiseSus(25, "O Guarda Tomé")) return;
          say([["Guarda Tomé", "Ei! O que você tá fazendo perto do meu cinto?!"], ["", "Você disfarça... mas a suspeita subiu muito (+25)."]], plotMenu);
        }
      },
    });
  if (!S.sleep)
    out.push({
      t: "Comprar sonífero para o vinho da guarda (60 ouro)",
      icon: "bag",
      fn: () => {
        if (player.gold < 60) return say([["", "Você não tem 60 de ouro."]], plotMenu);
        player.gold -= 60;
        S.sleep = 1;
        if (raiseSus(10)) return;
        saveGame();
        say([["Curandeira Maíra", "Sonífero? Pra dormir melhor, né? ...Né?"], ["", "Na noite do golpe, a guarda vai bocejar bastante."]], plotMenu);
      },
    });
  return out;
};
{
  const pmBase = plotMenu;
  plotMenu = function () {
    if (game.council && !rulesK("aurelia")) {
      /* ok: dá para derrubar o Conselho também */
    }
    hookChoice(pmBase, (title, text, opts) => {
      if (!/Conspiração/.test(title)) return [title, text, opts];
      const at = opts.findIndex((o) => /golpe/i.test(o.t) && /DAR|Dar/.test(o.t));
      opts.splice(Math.max(1, at), 0, ...SOLO_ACTIONS());
      text += `<br><small>Dá para fazer tudo sozinh${genderWord("o", "a", "e")}: planta do castelo, treino, chave e sonífero contam como apoio.</small>`;
      if (player.council) title = "Conspiração contra o Conselho do Povo";
      return [title, text, opts];
    });
  };
}
/* A noite do golpe sem aliados: furtividade em vez de exército. */
function soloCoupNight() {
  const P = plot(),
    S = soloP();
  const power = supportTotal();
  const roll = (b) => Math.random() * 100 < Math.max(8, Math.min(95, power + b));
  const g = genderWord("o", "a", "e");
  const stage3 = () =>
    choice("O quarto real", `${player.council ? "O Conselho está reunido no salão, à luz de velas." : "A Rainha Aurélia acorda com você ao pé da cama."} Só você e ${player.council ? "eles" : "ela"}.`, [
      { t: "Erguer a espada e exigir a coroa", icon: "sword", fn: () => (roll(S.train * 6) ? coupWin("prisão") : coupFail("Ela grita, e a guarda inteira acorda.")) },
      { t: "Oferecer exílio em paz", icon: "flower", fn: () => (roll(5) ? coupWin("exílio") : coupFail("Ela recusa e toca o sino de emergência!")) },
      { t: "Convencer com um discurso", icon: "crown", fn: () => (roll((player.rep ?? 50) / 4 - 8) ? coupWin("discurso") : coupFail("Ninguém nunca venceu um golpe com palavras sozinh" + g + ".")) },
    ]);
  const stage2 = () =>
    choice("Os corredores", "Tochas, passos de guarda e um gato que não para de te encarar.", [
      ...(S.sleep ? [{ t: "Passar pelos guardas dormindo (sonífero)", icon: "zzz", fn: () => say([["", "Os guardas roncam abraçados nas lanças. Você passa na ponta dos pés."]], stage3) }] : []),
      { t: "Esgueirar-se pelas sombras", icon: "eye", fn: () => (roll(S.map * 6) ? say([["", "Você conhece cada canto. Ninguém te vê."]], stage3) : coupFail("O gato miou. Alto. Muito alto.")) },
      { t: "Derrubar o guarda do corredor", icon: "sword", fn: () => (roll(S.train * 7 - 10) ? say([["", "Um golpe certeiro e o guarda apaga em silêncio."]], stage3) : coupFail("O guarda era maior do que parecia.")) },
    ]);
  game.fade = 1;
  say([["", `Meia-noite. Sozinh${g}, capuz na cabeça, você encara as muralhas do castelo. Ninguém sabe do plano: ninguém pode te trair.`]], () =>
    choice("A muralha", `Força do golpe: ${power}%`, [
      ...(S.key ? [{ t: "Abrir o portão com a chave roubada", icon: "lock", fn: () => say([["", "Clique. O portão abre sem um rangido."]], stage2) }] : []),
      ...(S.map >= 2 ? [{ t: "Entrar pela passagem secreta da cozinha", icon: "door", fn: () => (roll(15) ? say([["", "A passagem cheira a cebola, mas leva direto para dentro."]], stage2) : coupFail("A passagem estava trancada por dentro.")) }] : []),
      { t: "Escalar o muro", icon: "flag", fn: () => (roll(-10 + S.train * 3) ? say([["", "Mãos firmes, pés leves. Você está dentro."]], stage2) : coupFail("A corda arrebentou e você caiu bem em cima de um guarda.")) },
    ]),
  );
}
{
  const cnBase = coupNight;
  coupNight = function () {
    const P = plot();
    if (!P.allies.length) return soloCoupNight();
    return cnBase();
  };
  const cwBase = coupWin;
  coupWin = function (how) {
    const solo = player.plot && !player.plot.allies.length;
    const wasCouncil = !!player.council;
    player.council = null;
    const r = cwBase(how);
    const d = game.dialog;
    if (d) {
      if (solo) {
        d.lines = d.lines.filter((l) => l[0] !== "Luca");
        d.lines.splice(d.lines.length - 1, 0, ["", `Sem aliados, sem dívidas: a coroa é só sua. Cinzaluz continua uma monarquia, com ${genderWord("um Rei", "uma Rainha", "uma Majestade")} que fez tudo sozinh${genderWord("o", "a", "e")}.`]);
        player.soloCoup = true;
      }
      if (wasCouncil) {
        d.lines[0] = ["Luca", "O CONSELHO DO POVO... dissolvido?! Isso é um golpe contra a democracia! ...Que eu também dei. Justo."];
        vilaNews(`Fim do Conselho do Povo! ${player.name} restaurou a monarquia.`);
      }
    }
    player.ilumPow = Math.max(0, (player.ilumPow || 30) - 10);
    return r;
  };
}

/* ===================== OS ILUMINISTAS TAMBÉM DÃO GOLPE ===================== */

const ILUM_LEADERS = ["luca", "lucas"];
function ilumAlive() {
  return ILUM_LEADERS.filter((id) => NPCS[id] && !(typeof isDead === "function" && isDead(id)));
}
function ilumPow() {
  return player.ilumPow ?? 25;
}
function ilumAdd(v) {
  player.ilumPow = Math.max(0, Math.min(100, ilumPow() + v));
}
{
  const dayBase = onNewDay;
  onNewDay = function () {
    dayBase.apply(this, arguments);
    if (!lifeMode()) return;
    // Golpe marcado e ninguém viu (você dormiu): resolve sozinho.
    if (player.ilumCoupDay && player.ilumCoupDay < player.day) ilumCoupResolve(Math.random() * 100 < ilumPow() - 10, null);
    if (player.council) return electionDaily();
    if (!ilumAlive().length) return;
    let g = 2 + Math.min(8, ilumCount() * 1.5);
    if (player.protestLast === player.day - 1) g += 4;
    if (rulesK("aurelia")) {
      if (player.royalTax === "alto") g += 4;
      if ((player.rep ?? 50) < 35) g += 3;
      if (player.ilumConcession) g -= 3;
    }
    ilumAdd(g);
    if (ilumPow() >= 55 && !player.ilumCoupDay && Math.random() < 0.3) {
      player.ilumCoupDay = player.day;
      vilaNews("Boatos: os Iluministas estão juntando tochas e cordas. Algo vai acontecer à noite...");
      setTimeout(() => toast("Boato na vila: os Iluministas planejam alguma coisa para hoje à noite!", 4600), 6000);
    }
  };
}
function ilumCoupTick() {
  if (!lifeMode() || !player.ilumCoupDay || player.ilumCoupDay !== player.day) return;
  if (currentHour() < 23 || game.mode !== "world" || game.dialog || game.dying) return;
  ilumCoupEvent();
}
function ilumCoupEvent() {
  const L = ilumAlive().map(shortName).join(" e ") || "Os Iluministas";
  const mine = rulesK("aurelia");
  const pow = ilumPow();
  game.shake = 0.3;
  playSound(200, 0.4, "sawtooth");
  if (mine) {
    choice("GOLPE DOS ILUMINISTAS!", `${L} e uma multidão com tochas cercam o castelo gritando "CONSELHO JÁ!". Força deles: ${pow}%. Seu exército: ${army()}.`, [
      { t: "Defender o castelo com a guarda", icon: "sword", fn: () => ilumCoupResolve(Math.random() * 100 < pow - army() / 2 - (player.rep ?? 50) / 4 + 10, "defender") },
      {
        t: "Negociar: um Conselho Consultivo, mas a coroa fica comigo",
        icon: "scroll",
        fn: () => {
          if (Math.random() < 0.7) {
            player.ilumCoupDay = null;
            player.ilumConcession = player.day;
            ilumAdd(-50);
            repAdd(5);
            vilaNews(`${player.name} negociou com os Iluministas: haverá um Conselho Consultivo, mas a monarquia continua.`);
            say([["Luca", "Um conselho que dá conselhos? ...Tá bom, é um começo. Mas a gente vai cobrar!"], ["", "A multidão aplaude e volta para casa. A coroa continua sua."]]);
            saveGame();
          } else ilumCoupResolve(true, "negociar");
        },
      },
      { t: "Fugir com o tesouro", icon: "coin", fn: () => ((player.gold += 150), ilumCoupResolve(true, "fugir")) },
    ]);
    return;
  }
  const ruler = player.council ? "o Conselho" : "a Rainha Aurélia";
  choice("GOLPE DOS ILUMINISTAS!", `Sinos tocando! ${L} lideram uma multidão com tochas contra ${ruler}. Força deles: ${pow}%.`, [
    {
      t: "Ajudar a guarda a defender o castelo",
      icon: "sword",
      fn: () => {
        const lost = Math.random() * 100 < pow - 25;
        if (!lost) {
          addFriendship("rainha", 15);
          repAdd(4);
          for (const id of ILUM_LEADERS) addFriendship(id, -20);
        }
        ilumCoupResolve(lost, "defender");
      },
    },
    {
      t: "Juntar-se aos Iluministas",
      icon: "flag",
      fn: () => {
        player.ilum = true;
        for (const id of ILUM_LEADERS) addFriendship(id, 15);
        const won = Math.random() * 100 < pow + 15;
        if (!won) {
          ilumCoupResolve(false, "juntar");
          return setTimeout(() => arrested("A Rainha"), 400);
        }
        ilumCoupResolve(true, "juntar");
      },
    },
    { t: "Ficar em casa e espiar pela janela", icon: "house", fn: () => ilumCoupResolve(Math.random() * 100 < pow - 10, "casa") },
  ]);
}
function ilumCoupResolve(won, how) {
  player.ilumCoupDay = null;
  const L = ilumAlive().map(shortName).join(" e ") || "Os Iluministas";
  if (!won) {
    ilumAdd(-45);
    vilaNews(`O golpe dos Iluministas fracassou! ${L} passaram a noite no calabouço.`);
    if (how) say([["", "A guarda dispersa a multidão. Tochas apagadas, cartazes rasgados."], ["Luca", "Isso não acaba aqui! A razão sempre volta!"]]);
    saveGame();
    return;
  }
  const wasMine = rulesK("aurelia");
  if (wasMine) {
    delete throne().aurelia;
  }
  player.council = { day: player.day, chief: "luca", next: player.day + YEAR_DAYS, member: how === "juntar" };
  player.ilumPow = 30;
  syncRulers();
  repAdd(wasMine ? -8 : 0);
  vilaNews(`REVOLUÇÃO! ${L} derrubaram ${wasMine ? player.name : "a Rainha Aurélia"}. Cinzaluz agora tem um Conselho do Povo!`);
  if (typeof announceWorld === "function") announceWorld("Revolução em Aurélia: agora governa o Conselho do Povo!");
  saveGame();
  if (how)
    say([
      ["", wasMine ? "Os portões caem. A multidão invade o salão do trono... e tira a coroa da sua cabeça com todo o cuidado." : "A multidão invade o castelo. Ninguém se machuca, mas a coroa vai parar numa almofada no meio da praça."],
      ["Luca", "A PARTIR DE HOJE, QUEM MANDA É O POVO! Eleição a cada 15 dias!"],
      ["Lucas Marzocca", "E a primeira lei do Conselho: taverna aberta até mais tarde!"],
      ["", how === "juntar" ? "Você ganhou uma cadeira no Conselho. Na próxima eleição, pode se candidatar a Chefe do Conselho." : "Se quiser a coroa de volta, ainda dá para conspirar (tecla V) ou vencer a eleição e convocar um plebiscito."],
    ]);
}
{
  const srBase = syncRulers;
  syncRulers = function () {
    srBase();
    if (player.council && !rulesK("aurelia")) KINGDOMS.aurelia.ruler = player.councilChief ? `${player.name} (Chefe do Conselho)` : `Conselho do Povo (${shortName(player.council.chief || "luca")})`;
  };
}

/* ----- Eleições do Conselho do Povo ----- */
function electionDaily() {
  const C = player.council;
  if (!C) return;
  if (player.councilChief) {
    player.gold += 40;
    setTimeout(() => toast("Salário de Chefe do Conselho: +40 de ouro.", 3000), 7000);
  }
  if (player.day === C.next - 2) setTimeout(() => toast("Eleição do Conselho daqui a 2 dias! Faça campanha (Ações → Eleição).", 4600), 4000);
  if (player.day >= C.next) game.electionNow = true;
}
function campaignMenu() {
  const C = player.council;
  if (!C) return say([["", "Não há eleição: Cinzaluz é uma monarquia."]]);
  C.camp = C.camp || {};
  const left = C.next - player.day;
  const votes = myVotes();
  choice("Eleição do Conselho do Povo", `Faltam <b>${left}</b> dia(s). Você teria hoje <b>${votes}%</b> dos votos contra ${shortName(C.chief)}.${C.cand ? "" : "<br><small>Você ainda não é candidat" + genderWord("o", "a", "e") + ".</small>"}`, [
    ...(C.cand ? [] : [{ t: "Registrar candidatura (20 ouro)", icon: "scroll", fn: () => (player.gold < 20 ? say([["", "Sem 20 de ouro para a taxa."]]) : ((player.gold -= 20), (C.cand = true), saveGame(), say([["", "Seu nome agora está no quadro da praça. Que comece a campanha!"]], campaignMenu))) }]),
    { t: "Fazer um comício na praça (1x por dia)", icon: "flag", fn: () => (C.camp.ral === player.day ? say([["", "Já teve comício hoje."]], campaignMenu) : ((C.camp.ral = player.day), (C.camp.pts = (C.camp.pts || 0) + 5 + Math.round(Math.random() * 4)), say([["", pk(["Você sobe num caixote e fala de pão barato. Aplausos!", "Você promete escola para todos. Uma senhora chora de emoção.", "Você fala tanto que esquece o que ia dizer. Mesmo assim aplaudem."])]], campaignMenu))) },
    { t: "Pagar uma rodada na taverna (40 ouro)", icon: "coin", fn: () => (player.gold < 40 ? say([["", "Sem 40 de ouro."]], campaignMenu) : ((player.gold -= 40), (C.camp.pts = (C.camp.pts || 0) + 4), say([["Gus, o Taverneiro", "Uma rodada por conta de quem vai mudar Cinzaluz!"]], campaignMenu))) },
    {
      t: `Debate com ${shortName(C.chief)}`,
      icon: "chat",
      fn: () => {
        if (C.camp.deb) return say([["", "O debate já aconteceu."]], campaignMenu);
        C.camp.deb = true;
        const ok = Math.random() < 0.4 + ((player.rep ?? 50) - 50) / 200 + (hasTrait("player", "intelectual") ? 0.2 : 0);
        C.camp.pts = (C.camp.pts || 0) + (ok ? 10 : -5);
        say(ok ? [[shortName(C.chief), "Eu... eu tinha um argumento ótimo, juro."], ["", "Você venceu o debate! +10 de votos."]] : [[shortName(C.chief), "E a sua proposta para os impostos é...? Pois é."], ["", "Você se enrolou no debate. -5 de votos."]], campaignMenu);
      },
    },
    ...(player.councilChief && (player.rep ?? 50) >= 70 ? [{ t: "Convocar plebiscito: restaurar a monarquia (com você no trono)", icon: "crown", fn: plebiscite }] : []),
    { t: "Fechar", fn: null },
  ]);
}
function myVotes() {
  const C = player.council;
  const friends = Object.keys(player.rel || {}).filter((id) => NPCS[id]);
  const avg = friends.length ? friends.reduce((a, id) => a + friendship(id), 0) / friends.length : 30;
  const me = (player.rep ?? 50) * 0.6 + avg * 0.4 + ((C && C.camp && C.camp.pts) || 0) + (player.councilChief ? 8 : 0);
  const them = 48 + ilumCount() * 2 + (C && C.member ? -5 : 0);
  return Math.max(3, Math.min(97, Math.round((me / (me + them)) * 100)));
}
function electionTick() {
  if (!game.electionNow || game.mode !== "world" || game.dialog || game.dying) return;
  game.electionNow = false;
  const C = player.council;
  if (!C) return;
  const v = C.cand ? myVotes() : 0;
  const won = C.cand && Math.random() * 100 < v;
  C.next = player.day + YEAR_DAYS;
  C.camp = {};
  C.cand = false;
  if (won) {
    player.councilChief = true;
    C.chief = "player";
    vilaNews(`${player.name} venceu a eleição com ${v}% dos votos e é ${genderWord("o novo Chefe", "a nova Chefe", "a nova Chefia")} do Conselho!`);
    say([["", `Contagem dos votos na praça... ${player.name}: ${v}%!`], ["Luca", "O povo falou. Parabéns... e não faça nada que me obrigue a protestar contra você."], ["", "Você é Chefe do Conselho: salário de 40 ouro por dia. Com reputação 70+, pode convocar um plebiscito para restaurar a monarquia."]]);
  } else {
    const was = player.councilChief;
    player.councilChief = false;
    C.chief = pk(ilumAlive().length ? ilumAlive() : ["luca"]);
    vilaNews(`Eleição do Conselho: ${shortName(C.chief)} venceu${v ? ` (${player.name} teve ${v}%)` : ""}.`);
    if (v || was) say([["", `Contagem dos votos... ${shortName(C.chief)} venceu. Você teve ${v}%.`]]);
  }
  syncRulers();
  saveGame();
}
function plebiscite() {
  const yes = (player.rep ?? 50) + Math.random() * 30 - 15;
  if (yes >= 70) {
    player.council = null;
    player.councilChief = false;
    throne().aurelia = player.day;
    syncRulers();
    vilaNews(`Plebiscito: o povo votou pela volta da monarquia, com ${player.name} no trono!`);
    say([["", "As urnas falaram: a monarquia está de volta!"], ["Lucas Marzocca", "Eu votei não. Mas a festa da coroação eu não perco."], ["", `Você é ${royalTitle()}. Cinzaluz volta a ser um reino.`]]);
  } else {
    repAdd(-6);
    say([["", "O povo votou NÃO. Cinzaluz continua com o Conselho. Sua reputação caiu um pouco."]]);
  }
  saveGame();
}

/* ----- Quem governa pode manter a monarquia ----- */
{
  const rmBase = royalMenu;
  royalMenu = function () {
    hookChoice(rmBase, (title, text, opts) => {
      if (!rulesK("aurelia")) return [title, text, opts];
      const extra = [
        {
          t: `Iluministas (força ${ilumPow()}%): conceder Conselho Consultivo`,
          icon: "scroll",
          fn: () => {
            if (player.ilumConcession && player.day - player.ilumConcession < 10) return say([["Luca", "Já temos o conselho. Agora queremos que ele seja ouvido!"]]);
            player.ilumConcession = player.day;
            ilumAdd(-30);
            repAdd(3);
            saveGame();
            say([["Luca", "Um conselho de verdade? ...Ok. A coroa fica. Por enquanto."], ["", "Os Iluministas se acalmam. A monarquia continua firme."]]);
          },
        },
        {
          t: "Prender Luca e Lucas Marzocca",
          icon: "lock",
          fn: () => {
            ilumAdd(-35);
            repAdd(-6);
            for (const id of ILUM_LEADERS) addFriendship(id, -40);
            vilaNews(`${royalTitle()} ${player.name} mandou prender os líderes Iluministas!`);
            saveGame();
            say([["Lucas Marzocca", "Prender o Marzoca? Vai ter fila de marido bravo pra me visitar, hein!"], ["Luca", "Pode me prender. A ideia não cabe numa cela."], ["", "Os líderes vão para o calabouço por uns dias. A força dos Iluministas despenca... e o povo cochicha."]]);
          },
        },
        {
          t: "Banquete para o povo (150 ouro)",
          icon: "party",
          fn: () => {
            if (player.gold < 150) return say([["", "O tesouro pessoal não tem 150 de ouro."]]);
            player.gold -= 150;
            ilumAdd(-12);
            repAdd(6);
            saveGame();
            say([["", "Mesas na praça, porco assado e música! Até alguns Iluministas comem calados."]]);
          },
        },
        { t: "Investigar conspirações no castelo", icon: "eye", fn: investigateRival },
      ];
      opts.splice(opts.length - 1, 0, ...extra);
      text += `<br>Iluministas: ${ilumPow()}% de força${player.rival ? " · Há rumores de traição na corte..." : ""}.`;
      return [title, text, opts];
    });
  };
}

/* ----- O nobre rival trama nas sombras ----- */
const RIVAL_POOL = ["matheus", "malu", "doran", "mercOri", "zaid", "marcos", "vini"];
{
  const dayBase = onNewDay;
  onNewDay = function () {
    dayBase.apply(this, arguments);
    if (!lifeMode() || !rulesK("aurelia")) return;
    const R = player.rival;
    if (!R && Math.random() < 0.06) {
      const pool = RIVAL_POOL.filter((id) => NPCS[id] && !isDead(id) && friendship(id) < 60 && id !== player.spouse);
      if (pool.length) player.rival = { id: pk(pool), day: player.day, strike: player.day + 3 + Math.floor(Math.random() * 3) };
      return;
    }
    if (R && player.day >= R.strike) game.rivalNow = true;
    else if (R && Math.random() < 0.5) setTimeout(() => toast(pk(["Um criado viu alguém cochichando com a guarda à noite...", "Cartas sem assinatura circulam pelo castelo.", "Alguém da corte anda comprando espadas demais."]), 4200), 5000);
  };
}
function investigateRival() {
  const R = player.rival;
  if (!R) return say([["Mordomo", "Tudo calmo na corte, Majestade. Até demais."]]);
  const n = shortName(R.id);
  choice("Conspiração na corte!", `Seus espiões descobriram: <b>${n}</b> está tramando tomar o trono!`, [
    { t: `Prender ${n}`, icon: "lock", fn: () => ((player.rival = null), addFriendship(R.id, -50), repAdd(2), vilaNews(`${n} foi pres${gw(R.id, "o", "a")} por conspirar contra ${player.name}!`), saveGame(), say([[n, "Como você descobriu?! Isso não acabou!"]])) },
    { t: `Comprar a lealdade de ${n} (120 ouro)`, icon: "coin", fn: () => (player.gold < 120 ? say([["", "Ouro insuficiente."]]) : ((player.gold -= 120), (player.rival = null), addFriendship(R.id, 20), saveGame(), say([[n, "...Majestade, eu nunca duvidei de você. Nunca."]]))) },
    { t: "Fingir que não sabe (e esperar)", fn: () => {} },
  ]);
}
function rivalTick() {
  if (!game.rivalNow || game.mode !== "world" || game.dialog || game.dying) return;
  game.rivalNow = false;
  const R = player.rival;
  player.rival = null;
  if (!R || !rulesK("aurelia")) return;
  const n = shortName(R.id);
  choice("TRAIÇÃO NA CORTE!", `${n} invade o salão do trono com guardas comprados!`, [
    { t: "Lutar pela coroa", icon: "sword", fn: () => (Math.random() < 0.45 + army() / 300 ? (repAdd(4), say([["", `Você desarma ${n} na frente de todos. A corte se ajoelha.`]])) : loseThrone(`${n} tomou o trono. A traição veio de dentro.`)) },
    { t: "Chamar o povo", icon: "flag", fn: () => (Math.random() < (player.rep ?? 50) / 100 ? (repAdd(3), say([["", `O povo invade o salão gritando seu nome. ${n} foge pela janela.`]])) : loseThrone(`O povo não veio. ${n} tomou o trono.`)) },
  ]);
}
{
  const updBase = update;
  update = function (dt) {
    updBase(dt);
    if (game.mode === "title" || game.mode === "cutscene") return;
    if (game.mode === "world" && !game.dialog) {
      ilumCoupTick();
      electionTick();
      rivalTick();
    }
  };
}
