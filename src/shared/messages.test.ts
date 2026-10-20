import { describe, expect, it } from "vitest";

import { parsePanelRequest } from "src/shared/messages";

describe("parsePanelRequest", () => {
  it("accepts a ping message", () => {
    expect(parsePanelRequest({ value: { kind: "ping" } })).toEqual({ kind: "ping" });
  });

  it.each([null, undefined, 42, "ping", {}, { kind: "other" }])(
    "rejects %j",
    (value: unknown) => {
      expect(parsePanelRequest({ value })).toBeNull();
    },
  );
});
