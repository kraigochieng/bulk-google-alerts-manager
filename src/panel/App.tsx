import type { JSX } from "react";

/** Render the empty side panel shell with the unofficial-tool notice. */
export function App(): JSX.Element {
  return (
    <main className="p-4 text-sm">
      <h1 className="text-lg font-semibold">Bulk Alerts Manager</h1>
      <p className="mt-2 text-gray-600">
        Unofficial tool. Not affiliated with Google.
      </p>
    </main>
  );
}
