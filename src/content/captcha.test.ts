import { describe, expect, it } from "vitest";

import { looksLikeBotCheck } from "src/content/captcha";

describe("looksLikeBotCheck", () => {
  it("detects the sorry page by URL", () => {
    expect(looksLikeBotCheck({ pageUrl: "https://www.google.com/sorry/index?x=1", pageText: "" })).toBe(true);
  });

  it("detects unusual traffic text", () => {
    expect(
      looksLikeBotCheck({
        pageUrl: "https://www.google.com/alerts",
        pageText: "Our systems have detected unusual traffic",
      }),
    ).toBe(true);
  });

  it("does not flag a normal alerts page", () => {
    expect(
      looksLikeBotCheck({ pageUrl: "https://www.google.com/alerts", pageText: "My alerts (1)" }),
    ).toBe(false);
  });
});
