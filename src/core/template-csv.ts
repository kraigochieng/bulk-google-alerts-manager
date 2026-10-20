import { writeCsv } from "src/core/csv";

export const TEMPLATE_FILE_NAME: string = "bulk-alerts-template.csv";

const TEMPLATE_HEADERS: readonly string[] = [
  "query",
  "deliver_to",
  "how_often",
  "how_many",
  "sources",
  "language",
  "region",
  "label",
];

const TEMPLATE_ROWS: readonly (readonly string[])[] = [
  ['"Jane Doe"', "rss", "", "all", "", "", "", "people"],
  ['"Jane Doe" OR "Jane A. Doe"', "rss", "", "best", "", "", "", "people"],
  ["solar power kenya", "email", "weekly", "all", "Automatic", "English", "Any Region", "energy"],
  ['site:example.com "annual report"', "email", "daily", "best", "", "French", "", "reports"],
];

/** Build the template CSV. An empty cell means: use the default from the panel. */
export function buildTemplateCsv(): string {
  return writeCsv({ table: { headers: TEMPLATE_HEADERS, records: TEMPLATE_ROWS } });
}
