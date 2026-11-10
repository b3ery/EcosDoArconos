/**
 * ECOS DO ARCANO — polimento.js
 *  - Guia do Simulador: o tutorial agora apresenta conversar, o menu de Ações,
 *    os objetivos do dia e os perigos. Dá para rever em Ações → Rever o guia.
 *  - O painel do tutorial não fica mais por cima de menus.
 *  - Nada trava: se um erro acontecer, o jogo segue rodando; um vigia corrige
 *    telas presas (menu sumido, fala escondida, cena sem fim) e há o botão
 *    "Destravar o jogo" em Ações.
 * Modifica (envolve) funções de outros arquivos: actionsMenu, draw, objPanel, showTut, update.
 */

"use strict";

/* ===================== GUIA DO SIMULADOR ===================== */
{
  const guide = [
    { t: TOUCH ? "Chegue perto de alguém e toque em <b>A</b> para conversar." : "Chegue perto de alguém e aperte <kbd>E</kbd> para conversar.", done: () => player.obj && ((player.obj.c.talk || 0) + (player.obj.c.inter || 0) >= 1) },
    { t: TOUCH ? "Toque em <b>☰ → Ações</b>: jornal, golpe, família, testamento... está tudo lá." : "Aperte <kbd>Y</kbd> para abrir o menu de <b>Ações</b>: jornal, golpe, família, testamento...", done: () => !!game.actOpened },
    { t: "Em Ações, abra <b>Objetivos de hoje</b>: cada objetivo vale 15 de ouro.", done: () => !!game.objOpened },
  ];
  const last = TUT_LIFE.pop();
  TUT_LIFE.push(...guide, last, { t: `Cuidado com fome, sede, frio e tempestades: dá para morrer de 30 jeitos (${TOUCH ? "Ações" : "tecla <kbd>B</kbd>"} → Livro das Mortes). Boa vida!`, done: () => game.tutT > 8 });
  const amBase = actionsMenu;
  actionsMenu = function () {
    game.actOpened = true;
    hookChoice(amBase, (title, text, opts) => {
      opts.splice(opts.length - 1, 0, { t: "Rever o guia", icon: "book", fn: () => ((player.tutDone = false), (player.tutStep = 2), (game.tutT = 0), toast("O guia voltou no canto da tela.", 2400)) }, { t: "Destravar o jogo", icon: "lock", fn: () => unstick(true) });
      return [title, text, opts];
    });
  };
  const opBase = objPanel;
  objPanel = function () {
    game.objOpened = true;
    return opBase();
  };
  // O guia some quando há um menu ou uma janela aberta.
  const stBase = showTut;
  showTut = function (text, i, n) {
    stBase(text, i, n);
    const el = byId("coach");
    if (el && (game.mode === "choice" || game.mode === "cutscene" || ["jornal", "mortes", "arvore"].includes(game.mode))) el.style.display = "none";
  };
}

/* ===================== NADA TRAVA ===================== */

const OVERLAY_MODES = { jornal: "jornal", mortes: "mortes", arvore: "arvore" };
function unstick(loud) {
  for (const id of ["choice", "jornal", "mortes", "arvore"]) {
    const el = byId(id);
    if (el) el.style.display = "none";
  }
  if (typeof hidePie === "function") hidePie();
  game.pieAnchor = null;
  if (game.brawl) endBrawlScene();
  if (game.deathScene) {
    game.deathScene = null;
    game.dying = false;
  }
  game.cine = null;
  document.body.classList.remove("cutscene");
  game.dialog = null;
  byId("dialog").style.display = "none";
  if (battle && game.mode === "battle") endBattle();
  game.mode = "world";
  game.paused = false;
  if (ZONES[player.zone] && !walkable(player.zone, player.x, player.y)) {
    const s = freeNear(player.zone, player.x, player.y, 4);
    if (s) [player.x, player.y, player.rx, player.ry] = [s[0], s[1], s[0], s[1]];
  }
  if (loud) toast("Pronto! Tudo fechado, você pode andar de novo.", 2600);
}
let stuckFor = 0,
  dogAcc = 0;
function stuckWatch(dt) {
  dogAcc += dt;
  if (dogAcc < 0.5) return;
  const s = dogAcc;
  dogAcc = 0;
  const vis = (id) => {
    const el = byId(id);
    return !!el && el.style.display !== "none" && getComputedStyle(el).display !== "none";
  };
  let bad = false;
  if (game.mode === "choice" && !game.dialog && !vis("choice") && !vis("pie")) bad = "menu";
  else if (game.dialog && !vis("dialog") && game.mode !== "cutscene") bad = "fala";
  else if (game.mode === "cutscene" && !game.deathScene && !game.cine && !(game.ep && !game.ep.done)) bad = "cena";
  else if (OVERLAY_MODES[game.mode] && !vis(OVERLAY_MODES[game.mode])) bad = "janela";
  else if (game.dying && !game.deathScene && !game.dialog && game.mode === "world") bad = "morte";
  if (!bad) return (stuckFor = 0);
  stuckFor += s;
  if (stuckFor < 1.5) return;
  stuckFor = 0;
  if (bad === "fala") {
    byId("dialog").style.display = "block";
    try {
      renderDialogLine();
    } catch (e) {
      game.dialog = null;
      byId("dialog").style.display = "none";
    }
  } else if (bad === "morte") game.dying = false;
  else unstick(false);
}
/* Um erro num quadro não congela o jogo: ele é registrado e o jogo segue. */
let errShown = 0;
function guard(fn, name) {
  return function () {
    try {
      return fn.apply(this, arguments);
    } catch (e) {
      if (!errShown++) setTimeout(() => toast("Opa, algo deu errado, mas o jogo se recuperou.", 3000), 50);
      if (errShown < 5) setTimeout(() => {
        throw e;
      });
      if (name === "update") unstick(false);
    }
  };
}
{
  const updBase = update;
  update = guard(function (dt) {
    updBase(dt);
    if (["world", "choice", "cutscene", "jornal", "mortes", "arvore"].includes(game.mode)) stuckWatch(dt);
  }, "update");
  draw = guard(draw, "draw");
}
