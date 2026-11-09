/**
 * ECOS DO ARCANO — floresta.js
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
