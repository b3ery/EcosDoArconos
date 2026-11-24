/**
 * ECOS DO ARCANO — conquistas-dos-reinos.js
 * Conquistas novas de exploração pelos 50 reinos, com recompensa em ouro:
 *  - visitar castelos (5, 20 e os 50), conhecer os 10 países de além-mar;
 *  - nadar no mar, sobreviver a um tubarão, patinar no rio congelado;
 *  - passeio de barco (e passeio romântico), comprar na Feira Medieval,
 *    brincar no parquinho, viver as 4 estações, completar 1 ano.
 * O jogo anota o que você fez em player.feitos; o painel de conquistas que
 * já existe (melhorias.js) mostra e avisa. Grava também grantTrophy(id).
 * Modifica (envolve) enterZone, update e adiciona em ACHIEVEMENTS.
 */

"use strict";

(() => {
  if (typeof ACHIEVEMENTS === "undefined") return;
  const F = () => (player.feitos = player.feitos || { castelos: [], paises: [], estacoes: [] });
  window.grantTrophy = (k) => {
    const f = F();
    if (!f[k]) f[k] = player.day || 1;
  };
  const n = (k) => (F()[k] || []).length;
  const has = (k) => !!F()[k];
  const NEW = [
    ["castelos5", "Turista real", "Visite 5 castelos diferentes.", "crown", () => n("castelos") >= 5, 100],
    ["castelos20", "Viajante dos reinos", "Visite 20 castelos.", "crown", () => n("castelos") >= 20, 400],
    ["castelos50", "Conhecedor de todos os tronos", "Visite os castelos dos 50 reinos.", "crown", () => n("castelos") >= 50, 2000],
    ["paises", "Volta ao mundo", "Pise nos 10 países (Valdária e os 9 de além-mar).", "flag", () => n("paises") >= 10, 1000],
    ["nadarmar", "Sereia de água salgada", "Nade no mar.", "fish", () => has("nadou-mar"), 30],
    ["tubarao", "Escapou por pouco", "Sobreviva a uma mordida de tubarão.", "skull", () => has("tubarao"), 150],
    ["patins", "Patinador do inverno", "Patine no rio congelado.", "sparkle", () => has("patinou"), 40],
    ["barco", "Remador do parque", "Faça um passeio de barco.", "fish", () => has("barco"), 20],
    ["barcoamor", "Passeio dos namorados", "Leve quem você ama para remar no parque.", "heart", () => has("barco-romance"), 80],
    ["feira", "Freguês da feira", "Compre algo na Feira Medieval.", "coin", () => has("feira"), 20],
    ["parquinho", "Criança por dentro", "Brinque no parquinho (ou leve as crianças).", "smile", () => has("parquinho"), 20],
    ["estacoes", "As quatro estações", "Viva a Primavera, o Verão, o Outono e o Inverno.", "sun", () => n("estacoes") >= 4, 120],
    ["umano", "Um ano em Valdária", "Complete um ano (31 dias).", "book", () => (player.day || 1) > 31, 200],
  ];
  const REWARD = {};
  for (const [id, nm, desc, icon, cond, gold] of NEW) {
    ACHIEVEMENTS.push([id, nm, desc + ` (+${gold} ouro)`, icon, cond]);
    REWARD[id] = gold;
  }
  // paga a recompensa uma vez quando a conquista aparece
  setInterval(() => {
    if (!player || !player.name || typeof player.ach !== "object") return;
    const got = player.ach || {};
    const paid = (player.achPaid = player.achPaid || {});
    for (const id in REWARD)
      if ((got[id] || (Array.isArray(got) && got.includes(id))) && !paid[id]) {
        paid[id] = 1;
        player.gold += REWARD[id];
        toast(`Recompensa da conquista: +${REWARD[id]} ouro`, 2600);
      }
  }, 1500);

  /* ----- o que o jogo anota sozinho ----- */
  const ezBase = enterZone;
  enterZone = function () {
    const r = ezBase.apply(this, arguments);
    try {
      const Z = ZONES[player.zone],
        f = F();
      if (Z && Z.town && Z.town.bld && Z.town.bld.some((b) => /^(castle|palacio|fortaleza)$/.test(b.style)) && !f.castelos.includes(player.zone)) f.castelos.push(player.zone);
      const c = player.zone.startsWith("pais-") ? player.zone.split("-")[1] : ["vila", "porto", "serra", "solmar", "rosalva"].includes(player.zone) ? "valdaria" : null;
      if (c && !f.paises.includes(c)) f.paises.push(c);
    } catch (e) {}
    return r;
  };
  const upBase = update;
  update = function (dt) {
    upBase(dt);
    if (!player || !player.name) return;
    const f = F();
    if (typeof season === "function") {
      const s = season().id;
      if (!f.estacoes.includes(s)) f.estacoes.push(s);
    }
    if (game.swim && game.swim.on && ZONES[player.zone] && ZONES[player.zone].theme === "porto" && !((window.LAKES || {})[player.zone] || []).some((R) => player.x >= R.x0 - 1 && player.x <= R.x1 + 1 && player.y >= R.y0 - 1 && player.y <= R.y1 + 1)) grantTrophy("nadou-mar");
    if (game.swim && game.swim.on && game.swim.shark && game.swim.shark.cool > 0 && player.hp > 1.5) grantTrophy("tubarao");
    if (game.skating) grantTrophy("patinou");
    if (game.boat && game.boat.on) grantTrophy("barco");
  };
  // o parquinho também conta
  if (typeof interactAt === "function") {
    const iaBase = interactAt;
    interactAt = function (x, y) {
      const k = typeof parkThingAt === "function" ? parkThingAt(player.zone, x, y) : null;
      if (k && k !== "banco") grantTrophy("parquinho");
      return iaBase.apply(this, arguments);
    };
  }
})();
