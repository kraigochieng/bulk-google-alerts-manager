import { describe, expect, it } from "vitest";

import { compareQueries, findExactAlert, findMatches } from "src/core/matching";
import type { LiveAlert } from "src/shared/models";

describe("compareQueries", () => {
  it("finds an exact match after normalising", () => {
    expect(compareQueries({ first: '"Jane  Doe"', second: "“jane doe”" })).toBe("exact");
  });

  it("finds the same words in another order", () => {
    expect(compareQueries({ first: "solar power kenya", second: "kenya solar power" })).toBe(
      "same_words",
    );
  });

  it("ignores operators and quotes when it compares words", () => {
    expect(
      compareQueries({ first: '"Jane Doe" OR "Jane A. Doe"', second: "jane doe jane a. doe" }),
    ).toBe("same_words");
  });

  it("finds a similar query", () => {
    expect(compareQueries({ first: "solar power kenya news", second: "solar power kenya" })).toBe(
      "similar",
    );
  });

  it("returns null for different queries", () => {
    expect(compareQueries({ first: "solar power", second: "wind energy" })).toBeNull();
    expect(compareQueries({ first: "solar", second: "solar power kenya" })).toBeNull();
  });

  it("returns null when a query has no words", () => {
    expect(compareQueries({ first: "OR", second: "solar" })).toBeNull();
  });
});

describe("findMatches", () => {
  const liveAlerts: LiveAlert[] = [
    { query: "solar power kenya", feedUrl: null },
    { query: "Solar Power Kenya news", feedUrl: null },
    { query: "wind energy", feedUrl: null },
  ];

  it("lists matches with exact first", () => {
    const matches = findMatches({ query: "solar power kenya", liveAlerts });
    expect(matches.map((match) => match.similarity)).toEqual(["exact", "similar"]);
  });

  it("returns an empty list when nothing is alike", () => {
    expect(findMatches({ query: "tea prices", liveAlerts })).toEqual([]);
  });
});

describe("findExactAlert", () => {
  it("finds the alert or returns null", () => {
    const liveAlerts: LiveAlert[] = [{ query: "Wind  Energy", feedUrl: "u" }];
    expect(findExactAlert({ query: "wind energy", liveAlerts })?.feedUrl).toBe("u");
    expect(findExactAlert({ query: "other", liveAlerts })).toBeNull();
  });
});
