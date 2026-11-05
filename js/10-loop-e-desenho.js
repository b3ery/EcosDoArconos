/**
 * ECOS DO ARCANO — 10-loop-e-desenho.js
 * Loop principal: atualização do jogo e desenho de cada tela.
 */

/* ===================== LOOP ===================== */

function update(dt) {
  if (game.mode === "world" || game.mode === "battle") player.playtime += dt;
  if (game.dialog) updateDialogTyping(game.dialog, dt);
  if (game.mode === "world" && !game.dialog) {
    game.moveCd -= dt;
    game.grace -= dt;
    const dir =
      pressedKeys.arrowup || pressedKeys.w || game.touch === "up"
        ? "up"
        : pressedKeys.arrowdown || pressedKeys.s || game.touch === "down"
          ? "down"
          : pressedKeys.arrowleft || pressedKeys.a || game.touch === "left"
            ? "left"
            : pressedKeys.arrowright || pressedKeys.d || game.touch === "right"
              ? "right"
              : null;
    if (dir && game.fish) {
      game.fish = null;
      toast("Você recolhe a linha.", 1400);
    }
    if (dir && game.moveCd <= 0 && game.fade < 0.3 && !game.fish) {
      let dd = dir;
      if ((player.drunk || 0) > 30 && Math.random() < (player.drunk - 30) / 170) {
        dd = ["up", "down", "left", "right"][Math.floor(Math.random() * 4)];
      }
      const beforeX = player.x,
        beforeY = player.y;
      tryMove(dd);
      // No celular: se bater na parede, tenta deslizar pelo outro eixo do joystick.
      const vec = game.touchVec;
      if (vec && player.x === beforeX && player.y === beforeY && !game.dialog && game.mode === "world") {
        const side =
          dd === "left" || dd === "right" ? (vec.dy > 0 ? "down" : "up") : vec.dx > 0 ? "right" : "left";
        const sideAmount = dd === "left" || dd === "right" ? Math.abs(vec.dy) : Math.abs(vec.dx);
        if (sideAmount > 12) {
          tryMove(side);
          player.dir = dd;
        }
      }
      if (game.moveCd <= 0) {
        const slow = vec && vec.strength < JOYSTICK.WALK_ZONE ? 1.5 : 1;
        game.moveCd = (player.riding ? 0.06 : 0.12) * slow;
      }
    }
    for (const m of game.mobs) {
      if (m.eco) {
        m.rx = m.x;
        m.ry = m.y;
        continue;
      }
      if (!m.raid && (Math.abs(m.x - player.x) > 14 || Math.abs(m.y - player.y) > 11)) continue;
      m.timer -= dt;
      if (m.timer <= 0) {
        m.timer = (isNight() ? 0.3 : 0.45) + Math.random() * 0.6;
        let d;
        const dist = Math.abs(m.x - player.x) + Math.abs(m.y - player.y);
        const goal = m.raid && dist > 6 ? [31, 22] : [player.x, player.y];
        if (
          ((m.raid ? dist <= 7 : dist <= 4) && Math.random() < (m.raid ? 0.8 : 0.55)) ||
          (m.raid && Math.random() < 0.6)
        ) {
          const gx = goal[0] - m.x,
            gy = goal[1] - m.y;
          d = Math.abs(gx) > Math.abs(gy) ? [Math.sign(gx), 0] : [0, Math.sign(gy)];
          if (!gx && !gy)
            d = [
              [1, 0],
              [-1, 0],
              [0, 1],
              [0, -1],
            ][Math.floor(Math.random() * 4)];
        } else
          d = [
            [1, 0],
            [-1, 0],
            [0, 1],
            [0, -1],
          ][Math.floor(Math.random() * 4)];
        let nx = m.x + d[0],
          ny = m.y + d[1];
        const okT = (c) =>
          m.raid ? c === "." || c === "," || c === "w" || c === "g" || c === "=" : c === ".";
        if (m.raid && !okT(tileAt(player.zone, nx, ny))) {
          const alt = d[0] ? [0, Math.random() < 0.5 ? 1 : -1] : [Math.random() < 0.5 ? 1 : -1, 0];
          nx = m.x + alt[0];
          ny = m.y + alt[1];
        }
        if (okT(tileAt(player.zone, nx, ny)) && !game.mobs.some((o) => o !== m && o.x === nx && o.y === ny)) {
          m.x = nx;
          m.y = ny;
        }
      }
      m.rx += (m.x - m.rx) * Math.min(1, dt * 10);
      m.ry += (m.y - m.ry) * Math.min(1, dt * 10);
    }
    checkMobs();
    {
      const oc = player.clock;
      player.clock = (player.clock + dt * 5 * timeSpeed()) % 1440;
      const od = player.day;
      if (player.clock < oc) player.day++;
      if (game.raid) game.raid.left -= dt * 5 * timeSpeed();
      if (!player.weather) rollWeather(false);
      player.wLeft = (player.wLeft || 300) - dt * 5 * timeSpeed();
      if (player.wLeft <= 0) rollWeather(true);
      if (player.day !== od && seasonDay() === 1) {
        const se = season();
        setTimeout(() => {
          game.banner = {
            text: se.ic + " Chegou o " + se.n + "!",
            t: 3.5,
          };
          rollWeather(true);
        }, 1200);
      }
      if (game.annDay !== player.day) {
        if (game.annDay != null) {
          dailyCheat();
          onNewDay();
          player.kids.forEach((k) => {
            if (k.school && !k.grad) {
              k.study = Math.min(100, (k.study || 0) + 9);
              if (k.study >= 100) {
                k.grad = true;
                repAdd(3);
                setTimeout(
                  () => toast(` ${k.name} se formou na escola! Que orgulho! Reputação +3`, 4000),
                  1500,
                );
              }
            }
          });
          (player.pets || []).forEach((p, i) => {
            if (player.famDay["pet" + i + "c"] !== player.day - 1) p.love = Math.max(0, p.love - 4);
          });
        }
        game.annDay = player.day;
        const fe = festivalToday();
        if (fe)
          setTimeout(() => toast(` Dia ${player.day}: hoje é o ${fe.n} na praça de Cinzaluz!`, 4500), 600);
        else if (daysToFest() === 1) toast(`Amanhã tem festival na praça!`, 3000);
      }
      if (
        paradeDay() &&
        Math.floor(player.clock / 60) === 9 &&
        Math.floor(oc / 60) === 8 &&
        player.zone === "vila"
      )
        toast(" Às 10h a família real vai desfilar pela rua principal!", 4000);
      if (
        paradeDay() &&
        Math.floor(player.clock / 60) === 10 &&
        Math.floor(oc / 60) === 9 &&
        player.zone === "vila"
      ) {
        game.banner = {
          text: " Passeata da Família Real!",
          t: 3.5,
        };
        playTune();
      }
      if (
        Math.floor(player.clock / 60) === 22 &&
        Math.floor(oc / 60) === 21 &&
        player.zone !== "casa" &&
        ZONES[player.zone].town &&
        !festivalToday()
      )
        toast("22h: os moradores foram dormir. As lojas fecharam.", 3200);
      if (
        Math.floor(player.clock / 60) !== Math.floor(oc / 60) &&
        player.zone === "vila" &&
        !game.raid &&
        player.flags.treino &&
        player.raidDay !== player.day &&
        !festivalToday() &&
        Math.random() < (isNight() ? 0.16 : 0.04)
      )
        startRaid();
    }
    checkRaid();
    player.drunk = Math.max(0, (player.drunk || 0) - dt * 0.8);
    {
      const sid = season().id,
        wt = player.weather,
        outd = outdoorTheme(ZONES[player.zone].theme);
      const fm = (sid === "inv" ? 1.3 : 1) * (wt === "neve" && outd ? 1.2 : 1),
        wm = (sid === "ver" ? 1.3 : 1) * ((wt === "chuva" || wt === "tempestade") && outd ? 0.6 : 1);
      const sdt = dt * timeSpeed();
      player.food = Math.max(0, player.food - sdt * 0.2 * difficulty().need * fm);
      player.water = Math.max(0, player.water - sdt * 0.28 * difficulty().need * wm);
    }
    needsTick(dt * timeSpeed());
    lifeNeedsTick(dt * timeSpeed());
    jobTick(dt);
    collectorTick(dt);
    sicknessTick(dt);
    animalsTick(dt);
    crewTick(dt);
    const nn = isNight();
    if (game.wasNight !== undefined && nn !== game.wasNight) {
      if (nn) {
        toast("A noite caiu. Os monstros ficam mais fortes e numerosos!", 3500);
        const z = ZONES[player.zone];
        if (z.enemies.length)
          for (let i = 0; i < Math.round(game.mobs.length * 0.5) + 2; i++) {
            const [x, y] = z.spawn[Math.floor(Math.random() * z.spawn.length)];
            if (Math.abs(x - player.x) + Math.abs(y - player.y) > 9)
              game.mobs.push({
                type: z.enemies[Math.floor(Math.random() * z.enemies.length)],
                x,
                y,
                rx: x,
                ry: y,
                timer: Math.random(),
              });
          }
      } else toast("Amanheceu. Os caminhos ficam mais seguros.", 3000);
    }
    game.wasNight = nn;
  }
  if (activePet()) {
    if (!game.petPos)
      game.petPos = {
        x: player.x,
        y: player.y,
        rx: player.x,
        ry: player.y,
        flip: false,
      };
    const pp = game.petPos;
    if (game.petTarget && (game.petTarget[0] !== pp.x || game.petTarget[1] !== pp.y)) {
      pp.flip = game.petTarget[0] < pp.x;
      pp.x = game.petTarget[0];
      pp.y = game.petTarget[1];
    }
    pp.rx += (pp.x - pp.rx) * Math.min(1, dt * 9);
    pp.ry += (pp.y - pp.ry) * Math.min(1, dt * 9);
  }
  game.tgt = game.mode === "world" && !game.dialog ? findTarget() : null;
  player.hp = Math.min(player.hp, maxHp());
  player.mp = Math.min(player.mp, maxMp());
  if (game.bubbles) game.bubbles = game.bubbles.filter((b) => (b.t -= dt) > 0);
  if (
    ZONES[player.zone].town &&
    (game.mode === "world" || game.mode === "cutscene" || game.mode === "choice")
  )
    updateVilaLife(dt);
  updateFestival(dt);
  updateFishing(dt);
  updateElves(dt);
  updateAffection();
  updateWedding();
  monitorPerformance(dt);
  game.musicT = (game.musicT || 0) - dt;
  if (game.musicT <= 0) {
    game.musicT = 0.5;
    updateMusic();
  }
  if (game.mode === "world" && audioCtx && player.zone && outdoorTheme(ZONES[player.zone].theme)) {
    game.sndT = (game.sndT ?? 3) - dt;
    if (game.sndT <= 0) {
      game.sndT = 3 + Math.random() * 5;
      const w = player.weather;
      if (w === "chuva" || w === "tempestade") {
      } else if (isNight()) {
        for (let i = 0; i < 3; i++) setTimeout(() => playSound(4300, 0.025, "square", 0.004), i * 70);
      } else {
        const f = 2200 + Math.random() * 900;
        playSound(f, 0.05, "sine", 0.012);
        setTimeout(() => playSound(f * 1.2, 0.05, "sine", 0.01), 90);
      }
    }
  }
  if (game.mode === "cutscene" && game.ep && !game.ep.done && !game.dialog && game.fade < 0.2) {
    const e = game.ep,
      tg = e.path[0];
    const dx = tg[0] - e.x,
      dy = tg[1] - e.y,
      d = Math.hypot(dx, dy),
      sp = 3 * dt;
    if (d <= sp) {
      e.x = tg[0];
      e.y = tg[1];
      e.path.shift();
      if (!e.path.length) {
        e.done = true;
        say(EPILOGUE, () => {
          game.sparkle = 4;
          setTimeout(showEnd, 4200);
        });
      }
    } else {
      e.x += (dx / d) * sp;
      e.y += (dy / d) * sp;
    }
  }
  if (game.sparkle > 0) {
    game.sparkle -= dt;
    for (let i = 0; i < 3; i++)
      game.parts.push({
        x: Math.random() * viewWidth,
        y: 200 + Math.random() * 300,
        vx: (Math.random() - 0.5) * 20,
        vy: -30 - Math.random() * 50,
        life: 1.4,
        max: 1.4,
        col: RUNES[ORDER[Math.floor(Math.random() * 4)]].cor,
        size: 2 + Math.random() * 3,
      });
  }
  if (player.rx === undefined) {
    player.rx = player.x;
    player.ry = player.y;
  }
  player.rx += (player.x - player.rx) * Math.min(1, dt * 16);
  player.ry += (player.y - player.ry) * Math.min(1, dt * 16);
  if (game.proj) {
    const p = game.proj;
    p.t += dt;
    const k = Math.min(1, p.t / p.dur);
    p.x = p.sx + (p.tx - p.sx) * k;
    p.y = p.sy + (p.ty - p.sy) * k - Math.sin(k * Math.PI) * 40;
    for (let i = 0; i < 2; i++)
      game.parts.push({
        x: p.x,
        y: p.y,
        vx: (Math.random() - 0.5) * 40,
        vy: (Math.random() - 0.5) * 40,
        life: 0.4,
        max: 0.4,
        col: p.cols[Math.floor(Math.random() * p.cols.length)],
        size: 3,
      });
    if (k >= 1) {
      const cb = p.cb;
      game.proj = null;
      cb();
    }
  }
  game.parts = game.parts.filter((p) => {
    p.life -= dt;
    if (p.orbit) {
      p.orbit.a += p.orbit.spd * dt;
      p.orbit.r += 40 * dt;
      p.x = p.orbit.cx + Math.cos(p.orbit.a) * p.orbit.r;
      p.y = p.orbit.cy + Math.sin(p.orbit.a) * p.orbit.r * 0.6;
      return p.life > 0;
    }
    if (p.g) p.vy += p.g * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    if (!p.g) {
      p.vx *= 0.96;
      p.vy *= 0.96;
    }
    return p.life > 0;
  });
  game.floats = game.floats.filter((f) => {
    f.life -= dt;
    f.y -= 30 * dt;
    return f.life > 0;
  });
  game.fade = Math.max(0, game.fade - dt * 2.5);
  game.flash = Math.max(0, game.flash - dt * 3);
  game.shake = Math.max(0, game.shake - dt);
  if (battle) battle.eshake = Math.max(0, battle.eshake - dt);
  if (game.banner) {
    game.banner.t -= dt;
    if (game.banner.t <= 0) game.banner = null;
  }
  if (["world", "battle", "grimoire", "map", "quests", "inv", "shop", "choice"].includes(game.mode))
    updateHUD();
  if (game.mode === "world") checkQuest();
}
const BUILDING_STYLES = {
  home: {
    roof: "#2f4f99",
    r2: "#3f66bf",
    wall: "#efe3c4",
    beam: "#5a3a22",
    sign: "home",
    chim: 1,
  },
  casa: {
    roof: "#8c3b2e",
    r2: "#a8483a",
    wall: "#e8dcc0",
    beam: "#5a3a22",
    chim: 1,
  },
  casa2: {
    roof: "#6a4a2a",
    r2: "#80603a",
    wall: "#e0d6b8",
    beam: "#4a2e17",
    chim: 1,
  },
  padaria: {
    roof: "#b8862a",
    r2: "#d4a03a",
    wall: "#f2e6c8",
    beam: "#6b4423",
    sign: "bread",
    chim: 1,
  },
  taverna: {
    roof: "#6a2a2a",
    r2: "#843838",
    wall: "#e6d6b0",
    beam: "#4a2e17",
    sign: "mug",
    chim: 1,
    lantern: 1,
  },
  guilda: {
    roof: "#2a5a3a",
    r2: "#3a7a4a",
    wall: "#d8d2c4",
    beam: "#3a3a44",
    sign: "sword",
    stone: 1,
  },
  biblio: {
    roof: "#4a2a6a",
    r2: "#5e3a84",
    wall: "#d8d2c4",
    beam: "#3a3a44",
    sign: "book",
    stone: 1,
  },
  estab: {
    roof: "#8a6a3a",
    r2: "#a8844e",
    wall: "#c9a878",
    beam: "#5a4220",
    sign: "horse",
  },
  templo: {
    roof: "#5a6a8a",
    r2: "#6e7ea0",
    wall: "#e8e4dc",
    beam: "#9a9488",
    sign: "cross",
    stone: 1,
    tower: 1,
  },
  hosp: {
    roof: "#d8d2c4",
    r2: "#f2eee4",
    wall: "#f2eee4",
    beam: "#a39d90",
    sign: "red",
    stone: 1,
  },
  forja: {
    roof: "#3a3a44",
    r2: "#4a4a56",
    wall: "#8a8478",
    beam: "#2a2a30",
    sign: "anvil",
    chim: 2,
    stone: 1,
  },
  alfaiate: {
    roof: "#8a3a6a",
    r2: "#a8508a",
    wall: "#efe3c4",
    beam: "#5a3a22",
    sign: "needle",
    chim: 1,
  },
  troca: {
    roof: "#6a3a8a",
    r2: "#8a52ad",
    wall: "#e8dcc0",
    beam: "#3d1f52",
    sign: "scale",
  },
  peixaria: {
    roof: "#2a5a8a",
    r2: "#3a74a8",
    wall: "#e8ecf0",
    beam: "#3a2a1a",
    sign: "fish",
    chim: 0,
  },
  acougue: {
    roof: "#8a2a2a",
    r2: "#a83a3a",
    wall: "#efe3c4",
    beam: "#4a2e17",
    sign: "meat",
    chim: 1,
  },
  armazem: {
    roof: "#5a6a3a",
    r2: "#6e804a",
    wall: "#e8dcc0",
    beam: "#4a2e17",
    sign: "sack",
    chim: 0,
  },
  tecidos: {
    roof: "#8a3a7a",
    r2: "#a84a94",
    wall: "#f2eadc",
    beam: "#5a3a22",
    sign: "cloth",
    chim: 0,
  },
  boticario: {
    roof: "#2a6a5a",
    r2: "#3a8a74",
    wall: "#e8e4d0",
    beam: "#3a2a1a",
    sign: "potion",
    chim: 1,
  },
  livraria: {
    roof: "#3a3a7a",
    r2: "#4a4a9a",
    wall: "#efe3c4",
    beam: "#4a2e17",
    sign: "book",
    chim: 0,
  },
  emporio: {
    roof: "#b8602a",
    r2: "#d4783a",
    wall: "#f2e6c8",
    beam: "#5a3a22",
    sign: "lamp",
    chim: 0,
  },
  escola: {
    roof: "#c9a02a",
    r2: "#e0b83a",
    wall: "#f2eee4",
    beam: "#5a3a22",
    sign: "school",
    chim: 1,
  },
  marcenaria: {
    roof: "#7a5a2a",
    r2: "#946e36",
    wall: "#e0d0a8",
    beam: "#5a3a1e",
    sign: "chair",
    chim: 1,
  },
  pousada: {
    roof: "#2a6a6a",
    r2: "#3a8484",
    wall: "#efe3c4",
    beam: "#5a3a22",
    sign: "bed",
    chim: 1,
    lantern: 1,
  },
  perola: {
    roof: "#3a8ab0",
    r2: "#52a4c9",
    wall: "#f2eee4",
    beam: "#a39d90",
    sign: "gem",
    stone: 1,
  },
  moda: {
    roof: "#c94a8a",
    r2: "#e066a4",
    wall: "#f2e6d8",
    beam: "#6a3a5a",
    sign: "dress",
    chim: 1,
  },
  cabana: {
    roof: "#c9a050",
    r2: "#dcb868",
    wall: "#a8784a",
    beam: "#6b4423",
    thatch: 1,
  },
  cristal: {
    roof: "#4a3a8a",
    r2: "#6a52b0",
    wall: "#bdb8cc",
    beam: "#5a5470",
    sign: "gem",
    stone: 1,
  },
  pedra: {
    roof: "#4a4a52",
    r2: "#5e5e68",
    wall: "#9a968a",
    beam: "#6a665c",
    stone: 1,
    chim: 1,
  },
  salao: {
    roof: "#d9a441",
    r2: "#f2c14e",
    wall: "#f2e6d8",
    beam: "#6b4423",
    sign: "scissor",
    chim: 1,
  },
  celeiro: {
    roof: "#7a2a22",
    r2: "#93362c",
    wall: "#a8382c",
    beam: "#f2eee4",
    barn: 1,
  },
};
function signIcon(k, x, y) {
  ctx.fillStyle = "#6b4423";
  ctx.fillRect(x - 1, y - 14, 2, 6);
  ctx.fillStyle = "#a8784a";
  ctx.fillRect(x - 11, y - 9, 22, 16);
  ctx.strokeStyle = "#4a2e17";
  ctx.lineWidth = 2;
  ctx.strokeRect(x - 11, y - 9, 22, 16);
  const c = (col, a, b, w, h) => {
    ctx.fillStyle = col;
    ctx.fillRect(x + a, y + b, w, h);
  };
  if (k === "mug") {
    c("#f2c14e", -5, -5, 8, 9);
    c("#fff", -5, -6, 8, 3);
    c("#f2c14e", 3, -3, 3, 5);
  } else if (k === "bread") {
    ctx.fillStyle = "#d9a441";
    ctx.beginPath();
    ctx.ellipse(x, y - 1, 8, 4, 0, 0, 7);
    ctx.fill();
    c("#8a5a2e", -4, -2, 1, 2);
    c("#8a5a2e", 0, -3, 1, 2);
    c("#8a5a2e", 4, -2, 1, 2);
  } else if (k === "sword") {
    c("#cfd3e6", -1, -7, 2, 10);
    c("#8a5a2e", -4, 2, 8, 2);
    c("#8a5a2e", -1, 4, 2, 3);
  } else if (k === "book") {
    c("#5a2d8a", -6, -6, 12, 10);
    c("#efe2c0", -5, -5, 10, 8);
    c("#5a2d8a", -1, -6, 2, 10);
  } else if (k === "horse") {
    c("#4a2e17", -6, -2, 10, 5);
    c("#4a2e17", 3, -6, 3, 6);
    c("#4a2e17", -5, 3, 2, 3);
    c("#4a2e17", 2, 3, 2, 3);
  } else if (k === "cross" || k === "red") {
    c(k === "red" ? "#e0303a" : "#f2c14e", -1, -7, 3, 13);
    c(k === "red" ? "#e0303a" : "#f2c14e", -5, -3, 11, 3);
  } else if (k === "anvil") {
    c("#3a3a44", -7, -4, 14, 4);
    c("#3a3a44", -3, 0, 6, 4);
    c("#3a3a44", -6, 4, 12, 2);
  } else if (k === "needle") {
    c("#cfd3e6", -1, -7, 2, 12);
    c("#e0303a", 1, -5, 5, 1);
    c("#e0303a", 5, -5, 1, 6);
  } else if (k === "scale") {
    c("#f2c14e", -1, -7, 2, 12);
    c("#f2c14e", -7, -6, 14, 2);
    c("#f2c14e", -8, -3, 5, 2);
    c("#f2c14e", 3, -3, 5, 2);
  } else if (k === "bed") {
    c("#c94a4a", -7, -1, 14, 5);
    c("#f3ead2", -7, -3, 5, 3);
    c("#6b4423", -8, 3, 2, 4);
    c("#6b4423", 6, 3, 2, 4);
  } else if (k === "gem") {
    ctx.fillStyle = "#5fd0ff";
    fillPolygon(x, y - 7, x + 6, y - 2, x, y + 5, x - 6, y - 2);
    c("#fff", -2, -4, 2, 2);
  } else if (k === "dress") {
    ctx.fillStyle = "#e066a4";
    fillPolygon(x - 3, y - 7, x + 3, y - 7, x + 7, y + 5, x - 7, y + 5);
    c("#f2c14e", -3, -3, 6, 1);
  } else if (k === "fish") {
    c("#9ab8c9", -6, -3, 11, 6);
    c("#9ab8c9", 5, -5, 3, 10);
    c("#1a1a1a", -4, -1, 1, 1);
    c("#7a9aab", -2, 0, 6, 1);
  } else if (k === "meat") {
    c("#c94a4a", -6, -4, 10, 7);
    c("#f2eee4", 3, -2, 4, 3);
    c("#e8a0a0", -4, -3, 4, 2);
  } else if (k === "sack") {
    c("#c9a878", -5, -4, 10, 10);
    c("#8a6a3a", -5, -5, 10, 2);
    c("#8a6a3a", -1, -7, 2, 3);
  } else if (k === "cloth") {
    c("#c94a8a", -7, -5, 6, 10);
    c("#4a74c9", -1, -5, 6, 10);
    c("#f2c14e", 5, -5, 3, 10);
  } else if (k === "potion") {
    c("#7ad36b", -4, -1, 8, 7);
    c("#cfd3e6", -2, -5, 4, 4);
    c("#8a5a2e", -2, -7, 4, 2);
  } else if (k === "book") {
    c("#4a4aa8", -7, -5, 7, 10);
    c("#a84a4a", 0, -5, 7, 10);
    c("#f2eee4", -1, -5, 2, 10);
  } else if (k === "lamp") {
    c("#f2c14e", -4, -3, 8, 7);
    c("#c97a2a", -6, 4, 12, 2);
    c("#f2c14e", -1, -6, 2, 3);
  } else if (k === "school") {
    c("#2a4a3a", -7, -5, 14, 9);
    c("#f2eee4", -5, -3, 4, 1);
    c("#f2eee4", -5, 0, 7, 1);
    c("#8a5a2e", -8, 4, 16, 2);
  } else if (k === "chair") {
    c("#8a5a2e", -5, -7, 2, 13);
    c("#8a5a2e", -5, 0, 10, 2);
    c("#8a5a2e", 3, 0, 2, 6);
    c("#8a5a2e", -5, -7, 8, 2);
  } else if (k === "scissor") {
    c("#cfd3e6", -6, -6, 2, 10);
    c("#cfd3e6", 4, -6, 2, 10);
    ctx.strokeStyle = "#cfd3e6";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x - 4, y + 5, 3, 0, 7);
    ctx.arc(x + 5, y + 5, 3, 0, 7);
    ctx.stroke();
  } else if (k === "home") {
    c("#2f4f99", -6, -2, 12, 7);
    ctx.fillStyle = "#2f4f99";
    fillPolygon(x - 8, y - 2, x, y - 8, x + 8, y - 2);
  }
}
const HUTSTY = {
  doceria: ["#e86a9a", "veg"],
  floricultura: ["#7ab04a", "herb"],
  bazar: ["#6a3a8a", "pot"],
  abrigo: ["#c98a3a", "fur"],
  chas: ["#4a8a6a", "herb"],
  brinquedos: ["#d94a4a", "gem"],
  bruno: ["#c94a4a", "pot"],
  rosa: ["#d9a441", "veg"],
  doran: ["#4a74c9", "staff"],
  peixaria: ["#3a8ab0", "fish"],
  ervanaria: ["#5a9a4a", "herb"],
  joalheiro: ["#8a4ad9", "gem"],
  peixeG: ["#3a8ab0", "fish"],
  especiarias: ["#c9603a", "veg"],
  conchas: ["#e8a0b0", "shell"],
  frutasP: ["#e8902a", "veg"],
  redes: ["#3a5a7a", "fish"],
  queijos: ["#d9c08a", "veg"],
  ervasS: ["#4a7a4a", "herb"],
  minerios: ["#6a6f62", "ore"],
  peles: ["#8a5a2e", "fur"],
};
function hutGoods(g, X, Y, k0, n) {
  for (let k = 0; k < n; k++) {
    const gx = X + k * 9,
      kk = k + k0;
    if (g === "pot") {
      ctx.fillStyle = ["#ff6b8a", "#5fd0ff", "#7ad36b"][kk % 3];
      ctx.fillRect(gx, Y - 2, 6, 9);
      ctx.fillStyle = "#f3ead2";
      ctx.fillRect(gx + 2, Y - 5, 2, 3);
    } else if (g === "veg") {
      ctx.fillStyle = ["#e0303a", "#f2a83a", "#7ab04a"][kk % 3];
      circle(gx + 3, Y + 3, 4);
    } else if (g === "staff") {
      ctx.fillStyle = "#7a4f2a";
      ctx.fillRect(gx + 2, Y - 14, 2, 22);
      ctx.fillStyle = ["#ff7a3d", "#4fb8ff", "#9ff0cf", "#e0ab62"][kk % 4];
      circle(gx + 3, Y - 15, 3);
    } else if (g === "fish") {
      ctx.fillStyle = "#9ab8c9";
      ctx.beginPath();
      ctx.ellipse(gx + 3, Y + 3, 5, 2.5, 0, 0, 7);
      ctx.fill();
      ctx.fillRect(gx - 3, Y + 1, 3, 4);
    } else if (g === "herb") {
      ctx.fillStyle = "#5a9a4a";
      ctx.fillRect(gx, Y - 4, 2, 10);
      ctx.fillRect(gx + 3, Y - 6, 2, 12);
      ctx.fillStyle = "#c77dff";
      ctx.fillRect(gx + 2, Y - 7, 3, 3);
    } else if (g === "gem") {
      ctx.fillStyle = ["#5fd0ff", "#ff6b8a", "#f2c14e"][kk % 3];
      fillPolygon(gx + 3, Y - 4, gx + 7, Y + 1, gx + 3, Y + 6, gx - 1, Y + 1);
    } else if (g === "shell") {
      ctx.fillStyle = ["#f2d0d8", "#fff3e0"][kk % 2];
      ctx.beginPath();
      ctx.arc(gx + 3, Y + 4, 4, Math.PI, 0);
      ctx.fill();
    } else if (g === "ore") {
      ctx.fillStyle = kk % 2 ? "#5fd0ff" : "#8a8478";
      fillPolygon(gx, Y + 7, gx + 3, Y - 2, gx + 7, Y + 7);
    } else if (g === "fur") {
      ctx.fillStyle = ["#8a5a2e", "#d9d2c4", "#5a4a3a"][kk % 3];
      ctx.fillRect(gx - 1, Y - 3, 8, 10);
    }
  }
}
function isCabana(hu) {
  return player.zone === "porto" || (player.zone === "vila" && (hu.y === 24 || hu.y === 35));
}
function drawCabana(hu, t) {
  const X = hu.x * TILE,
    Y = hu.y * TILE,
    W = 64,
    [col, g] = HUTSTY[hu.shop] || ["#c94a4a", "pot"],
    cr = "#f3ead2",
    dk = shade(col, -0.3);
  ctx.fillStyle = "rgba(0,0,0,.25)";
  ctx.beginPath();
  ctx.ellipse(X + W / 2, Y + 31, W / 2 + 4, 5, 0, 0, 7);
  ctx.fill();
  // postes
  ctx.fillStyle = "#5a3a1e";
  ctx.fillRect(X + 2, Y - 30, 5, 62);
  ctx.fillRect(X + W - 7, Y - 30, 5, 62);
  ctx.fillStyle = "#7a5030";
  ctx.fillRect(X + 3, Y - 30, 2, 62);
  ctx.fillRect(X + W - 6, Y - 30, 2, 62);
  // mesa com toalha
  ctx.fillStyle = "#8a5a2e";
  ctx.fillRect(X + 4, Y + 4, W - 8, 6);
  ctx.fillStyle = col;
  ctx.fillRect(X + 4, Y + 8, W - 8, 14);
  for (let k = 0; k < 7; k++) {
    ctx.fillStyle = k % 2 ? cr : col;
    ctx.beginPath();
    ctx.arc(X + 8 + k * 8, Y + 22, 4, 0, Math.PI);
    ctx.fill();
  }
  ctx.fillStyle = "rgba(255,255,255,.25)";
  ctx.fillRect(X + 4, Y + 10, W - 8, 1);
  ctx.fillStyle = "#6b4423";
  ctx.fillRect(X + 8, Y + 24, 10, 7);
  ctx.fillRect(X + W - 18, Y + 24, 10, 7);
  ctx.fillStyle = "#8a5a2e";
  ctx.fillRect(X + 8, Y + 24, 10, 2);
  ctx.fillRect(X + W - 18, Y + 24, 10, 2);
  hutGoods(g, X + 7, Y - 2, 0, 6);
  // telhado de lona em bico
  const ax = X + W / 2,
    ay = Y - 54,
    ey = Y - 30;
  for (let k = 0; k < 8; k++) {
    const x1 = X - 6 + (k * (W + 12)) / 8,
      x2 = X - 6 + ((k + 1) * (W + 12)) / 8;
    ctx.fillStyle = k % 2 ? cr : col;
    fillPolygon(ax, ay, x1, ey, x2, ey);
  }
  ctx.strokeStyle = dk;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(X - 6, ey);
  ctx.lineTo(ax, ay);
  ctx.lineTo(X + W + 6, ey);
  ctx.stroke();
  for (let k = 0; k < 9; k++) {
    ctx.fillStyle = k % 2 ? col : cr;
    ctx.beginPath();
    ctx.arc(X - 4 + k * 8.5, ey, 4.5, 0, Math.PI);
    ctx.fill();
  }
  // bandeirinha no topo
  ctx.fillStyle = "#5a3a1e";
  ctx.fillRect(ax - 1, ay - 12, 2, 12);
  const wv = Math.sin(t * 4 + hu.x) * 2;
  ctx.fillStyle = dk;
  fillPolygon(ax + 1, ay - 12, ax + 12, ay - 9 + wv, ax + 1, ay - 6);
  // goods hanging
  ctx.strokeStyle = "#5a3a1e";
  ctx.beginPath();
  ctx.moveTo(X + 8, ey + 6);
  ctx.lineTo(X + W - 8, ey + 6);
  ctx.stroke();
  hutGoods(g, X + 12, ey + 10, 3, 5);
  if (nightAlpha() > 0.15) {
    ctx.fillStyle = "rgba(255,200,100,.95)";
    ctx.fillRect(X + W - 12, ey + 4, 5, 6);
    ctx.fillStyle = "rgba(255,190,90,.16)";
    circle(X + W - 10, ey + 8, 14);
  }
  const sh = SHOPS[hu.shop];
  if (
    sh &&
    Math.abs(player.x - (hu.x + 0.5)) <= 1.5 &&
    player.y >= hu.y &&
    player.y - hu.y <= 2 &&
    game.mode === "world"
  ) {
    ctx.font = '700 12px "Pixelify Sans", sans-serif';
    ctx.textAlign = "center";
    const l = sh.nome.split(",")[0],
      w = ctx.measureText(l).width + 10;
    ctx.fillStyle = "rgba(10,6,18,.78)";
    ctx.fillRect(X + W / 2 - w / 2, Y - 96, w, 15);
    ctx.fillStyle = "#f2c14e";
    ctx.fillText(l, X + W / 2, Y - 85);
  }
}
// parte de trás da loja (atrás do vendedor)

function drawHutBack(hu, t) {
  if (isCabana(hu)) return;
  const X = hu.x * TILE,
    Y = hu.y * TILE,
    W = 64,
    [col, g] = HUTSTY[hu.shop] || ["#c94a4a", "pot"],
    stone = tileHash(hu.x, hu.y) > 0.5;
  ctx.fillStyle = stone ? "#9a9182" : "#e8dcc0";
  ctx.fillRect(X + 4, Y - 46, W - 8, 46);
  if (stone) {
    ctx.fillStyle = "#857c6e";
    for (let r = 0; r < 6; r++) {
      ctx.fillRect(X + 4, Y - 46 + r * 8, W - 8, 1);
      for (let k = 0; k < 5; k++) ctx.fillRect(X + 4 + (r % 2) * 6 + k * 12, Y - 46 + r * 8, 1, 8);
    }
  } else {
    ctx.fillStyle = "#5a3a22";
    ctx.fillRect(X + 4, Y - 46, W - 8, 3);
    ctx.fillRect(X + 30, Y - 46, 3, 46);
  }
  ctx.fillStyle = "#5a3a1e";
  ctx.fillRect(X + 8, Y - 30, W - 16, 3);
  hutGoods(g, X + 11, Y - 38, 0, 5);
  ctx.fillStyle = "rgba(0,0,0,.18)";
  ctx.fillRect(X + 4, Y - 8, W - 8, 8);
}
// parte da frente: pilares, balcão, telhado, placa

function drawHut(hu, t) {
  if (isCabana(hu)) return drawCabana(hu, t);
  const X = hu.x * TILE,
    Y = hu.y * TILE,
    W = 64,
    [col, g] = HUTSTY[hu.shop] || ["#c94a4a", "pot"],
    stone = tileHash(hu.x, hu.y) > 0.5;
  ctx.fillStyle = "rgba(0,0,0,.25)";
  ctx.fillRect(X + 2, Y + 28, W + 2, 6);
  const pil = stone ? "#8a8174" : "#6b4423",
    pil2 = stone ? "#a39a8c" : "#8a5a2e";
  ctx.fillStyle = pil;
  ctx.fillRect(X, Y - 48, 8, 78);
  ctx.fillRect(X + W - 8, Y - 48, 8, 78);
  ctx.fillStyle = pil2;
  ctx.fillRect(X + 1, Y - 48, 3, 78);
  ctx.fillRect(X + W - 7, Y - 48, 3, 78);
  ctx.fillStyle = stone ? "#7a7366" : "#5a3a1e";
  ctx.fillRect(X + 4, Y + 14, W - 8, 16);
  ctx.fillStyle = "#8a5a2e";
  ctx.fillRect(X + 4, Y + 6, W - 8, 10);
  ctx.fillStyle = "#a8784a";
  ctx.fillRect(X + 2, Y + 4, W - 4, 5);
  ctx.fillStyle = stone ? "#6a645a" : "#4a2e17";
  for (let k = 1; k < 4; k++) ctx.fillRect(X + 4 + k * 14, Y + 16, 1, 14);
  hutGoods(g, X + 9, Y - 1, 1, 6);
  // toldo listrado
  for (let k = 0; k < 7; k++) {
    ctx.fillStyle = k % 2 ? "#f3ead2" : col;
    ctx.fillRect(X + 4 + k * 8, Y - 16, 8, 5);
    fillPolygon(X + 4 + k * 8, Y - 11, X + 12 + k * 8, Y - 11, X + 8 + k * 8, Y - 7);
  }
  ctx.fillStyle = "rgba(0,0,0,.15)";
  ctx.fillRect(X + 4, Y - 16, W - 8, 2);
  // telhado de telhas
  const rc = shade(col, -0.25),
    rc2 = shade(col, -0.05);
  ctx.fillStyle = rc;
  fillPolygon(X - 6, Y - 44, X + W + 6, Y - 44, X + W - 2, Y - 60, X + 2, Y - 60);
  ctx.fillStyle = rc2;
  for (let r = 0; r < 3; r++)
    for (let k = 0; k < 10; k++) {
      const tx = X - 4 + k * 8 + (r % 2) * 4,
        ty = Y - 58 + r * 5;
      if (tx > X - 6 && tx < X + W + 2) ctx.fillRect(tx, ty, 6, 3);
    }
  ctx.fillStyle = shade(col, -0.45);
  ctx.fillRect(X - 6, Y - 45, W + 12, 3);
  // placa
  ctx.fillStyle = "#4a2e17";
  ctx.fillRect(X + W / 2 - 14, Y - 42, 28, 10);
  ctx.fillStyle = "#e8d8b0";
  ctx.fillRect(X + W / 2 - 12, Y - 41, 24, 8);
  hutGoods(g, X + W / 2 - 10, Y - 39, 0, 3);
  // lanterna à noite
  if (nightAlpha() > 0.15) {
    ctx.fillStyle = "rgba(255,200,100,.9)";
    ctx.fillRect(X + W - 12, Y - 30, 5, 7);
    ctx.fillStyle = "rgba(255,190,90,.18)";
    circle(X + W - 10, Y - 26, 14);
  }
  const sh = SHOPS[hu.shop];
  if (
    sh &&
    Math.abs(player.x - (hu.x + 0.5)) <= 1.5 &&
    player.y >= hu.y &&
    player.y - hu.y <= 2 &&
    game.mode === "world"
  ) {
    ctx.font = '700 12px "Pixelify Sans", sans-serif';
    ctx.textAlign = "center";
    const l = sh.nome.split(",")[0],
      w = ctx.measureText(l).width + 10;
    ctx.fillStyle = "rgba(10,6,18,.78)";
    ctx.fillRect(X + W / 2 - w / 2, Y - 78, w, 15);
    ctx.fillStyle = "#f2c14e";
    ctx.fillText(l, X + W / 2, Y - 67);
  }
}
function inMarket(z, x, y) {
  return z === "vila" && x >= 40 && x <= 51 && y >= 14 && y <= 25;
}
function drawBoat(X, Y, t) {
  const b = Math.sin(t * 1.5 + X) * 2;
  ctx.fillStyle = "#6b4423";
  fillPolygon(X - 10, Y + 10 + b, X + 50, Y + 10 + b, X + 42, Y + 24 + b, X - 2, Y + 24 + b);
  ctx.fillStyle = "#8a5a2e";
  ctx.fillRect(X - 8, Y + 10 + b, 56, 3);
  ctx.fillStyle = "#5a3a22";
  ctx.fillRect(X + 18, Y - 24 + b, 3, 34);
  ctx.fillStyle = "#f3ead2";
  fillPolygon(X + 21, Y - 22 + b, X + 42, Y + 4 + b, X + 21, Y + 6 + b);
}
function drawHorse(X, Y, t, flip) {
  const b = Math.sin(t * 2 + X) * 1;
  ctx.save();
  if (flip) {
    ctx.translate(X * 2 + 32, 0);
    ctx.scale(-1, 1);
  }
  ctx.fillStyle = "rgba(0,0,0,.22)";
  ctx.beginPath();
  ctx.ellipse(X + 16, Y + 30, 14, 3, 0, 0, 7);
  ctx.fill();
  ctx.fillStyle = "#7a4a24";
  ctx.fillRect(X + 3, Y + 12 + b, 24, 10);
  ctx.fillRect(X + 23, Y + 4 + b, 7, 12);
  ctx.fillStyle = "#4a2a14";
  ctx.fillRect(X + 27, Y + 2 + b, 3, 6);
  ctx.fillRect(X + 20, Y + 4 + b, 3, 10);
  ctx.fillRect(X + 1, Y + 13 + b, 3, 8);
  ctx.fillRect(X + 5, Y + 22, 3, 8);
  ctx.fillRect(X + 11, Y + 22, 3, 8);
  ctx.fillRect(X + 18, Y + 22, 3, 8);
  ctx.fillRect(X + 23, Y + 22, 3, 8);
  ctx.fillStyle = "#fff";
  ctx.fillRect(X + 28, Y + 7 + b, 1, 1);
  ctx.restore();
}
function drawBuilding(b, t) {
  const X = b.x * TILE,
    Y = b.y * TILE,
    W = b.w * TILE,
    Hh = b.h * TILE,
    night = nightAlpha() > 0.25;
  const win = (wx, wy, ww, wh) => {
    ctx.fillStyle = "#4a2e17";
    ctx.fillRect(wx - 2, wy - 2, ww + 4, wh + 4);
    ctx.fillStyle = night ? `rgba(255,${200 + Math.floor(Math.sin(t * 3 + wx) * 20)},110,1)` : "#4b6f9a";
    ctx.fillRect(wx, wy, ww, wh);
    ctx.fillStyle = night ? "#ffe9a8" : "#7aa0c9";
    ctx.fillRect(wx, wy, ww / 2 - 1, wh / 2 - 1);
    ctx.fillStyle = "#4a2e17";
    ctx.fillRect(wx + ww / 2 - 1, wy, 2, wh);
    ctx.fillRect(wx, wy + wh / 2 - 1, ww, 2);
  };
  ctx.fillStyle = "rgba(0,0,0,.28)";
  ctx.fillRect(X + 6, Y + Hh - 6, W, 10);
  if (b.style === "castle") {
    const st = "#8f897d",
      st2 = "#a39d90",
      dk = "#6a655b";
    ctx.fillStyle = st;
    ctx.fillRect(X + 40, Y + 24, W - 80, Hh - 24);
    ctx.fillStyle = dk;
    for (let r = 0; r < Math.floor((Hh - 24) / 10); r++) {
      ctx.fillRect(X + 40, Y + 30 + r * 10, W - 80, 1);
      for (let k = 0; k < (W - 80) / 22; k++)
        ctx.fillRect(X + 40 + (r % 2) * 11 + k * 22, Y + 24 + r * 10, 1, 10);
    }
    for (let k = 0; k < (W - 80) / 16; k++) {
      ctx.fillStyle = st2;
      ctx.fillRect(X + 40 + k * 16, Y + 14, 10, 12);
    }
    ctx.fillStyle = st;
    ctx.fillRect(X + W / 2 - 56, Y - 24, 112, 52);
    ctx.fillStyle = st2;
    for (let k = 0; k < 7; k++) ctx.fillRect(X + W / 2 - 56 + k * 16, Y - 34, 10, 12);
    ctx.fillStyle = "#2f4f99";
    fillPolygon(X + W / 2 - 36, Y - 34, X + W / 2, Y - 84, X + W / 2 + 36, Y - 34);
    ctx.fillStyle = "#3f66bf";
    fillPolygon(X + W / 2 - 36, Y - 34, X + W / 2, Y - 84, X + W / 2 - 6, Y - 34);
    for (const tx of [X, X + W - 48]) {
      ctx.fillStyle = st;
      ctx.fillRect(tx, Y - 8, 48, Hh + 8);
      ctx.fillStyle = dk;
      for (let r = 0; r < Hh / 10; r++) ctx.fillRect(tx, Y + r * 10, 48, 1);
      ctx.fillStyle = st2;
      for (let k = 0; k < 3; k++) ctx.fillRect(tx + 2 + k * 16, Y - 18, 12, 12);
      ctx.fillStyle = "#2f4f99";
      fillPolygon(tx - 4, Y - 18, tx + 24, Y - 72, tx + 52, Y - 18);
      ctx.fillStyle = "#3f66bf";
      fillPolygon(tx - 4, Y - 18, tx + 24, Y - 72, tx + 18, Y - 18);
      win(tx + 18, Y + 20, 12, 18);
      win(tx + 18, Y + 70, 12, 18);
      ctx.fillStyle = "#5a3a22";
      ctx.fillRect(tx + 23, Y - 96, 2, 26);
      const fw = Math.sin(t * 4 + tx) * 3;
      ctx.fillStyle = "#c94a4a";
      fillPolygon(tx + 25, Y - 96, tx + 44, Y - 90 + fw, tx + 25, Y - 84);
    }
    ctx.fillStyle = "#5a3a22";
    ctx.fillRect(X + W / 2 - 1, Y - 110, 2, 28);
    ctx.fillStyle = "#f2c14e";
    fillPolygon(X + W / 2 + 1, Y - 110, X + W / 2 + 24, Y - 103 + Math.sin(t * 4) * 3, X + W / 2 + 1, Y - 96);
    for (const bx of [X + 64, X + W - 80]) {
      ctx.fillStyle = "#a8282a";
      ctx.fillRect(bx, Y + 30, 16, 44);
      ctx.fillStyle = "#f2c14e";
      ctx.fillRect(bx + 6, Y + 40, 4, 14);
      ctx.fillRect(bx + 2, Y + 46, 12, 3);
      fillPolygon(bx, Y + 74, bx + 8, Y + 66, bx + 16, Y + 74);
    }
    win(X + W / 2 - 30, Y - 8, 10, 16);
    win(X + W / 2 + 20, Y - 8, 10, 16);
    win(X + 110, Y + 40, 10, 16);
    win(X + W - 120, Y + 40, 10, 16);
    const gx = X + (b.door[0] - b.x) * TILE;
    ctx.fillStyle = "#2a2420";
    ctx.fillRect(gx + 2, Hh + Y - 56, 60, 56);
    ctx.beginPath();
    ctx.arc(gx + 32, Y + Hh - 56, 30, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = "#5a4a3a";
    for (let k = 0; k < 6; k++) ctx.fillRect(gx + 6 + k * 10, Y + Hh - 80, 3, 80);
    for (let k = 0; k < 5; k++) ctx.fillRect(gx + 2, Y + Hh - 70 + k * 14, 60, 2);
    return;
  }
  if (b.style === "farol") {
    for (let k = 0; k < 6; k++) {
      ctx.fillStyle = k % 2 ? "#c94a4a" : "#f2eee4";
      ctx.fillRect(X + 14 + k * 1, Y + (k * Hh) / 6 - 20, W - 28 - k * 2, Hh / 6 + 1);
    }
    ctx.fillStyle = "#3a3a44";
    ctx.fillRect(X + 8, Y - 46, W - 16, 26);
    ctx.fillStyle = night ? "#fff3b0" : "#ffd66b";
    ctx.fillRect(X + 14, Y - 42, W - 28, 18);
    ctx.fillStyle = "#c94a4a";
    fillPolygon(X + 4, Y - 46, X + W / 2, Y - 70, X + W - 4, Y - 46);
    if (night) {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      const a = t * 1.2;
      ctx.fillStyle = "rgba(255,240,170,.18)";
      ctx.beginPath();
      ctx.moveTo(X + W / 2, Y - 33);
      ctx.arc(X + W / 2, Y - 33, 320, a, a + 0.35);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    ctx.fillStyle = "#4a2e17";
    ctx.fillRect(X + (b.door[0] - b.x) * TILE + 8, Y + Hh - 28, 16, 28);
    return;
  }
  if (b.style === "mina") {
    ctx.fillStyle = "#5a5f52";
    fillPolygon(X - 10, Y + Hh, X + W + 10, Y + Hh, X + W - 10, Y - 10, X + W / 2, Y - 30, X + 10, Y - 6);
    ctx.fillStyle = "#6f7466";
    fillPolygon(X + 10, Y - 6, X + W / 2, Y - 30, X + W / 2 + 10, Y + 10, X + 20, Y + 20);
    const gx = X + (b.door[0] - b.x) * TILE;
    ctx.fillStyle = "#1a1410";
    ctx.fillRect(gx, Y + Hh - 56, 64, 56);
    ctx.beginPath();
    ctx.arc(gx + 32, Y + Hh - 56, 32, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = "#6b4423";
    ctx.fillRect(gx - 4, Y + Hh - 64, 8, 64);
    ctx.fillRect(gx + 60, Y + Hh - 64, 8, 64);
    ctx.fillRect(gx - 6, Y + Hh - 70, 76, 8);
    ctx.fillStyle = "#5fd0ff";
    ctx.globalAlpha = 0.6 + 0.3 * Math.sin(t * 3);
    ctx.fillRect(gx + 20, Y + Hh - 30, 4, 6);
    ctx.fillRect(gx + 40, Y + Hh - 40, 4, 6);
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#8a6038";
    ctx.fillRect(gx + 10, Y + Hh - 6, 44, 3);
    return;
  }
  if (b.style === "moinho") {
    ctx.fillStyle = "#d8cdb0";
    fillPolygon(X + 20, Y + Hh, X + W - 20, Y + Hh, X + W - 36, Y + 10, X + 36, Y + 10);
    ctx.fillStyle = "#b8ad90";
    for (let r = 0; r < 8; r++) ctx.fillRect(X + 30, Y + 20 + r * 13, W - 60, 1);
    ctx.fillStyle = "#8c3b2e";
    fillPolygon(X + 30, Y + 14, X + W / 2, Y - 18, X + W - 30, Y + 14);
    ctx.fillStyle = "#5a3a22";
    ctx.fillRect(X + W / 2 - 8, Y + Hh - 28, 16, 28);
    win(X + W / 2 - 5, Y + 40, 10, 12);
    const cx = X + W / 2,
      cy = Y + 4,
      a = t * 0.9;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(a);
    for (let k = 0; k < 4; k++) {
      ctx.rotate(Math.PI / 2);
      ctx.fillStyle = "#6b4423";
      ctx.fillRect(-2, 0, 4, 62);
      ctx.fillStyle = "#efe3c4";
      ctx.fillRect(3, 14, 14, 46);
      ctx.strokeStyle = "#8a6a3a";
      ctx.lineWidth = 1;
      ctx.strokeRect(3, 14, 14, 46);
    }
    ctx.restore();
    ctx.fillStyle = "#4a2e17";
    circle(cx, cy, 5);
    return;
  }
  const S = BUILDING_STYLES[b.style] || BUILDING_STYLES.casa,
    roofH = Math.max(36, Math.round(Hh * 0.5));
  ctx.fillStyle = S.wall;
  ctx.fillRect(X, Y + roofH - 6, W, Hh - roofH + 6);
  if (S.stone) {
    ctx.fillStyle = "rgba(0,0,0,.12)";
    for (let r = 0; r < (Hh - roofH) / 8; r++) {
      ctx.fillRect(X, Y + roofH + r * 8, W, 1);
      for (let k = 0; k < W / 16; k++) ctx.fillRect(X + (r % 2) * 8 + k * 16, Y + roofH - 6 + r * 8, 1, 8);
    }
  } else if (S.barn) {
    ctx.strokeStyle = S.beam;
    ctx.lineWidth = 2;
    for (let k = 0; k < W / TILE; k++) {
      ctx.strokeRect(X + k * TILE + 4, Y + roofH, TILE - 8, Hh - roofH - 8);
    }
  } else {
    ctx.fillStyle = S.beam;
    ctx.fillRect(X, Y + roofH - 6, W, 4);
    ctx.fillRect(X, Y + roofH + Math.round((Hh - roofH) / 2) - 4, W, 3);
    for (let k = 0; k <= b.w; k++)
      ctx.fillRect(Math.min(X + W - 4, X + k * TILE - 2), Y + roofH - 6, 4, Hh - roofH);
  }
  ctx.fillStyle = "#7a7468";
  ctx.fillRect(X, Y + Hh - 8, W, 8);
  ctx.fillStyle = "#6a655b";
  for (let k = 0; k < W / 12; k++) ctx.fillRect(X + k * 12, Y + Hh - 8, 1, 8);
  ctx.fillStyle = S.roof;
  if (S.thatch) fillPolygon(X - 8, Y + roofH, X + W + 8, Y + roofH, X + W / 2, Y - 18);
  else fillPolygon(X - 6, Y + roofH, X + W + 6, Y + roofH, X + W - 14, Y - 10, X + 14, Y - 10);
  ctx.fillStyle = S.r2;
  for (let r = 0; r < (roofH + 10) / 7; r++) {
    const yy = Y - 8 + r * 7;
    const inset = 14 - (r * 20) / ((roofH + 10) / 7);
    ctx.fillRect(X + inset - 4, yy, W - 2 * inset + 8, 2);
  }
  ctx.fillStyle = "rgba(0,0,0,.25)";
  ctx.fillRect(X - 6, Y + roofH - 3, W + 12, 3);
  if (S.tower) {
    const tx = X + W / 2 - 16;
    ctx.fillStyle = S.wall;
    ctx.fillRect(tx, Y - 46, 32, 50);
    ctx.fillStyle = S.roof;
    fillPolygon(tx - 4, Y - 46, tx + 16, Y - 80, tx + 36, Y - 46);
    ctx.fillStyle = "#f2c14e";
    ctx.fillRect(tx + 15, Y - 92, 2, 14);
    ctx.fillRect(tx + 10, Y - 88, 12, 2);
    ctx.fillStyle = "#4a3a2a";
    ctx.beginPath();
    ctx.arc(tx + 16, Y - 22, 8, Math.PI, 0);
    ctx.fill();
    ctx.fillRect(tx + 8, Y - 22, 16, 10);
    ctx.fillStyle = "#d9a441";
    circle(tx + 16, Y - 18, 3);
  }
  if (S.chim) {
    for (let k = 0; k < S.chim; k++) {
      const cx = X + W - 30 - k * 40;
      ctx.fillStyle = "#6b6258";
      ctx.fillRect(cx, Y - 20, 10, 24);
      ctx.fillStyle = "#4a453e";
      ctx.fillRect(cx - 2, Y - 22, 14, 4);
    }
  }
  const dy = Y + Hh - TILE;
  for (let k = 0; k < b.w; k++) {
    const tx = b.x + k;
    if (b.door.includes(tx)) continue;
    const wx = X + k * TILE + 10;
    if (Hh - roofH > 30) win(wx, Y + roofH + 4, 12, 12);
  }
  for (const dxx of b.door) {
    const dx = X + (dxx - b.x) * TILE;
    ctx.fillStyle = "#3a2414";
    ctx.fillRect(dx + 6, dy + 6, 20, 26);
    ctx.beginPath();
    ctx.arc(dx + 16, dy + 8, 10, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = "#6b4423";
    ctx.fillRect(dx + 8, dy + 8, 16, 24);
    ctx.fillStyle = "#4a2e17";
    ctx.fillRect(dx + 15, dy + 8, 2, 24);
    ctx.fillStyle = "#f2c14e";
    ctx.fillRect(dx + 19, dy + 19, 2, 2);
    if (S.lantern) {
      ctx.fillStyle = night ? "#ffd66b" : "#c9b98a";
      ctx.fillRect(dx - 2, dy + 4, 6, 8);
      ctx.fillRect(dx + 28, dy + 4, 6, 8);
    }
  }
  if (S.sign) {
    const sx = X + (b.door[0] - b.x) * TILE + (b.door[0] - b.x < b.w - 1 ? 44 : -12);
    signIcon(S.sign, sx, dy + 2);
  }
  if (
    b.name &&
    Math.abs(player.x - b.door[0]) + Math.abs(player.y - (b.y + b.h)) < 7 &&
    game.mode === "world"
  ) {
    ctx.font = '700 13px "Pixelify Sans", sans-serif';
    ctx.textAlign = "center";
    const l = b.name,
      w = ctx.measureText(l).width + 12;
    ctx.fillStyle = "rgba(10,6,18,.78)";
    ctx.fillRect(X + W / 2 - w / 2, Y - 26, w, 17);
    ctx.fillStyle = "#f2c14e";
    ctx.fillText(l, X + W / 2, Y - 13);
  }
}
const WALKER_LINES = [
  "Bom dia! Dizem que a Taverna serve o melhor ensopado do reino.",
  "A Rainha Aurélia anda preocupada com os monstros.",
  "Você é quem ouve as runas? Boa sorte!",
  "Já foi à Guilda? Sempre tem trabalho por lá.",
  "Cuidado à noite, os monstros ficam mais ousados.",
  "Meu avô dizia que a escola em ruínas guarda livros mágicos.",
  "O pão da padaria sai quentinho de manhã.",
  "Dizem que existem baús dourados com tesouros lendários.",
  "O Templo dá bênçãos para quem paga uma oferenda.",
  "Vi o Tião treinando um cavalo novo hoje.",
];
function initVilaLife() {
  const z = ZONES[player.zone],
    roads = [],
    farm = [];
  game.lifeZone = player.zone;
  for (let y = 0; y < z.h; y++)
    for (let x = 0; x < z.w; x++) {
      if (z.map[y][x] === ",") roads.push([x, y]);
      if (z.map[y][x] === "g") farm.push([x, y]);
    }
  const robes = [
      "#8a3a3a",
      "#3a6a8a",
      "#5a7a3a",
      "#8a6a2a",
      "#6a3a7a",
      "#7a7a7a",
      "#a85a2a",
      "#2a5a5a",
      "#c97a8a",
      "#4a4a7a",
      "#7a8a3a",
      "#b88a4a",
      "#3a3a3a",
      "#d9c08a",
      "#5a8aa8",
      "#9a4a6a",
    ],
    hairs = ["#3a2414", "#d9a441", "#1a1a1a", "#8a3a1a", "#d9d9d9", "#5a3a22"];
  game.walkers = [];
  const wn = WALKER_NAMES.slice().sort(() => Math.random() - 0.5);
  // No Simulador de Vida a vila fica mais cheia.
  const walkerCount = Math.round((player.zone === "vila" ? 28 : 24) * currentQuality().walkers * (lifeMode() ? 1.5 : 1));
  for (let i = 0; i < (roads.length ? walkerCount : 0); i++) {
    const [x, y] = roads[Math.floor(Math.random() * roads.length)];
    game.walkers.push({
      x,
      y,
      rx: x,
      ry: y,
      timer: Math.random() * 2,
      dir: "down",
      moving: false,
      robe: robes[Math.floor(Math.random() * robes.length)],
      hair: hairs[Math.floor(Math.random() * hairs.length)],
      hat: i % 5 === 0 ? ["#5a3a22", "#3a4a6a", "#7a2a2a", "#d9c08a"][i % 4] : null,
      seed: Math.floor(Math.random() * 100000),
      line: WALKER_LINES[i % WALKER_LINES.length],
      nm: i % 9 === 4 ? ELF_NAMES[i % ELF_NAMES.length] : wn[i % wn.length],
      elf: i % 9 === 4,
    });
  }
  addContactWalkers();
  game.farmers = [];
  if (farm.length && player.zone === "vila")
    for (let i = 0; i < 3; i++) {
      const [x, y] = farm[Math.floor(Math.random() * farm.length)];
      game.farmers.push({
        x,
        y,
        rx: x,
        ry: y,
        timer: Math.random() * 2,
        dir: "down",
        robe: ["#8a6a2a", "#5a7a3a", "#7a5a3a"][i],
        hair: ["#3a2414", "#d9d9d9", "#8a3a1a"][i],
        nm: ["Lavrador Zeca", "Lavradora Dita", "Lavrador Tonho"][i],
      });
    }
  game.kidsP = [];
  if (player.zone === "vila")
    for (let i = 0; i < 4; i++) {
      const x = 27 + Math.floor(Math.random() * 9),
        y = 22 + Math.floor(Math.random() * 2);
      game.kidsP.push({
        x,
        y,
        rx: x,
        ry: y,
        timer: Math.random(),
        dir: "down",
        robe: ["#e86a9a", "#4a9ad9", "#e8a02a", "#7ad36b"][i],
        hair: ["#d9a441", "#3a2414", "#1a1a1a", "#8a3a1a"][i],
        nm: ["Tico", "Nina", "Juca", "Mel"][i],
      });
    }
  game.cart = null;
  game.cartT = 8;
  game.chicks = [];
  if (farm.length)
    for (let i = 0; i < 7; i++) {
      const [x, y] = farm[Math.floor(Math.random() * farm.length)];
      game.chicks.push({
        x,
        y,
        rx: x,
        ry: y,
        timer: Math.random(),
        flip: false,
      });
    }
  game.smoke = [];
  game.roam = z.npcList
    .filter(([x, y, id]) => ROAMERS.has(id) && !isStallKeeper(x, y))
    .map(([x, y, id]) => ({
      id,
      hx: x,
      hy: y,
      x,
      y,
      rx: x,
      ry: y,
      timer: Math.random() * 2,
      dir: "down",
    }));
  initTownExtras();
  game.pets = [];
  for (let i = 0; i < (roads.length ? (player.zone === "vila" ? 6 : 3) : 0); i++) {
    const [x, y] = roads[Math.floor(Math.random() * roads.length)];
    game.pets.push({
      x,
      y,
      rx: x,
      ry: y,
      timer: Math.random(),
      flip: false,
      cat: i % 2 === 0,
      col: ["#d9a441", "#3a2a1a", "#e8e4dc", "#8a6a4a"][i % 4],
    });
  }
}
/** Quem ainda tem magia depois do Silêncio (os únicos com chapéu pontudo e cajado). */
const MAGIC_KEEPERS = new Set(["odelia", "selene"]);

/* ===================== ELFOS ===================== */

const ELF_NAMES = ["Elandril", "Sylwen", "Faelar", "Mirethil", "Aerin", "Thalion", "Lirael", "Caerwyn"];
const ELF_LINES = [
  "Nós, elfos, ainda ouvimos o eco das runas nas folhas. Fraco, mas está lá.",
  "Trezentos anos de Silêncio... para nós, foi como uma longa noite sem estrelas.",
  "O Ent era nosso amigo. Liberte-o e a floresta voltará a cantar.",
  "Humanos correm tanto. A floresta ensina a esperar.",
  "Cuidado com os lobos ocos. Eles perderam a alma junto com a magia.",
  "Você carrega uma runa? Dá para sentir o calor dela daqui.",
];
const ELF_ROBES = ["#3a6a3a", "#5a7a4a", "#2a5a4a", "#6a8a3a"];
const ELF_HAIRS = ["#e8e0c0", "#d9d9d9", "#c9a050", "#8ab0a0"];

function makeElf(x, y, i) {
  return {
    x,
    y,
    rx: x,
    ry: y,
    hx: x,
    hy: y,
    timer: Math.random() * 2,
    dir: "down",
    moving: false,
    nm: ELF_NAMES[i % ELF_NAMES.length],
    robe: ELF_ROBES[i % 4],
    hair: ELF_HAIRS[i % 4],
    elf: true,
  };
}

/** Elfos andando pelo Bosque Murmurante. */
function spawnForestElves() {
  game.elves = [];
  if (player.zone !== "bosque") return;
  const z = ZONES.bosque;
  const entry = Object.values(z.open)[0] || [z.w - 3, 20];
  const spots = z.spawn.filter((p) => manhattan(p, entry) > 6 && manhattan(p, entry) < 26);
  for (let i = 0; i < 4 && spots.length; i++) {
    const [x, y] = spots.splice(Math.floor(Math.random() * spots.length), 1)[0];
    game.elves.push(makeElf(x, y, i));
  }
}

function updateElves(dt) {
  for (const e of game.elves || []) {
    e.timer -= dt;
    if (e.timer <= 0) {
      e.timer = 0.6 + Math.random() * 1.8;
      e.moving = false;
      if (Math.random() < 0.65) {
        const [dx, dy] = DIRS4[Math.floor(Math.random() * 4)];
        const nx = e.x + dx,
          ny = e.y + dy;
        const free =
          walkable(player.zone, nx, ny) &&
          !(nx === player.x && ny === player.y) &&
          !game.mobs.some((m) => m.x === nx && m.y === ny);
        e.dir = dx > 0 ? "right" : dx < 0 ? "left" : dy > 0 ? "down" : "up";
        if (free && manhattan([nx, ny], [e.hx, e.hy]) <= 5) {
          e.x = nx;
          e.y = ny;
          e.moving = true;
        }
      }
    }
    e.rx += (e.x - e.rx) * Math.min(1, dt * 6);
    e.ry += (e.y - e.ry) * Math.min(1, dt * 6);
  }
}

function drawElves(t, inView) {
  for (const e of game.elves || []) {
    if (!inView(Math.round(e.rx), Math.round(e.ry))) continue;
    ctx.fillStyle = "rgba(0,0,0,.22)";
    ctx.beginPath();
    ctx.ellipse(e.rx * TILE + 16, e.ry * TILE + 30, 8, 3, 0, 0, 7);
    ctx.fill();
    drawSprite(
      elfRects(e.robe, e.hair, e.dir, walkFrame(e.moving, t)),
      e.rx * TILE,
      e.ry * TILE,
      2,
      e.dir === "left",
    );
  }
}

const elfAt = (x, y) => (game.elves || []).find((e) => e.x === x && e.y === y);

/* ===================== ROTINA DOS MORADORES ===================== */

const isRoadTile = (z, x, y) => {
  const c = z.map[y] && z.map[y][x];
  return c === "," || c === "=" || c === "n";
};

const ACTIVITY_ICON = {
  shop: ["coin", "coin", "apple"],
  drink: ["sweat"],
  pray: ["sparkle"],
  tavern: ["mug", "note"],
  door: [],
  look: ["eye"],
  sit: ["smile"],
};

/** Lugares aonde os moradores vão: barracas, portas, fonte, bancos e a praça. */
function buildPointsOfInterest(z) {
  const points = [];
  const add = (x, y, kind, face) => isRoadTile(z, x, y) && points.push({ x, y, kind, face });
  for (const key in z.town.stalls) {
    const [x, y] = key.split(",").map(Number);
    add(x, y + 1, "shop", "up");
  }
  for (const b of z.town.bld) {
    if (!b.name) continue;
    const kind = b.style === "templo" ? "pray" : b.style === "taverna" ? "tavern" : "door";
    add(b.door[0], b.y + b.h, kind, "up");
  }
  for (let y = 1; y < z.h - 1; y++)
    for (let x = 1; x < z.w - 1; x++) {
      const c = z.map[y][x];
      if (c === "n") points.push({ x, y, kind: "sit", face: "down" });
      if (c === "~" && player.zone === "vila" && inPlazaT("vila", x, y))
        for (const [dx, dy, face] of [
          [0, 1, "up"],
          [0, -1, "down"],
          [1, 0, "left"],
          [-1, 0, "right"],
        ])
          add(x + dx, y + dy, "drink", face);
    }
  for (let i = 0; i < 12; i++) {
    const x = 26 + Math.floor(Math.random() * 12);
    const y = 16 + Math.floor(Math.random() * 8);
    if (player.zone === "vila") add(x, y, "look", "down");
  }
  z.pois = points;
}

/** Caminho mais curto pelas ruas (BFS). */
function findRoadPath(z, sx, sy, tx, ty) {
  const key = (x, y) => y * z.w + x;
  const prev = new Map([[key(sx, sy), null]]);
  const queue = [[sx, sy]];
  while (queue.length) {
    const [x, y] = queue.shift();
    if (x === tx && y === ty) {
      const path = [];
      let k = key(x, y);
      while (prev.get(k) !== null) {
        path.unshift([k % z.w, Math.floor(k / z.w)]);
        k = prev.get(k);
      }
      return path;
    }
    if (prev.size > 2500) break;
    for (const [dx, dy] of DIRS4) {
      const nx = x + dx,
        ny = y + dy,
        nk = key(nx, ny);
      if (!prev.has(nk) && isRoadTile(z, nx, ny)) {
        prev.set(nk, key(x, y));
        queue.push([nx, ny]);
      }
    }
  }
  return null;
}

function chooseNextDestination(w, z, festivalOnly) {
  if (!z.pois) buildPointsOfInterest(z);
  let options = z.pois.filter((p) => p !== w.goal);
  if (festivalOnly) options = options.filter((p) => inPlazaT("vila", p.x, p.y));
  if (!options.length) return;
  for (let tries = 0; tries < 4; tries++) {
    const goal = options[Math.floor(Math.random() * options.length)];
    const path = findRoadPath(z, w.x, w.y, goal.x, goal.y);
    if (path && path.length < 70) {
      w.goal = goal;
      w.path = path;
      return;
    }
  }
}

function startActivity(w) {
  const goal = w.goal;
  w.dir = goal.face;
  w.activity = 3 + Math.random() * 6;
  if (goal.kind === "sit") w.sit = w.activity;
  if (goal.kind === "door" && Math.random() < 0.6) w.inside = 5 + Math.random() * 10;
  const icons = ACTIVITY_ICON[goal.kind] || [];
  if (icons.length && Math.random() < 0.55)
    game.bubbles.push({ x: w.x, y: w.y, icon: icons[Math.floor(Math.random() * icons.length)], t: 2.2 });
}

/** Cada morador anda até um destino, faz alguma coisa lá e escolhe o próximo. */
function updateWalkerRoutine(w, z, dt, festivalOnly) {
  if (w.sit > 0 || w.chat > 0) return;
  if (w.flee > 0) w.flee -= dt;
  if (w.inside > 0) {
    w.inside -= dt;
    return;
  }
  if (w.activity > 0) {
    w.activity -= dt;
    w.moving = false;
    if (Math.random() < dt * 0.4)
      w.dir = ["down", "left", "right", w.goal ? w.goal.face : "up"][Math.floor(Math.random() * 4)];
  } else {
    w.timer -= dt;
    if (w.timer <= 0) {
      w.timer = w.flee > 0 ? 0.16 : 0.3 + Math.random() * 0.12;
      if (!w.path || !w.path.length) {
        if (w.goal && w.x === w.goal.x && w.y === w.goal.y && !w.didActivity) {
          w.didActivity = true;
          startActivity(w);
        } else {
          w.didActivity = false;
          chooseNextDestination(w, z, festivalOnly);
        }
        w.moving = false;
      } else {
        const [nx, ny] = w.path[0];
        const blocked =
          (nx === player.x && ny === player.y) ||
          game.walkers.some((o) => o !== w && o.x === nx && o.y === ny && !o.inside);
        if (blocked) {
          w.moving = false;
          if (Math.random() < 0.3) w.path = null;
        } else {
          w.path.shift();
          w.dir = nx > w.x ? "right" : nx < w.x ? "left" : ny > w.y ? "down" : "up";
          w.x = nx;
          w.y = ny;
          w.moving = true;
        }
      }
    }
  }
  w.rx += (w.x - w.rx) * Math.min(1, dt * 7);
  w.ry += (w.y - w.ry) * Math.min(1, dt * 7);
}

function updateVilaLife(dt) {
  updateTownExtras(dt);
  const z = ZONES[player.zone];
  if (!z.town) return;
  if (game.lifeZone !== player.zone) initVilaLife();
  const ok = (x, y, c) => x > 0 && y > 0 && x < z.w - 1 && y < z.h - 1 && z.map[y][x] === c;
  for (const r of game.roam || []) {
    r.timer -= dt;
    if (r.timer <= 0) {
      r.timer = 1 + Math.random() * 2.5;
      const near = Math.abs(player.x - r.x) + Math.abs(player.y - r.y) <= 2;
      if (near) {
        r.dir =
          Math.abs(player.x - r.x) >= Math.abs(player.y - r.y)
            ? player.x > r.x
              ? "right"
              : "left"
            : player.y > r.y
              ? "down"
              : "up";
        r.moving = false;
      } else if (Math.random() < 0.6) {
        const d = [
            [1, 0, "right"],
            [-1, 0, "left"],
            [0, 1, "down"],
            [0, -1, "up"],
          ][Math.floor(Math.random() * 4)],
          nx = r.x + d[0],
          ny = r.y + d[1];
        if (
          Math.abs(nx - r.hx) + Math.abs(ny - r.hy) <= 3 &&
          walkable(player.zone, nx, ny) &&
          !(nx === player.x && ny === player.y) &&
          !game.roam.some((o) => o !== r && o.x === nx && o.y === ny) &&
          !game.mobs.some((m) => m.x === nx && m.y === ny)
        ) {
          r.x = nx;
          r.y = ny;
          r.dir = d[2];
          r.moving = true;
        } else r.dir = d[2];
      } else r.dir = ["down", "left", "right", "up"][Math.floor(Math.random() * 4)];
    }
    r.rx += (r.x - r.rx) * Math.min(1, dt * 5);
    r.ry += (r.y - r.ry) * Math.min(1, dt * 5);
  }
  const fest = festivalToday() && player.zone === "vila",
    inPlaza = (x, y) => x >= 25 && x <= 38 && y >= 15 && y <= 24;
  if (fest && !game.festPlaced) {
    game.festPlaced = true;
    const pl = [];
    for (let y = 15; y <= 24; y++) for (let x = 25; x <= 38; x++) if (z.map[y][x] === ",") pl.push([x, y]);
    for (const w of game.walkers) {
      const [x, y] = pl[Math.floor(Math.random() * pl.length)];
      w.x = w.rx = x;
      w.y = w.ry = y;
    }
  }
  if (!fest) game.festPlaced = false;
  game.shoutT = (game.shoutT ?? 4) - dt;
  if (game.shoutT <= 0 && !walkersAway()) {
    game.shoutT = 6 + Math.random() * 7;
    const sk = z.npcList.filter(
      ([x, y, id]) =>
        isStallKeeper(x, y) && !npcAsleep(id) && Math.abs(x - player.x) + Math.abs(y - player.y) <= 9,
    );
    if (sk.length) {
      const [x, y, id] = sk[Math.floor(Math.random() * sk.length)];
      const SH = {
        bruno: "Poções fresquinhas! Curam até coração partido!",
        rosa: "Olha a maçã dourada! Docinha, docinha!",
        doran: "Cajados feitos à mão! Qualidade de verdade!",
        peixeiro: "Peixe fresco! Pescado hoje de manhã!",
        flor: "Chá de ervas pra acalmar a alma!",
        lucio: "Anéis e joias! Para quem ama de verdade!",
        cocada: "Doce de abóbora quentinho!",
        florista: "Flores! Leve um buquê pra quem você ama!",
        bazarista: "Tem de tudo no bazar! Pechincha!",
        abrigo: "Adote um bichinho! Eles precisam de amor!",
        chazeira: "Chá quentinho e mel puro!",
        brinqueiro: "Brinquedos pra criançada!",
      };
      game.shouts = (game.shouts || []).concat([
        {
          x,
          y,
          txt: SH[id] || "Venham, venham! Preço bom!",
          t: 4,
        },
      ]);
    }
  }
  game.shouts = (game.shouts || []).filter((q) => (q.t -= dt) > 0);
  if (game.gosT <= 0 && !walkersAway()) {
    game.gosT = 8 + Math.random() * 8;
    const near = game.walkers.filter((w) => Math.abs(w.x - player.x) + Math.abs(w.y - player.y) <= 5);
    if (near.length) {
      const w = near[Math.floor(Math.random() * near.length)];
      const gl = gossipLines();
      w.sayT = 5.5;
      w.sayTxt =
        Math.random() < 0.7
          ? gl[Math.floor(Math.random() * gl.length)]
          : WALKER_POOL[Math.floor(Math.random() * WALKER_POOL.length)];
    }
  }
  for (const w of game.walkers) if (w.sayT > 0) w.sayT -= dt;
  if (paradeActive() && Math.random() < dt * 0.8) {
    const w = game.walkers[Math.floor(Math.random() * game.walkers.length)];
    if (w && Math.abs(w.x - player.x) + Math.abs(w.y - player.y) < 12)
      game.bubbles.push({
        x: w.x,
        y: w.y,
        icon: ["party", "crown", "heart", "party"][Math.floor(Math.random() * 4)],
        t: 2,
      });
  }
  const dayOut =
    !sleepTime() && !game.raid && !(player.weather === "chuva" || player.weather === "tempestade");
  for (const f of game.farmers || []) {
    f.timer -= dt;
    if (f.timer <= 0) {
      f.timer = 1.2 + Math.random() * 2.5;
      f.work = Math.random() < 0.5;
      if (!f.work) {
        const d = DIRS4[Math.floor(Math.random() * 4)];
        if (ok(f.x + d[0], f.y + d[1], "g") && !(f.x + d[0] === player.x && f.y + d[1] === player.y)) {
          f.x += d[0];
          f.y += d[1];
          f.dir = d[0] > 0 ? "right" : d[0] < 0 ? "left" : d[1] > 0 ? "down" : "up";
        }
      }
    }
    f.rx += (f.x - f.rx) * Math.min(1, dt * 5);
    f.ry += (f.y - f.ry) * Math.min(1, dt * 5);
  }
  const kidOk = (x, y) =>
    x >= 25 && x <= 38 && y >= 15 && y <= 24 && z.map[y][x] === "," && !(x === player.x && y === player.y);
  for (const k of game.kidsP || []) {
    k.timer -= dt;
    if (k.timer <= 0) {
      k.timer = 0.22 + Math.random() * 0.35;
      const tg = game.kidsP[(game.kidsP.indexOf(k) + 1) % game.kidsP.length];
      let d = Math.random() < 0.5 ? [Math.sign(tg.x - k.x) || 1, 0] : DIRS4[Math.floor(Math.random() * 4)];
      if (game.kidsP.indexOf(k) === 0) d = [-(Math.sign(tg.x - k.x) || 1), 0];
      if (Math.random() < 0.4) d = DIRS4[Math.floor(Math.random() * 4)];
      if (kidOk(k.x + d[0], k.y + d[1])) {
        k.x += d[0];
        k.y += d[1];
        k.dir = d[0] > 0 ? "right" : d[0] < 0 ? "left" : d[1] > 0 ? "down" : "up";
      }
    }
    k.rx += (k.x - k.rx) * Math.min(1, dt * 8);
    k.ry += (k.y - k.ry) * Math.min(1, dt * 8);
  }
  if (player.zone === "vila" && dayOut) {
    game.cartT -= dt;
    if (!game.cart && game.cartT <= 0) {
      const ltr = Math.random() < 0.5;
      game.cart = {
        x: ltr ? -2 : 65,
        y: 26,
        v: ltr ? 1.6 : -1.6,
      };
    }
    if (game.cart) {
      game.cart.x += game.cart.v * dt;
      if (game.cart.x < -3 || game.cart.x > 66) {
        game.cart = null;
        game.cartT = 25 + Math.random() * 25;
      }
    }
  }
  if (!walkersAway())
    for (const w of game.walkers) {
      if (w.sit > 0) {
        w.sit -= dt;
        continue;
      }
      if (w.chat > 0) {
        w.chat -= dt;
        continue;
      }
      if (Math.random() < dt * 0.05) {
        const b2 = DIRS4.find(([dx, dy]) => tileAt(player.zone, w.x + dx, w.y + dy) === "n");
        if (b2) {
          w.sit = 6 + Math.random() * 8;
          w.dir = b2[1] < 0 ? "up" : b2[1] > 0 ? "down" : b2[0] < 0 ? "left" : "right";
          continue;
        }
      }
      if (Math.random() < dt * 0.04) {
        const o = game.walkers.find(
          (q) => q !== w && !q.chat && Math.abs(q.x - w.x) + Math.abs(q.y - w.y) === 1,
        );
        if (o) {
          w.chat = o.chat = 4 + Math.random() * 4;
          w.dir = o.x > w.x ? "right" : o.x < w.x ? "left" : o.y > w.y ? "down" : "up";
          o.dir = {
            right: "left",
            left: "right",
            up: "down",
            down: "up",
          }[w.dir];
          game.bubbles.push({
            x: w.x,
            y: w.y,
            icon: "chat",
            t: 2.5,
          });
          continue;
        }
      }
    }
  if (!walkersAway()) for (const w of game.walkers) updateWalkerRoutine(w, z, dt, fest);
  for (const c of game.pets || []) {
    c.timer -= dt;
    if (c.timer <= 0) {
      c.timer = 0.25 + Math.random() * 1.5;
      const d = DIRS4[Math.floor(Math.random() * 4)];
      if (ok(c.x + d[0], c.y + d[1], ",")) {
        c.x += d[0];
        c.y += d[1];
        c.flip = d[0] < 0;
      }
    }
    c.rx += (c.x - c.rx) * Math.min(1, dt * 7);
    c.ry += (c.y - c.ry) * Math.min(1, dt * 7);
  }
  for (const c of game.chicks) {
    c.timer -= dt;
    if (c.timer <= 0) {
      c.timer = 0.3 + Math.random() * 1.2;
      const d = DIRS4[Math.floor(Math.random() * 4)];
      if (ok(c.x + d[0], c.y + d[1], "g")) {
        c.x += d[0];
        c.y += d[1];
        c.flip = d[0] < 0;
      }
    }
    c.rx += (c.x - c.rx) * Math.min(1, dt * 8);
    c.ry += (c.y - c.ry) * Math.min(1, dt * 8);
  }
  game.smokeT = (game.smokeT || 0) - dt;
  if (game.smokeT <= 0) {
    game.smokeT = 0.35;
    for (const b of z.town.bld) {
      const S = BUILDING_STYLES[b.style];
      if (!S || !S.chim || Math.abs(b.x - player.x) > 16 || Math.abs(b.y - player.y) > 13) continue;
      for (let k = 0; k < S.chim; k++)
        game.smoke.push({
          x: b.x * TILE + b.w * TILE - 25 - k * 40,
          y: b.y * TILE - 22,
          vx: (Math.random() - 0.3) * 8,
          vy: -18 - Math.random() * 8,
          life: 2.4,
          max: 2.4,
          r: 4,
        });
    }
  }
  game.smoke = game.smoke.filter((p) => {
    p.life -= dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.r += dt * 4;
    return p.life > 0;
  });
}
function drawVilaLife(t) {
  for (const p of game.smoke || []) {
    ctx.fillStyle = `rgba(200,200,205,${(0.35 * p.life) / p.max})`;
    circle(p.x, p.y, p.r);
  }
}
function drawWeather(t, th, psx, psy) {
  if (!outdoorTheme(th)) return;
  const w = player.weather || "sol",
    sid = season().id;
  const tint = {
    pri: "rgba(140,255,160,.03)",
    ver: "rgba(255,220,120,.05)",
    out: "rgba(255,150,60,.06)",
    inv: "rgba(200,220,255,.08)",
  }[sid];
  ctx.fillStyle = tint;
  ctx.fillRect(0, 0, viewWidth, 480);
  if (w === "nublado") {
    ctx.fillStyle = "rgba(60,64,84,.16)";
    ctx.fillRect(0, 0, viewWidth, 480);
  }
  if (w === "chuva" || w === "tempestade") {
    ctx.fillStyle = w === "tempestade" ? "rgba(20,24,44,.32)" : "rgba(40,50,80,.2)";
    ctx.fillRect(0, 0, viewWidth, 480);
    ctx.strokeStyle = w === "tempestade" ? "rgba(190,210,255,.55)" : "rgba(170,200,240,.45)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    const n = w === "tempestade" ? 170 : 110,
      sl = w === "tempestade" ? 7 : 3;
    for (let i = 0; i < n; i++) {
      const x = ((i * 73.7) % (viewWidth + 40)) - 20 + Math.sin(i) * 6,
        sp = w === "tempestade" ? 820 : 620,
        y = ((i * 131.3 + t * sp * (0.85 + (i % 5) * 0.06)) % 520) - 20;
      ctx.moveTo(x, y);
      ctx.lineTo(x, y + (w === "tempestade" ? 18 : 13));
    }
    ctx.stroke();
    ctx.fillStyle = "rgba(200,220,255,.35)";
    for (let i = 0; i < 14; i++) {
      const x = (i * 157 + t * 13) % viewWidth,
        y = (i * 97) % 480,
        r = (t * 3 + i) % 1;
      ctx.fillRect(x - r * 4, y, r * 8, 1);
    }
    if (w === "tempestade") {
      game.ltT = (game.ltT || 3) - 0.016;
      if (game.ltT <= 0) {
        game.ltT = 3 + Math.random() * 6;
        game.lt = 0.6;
        setTimeout(
          () => {
            playSound(60, 0.9, "sawtooth", 0.06);
            playSound(45, 1.2, "square", 0.04);
          },
          300 + Math.random() * 700,
        );
      }
      if (game.lt > 0) {
        ctx.fillStyle = `rgba(240,245,255,${game.lt})`;
        ctx.fillRect(0, 0, viewWidth, 480);
        game.lt -= 0.03;
      }
    }
  }
  if (w === "neve") {
    ctx.fillStyle = "rgba(220,230,255,.1)";
    ctx.fillRect(0, 0, viewWidth, 480);
    ctx.fillStyle = "rgba(255,255,255,.9)";
    for (let i = 0; i < 130; i++) {
      const sp = 0.5 + (i % 5) * 0.15,
        x = (i * 61.3 + Math.sin(t * 0.8 + i) * 24 + t * 10) % viewWidth,
        y = ((i * 89.7 + t * 40 * sp) % 490) - 5;
      ctx.fillRect(x, y, i % 3 ? 2 : 3, i % 3 ? 2 : 3);
    }
  }
  if (w === "neblina") {
    const g = ctx.createRadialGradient(psx, psy, 70, psx, psy, 300);
    g.addColorStop(0, "rgba(210,215,225,.08)");
    g.addColorStop(1, "rgba(210,215,225,.78)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, viewWidth, 480);
    ctx.fillStyle = "rgba(230,232,240,.12)";
    for (let i = 0; i < 4; i++) {
      const x = ((i * 300 + t * 12) % (viewWidth + 400)) - 200;
      ctx.beginPath();
      ctx.ellipse(x, 120 + i * 100, 220, 40, 0, 0, 7);
      ctx.fill();
    }
  }
  if (w === "sol" && !isNight() && sid === "ver") {
    const g = ctx.createRadialGradient(viewWidth - 60, 20, 10, viewWidth - 60, 20, 260);
    g.addColorStop(0, "rgba(255,240,180,.22)");
    g.addColorStop(1, "rgba(255,240,180,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, viewWidth, 480);
  }
  if (sid === "out" && w !== "neve") {
    for (let i = 0; i < 14; i++) {
      const lx = (i * 83 + t * 24) % viewWidth,
        ly = (i * 57 + t * 30 + Math.sin(t + i) * 10) % 480;
      ctx.fillStyle = ["#c9622a", "#e0a040", "#a8441a"][i % 3];
      ctx.fillRect(lx + Math.sin(t * 2 + i) * 10, ly, 3, 2);
    }
  }
  if (sid === "pri" && w === "sol") {
    for (let i = 0; i < 10; i++) {
      const lx = (i * 97 + t * 18) % viewWidth,
        ly = (i * 61 + t * 22) % 480;
      ctx.fillStyle = i % 2 ? "#ffb3d0" : "#fff";
      ctx.fillRect(lx + Math.sin(t * 2 + i) * 8, ly, 2, 2);
    }
  }
}
function dayOutside() {
  return !sleepTime() && !game.raid && !(player.weather === "chuva" || player.weather === "tempestade");
}
function walkersAway() {
  return (
    (sleepTime() && !festivalToday()) ||
    !!game.raid ||
    ((player.weather === "chuva" || player.weather === "tempestade") && !festivalToday())
  );
}
function drawAmbience(t, th) {
  const out = !["torre", "escola", "casa", "interior"].includes(th);
  if (!out || !currentQuality().ambience) return;
  const night = nightAlpha() > 0.3;
  game.amb3 =
    game.amb3 ||
    Array.from(
      {
        length: 14,
      },
      (_, i) => ({
        x: Math.random() * viewWidth,
        y: Math.random() * 480,
        p: Math.random() * 6,
        c: ["#fff3b0", "#ff9ac8", "#9fd0ff", "#f2c14e"][i % 4],
      }),
    );
  for (const a of game.amb3) {
    a.p += 0.016;
    if (night && (th === "vila" || th === "bosque" || th === "porto" || th === "serra")) {
      const al = 0.4 + 0.4 * Math.sin(t * 3 + a.p * 7);
      ctx.fillStyle = `rgba(200,255,120,${al})`;
      ctx.fillRect(a.x + Math.sin(t * 0.7 + a.p) * 30, a.y + Math.cos(t * 0.5 + a.p) * 20, 2, 2);
    } else if (!night && (th === "vila" || th === "bosque" || th === "porto") && a.p % 6 < 3) {
      const bx = (a.x + t * 12 + Math.sin(t + a.p) * 20) % viewWidth,
        by = a.y + Math.sin(t * 2 + a.p) * 10,
        fl = Math.sin(t * 14 + a.p) > 0 ? 3 : 1;
      ctx.fillStyle = a.c;
      ctx.fillRect(bx - fl, by, fl, 2);
      ctx.fillRect(bx + 1, by, fl, 2);
    }
  }
  if (th === "bosque") {
    for (let i = 0; i < 8; i++) {
      const lx = (i * 97 + t * 20) % viewWidth,
        ly = (i * 61 + t * 35) % 480;
      ctx.fillStyle = i % 2 ? "#c97a2a" : "#8aa83a";
      ctx.fillRect(lx + Math.sin(t * 2 + i) * 8, ly, 3, 2);
    }
  }
  if (!night) {
    game.cloudT = (game.cloudT || 0) + 0.016;
    ctx.fillStyle = "rgba(20,20,40,.07)";
    for (let i = 0; i < 3; i++) {
      const cx = ((i * 420 + game.cloudT * 14) % (viewWidth + 400)) - 200,
        cy = 80 + i * 140;
      ctx.beginPath();
      ctx.ellipse(cx, cy, 140, 50, 0, 0, 7);
      ctx.ellipse(cx + 90, cy + 20, 90, 40, 0, 0, 7);
      ctx.fill();
    }
    const bt = (t * 0.06) % 1;
    if (bt < 0.5) {
      const bx = -60 + bt * 2 * (viewWidth + 120),
        by = 60 + Math.sin(t * 0.3) * 30;
      ctx.fillStyle = "#2a2a3a";
      for (let k = 0; k < 5; k++) {
        const ox = bx - k * 18,
          oy = by + Math.abs(k - 2) * 10,
          w = Math.sin(t * 10 + k) > 0;
        ctx.fillRect(ox - 4, oy - (w ? 2 : 0), 4, 1);
        ctx.fillRect(ox, oy, 1, 1);
        ctx.fillRect(ox + 1, oy - (w ? 2 : 0), 4, 1);
      }
    }
  }
}
function drawSpeech(sp) {
  ctx.font = '10px "VT323", monospace';
  const words = sp.txt.split(" ");
  const lines = [];
  let cur = "";
  for (const w of words) {
    if (ctx.measureText(cur + " " + w).width > 150 && cur) {
      lines.push(cur);
      cur = w;
    } else cur = cur ? cur + " " + w : w;
  }
  if (cur) lines.push(cur);
  const ls = lines.slice(0, 4),
    wd = Math.max(...ls.map((l) => ctx.measureText(l).width)) + 10,
    ht = ls.length * 10 + 6,
    X = sp.x - wd / 2,
    Y = sp.y - ht - 6;
  ctx.globalAlpha = sp.a;
  ctx.fillStyle = "rgba(255,252,240,.95)";
  ctx.fillRect(X, Y, wd, ht);
  ctx.strokeStyle = "#3a2414";
  ctx.lineWidth = 1;
  ctx.strokeRect(X + 0.5, Y + 0.5, wd - 1, ht - 1);
  fillPolygon(sp.x - 3, Y + ht, sp.x + 3, Y + ht, sp.x, Y + ht + 5);
  ctx.fillStyle = "#2a1a0c";
  ctx.textAlign = "left";
  ls.forEach((l, i) => ctx.fillText(l, X + 5, Y + 12 + i * 10));
  ctx.globalAlpha = 1;
}
function drawAura(cx, cy, t, a, back) {
  if (!a || a === "nenhuma") return;
  const cols = {
    brilho: ["#ffe066", "#fff3b0"],
    folhas: ["#7ad36b", "#c9a83a"],
    coracoes: ["#ff6b8a", "#ffb3c8"],
    chamas: ["#ff7a3d", "#ffd166"],
    gelo: ["#bfe8ff", "#ffffff"],
    estrelas: ["#c77dff", "#ffffff"],
  }[a];
  for (let i = 0; i < 6; i++) {
    const an = t * 1.6 + (i * Math.PI) / 3,
      front = Math.sin(an) > 0;
    if (front === back) continue;
    const x = cx + Math.cos(an) * 15,
      y = cy + Math.sin(an) * 5 + (a === "chamas" ? -((t * 30 + i * 7) % 18) : 0) - 4;
    ctx.fillStyle = cols[i % 2];
    ctx.globalAlpha = 0.85;
    if (a === "coracoes") {
      ctx.font = "8px sans-serif";
      ctx.textAlign = "center";
      drawPixelIcon("heart", x, y, 1);
    } else if (a === "gelo") {
      fillPolygon(x, y - 3, x + 2, y, x, y + 3, x - 2, y);
    } else ctx.fillRect(x - 1, y - 1, a === "estrelas" ? 2 : 3, a === "estrelas" ? 2 : 3);
    ctx.globalAlpha = 1;
  }
}
function walkerAt(x, y) {
  if (walkersAway()) return null;
  return (game.walkers || []).find((w) => w.x === x && w.y === y && !(w.inside > 0));
}
function drawWorld(t) {
  const z = ZONES[player.zone];
  const Z = game.zoom,
    VWz = viewWidth / Z,
    VHz = 480 / Z;
  const camX =
      z.w * TILE < VWz
        ? -Math.round((VWz - z.w * TILE) / 2)
        : Math.round(clampi(player.rx * TILE + 16 - VWz / 2, 0, z.w * TILE - VWz)),
    camY =
      z.h * TILE < VHz
        ? -Math.round((VHz - z.h * TILE) / 2)
        : Math.round(clampi(player.ry * TILE + 16 - VHz / 2, 0, z.h * TILE - VHz));
  game.cam = { camX, camY, Z };
  const x0 = Math.max(0, Math.floor(camX / TILE)),
    y0 = Math.max(0, Math.floor(camY / TILE)),
    x1 = Math.min(z.w - 1, x0 + Math.ceil(VWz / TILE) + 1),
    y1 = Math.min(z.h - 1, y0 + Math.ceil(VHz / TILE) + 1);
  const inView = (x, y) => x >= x0 - 1 && x <= x1 + 1 && y >= y0 - 1 && y <= y1 + 1;
  ctx.fillStyle = "#0a0710";
  ctx.fillRect(0, 0, viewWidth, 480);
  ctx.save();
  ctx.scale(Z, Z);
  ctx.translate(-camX, -camY);
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) drawTile(player.zone, x, y, z.map[y][x], t);
  const list = [];
  for (const [x, y, id] of z.npcList) {
    if (!inView(x, y) || npcHidden(id)) continue;
    const n = NPCS[id];
    list.push({
      y,
      draw: () => {
        ctx.save();
        if (n.ghost) ctx.globalAlpha = 0.6 + 0.2 * Math.sin(t * 2);
        ctx.fillStyle = "rgba(0,0,0,.25)";
        ctx.beginPath();
        ctx.ellipse(x * TILE + 16, y * TILE + 30, 9, 3, 0, 0, 7);
        ctx.fill();
        const fd =
          Math.abs(player.x - x) + Math.abs(player.y - y) <= 4
            ? Math.abs(player.x - x) >= Math.abs(player.y - y)
              ? player.x > x
                ? "right"
                : "left"
              : player.y > y
                ? "down"
                : "up"
            : Math.floor(t / 3 + x) % 4 === 0
              ? "left"
              : Math.floor(t / 3 + x) % 4 === 1
                ? "right"
                : "down";
        const sk = isStallKeeper(x, y),
          ox = sk ? Math.round(Math.sin(t * 0.6 + x * 1.7) * 6) : 0,
          busy = sk && Math.sin(t * 1.3 + x) > 0.7;
        drawSprite(
          wizardRects(n.robe, n.hat, n.hair, MAGIC_KEEPERS.has(id) ? "#c9a8ff" : null, busy ? "up" : fd),
          x * TILE + ox,
          y * TILE + Math.sin(t * 2 + x) * 0.6 - (busy ? Math.abs(Math.sin(t * 8)) * 1.5 : 0),
          2,
          fd === "left",
        );
        ctx.restore();
      },
    });
  }
  if (z.guard && z.guardPos && !lifeMode() && !player.guards.includes(player.zone) && inView(z.guardPos[0], z.guardPos[1])) {
    const [x, y] = z.guardPos;
    list.push({
      y,
      draw: () => {
        const u = 2.6,
          s = 16 * u;
        ctx.fillStyle = `rgba(90,40,140,${0.25 + 0.15 * Math.sin(t * 3)})`;
        circle(x * TILE + 16, y * TILE + 18, 22);
        drawEnemy(z.guard, x * TILE + 16 - s / 2, y * TILE + 30 - s, u, t);
      },
    });
  }
  drawElves(t, inView);
  for (const m of game.mobs) {
    if (!inView(Math.round(m.rx), Math.round(m.ry))) continue;
    list.push({
      y: m.ry,
      draw: () => {
        const u = 1.7,
          s = 16 * u;
        ctx.fillStyle = "rgba(0,0,0,.25)";
        ctx.beginPath();
        ctx.ellipse(m.rx * TILE + 16, m.ry * TILE + 29, 9, 3, 0, 0, 7);
        ctx.fill();
        if (m.eco) {
          ctx.fillStyle = `rgba(176,108,255,${0.3 + 0.2 * Math.sin(t * 4)})`;
          circle(m.rx * TILE + 16, m.ry * TILE + 20, 24);
          ctx.fillStyle = "#ffe066";
          ctx.font = "13px sans-serif";
          ctx.textAlign = "center";
          drawPixelIcon("skull", m.rx * TILE + 16, m.ry * TILE - 10);
        }
        if (m.raid) {
          ctx.fillStyle = `rgba(255,60,60,${0.25 + 0.15 * Math.sin(t * 6)})`;
          circle(m.rx * TILE + 16, m.ry * TILE + 20, m.elite ? 22 : 16);
          if (m.elite) {
            ctx.fillStyle = "#f2c14e";
            ctx.font = "12px sans-serif";
            ctx.textAlign = "center";
            drawPixelIcon("crown", m.rx * TILE + 16, m.ry * TILE - 8);
          }
        }
        if (m.eco) {
          const u2 = 2.4,
            s2 = 16 * u2;
          drawEnemy(m.type, m.rx * TILE + 16 - s2 / 2, m.ry * TILE + 30 - s2, u2, t, {
            flip: m.x < player.x,
          });
        } else
          drawEnemy(m.type, m.rx * TILE + 16 - s / 2, m.ry * TILE + 30 - s, u, t, {
            flip: m.x < player.x,
          });
      },
    });
  }
  if (z.town) {
    for (const b of z.town.bld) {
      if (b.x > x1 + 1 || b.x + b.w < x0 - 1 || b.y > y1 + 2 || b.y + b.h < y0 - 1) continue;
      list.push({
        y: b.y + b.h - 1.01,
        draw: () => drawBuilding(b, t),
      });
    }
    for (const hu of z.town.huts) {
      if (!inView(hu.x, hu.y) && !inView(hu.x + 1, hu.y)) continue;
      list.push({
        y: hu.y - 1.6,
        draw: () => drawHutBack(hu, t),
      });
      list.push({
        y: hu.y + 0.01,
        draw: () => drawHut(hu, t),
      });
    }
    for (const [bx, by] of z.town.boats) {
      if (!inView(Math.round(bx), by)) continue;
      list.push({
        y: by,
        draw: () => drawBoat(bx * TILE, by * TILE, t),
      });
    }
    if (player.zone === "interior" && game.inter) {
      const I = game.inter;
      for (const pr of I.props)
        list.push({
          y: pr[2] - (pr[0] === "rug" || pr[0] === "carpet" ? 0.9 : 0.02),
          draw: () => drawProp(pr, t),
        });
      list.push({
        y: I.ky,
        draw: () => {
          ctx.fillStyle = "rgba(0,0,0,.25)";
          ctx.beginPath();
          ctx.ellipse(I.kx * TILE + 16, I.ky * TILE + 30, 9, 3, 0, 0, 7);
          ctx.fill();
          drawSprite(
            wizardRects(
              I.kc,
              I.st === "castle" ? null : null,
              I.kh,
              I.st === "castle" ? "#f2c14e" : null,
              "down",
            ),
            I.kx * TILE,
            I.ky * TILE + Math.sin(t * 2) * 0.6,
            2,
          );
          if (I.st === "castle") {
            ctx.fillStyle = "#f2c14e";
            ctx.fillRect(I.kx * TILE + 10, I.ky * TILE + 2, 12, 4);
            ctx.fillRect(I.kx * TILE + 10, I.ky * TILE, 2, 3);
            ctx.fillRect(I.kx * TILE + 15, I.ky * TILE - 1, 2, 3);
            ctx.fillRect(I.kx * TILE + 20, I.ky * TILE, 2, 3);
          }
        },
      });
      if (I.st === "castle")
        list.push({
          y: I.ky - 0.5,
          draw: () => {
            const X = I.kx * TILE - 8,
              Y = I.ky * TILE - 30;
            ctx.fillStyle = "#8a2a2a";
            ctx.fillRect(X + 4, Y, 40, 52);
            ctx.fillStyle = "#f2c14e";
            ctx.fillRect(X, Y - 6, 48, 8);
            ctx.fillRect(X + 2, Y + 46, 44, 6);
          },
        });
      for (const pe of I.people)
        list.push({
          y: pe.y,
          draw: () => {
            if (pe.kid) {
              drawFamily(
                {
                  kind: "kid",
                  k: pe.kid,
                  x: pe.x,
                  y: pe.y,
                },
                t,
              );
              return;
            }
            if (pe.child) {
              ctx.save();
              ctx.translate(pe.x * TILE + 16, pe.y * TILE + 32);
              ctx.scale(0.75, 0.75);
              drawSprite(wizardRects(pe.robe, null, pe.hair, null, "up"), -16, -32, 2);
              ctx.restore();
              return;
            }
            ctx.fillStyle = "rgba(0,0,0,.22)";
            ctx.beginPath();
            ctx.ellipse(pe.x * TILE + 16, pe.y * TILE + 30, 8, 3, 0, 0, 7);
            ctx.fill();
            drawSprite(
              wizardRects(
                pe.robe,
                pe.hat,
                pe.hair,
                null,
                pe.dance ? ["down", "left", "up", "right"][Math.floor(t * 2 + pe.x) % 4] : "down",
                pe.dance ? walkFrame(true, t) : 0,
              ),
              pe.x * TILE,
              pe.y * TILE + (pe.dance ? -Math.abs(Math.sin(t * 6 + pe.x)) * 4 : Math.sin(t * 2 + pe.x) * 0.6),
              2,
            );
          },
        });
    }
    if (player.zone === "casa")
      for (const fu of player.furn || [])
        list.push({
          y: fu.y - (furnWalk(fu.id) ? 0.9 : 0.02),
          draw: () => drawFurn(fu, t),
        });
    for (const fm of familyList()) {
      if (!inView(fm.x, fm.y)) continue;
      list.push({
        y: fm.y,
        draw: () => drawFamily(fm, t),
      });
    }
    if (
      activePet() &&
      game.petPos &&
      Math.abs(game.petPos.rx - player.rx) + Math.abs(game.petPos.ry - player.ry) > 0.3
    ) {
      const pp = game.petPos,
        pt = activePet();
      list.push({
        y: pp.ry - 0.01,
        draw: () =>
          drawPet(
            pt,
            pp.rx * TILE + 7,
            pp.ry * TILE + 14,
            pp.flip,
            t,
            Math.abs(pp.rx - pp.x) + Math.abs(pp.ry - pp.y) > 0.05,
          ),
      });
    }
    if (player.zone === "casa") {
      let k = 0;
      (player.pets || []).forEach((pt, i) => {
        if (i === player.petA) return;
        const sp = HOME_PET_SPOTS[k++];
        if (!sp) return;
        list.push({
          y: sp[1],
          draw: () =>
            drawPet(
              pt,
              sp[0] * TILE + 7 + Math.sin(t * 0.7 + i) * 4,
              sp[1] * TILE + 14,
              Math.sin(t * 0.35 + i) < 0,
              t,
              false,
            ),
        });
      });
    }
    if (paradeActive())
      for (const pp of paradePositions()) {
        list.push({
          y: pp.y,
          draw: () => {
            const X = pp.x * TILE,
              Y = pp.y * TILE + Math.abs(Math.sin(t * 8 + pp.x)) * -1.5;
            ctx.fillStyle = "rgba(0,0,0,.25)";
            ctx.beginPath();
            ctx.ellipse(X + 16, Y + 30, 9, 3, 0, 0, 7);
            ctx.fill();
            drawSprite(wizardRects(pp.m.robe, pp.m.hat, pp.m.hair, null, pp.dir), X, Y, 2, pp.dir === "left");
            if (pp.m.crown) {
              ctx.fillStyle = "#f2c14e";
              ctx.fillRect(X + 10, Y + 2, 12, 4);
              ctx.fillRect(X + 10, Y, 2, 3);
              ctx.fillRect(X + 15, Y - 1, 2, 3);
              ctx.fillRect(X + 20, Y, 2, 3);
              ctx.fillStyle = "#e0303a";
              ctx.fillRect(X + 15, Y + 3, 2, 2);
            }
            if (pp.m.q) {
              ctx.fillStyle = "#8a2a5a";
              ctx.fillRect(X + 4, Y + 20, 24, 10);
              ctx.fillStyle = "#f2c14e";
              ctx.fillRect(X + 4, Y + 29, 24, 2);
            }
            if (pp.m.ban) {
              ctx.fillStyle = "#5a3a22";
              ctx.fillRect(X + 26, Y - 14, 2, 40);
              ctx.fillStyle = "#8a2a5a";
              ctx.fillRect(X + 28, Y - 14, 12, 14);
              ctx.fillStyle = "#f2c14e";
              ctx.fillRect(X + 31, Y - 10, 6, 6);
            }
          },
        });
      }
    for (const r of game.roam || []) {
      if (npcAsleep(r.id) || r.id === player.spouse || !inView(Math.round(r.rx), Math.round(r.ry))) continue;
      const n = NPCS[r.id];
      list.push({
        y: r.ry,
        draw: () => {
          ctx.fillStyle = "rgba(0,0,0,.25)";
          ctx.beginPath();
          ctx.ellipse(r.rx * TILE + 16, r.ry * TILE + 30, 9, 3, 0, 0, 7);
          ctx.fill();
          drawSprite(
            wizardRects(
              n.robe,
              n.hat,
              n.hair,
              MAGIC_KEEPERS.has(r.id) ? "#c9a8ff" : null,
              r.dir,
              walkFrame(Math.abs(r.rx - r.x) + Math.abs(r.ry - r.y) > 0.05, t),
            ),
            r.rx * TILE,
            r.ry * TILE +
              (Math.abs(r.rx - r.x) + Math.abs(r.ry - r.y) > 0.05
                ? Math.abs(Math.sin(t * 12)) * -1.5
                : Math.sin(t * 2) * 0.5),
            2,
            r.dir === "left",
          );
        },
      });
    }
    for (const a of game.townActors || []) {
      const ay = a.kind === "boat" ? a.y : a.kind === "gull" ? 99 : (a.ry ?? a.y);
      list.push({ y: ay, draw: () => drawTownActor(a, t) });
    }
    for (const w of walkersAway() ? [] : game.walkers || []) {
      if (w.inside > 0 || !inView(Math.round(w.rx), Math.round(w.ry))) continue;
      list.push({
        y: w.ry,
        draw: () => {
          ctx.fillStyle = "rgba(0,0,0,.22)";
          ctx.beginPath();
          ctx.ellipse(w.rx * TILE + 16, w.ry * TILE + 30, 8, 3, 0, 0, 7);
          ctx.fill();
          drawSprite(
            w.elf
              ? elfRects(
                  ELF_ROBES[w.robe.length % 4],
                  ELF_HAIRS[w.nm.length % 4],
                  w.dir,
                  w.sit > 0 ? 0 : walkFrame(w.moving, t),
                )
              : wizardRects(
                  w.robe,
                  w.hat,
                  w.hair,
                  null,
                  w.dir,
                  w.sit > 0 ? 0 : walkFrame(w.moving, t),
                  w.seed,
                ),
            w.rx * TILE,
            w.ry * TILE +
              (w.sit > 0 ? 5 : w.moving ? Math.abs(Math.sin(t * 12)) * -1 : 0) +
              (w.chat > 0 ? Math.sin(t * 5) * 0.8 : 0),
            2,
            w.dir === "left",
          );
          if (w.sayT > 0)
            game.speech = (game.speech || []).concat([
              {
                x: w.rx * TILE + 16,
                y: w.ry * TILE - 4,
                txt: w.sayTxt,
                a: Math.min(1, w.sayT),
              },
            ]);
        },
      });
    }
    for (const c of game.chicks || []) {
      if (!inView(Math.round(c.rx), Math.round(c.ry))) continue;
      list.push({
        y: c.ry,
        draw: () => {
          const X = c.rx * TILE + 10,
            Y = c.ry * TILE + 14,
            f = c.flip;
          ctx.fillStyle = "#fff";
          ctx.fillRect(X, Y + 4, 12, 8);
          ctx.fillRect(f ? X - 2 : X + 8, Y, 6, 6);
          ctx.fillStyle = "#e0303a";
          ctx.fillRect(f ? X - 1 : X + 10, Y - 2, 3, 3);
          ctx.fillStyle = "#f2a83a";
          ctx.fillRect(f ? X - 4 : X + 14, Y + 2, 3, 2);
          ctx.fillRect(X + 3, Y + 12, 2, 4);
          ctx.fillRect(X + 8, Y + 12, 2, 4);
        },
      });
    }
    for (const f of dayOutside() ? game.farmers || [] : []) {
      if (!inView(Math.round(f.rx), Math.round(f.ry))) continue;
      list.push({
        y: f.ry,
        draw: () => {
          const X = f.rx * TILE,
            Y = f.ry * TILE;
          ctx.fillStyle = "rgba(0,0,0,.22)";
          ctx.beginPath();
          ctx.ellipse(X + 16, Y + 30, 8, 3, 0, 0, 7);
          ctx.fill();
          drawSprite(
            wizardRects(f.robe, "#c9a03a", f.hair, null, f.dir),
            X,
            Y + (f.work ? Math.abs(Math.sin(t * 6)) * 2 : 0),
            2,
            f.dir === "left",
          );
          ctx.fillStyle = "#6b4423";
          const sw = f.work ? Math.sin(t * 6) * 6 : 0;
          ctx.fillRect(X + 24, Y + 6 + sw, 2, 18);
          ctx.fillStyle = "#9a9aa4";
          ctx.fillRect(X + 21, Y + 22 + sw, 7, 3);
        },
      });
    }
    for (const k of dayOutside() && !schoolTime() ? game.kidsP || [] : []) {
      if (!inView(Math.round(k.rx), Math.round(k.ry))) continue;
      list.push({
        y: k.ry,
        draw: () => {
          ctx.save();
          ctx.translate(k.rx * TILE + 16, k.ry * TILE + 32);
          ctx.scale(0.7, 0.7);
          ctx.fillStyle = "rgba(0,0,0,.22)";
          ctx.beginPath();
          ctx.ellipse(0, -2, 10, 4, 0, 0, 7);
          ctx.fill();
          drawSprite(
            wizardRects(k.robe, null, k.hair, null, k.dir),
            -16,
            -32 - Math.abs(Math.sin(t * 14 + k.x)) * 3,
            2,
            k.dir === "left",
          );
          ctx.restore();
        },
      });
    }
    if (game.cart && player.zone === "vila") {
      const c = game.cart;
      list.push({
        y: c.y,
        draw: () => {
          const X = c.x * TILE,
            Y = c.y * TILE,
            fl = c.v < 0,
            b2 = Math.abs(Math.sin(t * 10)) * 1.5;
          drawHorse(fl ? X - 34 : X + 34, Y + 6 - b2, t, fl);
          ctx.fillStyle = "rgba(0,0,0,.25)";
          ctx.fillRect(X - 4, Y + 30, 44, 5);
          drawSprite(
            wizardRects("#7a5a3a", "#5a3a22", "#3a2414", null, fl ? "left" : "right"),
            X + (fl ? -2 : 12),
            Y - 14 - b2 * 0.5,
            2,
            fl,
          );
          ctx.fillStyle = "#6b4423";
          ctx.fillRect(fl ? X - 2 : X + 30, Y + 4, 8, 6);
          ctx.fillStyle = "#8a5a2e";
          ctx.fillRect(X - 4, Y + 12, 44, 14);
          ctx.fillStyle = "#a8784a";
          ctx.fillRect(X - 4, Y + 10, 44, 4);
          ctx.fillStyle = "#d9b84a";
          ctx.fillRect(fl ? X + 12 : X - 2, Y + 2, 26, 9);
          ctx.fillStyle = "#3a2414";
          circle(X + 4, Y + 28, 6);
          circle(X + 32, Y + 28, 6);
          ctx.fillStyle = "#8a6038";
          circle(X + 4, Y + 28, 2);
          circle(X + 32, Y + 28, 2);
        },
      });
    }
    for (const pt of game.pets || []) {
      if (!inView(Math.round(pt.rx), Math.round(pt.ry))) continue;
      list.push({
        y: pt.ry,
        draw: () => {
          const X = pt.rx * TILE + 8,
            Y = pt.ry * TILE + 16,
            f = pt.flip;
          ctx.fillStyle = "rgba(0,0,0,.2)";
          ctx.fillRect(X, Y + 12, 16, 3);
          ctx.fillStyle = pt.col;
          ctx.fillRect(X, Y + 2, 14, 8);
          ctx.fillRect(f ? X - 3 : X + 11, Y - 2, 7, 7);
          if (pt.cat) {
            ctx.fillRect(f ? X - 3 : X + 11, Y - 4, 2, 2);
            ctx.fillRect(f ? X + 2 : X + 16, Y - 4, 2, 2);
            ctx.fillRect(f ? X + 13 : X - 2, Y - 2, 2, 6);
          } else {
            ctx.fillRect(f ? X + 13 : X - 3, Y + 1, 3, 2);
            ctx.fillStyle = shade(pt.col, -0.3);
            ctx.fillRect(f ? X - 3 : X + 15, Y - 1, 3, 4);
          }
          ctx.fillStyle = pt.col;
          ctx.fillRect(X + 1, Y + 10, 2, 3);
          ctx.fillRect(X + 10, Y + 10, 2, 3);
          ctx.fillStyle = "#111";
          ctx.fillRect(f ? X - 1 : X + 15, Y + 1, 1, 1);
        },
      });
    }
    for (const [hx, hy] of z.town.horses) {
      if (!inView(Math.round(hx), hy)) continue;
      list.push({
        y: hy,
        draw: () => drawHorse(hx * TILE, hy * TILE, t, hx > 58),
      });
    }
  }
  for (const j of player.jobs)
    if (j.type === "gather" && j.zone === player.zone && j.herbs)
      for (const [hx, hy] of j.herbs) {
        if (!inView(hx, hy)) continue;
        const X = hx * TILE,
          Y = hy * TILE;
        ctx.fillStyle = `rgba(122,211,107,${0.3 + 0.2 * Math.sin(t * 4)})`;
        circle(X + 16, Y + 18, 12);
        ctx.fillStyle = "#2f7a2a";
        ctx.fillRect(X + 15, Y + 12, 2, 16);
        ctx.fillStyle = "#7ad36b";
        ctx.fillRect(X + 9, Y + 14, 6, 4);
        ctx.fillRect(X + 17, Y + 10, 6, 4);
        ctx.fillRect(X + 10, Y + 20, 5, 3);
        ctx.fillStyle = "#fff3b0";
        ctx.fillRect(X + 15, Y + 8, 3, 3);
      }
  list.push({
    y: player.ry,
    draw: () => {
      const mv = Math.abs(player.rx - player.x) + Math.abs(player.ry - player.y) > 0.05;
      const bob = mv ? Math.abs(Math.sin(t * 14)) * -1.5 : 0;
      ctx.fillStyle = "rgba(0,0,0,.28)";
      ctx.beginPath();
      ctx.ellipse(player.rx * TILE + 16, player.ry * TILE + 30, 9, 3, 0, 0, 7);
      ctx.fill();
      // No Simulador de Vida não tem cajado: é só um morador.
      const glow = lifeMode()
        ? null
        : (player.look && player.look.staffc) || RUNES[player.runes[player.runes.length - 1]].cor;
      if (player.riding) {
        const X = player.rx * TILE,
          Y = player.ry * TILE,
          fl = player.dir === "left",
          gal = mv ? Math.abs(Math.sin(t * 16)) * 2 : 0;
        ctx.fillStyle = "#6b4423";
        ctx.fillRect(X + 2, Y + 14 - gal, 28, 10);
        ctx.fillRect(fl ? X - 4 : X + 24, Y + 6 - gal, 8, 10);
        ctx.fillStyle = "#4a2e17";
        ctx.fillRect(fl ? X - 4 : X + 28, Y + 4 - gal, 3, 6);
        ctx.fillRect(X + 4, Y + 24 - gal, 3, 8);
        ctx.fillRect(X + 12, Y + 24, 3, 8);
        ctx.fillRect(X + 19, Y + 24 - gal, 3, 8);
        ctx.fillRect(X + 26, Y + 24, 3, 8);
        ctx.fillStyle = "#c94a4a";
        ctx.fillRect(X + 10, Y + 13 - gal, 12, 4);
      }
      drawAura(
        player.rx * TILE + 16,
        player.ry * TILE + bob - (player.riding ? 12 : 0) + 16,
        t,
        player.look.aura,
        true,
      );
      drawSprite(
        heroRects(player.look, player.dir, glow, mv && !player.riding ? 1 + (Math.floor(t * 7) % 2) : 0),
        player.rx * TILE,
        player.ry * TILE + bob - (player.riding ? 12 : 0),
        2,
        player.dir === "left",
      );
      drawAura(
        player.rx * TILE + 16,
        player.ry * TILE + bob - (player.riding ? 12 : 0) + 16,
        t,
        player.look.aura,
        false,
      );
      ctx.fillStyle = glow;
      ctx.globalAlpha = 0.35 + 0.25 * Math.sin(t * 5);
      circle(player.rx * TILE + (player.dir === "left" ? 5 : 27), player.ry * TILE + bob + 7, 5);
      ctx.globalAlpha = 1;
    },
  });
  if (game.ep && player.zone === "vila") {
    const e = game.ep;
    list.push({
      y: e.y,
      draw: () => {
        ctx.fillStyle = "rgba(0,0,0,.25)";
        ctx.beginPath();
        ctx.ellipse(e.x * TILE + 16, e.y * TILE + 30, 9, 3, 0, 0, 7);
        ctx.fill();
        drawSprite(
          wizardRects("#3a2c5c", null, "#d8d2ea", null, e.done ? "left" : "up"),
          e.x * TILE,
          e.y * TILE,
          2,
          e.done,
        );
      },
    });
  }
  jobDrawList(list, t);
  lifeDrawList(list, t);
  animalsDrawList(list, t);
  crewDrawList(list, t);
  list.sort((a, b) => a.y - b.y).forEach((s) => s.draw());
  if (ZONES[player.zone].town) drawVilaLife(t, x0, y0, x1, y1);
  if (player.zone === "vila") {
    const gx = 39 * TILE,
      gy1 = 17 * TILE,
      gy2 = 23 * TILE;
    ctx.fillStyle = "rgba(0,0,0,.25)";
    ctx.fillRect(gx + 6, gy1 + 26, 20, 5);
    ctx.fillRect(gx + 6, gy2 + 26, 20, 5);
    for (const gy of [gy1, gy2]) {
      ctx.fillStyle = "#8a8174";
      ctx.fillRect(gx + 10, gy - 50, 12, 80);
      ctx.fillStyle = "#a39a8c";
      ctx.fillRect(gx + 11, gy - 50, 4, 80);
      ctx.fillStyle = "#6a645a";
      ctx.fillRect(gx + 8, gy - 54, 16, 6);
      ctx.fillRect(gx + 8, gy + 24, 16, 6);
    }
    ctx.fillStyle = "#6b4423";
    ctx.fillRect(gx + 6, gy1 - 62, 20, gy2 - gy1 + 16);
    ctx.fillStyle = "#8a5a2e";
    ctx.fillRect(gx + 8, gy1 - 60, 16, gy2 - gy1 + 12);
    ctx.save();
    ctx.translate(gx + 16, (gy1 + gy2) / 2 - 54);
    ctx.rotate(Math.PI / 2);
    ctx.fillStyle = "#f2c14e";
    ctx.font = '700 13px "Pixelify Sans", sans-serif';
    ctx.textAlign = "center";
    ctx.fillText("✦ MERCADO DE CINZALUZ ✦", 0, 4);
    ctx.restore();
    for (const gy of [gy1 - 58, gy2 - 58]) {
      ctx.fillStyle = "#a82a2a";
      ctx.fillRect(gx + 26, gy, 10, 18);
      ctx.fillStyle = "#f2c14e";
      ctx.fillRect(gx + 28, gy + 4, 6, 6);
    }
  }
  drawFishing(t);
  drawFestival(t);
  if (player.despise && Math.random() < 0.01)
    for (const [x, y, id] of z.npcList)
      if (despised(id) && Math.abs(x - player.x) + Math.abs(y - player.y) <= 4)
        game.bubbles.push({
          x: (npcSpot(id) || [x, y])[0],
          y: (npcSpot(id) || [x, y])[1],
          icon: "anger",
          t: 2,
        });
  for (const q of game.shouts || [])
    game.speech.push({
      x: q.x * TILE + 16,
      y: q.y * TILE - 4,
      txt: q.txt,
      a: Math.min(1, q.t),
    });
  for (const sp of game.speech || []) drawSpeech(sp);
  game.speech = [];
  if (game.tgt) {
    const X = game.tgt.x * TILE + 16,
      Y = game.tgt.y * TILE,
      key = matchMedia("(pointer:coarse)").matches ? "A" : "E";
    ctx.strokeStyle = `rgba(242,193,78,${0.5 + 0.3 * Math.sin(t * 6)})`;
    ctx.lineWidth = 2;
    ctx.strokeRect(game.tgt.x * TILE + 2, Y + 2, TILE - 4, TILE - 4);
    ctx.fillStyle = "#f2c14e";
    fillPolygon(X - 4, Y - 7, X + 4, Y - 7, X, Y - 2);
  }
  for (const b of game.bubbles || []) {
    const X = b.x * TILE + 16,
      Y = b.y * TILE - 14 - (2.6 - b.t) * 6;
    ctx.globalAlpha = Math.min(1, b.t * 2);
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.ellipse(X, Y, 13, 11, 0, 0, 7);
    ctx.fill();
    fillPolygon(X - 4, Y + 8, X + 3, Y + 8, X - 2, Y + 15);
    drawPixelIcon(PIXEL_ICONS[b.icon] ? b.icon : "chat", X, Y);
    ctx.globalAlpha = 1;
  }
  ctx.restore();
  const th = z.theme;
  const psx = (player.rx * TILE + 16 - camX) * Z,
    psy = (player.ry * TILE + 16 - camY) * Z;
  {
    const na = nightAlpha() * (th === "casa" || th === "interior" ? 0.3 : 1);
    if (na > 0 && th !== "torre") {
      const g = ctx.createRadialGradient(psx, psy, 60 * Z, psx, psy, 240 * Z);
      g.addColorStop(0, `rgba(10,12,44,${na * 0.2})`);
      g.addColorStop(1, `rgba(6,8,32,${na})`);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, viewWidth, 480);
    }
  }
  for (const a of game.amb) {
    if (th === "bosque") {
      a.p += 0.016;
      ctx.fillStyle = `rgba(220,255,120,${0.4 + 0.4 * Math.sin(t * 3 + a.p * 5)})`;
      ctx.fillRect(a.x + Math.sin(t + a.p) * 20, a.y + Math.cos(t * 0.7 + a.p) * 15, 2, 2);
    } else if (th === "picos") {
      a.y += (20 + a.s * 30) * 0.016;
      a.x += Math.sin(t + a.p) * 0.3;
      if (a.y > 480) {
        a.y = -4;
        a.x = Math.random() * viewWidth;
      }
      ctx.fillStyle = "rgba(255,255,255,.8)";
      ctx.fillRect(a.x, a.y, 2, 2);
    } else if (th === "pantano") {
      a.x += (6 + a.s * 8) * 0.016;
      if (a.x > 700) a.x = -80;
      ctx.fillStyle = "rgba(200,220,200,.07)";
      ctx.beginPath();
      ctx.ellipse(a.x, a.y, 70, 18, 0, 0, 7);
      ctx.fill();
    } else if (th === "torre") {
      a.y -= (10 + a.s * 15) * 0.016;
      if (a.y < -4) {
        a.y = 484;
        a.x = Math.random() * viewWidth;
      }
      ctx.fillStyle = `rgba(176,108,255,${0.3 + 0.3 * a.s})`;
      ctx.fillRect(a.x, a.y, 2, 2);
    } else {
      a.p += 0.01;
      ctx.fillStyle = `rgba(255,240,200,${0.25 + 0.25 * Math.sin(t * 2 + a.p * 4)})`;
      ctx.fillRect(a.x + Math.sin(t * 0.5 + a.p) * 30, a.y, 2, 2);
    }
  }
  if (th === "torre" || th === "pantano" || th === "escola") {
    const g = ctx.createRadialGradient(psx, psy, 60 * Z, psx, psy, (th === "pantano" ? 420 : 320) * Z);
    g.addColorStop(0, "rgba(0,0,0,0)");
    g.addColorStop(1, th === "torre" ? "rgba(8,4,16,.75)" : "rgba(10,20,10,.4)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, viewWidth, 480);
  }
  {
    const nA = nightAlpha();
    const lit =
      nA > 0.15 || (["chuva", "tempestade", "neblina"].includes(player.weather) && outdoorTheme(th));
    if (lit && z.town) {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      for (let y = y0; y <= y1; y++)
        for (let x = x0; x <= x1; x++) {
          const c = z.map[y][x];
          if (c !== "l" && c !== "t") continue;
          const sx = (x * TILE + 16 - camX) * Z,
            sy = (y * TILE + (c === "l" ? 0 : 4) - camY) * Z,
            g = ctx.createRadialGradient(sx, sy, 2, sx, sy, 70 * Z);
          g.addColorStop(0, `rgba(255,190,90,${0.35 * Math.max(nA, 0.4)})`);
          g.addColorStop(1, "rgba(255,160,60,0)");
          ctx.fillStyle = g;
          ctx.fillRect(sx - 70 * Z, sy - 70 * Z, 140 * Z, 140 * Z);
        }
      ctx.restore();
    }
  }
  drawAmbience(t, th);
  drawWeather(t, th, psx, psy);
  if (game.raid && player.zone === "vila") {
    const a = 0.18 + 0.1 * Math.sin(t * 4),
      g = ctx.createRadialGradient(viewWidth / 2, 240, 180, viewWidth / 2, 240, viewWidth * 0.7);
    g.addColorStop(0, "rgba(200,0,0,0)");
    g.addColorStop(1, `rgba(200,20,20,${a})`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, viewWidth, 480);
  }
  if (game.mode === "world" && !game.ep) drawQuestArrow(t, camX, camY, Z);
  if (game.mode === "world" && game.showMM && player.zone !== "interior" && player.zone !== "casa")
    drawMinimap(false, t);
  if (game.banner) {
    const a = Math.min(1, game.banner.t, (2.8 - game.banner.t) * 3);
    ctx.save();
    ctx.globalAlpha = Math.max(0, a) * 0.92;
    ctx.font = '700 17px "Pixelify Sans", sans-serif';
    const w = ctx.measureText(game.banner.text).width + 28;
    ctx.fillStyle = "rgba(20,14,32,.7)";
    ctx.fillRect(viewWidth / 2 - w / 2, 104, w, 28);
    ctx.fillStyle = "#f2c14e";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(game.banner.text, viewWidth / 2, 119);
    ctx.restore();
  }
}
/* ===================== CENÁRIO DA BATALHA ===================== */

/** Linha do horizonte na batalha: os lutadores ficam com os pés no chão. */
const BATTLE_HORIZON = 196;

const BATTLE_SKY = {
  escola: ["#151a2c", "#3a3150"],
  bosque: ["#1d3a2a", "#5a8a52"],
  pantano: ["#1c2a24", "#4e6047"],
  picos: ["#4a6a95", "#b8c4d6"],
  torre: ["#0b0812", "#2a1f3d"],
  vila: ["#3a5a8a", "#9ab8d9"],
};
const BATTLE_GROUND = {
  escola: ["#3a3048", "#241d30"],
  bosque: ["#3d6a34", "#24401f"],
  pantano: ["#3a4a32", "#1f2a1c"],
  picos: ["#9aa4b0", "#5a6470"],
  torre: ["#2a2036", "#140f1c"],
  vila: ["#8a7a5a", "#5a4e38"],
};

function drawBattleSky(theme, t) {
  const night = nightAlpha() > 0.3 && outdoorTheme(theme);
  const [top, bottom] = BATTLE_SKY[theme] || BATTLE_SKY.vila;
  const g = ctx.createLinearGradient(0, 0, 0, BATTLE_HORIZON + 20);
  g.addColorStop(0, night ? shade(top, -0.55) : top);
  g.addColorStop(1, night ? shade(bottom, -0.55) : bottom);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, viewWidth, BATTLE_HORIZON + 20);
  if (!outdoorTheme(theme)) return;
  if (night) {
    for (let i = 0; i < 70; i++) {
      ctx.globalAlpha = 0.4 + 0.6 * Math.abs(Math.sin(t * 1.5 + i));
      ctx.fillStyle = "#fff";
      ctx.fillRect((i * 137.5) % viewWidth, (i * 71.3) % 200, 2, 2);
    }
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#f3eccb";
    circle(viewWidth - 110, 70, 26);
    ctx.fillStyle = shade(top, -0.55);
    circle(viewWidth - 100, 64, 24);
  } else {
    const sun = ctx.createRadialGradient(viewWidth - 120, 60, 10, viewWidth - 120, 60, 160);
    sun.addColorStop(0, "rgba(255,240,190,.55)");
    sun.addColorStop(1, "rgba(255,240,190,0)");
    ctx.fillStyle = sun;
    ctx.fillRect(0, 0, viewWidth, 300);
    ctx.fillStyle = "rgba(255,255,255,.55)";
    for (let i = 0; i < 4; i++) {
      const cx = ((i * 260 + t * (8 + i * 3)) % (viewWidth + 200)) - 100,
        cy = 40 + i * 28;
      ctx.beginPath();
      ctx.ellipse(cx, cy, 60, 14, 0, 0, 7);
      ctx.ellipse(cx + 34, cy - 8, 36, 12, 0, 0, 7);
      ctx.fill();
    }
  }
}

function drawBattleBackdrop(theme, t) {
  const W = viewWidth;
  const sway = (i) => Math.sin(t * 1.2 + i) * 2;
  if (theme === "bosque") {
    ctx.fillStyle = "#1f3a26";
    for (let i = 0; i < 14; i++) circle((i * 70) % (W + 70), 200, 60);
    for (let i = 0; i < 10; i++) {
      const x = i * 95 + 20;
      ctx.fillStyle = "#3a2618";
      ctx.fillRect(x + 14, 170, 12, 110);
      ctx.fillStyle = i % 2 ? "#2c5a30" : "#356a36";
      circle(x + 20 + sway(i), 158, 40);
      ctx.fillStyle = "#4a8a44";
      circle(x + 8 + sway(i), 146, 16);
    }
  } else if (theme === "picos") {
    ctx.fillStyle = "#6a7a92";
    fillPolygon(0, 270, 120, 110, 230, 220, 360, 70, 500, 210, 620, 100, W, 230, W, 270);
    ctx.fillStyle = "#f2f6fa";
    fillPolygon(330, 110, 360, 70, 392, 112, 372, 104, 352, 116);
    fillPolygon(95, 140, 120, 110, 146, 142, 128, 136);
    fillPolygon(596, 130, 620, 100, 646, 132, 626, 126);
    ctx.fillStyle = "#4e5c70";
    fillPolygon(0, 280, 80, 200, 170, 260, 280, 190, 420, 262, 560, 196, W, 270, W, 280);
  } else if (theme === "pantano") {
    ctx.fillStyle = "#2a3a2c";
    for (let i = 0; i < 9; i++) {
      const x = i * 110 + 30;
      ctx.fillRect(x, 150, 10, 130);
      ctx.fillRect(x - 18, 175, 22, 4);
      ctx.fillRect(x + 8, 160, 20, 4);
    }
    ctx.fillStyle = "#55603a";
    for (let i = 0; i < 40; i++) ctx.fillRect(i * 22 + sway(i), 250 - ((i * 37) % 30), 3, 50);
  } else if (theme === "torre") {
    ctx.fillStyle = "#1c1428";
    for (let i = 0; i < 6; i++) ctx.fillRect(i * 150 + 20, 0, 46, 290);
    ctx.fillStyle = "#2a1f3a";
    for (let i = 0; i < 6; i++) ctx.fillRect(i * 150 + 14, 0, 58, 14);
    for (let i = 0; i < 6; i++) {
      ctx.fillStyle = `rgba(176,108,255,${0.4 + 0.3 * Math.sin(t * 3 + i)})`;
      ctx.fillRect(i * 150 + 36, 120, 14, 22);
    }
    const g = ctx.createRadialGradient(W * 0.68, 150, 10, W * 0.68, 150, 220);
    g.addColorStop(0, "rgba(176,108,255,.22)");
    g.addColorStop(1, "rgba(176,108,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, 300);
  } else if (theme === "escola") {
    ctx.fillStyle = "#2a2236";
    for (let i = 0; i < 7; i++) {
      ctx.fillRect(i * 130 + 10, 60, 90, 220);
      ctx.fillStyle = "#3a2a1e";
      for (let r = 0; r < 4; r++) ctx.fillRect(i * 130 + 14, 80 + r * 50, 82, 6);
      ctx.fillStyle = "#2a2236";
    }
  } else {
    for (let i = 0; i < 8; i++) {
      const x = i * 120 + 10,
        h = 70 + (i % 3) * 18;
      ctx.fillStyle = ["#8a3a2a", "#3a5a8a", "#8a6a2a"][i % 3];
      fillPolygon(x - 6, 270 - h, x + 46, 230 - h, x + 98, 270 - h);
      ctx.fillStyle = "#e8dcc0";
      ctx.fillRect(x, 270 - h, 92, h);
      ctx.fillStyle = "#4a2e17";
      ctx.fillRect(x + 38, 240, 16, 30);
      ctx.fillStyle = nightAlpha() > 0.3 ? "#ffd66b" : "#9fd0f0";
      ctx.fillRect(x + 12, 280 - h, 14, 12);
      ctx.fillRect(x + 66, 280 - h, 14, 12);
    }
  }
}

function drawBattleGround(theme, t) {
  const [near, far] = BATTLE_GROUND[theme] || BATTLE_GROUND.vila;
  const top = BATTLE_HORIZON;
  const g = ctx.createLinearGradient(0, top, 0, 480);
  g.addColorStop(0, far);
  g.addColorStop(1, near);
  ctx.fillStyle = g;
  ctx.fillRect(0, top, viewWidth, 480 - top);
  ctx.fillStyle = "rgba(0,0,0,.12)";
  for (let i = 0; i < 7; i++) ctx.fillRect(0, top + 8 + i * i * 6, viewWidth, 1);
  ctx.fillStyle = shade(near, 0.15);
  for (let i = 0; i < 60; i++) {
    const x = (i * 53.7) % viewWidth,
      y = BATTLE_HORIZON + 20 + ((i * 29) % 250);
    ctx.fillRect(x, y, 3, 2);
  }
  if (theme === "bosque" || theme === "vila" || theme === "pantano") {
    ctx.fillStyle = theme === "pantano" ? "#4a5a32" : "#4a8a3a";
    for (let i = 0; i < 26; i++) {
      const x = (i * 41) % viewWidth,
        y = 440 + (i % 3) * 12,
        s = Math.sin(t * 2 + i) * 2;
      fillPolygon(x, y, x + 3 + s, y - 14, x + 6, y);
      fillPolygon(x + 6, y, x + 10 + s, y - 10, x + 12, y);
    }
  }
}

/** Círculo mágico girando sob o jogador. */
function drawMagicCircle(x, y, color, t) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(1, 0.28);
  ctx.rotate(t * 0.6);
  ctx.strokeStyle = color;
  ctx.globalAlpha = 0.45;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, 0, 70, 0, 7);
  ctx.stroke();
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, 52, 0, 7);
  ctx.stroke();
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * 52, Math.sin(a) * 52);
    ctx.lineTo(Math.cos(a + 2.1) * 52, Math.sin(a + 2.1) * 52);
    ctx.stroke();
  }
  ctx.restore();
}

function drawBattleAmbience(theme, t) {
  const W = viewWidth;
  if (theme === "bosque") {
    for (let i = 0; i < 14; i++) {
      ctx.fillStyle = i % 2 ? "#c97a2a" : "#8aa83a";
      ctx.fillRect(((i * 97 + t * 25) % W) + Math.sin(t * 2 + i) * 10, (i * 61 + t * 40) % 480, 4, 3);
    }
    for (let i = 0; i < 10; i++) {
      ctx.globalAlpha = 0.4 + 0.5 * Math.sin(t * 3 + i);
      ctx.fillStyle = "#e8ff8a";
      ctx.fillRect(
        ((i * 131) % W) + Math.sin(t + i) * 30,
        180 + ((i * 47) % 160) + Math.cos(t * 0.8 + i) * 20,
        2,
        2,
      );
    }
  } else if (theme === "pantano") {
    ctx.fillStyle = "rgba(200,220,200,.08)";
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.ellipse(((i * 260 + t * 15) % (W + 300)) - 150, 290 + i * 30, 180, 22, 0, 0, 7);
      ctx.fill();
    }
    for (let i = 0; i < 8; i++) {
      const p = (t * 0.5 + i * 0.37) % 1;
      ctx.globalAlpha = 1 - p;
      ctx.strokeStyle = "#9ab88a";
      ctx.beginPath();
      ctx.arc((i * 83) % W, 460 - p * 30, 2 + p * 3, 0, 7);
      ctx.stroke();
    }
  } else if (theme === "picos") {
    ctx.strokeStyle = "rgba(255,255,255,.25)";
    for (let i = 0; i < 12; i++) {
      const x = ((i * 140 + t * 220) % (W + 100)) - 50,
        y = 80 + ((i * 53) % 300);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + 40, y);
      ctx.stroke();
    }
  } else if (theme === "torre" || theme === "escola") {
    for (let i = 0; i < 12; i++) {
      const p = (t * 0.15 + i * 0.13) % 1;
      ctx.globalAlpha = Math.sin(p * Math.PI) * 0.7;
      if (theme === "torre") glyph(ORDER[i % ORDER.length], (i * 79) % W, 420 - p * 380, 12, ctx.globalAlpha);
      else {
        ctx.fillStyle = "#efe2c0";
        ctx.fillRect(((i * 79) % W) + Math.sin(t + i) * 12, 420 - p * 380, 10, 7);
      }
    }
  } else {
    for (let i = 0; i < 16; i++) {
      ctx.globalAlpha = 0.25 + 0.25 * Math.sin(t * 2 + i);
      ctx.fillStyle = "#fff3c0";
      ctx.fillRect((i * 67 + t * 6) % W, 200 + ((i * 31) % 180), 2, 2);
    }
  }
  ctx.globalAlpha = 1;
}

function drawBattleWeather(t) {
  const w = player.weather;
  if (!outdoorTheme(ZONES[player.zone].theme) || !["chuva", "tempestade", "neve"].includes(w)) return;
  if (w === "neve") {
    ctx.fillStyle = "rgba(255,255,255,.85)";
    for (let i = 0; i < 90; i++)
      ctx.fillRect((i * 61.3 + Math.sin(t + i) * 20) % viewWidth, (i * 89.7 + t * 40) % 480, 2, 2);
    return;
  }
  ctx.fillStyle = w === "tempestade" ? "rgba(10,14,30,.25)" : "rgba(30,40,70,.15)";
  ctx.fillRect(0, 0, viewWidth, 480);
  ctx.strokeStyle = "rgba(180,205,245,.4)";
  ctx.beginPath();
  for (let i = 0; i < 100; i++) {
    const x = (i * 73.7) % viewWidth,
      y = (i * 131.3 + t * 600) % 480;
    ctx.moveTo(x, y);
    ctx.lineTo(x, y + 14);
  }
  ctx.stroke();
}

function drawBattleVignette(enemyColor) {
  const g = ctx.createRadialGradient(viewWidth / 2, 260, 160, viewWidth / 2, 260, viewWidth * 0.75);
  g.addColorStop(0, "rgba(0,0,0,0)");
  g.addColorStop(1, "rgba(0,0,0,.45)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, viewWidth, 480);
}

function drawBattle(t) {
  const theme = ZONES[player.zone].theme;
  drawBattleSky(theme, t);
  ctx.save();
  ctx.translate(0, BATTLE_HORIZON - 272);
  drawBattleBackdrop(theme, t);
  ctx.restore();
  drawBattleGround(theme, t);
  drawBattleAmbience(theme, t);
  ctx.save();
  ctx.translate((viewWidth - 640) / 2, 0);
  game.bo = (viewWidth - 640) / 2;
  const glowColor = (player.look && player.look.staffc) || RUNES[player.runes[player.runes.length - 1]].cor;
  drawMagicCircle(BATTLE_PLAYER_POS.x + 48, BATTLE_PLAYER_POS.y + 96, glowColor, t);
  if (battle && battle.e && (battle.e.boss || battle.e.eco)) {
    const ep0 = enemyPos();
    const aura = ctx.createRadialGradient(
      ep0.x + 8 * ep0.u,
      ep0.y + 8 * ep0.u,
      10,
      ep0.x + 8 * ep0.u,
      ep0.y + 8 * ep0.u,
      12 * ep0.u,
    );
    aura.addColorStop(0, `rgba(176,108,255,${0.25 + 0.1 * Math.sin(t * 3)})`);
    aura.addColorStop(1, "rgba(176,108,255,0)");
    ctx.fillStyle = aura;
    ctx.fillRect(ep0.x - 4 * ep0.u, ep0.y - 4 * ep0.u, 24 * ep0.u, 24 * ep0.u);
  }
  const ep = enemyPos();
  ctx.fillStyle = "rgba(0,0,0,.35)";
  ctx.beginPath();
  ctx.ellipse(BATTLE_PLAYER_POS.x + 48, BATTLE_PLAYER_POS.y + 96, 48, 10, 0, 0, 7);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(ep.x + 8 * ep.u, ep.y + 16 * ep.u, 9 * ep.u, 1.6 * ep.u, 0, 0, 7);
  ctx.fill();
  const glow = glowColor;
  drawSprite(
    heroRects(player.look, "right", glow),
    BATTLE_PLAYER_POS.x,
    BATTLE_PLAYER_POS.y + Math.sin(t * 2) * 1.5,
    BATTLE_PLAYER_POS.u,
  );
  ctx.globalAlpha = 0.3 + 0.2 * Math.sin(t * 5);
  ctx.fillStyle = glow;
  circle(
    BATTLE_PLAYER_POS.x + 13.5 * BATTLE_PLAYER_POS.u,
    BATTLE_PLAYER_POS.y + 3.5 * BATTLE_PLAYER_POS.u,
    12,
  );
  ctx.globalAlpha = 1;
  if (battle.shield > 0) {
    ctx.strokeStyle = "rgba(224,171,98,.7)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(BATTLE_PLAYER_POS.x + 48, BATTLE_PLAYER_POS.y + 52, 64, Math.PI * 1.2, Math.PI * 2.8);
    ctx.stroke();
  }
  if (battle) {
    const E = battle.e;
    const sx = battle.eshake > 0 ? (Math.random() - 0.5) * 10 : 0;
    if (E.hp > 0 || battle.eshake > 0) {
      drawEnemy(battle.type, ep.x + sx, ep.y + Math.sin(t * 1.6) * 3, ep.u, t, {
        flip: true,
        accent: E.weakNow ? RUNES[E.weakNow].cor : null,
      });
      if (E.frozen > 0) {
        ctx.fillStyle = "rgba(160,230,255,.35)";
        ctx.fillRect(ep.x, ep.y, 16 * ep.u, 16 * ep.u);
      }
      if (E.burn > 0 && Math.random() < 0.5)
        game.parts.push({
          x: ep.x + Math.random() * 16 * ep.u,
          y: ep.y + 16 * ep.u,
          vx: 0,
          vy: -60,
          life: 0.5,
          max: 0.5,
          col: "#ff7a3d",
          size: 3,
        });
    }
    if (battle.sel.length) {
      battle.sel.forEach((r, i) =>
        glyph(
          r,
          BATTLE_PLAYER_POS.x + 48 + (i - (battle.sel.length - 1) / 2) * 30,
          BATTLE_PLAYER_POS.y - 22 + Math.sin(t * 4 + i) * 3,
          20,
        ),
      );
    }
  }
}
function drawTitle(t) {
  const g = ctx.createLinearGradient(0, 0, 0, 480);
  g.addColorStop(0, "#0b0716");
  g.addColorStop(1, "#2a1846");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, viewWidth, 480);
  ctx.save();
  ctx.translate((viewWidth - 640) / 2, 0);
  for (let i = 0; i < 90; i++) {
    const x = tileHash(i, 1) * viewWidth - (viewWidth - 640) / 2,
      y = tileHash(i, 2) * 480;
    ctx.fillStyle = `rgba(255,255,255,${0.2 + 0.6 * Math.abs(Math.sin(t * 1.5 + i))})`;
    ctx.fillRect(x, y, tileHash(i, 3) > 0.8 ? 2 : 1, tileHash(i, 3) > 0.8 ? 2 : 1);
  }
  // Lua
  ctx.fillStyle = "rgba(255,243,176,.07)";
  circle(520, 90, 48);
  ctx.fillStyle = "rgba(255,243,176,.1)";
  circle(520, 90, 38);
  ctx.fillStyle = "#fff3b0";
  circle(520, 90, 30);
  ctx.fillStyle = "#e8d890";
  circle(510, 82, 6);
  circle(528, 100, 4);
  // Colinas
  ctx.fillStyle = "#1c1230";
  fillPolygon(-200, 480, -200, 380, 60, 330, 220, 370, 420, 320, 640, 360, 840, 330, 840, 480);
  // Torre da magia no centro
  ctx.fillStyle = "#120b20";
  fillPolygon(270, 480, 290, 190, 320, 150, 350, 190, 370, 480);
  ctx.fillStyle = "rgba(176,108,255,.6)";
  ctx.fillRect(314, 200, 12, 16);
  // Silhueta da vila: casas e castelo com janelas acesas
  const houses = [
    [10, 400, 50, 40], [70, 390, 44, 50], [125, 405, 56, 35], [440, 395, 50, 45], [500, 405, 46, 35], [556, 392, 60, 48],
  ];
  for (const [hx, hy, hw, hh] of houses) {
    ctx.fillStyle = "#0e0818";
    ctx.fillRect(hx, hy, hw, hh);
    fillPolygon(hx - 4, hy, hx + hw / 2, hy - 22, hx + hw + 4, hy);
    ctx.fillStyle = Math.sin(t * 0.7 + hx) > -0.6 ? "#f2c14e" : "#6a5020";
    ctx.fillRect(hx + hw / 2 - 4, hy + 12, 8, 8);
  }
  ctx.fillStyle = "#0e0818";
  ctx.fillRect(190, 360, 60, 80);
  ctx.fillRect(180, 340, 16, 100);
  ctx.fillRect(244, 340, 16, 100);
  fillPolygon(176, 340, 188, 318, 200, 340);
  fillPolygon(240, 340, 252, 318, 264, 340);
  ctx.fillStyle = "#f2c14e";
  ctx.fillRect(214, 380, 10, 14);
  ctx.fillStyle = "#c94a4a";
  ctx.fillRect(252, 304, 10, 6);
  ctx.fillStyle = "#0e0818";
  ctx.fillRect(251, 304, 1, 14);
  ctx.fillStyle = "#0e0818";
  ctx.fillRect(-200, 440, 1040, 40);
  ORDER.forEach((r, i) => {
    const a = t * 0.5 + (i * Math.PI) / 2;
    glyph(r, 320 + Math.cos(a) * 190, 250 + Math.sin(a) * 60, 26, 0.4 + 0.4 * Math.sin(t * 2 + i));
  });
  ctx.restore();
}
/* ===================== PARTÍCULAS E PROJÉTEIS ===================== */

function drawParticle(p) {
  const k = Math.max(0, p.life / p.max);
  ctx.globalAlpha = k;
  ctx.fillStyle = p.col;
  const s = p.size;
  switch (p.shape) {
    case "flame":
      fillPolygon(p.x - s / 2, p.y, p.x, p.y - s * 1.6 * k, p.x + s / 2, p.y);
      break;
    case "drop":
      circle(p.x, p.y, s / 2);
      fillPolygon(p.x - s / 2.5, p.y, p.x, p.y - s, p.x + s / 2.5, p.y);
      break;
    case "arc":
      ctx.strokeStyle = p.col;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(p.x, p.y, s, p.orbit ? p.orbit.a : 0, (p.orbit ? p.orbit.a : 0) + 1.6);
      ctx.stroke();
      break;
    case "shard":
      fillPolygon(p.x - s / 2, p.y + s / 2, p.x, p.y - s / 2, p.x + s / 2, p.y + s / 3);
      break;
    case "ray":
      ctx.strokeStyle = p.col;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x + Math.cos(p.ang) * s * (1.5 - k), p.y + Math.sin(p.ang) * s * (1.5 - k));
      ctx.stroke();
      break;
    case "wisp":
      ctx.globalAlpha = k * 0.6;
      circle(p.x, p.y, s * (1.2 - k * 0.5));
      break;
    default:
      ctx.fillRect(p.x - s / 2, p.y - s / 2, s, s);
  }
}

/** Projétil de feitiço com o visual do elemento principal. */
function drawProjectile(p, t) {
  const el = (p.els && p.els[0]) || "luz";
  const color = RUNES[el] ? RUNES[el].cor : p.cols[0];
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.shadowColor = color;
  ctx.shadowBlur = 16;
  if (el === "fogo") {
    ctx.fillStyle = "#ffd34d";
    circle(0, 0, 9);
    ctx.fillStyle = "#ff7a3d";
    fillPolygon(-9, 0, -26, -6 + Math.sin(t * 30) * 3, -22, 0, -28, 6, -9, 4);
    circle(0, 0, 6);
  } else if (el === "agua") {
    ctx.fillStyle = "#bfe8ff";
    circle(0, 2, 8);
    fillPolygon(-7, 0, 0, -14, 7, 0);
    ctx.fillStyle = "#4fb8ff";
    circle(0, 3, 5);
  } else if (el === "ar") {
    ctx.rotate(t * 20);
    ctx.strokeStyle = "#9ff0cf";
    ctx.lineWidth = 3;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.arc(0, 0, 10, (i * Math.PI * 2) / 3, (i * Math.PI * 2) / 3 + 1.4);
      ctx.stroke();
    }
  } else if (el === "terra") {
    ctx.rotate(t * 8);
    ctx.fillStyle = "#8a6a3a";
    fillPolygon(-10, -4, -3, -11, 9, -6, 10, 6, -2, 10, -10, 5);
    ctx.fillStyle = "#e0ab62";
    fillPolygon(-6, -4, -1, -8, 5, -4, 0, 0);
  } else if (el === "sombra") {
    ctx.fillStyle = "#2a1a40";
    circle(0, 0, 10);
    ctx.strokeStyle = "#b08aff";
    ctx.lineWidth = 2;
    for (let i = 0; i < 4; i++) {
      const a = t * 6 + i * 1.57;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(
        Math.cos(a) * 14,
        Math.sin(a) * 14,
        Math.cos(a + 0.8) * 20,
        Math.sin(a + 0.8) * 20,
      );
      ctx.stroke();
    }
  } else {
    ctx.fillStyle = "#fff";
    circle(0, 0, 8);
    ctx.strokeStyle = "#fff0a0";
    ctx.lineWidth = 2;
    for (let i = 0; i < 8; i++) {
      const a = t * 4 + (i * Math.PI) / 4;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * 10, Math.sin(a) * 10);
      ctx.lineTo(Math.cos(a) * 18, Math.sin(a) * 18);
      ctx.stroke();
    }
  }
  ctx.restore();
}

function draw() {
  const t = game.t;
  ctx.save();
  if (game.shake > 0) ctx.translate((Math.random() - 0.5) * 8, (Math.random() - 0.5) * 8);
  if (game.mode === "title" || game.mode === "end" || game.mode === "story") drawTitle(t);
  else if (game.mode === "battle") {
    drawBattle(t);
    ctx.restore();
    ctx.save();
    drawBattleWeather(t);
    drawBattleVignette();
    ctx.restore();
    ctx.translate((viewWidth - 640) / 2, 0);
  } else {
    const dk = (player.drunk || 0) > 25 && game.mode !== "map";
    if (dk) {
      ctx.save();
      ctx.translate((Math.sin(t * 1.7) * player.drunk) / 14, (Math.cos(t * 1.3) * player.drunk) / 26);
    }
    drawWorld(t);
    drawBrawlScene(t);
    drawAffectionScene(t);
    drawWeddingScene(t);
    if (dk) {
      ctx.restore();
      ctx.fillStyle = `rgba(255,120,170,${Math.min(0.18, player.drunk / 600)})`;
      ctx.fillRect(0, 0, viewWidth, 480);
    }
    if (game.mode === "map") drawMinimap(true, t);
  }
  for (const p of game.parts) drawParticle(p);
  ctx.globalAlpha = 1;
  if (game.proj) drawProjectile(game.proj, t);
  ctx.font = '700 20px "Pixelify Sans", sans-serif';
  ctx.textAlign = "center";
  for (const f of game.floats) {
    ctx.globalAlpha = Math.min(1, f.life * 2);
    ctx.fillStyle = "#000";
    ctx.fillText(f.txt, f.x + 2, f.y + 2);
    ctx.fillStyle = f.col;
    ctx.fillText(f.txt, f.x, f.y);
  }
  ctx.globalAlpha = 1;
  ctx.restore();
  ctx.save();
  if (game.fade > 0) {
    ctx.fillStyle = `rgba(0,0,0,${game.fade})`;
    ctx.fillRect(0, 0, viewWidth, 480);
  }
  if (game.flash > 0) {
    ctx.fillStyle = `rgba(255,255,255,${game.flash * 0.8})`;
    ctx.fillRect(0, 0, viewWidth, 480);
  }
  ctx.restore();
}
let lastFrameTime = performance.now();
function loop(now) {
  const dt = Math.min(0.05, (now - lastFrameTime) / 1000);
  lastFrameTime = now;
  game.t += dt;
  // Pausado: o mundo congela (só o desenho continua).
  if (!(game.paused && game.mode === "world" && !game.dialog)) update(dt);
  draw();
  if (game.paused && game.mode === "world" && !game.dialog) drawPauseOverlay();
  // Pausa, velocidade e esperar só aparecem andando pelo mundo.
  const showTime = game.mode === "world" ? "" : "none";
  if (game.tbShown !== showTime) {
    game.tbShown = showTime;
    for (const id of ["pauseb", "speedb", "waitb"]) byId(id).style.display = showTime;
  }
  touchUI();
  requestAnimationFrame(loop);
}


/* ===================== PAUSA E VELOCIDADE DO TEMPO ===================== */

const TIME_SPEEDS = [1, 2, 4, 8];
/** Multiplicador do relógio: só acelera andando pelo mundo. */
function timeSpeed() {
  return game.mode === "world" && !game.dialog ? game.speed || 1 : 1;
}
function togglePause() {
  if (game.mode !== "world" || game.dialog) return;
  game.paused = !game.paused;
  playSound(game.paused ? 330 : 523, 0.06, "sine");
  updateTimeButtons();
}
function cycleSpeed() {
  const i = TIME_SPEEDS.indexOf(game.speed || 1);
  game.speed = TIME_SPEEDS[(i + 1) % TIME_SPEEDS.length];
  game.paused = false;
  toast(game.speed === 1 ? "Tempo normal" : `Tempo acelerado: ${game.speed}x`, 1500);
  updateTimeButtons();
}
function updateTimeButtons() {
  const pb = byId("pauseb"),
    sb = byId("speedb");
  if (pb) pb.innerHTML = game.paused ? "▶" : "❚❚";
  if (sb) sb.textContent = `${game.speed || 1}x`;
}
function drawPauseOverlay() {
  ctx.save();
  ctx.fillStyle = "rgba(10,6,18,.55)";
  ctx.fillRect(0, 0, viewWidth, 480);
  ctx.fillStyle = "#f2c14e";
  ctx.font = '700 28px "Pixelify Sans", sans-serif';
  ctx.textAlign = "center";
  ctx.fillText("PAUSADO", viewWidth / 2, 220);
  ctx.fillStyle = "#e8e4dc";
  ctx.font = '16px "VT323", monospace';
  ctx.fillText("Aperte P (ou ▶) para continuar · T muda a velocidade do tempo · H espera algumas horas", viewWidth / 2, 252);
  ctx.restore();
}
/** Passa o tempo de uma vez, gastando fome, sede e necessidades como se você tivesse esperado. */
function passTime(hours, why) {
  const mins = Math.round(hours * 60);
  const dtEq = mins / 5;
  player.food = Math.max(0, player.food - dtEq * 0.2 * difficulty().need);
  player.water = Math.max(0, player.water - dtEq * 0.28 * difficulty().need);
  lifeNeedsTick(dtEq);
  const total = player.clock + mins;
  if (total >= 1440) player.day += Math.floor(total / 1440);
  player.clock = total % 1440;
  game.fade = 1;
  rollWeather(false);
  saveGame();
  toast(why || `Você esperou ${hours}h. Agora são ${clockStr()}.`, 2600);
}
function waitMenu() {
  if (game.mode !== "world" || game.dialog) return;
  const h = currentHour();
  const until = (target) => ((target - h + 24) % 24) || 24;
  choice("Passar o tempo", `Agora: ${clockStr()}. Esperar gasta fome, sede${lifeMode() ? ", higiene e diversão" : ""}, mas não descansa.`, [
    { t: "Esperar 1 hora", fn: () => passTime(1) },
    { t: "Esperar 3 horas", fn: () => passTime(3) },
    { t: "Esperar até o meio-dia", fn: () => passTime(until(12)) },
    { t: "Esperar até o anoitecer (19h)", fn: () => passTime(until(19)) },
    { t: "Esperar até o amanhecer (6h)", fn: () => passTime(until(6)) },
    { t: "Sair", fn: null },
  ]);
}
