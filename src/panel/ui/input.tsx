import type { ChangeEvent, JSX } from "react";

/** Render a native file chooser. Material Web has no file input. */
export function Input({
  id,
  accept,
  className,
  onChange,
  ...rest
}: {
  id?: string;
  accept: string;
  className?: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  "aria-label"?: string;
}): JSX.Element {
  return <input type="file" id={id} accept={accept} onChange={onChange} className={className} {...rest} />;
}
