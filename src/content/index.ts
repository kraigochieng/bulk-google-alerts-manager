import { parsePanelRequest } from "src/shared/messages";
import type { PingReply } from "src/shared/messages";

chrome.runtime.onMessage.addListener(
  (
    message: unknown,
    _sender: chrome.runtime.MessageSender,
    sendResponse: (reply: PingReply) => void,
  ): void => {
    if (parsePanelRequest({ value: message }) !== null) {
      sendResponse({ kind: "pong", pageUrl: window.location.href });
    }
  },
);
