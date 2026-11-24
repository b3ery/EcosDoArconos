/**
 * ECOS DO ARCANO — sons-do-ambiente.js
 * Sons do lugar, gerados na hora (sem arquivos de áudio), com volume pela
 * distância de onde vêm:
 *  - ONDAS do mar quebrando na praia (sobem e descem, mais fortes na
 *    tempestade);
 *  - RIO correndo (chiado suave da água; mais forte com chuva);
 *  - VENTO e CHUVA quando o tempo fecha;
 *  - SINOS do castelo a cada hora cheia (até 4 badaladas);
 *  - RISADAS e gritinhos das crianças perto do parquinho (de dia);
 *  - passarinhos de manhã, grilos à noite.
 * Tudo respeita o volume de Efeitos das Opções. Fica mudo em telas de
 * menu, batalha e dentro das casas.
 */

"use strict";

(() => {
  let A = null,
    master = null,
    nodes = null;
  const vol = () => (typeof settings !== "undefined" ? settings.sfx ?? 0.7 : 0.7);
  function init() {
    if (A) return true;
    try {
      A = typeof audioCtx !== "undefined" && audioCtx ? audioCtx : new (window.AudioContext || window.webkitAudioContext)();
      if (typeof audioCtx !== "undefined" && !audioCtx) audioCtx = A;
    } catch (e) {
      return false;
    }
    master = A.createGain();
    master.gain.value = 0;
    master.connect(A.destination);
    // ruído (base de ondas, rio, vento e chuva)
    const buf = A.createBuffer(1, A.sampleRate * 2, A.sampleRate);
    const d = buf.getChannelData(0);
    let b = 0;
    for (let i = 0; i < d.length; i++) {
      const w = Math.random() * 2 - 1;
      b = 0.97 * b + 0.03 * w; // ruído "marrom" (mais grave)
      d[i] = w * 0.35 + b * 3;
    }
    const mk = (type, freq, q) => {
      const src = A.createBufferSource();
      src.buffer = buf;
      src.loop = true;
      src.playbackRate.value = 0.8 + Math.random() * 0.4;
      const f = A.createBiquadFilter();
      f.type = type;
      f.frequency.value = freq;
      f.Q.value = q;
      const g = A.createGain();
      g.gain.value = 0;
      src.connect(f).connect(g).connect(master);
      src.start();
      return g;
    };
    nodes = {
      mar: mk("lowpass", 520, 0.7),
      rio: mk("bandpass", 1500, 0.6),
      vento: mk("bandpass", 380, 1.4),
      chuva: mk("highpass", 3500, 0.3),
    };
    return true;
  }
  addEventListener("pointerdown", () => init(), { once: true, capture: true });
  addEventListener("keydown", () => init(), { once: true, capture: true });

  // distância (em blocos) até o tile mais perto de um tipo
  function nearest(test, R) {
    const z = player.zone,
      px = Math.round(player.x),
      py = Math.round(player.y);
    let best = 99;
    for (let dy = -R; dy <= R; dy++)
      for (let dx = -R; dx <= R; dx++) {
        const d = Math.abs(dx) + Math.abs(dy);
        if (d >= best) continue;
        if (test(z, px + dx, py + dy)) best = d;
      }
    return best;
  }
  const isLake = (z, x, y) => ((window.LAKES || {})[z] || []).some((R) => x >= R.x0 - 1 && x <= R.x1 + 1 && y >= R.y0 - 1 && y <= R.y1 + 1);
  const seaT = (z, x, y) => tileAt(z, x, y) === "~" && ZONES[z].theme === "porto" && !isLake(z, x, y);
  const riverT = (z, x, y) => tileAt(z, x, y) === "~" && !(ZONES[z].theme === "porto" && !isLake(z, x, y)) && !(typeof isFrozen === "function" && isFrozen(z, x, y));
  const near = (d, R) => Math.max(0, 1 - d / R);

  // sons curtos (sinos, risadas, passarinhos, grilos)
  function tone(f, dur, type, v, when = 0, glide) {
    if (!A) return;
    const o = A.createOscillator(),
      g = A.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f, A.currentTime + when);
    if (glide) o.frequency.exponentialRampToValueAtTime(glide, A.currentTime + when + dur);
    g.gain.setValueAtTime(0, A.currentTime + when);
    g.gain.linearRampToValueAtTime(v * vol(), A.currentTime + when + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, A.currentTime + when + dur);
    o.connect(g).connect(A.destination);
    o.start(A.currentTime + when);
    o.stop(A.currentTime + when + dur + 0.05);
  }
  function bell(n, v) {
    for (let i = 0; i < n; i++) {
      tone(392, 2.2, "sine", v, i * 1.1);
      tone(784, 1.4, "sine", v * 0.4, i * 1.1);
      tone(1176, 0.9, "sine", v * 0.2, i * 1.1);
    }
  }
  function laugh(v) {
    const base = 600 + Math.random() * 300;
    for (let i = 0; i < 4; i++) tone(base + (i % 2) * 120, 0.09, "triangle", v, i * 0.12, base * 0.8);
  }
  function chirp(v) {
    const f = 2800 + Math.random() * 1200;
    tone(f, 0.08, "sine", v, 0, f * 1.3);
    tone(f * 1.1, 0.07, "sine", v, 0.12, f * 0.9);
  }
  function cricket(v) {
    for (let i = 0; i < 3; i++) tone(4200, 0.04, "square", v * 0.5, i * 0.07);
  }

  let lastHour = -1,
    tChirp = 0,
    tLaugh = 0;
  setInterval(() => {
    if (!A || !nodes || !player || !player.name) return;
    const Z = ZONES[player.zone];
    const outside = Z && Z.theme !== "interior" && player.zone !== "casa" && !(Z.town && Z.town.indoor) && ["world", "map", "choice", "cal"].includes(game.mode);
    const target = outside ? 0.9 * vol() : 0;
    master.gain.setTargetAtTime(target, A.currentTime, 0.4);
    if (!outside) return;
    const w = player.weather || "sol",
      storm = w === "tempestade",
      rain = w === "chuva" || storm;
    const tm = performance.now() / 1000;
    const set = (g, v) => g.gain.setTargetAtTime(v, A.currentTime, 0.3);
    // ondas: sobem e descem como o vai e vem da praia
    const dSea = nearest(seaT, 12);
    const swell = 0.55 + 0.45 * Math.sin(tm * 0.9) * Math.sin(tm * 0.37 + 1);
    set(nodes.mar, near(dSea, 12) * (storm ? 0.75 : 0.42) * swell);
    // rio
    const dRiv = nearest(riverT, 8);
    set(nodes.rio, near(dRiv, 8) * (rain ? 0.22 : 0.12));
    // vento e chuva
    set(nodes.vento, storm ? 0.32 + 0.15 * Math.sin(tm * 0.5) : rain ? 0.12 : Z.theme === "picos" ? 0.15 : 0.03);
    set(nodes.chuva, storm ? 0.25 : rain ? 0.16 : 0);
    // sinos do castelo na hora cheia (perto do castelo, mais alto)
    const h = Math.floor(player.clock / 60);
    if (h !== lastHour) {
      if (lastHour >= 0 && Z.town && Z.town.bld) {
        const c = Z.town.bld.find((b) => /^(castle|palacio|fortaleza|templo)$/.test(b.style));
        if (c) {
          const d = Math.hypot(player.x - (c.x + c.w / 2), player.y - (c.y + c.h));
          const v = Math.max(0.015, 0.09 * (1 - d / 120));
          bell(Math.min(4, ((h + 11) % 12) + 1), v); // até 4 badaladas (para não cansar)
        }
      }
      lastHour = h;
    }
    const hr = player.clock / 60;
    // crianças no parquinho (de dia, sem chuva)
    tLaugh -= 0.25;
    if (tLaugh <= 0 && !rain && hr >= 7 && hr < 18 && window.PARKS && PARKS[player.zone]) {
      let dk = 99;
      for (const [k, v] of PARKS[player.zone]) {
        if (v === "-" || v === "estatua" || v === "banco" || v === "coreto") continue;
        const [x, y] = k.split(",").map(Number);
        dk = Math.min(dk, Math.abs(x - player.x) + Math.abs(y - player.y));
      }
      if (dk < 18) laugh(0.05 * near(dk, 18));
      tLaugh = 2 + Math.random() * 4;
    }
    // passarinhos de manhã, grilos à noite
    tChirp -= 0.25;
    if (tChirp <= 0 && !rain) {
      if (hr >= 5.5 && hr < 10) chirp(0.02);
      else if (hr >= 20 || hr < 4.5) cricket(0.015);
      tChirp = 1.5 + Math.random() * 3;
    }
  }, 250);
})();
