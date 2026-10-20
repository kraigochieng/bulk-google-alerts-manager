import { describe, expect, it } from "vitest";

import { buildImportRows, guessMapping } from "src/core/column-mapping";
import { parseCsv } from "src/core/csv";

describe("guessMapping", () => {
  it("finds columns by common header names", () => {
    const mapping = guessMapping({ headers: ["Search Term", "deliver_to", "Lang", "Notes"] });
    expect(mapping.query).toBe(0);
    expect(mapping.deliverTo).toBe(1);
    expect(mapping.language).toBe(2);
    expect(mapping.region).toBeNull();
  });
});

describe("buildImportRows", () => {
  const table = parseCsv({
    text: [
      "topic,delivery,often,howmany,lang,label",
      '"""Jane Doe"" OR ""Jane A. Doe""",email,weekly,best,French,people',
      ",rss,,,,",
      "plain,fax,,,,",
      "plain,,,,,",
    ].join("\n"),
  });
  const mapping = guessMapping({ headers: table.headers });
  const rows = buildImportRows({ table, mapping, maximumQueryLength: 100 });

  it("reads options and label of a full row", () => {
    expect(rows[0]).toMatchObject({
      sourceRowNumber: 2,
      query: '"Jane Doe" OR "Jane A. Doe"',
      label: "people",
      overrides: { deliverTo: "email", howOften: "weekly", howMany: "best", language: "French" },
      issues: [],
    });
  });

  it("marks an empty row", () => {
    expect(rows[1]?.issues).toEqual(["empty"]);
  });

  it("marks an invalid option value", () => {
    expect(rows[2]?.issues).toEqual(["invalid_option"]);
  });

  it("marks a duplicate of an earlier query", () => {
    expect(rows[3]?.issues).toEqual(["duplicate_in_file"]);
  });

  it("uses no override when the column is not mapped", () => {
    const unmapped = buildImportRows({
      table,
      mapping: { ...mapping, deliverTo: null },
      maximumQueryLength: 100,
    });
    expect(unmapped[2]?.issues).toEqual([]);
  });
});
