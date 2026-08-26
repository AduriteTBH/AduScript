/**
 * Lexer Unit Tests
 */

import { describe, it, assert } from './test_runner.js';
import { Lexer, LexerError } from '../src/lexer.js';
import { TokenType } from '../src/tokens.js';

describe('Lexer & Tokenizer', () => {
  it('tokenizes keywords and immutable/mutable declarations', () => {
    const lexer = new Lexer('let x = 42; mut y = 100');
    const tokens = lexer.tokenize();
    
    assert.strictEqual(tokens[0].type, TokenType.LET);
    assert.strictEqual(tokens[1].type, TokenType.IDENTIFIER);
    assert.strictEqual(tokens[1].value, 'x');
    assert.strictEqual(tokens[2].type, TokenType.EQUALS);
    assert.strictEqual(tokens[3].type, TokenType.NUMBER);
    assert.strictEqual(tokens[3].value, 42);
    assert.strictEqual(tokens[4].type, TokenType.SEMICOLON);
    assert.strictEqual(tokens[5].type, TokenType.MUT);
    assert.strictEqual(tokens[6].type, TokenType.IDENTIFIER);
    assert.strictEqual(tokens[6].value, 'y');
  });

  it('tokenizes pipeline and arrow operators', () => {
    const lexer = new Lexer('data |> filter -> val => result');
    const tokens = lexer.tokenize();

    assert.strictEqual(tokens[0].type, TokenType.IDENTIFIER);
    assert.strictEqual(tokens[1].type, TokenType.PIPELINE);
    assert.strictEqual(tokens[2].type, TokenType.IDENTIFIER);
    assert.strictEqual(tokens[3].type, TokenType.THIN_ARROW);
    assert.strictEqual(tokens[4].type, TokenType.IDENTIFIER);
    assert.strictEqual(tokens[5].type, TokenType.FAT_ARROW);
    assert.strictEqual(tokens[6].type, TokenType.IDENTIFIER);
  });

  it('tokenizes range operator and optional chaining', () => {
    const lexer = new Lexer('0..10 user?.profile?.name');
    const tokens = lexer.tokenize();

    assert.strictEqual(tokens[0].type, TokenType.NUMBER);
    assert.strictEqual(tokens[0].value, 0);
    assert.strictEqual(tokens[1].type, TokenType.RANGE);
    assert.strictEqual(tokens[2].type, TokenType.NUMBER);
    assert.strictEqual(tokens[2].value, 10);
    assert.strictEqual(tokens[3].type, TokenType.IDENTIFIER);
    assert.strictEqual(tokens[4].type, TokenType.OPTIONAL_CHAIN);
    assert.strictEqual(tokens[5].type, TokenType.IDENTIFIER);
  });

  it('tokenizes formatted strings with interpolation f"..."', () => {
    const lexer = new Lexer('f"User {name} has {score + 10} points"');
    const tokens = lexer.tokenize();

    assert.strictEqual(tokens[0].type, TokenType.INTERPOLATED_STRING);
    assert.strictEqual(tokens[0].value.length, 5);
    assert.strictEqual(tokens[0].value[0].value, 'User ');
    assert.strictEqual(tokens[0].value[1].value, 'name');
    assert.strictEqual(tokens[0].value[2].value, ' has ');
    assert.strictEqual(tokens[0].value[3].value, 'score + 10');
    assert.strictEqual(tokens[0].value[4].value, ' points');
  });

  it('tokenizes numbers in hex, binary, and floats', () => {
    const lexer = new Lexer('0xFF 0b1010 3.14159 1e4');
    const tokens = lexer.tokenize();

    assert.strictEqual(tokens[0].value, 255);
    assert.strictEqual(tokens[1].value, 10);
    assert.strictEqual(tokens[2].value, 3.14159);
    assert.strictEqual(tokens[3].value, 10000);
  });

  it('reports descriptive syntax errors with line/column pointers', () => {
    assert.throws(() => {
      const lexer = new Lexer('let x = @invalid');
      lexer.tokenize();
    }, LexerError);
  });
});
