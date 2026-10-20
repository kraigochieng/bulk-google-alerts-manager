import { useCallback, useEffect, useState } from "react";
import type { JSX } from "react";

import { DEFAULT_SETTINGS } from "src/core/settings";
import type { Settings } from "src/core/settings";
import { ALERT_CAP_PER_ACCOUNT } from "src/core/alert-cap";
import { AccountUsage } from "src/panel/components/account-usage";
import { Banner } from "src/panel/components/banner";
import { Button } from "src/panel/ui/button";
import { Tabs, TabsList, TabsTrigger } from "src/panel/ui/tabs";
import { FirstRunScreen } from "src/panel/components/first-run-screen";
import { SettingsForm } from "src/panel/components/settings-form";
import { openAlertsTab } from "src/panel/chrome-bridge";
import { useAlertsTabStatus } from "src/panel/use-alerts-tab-status";
import { useAutosave } from "src/panel/use-autosave";
import { useLiveAlerts } from "src/panel/use-live-alerts";
import { useRunController } from "src/panel/use-run-controller";
import { switchViewParameters, readView } from "src/core/view-state";
import type { ViewName } from "src/core/view-state";
import { CreateView, ROWS_TABLE_SCHEMA } from "src/panel/views/create-view";
import { ALERTS_TABLE_SCHEMA, DeleteView } from "src/panel/views/delete-view";
import { RUN_TABLE_SCHEMA } from "src/panel/components/run-panel";
import { loadSettings, saveSettings } from "src/storage/run-repository";

/** Render the side panel: first-run notice, tab status, settings, and the active view. Holds the app state. */
export function App(): JSX.Element {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [settingsLoaded, setSettingsLoaded] = useState<boolean>(false);
  const [view, setView] = useState<ViewName>(() => readView({ parameters: new URLSearchParams(window.location.search) }));
  const tabStatus = useAlertsTabStatus();
  const controller = useRunController({ settings });
  const live = useLiveAlerts({ tabStatus, runStatus: controller.run?.status ?? null });

  useEffect(() => {
    const onPopState = (): void => {
      setView(readView({ parameters: new URLSearchParams(window.location.search) }));
    };
    window.addEventListener("popstate", onPopState);
    return (): void => {
      window.removeEventListener("popstate", onPopState);
    };
  }, []);

  const changeView = useCallback((next: ViewName): void => {
    const parameters: URLSearchParams = switchViewParameters({
      parameters: new URLSearchParams(window.location.search),
      view: next,
      schemas: [ROWS_TABLE_SCHEMA, ALERTS_TABLE_SCHEMA, RUN_TABLE_SCHEMA],
    });
    const query: string = parameters.toString();
    window.history.pushState(null, "", `${window.location.pathname}${query === "" ? "" : `?${query}`}`);
    setView(next);
  }, []);

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
        <p className="text-xs text-muted-foreground">Unofficial tool. Not affiliated with Google.</p>
      </header>
      {tabStatus === "no_tab" && (
        <Banner tone="warning">
          No Alerts tab is open.{" "}
          <Button type="button" variant="link" size="sm" className="h-auto p-0 text-xs" onClick={() => { void openAlertsTab(); }}>
            Open Google Alerts
          </Button>
        </Banner>
      )}
      {tabStatus === "no_script" && (
        <Banner tone="warning">The Alerts tab does not answer. Reload the Alerts tab, then try again.</Banner>
      )}
      <AccountUsage
        count={live.alerts?.length ?? null}
        cap={ALERT_CAP_PER_ACCOUNT}
        error={live.error}
        refreshing={live.refreshing}
        onRefresh={live.refresh}
      />
      <SettingsForm settings={settings} onChange={setSettings} saveStatus={saveStatus} locked={runActive} />
      <Tabs
        value={view}
        onValueChange={(value: string) => {
          if (value !== view) changeView(value as ViewName);
        }}
        className="mt-3"
      >
        <TabsList className="w-full">
          <TabsTrigger value="create">Bulk create</TabsTrigger>
          <TabsTrigger value="delete">Bulk delete</TabsTrigger>
        </TabsList>
      </Tabs>
      {view === "create" ? <CreateView settings={settings} controller={controller} live={live} /> : <DeleteView controller={controller} live={live} />}
    </main>
  );
}
