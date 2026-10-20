export const ALERT_CAP_PER_ACCOUNT: number = 1000;

/** The result of a check of the alert cap. */
export interface CapCheck {
  readonly exceedsCap: boolean;
  readonly overflowCount: number;
  readonly remainingSlots: number;
}

/** Check whether the live alerts plus the new alerts stay within the cap. */
export function checkAlertCap({
  liveCount,
  newCount,
  cap,
}: {
  liveCount: number;
  newCount: number;
  cap: number;
}): CapCheck {
  const remainingSlots: number = Math.max(cap - liveCount, 0);
  const overflowCount: number = Math.max(newCount - remainingSlots, 0);
  return { exceedsCap: overflowCount > 0, overflowCount, remainingSlots };
}
