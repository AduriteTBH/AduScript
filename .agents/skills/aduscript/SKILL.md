---
name: aduscript
description: Master reference and workflow skill for authoring, compiling, and running AduScript (.ads) applications, 3D WebGL scenes, reactive signals, and pipelines in Antigravity IDE.
---

# AduScript (.ads) Language Skill for Antigravity IDE

This skill equips Antigravity with full knowledge of the **AduScript** programming language toolchain, syntax rules, reactive primitives, and execution workflows.

---

## 🪐 Core Language Features & Grammar

### 1. Declarations
* **Immutable by default:** `let name = "value"` (transpiles to `const`)
* **Mutable:** `mut score = 10` (transpiles to `let`)
* **Reactive State:** `state count = 0` (transpiles to `$adu.state(0)`)

### 2. Reactivity
```aduscript
state rotationSpeed = 1.2

watch rotationSpeed => {
  console.log(f"Speed updated: {rotationSpeed.value}")
}

effect {
  document.title = f"Speed: {rotationSpeed.value}"
}
```

### 3. Auto-Returning Functions
```aduscript
fn degToRad(deg) -> deg * (Math.PI / 180)

fn calculateTax(amount, rate) {
  let tax = amount * rate
  return { amount, tax, total: amount + tax }
}
```

### 4. Pipeline Operator (`|>`) with Placeholders (`_`)
```aduscript
let result = data
  |> .filter(isActive)
  |> .map(extractId)
  |> processBatch(_, 50)
  |> formatOutput()
```

### 5. Pattern Matching (`match ... with`)
```aduscript
let badgeColor = match status with {
  "active"    => "#10b981",
  "pending"   => "#f59e0b",
  1..10       => "#38bdf8",
  { role: "admin" } => "#ec4899",
  _           => "#6b7280"
}
```

### 6. Zero-Boilerplate CDN / Module Interop (`use`)
```aduscript
use cdn:three as THREE
use cdn:gsap as gsap
use "https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.3/+esm" as confetti
```

### 7. HTML & CSS Templates
```aduscript
let card = $adu.html`
  <div class="card">
    ${$adu.logo(40)}
    <h2>Count: ${count.value}</h2>
    <button onclick=${() -> count.value += 1}>+ Increment</button>
  </div>
`

$adu.mount("#root", App)
```

---

## 🤖 AI Assistant Rules & Cheat Sheet
* **F-Strings:** Write `f"Hello {name}"` (DO NOT put `$` before `{` inside f-strings).
* **Arrow Closures:** Always use thin arrow `->` (`(a, b) -> a + b` or `item -> { ... }`).
* **Increments:** Use `count += 1` (never `count++` or `count--`).
* **Subfolder Imports:** `import { createWorld } from "./engine/world.ads"`.
* **Exporting:** `export fn name() { ... }`, `export let name = ...`.
* **Vectors & 3D:** Vector SVGs in `$adu.html`, dynamic 16x16 pixel art canvas, `use cdn:three as THREE`.

---

## 🛠️ CLI Commands & Toolchain

* **Dev Server (Zero Config):** `aduscript dev <dir>`
* **Compile Single File:** `aduscript input.ads -o output.js`
* **Compile Project / Directory:** `aduscript <dir> -o <outDir>`
* **Run in Node.js:** `aduscript script.ads --run`
* **Scaffold Project:** `aduscript init <projectName>`

