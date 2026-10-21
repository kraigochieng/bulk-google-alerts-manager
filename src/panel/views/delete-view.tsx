import { useEffect, useMemo, useState } from "react";
import type { JSX } from "react";

import { guessMapping } from "src/core/column-mapping";
import { parseCsv } from "src/core/csv";
import { normaliseQuery } from "src/core/query-normaliser";
import { deleteResultCsv } from "src/core/result-csv";
import { buildDeleteRun } from "src/core/run-builders";
import { buildDeleteConfirmationMessage } from "src/core/delete-confirmation";
import { checkDeleteGate } from "src/core/start-gates";
import type { TableColumn } from "src/core/table-query";
import type { TableSchema } from "src/core/table-state";
import { Banner } from "src/panel/components/banner";
import { Button } from "src/panel/ui/button";
import { Input } from "src/panel/ui/input";
import { Label } from "src/panel/ui/label";
import { DataTable } from "src/panel/components/data-table";
import { RUN_TABLE_SCHEMA, RunPanel } from "src/panel/components/run-panel";
import { downloadTextFile } from "src/panel/chrome-bridge";
import type { LiveAlertsState } from "src/panel/use-live-alerts";
import type { RunController } from "src/panel/use-run-controller";
import { useTableUrlState } from "src/panel/use-table-url-state";
import type { LiveAlert } from "src/shared/models";

export const ALERTS_TABLE_SCHEMA: TableSchema = {
  prefix: "alerts",
  sortKeys: ["number", "query", "delivery"],
  filters: ["all", "rss", "email", "selected"],
  defaultState: { search: "", sortKey: "number", sortDirection: "asc", page: 0, filter: "all" },
};

/** How many queries the confirmation dialog lists before it shows the count of the rest. */
const DELETE_PREVIEW_LIMIT: number = 8;

interface AlertEntry {
  readonly index: number;
  readonly alert: LiveAlert;
}

/** Render the Delete flow: read, select, confirm, run. Holds the state of the flow. */
export function DeleteView({ controller, live }: { controller: RunController; live: LiveAlertsState }): JSX.Element {
  const entries: readonly AlertEntry[] | null = useMemo(
    () => live.alerts?.map((alert: LiveAlert, index: number): AlertEntry => ({ index, alert })) ?? null,
    [live.alerts],
  );
  const [selected, setSelected] = useState<ReadonlySet<number>>(new Set());
  const [matchReport, setMatchReport] = useState<string>("");
  const [tableState, setTableState] = useTableUrlState({ schema: ALERTS_TABLE_SCHEMA });
  const [runState, setRunState] = useTableUrlState({ schema: RUN_TABLE_SCHEMA });

  useEffect(() => {
    setSelected(new Set());
    setMatchReport("");
  }, [live.alerts]);

  const selectedEntries: readonly AlertEntry[] = useMemo(
    () => (entries ?? []).filter((entry: AlertEntry) => selected.has(entry.index)),
    [entries, selected],
  );
  const gate = checkDeleteGate({ selectedCount: selectedEntries.length });

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
          <h2 className="mt-5 text-sm font-semibold">1. Your alerts</h2>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <Button type="button" variant="outline" size="sm" onClick={live.refresh}>Read my alerts again</Button>
            {entries !== null && <span>{String(entries.length)} alerts in your account.</span>}
          </div>
                    {entries === null && live.error === "" && <Banner tone="info">Reading your alerts…</Banner>}
          {entries !== null && (
            <>
              <div className="mt-2 space-y-1">
                <Label htmlFor="queries-csv" className="text-xs">Select alerts by a CSV file of queries</Label>
                <Input
                  id="queries-csv"
                  accept=".csv,text/csv"
                  aria-label="Choose a CSV file of queries to select"
                  onChange={(event) => {
                    const file: File | undefined = event.target.files?.[0];
                    if (file !== undefined) void importQueries(file);
                  }}
                  className="text-xs"
                />
              </div>
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
                                  },
                }}
                emptyMessage="No alerts match."
              />
              <h2 className="mt-5 text-sm font-semibold">2. Delete</h2>
              <Banner tone="error">
                {String(selectedEntries.length)} alerts will be deleted permanently. The extension cannot undo this. Use the Export tab first to keep a copy.
              </Banner>
              {!gate.allowed && <p className="mt-1 text-xs text-destructive">{gate.reason}</p>}
              <p className="mt-1 text-xs text-muted-foreground">Keep the Alerts tab open and in the foreground during the run. Google can slow the run or show a bot check. The run then stops and asks you to solve it.</p>
              <Button
                type="button"
                variant="destructive"
                className="mt-2"
                disabled={!gate.allowed}
                onClick={() => {
                  const queries: string[] = selectedEntries.map((entry: AlertEntry) => entry.alert.query);
                  if (window.confirm(buildDeleteConfirmationMessage({ queries, previewLimit: DELETE_PREVIEW_LIMIT }))) {
                    controller.begin(buildDeleteRun({ queries }));
                  }
                }}
              >
                Delete {String(selectedEntries.length)} alerts permanently
              </Button>
            </>
          )}
        </section>
      )}
    </div>
  );
}
