import type { JSX } from "react";

import "src/panel/material-elements";

export type ProgressTone = "default" | "warning" | "error";

/** Render a Material Web linear progress bar. The value runs from 0 to 100. The tone sets the color of the bar. */
export function Progress({
  value,
  tone = "default",
  className,
  ...rest
}: {
  value: number;
  tone?: ProgressTone;
  className?: string;
  "aria-label"?: string;
}): JSX.Element {
  return (
    <md-linear-progress
      value={Math.min(Math.max(value, 0), 100) / 100}
      data-tone={tone}
      className={className}
      {...rest}
    />
  );
}
