import type { JSX } from "react";

import { DELAY_LIMITS } from "src/core/settings";
import type { Settings } from "src/core/settings";
import type { SaveStatus } from "src/panel/use-autosave";
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
    <label className="block text-xs">
      {label}
      <span className="relative block">
        <input
          type="text"
          value={value}
          disabled={disabled}
          onChange={(event) => { onChange(event.target.value); }}
          className="mt-0.5 w-full rounded border border-gray-300 px-2 py-1 pr-6 text-sm"
        />
        {value !== "" && !disabled && (
          <button type="button" aria-label={`Clear ${label}`} onClick={() => { onChange(""); }} className="absolute right-1 top-1.5 px-1 text-gray-500">
            ×
          </button>
        )}
      </span>
    </label>
  );
}

/** Render the default alert options and the delay range. Inputs lock while a run is active. */
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
    <fieldset className="mt-2 rounded border border-gray-200 p-2" disabled={locked}>
      <legend className="px-1 text-xs font-semibold">Default alert options</legend>
      {locked && <p className="text-xs text-amber-800">Locked while a run is active.</p>}
      <p className="text-xs text-gray-600">A CSV column overrides a default for its row.</p>
      <div className="mt-1 grid grid-cols-2 gap-2">
        <label className="block text-xs">
          Deliver to
          <select
            value={defaults.deliverTo}
            onChange={(event) => { setDefaults({ deliverTo: event.target.value as DeliverTo }); }}
            className="mt-0.5 w-full rounded border border-gray-300 px-1 py-1 text-sm"
          >
            <option value="rss">RSS feed</option>
            <option value="email">Email</option>
          </select>
        </label>
        <label className="block text-xs">
          How often
          <select
            value={isRss ? "as_it_happens" : defaults.howOften}
            disabled={isRss}
            onChange={(event) => { setDefaults({ howOften: event.target.value as HowOften }); }}
            className="mt-0.5 w-full rounded border border-gray-300 px-1 py-1 text-sm"
          >
            <option value="as_it_happens">As-it-happens</option>
            <option value="daily">At most once a day</option>
            <option value="weekly">At most once a week</option>
          </select>
        </label>
        <label className="block text-xs">
          How many
          <select
            value={defaults.howMany}
            onChange={(event) => { setDefaults({ howMany: event.target.value as HowMany }); }}
            className="mt-0.5 w-full rounded border border-gray-300 px-1 py-1 text-sm"
          >
            <option value="all">All results</option>
            <option value="best">Only the best results</option>
          </select>
        </label>
        <ClearableText label="Sources" value={defaults.sources} disabled={locked} onChange={(value) => { setDefaults({ sources: value }); }} />
        <ClearableText label="Language" value={defaults.language} disabled={locked} onChange={(value) => { setDefaults({ language: value }); }} />
        <ClearableText label="Region" value={defaults.region} disabled={locked} onChange={(value) => { setDefaults({ region: value }); }} />
      </div>
      {isRss && <p className="mt-1 text-xs text-gray-600">RSS feeds always use As-it-happens.</p>}
      <p className="mt-1 text-xs text-gray-600">
        Sources, language and region must match the text in the Google dropdown, for example “English”.
      </p>
      <div className="mt-2 text-xs">
        <label className="block">
          Shortest wait between alerts: {String(settings.minimumDelaySeconds)} s
          <input
            type="range"
            min={DELAY_LIMITS.minimumSeconds}
            max={DELAY_LIMITS.maximumSeconds}
            value={settings.minimumDelaySeconds}
            onChange={(event) => {
              const minimum: number = Number(event.target.value);
              onChange({ ...settings, minimumDelaySeconds: minimum, maximumDelaySeconds: Math.max(minimum, settings.maximumDelaySeconds) });
            }}
            className="block w-full"
          />
        </label>
        <label className="mt-1 block">
          Longest wait between alerts: {String(settings.maximumDelaySeconds)} s
          <input
            type="range"
            min={DELAY_LIMITS.minimumSeconds}
            max={DELAY_LIMITS.maximumSeconds}
            value={settings.maximumDelaySeconds}
            onChange={(event) => {
              const maximum: number = Number(event.target.value);
              onChange({ ...settings, maximumDelaySeconds: maximum, minimumDelaySeconds: Math.min(maximum, settings.minimumDelaySeconds) });
            }}
            className="block w-full"
          />
        </label>
        <p className="mt-1 text-gray-600">The wait is random between these two values. A longer wait lowers the chance of a bot check.</p>
      </div>
      <p role="status" className={`mt-2 text-xs ${saveStatus === "failed" ? "font-semibold text-red-700" : "text-gray-600"}`}>
        {STATUS_TEXT[saveStatus]}
      </p>
    </fieldset>
  );
}
