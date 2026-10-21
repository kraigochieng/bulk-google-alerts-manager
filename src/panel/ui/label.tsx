import type { JSX, ReactNode } from "react";
import clsx from "clsx";

/** Render a form label. */
export function Label({
  htmlFor,
  className,
  children,
}: {
  htmlFor?: string;
  className?: string;
  children: ReactNode;
}): JSX.Element {
  return (
    <label htmlFor={htmlFor} className={clsx("flex items-center gap-2 font-medium leading-none select-none", className)}>
      {children}
    </label>
  );
}
