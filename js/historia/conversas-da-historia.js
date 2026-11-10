/**
 * ECOS DO ARCANO — conversas-da-historia.js (modo História)
 * As falas que fazem a história andar (Odelia, Capitão Bento, Anciã Berta,
 * Professor Honda) ficavam escondidas em "Ouvir o que tem a dizer", no meio de
 * um menu enorme, e "Puxar conversa" só gerava conversa à toa. Agora:
 *  - se a pessoa tem uma fala da história esperando, falar com ela vai direto nela;
 *  - nas outras vezes, a primeira opção do menu é "★ Falar sobre a missão".
 */

"use strict";

const STORY_TALKERS = ["odelia", "honda", "capitao", "ancia", "kael", "selene"];
/** Esta pessoa tem uma fala que avança a história agora? */
function storyBeatPending(id) {
  if (lifeMode() || !NPCS[id] || typeof NPCS[id].talk !== "function") return false;
  const F = player.flags,
    G = player.guards || [];
  switch (id) {
    case "odelia":
      return (G.includes("bosque") && !F.r2) || (G.includes("pantano") && !F.r3) || (G.includes("picos") && !F.r4);
    case "capitao":
      return !!F.r2 && !F.porto1;
    case "ancia":
      return !!F.r3 && !F.serra1;
    case "honda":
      return !F.honda || (player.pages || []).length > (F.hondaPages || 0);
    default:
      return false;
  }
}
function storyTalk(id) {
  const l = NPCS[id].talk();
  if (l && l.length) say(l);
}
{
  const smBase = socialMenu;
  socialMenu = function (id) {
    if (storyBeatPending(id)) return storyTalk(id);
    if (lifeMode() || !STORY_TALKERS.includes(id) || !NPCS[id] || typeof NPCS[id].talk !== "function") return smBase(id);
    hookChoice(
      () => smBase(id),
      (title, text, opts) => {
        // Uma opção só, no topo, no lugar de "Ouvir o que tem a dizer".
        const rest = opts.filter((o) => o.t !== "Ouvir o que tem a dizer");
        return [title, text, [{ t: "★ Falar sobre a missão", icon: "scroll", fn: () => storyTalk(id) }, ...rest]];
      },
    );
  };
}

/* A seta da missão segue a pessoa: quem anda pela vila não fica mais no "ponto de casa". */
function roamingPos(id) {
  const r = (game.roam || []).find((q) => q.id === id && !npcAsleep(q.id));
  return r ? [r.x, r.y] : null;
}
{
  const znBase = zoneNpcPos;
  zoneNpcPos = function (zone, id) {
    if (zone === player.zone) {
      const r = roamingPos(id);
      if (r) return r;
    }
    return znBase(zone, id);
  };
  const npBase = npcPos;
  npcPos = function (id) {
    if (player.zone === "vila") {
      const r = roamingPos(id);
      if (r) return r;
    }
    return npBase(id);
  };
}

/* Guardiões e o chefe final nunca recusam a luta por cansaço: você luta exausta (−15% de dano). */
{
  const sbBase = startBattle;
  startBattle = function (type, mob, opts = {}) {
    const e = ENEMIES[type];
    if (!lifeMode() && e && e.boss && typeof fightCost === "function" && stamina() < fightCost(type)) {
      player.stamina = fightCost(type);
      setTimeout(() => toast("Você está exaust" + genderWord("o", "a", "e") + ": vai lutar mais fraco (−15% de dano). Dormir recupera o fôlego.", 4200), 600);
    }
    return sbBase(type, mob, opts);
  };
}
