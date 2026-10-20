import { useCallback, useEffect, useState } from "react";

import { readTableState, writeTableState } from "src/core/table-state";
import type { TableSchema, TableState } from "src/core/table-state";

export type HistoryMode = "replace" | "push";

/**
 * Hold the state of one table in the page URL. Side effect: reads and writes the history.
 * A filter, sort, or search change replaces the entry. A page change adds one.
 */
export function useTableUrlState({
  schema,
}: {
  schema: TableSchema;
}): [TableState, (next: TableState, options: { history: HistoryMode }) => void, () => void] {
  const [state, setState] = useState<TableState>(() =>
    readTableState({ parameters: new URLSearchParams(window.location.search), schema }),
  );

  useEffect(() => {
    const onPopState = (): void => {
      setState(readTableState({ parameters: new URLSearchParams(window.location.search), schema }));
    };
    window.addEventListener("popstate", onPopState);
    return (): void => {
      window.removeEventListener("popstate", onPopState);
    };
  }, [schema]);

  const update = useCallback(
    (next: TableState, { history: mode }: { history: HistoryMode }): void => {
      const parameters: URLSearchParams = writeTableState({
        parameters: new URLSearchParams(window.location.search),
        schema,
        state: next,
      });
      const query: string = parameters.toString();
      const url: string = `${window.location.pathname}${query === "" ? "" : `?${query}`}`;
      if (mode === "push") {
        window.history.pushState(null, "", url);
      } else {
        window.history.replaceState(null, "", url);
      }
      setState(next);
    },
    [schema],
  );

  const reset = useCallback((): void => {
    update(schema.defaultState, { history: "replace" });
  }, [schema, update]);

  return [state, update, reset];
}
