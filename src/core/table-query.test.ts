import { describe, expect, it } from "vitest";

import { queryTable } from "src/core/table-query";
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
