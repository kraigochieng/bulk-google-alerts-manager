import { X } from "lucide-react";
import type { JSX } from "react";

import type { Settings } from "src/core/settings";
import type { SaveStatus } from "src/panel/use-autosave";
import { Button } from "src/panel/ui/button";
import { TextField } from "src/panel/ui/text-field";
import { Label } from "src/panel/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "src/panel/ui/select";
import type { DeliverTo, HowMany, HowOften } from "src/shared/models";

const STATUS_TEXT: Record<SaveStatus, string> = {
  idle: "Settings are saved as you type.",
  saving: "Saving…",
  saved: "Saved.",
  failed: "Saving failed. Your changes are not stored.",
};

function ClearableText({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
}): JSX.Element {
  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      <div className="relative">
        <TextField
          aria-label={label}
          value={value}
          disabled={disabled}
          onValueChange={onChange}
          className="w-full"
        />
        {value !== "" && !disabled && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={`Clear ${label}`}
            onClick={() => { onChange(""); }}
            className="absolute right-0 top-0 size-8"
          >
            <X className="size-3" />
          </Button>
        )}
      </div>
    </div>
  );
}

function OptionSelect({
  label,
  value,
  disabled,
  onChange,
  options,
}: {
  label: string;
  value: string;
  disabled: boolean;
  onChange: (value: string) => void;
  options: readonly (readonly [string, string])[];
}): JSX.Element {
  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      <Select value={value} disabled={disabled} onValueChange={onChange}>
        <SelectTrigger className="h-8 w-full text-sm" aria-label={label}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map(([optionValue, optionLabel]) => (
            <SelectItem key={optionValue} value={optionValue}>
              {optionLabel}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

/** Render the default alert options. Inputs lock while a run is active. */
export function SettingsForm({
  settings,
  onChange,
  saveStatus,
  locked,
}: {
  settings: Settings;
  onChange: (next: Settings) => void;
  saveStatus: SaveStatus;
  locked: boolean;
}): JSX.Element {
  const { defaults } = settings;
  const setDefaults = (partial: Partial<Settings["defaults"]>): void => {
    onChange({ ...settings, defaults: { ...defaults, ...partial } });
  };
  const isRss: boolean = defaults.deliverTo === "rss";
  return (
    <fieldset className="mt-2 rounded-lg border bg-card p-2" disabled={locked}>
      <legend className="px-1 text-xs font-semibold">Default alert options</legend>
      {locked && <p className="text-xs text-amber-800">Locked while a run is active.</p>}
      <p className="text-xs text-muted-foreground">A CSV column overrides a default for its row.</p>
      <div className="mt-1 grid grid-cols-2 gap-2">
        <OptionSelect
          label="Deliver to"
          value={defaults.deliverTo}
          disabled={locked}
          onChange={(value) => { setDefaults({ deliverTo: value as DeliverTo }); }}
          options={[["rss", "RSS feed"], ["email", "Email"]]}
        />
        <OptionSelect
          label="How often"
          value={isRss ? "as_it_happens" : defaults.howOften}
          disabled={locked || isRss}
          onChange={(value) => { setDefaults({ howOften: value as HowOften }); }}
          options={[["as_it_happens", "As-it-happens"], ["daily", "At most once a day"], ["weekly", "At most once a week"]]}
        />
        <OptionSelect
          label="How many"
          value={defaults.howMany}
          disabled={locked}
          onChange={(value) => { setDefaults({ howMany: value as HowMany }); }}
          options={[["all", "All results"], ["best", "Only the best results"]]}
        />
        <ClearableText label="Sources" value={defaults.sources} disabled={locked} onChange={(value) => { setDefaults({ sources: value }); }} />
        <ClearableText label="Language" value={defaults.language} disabled={locked} onChange={(value) => { setDefaults({ language: value }); }} />
        <ClearableText label="Region" value={defaults.region} disabled={locked} onChange={(value) => { setDefaults({ region: value }); }} />
      </div>
      {isRss && <p className="mt-1 text-xs text-muted-foreground">RSS feeds always use As-it-happens.</p>}
      <p className="mt-1 text-xs text-muted-foreground">
        Sources, language and region must match the text in the Google dropdown, for example “English”.
      </p>
      <p role="status" className={`mt-2 text-xs ${saveStatus === "failed" ? "font-semibold text-destructive" : "text-muted-foreground"}`}>
        {STATUS_TEXT[saveStatus]}
      </p>
    </fieldset>
  );
}
