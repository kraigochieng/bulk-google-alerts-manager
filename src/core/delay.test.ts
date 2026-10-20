import { describe, expect, it } from "vitest";

import { pickDelayMilliseconds } from "src/core/delay";

describe("pickDelayMilliseconds", () => {
  it("returns the minimum when the random source returns 0", () => {
    expect(
      pickDelayMilliseconds({ minimumMilliseconds: 6000, maximumMilliseconds: 14000, random: () => 0 }),
    ).toBe(6000);
  });

  it("returns the maximum when the random source is just below 1", () => {
    expect(
      pickDelayMilliseconds({
        minimumMilliseconds: 6000,
        maximumMilliseconds: 14000,
        random: () => 0.999999,
      }),
    ).toBe(14000);
  });

  it("swaps a minimum that is larger than the maximum", () => {
    expect(
      pickDelayMilliseconds({ minimumMilliseconds: 10, maximumMilliseconds: 5, random: () => 0 }),
    ).toBe(5);
  });
});
