import { IMPORT_FIELDS } from "src/core/column-mapping";
import type { ImportField } from "src/core/column-mapping";
import { DELIVER_TO_LABELS, HOW_MANY_LABELS, HOW_OFTEN_LABELS } from "src/core/option-labels";
import { FIELD_HEADERS } from "src/core/template-columns";

/** The column names of the template, in the order of the Google Alerts options panel. */
export const TEMPLATE_HEADERS: readonly string[] = IMPORT_FIELDS.map((field: ImportField) => FIELD_HEADERS[field]);

/**
 * The sample rows of the template. The cells follow the order of TEMPLATE_HEADERS:
 * search query, how often, sources, language, region, how many, deliver to.
 * An empty cell means: use the default from the app.
 */
export const TEMPLATE_ROWS: readonly (readonly string[])[] = [
  ['"Jane Doe"', "", "", "", "", HOW_MANY_LABELS.all, DELIVER_TO_LABELS.rss],
  ['"Jane Doe" OR "Jane A. Doe"', "", "", "", "", HOW_MANY_LABELS.best, DELIVER_TO_LABELS.rss],
  ["solar power kenya", HOW_OFTEN_LABELS.weekly, "Automatic", "English", "Any Region", HOW_MANY_LABELS.all, DELIVER_TO_LABELS.email],
  ['site:example.com "annual report"', HOW_OFTEN_LABELS.daily, "", "French", "", HOW_MANY_LABELS.best, DELIVER_TO_LABELS.email],
];
