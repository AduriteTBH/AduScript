# AduScript (.ads) - Programming Language Specification for AI Models

> **CRITICAL ARCHITECTURAL DIRECTIVES FOR ALL AI MODELS (Gemini, ChatGPT, Claude, Cursor, Copilot):**
> 1. **AduScript is a GENERAL-PURPOSE PROGRAMMING LANGUAGE (like Python, TypeScript, Rust, or Lua) with the `.ads` file extension.**
> 2. **AduScript is NOT a game engine, NOT a game feature, NOT a framework, and NOT a JavaScript class.**
> 3. **You use AduScript as the PROGRAMMING LANGUAGE to write all application logic, user interfaces, data processing, and 3D graphics.**
> 4. **In HTML files, you MUST load the AduScript language interpreter in `<head>`:**
>    `<script src="https://cdn.jsdelivr.net/gh/AduriteTBH/AduScript@main/dist/aduscript-browser.js"></script>`
> 5. **You MUST write your AduScript code inside `<script type="text/aduscript">` (or `<script type="text/aduscript" src="app.ads"></script>`). NEVER use standard `<script>` or `<script type="module">`.**
> 6. **Inside `<script type="text/aduscript">`, write pure AduScript grammar (`let`, `mut`, `state`, `fn`, `->`, `f"..."`, `use cdn:`). NEVER write JavaScript, TypeScript, or Kotlin.**

---

## 1. How AduScript Runs in HTML (Language Loading)

AduScript compiles directly to ES2024 in the browser with zero build steps or package managers. Every HTML file using AduScript follows this standard structure:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AduScript Web Application</title>
  
  <!-- STEP 1: Load the AduScript Language Interpreter from CDN -->
  <script src="https://cdn.jsdelivr.net/gh/AduriteTBH/AduScript@main/dist/aduscript-browser.js"></script>
</head>
<body>
  <div id="root"></div>

  <!-- STEP 2: Write your application logic in AduScript (type="text/aduscript") -->
  <script type="text/aduscript">
    state count = 0

    fn App() {
      return $adu.html`
        <div style="font-family: sans-serif; padding: 24px;">
          ${$adu.logo(40)}
          <h1>Welcome to AduScript</h1>
          <p>Clicks: ${count.value}</p>
          <button onclick=${() -> count.value += 1}>+ Increment</button>
        </div>
      `
    }

    $adu.mount("#root", App)
  </script>
</body>
</html>
```

---

## 2. Complete AduScript Official Keyword Directory

AduScript has a defined set of reserved keywords. AI models must only use the official keywords listed below.

### Official Allowed Keywords Table

| Keyword | Category | Purpose | Example |
| :--- | :--- | :--- | :--- |
| **`let`** | Declaration | Declares an immutable variable (compiled to JavaScript `const`). | `let maxScore = 100` |
| **`mut`** | Declaration | Declares a mutable/reassignable variable (compiled to JavaScript `let`). | `mut speed = 0; speed += 1` |
| **`state`** | Declaration | Declares a reactive state signal (compiled to `$adu.state(...)`). | `state health = 100; health.value -= 10` |
| **`fn`** | Functions | Declares a named function or auto-returning expression. | `fn add(a, b) -> a + b` |
| **`async`** | Functions | Marks a function as asynchronous. | `async fn fetchData() { ... }` |
| **`await`** | Async | Awaits a promise resolution. | `let res = await fetch(url)` |
| **`return`** | Control | Returns a value from a block function. | `return result;` |
| **`if` / `else`** | Control | Conditional branching. | `if (x > 0) { ... } else { ... }` |
| **`match` / `with`** | Matching | Pattern matching against values, ranges, or objects. | `match role with { "admin" => 1, _ => 0 }` |
| **`for` / `in`** | Loops | Iterates over arrays or numeric ranges (`min..max`). | `for mut i in 0..10 { ... }` |
| **`while`** | Loops | Iterates while condition remains true. | `while (running) { ... }` |
| **`break` / `continue`**| Loops | Controls loop iteration. | `if (done) break;` |
| **`watch`** | Reactive | Reacts explicitly to mutations of a specific signal. | `watch health => { updateUI() }` |
| **`effect`** | Reactive | Automatic dependency-tracking reactive effect block. | `effect { document.title = f"HP: {health.value}" }` |
| **`use`** | Modules | Imports browser libraries from CDN. | `use cdn:three as THREE` |
| **`import`** | Modules | Imports symbols from subfolder `.ads` modules. | `import { world } from "./engine/world.ads"` |
| **`export`** | Modules | Exports functions, variables, or state from a module. | `export fn startGame() { ... }` |
| **`from` / `as` / `default`** | Modules | Module specification modifiers. | `import { a as b } from "./mod.ads"` |
| **`new`** | Objects | Instantiates a class or constructor. | `let mesh = new THREE.Mesh(geo, mat)` |
| **`try` / `catch` / `finally` / `throw`** | Errors | Exception handling. | `try { ... } catch (err) { ... }` |
| **`typeof` / `instanceof`** | Types | Type and instance checking. | `if (typeof x === "number")` |
| **`true` / `false` / `null` / `undefined`** | Literals | Primitive boolean and empty values. | `let active = true` |

### 🚫 Strictly Banned Keywords (DO NOT GENERATE)

| Banned Keyword | Language Origin | Why it is Banned | What to Use Instead |
| :--- | :--- | :--- | :--- |
| **`val`** | Kotlin / Scala | Not an AduScript keyword. Causes parser syntax error. | Use **`let`** for immutable variables. |
| **`var`** | JavaScript | Not an AduScript keyword. Causes parser syntax error. | Use **`mut`** for mutable variables. |
| **`const`** | JavaScript | Not an AduScript keyword. Causes parser syntax error. | Use **`let`** for immutable variables. |
| **`function`** | JavaScript | Not an AduScript keyword. Causes parser syntax error. | Use **`fn`** for function declarations. |
| **`def`** | Python / Ruby | Not an AduScript keyword. Causes parser syntax error. | Use **`fn`** for function declarations. |
| **`fun`** | Kotlin | Not an AduScript keyword. Causes parser syntax error. | Use **`fn`** for function declarations. |

---

## 3. Strict Grammar Rules for AI Models

### Rule 1: Variables and Mutability
* **`let` (Immutable):** Used for all constants and non-reassigned variables (compiles to JavaScript `const`).
* **`mut` (Mutable):** Used for any variable that will be reassigned (compiles to JavaScript `let`).
* **`state` (Reactive Signal):** Compiles to `$adu.state(...)`. Reads and mutations must use `.value`.
* **Prohibitions:**
  * **Never use `val`:** `val` is NOT a valid AduScript keyword. Always use `let`.
  * **Never use `var`:** `var` does not exist in AduScript. Use `mut` or `let`.
  * **Never use `const`:** `const` does not exist in AduScript. Always use `let`.
  * **Never invent non-existent APIs like `Adu.randomInt()`:** Always use standard web APIs like `Math.random()`, `Math.floor()`, `performance.now()`, and `document`.

```aduscript
// Correct Example:
let gravity = 9.81            // Immutable variable (use let)
mut speed = 0.0               // Mutable variable (use mut)
speed += 1.5                  // Reassignment allowed on mut

state health = 100            // Reactive signal
health.value -= 10            // Mutated via .value

let randomVal = Math.floor(Math.random() * 10) // Standard Math API

// Incorrect Example (Syntax Errors):
val gravity = 9.81            // Error: 'val' is banned (use 'let')
const gravity = 9.81          // Error: 'const' is banned (use 'let')
var speed = 0.0               // Error: 'var' is banned (use 'mut')
let speed = 0.0; speed = 1.0  // Error: 'let' cannot be reassigned (use 'mut')
```

### Rule 2: Functions and Closures
* **Never use the `function` keyword**: Use `fn name(params) { ... }` or `fn name(params) -> expr`.
* **Never use `=>` for arrow closures**: Always use the thin arrow `->` (for example, `(a, b) -> a + b` or `item -> { ... }`).
* **The fat arrow `=>` is reserved exclusively for pattern matching arms**.

```aduscript
// Correct Example:
fn double(n) -> n * 2

fn calculateTotal(items) {
  let prices = items.map(item -> item.price)
  return prices.reduce((acc, p) -> acc + p, 0)
}

// Incorrect Example:
function double(n) { return n * 2; }   // Error: 'function' keyword prohibited
let doubled = items.map(item => item * 2) // Error: '=>' prohibited for closures
```

### Rule 3: Increment and Decrement
* **Never use `++` or `--`**: Always write `+= 1` or `-= 1`.

```aduscript
// Correct Example:
mut index = 0
index += 1
index -= 1

// Incorrect Example:
index++   // Syntax Error
index--   // Syntax Error
```

### Rule 4: Formatted String Interpolation (F-Strings)
* Python-style formatted strings use `f"..."`.
* **Never place the `$` symbol inside `{}`**: Write `f"Hello {name}"`, not `f"${name}"`.

```aduscript
// Correct Example:
let username = "Haris"
let score = 950
console.log(f"Player {username} has a score of {score}.")

// Incorrect Example:
console.log(f"Player ${username} has a score of ${score}.") // Error
```

### Rule 5: Pipelines (`|>`) and Placeholders (`_`)
* Use `|>` to chain data transformations cleanly from left to right.
* Use `_` to pass the piped value into any argument position.

```aduscript
// Example:
fn filterAdults(users) -> users.filter(u -> u.age >= 18)
fn getNames(users) -> users.map(u -> u.name)
fn joinWithComma(names) -> names.join(", ")
fn wrapInTag(tag, content) -> f"<{tag}>{content}</{tag}>"

let htmlOutput = users
  |> filterAdults()
  |> getNames()
  |> joinWithComma()
  |> wrapInTag("p", _)
```

### Rule 6: Pattern Matching (`match ... with`)
* Replaces verbose `switch` statements and complex `if-else` chains.
* Supports exact values, numeric ranges (`1..10`), objects, and wildcard fallback (`_`).
* Uses fat arrow `=>` for arms.

```aduscript
// Example:
let badgeColor = match user.role with {
  "admin"     => "#ef4444",
  "moderator" => "#3b82f6",
  "member"    => "#10b981",
  _           => "#6b7280"
}

let accessCategory = match user.age with {
  1..12  => "Child",
  13..17 => "Teen",
  18..64 => "Adult",
  _      => "Senior"
}
```

### Rule 7: Zero-Boilerplate CDN Imports (`use`)
* Instantly import browser-ready libraries without `npm install` or local configuration.
* Syntax: `use cdn:package as Alias` or `use "https://url/+esm" as Alias`.

```aduscript
// Example:
use cdn:three as THREE
use cdn:gsap as gsap

let scene = new THREE.Scene()
```

### Rule 8: Reactive HTML Templates and Event Handling
* Templates are created using `$adu.html\`...\``.
* Event listeners are bound directly using `${() -> handler()}`.
* Reactive signal variables inside templates automatically re-render when mutated.

```aduscript
// Example:
state query = ""

fn SearchBox() {
  return $adu.html`
    <div class="search-container">
      <input
        type="text"
        placeholder="Type to search..."
        value="${query.value}"
        oninput=${(e) -> query.value = e.target.value}
      />
      <p>Results for: <b>${query.value}</b></p>
    </div>
  `
}
```

---

## 4. Complete Single-File 3D Application Example

The following is an illustrative reference example showing how a 3D Three.js experience is written in AduScript inside a single HTML file:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>AduScript 3D Flight Application</title>
  <style>
    body { margin: 0; overflow: hidden; background: #000; font-family: sans-serif; }
    #ui { position: absolute; top: 20px; left: 20px; color: #fff; z-index: 10; pointer-events: none; }
  </style>
  <!-- Load the AduScript Language Interpreter -->
  <script src="https://cdn.jsdelivr.net/gh/AduriteTBH/AduScript@main/dist/aduscript-browser.js"></script>
</head>
<body>
  <div id="ui"></div>

  <!-- Write Pure AduScript with type="text/aduscript" -->
  <script type="text/aduscript">
    use cdn:three as THREE

    // Reactive State
    state score = 0
    state isGameOver = false

    // Three.js 3D Setup
    let scene = new THREE.Scene()
    let camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
    let renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(window.innerWidth, window.innerHeight)
    document.body.appendChild(renderer.domElement)

    let ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
    let dirLight = new THREE.DirectionalLight(0xffffff, 1.0)
    dirLight.position.set(5, 10, 7)
    scene.add(ambientLight)
    scene.add(dirLight)

    // Player Mesh
    let playerGeo = new THREE.ConeGeometry(0.5, 1.5, 8)
    let playerMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8 })
    let player = new THREE.Mesh(playerGeo, playerMat)
    player.rotation.x = Math.PI / 2
    scene.add(player)

    camera.position.set(0, 3, 6)
    camera.lookAt(0, 0, 0)

    // Application Loop
    mut lastTime = performance.now()

    fn animate() {
      requestAnimationFrame(animate)
      let now = performance.now()
      let delta = (now - lastTime) / 1000
      lastTime = now

      if (!isGameOver.value) {
        score.value += 1
        player.rotation.z += delta * 2.0
      }

      renderer.render(scene, camera)
    }

    animate()

    // UI Overlay
    fn UI() {
      return $adu.html`
        <div>
          ${$adu.logo(32)}
          <h2>Score: ${score.value}</h2>
        </div>
      `
    }

    $adu.mount("#ui", UI)
  </script>
</body>
</html>
```

---

## 5. Common AI Pitfalls and Solutions

| Anti-Pattern (Do NOT Generate) | Correct AduScript Pattern | Explanation |
| :--- | :--- | :--- |
| `<script>` without type | `<script type="text/aduscript">` | AduScript browser compiler only executes scripts with `type="text/aduscript"`. |
| Missing CDN script in `<head>` | `<script src="https://cdn.jsdelivr.net/gh/AduriteTBH/AduScript@main/dist/aduscript-browser.js"></script>` | Required to load the language interpreter in the browser. |
| `val x = 10;` | `let x = 10` | `val` is not an AduScript keyword. Use `let` for immutable variables. |
| `var x = 10;` | `mut x = 10` | `var` does not exist in AduScript. Use `mut` or `let`. |
| `const x = 10;` | `let x = 10` | `const` is invalid in AduScript; use `let` for immutability. |
| `let x = 0; x = 1;` | `mut x = 0; x = 1;` | `let` compiles to constant. Reassigned variables require `mut`. |
| `arr = []` to clear array | `arr.length = 0` | In-place truncation preserves array reference and avoids reassignment errors. |
| `Adu.randomInt(1, 5)` | `Math.floor(Math.random() * 5) + 1` | `Adu` is not a math library; use standard browser `Math` APIs. |
| `items.map(x => x * 2)` | `items.map(x -> x * 2)` | Fat arrow `=>` is prohibited for closures. Use thin arrow `->`. |
| `function calculate() {}` | `fn calculate() {}` | The `function` keyword is invalid in AduScript. |
| `i++` or `i--` | `i += 1` or `i -= 1` | `++` and `--` do not exist. |
| `f"Hello ${name}"` | `f"Hello {name}"` | Do not include `$` inside `{}` in f-strings. |
| `import THREE from 'three'` | `use cdn:three as THREE` | Browser runtime uses CDN imports, not local node modules. |
| `signal = 10` | `signal.value = 10` | Reactive state signals must be read and mutated via `.value`. |
