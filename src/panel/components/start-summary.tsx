import type { JSX } from "react";

import { ALERT_CAP_PER_ACCOUNT } from "src/core/alert-cap";
import { Banner } from "src/panel/components/banner";

/** Render the counts of a run, then the cautions as a list. Pure: the counts come as props. */
export function StartSummary({
  createCount,
  updateCount,
  skipCount,
  liveCount,
}: {
  createCount: number;
  updateCount: number;
  skipCount: number;
  liveCount: number;
}): JSX.Element {
  const counts: readonly (readonly [string, number])[] = [
    ["Create", createCount],
    ["Update", updateCount],
    ["Skip", skipCount],
  ];
  return (
    <>
      <dl aria-label="Rows of this run" className="mt-3 grid grid-cols-3 gap-2 text-center">
        {counts.map(([label, count]: readonly [string, number]) => (
          <div key={label} className="flex flex-col-reverse rounded-lg border bg-card p-3">
            <dt className="text-xs text-muted-foreground">{label}</dt>
            <dd className="text-2xl font-medium">{String(count)}</dd>
          </div>
        ))}
      </dl>
      <Banner tone="warning">
        <ul className="mt-1 list-disc space-y-1 pl-5">
          <li>Keep the Alerts tab open and in the foreground.</li>
          <li>Google can slow large batches or show a bot check. The run then stops and asks you to solve it.</li>
          <li>
            Google allows {String(ALERT_CAP_PER_ACCOUNT)} alerts for each account. You have {String(liveCount)}.
          </li>
        </ul>
      </Banner>
    </>
  );
}
