export type SortDirection = "asc" | "desc";

/** The state of one table. All five values live in the URL query parameters. */
export interface TableState {
  readonly search: string;
  readonly sortKey: string;
  readonly sortDirection: SortDirection;
  readonly page: number;
  readonly filter: string;
}

/** The allowed values of a table, used to check input from the URL. */
export interface TableSchema {
  readonly prefix: string;
  readonly sortKeys: readonly string[];
  readonly filters: readonly string[];
  readonly defaultState: TableState;
}

const PARAMETER_NAMES: readonly (keyof TableState)[] = ["search", "sortKey", "sortDirection", "page", "filter"];

function singleValue({ parameters, name }: { parameters: URLSearchParams; name: string }): string | null {
  const values: string[] = parameters.getAll(name);
  return values.length === 1 ? (values[0] ?? null) : null;
}

/** Read table state from the URL. An unknown, repeated, or invalid value becomes the default. */
export function readTableState({
  parameters,
  schema,
}: {
  parameters: URLSearchParams;
  schema: TableSchema;
}): TableState {
  const read = (key: keyof TableState): string | null =>
    singleValue({ parameters, name: `${schema.prefix}.${key}` });
  const defaults: TableState = schema.defaultState;
  const sortKey: string | null = read("sortKey");
  const sortDirection: string | null = read("sortDirection");
  const pageText: string | null = read("page");
  const filter: string | null = read("filter");
  const page: number = pageText !== null && /^\d+$/.test(pageText) ? Number(pageText) : 0;
  return {
    search: read("search") ?? defaults.search,
    sortKey: sortKey !== null && schema.sortKeys.includes(sortKey) ? sortKey : defaults.sortKey,
    sortDirection: sortDirection === "asc" || sortDirection === "desc" ? sortDirection : defaults.sortDirection,
    page: page >= 1 ? page : defaults.page,
    filter: filter !== null && schema.filters.includes(filter) ? filter : defaults.filter,
  };
}

/** Write table state to the URL parameters. A key that equals its default is removed. Other keys stay. */
export function writeTableState({
  parameters,
  schema,
  state,
}: {
  parameters: URLSearchParams;
  schema: TableSchema;
  state: TableState;
}): URLSearchParams {
  const next: URLSearchParams = new URLSearchParams(parameters);
  for (const key of PARAMETER_NAMES) {
    const name: string = `${schema.prefix}.${key}`;
    next.delete(name);
    if (state[key] !== schema.defaultState[key]) {
      next.set(name, String(state[key]));
    }
  }
  return next;
}

/** Remove all table keys of a schema from the URL parameters. Use it when the parent context changes. */
export function clearTableState({
  parameters,
  schema,
}: {
  parameters: URLSearchParams;
  schema: TableSchema;
}): URLSearchParams {
  return writeTableState({ parameters, schema, state: schema.defaultState });
}
