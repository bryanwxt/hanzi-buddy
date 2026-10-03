/** Side of the 田字格 writing box: as big as fits beside the cue, Truffle and 继续 without the page scrolling (spec §18). */
export function writingBoxSize(width: number, height: number): number {
  const landscape = width > height && height >= 600;
  const fit = landscape ? Math.min(400, height - 240, width / 2 - 64) : Math.min(320, width - 48, height - 360);
  return Math.max(220, Math.round(fit));
}
