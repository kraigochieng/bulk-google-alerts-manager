export type SortDirection = "asc" | "desc";

/** The state of one table. */
export interface TableState {
  readonly search: string;
  readonly sortKey: string;
  readonly sortDirection: SortDirection;
  readonly page: number;
  readonly filter: string;
}

/** The allowed values of a table and its default state. */
export interface TableSchema {
  readonly sortKeys: readonly string[];
  readonly filters: readonly string[];
  readonly defaultState: TableState;
}
