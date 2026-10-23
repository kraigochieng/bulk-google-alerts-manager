import { useId, useRef } from "react";
import type { JSX } from "react";
import { MdRadio } from "@material/web/radio/radio.js";

import "src/panel/material-elements";
import { useElementEvent } from "src/panel/ui/use-element-event";

/** One choice of a radio group: the stored value and the text the user sees. */
export interface RadioChoice {
  readonly value: string;
  readonly label: string;
}

/** Render a group of Material Web radio buttons. It shows all choices at once and reports the chosen value. */
export function RadioGroup({
  legend,
  value,
  onValueChange,
  choices,
  disabled = false,
  hideLegend = false,
}: {
  legend: string;
  value: string;
  onValueChange: (value: string) => void;
  choices: readonly RadioChoice[];
  disabled?: boolean;
  hideLegend?: boolean;
}): JSX.Element {
  const groupName: string = useId();
  const groupRef = useRef<HTMLFieldSetElement | null>(null);
  useElementEvent({
    elementRef: groupRef,
    eventName: "change",
    handler: (event: Event) => {
      if (event.target instanceof MdRadio && event.target.checked) onValueChange(event.target.value);
    },
  });
  return (
    <fieldset ref={groupRef} disabled={disabled} className="min-w-0">
      <legend className={hideLegend ? "sr-only" : "text-xs font-medium"}>{legend}</legend>
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {choices.map((choice: RadioChoice) => (
          <label key={choice.value} className="flex cursor-pointer items-center gap-1 text-xs">
            <md-radio name={groupName} value={choice.value} checked={choice.value === value} disabled={disabled} />
            {choice.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
