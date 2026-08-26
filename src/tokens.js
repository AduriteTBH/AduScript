/**
 * AduScript Compiler - Token Definitions
 * Defines all token types, keywords, operators, and metadata.
 */

export const TokenType = {
  // Literals
  NUMBER: 'NUMBER',
  STRING: 'STRING',
  TEMPLATE_STRING: 'TEMPLATE_STRING',
  INTERPOLATED_STRING: 'INTERPOLATED_STRING', // f"Hello {name}"
  IDENTIFIER: 'IDENTIFIER',
  BOOLEAN: 'BOOLEAN',
  NULL: 'NULL',
  UNDEFINED: 'UNDEFINED',

  // Keywords
  LET: 'LET',
  MUT: 'MUT',
  STATE: 'STATE',
  FN: 'FN',
  ASYNC: 'ASYNC',
  AWAIT: 'AWAIT',
  USE: 'USE',
  IMPORT: 'IMPORT',
  EXPORT: 'EXPORT',
  FROM: 'FROM',
  AS: 'AS',
  MATCH: 'MATCH',
  WITH: 'WITH',
  IF: 'IF',
  ELSE: 'ELSE',
  FOR: 'FOR',
  IN: 'IN',
  WHILE: 'WHILE',
  RETURN: 'RETURN',
  WATCH: 'WATCH',
  EFFECT: 'EFFECT',
  NEW: 'NEW',
  TYPEOF: 'TYPEOF',
  INSTANCEOF: 'INSTANCEOF',
  TRY: 'TRY',
  CATCH: 'CATCH',
  FINALLY: 'FINALLY',
  THROW: 'THROW',
  BREAK: 'BREAK',
  CONTINUE: 'CONTINUE',
  DEFAULT: 'DEFAULT',

  // Operators
  PIPELINE: 'PIPELINE',         // |>
  THIN_ARROW: 'THIN_ARROW',     // ->
  FAT_ARROW: 'FAT_ARROW',       // =>
  RANGE: 'RANGE',               // ..
  OPTIONAL_CHAIN: 'OPTIONAL_CHAIN', // ?.
  NULLISH_COALESCE: 'NULLISH_COALESCE', // ??
  SPREAD: 'SPREAD',             // ...

  PLUS: 'PLUS',                 // +
  MINUS: 'MINUS',               // -
  STAR: 'STAR',                 // *
  SLASH: 'SLASH',               // /
  PERCENT: 'PERCENT',           // %
  STAR_STAR: 'STAR_STAR',       // **

  EQUALS: 'EQUALS',             // =
  PLUS_EQUALS: 'PLUS_EQUALS',   // +=
  MINUS_EQUALS: 'MINUS_EQUALS', // -=
  STAR_EQUALS: 'STAR_EQUALS',   // *=
  SLASH_EQUALS: 'SLASH_EQUALS', // /=
  PERCENT_EQUALS: 'PERCENT_EQUALS', // %=

  EQ_EQ: 'EQ_EQ',               // ==
  NOT_EQ: 'NOT_EQ',             // !=
  EQ_EQ_EQ: 'EQ_EQ_EQ',         // ===
  NOT_EQ_EQ: 'NOT_EQ_EQ',       // !==
  LT: 'LT',                     // <
  LTE: 'LTE',                   // <=
  GT: 'GT',                     // >
  GTE: 'GTE',                   // >=

  LOGICAL_AND: 'LOGICAL_AND',   // &&
  LOGICAL_OR: 'LOGICAL_OR',     // ||
  NOT: 'NOT',                   // !

  BIT_AND: 'BIT_AND',           // &
  BIT_OR: 'BIT_OR',             // |
  BIT_XOR: 'BIT_XOR',           // ^
  BIT_NOT: 'BIT_NOT',           // ~

  // Delimiters & Punctuation
  LPAREN: 'LPAREN',             // (
  RPAREN: 'RPAREN',             // )
  LBRACE: 'LBRACE',             // {
  RBRACE: 'RBRACE',             // }
  LBRACKET: 'LBRACKET',         // [
  RBRACKET: 'RBRACKET',         // ]
  COMMA: 'COMMA',               // ,
  COLON: 'COLON',               // :
  SEMICOLON: 'SEMICOLON',       // ;
  DOT: 'DOT',                   // .
  QUESTION: 'QUESTION',         // ?
  UNDERSCORE: 'UNDERSCORE',     // _ (placeholder)

  // Special
  COMMENT: 'COMMENT',
  DOC_COMMENT: 'DOC_COMMENT',
  EOF: 'EOF'
};

export const KEYWORDS = {
  'let': TokenType.LET,
  'mut': TokenType.MUT,
  'state': TokenType.STATE,
  'fn': TokenType.FN,
  'async': TokenType.ASYNC,
  'await': TokenType.AWAIT,
  'use': TokenType.USE,
  'import': TokenType.IMPORT,
  'export': TokenType.EXPORT,
  'from': TokenType.FROM,
  'as': TokenType.AS,
  'match': TokenType.MATCH,
  'with': TokenType.WITH,
  'if': TokenType.IF,
  'else': TokenType.ELSE,
  'for': TokenType.FOR,
  'in': TokenType.IN,
  'while': TokenType.WHILE,
  'return': TokenType.RETURN,
  'watch': TokenType.WATCH,
  'effect': TokenType.EFFECT,
  'true': TokenType.BOOLEAN,
  'false': TokenType.BOOLEAN,
  'null': TokenType.NULL,
  'undefined': TokenType.UNDEFINED,
  'new': TokenType.NEW,
  'typeof': TokenType.TYPEOF,
  'instanceof': TokenType.INSTANCEOF,
  'try': TokenType.TRY,
  'catch': TokenType.CATCH,
  'finally': TokenType.FINALLY,
  'throw': TokenType.THROW,
  'break': TokenType.BREAK,
  'continue': TokenType.CONTINUE,
  'default': TokenType.DEFAULT
};

export const Precedence = {
  LOWEST: 0,
  PIPELINE: 1,      // |>
  ASSIGN: 2,        // = += -= etc
  TERNARY: 3,       // ? :
  NULLISH: 4,       // ??
  LOGICAL_OR: 5,    // ||
  LOGICAL_AND: 6,   // &&
  BIT_OR: 7,        // |
  BIT_XOR: 8,       // ^
  BIT_AND: 9,       // &
  EQUALITY: 10,     // == != === !==
  RELATIONAL: 10,   // < <= > >= instanceof in
  RANGE: 11,        // ..
  SUM: 12,          // + -
  PRODUCT: 13,      // * / %
  EXPONENT: 14,     // **
  PREFIX: 15,       // ! - + typeof await
  POSTFIX: 16,      // () [] . ?.
  CALL: 17
};

export class Token {
  constructor(type, value, line, column, raw = value) {
    this.type = type;
    this.value = value;
    this.line = line;
    this.column = column;
    this.raw = raw;
  }

  toString() {
    return `Token(${this.type}, ${JSON.stringify(this.value)}, Line ${this.line}:${this.column})`;
  }
}
