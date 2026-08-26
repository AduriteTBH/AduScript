# AduScript Technical Specification and System Instructions for AI Models

This document serves as the exhaustive reference manual and system instruction set for AI language models (ChatGPT, Claude, Cursor, Copilot, Gemini) authoring or refactoring AduScript (.ads) applications.

---

## 1. Architectural Overview and Execution Model

AduScript is a standalone, reactive programming language engineered to eliminate JavaScript boilerplate, heavy framework dependencies, and complex local toolchains.

### Execution Environments
1. **Zero-Build In-Browser Runtime (jsDelivr CDN):**
   * Loaded via `<script src="https://cdn.jsdelivr.net/gh/AduriteTBH/AduScript@main/dist/aduscript-browser.js"></script>`.
   * Scans the DOM on `DOMContentLoaded` for `<script type="text/aduscript">` tags.
   * Compiles source code directly in the browser using the in-memory compiler.
   * Resolves relative `.ads` submodule imports, compiling each file into isolated ECMAScript module Blob URLs in real time.
   * Automatically appends timestamp query parameters (`?_adu=...`) to avoid stale browser caching during development.
2. **Node.js CLI Toolchain:**
   * Executed via `node bin/aduscript.js [command]`.
   * Supports development servers (`dev`), Ahead-of-Time production compilation (`-o`), project scaffolding (`init`), and direct script execution (`--run`).

---

## 2. Single-File Web Applications vs Modular Multi-File Projects

### Single-File HTML Architecture
AduScript enables complete full-stack client applications to live inside a single `.html` file. Reactive state management, UI rendering, CSS styling, and functional pipelines are unified without any external bundler.

#### Example: Complete Single-File Application
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

### Multi-File Project Architecture
In multi-file setups, split logic across distinct `.ads` files using standard ESM `import` and `export` statements.

#### Directory Layout Example:
```
my-game/
├── index.html
├── app.ads
├── engine/
│   ├── world.ads
│   ├── physics.ads
│   └── audio.ads
├── components/
│   ├── hud.ads
│   └── menu.ads
└── styles/
    └── game.css
```

#### Example: Root `app.ads`
```aduscript
use cdn:three as THREE
import { createVoxelWorld } from "./engine/world.ads"
import { createPlayerPhysics } from "./engine/physics.ads"
import { createHUD } from "./components/hud.ads"

state gameState = "PLAYING"
state playerHealth = 20

let textures = generateTextures()
mut world = createVoxelWorld(textures, "seed-123")
world.generate()
```

---

## 3. Strict Grammar and Syntax Specifications

AI models must strictly follow the syntax rules outlined in this section.

### Variables and Mutability
* **`let` (Immutable):** Compiles to JavaScript `const`. Cannot be reassigned.
* **`mut` (Mutable):** Compiles to JavaScript `let`. Can be reassigned.
* **`state` (Reactive Signal):** Compiles to `$adu.state(...)`. Reads and mutations must use `.value`.
* **Prohibition:** The keyword `const` does not exist in AduScript.

```aduscript
// Correct:
let gravity = 9.81
mut speed = 0.0
speed += 1.5

state health = 100
health.value -= 10

// Incorrect:
const gravity = 9.81  // Syntax error
let speed = 0.0
speed = 1.0           // Runtime error: assignment to constant
```

### Functions and Arrow Closures
* **Function Declarations:** Declared using `fn`.
* **Block Body:** `fn calculate(a, b) { return a + b }`
* **Single Expression Auto-Return:** `fn calculate(a, b) -> a + b`
* **Closures:** Always use the thin arrow `->`.
* **Prohibitions:**
  * The `function` keyword does not exist in AduScript.
  * The fat arrow `=>` cannot be used for functions or closures. It is reserved for pattern matching.

```aduscript
// Correct:
fn double(x) -> x * 2

fn filterActive(users) {
  return users.filter(u -> u.active)
}

let sum = (a, b) -> a + b

// Incorrect:
function double(x) { return x * 2; } // Syntax error
let doubled = nums.map(x => x * 2)   // Syntax error: '=>' prohibited for closures
```

### Arithmetic Operations
* **Prohibition:** Unary `++` and `--` operators do not exist.
* **Replacement:** Always use `+= 1` or `-= 1`.

```aduscript
// Correct:
mut index = 0
index += 1
index -= 1

// Incorrect:
index++  // Syntax error
index--  // Syntax error
```

### Formatted String Interpolation (F-Strings)
* Prefixed with `f"..."`.
* Expressions are enclosed in `{}` without the `$` symbol.

```aduscript
// Correct:
let name = "Player1"
let score = 450
console.log(f"Welcome {name}, Score: {score}")

// Incorrect:
console.log(f"Welcome ${name}, Score: ${score}") // Invalid
```

### Data Pipelines (`|>`) and Placeholders (`_`)
* Piped expressions pass the left-hand operand into the first argument of the right-hand function by default.
* Use `_` to specify a non-first argument slot.

```aduscript
// Correct:
fn multiply(a, b) -> a * b
fn add(a, b) -> a + b

let value = 10
  |> multiply(2)       // Equivalent to multiply(10, 2) -> 20
  |> add(5)            // Equivalent to add(20, 5) -> 25

fn divide(numerator, denominator) -> numerator / denominator

let result = 2
  |> divide(10, _)     // Equivalent to divide(10, 2) -> 5
```

### Pattern Matching (`match ... with`)
* Matches expressions against literals, ranges (`min..max`), objects, and wildcard fallback (`_`).
* Arms use the fat arrow `=>`.

```aduscript
// Correct:
let statusText = match statusCode with {
  200 => "Success",
  400 => "Bad Request",
  404 => "Not Found",
  500..599 => "Server Error",
  _ => "Unknown Status"
}

let access = match user with {
  { role: "admin" } => "Full Access",
  { role: "editor", verified: true } => "Edit Access",
  _ => "Read Only"
}
```

### CDN Module Imports (`use`)
* Imports external ESM packages directly into browser scope.
* Syntax: `use cdn:package as Alias` or `use "https://url/+esm" as Alias`.

```aduscript
// Correct:
use cdn:three as THREE
use cdn:gsap as gsap
use "https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.3/+esm" as confetti
```

---

## 4. Reactive Runtime Primitives ($adu)

The runtime exposes the following core functions on the `$adu` global object:

### Reactive Signals (`$adu.state`)
Creates a reactive proxy signal that tracks subscribers when `.value` is read and notifies them when `.value` is mutated:
```aduscript
state counter = 0
counter.value += 1
```

### Dependency-Tracking Effects (`effect`)
Automatically runs on initialization and re-executes whenever any reactive signal read inside its body changes:
```aduscript
state query = ""

effect {
  console.log(f"Search query updated: {query.value}")
  document.title = f"Search: {query.value}"
}
```

### Explicit Signal Watchers (`watch`)
Listens to mutations on a specific reactive state variable:
```aduscript
state isPaused = false

watch isPaused => {
  if (isPaused.value) {
    pauseAudioEngine()
  } else {
    resumeAudioEngine()
  }
}
```

### Reactive Template Rendering (`$adu.html` and `$adu.mount`)
* `$adu.html\`...\`` returns a DOM element with reactive bindings.
* `$adu.mount(selector, componentFn)` mounts a root component function and re-renders upon state changes.

```aduscript
state name = "AduScript"

fn Header() {
  return $adu.html`
    <header>
      <h1>Hello, ${name.value}!</h1>
      <input value="${name.value}" oninput=${(e) -> name.value = e.target.value} />
    </header>
  `
}

$adu.mount("#root", Header)
```

---

## 5. Web Audio Synthesis in Pure AduScript

AduScript can synthesize audio procedurally via the Web Audio API without needing external sound assets:

### Example: Procedural Sound Synthesizer
```aduscript
let audioCtx = new (window.AudioContext || window.webkitAudioContext)()

export fn playTone(frequency, duration, type = "sine") {
  if (audioCtx.state === "suspended") {
    audioCtx.resume()
  }

  let osc = audioCtx.createOscillator()
  let gain = audioCtx.createGain()

  osc.type = type
  osc.frequency.setValueAtTime(frequency, audioCtx.currentTime)

  gain.gain.setValueAtTime(0.3, audioCtx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration)

  osc.connect(gain)
  gain.connect(audioCtx.destination)

  osc.start()
  osc.stop(audioCtx.currentTime + duration)
}

export fn playJumpSound() {
  playTone(220, 0.12, "square")
}

export fn playHurtSound() {
  playTone(110, 0.25, "sawtooth")
}
```

---

## 6. 3D WebGL and Canvas Graphics

### Example: Procedural 3D Canvas Texture Generation
```aduscript
use cdn:three as THREE

export fn generateNoiseTexture(width = 16, height = 16) {
  let canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height
  let ctx = canvas.getContext("2d")

  for mut x in 0..(width - 1) {
    for mut y in 0..(height - 1) {
      let val = Math.floor(Math.random() * 255)
      ctx.fillStyle = f"rgb({val}, {val}, {val})"
      ctx.fillRect(x, y, 1, 1)
    }
  }

  let texture = new THREE.CanvasTexture(canvas)
  texture.magFilter = THREE.NearestFilter
  texture.minFilter = THREE.NearestFilter
  return texture
}
```

---

## 7. Common AI Pitfalls and Solutions

| Anti-Pattern (Do NOT Generate) | Correct AduScript Pattern | Explanation |
| :--- | :--- | :--- |
| `const x = 10;` | `let x = 10` | `const` is invalid in AduScript; use `let` for immutability. |
| `let x = 0; x = 1;` | `mut x = 0; x = 1;` | `let` compiles to constant. Reassigned variables require `mut`. |
| `arr = []` to clear array | `arr.length = 0` | In-place truncation preserves array reference and avoids reassignment errors. |
| `items.map(x => x * 2)` | `items.map(x -> x * 2)` | Fat arrow `=>` is prohibited for closures. Use thin arrow `->`. |
| `function calculate() {}` | `fn calculate() {}` | The `function` keyword is invalid in AduScript. |
| `i++` or `i--` | `i += 1` or `i -= 1` | `++` and `--` do not exist. |
| `f"Hello ${name}"` | `f"Hello {name}"` | Do not include `$` inside `{}` in f-strings. |
| `import THREE from 'three'` | `use cdn:three as THREE` | Browser runtime uses CDN imports, not local node modules. |
| `signal = 10` | `signal.value = 10` | Reactive state signals must be read and mutated via `.value`. |
