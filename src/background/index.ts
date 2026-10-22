const ALERTS_URL: string = "https://www.google.com/alerts";
const TOGGLE_MESSAGE: { readonly kind: "toggle_app" } = { kind: "toggle_app" };

/** Open or close the app in the tab. On any other page, open the Alerts page. Side effect: messages or opens a tab. */
chrome.action.onClicked.addListener((tab: chrome.tabs.Tab): void => {
  if (tab.id === undefined || !(tab.url ?? "").startsWith(ALERTS_URL)) {
    void chrome.tabs.create({ url: ALERTS_URL });
    return;
  }
  chrome.tabs.sendMessage(tab.id, TOGGLE_MESSAGE).catch(() => {
    if (tab.id !== undefined) void chrome.tabs.reload(tab.id);
  });
});
