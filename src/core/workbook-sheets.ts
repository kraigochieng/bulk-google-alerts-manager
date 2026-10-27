/** The sheet of the template that holds the rows to import. The import reads only this sheet. */
export const ALERTS_SHEET_NAME: string = "Alerts";

/** The sheet of the template that holds sample rows. The import never reads it. */
export const SAMPLES_SHEET_NAME: string = "Samples";

/** The hidden sheet of the template that holds the values of the dropdowns. The import never reads it. */
export const LISTS_SHEET_NAME: string = "Lists";

export const TEMPLATE_WORKBOOK_FILE_NAME: string = "bulk-google-alerts-template.xlsx";

export const WORKBOOK_MIME_TYPE: string = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
