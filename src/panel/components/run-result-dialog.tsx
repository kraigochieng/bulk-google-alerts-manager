import { useRef } from "react";
import type { JSX } from "react";

import "src/panel/material-elements";
import type { RunSummary } from "src/core/run-summary";
import { Button } from "src/panel/ui/button";
import { useElementEvent } from "src/panel/ui/use-element-event";

/** Render the dialog that tells the user how a run ended. Pure: state comes as props. */
export function RunResultDialog({
  open,
  summary,
  onClose,
}: {
  open: boolean;
  summary: RunSummary;
  onClose: () => void;
}): JSX.Element {
  const dialogRef = useRef<HTMLElement | null>(null);
  useElementEvent({
    elementRef: dialogRef,
    eventName: "close",
    handler: () => {
      if (open) onClose();
    },
  });
  return (
    <md-dialog ref={dialogRef} open={open}>
      <div slot="headline">{summary.title}</div>
      <div slot="content">
        <ul aria-label="Run result" className="list-none space-y-1 p-0">
          {summary.lines.map((line: string) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
        {summary.hasFailures && (
          <p className="mt-2 text-destructive">Some rows failed. The table shows the reason for each row.</p>
        )}
      </div>
      <div slot="actions">
        <Button type="button" onClick={onClose}>
          OK
        </Button>
      </div>
    </md-dialog>
  );
}
