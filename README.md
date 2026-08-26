# 🪐 AduScript (`.ads`)
### A Clean, Reactive, Highly Expressive Web Programming Language Compiling to Modern ECMAScript (ES2024+)

<p align="center">
  <img src="./AduScript%20Logo%20128x128.svg" alt="AduScript Logo" width="128" height="128">
</p>

<p align="center">
  <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/License-MIT-6366f1.svg" alt="License: MIT"></a>
  <a href="https://tc39.es"><img src="https://img.shields.io/badge/Target-ECMAScript%202024%2B-38bdf8.svg" alt="Target: ES2024+"></a>
  <a href="#"><img src="https://img.shields.io/badge/Dependencies-Zero-10b981.svg" alt="Zero Dependencies"></a>
  <a href="./tests"><img src="https://img.shields.io/badge/Tests-32%2F32%20Passing-emerald.svg" alt="Tests: 32/32 Passing"></a>
  <a href="./quickstart.html"><img src="https://img.shields.io/badge/Client--Side-Zero%20Node.js%20Required-f43f5e.svg" alt="Zero Node.js Required"></a>
  <a href="https://github.com/AduriteTBH/AduScript"><img src="https://img.shields.io/badge/CDN-jsDelivr%20Ready-f59e0b.svg" alt="jsDelivr CDN Ready"></a>
</p>

---

## 💡 What is AduScript?

**AduScript** is a modern programming language engineered from first principles for building dynamic web applications, interactive user interfaces, and 3D experiences. 

It eliminates JavaScript boilerplate and heavy framework dependencies by offering **first-class reactive state signals**, **data pipelines**, **expressive pattern matching**, and **zero-boilerplate CDN imports** natively inside the language.

AduScript compiles into clean, high-performance, source-mapped **ECMAScript 2024+ (ES Modules)** that runs natively in every modern web browser, Node.js, Deno, and Bun.

---

## ⚡ Why AduScript is Better

| Feature | Standard JavaScript (ES2024) | React / Vue / Svelte | AduScript (`.ads`) |
| :--- | :--- | :--- | :--- |
| **Setup & Dependencies** | Requires bundlers / NPM setup | Heavy node_modules (100MB+) | **Zero dependencies. Works with 0 build tools.** |
| **Reactive State** | Manual DOM mutation (`document.getElementById`) | Complex hooks (`useState`, `useEffect`, dependency arrays) | **Built-in `state`, `watch`, and `effect`** |
| **Functional Pipelines** | Ugly nested functions `c(b(a(x)))` | Requires Lodash / Ramda | **Native `\|>` pipeline with `_` placeholders** |
| **Pattern Matching** | Verbose `switch` / nested `if-else` | Verbose `switch` / nested `if-else` | **Native `match ... with` & range matching (`1..10`)** |
| **External CDNs** | Messy script tags or bundler configs | Complex `npm install` | **One-line `use cdn:three as THREE`** |
| **String Formatting** | `` `Hello ${user.name}` `` | `` `Hello ${user.name}` `` | **`f"Hello {user.name}"`** |
| **HTML / UI Templates** | Manual DOM or Virtual DOM overhead | JSX requires transpiler | **Native `$adu.html` & `$adu.css` templates** |

### 🔍 Code Comparison: Reactive Counter

#### ❌ Vanilla JavaScript (30 lines of boilerplate):
```javascript
let count = 0;
const button = document.createElement('button');
button.textContent = `Clicks: ${count}`;
button.onclick = () => {
  count++;
  button.textContent = `Clicks: ${count}`;
};
document.body.appendChild(button);
```

#### ✨ AduScript (3 lines of clean code):
```aduscript
state count = 0
fn App() -> $adu.html`<button onclick=${() -> count.value += 1}>Clicks: ${count.value}</button>`
$adu.mount("#root", App)
```

---

## 🌐 5-Second Quickstart (No Node.js / No Installation)

Because AduScript is open and public, anyone can create an `.html` file anywhere in the world and use AduScript immediately:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>My AduScript App</title>
  <!-- Load AduScript Worldwide CDN Engine -->
  <script src="https://cdn.jsdelivr.net/gh/AduriteTBH/AduScript@main/dist/aduscript-browser.js"></script>
</head>
<body>
  <div id="app"></div>

  <!-- Write Pure AduScript with HTML & CSS directly -->
  <script type="text/aduscript">
    state count = 0

    fn render() {
      return $adu.html`
        <div style="font-family:sans-serif;padding:36px;background:#181818;color:#fff;border-radius:18px;">
          ${$adu.logo(48)}
          <h2>AduScript Live App</h2>
          <p>Clicks: <b>${count.value}</b></p>
          <button onclick=${() -> count.value += 1}>+ Increment</button>
        </div>
      `
    }

    $adu.mount("#app", render)
  </script>
</body>
</html>
```

---

## 📖 Complete Language Guide & Documentation

### 1. Variables: Immutable by Default
Variables declared with `let` cannot be reassigned (compiled to `const`). For reassignable variables, use `mut` (compiled to `let`):
```aduscript
let siteName = "AduScript Portal"  // Immutable
mut score = 100                    // Mutable
score = score + 25                 // Allowed
```

---

### 2. Built-in Reactive State (`state`, `watch`, `effect`)
No React, no hooks, and no virtual DOM boilerplate needed. Reactive state is built right into the language:
```aduscript
// Declare reactive signal
state speed = 1.0

// Automatic dependency-tracking reaction
effect {
  document.title = f"Current Speed: {speed.value}x"
}

// Watch explicit signal changes
watch speed => {
  console.log(f"Speed updated to: {speed.value}")
}

// Mutate value (automatically triggers reactions & UI updates)
speed.value = 2.5
```

---

### 3. Pipeline Operator (`|>`)
Transform data from left to right cleanly without nested parentheses or temporary variables:
```aduscript
fn filterActive(users) -> users.filter(u -> u.active)
fn getAges(users) -> users.map(u -> u.age)
fn calculateAverage(ages) -> ages.reduce((a, b) -> a + b, 0) / ages.length

// Left-to-right data pipeline
let avgAge = usersList
  |> filterActive()
  |> getAges()
  |> calculateAverage()
```

#### Pipeline Placeholders (`_`):
Use `_` to pass the piped value into any argument position:
```aduscript
fn applyDiscount(rate, price) -> price * (1.0 - rate)

let discountedPrice = 120 |> applyDiscount(0.15, _)
```

---

### 4. Expressive Pattern Matching (`match ... with`)
Pattern matching replaces clunky `switch` statements and fragile `if-else` chains. Supports strings, numbers, ranges (`1..10`), objects, and wildcard fallback (`_`):
```aduscript
let badgeColor = match user.role with {
  "admin"     => "#ef4444",
  "moderator" => "#3b82f6",
  "member"    => "#10b981",
  _           => "#6b7280"
}

let accessLevel = match user.age with {
  1..12  => "Child",
  13..17 => "Teen",
  18..64 => "Adult",
  _      => "Senior"
}
```

---

### 5. Concise Functions
```aduscript
// Auto-returning single expression function
fn add(a, b) -> a + b
fn square(x) -> x * x

// Multi-statement block function
fn processOrder(item, quantity) {
  let subtotal = item.price * quantity
  let tax = subtotal * 0.08
  return { subtotal, tax, total: subtotal + tax }
}
```

---

### 6. Zero-Boilerplate CDN & Module Imports (`use`)
Instantly import libraries from CDN or ES modules without package managers or config files:
```aduscript
use cdn:three as THREE
use cdn:gsap as gsap
use "https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.3/+esm" as confetti

let scene = new THREE.Scene()
```

---

### 7. Formatted String Interpolation
```aduscript
let username = "Haris"
let score = 950
console.log(f"Player {username} earned {score} points!")
```

---

### 8. Native HTML & CSS Templates
```aduscript
// Component HTML with event handlers and reactive state
fn VideoCard(video) {
  return $adu.html`
    <div class="video-card" onclick=${() -> playVideo(video.id)}>
      <img src="${video.thumbnail}" alt="${video.title}"/>
      <div class="video-info">
        <h3>${video.title}</h3>
        <p>${video.channel} • ${video.views} views</p>
      </div>
    </div>
  `
}

// Injected component styles
$adu.css`
  .video-card {
    border-radius: 12px;
    overflow: hidden;
    background: #181818;
    transition: transform 0.2s ease;
  }
  .video-card:hover {
    transform: translateY(-4px);
  }
`
```

---

### 9. Modular File Imports & Subfolders (`.ads`)
AduScript seamlessly supports multi-file project structures across subfolders with zero build step:
```aduscript
// Import functions, components, or constants from subfolder modules
import { createVoxelWorld, BLOCK_TYPES } from "./engine/world.ads"
import { createHotbar } from "./components/hotbar.ads"
import { playBlockBreak } from "./engine/audio.ads"

export fn initGame() {
  let world = createVoxelWorld()
  world.generate()
}
```

---

### 10. Vector Graphics, Procedural Pixel Art & WebGL (Three.js)
AduScript natively handles SVGs, procedural dynamic Canvas drawing, and WebGL 3D rendering:
```aduscript
use cdn:three as THREE

// In-Memory 16x16 Pixel Art Generator
export fn createPixelTexture(colorPalette) {
  let canvas = document.createElement("canvas")
  canvas.width = 16
  canvas.height = 16
  let ctx = canvas.getContext("2d")
  // Draw procedural pixels...
  return new THREE.CanvasTexture(canvas)
}

// Crisp Vector SVGs in Templates
fn RenderHeart(isFull) {
  let color = isFull ? "#ff2222" : "#333333"
  return $adu.html`
    <svg width="20" height="20" viewBox="0 0 24 24" fill="${color}">
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
    </svg>
  `
}
```

---

### 11. Official Vector SVG Logo Helper
Display the official AduScript vector logo anywhere with custom dimensions:
```aduscript
let header = $adu.html`
  <div class="header">
    ${$adu.logo(36)}
    <span>AduScript App</span>
  </div>
`
```

---

## 🛠️ CLI Developer Toolchain

AduScript includes a full-featured, zero-dependency command line toolchain:

### 1. Instant Dev Server (Zero Build Step)
Starts a local development server with on-the-fly `.ads` compilation:
```bash
node bin/aduscript.js dev demo/my_first_app
```

### 2. Compile Project for Production
Compiles all `.ads` files to standard JavaScript and automatically transforms HTML `<script src="*.ads">` to native `<script type="module" src="*.js">`:
```bash
node bin/aduscript.js demo/youtube_clone -o demo/youtube_dist
```

### 3. Scaffold a New Project
```bash
node bin/aduscript.js init my-new-app
```

### 4. Execute Directly in Node.js
```bash
node bin/aduscript.js script.ads --run
```

---

## 📺 Live Showcases & Demos

1. **3D Minecraft Voxel Game Clone (`TestAduScriptRepo`):**
   * Built 100% in pure AduScript (`.ads`), CSS, and HTML with **zero build tools and zero local compiler files**.
   * Features procedural 3D voxel terrain generation (rolling hills, bedrock, stone, ores, trees), AABB physics collision, pointer lock camera, block breaking & placing with procedural Web Audio sound synthesis, 9-slot inventory hotbar, and toggleable F3 debug screen.
2. **YouTube Clone Showcase (`demo/youtube_clone/`):**
   * Built 100% in pure AduScript (`.ads`), HTML, and CSS. Zero JavaScript application code.
   * Features interactive theater player, live comment submission, real-time search, and category filtering.
3. **3D Interactive Galaxy Studio IDE (`demo/index.html`):**
   * Interactive browser playground with live Three.js 3D viewport, code editor, AST inspector, and token visualizer.
4. **Zero-Node Quickstart Template (`quickstart.html`):**
   * Instant demonstration of client-side AduScript running with zero external tools.

---

## 🎨 IDE Support (VS Code & Antigravity IDE)

AduScript comes with official extension support:
* **Vector File Icon:** Displays the official AduScript logo for `.ads` files in the explorer tree.
* **Syntax Highlighting:** TextMate grammar for all AduScript keywords, operators, and templates.
* **Snippets:** Quick snippets for `state`, `watch`, `effect`, `match`, `fn`, and `$adu.html`.

To install the extension into your local IDE:
```bash
node scripts/install-vscode-extension.js
```
Then reload your window (<kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>P</kbd> > `Developer: Reload Window`).

---

## 🧪 Test Suite

AduScript is thoroughly tested with 32 automated unit and integration tests:
```bash
npm test
```
```
==================================================
Test Results: 32/32 Passed
✔ All test suites passed successfully!
```

---

## 📜 License

MIT License © 2026 AduriteTBH & AduScript Contributors.

