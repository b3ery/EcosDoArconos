/**
 * ECOS DO ARCANO — corte-e-audiencias.js  (Simulador de Vida)
 * Governar sentad(o) no trono (inspirado em Reigns e na corte de Crusader Kings):
 *  - Quem governa entra na sala do trono e SENTA NO TRONO de verdade.
 *  - Sentad(o), começa a AUDIÊNCIA: os súditos entram um por um pelo tapete
 *    vermelho, param na frente do estrado e fazem o pedido. Você decide entre
 *    duas respostas.
 *  - Cada decisão mexe nas QUATRO FORÇAS DO REINO: Igreja, Povo, Exército e
 *    Tesouro (barras no alto da tela). Nenhuma pode zerar nem estourar:
 *      Povo zerado = revolta; Exército zerado = invasão / golpe;
 *      Exército no máximo = o general quer o trono; Igreja zerada = o bispo te
 *      excomunga; Igreja no máximo = o clero manda em tudo; Tesouro zerado =
 *      falência; Tesouro no máximo = os nobres conspiram por inveja.
 *  - GRANDEZA DA CORTE: audiências bem resolvidas e festas aumentam; ela
 *    protege contra golpes e dá prestígio (reputação).
 *  - As forças também mudam sozinhas com o regime, as leis e o dia a dia.
 * Modifica (envolve) funções de outros arquivos: interactAt, targetAt,
 * crewDrawList, update, onNewDay, choice.
 */

"use strict";

(() => {
  const rules = () => typeof rulesK === "function" && rulesK("aurelia");
  const P = () => {
    const g = (player.gov = player.gov || { laws: {}, works: {}, build: [], min: {}, tax: { campo: 1, comercio: 1, estrada: 1 }, appr: 60 });
    g.pil = g.pil || { igreja: 50, povo: 50, exercito: 50, tesouro: 50 };
    g.grand = g.grand ?? 20;
    return g;
  };
  const PIL = [
    ["igreja", "Igreja", "#e8d8a0", "book"],
    ["povo", "Povo", "#7ad36b", "smile"],
    ["exercito", "Exército", "#d9533a", "sword"],
    ["tesouro", "Tesouro", "#f2c14e", "coin"],
  ];
  const clamp = (v) => Math.max(0, Math.min(100, v));
  function bump(d) {
    const p = P().pil;
    for (const k in d) p[k] = clamp(p[k] + d[k]);
    // o mundo de verdade acompanha
    if (d.tesouro) player.gold = Math.max(0, player.gold + d.tesouro * 6);
    if (d.exercito) player.army = Math.max(0, (player.army || 0) + Math.round(d.exercito / 2));
    if (d.povo && player.realm) player.realm.social = clamp(player.realm.social + d.povo / 2);
    if (d.povo && player.gov) player.gov.appr = clamp((player.gov.appr ?? 60) + d.povo / 2);
    hud();
  }
  window.realmBump = bump;

  /* ===================== OS PEDIDOS ===================== */
  // [quem, roupa, cabelo, pedido, [resposta, efeitos], [resposta, efeitos]]
  const DECK = [
    ["Bispo Anselmo", "#e8e0d0", "#cfc6b8", "A catedral precisa de um sino novo. Cem moedas e o povo reza em paz.", ["Pagar o sino", { igreja: 12, tesouro: -10 }], ["A fé não precisa de bronze", { igreja: -10, tesouro: 4 }]],
    ["Camponesa Rosa", "#8a6a3a", "#3a2414", "A colheita foi ruim, Majestade. Perdoe o imposto deste ano!", ["Perdoar o imposto", { povo: 12, tesouro: -10 }], ["Imposto é imposto", { povo: -12, tesouro: 8 }]],
    ["General Marcos", "#5a5a6a", "#3a2414", "Os soldados querem espadas novas e soldo em dia.", ["Pagar e equipar", { exercito: 12, tesouro: -12 }], ["Que lutem com o que têm", { exercito: -12, tesouro: 5 }]],
    ["Mercador Zaid", "#b8602a", "#1a1a1a", "Abra o porto aos mercadores de além-mar e eu encho o seu tesouro.", ["Abrir o porto", { tesouro: 12, igreja: -6, povo: 3 }], ["Estrangeiro não manda aqui", { tesouro: -6, exercito: 4 }]],
    ["Padre do interior", "#2a2230", "#cfc6b8", "Hereges pregam na praça! Mande prendê-los.", ["Prender os hereges", { igreja: 10, povo: -8 }], ["Cada um crê no que quer", { igreja: -10, povo: 6 }]],
    ["Capitão da Guarda", "#4a5a7a", "#3a2414", "Bandidos nas estradas. Preciso de cem homens para caçá-los.", ["Mandar os soldados", { exercito: -6, povo: 8, tesouro: -4 }], ["As estradas que se virem", { povo: -8, exercito: 3 }]],
    ["Tesoureiro Real", "#3a6a3a", "#d9d9d9", "Podemos cunhar moedas com menos ouro. Ninguém vai notar...", ["Cunhar moedas falsas", { tesouro: 14, povo: -10 }], ["Moeda honesta, reino honesto", { tesouro: -4, povo: 4, igreja: 3 }]],
    ["Duquesa de Valsombra", "#5a2a5a", "#d9a441", "Meu filho quer a mão da sua prima. Uma aliança nos faria fortes.", ["Aceitar a aliança", { exercito: 8, povo: -3, igreja: 4 }], ["Minha família não está à venda", { exercito: -8, povo: 4 }]],
    ["Ferreiro Doran", "#6a3a2a", "#3a2414", "As minas pedem trabalhadores. Os presos podiam trabalhar lá.", ["Mandar os presos", { tesouro: 8, igreja: -5, exercito: 3 }], ["Ninguém é escravo aqui", { povo: 6, tesouro: -5 }]],
    ["Curandeira", "#2a6a5a", "#8a3a1a", "Uma febre começou no bairro do rio. Preciso de ervas e de uma casa de cura.", ["Pagar a casa de cura", { povo: 10, tesouro: -10, igreja: -3 }], ["Que rezem: é castigo divino", { igreja: 6, povo: -12 }]],
    ["Embaixador das Marés", "#1e6a7a", "#d8d2c4", "O Príncipe Tarso propõe paz e comércio. Assine o tratado.", ["Assinar a paz", { tesouro: 8, exercito: -6 }], ["Aurélia não se curva", { exercito: 8, tesouro: -6 }]],
    ["Bardo Lírio", "#2a6a3a", "#8a2a2a", "Uma festa na praça para o povo! Música, cerveja e o seu nome nas canções.", ["Dar a festa", { povo: 10, tesouro: -8, igreja: -3 }], ["Festa é desperdício", { povo: -6, tesouro: 3 }]],
    ["Monge copista", "#5a4a3a", "#8a8a8a", "Deixe a Igreja abrir escolas nos mosteiros. Ensinaremos a ler... e a rezar.", ["Escolas da Igreja", { igreja: 10, povo: 5, tesouro: -4 }], ["Escola do reino, sem padre", { igreja: -8, povo: 6, tesouro: -6 }]],
    ["Velho soldado", "#5a5a4a", "#d9d9d9", "Lutei pela Coroa trinta anos e não tenho nem pão. Uma pensão, Majestade?", ["Pensão para os veteranos", { exercito: 8, tesouro: -6, povo: 3 }], ["O reino não tem dinheiro para isso", { exercito: -8 }]],
    ["Espiã Real", "#2a2a3a", "#1a1a1a", "Há nobres tramando contra você. Posso... resolver em silêncio.", ["Resolver em silêncio", { exercito: 5, igreja: -8, povo: -3 }], ["Leve-os a julgamento justo", { igreja: 6, povo: 4, exercito: -3 }]],
    ["Iluminista Luca", "#7a2a2a", "#3a2414", "O povo quer voz! Crie um conselho de representantes.", ["Criar o conselho", { povo: 12, igreja: -6, exercito: -4 }], ["O trono não se divide", { povo: -10, exercito: 4 }]],
    ["Lenhador", "#5a7a3a", "#8a5a2a", "Os nobres caçam na floresta do povo e proíbem a gente de cortar lenha!", ["A floresta é do povo", { povo: 10, exercito: -4 }], ["A floresta é da nobreza", { povo: -10, tesouro: 4 }]],
    ["Arquiteto", "#7a6a5a", "#3a2414", "Uma catedral nova faria Aurélia famosa em todos os reinos.", ["Construir a catedral", { igreja: 14, tesouro: -14, povo: 2 }], ["Primeiro pontes, depois torres", { igreja: -6, povo: 6, tesouro: -4 }]],
  ];
  const EXTREME = {
    igreja: ["O Bispo te excomunga! Os sinos não tocam e o povo tem medo de você.", "O clero manda em tudo: até o cardápio do castelo passa pelo Bispo."],
    povo: ["REVOLTA! O povo queima as cercas do castelo.", "O povo te adora tanto que pede para você não sair do trono nunca."],
    exercito: ["Sem soldados, os bandidos e os vizinhos riem dos muros de Aurélia.", "O general está forte demais... e de olho na sua coroa."],
    tesouro: ["FALÊNCIA! Os cofres estão vazios e os credores batem na porta.", "Tanto ouro deixa os nobres com inveja. Cochichos pelos corredores..."],
  };
  function checkExtremes() {
    const p = P().pil;
    for (const [k, n] of PIL) {
      if (p[k] > 4 && p[k] < 96) continue;
      const low = p[k] <= 4;
      const msg = EXTREME[k][low ? 0 : 1];
      p[k] = low ? 25 : 75;
      setTimeout(() => {
        say([["", msg]], () => {
          if (k === "povo" && low) typeof counterCoup === "function" && counterCoup();
          else if (k === "exercito" && !low) typeof counterCoup === "function" && counterCoup();
          else if (k === "tesouro" && !low && typeof assassinAttempt === "function") assassinAttempt();
          else if (k === "tesouro" && low) ((player.gold = Math.floor(player.gold / 3)), typeof repAdd === "function" && repAdd(-5));
          else if (k === "igreja" && low) typeof repAdd === "function" && repAdd(-6);
          else if (k === "exercito" && low) player.army = Math.max(0, (player.army || 0) - 15);
        });
      }, 800);
      return true;
    }
    return false;
  }

  /* ===================== SENTAR NO TRONO ===================== */
  const room = () => (player.zone === "interior" && game.inter && game.inter.throne && game.inter.who && game.inter.who.kind === "me" ? game.inter : null);
  const onThrone = (x, y) => {
    const G = room();
    return G && ((x === G.kx && y === G.ky) || tileAt("interior", x, y) === "Q");
  };
  const tgBase = targetAt;
  targetAt = function (x, y) {
    if (onThrone(x, y) && !game.court) return "Sentar no trono (audiência)";
    return tgBase.apply(this, arguments);
  };
  const iaBase = interactAt;
  interactAt = function (x, y) {
    if (onThrone(x, y) && !game.court && typeof lifeMode === "function" && lifeMode()) return sit();
    return iaBase.apply(this, arguments);
  };
  function sit() {
    const G = room();
    if (!G) return;
    game.court = { back: [player.x, player.y], queue: shuffle(DECK).slice(0, 5), cur: null, done: 0, t: 0 };
    player.x = player.rx = G.kx;
    player.y = player.ry = G.ky;
    player.dir = "down";
    playSound(392, 0.3, "triangle", 0.04);
    hud(true);
    toast("Você senta no trono. Os guardas abrem as portas: a audiência começou!", 3200);
    setTimeout(nextPetition, 1500);
  }
  function stand(msg) {
    const C = game.court;
    if (!C) return;
    game.court = null;
    const G = room();
    player.x = player.rx = G ? G.kx : C.back[0];
    player.y = player.ry = G ? G.ky + 2 : C.back[1];
    hud(false);
    if (msg) toast(msg, 3000);
    saveGame();
  }
  const shuffle = (a) => a.slice().sort(() => Math.random() - 0.5);
  function nextPetition() {
    const C = game.court,
      G = room();
    if (!C || !G) return;
    const card = C.queue.shift();
    if (!card) {
      P().grand = Math.min(100, P().grand + 4);
      if (typeof repAdd === "function") repAdd(2);
      return choice("Fim da audiência", `Você ouviu ${C.done} súditos hoje. A Grandeza da corte sobe (${P().grand}).`, [
        { t: "Levantar do trono", icon: "door", fn: () => stand("A corte se curva quando você levanta.") },
        { t: "Continuar sentad" + genderWord("o", "a", "e") + " mais um pouco", icon: "crown", fn: () => ((C.queue = shuffle(DECK).slice(0, 3)), setTimeout(nextPetition, 600)) },
      ]);
    }
    const h = G.ret || null;
    void h;
    const door = [G.tx, ZONES.interior.h - 2];
    C.cur = { card, x: door[0], y: door[1], tx: G.tx, ty: G.ky + 3, phase: "in", look: { robe: card[1], hair: card[2] } };
  }
  function ask() {
    const C = game.court;
    if (!C || !C.cur) return;
    const [who, , , txt, A, B] = C.cur.card;
    const arrows = (d) =>
      Object.entries(d)
        .map(([k, v]) => `${PIL.find((p) => p[0] === k)[1]} ${v > 0 ? "▲" : "▼"}`)
        .join(" ");
    choice(`Audiência · ${who}`, `<i>"${txt}"</i>`, [
      { t: `${A[0]}  (${arrows(A[1])})`, icon: "scroll", fn: () => decide(A[1], A[0]) },
      { t: `${B[0]}  (${arrows(B[1])})`, icon: "scroll", fn: () => decide(B[1], B[0]) },
      { t: "Encerrar a audiência e levantar", icon: "door", fn: () => ((C.cur = null), stand("Você encerra a audiência mais cedo. Os súditos que esperavam vão embora resmungando.")) },
    ]);
  }
  function decide(d, txt) {
    const C = game.court;
    if (!C || !C.cur) return;
    bump(d);
    C.done++;
    C.cur.phase = "out";
    playSound(520, 0.08, "sine");
    vilaNews && Math.random() < 0.3 && vilaNews(`Decisão do trono: ${txt}.`);
    if (!checkExtremes()) setTimeout(() => game.court && !game.court.cur && nextPetition(), 1800);
    else setTimeout(() => game.court && !game.court.cur && nextPetition(), 4500);
  }

  // os súditos andando pelo tapete
  const upBase = update;
  update = function (dt) {
    upBase(dt);
    const C = game.court;
    if (!C) return;
    if (!room()) return ((game.court = null), hud(false));
    game.moveCd = Math.max(game.moveCd || 0, 0.2);
    const G = room();
    player.x = player.rx = G.kx;
    player.y = player.ry = G.ky;
    const c = C.cur;
    if (!c || game.dialog || game.mode !== "world") return;
    const sp = 2.2 * dt;
    if (c.phase === "in") {
      c.y = Math.max(c.ty, c.y - sp);
      if (c.y <= c.ty) ((c.phase = "ask"), ask());
    } else if (c.phase === "out") {
      c.y += sp;
      if (c.y >= ZONES.interior.h - 1.5) C.cur = null;
    }
  };
  const cdBase = crewDrawList;
  crewDrawList = function (list, t) {
    cdBase(list, t);
    const C = game.court;
    if (!C || !C.cur || player.zone !== "interior") return;
    const c = C.cur;
    list.push({
      y: c.y,
      draw: () => {
        const X = c.x * TILE - 16 + 16,
          Y = c.y * TILE;
        const walking = c.phase !== "ask";
        ctx.fillStyle = "rgba(0,0,0,.25)";
        ctx.beginPath();
        ctx.ellipse(X + 16, Y + 30, 9, 3, 0, 0, 7);
        ctx.fill();
        drawSprite(wizardRects(c.look.robe, null, c.look.hair, null, c.phase === "out" ? "down" : "up", walking ? Math.floor(t * 6) % 2 : 0), X, Y, 2, false);
        if (c.phase === "ask") {
          // reverência
          ctx.fillStyle = "#fff6e0";
          ctx.fillRect(X + 22, Y - 14, 18, 12);
          ctx.fillStyle = "#3a2414";
          ctx.fillRect(X + 26, Y - 10, 10, 2);
          ctx.fillRect(X + 26, Y - 6, 6, 2);
        }
      },
    });
  };

  /* ===================== AS QUATRO FORÇAS NA TELA ===================== */
  function hud(force) {
    let el = document.getElementById("pilhud");
    const show = force === true || (force !== false && game.court);
    if (!show) return el && el.remove();
    if (!el) {
      el = document.createElement("div");
      el.id = "pilhud";
      el.style.cssText = "position:fixed;left:50%;top:54px;transform:translateX(-50%);z-index:40;display:flex;gap:10px;background:rgba(30,18,12,.9);border:2px solid #c9a050;border-radius:8px;padding:6px 12px;color:#f4e8c8;font:600 12px 'Pixelify Sans',sans-serif;max-width:calc(100vw - 32px);flex-wrap:wrap;justify-content:center";
      document.body.appendChild(el);
    }
    const p = P().pil;
    el.innerHTML =
      PIL.map(([k, n, c, ic]) => {
        const v = Math.round(p[k]);
        const warn = v < 20 || v > 80;
        return `<div style="text-align:center;min-width:58px">${typeof iconHTML === "function" ? iconHTML(ic, 14) : ""} ${n}<div style="height:7px;background:#3a2a20;margin-top:3px;border:1px solid ${warn ? "#ff6050" : "#5a4a30"}"><div style="height:100%;width:${v}%;background:${c}"></div></div></div>`;
      }).join("") + `<div style="text-align:center;min-width:58px">${typeof iconHTML === "function" ? iconHTML("crown", 14) : ""} Grandeza<div style="margin-top:2px">${P().grand}</div></div>`;
  }
  window.pillarsHud = hud;

  /* ----- o dia a dia mexe nas forças ----- */
  const ndBase = onNewDay;
  onNewDay = function () {
    const r = ndBase.apply(this, arguments);
    if (!(typeof lifeMode === "function" && lifeMode()) || !rules()) return r;
    const g = P(),
      reg = player.regime;
    const d = { igreja: 0, povo: 0, exercito: 0, tesouro: 0 };
    if (reg === "ditadura") ((d.exercito += 2), (d.povo -= 2));
    if (reg === "socialismo") ((d.povo += 2), (d.tesouro -= 1));
    if (reg === "capitalismo") ((d.tesouro += 2), (d.povo -= 1));
    if (reg === "comunismo") ((d.povo += 1), (d.igreja -= 2));
    if (reg === "monarquia") d.igreja += 1;
    if (g.laws && g.laws.culto) d.igreja -= 1;
    for (const k in d) g.pil[k] = clamp(g.pil[k] + d[k]);
    g.grand = Math.max(0, g.grand - 1); // a grandeza cai se a corte fica parada
    if (g.grand >= 60) player.palaceGuard = Math.max(player.palaceGuard || 0, 2);
    checkExtremes();
    return r;
  };

  /* ----- as forças aparecem no Gabinete também ----- */
  const chBase = choice;
  choice = function (title, text, opts) {
    if (title === "Gabinete do Reino" && rules()) {
      const p = P().pil;
      text = `<div style="text-align:left;line-height:1.6;margin-bottom:4px">${PIL.map(([k, n]) => `${n}: <b>${Math.round(p[k])}</b>`).join(" · ")} · Grandeza ${P().grand}</div>` + text;
    }
    return chBase.call(this, title, text, opts);
  };
})();
