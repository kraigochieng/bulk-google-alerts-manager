/** The rows that the user checked on the page. A row is named by its normalised query. */
export type PageSelection = ReadonlySet<string>;

export type SelectionEvent =
  | { readonly type: "toggle"; readonly query: string }
  | { readonly type: "select_all"; readonly queries: readonly string[] }
  | { readonly type: "clear" }
  | { readonly type: "rows_changed"; readonly liveQueries: readonly string[] };

export const EMPTY_SELECTION: PageSelection = new Set<string>();

/** Apply one event to the selection and return a new selection. The input does not change. */
export function applySelectionEvent({
  selection,
  event,
}: {
  selection: PageSelection;
  event: SelectionEvent;
}): PageSelection {
  switch (event.type) {
    case "toggle": {
      const next: Set<string> = new Set(selection);
      if (!next.delete(event.query)) next.add(event.query);
      return next;
    }
    case "select_all":
      return new Set(event.queries);
    case "clear":
      return new Set<string>();
    case "rows_changed": {
      const live: ReadonlySet<string> = new Set(event.liveQueries);
      return new Set([...selection].filter((query: string) => live.has(query)));
    }
  }
}

/** Tell whether every live row is checked. An empty list of rows gives false. */
export function allRowsSelected({
  selection,
  liveQueries,
}: {
  selection: PageSelection;
  liveQueries: readonly string[];
}): boolean {
  return liveQueries.length > 0 && liveQueries.every((query: string) => selection.has(query));
}

/** Count the live rows that are checked. Two rows with one query both count. */
export function countSelectedRows({
  selection,
  liveQueries,
}: {
  selection: PageSelection;
  liveQueries: readonly string[];
}): number {
  return liveQueries.filter((query: string) => selection.has(query)).length;
}
