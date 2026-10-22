import type { JSX } from "react";

import { checkExportGate } from "src/core/start-gates";
import { Button } from "src/panel/ui/button";
import type { ExportController } from "src/panel/use-export";
import { useCheckedAlerts } from "src/panel/use-checked-alerts";
import type { LiveAlert } from "src/shared/models";

/** Render the Export flow: one button that reads the alerts checked on the page. The CSV file downloads by itself. */
export function ExportView({ exporter }: { exporter: ExportController }): JSX.Element {
  const checkedAlerts: readonly LiveAlert[] = useCheckedAlerts();
  const gate = checkExportGate({ selectedCount: checkedAlerts.length });
  const canStart: boolean = gate.allowed && exporter.state.status !== "running";

  return (
    <section aria-label="Export" className="mt-3">
      <h2 className="text-sm font-semibold">Export alerts</h2>
      <p className="text-xs text-muted-foreground">
        Check the alerts to export in the list on the page. The CSV file has each alert with its options and feed link.
        Import the file in the Add tab of another account. The extension opens each alert in edit mode to read its
        options. It changes nothing in the account.
      </p>
      <Button
        type="button"
        fullWidth
        className="mt-3"
        disabled={!canStart}
        onClick={() => {
          exporter.start({ alerts: checkedAlerts });
        }}
      >
        Export {String(checkedAlerts.length)} checked {checkedAlerts.length === 1 ? "alert" : "alerts"}
      </Button>
    </section>
  );
}
