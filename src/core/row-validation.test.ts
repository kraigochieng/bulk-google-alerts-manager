import { describe, expect, it } from "vitest";

import { findQueryIssues } from "src/core/row-validation";

describe("findQueryIssues", () => {
  it("marks empty queries", () => {
    expect(findQueryIssues({ queries: ["", "  "], maximumQueryLength: 10 })).toEqual([
      ["empty"],
      ["empty"],
    ]);
  });

  it("marks a query that is too long", () => {
    expect(findQueryIssues({ queries: ["abcdef"], maximumQueryLength: 5 })).toEqual([["too_long"]]);
  });

  it("marks the second use of a query, ignoring case and spacing", () => {
    expect(
      findQueryIssues({ queries: ['"Jane  Doe"', '"jane doe"', "other"], maximumQueryLength: 50 }),
    ).toEqual([[], ["duplicate_in_file"], []]);
  });

  it("does not count an empty row as a duplicate source", () => {
    expect(findQueryIssues({ queries: ["", "", "a"], maximumQueryLength: 5 })).toEqual([
      ["empty"],
      ["empty"],
      [],
    ]);
  });
});
