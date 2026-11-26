import type { JSX, MouseEvent } from "react";

import "src/panel/material-elements";

/** One filter chip: the stored value and the text the user sees. */
export interface FilterChoice {
  readonly value: string;
  readonly label: string;
}

/** Render a row of Material Web filter chips. One chip is selected. A click reports its value. */
export function FilterChips({
  legend,
  value,
  onValueChange,
  choices,
}: {
  legend: string;
  value: string;
  onValueChange: (value: string) => void;
  choices: readonly FilterChoice[];
}): JSX.Element {
  return (
    <md-chip-set aria-label={legend}>
      {choices.map((choice: FilterChoice) => (
        <md-filter-chip
          key={choice.value}
          label={choice.label}
          selected={choice.value === value}
          onClick={(event: MouseEvent<HTMLElement>) => {
            // The chip must not toggle itself, because one chip stays selected.
            event.preventDefault();
            onValueChange(choice.value);
          }}
        />
      ))}
    </md-chip-set>
  );
}
