import type { JSX, ReactNode } from "react";

export type BannerTone = "info" | "warning" | "error";

const TONE_CLASSES: Record<BannerTone, string> = {
  info: "border-info-border bg-info-surface text-info",
  warning: "border-warning-border bg-warning-surface text-warning",
  error: "border-error-border bg-error-surface text-error",
};

/** Render a notice box. The label states the level in text, not only in color. */
export function Banner({ tone, children }: { tone: BannerTone; children: ReactNode }): JSX.Element {
  const label: string = tone === "error" ? "Error" : tone === "warning" ? "Warning" : "Note";
  return (
    <div role={tone === "info" ? "status" : "alert"} className={`mt-2 rounded-lg border p-2 text-xs ${TONE_CLASSES[tone]}`}>
      <strong>{label}: </strong>
      {children}
    </div>
  );
}
