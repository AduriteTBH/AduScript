// Main Modular AduScript Application
// Demonstrates cross-subfolder imports and CSS integration:
// - import "./styles/main.css"
// - import { createHeader } from "./components/header.ads"
// - import { createCounter } from "./components/counter.ads"

import "./styles/main.css"
import { createHeader } from "./components/header.ads"
import { createCounter } from "./components/counter.ads"

// 1. Reactive State
state count = 5

// 2. Render & Mount Main App
fn renderApp() {
  let header = createHeader("AduScript Modular Web App", "Importing components & styles seamlessly across subdirectories")
  let counter = createCounter(count)

  return $adu.html`
    <div class="app-container">
      ${header}
      ${counter}
      <div style="font-size: 12px; color: var(--text-muted); text-align: center;">
        ⚡ Built with AduScript v1.0.0 & In-Browser Dynamic Module Loader
      </div>
    </div>
  `
}

$adu.mount("#root", renderApp)

console.log("✔ AduScript Modular Subfolder App Mounted Successfully!")
