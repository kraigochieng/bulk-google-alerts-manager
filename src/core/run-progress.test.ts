import { describe, expect, it } from "vitest";

import { describeRunProgress } from "src/core/run-progress";
import type { RunItem, RunSnapshot } from "src/shared/models";

function item({ id, status }: { id: number; status: RunItem["status"] }): RunItem {
  return { id, query: `query ${String(id)}`, action: "create", options: null, status, errorMessage: "" };
}

const RUN: RunSnapshot = {
  kind: "create",
  status: "running",
  notice: "",
  items: [item({ id: 0, status: "created" }), item({ id: 1, status: "failed" }), item({ id: 2, status: "pending" })],
};

describe("describeRunProgress", () => {
  it("names the current row and the counts of a running run", () => {
    expect(describeRunProgress({ run: RUN })).toEqual({ currentRow: "Now: query 2", countLines: ["Created: 1", "Failed: 1"] });
  });

  it("names the next row of a paused run", () => {
    expect(describeRunProgress({ run: { ...RUN, status: "paused" } }).currentRow).toBe("Next: query 2");
  });

  it("names no row when no item waits", () => {
    expect(describeRunProgress({ run: { ...RUN, items: [item({ id: 0, status: "deleted" })] } })).toEqual({
      currentRow: null,
      countLines: ["Deleted: 1"],
    });
  });
});
