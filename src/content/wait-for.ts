import { LayoutChangedError } from "src/shared/errors";

/**
 * Wait until a finder returns a value. Side effect: observes the page.
 * The finder runs on each page change. No fixed timers decide the outcome.
 */
export async function waitFor<Found>({
  find,
  timeoutMilliseconds,
  onTimeout,
}: {
  find: () => Found | null | undefined;
  timeoutMilliseconds: number;
  onTimeout: () => Error;
}): Promise<Found> {
  const immediate: Found | null | undefined = find();
  if (immediate !== null && immediate !== undefined) {
    return immediate;
  }
  return new Promise<Found>((resolve, reject) => {
    const observer: MutationObserver = new MutationObserver(() => {
      const found: Found | null | undefined = find();
      if (found !== null && found !== undefined) {
        cleanUp();
        resolve(found);
      }
    });
    const timeoutHandle: number = window.setTimeout(() => {
      cleanUp();
      reject(onTimeout());
    }, timeoutMilliseconds);
    function cleanUp(): void {
      observer.disconnect();
      window.clearTimeout(timeoutHandle);
    }
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      characterData: true,
    });
  });
}

/** Wait for a visible element that matches a selector. Throw LayoutChangedError on timeout. */
export async function waitForVisible({
  selector,
  scope,
  timeoutMilliseconds,
}: {
  selector: string;
  scope: ParentNode;
  timeoutMilliseconds: number;
}): Promise<HTMLElement> {
  return waitFor<HTMLElement>({
    find: () => findVisible({ selector, scope }),
    timeoutMilliseconds,
    onTimeout: () => new LayoutChangedError({ selectorName: selector }),
  });
}

/** Return the first visible element that matches a selector, or null. */
export function findVisible({
  selector,
  scope,
}: {
  selector: string;
  scope: ParentNode;
}): HTMLElement | null {
  const candidates: HTMLElement[] = [...scope.querySelectorAll<HTMLElement>(selector)];
  return candidates.find((element: HTMLElement) => element.offsetParent !== null) ?? null;
}
