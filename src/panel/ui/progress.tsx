import type { JSX } from "react";

import "src/panel/material-elements";

/** Render a Material Web linear progress bar. The value runs from 0 to 100. */
export function Progress({
  value,
  className,
  ...rest
}: {
  value: number;
  className?: string;
  "aria-label"?: string;
}): JSX.Element {
  return <md-linear-progress value={Math.min(Math.max(value, 0), 100) / 100} className={className} {...rest} />;
}
