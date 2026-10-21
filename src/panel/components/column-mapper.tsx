import type { JSX } from "react";

import { IMPORT_FIELDS } from "src/core/column-mapping";
import type { ColumnMapping, ImportField } from "src/core/column-mapping";
import { Label } from "src/panel/ui/label";
import { Select } from "src/panel/ui/select";
import type { SelectChoice } from "src/panel/ui/select";

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

const NO_COLUMN: string = "none";

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
    <fieldset className="mt-3 rounded-lg border bg-card p-3">
      <legend className="px-1 text-xs font-semibold">Map CSV columns</legend>
      <div className="grid grid-cols-1 gap-3 @sm:grid-cols-2">
        {IMPORT_FIELDS.map((field: ImportField) => (
          <div key={field} className="min-w-0 space-y-1">
            <Label className="text-xs">{FIELD_LABELS[field]}</Label>
            <Select
              value={mapping[field] === null ? NO_COLUMN : String(mapping[field])}
              onValueChange={(value: string) => {
                onChange({ ...mapping, [field]: value === NO_COLUMN ? null : Number(value) });
              }}
              aria-label={FIELD_LABELS[field]}
              className="w-full"
              choices={[
                { value: NO_COLUMN, label: field === "query" ? "Choose a column" : "Not in file (use default)" },
                ...headers.map((header: string, index: number): SelectChoice => ({
                  value: String(index),
                  label: header === "" ? `(column ${String(index + 1)})` : header,
                })),
              ]}
            />
          </div>
        ))}
      </div>
    </fieldset>
  );
}
