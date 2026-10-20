import { describe, expect, it } from "vitest";

import { ALERT_CAP_PER_ACCOUNT, checkAlertCap } from "src/core/alert-cap";

describe("checkAlertCap", () => {
  it("allows a batch that fits", () => {
    expect(checkAlertCap({ liveCount: 960, newCount: 40, cap: ALERT_CAP_PER_ACCOUNT })).toEqual({
      exceedsCap: false,
      overflowCount: 0,
      remainingSlots: 40,
    });
  });

  it("reports the overflow of a batch that is too large", () => {
    expect(checkAlertCap({ liveCount: 990, newCount: 25, cap: 1000 })).toEqual({
      exceedsCap: true,
      overflowCount: 15,
      remainingSlots: 10,
    });
  });

  it("handles an account that is over the cap", () => {
    expect(checkAlertCap({ liveCount: 1200, newCount: 1, cap: 1000 }).remainingSlots).toBe(0);
  });
});
