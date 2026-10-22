import type {
  AlertOptionOverrides,
  AlertOptions,
  DeliverTo,
  HowMany,
  HowOften,
} from "src/shared/models";

export const DEFAULT_ALERT_OPTIONS: AlertOptions = {
  howOften: "as_it_happens",
  sources: "Automatic",
  language: "English",
  region: "Any Region",
  howMany: "all",
  deliverTo: "rss",
};

/** Combine the app defaults with the overrides of one row. RSS forces as-it-happens. */
export function resolveOptions({
  defaults,
  overrides,
}: {
  defaults: AlertOptions;
  overrides: AlertOptionOverrides;
}): AlertOptions {
  const merged: AlertOptions = { ...defaults, ...removeUndefined({ overrides }) };
  return merged.deliverTo === "rss" ? { ...merged, howOften: "as_it_happens" } : merged;
}

function removeUndefined({ overrides }: { overrides: AlertOptionOverrides }): AlertOptionOverrides {
  return Object.fromEntries(
    Object.entries(overrides).filter(([, value]: [string, unknown]) => value !== undefined),
  );
}

function simplify({ text }: { text: string }): string {
  return text.toLowerCase().replace(/[^a-z]/g, "");
}

/** Read a "deliver to" cell. Return null when the text is not valid. */
export function parseDeliverTo({ text }: { text: string }): DeliverTo | null {
  const simple: string = simplify({ text });
  if (simple === "rss" || simple === "rssfeed" || simple === "feed") return "rss";
  if (simple === "email" || simple === "mail") return "email";
  return null;
}

/** Read a "how many" cell. Return null when the text is not valid. */
export function parseHowMany({ text }: { text: string }): HowMany | null {
  const simple: string = simplify({ text });
  if (simple === "all" || simple === "allresults") return "all";
  if (simple === "best" || simple === "onlythebestresults") return "best";
  return null;
}

/** Read a "how often" cell. Return null when the text is not valid. */
export function parseHowOften({ text }: { text: string }): HowOften | null {
  const simple: string = simplify({ text });
  if (["asithappens", "immediately", "instant"].includes(simple)) return "as_it_happens";
  if (["daily", "atmostonceaday", "day", "oncedaily"].includes(simple)) return "daily";
  if (["weekly", "atmostonceaweek", "week", "onceweekly"].includes(simple)) return "weekly";
  return null;
}

/** The text of the six dropdowns of one alert, as the Alerts page shows them. */
export interface PageOptionTexts {
  readonly delivery: string;
  readonly frequency: string;
  readonly sources: string;
  readonly language: string;
  readonly region: string;
  readonly volume: string;
}

/** Turn the dropdown texts of an alert into its options. Return null when the frequency or the volume text is unknown. */
export function optionsFromPageTexts({ texts }: { texts: PageOptionTexts }): AlertOptions | null {
  const howOften: HowOften | null = parseHowOften({ text: texts.frequency });
  const howMany: HowMany | null = parseHowMany({ text: texts.volume });
  if (howOften === null || howMany === null) return null;
  return {
    howOften,
    howMany,
    deliverTo: parseDeliverTo({ text: texts.delivery }) ?? "email",
    sources: texts.sources.trim(),
    language: texts.language.trim(),
    region: texts.region.trim(),
  };
}
