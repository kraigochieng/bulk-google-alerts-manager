import { useRef } from "react";
import type { JSX } from "react";
import { MdOutlinedSelect } from "@material/web/select/outlined-select.js";

import "src/panel/material-elements";
import { useElementEvent } from "src/panel/ui/use-element-event";

/** One choice of a select: the stored value and the text the user sees. */
export interface SelectChoice {
  readonly value: string;
  readonly label: string;
}

/** Render a Material Web outlined select. It reports the value of the chosen option. */
export function Select({
  value,
  onValueChange,
  choices,
  disabled = false,
  className,
  ...rest
}: {
  value: string;
  onValueChange: (value: string) => void;
  choices: readonly SelectChoice[];
  disabled?: boolean;
  className?: string;
  "aria-label"?: string;
}): JSX.Element {
  const selectRef = useRef<HTMLElement | null>(null);
  useElementEvent({
    elementRef: selectRef,
    eventName: "change",
    handler: (event: Event) => {
      if (event.target instanceof MdOutlinedSelect) onValueChange(event.target.value);
    },
  });
  return (
    <md-outlined-select ref={selectRef} value={value} disabled={disabled} className={className} {...rest}>
      {choices.map((choice: SelectChoice) => (
        <md-select-option key={choice.value} value={choice.value} selected={choice.value === value}>
          <div slot="headline">{choice.label}</div>
        </md-select-option>
      ))}
    </md-outlined-select>
  );
}
