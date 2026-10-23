import { describe, expect, it } from "vitest";

import { formatAlertsHeading } from "src/core/alerts-heading";

describe("formatAlertsHeading", () => {
  it("adds the remaining count", () => {
    expect(formatAlertsHeading({ text: "My alerts (4)", cap: 1000 })).toBe("My alerts (4 created, 996 remaining)");
  });

  it("keeps the Google spelling of the label", () => {
    expect(formatAlertsHeading({ text: "My Alerts (4)", cap: 1000 })).toBe("My Alerts (4 created, 996 remaining)");
  });

  it("recomputes a heading that already has our text", () => {
    expect(formatAlertsHeading({ text: "My alerts (5 created, 996 remaining)", cap: 1000 })).toBe(
      "My alerts (5 created, 995 remaining)",
    );
  });

  it("never shows a negative remaining count", () => {
    expect(formatAlertsHeading({ text: "My alerts (1001)", cap: 1000 })).toBe("My alerts (1001 created, 0 remaining)");
  });

  it("returns null for other text", () => {
    expect(formatAlertsHeading({ text: "Create an alert about", cap: 1000 })).toBeNull();
    expect(formatAlertsHeading({ text: "My alerts", cap: 1000 })).toBeNull();
  });
});
