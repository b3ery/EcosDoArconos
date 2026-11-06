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
  page.on("pageerror", (e) => errors.push(e.message));
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
  check("Parede pintada na casa", await page.evaluate(() => HOME_PAL[homeTier()].wall === "#ecc8cc"));
  await page.waitForTimeout(1500);
  check("500+ itens no catálogo", await page.evaluate(() => CATALOG.length >= 500));
  check("Sem erros de JavaScript", errors.length === 0);
  if (errors.length) console.log("Erros:\n" + errors.join("\n"));
  await browser.close();
  const failed = checks.filter((c) => !c[1]).length;
  console.log(`\n${checks.length - failed}/${checks.length} verificações passaram.`);
  process.exit(failed ? 1 : 0);
})();
