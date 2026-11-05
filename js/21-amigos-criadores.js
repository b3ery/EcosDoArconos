/**
 * ECOS DO ARCANO — 21-amigos-criadores.js
 * Os criadores do jogo viram personagens importantes de Cinzaluz, com seus parceiros:
 *  - Lucas Marzocca: o rolezeiro. Só conversa depois de ganhar um hidromel.
 *  - Matheus: o fazendeiro, melhor amigo do Lucas, casado com a Duquesa Malu.
 *  - Marcos: o General, casado com a Princesa Coral das Marés; ajuda na vila.
 *  - Andressa: dona da maior rede de bibliotecas, misteriosa, sabe tudo de segurança.
 *  - Mylena: artista do Ateliê de pinturas e móveis, casada com o Príncipe Leon.
 * Os cinco são amigos e às vezes aparecem juntos na fonte da praça.
 * (Visual inspirado nas fotos da equipe no README.)
 */

"use strict";

/* ===================== VISUAL (estilo do jogador) ===================== */

/** Cada um tem cores únicas: wizardRects reconhece e desenha o visual detalhado. */
const CREW_LOOKS = {
  lucas: { robe: "#a82a3a", hat: null, hair: "#2a1a10", look: { skin: "#d9a07a", hair: "#2a1a10", hstyle: "curto", hat: "nenhum", hatc: "#2a2f6e", outfit: "tunica", robe: "#a82a3a", eyes: "#2a1a10", acc: "nenhum" } },
  matheus: { robe: "#e8e4dd", hat: "#c9a03b", hair: "#2a1a11", look: { skin: "#f1c8a5", hair: "#2a1a11", hstyle: "cacheado", hat: "abas", hatc: "#c9a03b", outfit: "tunica", robe: "#e8e4dd", eyes: "#3a2414", acc: "nenhum" } },
  marcos: { robe: "#3a5aa8", hat: null, hair: "#1a1a1b", look: { skin: "#c08458", hair: "#1a1a1b", hstyle: "curto", hat: "nenhum", hatc: "#2a2f6e", outfit: "capa", robe: "#3a5aa8", eyes: "#222222", acc: "oculos" } },
  andressa: { robe: "#7a8a7a", hat: null, hair: "#1a1a1c", look: { skin: "#a8704a", hair: "#1a1a1c", hstyle: "rabo", hat: "nenhum", hatc: "#2a2f6e", outfit: "gibao", robe: "#7a8a7a", eyes: "#222222", acc: "oculos" } },
  mylena: { robe: "#c94a8b", hat: null, hair: "#1a1a1d", look: { skin: "#a8704a", hair: "#1a1a1d", hstyle: "longo", hat: "flor", hatc: "#2a2f6e", outfit: "vestido", robe: "#c94a8b", eyes: "#2a1a10", acc: "brincos" } },
  malu: { robe: "#7a3a8a", hat: null, hair: "#8a3a1b", look: { skin: "#f1c8a5", hair: "#8a3a1b", hstyle: "longo", hat: "tiara", hatc: "#2a2f6e", outfit: "real", robe: "#7a3a8a", eyes: "#3a5a2a", acc: "colar" } },
  coral: { robe: "#3a8ab1", hat: null, hair: "#d9a442", look: { skin: "#d9a07a", hair: "#d9a442", hstyle: "trancas", hat: "tiara", hatc: "#2a2f6e", outfit: "vestido", robe: "#3a8ab1", eyes: "#2a5a8a", acc: "colar" } },
  leon: { robe: "#2a4a8b", hat: null, hair: "#d9a443", look: { skin: "#f1c8a5", hair: "#d9a443", hstyle: "curto", hat: "coroa", hatc: "#2a2f6e", outfit: "real", robe: "#2a4a8b", eyes: "#2a5a8a", acc: "nenhum" } },
};
for (const k in CREW_LOOKS) {
  const c = CREW_LOOKS[k];
  HERO_LOOKS[`${c.robe}|${c.hat}|${c.hair}`] = c.look;
}
const CREW = ["lucas", "matheus", "marcos", "andressa", "mylena"];
const crewName = (id) => NPCS[id].nome.split(",")[0];

/* ===================== PERSONAGENS ===================== */

const LUCAS_DATES = ["a filha do moleiro", "a Cocheira Lila", "uma marinheira do Porto", "a dona da barraca de flores", "uma anã de Pedravale", "a sobrinha do Padre Anselmo"];
function crewNPC(id, nome, talk) {
  const c = CREW_LOOKS[id];
  return { nome, robe: c.robe, hat: c.hat, hair: c.hair, talk };
}
Object.assign(NPCS, {
  lucas: crewNPC("lucas", "Lucas Marzocca, o Rolezeiro", () => [
    ["Lucas Marzocca", ["Hoje tem festa na taverna! E amanhã também. E depois de amanhã...", "Namorando? Eu? ...Só três. Quatro. Depende do dia.", "O Matheus é meu irmão de outra mãe. Se eu sumir, procura na fazenda dele."][Math.floor(Math.random() * 3)]],
  ]),
  matheus: crewNPC("matheus", "Matheus, o Fazendeiro", () => [
    ["Matheus", ["Terra boa, chuva certa e a Malu do meu lado. Precisa de mais nada.", "O Lucas? Passou a noite na taverna de novo. Eu que vou buscar ele, como sempre.", "Sou fazendeiro, casado com uma duquesa. A vila até hoje não acredita!"][Math.floor(Math.random() * 3)]],
  ]),
  marcos: crewNPC("marcos", "General Marcos", () => [
    ["General Marcos", ["Um general também carrega lenha, conserta cerca e ajuda a vila. Disciplina é isso.", "Minha esposa é princesa das Marés. Por isso eu sei: paz entre reinos dá mais trabalho que guerra.", "Treino todo dia ao amanhecer. Se quiser ficar forte, fale comigo."][Math.floor(Math.random() * 3)]],
  ]),
  andressa: crewNPC("andressa", "Andressa, a Bibliotecária-Chefe", () => [
    ["Andressa", ["Tenho bibliotecas em três reinos. E em todas, alguém me conta alguma coisa.", "*ajeita os óculos* Eu sei o que você está procurando. A pergunta é: o que você me dá em troca?", "Segurança não é muralha. É informação no lugar certo."][Math.floor(Math.random() * 3)]],
  ]),
  mylena: crewNPC("mylena", "Mylena, a Artista", () => [
    ["Mylena", ["Pintei a Rainha ontem. Ela pediu para tirar uma ruga. Eu tirei duas, de presente!", "Meu ateliê tem quadros e móveis feitos à mão. Cada um com uma história... e um pouco de tinta no lugar errado.", "O Leon diz que eu pinto a vila mais bonita do que ela é. Eu digo que pinto como ela merece ser."][Math.floor(Math.random() * 3)]],
  ]),
  malu: crewNPC("malu", "Duquesa Malu", () => [["Duquesa Malu", "Duquesa de dia, fazendeira à tarde. O Matheus me ensinou a plantar; eu ensinei ele a dançar valsa."]]),
  coral: crewNPC("coral", "Princesa Coral das Marés", () => [["Princesa Coral", "Deixei o palácio das Marés para casar com o Marcos. Melhor decisão da minha vida... depois da de trazer meus sapatos."]]),
  leon: crewNPC("leon", "Príncipe Leon", () => [["Príncipe Leon", "Minha mãe governa o reino. A Mylena governa o meu coração. E a minha agenda, pelo jeito."]]),
});
Object.assign(FRIENDS, {
  lucas: { fav: "hidromel", r80: ["vinho", 3] },
  matheus: { fav: "pao", r80: ["torta", 3] },
  marcos: { fav: "carne", r80: ["escudo", 1] },
  andressa: { fav: "livro", r80: ["papiro", 3] },
  mylena: { fav: "flor", r80: ["m_retrato", 1] },
});
Object.assign(PERSONALITIES, { lucas: "engracado", matheus: "gentil", marcos: "serio", andressa: "esperto", mylena: "engracado", malu: "gentil", coral: "orgulhoso", leon: "gentil" });
ROMANCE.push("lucas", "andressa");

/* ===================== LUGARES NA VILA ===================== */

const CREW_SPOTS = {
  lucas: [14, 19],
  matheus: [16, 32],
  malu: [16, 34],
  marcos: [36, 12],
  coral: [38, 12],
  andressa: [54, 9],
  mylena: [22, 19],
  leon: [23, 20],
};
(function placeCrew() {
  const z = ZONES.vila;
  for (const [id, [x, y]] of Object.entries(CREW_SPOTS)) {
    z.npcs[`${x},${y}`] = id;
    z.map[y] = z.map[y].slice(0, x) + "N" + z.map[y].slice(x + 1);
    z.npcList.push([x, y, id]);
  }
})();

/* ===================== A TURMA SE REÚNE ===================== */

/** Em dia de festival à noite, e a cada 3 dias no fim da tarde, os cinco se encontram na fonte. */
function crewGathering() {
  if (player.zone !== "vila") return false;
  const h = currentHour();
  return (festivalToday() && h >= 17 && h < 23) || (player.day % 3 === 1 && h >= 17 && h < 21);
}
const CREW_GATHER_SPOTS = [
  [28, 22],
  [30, 22],
  [32, 22],
  [34, 22],
  [31, 17],
];
function crewActorAt(x, y) {
  if (!crewGathering()) return null;
  const i = CREW_GATHER_SPOTS.findIndex(([a, b]) => a === x && b === y);
  return i >= 0 ? CREW[i] : null;
}
const _npcHiddenBase = npcHidden;
npcHidden = function (id) {
  if (CREW.includes(id) && crewGathering()) return true;
  return _npcHiddenBase(id);
};
const CREW_BANTER = [
  [
    ["Lucas Marzocca", "Gente, conheci alguém incrível ontem!"],
    ["Matheus", "De novo? Esse mês já é a quinta."],
    ["Mylena", "Eu pinto o retrato dela se durar mais de uma semana. Até hoje não pintei nenhum."],
  ],
  [
    ["Andressa", "Ouvi dizer que tem gente nova rondando a fronteira. Fiquem atentos."],
    ["General Marcos", "Já dobrei a guarda do portão. Obrigado pela informação, Andressa."],
    ["Lucas Marzocca", "Eu dobro a festa, então. Cada um faz o que sabe."],
  ],
  [
    ["Mylena", "Proposta: um quadro de nós cinco para o castelo!"],
    ["Andressa", "Desde que eu saia de óculos e misteriosa."],
    ["Matheus", "E eu de chapéu. Sem o chapéu ninguém me reconhece."],
    ["General Marcos", "Eu posso ficar no meio. Eu sou o maior."],
  ],
];
function crewGroupMenu() {
  const lines = CREW_BANTER[Math.floor(Math.random() * CREW_BANTER.length)];
  choice("A turma de Cinzaluz", "Lucas, Matheus, Marcos, Andressa e Mylena conversam na fonte.", [
    {
      t: "Entrar na conversa",
      fn: () => {
        for (const id of CREW) addFriendship(id, player.famDay["turma"] === player.day ? 0 : 2);
        player.famDay["turma"] = player.day;
        if (typeof addNeed === "function") addNeed("fun", 15);
        say(lines);
      },
    },
    ...CREW.map((id) => ({ t: `Falar só com ${crewName(id)}`, fn: () => socialMenu(id) })),
    { t: "Sair", fn: null },
  ]);
}
function crewDrawList(list, t) {
  if (!crewGathering()) return;
  CREW.forEach((id, i) => {
    const [x, y] = CREW_GATHER_SPOTS[i];
    const n = NPCS[id];
    list.push({
      y,
      draw: () => {
        const X = x * TILE,
          Y = y * TILE + Math.abs(Math.sin(t * 3 + i)) * -1.5;
        ctx.fillStyle = "rgba(0,0,0,.22)";
        ctx.beginPath();
        ctx.ellipse(X + 16, y * TILE + 30, 8, 3, 0, 0, 7);
        ctx.fill();
        const dir = x < 31 ? "right" : x > 31 ? "left" : "down";
        drawSprite(wizardRects(n.robe, n.hat, n.hair, null, dir), X, Y, 2, dir === "left");
        if (Math.sin(t * 0.8 + i * 1.7) > 0.7) drawPixelIcon(["laugh", "chat", "heart", "note", "party"][i], X + 16, Y - 8, 2);
      },
    });
  });
}

/* ===================== PAPÉIS NA HISTÓRIA ===================== */

/** A turma ajuda na batalha final se você for amigo dos cinco (e não tiver virado vilão). */
function crewReady() {
  return CREW.every((id) => friendshipLevel(id) >= 1) && !(possessedCount() >= 2);
}
/** Opções especiais de cada um no menu de interação. */
function crewItems(id) {
  if (!CREW.includes(id)) return [];
  const once = (k) => {
    if (player.famDay[id + k] === player.day) return false;
    player.famDay[id + k] = player.day;
    return true;
  };
  const items = [];
  if (id === "andressa")
    items.push({
      t: `Pedir informações de segurança (${friendshipLevel("andressa") >= 2 ? "grátis" : withTax(20) + " ouro"})`,
      fn: () => {
        if (friendshipLevel("andressa") < 2) {
          if (player.gold < withTax(20)) return say([["Andressa", "Informação boa custa. Volte com 20 de ouro."]]);
          payWithTax(20);
        }
        say([["Andressa", andressaIntel()]]);
      },
    });
  if (id === "marcos")
    items.push({
      t: "Treinar com o General (+vida máxima)",
      fn: () => {
        if (!once("treino")) return say([["General Marcos", "Já treinamos hoje. Músculo cresce no descanso, recruta."]]);
        const gain = (player.marcosTrain || 0) < 10 ? 5 : 0;
        player.marcosTrain = (player.marcosTrain || 0) + (gain ? 1 : 0);
        player.basehp += gain;
        player.hp = maxHp();
        addFriendship("marcos", 3);
        if (typeof addNeed === "function") addNeed("energy", -15);
        player.clock = Math.min(1439, player.clock + 60);
        game.fade = 1;
        saveGame();
        say([["General Marcos", gain ? "Cem flexões, cinquenta agachamentos e uma corrida até o castelo. +5 de vida máxima!" : "Você já está no auge, soldado. Agora é manter."]]);
      },
    });
  if (id === "mylena")
    items.push({ t: "Visitar o Ateliê (quadros e móveis)", fn: () => openShop("atelie") });
  if (id === "matheus")
    items.push(
      {
        t: "Pegar uma cesta da fazenda",
        fn: () => {
          if (!once("cesta")) return say([["Matheus", "A cesta de hoje já foi! Amanhã tem mais, prometo."]]);
          addItem("pao", 2);
          addItem("maca", 2);
          addItem("queijo");
          addFriendship("matheus", 2);
          saveGame();
          say([["Matheus", "Pão da Malu, maçã do pé e queijo da vizinha. Leva, que fazendeiro não deixa amigo com fome!"]]);
        },
      },
      {
        t: "Ajudar na colheita (2h)",
        fn: () => {
          if (!once("colheita")) return say([["Matheus", "Já ajudou hoje. Vai descansar, que amanhã tem mais!"]]);
          passTime(2, "Você passa 2 horas colhendo com o Matheus e a Malu.");
          player.gold += 30;
          addItem("trigo", 3);
          addFriendship("matheus", 4);
          addFriendship("malu", 3);
          saveGame();
        },
      },
    );
  if (id === "lucas")
    items.push({
      t: "Ir para a festa com o Lucas",
      fn: () => {
        if (!once("festa")) return say([["Lucas Marzocca", "Calma! Festa demais até eu canso. ...Mentira, mas você cansa."]]);
        player.mp = maxMp();
        player.drunk = Math.min(110, (player.drunk || 0) + 20);
        if (typeof addNeed === "function") addNeed("fun", 35);
        player.clock = Math.min(1439, player.clock + 120);
        addFriendship("lucas", 4);
        game.fade = 1;
        saveGame();
        say([["", `Você vai para a festa com o Lucas. Ele some com ${LUCAS_DATES[Math.floor(Math.random() * LUCAS_DATES.length)]} na metade da noite. Mesmo assim, foi ótimo!`]]);
      },
    });
  return items;
}
/** O que a Andressa sabe: o próximo perigo e como vencê-lo. */
function andressaIntel() {
  if (lifeMode()) {
    const w = worldState();
    const war = KINGDOM_PAIRS.find(([a, b]) => atWar(a, b));
    return war
      ? `Fonte segura: ${KINGDOMS[war[0]].short} e ${KINGDOMS[war[1]].short} estão em guerra. Evite as estradas da fronteira e não carregue ouro demais.`
      : `As relações estão ${Object.values(w.rel).some((r) => r < 35) ? "tensas: alguém vai declarar guerra em breve" : "calmas por enquanto"}. E o Coletor Real passa às terças... brincadeira. Ou não.`;
  }
  const s = curStep();
  const tips = {
    ent: "O Ent teme a sua própria runa. Feitiço duplo dela, e ele cai.",
    serp: "A Serpente se regenera quando está fraca. Termine rápido.",
    grif: "O Grifo ataca duas vezes. Defenda quando a vida estiver baixa.",
    basil: "O Basilisco endurece a pele. Use a habilidade do seu elemento quando ele brilhar.",
    levi: "O Leviatã se cura no mar. Ataque com tudo, sem parar.",
    sile: "O Silenciador troca de fraqueza a cada três turnos: olhe a cor da máscara. E a turma pode te ajudar, se você for amigo de todos.",
  };
  return `${s.t}. ${tips[s.id] || s.d}`;
}
/** Lucas só conversa depois de ganhar um hidromel (uma vez por dia). */
function lucasGate() {
  if (player.famDay.lucasPaid === player.day) return false;
  choice("Lucas Marzocca", '"Opa! Conversa boa começa com um hidromel na mão, né?"', [
    {
      t: itemCount("hidromel") ? "Dar um Hidromel" : `Pagar um hidromel (${withTax(15)} ouro)`,
      fn: () => {
        if (itemCount("hidromel")) removeItem("hidromel");
        else {
          if (player.gold < withTax(15)) return say([["Lucas Marzocca", "Sem hidromel, sem papo. Mas sem rancor! Volta depois."]]);
          payWithTax(15);
        }
        player.famDay.lucasPaid = player.day;
        addFriendship("lucas", 3);
        socialMenu("lucas");
      },
    },
    { t: "Deixa pra lá", fn: null },
  ]);
  return true;
}

/* ===================== ATELIÊ DA MYLENA ===================== */

Object.assign(ITEMS, {
  m_retrato: { nome: "Retrato pintado pela Mylena", tipo: "movel", preco: 180, desc: "Móvel. Um retrato seu, com a cor que você merece." },
  m_paisagem: { nome: "Paisagem de Cinzaluz", tipo: "movel", preco: 140, desc: "Móvel. A fonte da praça ao pôr do sol." },
  m_farolq: { nome: "Quadro do Farol", tipo: "movel", preco: 140, desc: "Móvel. O Farol de Brisamar numa noite de tempestade." },
  m_poltrona: { nome: "Poltrona do Ateliê", tipo: "movel", preco: 200, desc: "Móvel. Pintada à mão, com almofada de veludo." },
});
SHOPS.atelie = {
  nome: "Ateliê da Mylena",
  sub: "Quadros e móveis feitos à mão",
  items: ["m_retrato", "m_paisagem", "m_farolq", "m_poltrona", "m_quadro", "m_flores", "m_vela"],
};
for (const k of ["m_retrato", "m_paisagem", "m_farolq"]) ITEM_ICONS[k] = "book";
ITEM_ICONS.m_poltrona = "chair";
const _drawFurnExtraBase = drawFurnExtra;
drawFurnExtra = function (f, t) {
  const X = f.x * TILE,
    Y = f.y * TILE;
  const c = (col, a, b, w, h) => {
    ctx.fillStyle = col;
    ctx.fillRect(X + a, Y + b, w, h);
  };
  const frame = (inner) => {
    c("#8a5a2e", 4, -6, 24, 22);
    c("#f2c14e", 5, -5, 22, 20);
    inner();
  };
  switch (f.id) {
    case "m_retrato":
      frame(() => {
        c("#5a3a7a", 7, -3, 18, 16);
        c(player.look.skin, 13, 0, 6, 6);
        c(player.look.hair, 12, -2, 8, 3);
        c(player.look.robe, 11, 6, 10, 7);
      });
      return true;
    case "m_paisagem":
      frame(() => {
        c("#ff9a5a", 7, -3, 18, 8);
        c("#6c8f4e", 7, 5, 18, 8);
        c("#3a78b0", 13, 6, 6, 4);
      });
      return true;
    case "m_farolq":
      frame(() => {
        c("#1a2440", 7, -3, 18, 16);
        c("#e8e4dc", 15, 0, 3, 10);
        c("#f2c14e", 14, -2, 5, 2);
        c("#3a78b0", 7, 9, 18, 4);
      });
      return true;
    case "m_poltrona":
      c("rgba(0,0,0,.22)", 3, 27, 26, 4);
      c("#8a2a5a", 4, 6, 24, 20);
      c("#c94a8b", 7, 12, 18, 10);
      c("#f2c14e", 4, 6, 24, 2);
      c("#5a3a22", 5, 26, 3, 4);
      c("#5a3a22", 24, 26, 3, 4);
      return true;
  }
  return _drawFurnExtraBase(f, t);
};
