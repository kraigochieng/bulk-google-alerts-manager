import { parsePanelRequest } from "src/shared/messages";
import type { ContentReply, PanelRequest } from "src/shared/messages";
import type { LiveAlert } from "src/shared/models";

/** The message that the page sends to the app frame to give it a private port. */
export const CONNECT_MESSAGE_KIND: string = "bulk-alerts:connect";

/** An action that the user starts from the bar on the page. */
export type PageCommand = "add" | "delete" | "export";

/** Messages that the app frame sends to the page. */
export type FrameToPage =
  | { readonly kind: "request"; readonly id: number; readonly request: PanelRequest }
  | { readonly kind: "busy"; readonly busy: boolean }
  | { readonly kind: "open" }
  | { readonly kind: "close" };

/** Messages that the page sends to the app frame. */
export type PageToFrame =
  | { readonly kind: "reply"; readonly id: number; readonly reply: ContentReply }
  | { readonly kind: "selection"; readonly alerts: readonly LiveAlert[] }
  | { readonly kind: "command"; readonly command: PageCommand };

/** Return the frame message in an unknown value, or null when the value is not one. */
export function parseFrameToPage({ value }: { value: unknown }): FrameToPage | null {
  if (typeof value !== "object" || value === null) return null;
  const record: Record<string, unknown> = value as Record<string, unknown>;
  if (record.kind === "close") return { kind: "close" };
  if (record.kind === "open") return { kind: "open" };
  if (record.kind === "busy" && typeof record.busy === "boolean") return { kind: "busy", busy: record.busy };
  if (record.kind === "request" && typeof record.id === "number") {
    const request: PanelRequest | null = parsePanelRequest({ value: record.request });
    return request === null ? null : { kind: "request", id: record.id, request };
  }
  return null;
}
