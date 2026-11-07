import { describe, expect, it } from "vitest";

import { buildImportRows, importRowsFromDraft } from "src/core/draft-rows";
import { parseCsv } from "src/core/csv";
import { checkHeaders } from "src/core/template-columns";

describe("buildImportRows", () => {
  const table = parseCsv({
    text: [
      "Search query,Deliver to,How often,How many,Language",
      '"""Jane Doe"" OR ""Jane A. Doe""",Email,At most once a week,Only the best results,French',
      ",RSS feed,,,",
      "plain,Fax,,,",
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
    text: ["Search query,Region,Language,Sources", "a,kenya,French,News", "b,Atlantis,,"].join("\n"),
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

describe("importRowsFromDraft", () => {
  const cells = { howOften: "", sources: "", language: "", region: "", howMany: "", deliverTo: "" };

  it("keeps the row numbers of the rows that remain", () => {
    const rows = importRowsFromDraft({
      rows: [
        { sourceRowNumber: 2, query: "first", cells },
        { sourceRowNumber: 5, query: "second", cells },
      ],
      maximumQueryLength: 100,
    });
    expect(rows.map((row) => row.sourceRowNumber)).toEqual([2, 5]);
  });

  it("marks a repeated query from its second use", () => {
    const rows = importRowsFromDraft({
      rows: [
        { sourceRowNumber: 2, query: "same", cells },
        { sourceRowNumber: 3, query: " Same ", cells },
      ],
      maximumQueryLength: 100,
    });
    expect(rows.map((row) => row.issues)).toEqual([[], ["duplicate_in_file"]]);
  });

  it("reads an option cell that the user typed in a row", () => {
    const [row] = importRowsFromDraft({
      rows: [{ sourceRowNumber: 2, query: "q", cells: { ...cells, howOften: "At most once a week", deliverTo: "Email" } }],
      maximumQueryLength: 100,
    });
    expect(row?.overrides).toEqual({ howOften: "weekly", deliverTo: "email" });
  });
});
