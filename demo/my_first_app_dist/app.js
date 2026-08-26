import { $adu } from "./runtime.js";

import "./style.css";
const count = $adu.state(0);
function render() {
  return $adu.html`
    <div class="card">
      ${$adu.logo(48)}
      <h1>Welcome to demo/my_first_app</h1>
      <p>A native AduScript application</p>
      <button onclick=${(() => count.value += 1)}>Clicks: ${count.value}</button>
    </div>
  `;
}
$adu.mount("#app", render);
