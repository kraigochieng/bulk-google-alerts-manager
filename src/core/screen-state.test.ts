import { describe, expect, it } from "vitest";

import { chooseScreen } from "src/core/screen-state";
import type { ScreenName } from "src/core/screen-state";

describe("chooseScreen", () => {
  it.each<[boolean, boolean, boolean, ScreenName]>([
    [false, false, false, "first_run"],
    [false, true, false, "first_run"],
    [false, true, true, "first_run"],
    [true, true, false, "no_alerts_tab"],
    [true, true, true, "main"],
    [true, false, false, "main"],
    [true, false, true, "main"],
  ])("accepted %s, tab missing %s, saved run %s gives %s", (risksAccepted, tabMissing, hasRun, expected) => {
    expect(chooseScreen({ risksAccepted, tabMissing, hasRun })).toBe(expected);
  });
});
