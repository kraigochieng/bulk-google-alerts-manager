import { BulkAlertsError } from "src/shared/errors";
import type { ContentReply, PanelRequest } from "src/shared/messages";

export const ALERTS_URL: string = "https://www.google.com/alerts";
const ALERTS_URL_PATTERN: string = "https://www.google.com/alerts*";

/** No tab with the Alerts page is open. */
export class AlertsTabNotFoundError extends BulkAlertsError {
  constructor() {
    super({ message: "No Alerts tab is open. Open https://www.google.com/alerts in a tab." });
  }
}

/** Find an open Alerts tab. Side effect: reads the browser tabs. */
export async function findAlertsTab(): Promise<chrome.tabs.Tab | null> {
  const tabs: chrome.tabs.Tab[] = await chrome.tabs.query({ url: ALERTS_URL_PATTERN });
  return tabs.find((tab: chrome.tabs.Tab) => tab.active) ?? tabs[0] ?? null;
}

/** Send a request to the content script of the Alerts tab. Side effect: messages the tab. */
export async function sendToAlertsTab({ request }: { request: PanelRequest }): Promise<ContentReply> {
  const tab: chrome.tabs.Tab | null = await findAlertsTab();
  if (tab?.id === undefined) {
    throw new AlertsTabNotFoundError();
  }
  return await chrome.tabs.sendMessage<PanelRequest, ContentReply>(tab.id, request);
}

/** Open the Alerts page in a new tab. Side effect: opens a tab. */
export async function openAlertsTab(): Promise<void> {
  await chrome.tabs.create({ url: ALERTS_URL });
}

/** Offer a text file as a download. Side effect: starts a download from the panel page. */
export function downloadTextFile({ fileName, text }: { fileName: string; text: string }): void {
  const url: string = URL.createObjectURL(new Blob([text], { type: "text/csv;charset=utf-8" }));
  const link: HTMLAnchorElement = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}
