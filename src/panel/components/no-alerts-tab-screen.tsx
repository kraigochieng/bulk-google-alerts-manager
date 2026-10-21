import type { JSX } from "react";

import { ALERTS_URL } from "src/panel/chrome-bridge";
import { Button } from "src/panel/ui/button";

/** Draw a bell with a slash across it, for the page that has no Alerts tab. Pure. */
function MissingBellIllustration(): JSX.Element {
  return (
    <svg viewBox="0 0 160 160" role="img" aria-label="A bell with a slash across it" className="mx-auto size-36">
      <circle cx="80" cy="80" r="72" fill="#e8f0fe" />
      <path
        d="M80 38c-17 0-30 13-30 30v22c0 6-3 11-8 15-2 2-1 6 3 6h70c4 0 5-4 3-6-5-4-8-9-8-15V68c0-17-13-30-30-30Z"
        fill="#1a73e8"
      />
      <path d="M70 116a10 10 0 0 0 20 0Z" fill="#1a73e8" />
      <circle cx="80" cy="34" r="5" fill="#1a73e8" />
      <path d="M44 124 116 40" stroke="#ffffff" strokeWidth="14" strokeLinecap="round" />
      <path d="M44 124 116 40" stroke="#d93025" strokeWidth="7" strokeLinecap="round" />
    </svg>
  );
}

/** Render the page for a panel that has no Google Alerts tab. It offers a button that opens the page. Pure: the action comes as a prop. */
export function NoAlertsTabScreen({ onOpen }: { onOpen: () => void }): JSX.Element {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <MissingBellIllustration />
      <div>
        <p className="text-xs font-medium tracking-widest text-muted-foreground">NO ALERTS PAGE</p>
        <h1 className="mt-1 text-xl font-medium">There is no Google Alerts page to work with</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Bulk Google Alerts Manager works inside a Google Alerts tab. Open that page and this panel connects to it by itself.
        </p>
      </div>
      <Button onClick={onOpen}>Open Google Alerts</Button>
      <p className="text-xs text-muted-foreground">{ALERTS_URL.replace("https://", "")}</p>
    </main>
  );
}
