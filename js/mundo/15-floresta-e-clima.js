/* 15-floresta-e-clima.js: junta 20-floresta.js, 27-clima-e-cansaco.js. */
/**
 * ECOS DO ARCANO — 15-floresta-e-clima.js
 * Floresta Grande (só no Simulador de Vida): animais que andam pelo mapa.
 * Lobos, javalis e ursos atacam quem chega perto; cervos fogem.
 * Lutar e caçar é com E na hora certa do medidor de força.
 * Facão: sem ele o dano é fraco. O facão gasta com o uso e precisa ser trocado.
 */

"use strict";

const ANIMALS = {
  lobo: { n: "Lobo", hp: 30, dmg: 7, step: 0.3, hostile: true, color: "#6d6a7c", shape: "beast", u: 2, loot: ["couro", "carne"] },
  javali: { n: "Javali", hp: 40, dmg: 10, step: 0.34, hostile: true, color: "#7a5a3a", shape: "beast", u: 2.1, loot: ["carne", "carne"] },
  urso: { n: "Urso", hp: 85, dmg: 16, step: 0.5, hostile: true, color: "#4a3020", shape: "golem", u: 2.5, loot: ["couro", "couro", "carne"] },
  cervo: { n: "Cervo", hp: 20, dmg: 0, step: 0.24, hostile: false, color: "#b08a5a", shape: "beast", u: 2, loot: ["carne", "couro"] },
};
const ANIMAL_MIX = ["lobo", "lobo", "javali", "javali", "urso", "cervo", "cervo", "cervo"];

const BLADES = { facaoA: { mul: 3, uses: 120 }, facao: { mul: 2, uses: 40 } };
/** O melhor facão que você carrega (ou null). */
function currentBlade() {
  return ["facaoA", "facao"].find((k) => itemCount(k) > 0) || null;
}
function bladeUses() {
  const b = currentBlade();
  if (!b) return 0;
  player.facaoUses = player.facaoUses || {};
  if (player.facaoUses[b] == null) player.facaoUses[b] = BLADES[b].uses;
  return player.facaoUses[b];
}
/** Um golpe gasta o facão; quando acaba, ele quebra. */
function wearBlade() {
  const b = currentBlade();
  if (!b) return;
  player.facaoUses[b] = bladeUses() - 1;
  if (player.facaoUses[b] === 10) toast(`Seu ${ITEMS[b].nome} está quase quebrando (10 golpes).`, 2600);
  if (player.facaoUses[b] <= 0) {
    removeItem(b);
    delete player.facaoUses[b];
    playSound(180, 0.2, "square");
    toast(`Seu ${ITEMS[b].nome} quebrou! Compre outro com o Brann ou com o Guarda-Florestal.`, 3600);
  }
}
function sellBladeMenu() {
  choice("Guarda-Florestal Brás", "\"Sem facão a floresta te engole. Tenho um aqui.\"", [
    {
      t: `Comprar Facão de Mato (${withTax(45)} ouro)`,
      icon: "sword",
      fn: () => {
        if (player.gold < withTax(45)) return say([["Guarda-Florestal Brás", "Sem ouro? Então fique na trilha e corra dos lobos."]]);
        payWithTax(45);
        addItem("facao");
        player.facaoUses = player.facaoUses || {};
        player.facaoUses.facao = BLADES.facao.uses;
        saveGame();
        say([["Guarda-Florestal Brás", "Tome. Afiado e pronto. Volte vivo!"]]);
      },
    },
    { t: "Agora não", fn: null },
  ]);
}

/** Animais nascem ao entrar na floresta. */
function spawnAnimals() {
  game.animals = [];
  if (!lifeMode() || player.zone !== "floresta") return;
  if (!currentBlade()) setTimeout(() => toast("Cuidado: você está sem facão! O Guarda-Florestal ou o Brann vendem um.", 4200), 1500);
  const z = ZONES.floresta;
  const spots = z.spawn.filter(([x, y]) => Math.abs(x - player.x) + Math.abs(y - player.y) > 12);
  for (let i = 0; i < 16 && spots.length; i++) {
    const [x, y] = spots.splice(Math.floor(Math.random() * spots.length), 1)[0];
    const type = ANIMAL_MIX[Math.floor(Math.random() * ANIMAL_MIX.length)];
    game.animals.push({ type, x, y, rx: x, ry: y, hp: ANIMALS[type].hp, t: Math.random(), cd: 0, dir: "left", hurt: 0 });
  }
}
function animalAt(x, y) {
  return (game.animals || []).find((a) => a.x === x && a.y === y);
}
function animalDamage(a) {
  const base = ANIMALS[a.type].dmg * (isNight() ? 1.3 : 1);
  return Math.max(1, Math.round(base * (1 - Math.min(0.6, equipStat("def"))) * (0.85 + Math.random() * 0.3)));
}

function animalsTick(dt) {
  if (player.zone !== "floresta" || !lifeMode() || game.mode !== "world" || game.dialog) return;
  for (const a of game.animals || []) {
    const A = ANIMALS[a.type];
    a.rx += (a.x - a.rx) * Math.min(1, dt * 8);
    a.ry += (a.y - a.ry) * Math.min(1, dt * 8);
    a.cd -= dt;
    a.hurt = Math.max(0, a.hurt - dt);
    const d = Math.abs(a.x - player.x) + Math.abs(a.y - player.y);
    // Ataque: encostou, morde.
    if (A.hostile && d === 1 && a.cd <= 0) {
      a.cd = 1.3;
      const dmg = animalDamage(a);
      player.hp -= dmg;
      game.shake = 0.2;
      playSound(140, 0.12, "square");
      game.bubbles.push({ x: player.x, y: player.y, icon: "anger", t: 0.8 });
      toast(`${A.n} te atacou! −${dmg} de vida`, 1400);
      if (player.hp <= 0) return faintInForest(A.n);
      continue;
    }
    a.t -= dt;
    if (a.t > 0) continue;
    a.t = A.step;
    let best = null;
    if (A.hostile && d <= 6) {
      // Persegue pelo caminho mais curto até você.
      const field = distanceField();
      const here = field.get(a.x + "," + a.y) ?? 1e9;
      for (const [x, y] of DIRS4) {
        const v = field.get(a.x + x + "," + (a.y + y));
        if (v != null && v < here && !(a.x + x === player.x && a.y + y === player.y) && !animalAt(a.x + x, a.y + y))
          if (!best || v < best[2]) best = [x, y, v];
      }
    } else if (!A.hostile && d <= 5) {
      // Cervo foge.
      for (const [x, y] of DIRS4) {
        if (!walkable("floresta", a.x + x, a.y + y) || animalAt(a.x + x, a.y + y)) continue;
        const v = Math.abs(a.x + x - player.x) + Math.abs(a.y + y - player.y);
        if (!best || v > best[2]) best = [x, y, v];
      }
      a.t = A.step * 0.7;
    } else if (Math.random() < 0.35) {
      const [x, y] = DIRS4[Math.floor(Math.random() * 4)];
      if (walkable("floresta", a.x + x, a.y + y) && !animalAt(a.x + x, a.y + y) && !(a.x + x === player.x && a.y + y === player.y)) best = [x, y];
      a.t = 1 + Math.random();
    }
    if (best) {
      a.x += best[0];
      a.y += best[1];
      if (best[0]) a.dir = best[0] > 0 ? "right" : "left";
    }
  }
}

/** Texto do "E · ..." para animais. */
function animalLabel(x, y) {
  if (player.zone !== "floresta" || !lifeMode()) return null;
  const a = animalAt(x, y);
  if (!a) return null;
  const b = currentBlade();
  return `${ANIMALS[a.type].hostile ? "Lutar com" : "Caçar"} ${ANIMALS[a.type].n} (${Math.max(0, Math.ceil(a.hp))} de vida) · ${b ? `${ITEMS[b].nome} ${bladeUses()}` : "sem facão!"}`;
}
function animalInteract(x, y) {
  const a = animalLabel(x, y) && animalAt(x, y);
  if (!a) return false;
  const A = ANIMALS[a.type];
  const q = swingFeedback(x, y, "sword");
  if (!q) return true;
  const b = currentBlade();
  const dmg = Math.round((q === 2 ? 7 : 3.5) * (b ? BLADES[b].mul : 1));
  a.hp -= dmg;
  wearBlade();
  a.hurt = 0.4;
  playSound(220, 0.08, "square");
  // Empurrão para trás.
  const kx = Math.sign(a.x - player.x),
    ky = Math.sign(a.y - player.y);
  if (walkable("floresta", a.x + kx, a.y + ky) && !animalAt(a.x + kx, a.y + ky)) {
    a.x += kx;
    a.y += ky;
  }
  a.cd = Math.max(a.cd, 0.6);
  if (a.hp <= 0) {
    game.animals = game.animals.filter((q2) => q2 !== a);
    for (const it of A.loot) addItem(it);
    player.huntKills = (player.huntKills || 0) + 1;
    addNeed("energy", -3);
    playSound(784, 0.12, "sine");
    toast(`Você venceu: ${A.n}! Ganhou ${A.loot.map((i) => ITEMS[i].nome).join(", ")}.`, 2600);
    saveGame();
  }
  return true;
}
/** Desmaiou na floresta: alguém te leva ao hospital da vila. */
function faintInForest(by) {
  game.animals = [];
  const lost = Math.floor(player.gold * 0.15);
  player.gold -= lost;
  player.injured = true;
  player.hp = Math.round(maxHp() * 0.4);
  const [hx, hy] = npcPos("curandeira");
  player.zone = "vila";
  player.x = hx;
  player.y = hy + 1;
  player.dir = "up";
  game.fade = 1;
  enterZone();
  saveGame();
  say([
    ["", `Tudo escurece... O ataque do ${by} foi demais.`],
    ["Curandeira Maíra", `O Guarda-Florestal te trouxe desmaiado.${lost ? ` Você perdeu ${lost} de ouro pelo caminho.` : ""} Fale comigo para tratar os ferimentos.`],
  ]);
}

function animalsDrawList(list, t) {
  if (player.zone !== "floresta" || !lifeMode()) return;
  for (const a of game.animals || []) {
    const A = ANIMALS[a.type];
    list.push({
      y: a.ry,
      draw: () => {
        const s = 16 * A.u;
        const X = a.rx * TILE + 16 - s / 2,
          Y = a.ry * TILE + 30 - s;
        ctx.fillStyle = "rgba(0,0,0,.25)";
        ctx.beginPath();
        ctx.ellipse(a.rx * TILE + 16, a.ry * TILE + 29, 10, 3, 0, 0, 7);
        ctx.fill();
        ctx.save();
        if (a.hurt > 0 && Math.floor(t * 20) % 2) ctx.globalAlpha = 0.5;
        drawSprite(enemyRects(A.shape, A.color, t), X, Y, A.u, a.dir === "left");
        ctx.restore();
        if (a.hp < A.hp) {
          ctx.fillStyle = "#2a1f3d";
          ctx.fillRect(a.rx * TILE + 2, Y - 6, 28, 4);
          ctx.fillStyle = A.hostile ? "#e0303a" : "#7ad36b";
          ctx.fillRect(a.rx * TILE + 2, Y - 6, 28 * Math.max(0, a.hp / A.hp), 4);
        }
        if (A.hostile && Math.abs(a.x - player.x) + Math.abs(a.y - player.y) <= 6)
          drawPixelIcon("anger", a.rx * TILE + 16, Y - 12 - Math.abs(Math.sin(t * 6)) * 2, 2);
      },
    });
  }
}

/* ======================================================================
   (antes: 27-clima-e-cansaco.js)
   ====================================================================== */

/**
 * ECOS DO ARCANO — 15-floresta-e-clima.js
 *  - Equilíbrio das runas: combinações fortes demais ficaram mais caras ou mais fracas,
 *    e os bônus de dano (cajado, afinidade, poder sombrio, bebida...) têm um teto.
 *  - O clima mexe no corpo (nos dois modos, ao ar livre): calor dá sede, chuva encharca,
 *    neve congela se você estiver sem manto.
 *  - Tempestade de trovões: raios caem de verdade e podem acertar quem está ao ar livre.
 *  - Modo História: Fôlego. Cada luta cansa; sem fôlego você não luta e precisa voltar
 *    para dormir na vila (ou numa pousada). Assim a aventura não acaba num dia só.
 */


/* ===================== EQUILÍBRIO DAS RUNAS ===================== */

const SPELL_BALANCE = {
  "fogo+fogo": { pow: 22, mp: 8 },
  "agua+agua": { pow: 22, mp: 8 },
  "ar+ar": { pow: 11, mp: 8 },
  "terra+terra": { shield: 3, mp: 7 },
  "fogo+terra": { pow: 30, mp: 14 },
  "agua+terra": { heal: 32, mp: 9 },
  "luz+luz": { pow: 22, mp: 8 },
  "sombra+sombra": { pow: 18, mp: 9 },
  "fogo+luz": { pow: 20, burn: 2, mp: 11 },
  "agua+luz": { heal: 36, mp: 10 },
  "ar+luz": { pow: 10, mp: 9 },
  "terra+luz": { shield: 2, heal: 16, mp: 10 },
  "fogo+sombra": { pow: 24, burn: 2, mp: 12 },
  "luz+sombra": { pow: 36, mp: 18 },
};
for (const [k, v] of Object.entries(SPELL_BALANCE)) if (SPELLS[k]) Object.assign(SPELLS[k], v);

/** Os bônus de dano se somam, mas com teto: acima de +80% rende metade, e nunca passa de +160%. */
const _dmgMulBase = dmgMul;
dmgMul = function (els) {
  player.darkPower = Math.min(0.35, player.darkPower || 0);
  const m = _dmgMulBase(els);
  const soft = m > 1.8 ? 1.8 + (m - 1.8) * 0.5 : m;
  return Math.min(2.6, soft);
};

/* ===================== O CLIMA NO CORPO ===================== */

function outdoorsNow() {
  const z = ZONES[player.zone];
  return !!z && outdoorTheme(z.theme);
}
function warmClothes() {
  const m = player.eq && player.eq.manto;
  return !!(m && ITEMS[m] && (ITEMS[m].def || 0) >= 0.15);
}
/** Estado do corpo: calor, encharcado ou com frio. */
function bodyState() {
  if ((player.cold || 0) >= 60) return { n: "Congelando", c: "#9fd0ff", icon: "snow", d: "Frio demais: a vida cai aos poucos. Entre em casa, perto do fogo, ou use um manto reforçado." };
  if ((player.wet || 0) >= 60) return { n: "Encharcado", c: "#7ab0e0", icon: "rain", d: "Roupa molhada: a fome e o cansaço aumentam. Seque-se dentro de casa." };
  if (game.hot) return { n: "Calor", c: "#ffb35a", icon: "sun", d: "Sol forte: a sede cai bem mais rápido. Beba água e procure sombra." };
  return null;
}
function bodyWeatherTick(dt) {
  if (game.mode !== "world" || !player.zone) return;
  const sdt = dt * (typeof timeSpeed === "function" ? timeSpeed() : 1);
  const out = outdoorsNow(),
    w = player.weather,
    h = currentHour();
  // Calor: verão ou sol forte no meio do dia.
  game.hot = out && w === "sol" && h >= 11 && h < 16 && season().id !== "inv";
  if (game.hot) player.water = Math.max(0, player.water - sdt * 0.18);
  // Chuva e tempestade encharcam; dentro de casa você seca.
  if (out && (w === "chuva" || w === "tempestade")) player.wet = Math.min(100, (player.wet || 0) + sdt * (w === "tempestade" ? 1.6 : 0.9));
  else player.wet = Math.max(0, (player.wet || 0) - sdt * (out ? 0.6 : 2.5));
  if ((player.wet || 0) >= 60) {
    player.food = Math.max(0, player.food - sdt * 0.06);
    if (lifeMode()) addNeed("energy", -sdt * 0.05);
  }
  // Neve: frio sobe sem manto reforçado; perto do fogo (dentro de casa) passa.
  if (out && w === "neve" && !warmClothes()) player.cold = Math.min(100, (player.cold || 0) + sdt * 0.9);
  else player.cold = Math.max(0, (player.cold || 0) - sdt * (out ? 0.8 : 3));
  if ((player.cold || 0) >= 60) {
    game.coldT = (game.coldT || 0) + dt;
    if (game.coldT >= 4) {
      game.coldT = 0;
      if (player.hp > 1) player.hp = Math.max(1, player.hp - 2);
    }
  }
  const st = bodyState();
  const key = st ? st.n : "";
  if (key !== game.bodyKey) {
    game.bodyKey = key;
    if (st) toast(`${st.n}! ${st.d}`, 4200);
  }
  lightningTick(dt);
}

/* ===================== TEMPESTADE DE TROVÕES ===================== */

WEATHER.tempestade.n = "Tempestade de trovões";
WEATHER.tempestade.fx = "Vento +25% e Maré +10%. Chama −15% e Terra −10%. Raios caem do céu: fique dentro de casa!";
function lightningTick(dt) {
  if (player.weather !== "tempestade" || !outdoorsNow() || game.mode !== "world" || game.dialog) {
    game.bolt = null;
    return;
  }
  game.boltT = (game.boltT ?? 6) - dt;
  if (game.bolt) {
    game.bolt.t -= dt;
    if (game.bolt.t <= 0.25 && !game.bolt.hit) {
      game.bolt.hit = true;
      game.lt = 0.75;
      playSound(55, 1.1, "sawtooth", 0.07);
      playSound(40, 1.4, "square", 0.05);
      game.shake = 0.35;
      if (game.bolt.x === player.x && game.bolt.y === player.y) {
        const dmg = Math.max(4, Math.round(maxHp() * 0.18));
        player.hp = Math.max(1, player.hp - dmg);
        if (lifeMode()) addNeed("energy", -15);
        toast(`Um raio caiu em você! −${dmg} de vida. Saia da chuva!`, 3200);
      } else if (Math.abs(game.bolt.x - player.x) + Math.abs(game.bolt.y - player.y) <= 2) toast("Um raio caiu bem do seu lado!", 1800);
    }
    if (game.bolt.t <= 0) game.bolt = null;
  }
  if (game.boltT <= 0) {
    game.boltT = 5 + Math.random() * 7;
    // Às vezes mira em você: um aviso no chão aparece antes do raio.
    const onYou = Math.random() < 0.3;
    const x = onYou ? player.x : player.x + Math.round((Math.random() - 0.5) * 12),
      y = onYou ? player.y : player.y + Math.round((Math.random() - 0.5) * 9);
    game.bolt = { x, y, t: 1.1, hit: false, seed: Math.random() * 1000 };
  }
}
/** Desenha o aviso no chão e o raio (chamado pelo desenho do clima). */
function drawLightning(t) {
  const b = game.bolt,
    c = game.cam;
  if (!b || !c) return;
  const sx = (b.x * TILE + 16 - c.camX) * c.Z,
    sy = (b.y * TILE + 26 - c.camY) * c.Z;
  if (!b.hit) {
    const a = 0.3 + 0.4 * Math.abs(Math.sin(t * 20));
    ctx.strokeStyle = `rgba(255,240,140,${a})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(sx, sy, 14 * c.Z * 0.6, 5 * c.Z * 0.6, 0, 0, 7);
    ctx.stroke();
    return;
  }
  ctx.strokeStyle = "rgba(255,255,230,.95)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  let x = sx + Math.sin(b.seed) * 30,
    y = 0;
  ctx.moveTo(x, y);
  const steps = 9;
  for (let i = 1; i <= steps; i++) {
    y = (sy * i) / steps;
    x = sx + (i < steps ? Math.sin(b.seed + i * 2.3) * 22 * (1 - i / steps) : 0);
    ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.strokeStyle = "rgba(160,190,255,.5)";
  ctx.lineWidth = 7;
  ctx.stroke();
  ctx.fillStyle = "rgba(255,240,180,.6)";
  ctx.beginPath();
  ctx.ellipse(sx, sy, 18, 6, 0, 0, 7);
  ctx.fill();
}

/* ===================== FÔLEGO NO MODO HISTÓRIA ===================== */

function staminaOn() {
  return !lifeMode();
}
function stamina() {
  return player.stamina ?? 100;
}
/** Quanto cada luta cansa. */
function fightCost(type) {
  if (type === "boneco") return 0;
  const info = typeof ENEMIES !== "undefined" ? ENEMIES[type] : null;
  return info && info.boss ? 22 : 9;
}
const _startBattleBase = startBattle;
startBattle = function (type, mob, opts = {}) {
  if (staminaOn() && type !== "boneco" && !(opts && opts.tut >= 0)) {
    const cost = fightCost(type);
    if (stamina() < cost) {
      game.grace = 4;
      const hit = Math.max(1, Math.round(maxHp() * 0.08));
      player.hp = Math.max(1, player.hp - hit);
      game.shake = 0.2;
      say([
        ["", `Você está exaust${genderWord("o", "a", "e")} demais para lutar (Fôlego ${Math.round(stamina())}). O monstro te acerta enquanto você foge: −${hit} de vida.`],
        ["", "Volte para a vila e durma em casa ou numa pousada. Amanhã você recupera o fôlego."],
      ]);
      return;
    }
    player.stamina = Math.max(0, stamina() - cost);
    if (player.stamina < 30 && !game.tiredWarn) {
      game.tiredWarn = true;
      setTimeout(() => toast("Seu fôlego está acabando. Mais algumas lutas e você vai precisar dormir.", 3800), 900);
    }
    if (player.stamina >= 30) game.tiredWarn = false;
  }
  return _startBattleBase(type, mob, opts);
};
/** Cansado luta pior: com menos de 30 de fôlego, −15% de dano. */
const _dmgMulBal = dmgMul;
dmgMul = function (els) {
  const m = _dmgMulBal(els);
  return staminaOn() && stamina() < 30 && game.mode === "battle" ? m * 0.85 : m;
};
