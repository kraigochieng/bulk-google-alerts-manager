import Papa from "papaparse";

import { BulkAlertsError } from "src/shared/errors";

/** A CSV file as a header row plus data rows. */
export interface CsvTable {
  readonly headers: readonly string[];
  readonly records: readonly (readonly string[])[];
}

/** The CSV text cannot be read as a table. */
export class CsvParseError extends BulkAlertsError {
  constructor({ message, cause }: { message: string; cause?: unknown }) {
    super({ message, cause });
  }
}

/** Parse CSV text into a table. Skip fully empty lines. Remove a leading byte order mark. */
export function parseCsv({ text }: { text: string }): CsvTable {
  const withoutByteOrderMark: string = text.replace(/^﻿/, "");
  const result: Papa.ParseResult<string[]> = Papa.parse<string[]>(withoutByteOrderMark, {
    skipEmptyLines: "greedy",
  });
  const fatalError: Papa.ParseError | undefined = result.errors.find(
    (error: Papa.ParseError) => error.type === "Quotes",
  );
  if (fatalError !== undefined) {
    throw new CsvParseError({ message: `The CSV file has a quoting error: ${fatalError.message}` });
  }
  const [headerRow, ...records] = result.data;
  if (headerRow === undefined) {
    throw new CsvParseError({ message: "The CSV file is empty." });
  }
  return { headers: headerRow.map((header: string) => header.trim()), records };
}

/** Write a table as CSV text with a header row. */
export function writeCsv({ table }: { table: CsvTable }): string {
  return Papa.unparse(
    { fields: [...table.headers], data: table.records.map((record) => [...record]) },
    { newline: "\r\n" },
  );
}
