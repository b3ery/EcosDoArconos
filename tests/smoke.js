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
  check("Sem erros de JavaScript", errors.length === 0);
  if (errors.length) console.log("Erros:\n" + errors.join("\n"));
  await browser.close();
  const failed = checks.filter((c) => !c[1]).length;
  console.log(`\n${checks.length - failed}/${checks.length} verificações passaram.`);
  process.exit(failed ? 1 : 0);
})();
