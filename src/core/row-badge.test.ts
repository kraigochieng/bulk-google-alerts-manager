import { describe, expect, it } from "vitest";

import type { RowAction } from "src/core/review-reducer";
import { ROW_BADGE_LABELS, rowBadge } from "src/core/row-badge";
import type { RowBadgeKind } from "src/core/row-badge";
import type { RowIssue } from "src/shared/models";

describe("rowBadge", () => {
  it.each<[string, RowIssue[], RowAction, boolean, RowBadgeKind]>([
    ["an empty query", ["empty"], "create", false, "problem"],
    ["an invalid option beats an update", ["invalid_option"], "update", true, "problem"],
    ["a duplicate in the file", ["duplicate_in_file"], "create", false, "duplicate"],
    ["a skipped row", [], "skip", true, "skipped"],
    ["an update row", [], "update", true, "updates"],
    ["a create row with a similar alert", [], "create", true, "similar"],
    ["a create row without a match", [], "create", false, "new"],
    ["a warning only", ["unlisted_option"], "create", false, "new"],
  ])("gives the badge for %s", (_name, issues, action, hasSimilarAlert, expected) => {
    expect(rowBadge({ issues, action, hasSimilarAlert })).toBe(expected);
  });

  it("has a label for each kind", () => {
    expect(Object.values(ROW_BADGE_LABELS).every((label: string) => label !== "")).toBe(true);
  });
});
