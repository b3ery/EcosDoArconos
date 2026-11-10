/**
 * ECOS DO ARCANO — dublagem.js
 * Dublagem do Narrador e músicas personalizadas.
 *
 * VOZ: grave cada fala do roteiro num arquivo com o código dela e coloque em
 *   audio/voz/CODIGO.mp3   (ex.: audio/voz/AB-01.mp3)
 * Quando a fala aparecer na tela, o jogo toca o áudio sozinho. Fala sem áudio
 * continua só escrita, então dá para dublar aos poucos.
 *
 * MÚSICA: coloque um MP3 com o nome da faixa em
 *   audio/musica/NOME.mp3   (ex.: audio/musica/lamento.mp3, audio/musica/vila.mp3)
 * Se o arquivo existir, ele toca no lugar da música feita pelo jogo.
 *
 * O roteiro é montado aqui (VOICE_SCRIPT), lendo as listas do próprio jogo,
 * para o texto da tela e o do roteiro nunca ficarem diferentes.
 * Modifica (envolve) funções de outros arquivos: chapterCard, flashbackScene,
 * guardianScene, musicVolume, playCine, renderDialogLine, renderOptions, renderStory.
 */

"use strict";

/* ===================== O ROTEIRO ===================== */
const VOICE_SECTIONS = {
  AB: { n: "Abertura", quando: "Tela de abertura do Modo História, uma página por vez.", dir: "Voz grave e calma, como quem conta uma lenda antiga. Pausas longas entre as frases. A última página é a virada: mais esperança." },
  CAP: { n: "Cartões de capítulo", quando: "Tela preta com o título, no começo de cada capítulo.", dir: "Solene e devagar. Diga o número do capítulo, respire, diga o título com peso e a frase final quase sussurrada." },
  TOR: { n: "A Torre do Silêncio", quando: "Chegada à Torre e a lembrança que aparece na porta.", dir: "Grave e misterioso. Medo contido." },
  GUA: { n: "Guardiões libertados", quando: "Cena da runa voltando, logo depois de vencer cada Guardião.", dir: "Sussurrado e nostálgico, como um eco antigo. As duas frases no mesmo áudio." },
  LEM: { n: "Lembranças dos irmãos", quando: "Lembranças em tom sépia ao achar páginas do diário de Vesper.", dir: "Voz de memória: suave, um pouco mais lenta, com carinho. As falas entre aspas podem ganhar um toque de voz de criança." },
  NYX: { n: "Nyx, a Caçadora de Runas", quando: "Encontros com a Nyx (Bosque, Pântano, Picos e Torre) e o destino dela no final.", dir: "Tenso e visual, como quem descreve uma cena de filme. Nas três últimas (epílogo), tom de conto." },
  CER: { n: "O Silêncio ataca Cinzaluz", quando: "Invasões à vila.", dir: "Urgente, ritmo mais rápido, quase sem ar." },
  EST: { n: "Gente pelo caminho e pedidos", quando: "Encontros na estrada e missões sem luta.", dir: "Narrador próximo, de conversa. Leve nas cenas alegres, seco nas cenas cruéis." },
  SON: { n: "Sonhos com Vesper", quando: "Ao dormir, quando Vesper aparece em sonho.", dir: "Bem baixo, flutuante, como se estivesse longe." },
  LUG: { n: "Lugares escondidos", quando: "Ao descobrir cada lugar escondido nas regiões.", dir: "Curioso e intimista, como quem encontra algo precioso." },
  QC: { n: "Quebra-cabeças resolvidos", quando: "Ao resolver cada quebra-cabeça dos pedestais.", dir: "Pequena vitória, depois um tom delicado na revelação." },
  SEG: { n: "Segredos", quando: "Ao achar um dos 12 segredos brilhando no mapa.", dir: "Tom de lenda contada ao pé do fogo." },
  FIM: { n: "Final", quando: "Depois de vencer o Silenciador.", dir: "Emocionado, crescendo até a última frase. É o momento mais importante do jogo." },
  EPI: { n: "Epílogo", quando: "O reencontro de Odelia e Vesper, antes dos créditos.", dir: "Doce, com um sorriso na voz. A última frase devagar." },
  VIL: { n: "Caminho do vilão", quando: "Escolhas sombrias e finais de vilão.", dir: "Frio e sombrio. Sem pressa." },
};
const two = (n) => String(n).padStart(2, "0");
const narrLines = (arr) => arr.filter((l) => !l[0] || l[0] === "Narrador").map((l) => l[1]);
function buildVoiceScript() {
  const S = [];
  const add = (sec, id, text, opt = {}) => S.push({ id: `${sec}-${id}`, sec, text, match: opt.cue ? null : opt.match || text, cue: opt.cue || null, nota: opt.nota || "" });
  STORY.forEach((t, i) => add("AB", two(i + 1), t, { nota: `Página ${i + 1} de ${STORY.length}` }));
  if (typeof CHAPTER_CARDS !== "undefined")
    Object.values(CHAPTER_CARDS).forEach(([k, t, sub], i) => add("CAP", two(i + 1), `${k}. ${t}. ${sub}`, { cue: "cap:" + t }));
  add("TOR", "01", "A Torre do Silêncio. Aqui, há trezentos anos, um irmão deixou de ouvir a irmã.", { cue: "torre", nota: "Cena da chegada à Torre" });
  narrLines(FLASH).forEach((t, i) => add("TOR", two(i + 2), t));
  if (typeof GUARD_ECHO !== "undefined") Object.entries(GUARD_ECHO).forEach(([g, l]) => add("GUA", g.toUpperCase(), l.join(" "), { cue: "guard:" + g, nota: (ENEMIES[g] || {}).nome || g }));
  if (typeof FLASHBACKS !== "undefined") FLASHBACKS.forEach((F, i) => add("LEM", two(i + 1), `${F.t}. ${F.lines.join(" ")}`, { cue: "fb:" + F.t, nota: `Lembrança ${i + 1}: ${F.t}` }));
  const loose = typeof VOICE_LOOSE !== "undefined" ? VOICE_LOOSE : {};
  for (const sec of ["NYX", "CER", "EST", "SON"]) (loose[sec] || []).forEach((t, i) => add(sec, two(i + 1), t));
  add("SON", two((loose.SON || []).length + 1), "Você sonha...", { cue: "sonho", nota: "Tela do sonho, antes das falas de Vesper" });
  if (typeof LANDMARKS !== "undefined") LANDMARKS.forEach((L) => add("LUG", L.id.toUpperCase(), L.lore, { nota: `${L.n} (${(ZONES[L.z] || {}).nome || L.z})` }));
  if (typeof PUZZLES !== "undefined") PUZZLES.forEach((P) => add("QC", P.id.toUpperCase(), P.win, { nota: P.n }));
  if (typeof SECRET_LORE !== "undefined") SECRET_LORE.forEach((t, i) => add("SEG", two(i + 1), t));
  narrLines(FINALE).forEach((t, i) => add("FIM", two(i + 1), t));
  add("EPI", "00", "Trezentos anos depois... A Canção Arcana voltou.", { cue: "reencontro", nota: "Cena do reencontro (tela desenhada)" });
  narrLines(EPILOGUE).forEach((t, i) => add("EPI", two(i + 1), t));
  (loose.VIL || []).forEach((t, i) => add("VIL", two(i + 1), t));
  return S;
}
let VOICE_SCRIPT = [];
const VOICE_BY_TEXT = new Map(),
  VOICE_BY_CUE = new Map();
const normTxt = (s) => String(s || "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
function indexVoices() {
  VOICE_SCRIPT = buildVoiceScript();
  VOICE_BY_TEXT.clear();
  VOICE_BY_CUE.clear();
  for (const e of VOICE_SCRIPT) {
    if (e.match) VOICE_BY_TEXT.set(normTxt(e.match), e);
    if (e.cue) VOICE_BY_CUE.set(e.cue, e);
  }
}
/** Acha a fala do roteiro para um texto da tela (igual, ou contido nele). */
function voiceForText(text) {
  const t = normTxt(text);
  if (!t) return null;
  if (VOICE_BY_TEXT.has(t)) return VOICE_BY_TEXT.get(t);
  for (const [k, e] of VOICE_BY_TEXT) if (k.length > 30 && t.includes(k)) return e;
  return null;
}

/* ===================== TOCAR A VOZ ===================== */
if (settings.voiceOn === undefined) settings.voiceOn = true;
if (settings.voice === undefined) settings.voice = 1;
const voiceMissing = new Set();
let voiceAudio = null;
function stopVoice() {
  if (voiceAudio) {
    try {
      voiceAudio.pause();
    } catch (e) {}
    voiceAudio = null;
  }
  game.voicePlaying = false;
}
function playVoice(e) {
  if (!e || !settings.voiceOn || voiceMissing.has(e.id)) return;
  stopVoice();
  const a = new Audio(`audio/voz/${e.id}.mp3`);
  a.volume = Math.max(0, Math.min(1, settings.voice));
  a.onerror = () => voiceMissing.add(e.id);
  a.onplaying = () => (game.voicePlaying = true);
  a.onended = () => voiceAudio === a && (game.voicePlaying = false);
  voiceAudio = a;
  a.play().catch(() => {});
}

/* ===================== MÚSICAS PERSONALIZADAS ===================== */
const customMusic = { state: {}, audio: null, track: null };
function probeTrack(t) {
  if (customMusic.state[t]) return;
  customMusic.state[t] = "testando";
  const a = new Audio();
  a.preload = "auto";
  a.loop = true;
  a.oncanplay = () => ((customMusic.state[t] = "ok"), (customMusic[t] = a));
  a.onerror = () => (customMusic.state[t] = "falta");
  a.src = `audio/musica/${t}.mp3`;
}
function customMusicTick() {
  const t = music.track;
  if (!t) return;
  probeTrack(t);
  const want = customMusic.state[t] === "ok" && settings.music > 0 ? t : null;
  if (customMusic.track && customMusic.track !== want) {
    const old = customMusic[customMusic.track];
    if (old) old.pause();
    customMusic.track = null;
  }
  if (want) {
    const a = customMusic[want];
    a.volume = Math.max(0, Math.min(1, settings.music * (game.voicePlaying ? 0.35 : 1)));
    if (customMusic.track !== want) {
      customMusic.track = want;
      a.currentTime = 0;
      a.play().catch(() => (customMusic.track = null));
    }
  }
}

/* ===================== LIGAÇÕES ===================== */
{
  indexVoices();
  // Música feita pelo jogo: some quando há um MP3 tocando, e abaixa quando o Narrador fala.
  const mvBase = musicVolume;
  musicVolume = function () {
    if (customMusic.track) return 0;
    return mvBase() * (game.voicePlaying ? 0.35 : 1);
  };
  setInterval(() => {
    try {
      customMusicTick();
    } catch (e) {}
  }, 400);

  // Falas na caixa de diálogo
  const rdBase = renderDialogLine;
  renderDialogLine = function () {
    const r = rdBase.apply(this, arguments);
    const d = game.dialog;
    if (!d) return r;
    const [who, text] = d.lines[d.i] || [];
    const e = voiceForText(text);
    if (e && (!who || who === "Narrador")) {
      const nb = byId("dwho");
      nb.textContent = "Narrador";
      nb.style.display = "block";
      if (d._voiced !== d.i) {
        d._voiced = d.i;
        playVoice(e);
      }
    } else if (d._voiced !== d.i) stopVoice();
    return r;
  };
  // Páginas da abertura
  const rsBase = renderStory;
  renderStory = function () {
    const r = rsBase.apply(this, arguments);
    playVoice(voiceForText(STORY[storyI]));
    return r;
  };
  byId("sSkip").addEventListener("click", stopVoice);
  // Cenas desenhadas
  const pcBase = playCine;
  playCine = function (draw) {
    const r = pcBase.apply(this, arguments);
    if (draw && draw.cue) playVoice(VOICE_BY_CUE.get(draw.cue));
    return r;
  };
  towerScene.cue = "torre";
  reunionScene.cue = "reencontro";
  if (typeof dreamScene === "function") dreamScene.cue = "sonho";
  const gsBase = guardianScene;
  guardianScene = function (type) {
    const f = gsBase.apply(this, arguments);
    f.cue = "guard:" + type;
    return f;
  };
  const fbBase = flashbackScene;
  flashbackScene = function (F) {
    const f = fbBase.apply(this, arguments);
    if (typeof f === "function") f.cue = "fb:" + F.t;
    return f;
  };
  const ccBase = chapterCard;
  chapterCard = function (k, t) {
    const f = ccBase.apply(this, arguments);
    f.cue = "cap:" + t;
    return f;
  };

  // Opções → Dublagem
  const roBase = renderOptions;
  renderOptions = function () {
    roBase();
    const box = byId("options");
    if (!box || byId("optDub")) return;
    const div = document.createElement("div");
    div.id = "optDub";
    div.innerHTML = `<h3>Dublagem</h3>
      <label><input type="checkbox" id="dubOn" ${settings.voiceOn ? "checked" : ""}> Voz do Narrador</label>
      <label style="margin-left:12px">Volume da voz <input type="range" id="dubVol" min="0" max="1" step="0.05" value="${settings.voice}"></label>
      <div><small>${VOICE_SCRIPT.length} falas no roteiro. Áudios em <b>audio/voz/CÓDIGO.mp3</b>; músicas próprias em <b>audio/musica/NOME.mp3</b>.</small></div>`;
    (box.querySelector(".opt-body, .ov-body") || box).appendChild(div);
    byId("dubOn").onchange = (ev) => ((settings.voiceOn = ev.target.checked), saveSettings(), settings.voiceOn || stopVoice());
    byId("dubVol").oninput = (ev) => ((settings.voice = +ev.target.value), saveSettings(), voiceAudio && (voiceAudio.volume = settings.voice));
  };
}
