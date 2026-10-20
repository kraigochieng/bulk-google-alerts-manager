import type { JSX } from "react";

import { Button } from "src/panel/ui/button";

/** Render the first-run notice. The user must accept it before the tool shows. */
export function FirstRunScreen({ onAccept }: { onAccept: () => void }): JSX.Element {
  return (
    <main className="p-4 text-sm">
      <h1 className="text-lg font-semibold">Before you start</h1>
      <p className="mt-2 font-medium">Bulk Alerts Manager is an unofficial tool. It is not affiliated with Google.</p>
      <ul className="mt-3 list-disc space-y-2 pl-5">
        <li>The tool drives the Google Alerts page in your own logged-in browser tab.</li>
        <li>It works only for the Google account that is signed in to this browser profile.</li>
        <li>Google can change the page at any time. The tool can then stop working. It shows a clear error when this happens.</li>
        <li>Google can slow your requests or show a bot check on large batches. The tool stops and asks you to solve the check. It never bypasses a bot check.</li>
        <li>Google limits an account to 100 alerts.</li>
        <li>Deletion is permanent. The tool cannot undo it.</li>
        <li>All data stays in your browser. The tool reads and stores no password. It sends nothing to any server.</li>
      </ul>
      <Button className="mt-4" onClick={onAccept}>
        I understand and accept
      </Button>
    </main>
  );
}
