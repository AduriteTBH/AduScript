/**
 * Code Generator Unit Tests
 */

import { describe, it, assert } from './test_runner.js';
import { compile } from '../src/index.js';

describe('Code Generator (codegen.js)', () => {
  it('compiles let to const and mut to let', () => {
    const res = compile('let a = 10; mut b = 20;');
    assert.ok(res.code.includes('const a = 10;'));
    assert.ok(res.code.includes('let b = 20;'));
  });

  it('compiles single-expression functions with return', () => {
    const res = compile('fn multiply(x, y) -> x * y');
    assert.ok(res.code.includes('function multiply(x, y) {'));
    assert.ok(res.code.includes('return (x * y);'));
  });

  it('compiles pipeline expressions into nested function calls', () => {
    const res = compile('let result = 5 |> double |> add(10)');
    assert.ok(res.code.includes('add(double(5), 10)'));
  });

  it('compiles pipeline placeholder expressions', () => {
    const res = compile('let result = 5 |> Math.pow(2, _)');
    assert.ok(res.code.includes('Math.pow(2, 5)'));
  });

  it('compiles method pipeline shorthand', () => {
    const res = compile('let text = "  hello  " |> .trim() |> .toUpperCase()');
    assert.ok(res.code.includes('"  hello  ".trim().toUpperCase()'));
  });

  it('compiles use cdn statements to ESM imports', () => {
    const res = compile('use cdn:three as THREE');
    assert.ok(res.code.includes('import * as THREE from "https://esm.sh/three";'));
  });

  it('compiles state, watch, and effect statements', () => {
    const res = compile(`
      state count = 0
      watch count => { console.log(count.value) }
      effect { document.title = count.value }
    `);
    assert.ok(res.code.includes('const count = $adu.state(0);'));
    assert.ok(res.code.includes('$adu.watch(count, () => {'));
    assert.ok(res.code.includes('$adu.effect(() => {'));
  });

  it('compiles pattern matching with $adu.match', () => {
    const res = compile(`
      let msg = match status with {
        200 => "OK",
        1..10 => "Small",
        _ => "Other"
      }
    `);
    assert.ok(res.code.includes('$adu.match(status, ['));
    assert.ok(res.code.includes('$adu.matchLiteral(200)'));
    assert.ok(res.code.includes('$adu.matchRange(1, 10)'));
    assert.ok(res.code.includes('$adu.matchWildcard()'));
  });

  it('compiles HTML tagged templates and rewrites subfolder .ads imports', () => {
    const res = compile(`
      import { Nav } from "./components/nav.ads"
      let view = $adu.html\`<header>\${Nav()}</header>\`
    `, { rewriteAdsImports: true });

    assert.ok(res.code.includes('import { Nav } from "./components/nav.js";'));
    assert.ok(res.code.includes('$adu.html`<header>${Nav()}</header>`'));
  });

  it('compiles ternary conditional expressions', () => {
    const res = compile(`let flag = true ? "yes" : "no"`);
    assert.ok(res.code.includes('(true ? "yes" : "no")'));
  });
});
