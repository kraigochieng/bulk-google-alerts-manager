import type { JSX } from "react";

import { Banner } from "src/panel/components/banner";
import { Button } from "src/panel/ui/button";
import type { ExportController } from "src/panel/use-export";
import type { LiveAlertsState } from "src/panel/use-live-alerts";

/** Render the Export flow: one button that reads every alert with its options. The CSV file downloads by itself. */
export function ExportView({ exporter, live }: { exporter: ExportController; live: LiveAlertsState }): JSX.Element {
  const canStart: boolean = live.alerts !== null && live.alerts.length > 0 && exporter.state.status !== "running";

  return (
    <section aria-label="Export" className="mt-3">
      <h2 className="text-sm font-semibold">Export your alerts</h2>
      <p className="text-xs text-muted-foreground">
        Write every alert with its options and feed link to a CSV file. Import the file in the Add tab of another account.
        The extension opens each alert in edit mode to read its options. It changes nothing in the account.
      </p>
      {live.alerts === null && live.error === "" && <Banner tone="info">Reading your alerts…</Banner>}
      {live.alerts?.length === 0 && <Banner tone="info">Your account has no alerts to export.</Banner>}
      <Button
        type="button"
        fullWidth
        className="mt-3"
        disabled={!canStart}
        onClick={() => {
          if (live.alerts !== null) exporter.start({ alerts: live.alerts });
        }}
      >
        Start export
      </Button>
    </section>
  );
}
