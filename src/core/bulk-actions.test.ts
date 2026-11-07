import { describe, expect, it } from "vitest";

import { rowNumbersThatUpdate, validRowNumbers } from "src/core/bulk-actions";
import type { RowAction } from "src/core/review-reducer";
import type { ImportRow, RowIssue } from "src/shared/models";

function row({ number, issues }: { number: number; issues: RowIssue[] }): ImportRow {
  return { sourceRowNumber: number, query: "q", overrides: {}, issues };
}

const rows: ImportRow[] = [
  row({ number: 2, issues: [] }),
  row({ number: 3, issues: ["empty"] }),
  row({ number: 4, issues: ["duplicate_in_file"] }),
  row({ number: 5, issues: ["unlisted_option"] }),
];

describe("rowNumbersThatUpdate", () => {
  it("returns the rows with the action Update", () => {
    const actionFor = ({ row: current }: { row: ImportRow }): RowAction => (current.sourceRowNumber % 2 === 0 ? "update" : "create");
    expect(rowNumbersThatUpdate({ rows, actionFor })).toEqual([2, 4]);
  });

  it("returns an empty list when no row updates", () => {
    expect(rowNumbersThatUpdate({ rows, actionFor: () => "create" })).toEqual([]);
  });
});

describe("validRowNumbers", () => {
  it("returns the rows without a blocking issue", () => {
    expect(validRowNumbers({ rows })).toEqual([2, 4, 5]);
  });

  it("returns an empty list for no rows", () => {
    expect(validRowNumbers({ rows: [] })).toEqual([]);
  });
});
