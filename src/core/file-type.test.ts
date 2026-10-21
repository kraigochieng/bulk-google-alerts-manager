import { describe, expect, it } from "vitest";

import { isCsvFile } from "src/core/file-type";

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
