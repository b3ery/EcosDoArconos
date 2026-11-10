/**
 * ECOS DO ARCANO — lamento.js
 * "Lamento de Cinzaluz": o tema triste do jogo.
 *
 * Tom: Sol# maior (G# A# B# C# D# E# F##). A música começa e mora no grau vi,
 * Mi# menor, que soa igual a Fá menor. Ela passeia pela parte triste desse
 * campo harmônico:
 *   vi  = Mi#m (Fá m)     ii = Lá#m (Si♭ m)    iii = Si#m (Dó m)
 *   IV  = Dó# (Ré♭)       vii° = Fá## dim (Sol dim)
 * Parte A:  vi | ii | iii | vi | IV | ii | vii° | iii
 * Parte B:  ii | iii | IV | iii | ii | vii° | iii | vi (termina em Fá menor)
 * As notas estão escritas pelo som (Fá = Mi#, Dó = Si#, Sol = Fá##...).
 *
 * Toca nas cenas tristes (sonhos, lembranças, cartões de capítulo, a Torre,
 * a máscara caindo) e na vila no comecinho da história, quando ainda não há
 * canção nenhuma. O tocador ganhou acordes de fundo e um eco suave na melodia.
 * Modifica (envolve) funções de outros arquivos: chapterCard, desiredTrack,
 * flashbackScene, scheduleMusic.
 */

"use strict";

const CH = {
  vi: { bass: [41, 48], pad: [65, 68, 72] }, // Fá m  (Mi# Sol# Si#)
  ii: { bass: [46, 53], pad: [65, 70, 73] }, // Si♭ m (Lá# Dó# Mi#)
  iii: { bass: [48, 55], pad: [67, 72, 75] }, // Dó m (Si# Ré# Fá##)
  IV: { bass: [49, 56], pad: [65, 68, 73] }, // Ré♭  (Dó# Mi# Sol#)
  vii: { bass: [43, 49], pad: [67, 70, 73] }, // Sol dim (Fá## Lá# Dó#)
};
const LAMENTO_FORM = ["vi", "ii", "iii", "vi", "IV", "ii", "vii", "iii", "ii", "iii", "IV", "iii", "ii", "vii", "iii", "vi"];
// 16 compassos de 8 colcheias. 0 = pausa.
const LAMENTO_MELODY = [
  // A
  72, 0, 77, 0, 75, 73, 72, 0,
  73, 0, 70, 0, 72, 73, 70, 0,
  67, 0, 72, 0, 75, 0, 72, 70,
  68, 0, 0, 0, 65, 0, 0, 0,
  77, 0, 80, 0, 77, 75, 73, 0,
  73, 0, 77, 0, 73, 72, 70, 0,
  73, 0, 70, 0, 67, 0, 70, 0,
  72, 0, 0, 0, 67, 0, 0, 0,
  // B
  77, 0, 0, 73, 82, 0, 80, 77,
  79, 0, 75, 0, 72, 0, 75, 79,
  80, 0, 77, 0, 73, 0, 77, 80,
  79, 0, 0, 0, 75, 0, 72, 0,
  77, 0, 73, 0, 70, 0, 73, 77,
  79, 0, 0, 0, 73, 0, 70, 0,
  72, 0, 75, 0, 79, 0, 0, 0,
  77, 0, 0, 0, 0, 0, 0, 0,
];
TRACKS.lamento = {
  bpm: 64,
  lead: "triangle",
  melody: LAMENTO_MELODY,
  bass: LAMENTO_FORM.flatMap((c) => [CH[c].bass[0], 0, 0, 0, CH[c].bass[1], 0, 0, 0]),
  chords: LAMENTO_FORM.map((c) => CH[c].pad),
  echo: true,
};

/* ----- Tocador com acordes de fundo e eco ----- */
function playPad(freq, time, length, volume) {
  const osc = audioCtx.createOscillator(),
    env = audioCtx.createGain();
  osc.type = "sine";
  osc.frequency.value = freq;
  env.gain.setValueAtTime(0.0001, time);
  env.gain.linearRampToValueAtTime(volume, time + Math.min(0.6, length * 0.25));
  env.gain.linearRampToValueAtTime(volume * 0.7, time + length * 0.7);
  env.gain.linearRampToValueAtTime(0.0001, time + length);
  osc.connect(env);
  env.connect(music.gain);
  osc.start(time);
  osc.stop(time + length + 0.05);
}
scheduleMusic = function () {
  const track = TRACKS[music.track];
  if (!track || !audioCtx || settings.music <= 0) return;
  const stepLen = 60 / track.bpm / 2;
  if (music.nextTime < audioCtx.currentTime) music.nextTime = audioCtx.currentTime + 0.05;
  while (music.nextTime < audioCtx.currentTime + 0.25) {
    const st = music.step;
    const melodyNote = track.melody[st % track.melody.length];
    const bassNote = track.bass[st % track.bass.length];
    if (melodyNote) {
      playNote(midiToFreq(melodyNote), music.nextTime, stepLen * (track.chords ? 1.6 : 0.9), track.lead, 0.5);
      if (track.echo) playNote(midiToFreq(melodyNote), music.nextTime + stepLen * 1.5, stepLen * 1.4, "sine", 0.16);
    }
    if (bassNote) playNote(midiToFreq(bassNote), music.nextTime, stepLen * (track.chords ? 3.6 : 1.6), "triangle", 0.7);
    if (track.chords && st % 8 === 0) {
      const ch = track.chords[Math.floor(st / 8) % track.chords.length];
      for (const n of ch) playPad(midiToFreq(n), music.nextTime, stepLen * 8, 0.09);
    }
    music.step++;
    music.nextTime += stepLen;
  }
};

/* ----- Onde o lamento toca ----- */
for (const f of ["dreamScene", "maskScene", "towerScene"]) if (typeof window[f] === "function") window[f].sad = true;
{
  if (typeof chapterCard === "function") {
    const ccBase = chapterCard;
    chapterCard = function () {
      const f = ccBase.apply(this, arguments);
      f.sad = true;
      return f;
    };
  }
  if (typeof flashbackScene === "function") {
    const fbBase = flashbackScene;
    flashbackScene = function () {
      const f = fbBase.apply(this, arguments);
      if (typeof f === "function") f.sad = true;
      return f;
    };
  }
  const dtBase = desiredTrack;
  desiredTrack = function () {
    if (game.cine && game.cine.draw && game.cine.draw.sad) return "lamento";
    const t = dtBase();
    return t === "silencio" ? "vila" : t; // a vila usa a música tema
  };
}

/* ===================== MÚSICA À PROVA DE FALHAS =====================
 * Antes a música só era ajustada no fim de cada quadro do jogo: se algo
 * antes disso desse erro logo depois de uma troca de faixa (quando o volume
 * é abaixado para trocar), o som ficava mudo. Agora ela tem relógio próprio,
 * e o áudio "acordado" de novo no próximo toque, tecla ou ao voltar para a aba. */
const TRACK_NAMES = { titulo: "Tela inicial", vila: "Cinzaluz de dia", noite: "Cinzaluz à noite", aventura: "Aventura", batalha: "Batalha", chefe: "Chefe", final: "Luta final", festival: "Festival", taverna: "Taverna", floresta: "Floresta", pantano: "Pântano", porto: "Porto", serra: "Serra", mina: "Mina", torre: "Torre", casa: "Casa", lamento: "Lamento de Cinzaluz", velorio: "Velório", casamento: "Casamento", golpe: "Golpe", eleicao: "Eleição" };
{
  const dtBase = desiredTrack;
  desiredTrack = function () {
    if (game.previewTrack && TRACKS[game.previewTrack]) return game.previewTrack;
    try {
      return dtBase();
    } catch (e) {
      return music.track || "vila";
    }
  };
  setInterval(() => {
    try {
      updateMusic();
      // Se o volume ficou preso lá embaixo depois de uma troca, volta ao normal.
      if (music.gain && audioCtx && settings.music > 0 && music.gain.gain.value < musicVolume() * 0.2 && music.track === desiredTrack())
        music.gain.gain.setTargetAtTime(musicVolume(), audioCtx.currentTime, 0.2);
    } catch (e) {}
  }, 500);
  const wake = () => {
    try {
      if (audioCtx && audioCtx.state !== "running") audioCtx.resume();
      if (audioCtx && !music.timer) ensureMusic();
    } catch (e) {}
  };
  for (const ev of ["pointerdown", "keydown", "touchend"]) addEventListener(ev, wake, { passive: true });
  document.addEventListener("visibilitychange", () => !document.hidden && wake());

  // Opções → Ouvir músicas
  const roBase = renderOptions;
  renderOptions = function () {
    roBase();
    const box = byId("options");
    if (!box || byId("optJuke")) return;
    const div = document.createElement("div");
    div.id = "optJuke";
    div.innerHTML = `<h3>Ouvir músicas</h3><div class="juke">${Object.keys(TRACKS)
      .filter((k) => k !== "silencio")
      .map((k) => `<button data-tk="${k}" class="${game.previewTrack === k ? "on" : ""}">${k === "lamento" ? "♪ " : ""}${TRACK_NAMES[k] || k}</button>`)
      .join("")}<button data-tk="">■ Parar</button></div><small>A música escolhida toca enquanto as Opções estiverem abertas.</small>`;
    (box.querySelector(".opt-body, .ov-body") || box).appendChild(div);
    div.querySelectorAll("[data-tk]").forEach(
      (b) =>
        (b.onclick = () => {
          ensureMusic();
          if (settings.music <= 0) toast("A música está no zero: aumente o volume acima.", 2600);
          game.previewTrack = b.dataset.tk || null;
          div.querySelectorAll("[data-tk]").forEach((x) => x.classList.toggle("on", x === b && !!b.dataset.tk));
          updateMusic();
        }),
    );
    if (!byId("jukeCSS")) {
      const st = document.createElement("style");
      st.id = "jukeCSS";
      st.textContent = `#optJuke .juke{display:flex;flex-wrap:wrap;gap:6px;margin:6px 0} #optJuke button.on{outline:2px solid var(--gold,#ffd34d)} #optJuke small{opacity:.75}`;
      document.head.appendChild(st);
    }
  };
  const coBase = closeOptions;
  closeOptions = function () {
    game.previewTrack = null;
    return coBase.apply(this, arguments);
  };
}
