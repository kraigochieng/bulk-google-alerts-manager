import { describe, expect, it } from "vitest";

import { buildImportRows, guessMapping } from "src/core/column-mapping";
import { parseCsv } from "src/core/csv";
import { buildExportCsv } from "src/core/export-csv";
import type { ExportEntry } from "src/core/export-csv";

const entries: readonly ExportEntry[] = [
  {
    alert: { query: '"Jane, Doe"', feedUrl: "https://www.google.com/alerts/feeds/1/2" },
    options: { howOften: "as_it_happens", sources: "Automatic", language: "French", region: "Any Region", howMany: "best", deliverTo: "rss" },
  },
  {
    alert: { query: "solar power", feedUrl: null },
    options: { howOften: "weekly", sources: "News", language: "English", region: "Kenya", howMany: "all", deliverTo: "email" },
  },
  { alert: { query: "unread", feedUrl: null }, options: null },
];

describe("buildExportCsv", () => {
  it("writes one row per alert under the import column names", () => {
    const table = parseCsv({ text: buildExportCsv({ entries }) });
    expect(table.headers).toEqual(["query", "deliver_to", "how_often", "how_many", "sources", "language", "region", "rss_link"]);
    expect(table.records).toHaveLength(3);
  });

  it("round-trips through the import without a column change", () => {
    const table = parseCsv({ text: buildExportCsv({ entries }) });
    const rows = buildImportRows({ table, mapping: guessMapping({ headers: table.headers }), maximumQueryLength: 500 });
    expect(rows.map((row) => row.issues)).toEqual([[], [], []]);
    expect(rows[0]?.query).toBe('"Jane, Doe"');
    expect(rows[0]?.overrides).toEqual({
      deliverTo: "rss", howOften: "as_it_happens", howMany: "best", sources: "Automatic", language: "French", region: "Any Region",
    });
    expect(rows[1]?.overrides.howOften).toBe("weekly");
  });

  it("writes the feed link of an RSS alert and leaves it empty for an email alert", () => {
    const table = parseCsv({ text: buildExportCsv({ entries }) });
    expect(table.records[0]?.[7]).toBe("https://www.google.com/alerts/feeds/1/2");
    expect(table.records[1]?.[7]).toBe("");
  });

  it("leaves option cells empty when the options are unread", () => {
    const table = parseCsv({ text: buildExportCsv({ entries }) });
    expect(table.records[2]).toEqual(["unread", "email", "", "", "", "", "", ""]);
  });
});
