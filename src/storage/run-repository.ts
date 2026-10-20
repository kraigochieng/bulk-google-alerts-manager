import { parseRunSnapshot } from "src/core/run-parse";
import { DEFAULT_SETTINGS, parseSettings } from "src/core/settings";
import type { Settings } from "src/core/settings";
import type { RunSnapshot } from "src/shared/models";

const RUN_KEY: string = "bulkAlerts.run";
const SETTINGS_KEY: string = "bulkAlerts.settings";

/** Read the saved run from local browser storage. Side effect: reads storage. */
export async function loadRun(): Promise<RunSnapshot | null> {
  const stored: Record<string, unknown> = await chrome.storage.local.get(RUN_KEY);
  return parseRunSnapshot({ value: stored[RUN_KEY] });
}

/** Save the run to local browser storage. Side effect: writes storage. */
export async function saveRun({ run }: { run: RunSnapshot }): Promise<void> {
  await chrome.storage.local.set({ [RUN_KEY]: run });
}

/** Remove the saved run. Side effect: writes storage. */
export async function clearRun(): Promise<void> {
  await chrome.storage.local.remove(RUN_KEY);
}

/** Read the saved settings. Side effect: reads storage. */
export async function loadSettings(): Promise<Settings> {
  const stored: Record<string, unknown> = await chrome.storage.local.get(SETTINGS_KEY);
  return stored[SETTINGS_KEY] === undefined ? DEFAULT_SETTINGS : parseSettings({ value: stored[SETTINGS_KEY] });
}

/** Save the settings. Side effect: writes storage. */
export async function saveSettings({ settings }: { settings: Settings }): Promise<void> {
  await chrome.storage.local.set({ [SETTINGS_KEY]: settings });
}
