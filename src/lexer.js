/**
 * AduScript Compiler - Lexical Analyzer / Tokenizer
 * Deliverable A: Scans .ads source code and produces an array of Token instances.
 */

import { TokenType, KEYWORDS, Token } from './tokens.js';

export class LexerError extends Error {
  constructor(message, line, column, snippet = '') {
    const header = `[AduScript Syntax Error] ${message} (at line ${line}, column ${column})`;
    const formatted = snippet ? `${header}\n${snippet}` : header;
    super(formatted);
    this.name = 'LexerError';
    this.line = line;
    this.column = column;
  }
}

export class Lexer {
  constructor(source, filename = '<anonymous>') {
    this.source = source || '';
    this.filename = filename;
    this.length = this.source.length;
    this.pos = 0;
    this.line = 1;
    this.column = 1;
    this.tokens = [];
  }

  tokenize() {
    this.tokens = [];
    this.pos = 0;
    this.line = 1;
    this.column = 1;

    while (!this.isAtEnd()) {
      this.scanToken();
    }

    this.tokens.push(new Token(TokenType.EOF, '', this.line, this.column, ''));
    return this.tokens;
  }

  isAtEnd() {
    return this.pos >= this.length;
  }

  peek(offset = 0) {
    const idx = this.pos + offset;
    return idx < this.length ? this.source[idx] : '\0';
  }

  advance() {
    if (this.isAtEnd()) return '\0';
    const ch = this.source[this.pos++];
    if (ch === '\n') {
      this.line++;
      this.column = 1;
    } else {
      this.column++;
    }
    return ch;
  }

  match(expected) {
    if (this.isAtEnd()) return false;
    if (this.source[this.pos] !== expected) return false;
    this.advance();
    return true;
  }

  scanToken() {
    const startLine = this.line;
    const startCol = this.column;
    const ch = this.advance();

    // Whitespace handling
    if (ch === ' ' || ch === '\r' || ch === '\t' || ch === '\n') {
      return;
    }

    // Single-character and multi-character operators
    switch (ch) {
      case '(':
        this.addToken(TokenType.LPAREN, '(', startLine, startCol);
        return;
      case ')':
        this.addToken(TokenType.RPAREN, ')', startLine, startCol);
        return;
      case '{':
        this.addToken(TokenType.LBRACE, '{', startLine, startCol);
        return;
      case '}':
        this.addToken(TokenType.RBRACE, '}', startLine, startCol);
        return;
      case '[':
        this.addToken(TokenType.LBRACKET, '[', startLine, startCol);
        return;
      case ']':
        this.addToken(TokenType.RBRACKET, ']', startLine, startCol);
        return;
      case ',':
        this.addToken(TokenType.COMMA, ',', startLine, startCol);
        return;
      case ':':
        this.addToken(TokenType.COLON, ':', startLine, startCol);
        return;
      case ';':
        this.addToken(TokenType.SEMICOLON, ';', startLine, startCol);
        return;
      case '~':
        this.addToken(TokenType.BIT_NOT, '~', startLine, startCol);
        return;
      case '^':
        this.addToken(TokenType.BIT_XOR, '^', startLine, startCol);
        return;

      case '.':
        if (this.peek() === '.' && this.peek(1) === '.') {
          this.advance();
          this.advance();
          this.addToken(TokenType.SPREAD, '...', startLine, startCol);
        } else if (this.peek() === '.') {
          this.advance();
          this.addToken(TokenType.RANGE, '..', startLine, startCol);
        } else {
          this.addToken(TokenType.DOT, '.', startLine, startCol);
        }
        return;

      case '+':
        if (this.match('=')) {
          this.addToken(TokenType.PLUS_EQUALS, '+=', startLine, startCol);
        } else {
          this.addToken(TokenType.PLUS, '+', startLine, startCol);
        }
        return;

      case '-':
        if (this.match('>')) {
          this.addToken(TokenType.THIN_ARROW, '->', startLine, startCol);
        } else if (this.match('=')) {
          this.addToken(TokenType.MINUS_EQUALS, '-=', startLine, startCol);
        } else {
          this.addToken(TokenType.MINUS, '-', startLine, startCol);
        }
        return;

      case '*':
        if (this.match('*')) {
          this.addToken(TokenType.STAR_STAR, '**', startLine, startCol);
        } else if (this.match('=')) {
          this.addToken(TokenType.STAR_EQUALS, '*=', startLine, startCol);
        } else {
          this.addToken(TokenType.STAR, '*', startLine, startCol);
        }
        return;

      case '%':
        if (this.match('=')) {
          this.addToken(TokenType.PERCENT_EQUALS, '%=', startLine, startCol);
        } else {
          this.addToken(TokenType.PERCENT, '%', startLine, startCol);
        }
        return;

      case '|':
        if (this.match('>')) {
          this.addToken(TokenType.PIPELINE, '|>', startLine, startCol);
        } else if (this.match('|')) {
          this.addToken(TokenType.LOGICAL_OR, '||', startLine, startCol);
        } else {
          this.addToken(TokenType.BIT_OR, '|', startLine, startCol);
        }
        return;

      case '&':
        if (this.match('&')) {
          this.addToken(TokenType.LOGICAL_AND, '&&', startLine, startCol);
        } else {
          this.addToken(TokenType.BIT_AND, '&', startLine, startCol);
        }
        return;

      case '=':
        if (this.match('=')) {
          if (this.match('=')) {
            this.addToken(TokenType.EQ_EQ_EQ, '===', startLine, startCol);
          } else {
            this.addToken(TokenType.EQ_EQ, '==', startLine, startCol);
          }
        } else if (this.match('>')) {
          this.addToken(TokenType.FAT_ARROW, '=>', startLine, startCol);
        } else {
          this.addToken(TokenType.EQUALS, '=', startLine, startCol);
        }
        return;

      case '!':
        if (this.match('=')) {
          if (this.match('=')) {
            this.addToken(TokenType.NOT_EQ_EQ, '!==', startLine, startCol);
          } else {
            this.addToken(TokenType.NOT_EQ, '!=', startLine, startCol);
          }
        } else {
          this.addToken(TokenType.NOT, '!', startLine, startCol);
        }
        return;

      case '<':
        if (this.match('=')) {
          this.addToken(TokenType.LTE, '<=', startLine, startCol);
        } else {
          this.addToken(TokenType.LT, '<', startLine, startCol);
        }
        return;

      case '>':
        if (this.match('=')) {
          this.addToken(TokenType.GTE, '>=', startLine, startCol);
        } else {
          this.addToken(TokenType.GT, '>', startLine, startCol);
        }
        return;

      case '?':
        if (this.match('.')) {
          this.addToken(TokenType.OPTIONAL_CHAIN, '?.', startLine, startCol);
        } else if (this.match('?')) {
          this.addToken(TokenType.NULLISH_COALESCE, '??', startLine, startCol);
        } else {
          this.addToken(TokenType.QUESTION, '?', startLine, startCol);
        }
        return;

      case '/':
        // Comments or division
        if (this.peek() === '/') {
          this.advance();
          if (this.peek() === '/') {
            // Doc comment ///
            this.advance();
            this.scanLineComment(true, startLine, startCol);
          } else {
            this.scanLineComment(false, startLine, startCol);
          }
        } else if (this.match('*')) {
          this.scanBlockComment(startLine, startCol);
        } else if (this.match('=')) {
          this.addToken(TokenType.SLASH_EQUALS, '/=', startLine, startCol);
        } else {
          this.addToken(TokenType.SLASH, '/', startLine, startCol);
        }
        return;

      case '"':
      case "'":
        this.scanString(ch, startLine, startCol);
        return;

      case '`':
        this.scanTemplateString(startLine, startCol);
        return;

      default:
        // Formatted string: f"..." or f'...'
        if (ch === 'f' && (this.peek() === '"' || this.peek() === "'")) {
          const quote = this.advance();
          this.scanInterpolatedString(quote, startLine, startCol);
          return;
        }

        // Numbers
        if (this.isDigit(ch)) {
          this.scanNumber(ch, startLine, startCol);
          return;
        }

        // Identifiers & Keywords
        if (this.isAlphaOrUnderscore(ch)) {
          this.scanIdentifier(ch, startLine, startCol);
          return;
        }

        this.error(`Unexpected character '${ch}'`, startLine, startCol);
    }
  }

  scanLineComment(isDoc, startLine, startCol) {
    let comment = '';
    while (!this.isAtEnd() && this.peek() !== '\n') {
      comment += this.advance();
    }
    // We optionally retain doc comments or ignore standard comments
    if (isDoc) {
      this.addToken(TokenType.DOC_COMMENT, comment.trim(), startLine, startCol);
    }
  }

  scanBlockComment(startLine, startCol) {
    let comment = '';
    while (!this.isAtEnd()) {
      if (this.peek() === '*' && this.peek(1) === '/') {
        this.advance();
        this.advance();
        return;
      }
      comment += this.advance();
    }
    this.error(`Unterminated block comment`, startLine, startCol);
  }

  scanString(quote, startLine, startCol) {
    let val = '';
    while (!this.isAtEnd() && this.peek() !== quote) {
      if (this.peek() === '\n') {
        this.error(`Unterminated string literal`, startLine, startCol);
      }
      if (this.peek() === '\\') {
        this.advance();
        const esc = this.advance();
        val += this.getEscapeChar(esc);
      } else {
        val += this.advance();
      }
    }

    if (this.isAtEnd()) {
      this.error(`Unterminated string literal`, startLine, startCol);
    }

    this.advance(); // consume closing quote
    this.addToken(TokenType.STRING, val, startLine, startCol, `${quote}${val}${quote}`);
  }

  scanTemplateString(startLine, startCol) {
    const parts = [];
    let currentStr = '';

    while (!this.isAtEnd() && this.peek() !== '`') {
      if (this.peek() === '\\') {
        this.advance();
        const esc = this.advance();
        if (esc === '$' || esc === '`') {
          currentStr += esc;
        } else {
          currentStr += this.getEscapeChar(esc);
        }
      } else if (this.peek() === '$' && this.peek(1) === '{') {
        if (currentStr.length > 0) {
          parts.push({ type: 'string', value: currentStr });
          currentStr = '';
        }
        this.advance(); // consume '$'
        this.advance(); // consume '{'
        
        let exprCode = '';
        let depth = 1;
        while (!this.isAtEnd() && depth > 0) {
          const c = this.advance();
          if (c === '{') depth++;
          else if (c === '}') {
            depth--;
            if (depth === 0) break;
          }
          exprCode += c;
        }
        if (depth > 0) {
          this.error(`Unclosed interpolation bracket '\${' inside template string`, startLine, startCol);
        }
        parts.push({ type: 'expression', value: exprCode.trim() });
      } else {
        currentStr += this.advance();
      }
    }

    if (this.isAtEnd()) {
      this.error(`Unterminated template string`, startLine, startCol);
    }

    if (currentStr.length > 0) {
      parts.push({ type: 'string', value: currentStr });
    }

    this.advance(); // consume closing `
    this.addToken(TokenType.TEMPLATE_STRING, parts, startLine, startCol);
  }

  scanInterpolatedString(quote, startLine, startCol) {
    // Formatted string f"Hello {name}, score: {score + 10}"
    // Scans chunks: strings and embedded expression sources
    const parts = [];
    let currentStr = '';

    while (!this.isAtEnd() && this.peek() !== quote) {
      if (this.peek() === '\n') {
        this.error(`Unterminated formatted string literal`, startLine, startCol);
      }
      if (this.peek() === '\\') {
        this.advance();
        const esc = this.advance();
        if (esc === '{' || esc === '}') {
          currentStr += esc;
        } else {
          currentStr += this.getEscapeChar(esc);
        }
      } else if (this.peek() === '{') {
        // Start of interpolation expression
        if (currentStr.length > 0) {
          parts.push({ type: 'string', value: currentStr });
          currentStr = '';
        }
        this.advance(); // consume '{'
        
        let exprCode = '';
        let depth = 1;
        while (!this.isAtEnd() && depth > 0) {
          const c = this.advance();
          if (c === '{') depth++;
          else if (c === '}') {
            depth--;
            if (depth === 0) break;
          }
          exprCode += c;
        }
        if (depth > 0) {
          this.error(`Unclosed interpolation bracket '{' inside formatted string`, startLine, startCol);
        }
        parts.push({ type: 'expression', value: exprCode.trim() });
      } else {
        currentStr += this.advance();
      }
    }

    if (this.isAtEnd()) {
      this.error(`Unterminated formatted string literal`, startLine, startCol);
    }

    if (currentStr.length > 0) {
      parts.push({ type: 'string', value: currentStr });
    }

    this.advance(); // consume closing quote
    this.addToken(TokenType.INTERPOLATED_STRING, parts, startLine, startCol);
  }

  getEscapeChar(ch) {
    switch (ch) {
      case 'n': return '\n';
      case 'r': return '\r';
      case 't': return '\t';
      case '\\': return '\\';
      case '"': return '"';
      case "'": return "'";
      case '0': return '\0';
      default: return ch;
    }
  }

  scanNumber(firstChar, startLine, startCol) {
    let numStr = firstChar;

    // Hex: 0x...
    if (firstChar === '0' && (this.peek() === 'x' || this.peek() === 'X')) {
      numStr += this.advance();
      while (this.isHexDigit(this.peek())) {
        numStr += this.advance();
      }
      this.addToken(TokenType.NUMBER, parseInt(numStr, 16), startLine, startCol, numStr);
      return;
    }

    // Binary: 0b...
    if (firstChar === '0' && (this.peek() === 'b' || this.peek() === 'B')) {
      numStr += this.advance();
      while (this.peek() === '0' || this.peek() === '1') {
        numStr += this.advance();
      }
      this.addToken(TokenType.NUMBER, parseInt(numStr.slice(2), 2), startLine, startCol, numStr);
      return;
    }

    // Octal: 0o...
    if (firstChar === '0' && (this.peek() === 'o' || this.peek() === 'O')) {
      numStr += this.advance();
      while (this.peek() >= '0' && this.peek() <= '7') {
        numStr += this.advance();
      }
      this.addToken(TokenType.NUMBER, parseInt(numStr.slice(2), 8), startLine, startCol, numStr);
      return;
    }

    // Standard decimal integer or float
    while (this.isDigit(this.peek())) {
      numStr += this.advance();
    }

    // Check for fractional part (be careful not to consume '..' range operator)
    if (this.peek() === '.' && this.peek(1) !== '.' && this.isDigit(this.peek(1))) {
      numStr += this.advance(); // consume '.'
      while (this.isDigit(this.peek())) {
        numStr += this.advance();
      }
    }

    // Scientific notation (e.g., 1e-5, 2.5e3)
    if (this.peek() === 'e' || this.peek() === 'E') {
      numStr += this.advance();
      if (this.peek() === '+' || this.peek() === '-') {
        numStr += this.advance();
      }
      while (this.isDigit(this.peek())) {
        numStr += this.advance();
      }
    }

    this.addToken(TokenType.NUMBER, parseFloat(numStr), startLine, startCol, numStr);
  }

  scanIdentifier(firstChar, startLine, startCol) {
    let id = firstChar;
    while (this.isAlphaNumericOrUnderscore(this.peek())) {
      id += this.advance();
    }

    // Check for single underscore placeholder
    if (id === '_') {
      this.addToken(TokenType.UNDERSCORE, '_', startLine, startCol);
      return;
    }

    // Check for keywords safely (avoiding Object.prototype methods like toString/toLocaleString)
    const hasKeyword = Object.prototype.hasOwnProperty.call(KEYWORDS, id);
    const keywordType = hasKeyword ? KEYWORDS[id] : null;
    if (keywordType) {
      let val = id;
      if (keywordType === TokenType.BOOLEAN) {
        val = id === 'true';
      } else if (keywordType === TokenType.NULL) {
        val = null;
      } else if (keywordType === TokenType.UNDEFINED) {
        val = undefined;
      }
      this.addToken(keywordType, val, startLine, startCol, id);
    } else {
      this.addToken(TokenType.IDENTIFIER, id, startLine, startCol, id);
    }
  }

  isDigit(ch) {
    return ch >= '0' && ch <= '9';
  }

  isHexDigit(ch) {
    return (ch >= '0' && ch <= '9') || (ch >= 'a' && ch <= 'f') || (ch >= 'A' && ch <= 'F');
  }

  isAlphaOrUnderscore(ch) {
    return (ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z') || ch === '_' || ch === '$';
  }

  isAlphaNumericOrUnderscore(ch) {
    return this.isAlphaOrUnderscore(ch) || this.isDigit(ch);
  }

  addToken(type, value, line, column, raw = value) {
    this.tokens.push(new Token(type, value, line, column, raw));
  }

  error(message, line, column) {
    const lines = this.source.split('\n');
    const targetLine = lines[line - 1] || '';
    const pointer = ' '.repeat(Math.max(0, column - 1)) + '^';
    const snippet = `  ${line} | ${targetLine}\n    | ${pointer}`;
    throw new LexerError(message, line, column, snippet);
  }
}
