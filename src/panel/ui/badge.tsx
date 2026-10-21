import type { JSX, ReactNode } from "react";
import clsx from "clsx";

export type BadgeVariant = "default" | "secondary" | "destructive";

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  default: "bg-primary text-primary-foreground",
  secondary: "bg-secondary text-secondary-foreground",
  destructive: "bg-destructive text-white",
};

/** Render a small status label. */
export function Badge({ variant = "default", children }: { variant?: BadgeVariant; children: ReactNode }): JSX.Element {
  return (
    <span className={clsx("inline-flex w-fit items-center rounded-full px-2 py-0.5 text-xs font-medium", VARIANT_CLASSES[variant])}>
      {children}
    </span>
  );
}
