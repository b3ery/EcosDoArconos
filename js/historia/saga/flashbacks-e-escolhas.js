/**
 * ECOS DO ARCANO — flashbacks-e-escolhas.js
 * Lembranças jogáveis de Odelia e Vesper a cada página do diário e as escolhas
 * no meio da história (o destino do Kael e o diário com o Honda).
 * Modifica (envolve) funções de outros arquivos: enterZone, npcHidden, update.
 */

"use strict";

/* ===================== FLASHBACKS ===================== */
const FLASHBACKS = [
  { t: "A primeira faísca", lines: ["Odelia, 9 anos, acende uma vela com o dedo.", "Vesper, 7, tenta... e só sai fumaça.", "\"Calma, Vesper. A faísca vem quando a gente para de brigar com ela.\""], q: "Como o pequeno Vesper responde?", o: [["\"Me ensina de novo?\"", 1], ["\"Pra você é fácil! Você é a preferida!\"", 0]] },
  { t: "O farol", lines: ["Os dois sobem o Farol de Brisamar escondidos.", "Lá em cima, Vesper ouve um sussurro no vento: um silêncio que chama.", "Odelia não ouve nada."], q: "O que Vesper faz com o sussurro?", o: [["Conta tudo para a irmã", 1], ["Guarda segredo e volta sozinho outras noites", 0]] },
  { t: "O cajado", lines: ["Pedravale. Vesper, já moço, encomenda um cajado aos anões.", "\"Que runa vai no topo?\", pergunta a ferreira."], q: "Qual runa Vesper escolhe?", o: [["Luz, como a da irmã", 1], ["Sombra. \"Ninguém usa. Vai ser só minha.\"", 0]] },
  { t: "A briga", lines: ["Odelia se recusa a ensinar a Canção Proibida.", "\"Ela cala o mundo, Vesper. Não é magia, é fome.\"", "A porta da torre treme."], q: "E Vesper?", o: [["Pede desculpas e fica", 1], ["Bate a porta e jura que vai aprender sozinho", 0]] },
  { t: "A última noite", lines: ["Noite de lua cheia. Vesper arruma uma bolsa pequena.", "Odelia dorme no quarto ao lado.", "O Silêncio sussurra: \"Venha.\""], q: "Antes de sair...", o: [["Deixa uma carta: \"Eu volto. Prometo.\"", 1], ["Sai sem olhar para trás", 0]] },
];
function flashbackScene(F) {
  return (W, H, t) => {
    ctx.fillStyle = "#2a2014";
    ctx.fillRect(0, 0, W, H);
    const g = ctx.createRadialGradient(W / 2, H / 2, 40, W / 2, H / 2, W * 0.7);
    g.addColorStop(0, "rgba(220,190,140,.55)");
    g.addColorStop(1, "rgba(40,28,16,.95)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "rgba(90,70,40,.5)";
    ctx.fillRect(0, H * 0.62, W, H * 0.38);
    const kid = (robe, hair, x, dir) => drawSprite(wizardRects(robe, null, hair, null, dir, Math.floor(t * 3) % 2), x, H * 0.62 - 58, 3.4, dir === "left");
    kid("#d8c090", "#3a2414", W / 2 - 90, "right");
    kid("#8a7a60", "#1a1410", W / 2 + 30, "left");
    ctx.font = '600 12px "Pixelify Sans", sans-serif';
    ctx.fillStyle = "#f6e6c0";
    ctx.fillText("Odelia", W / 2 - 64, H * 0.62 + 16);
    ctx.fillText("Vesper", W / 2 + 56, H * 0.62 + 16);
    ctx.font = '700 22px "Pixelify Sans", sans-serif';
    ctx.fillStyle = "#ffe8b0";
    ctx.fillText(`Lembrança: ${F.t}`, W / 2, 50);
    ctx.font = '500 15px "Pixelify Sans", sans-serif';
    F.lines.forEach((l, i) => {
      const a = Math.min(1, Math.max(0, t - 0.6 - i * 1.4));
      ctx.fillStyle = `rgba(255,240,210,${a})`;
      ctx.fillText(l, W / 2, 96 + i * 24);
    });
    for (let i = 0; i < 30; i++) {
      ctx.fillStyle = "rgba(255,230,180,.25)";
      ctx.fillRect((i * 131 + t * 12) % W, (i * 71 + t * 8) % H, 2, 2);
    }
  };
}
function playFlashback(i) {
  const F = FLASHBACKS[i];
  if (!F) return;
  player.fb = player.fb || [];
  playCine(flashbackScene(F), 7.5, () =>
    choice(`Lembrança: ${F.t}`, F.q, F.o.map(([t, kind]) => ({ t, fn: () => ((player.fb[i] = kind), saveGame(), say([["", kind ? "A lembrança fica quente, como uma vela acesa." : "A lembrança escurece, como se o Silêncio tivesse soprado."]])) }))),
  );
}
function flashbackTick() {
  if (player.finished || game.rollDone || game.ep || game.mode !== "world") return;
  const n = (player.pages || []).length;
  const seen = player.fbSeen || 0;
  if (n > seen && game.mode === "world" && !game.dialog) {
    player.fbSeen = seen + 1;
    playFlashback(seen);
  }
}
function vesperKindness() {
  return (Array.isArray(player.fb) ? player.fb : []).filter((x) => x === 1).length;
}

/* ===================== ESCOLHAS NO MEIO ===================== */
ENEMIES.kaelSil = Object.assign({}, ENEMIES.aprendiz, { nome: "Kael Silenciado", hp: 210, atk: 15, xp: 140, cor: "#3a2a5a", boss: true });
function midChoicesTick() {
  if (game.ep || player.finished) return; // nada de escolha nova no meio do final
  if (player.zone !== "vila" || game.mode !== "world" || game.dialog) return;
  const F = player.flags;
  if (!F.kaelChoice && guardiansFreed() >= 2 && NPCS.kael && !isDead("kael")) {
    F.kaelChoice = "pendente";
    say([["Instrutor Kael", "Aprendiz... preciso te contar. Eu ouço o Silêncio. À noite ele me chama pelo nome."], ["Instrutor Kael", "Eu tenho medo do que estou virando."]], () =>
      choice("O destino do Kael", "O que você faz?", [
        { t: "Ficar do lado dele e ajudar a resistir", icon: "heart", fn: () => ((F.kaelChoice = "ajudou"), addFriendship("kael", 25), say([["Instrutor Kael", "Obrigado. Se a hora chegar, eu luto do seu lado."]])) },
        { t: "Contar tudo para a Odelia", icon: "scroll", fn: () => ((F.kaelChoice = "exilado"), vilaNews("A Arquimaga Odelia mandou o Instrutor Kael para longe de Cinzaluz."), say([["Arquimaga Odelia", "Já perdi um irmão para o Silêncio. Não vou perder outro aluno. Kael, vá para o norte."], ["", "Kael vai embora da vila. A Escola fica sem instrutor."]])) },
        { t: "Deixar ele decidir sozinho", icon: "door", fn: () => ((F.kaelChoice = "perdido"), say([["", "Na manhã seguinte, Kael sumiu. Alguém viu um vulto subindo para a Torre..."]])) },
      ]),
    );
    return;
  }
  if (!F.hondaChoice && (player.pages || []).length >= 3 && NPCS.honda) {
    F.hondaChoice = "pendente";
    say([["Professor Bruno Honda", "Esse diário... é a maior descoberta da minha vida. Me deixa ficar com ele uns dias? Eu decifro o resto."]], () =>
      choice("O diário de Vesper", "Confiar o diário ao Honda?", [
        { t: "Deixar com ele", icon: "book", fn: () => ((F.hondaChoice = "confiou"), addFriendship("honda", 20), say([["Professor Bruno Honda", "Achei uma frase escondida nas margens: 'Odelia, se você ler isso, a culpa nunca foi sua.'"], ["", "Essa frase pode mudar a luta final."]])) },
        { t: "Pegar de volta", icon: "lock", fn: () => ((F.hondaChoice = "recusou"), addFriendship("honda", -20), say([["Professor Bruno Honda", "...Entendo. É seu. Boa sorte, aprendiz."]])) },
      ]),
    );
  }
}
{
  const nhBase = npcHidden;
  npcHidden = function (id) {
    if (id === "kael" && story() && (player.flags.kaelChoice === "exilado" || (player.flags.kaelChoice === "perdido" && !player.flags.kaelSalvo))) return true;
    return nhBase(id);
  };
}

/* ===================== LIGAÇÕES ===================== */
{
  const ezBase = enterZone;
  enterZone = function () {
    const r = ezBase.apply(this, arguments);
    if (story() && player.zone === "torre" && player.flags.kaelChoice === "perdido" && !player.flags.kaelSalvo)
      setTimeout(() => game.mode === "world" && say([["Kael Silenciado", "Aprendiz... o Silêncio é tão tranquilo. Fica comigo."]], () => startBattle("kaelSil", null)), 900);
    return r;
  };
  let acc = 0;
  const updBase = update;
  update = function (dt) {
    updBase(dt);
    if (!story() || game.mode !== "world" || game.dialog || game.cine) return;
    acc += dt;
    if (acc < 0.5) return;
    acc = 0;
    flashbackTick();
    midChoicesTick();
  };
}
