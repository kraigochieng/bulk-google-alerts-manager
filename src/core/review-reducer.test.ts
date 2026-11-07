import { describe, expect, it } from "vitest";

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
});
