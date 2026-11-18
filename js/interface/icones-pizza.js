/**
 * ECOS DO ARCANO — icones-pizza.js
 * Ícones novos do menu de interação (estilo The Sims): cada opção ganha um
 * ícone de pixel art desenhado em 12×12, branco e nítido, com contorno
 * escuro, em cima de um disco com a cor da categoria:
 *   amigável (verde) · romântico (rosa) · malvado (vermelho) · engraçado
 *   (amarelo) · família (azul) · serviços (dourado) · sair (cinza).
 * Modifica (envolve) renderPie.
 */

"use strict";

(() => {
  if (typeof renderPie !== "function") return;
  // "#" = traço branco; "o" = detalhe na cor da categoria
  const G = {
    chat: ["............", "..########..", ".##########.", ".###o##o###.", ".##########.", ".###oooo###.", ".##########.", "..########..", "...##.......", "..##........", ".##.........", "............"],
    heart: ["............", "..###..###..", ".#####.####.", "############", "############", "############", ".##########.", "..########..", "...######...", "....####....", ".....##.....", "............"],
    smile: ["....####....", "..########..", ".##########.", ".##o####o##.", "############", "############", "##o######o##", ".##oooooo##.", ".##########.", "..########..", "....####....", "............"],
    laugh: ["....####....", "..########..", ".#o#####o##.", ".##########.", "############", "##oooooooo##", "##o######o##", ".##oooooo##.", ".##########.", "..########..", "....####....", "............"],
    anger: ["#..........#", ".##......##.", "..##....##..", "...##..##...", "....####....", ".....##.....", "....####....", "...##..##...", "..##....##..", ".##......##.", "#..........#", "............"],
    gift: ["..##....##..", "...##..##...", "....####....", "############", "#####oo#####", "############", ".####oo####.", ".####oo####.", ".####oo####.", ".####oo####.", ".##########.", "............"],
    coin: ["....####....", "..########..", ".####oo####.", ".###oooo###.", "####oo######", "#####oo#####", "######oo####", ".###oooo###.", ".####oo####.", "..########..", "....####....", "............"],
    door: ["..########..", ".##########.", ".###o##o###.", ".##########.", ".###o##o###.", ".##########.", ".########o#.", ".##########.", ".###o##o###.", ".##########.", "############", "............"],
    hug: ["............", "...##..##...", "..####.####.", "..####.####.", "...##...##..", ".########.##", "##########.#", "#.########..", "..######....", "..##..##....", "..##..##....", "............"],
    star: [".....##.....", ".....##.....", "....####....", "############", ".##########.", "..########..", "...######...", "...######...", "..###..###..", "..##....##..", ".##......##.", "............"],
    advice: ["....####....", "..##....##..", "..##....##..", "........##..", "......###...", ".....##.....", ".....##.....", "............", ".....##.....", ".....##.....", "............", "............"],
    house: [".....##.....", "....####....", "...######...", "..########..", ".##########.", "############", ".##########.", ".###oo#####.", ".###oo##oo#.", ".###oo#####.", ".##########.", "............"],
    note: ["......#####.", "......#####.", "......#...#.", "......#...#.", "......#...#.", "......#...#.", "......#...#.", "..####..####", ".#####.#####", ".#####.#####", "..###...###.", "............"],
    drink: ["............", ".########...", ".#oooooo####", ".#oooooo#..#", ".########..#", ".########..#", ".########..#", ".#########.#", ".########...", ".########...", "..######....", "............"],
    kiss: ["............", "............", "..###..###..", ".#####.####.", "####oo##oo##", "############", ".###oooo###.", "..########..", "...######...", "............", "............", "............"],
    dance: [".....##.....", ".....##.....", "...######...", "..#.####.#..", ".#..####..#.", ".....##.....", "....####....", "...##..##...", "..##....##..", ".##......##.", "............", "............"],
    book: ["............", ".#####.####.", ".#ooo#.#oo#.", ".#####.####.", ".#ooo#.#oo#.", ".#####.####.", ".#ooo#.#oo#.", ".#####.####.", ".#####.####.", "............", "............", "............"],
    fist: ["............", "..########..", ".#o#o#o#o##.", ".##########.", ".##########.", "############", "############", ".##########.", "..########..", "...######...", "............", "............"],
  };
  const CAT = {
    Amigável: ["#3a9a5a", "#2a6a3e"],
    Romântico: ["#e05a8a", "#a03a62"],
    Malvado: ["#c83a3a", "#8a2222"],
    Engraçado: ["#e8b030", "#a87a18"],
    Família: ["#3a7ac8", "#2a5490"],
    Serviços: ["#c9902a", "#8a6018"],
    Sair: ["#7a7488", "#4e4a5a"],
    Interações: ["#7a5ac8", "#54388e"],
    Mais: ["#5a7a9a", "#3a546e"],
  };
  // qual desenho para qual opção (pelas palavras do texto)
  const PICK = [
    [/^(Sair|Fechar|Cancelar|Agora não|Só olhar|Ir embora|Voltar)/i, "door"],
    [/beij/i, "kiss"],
    [/dan[çc]/i, "dance"],
    [/abra[çc]|carinho|cócegas/i, "hug"],
    [/flert|namor|casamento|♥|encontro|romant|amor/i, "heart"],
    [/piada|brincar|engra|toca aqui|rir/i, "laugh"],
    [/discut|insult|briga|grosseir|fofoc|terminar|divórcio|soco|bater|ameaç/i, "anger"],
    [/presente|dar /i, "gift"],
    [/compr|vend|pag|troc|ouro|empréstimo|dívida|trabalh/i, "coin"],
    [/elogi|cumpriment|admir/i, "star"],
    [/conselho|pergunt|ensin|aprend/i, "advice"],
    [/filho|família|casa|morar|mudar/i, "house"],
    [/música|cant|tocar|bardo/i, "note"],
    [/beber|cerveja|hidromel|vinho|água/i, "drink"],
    [/livro|ler|carta|escrev/i, "book"],
    [/lutar|duelo|treinar/i, "fist"],
    [/conversar|papo|falar|ouvir|contar/i, "chat"],
  ];
  const glyphFor = (t) => (PICK.find(([re]) => re.test(t)) || [0, null])[1];
  const cache = {};
  function img(key, cat) {
    const id = key + "|" + cat;
    if (cache[id]) return cache[id];
    const [fill, dark] = CAT[cat] || CAT.Mais;
    const S = 3,
      N = 12,
      P = 3; // escala, tamanho, margem
    const c = document.createElement("canvas");
    c.width = c.height = (N + P * 2) * S;
    const q = c.getContext("2d");
    // disco da categoria com borda e brilho
    const R = c.width / 2;
    q.fillStyle = dark;
    q.beginPath();
    q.arc(R, R, R, 0, 7);
    q.fill();
    q.fillStyle = fill;
    q.beginPath();
    q.arc(R, R, R - S, 0, 7);
    q.fill();
    q.fillStyle = "rgba(255,255,255,.22)";
    q.beginPath();
    q.ellipse(R - S * 2, R - S * 3, R * 0.55, R * 0.32, -0.5, 0, 7);
    q.fill();
    const rows = G[key];
    const px = (x, y, col) => ((q.fillStyle = col), q.fillRect((P + x) * S, (P + y) * S, S, S));
    // contorno escuro em volta do desenho, depois o desenho branco
    for (let y = 0; y < N; y++)
      for (let x = 0; x < N; x++)
        if (rows[y][x] !== ".")
          for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
            const nx = x + dx,
              ny = y + dy;
            if (nx < 0 || ny < 0 || nx >= N || ny >= N || rows[ny][nx] === ".") px(nx, ny, "rgba(20,10,30,.55)");
          }
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (rows[y][x] === "#") px(x, y, "#ffffff");
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (rows[y][x] === "o") px(x, y, dark);
    return (cache[id] = c.toDataURL());
  }
  const base = renderPie;
  renderPie = function (title, text, opts) {
    const r = base.apply(this, arguments);
    const el = byId("pie");
    if (!r || !el) return r;
    el.querySelectorAll(".pie-opt").forEach((b) => {
      const label = b.querySelector("span:last-child");
      const t = (label && label.textContent) || "";
      const plain = t.replace(/\s*\(\d+\)$/, "");
      const grp = PIE_GROUPS.find((g) => g.n === plain) ? plain : pieGroupOf(t);
      const cat = CAT[grp] ? grp : /^(Sair|Voltar|Fechar|Ir embora)/i.test(t) ? "Sair" : "Mais";
      const groupGlyph = { Amigável: "smile", Romântico: "heart", Malvado: "anger", Engraçado: "laugh", Família: "house", Serviços: "coin", Sair: "door", Interações: "chat" }[plain];
      const key = groupGlyph || glyphFor(t) || { Amigável: "smile", Romântico: "heart", Malvado: "anger", Engraçado: "laugh", Família: "house", Serviços: "coin", Sair: "door" }[cat] || "chat";
      const ic = b.querySelector(".pie-ic");
      if (ic) ic.innerHTML = `<img class="pie-glyph" src="${img(key, cat)}" alt="">`;
      b.classList.add("cat-" + cat.normalize("NFD").replace(/[^\w]/g, "").toLowerCase());
    });
    return r;
  };
  const st = document.createElement("style");
  st.textContent = `#pie .pie-ic{background:none!important;border:none!important;box-shadow:none!important;width:30px!important;height:30px!important;display:inline-flex;align-items:center;justify-content:center;padding:0!important}
  #pie .pie-glyph{width:30px;height:30px;image-rendering:pixelated;filter:drop-shadow(0 2px 0 rgba(20,10,30,.35))}
  #pie .pie-opt.cat-amigavel{border-color:#3a9a5a}#pie .pie-opt.cat-romantico{border-color:#e05a8a}#pie .pie-opt.cat-malvado{border-color:#c83a3a}
  #pie .pie-opt.cat-engracado{border-color:#e8b030}#pie .pie-opt.cat-familia{border-color:#3a7ac8}#pie .pie-opt.cat-servicos{border-color:#c9902a}#pie .pie-opt.cat-sair{border-color:#7a7488}`;
  document.head.appendChild(st);
})();
