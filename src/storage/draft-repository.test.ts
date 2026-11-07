import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { buildAddDraft } from "src/core/add-draft";
import { clearDraft, loadDraft, saveDraft } from "src/storage/draft-repository";

const cells = { howOften: "", sources: "", language: "", region: "", howMany: "", deliverTo: "" };
const draft = buildAddDraft({
  fileName: "alerts.csv",
  step: "review",
  extraColumns: [],
  review: { rows: [{ sourceRowNumber: 2, query: "alpha", cells }], checkedRows: new Set([2]), actionOverrides: {} },
});

describe("draft repository", () => {
  let store: Record<string, unknown>;

  beforeEach(() => {
    store = {};
    vi.stubGlobal("chrome", {
      storage: {
        local: {
          get: (key: string): Promise<Record<string, unknown>> => Promise.resolve(key in store ? { [key]: store[key] } : {}),
          set: (values: Record<string, unknown>): Promise<void> => {
            Object.assign(store, JSON.parse(JSON.stringify(values)) as Record<string, unknown>);
            return Promise.resolve();
          },
          remove: (key: string): Promise<void> => {
            store = Object.fromEntries(Object.entries(store).filter(([storedKey]) => storedKey !== key));
            return Promise.resolve();
          },
        },
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("finds nothing when no draft is stored", async () => {
    expect(await loadDraft()).toEqual({ kind: "none" });
  });

  it("loads the draft that it saved", async () => {
    await saveDraft({ draft });
    expect(await loadDraft()).toEqual({ kind: "draft", draft });
  });

  it("removes a damaged value and reports it", async () => {
    store["bulkAlerts.addDraft"] = { version: 1, rows: "x" };
    expect(await loadDraft()).toEqual({ kind: "damaged" });
    expect(await loadDraft()).toEqual({ kind: "none" });
  });

  it("removes the draft", async () => {
    await saveDraft({ draft });
    await clearDraft();
    expect(await loadDraft()).toEqual({ kind: "none" });
  });
});
