import type { ItemAction, RowStatus, RunItem, RunKind, RunSnapshot, RunStatus } from "src/shared/models";
import { parseAlertOptions } from "src/shared/messages";

const RUN_KINDS: readonly string[] = ["create", "delete"];
const RUN_STATUSES: readonly string[] = [
  "idle",
  "running",
  "paused",
  "awaiting_captcha",
  "completed",
  "cancelled",
];
const ROW_STATUSES: readonly string[] = ["pending", "created", "updated", "skipped", "failed", "deleted"];
const ITEM_ACTIONS: readonly string[] = ["create", "update", "delete"];

function asRecord({ value }: { value: unknown }): Record<string, unknown> | null {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : null;
}

/** Read one saved item. A run saved before updates existed has no action, so the run kind gives it. */
function parseItem({ value, kind }: { value: unknown; kind: RunKind }): RunItem | null {
  const record: Record<string, unknown> | null = asRecord({ value });
  if (record === null) return null;
  const { id, query, status, errorMessage } = record;
  if (
    typeof id !== "number" ||
    typeof query !== "string" ||
    typeof status !== "string" ||
    !ROW_STATUSES.includes(status) ||
    typeof errorMessage !== "string"
  ) {
    return null;
  }
  return {
    id,
    query,
    action:
      typeof record.action === "string" && ITEM_ACTIONS.includes(record.action)
        ? (record.action as ItemAction)
        : kind === "delete"
          ? "delete"
          : "create",
    status: status as RowStatus,
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
  const items: (RunItem | null)[] = (record.items as unknown[]).map((item: unknown) => parseItem({ value: item, kind: kind as RunKind }));
  if (items.some((item: RunItem | null) => item === null)) return null;
  return {
    kind: kind as RunKind,
    status: status as RunStatus,
    notice,
    items: items as RunItem[],
  };
}
