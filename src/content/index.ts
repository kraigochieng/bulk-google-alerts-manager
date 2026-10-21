import { createAlert } from "src/content/create-alert";
import { deleteAlert } from "src/content/delete-alert";
import { updateAlert } from "src/content/update-alert";
import { readAlertOptions } from "src/content/read-alert-options";
import { readAllAlerts } from "src/content/list-reader";
import {
  BulkAlertsError,
  CaptchaError,
  LayoutChangedError,
} from "src/shared/errors";
import { parsePanelRequest } from "src/shared/messages";
import type { ContentFailure, ContentReply, PanelRequest } from "src/shared/messages";

/** Turn a thrown value into a failure reply for the panel. */
function toFailure({ error }: { error: unknown }): ContentFailure {
  const message: string = error instanceof Error ? error.message : "Unknown error.";
  return {
    ok: false,
    errorName: error instanceof BulkAlertsError ? error.name : "UnexpectedError",
    message,
    botCheck: error instanceof CaptchaError,
    layoutChanged: error instanceof LayoutChangedError,
  };
}

/** Run one panel request on the page. Side effect: drives the Alerts page. */
async function handleRequest({ request }: { request: PanelRequest }): Promise<ContentReply> {
  switch (request.kind) {
    case "ping":
      return { ok: true, kind: "pong", pageUrl: window.location.href, hidden: document.hidden };
    case "read_alerts":
      return { ok: true, kind: "alerts", alerts: await readAllAlerts() };
    case "create_alert":
      return {
        ok: true,
        kind: "created",
        feedUrl: await createAlert({ query: request.query, options: request.options }),
      };
    case "update_alert":
      return {
        ok: true,
        kind: "updated",
        feedUrl: await updateAlert({ query: request.query, options: request.options }),
      };
    case "read_alert_options":
      return { ok: true, kind: "alert_options", options: await readAlertOptions({ query: request.query }) };
    case "delete_alert":
      await deleteAlert({ query: request.query });
      return { ok: true, kind: "deleted" };
  }
}

chrome.runtime.onMessage.addListener(
  (
    message: unknown,
    _sender: chrome.runtime.MessageSender,
    sendResponse: (reply: ContentReply) => void,
  ): boolean => {
    const request: PanelRequest | null = parsePanelRequest({ value: message });
    if (request === null) {
      return false;
    }
    handleRequest({ request })
      .then(sendResponse)
      .catch((error: unknown) => {
        sendResponse(toFailure({ error }));
      });
    return true;
  },
);
