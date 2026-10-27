import { describe, expect, it } from "vitest";

import { buildImportRows } from "src/core/column-mapping";
import { loadExcelJs } from "src/core/exceljs-loader";
import { checkHeaders } from "src/core/template-columns";
import { buildTemplateWorkbook } from "src/core/template-workbook";
import { TemplateSheetMissingError, WorkbookParseError, cellValueToText, readTemplateWorkbook } from "src/core/workbook-reader";
import type * as ExcelJsModule from "exceljs";

async function workbookBytes({ fill }: { fill: (workbook: ExcelJsModule.Workbook) => void }): Promise<Uint8Array> {
  const { Workbook } = await loadExcelJs();
  const workbook: ExcelJsModule.Workbook = new Workbook();
  fill(workbook);
  return new Uint8Array(await workbook.xlsx.writeBuffer());
}

describe("readTemplateWorkbook", () => {
  it("reads the filled Alerts sheet and never the Samples sheet", async () => {
    const { Workbook } = await loadExcelJs();
    const workbook: ExcelJsModule.Workbook = new Workbook();
    await workbook.xlsx.load((await buildTemplateWorkbook()).buffer);
    const alerts = workbook.getWorksheet("Alerts");
    if (alerts !== undefined) alerts.getCell("A2").value = "solar power";
    if (alerts !== undefined) alerts.getCell("B2").value = "email";
    if (alerts !== undefined) alerts.getCell("G2").value = "kenya";
    const bytes: Uint8Array = new Uint8Array(await workbook.xlsx.writeBuffer());

    const table = await readTemplateWorkbook({ bytes });
    expect(table.records).toHaveLength(1);
    const report = checkHeaders({ headers: table.headers });
    expect(report.missingRequired).toEqual([]);
    expect(report.extraColumns).toEqual([]);
    const rows = buildImportRows({ table, mapping: report.columnIndexes, maximumQueryLength: 500 });
    expect(rows[0]).toMatchObject({ query: "solar power", overrides: { deliverTo: "email", region: "Kenya" }, issues: [] });
  });

  it("returns no record for the empty template", async () => {
    const table = await readTemplateWorkbook({ bytes: await buildTemplateWorkbook() });
    expect(table.records).toEqual([]);
  });

  it("skips an empty row between two rows and trims the text", async () => {
    const bytes = await workbookBytes({
      fill: (workbook) => {
        const sheet = workbook.addWorksheet("Alerts");
        sheet.addRow(["query", "region"]);
        sheet.addRow(["  first  ", " Kenya "]);
        sheet.addRow([]);
        sheet.addRow(["second", ""]);
      },
    });
    expect(await readTemplateWorkbook({ bytes })).toEqual({
      headers: ["query", "region"],
      records: [["first", "Kenya"], ["second", ""]],
    });
  });

  it("reads a number as text", async () => {
    const bytes = await workbookBytes({
      fill: (workbook) => {
        const sheet = workbook.addWorksheet("Alerts");
        sheet.addRow(["query"]);
        sheet.addRow([2026]);
      },
    });
    expect((await readTemplateWorkbook({ bytes })).records).toEqual([["2026"]]);
  });

  it("raises TemplateSheetMissingError when the file has no Alerts sheet", async () => {
    const bytes = await workbookBytes({ fill: (workbook) => { workbook.addWorksheet("Other"); } });
    await expect(readTemplateWorkbook({ bytes })).rejects.toBeInstanceOf(TemplateSheetMissingError);
  });

  it("raises WorkbookParseError when the bytes are not an xlsx file", async () => {
    await expect(readTemplateWorkbook({ bytes: new TextEncoder().encode("query\nsolar") })).rejects.toBeInstanceOf(WorkbookParseError);
  });

  it("raises WorkbookParseError when the Alerts sheet is empty", async () => {
    const bytes = await workbookBytes({ fill: (workbook) => { workbook.addWorksheet("Alerts"); } });
    await expect(readTemplateWorkbook({ bytes })).rejects.toBeInstanceOf(WorkbookParseError);
  });
});

describe("cellValueToText", () => {
  it.each([
    [null, ""],
    ["text", "text"],
    [7, "7"],
    [true, "true"],
    [{ richText: [{ text: "a" }, { text: "b" }] }, "ab"],
    [{ formula: "A1", result: "done" }, "done"],
    [{ text: "link", hyperlink: "https://example.com" }, "link"],
    [{ error: "#N/A" }, ""],
  ])("turns %j into %j", (value: unknown, expected: string) => {
    expect(cellValueToText({ value: value as ExcelJsModule.CellValue })).toBe(expected);
  });
});
