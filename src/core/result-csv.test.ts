import { describe, expect, it } from "vitest";

import { buildImportRows, guessMapping } from "src/core/column-mapping";
import { parseCsv } from "src/core/csv";
import { backupCsv, createResultCsv, deleteResultCsv } from "src/core/result-csv";
import type { RunItem } from "src/shared/models";

const items: RunItem[] = [
  { id: 0, query: '"Jane Doe" OR "J. Doe"', options: null, label: "", status: "created", rssLink: "https://x/f", errorMessage: "" },
  { id: 1, query: "b, c", options: null, label: "", status: "failed", rssLink: "", errorMessage: 'bad "thing"' },
];

describe("result CSV files", () => {
  it("writes the create result columns", () => {
    const table = parseCsv({ text: createResultCsv({ items }) });
    expect(table.headers).toEqual(["query", "status", "rss_link", "error"]);
    expect(table.records[1]).toEqual(["b, c", "failed", "", 'bad "thing"']);
  });

  it("writes the delete result columns", () => {
    const table = parseCsv({ text: deleteResultCsv({ items }) });
    expect(table.headers).toEqual(["query", "status", "error"]);
  });
});

describe("backupCsv", () => {
  it("can be imported again with the column mapping", () => {
    const text = backupCsv({
      alerts: [
        { query: '"Jane Doe" OR "J. Doe"', feedUrl: "https://x/f" },
        { query: "plain", feedUrl: null },
      ],
    });
    const table = parseCsv({ text });
    const rows = buildImportRows({ table, mapping: guessMapping({ headers: table.headers }), maximumQueryLength: 500 });
    expect(rows.map((row) => [row.query, row.overrides.deliverTo])).toEqual([
      ['"Jane Doe" OR "J. Doe"', "rss"],
      ["plain", "email"],
    ]);
    expect(rows.every((row) => row.issues.length === 0)).toBe(true);
  });
});
