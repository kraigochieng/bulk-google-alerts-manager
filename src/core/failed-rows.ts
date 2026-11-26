import { writeCsv } from "src/core/csv";
import { EXPORT_HEADERS, exportOptionCells } from "src/core/export-csv";
import { normaliseQuery } from "src/core/query-normaliser";
import type { ItemAction, RunItem, RunSnapshot } from "src/shared/models";

export const FAILED_ROWS_FILE_NAME: string = "google-alerts-failed-rows.csv";

function failedItems({ run }: { run: RunSnapshot }): RunItem[] {
  return run.items.filter((item: RunItem) => item.status === "failed");
}

/**
 * Build a new run that holds only the failed items of a run.
 * A failed create becomes an update when the account has the query, so that a retry makes no second alert.
 */
export function buildRetryRun({ run, liveQueries }: { run: RunSnapshot; liveQueries: readonly string[] }): RunSnapshot {
  const existing: ReadonlySet<string> = new Set(liveQueries.map((query: string) => normaliseQuery({ query })));
  const items: RunItem[] = failedItems({ run }).map((item: RunItem, position: number): RunItem => {
    const exists: boolean = item.action === "create" && existing.has(normaliseQuery({ query: item.query }));
    const action: ItemAction = exists ? "update" : item.action;
    return { ...item, id: position, action, status: "pending", errorMessage: "" };
  });
  return { kind: run.kind, status: "idle", items, notice: "" };
}

/** Write the failed items of a run as a CSV file that has the template columns plus the error of each row. */
export function buildFailedRowsCsv({ run }: { run: RunSnapshot }): string {
  return writeCsv({
    table: {
      headers: [...EXPORT_HEADERS, "Error"],
      records: failedItems({ run }).map((item: RunItem) => [item.query, ...exportOptionCells({ options: item.options }), item.errorMessage]),
    },
  });
}
