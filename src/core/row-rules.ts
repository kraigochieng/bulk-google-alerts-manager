import type { ImportRow, RowIssue } from "src/shared/models";

/** The issues that stop a row from running. */
export const BLOCKING_ISSUES: readonly RowIssue[] = ["empty", "too_long", "invalid_option"];

/** The issues that only warn. The row can still run. */
export const WARNING_ISSUES: readonly RowIssue[] = ["unlisted_option"];

/** Decide whether the user may check the row. A row with a blocking issue cannot run. Pure. */
export function isRowSelectable({ row }: { row: Pick<ImportRow, "issues"> }): boolean {
  return !row.issues.some((issue: RowIssue) => BLOCKING_ISSUES.includes(issue));
}

/** Decide whether the review checks the row at the start. A row with a duplicate or a blocking issue starts unchecked. Pure. */
export function isCheckedByDefault({ row }: { row: Pick<ImportRow, "issues"> }): boolean {
  return row.issues.every((issue: RowIssue) => WARNING_ISSUES.includes(issue));
}
