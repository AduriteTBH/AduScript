/**
 * Parser Unit Tests
 */

import { describe, it, assert } from './test_runner.js';
import { Parser } from '../src/parser.js';
import { ASTNodeType } from '../src/ast.js';

describe('AST Parser', () => {
  it('parses immutable let and mutable mut declarations', () => {
    const ast = Parser.parse('let a = 10; mut b = 20;');
    assert.strictEqual(ast.body.length, 2);
    assert.strictEqual(ast.body[0].type, ASTNodeType.VARIABLE_DECLARATION);
    assert.strictEqual(ast.body[0].kind, 'let');
    assert.strictEqual(ast.body[1].kind, 'mut');
  });

  it('parses reactive state declarations', () => {
    const ast = Parser.parse('state count = 0');
    assert.strictEqual(ast.body.length, 1);
    assert.strictEqual(ast.body[0].type, ASTNodeType.STATE_DECLARATION);
    assert.strictEqual(ast.body[0].id.name, 'count');
    assert.strictEqual(ast.body[0].init.value, 0);
  });

  it('parses auto-returning single-expression functions', () => {
    const ast = Parser.parse('fn add(a, b) -> a + b');
    assert.strictEqual(ast.body.length, 1);
    const fnNode = ast.body[0];
    assert.strictEqual(fnNode.type, ASTNodeType.FUNCTION_DECLARATION);
    assert.strictEqual(fnNode.id.name, 'add');
    assert.strictEqual(fnNode.isExpressionBody, true);
    assert.strictEqual(fnNode.body.type, ASTNodeType.BINARY_EXPRESSION);
    assert.strictEqual(fnNode.body.operator, '+');
  });

  it('parses pipeline operator chains', () => {
    const ast = Parser.parse('data |> filter(isEven) |> map(square)');
    assert.strictEqual(ast.body.length, 1);
    const stmt = ast.body[0];
    assert.strictEqual(stmt.type, ASTNodeType.EXPRESSION_STATEMENT);
    assert.strictEqual(stmt.expression.type, ASTNodeType.PIPELINE_EXPRESSION);
    assert.strictEqual(stmt.expression.left.type, ASTNodeType.PIPELINE_EXPRESSION);
  });

  it('parses pattern matching construct', () => {
    const code = `
    match status with {
      200 => "OK",
      404 => "Not Found",
      1..10 => "Range",
      _ => "Default"
    }
    `;
    const ast = Parser.parse(code);
    assert.strictEqual(ast.body.length, 1);
    const matchStmt = ast.body[0];
    assert.strictEqual(matchStmt.type, ASTNodeType.MATCH_STATEMENT);
    assert.strictEqual(matchStmt.arms.length, 4);
    assert.strictEqual(matchStmt.arms[0].pattern.value, 200);
    assert.strictEqual(matchStmt.arms[2].pattern.type, ASTNodeType.RANGE_EXPRESSION);
    assert.strictEqual(matchStmt.arms[3].pattern.type, ASTNodeType.WILDCARD_PATTERN);
  });

  it('parses CDN use declarations', () => {
    const ast = Parser.parse('use cdn:three as THREE; use "https://cdn.esm.sh/gsap" { gsap }');
    assert.strictEqual(ast.body.length, 2);
    assert.strictEqual(ast.body[0].type, ASTNodeType.USE_DECLARATION);
    assert.strictEqual(ast.body[0].isCDN, true);
    assert.strictEqual(ast.body[0].alias, 'THREE');
    assert.strictEqual(ast.body[1].specifiers[0].imported, 'gsap');
  });

  it('parses watch and effect statements', () => {
    const ast = Parser.parse('watch count => { log(count.value) }; effect { title = count.value }');
    assert.strictEqual(ast.body.length, 2);
    assert.strictEqual(ast.body[0].type, ASTNodeType.WATCH_STATEMENT);
    assert.strictEqual(ast.body[1].type, ASTNodeType.EFFECT_STATEMENT);
  });

  it('parses tagged template literals and subfolder imports', () => {
    const ast = Parser.parse('import { Header } from "./components/header.ads"; let view = html`<div class="box">${title}</div>`');
    assert.strictEqual(ast.body.length, 2);
    assert.strictEqual(ast.body[0].type, ASTNodeType.IMPORT_DECLARATION);
    assert.strictEqual(ast.body[0].source, './components/header.ads');
    assert.strictEqual(ast.body[1].init.type, ASTNodeType.TAGGED_TEMPLATE_EXPRESSION);
  });

  it('parses ternary conditional expressions and standard methods', () => {
    const ast = Parser.parse('let x = isLiked ? 1 : 0; let s = (a + 1).toLocaleString()');
    assert.strictEqual(ast.body[0].init.type, ASTNodeType.CONDITIONAL_EXPRESSION);
    assert.strictEqual(ast.body[1].init.type, ASTNodeType.CALL_EXPRESSION);
  });
});
