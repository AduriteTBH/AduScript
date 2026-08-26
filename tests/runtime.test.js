/**
 * Runtime Library Unit Tests
 */

import { describe, it, assert } from './test_runner.js';
import { state, watch, effect, computed, html, css, match, matchLiteral, matchRange, matchWildcard, matchObject, matchArray, pipe, range } from '../src/runtime.js';

describe('AduScript Runtime ($adu)', () => {
  it('reactive state updates subscribers when mutated', () => {
    const count = state(0);
    let lastObserved = null;

    watch(count, (newVal) => {
      lastObserved = newVal;
    });

    count.value = 10;
    assert.strictEqual(lastObserved, 10);
    assert.strictEqual(count.value, 10);
  });

  it('reactive effect automatically tracks dependencies', () => {
    const a = state(5);
    const b = state(10);
    let sum = 0;

    effect(() => {
      sum = a.value + b.value;
    });

    assert.strictEqual(sum, 15);
    a.value = 20;
    assert.strictEqual(sum, 30);
    b.value = 30;
    assert.strictEqual(sum, 50);
  });

  it('computed signals derive and update reactively', () => {
    const base = state(4);
    const squared = computed(() => base.value * base.value);

    assert.strictEqual(squared.value, 16);
    base.value = 5;
    assert.strictEqual(squared.value, 25);
  });

  it('nested object and array proxy mutations trigger reactivity', () => {
    const store = state({ user: { name: 'Alice', scores: [10, 20] } });
    let nameObserved = '';

    effect(() => {
      nameObserved = store.value.user.name;
    });

    assert.strictEqual(nameObserved, 'Alice');
    store.value.user.name = 'Bob';
    assert.strictEqual(nameObserved, 'Bob');
  });

  it('evaluates pattern matching with literals, ranges, and wildcards', () => {
    const matchCase = (val) => match(val, [
      { test: matchLiteral('hello'), body: () => 'greeting' },
      { test: matchRange(1, 10), body: () => 'small-number' },
      { test: matchObject({ type: 'admin' }), body: (v) => `admin-${v.id}` },
      { test: matchArray([1, 2]), body: () => 'pair' },
      { test: matchWildcard(), body: () => 'fallback' }
    ]);

    assert.strictEqual(matchCase('hello'), 'greeting');
    assert.strictEqual(matchCase(5), 'small-number');
    assert.strictEqual(matchCase({ type: 'admin', id: 42 }), 'admin-42');
    assert.strictEqual(matchCase([1, 2]), 'pair');
    assert.strictEqual(matchCase('random'), 'fallback');
  });

  it('pipe and range helpers function correctly', () => {
    const res = pipe(5, (x) => x * 2, (x) => x + 3);
    assert.strictEqual(res, 13);

    const r = range(1, 5);
    assert.deepStrictEqual(r, [1, 2, 3, 4, 5]);
  });

  it('html and css helpers format template strings reactively', () => {
    const name = state('AduScript');
    const rendered = html`<div class="brand">${name.value}</div>`;
    assert.strictEqual(rendered, '<div class="brand">AduScript</div>');

    const style = css`
      .brand { color: #6366f1; font-weight: bold; }
    `;
    assert.ok(style.includes('.brand { color: #6366f1; font-weight: bold; }'));
  });
});
