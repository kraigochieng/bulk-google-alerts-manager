import { importRowsFromDraft } from "src/core/draft-rows";
import type { DraftRow } from "src/core/draft-rows";
import { isCheckedByDefault } from "src/core/row-rules";
import type { ImportRow } from "src/shared/models";

/** What the run does with a checked row. */
export type RowAction = "create" | "update" | "skip";

/** What the review step holds: the editable rows, the checked rows, and the action choices of the user. */
export interface ReviewState {
  readonly rows: readonly DraftRow[];
  readonly checkedRows: ReadonlySet<number>;
  readonly actionOverrides: Readonly<Record<number, RowAction>>;
}

export const EMPTY_REVIEW_STATE: ReviewState = { rows: [], checkedRows: new Set(), actionOverrides: {} };

/** One change of the review state. */
export type ReviewAction =
  | { readonly type: "load"; readonly rows: readonly DraftRow[] }
  | { readonly type: "set_checked"; readonly rowNumbers: readonly number[]; readonly checked: boolean }
  | { readonly type: "set_action"; readonly rowNumber: number; readonly action: RowAction };

/** Apply one change to the review state and return the new state. Pure. */
export function reviewReducer({
  state,
  action,
  maximumQueryLength,
}: {
  state: ReviewState;
  action: ReviewAction;
  maximumQueryLength: number;
}): ReviewState {
  if (action.type === "load") {
    const importRows: ImportRow[] = importRowsFromDraft({ rows: action.rows, maximumQueryLength });
    const checkedRows: Set<number> = new Set(
      importRows.filter((row: ImportRow) => isCheckedByDefault({ row })).map((row: ImportRow) => row.sourceRowNumber),
    );
    return { rows: action.rows, checkedRows, actionOverrides: {} };
  }
  if (action.type === "set_checked") {
    const checkedRows: Set<number> = new Set(state.checkedRows);
    for (const rowNumber of action.rowNumbers) {
      if (action.checked) checkedRows.add(rowNumber);
      else checkedRows.delete(rowNumber);
    }
    return { ...state, checkedRows };
  }
  return { ...state, actionOverrides: { ...state.actionOverrides, [action.rowNumber]: action.action } };
}
