import { writeCsv } from "src/core/csv";
import type { RunItem } from "src/shared/models";

/** Write the result CSV of a create run: query, status, rss_link, error. */
export function createResultCsv({ items }: { items: readonly RunItem[] }): string {
  return writeCsv({
    table: {
      headers: ["query", "status", "rss_link", "error"],
      records: items.map((item: RunItem) => [item.query, item.status, item.rssLink, item.errorMessage]),
    },
  });
}

/** Write the result CSV of a delete run: query, status, error. */
export function deleteResultCsv({ items }: { items: readonly RunItem[] }): string {
  return writeCsv({
    table: {
      headers: ["query", "status", "error"],
      records: items.map((item: RunItem) => [item.query, item.status, item.errorMessage]),
    },
  });
}
