import { describe, expect, it } from "vitest";

import { DEFAULT_ALERT_OPTIONS } from "src/core/alert-options";
import { describeRowOptions } from "src/core/row-options";

describe("describeRowOptions", () => {
  it("shows the defaults, in the order of the template, for a row with no options", () => {
    const views = describeRowOptions({ row: { overrides: {} }, defaults: DEFAULT_ALERT_OPTIONS });
    expect(views.map((view) => [view.label, view.value, view.source])).toEqual([
      ["How often", "At most once a day", "default"],
      ["Sources", "Automatic", "default"],
      ["Language", "English", "default"],
      ["Region", "Any Region", "default"],
      ["How many", "Only the best results", "default"],
      ["Deliver to", "Email", "default"],
    ]);
  });

  it("marks a value that the row sets", () => {
    const views = describeRowOptions({ row: { overrides: { howOften: "weekly", howMany: "all" } }, defaults: DEFAULT_ALERT_OPTIONS });
    expect(views.find((view) => view.field === "howOften")).toMatchObject({ value: "At most once a week", source: "row" });
    expect(views.find((view) => view.field === "howMany")).toMatchObject({ value: "All results", source: "row" });
    expect(views.find((view) => view.field === "language")?.source).toBe("default");
  });

  it("forces As-it-happens for an RSS alert", () => {
    const views = describeRowOptions({ row: { overrides: { deliverTo: "rss", howOften: "daily" } }, defaults: DEFAULT_ALERT_OPTIONS });
    expect(views.find((view) => view.field === "howOften")).toMatchObject({ value: "As-it-happens", source: "forced" });
    expect(views.find((view) => view.field === "deliverTo")).toMatchObject({ value: "RSS feed", source: "row" });
  });

  it("forces As-it-happens when the default delivery is RSS", () => {
    const views = describeRowOptions({ row: { overrides: {} }, defaults: { ...DEFAULT_ALERT_OPTIONS, deliverTo: "rss" } });
    expect(views.find((view) => view.field === "howOften")).toMatchObject({ value: "As-it-happens", source: "forced" });
    expect(views.find((view) => view.field === "deliverTo")?.source).toBe("default");
  });

  it("keeps an unlisted value as typed", () => {
    const views = describeRowOptions({ row: { overrides: { region: "Atlantis" } }, defaults: DEFAULT_ALERT_OPTIONS });
    expect(views.find((view) => view.field === "region")).toMatchObject({ value: "Atlantis", source: "row" });
  });
});
