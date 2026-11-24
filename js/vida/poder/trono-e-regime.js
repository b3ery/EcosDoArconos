/**
 * ECOS DO ARCANO — trono-e-regime.js  (Simulador de Vida)
 * O trono de Aurélia, do jeito certo:
 *  - RAINHA MORTA SOME de tudo: do salão do trono, da passeata real, dos
 *    protestos e das audiências. O trono fica vago, com um pano preto, e
 *    você pode ir ao castelo e SUBIR AO TRONO.
 *  - Ao subir ao trono (por morte, golpe, plebiscito ou sucessão) você ESCOLHE
 *    COMO GOVERNAR: monarquia tradicional, socialismo, capitalismo, comunismo
 *    ou ditadura. Dá para mudar depois no castelo.
 *  - Depois de coroad(o), SÓ SE PERDE O TRONO por GOLPE DE ESTADO ou
 *    ASSASSINATO pela oposição (nada de eleição tirando a coroa). Quem lidera a
 *    oposição: a Rainha (se foi exilada e está viva), os Iluministas (contra a
 *    ditadura) ou o Duque Ramiro de Valsombra. Uma rainha morta nunca volta.
 *  - Perder Aurélia não tira os outros reinos conquistados: cada trono é um.
 * Modifica (envolve) funções de outros arquivos: castleMenu, counterCoup,
 * loseThrone, coupWin, syncRulers, paradeActive, startProtest, onNewDay, update.
 */

"use strict";

(() => {
  const dead = () => typeof isDead === "function" && isDead("rainha");
  const reigns = () => !dead() && !rulesK("aurelia") && !player.usurper;
  window.queenReigns = reigns;
  const gw = (a, b, c) => genderWord(a, b, c);

  /* ----- quem lidera a oposição ----- */
  function opposition() {
    if (!dead() && player.queenFate === "exílio") return { n: "Rainha Aurélia", queen: true };
    const il = typeof ilumAlive === "function" ? ilumAlive() : [];
    if ((player.regime === "ditadura" || player.regime === "capitalismo") && il.length) return { n: shortName(il[0]) };
    return { n: "Duque Ramiro de Valsombra" };
  }

  /* ----- como a rainha saiu do trono ----- */
  const cwBase = coupWin;
  coupWin = function (how) {
    player.queenFate = how;
    player.usurper = null;
    return cwBase.apply(this, arguments);
  };

  /* ----- quem senta no trono quando não é você ----- */
  const srBase = syncRulers;
  syncRulers = function () {
    srBase.apply(this, arguments);
    if (!rulesK("aurelia") && (player.usurper || dead())) KINGDOMS.aurelia.ruler = player.usurper || "Trono vago (luto)";
  };

  /* ----- a rainha morta não desfila nem enfrenta protesto ----- */
  const paBase = paradeActive;
  paradeActive = function () {
    return paBase.apply(this, arguments) && reigns();
  };
  const spBase = startProtest;
  startProtest = function (force) {
    if (!rulesK("aurelia") && !reigns()) return false;
    return spBase.apply(this, arguments);
  };

  /* ===================== ESCOLHER O REGIME ===================== */
  const CROWN_REGIMES = [
    ["monarquia", "Monarquia tradicional", "crown", "A Coroa decide tudo. Sem surpresas, sem eleições."],
    ["socialismo", "Socialismo", "heart", "Hospital, escola e sopa de graça. Custa 40 ouro/dia ao tesouro, o povo te ama."],
    ["capitalismo", "Capitalismo", "coin", "Comércio livre: +60 ouro/dia de imposto das lojas. Os ricos enriquecem, os pobres reclamam."],
    ["comunismo", "Comunismo", "flag", "Tudo é do povo: salário igual, pão todo dia. Os reinos vizinhos desconfiam."],
    ["ditadura", "Ditadura", "skull", "Guarda nas ruas, jornal censurado, ninguém te tira... a não ser um golpe."],
  ];
  function regimeChooser(first) {
    choice(
      first ? "Como você vai governar?" : "Mudar o regime",
      `${first ? `A coroa é sua, ${royalTitle()}. ` : ""}Escolha o regime de Aurélia. Ele muda o salário do povo, o tesouro, a saúde, as escolas e o que os outros reinos pensam de você.`,
      CROWN_REGIMES.map(([k, n, ic, d]) => ({
        t: `${player.regime === k ? "✓ " : ""}${n}: ${d}`,
        icon: ic,
        fn: () => {
          player.crownRegime = player.day;
          if (typeof setRegime === "function") setRegime(k);
          else ((player.regime = k), saveGame());
          if (typeof announceWorld === "function") announceWorld(`${KINGDOMS.aurelia.short} agora é ${regimeName()}.`);
        },
      })).concat(first ? [] : [{ t: "Voltar", fn: null }]),
    );
  }
  window.regimeChooser = regimeChooser;

  /* ===================== SUBIR AO TRONO VAGO ===================== */
  function claimThrone() {
    if (player.council) return say([["", "Cinzaluz agora tem um Conselho do Povo. O trono virou peça de museu."]]);
    const D = (typeof deadList === "function" && deadList().rainha) || {};
    const T = throne();
    T.aurelia = player.day;
    player.usurper = null;
    player.queenFate = "morta";
    player.coupDay = player.day;
    syncRulers();
    repAdd(D.found && D.by === "player" ? -6 : 4);
    vilaNews(`${player.name} subiu ao trono vago de Aurélia!`);
    announceWorld(`COROAÇÃO! ${player.name} agora governa Aurélia.`);
    if (typeof ACH_CHECK === "function") ACH_CHECK();
    saveGame();
    say(
      [
        ["", "Você atravessa o salão em silêncio. O pano preto ainda cobre o trono da falecida Rainha."],
        ["", "Você puxa o pano e senta. Os guardas se olham... e se ajoelham, um por um."],
        ["Padre Anselmo", `O reino não pode ficar sem cabeça. Que os céus abençoem ${player.name}, ${royalTitle()}.`],
        ["", "A partir de agora, só um golpe de estado ou um assassino da oposição tiram essa coroa de você."],
      ],
      () => setTimeout(() => regimeChooser(true), 300),
    );
  }

  /* ===================== O CASTELO DE CINZALUZ ===================== */
  const cmBase = castleMenu;
  castleMenu = function () {
    if (!lifeMode()) return cmBase.apply(this, arguments);
    if (rulesK("aurelia")) {
      return choice(`${royalTitle()} · salão do trono`, `Os guardas batem as lanças no chão quando você entra. Regime: <b>${regimeName()}</b>.`, [
        { t: "Sentar no trono e governar", icon: "crown", fn: royalMenu },
        { t: "Orçamento, leis e acordos do reino", icon: "scroll", fn: () => (typeof budgetMenu === "function" ? budgetMenu() : royalMenu()) },
        { t: "Mudar o regime", icon: "flag", fn: () => regimeChooser(false) },
        { t: `Reforçar a guarda do castelo (80 ouro) · proteção ${player.palaceGuard || 0}`, icon: "sword", fn: () => (player.gold < 80 ? toast("O tesouro não tem 80 de ouro.", 2000) : ((player.gold -= 80), (player.palaceGuard = Math.min(5, (player.palaceGuard || 0) + 1)), saveGame(), say([["Capitão da Guarda", "Mais homens nos corredores e na porta do seu quarto, Majestade. Nenhum assassino passa."]]))) },
        { t: "Sair", fn: null },
      ]);
    }
    if (player.usurper && !player.council) {
      const n = player.usurper;
      return choice("Castelo de Cinzaluz", `${n} está sentado no trono que era seu. Os guardas te olham torto.`, [
        { t: `Audiência com ${n}`, icon: "chat", fn: () => say([[n, pk(["Veio implorar o trono de volta? Que comovente.", "O povo cansou de você. Eu só abri a porta.", "Ande com cuidado pela vila. Meus guardas não esquecem rostos."])]]) },
        { t: "Planejar um golpe para retomar o trono", icon: "crown", fn: () => (typeof plotMenu === "function" ? plotMenu() : null) },
        { t: "Sair", fn: null },
      ]);
    }
    if (dead() && !player.council) {
      return choice("Castelo de Cinzaluz · luto", "O salão está em silêncio. Um pano preto cobre o trono da Rainha Aurélia, que está morta. Ninguém governa Aurélia.", [
        { t: "Subir ao trono vago", icon: "crown", fn: claimThrone },
        { t: "Rezar pela Rainha", icon: "flower", fn: () => say([["", "Você acende uma vela ao pé do trono vazio."]]) },
        { t: "Sair", fn: null },
      ]);
    }
    return cmBase.apply(this, arguments);
  };

  /* ===================== PERDER O TRONO: SÓ GOLPE OU ASSASSINATO ===================== */
  // a coroa de Aurélia cai sozinha; os reinos conquistados continuam seus
  loseThrone = function (why, who) {
    if (lifeMode() && /portões/.test(why || "") && Math.random() < 0.4) game.killNext = { id: "contragolpe", why: "Os soldados da oposição não fizeram prisioneiros." };
    const O = who ? { n: who } : opposition();
    delete throne().aurelia;
    player.crownRegime = 0;
    player.regime = null;
    if (O.queen) ((player.usurper = null), (player.queenFate = "voltou"));
    else player.usurper = O.n;
    syncRulers();
    repAdd(-10);
    vilaNews(O.queen ? `A Rainha Aurélia voltou do exílio e retomou o trono! ${player.name} perdeu a coroa.` : `GOLPE! ${O.n} tomou o trono de Aurélia. ${player.name} perdeu a coroa.`);
    saveGame();
    const keep = ["mares", "serra"].filter(rulesK).map((k) => KINGDOMS[k].short);
    say([["", why], [O.n, O.queen ? "Bem-vind" + gw("o", "a", "e") + " de volta à vida de súdito." : "O trono de Aurélia agora é meu. Saia do meu castelo."]].concat(keep.length ? [["", `Mas ${keep.join(" e ")} continua${keep.length > 1 ? "m" : ""} sendo seu. Lá você ainda é soberan${gw("o", "a", "e")}.`]] : []));
  };

  function coupAttempt() {
    if (!rulesK("aurelia")) return;
    if (game.mode !== "world" || game.dialog || game.dying) return setTimeout(coupAttempt, 5000);
    const O = opposition();
    const guard = (player.palaceGuard || 0) * 6 + (player.realm ? player.realm.seg / 5 : 10);
    choice("GOLPE DE ESTADO!", `${O.n} cerca o castelo com nobres e soldados pagos! A oposição quer a sua coroa. Reputação: ${player.rep ?? 50}. Exército: ${army()}.`, [
      {
        t: `Defender o castelo com o exército (${army()} soldados)`,
        icon: "sword",
        fn: () => {
          const ok = Math.random() * 100 < 30 + army() / 2 + guard + (friendshipLevel("marcos") >= 2 ? 10 : 0);
          player.army = Math.max(0, army() - 10);
          if (ok) (repAdd(3), saveGame(), say([["", `Seus soldados seguram os portões até o amanhecer. ${O.n} foge. A coroa continua sua!`]]));
          else loseThrone("Os portões caíram. A oposição invadiu o salão do trono.");
        },
      },
      {
        t: "Baixar impostos e chamar o povo para as ruas",
        icon: "party",
        fn: () => {
          player.royalTax = "baixo";
          repAdd(8);
          if (Math.random() * 100 < 35 + (player.rep ?? 50) / 2) say([["", `O povo sai às ruas com tochas... para defender você! ${O.n} não acha apoio e recua.`]]);
          else loseThrone("Tarde demais: o povo abriu os portões para a oposição.");
          saveGame();
        },
      },
      { t: "Fugir com o tesouro", icon: "coin", fn: () => ((player.gold += 200), loseThrone("Você foge pela passagem secreta com um saco de ouro.")) },
    ]);
  }
  window.counterCoup = counterCoup = coupAttempt;

  function assassinAttempt() {
    if (!rulesK("aurelia")) return;
    if (game.mode !== "world" || game.dialog || game.dying) return setTimeout(assassinAttempt, 5000);
    const O = opposition();
    const guard = (player.palaceGuard || 0) * 8 + (player.realm ? player.realm.seg / 4 : 15);
    const die = () => {
      delete throne().aurelia;
      player.usurper = O.queen ? null : O.n;
      syncRulers();
      vilaNews(`${player.name} foi assassinad${gw("o", "a", "e")} no castelo! ${O.n} assume o trono.`);
      if (typeof playerDies === "function" && playerDies("assassinado", { killerName: `Assassino de ${O.n}` })) return;
      loseThrone("A lâmina passou de raspão. Você sobrevive, mas a oposição já ocupou o salão.", O.n);
    };
    choice("ASSASSINO NO CASTELO!", `Meia-noite. Um vulto de capuz entra no seu quarto com um punhal. Foi mandado por ${O.n}.`, [
      { t: "Lutar com a espada da cabeceira", icon: "sword", fn: () => (Math.random() * 100 < 40 + guard / 2 ? (repAdd(4), saveGame(), say([["", "Você desvia do punhal e derruba o assassino. Os guardas o levam para a masmorra."], ["Capitão da Guarda", `Ele confessou: foi ${O.n}. A corte inteira já sabe.`]])) : die()) },
      { t: "Gritar pela guarda", icon: "flag", fn: () => (Math.random() * 100 < 25 + guard ? (saveGame(), say([["", "A porta se abre com um estrondo: a guarda chega a tempo. O assassino pula a janela e some."]])) : die()) },
      { t: "Pular pela janela e fugir", icon: "door", fn: () => loseThrone("Você foge pelos telhados de camisola. Ao amanhecer, a oposição já está no seu trono.") },
    ]);
  }
  window.assassinAttempt = assassinAttempt;

  // a oposição se mexe: reputação baixa, ditadura e povo infeliz atraem golpes
  const ndBase = onNewDay;
  onNewDay = function () {
    const r = ndBase.apply(this, arguments);
    if (player.usurper && game.pendingCrown === "morte") game.pendingCrown = null; // o trono já tem dono
    if (!lifeMode() || !rulesK("aurelia") || player.spouse === "rainha") return r;
    const rep = player.rep ?? 50,
      soc = player.realm ? player.realm.social : 60;
    if (player.day - (player.coupDay || 0) < 3) return r;
    let risk = 0.01 + (rep < 40 ? (40 - rep) / 200 : 0) + (soc < 35 ? 0.04 : 0) + (player.regime === "ditadura" ? 0.03 : 0) + (player.regime === "socialismo" ? -0.005 : 0);
    risk *= 1 - (player.palaceGuard || 0) * 0.12;
    if (Math.random() < risk) setTimeout(Math.random() < 0.5 ? assassinAttempt : coupAttempt, 6500);
    return r;
  };

  /* ----- quem chega ao trono escolhe o regime ----- */
  const upBase = update;
  update = function (dt) {
    upBase(dt);
    if (!player || !player.name || !lifeMode() || game.mode !== "world" || game.dialog || game.dying) return;
    if (rulesK("aurelia") && !player.crownRegime && !player.council) {
      player.crownRegime = -1; // pergunta uma vez só (até escolher ou perder)
      setTimeout(() => regimeChooser(true), 1200);
    }
    if (dead() && !rulesK("aurelia") && KINGDOMS.aurelia.ruler === BASE_RULERS.aurelia) syncRulers();
    // o trono ficou vago: avisa uma vez
    if (dead() && !rulesK("aurelia") && !player.usurper && !player.council && !player.vagoAviso) {
      player.vagoAviso = player.day;
      setTimeout(() => toast("O trono de Aurélia está vago. Vá ao castelo para subir ao trono.", 5000), 2500);
    }
  };
})();
