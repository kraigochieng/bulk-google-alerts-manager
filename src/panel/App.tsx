import { useCallback, useEffect, useState } from "react";
import type { JSX } from "react";

import { DEFAULT_SETTINGS } from "src/core/settings";
import type { Settings } from "src/core/settings";
import { buildExportCsv, EXPORT_FILE_NAME } from "src/core/export-csv";
import { buildExportSummary, exportIsEnded } from "src/core/export-progress";
import { buildRunSummary, runIsFinished } from "src/core/run-summary";
import { ExportOverlay } from "src/panel/components/export-overlay";
import { RunOverlay } from "src/panel/components/run-overlay";
import { RunResultDialog } from "src/panel/components/run-result-dialog";
import { FirstRunScreen } from "src/panel/components/first-run-screen";
import { DeleteConfirm } from "src/panel/components/delete-confirm";
import { copyTextToClipboard, downloadTextFile } from "src/panel/chrome-bridge";
import { reportInteractive } from "src/panel/page-link";
import { Snackbar } from "src/panel/ui/snackbar";
import { useSnackbar } from "src/panel/use-snackbar";
import type { SnackbarState } from "src/panel/use-snackbar";
import { Modal } from "src/panel/ui/modal";
import { buildDeleteRun } from "src/core/run-builders";
import { checkDeleteGate, checkExportGate } from "src/core/start-gates";
import { useCheckedAlerts } from "src/panel/use-checked-alerts";
import { usePageCommands } from "src/panel/use-page-commands";
import type { PageCommand } from "src/shared/frame-messages";
import { useAutosave } from "src/panel/use-autosave";
import { useLiveAlerts } from "src/panel/use-live-alerts";
import { useExport } from "src/panel/use-export";
import { useRunController } from "src/panel/use-run-controller";
import { CreateView } from "src/panel/views/create-view";
import { loadSettings, saveSettings } from "src/storage/run-repository";

type CopyStatus = "idle" | "copied" | "failed";

const COPY_LABELS: Record<CopyStatus, string> = {
  idle: "Copy to clipboard",
  copied: "Copied",
  failed: "Copy failed, use Download",
};

/** Render the app on the Alerts page: first-run notice, settings, the Add dialog, and the dialogs of the bar actions. Holds the app state. */
export function App(): JSX.Element {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [settingsLoaded, setSettingsLoaded] = useState<boolean>(false);
  const controller = useRunController();
  const exporter = useExport();
  const live = useLiveAlerts({ runStatus: controller.run?.status ?? null });
  const checkedAlerts = useCheckedAlerts();
  const [confirmingDelete, setConfirmingDelete] = useState<boolean>(false);
  const [addOpen, setAddOpen] = useState<boolean>(false);
  const [pendingCommand, setPendingCommand] = useState<PageCommand | null>(null);
  const interactive: boolean =
    addOpen || pendingCommand !== null || confirmingDelete || controller.run !== null || exporter.state.status !== "idle";

  const snackbar: SnackbarState = useSnackbar();
  const [copyStatus, setCopyStatus] = useState<CopyStatus>("idle");

  const perform = (command: PageCommand): void => {
    if (command === "add") {
      setAddOpen(true);
    } else if (command === "delete" && checkDeleteGate({ selectedCount: checkedAlerts.length }).allowed) {
      setConfirmingDelete(true);
    } else if (command === "export" && checkExportGate({ selectedCount: checkedAlerts.length }).allowed) {
      exporter.start({ alerts: checkedAlerts });
    }
  };

  usePageCommands({
    onCommand: (command: PageCommand): void => {
      if (settings.risksAccepted) perform(command);
      else setPendingCommand(command);
    },
  });

  useEffect(() => {
    reportInteractive({ interactive });
  }, [interactive]);

  useEffect(() => {
    if (controller.run !== null) setAddOpen(false);
  }, [controller.run]);

  useEffect(() => {
    void loadSettings().then((saved: Settings) => {
      setSettings(saved);
      setSettingsLoaded(true);
    });
  }, []);

  const persist = useCallback((next: Settings) => saveSettings({ settings: next }), []);
  const saveStatus = useAutosave({ value: settings, save: persist, enabled: settingsLoaded, delayMilliseconds: 400 });

  if (!settingsLoaded || !controller.loaded) {
    return <></>;
  }

  const run = controller.run;
  const runActive: boolean = run !== null && !runIsFinished({ status: run.status });
  const exportActive: boolean = exporter.state.status === "running";

  return (
    <>
      <Modal
        open={pendingCommand !== null}
        title="Before you start"
        onClose={() => {
          setPendingCommand(null);
        }}
      >
        <FirstRunScreen
          onAccept={() => {
            const accepted: Settings = { ...settings, risksAccepted: true };
            setSettings(accepted);
            void saveSettings({ settings: accepted });
            if (pendingCommand !== null) perform(pendingCommand);
            setPendingCommand(null);
          }}
        />
      </Modal>
      <Modal
        open={addOpen}
        title="Add alerts"
        onClose={() => {
          setAddOpen(false);
        }}
      >
        <CreateView settings={settings} onSettingsChange={setSettings} saveStatus={saveStatus} controller={controller} live={live} onNotify={snackbar.show} />
      </Modal>
      <Snackbar message={snackbar.message} onDismiss={snackbar.dismiss} />
      <DeleteConfirm
        open={confirmingDelete}
        queries={checkedAlerts.map((alert) => alert.query)}
        onConfirm={() => {
          controller.begin(buildDeleteRun({ queries: checkedAlerts.map((alert) => alert.query) }));
        }}
        onOpenChange={setConfirmingDelete}
      />
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
          onClose={() => {
            setCopyStatus("idle");
            exporter.reset();
          }}
          actions={
            exporter.state.status === "finished"
              ? [
                  {
                    label: COPY_LABELS[copyStatus],
                    onClick: (): void => {
                      void copyTextToClipboard({ text: buildExportCsv({ entries: exporter.state.entries }) }).then((copied: boolean) => {
                        setCopyStatus(copied ? "copied" : "failed");
                      });
                    },
                  },
                  {
                    label: "Download CSV",
                    onClick: (): void => {
                      downloadTextFile({ fileName: EXPORT_FILE_NAME, text: buildExportCsv({ entries: exporter.state.entries }) });
                    },
                  },
                ]
              : []
          }
        />
      )}
    </>
  );
}
