import { nextPendingItem } from "src/core/run-machine";
import type { RunEvent } from "src/core/run-machine";
import type { ContentReply, PanelRequest } from "src/shared/messages";
import type { RunItem, RunSnapshot } from "src/shared/models";

/** Everything that the run loop needs from the outside. Side effects stay behind these. */
export interface RunEngineDependencies {
  readonly getRun: () => RunSnapshot;
  readonly dispatch: (event: RunEvent) => void;
  readonly sendToPage: (request: PanelRequest) => Promise<ContentReply>;
}

const HIDDEN_TAB_NOTICE: string =
  "The Alerts tab is in the background. Browsers slow background tabs. Bring the tab to the foreground, then resume.";
const UNREACHABLE_NOTICE: string =
  "The extension cannot reach the Alerts tab. Open https://www.google.com/alerts in a tab, reload it, then resume.";

function requestFor({ run, item }: { run: RunSnapshot; item: RunItem }): PanelRequest | null {
  if (run.kind === "delete") {
    return { kind: "delete_alert", query: item.query };
  }
  if (item.options === null) return null;
  return item.action === "update"
    ? { kind: "update_alert", query: item.query, options: item.options }
    : { kind: "create_alert", query: item.query, options: item.options };
}

/** Check that the page answers and shows in the foreground. Returns false when the run must pause. */
async function pageIsReady({ dependencies }: { dependencies: RunEngineDependencies }): Promise<boolean> {
  let reply: ContentReply;
  try {
    reply = await dependencies.sendToPage({ kind: "ping" });
  } catch {
    dependencies.dispatch({ type: "pause", reason: UNREACHABLE_NOTICE });
    return false;
  }
  if (reply.ok && reply.kind === "pong" && reply.hidden) {
    dependencies.dispatch({ type: "pause", reason: HIDDEN_TAB_NOTICE });
    return false;
  }
  if (!reply.ok) {
    dependencies.dispatch({ type: "pause", reason: reply.message });
    return false;
  }
  return true;
}

/** Run one queued item on the page and dispatch its result. Returns false when the loop must stop. */
async function runItem({
  dependencies,
  item,
}: {
  dependencies: RunEngineDependencies;
  item: RunItem;
}): Promise<boolean> {
  const request: PanelRequest | null = requestFor({ run: dependencies.getRun(), item });
  if (request === null) {
    dependencies.dispatch({ type: "row_failed", itemId: item.id, message: "The row has no options." });
    return true;
  }
  let reply: ContentReply;
  try {
    reply = await dependencies.sendToPage(request);
  } catch {
    dependencies.dispatch({ type: "pause", reason: UNREACHABLE_NOTICE });
    return false;
  }
  if (reply.ok) {
    dependencies.dispatch({ type: "row_done", itemId: item.id });
    return true;
  }
  if (reply.botCheck) {
    dependencies.dispatch({ type: "captcha_seen" });
    return false;
  }
  if (reply.layoutChanged) {
    dependencies.dispatch({ type: "layout_changed", message: reply.message });
    return false;
  }
  dependencies.dispatch({ type: "row_failed", itemId: item.id, message: reply.message });
  return true;
}

/**
 * Run the queue until it is empty, paused, or stopped by a bot check. Side effect: drives the page.
 * The caller must start only one loop at a time.
 */
export async function runQueue({ dependencies }: { dependencies: RunEngineDependencies }): Promise<void> {
  while (dependencies.getRun().status === "running") {
    const item: RunItem | null = nextPendingItem({ run: dependencies.getRun() });
    if (item === null) {
      dependencies.dispatch({ type: "queue_empty" });
      return;
    }
    if (!(await pageIsReady({ dependencies }))) {
      return;
    }
    if (!(await runItem({ dependencies, item }))) {
      return;
    }
  }
}
