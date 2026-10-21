import { describe, expect, it } from "vitest";

import { checkCreateGate, checkDeleteGate } from "src/core/start-gates";

describe("checkCreateGate", () => {
  const ok = { liveCount: 10, createCount: 5, cap: 1000, risksAccepted: true };

  it("allows a valid run", () => {
    expect(checkCreateGate(ok)).toEqual({ allowed: true });
  });

  it("refuses an empty run", () => {
    expect(checkCreateGate({ ...ok, createCount: 0 })).toMatchObject({ allowed: false });
  });

  it("refuses a run over the cap and names the overflow", () => {
    const result = checkCreateGate({ ...ok, liveCount: 998, createCount: 5 });
    expect(result).toMatchObject({ allowed: false });
    expect(!result.allowed && result.reason).toContain("3 too many");
  });

  it("refuses a run when the notice is not accepted", () => {
    expect(checkCreateGate({ ...ok, risksAccepted: false })).toMatchObject({ allowed: false });
  });
});

describe("checkDeleteGate", () => {
  it("allows a run with selected alerts", () => {
    expect(checkDeleteGate({ selectedCount: 3 })).toEqual({ allowed: true });
  });

  it("refuses a run with no selected alerts", () => {
    const result = checkDeleteGate({ selectedCount: 0 });
    expect(result.allowed).toBe(false);
    expect(!result.allowed && result.reason).toContain("Select at least one");
  });
});
