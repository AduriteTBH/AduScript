import { $adu } from "./runtime.js";

const counter = $adu.state(0);
const username = $adu.state("Developer");
const status = $adu.state("online");
const items = $adu.state(["Design System", "AST Parser", "Code Generator", "Reactive Engine"]);
function getStatsBadge(count) {
  return ((x) => `Level ${(Math.floor((x / 5)) + 1)} (${x} exp)`)(Math.max(0, count));
}
$adu.effect(() => {
  const badge = getStatsBadge(counter.value);
  console.log(`Status update: ${username.value} is ${status.value} - ${badge}`);
});
$adu.watch(counter, () => {
  console.log(`Counter incremented to: ${counter.value}`);
});
function getStatusColor(s) {
  return $adu.match(s, [
  { test: $adu.matchLiteral("online"), guard: null, body: (val) => ("#10b981") },
  { test: $adu.matchLiteral("busy"), guard: null, body: (val) => ("#f59e0b") },
  { test: $adu.matchLiteral("offline"), guard: null, body: (val) => ("#6b7280") },
  { test: $adu.matchWildcard(), guard: null, body: (val) => ("#6366f1") }
]);
}
console.log(`Status '${status.value}' color is: ${getStatusColor(status.value)}`);
