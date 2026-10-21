import { resolveOptions } from "src/core/alert-options";
import type { AlertOptions, ImportRow, RunItem, RunSnapshot } from "src/shared/models";

/** A row of the import and what the user chose for it. */
export interface CreateEntry {
  readonly row: ImportRow;
  readonly action: "create" | "update" | "skip";
}

/** Build a create run from the entries the user checked. Skipped rows keep status "skipped". */
export function buildCreateRun({
  entries,
  defaults,
}: {
  entries: readonly CreateEntry[];
  defaults: AlertOptions;
}): RunSnapshot {
  const items: RunItem[] = entries.map(
    (entry: CreateEntry, index: number): RunItem => ({
      id: index,
      query: entry.row.query.trim(),
      action: entry.action === "update" ? "update" : "create",
      options: resolveOptions({ defaults, overrides: entry.row.overrides }),
      status: entry.action === "skip" ? "skipped" : "pending",
      errorMessage: "",
    }),
  );
  return { kind: "create", status: "idle", items, notice: "" };
}

/** Build a delete run from the queries the user selected. */
export function buildDeleteRun({ queries }: { queries: readonly string[] }): RunSnapshot {
  const items: RunItem[] = queries.map(
    (query: string, index: number): RunItem => ({
      id: index,
      query,
      action: "delete",
      options: null,
      status: "pending",
      errorMessage: "",
    }),
  );
  return { kind: "delete", status: "idle", items, notice: "" };
}
