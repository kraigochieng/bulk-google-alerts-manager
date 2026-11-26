import type { TableState } from "src/core/table-state";

/** How to sort and search the rows of one table. */
export interface TableColumn<Row> {
  readonly key: string;
  readonly label: string;
  readonly sortValue: (row: Row) => string | number;
  readonly searchText: (row: Row) => string;
}

/** One page of a table, after filter, search, and sort. */
export interface TablePage<Row> {
  readonly rows: readonly Row[];
  readonly totalMatching: number;
  readonly pageCount: number;
  readonly page: number;
}

export const DEFAULT_PAGE_SIZE: number = 25;

/** Filter, search, sort, and paginate rows. Pure. The page is clamped into range. */
export function queryTable<Row>({
  rows,
  columns,
  state,
  filters,
  pageSize,
}: {
  rows: readonly Row[];
  columns: readonly TableColumn<Row>[];
  state: TableState;
  filters: Readonly<Record<string, (row: Row) => boolean>>;
  pageSize: number;
}): TablePage<Row> {
  const filterFunction: (row: Row) => boolean = filters[state.filter] ?? ((): boolean => true);
  const needle: string = state.search.trim().toLowerCase();
  const matching: Row[] = rows.filter(
    (row: Row) =>
      filterFunction(row) &&
      (needle === "" || columns.some((column: TableColumn<Row>) => column.searchText(row).toLowerCase().includes(needle))),
  );
  const sortColumn: TableColumn<Row> | undefined = columns.find((column: TableColumn<Row>) => column.key === state.sortKey);
  const direction: number = state.sortDirection === "asc" ? 1 : -1;
  const sorted: Row[] =
    sortColumn === undefined
      ? matching
      : [...matching].sort((left: Row, right: Row) => {
          const leftValue: string | number = sortColumn.sortValue(left);
          const rightValue: string | number = sortColumn.sortValue(right);
          if (leftValue === rightValue) return 0;
          return (leftValue < rightValue ? -1 : 1) * direction;
        });
  const pageCount: number = Math.max(Math.ceil(sorted.length / pageSize), 1);
  const page: number = Math.min(Math.max(state.page, 0), pageCount - 1);
  return {
    rows: sorted.slice(page * pageSize, (page + 1) * pageSize),
    totalMatching: sorted.length,
    pageCount,
    page,
  };
}

/** Describe the rows on one page, for example "1–25 of 140". An empty result gives "0 of 0". */
export function pageRangeLabel({
  page,
  pageSize,
  totalMatching,
}: {
  page: number;
  pageSize: number;
  totalMatching: number;
}): string {
  if (totalMatching === 0) return "0 of 0";
  const first: number = page * pageSize + 1;
  const last: number = Math.min((page + 1) * pageSize, totalMatching);
  return `${String(first)}–${String(last)} of ${String(totalMatching)}`;
}

/** Count the rows that each filter keeps. A search does not change the counts. */
export function countByFilter<Row>({
  rows,
  filters,
}: {
  rows: readonly Row[];
  filters: Readonly<Record<string, (row: Row) => boolean>>;
}): Record<string, number> {
  return Object.fromEntries(
    Object.entries(filters).map(([key, keeps]: [string, (row: Row) => boolean]): [string, number] => [key, rows.filter(keeps).length]),
  );
}

/** Describe the rows that a table shows. A table with pages names the range of the page. */
export function tableCountLabel({
  page,
  pageCount,
  pageSize,
  totalMatching,
  totalRows,
  selectedCount,
}: {
  page: number;
  pageCount: number;
  pageSize: number;
  totalMatching: number;
  totalRows: number;
  selectedCount: number | null;
}): string {
  const shown: string =
    pageCount > 1
      ? `${pageRangeLabel({ page, pageSize, totalMatching })} rows`
      : `${String(totalMatching)} of ${String(totalRows)} rows`;
  return selectedCount === null ? shown : `${shown}, ${String(selectedCount)} selected`;
}
