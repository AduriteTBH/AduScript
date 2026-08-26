export function formatViews(count) {
  if ((count >= 1000000)) {
    const m = (count / 1000000).toFixed(1);
    return `${m}M views`;
  }
  if ((count >= 1000)) {
    const k = Math.floor((count / 1000));
    return `${k}K views`;
  }
  return `${count} views`;
}
export function formatDuration(seconds) {
  const mins = Math.floor((seconds / 60));
  const secs = (seconds % 60);
  const padSecs = ((secs < 10) ? `0${secs}` : `${secs}`);
  return `${mins}:${padSecs}`;
}
export function formatSubs(count) {
  if ((count >= 1000000)) {
    const m = (count / 1000000).toFixed(2);
    return `${m}M subscribers`;
  }
  if ((count >= 1000)) {
    const k = Math.floor((count / 1000));
    return `${k}K subscribers`;
  }
  return `${count} subscribers`;
}
