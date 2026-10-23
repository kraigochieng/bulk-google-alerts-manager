const HEADING_PATTERN: RegExp = /^(My alerts) \((\d+)(?: created, \d+ remaining)?\)$/i;

/**
 * Return the heading text with the created and remaining counts, for example
 * "My alerts (4 created, 996 remaining)". Return null when the text is not the Google heading. Pure.
 */
export function formatAlertsHeading({ text, cap }: { text: string; cap: number }): string | null {
  const match: RegExpMatchArray | null = HEADING_PATTERN.exec(text.trim());
  if (match === null) return null;
  const created: number = Number(match[2]);
  const remaining: number = Math.max(cap - created, 0);
  return `${match[1] ?? ""} (${String(created)} created, ${String(remaining)} remaining)`;
}
