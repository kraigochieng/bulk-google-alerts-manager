import { Pencil, Trash2 } from "lucide-react";
import type { JSX } from "react";

import { Button } from "src/panel/ui/button";

/** Render the icon buttons that edit or delete one row of the review. Pure: the actions come as props. */
export function RowActions({
  rowNumber,
  onEdit,
  onDelete,
}: {
  rowNumber: number;
  onEdit: () => void;
  onDelete: () => void;
}): JSX.Element {
  return (
    <div className="flex">
      <Button type="button" variant="ghost" size="icon" aria-label={`Edit row ${String(rowNumber)}`} title="Edit" onClick={onEdit}>
        <Pencil className="size-4" />
      </Button>
      <Button type="button" variant="ghost" size="icon" aria-label={`Delete row ${String(rowNumber)}`} title="Delete" onClick={onDelete}>
        <Trash2 className="size-4" />
      </Button>
    </div>
  );
}
