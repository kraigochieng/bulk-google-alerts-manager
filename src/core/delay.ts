/** Fixed range of the random wait between two alerts in a run. It is not a user setting. */
export const RUN_DELAY_RANGE_MILLISECONDS: { readonly minimum: number; readonly maximum: number } = {
  minimum: 6000,
  maximum: 14000,
};

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
