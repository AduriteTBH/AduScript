// demo/my_first_app - Built with AduScript
import "./style.css"

state count = 0

fn render() {
  return $adu.html`
    <div class="card">
      ${$adu.logo(48)}
      <h1>Welcome to demo/my_first_app</h1>
      <p>A native AduScript application</p>
      <button onclick=${() -> count.value += 1}>Clicks: ${count.value}</button>
    </div>
  `
}

$adu.mount("#app", render)
