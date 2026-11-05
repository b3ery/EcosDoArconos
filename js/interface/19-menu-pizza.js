/**
 * ECOS DO ARCANO — 19-menu-pizza.js
 * Menu de interação no estilo "The Sims": ao clicar num personagem (ou apertar E
 * perto dele), as opções aparecem em círculo ao redor dele, agrupadas por
 * categoria (Amigável, Romântico, Engraçado, Malvado, Família, Serviços...).
 * Por baixo continua sendo o mesmo choice() de sempre: só muda o desenho.
 */

"use strict";

/** Categorias e as palavras que levam uma opção para cada uma. */
const PIE_GROUPS = [
  { n: "Sair", icon: "door", re: /^(Sair|Fechar|Cancelar|Agora não|Só olhar)/ },
  { n: "Interações", icon: "chat", re: /^Interações/ },
  { n: "Romântico", icon: "heart", re: /Carinhos|Encontros|namor|casamento|relacionamento|Beijar|Flertar|Dançar juntos|♥/ },
  { n: "Malvado", icon: "anger", re: /Discutir|Fofoc|grosseiro|briga|Terminar|divórcio|Proibir|Insultar/ },
  { n: "Engraçado", icon: "laugh", re: /piada|cócegas|Brincar|Toca aqui/ },
  { n: "Família", icon: "house", re: /filho|Filho|ajuda nas tarefas|Ganhar um presente|Arranjar|Apoiar|refeição|Passear juntos|Treinar runas/ },
  { n: "Serviços", icon: "coin", re: /Comprar|Tratamento|Tratar|Treinar|Trabalhar|trocas|Viajar|cavalo|Pedido|Entregar|Ouvir o que|emprestado|dívida|Guarda Real/ },
  { n: "Amigável", icon: "smile", re: /Abraçar|Elogiar|Conversar|Bater papo|presente|desculpas|conselho|Cumprimentar|beber/ },
];
function pieGroupOf(text) {
  const g = PIE_GROUPS.find((q) => q.re.test(text));
  return g ? g.n : "Mais";
}

/** Há um personagem nesse tile? (para abrir o menu em volta dele) */
function characterAt(x, y) {
  const z = ZONES[player.zone];
  if (!z) return false;
  if (elfAt(x, y) || crewActorAt(x, y) || interPersonAt(x, y)) return true;
  if (z.town && familyList().some((f) => f.x === x && f.y === y)) return true;
  if (z.town && roamAt(x, y)) return true;
  if (z.town && walkerAt(x, y)) return true;
  const c = tileAt(player.zone, x, y);
  if (c === "N" && z.npcs && z.npcs[`${x},${y}`] && !npcHidden(z.npcs[`${x},${y}`])) return true;
  if (player.zone === "casa" && familyList().some((f) => f.x === x && f.y === y)) return true;
  return false;
}

/** Posição do personagem na tela (em % do quadro do jogo). */
function pieScreenPos(x, y) {
  const c = game.cam;
  if (!c) return { left: 50, top: 45 };
  const sx = ((x * TILE + 16 - c.camX) * c.Z) / viewWidth;
  const sy = ((y * TILE + 12 - c.camY) * c.Z) / 480;
  return { left: Math.max(32, Math.min(68, sx * 100)), top: Math.max(30, Math.min(70, sy * 100)) };
}

/** Desenha as opções em círculo. Retorna true se usou o menu-pizza. */
function renderPie(title, text, opts) {
  const a = game.pieAnchor;
  if (!a) return false;
  let el = byId("pie");
  if (!el) {
    el = document.createElement("div");
    el.id = "pie";
    el.className = "ui";
    byId("screen").appendChild(el);
  }
  // Muitas opções: primeiro aparecem as categorias.
  let shown = opts;
  if (opts.length > 7 && !a.group) {
    const groups = [];
    for (const o of opts) {
      const g = pieGroupOf(o.t);
      let entry = groups.find((q) => q.n === g);
      if (!entry) groups.push((entry = { n: g, items: [] }));
      entry.items.push(o);
    }
    shown = groups.map((g) =>
      g.items.length === 1
        ? g.items[0]
        : {
            t: `${g.n} (${g.items.length})`,
            icon: (PIE_GROUPS.find((q) => q.n === g.n) || { icon: "chat" }).icon,
            fn: () => {
              game.pieAnchor = { ...a, group: g.n };
              choice(title, text, [...g.items, { t: "Voltar", icon: "door", fn: () => ((game.pieAnchor = { ...a, group: null }), choice(title, text, opts)) }]);
            },
          },
    );
  }
  game.choice = shown;
  const pos = pieScreenPos(a.x, a.y);
  const n = shown.length;
  // Opções em arco dos dois lados do personagem: a metade da direita e a da esquerda.
  const right = Math.ceil(n / 2),
    left = n - right,
    gap = 2.75; // em: cresce junto com o texto, então os botões nunca se sobrepõem
  const items = shown
    .map((o, i) => {
      const onRight = i < right;
      const k = onRight ? i : n - 1 - i;
      const cnt = onRight ? right : left;
      const dy = (k - (cnt - 1) / 2) * gap;
      const maxY = Math.max(1, ((cnt - 1) / 2) * gap + gap / 2);
      const bow = 2.4 + 3 * (1 - (dy / maxY) ** 2);
      const dx = onRight ? bow : -bow;
      const ic = o.icon || choiceIcon(o.t) || PIE_GROUPS.find((q) => q.n === pieGroupOf(o.t))?.icon || "chat";
      return `<button class="pie-opt ${o.cls || ""} ${onRight ? "r" : "l"}" data-i="${i}" ${o.off ? "disabled" : ""} style="transform:translate(calc(${onRight ? "0%" : "-100%"} + ${dx.toFixed(2)}em), calc(-50% + ${dy.toFixed(2)}em));animation-delay:${i * 18}ms"><span class="pie-ic">${iconHTML(ic, 18)}</span><span>${o.t}</span></button>`;
    })
    .join("");
  const name = title.split("·")[0].trim();
  el.innerHTML = `<div class="pie-wrap" style="left:${pos.left}%;top:${pos.top}%">
      <div class="pie-ring"></div>
      <button class="pie-center" title="Fechar (Esc)">✕</button>
      ${items}
    </div>
    <div class="pie-text"><b class="pie-name">${name}</b><span class="pie-grp">${a.group || "Interagir"}</span>${text ? `<div class="pie-sub">${text}</div>` : ""}</div>`;
  el.style.display = "block";
  byId("choice").style.display = "none";
  el.querySelectorAll(".pie-opt").forEach((b) => (b.onclick = () => pickChoice(+b.dataset.i)));
  el.querySelector(".pie-center").onclick = closePie;
  el.classList.toggle("wide", n > 8);
  return true;
}
function hidePie() {
  const el = byId("pie");
  if (el) el.style.display = "none";
}
function closePie() {
  hidePie();
  game.ipAnchor = null;
  byId("choice").style.display = "none";
  game.pieAnchor = null;
  game.mode = "world";
}

/* ---- Clique do mouse no personagem ---- */
byId("cv").addEventListener("click", (e) => {
  if (game.mode !== "world" || game.dialog || !game.cam) return;
  const r = byId("cv").getBoundingClientRect();
  const lx = ((e.clientX - r.left) / r.width) * viewWidth,
    ly = ((e.clientY - r.top) / r.height) * 480;
  const wx = lx / game.cam.Z + game.cam.camX,
    wy = ly / game.cam.Z + game.cam.camY;
  // O sprite fica no tile e um pouco acima: testa o tile e o de baixo.
  for (const [x, y] of [
    [Math.floor(wx / TILE), Math.floor(wy / TILE)],
    [Math.floor(wx / TILE), Math.floor((wy + 12) / TILE)],
  ])
    if (characterAt(x, y)) {
      const dist = Math.abs(x - player.x) + Math.abs(y - player.y);
      if (dist > 7) return toast("Chegue mais perto para interagir.", 1600);
      player.dir = Math.abs(x - player.x) >= Math.abs(y - player.y) ? (x > player.x ? "right" : "left") : y > player.y ? "down" : "up";
      interactAt(x, y);
      return;
    }
});
