import { ADD_STEPS } from "src/core/add-steps";
import type { AddStep } from "src/core/add-steps";
import type { DraftRow, OptionCells } from "src/core/draft-rows";
import type { ReviewState, RowAction } from "src/core/review-reducer";

/** The version of the stored draft. A draft with another version is dropped. */
export const ADD_DRAFT_VERSION: number = 1;

/** The most rows that a draft holds. It equals the alert limit of one account. */
export const MAXIMUM_DRAFT_ROWS: number = 1000;

/** What the Add dialog saves so that a reload or a browser restart does not lose the work. */
export interface AddDraft {
  readonly version: number;
  readonly fileName: string;
  readonly step: AddStep;
  readonly extraColumns: readonly string[];
  readonly rows: readonly DraftRow[];
  readonly checkedRows: readonly number[];
  readonly actionOverrides: Readonly<Record<string, RowAction>>;
}

const OPTION_CELL_KEYS: readonly (keyof OptionCells)[] = ["howOften", "sources", "language", "region", "howMany", "deliverTo"];
const ROW_ACTIONS: readonly string[] = ["create", "update", "skip"];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseCells({ value }: { value: unknown }): OptionCells | null {
  if (!isRecord(value)) return null;
  const cells: Record<string, string> = {};
  for (const key of OPTION_CELL_KEYS) {
    const cell: unknown = value[key];
    if (typeof cell !== "string") return null;
    cells[key] = cell;
  }
  return cells as unknown as OptionCells;
}

function parseRow({ value }: { value: unknown }): DraftRow | null {
  if (!isRecord(value)) return null;
  const { sourceRowNumber, query } = value;
  const cells: OptionCells | null = parseCells({ value: value.cells });
  if (typeof sourceRowNumber !== "number" || !Number.isInteger(sourceRowNumber) || sourceRowNumber < 2) return null;
  if (typeof query !== "string" || cells === null) return null;
  return { sourceRowNumber, query, cells };
}

function parseList<Item>({ value, parseItem }: { value: unknown; parseItem: (item: unknown) => Item | null }): Item[] | null {
  if (!Array.isArray(value)) return null;
  const items: Item[] = [];
  for (const entry of value as unknown[]) {
    const item: Item | null = parseItem(entry);
    if (item === null) return null;
    items.push(item);
  }
  return items;
}

/** Read a stored draft. Return null for a value that is damaged, has another version, or has too many rows. Pure. */
export function parseAddDraft({ value }: { value: unknown }): AddDraft | null {
  if (!isRecord(value) || value.version !== ADD_DRAFT_VERSION) return null;
  const { fileName, step } = value;
  if (typeof fileName !== "string" || typeof step !== "string" || !ADD_STEPS.includes(step as AddStep)) return null;
  const rows: DraftRow[] | null = parseList({ value: value.rows, parseItem: (item: unknown) => parseRow({ value: item }) });
  const extraColumns: string[] | null = parseList({ value: value.extraColumns, parseItem: (item: unknown) => (typeof item === "string" ? item : null) });
  const checkedRows: number[] | null = parseList({
    value: value.checkedRows,
    parseItem: (item: unknown) => (typeof item === "number" && Number.isInteger(item) ? item : null),
  });
  if (rows === null || extraColumns === null || checkedRows === null || rows.length > MAXIMUM_DRAFT_ROWS) return null;
  if (!isRecord(value.actionOverrides)) return null;
  const actionOverrides: Record<string, RowAction> = {};
  for (const [key, choice] of Object.entries(value.actionOverrides)) {
    if (typeof choice !== "string" || !ROW_ACTIONS.includes(choice)) return null;
    actionOverrides[key] = choice as RowAction;
  }
  return { version: ADD_DRAFT_VERSION, fileName, step: step as AddStep, extraColumns, rows, checkedRows, actionOverrides };
}

/** Build the draft of the current work. Pure. */
export function buildAddDraft({
  fileName,
  step,
  extraColumns,
  review,
}: {
  fileName: string;
  step: AddStep;
  extraColumns: readonly string[];
  review: ReviewState;
}): AddDraft {
  return {
    version: ADD_DRAFT_VERSION,
    fileName,
    step,
    extraColumns,
    rows: review.rows,
    checkedRows: [...review.checkedRows],
    actionOverrides: Object.fromEntries(Object.entries(review.actionOverrides)),
  };
}

/** Turn a stored draft back into the review state. Pure. */
export function reviewStateFromDraft({ draft }: { draft: AddDraft }): ReviewState {
  const actionOverrides: Record<number, RowAction> = {};
  for (const [key, choice] of Object.entries(draft.actionOverrides)) actionOverrides[Number(key)] = choice;
  return { rows: draft.rows, checkedRows: new Set(draft.checkedRows), actionOverrides };
}
