import type { RowAction } from "src/core/review-reducer";
import { BLOCKING_ISSUES } from "src/core/row-rules";
import type { RowIssue } from "src/shared/models";

/** The kind of badge that a row shows. */
export type RowBadgeKind = "problem" | "duplicate" | "skipped" | "updates" | "similar" | "new";

/** The text of each badge. */
export const ROW_BADGE_LABELS: Readonly<Record<RowBadgeKind, string>> = {
  problem: "Problem",
  duplicate: "Duplicate",
  skipped: "Skipped",
  updates: "Updates alert",
  similar: "Similar",
  new: "New",
};

/**
 * Decide the badge of a row. A blocking issue wins, then a duplicate in the file, then the action of the row.
 * A row that creates and has a similar alert shows Similar. Pure.
 */
export function rowBadge({
  issues,
  action,
  hasSimilarAlert,
}: {
  issues: readonly RowIssue[];
  action: RowAction;
  hasSimilarAlert: boolean;
}): RowBadgeKind {
  if (issues.some((issue: RowIssue) => BLOCKING_ISSUES.includes(issue))) return "problem";
  if (issues.includes("duplicate_in_file")) return "duplicate";
  if (action === "skip") return "skipped";
  if (action === "update") return "updates";
  return hasSimilarAlert ? "similar" : "new";
}
