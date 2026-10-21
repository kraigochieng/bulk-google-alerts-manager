import { describe, expect, it } from "vitest";

import { buildRunSummary, runJustEnded } from "src/core/run-summary";
import type { RunItem, RunSnapshot, RunStatus } from "src/shared/models";

function item({ id, status, action = "create" }: { id: number; status: RunItem["status"]; action?: RunItem["action"] }): RunItem {
  return { id, query: `q${String(id)}`, action, options: null, label: "", status, rssLink: "", errorMessage: "" };
}

describe("runJustEnded", () => {
  it.each<[RunStatus | null, RunStatus, boolean]>([
    ["running", "completed", true],
    ["paused", "cancelled", true],
    ["awaiting_captcha", "cancelled", true],
    [null, "completed", false],
    ["completed", "completed", false],
    ["running", "paused", false],
    ["ready", "running", false],
    ["cancelled", "ready", false],
  ])("previous %s, current %s gives %s", (previous, current, expected) => {
    expect(runJustEnded({ previous, current })).toBe(expected);
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
