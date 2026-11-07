import { IMPORT_FIELDS } from "src/core/column-mapping";
import type { ImportField } from "src/core/column-mapping";
import { FIELD_HEADERS } from "src/core/template-columns";

/** The column names of the template, in the order of the Google Alerts options panel. */
export const TEMPLATE_HEADERS: readonly string[] = IMPORT_FIELDS.map((field: ImportField) => FIELD_HEADERS[field]);
