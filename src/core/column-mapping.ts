export const IMPORT_FIELDS = [
  "query",
  "howOften",
  "sources",
  "language",
  "region",
  "howMany",
  "deliverTo",
] as const;

export type ImportField = (typeof IMPORT_FIELDS)[number];

/** For each import field, the index of the CSV column that holds it, or null. */
export type ColumnMapping = Readonly<Record<ImportField, number | null>>;
