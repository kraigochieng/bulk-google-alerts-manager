import type { DetailedHTMLProps, HTMLAttributes } from "react";

interface MaterialButtonAttributes extends HTMLAttributes<HTMLElement> {
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
}

interface MaterialProgressAttributes extends HTMLAttributes<HTMLElement> {
  value?: number;
  max?: number;
  indeterminate?: boolean;
}

interface MaterialTextFieldAttributes extends HTMLAttributes<HTMLElement> {
  value?: string;
  type?: "text" | "search";
  disabled?: boolean;
  placeholder?: string;
  label?: string;
}

interface MaterialSelectAttributes extends HTMLAttributes<HTMLElement> {
  value?: string;
  disabled?: boolean;
}

interface MaterialSelectOptionAttributes extends HTMLAttributes<HTMLElement> {
  value?: string;
  selected?: boolean;
}

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "md-filled-button": DetailedHTMLProps<MaterialButtonAttributes, HTMLElement>;
      "md-filled-tonal-button": DetailedHTMLProps<MaterialButtonAttributes, HTMLElement>;
      "md-outlined-button": DetailedHTMLProps<MaterialButtonAttributes, HTMLElement>;
      "md-text-button": DetailedHTMLProps<MaterialButtonAttributes, HTMLElement>;
      "md-icon-button": DetailedHTMLProps<MaterialButtonAttributes, HTMLElement>;
      "md-outlined-text-field": DetailedHTMLProps<MaterialTextFieldAttributes, HTMLElement>;
      "md-outlined-select": DetailedHTMLProps<MaterialSelectAttributes, HTMLElement>;
      "md-select-option": DetailedHTMLProps<MaterialSelectOptionAttributes, HTMLElement>;
      "md-linear-progress": DetailedHTMLProps<MaterialProgressAttributes, HTMLElement>;
    }
  }
}
