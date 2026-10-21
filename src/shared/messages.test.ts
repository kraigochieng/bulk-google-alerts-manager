import { describe, expect, it } from "vitest";

import { DEFAULT_ALERT_OPTIONS } from "src/core/alert-options";
import { parsePanelRequest } from "src/shared/messages";

describe("parsePanelRequest", () => {
  it("accepts ping and read_alerts", () => {
    expect(parsePanelRequest({ value: { kind: "ping" } })).toEqual({ kind: "ping" });
    expect(parsePanelRequest({ value: { kind: "read_alerts" } })).toEqual({ kind: "read_alerts" });
  });

  it("accepts a create request with valid options", () => {
    const value = { kind: "create_alert", query: "q", options: DEFAULT_ALERT_OPTIONS };
    expect(parsePanelRequest({ value })).toEqual(value);
  });

  it("accepts an update request with valid options", () => {
    const value = { kind: "update_alert", query: "q", options: DEFAULT_ALERT_OPTIONS };
    expect(parsePanelRequest({ value })).toEqual(value);
  });

  it("accepts a delete request", () => {
    expect(parsePanelRequest({ value: { kind: "delete_alert", query: "q" } })).toEqual({
      kind: "delete_alert",
      query: "q",
    });
  });

  it("accepts a read options request", () => {
    expect(parsePanelRequest({ value: { kind: "read_alert_options", query: "q" } })).toEqual({
      kind: "read_alert_options",
      query: "q",
    });
  });

  it.each([
    null,
    { kind: "read_alert_options" },
    undefined,
    42,
    "ping",
    {},
    { kind: "other" },
    { kind: "delete_alert" },
    { kind: "create_alert", query: "q" },
    { kind: "create_alert", query: "q", options: { ...DEFAULT_ALERT_OPTIONS, howMany: "some" } },
  ])("rejects %j", (value: unknown) => {
    expect(parsePanelRequest({ value })).toBeNull();
  });
});
