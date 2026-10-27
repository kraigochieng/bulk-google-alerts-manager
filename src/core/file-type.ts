const CSV_MIME_TYPES: readonly string[] = ["text/csv", "application/csv", "application/vnd.ms-excel"];

const XLSX_MIME_TYPE: string = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

/** Decide whether a file looks like an xlsx file, by its name or its MIME type. */
export function isXlsxFile({ name, type }: { name: string; type: string }): boolean {
  return name.toLowerCase().endsWith(".xlsx") || type.toLowerCase() === XLSX_MIME_TYPE;
}

/** Decide whether a file looks like a CSV file, by its name or its MIME type. */
export function isCsvFile({ name, type }: { name: string; type: string }): boolean {
  return name.toLowerCase().endsWith(".csv") || CSV_MIME_TYPES.includes(type.toLowerCase());
}
