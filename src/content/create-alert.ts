import { chooseOption } from "src/content/dropdown-driver";
import { throwIfBotCheck } from "src/content/captcha";
import { readAlertRowElements } from "src/content/list-reader";
import type { AlertRowElement } from "src/content/list-reader";
import { OPTION_LABELS, SELECTORS, TIMING } from "src/content/selectors";
import { syntheticClick } from "src/content/synthetic-click";
import { findVisible, waitFor, waitForVisible } from "src/content/wait-for";
import { normaliseQuery } from "src/core/query-normaliser";
import {
  AlertListTimeoutError,
  LayoutChangedError,
  QueryVerificationError,
} from "src/shared/errors";
import type { AlertOptions } from "src/shared/models";

/**
 * Cancel edit mode or old text in the create form with its close icon.
 * Side effect: clicks the page. Does nothing when the Create button is already visible.
 */
export async function resetFormIfNeeded(): Promise<void> {
  if (findVisible({ selector: SELECTORS.createButton, scope: document }) !== null) {
    return;
  }
  const closeIcon: HTMLElement | null = findVisible({ selector: SELECTORS.formCloseIcon, scope: document });
  if (closeIcon === null) {
    return;
  }
  syntheticClick({ element: closeIcon });
  await waitFor<true>({
    find: () => (findVisible({ selector: SELECTORS.formCloseIcon, scope: document }) === null ? true : null),
    timeoutMilliseconds: TIMING.elementTimeoutMilliseconds,
    onTimeout: () => new LayoutChangedError({ selectorName: SELECTORS.formCloseIcon }),
  });
}

/** Put text in the query box the way typing does. Side effect: changes the page. */
function typeQuery({ input, query }: { input: HTMLInputElement; query: string }): void {
  input.focus();
  const descriptor: PropertyDescriptor | undefined = Object.getOwnPropertyDescriptor(
    HTMLInputElement.prototype,
    "value",
  );
  if (descriptor?.set === undefined) {
    throw new LayoutChangedError({ selectorName: "input value setter" });
  }
  descriptor.set.call(input, query);
  input.dispatchEvent(new InputEvent("input", { bubbles: true, data: query, inputType: "insertText" }));
  input.dispatchEvent(new KeyboardEvent("keyup", { bubbles: true, key: "a" }));
}

export async function ensureOptionsVisible(): Promise<void> {
  if (findVisible({ selector: SELECTORS.volumeSelect, scope: document }) !== null) {
    return;
  }
  const toggle: HTMLElement = await waitForVisible({
    selector: SELECTORS.showOptionsToggle,
    scope: document,
    timeoutMilliseconds: TIMING.elementTimeoutMilliseconds,
  });
  syntheticClick({ element: toggle });
  await waitForVisible({
    selector: SELECTORS.volumeSelect,
    scope: document,
    timeoutMilliseconds: TIMING.elementTimeoutMilliseconds,
  });
}

async function setOption({
  selector,
  optionText,
  excludePattern,
}: {
  selector: string;
  optionText: string | null;
  excludePattern: RegExp | null;
}): Promise<void> {
  const dropdown: HTMLElement = await waitForVisible({
    selector,
    scope: document,
    timeoutMilliseconds: TIMING.elementTimeoutMilliseconds,
  });
  await chooseOption({ dropdown, optionText, excludePattern });
}

/** Set the six options of the create form. Delivery goes first, because RSS forces the frequency. */
export async function applyOptions({ options }: { options: AlertOptions }): Promise<void> {
  await ensureOptionsVisible();
  const isRss: boolean = options.deliverTo === "rss";
  await setOption({
    selector: SELECTORS.deliverySelect,
    optionText: isRss ? OPTION_LABELS.deliverToRss : null,
    excludePattern: isRss ? null : /rss/i,
  });
  if (!isRss) {
    await setOption({
      selector: SELECTORS.frequencySelect,
      optionText: OPTION_LABELS.howOften[options.howOften],
      excludePattern: null,
    });
  }
  await setOption({ selector: SELECTORS.sourceSelect, optionText: options.sources, excludePattern: null });
  await setOption({ selector: SELECTORS.languageSelect, optionText: options.language, excludePattern: null });
  await setOption({ selector: SELECTORS.regionSelect, optionText: options.region, excludePattern: null });
  await setOption({
    selector: SELECTORS.volumeSelect,
    optionText: OPTION_LABELS.howMany[options.howMany],
    excludePattern: null,
  });
}

/**
 * Create one alert on the page and return its feed link (null for email).
 * Side effect: drives the Alerts page. Reads the query box back before it submits.
 */
export async function createAlert({
  query,
  options,
}: {
  query: string;
  options: AlertOptions;
}): Promise<string | null> {
  throwIfBotCheck();
  await resetFormIfNeeded();
  const rowsBefore: Set<HTMLElement> = new Set(
    readAlertRowElements().map((row: AlertRowElement) => row.element),
  );
  const input: HTMLInputElement = (await waitForVisible({
    selector: SELECTORS.queryInput,
    scope: document,
    timeoutMilliseconds: TIMING.elementTimeoutMilliseconds,
  })) as HTMLInputElement;
  typeQuery({ input, query });
  await applyOptions({ options });
  if (input.value !== query) {
    throw new QueryVerificationError({ expectedQuery: query, actualQuery: input.value });
  }
  const createButton: HTMLElement = await waitForVisible({
    selector: SELECTORS.createButton,
    scope: document,
    timeoutMilliseconds: TIMING.elementTimeoutMilliseconds,
  });
  syntheticClick({ element: createButton });
  const normalisedQuery: string = normaliseQuery({ query });
  const newRow: AlertRowElement = await waitFor<AlertRowElement>({
    find: () => {
      throwIfBotCheck();
      return (
        readAlertRowElements().find(
          (row: AlertRowElement) =>
            !rowsBefore.has(row.element) && normaliseQuery({ query: row.alert.query }) === normalisedQuery,
        ) ?? null
      );
    },
    timeoutMilliseconds: TIMING.alertAppearTimeoutMilliseconds,
    onTimeout: () => new AlertListTimeoutError({ query, expectation: "appear" }),
  });
  return newRow.alert.feedUrl;
}
