/**
 * ECOS DO ARCANO — epilogo-e-novo-jogo.js
 * Epílogo jogável (estátua ou bandeiras negras, falas novas, os irmãos juntos)
 * e o Novo Jogo+ (Grimório mantido, inimigos mais fortes, déjà-vu).
 * Modifica (envolve) funções de outros arquivos: chatWith, crewDrawList.
 */

"use strict";

/* ===================== EPÍLOGO ===================== */
const EPI_LINES = {
  heroi: ["Você viu a estátua na praça? Ficou a sua cara!", "Desde que a Canção voltou, até o galo canta afinado.", "Meus filhos brincam de ser você. Um faz a Odelia, outro faz o Vesper.", "A Odelia sorri de novo. Fazia trezentos anos que ninguém via isso."],
  vilao: ["...Bom dia, Majestade Sombria. Não, não estou tremendo.", "Ninguém canta mais na praça. Ninguém tem coragem.", "Dizem que você ouve tudo. Então: eu nunca falei mal de você."],
  dejavu: ["Engraçado... sinto que já vivi esse dia.", "Você de novo? Quer dizer... prazer, desconhecid@.", "Eu sonhei que você salvava o mundo. Era você mesmo?", "Tenho a sensação de que a Odelia vai dizer 'aprendiz' três vezes hoje."],
};
{
  const cwBase = chatWith;
  chatWith = function (id) {
    if (story() && player.finished && Math.random() < 0.5) return say([[shortName(id), pk(player.villainEnd ? EPI_LINES.vilao : EPI_LINES.heroi)]]);
    if (story() && player.ngp && Math.random() < 0.25) return say([[shortName(id), pk(EPI_LINES.dejavu).replace("@", genderWord("o", "a", "e"))]]);
    return cwBase(id);
  };
}
function drawEpilogue(t) {
  if (!player.finished || player.zone !== "vila") return;
  const { cx, cy } = protestPlaza();
  const X = (cx + 3) * TILE,
    Y = (cy + 6) * TILE;
  if (player.villainEnd) {
    for (const dx of [-5, 5]) {
      ctx.fillStyle = "#3a2a2a";
      ctx.fillRect((cx + dx) * TILE + 14, (cy + 2) * TILE - 30, 4, 60);
      ctx.fillStyle = "#1a0e1e";
      ctx.fillRect((cx + dx) * TILE + 18, (cy + 2) * TILE - 30 + Math.sin(t * 2) * 2, 26, 30);
    }
    return;
  }
  ctx.fillStyle = "#8a8090";
  ctx.fillRect(X - 4, Y + 18, 40, 14);
  const rects = heroRects(player.look, "down", null).map(([x, y, w, h]) => [x, y, w, h, "#d8c070"]);
  drawSprite(rects, X, Y - 18, 2.2, false);
  // Os irmãos, juntos de novo.
  drawSprite(wizardRects(NPCS.odelia ? NPCS.odelia.robe : "#5b3fa8", NPCS.odelia ? NPCS.odelia.hat : null, NPCS.odelia ? NPCS.odelia.hair : "#d9d9d9", null, "right", 0), X - 90, Y, 2, false);
  drawSprite(wizardRects("#3a2a5a", null, "#1a1410", null, "left", 0), X - 60, Y, 2, true);
  if (Math.sin(t * 1.2) > 0.6) drawPixelIcon("heart", X - 60, Y - 6, 2);
}
(function ngPlusButton() {
  const keep = byId("btnKeep");
  if (!keep) return;
  const b = document.createElement("button");
  b.id = "btnNGP";
  b.textContent = "Novo Jogo+ ✦";
  b.title = "Recomeça a história com o seu Grimório, inimigos mais fortes e falas novas";
  keep.parentNode.insertBefore(b, keep.nextSibling);
  b.onclick = () => {
    const o = player;
    player = newPlayer();
    Object.assign(player, { name: o.name, look: o.look, gender: o.gender, aff: o.aff, spells: (o.spells || []).slice(), mastery: Object.assign({}, o.mastery), combos: (o.combos || []).slice(), ngp: (o.ngp || 0) + 1, tutDone: true, diff: o.diff, traits: o.traits, orient: o.orient });
    game.seenArr = {};
    game.mm = {};
    saveGame();
    startGame(true);
    setTimeout(() => toast(`Novo Jogo+ ${player.ngp}: seu Grimório veio junto. Os inimigos estão ${Math.round(35 * player.ngp)}% mais fortes.`, 5200), 1500);
  };
})();

/* ===================== LIGAÇÕES ===================== */
{
  const cdBase = crewDrawList;
  crewDrawList = function (list, t) {
    cdBase(list, t);
    if (story() && player.zone === "vila") list.push({ y: protestPlaza().cy + 6.5, draw: () => drawEpilogue(t) });
  };
}
