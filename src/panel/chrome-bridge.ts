import { requestFromPage } from "src/panel/page-link";
import type { ContentReply, PanelRequest } from "src/shared/messages";

/** Run a request on the Alerts page that holds the app. Side effect: drives the page. */
export async function sendToAlertsTab({ request }: { request: PanelRequest }): Promise<ContentReply> {
  return await requestFromPage({ request });
}

/** Offer a text file as a download. Side effect: starts a download from the app frame. */
export function downloadTextFile({ fileName, text }: { fileName: string; text: string }): void {
  const url: string = URL.createObjectURL(new Blob([text], { type: "text/csv;charset=utf-8" }));
  const link: HTMLAnchorElement = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

/** Copy text to the clipboard. Return false when the browser refuses. Side effect: writes the clipboard. */
export async function copyTextToClipboard({ text }: { text: string }): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
