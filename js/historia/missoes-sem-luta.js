/**
 * ECOS DO ARCANO — missoes-sem-luta.js (modo História)
 * Missões para resolver com a cabeça, não com magia:
 *  - O Ladrão de Tortas (Dona Cocada): investigar três suspeitos e acusar o certo.
 *  - A Canção do Bardo (Bardo Lírio): jogo da memória com as notas das runas.
 *  - Enigmas da Biblioteca (Bibliotecária Iara): quatro charadas.
 *  - Entregas da Rosa: três cestas pela vila antes que o pão esfrie.
 *  - Ervas da Maíra: uma erva rara no Bosque, uma no Pântano e uma nos Picos.
 *  - A Carta de Dona Flor: três pedaços de uma carta rasgada, espalhados pela vila.
 *  - O Coração de Lia: ajudar a Lia a se declarar, escolhendo as palavras certas.
 * Fale com quem tem a estrela em cima da cabeça. Tudo aparece em Missões (Q).
 * Modifica (envolve) funções de outros arquivos: crewDrawList, interactAt,
 * socialMenu, targetAt, townQuestsHTML, update.
 */

"use strict";

function calm() {
  return (player.calm = player.calm || {});
}
function cq(id) {
  return calm()[id] || null;
}
function cqStart(id, data = {}) {
  calm()[id] = Object.assign({ st: "ativo" }, data);
  saveGame();
  playSound(660, 0.12, "sine");
  toast("Missão nova! Veja em Missões (Q).", 2400);
}
function cqDone(id, reward) {
  calm()[id] = Object.assign(cq(id) || {}, { st: "feito" });
  if (reward.gold) player.gold += reward.gold;
  if (reward.xp) gainXP(reward.xp);
  for (const [it, n] of reward.items || []) addItem(it, n);
  if (reward.friend) addFriendship(reward.friend, 15);
  saveGame();
  playSound(1047, 0.25, "triangle");
  const parts = [reward.gold && `+${reward.gold} de ouro`, reward.xp && `+${reward.xp} XP`, ...(reward.items || []).map(([it, n]) => `${n}× ${ITEMS[it] ? ITEMS[it].nome : it}`)].filter(Boolean);
  toast(`Missão concluída! ${parts.join(", ")}`, 3600);
}
const cqName = (id) => (NPCS[id] ? shortName(id) : id);

/* ===================== 1. O LADRÃO DE TORTAS ===================== */
const PIE_SUSPECTS = {
  peixeiro: { clue: "Hoje cedo eu vi farelo de torta no chão... bem do lado da barraca de brinquedos.", alibi: "Eu? Passei a manhã limpando peixe. Cheira minha mão, se tiver coragem." },
  lucio: { clue: "O Seu Pipoca veio comprar um anel e deixou o balcão todo grudento de geleia de amora.", alibi: "Eu não como doce. Faz mal para os dentes, e dentes são joias." },
  brinqueiro: { clue: "Eu?! Passei a manhã toda no abrigo, contando história pras crianças! Pergunta pra Lila!", alibi: "" },
  abrigo: { clue: "O Seu Pipoca? Aqui? Hoje? Não, ele não apareceu. As crianças até perguntaram dele.", alibi: "" },
};
function pieMenu(id) {
  const Q = cq("tortas");
  if (id === "cocada") {
    if (!Q)
      return [{ t: "★ Pedido: \"Roubaram as minhas tortas!\"", fn: () => say([["Dona Cocada", "Três tortas de amora sumiram da janela! Três! Eu não tenho prova nenhuma, mas tenho faro."], ["Dona Cocada", "Pergunta pro Nico, pro Ourives Lúcio e pro Seu Pipoca. Alguém viu alguma coisa."]], () => cqStart("tortas", { clues: [] })) }];
    if (Q.st === "ativo" && Q.clues.length >= 3)
      return [
        {
          t: "★ Acusar alguém do roubo das tortas",
          fn: () =>
            choice("Quem roubou as tortas?", `Pistas: ${Q.clues.map((c) => cqName(c)).join(", ")}.`, [
              ...["peixeiro", "lucio", "brinqueiro"].map((s) => ({
                t: cqName(s),
                fn: () =>
                  s === "brinqueiro"
                    ? (say([["", "Seu Pipoca fica vermelho como amora."], ["Seu Pipoca", "Tá bom, tá bom! Eu levei pro abrigo... mas comi uma no caminho. E meia outra."], ["Dona Cocada", "Pra criançada? ...Então tá perdoado. Mas a próxima você PAGA."]]), cqDone("tortas", { gold: 70, xp: 60, items: [["maca", 2]], friend: "cocada" }))
                    : ((Q.clues = []), saveGame(), say([[cqName(s), "EU?! Que absurdo!"], ["Dona Cocada", "Não foi ele, não... Pergunta de novo, presta atenção nos detalhes."]])),
              })),
              { t: "Ainda não sei", fn: null },
            ]),
        },
      ];
    return [];
  }
  if (Q && Q.st === "ativo" && PIE_SUSPECTS[id] && !Q.clues.includes(id) && (id !== "abrigo" || Q.clues.includes("brinqueiro")))
    return [{ t: "★ Perguntar sobre as tortas da Dona Cocada", fn: () => (Q.clues.push(id), saveGame(), say([[cqName(id), PIE_SUSPECTS[id].clue], ["", `Pista anotada (${Math.min(3, Q.clues.length)}/3).`]])) }];
  return [];
}

/* ===================== 2. A CANÇÃO DO BARDO ===================== */
const NOTE_FREQ = { fogo: 523, agua: 587, ar: 659, terra: 784, luz: 880, sombra: 440 };
function playSeq(seq) {
  seq.forEach((r, i) => setTimeout(() => playSound(NOTE_FREQ[r] || 600, 0.3, "triangle", 0.06), 400 + i * 500));
}
function songRound(level, onWin, onLose) {
  const pool = (player.runes.length >= 3 ? player.runes : ["fogo", "agua", "ar", "terra"]).filter((r) => RUNES[r]);
  const seq = Array.from({ length: level + 2 }, () => pool[Math.floor(Math.random() * pool.length)]);
  playSeq(seq);
  say([["Bardo Lírio", `Escuta bem... ♪ ${seq.map((r) => RUNES[r].nome).join(" · ")} ♪`], ["Bardo Lírio", "Agora você! Toque na mesma ordem."]], () => {
    let i = 0;
    const ask = () =>
      choice(`Nota ${i + 1} de ${seq.length}`, "Qual é a próxima nota?", pool.map((r) => ({
        t: `♪ ${RUNES[r].nome}`,
        fn: () => {
          playSound(NOTE_FREQ[r] || 600, 0.25, "triangle", 0.06);
          if (r !== seq[i]) return onLose();
          i++;
          if (i >= seq.length) return onWin();
          ask();
        },
      })));
    ask();
  });
}
function songMenu(id) {
  if (id !== "bardo") return [];
  const Q = cq("bardo");
  if (Q && Q.st === "feito") return [];
  const go = (lv) =>
    songRound(
      lv,
      () => (lv >= 3 ? (say([["Bardo Lírio", "PERFEITO! Três canções sem errar! Cinzaluz vai cantar isso hoje à noite."]]), cqDone("bardo", { gold: 60, xp: 80, friend: "bardo" })) : say([["Bardo Lírio", `Isso! Agora uma mais difícil... (${lv}/3)`]], () => go(lv + 1))),
      () => say([["Bardo Lírio", "Ihh, desafinou! Tudo bem, volta e tenta de novo."]]),
    );
  return [{ t: Q ? "★ Tentar de novo a Canção do Bardo" : "★ Pedido: \"Me ajuda a lembrar uma canção?\"", fn: () => (Q || cqStart("bardo"), say([["Bardo Lírio", "O Silêncio comeu metade das minhas canções. Eu toco um pedaço, você repete. Três rodadas!"]], () => go(1))) }];
}

/* ===================== 3. ENIGMAS DA BIBLIOTECA ===================== */
const RIDDLES = [
  { q: "Tenho cidades, mas não tenho casas. Tenho florestas, mas não tenho árvores. Tenho água, mas não tenho peixes. O que eu sou?", a: "Um mapa", w: ["Um sonho", "Um quadro"] },
  { q: "Quanto mais eu seco, mais molhada eu fico. O que eu sou?", a: "Uma toalha", w: ["Uma esponja", "O sol"] },
  { q: "O que é que, quanto mais se tira, maior fica?", a: "Um buraco", w: ["Uma dívida", "Uma sombra"] },
  { q: "Falo sem boca e ouço sem ouvidos. Não tenho corpo, mas nasço com o vento. O que eu sou?", a: "Um eco", w: ["Um fantasma", "Uma runa"] },
];
function riddleMenu(id) {
  if (id !== "iara") return [];
  const Q = cq("enigmas");
  if (Q && Q.st === "feito") return [];
  const ask = (i) => {
    const R = RIDDLES[i];
    const opts = [R.a, ...R.w].sort(() => Math.random() - 0.5);
    choice(`Enigma ${i + 1} de ${RIDDLES.length}`, R.q, opts.map((o) => ({
      t: o,
      fn: () => {
        if (o !== R.a) return ((cq("enigmas").i = 0), saveGame(), say([["Bibliotecária Iara", "Hmm... não. Volte quando tiver pensado mais. Os livros esperam."]]));
        if (i + 1 >= RIDDLES.length) return say([["Bibliotecária Iara", "Um eco. Claro. Vesper adorava essa charada. Ele escreveu ela na parede desta sala."], ["Bibliotecária Iara", "Leve este tomo velho. Você mereceu."]], () => cqDone("enigmas", { gold: 50, xp: 100, items: [["eter", 2]], friend: "iara" }));
        cq("enigmas").i = i + 1;
        saveGame();
        say([["Bibliotecária Iara", "Correto! Próximo..."]], () => ask(i + 1));
      },
    })));
  };
  return [{ t: Q ? "★ Continuar os Enigmas da Biblioteca" : "★ Pedido: \"Gosta de charadas?\"", fn: () => (Q || cqStart("enigmas", { i: 0 }), say([["Bibliotecária Iara", "Quatro charadas. Erre uma e começa tudo de novo. Os sábios de Cinzaluz faziam isso antes de entrar na Academia."]], () => ask(cq("enigmas").i || 0))) }];
}

/* ===================== 4. ENTREGAS DA ROSA ===================== */
const DELIVERY_TO = ["flor", "doran", "chazeira"];
const DELIVERY_MIN = 120;
function deliveryLeft(Q) {
  return DELIVERY_MIN - ((player.day - Q.day) * 1440 + (player.clock - Q.clock));
}
function deliveryMenu(id) {
  const Q = cq("entregas");
  if (id === "rosa") {
    if (!Q || (Q.st === "ativo" && Q.failed))
      return [{ t: Q ? "★ Tentar as entregas de novo" : "★ Pedido: \"Me ajuda com as entregas?\"", fn: () => say([["Rosa, a Quitandeira", `Três cestas de pão: para ${DELIVERY_TO.map(cqName).join(", ")}. Você tem 2 horas antes de esfriar!`]], () => cqStart("entregas", { day: player.day, clock: player.clock, done: [] })) }];
    return [];
  }
  if (Q && Q.st === "ativo" && !Q.failed && DELIVERY_TO.includes(id) && !Q.done.includes(id))
    return [
      {
        t: `★ Entregar a cesta da Rosa (${Math.max(0, Math.round(deliveryLeft(Q)))} min)`,
        fn: () => {
          if (deliveryLeft(Q) < 0) return ((Q.failed = true), saveGame(), say([[cqName(id), "Ih... esse pão já esfriou. Pode levar de volta, querid" + genderWord("o", "a", "e") + "."], ["", "Tempo esgotado. Fale com a Rosa para tentar de novo."]]));
          Q.done.push(id);
          saveGame();
          if (Q.done.length >= DELIVERY_TO.length) return say([[cqName(id), "Quentinho ainda! Obrigad" + gw(id, "o", "a") + "!"], ["", "Todas as cestas entregues a tempo!"]], () => cqDone("entregas", { gold: 55, xp: 50, items: [["pao", 3]], friend: "rosa" }));
          say([[cqName(id), "Quentinho! Manda um beijo pra Rosa."], ["", `Cesta entregue (${Q.done.length}/${DELIVERY_TO.length}).`]]);
        },
      },
    ];
  return [];
}

/* ===================== 5. ERVAS DA MAÍRA ===================== */
const HERBS = [
  { z: "bosque", n: "musgo-lua" },
  { z: "pantano", n: "lírio-de-brejo" },
  { z: "picos", n: "flor-de-gelo" },
];
function herbMenu(id) {
  if (id !== "curandeira") return [];
  const Q = cq("ervas");
  if (!Q) return [{ t: "★ Pedido: \"Preciso de ervas raras\"", fn: () => say([["Curandeira Maíra", "Os feridos do Silêncio precisam de um remédio forte. Preciso de musgo-lua do Bosque, lírio-de-brejo do Pântano e flor-de-gelo dos Picos."], ["Curandeira Maíra", "Elas brilham fraquinho. Procure com calma."]], () => cqStart("ervas", { got: [] })) }];
  if (Q.st === "ativo" && Q.got.length >= HERBS.length) return [{ t: "★ Entregar as três ervas", fn: () => say([["Curandeira Maíra", "Todas as três! Com isso eu salvo uma dúzia de pessoas. E faço umas poções para você."]], () => cqDone("ervas", { gold: 40, xp: 90, items: [["pocao", 3]], friend: "curandeira" })) }];
  return [];
}
function herbHere() {
  const Q = cq("ervas");
  if (!Q || Q.st !== "ativo") return null;
  const i = HERBS.findIndex((h) => h.z === player.zone && !Q.got.includes(i_(h)));
  return i >= 0 ? { i, p: spotOf(player.zone, "erva") } : null;
}
const i_ = (h) => HERBS.indexOf(h);

/* ===================== 6. A CARTA DE DONA FLOR ===================== */
function letterSpots() {
  return [0, 1, 2].map((i) => spotOf("vila", "carta" + i));
}
function letterMenu(id) {
  if (id !== "flor") return [];
  const Q = cq("carta");
  if (!Q) return [{ t: "★ Pedido: \"O vento levou a minha carta\"", fn: () => say([["Dona Flor", "Uma carta velha, do meu Joaquim. Eu guardava há quarenta anos. O vento rasgou e espalhou pela vila."], ["Dona Flor", "Três pedaços, meu bem. Eu não enxergo mais tão bem para procurar."]], () => cqStart("carta", { got: [] })) }];
  if (Q.st === "ativo" && Q.got.length >= 3)
    return [
      {
        t: "★ Devolver a carta da Dona Flor",
        fn: () =>
          choice("A carta", "Os três pedaços se encaixam. Dá para ler: \"Flor, se eu não voltar do mar, plante girassóis. Eu vou ver de onde estiver.\"", [
            { t: "Ler a carta em voz alta para ela", icon: "heart", fn: () => say([["", "Você lê devagar. Dona Flor fecha os olhos e sorri."], ["Dona Flor", "Quarenta anos plantando girassóis, e eu nunca soube por quê. Agora eu sei."]], () => cqDone("carta", { gold: 30, xp: 70, friend: "flor" })) },
            { t: "Entregar dobrada, sem ler", icon: "book", fn: () => say([["Dona Flor", "Obrigada por não ler. Algumas palavras são só minhas."], ["", "Ela aperta a carta contra o peito."]], () => cqDone("carta", { gold: 30, xp: 70, friend: "flor" })) },
          ]),
      },
    ];
  return [];
}
function letterHere() {
  const Q = cq("carta");
  if (!Q || Q.st !== "ativo" || player.zone !== "vila") return [];
  return letterSpots().map((p, i) => ({ p, i })).filter((s) => s.p && !Q.got.includes(s.i));
}

/* ===================== 7. O CORAÇÃO DE LIA ===================== */
const LIA_STEPS = [
  { q: "Lia está escondida atrás de você, segurando um girassol. O Bardo olha para vocês duas. Como você começa?", o: [["\"A Lia tem uma coisa para te dizer.\"", 1], ["\"A Lia ACHA VOCÊ LINDO!\"", -1], ["Ficar calad" + "a/o e empurrar a Lia", 0]] },
  { q: "Lia gagueja. O Bardo espera, curioso. O que você sussurra para ela?", o: [["\"Fala da canção que ele tocou na feira.\"", 1], ["\"Fala logo, ele vai embora!\"", -1], ["\"Respira. Eu estou aqui.\"", 1]] },
  { q: "Lia fala da canção. O Bardo sorri. Ela olha para você, sem saber o que fazer.", o: [["Fazer sinal para ela entregar o girassol", 1], ["Pedir para o Bardo tocar a canção de novo", 1], ["Sair de fininho para deixar os dois sozinhos", 2]] },
];
function liaMenu(id) {
  const Q = cq("lia");
  if (id === "lia" && !Q) return [{ t: "★ Pedido: \"Eu tenho vergonha de falar com ele...\"", fn: () => say([["Lia", "É o Bardo Lírio... toda vez que ele toca, eu esqueço até meu nome. Você vai comigo falar com ele? Por favor?"]], () => cqStart("lia", { score: 0 })) }];
  if (id === "bardo" && Q && Q.st === "ativo") {
    const step = (i) => {
      if (i >= LIA_STEPS.length) {
        const good = Q.score >= 3;
        return say(good ? [["Bardo Lírio", "Lia... eu escrevi uma canção com girassóis. Achei que ninguém ia entender. Quer ouvir?"], ["Lia", "(Ela não consegue falar. Só faz que sim com a cabeça, sorrindo.)"]] : [["Bardo Lírio", "Ah... obrigado pelo girassol, Lia. Muito gentil."], ["Lia", "(Ela sorri meio triste.) Pelo menos eu falei. Obrigada por ir comigo."]], () => cqDone("lia", { gold: good ? 50 : 20, xp: good ? 90 : 40, friend: "lia" }));
      }
      const S = LIA_STEPS[i];
      choice("O Coração de Lia", S.q, S.o.map(([t, v]) => ({ t: t.replace("a/o", genderWord("o", "a", "e")), fn: () => ((Q.score += v), step(i + 1)) })));
    };
    return [{ t: "★ Levar a Lia para falar com o Bardo", fn: () => ((Q.score = 0), step(0)) }];
  }
  return [];
}

/* ===================== LISTA E LIGAÇÕES ===================== */
const CALM_QUESTS = [
  { id: "tortas", n: "O Ladrão de Tortas", giver: "cocada", hint: (Q) => (Q.clues.length >= 3 ? "Volte à Dona Cocada e acuse alguém." : `Pistas: ${Q.clues.length}/3. Pergunte ao Nico, ao Ourives Lúcio e ao Seu Pipoca. Confira o que eles dizem.`) },
  { id: "bardo", n: "A Canção do Bardo", giver: "bardo", hint: () => "Repita as notas do Bardo Lírio na ordem certa (3 rodadas)." },
  { id: "enigmas", n: "Enigmas da Biblioteca", giver: "iara", hint: (Q) => `Charada ${(Q.i || 0) + 1} de ${RIDDLES.length}. Fale com a Bibliotecária Iara.` },
  { id: "entregas", n: "Entregas da Rosa", giver: "rosa", hint: (Q) => (Q.failed ? "O pão esfriou. Fale com a Rosa para tentar de novo." : `Entregue para ${DELIVERY_TO.filter((d) => !Q.done.includes(d)).map(cqName).join(", ")}. Faltam ${Math.max(0, Math.round(deliveryLeft(Q)))} min.`) },
  { id: "ervas", n: "Ervas da Maíra", giver: "curandeira", hint: (Q) => (Q.got.length >= 3 ? "Leve as ervas para a Curandeira Maíra." : `Ervas: ${HERBS.map((h, i) => (Q.got.includes(i) ? "✓ " : "") + h.n + " (" + ZONES[h.z].nome + ")").join(", ")}.`) },
  { id: "carta", n: "A Carta de Dona Flor", giver: "flor", hint: (Q) => (Q.got.length >= 3 ? "Leve a carta para a Dona Flor." : `Pedaços: ${Q.got.length}/3. Procure papéis brilhando pela vila.`) },
  { id: "lia", n: "O Coração de Lia", giver: "lia", hint: () => "Fale com o Bardo Lírio para levar a Lia até ele." },
];
const CALM_MENUS = [pieMenu, songMenu, riddleMenu, deliveryMenu, herbMenu, letterMenu, liaMenu];
function calmOptions(id) {
  if (!story() || !NPCS[id]) return [];
  return CALM_MENUS.flatMap((f) => {
    try {
      return f(id);
    } catch (e) {
      return [];
    }
  });
}
/** Esta pessoa tem um pedido novo ou uma etapa esperando por você? */
function calmMarker(id) {
  return calmOptions(id).length > 0;
}
{
  // Quem não tem menu de amizade (lojas, Bardo, Dona Flor...) ganha um menu curto.
  const ntBase = npcTalkOrQuests;
  npcTalkOrQuests = function (id) {
    const extra = calmOptions(id);
    if (!extra.length) return ntBase.apply(this, arguments);
    const args = arguments;
    choice(NPCS[id].nome, "O que você quer?", [...extra.map((o) => Object.assign({ icon: "star" }, o)), { t: "Conversar", icon: "chat", fn: () => ntBase.apply(this, args) }, { t: "Sair", fn: null }]);
  };
  const smBase = socialMenu;
  socialMenu = function (id) {
    const extra = FRIENDS[id] ? calmOptions(id) : [];
    if (!extra.length) return smBase(id);
    hookChoice(
      () => smBase(id),
      (title, text, opts) => [title, text, [...extra.map((o) => Object.assign({ icon: "star" }, o)), ...opts]],
    );
  };

  const thBase = townQuestsHTML;
  townQuestsHTML = function () {
    let h = thBase();
    if (!story()) return h;
    h += `<h3>${iconHTML("star")}Missões sem luta</h3>`;
    for (const q of CALM_QUESTS) {
      const Q = cq(q.id);
      const s = !Q ? `fale com ${cqName(q.giver)}` : Q.st === "feito" ? "concluída" : q.hint(Q);
      h += `<div class="qs ${Q && Q.st === "feito" ? "done" : ""}">${q.n}<div class="qtip">${s}</div></div>`;
    }
    return h;
  };

  const tgtBase = targetAt;
  targetAt = function (x, y) {
    if (story()) {
      const H = herbHere();
      if (H && H.p && near(H.p, x, y)) return `Colher ${HERBS[H.i].n}`;
      if (letterHere().some((s) => near(s.p, x, y))) return "Pegar pedaço de carta";
    }
    return tgtBase(x, y);
  };
  const iaBase = interactAt;
  interactAt = function (x, y) {
    if (story()) {
      const H = herbHere();
      if (H && H.p && near(H.p, x, y)) {
        cq("ervas").got.push(H.i);
        saveGame();
        playSound(880, 0.12, "sine");
        return say([["", `Você colhe com cuidado: ${HERBS[H.i].n}. (${cq("ervas").got.length}/3)`]]);
      }
      const L = letterHere().find((s) => near(s.p, x, y));
      if (L) {
        cq("carta").got.push(L.i);
        saveGame();
        playSound(880, 0.12, "sine");
        const bits = ["\"Flor, se eu não voltar...\"", "\"...plante girassóis...\"", "\"...eu vou ver de onde estiver.\""];
        return say([["", `Um pedaço de papel amarelado: ${bits[L.i]} (${cq("carta").got.length}/3)`]]);
      }
    }
    return iaBase(x, y);
  };

  const cdBase = crewDrawList;
  crewDrawList = function (list, t) {
    cdBase(list, t);
    if (!story()) return;
    const glow = (p, col, i) =>
      p &&
      list.push({
        y: p[1],
        draw: () => {
          ctx.fillStyle = col.replace("A", String(0.45 + 0.4 * Math.sin(t * 4 + i)));
          ctx.fillRect(p[0] * TILE + 12, p[1] * TILE + 12 - Math.abs(Math.sin(t * 3 + i)) * 3, 8, 8);
        },
      });
    const H = herbHere();
    if (H) glow(H.p, "rgba(170,255,200,A)", 0);
    letterHere().forEach((s) => glow(s.p, "rgba(255,240,190,A)", s.i));
    if (player.zone === "vila" && !game.dialog) {
      game.calmMarkT = (game.calmMarkT || 0) + 1;
      if (game.calmMarkT % 30 === 1) game.calmMarks = [...new Set(Object.values(ZONES.vila.npcs))].filter(calmMarker);
      for (const id of game.calmMarks || []) {
        const p = npcPos(id);
        if (p && !npcHidden(id)) list.push({ y: p[1] + 0.02, draw: () => drawPixelIcon("star", p[0] * TILE + 16, p[1] * TILE - 10 - Math.abs(Math.sin(t * 3)) * 3, 2) });
      }
    }
  };
}
ACHIEVEMENTS.push(
  ["detetive", "Detetive de Cinzaluz", "Descubra quem roubou as tortas da Dona Cocada.", "eye", () => !!(player.calm && player.calm.tortas && player.calm.tortas.st === "feito")],
  ["semluta", "A cabeça também é arma", "Conclua as 7 missões sem luta.", "book", () => CALM_QUESTS.every((q) => player.calm && player.calm[q.id] && player.calm[q.id].st === "feito")],
);
