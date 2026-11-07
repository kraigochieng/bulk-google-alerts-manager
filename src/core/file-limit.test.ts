import { describe, expect, it } from "vitest";

import { checkFileRows } from "src/core/file-limit";

describe("checkFileRows", () => {
  it("refuses a file with no data rows", () => {
    expect(checkFileRows({ rowCount: 0, limit: 1000 })).toEqual({ allowed: false, reason: "The file has no data rows." });
  });

  it("accepts a file with one data row", () => {
    expect(checkFileRows({ rowCount: 1, limit: 1000 })).toEqual({ allowed: true });
  });

  it("accepts a file with exactly the limit", () => {
    expect(checkFileRows({ rowCount: 1000, limit: 1000 })).toEqual({ allowed: true });
  });

  it("refuses a file with one row over the limit", () => {
    expect(checkFileRows({ rowCount: 1001, limit: 1000 })).toEqual({
      allowed: false,
      reason: "The file has 1001 data rows. The limit is 1000. Remove 1 row.",
    });
  });

  it("uses the plural for more than one row over the limit", () => {
    expect(checkFileRows({ rowCount: 1250, limit: 1000 })).toEqual({
      allowed: false,
      reason: "The file has 1250 data rows. The limit is 1000. Remove 250 rows.",
    });
  });
});
