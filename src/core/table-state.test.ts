import { describe, expect, it } from "vitest";

import { clearTableState, readTableState, writeTableState } from "src/core/table-state";
import type { TableSchema } from "src/core/table-state";

const schema: TableSchema = {
  prefix: "t",
  sortKeys: ["query", "status"],
  filters: ["all", "issues"],
  defaultState: { search: "", sortKey: "query", sortDirection: "asc", page: 0, filter: "all" },
};

describe("readTableState", () => {
  it("reads valid values", () => {
    const state = readTableState({
      parameters: new URLSearchParams("t.search=solar&t.sortKey=status&t.sortDirection=desc&t.page=3&t.filter=issues"),
      schema,
    });
    expect(state).toEqual({ search: "solar", sortKey: "status", sortDirection: "desc", page: 3, filter: "issues" });
  });

  it("uses defaults for an empty URL", () => {
    expect(readTableState({ parameters: new URLSearchParams(), schema })).toEqual(schema.defaultState);
  });

  it.each([
    "t.sortKey=bogus",
    "t.sortDirection=sideways",
    "t.page=-2",
    "t.page=abc",
    "t.page=0",
    "t.filter=nothing",
    "t.sortKey=status&t.sortKey=query",
  ])("replaces an invalid or repeated value (%s) with the default", (query: string) => {
    expect(readTableState({ parameters: new URLSearchParams(query), schema })).toEqual(schema.defaultState);
  });

  it("does not throw an error for invalid input", () => {
    expect(() => readTableState({ parameters: new URLSearchParams("t.page=%E0%A4%A"), schema })).not.toThrow();
  });
});

describe("writeTableState", () => {
  it("removes keys that equal the default and keeps other keys", () => {
    const next = writeTableState({
      parameters: new URLSearchParams("other=1&t.search=old&t.page=2"),
      schema,
      state: { ...schema.defaultState, search: "", page: 0, filter: "issues" },
    });
    expect(next.toString()).toBe("other=1&t.filter=issues");
  });

  it("round-trips a full state", () => {
    const state = { search: "a b", sortKey: "status", sortDirection: "desc" as const, page: 2, filter: "issues" };
    expect(readTableState({ parameters: writeTableState({ parameters: new URLSearchParams(), schema, state }), schema })).toEqual(state);
  });
});

describe("clearTableState", () => {
  it("removes all table keys and keeps others", () => {
    const next = clearTableState({
      parameters: new URLSearchParams("view=create&t.search=x&t.page=2&t.sortKey=status"),
      schema,
    });
    expect(next.toString()).toBe("view=create");
  });
});
