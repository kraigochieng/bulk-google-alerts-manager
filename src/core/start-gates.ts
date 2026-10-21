import { checkAlertCap } from "src/core/alert-cap";

/** Result of a start gate: allowed, or refused with the reason that the user sees. */
export type GateResult = { readonly allowed: true } | { readonly allowed: false; readonly reason: string };

/** Decide whether a create run may start. */
export function checkCreateGate({
  liveCount,
  createCount,
  cap,
  risksAccepted,
}: {
  liveCount: number;
  createCount: number;
  cap: number;
  risksAccepted: boolean;
}): GateResult {
  if (createCount === 0) {
    return { allowed: false, reason: "No rows are checked. Check at least one row." };
  }
  const capCheck = checkAlertCap({ liveCount, newCount: createCount, cap });
  if (capCheck.exceedsCap) {
    return {
      allowed: false,
      reason: `This run would pass the limit of ${String(cap)} alerts. ${String(capCheck.overflowCount)} too many. Uncheck some rows.`,
    };
  }
  if (!risksAccepted) {
    return { allowed: false, reason: "Read the notice and accept it before the run." };
  }
  return { allowed: true };
}

/** Decide whether a delete run may start. At least one alert must be selected. */
export function checkDeleteGate({ selectedCount }: { selectedCount: number }): GateResult {
  if (selectedCount === 0) {
    return { allowed: false, reason: "No alerts are selected. Select at least one alert." };
  }
  return { allowed: true };
}
