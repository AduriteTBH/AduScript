/**
 * Browser Bundler Script
 * Bundles src/ into dist/aduscript-browser.js
 */

import fs from 'node:fs';
import path from 'node:path';

function sanitizeModule(code) {
  return code
    .replace(/^import\s+[\s\S]*?from\s+['"][^'"]+['"];?\s*$/gm, '')
    .replace(/^import\s+['"][^'"]+['"];?\s*$/gm, '')
    .replace(/^export\s+default\s+[^;]+;?\s*$/gm, '')
    .replace(/^export\s+/gm, '')
    .replace(/AST\./g, '');
}

const tokensCode = sanitizeModule(fs.readFileSync('src/tokens.js', 'utf-8'));
const lexerCode = sanitizeModule(fs.readFileSync('src/lexer.js', 'utf-8'));
const astCode = sanitizeModule(fs.readFileSync('src/ast.js', 'utf-8'));
const parserCode = sanitizeModule(fs.readFileSync('src/parser.js', 'utf-8'));
const runtimeCode = sanitizeModule(fs.readFileSync('src/runtime.js', 'utf-8'));
const codegenCode = sanitizeModule(fs.readFileSync('src/codegen.js', 'utf-8'));
const runnerCode = fs.readFileSync('scripts/client-runner.js', 'utf-8');

const header = `/**
 * AduScript In-Browser Compiler & Client Runtime (Standalone Bundle)
 * Deliverable D: Zero-dependency compiler and automatic <script type="text/aduscript"> runner.
 * Version: 1.0.0
 */

(function (global) {
  'use strict';

  // --- TOKENS ---
` + tokensCode + `

  // --- AST ---
` + astCode + `

  // --- RUNTIME ($adu) ---
` + runtimeCode + `

  // --- LEXER ---
` + lexerCode + `

  // --- PARSER ---
` + parserCode + `

  // --- CODE GENERATOR ---
` + codegenCode + `

  // --- IN-BROWSER RUNNER & MODULE RESOLVER ---
` + runnerCode + `

})(typeof window !== 'undefined' ? window : globalThis);
`;

fs.mkdirSync('dist', { recursive: true });
fs.writeFileSync('dist/aduscript-browser.js', header, 'utf-8');

console.log('✔ Successfully generated dist/aduscript-browser.js');
