import { throwIfBotCheck } from "src/content/captcha";
import { applyOptions, resetFormIfNeeded } from "src/content/create-alert";
import { expandAllAlerts, readAlertRowElements } from "src/content/list-reader";
import type { AlertRowElement } from "src/content/list-reader";
import { SELECTORS, TIMING } from "src/content/selectors";
import { syntheticClick } from "src/content/synthetic-click";
import { findVisible, waitFor, waitForVisible } from "src/content/wait-for";
import { normaliseQuery } from "src/core/query-normaliser";
import {
  AlertListTimeoutError,
  AlertNotFoundError,
  AlertUnchangedError,
  LayoutChangedError,
  QueryVerificationError,
} from "src/shared/errors";
import type { AlertOptions } from "src/shared/models";

/** The time that the page needs to enable the update button after an option changed. */
const UPDATE_ENABLE_TIMEOUT_MILLISECONDS: number = 1500;

function findRow({ normalisedQuery }: { normalisedQuery: string }): AlertRowElement | undefined {
  return readAlertRowElements().find(
    (candidate: AlertRowElement) => normaliseQuery({ query: candidate.alert.query }) === normalisedQuery,
  );
}

/** Wait for the enabled update button. Throw AlertUnchangedError when the page keeps it disabled. */
async function waitForEnabledUpdateButton(): Promise<HTMLElement> {
  return await waitFor<HTMLElement>({
    find: () => {
      const button: HTMLElement | null = findVisible({ selector: SELECTORS.updateButton, scope: document });
      return button !== null && !button.classList.contains(SELECTORS.updateButtonDisabledClass) ? button : null;
    },
    timeoutMilliseconds: UPDATE_ENABLE_TIMEOUT_MILLISECONDS,
    onTimeout: () => new AlertUnchangedError(),
  });
}

/**
 * Wait until the page has saved the alert. The page then draws the row of the alert again, as a new element.
 * The form hides at once when the button is clicked, so it does not show that the save ended.
 */
async function waitForReplacedRow({
  previousRow,
  normalisedQuery,
  query,
}: {
  previousRow: HTMLElement;
  normalisedQuery: string;
  query: string;
}): Promise<AlertRowElement> {
  return await waitFor<AlertRowElement>({
    find: () => {
      throwIfBotCheck();
      return previousRow.isConnected ? null : (findRow({ normalisedQuery }) ?? null);
    },
    timeoutMilliseconds: TIMING.alertAppearTimeoutMilliseconds,
    onTimeout: () => new AlertListTimeoutError({ query, expectation: "appear" }),
  });
}

/**
 * Set the six options of the alert that has this query.
 * Side effect: opens the alert in edit mode, changes it, and saves it. An alert that already has the options stays as it is.
 */
export async function updateAlert({
  query,
  options,
}: {
  query: string;
  options: AlertOptions;
}): Promise<void> {
  throwIfBotCheck();
  await expandAllAlerts();
  const normalisedQuery: string = normaliseQuery({ query });
  const row: AlertRowElement | undefined = findRow({ normalisedQuery });
  if (row === undefined) {
    throw new AlertNotFoundError({ query });
  }
  const editButton: HTMLElement | null = row.element.querySelector<HTMLElement>(SELECTORS.alertRowEditButton);
  if (editButton === null) {
    throw new LayoutChangedError({ selectorName: SELECTORS.alertRowEditButton });
  }
  await resetFormIfNeeded();
  try {
    syntheticClick({ element: editButton });
    const input: HTMLInputElement = (await waitForVisible({
      selector: SELECTORS.queryInput,
      scope: document,
      timeoutMilliseconds: TIMING.elementTimeoutMilliseconds,
    })) as HTMLInputElement;
    await waitFor<true>({
      find: () => (normaliseQuery({ query: input.value }) === normalisedQuery ? true : null),
      timeoutMilliseconds: TIMING.elementTimeoutMilliseconds,
      onTimeout: () => new QueryVerificationError({ expectedQuery: query, actualQuery: input.value }),
    });
    await applyOptions({ options });
    try {
      const updateButton: HTMLElement = await waitForEnabledUpdateButton();
      syntheticClick({ element: updateButton });
      await waitForReplacedRow({ previousRow: row.element, normalisedQuery, query });
    } catch (error: unknown) {
      if (!(error instanceof AlertUnchangedError)) throw error;
    }
  } finally {
    await resetFormIfNeeded();
  }
}
