import { readAlertRowElements } from "src/content/list-reader";
import type { AlertRowElement } from "src/content/list-reader";
import { createSelectionBar } from "src/content/selection-bar";
import type { SelectionBar } from "src/content/selection-bar";
import { SELECTORS } from "src/content/selectors";
import { applySelectionEvent, countSelectedRows, EMPTY_SELECTION } from "src/core/page-selection";
import type { PageSelection, SelectionEvent } from "src/core/page-selection";
import { normaliseQuery } from "src/core/query-normaliser";
import type { PageCommand } from "src/shared/frame-messages";
import type { LiveAlert } from "src/shared/models";

const CHECKBOX_STYLE: string =
  "position:absolute;left:-36px;top:50%;transform:translateY(-50%);width:20px;height:20px;margin:0;cursor:pointer;accent-color:#1a73e8;";

function rowKey({ row }: { row: AlertRowElement }): string {
  return normaliseQuery({ query: row.alert.query });
}

/** Add a checkbox as the first child of a row when it has none. Side effect: changes the row. */
function ensureCheckbox({ row, onToggle }: { row: AlertRowElement; onToggle: (query: string) => void }): HTMLInputElement {
  const existing: HTMLInputElement | null = row.element.querySelector<HTMLInputElement>(SELECTORS.rowCheckbox);
  if (existing !== null) return existing;
  const checkbox: HTMLInputElement = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.setAttribute("data-bulk-alerts-row-checkbox", "");
  checkbox.setAttribute("aria-label", `Select the alert ${row.alert.query}`);
  checkbox.style.cssText = CHECKBOX_STYLE;
  checkbox.addEventListener("click", (event: MouseEvent) => {
    event.stopPropagation();
  });
  checkbox.addEventListener("change", () => {
    const currentRow: AlertRowElement | undefined = readAlertRowElements().find(
      (candidate: AlertRowElement) => candidate.element === row.element,
    );
    onToggle(rowKey({ row: currentRow ?? row }));
  });
  if (getComputedStyle(row.element).position === "static") row.element.style.position = "relative";
  row.element.prepend(checkbox);
  return checkbox;
}

/**
 * Put a checkbox in each alert row and a bar that checks all rows.
 * A row that Google draws again gets its checkbox again. The selection is keyed by the normalised query.
 * It calls onChange with the checked alerts, in page order, when they change.
 * It calls onCommand when the user clicks a button of the bar.
 * Side effect: changes the page and watches it.
 */
export function startRowSelection({
  onChange,
  onCommand,
}: {
  onChange: (alerts: readonly LiveAlert[]) => void;
  onCommand: (command: PageCommand) => void;
}): void {
  let selection: PageSelection = EMPTY_SELECTION;
  let rows: AlertRowElement[] = [];
  let bar: SelectionBar | null = null;
  let reportedKey: string = "";

  const render = (): void => {
    const liveQueries: string[] = rows.map((row: AlertRowElement) => rowKey({ row }));
    for (const row of rows) {
      ensureCheckbox({ row, onToggle: (query: string) => { dispatch({ type: "toggle", query }); } }).checked = selection.has(rowKey({ row }));
    }
    bar?.update({ selectedCount: countSelectedRows({ selection, liveQueries }), totalCount: rows.length });
    const selectedAlerts: LiveAlert[] = rows.filter((row: AlertRowElement) => selection.has(rowKey({ row }))).map((row: AlertRowElement) => row.alert);
    const selectedKey: string = JSON.stringify(selectedAlerts);
    if (selectedKey !== reportedKey) {
      reportedKey = selectedKey;
      onChange(selectedAlerts);
    }
  };

  const dispatch = (event: SelectionEvent): void => {
    selection = applySelectionEvent({ selection, event });
    render();
  };

  const sync = (): void => {
    rows = readAlertRowElements();
    selection = applySelectionEvent({
      selection,
      event: { type: "rows_changed", liveQueries: rows.map((row: AlertRowElement) => rowKey({ row })) },
    });
    render();
  };

  bar = createSelectionBar({
    onCommand,
    onSelectAll: () => {
      dispatch({ type: "select_all", queries: rows.map((row: AlertRowElement) => rowKey({ row })) });
    },
    onClear: () => {
      dispatch({ type: "clear" });
    },
  });

  let syncScheduled: boolean = false;
  new MutationObserver(() => {
    if (syncScheduled) return;
    syncScheduled = true;
    requestAnimationFrame(() => {
      syncScheduled = false;
      sync();
    });
  }).observe(document.body, { childList: true, subtree: true });
  sync();
}
