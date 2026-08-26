/**
 * AduScript Zero-Dependency Test Runner
 */

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const failures = [];

export function describe(suiteName, fn) {
  console.log(`\n\x1b[1m\x1b[36m▶ Suite: ${suiteName}\x1b[0m`);
  fn();
}

export function it(testName, fn) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`  \x1b[32m✔\x1b[0m ${testName}`);
  } catch (err) {
    failedTests++;
    console.log(`  \x1b[31m✖\x1b[0m ${testName}`);
    failures.push({ name: testName, error: err });
  }
}

export const assert = {
  strictEqual(actual, expected, msg) {
    if (actual !== expected) {
      throw new Error(msg || `Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
    }
  },
  deepStrictEqual(actual, expected, msg) {
    const actStr = JSON.stringify(actual);
    const expStr = JSON.stringify(expected);
    if (actStr !== expStr) {
      throw new Error(msg || `Deep equality mismatch:\nExpected: ${expStr}\nGot:      ${actStr}`);
    }
  },
  ok(value, msg) {
    if (!value) throw new Error(msg || `Expected truthy value, got ${value}`);
  },
  throws(fn, expectedErr, msg) {
    let threw = false;
    try {
      fn();
    } catch (e) {
      threw = true;
      if (expectedErr && typeof expectedErr === 'function' && !(e instanceof expectedErr)) {
        throw new Error(`Expected error of type ${expectedErr.name}, got ${e.name}: ${e.message}`);
      }
    }
    if (!threw) throw new Error(msg || 'Expected function to throw an error');
  }
};

export function printSummary() {
  console.log('\n' + '='.repeat(50));
  console.log(`\x1b[1mTest Results: ${passedTests}/${totalTests} Passed\x1b[0m`);
  if (failedTests > 0) {
    console.log(`\x1b[31m${failedTests} Tests Failed:\x1b[0m`);
    failures.forEach(f => {
      console.log(`\n\x1b[31m✖ ${f.name}\x1b[0m`);
      console.log(f.error.stack || f.error.message);
    });
    process.exit(1);
  } else {
    console.log(`\x1b[32m✔ All test suites passed successfully!\x1b[0m\n`);
  }
}

// Master test suite runner
if (process.argv[1]?.endsWith('test_runner.js')) {
  async function runAll() {
    await import('./lexer.test.js');
    await import('./parser.test.js');
    await import('./codegen.test.js');
    await import('./runtime.test.js');
    printSummary();
  }
  runAll();
}
