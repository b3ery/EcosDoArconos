/**
 * ECOS DO ARCANO — encontros.js
 *  - O encontro usa o mesmo menu pizza de sempre (todas as interações da
 *    pessoa + as opções do encontro no grupo Romântico).
 *  - Convidar para um encontro pelo Inventário: amigos, namorado(a),
 *    cônjuge e contatos. A pessoa vai até o lugar e te espera lá.
 *  - Avisos (toast) ficam na tela o tempo de ler e entram em fila, em vez de
 *    um apagar o outro.
 *  - Quem está falando com você para de andar até a conversa acabar.
 * Modifica (envolve) funções de outros arquivos: dateMenu, lifeSocialItems,
 * characterAt, toast, interactAt, update, crewVisible, renderInv.
 */

"use strict";

(() => {
  /* ===================== AVISOS LEGÍVEIS ===================== */
  const baseToast = toast;
  const queue = [];
  let busyUntil = 0,
    timer = null;
  const readTime = (msg, ms) => Math.min(7000, Math.max(ms || 0, 1800 + String(msg).length * 55));
  function showNext() {
    timer = null;
    const it = queue.shift();
    if (!it) return;
    const dur = queue.length > 2 ? Math.max(1600, it.dur * 0.6) : it.dur;
    baseToast(it.msg, dur);
    busyUntil = performance.now() + Math.min(dur, Math.max(1600, dur * 0.75));
    if (queue.length) timer = setTimeout(showNext, busyUntil - performance.now());
  }
  toast = function (msg, ms) {
    const last = queue[queue.length - 1];
    if ((last && last.msg === msg) || (byId("toast") && byId("toast").style.display === "block" && byId("toast").textContent === String(msg))) return;
    queue.push({ msg, dur: readTime(msg, ms) });
    if (queue.length > 5) queue.splice(0, queue.length - 5);
    if (!timer) {
      const wait = busyUntil - performance.now();
      if (wait <= 0) showNext();
      else timer = setTimeout(showNext, wait);
    }
  };

  /* ===================== QUEM CONVERSA, PARA ===================== */
  function entityAt(x, y) {
    if (game.crewA && typeof crewActorAt === "function") {
      const id = crewActorAt(x, y);
      if (id) return game.crewA[id];
    }
    const w = typeof walkerAt === "function" && walkerAt(x, y);
    if (w) return w;
    const r = typeof roamAt === "function" && roamAt(x, y);
    if (r) return r;
    return null;
  }
  const iaBase = interactAt;
  interactAt = function (x, y) {
    const e = entityAt(x, y);
    if (e) {
      game.talkLock = { e, x: e.x, y: e.y, rx: e.rx, ry: e.ry, idle: 0 };
      if ("dir" in e) e.dir = player.x < e.x ? "left" : player.x > e.x ? "right" : player.y < e.y ? "up" : "down";
    }
    return iaBase(x, y);
  };
  const upBase = update;
  update = function (dt) {
    upBase(dt);
    // Quem tem encontro marcado fica parado no lugar combinado (sem aparecer em dobro pela vila).
    const d = game.date;
    if (d && player.zone === "vila") {
      for (const r of game.roam || []) if (r.id === d.id) (r.x = d.x), (r.y = d.y), r.rx != null && ((r.rx = d.x), (r.ry = d.y));
      for (const w of game.walkers || []) if (w.cid === d.id || w.id === d.id) (w.x = d.x), (w.y = d.y), w.rx != null && ((w.rx = d.x), (w.ry = d.y));
    }
    const L = game.talkLock;
    if (!L) return;
    const busy = game.mode !== "world" || game.dialog;
    L.idle = busy ? 0 : L.idle + dt;
    if (L.idle > 1.5) return void (game.talkLock = null);
    const e = L.e;
    e.x = L.x;
    e.y = L.y;
    if (L.rx != null) e.rx = L.rx;
    if (L.ry != null) e.ry = L.ry;
    if ("moving" in e) e.moving = false;
  };

  /* ===================== O ENCONTRO NO MENU PIZZA ===================== */
  const dateHere = (id) => game.date && game.date.id === id && player.zone === "vila" && Math.abs(player.x - game.date.x) + Math.abs(player.y - game.date.y) <= 2;
  function endDate(n) {
    say([[n, pk(["Gostei muito. Vamos repetir?", "Foi ótimo. Me chama de novo, tá?", "Até a próxima!", "Obrigad" + "o pelo convite. De verdade."])]]);
    game.date = null;
  }
  const lsBase = lifeSocialItems;
  lifeSocialItems = function (id) {
    const out = lsBase.apply(this, arguments);
    if (!dateHere(id)) return out;
    const n = shortName(id);
    return [
      { t: "Encontros: passear juntos pela vila", icon: "boots", fn: () => (addFriendship(id, 5), passMin(30), needAdd("fun", 10), say([["", pk(["Vocês andam devagar até o mercado. Ninguém tem pressa.", "Vocês sentam na beira da fonte e contam as estrelas que aparecem.", "Um bardo toca na esquina e vocês param para ouvir."])]])) },
      { t: "Encontros: pagar um lanche (6 ouro)", icon: "pie", fn: () => spend(6) && (addFriendship(id, 6), needAdd("food", 15), say([[n, "Você pagou? Que fofo. Da próxima é por minha conta!"]])) },
      { t: "Encontros: despedir-se", icon: "door", fn: () => endDate(n) },
      ...out,
    ];
  };
  dateMenu = function () {
    const d = game.date;
    if (!d) return;
    game.pieAnchor = { x: d.x, y: d.y };
    if (FRIENDS[d.id]) return socialMenu(d.id);
    const n = shortName(d.id);
    choice(`Encontro com ${n}`, `${n} sorri quando você chega.`, lifeSocialItems(d.id));
  };
  const caBase = characterAt;
  characterAt = function (x, y) {
    const d = game.date;
    if (d && player.zone === "vila" && d.x === x && d.y === y) return true;
    return caBase(x, y);
  };
  // Quem é da turma some do caminho enquanto espera no encontro (não aparece em dobro).
  const cvBase = crewVisible;
  crewVisible = function (a) {
    if (a && game.date && game.date.id === a.id) return false;
    return cvBase(a);
  };

  /* ===================== CONVIDAR PARA UM ENCONTRO ===================== */
  const PLACES = DATE_SPOTS;
  function partnerOf(id) {
    return player.spouse === id || player.dating === id || (player.lovers || []).includes(id) || (player.sspouses || []).includes(id);
  }
  function invitable() {
    const dead = typeof deadList === "function" ? deadList() : {};
    const ids = new Set();
    for (const id of Object.keys(player.rel || {})) if (NPCS[id] && FRIENDS[id] && !dead[id]) ids.add(id);
    for (const c of player.contacts || []) if (NPCS[c.id] && !dead[c.id]) ids.add(c.id);
    return [...ids]
      .filter((id) => partnerOf(id) || friendship(id) >= 25 || (player.contacts || []).some((c) => c.id === id))
      .sort((a, b) => partnerOf(b) - partnerOf(a) || friendship(b) - friendship(a));
  }
  function inviteMenu() {
    if (typeof closeInv === "function") closeInv();
    if (game.date) {
      const n = shortName(game.date.id);
      return choice("Encontro marcado", `${n} já está te esperando ${game.date.n}.`, [
        { t: "Desmarcar", icon: "door", fn: () => ((game.date = null), toast(`Você desmarcou com ${n}.`)) },
        { t: "Ok", fn: null },
      ]);
    }
    const h = currentHour();
    if (h < 7 || h >= 23) return say([["", "Está tarde (ou cedo) demais para chamar alguém. Tente entre 7h e 23h."]]);
    const list = invitable();
    if (!list.length) return say([["", "Você ainda não tem amigos próximos para convidar. Converse com o povo da vila e faça amizades!"]]);
    choice(
      "Convidar para um encontro",
      "Quem você quer chamar?",
      list
        .slice(0, 14)
        .map((id) => ({
          t: `${shortName(id)} · ${partnerOf(id) ? (player.spouse === id ? "cônjuge" : "romance") : REL_LV[friendshipLevel(id)][1]}`,
          icon: partnerOf(id) ? "heart" : "smile",
          fn: () => pickPlace(id),
        }))
        .concat([{ t: "Cancelar", fn: null }]),
    );
  }
  function pickPlace(id) {
    choice(
      `Onde encontrar ${shortName(id)}?`,
      "A pessoa vai até lá e te espera por umas 3 horas.",
      PLACES.map((S, i) => ({ t: cap(S.n), icon: "house", fn: () => sendInvite(id, i) })).concat([{ t: "Voltar", fn: inviteMenu }]),
    );
  }
  const cap = (s) => s[0].toUpperCase() + s.slice(1);
  function sendInvite(id, i) {
    const n = shortName(id);
    const asleep = typeof npcAsleep === "function" && npcAsleep(id);
    const chance = partnerOf(id) ? 0.95 : Math.min(0.9, 0.35 + friendship(id) / 120);
    if (asleep || Math.random() > chance) {
      addFriendship(id, 1);
      return say([["", `Você manda um bilhete para ${n}.`], [n, pk(["Hoje não vou conseguir, desculpa! Outro dia?", "Ai, tô cheio de coisa hoje. Me chama amanhã?", "Hoje não dá... mas fiquei feliz com o convite!"])]]);
    }
    const S = PLACES[i];
    const free = (p) => (walkable("vila", p[0], p[1]) ? p : (typeof freeNear === "function" && freeNear("vila", p[0], p[1], 3)) || p);
    const spot = free(S.spot);
    game.date = { id, x: spot[0], y: spot[1], until: player.day * 1440 + player.clock + 180, n: S.n, invited: true };
    addFriendship(id, 2);
    playSound(880, 0.12, "sine");
    say([["", `Você manda um bilhete para ${n}.`], [n, pk([`Claro! Te encontro ${S.n}.`, `Tô indo! ${cap(S.n)}, né?`, `Que bom que você chamou. Já tô saindo!`])]], () => toast(`${n} vai te esperar ${S.n} por 3 horas. Vá até lá!`, 4500));
  }
  window.inviteMenu = inviteMenu;

  // botão no Inventário
  const riBase = renderInv;
  renderInv = function () {
    riBase.apply(this, arguments);
    const inv = byId("inv");
    const gh = inv && inv.querySelector(".gh");
    if (!gh || byId("ivdate")) return;
    const b = document.createElement("button");
    b.id = "ivdate";
    b.innerHTML = `${iconHTML("heart", 16)}${game.date ? "Encontro marcado" : "Convidar para encontro"}`;
    b.onclick = inviteMenu;
    b.style.marginLeft = "auto";
    b.style.marginRight = ".5em";
    const close = gh.querySelector("button");
    if (close) gh.insertBefore(b, close);
    else gh.appendChild(b);
  };
})();
