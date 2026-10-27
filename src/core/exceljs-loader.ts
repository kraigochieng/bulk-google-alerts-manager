import type * as ExcelJsModule from "exceljs";

/** Load the xlsx library on first use, so that the panel does not load it at start. */
export async function loadExcelJs(): Promise<typeof ExcelJsModule> {
  const loaded: typeof ExcelJsModule & { default?: typeof ExcelJsModule } = await import("exceljs");
  return loaded.default ?? loaded;
}
