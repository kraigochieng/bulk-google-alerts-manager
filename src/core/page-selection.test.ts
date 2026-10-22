import { describe, expect, it } from "vitest";

import { allRowsSelected, applySelectionEvent, EMPTY_SELECTION } from "src/core/page-selection";
import type { PageSelection } from "src/core/page-selection";

const selectionOf = (...queries: string[]): PageSelection => new Set(queries);

describe("applySelectionEvent", () => {
  it("adds a query that is absent on toggle", () => {
    expect(applySelectionEvent({ selection: selectionOf("a"), event: { type: "toggle", query: "b" } })).toEqual(
      selectionOf("a", "b"),
    );
  });

  it("removes a query that is present on toggle", () => {
    expect(applySelectionEvent({ selection: selectionOf("a", "b"), event: { type: "toggle", query: "a" } })).toEqual(
      selectionOf("b"),
    );
  });

  it("replaces the selection on select_all", () => {
    expect(
      applySelectionEvent({ selection: selectionOf("x"), event: { type: "select_all", queries: ["a", "b", "a"] } }),
    ).toEqual(selectionOf("a", "b"));
  });

  it("empties the selection on clear", () => {
    expect(applySelectionEvent({ selection: selectionOf("a"), event: { type: "clear" } })).toEqual(EMPTY_SELECTION);
  });

  it("drops a query that has no live row on rows_changed", () => {
    expect(
      applySelectionEvent({ selection: selectionOf("a", "b"), event: { type: "rows_changed", liveQueries: ["b", "c"] } }),
    ).toEqual(selectionOf("b"));
  });

  it("keeps one entry for two rows that share a query", () => {
    const selection: PageSelection = applySelectionEvent({
      selection: EMPTY_SELECTION,
      event: { type: "select_all", queries: ["same", "same"] },
    });
    expect(selection.size).toBe(1);
  });

  it("does not change the input", () => {
    const selection: PageSelection = selectionOf("a");
    applySelectionEvent({ selection, event: { type: "toggle", query: "b" } });
    applySelectionEvent({ selection, event: { type: "clear" } });
    expect(selection).toEqual(selectionOf("a"));
  });
});

describe("allRowsSelected", () => {
  it.each<[string, string[], string[], boolean]>([
    ["every row checked", ["a", "b"], ["a", "b"], true],
    ["one row unchecked", ["a"], ["a", "b"], false],
    ["no rows", [], [], false],
    ["extra checked query", ["a", "z"], ["a"], true],
  ])("%s", (_label, checked, live, expected) => {
    expect(allRowsSelected({ selection: selectionOf(...checked), liveQueries: live })).toBe(expected);
  });
});
