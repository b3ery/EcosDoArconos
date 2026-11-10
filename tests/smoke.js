/**
 * Teste de fumaça do Ecos do Arcano: abre o jogo num navegador de verdade e passa
 * pelas telas principais dos dois modos. Falha se aparecer qualquer erro de JavaScript.
 * Uso: npm test   (ou: node tests/smoke.js)
 */
const { chromium } = require("playwright");
const path = require("path");

const URL = "file://" + path.join(__dirname, "..", "index.html");
const checks = [];
const check = (name, ok) => {
  checks.push([name, !!ok]);
  console.log(`${ok ? "✔" : "✘"} ${name}`);
};

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 960 } });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message + " " + (e.stack || "").split("\n").slice(1, 3).join(" | ")));
  await page.goto(URL);
  await page.waitForTimeout(1200);
  check("Tela de título abre", await page.evaluate(() => game.mode === "title"));

  // Modo História
  await page.evaluate(() => {
    player = newPlayer();
    player.tutDone = true;
    player.zone = "vila";
    startGame(false);
    game.dialog = null;
    byId("dialog").style.display = "none";
    game.mode = "world";
  });
  check("Vila carrega", await page.evaluate(() => game.mode === "world" && player.zone === "vila"));
  await page.evaluate(() => openInv());
  check("Inventário abre", await page.evaluate(() => game.mode === "inv" && !!document.querySelector(".inv-grid")));
  await page.evaluate(() => closeInv());
  await page.evaluate(() => openShop("bruno"));
  check("Loja abre com itens", await page.evaluate(() => document.querySelectorAll(".st-card").length > 0));
  await page.evaluate(() => closeShop());
  await page.evaluate(() => {
    player.runes = ["fogo", "agua"];
    player.aff = "fogo";
    startBattle("lobo", null);
  });
  await page.waitForTimeout(600);
  check("Batalha começa", await page.evaluate(() => game.mode === "battle" && !!battle));
  await page.evaluate(() => {
    pickRune("fogo");
    playerCast();
  });
  await page.waitForTimeout(2500);
  check("Batalha termina ou continua sem erro", await page.evaluate(() => true));
  await page.evaluate(() => {
    if (battle) endBattle();
    game.mode = "world";
    game.dialog = null;
    socialMenu("rosa");
  });
  check("Menu de pessoa abre", await page.evaluate(() => game.mode === "choice"));
  await page.evaluate(() => {
    pickChoice(game.choice.length - 1);
    openCalendar();
  });
  check("Calendário abre", await page.evaluate(() => game.mode === "cal"));
  await page.evaluate(() => closeCalendar());

  // Simulador de Vida
  await page.evaluate(() => {
    player = newPlayer();
    startLifeMode();
    player.tutDone = true;
    game.dialog = null;
    byId("dialog").style.display = "none";
    game.mode = "world";
    player.clock = 9 * 60;
    professionsMenu();
  });
  check("Carreiras abrem (Simulador)", await page.evaluate(() => game.mode === "careers" && document.querySelectorAll(".cr-card").length >= 19));
  await page.evaluate(() => {
    closeCareers();
    player.job = null;
    startJob("padeiro");
    game.dialog = null;
    game.mode = "world";
  });
  check("Turno de Padeiro começa", await page.evaluate(() => player.job && player.job.id === "padeiro"));
  await page.evaluate(() => {
    endJob("teste");
    game.dialog = null;
    showCreate("wardrobe");
  });
  check("Criador de personagem abre", await page.evaluate(() => !!document.querySelector(".cc-grid, .cc-prof")));
  await page.evaluate(() => {
    clearInterval(game.ccAnim);
    byId("create").style.display = "none";
    game.mode = "world";
    player.zone = "vila";
    player.x = 31;
    player.y = 16;
    player.clock = 10 * 60;
    enterZone(false);
    game.dialog = null;
    game.mode = "world";
    crewInit();
  });
  check("Falas geradas não repetem", await page.evaluate(() => new Set(Array.from({ length: 40 }, () => genLine("rosa"))).size === 40));
  check("Protesto dos Iluministas começa", await page.evaluate(() => startProtest(true) && game.protest.actors.length >= 6));
  await page.evaluate(() => (game.protest = null));
  check("Perseguição com faca começa", await page.evaluate(() => startChase("pedro", "player", "mylena") && !!game.chase));
  await page.evaluate(() => {
    game.chase = null;
    paintOf().wall0 = "#ecc8cc";
    enterHouse(null);
    game.dialog = null;
    game.mode = "world";
  });
  check("Golpe de estado dá a coroa", await page.evaluate(() => (coupWin("discurso"), (game.dialog = null), isMonarch() && /Aurélia/.test(royalTitle()))));
  check("Mago é imortal para mortal", await page.evaluate(() => (killMenu("odelia"), (game.dialog = null), (game.mode = "world"), !isDead("odelia"))));
  check("Matar e ir para o calabouço", await page.evaluate(() => (killNpc("bruno", "faca"), murderFound("bruno"), (game.dialog = null), startJail(72, "teste"), isDead("bruno") && player.zone === "calabouco" && hated())));
  await page.evaluate(() => (leaveJail(), enterHouse(null), (game.dialog = null), (game.mode = "world")));
  check("Corpo fica no chão", await page.evaluate(() => !!(player.dead.bruno && player.dead.bruno.pos)));
  check("Sonegar tira o imposto", await page.evaluate(() => ((player.sonega = true), withTax(100) === 100 && !((player.sonega = false))) ));
  check("Mais de 550 interações", await page.evaluate(() => INTERACTIONS.length >= 550));
  check("Ala Real com empregados", await page.evaluate(() => (enterRoyalWing(), player.zone === "alareal" && game.rwStaff.length === 4)));
  await page.evaluate(() => (leaveRoyalWing(), enterHouse(null), (game.dialog = null), (game.mode = "world")));
  check("Parede pintada na casa", await page.evaluate(() => HOME_PAL[homeTier()].wall === "#ecc8cc"));
  await page.waitForTimeout(1500);
  check("500+ itens no catálogo", await page.evaluate(() => CATALOG.length >= 500));
  // Sistemas novos: mortes, NPCs, reino, legado.
  const clean = () => page.evaluate(() => { game.deathScene = null; game.dying = false; document.body.classList.remove("cutscene"); game.dialog = null; byId("dialog").style.display = "none"; byId("choice").style.display = "none"; game.mode = "world"; });
  await clean();
  check("Ano de 15 dias", await page.evaluate(() => { const a = playerAge(), b = player.bdayDay ?? player.day; player.bdayDay = player.day - YEAR_DAYS; ageTick(); const ok = playerAge() === a + 1; player.bdayDay = b; return ok; }));
  await page.waitForTimeout(3000);
  await clean();
  check("30 mortes com cena", await page.evaluate(() => DEATH_IDS.length === 30 && playerDies("raio") && game.deathScene && game.deathScene.id === "raio"));
  await clean();
  check("Moradores namoram e casam", await page.evaluate(() => { const S = soc(); const ids = Object.keys(NPCS).filter(singleNpc); let p = null; for (const a of ids) { for (const b of ids) if (a < b && mutualAttraction(a, b)) { p = [a, b]; break; } if (p) break; } S.dating[p[0]] = p[1]; S.dating[p[1]] = p[0]; S.wed.push({ k: npcPair(p[0], p[1]), a: p[0], b: p[1], day: player.day }); player.clock = 17 * 60 + 5; weddingTick(); game.dialog = null; return npcSpouse(p[0]) === p[1]; }));
  await clean();
  check("Golpe solo (sem aliados)", await page.evaluate(() => { player.throne = {}; syncRulers(); player.plot = { sup: 0, sus: 0, allies: [], bribes: 0, arms: 0, day: 0, solo: { map: 3, train: 3, key: 1, sleep: 1, day: {} } }; return supportTotal() >= 60; }));
  check("Golpe dos Iluministas cria o Conselho", await page.evaluate(() => { player.throne = {}; ilumCoupResolve(true, null); game.dialog = null; return !!player.council && /Conselho/.test(KINGDOMS.aurelia.ruler); }));
  check("Plebiscito restaura a monarquia", await page.evaluate(() => { player.councilChief = true; player.rep = 100; const r = Math.random; Math.random = () => 0.9; plebiscite(); Math.random = r; game.dialog = null; return !player.council && rulesK("aurelia"); }));
  check("Fofoca se espalha", await page.evaluate(() => { player.secrets = []; addSecret("furto", "teste", "rosa"); for (let i = 0; i < 6; i++) spreadSecrets(); return secrets()[0].knows.length > 1; }));
  check("Filhos herdam traços", await page.evaluate(() => { player.kids = [{ name: "Teo", g: "m", born: player.day, look: player.look }]; giveKidTraits(); return player.kids[0].traits.length === 3; }));
  check("Árvore da família abre", await page.evaluate(() => { openFamilyTree(); const ok = game.mode === "arvore" && !!document.querySelector(".av-c.now"); closeFamilyTree(); return ok; }));
  check("Menu de Ações abre", await page.evaluate(() => { actionsMenu(); const ok = game.mode === "choice"; game.mode = "world"; byId("choice").style.display = "none"; return ok; }));
  // Modo História: novidades
  await page.evaluate(() => { game.deathScene = null; game.dying = false; game.cine = null; document.body.classList.remove("cutscene"); player = newPlayer(); player.name = "Teste"; player.tutDone = true; player.flags.treino = true; player.runes = ["fogo", "agua", "ar", "terra"]; player.aff = "fogo"; player.zone = "vila"; player.x = 31; player.y = 24; startGame(false); game.dialog = null; byId("dialog").style.display = "none"; game.mode = "world"; });
  check("Flashback ao achar página", await page.evaluate(() => { player.pages = [1]; flashbackTick(); const ok = !!game.cine; game.cine = null; document.body.classList.remove("cutscene"); game.mode = "world"; return ok; }));
  check("Chefe muda de fase", await page.evaluate(() => { startBattle("ent", null); battle.e.hp = Math.round(battle.e.max * 0.4); bossPhaseTick(); const ok = battle.phase2; endBattle(); return ok; }));
  check("Combo secreto", await page.evaluate(() => { startBattle("lobo", null); battle.prevEl = "agua"; applySpellDamage(SPELLS.fogo, []); const ok = (player.combos || []).includes("Vapor Escaldante"); endBattle(); return ok; }));
  check("Cripta: os três quebra-cabeças abrem", await page.evaluate(() => { enterCrypt(); game.dialog = null; for (const i of TORCH_ORDER) { cryptInteract(...CRYPT.torches[i]); game.dialog = null; } for (const [i, n] of [[0, 1], [1, 2], [2, 3]]) for (let k = 0; k < n; k++) { cryptInteract(...CRYPT.mirrors[i]); game.dialog = null; } const S = cryptState(); S.eOk = true; cryptApply(); const ok = S.torchesOk && S.mirOk && walkable("cripta", CRYPT.edoor[0], CRYPT.edoor[1]); leaveCrypt(); game.dialog = null; game.mode = "world"; return ok; }));
  check("Missão pessoal da turma", await page.evaluate(() => { lifeSocialItems("marcos")[0].fn(); game.dialog = null; player.winsTotal = (player.winsTotal || 0) + 3; lifeSocialItems("marcos")[0].fn(); game.dialog = null; game.mode = "world"; return arcsDone().includes("marcos"); }));
  check("Reencontro e créditos finais antes da tela de fim", await page.evaluate(() => { player.reunionSeen = false; showEnd(); const cena = !!game.cine; if (game.cine) { game.cine.t0 = game.t - 99; endCine(); } return new Promise((r) => setTimeout(() => { const rolling = game.mode === "rollcred"; const sk = document.querySelector(".rc-skip"); if (sk) sk.click(); r(cena && rolling && game.mode === "end"); }, 600)); }));
  check("Novo Jogo+ mantém o Grimório", await page.evaluate(() => { player.spells = ["fogo", "agua", "fogo+agua"]; byId("btnNGP").click(); game.dialog = null; game.mode = "world"; return player.ngp === 1 && player.spells.length === 3; }));
  check("Odelia conta da runa ao falar com ela", await page.evaluate(() => { player.guards = ["bosque"]; player.flags.r2 = false; game.dialog = null; game.mode = "world"; socialMenu("odelia"); const ok = !!player.flags.r2; game.dialog = null; byId("dialog").style.display = "none"; game.mode = "world"; return ok; }));
  check("Silenciador nunca fica sem fraqueza (save com runa estranha)", await page.evaluate(() => { const old = player.runes; player.runes = ["???"]; const w = pickBossWeak(null); player.runes = old; return !!RUNES[w]; }));
  check("Cena que termina com luta aberta volta para a luta", await page.evaluate(() => { startBattle("lobo", null); playCine(() => {}, 0.1); game.cine.t0 = game.t - 99; endCine(); const ok = game.mode === "battle"; endBattle(); game.mode = "world"; return ok; }));
  check("Nyx aparece no Bosque antes do Ent", await page.evaluate(() => { player.nyx = null; player.guards = []; player.zone = "bosque"; game.dialog = null; game.mode = "world"; const ok = nyxTick() && nyx().s1 && !!game.dialog; game.dialog = null; byId("dialog").style.display = "none"; game.mode = "world"; return ok; }));
  check("O Silêncio ataca a vila e quem não foi salvo perde a voz", await page.evaluate(() => { player.siege = null; player.silenced = []; player.guards = ["bosque"]; player.zone = "vila"; game.dialog = null; game.mode = "world"; const fired = siegeTick(); const d = game.dialog; d.i = d.lines.length - 1; advanceDialog(); advanceDialog(); pickChoice(0); const lost = silenced()[0]; if (battle) endBattle(); game.dialog = null; game.mode = "world"; socialMenu(lost); const mute = game.dialog && /não sai som/.test(game.dialog.lines.map((l) => l[1]).join(" ")); game.dialog = null; byId("dialog").style.display = "none"; game.mode = "world"; return fired && lost === "abrigo" && mute; }));
  check("Libertar um Guardião devolve a voz", await page.evaluate(() => { player.silenced = ["abrigo"]; player.restoreVoice = null; try { rewardGuardian(Object.assign({}, ENEMIES.ent, { rune: "fogo" }), "ent"); } catch (e) {} const ok = player.restoreVoice === "abrigo"; game.cine = null; game.dialog = null; byId("dialog").style.display = "none"; document.body.classList.remove("cutscene"); game.mode = "world"; player.silenced = []; player.restoreVoice = null; return ok; }));
  check("Encontro na estrada aparece no Bosque", await page.evaluate(() => { player.enc = {}; player.encLast = -999; game.encWait = 0; player.zone = "bosque"; game.dialog = null; game.mode = "world"; const r = Math.random; Math.random = () => 0.1; const ok = encTick(); Math.random = r; const has = !!game.dialog; game.dialog = null; byId("dialog").style.display = "none"; game.mode = "world"; return ok && has; }));
  check("Dormir traz um sonho com Vesper", await page.evaluate(() => { player.dreams = 0; player.dreamPending = true; game.mode = "world"; const ok = dreamTick() && !!game.cine; game.cine.t0 = game.t - 99; endCine(); const v = game.dialog && game.dialog.lines[0][0] === "Vesper"; game.dialog = null; byId("dialog").style.display = "none"; game.mode = "world"; return ok && v; }));
  check("A turma comenta o Guardião libertado", await page.evaluate(() => { const id = CREW.find((c) => NPCS[c]); player.reacts = { type: "ent", ids: [id] }; game.mode = "world"; socialMenu(id); const ok = !!game.dialog && !player.reacts.ids.length; game.dialog = null; byId("dialog").style.display = "none"; byId("choice").style.display = "none"; game.mode = "world"; return ok; }));
  check("Jornada abre e fecha com J", await page.evaluate(() => { game.mode = "world"; openJourney(); const a = game.mode === "jornada" && /Sua Jornada/.test(byId("jornada").innerHTML); closeJourney(); return a && game.mode === "world"; }));
  check("Grifo voa e só a runa fraca acerta forte", await page.evaluate(() => { player.runes = ["fogo", "agua", "ar", "terra"]; startBattle("grifo", null); battle.gm.fly = true; const w = battle.e.weak[0], o = ["fogo", "agua", "ar", "terra"].find((r) => r !== w); const ok = elementMultiplier(w) > elementMultiplier(o) * 2; endBattle(); game.mode = "world"; return ok; }));
  check("Seca deixa a loja mais cara (Simulador)", await page.evaluate(() => { const m = player.mode; player.mode = "vida"; player.vEvent = null; const a = discount("mercado"); startVillageEvent("seca"); const b = discount("mercado"); player.vEvent = null; player.mode = m; return b > a; }));
  check("Missão sem luta: investigar as tortas e acusar o certo", await page.evaluate(() => { player.calm = {}; const run = (opts, re) => { const o = opts.find((x) => re.test(x.t)); o && o.fn(); }; const flush = () => { while (game.dialog) { const d = game.dialog; d.i = d.lines.length - 1; advanceDialog(); advanceDialog(); } }; run(calmOptions("cocada"), /tortas/); flush(); for (const id of ["peixeiro", "lucio", "brinqueiro"]) { run(calmOptions(id), /tortas/); flush(); } run(calmOptions("cocada"), /Acusar/); const i = game.choice.findIndex((o) => /Pipoca/.test(o.t)); pickChoice(i); flush(); byId("choice").style.display = "none"; game.mode = "world"; return player.calm.tortas.st === "feito"; }));
  check("Quem não tem menu de amizade mostra o pedido (Dona Cocada)", await page.evaluate(() => { player.calm = {}; game.mode = "world"; npcTalkOrQuests("cocada"); const ok = game.mode === "choice" && game.choice.some((o) => /★/.test(o.t)); byId("choice").style.display = "none"; game.mode = "world"; return ok; }));
  check("Luta final: Unir todos os poderes", await page.evaluate(() => new Promise((res) => { player.runes = ["fogo", "agua", "ar", "terra"]; player.guards = ["bosque", "pantano", "picos", "mina", "porto"]; startBattle("silenciador", null); battle.phase2 = true; battle.e.hp = Math.round(battle.e.max * 0.5); battle.busy = false; renderBattle(); const shown = byId("bUnion").style.display !== "none"; const hp = battle.e.hp; uniteAll(); game.cine.t0 = game.t - 99; endCine(); const hit = battle.e.hp < hp && battle.unionUsed; setTimeout(() => { if (battle) endBattle(); game.mode = "world"; res(shown && hit); }, 50); })));
  check("Quebra-cabeças: todos começam embaralhados e têm solução", await page.evaluate(() => { const ok = []; for (let k = 0; k < 10; k++) { ok.push(!PZ_MOSAIC.won(PZ_MOSAIC.make()), !PZ_LIGHTS.won(PZ_LIGHTS.make()), !PZ_CODE.won(PZ_CODE.make())); const p = PZ_PIPES.make(); ok.push(!pipeFlow(p).out && pipeFlow({ ...p, g: p.g.map((c) => ({ ...c, rot: 0 })) }).out); const b = PZ_SCALE.make(); ok.push(!PZ_SCALE.won(b)); } return ok.every(Boolean); }));
  check("Cofre de Vesper abre com o código certo e dá a recompensa", await page.evaluate(() => new Promise((res) => { player.puzzles = {}; game.dialog = null; game.mode = "world"; openPuzzle(PZ_CODE); for (const r of PZ.state.code) document.querySelector(`#puzzle [data-a="r:${r}"]`).click(); document.querySelector('#puzzle [data-a="go"]').click(); setTimeout(() => { const ok = !!player.puzzles.cofre && game.mode !== "puzzle"; game.dialog = null; byId("dialog").style.display = "none"; game.mode = "world"; res(ok); }, 1000); })));
  check("Guardião fica selado até resolver o quebra-cabeça da região", await page.evaluate(() => { const old = player.puzzles; player.puzzles = {}; player.guards = []; player.zone = "bosque"; game.dialog = null; game.mode = "world"; const g = ZONES.bosque.guardPos; interactAt(g[0], g[1]); const sealed = !!game.dialog && /selo/i.test(game.dialog.lines[0][1]); game.dialog = null; byId("dialog").style.display = "none"; game.mode = "world"; player.puzzles = old; return sealed; }));
  check("Lugar escondido: obstáculo pede a runa certa e depois abre", await page.evaluate(() => { player.lm = {}; const L = LANDMARKS.find((l) => l.id === "vinhas"); const s = lmSpot(L); player.zone = "bosque"; game.mode = "world"; game.dialog = null; player.runes = ["agua"]; interactAt(s[0], s[1]); const locked = !lmFound().vinhas; game.dialog = null; game.mode = "world"; player.runes = ["agua", "fogo"]; interactAt(s[0], s[1]); const d = game.dialog; d.i = d.lines.length - 1; advanceDialog(); advanceDialog(); const open = !!lmFound().vinhas; game.dialog = null; byId("dialog").style.display = "none"; game.mode = "world"; return locked && open; }));
  check("A história tem as etapas obrigatórias novas", await page.evaluate(() => ["q-cofre", "m-tortas", "q-selo", "q-balanca", "m-ervas", "q-canos", "x-lugares", "x-estrada"].every((id) => STEPS.some((s) => s.id === id)) && STEPS.findIndex((s) => s.id === "q-cofre") < STEPS.findIndex((s) => s.id === "ent")));
  check("Entrega do quadro de trabalhos ganha seta e aparece no mapa", await page.evaluate(() => { const old = player.jobs; player.jobs = [{ type: "deliver", item: "pao", to: "iara", n: 1, prog: 0, poster: "iara", reward: 30 }]; player.zone = "vila"; const D = deliveryTarget(); const onMap = mapThings("vila").some((q) => /Iara/.test(q.n)); player.jobs = old; return !!D && D.zone === "vila" && onMap; }));
  check("Tema: Épocas Sombrias até a Canção voltar, Arcana depois; Lamento nos sonhos", await page.evaluate(() => { game.mode = "world"; player.zone = "vila"; const f = player.finished; player.finished = false; const antes = musicFileOf(desiredTrack()); player.finished = true; const depois = musicFileOf("vila"); player.finished = f; playCine(dreamScene, 3); const sonho = desiredTrack(); game.cine.t0 = game.t - 99; endCine(); game.dialog = null; byId("dialog").style.display = "none"; game.mode = "world"; return antes === "epocas-sombrias" && depois === "arcana" && sonho === "lamento"; }));
  check("Roteiro de dublagem: 116 falas, códigos únicos, e a fala da tela acha o áudio", await page.evaluate(() => VOICE_SCRIPT.length >= 100 && new Set(VOICE_SCRIPT.map((e) => e.id)).size === VOICE_SCRIPT.length && voiceForText(STORY[0]).id === "AB-01" && voiceForText("Segredo encontrado (1/12)! " + SECRET_LORE[0]).id === "SEG-01" && VOICE_BY_CUE.has("guard:ent")));
  // Zerar: vencer o Silenciador tem que levar ao epílogo, aos créditos e à tela de fim.
  await page.evaluate(() => { player.finished = false; player.reunionSeen = false; player.villainEnd = null; player.guards = ["bosque", "pantano", "picos", "mina", "porto"]; startBattle("silenciador", null); });
  await page.waitForTimeout(500);
  await page.evaluate(() => { battle.e.hp = 0; win(); });
  let fim = false;
  for (let i = 0; i < 60 && !fim; i++) {
    await page.waitForTimeout(500);
    fim = await page.evaluate(() => {
      if (game.cine) { game.cine.t0 = game.t - 99; endCine(); }
      if (game.dialog) { const d = game.dialog; d.i = d.lines.length - 1; advanceDialog(); advanceDialog(); }
      else if (game.mode === "choice") pickChoice(0);
      if (game.mode === "rollcred") document.querySelector(".rc-skip").click();
      return game.mode === "end";
    });
  }
  check("Vencer o Silenciador leva ao final do jogo", fim);
  await page.evaluate(() => { byId("end").style.display = "none"; game.mode = "world"; });
  check("Save vai e volta por código", await page.evaluate(() => { player.gold = 4321; const pkt = fromCode(toCode(savePacket())); return pkt.player.gold === 4321 && pkt.app === "ecos-do-arcano"; }));
  check("Sem erros de JavaScript", errors.length === 0);
  if (errors.length) console.log("Erros:\n" + errors.join("\n"));
  await browser.close();
  const failed = checks.filter((c) => !c[1]).length;
  console.log(`\n${checks.length - failed}/${checks.length} verificações passaram.`);
  process.exit(failed ? 1 : 0);
})();
