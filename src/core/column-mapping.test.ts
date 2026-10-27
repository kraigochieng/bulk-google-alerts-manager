import { describe, expect, it } from "vitest";

import { buildImportRows } from "src/core/column-mapping";
import { parseCsv } from "src/core/csv";
import { checkHeaders } from "src/core/template-columns";

describe("buildImportRows", () => {
  const table = parseCsv({
    text: [
      "query,deliver_to,how_often,how_many,language",
      '"""Jane Doe"" OR ""Jane A. Doe""",email,weekly,best,French',
      ",rss,,,",
      "plain,fax,,,",
      "plain,,,,",
    ].join("\n"),
  });
  const mapping = checkHeaders({ headers: table.headers }).columnIndexes;
  const rows = buildImportRows({ table, mapping, maximumQueryLength: 100 });

  it("reads the options of a full row", () => {
    expect(rows[0]).toMatchObject({
      sourceRowNumber: 2,
      query: '"Jane Doe" OR "Jane A. Doe"',
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

describe("buildImportRows with listed options", () => {
  const table = parseCsv({
    text: ["query,region,language,sources", "a,kenya,French,News", "b,Atlantis,,"].join("\n"),
  });
  const rows = buildImportRows({
    table,
    mapping: checkHeaders({ headers: table.headers }).columnIndexes,
    maximumQueryLength: 100,
  });

  it("uses the listed text for a value that matches a list", () => {
    expect(rows[0]).toMatchObject({ overrides: { region: "Kenya", language: "French", sources: "News" }, issues: [] });
  });

  it("keeps an unlisted value as typed and marks the row with a warning", () => {
    expect(rows[1]).toMatchObject({ overrides: { region: "Atlantis" }, issues: ["unlisted_option"] });
  });
});
