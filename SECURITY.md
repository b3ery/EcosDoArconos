# Segurança — Ecos do Arcano

O jogo roda só no navegador (HTML, CSS e JavaScript, sem servidor e sem login).
Os dados ficam no `localStorage` do próprio aparelho. Mesmo assim, ele tem
várias camadas de proteção:

| Camada | Onde | O que faz |
| --- | --- | --- |
| Content-Security-Policy | `index.html` (`<meta>`) | Só roda script dos arquivos do jogo. Bloqueia script inline, `onerror`/`onclick` em HTML, scripts de outros sites, plugins, `<base>` e formulários. |
| Trusted Types | `js/nucleo/seguranca.js` | Todo HTML posto na página passa por `limpaHTML()`, que tira `<script>`, `<iframe>`, atributos `on...=`, `javascript:` e `srcdoc`. `eval` e afins ficam proibidos. |
| Limpeza de dados | `js/nucleo/seguranca.js` | Saves, opções e tudo que é importado passam por `limpaDados()`: HTML vira texto e chaves `__proto__`/`constructor`/`prototype` são descartadas (poluição de protótipo). |
| Campos de nome | `js/nucleo/seguranca.js` | `< > " ' \` &` e caracteres de controle não entram em nomes. |
| Importar save | `js/interface/acessibilidade-e-save.js` | Confere o formato, limita o tamanho (8 MB) e limpa antes de gravar. |
| Protótipos congelados | `js/nucleo/seguranca.js` | `Object.prototype`, `Array.prototype` etc. ficam imutáveis depois do carregamento. |
| Clickjacking | `js/nucleo/seguranca.js` | Se o jogo for aberto escondido num `<iframe>` de outro site, uma capa cobre tudo e oferece abrir na aba de verdade. |
| Fontes locais | `css/fontes.css`, `assets/fonts/` | Sem Google Fonts: nenhum dado de quem joga vai para outro servidor. |
| Sem referrer | `index.html` | O endereço da página não é enviado a ninguém. |
| GitHub Actions | `.github/workflows/testes.yml` | O robô dos testes só tem permissão de leitura e não guarda credenciais. |

Limite conhecido: o GitHub Pages não permite cabeçalhos HTTP próprios, então
`frame-ancestors`, HSTS e relatórios de CSP não podem ser enviados; por isso a
defesa contra iframe é feita em JavaScript.

## Como avisar sobre uma falha

Abra uma *issue* no repositório com o título "Segurança" (sem colocar o passo a
passo de ataque em público) ou fale direto com a equipe do projeto.
