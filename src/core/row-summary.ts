import type { RowOptionView } from "src/core/row-options";

/** Build one short line for the options of a row. Show only the values that the file sets. Pure. */
export function summariseRowOptions({ views }: { views: readonly RowOptionView[] }): string {
  const own: RowOptionView[] = views.filter((view: RowOptionView) => view.source === "row");
  if (own.length === 0) return "Uses the defaults";
  const values: string = own.map((view: RowOptionView) => `${view.label}: ${view.value}`).join(", ");
  return own.length === views.length ? values : `${values}. The other options use the defaults`;
}
