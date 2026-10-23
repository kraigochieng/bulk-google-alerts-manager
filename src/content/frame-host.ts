import { chooseFrameLayout } from "src/core/frame-layout";
import type { FrameLayout } from "src/core/frame-layout";
import { dispatchPageRequest } from "src/content/page-requests";
import { CONNECT_MESSAGE_KIND, parseFrameToPage } from "src/shared/frame-messages";
import type { FrameToPage, PageCommand, PageToFrame } from "src/shared/frame-messages";
import type { ContentReply } from "src/shared/messages";
import type { LiveAlert } from "src/shared/models";

const FRAME_BASE_STYLE: string =
  "position:fixed;inset:0;width:100vw;height:100vh;border:0;z-index:2147483000;background:transparent;color-scheme:light;";
const FRAME_STYLES: Record<FrameLayout, string> = {
  passive: "pointer-events:none;",
  active: "pointer-events:auto;",
};

let framePort: MessagePort | null = null;
let checkedAlerts: readonly LiveAlert[] = [];

/** Apply the layout to the frame. Side effect: changes the style of the frame. */
function applyLayout({ element, interactive }: { element: HTMLIFrameElement; interactive: boolean }): void {
  element.style.cssText = `${FRAME_BASE_STYLE}${FRAME_STYLES[chooseFrameLayout({ interactive })]}`;
}

/** Answer the messages of the app frame. Side effect: drives the Alerts page. */
function handleFrameMessage({ message, port, element }: { message: FrameToPage; port: MessagePort; element: HTMLIFrameElement }): void {
  if (message.kind === "interactive") {
    applyLayout({ element, interactive: message.interactive });
    return;
  }
  void dispatchPageRequest({ request: message.request }).then((reply: ContentReply) => {
    const answer: PageToFrame = { kind: "reply", id: message.id, reply };
    port.postMessage(answer);
  });
}

/** Send the checked alerts to the app frame, when it is connected. Side effect: messages the frame. */
function sendCheckedAlerts(): void {
  const message: PageToFrame = { kind: "selection", alerts: checkedAlerts };
  framePort?.postMessage(message);
}

/** Send a command of the bar to the app frame. Side effect: messages the frame. */
export function sendCommand({ command }: { command: PageCommand }): void {
  const message: PageToFrame = { kind: "command", command };
  framePort?.postMessage(message);
}

/** Remember the checked alerts and send them to the app frame. Side effect: messages the frame. */
export function updateCheckedAlerts({ alerts }: { alerts: readonly LiveAlert[] }): void {
  checkedAlerts = alerts;
  sendCheckedAlerts();
}

/** Add the frame that holds the app and give it a private port. The frame covers the page. Side effect: adds an element to the page. */
export function addFrame(): void {
  const element: HTMLIFrameElement = document.createElement("iframe");
  const frameUrl: string = chrome.runtime.getURL("app.html");
  element.src = frameUrl;
  element.title = "Bulk Alerts Manager for Google Alerts";
  element.addEventListener("load", () => {
    const channel: MessageChannel = new MessageChannel();
    framePort = channel.port1;
    channel.port1.onmessage = (event: MessageEvent<unknown>): void => {
      const message: FrameToPage | null = parseFrameToPage({ value: event.data });
      if (message !== null) handleFrameMessage({ message, port: channel.port1, element });
    };
    element.contentWindow?.postMessage({ kind: CONNECT_MESSAGE_KIND }, new URL(frameUrl).origin, [channel.port2]);
    sendCheckedAlerts();
  });
  applyLayout({ element, interactive: false });
  document.body.append(element);
}
