import { chooseFrameLayout } from "src/core/frame-layout";
import type { FrameLayout } from "src/core/frame-layout";
import { dispatchPageRequest } from "src/content/page-requests";
import { CONNECT_MESSAGE_KIND, parseFrameToPage } from "src/shared/frame-messages";
import type { FrameToPage, PageToFrame } from "src/shared/frame-messages";
import type { ContentReply } from "src/shared/messages";

const FRAME_STYLES: Record<FrameLayout, string> = {
  hidden: "display:none;",
  drawer:
    "display:block;position:fixed;top:0;right:0;width:26rem;max-width:100vw;height:100vh;border:0;border-left:1px solid #dadce0;box-shadow:-2px 0 12px rgba(0,0,0,0.2);",
  full: "display:block;position:fixed;inset:0;width:100vw;height:100vh;border:0;",
};
const FRAME_BASE_STYLE: string = "z-index:2147483000;background:#f1f3f4;color-scheme:light;";

let frame: HTMLIFrameElement | null = null;
let frameOpen: boolean = false;
let frameBusy: boolean = false;

/** Apply the layout to the frame. Side effect: changes the style of the frame. */
function applyLayout({ element }: { element: HTMLIFrameElement }): void {
  element.style.cssText = `${FRAME_BASE_STYLE}${FRAME_STYLES[chooseFrameLayout({ open: frameOpen, busy: frameBusy })]}`;
}

/** Answer the messages of the app frame. Side effect: drives the Alerts page. */
function handleFrameMessage({ message, port, element }: { message: FrameToPage; port: MessagePort; element: HTMLIFrameElement }): void {
  if (message.kind === "close") {
    frameOpen = false;
  } else if (message.kind === "busy") {
    frameBusy = message.busy;
  } else {
    void dispatchPageRequest({ request: message.request }).then((reply: ContentReply) => {
      const answer: PageToFrame = { kind: "reply", id: message.id, reply };
      port.postMessage(answer);
    });
    return;
  }
  applyLayout({ element });
}

/** Create the frame that holds the app and give it a private port. Side effect: adds an element to the page. */
function createFrame(): HTMLIFrameElement {
  const element: HTMLIFrameElement = document.createElement("iframe");
  const frameUrl: string = chrome.runtime.getURL("app.html");
  element.src = frameUrl;
  element.title = "Bulk Google Alerts Manager";
  element.addEventListener("load", () => {
    const channel: MessageChannel = new MessageChannel();
    channel.port1.onmessage = (event: MessageEvent<unknown>): void => {
      const message: FrameToPage | null = parseFrameToPage({ value: event.data });
      if (message !== null) handleFrameMessage({ message, port: channel.port1, element });
    };
    element.contentWindow?.postMessage({ kind: CONNECT_MESSAGE_KIND }, new URL(frameUrl).origin, [channel.port2]);
  });
  applyLayout({ element });
  document.body.append(element);
  return element;
}

/** Open the app frame, or close it when it is open. The first call creates the frame. Side effect: changes the page. */
export function toggleFrame(): void {
  frameOpen = !frameOpen;
  if (frame === null) {
    frame = createFrame();
    return;
  }
  applyLayout({ element: frame });
}
