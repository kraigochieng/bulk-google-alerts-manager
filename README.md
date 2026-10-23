# Bulk Google Alerts Manager

Bulk Google Alerts Manager is an unofficial Chrome extension. It is not affiliated with Google.
It creates and deletes many Google Alerts from CSV files, in your own logged-in browser.

Google Alerts has no API and no bulk tools. This extension drives the Alerts page for you.

## Features

- Add from a CSV file. Map any CSV column to a field. Check the rows you want.
- All six alert options: deliver to (RSS or email), how often, sources, language, region, how many.
  A CSV column overrides the default for its row.
- A row with the same query as an existing alert updates that alert (upsert). Warning for same-word and similar alerts: skip a row or create it anyway.
- Alert cap check (1000 alerts for each account).
- Pause, resume, and cancel of a run. A run that was interrupted comes back as paused.
- A foggy loader with a progress bar shows while a run works. A dialog shows the result when it ends.
- Export the alerts that you check on the page, with their six options and their feed links, to one CSV file. The file downloads by itself. Use the Export button in the bar. Import the file in the Add dialog of another account.
- Delete the alerts that you check on the page, with the Delete button in the bar and a confirmation dialog that names the count.
  Use Export first to keep a copy. The Add dialog can import that copy again.
- The tool never bypasses a bot check. It stops and asks you to solve the check.

## Limits

- Unofficial. Google can change the page at any time. The extension then shows
  "Google's page layout changed, update the extension." and stops.
- It works for the one Google account that is signed in to the browser profile.
- Keep the Alerts tab open and in the foreground during a run.
- Deletion is permanent. The extension cannot undo it.
- A run does its rows one after the other with no wait. On a large batch Google can show a bot check. The run then stops and asks you to solve it.

## Privacy

All data stays in your browser. The extension has no server, no analytics, and no account.
It reads and stores no password. See [docs/privacy-policy.md](docs/privacy-policy.md).

## Install from source

1. Run `npm ci`.
2. Run `npm run build`.
3. Open `chrome://extensions` and turn on developer mode.
4. Choose "Load unpacked" and select the `dist` folder.
5. Open `https://www.google.com/alerts`. Expect a bar at the bottom of the page when the list has alerts. Click Add alerts in the bar, or click the extension icon, to open the Add dialog.

## CSV format

The Add dialog reads a header row and the data rows. One column holds the queries. Other columns are optional.

```csv
query,deliver_to,how_often,how_many,language,region
"""Jane Doe"" OR ""Jane A. Doe""",rss,,all,,
solar power kenya,email,weekly,best,English,Any Region
```

See `fixtures/sample-queries.csv` for a larger example.
Values for sources, language, and region must match the text in the Google dropdown.

## Development

- `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`.
- All page selectors and timing constants are in `src/content/selectors.ts`. A layout change is a fix in that file.
- Notes on the page driver: [docs/spike-findings.md](docs/spike-findings.md).
- Manual test steps: [docs/manual-test-checklist.md](docs/manual-test-checklist.md).

## License

[MIT](LICENSE). Copyright (c) 2026 Kraig Ochieng. The Google Sans font files come from `@fontsource-variable/google-sans` under the OFL-1.1.
