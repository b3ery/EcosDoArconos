/**
 * ECOS DO ARCANO — marzoca-hiperfoco.js (Simulador)
 * O caos romântico da vila:
 *  - Personalidade FIEL: as meninas da turma (Andressa, Mylena, Julia, Malu e
 *    Júlia Oliveira) não pulam a cerca, não aceitam cantada e não largam o par.
 *  - Lucas Marzoca tem hiperfoco no Matheus, no Marcos e no Luca: vai atrás
 *    deles pela vila, manda cantada, poema, flor... As esposas não gostam.
 *    Se a insistência der certo, vira namoro, briga, separação e até casamento.
 *  - O Marzoca pode namorar e casar com qualquer adulto, menos quem é fiel.
 * Tudo romântico, nada de conteúdo +18 com a turma.
 * Modifica (envolve) funções de outros arquivos: mutualAttraction, afterChat,
 * npcDaily, chooseDesire, breakUp.
 */

"use strict";

(() => {
  const FIEL = new Set(["andressa", "mylena", "julia", "malu", "juliaO"]);
  const FOCO = ["matheus", "marcos", "luca"];
  const isFiel = (id) => FIEL.has(id);
  window.isFiel = isFiel;

  /* ----- quem sente atração por quem ----- */
  const maBase = mutualAttraction;
  mutualAttraction = function (a, b) {
    if (isFiel(a) || isFiel(b)) return npcSpouse(a) === b || npcPartner(a) === b;
    if (a === "lucas" || b === "lucas") {
      const o = a === "lucas" ? b : a;
      return !!NPCS[o] && !(typeof isChildNpc === "function" && isChildNpc(o));
    }
    return maBase(a, b);
  };
  // Quem é fiel nunca termina por causa de traição própria; quem é largado sofre.
  const buBase = breakUp;
  breakUp = function (a, b, why) {
    const fielSide = isFiel(a) ? a : isFiel(b) ? b : null;
    if (fielSide && why !== "o Marzoca" && why !== "traição") return; // brigas normais não separam um casal com alguém fiel
    return buBase(a, b, why);
  };

  /* ----- o hiperfoco ----- */
  const FLIRTS = [
    (n) => `${n}, você viu como eu tô bonito hoje? Eu me arrumei pra você.`,
    (n) => `${n}, escrevi um poema: "Rosas são vermelhas, o céu é azul, eu e você, que tal?" Gostou?`,
    (n) => `Coincidência! Eu também tava passando por aqui, ${n}. De novo.`,
    (n) => `${n}, se eu fosse uma runa, eu seria a do coração. Ela não existe? Agora existe.`,
    (n) => `Trouxe uma flor pra você, ${n}. Arranquei do jardim da Rainha, mas é o que vale.`,
    (n) => `${n}! ${n}! Olha pra mim! ...Tá bom, depois você olha.`,
  ];
  const ANSWERS = {
    matheus: ["Lucas... eu sou casado, cara.", "Hahaha, tá, Marzoca. Valeu pela flor.", "A Malu tá olhando. Some daqui!"],
    marcos: ["Isso é desacato à autoridade, Marzoca.", "Lucas. Pela última vez: não.", "...O poema até que rimou."],
    luca: ["Lucas, eu sou um Iluminista, não tenho tempo pra isso.", "Hm. Vou pensar. Daqui a uns 10 anos.", "Você é estranho. Gostei."],
  };
  const SPOUSE_ANGRY = ["Ô MARZOCA! Larga o meu marido!", "De novo, Lucas?! Vou contar pra Rainha!", "Mais uma flor dessas e eu te jogo na fonte."];
  const near = (a, b) => a && b && Math.abs(a.x - b.x) + Math.abs(a.y - b.y) <= 2;

  /** Lucas vai atrás de um dos três pela vila. */
  const cdBase = chooseDesire;
  chooseDesire = function (a) {
    if (a && a.id === "lucas" && lifeMode() && Math.random() < 0.45) {
      const crew = game.crewA || {};
      const alvo = FOCO.map((id) => crew[id]).filter((o) => o && crewVisible(o) && !o.talking);
      if (alvo.length) {
        const o = pk(alvo);
        a.auto = { kind: "social", dest: freeNear("vila", o.x, o.y, 1) || [o.x, o.y + 1], with: o.id, until: player.day * 1440 + player.clock + 50, foco: true };
        game.bubbles.push({ x: a.x, y: a.y, icon: "heart", t: 2.4 });
        return;
      }
    }
    return cdBase(a);
  };

  /** Quando o Marzoca chega perto de um alvo, rola a cantada (na rua, com balões). */
  let cool = 0;
  const upBase = update;
  update = function (dt) {
    upBase(dt);
    if (!lifeMode() || player.zone !== "vila" || game.mode !== "world" || !game.crewA) return;
    cool -= dt;
    if (cool > 0) return;
    const L = game.crewA.lucas;
    if (!L || !crewVisible(L)) return;
    const alvo = FOCO.map((id) => game.crewA[id]).find((o) => o && crewVisible(o) && near(L, o));
    if (!alvo) return;
    cool = 14;
    const n = shortName(alvo.id);
    game.shouts = (game.shouts || []).concat([{ x: L.x, y: L.y, txt: pk(FLIRTS)(n), t: 3.6 }]);
    setTimeout(() => game.crewA && (game.shouts = (game.shouts || []).concat([{ x: alvo.x, y: alvo.y, txt: pk(ANSWERS[alvo.id] || ["..."]), t: 3.4 }])), 1800);
    const sp = npcSpouse(alvo.id);
    const spA = sp && game.crewA[sp];
    if (spA && crewVisible(spA) && Math.abs(spA.x - L.x) + Math.abs(spA.y - L.y) <= 8)
      setTimeout(() => game.crewA && (game.shouts = (game.shouts || []).concat([{ x: spA.x, y: spA.y, txt: pk(SPOUSE_ANGRY), t: 3.4 }])), 3600);
    relAdd("lucas", alvo.id, 3);
    if (sp) relAdd(sp, "lucas", -4);
  };

  /** Todo dia: o hiperfoco avança. Às vezes dá certo... e vira caos. */
  const ndBase = npcDaily;
  npcDaily = function () {
    ndBase.apply(this, arguments);
    if (!lifeMode() || (typeof isDead === "function" && isDead("lucas"))) return;
    const S = soc();
    const alvo = pk(FOCO.filter((id) => NPCS[id] && !(typeof isDead === "function" && isDead(id))));
    if (!alvo) return;
    const r = relAdd("lucas", alvo, 4 + Math.random() * 6);
    const sp = npcSpouse(alvo) || npcPartner(alvo);
    if (Math.random() < 0.35)
      vilaNews(
        pk([
          `Lucas Marzoca foi visto deixando uma flor na porta de ${shortName(alvo)}. De novo.`,
          `Lucas Marzoca escreveu "${shortName(alvo)} ♥" no muro da praça.${sp ? ` ${shortName(sp)} não achou graça.` : ""}`,
          `Lucas Marzoca seguiu ${shortName(alvo)} até o mercado, até a taverna e até a porta de casa.`,
          `Lucas Marzoca cantou uma serenata desafinada embaixo da janela de ${shortName(alvo)}.`,
        ]),
      );
    if (sp) relAdd(sp, "lucas", -6);
    // Se o Marzoca já namora ou casou com um deles, fica por aí (até a próxima loucura).
    const lp = npcSpouse("lucas") || npcPartner("lucas");
    if (lp && FOCO.includes(lp)) return;
    // Deu certo? O alvo larga o par (se o par não for fiel... e mesmo se for, quem larga é o alvo).
    if (r >= 70 && Math.random() < 0.1) {
      if (sp) breakUp(alvo, sp, "o Marzoca");
      if (lp) breakUp("lucas", lp, "o hiperfoco dele");
      S.dating.lucas = alvo;
      S.dating[alvo] = "lucas";
      S.since[npcPair("lucas", alvo)] = player.day;
      vilaNews(`CAOS EM CINZALUZ: ${shortName(alvo)} cedeu e agora namora o Lucas Marzoca!${sp ? ` ${shortName(sp)} está inconsolável.` : ""}`);
      setTimeout(() => toast(`Fofoca do século: ${shortName(alvo)} e o Lucas Marzoca estão namorando!`, 5000), 3000);
    }
  };

  /* ----- as fiéis recusam qualquer cantada (inclusive do Marzoca) ----- */
  const acBase = afterChat;
  afterChat = function (a, b, hostile) {
    if (!hostile && ((a === "lucas" && isFiel(b)) || (b === "lucas" && isFiel(a))) && Math.random() < 0.3) {
      const f = isFiel(a) ? a : b;
      vilaNews(`Lucas Marzoca tentou uma cantada em ${shortName(f)}. Levou um fora na frente de todo mundo.`);
    }
    return acBase(a, b, hostile);
  };

  // Na ficha da pessoa: "Fiel".
  if (typeof npcTraits === "function") {
    const ntBase = npcTraits;
    npcTraits = function (id) {
      const t = ntBase(id) || [];
      return isFiel(id) && !t.includes("leal") ? [...t, "leal"] : t;
    };
  }
})();

/* ===================== A PACIÊNCIA DAS ESPOSAS TEM LIMITE =====================
 * A Malu (esposa do Matheus) e a Julia (esposa do Marcos) podem matar o
 * Lucas Marzoca de ciúme. Só no Simulador. Se você estiver na vila, ouve a
 * confusão e pode tentar impedir. Quem mata vai para o calabouço por uns dias.
 */
(() => {
  const WIVES = { malu: "matheus", julia: "marcos" };
  const busy = () => game.mode !== "world" || game.dialog;
  function jailedNpc(id) {
    const J = player.npcJail || {};
    return J[id] && player.day < J[id];
  }
  window.jailedNpc = jailedNpc;
  const vis = crewVisible;
  crewVisible = (a) => !(a && jailedNpc(a.id)) && vis(a);

  function killMarzoca(wife) {
    const n = shortName(wife);
    deadList().lucas = { day: player.day, how: "ciúme", found: true, natural: false, by: wife };
    if (player.spouse === "lucas") (player.spouse = null), (player.widowed = player.day);
    if (player.dating === "lucas") player.dating = null;
    player.lovers = (player.lovers || []).filter((x) => x !== "lucas");
    if (game.crewA && game.crewA.lucas) game.crewA.lucas.inside = true;
    purgeDead();
    player.npcJail = player.npcJail || {};
    player.npcJail[wife] = player.day + 5;
    vilaNews(`TRAGÉDIA: Lucas Marzoca foi morto por ${n}, de ciúme de ${shortName(WIVES[wife])}. "Eu avisei", disse ela, ao ser presa pelo General Marcos.`);
    saveGame();
  }
  function confrontation(wife) {
    const n = shortName(wife),
      hus = shortName(WIVES[wife]);
    const blood = !settings.noBlood;
    const here = player.zone === "vila" && !busy();
    const finish = () => {
      killMarzoca(wife);
      if (here)
        say([
          [n, pk(["Eu AVISEI, Marzoca. Eu avisei mil vezes.", `Mais uma flor pro ${hus}? Mais UMA?`, "Acabou a serenata."])],
          ["", blood ? `Antes que alguém consiga segurar, ${n} acerta o Marzoca. Ele cai no meio da praça e não levanta mais.` : `Antes que alguém consiga segurar, ${n} acerta o Marzoca. Ele cai no meio da praça e não levanta mais.`],
          ["General Marcos", wife === "julia" ? "Julia... meu amor... eu vou ter que te prender. É a lei." : `${n}, você está presa. Cinco dias no calabouço.`],
          ["", `${n} foi levada para o calabouço. A vila está em choque.`],
        ]);
    };
    if (!here) return finish();
    choice("Gritaria na praça!", `${n} está indo atrás do Lucas Marzoca, furiosa, depois de mais uma cantada no ${hus}.`, [
      {
        t: `Tentar acalmar ${n}`,
        icon: "heart",
        fn: () => {
          const ch = 0.35 + friendship(wife) / 200 + ((player.rep ?? 50) - 50) / 300;
          if (Math.random() < ch) {
            relAdd(wife, "lucas", 30);
            addFriendship(wife, 4);
            vilaNews(`${player.name} segurou ${n} na praça e salvou o Lucas Marzoca de uma tragédia.`);
            return say([[player.name, `${n}, calma! Ele é bobo, mas não vale a cadeia!`], [n, "...Tá. Mas se ele chegar perto do " + hus + " de novo, ninguém me segura."], ["Lucas Marzoca", "Obrigado! Eu... vou dar um tempo. Uns dois dias."]]);
          }
          say([[n, "SAI DA FRENTE!"], ["", `${n} passa por você.`]], finish);
        },
      },
      { t: "Chamar a guarda", icon: "shield", fn: () => (Math.random() < 0.5 ? ((player.npcJail = Object.assign(player.npcJail || {}, { [wife]: player.day + 2 })), say([["General Marcos", `${n}, pra cela. Dois dias pra esfriar a cabeça.`], ["Lucas Marzoca", "Viu? Ela me ama tanto que tem ciúme."]])) : say([["", "A guarda chega tarde demais."]], finish)) },
      { t: "Assistir de longe", icon: "eye", fn: finish },
    ]);
  }

  /** Todo dia: se a raiva da esposa passou do limite, pode acontecer. */
  const ndBase = npcDaily;
  npcDaily = function () {
    ndBase.apply(this, arguments);
    if (!lifeMode() || isDead("lucas")) return;
    for (const [wife, hus] of Object.entries(WIVES)) {
      if (isDead(wife) || jailedNpc(wife)) continue;
      const stolen = (npcPartner("lucas") === hus || npcSpouse("lucas") === hus) && npcSpouse(wife) !== hus;
      const r = relOf(wife, "lucas");
      if (r <= -60 && Math.random() < 0.25) vilaNews(`${shortName(wife)} foi vista afiando uma faca e olhando para o Lucas Marzoca. Alguém avisa ele.`);
      if ((stolen && Math.random() < 0.5) || (r <= -90 && Math.random() < 0.18)) {
        setTimeout(() => (isDead("lucas") ? 0 : busy() ? killMarzoca(wife) : confrontation(wife)), 5000);
        return;
      }
    }
  };
  // No calabouço, quem matou o Marzoca aparece na cela do canto.
  const ejBase = enterJail;
  enterJail = function () {
    const r = ejBase.apply(this, arguments);
    const who = Object.keys(player.npcJail || {}).find((id) => jailedNpc(id));
    if (who && game.jailA && typeof CREW_LOOKS !== "undefined" && CREW_LOOKS[who]) Object.assign(game.jailA.other, { robe: CREW_LOOKS[who].robe, hair: CREW_LOOKS[who].hair, nm: shortName(who) });
    return r;
  };
})();
