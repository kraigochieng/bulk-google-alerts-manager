import {
  parseDeliverTo,
  parseHowMany,
  parseHowOften,
} from "src/core/alert-options";
import type { CsvTable } from "src/core/csv";
import { findQueryIssues } from "src/core/row-validation";
import type { AlertOptionOverrides, ImportRow, RowIssue } from "src/shared/models";

export const IMPORT_FIELDS = [
  "query",
  "deliverTo",
  "howOften",
  "sources",
  "language",
  "region",
  "howMany",
] as const;

export type ImportField = (typeof IMPORT_FIELDS)[number];

/** For each import field, the index of the CSV column that holds it, or null. */
export type ColumnMapping = Readonly<Record<ImportField, number | null>>;

const HEADER_SYNONYMS: Readonly<Record<ImportField, readonly string[]>> = {
  query: ["query", "queries", "keyword", "keywords", "search", "searchterm", "term", "topic"],
  deliverTo: ["deliverto", "delivery", "deliver"],
  howOften: ["howoften", "frequency", "often"],
  sources: ["sources", "source"],
  language: ["language", "lang"],
  region: ["region", "country"],
  howMany: ["howmany", "results", "count"],
};

function simplifyHeader({ header }: { header: string }): string {
  return header.toLowerCase().replace(/[^a-z]/g, "");
}

/** Guess which column holds each field from the header names. */
export function guessMapping({ headers }: { headers: readonly string[] }): ColumnMapping {
  const simpleHeaders: string[] = headers.map((header: string) => simplifyHeader({ header }));
  const entries: [ImportField, number | null][] = IMPORT_FIELDS.map(
    (field: ImportField): [ImportField, number | null] => {
      const index: number = simpleHeaders.findIndex((simple: string) =>
        HEADER_SYNONYMS[field].includes(simple),
      );
      return [field, index === -1 ? null : index];
    },
  );
  return Object.fromEntries(entries) as ColumnMapping;
}

function cellText({
  record,
  mapping,
  field,
}: {
  record: readonly string[];
  mapping: ColumnMapping;
  field: ImportField;
}): string {
  const columnIndex: number | null = mapping[field];
  return columnIndex === null ? "" : (record[columnIndex] ?? "").trim();
}

function parseOverrides({
  record,
  mapping,
}: {
  record: readonly string[];
  mapping: ColumnMapping;
}): { overrides: AlertOptionOverrides; invalid: boolean } {
  let invalid: boolean = false;
  const overrides: { -readonly [Key in keyof AlertOptionOverrides]: AlertOptionOverrides[Key] } = {};
  const deliverText: string = cellText({ record, mapping, field: "deliverTo" });
  const howOftenText: string = cellText({ record, mapping, field: "howOften" });
  const howManyText: string = cellText({ record, mapping, field: "howMany" });
  if (deliverText !== "") {
    const value = parseDeliverTo({ text: deliverText });
    if (value === null) invalid = true;
    else overrides.deliverTo = value;
  }
  if (howOftenText !== "") {
    const value = parseHowOften({ text: howOftenText });
    if (value === null) invalid = true;
    else overrides.howOften = value;
  }
  if (howManyText !== "") {
    const value = parseHowMany({ text: howManyText });
    if (value === null) invalid = true;
    else overrides.howMany = value;
  }
  for (const field of ["sources", "language", "region"] as const) {
    const text: string = cellText({ record, mapping, field });
    if (text !== "") overrides[field] = text;
  }
  return { overrides, invalid };
}

/** Build the import rows from a CSV table and a column mapping. Row numbers start at 2. */
export function buildImportRows({
  table,
  mapping,
  maximumQueryLength,
}: {
  table: CsvTable;
  mapping: ColumnMapping;
  maximumQueryLength: number;
}): ImportRow[] {
  const queries: string[] = table.records.map((record: readonly string[]) =>
    cellText({ record, mapping, field: "query" }),
  );
  const queryIssues: RowIssue[][] = findQueryIssues({ queries, maximumQueryLength });
  return table.records.map((record: readonly string[], index: number): ImportRow => {
    const { overrides, invalid } = parseOverrides({ record, mapping });
    const issues: RowIssue[] = [...(queryIssues[index] ?? [])];
    if (invalid) issues.push("invalid_option");
    return {
      sourceRowNumber: index + 2,
      query: queries[index] ?? "",
      overrides,
      issues,
    };
  });
}
