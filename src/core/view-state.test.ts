import { describe, expect, it } from "vitest";

import type { TableSchema } from "src/core/table-state";
import { readView, switchViewParameters } from "src/core/view-state";

const schema = (prefix: string): TableSchema => ({
  prefix,
  sortKeys: ["a"],
  filters: ["all"],
  defaultState: { search: "", sortKey: "a", sortDirection: "asc", page: 0, filter: "all" },
});

describe("readView", () => {
  it("reads a valid view", () => {
    expect(readView({ parameters: new URLSearchParams("view=delete") })).toBe("delete");
  });

  it("reads the export view", () => {
    expect(readView({ parameters: new URLSearchParams("view=export") })).toBe("export");
  });

  it.each(["", "view=other", "view=delete&view=create"])("uses the default for %j", (query: string) => {
    expect(readView({ parameters: new URLSearchParams(query) })).toBe("create");
  });
});

describe("switchViewParameters", () => {
  const schemas = [schema("rows"), schema("alerts")];

  it("removes all table keys when the view changes and sets the view", () => {
    const next = switchViewParameters({
      parameters: new URLSearchParams("rows.search=x&alerts.page=2&alerts.filter=all&other=1"),
      view: "delete",
      schemas,
    });
    expect(next.toString()).toBe("other=1&view=delete");
  });

  it("removes the view key for the default view", () => {
    expect(
      switchViewParameters({ parameters: new URLSearchParams("view=delete&rows.search=x"), view: "create", schemas }).toString(),
    ).toBe("");
  });
});
