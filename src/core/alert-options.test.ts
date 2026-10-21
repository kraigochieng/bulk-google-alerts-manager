import { describe, expect, it } from "vitest";

import {
  DEFAULT_ALERT_OPTIONS,
  parseDeliverTo,
  parseHowMany,
  parseHowOften,
  optionsFromPageTexts,
  resolveOptions,
} from "src/core/alert-options";

describe("resolveOptions", () => {
  it("uses the defaults when a row sets nothing", () => {
    expect(resolveOptions({ defaults: DEFAULT_ALERT_OPTIONS, overrides: {} })).toEqual(
      DEFAULT_ALERT_OPTIONS,
    );
  });

  it("lets a row override a default", () => {
    const resolved = resolveOptions({
      defaults: DEFAULT_ALERT_OPTIONS,
      overrides: { language: "French", howMany: "best" },
    });
    expect(resolved.language).toBe("French");
    expect(resolved.howMany).toBe("best");
  });

  it("ignores an undefined override", () => {
    const resolved = resolveOptions({
      defaults: DEFAULT_ALERT_OPTIONS,
      overrides: { language: undefined },
    });
    expect(resolved.language).toBe("English");
  });

  it("forces as-it-happens for RSS", () => {
    const resolved = resolveOptions({
      defaults: DEFAULT_ALERT_OPTIONS,
      overrides: { deliverTo: "rss", howOften: "weekly" },
    });
    expect(resolved.howOften).toBe("as_it_happens");
  });

  it("keeps the frequency for email", () => {
    const resolved = resolveOptions({
      defaults: DEFAULT_ALERT_OPTIONS,
      overrides: { deliverTo: "email", howOften: "weekly" },
    });
    expect(resolved.howOften).toBe("weekly");
  });
});

describe("option cell parsers", () => {
  it.each([
    ["RSS", "rss"],
    [" RSS feed ", "rss"],
    ["Email", "email"],
  ])("deliver to %j", (text: string, expected: string) => {
    expect(parseDeliverTo({ text })).toBe(expected);
  });

  it.each([
    ["All results", "all"],
    ["best", "best"],
    ["Only the best results", "best"],
  ])("how many %j", (text: string, expected: string) => {
    expect(parseHowMany({ text })).toBe(expected);
  });

  it.each([
    ["As-it-happens", "as_it_happens"],
    ["At most once a day", "daily"],
    ["weekly", "weekly"],
  ])("how often %j", (text: string, expected: string) => {
    expect(parseHowOften({ text })).toBe(expected);
  });

  it("returns null for an unknown value", () => {
    expect(parseDeliverTo({ text: "fax" })).toBeNull();
    expect(parseHowMany({ text: "some" })).toBeNull();
    expect(parseHowOften({ text: "hourly" })).toBeNull();
  });
});

describe("optionsFromPageTexts", () => {
  const texts = {
    delivery: "RSS feed",
    frequency: "As-it-happens",
    sources: " Automatic ",
    language: "English",
    region: "Any Region",
    volume: "Only the best results",
  };

  it("reads the dropdown texts", () => {
    expect(optionsFromPageTexts({ texts })).toEqual({
      howOften: "as_it_happens",
      sources: "Automatic",
      language: "English",
      region: "Any Region",
      howMany: "best",
      deliverTo: "rss",
    });
  });

  it("reads an email address as email delivery", () => {
    const options = optionsFromPageTexts({ texts: { ...texts, delivery: "me@example.com", frequency: "At most once a week" } });
    expect(options?.deliverTo).toBe("email");
    expect(options?.howOften).toBe("weekly");
  });

  it.each([{ frequency: "Sometimes" }, { volume: "Few" }])("returns null for %j", (override) => {
    expect(optionsFromPageTexts({ texts: { ...texts, ...override } })).toBeNull();
  });
});
