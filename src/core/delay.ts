/** Pick a random delay in milliseconds between the minimum and the maximum, both included. */
export function pickDelayMilliseconds({
  minimumMilliseconds,
  maximumMilliseconds,
  random,
}: {
  minimumMilliseconds: number;
  maximumMilliseconds: number;
  random: () => number;
}): number {
  const lowest: number = Math.min(minimumMilliseconds, maximumMilliseconds);
  const highest: number = Math.max(minimumMilliseconds, maximumMilliseconds);
  return lowest + Math.floor(random() * (highest - lowest + 1));
}
