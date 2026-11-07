import { describe, expect, it } from "vitest";

import type { RowOptionView } from "src/core/row-options";
import { summariseRowOptions } from "src/core/row-summary";

function view({ label, value, source }: { label: string; value: string; source: RowOptionView["source"] }): RowOptionView {
  return { field: "language", label, value, source };
}

describe("summariseRowOptions", () => {
  it("says that a row without own values uses the defaults", () => {
    expect(summariseRowOptions({ views: [view({ label: "Language", value: "English", source: "default" })] })).toBe("Uses the defaults");
  });

  it("says that an empty list uses the defaults", () => {
    expect(summariseRowOptions({ views: [] })).toBe("Uses the defaults");
  });

  it("ignores a forced value", () => {
    expect(summariseRowOptions({ views: [view({ label: "How often", value: "As-it-happens", source: "forced" })] })).toBe("Uses the defaults");
  });

  it("lists the own values and names the rest", () => {
    const text: string = summariseRowOptions({
      views: [
        view({ label: "Language", value: "French", source: "row" }),
        view({ label: "Region", value: "Any Region", source: "default" }),
      ],
    });
    expect(text).toBe("Language: French. The other options use the defaults");
  });

  it("does not name the rest when all values are own", () => {
    expect(summariseRowOptions({ views: [view({ label: "Language", value: "French", source: "row" })] })).toBe("Language: French");
  });
});
