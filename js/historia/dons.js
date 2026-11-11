/**
 * ECOS DO ARCANO — dons.js
 * Os Dons: o poder com que o aprendiz começa.
 *
 * As seis runas foram roubadas pelo Silêncio, então não faz sentido o jogador
 * já começar com uma delas. Na criação ele escolhe um DOM, um poder próprio
 * que não é runa. No começo da aventura o dom é a única magia que ele tem;
 * cada runa recuperada dos Guardiões soma novos feitiços (e combinações com
 * o dom) e libera a habilidade daquela runa.
 *
 * Caminho das runas: Ent → Terra · Farol de Brisamar → Chama ·
 * Serpente → Sombra · Grifo → Vento · Basilisco → Luz · Leviatã → Maré.
 *
 * Saves antigos, que começaram com uma runa, continuam funcionando como antes.
 */

"use strict";

const DONS = {
  canto: {
    nome: "Canto",
    t: "Canto Arcano",
    cor: "#ff8ad0",
    art: "o Canto",
    de: "do Canto",
    d: "Sua voz vira magia. Ondas de som cortam, atordoam e cegam os inimigos.",
    combo: "Canção",
    s1: { nome: "Nota Aguda", pow: 9, mp: 0, lore: "A primeira nota. Onde o Silêncio cai, alguém ainda precisa cantar." },
    s2: { nome: "Grito Ressonante", pow: 20, blind: 2, mp: 7, lore: "Uma voz forte o bastante faz até a pedra lembrar que tem eco." },
    sk: "hino",
    icon: { fill: "M10 3l10-2v13.5a3.5 3.5 0 1 1-2-3.1V5.4l-6 1.2v10.9a3.5 3.5 0 1 1-2-3.1Z" },
  },
  mente: {
    nome: "Mente",
    t: "Mente Desperta",
    cor: "#8fa8ff",
    art: "a Mente",
    de: "da Mente",
    d: "Telecinese e intuição. Você empurra, esmaga e adivinha o próximo golpe.",
    combo: "Visão",
    s1: { nome: "Empurrão Mental", pow: 9, mp: 0, lore: "Pensar com força é o primeiro feitiço que nenhuma runa ensina." },
    s2: { nome: "Esmagar Mental", pow: 22, weaken: 2, mp: 7, lore: "A dúvida pesa mais do que qualquer rocha." },
    sk: "previsao",
    icon: {
      fill: "M2 12C5 6 9 4 12 4s7 2 10 8c-3 6-7 8-10 8s-7-2-10-8Z",
      detail: "M12 8a4 4 0 1 0 .01 0Z",
    },
  },
  fera: {
    nome: "Fera",
    t: "Espírito da Fera",
    cor: "#e0665a",
    art: "a Fera",
    de: "da Fera",
    d: "Um espírito animal luta ao seu lado. Garras rápidas, golpes múltiplos e couro duro.",
    combo: "Fúria",
    s1: { nome: "Garra Espiritual", pow: 9, mp: 0, lore: "O lobo que mora em você nunca dormiu, nem no Silêncio." },
    s2: { nome: "Investida da Matilha", pow: 13, hits: 2, mp: 8, lore: "Quem luta com a matilha nunca luta sozinho." },
    sk: "couro",
    icon: {
      fill: "M12 11c3 0 6 3.5 6 6.5 0 2-1.6 3-3 3-1.2 0-2-.6-3-.6s-1.8.6-3 .6c-1.4 0-3-1-3-3 0-3 3-6.5 6-6.5ZM5.5 6a2 2.5 0 1 0 .01 0ZM18.5 6a2 2.5 0 1 0 .01 0ZM9 2.2a2 2.6 0 1 0 .01 0ZM15 2.2a2 2.6 0 1 0 .01 0Z",
    },
  },
  vida: {
    nome: "Pulso Vital",
    t: "Pulso Vital",
    cor: "#7be36b",
    art: "o Pulso Vital",
    de: "do Pulso Vital",
    d: "A força da própria vida. Golpes que roubam vigor e curas poderosas.",
    combo: "Seiva",
    s1: { nome: "Toque Vital", pow: 8, drain: true, mp: 0, lore: "Toda vida pulsa. Basta encostar para sentir, e para tomar." },
    s2: { nome: "Onda de Vigor", pow: 18, drain: true, mp: 7, lore: "O coração bate duas vezes, e o inimigo sente as duas." },
    sk: "renovar",
    icon: { fill: "M12 21C5 15 2 12 2 8a5 5 0 0 1 10-1 5 5 0 0 1 10 1c0 4-3 7-10 13Z" },
  },
};
const DOM_IDS = Object.keys(DONS);
const isDom = (id) => !!DONS[id];

/* ---- os dons entram nas mesmas tabelas das runas (nome, cor, ícone) ---- */
for (const id of DOM_IDS) {
  const d = DONS[id];
  RUNES[id] = { nome: d.nome, cor: d.cor, dom: true };
  RUNE_OF[id] = d.de;
  RUNE_WITH_ARTICLE[id] = d.art;
  RUNE_ICON[id] = d.icon;
}

/* ---- habilidades e tomos de cada dom ---- */
Object.assign(SKILLS, {
  hino: { nome: "Hino de Coragem", el: "canto", mp: 8, cd: 4, desc: "Seus próximos 2 feitiços causam +80% de dano." },
  previsao: { nome: "Previsão", el: "mente", mp: 8, cd: 4, desc: "Você esquiva dos próximos 2 ataques." },
  couro: { nome: "Couro de Urso", el: "fera", mp: 8, cd: 4, desc: "Por 2 turnos, -70% de dano recebido e reflete 25%." },
  renovar: { nome: "Renovação", el: "vida", mp: 10, cd: 4, desc: "Cura 15% do HP agora e por 3 turnos. Remove veneno." },

  acorde: { nome: "Acorde Cortante", tome: 1, el: "canto", mp: 12, cd: 1, pow: 30, desc: "Dano forte de Canto." },
  ninar: { nome: "Canção de Ninar", tome: 2, el: "canto", mp: 12, cd: 3, pow: 14, blind: 3, weaken: 2, desc: "Dano, cega e enfraquece." },
  sinfonia: { nome: "Sinfonia Final", tome: 3, el: "canto", mp: 20, cd: 4, pow: 55, pierce: true, desc: "Dano enorme que ignora resistências." },

  lancaM: { nome: "Lança Psíquica", tome: 1, el: "mente", mp: 12, cd: 1, pow: 30, desc: "Dano forte de Mente." },
  ilusao: { nome: "Ilusão", tome: 2, el: "mente", mp: 12, cd: 3, pow: 14, blind: 3, weaken: 2, desc: "Dano, cega e enfraquece." },
  colapso: { nome: "Colapso Mental", tome: 3, el: "mente", mp: 20, cd: 4, pow: 55, pierce: true, desc: "Dano enorme que ignora resistências." },

  mordida: { nome: "Mordida do Lobo", tome: 1, el: "fera", mp: 12, cd: 1, pow: 30, desc: "Dano forte de Fera." },
  rugido: { nome: "Rugido", tome: 2, el: "fera", mp: 12, cd: 3, pow: 14, weaken: 3, desc: "Dano e enfraquece por 3 turnos." },
  manada: { nome: "Estouro da Manada", tome: 3, el: "fera", mp: 20, cd: 4, pow: 19, hits: 3, desc: "Três golpes fortes seguidos." },

  espinho: { nome: "Espinho Vital", tome: 1, el: "vida", mp: 12, cd: 1, pow: 30, desc: "Dano forte de Pulso Vital." },
  bencaoV: { nome: "Bênção da Vida", tome: 2, el: "vida", mp: 16, cd: 4, heal: 0.5, desc: "Cura 50% do HP e regenera por 3 turnos." },
  florescer: { nome: "Florescer Eterno", tome: 3, el: "vida", mp: 20, cd: 4, pow: 55, pierce: true, desc: "Dano enorme que ignora resistências." },
});
SKILL_EFFECTS.hino = SKILL_EFFECTS.furia;
SKILL_EFFECTS.previsao = SKILL_EFFECTS.passo;
SKILL_EFFECTS.couro = SKILL_EFFECTS.rocha;
SKILL_EFFECTS.renovar = SKILL_EFFECTS.mare;

/* ---- feitiços do dom (o dom sozinho, duplo e combinado com cada runa) ---- */
const DOM_COMBO_FX = {
  fogo: { burn: 3 },
  agua: { heal: 12 },
  ar: { hits: 2, pow: 10 },
  terra: { weaken: 2 },
  luz: { blind: 2 },
  sombra: { drain: true },
};
function installDom(id) {
  for (const k of Object.keys(SPELLS)) if (k.split("+").some(isDom)) delete SPELLS[k];
  const d = DONS[id];
  if (!d) return;
  SPELLS[id] = Object.assign({ el: [id] }, d.s1);
  SPELLS[id + "+" + id] = Object.assign({ el: [id] }, d.s2);
  for (const r of ORDER) {
    SPELLS[spellKey([id, r])] = Object.assign(
      {
        nome: `${d.combo} ${RUNE_OF[r]}`,
        el: [id, r],
        pow: 18,
        mp: 6,
        lore: `${RUNE_WITH_ARTICLE[r][0].toUpperCase() + RUNE_WITH_ARTICLE[r].slice(1)} voltou e aprendeu a cantar junto com ${d.art}.`,
      },
      DOM_COMBO_FX[r],
    );
  }
}

/** O que o jogador pode tecer em batalha: o dom e as runas recuperadas. */
function castList() {
  const dom = player && player.dom && DONS[player.dom] ? [player.dom] : [];
  return dom.concat((player && player.runes) || []);
}
/** Cor da magia do jogador (cajado, brilho): a última runa ou o dom. */
function magicColor() {
  const l = castList();
  const r = l[l.length - 1];
  return RUNES[r] ? RUNES[r].cor : "#ffe066";
}

/* ---- habilidades: a do dom sempre; a de cada runa quando ela volta ---- */
skillUnlocked = function (id) {
  const k = SKILLS[id];
  if (!k) return false;
  if (k.tome) return k.el === player.aff && player.tomes.includes(id);
  if (k.el) return k.el === player.aff || (!!player.dom && player.runes.includes(k.el));
  return player.lvl >= k.lvl;
};
function skillShown(k) {
  return !k.el || k.el === player.aff || (!!player.dom && !k.tome && player.runes.includes(k.el));
}

/* ---- tela de escolha: dons em vez de runas ---- */
showChoose = function () {
  game.mode = "choose";
  byId("story").style.display = "none";
  byId("cards").innerHTML = DOM_IDS.map((id, i) => {
      const d = DONS[id],
        k = SKILLS[d.sk];
      return `<button class="card" data-r="${id}"><h4>${runeSVG(id, 22)}<span style="color:${d.cor}">${i + 1}. ${d.t}</span></h4><p>${d.d}</p><p>Habilidade: <b style="color:#fff">${k.nome}</b>. ${k.desc}</p></button>`;
    }).join("");
  byId("cards")
    .querySelectorAll(".card")
    .forEach((b) => (b.onclick = () => pickElement(b.dataset.r)));
  byId("choose").style.display = "flex";
};
(() => {
  const basePick = pickElement;
  pickElement = function (r) {
    if (!isDom(r)) return basePick(r);
    player.dom = r;
    player.aff = r;
    player.runes = [];
    player.spells = [];
    // o dom abre o caminho: o Ent é fraco contra ele, e cada Guardião é fraco
    // contra a runa que o anterior devolveu.
    player.order = [r, "terra", "sombra", "ar", "luz", "agua"];
    player.flags = player.flags || {};
    player.flags.ordV2 = true;
    installDom(r);
    byId("choose").style.display = "none";
    playSound(784, 0.15, "sine");
    startGame(true);
  };
})();

/* ---- ao carregar um jogo, os feitiços do dom voltam para a tabela ---- */
(() => {
  const baseStart = startGame;
  startGame = function () {
    installDom(player && player.dom);
    return baseStart.apply(this, arguments);
  };
})();

/* ---- falas que falavam da "sua runa" ---- */
(() => {
  const baseIntro = INTRO;
  INTRO = function () {
    const l = baseIntro();
    if (player.dom && l[0])
      l[0] = [
        "Arquimaga Odelia",
        `Acorde, ${player.name}. Eu sou Odelia. Quando o Silêncio caiu, eu resisti a ele, e ele me impediu de envelhecer. As seis runas se calaram... mas em você vive outro poder: ${RUNE_WITH_ARTICLE[player.dom]}. Por enquanto, é toda a magia que existe no mundo.`,
      ];
    return l;
  };
})();
TUTORIAL_STEPS[0] =
  "1/5 · Clique no seu DOM (ou aperte a tecla 1). As runas foram roubadas: por enquanto o dom é a sua magia.";
TUTORIAL_STEPS[1] = "2/5 · Escolha o dom mais uma vez para um golpe duplo, mais forte. Depois clique em LANÇAR (Enter).";
TUTORIAL_STEPS[3] = "4/5 · Clique em HABILIDADES e use a sua. Cada dom tem uma habilidade especial (e cada runa que voltar traz outra).";

/** Em que ponto da conversa com Odelia estamos (1 a 4), pelos três primeiros Guardiões. */
function odeliaStage() {
  const g = player.guards || [];
  return 1 + ["bosque", "pantano", "picos"].filter((z) => g.includes(z)).length;
}
