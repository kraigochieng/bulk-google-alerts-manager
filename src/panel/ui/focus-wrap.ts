const FOCUSABLE_SELECTOR: string = [
  "button",
  "input:not([type=hidden]):not([hidden])",
  "textarea",
  "select",
  "summary",
  "a[href]",
  "[tabindex]:not([tabindex='-1']):not([data-focus-guard])",
  "md-filled-button",
  "md-outlined-button",
  "md-text-button",
  "md-icon-button",
  "md-checkbox",
  "md-radio",
  "md-filter-chip",
  "md-outlined-text-field",
  "md-outlined-select",
].join(",");

/** Move the focus to the first or the last control of a container that accepts it. Side effect: moves the focus. */
export function focusEdge({ container, edge }: { container: HTMLElement; edge: "first" | "last" }): void {
  const controls: HTMLElement[] = [...container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)].filter(
    (control: HTMLElement) => !control.matches(":disabled, [disabled]") && control.checkVisibility(),
  );
  const ordered: HTMLElement[] = edge === "first" ? controls : controls.reverse();
  ordered.some((control: HTMLElement) => {
    control.focus();
    return control.matches(":focus-within");
  });
}
