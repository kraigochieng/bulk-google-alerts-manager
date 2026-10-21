import type { JSX } from "react";

import { BusyOverlay } from "src/panel/ui/busy-overlay";
import { Button } from "src/panel/ui/button";

/** Render the foggy loader of an export, with its progress and a cancel button. Pure: the action comes as a prop. */
export function ExportOverlay({
  readCount,
  total,
  onCancel,
}: {
  readCount: number;
  total: number;
  onCancel: () => void;
}): JSX.Element {
  return (
    <BusyOverlay title="Exporting alerts" progress={(readCount / Math.max(total, 1)) * 100}>
      <p className="mt-1 text-sm text-muted-foreground">
        {String(readCount)} of {String(total)} alerts read. The CSV file downloads when the export ends.
      </p>
      <div className="mt-4">
        <Button type="button" variant="ghost" fullWidth onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </BusyOverlay>
  );
}
