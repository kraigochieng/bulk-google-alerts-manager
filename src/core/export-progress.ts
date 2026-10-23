import type { ExportEntry } from "src/core/export-csv";
import type { RunSummary } from "src/core/run-summary";

export type ExportStatus = "idle" | "running" | "finished" | "cancelled" | "stopped";

/** Decide whether the result dialog of an export shows: the export has ended in any way. */
export function exportIsEnded({ status }: { status: ExportStatus }): boolean {
  return status === "finished" || status === "cancelled" || status === "stopped";
}

/** Build the title and the lines of the dialog that tells the user how an export ended. */
export function buildExportSummary({
  status,
  entries,
  total,
  notice,
}: {
  status: ExportStatus;
  entries: readonly ExportEntry[];
  total: number;
  notice: string;
}): RunSummary {
  const unreadCount: number = entries.filter((entry: ExportEntry) => entry.options === null).length;
  const lines: string[] = [`Alerts read: ${String(entries.length)} of ${String(total)}`];
  if (unreadCount > 0) lines.push(`Without options: ${String(unreadCount)}`);
  if (status === "finished") lines.push("Use Copy or Download to keep the CSV.");
  const titles: Record<ExportStatus, string> = {
    idle: "Export",
    running: "Export",
    finished: "The export is complete",
    cancelled: "The export was cancelled",
    stopped: "The export stopped",
  };
  return {
    title: titles[status],
    lines,
    details: notice === "" ? [] : [notice],
    hasFailures: unreadCount > 0,
  };
}
