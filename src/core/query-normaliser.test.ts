import { describe, expect, it } from "vitest";

import { normaliseQuery } from "src/core/query-normaliser";

describe("normaliseQuery", () => {
  it("trims, collapses white space and folds case", () => {
    expect(normaliseQuery({ query: '  "Jane   Doe"\tOR  "Jane A. Doe" ' })).toBe(
      '"jane doe" or "jane a. doe"',
    );
  });

  it("unifies curly quotes", () => {
    expect(normaliseQuery({ query: "“Jane Doe”" })).toBe('"jane doe"');
    expect(normaliseQuery({ query: "O’Neil" })).toBe("o'neil");
  });

  it("returns an empty string for white space", () => {
    expect(normaliseQuery({ query: " \n " })).toBe("");
  });
});
