import { describe, expect, it } from "vitest";

import { buildImportRows, guessMapping, IMPORT_FIELDS } from "src/core/column-mapping";
import { parseCsv } from "src/core/csv";
import { MAXIMUM_QUERY_LENGTH } from "src/core/row-validation";
import { buildTemplateCsv } from "src/core/template-csv";

describe("buildTemplateCsv", () => {
  const table = parseCsv({ text: buildTemplateCsv() });
  const mapping = guessMapping({ headers: table.headers });
  const rows = buildImportRows({ table, mapping, maximumQueryLength: MAXIMUM_QUERY_LENGTH });

  it("maps every import field from its header", () => {
    for (const field of IMPORT_FIELDS) {
      expect(mapping[field], field).not.toBeNull();
    }
  });

  it("imports with no row issues", () => {
    expect(rows.length).toBeGreaterThanOrEqual(3);
    expect(rows.flatMap((row) => row.issues)).toEqual([]);
  });

  it("keeps quoted phrases and the OR query intact", () => {
    expect(rows.map((row) => row.query)).toContain('"Jane Doe" OR "Jane A. Doe"');
  });

  it("reads the option columns", () => {
    expect(rows[2]?.overrides).toMatchObject({ deliverTo: "email", howOften: "weekly", howMany: "all", language: "English" });
  });
});
