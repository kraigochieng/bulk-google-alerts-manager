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
