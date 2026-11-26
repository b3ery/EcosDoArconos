/**
 * ECOS DO ARCANO — seguranca.js
 * Carrega ANTES de todos os outros arquivos. Fecha as portas de entrada de
 * código malicioso (XSS) num jogo que monta muitas telas com innerHTML:
 *
 * 1. Campos de texto (nome do personagem, do filho, do bichinho...): os
 *    caracteres que montam HTML (< > " ' ` & e controles) são tirados enquanto
 *    a pessoa digita. Nomes nunca precisam deles.
 * 2. Tudo que o jogo lê do localStorage (save, opções, cemitério, desafios) e
 *    tudo que chega por "Importar" (arquivo .json ou código colado) passa por
 *    limpaDados(): tags HTML viram texto (só ficam <b>, <i>, <br>... sem
 *    atributos), aspas que poderiam fechar um atributo são trocadas e chaves
 *    perigosas (__proto__, constructor, prototype) são descartadas (poluição
 *    de protótipo). Um save "envenenado" compartilhado não roda script.
 * 3. Limites de tamanho para o que é importado.
 * 4. Trusted Types: todo HTML posto na página passa por limpaHTML().
 * 5. Defesa contra clickjacking (jogo escondido num iframe de outro site;
 *    o itch.io pode embutir).
 * 6. Protótipos (Object, Array...) congelados depois do carregamento.
 * A política de conteúdo (CSP) fica numa <meta> no topo do index.html.
 * Exporta: limpaTexto, limpaNome, limpaDados, limpaHTML.
 */

"use strict";

(() => {
  const OK_TAGS = new Set(["b", "i", "u", "s", "em", "strong", "small", "br", "sup", "sub"]);
  const BAD_KEYS = new Set(["__proto__", "constructor", "prototype"]);
  const MAX_STR = 200000;

  /** Texto livre vindo de fora: tags viram texto, exceto as de formatação simples sem atributos. */
  function limpaTexto(s) {
    if (typeof s !== "string") return s;
    if (s.length > MAX_STR) s = s.slice(0, MAX_STR);
    if (!/[<>"]/.test(s)) return s;
    const keep = [];
    let t = s.replace(/<\/?([a-z][a-z0-9]*)\s*\/?>/gi, (m, tag) => {
      if (!OK_TAGS.has(tag.toLowerCase())) return m;
      keep.push(m);
      return "\u0000" + (keep.length - 1) + "\u0000";
    });
    t = t.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    // aspas + "=" juntas podem fechar um atributo e abrir outro (onclick=...)
    if (t.includes('"') && t.includes("=")) t = t.replace(/"/g, "”");
    return t.replace(/\u0000(\d+)\u0000/g, (_, i) => keep[+i]);
  }
  /** Nomes: só letras, números, espaço e pontuação simples. */
  function limpaNome(s, max) {
    return String(s == null ? "" : s)
      .replace(/&(lt|gt|amp|quot);/g, "")
      .replace(/<[^>]*>?/g, "")
      .replace(/[<>"'`&\\\u0000-\u001f\u007f]/g, "")
      .slice(0, max || 40);
  }
  /** Limpa um objeto inteiro (save, opções...) sem mudar a forma dele. */
  function limpaDados(v, depth) {
    depth = depth || 0;
    if (depth > 64) return null;
    if (typeof v === "string") return limpaTexto(v);
    if (Array.isArray(v)) {
      for (let i = 0; i < v.length; i++) v[i] = limpaDados(v[i], depth + 1);
      return v;
    }
    if (v && typeof v === "object") {
      for (const k of Object.keys(v)) {
        if (BAD_KEYS.has(k) || /[<>"]/.test(k)) {
          delete v[k];
          continue;
        }
        v[k] = limpaDados(v[k], depth + 1);
      }
      return v;
    }
    return v;
  }

  /* ----- 0. dicas na tela de carregamento (o resto do jogo ainda está baixando) ----- */
  try {
    const DICAS = ["Despertando as runas...", "Acendendo as lareiras da taverna...", "Afiando o cajado do aprendiz...", "Enchendo o mar de peixes (e tubarões)...", "Contando as moedas do reino...", "Ensaiando o bardo...", "Desenhando cada pixel com carinho..."];
    let i = 0;
    const t = setInterval(() => {
      const d = document.getElementById("cgDica");
      if (!d) return clearInterval(t);
      d.textContent = DICAS[++i % DICAS.length];
    }, 1600);
  } catch (e) {}
  window.limpaTexto = limpaTexto;
  window.limpaNome = limpaNome;
  window.limpaDados = limpaDados;

  /* ----- 1. campos de texto ----- */
  const NAME_FIELDS = (el) => el && el.tagName === "INPUT" && (el.type === "text" || el.type === "" || el.type === "search") && el.id !== "dvCmd";
  document.addEventListener(
    "input",
    (e) => {
      const el = e.target;
      if (!NAME_FIELDS(el)) return;
      const v = limpaNome(el.value, el.maxLength > 0 ? el.maxLength : 40);
      if (v !== el.value) el.value = v;
    },
    true,
  );


  /* ----- 2b. salvamento reserva ----- */
  // Dentro de alguns iframes isolados (o itch.io no celular, abas privadas)
  // o navegador proíbe o localStorage e qualquer acesso dá erro. Aí o jogo
  // usa uma memória que dura enquanto a aba estiver aberta, em vez de quebrar.
  (() => {
    try {
      const s = window.localStorage;
      s.setItem("__ecos_t", "1");
      s.removeItem("__ecos_t");
      return;
    } catch (e) {}
    const mem = () => {
      const m = new Map();
      return {
        getItem: (k) => (m.has(String(k)) ? m.get(String(k)) : null),
        setItem: (k, v) => void m.set(String(k), String(v)),
        removeItem: (k) => void m.delete(String(k)),
        clear: () => m.clear(),
        key: (i) => [...m.keys()][i] ?? null,
        get length() {
          return m.size;
        },
      };
    };
    for (const nome of ["localStorage", "sessionStorage"])
      try {
        const st = mem();
        Object.defineProperty(window, nome, { configurable: true, get: () => st });
      } catch (e) {}
    window.SEGURANCA = Object.assign(window.SEGURANCA || {}, { semSalvar: true });
  })();

  /* ----- 2. tudo que sai do localStorage do jogo passa pela limpeza ----- */
  try {
    const S = Storage.prototype;
    const get = S.getItem;
    const cache = new Map();
    const ours = (k) => typeof k === "string" && /^ecos/i.test(k);
    S.getItem = function (k) {
      const raw = get.call(this, k);
      if (raw == null || !ours(k) || this !== window.localStorage) return raw;
      const c = cache.get(k);
      if (c && c[0] === raw) return c[1];
      let out = raw;
      const t = raw.trim();
      if (t[0] === "{" || t[0] === "[") {
        try {
          out = JSON.stringify(limpaDados(JSON.parse(raw)));
        } catch (e) {
          out = limpaTexto(raw);
        }
      } else if (/[<>"]/.test(raw)) out = limpaTexto(raw);
      cache.set(k, [raw, out]);
      return out;
    };
  } catch (e) {}


  /* ----- 4. Trusted Types: todo HTML que entra na página passa por aqui ----- */
  // A CSP do index.html exige Trusted Types. Esta política "default" recebe
  // TODA string que vai para innerHTML/insertAdjacentHTML e tira o que roda
  // código: <script>, <iframe>, <object>, atributos on...=, javascript:, srcdoc.
  // É a rede de segurança final caso algum texto de fora escape da limpeza.
  const PERIGO = /<\s*\/?\s*(script|iframe|frame|object|embed|base|meta|link|form|applet|portal)\b|\son[a-z]+\s*=|javascript\s*:|vbscript\s*:|srcdoc\s*=|data\s*:\s*text\/html/i;
  function limpaHTML(h) {
    h = String(h);
    if (!PERIGO.test(h)) return h;
    let t = h;
    for (let i = 0; i < 3 && PERIGO.test(t); i++)
      t = t
        .replace(/<\s*(script|iframe|frame|object|embed|applet|portal)\b[\s\S]*?<\s*\/\s*\1\s*>/gi, "")
        .replace(/<\s*\/?\s*(script|iframe|frame|object|embed|base|meta|link|form|applet|portal)\b[^>]*>?/gi, "")
        .replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]*)/gi, "")
        .replace(/\ssrcdoc\s*=\s*("[^"]*"|'[^']*'|[^\s>]*)/gi, "")
        .replace(/(javascript|vbscript)\s*:/gi, "")
        .replace(/data\s*:\s*text\/html/gi, "");
    if (window.SEGURANCA) {
      SEGURANCA.bloqueios = (SEGURANCA.bloqueios || 0) + 1;
      (SEGURANCA.ultimos = SEGURANCA.ultimos || []).push(h.slice(Math.max(0, h.search(PERIGO) - 60), h.search(PERIGO) + 80));
      if (SEGURANCA.ultimos.length > 10) SEGURANCA.ultimos.shift();
    }
    return t;
  }
  window.limpaHTML = limpaHTML;
  const mesmaOrigem = (u) => {
    try {
      const x = new URL(u, location.href);
      return x.origin === location.origin || (location.protocol === "file:" && x.protocol === "file:");
    } catch (e) {
      return false;
    }
  };
  try {
    if (window.trustedTypes && trustedTypes.createPolicy)
      trustedTypes.createPolicy("default", {
        createHTML: limpaHTML,
        // eval, new Function e setTimeout("texto") ficam proibidos
        createScript: () => null,
        // só carrega script do próprio jogo
        createScriptURL: (u) => (mesmaOrigem(u) ? u : null),
      });
  } catch (e) {}

  /* ----- 5. Clickjacking: jogo aberto escondido dentro de outro site ----- */
  // O GitHub Pages não deixa mandar o cabeçalho frame-ancestors, então a
  // defesa é aqui: se a página estiver dentro de um <iframe> de outro site,
  // uma capa opaca cobre tudo (cliques invisíveis não chegam no jogo) e
  // oferece abrir o jogo na aba de verdade.
  // Sites que podem mostrar o jogo num iframe: o itch.io (o jogo fica no CDN
  // dele: html-classic.itch.zone / *.hwcdn.net) e o próprio site do jogo.
  const PODE_EMBUTIR = /(^|\.)(itch\.io|itch\.zone|hwcdn\.net)$/i;
  function emOutroSite() {
    if (window.top === window.self) return false;
    if (PODE_EMBUTIR.test(location.hostname)) {
      // no Chrome/Safari dá para conferir quem está por fora do iframe
      const anc = location.ancestorOrigins;
      if (!anc || !anc.length) return false;
      return ![...anc].every((o) => {
        try {
          return PODE_EMBUTIR.test(new URL(o).hostname) || new URL(o).origin === location.origin;
        } catch (e) {
          return false;
        }
      });
    }
    try {
      return window.top.location.origin !== location.origin;
    } catch (e) {
      return true;
    }
  }
  if (emOutroSite())
    document.addEventListener("DOMContentLoaded", () => {
      const c = document.createElement("a");
      c.href = location.href;
      c.target = "_blank";
      c.rel = "noopener noreferrer";
      c.textContent = "Este jogo foi aberto dentro de outro site. Toque aqui para abrir o Ecos do Arcano com segurança.";
      c.style.cssText = "position:fixed;inset:0;z-index:2147483647;display:flex;align-items:center;justify-content:center;text-align:center;padding:24px;background:#140c20;color:#f2c14e;font:700 20px sans-serif;text-decoration:none";
      document.body.appendChild(c);
    });

  /* ----- 6. Protótipos congelados depois que o jogo carregou ----- */
  // Mesmo que algum dado de fora tente "poluir" Object.prototype
  // (__proto__/constructor), não dá para mudar mais nada nele.
  addEventListener("load", () => {
    try {
      for (const P of [Object.prototype, Array.prototype, Function.prototype, String.prototype, Number.prototype, Boolean.prototype]) Object.freeze(P);
    } catch (e) {}
  });

  /* ----- 3. limites para importar ----- */
  window.SEGURANCA = Object.assign(window.SEGURANCA || {}, { maxImport: 8 * 1024 * 1024 });
})();
