import { resolveOptions } from "src/core/alert-options";
import { IMPORT_FIELDS } from "src/core/column-mapping";
import type { ImportField } from "src/core/column-mapping";
import { DELIVER_TO_LABELS, HOW_MANY_LABELS, HOW_OFTEN_LABELS } from "src/core/option-labels";
import { FIELD_HEADERS } from "src/core/template-columns";
import type { AlertOptions, ImportRow } from "src/shared/models";

/** The import fields that are alert options. The search query is not one of them. */
export type OptionField = Exclude<ImportField, "query">;

/** Where the final value of an option comes from: the row, the defaults, or the RSS rule that forces As-it-happens. */
export type OptionSource = "row" | "default" | "forced";

/** The final value of one option of one row, as text for the user. */
export interface RowOptionView {
  readonly field: OptionField;
  readonly label: string;
  readonly value: string;
  readonly source: OptionSource;
}

const OPTION_FIELDS: readonly OptionField[] = IMPORT_FIELDS.filter(
  (field: ImportField): field is OptionField => field !== "query",
);

function valueText({ field, options }: { field: OptionField; options: AlertOptions }): string {
  if (field === "howOften") return HOW_OFTEN_LABELS[options.howOften];
  if (field === "howMany") return HOW_MANY_LABELS[options.howMany];
  if (field === "deliverTo") return DELIVER_TO_LABELS[options.deliverTo];
  return options[field];
}

/**
 * Describe the final options of a row, in the order of the template. A blank cell takes the default value.
 * An RSS alert always uses As-it-happens. Pure.
 */
export function describeRowOptions({
  row,
  defaults,
}: {
  row: Pick<ImportRow, "overrides">;
  defaults: AlertOptions;
}): RowOptionView[] {
  const finalOptions: AlertOptions = resolveOptions({ defaults, overrides: row.overrides });
  return OPTION_FIELDS.map((field: OptionField): RowOptionView => {
    const forced: boolean = field === "howOften" && finalOptions.deliverTo === "rss";
    const source: OptionSource = forced ? "forced" : row.overrides[field] === undefined ? "default" : "row";
    return { field, label: FIELD_HEADERS[field], value: valueText({ field, options: finalOptions }), source };
  });
}
