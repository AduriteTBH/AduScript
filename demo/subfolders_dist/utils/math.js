export function double(x) {
  return (x * 2);
}
export function square(x) {
  return (x * x);
}
export function clamp(val, minVal, maxVal) {
  return Math.max(minVal, Math.min(maxVal, val));
}
export function calculateStats(count) {
  const doubled = double(count);
  const squared = square(count);
  return { doubled, squared };
}
