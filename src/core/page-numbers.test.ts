import { describe, expect, it } from "vitest";

import { pageNumbers } from "src/core/page-numbers";

describe("pageNumbers", () => {
  it("lists every page when there are few", () => {
    expect(pageNumbers({ page: 0, pageCount: 4 })).toEqual([0, 1, 2, 3]);
  });

  it("returns one page for a single page", () => {
    expect(pageNumbers({ page: 0, pageCount: 1 })).toEqual([0]);
  });

  it("shows a gap after the first pages", () => {
    expect(pageNumbers({ page: 0, pageCount: 20 })).toEqual([0, 1, "gap", 19]);
  });

  it("shows a gap on both sides in the middle", () => {
    expect(pageNumbers({ page: 10, pageCount: 20 })).toEqual([0, "gap", 9, 10, 11, "gap", 19]);
  });

  it("shows a gap before the last pages", () => {
    expect(pageNumbers({ page: 19, pageCount: 20 })).toEqual([0, "gap", 18, 19]);
  });

  it("fills a gap of one page with the page", () => {
    expect(pageNumbers({ page: 3, pageCount: 20 })).toEqual([0, 1, 2, 3, 4, "gap", 19]);
  });

  it("returns nothing for zero pages", () => {
    expect(pageNumbers({ page: 0, pageCount: 0 })).toEqual([]);
  });
});
