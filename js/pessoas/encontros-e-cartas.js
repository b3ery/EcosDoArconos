/**
 * ECOS DO ARCANO — encontros-e-cartas.js
 * Encontro não é na rua: a pessoa espera DENTRO de um lugar de verdade.
 *  - Taverna (dividir uma caneca, dançar com o bardo), Padaria (pão doce e
 *    café da manhã), Biblioteca (ler poesia em voz baixa), Templo da Luz
 *    (acender uma vela juntos) e Sua Casa (jantar à luz de velas, só para quem
 *    namora ou é casado).
 *  - As opções do encontro entram no menu pizza da pessoa, como antes.
 *  - Os encontros do Coração (contatos) também acontecem nesses lugares.
 * Cartas: escreva para qualquer pessoa próxima (papel, tinta e mensageiro:
 * 2 ouro). A resposta chega por um mensageiro umas horas depois. Amigos
 * também mandam cartas sozinhos. As cartas são lidas num pergaminho com lacre.
 * Modifica (envolve) funções de outros arquivos: enterBuilding, targetAt,
 * interactAt, walkable, characterAt, crewDrawList, lifeSocialItems, update,
 * renderInv, meetContact.
 */

"use strict";

(() => {
  const PL = [
    { b: "Taverna Javali Dourado", n: "na Taverna Javali Dourado", k: "taverna" },
    { b: "Padaria", n: "na Padaria", k: "padaria" },
    { b: "Biblioteca", n: "na Biblioteca", k: "biblioteca" },
    { b: "Templo da Luz", n: "no Templo da Luz", k: "templo" },
    { b: "Sua Casa", n: "na sua casa", k: "casa", partner: true },
  ];
  const now = () => player.day * 1440 + player.clock;
  const cap = (s) => s[0].toUpperCase() + s.slice(1);
  const partnerOf = (id) => player.spouse === id || player.dating === id || (player.lovers || []).includes(id) || (player.sspouses || []).includes(id);
  const bld = (name) => ZONES.vila && ZONES.vila.town.bld.find((b) => b.name === name);
  const inside = () => {
    const D = game.dateIn;
    return D && player.zone === "interior" && game.inter && game.inter.b && game.inter.b.name === D.b && D.x != null;
  };
  const near = () => inside() && Math.abs(player.x - game.dateIn.x) + Math.abs(player.y - game.dateIn.y) <= 2;
  function invitable() {
    const dead = typeof deadList === "function" ? deadList() : {};
    const ids = new Set();
    for (const id of Object.keys(player.rel || {})) if (NPCS[id] && FRIENDS[id] && !dead[id]) ids.add(id);
    for (const c of player.contacts || []) if (NPCS[c.id] && !dead[c.id]) ids.add(c.id);
    return [...ids].filter((id) => partnerOf(id) || friendship(id) >= 25 || (player.contacts || []).some((c) => c.id === id)).sort((a, b) => partnerOf(b) - partnerOf(a) || friendship(b) - friendship(a));
  }

  /* ===================== ONDE A PESSOA ESPERA, LÁ DENTRO ===================== */
  function placeInside() {
    const D = game.dateIn;
    const z = ZONES.interior,
      I = game.inter;
    const busy = (x, y) => z.map[y][x] !== "." || I.props.some((p) => p[1] === x && p[2] === y) || I.people.some((p) => p.x === x && p.y === y) || (I.tavSpots && Object.values(I.tavSpots).some((p) => p && p[0] === x && p[1] === y));
    // perto de uma mesa, se tiver; se não, no meio do salão
    const tables = I.props.filter((p) => ["table", "bench", "altar", "shelf", "bed"].includes(p[0]));
    const cands = [];
    for (let y = 1; y < z.h - 1; y++)
      for (let x = 1; x < z.w - 1; x++) {
        if (busy(x, y) || busy(x + 1, y) || (x === z.town.arrive[0] && y === z.town.arrive[1])) continue;
        const d = tables.length ? Math.min(...tables.map((p) => Math.abs(p[1] - x) + Math.abs(p[2] - y))) : Math.abs(x - z.w / 2) + Math.abs(y - z.h / 2);
        cands.push([d + (y >= z.h - 3 ? 3 : 0), x, y]);
      }
    cands.sort((a, b) => a[0] - b[0]);
    const c = cands[0];
    if (!c) return;
    D.x = c[1];
    D.y = c[2];
  }
  const ebBase = enterBuilding;
  enterBuilding = function (b) {
    const r = ebBase.apply(this, arguments);
    const D = game.dateIn;
    if (D && b && b.name === D.b && player.zone === "interior") {
      placeInside();
      if (!D.greeted) {
        D.greeted = true;
        setTimeout(() => toast(`${shortName(D.id)} acena lá de dentro. Vá até ${gw(D.id, "ele", "ela")}!`, 3800), 500);
      }
    }
    return r;
  };

  function startDateIn(id, P, invited) {
    game.date = null;
    game.dateIn = { id, b: P.b, n: P.n, k: P.k, until: now() + 180, x: null, y: null, invited };
  }

  /* ===================== O QUE FAZER EM CADA LUGAR ===================== */
  const spend = (g) => (player.gold < g ? (toast(`Precisa de ${g} de ouro.`, 1800), false) : ((player.gold -= g), true));
  function placeItems(id) {
    const n = shortName(id);
    const k = game.dateIn.k;
    const it = [];
    const fx = (f, m, lines) => (addFriendship(id, f), passMin(m), typeof needAdd === "function" && needAdd("fun", 10), say(lines));
    if (k === "taverna")
      it.push(
        { t: "Encontros: dividir uma caneca de hidromel (4 ouro)", icon: "mug", fn: () => spend(4) && fx(6, 30, [["", "O Gus traz uma caneca grande e dois canudos de palha. Vocês brindam."], [n, pk(["À nossa!", "Esse hidromel é melhor quando é dividido.", "Se eu ficar bobo(a), a culpa é sua."])]]) },
        { t: "Encontros: dançar quando o bardo tocar", icon: "note", fn: () => fx(7, 20, [["", "O bardo puxa uma ciranda. Vocês tropeçam no começo e riem até o fim."]]) },
      );
    if (k === "padaria")
      it.push(
        { t: "Encontros: dividir um pão doce quentinho (3 ouro)", icon: "pie", fn: () => spend(3) && (typeof needAdd === "function" && needAdd("food", 15), fx(6, 20, [["", "O pão sai do forno estalando. Você parte ao meio e entrega a metade maior."], [n, "Você me deu a maior. Eu vi."]])) },
        { t: "Encontros: escolher juntos um bolo de mel", icon: "honey", fn: () => fx(4, 15, [[n, pk(["Esse aqui, com flor de açúcar em cima!", "O de nozes. Sempre o de nozes."])]]) },
      );
    if (k === "biblioteca")
      it.push(
        { t: "Encontros: ler poesia em voz baixa", icon: "book", fn: () => fx(7, 40, [["", "Vocês dividem um livro de trovas antigas. A bibliotecária finge que não está ouvindo."], [n, "Lê de novo aquela parte. A do rio."]]) },
        { t: "Encontros: deixar um bilhete escondido num livro", icon: "scroll", fn: () => fx(5, 10, [["", "Você esconde um bilhete na página 42. Um dia alguém vai achar."]]) },
      );
    if (k === "templo")
      it.push(
        { t: "Encontros: acender uma vela juntos (1 ouro)", icon: "sun", fn: () => spend(1) && fx(7, 15, [["", "Duas chamas pequenas, lado a lado. Vocês fazem um pedido em silêncio."], [n, "Não vou contar o meu. Senão não vale."]]) },
        { t: "Encontros: ouvir o coro do templo", icon: "note", fn: () => fx(5, 30, [["", "O coro canta baixinho. A luz colorida dos vitrais cai em vocês dois."]]) },
      );
    if (k === "casa")
      it.push(
        { t: "Encontros: jantar à luz de velas", icon: "sun", fn: () => (typeof needAdd === "function" && needAdd("food", 25), fx(9, 60, [["", "Sopa quente, pão e duas velas na mesa. Lá fora, a vila vai dormindo."], [n, pk(["Podia ser assim todo dia.", "Você cozinhou? Mentira. Tá bom demais."])]])) },
        { t: "Encontros: ver as estrelas pela janela", icon: "star", fn: () => fx(6, 30, [["", "Vocês contam as estrelas e erram a conta de propósito para começar de novo."]]) },
      );
    it.push({ t: "Encontros: despedir-se", icon: "door", fn: () => (say([[n, pk(["Gostei muito. Vamos repetir?", "Foi ótimo. Me manda uma carta, tá?", "Até a próxima!"])]]), (game.dateIn = null)) });
    return it;
  }
  const lsBase = lifeSocialItems;
  lifeSocialItems = function (id) {
    const out = lsBase.apply(this, arguments);
    if (!near() || game.dateIn.id !== id) return out;
    return [...placeItems(id), ...out];
  };
  function openDate() {
    const D = game.dateIn;
    game.pieAnchor = { x: D.x, y: D.y };
    if (FRIENDS[D.id]) return socialMenu(D.id);
    choice(`Encontro com ${shortName(D.id)}`, `${shortName(D.id)} sorri quando você chega.`, lifeSocialItems(D.id));
  }
  const at = (x, y) => inside() && game.dateIn.x === x && game.dateIn.y === y;
  const tgBase = targetAt;
  targetAt = function (x, y) {
    if (at(x, y)) return `Encontro com ${shortName(game.dateIn.id)}`;
    return tgBase(x, y);
  };
  const iaBase = interactAt;
  interactAt = function (x, y) {
    if (at(x, y)) return openDate();
    return iaBase(x, y);
  };
  const wkBase = walkable;
  walkable = function (z, x, y) {
    if (z === "interior" && at(x, y)) return false;
    return wkBase(z, x, y);
  };
  const caBase = characterAt;
  characterAt = function (x, y) {
    if (at(x, y)) return true;
    return caBase(x, y);
  };
  // quem está esperando no encontro não anda pela rua ao mesmo tempo
  if (typeof crewVisible === "function") {
    const cvBase = crewVisible;
    crewVisible = function (a) {
      if (a && game.dateIn && game.dateIn.id === a.id) return false;
      return cvBase(a);
    };
  }
  const cdBase = crewDrawList;
  crewDrawList = function (list, t) {
    cdBase(list, t);
    const D = game.dateIn;
    if (!D) return;
    if (now() > D.until) {
      toast(`${shortName(D.id)} cansou de esperar ${D.n} e foi embora.`, 4000);
      if (typeof addFriendship === "function") addFriendship(D.id, -3);
      game.dateIn = null;
      return;
    }
    if (!inside()) return;
    const N = NPCS[D.id];
    if (!N) return;
    list.push({
      y: D.y,
      draw: () => {
        const X = D.x * TILE,
          Y = D.y * TILE;
        ctx.fillStyle = "rgba(0,0,0,.25)";
        ctx.beginPath();
        ctx.ellipse(X + 16, Y + 30, 9, 3, 0, 0, 7);
        ctx.fill();
        const left = player.x < D.x;
        drawSprite(wizardRects(N.robe, N.hat ?? null, N.hair, null, left ? "left" : "right", 0), X, Y + Math.sin(t * 2) * 0.6, 2, left);
        if (!near()) drawPixelIcon("heart", X + 16, Y - 8 + Math.sin(t * 3) * 2, 2);
      },
    });
  };

  /* ===================== CONVITE (pelo inventário ou por carta) ===================== */
  function pickPlace(id, then) {
    const opts = PL.filter((P) => !P.partner || partnerOf(id)).map((P) => ({ t: cap(P.n), icon: { taverna: "mug", padaria: "pie", biblioteca: "book", templo: "sun", casa: "house" }[P.k], fn: () => then(P) }));
    choice(`Onde encontrar ${shortName(id)}?`, "A pessoa vai até lá e te espera umas 3 horas lá dentro.", opts.concat([{ t: "Voltar", fn: inviteMenu2 }]));
  }
  function inviteMenu2() {
    if (typeof closeInv === "function") closeInv();
    const D = game.dateIn;
    if (D) {
      const n = shortName(D.id);
      return choice("Encontro marcado", `${n} está te esperando ${D.n}.`, [
        { t: "Desmarcar", icon: "door", fn: () => ((game.dateIn = null), toast(`Você desmarcou com ${n}.`)) },
        { t: "Ok", fn: null },
      ]);
    }
    const h = currentHour();
    if (h < 7 || h >= 23) return say([["", "Está tarde (ou cedo) demais para chamar alguém. Tente entre 7h e 23h, ou mande uma carta."]]);
    const list = invitable();
    if (!list.length) return say([["", "Você ainda não tem amigos próximos para convidar. Converse com o povo da vila e faça amizades!"]]);
    choice(
      "Convidar para um encontro",
      "Quem você quer chamar?",
      list
        .slice(0, 14)
        .map((id) => ({ t: `${shortName(id)} · ${partnerOf(id) ? (player.spouse === id ? "cônjuge" : "romance") : REL_LV[friendshipLevel(id)][1]}`, icon: partnerOf(id) ? "heart" : "smile", fn: () => pickPlace(id, (P) => sendInvite(id, P)) }))
        .concat([{ t: "Cancelar", fn: null }]),
    );
  }
  function sendInvite(id, P) {
    const n = shortName(id);
    const asleep = typeof npcAsleep === "function" && npcAsleep(id);
    const chance = partnerOf(id) ? 0.95 : Math.min(0.9, 0.35 + friendship(id) / 120);
    if (asleep || Math.random() > chance) {
      addFriendship(id, 1);
      return say([["", `Um menino de recados leva o seu bilhete até ${n}.`], [n, pk(["Hoje não vou conseguir, desculpa! Outro dia?", "Hoje não dá... mas fiquei feliz com o convite!"])]]);
    }
    startDateIn(id, P, true);
    addFriendship(id, 2);
    playSound(880, 0.12, "sine");
    say([["", `Um menino de recados leva o seu bilhete até ${n}.`], [n, pk([`Claro! Te encontro ${P.n}.`, `Tô indo! ${cap(P.n)}, né?`])]], () => toast(`${n} vai te esperar ${P.n} por 3 horas. Entre lá!`, 4500));
  }
  window.inviteMenu = inviteMenu2;
  // Encontros do Coração (contatos) também acontecem lá dentro
  if (typeof meetContact === "function")
    meetContact = function (id) {
      if (typeof closeHearts === "function") closeHearts();
      if (!NPCS[id]) return;
      const P = pk(PL.filter((p) => !p.partner));
      startDateIn(id, P, false);
      const b = bld(P.b);
      if (!b) return;
      if (player.zone !== "vila") ((player.zone = "vila"), enterZone(false));
      enterBuilding(b);
    };

  /* ===================== CARTAS ===================== */
  const KINDS = [
    { k: "amizade", t: "Carta de amizade", icon: "smile", body: (n, id) => `Querid${gw(id, "o", "a")} ${n}, só queria dizer que gosto muito da sua companhia. A vila fica melhor com você nela.` },
    { k: "amor", t: "Carta de amor (lacre vermelho)", icon: "heart", body: (n) => `${n}, não sei falar isso olhando nos seus olhos, então escrevo: penso em você mais do que devia.` },
    { k: "desculpas", t: "Pedido de desculpas", icon: "flower", body: (n) => `${n}, me desculpe. Fui injust${gw2()} e passei a noite pensando nisso. Posso consertar?` },
    { k: "convite", t: "Convite para um encontro", icon: "scroll", body: (n) => `${n}, quer me encontrar? Prometo que vale a pena sair de casa.` },
  ];
  function gw2() {
    return typeof genderWord === "function" ? genderWord("o", "a", "e") : "o";
  }
  const L = () => (player.letters = player.letters || []);
  const P2 = () => (player.letterOut = player.letterOut || []);
  function writeLetter() {
    if (typeof closeInv === "function") closeInv();
    const list = invitable();
    if (!list.length) return say([["", "Você ainda não tem para quem escrever. Faça amizades na vila primeiro."]]);
    choice("Escrever uma carta", "Papel, tinta e o mensageiro custam 2 de ouro. Para quem?", list.slice(0, 14).map((id) => ({ t: shortName(id), icon: partnerOf(id) ? "heart" : "letter", fn: () => pickKind(id) })).concat([{ t: "Cancelar", fn: null }]));
  }
  function pickKind(id) {
    choice(`Carta para ${shortName(id)}`, "O que você quer escrever?", KINDS.map((K) => ({ t: K.t, icon: K.icon, fn: () => (K.k === "convite" ? pickPlace(id, (P) => send(id, K, P)) : send(id, K)) })).concat([{ t: "Voltar", fn: writeLetter }]));
  }
  function send(id, K, P) {
    if (!spend(2)) return;
    P2().push({ to: id, k: K.k, at: now() + 60 + Math.floor(Math.random() * 120), place: P ? P.k : null });
    playSound(660, 0.1, "triangle");
    showLetter({ from: player.name, to: shortName(id), txt: K.body(shortName(id), id), seal: K.k === "amor" ? "#b02a3a" : "#8a5a2e", mine: true });
    saveGame();
  }
  function reply(o) {
    const id = o.to,
      n = shortName(id),
      f = friendship(id),
      pr = partnerOf(id);
    let txt,
      seal = "#8a5a2e";
    if (o.k === "amizade") (addFriendship(id, 6), (txt = pk([`Que carta bonita! Guardei na gaveta das coisas importantes. Também gosto muito de você. — ${n}`, `Li três vezes. Obrigad${"o"} por lembrar de mim. Passa aqui qualquer dia! — ${n}`])));
    else if (o.k === "desculpas") (addFriendship(id, f < 10 ? 12 : 6), (txt = f < -10 && Math.random() < 0.5 ? `Ainda estou chateado(a). Mas li. Me dá um tempo. — ${n}` : `Desculpas aceitas. Todo mundo erra. Vamos esquecer isso? — ${n}`));
    else if (o.k === "amor") {
      seal = "#b02a3a";
      if (pr) (addFriendship(id, 10), (txt = `Você é bob${gw2()}. E eu adoro. Também penso em você o tempo todo. Volta logo pra casa. — ${n}`));
      else if (f >= 55 && Math.random() < 0.7) (addFriendship(id, 8), (txt = `Fiquei vermelho(a) lendo isso. Também sinto... alguma coisa. Fala comigo pessoalmente? — ${n}`), toast(`${n} gostou da carta! Agora é falar pessoalmente.`, 4200));
      else (addFriendship(id, f >= 25 ? 0 : -2), (txt = `Fico lisonjeado(a), de verdade. Mas gosto de você como amigo(a). Espero que a gente continue assim. — ${n}`));
    } else if (o.k === "convite") {
      const ok = pr || Math.random() < Math.min(0.9, 0.35 + f / 120);
      const P = PL.find((p) => p.k === o.place) || PL[0];
      if (ok && !game.dateIn) (startDateIn(id, P, true), (txt = `Aceito! Te espero ${P.n}. Não demora! — ${n}`));
      else txt = `Hoje não consigo, desculpa. Me escreve de novo outro dia? — ${n}`;
    }
    return { from: n, to: player.name, txt, seal };
  }
  const NPC_TXT = [
    (n) => `Oi! Lembrei de você hoje quando passei pela fonte. Aparece pra conversar! — ${n}`,
    (n) => `Soube da última? Não vou contar por carta. Vem me ver! — ${n}`,
    (n) => `Obrigad${"o"} pela ajuda dos últimos dias. Você é das boas pessoas desta vila. — ${n}`,
    (n) => `Fiz pão demais. Se passar aqui, leva um. — ${n}`,
  ];
  let lastDay = null;
  const upBase = update;
  update = function (dt) {
    upBase(dt);
    if (!player || game.mode === "title") return;
    // respostas chegando
    const out = P2();
    for (let i = out.length - 1; i >= 0; i--)
      if (now() >= out[i].at && NPCS[out[i].to]) {
        const o = out.splice(i, 1)[0];
        const r = reply(o);
        L().unshift(Object.assign(r, { day: player.day, read: false }));
        toast(`Um mensageiro trouxe a resposta de ${r.from}. (Inventário > Cartas)`, 4500);
        playSound(988, 0.1, "triangle");
      }
    // amigos escrevem sozinhos (uma chance por dia)
    if (lastDay !== player.day) {
      const first = lastDay === null;
      lastDay = player.day;
      if (!first && Math.random() < 0.45) {
        const fr = invitable().filter((id) => friendship(id) >= 40);
        if (fr.length) {
          const id = pk(fr),
            n = shortName(id);
          L().unshift({ from: n, to: player.name, txt: partnerOf(id) ? `Bom dia, meu bem. Acordei pensando em você. — ${n}` : pk(NPC_TXT)(n), seal: partnerOf(id) ? "#b02a3a" : "#8a5a2e", day: player.day, read: false });
          setTimeout(() => toast(`Chegou uma carta de ${n}! (Inventário > Cartas)`, 4200), 1500);
        }
      }
      if (L().length > 30) L().length = 30;
    }
  };

  /* ----- o pergaminho ----- */
  function ensureCss() {
    if (byId("lettercss")) return;
    const s = document.createElement("style");
    s.id = "lettercss";
    s.textContent = `#letterv{position:fixed;inset:0;z-index:60;display:flex;align-items:center;justify-content:center;background:rgba(10,6,4,.55)}
#letterv .lp{position:relative;width:min(440px,92vw);padding:28px 32px 40px;color:#3a2414;font:20px "VT323",monospace;line-height:1.25;
background:radial-gradient(ellipse at 30% 20%,#f6ead0,#e8d4a8 70%,#d2b882);border-radius:4px;box-shadow:0 0 0 3px #8a6a3a,0 12px 40px rgba(0,0,0,.6),inset 0 0 40px rgba(138,90,46,.35)}
#letterv .lp::before,#letterv .lp::after{content:"";position:absolute;left:-10px;right:-10px;height:16px;border-radius:8px;background:linear-gradient(#a8784a,#6b4423)}
#letterv .lp::before{top:-10px}#letterv .lp::after{bottom:-10px}
#letterv h4{margin:0 0 10px;font:700 20px "Pixelify Sans",sans-serif;color:#6b4423}
#letterv p{margin:0 0 14px;font-size:22px}
#letterv .seal{position:absolute;right:22px;bottom:14px;width:34px;height:34px;border-radius:50%;box-shadow:inset -3px -3px 0 rgba(0,0,0,.25),0 2px 0 rgba(0,0,0,.3)}
#letterv .seal::after{content:"✦";position:absolute;inset:0;display:grid;place-items:center;color:rgba(255,230,200,.75);font-size:16px}
#letterv .lb{display:flex;gap:8px;flex-wrap:wrap}
#letterv button{background:linear-gradient(#8a5a2e,#6b4423);color:#f6ead0;border-color:#3a2414}
#letterv .ll{max-height:44vh;overflow:auto;display:flex;flex-direction:column;gap:6px;margin-bottom:12px}
#letterv .ll button{text-align:left;background:rgba(138,90,46,.15);color:#3a2414;border-color:#a8784a}
#letterv .ll button.new{font-weight:700;border-color:#b02a3a}`;
    document.head.appendChild(s);
  }
  function overlay(html) {
    ensureCss();
    if (typeof hidePie === "function") hidePie();
    if (byId("choice")) byId("choice").style.display = "none";
    let v = byId("letterv");
    if (!v) ((v = document.createElement("div")), (v.id = "letterv"), document.body.appendChild(v));
    v.innerHTML = `<div class="lp">${html}</div>`;
    v.style.display = "flex";
    game.mode = "letter";
    v.onclick = (e) => e.target === v && closeLetters();
    return v;
  }
  function closeLetters() {
    const v = byId("letterv");
    if (v) v.style.display = "none";
    if (game.mode === "letter") game.mode = "world";
  }
  function showLetter(Lt) {
    const v = overlay(`<h4>${Lt.mine ? "Para " + Lt.to : "De " + Lt.from}</h4><p>${Lt.txt}</p><div class="lb"><button id="lcok">${Lt.mine ? "Lacrar e mandar" : "Guardar"}</button>${Lt.mine ? "" : '<button id="lcback">Outras cartas</button>'}</div><div class="seal" style="background:${Lt.seal}"></div>`);
    v.querySelector("#lcok").onclick = () => (closeLetters(), Lt.mine && toast(`O mensageiro saiu com a sua carta para ${Lt.to}. A resposta chega em algumas horas.`, 4200));
    const bk = v.querySelector("#lcback");
    if (bk) bk.onclick = lettersBox;
  }
  function lettersBox() {
    if (typeof closeInv === "function" && byId("inv") && byId("inv").style.display === "block") closeInv();
    const ls = L();
    const v = overlay(`<h4>Suas cartas</h4><div class="ll">${ls.length ? ls.map((l, i) => `<button data-l="${i}" class="${l.read ? "" : "new"}">${l.read ? "" : "✉ "}De ${l.from} · dia ${l.day}</button>`).join("") : "<p>Nenhuma carta ainda. Escreva para alguém!</p>"}</div><div class="lb"><button id="lcw">Escrever uma carta (2 ouro)</button><button id="lcx">Fechar</button></div>`);
    v.querySelectorAll("[data-l]").forEach((b) => (b.onclick = () => ((ls[+b.dataset.l].read = true), showLetter(ls[+b.dataset.l]))));
    v.querySelector("#lcw").onclick = () => (closeLetters(), writeLetter());
    v.querySelector("#lcx").onclick = closeLetters;
  }
  window.lettersBox = lettersBox;
  window.writeLetter = writeLetter;
  document.addEventListener("keydown", (e) => e.key === "Escape" && game.mode === "letter" && closeLetters());

  // botões no inventário: encontro (lugar fechado) e cartas
  const riBase = renderInv;
  renderInv = function () {
    riBase.apply(this, arguments);
    const d = byId("ivdate");
    if (d) {
      d.innerHTML = `${iconHTML("heart", 16)}${game.dateIn ? "Encontro marcado" : "Convidar para encontro"}`;
      d.onclick = inviteMenu2;
    }
    const gh = byId("inv") && byId("inv").querySelector(".gh");
    if (!gh || byId("ivletters")) return;
    const unread = L().filter((l) => !l.read).length;
    const b = document.createElement("button");
    b.id = "ivletters";
    b.innerHTML = `${iconHTML("scroll", 16)}Cartas${unread ? ` (${unread})` : ""}`;
    b.style.marginRight = ".5em";
    b.onclick = lettersBox;
    gh.insertBefore(b, d || gh.querySelector("button"));
  };
})();
