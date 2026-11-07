import type { RowAction } from "src/core/review-reducer";
import { isRowSelectable } from "src/core/row-rules";
import type { ImportRow } from "src/shared/models";

/** Return the row numbers of the rows whose action is Update. Pure. */
export function rowNumbersThatUpdate({
  rows,
  actionFor,
}: {
  rows: readonly ImportRow[];
  actionFor: (input: { row: ImportRow }) => RowAction;
}): number[] {
  return rows.filter((row: ImportRow) => actionFor({ row }) === "update").map((row: ImportRow) => row.sourceRowNumber);
}

/** Return the row numbers of the rows without a blocking issue. Pure. */
export function validRowNumbers({ rows }: { rows: readonly ImportRow[] }): number[] {
  return rows.filter((row: ImportRow) => isRowSelectable({ row })).map((row: ImportRow) => row.sourceRowNumber);
}
