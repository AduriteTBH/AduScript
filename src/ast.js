/**
 * AduScript Compiler - Abstract Syntax Tree (AST) Definitions & Utilities
 */

export const ASTNodeType = {
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

export class ASTNode {
  constructor(type, loc = { line: 1, column: 1 }) {
    this.type = type;
    this.loc = loc;
  }
}

export class ProgramNode extends ASTNode {
  constructor(body, loc) {
    super(ASTNodeType.PROGRAM, loc);
    this.body = body || [];
  }
}

export class VariableDeclarationNode extends ASTNode {
  constructor(kind, pattern, init, loc) {
    super(ASTNodeType.VARIABLE_DECLARATION, loc);
    this.kind = kind; // 'let' | 'mut'
    this.pattern = pattern;
    this.init = init;
  }
}

export class StateDeclarationNode extends ASTNode {
  constructor(id, init, loc) {
    super(ASTNodeType.STATE_DECLARATION, loc);
    this.id = id;
    this.init = init;
  }
}

export class FunctionDeclarationNode extends ASTNode {
  constructor(id, params, body, isAsync = false, isExpressionBody = false, loc) {
    super(ASTNodeType.FUNCTION_DECLARATION, loc);
    this.id = id;
    this.params = params || [];
    this.body = body;
    this.isAsync = isAsync;
    this.isExpressionBody = isExpressionBody;
  }
}

export class UseDeclarationNode extends ASTNode {
  constructor(source, isCDN, alias = null, specifiers = [], loc) {
    super(ASTNodeType.USE_DECLARATION, loc);
    this.source = source;
    this.isCDN = isCDN;
    this.alias = alias;
    this.specifiers = specifiers;
  }
}

export class ImportDeclarationNode extends ASTNode {
  constructor(source, defaultImport = null, specifiers = [], loc) {
    super(ASTNodeType.IMPORT_DECLARATION, loc);
    this.source = source;
    this.defaultImport = defaultImport;
    this.specifiers = specifiers;
  }
}

export class ExportDeclarationNode extends ASTNode {
  constructor(declaration, isDefault = false, specifiers = [], loc) {
    super(ASTNodeType.EXPORT_DECLARATION, loc);
    this.declaration = declaration;
    this.isDefault = isDefault;
    this.specifiers = specifiers;
  }
}

export class IfStatementNode extends ASTNode {
  constructor(test, consequent, alternate = null, loc) {
    super(ASTNodeType.IF_STATEMENT, loc);
    this.test = test;
    this.consequent = consequent;
    this.alternate = alternate;
  }
}

export class MatchStatementNode extends ASTNode {
  constructor(discriminant, arms, loc) {
    super(ASTNodeType.MATCH_STATEMENT, loc);
    this.discriminant = discriminant;
    this.arms = arms || [];
  }
}

export class MatchExpressionNode extends ASTNode {
  constructor(discriminant, arms, loc) {
    super(ASTNodeType.MATCH_EXPRESSION, loc);
    this.discriminant = discriminant;
    this.arms = arms || [];
  }
}

export class MatchArmNode extends ASTNode {
  constructor(pattern, guard, body, loc) {
    super(ASTNodeType.MATCH_ARM, loc);
    this.pattern = pattern;
    this.guard = guard; // null or expression
    this.body = body;
  }
}

export class ForStatementNode extends ASTNode {
  constructor(kind, variable, iterable, body, loc) {
    super(ASTNodeType.FOR_STATEMENT, loc);
    this.kind = kind; // 'let' | 'mut' | null
    this.variable = variable;
    this.iterable = iterable;
    this.body = body;
  }
}

export class WhileStatementNode extends ASTNode {
  constructor(test, body, loc) {
    super(ASTNodeType.WHILE_STATEMENT, loc);
    this.test = test;
    this.body = body;
  }
}

export class ReturnStatementNode extends ASTNode {
  constructor(argument = null, loc) {
    super(ASTNodeType.RETURN_STATEMENT, loc);
    this.argument = argument;
  }
}

export class WatchStatementNode extends ASTNode {
  constructor(target, handler, loc) {
    super(ASTNodeType.WATCH_STATEMENT, loc);
    this.target = target;
    this.handler = handler;
  }
}

export class EffectStatementNode extends ASTNode {
  constructor(body, loc) {
    super(ASTNodeType.EFFECT_STATEMENT, loc);
    this.body = body;
  }
}

export class BlockStatementNode extends ASTNode {
  constructor(body, loc) {
    super(ASTNodeType.BLOCK_STATEMENT, loc);
    this.body = body || [];
  }
}

export class ExpressionStatementNode extends ASTNode {
  constructor(expression, loc) {
    super(ASTNodeType.EXPRESSION_STATEMENT, loc);
    this.expression = expression;
  }
}

export class PipelineExpressionNode extends ASTNode {
  constructor(left, right, loc) {
    super(ASTNodeType.PIPELINE_EXPRESSION, loc);
    this.left = left;
    this.right = right;
  }
}

export class BinaryExpressionNode extends ASTNode {
  constructor(operator, left, right, loc) {
    super(ASTNodeType.BINARY_EXPRESSION, loc);
    this.operator = operator;
    this.left = left;
    this.right = right;
  }
}

export class UnaryExpressionNode extends ASTNode {
  constructor(operator, argument, prefix = true, loc) {
    super(ASTNodeType.UNARY_EXPRESSION, loc);
    this.operator = operator;
    this.argument = argument;
    this.prefix = prefix;
  }
}

export class RangeExpressionNode extends ASTNode {
  constructor(start, end, loc) {
    super(ASTNodeType.RANGE_EXPRESSION, loc);
    this.start = start;
    this.end = end;
  }
}

export class ConditionalExpressionNode extends ASTNode {
  constructor(test, consequent, alternate, loc) {
    super(ASTNodeType.CONDITIONAL_EXPRESSION, loc);
    this.test = test;
    this.consequent = consequent;
    this.alternate = alternate;
  }
}

export class CallExpressionNode extends ASTNode {
  constructor(callee, args = [], optional = false, loc) {
    super(ASTNodeType.CALL_EXPRESSION, loc);
    this.callee = callee;
    this.arguments = args;
    this.optional = optional;
  }
}

export class TaggedTemplateExpressionNode extends ASTNode {
  constructor(tag, quasi, loc) {
    super(ASTNodeType.TAGGED_TEMPLATE_EXPRESSION, loc);
    this.tag = tag;
    this.quasi = quasi;
  }
}

export class TemplateLiteralNode extends ASTNode {
  constructor(parts, loc) {
    super(ASTNodeType.TEMPLATE_LITERAL, loc);
    this.parts = parts;
  }
}

export class MemberExpressionNode extends ASTNode {
  constructor(object, property, computed = false, optional = false, loc) {
    super(ASTNodeType.MEMBER_EXPRESSION, loc);
    this.object = object;
    this.property = property;
    this.computed = computed;
    this.optional = optional;
  }
}

export class AssignmentExpressionNode extends ASTNode {
  constructor(operator, left, right, loc) {
    super(ASTNodeType.ASSIGNMENT_EXPRESSION, loc);
    this.operator = operator;
    this.left = left;
    this.right = right;
  }
}

export class ClosureExpressionNode extends ASTNode {
  constructor(params, body, isAsync = false, isExpressionBody = true, loc) {
    super(ASTNodeType.CLOSURE_EXPRESSION, loc);
    this.params = params || [];
    this.body = body;
    this.isAsync = isAsync;
    this.isExpressionBody = isExpressionBody;
  }
}

export class IdentifierNode extends ASTNode {
  constructor(name, loc) {
    super(ASTNodeType.IDENTIFIER, loc);
    this.name = name;
  }
}

export class LiteralNode extends ASTNode {
  constructor(value, raw, loc) {
    super(ASTNodeType.LITERAL, loc);
    this.value = value;
    this.raw = raw;
  }
}

export class FormattedStringLiteralNode extends ASTNode {
  constructor(parts, loc) {
    super(ASTNodeType.FORMATTED_STRING_LITERAL, loc);
    this.parts = parts; // Array of { type: 'string'|'expression', value: any, exprNode?: ASTNode }
  }
}

export class ArrayLiteralNode extends ASTNode {
  constructor(elements = [], loc) {
    super(ASTNodeType.ARRAY_LITERAL, loc);
    this.elements = elements;
  }
}

export class ObjectLiteralNode extends ASTNode {
  constructor(properties = [], loc) {
    super(ASTNodeType.OBJECT_LITERAL, loc);
    this.properties = properties;
  }
}

export class ObjectPropertyNode extends ASTNode {
  constructor(key, value, shorthand = false, computed = false, loc) {
    super(ASTNodeType.OBJECT_PROPERTY, loc);
    this.key = key;
    this.value = value;
    this.shorthand = shorthand;
    this.computed = computed;
  }
}

export class PlaceholderExpressionNode extends ASTNode {
  constructor(loc) {
    super(ASTNodeType.PLACEHOLDER_EXPRESSION, loc);
  }
}

export class SpreadElementNode extends ASTNode {
  constructor(argument, loc) {
    super(ASTNodeType.SPREAD_ELEMENT, loc);
    this.argument = argument;
  }
}

export class AwaitExpressionNode extends ASTNode {
  constructor(argument, loc) {
    super(ASTNodeType.AWAIT_EXPRESSION, loc);
    this.argument = argument;
  }
}

export class NewExpressionNode extends ASTNode {
  constructor(callee, args = [], loc) {
    super(ASTNodeType.NEW_EXPRESSION, loc);
    this.callee = callee;
    this.arguments = args;
  }
}

export class TryStatementNode extends ASTNode {
  constructor(block, handlerParam = null, handlerBody = null, finalizer = null, loc) {
    super(ASTNodeType.TRY_STATEMENT, loc);
    this.block = block;
    this.handlerParam = handlerParam;
    this.handlerBody = handlerBody;
    this.finalizer = finalizer;
  }
}

export class ThrowStatementNode extends ASTNode {
  constructor(argument, loc) {
    super(ASTNodeType.THROW_STATEMENT, loc);
    this.argument = argument;
  }
}

export class BreakStatementNode extends ASTNode {
  constructor(loc) {
    super(ASTNodeType.BREAK_STATEMENT, loc);
  }
}

export class ContinueStatementNode extends ASTNode {
  constructor(loc) {
    super(ASTNodeType.CONTINUE_STATEMENT, loc);
  }
}

/**
 * AST Traverser / Visitor Helper
 */
export function walkAST(node, visitor) {
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
