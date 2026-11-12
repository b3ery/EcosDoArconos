/**
 * ECOS DO ARCANO — fragmento.js (modo História, jogo com dom)
 * O arco do Fragmento: de onde veio o pedaço de runa que ecoa no aprendiz.
 *  1. O fragmento acorda no treino com o Kael.
 *  2. Três revelações (com 2, 4 e 6 runas): Vesper quebrou uma lasca da runa
 *     antes de se perder e a escondeu num berço de Cinzaluz; o eco passou de
 *     geração em geração até você. É o último pedaço bom de Vesper.
 *  3. Falas por dom: Odelia, Nyx, os Guardiões e o Silenciador reagem ao seu
 *     elemento.
 *  4. Textos que ainda não conheciam a Fênix do Farol (abertura, Odelia,
 *     Serpente fraca contra a Chama).
 *  5. O mundo marcado pelas escolhas: regiões de Guardiões libertados
 *     brilham; as de Guardiões possuídos ficam com cinzas no ar.
 *  6. Luta final: na última parte do Silenciador, o fragmento resiste.
 *  7. Epílogo que lembra a sua jornada.
 *  8. Dublagem: as falas novas do Narrador entram no roteiro.
 * Modifica (envolve) funções de outros arquivos: applyStoryAdjustments,
 * buildVoiceScript, crewDrawList, enterZone, GUARD_PRE, INTRO, nyxSay,
 * possessGuardian, rewardGuardian, silencerMeeting, startEpilogue,
 * startPlayerTurn, update.
 */

"use strict";

const fragOn = () => story() && player && !!player.dom && !!DONS[player.dom];
const fragDom = () => DONS[player.dom];
const cap = (s) => s[0].toUpperCase() + s.slice(1);

/* ===================== TEXTOS ===================== */
const FRAG_WAKE = [
  ["", "Quando o boneco cai, algo dentro de você continua vibrando. Um eco antigo, de uma runa que você nunca viu."],
  ["Instrutor Kael", "Isso não é magia comum, aprendiz. É um eco de runa. Faz trezentos anos que ninguém sente um desses."],
  ["Instrutor Kael", "Conte para a Odelia. E cuide desse eco: ele parece saber o caminho melhor do que você."],
];
const FRAG_REVEAL = [
  {
    need: 2,
    lines: (d) => [
      ["", "Naquela noite, o fragmento vibra sozinho e puxa você para um sonho que não é seu."],
      ["Vesper (eco)", `O Silêncio está vindo, e eu não consigo segurá-lo. Mas a Runa ${RUNE_OF[d.rune]}... um pedaço dela tem que sobreviver.`],
      ["", "Uma mão quebra uma lasca de luz da runa. A lasca cai, girando, na direção de Cinzaluz."],
    ],
  },
  {
    need: 4,
    lines: () => [
      ["", "O fragmento te leva de volta ao sonho. Agora você vê uma casinha em Cinzaluz, trezentos anos atrás, e um berço."],
      ["Vesper (eco)", "Ninguém procura magia num bebê. Guarde isso por mim, pequeno, até alguém conseguir terminar a Canção."],
      ["", "O eco passou de berço em berço, de geração em geração, esperando alguém que conseguisse ouvi-lo. Até chegar em você."],
    ],
  },
  {
    need: 6,
    lines: (d) => [
      ["", "Com as seis runas juntas, o fragmento finalmente fala com a própria voz."],
      ["Fragmento", `Eu sou a última coisa que Vesper salvou antes de se perder. Ele me escondeu em ${d.art} para que, um dia, alguém o trouxesse de volta.`],
      ["", "Você entende agora: o Silenciador não caça você por medo. Caça porque sente em você o último pedaço bom de Vesper."],
    ],
  },
];
/** Falas de cada dom: Odelia (abertura), Nyx, Guardiões, Silenciador e o momento da luta final. */
const DOM_TALK = {
  lava: {
    odelia: "Lava... A Chama que se escondeu debaixo da terra para não ser apagada. Muito esperta.",
    nyx: "Você cheira a vulcão. Então é verdade: ainda sobrou um pedaço da Chama por aí.",
    guard: "Esse calor em você... não é a Chama inteira. É só uma brasa teimosa.",
    sil: "Eu lembro dessa brasa. Eu a arranquei da Chama com as minhas próprias mãos. Ainda queima?",
    final: "A brasa dentro de você se recusa a apagar. O Silêncio tenta abafá-la, e ela só cresce.",
  },
  gelo: {
    odelia: "Gelo... A Maré que parou para esperar. Ela sempre foi a mais paciente das runas.",
    nyx: "Ficou mais frio aqui do nada. É você? Então ainda sobrou um pedaço da Maré.",
    guard: "Esse frio em você... é a Maré congelada esperando o degelo.",
    sil: "Esse frio... eu congelei a Maré para ela não fugir de mim. Um pedaço fugiu mesmo assim.",
    final: "O gelo em você não derrete. O Silêncio bate nele e se parte em mil pedaços.",
  },
  raio: {
    odelia: "Raio... O Vento que guardou uma tempestade dentro do peito. Prepare-se para não dormir à noite.",
    nyx: "Seu cabelo está arrepiado. Isso é eco do Vento, não é? Achei que ele tinha morrido.",
    guard: "Esse estalo em você... é o Vento que aprendeu a trovejar.",
    sil: "Esse estalo... eu calei o Vento, mas esqueci de calar o trovão dele.",
    final: "O trovão dentro de você explode. Nenhum silêncio aguenta um raio caindo.",
  },
  metal: {
    odelia: "Metal... O coração da Terra, duro demais para quebrar. Combina com você.",
    nyx: "Você pisa pesado, como quem carrega uma montanha. Eco da Terra, aposto.",
    guard: "Esse peso em você... é o coração de ferro da Terra.",
    sil: "Esse ferro... eu tentei derreter a Terra. O coração dela não quis derreter.",
    final: "O ferro dentro de você não dobra. O Silêncio empurra, e você continua de pé.",
  },
  cristal: {
    odelia: "Cristal... A Luz presa numa pedra para não se perder no escuro. Bonito.",
    nyx: "Você brilha um pouco no escuro, sabia? Eco da Luz. Eu achava que ela tinha acabado.",
    guard: "Esse brilho em você... é a Luz guardada dentro de um cristal.",
    sil: "Esse brilho... eu apaguei a Luz inteira. Menos esse pedacinho escondido numa pedra.",
    final: "O cristal em você reflete a luz das seis runas de uma vez. O Silêncio não tem onde se esconder.",
  },
  veneno: {
    odelia: "Veneno... A Sombra que aprendeu a se defender. Cuidado: ela morde quem a subestima.",
    nyx: "Tem algo amargo no ar perto de você. Eco da Sombra. Até que combina com você.",
    guard: "Esse amargo em você... é a Sombra que virou espinho.",
    sil: "Esse amargo... eu bebi a Sombra inteira. Um gole ficou para trás, e ele me envenena até hoje.",
    final: "O veneno em você corre também no Silêncio. Ele treme, enfraquece, recua.",
  },
};
/** O destino de cada região conforme o que você fez com o Guardião dela. */
const GUARD_REGION = { ent: "bosque", serpente: "pantano", grifo: "picos", basilisco: "mina", leviata: "porto", fenixf: "porto" };
const FATE_LINES = {
  ent: { hero: "No Bosque Murmurante, o Ent voltou a contar histórias para as crianças que se perdem por lá.", vilao: "O Bosque Murmurante nunca mais murmurou. As árvores crescem tortas, de costas para a vila." },
  fenixf: { hero: "O Farol de Brisamar acende toda noite. Os pescadores dizem que uma ave de fogo pousa no topo.", vilao: "O Farol de Brisamar ficou apagado. Três barcos se perderam no primeiro inverno." },
  serpente: { hero: "O Pântano das Brumas virou um rio limpo, e os lírios da névoa florescem o ano todo.", vilao: "A névoa do pântano ficou parada, cinzenta, sem cheiro. Ninguém mais pesca lá." },
  grifo: { hero: "Nos Picos Uivantes, o Grifo Dourado carrega viajantes perdidos de volta para a estrada.", vilao: "Os Picos Uivantes ficaram mudos. Nem o vento sobe mais até o topo." },
  basilisco: { hero: "A Mina de Cristal voltou a brilhar, e os anões de Pedravale cantam enquanto trabalham.", vilao: "A Mina de Cristal escureceu. Os anões fecharam a entrada com pedra e não falam do motivo." },
  leviata: { hero: "No cais, o Leviatã das Marés guia os barcos para fora das tempestades.", vilao: "O mar recuou do cais e não voltou. Os barcos de Brisamar apodrecem na lama." },
};
const FRAG_EPI = {
  hero: (d) => `${cap(d.art)} que ecoava em você nunca mais se calou. Em Cinzaluz, as crianças brincam de imitar o seu dom.`,
  vilao: (d) => `${cap(d.art)} que ecoava em você virou uma lenda sombria. Em Cinzaluz, as mães usam o seu nome para assustar as crianças.`,
  frag: "E o último pedaço bom de Vesper voltou para ele. Você ficou só com o eco, e o eco basta.",
};

/* ===================== 1. O FRAGMENTO ACORDA (treino) ===================== */
function fragWakeScene(W, H, t) {
  const d = fragDom();
  ctx.fillStyle = "#07060e";
  ctx.fillRect(0, 0, W, H);
  const k = Math.min(1, t / 2);
  ctx.globalAlpha = 0.35 * k;
  rays(W / 2, H / 2 - 20, 12, W, d.cor, t);
  ctx.globalAlpha = 1;
  glyph(player.dom, W / 2, H / 2 - 20, 14 + 22 * k + 3 * Math.sin(t * 5), 1);
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2 + t * 0.8,
      r = 40 + 80 * k + 10 * Math.sin(t * 3 + i);
    ctx.fillStyle = d.cor;
    ctx.globalAlpha = 0.7;
    ctx.fillRect(W / 2 + Math.cos(a) * r, H / 2 - 20 + Math.sin(a) * r * 0.6, 3, 3);
  }
  ctx.globalAlpha = 1;
  ctx.textAlign = "center";
  if (t > 0.6) txt("O fragmento acorda", W / 2, 60, 26, d.cor);
  if (t > 1.8) txt(`Um eco da Runa ${RUNE_OF[d.rune]} vive em você: ${d.nome}`, W / 2, H - 60, 18, `rgba(255,255,255,${Math.min(1, t - 1.8)})`, 600);
}

/* ===================== 2. AS REVELAÇÕES ===================== */
function fragTick() {
  if (!fragOn() || game.mode !== "world" || game.dialog || game.cine) return;
  if ((game.fragCd || 0) > game.t) return;
  const F = player.flags;
  if (F.treino && !F.fragWake) {
    F.fragWake = true;
    saveGame();
    playSound(523, 0.3, "triangle", 0.05);
    playCine(fragWakeScene, 4, () => say(FRAG_WAKE));
    game.fragCd = game.t + 3;
    return;
  }
  const n = player.runes.length;
  for (let i = 0; i < FRAG_REVEAL.length; i++) {
    const R = FRAG_REVEAL[i];
    if (F["frag" + (i + 1)] || n < R.need) continue;
    F["frag" + (i + 1)] = true;
    saveGame();
    const lines = R.lines(fragDom());
    playCine(typeof dreamScene === "function" ? dreamScene : fragWakeScene, 3, () => say(lines));
    game.fragCd = game.t + 3;
    return;
  }
}

/* ===================== 5. O MUNDO MARCADO ===================== */
function regionFate(z) {
  const f = player.guardFate || {};
  let hero = 0,
    vil = 0;
  for (const [type, r] of Object.entries(GUARD_REGION)) if (r === z && f[type]) f[type] === "vilao" ? vil++ : hero++;
  return vil ? "vilao" : hero ? "hero" : null;
}
function drawRegionFate(t) {
  const fate = regionFate(player.zone);
  if (!fate) return;
  const T = TILE,
    cx = player.rx * T,
    cy = player.ry * T;
  const n = settings.calm ? 14 : 30;
  for (let i = 0; i < n; i++) {
    const sx = ((i * 137.5) % 40) - 20,
      sy = ((i * 61.3) % 26) - 13;
    if (fate === "vilao") {
      // cinzas caindo devagar
      const x = cx + sx * T + Math.sin(t * 0.7 + i) * 14,
        y = cy + (((sy + 13 + t * 0.6 + i * 0.37) % 26) - 13) * T;
      ctx.fillStyle = `rgba(95,88,100,${0.5 + 0.2 * Math.sin(t + i)})`;
      ctx.fillRect(x, y, 4, 4);
    } else {
      // vaga-lumes dourados
      const x = cx + sx * T + Math.sin(t * 0.9 + i * 2) * 20,
        y = cy + sy * T + Math.cos(t * 0.6 + i) * 14;
      ctx.fillStyle = `rgba(255,230,130,${0.25 + 0.35 * Math.abs(Math.sin(t * 2 + i))})`;
      ctx.fillRect(x, y, 3, 3);
    }
  }
}
function recordFate(type, how) {
  if (!GUARD_REGION[type]) return;
  player.guardFate = player.guardFate || {};
  player.guardFate[type] = how;
}

/* ===================== 7. EPÍLOGO ===================== */
const EPI_BASE = EPILOGUE.slice();
function epilogueRecap() {
  const out = [];
  if (!fragOn()) return out;
  const f = player.guardFate || {};
  for (const type of ["ent", "fenixf", "serpente", "grifo", "basilisco", "leviata"]) if (f[type]) out.push(["Narrador", FATE_LINES[type][f[type]]]);
  const d = fragDom();
  out.push(["Narrador", (player.villain || 0) > (player.heroPts || 0) ? FRAG_EPI.vilao(d) : FRAG_EPI.hero(d)]);
  if (player.flags.frag3) out.push(["Narrador", FRAG_EPI.frag]);
  return out;
}

/* ===================== LIGAÇÕES ===================== */
(() => {
  // 1 e 2: revelações
  const upBase = update;
  update = function () {
    const r = upBase.apply(this, arguments);
    if (story() && player) fragTick();
    return r;
  };

  // 3. falas por dom: Odelia na abertura e o roteiro dos Guardiões (4: Fênix)
  const introBase = INTRO;
  INTRO = function () {
    const l = introBase();
    if (!fragOn()) return l;
    const i = l.findIndex((x) => /Os Guardiões que protegiam/.test(x[1]));
    if (i >= 0) l[i] = ["Arquimaga Odelia", "Os Guardiões que protegiam as runas foram corrompidos. Liberte-os: o Ent no Bosque Murmurante, a Fênix no Farol de Brisamar, a Serpente no Pântano das Brumas e o Grifo nos Picos Uivantes."];
    l.splice(1, 0, ["Arquimaga Odelia", DOM_TALK[player.dom].odelia]);
    return l;
  };
  for (const type of Object.keys(GUARD_REGION)) {
    const pre = GUARD_PRE[type];
    if (typeof pre !== "function") continue;
    GUARD_PRE[type] = function () {
      const l = pre.apply(this, arguments);
      if (fragOn()) l.splice(1, 0, [ENEMIES[type].nome, DOM_TALK[player.dom].guard]);
      return l;
    };
  }
  // O Ent, a Serpente e o Grifo começam a luta direto do covil: o aviso vai no registro da luta.
  const sbBase = startBattle;
  startBattle = function (type) {
    const r = sbBase.apply(this, arguments);
    const B = battle;
    if (fragOn() && B && GUARD_REGION[type] && !GUARD_PRE[type]) setTimeout(() => battle === B && battleLog(`${ENEMIES[type].nome}: "${DOM_TALK[player.dom].guard}"`), 2600);
    return r;
  };
  if (typeof nyxSay === "function") {
    const nyBase = nyxSay;
    nyxSay = function (lines, cb) {
      if (fragOn() && Array.isArray(lines) && lines[0] && /capa verde-escura está agachada/.test(lines[0][1] || "")) lines = [lines[0], lines[1], DOM_TALK[player.dom].nyx, ...lines.slice(2)];
      return nyBase.call(this, lines, cb);
    };
  }
  const smBase = silencerMeeting;
  silencerMeeting = function (start) {
    if (!fragOn()) return smBase.apply(this, arguments);
    const d = fragDom();
    say(
      [
        ["O Silenciador", `Esse eco... ${d.art}. Eu conheço esse som.`],
        ["O Silenciador", DOM_TALK[player.dom].sil],
        ...(player.flags.frag3 ? [["", "O fragmento dentro de você responde. Por um instante, a máscara do Silenciador treme."]] : []),
      ],
      () => smBase(start),
    );
  };

  // 4. Odelia aponta o Farol depois do Ent; a Serpente teme a Chama.
  const odTalk = NPCS.odelia.talk;
  NPCS.odelia.talk = function () {
    const l = odTalk.apply(this, arguments);
    if (fragOn() && Array.isArray(l) && player.guards.includes("bosque") && !player.flags.porto2 && odeliaStage() === 2)
      l.push(["Arquimaga Odelia", "E mais uma coisa: à noite, o Farol de Brisamar brilha com uma chama que não é de vela. A Runa da Chama está lá em cima, com a Fênix."]);
    return l;
  };
  const asBase = applyStoryAdjustments;
  applyStoryAdjustments = function (enemy, type) {
    asBase.apply(this, arguments);
    if (type === "serpente" && fragOn() && player.runes.includes("fogo")) enemy.weak = ["fogo", ...new Set((enemy.weak || []).filter((w) => w !== "fogo"))];
  };
  const serp = STEPS.find((s) => s.id === "serp");
  if (serp) {
    const d0 = Object.getOwnPropertyDescriptor(serp, "d");
    Object.defineProperty(serp, "d", {
      get: () => (fragOn() && player.runes.includes("fogo") ? "Ela está no extremo leste do Pântano das Brumas. A névoa dela teme a Chama (e a Terra também a machuca)." : d0.get ? d0.get.call(serp) : d0.value),
      configurable: true,
      enumerable: true,
    });
  }

  // 5. destino de cada Guardião
  const rgBase = rewardGuardian;
  rewardGuardian = function (enemy, type) {
    recordFate(type, "hero");
    return rgBase.apply(this, arguments);
  };
  const pgBase = possessGuardian;
  possessGuardian = function (enemy, type) {
    recordFate(type, "vilao");
    return pgBase.apply(this, arguments);
  };
  const cdBase = crewDrawList;
  crewDrawList = function (list, t) {
    cdBase(list, t);
    if (fragOn() && !lairOfZone(player.zone)) list.push({ y: 998, draw: () => drawRegionFate(t) });
  };
  const ezBase = enterZone;
  enterZone = function () {
    const r = ezBase.apply(this, arguments);
    if (fragOn()) {
      const f = player.guardFate || {};
      const type = Object.keys(GUARD_REGION).find((k) => GUARD_REGION[k] === player.zone && f[k]);
      game.fateSeen = game.fateSeen || {};
      if (type && !game.fateSeen[player.zone]) {
        game.fateSeen[player.zone] = true;
        setTimeout(() => toast(FATE_LINES[type][f[type]], 4200), 1800);
      }
    }
    return r;
  };

  // 6. luta final: o fragmento resiste
  const sptBase = startPlayerTurn;
  startPlayerTurn = function () {
    const r = sptBase.apply(this, arguments);
    const B = battle;
    if (fragOn() && B && B.type === "silenciador" && !B.done && !B.fragMoment && B.e && B.e.hp > 0 && B.e.hp <= B.e.max * 0.3) {
      B.fragMoment = true;
      const d = fragDom(),
        heal = Math.round(maxHp() * 0.25);
      healPlayer(heal);
      B.sealed = {};
      B.fury = Math.max(B.fury || 0, 2);
      const pc = playerCenter();
      burst(pc.x, pc.y, [d.cor, "#fff"], 60, 200);
      if (!settings.calm) game.shake = 0.4;
      [392, 523, 659, 784, 1047].forEach((f, i) => setTimeout(() => playSound(f, 0.25, "triangle", 0.05), i * 100));
      battleLog(`✦ O FRAGMENTO RESISTE! ${DOM_TALK[player.dom].final} (+${heal} HP, runas livres e próximos 2 feitiços muito mais fortes)`);
      renderBattle();
    }
    return r;
  };

  // 7. epílogo
  const epBase = startEpilogue;
  startEpilogue = function () {
    EPILOGUE.length = 0;
    const recap = epilogueRecap();
    EPILOGUE.push(...EPI_BASE.slice(0, -1), ...recap, EPI_BASE[EPI_BASE.length - 1]);
    return epBase.apply(this, arguments);
  };
})();

/* ===================== 8. DUBLAGEM ===================== */
if (typeof VOICE_SECTIONS !== "undefined") {
  VOICE_SECTIONS.FRA = {
    n: "O Fragmento",
    quando: "No jogo com dom: quando o fragmento acorda no treino, nas três revelações sobre Vesper e no despertar do dom.",
    dir: "Íntimo e misterioso, como quem conta um segredo de família. Na terceira revelação, mais emoção.",
  };
  VOICE_SECTIONS.FAR = {
    n: "O Farol e a Fênix",
    quando: "Covil do Topo do Farol e depois de libertar a Fênix.",
    dir: "Aventura com calor: o vento lá fora, o fogo lá dentro.",
  };
  VOICE_SECTIONS.JOR = {
    n: "Epílogo da sua jornada",
    quando: "No epílogo, conforme o que você fez com cada Guardião e com o seu dom. Cada jogador ouve só algumas.",
    dir: "Tom de conto contado anos depois. Nas falas de vilão, mais seco e triste.",
  };
  const vbBase = buildVoiceScript;
  buildVoiceScript = function () {
    const S = vbBase();
    const add = (sec, id, text, nota = "") => S.push({ id: `${sec}-${id}`, sec, text, match: text, cue: null, nota });
    let k = 1;
    add("FRA", two(k++), FRAG_WAKE[0][1], "Depois do treino com o Kael");
    for (const id of DOM_IDS) {
      const d = DONS[id];
      FRAG_REVEAL.forEach((R, i) =>
        R.lines(d)
          .filter((l) => !l[0])
          .forEach((l) => {
            if (!S.some((e) => e.text === l[1])) add("FRA", two(k++), l[1], `Revelação ${i + 1}${/Runa|\bo |\ba /.test(l[1]) && l[1].includes(d.nome) ? " · " + d.nome : ""}`);
          }),
      );
    }
    add("FRA", two(k++), "O fragmento dentro de você responde. Por um instante, a máscara do Silenciador treme.", "Encontro com o Silenciador, depois da 3ª revelação");
    let f = 1;
    add("FAR", two(f++), "As quatro lamparinas brilham juntas. O vento recua, e a porta do topo do farol se abre.", "Desafio das lamparinas resolvido");
    add("FAR", two(f++), "As chamas da Fênix diminuem até virarem uma luz calma e dourada.", "Depois de vencer a Fênix");
    add("FAR", two(f++), "A Fênix abre as asas e o topo do farol vira uma fogueira!", "Antes da luta");
    let j = 1;
    for (const type of ["ent", "fenixf", "serpente", "grifo", "basilisco", "leviata"]) {
      add("JOR", two(j++), FATE_LINES[type].hero, `${ENEMIES[type].nome}: libertado`);
      add("JOR", two(j++), FATE_LINES[type].vilao, `${ENEMIES[type].nome}: possuído`);
    }
    for (const id of DOM_IDS) {
      add("JOR", two(j++), FRAG_EPI.hero(DONS[id]), `${DONS[id].nome}: herói`);
      add("JOR", two(j++), FRAG_EPI.vilao(DONS[id]), `${DONS[id].nome}: vilão`);
    }
    add("JOR", two(j++), FRAG_EPI.frag, "Se viu as três revelações");
    return S;
  };
  if (typeof indexVoices === "function") indexVoices();
}
