import { buildFailedRowsCsv, buildRetryRun, FAILED_ROWS_FILE_NAME } from "src/core/failed-rows";
import { downloadTextFile } from "src/panel/chrome-bridge";
import type { ResultAction } from "src/panel/components/run-result-dialog";
import type { LiveAlertsState } from "src/panel/use-live-alerts";
import type { RunController } from "src/panel/use-run-controller";
import type { LiveAlert, RunSnapshot } from "src/shared/models";

/**
 * List the buttons of the result dialog for a run that has failed rows. A click downloads a file or starts a run.
 * "Retry failed" shows after a fresh read of the account, because the retry must know which alerts exist.
 */
export function failedRowActions({
  run,
  live,
  begin,
}: {
  run: RunSnapshot;
  live: LiveAlertsState;
  begin: RunController["begin"];
}): ResultAction[] {
  if (!run.items.some((item) => item.status === "failed")) return [];
  const download: ResultAction = {
    label: "Download failed rows",
    onClick: (): void => {
      downloadTextFile({ fileName: FAILED_ROWS_FILE_NAME, text: buildFailedRowsCsv({ run }) });
    },
  };
  const alerts: readonly LiveAlert[] | null = live.alerts;
  if (alerts === null || live.refreshing || live.error !== "") return [download];
  const retry: ResultAction = {
    label: "Retry failed",
    onClick: (): void => {
      begin(buildRetryRun({ run, liveQueries: alerts.map((alert: LiveAlert) => alert.query) }));
    },
  };
  return [download, retry];
}
