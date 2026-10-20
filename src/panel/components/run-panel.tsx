import type { JSX } from "react";

import { countByStatus } from "src/core/run-machine";
import type { TableColumn } from "src/core/table-query";
import type { TableSchema, TableState } from "src/core/table-state";
import { Banner } from "src/panel/components/banner";
import { DataTable } from "src/panel/components/data-table";
import type { HistoryMode } from "src/panel/use-table-url-state";
import type { RunItem, RunSnapshot } from "src/shared/models";

export const RUN_TABLE_SCHEMA: TableSchema = {
  prefix: "run",
  sortKeys: ["number", "query", "status"],
  filters: ["all", "pending", "created", "deleted", "skipped", "failed"],
  defaultState: { search: "", sortKey: "number", sortDirection: "asc", page: 0, filter: "all" },
};

const COLUMNS: readonly TableColumn<RunItem>[] = [
  { key: "number", label: "#", sortValue: (item) => item.id, searchText: () => "" },
  { key: "query", label: "Query", sortValue: (item) => item.query.toLowerCase(), searchText: (item) => item.query },
  { key: "status", label: "Status", sortValue: (item) => item.status, searchText: (item) => `${item.status} ${item.errorMessage} ${item.rssLink}` },
];

const FILTERS: Record<string, (item: RunItem) => boolean> = {
  all: () => true,
  pending: (item) => item.status === "pending",
  created: (item) => item.status === "created",
  deleted: (item) => item.status === "deleted",
  skipped: (item) => item.status === "skipped",
  failed: (item) => item.status === "failed",
};

const STATUS_TEXT: Record<RunSnapshot["status"], string> = {
  idle: "Not started",
  ready: "Ready",
  running: "Running",
  paused: "Paused",
  awaiting_captcha: "Waiting for you to solve a bot check",
  completed: "Completed",
  cancelled: "Cancelled",
};

/** Render the progress, notices, controls and result table of a run. Pure: actions come as props. */
export function RunPanel({
  run,
  onPause,
  onResume,
  onCancel,
  onRetryFailed,
  onExport,
  onClose,
  tableState,
  onTableStateChange,
}: {
  run: RunSnapshot;
  onPause: () => void;
  onResume: () => void;
  onCancel: () => void;
  onRetryFailed: () => void;
  onExport: () => void;
  onClose: () => void;
  tableState: TableState;
  onTableStateChange: (next: TableState, options: { history: HistoryMode }) => void;
}): JSX.Element {
  const counts = countByStatus({ run });
  const total: number = run.items.length;
  const finished: number = total - counts.pending;
  const isCreate: boolean = run.kind === "create";
  const finishedStatus: boolean = run.status === "completed" || run.status === "cancelled";
  return (
    <section aria-label="Run" className="mt-3 rounded border border-gray-300 p-2">
      <h2 className="text-sm font-semibold">
        {isCreate ? "Create run" : "Delete run"}: {STATUS_TEXT[run.status]}
      </h2>
      <progress value={finished} max={Math.max(total, 1)} className="mt-1 w-full" aria-label="Progress" />
      <p className="text-xs">
        {String(finished)} of {String(total)} finished. {String(counts[isCreate ? "created" : "deleted"])} {isCreate ? "created" : "deleted"},{" "}
        {String(counts.skipped)} skipped, {String(counts.failed)} failed, {String(counts.pending)} pending.
      </p>
      {run.status === "running" && (
        <Banner tone="info">Keep the Alerts tab open and in the foreground. Browsers slow background tabs.</Banner>
      )}
      {run.notice !== "" && <Banner tone={run.status === "awaiting_captcha" ? "warning" : "error"}>{run.notice}</Banner>}
      <div className="mt-2 flex flex-wrap gap-2 text-sm">
        {run.status === "running" && (
          <button type="button" onClick={onPause} className="rounded border px-2 py-1">Pause</button>
        )}
        {run.status === "paused" && (
          <button type="button" onClick={onResume} className="rounded bg-blue-600 px-2 py-1 text-white">Resume</button>
        )}
        {run.status === "awaiting_captcha" && (
          <button type="button" onClick={onResume} className="rounded bg-blue-600 px-2 py-1 text-white">I solved it, continue</button>
        )}
        {(run.status === "running" || run.status === "paused" || run.status === "awaiting_captcha") && (
          <button
            type="button"
            onClick={() => {
              if (window.confirm(`Cancel this ${isCreate ? "create" : "delete"} run? Finished rows stay finished.`)) onCancel();
            }}
            className="rounded border border-red-400 px-2 py-1 text-red-700"
          >
            Cancel run
          </button>
        )}
        {finishedStatus && counts.failed > 0 && (
          <button type="button" onClick={onRetryFailed} className="rounded bg-blue-600 px-2 py-1 text-white">
            Retry {String(counts.failed)} failed
          </button>
        )}
        <button type="button" onClick={onExport} className="rounded border px-2 py-1">Export result CSV</button>
        {finishedStatus && (
          <button type="button" onClick={onClose} className="rounded border px-2 py-1">Close results</button>
        )}
      </div>
      <DataTable<RunItem, number>
        rows={run.items}
        columns={COLUMNS}
        rowKey={(item) => item.id}
        renderCell={(item, columnKey) => {
          if (columnKey === "number") return String(item.id + 1);
          if (columnKey === "query") return item.query;
          return (
            <span>
              <strong>{item.status}</strong>
              {item.rssLink !== "" && (
                <a href={item.rssLink} target="_blank" rel="noreferrer" className="ml-1 text-blue-700 underline">feed</a>
              )}
              {item.errorMessage !== "" && <span className="block text-red-700">{item.errorMessage}</span>}
            </span>
          );
        }}
        schema={RUN_TABLE_SCHEMA}
        state={tableState}
        onStateChange={onTableStateChange}
        filters={FILTERS}
        filterLabels={{ all: "All", pending: "Pending", created: "Created", deleted: "Deleted", skipped: "Skipped", failed: "Failed" }}
        emptyMessage="No rows."
      />
    </section>
  );
}
