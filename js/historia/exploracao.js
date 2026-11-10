/**
 * ECOS DO ARCANO — exploracao.js (modo História)
 * Lugares escondidos pelo mundo: 15 ao todo, 3 em cada região.
 *  - Alguns você descobre só de chegar perto (um brilho "?" aparece quando
 *    você está passando por perto).
 *  - Outros estão atrás de um obstáculo que só uma runa abre: vinhas
 *    (Chama), pedras rachadas (Terra), água funda (Maré) e névoa presa (Vento).
 *    Dá para voltar depois, quando tiver a runa.
 *  - Cada lugar conta um pedaço da história e dá uma recompensa. Completar
 *    uma região inteira dá um bônus.
 * Ao entrar numa região, aparece quantos lugares você já achou ali.
 * Modifica (envolve) funções de outros arquivos: crewDrawList, enterZone,
 * interactAt, targetAt, update.
 */

"use strict";

const OBSTACLE = {
  fogo: { n: "Vinhas espinhosas", act: "Queimar as vinhas", done: "As vinhas pegam fogo e viram cinza num instante." },
  terra: { n: "Pedras rachadas", act: "Quebrar as pedras", done: "A terra treme e as pedras se partem ao meio." },
  agua: { n: "Água funda", act: "Abrir caminho na água", done: "A água se afasta, obediente, e abre uma trilha seca." },
  ar: { n: "Névoa presa", act: "Soprar a névoa", done: "Um vento forte varre a névoa para longe." },
};
const LANDMARKS = [
  { id: "mirante", z: "bosque", n: "Mirante do Velho Carvalho", need: null, lore: "Daqui se vê a vila inteira. No tronco, alguém entalhou duas letras: V e O, e um coração torto.", r: { gold: 30, xp: 40 } },
  { id: "vinhas", z: "bosque", n: "Clareira das Vinhas", need: "fogo", lore: "Atrás das vinhas, um círculo de cogumelos brilhantes guarda um cavalinho de madeira. Na barriga dele: \"do Vesper para a Odelia\".", r: { gold: 50, hp: 5 } },
  { id: "raiz", z: "bosque", n: "Raiz Oca", need: "terra", lore: "Dentro da raiz, um esconderijo de criança: pedrinhas coloridas e um desenho de duas pessoas de mãos dadas.", r: { gold: 40, items: [["pocao", 2]] } },
  { id: "barco", z: "pantano", n: "Barco Afundado", need: null, lore: "Um barquinho meio afundado no brejo. No banco, gravado com faca: \"Daqui eu vou embora\".", r: { gold: 35, xp: 50 } },
  { id: "ilha", z: "pantano", n: "Ilha dos Lírios", need: "agua", lore: "Uma ilhinha coberta de lírios da névoa, todos virados para a vila. Foi aqui que Vesper plantou o primeiro.", r: { gold: 50, mp: 4 } },
  { id: "circulo", z: "pantano", n: "Círculo de Névoa", need: "ar", lore: "No meio da névoa presa, seis pedras em roda, cada uma com uma runa. A sexta está apagada: Sombra.", r: { gold: 45, items: [["eter", 2]] } },
  { id: "ninho", z: "picos", n: "Ninho Abandonado", need: null, lore: "Um ninho enorme, vazio há séculos. Penas de pedra no chão: o Grifo viveu aqui antes de ser silenciado.", r: { gold: 40, xp: 60 } },
  { id: "caverna", z: "picos", n: "Caverna do Eco", need: "terra", lore: "Você grita seu nome e o eco devolve outro: \"Odelia... Odelia...\". Alguém gritou isso aqui tantas vezes que a pedra decorou.", r: { gold: 60, hp: 5 } },
  { id: "gelo", z: "picos", n: "Ponte de Gelo", need: "fogo", lore: "O gelo derrete e revela uma ponte de pedra antiga. Do outro lado, uma fogueira apagada há trezentos anos e um cobertor dobrado.", r: { gold: 55, items: [["fragmento", 1]] } },
  { id: "destrocos", z: "porto", n: "Destroços do Navio Estrela", need: null, lore: "O casco do navio em que Vesper partiu. No mastro, um nome riscado e reescrito várias vezes.", r: { gold: 45, xp: 50 } },
  { id: "gruta", z: "porto", n: "Gruta da Maré", need: "agua", lore: "Na maré baixa mágica, uma gruta cheia de conchas que cantam quando o vento passa. A mesma canção da caixinha de música da Odelia.", r: { gold: 60, mp: 4 } },
  { id: "rochedo", z: "porto", n: "Rochedo das Gaivotas", need: "ar", lore: "Lá no alto, um velho telescópio apontado para a Torre do Silêncio. Alguém ficou vigiando durante anos.", r: { gold: 50, items: [["pocao", 2]] } },
  { id: "forno", z: "serra", n: "Forno Esquecido", need: "fogo", lore: "Um forno anão apagado. Dentro, o primeiro molde do cajado de Vesper, rachado. Ele tentou muitas vezes.", r: { gold: 55, hp: 5 } },
  { id: "veio", z: "serra", n: "Veio de Cristal", need: "terra", lore: "Um veio de cristal que brilha com as cores das quatro runas. Os anões dizem que foi aqui que a magia nasceu.", r: { gold: 70, items: [["fragmento", 1]] } },
  { id: "cachoeira", z: "serra", n: "Cachoeira Escondida", need: "agua", lore: "Atrás da água, uma sala com dois banquinhos de pedra. Um tem o nome dela; o outro, o dele.", r: { gold: 50, mp: 4 } },
];
const LM_REGIONS = ["bosque", "pantano", "picos", "porto", "serra"];
function lmFound() {
  return (player.lm = player.lm || {});
}
function lmSpot(L) {
  return ZONES[L.z] ? spotOf(L.z, "lm-" + L.id) : null;
}
function lmCount(z) {
  const all = LANDMARKS.filter((L) => !z || L.z === z);
  return [all.filter((L) => lmFound()[L.id]).length, all.length];
}
function lmAt(x, y) {
  return LANDMARKS.find((L) => L.z === player.zone && !lmFound()[L.id] && L.need && near(lmSpot(L), x, y)) || null;
}
function discoverLandmark(L) {
  if (lmFound()[L.id]) return;
  lmFound()[L.id] = player.day || 1;
  const R = L.r,
    got = [];
  if (R.gold) (player.gold += R.gold, got.push(`+${R.gold} de ouro`));
  if (R.xp) (gainXP(R.xp), got.push(`+${R.xp} XP`));
  if (R.hp) ((player.maxHpBonus = (player.maxHpBonus || 0) + R.hp), got.push(`+${R.hp} de vida máxima`));
  if (R.mp) ((player.basemp += R.mp), got.push(`+${R.mp} de mana máxima`));
  for (const [it, n] of R.items || []) (addItem(it, n), got.push(`${n}× ${ITEMS[it] ? ITEMS[it].nome : it}`));
  const [f, t] = lmCount(L.z);
  const lines = [["", `📍 Lugar escondido: ${L.n}`], ["", L.lore], ["", got.join(", ") + "."]];
  if (f === t) {
    player.gold += 60;
    lines.push(["", `Você descobriu todos os lugares de ${ZONES[L.z].nome}! +60 de ouro.`]);
  }
  saveGame();
  [659, 880, 1175].forEach((fq, i) => setTimeout(() => playSound(fq, 0.18, "triangle", 0.05), i * 120));
  say(lines);
}

/* ===================== LIGAÇÕES ===================== */
{
  const ezBase = enterZone;
  enterZone = function () {
    const r = ezBase.apply(this, arguments);
    if (story() && LM_REGIONS.includes(player.zone)) {
      const [f, t] = lmCount(player.zone);
      setTimeout(() => game.mode === "world" && toast(`🧭 ${ZONES[player.zone].nome}: ${f}/${t} lugares escondidos`, 2600), 1600);
    }
    return r;
  };
  let acc = 0;
  const updBase = update;
  update = function (dt) {
    updBase(dt);
    if (!story() || game.mode !== "world" || game.dialog || game.cine) return;
    acc += dt;
    if (acc < 0.3) return;
    acc = 0;
    for (const L of LANDMARKS) {
      if (L.z !== player.zone || L.need || lmFound()[L.id]) continue;
      const p = lmSpot(L);
      if (p && Math.abs(p[0] - player.x) + Math.abs(p[1] - player.y) <= 1) return discoverLandmark(L);
    }
  };
  const tgtBase = targetAt;
  targetAt = function (x, y) {
    if (story()) {
      const L = lmAt(x, y);
      if (L) return player.runes.includes(L.need) ? `${OBSTACLE[L.need].act} (${RUNES[L.need].nome})` : `${OBSTACLE[L.need].n} (precisa de ${RUNES[L.need].nome})`;
    }
    return tgtBase(x, y);
  };
  const iaBase = interactAt;
  interactAt = function (x, y) {
    if (story()) {
      const L = lmAt(x, y);
      if (L) {
        const O = OBSTACLE[L.need];
        if (!player.runes.includes(L.need)) return say([["", `${O.n}. Nenhuma magia que você conhece abre isso. Volte quando tiver a runa de ${RUNES[L.need].nome}.`]]);
        if (!settings.calm) game.shake = 0.3;
        game.flash = 0.4;
        playSound(L.need === "fogo" ? 180 : L.need === "terra" ? 90 : L.need === "agua" ? 300 : 500, 0.4, "sawtooth", 0.04);
        return say([["", O.done]], () => discoverLandmark(L));
      }
    }
    return iaBase(x, y);
  };
  const cdBase = crewDrawList;
  crewDrawList = function (list, t) {
    cdBase(list, t);
    if (!story()) return;
    for (const L of LANDMARKS) {
      if (L.z !== player.zone) continue;
      const p = lmSpot(L);
      if (!p) continue;
      const dist = Math.abs(p[0] - player.x) + Math.abs(p[1] - player.y);
      const X = p[0] * TILE,
        Y = p[1] * TILE,
        found = lmFound()[L.id];
      if (found) {
        list.push({ y: p[1], draw: () => ((ctx.fillStyle = "#8a7a60"), ctx.fillRect(X + 13, Y + 8, 3, 20), (ctx.fillStyle = "#ffd34d"), ctx.fillRect(X + 16, Y + 8, 10, 7)) });
        continue;
      }
      if (!L.need) {
        if (dist > 5) continue;
        list.push({ y: p[1], draw: () => ((ctx.globalAlpha = 0.4 + 0.5 * Math.abs(Math.sin(t * 2.5))), (ctx.font = '700 16px "Pixelify Sans", sans-serif'), (ctx.fillStyle = "#ffe8a0"), (ctx.textAlign = "center"), ctx.fillText("?", X + 16, Y + 12 - Math.abs(Math.sin(t * 2)) * 3), (ctx.globalAlpha = 1)) });
        continue;
      }
      if (dist > 9) continue;
      const draw = {
        fogo: () => {
          for (let i = 0; i < 6; i++) {
            ctx.fillStyle = i % 2 ? "#2f5a22" : "#3f7a2a";
            ctx.fillRect(X + 2 + ((i * 5) % 24), Y + 4 + ((i * 7) % 20), 8, 8);
          }
          ctx.fillStyle = "#c03a3a";
          ctx.fillRect(X + 8, Y + 10, 2, 2), ctx.fillRect(X + 20, Y + 18, 2, 2);
        },
        terra: () => {
          ctx.fillStyle = "#7a6a5a";
          ctx.fillRect(X + 3, Y + 6, 26, 22);
          ctx.fillStyle = "#4a3a2a";
          ctx.fillRect(X + 14, Y + 6, 2, 10), ctx.fillRect(X + 10, Y + 16, 8, 2), ctx.fillRect(X + 18, Y + 18, 2, 8);
        },
        agua: () => {
          ctx.fillStyle = "#1f4a7a";
          ctx.beginPath(), ctx.arc(X + 16, Y + 16, 14, 0, 7), ctx.fill();
          ctx.strokeStyle = "#7ad0ff";
          ctx.lineWidth = 2;
          ctx.beginPath(), ctx.arc(X + 16, Y + 16, 6 + 4 * Math.abs(Math.sin(t * 2)), t, t + 4), ctx.stroke();
        },
        ar: () => {
          for (let i = 0; i < 3; i++) {
            ctx.fillStyle = `rgba(230,235,245,${0.45 + 0.15 * Math.sin(t * 2 + i)})`;
            ctx.beginPath(), ctx.ellipse(X + 16 + Math.sin(t + i * 2) * 5, Y + 12 + i * 6, 14, 6, 0, 0, 7), ctx.fill();
          }
        },
      }[L.need];
      list.push({ y: p[1], draw });
    }
  };
}
ACHIEVEMENTS.push(
  ["explorador", "Explorador", "Descubra 8 lugares escondidos.", "flag", () => lmCount()[0] >= 8],
  ["cartografo", "Cartógrafo de Aurélia", "Descubra todos os 15 lugares escondidos.", "flag", () => lmCount()[0] >= LANDMARKS.length],
);
