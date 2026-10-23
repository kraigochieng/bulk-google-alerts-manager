import { ALERT_CAP_PER_ACCOUNT } from "src/core/alert-cap";
import { formatAlertsHeading } from "src/core/alerts-heading";

/** Find the element that holds the Google heading "My alerts (N)". Reads the page. */
function findHeadingElement(): HTMLElement | null {
  const candidates: NodeListOf<HTMLElement> = document.body.querySelectorAll<HTMLElement>("h1, h2, h3, h4, div, span");
  for (const candidate of candidates) {
    if (candidate.childElementCount > 0) continue;
    if (formatAlertsHeading({ text: candidate.textContent, cap: ALERT_CAP_PER_ACCOUNT }) !== null) return candidate;
  }
  return null;
}

/** Rewrite the heading to show created and remaining counts. Side effect: changes the page text. */
function rewriteHeading(): void {
  const heading: HTMLElement | null = findHeadingElement();
  if (heading === null) return;
  const text: string | null = formatAlertsHeading({ text: heading.textContent, cap: ALERT_CAP_PER_ACCOUNT });
  if (text !== null && text !== heading.textContent) heading.textContent = text;
}

/** Keep the heading text current while Google redraws the list. Side effect: observes the page. */
export function startHeadingCount(): void {
  let scheduled: boolean = false;
  const schedule = (): void => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      rewriteHeading();
    });
  };
  new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true, characterData: true });
  schedule();
}
