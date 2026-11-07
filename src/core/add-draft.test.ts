import { describe, expect, it } from "vitest";

import { ADD_DRAFT_VERSION, buildAddDraft, parseAddDraft, reviewStateFromDraft } from "src/core/add-draft";
import type { ReviewState } from "src/core/review-reducer";

const cells = { howOften: "", sources: "", language: "", region: "", howMany: "", deliverTo: "" };
const review: ReviewState = {
  rows: [
    { sourceRowNumber: 2, query: "alpha", cells },
    { sourceRowNumber: 5, query: "beta", cells: { ...cells, howMany: "All results" } },
  ],
  checkedRows: new Set([2]),
  actionOverrides: { 5: "skip" },
};
const stored = JSON.parse(JSON.stringify(buildAddDraft({ fileName: "alerts.xlsx", step: "review", extraColumns: ["notes"], review }))) as Record<string, unknown>;

describe("parseAddDraft", () => {
  it("reads a valid draft", () => {
    expect(parseAddDraft({ value: stored })).toEqual(buildAddDraft({ fileName: "alerts.xlsx", step: "review", extraColumns: ["notes"], review }));
  });

  it("round-trips the review state", () => {
    const draft = parseAddDraft({ value: stored });
    expect(draft === null ? null : reviewStateFromDraft({ draft })).toEqual(review);
  });

  it.each([
    ["a value that is not an object", "text"],
    ["null", null],
    ["another version", { ...stored, version: ADD_DRAFT_VERSION + 1 }],
    ["rows that are not a list", { ...stored, rows: "x" }],
    ["a cell that is not a text", { ...stored, rows: [{ sourceRowNumber: 2, query: "a", cells: { ...cells, region: 3 } }] }],
    ["a row with a missing cell", { ...stored, rows: [{ sourceRowNumber: 2, query: "a", cells: { howOften: "" } }] }],
    ["a row number below 2", { ...stored, rows: [{ sourceRowNumber: 1, query: "a", cells }] }],
    ["an unknown step", { ...stored, step: "finish" }],
    ["an unknown action", { ...stored, actionOverrides: { 2: "delete" } }],
  ])("returns null for %s", (_name: string, value: unknown) => {
    expect(parseAddDraft({ value })).toBeNull();
  });

  it("returns null for more than 1000 rows", () => {
    const rows = Array.from({ length: 1001 }, (_unused, index) => ({ sourceRowNumber: index + 2, query: `q${String(index)}`, cells }));
    expect(parseAddDraft({ value: { ...stored, rows } })).toBeNull();
  });

  it("accepts 1000 rows", () => {
    const rows = Array.from({ length: 1000 }, (_unused, index) => ({ sourceRowNumber: index + 2, query: `q${String(index)}`, cells }));
    expect(parseAddDraft({ value: { ...stored, rows } })?.rows).toHaveLength(1000);
  });
});
