import { ChevronDown, ChevronUp, X } from "lucide-react";
import type { JSX, ReactNode } from "react";

import { DEFAULT_PAGE_SIZE, queryTable } from "src/core/table-query";
import type { TableColumn } from "src/core/table-query";
import type { SortDirection, TableSchema, TableState } from "src/core/table-state";
import type { HistoryMode } from "src/panel/use-table-url-state";
import { Button } from "src/panel/ui/button";
import { Checkbox } from "src/panel/ui/checkbox";
import { TextField } from "src/panel/ui/text-field";
import { Select } from "src/panel/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "src/panel/ui/table";

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
        <div className="relative min-w-32 flex-1">
          <TextField
            type="search"
            aria-label="Search the table"
            placeholder="Search"
            value={state.search}
            onValueChange={(search: string) => {
              change({ search, page: 0 }, "replace");
            }}
            className="w-full"
          />
          {state.search !== "" && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Clear search"
              onClick={() => {
                change({ search: "", page: 0 }, "replace");
              }}
              className="absolute right-0 top-0 size-8"
            >
              <X className="size-3" />
            </Button>
          )}
        </div>
        <Select
          value={state.filter}
          onValueChange={(value: string) => {
            change({ filter: value, page: 0 }, "replace");
          }}
          aria-label="Filter the table"
          className="w-40"
          choices={schema.filters.map((filter: string) => ({ value: filter, label: filterLabels[filter] ?? filter }))}
        />
      </div>
      <div className="mt-1 text-xs text-muted-foreground">
        {String(page.totalMatching)} of {String(rows.length)} rows
        {selection !== undefined && `, ${String(selection.selected.size)} selected`}
      </div>
      <div className="mt-1 rounded-lg border bg-card">
        <Table className="text-xs">
          <TableHeader>
            <TableRow>
              {selection !== undefined && (
                <TableHead className="w-6 px-2">
                  <Checkbox
                    aria-label="Select all matching rows"
                    checked={allSelected}
                    onCheckedChange={(checked) => {
                      selection.onToggleMany(selectableKeys, checked);
                    }}
                  />
                </TableHead>
              )}
              {columns.map((column: TableColumn<Row>) => (
                <TableHead key={column.key} className="h-8 px-2">
                  <Button type="button" variant="ghost" size="sm" onClick={() => { toggleSort(column.key); }} className="h-6 gap-0.5 px-1 text-xs font-semibold">
                    {column.label}
                    {state.sortKey === column.key &&
                      (state.sortDirection === "asc" ? <ChevronUp className="size-3" aria-label="sorted ascending" /> : <ChevronDown className="size-3" aria-label="sorted descending" />)}
                  </Button>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {page.rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={columns.length + 1} className="py-3 text-center text-muted-foreground">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
            {page.rows.map((row: Row) => {
              const key: Key = rowKey(row);
              return (
                <TableRow key={key} className="align-top">
                  {selection !== undefined && (
                    <TableCell className="px-2 py-1">
                      <Checkbox
                        aria-label={`Select row ${String(key)}`}
                        disabled={!selection.isSelectable(key)}
                        checked={selection.selected.has(key)}
                        onCheckedChange={(checked) => {
                          selection.onToggleMany([key], checked);
                        }}
                      />
                    </TableCell>
                  )}
                  {columns.map((column: TableColumn<Row>) => (
                    <TableCell key={column.key} className="px-2 py-1 whitespace-normal break-words">
                      {renderCell(row, column.key)}
                    </TableCell>
                  ))}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      <div className="mt-1 flex items-center justify-between text-xs">
        <Button type="button" variant="outline" size="sm" disabled={page.page === 0} onClick={() => { change({ page: page.page - 1 }, "push"); }}>
          Previous
        </Button>
        <span>
          Page {String(page.page + 1)} of {String(page.pageCount)}
        </span>
        <Button type="button" variant="outline" size="sm" disabled={page.page >= page.pageCount - 1} onClick={() => { change({ page: page.page + 1 }, "push"); }}>
          Next
        </Button>
      </div>
    </div>
  );
}
