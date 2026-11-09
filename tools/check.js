/**
 * Confere a sintaxe de todos os scripts do jogo (npm run check).
 * Também garante que todo arquivo em js/ está no index.html, e vice-versa.
 */
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const root = path.join(__dirname, "..");
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : e.name.endsWith(".js") ? [path.join(d, e.name)] : []));
const files = walk(path.join(root, "js")).map((f) => path.relative(root, f).split(path.sep).join("/"));
for (const f of files) execFileSync(process.execPath, ["--check", path.join(root, f)]);

const listed = [...fs.readFileSync(path.join(root, "index.html"), "utf8").matchAll(/src="(js\/[^"]+)"/g)].map((m) => m[1]);
const missing = files.filter((f) => !listed.includes(f));
const ghost = listed.filter((f) => !files.includes(f));
if (missing.length || ghost.length) {
  if (missing.length) console.error("Fora do index.html:", missing.join(", "));
  if (ghost.length) console.error("No index.html mas não existe:", ghost.join(", "));
  process.exit(1);
}
console.log(`ok (${files.length} scripts)`);
