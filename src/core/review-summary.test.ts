import { describe, expect, it } from "vitest";

import { summariseReview } from "src/core/review-summary";

describe("summariseReview", () => {
  it("names each count", () => {
    expect(summariseReview({ createCount: 120, updateCount: 8, skipCount: 2, problemCount: 0 })).toBe(
      "The run creates 120 alerts, updates 8 alerts, and skips 2 rows.",
    );
  });

  it("uses the singular for one", () => {
    expect(summariseReview({ createCount: 1, updateCount: 1, skipCount: 1, problemCount: 0 })).toBe(
      "The run creates 1 alert, updates 1 alert, and skips 1 row.",
    );
  });

  it("names zero counts", () => {
    expect(summariseReview({ createCount: 0, updateCount: 0, skipCount: 0, problemCount: 0 })).toBe(
      "The run creates 0 alerts, updates 0 alerts, and skips 0 rows.",
    );
  });

  it("adds the rows with problems", () => {
    expect(summariseReview({ createCount: 1, updateCount: 0, skipCount: 0, problemCount: 3 })).toMatch(/ 3 rows have a problem\.$/);
  });

  it("uses the singular for one problem", () => {
    expect(summariseReview({ createCount: 1, updateCount: 0, skipCount: 0, problemCount: 1 })).toMatch(/ 1 row has a problem\.$/);
  });
});
