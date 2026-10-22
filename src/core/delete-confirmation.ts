/** The title and the text of the confirmation dialog of a delete run. */
export interface DeleteConfirmation {
  readonly title: string;
  readonly description: string;
}

/** Build the confirmation dialog of a delete run. The title names the count. The text lists the first queries. */
export function buildDeleteConfirmation({
  queries,
  previewLimit,
}: {
  queries: readonly string[];
  previewLimit: number;
}): DeleteConfirmation {
  const shown: string[] = queries.slice(0, previewLimit).map((query: string) => `- ${query}`);
  const hiddenCount: number = queries.length - shown.length;
  const lines: string[] = ["You cannot undo this. Use Export first to keep a copy.", "", ...shown];
  if (hiddenCount > 0) {
    lines.push(`...and ${String(hiddenCount)} more`);
  }
  return {
    title: `Delete ${String(queries.length)} ${queries.length === 1 ? "alert" : "alerts"} permanently?`,
    description: lines.join("\n"),
  };
}
