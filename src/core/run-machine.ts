import { normaliseQuery } from "src/core/query-normaliser";
import type { RunItem, RunSnapshot, RunStatus } from "src/shared/models";

export type RunEvent =
  | { readonly type: "start" }
  | { readonly type: "pause"; readonly reason: string }
  | { readonly type: "resume" }
  | { readonly type: "cancel" }
  | { readonly type: "interrupted" }
  | { readonly type: "row_done"; readonly itemId: number; readonly rssLink: string }
  | { readonly type: "row_failed"; readonly itemId: number; readonly message: string }
  | { readonly type: "queue_empty" }
  | { readonly type: "captcha_seen" }
  | { readonly type: "captcha_cleared" }
  | { readonly type: "layout_changed"; readonly message: string }
  | { readonly type: "retry_failed" }
  | { readonly type: "links_filled"; readonly linksByQuery: Readonly<Record<string, string>> };

const CAPTCHA_NOTICE: string = "Google shows a bot check. Solve it in the Alerts tab, then continue.";

/** Decide the next status. An event that changes nothing returns the same status. */
export function nextRunStatus({ status, event }: { status: RunStatus; event: RunEvent }): RunStatus {
  switch (status) {
    case "idle":
    case "ready":
      return event.type === "start" ? "running" : status;
    case "running":
      return runningTransition({ event });
    case "paused":
      if (event.type === "resume") return "running";
      return event.type === "cancel" ? "cancelled" : status;
    case "awaiting_captcha":
      if (event.type === "captcha_cleared") return "running";
      return event.type === "cancel" ? "cancelled" : status;
    case "completed":
    case "cancelled":
      return event.type === "retry_failed" ? "ready" : status;
  }
}

function runningTransition({ event }: { event: RunEvent }): RunStatus {
  switch (event.type) {
    case "pause":
    case "layout_changed":
    case "interrupted":
      return "paused";
    case "queue_empty":
      return "completed";
    case "captcha_seen":
      return "awaiting_captcha";
    case "cancel":
      return "cancelled";
    default:
      return "running";
  }
}

function updateItem({
  items,
  itemId,
  update,
}: {
  items: readonly RunItem[];
  itemId: number;
  update: Partial<RunItem>;
}): RunItem[] {
  return items.map((item: RunItem) => (item.id === itemId ? { ...item, ...update } : item));
}

function noticeFor({ event, previous }: { event: RunEvent; previous: string }): string {
  switch (event.type) {
    case "pause":
      return event.reason;
    case "layout_changed":
      return event.message;
    case "interrupted":
      return "The run was interrupted. Check the Alerts tab, then resume.";
    case "captcha_seen":
      return CAPTCHA_NOTICE;
    case "start":
    case "resume":
    case "captcha_cleared":
    case "retry_failed":
    case "queue_empty":
      return "";
    default:
      return previous;
  }
}

/**
 * Apply one event to a run. Pure: returns a new snapshot.
 * A row result that arrives after a pause or cancel is still recorded, because the page already did the work.
 */
export function applyRunEvent({ run, event }: { run: RunSnapshot; event: RunEvent }): RunSnapshot {
  const status: RunStatus = nextRunStatus({ status: run.status, event });
  const changed: boolean = status !== run.status;
  let items: readonly RunItem[] = run.items;
  const resultMayArrive: boolean = !["idle", "ready"].includes(run.status);
  if (resultMayArrive && event.type === "row_done") {
    items = updateItem({
      items,
      itemId: event.itemId,
      update: { status: run.kind === "create" ? "created" : "deleted", rssLink: event.rssLink, errorMessage: "" },
    });
  }
  if (resultMayArrive && event.type === "row_failed") {
    items = updateItem({ items, itemId: event.itemId, update: { status: "failed", errorMessage: event.message } });
  }
  if (run.status === "completed" && event.type === "links_filled") {
    items = items.map((item: RunItem) =>
      item.status === "created" && item.rssLink === ""
        ? { ...item, rssLink: event.linksByQuery[normaliseQuery({ query: item.query })] ?? "" }
        : item,
    );
  }
  if (changed && event.type === "retry_failed") {
    items = items.map((item: RunItem) =>
      item.status === "failed" ? { ...item, status: "pending", errorMessage: "" } : item,
    );
  }
  return { ...run, status, items, notice: changed || event.type === "row_done" ? noticeFor({ event, previous: run.notice }) : run.notice };
}

/** Return the first item that still waits to run, or null. */
export function nextPendingItem({ run }: { run: RunSnapshot }): RunItem | null {
  return run.items.find((item: RunItem) => item.status === "pending") ?? null;
}

/** Count items for each status. */
export function countByStatus({ run }: { run: RunSnapshot }): Record<RunItem["status"], number> {
  const counts: Record<RunItem["status"], number> = {
    pending: 0,
    created: 0,
    skipped: 0,
    failed: 0,
    deleted: 0,
  };
  for (const item of run.items) {
    counts[item.status] += 1;
  }
  return counts;
}
