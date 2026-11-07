import { describe, expect, it } from "vitest";

import { isCheckedByDefault, isRowSelectable } from "src/core/row-rules";

describe("row rules", () => {
  it.each([
    [[], true, true],
    [["unlisted_option"], true, true],
    [["duplicate_in_file"], true, false],
    [["empty"], false, false],
    [["too_long"], false, false],
    [["invalid_option"], false, false],
  ] as const)("issues %j: selectable %j, checked by default %j", (issues, selectable, checked) => {
    expect(isRowSelectable({ row: { issues } })).toBe(selectable);
    expect(isCheckedByDefault({ row: { issues } })).toBe(checked);
  });
});
