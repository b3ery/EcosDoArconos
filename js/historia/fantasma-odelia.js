/**
 * ECOS DO ARCANO — fantasma-odelia.js (modo História)
 * Se a Arquimaga Odelia morrer (caminho do vilão), ela some da vila e o
 * FANTASMA dela passa a perseguir o aprendiz: anda alguns passos atrás,
 * fica mais forte à noite e sussurra de tempos em tempos.
 * Os passos da história que pediam "conte à Odelia" passam a ser cumpridos
 * pelo fantasma, para a história nunca travar.
 */

"use strict";

const odeliaDead = () => story() && player && player.flags && !!player.flags.odeliaMorta;
const GHOST_LINES = [
  "Você ainda ouve a Canção... mesmo depois do que fez?",
  "Meu irmão também começou assim. Com uma escolha pequena.",
  "Eu esperei trezentos anos por você. E você me deu isto.",
  "Não precisa correr, aprendiz. Eu não canso mais.",
  "Cada runa que você toca lembra de mim.",
  "Olhe para trás. Eu estou sempre aqui.",
  "A noite é mais fria desde que você me calou.",
];
const GHOST_STEP_LINES = {
  r2: "A Terra voltou... e eu não estou lá para sentir. O Pântano é o próximo. Mas você já sabe disso, não sabe?",
  r3: "Mais uma runa nas mãos erradas. Os Picos esperam. Eu vou junto. Sempre.",
  r4: "A barreira caiu. A Torre te espera... e o meu irmão também. Diga a ele que eu tentei.",
};

(() => {
  // Some da vila.
  const nhBase = npcHidden;
  npcHidden = function (id) {
    if (id === "odelia" && odeliaDead()) return true;
    return nhBase.apply(this, arguments);
  };
  // O fantasma acompanha o aprendiz.
  const upBase = update;
  update = function (dt) {
    const r = upBase.apply(this, arguments);
    if (!odeliaDead() || !ZONES[player.zone]) return r;
    const G = (game.ghost = game.ghost && game.ghost.z === player.zone ? game.ghost : { z: player.zone, x: player.rx - 2, y: player.ry + 1, next: game.t + 25 });
    // segue de longe, sem nunca alcançar
    const dx = player.rx - G.x,
      dy = player.ry - G.y,
      d = Math.hypot(dx, dy);
    if (d > 2.2) {
      const sp = Math.min(d - 2.2, (isNight() ? 4.2 : 3.2) * (dt || 0.016));
      G.x += (dx / d) * sp;
      G.y += (dy / d) * sp;
    }
    // os passos "conte à Odelia" passam a ser do fantasma
    const F = player.flags;
    for (const [k, g] of [["r2", "bosque"], ["r3", "pantano"], ["r4", "picos"]])
      if (!F[k] && player.guards.includes(g) && game.mode === "world" && !game.dialog) {
        F[k] = true;
        saveGame();
        say([["Fantasma de Odelia", GHOST_STEP_LINES[k]]]);
        return r;
      }
    // sussurros
    if (game.t > G.next && game.mode === "world" && !game.dialog && !game.cine) {
      G.next = game.t + 70 + Math.random() * 60;
      toast(`Fantasma de Odelia: "${GHOST_LINES[Math.floor(Math.random() * GHOST_LINES.length)]}"`, 4200);
      playSound(140, 0.6, "sine", 0.03);
    }
    return r;
  };
  const cdBase = crewDrawList;
  crewDrawList = function (list, t) {
    cdBase(list, t);
    const G = game.ghost;
    if (!odeliaDead() || !G || G.z !== player.zone) return;
    list.push({
      y: G.y + 0.5,
      draw: () => {
        ctx.save();
        ctx.globalAlpha = (isNight() ? 0.6 : 0.38) + 0.08 * Math.sin(t * 2);
        ctx.filter = "hue-rotate(-30deg) saturate(0.6) brightness(1.3)";
        drawSprite(wizardRects("#5b3fa8", "#3a2878", "#e8e8f0", null, G.x < player.rx ? "right" : "left", Math.floor(t * 2) % 2), G.x * TILE, (G.y - 0.2 + Math.sin(t * 1.6) * 0.1) * TILE, 2, false);
        ctx.restore();
      },
    });
  };
})();
// O retrato do diálogo do fantasma é o da Odelia.
if (typeof STORY_SPEAKERS !== "undefined" && STORY_SPEAKERS["Arquimaga Odelia"] !== undefined) STORY_SPEAKERS["Fantasma de Odelia"] = STORY_SPEAKERS["Arquimaga Odelia"];
else if (typeof STORY_SPEAKERS !== "undefined") STORY_SPEAKERS["Fantasma de Odelia"] = { npc: "odelia" };
