export type Size = [number, number]

// At 150 % scaling getSize() reads 1 px over what was set, so re-reading it on every
// collapse creeps; keep the last full size unless a side differs by more than 1.
export function nextFullSize(full: Size, now: Size): Size {
  const [fullW, fullH] = full
  const [nowW, nowH] = now
  return Math.abs(nowW - fullW) > 1 || Math.abs(nowH - fullH) > 1 ? now : full
}
