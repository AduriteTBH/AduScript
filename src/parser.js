/**
 * AduScript Compiler - AST Parser
 * Deliverable B: Recursive Descent & Pratt Precedence Parser for AduScript
 */

import { TokenType, Precedence } from './tokens.js';
import { Lexer } from './lexer.js';
import * as AST from './ast.js';

export class ParserError extends Error {
  constructor(message, line, column, snippet = '') {
    const header = `[AduScript Parse Error] ${message} (at line ${line}, column ${column})`;
    const formatted = snippet ? `${header}\n${snippet}` : header;
    super(formatted);
    this.name = 'ParserError';
    this.line = line;
    this.column = column;
  }
}

export class Parser {
  constructor(tokens, source = '') {
    this.tokens = tokens || [];
    this.source = source;
    this.pos = 0;
  }

  static parse(source, filename = '<anonymous>') {
    const lexer = new Lexer(source, filename);
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens, source);
    return parser.parseProgram();
  }

  currentToken() {
    return this.tokens[this.pos] || this.tokens[this.tokens.length - 1];
  }

  peekToken(offset = 1) {
    const idx = this.pos + offset;
    return idx < this.tokens.length ? this.tokens[idx] : this.tokens[this.tokens.length - 1];
  }

  isAtEnd() {
    return this.currentToken().type === TokenType.EOF;
  }

  advance() {
    if (!this.isAtEnd()) {
      this.pos++;
    }
    return this.tokens[this.pos - 1];
  }

  check(type) {
    if (this.isAtEnd()) return false;
    return this.currentToken().type === type;
  }

  match(...types) {
    for (const type of types) {
      if (this.check(type)) {
        this.advance();
        return true;
      }
    }
    return false;
  }

  consume(type, message) {
    if (this.check(type)) {
      return this.advance();
    }
    const curr = this.currentToken();
    this.error(message || `Expected token '${type}' but found '${curr.raw || curr.type}'`, curr);
  }

  error(message, token) {
    const t = token || this.currentToken();
    const line = t.line;
    const col = t.column;
    let snippet = '';
    if (this.source) {
      const lines = this.source.split('\n');
      const targetLine = lines[line - 1] || '';
      const pointer = ' '.repeat(Math.max(0, col - 1)) + '^';
      snippet = `  ${line} | ${targetLine}\n    | ${pointer}`;
    }
    throw new ParserError(message, line, col, snippet);
  }

  getLoc(token) {
    const t = token || this.currentToken();
    return { line: t.line, column: t.column };
  }

  // Optional semicolon or delimiter consumption
  consumeSemicolon() {
    while (this.match(TokenType.SEMICOLON)) {
      // consume all semicolons
    }
  }

  // --- PROGRAM PARSING ---

  parseProgram() {
    const loc = this.getLoc();
    const body = [];
    while (!this.isAtEnd()) {
      // Skip redundant semicolons
      if (this.match(TokenType.SEMICOLON)) continue;
      const stmt = this.parseStatement();
      if (stmt) {
        body.push(stmt);
      }
    }
    return new AST.ProgramNode(body, loc);
  }

  // --- STATEMENT PARSING ---

  parseStatement() {
    const curr = this.currentToken();

    // Declarations
    if (curr.type === TokenType.LET || curr.type === TokenType.MUT) {
      return this.parseVariableDeclaration();
    }
    if (curr.type === TokenType.STATE) {
      return this.parseStateDeclaration();
    }
    if (curr.type === TokenType.FN || (curr.type === TokenType.ASYNC && this.peekToken().type === TokenType.FN)) {
      return this.parseFunctionDeclaration();
    }
    if (curr.type === TokenType.USE) {
      return this.parseUseDeclaration();
    }
    if (curr.type === TokenType.IMPORT) {
      return this.parseImportDeclaration();
    }
    if (curr.type === TokenType.EXPORT) {
      return this.parseExportDeclaration();
    }

    // Control Flow
    if (curr.type === TokenType.IF) {
      return this.parseIfStatement();
    }
    if (curr.type === TokenType.MATCH) {
      // Could be match statement or match expression as statement
      return this.parseMatchStatement();
    }
    if (curr.type === TokenType.FOR) {
      return this.parseForStatement();
    }
    if (curr.type === TokenType.WHILE) {
      return this.parseWhileStatement();
    }
    if (curr.type === TokenType.RETURN) {
      return this.parseReturnStatement();
    }
    if (curr.type === TokenType.WATCH) {
      return this.parseWatchStatement();
    }
    if (curr.type === TokenType.EFFECT) {
      return this.parseEffectStatement();
    }
    if (curr.type === TokenType.TRY) {
      return this.parseTryStatement();
    }
    if (curr.type === TokenType.THROW) {
      return this.parseThrowStatement();
    }
    if (curr.type === TokenType.BREAK) {
      const loc = this.getLoc();
      this.advance();
      this.consumeSemicolon();
      return new AST.BreakStatementNode(loc);
    }
    if (curr.type === TokenType.CONTINUE) {
      const loc = this.getLoc();
      this.advance();
      this.consumeSemicolon();
      return new AST.ContinueStatementNode(loc);
    }
    if (curr.type === TokenType.LBRACE) {
      return this.parseBlockStatement();
    }

    // Default: Expression statement
    return this.parseExpressionStatement();
  }

  parseVariableDeclaration() {
    const loc = this.getLoc();
    const kind = this.advance().type === TokenType.LET ? 'let' : 'mut';
    const pattern = this.parsePattern();
    let init = null;

    if (this.match(TokenType.EQUALS)) {
      init = this.parseExpression();
    } else if (kind === 'let') {
      this.error(`Immutable declaration with 'let' must be initialized.`, this.currentToken());
    }

    this.consumeSemicolon();
    return new AST.VariableDeclarationNode(kind, pattern, init, loc);
  }

  parseStateDeclaration() {
    const loc = this.getLoc();
    this.consume(TokenType.STATE, "Expected 'state'");
    const id = this.parseIdentifier();
    this.consume(TokenType.EQUALS, "Expected '=' after state identifier");
    const init = this.parseExpression();
    this.consumeSemicolon();
    return new AST.StateDeclarationNode(id, init, loc);
  }

  parseFunctionDeclaration() {
    const loc = this.getLoc();
    let isAsync = false;
    if (this.match(TokenType.ASYNC)) {
      isAsync = true;
    }
    this.consume(TokenType.FN, "Expected 'fn'");
    const id = this.parseIdentifier();
    this.consume(TokenType.LPAREN, "Expected '(' after function name");
    const params = this.parseParameters();
    this.consume(TokenType.RPAREN, "Expected ')' after parameters");

    let body;
    let isExpressionBody = false;

    if (this.match(TokenType.THIN_ARROW)) {
      // Expression function: fn add(a, b) -> a + b
      isExpressionBody = true;
      body = this.parseExpression();
      this.consumeSemicolon();
    } else if (this.check(TokenType.LBRACE)) {
      // Block function: fn add(a, b) { return a + b; }
      body = this.parseBlockStatement();
    } else {
      this.error("Expected '->' or '{' for function body", this.currentToken());
    }

    return new AST.FunctionDeclarationNode(id, params, body, isAsync, isExpressionBody, loc);
  }

  parseParameters() {
    const params = [];
    if (!this.check(TokenType.RPAREN)) {
      do {
        if (this.match(TokenType.SPREAD)) {
          const id = this.parseIdentifier();
          params.push(new AST.SpreadElementNode(id, id.loc));
          break;
        }
        const param = this.parsePattern();
        if (this.match(TokenType.EQUALS)) {
          const defaultVal = this.parseExpression();
          params.push(new AST.AssignmentExpressionNode('=', param, defaultVal, param.loc));
        } else {
          params.push(param);
        }
      } while (this.match(TokenType.COMMA) && !this.check(TokenType.RPAREN));
    }
    return params;
  }

  parseUseDeclaration() {
    const loc = this.getLoc();
    this.consume(TokenType.USE, "Expected 'use'");
    
    let source = '';
    let isCDN = false;
    let alias = null;
    const specifiers = [];

    // Check for cdn:package or string URL
    if (this.check(TokenType.IDENTIFIER) && this.currentToken().value === 'cdn') {
      this.advance(); // consume 'cdn'
      this.consume(TokenType.COLON, "Expected ':' after 'cdn'");
      let name = this.consume(TokenType.IDENTIFIER, "Expected package name after 'cdn:'").value;
      while (this.match(TokenType.SLASH)) {
        const sub = this.consume(TokenType.IDENTIFIER, "Expected subpath after '/'");
        name += '/' + sub.value;
      }
      isCDN = true;
      source = name;
    } else if (this.check(TokenType.STRING)) {
      source = this.advance().value;
      if (source.startsWith('cdn:')) {
        isCDN = true;
        source = source.slice(4);
      }
    } else {
      this.error("Expected CDN specifier (e.g. cdn:three) or string URL in 'use' statement", this.currentToken());
    }

    // Alias: 'as THREE'
    if (this.match(TokenType.AS)) {
      alias = this.parseIdentifier().name;
    }

    // Specifiers: '{ Scene, Camera }'
    if (this.check(TokenType.LBRACE)) {
      this.consume(TokenType.LBRACE);
      while (!this.check(TokenType.RBRACE) && !this.isAtEnd()) {
        const imported = this.parseIdentifier().name;
        let local = imported;
        if (this.match(TokenType.AS)) {
          local = this.parseIdentifier().name;
        }
        specifiers.push({ imported, local });
        if (!this.match(TokenType.COMMA)) break;
      }
      this.consume(TokenType.RBRACE, "Expected '}' after use specifiers");
    }

    this.consumeSemicolon();
    return new AST.UseDeclarationNode(source, isCDN, alias, specifiers, loc);
  }

  parseImportDeclaration() {
    const loc = this.getLoc();
    this.consume(TokenType.IMPORT, "Expected 'import'");

    let defaultImport = null;
    const specifiers = [];

    // Bare import: import "./styles.css"
    if (this.check(TokenType.STRING)) {
      const source = this.advance().value;
      this.consumeSemicolon();
      return new AST.ImportDeclarationNode(source, null, [], loc);
    }

    if (this.check(TokenType.IDENTIFIER)) {
      defaultImport = this.parseIdentifier().name;
      if (this.match(TokenType.COMMA)) {
        // import React, { useState } from "react"
        if (this.check(TokenType.LBRACE)) {
          this.parseImportSpecifiers(specifiers);
        }
      }
    } else if (this.check(TokenType.LBRACE)) {
      this.parseImportSpecifiers(specifiers);
    }

    this.consume(TokenType.FROM, "Expected 'from' after import clause");
    const sourceToken = this.consume(TokenType.STRING, "Expected module path string");
    const source = sourceToken.value;

    this.consumeSemicolon();
    return new AST.ImportDeclarationNode(source, defaultImport, specifiers, loc);
  }

  parseImportSpecifiers(specifiers) {
    this.consume(TokenType.LBRACE);
    while (!this.check(TokenType.RBRACE) && !this.isAtEnd()) {
      const imported = this.parseIdentifier().name;
      let local = imported;
      if (this.match(TokenType.AS)) {
        local = this.parseIdentifier().name;
      }
      specifiers.push({ imported, local });
      if (!this.match(TokenType.COMMA)) break;
    }
    this.consume(TokenType.RBRACE, "Expected '}' after import specifiers");
  }

  parseExportDeclaration() {
    const loc = this.getLoc();
    this.consume(TokenType.EXPORT, "Expected 'export'");

    let isDefault = false;
    if (this.match(TokenType.DEFAULT)) {
      isDefault = true;
      const decl = this.parseExpression();
      this.consumeSemicolon();
      return new AST.ExportDeclarationNode(decl, true, [], loc);
    }

    if (this.check(TokenType.LET) || this.check(TokenType.MUT)) {
      const decl = this.parseVariableDeclaration();
      return new AST.ExportDeclarationNode(decl, false, [], loc);
    }

    if (this.check(TokenType.FN) || (this.check(TokenType.ASYNC) && this.peekToken().type === TokenType.FN)) {
      const decl = this.parseFunctionDeclaration();
      return new AST.ExportDeclarationNode(decl, false, [], loc);
    }

    // Named export list: export { a, b as c }
    if (this.check(TokenType.LBRACE)) {
      const specifiers = [];
      this.consume(TokenType.LBRACE);
      while (!this.check(TokenType.RBRACE) && !this.isAtEnd()) {
        const local = this.parseIdentifier().name;
        let exported = local;
        if (this.match(TokenType.AS)) {
          exported = this.parseIdentifier().name;
        }
        specifiers.push({ local, exported });
        if (!this.match(TokenType.COMMA)) break;
      }
      this.consume(TokenType.RBRACE, "Expected '}' after export specifiers");
      this.consumeSemicolon();
      return new AST.ExportDeclarationNode(null, false, specifiers, loc);
    }

    this.error("Invalid export declaration", this.currentToken());
  }

  parseIfStatement() {
    const loc = this.getLoc();
    this.consume(TokenType.IF, "Expected 'if'");

    const hasParen = this.match(TokenType.LPAREN);
    const test = this.parseExpression();
    if (hasParen) {
      this.consume(TokenType.RPAREN, "Expected ')' after if condition");
    }

    let consequent;
    if (this.check(TokenType.LBRACE)) {
      consequent = this.parseBlockStatement();
    } else {
      consequent = this.parseStatement();
    }

    let alternate = null;
    if (this.match(TokenType.ELSE)) {
      if (this.check(TokenType.IF)) {
        alternate = this.parseIfStatement();
      } else if (this.check(TokenType.LBRACE)) {
        alternate = this.parseBlockStatement();
      } else {
        alternate = this.parseStatement();
      }
    }

    return new AST.IfStatementNode(test, consequent, alternate, loc);
  }

  parseMatchStatement() {
    const loc = this.getLoc();
    this.consume(TokenType.MATCH, "Expected 'match'");
    const discriminant = this.parseExpression();
    this.consume(TokenType.WITH, "Expected 'with' after match discriminant");

    const arms = this.parseMatchArms();
    this.consumeSemicolon();
    return new AST.MatchStatementNode(discriminant, arms, loc);
  }

  parseMatchArms() {
    const arms = [];
    const hasBrace = this.match(TokenType.LBRACE);

    while (!this.isAtEnd()) {
      if (hasBrace && this.check(TokenType.RBRACE)) break;

      const loc = this.getLoc();
      const pattern = this.parsePattern();
      let guard = null;

      if (this.match(TokenType.IF)) {
        guard = this.parseExpression();
      }

      this.consume(TokenType.FAT_ARROW, "Expected '=>' in match arm");

      let body;
      if (this.check(TokenType.LBRACE)) {
        body = this.parseBlockStatement();
      } else {
        body = this.parseExpression();
      }

      arms.push(new AST.MatchArmNode(pattern, guard, body, loc));

      this.match(TokenType.COMMA);
      this.consumeSemicolon();

      if (!hasBrace && !this.check(TokenType.IDENTIFIER) && !this.check(TokenType.NUMBER) && !this.check(TokenType.STRING) && !this.check(TokenType.UNDERSCORE) && !this.check(TokenType.LBRACKET) && !this.check(TokenType.LBRACE)) {
        break;
      }
    }

    if (hasBrace) {
      this.consume(TokenType.RBRACE, "Expected '}' after match arms");
    }

    return arms;
  }

  parseForStatement() {
    const loc = this.getLoc();
    this.consume(TokenType.FOR, "Expected 'for'");

    let kind = null;
    if (this.match(TokenType.LET)) kind = 'let';
    else if (this.match(TokenType.MUT)) kind = 'mut';

    const hasParen = this.match(TokenType.LPAREN);
    const variable = this.parsePattern();
    this.consume(TokenType.IN, "Expected 'in' in for loop");
    const iterable = this.parseExpression();
    if (hasParen) {
      this.consume(TokenType.RPAREN, "Expected ')' in for loop");
    }

    const body = this.check(TokenType.LBRACE) ? this.parseBlockStatement() : this.parseStatement();
    return new AST.ForStatementNode(kind, variable, iterable, body, loc);
  }

  parseWhileStatement() {
    const loc = this.getLoc();
    this.consume(TokenType.WHILE, "Expected 'while'");

    const hasParen = this.match(TokenType.LPAREN);
    const test = this.parseExpression();
    if (hasParen) {
      this.consume(TokenType.RPAREN, "Expected ')' after while condition");
    }

    const body = this.check(TokenType.LBRACE) ? this.parseBlockStatement() : this.parseStatement();
    return new AST.WhileStatementNode(test, body, loc);
  }

  parseReturnStatement() {
    const loc = this.getLoc();
    this.consume(TokenType.RETURN, "Expected 'return'");
    let argument = null;

    if (!this.check(TokenType.SEMICOLON) && !this.check(TokenType.RBRACE) && !this.isAtEnd()) {
      argument = this.parseExpression();
    }

    this.consumeSemicolon();
    return new AST.ReturnStatementNode(argument, loc);
  }

  parseWatchStatement() {
    const loc = this.getLoc();
    this.consume(TokenType.WATCH, "Expected 'watch'");
    const target = this.parseExpression();
    this.consume(TokenType.FAT_ARROW, "Expected '=>' in watch statement");

    let handler;
    if (this.check(TokenType.LBRACE)) {
      handler = this.parseBlockStatement();
    } else {
      handler = this.parseExpression();
    }

    this.consumeSemicolon();
    return new AST.WatchStatementNode(target, handler, loc);
  }

  parseEffectStatement() {
    const loc = this.getLoc();
    this.consume(TokenType.EFFECT, "Expected 'effect'");
    const body = this.parseBlockStatement();
    this.consumeSemicolon();
    return new AST.EffectStatementNode(body, loc);
  }

  parseTryStatement() {
    const loc = this.getLoc();
    this.consume(TokenType.TRY, "Expected 'try'");
    const block = this.parseBlockStatement();

    let handlerParam = null;
    let handlerBody = null;
    let finalizer = null;

    if (this.match(TokenType.CATCH)) {
      if (this.match(TokenType.LPAREN)) {
        handlerParam = this.parsePattern();
        this.consume(TokenType.RPAREN, "Expected ')' after catch parameter");
      }
      handlerBody = this.parseBlockStatement();
    }

    if (this.match(TokenType.FINALLY)) {
      finalizer = this.parseBlockStatement();
    }

    this.consumeSemicolon();
    return new AST.TryStatementNode(block, handlerParam, handlerBody, finalizer, loc);
  }

  parseThrowStatement() {
    const loc = this.getLoc();
    this.consume(TokenType.THROW, "Expected 'throw'");
    const argument = this.parseExpression();
    this.consumeSemicolon();
    return new AST.ThrowStatementNode(argument, loc);
  }

  parseBlockStatement() {
    const loc = this.getLoc();
    this.consume(TokenType.LBRACE, "Expected '{'");
    const body = [];

    while (!this.check(TokenType.RBRACE) && !this.isAtEnd()) {
      if (this.match(TokenType.SEMICOLON)) continue;
      const stmt = this.parseStatement();
      if (stmt) body.push(stmt);
    }

    this.consume(TokenType.RBRACE, "Expected '}'");
    return new AST.BlockStatementNode(body, loc);
  }

  parseExpressionStatement() {
    const loc = this.getLoc();
    const expr = this.parseExpression();
    this.consumeSemicolon();
    return new AST.ExpressionStatementNode(expr, loc);
  }

  // --- PATTERN PARSING (for match, let, params) ---

  parsePattern() {
    const loc = this.getLoc();
    const curr = this.currentToken();

    // Wildcard _
    if (this.match(TokenType.UNDERSCORE)) {
      return new AST.ASTNode(AST.ASTNodeType.WILDCARD_PATTERN, loc);
    }

    // Literals
    if (curr.type === TokenType.NUMBER || curr.type === TokenType.STRING || curr.type === TokenType.BOOLEAN || curr.type === TokenType.NULL || curr.type === TokenType.UNDEFINED) {
      const lit = this.advance();
      // Check for range pattern 1..10
      if (this.match(TokenType.RANGE)) {
        const endLit = this.advance();
        return new AST.RangeExpressionNode(
          new AST.LiteralNode(lit.value, lit.raw, loc),
          new AST.LiteralNode(endLit.value, endLit.raw, this.getLoc(endLit)),
          loc
        );
      }
      return new AST.LiteralNode(lit.value, lit.raw, loc);
    }

    // Array pattern [a, b, ...rest]
    if (this.match(TokenType.LBRACKET)) {
      const elements = [];
      while (!this.check(TokenType.RBRACKET) && !this.isAtEnd()) {
        if (this.match(TokenType.SPREAD)) {
          const restLoc = this.getLoc();
          const restId = this.parseIdentifier();
          elements.push(new AST.SpreadElementNode(restId, restLoc));
          break;
        }
        elements.push(this.parsePattern());
        if (!this.match(TokenType.COMMA)) break;
      }
      this.consume(TokenType.RBRACKET, "Expected ']' in array pattern");
      return new AST.ArrayLiteralNode(elements, loc);
    }

    // Object pattern { a, b: c }
    if (this.match(TokenType.LBRACE)) {
      const properties = [];
      while (!this.check(TokenType.RBRACE) && !this.isAtEnd()) {
        const propLoc = this.getLoc();
        const key = this.parseIdentifier();
        let value = key;
        let shorthand = true;
        if (this.match(TokenType.COLON)) {
          value = this.parsePattern();
          shorthand = false;
        }
        properties.push(new AST.ObjectPropertyNode(key, value, shorthand, false, propLoc));
        if (!this.match(TokenType.COMMA)) break;
      }
      this.consume(TokenType.RBRACE, "Expected '}' in object pattern");
      return new AST.ObjectLiteralNode(properties, loc);
    }

    // Identifier pattern
    if (curr.type === TokenType.IDENTIFIER) {
      return this.parseIdentifier();
    }

    this.error(`Unexpected token '${curr.raw || curr.type}' in pattern`, curr);
  }

  // --- EXPRESSION PARSING (Pratt Parsing) ---

  parseExpression(precedence = Precedence.LOWEST) {
    let left = this.parsePrefix();

    while (!this.isAtEnd() && precedence < this.getCurrentPrecedence()) {
      left = this.parseInfix(left);
    }

    return left;
  }

  getCurrentPrecedence() {
    const type = this.currentToken().type;
    switch (type) {
      case TokenType.PIPELINE:
        return Precedence.PIPELINE;
      case TokenType.QUESTION:
        return Precedence.TERNARY;
      case TokenType.EQUALS:
      case TokenType.PLUS_EQUALS:
      case TokenType.MINUS_EQUALS:
      case TokenType.STAR_EQUALS:
      case TokenType.SLASH_EQUALS:
      case TokenType.PERCENT_EQUALS:
        return Precedence.ASSIGN;
      case TokenType.NULLISH_COALESCE:
        return Precedence.NULLISH;
      case TokenType.LOGICAL_OR:
        return Precedence.LOGICAL_OR;
      case TokenType.LOGICAL_AND:
        return Precedence.LOGICAL_AND;
      case TokenType.BIT_OR:
        return Precedence.BIT_OR;
      case TokenType.BIT_XOR:
        return Precedence.BIT_XOR;
      case TokenType.BIT_AND:
        return Precedence.BIT_AND;
      case TokenType.EQ_EQ:
      case TokenType.NOT_EQ:
      case TokenType.EQ_EQ_EQ:
      case TokenType.NOT_EQ_EQ:
        return Precedence.EQUALITY;
      case TokenType.LT:
      case TokenType.LTE:
      case TokenType.GT:
      case TokenType.GTE:
      case TokenType.INSTANCEOF:
      case TokenType.IN:
        return Precedence.RELATIONAL;
      case TokenType.RANGE:
        return Precedence.RANGE;
      case TokenType.PLUS:
      case TokenType.MINUS:
        return Precedence.SUM;
      case TokenType.STAR:
      case TokenType.SLASH:
      case TokenType.PERCENT:
        return Precedence.PRODUCT;
      case TokenType.STAR_STAR:
        return Precedence.EXPONENT;
      case TokenType.LPAREN:
      case TokenType.LBRACKET:
      case TokenType.DOT:
      case TokenType.OPTIONAL_CHAIN:
      case TokenType.TEMPLATE_STRING:
        return Precedence.POSTFIX;
      default:
        return Precedence.LOWEST;
    }
  }

  parsePrefix() {
    const loc = this.getLoc();
    const token = this.currentToken();

    // Match expression: match val with { ... }
    if (token.type === TokenType.MATCH) {
      this.advance();
      const discriminant = this.parseExpression();
      this.consume(TokenType.WITH, "Expected 'with' after match expression");
      const arms = this.parseMatchArms();
      return new AST.MatchExpressionNode(discriminant, arms, loc);
    }

    // Literals
    if (token.type === TokenType.NUMBER || token.type === TokenType.STRING || token.type === TokenType.BOOLEAN || token.type === TokenType.NULL || token.type === TokenType.UNDEFINED) {
      this.advance();
      return new AST.LiteralNode(token.value, token.raw, loc);
    }

    // Formatted Interpolated String: f"Hello {name}"
    if (token.type === TokenType.INTERPOLATED_STRING) {
      this.advance();
      const parts = [];
      for (const part of token.value) {
        if (part.type === 'string') {
          parts.push(part);
        } else if (part.type === 'expression') {
          // Parse the embedded expression string into an AST node
          const subParser = new Parser(new Lexer(part.value, '<interpolated>').tokenize(), part.value);
          const exprNode = subParser.parseExpression();
          parts.push({ type: 'expression', value: part.value, exprNode });
        }
      }
      return new AST.FormattedStringLiteralNode(parts, loc);
    }

    // Template Literal: `Hello ${name}`
    if (token.type === TokenType.TEMPLATE_STRING) {
      this.advance();
      const parts = [];
      for (const part of token.value) {
        if (part.type === 'string') {
          parts.push(part);
        } else if (part.type === 'expression') {
          const subParser = new Parser(new Lexer(part.value, '<template>').tokenize(), part.value);
          const exprNode = subParser.parseExpression();
          parts.push({ type: 'expression', value: part.value, exprNode });
        }
      }
      return new AST.TemplateLiteralNode(parts, loc);
    }

    // Underscore placeholder
    if (token.type === TokenType.UNDERSCORE) {
      this.advance();
      return new AST.PlaceholderExpressionNode(loc);
    }

    // Identifier or closure: x -> x * 2
    if (token.type === TokenType.IDENTIFIER) {
      const id = this.parseIdentifier();
      if (this.match(TokenType.THIN_ARROW)) {
        const isBlock = this.check(TokenType.LBRACE);
        const body = isBlock ? this.parseBlockStatement() : this.parseExpression();
        return new AST.ClosureExpressionNode([id], body, false, !isBlock, loc);
      }
      return id;
    }

    // Unary Operators: ! - + typeof await new
    if (token.type === TokenType.NOT || token.type === TokenType.MINUS || token.type === TokenType.PLUS || token.type === TokenType.BIT_NOT || token.type === TokenType.TYPEOF) {
      const op = this.advance().raw;
      const argument = this.parseExpression(Precedence.PREFIX);
      return new AST.UnaryExpressionNode(op, argument, true, loc);
    }

    if (token.type === TokenType.AWAIT) {
      this.advance();
      const argument = this.parseExpression(Precedence.PREFIX);
      return new AST.AwaitExpressionNode(argument, loc);
    }

    if (token.type === TokenType.NEW) {
      this.advance();
      const callee = this.parseExpression(Precedence.POSTFIX);
      let args = [];
      if (this.match(TokenType.LPAREN)) {
        args = this.parseArguments();
        this.consume(TokenType.RPAREN, "Expected ')' after new arguments");
      }
      return new AST.NewExpressionNode(callee, args, loc);
    }

    // Parenthesized expression or arrow function: (a, b) -> a + b
    if (token.type === TokenType.LPAREN) {
      this.advance();
      if (this.check(TokenType.RPAREN)) {
        this.advance(); // empty params ()
        if (this.match(TokenType.THIN_ARROW) || this.match(TokenType.FAT_ARROW)) {
          const isBlock = this.check(TokenType.LBRACE);
          const body = isBlock ? this.parseBlockStatement() : this.parseExpression();
          return new AST.ClosureExpressionNode([], body, false, !isBlock, loc);
        }
        return new AST.ArrayLiteralNode([], loc); // fallback
      }

      // Lookahead for parameters vs expression
      const exprs = [];
      do {
        if (this.match(TokenType.SPREAD)) {
          const spreadId = this.parseIdentifier();
          exprs.push(new AST.SpreadElementNode(spreadId, spreadId.loc));
          break;
        }
        exprs.push(this.parseExpression());
      } while (this.match(TokenType.COMMA) && !this.check(TokenType.RPAREN));

      this.consume(TokenType.RPAREN, "Expected ')'");

      // Check if closure arrow follows: (a, b) -> a + b or (a, b) => { ... }
      if (this.match(TokenType.THIN_ARROW) || this.match(TokenType.FAT_ARROW)) {
        const isBlock = this.check(TokenType.LBRACE);
        const body = isBlock ? this.parseBlockStatement() : this.parseExpression();
        return new AST.ClosureExpressionNode(exprs, body, false, !isBlock, loc);
      }

      // Regular single parenthesized expression
      if (exprs.length === 1 && !(exprs[0] instanceof AST.SpreadElementNode)) {
        return exprs[0];
      }

      // Multiple expressions in parens -> sequence or tuple
      return exprs[exprs.length - 1];
    }

    // Async closure: async (x) -> ... or async fn ...
    if (token.type === TokenType.ASYNC) {
      this.advance();
      if (this.match(TokenType.LPAREN)) {
        const params = [];
        if (!this.check(TokenType.RPAREN)) {
          do {
            params.push(this.parsePattern());
          } while (this.match(TokenType.COMMA) && !this.check(TokenType.RPAREN));
        }
        this.consume(TokenType.RPAREN, "Expected ')'");
        if (this.match(TokenType.THIN_ARROW) || this.match(TokenType.FAT_ARROW)) {
          const isBlock = this.check(TokenType.LBRACE);
          const body = isBlock ? this.parseBlockStatement() : this.parseExpression();
          return new AST.ClosureExpressionNode(params, body, true, !isBlock, loc);
        }
      }
    }

    // Array literal: [1, 2, 3]
    if (token.type === TokenType.LBRACKET) {
      this.advance();
      const elements = [];
      while (!this.check(TokenType.RBRACKET) && !this.isAtEnd()) {
        if (this.match(TokenType.SPREAD)) {
          const arg = this.parseExpression();
          elements.push(new AST.SpreadElementNode(arg, loc));
        } else {
          elements.push(this.parseExpression());
        }
        if (!this.match(TokenType.COMMA)) break;
      }
      this.consume(TokenType.RBRACKET, "Expected ']'");
      return new AST.ArrayLiteralNode(elements, loc);
    }

    // Object literal: { key: value, shorthand }
    if (token.type === TokenType.LBRACE) {
      this.advance();
      const properties = [];
      while (!this.check(TokenType.RBRACE) && !this.isAtEnd()) {
        const propLoc = this.getLoc();
        if (this.match(TokenType.SPREAD)) {
          const arg = this.parseExpression();
          properties.push(new AST.SpreadElementNode(arg, propLoc));
        } else {
          let computed = false;
          let key;
          if (this.match(TokenType.LBRACKET)) {
            key = this.parseExpression();
            this.consume(TokenType.RBRACKET, "Expected ']'");
            computed = true;
          } else if (this.check(TokenType.IDENTIFIER)) {
            key = this.parseIdentifier();
          } else if (this.check(TokenType.STRING) || this.check(TokenType.NUMBER)) {
            const lit = this.advance();
            key = new AST.LiteralNode(lit.value, lit.raw, propLoc);
          } else {
            this.error("Expected property name in object literal", this.currentToken());
          }

          let value = key;
          let shorthand = false;
          if (this.match(TokenType.COLON)) {
            value = this.parseExpression();
          } else if (key instanceof AST.IdentifierNode && !computed) {
            shorthand = true;
          } else {
            this.error("Expected ':' after object key", this.currentToken());
          }

          properties.push(new AST.ObjectPropertyNode(key, value, shorthand, computed, propLoc));
        }
        if (!this.match(TokenType.COMMA)) break;
      }
      this.consume(TokenType.RBRACE, "Expected '}'");
      return new AST.ObjectLiteralNode(properties, loc);
    }

    // Method pipeline shorthand on start of expression (e.g. .trim())
    if (token.type === TokenType.DOT) {
      this.advance();
      const methodId = this.parseIdentifier();
      let args = [];
      if (this.match(TokenType.LPAREN)) {
        args = this.parseArguments();
        this.consume(TokenType.RPAREN, "Expected ')'");
      }
      return new AST.CallExpressionNode(
        new AST.MemberExpressionNode(new AST.PlaceholderExpressionNode(loc), methodId, false, false, loc),
        args,
        false,
        loc
      );
    }

    this.error(`Unexpected token '${token.raw || token.type}'`, token);
  }

  parseInfix(left) {
    const loc = this.getLoc();
    const token = this.currentToken();

    // Pipeline operator: |>
    if (token.type === TokenType.PIPELINE) {
      this.advance();
      // Parse right-hand target of pipeline
      let right;
      if (this.check(TokenType.DOT)) {
        // Method shorthand: data |> .trim()
        this.advance();
        const methodId = this.parseIdentifier();
        let args = [];
        if (this.match(TokenType.LPAREN)) {
          args = this.parseArguments();
          this.consume(TokenType.RPAREN, "Expected ')'");
        }
        right = new AST.CallExpressionNode(
          new AST.MemberExpressionNode(new AST.PlaceholderExpressionNode(loc), methodId, false, false, loc),
          args,
          false,
          loc
        );
      } else {
        right = this.parseExpression(Precedence.PIPELINE);
      }
      return new AST.PipelineExpressionNode(left, right, loc);
    }

    // Assignment operators: = += -= *= /= %=
    if (token.type === TokenType.EQUALS || token.type === TokenType.PLUS_EQUALS || token.type === TokenType.MINUS_EQUALS || token.type === TokenType.STAR_EQUALS || token.type === TokenType.SLASH_EQUALS || token.type === TokenType.PERCENT_EQUALS) {
      const op = this.advance().raw;
      const right = this.parseExpression(Precedence.ASSIGN - 1);
      return new AST.AssignmentExpressionNode(op, left, right, loc);
    }

    // Ternary conditional expression: cond ? consequent : alternate
    if (token.type === TokenType.QUESTION) {
      this.advance();
      const consequent = this.parseExpression();
      this.consume(TokenType.COLON, "Expected ':' in ternary conditional expression");
      const alternate = this.parseExpression(Precedence.ASSIGN - 1);
      return new AST.ConditionalExpressionNode(left, consequent, alternate, loc);
    }

    // Range operator: ..
    if (token.type === TokenType.RANGE) {
      this.advance();
      const right = this.parseExpression(Precedence.RANGE);
      return new AST.RangeExpressionNode(left, right, loc);
    }

    // Binary Operators
    if (this.isBinaryOperator(token.type)) {
      const op = this.advance().raw;
      const prec = this.getPrecedenceFor(token.type);
      const right = this.parseExpression(prec);
      return new AST.BinaryExpressionNode(op, left, right, loc);
    }

    // Member Access: left.prop or left?.prop
    if (token.type === TokenType.DOT || token.type === TokenType.OPTIONAL_CHAIN) {
      const isOptional = token.type === TokenType.OPTIONAL_CHAIN;
      this.advance();
      const prop = this.parseIdentifier();
      return new AST.MemberExpressionNode(left, prop, false, isOptional, loc);
    }

    // Computed Member: left[prop]
    if (token.type === TokenType.LBRACKET) {
      this.advance();
      const prop = this.parseExpression();
      this.consume(TokenType.RBRACKET, "Expected ']'");
      return new AST.MemberExpressionNode(left, prop, true, false, loc);
    }

    // Call Access: left(arg1, arg2)
    if (token.type === TokenType.LPAREN) {
      this.advance();
      const args = this.parseArguments();
      this.consume(TokenType.RPAREN, "Expected ')'");
      return new AST.CallExpressionNode(left, args, false, loc);
    }

    // Tagged Template Expression: tag`...`
    if (token.type === TokenType.TEMPLATE_STRING) {
      const quasi = this.parsePrefix();
      return new AST.TaggedTemplateExpressionNode(left, quasi, loc);
    }

    return left;
  }

  isBinaryOperator(type) {
    return [
      TokenType.PLUS, TokenType.MINUS, TokenType.STAR, TokenType.SLASH, TokenType.PERCENT, TokenType.STAR_STAR,
      TokenType.EQ_EQ, TokenType.NOT_EQ, TokenType.EQ_EQ_EQ, TokenType.NOT_EQ_EQ,
      TokenType.LT, TokenType.LTE, TokenType.GT, TokenType.GTE,
      TokenType.LOGICAL_AND, TokenType.LOGICAL_OR, TokenType.NULLISH_COALESCE,
      TokenType.BIT_AND, TokenType.BIT_OR, TokenType.BIT_XOR,
      TokenType.INSTANCEOF, TokenType.IN
    ].includes(type);
  }

  getPrecedenceFor(type) {
    switch (type) {
      case TokenType.NULLISH_COALESCE: return Precedence.NULLISH;
      case TokenType.LOGICAL_OR: return Precedence.LOGICAL_OR;
      case TokenType.LOGICAL_AND: return Precedence.LOGICAL_AND;
      case TokenType.BIT_OR: return Precedence.BIT_OR;
      case TokenType.BIT_XOR: return Precedence.BIT_XOR;
      case TokenType.BIT_AND: return Precedence.BIT_AND;
      case TokenType.EQ_EQ:
      case TokenType.NOT_EQ:
      case TokenType.EQ_EQ_EQ:
      case TokenType.NOT_EQ_EQ: return Precedence.EQUALITY;
      case TokenType.LT:
      case TokenType.LTE:
      case TokenType.GT:
      case TokenType.GTE:
      case TokenType.INSTANCEOF:
      case TokenType.IN: return Precedence.RELATIONAL;
      case TokenType.PLUS:
      case TokenType.MINUS: return Precedence.SUM;
      case TokenType.STAR:
      case TokenType.SLASH:
      case TokenType.PERCENT: return Precedence.PRODUCT;
      case TokenType.STAR_STAR: return Precedence.EXPONENT - 1; // right-associative
      default: return Precedence.LOWEST;
    }
  }

  parseArguments() {
    const args = [];
    if (!this.check(TokenType.RPAREN)) {
      do {
        if (this.match(TokenType.SPREAD)) {
          const arg = this.parseExpression();
          args.push(new AST.SpreadElementNode(arg, arg.loc));
        } else {
          args.push(this.parseExpression());
        }
      } while (this.match(TokenType.COMMA) && !this.check(TokenType.RPAREN));
    }
    return args;
  }

  parseIdentifier() {
    const loc = this.getLoc();
    const token = this.consume(TokenType.IDENTIFIER, "Expected identifier");
    return new AST.IdentifierNode(token.value, loc);
  }
}
