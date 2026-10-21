import { throwIfBotCheck } from "src/content/captcha";
import { ensureOptionsVisible, resetFormIfNeeded } from "src/content/create-alert";
import { expandAllAlerts, readAlertRowElements } from "src/content/list-reader";
import type { AlertRowElement } from "src/content/list-reader";
import { SELECTORS, TIMING } from "src/content/selectors";
import { syntheticClick } from "src/content/synthetic-click";
import { waitFor, waitForVisible } from "src/content/wait-for";
import { optionsFromPageTexts } from "src/core/alert-options";
import type { PageOptionTexts } from "src/core/alert-options";
import { normaliseQuery } from "src/core/query-normaliser";
import { AlertNotFoundError, LayoutChangedError, QueryVerificationError } from "src/shared/errors";
import type { AlertOptions } from "src/shared/models";

async function dropdownText({ selector }: { selector: string }): Promise<string> {
  const dropdown: HTMLElement = await waitForVisible({
    selector,
    scope: document,
    timeoutMilliseconds: TIMING.elementTimeoutMilliseconds,
  });
  return dropdown.textContent.trim();
}

/**
 * Read the six options of the alert with this query. Side effect: opens the alert in edit mode and closes it again.
 * It changes nothing in the account.
 */
export async function readAlertOptions({ query }: { query: string }): Promise<AlertOptions> {
  throwIfBotCheck();
  await expandAllAlerts();
  const normalisedQuery: string = normaliseQuery({ query });
  const row: AlertRowElement | undefined = readAlertRowElements().find(
    (candidate: AlertRowElement) => normaliseQuery({ query: candidate.alert.query }) === normalisedQuery,
  );
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
    await ensureOptionsVisible();
    const texts: PageOptionTexts = {
      delivery: await dropdownText({ selector: SELECTORS.deliverySelect }),
      frequency: await dropdownText({ selector: SELECTORS.frequencySelect }),
      sources: await dropdownText({ selector: SELECTORS.sourceSelect }),
      language: await dropdownText({ selector: SELECTORS.languageSelect }),
      region: await dropdownText({ selector: SELECTORS.regionSelect }),
      volume: await dropdownText({ selector: SELECTORS.volumeSelect }),
    };
    const options: AlertOptions | null = optionsFromPageTexts({ texts });
    if (options === null) {
      throw new LayoutChangedError({ selectorName: `${SELECTORS.frequencySelect} or ${SELECTORS.volumeSelect}` });
    }
    return options;
  } finally {
    await resetFormIfNeeded();
  }
}
