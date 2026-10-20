import { DEFAULT_ALERT_OPTIONS } from "src/core/alert-options";
import { parseAlertOptions } from "src/shared/messages";
import type { AlertOptions } from "src/shared/models";

/** Settings that the panel saves as the user types. */
export interface Settings {
  readonly risksAccepted: boolean;
  readonly defaults: AlertOptions;
  readonly minimumDelaySeconds: number;
  readonly maximumDelaySeconds: number;
}

export const DELAY_LIMITS: { readonly minimumSeconds: number; readonly maximumSeconds: number } = {
  minimumSeconds: 3,
  maximumSeconds: 120,
};

export const DEFAULT_SETTINGS: Settings = {
  risksAccepted: false,
  defaults: DEFAULT_ALERT_OPTIONS,
  minimumDelaySeconds: 6,
  maximumDelaySeconds: 14,
};

function clampSeconds({ value, fallback }: { value: unknown; fallback: number }): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return Math.min(Math.max(Math.round(value), DELAY_LIMITS.minimumSeconds), DELAY_LIMITS.maximumSeconds);
}

/** Read saved settings. An unknown or invalid value becomes the default. */
export function parseSettings({ value }: { value: unknown }): Settings {
  if (typeof value !== "object" || value === null) return DEFAULT_SETTINGS;
  const record = value as Record<string, unknown>;
  const minimum: number = clampSeconds({ value: record.minimumDelaySeconds, fallback: DEFAULT_SETTINGS.minimumDelaySeconds });
  const maximum: number = clampSeconds({ value: record.maximumDelaySeconds, fallback: DEFAULT_SETTINGS.maximumDelaySeconds });
  return {
    risksAccepted: record.risksAccepted === true,
    defaults: parseAlertOptions({ value: record.defaults }) ?? DEFAULT_SETTINGS.defaults,
    minimumDelaySeconds: Math.min(minimum, maximum),
    maximumDelaySeconds: Math.max(minimum, maximum),
  };
}
