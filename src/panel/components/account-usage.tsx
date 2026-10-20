import { RefreshCw } from "lucide-react";
import type { JSX } from "react";

import { Button } from "src/panel/ui/button";
import { Progress } from "src/panel/ui/progress";

/** Render how many alerts the account has, against the account limit. Pure: data comes as props. */
export function AccountUsage({
  count,
  cap,
  error,
  refreshing,
  onRefresh,
}: {
  count: number | null;
  cap: number;
  error: string;
  refreshing: boolean;
  onRefresh: () => void;
}): JSX.Element {
  const nearLimit: boolean = count !== null && count >= cap * 0.9;
  return (
    <section aria-label="Alerts in your account" className="mt-2 rounded-md border p-2">
      <div className="flex items-center justify-between gap-2 text-xs">
        <span role="status">
          {count === null ? (refreshing ? "Reading your alerts…" : "Alert count not read yet.") : (
            <>
              <strong>{String(count)}</strong> of {String(cap)} alerts in your account
            </>
          )}
          {nearLimit && <strong className="ml-1 text-amber-800">Near the limit.</strong>}
        </span>
        <Button type="button" variant="ghost" size="icon" aria-label="Read my alerts again" className="size-6" disabled={refreshing} onClick={onRefresh}>
          <RefreshCw className={`size-3 ${refreshing ? "animate-spin" : ""}`} />
        </Button>
      </div>
      <Progress value={count === null ? 0 : Math.min((count / cap) * 100, 100)} className="mt-1 h-1.5" aria-label="Alerts used" />
      {error !== "" && <p className="mt-1 text-xs text-red-700">{error}</p>}
    </section>
  );
}
