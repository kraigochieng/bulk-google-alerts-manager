import { writeCsv } from "src/core/csv";
import type { AlertOptions, LiveAlert } from "src/shared/models";

export const EXPORT_FILE_NAME: string = "google-alerts-export.csv";

/** One exported alert. The options are null when the extension could not read them. */
export interface ExportEntry {
  readonly alert: LiveAlert;
  readonly options: AlertOptions | null;
}

const EXPORT_HEADERS: readonly string[] = [
  "query",
  "deliver_to",
  "how_often",
  "how_many",
  "sources",
  "language",
  "region",
  "rss_link",
];

/**
 * Write the export CSV. The Add tab imports it without a column change.
 * An alert with unread options gets empty option cells, so the import uses the panel defaults.
 */
export function buildExportCsv({ entries }: { entries: readonly ExportEntry[] }): string {
  return writeCsv({
    table: {
      headers: EXPORT_HEADERS,
      records: entries.map((entry: ExportEntry) => {
        const { alert, options } = entry;
        if (options === null) {
          return [alert.query, alert.feedUrl === null ? "email" : "rss", "", "", "", "", "", alert.feedUrl ?? ""];
        }
        return [
          alert.query,
          options.deliverTo,
          options.howOften,
          options.howMany,
          options.sources,
          options.language,
          options.region,
          alert.feedUrl ?? "",
        ];
      }),
    },
  });
}
