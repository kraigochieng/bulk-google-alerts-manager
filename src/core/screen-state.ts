export type ScreenName = "first_run" | "no_alerts_tab" | "main";

/**
 * Choose the screen of the panel.
 * The first-run notice comes first. A missing Alerts tab shows its own screen, unless a saved run needs the main view.
 */
export function chooseScreen({
  risksAccepted,
  tabMissing,
  hasRun,
}: {
  risksAccepted: boolean;
  tabMissing: boolean;
  hasRun: boolean;
}): ScreenName {
  if (!risksAccepted) return "first_run";
  if (tabMissing && !hasRun) return "no_alerts_tab";
  return "main";
}
