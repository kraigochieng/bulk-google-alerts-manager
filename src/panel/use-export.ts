import { useCallback, useEffect, useRef, useState } from "react";

import type { ExportEntry } from "src/core/export-csv";
import type { ExportStatus } from "src/core/export-progress";
import { sendToAlertsTab } from "src/panel/chrome-bridge";
import type { AlertOptions, LiveAlert } from "src/shared/models";

/** The state of one export. */
export interface ExportState {
  readonly status: ExportStatus;
  readonly entries: readonly ExportEntry[];
  readonly total: number;
  readonly unreadCount: number;
  readonly notice: string;
}

/** The export state and the actions that change it. */
export interface ExportController {
  readonly state: ExportState;
  readonly start: (parameters: { alerts: readonly LiveAlert[] }) => void;
  readonly cancel: () => void;
  readonly reset: () => void;
}

const IDLE_STATE: ExportState = { status: "idle", entries: [], total: 0, unreadCount: 0, notice: "" };

/** Ask the Alerts tab for the options of one alert. Side effect: messages the Alerts tab. */
async function readOptions({ query }: { query: string }): Promise<AlertOptions | "bot_check" | null> {
  const reply = await sendToAlertsTab({ request: { kind: "read_alert_options", query } });
  if (reply.ok) return reply.kind === "alert_options" ? reply.options : null;
  return reply.botCheck ? "bot_check" : null;
}

/**
 * Hold one export of all alerts. Side effect: reads each alert in edit mode, one after the other.
 * An alert that cannot be read stays in the result with empty options. A bot check stops the export.
 */
export function useExport(): ExportController {
  const [state, setState] = useState<ExportState>(IDLE_STATE);
  const cancelledRef = useRef<boolean>(false);

  useEffect(() => {
    return (): void => {
      cancelledRef.current = true;
    };
  }, []);

  const start = useCallback(({ alerts }: { alerts: readonly LiveAlert[] }): void => {
    cancelledRef.current = false;
    const run = async (): Promise<void> => {
      const entries: ExportEntry[] = [];
      let unreadCount: number = 0;
      setState({ ...IDLE_STATE, status: "running", total: alerts.length });
      for (const alert of alerts) {
        if (cancelledRef.current) {
          setState({ status: "cancelled", entries, total: alerts.length, unreadCount, notice: "" });
          return;
        }
        let result: AlertOptions | "bot_check" | null = null;
        try {
          result = await readOptions({ query: alert.query });
        } catch {
          result = null;
        }
        if (result === "bot_check") {
          setState({
            status: "stopped",
            entries,
            total: alerts.length,
            unreadCount,
            notice: "Google asked for a bot check. Solve it in the Alerts tab, then export again.",
          });
          return;
        }
        if (result === null) unreadCount += 1;
        entries.push({ alert, options: result });
        setState({ status: "running", entries: [...entries], total: alerts.length, unreadCount, notice: "" });
      }
      setState({ status: "finished", entries, total: alerts.length, unreadCount, notice: "" });
    };
    void run();
  }, []);

  const cancel = useCallback((): void => {
    cancelledRef.current = true;
  }, []);

  const reset = useCallback((): void => {
    setState(IDLE_STATE);
  }, []);

  return { state, start, cancel, reset };
}
