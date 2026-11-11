/**
 * ECOS DO ARCANO — dons.js
 * Os Dons: o elemento com que o aprendiz começa (Lava, Gelo, Raio, Metal, Cristal ou Veneno).
 *
 * As seis runas foram roubadas pelo Silêncio, então não faz sentido o jogador
 * já começar com uma delas. Na criação ele escolhe um DOM, um elemento próprio
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
  raio: {
    rune: "ar",
    nome: "Raio",
    t: "Raio",
    cor: "#ffd23f",
    art: "o Raio",
    de: "do Raio",
    d: "A eletricidade das tempestades. Golpes rápidos que acertam várias vezes.",
    combo: "Raio",
    s1: { nome: "Choque", pow: 9, mp: 0, lore: "Um estalo na ponta dos dedos. O céu também começou assim." },
    s2: { nome: "Relâmpago Duplo", pow: 12, hits: 2, mp: 8, lore: "O raio nunca cai duas vezes no mesmo lugar. A não ser que você mande." },
    sk: "sobrecarga",
    tomes: ["trovao", "clarao", "furiaCeus"],
    icon: { fill: "M13 2 4 14h6l-1 8 9-12h-6l1-8Z" },
  },
  gelo: {
    rune: "agua",
    nome: "Gelo",
    t: "Gelo",
    cor: "#aee8ff",
    art: "o Gelo",
    de: "do Gelo",
    d: "O frio que para tudo. Congela os inimigos e confunde os ataques deles.",
    combo: "Geada",
    s1: { nome: "Estilhaço de Gelo", pow: 9, mp: 0, lore: "Uma lasca de inverno, afiada como a primeira manhã de neve." },
    s2: { nome: "Nevasca", pow: 18, freeze: 1, mp: 8, lore: "Quando o vento esquece de soprar, o frio toma conta." },
    sk: "espelho",
    tomes: ["lancaG", "geada", "zero"],
    icon: { stroke: true, fill: "M12 2v20M3.3 7l17.4 10M3.3 17 20.7 7M9 3.5l3 2 3-2M9 20.5l3-2 3 2" },
  },
  metal: {
    rune: "terra",
    nome: "Metal",
    t: "Metal",
    cor: "#b8c4d0",
    art: "o Metal",
    de: "do Metal",
    d: "Ferro e aço obedecem a você. Golpes pesados que quebram defesas e uma pele de ferro.",
    combo: "Lâmina",
    s1: { nome: "Lâmina de Aço", pow: 9, mp: 0, lore: "Todo ferreiro sabe: o metal lembra de cada martelada." },
    s2: { nome: "Martelo de Ferro", pow: 22, weaken: 2, mp: 7, lore: "Nada fica de pé depois que o ferro decide cair." },
    sk: "peleFerro",
    tomes: ["lanca", "correntes", "forja"],
    icon: { fill: "M3 7h14l4 3h-6v3c0 2 2 3 4 3v3H5v-3c2 0 4-1 4-3v-3H3Z" },
  },
  veneno: {
    rune: "sombra",
    nome: "Veneno",
    t: "Veneno",
    cor: "#c3e83a",
    art: "o Veneno",
    de: "do Veneno",
    d: "Toxinas da floresta e dos pântanos. Envenena, rouba a vida e enfraquece o inimigo.",
    combo: "Peçonha",
    s1: { nome: "Dardo Tóxico", pow: 8, drain: true, mp: 0, lore: "Uma gota basta. A paciência faz o resto." },
    s2: { nome: "Nuvem Venenosa", pow: 18, drain: true, mp: 7, lore: "O pântano ensinou: quem respira a névoa errada não respira mais." },
    sk: "antidoto",
    tomes: ["vibora", "miasma", "peste"],
    icon: {
      fill: "M12 2c3 5 7 9 7 13a7 7 0 0 1-14 0c0-4 4-8 7-13Z",
      detail: "M10 12.5a1.5 1.5 0 1 0 .01 0ZM14 16a1.2 1.2 0 1 0 .01 0Z",
    },
  },
};
Object.assign(DONS, {
  lava: {
    rune: "fogo",
    nome: "Lava",
    t: "Lava",
    cor: "#ff4f2e",
    art: "a Lava",
    de: "da Lava",
    d: "O fogo que dorme debaixo da terra. Queima devagar e derrete qualquer defesa.",
    combo: "Magma",
    s1: { nome: "Gota de Magma", pow: 9, burn: 2, mp: 0, lore: "Uma gota que ainda lembra do coração do vulcão." },
    s2: { nome: "Erupção", pow: 20, burn: 3, mp: 8, lore: "A montanha guarda a raiva por séculos. Depois devolve toda de uma vez." },
    sk: "brasa",
    tomes: ["rocha_derretida", "cinzas", "vulcao"],
    icon: { fill: "M3 21l5-9 3 4 4-8 6 13Z", detail: "M15 8c0-2 1-3 2-4 0 1.5-1 2.5-2 4Z" },
  },
  cristal: {
    rune: "luz",
    nome: "Cristal",
    t: "Cristal",
    cor: "#ff9ee6",
    art: "o Cristal",
    de: "do Cristal",
    d: "Cristais que refletem e ofuscam. Cega os inimigos e cria barreiras de prisma.",
    combo: "Prisma",
    s1: { nome: "Lasca de Cristal", pow: 9, mp: 0, lore: "Dentro de cada cristal dorme uma luz que ninguém acendeu." },
    s2: { nome: "Prisma Ofuscante", pow: 18, blind: 2, mp: 7, lore: "Mil reflexos, e só um deles é você." },
    sk: "refracao",
    tomes: ["lancaC", "prisaoC", "supernova"],
    icon: { fill: "M12 2l6 7-6 13-6-13Z", detail: "M12 2 10 9h4Z" },
  },
});
// na mesma ordem das runas de que nasceram: Chama, Maré, Vento, Terra, Luz, Sombra
const DOM_IDS = ["lava", "gelo", "raio", "metal", "cristal", "veneno"];
/** O feitiço que nasce quando o dom reencontra a runa de origem. */
const DOM_FUSION = {
  lava: { nome: "Coração do Vulcão", lore: "A Chama voltou para casa, e a montanha inteira acordou com ela." },
  gelo: { nome: "Inverno Eterno", lore: "A Maré lembrou que o gelo também é água, só que com paciência." },
  raio: { nome: "Tempestade Viva", lore: "O Vento trouxe as nuvens. O Raio só precisava disso." },
  metal: { nome: "Gigante de Ferro", lore: "Todo metal nasceu dentro da Terra. Juntos, eles ficam de pé." },
  cristal: { nome: "Prisma Solar", lore: "A Luz entra no cristal sozinha e sai como mil feixes." },
  veneno: { nome: "Praga Noturna", lore: "A Sombra esconde, o Veneno espera. A noite é dos dois." },
};
/** O dom já reencontrou a runa de que nasceu? */
function domAwake() {
  const d = player && player.dom && DONS[player.dom];
  return !!(d && player.runes.includes(d.rune));
}
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
  sobrecarga: { nome: "Sobrecarga", el: "raio", mp: 8, cd: 4, desc: "Seus próximos 2 feitiços causam +80% de dano." },
  espelho: { nome: "Espelho de Gelo", el: "gelo", mp: 8, cd: 4, desc: "Reflexos de gelo te escondem: você esquiva dos próximos 2 ataques." },
  peleFerro: { nome: "Pele de Ferro", el: "metal", mp: 8, cd: 4, desc: "Por 2 turnos, -70% de dano recebido e reflete 25%." },
  antidoto: { nome: "Antídoto", el: "veneno", mp: 10, cd: 4, desc: "Cura 15% do HP agora e por 3 turnos. Remove veneno." },

  trovao: { nome: "Trovão", tome: 1, el: "raio", mp: 12, cd: 1, pow: 30, desc: "Dano forte de Raio." },
  clarao: { nome: "Clarão Elétrico", tome: 2, el: "raio", mp: 12, cd: 3, pow: 14, blind: 3, weaken: 2, desc: "Dano, cega e enfraquece." },
  furiaCeus: { nome: "Fúria dos Céus", tome: 3, el: "raio", mp: 20, cd: 4, pow: 19, hits: 3, desc: "Três raios fortes seguidos." },

  lancaG: { nome: "Lança de Gelo", tome: 1, el: "gelo", mp: 12, cd: 1, pow: 30, desc: "Dano forte de Gelo." },
  geada: { nome: "Geada Profunda", tome: 2, el: "gelo", mp: 12, cd: 3, pow: 14, weaken: 3, blind: 2, desc: "Dano, enfraquece e cega." },
  zero: { nome: "Zero Absoluto", tome: 3, el: "gelo", mp: 20, cd: 4, pow: 55, pierce: true, desc: "Dano enorme que ignora resistências." },

  lanca: { nome: "Lança de Ferro", tome: 1, el: "metal", mp: 12, cd: 1, pow: 30, desc: "Dano forte de Metal." },
  correntes: { nome: "Correntes", tome: 2, el: "metal", mp: 12, cd: 3, pow: 14, weaken: 3, desc: "Dano e prende o inimigo, que bate mais fraco por 3 turnos." },
  forja: { nome: "Coração da Forja", tome: 3, el: "metal", mp: 20, cd: 4, pow: 55, pierce: true, desc: "Dano enorme que ignora resistências." },

  vibora: { nome: "Picada da Víbora", tome: 1, el: "veneno", mp: 12, cd: 1, pow: 30, desc: "Dano forte de Veneno." },
  miasma: { nome: "Miasma", tome: 2, el: "veneno", mp: 12, cd: 3, pow: 14, blind: 3, weaken: 2, desc: "Dano, cega e enfraquece." },
  peste: { nome: "Peste", tome: 3, el: "veneno", mp: 20, cd: 4, pow: 55, pierce: true, desc: "Dano enorme que ignora resistências." },
});
Object.assign(SKILLS, {
  brasa: { nome: "Coração em Brasa", el: "lava", mp: 8, cd: 4, desc: "Seus próximos 2 feitiços causam +80% de dano." },
  refracao: { nome: "Refração", el: "cristal", mp: 8, cd: 4, desc: "Escudo de prisma por 2 turnos e esquiva do próximo ataque." },

  rocha_derretida: { nome: "Rocha Derretida", tome: 1, el: "lava", mp: 12, cd: 1, pow: 30, desc: "Dano forte de Lava." },
  cinzas: { nome: "Nuvem de Cinzas", tome: 2, el: "lava", mp: 12, cd: 3, pow: 12, burn: 4, blind: 2, desc: "Dano, queima e cega." },
  vulcao: { nome: "Vulcão", tome: 3, el: "lava", mp: 20, cd: 4, pow: 55, pierce: true, desc: "Dano enorme que ignora resistências." },

  lancaC: { nome: "Lança de Cristal", tome: 1, el: "cristal", mp: 12, cd: 1, pow: 30, desc: "Dano forte de Cristal." },
  prisaoC: { nome: "Prisão de Cristal", tome: 2, el: "cristal", mp: 12, cd: 3, pow: 12, weaken: 3, blind: 2, desc: "Dano, prende e cega." },
  supernova: { nome: "Supernova Prismática", tome: 3, el: "cristal", mp: 20, cd: 4, pow: 55, pierce: true, desc: "Dano enorme que ignora resistências." },
});
SKILL_EFFECTS.brasa = SKILL_EFFECTS.furia;
SKILL_EFFECTS.refracao = function () {
  battle.shield = Math.max(battle.shield || 0, 2);
  battle.dodge = Math.max(battle.dodge || 0, 1);
  burstOnPlayer(["#ff9ee6", "#fff"], 30, 110);
  return " Um prisma de cristal te protege e confunde o inimigo.";
};
SKILL_EFFECTS.sobrecarga = SKILL_EFFECTS.furia;
SKILL_EFFECTS.espelho = SKILL_EFFECTS.passo;
SKILL_EFFECTS.peleFerro = SKILL_EFFECTS.rocha;
SKILL_EFFECTS.antidoto = SKILL_EFFECTS.mare;

/* ---- o clima também mexe com os dons ---- */
Object.assign(WEATHER.tempestade.mul, { raio: 1.25 });
Object.assign(WEATHER.chuva.mul, { raio: 1.1, metal: 0.9 });
Object.assign(WEATHER.neve.mul, { gelo: 1.25, veneno: 0.9 });
Object.assign(WEATHER.sol.mul, { gelo: 0.85 });
Object.assign(WEATHER.neblina.mul, { veneno: 1.15 });
Object.assign(WEATHER.chuva.mul, { lava: 0.85 });
Object.assign(WEATHER.sol.mul, { lava: 1.1 });
Object.assign(WEATHER.sol.mul, { cristal: 1.15 });
Object.assign(WEATHER.nublado.mul, { cristal: 0.9 });
WEATHER.tempestade.fx += " Raio +25%.";
WEATHER.chuva.fx += " Raio +10%, Metal −10% e Lava −15%.";
WEATHER.neve.fx += " Gelo +25% e Veneno −10%.";
WEATHER.sol.fx += " Cristal +15%, Lava +10% e Gelo −15%.";
WEATHER.nublado.fx += " Cristal −10%.";
WEATHER.neblina.fx += " Veneno +15%.";

/* ---- quem escolheu um dom da primeira versão (Canto, Mente, Fera, Pulso Vital) ---- */
const OLD_DOM = { canto: "metal", mente: "gelo", fera: "raio", vida: "veneno" };
const OLD_TOME = { acorde: 1, ninar: 2, sinfonia: 3, lancaM: 1, ilusao: 2, colapso: 3, mordida: 1, rugido: 2, manada: 3, espinho: 1, bencaoV: 2, florescer: 3 };
function migrateOldDom() {
  const old = player && player.dom;
  if (!old || !OLD_DOM[old]) return;
  const nw = OLD_DOM[old];
  player.dom = nw;
  if (player.aff === old) player.aff = nw;
  if (player.order && player.order[0] === old) player.order[0] = nw;
  player.spells = (player.spells || []).map((k) => {
    const parts = k.split("+").map((r) => (r === old ? nw : r));
    return parts.length > 1 ? spellKey(parts) : parts[0];
  });
  if (player.mastery) for (const k of Object.keys(player.mastery)) if (k.split("+").includes(old)) {
    const nk = spellKey(k.split("+").map((r) => (r === old ? nw : r)));
    player.mastery[nk] = player.mastery[k];
    delete player.mastery[k];
  }
  player.tomes = (player.tomes || []).map((t) => (OLD_TOME[t] ? DONS[nw].tomes[OLD_TOME[t] - 1] : t));
}

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
    if (r === d.rune) {
      SPELLS[spellKey([id, r])] = Object.assign({ el: [id, r], pow: 32, mp: 9 }, DOM_COMBO_FX[r], DOM_FUSION[id]);
      continue;
    }
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
      return `<button class="card" data-r="${id}"><h4>${runeSVG(id, 22)}<span style="color:${d.cor}">${i + 1}. ${d.t}</span></h4><p>${d.d}</p><p style="color:${RUNES[d.rune].cor}">Nasceu da Runa ${RUNE_OF[d.rune]}: quando ela voltar, o seu dom desperta.</p><p>Habilidade: <b style="color:#fff">${k.nome}</b>. ${k.desc}</p></button>`;
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
    migrateOldDom();
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

/* ---- o dom desperta quando a runa de origem volta ---- */
(() => {
  const baseMul = dmgMul;
  dmgMul = function (els) {
    let m = baseMul.apply(this, arguments);
    if (player.dom && els && els.includes(player.dom) && domAwake()) m *= 1.2;
    return m;
  };
  const baseUpdate = update;
  update = function () {
    if (player && player.dom && player.flags && !player.flags.domAwake && domAwake() && game.mode === "world" && !game.dialog) {
      player.flags.domAwake = true;
      const d = DONS[player.dom];
      say([
        ["", `A Runa ${RUNE_OF[d.rune]} reconhece ${d.art} dentro de você: foi dela que o seu dom nasceu.`],
        ["", `O seu dom DESPERTOU! Feitiços ${d.de} ficam 20% mais fortes, e ${RUNE_WITH_ARTICLE[d.rune]} com ${d.art} agora formam ${DOM_FUSION[player.dom].nome}.`],
      ]);
      saveGame();
    }
    return baseUpdate.apply(this, arguments);
  };
})();
