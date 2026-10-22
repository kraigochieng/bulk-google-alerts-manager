import { useState } from "react";
import type { JSX } from "react";

import { buildDeleteRun } from "src/core/run-builders";
import { buildDeleteConfirmation } from "src/core/delete-confirmation";
import { checkDeleteGate } from "src/core/start-gates";
import { ConfirmDialog } from "src/panel/components/confirm-dialog";
import { Button } from "src/panel/ui/button";
import { useCheckedAlerts } from "src/panel/use-checked-alerts";
import type { RunController } from "src/panel/use-run-controller";
import type { LiveAlert } from "src/shared/models";

/** How many queries the confirmation dialog lists before it shows the count of the rest. */
const DELETE_PREVIEW_LIMIT: number = 8;

/** Render the Delete flow: the alerts checked on the page, confirm, run. Holds the confirmation state. */
export function DeleteView({ controller }: { controller: RunController }): JSX.Element {
  const checkedAlerts: readonly LiveAlert[] = useCheckedAlerts();
  const [confirmingDelete, setConfirmingDelete] = useState<boolean>(false);
  const gate = checkDeleteGate({ selectedCount: checkedAlerts.length });
  const checkedQueries: string[] = checkedAlerts.map((alert: LiveAlert) => alert.query);
  const confirmation = buildDeleteConfirmation({ queries: checkedQueries, previewLimit: DELETE_PREVIEW_LIMIT });

  return (
    <section aria-label="Delete" className="mt-3">
      <h2 className="text-sm font-semibold">Delete alerts</h2>
      <p className="text-xs text-muted-foreground">
        Check the alerts to delete in the list on the page. Use the box at the bottom of the page to check all of them.
      </p>
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
        Delete {String(checkedAlerts.length)} checked {checkedAlerts.length === 1 ? "alert" : "alerts"}
      </Button>
      <ConfirmDialog
        open={confirmingDelete}
        title={confirmation.title}
        description={confirmation.description}
        confirmLabel="Delete"
        keepLabel="Keep"
        onConfirm={() => {
          controller.begin(buildDeleteRun({ queries: checkedQueries }));
        }}
        onOpenChange={setConfirmingDelete}
      />
    </section>
  );
}
