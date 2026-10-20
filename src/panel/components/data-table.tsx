import type { JSX, ReactNode } from "react";

import { DEFAULT_PAGE_SIZE, queryTable } from "src/core/table-query";
import type { TableColumn } from "src/core/table-query";
import type { SortDirection, TableSchema, TableState } from "src/core/table-state";
import type { HistoryMode } from "src/panel/use-table-url-state";

export interface RowSelection<Key extends string | number> {
  readonly selected: ReadonlySet<Key>;
  readonly isSelectable: (key: Key) => boolean;
  readonly onToggleMany: (keys: readonly Key[], checked: boolean) => void;
}

export interface DataTableProps<Row, Key extends string | number> {
  readonly rows: readonly Row[];
  readonly columns: readonly TableColumn<Row>[];
  readonly rowKey: (row: Row) => Key;
  readonly renderCell: (row: Row, columnKey: string) => ReactNode;
  readonly schema: TableSchema;
  readonly state: TableState;
  readonly onStateChange: (next: TableState, options: { history: HistoryMode }) => void;
  readonly filters: Readonly<Record<string, (row: Row) => boolean>>;
  readonly filterLabels: Readonly<Record<string, string>>;
  readonly selection?: RowSelection<Key>;
  readonly emptyMessage: string;
}

/** Render a table with search, filter, sort, pagination and optional row selection. Pure: no state of its own. */
export function DataTable<Row, Key extends string | number>({
  rows,
  columns,
  rowKey,
  renderCell,
  schema,
  state,
  onStateChange,
  filters,
  filterLabels,
  selection,
  emptyMessage,
}: DataTableProps<Row, Key>): JSX.Element {
  const page = queryTable({ rows, columns, state, filters, pageSize: DEFAULT_PAGE_SIZE });
  const matchingKeys: Key[] = rows
    .filter((row: Row) => queryTable({ rows: [row], columns, state: { ...state, page: 0 }, filters, pageSize: 1 }).totalMatching === 1)
    .map(rowKey);
  const selectableKeys: Key[] = selection === undefined ? [] : matchingKeys.filter(selection.isSelectable);
  const allSelected: boolean =
    selection !== undefined && selectableKeys.length > 0 && selectableKeys.every((key: Key) => selection.selected.has(key));

  const change = (partial: Partial<TableState>, history: HistoryMode): void => {
    onStateChange({ ...state, ...partial }, { history });
  };
  const toggleSort = (key: string): void => {
    const direction: SortDirection = state.sortKey === key && state.sortDirection === "asc" ? "desc" : "asc";
    change({ sortKey: key, sortDirection: direction, page: 0 }, "replace");
  };

  return (
    <div className="mt-2">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1">
          <input
            type="search"
            aria-label="Search the table"
            placeholder="Search"
            value={state.search}
            onChange={(event) => {
              change({ search: event.target.value, page: 0 }, "replace");
            }}
            className="w-full rounded border border-gray-300 px-2 py-1 pr-7 text-sm"
          />
          {state.search !== "" && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => {
                change({ search: "", page: 0 }, "replace");
              }}
              className="absolute right-1 top-1 px-1 text-gray-500"
            >
              ×
            </button>
          )}
        </div>
        <select
          aria-label="Filter the table"
          value={state.filter}
          onChange={(event) => {
            change({ filter: event.target.value, page: 0 }, "replace");
          }}
          className="rounded border border-gray-300 px-2 py-1 text-sm"
        >
          {schema.filters.map((filter: string) => (
            <option key={filter} value={filter}>
              {filterLabels[filter] ?? filter}
            </option>
          ))}
        </select>
      </div>
      <div className="mt-1 text-xs text-gray-600">
        {String(page.totalMatching)} of {String(rows.length)} rows
        {selection !== undefined && `, ${String(selection.selected.size)} selected`}
      </div>
      <div className="mt-1 overflow-x-auto">
        <table className="w-full border-collapse text-left text-xs">
          <thead>
            <tr className="border-b border-gray-300">
              {selection !== undefined && (
                <th className="w-6 py-1">
                  <input
                    type="checkbox"
                    aria-label="Select all matching rows"
                    checked={allSelected}
                    onChange={(event) => {
                      selection.onToggleMany(selectableKeys, event.target.checked);
                    }}
                  />
                </th>
              )}
              {columns.map((column: TableColumn<Row>) => (
                <th key={column.key} className="py-1 pr-2">
                  <button type="button" onClick={() => { toggleSort(column.key); }} className="font-semibold">
                    {column.label}
                    {state.sortKey === column.key && (state.sortDirection === "asc" ? " ▲" : " ▼")}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {page.rows.length === 0 && (
              <tr>
                <td colSpan={columns.length + 1} className="py-3 text-center text-gray-500">
                  {emptyMessage}
                </td>
              </tr>
            )}
            {page.rows.map((row: Row) => {
              const key: Key = rowKey(row);
              return (
                <tr key={key} className="border-b border-gray-100 align-top">
                  {selection !== undefined && (
                    <td className="py-1">
                      <input
                        type="checkbox"
                        aria-label={`Select row ${String(key)}`}
                        disabled={!selection.isSelectable(key)}
                        checked={selection.selected.has(key)}
                        onChange={(event) => {
                          selection.onToggleMany([key], event.target.checked);
                        }}
                      />
                    </td>
                  )}
                  {columns.map((column: TableColumn<Row>) => (
                    <td key={column.key} className="py-1 pr-2 break-words">
                      {renderCell(row, column.key)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="mt-1 flex items-center justify-between text-xs">
        <button
          type="button"
          disabled={page.page === 0}
          onClick={() => { change({ page: page.page - 1 }, "push"); }}
          className="rounded border px-2 py-0.5 disabled:opacity-40"
        >
          Previous
        </button>
        <span>
          Page {String(page.page + 1)} of {String(page.pageCount)}
        </span>
        <button
          type="button"
          disabled={page.page >= page.pageCount - 1}
          onClick={() => { change({ page: page.page + 1 }, "push"); }}
          className="rounded border px-2 py-0.5 disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
}
