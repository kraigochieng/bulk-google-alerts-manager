import { describe, expect, it } from "vitest";

import { checkCreateGate, checkDeleteGate, deleteConfirmationText } from "src/core/start-gates";

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
  const ok = { selectedCount: 3, backupExported: true, typedText: "DELETE 3" };

  it("builds the confirmation text", () => {
    expect(deleteConfirmationText({ count: 3 })).toBe("DELETE 3");
  });

  it("allows a confirmed run with a backup", () => {
    expect(checkDeleteGate(ok)).toEqual({ allowed: true });
  });

  it.each([
    [{ ...ok, selectedCount: 0 }, "Select at least one"],
    [{ ...ok, backupExported: false }, "Export the backup"],
    [{ ...ok, typedText: "delete 3" }, "Type DELETE 3"],
    [{ ...ok, typedText: "DELETE 2" }, "Type DELETE 3"],
  ])("refuses %j", (input, reasonPart: string) => {
    const result = checkDeleteGate(input);
    expect(result.allowed).toBe(false);
    expect(!result.allowed && result.reason).toContain(reasonPart);
  });
});
