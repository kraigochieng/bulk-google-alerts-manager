export type ScreenName = "first_run" | "main";

/** Choose the screen of the app. The first-run notice comes first. */
export function chooseScreen({ risksAccepted }: { risksAccepted: boolean }): ScreenName {
  return risksAccepted ? "main" : "first_run";
}
