#!/usr/bin/env node

/**
 * AduScript CLI Compiler & Runner
 * Usage:
 *   aduscript <input.ads> [-o <output.js>] [--run] [--ast] [--tokens]
 */

import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { compile, tokenize, parse, VERSION, $adu } from '../src/index.js';

const args = process.argv.slice(2);

function showHelp() {
  console.log(`
\x1b[36m=======================================================
   AduScript CLI Toolchain v${VERSION}
=======================================================\x1b[0m

\x1b[1mUSAGE:\x1b[0m
  aduscript <input.ads> [options]

\x1b[1mOPTIONS:\x1b[0m
  -o, --output <file>    Specify output JavaScript file path
  -r, --run              Compile and immediately execute the script
  --ast                  Print the Abstract Syntax Tree (AST) as JSON
  --tokens               Print the tokenized stream
  -v, --version          Show version
  -h, --help             Show this help screen

\x1b[1mEXAMPLES:\x1b[0m
  $ aduscript app.ads -o app.js
  $ aduscript scene.ads --run
  $ aduscript script.ads --ast
`);
}

async function main() {
  if (args.length === 0 || args.includes('-h') || args.includes('--help')) {
    showHelp();
    process.exit(0);
  }

  if (args.includes('-v') || args.includes('--version')) {
    console.log(`AduScript v${VERSION}`);
    process.exit(0);
  }

  // Command: ads dev / ads serve [dir] [-p <port>]
  if (args[0] === 'dev' || args[0] === 'serve') {
    const targetDir = path.resolve(process.cwd(), args[1] && !args[1].startsWith('-') ? args[1] : '.');
    const portIndex = args.indexOf('-p') !== -1 ? args.indexOf('-p') : args.indexOf('--port');
    const port = portIndex !== -1 ? parseInt(args[portIndex + 1], 10) : 3000;
    await startDevServer(targetDir, port);
    return;
  }

  // Command: ads init <projectName>
  if (args[0] === 'init') {
    const projName = args[1] || 'my-aduscript-app';
    const projDir = path.resolve(process.cwd(), projName);
    initProject(projDir, projName);
    return;
  }

  let inputFile = null;
  let outputFile = null;
  let shouldRun = false;
  let showAst = false;
  let showTokens = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '-o' || arg === '--output') {
      outputFile = args[++i];
    } else if (arg === '-r' || arg === '--run') {
      shouldRun = true;
    } else if (arg === '--ast') {
      showAst = true;
    } else if (arg === '--tokens') {
      showTokens = true;
    } else if (!arg.startsWith('-') && !inputFile) {
      inputFile = arg;
    }
  }

  if (!inputFile) {
    console.error('\x1b[31mError: No input file or directory specified.\x1b[0m');
    showHelp();
    process.exit(1);
  }

  const resolvedInput = path.resolve(process.cwd(), inputFile);
  if (!fs.existsSync(resolvedInput)) {
    console.error(`\x1b[31mError: Input path not found: ${resolvedInput}\x1b[0m`);
    process.exit(1);
  }

  const isDirectory = fs.statSync(resolvedInput).isDirectory();

  if (isDirectory) {
    if (!outputFile) {
      console.error('\x1b[31mError: Output directory (-o) must be specified when compiling a directory.\x1b[0m');
      process.exit(1);
    }
    const resolvedOutDir = path.resolve(process.cwd(), outputFile);
    compileDirectory(resolvedInput, resolvedOutDir);
    console.log(`\x1b[32m✔ Project compiled successfully into ${outputFile}\x1b[0m`);
    return;
  }

  const source = fs.readFileSync(resolvedInput, 'utf-8');

  try {
    if (showTokens) {
      const tokens = tokenize(source, inputFile);
      console.log(JSON.stringify(tokens, null, 2));
      return;
    }

    if (showAst) {
      const ast = parse(source, inputFile);
      console.log(JSON.stringify(ast, null, 2));
      return;
    }

    const { code } = compile(source, {
      sourceFileName: path.basename(inputFile),
      moduleType: shouldRun ? 'inline-runtime' : 'esm',
      rewriteAdsImports: true
    });

    if (outputFile) {
      const resolvedOutput = path.resolve(process.cwd(), outputFile);
      fs.mkdirSync(path.dirname(resolvedOutput), { recursive: true });
      fs.writeFileSync(resolvedOutput, code, 'utf-8');
      console.log(`\x1b[32m✔ Successfully compiled ${inputFile} -> ${outputFile}\x1b[0m`);
    } else if (!shouldRun) {
      console.log(code);
    }

    if (shouldRun) {
      const tmpDir = path.resolve(process.cwd(), '.adu_cache');
      fs.mkdirSync(tmpDir, { recursive: true });
      const tmpFile = path.join(tmpDir, `exec_${Date.now()}.js`);
      globalThis.$adu = $adu;
      fs.writeFileSync(tmpFile, code, 'utf-8');
      try {
        await import(pathToFileURL(tmpFile).href);
      } finally {
        try { fs.unlinkSync(tmpFile); } catch (_) {}
      }
    }
  } catch (err) {
    console.error('\x1b[31m' + err.message + '\x1b[0m');
    process.exit(1);
  }
}

function compileDirectory(srcDir, outDir) {
  fs.mkdirSync(outDir, { recursive: true });
  const entries = fs.readdirSync(srcDir, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(outDir, entry.name);

    if (entry.isDirectory()) {
      compileDirectory(srcPath, destPath);
    } else if (entry.isFile()) {
      if (entry.name.endsWith('.ads')) {
        const outJsPath = destPath.replace(/\.ads$/, '.js');
        const srcContent = fs.readFileSync(srcPath, 'utf-8');
        const { code } = compile(srcContent, {
          sourceFileName: entry.name,
          moduleType: 'esm',
          rewriteAdsImports: true
        });
        fs.writeFileSync(outJsPath, code, 'utf-8');
        console.log(`  \x1b[32m•\x1b[0m ${path.relative(process.cwd(), srcPath)} -> ${path.relative(process.cwd(), outJsPath)}`);
      } else if (entry.name.endsWith('.html')) {
        // Automatically transpile HTML: convert <script src="*.ads"> to <script type="module" src="*.js">
        let htmlContent = fs.readFileSync(srcPath, 'utf-8');
        // Remove standalone in-browser runner script if present
        htmlContent = htmlContent.replace(/<script[^>]*src=["'][^"']*aduscript-browser\.js["'][^>]*><\/script>\s*/gi, '');
        // Replace .ads script tags with standard type="module" .js script tags
        htmlContent = htmlContent.replace(/(<script\b[^>]*)\bsrc=["']([^"']+\.ads)["']([^>]*>)/gi, (match, before, src, after) => {
          const newSrc = src.replace(/\.ads$/, '.js');
          let tag = before;
          if (!tag.includes('type=')) tag += ' type="module"';
          else tag = tag.replace(/type=["']text\/aduscript["']/gi, 'type="module"');
          return `${tag} src="${newSrc}"${after}`;
        });
        // Replace inline <script type="text/aduscript"> with compiled code
        htmlContent = htmlContent.replace(/<script\b[^>]*type=["']text\/aduscript["'][^>]*>([\s\S]*?)<\/script>/gi, (match, inlineCode) => {
          if (inlineCode.trim()) {
            const { code } = compile(inlineCode, { moduleType: 'inline-runtime' });
            return `<script type="module">\n${code}\n</script>`;
          }
          return match;
        });
        fs.writeFileSync(destPath, htmlContent, 'utf-8');
        console.log(`  \x1b[35m•\x1b[0m ${path.relative(process.cwd(), srcPath)} (standard HTML compiled)`);
      } else {
        // Copy assets (.css, .png, .svg, .json, etc.)
        fs.copyFileSync(srcPath, destPath);
        console.log(`  \x1b[36m•\x1b[0m Copied ${path.relative(process.cwd(), srcPath)} -> ${path.relative(process.cwd(), destPath)}`);
      }
    }
  }
}

async function startDevServer(targetDir, port = 3000) {
  const http = await import('node:http');
  const mimeTypes = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.ads': 'application/javascript',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.json': 'application/json'
  };

  const server = http.createServer((req, res) => {
    let reqPath = req.url.split('?')[0];
    if (reqPath === '/') reqPath = '/index.html';
    const filePath = path.join(targetDir, reqPath);

    if (!fs.existsSync(filePath)) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end(`404 Not Found: ${reqPath}`);
      return;
    }

    if (reqPath.endsWith('.ads')) {
      const source = fs.readFileSync(filePath, 'utf-8');
      try {
        const { code } = compile(source, {
          sourceFileName: path.basename(filePath),
          moduleType: 'inline-runtime'
        });
        res.writeHead(200, {
          'Content-Type': 'application/javascript',
          'Access-Control-Allow-Origin': '*'
        });
        res.end(code);
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end(`[AduScript Compilation Error] ${err.message}`);
      }
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const mime = mimeTypes[ext] || 'application/octet-stream';
    const content = fs.readFileSync(filePath);
    res.writeHead(200, { 'Content-Type': mime });
    res.end(content);
  });

  server.listen(port, () => {
    console.log(`\n\x1b[32m🚀 AduScript Dev Server running at http://localhost:${port}/\x1b[0m`);
    console.log(`\x1b[36m⚡ Native .ads compilation enabled on the fly with zero runners needed!\x1b[0m\n`);
  });
}

function initProject(destDir, name) {
  fs.mkdirSync(destDir, { recursive: true });
  fs.writeFileSync(path.join(destDir, 'index.html'), `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${name}</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div id="app"></div>
  <script type="module" src="app.ads"></script>
</body>
</html>
`, 'utf-8');

  fs.writeFileSync(path.join(destDir, 'app.ads'), `// ${name} - Built with AduScript
import "./style.css"

state count = 0

fn render() {
  return $adu.html\`
    <div class="card">
      \${$adu.logo(48)}
      <h1>Welcome to ${name}</h1>
      <p>A native AduScript application</p>
      <button onclick=\${() -> count.value += 1}>Clicks: \${count.value}</button>
    </div>
  \`
}

$adu.mount("#app", render)
`, 'utf-8');

  fs.writeFileSync(path.join(destDir, 'style.css'), `body {
  margin: 0;
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #0f111a;
  color: #fff;
  font-family: system-ui, sans-serif;
}
.card {
  background: #1a1d2d;
  padding: 36px;
  border-radius: 20px;
  text-align: center;
  box-shadow: 0 20px 50px rgba(0,0,0,0.5);
}
button {
  background: #C0004D;
  color: #fff;
  border: none;
  padding: 12px 24px;
  border-radius: 10px;
  font-weight: bold;
  cursor: pointer;
}
`, 'utf-8');

  console.log(`\x1b[32m✔ Successfully created AduScript project in ${destDir}\x1b[0m`);
  console.log(`  To develop: aduscript dev ${destDir}`);
  console.log(`  To build:   aduscript ${destDir} -o dist/`);
}

main();
