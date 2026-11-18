/**
 * ECOS DO ARCANO — outras-vilas.js
 * Porto Brisamar e Pedravale com vida própria:
 *  - os moradores de cada lugar falam do seu dia a dia (mar, barcos, mina,
 *    anões) e se vestem como gente de lá;
 *  - um pregoeiro na entrada de cada vila oferece o que só tem ali:
 *    Porto: puxar redes, leilão de peixes, corrida de barcos com aposta,
 *    cantoria dos marinheiros e lendas do cais.
 *    Pedravale: concurso de força na bigorna, feira de cristais, cerveja de
 *    pedra dos anões, ajudar na mina e a canção dos anões;
 *  - o jornal conta o que acontece nas outras vilas.
 * Modifica (envolve) funções de outros arquivos: addContactWalkers,
 * crewDrawList, targetAt, interactAt, walkable, onNewDay.
 */

"use strict";

const TOWN_LIFE = {
  porto: {
    lines: ["O vento mudou. Amanhã a pesca vai ser boa.", "Viu o Leviatã? Dizem que ele guia os barcos agora.", "Cuidado com as gaivotas, elas roubam pão da mão!", "Meu avô pescou um peixe do tamanho de um barco. Ou era um barco do tamanho de um peixe.", "A maré está alta hoje. Melhor não ficar na ponta do píer.", "Tem regata no fim de semana. Já escolheu seu barco?", "O farol piscou três vezes ontem à noite. Mau sinal ou bom sinal?"],
    robes: ["#2a4a8a", "#f2f2f6", "#1a3a6a", "#4fa8e0", "#c8b080"],
    crier: { nm: "Mestre do Cais Joaquim", robe: "#1a3a6a", hat: "#f2f2f6", hair: "#d9d9d9" },
  },
  serra: {
    lines: ["A mina cantou hoje de manhã. Cristal novo, com certeza.", "Anão que não martela não janta. É a lei!", "O vento da serra corta a cara, mas limpa a alma.", "Já provou a cerveja de pedra? Desce rasgando e sobe cantando.", "A Fortaleza nunca caiu. Nem vai.", "Meu martelo tem nome: Teimoso. Igual a mim.", "Lá em cima, nos picos, o Grifo voltou a voar."],
    robes: ["#8a3a2a", "#6a4428", "#5a5a66", "#a87a3a", "#3a5a3a"],
    crier: { nm: "Anão-Pregoeiro Borin", robe: "#8a3a2a", hat: "#5a5a66", hair: "#c9853a" },
  },
};
const townPick = (z) => TOWN_LIFE[z];

/* ----- moradores com cara e falas do lugar ----- */
{
  const acBase = addContactWalkers;
  addContactWalkers = function () {
    const r = acBase.apply(this, arguments);
    const T = townPick(player.zone);
    if (T && game.walkers)
      game.walkers.forEach((w, i) => {
        if (w.cid) return;
        w.line = T.lines[i % T.lines.length];
        if (i % 2 === 0) w.robe = T.robes[i % T.robes.length];
      });
    return r;
  };
}

/* ----- o pregoeiro de cada vila ----- */
const crierPos = {};
function crierSpot(z) {
  if (crierPos[z]) return crierPos[z];
  const a = ZONES[z].town.arrive;
  for (const [dx, dy] of [[2, -1], [3, -1], [2, 1], [3, 1], [1, -2], [4, 0]]) {
    const x = a[0] + dx,
      y = a[1] + dy;
    if (walkable(z, x, y)) return (crierPos[z] = [x, y]);
  }
  return (crierPos[z] = [a[0] + 2, a[1]]);
}
const isCrier = (x, y) => townPick(player.zone) && (() => { const s = crierSpot(player.zone); return s[0] === x && s[1] === y; })();
const spend2 = (g) => (player.gold < g ? (toast(`Precisa de ${g} de ouro.`, 1800), false) : ((player.gold -= g), true));
const fun2 = (v) => typeof addNeed === "function" && lifeMode() && addNeed("fun", v);
const once2 = (k) => {
  const kk = "town" + k;
  if (player.famDay[kk] === player.day) return false;
  player.famDay[kk] = player.day;
  return true;
};

function portoMenu() {
  const h = currentHour();
  const N = TOWN_LIFE.porto.crier.nm;
  choice(N, "\"Bem-vind" + genderWord("o", "a", "e") + " ao Porto Brisamar! Aqui ninguém fica parado.\"", [
    {
      t: "Ajudar a puxar as redes (1 hora)",
      icon: "rod",
      fn: () => {
        if (!once2("redes")) return say([[N, "As redes já foram puxadas hoje. Volte amanhã cedo!"]]);
        player.clock = Math.min(1439, player.clock + 60);
        player.gold += 8;
        if (typeof addItem === "function" && ITEMS.peixe) addItem("peixe", 1);
        say([["", "Puxa, puxa, puxa! As redes vêm cheias de prata. Os pescadores cantam no ritmo."], [N, "Toma: 8 de ouro e um peixe fresco. Trabalhou bem!"]]);
      },
    },
    {
      t: h < 11 ? "Leilão de peixes (agora, de manhã)" : "Leilão de peixes (só de manhã)",
      icon: "fish",
      fn: () => {
        if (h >= 11) return say([[N, "O leilão é de manhã, quando o peixe chega. Agora só tem as escamas!"]]);
        choice("Leilão de peixes", "\"Quem dá mais por este lote de sardinhas fresquinhas?\"", [
          ...[4, 7, 10].map((v) => ({
            t: `Dar o lance de ${v} ouro`,
            icon: "coin",
            fn: () => {
              const other = 3 + Math.floor(Math.random() * 8);
              if (v <= other) return say([["Peixeira Dona Rosa", `${other} ouro! Vendido para mim! Mais sorte na próxima, querid${genderWord("o", "a", "e")}.`]]);
              if (!spend2(v)) return;
              if (typeof addItem === "function" && ITEMS.peixe) addItem("peixe", 3);
              say([[N, `Vendido por ${v} de ouro! Três peixes fresquinhos para você.`]]);
            },
          })),
          { t: "Só olhar", fn: null },
        ]);
      },
    },
    {
      t: "Corrida de barcos (aposta 10 ouro)",
      icon: "flag",
      fn: () => {
        const boats = ["Gaivota Ligeira", "Sereia Teimosa", "Baleia Dourada"];
        choice("Corrida de barcos", "Três barcos esperam o apito no cais. Em qual você aposta?", [
          ...boats.map((bn, i) => ({
            t: bn,
            icon: "flag",
            fn: () => {
              if (!spend2(10)) return;
              const win = Math.floor(Math.random() * 3);
              fun2(10);
              if (win === i) player.gold += 30;
              say([["", "O apito toca! Velas se enchem, a multidão grita na beira do cais..."], ["", `Vence o ${boats[win]}!`], ["", win === i ? "Você ganhou 30 de ouro!" : "Não foi dessa vez."]]);
            },
          })),
          { t: "Não apostar", fn: null },
        ]);
      },
    },
    {
      t: h >= 19 || h < 2 ? "Cantoria dos marinheiros (agora)" : "Cantoria dos marinheiros (à noite)",
      icon: "note",
      fn: () => {
        if (!(h >= 19 || h < 2)) return say([[N, "Os marinheiros só cantam quando o sol se põe. Volte à noite!"]]);
        fun2(15);
        say([["Marinheiros", "♪ Ô, Brisamar, me leva pro mar, que a terra é dura e o peixe é pra pescar! ♪"], ["", "Você bate o pé no ritmo. No terceiro refrão, já sabe a letra."]]);
      },
    },
    { t: "Ouvir lendas do cais", icon: "book", fn: () => (fun2(6), say([["Velho Pescador", pk(["Antes do Silêncio, o mar cantava. A gente ouvia as ondas e sabia se ia chover.", "Contam que o Leviatã já levou um barco inteiro para o fundo e devolveu no dia seguinte, com o pescador dormindo.", "O farol foi aceso por uma menina de cabelo prateado. Dizem que era a Odelia, criança."])]])) },
    { t: "Até logo", fn: null },
  ]);
}
function serraMenu() {
  const N = TOWN_LIFE.serra.crier.nm;
  choice(N, "\"Pedravale te saúda! Aqui se trabalha com o martelo e se descansa com a caneca.\"", [
    {
      t: "Concurso de força na bigorna",
      icon: "hammer",
      fn: () => {
        if (typeof timingGame !== "function") return;
        if (!once2("bigorna")) return say([[N, "Seu braço já foi testado hoje. Descansa esse músculo!"]]);
        timingGame("Força na bigorna", "hammer", ["Primeira martelada", "Segunda martelada", "Martelada final"], "Acerte o martelo no verde para tocar o sino lá em cima!", (s, max) => {
          const prize = s >= max ? 25 : s >= max - 2 ? 10 : 0;
          player.gold += prize;
          fun2(10);
          say([["", s >= max ? "DING! O sino toca lá em cima! Os anões levantam você nos ombros." : s >= 3 ? "O peso sobe quase até o topo! Aplausos de anão (curtos, mas sinceros)." : "O peso mal sai do chão. Um anão de 90 anos ri baixinho."], ...(prize ? [["", `Prêmio: ${prize} ouro.`]] : [])]);
        });
      },
    },
    {
      t: "Feira de cristais",
      icon: "gem",
      fn: () =>
        choice("Feira de cristais", "Bancas de pedras que brilham até de dia.", [
          { t: "Cristal pequeno (12 ouro)", icon: "gem", fn: () => spend2(12) && (typeof addItem === "function" && ITEMS.cristal && addItem("cristal", 1), say([["Anã Gilda", "Esse canta se você encostar no ouvido. Escuta!"]])) },
          { t: "Pedra da sorte (8 ouro)", icon: "gem", fn: () => spend2(8) && (fun2(5), say([["Anã Gilda", "Leva no bolso esquerdo. O direito é para azar."]])) },
          { t: "Só olhar", fn: null },
        ]),
    },
    { t: "Cerveja de pedra dos anões (5 ouro)", icon: "mug", fn: () => spend2(5) && ((player.drunk = Math.min(100, (player.drunk || 0) + 25)), fun2(12), say([["", "A caneca é de pedra. A cerveja também parece. Você tosse, ri e pede outra."]])) },
    {
      t: "Ajudar na mina (1 hora)",
      icon: "pickaxe",
      fn: () => {
        if (!once2("mina")) return say([[N, "Já ajudou hoje. A mina não foge!"]]);
        player.clock = Math.min(1439, player.clock + 60);
        player.gold += 10;
        if (typeof addNeed === "function" && lifeMode()) addNeed("hygiene", -15);
        say([["", "Você empurra carrinhos de minério na escuridão fresca da mina. Sai sujo até a orelha."], [N, "10 de ouro, com gratidão de anão. Isso vale muito por aqui!"]]);
      },
    },
    { t: "Ouvir a canção dos anões", icon: "note", fn: () => (fun2(10), say([["Anões", "♪ Pedra e fogo, fogo e pedra, quem cava fundo nunca se perde! ♪"], ["", "As vozes graves ecoam pelos picos."]])) },
    { t: "Até logo", fn: null },
  ]);
}
(() => {
  const tgBase = targetAt;
  targetAt = function (x, y) {
    if (isCrier(x, y)) return `Falar com ${townPick(player.zone).crier.nm}`;
    return tgBase(x, y);
  };
  const iaBase = interactAt;
  interactAt = function (x, y) {
    if (isCrier(x, y)) return player.zone === "porto" ? portoMenu() : serraMenu();
    return iaBase(x, y);
  };
  const wkBase = walkable;
  walkable = function (z, x, y) {
    if (TOWN_LIFE[z] && crierPos[z] && crierPos[z][0] === x && crierPos[z][1] === y) return false;
    return wkBase(z, x, y);
  };
  const cdBase = crewDrawList;
  crewDrawList = function (list, t) {
    cdBase(list, t);
    const T = townPick(player.zone);
    if (!T) return;
    const [x, y] = crierSpot(player.zone);
    list.push({
      y,
      draw: () => {
        const X = x * TILE,
          Y = y * TILE;
        ctx.fillStyle = "rgba(0,0,0,.25)";
        ctx.beginPath();
        ctx.ellipse(X + 16, Y + 30, 9, 3, 0, 0, 7);
        ctx.fill();
        drawSprite(wizardRects(T.crier.robe, T.crier.hat, T.crier.hair, null, "down", 0), X, Y + Math.sin(t * 2) * 0.8, 2, false);
        // sininho de pregoeiro
        const sw = Math.sin(t * 6) * 2;
        ctx.fillStyle = "#c9a03a";
        ctx.fillRect(X + 26 + sw, Y + 10, 5, 5);
        ctx.fillStyle = "#6a4428";
        ctx.fillRect(X + 27, Y + 14, 2, 6);
        ctx.font = '700 9px "Pixelify Sans", sans-serif';
        ctx.textAlign = "center";
        ctx.fillStyle = "#fff";
        ctx.fillText("!", X + 16, Y - 4);
      },
    });
  };
})();

/* ----- o jornal fala das outras vilas ----- */
{
  const NEWS = [
    "Porto Brisamar: a Gaivota Ligeira venceu a regata de novo. A Sereia Teimosa pediu revanche.",
    "Porto Brisamar: o leilão de peixes bateu recorde. Uma sardinha saiu por 12 de ouro.",
    "Pedravale: um anão de 90 anos tocou o sino da bigorna. A vila inteira parou para ver.",
    "Pedravale: acharam um cristal que canta em três tons na Mina de Cristal.",
    "Porto Brisamar: marinheiros cantaram até o amanhecer. Ninguém dormiu no cais.",
    "Pedravale: a cervejaria anã lançou a Cerveja de Pedra Escura. Dizem que é ainda mais pesada.",
  ];
  const dayBase = onNewDay;
  onNewDay = function () {
    const r = dayBase.apply(this, arguments);
    if (Math.random() < 0.6 && typeof vilaNews === "function") vilaNews(pk(NEWS));
    return r;
  };
}
