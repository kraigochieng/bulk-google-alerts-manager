import { CONNECT_MESSAGE_KIND } from "src/shared/frame-messages";
import type { FrameToPage, PageToFrame } from "src/shared/frame-messages";
import type { ContentReply, PanelRequest } from "src/shared/messages";
import type { LiveAlert } from "src/shared/models";

let pagePort: MessagePort | null = null;
let nextRequestId: number = 0;
let checkedAlerts: readonly LiveAlert[] = [];
const selectionListeners: Set<() => void> = new Set();
const pendingReplies: Map<number, (reply: ContentReply) => void> = new Map();

/** Wait for the page to hand over its private port. Side effect: listens for one window message. */
export function connectToPage(): Promise<void> {
  return new Promise<void>((resolve: () => void) => {
    const onMessage = (event: MessageEvent<unknown>): void => {
      const data: unknown = event.data;
      const isConnect: boolean =
        event.source === window.parent &&
        typeof data === "object" &&
        data !== null &&
        (data as { kind?: unknown }).kind === CONNECT_MESSAGE_KIND &&
        event.ports.length === 1;
      if (!isConnect) return;
      window.removeEventListener("message", onMessage);
      const port: MessagePort | undefined = event.ports[0];
      if (port === undefined) return;
      port.onmessage = (messageEvent: MessageEvent<PageToFrame>): void => {
        const message: PageToFrame = messageEvent.data;
        if (message.kind === "selection") {
          checkedAlerts = message.alerts;
          selectionListeners.forEach((listener: () => void) => { listener(); });
          return;
        }
        const resolveReply: ((reply: ContentReply) => void) | undefined = pendingReplies.get(message.id);
        pendingReplies.delete(message.id);
        resolveReply?.(message.reply);
      };
      pagePort = port;
      resolve();
    };
    window.addEventListener("message", onMessage);
  });
}

function post({ message }: { message: FrameToPage }): void {
  if (pagePort === null) throw new Error("The app is not connected to the Alerts page.");
  pagePort.postMessage(message);
}

/** Send a request to the Alerts page and wait for the reply. Side effect: drives the Alerts page. */
export function requestFromPage({ request }: { request: PanelRequest }): Promise<ContentReply> {
  return new Promise<ContentReply>((resolve: (reply: ContentReply) => void) => {
    nextRequestId += 1;
    pendingReplies.set(nextRequestId, resolve);
    post({ message: { kind: "request", id: nextRequestId, request } });
  });
}

/** Tell the page whether the app needs the full page for an overlay. Side effect: messages the page. */
export function reportBusy({ busy }: { busy: boolean }): void {
  post({ message: { kind: "busy", busy } });
}

/** Ask the page to close the app. Side effect: messages the page. */
export function closeApp(): void {
  post({ message: { kind: "close" } });
}

/** Return the alerts that the user checked on the page. The array changes only when the selection changes. */
export function readCheckedAlerts(): readonly LiveAlert[] {
  return checkedAlerts;
}

/** Call the listener when the checked alerts change. Return a function that stops the calls. */
export function subscribeToCheckedAlerts({ listener }: { listener: () => void }): () => void {
  selectionListeners.add(listener);
  return (): void => {
    selectionListeners.delete(listener);
  };
}
