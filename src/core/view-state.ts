import { clearTableState } from "src/core/table-state";
import type { TableSchema } from "src/core/table-state";

export type ViewName = "create" | "delete";

export const DEFAULT_VIEW: ViewName = "create";

/** Read the view name from the URL. An unknown, repeated, or missing value becomes the default. */
export function readView({ parameters }: { parameters: URLSearchParams }): ViewName {
  const values: string[] = parameters.getAll("view");
  return values.length === 1 && (values[0] === "create" || values[0] === "delete") ? values[0] : DEFAULT_VIEW;
}

/**
 * Build the URL parameters after a view change.
 * All table keys are removed, because the parent context changed. The default view has no key.
 */
export function switchViewParameters({
  parameters,
  view,
  schemas,
}: {
  parameters: URLSearchParams;
  view: ViewName;
  schemas: readonly TableSchema[];
}): URLSearchParams {
  let next: URLSearchParams = new URLSearchParams(parameters);
  for (const schema of schemas) {
    next = clearTableState({ parameters: next, schema });
  }
  next.delete("view");
  if (view !== DEFAULT_VIEW) {
    next.set("view", view);
  }
  return next;
}
