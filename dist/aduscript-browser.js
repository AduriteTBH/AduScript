/**
 * AduScript In-Browser Compiler & Client Runtime (Standalone Bundle)
 * Deliverable D: Zero-dependency compiler and automatic <script type="text/aduscript"> runner.
 * Version: 1.0.0
 */

(function (global) {
  'use strict';

  // --- TOKENS ---
/**
 * AduScript Compiler - Token Definitions
 * Defines all token types, keywords, operators, and metadata.
 */

const TokenType = {
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

const KEYWORDS = {
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

const Precedence = {
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

class Token {
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


  // --- AST ---
/**
 * AduScript Compiler - Abstract Syntax Tree (AST) Definitions & Utilities
 */

const ASTNodeType = {
  PROGRAM: 'Program',
  
  // Declarations & Statements
  VARIABLE_DECLARATION: 'VariableDeclaration',
  STATE_DECLARATION: 'StateDeclaration',
  FUNCTION_DECLARATION: 'FunctionDeclaration',
  USE_DECLARATION: 'UseDeclaration',
  IMPORT_DECLARATION: 'ImportDeclaration',
  EXPORT_DECLARATION: 'ExportDeclaration',
  IF_STATEMENT: 'IfStatement',
  MATCH_STATEMENT: 'MatchStatement',
  FOR_STATEMENT: 'ForStatement',
  WHILE_STATEMENT: 'WhileStatement',
  RETURN_STATEMENT: 'ReturnStatement',
  WATCH_STATEMENT: 'WatchStatement',
  EFFECT_STATEMENT: 'EffectStatement',
  BLOCK_STATEMENT: 'BlockStatement',
  EXPRESSION_STATEMENT: 'ExpressionStatement',
  TRY_STATEMENT: 'TryStatement',
  THROW_STATEMENT: 'ThrowStatement',
  BREAK_STATEMENT: 'BreakStatement',
  CONTINUE_STATEMENT: 'ContinueStatement',

  // Expressions
  PIPELINE_EXPRESSION: 'PipelineExpression',
  MATCH_EXPRESSION: 'MatchExpression',
  MATCH_ARM: 'MatchArm',
  BINARY_EXPRESSION: 'BinaryExpression',
  UNARY_EXPRESSION: 'UnaryExpression',
  RANGE_EXPRESSION: 'RangeExpression',
  CALL_EXPRESSION: 'CallExpression',
  MEMBER_EXPRESSION: 'MemberExpression',
  ASSIGNMENT_EXPRESSION: 'AssignmentExpression',
  CLOSURE_EXPRESSION: 'ClosureExpression',
  IDENTIFIER: 'Identifier',
  LITERAL: 'Literal',
  FORMATTED_STRING_LITERAL: 'FormattedStringLiteral',
  ARRAY_LITERAL: 'ArrayLiteral',
  OBJECT_LITERAL: 'ObjectLiteral',
  OBJECT_PROPERTY: 'ObjectProperty',
  PLACEHOLDER_EXPRESSION: 'PlaceholderExpression',
  SPREAD_ELEMENT: 'SpreadElement',
  AWAIT_EXPRESSION: 'AwaitExpression',
  NEW_EXPRESSION: 'NewExpression',
  TAGGED_TEMPLATE_EXPRESSION: 'TaggedTemplateExpression',
  TEMPLATE_LITERAL: 'TemplateLiteral',
  CONDITIONAL_EXPRESSION: 'ConditionalExpression',
  
  // Patterns
  WILDCARD_PATTERN: 'WildcardPattern',
  IDENTIFIER_PATTERN: 'IdentifierPattern',
  LITERAL_PATTERN: 'LiteralPattern',
  RANGE_PATTERN: 'RangePattern',
  ARRAY_PATTERN: 'ArrayPattern',
  OBJECT_PATTERN: 'ObjectPattern',
  REST_PATTERN: 'RestPattern'
};

class ASTNode {
  constructor(type, loc = { line: 1, column: 1 }) {
    this.type = type;
    this.loc = loc;
  }
}

class ProgramNode extends ASTNode {
  constructor(body, loc) {
    super(ASTNodeType.PROGRAM, loc);
    this.body = body || [];
  }
}

class VariableDeclarationNode extends ASTNode {
  constructor(kind, pattern, init, loc) {
    super(ASTNodeType.VARIABLE_DECLARATION, loc);
    this.kind = kind; // 'let' | 'mut'
    this.pattern = pattern;
    this.init = init;
  }
}

class StateDeclarationNode extends ASTNode {
  constructor(id, init, loc) {
    super(ASTNodeType.STATE_DECLARATION, loc);
    this.id = id;
    this.init = init;
  }
}

class FunctionDeclarationNode extends ASTNode {
  constructor(id, params, body, isAsync = false, isExpressionBody = false, loc) {
    super(ASTNodeType.FUNCTION_DECLARATION, loc);
    this.id = id;
    this.params = params || [];
    this.body = body;
    this.isAsync = isAsync;
    this.isExpressionBody = isExpressionBody;
  }
}

class UseDeclarationNode extends ASTNode {
  constructor(source, isCDN, alias = null, specifiers = [], loc) {
    super(ASTNodeType.USE_DECLARATION, loc);
    this.source = source;
    this.isCDN = isCDN;
    this.alias = alias;
    this.specifiers = specifiers;
  }
}

class ImportDeclarationNode extends ASTNode {
  constructor(source, defaultImport = null, specifiers = [], loc) {
    super(ASTNodeType.IMPORT_DECLARATION, loc);
    this.source = source;
    this.defaultImport = defaultImport;
    this.specifiers = specifiers;
  }
}

class ExportDeclarationNode extends ASTNode {
  constructor(declaration, isDefault = false, specifiers = [], loc) {
    super(ASTNodeType.EXPORT_DECLARATION, loc);
    this.declaration = declaration;
    this.isDefault = isDefault;
    this.specifiers = specifiers;
  }
}

class IfStatementNode extends ASTNode {
  constructor(test, consequent, alternate = null, loc) {
    super(ASTNodeType.IF_STATEMENT, loc);
    this.test = test;
    this.consequent = consequent;
    this.alternate = alternate;
  }
}

class MatchStatementNode extends ASTNode {
  constructor(discriminant, arms, loc) {
    super(ASTNodeType.MATCH_STATEMENT, loc);
    this.discriminant = discriminant;
    this.arms = arms || [];
  }
}

class MatchExpressionNode extends ASTNode {
  constructor(discriminant, arms, loc) {
    super(ASTNodeType.MATCH_EXPRESSION, loc);
    this.discriminant = discriminant;
    this.arms = arms || [];
  }
}

class MatchArmNode extends ASTNode {
  constructor(pattern, guard, body, loc) {
    super(ASTNodeType.MATCH_ARM, loc);
    this.pattern = pattern;
    this.guard = guard; // null or expression
    this.body = body;
  }
}

class ForStatementNode extends ASTNode {
  constructor(kind, variable, iterable, body, loc) {
    super(ASTNodeType.FOR_STATEMENT, loc);
    this.kind = kind; // 'let' | 'mut' | null
    this.variable = variable;
    this.iterable = iterable;
    this.body = body;
  }
}

class WhileStatementNode extends ASTNode {
  constructor(test, body, loc) {
    super(ASTNodeType.WHILE_STATEMENT, loc);
    this.test = test;
    this.body = body;
  }
}

class ReturnStatementNode extends ASTNode {
  constructor(argument = null, loc) {
    super(ASTNodeType.RETURN_STATEMENT, loc);
    this.argument = argument;
  }
}

class WatchStatementNode extends ASTNode {
  constructor(target, handler, loc) {
    super(ASTNodeType.WATCH_STATEMENT, loc);
    this.target = target;
    this.handler = handler;
  }
}

class EffectStatementNode extends ASTNode {
  constructor(body, loc) {
    super(ASTNodeType.EFFECT_STATEMENT, loc);
    this.body = body;
  }
}

class BlockStatementNode extends ASTNode {
  constructor(body, loc) {
    super(ASTNodeType.BLOCK_STATEMENT, loc);
    this.body = body || [];
  }
}

class ExpressionStatementNode extends ASTNode {
  constructor(expression, loc) {
    super(ASTNodeType.EXPRESSION_STATEMENT, loc);
    this.expression = expression;
  }
}

class PipelineExpressionNode extends ASTNode {
  constructor(left, right, loc) {
    super(ASTNodeType.PIPELINE_EXPRESSION, loc);
    this.left = left;
    this.right = right;
  }
}

class BinaryExpressionNode extends ASTNode {
  constructor(operator, left, right, loc) {
    super(ASTNodeType.BINARY_EXPRESSION, loc);
    this.operator = operator;
    this.left = left;
    this.right = right;
  }
}

class UnaryExpressionNode extends ASTNode {
  constructor(operator, argument, prefix = true, loc) {
    super(ASTNodeType.UNARY_EXPRESSION, loc);
    this.operator = operator;
    this.argument = argument;
    this.prefix = prefix;
  }
}

class RangeExpressionNode extends ASTNode {
  constructor(start, end, loc) {
    super(ASTNodeType.RANGE_EXPRESSION, loc);
    this.start = start;
    this.end = end;
  }
}

class ConditionalExpressionNode extends ASTNode {
  constructor(test, consequent, alternate, loc) {
    super(ASTNodeType.CONDITIONAL_EXPRESSION, loc);
    this.test = test;
    this.consequent = consequent;
    this.alternate = alternate;
  }
}

class CallExpressionNode extends ASTNode {
  constructor(callee, args = [], optional = false, loc) {
    super(ASTNodeType.CALL_EXPRESSION, loc);
    this.callee = callee;
    this.arguments = args;
    this.optional = optional;
  }
}

class TaggedTemplateExpressionNode extends ASTNode {
  constructor(tag, quasi, loc) {
    super(ASTNodeType.TAGGED_TEMPLATE_EXPRESSION, loc);
    this.tag = tag;
    this.quasi = quasi;
  }
}

class TemplateLiteralNode extends ASTNode {
  constructor(parts, loc) {
    super(ASTNodeType.TEMPLATE_LITERAL, loc);
    this.parts = parts;
  }
}

class MemberExpressionNode extends ASTNode {
  constructor(object, property, computed = false, optional = false, loc) {
    super(ASTNodeType.MEMBER_EXPRESSION, loc);
    this.object = object;
    this.property = property;
    this.computed = computed;
    this.optional = optional;
  }
}

class AssignmentExpressionNode extends ASTNode {
  constructor(operator, left, right, loc) {
    super(ASTNodeType.ASSIGNMENT_EXPRESSION, loc);
    this.operator = operator;
    this.left = left;
    this.right = right;
  }
}

class ClosureExpressionNode extends ASTNode {
  constructor(params, body, isAsync = false, isExpressionBody = true, loc) {
    super(ASTNodeType.CLOSURE_EXPRESSION, loc);
    this.params = params || [];
    this.body = body;
    this.isAsync = isAsync;
    this.isExpressionBody = isExpressionBody;
  }
}

class IdentifierNode extends ASTNode {
  constructor(name, loc) {
    super(ASTNodeType.IDENTIFIER, loc);
    this.name = name;
  }
}

class LiteralNode extends ASTNode {
  constructor(value, raw, loc) {
    super(ASTNodeType.LITERAL, loc);
    this.value = value;
    this.raw = raw;
  }
}

class FormattedStringLiteralNode extends ASTNode {
  constructor(parts, loc) {
    super(ASTNodeType.FORMATTED_STRING_LITERAL, loc);
    this.parts = parts; // Array of { type: 'string'|'expression', value: any, exprNode?: ASTNode }
  }
}

class ArrayLiteralNode extends ASTNode {
  constructor(elements = [], loc) {
    super(ASTNodeType.ARRAY_LITERAL, loc);
    this.elements = elements;
  }
}

class ObjectLiteralNode extends ASTNode {
  constructor(properties = [], loc) {
    super(ASTNodeType.OBJECT_LITERAL, loc);
    this.properties = properties;
  }
}

class ObjectPropertyNode extends ASTNode {
  constructor(key, value, shorthand = false, computed = false, loc) {
    super(ASTNodeType.OBJECT_PROPERTY, loc);
    this.key = key;
    this.value = value;
    this.shorthand = shorthand;
    this.computed = computed;
  }
}

class PlaceholderExpressionNode extends ASTNode {
  constructor(loc) {
    super(ASTNodeType.PLACEHOLDER_EXPRESSION, loc);
  }
}

class SpreadElementNode extends ASTNode {
  constructor(argument, loc) {
    super(ASTNodeType.SPREAD_ELEMENT, loc);
    this.argument = argument;
  }
}

class AwaitExpressionNode extends ASTNode {
  constructor(argument, loc) {
    super(ASTNodeType.AWAIT_EXPRESSION, loc);
    this.argument = argument;
  }
}

class NewExpressionNode extends ASTNode {
  constructor(callee, args = [], loc) {
    super(ASTNodeType.NEW_EXPRESSION, loc);
    this.callee = callee;
    this.arguments = args;
  }
}

class TryStatementNode extends ASTNode {
  constructor(block, handlerParam = null, handlerBody = null, finalizer = null, loc) {
    super(ASTNodeType.TRY_STATEMENT, loc);
    this.block = block;
    this.handlerParam = handlerParam;
    this.handlerBody = handlerBody;
    this.finalizer = finalizer;
  }
}

class ThrowStatementNode extends ASTNode {
  constructor(argument, loc) {
    super(ASTNodeType.THROW_STATEMENT, loc);
    this.argument = argument;
  }
}

class BreakStatementNode extends ASTNode {
  constructor(loc) {
    super(ASTNodeType.BREAK_STATEMENT, loc);
  }
}

class ContinueStatementNode extends ASTNode {
  constructor(loc) {
    super(ASTNodeType.CONTINUE_STATEMENT, loc);
  }
}

/**
 * AST Traverser / Visitor Helper
 */
function walkAST(node, visitor) {
  if (!node || typeof node !== 'object') return;

  const nodeType = node.type;
  if (visitor[nodeType]) {
    visitor[nodeType](node);
  } else if (visitor.enter) {
    visitor.enter(node);
  }

  for (const key of Object.keys(node)) {
    if (key === 'loc' || key === 'type') continue;
    const child = node[key];
    if (Array.isArray(child)) {
      for (const item of child) {
        if (item && item.type) walkAST(item, visitor);
      }
    } else if (child && child.type) {
      walkAST(child, visitor);
    }
  }

  if (visitor.exit) {
    visitor.exit(node);
  }
}


  // --- RUNTIME ($adu) ---
/**
 * AduScript Runtime Library ($adu)
 * Zero-dependency reactive primitives, pattern matching engine, CDN resolution, and utilities.
 */

// Active effect tracker for automatic dependency collection
let activeEffect = null;

class Signal {
  constructor(initialValue) {
    this._subscribers = new Set();
    this._value = this._wrap(initialValue);
  }

  _wrap(val) {
    if (val !== null && typeof val === 'object' && !val.__isProxy) {
      const self = this;
      return new Proxy(val, {
        get(target, prop, receiver) {
          if (prop === '__isProxy') return true;
          self._track();
          const res = Reflect.get(target, prop, receiver);
          return (typeof res === 'object' && res !== null) ? self._wrap(res) : res;
        },
        set(target, prop, newVal, receiver) {
          const old = Reflect.get(target, prop, receiver);
          const success = Reflect.set(target, prop, newVal, receiver);
          if (old !== newVal) {
            self._notify();
          }
          return success;
        }
      });
    }
    return val;
  }

  _track() {
    if (activeEffect) {
      this._subscribers.add(activeEffect);
    }
  }

  _notify() {
    // Clone subscribers to avoid infinite loops if an effect modifies the signal
    const subs = Array.from(this._subscribers);
    for (const sub of subs) {
      try {
        sub();
      } catch (err) {
        console.error('[AduScript Reactive Error]', err);
      }
    }
  }

  get value() {
    this._track();
    return this._value;
  }

  set value(newVal) {
    if (this._value !== newVal) {
      this._value = this._wrap(newVal);
      this._notify();
    }
  }

  // Value coercion
  toString() {
    return String(this.value);
  }

  valueOf() {
    return this.value;
  }
}

/**
 * Creates a reactive state signal.
 * Usage in AduScript: `state count = 0` -> `$adu.state(0)`
 */
function state(initialValue) {
  return new Signal(initialValue);
}

/**
 * Observes a specific state signal and runs a callback on change.
 * Usage in AduScript: `watch count => { ... }` -> `$adu.watch(count, (val) => { ... })`
 */
function watch(target, callback) {
  if (target instanceof Signal) {
    let lastVal = target.value;
    const watcher = () => {
      const current = target.value;
      if (current !== lastVal) {
        const prev = lastVal;
        lastVal = current;
        callback(current, prev);
      }
    };
    target._subscribers.add(watcher);
    return () => target._subscribers.delete(watcher);
  } else if (typeof target === 'function') {
    // Computed watch
    return effect(() => {
      callback(target());
    });
  }
}

/**
 * Runs an effect function and automatically tracks all accessed signals.
 * Usage in AduScript: `effect { ... }` -> `$adu.effect(() => { ... })`
 */
function effect(fn) {
  const runner = () => {
    const prevEffect = activeEffect;
    activeEffect = runner;
    try {
      fn();
    } finally {
      activeEffect = prevEffect;
    }
  };
  runner();
  return runner;
}

/**
 * Creates a reactive computed signal derived from other signals.
 */
function computed(fn) {
  const comp = state(undefined);
  effect(() => {
    comp.value = fn();
  });
  return comp;
}

/**
 * Helper to bind reactive state to a DOM element property.
 */
function bind(el, prop, signal) {
  if (typeof el === 'string' && typeof document !== 'undefined') el = document.querySelector(el);
  if (!el || !(signal instanceof Signal)) return;

  effect(() => {
    el[prop] = signal.value;
  });

  if (prop === 'value' || prop === 'checked') {
    el.addEventListener('input', (e) => {
      signal.value = prop === 'checked' ? e.target.checked : e.target.value;
    });
  }
}

/**
 * Reactive HTML Template Tag Helper
 * Usage: html`<div class="card">${title.value}</div>`
 */
function html(strings, ...values) {
  if (typeof document === 'undefined') {
    return strings.reduce((acc, str, i) => acc + str + (values[i] !== undefined ? values[i] : ''), '');
  }

  let markup = '';
  const listeners = [];
  const slots = [];

  strings.forEach((str, i) => {
    markup += str;
    if (i < values.length) {
      const val = values[i];
      if (typeof val === 'function') {
        const handlerId = `__adu_evt_${Math.random().toString(36).slice(2, 9)}`;
        listeners.push({ id: handlerId, fn: val });
        markup += `"${handlerId}"`;
      } else if (val && (val instanceof Node || (Array.isArray(val) && val.some(x => x instanceof Node)))) {
        const slotId = `__adu_slot_${Math.random().toString(36).slice(2, 9)}`;
        slots.push({ id: slotId, node: val });
        markup += `<span data-adu-slot="${slotId}"></span>`;
      } else if (val && typeof val === 'object' && val.value !== undefined) {
        // Signal / State
        const sVal = val.value;
        if (sVal && (sVal instanceof Node || (Array.isArray(sVal) && sVal.some(x => x instanceof Node)))) {
          const slotId = `__adu_slot_${Math.random().toString(36).slice(2, 9)}`;
          slots.push({ id: slotId, node: sVal });
          markup += `<span data-adu-slot="${slotId}"></span>`;
        } else {
          markup += sVal !== undefined && sVal !== null ? sVal : '';
        }
      } else if (Array.isArray(val)) {
        markup += val.map(item => (item && item.value !== undefined ? item.value : (item !== undefined && item !== null ? item : ''))).join('');
      } else if (val !== undefined && val !== null) {
        markup += val;
      }
    }
  });

  const template = document.createElement('template');
  template.innerHTML = markup.trim();
  const fragment = template.content;

  // 1. Replace slot placeholders with actual DOM Nodes
  for (const { id, node } of slots) {
    const slotEl = fragment.querySelector(`[data-adu-slot="${id}"]`);
    if (slotEl) {
      if (Array.isArray(node)) {
        const nodesToInsert = [];
        for (const item of node) {
          if (item instanceof Node) {
            nodesToInsert.push(item);
          } else if (item !== undefined && item !== null) {
            nodesToInsert.push(document.createTextNode(String(item)));
          }
        }
        slotEl.replaceWith(...nodesToInsert);
      } else if (node instanceof Node) {
        slotEl.replaceWith(node);
      }
    }
  }

  // 2. Attach event handlers across standard event attributes
  for (const { id, fn } of listeners) {
    const allMatching = fragment.querySelectorAll('*');
    for (const el of allMatching) {
      for (const attr of el.getAttributeNames()) {
        if (el.getAttribute(attr) === id) {
          el.removeAttribute(attr);
          const eventName = attr.startsWith('on') ? attr.slice(2).toLowerCase() : attr.toLowerCase();
          el.addEventListener(eventName, fn);
        }
      }
    }
  }

  return fragment.childElementCount === 1 ? fragment.firstElementChild : fragment;
}

/**
 * CSS Style Injection Helper
 * Usage: css`
 *   .card { background: #1a1d2d; padding: 20px; border-radius: 10px; }
 * `
 */
function css(strings, ...values) {
  const styleContent = strings.reduce((acc, str, i) => acc + str + (values[i] !== undefined ? values[i] : ''), '');
  if (typeof document !== 'undefined') {
    const styleEl = document.createElement('style');
    styleEl.setAttribute('data-adu-style', 'true');
    styleEl.textContent = styleContent;
    document.head.appendChild(styleEl);
  }
  return styleContent;
}

/**
 * Component Mount Helper
 * Mounts a reactive render function to a root DOM container.
 */
function mount(container, renderFn) {
  const el = typeof container === 'string'
    ? (typeof document !== 'undefined' ? document.querySelector(container) : null)
    : container;

  if (!el) {
    console.warn(`[AduScript Mount] Container '${container}' not found.`);
    return;
  }

  const effectFn = () => {
    const rendered = renderFn();
    if (typeof rendered === 'string') {
      el.innerHTML = rendered;
    } else if (rendered instanceof Node) {
      el.innerHTML = '';
      el.appendChild(rendered);
    }
  };

  effect(effectFn);
}

/**
 * Pattern matching runtime evaluator.
 * Usage in AduScript: `match val with ...` -> `$adu.match(val, [ ... ])`
 */
function match(value, arms) {
  for (const arm of arms) {
    if (typeof arm === 'function') {
      const res = arm(value);
      if (res && res.matched) return res.value;
    } else if (arm && typeof arm.test === 'function') {
      if (arm.test(value)) {
        if (!arm.guard || arm.guard(value)) {
          return typeof arm.body === 'function' ? arm.body(value) : arm.body;
        }
      }
    }
  }
  throw new Error(`[AduScript Pattern Match Error] No matching arm for value: ${JSON.stringify(value)}`);
}

/**
 * Pattern test helpers
 */
function matchLiteral(expected) {
  return (val) => val === expected;
}

function matchRange(start, end) {
  return (val) => typeof val === 'number' && val >= start && val <= end;
}

function matchWildcard() {
  return () => true;
}

function matchObject(schema) {
  return (val) => {
    if (val === null || typeof val !== 'object') return false;
    for (const [k, expected] of Object.entries(schema)) {
      if (!(k in val)) return false;
      if (typeof expected === 'function') {
        if (!expected(val[k])) return false;
      } else if (val[k] !== expected) {
        return false;
      }
    }
    return true;
  };
}

function matchArray(elements, hasRest = false) {
  return (val) => {
    if (!Array.isArray(val)) return false;
    if (!hasRest && val.length !== elements.length) return false;
    if (hasRest && val.length < elements.length) return false;
    for (let i = 0; i < elements.length; i++) {
      const expected = elements[i];
      if (typeof expected === 'function') {
        if (!expected(val[i])) return false;
      } else if (val[i] !== expected) {
        return false;
      }
    }
    return true;
  };
}

/**
 * Pipeline helper
 */
function pipe(initialValue, ...fns) {
  return fns.reduce((acc, fn) => {
    if (typeof fn === 'function') {
      return fn(acc);
    }
    return fn;
  }, initialValue);
}

/**
 * Range generator / array helper: 0..10
 */
function range(start, end, inclusive = true) {
  const result = [];
  if (start <= end) {
    for (let i = start; inclusive ? i <= end : i < end; i++) {
      result.push(i);
    }
  } else {
    for (let i = start; inclusive ? i >= end : i > end; i--) {
      result.push(i);
    }
  }
  return result;
}

/**
 * Smart CDN Package Resolver
 * Resolves standard CDN names to ESM URLs.
 */
const CDN_MAP = {
  'three': 'https://esm.sh/three',
  'three/addons': 'https://esm.sh/three/addons/',
  'gsap': 'https://esm.sh/gsap',
  'pixi': 'https://esm.sh/pixi.js',
  'pixi.js': 'https://esm.sh/pixi.js',
  'canvas-confetti': 'https://esm.sh/canvas-confetti',
  'lucide': 'https://esm.sh/lucide',
  'chart.js': 'https://esm.sh/chart.js/auto',
  'howler': 'https://esm.sh/howler',
  'matter-js': 'https://esm.sh/matter-js',
  'lodash-es': 'https://esm.sh/lodash-es',
  'animejs': 'https://esm.sh/animejs'
};

function resolveCDN(specifier) {
  if (specifier.startsWith('http://') || specifier.startsWith('https://')) {
    return specifier;
  }
  const clean = specifier.startsWith('cdn:') ? specifier.slice(4) : specifier;
  if (CDN_MAP[clean]) {
    return CDN_MAP[clean];
  }
  return `https://esm.sh/${clean}`;
}

/**
 * Official AduScript Logo SVG & Helper
 */
const LOGO_SVG = `<svg viewBox="0 0 800 800" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="800" height="800" rx="40" fill="#C0004D"/><path d="M352.688 735H310.5L358.031 591H411.469L459 735H416.813L385.313 630.656H384.188L352.688 735ZM344.813 678.188H424.125V707.437H344.813V678.188ZM528.275 735H472.869V591H527.713C542.525 591 555.322 593.883 566.104 599.648C576.932 605.367 585.275 613.617 591.135 624.398C597.041 635.133 599.994 648 599.994 663C599.994 678 597.064 690.891 591.205 701.672C585.346 712.406 577.049 720.656 566.314 726.422C555.58 732.141 542.9 735 528.275 735ZM511.963 701.812H526.869C533.994 701.812 540.064 700.664 545.08 698.367C550.143 696.07 553.986 692.109 556.611 686.484C559.283 680.859 560.619 673.031 560.619 663C560.619 652.969 559.26 645.141 556.541 639.516C553.869 633.891 549.932 629.93 544.729 627.633C539.572 625.336 533.244 624.187 525.744 624.187H511.963V701.812ZM695.707 636C695.332 631.312 693.574 627.656 690.434 625.031C687.34 622.406 682.629 621.094 676.301 621.094C672.27 621.094 668.965 621.586 666.387 622.57C663.855 623.508 661.98 624.797 660.762 626.437C659.543 628.078 658.91 629.953 658.863 632.062C658.77 633.797 659.074 635.367 659.777 636.773C660.527 638.133 661.699 639.375 663.293 640.5C664.887 641.578 666.926 642.562 669.41 643.453C671.895 644.344 674.848 645.141 678.27 645.844L690.082 648.375C698.051 650.062 704.871 652.289 710.543 655.055C716.215 657.82 720.855 661.078 724.465 664.828C728.074 668.531 730.723 672.703 732.41 677.344C734.145 681.984 735.035 687.047 735.082 692.531C735.035 702 732.668 710.016 727.98 716.578C723.293 723.141 716.59 728.133 707.871 731.555C699.199 734.977 688.77 736.688 676.582 736.688C664.066 736.688 653.145 734.836 643.816 731.133C634.535 727.43 627.316 721.734 622.16 714.047C617.051 706.312 614.473 696.422 614.426 684.375H651.551C651.785 688.781 652.887 692.484 654.855 695.484C656.824 698.484 659.59 700.758 663.152 702.305C666.762 703.852 671.051 704.625 676.02 704.625C680.191 704.625 683.684 704.109 686.496 703.078C689.309 702.047 691.441 700.617 692.895 698.789C694.348 696.961 695.098 694.875 695.145 692.531C695.098 690.328 694.371 688.406 692.965 686.766C691.605 685.078 689.355 683.578 686.215 682.266C683.074 680.906 678.832 679.641 673.488 678.469L659.145 675.375C646.395 672.609 636.34 667.992 628.98 661.523C621.668 655.008 618.035 646.125 618.082 634.875C618.035 625.734 620.473 617.742 625.395 610.898C630.363 604.008 637.23 598.641 645.996 594.797C654.809 590.953 664.91 589.031 676.301 589.031C687.926 589.031 697.98 590.977 706.465 594.867C714.949 598.758 721.488 604.242 726.082 611.32C730.723 618.352 733.066 626.578 733.113 636H695.707Z" fill="white"/><path d="M418 0L0 447V532.254L498.5 0H418Z" fill="#C7004F"/></svg>`;

function logo(size = 32, className = 'adu-logo') {
  return `<span class="${className}" style="display:inline-flex;width:${size}px;height:${size}px;align-items:center;justify-content:center;vertical-align:middle;flex-shrink:0;">${LOGO_SVG.replace('<svg ', `<svg width="${size}" height="${size}" `)}</span>`;
}

// Export namespace object for bundle injection
const $adu = {
  state,
  watch,
  effect,
  computed,
  bind,
  html,
  css,
  mount,
  match,
  matchLiteral,
  matchRange,
  matchWildcard,
  matchObject,
  matchArray,
  pipe,
  range,
  resolveCDN,
  CDN_MAP,
  LOGO_SVG,
  logo
};



  // --- LEXER ---
/**
 * AduScript Compiler - Lexical Analyzer / Tokenizer
 * Deliverable A: Scans .ads source code and produces an array of Token instances.
 */


class LexerError extends Error {
  constructor(message, line, column, snippet = '') {
    const header = `[AduScript Syntax Error] ${message} (at line ${line}, column ${column})`;
    const formatted = snippet ? `${header}\n${snippet}` : header;
    super(formatted);
    this.name = 'LexerError';
    this.line = line;
    this.column = column;
  }
}

class Lexer {
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


  // --- PARSER ---
/**
 * AduScript Compiler - AST Parser
 * Deliverable B: Recursive Descent & Pratt Precedence Parser for AduScript
 */




class ParserError extends Error {
  constructor(message, line, column, snippet = '') {
    const header = `[AduScript Parse Error] ${message} (at line ${line}, column ${column})`;
    const formatted = snippet ? `${header}\n${snippet}` : header;
    super(formatted);
    this.name = 'ParserError';
    this.line = line;
    this.column = column;
  }
}

class Parser {
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
    return new ProgramNode(body, loc);
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
      return new BreakStatementNode(loc);
    }
    if (curr.type === TokenType.CONTINUE) {
      const loc = this.getLoc();
      this.advance();
      this.consumeSemicolon();
      return new ContinueStatementNode(loc);
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
    return new VariableDeclarationNode(kind, pattern, init, loc);
  }

  parseStateDeclaration() {
    const loc = this.getLoc();
    this.consume(TokenType.STATE, "Expected 'state'");
    const id = this.parseIdentifier();
    this.consume(TokenType.EQUALS, "Expected '=' after state identifier");
    const init = this.parseExpression();
    this.consumeSemicolon();
    return new StateDeclarationNode(id, init, loc);
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

    return new FunctionDeclarationNode(id, params, body, isAsync, isExpressionBody, loc);
  }

  parseParameters() {
    const params = [];
    if (!this.check(TokenType.RPAREN)) {
      do {
        if (this.match(TokenType.SPREAD)) {
          const id = this.parseIdentifier();
          params.push(new SpreadElementNode(id, id.loc));
          break;
        }
        const param = this.parsePattern();
        if (this.match(TokenType.EQUALS)) {
          const defaultVal = this.parseExpression();
          params.push(new AssignmentExpressionNode('=', param, defaultVal, param.loc));
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
    return new UseDeclarationNode(source, isCDN, alias, specifiers, loc);
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
      return new ImportDeclarationNode(source, null, [], loc);
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
    return new ImportDeclarationNode(source, defaultImport, specifiers, loc);
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
      return new ExportDeclarationNode(decl, true, [], loc);
    }

    if (this.check(TokenType.LET) || this.check(TokenType.MUT)) {
      const decl = this.parseVariableDeclaration();
      return new ExportDeclarationNode(decl, false, [], loc);
    }

    if (this.check(TokenType.FN) || (this.check(TokenType.ASYNC) && this.peekToken().type === TokenType.FN)) {
      const decl = this.parseFunctionDeclaration();
      return new ExportDeclarationNode(decl, false, [], loc);
    }

    if (this.check(TokenType.CLASS)) {
      const decl = this.parseClassDeclaration();
      return new ExportDeclarationNode(decl, false, [], loc);
    }

    if (this.check(TokenType.STATE)) {
      const decl = this.parseStateDeclaration();
      return new ExportDeclarationNode(decl, false, [], loc);
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
      return new ExportDeclarationNode(null, false, specifiers, loc);
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

    return new IfStatementNode(test, consequent, alternate, loc);
  }

  parseMatchStatement() {
    const loc = this.getLoc();
    this.consume(TokenType.MATCH, "Expected 'match'");
    const discriminant = this.parseExpression();
    this.consume(TokenType.WITH, "Expected 'with' after match discriminant");

    const arms = this.parseMatchArms();
    this.consumeSemicolon();
    return new MatchStatementNode(discriminant, arms, loc);
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

      arms.push(new MatchArmNode(pattern, guard, body, loc));

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
    return new ForStatementNode(kind, variable, iterable, body, loc);
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
    return new WhileStatementNode(test, body, loc);
  }

  parseReturnStatement() {
    const loc = this.getLoc();
    this.consume(TokenType.RETURN, "Expected 'return'");
    let argument = null;

    if (!this.check(TokenType.SEMICOLON) && !this.check(TokenType.RBRACE) && !this.isAtEnd()) {
      argument = this.parseExpression();
    }

    this.consumeSemicolon();
    return new ReturnStatementNode(argument, loc);
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
    return new WatchStatementNode(target, handler, loc);
  }

  parseEffectStatement() {
    const loc = this.getLoc();
    this.consume(TokenType.EFFECT, "Expected 'effect'");
    const body = this.parseBlockStatement();
    this.consumeSemicolon();
    return new EffectStatementNode(body, loc);
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
    return new TryStatementNode(block, handlerParam, handlerBody, finalizer, loc);
  }

  parseThrowStatement() {
    const loc = this.getLoc();
    this.consume(TokenType.THROW, "Expected 'throw'");
    const argument = this.parseExpression();
    this.consumeSemicolon();
    return new ThrowStatementNode(argument, loc);
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
    return new BlockStatementNode(body, loc);
  }

  parseExpressionStatement() {
    const loc = this.getLoc();
    const expr = this.parseExpression();
    this.consumeSemicolon();
    return new ExpressionStatementNode(expr, loc);
  }

  // --- PATTERN PARSING (for match, let, params) ---

  parsePattern() {
    const loc = this.getLoc();
    const curr = this.currentToken();

    // Wildcard _
    if (this.match(TokenType.UNDERSCORE)) {
      return new ASTNode(ASTNodeType.WILDCARD_PATTERN, loc);
    }

    // Literals
    if (curr.type === TokenType.NUMBER || curr.type === TokenType.STRING || curr.type === TokenType.BOOLEAN || curr.type === TokenType.NULL || curr.type === TokenType.UNDEFINED) {
      const lit = this.advance();
      // Check for range pattern 1..10
      if (this.match(TokenType.RANGE)) {
        const endLit = this.advance();
        return new RangeExpressionNode(
          new LiteralNode(lit.value, lit.raw, loc),
          new LiteralNode(endLit.value, endLit.raw, this.getLoc(endLit)),
          loc
        );
      }
      return new LiteralNode(lit.value, lit.raw, loc);
    }

    // Array pattern [a, b, ...rest]
    if (this.match(TokenType.LBRACKET)) {
      const elements = [];
      while (!this.check(TokenType.RBRACKET) && !this.isAtEnd()) {
        if (this.match(TokenType.SPREAD)) {
          const restLoc = this.getLoc();
          const restId = this.parseIdentifier();
          elements.push(new SpreadElementNode(restId, restLoc));
          break;
        }
        elements.push(this.parsePattern());
        if (!this.match(TokenType.COMMA)) break;
      }
      this.consume(TokenType.RBRACKET, "Expected ']' in array pattern");
      return new ArrayLiteralNode(elements, loc);
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
        properties.push(new ObjectPropertyNode(key, value, shorthand, false, propLoc));
        if (!this.match(TokenType.COMMA)) break;
      }
      this.consume(TokenType.RBRACE, "Expected '}' in object pattern");
      return new ObjectLiteralNode(properties, loc);
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
      return new MatchExpressionNode(discriminant, arms, loc);
    }

    // Literals
    if (token.type === TokenType.NUMBER || token.type === TokenType.STRING || token.type === TokenType.BOOLEAN || token.type === TokenType.NULL || token.type === TokenType.UNDEFINED) {
      this.advance();
      return new LiteralNode(token.value, token.raw, loc);
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
      return new FormattedStringLiteralNode(parts, loc);
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
      return new TemplateLiteralNode(parts, loc);
    }

    // Underscore placeholder
    if (token.type === TokenType.UNDERSCORE) {
      this.advance();
      return new PlaceholderExpressionNode(loc);
    }

    // Identifier or closure: x -> x * 2
    if (token.type === TokenType.IDENTIFIER) {
      const id = this.parseIdentifier();
      if (this.match(TokenType.THIN_ARROW)) {
        const isBlock = this.check(TokenType.LBRACE);
        const body = isBlock ? this.parseBlockStatement() : this.parseExpression();
        return new ClosureExpressionNode([id], body, false, !isBlock, loc);
      }
      return id;
    }

    // Unary Operators: ! - + typeof await new
    if (token.type === TokenType.NOT || token.type === TokenType.MINUS || token.type === TokenType.PLUS || token.type === TokenType.BIT_NOT || token.type === TokenType.TYPEOF) {
      const op = this.advance().raw;
      const argument = this.parseExpression(Precedence.PREFIX);
      return new UnaryExpressionNode(op, argument, true, loc);
    }

    if (token.type === TokenType.AWAIT) {
      this.advance();
      const argument = this.parseExpression(Precedence.PREFIX);
      return new AwaitExpressionNode(argument, loc);
    }

    if (token.type === TokenType.NEW) {
      this.advance();
      let callee = this.parsePrefix();
      while (this.check(TokenType.DOT) || this.check(TokenType.OPTIONAL_CHAIN) || this.check(TokenType.LBRACKET)) {
        callee = this.parseInfix(callee);
      }
      let args = [];
      if (this.match(TokenType.LPAREN)) {
        args = this.parseArguments();
        this.consume(TokenType.RPAREN, "Expected ')' after new arguments");
      }
      return new NewExpressionNode(callee, args, loc);
    }

    // Parenthesized expression or arrow function: (a, b) -> a + b
    if (token.type === TokenType.LPAREN) {
      this.advance();
      if (this.check(TokenType.RPAREN)) {
        this.advance(); // empty params ()
        if (this.match(TokenType.THIN_ARROW) || this.match(TokenType.FAT_ARROW)) {
          const isBlock = this.check(TokenType.LBRACE);
          const body = isBlock ? this.parseBlockStatement() : this.parseExpression();
          return new ClosureExpressionNode([], body, false, !isBlock, loc);
        }
        return new ArrayLiteralNode([], loc); // fallback
      }

      // Lookahead for parameters vs expression
      const exprs = [];
      do {
        if (this.match(TokenType.SPREAD)) {
          const spreadId = this.parseIdentifier();
          exprs.push(new SpreadElementNode(spreadId, spreadId.loc));
          break;
        }
        exprs.push(this.parseExpression());
      } while (this.match(TokenType.COMMA) && !this.check(TokenType.RPAREN));

      this.consume(TokenType.RPAREN, "Expected ')'");

      // Check if closure arrow follows: (a, b) -> a + b or (a, b) => { ... }
      if (this.match(TokenType.THIN_ARROW) || this.match(TokenType.FAT_ARROW)) {
        const isBlock = this.check(TokenType.LBRACE);
        const body = isBlock ? this.parseBlockStatement() : this.parseExpression();
        return new ClosureExpressionNode(exprs, body, false, !isBlock, loc);
      }

      // Regular single parenthesized expression
      if (exprs.length === 1 && !(exprs[0] instanceof SpreadElementNode)) {
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
          return new ClosureExpressionNode(params, body, true, !isBlock, loc);
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
          elements.push(new SpreadElementNode(arg, loc));
        } else {
          elements.push(this.parseExpression());
        }
        if (!this.match(TokenType.COMMA)) break;
      }
      this.consume(TokenType.RBRACKET, "Expected ']'");
      return new ArrayLiteralNode(elements, loc);
    }

    // Object literal: { key: value, shorthand }
    if (token.type === TokenType.LBRACE) {
      this.advance();
      const properties = [];
      while (!this.check(TokenType.RBRACE) && !this.isAtEnd()) {
        const propLoc = this.getLoc();
        if (this.match(TokenType.SPREAD)) {
          const arg = this.parseExpression();
          properties.push(new SpreadElementNode(arg, propLoc));
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
            key = new LiteralNode(lit.value, lit.raw, propLoc);
          } else {
            this.error("Expected property name in object literal", this.currentToken());
          }

          let value = key;
          let shorthand = false;
          if (this.match(TokenType.COLON)) {
            value = this.parseExpression();
          } else if (key instanceof IdentifierNode && !computed) {
            shorthand = true;
          } else {
            this.error("Expected ':' after object key", this.currentToken());
          }

          properties.push(new ObjectPropertyNode(key, value, shorthand, computed, propLoc));
        }
        if (!this.match(TokenType.COMMA)) break;
      }
      this.consume(TokenType.RBRACE, "Expected '}'");
      return new ObjectLiteralNode(properties, loc);
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
      return new CallExpressionNode(
        new MemberExpressionNode(new PlaceholderExpressionNode(loc), methodId, false, false, loc),
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
        right = new CallExpressionNode(
          new MemberExpressionNode(new PlaceholderExpressionNode(loc), methodId, false, false, loc),
          args,
          false,
          loc
        );
      } else {
        right = this.parseExpression(Precedence.PIPELINE);
      }
      return new PipelineExpressionNode(left, right, loc);
    }

    // Assignment operators: = += -= *= /= %=
    if (token.type === TokenType.EQUALS || token.type === TokenType.PLUS_EQUALS || token.type === TokenType.MINUS_EQUALS || token.type === TokenType.STAR_EQUALS || token.type === TokenType.SLASH_EQUALS || token.type === TokenType.PERCENT_EQUALS) {
      const op = this.advance().raw;
      const right = this.parseExpression(Precedence.ASSIGN - 1);
      return new AssignmentExpressionNode(op, left, right, loc);
    }

    // Ternary conditional expression: cond ? consequent : alternate
    if (token.type === TokenType.QUESTION) {
      this.advance();
      const consequent = this.parseExpression();
      this.consume(TokenType.COLON, "Expected ':' in ternary conditional expression");
      const alternate = this.parseExpression(Precedence.ASSIGN - 1);
      return new ConditionalExpressionNode(left, consequent, alternate, loc);
    }

    // Range operator: ..
    if (token.type === TokenType.RANGE) {
      this.advance();
      const right = this.parseExpression(Precedence.RANGE);
      return new RangeExpressionNode(left, right, loc);
    }

    // Binary Operators
    if (this.isBinaryOperator(token.type)) {
      const op = this.advance().raw;
      const prec = this.getPrecedenceFor(token.type);
      const right = this.parseExpression(prec);
      return new BinaryExpressionNode(op, left, right, loc);
    }

    // Member Access: left.prop or left?.prop
    if (token.type === TokenType.DOT || token.type === TokenType.OPTIONAL_CHAIN) {
      const isOptional = token.type === TokenType.OPTIONAL_CHAIN;
      this.advance();
      const prop = this.parsePropertyName();
      return new MemberExpressionNode(left, prop, false, isOptional, loc);
    }

    // Computed Member: left[prop]
    if (token.type === TokenType.LBRACKET) {
      this.advance();
      const prop = this.parseExpression();
      this.consume(TokenType.RBRACKET, "Expected ']'");
      return new MemberExpressionNode(left, prop, true, false, loc);
    }

    // Call Access: left(arg1, arg2)
    if (token.type === TokenType.LPAREN) {
      this.advance();
      const args = this.parseArguments();
      this.consume(TokenType.RPAREN, "Expected ')'");
      return new CallExpressionNode(left, args, false, loc);
    }

    // Tagged Template Expression: tag`...`
    if (token.type === TokenType.TEMPLATE_STRING) {
      const quasi = this.parsePrefix();
      return new TaggedTemplateExpressionNode(left, quasi, loc);
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
          args.push(new SpreadElementNode(arg, arg.loc));
        } else {
          args.push(this.parseExpression());
        }
      } while (this.match(TokenType.COMMA) && !this.check(TokenType.RPAREN));
    }
    return args;
  }

  parsePropertyName() {
    const token = this.currentToken();
    if (token.type === TokenType.IDENTIFIER || (typeof KEYWORDS !== 'undefined' && Object.values(KEYWORDS).includes(token.type))) {
      this.advance();
      return new IdentifierNode(token.value || token.raw, this.getLoc());
    }
    return this.parseIdentifier();
  }

  parseIdentifier() {
    const loc = this.getLoc();
    const token = this.consume(TokenType.IDENTIFIER, "Expected identifier");
    return new IdentifierNode(token.value, loc);
  }
}


  // --- CODE GENERATOR ---
/**
 * AduScript Compiler - Code Generator & Source Map Generator
 * Deliverable C: Emits clean, readable ECMAScript 2024+ from the AduScript 
 */



class CodeGenerator {
  constructor(options = {}) {
    this.options = Object.assign({
      moduleType: 'esm', // 'esm' | 'inline-runtime' | 'cjs'
      runtimePath: './runtime.js',
      includeSourceMap: false,
      sourceFileName: 'source.ads',
      indentSize: 2
    }, options);

    this.indentation = 0;
    this.output = [];
    this.neededRuntimeHelpers = new Set();
    this.hasState = false;
    this.hasWatch = false;
    this.hasEffect = false;
    this.hasMatch = false;
    this.hasRange = false;
  }

  static generate(ast, options = {}) {
    const codegen = new CodeGenerator(options);
    return codegen.generateProgram(ast);
  }

  indent() {
    return ' '.repeat(this.indentation * this.options.indentSize);
  }

  emit(str) {
    this.output.push(str);
  }

  emitLine(str = '') {
    this.output.push(this.indent() + str + '\n');
  }

  generateProgram(node) {
    this.output = [];
    
    // First pass: inspect node to see if runtime helpers are required
    this.inspectNodeForHelpers(node);

    // Header / Runtime Imports
    if (this.options.moduleType === 'inline-runtime') {
      // Inlined runtime helper definition for single standalone browser execution
      this.emitLine(`// --- AduScript Inlined Runtime ($adu) ---`);
      this.emitLine(this.getInlinedRuntimeCode());
      this.emitLine();
    } else if (this.options.moduleType === 'esm' && this.needsAduRuntime()) {
      this.emitLine(`import { $adu } from "${this.options.runtimePath}";`);
      this.emitLine();
    }

    // Emit all statements
    for (const stmt of node.body) {
      this.generateStatement(stmt);
    }

    const code = this.output.join('');
    return {
      code,
      map: this.options.includeSourceMap ? this.generateSourceMap(code) : null
    };
  }

  needsAduRuntime() {
    return this.hasState || this.hasWatch || this.hasEffect || this.hasMatch || this.hasRange;
  }

  inspectNodeForHelpers(node) {
    if (!node || typeof node !== 'object') return;
    switch (node.type) {
      case ASTNodeType.STATE_DECLARATION:
        this.hasState = true;
        break;
      case ASTNodeType.WATCH_STATEMENT:
        this.hasWatch = true;
        break;
      case ASTNodeType.EFFECT_STATEMENT:
        this.hasEffect = true;
        break;
      case ASTNodeType.MATCH_EXPRESSION:
      case ASTNodeType.MATCH_STATEMENT:
        this.hasMatch = true;
        break;
      case ASTNodeType.RANGE_EXPRESSION:
        this.hasRange = true;
        break;
      case ASTNodeType.FOR_STATEMENT:
        if (node.iterable && node.iterable.type === ASTNodeType.RANGE_EXPRESSION) {
          this.hasRange = true;
        }
        break;
    }
    for (const key of Object.keys(node)) {
      if (key === 'loc') continue;
      const child = node[key];
      if (Array.isArray(child)) {
        for (const c of child) this.inspectNodeForHelpers(c);
      } else if (child && typeof child === 'object') {
        this.inspectNodeForHelpers(child);
      }
    }
  }

  generateStatement(node) {
    if (!node) return;

    switch (node.type) {
      case ASTNodeType.VARIABLE_DECLARATION:
        this.generateVariableDeclaration(node);
        break;
      case ASTNodeType.STATE_DECLARATION:
        this.generateStateDeclaration(node);
        break;
      case ASTNodeType.FUNCTION_DECLARATION:
        this.generateFunctionDeclaration(node);
        break;
      case ASTNodeType.USE_DECLARATION:
        this.generateUseDeclaration(node);
        break;
      case ASTNodeType.IMPORT_DECLARATION:
        this.generateImportDeclaration(node);
        break;
      case ASTNodeType.EXPORT_DECLARATION:
        this.generateExportDeclaration(node);
        break;
      case ASTNodeType.IF_STATEMENT:
        this.generateIfStatement(node);
        break;
      case ASTNodeType.MATCH_STATEMENT:
        this.generateMatchStatement(node);
        break;
      case ASTNodeType.FOR_STATEMENT:
        this.generateForStatement(node);
        break;
      case ASTNodeType.WHILE_STATEMENT:
        this.generateWhileStatement(node);
        break;
      case ASTNodeType.RETURN_STATEMENT:
        this.generateReturnStatement(node);
        break;
      case ASTNodeType.WATCH_STATEMENT:
        this.generateWatchStatement(node);
        break;
      case ASTNodeType.EFFECT_STATEMENT:
        this.generateEffectStatement(node);
        break;
      case ASTNodeType.TRY_STATEMENT:
        this.generateTryStatement(node);
        break;
      case ASTNodeType.THROW_STATEMENT:
        this.emitLine(`throw ${this.generateExpression(node.argument)};`);
        break;
      case ASTNodeType.BREAK_STATEMENT:
        this.emitLine('break;');
        break;
      case ASTNodeType.CONTINUE_STATEMENT:
        this.emitLine('continue;');
        break;
      case ASTNodeType.BLOCK_STATEMENT:
        this.generateBlockStatement(node);
        break;
      case ASTNodeType.EXPRESSION_STATEMENT:
        this.emitLine(`${this.generateExpression(node.expression)};`);
        break;
      default:
        throw new Error(`Unsupported statement AST node: ${node.type}`);
    }
  }

  generateVariableDeclaration(node) {
    const jsKind = node.kind === 'let' ? 'const' : 'let';
    const pattern = this.generatePattern(node.pattern);
    if (node.init) {
      const init = this.generateExpression(node.init);
      this.emitLine(`${jsKind} ${pattern} = ${init};`);
    } else {
      this.emitLine(`${jsKind} ${pattern};`);
    }
  }

  generateStateDeclaration(node) {
    const id = node.id.name;
    const init = this.generateExpression(node.init);
    this.emitLine(`const ${id} = $adu.state(${init});`);
  }

  generateFunctionDeclaration(node) {
    const asyncPrefix = node.isAsync ? 'async ' : '';
    const name = node.id.name;
    const params = node.params.map(p => this.generatePattern(p)).join(', ');

    if (node.isExpressionBody) {
      const bodyExpr = this.generateExpression(node.body);
      this.emitLine(`${asyncPrefix}function ${name}(${params}) {`);
      this.indentation++;
      this.emitLine(`return ${bodyExpr};`);
      this.indentation--;
      this.emitLine(`}`);
    } else {
      this.emitLine(`${asyncPrefix}function ${name}(${params}) {`);
      this.indentation++;
      if (node.body && node.body.body) {
        for (const stmt of node.body.body) {
          this.generateStatement(stmt);
        }
      }
      this.indentation--;
      this.emitLine(`}`);
    }
  }

  generateUseDeclaration(node) {
    const url = resolveCDN(node.source);
    if (node.alias) {
      // use cdn:three as THREE -> import * as THREE from "..."
      this.emitLine(`import * as ${node.alias} from "${url}";`);
    } else if (node.specifiers && node.specifiers.length > 0) {
      // use cdn:three { Scene, Camera } -> import { Scene, Camera } from "..."
      const specs = node.specifiers.map(s => s.local !== s.imported ? `${s.imported} as ${s.local}` : s.imported).join(', ');
      this.emitLine(`import { ${specs} } from "${url}";`);
    } else {
      // Bare use "https://..."
      this.emitLine(`import "${url}";`);
    }
  }

  generateImportDeclaration(node) {
    let source = node.source;
    if (this.options.rewriteAdsImports && source.endsWith('.ads')) {
      source = source.replace(/\.ads$/, '.js');
    }

    if (source.endsWith('.css') && this.options.moduleType === 'inline-runtime') {
      this.emitLine(`if (typeof document !== 'undefined') { const _l = document.createElement('link'); _l.rel = 'stylesheet'; _l.href = "${source}"; document.head.appendChild(_l); }`);
      return;
    }

    let parts = [];
    if (node.defaultImport) {
      parts.push(node.defaultImport);
    }
    if (node.specifiers && node.specifiers.length > 0) {
      const specs = node.specifiers.map(s => s.local !== s.imported ? `${s.imported} as ${s.local}` : s.imported).join(', ');
      parts.push(`{ ${specs} }`);
    }
    if (parts.length > 0) {
      this.emitLine(`import ${parts.join(', ')} from "${source}";`);
    } else {
      this.emitLine(`import "${source}";`);
    }
  }

  generateExportDeclaration(node) {
    if (node.isDefault) {
      this.emitLine(`export default ${this.generateExpression(node.declaration)};`);
    } else if (node.declaration) {
      this.emit(`${this.indent()}export `);
      // Strip indentation for inline declaration
      const prevIndent = this.indentation;
      this.indentation = 0;
      if (node.declaration.type === ASTNodeType.VARIABLE_DECLARATION) {
        const jsKind = node.declaration.kind === 'let' ? 'const' : 'let';
        const pattern = this.generatePattern(node.declaration.pattern);
        const init = node.declaration.init ? ` = ${this.generateExpression(node.declaration.init)}` : '';
        this.emit(`${jsKind} ${pattern}${init};\n`);
      } else if (node.declaration.type === ASTNodeType.FUNCTION_DECLARATION) {
        const asyncPrefix = node.declaration.isAsync ? 'async ' : '';
        const name = node.declaration.id.name;
        const params = node.declaration.params.map(p => this.generatePattern(p)).join(', ');
        this.emit(`${asyncPrefix}function ${name}(${params}) `);
        this.indentation = prevIndent;
        if (node.declaration.isExpressionBody) {
          this.emit(`{\n`);
          this.indentation++;
          this.emitLine(`return ${this.generateExpression(node.declaration.body)};`);
          this.indentation--;
          this.emitLine(`}`);
        } else {
          this.emit(`{\n`);
          this.indentation++;
          for (const stmt of node.declaration.body.body) {
            this.generateStatement(stmt);
          }
          this.indentation--;
          this.emitLine(`}`);
        }
      } else if (node.declaration.type === ASTNodeType.CLASS_DECLARATION) {
        this.indentation = prevIndent;
        this.generateClassDeclaration(node.declaration);
      } else if (node.declaration.type === ASTNodeType.STATE_DECLARATION) {
        this.indentation = prevIndent;
        this.generateStateDeclaration(node.declaration);
      }
      this.indentation = prevIndent;
    } else if (node.specifiers && node.specifiers.length > 0) {
      const specs = node.specifiers.map(s => s.local !== s.exported ? `${s.local} as ${s.exported}` : s.local).join(', ');
      this.emitLine(`export { ${specs} };`);
    }
  }

  generateIfStatement(node) {
    const test = this.generateExpression(node.test);
    this.emitLine(`if (${test}) {`);
    this.indentation++;
    if (node.consequent.type === ASTNodeType.BLOCK_STATEMENT) {
      for (const stmt of node.consequent.body) this.generateStatement(stmt);
    } else {
      this.generateStatement(node.consequent);
    }
    this.indentation--;

    if (node.alternate) {
      if (node.alternate.type === ASTNodeType.IF_STATEMENT) {
        this.emit(`${this.indent()}} else `);
        // Clean else-if
        this.output.pop(); // remove extra newline
        this.output.push('} else ');
        this.generateIfStatement(node.alternate);
        return;
      } else {
        this.emitLine(`} else {`);
        this.indentation++;
        if (node.alternate.type === ASTNodeType.BLOCK_STATEMENT) {
          for (const stmt of node.alternate.body) this.generateStatement(stmt);
        } else {
          this.generateStatement(node.alternate);
        }
        this.indentation--;
      }
    }
    this.emitLine(`}`);
  }

  generateMatchStatement(node) {
    const expr = this.generateMatchExpression(node);
    this.emitLine(`${expr};`);
  }

  generateForStatement(node) {
    const variable = this.generatePattern(node.variable);
    const kind = node.kind === 'mut' ? 'let' : 'const';

    // Check if range: for i in 0..10
    if (node.iterable.type === ASTNodeType.RANGE_EXPRESSION) {
      const start = this.generateExpression(node.iterable.start);
      const end = this.generateExpression(node.iterable.end);
      this.emitLine(`for (${kind} ${variable} of $adu.range(${start}, ${end})) {`);
    } else {
      const iterable = this.generateExpression(node.iterable);
      this.emitLine(`for (${kind} ${variable} of ${iterable}) {`);
    }

    this.indentation++;
    if (node.body.type === ASTNodeType.BLOCK_STATEMENT) {
      for (const stmt of node.body.body) this.generateStatement(stmt);
    } else {
      this.generateStatement(node.body);
    }
    this.indentation--;
    this.emitLine(`}`);
  }

  generateWhileStatement(node) {
    const test = this.generateExpression(node.test);
    this.emitLine(`while (${test}) {`);
    this.indentation++;
    if (node.body.type === ASTNodeType.BLOCK_STATEMENT) {
      for (const stmt of node.body.body) this.generateStatement(stmt);
    } else {
      this.generateStatement(node.body);
    }
    this.indentation--;
    this.emitLine(`}`);
  }

  generateReturnStatement(node) {
    if (node.argument) {
      this.emitLine(`return ${this.generateExpression(node.argument)};`);
    } else {
      this.emitLine(`return;`);
    }
  }

  generateWatchStatement(node) {
    const target = this.generateExpression(node.target);
    if (node.handler.type === ASTNodeType.BLOCK_STATEMENT) {
      this.emitLine(`$adu.watch(${target}, () => {`);
      this.indentation++;
      for (const stmt of node.handler.body) this.generateStatement(stmt);
      this.indentation--;
      this.emitLine(`});`);
    } else {
      const handlerExpr = this.generateExpression(node.handler);
      this.emitLine(`$adu.watch(${target}, ${handlerExpr});`);
    }
  }

  generateEffectStatement(node) {
    this.emitLine(`$adu.effect(() => {`);
    this.indentation++;
    if (node.body && node.body.body) {
      for (const stmt of node.body.body) this.generateStatement(stmt);
    }
    this.indentation--;
    this.emitLine(`});`);
  }

  generateTryStatement(node) {
    this.emitLine(`try {`);
    this.indentation++;
    for (const stmt of node.block.body) this.generateStatement(stmt);
    this.indentation--;

    if (node.handlerBody) {
      const param = node.handlerParam ? this.generatePattern(node.handlerParam) : 'error';
      this.emitLine(`} catch (${param}) {`);
      this.indentation++;
      for (const stmt of node.handlerBody.body) this.generateStatement(stmt);
      this.indentation--;
    }

    if (node.finalizer) {
      this.emitLine(`} finally {`);
      this.indentation++;
      for (const stmt of node.finalizer.body) this.generateStatement(stmt);
      this.indentation--;
    }

    this.emitLine(`}`);
  }

  generateBlockStatement(node) {
    this.emitLine(`{`);
    this.indentation++;
    for (const stmt of node.body) this.generateStatement(stmt);
    this.indentation--;
    this.emitLine(`}`);
  }

  // --- PATTERNS ---

  generatePattern(node) {
    if (!node) return '';
    switch (node.type) {
      case ASTNodeType.IDENTIFIER:
        return node.name;
      case ASTNodeType.WILDCARD_PATTERN:
        return '_';
      case ASTNodeType.LITERAL:
        return typeof node.value === 'string' ? JSON.stringify(node.value) : String(node.value);
      case ASTNodeType.ARRAY_LITERAL:
        return `[${node.elements.map(e => this.generatePattern(e)).join(', ')}]`;
      case ASTNodeType.OBJECT_LITERAL:
        return `{ ${node.properties.map(p => {
          if (p.type === ASTNodeType.SPREAD_ELEMENT) return `...${this.generatePattern(p.argument)}`;
          return p.shorthand ? p.key.name : `${p.key.name}: ${this.generatePattern(p.value)}`;
        }).join(', ')} }`;
      case ASTNodeType.SPREAD_ELEMENT:
        return `...${this.generatePattern(node.argument)}`;
      case ASTNodeType.ASSIGNMENT_EXPRESSION:
        return `${this.generatePattern(node.left)} = ${this.generateExpression(node.right)}`;
      default:
        return this.generateExpression(node);
    }
  }

  // --- EXPRESSIONS ---

  generateExpression(node) {
    if (!node) return '';

    switch (node.type) {
      case ASTNodeType.IDENTIFIER:
        return node.name;

      case ASTNodeType.LITERAL:
        if (node.value === null) return 'null';
        if (node.value === undefined) return 'undefined';
        if (typeof node.value === 'string') return JSON.stringify(node.value);
        return String(node.value);

      case ASTNodeType.FORMATTED_STRING_LITERAL:
        return this.generateFormattedString(node);

      case ASTNodeType.TAGGED_TEMPLATE_EXPRESSION:
        return `${this.generateExpression(node.tag)}${this.generateExpression(node.quasi)}`;

      case ASTNodeType.TEMPLATE_LITERAL:
        return this.generateTemplateLiteral(node);

      case ASTNodeType.PLACEHOLDER_EXPRESSION:
        return '_';

      case ASTNodeType.BINARY_EXPRESSION:
        return `(${this.generateExpression(node.left)} ${node.operator} ${this.generateExpression(node.right)})`;

      case ASTNodeType.CONDITIONAL_EXPRESSION:
        return `(${this.generateExpression(node.test)} ? ${this.generateExpression(node.consequent)} : ${this.generateExpression(node.alternate)})`;

      case ASTNodeType.UNARY_EXPRESSION:
        return `${node.operator === 'typeof' ? 'typeof ' : node.operator}${this.generateExpression(node.argument)}`;

      case ASTNodeType.AWAIT_EXPRESSION:
        return `await ${this.generateExpression(node.argument)}`;

      case ASTNodeType.RANGE_EXPRESSION:
        return `$adu.range(${this.generateExpression(node.start)}, ${this.generateExpression(node.end)})`;

      case ASTNodeType.PIPELINE_EXPRESSION:
        return this.generatePipelineExpression(node);

      case ASTNodeType.MATCH_EXPRESSION:
        return this.generateMatchExpression(node);

      case ASTNodeType.CALL_EXPRESSION:
        return this.generateCallExpression(node);

      case ASTNodeType.MEMBER_EXPRESSION:
        if (node.computed) {
          return `${this.generateExpression(node.object)}[${this.generateExpression(node.property)}]`;
        }
        return `${this.generateExpression(node.object)}${node.optional ? '?.' : '.'}${node.property.name}`;

      case ASTNodeType.ASSIGNMENT_EXPRESSION:
        return `${this.generatePattern(node.left)} ${node.operator} ${this.generateExpression(node.right)}`;

      case ASTNodeType.CLOSURE_EXPRESSION:
        return this.generateClosureExpression(node);

      case ASTNodeType.ARRAY_LITERAL:
        return `[${node.elements.map(e => this.generateExpression(e)).join(', ')}]`;

      case ASTNodeType.OBJECT_LITERAL:
        return this.generateObjectLiteral(node);

      case ASTNodeType.SPREAD_ELEMENT:
        return `...${this.generateExpression(node.argument)}`;

      case ASTNodeType.NEW_EXPRESSION:
        const newArgs = node.arguments.map(a => this.generateExpression(a)).join(', ');
        return `new ${this.generateExpression(node.callee)}(${newArgs})`;

      default:
        throw new Error(`Unsupported expression AST node: ${node.type}`);
    }
  }

  generateFormattedString(node) {
    let result = '`';
    for (const part of node.parts) {
      if (part.type === 'string') {
        result += part.value.replace(/`/g, '\\`').replace(/\${/g, '\\${');
      } else if (part.type === 'expression') {
        const expr = part.exprNode ? this.generateExpression(part.exprNode) : part.value;
        result += `\${${expr}}`;
      }
    }
    result += '`';
    return result;
  }

  generateTemplateLiteral(node) {
    let result = '`';
    for (const part of node.parts) {
      if (part.type === 'string') {
        result += part.value.replace(/`/g, '\\`').replace(/\${/g, '\\${');
      } else if (part.type === 'expression') {
        const expr = part.exprNode ? this.generateExpression(part.exprNode) : part.value;
        result += `\${${expr}}`;
      }
    }
    result += '`';
    return result;
  }

  generatePipelineExpression(node) {
    const leftExpr = this.generateExpression(node.left);

    // Case 1: Right is a method shorthand .trim() -> left.trim()
    if (node.right.type === ASTNodeType.CALL_EXPRESSION && node.right.callee.type === ASTNodeType.MEMBER_EXPRESSION && node.right.callee.object.type === ASTNodeType.PLACEHOLDER_EXPRESSION) {
      const methodName = node.right.callee.property.name;
      const args = node.right.arguments.map(a => this.generateExpression(a)).join(', ');
      return `${leftExpr}.${methodName}(${args})`;
    }

    // Case 2: Right is a CallExpression
    if (node.right.type === ASTNodeType.CALL_EXPRESSION) {
      const callee = this.generateExpression(node.right.callee);
      
      // Check if placeholder `_` exists among arguments
      let hasPlaceholder = false;
      const mappedArgs = node.right.arguments.map(arg => {
        if (arg.type === ASTNodeType.PLACEHOLDER_EXPRESSION) {
          hasPlaceholder = true;
          return leftExpr;
        }
        return this.generateExpression(arg);
      });

      if (hasPlaceholder) {
        return `${callee}(${mappedArgs.join(', ')})`;
      } else {
        // Implicit first argument: x |> f(y) -> f(x, y)
        mappedArgs.unshift(leftExpr);
        return `${callee}(${mappedArgs.join(', ')})`;
      }
    }

    // Case 3: Right is a simple Identifier or function reference: x |> f -> f(x)
    const rightExpr = this.generateExpression(node.right);
    return `${rightExpr}(${leftExpr})`;
  }

  generateMatchExpression(node) {
    const target = this.generateExpression(node.discriminant);
    const armObjects = node.arms.map(arm => {
      const testCode = this.generatePatternMatcher(arm.pattern);
      const bindingStr = this.generatePatternBinding(arm.pattern);
      const patternBinding = bindingStr ? `const ${bindingStr} = val; ` : '';

      const guardCode = arm.guard ? `(val) => { try { ${patternBinding}return ${this.generateExpression(arm.guard)}; } catch (_) { return false; } }` : 'null';

      let bodyCode;
      if (arm.body.type === ASTNodeType.BLOCK_STATEMENT) {
        const bodyStmts = arm.body.body.map(s => {
          const cg = new CodeGenerator(this.options);
          cg.generateStatement(s);
          return cg.output.join('');
        }).join('');
        bodyCode = `(val) => {\n${patternBinding ? '  ' + patternBinding + '\n' : ''}${bodyStmts}}`;
      } else {
        if (bindingStr) {
          bodyCode = `(val) => { ${patternBinding}return (${this.generateExpression(arm.body)}); }`;
        } else {
          bodyCode = `(val) => (${this.generateExpression(arm.body)})`;
        }
      }

      return `{ test: ${testCode}, guard: ${guardCode}, body: ${bodyCode} }`;
    });

    return `$adu.match(${target}, [\n  ${armObjects.join(',\n  ')}\n])`;
  }

  generatePatternBinding(pattern) {
    if (!pattern) return '';
    if (pattern.type === ASTNodeType.IDENTIFIER && pattern.name !== '_') {
      return pattern.name;
    }
    if (pattern.type === ASTNodeType.OBJECT_LITERAL) {
      const validProps = [];
      for (const p of pattern.properties) {
        if (p.type === ASTNodeType.SPREAD_ELEMENT) {
          const inner = this.generatePatternBinding(p.argument);
          if (inner) validProps.push(`...${inner}`);
        } else if (p.value.type === ASTNodeType.IDENTIFIER && p.value.name !== '_') {
          const key = p.key.name || p.key.value;
          validProps.push(p.shorthand ? key : `${key}: ${p.value.name}`);
        } else if (p.value.type === ASTNodeType.OBJECT_LITERAL || p.value.type === ASTNodeType.ARRAY_LITERAL) {
          const inner = this.generatePatternBinding(p.value);
          if (inner) {
            const key = p.key.name || p.key.value;
            validProps.push(`${key}: ${inner}`);
          }
        }
      }
      return validProps.length > 0 ? `{ ${validProps.join(', ')} }` : '';
    }
    if (pattern.type === ASTNodeType.ARRAY_LITERAL) {
      const validElems = [];
      let hasBindings = false;
      for (const el of pattern.elements) {
        if (el.type === ASTNodeType.SPREAD_ELEMENT) {
          const inner = this.generatePatternBinding(el.argument);
          if (inner) { validElems.push(`...${inner}`); hasBindings = true; }
        } else if (el.type === ASTNodeType.IDENTIFIER && el.name !== '_') {
          validElems.push(el.name);
          hasBindings = true;
        } else {
          validElems.push('_');
        }
      }
      return hasBindings ? `[${validElems.join(', ')}]` : '';
    }
    return '';
  }

  generatePatternMatcher(pattern) {
    if (!pattern) return '$adu.matchWildcard()';

    if (pattern.type === ASTNodeType.WILDCARD_PATTERN) {
      return '$adu.matchWildcard()';
    }
    if (pattern.type === ASTNodeType.LITERAL) {
      return `$adu.matchLiteral(${pattern.raw || JSON.stringify(pattern.value)})`;
    }
    if (pattern.type === ASTNodeType.RANGE_EXPRESSION) {
      const start = this.generateExpression(pattern.start);
      const end = this.generateExpression(pattern.end);
      return `$adu.matchRange(${start}, ${end})`;
    }
    if (pattern.type === ASTNodeType.OBJECT_LITERAL) {
      const schemaEntries = pattern.properties.map(p => {
        const key = p.key.name || p.key.value;
        const valMatcher = this.generatePatternMatcher(p.value);
        return `"${key}": ${valMatcher}`;
      });
      return `$adu.matchObject({ ${schemaEntries.join(', ')} })`;
    }
    if (pattern.type === ASTNodeType.ARRAY_LITERAL) {
      let hasRest = false;
      const elemMatchers = [];
      for (const el of pattern.elements) {
        if (el.type === ASTNodeType.SPREAD_ELEMENT) {
          hasRest = true;
          break;
        }
        elemMatchers.push(this.generatePatternMatcher(el));
      }
      return `$adu.matchArray([${elemMatchers.join(', ')}], ${hasRest})`;
    }
    if (pattern.type === ASTNodeType.IDENTIFIER) {
      // Bind pattern: matches anything, passes to body
      return '$adu.matchWildcard()';
    }

    return '$adu.matchWildcard()';
  }

  generateCallExpression(node) {
    const callee = this.generateExpression(node.callee);
    const args = node.arguments.map(a => this.generateExpression(a)).join(', ');
    return `${callee}${node.optional ? '?.' : ''}(${args})`;
  }

  generateClosureExpression(node) {
    const asyncPrefix = node.isAsync ? 'async ' : '';
    const params = node.params.map(p => this.generatePattern(p)).join(', ');

    if (node.isExpressionBody && node.body.type !== ASTNodeType.BLOCK_STATEMENT) {
      return `(${asyncPrefix}(${params}) => ${this.generateExpression(node.body)})`;
    } else {
      const cg = new CodeGenerator(this.options);
      cg.indentation = 1;
      const stmts = node.body.type === ASTNodeType.BLOCK_STATEMENT ? node.body.body : [node.body];
      for (const stmt of stmts) {
        cg.generateStatement(stmt);
      }
      return `(${asyncPrefix}(${params}) => {\n${cg.output.join('')}})`;
    }
  }

  generateObjectLiteral(node) {
    const props = node.properties.map(p => {
      if (p.type === ASTNodeType.SPREAD_ELEMENT) {
        return `...${this.generateExpression(p.argument)}`;
      }
      const keyStr = p.computed ? `[${this.generateExpression(p.key)}]` : (p.key.name || JSON.stringify(p.key.value));
      if (p.shorthand) return keyStr;
      return `${keyStr}: ${this.generateExpression(p.value)}`;
    });
    return `{ ${props.join(', ')} }`;
  }

  generateSourceMap(code) {
    return {
      version: 3,
      file: this.options.sourceFileName.replace(/\.ads$/, '.js'),
      sources: [this.options.sourceFileName],
      mappings: '', // Basic v3 source map container
      sourcesContent: []
    };
  }

  getInlinedRuntimeCode() {
    return `const $adu = (typeof globalThis !== 'undefined' && globalThis.$adu) ? globalThis.$adu : (() => {
  let activeEffect = null;
  class Signal {
    constructor(init) { this._subs = new Set(); this._val = this._wrap(init); }
    _wrap(v) {
      if (v !== null && typeof v === 'object' && !v.__isProxy) {
        const s = this;
        return new Proxy(v, {
          get(t, p, r) { if (p === '__isProxy') return true; s._track(); const res = Reflect.get(t, p, r); return (typeof res === 'object' && res !== null) ? s._wrap(res) : res; },
          set(t, p, nv, r) { const old = Reflect.get(t, p, r); const ok = Reflect.set(t, p, nv, r); if (old !== nv) s._notify(); return ok; }
        });
      }
      return v;
    }
    _track() { if (activeEffect) this._subs.add(activeEffect); }
    _notify() { Array.from(this._subs).forEach(fn => { try { fn(); } catch (e) { console.error('[AduScript Reactive Error]', e); } }); }
    get value() { this._track(); return this._val; }
    set value(nv) { if (this._val !== nv) { this._val = this._wrap(nv); this._notify(); } }
    toString() { return String(this.value); }
    valueOf() { return this.value; }
  }
  const LOGO_SVG = \`<svg viewBox="0 0 800 800" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="800" height="800" rx="40" fill="#C0004D"/><path d="M352.688 735H310.5L358.031 591H411.469L459 735H416.813L385.313 630.656H384.188L352.688 735ZM344.813 678.188H424.125V707.437H344.813V678.188ZM528.275 735H472.869V591H527.713C542.525 591 555.322 593.883 566.104 599.648C576.932 605.367 585.275 613.617 591.135 624.398C597.041 635.133 599.994 648 599.994 663C599.994 678 597.064 690.891 591.205 701.672C585.346 712.406 577.049 720.656 566.314 726.422C555.58 732.141 542.9 735 528.275 735ZM511.963 701.812H526.869C533.994 701.812 540.064 700.664 545.08 698.367C550.143 696.07 553.986 692.109 556.611 686.484C559.283 680.859 560.619 673.031 560.619 663C560.619 652.969 559.26 645.141 556.541 639.516C553.869 633.891 549.932 629.93 544.729 627.633C539.572 625.336 533.244 624.187 525.744 624.187H511.963V701.812ZM695.707 636C695.332 631.312 693.574 627.656 690.434 625.031C687.34 622.406 682.629 621.094 676.301 621.094C672.27 621.094 668.965 621.586 666.387 622.57C663.855 623.508 661.98 624.797 660.762 626.437C659.543 628.078 658.91 629.953 658.863 632.062C658.77 633.797 659.074 635.367 659.777 636.773C660.527 638.133 661.699 639.375 663.293 640.5C664.887 641.578 666.926 642.562 669.41 643.453C671.895 644.344 674.848 645.141 678.27 645.844L690.082 648.375C698.051 650.062 704.871 652.289 710.543 655.055C716.215 657.82 720.855 661.078 724.465 664.828C728.074 668.531 730.723 672.703 732.41 677.344C734.145 681.984 735.035 687.047 735.082 692.531C735.035 702 732.668 710.016 727.98 716.578C723.293 723.141 716.59 728.133 707.871 731.555C699.199 734.977 688.77 736.688 676.582 736.688C664.066 736.688 653.145 734.836 643.816 731.133C634.535 727.43 627.316 721.734 622.16 714.047C617.051 706.312 614.473 696.422 614.426 684.375H651.551C651.785 688.781 652.887 692.484 654.855 695.484C656.824 698.484 659.59 700.758 663.152 702.305C666.762 703.852 671.051 704.625 676.02 704.625C680.191 704.625 683.684 704.109 686.496 703.078C689.309 702.047 691.441 700.617 692.895 698.789C694.348 696.961 695.098 694.875 695.145 692.531C695.098 690.328 694.371 688.406 692.965 686.766C691.605 685.078 689.355 683.578 686.215 682.266C683.074 680.906 678.832 679.641 673.488 678.469L659.145 675.375C646.395 672.609 636.34 667.992 628.98 661.523C621.668 655.008 618.035 646.125 618.082 634.875C618.035 625.734 620.473 617.742 625.395 610.898C630.363 604.008 637.23 598.641 645.996 594.797C654.809 590.953 664.91 589.031 676.301 589.031C687.926 589.031 697.98 590.977 706.465 594.867C714.949 598.758 721.488 604.242 726.082 611.32C730.723 618.352 733.066 626.578 733.113 636H695.707Z" fill="white"/><path d="M418 0L0 447V532.254L498.5 0H418Z" fill="#C7004F"/></svg>\`;
  function effect(fn) {
    const r = () => { const prev = activeEffect; activeEffect = r; try { fn(); } finally { activeEffect = prev; } };
    r();
    return r;
  }
  function mount(container, renderFn) {
    const el = typeof container === 'string' ? document.querySelector(container) : container;
    if (!el) return;
    const effectFn = () => {
      const rendered = renderFn();
      if (typeof rendered === 'string') el.innerHTML = rendered;
      else if (rendered instanceof Node) { el.innerHTML = ''; el.appendChild(rendered); }
    };
    effect(effectFn);
  }
  function html(strings, ...values) {
    let raw = '';
    const events = [];
    const slots = [];
    strings.forEach((str, i) => {
      raw += str;
      if (i < values.length) {
        const val = values[i];
        if (typeof val === 'function') {
          const id = '__adu_evt_' + Math.random().toString(36).slice(2, 9);
          events.push({ id, fn: val });
          raw += '"' + id + '"';
        } else if (val && (val instanceof Node || (Array.isArray(val) && val.some(x => x instanceof Node)))) {
          const slotId = '__adu_slot_' + Math.random().toString(36).slice(2, 9);
          slots.push({ id: slotId, node: val });
          raw += '<span data-adu-slot="' + slotId + '"></span>';
        } else if (val && typeof val === 'object' && val.value !== undefined) {
          const sVal = val.value;
          if (sVal && (sVal instanceof Node || (Array.isArray(sVal) && sVal.some(x => x instanceof Node)))) {
            const slotId = '__adu_slot_' + Math.random().toString(36).slice(2, 9);
            slots.push({ id: slotId, node: sVal });
            raw += '<span data-adu-slot="' + slotId + '"></span>';
          } else {
            raw += sVal !== undefined && sVal !== null ? sVal : '';
          }
        } else if (Array.isArray(val)) {
          raw += val.map(item => (item && item.value !== undefined ? item.value : (item !== undefined && item !== null ? item : ''))).join('');
        } else {
          raw += (val === undefined || val === null) ? '' : String(val);
        }
      }
    });
    if (typeof document === 'undefined') return raw;
    const template = document.createElement('template');
    template.innerHTML = raw.trim();
    const fragment = template.content;
    for (const { id, node } of slots) {
      const slotEl = fragment.querySelector('[data-adu-slot="' + id + '"]');
      if (slotEl) {
        if (Array.isArray(node)) {
          const nodesToInsert = [];
          for (const item of node) {
            if (item instanceof Node) nodesToInsert.push(item);
            else if (item !== undefined && item !== null) nodesToInsert.push(document.createTextNode(String(item)));
          }
          slotEl.replaceWith(...nodesToInsert);
        } else if (node instanceof Node) {
          slotEl.replaceWith(node);
        }
      }
    }
    for (const { id, fn } of events) {
      const allMatching = fragment.querySelectorAll('*');
      for (const el of allMatching) {
        for (const attr of el.getAttributeNames()) {
          if (el.getAttribute(attr) === id) {
            el.removeAttribute(attr);
            const eventName = attr.startsWith('on') ? attr.slice(2).toLowerCase() : attr.toLowerCase();
            el.addEventListener(eventName, fn);
          }
        }
      }
    }
    return fragment.childElementCount === 1 ? fragment.firstElementChild : fragment;
  }
  function css(strings, ...values) {
    if (typeof document === 'undefined') return;
    let cssText = '';
    strings.forEach((str, i) => { cssText += str + (values[i] || ''); });
    const style = document.createElement('style');
    style.textContent = cssText;
    document.head.appendChild(style);
  }
  function logo(size = 32, className = 'adu-logo') {
    return LOGO_SVG.replace('<svg ', '<svg class="' + className + '" width="' + size + '" height="' + size + '" ');
  }
  return {
    state: (v) => new Signal(v),
    watch: (s, cb) => { if (s instanceof Signal) { let old = s.value; const w = () => { const cur = s.value; if (cur !== old) { const p = old; old = cur; cb(cur, p); } }; s._subs.add(w); return () => s._subs.delete(w); } },
    effect, mount, html, css, logo, LOGO_SVG,
    match: (val, arms) => { for (const a of arms) { if (a.test(val)) { if (!a.guard || a.guard(val)) return a.body(val); } } throw new Error('[AduScript Pattern Match Error] No match for ' + JSON.stringify(val)); },
    matchLiteral: (exp) => (v) => v === exp,
    matchRange: (s, e) => (v) => typeof v === 'number' && v >= s && v <= e,
    matchWildcard: () => () => true,
    matchObject: (sch) => (v) => { if (v === null || typeof v !== 'object') return false; for (const [k, exp] of Object.entries(sch)) { if (!(k in v)) return false; if (typeof exp === 'function' ? !exp(v[k]) : v[k] !== exp) return false; } return true; },
    matchArray: (elems, hasRest) => (v) => { if (!Array.isArray(v)) return false; if (!hasRest && v.length !== elems.length) return false; if (hasRest && v.length < elems.length) return false; for (let i = 0; i < elems.length; i++) { if (typeof elems[i] === 'function' ? !elems[i](v[i]) : v[i] !== elems[i]) return false; } return true; },
    pipe: (init, ...fns) => fns.reduce((acc, f) => typeof f === 'function' ? f(acc) : f, init),
    range: (s, e) => { const res = []; if (s <= e) { for (let i = s; i <= e; i++) res.push(i); } else { for (let i = s; i >= e; i--) res.push(i); } return res; }
  };
})();`;
  }
}


  // --- IN-BROWSER RUNNER & MODULE RESOLVER ---
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


})(typeof window !== 'undefined' ? window : globalThis);
