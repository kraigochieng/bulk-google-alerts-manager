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

function visibleRows(): HTMLElement[] {
  return [...document.querySelectorAll<HTMLElement>(SELECTORS.alertRow)].filter(
    (row: HTMLElement) => row.offsetParent !== null,
  );
}

function rowQueryText({ row }: { row: HTMLElement }): string {
  return row.querySelector(SELECTORS.alertRowQuery)?.textContent.trim() ?? "";
}

/** Read the visible alert rows that are fully drawn. A row that has no query text yet is skipped. */
export function readAlertRowElements(): AlertRowElement[] {
  return visibleRows()
    .filter((row: HTMLElement) => rowQueryText({ row }) !== "")
    .map((element: HTMLElement): AlertRowElement => {
      const feedLink: HTMLAnchorElement | null = element.querySelector<HTMLAnchorElement>(
        SELECTORS.alertRowFeedLink,
      );
      return {
        element,
        alert: { query: rowQueryText({ row: element }), feedUrl: feedLink?.href ?? null },
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
  await waitFor<true>({
    find: () => (visibleRows().every((row: HTMLElement) => rowQueryText({ row }) !== "") ? true : null),
    timeoutMilliseconds: TIMING.elementTimeoutMilliseconds,
    onTimeout: () => new LayoutChangedError({ selectorName: SELECTORS.alertRowQuery }),
  });
  return readAlertRowElements().map((row: AlertRowElement) => row.alert);
}
