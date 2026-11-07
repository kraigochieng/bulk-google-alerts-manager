import { parseAddDraft } from "src/core/add-draft";
import type { AddDraft } from "src/core/add-draft";

const DRAFT_KEY: string = "bulkAlerts.addDraft";

/** What a read of the stored draft finds: nothing, a valid draft, or a damaged value that the read removed. */
export type DraftLoadResult =
  | { readonly kind: "none" }
  | { readonly kind: "draft"; readonly draft: AddDraft }
  | { readonly kind: "damaged" };

/** Read the stored draft. A damaged value is removed. Side effect: reads and may write storage. */
export async function loadDraft(): Promise<DraftLoadResult> {
  const stored: Record<string, unknown> = await chrome.storage.local.get(DRAFT_KEY);
  if (stored[DRAFT_KEY] === undefined) return { kind: "none" };
  const draft: AddDraft | null = parseAddDraft({ value: stored[DRAFT_KEY] });
  if (draft !== null) return { kind: "draft", draft };
  await chrome.storage.local.remove(DRAFT_KEY);
  return { kind: "damaged" };
}

/** Save the draft. It replaces the older draft. Side effect: writes storage. */
export async function saveDraft({ draft }: { draft: AddDraft }): Promise<void> {
  await chrome.storage.local.set({ [DRAFT_KEY]: draft });
}

/** Remove the stored draft. Side effect: writes storage. */
export async function clearDraft(): Promise<void> {
  await chrome.storage.local.remove(DRAFT_KEY);
}
