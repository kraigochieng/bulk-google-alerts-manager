# Manual test checklist

Use throwaway queries that start with `bam test`. Use your own account.

1. Build with `npm run build`. Load `dist` in `chrome://extensions` (developer mode, unpacked).
2. Open `https://www.google.com/alerts`. Expect no element at the page edge. Expect a bar at the bottom of the page. Click the extension icon, or click Add in the bar. The Add dialog opens. Click Close. Scroll and click on the Google page and expect them to work.
3. Click Delete or Export in the bar before you accept the notice. Expect the first-run dialog. Accept it.
4. Add: import `fixtures/sample-queries.csv`. Expect the four steps (file, columns, review, start) with Back and Next. Check 5 rows and click Start. Expect the foggy loader, then a dialog with Created: 5. Press OK.
5. Add the same file again: expect 5 updated rows and no new alert. Change `how_often` in one row first and expect that alert to change.
6. Pause, resume, and cancel in a second run. Expect finished rows to stay.
7. Reload the page during a run. Open the Add dialog and resume. Expect no repeated creates.
8. Export: check 3 rows on the page. Expect the bar at the bottom of the page to show 3 selected. Click Export in the bar and wait. Expect the foggy loader, a dialog, and a downloaded CSV with one row per checked alert, all six options, and the feed link. Import it in Add and expect no warnings.
9. Delete: use the check-all box in the bar. Click Delete and confirm in the dialog. Expect the foggy loader, then a dialog with Deleted: 5.
10. With 11 or more alerts: click Show all alerts, then use check-all. Expect the count of all alerts. Expect the checkboxes to stay after you edit one alert.
11. Layout change check: rename a selector in `src/content/selectors.ts`, rebuild, run. Expect the message "Google's page layout changed, update the extension."
12. Checkbox position: expect each row to show a checkbox at its left edge. Check two rows that have the same query, if you have them. Expect both rows to check together.
13. Hidden tab: switch tab during a run. Expect a pause notice.
