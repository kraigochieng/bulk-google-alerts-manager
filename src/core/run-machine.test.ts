import { describe, expect, it } from "vitest";

import { applyRunEvent, countByStatus, nextPendingItem, nextRunStatus } from "src/core/run-machine";
import type { RunEvent } from "src/core/run-machine";
import type { RunItem, RunSnapshot, RunStatus } from "src/shared/models";

function item({ id, status }: { id: number; status: RunItem["status"] }): RunItem {
  return { id, query: `q${String(id)}`, options: null, label: "", status, rssLink: "", errorMessage: "" };
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

  it("records a deleted row in a delete run", () => {
    const next = applyRunEvent({
      run: { ...run({ status: "running", items }), kind: "delete" },
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

  it("ignores a row result when the run is not running", () => {
    const paused = run({ status: "paused", items });
    expect(applyRunEvent({ run: paused, event: { type: "row_done", itemId: 1, rssLink: "" } })).toBe(paused);
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
    expect(countByStatus({ run: snapshot })).toEqual({ pending: 1, created: 1, skipped: 0, failed: 1, deleted: 0 });
  });
});
