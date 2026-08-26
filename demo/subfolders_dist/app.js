import { $adu } from "./runtime.js";

import "./styles/main.css";
import { createHeader } from "./components/header.js";
import { createCounter } from "./components/counter.js";
const count = $adu.state(5);
function renderApp() {
  const header = createHeader("AduScript Modular Web App", "Importing components & styles seamlessly across subdirectories");
  const counter = createCounter(count);
  return $adu.html`
    <div class="app-container">
      ${header}
      ${counter}
      <div style="font-size: 12px; color: var(--text-muted); text-align: center;">
        ⚡ Built with AduScript v1.0.0 & In-Browser Dynamic Module Loader
      </div>
    </div>
  `;
}
$adu.mount("#root", renderApp);
console.log("✔ AduScript Modular Subfolder App Mounted Successfully!");
