import { describe, expect, it } from "vitest";

import { buildDeleteConfirmationMessage } from "src/core/delete-confirmation";

describe("buildDeleteConfirmationMessage", () => {
  it("names the count and every query when the list is short", () => {
    expect(buildDeleteConfirmationMessage({ queries: ["a", "b"], previewLimit: 5 })).toBe(
      "Delete 2 alerts permanently?\nYou cannot undo this.\n\n- a\n- b",
    );
  });

  it("uses the singular for one alert", () => {
    expect(buildDeleteConfirmationMessage({ queries: ["a"], previewLimit: 5 })).toContain("Delete 1 alert permanently?");
  });

  it("shows the first queries and the count of the rest", () => {
    const message: string = buildDeleteConfirmationMessage({ queries: ["a", "b", "c", "d"], previewLimit: 2 });
    expect(message).toContain("- a\n- b\n...and 2 more");
    expect(message).not.toContain("- c");
  });
});
