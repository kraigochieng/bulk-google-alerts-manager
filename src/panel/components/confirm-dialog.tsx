import { useRef } from "react";
import type { JSX } from "react";

import "src/panel/material-elements";
import { Button } from "src/panel/ui/button";
import { useElementEvent } from "src/panel/ui/use-element-event";

/** Render a confirmation dialog for a destructive action. The text names the item. Pure: state comes as props. */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  keepLabel,
  onConfirm,
  onOpenChange,
  extraAction,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  keepLabel: string;
  onConfirm: () => void;
  onOpenChange: (open: boolean) => void;
  /** A safe action that closes the dialog without the destructive action. */
  extraAction?: { readonly label: string; readonly onClick: () => void };
}): JSX.Element {
  const dialogRef = useRef<HTMLElement | null>(null);
  useElementEvent({
    elementRef: dialogRef,
    eventName: "close",
    handler: () => {
      if (open) onOpenChange(false);
    },
  });
  return (
    <md-dialog ref={dialogRef} open={open}>
      <div slot="headline">{title}</div>
      <div slot="content" className="whitespace-pre-line break-words">{description}</div>
      <div slot="actions">
        {extraAction !== undefined && (
          <Button
            type="button"
            variant="outline"
            className="mr-auto"
            onClick={() => {
              onOpenChange(false);
              extraAction.onClick();
            }}
          >
            {extraAction.label}
          </Button>
        )}
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            onOpenChange(false);
          }}
        >
          {keepLabel}
        </Button>
        <Button
          type="button"
          variant="destructive"
          onClick={() => {
            onOpenChange(false);
            onConfirm();
          }}
        >
          {confirmLabel}
        </Button>
      </div>
    </md-dialog>
  );
}
