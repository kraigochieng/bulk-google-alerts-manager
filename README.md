# Bulk Alerts Manager for Google Alerts

[![Chrome Web Store version](https://img.shields.io/chrome-web-store/v/pefmadnpngpopdobegahkffofikicakn)](https://chromewebstore.google.com/detail/bulk-alerts-manager-for-g/pefmadnpngpopdobegahkffofikicakn)
[![CI](https://github.com/kraigochieng/bulk-google-alerts-manager/actions/workflows/ci.yml/badge.svg)](https://github.com/kraigochieng/bulk-google-alerts-manager/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/github/license/kraigochieng/bulk-google-alerts-manager)](LICENSE)

**[Install from the Chrome Web Store](https://chromewebstore.google.com/detail/bulk-alerts-manager-for-g/pefmadnpngpopdobegahkffofikicakn)**

Bulk Alerts Manager for Google Alerts is an unofficial Chrome extension. It is not affiliated with Google.
It adds, exports, and deletes many Google Alerts at once, in your own logged-in browser.

Google Alerts has no API and no bulk tools. This extension drives the Alerts page for you.

## What it does

| Action | What happens |
|---|---|
| Add | Reads a CSV file. Creates a new alert for each row. Updates an alert when the query already exists. |
| Export | Reads the alerts that you check on the page. The result dialog lets you copy the CSV text to the clipboard or download it as a file. |
| Delete | Deletes the alerts that you check on the page. A dialog asks you to confirm. |

## How to use it

1. Open `https://www.google.com/alerts` and sign in.
2. Look at the bar at the bottom of the page. It holds a check-all box, the count of checked alerts, and the buttons Clear, Export, Delete, and Add.
3. The heading of the list shows the alerts that you have and the alerts that you can still add. Example: `My alerts (4 created, 996 remaining)`.
4. To add alerts, click Add in the bar, or click the extension icon. Follow the three steps:
   1. **File.** Click "Download template" for the start file. It has the sheet `Alerts` (fill in your rows here) and a hidden `Lists`. The dropdowns suggest the Google values, and you can still type another value. The import reads only the `Alerts` sheet. Choose the filled template, or a CSV file with the same column names. The file needs a `Search query` column and at most 1000 data rows. A column that is not in the template is ignored, and a warning shows.
   2. **Review.** Open "Blank cells use" to set the options for empty cells. Each row shows the final value of its options. A value from the defaults shows in italic text. Click Edit on a row to fix its search query or its options. Click Delete to remove a row from the import. Check the rows that you want. A row with a problem cannot be checked. Search, filter, and sort the rows.
   3. **Start.** Read the notice. Click Start. The click accepts the notice.
5. To export or delete, check alerts on the page. Click Export or Delete in the bar. After an export, click "Copy to clipboard" or "Download CSV" in the result dialog. To import a copy, choose the downloaded CSV file in step 1 of the Add dialog.
6. A loader covers the page while a run works. You can pause, resume, or cancel. A dialog shows the result when the run ends.

## Features

- Map any CSV column to a field. Check the rows that you want.
- All six alert options: deliver to (RSS or email), how often, sources, language, region, how many.
  A CSV column overrides the default for its row.
- A row with the same query as an existing alert updates that alert. The review step warns about alerts that have the same words or look alike. For each such row, skip it or create it anyway.
- The review step stops you when a run would pass the limit of 1000 alerts for each account.
- A run that was interrupted comes back as paused.
- The tool never bypasses a bot check. It stops and asks you to solve the check.

## Limits

- Unofficial. Google can change the page at any time. The extension then shows
  "Google's page layout changed, update the extension." and stops.
- It works for the one Google account that is signed in to the browser profile.
- Keep the Alerts tab open and in the foreground during a run.
- Deletion is permanent. The extension cannot undo it. Use Export first to keep a copy.
- A run does its rows one after the other with no wait. On a large batch Google can show a bot check. The run then stops and asks you to solve it.
- The extension needs Chrome 120 or later.

## Privacy

All data stays in your browser. The extension has no server, no analytics, and no account.
It reads and stores no password. See [docs/privacy-policy.md](docs/privacy-policy.md).

## Install from source

1. Run `npm ci`.
2. Run `npm run build`.
3. Open `chrome://extensions` and turn on developer mode.
4. Choose "Load unpacked" and select the `dist` folder.
5. Open `https://www.google.com/alerts`. Expect the bar at the bottom of the page.

## CSV format

The Add dialog reads a header row and the data rows. The column names must match the template. One column holds the queries. Other columns are optional.
The columns follow the order of the options panel on the Google Alerts page.

| Column | Allowed values |
|---|---|
| `Search query` | The search text. Quotes and `OR` work as in Google Alerts. |
| `How often` | `As-it-happens`, `At most once a day`, or `At most once a week`. An RSS alert always uses `As-it-happens`. |
| `Sources`, `Language`, `Region` | The text of the Google dropdown, for example `English` |
| `How many` | `All results` or `Only the best results` |
| `Deliver to` | `RSS feed` or `Email` |

An empty cell uses the default from the Add dialog.

```csv
Search query,How often,Language,Region,How many,Deliver to
"""Jane Doe"" OR ""Jane A. Doe""",,,,All results,RSS feed
solar power kenya,At most once a week,English,Any Region,Only the best results,Email
```

See `fixtures/sample-queries.csv` for a larger example.

## Troubleshooting

| Problem | Action |
|---|---|
| The bar does not show. | Reload the Alerts page. Check that the extension is on in `chrome://extensions`. |
| "Google's page layout changed, update the extension." | Google changed the page. Update the extension. Open an issue if no update exists. |
| A run stops and asks for a bot check. | Solve the check in the Alerts tab. Click "I solved it, continue". |
| A run paused when you switched tab. | Go back to the Alerts tab. Click Resume. |
| Heading shows no remaining count. | The heading text did not match `My alerts (N)`. Open an issue. |

## Development

- `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`.
- `npm run package` builds the extension and writes `bulk-google-alerts-manager.zip`.
- All page selectors and timing constants are in `src/content/selectors.ts`. A layout change is a fix in that file.
- Notes on the page driver: [docs/spike-findings.md](docs/spike-findings.md).
- Manual test steps: [docs/manual-test-checklist.md](docs/manual-test-checklist.md).
- Steps to publish: [docs/release-checklist.md](docs/release-checklist.md).

## License

[MIT](LICENSE). Copyright (c) 2026 Kraig Ochieng. The Google Sans font files come from `@fontsource-variable/google-sans` under the OFL-1.1.
