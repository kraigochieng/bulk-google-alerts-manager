import { describe, expect, it } from "vitest";

import { buildExportSummary, exportIsEnded, exportJustFinished } from "src/core/export-progress";
import type { ExportStatus } from "src/core/export-progress";
import type { ExportEntry } from "src/core/export-csv";

describe("exportJustFinished", () => {
  it.each<[ExportStatus, ExportStatus, boolean]>([
    ["running", "finished", true],
    ["running", "cancelled", false],
    ["running", "stopped", false],
    ["idle", "finished", false],
    ["finished", "finished", false],
  ])("previous %s, current %s gives %s", (previous, current, expected) => {
    expect(exportJustFinished({ previous, current })).toBe(expected);
  });
});

describe("exportIsEnded", () => {
  it.each<[ExportStatus, boolean]>([
    ["finished", true],
    ["cancelled", true],
    ["stopped", true],
    ["running", false],
    ["idle", false],
  ])("status %s gives %s", (status, expected) => {
    expect(exportIsEnded({ status })).toBe(expected);
  });
});

describe("buildExportSummary", () => {
  const options = { howOften: "daily", sources: "Automatic", language: "English", region: "Any Region", howMany: "all", deliverTo: "email" } as const;
  const entries: ExportEntry[] = [
    { alert: { query: "a", feedUrl: null }, options },
    { alert: { query: "b", feedUrl: null }, options: null },
  ];

  it("names the count and the download for a finished export", () => {
    const summary = buildExportSummary({ status: "finished", entries, total: 2, notice: "" });
    expect(summary.title).toBe("The export is complete");
    expect(summary.lines).toEqual(["Alerts read: 2 of 2", "Without options: 1", "The CSV file is in your downloads."]);
    expect(summary.hasFailures).toBe(true);
  });

  it("gives the notice of a stopped export and no download line", () => {
    const summary = buildExportSummary({ status: "stopped", entries: [entries[0] as ExportEntry], total: 5, notice: "Bot check." });
    expect(summary.title).toBe("The export stopped");
    expect(summary.lines).toEqual(["Alerts read: 1 of 5"]);
    expect(summary.details).toEqual(["Bot check."]);
  });
});
