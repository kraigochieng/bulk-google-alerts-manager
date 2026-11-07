import { describe, expect, it } from "vitest";

import { describeTimeLeft, estimateTimeLeft } from "src/core/time-left";

describe("estimateTimeLeft", () => {
  it("returns null before 3 items finish", () => {
    expect(estimateTimeLeft({ elapsedMilliseconds: 10000, finishedSinceStart: 2, remaining: 50 })).toBeNull();
  });

  it("returns null when no time passed", () => {
    expect(estimateTimeLeft({ elapsedMilliseconds: 0, finishedSinceStart: 5, remaining: 50 })).toBeNull();
  });

  it("multiplies the time of one item by the remaining items", () => {
    expect(estimateTimeLeft({ elapsedMilliseconds: 30000, finishedSinceStart: 3, remaining: 10 })).toBe(100000);
  });

  it("returns 0 when nothing remains", () => {
    expect(estimateTimeLeft({ elapsedMilliseconds: 30000, finishedSinceStart: 3, remaining: 0 })).toBe(0);
  });
});

describe("describeTimeLeft", () => {
  it.each([
    [20000, "less than 1 minute"],
    [60000, "about 1 minute"],
    [150000, "about 3 minutes"],
    [3600000, "about 1 hour"],
    [5400000, "about 1 hour 30 min"],
  ])("writes %j ms as %s", (milliseconds: number, expected: string) => {
    expect(describeTimeLeft({ milliseconds })).toBe(expected);
  });
});
