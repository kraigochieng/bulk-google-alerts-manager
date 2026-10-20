const POINTER_SEQUENCE: readonly string[] = [
  "pointerover",
  "mouseover",
  "pointermove",
  "mousemove",
  "pointerdown",
  "mousedown",
  "pointerup",
  "mouseup",
  "click",
];

/**
 * Send the full pointer and mouse event sequence to an element, like a real click.
 * Side effect: dispatches events on the page. The Closure widgets need all of them.
 */
export function syntheticClick({ element }: { element: HTMLElement }): void {
  const box: DOMRect = element.getBoundingClientRect();
  const eventInit: PointerEventInit = {
    bubbles: true,
    cancelable: true,
    view: window,
    clientX: box.x + box.width / 2,
    clientY: box.y + box.height / 2,
    button: 0,
    pointerId: 1,
    pointerType: "mouse",
    isPrimary: true,
  };
  for (const eventName of POINTER_SEQUENCE) {
    if (eventName === "mousedown") {
      element.focus();
    }
    const event: Event = eventName.startsWith("pointer")
      ? new PointerEvent(eventName, eventInit)
      : new MouseEvent(eventName, eventInit);
    element.dispatchEvent(event);
  }
}
