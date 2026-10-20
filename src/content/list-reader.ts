import { SELECTORS, TIMING } from "src/content/selectors";
import { syntheticClick } from "src/content/synthetic-click";
import { findVisible, waitFor } from "src/content/wait-for";
import { LayoutChangedError } from "src/shared/errors";
import type { LiveAlert } from "src/shared/models";

/** One visible alert row on the page, with its element. */
export interface AlertRowElement {
  readonly element: HTMLElement;
  readonly alert: LiveAlert;
}

/** Read the visible alert rows of the list. Reads the page. */
export function readAlertRowElements(): AlertRowElement[] {
  const rows: HTMLElement[] = [...document.querySelectorAll<HTMLElement>(SELECTORS.alertRow)].filter(
    (row: HTMLElement) => row.offsetParent !== null,
  );
  return rows.map((element: HTMLElement): AlertRowElement => {
    const queryElement: Element | null = element.querySelector(SELECTORS.alertRowQuery);
    if (queryElement === null) {
      throw new LayoutChangedError({ selectorName: SELECTORS.alertRowQuery });
    }
    const feedLink: HTMLAnchorElement | null = element.querySelector<HTMLAnchorElement>(
      SELECTORS.alertRowFeedLink,
    );
    return {
      element,
      alert: { query: queryElement.textContent.trim(), feedUrl: feedLink?.href ?? null },
    };
  });
}

/** Click "Show all alerts" when it is visible and wait until the full list shows. Side effect. */
export async function expandAllAlerts(): Promise<void> {
  const showAllButton: HTMLElement | null = findVisible({
    selector: SELECTORS.showAllAlerts,
    scope: document,
  });
  if (showAllButton === null) {
    return;
  }
  syntheticClick({ element: showAllButton });
  await waitFor<true>({
    find: () => (findVisible({ selector: SELECTORS.showAllAlerts, scope: document }) === null ? true : null),
    timeoutMilliseconds: TIMING.elementTimeoutMilliseconds,
    onTimeout: () => new LayoutChangedError({ selectorName: SELECTORS.showAllAlerts }),
  });
}

/** Expand the list and read every alert. Side effect: clicks "Show all alerts". */
export async function readAllAlerts(): Promise<LiveAlert[]> {
  await expandAllAlerts();
  return readAlertRowElements().map((row: AlertRowElement) => row.alert);
}
