export type FrameLayout = "hidden" | "drawer" | "full";

/**
 * Choose how the app frame shows on the page.
 * Busy work needs the full page for its overlay, even when the user closed the drawer.
 */
export function chooseFrameLayout({ open, busy }: { open: boolean; busy: boolean }): FrameLayout {
  if (busy) return "full";
  return open ? "drawer" : "hidden";
}
