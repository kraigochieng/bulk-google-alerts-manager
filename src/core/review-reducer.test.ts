import { describe, expect, it } from "vitest";

import { importRowsFromDraft } from "src/core/draft-rows";
import type { DraftRow } from "src/core/draft-rows";
import { EMPTY_REVIEW_STATE, reviewReducer } from "src/core/review-reducer";
import type { ReviewAction, ReviewState } from "src/core/review-reducer";

const cells = { howOften: "", sources: "", language: "", region: "", howMany: "", deliverTo: "" };
const rows: readonly DraftRow[] = [
  { sourceRowNumber: 2, query: "alpha", cells },
  { sourceRowNumber: 3, query: "", cells },
  { sourceRowNumber: 4, query: "alpha", cells },
];

function reduce({ state, action }: { state: ReviewState; action: ReviewAction }): ReviewState {
  return reviewReducer({ state, action, maximumQueryLength: 100 });
}

describe("reviewReducer", () => {
  const loaded: ReviewState = reduce({ state: EMPTY_REVIEW_STATE, action: { type: "load", rows } });

  it("loads the rows and checks the rows that have no blocking issue and no duplicate", () => {
    expect(loaded.rows).toEqual(rows);
    expect([...loaded.checkedRows]).toEqual([2]);
    expect(loaded.actionOverrides).toEqual({});
  });

  it("replaces the old checks and choices when it loads new rows", () => {
    const changed = reduce({ state: loaded, action: { type: "set_action", rowNumber: 2, action: "skip" } });
    const again = reduce({ state: changed, action: { type: "load", rows } });
    expect(again.actionOverrides).toEqual({});
  });

  it("checks and unchecks rows", () => {
    const checked = reduce({ state: loaded, action: { type: "set_checked", rowNumbers: [4], checked: true } });
    expect([...checked.checkedRows].sort()).toEqual([2, 4]);
    const unchecked = reduce({ state: checked, action: { type: "set_checked", rowNumbers: [2, 4], checked: false } });
    expect([...unchecked.checkedRows]).toEqual([]);
  });

  it("stores the action that the user chose for a row", () => {
    const next = reduce({ state: loaded, action: { type: "set_action", rowNumber: 2, action: "skip" } });
    expect(next.actionOverrides).toEqual({ 2: "skip" });
  });

  it("clears the issue and checks the row when an edit fixes an empty query", () => {
    const next = reduce({ state: loaded, action: { type: "edit_query", rowNumber: 3, query: "gamma" } });
    expect(importRowsFromDraft({ rows: next.rows, maximumQueryLength: 100 })[1]?.issues).toEqual([]);
    expect([...next.checkedRows].sort()).toEqual([2, 3]);
  });

  it("unchecks a row when an edit empties its query", () => {
    const next = reduce({ state: loaded, action: { type: "edit_query", rowNumber: 2, query: "  " } });
    expect(importRowsFromDraft({ rows: next.rows, maximumQueryLength: 100 })[0]?.issues).toEqual(["empty"]);
    expect([...next.checkedRows]).toEqual([]);
  });

  it("marks a row as a duplicate when an edit repeats an earlier query", () => {
    const next = reduce({ state: loaded, action: { type: "edit_query", rowNumber: 3, query: "ALPHA" } });
    expect(importRowsFromDraft({ rows: next.rows, maximumQueryLength: 100 })[1]?.issues).toEqual(["duplicate_in_file"]);
    expect([...next.checkedRows]).toEqual([2]);
  });

  it("removes the duplicate issue of a later row when an edit changes the earlier query", () => {
    const next = reduce({ state: loaded, action: { type: "edit_query", rowNumber: 2, query: "beta" } });
    expect(importRowsFromDraft({ rows: next.rows, maximumQueryLength: 100 })[2]?.issues).toEqual([]);
  });

  it("forgets the action choice of a row when its query changes", () => {
    const chosen = reduce({ state: loaded, action: { type: "set_action", rowNumber: 2, action: "skip" } });
    const next = reduce({ state: chosen, action: { type: "edit_query", rowNumber: 2, query: "delta" } });
    expect(next.actionOverrides).toEqual({});
  });

  it("changes an option cell and keeps the row checked", () => {
    const next = reduce({ state: loaded, action: { type: "edit_option", rowNumber: 2, field: "howMany", text: "All results" } });
    expect(next.rows[0]?.cells.howMany).toBe("All results");
    expect([...next.checkedRows]).toEqual([2]);
  });

  it("unchecks a row when an edit gives an option a value that is not valid", () => {
    const next = reduce({ state: loaded, action: { type: "edit_option", rowNumber: 2, field: "howOften", text: "hourly" } });
    expect(importRowsFromDraft({ rows: next.rows, maximumQueryLength: 100 })[0]?.issues).toEqual(["invalid_option"]);
    expect([...next.checkedRows]).toEqual([]);
  });

  it("returns the same state for a row that is not in the file", () => {
    expect(reduce({ state: loaded, action: { type: "edit_query", rowNumber: 99, query: "x" } })).toBe(loaded);
    expect(reduce({ state: loaded, action: { type: "edit_option", rowNumber: 99, field: "region", text: "x" } })).toBe(loaded);
  });
});
