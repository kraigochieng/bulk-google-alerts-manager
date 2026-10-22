import { createAlert } from "src/content/create-alert";
import { deleteAlert } from "src/content/delete-alert";
import { updateAlert } from "src/content/update-alert";
import { readAlertOptions } from "src/content/read-alert-options";
import { readAllAlerts } from "src/content/list-reader";
import { BulkAlertsError, CaptchaError, LayoutChangedError } from "src/shared/errors";
import type { ContentFailure, ContentReply, PanelRequest } from "src/shared/messages";

/** Turn a thrown value into a failure reply. */
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

/** Run one request on the page. Side effect: drives the Alerts page. */
async function runRequest({ request }: { request: PanelRequest }): Promise<ContentReply> {
  switch (request.kind) {
    case "ping":
      return { ok: true, kind: "pong", pageUrl: window.location.href, hidden: document.hidden };
    case "read_alerts":
      return { ok: true, kind: "alerts", alerts: await readAllAlerts() };
    case "create_alert":
      await createAlert({ query: request.query, options: request.options });
      return { ok: true, kind: "created" };
    case "update_alert":
      await updateAlert({ query: request.query, options: request.options });
      return { ok: true, kind: "updated" };
    case "read_alert_options":
      return { ok: true, kind: "alert_options", options: await readAlertOptions({ query: request.query }) };
    case "delete_alert":
      await deleteAlert({ query: request.query });
      return { ok: true, kind: "deleted" };
  }
}

/** Run one request on the page and return a reply. A thrown error becomes a failure reply. Side effect: drives the Alerts page. */
export async function dispatchPageRequest({ request }: { request: PanelRequest }): Promise<ContentReply> {
  try {
    return await runRequest({ request });
  } catch (error: unknown) {
    return toFailure({ error });
  }
}
