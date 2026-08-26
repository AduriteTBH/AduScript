// Math & Pipeline Utility Module (across subfolders)
export fn double(x) -> x * 2
export fn square(x) -> x * x
export fn clamp(val, minVal, maxVal) -> Math.max(minVal, Math.min(maxVal, val))

export fn calculateStats(count) {
  let doubled = count |> double()
  let squared = count |> square()
  return { doubled, squared }
}
