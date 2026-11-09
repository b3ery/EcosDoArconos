/* 14-pizza-catalogo-e-lojas.js: junta 19-menu-pizza.js, 30-catalogo-itens.js, 24-lojas.js. */
/**
 * ECOS DO ARCANO — 14-pizza-catalogo-e-lojas.js
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

/* ======================================================================
   (antes: 30-catalogo-itens.js)
   ====================================================================== */

/**
 * ECOS DO ARCANO — 14-pizza-catalogo-e-lojas.js
 * 500 itens novos, cada um com o seu ícone em pixel art (ver 02-estado-som-e-sprites.js):
 * frutas, legumes, pães e doces, carnes, peixes, pratos, bebidas, poções, ervas,
 * minérios e gemas, madeira e tecidos, partes de monstros, cajados, roupas e
 * armaduras, joias, presentes, ferramentas, móveis e curiosidades.
 * Todos vão para as lojas certas das três vilas. Os itens antigos também ganham
 * ícones próprios (cada cajado, comida e poção fica diferente).
 */


const CATALOG = [];
const slugItem = (n) =>
  "i_" +
  n
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");

/** Adiciona um grupo de itens: [nome, forma, cor, variante, extras] */
function addGroup(cat, shops, base, rows) {
  rows.forEach((r, i) => {
    const [nome, shape, color, v = i % 3, extra = {}] = r;
    const id = slugItem(nome);
    if (ITEMS[id]) return;
    const it = Object.assign({ nome, cat }, typeof base === "function" ? base(r, i) : base, extra);
    it.gicon = gIcon(shape, color, extra.acc || base.acc || "#f2c14e", v);
    if (!it.desc) it.desc = autoDesc(it);
    ITEMS[id] = it;
    CATALOG.push(id);
    for (const s of shops) if (SHOPS[s] && !SHOPS[s].items.includes(id)) SHOPS[s].items.push(id);
  });
}
function autoDesc(it) {
  const parts = [];
  if (it.food) parts.push(`Fome +${it.food}`);
  if (it.water) parts.push(`Sede +${it.water}`);
  if (it.hp) parts.push(it.tipo === "equip" ? `+${it.hp} de vida máxima` : `Vida +${it.hp}`);
  if (it.mp) parts.push(it.tipo === "equip" ? `+${it.mp} de magia máxima` : `Magia +${it.mp}`);
  if (it.pow) parts.push(`+${Math.round(it.pow * 100)}% de dano`);
  if (it.def) parts.push(`−${Math.round(it.def * 100)}% de dano recebido`);
  if (it.stam) parts.push(`Fôlego +${it.stam}`);
  if (it.energy) parts.push(`Energia +${it.energy}`);
  if (it.hyg) parts.push(`Higiene +${it.hyg}`);
  if (it.fun) parts.push(`Diversão +${it.fun}`);
  if (it.warm) parts.push("Aquece e seca o corpo");
  if (it.bless) parts.push("Bênção por um dia (+10% de dano)");
  if (it.sickCure) parts.push("Cura doenças");
  if (it.cure) parts.push("Cura ferimentos");
  const kind = { mat: "Material: venda ou troque.", gift: "Ótimo presente.", movel: "Móvel: decore sua casa (R).", tool: "Ferramenta." }[it.tipo] || "";
  return (parts.length ? parts.join(", ") + ". " : "") + kind;
}
const food = (f, w = 0, p) => (r, i) => ({ tipo: "food", food: f + (i % 4) * 3, water: w, preco: p + (i % 5) });

/* ===================== COMIDA ===================== */

addGroup("Frutas", ["rosa", "frutasP"], food(12, 4, 3), [
  ["Maçã Verde", "apple", "#7ac43a"],
  ["Maçã Vermelha", "apple", "#d9303a"],
  ["Pera Doce", "pear", "#c9c43a"],
  ["Pêssego", "apple", "#f2a070", 1],
  ["Ameixa", "apple", "#7a3a8a"],
  ["Cereja", "berries", "#c9203a", 1],
  ["Morango", "berries", "#e0303a", 0],
  ["Amora Silvestre", "berries", "#3a1a4a", 2],
  ["Framboesa", "berries", "#d93a6a", 0],
  ["Mirtilo", "berries", "#3a4ab0", 1],
  ["Uva Roxa", "grapes", "#6a2a8a"],
  ["Uva Verde", "grapes", "#9ad04a"],
  ["Laranja", "citrus", "#f28a2a"],
  ["Limão", "citrus", "#e0e040"],
  ["Tangerina", "citrus", "#f2a030"],
  ["Figo", "pear", "#6a3a5a"],
  ["Melancia", "melon", "#e0404a"],
  ["Melão", "melon", "#f2b070"],
  ["Romã", "apple", "#b02a3a", 1],
  ["Marmelo", "pear", "#d9b84a"],
  ["Damasco", "apple", "#f2a050", 1],
  ["Caqui", "apple", "#e8702a"],
  ["Goiaba", "pear", "#e8a0a0"],
  ["Groselha", "berries", "#e83a3a", 2],
  ["Pitanga", "berries", "#f04a2a", 1],
  ["Jabuticaba", "berries", "#2a1a2a", 0],
]);
addGroup("Legumes", ["rosa", "armazem"], food(10, 0, 2), [
  ["Cenoura", "carrot", "#f28a2a"],
  ["Nabo", "root", "#e8e0f0"],
  ["Beterraba", "root", "#8a1a4a"],
  ["Rabanete", "root", "#d9306a"],
  ["Batata", "root", "#b88a5a"],
  ["Cebola", "root", "#c9a060"],
  ["Alho", "egg", "#f2eee4"],
  ["Abóbora", "pumpkin", "#e8802a"],
  ["Moranga", "pumpkin", "#c9503a"],
  ["Espiga de Milho", "corn", "#f2c14e"],
  ["Repolho", "cabbage", "#7ac45a"],
  ["Alface", "cabbage", "#9ad06a"],
  ["Couve", "cabbage", "#3a8a3a"],
  ["Ervilhas", "berries", "#6ab03a", 0],
  ["Favas", "berries", "#8ab05a", 1],
  ["Pepino", "corn", "#4a8a3a"],
]);
addGroup("Pães e doces", ["padaria", "padPorto", "padSerra", "doceria"], (r, i) => ({ tipo: "food", food: 18 + (i % 6) * 5, preco: 6 + (i % 6) * 3, fun: i % 3 === 0 ? 4 : 0 }), [
  ["Pão de Centeio", "bread", "#8a5a3a", 0],
  ["Broa de Milho", "bread", "#e0b050", 2],
  ["Baguete", "bread", "#d9a050", 1],
  ["Pão Doce", "bread", "#e8b070", 2],
  ["Brioche", "bread", "#f2c070", 2],
  ["Pão Preto", "bread", "#5a3a2a", 0],
  ["Rosca Trançada", "pretzel", "#c98a3a"],
  ["Pão de Queijo", "bread", "#f2d080", 2],
  ["Pão de Mel", "cookie", "#8a5a2a"],
  ["Biscoito de Nata", "cookie", "#f2e0b0"],
  ["Biscoito de Gengibre", "cookie", "#b8783a"],
  ["Rosquinha", "donut", "#f2a0c0"],
  ["Sonho", "donut", "#f2d080"],
  ["Torta de Maçã", "pie", "#d9603a"],
  ["Torta de Amora", "pie", "#5a2a6a"],
  ["Torta de Abóbora", "pie", "#e8902a"],
  ["Torta de Carne", "pie", "#8a4a2a"],
  ["Bolo de Chocolate", "cake", "#5a3a2a", 0],
  ["Bolo de Morango", "cake", "#f28aa8", 1],
  ["Bolo de Fubá", "cake", "#f2d070", 0],
  ["Bolo de Laranja", "cake", "#f2a040", 0],
  ["Bolo de Festa", "cake", "#c94a8b", 1],
  ["Pudim de Leite", "pudding", "#e8b860"],
  ["Manjar Branco", "pudding", "#f2eee4"],
  ["Doce de Leite", "honey", "#c98a4a"],
  ["Geleia de Morango", "honey", "#d9304a"],
  ["Geleia de Uva", "honey", "#6a2a8a"],
  ["Mel Silvestre", "honey", "#e8a020"],
  ["Cocada Branca", "cookie", "#f2eee4"],
  ["Quindim", "pudding", "#f2c020"],
]);
addGroup("Carnes e ovos", ["acougue"], (r, i) => ({ tipo: "food", food: 25 + (i % 5) * 6, preco: 8 + (i % 5) * 3 }), [
  ["Coxa de Frango", "meat", "#d9905a", 0],
  ["Bife", "meat", "#b83a3a", 1],
  ["Costela", "meat", "#9a3a2a", 1],
  ["Linguiça Defumada", "meat", "#a84a3a", 2],
  ["Salsicha", "meat", "#d97a6a", 2],
  ["Presunto", "meat", "#e8889a", 1],
  ["Pernil", "meat", "#b8604a", 0],
  ["Carne Seca", "meat", "#7a3a2a", 1],
  ["Toucinho", "meat", "#f2c0b0", 1],
  ["Almôndegas", "berries", "#8a4a2a", 0],
  ["Ovo de Galinha", "egg", "#f2e8d8"],
  ["Ovo de Pata", "egg", "#dfe8f0"],
  ["Ovo Caipira", "egg", "#e8c890"],
  ["Ovos de Codorna", "berries", "#e8dcc0", 1],
]);
addGroup("Peixes e frutos do mar", ["peixaria", "peixRio", "peixPorto", "peixeG"], (r, i) => ({ tipo: "food", food: 22 + (i % 5) * 5, preco: 7 + (i % 5) * 3 }), [
  ["Truta", "fish", "#8ab0c9", 0],
  ["Salmão", "fish", "#f28a6a", 0],
  ["Sardinha", "fish", "#9ab0c0", 1],
  ["Bacalhau", "fish", "#c9c0a8", 0],
  ["Robalo", "fish", "#7a9ab0", 1],
  ["Tilápia", "fish", "#a8a8b8", 0],
  ["Enguia", "fish", "#4a5a3a", 0],
  ["Peixe-Espada", "fish", "#c9d0e0", 1],
  ["Atum", "fish", "#3a4a8a", 0],
  ["Lula", "squid", "#f2b0b0"],
  ["Polvo", "squid", "#c9506a"],
  ["Ostra", "shell", "#a8a090"],
  ["Mexilhão", "shell", "#3a3a5a"],
  ["Camarão", "claw", "#f28a6a"],
]);
addGroup("Pratos quentes", ["taverna", "tavPorto"], (r, i) => ({ tipo: "food", food: 40 + (i % 4) * 8, water: 10, preco: 14 + (i % 4) * 5 }), [
  ["Sopa de Abóbora", "soup", "#e8902a"],
  ["Caldo de Feijão", "soup", "#6a3a2a"],
  ["Sopa de Legumes", "soup", "#7ab04a"],
  ["Caldo de Peixe", "soup", "#e8d8a0"],
  ["Ensopado de Cordeiro", "soup", "#9a5a3a"],
  ["Guisado do Caçador", "soup", "#7a3a2a"],
  ["Mingau de Aveia", "soup", "#e8dcc0"],
  ["Sopa de Cebola", "soup", "#d9b070"],
  ["Creme de Cogumelos", "soup", "#c9b8a0"],
  ["Canja de Galinha", "soup", "#f2e0a0"],
  ["Feijoada do Gus", "soup", "#3a2a2a"],
  ["Omelete", "egg", "#f2d050"],
  ["Torta de Frango", "pie", "#e8b060"],
  ["Pastelão de Carne", "pie", "#b8783a"],
]);
addGroup("Bebidas", ["taverna", "tavPorto", "chas", "chaSerra"], (r, i) => ({ tipo: "food", food: 0, water: 30 + (i % 4) * 10, preco: 4 + (i % 5) * 3, fun: /Vinho|Cerveja|Hidromel|Licor|Cidra|Ponche/.test(r[0]) ? 8 : 0 }), [
  ["Suco de Laranja", "glass", "#f28a2a"],
  ["Suco de Uva", "glass", "#6a2a8a"],
  ["Suco de Maçã", "glass", "#e8d070"],
  ["Limonada", "glass", "#f2f080"],
  ["Copo de Leite", "glass", "#f6f2ec"],
  ["Leite com Mel", "glass", "#f2e0a0"],
  ["Chá de Camomila", "cup", "#f2e070"],
  ["Chá de Hortelã", "cup", "#7ad06a"],
  ["Chá de Erva-Doce", "cup", "#c9e090"],
  ["Chá de Hibisco", "cup", "#c9304a"],
  ["Chá Preto", "cup", "#5a3a2a"],
  ["Chocolate Quente", "cup", "#6a3a2a"],
  ["Café do Oriente", "cup", "#3a2414"],
  ["Cidra de Maçã", "bottle", "#e8c040", 0],
  ["Vinho Tinto", "bottle", "#7a1a3a", 0],
  ["Vinho Branco", "bottle", "#e8e0a0", 1],
  ["Vinho de Ameixa", "bottle", "#5a2a5a", 0],
  ["Cerveja Escura", "mug", "#3a2414", 1],
  ["Cerveja Clara", "mug", "#e8b030", 1],
  ["Hidromel de Flores", "mug", "#f2c060", 0],
  ["Licor de Amora", "bottle", "#3a1a4a", 1],
  ["Água de Fonte", "glass", "#9fd0f0"],
  ["Água com Gás", "glass", "#c9e8f8"],
  ["Caldo de Cana", "glass", "#c9d070"],
  ["Kefir", "glass", "#f2eee4"],
  ["Ponche de Frutas", "bottle", "#e0603a", 1],
]);

/* ===================== POÇÕES ===================== */

const potion = (p) => Object.assign({ tipo: "cons" }, p);
addGroup("Poções", ["bruno", "boticario"], {}, [
  ["Poção de Vida Pequena", "potion", "#e0306a", 2, potion({ hp: 25, preco: 10 })],
  ["Poção de Vida Média", "potion", "#e0306a", 0, potion({ hp: 50, preco: 22 })],
  ["Poção de Vida Grande", "potion", "#c01a4a", 1, potion({ hp: 90, preco: 45 })],
  ["Poção de Vida Suprema", "potion", "#ff1a5a", 3, potion({ hp: 150, preco: 90, req: 2 })],
  ["Poção de Mana Pequena", "potion", "#3a78d9", 2, potion({ mp: 15, preco: 12 })],
  ["Poção de Mana Média", "potion", "#3a78d9", 0, potion({ mp: 30, preco: 26 })],
  ["Poção de Mana Grande", "potion", "#2a4ab0", 1, potion({ mp: 55, preco: 50 })],
  ["Poção de Mana Suprema", "potion", "#5a2ad9", 3, potion({ mp: 90, preco: 95, req: 2 })],
  ["Poção Dupla", "potion", "#9a3ac9", 0, potion({ hp: 40, mp: 20, preco: 40 })],
  ["Poção Dupla Grande", "potion", "#7a2ab0", 1, potion({ hp: 80, mp: 40, preco: 80 })],
  ["Néctar das Fadas", "potion", "#f2a0e0", 3, potion({ hp: 120, mp: 60, preco: 160, req: 3 })],
  ["Elixir de Fôlego", "potion", "#f2c14e", 2, potion({ stam: 25, preco: 20 })],
  ["Elixir de Fôlego Forte", "potion", "#e8a020", 0, potion({ stam: 50, preco: 45 })],
  ["Elixir do Descanso", "potion", "#c98a2a", 1, potion({ stam: 100, preco: 110 })],
  ["Poção de Energia", "potion", "#7ad36b", 2, potion({ energy: 30, preco: 15 })],
  ["Poção de Energia Forte", "potion", "#3ab04a", 0, potion({ energy: 60, preco: 32 })],
  ["Sais de Banho", "potion", "#9fd0f0", 3, potion({ hyg: 40, preco: 12 })],
  ["Espuma Perfumada", "potion", "#c9e8f8", 1, potion({ hyg: 80, preco: 25 })],
  ["Poção da Alegria", "potion", "#ff8ad0", 0, potion({ fun: 35, preco: 18 })],
  ["Poção da Gargalhada", "potion", "#ffb0e0", 2, potion({ fun: 70, preco: 36 })],
  ["Tônico de Força", "potion", "#d9603a", 1, potion({ bless: 1, preco: 60 })],
  ["Poção de Calor", "potion", "#f28a2a", 0, potion({ warm: 1, preco: 15 })],
  ["Poção Refrescante", "potion", "#5ad0e0", 2, potion({ water: 50, preco: 10 })],
  ["Xarope de Mel", "potion", "#e8a020", 3, potion({ hp: 30, food: 10, sickCure: 1, preco: 28 })],
  ["Antídoto", "potion", "#5aa83a", 1, potion({ sickCure: 1, preco: 24 })],
  ["Bálsamo Curativo", "potion", "#f2eee4", 3, potion({ cure: 1, hp: 20, preco: 35 })],
  ["Unguento de Ervas", "potion", "#7a9a3a", 3, potion({ cure: 1, preco: 22 })],
  ["Água Benta do Templo", "potion", "#dfe8ff", 2, potion({ hp: 40, mp: 20, preco: 38 })],
  ["Elixir Arcano", "potion", "#8a4ad9", 1, potion({ mp: 120, preco: 140, req: 3 })],
  ["Lágrima de Fênix", "potion", "#ff6a2a", 3, potion({ hp: 200, preco: 220, req: 4 })],
]);

/* ===================== MATERIAIS ===================== */

const mat = (p) => (r, i) => ({ tipo: "mat", preco: p + (i % 6) * 2 });
addGroup("Ervas", ["ervanaria", "ervasS", "boticario"], mat(4), [
  ["Sálvia", "herb", "#7a9a6a"],
  ["Alecrim", "herb", "#4a7a4a"],
  ["Lavanda", "flower", "#9a7ad9"],
  ["Arruda", "herb", "#5a8a3a"],
  ["Hortelã", "herb", "#5ad06a"],
  ["Manjericão", "herb", "#3a9a3a"],
  ["Tomilho", "herb", "#6a8a4a"],
  ["Camomila", "flower", "#f2eee4", 1],
  ["Mandrágora", "root", "#a88a5a"],
  ["Babosa", "herb", "#7ac48a"],
  ["Urtiga", "herb", "#3a6a2a"],
  ["Losna", "herb", "#9ab0a0"],
  ["Valeriana", "flower", "#f2c0d0"],
  ["Erva-Cidreira", "herb", "#9ad06a"],
  ["Cogumelo Azul", "mushroom", "#3a78d9"],
  ["Cogumelo Dourado", "mushroom", "#f2c14e"],
  ["Cogumelo Venenoso", "mushroom", "#c92a3a"],
  ["Raiz de Ginseng", "root", "#d9b080"],
  ["Musgo Lunar", "herb", "#8ab0e0", 1],
  ["Trevo de Quatro Folhas", "herb", "#3ab04a", 0],
]);
addGroup("Minérios e gemas", ["minerios", "cristais", "forjaAna", "armazem"], {}, [
  ["Minério de Cobre", "ore", "#c97a3a", 0, { tipo: "mat", preco: 6 }],
  ["Minério de Estanho", "ore", "#a8b0b8", 0, { tipo: "mat", preco: 6 }],
  ["Minério de Prata", "ore", "#dfe8f0", 0, { tipo: "mat", preco: 14 }],
  ["Minério de Ouro", "ore", "#f2c14e", 0, { tipo: "mat", preco: 24 }],
  ["Minério de Mitril", "ore", "#8ae0f0", 0, { tipo: "mat", preco: 60 }],
  ["Carvão", "ore", "#2a2a2a", 0, { tipo: "mat", preco: 3 }],
  ["Enxofre", "ore", "#e8e040", 0, { tipo: "mat", preco: 5 }],
  ["Salitre", "ore", "#f2eee4", 0, { tipo: "mat", preco: 5 }],
  ["Lingote de Cobre", "ingot", "#c97a3a", 0, { tipo: "mat", preco: 16 }],
  ["Lingote de Bronze", "ingot", "#b8863a", 0, { tipo: "mat", preco: 22 }],
  ["Lingote de Ferro", "ingot", "#8a8a96", 0, { tipo: "mat", preco: 20 }],
  ["Lingote de Prata", "ingot", "#dfe8f0", 0, { tipo: "mat", preco: 40 }],
  ["Lingote de Ouro", "ingot", "#f2c14e", 0, { tipo: "mat", preco: 70 }],
  ["Lingote de Mitril", "ingot", "#8ae0f0", 0, { tipo: "mat", preco: 150 }],
  ["Lingote de Aço", "ingot", "#a8b0c8", 0, { tipo: "mat", preco: 32 }],
  ["Rubi", "gem", "#e0303a", 0, { tipo: "mat", preco: 60 }],
  ["Safira", "gem", "#3a5ad9", 1, { tipo: "mat", preco: 60 }],
  ["Esmeralda", "gem", "#3ab05a", 2, { tipo: "mat", preco: 60 }],
  ["Topázio", "gem", "#f2a020", 0, { tipo: "mat", preco: 45 }],
  ["Ametista", "gem", "#9a4ad9", 2, { tipo: "mat", preco: 40 }],
  ["Opala", "gem", "#c9e8f0", 1, { tipo: "mat", preco: 70 }],
  ["Ônix", "gem", "#2a2a3a", 0, { tipo: "mat", preco: 50 }],
  ["Jade", "gem", "#5ab08a", 1, { tipo: "mat", preco: 55 }],
  ["Granada", "gem", "#8a1a2a", 2, { tipo: "mat", preco: 35 }],
  ["Turmalina", "gem", "#e05a9a", 0, { tipo: "mat", preco: 50 }],
  ["Diamante", "gem", "#eaf6ff", 1, { tipo: "mat", preco: 180 }],
  ["Pérola Negra", "orb", "#3a3040", 0, { tipo: "mat", preco: 90 }],
  ["Âmbar", "gem", "#e8902a", 2, { tipo: "mat", preco: 30 }],
  ["Água-Marinha", "gem", "#5ad0e0", 1, { tipo: "mat", preco: 55 }],
  ["Quartzo Rosa", "gem", "#f2a0c0", 2, { tipo: "mat", preco: 25 }],
]);
addGroup("Madeira, tecido e couro", ["armazem", "tecidos", "peles", "moveis"], mat(5), [
  ["Tora de Carvalho", "log", "#8a5a2e"],
  ["Tora de Pinho", "log", "#a87a4a"],
  ["Tora de Bétula", "log", "#d9cfb8"],
  ["Tora de Ébano", "log", "#2a1a14"],
  ["Tora de Cedro", "log", "#b8603a"],
  ["Tábuas de Carvalho", "plank", "#8a5a2e"],
  ["Tábuas de Pinho", "plank", "#c9a06a"],
  ["Tábuas de Ébano", "plank", "#3a2418"],
  ["Rolo de Linho", "cloth", "#e8dcc0", 0],
  ["Rolo de Lã", "cloth", "#c9b8a8", 1],
  ["Rolo de Seda", "cloth", "#f2a0c0", 0],
  ["Rolo de Veludo", "cloth", "#7a1a3a", 1],
  ["Rolo de Algodão", "cloth", "#f6f2ec", 0],
  ["Brocado Dourado", "cloth", "#c9a03a", 1],
  ["Couro de Cervo", "leather", "#b08a5a"],
  ["Couro de Javali", "leather", "#7a5a3a"],
  ["Couro de Urso", "leather", "#4a3020"],
  ["Couro Curtido", "leather", "#a8603a"],
  ["Novelo de Lã", "ball", "#d97a9a"],
  ["Fio de Ouro", "necklace", "#f2c14e"],
]);
addGroup("Partes de monstros", ["peles", "bazar", "conchas"], mat(8), [
  ["Presa de Lobo", "fang", "#f2eee4"],
  ["Presa de Javali", "fang", "#e8dcc0"],
  ["Garra de Urso", "claw", "#3a2a1a"],
  ["Garra de Grifo", "claw", "#c9a03a"],
  ["Chifre de Cervo", "horn", "#c9a878"],
  ["Chifre de Carneiro", "horn", "#e8dcc0"],
  ["Osso Antigo", "bone", "#e8e0c8"],
  ["Fêmur de Gigante", "bone", "#d9cfa8"],
  ["Escama de Serpente", "scale", "#5a9a7a"],
  ["Escama de Leviatã", "scale", "#2a5a9a"],
  ["Pena de Corvo", "feather", "#2a2a3a"],
  ["Pena de Grifo", "feather", "#c9a03a"],
  ["Pena de Fênix", "feather", "#ff6a2a"],
  ["Olho de Basilisco", "eye", "#5ad05a"],
  ["Olho de Coruja", "eye", "#f2c14e"],
  ["Asa de Morcego", "feather", "#4a3a5a"],
  ["Gosma de Lodo", "egg", "#7ad06a"],
  ["Casca de Ent", "log", "#5a6a3a"],
  ["Cristal de Gelo", "gem", "#c9f0ff", 1],
  ["Brasa Eterna", "gem", "#ff7a2a", 2],
]);

/* ===================== EQUIPAMENTOS ===================== */

const ELC = { fogo: "#ff7a3d", agua: "#4fb8ff", ar: "#b8f0e0", terra: "#c9a050", luz: "#fff3b0", sombra: "#9a5ad9" };
const ELN = { fogo: "Chama", agua: "Maré", ar: "Vento", terra: "Terra", luz: "Luz", sombra: "Sombra" };
const staffRows = [];
for (const [tipo, sh, pw, pr, elb, rq] of [
  ["Varinha", "wand", 0.06, 70, 0.15, 0],
  ["Cajado", "staff", 0.12, 190, 0.25, 1],
  ["Cetro", "scepter", 0.18, 430, 0.35, 2],
])
  for (const el of Object.keys(ELC)) staffRows.push([`${tipo} da ${ELN[el]}`.replace("da Vento", "do Vento"), sh, "#8a5a2e", Object.keys(ELC).indexOf(el), { tipo: "equip", slot: "cajado", pow: pw, el, elb, preco: pr, req: rq, acc: ELC[el] }]);
[
  ["Bastão de Bétula", "#d9cfb8", 0.03, 30],
  ["Bastão de Carvalho", "#8a5a2e", 0.05, 55],
  ["Bastão de Freixo", "#b89a6a", 0.07, 85],
  ["Bastão de Teixo", "#6a4a2a", 0.09, 120],
  ["Bastão de Ébano", "#2a1a14", 0.11, 170],
  ["Bastão de Coral", "#e86a5a", 0.12, 210],
  ["Bastão de Osso", "#e8e0c8", 0.13, 240],
  ["Bastão de Prata", "#dfe8f0", 0.15, 300],
  ["Bastão de Ouro", "#f2c14e", 0.17, 380],
  ["Bastão de Obsidiana", "#2a2040", 0.2, 520],
  ["Bastão de Âmbar", "#e8902a", 0.22, 640],
  ["Bastão de Cristal Puro", "#c9f0ff", 0.26, 880],
].forEach(([n, c, pw, pr], i) => staffRows.push([n, "staff", "#8a5a2e", i % 4, { tipo: "equip", slot: "cajado", pow: pw, preco: pr, req: pw >= 0.2 ? 3 : pw >= 0.15 ? 2 : 0, acc: c }]));
addGroup("Cajados", ["doran"], {}, staffRows);

addGroup("Roupas e armaduras", ["ferreiro", "forjaAna", "alfaiate", "tecidos"], {}, [
  ["Manto de Lã", "robe", "#8a7a6a", 0, { tipo: "equip", slot: "manto", def: 0.05, hp: 5, preco: 45 }],
  ["Manto de Seda", "robe", "#c94a8b", 1, { tipo: "equip", slot: "manto", def: 0.06, mp: 10, preco: 90 }],
  ["Manto de Veludo", "robe", "#5a1a3a", 0, { tipo: "equip", slot: "manto", def: 0.1, hp: 10, preco: 150 }],
  ["Capa de Viagem", "cloak", "#5a4a3a", 0, { tipo: "equip", slot: "manto", def: 0.08, preco: 70 }],
  ["Capa de Chuva", "cloak", "#3a6a8a", 1, { tipo: "equip", slot: "manto", def: 0.08, preco: 65, desc: "Capa encerada: −8% de dano. Boa para dias de chuva." }],
  ["Capa de Pele", "cloak", "#7a5a3a", 1, { tipo: "equip", slot: "manto", def: 0.16, hp: 15, preco: 160, desc: "Quentinha: protege do frio na neve (−16% de dano, +15 de vida)." }],
  ["Túnica de Linho", "tunic", "#e8dcc0", 0, { tipo: "equip", slot: "manto", def: 0.03, preco: 25 }],
  ["Túnica Bordada", "tunic", "#3a5aa8", 1, { tipo: "equip", slot: "manto", def: 0.06, mp: 8, preco: 80 }],
  ["Vestido de Festa", "dress", "#d94a7a", 1, { tipo: "equip", slot: "manto", def: 0.04, mp: 15, preco: 120 }],
  ["Vestido de Seda Real", "dress", "#7a3ab0", 0, { tipo: "equip", slot: "manto", def: 0.12, mp: 25, preco: 340, req: 2 }],
  ["Gibão de Couro", "armor", "#8a5a2e", 0, { tipo: "equip", slot: "armadura", def: 0.08, preco: 60 }],
  ["Cota de Malha Leve", "armor", "#a8b0b8", 1, { tipo: "equip", slot: "armadura", def: 0.12, preco: 130 }],
  ["Couraça de Bronze", "armor", "#b8863a", 0, { tipo: "equip", slot: "armadura", def: 0.15, hp: 10, preco: 200 }],
  ["Armadura de Aço", "armor", "#a8b0c8", 1, { tipo: "equip", slot: "armadura", def: 0.2, hp: 15, preco: 320, req: 1 }],
  ["Armadura de Prata", "armor", "#dfe8f0", 1, { tipo: "equip", slot: "armadura", def: 0.25, hp: 20, preco: 480, req: 2 }],
  ["Armadura de Mitril", "armor", "#8ae0f0", 1, { tipo: "equip", slot: "armadura", def: 0.32, hp: 30, preco: 900, req: 3 }],
  ["Peitoral do Cavaleiro", "armor", "#5a6a9a", 0, { tipo: "equip", slot: "armadura", def: 0.22, hp: 25, preco: 420, req: 2 }],
  ["Armadura Real", "armor", "#f2c14e", 1, { tipo: "equip", slot: "armadura", def: 0.36, hp: 40, preco: 1400, req: 4 }],
  ["Elmo de Ferro", "helmet", "#8a8a96", 0, { tipo: "equip", slot: "armadura", def: 0.1, preco: 90 }],
  ["Elmo Alado", "helmet", "#dfe8f0", 1, { tipo: "equip", slot: "armadura", def: 0.14, mp: 10, preco: 210 }],
  ["Botas de Couro", "boots", "#7a5a3a", 0, { tipo: "equip", slot: "armadura", def: 0.05, preco: 40 }],
  ["Botas de Viajante", "boots", "#5a4a6a", 0, { tipo: "equip", slot: "armadura", def: 0.07, hp: 10, preco: 85 }],
  ["Luvas de Couro", "gloves", "#8a5a2e", 0, { tipo: "equip", slot: "armadura", def: 0.04, preco: 30 }],
  ["Manoplas de Aço", "gloves", "#a8b0c8", 0, { tipo: "equip", slot: "armadura", def: 0.11, preco: 140 }],
  ["Escudo de Madeira", "shield", "#8a5a2e", 0, { tipo: "equip", slot: "armadura", def: 0.08, preco: 45 }],
  ["Escudo de Bronze", "shield", "#b8863a", 1, { tipo: "equip", slot: "armadura", def: 0.13, preco: 150 }],
  ["Escudo Torre", "shield", "#6a6a7a", 0, { tipo: "equip", slot: "armadura", def: 0.2, hp: 10, preco: 300, req: 1 }],
  ["Escudo Rúnico", "shield", "#5a3ab0", 1, { tipo: "equip", slot: "armadura", def: 0.24, mp: 15, preco: 520, req: 2 }],
  ["Broquel", "shield", "#a8b0b8", 0, { tipo: "equip", slot: "armadura", def: 0.09, preco: 70 }],
  ["Escudo Real", "shield", "#2a4a9a", 1, { tipo: "equip", slot: "armadura", def: 0.3, hp: 20, preco: 1100, req: 4 }],
]);
addGroup("Joias", ["joalheiro", "perola"], {}, [
  ["Anel de Cobre", "ring", "#c97a3a", 0, { tipo: "equip", slot: "amuleto", hp: 5, preco: 30, acc: "#c97a3a" }],
  ["Anel de Prata", "ring", "#dfe8f0", 0, { tipo: "equip", slot: "amuleto", hp: 10, preco: 70, acc: "#dfe8f0" }],
  ["Anel de Ouro", "ring", "#f2c14e", 0, { tipo: "equip", slot: "amuleto", hp: 15, mp: 5, preco: 140 }],
  ["Anel de Rubi", "ring", "#e0303a", 0, { tipo: "equip", slot: "amuleto", hp: 30, preco: 220, acc: "#e0303a" }],
  ["Anel de Safira", "ring", "#3a5ad9", 0, { tipo: "equip", slot: "amuleto", mp: 25, preco: 220, acc: "#3a5ad9" }],
  ["Anel de Esmeralda", "ring", "#3ab05a", 0, { tipo: "equip", slot: "amuleto", hp: 15, mp: 15, preco: 240, acc: "#3ab05a" }],
  ["Anel de Topázio", "ring", "#f2a020", 0, { tipo: "equip", slot: "amuleto", pow: 0.04, preco: 260, acc: "#f2a020" }],
  ["Anel de Ametista", "ring", "#9a4ad9", 0, { tipo: "equip", slot: "amuleto", mp: 30, preco: 280, acc: "#9a4ad9" }],
  ["Anel de Ônix", "ring", "#2a2a3a", 0, { tipo: "equip", slot: "amuleto", def: 0.06, preco: 300, acc: "#5a5a6a" }],
  ["Amuleto do Sol", "amulet", "#f2c14e", 0, { tipo: "equip", slot: "amuleto", hp: 25, preco: 260, acc: "#fff3b0" }],
  ["Amuleto da Lua", "amulet", "#c9d0f0", 0, { tipo: "equip", slot: "amuleto", mp: 30, preco: 260, acc: "#9a8ad9" }],
  ["Amuleto das Marés", "amulet", "#4fb8ff", 0, { tipo: "equip", slot: "amuleto", mp: 20, hp: 10, preco: 240, acc: "#4fb8ff" }],
  ["Amuleto do Vento", "amulet", "#b8f0e0", 0, { tipo: "equip", slot: "amuleto", pow: 0.05, preco: 300, acc: "#b8f0e0" }],
  ["Amuleto da Terra", "amulet", "#c9a050", 0, { tipo: "equip", slot: "amuleto", def: 0.07, preco: 300, acc: "#8a6a2a" }],
  ["Amuleto da Chama", "amulet", "#ff7a3d", 0, { tipo: "equip", slot: "amuleto", pow: 0.06, preco: 340, acc: "#ff7a3d" }],
  ["Colar de Pérolas", "necklace", "#f6f2ec", 0, { tipo: "equip", slot: "amuleto", mp: 20, preco: 200, acc: "#f6f2ec" }],
  ["Colar de Âmbar", "necklace", "#e8902a", 0, { tipo: "equip", slot: "amuleto", hp: 20, preco: 160, acc: "#e8902a" }],
  ["Colar de Contas", "necklace", "#5a9ad9", 0, { tipo: "equip", slot: "amuleto", hp: 8, preco: 50, acc: "#e05a5a" }],
  ["Colar de Dentes", "necklace", "#f2eee4", 0, { tipo: "equip", slot: "amuleto", pow: 0.03, preco: 120, acc: "#f2eee4" }],
  ["Pulseira de Prata", "bracelet", "#dfe8f0", 0, { tipo: "equip", slot: "amuleto", hp: 12, preco: 90, acc: "#9fd0f0" }],
  ["Pulseira de Ouro", "bracelet", "#f2c14e", 0, { tipo: "equip", slot: "amuleto", hp: 18, preco: 160, acc: "#e0303a" }],
  ["Pulseira de Jade", "bracelet", "#5ab08a", 0, { tipo: "equip", slot: "amuleto", mp: 18, preco: 170, acc: "#5ab08a" }],
  ["Tiara de Prata", "crown", "#dfe8f0", 0, { tipo: "equip", slot: "amuleto", mp: 22, preco: 260, acc: "#4fb8ff" }],
  ["Diadema", "crown", "#f2c14e", 0, { tipo: "equip", slot: "amuleto", mp: 35, hp: 10, preco: 420, req: 2, acc: "#e0303a" }],
  ["Coroa de Flores", "flower", "#ff8ab0", 1, { tipo: "equip", slot: "amuleto", hp: 6, preco: 40, acc: "#f2c14e" }],
  ["Broche de Rubi", "amulet", "#e0303a", 1, { tipo: "equip", slot: "amuleto", hp: 22, preco: 190, acc: "#e0303a" }],
  ["Broche de Safira", "amulet", "#3a5ad9", 1, { tipo: "equip", slot: "amuleto", mp: 22, preco: 190, acc: "#3a5ad9" }],
  ["Medalhão Antigo", "coin", "#c9a03a", 0, { tipo: "equip", slot: "amuleto", hp: 15, mp: 15, preco: 210 }],
  ["Medalhão do Cavaleiro", "coin", "#a8b0c8", 0, { tipo: "equip", slot: "amuleto", def: 0.08, preco: 360, req: 2 }],
  ["Medalhão das Runas", "coin", "#8a4ad9", 0, { tipo: "equip", slot: "amuleto", pow: 0.08, preco: 620, req: 3 }],
]);

/* ===================== PRESENTES E COISAS ===================== */

const gift = (p) => (r, i) => ({ tipo: "gift", preco: p + (i % 5) * 4 });
addGroup("Flores", ["floricultura"], gift(6), [
  ["Rosa Vermelha", "flower", "#e0303a", 0],
  ["Rosa Branca", "flower", "#f6f2ec", 0],
  ["Tulipa", "flower", "#f25a8a", 1],
  ["Girassol", "flower", "#f2c020", 0],
  ["Lírio", "flower", "#fff6e8", 0, { acc: "#f2a020" }],
  ["Orquídea", "flower", "#c95ad9", 1],
  ["Margarida", "flower", "#ffffff", 0],
  ["Violeta", "flower", "#7a3ab0", 1],
  ["Ramo de Lavanda", "herb", "#9a7ad9", 1],
  ["Hortênsia", "flower", "#6a8ad9", 0],
  ["Camélia", "flower", "#e86a8a", 1],
  ["Papoula", "flower", "#ff4a2a", 0],
]);
addGroup("Brinquedos", ["brinquedos"], gift(8), [
  ["Bola de Couro", "ball", "#b8603a"],
  ["Boneca de Pano", "doll", "#c94a8b"],
  ["Pião de Madeira", "top", "#d9603a"],
  ["Dados de Osso", "dice", "#f2eee4"],
  ["Peteca", "feather", "#e0303a"],
  ["Soldadinho de Chumbo", "statue", "#5a6a9a"],
  ["Bola de Gude", "orb", "#5ad0e0"],
  ["Chocalho", "bell", "#f2c14e"],
  ["Fantoche", "mask", "#7ad36b"],
  ["Boneco de Madeira", "doll", "#8a5a2e"],
]);
addGroup("Instrumentos", ["bazar", "emporio"], gift(40), [
  ["Alaúde", "lute", "#8a5a2e"],
  ["Flauta Doce", "flute", "#c9a06a"],
  ["Flauta de Bambu", "flute", "#9ab04a"],
  ["Tambor", "drum", "#c94a4a"],
  ["Pandeiro", "drum", "#d9a441"],
  ["Sininho", "bell", "#f2c14e"],
  ["Sino de Bronze", "bell", "#b8863a"],
  ["Viola Caipira", "lute", "#6a3a1a"],
]);
addGroup("Livros e cartas", ["livraria"], gift(12), [
  ["Romance de Cavalaria", "book", "#8a1a2a"],
  ["Poemas de Amor", "book", "#d94a7a"],
  ["Contos de Fadas", "book", "#5a9ad9"],
  ["Atlas dos Reinos", "map", "#3a78b0"],
  ["Diário em Branco", "book", "#e8dcc0"],
  ["Livro de Receitas", "book", "#e8902a"],
  ["Bestiário", "book", "#3a5a2a"],
  ["Tratado de Runas", "book", "#5a3ab0"],
  ["Almanaque do Camponês", "book", "#c9a050"],
  ["Lendas do Mar", "book", "#2a5a8a"],
  ["Canções de Taverna", "scroll", "#c94a4a"],
  ["Carta de Amor Perfumada", "scroll", "#ff8ab0"],
]);
addGroup("Perfumes e mimos", ["emporio", "especiarias", "bazar"], gift(15), [
  ["Perfume de Rosa", "bottle", "#e86a8a", 0],
  ["Perfume de Lavanda", "bottle", "#9a7ad9", 1],
  ["Perfume de Jasmim", "bottle", "#f2eee4", 0],
  ["Água de Colônia", "bottle", "#9fd0f0", 1],
  ["Sabonete de Mel", "honey", "#e8a020"],
  ["Espelho de Mão", "mirror", "#c9a03a"],
  ["Pente de Osso", "bone", "#f2eee4"],
  ["Leque Pintado", "shell", "#d94a7a"],
]);
addGroup("Ferramentas", ["armazem", "ferreiro", "redes"], (r, i) => ({ tipo: "tool", preco: 15 + (i % 7) * 12 }), [
  ["Martelo", "hammer", "#8a8a96"],
  ["Martelo de Ferreiro", "hammer", "#5a5a6a"],
  ["Picareta de Ferro", "pickaxe", "#8a8a96"],
  ["Picareta de Aço", "pickaxe", "#a8b0c8"],
  ["Picareta de Mitril", "pickaxe", "#8ae0f0"],
  ["Machado de Lenhador", "axe", "#8a8a96"],
  ["Machado de Aço", "axe", "#a8b0c8"],
  ["Foice", "sickle", "#8a8a96"],
  ["Foice de Prata", "sickle", "#dfe8f0"],
  ["Pá", "shovel", "#8a8a96"],
  ["Enxada", "shovel", "#6a6a7a"],
  ["Vara de Bambu", "rod", "#9ab04a"],
  ["Vara de Carvalho", "rod", "#8a5a2e"],
  ["Vara do Pescador Real", "rod", "#c9a03a"],
  ["Lanterna de Ferro", "lantern", "#8a8a96"],
  ["Lanterna de Cristal", "lantern", "#5ad0e0"],
  ["Vela de Cera", "candle", "#f2eee4"],
  ["Vela Perfumada", "candle", "#d97aa8"],
  ["Chave Antiga", "key", "#b8863a"],
  ["Bússola", "compass", "#b8863a"],
]);

/* ===================== MÓVEIS ===================== */

const furn = (p, walk) => (r, i) => ({ tipo: "movel", preco: p + (i % 5) * 15, walk });
addGroup("Móveis", ["moveis"], furn(40), [
  ["Cadeira de Pinho", "chair", "#c9a06a"],
  ["Cadeira de Carvalho", "chair", "#8a5a2e"],
  ["Cadeira Estofada", "chair", "#a83a3a"],
  ["Cadeira de Balanço", "chair", "#5a7a3a"],
  ["Banquinho", "bench", "#a87a4a"],
  ["Mesa de Pinho", "table", "#c9a06a"],
  ["Mesa de Carvalho", "table", "#8a5a2e"],
  ["Mesa de Jantar", "table", "#6a3a1a"],
  ["Mesinha de Chá", "table", "#d9a060"],
  ["Escrivaninha", "table", "#5a3a2a"],
  ["Cama de Palha", "bed", "#d9c070"],
  ["Cama Simples", "bed", "#3a78b0"],
  ["Cama de Casal", "bed", "#a83a5a"],
  ["Cama com Dossel", "bed", "#7a3ab0"],
  ["Berço", "bed", "#f2a0c0"],
  ["Baú de Pinho", "chest", "#c9a06a"],
  ["Baú de Ferro", "chest", "#6a6a7a"],
  ["Baú do Tesouro", "chest", "#8a5a2e"],
  ["Arca Antiga", "chest", "#4a2a1a"],
  ["Estante", "shelf", "#8a5a2e"],
  ["Estante de Livros", "shelf", "#5a3a2a"],
  ["Prateleira de Potes", "shelf", "#a87a4a"],
  ["Armário de Cozinha", "shelf", "#c9a06a"],
  ["Guarda-Roupa de Pinho", "wardrobe", "#c9a06a"],
  ["Guarda-Roupa de Carvalho", "wardrobe", "#8a5a2e"],
  ["Guarda-Roupa Real", "wardrobe", "#4a2a3a"],
  ["Tapete Vermelho", "rug", "#a83a3a", 0, { walk: true }],
  ["Tapete Azul", "rug", "#3a5aa8", 0, { walk: true }],
  ["Tapete Persa", "rug", "#8a3a5a", 0, { walk: true, acc: "#f2c14e" }],
  ["Tapete de Pele", "rug", "#c9b8a0", 0, { walk: true, acc: "#8a7a6a" }],
  ["Tapete Redondo", "rug", "#5a9a5a", 0, { walk: true }],
  ["Quadro do Mar", "painting", "#3a78b0"],
  ["Quadro do Campo", "painting", "#7ab04a"],
  ["Quadro do Castelo", "painting", "#8a8aa8"],
  ["Vaso Azul", "vase", "#3a78d9"],
  ["Vaso de Barro", "vase", "#c97a4a"],
  ["Vaso de Porcelana", "vase", "#f2eee4", 0, { acc: "#3a78d9" }],
  ["Abajur", "lamp", "#f2d080"],
  ["Candelabro", "candle", "#c9a03a"],
  ["Lustre de Cristal", "lamp", "#c9f0ff"],
  ["Relógio de Parede", "clock", "#8a5a2e"],
  ["Relógio de Pêndulo", "clock", "#4a2a1a"],
  ["Espelho de Parede", "mirror", "#c9a03a"],
  ["Espelho Dourado", "mirror", "#f2c14e"],
  ["Barril de Vinho", "barrel", "#8a5a2e"],
  ["Barril de Água", "barrel", "#6a8aa8"],
  ["Samambaia", "plant", "#3a8a3a"],
  ["Bonsai", "plant", "#5aa83a"],
  ["Banco de Jardim", "bench", "#8a5a2e"],
  ["Banco Estofado", "bench", "#7a3ab0"],
]);

/* ===================== CURIOSIDADES ===================== */

addGroup("Curiosidades", ["bazar", "emporio", "conchas", "especiarias"], gift(20), [
  ["Moeda Antiga", "coin", "#b8863a"],
  ["Moeda de Prata Velha", "coin", "#dfe8f0"],
  ["Dobrão de Ouro", "coin", "#f2c14e"],
  ["Fóssil de Concha", "fossil", "#8a7a5a"],
  ["Fóssil de Peixe", "fish", "#a8a090"],
  ["Dente de Dragão", "fang", "#e8dcc0"],
  ["Concha Espiral", "shell", "#e8c0a0"],
  ["Concha Rosa", "shell", "#f2a0c0"],
  ["Estátua de Pedra", "statue", "#8a8a8a"],
  ["Estatueta de Ouro", "idol", "#f2c14e"],
  ["Ídolo de Jade", "idol", "#5ab08a"],
  ["Caveira de Cristal", "skull", "#c9f0ff"],
  ["Ampulheta", "hourglass", "#e8c870"],
  ["Bola de Cristal", "orb", "#9a7ad9"],
  ["Orbe Lunar", "orb", "#c9d0f0"],
  ["Máscara de Carnaval", "mask", "#d94a7a"],
  ["Máscara Tribal", "mask", "#8a5a2e"],
  ["Mapa do Tesouro", "map", "#c94a4a"],
  ["Pergaminho Antigo", "scroll", "#8a6a3a"],
  ["Pena de Escrever", "feather", "#f6f2ec"],
  ["Tinteiro", "potion", "#1a1a2a", 3],
  ["Ovo Dourado", "egg", "#f2c14e"],
  ["Ovo de Dragão", "egg", "#5a9a5a"],
  ["Chave de Cristal", "key", "#5ad0e0", 0, { acc: "#c9f0ff" }],
  ["Relíquia do Templo", "idol", "#dfe8ff"],
  ["Coroa Antiga", "crown", "#b8863a"],
  ["Cálice de Ouro", "glass", "#f2c14e"],
  ["Talismã da Sorte", "amulet", "#3ab04a"],
  ["Bússola do Capitão", "compass", "#c9a03a"],
  ["Lanterna Mágica", "lantern", "#c95ad9"],
]);

/* Cada coisa na sua loja: roupa no alfaiate, armadura no ferreiro, gema na loja de cristais... */
(function sortShops() {
  const drop = (shop, test) => SHOPS[shop] && (SHOPS[shop].items = SHOPS[shop].items.filter((id) => !(CATALOG.includes(id) && test(ITEMS[id]))));
  const shape = (it) => it.gicon.split(":")[1];
  drop("ferreiro", (it) => it.slot === "manto");
  drop("forjaAna", (it) => it.slot === "manto" || shape(it) === "gem" || shape(it) === "ore");
  drop("alfaiate", (it) => it.slot === "armadura");
  drop("tecidos", (it) => it.slot === "armadura" || it.slot === "manto" || shape(it) === "log" || shape(it) === "plank" || shape(it) === "leather");
  drop("armazem", (it) => ["gem", "ingot", "orb", "cloth", "leather"].includes(shape(it)) || /Minério de (Prata|Ouro|Mitril)/.test(it.nome));
  drop("minerios", (it) => ["gem", "ingot", "orb"].includes(shape(it)));
  drop("cristais", (it) => ["ore", "ingot"].includes(shape(it)));
  drop("peles", (it) => ["log", "plank", "cloth", "ball", "necklace"].includes(shape(it)));
  drop("moveis", (it) => ["cloth", "leather", "ball", "necklace"].includes(shape(it)));
  drop("conchas", (it) => !["shell", "fossil", "coin", "fish", "scale", "squid"].includes(shape(it)) && it.cat !== "Peixes e frutos do mar");
  drop("bazar", (it) => it.cat === "Partes de monstros" && ["eye", "egg"].includes(shape(it)));
})();

/* ===================== ÍCONES DOS ITENS ANTIGOS ===================== */

/** Cada item antigo ganha o seu ícone, escolhido pelo nome e pelo tipo. */
const OLD_ICON_RULES = [
  [/Cajado|Bastão/, (it) => gIcon("staff", "#8a5a2e", it.el ? ELC[it.el] : "#f2c14e", (it.preco || 0) % 4)],
  [/Poção de Vida|Grande Poção|Poção/, (it) => gIcon("potion", it.mp && !it.hp ? "#3a78d9" : "#e0306a", "#f2c14e", (it.preco || 0) % 4)],
  [/Éter|Essência/, (it) => gIcon("potion", "#3a78d9", "#f2c14e", (it.preco || 1) % 4)],
  [/Elixir/, () => gIcon("potion", "#9a3ac9", "#f2c14e", 3)],
  [/Erva|Chá/, (it) => (/Chá/.test(it.nome) ? gIcon("cup", "#7ad06a") : gIcon("herb", "#5aa83a"))],
  [/Pão|Broa/, () => gIcon("bread", "#d9a050", "#f2c14e", 0)],
  [/Maçã/, (it) => gIcon("apple", /Dourada/.test(it.nome) ? "#f2c14e" : "#d9303a")],
  [/Bolo/, () => gIcon("cake", "#f28aa8", "#f2c14e", 1)],
  [/Torta/, () => gIcon("pie", "#d9603a")],
  [/Ensopado|Sopa|Caldo/, () => gIcon("soup", "#a85a3a")],
  [/Assado|Carne|Linguiça/, () => gIcon("meat", "#b8604a", "#f2c14e", 0)],
  [/Peixe/, (it) => gIcon("fish", /Dourado/.test(it.nome) ? "#f2c14e" : "#7a9ab0")],
  [/Queijo/, () => gIcon("cheese", "#f2c040")],
  [/Hidromel|Cerveja/, () => gIcon("mug", "#e8b030", "#f2c14e", 1)],
  [/Vinho/, () => gIcon("bottle", "#7a1a3a")],
  [/Cantil|Água/, () => gIcon("glass", "#9fd0f0")],
  [/Anel/, () => gIcon("ring", "#f2c14e", "#e0303a")],
  [/Amuleto|Colar/, () => gIcon("amulet", "#f2c14e", "#4fb8ff")],
  [/Escudo/, () => gIcon("shield", "#8a8a96")],
  [/Armadura|Cota|Couraça/, () => gIcon("armor", "#a8b0c8")],
  [/Manto/, (it) => gIcon("robe", it.def >= 0.3 ? "#2a5aa8" : it.def ? "#5a4a8a" : "#c9b8a0")],
  [/Flor|Buquê|Rosa/, () => gIcon("flower", "#e86a8a")],
  [/Livro|Tomo|Grimório/, () => gIcon("book", "#5a3ab0")],
  [/Cristal/, () => gIcon("gem", "#9a5ad9", "#f2c14e", 1)],
  [/Minério|Pedra/, () => gIcon("ore", "#8a8a96")],
  [/Fragmento/, () => gIcon("gem", "#5ad0e0", "#f2c14e", 2)],
  [/Couro/, () => gIcon("leather", "#8a5a2e")],
  [/Pena/, () => gIcon("feather", "#f2eee4")],
  [/Vara/, () => gIcon("rod", "#8a5a2e")],
  [/Doce|Bombom|Cocada/, () => gIcon("cookie", "#c98a4a")],
  [/Carpa/, () => gIcon("fish", "#c9803a")],
  [/Caldeirada|Caldeirão/, () => gIcon("soup", "#5a6a3a")],
  [/Pérola/, () => gIcon("orb", "#f6f2ec")],
  [/Bota/, () => gIcon("boots", "#6a5a4a")],
  [/Lenço/, () => gIcon("cloth", "#d94a7a", "#f2c14e", 1)],
  [/Perfume/, () => gIcon("bottle", "#c95ad9", "#f2c14e", 1)],
  [/Boneco/, () => gIcon("doll", "#a8603a")],
  [/Ração|Petisco/, (it) => gIcon(/Ração/.test(it.nome) ? "pouch" : "cookie", "#b8783a")],
  [/Placas/, () => gIcon("armor", "#5a3ab0", "#f2c14e", 1)],
  [/Broquel/, () => gIcon("shield", "#8a8a96", "#f2c14e", 1)],
  [/Escama/, () => gIcon("scale", "#c94a3a")],
  [/Óculos/, () => gIcon("eye", "#c9a03a")],
  [/Facão/, (it) => gIcon("sword", "#8a5a2e", /Aço/.test(it.nome) ? "#c9d0e0" : "#8a8a96")],
  [/Esporo/, () => gIcon("mushroom", "#8a7aa8")],
  [/Pele/, () => gIcon("leather", "#5a8a4a")],
  [/Papiro/, () => gIcon("scroll", "#9a5ad9")],
  [/Trigo/, () => gIcon("corn", "#e8c050")],
  [/Cama|Berço/, (it) => gIcon("bed", /Dossel/.test(it.nome) ? "#7a3ab0" : "#3a78b0")],
  [/Guarda-roupa/, () => gIcon("wardrobe", "#8a5a2e")],
  [/Lareira/, () => gIcon("candle", "#e8702a")],
  [/Mesa/, () => gIcon("table", "#8a5a2e")],
  [/Banquinho/, () => gIcon("bench", "#a87a4a")],
  [/Tapete/, (it) => gIcon("rug", /Real/.test(it.nome) ? "#2a4a9a" : /Bordado/.test(it.nome) ? "#8a3a5a" : "#a8603a")],
  [/Vaso/, () => gIcon("plant", "#3a8a3a")],
  [/Quadro/, () => gIcon("painting", "#7ab04a")],
  [/Baú/, () => gIcon("chest", "#8a5a2e")],
  [/Aquário/, () => gIcon("orb", "#4fb8ff")],
  [/Harpa/, () => gIcon("lute", "#c9a03a")],
  [/Candelabro/, () => gIcon("candle", "#c9a03a")],
  [/Troféu/, () => gIcon("glass", "#f2c14e")],
  [/Coroa de Folhas/, () => gIcon("crown", "#5aa83a")],
  [/Cadeira/, () => gIcon("chair", "#8a5a2e")],
  [/Banheira/, () => gIcon("barrel", "#6a9ac9")],
  [/Fogão/, () => gIcon("chest", "#4a4a52", "#ff7a3d")],
  [/Retrato|Paisagem/, (it) => gIcon("painting", /Retrato/.test(it.nome) ? "#c94a8b" : "#ff9a5a")],
  [/Poltrona/, () => gIcon("chair", "#c94a8b")],
  [/Mel/, () => gIcon("honey", "#e8a020")],
  [/Frutas? Silvestres?/, () => gIcon("berries", "#c9204a")],
];
for (const [id, it] of Object.entries(ITEMS)) {
  if (it.gicon || CATALOG.includes(id)) continue;
  const rule = OLD_ICON_RULES.find(([re]) => re.test(it.nome));
  if (rule) it.gicon = rule[1](it);
}

/** Ícone de qualquer item: o próprio (gerado) ou o antigo. */
const _itemIconBase = itemIcon;
itemIcon = function (id) {
  const it = ITEMS[id];
  return it && it.gicon ? it.gicon : _itemIconBase(id);
};

/* ===================== EFEITOS NOVOS ===================== */

const _useItemEffectBase = useItemEffect;
useItemEffect = function (id) {
  const it = ITEMS[id];
  const extra = [];
  if (it) {
    if (it.stam) {
      player.stamina = Math.min(100, (player.stamina ?? 100) + it.stam);
      extra.push(`fôlego +${it.stam}`);
    }
    if (lifeMode()) {
      if (it.energy) (addNeed("energy", it.energy), extra.push(`energia +${it.energy}`));
      if (it.hyg) (addNeed("hygiene", it.hyg), extra.push(`higiene +${it.hyg}`));
      if (it.fun) (addNeed("fun", it.fun), extra.push(`diversão +${it.fun}`));
    }
    if (it.warm) {
      player.cold = 0;
      player.wet = 0;
      extra.push("corpo quente e seco");
    }
    if (it.bless) {
      player.blessDay = player.day;
      extra.push("abençoado hoje");
    }
    if (it.sickCure && player.sick) {
      player.sick = null;
      extra.push("doença curada");
    }
  }
  const base = _useItemEffectBase(id);
  return [base, ...extra].filter(Boolean).join(", ");
};

/** Tapetes novos dá para pisar em cima. */
const _furnWalkBase = furnWalk;
furnWalk = function (id) {
  return !!(ITEMS[id] && ITEMS[id].walk) || _furnWalkBase(id);
};
/** Móveis novos aparecem na casa desenhados pelo próprio ícone, em tamanho grande. */
const _drawFurnExtraCat = drawFurnExtra;
drawFurnExtra = function (f, t) {
  const it = ITEMS[f.id];
  if (it && it.gicon && it.tipo === "movel" && CATALOG.includes(f.id)) {
    const X = f.x * TILE,
      Y = f.y * TILE;
    ctx.fillStyle = "rgba(0,0,0,.22)";
    ctx.fillRect(X + 3, Y + 26, 26, 5);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(gIconCanvas(it.gicon).c, X - 2, Y - 6, 36, 36);
    return true;
  }
  return _drawFurnExtraCat(f, t);
};

/* ======================================================================
   (antes: 24-lojas.js)
   ====================================================================== */

/**
 * ECOS DO ARCANO — 14-pizza-catalogo-e-lojas.js
 * Telas de compra caprichadas: vitrine com o atendente falando, carrossel em leque
 * (o item do meio fica grande, os vizinhos aparecem menores dos lados), painel de
 * detalhes com atributos, raridade, quantidade e imposto.
 * Vale para todas as lojas de itens e para as lojas de roupa e cabelo.
 */


const ITEM_TYPE_NAMES = {
  food: "Comida",
  cons: "Consumível",
  equip: "Equipamento",
  movel: "Móvel",
  gift: "Presente",
  mat: "Material",
  pet: "Mascote",
  tool: "Ferramenta",
};
const RARITY = [
  { max: 40, n: "Comum", c: "#b9b0cc" },
  { max: 150, n: "Incomum", c: "#7ad36b" },
  { max: 350, n: "Raro", c: "#5aa8ff" },
  { max: 800, n: "Épico", c: "#c27aff" },
  { max: 1e9, n: "Lendário", c: "#f2c14e" },
];
function rarityOf(price, lend) {
  return lend ? RARITY[4] : RARITY.find((r) => price <= r.max);
}
const KEEPER_LINES = {
  hello: ["Seja bem-vindo! Fique à vontade.", "Olha só quem apareceu! Dá uma olhada.", "Tudo fresquinho, chegou hoje.", "Precisando de alguma coisa?"],
  buy: ["Ótima escolha!", "Isso aí vai te servir bem.", "Volte sempre!", "Negócio fechado!", "Você tem bom gosto."],
  poor: ["Hm... falta ouro aí, hein.", "Fiado eu não vendo, viu?", "Volta quando tiver mais moedas."],
  sell: ["Hm, deixa eu ver... fechado.", "Isso eu consigo revender.", "Pago justo, pode confiar."],
  look: ["Esse aí é dos bons.", "Esse vende muito.", "Quer experimentar esse?", "Esse é o meu preferido."],
};

/** Quem atende em cada loja (para o retrato). */
function shopKeeperName(id) {
  if (id === "__cos") return { roupa: "Costureira Dália", cabelo: "Cabeleireira Nina", moda: "Estilista Marina" }[game.cosKind] || "Costureira Dália";
  if (KEEPERS[id]) return KEEPERS[id][0];
  const fr = Object.keys(FRIENDS).find((k) => FRIENDS[k].shop === id);
  if (fr) return NPCS[fr].nome;
  return (SHOPS[id] && SHOPS[id].nome) || "Atendente";
}
function keeperSays(kind) {
  game.keeperLine = pickOne(KEEPER_LINES[kind]);
}

/** Desenha o atendente (meio corpo) num canvas pequeno. */
function drawKeeper(cv, name) {
  if (!cv) return;
  const c2 = cv.getContext("2d");
  c2.clearRect(0, 0, cv.width, cv.height);
  const look = speakerLook(name) || {};
  const rects = look.hero
    ? heroRects(player.look, "down", null)
    : look.elf
      ? elfRects(look.robe, look.hair, "down")
      : wizardRects(look.robe || "#5a4a7a", look.hat ?? null, look.hair || "#3a2414", null, "down", 0, look.seed);
  const u = 5,
    ox = cv.width / 2 - 8 * u,
    oy = 6 + Math.sin(game.t * 2) * 0.8;
  for (const [x, y, w, h, col] of rects) {
    c2.fillStyle = col;
    c2.fillRect(ox + x * u, oy + y * u, w * u, h * u);
  }
}

/** Atributos do item como "chips". */
function itemStatChips(it) {
  const s = [];
  if (it.food) s.push(["bread", `Fome +${it.food}`]);
  if (it.water) s.push(["water", `Sede +${it.water}`]);
  if (it.hp) s.push(["heart", `${it.tipo === "equip" ? "Vida máx." : "Vida"} +${it.hp}`]);
  if (it.mp) s.push(["star", `${it.tipo === "equip" ? "Magia máx." : "Magia"} +${it.mp}`]);
  if (it.pow) s.push(["bolt", `Dano +${Math.round(it.pow * 100)}%`]);
  if (it.def) s.push(["armor", `Defesa ${Math.round(it.def * 100)}%`]);
  if (it.atk) s.push(["sword", `Ataque +${it.atk}`]);
  return s;
}

/* ===================== LOJA DE ITENS ===================== */

function shopAll() {
  const sh = SHOPS[game.shopId];
  return game.shopTab === "buy"
    ? sh.items.filter((id) => ITEMS[id])
    : Object.keys(player.inv).filter((id) => ITEMS[id] && itemCount(id) > (Object.values(player.eq).includes(id) ? 1 : 0));
}
/** Categoria de um item (para os filtros da loja). */
function itemCat(id) {
  const it = ITEMS[id];
  return it.cat || (it.slot ? { cajado: "Cajados", manto: "Roupas e armaduras", armadura: "Roupas e armaduras", amuleto: "Joias" }[it.slot] : null) || { movel: "Móveis", cons: "Poções", gift: "Presentes", mat: "Materiais", tool: "Ferramentas", food: "Comida", pet: "Mascotes" }[it.tipo] || "Outros";
}
function shopCats() {
  const seen = [];
  for (const id of shopAll()) if (!seen.includes(itemCat(id))) seen.push(itemCat(id));
  return seen;
}
function shopList() {
  const all = shopAll();
  if (!game.shopCat || !shopCats().includes(game.shopCat)) game.shopCat = null;
  return game.shopCat ? all.filter((id) => itemCat(id) === game.shopCat) : all;
}
function shopPrice(id) {
  const it = ITEMS[id];
  if (game.shopTab === "sell") return { pr: saleAfterTax(Math.floor(it.preco / 2)), base: Math.floor(it.preco / 2) };
  const base = Math.round(it.preco * discount(game.shopId));
  return { pr: withTax(base), base };
}
function canStack(it) {
  return game.shopTab === "sell" ? true : !["equip", "pet", "movel"].includes(it.tipo);
}

function renderShop() {
  const sh = SHOPS[game.shopId];
  const list = shopList();
  game.shopList = list;
  game.shopIdx = Math.max(0, Math.min(list.length - 1, game.shopIdx || 0));
  game.shopQty = game.shopQty || 1;
  if (!game.keeperLine) keeperSays("hello");
  const keeper = shopKeeperName(game.shopId);
  const cards = list
    .map((id, i) => {
      const it = ITEMS[id];
      const r = rarityOf(it.preco, it.lend);
      const lock = game.shopTab === "buy" && it.req && guardiansFreed() < it.req;
      return `<button class="st-card${lock ? " lock" : ""}" data-go="${i}" style="--rc:${r.c}">
        <span class="st-gem"></span>
        <span class="st-ic">${iconHTML(itemIcon(id), 64)}</span>
        <span class="st-nm">${it.nome}</span>
        <span class="st-tag">${iconHTML("coin", 12)}${shopPrice(id).pr}</span>
        ${lock ? `<span class="st-lock">${iconHTML("lock", 22)}</span>` : ""}
      </button>`;
    })
    .join("");
  byId("shop").innerHTML = `<div class="store slider">
    <header class="st-head">
      <div class="st-sign"><span class="st-sign-ic">${iconHTML(game.shopTab === "buy" ? "bag" : "coin", 22)}</span><div><b>${sh.nome}</b><small>${sh.sub}</small></div></div>
      <div class="st-purse">${iconHTML("coin", 18)}<b>${player.gold}</b><small>ouro</small></div>
      <button id="shclose" class="st-x" title="Fechar (Esc)">✕</button>
    </header>
    <div class="st-top">
      <div class="st-keeper"><canvas id="stk" width="80" height="80"></canvas><div class="st-bubble"><b>${keeper.split(",")[0]}</b><span id="stline">${game.keeperLine}</span></div></div>
      <div class="st-tabs">
        <button data-t="buy" class="${game.shopTab === "buy" ? "on" : ""}">${iconHTML("bag")}Comprar</button>
        <button data-t="sell" class="${game.shopTab === "sell" ? "on" : ""}">${iconHTML("coin")}Vender</button>
      </div>
    </div>
    ${
      shopCats().length > 1
        ? `<div class="st-cats"><button data-scat="" class="${!game.shopCat ? "on" : ""}">Tudo <em>${shopAll().length}</em></button>${shopCats()
            .map((c) => `<button data-scat="${c}" class="${game.shopCat === c ? "on" : ""}">${iconHTML(itemIcon(shopAll().find((id) => itemCat(id) === c)), 16)}${c} <em>${shopAll().filter((id) => itemCat(id) === c).length}</em></button>`)
            .join("")}</div>`
        : ""
    }
    ${
      list.length
        ? `<div class="st-stage">
      <button class="st-nav" data-nav="-1" ${list.length < 2 ? "disabled" : ""} aria-label="Anterior">‹</button>
      <div class="st-track">${cards}</div>
      <button class="st-nav" data-nav="1" ${list.length < 2 ? "disabled" : ""} aria-label="Próximo">›</button>
      <div class="st-shelf"></div>
    </div>
    <div class="st-detail" id="stdetail"></div>
    ${list.length > 24 ? `<div class="st-count"><b id="stcount">${game.shopIdx + 1}</b> de ${list.length}<span class="st-bar"><i id="stbar" style="width:${((game.shopIdx + 1) / list.length) * 100}%"></i></span></div>` : `<div class="st-dots">${list.map((_, i) => `<i data-go="${i}"></i>`).join("")}</div>`}`
        : `<div class="st-empty">${iconHTML("bag", 40)}<p>Você não tem nada para vender aqui.</p></div>`
    }
    <footer class="st-keys"><span><kbd>←</kbd><kbd>→</kbd> passar</span><span><kbd>↑</kbd><kbd>↓</kbd> quantidade</span><span><kbd>Enter</kbd> ${game.shopTab === "buy" ? "comprar" : "vender"}</span><span><kbd>Tab</kbd> comprar/vender</span><span><kbd>Esc</kbd> sair</span></footer>
    <div class="st-tax">${taxNote()}${player.taxPaid ? ` · Você já pagou ${player.taxPaid} de imposto` : ""}</div>
  </div>`;
  byId("shclose").onclick = closeShop;
  const root = byId("shop");
  root.querySelectorAll("[data-t]").forEach(
    (b) =>
      (b.onclick = () => {
        shopSwitchTab(b.dataset.t);
      }),
  );
  root.querySelectorAll("[data-scat]").forEach(
    (b) =>
      (b.onclick = () => {
        game.shopCat = b.dataset.scat || null;
        game.shopIdx = 0;
        game.shopQty = 1;
        playSound(600, 0.03, "sine");
        renderShop();
      }),
  );
  root.querySelectorAll("[data-nav]").forEach((b) => (b.onclick = () => shopSlide(+b.dataset.nav)));
  root.querySelectorAll("[data-go]").forEach(
    (b) =>
      (b.onclick = () => {
        const i = +b.dataset.go;
        if (i === game.shopIdx) return shopConfirm();
        game.shopIdx = i;
        game.shopQty = 1;
        playSound(520, 0.03, "sine");
        shopFocus();
      }),
  );
  const stage = root.querySelector(".st-stage");
  if (stage) {
    stage.onpointerdown = (e) => (game.swipeX = e.clientX);
    stage.onpointerup = (e) => {
      const dx = e.clientX - (game.swipeX ?? e.clientX);
      if (Math.abs(dx) > 40) shopSlide(dx < 0 ? 1 : -1);
    };
    stage.onwheel = (e) => {
      if (Math.abs(e.deltaY) + Math.abs(e.deltaX) < 20) return;
      e.preventDefault();
      shopSlide(e.deltaY + e.deltaX > 0 ? 1 : -1);
    };
  }
  shopFocus();
  clearInterval(game.cosAnim);
  const dk = () => drawKeeper(byId("stk"), keeper);
  dk();
  game.cosAnim = setInterval(dk, 120);
}

/** Atualiza só o leque e o painel: os cartões deslizam com transição. */
function shopFocus() {
  const root = byId("shop");
  const list = game.shopList || [];
  const n = list.length;
  if (!n) return;
  const cards = root.querySelectorAll(".st-card");
  cards.forEach((c, i) => {
    let d = i - game.shopIdx;
    if (n > 2) {
      if (d > n / 2) d -= n;
      if (d < -n / 2) d += n;
    }
    // Cartão que dá a volta (do fim para o começo) troca de lado sem atravessar a prateleira.
    const prev = c.dataset.d == null ? d : +c.dataset.d;
    c.dataset.d = d;
    if (Math.abs(d - prev) > 2) {
      c.style.transition = "none";
      requestAnimationFrame(() => requestAnimationFrame(() => (c.style.transition = "")));
    }
    const a = Math.abs(d);
    c.classList.toggle("on", d === 0);
    c.style.transform = `translateX(calc(-50% + ${d * 10}em)) translateY(${a ? 0.9 + a * 0.3 : 0}em) scale(${d === 0 ? 1.12 : a === 1 ? 0.86 : 0.7}) rotate(${d * 2}deg)`;
    c.style.opacity = a > 2 ? 0 : d === 0 ? 1 : a === 1 ? 0.75 : 0.4;
    c.style.zIndex = 10 - a;
    c.style.pointerEvents = a > 2 ? "none" : "auto";
    c.tabIndex = d === 0 ? 0 : -1;
  });
  root.querySelectorAll(".st-dots i").forEach((dot, i) => dot.classList.toggle("on", i === game.shopIdx));
  if (byId("stcount")) {
    byId("stcount").textContent = game.shopIdx + 1;
    byId("stbar").style.width = ((game.shopIdx + 1) / n) * 100 + "%";
  }
  const id = list[game.shopIdx],
    it = ITEMS[id];
  const r = rarityOf(it.preco, it.lend);
  const { pr, base } = shopPrice(id);
  const buy = game.shopTab === "buy";
  const lock = buy && it.req && guardiansFreed() < it.req;
  const maxQ = buy ? Math.max(1, Math.min(10, Math.floor(player.gold / Math.max(1, pr)))) : itemCount(id) - (Object.values(player.eq).includes(id) ? 1 : 0);
  game.shopQty = canStack(it) ? Math.max(1, Math.min(game.shopQty || 1, maxQ)) : 1;
  const q = game.shopQty;
  const total = pr * q;
  const owned = itemCount(id);
  const equipped = Object.values(player.eq).includes(id);
  const stats = itemStatChips(it)
    .map(([ic, tx]) => `<span class="st-chip">${iconHTML(ic, 14)}${tx}</span>`)
    .join("");
  const action = lock
    ? `<div class="st-locked">${iconHTML("lock", 16)}Libere ${it.req} Guardião(ões) para comprar</div>`
    : buy
      ? `<button class="sl-buy st-buy" data-b="${id}" ${player.gold >= total ? "" : "disabled"}>${player.gold >= total ? `Comprar${q > 1 ? ` ${q}×` : ""}` : "Ouro insuficiente"}</button>`
      : `<button class="sl-buy st-buy sell" data-s="${id}">${iconHTML("bag", 18)}Vender${q > 1 ? ` ${q}×` : ""}</button>`;
  byId("stdetail").innerHTML = `
    <div class="st-info">
      <div class="st-title"><span>${it.nome}</span><em style="--rc:${r.c}">${r.n}</em></div>
      <div class="st-meta">${iconHTML(itemIcon(id), 14)}${ITEM_TYPE_NAMES[it.tipo] || "Item"}${owned ? ` · você tem <b>${owned}</b>` : ""}${equipped ? " · <b style='color:#7ad36b'>equipado</b>" : ""}</div>
      <p class="st-desc">${it.desc || ""}</p>
      ${stats ? `<div class="st-chips">${stats}</div>` : ""}
    </div>
    <div class="st-buybox">
      <div class="st-price">${iconHTML("coin", 20)}<b>${total}</b><small>${q > 1 ? `${pr} cada` : buy && pr > base ? `${base} + ${pr - base} imposto` : buy ? "sem imposto" : "após imposto"}</small></div>
      ${
        canStack(it) && !lock
          ? `<div class="st-qty"><button data-q="-1" ${q <= 1 ? "disabled" : ""}>−</button><span>${q}</span><button data-q="1" ${q >= maxQ ? "disabled" : ""}>+</button></div>`
          : ""
      }
      ${action}
    </div>`;
  const det = byId("stdetail");
  det.querySelectorAll("[data-q]").forEach((b) => (b.onclick = () => shopQty(+b.dataset.q)));
  const bb = det.querySelector("[data-b]");
  if (bb) bb.onclick = () => shopBuy(id);
  const sb = det.querySelector("[data-s]");
  if (sb) sb.onclick = () => shopSell(id);
}
function shopQty(d) {
  game.shopQty = (game.shopQty || 1) + d;
  playSound(660, 0.02, "sine");
  shopFocus();
}
function shopSwitchTab(t) {
  game.shopTab = t || (game.shopTab === "buy" ? "sell" : "buy");
  game.shopCat = null;
  game.shopIdx = 0;
  game.shopQty = 1;
  keeperSays(game.shopTab === "buy" ? "hello" : "look");
  renderShop();
}
function shopBuy(id) {
  const it = ITEMS[id];
  const { base, pr } = shopPrice(id);
  const q = game.shopQty || 1;
  if (player.gold < pr * q) {
    keeperSays("poor");
    playSound(160, 0.1, "square");
    return renderShop();
  }
  for (let i = 0; i < q; i++) {
    payWithTax(base);
    addItem(id);
  }
  if (game.shopId === "rosa" || game.shopId === "bruno") player.flags.bought = true;
  playSound(880, 0.08, "sine");
  setTimeout(() => playSound(1175, 0.08, "sine"), 70);
  toast(`Comprou: ${q > 1 ? q + "× " : ""}${it.nome}` + (it.tipo === "equip" ? " · equipe no inventário (I)" : ""), 1800, itemIcon(id));
  keeperSays("buy");
  game.shopQty = 1;
  saveGame();
  renderShop();
  const c = byId("shop").querySelector(".st-card.on");
  if (c) c.classList.add("pop");
}
function shopSell(id) {
  const it = ITEMS[id];
  const q = game.shopQty || 1;
  for (let i = 0; i < q; i++) {
    player.gold += saleAfterTax(Math.floor(it.preco / 2));
    removeItem(id);
  }
  playSound(600, 0.08, "sine");
  keeperSays("sell");
  game.shopQty = 1;
  saveGame();
  renderShop();
}
/** Passa o carrossel para o próximo (1) ou anterior (-1). */
function shopSlide(d) {
  const n = (game.shopList || []).length;
  if (!n) return;
  game.shopIdx = (game.shopIdx + d + n) % n;
  game.shopQty = 1;
  playSound(520, 0.03, "sine");
  if (Math.random() < 0.15) {
    keeperSays("look");
    const l = byId("stline");
    if (l) l.textContent = game.keeperLine;
  }
  shopFocus();
}
/** Enter compra (ou vende, ou veste) o item do meio. */
function shopConfirm() {
  const b = byId("shop").querySelector(".sl-buy:not([disabled])");
  if (b) b.click();
}

/* ===================== ALFAIATARIA E SALÃO ===================== */

function cosPrice(cpr) {
  return withTax(cpr);
}
function renderCosmetic() {
  const sh = COS_SHOPS[game.cosKind];
  game.cosCat = sh.cats.includes(game.cosCat) ? game.cosCat : sh.cats[0];
  const cat = game.cosCat;
  const list = COSMETICS[cat].filter(
    ([id, , pr]) => !((pr === 0 && game.cosKind !== "roupa" && game.cosKind !== "cabelo") || (pr >= 9999 && !cosOwned(cat, id))),
  );
  game.cosList = list;
  game.cosIdx = Math.max(0, Math.min(list.length - 1, game.cosIdx || 0));
  if (!game.keeperLine) keeperSays("hello");
  const keeper = shopKeeperName("__cos");
  const swatch = cat === "hair" || cat === "robe";
  const cards = list
    .map(([id, nm, pr], i) => {
      const own = cosOwned(cat, id);
      return `<button class="st-card cos${own ? " owned" : ""}" data-go="${i}" style="--rc:${own ? "#7ad36b" : rarityOf(pr).c}">
        <span class="st-gem"></span>
        <span class="st-ic">${swatch ? `<span class="st-sw" style="background:${id}"></span>` : `<canvas class="st-pv" data-pv="${i}" width="72" height="72"></canvas>`}</span>
        <span class="st-nm">${nm}</span>
        <span class="st-tag">${own ? "seu" : `${iconHTML("coin", 12)}${cosPrice(pr)}`}</span>
      </button>`;
    })
    .join("");
  byId("shop").innerHTML = `<div class="store slider cosstore">
    <header class="st-head">
      <div class="st-sign"><span class="st-sign-ic">${iconHTML("shirt", 22)}</span><div><b>${sh.nome}</b><small>${sh.sub}</small></div></div>
      <div class="st-purse">${iconHTML("coin", 18)}<b>${player.gold}</b><small>ouro</small></div>
      <button id="shclose" class="st-x" title="Fechar (Esc)">✕</button>
    </header>
    <div class="st-top">
      <div class="st-keeper"><canvas id="stk" width="80" height="80"></canvas><div class="st-bubble"><b>${keeper.split(",")[0]}</b><span id="stline">${game.keeperLine}</span></div></div>
      <div class="st-tabs">${sh.cats.map((c) => `<button data-cat="${c}" class="${c === cat ? "on" : ""}">${iconHTML(COSMETIC_ICONS[c] || "shirt")}${COS_NAMES[c]}</button>`).join("")}</div>
    </div>
    <div class="st-cosmain">
      <div class="st-mirror">
        <canvas id="cosc" width="160" height="160"></canvas>
        <div class="st-mirror-bar"><button id="cosrot">↻ Girar</button><span>Espelho</span></div>
      </div>
      <div class="st-cosright">
        <div class="st-stage small">
          <button class="st-nav" data-cnav="-1" ${list.length < 2 ? "disabled" : ""} aria-label="Anterior">‹</button>
          <div class="st-track">${cards}</div>
          <button class="st-nav" data-cnav="1" ${list.length < 2 ? "disabled" : ""} aria-label="Próximo">›</button>
          <div class="st-shelf"></div>
        </div>
        <div class="st-detail" id="stdetail"></div>
      </div>
    </div>
    <footer class="st-keys"><span><kbd>←</kbd><kbd>→</kbd> passar</span><span><kbd>Enter</kbd> comprar / vestir</span><span><kbd>Tab</kbd> categoria</span><span><kbd>Esc</kbd> sair</span></footer>
    <div class="st-tax">O espelho já mostra como fica. Troque o visual quando quiser no inventário (I) → Aparência, ou em casa.</div>
  </div>`;
  const root = byId("shop");
  byId("shclose").onclick = () => {
    game.tryOn = null;
    clearInterval(game.cosAnim);
    closeShop();
  };
  byId("cosrot").onclick = () => {
    const o = ["down", "left", "up", "right"];
    game.cosDir = o[(o.indexOf(game.cosDir || "down") + 1) % 4];
  };
  root.querySelectorAll("[data-cat]").forEach((b) => (b.onclick = () => cosCategory(b.dataset.cat)));
  root.querySelectorAll("[data-cnav]").forEach((b) => (b.onclick = () => cosSlide(+b.dataset.cnav)));
  root.querySelectorAll("[data-go]").forEach(
    (b) =>
      (b.onclick = () => {
        const i = +b.dataset.go;
        if (i === game.cosIdx) return shopConfirm();
        game.cosIdx = i;
        playSound(520, 0.03, "sine");
        cosFocus();
      }),
  );
  const stage = root.querySelector(".st-stage");
  stage.onpointerdown = (e) => (game.swipeX = e.clientX);
  stage.onpointerup = (e) => {
    const dx = e.clientX - (game.swipeX ?? e.clientX);
    if (Math.abs(dx) > 40) cosSlide(dx < 0 ? 1 : -1);
  };
  cosFocus();
  root.querySelectorAll("[data-pv]").forEach((cv) => drawPreview(cv, Object.assign({}, player.look, { [cat]: list[+cv.dataset.pv][0] }), "down"));
  game.cosDir = game.cosDir || "down";
  clearInterval(game.cosAnim);
  const dr = () => {
    const look = game.tryOn ? Object.assign({}, player.look, { [game.tryOn.c]: game.tryOn.id }) : player.look;
    if (byId("cosc")) drawPreview(byId("cosc"), look, game.cosDir);
    drawKeeper(byId("stk"), keeper);
  };
  dr();
  game.cosAnim = setInterval(dr, 150);
}
function cosFocus() {
  const root = byId("shop");
  const list = game.cosList || [];
  const n = list.length;
  if (!n) return;
  root.querySelectorAll(".st-card").forEach((c, i) => {
    let d = i - game.cosIdx;
    if (n > 4) {
      if (d > n / 2) d -= n;
      if (d < -n / 2) d += n;
    }
    const a = Math.abs(d);
    c.classList.toggle("on", d === 0);
    c.style.transform = `translateX(calc(-50% + ${d * 9}em)) translateY(${a ? 0.7 + a * 0.3 : 0}em) scale(${d === 0 ? 1.05 : a === 1 ? 0.82 : 0.66}) rotate(${d * 2}deg)`;
    c.style.opacity = a > 2 ? 0 : d === 0 ? 1 : a === 1 ? 0.75 : 0.4;
    c.style.zIndex = 10 - a;
    c.style.pointerEvents = a > 2 ? "none" : "auto";
  });
  const cat = game.cosCat;
  const [cid, cnm, cpr] = list[game.cosIdx];
  const own = cosOwned(cat, cid),
    on = player.look[cat] === cid;
  game.tryOn = !on ? { c: cat, id: cid } : null;
  const pr = cosPrice(cpr);
  const r = own ? { n: "Seu", c: "#7ad36b" } : rarityOf(cpr);
  byId("stdetail").innerHTML = `
    <div class="st-info">
      <div class="st-title"><span>${cnm}</span><em style="--rc:${r.c}">${r.n}</em></div>
      <div class="st-meta">${iconHTML(COSMETIC_ICONS[cat] || "shirt", 14)}${COS_NAMES[cat]} · ${game.cosIdx + 1} de ${n}</div>
      <p class="st-desc">${on ? "É o que você está usando agora." : own ? "Já é seu. Quer vestir?" : "Veja no espelho como fica antes de comprar."}</p>
    </div>
    <div class="st-buybox">
      ${own ? "" : `<div class="st-price">${iconHTML("coin", 20)}<b>${pr}</b><small>${pr > cpr ? `${cpr} + ${pr - cpr} imposto` : "sem imposto"}</small></div>`}
      ${
        on
          ? `<div class="st-locked" style="color:#7ad36b">${iconHTML("shirt", 16)}Você está usando</div>`
          : own
            ? `<button class="sl-buy st-buy" data-wear="1">${iconHTML("shirt", 18)}Vestir</button>`
            : `<button class="sl-buy st-buy" data-buy="1" ${player.gold >= pr ? "" : "disabled"}>${player.gold >= pr ? "Comprar e vestir" : "Ouro insuficiente"}</button>`
      }
    </div>`;
  const det = byId("stdetail");
  const bw = det.querySelector("[data-wear]");
  if (bw)
    bw.onclick = () => {
      player.look[cat] = cid;
      game.tryOn = null;
      playSound(700, 0.08, "sine");
      keeperSays("buy");
      saveGame();
      renderCosmetic();
    };
  const bb = det.querySelector("[data-buy]");
  if (bb)
    bb.onclick = () => {
      if (player.gold < pr) {
        keeperSays("poor");
        return renderCosmetic();
      }
      payWithTax(cpr);
      (player.owned[cat] = player.owned[cat] || []).push(cid);
      player.look[cat] = cid;
      game.tryOn = null;
      playSound(880, 0.08, "sine");
      toast(`Comprou: ${cnm}`, 1800, COSMETIC_ICONS[cat] || "shirt");
      keeperSays("buy");
      saveGame();
      renderCosmetic();
    };
}
function cosCategory(c) {
  const cats = COS_SHOPS[game.cosKind].cats;
  game.cosCat = c || cats[(cats.indexOf(game.cosCat) + 1) % cats.length];
  game.cosIdx = 0;
  renderCosmetic();
}
function cosSlide(d) {
  const n = (game.cosList || []).length;
  if (!n) return;
  game.cosIdx = (game.cosIdx + d + n) % n;
  playSound(520, 0.03, "sine");
  cosFocus();
}
