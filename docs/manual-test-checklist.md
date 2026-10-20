# Manual test checklist

Use throwaway queries that start with `bam test`. Use your own account.

1. Build with `npm run build`. Load `dist` in `chrome://extensions` (developer mode, unpacked).
2. Open `https://www.google.com/alerts`. Click the extension icon. The side panel opens.
3. Accept the first-run screen.
4. Create: import `fixtures/sample-queries.csv`, map the columns, check 5 rows, start. Expect 5 created rows, RSS links, and a result CSV.
5. Pause, resume, and cancel in a second run. Expect finished rows to stay.
6. Close the tab during a run, reopen, and resume. Expect no repeated creates.
7. Delete: read the list, export the backup, select the 5 alerts, type `DELETE 5`. Expect 5 deleted rows and a result CSV.
8. With 11 or more alerts: read the list. Expect all alerts, not only 10.
9. Layout change check: rename a selector in `src/content/selectors.ts`, rebuild, run. Expect the message "Google's page layout changed, update the extension."
10. Hidden tab: switch tab during a run. Expect a pause notice.
