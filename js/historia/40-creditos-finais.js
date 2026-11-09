/**
 * ECOS DO ARCANO — 40-creditos-finais.js
 * Ao terminar o modo História, os créditos sobem na tela como no fim de um
 * filme: o final que você teve, a sua jornada em números, as suas escolhas,
 * as conquistas, quem lutou ao seu lado, a equipe e os personagens.
 * Dá para pular (botão, Esc ou toque duplo). Depois aparece a tela final.
 */

"use strict";

function endingName() {
  if (player.villainEnd) return player.villainEnd === "alianca" ? "Fim Sombrio: a Aliança com o Silêncio" : "Fim Sombrio: a Canção Roubada";
  if (rulesK("aurelia")) return genderWord("Fim do Rei", "Fim da Rainha", "Fim da Majestade");
  if (player.exiled) return "Fim do Exílio";
  if ((player.murders || 0) > 0) return "Fim Manchado";
  if ((player.rep ?? 50) >= 80) return genderWord("Fim do Herói", "Fim da Heroína", "Fim de Heroísmo");
  return "A Canção Voltou";
}
function creditsHTML() {
  const sec = Math.floor(player.playtime || 0);
  const tempo = `${Math.floor(sec / 3600)}h ${String(Math.floor((sec % 3600) / 60)).padStart(2, "0")}min`;
  const n = (a) => (a || []).length;
  const ach = Object.keys(player.ach || {});
  const achList = ACHIEVEMENTS.filter(([id]) => ach.includes(id));
  const kael = { ajudou: "Você ficou do lado do Kael, e ele lutou com você.", exilado: "Você contou tudo à Odelia, e o Kael foi embora.", perdido: player.flags.kaelSalvo ? "O Kael se perdeu no Silêncio... e você o trouxe de volta." : "O Kael se perdeu no Silêncio." }[player.flags.kaelChoice];
  const honda = { confiou: "Você confiou o diário ao Professor Honda.", recusou: "Você guardou o diário só para você." }[player.flags.hondaChoice];
  const kind = (player.fb || []).filter((x) => x === 1).length;
  const allies = CREW.filter((id) => friendshipLevel(id) >= 1 && !(typeof isDead === "function" && isDead(id))).map(shortName);
  const row = (k, v) => `<div class="rc-row"><span>${k}</span><b>${v}</b></div>`;
  return `
    <div class="rc-block rc-title"><h1>Ecos do Arcano</h1><div>A Magia Perdida</div></div>
    <div class="rc-block"><div class="rc-label">Final</div><h2>${endingName()}</h2></div>
    <div class="rc-block"><div class="rc-label">Estrelando</div><canvas class="rc-hero" width="96" height="96"></canvas><h2>${player.name}</h2><div class="rc-sub">${genderWord("o aprendiz", "a aprendiz", "aprendiz")} que ainda ouvia as runas</div></div>
    <div class="rc-block"><div class="rc-label">A sua jornada</div>
      ${row("Nível final", player.lvl)}
      ${row("Tempo de jogo", tempo)}
      ${row("Magias recuperadas", `${n(player.spells)}/${Object.keys(SPELLS).length}`)}
      ${row("Combos secretos", `${n(player.combos)}/${typeof COMBOS !== "undefined" ? Object.keys(COMBOS).length : 8}`)}
      ${row("Páginas do diário de Vesper", `${n(player.pages)}/5`)}
      ${row("Guardiões libertados", guardiansFreed())}
      ${row("Ecos Corrompidos", `${n(player.ecos)}/5`)}
      ${row("Segredos encontrados", `${n(player.secretsFound)}/${typeof SECRET_SPOTS !== "undefined" ? SECRET_SPOTS.length : 12}`)}
      ${row("Missões da turma", `${typeof arcsDone === "function" ? arcsDone().length : 0}/6`)}
      ${row("Baús abertos", n(player.taken))}
      ${row("Batalhas vencidas", player.winsTotal || 0)}
      ${row("Reputação", `${player.rep ?? 50} (${repLabel()})`)}
      ${row("Escolhas de herói / de vilão", `${player.heroPts || 0} / ${player.villain || 0}`)}
    </div>
    <div class="rc-block"><div class="rc-label">As suas escolhas</div>
      ${kael ? `<p>${kael}</p>` : ""}${honda ? `<p>${honda}</p>` : ""}
      <p>${n(player.fb) ? `Das ${n(player.fb)} lembranças de Vesper, ${kind} terminaram com uma vela acesa.` : "Você não reviveu as lembranças de Vesper."}</p>
      ${player.flags.odeliaMorta ? "<p>A Arquimaga Odelia não viu o fim desta história.</p>" : ""}
    </div>
    <div class="rc-block"><div class="rc-label">Conquistas (${achList.length}/${ACHIEVEMENTS.length})</div>
      <div class="rc-ach">${achList.length ? achList.map(([, nm, , icon]) => `<span>${iconHTML(icon, 14)} ${nm}</span>`).join("") : "<em>Nenhuma desta vez. Fica para o Novo Jogo+!</em>"}</div>
    </div>
    <div class="rc-block"><div class="rc-label">Lutaram ao seu lado</div><p>${typeof crewReady === "function" && crewReady() && allies.length ? allies.join(" · ") : "Você enfrentou o Silêncio sozinh" + genderWord("o", "a", "e") + "."}</p></div>
    <div class="rc-block"><div class="rc-label">Uma criação de</div>
      <div class="rc-team">${TEAM.map(([nm, ra], i) => `<div><canvas data-i="${i}" width="64" height="64"></canvas><b>${nm}</b><small>RA ${ra}</small></div>`).join("")}</div>
      <div class="rc-sub">Universidade São Judas Tadeu · 2026</div>
    </div>
    <div class="rc-block"><div class="rc-label">Personagens</div>
      <p>Arquimaga Odelia · Vesper · Instrutor Kael · Professor Bruno Honda · Professora Selene</p>
      <p>Rainha Aurélia · Príncipe Pedro Max · Princesa Mylena · General Marcos · Duque Matheus</p>
      <p>Lucas Marzocca · Luca · Andressa · Júlia Oliveira · Duquesa Malu · Pedro, o Poeta</p>
      <p>Capitão Bento · Anciã Berta · Curandeira Maíra · Professor L · Velha Juta</p>
    </div>
    <div class="rc-block"><div class="rc-label">Feito com</div><p>HTML5 · CSS3 · JavaScript puro</p><p class="rc-sub">Cada pixel, som e nota de música foi gerado pelo próprio jogo.</p></div>
    <div class="rc-block rc-last"><h2>Obrigado por jogar!</h2><div class="rc-sub">A Canção continua... ✦</div></div>`;
}
function drawRects(cv, look, scale) {
  const c2 = cv.getContext("2d");
  c2.imageSmoothingEnabled = false;
  for (const [x, y, w, h, col] of heroRects(look, "down", look.staffc || null)) {
    c2.fillStyle = col;
    c2.fillRect(x * scale, y * scale, w * scale, h * scale);
  }
}
function rollCredits(next) {
  let el = byId("rollcred");
  if (!el) {
    el = document.createElement("div");
    el.id = "rollcred";
    el.className = "ui";
    byId("screen").appendChild(el);
  }
  el.innerHTML = `<div class="rc-roll">${creditsHTML()}</div><button class="rc-skip">Pular ▸</button>`;
  el.style.display = "block";
  game.mode = "rollcred";
  drawRects(el.querySelector(".rc-hero"), player.look, 6);
  el.querySelectorAll(".rc-team canvas").forEach((cv) => {
    const L = CREW_LOOKS[TEAM[cv.dataset.i][2]];
    if (L && L.look) drawRects(cv, L.look, 4);
  });
  const roll = el.querySelector(".rc-roll");
  const H = () => roll.scrollHeight + el.clientHeight;
  const speed = 60; // pixels por segundo
  let y = 0,
    last = performance.now(),
    done = false,
    fast = false;
  const finish = () => {
    if (done) return;
    done = true;
    el.style.display = "none";
    game.mode = "world";
    next();
  };
  const step = (now) => {
    if (done) return;
    y += ((now - last) / 1000) * speed * (fast ? 5 : 1);
    if (game.rcSeek != null) (y = game.rcSeek), (game.rcSeek = null);
    last = now;
    roll.style.transform = `translateY(${el.clientHeight - y}px)`;
    if (y >= H()) return finish();
    requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
  el.querySelector(".rc-skip").onclick = finish;
  // Segurar acelera; Esc pula.
  el.onpointerdown = (e) => !e.target.closest(".rc-skip") && (fast = true);
  el.onpointerup = el.onpointercancel = () => (fast = false);
  KEY_HANDLERS.rollcred = (k) => (k === "escape" ? finish() : k === " " || k === "enter" ? (fast = !fast) : null);
  playSound(523, 0.4, "triangle");
}
{
  const endBase = showEnd;
  showEnd = function () {
    if (lifeMode() || game.rollDone) {
      game.rollDone = false;
      return endBase.apply(this, arguments);
    }
    game.rollDone = true;
    achTick && achTick();
    setTimeout(() => rollCredits(() => showEnd()), 300);
  };
  const dtBase = desiredTrack;
  desiredTrack = function () {
    if (game.mode === "rollcred") return "titulo";
    return dtBase();
  };
}
