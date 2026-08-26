/**
 * AduScript Main Compiler Entry Point
 * Exposes core compiler and runtime API for Node.js, Deno, Bun, and Browsers.
 */

import { Lexer, LexerError } from './lexer.js';
import { Parser, ParserError } from './parser.js';
import { CodeGenerator } from './codegen.js';
import { $adu } from './runtime.js';
import { TokenType, KEYWORDS } from './tokens.js';
import * as AST from './ast.js';

export const VERSION = '1.0.0';

/**
 * Tokenizes AduScript source code.
 */
export function tokenize(source, filename = '<anonymous>') {
  const lexer = new Lexer(source, filename);
  return lexer.tokenize();
}

/**
 * Parses AduScript source code into an Abstract Syntax Tree (AST).
 */
export function parse(source, filename = '<anonymous>') {
  const tokens = tokenize(source, filename);
  const parser = new Parser(tokens, source);
  return parser.parseProgram();
}

/**
 * Generates JavaScript (ES2024+) from an AduScript AST.
 */
export function generate(ast, options = {}) {
  return CodeGenerator.generate(ast, options);
}

/**
 * Compiles AduScript source code directly into JavaScript (ES2024+).
 * 
 * @param {string} source - AduScript source code (.ads)
 * @param {object} options - Compilation options
 * @param {string} [options.moduleType='esm'] - 'esm' | 'inline-runtime' | 'cjs'
 * @param {string} [options.sourceFileName='source.ads'] - Source file name for diagnostics
 * @param {boolean} [options.includeSourceMap=false] - Whether to generate source maps
 * @returns {{ code: string, ast: object, tokens: Array, map?: object }}
 */
export function compile(source, options = {}) {
  const filename = options.sourceFileName || '<anonymous>';
  const tokens = tokenize(source, filename);
  const parser = new Parser(tokens, source);
  const ast = parser.parseProgram();
  const { code, map } = generate(ast, options);

  return {
    code,
    ast,
    tokens,
    map,
    version: VERSION
  };
}

export {
  Lexer,
  LexerError,
  Parser,
  ParserError,
  CodeGenerator,
  $adu,
  TokenType,
  KEYWORDS,
  AST
};

export default {
  compile,
  tokenize,
  parse,
  generate,
  $adu,
  version: VERSION
};
