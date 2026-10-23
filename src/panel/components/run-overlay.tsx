import { useState } from "react";
import type { JSX } from "react";

import { countByStatus } from "src/core/run-machine";
import { Banner } from "src/panel/components/banner";
import { ConfirmDialog } from "src/panel/components/confirm-dialog";
import { BusyOverlay } from "src/panel/ui/busy-overlay";
import { Button } from "src/panel/ui/button";
import type { RunSnapshot } from "src/shared/models";

/** Render the foggy loader of an active run, with its progress and its controls. Actions come as props. */
export function RunOverlay({
  run,
  onPause,
  onResume,
  onCancel,
}: {
  run: RunSnapshot;
  onPause: () => void;
  onResume: () => void;
  onCancel: () => void;
}): JSX.Element {
  const [confirmingCancel, setConfirmingCancel] = useState<boolean>(false);
  const counts = countByStatus({ run });
  const total: number = run.items.length;
  const finished: number = total - counts.pending;
  const isCreate: boolean = run.kind === "create";
  const waitingText: string =
    run.status === "paused" ? "Paused." : run.status === "awaiting_captcha" ? "Waiting for you to solve a bot check." : "";
  return (
    <BusyOverlay title={isCreate ? "Adding alerts" : "Deleting alerts"} progress={(finished / Math.max(total, 1)) * 100} working={run.status === "running"}>
      <p className="mt-1 text-sm text-muted-foreground">
        {String(finished)} of {String(total)} done. {waitingText}
      </p>
      {run.status === "running" && (
        <Banner tone="info">Keep the Alerts tab open and in the foreground. Browsers slow background tabs.</Banner>
      )}
      {run.notice !== "" && <Banner tone={run.status === "awaiting_captcha" ? "warning" : "error"}>{run.notice}</Banner>}
      <div className="mt-4 flex flex-col gap-2">
        {run.status === "running" && (
          <Button type="button" variant="outline" fullWidth onClick={onPause}>
            Pause
          </Button>
        )}
        {run.status === "paused" && (
          <Button type="button" fullWidth onClick={onResume}>
            Resume
          </Button>
        )}
        {run.status === "awaiting_captcha" && (
          <Button type="button" fullWidth onClick={onResume}>
            I solved it, continue
          </Button>
        )}
        <Button
          type="button"
          variant="ghost"
          fullWidth
          onClick={() => {
            setConfirmingCancel(true);
          }}
        >
          Cancel
        </Button>
      </div>
      <ConfirmDialog
        open={confirmingCancel}
        title={`Cancel this ${isCreate ? "add" : "delete"} run?`}
        description={`${String(counts.pending)} of ${String(total)} rows are still waiting. Rows that are already done stay done.`}
        confirmLabel="Cancel the run"
        keepLabel="Keep running"
        onConfirm={onCancel}
        onOpenChange={setConfirmingCancel}
      />
    </BusyOverlay>
  );
}
