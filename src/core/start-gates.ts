import { checkAlertCap } from "src/core/alert-cap";

/** Result of a start gate: allowed, or refused with the reason that the user sees. */
export type GateResult = { readonly allowed: true } | { readonly allowed: false; readonly reason: string };

/** Decide whether a create run may start. Updates do not count against the alert limit. */
export function checkCreateGate({
  liveCount,
  createCount,
  updateCount,
  cap,
}: {
  liveCount: number;
  createCount: number;
  updateCount: number;
  cap: number;
}): GateResult {
  if (createCount + updateCount === 0) {
    return { allowed: false, reason: "No rows are checked. Check at least one row." };
  }
  const capCheck = checkAlertCap({ liveCount, newCount: createCount, cap });
  if (capCheck.exceedsCap) {
    return {
      allowed: false,
      reason: `This run would pass the limit of ${String(cap)} alerts. ${String(capCheck.overflowCount)} too many. Uncheck some rows.`,
    };
  }
  return { allowed: true };
}

/** Decide whether a delete run may start. At least one alert must be selected. */
export function checkDeleteGate({ selectedCount }: { selectedCount: number }): GateResult {
  if (selectedCount === 0) {
    return { allowed: false, reason: "No alerts are selected. Check at least one alert on the page." };
  }
  return { allowed: true };
}

/** Decide whether an export may start. At least one alert must be checked. */
export function checkExportGate({ selectedCount }: { selectedCount: number }): GateResult {
  if (selectedCount === 0) {
    return { allowed: false, reason: "No alerts are checked. Check at least one alert on the page." };
  }
  return { allowed: true };
}
