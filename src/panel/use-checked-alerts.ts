import { useSyncExternalStore } from "react";

import { readCheckedAlerts, subscribeToCheckedAlerts } from "src/panel/page-link";
import type { LiveAlert } from "src/shared/models";

/** Return the alerts that the user checked on the Alerts page. Side effect: subscribes to the page link. */
export function useCheckedAlerts(): readonly LiveAlert[] {
  return useSyncExternalStore(
    (listener: () => void) => subscribeToCheckedAlerts({ listener }),
    readCheckedAlerts,
  );
}
