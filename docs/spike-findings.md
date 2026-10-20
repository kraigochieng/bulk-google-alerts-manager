# Page driver spike findings

Date: 2026-10-20. Page: `https://www.google.com/alerts`, signed-in account, desktop Chrome.

## Result

Synthetic events work. The earlier note that only real clicks worked did not hold in this test.
The Closure dropdowns open and select with this full sequence on the element:
`pointerover, mouseover, pointermove, mousemove, pointerdown, mousedown (after focus), pointerup, mouseup, click`.
See `src/content/synthetic-click.ts`.

## Tested through the page driver (injected bundle, not the loaded extension)

- Created 5 alerts: RSS + all results, email + weekly + best, RSS + best, RSS + French + all, email + daily + all.
- Opened each alert in edit mode and read the six dropdowns back. All values matched the request.
- RSS forces "As-it-happens". The frequency dropdown is disabled for RSS.
- Email alerts have no feed link. RSS alerts have `a[href*="alerts/feeds"]`.
- Deleted all 5 alerts with the delete button. The list shows an "Undo" notice, and the row disappears.
- Query box was read back and verified before each Create click.

## Page facts

| Item | Selector or fact |
|---|---|
| Create form root | `#create-alert-div` |
| Query box | `#create-alert-div .query_div input` |
| Create button | `#create_alert` |
| Options toggle | `#create-alert-div .show_options` |
| Dropdowns | `.frequency_select`, `.source_select`, `.language_select`, `.region_select`, `.volume_select`, `.delivery_select .goog-flat-menu-button` |
| Menu items | `.goog-menu .goog-menuitem` (visible only while a menu is open) |
| Alert row | `li.alert_instance`, query in `.query_div span`, delete in `.delete_button` |
| Frequency menu text | As-it-happens, At most once a day, At most once a week |
| Volume menu text | Only the best results, All results |
| Delivery menu | Account email address (first item), RSS feed |

A new row appears with empty text for a short time after Create. The list reader skips rows without query text.

## Not tested

- "Show all alerts" with more than 10 alerts (`.show_all_alerts`).
- The maximum query length.
- The alert cap of 100 and the page behavior at the cap.
- A real CAPTCHA or throttle page.
- The loaded extension itself in Chrome (content script, side panel).
