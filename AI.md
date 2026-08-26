# AduScript Technical Specification and System Instructions for AI Models

> **CRITICAL DIRECTIVE FOR ALL AI MODELS (ChatGPT, Claude, Cursor, Copilot, Gemini):**
> You are generating source code for **AduScript**, a standalone programming language with the `.ads` file extension.
> **YOU MUST WRITE PURE ADUSCRIPT CODE ONLY.**
> **DO NOT WRITE JAVASCRIPT, TYPESCRIPT, KOTLIN, RUST, OR PYTHON.**

---

## 1. Complete AduScript Official Keyword Directory

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
| **`new`** | Objects | Instantiates a class or Three.js constructor. | `let mesh = new THREE.Mesh(geo, mat)` |
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

## 2. Zero-Compiler Architecture and Single-File HTML Coding

AduScript does not require installing any compiler, Node.js packages, bundlers, or build tools. It runs natively in every modern web browser with zero configuration.

### Example: Single-File HTML Application
The following is a reference example demonstrating how an entire web application—including reactive state, UI templates, CSS styling, and logic—can be authored inside a single `.html` file without external build tools:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AduScript Single-File Task Manager</title>
  <!-- Load the global browser engine from CDN -->
  <script src="https://cdn.jsdelivr.net/gh/AduriteTBH/AduScript@main/dist/aduscript-browser.js"></script>
</head>
<body>
  <div id="app"></div>

  <script type="text/aduscript">
    // Injected component stylesheet
    $adu.css`
      :root {
        --bg: #0f172a;
        --card-bg: #1e293b;
        --accent: #3b82f6;
        --accent-hover: #2563eb;
        --text: #f8fafc;
        --text-muted: #94a3b8;
        --border: #334155;
      }
      body {
        margin: 0;
        background: var(--bg);
        color: var(--text);
        font-family: system-ui, -apple-system, sans-serif;
        display: flex;
        justify-content: center;
        padding: 40px 16px;
      }
      .container {
        width: 100%;
        max-width: 500px;
        background: var(--card-bg);
        border: 1px solid var(--border);
        border-radius: 16px;
        padding: 24px;
        box-shadow: 0 20px 40px rgba(0,0,0,0.4);
      }
      .header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 20px;
      }
      .input-group {
        display: flex;
        gap: 8px;
        margin-bottom: 20px;
      }
      input[type="text"] {
        flex: 1;
        background: #0f172a;
        border: 1px solid var(--border);
        color: var(--text);
        padding: 10px 14px;
        border-radius: 8px;
        font-size: 14px;
        outline: none;
      }
      input[type="text"]:focus {
        border-color: var(--accent);
      }
      button.primary {
        background: var(--accent);
        color: white;
        border: none;
        padding: 10px 18px;
        border-radius: 8px;
        font-weight: 600;
        cursor: pointer;
      }
      button.primary:hover {
        background: var(--accent-hover);
      }
      .task-list {
        list-style: none;
        padding: 0;
        margin: 0;
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .task-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 10px 14px;
        background: #0f172a;
        border: 1px solid var(--border);
        border-radius: 8px;
      }
      .task-item.done span {
        text-decoration: line-through;
        color: var(--text-muted);
      }
      .delete-btn {
        background: transparent;
        border: none;
        color: #ef4444;
        cursor: pointer;
        font-size: 16px;
      }
    `

    // Reactive State Signals
    state tasks = [
      { id: 1, text: "Learn AduScript grammar", completed: true },
      { id: 2, text: "Build single-file web app", completed: false }
    ]
    state newText = ""

    // Action Handlers
    fn addTask() {
      if (newText.value.trim() === "") return;
      let nextId = tasks.value.length > 0 ? Math.max(...tasks.value.map(t -> t.id)) + 1 : 1
      tasks.value = [
        ...tasks.value,
        { id: nextId, text: newText.value.trim(), completed: false }
      ]
      newText.value = ""
    }

    fn toggleTask(id) {
      tasks.value = tasks.value.map(t -> {
        if (t.id === id) {
          return { ...t, completed: !t.completed }
        }
        return t
      })
    }

    fn deleteTask(id) {
      tasks.value = tasks.value.filter(t -> t.id !== id)
    }

    // Main Component Definition
    fn App() {
      let pendingCount = tasks.value.filter(t -> !t.completed).length

      return $adu.html`
        <div class="container">
          <div class="header">
            ${$adu.logo(36)}
            <div>
              <h2 style="margin: 0;">Task Manager</h2>
              <small style="color: var(--text-muted);">${pendingCount} remaining</small>
            </div>
          </div>

          <div class="input-group">
            <input
              type="text"
              placeholder="Add a new task..."
              value="${newText.value}"
              oninput=${(e) -> newText.value = e.target.value}
              onkeydown=${(e) -> { if (e.key === "Enter") addTask() }}
            />
            <button class="primary" onclick=${addTask}>Add</button>
          </div>

          <ul class="task-list">
            ${tasks.value.map(task -> $adu.html`
              <li class="task-item ${task.completed ? 'done' : ''}">
                <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                  <input
                    type="checkbox"
                    checked="${task.completed}"
                    onchange=${() -> toggleTask(task.id)}
                  />
                  <span>${task.text}</span>
                </label>
                <button class="delete-btn" onclick=${() -> deleteTask(task.id)}>✕</button>
              </li>
            `)}
          </ul>
        </div>
      `
    }

    // Mount to DOM
    $adu.mount("#app", App)
  </script>
</body>
</html>
```

### Example: Multi-File Project Architecture
For larger applications, split code across multiple `.ads` files. The CDN runtime automatically resolves, compiles, and links relative subfolder `.ads` imports in real time:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Modular AduScript App</title>
  <link rel="stylesheet" href="styles/main.css">
  <script src="https://cdn.jsdelivr.net/gh/AduriteTBH/AduScript@main/dist/aduscript-browser.js"></script>
</head>
<body>
  <div id="root"></div>
  <script type="text/aduscript" src="app.ads"></script>
</body>
</html>
```

---

## 3. Strict Grammar Rules for AI Models

### Rule 1: Variables and Mutability
* **`let` (Immutable):** Used for all constants and non-reassigned variables (compiles to JavaScript `const`).
* **`mut` (Mutable):** Used for any variable that will be reassigned (compiles to JavaScript `let`).
* **`state` (Reactive Signal):** Compiles to `$adu.state(...)`. Reads and mutations must use `.value`.

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

## 4. Reference Example: 3D Interactive WebGL Scene

The following is an illustrative reference example showing a 3D interactive Three.js animation running natively via AduScript:

```aduscript
use cdn:three as THREE

// Scene setup
let scene = new THREE.Scene()
let camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
let renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setSize(window.innerWidth, window.innerHeight)
document.body.appendChild(renderer.domElement)

// Lighting
let ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
let dirLight = new THREE.DirectionalLight(0xffffff, 1.0)
dirLight.position.set(5, 10, 7)
scene.add(ambientLight)
scene.add(dirLight)

// 3D Geometry
let geometry = new THREE.TorusKnotGeometry(1.2, 0.4, 128, 32)
let material = new THREE.MeshStandardMaterial({
  color: 0x38bdf8,
  roughness: 0.2,
  metalness: 0.8
})
let knot = new THREE.Mesh(geometry, material)
scene.add(knot)

camera.position.z = 4.5

// Animation loop
mut lastTime = performance.now()

fn animate() {
  requestAnimationFrame(animate)
  let now = performance.now()
  let delta = (now - lastTime) / 1000
  lastTime = now

  knot.rotation.x += delta * 0.6
  knot.rotation.y += delta * 0.9

  renderer.render(scene, camera)
}

animate()

// Window resize handler
window.addEventListener("resize", () -> {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
})
```

---

## 5. Syntax Comparison Cheat Sheet

| Feature | AduScript (.ads) | Standard JavaScript |
| :--- | :--- | :--- |
| **Immutable variable** | `let name = "John"` | `const name = "John";` |
| **Mutable variable** | `mut count = 0; count += 1` | `let count = 0; count += 1;` |
| **Reactive signal** | `state open = false; open.value = true` | `$adu.state(false)` |
| **Arrow closure** | `(a, b) -> a + b` | `(a, b) => a + b` |
| **Function** | `fn add(a, b) -> a + b` | `function add(a, b) { return a + b; }` |
| **F-String** | `f"User: {name}"` | `` `User: ${name}` `` |
| **Data pipeline** | `val \|> fn1() \|> fn2(_)` | `fn2(fn1(val))` |
| **Pattern matching** | `match x with { 1..5 => "Low", _ => "High" }` | `switch / nested ternary` |
| **CDN import** | `use cdn:three as THREE` | `import * as THREE from 'https://...'` |
| **HTML template** | `$adu.html\`<button onclick=${onClick}>+1</button>\`` | Reactive DOM Element |
| **DOM mounting** | `$adu.mount("#app", App)` | Component mount |

---

## 6. Common AI Pitfalls and Solutions

| Anti-Pattern (Do NOT Generate) | Correct AduScript Pattern | Explanation |
| :--- | :--- | :--- |
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
