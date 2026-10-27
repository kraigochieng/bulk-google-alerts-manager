import { loadExcelJs } from "src/core/exceljs-loader";
import { LANGUAGE_OPTIONS, REGION_OPTIONS, SOURCE_OPTIONS } from "src/core/option-lists";
import { TEMPLATE_HEADERS, TEMPLATE_ROWS } from "src/core/template-csv";
import { ALERTS_SHEET_NAME, LISTS_SHEET_NAME, SAMPLES_SHEET_NAME } from "src/core/workbook-sheets";
import type * as ExcelJsModule from "exceljs";

/** The number of rows below the header that have dropdowns. */
export const DROPDOWN_ROW_COUNT: number = 500;

interface ColumnDropdown {
  readonly header: string;
  /** Inline values, or the column of the Lists sheet that holds the values. */
  readonly values: readonly string[];
  readonly listColumn: number | null;
}

const COLUMN_DROPDOWNS: readonly ColumnDropdown[] = [
  { header: "deliver_to", values: ["rss", "email"], listColumn: null },
  { header: "how_often", values: ["as_it_happens", "daily", "weekly"], listColumn: null },
  { header: "how_many", values: ["all", "best"], listColumn: null },
  { header: "sources", values: SOURCE_OPTIONS, listColumn: 1 },
  { header: "language", values: LANGUAGE_OPTIONS, listColumn: 2 },
  { header: "region", values: REGION_OPTIONS, listColumn: 3 },
];

function columnLetter({ columnNumber }: { columnNumber: number }): string {
  return String.fromCharCode("A".charCodeAt(0) + columnNumber - 1);
}

function listFormula({ dropdown }: { dropdown: ColumnDropdown }): string {
  if (dropdown.listColumn === null) return `"${dropdown.values.join(",")}"`;
  const letter: string = columnLetter({ columnNumber: dropdown.listColumn });
  return `${LISTS_SHEET_NAME}!$${letter}$1:$${letter}$${String(dropdown.values.length)}`;
}

function styleHeader({ sheet }: { sheet: ExcelJsModule.Worksheet }): void {
  sheet.getRow(1).font = { bold: true };
  sheet.views = [{ state: "frozen", ySplit: 1 }];
  TEMPLATE_HEADERS.forEach((header: string, index: number) => {
    sheet.getColumn(index + 1).width = header === "query" ? 48 : 22;
  });
}

/**
 * Build the template as an xlsx file. The Alerts sheet has the header and dropdowns.
 * The Samples sheet has sample rows that the import never reads. The hidden Lists sheet feeds the dropdowns.
 * A dropdown suggests values and does not refuse a typed value.
 */
export async function buildTemplateWorkbook(): Promise<Uint8Array<ArrayBuffer>> {
  const { Workbook } = await loadExcelJs();
  const workbook: ExcelJsModule.Workbook = new Workbook();
  const alerts: ExcelJsModule.Worksheet = workbook.addWorksheet(ALERTS_SHEET_NAME);
  const samples: ExcelJsModule.Worksheet = workbook.addWorksheet(SAMPLES_SHEET_NAME);
  const lists: ExcelJsModule.Worksheet = workbook.addWorksheet(LISTS_SHEET_NAME, { state: "hidden" });

  alerts.addRow([...TEMPLATE_HEADERS]);
  styleHeader({ sheet: alerts });
  samples.addRow([...TEMPLATE_HEADERS]);
  for (const record of TEMPLATE_ROWS) samples.addRow([...record]);
  styleHeader({ sheet: samples });

  for (const dropdown of COLUMN_DROPDOWNS) {
    if (dropdown.listColumn !== null) {
      dropdown.values.forEach((value: string, index: number) => {
        lists.getCell(index + 1, dropdown.listColumn ?? 1).value = value;
      });
    }
    const columnNumber: number = TEMPLATE_HEADERS.indexOf(dropdown.header) + 1;
    const letter: string = columnLetter({ columnNumber });
    for (let rowNumber = 2; rowNumber <= DROPDOWN_ROW_COUNT + 1; rowNumber += 1) {
      alerts.getCell(`${letter}${String(rowNumber)}`).dataValidation = {
        type: "list",
        allowBlank: true,
        showErrorMessage: false,
        formulae: [listFormula({ dropdown })],
      };
    }
  }

  const buffer: ExcelJsModule.Buffer = await workbook.xlsx.writeBuffer();
  return new Uint8Array(buffer);
}
