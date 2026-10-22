import { describe, expect, it } from "vitest";

import { chooseFrameLayout } from "src/core/frame-layout";
import type { FrameLayout } from "src/core/frame-layout";

describe("chooseFrameLayout", () => {
  it.each<[boolean, boolean, FrameLayout]>([
    [false, false, "hidden"],
    [true, false, "drawer"],
    [false, true, "full"],
    [true, true, "full"],
  ])("open %s, busy %s gives %s", (open, busy, expected) => {
    expect(chooseFrameLayout({ open, busy })).toBe(expected);
  });
});
