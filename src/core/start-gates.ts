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

/** The exact text that the user must type to confirm a delete run. */
export function deleteConfirmationText({ count }: { count: number }): string {
  return `DELETE ${String(count)}`;
}

/** Decide whether a delete run may start. The typed text is required. */
export function checkDeleteGate({
  selectedCount,
  typedText,
}: {
  selectedCount: number;
  typedText: string;
}): GateResult {
  if (selectedCount === 0) {
    return { allowed: false, reason: "No alerts are selected. Select at least one alert." };
  }
  if (typedText.trim() !== deleteConfirmationText({ count: selectedCount })) {
    return {
      allowed: false,
      reason: `Type ${deleteConfirmationText({ count: selectedCount })} to confirm.`,
    };
  }
  return { allowed: true };
}
