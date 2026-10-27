import { describe, expect, it } from "vitest";

import { loadExcelJs } from "src/core/exceljs-loader";
import { LANGUAGE_OPTIONS, REGION_OPTIONS, SOURCE_OPTIONS } from "src/core/option-lists";
import { DROPDOWN_ROW_COUNT, buildTemplateWorkbook } from "src/core/template-workbook";
import { TEMPLATE_HEADERS, TEMPLATE_ROWS } from "src/core/template-csv";
import type * as ExcelJsModule from "exceljs";

async function loadBuilt(): Promise<ExcelJsModule.Workbook> {
  const { Workbook } = await loadExcelJs();
  const workbook: ExcelJsModule.Workbook = new Workbook();
  const bytes: Uint8Array = await buildTemplateWorkbook();
  await workbook.xlsx.load(bytes.buffer as ExcelJsModule.Buffer);
  return workbook;
}

describe("buildTemplateWorkbook", () => {
  it("has the sheets Alerts, Samples, and a hidden Lists", async () => {
    const workbook = await loadBuilt();
    expect(workbook.worksheets.map((sheet) => [sheet.name, sheet.state])).toEqual([
      ["Alerts", "visible"],
      ["Samples", "visible"],
      ["Lists", "hidden"],
    ]);
  });

  it("puts only the header on the Alerts sheet", async () => {
    const sheet = (await loadBuilt()).getWorksheet("Alerts");
    expect(sheet?.getRow(1).values).toEqual([undefined, ...TEMPLATE_HEADERS]);
    expect(sheet?.getCell("A2").value).toBeNull();
  });

  it("puts the header and the sample rows on the Samples sheet", async () => {
    const sheet = (await loadBuilt()).getWorksheet("Samples");
    expect(sheet?.rowCount).toBe(TEMPLATE_ROWS.length + 1);
    expect(sheet?.getCell("A2").value).toBe(TEMPLATE_ROWS[0]?.[0]);
  });

  it("holds the Google lists on the Lists sheet", async () => {
    const sheet = (await loadBuilt()).getWorksheet("Lists");
    expect(sheet?.getColumn(1).values.slice(1)).toEqual([...SOURCE_OPTIONS]);
    expect(sheet?.getColumn(2).values.slice(1)).toEqual([...LANGUAGE_OPTIONS]);
    expect(sheet?.getColumn(3).values.slice(1)).toEqual([...REGION_OPTIONS]);
  });

  it("gives each option column a dropdown that accepts a typed value", async () => {
    const sheet = (await loadBuilt()).getWorksheet("Alerts");
    const lastRow: string = String(DROPDOWN_ROW_COUNT + 1);
    expect(sheet?.getCell("B2").dataValidation).toMatchObject({ type: "list", formulae: ['"rss,email"'] });
    expect(sheet?.getCell("B2").dataValidation.showErrorMessage).not.toBe(true);
    expect(sheet?.getCell("C2").dataValidation.formulae).toEqual(['"as_it_happens,daily,weekly"']);
    expect(sheet?.getCell("D2").dataValidation.formulae).toEqual(['"all,best"']);
    expect(sheet?.getCell("E2").dataValidation.formulae).toEqual([`Lists!$A$1:$A$${String(SOURCE_OPTIONS.length)}`]);
    expect(sheet?.getCell("F2").dataValidation.formulae).toEqual([`Lists!$B$1:$B$${String(LANGUAGE_OPTIONS.length)}`]);
    expect(sheet?.getCell(`G${lastRow}`).dataValidation.formulae).toEqual([`Lists!$C$1:$C$${String(REGION_OPTIONS.length)}`]);
  });

  it("gives the query column no dropdown", async () => {
    const sheet = (await loadBuilt()).getWorksheet("Alerts");
    expect(sheet?.getCell("A2").dataValidation).toBeUndefined();
  });
});
