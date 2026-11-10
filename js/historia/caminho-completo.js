/**
 * ECOS DO ARCANO — caminho-completo.js (modo História)
 * Para zerar, agora é preciso fazer tudo: as missões sem luta, os
 * quebra-cabeças, a exploração e a gente da estrada viram etapas da história,
 * espalhadas pelos capítulos. A seta dourada guia cada uma.
 *  - Cada Guardião está preso por um selo, e o quebra-cabeça da região é a chave:
 *    Ent ← Cofre de Vesper, Serpente ← Selo das Runas, Grifo ← Balança dos Anões,
 *    Leviatã ← Canais do Porto.
 *  - A sala do Silenciador só abre quando todo o resto estiver feito.
 * Modifica (envolve) funções de outros arquivos: interactAt, journeyHTML.
 */

"use strict";

const npcStep = (id) => {
  const p = npcPos(id);
  return [p[0], p[1] + 1];
};
const calmDone = (id) => !!(cq(id) && cq(id).st === "feito");
const zoneEntry = (z) => {
  const Z = ZONES[z];
  return (Z.town && Z.town.arrive) || (Z.spawn && Z.spawn[0]) || [Math.floor(Z.w / 2), Math.floor(Z.h / 2)];
};

/** Onde está a próxima coisa a fazer em cada missão sem luta. */
function calmTarget(id) {
  const Q = cq(id);
  switch (id) {
    case "tortas": {
      if (!Q || Q.clues.length >= 3) return ["vila", npcStep("cocada")];
      const next = ["peixeiro", "lucio", "brinqueiro"].find((s) => !Q.clues.includes(s));
      return ["vila", npcStep(next)];
    }
    case "carta": {
      if (Q && Q.got.length < 3) {
        const s = letterSpots().find((p, i) => p && !Q.got.includes(i));
        if (s) return ["vila", s];
      }
      return ["vila", npcStep("flor")];
    }
    case "ervas": {
      if (Q && Q.got.length < HERBS.length) {
        const i = HERBS.findIndex((h, k) => !Q.got.includes(k));
        return [HERBS[i].z, spotOf(HERBS[i].z, "erva") || zoneEntry(HERBS[i].z)];
      }
      return ["vila", npcStep("curandeira")];
    }
    case "entregas": {
      if (Q && !Q.failed && Q.st === "ativo") {
        const next = DELIVERY_TO.find((d) => !Q.done.includes(d));
        if (next) return ["vila", npcStep(next)];
      }
      return ["vila", npcStep("rosa")];
    }
    case "lia":
      return ["vila", npcStep(Q ? "bardo" : "lia")];
    case "bardo":
      return ["vila", npcStep("bardo")];
    case "enigmas":
      return ["vila", npcStep("iara")];
  }
  return ["vila", npcStep("odelia")];
}
function calmStep(id, t, d) {
  return {
    id: "m-" + id,
    t,
    get zone() {
      return calmTarget(id)[0];
    },
    pos: () => calmTarget(id)[1],
    get d() {
      const Q = cq(id),
        C = CALM_QUESTS.find((q) => q.id === id);
      return d + (Q && Q.st !== "feito" ? ` Agora: ${C.hint(Q)}` : "");
    },
    done: () => calmDone(id),
  };
}
function puzzleStep(P, t, d) {
  return { id: "q-" + P.id, t, zone: P.zone, pos: () => pzSpot(P) || zoneEntry(P.zone), d, done: () => pzSolved(P.id) };
}
const LM_NEEDED = 12,
  ENC_NEEDED = 5;
function nextLandmark() {
  return LANDMARKS.find((L) => !lmFound()[L.id] && (!L.need || player.runes.includes(L.need))) || LANDMARKS.find((L) => !lmFound()[L.id]);
}
function nextEncounterZone() {
  const left = ENCOUNTERS.filter((e) => !(e.id in enc()));
  for (const z of ["bosque", "pantano", "picos", "porto", "serra"]) if (left.some((e) => e.zones.includes(z))) return z;
  return "bosque";
}

/* ===================== ETAPAS NOVAS ===================== */
const NEW_STEPS = {
  // antes do Ent
  ent: [puzzleStep(PZ_CODE, "Abra o Cofre de Vesper no Bosque", "O Ent está preso por um selo antigo. A chave está num cofre de runas, num pedestal do Bosque Murmurante.")],
  // antes do Porto (depois de contar à Odelia)
  porto1: [
    calmStep("tortas", "Descubra quem roubou as tortas da Dona Cocada", "A vila está abalada e a Dona Cocada precisa de alguém de cabeça fria."),
    calmStep("carta", "Encontre a carta rasgada da Dona Flor", "O vento espalhou a carta mais preciosa da Dona Flor pela vila."),
    puzzleStep(PZ_MOSAIC, "Monte o Mosaico de Vesper na vila", "Um mosaico antigo da vila esconde uma lembrança dos irmãos."),
  ],
  // antes da Serpente
  serp: [puzzleStep(PZ_LIGHTS, "Acenda o Selo das Runas no Pântano", "A Serpente dorme atrás de um selo de dezesseis runas, num pedestal do Pântano das Brumas.")],
  // antes de ir a Pedravale (depois de contar à Odelia)
  serra1: [
    calmStep("bardo", "Ajude o Bardo Lírio a lembrar a canção", "O Silêncio comeu metade das canções da vila."),
    calmStep("enigmas", "Resolva os Enigmas da Biblioteca", "A Bibliotecária Iara guarda os segredos da Academia atrás de charadas."),
  ],
  // antes do Grifo
  grif: [puzzleStep(PZ_SCALE, "Equilibre a Balança dos Anões em Pedravale", "O caminho do Grifo está selado pelos anões. Só abre para quem equilibrar a balança deles.")],
  // antes de contar das quatro runas
  r4: [calmStep("ervas", "Colete as ervas raras para a Curandeira Maíra", "Os feridos do Silêncio precisam de remédio: uma erva no Bosque, uma no Pântano e uma nos Picos.")],
  // antes do Leviatã
  levi: [puzzleStep(PZ_PIPES, "Conserte os Canais do Porto", "O Leviatã dorme no cais, preso pelos canais secos. Faça a água voltar a correr.")],
  // antes da Torre
  sile: [
    calmStep("entregas", "Faça as entregas da Rosa antes do pão esfriar", "Cinzaluz precisa ficar de pé até o fim."),
    calmStep("lia", "Ajude a Lia a falar com o Bardo", "Antes da última luta, a vila merece um pouco de coragem e amor."),
    {
      id: "x-lugares",
      get t() {
        return `Explore o mundo: descubra ${LM_NEEDED} lugares escondidos (${lmCount()[0]}/${LM_NEEDED})`;
      },
      get zone() {
        const L = nextLandmark();
        return L ? L.z : "bosque";
      },
      pos: () => {
        const L = nextLandmark();
        return (L && lmSpot(L)) || zoneEntry("bosque");
      },
      get d() {
        const L = nextLandmark();
        return `Os lugares escondidos guardam o que sobrou da história dos irmãos. Alguns estão atrás de vinhas, pedras, água funda ou névoa: use a runa certa.${L ? ` Próximo: algo em ${ZONES[L.z].nome}.` : ""}`;
      },
      done: () => lmCount()[0] >= LM_NEEDED,
    },
    {
      id: "x-estrada",
      get t() {
        return `Ajude quem cruzar o seu caminho (${Object.keys(enc()).length}/${ENC_NEEDED} encontros)`;
      },
      get zone() {
        return nextEncounterZone();
      },
      pos: () => zoneEntry(nextEncounterZone()),
      get d() {
        return `Viaje pelas regiões e fique atento à gente da estrada. Ainda há alguém esperando em ${ZONES[nextEncounterZone()].nome}.`;
      },
      done: () => Object.keys(enc()).length >= ENC_NEEDED,
    },
  ],
};
for (const [before, list] of Object.entries(NEW_STEPS)) {
  const i = STEPS.findIndex((s) => s.id === before);
  if (i >= 0) STEPS.splice(i, 0, ...list);
}

/* ===================== SELOS DOS GUARDIÕES ===================== */
const GUARD_SEAL = { ent: "cofre", serpente: "selo", grifo: "balanca", leviata: "canos" };
function sealMessage(z) {
  const g = z.guard;
  if (g === "silenciador") {
    const s = STEPS.find((q) => q.id !== "sile" && !q.done());
    return s ? `Uma porta de silêncio fecha a última sala. Ela não vai abrir enquanto o mundo lá fora precisar de você. Ainda falta: ${s.t}.` : null;
  }
  const pid = GUARD_SEAL[g];
  if (!pid || pzSolved(pid)) return null;
  const P = PUZZLES.find((q) => q.id === pid);
  return `Um selo de runas prende o Guardião. A chave é o ${P.n}, num pedestal em ${P.where}.`;
}
{
  const iaBase = interactAt;
  interactAt = function (x, y) {
    if (story()) {
      const z = ZONES[player.zone];
      if (z && z.guard && tileAt(player.zone, x, y) === "G" && !player.guards.includes(player.zone)) {
        const m = sealMessage(z);
        if (m) return say([["", m]]);
      }
    }
    return iaBase(x, y);
  };
  // A gente da estrada aparece com mais certeza quando é etapa da história.
  let acc = 0;
  const updBase = update;
  update = function (dt) {
    updBase(dt);
    if (!story() || game.mode !== "world") return;
    acc += dt;
    if (acc < 15) return;
    acc = 0;
    if (curStep().id === "x-estrada" && game.encWait >= 999 && ENCOUNTERS.some((e) => e.zones.includes(player.zone) && !(e.id in enc()))) {
      player.encLast = -999;
      game.encWait = 1;
    }
  };
  const jhBase = journeyHTML;
  journeyHTML = function () {
    let h = jhBase();
    const [f, t] = lmCount();
    h += `<h3>Lugares escondidos (${f}/${t})</h3>`;
    for (const z of LM_REGIONS) {
      h += `<div class="jr-row">${iconHTML("flag", 18)}<div><b>${ZONES[z].nome} (${lmCount(z)[0]}/3)</b><small>${LANDMARKS.filter((L) => L.z === z)
        .map((L) => (lmFound()[L.id] ? `✓ ${L.n}` : L.need ? `??? (atrás de ${OBSTACLE[L.need].n.toLowerCase()})` : "???"))
        .join(" · ")}</small></div></div>`;
    }
    return h;
  };
}
