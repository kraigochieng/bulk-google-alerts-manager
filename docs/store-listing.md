# Chrome Web Store listing

## Name

Bulk Alerts Manager for Google Alerts

## Short description (132 characters or fewer)

Unofficial tool. Not affiliated with Google. Create and delete many alerts from CSV files.

## Single purpose

Manage Google Alerts in bulk: create alerts from a CSV file and delete alerts in bulk, on the Google Alerts page.

## Long description

Bulk Alerts Manager for Google Alerts is an unofficial tool. It is not affiliated with Google.

Google Alerts has no bulk tools. Creating or removing many alerts by hand takes minutes for each alert.
This extension does both from a CSV file, in your own logged-in browser tab.

Add
- Click Add in the bar at the bottom of the Alerts page. A dialog guides you in three steps: file, review, start.
- Import a CSV or xlsx file, or paste CSV text. The file uses the column names of the template. Download the xlsx template for dropdowns.
- Check the rows that you want.
- Set all alert options: RSS or email, how often, sources, language, region, how many.
- A row with the same query as an existing alert updates that alert. See warnings for alerts that look alike.
- The heading of the list shows how many alerts you have and how many you can still add.
- Pause, resume, and cancel of a run.
- A dialog shows the result when a run ends.

Export
- Check alerts on the page. Click Export in the bar.
- The extension reads the checked alerts, with their options and feed links.
- Copy the CSV text to the clipboard, or download it as a file.
- Import the file, or paste the text, in the Add dialog of another account.

Delete
- Check alerts on the page. Use the check-all box to check all of them. Click Delete in the bar.
- Confirm in a dialog that names the count. Deletion is permanent.
- Use Export first to keep a copy of your alerts.

Important
- The extension drives the Google Alerts page. If Google changes the page, the extension stops and shows a clear message.
- Google can slow or check large batches. The extension stops at a bot check and asks you to solve it. It never bypasses a check.
- Keep the Alerts tab open and in the foreground during a run.
- All data stays in your browser. No server, no account, no analytics.

## Category

Productivity

## Permission justifications

| Permission | Justification |
|---|---|
| `https://www.google.com/alerts*` | The content script reads the alert list and operates the create and delete controls on the Google Alerts page. No other site is accessed. |
| `storage` | Keeps the settings and the current run state in the browser so an interrupted run can resume. |

The extension has no `tabs`, `activeTab`, or `sidePanel` permission. It declares `app.html` and one icon as web-accessible resources for `https://www.google.com/*`. The Alerts page shows the extension dialog in a frame with `app.html`. The content script runs only on `https://www.google.com/alerts*`. A narrower pattern for the resources breaks the frame, because Chrome checks only the origin.

## Data usage disclosures

- Collects no user data. Sends no data off the device.
- Does not sell data. Does not use data for unrelated purposes.
- Remote code: none.

## Privacy policy URL

https://github.com/kraigochieng/bulk-google-alerts-manager/blob/main/docs/privacy-policy.md

## Screenshots (1280x800)

The files are in `docs/store-assets/`. They show the extension next to the Alerts page.

| File | Shows |
|---|---|
| `1-review-step.png` | Review step: CSV rows with checkboxes and similar-alert warnings. |
| `2-bar-with-checked-alerts.png` | The bar at the bottom of the page with three alerts checked, and the heading with the remaining count. |
| `3-start-step.png` | The start step with the notice and the Start button. |
| `4-delete-confirmation.png` | Delete with a confirmation dialog that names the alerts. |
| `5-columns-step.png` | The columns step, with the step labels and the progress bar. |

Limit: the author made these files on a logged-out Alerts page. A script added the sample alert rows to the page. The extension dialogs and the bar are real. **Owner.** The store asks for screenshots that show the real product. Replace files 1, 2, and 4 with captures from a signed-in account before you submit. Use test queries.

## Promo tiles

| File | Size | Use |
|---|---|---|
| `promo-tile-small-440x280.png` | 440x280 | Small promo tile |
| `promo-tile-marquee-1400x560.png` | 1400x560 | Marquee promo tile |

Both files are 24-bit PNG files with no alpha channel. The marquee tile uses `1-review-step.png`. Rebuild the marquee tile if you replace that screenshot.

## Package

Run `npm run package`. It builds the extension and writes `bulk-google-alerts-manager.zip`. Upload that file in the developer dashboard.
