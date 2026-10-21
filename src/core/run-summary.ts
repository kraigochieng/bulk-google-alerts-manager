import { countByStatus } from "src/core/run-machine";
import type { RunSnapshot, RunStatus } from "src/shared/models";

/** The text of the dialog that tells the user how a run ended. */
export interface RunSummary {
  readonly title: string;
  readonly lines: readonly string[];
  readonly hasFailures: boolean;
}

const ACTIVE_STATUSES: readonly RunStatus[] = ["running", "paused", "awaiting_captcha"];

/** Decide whether a run has just ended: it was active and it is now completed or cancelled. */
export function runJustEnded({ previous, current }: { previous: RunStatus | null; current: RunStatus }): boolean {
  return (
    previous !== null &&
    ACTIVE_STATUSES.includes(previous) &&
    (current === "completed" || current === "cancelled")
  );
}

/** Build the title and the count lines of a finished run. A count of 0 gets no line. */
export function buildRunSummary({ run }: { run: RunSnapshot }): RunSummary {
  const counts = countByStatus({ run });
  const cancelled: boolean = run.status === "cancelled";
  const isCreate: boolean = run.kind === "create";
  const candidates: readonly (readonly [string, number])[] = isCreate
    ? [
        ["Created", counts.created],
        ["Updated", counts.updated],
        ["Skipped", counts.skipped],
        ["Failed", counts.failed],
        ["Not run", counts.pending],
      ]
    : [
        ["Deleted", counts.deleted],
        ["Skipped", counts.skipped],
        ["Failed", counts.failed],
        ["Not run", counts.pending],
      ];
  const lines: string[] = candidates
    .filter(([, count]: readonly [string, number]) => count > 0)
    .map(([label, count]: readonly [string, number]) => `${label}: ${String(count)}`);
  const kindText: string = isCreate ? "The add run" : "The delete run";
  return {
    title: cancelled ? `${kindText} was cancelled` : `${kindText} is complete`,
    lines: lines.length === 0 ? ["No row ran."] : lines,
    hasFailures: counts.failed > 0,
  };
}
