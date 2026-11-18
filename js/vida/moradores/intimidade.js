/**
 * ECOS DO ARCANO — intimidade.js (Modo +18, só no Simulador)
 * A "noite juntos" ganhou uma cena curta e discreta: quarto à luz de vela,
 * os dois embaixo da coberta (só as cabeças aparecem), a vela apaga e corta.
 * Nada explícito, nenhuma nudez.
 *  - Com quem é casado: sem riscos, sem fofoca e sem falar de filhos.
 *  - Antes do casamento (namoro ou casual): se a vila descobrir, perde reputação.
 *    O lugar escolhido muda a chance de alguém ver (a pousada é a mais discreta).
 *  - Casual: chance de doença venérea ou gravidez indesejada. Usar proteção
 *    (da boticária, na hora) diminui muito os riscos.
 *  - Sem minijogo: as escolhas são o lugar, o clima e a proteção.
 * A turma (personagens inspirados nos criadores) continua fora dessas cenas.
 * Modifica (envolve) funções de outros arquivos: casualNight, lifeSocialItems, onNewDay.
 */

"use strict";

(() => {
  if (typeof SICKNESSES !== "undefined")
    SICKNESSES.venerea = {
      n: "Com doença venérea",
      icon: "meh",
      color: "#d98ab0",
      hours: 96,
      drain: { fun: 0.06, hygiene: 0.08, hp: 0.01 },
      pay: 0.8,
      cureItems: ["remedio"],
      desc: "Pegou numa noite sem proteção. Coça, arde e todo mundo percebe. Xarope de Ervas ou a Curandeira curam.",
    };

  const married = (id) => player.spouse === id || (player.sspouses || []).includes(id);
  const dating = (id) => player.dating === id || (player.lovers || []).includes(id) || (player.trisal || []).includes(id);
  const PLACES = [
    { k: "casa", n: "Na sua casa", see: 0.3, cost: 0 },
    { k: "dele", n: "Na casa da pessoa", see: 0.25, cost: 0 },
    { k: "pousada", n: "Num quarto da pousada (12 ouro)", see: 0.1, cost: 12 },
  ];
  const MOODS = [
    { n: "Velas e vinho (6 ouro)", cost: 6, fun: 45, fr: 9 },
    { n: "Música baixinha e conversa", cost: 0, fun: 38, fr: 7 },
    { n: "Sem enrolação", cost: 0, fun: 30, fr: 4 },
  ];

  /* ===================== A CENA ===================== */
  function nightScene(id, after) {
    let el = byId("nightov");
    if (!el) {
      el = document.createElement("div");
      el.id = "nightov";
      el.style.cssText = "position:absolute;inset:0;z-index:40;background:#000;display:none;align-items:center;justify-content:center;flex-direction:column;gap:.8em;color:#e8dcf0;font-size:1.05em";
      byId("screen").appendChild(el);
    }
    el.innerHTML = `<canvas width="320" height="200" style="width:min(90vw,640px,100vh);height:auto!important;max-height:72vh;image-rendering:pixelated;position:static!important;border-radius:10px"></canvas><div class="nt"></div>`;
    el.style.display = "flex";
    game.mode = "cutscene";
    const cv = el.querySelector("canvas"),
      g = cv.getContext("2d"),
      txt = el.querySelector(".nt");
    const L = player.look || {};
    const N = NPCS[id] || {};
    const heads = [
      { skin: L.skin || "#e8b896", hair: L.hair || "#3a2414", x: 132 },
      { skin: N.skin || "#d9a07a", hair: N.hair || "#1a1a1a", x: 168 },
    ];
    const quilt = player.look && player.look.robe ? player.look.robe : "#8a3a5a";
    const t0 = performance.now();
    let raf;
    const draw = () => {
      const t = (performance.now() - t0) / 1000;
      const candle = t < 3.2 ? 1 : Math.max(0, 1 - (t - 3.2) * 1.4);
      // quarto
      g.fillStyle = "#1c1424";
      g.fillRect(0, 0, 320, 200);
      g.fillStyle = "#2a1e30";
      g.fillRect(0, 150, 320, 50);
      // janela com lua
      g.fillStyle = "#0e1a30";
      g.fillRect(36, 30, 50, 44);
      g.fillStyle = "#f2eecf";
      g.beginPath();
      g.arc(70, 44, 8, 0, 7);
      g.fill();
      g.fillStyle = "#3a2a20";
      g.fillRect(34, 28, 54, 3);
      g.fillRect(34, 73, 54, 3);
      g.fillRect(59, 30, 3, 44);
      // cama
      g.fillStyle = "#5a3a22";
      g.fillRect(100, 92, 120, 14);
      g.fillRect(100, 92, 8, 70);
      g.fillRect(212, 112, 8, 50);
      g.fillStyle = "#e8e4dc";
      g.fillRect(110, 100, 100, 18);
      // cabeças no travesseiro
      heads.forEach((h, i) => {
        const bob = Math.sin(t * 2 + i) * 0.6;
        g.fillStyle = h.hair;
        g.fillRect(h.x - 9, 98 + bob, 18, 10);
        g.fillStyle = h.skin;
        g.fillRect(h.x - 7, 102 + bob, 14, 12);
        g.fillStyle = h.hair;
        g.fillRect(h.x - 8, 99 + bob, 16, 4);
        g.fillStyle = "#1a1028";
        g.fillRect(h.x - 4 + (i ? -1 : 1), 107 + bob, 2, 1);
        g.fillRect(h.x + 2 + (i ? -1 : 1), 107 + bob, 2, 1);
      });
      // coberta por cima de tudo (cobre do pescoço para baixo)
      const wave = Math.sin(t * 2.4) * 2;
      g.fillStyle = quilt;
      g.beginPath();
      g.moveTo(106, 114);
      g.quadraticCurveTo(140, 108 + wave, 160, 113);
      g.quadraticCurveTo(185, 108 - wave, 214, 114);
      g.lineTo(220, 160);
      g.lineTo(104, 160);
      g.closePath();
      g.fill();
      g.fillStyle = "rgba(255,255,255,.12)";
      for (let x = 112; x < 214; x += 14) g.fillRect(x, 118, 6, 40);
      // vela
      g.fillStyle = "#3a2a20";
      g.fillRect(240, 120, 30, 6);
      g.fillStyle = "#f2eecf";
      g.fillRect(251, 102, 8, 18);
      if (candle > 0) {
        g.fillStyle = `rgba(255,170,60,${candle})`;
        g.beginPath();
        g.ellipse(255, 98 + Math.sin(t * 12) * 0.6, 3, 5, 0, 0, 7);
        g.fill();
        const gl = g.createRadialGradient(255, 98, 2, 255, 98, 140);
        gl.addColorStop(0, `rgba(255,170,80,${0.28 * candle})`);
        gl.addColorStop(1, "rgba(255,170,80,0)");
        g.fillStyle = gl;
        g.fillRect(0, 0, 320, 200);
      } else if (t < 4.6) {
        g.fillStyle = "rgba(200,200,210,.4)";
        g.fillRect(254, 90 - (t - 3.9) * 20, 2, 6);
      }
      // corações subindo
      for (let k = 0; k < 4; k++) {
        const ph = (t * 0.6 + k * 0.25) % 1;
        g.fillStyle = `rgba(255,107,138,${(1 - ph) * 0.9})`;
        const hx = 150 + Math.sin(k * 2 + t) * 20,
          hy = 92 - ph * 70;
        g.fillRect(hx, hy, 3, 3);
        g.fillRect(hx + 4, hy, 3, 3);
        g.fillRect(hx - 1, hy + 2, 9, 3);
        g.fillRect(hx + 1, hy + 5, 5, 2);
      }
      // escurece no fim
      if (t > 3.6) {
        g.fillStyle = `rgba(0,0,0,${Math.min(1, (t - 3.6) / 1.2)})`;
        g.fillRect(0, 0, 320, 200);
      }
      txt.innerHTML = t < 3.4 ? `Você e ${shortName(id)}...` : "<small>Algumas horas depois...</small>";
      if (t < 5.4) raf = requestAnimationFrame(draw);
      else {
        el.style.display = "none";
        game.mode = "world";
        after && after();
      }
    };
    playSound(392, 0.4, "sine");
    setTimeout(() => playSound(330, 0.5, "sine"), 500);
    raf = requestAnimationFrame(draw);
  }

  /* ===================== CONSEQUÊNCIAS ===================== */
  const canConceive = (id) => {
    const a = player.gender,
      b = typeof npcGender === "function" ? npcGender(id) : null;
    return (a === "m" && b === "f") || (a === "f" && b === "m");
  };
  function aftermath(id, P, M, prot) {
    const n = shortName(id);
    player.clock = Math.min(1439, player.clock + 120);
    if (typeof addNeed === "function") addNeed("fun", M.fun);
    player.hygiene = Math.max(0, (player.hygiene ?? 70) - 20);
    addFriendship(id, M.fr);
    player.casualCount = (player.casualCount || 0) + 1;
    const lines = [];
    if (married(id)) {
      lines.push(["", pk(["Vocês acordam abraçados. O café da manhã pode esperar.", "Uma noite só de vocês dois.", `${n} sorri dormindo. Você também.`])]);
      return say(lines), saveGame();
    }
    // A vila descobriu?
    if (Math.random() < P.see) {
      const loss = dating(id) ? 3 : 5;
      repAdd(-loss);
      vilaNews(pk([`Fofoca: ${player.name} e ${n} foram vistos saindo juntos de madrugada. E nem são casados!`, `A vila não fala de outra coisa: ${player.name} passou a noite com ${n}.`]));
      lines.push(["", `Alguém viu. A vila já está comentando (−${loss} de reputação).`]);
    }
    // Traição?
    const partner = player.spouse || player.dating;
    const trio = player.trisal && player.trisal.includes(id);
    if (partner && partner !== id && !trio && !(typeof openRelationship === "function" && openRelationship()) && Math.random() < 0.4) {
      addFriendship(partner, -30);
      lines.push([shortName(partner), pk(["Você o QUÊ?! Eu confiei em você!", "Não fala comigo. Hoje não. Talvez nunca.", "Todo mundo sabe, menos eu?! Que vergonha!"])]);
    }
    // Riscos do casual (namoro firme também corre risco de gravidez, mas não de doença).
    const casual = !dating(id);
    const risk = prot ? 0.04 : 0.22;
    if (casual && Math.random() < risk) setTimeout(() => getSick("venerea"), 1800);
    if (canConceive(id) && Math.random() < (prot ? 0.03 : casual ? 0.15 : 0.1) && !player.preg) {
      player.preg = { id, day: player.day + 3, who: player.gender === "f" ? "você" : n };
    }
    if (!lines.length) lines.push(["", pk(["Ninguém viu. Acho.", "Você volta para casa com um sorriso besta no rosto.", "Valeu a pena. Sua higiene, nem tanto."])]);
    say(lines);
    saveGame();
  }

  /** Gravidez indesejada: a notícia chega alguns dias depois. */
  function pregnancyNews() {
    const P = player.preg;
    if (!P || player.day < P.day || !NPCS[P.id]) return;
    player.preg = null;
    const n = shortName(P.id);
    const meFem = P.who === "você";
    say([["", meFem ? "Você anda enjoada, cansada... e a parteira confirma: você está esperando um bebê." : `${n} vem te procurar, nervos${gw(P.id, "o", "a")}.`], ...(meFem ? [] : [[n, "Eu tô grávida. É seu."]])], () =>
      choice("Um bebê a caminho", `Não estava nos planos. ${meFem ? `O pai é ${n}.` : ""} O que você faz?`, [
        {
          t: "Assumir a criança",
          icon: "heart",
          fn: () => {
            addFriendship(P.id, 10);
            const g = Math.random() < 0.5 ? "m" : "f";
            const nm = pk(g === "m" ? ["Bento", "Caio", "Davi", "Elias", "Theo"] : ["Alice", "Clara", "Lívia", "Maya", "Nina"]);
            player.kids.push({ name: nm, g, born: player.day, look: { skin: player.look.skin, hair: Math.random() < 0.5 ? player.look.hair : NPCS[P.id].hair, hstyle: "curto", hat: "nenhum", hatc: "#2a2f6e", outfit: "tunica", robe: g === "f" ? "#e86ab0" : "#4a7ad9" } });
            vilaNews(`${player.name} e ${n} vão ter um bebê. E nem são casados! A vila está em choque (mas manda presentes).`);
            repAdd(-2);
            saveGame();
            celebrateBirth(g, () => say([["", `Meses depois, ${nm} nasce. Não foi planejado, mas é seu.`], [n, "A gente dá conta. Juntos, ou do nosso jeito."]]));
          },
        },
        {
          t: meFem ? "Entregar o bebê para o pai criar" : `Deixar ${n} criar sozinh${gw(P.id, "o", "a")}`,
          icon: "door",
          fn: () => {
            addFriendship(P.id, -40);
            repAdd(-8);
            vilaNews(`${player.name} não quis assumir o filho que teve com ${n}. A vila não perdoa fácil.`);
            say([[n, "Então tá. Eu crio. Mas nunca mais olha na minha cara."], ["", "A vila inteira fica sabendo (−8 de reputação)."]]);
          },
        },
      ]),
    );
  }

  /* ===================== A NOITE ===================== */
  function askNight(id) {
    const n = shortName(id);
    if (player.famDay["casual" + id] === player.day) return say([[n, "De novo hoje? Calma, fogo!"]]);
    if (!married(id)) {
      const f = friendship(id);
      const ch = (dating(id) ? 0.65 : 0.25) + f / 160 + ((player.hygiene ?? 70) > 60 ? 0.1 : -0.2) + ((player.rep ?? 50) - 50) / 300;
      if (Math.random() > ch) {
        player.famDay["casual" + id] = player.day;
        addFriendship(id, -3);
        return say([[n, pk(["Hoje não. Mas me paga uma cerveja que eu penso no caso.", "Calma lá, a gente mal se conhece.", "Hmm... não. Mas obrigad" + gw(id, "o", "a") + " pela confiança, eu acho."])]]);
      }
    }
    player.famDay["casual" + id] = player.day;
    const places = married(id) ? PLACES.filter((p) => p.k !== "dele") : PLACES;
    choice(`Noite com ${n}`, married(id) ? "Onde vocês passam a noite?" : `${n} topa. Onde? (A pousada é a mais discreta: a vila vê menos.)`, places.map((P) => ({ t: P.n, icon: "house", fn: () => pickMood(id, P) })).concat([{ t: "Deixa pra outro dia", fn: null }]));
  }
  function pickMood(id, P) {
    if (P.cost && player.gold < P.cost) return toast("Ouro insuficiente para a pousada.", 1800);
    choice("O clima", "Como vai ser?", MOODS.map((M) => ({ t: M.n, icon: "heart", fn: () => pickProt(id, P, M) })));
  }
  function pickProt(id, P, M) {
    if (M.cost + P.cost > player.gold) return toast("Ouro insuficiente.", 1800);
    const go = (prot) => {
      const cost = P.cost + M.cost + (prot ? 4 : 0);
      if (player.gold < cost) return toast("Ouro insuficiente.", 1800);
      player.gold -= cost;
      nightScene(id, () => aftermath(id, P, M, prot));
    };
    if (married(id)) return go(false);
    choice("Proteção", "Uma tripa de carneiro da boticária protege contra doenças e gravidez (quase sempre).", [
      { t: "Usar proteção (4 ouro)", icon: "shield", fn: () => go(true) },
      { t: "Sem proteção (arriscado)", icon: "skull", fn: () => go(false) },
    ]);
  }

  // A noite casual antiga passa a usar a cena e as escolhas novas.
  casualNight = askNight;
  const lsBase = lifeSocialItems;
  lifeSocialItems = function (id) {
    const out = lsBase.apply(this, arguments) || [];
    if (!adultOn() || !NPCS[id] || !notCrew(id)) return out;
    if (married(id) && !out.some((o) => /Passar a noite/.test(o.t))) out.push({ t: "Passar a noite junto (+18)", icon: "heart", fn: () => askNight(id) });
    return out;
  };
  const ndBase = onNewDay;
  onNewDay = function () {
    ndBase.apply(this, arguments);
    if (player.preg) setTimeout(() => !game.dialog && pregnancyNews(), 4500);
  };
  window.nightScene = nightScene;
})();
