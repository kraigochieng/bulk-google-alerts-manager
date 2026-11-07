import type { GateResult } from "src/core/start-gates";

/** Decide whether a file with this number of data rows may be imported. Pure. */
export function checkFileRows({ rowCount, limit }: { rowCount: number; limit: number }): GateResult {
  if (rowCount === 0) {
    return { allowed: false, reason: "The file has no data rows." };
  }
  if (rowCount > limit) {
    const excessCount: number = rowCount - limit;
    return {
      allowed: false,
      reason: `The file has ${String(rowCount)} data rows. The limit is ${String(limit)}. Remove ${String(excessCount)} ${excessCount === 1 ? "row" : "rows"}.`,
    };
  }
  return { allowed: true };
}
