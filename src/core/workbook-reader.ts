import type { CsvTable } from "src/core/csv";
import { loadExcelJs } from "src/core/exceljs-loader";
import { ALERTS_SHEET_NAME } from "src/core/workbook-sheets";
import { BulkAlertsError } from "src/shared/errors";
import type * as ExcelJsModule from "exceljs";

/** The bytes cannot be read as an xlsx file. */
export class WorkbookParseError extends BulkAlertsError {
  constructor({ message, cause }: { message: string; cause?: unknown }) {
    super({ message, cause });
  }
}

/** The xlsx file has no sheet with the name of the sheet that the import reads. */
export class TemplateSheetMissingError extends BulkAlertsError {
  readonly sheetName: string;
  readonly foundSheetNames: readonly string[];

  constructor({ sheetName, foundSheetNames }: { sheetName: string; foundSheetNames: readonly string[] }) {
    super({
      message: `The file has no sheet named "${sheetName}". Use the template. The sheets in the file are: ${foundSheetNames.join(", ")}.`,
    });
    this.sheetName = sheetName;
    this.foundSheetNames = foundSheetNames;
  }
}

/** Turn the value of one cell into text. Pure. A formula gives its result. An error value gives an empty text. */
export function cellValueToText({ value }: { value: ExcelJsModule.CellValue }): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (value instanceof Date) return value.toISOString();
  if ("richText" in value) return value.richText.map((part: { text: string }) => part.text).join("");
  if ("result" in value) return cellValueToText({ value: value.result });
  if ("hyperlink" in value) return typeof value.text === "string" ? value.text : value.hyperlink;
  return "";
}

function rowTexts({ row, width }: { row: ExcelJsModule.Row; width: number }): string[] {
  return Array.from({ length: width }, (_unused: unknown, index: number) =>
    cellValueToText({ value: row.getCell(index + 1).value }).trim(),
  );
}

/** Read the Alerts sheet of an xlsx file as a table. Skip empty rows. Other sheets are never read. */
export async function readTemplateWorkbook({ bytes }: { bytes: ArrayBuffer | Uint8Array }): Promise<CsvTable> {
  const { Workbook } = await loadExcelJs();
  const workbook: ExcelJsModule.Workbook = new Workbook();
  try {
    const buffer: ArrayBuffer = bytes instanceof Uint8Array ? bytes.slice().buffer : bytes;
    await workbook.xlsx.load(buffer);
  } catch (error: unknown) {
    throw new WorkbookParseError({ message: "The file is not a valid xlsx file.", cause: error });
  }
  const sheet: ExcelJsModule.Worksheet | undefined = workbook.getWorksheet(ALERTS_SHEET_NAME);
  if (sheet === undefined) {
    throw new TemplateSheetMissingError({
      sheetName: ALERTS_SHEET_NAME,
      foundSheetNames: workbook.worksheets.map((candidate: ExcelJsModule.Worksheet) => candidate.name),
    });
  }
  const width: number = sheet.columnCount;
  const headers: string[] = rowTexts({ row: sheet.getRow(1), width });
  if (headers.every((header: string) => header === "")) {
    throw new WorkbookParseError({ message: `The sheet "${ALERTS_SHEET_NAME}" has no header row.` });
  }
  const records: string[][] = [];
  for (let rowNumber = 2; rowNumber <= sheet.rowCount; rowNumber += 1) {
    const record: string[] = rowTexts({ row: sheet.getRow(rowNumber), width });
    if (record.some((text: string) => text !== "")) records.push(record);
  }
  return { headers, records };
}
