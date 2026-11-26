/**
 * ECOS DO ARCANO — tutoriais.js
 * Tutoriais curtos que aparecem na primeira vez que você encontra cada
 * mecânica (andar, menu pizza, necessidades, tempo, trabalho, balcão,
 * comércio, encontros, lojas, inventário, corações, bichinhos, exílio...).
 * Cada um é um cartão com poucas páginas; o jogo pausa enquanto você lê.
 * No Menu há a seção "Tutoriais" para rever qualquer um ou desligar as dicas.
 * Modifica (envolve) funções de outros arquivos: update, renderOptions,
 * startJob, openInv, openShop, renderPie, openHearts, petShelter.
 */

"use strict";

(() => {
  const TUTS = {
    basico: {
      n: "Primeiros passos",
      icon: "boots",
      pages: [
        "<b>Andar:</b> setas ou WASD no computador. No celular, arraste o dedo no joystick do canto da tela (ou toque no chão para onde quer ir).",
        "<b>Interagir:</b> chegue perto de alguém ou de alguma coisa e aperte <b>E</b> (ou o botão de ação). Embaixo da tela aparece o que vai acontecer.",
        "<b>Menu:</b> o botão Menu (ou Esc) tem opções, tela cheia, salvar e estes tutoriais. O <b>Inventário</b> abre com I.",
      ],
    },
    pizza: {
      n: "Menu de interação",
      icon: "chat",
      pages: [
        "Ao falar com uma pessoa, as opções aparecem em volta dela, em <b>grupos</b>: Amigável, Romântico, Engraçado, Serviços...",
        "Toque num grupo para ver as ações dele. <b>Voltar</b> retorna aos grupos; o <b>✕</b> no meio fecha. A pessoa fica parada enquanto vocês conversam.",
      ],
    },
    necessidades: {
      n: "Necessidades",
      icon: "stew",
      mode: "vida",
      pages: [
        "No Simulador você tem <b>fome, sede, energia, higiene e diversão</b>. Elas ficam no painel do canto.",
        "Coma e beba (barra de baixo, teclas 1 a 9), durma em casa, tome banho e se divirta. Necessidades baixas deixam você doente e diminuem o pagamento no trabalho.",
      ],
    },
    tempo: {
      n: "O tempo",
      icon: "sun",
      mode: "vida",
      pages: [
        "O relógio fica no canto de cima. Os botões ao lado <b>pausam</b> e <b>aceleram</b> o tempo.",
        "Lojas e trabalhos têm horário. À noite a vila dorme. O ano tem 30 dias e você envelhece a cada ano.",
      ],
    },
    trabalho: {
      n: "Trabalhar",
      icon: "hammer",
      pages: [
        "Escolha um trabalho no <b>Quadro de Trabalhos</b> (o mural da praça). O turno dura algumas horas.",
        "Siga a <b>seta</b> até o local. Ofícios como padeiro, ferreiro e taverneiro trabalham <b>dentro</b> do prédio: é só entrar.",
        "Cada ofício tem o seu minijogo. Capricho e rapidez rendem mais. No fim do turno o patrão te avalia: bônus, ou advertência se houver muitas reclamações (3 advertências = demissão por 3 dias).",
      ],
    },
    balcao: {
      n: "Atrás do balcão",
      icon: "mug",
      pages: [
        "Você está no lugar do dono. Os clientes entram e fazem <b>fila</b> do outro lado do balcão.",
        "A barrinha em cima de cada um é a <b>paciência</b>. Olhe para o balcão na frente do cliente e aperte E para atender.",
        "Na taverna, as <b>mesas</b> também pedem: prepare no balcão, carregue a bandeja e entregue na mesa certa.",
      ],
    },
    comercio: {
      n: "Seu comércio",
      icon: "coin",
      pages: [
        "Agora você é dono de um negócio! Toda manhã os aldeões compram e sai o <b>livro-caixa</b> do dia anterior.",
        "<b>Lucro</b> = vendas − imposto − salário do atendente − aluguel − custo da mercadoria − perdas. Comida parada estraga; sem cadeado, pode ter furto.",
        "Fale com o atendente no balcão para comprar estoque, mudar o preço (caro vende menos), contratar e retirar o caixa. Se a dívida passar de 300, o negócio vai à falência.",
      ],
    },
    encontro: {
      n: "Encontros",
      icon: "heart",
      pages: [
        "A pessoa vai te esperar no lugar combinado por umas 3 horas. Vá até lá e fale com ela.",
        "As opções do encontro ficam no grupo <b>Romântico</b> do menu de interação. Para chamar alguém de novo, use <b>Convidar para encontro</b> no Inventário.",
      ],
    },
    inventario: {
      n: "Inventário",
      icon: "bag",
      pages: [
        "Toque num item para ver o que ele faz e os botões de usar. Equipamentos vão nos espaços em volta do seu personagem.",
        "A <b>barra de baixo</b> é a sua mão: coloque comidas e poções nela e use com as teclas 1 a 9. Aqui também tem <b>Convidar para encontro</b>.",
      ],
    },
    loja: {
      n: "Lojas",
      icon: "coin",
      pages: [
        "Use as setas (ou arraste) para passar os produtos. O preço já vem com o <b>Imposto Real</b>.",
        "Na aba de venda você vende o que tem na bolsa. Amigos do dono dão desconto.",
      ],
    },
    coracoes: {
      n: "Corações",
      icon: "heart",
      pages: [
        "Aqui você conhece gente nova: deslize para curtir ou passar. Se der par, vocês viram contatos.",
        "Pelos contatos dá para marcar encontros. A amizade sobe conversando, dando presentes e saindo junto.",
      ],
    },
    pets: {
      n: "Bichinhos",
      icon: "paw",
      pages: [
        "Adote um bichinho no abrigo. Ele te segue pela vila.",
        "Dê comida, banho e carinho, ensine truques e leve para passear. Bichinho bem cuidado fica feliz; abandonado fica triste.",
      ],
    },
    exilio: {
      n: "Exílio",
      icon: "skull",
      pages: [
        "Você foi exilado de Cinzaluz por 30 dias. O guarda da entrada não deixa você passar.",
        "De <b>capuz</b> dá para entrar escondido, mas um guarda patrulha a vila. Se ele te vir de perto, te expulsa. Fuja para longe para despistar.",
      ],
    },
  };

  const seen = () => (player.tuts = player.tuts || {});
  // "Não, já sei jogar" vale para tudo: nenhum cartão de tutorial abre sozinho
  const tipsOn = () => settings.tutTips !== false && !(player && player.noTips);
  const pending = [];
  let cur = null;

  function tutOnce(id) {
    const T = TUTS[id];
    if (!T || !tipsOn() || !player || seen()[id]) return;
    if (T.mode === "vida" && !lifeMode()) return;
    if (pending.includes(id) || (cur && cur.id === id)) return;
    seen()[id] = true;
    pending.push(id);
  }
  function show(id, replay) {
    const T = TUTS[id];
    let el = byId("tutc");
    if (!el) {
      el = document.createElement("div");
      el.id = "tutc";
      el.className = "ui";
      byId("screen").appendChild(el);
    }
    cur = { id, p: 0, prev: game.mode, replay };
    game.mode = "tutc";
    el.style.display = "flex";
    render();
  }
  function render() {
    const el = byId("tutc"),
      T = TUTS[cur.id],
      last = cur.p >= T.pages.length - 1;
    el.innerHTML = `<div class="tc-card"><div class="tc-h">${iconHTML(T.icon, 28)}<div><small>Tutorial</small><h3>${T.n}</h3></div></div>
      <p>${T.pages[cur.p]}</p>
      <div class="tc-dots">${T.pages.map((_, i) => `<i class="${i === cur.p ? "on" : ""}"></i>`).join("")}</div>
      <div class="tc-b">${cur.p ? `<button id="tcprev">Voltar</button>` : `<span></span>`}<button id="tcnext" class="go">${last ? "Entendi!" : "Próximo"}</button></div></div>`;
    byId("tcnext").onclick = next;
    const pv = byId("tcprev");
    if (pv) pv.onclick = () => ((cur.p = Math.max(0, cur.p - 1)), render());
  }
  function next() {
    if (!cur) return;
    if (cur.p < TUTS[cur.id].pages.length - 1) return cur.p++, render();
    byId("tutc").style.display = "none";
    const prev = cur.prev;
    cur = null;
    game.mode = prev === "tutc" || prev === "options" ? "world" : prev;
    saveGame && saveGame();
  }
  KEY_HANDLERS.tutc = (k, e) => {
    if (e && e.repeat) return;
    if (k === "e" || k === " " || k === "enter" || k === "arrowright") next();
    else if (k === "escape") (cur.p = TUTS[cur.id].pages.length - 1), next();
  };
  if (typeof BEFORE_DIALOG !== "undefined") BEFORE_DIALOG.add("tutc");

  /* ----- quando mostrar ----- */
  let worldT = 0;
  const upBase = update;
  update = function (dt) {
    upBase(dt);
    if (!player || game.mode === "title") return;
    // na cena final do jogo não aparece tutorial (e um cartão aberto some)
    if (game.ep || game.rollDone || game.mode === "end" || game.mode === "rollcred") {
      if (cur && game.mode !== "tutc") ((byId("tutc").style.display = "none"), (cur = null));
      return;
    }
    if (game.mode === "world" && !game.dialog && !game.tour) {
      worldT += dt;
      if (worldT > 1.2) tutOnce("basico");
      if (worldT > 25) tutOnce("necessidades");
      if (worldT > 70) tutOnce("tempo");
      if (player.zone === "interior" && game.inter && game.inter.work) tutOnce("balcao");
      if (player.biz && Object.keys(player.biz).length) tutOnce("comercio");
      if (game.date) tutOnce("encontro");
      if (typeof exileOn === "function" && player.exiled && exileOn()) tutOnce("exilio");
      if (pending.length && !cur) show(pending.shift());
    }
  };
  const wrap = (name, id, after) => {
    if (typeof window[name] !== "function") return;
    const base = window[name];
    window[name] = function () {
      const r = base.apply(this, arguments);
      if (tipsOn() && player && !seen()[id] && (!TUTS[id].mode || lifeMode())) {
        seen()[id] = true;
        // só abre por cima se a mesma tela ainda estiver aberta; se o jogador já
        // saiu (e entrou numa luta, por exemplo), espera a volta ao mundo
        const m0 = game.mode;
        if (after) setTimeout(() => (!cur && game.mode === m0 ? show(id) : pending.includes(id) || pending.push(id)), 250);
      }
      return r;
    };
  };
  // Telas abertas por cima do mundo: mostra o tutorial por cima delas.
  for (const [fn, id] of [
    ["openInv", "inventario"],
    ["openShop", "loja"],
    ["openHearts", "coracoes"],
    ["petShelter", "pets"],
  ])
    wrap(fn, id, true);
  // Trabalho e menu pizza: entram na fila e aparecem quando o jogo voltar.
  if (typeof startJob === "function") {
    const sj = startJob;
    startJob = function () {
      const r = sj.apply(this, arguments);
      tutOnce("trabalho");
      return r;
    };
  }
  if (typeof renderPie === "function") {
    const rp = renderPie;
    renderPie = function () {
      const r = rp.apply(this, arguments);
      if (r && tipsOn() && player && !seen().pizza) {
        seen().pizza = true;
        const m0 = game.mode;
        setTimeout(() => (!cur && game.mode === m0 ? show("pizza") : pending.includes("pizza") || pending.push("pizza")), 200);
      }
      return r;
    };
  }

  /* ----- seção no Menu ----- */
  const roBase = renderOptions;
  renderOptions = function () {
    roBase.apply(this, arguments);
    const box = byId("options");
    if (!box || box.querySelector("#optTuts")) return;
    const list = Object.entries(TUTS).filter(([, T]) => !T.mode || lifeMode());
    const html = `<div id="optTuts"><h3>Tutoriais</h3><div class="opt"><span>Dicas na primeira vez</span><div class="seg"><button data-tt="1" class="${tipsOn() ? "on" : ""}">Ligadas</button><button data-tt="0" class="${tipsOn() ? "" : "on"}">Desligadas</button></div></div>
      <div class="tc-list">${list.map(([id, T]) => `<button data-tut="${id}">${iconHTML(T.icon, 16)}${T.n}</button>`).join("")}</div></div>`;
    const help = [...box.querySelectorAll("h3")].find((h) => /Ajuda/.test(h.textContent));
    if (help) help.insertAdjacentHTML("beforebegin", html);
    else box.insertAdjacentHTML("beforeend", html);
    box.querySelectorAll("[data-tt]").forEach(
      (b) =>
        (b.onclick = () => {
          settings.tutTips = b.dataset.tt === "1";
          if (player) player.noTips = !settings.tutTips;
          saveSettings();
          box.querySelector("#optTuts").remove();
          renderOptions();
        }),
    );
    box.querySelectorAll("[data-tut]").forEach((b) => (b.onclick = () => show(b.dataset.tut, true)));
  };

  const st = document.createElement("style");
  st.textContent = `#tutc{position:absolute;inset:0;z-index:60;display:none;align-items:center;justify-content:center;background:rgba(8,5,16,.55)}
  #tutc .tc-card{width:min(92%,26em);background:linear-gradient(#2e2246,#1c1530);border:3px solid #c9a03a;border-radius:14px;padding:1em 1.1em;color:#fff;display:flex;flex-direction:column;gap:.7em;box-shadow:0 10px 40px rgba(0,0,0,.6)}
  #tutc .tc-h{display:flex;align-items:center;gap:.6em}#tutc .tc-h small{color:#c8b8e8;font-size:.75em;text-transform:uppercase;letter-spacing:.1em}
  #tutc h3{margin:0;font-family:"Pixelify Sans",sans-serif;color:#ffe08a}
  #tutc p{margin:0;line-height:1.45;font-size:1em}#tutc p b{color:#ffe08a}
  #tutc .tc-dots{display:flex;gap:.35em;justify-content:center}#tutc .tc-dots i{width:8px;height:8px;border-radius:50%;background:#4a3a6a}#tutc .tc-dots i.on{background:#ffe08a}
  #tutc .tc-b{display:flex;justify-content:space-between}
  #options .tc-list{display:flex;flex-wrap:wrap;gap:.4em;margin:.3em 0 .8em}
  #options .tc-list button{display:inline-flex;align-items:center;gap:.3em;font-size:.85em}`;
  document.head.appendChild(st);

  window.tutOnce = tutOnce;
  window.showTutorial = show;
})();
