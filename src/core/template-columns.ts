import { IMPORT_FIELDS } from "src/core/column-mapping";
import type { ColumnMapping, ImportField } from "src/core/column-mapping";

/** The column name of each import field in the template. */
export const FIELD_HEADERS: Readonly<Record<ImportField, string>> = {
  query: "query",
  deliverTo: "deliver_to",
  howOften: "how_often",
  howMany: "how_many",
  sources: "sources",
  language: "language",
  region: "region",
};

/** The result of the header check. */
export interface HeaderReport {
  /** For each import field, the index of its column, or null when the file has no such column. */
  readonly columnIndexes: ColumnMapping;
  /** The fields that the file must have and does not have. */
  readonly missingRequired: readonly ImportField[];
  /** The headers that match no template column, as the file writes them. */
  readonly extraColumns: readonly string[];
}

const REQUIRED_FIELDS: readonly ImportField[] = ["query"];

function normaliseHeader({ header }: { header: string }): string {
  return header.trim().toLowerCase();
}

/** Check the headers of a file against the template. Match the names exactly, ignoring case and outer spaces. Pure. */
export function checkHeaders({ headers }: { headers: readonly string[] }): HeaderReport {
  const normalised: string[] = headers.map((header: string) => normaliseHeader({ header }));
  const usedIndexes: Set<number> = new Set();
  const entries: [ImportField, number | null][] = IMPORT_FIELDS.map(
    (field: ImportField): [ImportField, number | null] => {
      const index: number = normalised.indexOf(FIELD_HEADERS[field]);
      if (index !== -1) usedIndexes.add(index);
      return [field, index === -1 ? null : index];
    },
  );
  const columnIndexes: ColumnMapping = Object.fromEntries(entries) as ColumnMapping;
  return {
    columnIndexes,
    missingRequired: REQUIRED_FIELDS.filter((field: ImportField) => columnIndexes[field] === null),
    extraColumns: headers
      .filter((_header: string, index: number) => !usedIndexes.has(index))
      .map((header: string) => header.trim())
      .filter((header: string) => header !== ""),
  };
}
