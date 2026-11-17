/**
 * ECOS DO ARCANO — convites.js (Simulador)
 * Convites de casamento e de velório:
 *  - quando alguém de quem você é amig@ fica noiv@, chega uma carta com o
 *    convite: confirmar presença, mandar flores ou recusar. No dia, às 16h,
 *    o jogo pergunta se você quer ir (leva você até o Templo). Faltar depois
 *    de confirmar deixa os noivos chateados; ir deixa todo mundo feliz.
 *  - moradores agora também morrem de velhice (bem raramente, depois dos 72).
 *    Quando morre alguém próximo, chega o convite para o velório, no dia
 *    seguinte às 10h, no cemitério do Templo. Lá: dizer algumas palavras,
 *    deixar flores, consolar a família ou ficar em silêncio.
 * Modifica (envolve) funções de outros arquivos: update, weddingTick, onNewDay.
 */

"use strict";

const INV_FRIEND = 20;
function isCloseTo(id) {
  if (!id || !NPCS[id]) return false;
  return friendship(id) >= INV_FRIEND || player.spouse === id || (typeof CREW_ALL !== "undefined" && CREW_ALL.includes(id) && friendship(id) >= 8);
}
function goToTemple() {
  player.zone = "vila";
  const p = zoneDoorPos("vila", "Templo da Luz");
  [player.x, player.y] = [p[0], p[1] + 1];
  player.rx = player.x;
  player.ry = player.y;
  player.dir = "up";
  game.fade = 1;
  enterZone(false);
}
const letterBusy = () => game.mode !== "world" || game.dialog || game.dying || game.deathScene || (byId("choice") && byId("choice").style.display === "block");

/* ===================== CASAMENTOS ===================== */
function weddingInvites() {
  const S = player.soc;
  if (!S || !S.wed) return false;
  for (const w of S.wed) {
    if (w.done || w.inv || player.day > w.day) continue;
    if (!isCloseTo(w.a) && !isCloseTo(w.b)) {
      w.inv = "-";
      continue;
    }
    w.inv = "pend";
    const A = shortName(w.a),
      B = shortName(w.b);
    const quando = w.day === player.day ? "hoje" : w.day === player.day + 1 ? "amanhã" : `no dia ${w.day}`;
    playSound(880, 0.12, "sine");
    choice(
      "Convite de casamento",
      `<i>"${A} e ${B} têm a alegria de convidar você para o casamento, ${quando}, às 17h, no Templo da Luz. Sua presença é o nosso melhor presente!"</i>`,
      [
        { t: "Confirmar presença", icon: "heart", fn: () => ((w.inv = "sim"), saveGame(), toast(`Confirmado! Casamento de ${A} e ${B}, ${quando} às 17h. Às 16h eu te lembro.`, 4200)) },
        {
          t: "Não posso ir: mandar flores (5 ouro)",
          icon: "flower",
          fn: () => {
            w.inv = "flores";
            if (player.gold >= 5) ((player.gold -= 5), addFriendship(w.a, 3), addFriendship(w.b, 3), toast("As flores chegaram com um bilhete seu. Os noivos adoraram.", 3200));
            else toast("Sem ouro para as flores... você manda só um bilhete.", 3000);
            saveGame();
          },
        },
        { t: "Recusar o convite", icon: "meh", fn: () => ((w.inv = "nao"), addFriendship(w.a, -2), addFriendship(w.b, -2), saveGame()) },
      ],
    );
    return true;
  }
  return false;
}
function weddingReminder() {
  const S = player.soc;
  if (!S || !S.wed) return false;
  for (const w of S.wed) {
    if (w.done || w.inv !== "sim" || w.called || player.day !== w.day || player.clock < 16 * 60) continue;
    w.called = true;
    const A = shortName(w.a),
      B = shortName(w.b);
    if (player.zone === "vila") {
      toast(`O casamento de ${A} e ${B} começa às 17h no Templo da Luz!`, 4200);
      return false;
    }
    choice("O casamento já vai começar!", `${A} e ${B} se casam às 17h no Templo da Luz. Quer ir agora?`, [
      { t: "Ir ao casamento", icon: "heart", fn: () => (goToTemple(), toast("Você chega ao Templo bem a tempo. Os sinos já estão tocando!", 3200)) },
      { t: "Não vou conseguir ir", icon: "meh", fn: () => ((w.inv = "faltou"), addFriendship(w.a, -6), addFriendship(w.b, -6), toast(`${A} e ${B} vão notar a sua falta...`, 3000)) },
    ]);
    return true;
  }
  return false;
}
{
  const wtBase = weddingTick;
  weddingTick = function () {
    const S = player.soc;
    const before = S && S.wed ? S.wed.filter((w) => !w.done) : [];
    const r = wtBase.apply(this, arguments);
    for (const w of before) {
      if (!w.done) continue;
      if (w.inv === "sim" && player.zone === "vila") (addFriendship(w.a, 5), addFriendship(w.b, 5), typeof addNeed === "function" && addNeed("fun", 15));
      else if (w.inv === "sim") ((w.inv = "faltou"), addFriendship(w.a, -6), addFriendship(w.b, -6), setTimeout(() => toast(`Você confirmou e não foi ao casamento de ${shortName(w.a)} e ${shortName(w.b)}. Eles ficaram chateados.`, 4200), 1500));
    }
    return r;
  };
}

/* ===================== VELÓRIOS ===================== */
function funerals() {
  return (player.funerals = player.funerals || { seen: {}, list: [] });
}
/** Moradores velhos às vezes morrem de velhice (só no Simulador). */
function naturalDeaths() {
  if (!lifeMode() || typeof deadList !== "function") return;
  for (const id of Object.keys(NPCS)) {
    if (!named(id) || id === player.spouse || NPCS[id].kid) continue;
    if (typeof CREW !== "undefined" && CREW.includes(id)) continue;
    if (["rainha", "kael", "odelia"].includes(id)) continue;
    const age = npcAge(id);
    if (age < 72) continue;
    if (Math.random() < 0.012 + (age - 72) * 0.004) {
      deadList()[id] = { day: player.day, how: "velhice", found: true, natural: true };
      if (typeof purgeDead === "function") purgeDead();
      vilaNews(`Luto: ${shortName(id)} morreu de velhice, aos ${age} anos. O velório é amanhã às 10h, no Templo da Luz.`);
      return;
    }
  }
}
function funeralInvites() {
  if (typeof deadList !== "function") return false;
  const F = funerals();
  for (const [id, d] of Object.entries(deadList())) {
    if (F.seen[id]) continue;
    F.seen[id] = 1;
    if (!NPCS[id]) continue;
    const sp = typeof npcSpouse === "function" ? npcSpouse(id) : null;
    const close = isCloseTo(id) || (sp && isCloseTo(sp)) || d.natural;
    if (!close) continue;
    const f = { id, day: player.day + 1, inv: "pend", how: d.how, mine: !d.natural, sp: sp && named(sp) ? sp : null };
    F.list.push(f);
    const nome = shortName(id);
    playSound(220, 0.5, "sine");
    choice(
      "Convite para o velório",
      `<i>"Com pesar, ${f.sp ? `${shortName(f.sp)} e a família de ${nome} convidam` : `a família de ${nome} convida`} você para o velório, amanhã às 10h, no cemitério do Templo da Luz."</i>${f.mine ? "<br><small>O assassino ainda não foi encontrado...</small>" : ""}`,
      [
        { t: "Eu vou", icon: "heart", fn: () => ((f.inv = "sim"), saveGame(), toast(`Velório de ${nome}: amanhã às 10h. Eu te lembro às 9h.`, 3600)) },
        { t: "Mandar flores (5 ouro)", icon: "flower", fn: () => ((f.inv = "flores"), player.gold >= 5 && ((player.gold -= 5), f.sp && addFriendship(f.sp, 4)), toast("Uma coroa de flores com o seu nome vai estar lá.", 3000), saveGame()) },
        { t: "Não vou", icon: "meh", fn: () => ((f.inv = "nao"), saveGame()) },
      ],
    );
    return true;
  }
  return false;
}
function funeralReminder() {
  const F = funerals();
  for (const f of F.list) {
    if (f.done || f.inv !== "sim" || player.day < f.day || (player.day === f.day && player.clock < 9 * 60)) continue;
    f.done = true;
    if (player.day > f.day) {
      if (f.sp) addFriendship(f.sp, -5);
      toast(`Você perdeu o velório de ${shortName(f.id)}.`, 3000);
      continue;
    }
    choice("O velório vai começar", `Hoje às 10h, o último adeus a ${shortName(f.id)}, no cemitério do Templo da Luz.`, [
      { t: "Ir ao velório", icon: "heart", fn: () => funeralScene(f) },
      { t: "Não vou conseguir", icon: "meh", fn: () => (f.sp && addFriendship(f.sp, -5), toast("Você fica em casa, pensando em quem se foi.", 2600)) },
    ]);
    return true;
  }
  F.list = F.list.filter((f) => !f.done || player.day - f.day < 3);
  return false;
}
const FUN_EPI = ["Fez a vila mais alegre.", "Sempre tinha um bom conselho.", "Partiu cedo demais... ou na hora certa.", "Deixa saudade em cada esquina.", "Que as runas guiem o seu caminho."];
function funeralScene(f) {
  goToTemple();
  player.clock = Math.max(player.clock, 10 * 60);
  const n = NPCS[f.id];
  const mourn = [];
  if (f.sp && NPCS[f.sp]) mourn.push({ npc: NPCS[f.sp], n: shortName(f.sp) });
  mourn.push({ npc: { robe: "#2a2230", hat: null, hair: "#cfc6b8" }, n: "Padre Anselmo" });
  for (const id of bestFriends(6)) if (mourn.length < 5 && id !== f.id && id !== f.sp && named(id)) mourn.push({ npc: NPCS[id], n: shortName(id) });
  mourn.push({ hero: player.look, n: player.name });
  game.dialog = null;
  byId("dialog").style.display = "none";
  byId("choice").style.display = "none";
  game.deathScene = {
    id: "velhice",
    D: DEATHS.velhice,
    t0: game.t - 6.5,
    name: shortName(f.id),
    age: npcAge(f.id),
    born: "",
    look: player.look,
    title: `Velório de ${shortName(f.id)}`,
    stoneT: f.how === "velhice" ? "Morreu de velhice" : "Partiu cedo demais",
    sub: f.how === "velhice" ? "Morreu de velhice, em paz" : "Partiu cedo demais",
    epi: pk(FUN_EPI),
    mourn,
    novo: false,
    count: 0,
    next: () => funeralTalk(f),
  };
  game.mode = "cutscene";
  document.body.classList.add("cutscene");
  playSound(110, 1.2, "sine");
}
function funeralTalk(f) {
  const nome = shortName(f.id),
    sp = f.sp ? shortName(f.sp) : null;
  const lines = [["Padre Anselmo", `Estamos aqui para dizer adeus a ${nome}. ${pk(["Uma vida cheia de histórias.", "Que descanse em paz.", "Cinzaluz fica mais vazia hoje."])}`]];
  if (sp) lines.push([sp, pk([`Obrigad${gw(f.sp, "o", "a")} por virem. ${nome} ia ficar feliz de ver tanta gente.`, `Eu ainda espero ouvir a voz de ${nome} chamando da porta...`])]);
  if (f.mine) lines.push(["", "Você sente um frio na espinha. Ninguém aqui sabe o que você sabe."]);
  say(lines, () =>
    choice(`Velório de ${nome}`, "O que você faz?", [
      { t: "Dizer algumas palavras", icon: "chat", fn: () => (typeof repAdd === "function" && repAdd(2), f.sp && addFriendship(f.sp, 6), say([["Você", pk([`${nome} foi uma das pessoas mais gentis que eu conheci.`, `Vou lembrar de ${nome} toda vez que passar pela praça.`])], ["", "Algumas pessoas choram baixinho. Sua fala tocou todo mundo."]])) },
      { t: itemCount("flor") ? "Deixar uma flor no túmulo" : "Deixar flores no túmulo (3 ouro)", icon: "flower", fn: () => (itemCount("flor") ? removeItem("flor") : (player.gold = Math.max(0, player.gold - 3)), f.sp && addFriendship(f.sp, 4), say([["", "Você deixa as flores com cuidado. Uma brisa leve passa pelo cemitério."]])) },
      ...(sp ? [{ t: `Consolar ${sp}`, icon: "heart", fn: () => (addFriendship(f.sp, 9), say([[sp, "Obrigad" + gw(f.sp, "o", "a") + ". De verdade. Eu precisava de um abraço."]])) }] : []),
      { t: "Ficar em silêncio", icon: "eye", fn: () => (typeof addNeed === "function" && addNeed("fun", -10), toast("Você fica em silêncio até o fim.", 2400)) },
    ]),
  );
}

/* ===================== LIGAÇÕES ===================== */
{
  const dayBase = onNewDay;
  onNewDay = function () {
    const r = dayBase.apply(this, arguments);
    if (lifeMode()) naturalDeaths();
    return r;
  };
}
{
  const upBase = update;
  let acc = 0;
  update = function (dt) {
    const r = upBase.apply(this, arguments);
    acc += dt || 0;
    if (acc < 1) return r;
    acc = 0;
    if (!player || !lifeMode() || letterBusy()) return r;
    try {
      weddingInvites() || funeralInvites() || weddingReminder() || funeralReminder();
    } catch (e) {
      console.error(e);
    }
    return r;
  };
}
