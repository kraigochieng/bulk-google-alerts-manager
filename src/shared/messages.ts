/** Message that the side panel sends to the content script. */
export interface PingRequest {
  readonly kind: "ping";
}

/** Reply that the content script sends to a ping. */
export interface PingReply {
  readonly kind: "pong";
  readonly pageUrl: string;
}

export type PanelRequest = PingRequest;

/** Return the panel request in an unknown value, or null when the value is not one. */
export function parsePanelRequest({ value }: { value: unknown }): PanelRequest | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }
  return (value as { kind?: unknown }).kind === "ping" ? { kind: "ping" } : null;
}
