/** Number of finished items before the estimate shows. */
export const MINIMUM_FINISHED_FOR_ESTIMATE: number = 3;

/**
 * Estimate the time left in milliseconds from the time spent and the items finished since the overlay opened.
 * Return null until enough items finish. Pure.
 */
export function estimateTimeLeft({
  elapsedMilliseconds,
  finishedSinceStart,
  remaining,
}: {
  elapsedMilliseconds: number;
  finishedSinceStart: number;
  remaining: number;
}): number | null {
  if (finishedSinceStart < MINIMUM_FINISHED_FOR_ESTIMATE || elapsedMilliseconds <= 0) return null;
  return Math.round((elapsedMilliseconds / finishedSinceStart) * Math.max(remaining, 0));
}

/** Write a time span as text, for example "about 2 minutes". Pure. */
export function describeTimeLeft({ milliseconds }: { milliseconds: number }): string {
  const seconds: number = Math.round(milliseconds / 1000);
  if (seconds < 60) return "less than 1 minute";
  const minutes: number = Math.round(seconds / 60);
  if (minutes < 60) return `about ${String(minutes)} ${minutes === 1 ? "minute" : "minutes"}`;
  const hours: number = Math.floor(minutes / 60);
  const rest: number = minutes % 60;
  return `about ${String(hours)} ${hours === 1 ? "hour" : "hours"}${rest === 0 ? "" : ` ${String(rest)} min`}`;
}
