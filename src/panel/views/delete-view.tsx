import { useEffect, useMemo, useState } from "react";
import type { JSX } from "react";

import { deleteResultCsv } from "src/core/result-csv";
import { buildDeleteRun } from "src/core/run-builders";
import { buildDeleteConfirmationMessage } from "src/core/delete-confirmation";
import { checkDeleteGate } from "src/core/start-gates";
import type { TableColumn } from "src/core/table-query";
import type { TableSchema } from "src/core/table-state";
import { Banner } from "src/panel/components/banner";
import { Button } from "src/panel/ui/button";
import { DataTable } from "src/panel/components/data-table";
import { RUN_TABLE_SCHEMA, RunPanel } from "src/panel/components/run-panel";
import { downloadTextFile } from "src/panel/chrome-bridge";
import type { LiveAlertsState } from "src/panel/use-live-alerts";
import type { RunController } from "src/panel/use-run-controller";
import { useTableUrlState } from "src/panel/use-table-url-state";
import type { LiveAlert } from "src/shared/models";

export const ALERTS_TABLE_SCHEMA: TableSchema = {
  prefix: "alerts",
  sortKeys: ["query"],
  filters: ["all"],
  defaultState: { search: "", sortKey: "query", sortDirection: "asc", page: 0, filter: "all" },
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
  const [tableState, setTableState] = useTableUrlState({ schema: ALERTS_TABLE_SCHEMA });
  const [runState, setRunState] = useTableUrlState({ schema: RUN_TABLE_SCHEMA });

  useEffect(() => {
    setSelected(new Set());
  }, [live.alerts]);

  const selectedEntries: readonly AlertEntry[] = useMemo(
    () => (entries ?? []).filter((entry: AlertEntry) => selected.has(entry.index)),
    [entries, selected],
  );
  const gate = checkDeleteGate({ selectedCount: selectedEntries.length });

  const columns: readonly TableColumn<AlertEntry>[] = [
    { key: "query", label: "Query", sortValue: (entry) => entry.alert.query.toLowerCase(), searchText: (entry) => entry.alert.query },
  ];

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
        <section aria-label="Alerts" className="mt-3">
          {entries === null && live.error === "" && <Banner tone="info">Reading your alerts…</Banner>}
          {entries !== null && (
            <>
              <DataTable<AlertEntry, number>
                rows={entries}
                columns={columns}
                rowKey={(entry) => entry.index}
                renderCell={(entry) => <span className="font-mono">{entry.alert.query}</span>}
                schema={ALERTS_TABLE_SCHEMA}
                state={tableState}
                onStateChange={setTableState}
                filters={{ all: () => true }}
                filterLabels={{ all: "All alerts" }}
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
              <Button
                type="button"
                variant="destructive"
                fullWidth
                className="mt-3"
                disabled={!gate.allowed}
                onClick={() => {
                  const queries: string[] = selectedEntries.map((entry: AlertEntry) => entry.alert.query);
                  if (window.confirm(buildDeleteConfirmationMessage({ queries, previewLimit: DELETE_PREVIEW_LIMIT }))) {
                    controller.begin(buildDeleteRun({ queries }));
                  }
                }}
              >
                Delete {String(selectedEntries.length)} alerts
              </Button>
            </>
          )}
        </section>
      )}
    </div>
  );
}
