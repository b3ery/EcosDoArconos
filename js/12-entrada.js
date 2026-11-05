/**
 * ECOS DO ARCANO — 11-entrada.js
 * Controles (teclado e toque), botões da interface e inicialização do jogo.
 */

/* ===================== ENTRADA ===================== */

function primary() {
  if (game.dialog) {
    advanceDialog();
    return;
  }
  if (game.mode === "world") interact();
}
function toggleGrim() {
  if (game.dialog) return;
  if (game.mode === "map") closeMap();
  if (game.mode === "world") openGrim();
  else if (game.mode === "grimoire") closeGrim();
}
/* ===================== TECLADO ===================== */

const SCROLL_KEYS = new Set(["arrowup", "arrowdown", "arrowleft", "arrowright", " "]);
const CONFIRM_KEYS = new Set(["e", " ", "enter"]);

/** Atalhos do mapa, válidos só andando pelo mundo. */
const WORLD_SHORTCUTS = {
  g: openGrim,
  m: openMap,
  q: openQuests,
  j: openQuests,
  i: openInv,
  c: toggleRide,
  n: () => (game.showMM = !game.showMM),
  z: cycleZoom,
  f: toggleFull,
  o: openOptions,
  escape: openOptions,
  r: () => player.zone === "casa" && openDecor(),
  p: togglePause,
  k: kingdomsMenu,
  t: cycleSpeed,
  h: waitMenu,
};

const BATTLE_SHORTCUTS = {
  enter: playerCast,
  " ": playerCast,
  backspace: () => {
    battle.sel = [];
    renderBattle();
  },
  x: () => {
    battle.sel = [];
    renderBattle();
  },
  d: () => useAction("def"),
  p: () => useItemBattle(itemCount("pocao") ? "pocao" : "pocaoG"),
  t: () => useItemBattle(itemCount("eter") ? "eter" : "eterG"),
  h: () => {
    battle.panel = battle.panel === "skills" ? null : "skills";
    renderBattle();
  },
  i: () => {
    battle.panel = battle.panel === "items" ? null : "items";
    renderBattle();
  },
  f: () => useAction("run"),
};

/** Um tratador por modo de jogo. Recebem a tecla e o evento. */
const KEY_HANDLERS = {
  options: (k) => (k === "escape" || k === "o") && closeOptions(),
  guide: (k) => k === "escape" && closeGuide(),
  credits: (k) => (k === "escape" || k === "enter") && closeCredits(),
  title: (k) => {
    if (k === "o") openOptions();
    if (k === "enter" || k === " ")
      (byId("btnCont").style.display !== "none" ? byId("btnCont") : byId("btnNew")).click();
  },
  end: () => {},
  choose: (k) => {
    const n = parseInt(k);
    if (n >= 1 && n <= 6) pickElement(ORDER[n - 1]);
  },
  choice: (k) => {
    const n = parseInt(k);
    if (n >= 1 && n <= game.choice.length) pickChoice(n - 1);
    else if (k === "escape") pickChoice(game.choice.length - 1);
  },
  inv: (k) => (k === "i" || k === "escape") && closeInv(),
  shop: (k) => k === "escape" && closeShop(),
  story: (k, e) => {
    if (!e.repeat && (k === "enter" || k === " " || k === "e")) storyNext();
    else if (k === "escape") storyEnd();
  },
  map: (k) => (k === "m" || k === "escape") && closeMap(),
  dialog: (k, e) => !e.repeat && CONFIRM_KEYS.has(k) && advanceDialog(),
  grimoire: (k) => (k === "g" || k === "escape") && closeGrim(),
  quests: (k) => (k === "q" || k === "j" || k === "escape") && closeQuests(),
  world: (k, e) => {
    if (game.paused && !["p", "t", "escape", "o", "f"].includes(k)) return;
    pressedKeys[k] = true;
    if (e.repeat) return;
    if (CONFIRM_KEYS.has(k)) interact();
    else if (WORLD_SHORTCUTS[k]) WORLD_SHORTCUTS[k]();
  },
  battle: (k, e) => {
    if (!battle || e.repeat) return;
    if (k >= "1" && k <= "6") {
      const rune = player.runes[+k - 1];
      if (rune) pickRune(rune);
    } else if (BATTLE_SHORTCUTS[k]) BATTLE_SHORTCUTS[k]();
  },
};

/** Modos que têm prioridade sobre um diálogo aberto. */
const BEFORE_DIALOG = new Set([
  "options",
  "guide",
  "credits",
  "title",
  "end",
  "choose",
  "choice",
  "inv",
  "shop",
  "story",
  "map",
]);

addEventListener("keydown", (e) => {
  const typing = e.target && e.target.tagName === "INPUT";
  if (game.mode === "create" || game.mode === "prompt" || typing) return;
  const k = e.key.toLowerCase();
  if (SCROLL_KEYS.has(k) || (k === "enter" && game.mode !== "end")) e.preventDefault();
  const mode = game.dialog && !BEFORE_DIALOG.has(game.mode) ? "dialog" : game.mode;
  const handler = KEY_HANDLERS[mode];
  if (handler) handler(k, e);
});
addEventListener("keyup", (e) => {
  pressedKeys[e.key.toLowerCase()] = false;
});
addEventListener("blur", () => {
  for (const k in pressedKeys) pressedKeys[k] = false;
  game.touch = null;
});
byId("dialog").addEventListener("click", advanceDialog);
document.addEventListener("click", (e) => {
  const b = e.target.closest && e.target.closest("button");
  if (b) b.blur();
  try {
    window.focus();
  } catch (_) {}
});
byId("bCast").onclick = playerCast;
byId("bClear").onclick = () => {
  if (battle) {
    battle.sel = [];
    renderBattle();
  }
};
byId("bDef").onclick = () => useAction("def");
byId("bPot").onclick = () => {
  if (battle && !battle.busy) {
    battle.panel = battle.panel === "items" ? null : "items";
    renderBattle();
  }
};
byId("bEth").onclick = () => {
  if (battle && !battle.busy) {
    battle.panel = battle.panel === "skills" ? null : "skills";
    renderBattle();
  }
};
byId("bRun").onclick = () => useAction("run");
byId("bUlt").onclick = useUltimate;
/* ===================== JOYSTICK (CELULAR) ===================== */

const JOYSTICK = {
  RADIUS: 44,
  DEAD_ZONE: 10,
  WALK_ZONE: 0.6, // abaixo de 60% do raio, anda devagar
  AXIS_BIAS: 1.25, // evita trocar de direção à toa perto da diagonal
};

/**
 * Joystick flutuante: no celular deitado, tocar em qualquer ponto da metade
 * esquerda da tela faz o joystick aparecer ali mesmo.
 */
(function setupJoystick() {
  const joy = byId("joy"),
    knob = byId("knob");
  let pointer = null;
  let center = null;

  const directionFrom = (dx, dy, previous) => {
    const ax = Math.abs(dx),
      ay = Math.abs(dy);
    if (previous === "left" || previous === "right") {
      if (ay > ax * JOYSTICK.AXIS_BIAS) return dy > 0 ? "down" : "up";
      return dx > 0 ? "right" : "left";
    }
    if (previous === "up" || previous === "down") {
      if (ax > ay * JOYSTICK.AXIS_BIAS) return dx > 0 ? "right" : "left";
      return dy > 0 ? "down" : "up";
    }
    return ax > ay ? (dx > 0 ? "right" : "left") : dy > 0 ? "down" : "up";
  };

  const update = (e) => {
    let dx = e.clientX - center.x,
      dy = e.clientY - center.y;
    const dist = Math.hypot(dx, dy);
    if (dist > JOYSTICK.RADIUS) {
      dx = (dx / dist) * JOYSTICK.RADIUS;
      dy = (dy / dist) * JOYSTICK.RADIUS;
    }
    knob.style.transform = `translate(${dx}px,${dy}px)`;
    if (dist < JOYSTICK.DEAD_ZONE) {
      game.touch = null;
      return;
    }
    const dir = directionFrom(dx, dy, game.touch);
    if (dir !== game.touch && settings.vibrate && navigator.vibrate) navigator.vibrate(6);
    game.touch = dir;
    game.touchVec = { dx, dy, strength: Math.min(1, dist / JOYSTICK.RADIUS) };
  };

  const start = (e, floating) => {
    e.preventDefault();
    pointer = e.pointerId;
    if (floating && document.body.classList.contains("mland")) {
      joy.style.left = e.clientX - joy.offsetWidth / 2 + "px";
      joy.style.top = e.clientY - joy.offsetHeight / 2 + "px";
      joy.style.bottom = "auto";
      joy.classList.add("active");
    }
    const r = joy.getBoundingClientRect();
    center = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    try {
      e.target.setPointerCapture(pointer);
    } catch (err) {}
    update(e);
  };

  const end = (e) => {
    if (e.pointerId !== pointer) return;
    pointer = null;
    game.touch = null;
    game.touchVec = null;
    knob.style.transform = "";
    joy.classList.remove("active");
    joy.style.left = joy.style.top = joy.style.bottom = "";
  };

  const zone = document.createElement("div");
  zone.id = "joyzone";
  document.body.appendChild(zone);

  for (const [el, floating] of [
    [joy, false],
    [zone, true],
  ]) {
    el.addEventListener("pointerdown", (e) => start(e, floating));
    el.addEventListener("pointermove", (e) => e.pointerId === pointer && update(e));
    el.addEventListener("pointerup", end);
    el.addEventListener("pointercancel", end);
  }
})();

function backBtn() {
  if (game.dialog) {
    advanceDialog();
    return;
  }
  if (game.mode === "inv") closeInv();
  else if (game.mode === "shop") closeShop();
  else if (game.mode === "quests") closeQuests();
  else if (game.mode === "grimoire") closeGrim();
  else if (game.mode === "map") closeMap();
  else if (game.mode === "choice") pickChoice(game.choice.length - 1);
  else if (game.mode === "battle" && battle) {
    if (battle.panel) {
      battle.panel = null;
      renderBattle();
    } else if (battle.sel.length) {
      battle.sel = [];
      renderBattle();
    }
  }
}
byId("tB").addEventListener("click", backBtn);
byId("fsb").addEventListener("click", toggleFull);
document.addEventListener("fullscreenchange", () => setTimeout(layout, 100));
byId("tZ").addEventListener("click", cycleZoom);
byId("tR").addEventListener("click", () => {
  if (game.mode === "world") openDecor();
});
byId("qpill").addEventListener("click", () => {
  if (game.mode === "world") openQuests();
});
byId("tA").addEventListener("click", primary);
byId("tG").addEventListener("click", toggleGrim);
byId("tQ").addEventListener("click", toggleQuests);
byId("tC").addEventListener("click", () => {
  if (game.mode === "world") toggleRide();
});
byId("tI").addEventListener("click", () => {
  if (game.mode === "inv") closeInv();
  else if (game.mode === "world") openInv();
});
byId("tM").addEventListener("click", () => {
  if (game.mode === "map") closeMap();
  else openMap();
});
game.showMM = !matchMedia("(pointer:coarse)").matches;
function goFull() {
  try {
    const d = document.documentElement;
    if (!document.fullscreenElement && d.requestFullscreen)
      d.requestFullscreen({
        navigationUI: "hide",
      })
        .then(() => {
          try {
            screen.orientation.lock("landscape").catch(() => {});
          } catch (e) {}
        })
        .catch(() => {});
  } catch (e) {}
}
function toggleFull() {
  if (document.fullscreenElement) document.exitFullscreen();
  else goFull();
}
function layout() {
  const coarse = matchMedia("(pointer:coarse)").matches,
    land = innerWidth > innerHeight;
  let vw = 640;
  if (land) vw = Math.max(640, Math.min(1200, Math.round((480 * innerWidth) / innerHeight)));
  document.body.classList.toggle("fillw", land);
  if (vw !== viewWidth || !canvas.dataset.ready) {
    viewWidth = vw;
    canvas.dataset.ready = "1";
    applyQuality();
    initAmbient && ZONES[player.zone] && initAmbient();
  }
  document.body.classList.toggle("mland", coarse && land);
  byId("screen").style.aspectRatio = land ? "auto" : "4 / 3";
}
addEventListener("resize", layout);
addEventListener("orientationchange", () => setTimeout(layout, 200));
function touchUI() {
  const m = game.mode,
    d = !!game.dialog,
    tc = byId("touch");
  const world = (m === "world" || m === "cutscene") && !d;
  const cls =
    (world ? "" : "hj hs ") +
    (m === "world" || m === "cutscene" ? "" : "ha ") +
    (["title", "story", "create", "choose", "end", "battle", "prompt"].includes(m) ? "hb " : "") +
    (m === "battle" ? "hall " : "");
  if (tc.dataset.c !== cls) {
    tc.dataset.c = cls;
    tc.className = cls;
    const zone = byId("joyzone");
    if (zone) zone.style.visibility = world ? "visible" : "hidden";
  }
}
function cycleZoom() {
  const zs = [1, 1.25, 1.5, 1.8, 2.2];
  const i = zs.findIndex((z) => Math.abs(z - game.zoom) < 0.01);
  game.zoom = zs[(i + 1) % zs.length];
  try {
    localStorage.setItem("ecos-zoom", game.zoom);
  } catch (e) {}
  toast("Zoom: " + Math.round(game.zoom * 100) + "%");
}
let storyI = 0,
  storyTimer = null;
function showStory() {
  game.mode = "story";
  storyI = 0;
  byId("title").style.display = "none";
  byId("story").style.display = "flex";
  renderStory(true);
}
function renderStory(first) {
  const el = byId("stxt");
  el.classList.add("hide");
  clearTimeout(storyTimer);
  storyTimer = setTimeout(
    () => {
      el.textContent = STORY[storyI];
      el.classList.remove("hide");
    },
    first ? 50 : 450,
  );
  byId("sdots").textContent = STORY.map((_, i) => (i === storyI ? "●" : "○")).join(" ");
  byId("sNext").textContent = storyI === STORY.length - 1 ? "Começar" : "Continuar";
}
function storyNext() {
  playSound(520, 0.05, "sine");
  if (storyI < STORY.length - 1) {
    storyI++;
    renderStory();
  } else storyEnd();
}
function storyEnd() {
  byId("story").style.display = "none";
  showChoose();
}
byId("sNext").onclick = storyNext;
byId("sSkip").onclick = storyEnd;
function startGame(intro) {
  byId("title").style.display = "none";
  byId("end").style.display = "none";
  game.mode = "world";
  hudCache = "";
  game.lastStep = null;
  enterZone();
  game.wasNight = isNight();
  if (intro) say(INTRO());
}
byId("btnNew").onclick = () => {
  goFull();
  player = newPlayer();
  game.seenArr = {};
  game.mm = {};
  clearSave();
  playSound(440, 0.1, "sine");
  showCreate("new");
};
byId("btnLife").onclick = () => {
  goFull();
  player = newPlayer();
  player.mode = "vida";
  // Morador comum: sem chapéu de mago (dá para escolher outro na criação).
  player.look.hat = "nenhum";
  player.look.outfit = "tunica";
  game.seenArr = {};
  game.mm = {};
  clearSave();
  playSound(523, 0.1, "sine");
  showCreate("new");
};
byId("btnCont").onclick = () => {
  goFull();
  const s = loadSave();
  if (!s) return;
  player = Object.assign(newPlayer(), s);
  game.seenArr = {};
  game.mm = {};
  playSound(440, 0.1, "sine");
  startGame(false);
};
byId("btnKeep").onclick = () => {
  byId("end").style.display = "none";
  player.zone = "vila";
  player.x = 31;
  player.y = 22;
  player.hp = maxHp();
  player.mp = maxMp();
  game.fade = 1;
  game.mode = "world";
  enterZone(true);
  saveGame();
  setTimeout(
    () =>
      say([
        [
          "Arquimaga Odelia",
          "A Canção voltou... mas ainda há muito a fazer, aprendiz. Ecos Corrompidos, pessoas que precisam de ajuda, uma família para cuidar.",
        ],
        [
          "",
          "História concluída! Veja as missões secundárias no menu Missões (Q). Elas dão ouro como recompensa.",
        ],
      ]),
    600,
  );
};
byId("btnAgain").onclick = () => {
  player = newPlayer();
  game.seenArr = {};
  game.mm = {};
  byId("end").style.display = "none";
  showCreate("new");
};
if (!loadSave()) byId("btnCont").style.display = "none";
layout();
requestAnimationFrame(loop);

/* ===================== BOTÕES DE OPÇÕES E MÚSICA ===================== */

byId("btnOpt").onclick = openOptions;
byId("optb").onclick = () => (game.mode === "world" || game.mode === "title") && openOptions();
byId("tO").addEventListener("click", () => game.mode === "world" && openOptions());
const startMusicOnce = () => {
  ensureMusic();
  removeEventListener("pointerdown", startMusicOnce);
  removeEventListener("keydown", startMusicOnce);
};
addEventListener("pointerdown", startMusicOnce);
addEventListener("keydown", startMusicOnce);

byId("btnGuide").onclick = openGuide;
byId("pauseb").onclick = togglePause;
byId("speedb").onclick = cycleSpeed;
byId("waitb").onclick = waitMenu;
byId("btnCredits").onclick = openCredits;
byId("btnEndCredits").onclick = openCredits;
