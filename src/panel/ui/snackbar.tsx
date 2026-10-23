import type { JSX } from "react";

import { Button } from "src/panel/ui/button";

/** Render a Material 3 snackbar with one short message and a Dismiss button. Pure: the state comes as props. */
export function Snackbar({ message, onDismiss }: { message: string; onDismiss: () => void }): JSX.Element | null {
  if (message === "") return null;
  return (
    <div role="status" aria-live="polite" className="app-snackbar">
      <span className="min-w-0 flex-1 py-2">{message}</span>
      <Button type="button" variant="ghost" size="sm" onClick={onDismiss}>
        Dismiss
      </Button>
    </div>
  );
}
