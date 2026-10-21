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

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "md-filled-button": DetailedHTMLProps<MaterialButtonAttributes, HTMLElement>;
      "md-filled-tonal-button": DetailedHTMLProps<MaterialButtonAttributes, HTMLElement>;
      "md-outlined-button": DetailedHTMLProps<MaterialButtonAttributes, HTMLElement>;
      "md-text-button": DetailedHTMLProps<MaterialButtonAttributes, HTMLElement>;
      "md-icon-button": DetailedHTMLProps<MaterialButtonAttributes, HTMLElement>;
      "md-linear-progress": DetailedHTMLProps<MaterialProgressAttributes, HTMLElement>;
    }
  }
}
