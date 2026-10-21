import { countByStatus } from "src/core/run-machine";
import type { RunItem, RunSnapshot, RunStatus } from "src/shared/models";

/** The text of the dialog that tells the user how a run ended. */
export interface RunSummary {
  readonly title: string;
  readonly lines: readonly string[];
  readonly details: readonly string[];
  readonly hasFailures: boolean;
}

/** How many failed rows the result dialog names before it shows the count of the rest. */
const FAILURE_DETAIL_LIMIT: number = 5;

function failureDetails({ run }: { run: RunSnapshot }): string[] {
  const failed: RunItem[] = run.items.filter((item: RunItem) => item.status === "failed");
  const shown: string[] = failed
    .slice(0, FAILURE_DETAIL_LIMIT)
    .map((item: RunItem) => (item.errorMessage === "" ? item.query : `${item.query}: ${item.errorMessage}`));
  return failed.length > FAILURE_DETAIL_LIMIT
    ? [...shown, `...and ${String(failed.length - FAILURE_DETAIL_LIMIT)} more`]
    : shown;
}

/** Decide whether a run has ended: it is completed or cancelled. The result dialog shows for an ended run. */
export function runIsFinished({ status }: { status: RunStatus }): boolean {
  return status === "completed" || status === "cancelled";
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
    details: failureDetails({ run }),
    hasFailures: counts.failed > 0,
  };
}
