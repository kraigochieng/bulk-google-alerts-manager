import { describe, expect, it } from "vitest";

import { buildRunSummary, runIsFinished } from "src/core/run-summary";
import type { RunItem, RunSnapshot, RunStatus } from "src/shared/models";

function item({ id, status, action = "create" }: { id: number; status: RunItem["status"]; action?: RunItem["action"] }): RunItem {
  return { id, query: `q${String(id)}`, action, options: null, label: "", status, errorMessage: "" };
}

describe("runIsFinished", () => {
  it.each<[RunStatus, boolean]>([
    ["completed", true],
    ["cancelled", true],
    ["running", false],
    ["paused", false],
    ["awaiting_captcha", false],
    ["idle", false],
  ])("status %s gives %s", (status, expected) => {
    expect(runIsFinished({ status })).toBe(expected);
  });
});

describe("buildRunSummary", () => {
  const items: RunItem[] = [
    item({ id: 0, status: "created" }),
    item({ id: 1, status: "created" }),
    item({ id: 2, status: "updated", action: "update" }),
    item({ id: 3, status: "failed" }),
    item({ id: 4, status: "skipped" }),
  ];

  it("lists the counts that are not zero for a completed add run", () => {
    const summary = buildRunSummary({ run: { kind: "create", status: "completed", items, notice: "" } });
    expect(summary.title).toBe("The add run is complete");
    expect(summary.lines).toEqual(["Created: 2", "Updated: 1", "Skipped: 1", "Failed: 1"]);
    expect(summary.hasFailures).toBe(true);
  });

  it("names the failed rows with their reason", () => {
    const failing: RunItem[] = [
      { ...item({ id: 0, status: "failed" }), errorMessage: "No menu" },
      { ...item({ id: 1, status: "failed" }), errorMessage: "" },
    ];
    const summary = buildRunSummary({ run: { kind: "create", status: "completed", items: failing, notice: "" } });
    expect(summary.details).toEqual(["q0: No menu", "q1"]);
  });

  it("shows the count of the failed rows beyond the limit", () => {
    const many: RunItem[] = Array.from({ length: 7 }, (_, index) => item({ id: index, status: "failed" }));
    const summary = buildRunSummary({ run: { kind: "create", status: "completed", items: many, notice: "" } });
    expect(summary.details).toHaveLength(6);
    expect(summary.details[5]).toBe("...and 2 more");
  });

  it("names the rows that did not run in a cancelled run", () => {
    const summary = buildRunSummary({
      run: { kind: "create", status: "cancelled", items: [item({ id: 0, status: "created" }), item({ id: 1, status: "pending" })], notice: "" },
    });
    expect(summary.title).toBe("The add run was cancelled");
    expect(summary.lines).toEqual(["Created: 1", "Not run: 1"]);
    expect(summary.hasFailures).toBe(false);
  });

  it("counts deleted rows in a delete run", () => {
    const summary = buildRunSummary({
      run: { kind: "delete", status: "completed", items: [item({ id: 0, status: "deleted", action: "delete" })], notice: "" },
    });
    expect(summary.title).toBe("The delete run is complete");
    expect(summary.lines).toEqual(["Deleted: 1"]);
  });

  it("says that no row ran for an empty run", () => {
    const run: RunSnapshot = { kind: "create", status: "cancelled", items: [], notice: "" };
    expect(buildRunSummary({ run }).lines).toEqual(["No row ran."]);
  });
});
