# AduScript AI Guidelines

Instructions for AI coding models (ChatGPT, Claude, Cursor, Copilot, Gemini) when authoring AduScript (.ads) source code.

---

## Language Rules

When writing AduScript (.ads files), you must output valid AduScript syntax, not JavaScript or TypeScript.

### 1. Variables
* Never use `const`.
* Use `let name = val` for immutable variables (compiled to JavaScript `const`).
* Use `mut name = val` for mutable and reassignable variables (compiled to JavaScript `let`).
* Use `state name = val` for reactive signals. Signal values are accessed and updated via `.value`.

```aduscript
let maxSpeed = 120
mut currentSpeed = 0
currentSpeed += 10

state count = 0
count.value += 1
```

### 2. Functions and Closures
* Never use the `function` keyword. Use `fn name(args) { ... }` or single-expression `fn name(args) -> expr`.
* Never use `=>` for arrow closures or functions. Always use thin arrow `->` (for example, `(a, b) -> a + b` or `item -> { ... }`).
* The fat arrow `=>` is reserved exclusively for `match` pattern arms.

```aduscript
fn add(a, b) -> a + b

fn processUser(user) {
  let active = user.status === "active"
  return { id: user.id, active }
}

let doubled = numbers.map(x -> x * 2)
```

### 3. Increment and Decrement
* Never use `++` or `--`.
* Always use `+= 1` or `-= 1`.

```aduscript
mut frames = 0
frames += 1
```

### 4. Formatted Strings (F-Strings)
* Use `f"..."` for string interpolation.
* Never put the `$` symbol inside `{}` expressions. Write `f"Hello {name}"`, not `f"${name}"`.

```aduscript
let name = "Player1"
let score = 500
console.log(f"Welcome {name}, current score: {score}")
```

### 5. Pipelines (`|>`)
* Use `|>` to pipe values through functions from left to right.
* Use `_` as a placeholder for custom argument placement.

```aduscript
let result = data
  |> filterActive()
  |> calculateTotal()
```

### 6. Pattern Matching (`match ... with`)
* Replaces `switch` and `if-else` chains.
* Supports literals, ranges (`1..10`), objects, and wildcard fallback (`_`).
* Fat arrow `=>` is used in match arms.

```aduscript
let title = match user.role with {
  "admin" => "Administrator",
  "mod"   => "Moderator",
  _       => "Member"
}

let stage = match user.age with {
  1..12  => "Child",
  13..17 => "Teen",
  18..64 => "Adult",
  _      => "Senior"
}
```

### 7. CDN and Module Imports
* Use `use cdn:package as Name` for external browser libraries. Do not use `npm install`.
* Use `import { item } from "./path.ads"` for subfolder AduScript modules.

```aduscript
use cdn:three as THREE
import { createWorld } from "./engine/world.ads"
```

### 8. Reactive HTML and CSS Templates
* Use `$adu.html\`...\`` for reactive DOM templates.
* Use `$adu.mount(selector, componentFunction)` to attach to the page.

```aduscript
state likes = 0

fn LikeWidget() {
  return $adu.html`
    <div class="widget">
      <button onclick=${() -> likes.value += 1}>
        Likes: ${likes.value}
      </button>
    </div>
  `
}

$adu.mount("#app", LikeWidget)
```

---

## 1-Click System Prompt for External AI Chats

Paste this prompt when asking ChatGPT, Claude, Cursor, or Copilot to write AduScript code:

```text
You are an expert coding assistant for AduScript (.ads), a web language compiling to ES2024.
When writing AduScript (.ads) code, you must follow these rules:
1. NEVER use 'const' — Use 'let' for immutable variables and 'mut' for mutable variables.
2. NEVER use '=>' for functions or closures — ALWAYS use thin arrow '->' (e.g. (a, b) -> a + b).
3. NEVER use 'function' keyword — Use 'fn name(args) { ... }' or 'fn name(args) -> expr'.
4. NEVER use '++' or '--' — Use 'val += 1' or 'val -= 1'.
5. NEVER put '$' inside f-strings — Use f"Hello {name}" (not f"${name}").
6. Use 'state' for reactive signals (mutated via signal.value) and '$adu.html`...`' for DOM templates.
7. Use 'use cdn:pkg as Name' for libraries (e.g. use cdn:three as THREE). Zero npm dependencies.
```
