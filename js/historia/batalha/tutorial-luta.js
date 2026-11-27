/**
 * ECOS DO ARCANO — tutorial-luta.js
 * Tutorial de luta refeito, mais claro:
 *  - um cartão do Instrutor Kael logo acima dos botões (não cobre mais a cena),
 *    com texto curto, bolinhas de progresso e um botão "Pular tutorial";
 *  - o botão certo de cada passo pisca em dourado com uma setinha "aqui";
 *  - os passos seguem a ordem natural da luta: escolher o dom → lançar →
 *    defender → habilidade → vencer o boneco.
 * Modifica (substitui) renderTutorial e os textos de TUTORIAL_STEPS.
 */

"use strict";

const TUT_LUTA = [
  {
    t: "Escolha a sua magia",
    d: () => `Toque no seu dom <b>${player.dom && DONS[player.dom] ? DONS[player.dom].nome : "(o primeiro botão)"}</b> ou aperte a tecla <b>1</b>. Ele vai para o círculo à direita: é o feitiço que você está montando.`,
    hl: () => [...document.querySelectorAll("#rbtns .rbtn")].slice(0, 1),
  },
  {
    t: "Ataque!",
    d: () => "Agora toque em <b>LANÇAR</b> (ou Enter) para atacar o boneco. Dica: escolher o dom duas vezes antes de lançar faz um golpe duplo, mais forte.",
    hl: () => [byId("bCast")],
  },
  {
    t: "Proteja-se",
    d: () => "Magia gasta <b>MP</b> (a barra azul). Toque em <b>DEFENDER</b>: neste turno você leva só metade do dano e recupera um pouco de MP.",
    hl: () => [byId("bDef")],
  },
  {
    t: "Use a sua habilidade",
    d: () => "Toque em <b>HABILIDADES</b> e escolha uma. Cada dom tem um golpe especial, e cada runa libertada traz outro.",
    hl: () => [byId("bEth")],
  },
  {
    t: "Agora é com você",
    d: () => "Derrube o boneco! Acertar a <b>fraqueza</b> do inimigo (aparece no canto de cima) dá quase o dobro de dano. Suas poções ficam em <b>ITENS</b>.",
    hl: () => [],
  },
];
TUT_LUTA.forEach((s, i) => (TUTORIAL_STEPS[i] = `${i + 1}/5 · ${s.t}`));

renderTutorial = function () {
  const box = byId("tut");
  document.querySelectorAll(".tut-hl").forEach((e) => e.classList.remove("tut-hl"));
  if (!battle || battle.tut < 0 || battle.tut >= TUT_LUTA.length) {
    box.style.display = "none";
    return;
  }
  const s = TUT_LUTA[battle.tut];
  const dots = TUT_LUTA.map((_, i) => `<i class="${i < battle.tut ? "ok" : i === battle.tut ? "now" : ""}"></i>`).join("");
  box.className = "box ui tut-new";
  box.innerHTML = `<div class="tut-head">${iconHTML("sword", 18)}<span>Instrutor Kael</span><div class="tut-dots">${dots}</div><button id="tutSkip">Pular tutorial</button></div>
    <div class="tut-t">Passo ${battle.tut + 1} de 5 · ${s.t}</div><div class="tut-d">${s.d()}</div>`;
  box.style.display = "block";
  byId("tutSkip").onclick = (e) => {
    e.stopPropagation();
    battle.tut = -1;
    toast("Tutorial pulado. Boa luta!", 1600);
    renderBattle();
  };
  if (!battle.busy) s.hl().forEach((e) => e && e.classList.add("tut-hl"));
};

(() => {
  const st = document.createElement("style");
  st.textContent = `
  #tut.tut-new{top:17%;bottom:auto;left:50%;transform:translateX(-50%);width:min(70%,34em);padding:.6em .9em .7em;text-align:left;pointer-events:auto;z-index:6;background:rgba(18,12,32,.94);border:3px solid var(--gold);border-radius:12px;box-shadow:0 6px 0 rgba(0,0,0,.35)}
  #tut.tut-new .tut-head{display:flex;align-items:center;gap:.45em;font-family:"Pixelify Sans",sans-serif;color:var(--gold);font-size:.9em}
  #tut.tut-new .tut-dots{display:flex;gap:4px;margin-left:auto}
  #tut.tut-new .tut-dots i{width:9px;height:9px;border-radius:50%;background:#3a2a5a;border:1px solid #6a5a8a}
  #tut.tut-new .tut-dots i.ok{background:#7bd88f;border-color:#7bd88f}
  #tut.tut-new .tut-dots i.now{background:var(--gold);border-color:#fff;box-shadow:0 0 6px var(--gold)}
  #tut.tut-new #tutSkip{font-size:.75em;padding:.2em .6em;margin-left:.4em;opacity:.85}
  #tut.tut-new .tut-t{margin-top:.35em;font-family:"Pixelify Sans",sans-serif;font-size:1.15em;color:#fff}
  #tut.tut-new .tut-d{margin-top:.2em;font-size:.95em;line-height:1.35;color:#e8defa}
  #tut.tut-new .tut-d b{display:inline;font-size:inherit;margin:0;font-family:inherit;color:var(--gold)}
  .tut-hl{position:relative;outline:3px solid #ffe08a!important;outline-offset:2px;animation:tutPulse 1s ease-in-out infinite;z-index:3}
  .tut-hl::after{content:"aqui";position:absolute;left:50%;bottom:calc(100% + 8px);transform:translateX(-50%);padding:.1em .45em;border-radius:4px;background:#ffe08a;color:#2a1a08;font-size:.7em;font-weight:700;pointer-events:none;animation:tutBob .8s ease-in-out infinite alternate}
  @keyframes tutPulse{50%{box-shadow:0 0 0 6px rgba(255,224,138,.35),0 0 18px rgba(255,224,138,.6)}}
  @keyframes tutBob{to{transform:translate(-50%,-4px)}}
  @media (max-height:520px){#tut.tut-new{bottom:auto;top:14%;font-size:.86em;width:min(80%,34em)}}`;
  document.head.appendChild(st);
})();
