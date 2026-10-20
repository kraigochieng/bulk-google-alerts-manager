import type { JSX, ReactNode } from "react";

export type BannerTone = "info" | "warning" | "error";

const TONE_CLASSES: Record<BannerTone, string> = {
  info: "border-blue-300 bg-blue-50 text-blue-900",
  warning: "border-amber-400 bg-amber-50 text-amber-900",
  error: "border-red-400 bg-red-50 text-red-900",
};

/** Render a notice box. The label states the level in text, not only in color. */
export function Banner({ tone, children }: { tone: BannerTone; children: ReactNode }): JSX.Element {
  const label: string = tone === "error" ? "Error" : tone === "warning" ? "Warning" : "Note";
  return (
    <div role={tone === "info" ? "status" : "alert"} className={`mt-2 rounded border p-2 text-xs ${TONE_CLASSES[tone]}`}>
      <strong>{label}: </strong>
      {children}
    </div>
  );
}
