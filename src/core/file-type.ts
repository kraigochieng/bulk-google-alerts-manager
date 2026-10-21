const CSV_MIME_TYPES: readonly string[] = ["text/csv", "application/csv", "application/vnd.ms-excel"];

/** Decide whether a file looks like a CSV file, by its name or its MIME type. */
export function isCsvFile({ name, type }: { name: string; type: string }): boolean {
  return name.toLowerCase().endsWith(".csv") || CSV_MIME_TYPES.includes(type.toLowerCase());
}
