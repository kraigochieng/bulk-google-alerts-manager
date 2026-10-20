import { useCallback, useEffect, useMemo, useState } from "react";
import type { JSX } from "react";

import { guessMapping } from "src/core/column-mapping";
import { parseCsv } from "src/core/csv";
import { normaliseQuery } from "src/core/query-normaliser";
import { backupCsv, deleteResultCsv } from "src/core/result-csv";
import { buildDeleteRun } from "src/core/run-builders";
import { checkDeleteGate, deleteConfirmationText } from "src/core/start-gates";
import type { TableColumn } from "src/core/table-query";
import type { TableSchema } from "src/core/table-state";
import { Banner } from "src/panel/components/banner";
import { DataTable } from "src/panel/components/data-table";
import { RUN_TABLE_SCHEMA, RunPanel } from "src/panel/components/run-panel";
import { downloadTextFile, sendToAlertsTab } from "src/panel/chrome-bridge";
import type { RunController } from "src/panel/use-run-controller";
import { useTableUrlState } from "src/panel/use-table-url-state";
import type { LiveAlert } from "src/shared/models";

export const ALERTS_TABLE_SCHEMA: TableSchema = {
  prefix: "alerts",
  sortKeys: ["number", "query", "delivery"],
  filters: ["all", "rss", "email", "selected"],
  defaultState: { search: "", sortKey: "number", sortDirection: "asc", page: 0, filter: "all" },
};

interface AlertEntry {
  readonly index: number;
  readonly alert: LiveAlert;
}

/** Render the bulk delete flow: read, select, backup, confirm, run. Holds the state of the flow. */
export function DeleteView({ controller }: { controller: RunController }): JSX.Element {
  const [entries, setEntries] = useState<readonly AlertEntry[] | null>(null);
  const [readError, setReadError] = useState<string>("");
  const [selected, setSelected] = useState<ReadonlySet<number>>(new Set());
  const [backupExported, setBackupExported] = useState<boolean>(false);
  const [typedText, setTypedText] = useState<string>("");
  const [matchReport, setMatchReport] = useState<string>("");
  const [tableState, setTableState] = useTableUrlState({ schema: ALERTS_TABLE_SCHEMA });
  const [runState, setRunState] = useTableUrlState({ schema: RUN_TABLE_SCHEMA });

  const readAlerts = useCallback(async (): Promise<void> => {
    setReadError("");
    try {
      const reply = await sendToAlertsTab({ request: { kind: "read_alerts" } });
      if (reply.ok && reply.kind === "alerts") {
        setEntries(reply.alerts.map((alert: LiveAlert, index: number) => ({ index, alert })));
        setSelected(new Set());
        setBackupExported(false);
        setTypedText("");
        setMatchReport("");
      } else {
        setReadError(reply.ok ? "Unexpected reply from the Alerts tab." : reply.message);
      }
    } catch (error: unknown) {
      setReadError(error instanceof Error ? error.message : "Could not read the Alerts tab.");
    }
  }, []);

  useEffect(() => {
    if (controller.run === null) void readAlerts();
  }, [controller.run, readAlerts]);

  const selectedEntries: readonly AlertEntry[] = useMemo(
    () => (entries ?? []).filter((entry: AlertEntry) => selected.has(entry.index)),
    [entries, selected],
  );
  const gate = checkDeleteGate({ selectedCount: selectedEntries.length, backupExported, typedText });

  const columns: readonly TableColumn<AlertEntry>[] = [
    { key: "number", label: "#", sortValue: (entry) => entry.index, searchText: () => "" },
    { key: "query", label: "Query", sortValue: (entry) => entry.alert.query.toLowerCase(), searchText: (entry) => entry.alert.query },
    { key: "delivery", label: "Delivery", sortValue: (entry) => (entry.alert.feedUrl === null ? "email" : "rss"), searchText: (entry) => (entry.alert.feedUrl === null ? "email" : "rss") },
  ];

  const importQueries = async (file: File): Promise<void> => {
    if (entries === null) return;
    try {
      const table = parseCsv({ text: await file.text() });
      const queryColumn: number = guessMapping({ headers: table.headers }).query ?? 0;
      const wanted: Set<string> = new Set(
        table.records.map((record: readonly string[]) => normaliseQuery({ query: record[queryColumn] ?? "" })).filter((query: string) => query !== ""),
      );
      const matched: AlertEntry[] = entries.filter((entry: AlertEntry) => wanted.has(normaliseQuery({ query: entry.alert.query })));
      setSelected(new Set(matched.map((entry: AlertEntry) => entry.index)));
      setTypedText("");
      setMatchReport(`${String(matched.length)} alerts match. ${String(wanted.size - new Set(matched.map((entry: AlertEntry) => normaliseQuery({ query: entry.alert.query }))).size)} queries in the file match no alert.`);
    } catch (error: unknown) {
      setMatchReport(error instanceof Error ? error.message : "The file could not be read.");
    }
  };

  const run = controller.run;
  if (run !== null && run.kind !== "delete") {
    return <Banner tone="warning">A create run is open. Finish or close it before you delete alerts.</Banner>;
  }
  const runActive: boolean = run !== null && ["running", "paused", "awaiting_captcha"].includes(run.status);

  return (
    <div>
      {run !== null && (
        <RunPanel
          run={run}
          onPause={() => { controller.send({ type: "pause", reason: "You paused the run." }); }}
          onResume={controller.resume}
          onCancel={() => { controller.send({ type: "cancel" }); }}
          onRetryFailed={controller.resume}
          onExport={() => { downloadTextFile({ fileName: "delete-results.csv", text: deleteResultCsv({ items: run.items }) }); }}
          onClose={controller.clear}
          tableState={runState}
          onTableStateChange={setRunState}
        />
      )}
      {!runActive && run === null && (
        <section aria-label="Alerts">
          <h2 className="mt-3 text-sm font-semibold">1. Your alerts</h2>
          <div className="flex items-center gap-2 text-xs">
            <button type="button" onClick={() => { void readAlerts(); }} className="rounded border px-2 py-0.5">Read my alerts again</button>
            {entries !== null && <span>{String(entries.length)} alerts in your account.</span>}
          </div>
          {readError !== "" && <Banner tone="error">{readError}</Banner>}
          {entries === null && readError === "" && <Banner tone="info">Reading your alerts…</Banner>}
          {entries !== null && (
            <>
              <label className="mt-2 block text-xs">
                Select alerts by a CSV file of queries
                <input
                  type="file"
                  accept=".csv,text/csv"
                  aria-label="Choose a CSV file of queries to select"
                  onChange={(event) => {
                    const file: File | undefined = event.target.files?.[0];
                    if (file !== undefined) void importQueries(file);
                  }}
                  className="mt-0.5 block"
                />
              </label>
              {matchReport !== "" && <p className="mt-1 text-xs">{matchReport}</p>}
              <DataTable<AlertEntry, number>
                rows={entries}
                columns={columns}
                rowKey={(entry) => entry.index}
                renderCell={(entry, columnKey) => {
                  if (columnKey === "number") return String(entry.index + 1);
                  if (columnKey === "query") return <span className="font-mono">{entry.alert.query}</span>;
                  return entry.alert.feedUrl === null ? "Email" : "RSS";
                }}
                schema={ALERTS_TABLE_SCHEMA}
                state={tableState}
                onStateChange={setTableState}
                filters={{
                  all: () => true,
                  rss: (entry) => entry.alert.feedUrl !== null,
                  email: (entry) => entry.alert.feedUrl === null,
                  selected: (entry) => selected.has(entry.index),
                }}
                filterLabels={{ all: "All alerts", rss: "RSS only", email: "Email only", selected: "Selected" }}
                selection={{
                  selected,
                  isSelectable: () => true,
                  onToggleMany: (keys, checked) => {
                    const next = new Set(selected);
                    for (const key of keys) {
                      if (checked) next.add(key);
                      else next.delete(key);
                    }
                    setSelected(next);
                    setTypedText("");
                  },
                }}
                emptyMessage="No alerts match."
              />
              <h2 className="mt-3 text-sm font-semibold">2. Export a backup (required)</h2>
              <p className="text-xs text-gray-600">Deletion is permanent. The backup CSV can be imported again in bulk create.</p>
              <button
                type="button"
                onClick={() => {
                  downloadTextFile({ fileName: "alerts-backup.csv", text: backupCsv({ alerts: entries.map((entry: AlertEntry) => entry.alert) }) });
                  setBackupExported(true);
                }}
                className="mt-1 rounded border px-2 py-1 text-sm"
              >
                Export backup of all {String(entries.length)} alerts
              </button>
              <p role="status" className="mt-1 text-xs">{backupExported ? "Backup exported." : "Backup not exported yet."}</p>
              <h2 className="mt-3 text-sm font-semibold">3. Confirm</h2>
              <Banner tone="error">
                {String(selectedEntries.length)} alerts will be deleted permanently. The extension cannot undo this.
              </Banner>
              <ul aria-label="Alerts to delete" className="mt-1 max-h-32 list-disc overflow-y-auto pl-5 text-xs">
                {selectedEntries.map((entry: AlertEntry) => (
                  <li key={entry.index} className="font-mono">{entry.alert.query}</li>
                ))}
              </ul>
              <label className="mt-2 block text-xs">
                Type {deleteConfirmationText({ count: selectedEntries.length })} to confirm
                <span className="relative block">
                  <input
                    type="text"
                    value={typedText}
                    onChange={(event) => { setTypedText(event.target.value); }}
                    className="mt-0.5 w-full rounded border border-gray-300 px-2 py-1 pr-6 text-sm"
                  />
                  {typedText !== "" && (
                    <button type="button" aria-label="Clear confirmation text" onClick={() => { setTypedText(""); }} className="absolute right-1 top-1.5 px-1 text-gray-500">×</button>
                  )}
                </span>
              </label>
              {!gate.allowed && <p className="mt-1 text-xs text-red-700">{gate.reason}</p>}
              <p className="mt-1 text-xs text-gray-600">Keep the Alerts tab open and in the foreground during the run. Google can slow the run or show a bot check. The run then stops and asks you to solve it.</p>
              <button
                type="button"
                disabled={!gate.allowed}
                onClick={() => {
                  controller.begin(buildDeleteRun({ queries: selectedEntries.map((entry: AlertEntry) => entry.alert.query) }));
                }}
                className="mt-2 rounded bg-red-700 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-40"
              >
                Delete {String(selectedEntries.length)} alerts permanently
              </button>
            </>
          )}
        </section>
      )}
    </div>
  );
}
