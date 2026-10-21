import type { JSX } from "react";

import "src/panel/material-elements";

export type ProgressTone = "default" | "warning" | "error";

/**
 * Render a Material Web linear progress bar. The value runs from 0 to 100. The tone sets the color of the bar.
 * An indeterminate bar shows work of unknown length.
 */
export function Progress({
  value,
  tone = "default",
  indeterminate = false,
  className,
  ...rest
}: {
  value: number;
  tone?: ProgressTone;
  indeterminate?: boolean;
  className?: string;
  "aria-label"?: string;
}): JSX.Element {
  return (
    <md-linear-progress
      value={Math.min(Math.max(value, 0), 100) / 100}
      indeterminate={indeterminate}
      data-tone={tone}
      className={className}
      {...rest}
    />
  );
}
