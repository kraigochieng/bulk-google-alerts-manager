import type { PageCommand } from "src/shared/frame-messages";

const BAR_STYLE: string = `
  :host { all: initial; }
  .bar {
    position: fixed; left: 50%; bottom: 16px; transform: translateX(-50%); z-index: 2147482000;
    display: flex; align-items: center; gap: 12px; padding: 8px 16px;
    background: #ffffff; color: #202124; border: 1px solid #dadce0; border-radius: 24px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
    font: 14px/20px Roboto, Arial, sans-serif;
  }
  label { display: flex; align-items: center; gap: 8px; cursor: pointer; }
  input { width: 18px; height: 18px; margin: 0; accent-color: #1a73e8; cursor: pointer; }
  button { border: 0; background: none; color: #1a73e8; font: inherit; cursor: pointer; padding: 4px 8px; }
  .actions { display: flex; gap: 4px; margin-left: 8px; padding-left: 8px; border-left: 1px solid #dadce0; }
  .actions button { display: inline-flex; align-items: center; gap: 6px; border-radius: 16px; padding: 4px 12px; }
  .actions svg { width: 18px; height: 18px; fill: currentColor; }
  .actions button.primary { background: #1a73e8; color: #ffffff; }
  .actions button.danger { color: #d93025; }
  .actions button.primary:disabled, .actions button.danger:disabled { background: none; color: #9aa0a6; }
  button:disabled { color: #9aa0a6; cursor: default; }
`;

const SVG_NAMESPACE = "http://www.w3.org/2000/svg" as const;

/** The Material Symbols path of the icon of each command. */
const COMMAND_ICON_PATHS: Record<PageCommand, string> = {
  export: "M5 20h14v-2H5v2zM19 9h-4V3H9v6H5l7 7 7-7z",
  delete: "M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z",
  add: "M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z",
};

/** Make the icon of a command as an inline SVG. The icon hides from screen readers. */
function createCommandIcon({ command }: { command: PageCommand }): SVGSVGElement {
  const icon: SVGSVGElement = document.createElementNS(SVG_NAMESPACE, "svg");
  icon.setAttribute("viewBox", "0 0 24 24");
  icon.setAttribute("aria-hidden", "true");
  const path: SVGPathElement = document.createElementNS(SVG_NAMESPACE, "path");
  path.setAttribute("d", COMMAND_ICON_PATHS[command]);
  icon.append(path);
  return icon;
}

/** Make one action button. A click calls onCommand with the command. */
function createActionButton({
  label,
  command,
  onCommand,
}: {
  label: string;
  command: PageCommand;
  onCommand: (command: PageCommand) => void;
}): HTMLButtonElement {
  const button: HTMLButtonElement = document.createElement("button");
  button.type = "button";
  button.append(createCommandIcon({ command }), label);
  button.addEventListener("click", () => {
    onCommand(command);
  });
  return button;
}

/** What the bar shows. */
export interface SelectionBarView {
  readonly selectedCount: number;
  readonly totalCount: number;
}

/** The bar that checks all rows. Call update to change what it shows. */
export interface SelectionBar {
  readonly update: (view: SelectionBarView) => void;
}

/** Add a floating bar with a check-all checkbox, the count, a clear button, and the action buttons. Side effect: adds an element to the page. */
export function createSelectionBar({
  onSelectAll,
  onClear,
  onCommand,
}: {
  onSelectAll: () => void;
  onClear: () => void;
  onCommand: (command: PageCommand) => void;
}): SelectionBar {
  const host: HTMLElement = document.createElement("div");
  const shadowRoot: ShadowRoot = host.attachShadow({ mode: "open" });
  const style: HTMLStyleElement = document.createElement("style");
  style.textContent = BAR_STYLE;
  const bar: HTMLDivElement = document.createElement("div");
  bar.className = "bar";
  const label: HTMLLabelElement = document.createElement("label");
  const checkAll: HTMLInputElement = document.createElement("input");
  checkAll.type = "checkbox";
  const count: HTMLSpanElement = document.createElement("span");
  label.append(checkAll, count);
  const clear: HTMLButtonElement = document.createElement("button");
  clear.type = "button";
  clear.textContent = "Clear";
  const actions: HTMLDivElement = document.createElement("div");
  actions.className = "actions";
  const exportButton: HTMLButtonElement = createActionButton({ label: "Export", command: "export", onCommand });
  const deleteButton: HTMLButtonElement = createActionButton({ label: "Delete", command: "delete", onCommand });
  deleteButton.className = "danger";
  const addButton: HTMLButtonElement = createActionButton({ label: "Add", command: "add", onCommand });
  addButton.className = "primary";
  actions.append(exportButton, deleteButton, addButton);
  bar.append(label, clear, actions);
  shadowRoot.append(style, bar);
  document.body.append(host);

  checkAll.addEventListener("change", () => {
    if (checkAll.checked) onSelectAll();
    else onClear();
  });
  clear.addEventListener("click", onClear);

  return {
    update: ({ selectedCount, totalCount }: SelectionBarView): void => {
      checkAll.disabled = totalCount === 0;
      checkAll.checked = totalCount > 0 && selectedCount === totalCount;
      checkAll.indeterminate = selectedCount > 0 && selectedCount < totalCount;
      count.textContent = selectedCount === 0 ? "Select all" : `${String(selectedCount)} selected`;
      clear.disabled = selectedCount === 0;
      exportButton.disabled = selectedCount === 0;
      deleteButton.disabled = selectedCount === 0;
    },
  };
}
