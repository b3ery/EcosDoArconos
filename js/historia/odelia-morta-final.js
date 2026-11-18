/**
 * ECOS DO ARCANO — odelia-morta-final.js (modo História)
 * Se a Arquimaga Odelia morreu, o Vesper não tem mais quem reencontrar.
 * O fim da história muda:
 *  - Na Torre, quando ele pergunta "ela ainda está viva?", a resposta é outra.
 *  - O epílogo leva o Vesper ao túmulo da irmã, na vila. O fantasma dela
 *    aparece uma última vez, os dois se despedem e ela finalmente descansa
 *    (o fantasma para de seguir o aprendiz).
 *  - A cena antes dos créditos vira a do túmulo, não a do abraço na fonte.
 *  - A estátua da praça mostra o Vesper sozinho, com flores no chão.
 *  - Os moradores comentam a ausência dela; o final do vilão também muda.
 * Modifica (envolve) funções de outros arquivos: silencerDefeated,
 * startEpilogue, reunionScene, drawEpilogue, chatWith, villainEnding,
 * crewDrawList, update, toast.
 */

"use strict";

(() => {
  const dead = () => !lifeMode() && player && player.flags && (player.flags.odeliaMorta || (typeof isDead === "function" && isDead("odelia")));

  /* ----- a pergunta na Torre ----- */
  const FIN_ALIVE = FINALE.slice();
  const FIN_DEAD = FINALE.slice(0, -2).concat([
    ["Você", "..."],
    ["", "Você não consegue responder. O silêncio responde por você."],
    ["Vesper", "Não. Não, não, não. Eu voltei. Eu voltei pra ela. Eu prometi na carta..."],
    ["Você", "Ela esperou você até o último dia."],
    ["Vesper", "*cai de joelhos* Trezentos anos eu guardei a Canção pra proteger alguém... e não sobrou ninguém pra eu proteger."],
    ["Narrador", "Pela primeira vez em trezentos anos, Vesper se lembra de quem realmente é. E é a lembrança mais pesada de todas. Quando a última runa é libertada, o Grande Silêncio termina, mas dentro dele começa outro."],
  ]);
  const sdBase = silencerDefeated;
  silencerDefeated = function () {
    FINALE.length = 0;
    FINALE.push(...(dead() ? FIN_DEAD : FIN_ALIVE));
    return sdBase.apply(this, arguments);
  };

  /* ----- epílogo: o túmulo em vez do abraço ----- */
  const REUNION_START = "Na Vila de Cinzaluz, Odelia observa";
  const GRAVE = [
    ["Narrador", "Na Vila de Cinzaluz, uma figura de manto escuro atravessa a praça devagar. Ninguém o reconhece. Ele também não reconhece mais a vila."],
    ["Narrador", "Ele para diante de uma pedra simples, coberta de lírios: \"Arquimaga Odelia. Guardiã da Canção.\""],
    ["Vesper", "Demorei um pouco para voltar, não foi?"],
    ["", "O vento muda. Uma luz pálida se junta acima do túmulo: o Fantasma de Odelia."],
    ["Fantasma de Odelia", "Trezentos anos, seu idiota."],
    ["Vesper", "Me perdoa. Eu cheguei tarde."],
    ["Fantasma de Odelia", "Você chegou. É o que importa. Agora ensine as crianças a cantar. Por nós dois."],
    ["Narrador", "Ela sorri, e pela primeira vez o sorriso não assusta ninguém. A luz sobe, devagar, até virar uma faísca entre as outras no céu."],
    ["Narrador", "O fantasma não segue mais ninguém. Odelia, enfim, descansa."],
    ["Narrador", "Vesper fica. Todo dia, ao entardecer, ele troca os lírios do túmulo e ensina uma nota nova da Canção para quem quiser ouvir."],
  ];
  const epBase = startEpilogue;
  startEpilogue = function () {
    const r = epBase.apply(this, arguments);
    if (!dead()) return r;
    const i = EPILOGUE.findIndex((l) => typeof l[1] === "string" && l[1].startsWith(REUNION_START));
    // tira as 5 falas do reencontro e troca pelas do túmulo
    if (i >= 0) EPILOGUE.splice(i, 5, ...GRAVE);
    else EPILOGUE.unshift(...GRAVE);
    for (const l of EPILOGUE) if (typeof l[1] === "string") l[1] = l[1].replace("e ensina as crianças a cantar na praça", "e ensina as crianças a cantar ao lado do túmulo da irmã");
    player.flags.odeliaPaz = true;
    game.ghost = null;
    return r;
  };

  // com a despedida feita, o fantasma para de seguir e de sussurrar
  const rest = () => player && player.flags && player.flags.odeliaPaz;
  const cdB = crewDrawList;
  crewDrawList = function (list, t) {
    if (rest()) game.ghost = { z: "--descansa--", x: 0, y: 0, next: Infinity };
    return cdB(list, t);
  };
  const upB = update;
  update = function (dt) {
    if (rest()) game.ghost = { z: player.zone, x: -99, y: -99, next: Infinity };
    return upB.apply(this, arguments);
  };
  const toB = toast;
  toast = function (msg) {
    if (rest() && typeof msg === "string" && msg.startsWith("Fantasma de Odelia:")) return;
    return toB.apply(this, arguments);
  };

  /* ----- a cena antes dos créditos ----- */
  function graveScene(W, H, t) {
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, "#5a4a7a");
    sky.addColorStop(0.6, "#b0607a");
    sky.addColorStop(1, "#2a2236");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);
    const gy = H * 0.66;
    ctx.fillStyle = "#3a4a36";
    ctx.fillRect(0, gy, W, H - gy);
    ctx.fillStyle = "#2e3c2c";
    for (let x = 0; x < W; x += 14) ctx.fillRect(x, gy, 6, 3);
    // a lápide, firme no chão
    const sx = W / 2 + 30;
    ctx.fillStyle = "#6a6470";
    ctx.fillRect(sx - 34, gy - 86, 68, 86);
    ctx.beginPath();
    ctx.arc(sx, gy - 86, 34, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = "#8a8490";
    ctx.fillRect(sx - 28, gy - 82, 6, 80);
    ctx.fillStyle = "#4a4450";
    ctx.fillRect(sx - 3, gy - 104, 6, 32);
    ctx.fillRect(sx - 14, gy - 94, 28, 6);
    ctx.fillStyle = "#4a3a2a";
    ctx.fillRect(sx - 46, gy - 4, 92, 8);
    // lírios na base
    for (let i = 0; i < 7; i++) {
      const fx = sx - 40 + i * 13;
      ctx.fillStyle = "#3a6a3a";
      ctx.fillRect(fx + 2, gy - 14, 2, 12);
      ctx.fillStyle = i % 2 ? "#f2eef8" : "#e8d8f0";
      ctx.fillRect(fx, gy - 18, 6, 5);
      ctx.fillStyle = "#f2c14e";
      ctx.fillRect(fx + 2, gy - 17, 2, 2);
    }
    // Vesper de joelhos, chegando aos poucos
    const k = Math.min(1, t / 2.6);
    const vx = W / 2 - 200 + k * 130;
    drawSprite(wizardRects("#3a2a5a", null, "#1a1410", null, "right", k < 1 ? Math.floor(t * 4) % 2 : 0), vx, gy - 66, 4, false);
    // o fantasma sobe do túmulo
    if (t > 3) {
      const o = NPCS.odelia || { robe: "#5b3fa8", hat: "#3a2878", hair: "#d9d9d9" };
      const g = Math.min(1, (t - 3) / 1.5);
      const rise = t > 6 ? (t - 6) * 60 : 0;
      ctx.save();
      ctx.globalAlpha = 0.55 * g * Math.max(0, 1 - rise / 220);
      ctx.filter = "saturate(0.5) brightness(1.4)";
      drawSprite(wizardRects(o.robe, o.hat, o.hair, null, "left", 0), sx - 32, gy - 190 - rise + Math.sin(t * 1.6) * 4, 4, false);
      ctx.restore();
      for (let i = 0; i < 24; i++) {
        ctx.fillStyle = `rgba(230,220,255,${0.5 * g})`;
        ctx.fillRect(sx - 40 + ((i * 37) % 80), gy - 60 - ((t * 40 + i * 19) % 220), 2, 2);
      }
    }
    ctx.textAlign = "center";
    txt("Trezentos anos depois...", W / 2, 54, 24, "#fff");
    if (t > 3.6) txt("\"Demorei um pouco para voltar, não foi?\"", W / 2, H - 64, 18, `rgba(255,255,255,${Math.min(1, t - 3.6)})`, 600);
    if (t > 5.6) txt("A Canção voltou. Ela, não.", W / 2, H - 32, 22, `rgba(230,220,255,${Math.min(1, t - 5.6)})`);
  }
  window.graveScene = graveScene;
  if (typeof reunionScene === "function") {
    const rsBase = reunionScene;
    reunionScene = function (W, H, t) {
      if (player && player.flags && (player.flags.odeliaPaz || dead())) return graveScene(W, H, t);
      return rsBase(W, H, t);
    };
  }

  /* ----- a estátua da praça ----- */
  if (typeof drawEpilogue === "function") {
    const deBase = drawEpilogue;
    drawEpilogue = function (t) {
      if (!(player.flags.odeliaPaz || dead()) || player.villainEnd) return deBase(t);
      // desenha a versão de sempre e cobre a Odelia com um túmulo pequeno
      deBase(t);
      if (!player.finished || player.zone !== "vila") return;
      const { cx, cy } = protestPlaza();
      const X = (cx + 3) * TILE - 90,
        Y = (cy + 6) * TILE;
      ctx.fillStyle = "#3a4a36";
      ctx.fillRect(X - 2, Y - 2, 34, 34);
      ctx.fillStyle = "#6a6470";
      ctx.fillRect(X + 6, Y + 6, 20, 24);
      ctx.beginPath();
      ctx.arc(X + 16, Y + 6, 10, Math.PI, 0);
      ctx.fill();
      ctx.fillStyle = "#4a4450";
      ctx.fillRect(X + 14, Y + 2, 4, 14);
      ctx.fillRect(X + 10, Y + 6, 12, 3);
      for (let i = 0; i < 4; i++) ((ctx.fillStyle = "#f2eef8"), ctx.fillRect(X + 4 + i * 7, Y + 27, 4, 3));
    };
  }

  /* ----- o que a vila fala depois ----- */
  if (typeof EPI_LINES !== "undefined") {
    const LUTO = ["Todo fim de tarde o Vesper troca os lírios do túmulo dela. Nunca falha um dia.", "A Odelia não viu a Canção voltar. Mas eu juro que ouvi ela cantar junto naquela noite.", "Meus filhos brincam de ser você. Ninguém quer fazer a Odelia: dizem que dá tristeza.", "O Vesper mora na torre velha da Odelia agora. Diz que é pra não deixar a casa esquecer dela."];
    const cwBase = chatWith;
    chatWith = function (id) {
      if (story() && player.finished && !player.villainEnd && player.flags.odeliaPaz && Math.random() < 0.5) return say([[shortName(id), pk(LUTO)]]);
      return cwBase(id);
    };
  }
  if (typeof VILLAIN_FINALES !== "undefined") {
    const vfBase = villainEnding;
    villainEnding = function (kind) {
      const V = VILLAIN_FINALES;
      const orig = { a: V.alianca.slice(), t: V.trono.slice() };
      if (dead()) {
        V.alianca = V.alianca.map((l) => (l[1].includes("Odelia fecha os olhos") ? ["Narrador", "Os dois descem da Torre lado a lado. Em Cinzaluz, ninguém mais leva lírios ao túmulo de Odelia."] : l));
        V.trono = V.trono.map((l) => (l[1].includes("uma irmã chamando") ? ["Narrador", "Vesper passa os dias sentado no túmulo da irmã. Diz que, se ficar quieto, ainda ouve a voz dela. Ninguém tem coragem de dizer que não."] : l));
      }
      const r = vfBase.apply(this, arguments);
      V.alianca = orig.a;
      V.trono = orig.t;
      return r;
    };
  }
})();
