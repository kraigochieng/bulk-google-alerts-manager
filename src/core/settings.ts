import { DEFAULT_ALERT_OPTIONS } from "src/core/alert-options";
import { parseAlertOptions } from "src/shared/messages";
import type { AlertOptions } from "src/shared/models";

/** Settings that the app saves as the user types. Unknown saved keys are ignored. */
export interface Settings {
  readonly risksAccepted: boolean;
  readonly defaults: AlertOptions;
}

export const DEFAULT_SETTINGS: Settings = {
  risksAccepted: false,
  defaults: DEFAULT_ALERT_OPTIONS,
};

/** Read saved settings. An unknown or invalid value becomes the default. */
export function parseSettings({ value }: { value: unknown }): Settings {
  if (typeof value !== "object" || value === null) return DEFAULT_SETTINGS;
  const record = value as Record<string, unknown>;
  return {
    risksAccepted: record.risksAccepted === true,
    defaults: parseAlertOptions({ value: record.defaults }) ?? DEFAULT_SETTINGS.defaults,
  };
}
