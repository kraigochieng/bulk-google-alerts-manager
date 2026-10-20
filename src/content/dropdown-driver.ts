import { SELECTORS, TIMING } from "src/content/selectors";
import { syntheticClick } from "src/content/synthetic-click";
import { findVisible, waitFor } from "src/content/wait-for";
import { LayoutChangedError, OptionNotFoundError } from "src/shared/errors";

function visibleMenuItems(): HTMLElement[] {
  return [...document.querySelectorAll<HTMLElement>(SELECTORS.openMenuItem)].filter(
    (item: HTMLElement) => item.offsetParent !== null,
  );
}

function normaliseLabel({ text }: { text: string }): string {
  return text.trim().toLowerCase();
}

/**
 * Open a dropdown and pick the menu item with the given text. Side effect: clicks the page.
 * With `optionText: null`, pick the first item whose text does not match `excludePattern`.
 */
export async function chooseOption({
  dropdown,
  optionText,
  excludePattern,
}: {
  dropdown: HTMLElement;
  optionText: string | null;
  excludePattern: RegExp | null;
}): Promise<void> {
  if (dropdown.textContent.trim() === optionText?.trim()) {
    return;
  }
  syntheticClick({ element: dropdown });
  const items: HTMLElement[] = await waitFor<HTMLElement[]>({
    find: () => {
      const found: HTMLElement[] = visibleMenuItems();
      return found.length > 0 ? found : null;
    },
    timeoutMilliseconds: TIMING.menuTimeoutMilliseconds,
    onTimeout: () => new LayoutChangedError({ selectorName: SELECTORS.openMenuItem }),
  });
  const target: HTMLElement | undefined = items.find((item: HTMLElement) => {
    const label: string = normaliseLabel({ text: item.textContent });
    if (optionText === null) {
      return excludePattern === null || !excludePattern.test(label);
    }
    return label === normaliseLabel({ text: optionText });
  });
  if (target === undefined) {
    syntheticClick({ element: dropdown });
    throw new OptionNotFoundError({
      requestedText: optionText ?? "(first non-excluded item)",
      availableTexts: items.map((item: HTMLElement) => item.textContent.trim()),
    });
  }
  syntheticClick({ element: target });
  await waitFor<true>({
    find: () => (findVisible({ selector: SELECTORS.openMenuItem, scope: document }) === null ? true : null),
    timeoutMilliseconds: TIMING.menuTimeoutMilliseconds,
    onTimeout: () => new LayoutChangedError({ selectorName: "menu close" }),
  });
}
