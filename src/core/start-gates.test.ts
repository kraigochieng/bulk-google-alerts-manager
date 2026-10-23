import { describe, expect, it } from "vitest";

import { checkCreateGate, checkDeleteGate, checkExportGate } from "src/core/start-gates";

describe("checkCreateGate", () => {
  const ok = { liveCount: 10, createCount: 5, updateCount: 0, cap: 1000 };

  it("allows a valid run", () => {
    expect(checkCreateGate(ok)).toEqual({ allowed: true });
  });

  it("refuses an empty run", () => {
    expect(checkCreateGate({ ...ok, createCount: 0 })).toMatchObject({ allowed: false });
  });

  it("allows a run that only updates", () => {
    expect(checkCreateGate({ ...ok, createCount: 0, updateCount: 3 })).toEqual({ allowed: true });
  });

  it("does not count updates against the cap", () => {
    expect(checkCreateGate({ ...ok, liveCount: 1000, createCount: 0, updateCount: 3 })).toEqual({ allowed: true });
  });

  it("refuses a run over the cap and names the overflow", () => {
    const result = checkCreateGate({ ...ok, liveCount: 998, createCount: 5 });
    expect(result).toMatchObject({ allowed: false });
    expect(!result.allowed && result.reason).toContain("3 too many");
  });
});

describe("checkDeleteGate", () => {
  it("allows a run with selected alerts", () => {
    expect(checkDeleteGate({ selectedCount: 3 })).toEqual({ allowed: true });
  });

  it("refuses a run with no selected alerts", () => {
    const result = checkDeleteGate({ selectedCount: 0 });
    expect(result.allowed).toBe(false);
    expect(!result.allowed && result.reason).toContain("Check at least one");
  });
});

describe("checkExportGate", () => {
  it("allows an export with checked alerts", () => {
    expect(checkExportGate({ selectedCount: 2 })).toEqual({ allowed: true });
  });

  it("refuses an export with no checked alerts", () => {
    const result = checkExportGate({ selectedCount: 0 });
    expect(result.allowed).toBe(false);
    expect(!result.allowed && result.reason).toContain("Check at least one");
  });
});
