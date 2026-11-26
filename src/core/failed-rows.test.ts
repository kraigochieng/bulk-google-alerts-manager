import { describe, expect, it } from "vitest";

import { parseCsv } from "src/core/csv";
import { buildFailedRowsCsv, buildRetryRun } from "src/core/failed-rows";
import type { AlertOptions, RunItem, RunSnapshot } from "src/shared/models";

const OPTIONS: AlertOptions = { howOften: "daily", sources: "News", language: "English", region: "Kenya", howMany: "all", deliverTo: "email" };

function item({ id, query, status, errorMessage = "" }: { id: number; query: string; status: RunItem["status"]; errorMessage?: string }): RunItem {
  return { id, query, action: "create", options: OPTIONS, status, errorMessage };
}

const RUN: RunSnapshot = {
  kind: "create",
  status: "completed",
  notice: "",
  items: [
    item({ id: 0, query: "a", status: "created" }),
    item({ id: 1, query: "b", status: "failed", errorMessage: "No menu." }),
    item({ id: 2, query: "c", status: "failed", errorMessage: "Timed out." }),
    item({ id: 3, query: "d", status: "pending" }),
  ],
};

describe("buildRetryRun", () => {
  it("holds only the failed items as pending items", () => {
    expect(buildRetryRun({ run: RUN, liveQueries: [] })).toEqual({
      kind: "create",
      status: "idle",
      notice: "",
      items: [item({ id: 0, query: "b", status: "pending" }), item({ id: 1, query: "c", status: "pending" })],
    });
  });

  it("updates a failed create that exists in the account", () => {
    const retry: RunSnapshot = buildRetryRun({ run: RUN, liveQueries: [" C "] });
    expect(retry.items.map((entry: RunItem) => entry.action)).toEqual(["create", "update"]);
  });

  it("keeps the delete action of a delete run", () => {
    const run: RunSnapshot = { ...RUN, kind: "delete", items: [{ ...item({ id: 4, query: "b", status: "failed" }), action: "delete", options: null }] };
    expect(buildRetryRun({ run, liveQueries: ["b"] }).items[0]?.action).toBe("delete");
  });
});

describe("buildFailedRowsCsv", () => {
  it("writes the template columns and the error of each failed row", () => {
    expect(parseCsv({ text: buildFailedRowsCsv({ run: RUN }) })).toEqual({
      headers: ["Search query", "How often", "Sources", "Language", "Region", "How many", "Deliver to", "Error"],
      records: [
        ["b", "At most once a day", "News", "English", "Kenya", "All results", "Email", "No menu."],
        ["c", "At most once a day", "News", "English", "Kenya", "All results", "Email", "Timed out."],
      ],
    });
  });

  it("writes empty option cells for a delete row", () => {
    const run: RunSnapshot = { ...RUN, kind: "delete", items: [{ ...item({ id: 0, query: "b", status: "failed", errorMessage: "Gone." }), options: null }] };
    expect(parseCsv({ text: buildFailedRowsCsv({ run }) }).records).toEqual([["b", "", "", "", "", "", "", "Gone."]]);
  });
});
