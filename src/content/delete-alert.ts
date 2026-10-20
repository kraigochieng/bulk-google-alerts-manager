import { throwIfBotCheck } from "src/content/captcha";
import { expandAllAlerts, readAlertRowElements } from "src/content/list-reader";
import type { AlertRowElement } from "src/content/list-reader";
import { SELECTORS, TIMING } from "src/content/selectors";
import { syntheticClick } from "src/content/synthetic-click";
import { waitFor } from "src/content/wait-for";
import { normaliseQuery } from "src/core/query-normaliser";
import {
  AlertListTimeoutError,
  AlertNotFoundError,
  LayoutChangedError,
} from "src/shared/errors";

/**
 * Delete the first alert with this query. Side effect: drives the Alerts page.
 * Deletion is permanent in Google Alerts. The caller must have checked the backup gate.
 */
export async function deleteAlert({ query }: { query: string }): Promise<void> {
  throwIfBotCheck();
  await expandAllAlerts();
  const normalisedQuery: string = normaliseQuery({ query });
  const row: AlertRowElement | undefined = readAlertRowElements().find(
    (candidate: AlertRowElement) => normaliseQuery({ query: candidate.alert.query }) === normalisedQuery,
  );
  if (row === undefined) {
    throw new AlertNotFoundError({ query });
  }
  const deleteButton: HTMLElement | null = row.element.querySelector<HTMLElement>(
    SELECTORS.alertRowDeleteButton,
  );
  if (deleteButton === null) {
    throw new LayoutChangedError({ selectorName: SELECTORS.alertRowDeleteButton });
  }
  syntheticClick({ element: deleteButton });
  await waitFor<true>({
    find: () => {
      throwIfBotCheck();
      return row.element.isConnected && row.element.offsetParent !== null ? null : true;
    },
    timeoutMilliseconds: TIMING.alertDisappearTimeoutMilliseconds,
    onTimeout: () => new AlertListTimeoutError({ query, expectation: "disappear" }),
  });
}
