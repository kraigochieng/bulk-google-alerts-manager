import { describe, expect, it } from "vitest";

import { parseFrameToPage } from "src/shared/frame-messages";

describe("parseFrameToPage", () => {
  it("accepts interactive with a boolean", () => {
    expect(parseFrameToPage({ value: { kind: "interactive", interactive: true } })).toEqual({
      kind: "interactive",
      interactive: true,
    });
  });

  it("accepts a request with an id", () => {
    const value = { kind: "request", id: 3, request: { kind: "read_alerts" } };
    expect(parseFrameToPage({ value })).toEqual(value);
  });

  it.each<[string, unknown]>([
    ["null", null],
    ["a string", "interactive"],
    ["interactive without a boolean", { kind: "interactive", interactive: "yes" }],
    ["a removed kind", { kind: "close" }],
    ["a request without an id", { kind: "request", request: { kind: "read_alerts" } }],
    ["a request that is not valid", { kind: "request", id: 1, request: { kind: "format_disk" } }],
    ["an unknown kind", { kind: "other" }],
  ])("refuses %s", (_label, value) => {
    expect(parseFrameToPage({ value })).toBeNull();
  });
});
