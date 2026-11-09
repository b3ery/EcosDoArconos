/**
 * ECOS DO ARCANO — 57-golpe-e-protesto.js
 *  - Luca e Lucas Marzocca puxam o protesto na primeira fila, com nome em cima
 *    da cabeça, megafone e gritos próprios (o Marzoca dá em cima até da Rainha).
 *  - Botão "Golpe" (☰ no celular, tecla V no PC) abre a conspiração em qualquer
 *    modo, sem precisar achar o Luca ou o Lucas. Quem já governa abre o trono.
 */

"use strict";

const MARZOCA_PROTEST = [
  "Rainha, eu te respeito... mas o POVO vem primeiro!",
  "Majestade, esse vestido tá lindo. AGORA ABAIXA O IMPOSTO!",
  "Moça do cartaz, depois do protesto tá livre? É pela causa!",
  "MENOS COROA, MAIS TAVERNA!",
  "Eu não fujo de marido bravo, vou fugir de guarda?!",
  "Ô Pedro Max, desce aqui que eu explico a razão pra você!",
];
const LUCA_LEAD = ["REPETE COMIGO: CONSELHO JÁ!", "Luzes da razão, povo de Cinzaluz!", "Ninguém nasceu pra ser súdito!", "Escola pra todos, pão pra todos!"];

/* Os dois líderes vão para a frente, bem na cara do castelo. */
{
  const spBase = startProtest;
  startProtest = function (force) {
    const ok = spBase(force);
    const P = game.protest;
    if (!ok || !P) return ok;
    const { cx, cy } = protestPlaza();
    const front = [
      [cx - 1, cy + 2],
      [cx + 1, cy + 2],
      [cx - 2, cy + 3],
      [cx + 2, cy + 3],
      [cx, cy + 3],
    ].filter(([x, y]) => walkable("vila", x, y) && !P.actors.some((a) => !a.leader && a.x === x && a.y === y));
    for (const a of P.actors.filter((a) => a.leader)) {
      const s = front.shift();
      if (s) [a.x, a.y, a.rx, a.ry, a.hx, a.hy] = [s[0], s[1], s[0], s[1], s[0], s[1]];
      a.dir = "up";
    }
    P.leadT = 2;
    toast("📣 Luca e Lucas Marzocca puxam o protesto na frente do castelo!", 4200);
    return ok;
  };
  const tickBase = protestTick;
  protestTick = function (dt) {
    tickBase(dt);
    const P = game.protest;
    if (!P || game.mode !== "world" || game.dialog) return;
    P.leadT -= dt;
    if (P.leadT > 0) return;
    P.leadT = 3.5 + Math.random() * 3;
    const lu = P.actors.find((a) => a.id === "lucas" && !a.caught),
      lc = P.actors.find((a) => a.id === "luca" && !a.caught);
    if (lu && Math.random() < 0.6) protestShout(lu, pk(MARZOCA_PROTEST), 3);
    else if (lc) protestShout(lc, pk(LUCA_LEAD), 3);
  };
  const drawBase = drawProtester;
  drawProtester = function (a, t, i) {
    drawBase(a, t, i);
    if (!a.leader) return;
    const X = a.rx * TILE,
      Y = a.ry * TILE;
    // Megafone de latão.
    if (!a.caught) {
      ctx.fillStyle = "#c8a030";
      ctx.fillRect(X + 22, Y + 12, 6, 4);
      ctx.fillRect(X + 27, Y + 10, 3, 8);
    }
    // Nome em cima da cabeça.
    const nm = a.id === "lucas" ? "Lucas Marzocca" : a.nome;
    ctx.font = '700 9px "Pixelify Sans", sans-serif';
    ctx.textAlign = "center";
    const w = ctx.measureText(nm).width + 8;
    ctx.fillStyle = "rgba(20,10,30,.8)";
    ctx.fillRect(X + 16 - w / 2, Y - 46, w, 12);
    ctx.fillStyle = a.id === "lucas" ? "#ff9ab0" : "#a8e07a";
    ctx.fillText(nm, X + 16, Y - 37);
    ctx.textAlign = "left";
  };
}
/* Lucas e Luca não aparecem em outro lugar enquanto lideram o protesto. */
{
  const visBase = crewVisible;
  crewVisible = function (a) {
    const P = game.protest;
    if (P && a && (a.id === "lucas" || a.id === "luca") && P.actors.some((x) => x.id === a.id)) return false;
    return visBase(a);
  };
}

/* ----- Golpe sempre à mão ----- */
function coupButton() {
  if (game.mode !== "world" || game.dialog) return;
  if (rulesK("aurelia")) return royalMenu();
  if (!player.plot && !player.coupTold) {
    player.coupTold = true;
    say(
      [
        ["", "Como dar um golpe de estado:"],
        ["", "1. Chame amigos (amizade 25+) para a conspiração. Luca e Lucas Marzocca topam na hora."],
        ["", "2. Suborne guardas, compre armas com o ferreiro e espalhe boatos contra a Rainha (um por dia)."],
        ["", "3. Cuidado com a suspeita: se chegar a 100, você é pres" + genderWord("o", "a", "e") + ". Esfrie a cabeça quando ela subir."],
        ["", "4. Com 60% de apoio ou mais, volte entre 22h e 4h e escolha DAR O GOLPE AGORA."],
      ],
      plotMenu,
    );
    return;
  }
  plotMenu();
}
WORLD_SHORTCUTS.v = coupButton;
(function coupTouchButton() {
  const small = document.querySelector("#touch .small");
  if (!small) return;
  const b = document.createElement("button");
  b.textContent = "Golpe";
  b.addEventListener("click", coupButton);
  small.appendChild(b);
})();
