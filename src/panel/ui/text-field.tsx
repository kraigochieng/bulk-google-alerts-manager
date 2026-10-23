import { useRef } from "react";
import type { JSX } from "react";
import { MdOutlinedTextField } from "@material/web/textfield/outlined-text-field.js";

import "src/panel/material-elements";
import { useElementEvent } from "src/panel/ui/use-element-event";

/** Render a Material Web outlined text field. It reports each change as the new text. */
export function TextField({
  value,
  onValueChange,
  type = "text",
  rows,
  disabled = false,
  placeholder,
  id,
  className,
  ...rest
}: {
  value: string;
  onValueChange: (value: string) => void;
  type?: "text" | "search" | "textarea";
  rows?: number;
  disabled?: boolean;
  placeholder?: string;
  id?: string;
  className?: string;
  "aria-label"?: string;
}): JSX.Element {
  const fieldRef = useRef<HTMLElement | null>(null);
  useElementEvent({
    elementRef: fieldRef,
    eventName: "input",
    handler: (event: Event) => {
      if (event.target instanceof MdOutlinedTextField) onValueChange(event.target.value);
    },
  });
  return (
    <md-outlined-text-field
      ref={fieldRef}
      value={value}
      type={type}
      rows={rows}
      disabled={disabled}
      placeholder={placeholder}
      id={id}
      className={className}
      {...rest}
    />
  );
}
