import { describe, expect, it } from "vitest";

import { applyRunEvent, countByStatus, nextPendingItem, nextRunStatus } from "src/core/run-machine";
import type { RunEvent } from "src/core/run-machine";
import type { RunItem, RunSnapshot, RunStatus } from "src/shared/models";

function item({ id, status, action = "create" }: { id: number; status: RunItem["status"]; action?: RunItem["action"] }): RunItem {
  return { id, query: `q${String(id)}`, action, options: null, label: "", status, rssLink: "", errorMessage: "" };
}

function run({ status, items }: { status: RunStatus; items: RunItem[] }): RunSnapshot {
  return { kind: "create", status, items, notice: "" };
}

const TABLE: [RunStatus, RunEvent, RunStatus][] = [
  ["idle", { type: "start" }, "running"],
  ["ready", { type: "start" }, "running"],
  ["running", { type: "row_done", itemId: 1, rssLink: "" }, "running"],
  ["running", { type: "row_failed", itemId: 1, message: "x" }, "running"],
  ["running", { type: "queue_empty" }, "completed"],
  ["running", { type: "pause", reason: "r" }, "paused"],
  ["running", { type: "interrupted" }, "paused"],
  ["running", { type: "captcha_seen" }, "awaiting_captcha"],
  ["running", { type: "layout_changed", message: "m" }, "paused"],
  ["running", { type: "cancel" }, "cancelled"],
  ["paused", { type: "resume" }, "running"],
  ["paused", { type: "cancel" }, "cancelled"],
  ["awaiting_captcha", { type: "captcha_cleared" }, "running"],
  ["awaiting_captcha", { type: "cancel" }, "cancelled"],
  ["completed", { type: "retry_failed" }, "ready"],
  ["cancelled", { type: "retry_failed" }, "ready"],
  // ignored pairs
  ["idle", { type: "pause", reason: "r" }, "idle"],
  ["idle", { type: "resume" }, "idle"],
  ["paused", { type: "start" }, "paused"],
  ["paused", { type: "queue_empty" }, "paused"],
  ["paused", { type: "row_done", itemId: 1, rssLink: "" }, "paused"],
  ["cancelled", { type: "row_failed", itemId: 1, message: "x" }, "cancelled"],
  ["awaiting_captcha", { type: "resume" }, "awaiting_captcha"],
  ["completed", { type: "start" }, "completed"],
  ["completed", { type: "cancel" }, "completed"],
  ["cancelled", { type: "resume" }, "cancelled"],
];

describe("nextRunStatus", () => {
  it.each(TABLE)("%s + %j -> %s", (status: RunStatus, event: RunEvent, expected: RunStatus) => {
    expect(nextRunStatus({ status, event })).toBe(expected);
  });
});

describe("applyRunEvent", () => {
  const items: RunItem[] = [item({ id: 1, status: "pending" }), item({ id: 2, status: "pending" })];

  it("records a created row with its RSS link", () => {
    const next = applyRunEvent({
      run: run({ status: "running", items }),
      event: { type: "row_done", itemId: 1, rssLink: "https://x/feed" },
    });
    expect(next.items[0]).toMatchObject({ status: "created", rssLink: "https://x/feed" });
    expect(next.items[1]?.status).toBe("pending");
  });

  it("records an updated row for an update item", () => {
    const next = applyRunEvent({
      run: run({ status: "running", items: [item({ id: 1, status: "pending", action: "update" })] }),
      event: { type: "row_done", itemId: 1, rssLink: "https://x/feed" },
    });
    expect(next.items[0]).toMatchObject({ status: "updated", rssLink: "https://x/feed" });
  });

  it("records a deleted row in a delete run", () => {
    const next = applyRunEvent({
      run: { ...run({ status: "running", items: [item({ id: 1, status: "pending", action: "delete" }), item({ id: 2, status: "pending", action: "delete" })] }), kind: "delete" },
      event: { type: "row_done", itemId: 2, rssLink: "" },
    });
    expect(next.items[1]?.status).toBe("deleted");
  });

  it("records a failed row with its message", () => {
    const next = applyRunEvent({
      run: run({ status: "running", items }),
      event: { type: "row_failed", itemId: 2, message: "boom" },
    });
    expect(next.items[1]).toMatchObject({ status: "failed", errorMessage: "boom" });
  });

  it("records a row result that arrives after a pause and keeps the run paused", () => {
    const paused = run({ status: "paused", items });
    const next = applyRunEvent({ run: paused, event: { type: "row_done", itemId: 1, rssLink: "" } });
    expect(next.status).toBe("paused");
    expect(next.items[0]?.status).toBe("created");
  });

  it("ignores a row result before the run starts", () => {
    const ready = run({ status: "ready", items });
    expect(applyRunEvent({ run: ready, event: { type: "row_done", itemId: 1, rssLink: "" } }).items[0]?.status).toBe("pending");
  });

  it("sets a notice for a bot check and clears it on resume", () => {
    const seen = applyRunEvent({ run: run({ status: "running", items }), event: { type: "captcha_seen" } });
    expect(seen.status).toBe("awaiting_captcha");
    expect(seen.notice).toContain("bot check");
    const cleared = applyRunEvent({ run: seen, event: { type: "captcha_cleared" } });
    expect(cleared.notice).toBe("");
  });

  it("keeps the layout message as notice", () => {
    const next = applyRunEvent({
      run: run({ status: "running", items }),
      event: { type: "layout_changed", message: "layout" },
    });
    expect(next).toMatchObject({ status: "paused", notice: "layout" });
  });

  it("puts failed rows back to pending on retry", () => {
    const done = run({ status: "completed", items: [item({ id: 1, status: "failed" }), item({ id: 2, status: "created" })] });
    const next = applyRunEvent({ run: done, event: { type: "retry_failed" } });
    expect(next.status).toBe("ready");
    expect(next.items.map((entry) => entry.status)).toEqual(["pending", "created"]);
  });
});

describe("links_filled", () => {
  it("fills missing RSS links of created rows after completion", () => {
    const done = run({
      status: "completed",
      items: [
        { ...item({ id: 1, status: "created" }), query: "Solar  Power" },
        { ...item({ id: 2, status: "created" }), query: "kept", rssLink: "old" },
        item({ id: 3, status: "failed" }),
      ],
    });
    const next = applyRunEvent({
      run: done,
      event: { type: "links_filled", linksByQuery: { "solar power": "https://x/solar", kept: "new" } },
    });
    expect(next.items.map((entry) => entry.rssLink)).toEqual(["https://x/solar", "old", ""]);
  });

  it("is ignored while the run is not completed", () => {
    const paused = run({ status: "paused", items: [item({ id: 1, status: "created" })] });
    const next = applyRunEvent({ run: paused, event: { type: "links_filled", linksByQuery: { q1: "u" } } });
    expect(next.items[0]?.rssLink).toBe("");
  });
});

describe("queue helpers", () => {
  const snapshot = run({
    status: "running",
    items: [item({ id: 1, status: "created" }), item({ id: 2, status: "pending" }), item({ id: 3, status: "failed" })],
  });

  it("finds the next pending item", () => {
    expect(nextPendingItem({ run: snapshot })?.id).toBe(2);
    expect(nextPendingItem({ run: run({ status: "running", items: [] }) })).toBeNull();
  });

  it("counts items by status", () => {
    expect(countByStatus({ run: snapshot })).toEqual({ pending: 1, created: 1, updated: 0, skipped: 0, failed: 1, deleted: 0 });
  });
});
