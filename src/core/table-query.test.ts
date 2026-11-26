import { describe, expect, it } from "vitest";

import { countByFilter, pageRangeLabel, queryTable, tableCountLabel } from "src/core/table-query";
import type { TableColumn } from "src/core/table-query";
import type { TableState } from "src/core/table-state";

interface Row {
  name: string;
  size: number;
}

const columns: TableColumn<Row>[] = [
  { key: "name", label: "Name", sortValue: (row) => row.name, searchText: (row) => row.name },
  { key: "size", label: "Size", sortValue: (row) => row.size, searchText: (row) => String(row.size) },
];
const rows: Row[] = [
  { name: "beta", size: 2 },
  { name: "alpha", size: 10 },
  { name: "gamma", size: 1 },
];
const base: TableState = { search: "", sortKey: "name", sortDirection: "asc", page: 0, filter: "all" };
const filters = { all: (): boolean => true, big: (row: Row): boolean => row.size > 1 };

describe("queryTable", () => {
  it("sorts ascending and descending", () => {
    expect(queryTable({ rows, columns, state: base, filters, pageSize: 10 }).rows.map((row) => row.name)).toEqual(["alpha", "beta", "gamma"]);
    expect(
      queryTable({ rows, columns, state: { ...base, sortKey: "size", sortDirection: "desc" }, filters, pageSize: 10 }).rows.map((row) => row.size),
    ).toEqual([10, 2, 1]);
  });

  it("searches case-insensitively in all columns", () => {
    expect(queryTable({ rows, columns, state: { ...base, search: "ALP" }, filters, pageSize: 10 }).totalMatching).toBe(1);
    expect(queryTable({ rows, columns, state: { ...base, search: "10" }, filters, pageSize: 10 }).rows[0]?.name).toBe("alpha");
  });

  it("applies a filter", () => {
    expect(queryTable({ rows, columns, state: { ...base, filter: "big" }, filters, pageSize: 10 }).totalMatching).toBe(2);
  });

  it("paginates and clamps the page", () => {
    const page = queryTable({ rows, columns, state: { ...base, page: 99 }, filters, pageSize: 2 });
    expect(page).toMatchObject({ pageCount: 2, page: 1, totalMatching: 3 });
    expect(page.rows.map((row) => row.name)).toEqual(["gamma"]);
  });

  it("returns one empty page when nothing matches", () => {
    expect(queryTable({ rows, columns, state: { ...base, search: "zzz" }, filters, pageSize: 2 })).toEqual({
      rows: [],
      totalMatching: 0,
      pageCount: 1,
      page: 0,
    });
  });
});

describe("pageRangeLabel", () => {
  it.each([
    [0, 25, 140, "1–25 of 140"],
    [5, 25, 140, "126–140 of 140"],
    [0, 25, 3, "1–3 of 3"],
    [0, 25, 0, "0 of 0"],
  ])("page %i with size %i and %i rows gives %s", (page: number, pageSize: number, totalMatching: number, expected: string) => {
    expect(pageRangeLabel({ page, pageSize, totalMatching })).toBe(expected);
  });
});

describe("countByFilter", () => {
  it("counts the rows of each filter", () => {
    expect(countByFilter({ rows, filters })).toEqual({ all: 3, big: 2 });
  });
});

describe("tableCountLabel", () => {
  it("names the matching rows and all rows when there is one page", () => {
    expect(tableCountLabel({ page: 0, pageCount: 1, pageSize: 25, totalMatching: 2, totalRows: 6, selectedCount: 4 })).toBe("2 of 6 rows, 4 selected");
  });

  it("names the range of the page when there are pages", () => {
    expect(tableCountLabel({ page: 1, pageCount: 2, pageSize: 25, totalMatching: 40, totalRows: 60, selectedCount: null })).toBe("26–40 of 40 rows");
  });
});
