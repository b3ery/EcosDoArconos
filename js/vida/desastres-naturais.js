/**
 * ECOS DO ARCANO — desastres-naturais.js
 * A natureza não pede licença. Inspirado nos jogos de cidade em que o
 * desastre nasce da própria vida da vila (Banished, Frostpunk): ele vem do
 * clima, da estação e de como o reino é cuidado, e deixa marca.
 *  - INCÊNDIO: um telhado pega fogo. As chamas crescem; pegue água no poço
 *    ou na fonte (balde) e jogue no prédio. A guarda ajuda mais quando a
 *    Segurança tem investimento. Se o fogo vencer, o prédio fica em ruínas
 *    por dias (fechado). Salvar o prédio dá fama e recompensa.
 *  - TERREMOTO: o chão treme, poeira cai, quem está na rua se machuca e
 *    alguns prédios ficam rachados por dias.
 *  - ENCHENTE: depois de dois dias seguidos de chuva o rio transborda; as
 *    ruas perto da água alagam, a plantação perde a colheita.
 *  - SECA: no verão, quatro dias sem chuva secam as lavouras e o poço rende
 *    pouco.
 *  - PRAGA DE RATOS: com a vila suja (limpeza baixa), ratos tomam as ruas e
 *    a doença se espalha.
 *  - NEVASCA: no inverno, a neve grossa cansa quem fica na rua.
 * Tudo sai no jornal e pesa no Estado do Reino.
 * Modifica (envolve) funções de outros arquivos: update, onNewDay,
 * crewDrawList, targetAt, interactAt, bldAction, drawBrawlScene.
 */

"use strict";

(() => {
  const D = () => (player.dis = player.dis || { ruins: {}, cracks: {}, rainy: 0, dry: 0 });
  const town = () => ZONES[player.zone] && ZONES[player.zone].town && !ZONES[player.zone].town.indoor && player.zone !== "interior";
  const key = (b) => `${player.zone}:${b.x},${b.y}`;
  const news = (m) => typeof vilaNews === "function" && vilaNews(m);
  const realm = () => player.realm;
  const bldList = () => (ZONES[player.zone] && ZONES[player.zone].town ? ZONES[player.zone].town.bld : []).filter((b) => b.w >= 3 && !["castle", "fortaleza", "palacio", "farol", "mina"].includes(b.style));

  /* ===================== INCÊNDIO ===================== */
  let fire = null; // { z, b, v (0-100), helpers }
  function startFire() {
    const L = bldList().filter((b) => !D().ruins[key(b)]);
    if (!L.length) return;
    const b = pk(L);
    fire = { z: player.zone, b, v: 18 };
    game.bucket = false;
    playSound(160, 0.5, "sawtooth");
    toast(`FOGO! ${b.name || "Uma casa"} está pegando fogo! Pegue água no poço ou na fonte e jogue nas chamas!`, 6000);
  }
  function fireTick(dt) {
    if (!fire || fire.z !== player.zone) return;
    const seg = realm() ? realm().seg : 55;
    fire.v += dt * (1.1 - Math.min(0.7, seg / 140));
    if (fire.v >= 100) {
      D().ruins[key(fire.b)] = player.day + 4;
      news(`Incêndio destruiu ${fire.b.name || "uma casa"}. Os moradores perderam tudo.`);
      if (realm()) realm().social = Math.max(0, realm().social - 5);
      toast(`${fire.b.name || "A casa"} virou cinzas. Vai levar dias para reconstruir.`, 5000);
      fire = null;
    } else if (fire.v <= 0) {
      player.gold += 30;
      if (typeof repAdd === "function") repAdd(5);
      news(`Herói${genderWord("", "na", "e")} do dia: ${player.name} apagou o incêndio de ${fire.b.name || "uma casa"}!`);
      say([["", "As últimas brasas chiam e apagam. O povo aplaude, encharcado. O dono te dá 30 de ouro, chorando."]]);
      fire = null;
    }
  }
  const nearB = (b, x, y) => x >= b.x - 1 && x <= b.x + b.w && y >= b.y && y <= b.y + b.h;

  /* ===================== OUTROS DESASTRES ===================== */
  function quake() {
    game.shake = 3.2;
    playSound(60, 1.2, "sawtooth");
    const L = bldList();
    for (let i = 0; i < Math.min(3, L.length); i++) D().cracks[key(pk(L))] = player.day + 5;
    if (!game.inter && Math.random() < 0.6) player.hp = Math.max(1, player.hp - 8);
    if (realm()) realm().social = Math.max(0, realm().social - 4);
    news(`TERREMOTO! O chão de ${ZONES[player.zone].nome.split(",")[0]} tremeu e prédios racharam.`);
    setTimeout(() => toast("TERREMOTO! O chão treme, telhas caem e alguns prédios racharam!", 5500), 200);
    game.dust = 4;
  }
  const flooded = () => D().flood && D().flood.until >= player.day && D().flood.z === player.zone;
  let floodTiles = {};
  function floodSpots(zid) {
    if (floodTiles[zid]) return floodTiles[zid];
    const z = ZONES[zid],
      out = [];
    for (let y = 1; y < z.h - 1; y++)
      for (let x = 1; x < z.w - 1; x++) {
        if (!".,g".includes(z.map[y][x])) continue;
        let near = false;
        for (let dy = -3; dy <= 3 && !near; dy++) for (let dx = -3; dx <= 3; dx++) if ((z.map[y + dy] || "")[x + dx] === "~") near = true;
        if (near) out.push([x, y]);
      }
    return (floodTiles[zid] = out);
  }
  const rats = () => D().rats && D().rats.until >= player.day && player.zone === "vila";
  const drought = () => D().drought && D().drought.until >= player.day;

  // o dia decide o que a natureza traz
  const ndBase = onNewDay;
  onNewDay = function () {
    const r = ndBase.apply(this, arguments);
    const S = D(),
      w = player.weather,
      se = typeof season === "function" ? season().id : "pri";
    S.rainy = w === "chuva" || w === "tempestade" ? S.rainy + 1 : 0;
    S.dry = w === "sol" ? S.dry + 1 : 0;
    for (const k of ["ruins", "cracks"]) for (const [b, until] of Object.entries(S[k])) if (until < player.day) delete S[k][b];
    if (S.rainy >= 2 && !flooded() && town() && floodSpots(player.zone).length > 6) {
      S.flood = { z: player.zone, until: player.day + 1 };
      news("ENCHENTE! O rio transbordou e alagou as ruas perto da água. A plantação foi perdida.");
      setTimeout(() => toast("ENCHENTE! Depois de tanta chuva o rio transbordou. As ruas perto da água estão alagadas.", 5500), 3000);
      if (realm()) realm().saude = Math.max(0, realm().saude - 4);
    }
    if (se === "ver" && S.dry >= 4 && !drought()) {
      S.drought = { until: player.day + 3 };
      news("SECA! Quatro dias sem chuva: as lavouras amarelaram e o poço baixou.");
      setTimeout(() => toast("SECA! A terra rachou, a plantação amarelou e o poço quase não tem água.", 5500), 3500);
    }
    if (realm() && realm().limp < 30 && !rats() && Math.random() < 0.35) {
      S.rats = { until: player.day + 2 };
      news("Praga de ratos em Cinzaluz! O lixo nas ruas atraiu milhares deles.");
      setTimeout(() => toast("Praga de ratos! O lixo acumulado atraiu ratos para as ruas. Cuidado com doenças.", 5500), 4000);
    }
    if (se === "inv" && Math.random() < 0.25) ((S.blizzard = { until: player.day }), setTimeout(() => toast("NEVASCA! Neve até os joelhos. Ficar na rua cansa muito.", 5000), 4500));
    return r;
  };
  // incêndios e terremotos acontecem enquanto você está na rua (para viver o desastre)
  let acc = 0;
  const upBase = update;
  update = function (dt) {
    upBase(dt);
    if (!player || game.mode !== "world" || game.dialog) return;
    fireTick(dt);
    acc += dt;
    if (acc < 10) return;
    acc = 0;
    if (!town()) return;
    const limp = realm() ? realm().limp : 60,
      seg = realm() ? realm().seg : 60;
    if (!fire && Math.random() < 0.006 + (drought() ? 0.01 : 0) + (seg < 40 ? 0.004 : 0) + (limp < 35 ? 0.003 : 0)) startFire();
    else if (Math.random() < 0.0025) quake();
    if (rats() && Math.random() < 0.08 && typeof getSick === "function" && !player.sick) getSick("febre");
    if (D().blizzard && D().blizzard.until >= player.day && !game.inter && player.energy != null) player.energy = Math.max(0, player.energy - 1.5);
    if (flooded() && floodSpots(player.zone).some(([x, y]) => x === player.x && y === player.y) && player.hygiene != null) player.hygiene = Math.max(0, player.hygiene - 3);
  };
  if (typeof game.dust === "undefined") game.dust = 0;

  /* ----- baldes, portas fechadas e o poço na seca ----- */
  const tgBase = targetAt;
  targetAt = function (x, y) {
    const c = typeof tileAt === "function" ? tileAt(player.zone, x, y) : null;
    if (fire && fire.z === player.zone) {
      if ((c === "W" || c === "F") && !game.bucket) return "Encher o balde para o incêndio";
      if (game.bucket && nearB(fire.b, x, y)) return "Jogar a água no fogo!";
    }
    const b = c === "D" && ZONES[player.zone].town && ZONES[player.zone].town.doors[x + "," + y];
    if (b && D().ruins[key(b)]) return `${b.name || "Casa"}: em ruínas (reconstruindo)`;
    return tgBase(x, y);
  };
  const iaBase = interactAt;
  interactAt = function (x, y) {
    const c = typeof tileAt === "function" ? tileAt(player.zone, x, y) : null;
    if (fire && fire.z === player.zone) {
      if ((c === "W" || c === "F") && !game.bucket) return ((game.bucket = true), playSound(500, 0.1, "sine"), toast("Balde cheio! Corra até o fogo!", 1800));
      if (game.bucket && nearB(fire.b, x, y)) {
        game.bucket = false;
        fire.v -= 22;
        playSound(300, 0.2, "triangle");
        game.splash = { x, y, t: 0.6 };
        return toast(fire.v <= 0 ? "Última balde!" : `Chhhh! O fogo diminui (${Math.round(Math.max(0, fire.v))}%). Mais água!`, 1800);
      }
    }
    if (fire && fire.z === player.zone && c === "D" && ZONES[player.zone].town.doors[x + "," + y] === fire.b) return say([["", "Está pegando fogo lá dentro! Ninguém entra até apagar."]]);
    const b = c === "D" && ZONES[player.zone].town && ZONES[player.zone].town.doors[x + "," + y];
    if (b && D().ruins[key(b)]) return say([["", `Só restam vigas pretas e cinza de ${b.name || "esta casa"}. Os carpinteiros dizem que até o dia ${D().ruins[key(b)]} fica pronta.`]]);
    if (drought() && c === "W") {
      player.water = Math.min(100, (player.water || 0) + 25);
      return toast("O balde volta quase vazio: a seca baixou o poço. (+25 sede)", 2500);
    }
    return iaBase(x, y);
  };

  if (typeof bldAction === "function") {
    const baBase = bldAction;
    bldAction = function (b) {
      if (b && fire && fire.z === player.zone && fire.b === b) return say([["", "Está pegando fogo lá dentro! Ninguém entra até apagar."]]);
      if (b && D().ruins[key(b)]) return say([["", `Só restam vigas pretas e cinza de ${b.name || "esta casa"}. Os carpinteiros dizem que até o dia ${D().ruins[key(b)]} fica pronta.`]]);
      return baBase.apply(this, arguments);
    };
  }

  /* ===================== DESENHO ===================== */
  const cdBase = crewDrawList;
  crewDrawList = function (list, t) {
    cdBase(list, t);
    if (!ZONES[player.zone] || !ZONES[player.zone].town) return;
    const T = TILE;
    const R = (x, y, w, h, c) => ((ctx.fillStyle = c), ctx.fillRect(Math.round(x), Math.round(y), w, h));
    // ruínas e rachaduras por cima dos prédios
    for (const b of ZONES[player.zone].town.bld) {
      const k = key(b),
        ru = D().ruins[k],
        cr = D().cracks[k];
      if (!ru && !cr) continue;
      list.push({
        y: b.y + b.h - 0.01,
        draw: () => {
          const X = b.x * T,
            Y = b.y * T,
            W = b.w * T,
            H = b.h * T;
          if (ru) {
            ctx.fillStyle = "rgba(30,22,18,.72)";
            ctx.fillRect(X - 6, Y - 14, W + 12, H + 14);
            for (let i = 0; i < b.w * 2; i++) R(X + 4 + i * 15, Y + 4 + ((i * 7) % 18), 4, H - 14 - ((i * 7) % 18), "#1a1210");
            R(X, Y + H - 10, W, 10, "#3a3430");
            for (let i = 0; i < 4; i++) R(X + 10 + i * (W / 4) + Math.sin(t + i) * 2, Y - 10 - ((t * 15 + i * 9) % 30), 8, 8, "rgba(120,120,120,.35)");
          }
          if (cr) {
            ctx.strokeStyle = "rgba(30,20,14,.8)";
            ctx.lineWidth = 2;
            for (let i = 0; i < 2; i++) {
              const sx = X + 12 + i * (W - 30);
              ctx.beginPath();
              ctx.moveTo(sx, Y + H * 0.5);
              for (let j = 1; j < 6; j++) ctx.lineTo(sx + (j % 2 ? 6 : -4), Y + H * 0.5 + j * (H * 0.08));
              ctx.stroke();
            }
          }
        },
      });
    }
    // o incêndio
    if (fire && fire.z === player.zone) {
      const b = fire.b;
      list.push({
        y: b.y + b.h,
        draw: () => {
          const X = b.x * T,
            Y = b.y * T,
            W = b.w * T,
            k = fire.v / 100;
          const n = 4 + Math.round(k * 10);
          for (let i = 0; i < n; i++) {
            const fx = X + 8 + ((i * 37) % (W - 16)),
              fy = Y + 10 + ((i * 13) % 30) - k * 20,
              f = Math.sin(t * 12 + i) * 3;
            R(fx - 6, fy - 4 - f, 12, 18 + f, "#c9301a");
            R(fx - 4, fy - 10 - f, 8, 16, "#f2701a");
            R(fx - 2, fy - 14 - f, 4, 10, "#ffd24a");
          }
          for (let i = 0; i < 6; i++) R(X + 10 + i * (W / 6) + Math.sin(t * 2 + i) * 6, Y - 30 - ((t * 25 + i * 17) % 60) - k * 20, 12, 12, `rgba(60,60,60,${0.25 + k * 0.3})`);
          const gl = ctx.createRadialGradient(X + W / 2, Y + 20, 10, X + W / 2, Y + 20, 140);
          gl.addColorStop(0, `rgba(255,140,40,${0.25 + k * 0.2})`);
          gl.addColorStop(1, "rgba(255,140,40,0)");
          ctx.fillStyle = gl;
          ctx.fillRect(X - 140, Y - 140, W + 280, 300);
          // barra do fogo
          R(X + W / 2 - 40, Y - 70, 80, 8, "#2a1a1a");
          R(X + W / 2 - 39, Y - 69, 78 * k, 6, "#ff5a2a");
        },
      });
      if (game.bucket) list.push({ y: player.ry + 0.01, draw: () => (R(player.rx * T + 22, player.ry * T + 14, 8, 8, "#8a8a96"), R(player.rx * T + 23, player.ry * T + 14, 6, 2, "#4a8ac9")) });
      if (game.splash && (game.splash.t -= 0.016) > 0) list.push({ y: game.splash.y + 0.5, draw: () => { for (let i = 0; i < 8; i++) R(game.splash.x * T + 16 + Math.cos(i) * (1 - game.splash.t) * 30, game.splash.y * T + 10 + Math.sin(i) * (1 - game.splash.t) * 20, 3, 3, "#8ac8f0"); } });
    }
    // enchente: água rasa sobre as ruas perto do rio
    if (flooded())
      list.push({
        y: -1.5,
        draw: () => {
          for (const [x, y] of floodSpots(player.zone)) {
            R(x * T, y * T, T, T, "rgba(46,92,140,.82)");
            R(x * T, y * T, T, 2, "rgba(30,60,100,.5)");
            R(x * T + ((t * 10 + x * 7) % 26), y * T + 8 + (y % 3) * 7, 7, 2, "rgba(210,235,255,.75)");
            R(x * T + ((t * 6 + y * 11) % 24), y * T + 20, 5, 1, "rgba(210,235,255,.5)");
          }
        },
      });
    // seca: lavoura amarela e chão rachado
    if (drought())
      list.push({
        y: -1.4,
        draw: () => {
          const z = ZONES[player.zone];
          const cam = game.cam;
          if (!cam) return;
          const x0 = Math.max(0, Math.floor(cam.camX / T)),
            y0 = Math.max(0, Math.floor(cam.camY / T)),
            x1 = Math.min(z.w - 1, x0 + Math.ceil(viewWidth / cam.Z / T) + 1),
            y1 = Math.min(z.h - 1, y0 + Math.ceil(480 / cam.Z / T) + 1);
          for (let y = y0; y <= y1; y++)
            for (let x = x0; x <= x1; x++) {
              const c = z.map[y][x];
              if (c === "g") R(x * T, y * T, T, T, "rgba(200,150,60,.45)");
              else if (c === "." && (x * 7 + y * 3) % 5 === 0) (R(x * T + 6, y * T + 14, 10, 1, "rgba(90,60,30,.5)"), R(x * T + 15, y * T + 15, 1, 6, "rgba(90,60,30,.5)"));
            }
        },
      });
    // ratos correndo pela rua
    if (rats())
      for (let i = 0; i < 14; i++)
        list.push({
          y: 30,
          draw: () => {
            const z = ZONES.vila;
            const px = ((t * (30 + (i % 5) * 9) + i * 211) % (z.w * T)),
              py = (12 + ((i * 7) % 50)) * T + 22 + Math.sin(t * 3 + i) * 3;
            R(px, py, 10, 5, "#5a5048");
            R(px + 9, py + 1, 3, 3, "#6a6058");
            R(px - 5, py + 2, 5, 1, "#8a7a70");
          },
        });
  };
  // poeira do terremoto e neve grossa: efeitos de tela por cima de tudo
  const dbBase = drawBrawlScene;
  drawBrawlScene = function (t) {
    const r = dbBase.apply(this, arguments);
    if (game.dust > 0) {
      game.dust -= 0.016;
      ctx.fillStyle = `rgba(150,130,100,${Math.min(0.3, game.dust * 0.08)})`;
      ctx.fillRect(0, 0, viewWidth, 480);
      for (let i = 0; i < 40; i++) ((ctx.fillStyle = "rgba(120,100,80,.6)"), ctx.fillRect((i * 97 + t * 60) % viewWidth, (i * 53 + t * 220) % 480, 3, 3));
    }
    if (D().blizzard && D().blizzard.until >= player.day && town() && game.mode === "world") {
      ctx.fillStyle = "rgba(230,240,255,.18)";
      ctx.fillRect(0, 0, viewWidth, 480);
      for (let i = 0; i < 120; i++) ((ctx.fillStyle = "rgba(255,255,255,.8)"), ctx.fillRect((i * 97 + t * 260) % viewWidth, (i * 53 + t * 180) % 480, 3, 3));
    }
    return r;
  };
  /* ===================== A VILA PODE MORRER ===================== */
  // Com o reino abandonado por dias (média do Estado do Reino baixa), o povo
  // vai embora: casas ficam fechadas com tábuas, lojas fecham, as ruas
  // esvaziam. Abaixo de 15 por cinco dias, Cinzaluz é abandonada de vez e
  // quem governa cai. Investindo de novo, o povo volta aos poucos.
  const avg = () => {
    const r = realm();
    return r ? (r.limp + r.seg + r.edu + r.saude + r.social + (r.agua ?? 60)) / 6 : 60;
  };
  const people = () => Math.max(0.05, Math.min(1, (avg() - 10) / 45) - ((player.dis && player.dis.deaths) || 0) * 0.02);
  const hashB = (b) => ((b.x * 928371 + b.y * 1237) >>> 0) % 100;
  const empty = (b) => player.zone === "vila" && !b.name && hashB(b) >= people() * 100 + 10;
  const nd2 = onNewDay;
  onNewDay = function () {
    const r = nd2.apply(this, arguments);
    if (!lifeMode() || !realm()) return r;
    const S = D();
    const a = avg();
    const ag = realm().agua ?? 60;
    S.low = a < 15 || ag < 10 ? (S.low || 0) + 1 : 0;
    // sem água limpa o povo morre
    if (ag < 20 && !S.extinct) {
      const dead = 1 + Math.floor((20 - ag) / 5) + (Math.random() < 0.5 ? 1 : 0);
      S.deaths = (S.deaths || 0) + dead;
      // cada morto tem nome e vai para o cemitério
      const NOMES = ["Tomásia", "Bertoldo", "Genoveva", "Anselmo", "Clotilde", "Baltazar", "Rosalinda", "Firmino", "Leocádia", "Gaspar", "Iolanda", "Teobaldo", "Dorotéia", "Valdomiro"];
      S.named = S.named || [];
      for (let i = 0; i < dead; i++) S.named.push({ n: `${pk(NOMES)} ${pk(["do Moinho", "da Feira", "do Rio", "Ferreira", "Lavradora", "das Flores", "o Velho", "a Moça"])}`, day: player.day, sub: "Água podre dos poços" });
      if (S.named.length > 40) S.named.splice(0, S.named.length - 40);
      realm().saude = Math.max(0, realm().saude - 4);
      news(`A água podre dos poços matou ${dead} morador(es) de Cinzaluz. ${S.deaths} mortos desde que os poços foram abandonados.`);
      setTimeout(() => toast(`Morreram ${dead} moradores bebendo água contaminada. O governo precisa limpar os poços!`, 5500), 4200);
    }
    if (ag >= 40) S.deaths = 0;
    // a vila morta pela sede ameaça quem ficou
    if (S.extinct && ag < 10 && player.zone === "vila" && Math.random() < 0.3 && typeof lifeEnds === "function") {
      player.deathCause = "água contaminada";
      setTimeout(() => say([["", "Não há mais água limpa em Cinzaluz. A febre da água podre chega até você..."]], () => lifeEnds()), 6000);
    }
    if (a < 35 && !S.warned35) ((S.warned35 = true), setTimeout(() => toast("Famílias estão indo embora de Cinzaluz. Casas fechadas com tábuas. O governo precisa investir!", 6000), 5000), news("Êxodo! Famílias abandonam Cinzaluz: sem limpeza, sem guarda, sem escola."));
    if (a >= 45) S.warned35 = false;
    if (S.low >= 5 && !S.extinct) {
      S.extinct = player.day;
      news("CINZALUZ FOI ABANDONADA. As últimas famílias partiram. Só o vento mora nas ruas.");
      const ruler = typeof playerRules === "function" && playerRules();
      setTimeout(
        () =>
          say(
            [
              ["", "Você acorda e a vila está em silêncio. As portas batem com o vento. A feira não abriu. Ninguém na fonte."],
              ["", "Cinzaluz morreu de abandono. Sem cuidado, nenhuma vila aguenta."],
              ...(ruler ? [["", "O que restou do conselho te expulsa do castelo. Você não governa mais nada."]] : []),
            ],
            () => {
              if (ruler) {
                if (player.council && player.council.chief === "player") ((player.council.chief = "luca"), (player.councilChief = false), (player.regime = null));
                if (typeof throne === "function") delete throne().aurelia;
                if (typeof syncRulers === "function") syncRulers();
              }
              // a coroa nova manda reerguer devagar
              for (const k of ["limp", "seg", "edu", "saude", "social", "agua"]) realm()[k] = Math.max(realm()[k] ?? 0, 22);
            },
          ),
        5000,
      );
    }
    if (S.extinct && a >= 40) ((S.extinct = null), news("Cinzaluz renasce! Famílias voltam e as lojas reabrem."));
    return r;
  };
  // ruas mais vazias quando o povo vai embora
  const ezB = enterZone;
  enterZone = function () {
    const r = ezB.apply(this, arguments);
    if (lifeMode() && player.zone === "vila" && realm() && game.walkers) {
      const keep = Math.round(game.walkers.length * (D().extinct ? 0.05 : people()));
      game.walkers.length = Math.min(game.walkers.length, keep);
    }
    return r;
  };
  if (typeof bldAction === "function") {
    const ba2 = bldAction;
    bldAction = function (b) {
      if (lifeMode() && b && player.zone === "vila" && (empty(b) || (D().extinct && b.shop))) return say([["", D().extinct ? "Fechado. Todo mundo foi embora de Cinzaluz." : "A casa está vazia, com tábuas pregadas na porta. A família foi embora."]]);
      return ba2.apply(this, arguments);
    };
  }
  const cd2 = crewDrawList;
  crewDrawList = function (list, t) {
    cd2(list, t);
    if (!lifeMode() || player.zone !== "vila" || !realm()) return;
    const T = TILE;
    for (const b of ZONES.vila.town.bld) {
      if (!(empty(b) || (D().extinct && b.shop))) continue;
      list.push({
        y: b.y + b.h - 0.02,
        draw: () => {
          const X = b.x * T,
            Y = b.y * T,
            W = b.w * T,
            Hh = b.h * T;
          const roofH = Math.max(36, Math.round(Hh * 0.5));
          ctx.fillStyle = "rgba(40,36,30,.25)";
          ctx.fillRect(X, Y - 10, W, Hh + 10);
          // tábuas em X nas janelas e na porta
          ctx.strokeStyle = "#6b4a2a";
          ctx.lineWidth = 3;
          for (let k = 0; k < b.w; k++) {
            const wx = X + k * T + 8,
              wy = Y + roofH + 2;
            ctx.beginPath();
            ctx.moveTo(wx, wy);
            ctx.lineTo(wx + 16, wy + 16);
            ctx.moveTo(wx + 16, wy);
            ctx.lineTo(wx, wy + 16);
            ctx.stroke();
          }
          for (const dx of b.door) {
            const X2 = X + (dx - b.x) * T;
            ctx.fillStyle = "#7a5a32";
            ctx.fillRect(X2 + 4, Y + Hh - 24, 24, 4);
            ctx.fillRect(X2 + 4, Y + Hh - 14, 24, 4);
          }
          // mato crescendo na frente
          for (let i = 0; i < b.w * 2; i++) ((ctx.fillStyle = "#4a6a2a"), ctx.fillRect(X + 3 + i * 15, Y + Hh - 6 - (i % 3) * 2, 3, 6 + (i % 3) * 2));
        },
      });
    }
  };

  /* ----- consequências na lavoura e numa vila vazia ----- */
  if (typeof gatherInteract === "function") {
    const giBase = gatherInteract;
    gatherInteract = function (x, y) {
      const c = typeof tileAt === "function" ? tileAt(player.zone, x, y) : null;
      if (c === "g") {
        if (flooded() && floodSpots(player.zone).some(([a, b]) => a === x && b === y)) return say([["", "O trigo apodreceu debaixo d'água. Não sobrou nada para colher."]]), true;
        if (drought()) {
          if (Math.random() < 0.6) return say([["", "Só palha seca e grão chocho. A seca levou esta parte da lavoura."]]), true;
        }
      }
      return giBase.apply(this, arguments);
    };
  }
  // vila abandonada não tem festa, nem exposição, nem aniversário, nem a turma na rua
  for (const nm of ["festivalToday", "exhibitionToday", "birthdayToday"])
    if (typeof window[nm] === "function") {
      const base = window[nm];
      window[nm] = function () {
        if (lifeMode() && player && player.dis && player.dis.extinct && player.zone === "vila") return nm === "festivalToday" ? null : null;
        return base.apply(this, arguments);
      };
    }
  if (typeof crewVisible === "function") {
    const cvBase = crewVisible;
    crewVisible = function () {
      if (lifeMode() && player.dis && player.dis.extinct && player.zone === "vila") return false;
      return cvBase.apply(this, arguments);
    };
  }

  /* ----- água suja: sem limpeza, o rio e a fonte apodrecem ----- */
  // A água limpa vem dos POÇOS, e quem cuida deles é o governo. O rio nunca
  // é seguro para beber; com a vila suja, piora.
  const wellsBad = () => lifeMode() && realm() && (realm().agua ?? 60) < 40 && (player.zone === "vila" || player.zone === "porto" || player.zone === "serra");
  const dirty = () => lifeMode() && realm() && (realm().limp < 40 || (realm().agua ?? 60) < 40) && (player.zone === "vila" || player.zone === "porto" || player.zone === "serra");
  const iaW = interactAt;
  interactAt = function (x, y) {
    const c = typeof tileAt === "function" ? tileAt(player.zone, x, y) : null;
    const r = iaW.apply(this, arguments);
    if (!lifeMode() || (fire && fire.z === player.zone) || player.sick || typeof getSick !== "function") return r;
    let risk = 0;
    if (c === "~") risk = 0.2 + (realm() && realm().limp < 40 ? 0.3 : 0);
    if ((c === "W" || c === "F") && wellsBad()) risk = (realm().agua ?? 60) < 20 ? 0.7 : 0.4;
    if (risk && Math.random() < risk) setTimeout(() => (toast(c === "~" ? "Água de rio não é de beber... seu estômago revira." : "O poço está contaminado! Seu estômago revira.", 3200), getSick(pk(["intox", "disenteria"]))), 900);
    return r;
  };
  const cdW = crewDrawList;
  crewDrawList = function (list, t) {
    cdW(list, t);
    if (!dirty()) return;
    const z = ZONES[player.zone],
      cam = game.cam,
      T = TILE;
    if (!cam) return;
    const k = Math.min(1, (40 - Math.min(realm().limp, realm().agua ?? 60)) / 30);
    list.push({
      y: -1.6,
      draw: () => {
        const x0 = Math.max(0, Math.floor(cam.camX / T)),
          y0 = Math.max(0, Math.floor(cam.camY / T)),
          x1 = Math.min(z.w - 1, x0 + Math.ceil(viewWidth / cam.Z / T) + 1),
          y1 = Math.min(z.h - 1, y0 + Math.ceil(480 / cam.Z / T) + 1);
        for (let y = y0; y <= y1; y++)
          for (let x = x0; x <= x1; x++) {
            const c = z.map[y][x];
            if (c === "~" ? !(realm().limp < 40) : c === "F" || c === "W" ? !wellsBad() : true) continue;
            // água turva, espuma e lixo boiando
            ctx.fillStyle = `rgba(90,96,50,${0.35 + 0.35 * k})`;
            ctx.fillRect(x * T, y * T, T, T);
            if ((x * 7 + y * 13) % 4 === 0) {
              const ox = (t * 6 + x * 11) % 22;
              ctx.fillStyle = "#6a5a3a";
              ctx.fillRect(x * T + 4 + ox, y * T + 12, 6, 4);
              ctx.fillStyle = "#c9c0a0";
              ctx.fillRect(x * T + 2 + ((ox + 9) % 24), y * T + 22, 4, 2);
            }
            if ((x + y) % 3 === 0) ((ctx.fillStyle = "rgba(220,220,190,.35)"), ctx.fillRect(x * T + 8, y * T + 4 + ((t * 4) % 20), 10, 2));
          }
      },
    });
  };

  /* ----- o poço, caprichado ----- */
  // Poço de pedra redondo com telhadinho de telhas, manivela, corda e um
  // balde de madeira balançando. A água brilha limpa, ou fica turva quando
  // o governo abandona os poços.
  if (typeof drawTile === "function") {
    const dtBase = drawTile;
    drawTile = function (z, x, y, c, t) {
      if (c !== "W") return dtBase.apply(this, arguments);
      // o chão do poço copia o chão em volta (rua de terra ou grama)
      const nb = [tileAt(z, x - 1, y), tileAt(z, x + 1, y), tileAt(z, x, y + 1), tileAt(z, x, y - 1)];
      const gc = nb.filter((q) => q === ",").length >= 2 ? "," : ".";
      dtBase.call(this, z, x, y, gc, t);
      const X = x * TILE,
        Y = y * TILE;
      const R = (a, b, w, h, col) => ((ctx.fillStyle = col), ctx.fillRect(X + a, Y + b, w, h));
      const bad = lifeMode() && player.realm && (player.realm.agua ?? 60) < 40 && ZONES[z] && ZONES[z].town;
      // sombra
      ctx.fillStyle = "rgba(0,0,0,.25)";
      ctx.beginPath();
      ctx.ellipse(X + 16, Y + 29, 14, 3.5, 0, 0, 7);
      ctx.fill();
      // corpo de pedra (duas fileiras, pedras alternadas)
      R(4, 17, 24, 11, "#7a7468");
      for (let r = 0; r < 2; r++) for (let k = 0; k < 4; k++) R(4 + k * 6 + (r % 2) * 3, 17 + r * 5, 5, 4, (k + r) % 2 ? "#8f897d" : "#a39d90");
      R(4, 27, 24, 1, "#5a554c");
      // borda de cima, com a água lá dentro
      R(3, 14, 26, 4, "#b8b2a4");
      R(3, 14, 26, 1, "#d0cabc");
      R(6, 15, 20, 2, bad ? "#4a5a2a" : "#2a5a8a");
      R(8 + ((t * 8) % 12), 15, 3, 1, bad ? "#8a8a5a" : "#9fd0f0");
      // musgo e uma florzinha no pé
      R(4, 24, 3, 3, "#4a7a3a");
      R(26, 22, 2, 5, "#4a7a3a");
      R(26, 21, 2, 2, "#e86a8a");

    };

    // postes, balde e telhadinho ficam na camada dos objetos (por cima do chão)
    const cdP = crewDrawList;
    crewDrawList = function (list, t) {
      cdP(list, t);
      const z = ZONES[player.zone],
        cam = game.cam;
      if (!z || !cam) return;
      const x0 = Math.max(0, Math.floor(cam.camX / TILE) - 1),
        y0 = Math.max(0, Math.floor(cam.camY / TILE) - 1),
        x1 = Math.min(z.w - 1, x0 + Math.ceil(viewWidth / cam.Z / TILE) + 2),
        y1 = Math.min(z.h - 1, y0 + Math.ceil(480 / cam.Z / TILE) + 2);
      for (let y = y0; y <= y1; y++)
        for (let x = x0; x <= x1; x++)
          if (z.map[y][x] === "W")
            list.push({
              y: y - 0.05,
              draw: () => {
                const X = x * TILE,
                  Y = y * TILE;
                const R = (a, b, w, h, col) => ((ctx.fillStyle = col), ctx.fillRect(X + a, Y + b, w, h));
                // postes e travessa com manivela
                R(5, 0, 3, 15, "#6b4423");
                R(24, 0, 3, 15, "#6b4423");
                R(6, 0, 1, 15, "#8a5a2e");
                R(5, 3, 22, 2, "#5a3a1e");
                R(27, 2, 3, 2, "#8a8a96");
                R(29, 2, 1, 5, "#8a8a96");
                // corda e balde balançando
                const sw = Math.sin(t * 1.5 + x) * 1;
                R(16 + sw, 5, 1, 6, "#c9b080");
                R(13 + sw, 10, 7, 5, "#8a5a2e");
                R(13 + sw, 10, 7, 1, "#a8784a");
                R(13 + sw, 12, 7, 1, "#5a5a5a");
                // telhadinho de telhas
                ctx.fillStyle = "#8c3b2e";
                fillPolygon(X - 1, Y + 2, X + 16, Y - 10, X + 33, Y + 2);
                ctx.fillStyle = "#a8483a";
                fillPolygon(X - 1, Y + 2, X + 16, Y - 10, X + 16, Y + 2);
                for (let r = 0; r < 3; r++) R(3 + r * 3, -6 + r * 3, 26 - r * 6, 1, "rgba(60,20,10,.35)");
                R(15, -12, 2, 3, "#5a3a1e");
                R(-1, 2, 34, 2, "#5a2a1e");
              },
            });
    };
  }

  if (typeof cemGraves === "function") {
    const cgBase = cemGraves;
    cemGraves = function () {
      const L = cgBase.apply(this, arguments);
      const named = (player.dis && player.dis.named) || [];
      let k = named.length - 1;
      // os túmulos antigos dão lugar aos mortos de agora (os mais recentes primeiro)
      for (const g of L) if (g.old && k >= 0) (Object.assign(g, { n: named[k].n, sub: `Dia ${named[k].day} · ${named[k].sub}`, old: false, recent: true }), k--);
      return L;
    };
  }

  window.disasterTest = { fire: startFire, quake, state: D, getFire: () => fire, flooded: () => flooded(), spots: () => floodSpots(player.zone).length };
})();
