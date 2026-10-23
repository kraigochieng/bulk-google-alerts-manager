import { describe, expect, it } from "vitest";

import { chooseFrameLayout } from "src/core/frame-layout";
import type { FrameLayout } from "src/core/frame-layout";

describe("chooseFrameLayout", () => {
  it.each<[boolean, FrameLayout]>([
    [false, "passive"],
    [true, "active"],
  ])("interactive %s gives %s", (interactive, expected) => {
    expect(chooseFrameLayout({ interactive })).toBe(expected);
  });
});
