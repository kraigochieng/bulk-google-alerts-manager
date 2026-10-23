# Chrome Web Store listing

## Name

Bulk Google Alerts Manager

## Short description (132 characters or fewer)

Unofficial tool. Not affiliated with Google. Create and delete many alerts from CSV files.

## Single purpose

Manage Google Alerts in bulk: create alerts from a CSV file and delete alerts in bulk, on the Google Alerts page.

## Long description

Bulk Google Alerts Manager is an unofficial tool. It is not affiliated with Google.

Google Alerts has no bulk tools. Creating or removing many alerts by hand takes minutes for each alert.
This extension does both from a CSV file, in your own logged-in browser tab.

Add
- Import a CSV file and map its columns to the alert fields.
- Check the rows that you want.
- Set all alert options: RSS or email, how often, sources, language, region, how many.
- A row with the same query as an existing alert updates that alert. See warnings for alerts that look alike.
- See the alert limit (1000 alerts for each account) before you start.
- Pause, resume, and cancel of a run.
- A dialog shows the result when a run ends.

Export
- Write all alerts with their options and feed links to one CSV file. It downloads by itself.
- Import the file in the Add dialog of another account.

Delete
- See all your alerts with search, filter, and checkboxes.
- Use Export first to keep a copy of your alerts.
- Confirm in a dialog that names the count. Deletion is permanent.

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

## Data usage disclosures

- Collects no user data. Sends no data off the device.
- Does not sell data. Does not use data for unrelated purposes.
- Remote code: none.

## Privacy policy URL

https://github.com/kraigochieng/bulk-google-alerts-manager/blob/main/docs/privacy-policy.md

## Screenshots (1280x800) — owner action

Take these from the loaded extension next to the real Alerts page. Do not show personal alert queries.

1. Review step: CSV rows with checkboxes, similar-alert warnings, and the notice.
2. A create run in progress with the progress bar and result table.
3. Delete with a confirmation dialog.

## Package

Run `npm run package`. It builds the extension and writes `bulk-google-alerts-manager.zip`. Upload that file in the developer dashboard.
