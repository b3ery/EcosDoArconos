/**
 * ECOS DO ARCANO — segredos-e-capitulos.js
 * 12 segredos escondidos fora do caminho e os capítulos do Pântano (Velha Juta)
 * e da Torre (Eco do Bibliotecário).
 * Modifica (envolve) funções de outros arquivos: characterAt, crewDrawList, interactAt, maxHp, targetAt.
 */

"use strict";

/* ===================== SEGREDOS ===================== */
const SECRET_SPOTS = ["bosque", "bosque", "pantano", "pantano", "picos", "picos", "mina", "torre", "porto", "serra", "escola", "picos"].map((z, i) => ({ z, k: "seg" + i }));
const SECRET_LORE = [
  "Uma pedra com dois nomes gravados: \"O + V\".",
  "Um pião de madeira, pequeno, pintado de roxo.",
  "Uma página rasgada: \"Hoje a Odelia me defendeu dos meninos do porto.\"",
  "Um sino de cobre que não faz barulho nenhum.",
  "Uma pena de grifo dourada, quente ao toque.",
  "Um anel de criança com uma runa de luz apagada.",
  "Um bilhete: \"Se alguém achar isto, diga à minha irmã que eu tentei.\"",
  "Um cristal que mostra, por um segundo, dois meninos rindo.",
  "Uma concha que, encostada no ouvido, sussurra o seu nome.",
  "Um martelo de anão pequeno demais para um anão.",
  "Um caderno com 100 tentativas de acender uma vela.",
  "Uma flor seca que nunca perdeu a cor.",
];
function secretAt(x, y) {
  return SECRET_SPOTS.findIndex((s, i) => s.z === player.zone && !(player.secretsFound || []).includes(i) && near(spotOf(s.z, s.k), x, y));
}
const CHAPTERS = {
  pantano: { npc: "Velha Juta", look: { robe: "#4a6a3a", hat: "#2a3a20", hair: "#cfc6b8" }, eco: "hidra", item: "lírio da névoa", intro: "O brejo adoece desde que a Hidra acordou. Traga 3 lírios da névoa e liberte a Hidra, e eu te conto o que vi há trezentos anos.", end: "Eu vi Vesper passar por aqui, menino ainda, chorando. Ele plantou o primeiro lírio. Disse que era para a irmã." },
  torre: { npc: "Eco do Bibliotecário", look: { robe: "#3a3a6a", hat: "#20204a", hair: "#9aa0c8" }, eco: "colosso", item: "eco da voz de Vesper", intro: "Esta torre guarda vozes. Junte 3 ecos da voz de Vesper e cale o Colosso. Então eu leio para você o último livro dele.", end: "O último livro de Vesper tem uma frase só, repetida mil vezes: \"Eu só queria ser ouvido.\"" },
};
function chapterNpcSpot(z) {
  return spotOf(z, "npc");
}
function chapterItemSpots(z) {
  return [0, 1, 2].map((i) => spotOf(z, "item" + i));
}
function chap(z) {
  player.chap = player.chap || {};
  return (player.chap[z] = player.chap[z] || { on: false, got: [], done: false });
}
function chapterInteract(x, y) {
  const z = player.zone,
    C = CHAPTERS[z];
  if (!C) return false;
  const S = chap(z);
  if (near(chapterNpcSpot(z), x, y)) {
    if (S.done) return say([[C.npc, C.end]]), true;
    if (!S.on) return ((S.on = true), saveGame(), say([[C.npc, C.intro], ["", `Capítulo novo: ${ZONES[z].nome}. Veja em Missões (Q).`]])), true;
    const eco = (player.ecos || []).includes(C.eco);
    if (S.got.length >= 3 && eco) {
      S.done = true;
      gainXP(200);
      player.gold += 150;
      player.maxHpBonus = (player.maxHpBonus || 0) + 10;
      saveGame();
      return say([[C.npc, C.end], ["", "Capítulo concluído! +200 XP, +150 de ouro e +10 de vida máxima."]]), true;
    }
    return say([[C.npc, `Faltam: ${3 - S.got.length} ${C.item}(s)${eco ? "" : ` e libertar o Eco (${ENEMIES[C.eco].nome})`}.`]]), true;
  }
  const ii = chapterItemSpots(z).findIndex((p) => near(p, x, y));
  if (ii >= 0 && S.on && !S.got.includes(ii)) {
    S.got.push(ii);
    playSound(880, 0.1, "sine");
    saveGame();
    return say([["", `Você encontrou um ${C.item}! (${S.got.length}/3)`]]), true;
  }
  return false;
}
{
  const mhBase = maxHp;
  maxHp = function () {
    return mhBase() + (story() ? player.maxHpBonus || 0 : 0);
  };
}

/** Achou um segredo: ouro, XP e um pedaço da história. */
function findSecret(si) {
  player.secretsFound = player.secretsFound || [];
  player.secretsFound.push(si);
  const g = 40 + Math.floor(Math.random() * 40);
  player.gold += g;
  gainXP(40);
  saveGame();
  playSound(1047, 0.15, "triangle");
  return say([["", `Segredo encontrado (${player.secretsFound.length}/${SECRET_SPOTS.length})! ${SECRET_LORE[si]}`], ["", `+${g} de ouro, +40 XP.`]]);
}

/* ===================== LIGAÇÕES ===================== */
{
  const charBase = characterAt;
  characterAt = function (x, y) {
    if (story() && CHAPTERS[player.zone] && near(chapterNpcSpot(player.zone), x, y)) return true;
    return charBase(x, y);
  };
  const tgtBase = targetAt;
  targetAt = function (x, y) {
    if (story()) {
      if (CHAPTERS[player.zone] && near(chapterNpcSpot(player.zone), x, y)) return CHAPTERS[player.zone].npc;
      if (CHAPTERS[player.zone] && chap(player.zone).on && chapterItemSpots(player.zone).some((p, i) => near(p, x, y) && !chap(player.zone).got.includes(i))) return `Pegar ${CHAPTERS[player.zone].item}`;
      if (secretAt(x, y) >= 0) return "Algo brilha aqui...";
    }
    return tgtBase(x, y);
  };
  const interBase = interactAt;
  interactAt = function (x, y) {
    if (story()) {
      if (chapterInteract(x, y)) return;
      const si = secretAt(x, y);
      if (si >= 0) return findSecret(si);
    }
    return interBase(x, y);
  };
  const cdBase = crewDrawList;
  crewDrawList = function (list, t) {
    cdBase(list, t);
    if (!story()) return;
    const C = CHAPTERS[player.zone];
    if (C) {
      const p = chapterNpcSpot(player.zone);
      if (p) list.push({ y: p[1], draw: () => (drawSprite(wizardRects(C.look.robe, C.look.hat, C.look.hair, null, "down", 0), p[0] * TILE, p[1] * TILE, 2, false), !chap(player.zone).done && drawPixelIcon(chap(player.zone).on ? "chat" : "star", p[0] * TILE + 16, p[1] * TILE - 8, 2)) });
      if (chap(player.zone).on)
        chapterItemSpots(player.zone).forEach((q, i) => {
          if (!q || chap(player.zone).got.includes(i)) return;
          list.push({ y: q[1], draw: () => ((ctx.fillStyle = `rgba(200,240,255,${0.5 + 0.4 * Math.sin(t * 4 + i)})`), ctx.fillRect(q[0] * TILE + 12, q[1] * TILE + 12, 8, 8)) });
        });
    }
    SECRET_SPOTS.forEach((s, i) => {
      if (s.z !== player.zone || (player.secretsFound || []).includes(i)) return;
      const q = spotOf(s.z, s.k);
      if (!q || Math.abs(q[0] - player.x) + Math.abs(q[1] - player.y) > 5) return;
      list.push({ y: q[1], draw: () => ((ctx.fillStyle = `rgba(255,240,170,${0.3 + 0.5 * Math.abs(Math.sin(t * 3 + i))})`), ctx.fillRect(q[0] * TILE + 14, q[1] * TILE + 10 - Math.abs(Math.sin(t * 3)) * 4, 4, 4)) });
    });
  };
}
