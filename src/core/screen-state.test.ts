import { describe, expect, it } from "vitest";

import { chooseScreen } from "src/core/screen-state";
import type { ScreenName } from "src/core/screen-state";

describe("chooseScreen", () => {
  it.each<[boolean, ScreenName]>([
    [false, "first_run"],
    [true, "main"],
  ])("accepted %s gives %s", (risksAccepted, expected) => {
    expect(chooseScreen({ risksAccepted })).toBe(expected);
  });
});
