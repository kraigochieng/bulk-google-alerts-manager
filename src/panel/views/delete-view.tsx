import { useEffect, useMemo, useState } from "react";
import type { JSX } from "react";

import { buildDeleteRun } from "src/core/run-builders";
import { buildDeleteConfirmation } from "src/core/delete-confirmation";
import { checkDeleteGate } from "src/core/start-gates";
import type { TableColumn } from "src/core/table-query";
import type { TableSchema } from "src/core/table-state";
import { Banner } from "src/panel/components/banner";
import { ConfirmDialog } from "src/panel/components/confirm-dialog";
import { Button } from "src/panel/ui/button";
import { DataTable } from "src/panel/components/data-table";
import type { LiveAlertsState } from "src/panel/use-live-alerts";
import type { RunController } from "src/panel/use-run-controller";
import { useTableState } from "src/panel/use-table-state";
import type { LiveAlert } from "src/shared/models";

export const ALERTS_TABLE_SCHEMA: TableSchema = {
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
  const [confirmingDelete, setConfirmingDelete] = useState<boolean>(false);
  const [tableState, setTableState] = useTableState({ schema: ALERTS_TABLE_SCHEMA });

  useEffect(() => {
    setSelected(new Set());
  }, [live.alerts]);

  const selectedEntries: readonly AlertEntry[] = useMemo(
    () => (entries ?? []).filter((entry: AlertEntry) => selected.has(entry.index)),
    [entries, selected],
  );
  const gate = checkDeleteGate({ selectedCount: selectedEntries.length });
  const selectedQueries: string[] = selectedEntries.map((entry: AlertEntry) => entry.alert.query);
  const confirmation = buildDeleteConfirmation({ queries: selectedQueries, previewLimit: DELETE_PREVIEW_LIMIT });

  const columns: readonly TableColumn<AlertEntry>[] = [
    { key: "query", label: "Query", sortValue: (entry) => entry.alert.query.toLowerCase(), searchText: (entry) => entry.alert.query },
  ];

  return (
    <div>
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
                setConfirmingDelete(true);
              }}
            >
              Delete {String(selectedEntries.length)} alerts
            </Button>
            <ConfirmDialog
              open={confirmingDelete}
              title={confirmation.title}
              description={confirmation.description}
              confirmLabel="Delete"
              keepLabel="Keep"
              onConfirm={() => {
                controller.begin(buildDeleteRun({ queries: selectedQueries }));
              }}
              onOpenChange={setConfirmingDelete}
            />
          </>
        )}
      </section>
    </div>
  );
}
