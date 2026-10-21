import { RefreshCw } from "lucide-react";
import type { JSX } from "react";

import { Button } from "src/panel/ui/button";
import { Progress } from "src/panel/ui/progress";
import type { ProgressTone } from "src/panel/ui/progress";

/** Choose the color of the usage bar: blue, then amber near the limit, then red at the limit. Pure. */
function toneFor({ count, cap }: { count: number | null; cap: number }): ProgressTone {
  if (count === null) return "default";
  if (count >= cap) return "error";
  return count >= cap * 0.9 ? "warning" : "default";
}

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
    <section aria-label="Alerts in your account" className="mt-4 rounded-2xl border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <div role="status" className="min-w-0">
          <p className="text-xs font-medium text-muted-foreground">Alerts in your account</p>
          {count === null ? (
            <p className="mt-0.5 text-sm text-muted-foreground">{refreshing ? "Reading your alerts…" : "Not read yet"}</p>
          ) : (
            <p className="mt-0.5 flex items-baseline gap-1">
              <span className="text-3xl font-medium leading-none text-foreground">{String(count)}</span>
              <span className="text-sm text-muted-foreground">of {String(cap)}</span>
            </p>
          )}
        </div>
        <Button type="button" variant="ghost" size="icon" aria-label="Read my alerts again" className="size-10" disabled={refreshing} onClick={onRefresh}>
          <RefreshCw className={`size-4 ${refreshing ? "animate-spin" : ""}`} />
        </Button>
      </div>
      <Progress
        value={count === null ? 0 : Math.min((count / cap) * 100, 100)}
        tone={toneFor({ count, cap })}
        className="mt-3 w-full"
        aria-label="Alerts used"
      />
      {nearLimit && (
        <p className="mt-2 text-xs font-medium text-amber-800">
          {count !== null && count >= cap ? "You reached the limit." : "Near the limit."}
        </p>
      )}
      {error !== "" && <p className="mt-2 text-xs text-destructive">{error}</p>}
    </section>
  );
}
