/**
 * ECOS DO ARCANO — 22-vilao.js
 * Caminho do vilão (modo História): ao vencer cada Guardião você escolhe
 * libertá-lo (herói) ou possuir o poder dele à força (vilão).
 * No fim, quem seguiu o caminho do vilão pode se aliar ao Silenciador
 * ou tomar a Canção Arcana para si e conquistar o mundo.
 */

"use strict";

const GUARDIAN_TYPES = ["ent", "serpente", "grifo", "basilisco", "leviata"];

/** Depois de vencer um Guardião: libertar ou possuir? */
function guardianChoice(enemy, type) {
  if (!GUARDIAN_TYPES.includes(type)) return rewardGuardian(enemy, type);
  choice(
    `${enemy.nome} está de joelhos`,
    "A runa pulsa no peito do Guardião. Você pode libertá-lo... ou arrancar o poder dele para você.",
    [
      { t: "Libertar o Guardião (herói)", icon: "heart", fn: () => rewardGuardian(enemy, type) },
      { t: "Possuir o poder dele à força (vilão)", icon: "skull", fn: () => possessGuardian(enemy, type) },
    ],
  );
}
function possessGuardian(enemy, type) {
  player.guards.push(player.zone);
  if (enemy.rune && !player.runes.includes(enemy.rune)) player.runes.push(enemy.rune);
  player.villain = (player.villain || 0) + 1;
  player.darkPower = Math.min(0.5, (player.darkPower || 0) + 0.1);
  repAdd(-12);
  game.flash = 1;
  game.shake = 0.5;
  playSound(110, 0.5, "sawtooth");
  saveGame();
  const lines = [
    ["", `Você crava a mão no peito de ${enemy.nome} e arranca a runa à força. O Guardião vira pó escuro.`],
    ["", enemy.rune ? `Você tomou a Runa ${RUNE_OF[enemy.rune]}. Sua magia ficou mais forte (+10%)... e mais fria.` : "O poder dele agora é seu. Sua magia ficou mais forte (+10%)."],
    ["", "A vila vai saber disso. Reputação −12."],
  ];
  if (player.villain === 1) lines.push(["Arquimaga Odelia (eco)", "...Não. Não faça como ele fez. Por favor."]);
  if (player.villain === 2) lines.push(["", "Lucas, Matheus, Marcos, Andressa e Mylena ouviram o que você fez. A turma não vai mais lutar ao seu lado."]);
  if (player.runes.length === 4) lines.push(["", "Ao longe, ao sul de Cinzaluz, algo se rompe com um estalo."]);
  say(lines, saveGame);
}

/* ===================== FINAL DO VILÃO ===================== */

/** Antes da última luta: se você já foi vilão, o Silenciador oferece aliança. */
function silencerMeeting(start) {
  if (!(player.villain >= 1)) return start();
  say(
    [
      ["O Silenciador", "Eu senti você arrancando as runas dos Guardiões. Você é como eu."],
      ["O Silenciador", "Por que lutar? Junte-se a mim. Com as runas nas nossas mãos, os reinos vão se ajoelhar."],
    ],
    () =>
      choice("A oferta do Silenciador", "Seu coração bate no ritmo de uma canção sombria.", [
        { t: "Recusar e lutar (salvar o mundo)", icon: "heart", fn: start },
        { t: "Aliar-se a ele e conquistar o mundo", icon: "skull", fn: () => villainEnding("alianca") },
      ]),
  );
}
/** Depois de vencer o Silenciador: libertar Vesper ou tomar a Canção para si. */
function silencerDefeated(heroic) {
  if (!(player.villain >= 1)) return heroic();
  choice("O Silenciador caiu", "A Canção Arcana está ao alcance da sua mão. Ninguém mais pode impedir você.", [
    { t: "Ler o diário e libertar Vesper (herói)", icon: "heart", fn: heroic },
    { t: "Tomar a Canção Arcana para você (vilão)", icon: "skull", fn: () => villainEnding("trono") },
  ]);
}
const VILLAIN_FINALES = {
  alianca: [
    ["", "Você estende a mão. O Silenciador sorri pela primeira vez em trezentos anos."],
    ["O Silenciador", "Juntos, então. Que o mundo inteiro aprenda o que é silêncio."],
    ["Narrador", "Os dois descem da Torre lado a lado. Em Cinzaluz, Odelia fecha os olhos e chora em silêncio."],
    ["Narrador", "Em um ano, os três reinos se rendem. A Canção Arcana passa a tocar só para os dois."],
  ],
  trono: [
    ["", "Você pisa sobre a máscara partida e ergue as seis runas."],
    ["Vesper", "Não... Você vai fazer o mesmo que eu fiz... só que pior."],
    ["Você", "Eu não vou guardar a magia. Vou usá-la. Toda ela. Para mim."],
    ["Narrador", "A Canção Arcana dobra os joelhos dos reis. Aurélia, Marés e Pedravale juram lealdade ao novo soberano das runas."],
    ["Narrador", "Dizem que, nas noites frias, ainda se ouve uma irmã chamando o nome do irmão. Mas ninguém mais tem coragem de responder."],
  ],
};
function villainEnding(kind) {
  if (battle) endBattle();
  byId("choice").style.display = "none";
  hidePie();
  player.villainEnd = kind;
  player.finished = true;
  saveGame();
  game.flash = 1;
  playSound(98, 0.8, "sawtooth");
  say(VILLAIN_FINALES[kind], () => setTimeout(showEnd, 800));
}
