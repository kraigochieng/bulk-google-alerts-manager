import { describe, expect, it } from "vitest";

import { checkHeaders, FIELD_HEADERS } from "src/core/template-columns";
import { buildTemplateCsv } from "src/core/template-csv";
import { parseCsv } from "src/core/csv";

describe("checkHeaders", () => {
  it("accepts the template columns", () => {
    const report = checkHeaders({ headers: ["query", "deliver_to"] });
    expect(report.missingRequired).toEqual([]);
    expect(report.extraColumns).toEqual([]);
    expect(report.columnIndexes.query).toBe(0);
    expect(report.columnIndexes.deliverTo).toBe(1);
    expect(report.columnIndexes.region).toBeNull();
  });

  it("reports a missing query column", () => {
    expect(checkHeaders({ headers: ["deliver_to", "region"] }).missingRequired).toEqual(["query"]);
  });

  it("reports an extra column", () => {
    expect(checkHeaders({ headers: ["query", "notes"] }).extraColumns).toEqual(["notes"]);
  });

  it("ignores case and outer spaces", () => {
    const report = checkHeaders({ headers: ["Query ", "REGION"] });
    expect(report.columnIndexes.query).toBe(0);
    expect(report.columnIndexes.region).toBe(1);
    expect(report.extraColumns).toEqual([]);
  });

  it("does not accept a synonym", () => {
    const report = checkHeaders({ headers: ["keyword"] });
    expect(report.missingRequired).toEqual(["query"]);
    expect(report.extraColumns).toEqual(["keyword"]);
  });

  it("keeps the first of two columns with the same name and reports the second", () => {
    const report = checkHeaders({ headers: ["query", "query"] });
    expect(report.columnIndexes.query).toBe(0);
    expect(report.extraColumns).toEqual(["query"]);
  });

  it("does not report an empty header as an extra column", () => {
    expect(checkHeaders({ headers: ["query", ""] }).extraColumns).toEqual([]);
  });

  it("finds every field in the template file", () => {
    const report = checkHeaders({ headers: parseCsv({ text: buildTemplateCsv() }).headers });
    expect(report.missingRequired).toEqual([]);
    expect(report.extraColumns).toEqual([]);
    for (const field of Object.keys(FIELD_HEADERS) as (keyof typeof FIELD_HEADERS)[]) {
      expect(report.columnIndexes[field], field).not.toBeNull();
    }
  });
});
