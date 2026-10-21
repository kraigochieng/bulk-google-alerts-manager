import type { JSX, MouseEvent, ReactNode } from "react";
import clsx from "clsx";

import "src/panel/material-elements";

export type ButtonVariant = "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
export type ButtonSize = "default" | "sm" | "icon";

/** Render a Material Web button. The variant picks the Material button type. A full width button fills the line. */
export function Button({
  variant = "default",
  size = "default",
  fullWidth = false,
  type = "button",
  disabled = false,
  className,
  onClick,
  children,
  ...rest
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  className?: string;
  onClick?: (event: MouseEvent<HTMLElement>) => void;
  children?: ReactNode;
  "aria-label"?: string;
}): JSX.Element {
  const handleClick = (event: MouseEvent<HTMLElement>): void => {
    if (!disabled) onClick?.(event);
  };
  const shared = { type, disabled, onClick: handleClick, "data-size": size, "data-variant": variant, ...rest };
  const classes: string = clsx("app-button", fullWidth && "app-button-block", className);
  if (size === "icon") {
    return <md-icon-button {...shared} className={classes}>{children}</md-icon-button>;
  }
  if (variant === "outline") return <md-outlined-button {...shared} className={classes}>{children}</md-outlined-button>;
  if (variant === "ghost" || variant === "link") return <md-text-button {...shared} className={classes}>{children}</md-text-button>;
  if (variant === "secondary") return <md-filled-tonal-button {...shared} className={classes}>{children}</md-filled-tonal-button>;
  return <md-filled-button {...shared} className={classes}>{children}</md-filled-button>;
}
