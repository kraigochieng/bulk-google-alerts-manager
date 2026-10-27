import { describe, expect, it } from "vitest";

import { DEFAULT_ALERT_OPTIONS } from "src/core/alert-options";
import { LANGUAGE_OPTIONS, parseListedOption, REGION_OPTIONS, SOURCE_OPTIONS } from "src/core/option-lists";

describe("option lists", () => {
  it("hold the values that Google showed on 2026-10-27", () => {
    expect(SOURCE_OPTIONS).toHaveLength(8);
    expect(LANGUAGE_OPTIONS).toHaveLength(47);
    expect(REGION_OPTIONS).toHaveLength(240);
  });

  it("contain the app defaults", () => {
    expect(SOURCE_OPTIONS).toContain(DEFAULT_ALERT_OPTIONS.sources);
    expect(LANGUAGE_OPTIONS).toContain(DEFAULT_ALERT_OPTIONS.language);
    expect(REGION_OPTIONS).toContain(DEFAULT_ALERT_OPTIONS.region);
  });

  it("have no duplicate and no padded value", () => {
    for (const list of [SOURCE_OPTIONS, LANGUAGE_OPTIONS, REGION_OPTIONS]) {
      expect(new Set(list).size).toBe(list.length);
      expect(list.every((value: string) => value === value.trim() && value !== "")).toBe(true);
    }
  });

  it("keep the exact text of special characters", () => {
    expect(REGION_OPTIONS).toContain("Côte d’Ivoire");
    expect(REGION_OPTIONS).toContain("São Tomé & Príncipe");
  });
});

describe("parseListedOption", () => {
  it("returns the listed text for a match that differs in case", () => {
    expect(parseListedOption({ value: " kenya ", allowed: REGION_OPTIONS })).toBe("Kenya");
  });

  it("returns null for a value that is not listed", () => {
    expect(parseListedOption({ value: "Atlantis", allowed: REGION_OPTIONS })).toBeNull();
  });
});
