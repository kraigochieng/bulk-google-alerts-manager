import {
  parseDeliverTo,
  parseHowMany,
  parseHowOften,
} from "src/core/alert-options";
import type { CsvTable } from "src/core/csv";
import { LANGUAGE_OPTIONS, parseListedOption, REGION_OPTIONS, SOURCE_OPTIONS } from "src/core/option-lists";
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

const LISTED_OPTIONS: Readonly<Record<"sources" | "language" | "region", readonly string[]>> = {
  sources: SOURCE_OPTIONS,
  language: LANGUAGE_OPTIONS,
  region: REGION_OPTIONS,
};

function parseOverrides({
  record,
  mapping,
}: {
  record: readonly string[];
  mapping: ColumnMapping;
}): { overrides: AlertOptionOverrides; invalid: boolean; unlisted: boolean } {
  let invalid: boolean = false;
  let unlisted: boolean = false;
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
    if (text === "") continue;
    const listed: string | null = parseListedOption({ value: text, allowed: LISTED_OPTIONS[field] });
    if (listed === null) unlisted = true;
    overrides[field] = listed ?? text;
  }
  return { overrides, invalid, unlisted };
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
    const { overrides, invalid, unlisted } = parseOverrides({ record, mapping });
    const issues: RowIssue[] = [...(queryIssues[index] ?? [])];
    if (invalid) issues.push("invalid_option");
    if (unlisted) issues.push("unlisted_option");
    return {
      sourceRowNumber: index + 2,
      query: queries[index] ?? "",
      overrides,
      issues,
    };
  });
}
