import { X } from "lucide-react";
import { useEffect } from "react";
import type { JSX } from "react";

import { parseDeliverTo, parseHowMany, parseHowOften } from "src/core/alert-options";
import type { DraftRow } from "src/core/draft-rows";
import { DELIVER_TO_LABELS, HOW_MANY_LABELS, HOW_OFTEN_LABELS } from "src/core/option-labels";
import { LANGUAGE_OPTIONS, REGION_OPTIONS, SOURCE_OPTIONS } from "src/core/option-lists";
import type { OptionField } from "src/core/row-options";
import { FIELD_HEADERS } from "src/core/template-columns";
import { ListedOption } from "src/panel/components/listed-option";
import { Button } from "src/panel/ui/button";
import { Label } from "src/panel/ui/label";
import { RadioGroup } from "src/panel/ui/radio-group";
import type { RadioChoice } from "src/panel/ui/radio-group";
import { TextField } from "src/panel/ui/text-field";
import type { AlertOptions } from "src/shared/models";

/** The radio value of a cell with a text that is not valid. No choice matches it, so no radio button is checked. */
const INVALID_CHOICE: string = "__invalid__";

function chosenLabel<Value extends string>({
  cell,
  parse,
  labels,
}: {
  cell: string;
  parse: (input: { text: string }) => Value | null;
  labels: Readonly<Record<Value, string>>;
}): string {
  const text: string = cell.trim();
  if (text === "") return "";
  const parsed: Value | null = parse({ text });
  return parsed === null ? INVALID_CHOICE : labels[parsed];
}

function radioChoices({ labels, defaultLabel }: { labels: Readonly<Record<string, string>>; defaultLabel: string }): RadioChoice[] {
  return [
    { value: "", label: `Default (${defaultLabel})` },
    ...Object.values(labels).map((label: string): RadioChoice => ({ value: label, label })),
  ];
}

/** Render a dialog with the fields of one row so that the user can fix the query and the options. Side effect: listens for the Escape key. */
export function RowEditor({
  row,
  defaults,
  onQueryChange,
  onOptionChange,
  onClose,
}: {
  row: DraftRow;
  defaults: AlertOptions;
  onQueryChange: (query: string) => void;
  onOptionChange: (change: { field: OptionField; text: string }) => void;
  onClose: () => void;
}): JSX.Element {
  const finalDeliverTo: string = parseDeliverTo({ text: row.cells.deliverTo }) ?? defaults.deliverTo;
  const rssLocksHowOften: boolean = finalDeliverTo === "rss";
  const rowLabel: string = `row ${String(row.sourceRowNumber)}`;
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent): void => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", closeOnEscape);
    return (): void => { document.removeEventListener("keydown", closeOnEscape); };
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
    <section
      role="dialog"
      aria-modal="true"
      aria-label={`Edit ${rowLabel}`}
      className="@container max-h-full w-full max-w-2xl overflow-y-auto rounded-2xl border bg-background p-4 text-sm shadow-xl"
    >
      <h2 className="text-base font-medium">Edit {rowLabel}</h2>
      <p className="mb-3 text-xs text-muted-foreground">An empty option uses the value of the defaults. The table behind this dialog shows the final options.</p>
      <div className="space-y-1">
        <Label className="text-xs">{FIELD_HEADERS.query}</Label>
        <div className="relative">
          <TextField aria-label={`${FIELD_HEADERS.query} of ${rowLabel}`} value={row.query} onValueChange={onQueryChange} className="w-full" />
          {row.query !== "" && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={`Clear the ${FIELD_HEADERS.query} of ${rowLabel}`}
              onClick={() => { onQueryChange(""); }}
              className="absolute right-0 top-0 size-8"
            >
              <X className="size-3" />
            </Button>
          )}
        </div>
      </div>
      <div className="mt-3 grid grid-cols-1 gap-3 @sm:grid-cols-2">
        <RadioGroup
          legend={FIELD_HEADERS.howOften}
          value={rssLocksHowOften ? "" : chosenLabel({ cell: row.cells.howOften, parse: parseHowOften, labels: HOW_OFTEN_LABELS })}
          disabled={rssLocksHowOften}
          onValueChange={(text: string) => { onOptionChange({ field: "howOften", text }); }}
          choices={radioChoices({ labels: HOW_OFTEN_LABELS, defaultLabel: HOW_OFTEN_LABELS[defaults.howOften] })}
        />
        <RadioGroup
          legend={FIELD_HEADERS.howMany}
          value={chosenLabel({ cell: row.cells.howMany, parse: parseHowMany, labels: HOW_MANY_LABELS })}
          onValueChange={(text: string) => { onOptionChange({ field: "howMany", text }); }}
          choices={radioChoices({ labels: HOW_MANY_LABELS, defaultLabel: HOW_MANY_LABELS[defaults.howMany] })}
        />
        <RadioGroup
          legend={FIELD_HEADERS.deliverTo}
          value={chosenLabel({ cell: row.cells.deliverTo, parse: parseDeliverTo, labels: DELIVER_TO_LABELS })}
          onValueChange={(text: string) => { onOptionChange({ field: "deliverTo", text }); }}
          choices={radioChoices({ labels: DELIVER_TO_LABELS, defaultLabel: DELIVER_TO_LABELS[defaults.deliverTo] })}
        />
        <ListedOption
          label={FIELD_HEADERS.sources}
          value={row.cells.sources}
          options={SOURCE_OPTIONS}
          disabled={false}
          blankLabel={`Default (${defaults.sources})`}
          onChange={(text: string) => { onOptionChange({ field: "sources", text }); }}
        />
        <ListedOption
          label={FIELD_HEADERS.language}
          value={row.cells.language}
          options={LANGUAGE_OPTIONS}
          disabled={false}
          blankLabel={`Default (${defaults.language})`}
          onChange={(text: string) => { onOptionChange({ field: "language", text }); }}
        />
        <ListedOption
          label={FIELD_HEADERS.region}
          value={row.cells.region}
          options={REGION_OPTIONS}
          disabled={false}
          blankLabel={`Default (${defaults.region})`}
          onChange={(text: string) => { onOptionChange({ field: "region", text }); }}
        />
      </div>
      {rssLocksHowOften && <p className="mt-1 text-xs text-muted-foreground">An RSS feed always uses As-it-happens.</p>}
      <div className="mt-3 flex justify-end">
        <Button type="button" variant="outline" size="sm" onClick={onClose}>
          Done
        </Button>
      </div>
    </section>
    </div>
  );
}
