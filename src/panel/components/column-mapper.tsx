import type { JSX } from "react";

import { IMPORT_FIELDS } from "src/core/column-mapping";
import type { ColumnMapping, ImportField } from "src/core/column-mapping";

const FIELD_LABELS: Record<ImportField, string> = {
  query: "Query (required)",
  label: "Label",
  deliverTo: "Deliver to (rss or email)",
  howOften: "How often",
  sources: "Sources",
  language: "Language",
  region: "Region",
  howMany: "How many (all or best)",
};

/** Render one dropdown for each import field. The user maps CSV columns to fields. */
export function ColumnMapper({
  headers,
  mapping,
  onChange,
}: {
  headers: readonly string[];
  mapping: ColumnMapping;
  onChange: (next: ColumnMapping) => void;
}): JSX.Element {
  return (
    <fieldset className="mt-2 rounded border border-gray-200 p-2">
      <legend className="px-1 text-xs font-semibold">Map CSV columns</legend>
      <div className="grid grid-cols-2 gap-2">
        {IMPORT_FIELDS.map((field: ImportField) => (
          <label key={field} className="block text-xs">
            {FIELD_LABELS[field]}
            <select
              value={mapping[field] === null ? "" : String(mapping[field])}
              onChange={(event) => {
                onChange({ ...mapping, [field]: event.target.value === "" ? null : Number(event.target.value) });
              }}
              className="mt-0.5 w-full rounded border border-gray-300 px-1 py-1 text-sm"
            >
              <option value="">{field === "query" ? "Choose a column" : "Not in file (use default)"}</option>
              {headers.map((header: string, index: number) => (
                <option key={`${header}-${String(index)}`} value={String(index)}>
                  {header === "" ? `(column ${String(index + 1)})` : header}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
