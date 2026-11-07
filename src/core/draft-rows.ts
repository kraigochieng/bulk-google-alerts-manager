import {
  parseDeliverTo,
  parseHowMany,
  parseHowOften,
} from "src/core/alert-options";
import { IMPORT_FIELDS } from "src/core/column-mapping";
import type { ColumnMapping, ImportField } from "src/core/column-mapping";
import type { CsvTable } from "src/core/csv";
import { LANGUAGE_OPTIONS, parseListedOption, REGION_OPTIONS, SOURCE_OPTIONS } from "src/core/option-lists";
import type { OptionField } from "src/core/row-options";
import { findQueryIssues } from "src/core/row-validation";
import type { AlertOptionOverrides, ImportRow, RowIssue } from "src/shared/models";

/** The text of the six option cells of a row. An empty text means: use the default. */
export type OptionCells = Readonly<Record<OptionField, string>>;

/** One row of the import before validation: the text that the user can still edit. */
export interface DraftRow {
  /** The row number in the file, counting the header as row 1. It never changes when another row is deleted. */
  readonly sourceRowNumber: number;
  readonly query: string;
  readonly cells: OptionCells;
}

const OPTION_FIELDS: readonly OptionField[] = IMPORT_FIELDS.filter(
  (field: ImportField): field is OptionField => field !== "query",
);

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

/** Turn the records of a table into draft rows. Row numbers start at 2. Pure. */
export function draftRowsFromTable({ table, mapping }: { table: CsvTable; mapping: ColumnMapping }): DraftRow[] {
  return table.records.map((record: readonly string[], index: number): DraftRow => {
    const cells: Record<OptionField, string> = {
      howOften: "",
      sources: "",
      language: "",
      region: "",
      howMany: "",
      deliverTo: "",
    };
    for (const field of OPTION_FIELDS) cells[field] = cellText({ record, mapping, field });
    return { sourceRowNumber: index + 2, query: cellText({ record, mapping, field: "query" }), cells };
  });
}

const LISTED_OPTIONS: Readonly<Record<"sources" | "language" | "region", readonly string[]>> = {
  sources: SOURCE_OPTIONS,
  language: LANGUAGE_OPTIONS,
  region: REGION_OPTIONS,
};

function parseOverrides({ cells }: { cells: OptionCells }): { overrides: AlertOptionOverrides; invalid: boolean; unlisted: boolean } {
  let invalid: boolean = false;
  let unlisted: boolean = false;
  const overrides: { -readonly [Key in keyof AlertOptionOverrides]: AlertOptionOverrides[Key] } = {};
  const deliverText: string = cells.deliverTo.trim();
  const howOftenText: string = cells.howOften.trim();
  const howManyText: string = cells.howMany.trim();
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
    const text: string = cells[field].trim();
    if (text === "") continue;
    const listed: string | null = parseListedOption({ value: text, allowed: LISTED_OPTIONS[field] });
    if (listed === null) unlisted = true;
    overrides[field] = listed ?? text;
  }
  return { overrides, invalid, unlisted };
}

/** Validate draft rows and build the import rows. A repeated query is marked from its second use. Pure. */
export function importRowsFromDraft({
  rows,
  maximumQueryLength,
}: {
  rows: readonly DraftRow[];
  maximumQueryLength: number;
}): ImportRow[] {
  const queries: string[] = rows.map((row: DraftRow) => row.query.trim());
  const queryIssues: RowIssue[][] = findQueryIssues({ queries, maximumQueryLength });
  return rows.map((row: DraftRow, index: number): ImportRow => {
    const { overrides, invalid, unlisted } = parseOverrides({ cells: row.cells });
    const issues: RowIssue[] = [...(queryIssues[index] ?? [])];
    if (invalid) issues.push("invalid_option");
    if (unlisted) issues.push("unlisted_option");
    return { sourceRowNumber: row.sourceRowNumber, query: queries[index] ?? "", overrides, issues };
  });
}

/** Build the import rows from a CSV table and a column mapping. Row numbers start at 2. Pure. */
export function buildImportRows({
  table,
  mapping,
  maximumQueryLength,
}: {
  table: CsvTable;
  mapping: ColumnMapping;
  maximumQueryLength: number;
}): ImportRow[] {
  return importRowsFromDraft({ rows: draftRowsFromTable({ table, mapping }), maximumQueryLength });
}
