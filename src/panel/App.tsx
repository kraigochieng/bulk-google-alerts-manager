import { useCallback, useEffect, useState } from "react";
import type { JSX } from "react";

import { DEFAULT_SETTINGS } from "src/core/settings";
import type { Settings } from "src/core/settings";
import { Banner } from "src/panel/components/banner";
import { FirstRunScreen } from "src/panel/components/first-run-screen";
import { SettingsForm } from "src/panel/components/settings-form";
import { openAlertsTab } from "src/panel/chrome-bridge";
import { useAlertsTabStatus } from "src/panel/use-alerts-tab-status";
import { useAutosave } from "src/panel/use-autosave";
import { useRunController } from "src/panel/use-run-controller";
import { CreateView } from "src/panel/views/create-view";
import { loadSettings, saveSettings } from "src/storage/run-repository";

/** Render the side panel: first-run notice, tab status, settings, and the active view. Holds the app state. */
export function App(): JSX.Element {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [settingsLoaded, setSettingsLoaded] = useState<boolean>(false);
  const tabStatus = useAlertsTabStatus();
  const controller = useRunController({ settings });

  useEffect(() => {
    void loadSettings().then((saved: Settings) => {
      setSettings(saved);
      setSettingsLoaded(true);
    });
  }, []);

  const persist = useCallback((next: Settings) => saveSettings({ settings: next }), []);
  const saveStatus = useAutosave({ value: settings, save: persist, enabled: settingsLoaded, delayMilliseconds: 400 });

  if (!settingsLoaded || !controller.loaded) {
    return <main className="p-4 text-sm">Loading…</main>;
  }
  if (!settings.risksAccepted) {
    return (
      <FirstRunScreen
        onAccept={() => {
          const accepted: Settings = { ...settings, risksAccepted: true };
          setSettings(accepted);
          void saveSettings({ settings: accepted });
        }}
      />
    );
  }

  const runActive: boolean =
    controller.run !== null && ["running", "paused", "awaiting_captcha"].includes(controller.run.status);

  return (
    <main className="p-3 text-sm">
      <header>
        <h1 className="text-base font-semibold">Bulk Alerts Manager</h1>
        <p className="text-xs text-gray-600">Unofficial tool. Not affiliated with Google.</p>
      </header>
      {tabStatus === "no_tab" && (
        <Banner tone="warning">
          No Alerts tab is open.{" "}
          <button type="button" onClick={() => { void openAlertsTab(); }} className="underline">
            Open Google Alerts
          </button>
        </Banner>
      )}
      {tabStatus === "no_script" && (
        <Banner tone="warning">The Alerts tab does not answer. Reload the Alerts tab, then try again.</Banner>
      )}
      <SettingsForm settings={settings} onChange={setSettings} saveStatus={saveStatus} locked={runActive} />
      <CreateView settings={settings} controller={controller} />
    </main>
  );
}
