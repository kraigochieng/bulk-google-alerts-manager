# Manual test checklist

Use throwaway queries that start with `bam test`. Use your own account.

1. Build with `npm run build`. Load `dist` in `chrome://extensions` (developer mode, unpacked).
2. Open `https://www.google.com/alerts`. Click the extension icon. The side panel opens.
3. Accept the first-run screen.
4. Add: import `fixtures/sample-queries.csv`, map the columns, check 5 rows, start. Expect the foggy loader, then a dialog with Created: 5. Press OK.
5. Add the same file again: expect 5 updated rows and no new alert. Change `how_often` in one row first and expect that alert to change.
6. Pause, resume, and cancel in a second run. Expect finished rows to stay.
7. Close the panel during a run, reopen, and resume. Expect no repeated creates.
8. Export: click Start export and wait. Expect the foggy loader, a dialog, and a downloaded CSV with one row per alert, all six options, and the feed link. Import it in Add and expect no warnings.
9. Delete: read the list, select the 5 alerts, click Delete and confirm in the dialog. Expect the foggy loader, then a dialog with Deleted: 5.
10. With 11 or more alerts: read the list. Expect all alerts, not only 10.
11. Layout change check: rename a selector in `src/content/selectors.ts`, rebuild, run. Expect the message "Google's page layout changed, update the extension."
12. Hidden tab: switch tab during a run. Expect a pause notice.
