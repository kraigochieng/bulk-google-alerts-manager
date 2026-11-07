import { X } from "lucide-react";
import { useState } from "react";
import type { JSX } from "react";

import { Button } from "src/panel/ui/button";
import { Label } from "src/panel/ui/label";
import { Select } from "src/panel/ui/select";
import type { SelectChoice } from "src/panel/ui/select";
import { TextField } from "src/panel/ui/text-field";

const TYPED_VALUE_CHOICE: string = "__typed_value__";
const BLANK_CHOICE: string = "__blank__";

/**
 * Render a dropdown of listed values. The user can also type a value that is not listed.
 * With a blank label, the dropdown also offers an empty value, and the label names what an empty value means.
 */
export function ListedOption({
  label,
  value,
  options,
  disabled,
  onChange,
  blankLabel,
}: {
  label: string;
  value: string;
  options: readonly string[];
  disabled: boolean;
  onChange: (value: string) => void;
  blankLabel?: string;
}): JSX.Element {
  const [typing, setTyping] = useState<boolean>(false);
  const allowsBlank: boolean = blankLabel !== undefined;
  const isBlank: boolean = allowsBlank && value === "";
  const showTypedValue: boolean = typing || (!options.includes(value) && !isBlank);
  const choices: SelectChoice[] = [
    ...(blankLabel === undefined ? [] : [{ value: BLANK_CHOICE, label: blankLabel }]),
    ...options.map((option: string) => ({ value: option, label: option })),
    { value: TYPED_VALUE_CHOICE, label: "Other (type a value)" },
  ];
  const handleSelect = (chosen: string): void => {
    if (chosen === TYPED_VALUE_CHOICE) {
      setTyping(true);
      return;
    }
    setTyping(false);
    onChange(chosen === BLANK_CHOICE ? "" : chosen);
  };
  return (
    <div className="min-w-0 space-y-1">
      <Label className="text-xs">{label}</Label>
      <Select
        aria-label={label}
        value={showTypedValue ? TYPED_VALUE_CHOICE : isBlank ? BLANK_CHOICE : value}
        choices={choices}
        disabled={disabled}
        onValueChange={handleSelect}
        className="w-full"
      />
      {showTypedValue && (
        <div className="relative">
          <TextField
            aria-label={`${label} typed value`}
            value={value}
            disabled={disabled}
            onValueChange={onChange}
            className="w-full"
          />
          {value !== "" && !disabled && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={`Clear ${label}`}
              onClick={() => { onChange(""); }}
              className="absolute right-0 top-0 size-8"
            >
              <X className="size-3" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
