// ========================================================
// AduScript Reactive UI & DOM Demonstration
// Pure .ads syntax demonstrating:
// - Fine-grained Reactive Signals ('state')
// - Automatic Dependency Tracking ('effect')
// - Signal Observers ('watch')
// - Pipeline Data Formatting ('|>')
// ========================================================

// 1. Reactive App State
state counter = 0
state username = "Developer"
state status = "online"
state items = ["Design System", "AST Parser", "Code Generator", "Reactive Engine"]

// 2. Computed Pipeline Transformation
fn getStatsBadge(count) -> count |> Math.max(0, _) |> (x -> f"Level {Math.floor(x / 5) + 1} ({x} exp)")

// 3. Reactive Effects
effect {
  let badge = getStatsBadge(counter.value)
  console.log(f"Status update: {username.value} is {status.value} - {badge}")
}

watch counter => {
  console.log(f"Counter incremented to: {counter.value}")
}

// 4. Pattern Matching Status Styler
fn getStatusColor(s) -> match s with {
  "online"  => "#10b981",
  "busy"    => "#f59e0b",
  "offline" => "#6b7280",
  _         => "#6366f1"
}

console.log(f"Status '{status.value}' color is: {getStatusColor(status.value)}")
