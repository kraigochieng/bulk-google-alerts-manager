import type { JSX } from "react";

import { LANGUAGE_OPTIONS, REGION_OPTIONS, SOURCE_OPTIONS } from "src/core/option-lists";
import type { Settings } from "src/core/settings";
import { ListedOption } from "src/panel/components/listed-option";
import type { SaveStatus } from "src/panel/use-autosave";
import { RadioGroup } from "src/panel/ui/radio-group";
import type { DeliverTo, HowMany, HowOften } from "src/shared/models";

const STATUS_TEXT: Record<SaveStatus, string> = {
  idle: "Settings are saved as you type.",
  saving: "Saving…",
  saved: "Saved.",
  failed: "Saving failed. Your changes are not stored.",
};

function OptionChoice({
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
    <RadioGroup
      legend={label}
      value={value}
      disabled={disabled}
      onValueChange={onChange}
      choices={options.map(([optionValue, optionLabel]) => ({ value: optionValue, label: optionLabel }))}
    />
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
    <fieldset className="mt-3 rounded-lg border bg-card p-3" disabled={locked}>
      <legend className="px-1 text-xs font-semibold">Default alert options</legend>
      {locked && <p className="text-xs text-amber-800">Locked while a run is active.</p>}
      <p className="text-xs text-muted-foreground">A CSV column overrides a default for its row.</p>
      <div className="mt-3 grid grid-cols-1 gap-3 @sm:grid-cols-2">
        <OptionChoice
          label="Deliver to"
          value={defaults.deliverTo}
          disabled={locked}
          onChange={(value) => { setDefaults({ deliverTo: value as DeliverTo }); }}
          options={[["rss", "RSS feed"], ["email", "Email"]]}
        />
        <OptionChoice
          label="How often"
          value={isRss ? "as_it_happens" : defaults.howOften}
          disabled={locked || isRss}
          onChange={(value) => { setDefaults({ howOften: value as HowOften }); }}
          options={[["as_it_happens", "As-it-happens"], ["daily", "At most once a day"], ["weekly", "At most once a week"]]}
        />
        <OptionChoice
          label="How many"
          value={defaults.howMany}
          disabled={locked}
          onChange={(value) => { setDefaults({ howMany: value as HowMany }); }}
          options={[["all", "All results"], ["best", "Only the best results"]]}
        />
        <ListedOption label="Sources" value={defaults.sources} options={SOURCE_OPTIONS} disabled={locked} onChange={(value) => { setDefaults({ sources: value }); }} />
        <ListedOption label="Language" value={defaults.language} options={LANGUAGE_OPTIONS} disabled={locked} onChange={(value) => { setDefaults({ language: value }); }} />
        <ListedOption label="Region" value={defaults.region} options={REGION_OPTIONS} disabled={locked} onChange={(value) => { setDefaults({ region: value }); }} />
      </div>
      {isRss && <p className="mt-1 text-xs text-muted-foreground">RSS feeds always use As-it-happens.</p>}
      <p className="mt-1 text-xs text-muted-foreground">
        Choose a listed value, or choose “Other” and type one. A typed value must match the text in the Google dropdown.
      </p>
      <p role="status" className={`mt-2 text-xs ${saveStatus === "failed" ? "font-semibold text-destructive" : "text-muted-foreground"}`}>
        {STATUS_TEXT[saveStatus]}
      </p>
    </fieldset>
  );
}
