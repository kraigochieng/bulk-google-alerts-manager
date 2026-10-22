import { useState } from "react";

import type { TableSchema, TableState } from "src/core/table-state";

/**
 * Hold the state of one table in memory.
 * The page URL belongs to Google, so the state does not go into it. A view change clears the state.
 */
export function useTableState({ schema }: { schema: TableSchema }): [TableState, (next: TableState) => void] {
  return useState<TableState>(schema.defaultState);
}
