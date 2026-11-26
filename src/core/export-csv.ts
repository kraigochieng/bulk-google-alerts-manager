import { IMPORT_FIELDS } from "src/core/column-mapping";
import type { ImportField } from "src/core/column-mapping";
import { writeCsv } from "src/core/csv";
import { DELIVER_TO_LABELS, HOW_MANY_LABELS, HOW_OFTEN_LABELS } from "src/core/option-labels";
import { FIELD_HEADERS } from "src/core/template-columns";
import type { AlertOptions, LiveAlert } from "src/shared/models";

export const EXPORT_FILE_NAME: string = "google-alerts-export.csv";

/** One exported alert. The options are null when the extension could not read them. */
export interface ExportEntry {
  readonly alert: LiveAlert;
  readonly options: AlertOptions | null;
}

/** The headers of the columns that an import reads, in template order. */
export const EXPORT_HEADERS: readonly string[] = IMPORT_FIELDS.map((field: ImportField) => FIELD_HEADERS[field]);

/** Write the option cells of one alert, in header order. Unread options give empty cells. */
export function exportOptionCells({ options }: { options: AlertOptions | null }): string[] {
  if (options === null) return ["", "", "", "", "", ""];
  return [
    HOW_OFTEN_LABELS[options.howOften],
    options.sources,
    options.language,
    options.region,
    HOW_MANY_LABELS[options.howMany],
    DELIVER_TO_LABELS[options.deliverTo],
  ];
}

/**
 * Write the export CSV. The Add flow imports it without a column change.
 * An alert with unread options gets empty option cells, so the import uses the app defaults.
 */
export function buildExportCsv({ entries }: { entries: readonly ExportEntry[] }): string {
  return writeCsv({
    table: {
      headers: [...EXPORT_HEADERS, "RSS link"],
      records: entries.map((entry: ExportEntry) => {
        const { alert, options } = entry;
        const cells: string[] = exportOptionCells({ options });
        // The feed link tells the delivery of an alert with unread options.
        if (options === null) cells[cells.length - 1] = DELIVER_TO_LABELS[alert.feedUrl === null ? "email" : "rss"];
        return [alert.query, ...cells, alert.feedUrl ?? ""];
      }),
    },
  });
}
