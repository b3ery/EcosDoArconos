/**
 * ECOS DO ARCANO — 27-clima-e-cansaco.js
 *  - Equilíbrio das runas: combinações fortes demais ficaram mais caras ou mais fracas,
 *    e os bônus de dano (cajado, afinidade, poder sombrio, bebida...) têm um teto.
 *  - O clima mexe no corpo (nos dois modos, ao ar livre): calor dá sede, chuva encharca,
 *    neve congela se você estiver sem manto.
 *  - Tempestade de trovões: raios caem de verdade e podem acertar quem está ao ar livre.
 *  - Modo História: Fôlego. Cada luta cansa; sem fôlego você não luta e precisa voltar
 *    para dormir na vila (ou numa pousada). Assim a aventura não acaba num dia só.
 */

"use strict";

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
