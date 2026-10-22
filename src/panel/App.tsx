import { useCallback, useEffect, useState } from "react";
import type { JSX } from "react";

import { DEFAULT_SETTINGS } from "src/core/settings";
import type { Settings } from "src/core/settings";
import { ALERT_CAP_PER_ACCOUNT } from "src/core/alert-cap";
import { AccountUsage } from "src/panel/components/account-usage";
import { Tabs } from "src/panel/ui/tabs";
import { buildExportSummary, exportIsEnded } from "src/core/export-progress";
import { buildRunSummary, runIsFinished } from "src/core/run-summary";
import { chooseScreen } from "src/core/screen-state";
import { ExportOverlay } from "src/panel/components/export-overlay";
import { RunOverlay } from "src/panel/components/run-overlay";
import { RunResultDialog } from "src/panel/components/run-result-dialog";
import { FirstRunScreen } from "src/panel/components/first-run-screen";
import { closeApp, reportBusy } from "src/panel/page-link";
import { Button } from "src/panel/ui/button";
import { useAutosave } from "src/panel/use-autosave";
import { useLiveAlerts } from "src/panel/use-live-alerts";
import { useExport } from "src/panel/use-export";
import { useRunController } from "src/panel/use-run-controller";
import type { ScreenName } from "src/core/screen-state";
import { DEFAULT_VIEW } from "src/core/view-state";
import type { ViewName } from "src/core/view-state";
import { ExportView } from "src/panel/views/export-view";
import { CreateView } from "src/panel/views/create-view";
import { DeleteView } from "src/panel/views/delete-view";
import { loadSettings, saveSettings } from "src/storage/run-repository";

/** Render the app on the Alerts page: first-run notice, settings, and the active view. Holds the app state. */
export function App(): JSX.Element {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [settingsLoaded, setSettingsLoaded] = useState<boolean>(false);
  const [view, setView] = useState<ViewName>(DEFAULT_VIEW);
  const controller = useRunController();
  const exporter = useExport();
  const live = useLiveAlerts({ runStatus: controller.run?.status ?? null });
  const needsFullPage: boolean = controller.run !== null || exporter.state.status !== "idle";

  useEffect(() => {
    reportBusy({ busy: needsFullPage });
  }, [needsFullPage]);

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
  const screen: ScreenName = chooseScreen({ risksAccepted: settings.risksAccepted });
  if (screen === "first_run") {
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

  const run = controller.run;
  const runActive: boolean = run !== null && !runIsFinished({ status: run.status });
  const exportActive: boolean = exporter.state.status === "running";

  return (
    <>
      <main className="@container min-h-screen p-3 text-sm" inert={runActive || exportActive}>
      <header className="flex items-center gap-3 px-1 pt-1">
        <img src="/icons/icon-48.png" alt="" width={40} height={40} className="size-10 shrink-0" />
        <div className="min-w-0">
          <h1 className="text-lg font-medium leading-tight text-foreground">Bulk Google Alerts Manager</h1>
          <p className="text-xs text-muted-foreground">Unofficial tool. Not affiliated with Google.</p>
        </div>
        <Button type="button" variant="ghost" size="sm" className="ml-auto" onClick={closeApp}>
          Close
        </Button>
      </header>
      <AccountUsage
        count={live.alerts?.length ?? null}
        cap={ALERT_CAP_PER_ACCOUNT}
        error={live.error}
        refreshing={live.refreshing}
        onRefresh={live.refresh}
      />
      <Tabs
        value={view}
        onValueChange={(value: string) => {
          if (value !== view) setView(value as ViewName);
        }}
        tabs={[
          { value: "create", label: "Add" },
          { value: "delete", label: "Delete" },
          { value: "export", label: "Export" },
        ]}
        className="mt-3"
      />
      {view === "create" && <CreateView settings={settings} onSettingsChange={setSettings} saveStatus={saveStatus} controller={controller} live={live} />}
      {view === "delete" && <DeleteView controller={controller} />}
      {view === "export" && <ExportView exporter={exporter} />}
      </main>
      {run !== null && runActive && (
        <RunOverlay
          run={run}
          onPause={() => { controller.send({ type: "pause", reason: "You paused the run." }); }}
          onResume={controller.resume}
          onCancel={() => { controller.send({ type: "cancel" }); }}
        />
      )}
      {run !== null && !runActive && (
        <RunResultDialog open summary={buildRunSummary({ run })} onClose={controller.clear} />
      )}
      {exportActive && (
        <ExportOverlay
          readCount={exporter.state.entries.length}
          total={exporter.state.total}
          onCancel={exporter.cancel}
        />
      )}
      {exportIsEnded({ status: exporter.state.status }) && (
        <RunResultDialog
          open
          summary={buildExportSummary({
            status: exporter.state.status,
            entries: exporter.state.entries,
            total: exporter.state.total,
            notice: exporter.state.notice,
          })}
          onClose={exporter.reset}
        />
      )}
    </>
  );
}
