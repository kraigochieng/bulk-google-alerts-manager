import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { buildImportRows } from "src/core/column-mapping";
import { parseCsv } from "src/core/csv";
import { checkHeaders } from "src/core/template-columns";
import { findMatches } from "src/core/matching";
import { MAXIMUM_QUERY_LENGTH } from "src/core/row-validation";

describe("fixtures/sample-queries.csv", () => {
  const text: string = readFileSync("fixtures/sample-queries.csv", "utf8");
  const table = parseCsv({ text });
  const rows = buildImportRows({
    table,
    mapping: checkHeaders({ headers: table.headers }).columnIndexes,
    maximumQueryLength: MAXIMUM_QUERY_LENGTH,
  });

  it("has more than 40 rows", () => {
    expect(rows.length).toBeGreaterThan(40);
  });

  it("keeps quotes and special characters intact", () => {
    const queries = rows.map((row) => row.query);
    expect(queries).toContain('"Jane Doe" OR "Jane A. Doe"');
    expect(queries).toContain('"She said, ""hello"""');
    expect(queries).toContain("café OR \"crème brûlée\"");
  });

  it("flags the edge cases", () => {
    const issueSet = new Set(rows.flatMap((row) => row.issues));
    expect(issueSet).toEqual(new Set(["empty", "too_long", "duplicate_in_file"]));
  });

  it("finds a same-words match for a reordered query", () => {
    const matches = findMatches({
      query: "solar kenya power",
      liveAlerts: [{ query: "solar power kenya", feedUrl: null }],
    });
    expect(matches[0]?.similarity).toBe("same_words");
  });
});
