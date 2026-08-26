// AduScript Pipeline Formatters for YouTube Clone

export fn formatViews(count) {
  if (count >= 1000000) {
    let m = (count / 1000000).toFixed(1)
    return f"{m}M views"
  }
  if (count >= 1000) {
    let k = Math.floor(count / 1000)
    return f"{k}K views"
  }
  return f"{count} views"
}

export fn formatDuration(seconds) {
  let mins = Math.floor(seconds / 60)
  let secs = seconds % 60
  let padSecs = secs < 10 ? f"0{secs}" : f"{secs}"
  return f"{mins}:{padSecs}"
}

export fn formatSubs(count) {
  if (count >= 1000000) {
    let m = (count / 1000000).toFixed(2)
    return f"{m}M subscribers"
  }
  if (count >= 1000) {
    let k = Math.floor(count / 1000)
    return f"{k}K subscribers"
  }
  return f"{count} subscribers"
}
