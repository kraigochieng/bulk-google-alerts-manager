# Bulk Alerts Manager

Bulk Alerts Manager is an unofficial Chrome extension. It is not affiliated with Google.
It creates and deletes many Google Alerts from CSV files, in your own logged-in browser.

Google Alerts has no API and no bulk tools. This extension drives the Alerts page for you.

## Features

- Bulk create from a CSV file. Map any CSV column to a field. Check the rows you want.
- All six alert options: deliver to (RSS or email), how often, sources, language, region, how many.
  A CSV column overrides the default for its row.
- Warning for exact, same-word, and similar alerts that already exist. Skip a row or create it anyway.
- Alert cap check (1000 alerts for each account).
- Random wait between alerts. The extension sets the wait. It is not a user setting.
- Pause, resume, cancel, and retry of failed rows. A run that was interrupted comes back as paused.
- Result CSV: `query, status, rss_link, error`.
- Bulk delete with a required backup CSV, a list of the alerts to delete, and a typed confirmation (`DELETE <count>`).
  The backup CSV can be imported again in bulk create.
- The tool never bypasses a bot check. It stops and asks you to solve the check.

## Limits

- Unofficial. Google can change the page at any time. The extension then shows
  "Google's page layout changed, update the extension." and stops.
- It works for the one Google account that is signed in to the browser profile.
- Keep the Alerts tab open and in the foreground during a run.
- Deletion is permanent. The extension cannot undo it.
- A random wait lowers the load on the page. It does not guarantee that no bot check appears.

## Privacy

All data stays in your browser. The extension has no server, no analytics, and no account.
It reads and stores no password. See [docs/privacy-policy.md](docs/privacy-policy.md).

## Install from source

1. Run `npm ci`.
2. Run `npm run build`.
3. Open `chrome://extensions` and turn on developer mode.
4. Choose "Load unpacked" and select the `dist` folder.
5. Open `https://www.google.com/alerts`. Click the extension icon to open the side panel.

## CSV format

Bulk create reads a header row and the data rows. One column holds the queries. Other columns are optional.

```csv
query,deliver_to,how_often,how_many,language,region,label
"""Jane Doe"" OR ""Jane A. Doe""",rss,,all,,,people
solar power kenya,email,weekly,best,English,Any Region,energy
```

See `fixtures/sample-queries.csv` for a larger example.
Values for sources, language, and region must match the text in the Google dropdown.

## Development

- `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`.
- All page selectors and timing constants are in `src/content/selectors.ts`. A layout change is a fix in that file.
- Notes on the page driver: [docs/spike-findings.md](docs/spike-findings.md).
- Manual test steps: [docs/manual-test-checklist.md](docs/manual-test-checklist.md).
