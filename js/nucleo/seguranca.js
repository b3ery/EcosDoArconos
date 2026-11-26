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
 * A política de conteúdo (CSP) fica numa <meta> no topo do index.html.
 * Exporta: limpaTexto, limpaNome, limpaDados.
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

  /* ----- 3. limites para importar ----- */
  window.SEGURANCA = { maxImport: 8 * 1024 * 1024 };
})();
