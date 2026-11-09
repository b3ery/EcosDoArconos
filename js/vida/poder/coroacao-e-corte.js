/**
 * ECOS DO ARCANO — coroacao-e-corte.js (Simulador)
 * Cena da coroação, Corte Real (General, Tesoureiro, Espião, com risco de traição),
 * pedidos do povo no trono e casamento político que une reinos.
 * Modifica (envolve) funções de outros arquivos: coronation, coupWin, onNewDay, royalMenu, update.
 */

"use strict";

/* ===================== COROAÇÃO ===================== */
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

/* ===================== CORTE REAL ===================== */
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

/* ===================== PEDIDOS DO POVO ===================== */
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

/* ===================== CASAMENTO POLÍTICO ===================== */
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


/* ===================== LIGAÇÕES ===================== */
{
  const dayBase = onNewDay;
  onNewDay = function () {
    dayBase.apply(this, arguments);
    if (lifeMode()) courtDaily();
  };
  let acc = 0;
  const updBase = update;
  update = function (dt) {
    updBase(dt);
    if (!lifeMode() || game.mode !== "world" || game.dialog) return;
    acc += dt;
    if (acc < 1) return;
    acc = 0;
    petitionTick();
  };
}
