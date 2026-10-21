/** Build the text of the confirmation dialog for a delete run. It names the count and the first queries. */
export function buildDeleteConfirmationMessage({
  queries,
  previewLimit,
}: {
  queries: readonly string[];
  previewLimit: number;
}): string {
  const shown: string[] = queries.slice(0, previewLimit).map((query: string) => `- ${query}`);
  const hiddenCount: number = queries.length - shown.length;
  const lines: string[] = [
    `Delete ${String(queries.length)} ${queries.length === 1 ? "alert" : "alerts"} permanently?`,
    "You cannot undo this.",
    "",
    ...shown,
  ];
  if (hiddenCount > 0) {
    lines.push(`...and ${String(hiddenCount)} more`);
  }
  return lines.join("\n");
}
