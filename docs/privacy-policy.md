# Privacy policy

Bulk Alerts Manager is an unofficial tool. It is not affiliated with Google.

Last updated: 2026-10-20.

## What the extension does with data

- The extension reads the Google Alerts page that you open (`https://www.google.com/alerts`) to list your alerts.
- It creates and deletes alerts on that page when you start a run.
- It reads the CSV files that you choose, in your browser.

## What the extension stores

- Your settings (default alert options, acceptance of the first-run notice).
- The state of the current run: the queries, their options, and their results.

The extension stores this data in your browser with `chrome.storage.local`.
The data stays on your device. You can remove it with "Close results" in the panel or by removing the extension.

## What the extension does not do

- It does not send data to any server. It makes no network call other than the page of Google Alerts that you already use.
- It does not collect analytics or usage data.
- It does not read, store, or send your password or other credentials.
- It does not sell or share data.
- It does not load remote code.

## Permissions

| Permission | Reason |
|---|---|
| Host access to `https://www.google.com/alerts*` | Read the alert list and drive the create and delete controls on that page. |
| `sidePanel` | Show the tool in the Chrome side panel. |
| `storage` | Keep your settings and the current run in your browser. |

## Contact

Open an issue at https://github.com/kraigochieng/bulk-google-alerts-manager/issues.
