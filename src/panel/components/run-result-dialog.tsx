import { useRef } from "react";
import type { JSX } from "react";

import "src/panel/material-elements";
import type { RunSummary } from "src/core/run-summary";
import { Button } from "src/panel/ui/button";
import { useElementEvent } from "src/panel/ui/use-element-event";

/** One extra button of the result dialog. The dialog stays open after a click. */
export interface ResultAction {
  readonly label: string;
  readonly onClick: () => void;
}

/** Render the dialog that tells the user how a run or an export ended. Pure: state comes as props. */
export function RunResultDialog({
  open,
  summary,
  onClose,
  actions = [],
}: {
  open: boolean;
  summary: RunSummary;
  onClose: () => void;
  actions?: readonly ResultAction[];
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
        <ul aria-label="Result" className="list-none space-y-1 p-0">
          {summary.lines.map((line: string) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
        {summary.details.length > 0 && (
          <ul aria-label="Details" className="mt-3 list-none space-y-1 p-0 text-destructive">
            {summary.details.map((detail: string) => (
              <li key={detail} className="break-words">
                {detail}
              </li>
            ))}
          </ul>
        )}
      </div>
      <div slot="actions">
        {actions.map((action: ResultAction) => (
          <Button key={action.label} type="button" variant="outline" onClick={action.onClick}>
            {action.label}
          </Button>
        ))}
        <Button type="button" onClick={onClose}>
          OK
        </Button>
      </div>
    </md-dialog>
  );
}
