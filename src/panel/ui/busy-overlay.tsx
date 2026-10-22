import type { JSX, ReactNode } from "react";

import { Progress } from "src/panel/ui/progress";

/**
 * Cover the app with a foggy layer while work runs. A progress bar runs at the top edge.
 * A card in the middle holds the title and the controls. The page below stays visible but out of reach.
 */
export function BusyOverlay({
  title,
  progress,
  children,
}: {
  title: string;
  progress: number | null;
  children: ReactNode;
}): JSX.Element {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-50 flex items-center justify-center bg-white/55 p-4 backdrop-blur-md"
    >
      <Progress
        value={progress ?? 0}
        indeterminate={progress === null}
        className="fixed inset-x-0 top-0 block w-full"
        aria-label={title}
      />
      <div className="w-full max-w-sm rounded-2xl border bg-card p-5 shadow-lg">
        <h2 className="text-base font-medium">{title}</h2>
        {children}
      </div>
    </div>
  );
}
