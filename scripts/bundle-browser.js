/**
 * Browser Bundler Script
 * Bundles src/ into dist/aduscript-browser.js
 */

import fs from 'node:fs';
import path from 'node:path';

const tokensCode = fs.readFileSync('src/tokens.js', 'utf-8')
  .replace(/export /g, '');

const lexerCode = fs.readFileSync('src/lexer.js', 'utf-8')
  .replace(/import .*/g, '')
  .replace(/export /g, '');

const astCode = fs.readFileSync('src/ast.js', 'utf-8')
  .replace(/export /g, '');

const parserCode = fs.readFileSync('src/parser.js', 'utf-8')
  .replace(/import .*/g, '')
  .replace(/export /g, '')
  .replace(/AST\./g, '');

const runtimeCode = fs.readFileSync('src/runtime.js', 'utf-8')
  .replace(/export /g, '');

const codegenCode = fs.readFileSync('src/codegen.js', 'utf-8')
  .replace(/import .*/g, '')
  .replace(/export /g, '');

const bundle = `/**
 * AduScript In-Browser Compiler & Client Runtime (Standalone Bundle)
 * Deliverable D: Zero-dependency compiler and automatic <script type="text/aduscript"> runner.
 * Version: 1.0.0
 */

(function (global) {
  'use strict';

  // --- TOKENS ---
  ${tokensCode}

  // --- AST ---
  ${astCode}

  // --- RUNTIME ($adu) ---
  ${runtimeCode}

  // --- LEXER ---
  ${lexerCode}

  // --- PARSER ---
  ${parserCode}

  // --- CODE GENERATOR ---
  ${codegenCode}

  // --- HIGH LEVEL COMPILER API ---
  function tokenize(source, filename = '<anonymous>') {
    return new Lexer(source, filename).tokenize();
  }

  function parse(source, filename = '<anonymous>') {
    const tokens = tokenize(source, filename);
    return new Parser(tokens, source).parseProgram();
  }

  function compile(source, options = {}) {
    const filename = options.sourceFileName || '<anonymous>';
    const tokens = tokenize(source, filename);
    const ast = new Parser(tokens, source).parseProgram();
    const { code, map } = CodeGenerator.generate(ast, Object.assign({ moduleType: 'esm' }, options));
    return { code, ast, tokens, map, version: '1.0.0' };
  }

  // --- RECURSIVE SUBFOLDER MODULE RESOLVER ---
  const moduleCache = new Map();

  async function resolveAndCompileModule(source, baseUrl) {
    const defaultBase = typeof location !== 'undefined' ? location.href : 'http://localhost/';
    const base = baseUrl || defaultBase;
    const res = compile(source, { moduleType: 'inline-runtime' });
    let code = res.code;

    // Match relative imports: import ... from "./..." or from "../..."
    const importRegex = /import\s+((?:[^{}]+|\{[^{}]*\})\s+from\s+)?["'](\.[^"']+)["'];?/g;
    const matches = [...code.matchAll(importRegex)];

    for (const match of matches) {
      const fullImport = match[0];
      const clause = match[1] || '';
      const importPath = match[2];
      const resolvedUrl = new URL(importPath, base).href;

      if (importPath.endsWith('.css')) {
        // Fetch & inject CSS into DOM
        try {
          const cssRes = await fetch(resolvedUrl);
          if (cssRes.ok) {
            const cssText = await cssRes.text();
            $adu.css([cssText]);
          }
        } catch (_) {}
        code = code.replace(fullImport, \`// Injected CSS: \${importPath}\`);
      } else if (importPath.endsWith('.ads') || !importPath.includes('.')) {
        // Fetch, compile, and link .ads dependency across subfolders
        const targetUrl = importPath.endsWith('.ads') ? resolvedUrl : resolvedUrl + '.ads';
        let depBlobUrl = moduleCache.get(targetUrl);
        if (!depBlobUrl) {
          const depRes = await fetch(targetUrl);
          if (!depRes.ok) throw new Error(\`Failed to load AduScript dependency: \${importPath} from \${base}\`);
          const depSource = await depRes.text();
          depBlobUrl = await resolveAndCompileModule(depSource, targetUrl);
          moduleCache.set(targetUrl, depBlobUrl);
        }
        code = code.replace(fullImport, \`import \${clause}"\${depBlobUrl}";\`);
      }
    }

    const blob = new Blob([code], { type: 'application/javascript' });
    return URL.createObjectURL(blob);
  }

  async function run(source, options = {}) {
    const base = options.baseUrl || (options.sourceFileName && typeof location !== 'undefined' ? new URL(options.sourceFileName, location.href).href : (typeof location !== 'undefined' ? location.href : ''));
    global.$adu = $adu;
    const blobUrl = await resolveAndCompileModule(source, base);
    return await import(blobUrl);
  }

  async function runFile(url) {
    const absUrl = typeof location !== 'undefined' ? new URL(url, location.href).href : url;
    const res = await fetch(absUrl);
    if (!res.ok) throw new Error(\`Failed to load AduScript file: \${url} (HTTP \${res.status})\`);
    const source = await res.text();
    return run(source, { sourceFileName: absUrl, baseUrl: absUrl });
  }

  // --- AUTOMATIC SCRIPT SCANNER ---
  async function scanAndRunScripts() {
    if (typeof document === 'undefined') return;
    const scripts = document.querySelectorAll('script[type="text/aduscript"]');
    for (const script of scripts) {
      if (script.hasAttribute('data-adu-executed')) continue;
      script.setAttribute('data-adu-executed', 'true');

      try {
        if (script.src) {
          await runFile(script.src);
        } else if (script.textContent.trim()) {
          await run(script.textContent);
        }
      } catch (err) {
        console.error('[AduScript Execution Error]', err);
        displayErrorBanner(err);
      }
    }
  }

  function displayErrorBanner(err) {
    if (typeof document === 'undefined') return;
    let banner = document.getElementById('adu-error-banner');
    if (!banner) {
      banner = document.createElement('div');
      banner.id = 'adu-error-banner';
      banner.style.cssText = 'position:fixed;bottom:20px;right:20px;max-width:500px;background:#1e1e24;color:#ff5555;padding:16px 20px;border-left:4px solid #ff5555;border-radius:8px;font-family:monospace;font-size:13px;z-index:999999;box-shadow:0 10px 30px rgba(0,0,0,0.5);line-height:1.5;white-space:pre-wrap;';
      document.body.appendChild(banner);
    }
    banner.textContent = err.message || String(err);
  }

  // Attach global
  const AduScript = {
    compile,
    tokenize,
    parse,
    run,
    runFile,
    scanAndRunScripts,
    $adu,
    Lexer,
    Parser,
    CodeGenerator,
    TokenType,
    KEYWORDS,
    version: '1.0.0'
  };

  global.AduScript = AduScript;
  global.$adu = $adu;

  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', scanAndRunScripts);
    } else {
      setTimeout(scanAndRunScripts, 0);
    }
  }

})(typeof window !== 'undefined' ? window : globalThis);
`;

fs.mkdirSync('dist', { recursive: true });
fs.writeFileSync('dist/aduscript-browser.js', bundle, 'utf-8');
console.log('✔ Successfully generated dist/aduscript-browser.js');
