import { useRef } from "react";
import type { JSX } from "react";
import { MdCheckbox } from "@material/web/checkbox/checkbox.js";

import "src/panel/material-elements";
import { useElementEvent } from "src/panel/ui/use-element-event";

/** Render a Material Web checkbox. It reports the new checked state. */
export function Checkbox({
  checked,
  onCheckedChange,
  disabled = false,
  id,
  ...rest
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  id?: string;
  "aria-label"?: string;
}): JSX.Element {
  const checkboxRef = useRef<HTMLElement | null>(null);
  useElementEvent({
    elementRef: checkboxRef,
    eventName: "change",
    handler: (event: Event) => {
      if (event.target instanceof MdCheckbox) onCheckedChange(event.target.checked);
    },
  });
  return <md-checkbox ref={checkboxRef} checked={checked} disabled={disabled} id={id} {...rest} />;
}
