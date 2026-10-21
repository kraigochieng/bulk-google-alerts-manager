import type { JSX } from "react";

import { buildExportCsv, EXPORT_FILE_NAME } from "src/core/export-csv";
import { Banner } from "src/panel/components/banner";
import { downloadTextFile } from "src/panel/chrome-bridge";
import { Button } from "src/panel/ui/button";
import { Progress } from "src/panel/ui/progress";
import { useExport } from "src/panel/use-export";
import type { LiveAlertsState } from "src/panel/use-live-alerts";
import type { RunController } from "src/panel/use-run-controller";

/** Render the Export flow: read every alert with its options, then download one CSV. Holds the export state. */
export function ExportView({ controller, live }: { controller: RunController; live: LiveAlertsState }): JSX.Element {
  const exporter = useExport();
  const { state } = exporter;
  const runActive: boolean =
    controller.run !== null && ["running", "paused", "awaiting_captcha"].includes(controller.run.status);
  const running: boolean = state.status === "running";
  const canStart: boolean = live.alerts !== null && live.alerts.length > 0 && !running && !runActive;

  return (
    <section aria-label="Export" className="mt-3">
      <h2 className="text-sm font-semibold">Export your alerts</h2>
      <p className="text-xs text-muted-foreground">
        Write every alert with its options to a CSV file. Import the file in the Add tab of another account.
        The extension opens each alert in edit mode to read its options. It changes nothing in the account.
      </p>
      {live.alerts === null && live.error === "" && <Banner tone="info">Reading your alerts…</Banner>}
      {live.alerts?.length === 0 && <Banner tone="info">Your account has no alerts to export.</Banner>}
      {runActive && <Banner tone="warning">A run is active. Wait until it ends, then export.</Banner>}
      <div className="mt-3 flex flex-col gap-2">
        <Button
          type="button"
          size="sm"
          fullWidth
          disabled={!canStart}
          onClick={() => {
            if (live.alerts !== null) exporter.start({ alerts: live.alerts });
          }}
        >
          Start export
        </Button>
        {running && (
          <Button type="button" variant="outline" size="sm" fullWidth onClick={exporter.cancel}>
            Cancel
          </Button>
        )}
      </div>
      {state.status !== "idle" && (
        <div className="mt-2 text-xs" role="status">
          <Progress
            value={state.total === 0 ? 0 : (state.entries.length / state.total) * 100}
            className="h-1.5"
            aria-label="Export progress"
          />
          <p className="mt-1">
            {String(state.entries.length)} of {String(state.total)} alerts read.
            {state.unreadCount > 0 && ` ${String(state.unreadCount)} alerts have empty options, because the extension could not read them.`}
          </p>
          {state.status === "cancelled" && <p>The export was cancelled. The file holds the alerts read so far.</p>}
          {state.status === "finished" && <p>The export is complete.</p>}
        </div>
      )}
      {state.notice !== "" && <Banner tone="warning">{state.notice}</Banner>}
      {state.entries.length > 0 && !running && (
        <Button
          type="button"
          size="sm"
          fullWidth
          className="mt-2"
          onClick={() => {
            downloadTextFile({ fileName: EXPORT_FILE_NAME, text: buildExportCsv({ entries: state.entries }) });
          }}
        >
          Download CSV
        </Button>
      )}
    </section>
  );
}
