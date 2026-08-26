// Reactive Counter Component
import { calculateStats } from "../utils/math.ads"

export fn createCounter(countState) {
  let stats = calculateStats(countState.value)

  return $adu.html`
    <div class="card">
      <div class="card-title">Reactive State Counter</div>
      <div class="counter-value">${countState.value}</div>
      <div style="font-size: 13px; color: var(--text-muted); margin-bottom: 16px;">
        Pipeline Metrics: 2x = <b>${stats.doubled}</b> | x² = <b>${stats.squared}</b>
      </div>
      <div class="btn-group">
        <button class="btn btn-inc" onclick=${() -> { countState.value += 1 }}>+ Increment</button>
        <button class="btn btn-dec" onclick=${() -> { countState.value -= 1 }}>- Decrement</button>
        <button class="btn btn-dec" onclick=${() -> { countState.value = 0 }}>Reset</button>
      </div>
    </div>
  `
}
