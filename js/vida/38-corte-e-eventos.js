/**
 * ECOS DO ARCANO — 38-corte-e-eventos.js (Simulador)
 *  1. Corte real: nomeie General, Tesoureiro e Espião. Eles ajudam... e podem trair.
 *  2. Pedidos do povo: todo dia alguém pede uma decisão no trono.
 *  3. Casamento político: case com a realeza de Marés ou Pedravale e una os reinos.
 *  4. Coroação com festa: cena com a vila, coroa descendo e confete.
 *  5. Eventos grandes: incêndio, enchente, circo, praga na colheita, mercador estrangeiro.
 *  6. Sonhos dos moradores se realizam (e alguns vão embora viajar).
 *  7. Um rival pessoal que compete com você.
 *  8. Conquistas de dinastia.
 *  9. Diário da vida: resumo da vida inteira ao morrer, para copiar e compartilhar.
 * 10. Desafios de começo.
 * 11. Retratos maiores, com lágrimas e raiva.
 * 12. Músicas do golpe, do velório, do casamento e da eleição.
 * 13. Celular: toque e segure numa pessoa para interagir sem andar até ela.
 */

"use strict";

/* ===================== CENA GENÉRICA ===================== */
function playCine(draw, dur, next) {
  game.cine = { t0: game.t, draw, dur, next };
  game.dialog = null;
  byId("dialog").style.display = "none";
  byId("choice").style.display = "none";
  if (typeof hidePie === "function") hidePie();
  game.mode = "cutscene";
  document.body.classList.add("cutscene");
}
function endCine() {
  const c = game.cine;
  if (!c || game.t - c.t0 < Math.min(2.5, c.dur)) return;
  game.cine = null;
  document.body.classList.remove("cutscene");
  game.mode = "world";
  game.fade = 1;
  c.next && c.next();
}
addEventListener("keydown", (e) => {
  if (!game.cine) return;
  e.stopImmediatePropagation();
  e.preventDefault();
  if (["Enter", " ", "e", "E", "Escape"].includes(e.key)) endCine();
}, true);
addEventListener("pointerdown", (e) => {
  if (!game.cine) return;
  e.stopImmediatePropagation();
  e.preventDefault();
  endCine();
}, true);
{
  const drawBase = draw;
  draw = function () {
    drawBase();
    const c = game.cine;
    if (!c) return;
    const t = game.t - c.t0;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(ctx.canvas.width / viewWidth, ctx.canvas.height / 480);
    ctx.imageSmoothingEnabled = false;
    ctx.textAlign = "center";
    c.draw(viewWidth, 480, t);
    if (t > 2.5) {
      ctx.font = '600 14px "Pixelify Sans", sans-serif';
      ctx.fillStyle = `rgba(255,255,255,${0.5 + 0.5 * Math.sin(t * 4)})`;
      ctx.fillText(TOUCH ? "Toque para continuar" : "Enter para continuar", viewWidth / 2, 466);
    }
    ctx.restore();
    if (t > c.dur) endCine();
  };
}

/* ===================== 4. COROAÇÃO ===================== */
function coronationCine(next) {
  const look = JSON.parse(JSON.stringify(player.look));
  const crowd = Array.from({ length: 22 }, (_, i) => ({ robe: pk(PROTEST_ROBES), hair: pk(PROTEST_HAIRS), x: i }));
  const title = `${genderWord("Viva o Rei", "Viva a Rainha", "Viva a Majestade")} ${player.name}!`;
  playSound(523, 0.3, "triangle");
  setTimeout(() => playSound(659, 0.3, "triangle"), 300);
  setTimeout(() => playSound(784, 0.6, "triangle"), 600);
  setTimeout(() => playSound(1047, 0.8, "triangle"), 1100);
  playCine((W, H, t) => {
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, "#5a8ad0");
    sky.addColorStop(1, "#f0d8a0");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);
    // Castelo e escadaria.
    ctx.fillStyle = "#8a8090";
    ctx.fillRect(W / 2 - 170, 70, 340, 200);
    for (const x of [W / 2 - 190, W / 2 + 150]) {
      ctx.fillRect(x, 30, 40, 240);
      ctx.fillStyle = "#6a2a4a";
      ctx.beginPath();
      ctx.moveTo(x - 6, 30);
      ctx.lineTo(x + 20, -6);
      ctx.lineTo(x + 46, 30);
      ctx.fill();
      ctx.fillStyle = "#8a8090";
    }
    for (const x of [W / 2 - 120, W / 2 + 100]) {
      ctx.fillStyle = "#b03040";
      ctx.fillRect(x, 90, 22, 70);
      ctx.fillStyle = "#e0b030";
      ctx.fillRect(x + 7, 110, 8, 8);
    }
    for (let i = 0; i < 5; i++) {
      ctx.fillStyle = i % 2 ? "#a89aa8" : "#9a8c9a";
      ctx.fillRect(W / 2 - 150 - i * 20, 270 + i * 16, 300 + i * 40, 16);
    }
    ctx.fillStyle = "#b02a3a";
    ctx.fillRect(W / 2 - 30, 270, 60, 80);
    ctx.fillStyle = "#a09088";
    ctx.fillRect(0, 350, W, H - 350);
    // Você no alto da escadaria.
    drawSprite(heroRects(look, "down", null), W / 2 - 32, 196, 4, false);
    // A coroa desce.
    const cy = Math.min(186, 20 + t * 70);
    ctx.fillStyle = "#ffd84a";
    ctx.fillRect(W / 2 - 18, cy, 36, 12);
    for (const dx of [-18, -6, 6]) {
      ctx.beginPath();
      ctx.moveTo(W / 2 + dx, cy);
      ctx.lineTo(W / 2 + dx + 6, cy - 12);
      ctx.lineTo(W / 2 + dx + 12, cy);
      ctx.fill();
    }
    ctx.fillStyle = "#e0303a";
    ctx.fillRect(W / 2 - 3, cy + 3, 6, 6);
    // Povo comemorando.
    crowd.forEach((p, i) => {
      const x = (i / crowd.length) * W + 6,
        y = 370 + (i % 3) * 22 - Math.abs(Math.sin(t * 8 + i)) * (t > 2.4 ? 8 : 2);
      drawSprite(wizardRects(p.robe, null, p.hair, null, "up", 0), x, y, 2.5, false);
    });
    // Confete.
    if (t > 2.4)
      for (let i = 0; i < 70; i++) {
        ctx.fillStyle = ["#ff6a8a", "#ffd84a", "#7ad0ff", "#9aff7a", "#d08aff"][i % 5];
        ctx.fillRect((i * 97 + Math.sin(t + i) * 30) % W, ((i * 53 + (t - 2.4) * 120) % (H + 40)) - 20, 4, 6);
      }
    ctx.fillStyle = "rgba(20,10,30,.7)";
    ctx.fillRect(0, 14, W, 46);
    ctx.font = '700 24px "Pixelify Sans", sans-serif';
    ctx.fillStyle = "#ffe066";
    ctx.fillText(t > 2.4 ? title : "A coroação", W / 2, 46);
  }, 9, next);
}
{
  const cwBase = coupWin;
  coupWin = function (how) {
    const r = cwBase(how);
    const d = game.dialog;
    if (d) {
      const lines = d.lines.slice(),
        cb = d.cb;
      game.dialog = null;
      byId("dialog").style.display = "none";
      coronationCine(() => say(lines, cb));
    }
    return r;
  };
  const coBase = coronation;
  coronation = function (why) {
    const r = coBase(why);
    const d = game.dialog;
    if (d) {
      const lines = d.lines.slice(),
        cb = d.cb;
      game.dialog = null;
      coronationCine(() => say(lines, cb));
    }
    return r;
  };
}

/* ===================== 1. CORTE REAL ===================== */
const COURT_ROLES = {
  general: { n: "General", d: "Recruta 8 soldados por dia." },
  tesoureiro: { n: "Tesoureiro", d: "+30 de ouro por dia no tesouro." },
  espiao: { n: "Espião", d: "Descobre traições e avisa dos golpes." },
};
function court() {
  return (player.court = player.court || {});
}
function courtMenu() {
  const C = court();
  const cands = Object.keys(player.rel || {}).filter((id) => named(id) && !isChildNpc(id) && friendship(id) >= 40 && !Object.values(C).includes(id));
  choice(
    "A Corte Real",
    Object.entries(COURT_ROLES)
      .map(([k, r]) => `<b>${r.n}:</b> ${C[k] ? shortName(C[k]) + ` (lealdade ${friendship(C[k])})` : "vago"} · <small>${r.d}</small>`)
      .join("<br>") + "<br><small>Só quem tem 40+ de amizade aceita. Lealdade abaixo de 30: risco de traição.</small>",
    [
      ...Object.entries(COURT_ROLES).map(([k, r]) => ({
        t: C[k] ? `Demitir o ${r.n}` : `Nomear ${r.n}…`,
        icon: k === "general" ? "sword" : k === "tesoureiro" ? "coin" : "eye",
        fn: () => {
          if (C[k]) return (addFriendship(C[k], -15), delete C[k], saveGame(), courtMenu());
          if (!cands.length) return say([["", "Ninguém confia em você o bastante (amizade 40+)."]], courtMenu);
          choice(`Nomear ${r.n}`, r.d, cands.slice(0, 8).map((id) => ({ t: `${shortName(id)} (amizade ${friendship(id)})`, fn: () => ((C[k] = id), addFriendship(id, 10), vilaNews(`${shortName(id)} é ${gw(id, "o novo", "a nova")} ${r.n} de ${royalTitle()} ${player.name}!`), saveGame(), say([[shortName(id), pk(["Será uma honra, Majestade!", "Pode contar comigo.", "Finalmente alguém reconhece meu talento!"])]], courtMenu)) })));
        },
      })),
      { t: "Voltar", fn: royalMenu },
    ],
  );
}
function courtDaily() {
  if (!rulesK("aurelia")) return;
  const C = court();
  if (C.general && named(C.general)) player.army = (player.army || 0) + 8;
  if (C.tesoureiro && named(C.tesoureiro)) player.gold += 30;
  if (C.espiao && named(C.espiao)) {
    if (player.rival) setTimeout(() => toast(`Seu Espião ${shortName(C.espiao)} avisa: ${shortName(player.rival.id)} está tramando contra você!`, 4600), 5000);
    if (player.ilumCoupDay === player.day) setTimeout(() => toast(`Espião: os Iluministas atacam hoje às 23h!`, 4600), 6000);
  }
  for (const [k, id] of Object.entries(C)) {
    if (!named(id)) {
      delete C[k];
      continue;
    }
    if (friendship(id) < 30 && Math.random() < 0.15) {
      delete C[k];
      const n = shortName(id);
      if (k === "tesoureiro") {
        const lost = Math.round(player.gold * 0.2);
        player.gold -= lost;
        vilaNews(`Escândalo! ${n}, ${gw(id, "o", "a")} Tesoureir${gw(id, "o", "a")} real, fugiu com ${lost} de ouro!`);
      } else if (k === "general") {
        player.army = Math.max(0, (player.army || 0) - 30);
        player.rival = { id, day: player.day, strike: player.day + 2 };
        vilaNews(`O General ${n} levou metade do exército e está tramando contra a coroa!`);
      } else {
        ilumAdd(20);
        vilaNews(`${n}, ${gw(id, "o", "a")} Espiã${gw(id, "o", "")} real, vendeu segredos aos Iluministas!`);
      }
      setTimeout(() => toast(`TRAIÇÃO: ${n} deixou a corte e te traiu!`, 4800), 3000);
    }
  }
}

/* ===================== 2. PEDIDOS DO POVO ===================== */
const PETITIONS = [
  { who: "Fazendeiro Joca", t: "A colheita foi ruim, Majestade. Perdoe o imposto deste mês da minha família?", o: [["Perdoar o imposto", { rep: 4, gold: -30, ilum: -4 }, "Que as runas te abençoem!"], ["Lei é lei", { rep: -3, gold: 10, ilum: 3 }, "...Entendo. Vou vender a vaca."]] },
  { who: "Guarda Tomé", t: "Prendemos um ladrão de pão. Era um menino com fome. Qual a sentença?", o: [["Soltar e dar comida", { rep: 5, ilum: -3 }, "O menino chora de alívio."], ["Uma semana de trabalho no moinho", { rep: 1 }, "Justo. Ele vai aprender."], ["Calabouço", { rep: -5, ilum: 4 }, "O povo cochicha na praça..."]] },
  { who: "Rosa e Bruno", t: "Nosso vizinho diz que a nossa cerca invadiu o quintal dele. Decida!", o: [["Dar razão ao casal", { fr: ["rosa", 6], rep: 1 }, "Rosa sorri. O vizinho bufa."], ["Dar razão ao vizinho", { fr: ["rosa", -6], rep: 1 }, "Bruno resmunga a semana toda."], ["Mandar dividir o quintal", { rep: 3 }, "Ninguém gostou. Então foi justo."]] },
  { who: "Mercador do Oriente", t: "Ofereço 150 de ouro pelo direito de vender seda sem imposto.", o: [["Aceitar o ouro", { gold: 150, rep: -4 }, "Os comerciantes locais ficam furiosos."], ["Recusar", { rep: 3 }, "Os feirantes aplaudem."]] },
  { who: "Luca", t: "Os Iluministas pedem uma escola pública. Vai apoiar?", o: [["Construir a escola (120 ouro)", { gold: -120, rep: 6, ilum: -12, fr: ["luca", 10] }, "Até o Luca sorri."], ["Talvez ano que vem", { ilum: 6, fr: ["luca", -6] }, "\"Sempre ano que vem...\""]] },
  { who: "Curandeira Maíra", t: "Precisamos de remédios para o inverno. O Hospital pede 80 de ouro.", o: [["Doar 80 de ouro", { gold: -80, rep: 5 }, "Muitas vidas serão salvas."], ["Não há dinheiro", { rep: -4 }, "Ela suspira e vai embora."]] },
  { who: "Lucas Marzocca", t: "Majestade, posso abrir a taverna até de madrugada? É pelo povo!", o: [["Liberar a festa", { rep: 2, fr: ["lucas", 10], ilum: -3 }, "\"VIVA A MAJESTADE!\""], ["De jeito nenhum", { fr: ["lucas", -8] }, "\"Isso é censura... da diversão!\""]] },
  { who: "Pescadora do Porto", t: "Um monstro rasgou nossas redes. Mande a guarda caçar a fera!", o: [["Mandar a guarda", { rep: 4, army: -5 }, "Dois guardas voltam com histórias de pescador."], ["Pagar redes novas (60)", { gold: -60, rep: 3 }, "Redes novinhas no cais."]] },
  { who: "Ferreiro Brann", t: "Quero o contrato das espadas do exército. Faço barato.", o: [["Fechar o contrato", { army: 10, gold: -50, fr: ["ferreiro", 8] }, "O martelo não para mais na forja."], ["Comprar de Pedravale", { army: 12, gold: -70, fr: ["ferreiro", -8] }, "Brann fica uma semana emburrado."]] },
  { who: "Criança da vila", t: "Majestade, posso ser cavaleiro quando crescer?", o: [["Nomear cavaleiro honorário", { rep: 3 }, "A criança corre pela praça gritando."], ["Estude primeiro!", { rep: 1 }, "\"Aaaah...\""]] },
];
function petitionTick() {
  if (!rulesK("aurelia") || player.petDay === player.day || game.mode !== "world" || game.dialog) return;
  if (currentHour() < 9 || currentHour() > 19 || player.zone !== "vila") return;
  if (Math.random() > 0.004) return;
  player.petDay = player.day;
  const P = pk(PETITIONS);
  choice(`Pedido do povo · ${P.who}`, `"${P.t}"`, P.o.map(([t, fx, after]) => ({
    t,
    fn: () => {
      if (fx.rep) repAdd(fx.rep);
      if (fx.gold) player.gold = Math.max(0, player.gold + fx.gold);
      if (fx.ilum) ilumAdd(fx.ilum);
      if (fx.army) player.army = Math.max(0, (player.army || 0) + fx.army);
      if (fx.fr && NPCS[fx.fr[0]]) addFriendship(fx.fr[0], fx.fr[1]);
      saveGame();
      say([["", after]]);
    },
  })));
}

/* ===================== 3. CASAMENTO POLÍTICO ===================== */
const CONSORTS = {
  mares: { n: (g) => (g === "f" ? "Príncipe Coral das Marés" : "Princesa Coral das Marés"), k: "mares" },
  serra: { n: (g) => (g === "f" ? "Príncipe Bruni de Pedravale" : "Princesa Bruna de Pedravale"), k: "serra" },
};
function politicalMarriage() {
  if (player.spouse || player.consort) return say([["Conselheiro", "Majestade, você já tem um par. Bigamia real dá guerra!"]]);
  const opts = Object.entries(CONSORTS)
    .filter(([k]) => !rulesK(k))
    .map(([k, c]) => ({
      t: `Propor casamento a ${c.n(player.gender)} (dote 200 ouro)`,
      icon: "heart",
      fn: () => {
        if (player.gold < 200) return say([["", "O dote real custa 200 de ouro."]]);
        if ((player.rep ?? 50) < 50) return say([[c.n(player.gender), "Casar com alguém tão mal falado? Melhore sua reputação primeiro."]]);
        player.gold -= 200;
        player.consort = c.n(player.gender);
        throne()[k] = player.day;
        syncRulers();
        vilaNews(`Casamento real! ${player.name} e ${player.consort} uniram ${KINGDOMS.aurelia.short} e ${KINGDOMS[k].short}!`);
        saveGame();
        say([["", `Os sinos tocam em dois reinos. ${player.consort} chega com uma comitiva enorme.`], [player.consort, "Que nossos reinos nunca mais se enfrentem."], ["", `${KINGDOMS[k].n} agora é parte do seu reino, sem uma gota de sangue.`]]);
      },
    }));
  if (!opts.length) return say([["", "Todos os reinos já são seus!"]]);
  choice("Casamento político", "Unir reinos pelo casamento: sem guerra, com festa.", opts.concat([{ t: "Voltar", fn: royalMenu }]));
}
{
  const rmBase = royalMenu;
  royalMenu = function () {
    hookChoice(rmBase, (title, text, opts) => {
      if (!rulesK("aurelia")) return [title, text, opts];
      opts.splice(opts.length - 1, 0, { t: "A Corte Real (General, Tesoureiro, Espião)", icon: "crown", fn: courtMenu }, { t: player.consort ? `Consorte: ${player.consort}` : "Casamento político (unir reinos)", icon: "heart", fn: politicalMarriage });
      return [title, text, opts];
    });
  };
}

/* ===================== 5. EVENTOS GRANDES ===================== */
const BIG_EVENTS = {
  incendio: {
    n: "Incêndio no Armazém Geral!",
    t: "Fumaça preta sobe do Armazém Geral! Os moradores correm com baldes.",
    o: [
      ["Ajudar com baldes de água", () => (repAdd(6), Object.keys(FRIENDS).forEach((id) => addFriendship(id, 1)), say([["", "Você passa a tarde carregando baldes. O fogo apaga. A vila te chama de herói."]]))],
      ["Vender baldes a 5 de ouro", () => ((player.gold += 60), repAdd(-6), say([["", "Você lucra 60 de ouro... e todos lembram disso."]]))],
      ["Assistir de longe", () => say([["", "O armazém fica chamuscado, mas de pé."]])],
    ],
  },
  enchente: {
    n: "Enchente!",
    t: "O rio transbordou. As casas baixas estão com água pelos joelhos.",
    o: [
      ["Ajudar os vizinhos a salvar as coisas", () => (repAdd(5), addNeed("energy", -30), say([["", "Cansativo, mas ninguém perdeu as fotos da família."]]))],
      ["Proteger só a sua casa", () => say([["", "Sua casa ficou seca. A do vizinho, não."]])],
    ],
  },
  circo: {
    n: "O Circo chegou!",
    t: "Uma lona listrada apareceu na praça! Malabaristas, um urso que dança e um homem que come fogo.",
    o: [
      ["Assistir ao show (10 ouro)", () => (player.gold >= 10 ? ((player.gold -= 10), addNeed("fun", 45), say([["", "O urso dança valsa. Você ri até chorar."]])) : say([["", "Sem 10 de ouro..."]]))],
      ["Pedir para participar de um número", () => (Math.random() < 0.5 ? ((player.gold += 40), repAdd(3), say([["Dono do circo", "Você nasceu pra isso! Tome 40 de ouro."]])) : (repAdd(-2), say([["", "Você tropeça no trapézio. A plateia adora, mas por outro motivo."]])))],
    ],
  },
  praga: {
    n: "Praga na colheita!",
    t: "Gafanhotos comeram o trigo. O pão vai ficar caro por uns dias.",
    o: [
      ["Doar comida para quem precisa", () => (repAdd(5), say([["", "Você divide o que tem. Ninguém passa fome na sua rua."]]))],
      ["Estocar pão para revender", () => ((player.gold += 45), repAdd(-4), say([["", "Você revende pão pelo dobro. Lucro de 45 de ouro e olhares tortos."]]))],
    ],
  },
  mercador: {
    n: "Um mercador estrangeiro!",
    t: "Uma caravana do Oriente parou na praça com coisas que ninguém nunca viu.",
    o: [
      ["Comprar um amuleto da sorte (50 ouro)", () => (player.gold >= 50 ? ((player.gold -= 50), (player.luck = player.day + 15), say([["Mercador", "Sorte por quinze dias. Ou seu dinheiro... não volta."]])) : say([["", "Sem 50 de ouro."]]))],
      ["Pechinchar só por diversão", () => (addNeed("fun", 15), say([["Mercador", "Você é durx de negócio! Volte sempre."]]))],
    ],
  },
};
function bigEventDaily() {
  if (player.bigEv && player.bigEv.day === player.day - 1) player.bigEv = null;
  if (Math.random() < 0.12) {
    const k = pk(Object.keys(BIG_EVENTS));
    player.bigEv = { k, day: player.day, seen: false };
    vilaNews(BIG_EVENTS[k].n);
    setTimeout(() => toast(`${BIG_EVENTS[k].n} Vá até a praça!`, 4600), 4500);
  }
}
function bigEventTick() {
  const E = player.bigEv;
  if (!E || E.seen || E.day !== player.day || player.zone !== "vila" || game.mode !== "world" || game.dialog) return;
  if (currentHour() < 8 || currentHour() > 21) return;
  E.seen = true;
  const B = BIG_EVENTS[E.k];
  game.shake = E.k === "incendio" ? 0.3 : 0;
  choice(B.n, B.t, B.o.map(([t, fn]) => ({ t, fn: () => (fn(), saveGame()) })));
}
function drawBigEvent(list, t) {
  const E = player.bigEv;
  if (!E || E.day !== player.day || player.zone !== "vila") return;
  if (E.k === "incendio") {
    const b = typeof vilaBuilding === "function" && vilaBuilding("Armazém Geral");
    if (!b) return;
    list.push({
      y: b.y + b.h,
      draw: () => {
        const W = b.w * TILE,
          X0 = b.x * TILE,
          Y0 = b.y * TILE + 18;
        ctx.fillStyle = `rgba(255,140,40,${0.18 + 0.06 * Math.sin(t * 9)})`;
        ctx.beginPath();
        ctx.ellipse(X0 + W / 2, Y0, W * 0.6, 50, 0, 0, 7);
        ctx.fill();
        for (let i = 0; i < 9; i++) {
          const x = X0 + (W / 9) * (i + 0.5),
            h = 26 + Math.abs(Math.sin(t * 7 + i * 1.7)) * 30,
            w = 14 + (i % 3) * 3,
            sway = Math.sin(t * 5 + i) * 4;
          for (const [k, col] of [
            [1, "#e8461a"],
            [0.7, "#ff9a2a"],
            [0.4, "#ffe066"],
          ]) {
            ctx.fillStyle = col;
            ctx.beginPath();
            ctx.moveTo(x - (w * k) / 2, Y0);
            ctx.quadraticCurveTo(x - (w * k) / 2, Y0 - h * k * 0.5, x + sway, Y0 - h * k);
            ctx.quadraticCurveTo(x + (w * k) / 2, Y0 - h * k * 0.5, x + (w * k) / 2, Y0);
            ctx.fill();
          }
        }
        for (let i = 0; i < 6; i++) {
          ctx.fillStyle = `rgba(70,64,70,${0.45 - ((t * 0.4 + i / 6) % 1) * 0.4})`;
          ctx.beginPath();
          ctx.arc(X0 + W * (0.2 + (i % 4) * 0.2), Y0 - 50 - ((t * 25 + i * 20) % 110), 14 + i * 2, 0, 7);
          ctx.fill();
        }
      },
    });
  }
  if (E.k === "circo") {
    const { cx, cy } = protestPlaza();
    const X = (cx + 6) * TILE,
      Y = (cy + 8) * TILE;
    list.push({
      y: cy + 9,
      draw: () => {
        for (let i = 0; i < 8; i++) {
          ctx.fillStyle = i % 2 ? "#e03a3a" : "#f6ecd2";
          ctx.beginPath();
          ctx.moveTo(X + i * 12, Y + 40);
          ctx.lineTo(X + 48, Y - 20);
          ctx.lineTo(X + i * 12 + 12, Y + 40);
          ctx.fill();
        }
        ctx.fillStyle = "#ffd84a";
        ctx.fillRect(X + 46, Y - 34, 4, 16);
        ctx.fillRect(X + 50, Y - 34, 12, 7);
      },
    });
  }
}

/* ===================== 6. SONHOS ===================== */
function npcDream(id) {
  return DREAMS[hashStr("sonho" + id) % DREAMS.length];
}
function dreamDaily() {
  player.dreamsDone = player.dreamsDone || {};
  player.away = player.away || {};
  for (const [id, d] of Object.entries(player.away)) if (player.day >= d) (delete player.away[id], vilaNews(`${shortName(id)} voltou de viagem cheio de histórias!`));
  if (Math.random() > 0.08) return;
  const pool = Object.keys(NPCS).filter((id) => named(id) && !isChildNpc(id) && !player.dreamsDone[id]);
  if (!pool.length) return;
  const id = pk(pool),
    dr = npcDream(id);
  player.dreamsDone[id] = player.day;
  if (/viajar|conhecer o mar|Pedravale/.test(dr)) {
    player.away[id] = player.day + 5;
    vilaNews(`${shortName(id)} realizou o sonho de ${dr} e saiu de viagem por 5 dias!`);
  } else vilaNews(`Sonho realizado: ${shortName(id)} conseguiu ${dr}! A vila fez festa.`);
  addFriendship(id, friendship(id) >= 40 ? 3 : 0);
  if (friendship(id) >= 50) setTimeout(() => toast(`${shortName(id)} realizou um sonho e mandou te contar: ${dr}!`, 4400), 4000);
}
{
  const nhBase = npcHidden;
  npcHidden = function (id) {
    if (player.away && player.away[id] && player.day < player.away[id]) return true;
    return nhBase(id);
  };
  const cvBase = crewVisible;
  crewVisible = function (a) {
    if (a && player.away && player.away[a.id] && player.day < player.away[a.id]) return false;
    return cvBase(a);
  };
}

/* ===================== 7. RIVAL PESSOAL ===================== */
const RIVAL_ACTS = [
  (n) => `${n} disse na taverna que você é ${pk(["um zero à esquerda", "metid" + genderWord("o", "a", "e") + " a besta", "fraquinh" + genderWord("o", "a", "e") + " na queda de braço"])}.`,
  (n) => `${n} ganhou o concurso de tortas que você queria ganhar.`,
  (n) => `${n} ficou com a vaga de trabalho que você ia pegar.`,
  (n) => `${n} anda espalhando que é mais bonit${"o"} que você.`,
];
function myRival() {
  const R = player.prival;
  return R && named(R.id) && !R.done ? R : null;
}
function rivalDaily() {
  if (!player.prival && player.day >= 3) {
    const pool = Object.keys(NPCS).filter((id) => named(id) && !isChildNpc(id) && id !== player.spouse && (hasTrait(id, "ambicioso") || hasTrait(id, "esquentado") || hasTrait(id, "dramatico")));
    if (pool.length) {
      const id = pk(pool);
      player.prival = { id, wins: 0, losses: 0 };
      setTimeout(() => toast(`${shortName(id)} decidiu que você é ${gw(id, "o rival dele", "a rival dela")}. Prepare-se!`, 4600), 5200);
    }
    return;
  }
  const R = myRival();
  if (!R || Math.random() > 0.3) return;
  const n = shortName(R.id);
  if (player.dating && NPCS[player.dating] && Math.random() < 0.3) {
    vilaNews(`${n} foi vist${gw(R.id, "o", "a")} dando em cima de ${shortName(player.dating)}. Provocação pura!`);
    addFriendship(player.dating, -3);
  } else vilaNews(pk(RIVAL_ACTS)(n));
}
function rivalDuel(id) {
  const R = myRival();
  const n = shortName(id);
  choice(`Desafio contra ${n}`, `Placar: você ${R.wins} x ${R.losses} ${n}. Vença 3 vezes e a rivalidade vira respeito.`, [
    { t: "Queda de braço", icon: "sword", fn: () => duelRes(R, Math.random() < 0.45 + (player.brawlWins || 0) * 0.03, "Os braços tremem, a mesa range...") },
    { t: "Corrida até a fonte", icon: "flag", fn: () => duelRes(R, Math.random() < 0.5 + (lifeNeed("energy") - 50) / 200, "Vocês disparam pela praça!") },
    { t: "Debate na taverna", icon: "chat", fn: () => duelRes(R, Math.random() < 0.4 + ((player.rep ?? 50) - 50) / 150 + (hasTrait("player", "intelectual") ? 0.15 : 0), "A taverna inteira para pra ouvir...") },
    { t: "Agora não", fn: null },
  ]);
}
function duelRes(R, won, intro) {
  const n = shortName(R.id);
  if (won) R.wins++;
  else R.losses++;
  repAdd(won ? 2 : -1);
  if (R.wins >= 3) {
    R.done = true;
    addFriendship(R.id, 30);
    vilaNews(`Fim da rivalidade: ${n} reconheceu que ${player.name} é ${genderWord("o melhor", "a melhor", "quem manda")}. Agora são amigos!`);
    return say([["", intro], ["", "Você vence de novo!"], [n, "Tá bom, tá bom... você é bom. Muito bom. Amigos?"]]);
  }
  say([["", intro], ["", won ? `Você venceu! (${R.wins} x ${R.losses})` : `${n} venceu essa. (${R.wins} x ${R.losses})`], [n, won ? pk(["Sorte de principiante!", "Revanche amanhã!"]) : pk(["Hahaha! Fácil demais!", "Volta quando tiver treinado."])]]);
}
{
  const itemsBase = lifeSocialItems;
  lifeSocialItems = function (id) {
    const items = itemsBase(id);
    const R = myRival();
    if (R && R.id === id) items.unshift({ t: "Desafiar meu rival ⚔", icon: "sword", fn: () => rivalDuel(id) });
    if (named(id) && !isChildNpc(id)) items.push({ t: "Perguntar do sonho", icon: "star", fn: () => say([[shortName(id), player.dreamsDone && player.dreamsDone[id] ? `Eu consegui ${npcDream(id)}! Nem acredito até hoje.` : `Meu sonho? ${npcDream(id)[0].toUpperCase() + npcDream(id).slice(1)}. Um dia eu chego lá.`]]) });
    return items;
  };
}

/* ===================== 8. CONQUISTAS DE DINASTIA ===================== */
ACHIEVEMENTS.push(
  ["dinastia3", "Família de verdade", "Chegue à 3ª geração.", "house", () => lifeMode() && (player.generation || 1) >= 3],
  ["dinastia5", "Dinastia", "Chegue à 5ª geração.", "crown", () => lifeMode() && (player.generation || 1) >= 5],
  ["sangueReal", "Sangue real", "Tenha 3 governantes na família.", "crown", () => lifeMode() && (player.lineage || []).filter((g) => g.ruled).length + (rulesK("aurelia") ? 1 : 0) >= 3],
  ["centenario", "Centenário", "Chegue aos 100 anos.", "clock", () => lifeMode() && playerAge() >= 100],
  ["golpeSolo", "Lobo solitário", "Dê um golpe de estado sozinh@.", "sword", () => !!player.soloCoup],
  ["eleito", "Voz do povo", "Vença uma eleição do Conselho.", "flag", () => !!player.councilChief],
  ["mortes10", "Já morri de tudo", "Descubra 10 jeitos de morrer.", "skull", () => typeof deathBook === "function" && deathBook().length >= 10],
  ["rivalVencido", "Rival vencido", "Vença seu rival 3 vezes.", "party", () => !!(player.prival && player.prival.done)],
);

/* ===================== 9. DIÁRIO DA VIDA ===================== */
function lifeSummary(causeTitle) {
  const start = player.genStart || 0;
  const log = (player.log || []).filter((l) => l[0] >= start).slice(-14);
  const lines = [
    `📜 A vida de ${player.name} (${START_AGE}–${playerAge()} anos, ${player.generation || 1}ª geração)`,
    causeTitle ? `⚰️ ${causeTitle}` : "",
    player.spouse && NPCS[player.spouse] ? `💍 Casou com ${shortName(player.spouse)}` : player.consort ? `💍 Casou com ${player.consort}` : "💔 Nunca casou",
    (player.kids || []).length ? `👶 ${player.kids.length} filho(s): ${player.kids.map((k) => k.name).join(", ")}` : "",
    rulesK("aurelia") ? `👑 Morreu governando: ${royalTitle()}` : "",
    (player.murders || 0) ? `🗡️ ${player.murders} morte(s) nas costas` : "",
    `💰 ${player.gold} de ouro · reputação ${player.rep ?? 50}`,
    ...log.map((l) => `• Dia ${l[0]}: ${String(l[2]).replace(/<[^>]+>/g, "")}`),
  ].filter(Boolean);
  return lines;
}
function showLifeSummary(causeTitle, next) {
  let el = byId("diariovida");
  if (!el) {
    el = document.createElement("div");
    el.id = "diariovida";
    el.className = "ui ov";
    byId("screen").appendChild(el);
  }
  const L = lifeSummary(causeTitle);
  el.innerHTML = `<h2>Diário da Vida</h2><div class="dv-l">${L.map((l) => `<p>${l}</p>`).join("")}</div><div class="dv-b"><button data-c>Copiar para compartilhar</button><button data-n class="go">Continuar ▶</button></div>`;
  el.querySelector("[data-c]").onclick = () => {
    try {
      navigator.clipboard.writeText(L.join("\n") + "\n\n— Ecos do Arcano");
      toast("Copiado! Cole onde quiser.", 2200);
    } catch (e) {}
  };
  el.querySelector("[data-n]").onclick = () => {
    el.style.display = "none";
    game.mode = "world";
    next();
  };
  el.style.display = "block";
  game.mode = "diariovida";
}
{
  const daBase = deathAftermath;
  deathAftermath = function (id, opt) {
    if (!lifeMode()) return daBase(id, opt);
    showLifeSummary(dz(DEATHS[id].t), () => daBase(id, opt));
  };
  const heirBase = continueAsHeir;
  continueAsHeir = function (k, tax) {
    const r = heirBase(k, tax);
    player.genStart = player.day;
    player.court = {};
    player.consort = null;
    player.prival = null;
    return r;
  };
}
KEY_HANDLERS.diariovida = () => {};

/* ===================== 10. DESAFIOS DE COMEÇO ===================== */
const CHALLENGES = {
  orfao: { n: "Órfão sem ouro", d: "Comece com 0 de ouro e chegue a 1000.", start: () => (player.gold = 0), ok: () => player.gold >= 1000 },
  rainha25: { n: "Coroa antes dos 25", d: "Governe Aurélia antes dos 25 anos.", ok: () => rulesK("aurelia") && playerAge() < 25, fail: () => playerAge() >= 25 },
  limpo: { n: "Mãos limpas", d: "Roube 10 vezes sem nunca ser pego.", ok: () => (player.thefts || 0) - (player.challenge.t0 || 0) >= 10, fail: () => !!player.caughtOnce },
  amado: { n: "Amado por todos", d: "Chegue a reputação 95.", ok: () => (player.rep ?? 50) >= 95 },
};
function challengeMenu() {
  const C = player.challenge;
  const done = (() => {
    try {
      return JSON.parse(localStorage.getItem("ecosDesafios") || "[]");
    } catch (e) {
      return [];
    }
  })();
  if (C) return choice("Desafio ativo", `<b>${CHALLENGES[C.id].n}</b>: ${CHALLENGES[C.id].d}`, [{ t: "Desistir do desafio", fn: () => ((player.challenge = null), toast("Desafio abandonado.", 2000)) }, { t: "Fechar", fn: null }]);
  if (player.day > 2) return say([["", "Desafios só podem começar nos 2 primeiros dias de uma vida nova."]]);
  choice("Desafios", "Escolha um desafio para esta vida:", Object.entries(CHALLENGES).map(([k, c]) => ({ t: `${done.includes(k) ? "✅ " : ""}${c.n}: ${c.d}`, fn: () => ((player.challenge = { id: k, t0: player.thefts || 0 }), c.start && c.start(), saveGame(), toast(`Desafio aceito: ${c.n}!`, 2600)) })).concat([{ t: "Fechar", fn: null }]));
}
function challengeTick() {
  const C = player.challenge;
  if (!C) return;
  const D = CHALLENGES[C.id];
  if (D.ok()) {
    player.challenge = null;
    try {
      const done = JSON.parse(localStorage.getItem("ecosDesafios") || "[]");
      if (!done.includes(C.id)) done.push(C.id);
      localStorage.setItem("ecosDesafios", JSON.stringify(done));
    } catch (e) {}
    repAdd(5);
    playSound(1047, 0.3, "triangle");
    toast(`🏆 DESAFIO CUMPRIDO: ${D.n}!`, 5000);
  } else if (D.fail && D.fail()) {
    player.challenge = null;
    toast(`Desafio perdido: ${D.n}. Fica para a próxima vida!`, 4200);
  }
}
{
  const csBase = caughtStealing;
  caughtStealing = function () {
    player.caughtOnce = true;
    return csBase.apply(this, arguments);
  };
}

/* ===================== AÇÕES: novos atalhos ===================== */
{
  const amBase = actionsMenu;
  actionsMenu = function () {
    hookChoice(amBase, (title, text, opts) => {
      if (!lifeMode()) return [title, text, opts];
      const at = opts.findIndex((o) => /Árvore/.test(o.t));
      opts.splice(at + 1, 0, { t: player.challenge ? `Desafio: ${CHALLENGES[player.challenge.id].n}` : "Desafios", icon: "flag", fn: challengeMenu });
      if (myRival()) opts.splice(at + 2, 0, { t: `Meu rival: ${shortName(myRival().id)} (${myRival().wins}x${myRival().losses})`, icon: "sword", fn: () => say([["", `${shortName(myRival().id)} é ${gw(myRival().id, "seu rival", "sua rival")}. Fale com ${gw(myRival().id, "ele", "ela")} para desafiar.`]]) });
      return [title, text, opts];
    });
  };
}

/* ===================== 11. RETRATOS COM EXPRESSÃO ===================== */
{
  const leBase = lineEmotion;
  lineEmotion = function (text) {
    if (/\*(chora|soluça|funga)|snif|lágrima|triste|chorando|buá/i.test(text)) return "cry";
    if (/!!|grr|ódio|maldito|VOU TE|raiva|SAI DAQUI/i.test(text)) return "anger";
    return leBase(text);
  };
  const dpBase = drawDialogPortrait;
  drawDialogPortrait = function (d, talking) {
    const em = d && d.lines && d.lines[d.i] ? lineEmotion(d.lines[d.i][1]) : null;
    if (em === "cry") {
      // Desenha o retrato normal e as lágrimas por cima.
      const leb = lineEmotion;
      lineEmotion = () => null;
      try {
        dpBase(d, talking);
      } finally {
        lineEmotion = leb;
      }
      const cv = byId("dport"),
        c2 = cv.getContext("2d");
      const t = game.t;
      c2.fillStyle = "#7ac8ff";
      for (const ex of [0.38, 0.6]) {
        const y = (cv.height * 0.5 + ((t * 40) % 24)) | 0;
        c2.fillRect((cv.width * ex) | 0, y, 4, 7);
      }
      return;
    }
    dpBase(d, talking);
    if (em === "anger") {
      const cv = byId("dport"),
        c2 = cv.getContext("2d");
      c2.fillStyle = "rgba(255,60,60,.18)";
      c2.fillRect(0, 0, cv.width, cv.height);
    }
  };
}

/* ===================== 12. MÚSICAS ===================== */
Object.assign(TRACKS, {
  golpe: { bpm: 112, lead: "sawtooth", melody: [57, 0, 57, 60, 0, 57, 62, 0, 60, 0, 57, 0, 55, 0, 57, 0, 57, 0, 57, 60, 0, 64, 62, 0, 60, 0, 59, 0, 57, 0, 0, 0], bass: [33, 33, 0, 33, 31, 31, 0, 31, 29, 29, 0, 29, 28, 0, 28, 0] },
  velorio: { bpm: 56, lead: "triangle", melody: [64, 0, 0, 62, 0, 0, 60, 0, 0, 0, 59, 0, 57, 0, 0, 0, 60, 0, 0, 59, 0, 0, 57, 0, 55, 0, 0, 0, 57, 0, 0, 0], bass: [45, 0, 0, 0, 41, 0, 0, 0, 43, 0, 0, 0, 40, 0, 0, 0] },
  casamento: { bpm: 96, lead: "triangle", melody: [72, 0, 77, 77, 77, 0, 0, 0, 72, 0, 79, 76, 77, 0, 0, 0, 72, 0, 77, 81, 84, 0, 81, 0, 79, 0, 77, 76, 77, 0, 0, 0], bass: [53, 0, 0, 0, 48, 0, 0, 0, 50, 0, 0, 0, 53, 0, 0, 0] },
  eleicao: { bpm: 120, lead: "square", melody: [67, 0, 67, 69, 71, 0, 67, 0, 72, 0, 71, 0, 69, 0, 67, 0, 64, 0, 67, 69, 71, 0, 74, 0, 72, 71, 69, 0, 67, 0, 0, 0], bass: [43, 0, 50, 0, 43, 0, 50, 0, 48, 0, 55, 0, 43, 0, 50, 0] },
});
{
  const dtBase = desiredTrack;
  desiredTrack = function () {
    if (game.deathScene) return "velorio";
    if (game.cine) return "festival";
    const ch = byId("choice");
    const title = ch && ch.style.display !== "none" && ch.querySelector("h2,h3,.ttl") ? ch.querySelector("h2,h3,.ttl").textContent : "";
    if (/Muralha|corredores|quarto real|Portões|Salão do Castelo|Sala do Trono|GOLPE/i.test(title)) return "golpe";
    if (/Casamento de|casamento/i.test(title) || (game.dialog && /Padre Anselmo/.test((game.dialog.lines[game.dialog.i] || [])[0] || "") && /aceita/.test((game.dialog.lines[game.dialog.i] || [])[1] || ""))) return "casamento";
    if (/Eleição/.test(title)) return "eleicao";
    return dtBase();
  };
}

/* ===================== 13. TOQUE E SEGURE ===================== */
(function holdToInteract() {
  const cv = byId("cv");
  if (!cv) return;
  let tm = null,
    start = null;
  const tileAtPoint = (cx, cy) => {
    const r = cv.getBoundingClientRect();
    const C = game.cam;
    if (!C) return null;
    const px = ((cx - r.left) / r.width) * viewWidth,
      py = ((cy - r.top) / r.height) * 480;
    return [Math.floor((px / C.Z + C.camX) / TILE), Math.floor((py / C.Z + C.camY) / TILE)];
  };
  cv.addEventListener("pointerdown", (e) => {
    if (e.pointerType !== "touch" || game.mode !== "world" || game.dialog) return;
    start = [e.clientX, e.clientY];
    clearTimeout(tm);
    tm = setTimeout(() => {
      const p = tileAtPoint(start[0], start[1]);
      if (!p) return;
      for (const [dx, dy] of [[0, 0], [0, 1], [0, -1], [1, 0], [-1, 0]]) {
        const x = p[0] + dx,
          y = p[1] + dy;
        if (characterAt(x, y)) {
          game.autoPath = null;
          if (navigator.vibrate) navigator.vibrate(30);
          interactAt(x, y);
          return;
        }
      }
    }, 500);
  });
  const cancel = (e) => {
    if (!start) return;
    if (e.type === "pointermove" && Math.hypot(e.clientX - start[0], e.clientY - start[1]) < 12) return;
    clearTimeout(tm);
    start = null;
  };
  cv.addEventListener("pointermove", cancel);
  cv.addEventListener("pointerup", cancel);
  cv.addEventListener("pointercancel", cancel);
})();

/* ===================== LIGAÇÕES ===================== */
{
  const dayBase = onNewDay;
  onNewDay = function () {
    dayBase.apply(this, arguments);
    if (!lifeMode()) return;
    courtDaily();
    bigEventDaily();
    dreamDaily();
    rivalDaily();
  };
  const cdBase = crewDrawList;
  crewDrawList = function (list, t) {
    cdBase(list, t);
    if (lifeMode()) drawBigEvent(list, t);
  };
  let acc = 0;
  const updBase = update;
  update = function (dt) {
    updBase(dt);
    if (!lifeMode() || game.mode === "title" || game.mode === "cutscene") return;
    acc += dt;
    if (acc < 1) return;
    acc = 0;
    if (game.mode === "world" && !game.dialog) {
      petitionTick();
      bigEventTick();
    }
    challengeTick();
  };
}
