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

function fetchText(url) {
  return new Promise((resolve, reject) => {
    const bustUrl = url + (url.includes('?') ? '&' : '?') + '_adu=' + Date.now();
    if (typeof fetch === 'function') {
      fetch(bustUrl, { cache: 'no-store' })
        .then(res => {
          if (res.ok) return res.text();
          throw new Error('HTTP ' + res.status);
        })
        .then(resolve)
        .catch(fetchErr => {
          try {
            const xhr = new XMLHttpRequest();
            xhr.open('GET', bustUrl, true);
            xhr.setRequestHeader('Cache-Control', 'no-cache');
            xhr.onload = () => {
              if (xhr.status === 200 || xhr.status === 0) {
                resolve(xhr.responseText);
              } else {
                reject(fetchErr);
              }
            };
            xhr.onerror = () => reject(fetchErr);
            xhr.send();
          } catch (_) {
            reject(fetchErr);
          }
        });
    } else {
      try {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', bustUrl, true);
        xhr.setRequestHeader('Cache-Control', 'no-cache');
        xhr.onload = () => {
          if (xhr.status === 200 || xhr.status === 0) resolve(xhr.responseText);
          else reject(new Error('HTTP ' + xhr.status));
        };
        xhr.onerror = () => reject(new Error('Network Error'));
        xhr.send();
      } catch (e) {
        reject(e);
      }
    }
  });
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
        const cssText = await fetchText(resolvedUrl);
        if (cssText) {
          $adu.css([cssText]);
        }
      } catch (_) {}
      code = code.replace(fullImport, '// Injected CSS: ' + importPath);
    } else if (importPath.endsWith('.ads') || !importPath.includes('.')) {
      // Fetch, compile, and link .ads dependency across subfolders
      const targetUrl = importPath.endsWith('.ads') ? resolvedUrl : resolvedUrl + '.ads';
      let depBlobUrl = moduleCache.get(targetUrl);
      if (!depBlobUrl) {
        const depSource = await fetchText(targetUrl);
        if (!depSource) throw new Error('Failed to load AduScript dependency: ' + importPath + ' from ' + base);
        depBlobUrl = await resolveAndCompileModule(depSource, targetUrl);
        moduleCache.set(targetUrl, depBlobUrl);
      }
      code = code.replace(fullImport, 'import ' + clause + '"' + depBlobUrl + '";');
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
  const source = await fetchText(absUrl);
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
  const msg = err && (err.message || String(err));
  if (!msg) return;

  // Ignore benign browser/extension noise
  if (msg.includes('Pointer lock') || msg.includes('Receiving end does not exist') || msg.includes('ResizeObserver') || msg.includes('favicon')) {
    return;
  }

  let banner = document.getElementById('adu-error-banner');
  if (!banner) {
    banner = document.createElement('div');
    banner.id = 'adu-error-banner';
    banner.style.cssText = 'position:fixed;bottom:16px;right:16px;max-width:440px;background:#18181b;color:#fca5a5;border:1px solid #3f3f46;border-radius:6px;padding:12px 16px;font-family:system-ui,-apple-system,sans-serif;font-size:13px;z-index:999999;box-shadow:0 8px 24px rgba(0,0,0,0.6);line-height:1.5;display:flex;flex-direction:column;gap:6px;';
    document.body.appendChild(banner);
  }

  banner.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
      <span style="font-weight:600;color:#f87171;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">AduScript Notice</span>
      <span style="cursor:pointer;color:#a1a1aa;font-size:16px;line-height:1;padding:0 2px;" onclick="this.closest('#adu-error-banner').remove()">✕</span>
    </div>
    <div style="font-family:monospace;font-size:12px;color:#e4e4e7;word-break:break-word;white-space:pre-wrap;">${msg}</div>
  `;
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

if (typeof window !== 'undefined') {
  window.addEventListener('error', (e) => {
    if (e.error) displayErrorBanner(e.error);
  });
  window.addEventListener('unhandledrejection', (e) => {
    if (e.reason) displayErrorBanner(e.reason);
  });
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', scanAndRunScripts);
  } else {
    setTimeout(scanAndRunScripts, 0);
  }
}
