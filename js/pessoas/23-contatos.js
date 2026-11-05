/**
 * ECOS DO ARCANO — 23-contatos.js
 * Namorar e casar com QUALQUER pessoa (nos dois modos):
 *  - Moradores da rua e frequentadores da taverna: "Conhecer melhor" vira um contato fixo,
 *    com amizade, presentes, namoro e casamento, igual aos personagens principais.
 *  - Mural dos Corações (taverna e Quadro de Trabalhos): anúncios de gente procurando
 *    namoro ou casamento.
 */

"use strict";

const CONTACT_FAVS = ["flor", "doce", "mel", "livro", "perfume", "cha", "vinho", "maca", "bolo"];
const CONTACT_PERSONALITIES = ["gentil", "engracado", "aventureiro", "timido", "serio", "orgulhoso", "esperto", "sabio"];
const TOWN_LABEL = { vila: "de Cinzaluz", porto: "do Porto", serra: "da Serra" };
const CONTACT_LINES = {
  gentil: ["Que bom te ver! Seu dia foi bom?", "Trouxe um pão a mais hoje. Quer?"],
  engracado: ["Sabe o que o anão disse pro cavalo? Nada, cavalo não fala. Hahaha!", "Hoje eu tropecei na praça e fingi que era dança."],
  aventureiro: ["Um dia eu ainda atravesso o mar inteiro!", "Bora fazer algo diferente hoje?"],
  timido: ["*olha para o chão* ...Oi.", "E-eu estava pensando em você. Digo, no tempo. No clima."],
  serio: ["Trabalho primeiro, conversa depois. Mas fala.", "Gosto de gente que cumpre o que promete."],
  orgulhoso: ["Você de novo? ...Tá, pode falar.", "Meu cabelo hoje está impecável, reparou?"],
  esperto: ["Sabia que o Coletor Real erra as contas toda semana? Ninguém confere.", "Tenho uma ideia de negócio. Depois te conto."],
  sabio: ["Quem planta paciência colhe amigos.", "O tempo resolve muita coisa. O resto, a gente resolve."],
};

/** Cria (ou recria ao carregar o jogo) um contato como personagem completo. */
function defineContact(c) {
  NPCS[c.id] = {
    nome: `${c.nm}, ${TOWN_LABEL[c.zone] || "da região"}`,
    robe: c.robe,
    hat: c.hat ?? null,
    hair: c.hair,
    talk: () => [[c.nm, pickOne(CONTACT_LINES[c.ps] || CONTACT_LINES.gentil)]],
  };
  FRIENDS[c.id] = { fav: c.fav, r80: ["flor", 1] };
  PERSONALITIES[c.id] = c.ps;
  if (!ROMANCE.includes(c.id)) ROMANCE.push(c.id);
}
function restoreContacts() {
  for (const c of player.contacts || []) if (!NPCS[c.id]) defineContact(c);
}
/** Transforma alguém (morador, frequentador, anúncio) em contato. */
function registerContact(src, rel) {
  player.contacts = player.contacts || [];
  const existing = player.contacts.find((q) => q.nm === src.nm && q.zone === (src.zone || player.zone));
  if (existing) return existing.id;
  const id = "c" + Date.now().toString(36) + Math.floor(Math.random() * 99);
  const c = {
    id,
    nm: src.nm,
    zone: src.zone || (ZONES[player.zone].town ? player.zone : "vila"),
    robe: src.robe,
    hat: src.hat ?? null,
    hair: src.hair,
    ps: src.ps || pickOne(CONTACT_PERSONALITIES),
    fav: pickOne(CONTACT_FAVS),
  };
  player.contacts.push(c);
  defineContact(c);
  player.rel[id] = rel ?? 15;
  saveGame();
  return id;
}
/** Contatos andam pela vila deles como moradores comuns. */
function addContactWalkers() {
  restoreContacts();
  for (const c of player.contacts || []) {
    if (c.zone !== player.zone || player.spouse === c.id) continue;
    if (!game.walkers || !game.walkers.length) return;
    const base = game.walkers[Math.floor(Math.random() * game.walkers.length)];
    game.walkers.push({ ...base, nm: c.nm, robe: c.robe, hat: c.hat, hair: c.hair, seed: undefined, elf: false, cid: c.id });
  }
}
/** Menu da rua: quem já é contato abre o menu completo; os outros ganham "Conhecer melhor". */
function walkerContactItems(wk) {
  return [
    {
      t: "Conhecer melhor ♥ (virar contato)",
      fn: () => {
        const id = registerContact({ nm: wk.nm, robe: wk.robe, hat: wk.hat, hair: wk.hair });
        wk.cid = id;
        wk.seed = undefined;
        say([[wk.nm, pickOne(["Prazer! A gente se vê por aí, então.", "Opa! Gostei de você. Vamos conversar mais vezes.", "Hm, interessante. Pode me procurar quando quiser."])]], () => socialMenu(id));
      },
    },
  ];
}
/** Frequentadores da taverna (e de outras lojas) também podem virar contato. */
function interiorPersonMenu(pe) {
  choice(pe.nm, "Está aproveitando a noite por aqui.", [
    { t: "Conversar", fn: () => say([[pe.nm, pe.guard ? "O castelo está seguro enquanto estivermos aqui." : pickUnheard("inter", WALKER_POOL)]]) },
    {
      t: "Conhecer melhor ♥ (virar contato)",
      fn: () => {
        const id = registerContact({ nm: pe.nm, robe: pe.robe, hat: pe.hat, hair: pe.hair, zone: game.inter && game.inter.zone ? game.inter.zone : "vila" });
        say([[pe.nm, "Senta aqui! Vamos tomar uma e conversar direito."]], () => socialMenu(id));
      },
    },
    { t: "Sair", fn: null },
  ]);
}

/* ===================== MURAL DOS CORAÇÕES ===================== */

/** Anúncios do dia: sempre os mesmos durante o dia, mudam todo dia. */
function heartBoardAds() {
  const R = rng(player.day * 7919 + 13);
  const pick = (a) => a[Math.floor(R() * a.length)];
  const robes = ["#8a3a3a", "#3a6a8a", "#5a7a3a", "#8a6a2a", "#6a3a7a", "#c97a8a", "#4a4a7a"],
    hairs = ["#3a2414", "#d9a441", "#1a1a1a", "#8a3a1a", "#d9d9d9"];
  const texts = {
    namoro: ["Procuro alguém para ver o pôr do sol no farol.", "Busco companhia para os festivais. Danço mal, mas danço.", "Quero alguém que ria das minhas piadas. São poucas."],
    casamento: ["Procuro alguém sério para formar família. Tenho uma horta e muito amor.", "Viúvo(a), coração grande, procura casamento de verdade.", "Busco alguém trabalhador e honesto para casar no Templo."],
  };
  return [0, 1, 2, 3, 4].map((i) => {
    const want = R() < 0.55 ? "namoro" : "casamento";
    return {
      i,
      nm: pick(WALKER_NAMES),
      zone: pick(["vila", "vila", "porto", "serra"]),
      age: 19 + Math.floor(R() * 40),
      ps: pick(CONTACT_PERSONALITIES),
      want,
      text: pick(texts[want]),
      robe: pick(robes),
      hair: pick(hairs),
      hat: null,
    };
  });
}
function heartBoardMenu() {
  const answered = player.famDay.mural === player.day ? player.muralAnswered || [] : [];
  const ads = heartBoardAds().filter((a) => !answered.includes(a.i));
  if (!ads.length) return say([["", "O mural está vazio hoje. Volte amanhã: sempre aparecem anúncios novos."]]);
  choice(
    "Mural dos Corações",
    "Bilhetes presos com alfinete. Responda um e marque um primeiro encontro.",
    ads
      .map((a) => ({
        t: `${a.nm}, ${a.age} anos ${TOWN_LABEL[a.zone]} · procura ${a.want}: "${a.text}"`,
        icon: a.want === "casamento" ? "ring" : "heart",
        fn: () => answerAd(a),
      }))
      .concat([{ t: "Sair", fn: null }]),
  );
}
function answerAd(a) {
  if (player.famDay.mural !== player.day) {
    player.famDay.mural = player.day;
    player.muralAnswered = [];
  }
  player.muralAnswered.push(a.i);
  if (a.want === "casamento" && player.spouse && !openRelationship())
    return say([["", `Você responde, mas ${a.nm} lê sua carta e diz: "Casado(a)? Procuro alguém livre." Que vergonha!`]]);
  const id = registerContact(a, a.want === "casamento" ? 45 : 32);
  addFriendship(id, 6);
  player.clock = Math.min(1439, player.clock + 90);
  game.fade = 1;
  saveGame();
  say(
    [
      ["", `Primeiro encontro com ${a.nm} na taverna.`],
      [a.nm, a.want === "casamento" ? "Eu quero algo sério. Se você também quer, me procure de novo." : "Foi divertido! Vamos repetir?"],
      ["", `${a.nm} agora é seu contato. Ela(e) mora ${TOWN_LABEL[a.zone]}: procure pela rua para conversar, namorar e, quem sabe, casar.`],
    ],
    () => socialMenu(id),
  );
}
