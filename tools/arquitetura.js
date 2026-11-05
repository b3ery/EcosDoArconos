/**
 * Gera docs/ARQUITETURA.md: os scripts na ordem em que carregam, o que cada um faz
 * e quais funções de arquivos anteriores ele "embrulha" (substitui chamando a original).
 * Uso: node tools/arquitetura.js
 */
const fs = require("fs");
const path = require("path");
const root = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const scripts = [...html.matchAll(/<script src="(js\/[^"]+)"><\/script>/g)].map((m) => m[1]);
const defined = {};
let out = `# Arquitetura do Ecos do Arcano

> Gerado por \`node tools/arquitetura.js\`. Não edite à mão.

O jogo é JavaScript puro, sem framework: cada arquivo é um \`<script>\` comum e todos compartilham
o mesmo escopo global. **A ordem importa:** um arquivo só pode usar o que veio antes.

Para acrescentar algo sem mexer no arquivo antigo, os arquivos novos **embrulham** funções antigas:

\`\`\`js
const _abrirLojaBase = openShop;   // guarda a original
openShop = function (id) {          // substitui
  _abrirLojaBase(id);               // chama a original
  // ...e faz algo a mais
};
\`\`\`

A coluna "Embrulha" mostra exatamente isso. Antes de mudar uma função, procure aqui quem a embrulha.

## Pastas

| Pasta | Assunto |
|---|---|
| \`js/nucleo\` | Dados, estado, laço principal, entrada (teclado), gerador de ícones |
| \`js/mundo\` | Mapas, geração do mundo, reinos, casas, floresta, quintal, clima |
| \`js/historia\` | Batalha, caminho do vilão, missões da mina e do farol |
| \`js/pessoas\` | Família, amizades, diálogos, turma, contatos, interações |
| \`js/vida\` | Simulador de Vida, profissões, carreiras, saúde, calendário |
| \`js/interface\` | Telas: inventário, lojas, criador, menus, opções, conquistas |

## Scripts (na ordem de carregamento)

| # | Arquivo | O que faz | Embrulha |
|---|---|---|---|
`;
scripts.forEach((s, i) => {
  const src = fs.readFileSync(path.join(root, s), "utf8");
  const doc = (src.match(/\/\*\*[\s\S]*?\*\//) || [""])[0]
    .split("\n")
    .slice(2)
    .map((l) => l.replace(/^\s*\*\/?\s?/, "").trim())
    .filter((l) => l && !l.startsWith("/"))
    .join(" ")
    .slice(0, 180);
  const wraps = [...src.matchAll(/^const _\w+ = (\w+);\s*\n\s*\1 = function/gm)].map((m) => m[1]);
  const uniq = [...new Set(wraps)].map((f) => `\`${f}\`${defined[f] ? ` (${path.basename(defined[f])})` : ""}`);
  for (const m of src.matchAll(/^function (\w+)\(/gm)) if (!defined[m[1]]) defined[m[1]] = s;
  out += `| ${i + 1} | \`${s}\` | ${doc.replace(/\|/g, "/")} | ${uniq.join(", ") || "—"} |\n`;
});
out += `
## Testes

- \`npm run check\`: confere a sintaxe de todos os scripts.
- \`npm test\`: abre o jogo num navegador (Playwright) e passa pelas telas principais dos dois modos.
- Os dois rodam sozinhos no GitHub a cada push (\`.github/workflows/testes.yml\`).

## Versão de um arquivo só

\`npm run build\` junta todos os scripts em \`dist/ecos.js\` (pasta ignorada pelo git).
`;
fs.mkdirSync(path.join(root, "docs"), { recursive: true });
fs.writeFileSync(path.join(root, "docs", "ARQUITETURA.md"), out);
console.log("docs/ARQUITETURA.md gerado com", scripts.length, "scripts.");
