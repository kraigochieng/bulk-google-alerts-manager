import { useState } from "react";
import type { JSX } from "react";

import { countByStatus } from "src/core/run-machine";
import type { TableColumn } from "src/core/table-query";
import type { TableSchema, TableState } from "src/core/table-state";
import { Banner } from "src/panel/components/banner";
import { ConfirmDialog } from "src/panel/components/confirm-dialog";
import { DataTable } from "src/panel/components/data-table";
import { Badge } from "src/panel/ui/badge";
import { Button } from "src/panel/ui/button";
import { Progress } from "src/panel/ui/progress";
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
  const [confirmingCancel, setConfirmingCancel] = useState<boolean>(false);
  const counts = countByStatus({ run });
  const total: number = run.items.length;
  const finished: number = total - counts.pending;
  const isCreate: boolean = run.kind === "create";
  const finishedStatus: boolean = run.status === "completed" || run.status === "cancelled";
  return (
    <section aria-label="Run" className="mt-3 rounded-lg border bg-card p-3">
      <h2 className="text-sm font-semibold">
        {isCreate ? "Create run" : "Delete run"}: {STATUS_TEXT[run.status]}
      </h2>
      <Progress value={(finished / Math.max(total, 1)) * 100} className="mt-2" aria-label="Progress" />
      <p className="text-xs">
        {String(finished)} of {String(total)} finished. {isCreate ? `${String(counts.created)} created, ${String(counts.updated)} updated` : `${String(counts.deleted)} deleted`},{" "}
        {String(counts.skipped)} skipped, {String(counts.failed)} failed, {String(counts.pending)} pending.
      </p>
      {run.status === "running" && (
        <Banner tone="info">Keep the Alerts tab open and in the foreground. Browsers slow background tabs.</Banner>
      )}
      {run.notice !== "" && <Banner tone={run.status === "awaiting_captcha" ? "warning" : "error"}>{run.notice}</Banner>}
      <div className="mt-2 flex flex-wrap gap-2">
        {run.status === "running" && (
          <Button type="button" variant="outline" size="sm" onClick={onPause}>Pause</Button>
        )}
        {run.status === "paused" && (
          <Button type="button" size="sm" onClick={onResume}>Resume</Button>
        )}
        {run.status === "awaiting_captcha" && (
          <Button type="button" size="sm" onClick={onResume}>I solved it, continue</Button>
        )}
        {(run.status === "running" || run.status === "paused" || run.status === "awaiting_captcha") && (
          <Button type="button" variant="outline" size="sm" className="border-red-400 text-destructive" onClick={() => { setConfirmingCancel(true); }}>
            Cancel run
          </Button>
        )}
        {finishedStatus && counts.failed > 0 && (
          <Button type="button" size="sm" onClick={onRetryFailed}>Retry {String(counts.failed)} failed</Button>
        )}
        <Button type="button" variant="outline" size="sm" onClick={onExport}>Export result CSV</Button>
        {finishedStatus && (
          <Button type="button" variant="outline" size="sm" onClick={onClose}>Close results</Button>
        )}
      </div>
      <ConfirmDialog
        open={confirmingCancel}
        title={`Cancel this ${isCreate ? "create" : "delete"} run?`}
        description={`The run has ${String(total)} rows and ${String(counts.pending)} are still pending. Rows that are already finished stay finished.`}
        confirmLabel="Cancel the run"
        keepLabel="Keep running"
        onConfirm={onCancel}
        onOpenChange={setConfirmingCancel}
      />
      <DataTable<RunItem, number>
        rows={run.items}
        columns={COLUMNS}
        rowKey={(item) => item.id}
        renderCell={(item, columnKey) => {
          if (columnKey === "number") return String(item.id + 1);
          if (columnKey === "query") return item.query;
          return (
            <span>
              <Badge variant={item.status === "failed" ? "destructive" : item.status === "pending" || item.status === "skipped" ? "secondary" : "default"}>{item.status}</Badge>
              {item.rssLink !== "" && (
                <a href={item.rssLink} target="_blank" rel="noreferrer" className="ml-1 text-primary underline">feed</a>
              )}
              {item.errorMessage !== "" && <span className="block text-destructive">{item.errorMessage}</span>}
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
