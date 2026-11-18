/**
 * ECOS DO ARCANO — menus-medievais.js
 * As caixas de escolha deixam de ser uma lista roxa e viram peças medievais:
 *  - Padrão: pergaminho numa moldura de madeira com cravos de ferro, título
 *    numa faixa de madeira e as opções como cartões com ícone num medalhão.
 *  - Cardápios e bebidas: lousa de giz da taverna, com o preço numa
 *    plaquinha de cobre à direita.
 *  - Festas: cartaz de festa, com bandeirolas no alto.
 * As janelas dos minijogos usam a mesma moldura de madeira e pergaminho.
 * Modifica (envolve) funções de outros arquivos: choice.
 */

"use strict";

(() => {
  const chBase = choice;
  choice = function (title, text, opts) {
    const r = chBase.apply(this, arguments);
    const el = byId("choice");
    if (!el || el.style.display === "none") return r;
    const kind = /Cardápio|Bebidas|bebida|cardápio/i.test(title + " " + text) ? "chalk" : /^Festival|Costumes da festa|Torneio/i.test(title) ? "poster" : "parch";
    el.classList.remove("chalk", "poster", "parch");
    el.classList.add("med", kind);
    el.querySelectorAll(".btns button").forEach((b, i) => {
      if (b.dataset.med) return;
      b.dataset.med = 1;
      const ic = b.querySelector(".pxi, img, svg, i");
      let label = b.textContent.replace(/^\s*\d+\.\s*/, "").trim();
      let price = "";
      const m = label.match(/\s*[·(]\s*(\d+)\s*(?:de\s*)?ouro\)?\s*$/i);
      if (m) (price = m[1]), (label = label.slice(0, m.index).trim());
      b.innerHTML = "";
      const md = document.createElement("span");
      md.className = "md-ic";
      if (ic) md.appendChild(ic);
      else md.innerHTML = iconHTML(/dado|aposta/i.test(label) ? "coin" : /braço|luta|briga/i.test(label) ? "sword" : /fogos|fogueira/i.test(label) ? "sun" : /sair|voltar|fechar/i.test(label) ? "door" : "star");
      b.appendChild(md);
      const tx = document.createElement("span");
      tx.className = "md-t";
      tx.textContent = label;
      b.appendChild(tx);
      if (price) {
        const pr = document.createElement("span");
        pr.className = "md-p";
        pr.textContent = price;
        b.appendChild(pr);
      }
      const k = document.createElement("span");
      k.className = "md-k";
      k.textContent = i + 1;
      b.appendChild(k);
    });
    el.classList.toggle("grid2", opts.length > 5);
    return r;
  };

  const st = document.createElement("style");
  st.textContent = `
  /* ---------- moldura de madeira + pergaminho ---------- */
  #choice.med{
    background:
      radial-gradient(ellipse at 30% 20%, rgba(255,255,255,.35), transparent 55%),
      radial-gradient(ellipse at 70% 90%, rgba(120,80,30,.18), transparent 60%),
      repeating-radial-gradient(circle at 20% 30%, rgba(120,90,40,.05) 0 2px, transparent 2px 6px),
      linear-gradient(#f2e6c6, #e2d0a4) !important;
    border: 0 !important;
    border-radius: 6px !important;
    box-shadow:
      0 0 0 3px #2a1a0c,
      0 0 0 9px #8a5a2e,
      0 0 0 11px #c9925a,
      0 0 0 14px #2a1a0c,
      0 18px 40px rgba(0,0,0,.65) !important;
    padding: 0 1.1em 1em !important;
    color: #3a2414;
    width: min(92vw, 40em) !important;
    max-height: 82% !important;
  }
  #choice.med::before, #choice.med::after{
    content:""; position:sticky; display:block; height:0; top:0;
  }
  #choice.med h3{
    margin: 0 -1.1em .5em !important;
    padding: .55em 1em .5em !important;
    text-align: center;
    color: #ffe6a8 !important;
    font-family: "Pixelify Sans", sans-serif;
    letter-spacing: .02em;
    text-shadow: 0 2px 0 #2a1a0c, 0 0 8px rgba(255,200,90,.35);
    background:
      radial-gradient(circle at 10px 50%, #c9c9d0 0 3px, #4a4a52 3px 4px, transparent 5px),
      radial-gradient(circle at calc(100% - 10px) 50%, #c9c9d0 0 3px, #4a4a52 3px 4px, transparent 5px),
      repeating-linear-gradient(90deg, rgba(0,0,0,.12) 0 2px, transparent 2px 22px),
      linear-gradient(#8a5a2e, #5a3a1e) !important;
    border-bottom: 3px solid #2a1a0c !important;
    position: sticky; top: 0; z-index: 2;
  }
  #choice.med p{ color:#4a2e17 !important; text-align:center; font-size:.95em; margin:.2em .4em .7em; }
  #choice.med .btns{ display:grid !important; grid-template-columns: 1fr; gap:.45em; }
  #choice.med.grid2 .btns{ grid-template-columns: repeat(auto-fill, minmax(15.5em, 1fr)); }
  #choice.med .btns button{
    position:relative; display:flex !important; align-items:center; gap:.6em; text-align:left;
    min-height: 3em; padding: .35em .7em .35em .4em !important;
    background: linear-gradient(#efe0b8, #e0cc98) !important;
    border: 2px solid #8a6a3a !important; border-radius: 6px !important;
    box-shadow: inset 0 1px 0 rgba(255,255,255,.6), inset 0 -2px 0 rgba(90,58,30,.25), 0 2px 0 #6b4423 !important;
    color:#3a2414 !important; font-weight:600;
    transition: transform .08s, box-shadow .08s, filter .08s;
  }
  #choice.med .btns button:hover:not(:disabled), #choice.med .btns button:focus-visible{
    transform: translateY(-1px);
    border-color:#c9a03a !important;
    box-shadow: inset 0 1px 0 rgba(255,255,255,.7), 0 0 0 2px rgba(242,193,78,.6), 0 3px 0 #6b4423 !important;
    filter: brightness(1.04);
  }
  #choice.med .btns button:active{ transform: translateY(1px); box-shadow: inset 0 2px 4px rgba(90,58,30,.4) !important; }
  #choice.med .btns button:disabled{ opacity:.55; filter:grayscale(.6); }
  #choice.med .md-ic{
    flex:none; width:2.3em; height:2.3em; border-radius:50%;
    display:flex; align-items:center; justify-content:center;
    background: radial-gradient(circle at 35% 30%, #c9925a, #6b4423 70%);
    box-shadow: 0 0 0 2px #3a2414, inset 0 2px 0 rgba(255,255,255,.25);
  }
  #choice.med .md-ic .pxi{ transform: scale(1.25); background:none !important; padding:0 !important; margin:0 !important; }
  #choice.med .md-t{ flex:1; line-height:1.2; }
  #choice.med .md-p{
    flex:none; padding:.15em .5em; border-radius:4px; font-family:"Pixelify Sans",sans-serif;
    background: linear-gradient(#e8a85a, #b8743a); color:#2a1a0c; border:1px solid #6b4423;
    box-shadow: inset 0 1px 0 rgba(255,255,255,.4);
  }
  #choice.med .md-p::before{ content:"● "; color:#f2c14e; text-shadow:0 0 0 #6b4423; }
  #choice.med .md-k{ position:absolute; top:-.45em; left:-.35em; min-width:1.25em; height:1.25em; border-radius:50%; font-size:.7em; display:flex; align-items:center; justify-content:center; background:#5a3a1e; color:#ffe6a8; border:1px solid #2a1a0c; }

  /* ---------- lousa de giz (cardápio) ---------- */
  #choice.med.chalk{
    background:
      radial-gradient(ellipse at 40% 30%, rgba(255,255,255,.06), transparent 60%),
      repeating-linear-gradient(15deg, rgba(255,255,255,.015) 0 3px, transparent 3px 9px),
      linear-gradient(#2e3a32, #222c26) !important;
    color:#f2eee4;
  }
  #choice.med.chalk p{ color:#d8e0d4 !important; font-style:italic; }
  #choice.med.chalk .btns button{
    background: transparent !important; border: 0 !important; border-bottom: 2px dashed rgba(242,238,228,.25) !important;
    box-shadow:none !important; border-radius:0 !important; color:#f2eee4 !important;
    font-family:"Pixelify Sans",sans-serif; font-weight:400; letter-spacing:.02em;
  }
  #choice.med.chalk .btns button:hover:not(:disabled), #choice.med.chalk .btns button:focus-visible{ background: rgba(242,238,228,.06) !important; transform:none; }
  #choice.med.chalk .md-ic{ background: rgba(242,238,228,.08); box-shadow: 0 0 0 2px rgba(242,238,228,.35); }
  #choice.med.chalk .md-p{ background: none; border:0; box-shadow:none; color:#f2c14e; font-size:1.1em; }
  #choice.med.chalk .md-k{ display:none; }

  /* ---------- cartaz de festa ---------- */
  #choice.med.poster h3{
    background:
      linear-gradient(135deg, transparent 50%, #2a1a0c 50%) 0 100%/16px 8px repeat-x,
      repeating-linear-gradient(90deg, #c94a4a 0 16px, #f2c14e 16px 32px, #3a74c9 32px 48px, #7ab04a 48px 64px) !important;
    color:#fff !important; padding-bottom:.9em !important; border-bottom:0 !important;
  }
  #choice.med.poster{ background: radial-gradient(ellipse at 50% 0%, rgba(255,230,160,.6), transparent 60%), linear-gradient(#f6ecd0,#e8d6a8) !important; }

  /* ---------- molduras dos minijogos ---------- */
  #ges .gs-card, #jmg .jm-card, #tmg .mg-card{
    background: linear-gradient(#f2e6c6, #e2d0a4) !important;
    border: 0 !important; border-radius: 6px !important;
    box-shadow: 0 0 0 3px #2a1a0c, 0 0 0 9px #8a5a2e, 0 0 0 11px #c9925a, 0 0 0 14px #2a1a0c, 0 18px 40px rgba(0,0,0,.65) !important;
    color:#3a2414 !important;
  }
  #ges h3, #jmg h3, #tmg h3{ color:#5a2a0c !important; text-shadow: 0 1px 0 rgba(255,255,255,.6); }
  #ges .gs-sub, #jmg .jm-sub{ color:#4a2e17 !important; }
  #ges .gs-sub b, #jmg .jm-sub b{ color:#8a2a1a !important; }
  #ges canvas{ box-shadow: 0 0 0 2px #2a1a0c, 0 0 0 5px #8a5a2e; border-radius:2px !important; }
  #ges .gs-foot button, #jmg .jm-foot button, #ges .gs-tools button{
    background: linear-gradient(#efe0b8,#e0cc98) !important; color:#3a2414 !important; border:2px solid #8a6a3a !important; border-radius:6px; box-shadow: 0 2px 0 #6b4423;
  }
  #ges .gs-foot .go{ background: linear-gradient(#f2c14e,#c9922a) !important; }
  #ges .gs-tools button.on{ border-color:#c9a03a !important; box-shadow: 0 0 0 2px rgba(242,193,78,.6), 0 2px 0 #6b4423; }
  #ges .gs-time{ color:#8a2a1a !important; } #ges .gs-msg{ color:#5a3a1e !important; font-weight:700; }
  `;
  document.head.appendChild(st);
})();
