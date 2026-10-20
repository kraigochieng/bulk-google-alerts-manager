import { useEffect, useState } from "react";

import { findAlertsTab, sendToAlertsTab } from "src/panel/chrome-bridge";

export type AlertsTabStatus = "checking" | "ready" | "no_tab" | "no_script";

const POLL_MILLISECONDS: number = 2500;

/** Check every few seconds that an Alerts tab is open and that the content script answers. Side effect: messages the tab. */
export function useAlertsTabStatus(): AlertsTabStatus {
  const [status, setStatus] = useState<AlertsTabStatus>("checking");

  useEffect(() => {
    let cancelled: boolean = false;
    const check = async (): Promise<void> => {
      const tab = await findAlertsTab();
      let next: AlertsTabStatus;
      if (tab === null) {
        next = "no_tab";
      } else {
        try {
          const reply = await sendToAlertsTab({ request: { kind: "ping" } });
          next = reply.ok ? "ready" : "no_script";
        } catch {
          next = "no_script";
        }
      }
      if (!cancelled) setStatus(next);
    };
    void check();
    const handle: number = window.setInterval(() => {
      void check();
    }, POLL_MILLISECONDS);
    return (): void => {
      cancelled = true;
      window.clearInterval(handle);
    };
  }, []);

  return status;
}
