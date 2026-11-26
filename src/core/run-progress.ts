import { nextPendingItem } from "src/core/run-machine";
import { buildResultLines } from "src/core/run-summary";
import type { RunItem, RunSnapshot } from "src/shared/models";

/** What the loader of a run says about its rows. */
export interface RunProgress {
  readonly currentRow: string | null;
  readonly countLines: readonly string[];
}

/** Describe the row that a run works on, or works on next, plus the counts of the results so far. */
export function describeRunProgress({ run }: { run: RunSnapshot }): RunProgress {
  const item: RunItem | null = nextPendingItem({ run });
  const prefix: string = run.status === "running" ? "Now" : "Next";
  return {
    currentRow: item === null ? null : `${prefix}: ${item.query}`,
    countLines: buildResultLines({ run }),
  };
}
