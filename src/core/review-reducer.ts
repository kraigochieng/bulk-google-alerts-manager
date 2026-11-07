import { importRowsFromDraft } from "src/core/draft-rows";
import type { DraftRow } from "src/core/draft-rows";
import type { OptionField } from "src/core/row-options";
import { isCheckedByDefault, isRowSelectable } from "src/core/row-rules";
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
  | { readonly type: "restore"; readonly state: ReviewState }
  | { readonly type: "set_checked"; readonly rowNumbers: readonly number[]; readonly checked: boolean }
  | { readonly type: "set_action"; readonly rowNumber: number; readonly action: RowAction }
  | { readonly type: "set_actions"; readonly rowNumbers: readonly number[]; readonly action: RowAction }
  | { readonly type: "replace_checked"; readonly rowNumbers: readonly number[] }
  | { readonly type: "delete_row"; readonly rowNumber: number }
  | { readonly type: "edit_query"; readonly rowNumber: number; readonly query: string }
  | { readonly type: "edit_option"; readonly rowNumber: number; readonly field: OptionField; readonly text: string };

/**
 * Replace the rows after an edit and update the checked rows.
 * A row that now has a blocking issue leaves the checked rows. A row that was blocked and is now fixed follows the default check rule.
 */
function replaceRows({
  state,
  rows,
  maximumQueryLength,
}: {
  state: ReviewState;
  rows: readonly DraftRow[];
  maximumQueryLength: number;
}): ReviewState {
  const rowsBefore: ImportRow[] = importRowsFromDraft({ rows: state.rows, maximumQueryLength });
  const selectableBefore: ReadonlyMap<number, boolean> = new Map(
    rowsBefore.map((row: ImportRow): [number, boolean] => [row.sourceRowNumber, isRowSelectable({ row })]),
  );
  const checkedRows: Set<number> = new Set(state.checkedRows);
  for (const row of importRowsFromDraft({ rows, maximumQueryLength })) {
    if (!isRowSelectable({ row })) checkedRows.delete(row.sourceRowNumber);
    else if (selectableBefore.get(row.sourceRowNumber) === false && isCheckedByDefault({ row })) checkedRows.add(row.sourceRowNumber);
  }
  return { ...state, rows, checkedRows };
}

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
  if (action.type === "restore") return action.state;
  if (action.type === "set_checked") {
    const checkedRows: Set<number> = new Set(state.checkedRows);
    for (const rowNumber of action.rowNumbers) {
      if (action.checked) checkedRows.add(rowNumber);
      else checkedRows.delete(rowNumber);
    }
    return { ...state, checkedRows };
  }
  if (action.type === "set_action") {
    return { ...state, actionOverrides: { ...state.actionOverrides, [action.rowNumber]: action.action } };
  }
  if (action.type === "set_actions") {
    const actionOverrides: Record<number, RowAction> = { ...state.actionOverrides };
    for (const rowNumber of action.rowNumbers) actionOverrides[rowNumber] = action.action;
    return { ...state, actionOverrides };
  }
  if (action.type === "replace_checked") return { ...state, checkedRows: new Set(action.rowNumbers) };
  if (!state.rows.some((row: DraftRow) => row.sourceRowNumber === action.rowNumber)) return state;
  if (action.type === "delete_row") {
    const checkedRows: Set<number> = new Set(state.checkedRows);
    checkedRows.delete(action.rowNumber);
    const actionOverrides: Record<number, RowAction> = {};
    for (const [key, choice] of Object.entries(state.actionOverrides)) {
      if (Number(key) !== action.rowNumber) actionOverrides[Number(key)] = choice;
    }
    return { rows: state.rows.filter((row: DraftRow) => row.sourceRowNumber !== action.rowNumber), checkedRows, actionOverrides };
  }
  if (action.type === "edit_query") {
    const rows: DraftRow[] = state.rows.map((row: DraftRow) =>
      row.sourceRowNumber === action.rowNumber ? { ...row, query: action.query } : row,
    );
    const actionOverrides: Record<number, RowAction> = {};
    for (const [key, choice] of Object.entries(state.actionOverrides)) {
      if (Number(key) !== action.rowNumber) actionOverrides[Number(key)] = choice;
    }
    return replaceRows({ state: { ...state, actionOverrides }, rows, maximumQueryLength });
  }
  const rows: DraftRow[] = state.rows.map((row: DraftRow) =>
    row.sourceRowNumber === action.rowNumber ? { ...row, cells: { ...row.cells, [action.field]: action.text } } : row,
  );
  return replaceRows({ state, rows, maximumQueryLength });
}
