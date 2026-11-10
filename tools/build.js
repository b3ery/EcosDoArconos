/**
 * Junta todos os scripts do jogo num arquivo só (dist/ecos.js), na mesma ordem
 * do index.html, e gera dist/index.html carregando só esse arquivo.
 * Uso: node tools/build.js
 * Para publicar a versão rápida no GitHub Pages, publique a pasta dist/.
 */
const fs = require("fs");
const path = require("path");
const root = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const scripts = [...html.matchAll(/<script src="(js\/[^"]+)"><\/script>/g)].map((m) => m[1]);
const dist = path.join(root, "dist");
fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(dist, { recursive: true });
let bundle = "";
for (const s of scripts) bundle += `\n/* ===== ${s} ===== */\n` + fs.readFileSync(path.join(root, s), "utf8").replace(/^"use strict";\s*$/m, "") + "\n";
fs.writeFileSync(path.join(dist, "ecos.js"), '"use strict";\n' + bundle);
let out = html;
scripts.forEach((s, i) => (out = out.replace(`<script src="${s}"></script>`, i === 0 ? '<script src="ecos.js"></script>' : "")));
fs.writeFileSync(path.join(dist, "index.html"), out.replace(/\n\s*\n\s*\n/g, "\n"));
for (const dir of ["css", "assets", "audio"]) fs.cpSync(path.join(root, dir), path.join(dist, dir), { recursive: true });
for (const f of ["favicon.ico", "manifest.json", "dev.html"]) if (fs.existsSync(path.join(root, f))) fs.copyFileSync(path.join(root, f), path.join(dist, f));
const kb = (n) => Math.round(n / 1024) + " KB";
console.log(`${scripts.length} scripts juntados em dist/ecos.js (${kb(bundle.length)}).`);
