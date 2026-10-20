import type { RowStatus, RunItem, RunKind, RunSnapshot, RunStatus } from "src/shared/models";
import { parseAlertOptions } from "src/shared/messages";

const RUN_KINDS: readonly string[] = ["create", "delete"];
const RUN_STATUSES: readonly string[] = [
  "idle",
  "ready",
  "running",
  "paused",
  "awaiting_captcha",
  "completed",
  "cancelled",
];
const ROW_STATUSES: readonly string[] = ["pending", "created", "skipped", "failed", "deleted"];

function asRecord({ value }: { value: unknown }): Record<string, unknown> | null {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : null;
}

function parseItem({ value }: { value: unknown }): RunItem | null {
  const record: Record<string, unknown> | null = asRecord({ value });
  if (record === null) return null;
  const { id, query, label, status, rssLink, errorMessage } = record;
  if (
    typeof id !== "number" ||
    typeof query !== "string" ||
    typeof label !== "string" ||
    typeof status !== "string" ||
    !ROW_STATUSES.includes(status) ||
    typeof rssLink !== "string" ||
    typeof errorMessage !== "string"
  ) {
    return null;
  }
  return {
    id,
    query,
    label,
    status: status as RowStatus,
    rssLink,
    errorMessage,
    options: record.options === null ? null : parseAlertOptions({ value: record.options }),
  };
}

/** Read a saved run from storage. Return null when the saved data is not a valid run. */
export function parseRunSnapshot({ value }: { value: unknown }): RunSnapshot | null {
  const record: Record<string, unknown> | null = asRecord({ value });
  if (record === null || !Array.isArray(record.items)) return null;
  const { kind, status, notice } = record;
  if (
    typeof kind !== "string" ||
    !RUN_KINDS.includes(kind) ||
    typeof status !== "string" ||
    !RUN_STATUSES.includes(status) ||
    typeof notice !== "string"
  ) {
    return null;
  }
  const items: (RunItem | null)[] = (record.items as unknown[]).map((item: unknown) => parseItem({ value: item }));
  if (items.some((item: RunItem | null) => item === null)) return null;
  return {
    kind: kind as RunKind,
    status: status as RunStatus,
    notice,
    items: items as RunItem[],
  };
}
