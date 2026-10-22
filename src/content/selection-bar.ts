const BAR_STYLE: string = `
  :host { all: initial; }
  .bar {
    position: fixed; left: 50%; bottom: 16px; transform: translateX(-50%); z-index: 2147482000;
    display: flex; align-items: center; gap: 12px; padding: 8px 16px;
    background: #ffffff; color: #202124; border: 1px solid #dadce0; border-radius: 24px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
    font: 14px/20px Roboto, Arial, sans-serif;
  }
  .bar[hidden] { display: none; }
  label { display: flex; align-items: center; gap: 8px; cursor: pointer; }
  input { width: 18px; height: 18px; margin: 0; accent-color: #1a73e8; cursor: pointer; }
  button { border: 0; background: none; color: #1a73e8; font: inherit; cursor: pointer; padding: 4px 8px; }
  button:disabled { color: #9aa0a6; cursor: default; }
`;

/** What the bar shows. */
export interface SelectionBarView {
  readonly selectedCount: number;
  readonly totalCount: number;
}

/** The bar that checks all rows. Call update to change what it shows. */
export interface SelectionBar {
  readonly update: (view: SelectionBarView) => void;
}

/** Add a floating bar with a check-all checkbox, the count, and a clear button. Side effect: adds an element to the page. */
export function createSelectionBar({
  onSelectAll,
  onClear,
}: {
  onSelectAll: () => void;
  onClear: () => void;
}): SelectionBar {
  const host: HTMLElement = document.createElement("div");
  const shadowRoot: ShadowRoot = host.attachShadow({ mode: "open" });
  const style: HTMLStyleElement = document.createElement("style");
  style.textContent = BAR_STYLE;
  const bar: HTMLDivElement = document.createElement("div");
  bar.className = "bar";
  bar.hidden = true;
  const label: HTMLLabelElement = document.createElement("label");
  const checkAll: HTMLInputElement = document.createElement("input");
  checkAll.type = "checkbox";
  const count: HTMLSpanElement = document.createElement("span");
  label.append(checkAll, count);
  const clear: HTMLButtonElement = document.createElement("button");
  clear.type = "button";
  clear.textContent = "Clear";
  bar.append(label, clear);
  shadowRoot.append(style, bar);
  document.body.append(host);

  checkAll.addEventListener("change", () => {
    if (checkAll.checked) onSelectAll();
    else onClear();
  });
  clear.addEventListener("click", onClear);

  return {
    update: ({ selectedCount, totalCount }: SelectionBarView): void => {
      bar.hidden = totalCount === 0;
      checkAll.checked = totalCount > 0 && selectedCount === totalCount;
      checkAll.indeterminate = selectedCount > 0 && selectedCount < totalCount;
      count.textContent = selectedCount === 0 ? "Select all" : `${String(selectedCount)} selected`;
      clear.disabled = selectedCount === 0;
    },
  };
}
