import { describe, expect, it } from "vitest";

import { updateWarning } from "src/core/update-warning";

describe("updateWarning", () => {
  it("returns null when no row updates an alert", () => {
    expect(updateWarning({ updateCount: 0 })).toBeNull();
  });

  it("names one row in the singular", () => {
    expect(updateWarning({ updateCount: 1 })).toMatch(/^1 checked row updates an existing alert\./);
  });

  it("names the count of many rows", () => {
    expect(updateWarning({ updateCount: 3 })).toMatch(/^3 checked rows update an existing alert\./);
  });

  it("says that the run replaces the options and that blank cells use the defaults", () => {
    const text: string = updateWarning({ updateCount: 2 }) ?? "";
    expect(text).toContain("replaces all options");
    expect(text).toContain("Blank cells use the defaults");
  });

  it("returns null for a negative count", () => {
    expect(updateWarning({ updateCount: -1 })).toBeNull();
  });
});
