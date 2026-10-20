import { describe, expect, it } from "vitest";

import { DEFAULT_ALERT_OPTIONS } from "src/core/alert-options";
import { buildCreateRun, buildDeleteRun } from "src/core/run-builders";
import { parseRunSnapshot } from "src/core/run-parse";

describe("parseRunSnapshot", () => {
  it("round-trips a create run through JSON", () => {
    const run = buildCreateRun({
      entries: [{ row: { sourceRowNumber: 2, query: "a", label: "x", overrides: {}, issues: [] }, action: "create" }],
      defaults: DEFAULT_ALERT_OPTIONS,
    });
    expect(parseRunSnapshot({ value: JSON.parse(JSON.stringify(run)) })).toEqual(run);
  });

  it("round-trips a delete run", () => {
    const run = buildDeleteRun({ queries: ["a"] });
    expect(parseRunSnapshot({ value: JSON.parse(JSON.stringify(run)) })).toEqual(run);
  });

  it.each([
    null,
    "x",
    {},
    { kind: "create", status: "running", notice: "", items: "no" },
    { kind: "other", status: "running", notice: "", items: [] },
    { kind: "create", status: "weird", notice: "", items: [] },
    { kind: "create", status: "running", notice: "", items: [{ id: "1" }] },
  ])("rejects %j", (value: unknown) => {
    expect(parseRunSnapshot({ value })).toBeNull();
  });
});
