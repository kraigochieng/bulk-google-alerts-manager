import type { JSX } from "react";

import { buildDeleteConfirmation } from "src/core/delete-confirmation";
import { ConfirmDialog } from "src/panel/components/confirm-dialog";

/** How many queries the confirmation dialog lists before it shows the count of the rest. */
const DELETE_PREVIEW_LIMIT: number = 8;

/** Render the confirmation of a delete run. The text names the count and the first queries. Pure: state comes as props. */
export function DeleteConfirm({
  open,
  queries,
  onConfirm,
  onOpenChange,
}: {
  open: boolean;
  queries: readonly string[];
  onConfirm: () => void;
  onOpenChange: (open: boolean) => void;
}): JSX.Element {
  const confirmation = buildDeleteConfirmation({ queries, previewLimit: DELETE_PREVIEW_LIMIT });
  return (
    <ConfirmDialog
      open={open}
      title={confirmation.title}
      description={confirmation.description}
      confirmLabel="Delete"
      keepLabel="Keep"
      onConfirm={onConfirm}
      onOpenChange={onOpenChange}
    />
  );
}
