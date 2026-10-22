import { useCallback, useEffect, useState } from "react";

import { sendToAlertsTab } from "src/panel/chrome-bridge";
import type { LiveAlert, RunStatus } from "src/shared/models";

/** The alerts that exist in the account, read from the Alerts page. */
export interface LiveAlertsState {
  readonly alerts: readonly LiveAlert[] | null;
  readonly error: string;
  readonly refreshing: boolean;
  readonly refresh: () => void;
}

/**
 * Hold one shared read of the live alert list. Side effect: reads the Alerts page.
 * It reads at the start and when a run leaves the running state. It never reads during a run.
 */
export function useLiveAlerts({ runStatus }: { runStatus: RunStatus | null }): LiveAlertsState {
  const [alerts, setAlerts] = useState<readonly LiveAlert[] | null>(null);
  const [error, setError] = useState<string>("");
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const refresh = useCallback((): void => {
    setRefreshing(true);
    setError("");
    sendToAlertsTab({ request: { kind: "read_alerts" } })
      .then((reply) => {
        if (reply.ok && reply.kind === "alerts") setAlerts(reply.alerts);
        else setError(reply.ok ? "Unexpected reply from the Alerts page." : reply.message);
      })
      .catch((caught: unknown) => {
        setError(caught instanceof Error ? caught.message : "Could not read the Alerts page.");
      })
      .finally(() => {
        setRefreshing(false);
      });
  }, []);

  const running: boolean = runStatus === "running";
  useEffect(() => {
    if (!running) refresh();
  }, [runStatus, running, refresh]);

  return { alerts, error, refreshing, refresh };
}
