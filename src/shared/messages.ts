import type { AlertOptions, LiveAlert } from "src/shared/models";

/** Requests that the side panel sends to the content script. */
export type PanelRequest =
  | { readonly kind: "ping" }
  | { readonly kind: "read_alerts" }
  | { readonly kind: "create_alert"; readonly query: string; readonly options: AlertOptions }
  | { readonly kind: "update_alert"; readonly query: string; readonly options: AlertOptions }
  | { readonly kind: "delete_alert"; readonly query: string }
  | { readonly kind: "read_alert_options"; readonly query: string };

/** Successful replies of the content script. */
export type ContentSuccess =
  | { readonly ok: true; readonly kind: "pong"; readonly pageUrl: string; readonly hidden: boolean }
  | { readonly ok: true; readonly kind: "alerts"; readonly alerts: readonly LiveAlert[] }
  | { readonly ok: true; readonly kind: "created"; readonly feedUrl: string | null }
  | { readonly ok: true; readonly kind: "updated"; readonly feedUrl: string | null }
  | { readonly ok: true; readonly kind: "deleted" }
  | { readonly ok: true; readonly kind: "alert_options"; readonly options: AlertOptions };

/** The content script failed. The flags let the panel pick the right action. */
export interface ContentFailure {
  readonly ok: false;
  readonly errorName: string;
  readonly message: string;
  readonly botCheck: boolean;
  readonly layoutChanged: boolean;
}

export type ContentReply = ContentSuccess | ContentFailure;

function asRecord({ value }: { value: unknown }): Record<string, unknown> | null {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : null;
}

export function parseAlertOptions({ value }: { value: unknown }): AlertOptions | null {
  const record: Record<string, unknown> | null = asRecord({ value });
  if (record === null) return null;
  const { howOften, sources, language, region, howMany, deliverTo } = record;
  if (
    (howOften === "as_it_happens" || howOften === "daily" || howOften === "weekly") &&
    typeof sources === "string" &&
    typeof language === "string" &&
    typeof region === "string" &&
    (howMany === "all" || howMany === "best") &&
    (deliverTo === "email" || deliverTo === "rss")
  ) {
    return { howOften, sources, language, region, howMany, deliverTo };
  }
  return null;
}

/** Return the panel request in an unknown value, or null when the value is not one. */
export function parsePanelRequest({ value }: { value: unknown }): PanelRequest | null {
  const record: Record<string, unknown> | null = asRecord({ value });
  if (record === null) return null;
  if (record.kind === "ping") return { kind: "ping" };
  if (record.kind === "read_alerts") return { kind: "read_alerts" };
  if (record.kind === "delete_alert" && typeof record.query === "string") {
    return { kind: "delete_alert", query: record.query };
  }
  if (record.kind === "read_alert_options" && typeof record.query === "string") {
    return { kind: "read_alert_options", query: record.query };
  }
  if ((record.kind === "create_alert" || record.kind === "update_alert") && typeof record.query === "string") {
    const options: AlertOptions | null = parseAlertOptions({ value: record.options });
    return options === null ? null : { kind: record.kind, query: record.query, options };
  }
  return null;
}
