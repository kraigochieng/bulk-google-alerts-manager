import { describe, expect, it } from "vitest";

import { DEFAULT_SETTINGS, parseSettings } from "src/core/settings";

describe("parseSettings", () => {
  it("returns defaults for unknown input", () => {
    expect(parseSettings({ value: null })).toEqual(DEFAULT_SETTINGS);
    expect(parseSettings({ value: "x" })).toEqual(DEFAULT_SETTINGS);
  });

  it("keeps valid saved values", () => {
    const saved = { ...DEFAULT_SETTINGS, risksAccepted: true, minimumDelaySeconds: 10, maximumDelaySeconds: 20 };
    expect(parseSettings({ value: saved })).toEqual(saved);
  });

  it("clamps delays into the allowed range and orders them", () => {
    const parsed = parseSettings({ value: { minimumDelaySeconds: 500, maximumDelaySeconds: 1 } });
    expect(parsed.minimumDelaySeconds).toBe(3);
    expect(parsed.maximumDelaySeconds).toBe(120);
  });

  it("replaces invalid options with the default options", () => {
    expect(parseSettings({ value: { defaults: { howMany: "some" } } }).defaults).toEqual(DEFAULT_SETTINGS.defaults);
  });

  it("accepts the risk flag only when it is true", () => {
    expect(parseSettings({ value: { risksAccepted: "yes" } }).risksAccepted).toBe(false);
  });
});
