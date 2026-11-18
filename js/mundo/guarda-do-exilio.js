/**
 * ECOS DO ARCANO — guarda-do-exilio.js
 * Quando o mago é exilado (a forca não mata magos), o exílio vale de verdade
 * por 30 dias:
 *  - Na entrada de Cinzaluz um guarda barra a passagem e te manda embora.
 *  - De capuz, o guarda da porta não te reconhece... mas um guarda patrulha a
 *    vila. Se ele te vir, corre atrás de você e te expulsa para o Bosque.
 * Modifica (envolve) funções de outros arquivos: enterZone, update, crewDrawList.
 */

"use strict";

(() => {
  const EXILE_DAYS = 30;
  function exileOn() {
    if (!player || !player.exiled || player.exileOver) return false;
    if (player.day >= player.exiled + EXILE_DAYS) {
      player.exileOver = true;
      setTimeout(() => toast("Seu exílio acabou. Você pode voltar a Cinzaluz.", 4000), 1500);
      return false;
    }
    return true;
  }
  const hooded = () => player.look && (player.look.hat === "capuz" || player.look.hat2 === "capuz");
  const exWord = () => "exilad" + genderWord("o", "a", "e");

  function sendToExile(lines) {
    game.exG = null;
    say(lines, () => {
      player.zone = "bosque";
      const z = ZONES.bosque;
      const s = (z.spawn && z.spawn[0]) || [5, 5];
      player.x = s[0];
      player.y = s[1];
      game.fade = 1;
      enterZone();
      saveGame();
    });
  }

  const ezBase = enterZone;
  enterZone = function () {
    const prev = game.exPrevZone;
    const r = ezBase.apply(this, arguments);
    game.exPrevZone = player.zone;
    if (player.zone !== "vila") game.exG = null;
    if (player.zone === "vila" && prev && prev !== "vila" && prev !== "interior" && exileOn()) {
      if (hooded()) setTimeout(() => toast("De capuz, o guarda da porta não te reconheceu. Cuidado com a patrulha!", 3200), 600);
      else
        setTimeout(
          () =>
            sendToExile([
              ["Guarda da Porta", `Alto lá! Eu conheço essa cara. Você foi ${exWord()} por ordem da Rainha!`],
              ["Guarda da Porta", `Faltam ${player.exiled + EXILE_DAYS - player.day} dia(s) para acabar o seu exílio. Até lá, Cinzaluz não é lugar para você.`],
              ["", "O guarda cruza a lança na sua frente e te empurra de volta para a estrada do Bosque."],
            ]),
          350,
        );
    }
    return r;
  };

  /* ----- a patrulha ----- */
  function guardTickExile(dt) {
    if (player.zone !== "vila" || !exileOn() || game.mode !== "world" || game.dialog) return;
    let g = game.exG;
    if (!g) {
      const p = randomRoadTile(14);
      if (!p) return;
      g = game.exG = { x: p[0], y: p[1], rx: p[0], ry: p[1], step: 0, dir: "down", chase: false, wander: null };
    }
    g.rx += (g.x - g.rx) * Math.min(1, dt * 8);
    g.ry += (g.y - g.ry) * Math.min(1, dt * 8);
    const field = distanceField();
    const d = field.get(g.x + "," + g.y);
    const sight = hooded() ? 2 : 7;
    if (!g.chase && d != null && d <= sight) {
      g.chase = true;
      game.bubbles.push({ x: g.x, y: g.y, icon: "anger", t: 1.2 });
      toast(`Guarda: "Ei! ${exWord()[0].toUpperCase() + exWord().slice(1)}! Parad${genderWord("o", "a", "e")} aí!"`, 2200);
      playSound(220, 0.2, "square");
    }
    if (g.chase && (d == null || d > 14)) {
      g.chase = false;
      toast("Você despistou o guarda... por enquanto.", 1800);
    }
    if (g.chase && d != null && d <= 1) {
      return sendToExile([
        ["Guarda Real", hooded() ? "Achou que um capuz ia me enganar? Eu reconheço esse jeito de andar." : `Te peguei! ${exWord()[0].toUpperCase() + exWord().slice(1)} não anda por Cinzaluz!`],
        ["", "O guarda te segura pelo braço e te arrasta até a saída da vila."],
        ["Guarda Real", "Volte quando o exílio acabar. Da próxima vez, é o calabouço."],
      ]);
    }
    g.step -= dt;
    if (g.step > 0) return;
    g.step = g.chase ? 0.26 : 0.55;
    const opts = DIRS4.map(([a, b]) => [g.x + a, g.y + b]).filter(([x, y]) => walkable("vila", x, y) && !(x === player.x && y === player.y));
    if (!opts.length) return;
    let nx;
    if (g.chase) nx = opts.sort((p, q) => (field.get(p[0] + "," + p[1]) ?? 99) - (field.get(q[0] + "," + q[1]) ?? 99))[0];
    else {
      if (!g.wander || Math.random() < 0.08) g.wander = DIRS4[Math.floor(Math.random() * 4)];
      nx = opts.find(([x, y]) => x === g.x + g.wander[0] && y === g.y + g.wander[1]);
      if (!nx) (g.wander = null), (nx = opts[Math.floor(Math.random() * opts.length)]);
    }
    g.dir = nx[1] < g.y ? "up" : nx[1] > g.y ? "down" : nx[0] < g.x ? "left" : "right";
    g.x = nx[0];
    g.y = nx[1];
  }
  const upBase = update;
  update = function (dt) {
    upBase(dt);
    try {
      guardTickExile(Math.min(dt, 0.1));
    } catch (e) {
      console.error(e);
    }
  };
  const cdBase = crewDrawList;
  crewDrawList = function (list, t) {
    cdBase(list, t);
    const g = game.exG;
    if (!g || player.zone !== "vila") return;
    list.push({
      y: g.ry,
      draw: () => {
        ctx.fillStyle = "rgba(0,0,0,.25)";
        ctx.beginPath();
        ctx.ellipse(g.rx * TILE + 16, g.ry * TILE + 30, 9, 3, 0, 0, 7);
        ctx.fill();
        drawSprite(wizardRects("#4a4a5a", "#5a5a6a", "#3a2414", null, g.dir, walkFrame(true, t)), g.rx * TILE, g.ry * TILE, 2);
        // lança
        ctx.fillStyle = "#8a6a3a";
        ctx.fillRect(g.rx * TILE + 27, g.ry * TILE - 4, 2, 30);
        ctx.fillStyle = "#d9d9e8";
        ctx.fillRect(g.rx * TILE + 26, g.ry * TILE - 8, 4, 5);
        if (g.chase) drawPixelIcon("anger", g.rx * TILE + 16, g.ry * TILE - 12, 2);
      },
    });
  };
  window.exileOn = exileOn;
})();
