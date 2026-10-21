import { describe, expect, it } from "vitest";

import { buildDeleteConfirmation } from "src/core/delete-confirmation";

describe("buildDeleteConfirmation", () => {
  it("names the count in the title and every query when the list is short", () => {
    expect(buildDeleteConfirmation({ queries: ["a", "b"], previewLimit: 5 })).toEqual({
      title: "Delete 2 alerts permanently?",
      description: "You cannot undo this. Use the Export tab first to keep a copy.\n\n- a\n- b",
    });
  });

  it("uses the singular for one alert", () => {
    expect(buildDeleteConfirmation({ queries: ["a"], previewLimit: 5 }).title).toBe("Delete 1 alert permanently?");
  });

  it("shows the first queries and the count of the rest", () => {
    const { description } = buildDeleteConfirmation({ queries: ["a", "b", "c", "d"], previewLimit: 2 });
    expect(description).toContain("- a\n- b\n...and 2 more");
    expect(description).not.toContain("- c");
  });
});
