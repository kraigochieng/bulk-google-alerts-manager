import { afterEach, describe, expect, it } from "vitest";
import { cdp } from "vitest/browser";

import "src/panel/styles.css";

type Scheme = "light" | "dark";

/** The pairs of a text token and the token of the surface behind it. */
const TEXT_PAIRS: readonly (readonly [string, string])[] = [
  ["foreground", "background"],
  ["foreground", "card"],
  ["muted-foreground", "background"],
  ["muted-foreground", "card"],
  ["primary", "card"],
  ["primary", "background"],
  ["on-primary", "primary"],
  ["on-secondary", "secondary"],
  ["destructive", "card"],
  ["on-destructive", "destructive"],
  ["inverse-foreground", "inverse-surface"],
  ["info", "info-surface"],
  ["warning", "warning-surface"],
  ["error", "error-surface"],
];

/** The smallest contrast ratio of normal text in WCAG 2 level AA. */
const MINIMUM_CONTRAST: number = 4.5;

async function emulate({ scheme }: { scheme: Scheme }): Promise<void> {
  await cdp().send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-color-scheme", value: scheme }] });
}

function token({ name }: { name: string }): string {
  return getComputedStyle(document.documentElement).getPropertyValue(`--${name}`).trim();
}

/** Compute the relative luminance of a color in the form #rrggbb. */
function luminance({ color }: { color: string }): number {
  const [red = 0, green = 0, blue = 0] = [1, 3, 5].map((start: number) => {
    const channel: number = Number.parseInt(color.slice(start, start + 2), 16) / 255;
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function contrast({ text, surface }: { text: string; surface: string }): number {
  const [darker = 0, lighter = 0] = [luminance({ color: text }), luminance({ color: surface })].sort((left, right) => left - right);
  return (lighter + 0.05) / (darker + 0.05);
}

afterEach(async () => {
  await cdp().send("Emulation.setEmulatedMedia", { features: [] });
});

describe("theme", () => {
  it.each([
    ["light", "#f1f3f4"],
    ["dark", "#202124"],
  ] as const)("follows the %s theme of the system", async (scheme: Scheme, background: string) => {
    await emulate({ scheme });
    expect(token({ name: "background" })).toBe(background);
  });

  it.each(["light", "dark"] as const)("keeps the text readable in the %s theme", async (scheme: Scheme) => {
    await emulate({ scheme });
    const unreadable: string[] = TEXT_PAIRS.map(([text, surface]) => ({
      pair: `${text} on ${surface}`,
      ratio: contrast({ text: token({ name: text }), surface: token({ name: surface }) }),
    }))
      .filter(({ ratio }) => ratio < MINIMUM_CONTRAST)
      .map(({ pair, ratio }) => `${pair}: ${ratio.toFixed(2)}`);
    expect(unreadable).toEqual([]);
  });
});
