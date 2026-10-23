export type FrameLayout = "passive" | "active";

/**
 * Choose how the app frame reacts to the pointer.
 * The frame covers the page. It passes clicks to the Google page, unless the app shows a dialog or an overlay.
 */
export function chooseFrameLayout({ interactive }: { interactive: boolean }): FrameLayout {
  return interactive ? "active" : "passive";
}
