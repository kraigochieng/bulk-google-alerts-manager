import type { JSX, ReactNode } from "react";

import { Alert, AlertDescription } from "src/panel/ui/alert";

export type BannerTone = "info" | "warning" | "error";

const TONE_CLASSES: Record<BannerTone, string> = {
  info: "border-[#aecbfa] bg-[#e8f0fe] text-[#174ea6]",
  warning: "border-[#fdd663] bg-[#fef7e0] text-[#7a4f01]",
  error: "border-[#f6aea9] bg-[#fce8e6] text-[#a50e0e]",
};

/** Render a notice box. The label states the level in text, not only in color. */
export function Banner({ tone, children }: { tone: BannerTone; children: ReactNode }): JSX.Element {
  const label: string = tone === "error" ? "Error" : tone === "warning" ? "Warning" : "Note";
  return (
    <Alert role={tone === "info" ? "status" : "alert"} className={`mt-2 p-2 text-xs ${TONE_CLASSES[tone]}`}>
      <AlertDescription className="block text-inherit">
        <strong>{label}: </strong>
        {children}
      </AlertDescription>
    </Alert>
  );
}
