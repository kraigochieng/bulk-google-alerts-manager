import { describe, expect, it } from "vitest";

import { isCsvFile, isXlsxFile } from "src/core/file-type";

describe("isCsvFile", () => {
  it.each([
    ["queries.csv", ""],
    ["QUERIES.CSV", "application/octet-stream"],
    ["export", "text/csv"],
    ["export", "application/vnd.ms-excel"],
  ])("accepts %s with type %j", (name: string, type: string) => {
    expect(isCsvFile({ name, type })).toBe(true);
  });

  it.each([
    ["notes.txt", "text/plain"],
    ["image.png", "image/png"],
    ["csv", ""],
  ])("refuses %s with type %j", (name: string, type: string) => {
    expect(isCsvFile({ name, type })).toBe(false);
  });
});

describe("isXlsxFile", () => {
  it.each([
    ["alerts.xlsx", ""],
    ["ALERTS.XLSX", "application/octet-stream"],
    ["export", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
  ])("accepts %s with type %j", (name: string, type: string) => {
    expect(isXlsxFile({ name, type })).toBe(true);
  });

  it.each([
    ["alerts.xls", "application/vnd.ms-excel"],
    ["queries.csv", "text/csv"],
    ["xlsx", ""],
  ])("refuses %s with type %j", (name: string, type: string) => {
    expect(isXlsxFile({ name, type })).toBe(false);
  });
});
