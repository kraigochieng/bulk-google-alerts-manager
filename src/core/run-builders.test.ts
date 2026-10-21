import { describe, expect, it } from "vitest";

import { DEFAULT_ALERT_OPTIONS } from "src/core/alert-options";
import { buildCreateRun, buildDeleteRun } from "src/core/run-builders";
import type { ImportRow } from "src/shared/models";

const row: ImportRow = {
  sourceRowNumber: 2,
  query: "  solar  ",
  overrides: { deliverTo: "email", howOften: "weekly" },
  issues: [],
};

describe("buildCreateRun", () => {
  it("resolves options and trims the query", () => {
    const run = buildCreateRun({ entries: [{ row, action: "create" }], defaults: DEFAULT_ALERT_OPTIONS });
    expect(run.items[0]).toMatchObject({
      query: "solar",
      status: "pending",
      options: { deliverTo: "email", howOften: "weekly", language: "English" },
    });
    expect(run).toMatchObject({ kind: "create", status: "idle" });
  });

  it("makes a pending update item for an update entry", () => {
    const run = buildCreateRun({ entries: [{ row, action: "update" }], defaults: DEFAULT_ALERT_OPTIONS });
    expect(run.items[0]).toMatchObject({ action: "update", status: "pending" });
  });

  it("marks skipped entries as skipped", () => {
    const run = buildCreateRun({ entries: [{ row, action: "skip" }], defaults: DEFAULT_ALERT_OPTIONS });
    expect(run.items[0]?.status).toBe("skipped");
  });
});

describe("buildDeleteRun", () => {
  it("makes one pending item for each query", () => {
    const run = buildDeleteRun({ queries: ["a", "b"] });
    expect(run.kind).toBe("delete");
    expect(run.items.map((item) => [item.id, item.query, item.status])).toEqual([
      [0, "a", "pending"],
      [1, "b", "pending"],
    ]);
  });
});
